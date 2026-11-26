import React, { startTransition, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, ShieldCheck, UserCheck, X } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { SCHOOL_NAME, STUDENT_USER, TEACHER_USER } from '@/data/mockData'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  hideFooter?: boolean
}

export function AppLayout({ children, hideFooter = false }: AppLayoutProps) {
  const { isAuthenticated, role, loans, logout } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const activeLoansCount = loans.filter(
    (l) => l.status === 'ativo' || l.status === 'atrasado',
  ).length

  const handleLogout = () => {
    setMobileOpen(false)
    startTransition(() => {
      logout()
      navigate('/', { replace: true })
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header fixo compartilhado */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-10">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="inline-flex shrink-0 items-center rounded-sm focus-visible:outline-focus"
          >
            <img
              src="/arandu-logo-dark.svg"
              alt="Arandu · Saber Digital"
              className="h-[26px] w-auto select-none md:h-[32px]"
            />
          </Link>

          {/* Navegação desktop */}
          <nav aria-label="Navegação principal" className="hidden items-center gap-7 md:flex">
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground"
                >
                  Acervo
                </Link>
                {!hideFooter && (
                  <a
                    href="#rodape"
                    className="text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground"
                  >
                    Sobre a escola
                  </a>
                )}
              </>
            )}

            {isAuthenticated && role === 'student' && (
              <>
                <Link
                  to="/catalogo"
                  className={cn(
                    'text-sm font-medium transition-colors duration-150 hover:text-foreground',
                    location.pathname === '/catalogo' ? 'font-semibold text-foreground' : 'text-muted',
                  )}
                >
                  Catálogo
                </Link>
                <Link
                  to="/meus-emprestimos"
                  className={cn(
                    'inline-flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-foreground',
                    location.pathname === '/meus-emprestimos'
                      ? 'font-semibold text-foreground'
                      : 'text-muted',
                  )}
                >
                  Meus Empréstimos
                  {activeLoansCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-light-green/70 px-1.5 text-[11px] font-bold tabular-nums text-shadow-grey">
                      {activeLoansCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {isAuthenticated && role === 'teacher' && (
              <>
                <Link
                  to="/catalogo"
                  className={cn(
                    'text-sm font-medium transition-colors duration-150 hover:text-foreground',
                    location.pathname === '/catalogo' ? 'font-semibold text-foreground' : 'text-muted',
                  )}
                >
                  Catálogo
                </Link>
                <Link
                  to="/admin-acervo"
                  className={cn(
                    'text-sm font-medium transition-colors duration-150 hover:text-foreground',
                    location.pathname === '/admin-acervo'
                      ? 'font-semibold text-foreground'
                      : 'text-muted',
                  )}
                >
                  Painel do Acervo
                </Link>
              </>
            )}
          </nav>

          {/* Ações à direita (desktop) */}
          <div className="hidden items-center gap-2.5 md:flex">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-default focus-visible:outline-focus"
              >
                Entrar
              </Link>
            ) : role === 'student' ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground">
                  <UserCheck className="h-3.5 w-3.5 text-light-green-700" aria-hidden="true" />
                  {STUDENT_USER.name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-default hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  Sair
                </button>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-light-green/40 px-3 py-1.5 text-xs font-semibold text-shadow-grey">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {TEACHER_USER.name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-default hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  Sair
                </button>
              </>
            )}
          </div>

          {/* Botão mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-foreground md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Drawer mobile */}
        {mobileOpen && (
          <div className="border-t border-border bg-background px-5 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-secondary"
                  >
                    Acervo
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="mt-1 rounded-md bg-shadow-grey px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Entrar
                  </Link>
                </>
              ) : role === 'student' ? (
                <>
                  <Link
                    to="/catalogo"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-secondary"
                  >
                    Catálogo
                  </Link>
                  <Link
                    to="/meus-emprestimos"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-secondary"
                  >
                    <span>Meus Empréstimos</span>
                    <span className="rounded-full bg-light-green/70 px-2 py-0.5 text-xs font-bold text-shadow-grey">
                      {activeLoansCount}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair ({STUDENT_USER.name})
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/catalogo"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-secondary"
                  >
                    Catálogo
                  </Link>
                  <Link
                    to="/admin-acervo"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-secondary"
                  >
                    Painel do Acervo
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {!hideFooter && (
        <footer id="rodape" className="border-t border-border bg-surface-secondary pb-16 sm:pb-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 pt-8 sm:flex-row sm:items-center sm:px-6 lg:px-10">
            <div className="flex flex-col gap-1.5">
              <img
                src="/arandu-logo-dark.svg"
                alt="Arandu · Saber Digital"
                className="h-[24px] w-fit select-none"
              />
              <p className="text-xs text-muted">
                {SCHOOL_NAME} • Biblioteca Digital Escolar
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-muted">
              <Link to={isAuthenticated ? '/catalogo' : '/login'} className="hover:text-foreground">
                Catálogo
              </Link>
              {!isAuthenticated ? (
                <Link to="/login" className="hover:text-foreground">
                  Entrar
                </Link>
              ) : role === 'student' ? (
                <Link to="/meus-emprestimos" className="hover:text-foreground">
                  Meus Empréstimos
                </Link>
              ) : (
                <Link to="/admin-acervo" className="hover:text-foreground">
                  Painel do Acervo
                </Link>
              )}
              <span>Empréstimos gratuitos em PDF e EPUB</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
