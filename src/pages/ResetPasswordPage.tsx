import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from 'lucide-react'
import { BookCover } from '@/components/BookCover'
import { SCHOOL_NAME } from '@/data/mockData'
import { ApiError } from '@/services/api'
import { confirmPasswordReset } from '@/services/authService'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''
  const hasResetParams = Boolean(uid.trim() && token.trim())

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!novaSenha || !confirmarNovaSenha) {
      setError('Preencha e confirme a nova senha.')
      return
    }
    if (novaSenha !== confirmarNovaSenha) {
      setError('As senhas informadas não coincidem.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const detail = await confirmPasswordReset({
        uid,
        token,
        novaSenha,
        confirmarNovaSenha,
      })
      setSuccessMessage(detail)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Não foi possível redefinir sua senha. Tente solicitar um novo link.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-69px)] lg:grid-cols-12">
      <aside className="flex flex-col justify-between bg-shadow-grey px-6 py-10 text-white sm:px-10 lg:col-span-6 lg:px-14 lg:py-14">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-medium text-shadow-grey-200 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao login
          </Link>

          <div className="mt-8">
            <img
              src="/arandu-logo-clear.svg"
              alt="Arandu · Saber Digital"
              className="h-[34px] w-auto select-none"
            />
          </div>

          <h1 className="mt-8 max-w-md text-balance text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl">
            Crie uma nova senha segura para sua conta.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-shadow-grey-200 sm:text-base">
            O link de redefinição tem uso único para proteger o acesso dos estudantes e docentes do{' '}
            <strong className="font-semibold text-white">{SCHOOL_NAME}</strong>.
          </p>
        </div>

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

      <section className="flex items-center justify-center bg-background px-4 py-12 sm:px-8 lg:col-span-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Redefinir senha
          </h2>

          {!hasResetParams ? (
            <div className="mt-6 space-y-5">
              <div
                role="alert"
                className="flex items-start gap-3 rounded-field border border-watermelon-300 bg-watermelon-50 p-4 text-sm text-watermelon-800"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Link de redefinição incompleto</p>
                  <p className="mt-1 text-xs leading-relaxed">
                    Abra o link completo recebido por e-mail ou solicite uma nova recuperação de
                    senha.
                  </p>
                </div>
              </div>

              <Link
                to="/esqueci-senha"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-field bg-shadow-grey px-5 text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-focus"
              >
                Solicitar novo link
              </Link>
            </div>
          ) : successMessage ? (
            <div className="mt-6 space-y-5">
              <div
                role="status"
                className="flex items-start gap-3 rounded-field border border-light-green-400 bg-light-green/25 p-4 text-sm text-foreground"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-shadow-grey" />
                <div>
                  <p className="font-semibold">Senha atualizada</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{successMessage}</p>
                </div>
              </div>

              <Link
                to="/login"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-field bg-shadow-grey px-5 text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-focus"
              >
                <span>Ir para o login</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-1.5 text-sm text-muted">
                Escolha uma nova senha que você não utilize em outros serviços.
              </p>

              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="reset-password" className="text-sm font-medium text-foreground">
                    Nova senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={novaSenha}
                      onChange={(e) => {
                        setNovaSenha(e.target.value)
                        if (error) setError('')
                      }}
                      placeholder="Digite sua nova senha"
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

                <div className="space-y-1.5">
                  <label
                    htmlFor="reset-password-confirm"
                    className="text-sm font-medium text-foreground"
                  >
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      id="reset-password-confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmarNovaSenha}
                      onChange={(e) => {
                        setConfirmarNovaSenha(e.target.value)
                        if (error) setError('')
                      }}
                      placeholder="Repita a nova senha"
                      className="h-11 w-full rounded-field border border-border bg-field-background pl-10 pr-3.5 text-sm text-field-foreground placeholder:text-field-placeholder focus-visible:outline-focus"
                    />
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
                      <span>Salvando nova senha...</span>
                    </>
                  ) : (
                    <>
                      <span>Salvar nova senha</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
