import type { jsPDF as JsPDF } from 'jspdf'

const PAGE_MARGIN = 18
const PAGE_HEIGHT = 297
const LINE_HEIGHT = 6

// jsPDF (~130kB gzipped) is only needed when a user actually exports a PDF,
// so it's loaded on demand instead of bundled into the initial app chunk.
async function newDoc(title: string): Promise<JsPDF> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setProperties({ title })
  return doc
}

function drawHeader(doc: JsPDF, title: string, subtitle: string) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(31, 92, 82) // primary teal
  doc.text('ConformiCrèche', PAGE_MARGIN, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(title, PAGE_MARGIN, 27)

  doc.setDrawColor(220, 220, 220)
  doc.line(PAGE_MARGIN, 32, 210 - PAGE_MARGIN, 32)

  doc.setFontSize(9)
  doc.text(subtitle, PAGE_MARGIN, 38)

  return 46
}

function ensureSpace(doc: JsPDF, y: number, needed = LINE_HEIGHT): number {
  if (y + needed > PAGE_HEIGHT - PAGE_MARGIN) {
    doc.addPage()
    return PAGE_MARGIN
  }
  return y
}

function wrapAndWrite(doc: JsPDF, text: string, x: number, y: number, maxWidth: number): number {
  const lines = doc.splitTextToSize(text, maxWidth)
  for (const line of lines) {
    y = ensureSpace(doc, y)
    doc.text(line, x, y)
    y += LINE_HEIGHT
  }
  return y
}

export interface DiagnosticPdfItem {
  category: string
  text: string
  answerLabel: string
  isCompliant: boolean
  remediation?: string
}

export interface DiagnosticPdfInput {
  fullName?: string
  score: number
  completedAt: Date
  items: DiagnosticPdfItem[]
}

export async function exportDiagnosticReportPdf(input: DiagnosticPdfInput) {
  const doc = await newDoc('Rapport de diagnostic de conformité')
  let y = drawHeader(
    doc,
    'Rapport de diagnostic de conformité',
    `${input.fullName ?? 'Structure'} — généré le ${input.completedAt.toLocaleDateString()}`
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(20, 20, 20)
  const scorePct = Math.round(input.score * 100)
  doc.text(`Score de conformité : ${scorePct}%`, PAGE_MARGIN, y)
  y += 10

  const maxWidth = 210 - PAGE_MARGIN * 2

  input.items.forEach((item, index) => {
    y = ensureSpace(doc, y, LINE_HEIGHT * 3)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(item.isCompliant ? 47 : 168, item.isCompliant ? 122 : 59, item.isCompliant ? 82 : 44)
    y = wrapAndWrite(doc, `${index + 1}. [${item.category}] ${item.isCompliant ? 'Conforme' : 'Non conforme'}`, PAGE_MARGIN, y, maxWidth)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    y = wrapAndWrite(doc, item.text, PAGE_MARGIN, y, maxWidth)

    doc.setFont('helvetica', 'italic')
    doc.setTextColor(110, 110, 110)
    y = wrapAndWrite(doc, `Réponse : ${item.answerLabel}`, PAGE_MARGIN, y, maxWidth)

    if (!item.isCompliant && item.remediation) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(168, 59, 44)
      y = wrapAndWrite(doc, `Recommandation : ${item.remediation}`, PAGE_MARGIN, y, maxWidth)
    }
    y += 4
  })

  doc.save(`diagnostic-conformicreche-${input.completedAt.toISOString().slice(0, 10)}.pdf`)
}

export interface VaultPdfDocument {
  title: string
  category: string
  status: string
  expiryDate?: string
  createdAt: string
}

export interface VaultPdfInput {
  fullName?: string
  generatedAt: Date
  documents: VaultPdfDocument[]
}

export async function exportComplianceVaultPdf(input: VaultPdfInput) {
  const doc = await newDoc('Dossier de conformité')
  let y = drawHeader(
    doc,
    'Dossier de conformité — coffre-fort documentaire',
    `${input.fullName ?? 'Structure'} — généré le ${input.generatedAt.toLocaleDateString()}`
  )

  const maxWidth = 210 - PAGE_MARGIN * 2

  if (input.documents.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(110, 110, 110)
    doc.text('Aucun document dans le coffre-fort.', PAGE_MARGIN, y)
  }

  input.documents.forEach((document, index) => {
    y = ensureSpace(doc, y, LINE_HEIGHT * 3)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    y = wrapAndWrite(doc, `${index + 1}. ${document.title}`, PAGE_MARGIN, y, maxWidth)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(90, 90, 90)
    const expiry = document.expiryDate ? ` — échéance ${new Date(document.expiryDate).toLocaleDateString()}` : ''
    y = wrapAndWrite(
      doc,
      `Catégorie : ${document.category} — Statut : ${document.status === 'valid' ? 'Conforme' : 'En attente'} — Ajouté le ${new Date(document.createdAt).toLocaleDateString()}${expiry}`,
      PAGE_MARGIN,
      y,
      maxWidth
    )
    y += 3
  })

  doc.save(`dossier-conformite-${input.generatedAt.toISOString().slice(0, 10)}.pdf`)
}
