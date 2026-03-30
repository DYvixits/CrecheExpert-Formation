import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { blink } from '../blink/client'
import { ShieldCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@blinkdotnew/ui'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setStatus('error')
      setErrorMessage('Lien de vérification invalide ou expiré.')
      return
    }

    blink.auth.verifyEmail(token)
      .then(() => {
        setStatus('success')
      })
      .catch((err: Error) => {
        console.error('Email verification error:', err)
        setStatus('error')
        setErrorMessage(err.message || 'Une erreur est survenue lors de la vérification.')
      })
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-2xl tracking-tight text-primary uppercase">ConformiCrèche</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-primary/5 border border-border/60 p-10 text-center space-y-6">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Vérification en cours…</h1>
            <p className="text-muted-foreground">Veuillez patienter pendant que nous validons votre adresse e-mail.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">E-mail vérifié !</h1>
            <p className="text-muted-foreground">
              Votre adresse e-mail a été confirmée. Votre compte est désormais pleinement actif.
            </p>
            <Button
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-black text-sm uppercase tracking-wider"
              onClick={() => navigate({ to: '/' })}
            >
              Accéder à mon tableau de bord
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Vérification impossible</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-bold"
                onClick={async () => {
                  await blink.auth.sendEmailVerification()
                  alert('Un nouveau lien de vérification a été envoyé !')
                }}
              >
                Renvoyer le lien de vérification
              </Button>
              <Button
                variant="ghost"
                className="w-full h-12 rounded-xl font-bold text-primary"
                onClick={() => navigate({ to: '/' })}
              >
                Retour à l'accueil
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
