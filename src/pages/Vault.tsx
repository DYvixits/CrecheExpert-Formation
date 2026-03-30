import { useState } from 'react'
import { Page, PageHeader, PageTitle, PageDescription, PageBody, DataTable, Card, CardContent, CardHeader, CardTitle, Badge, Button, EmptyState, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, toast, Stat } from '@blinkdotnew/ui'
import { ShieldCheck, FileText, Upload, Plus, AlertCircle, Clock, CheckCircle2, FileUp, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { type ColumnDef } from '@tanstack/react-table'
import { useAuth } from '../hooks/useAuth'

interface ComplianceDoc {
  id: string
  title: string
  category: string
  status: string
  expiryDate?: string
  fileUrl: string
  createdAt: string
}

export default function VaultPage() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [newDoc, setNewDoc] = useState({ title: '', category: 'attestation', file: null as File | null })
  const [uploading, setUploading] = useState(false)

  const { data: docs, isLoading } = useQuery({
    queryKey: ['compliance_documents', user?.id],
    queryFn: () => blink.db.compliance_documents.list({ where: { userId: user?.id }, orderBy: { createdAt: 'desc' } }) as unknown as ComplianceDoc[],
    enabled: !!user?.id
  })

  const handleUpload = async () => {
    if (!user || !newDoc.file || !newDoc.title) return
    setUploading(true)
    try {
      const fileName = `compliance/${user.id}/${Date.now()}_${newDoc.file.name}`
      const { publicUrl } = await blink.storage.upload(newDoc.file, fileName)

      await blink.db.compliance_documents.create({
        id: `doc_${Date.now()}`,
        userId: user.id,
        structureId: profile?.structureId || 'none',
        title: newDoc.title,
        category: newDoc.category,
        fileUrl: publicUrl,
        status: 'valid',
        createdAt: new Date().toISOString()
      })

      toast.success('Document ajouté avec succès')
      setIsAdding(false)
      setNewDoc({ title: '', category: 'attestation', file: null })
      queryClient.invalidateQueries({ queryKey: ['compliance_documents'] })
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const columns: ColumnDef<ComplianceDoc>[] = [
    {
      accessorKey: 'title',
      header: 'Document',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
            <FileText className="w-5 h-5 text-primary/70" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base">{row.original.title}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">{row.original.category}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'valid' ? 'default' : 'secondary'} className={row.original.status === 'valid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20' : ''}>
          {row.original.status === 'valid' ? 'Conforme' : 'En attente'}
        </Badge>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Date d\'ajout',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.open(row.original.fileUrl, '_blank')} className="text-primary hover:bg-primary/5 font-bold">
            Consulter
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive/60 hover:text-destructive hover:bg-destructive/5">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <div className="flex flex-col gap-1">
          <PageTitle>Coffre-fort Conformité</PageTitle>
          <PageDescription>
            Centralisez vos preuves, diplômes et attestations pour vos audits PMI 2026.
          </PageDescription>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une preuve
          </Button>
        </div>
      </PageHeader>

      <PageBody className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Stat
            label="Documents valides"
            value={docs?.length.toString() || '0'}
            icon={<CheckCircle2 className="text-emerald-500" />}
            className="bg-emerald-50/30 border-emerald-100 shadow-sm"
          />
          <Stat
            label="Échéances proches"
            value="0"
            icon={<Clock className="text-amber-500" />}
            className="bg-amber-50/30 border-amber-100 shadow-sm"
          />
          <Stat
            label="Niveau de Preuve"
            value="Intermédiaire"
            icon={<ShieldCheck className="text-primary" />}
            className="bg-primary/5 border-primary/10 shadow-sm"
          />
        </div>

        {docs && docs.length > 0 ? (
          <div className="rounded-2xl border border-border/60 overflow-hidden shadow-sm bg-white">
            <DataTable
              columns={columns}
              data={docs}
              loading={isLoading}
              className="border-none"
            />
          </div>
        ) : !isLoading ? (
          <EmptyState
            icon={<ShieldCheck />}
            title="Votre coffre-fort est vide"
            description="Commencez par ajouter vos attestations de secourisme ou vos diplômes pour constituer votre dossier conformité."
            action={{ label: "Ajouter un document", onClick: () => setIsAdding(true) }}
          />
        ) : (
          <div className="py-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent className="sm:max-w-[425px] rounded-3xl p-8 shadow-2xl border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">Nouvelle Preuve</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Importez un document (PDF, JPG, PNG) pour votre dossier.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Titre du document</Label>
                <Input
                  id="title"
                  placeholder="ex: Diplôme EJE - Marie Dupont"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc(prev => ({ ...prev, title: e.target.value }))}
                  className="rounded-xl h-12 focus:ring-primary/20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Catégorie</Label>
                <Select value={newDoc.category} onValueChange={(v) => setNewDoc(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attestation">Attestation de formation</SelectItem>
                    <SelectItem value="diploma">Diplôme d'État</SelectItem>
                    <SelectItem value="secourisme">Secourisme PSC1</SelectItem>
                    <SelectItem value="reglementaire">Réglementation structure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Fichier</Label>
                <div className="relative h-32 rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-colors cursor-pointer bg-muted/20 group">
                  <Input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setNewDoc(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  />
                  {newDoc.file ? (
                    <div className="flex items-center gap-2 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm truncate max-w-[200px]">{newDoc.file.name}</span>
                    </div>
                  ) : (
                    <>
                      <FileUp className="w-8 h-8 text-muted-foreground/40 group-hover:text-primary/40 transition-colors" />
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Cliquez pour importer</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl h-12">Annuler</Button>
              <Button onClick={handleUpload} disabled={uploading || !newDoc.file || !newDoc.title} className="rounded-xl h-12 bg-primary hover:bg-primary/90 min-w-[120px]">
                {uploading ? 'Envoi...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageBody>
    </Page>
  )
}
