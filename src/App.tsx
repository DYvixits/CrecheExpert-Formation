import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  useNavigate,
  useParams
} from '@tanstack/react-router'
import { Toaster, LoadingOverlay, AppShell, AppShellSidebar, AppShellMain, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarItem, MobileSidebarTrigger } from '@blinkdotnew/ui'
import { LayoutDashboard, ClipboardCheck, GraduationCap, ShieldCheck, Settings, Users, LogOut, Search } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { blink } from './blink/client'
import { useEffect } from 'react'

import LandingPage from './pages/Landing'

// Layout Component
function MainLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  // Handle public routes
  const isPublicRoute = window.location.pathname === '/landing'

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      navigate({ to: '/landing' })
    }
  }, [isAuthenticated, isLoading, isPublicRoute])

  if (isLoading) return <LoadingOverlay />

  if (isPublicRoute) return <>{children}</>

  if (!isAuthenticated) return null // Will redirect

  return (
    <AppShell>
      <AppShellSidebar>
        <Sidebar>
          <SidebarHeader className="flex items-center gap-2 p-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">ConformiCrèche</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarItem icon={<LayoutDashboard />} label="Tableau de bord" href="/" active={window.location.pathname === '/'} />
              <SidebarItem icon={<ClipboardCheck />} label="Diagnostic" href="/diagnostic" active={window.location.pathname === '/diagnostic'} />
              <SidebarItem icon={<GraduationCap />} label="Catalogue" href="/catalog" active={window.location.pathname === '/catalog'} />
              <SidebarItem icon={<ShieldCheck />} label="Conformité" href="/vault" active={window.location.pathname === '/vault'} />
            </SidebarGroup>
            {(profile?.role === 'manager' || profile?.role === 'admin') && (
              <SidebarGroup label="Gestion">
                <SidebarItem icon={<Users />} label="Équipe" href="/team" active={window.location.pathname === '/team'} />
                <SidebarItem icon={<Settings />} label="Paramètres" href="/settings" active={window.location.pathname === '/settings'} />
              </SidebarGroup>
            )}
          </SidebarContent>
          <div className="mt-auto p-4 border-t">
            <button
              onClick={() => blink.auth.logout()}
              className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </Sidebar>
      </AppShellSidebar>
      <AppShellMain>
        <div className="md:hidden flex items-center gap-2 px-4 h-14 border-b bg-white">
          <MobileSidebarTrigger />
          <span className="font-bold text-sm">ConformiCrèche</span>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </AppShellMain>
    </AppShell>
  )
}

import DashboardPage from './pages/Dashboard'
import DiagnosticPage from './pages/Diagnostic'
import CatalogPage from './pages/Catalog'
import VaultPage from './pages/Vault'
import TeamPage from './pages/Team'
import SettingsPage from './pages/Settings'

// Root Route
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

// Routes
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: DashboardPage })
const diagnosticRoute = createRoute({ getParentRoute: () => rootRoute, path: '/diagnostic', component: DiagnosticPage })
const catalogRoute = createRoute({ getParentRoute: () => rootRoute, path: '/catalog', component: CatalogPage })
const vaultRoute = createRoute({ getParentRoute: () => rootRoute, path: '/vault', component: VaultPage })
const teamRoute = createRoute({ getParentRoute: () => rootRoute, path: '/team', component: TeamPage })
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: SettingsPage })
const landingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/landing', component: LandingPage })

const routeTree = rootRoute.addChildren([indexRoute, diagnosticRoute, catalogRoute, vaultRoute, teamRoute, settingsRoute, landingRoute])
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  return <RouterProvider router={router} />
}
