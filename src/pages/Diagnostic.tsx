import { useState } from 'react'
import { Page, PageHeader, PageTitle, PageDescription, PageBody, Button, Card, CardContent, CardHeader, CardTitle, RadioGroup, RadioGroupItem, Label, Banner, LoadingOverlay, Progress, toast } from '@blinkdotnew/ui'
import { ClipboardCheck, ShieldCheck, AlertCircle, ArrowLeft, ArrowRight, Save, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { blink } from '../blink/client'
import { diagnosticQuestions } from '../data/questions'
import { useNavigate } from '@tanstack/react-router'

export default function DiagnosticPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assessmentResult, setAssessmentResult] = useState<{ id: string; score: number } | null>(null)

  const currentQuestion = diagnosticQuestions[currentStep]
  const progress = Math.round(((currentStep + 1) / diagnosticQuestions.length) * 100)

  const handleResponseChange = (value: string) => {
    setResponses(prev => ({ ...prev, [currentQuestion.id]: value }))
  }

  const handleNext = () => {
    if (currentStep < diagnosticQuestions.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      // Calculate score
      let compliantCount = 0
      diagnosticQuestions.forEach(q => {
        const responseValue = responses[q.id]
        const option = q.options.find(o => o.value === responseValue)
        if (option?.isCompliant) compliantCount++
      })
      const score = compliantCount / diagnosticQuestions.length

      const assessmentId = `as_${Date.now()}`
      await blink.db.assessments.create({
        id: assessmentId,
        userId: user.id,
        type: 'initial',
        status: 'completed',
        score: score,
        summary: `Diagnostic initial complété par ${profile?.fullName}`
      })

      // Store individual responses
      const responseData = diagnosticQuestions.map(q => ({
        id: `resp_${assessmentId}_${q.id}`,
        assessmentId: assessmentId,
        questionId: q.id,
        response: responses[q.id],
        isCompliant: q.options.find(o => o.value === responses[q.id])?.isCompliant ? 1 : 0,
        remediationAdvice: q.options.find(o => o.value === responses[q.id])?.remediation || ''
      }))

      await blink.db.assessment_responses.createMany(responseData)

      setAssessmentResult({ id: assessmentId, score })
      toast.success('Diagnostic enregistré avec succès')
    } catch (error) {
      console.error('Error saving assessment:', error)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (assessmentResult) {
    return (
      <Page className="animate-fade-in">
        <PageHeader>
          <PageTitle>Résultat du Diagnostic</PageTitle>
          <PageDescription>Analyse de votre structure terminée.</PageDescription>
        </PageHeader>
        <PageBody className="flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto py-12">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${assessmentResult.score >= 0.8 ? 'border-emerald-500 bg-emerald-50' : 'border-amber-500 bg-amber-50'}`}>
            <span className="text-4xl font-bold">{Math.round(assessmentResult.score * 100)}%</span>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">
              {assessmentResult.score >= 0.8 ? 'Excellent niveau de conformité' : 'Conformité partielle détectée'}
            </h2>
            <p className="text-muted-foreground">
              {assessmentResult.score >= 0.8
                ? 'Votre structure est parfaitement préparée pour les enjeux 2026. Maintenez vos efforts de traçage.'
                : 'Des points de vigilance ont été identifiés. Consultez les recommandations ci-dessous pour vous mettre aux normes.'}
            </p>
          </div>
          <div className="w-full space-y-4">
            <Button className="w-full" onClick={() => navigate({ to: '/' })}>
              Retour au tableau de bord
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setAssessmentResult(null)}>
              Relancer un diagnostic
            </Button>
          </div>
        </PageBody>
      </Page>
    )
  }

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <div className="flex flex-col gap-1">
          <PageTitle>Nouveau Diagnostic</PageTitle>
          <PageDescription>
            Répondez aux questions pour évaluer votre conformité réglementaire 2026.
          </PageDescription>
        </div>
      </PageHeader>

      <PageBody className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Étape {currentStep + 1} sur {diagnosticQuestions.length}</span>
            <span>{progress}% complété</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-lg border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider">
                {currentQuestion.category}
              </span>
            </div>
            <CardTitle className="text-xl leading-relaxed">{currentQuestion.text}</CardTitle>
            {currentQuestion.helpText && (
              <p className="text-sm text-muted-foreground italic flex items-start gap-2 pt-2">
                <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                {currentQuestion.helpText}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={responses[currentQuestion.id]} onValueChange={handleResponseChange} className="space-y-4">
              {currentQuestion.options.map(option => (
                <div key={option.value} className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-primary/30 ${responses[currentQuestion.id] === option.value ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer font-medium text-base">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex items-center justify-between pt-6 border-t">
              <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>
              {currentStep < diagnosticQuestions.length - 1 ? (
                <Button onClick={handleNext} disabled={!responses[currentQuestion.id]}>
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!responses[currentQuestion.id] || isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {isSubmitting ? 'Traitement...' : 'Finaliser le Diagnostic'}
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Banner variant="info" className="bg-secondary/30">
          Toutes vos réponses sont sécurisées et ne sont partagées avec aucune instance de contrôle sans votre accord explicite.
        </Banner>
      </PageBody>
    </Page>
  )
}
