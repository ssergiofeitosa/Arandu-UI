import { type ReactElement, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { DevRoleSwitcher } from '@/components/dev/DevRoleSwitcher'
import { AppLayout } from '@/components/layout/AppLayout'
import { Toaster } from '@/components/ui/Toaster'
import { AppProvider, useApp } from '@/context/AppContext'
import { AdminCatalogPage } from '@/pages/AdminCatalogPage'
import { BookDetailPage } from '@/pages/BookDetailPage'
import { CatalogPage } from '@/pages/CatalogPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { MyLoansPage } from '@/pages/MyLoansPage'
import type { UserRole } from '@/types/arandu'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

function RequireAuth({
  children,
  allowedRole,
}: {
  children: ReactElement
  allowedRole?: UserRole
}) {
  const { isAuthenticated, role } = useApp()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'teacher' ? '/admin-acervo' : '/catalogo'} replace />
  }

  return children
}

function AppRoutes() {
  const { pathname } = useLocation()
  const hideFooter = pathname === '/login'

  return (
    <AppLayout hideFooter={hideFooter}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/catalogo"
          element={
            <RequireAuth>
              <CatalogPage />
            </RequireAuth>
          }
        />
        <Route
          path="/livros/:id"
          element={
            <RequireAuth>
              <BookDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/meus-emprestimos"
          element={
            <RequireAuth allowedRole="student">
              <MyLoansPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin-acervo"
          element={
            <RequireAuth allowedRole="teacher">
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
        {/* DEV ONLY — remover esta linha (e src/components/dev/DevRoleSwitcher.tsx) ao integrar auth Django */}
        <DevRoleSwitcher />
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
