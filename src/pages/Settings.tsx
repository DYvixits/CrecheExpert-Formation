import { useState, useRef } from 'react'
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Label,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Badge, toast, Avatar, AvatarImage, AvatarFallback, Separator
} from '@blinkdotnew/ui'
import { Building2, User, Lock, Camera, CheckCircle2, Mail, ShieldCheck, AlertCircle, Upload } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { blink } from '../blink/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type UserRole } from '../lib/rbac'
import RoleGuard from '../components/RoleGuard'

export default function SettingsPage() {
  const { user, profile, isManager, isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSendingVerification, setIsSendingVerification] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  // Local form state
  const [fullName, setFullName] = useState(profile?.fullName || '')
  const [diploma, setDiploma] = useState(profile?.diploma || 'none')

  const { data: org } = useQuery({
    queryKey: ['structure', profile?.structureId],
    queryFn: () => blink.db.structures.list({ where: { id: profile?.structureId }, limit: 1 }),
    enabled: !!profile?.structureId,
    select: (data) => data?.[0],
  })

  // ── Avatar Upload ──────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setIsUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}/${Date.now()}.${ext}`
      const { publicUrl } = await blink.storage.upload(file, path, {
        onProgress: (pct) => console.log(`Avatar upload: ${pct}%`),
      })
      await blink.db.user_profiles.update(
        { userId: user.id },
        { avatarUrl: publicUrl }
      )
      // Sync with Blink Auth display
      await blink.auth.updateMe({ avatar: publicUrl })
      toast.success('Photo de profil mise à jour')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      // Optimistically update the profile in the store
      window.location.reload()
    } catch (err) {
      console.error(err)
      toast.error("Échec de l'envoi de l'image")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // ── Profile Save ──────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    try {
      await blink.db.user_profiles.update(
        { userId: user.id },
        { fullName, diploma: diploma === 'none' ? null : diploma }
      )
      await blink.auth.updateMe({ displayName: fullName })
      toast.success('Profil mis à jour')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Email Verification ─────────────────────────────────────────────────────
  const handleSendVerification = async () => {
    if (!user) return
    setIsSendingVerification(true)
    try {
      await blink.auth.sendEmailVerification()
      setVerificationSent(true)
      toast.success('E-mail de vérification envoyé ! Consultez votre boîte de réception.')
    } catch (err) {
      console.error(err)
      toast.error("Impossible d'envoyer l'e-mail de vérification")
    } finally {
      setIsSendingVerification(false)
    }
  }

  const isEmailVerified = profile?.emailVerified || Number((user as any)?.emailVerified) > 0
  const userInitials = (profile?.fullName || user?.email || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <div className="flex flex-col gap-1">
          <PageTitle>Paramètres</PageTitle>
          <PageDescription>Gérez votre profil, votre structure et la sécurité de votre compte.</PageDescription>
        </div>
      </PageHeader>

      <PageBody>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-12">
            <TabsTrigger value="profile" className="rounded-lg font-bold flex items-center gap-2">
              <User className="w-4 h-4" />
              Mon Profil
            </TabsTrigger>
            {(isManager || isAdmin) && (
              <TabsTrigger value="structure" className="rounded-lg font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Ma Structure
              </TabsTrigger>
            )}
            <TabsTrigger value="security" className="rounded-lg font-bold flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Sécurité & Vérification
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="roles" className="rounded-lg font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Rôles
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Profile Tab ─────────────────────────────────────────────── */}
          <TabsContent value="profile">
            <div className="space-y-6">
              {/* Avatar Upload Card */}
              <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/60">
                  <CardTitle className="text-lg">Photo de profil</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex items-center gap-8">
                    <div className="relative group">
                      <Avatar className="w-24 h-24 ring-4 ring-primary/10 ring-offset-2">
                        <AvatarImage src={profile?.avatarUrl || ''} alt={profile?.fullName} />
                        <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        {isUploadingAvatar ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                        ) : (
                          <Camera className="w-6 h-6 text-white" />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="font-bold text-base">{profile?.fullName || 'Votre nom'}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-widest font-black bg-primary/5 text-primary border-primary/20"
                      >
                        {ROLE_LABELS[(profile?.role as UserRole) || 'professional']}
                      </Badge>
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg h-9 font-bold text-xs"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                        >
                          <Upload className="w-3.5 h-3.5 mr-2" />
                          {isUploadingAvatar ? 'Envoi en cours...' : 'Changer la photo'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Form */}
              <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/60">
                  <CardTitle className="text-lg">Informations Personnelles</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                        Nom complet
                      </Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-12 rounded-xl"
                        placeholder="Votre nom complet"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                        Diplôme Principal
                      </Label>
                      <Select value={diploma} onValueChange={setDiploma}>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Choisir un diplôme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun diplôme renseigné</SelectItem>
                          <SelectItem value="CAP AEPE">CAP AEPE</SelectItem>
                          <SelectItem value="Auxiliaire">Auxiliaire de Puériculture</SelectItem>
                          <SelectItem value="EJE">Éducateur de Jeunes Enfants (EJE)</SelectItem>
                          <SelectItem value="Directeur">Direction / Puériculteur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 font-bold"
                      >
                        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Structure Tab ────────────────────────────────────────────── */}
          <TabsContent value="structure">
            <RoleGuard minRole="manager">
              <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/60">
                  <CardTitle className="text-lg">Informations de la Structure</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6 max-w-xl">
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                        Nom de l'établissement
                      </Label>
                      <Input
                        defaultValue={(org as any)?.name || ''}
                        placeholder="Nom de votre crèche"
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                        Numéro SIRET
                      </Label>
                      <Input
                        defaultValue={(org as any)?.siret || ''}
                        placeholder="14 chiffres"
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                        Type d'établissement
                      </Label>
                      <Select defaultValue={(org as any)?.type || 'micro-crèche'}>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Choisir un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="micro-crèche">Micro-crèche</SelectItem>
                          <SelectItem value="EAJE">Multi-accueil (EAJE)</SelectItem>
                          <SelectItem value="MAM">MAM (Maison d'Assistantes Maternelles)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-2">
                      <Button className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 font-bold">
                        Mettre à jour l'établissement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RoleGuard>
          </TabsContent>

          {/* ── Security & Verification Tab ──────────────────────────────── */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Email Verification */}
              <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/60">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Vérification de l'adresse e-mail
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-5 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20">
                    <div className="flex items-start gap-4">
                      {isEmailVerified ? (
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="font-bold">
                          {isEmailVerified ? 'E-mail vérifié' : 'E-mail non vérifié'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isEmailVerified
                            ? `Votre adresse ${user?.email} a été vérifiée avec succès.`
                            : `Veuillez vérifier votre adresse ${user?.email} pour accéder à toutes les fonctionnalités.`}
                        </p>
                        {verificationSent && (
                          <p className="text-xs font-bold text-emerald-600 mt-1">
                            ✓ E-mail envoyé — vérifiez votre boîte de réception (et vos spams).
                          </p>
                        )}
                      </div>
                    </div>
                    {!isEmailVerified && (
                      <Button
                        variant="outline"
                        className="rounded-xl h-11 px-6 font-bold shrink-0 border-primary/30 text-primary hover:bg-primary/5"
                        onClick={handleSendVerification}
                        disabled={isSendingVerification || verificationSent}
                      >
                        {isSendingVerification
                          ? 'Envoi...'
                          : verificationSent
                          ? 'E-mail envoyé ✓'
                          : 'Envoyer le lien de vérification'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/60">
                  <CardTitle className="text-lg">Paramètres de Sécurité</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:bg-muted/20 transition-colors">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-sm">Changer le mot de passe</h3>
                      <p className="text-xs text-muted-foreground">Sécurisez votre compte avec un nouveau mot de passe.</p>
                    </div>
                    <Button variant="outline" className="rounded-lg font-bold text-xs h-9">
                      Modifier
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:bg-muted/20 transition-colors">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-sm">Journal d'audit</h3>
                      <p className="text-xs text-muted-foreground">Historique des connexions et actions sensibles.</p>
                    </div>
                    <Button variant="ghost" className="rounded-lg font-bold text-xs h-9 text-primary">
                      Consulter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Roles Tab (Admin only) ────────────────────────────────────── */}
          <TabsContent value="roles">
            <RoleGuard minRole="admin">
              <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/60">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Référentiel des Rôles & Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([role, label]) => (
                      <div key={role} className="rounded-2xl border border-border/60 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-muted/20 border-b border-border/60">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-3">
                              <span className="font-black text-base">{label}</span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] uppercase tracking-widest font-black ${
                                  role === 'admin'
                                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                                    : role === 'manager'
                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                    : role === 'trainer'
                                    ? 'bg-primary/10 text-primary border-primary/20'
                                    : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                }`}
                              >
                                {role}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
                          </div>
                        </div>
                        <div className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {(import('./../../src/lib/rbac') as any, getPermissionsForRole(role)).map((perm: string) => (
                              <span
                                key={perm}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-[11px] font-mono font-bold"
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </RoleGuard>
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  )
}

// Helper to avoid circular import in JSX
function getPermissionsForRole(role: UserRole): string[] {
  const map: Record<UserRole, string[]> = {
    professional: ['diagnostic:create', 'diagnostic:view_own', 'catalog:view', 'vault:upload', 'vault:view_own', 'structure:view'],
    trainer: ['diagnostic:create', 'diagnostic:view_own', 'catalog:view', 'catalog:manage', 'vault:upload', 'vault:view_own', 'structure:view'],
    manager: ['diagnostic:create', 'diagnostic:view_all', 'catalog:manage', 'vault:view_all', 'vault:delete', 'team:manage', 'team:invite', 'structure:manage'],
    admin: ['diagnostic:*', 'catalog:*', 'vault:*', 'team:*', 'structure:*', 'admin:users', 'admin:platform'],
  }
  return map[role] ?? []
}
