import { useState } from 'react'
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, toast, LoadingOverlay, Tabs, TabsList, TabsTrigger, TabsContent } from '@blinkdotnew/ui'
import { Building2, User, Shield, Bell, Save, Globe, Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { blink } from '../blink/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['structure', profile?.structureId],
    queryFn: () => blink.db.structures.get(profile?.structureId || ''),
    enabled: !!profile?.structureId
  })

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    try {
      await blink.db.user_profiles.update(user.id, {
        fullName: profile?.fullName,
        diploma: profile?.diploma
      })
      toast.success('Profil mis à jour')
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] })
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <div className="flex flex-col gap-1">
          <PageTitle>Paramètres</PageTitle>
          <PageDescription>Gérez vos informations personnelles et celles de votre structure.</PageDescription>
        </div>
      </PageHeader>

      <PageBody>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-12">
            <TabsTrigger value="profile" className="rounded-lg font-bold flex items-center gap-2">
              <User className="w-4 h-4" />
              Mon Profil
            </TabsTrigger>
            {(profile?.role === 'manager' || profile?.role === 'admin') && (
              <TabsTrigger value="structure" className="rounded-lg font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Ma Structure
              </TabsTrigger>
            )}
            <TabsTrigger value="security" className="rounded-lg font-bold flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Sécurité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/60">
                <CardTitle className="text-xl">Informations Personnelles</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Nom complet</Label>
                    <Input defaultValue={profile?.fullName} className="h-12 rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Diplôme Principal</Label>
                    <Select defaultValue={profile?.diploma || 'none'}>
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
                  <div className="pt-4">
                    <Button type="submit" disabled={isSaving} className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 font-bold">
                      {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="structure">
            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/60">
                <CardTitle className="text-xl">Informations de la Structure</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6 max-w-xl">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Nom de l'établissement</Label>
                    <Input defaultValue={org?.name || 'Ma Crèche'} className="h-12 rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Numéro SIRET</Label>
                    <Input placeholder="14 chiffres" className="h-12 rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Type d'établissement</Label>
                    <Select defaultValue={org?.type || 'micro-crèche'}>
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
                  <div className="pt-4">
                    <Button className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 font-bold">
                      Mettre à jour l'établissement
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/60">
                <CardTitle className="text-xl">Paramètres de Sécurité</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/60">
                  <div className="space-y-1">
                    <h3 className="font-bold">Authentification à deux facteurs</h3>
                    <p className="text-sm text-muted-foreground">Renforcez la sécurité de votre compte.</p>
                  </div>
                  <Button variant="outline" className="rounded-lg font-bold">Activer</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/60">
                  <div className="space-y-1">
                    <h3 className="font-bold">Journal d'audit</h3>
                    <p className="text-sm text-muted-foreground">Consultez l'historique des actions sensibles.</p>
                  </div>
                  <Button variant="ghost" className="rounded-lg font-bold text-primary">Consulter</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </Page>
  )
}
