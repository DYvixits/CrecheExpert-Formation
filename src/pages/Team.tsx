import { useState } from 'react'
import { Page, PageHeader, PageTitle, PageDescription, PageBody, DataTable, Card, CardContent, CardHeader, CardTitle, Badge, Button, Persona, EmptyState, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, toast, StatGroup, Stat } from '@blinkdotnew/ui'
import { Users, Plus, GraduationCap, ShieldCheck, Mail, Phone, Trash2, Edit2, AlertCircle } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { type ColumnDef } from '@tanstack/react-table'
import { useAuth, UserProfile } from '../hooks/useAuth'

export default function TeamPage() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [newMember, setNewMember] = useState({ fullName: '', role: 'professional', email: '' })

  const { data: team, isLoading } = useQuery({
    queryKey: ['team_members', profile?.structureId],
    queryFn: () => blink.db.user_profiles.list({
      where: { structureId: profile?.structureId || 'none' },
      orderBy: { fullName: 'asc' }
    }) as unknown as UserProfile[],
    enabled: !!profile?.structureId
  })

  const columns: ColumnDef<UserProfile>[] = [
    {
      accessorKey: 'fullName',
      header: 'Membre',
      cell: ({ row }) => (
        <Persona
          name={row.original.fullName}
          subtitle={row.original.role === 'manager' ? 'Gestionnaire' : 'Professionnel'}
          className="font-bold text-base"
        />
      )
    },
    {
      accessorKey: 'role',
      header: 'Rôle',
      cell: ({ row }) => (
        <Badge variant="outline" className={`uppercase tracking-widest text-[10px] font-bold ${row.original.role === 'manager' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-primary/5 text-primary/70 border-primary/10'}`}>
          {row.original.role === 'manager' ? 'MANAGER' : 'STAFF'}
        </Badge>
      )
    },
    {
      accessorKey: 'diploma',
      header: 'Dernier Diplôme',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.diploma || 'Non renseigné'}</span>
    },
    {
      id: 'compliance',
      header: 'Conformité 2026',
      cell: () => (
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-tight">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Validé</span>
        </div>
      )
    },
    {
      id: 'actions',
      cell: () => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground/60 hover:text-primary hover:bg-primary/5">
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  const handleAddMember = async () => {
    if (!newMember.fullName || !newMember.role) return
    try {
      await blink.db.user_profiles.upsert({
        userId: `temp_${Date.now()}`,
        role: newMember.role,
        fullName: newMember.fullName,
        structureId: profile?.structureId || 'none',
      })
      toast.success('Membre ajouté à votre structure')
      setIsAdding(false)
      setNewMember({ fullName: '', role: 'professional', email: '' })
      queryClient.invalidateQueries({ queryKey: ['team_members'] })
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Erreur lors de l\'ajout')
    }
  }

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <div className="flex flex-col gap-1">
          <PageTitle>Gestion d'équipe</PageTitle>
          <PageDescription>
            Suivez les habilitations, diplômes et certifications de vos collaborateurs.
          </PageDescription>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Inviter un salarié
          </Button>
        </div>
      </PageHeader>

      <PageBody className="space-y-6">
        <StatGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Stat label="Total Salariés" value={team?.length.toString() || '0'} icon={<Users className="text-primary/60" />} />
          <Stat label="Formations 2026" value="85%" trend={15.4} trendLabel="taux de réussite" icon={<GraduationCap className="text-emerald-500/60" />} />
          <Stat label="Recyclages Urgents" value="1" icon={<AlertCircle className="text-amber-500/60" />} />
        </StatGroup>

        {team && team.length > 0 ? (
          <div className="rounded-2xl border border-border/60 overflow-hidden shadow-sm bg-white">
            <DataTable
              columns={columns}
              data={team}
              loading={isLoading}
              className="border-none"
            />
          </div>
        ) : !isLoading ? (
          <EmptyState
            icon={<Users />}
            title="Aucun membre dans votre équipe"
            description="Invitez vos collaborateurs pour centraliser leurs certifications et suivre leur conformité."
            action={{ label: "Ajouter un membre", onClick: () => setIsAdding(true) }}
          />
        ) : (
          <div className="py-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent className="sm:max-w-[425px] rounded-3xl p-8 shadow-2xl border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">Ajouter un Membre</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Rattachez un collaborateur à votre structure.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Nom complet</Label>
                <Input
                  id="name"
                  placeholder="ex: Jean Valjean"
                  value={newMember.fullName}
                  onChange={(e) => setNewMember(prev => ({ ...prev, fullName: e.target.value }))}
                  className="rounded-xl h-12 focus:ring-primary/20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Rôle au sein de l'équipe</Label>
                <Select value={newMember.role} onValueChange={(v) => setNewMember(prev => ({ ...prev, role: v }))}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Choisir un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Personnel Qualifié (40%)</SelectItem>
                    <SelectItem value="staff">Personnel Complémentaire</SelectItem>
                    <SelectItem value="manager">Adjoint de Direction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddMember} className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 font-bold">
                Ajouter à l'équipe
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageBody>
    </Page>
  )
}
