import { Button, Card, CardContent, CardHeader, CardTitle, Banner, Container } from '@blinkdotnew/ui'
import { ShieldCheck, GraduationCap, ClipboardCheck, Users, ArrowRight, CheckCircle2, Heart, Award, Sparkles } from 'lucide-react'
import { blink } from '../blink/client'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, isLoading])

  const handleStart = () => {
    // After managed auth signup, Blink will redirect back here.
    // We trigger email verification once the user lands as authenticated.
    blink.auth.login(window.location.origin + '/')
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="font-black text-2xl tracking-tight text-primary uppercase">ConformiCrèche</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#diagnostic" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Diagnostic</a>
            <a href="#formations" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Formations</a>
            <a href="#conformite" className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Conformité</a>
            <Button onClick={handleStart} variant="secondary" className="font-bold rounded-xl h-11 px-6 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all">Connexion</Button>
            <Button onClick={handleStart} className="font-bold rounded-xl h-11 px-6 shadow-xl shadow-primary/20">Essai Gratuit</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <Container className="relative z-10 text-center space-y-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-secondary-foreground/10 text-primary text-xs font-black uppercase tracking-widest shadow-sm">
            <Sparkles className="w-4 h-4" />
            Préparation Réglementation 2026
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] max-w-5xl mx-auto text-primary uppercase">
            Votre Copilote <span className="text-accent underline decoration-8 decoration-accent/30 underline-offset-8">Réglementaire</span> Petite Enfance.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            Anticipez les nouvelles normes 2026 avec notre moteur de diagnostic adaptatif et notre catalogue de formations certifiantes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <Button onClick={handleStart} size="lg" className="h-16 px-10 rounded-2xl text-lg font-black uppercase tracking-wider shadow-2xl shadow-primary/20 group">
              Lancer mon diagnostic
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="ghost" size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold text-primary hover:bg-primary/5 transition-colors">
              Découvrir la solution
            </Button>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-border/50 bg-white">
        <Container className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
          <div className="space-y-2">
            <div className="text-5xl font-black text-primary tracking-tighter">100%</div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Conformité Garantie</p>
          </div>
          <div className="space-y-2">
            <div className="text-5xl font-black text-primary tracking-tighter">+500</div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Structures Pilotées</p>
          </div>
          <div className="space-y-2">
            <div className="text-5xl font-black text-primary tracking-tighter">2026</div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Échéance Critique</p>
          </div>
          <div className="space-y-2">
            <div className="text-5xl font-black text-primary tracking-tighter">15min</div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Temps Diagnostic</p>
          </div>
        </Container>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-background">
        <Container className="space-y-20">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-primary">Une plateforme conçue pour <span className="text-accent">l'excellence</span>.</h2>
            <p className="text-lg text-muted-foreground font-medium">Nous centralisons tout ce dont un gestionnaire a besoin pour dormir sereinement.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="rounded-3xl border-none shadow-2xl shadow-primary/5 p-8 space-y-6 hover:-translate-y-2 transition-transform duration-500 bg-white group">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <ClipboardCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-primary uppercase">Diagnostics Adaptatifs</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">Questions intelligentes basées sur votre type de structure et les dernières directives PMI.</p>
            </Card>
            <Card className="rounded-3xl border-none shadow-2xl shadow-primary/5 p-8 space-y-6 hover:-translate-y-2 transition-transform duration-500 bg-white group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-primary uppercase">Orchestrateur Training</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">Catalogue multi-organismes certifié Qualiopi, orienté compétences métiers et financement CPF.</p>
            </Card>
            <Card className="rounded-3xl border-none shadow-2xl shadow-primary/5 p-8 space-y-6 hover:-translate-y-2 transition-transform duration-500 bg-white group">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-primary uppercase">Coffre-fort Preuves</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">Centralisez vos attestations, diplômes et PND dans un espace sécurisé prêt pour les audits.</p>
            </Card>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-primary text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
        <Container className="relative z-10 text-center space-y-12">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">Prêt pour les défis <br /> de la petite enfance ?</h2>
          <p className="text-xl md:text-2xl font-medium opacity-80 max-w-2xl mx-auto">Rejoignez les structures qui font de la conformité un levier de qualité et de confiance.</p>
          <Button onClick={handleStart} size="lg" className="h-20 px-12 rounded-2xl text-xl font-black uppercase tracking-wider bg-white text-primary hover:bg-white/90 shadow-2xl transition-all">
            Créer mon compte gratuitement
          </Button>
          <div className="flex items-center justify-center gap-8 pt-8 opacity-60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-widest">Sans carte bancaire</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-widest">Démo illimitée</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border/50 bg-white">
        <Container className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <span className="font-black text-xl tracking-tight text-primary uppercase">ConformiCrèche</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Copilote réglementaire et orchestrateur de formations pour le secteur de la petite enfance.</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-black uppercase tracking-widest text-xs text-primary">Plateforme</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-bold">
              <li><a href="#" className="hover:text-primary transition-colors">Diagnostic</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Catalogue</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Conformité</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-black uppercase tracking-widest text-xs text-primary">Légal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-bold">
              <li><a href="#" className="hover:text-primary transition-colors">CGU / CGV</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Mentions Légales</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">RGPD</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-black uppercase tracking-widest text-xs text-primary">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-bold">
              <li><a href="mailto:hello@conformicreche.fr" className="hover:text-primary transition-colors">hello@conformicreche.fr</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Centre d'aide</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </Container>
        <div className="container mx-auto px-6 pt-20 text-center text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">
          © 2026 ConformiCrèche Platform — Tout droit réservé
        </div>
      </footer>
    </div>
  )
}
