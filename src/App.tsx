import { type ReactElement, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Toaster } from '@/components/ui/Toaster'
import { AppProvider, useApp } from '@/context/AppContext'
import { hasAllowedRole, hasPermission, ROLE_HOME_ROUTE } from '@/lib/rbac'
import { AdminCatalogPage } from '@/pages/AdminCatalogPage'
import { BookDetailPage } from '@/pages/BookDetailPage'
import { CatalogPage } from '@/pages/CatalogPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { MyLoansPage } from '@/pages/MyLoansPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import type { Permission, UserRole } from '@/types/arandu'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

function AuthLoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-5 text-center"
    >
      <Loader2 className="h-6 w-6 animate-spin text-brilliant-azure-600" aria-hidden="true" />
      <p className="text-sm font-medium text-muted">Verificando sessão no Arandu...</p>
    </div>
  )
}

function RequireAuth({
  children,
  allowedRole,
  requiredPermission,
}: {
  children: ReactElement
  allowedRole?: UserRole | UserRole[]
  requiredPermission?: Permission
}) {
  const { user, isAuthenticated, isAuthLoading, role } = useApp()
  const location = useLocation()

  if (isAuthLoading) {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!hasAllowedRole(user, allowedRole)) {
    return <Navigate to={ROLE_HOME_ROUTE[role]} replace />
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <Navigate to={ROLE_HOME_ROUTE[role]} replace />
  }

  return children
}

function GuestOnly({ children }: { children: ReactElement }) {
  const { isAuthenticated, isAuthLoading, role } = useApp()

  if (isAuthLoading) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to={ROLE_HOME_ROUTE[role]} replace />
  }

  return children
}

const AUTH_ROUTES_WITHOUT_FOOTER = new Set(['/login', '/esqueci-senha', '/redefinir-senha'])

function AppRoutes() {
  const { pathname } = useLocation()
  const hideFooter = AUTH_ROUTES_WITHOUT_FOOTER.has(pathname)

  return (
    <AppLayout hideFooter={hideFooter}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route
          path="/catalogo"
          element={
            <RequireAuth requiredPermission="catalog:read">
              <CatalogPage />
            </RequireAuth>
          }
        />
        <Route
          path="/livros/:id"
          element={
            <RequireAuth requiredPermission="catalog:read">
              <BookDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/meus-emprestimos"
          element={
            <RequireAuth allowedRole="student" requiredPermission="loans:self">
              <MyLoansPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin-acervo"
          element={
            <RequireAuth allowedRole="teacher" requiredPermission="admin:panel">
              <AdminCatalogPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
