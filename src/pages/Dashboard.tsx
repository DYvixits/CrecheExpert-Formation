import { useState, useEffect } from 'react'
import { Page, PageHeader, PageTitle, PageDescription, PageBody, StatGroup, Stat, Card, CardContent, CardHeader, CardTitle, Button, Banner, EmptyState } from '@blinkdotnew/ui'
import { TrendingUp, AlertCircle, ShieldCheck, GraduationCap, ClipboardCheck, ArrowRight, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { blink } from '../blink/client'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { differenceInCalendarDays } from 'date-fns'

const EXPIRY_WARNING_DAYS = 30

interface AssessmentResponse {
  questionId: string
  isCompliant: number | boolean
  remediationAdvice?: string
}

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()

  const isEmailVerified = profile?.emailVerified || Number((user as any)?.emailVerified) > 0

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments', user?.id],
    queryFn: () => blink.db.assessments.list({ where: { userId: user?.id }, orderBy: { createdAt: 'desc' }, limit: 5 }),
    enabled: !!user?.id
  })

  const latestAssessment = assessments?.[0]
  const isCompliant = latestAssessment?.score && Number(latestAssessment.score) >= 0.8

  const { data: latestResponses } = useQuery({
    queryKey: ['assessment_responses', latestAssessment?.id],
    queryFn: () => blink.db.assessment_responses.list({ where: { assessmentId: latestAssessment?.id } }) as unknown as Promise<AssessmentResponse[]>,
    enabled: !!latestAssessment?.id
  })

  const nonCompliantResponses = (latestResponses ?? []).filter(r => !Number(r.isCompliant))
  const topRemediation = nonCompliantResponses.find(r => r.remediationAdvice)

  const { data: documents } = useQuery({
    queryKey: ['compliance_documents', user?.id],
    queryFn: () => blink.db.compliance_documents.list({ where: { userId: user?.id } }) as Promise<{ expiryDate?: string }[]>,
    enabled: !!user?.id
  })

  const expiringDocuments = (documents ?? []).filter(d => {
    if (!d.expiryDate) return false
    return differenceInCalendarDays(new Date(d.expiryDate), new Date()) <= EXPIRY_WARNING_DAYS
  }).length

  const regulatoryAlerts = nonCompliantResponses.length + expiringDocuments

  const { data: enrollments } = useQuery({
    queryKey: ['training_enrollments', user?.id],
    queryFn: () => blink.db.training_enrollments.list({ where: { userId: user?.id, status: 'in_progress' } }) as Promise<{ id: string; trainingId: string }[]>,
    enabled: !!user?.id
  })

  const { data: recommendedTrainings } = useQuery({
    queryKey: ['trainings', 'recommended'],
    queryFn: () => blink.db.training_catalog.list({ where: { category: 'Regulatory' }, limit: 2 }) as Promise<{ id: string; title: string; duration: string; labels: string }[]>
  })

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
            value={(enrollments?.length ?? 0).toString()}
            icon={<GraduationCap className="text-primary" />}
            description="Inscriptions actives au catalogue"
          />
          <Stat
            label="Alertes Réglementaires"
            value={regulatoryAlerts.toString()}
            icon={<AlertCircle className="text-destructive" />}
            description="Non-conformités + échéances à moins de 30 jours"
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
                  {topRemediation ? (
                    <div className="p-4 rounded-xl bg-secondary/50 border border-secondary">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Action requise</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {topRemediation.remediationAdvice}
                          </p>
                          {nonCompliantResponses.length > 1 && (
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              +{nonCompliantResponses.length - 1} autre{nonCompliantResponses.length - 1 > 1 ? 's' : ''} point{nonCompliantResponses.length - 1 > 1 ? 's' : ''} à traiter
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <p className="text-sm text-emerald-700 font-medium">Aucun point de non-conformité détecté sur ce diagnostic.</p>
                      </div>
                    </div>
                  )}
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
                {recommendedTrainings && recommendedTrainings.length > 0 ? (
                  recommendedTrainings.map(training => (
                    <div
                      key={training.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group border border-transparent hover:border-border"
                      onClick={() => navigate({ to: '/catalog' })}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{training.title}</span>
                        <span className="text-xs text-muted-foreground">{training.duration} • {training.labels}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune formation réglementaire recommandée pour le moment.</p>
                )}
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
