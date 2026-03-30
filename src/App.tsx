import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'
import {
  Toaster, LoadingOverlay,
  AppShell, AppShellSidebar, AppShellMain,
  Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarItem,
  MobileSidebarTrigger,
  Avatar, AvatarImage, AvatarFallback,
  Badge,
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from '@blinkdotnew/ui'
import {
  LayoutDashboard, ClipboardCheck, GraduationCap,
  ShieldCheck, Settings, Users, LogOut, AlertTriangle,
} from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { blink } from './blink/client'
import { useEffect } from 'react'
import { ROLE_LABELS, type UserRole } from './lib/rbac'

import LandingPage from './pages/Landing'
import DashboardPage from './pages/Dashboard'
import DiagnosticPage from './pages/Diagnostic'
import CatalogPage from './pages/Catalog'
import VaultPage from './pages/Vault'
import TeamPage from './pages/Team'
import SettingsPage from './pages/Settings'
import VerifyEmailPage from './pages/VerifyEmail'

// ── Layout ────────────────────────────────────────────────────────────────────
function MainLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, isAuthenticated, isLoading, can } = useAuth()
  const navigate = useNavigate()

  const isPublicRoute =
    window.location.pathname === '/landing' ||
    window.location.pathname === '/verify-email'

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      navigate({ to: '/landing' })
    }
  }, [isAuthenticated, isLoading, isPublicRoute])

  if (isLoading) return <LoadingOverlay />
  if (isPublicRoute) return <>{children}</>
  if (!isAuthenticated) return null

  const userInitials = (profile?.fullName || user?.email || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isEmailVerified = profile?.emailVerified || Number((user as any)?.emailVerified) > 0

  return (
    <TooltipProvider>
      <AppShell>
        <AppShellSidebar>
          <Sidebar>
            {/* Brand */}
            <SidebarHeader className="flex items-center gap-2 px-4 py-5 border-b border-border/40">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <span className="font-black text-base tracking-tight">ConformiCrèche</span>
            </SidebarHeader>

            <SidebarContent className="py-3">
              <SidebarGroup>
                <SidebarItem
                  icon={<LayoutDashboard />}
                  label="Tableau de bord"
                  href="/"
                  active={window.location.pathname === '/'}
                />
                {can('diagnostic:create') && (
                  <SidebarItem
                    icon={<ClipboardCheck />}
                    label="Diagnostic"
                    href="/diagnostic"
                    active={window.location.pathname === '/diagnostic'}
                  />
                )}
                {can('catalog:view') && (
                  <SidebarItem
                    icon={<GraduationCap />}
                    label="Catalogue"
                    href="/catalog"
                    active={window.location.pathname === '/catalog'}
                  />
                )}
                {can('vault:view_own') && (
                  <SidebarItem
                    icon={<ShieldCheck />}
                    label="Conformité"
                    href="/vault"
                    active={window.location.pathname === '/vault'}
                  />
                )}
              </SidebarGroup>

              {can('team:view') && (
                <SidebarGroup label="Gestion Structure">
                  <SidebarItem
                    icon={<Users />}
                    label="Équipe"
                    href="/team"
                    active={window.location.pathname === '/team'}
                  />
                  <SidebarItem
                    icon={<Settings />}
                    label="Paramètres"
                    href="/settings"
                    active={window.location.pathname === '/settings'}
                  />
                </SidebarGroup>
              )}
            </SidebarContent>

            {/* User Footer */}
            <div className="mt-auto p-4 border-t border-border/40 space-y-3">
              {/* Email verification warning */}
              {!isEmailVerified && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate({ to: '/settings' })}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>E-mail non vérifié</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Vérifiez votre adresse e-mail dans Paramètres → Sécurité
                  </TooltipContent>
                </Tooltip>
              )}

              {/* User identity row */}
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 ring-2 ring-primary/20 shrink-0">
                  <AvatarImage src={profile?.avatarUrl || ''} />
                  <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold truncate">{profile?.fullName || user?.email}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">
                    {ROLE_LABELS[(profile?.role as UserRole) || 'professional']}
                  </span>
                </div>
                <button
                  onClick={() => blink.auth.logout()}
                  title="Déconnexion"
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Sidebar>
        </AppShellSidebar>

        <AppShellMain>
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b bg-white">
            <MobileSidebarTrigger />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <ShieldCheck className="text-white w-4 h-4" />
              </div>
              <span className="font-black text-sm">ConformiCrèche</span>
            </div>
          </div>
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            {children}
          </div>
        </AppShellMain>
      </AppShell>
    </TooltipProvider>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <>
      <MainLayout>
        <Outlet />
      </MainLayout>
      <Toaster position="top-right" />
    </>
  ),
})

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: DashboardPage })
const diagnosticRoute = createRoute({ getParentRoute: () => rootRoute, path: '/diagnostic', component: DiagnosticPage })
const catalogRoute = createRoute({ getParentRoute: () => rootRoute, path: '/catalog', component: CatalogPage })
const vaultRoute = createRoute({ getParentRoute: () => rootRoute, path: '/vault', component: VaultPage })
const teamRoute = createRoute({ getParentRoute: () => rootRoute, path: '/team', component: TeamPage })
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: SettingsPage })
const landingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/landing', component: LandingPage })
const verifyEmailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/verify-email', component: VerifyEmailPage })

const routeTree = rootRoute.addChildren([
  indexRoute, diagnosticRoute, catalogRoute,
  vaultRoute, teamRoute, settingsRoute,
  landingRoute, verifyEmailRoute,
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  return <RouterProvider router={router} />
}
