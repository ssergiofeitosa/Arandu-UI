import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { BookCover } from '@/components/BookCover'
import { useApp } from '@/context/AppContext'
import { SCHOOL_NAME } from '@/data/mockData'
import { ROLE_HOME_ROUTE } from '@/lib/rbac'
import { ApiError } from '@/services/api'

interface LoginLocationState {
  from?: string
}

export function LoginPage() {
  const { login } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const fromPath = (location.state as LoginLocationState | null)?.from

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!identifier.trim() || !password) {
      setError('Informe sua matrícula ou e-mail institucional e sua senha.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const loggedUser = await login(identifier, password)
      const defaultTarget = ROLE_HOME_ROUTE[loggedUser.role]

      const canReturnToFrom =
        Boolean(fromPath) &&
        fromPath !== '/login' &&
        !(loggedUser.role === 'student' && fromPath?.startsWith('/admin-acervo')) &&
        !(loggedUser.role === 'teacher' && fromPath?.startsWith('/meus-emprestimos'))

      navigate(canReturnToFrom && fromPath ? fromPath : defaultTarget, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Não foi possível entrar agora. Tente novamente em instantes.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-69px)] lg:grid-cols-12">
      {/* Painel esquerdo escuro com logo clara */}
      <aside className="flex flex-col justify-between bg-shadow-grey px-6 py-10 text-white sm:px-10 lg:col-span-6 lg:px-14 lg:py-14">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-shadow-grey-200 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar à página inicial
          </Link>

          <div className="mt-8">
            <img
              src="/arandu-logo-clear.svg"
              alt="Arandu · Saber Digital"
              className="h-[34px] w-auto select-none"
            />
          </div>

          <h1 className="mt-8 max-w-md text-balance text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl">
            Sua estante escolar de leitura digital, aberta o ano inteiro.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-shadow-grey-200 sm:text-base">
            Empréstimo gratuito de livros digitais em PDF e EPUB para estudantes e docentes do{' '}
            <strong className="font-semibold text-white">{SCHOOL_NAME}</strong>.
          </p>
        </div>

        {/* Capas reais em miniatura */}
        <div className="mt-10 hidden items-end gap-4 sm:flex">
          <div className="w-20">
            <BookCover
              title="Dom Casmurro"
              author="Machado de Assis"
              coverUrl="/covers/dom-casmurro.jpg"
              size="sm"
            />
          </div>
          <div className="w-20 translate-y-2">
            <BookCover
              title="Quarto de Despejo"
              author="Carolina Maria de Jesus"
              coverUrl="/covers/quarto-de-despejo.jpg"
              size="sm"
            />
          </div>
          <div className="w-20">
            <BookCover
              title="Vidas Secas"
              author="Graciliano Ramos"
              coverUrl="/covers/vidas-secas.jpg"
              size="sm"
            />
          </div>
        </div>
      </aside>

      {/* Painel direito com autenticação JWT real */}
      <section className="flex items-center justify-center bg-background px-4 py-12 sm:px-8 lg:col-span-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Entrar no Arandu
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Use sua matrícula escolar ou e-mail institucional cadastrado pela biblioteca.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-id" className="text-sm font-medium text-foreground">
                Matrícula ou E-mail institucional
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="login-id"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Ex.: 2026-04819 ou nome@arandu.edu.br"
                  aria-invalid={Boolean(error && !identifier.trim())}
                  className="h-11 w-full rounded-field border border-border bg-field-background pl-10 pr-3.5 text-sm text-field-foreground placeholder:text-field-placeholder focus-visible:outline-focus"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="login-pass" className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <Link
                  to="/esqueci-senha"
                  className="text-xs font-medium text-brilliant-azure-700 hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="login-pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Digite sua senha"
                  aria-invalid={Boolean(error && !password)}
                  className="h-11 w-full rounded-field border border-border bg-field-background pl-10 pr-10 text-sm text-field-foreground placeholder:text-field-placeholder focus-visible:outline-focus"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Alternar visibilidade da senha"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-field border border-watermelon-300 bg-watermelon-50 px-3.5 py-2.5 text-xs font-medium text-watermelon-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-field bg-shadow-grey px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-65"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Arandu</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
