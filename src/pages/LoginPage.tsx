import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { BookCover } from '@/components/BookCover'
import { useApp } from '@/context/AppContext'
import { SCHOOL_NAME } from '@/data/mockData'

export function LoginPage() {
  const { login } = useApp()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Fluxo mockado: clicar em Entrar já acessa o sistema mesmo sem preencher nada
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = identifier.trim().toLowerCase()
    const guessedRole =
      normalized.includes('prof') || normalized.includes('carlos') ? 'teacher' : 'student'
    const nextRole = login(guessedRole)
    navigate(nextRole === 'teacher' ? '/admin-acervo' : '/catalogo')
  }

  return (
    <div className="grid min-h-[calc(100vh-68px)] lg:grid-cols-12">
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

          <h1 className="mt-8 max-w-md text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl">
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

      {/* Painel direito com formulário de entrada sem validação bloqueante */}
      <section className="flex items-center justify-center bg-background px-4 py-12 sm:px-8 lg:col-span-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Entrar no Arandu
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Não precisa preencher os campos nesta prévia — basta clicar em entrar.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-id" className="text-sm font-medium text-foreground">
                Matrícula ou E-mail institucional
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="login-id"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ex.: 2026-04819 (opcional)"
                  className="h-11 w-full rounded-field border border-border bg-field-background pl-10 pr-3.5 text-sm text-field-foreground placeholder:text-field-placeholder focus-visible:outline-focus"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-pass" className="text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="login-pass"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (opcional)"
                  className="h-11 w-full rounded-field border border-border bg-field-background pl-10 pr-10 text-sm text-field-foreground placeholder:text-field-placeholder focus-visible:outline-focus"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-field bg-shadow-grey px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-focus"
            >
              <span>Entrar no Arandu</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
