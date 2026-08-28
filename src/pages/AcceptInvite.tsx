import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { blink } from '../blink/client'
import { useAuth } from '../hooks/useAuth'
import { ShieldCheck, CheckCircle2, XCircle, Loader2, LogIn } from 'lucide-react'
import { Button } from '@blinkdotnew/ui'
import { ROLE_LABELS, type UserRole } from '../lib/rbac'

interface TeamInvitation {
  id: string
  structureId: string
  email: string
  role: UserRole
  token: string
  status: 'pending' | 'accepted'
}

type ViewState = 'loading' | 'need-auth' | 'accepting' | 'success' | 'error'

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [status, setStatus] = useState<ViewState>('loading')
  const [invitation, setInvitation] = useState<TeamInvitation | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const token = new URLSearchParams(window.location.search).get('token')

  useEffect(() => {
    if (authLoading) return

    if (!token) {
      setStatus('error')
      setErrorMessage("Lien d'invitation invalide.")
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const results = await blink.db.team_invitations.list({ where: { token }, limit: 1 }) as unknown as TeamInvitation[]
        const invite = results?.[0]

        if (cancelled) return

        if (!invite) {
          setStatus('error')
          setErrorMessage('Cette invitation est introuvable ou a expiré.')
          return
        }
        if (invite.status === 'accepted') {
          setStatus('error')
          setErrorMessage('Cette invitation a déjà été acceptée.')
          return
        }
        setInvitation(invite)

        if (!isAuthenticated || !user) {
          setStatus('need-auth')
          return
        }

        setStatus('accepting')

        const existingProfile = await blink.db.user_profiles.list({ where: { userId: user.id }, limit: 1 })
        if (existingProfile.length > 0) {
          await blink.db.user_profiles.update({ userId: user.id }, { role: invite.role, structureId: invite.structureId })
        } else {
          await blink.db.user_profiles.create({
            userId: user.id,
            role: invite.role,
            structureId: invite.structureId,
            fullName: user.displayName || user.email?.split('@')[0] || 'Utilisateur',
          })
        }
        await blink.db.team_invitations.update(invite.id, { status: 'accepted' })

        if (cancelled) return
        setStatus('success')
      } catch (err) {
        console.error('Accept invite error:', err)
        if (!cancelled) {
          setStatus('error')
          setErrorMessage("Une erreur est survenue lors de l'acceptation de l'invitation.")
        }
      }
    })()

    return () => { cancelled = true }
  }, [authLoading, isAuthenticated, user, token])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-2xl tracking-tight text-primary uppercase">ConformiCrèche</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-primary/5 border border-border/60 p-10 text-center space-y-6">
        {(status === 'loading' || status === 'accepting') && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              {status === 'accepting' ? "Ajout à l'équipe…" : 'Vérification de l\'invitation…'}
            </h1>
            <p className="text-muted-foreground">Merci de patienter un instant.</p>
          </>
        )}

        {status === 'need-auth' && invitation && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Rejoindre l'équipe</h1>
            <p className="text-muted-foreground">
              Vous avez été invité·e en tant que <strong>{ROLE_LABELS[invitation.role]}</strong>. Connectez-vous ou créez un compte pour rejoindre la structure.
            </p>
            <Button
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-black text-sm uppercase tracking-wider"
              onClick={() => blink.auth.login(window.location.href)}
            >
              Se connecter / Créer un compte
            </Button>
          </>
        )}

        {status === 'success' && invitation && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Bienvenue dans l'équipe !</h1>
            <p className="text-muted-foreground">
              Vous avez rejoint la structure en tant que <strong>{ROLE_LABELS[invitation.role]}</strong>.
            </p>
            <Button
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-black text-sm uppercase tracking-wider"
              onClick={() => { window.location.href = '/' }}
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
            <h1 className="text-2xl font-black tracking-tight">Invitation impossible</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
            <Button
              variant="ghost"
              className="w-full h-12 rounded-xl font-bold text-primary"
              onClick={() => navigate({ to: '/' })}
            >
              Retour à l'accueil
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
