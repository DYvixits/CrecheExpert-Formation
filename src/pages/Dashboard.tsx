import { useState, useEffect } from 'react'
import { Page, PageHeader, PageTitle, PageDescription, PageBody, StatGroup, Stat, Card, CardContent, CardHeader, CardTitle, Button, Banner, EmptyState } from '@blinkdotnew/ui'
import { TrendingUp, AlertCircle, ShieldCheck, GraduationCap, ClipboardCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { blink } from '../blink/client'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments', user?.id],
    queryFn: () => blink.db.assessments.list({ where: { userId: user?.id }, orderBy: { createdAt: 'desc' }, limit: 5 }),
    enabled: !!user?.id
  })

  const latestAssessment = assessments?.[0]
  const isCompliant = latestAssessment?.score && Number(latestAssessment.score) >= 0.8

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <div className="flex flex-col gap-1">
          <PageTitle>Tableau de bord</PageTitle>
          <PageDescription>
            Bienvenue, {profile?.fullName}. Voici l'état de conformité de votre structure.
          </PageDescription>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate({ to: '/diagnostic' })}>
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Nouveau Diagnostic
          </Button>
        </div>
      </PageHeader>

      <PageBody className="space-y-8">
        <StatGroup>
          <Stat
            label="Score de Conformité"
            value={latestAssessment?.score ? `${Math.round(Number(latestAssessment.score) * 100)}%` : 'N/A'}
            trend={latestAssessment?.score ? 5.2 : 0}
            trendLabel="vs mois dernier"
            icon={<ShieldCheck className="text-primary" />}
            description="Basé sur votre dernier diagnostic"
          />
          <Stat
            label="Formations en cours"
            value="3"
            icon={<GraduationCap className="text-primary" />}
            description="Salariés en cours de certification"
          />
          <Stat
            label="Alertes Réglementaires"
            value="2"
            icon={<AlertCircle className="text-destructive" />}
            description="Échéances à moins de 30 jours"
          />
        </StatGroup>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">État de Conformité 2026</CardTitle>
              <ShieldCheck className={isCompliant ? "text-emerald-500" : "text-amber-500"} />
            </CardHeader>
            <CardContent className="space-y-4">
              {latestAssessment ? (
                <>
                  <div className="p-4 rounded-xl bg-secondary/50 border border-secondary">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Action Requise : Taux d'encadrement</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Votre structure est à 85% de conformité sur le volet RH. Un recrutement est conseillé d'ici septembre.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate({ to: '/diagnostic' })}>
                    Consulter le rapport complet
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              ) : (
                <EmptyState
                  icon={<ClipboardCheck />}
                  title="Aucun diagnostic"
                  description="Lancez votre premier diagnostic pour évaluer votre structure."
                  action={{ label: "Démarrer", onClick: () => navigate({ to: '/diagnostic' }) }}
                />
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Formations Recommandées</CardTitle>
              <GraduationCap className="text-primary" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group border border-transparent hover:border-border">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Recyclage Secourisme PSC1</span>
                    <span className="text-xs text-muted-foreground">Obligatoire • 7h • CPF/OPCO</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group border border-transparent hover:border-border">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Mise en conformité décret 2026</span>
                    <span className="text-xs text-muted-foreground">Recommandé • 14h • Dirigeants</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <Button variant="ghost" className="w-full text-primary" onClick={() => navigate({ to: '/catalog' })}>
                Voir tout le catalogue
              </Button>
            </CardContent>
          </Card>
        </div>

        <Banner variant="info" title="Évolution Réglementaire 2026" className="rounded-xl">
          Les contrôles PMI seront renforcés à partir du 1er Janvier 2026. Assurez-vous d'avoir centralisé tous vos diplômes dans votre coffre-fort numérique.
        </Banner>
      </PageBody>
    </Page>
  )
}
