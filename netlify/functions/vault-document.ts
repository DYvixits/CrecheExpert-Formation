import type { Handler, HandlerEvent } from '@netlify/functions'
import { createClient } from '@blinkdotnew/sdk'
import { hasPermission, type UserRole } from '../../src/lib/rbac'

const PROJECT_ID = process.env.BLINK_PROJECT_ID || process.env.VITE_BLINK_PROJECT_ID
const SECRET_KEY = process.env.BLINK_SECRET_KEY

interface ComplianceDocumentRow {
  id: string
  userId: string
  structureId?: string
  title: string
  filePath?: string
  fileUrl?: string
}

interface CallerProfileRow {
  userId: string
  role: UserRole
  structureId?: string
}

function getAuthHeader(event: HandlerEvent): string | null {
  const headers = event.headers || {}
  return headers.authorization ?? headers.Authorization ?? null
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\r\n"]/g, '').slice(0, 150) || 'document'
}

/**
 * Authenticated proxy for compliance-vault documents.
 *
 * Blink storage has no concept of private files or signed URLs — `blink.storage.upload()`
 * always returns a permanent, unauthenticated public CDN URL (verified against the SDK's
 * type definitions, v2.4.0 and v2.10.1 alike). This function is the actual privacy boundary:
 * the browser is never given that raw storage URL. It only ever gets a document `id`, and
 * this function checks server-side (via Blink's privileged `secretKey`, bypassing the
 * client-side-only RBAC the rest of this app relies on) that the caller owns the document or
 * manages its structure, before streaming the bytes back.
 *
 * Residual risk: the underlying Blink CDN URL itself remains unauthenticated forever — this
 * narrows exposure to "only reachable through an authorized request to this function", it does
 * not make Blink's storage layer private at the infrastructure level (that capability does not
 * exist on this platform).
 *
 * Known limits:
 * - Netlify's synchronous functions cap the response body around 6MB; larger scanned documents
 *   will fail with a 502 here and need a streaming (Edge Function) rewrite.
 * - Requires `BLINK_SECRET_KEY` (and `BLINK_PROJECT_ID`) set as Netlify environment variables —
 *   never commit the secret key. Generate it from the Blink project dashboard.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  if (!PROJECT_ID || !SECRET_KEY) {
    return { statusCode: 500, body: 'Server misconfigured: BLINK_PROJECT_ID/BLINK_SECRET_KEY not set' }
  }

  const docId = event.queryStringParameters?.id
  if (!docId) {
    return { statusCode: 400, body: 'Missing "id" query parameter' }
  }

  const blink = createClient({ projectId: PROJECT_ID, secretKey: SECRET_KEY })

  const introspection = await blink.auth.verifyToken(getAuthHeader(event))
  if (!introspection.valid || !introspection.userId) {
    return { statusCode: 401, body: introspection.error || 'Invalid or expired session' }
  }

  const [documents, callerProfiles] = await Promise.all([
    blink.db.compliance_documents.list({ where: { id: docId }, limit: 1 }) as Promise<ComplianceDocumentRow[]>,
    blink.db.user_profiles.list({ where: { userId: introspection.userId }, limit: 1 }) as Promise<CallerProfileRow[]>,
  ])

  const document = documents[0]
  if (!document) {
    return { statusCode: 404, body: 'Document not found' }
  }

  const caller = callerProfiles[0]
  const isOwner = document.userId === introspection.userId
  const managesStructure =
    !!caller &&
    !!document.structureId &&
    document.structureId === caller.structureId &&
    hasPermission(caller.role, 'vault:view_all')

  if (!isOwner && !managesStructure) {
    return { statusCode: 403, body: 'Forbidden' }
  }

  if (event.httpMethod === 'DELETE') {
    const canDelete = isOwner || (managesStructure && hasPermission(caller!.role, 'vault:delete'))
    if (!canDelete) {
      return { statusCode: 403, body: 'Forbidden' }
    }

    if (document.filePath) {
      try {
        await blink.storage.remove(document.filePath)
      } catch (error) {
        console.error('Failed to remove storage object for', document.id, error)
      }
    }
    await blink.db.compliance_documents.delete(document.id)
    return { statusCode: 204, body: '' }
  }

  let sourceUrl = document.fileUrl
  if (document.filePath) {
    const download = await blink.storage.download(document.filePath)
    sourceUrl = download.downloadUrl
  }

  if (!sourceUrl) {
    return { statusCode: 404, body: 'File missing from storage' }
  }

  const fileResponse = await fetch(sourceUrl)
  if (!fileResponse.ok) {
    return { statusCode: 502, body: 'Unable to retrieve the stored file' }
  }

  const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream'
  const buffer = Buffer.from(await fileResponse.arrayBuffer())

  return {
    statusCode: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `inline; filename="${sanitizeFilename(document.title)}"`,
    },
    body: buffer.toString('base64'),
    isBase64Encoded: true,
  }
}
