import { blink } from '../blink/client'

function authHeaders(): HeadersInit {
  const token = blink.auth.getToken()
  if (!token) throw new Error('Session expirée, veuillez vous reconnecter.')
  return { Authorization: `Bearer ${token}` }
}

async function errorMessageFor(response: Response): Promise<string> {
  if (response.status === 401) return 'Session expirée, veuillez vous reconnecter.'
  if (response.status === 403) return "Vous n'avez pas accès à ce document."
  if (response.status === 404) return 'Document introuvable.'
  return "Impossible d'accéder au document."
}

/**
 * Opens a vault document through the authenticated `vault-document` Netlify function
 * instead of the raw Blink storage URL, which is permanent and unauthenticated by design
 * (see netlify/functions/vault-document.ts for why).
 */
export async function openVaultDocument(documentId: string): Promise<void> {
  const response = await fetch(`/.netlify/functions/vault-document?id=${encodeURIComponent(documentId)}`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error(await errorMessageFor(response))
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  window.open(blobUrl, '_blank')
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
}

export async function deleteVaultDocument(documentId: string): Promise<void> {
  const response = await fetch(`/.netlify/functions/vault-document?id=${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  if (!response.ok && response.status !== 204) {
    throw new Error(await errorMessageFor(response))
  }
}
