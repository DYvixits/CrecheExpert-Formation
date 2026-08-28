import { useState } from 'react'
import { Page, PageHeader, PageTitle, PageDescription, PageBody, DataTable, Card, CardContent, CardHeader, CardTitle, Badge, Button, Persona, EmptyState, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, toast, StatGroup, Stat } from '@blinkdotnew/ui'
import { Users, Plus, GraduationCap, ShieldCheck, Mail, Phone, Trash2, Edit2, AlertCircle, Clock } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { type ColumnDef } from '@tanstack/react-table'
import { useAuth, UserProfile } from '../hooks/useAuth'
import { ROLE_LABELS, type UserRole } from '../lib/rbac'
import RoleGuard from '../components/RoleGuard'

const INVITABLE_ROLES: UserRole[] = ['professional', 'trainer', 'manager']

interface TeamInvitation {
  id: string
  structureId: string
  email: string
  role: UserRole
  token: string
  status: 'pending' | 'accepted'
  invitedByName?: string
  createdAt: string
}

export default function TeamPage() {
  return (
    <RoleGuard minRole="manager">
      <TeamPageContent />
    </RoleGuard>
  )
}

function TeamPageContent() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [invite, setInvite] = useState<{ email: string; role: UserRole }>({ email: '', role: 'professional' })

  const { data: team, isLoading } = useQuery({
    queryKey: ['team_members', profile?.structureId],
    queryFn: () => blink.db.user_profiles.list({
      where: { structureId: profile?.structureId || 'none' },
      orderBy: { fullName: 'asc' }
    }) as unknown as UserProfile[],
    enabled: !!profile?.structureId
  })

  const { data: invitations, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['team_invitations', profile?.structureId],
    queryFn: () => blink.db.team_invitations.list({
      where: { structureId: profile?.structureId || 'none', status: 'pending' },
      orderBy: { createdAt: 'desc' }
    }) as unknown as TeamInvitation[],
    enabled: !!profile?.structureId
  })

  const columns: ColumnDef<UserProfile>[] = [
    {
      accessorKey: 'fullName',
      header: 'Membre',
      cell: ({ row }) => (
        <Persona
          name={row.original.fullName}
          subtitle={ROLE_LABELS[(row.original.role as UserRole) || 'professional']}
          className="font-bold text-base"
        />
      )
    },
    {
      accessorKey: 'role',
      header: 'Rôle',
      cell: ({ row }) => {
        const role = (row.original.role as UserRole) || 'professional'
        return (
          <Badge variant="outline" className={`uppercase tracking-widest text-[10px] font-bold ${role === 'manager' || role === 'admin' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-primary/5 text-primary/70 border-primary/10'}`}>
            {role}
          </Badge>
        )
      }
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

  const handleInvite = async () => {
    if (!invite.email || !invite.role || !user || !profile?.structureId) return
    setIsSending(true)
    try {
      const token = crypto.randomUUID()
      const acceptUrl = `${window.location.origin}/accept-invite?token=${token}`

      await blink.db.team_invitations.create({
        id: `inv_${Date.now()}`,
        structureId: profile.structureId,
        email: invite.email,
        role: invite.role,
        token,
        status: 'pending',
        invitedByName: profile.fullName,
        createdAt: new Date().toISOString()
      })

      await blink.notifications.email({
        to: invite.email,
        subject: `${profile.fullName || 'Votre gestionnaire'} vous invite à rejoindre ConformiCrèche`,
        html: `
          <p>Bonjour,</p>
          <p><strong>${profile.fullName || 'Un gestionnaire'}</strong> vous invite à rejoindre sa structure sur ConformiCrèche, en tant que <strong>${ROLE_LABELS[invite.role]}</strong>.</p>
          <p><a href="${acceptUrl}">Cliquez ici pour accepter l'invitation</a></p>
          <p>Si vous n'avez pas de compte, il vous sera proposé d'en créer un avant de rejoindre la structure.</p>
        `
      })

      toast.success(`Invitation envoyée à ${invite.email}`)
      setIsAdding(false)
      setInvite({ email: '', role: 'professional' })
      queryClient.invalidateQueries({ queryKey: ['team_invitations'] })
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error("Erreur lors de l'envoi de l'invitation")
    } finally {
      setIsSending(false)
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
          <Stat label="Invitations en attente" value={(invitations?.length ?? 0).toString()} icon={<Clock className="text-amber-500/60" />} />
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
            action={{ label: "Inviter un salarié", onClick: () => setIsAdding(true) }}
          />
        ) : (
          <div className="py-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {!isLoadingInvitations && invitations && invitations.length > 0 && (
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/60">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Invitations en attente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/60">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{inv.email}</span>
                    <span className="text-xs text-muted-foreground">
                      Invité{profile?.fullName ? ` par ${inv.invitedByName}` : ''} le {new Date(inv.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="uppercase tracking-widest text-[10px] font-bold bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {ROLE_LABELS[inv.role]} · en attente
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent className="sm:max-w-[425px] rounded-3xl p-8 shadow-2xl border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">Inviter un salarié</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Un e-mail d'invitation sera envoyé pour rejoindre votre structure.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ex: jean.valjean@exemple.fr"
                  value={invite.email}
                  onChange={(e) => setInvite(prev => ({ ...prev, email: e.target.value }))}
                  className="rounded-xl h-12 focus:ring-primary/20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Rôle au sein de l'équipe</Label>
                <Select value={invite.role} onValueChange={(v) => setInvite(prev => ({ ...prev, role: v as UserRole }))}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Choisir un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITABLE_ROLES.map(role => (
                      <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleInvite} disabled={isSending || !invite.email} className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 font-bold">
                {isSending ? 'Envoi...' : "Envoyer l'invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageBody>
    </Page>
  )
}
