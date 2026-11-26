import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Download,
  GraduationCap,
  RotateCcw,
} from 'lucide-react'
import { BookCover } from '@/components/BookCover'
import { useApp } from '@/context/AppContext'
import { formatDateBR, getRemainingDays } from '@/lib/utils'

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { books, getActiveLoan, borrowBook, returnBook, downloadBook } = useApp()

  const book = books.find((b) => b.id === id)

  if (!book) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-muted" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Obra não encontrada</h1>
        <p className="mt-2 text-sm text-muted">
          Este livro não está disponível no acervo ou foi removido.
        </p>
        <Link
          to="/catalogo"
          className="mt-6 inline-flex rounded-field bg-shadow-grey px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent hover:text-accent-foreground"
        >
          Voltar ao catálogo
        </Link>
      </div>
    )
  }

  const activeLoan = getActiveLoan(book.id)
  const remainingDays = activeLoan ? getRemainingDays(activeLoan.dueAt) : 0

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-10 lg:px-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Capa 2:3 e ficha técnica */}
        <div className="min-w-0 lg:col-span-4">
          <div className="mx-auto max-w-[260px] lg:max-w-none">
            <BookCover
              title={book.title}
              author={book.author}
              coverUrl={book.coverUrl}
              format={book.format}
              tone={book.fallbackTone}
              size="lg"
            />
          </div>

          <div className="mt-5 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Ficha Técnica
            </h2>
            <dl className="mt-3.5 space-y-2.5 text-sm">
              <div className="flex items-center justify-between border-b border-separator pb-2">
                <dt className="text-muted">Formato</dt>
                <dd className="rounded-xs border border-border bg-surface-secondary px-2 py-0.5 text-xs font-bold text-foreground">
                  {book.format}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-separator pb-2">
                <dt className="text-muted">Tamanho</dt>
                <dd className="font-medium tabular-nums text-foreground">{book.fileSize}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-separator pb-2">
                <dt className="text-muted">Páginas</dt>
                <dd className="font-medium tabular-nums text-foreground">{book.pages} págs.</dd>
              </div>
              <div className="flex items-center justify-between border-b border-separator pb-2">
                <dt className="text-muted">Ano</dt>
                <dd className="font-medium tabular-nums text-foreground">{book.year}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-separator pb-2">
                <dt className="text-muted">ISBN</dt>
                <dd className="text-xs font-medium text-foreground">{book.isbn || 'Edição escolar'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Downloads</dt>
                <dd className="font-semibold tabular-nums text-foreground">{book.downloadsCount}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Informações e Card de Empréstimo */}
        <div className="min-w-0 lg:col-span-8">
          <div className="flex flex-wrap gap-2">
            {book.categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs font-medium text-foreground"
              >
                {cat}
              </span>
            ))}
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {book.title}
          </h1>
          <p className="mt-1.5 text-base font-medium text-brilliant-azure-700">por {book.author}</p>

          {/* Card interativo de empréstimo */}
          <div className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
            {!activeLoan ? (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-light-green/60 px-3 py-1 text-xs font-semibold text-shadow-grey">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Disponível para empréstimo
                  </span>
                  <h2 className="mt-2.5 text-lg font-bold text-foreground">
                    Solicite a cópia digital gratuita por 7 dias
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Download liberado imediatamente em {book.format} ({book.fileSize}).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => borrowBook(book.id)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-field bg-shadow-grey px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-focus"
                >
                  <BookOpen className="h-4 w-4" />
                  Solicitar Empréstimo Digital (7 dias)
                </button>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {activeLoan.status === 'ativo' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-light-green/70 px-3 py-1 text-xs font-bold text-shadow-grey">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Empréstimo Ativo •{' '}
                        {remainingDays === 1
                          ? 'Resta 1 dia'
                          : remainingDays <= 0
                            ? 'Vence hoje'
                            : `Restam ${remainingDays} dias`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-watermelon px-3 py-1 text-xs font-bold text-white">
                        Empréstimo Atrasado
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Prazo: <strong className="text-foreground">{formatDateBR(activeLoan.dueAt)}</strong>
                    </span>
                  </div>

                  <Link
                    to="/meus-emprestimos"
                    className="text-xs font-semibold text-brilliant-azure-700 hover:underline"
                  >
                    Ir para Meus Empréstimos
                  </Link>
                </div>

                <p className="mt-3 text-sm text-muted">
                  Arquivo <span className="font-medium text-foreground">{book.fileName}</span>{' '}
                  pronto para leitura offline.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => downloadBook(book.id)}
                    className="inline-flex items-center gap-2 rounded-field bg-shadow-grey px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-focus"
                  >
                    <Download className="h-4 w-4" />
                    Baixar {book.format} ({book.fileSize})
                  </button>
                  <button
                    type="button"
                    onClick={() => returnBook(activeLoan.id)}
                    className="inline-flex items-center gap-2 rounded-field border border-border bg-surface-secondary px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-default focus-visible:outline-focus"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Devolver agora
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sinopse */}
          <div className="mt-7">
            <h2 className="text-xl font-bold text-foreground">Sinopse</h2>
            <div className="mt-3 max-w-[68ch] space-y-3 text-sm leading-relaxed text-foreground sm:text-base">
              {book.synopsis.split('\n\n').map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>

          {/* Professor curador */}
          <div className="mt-7 flex items-center gap-3.5 rounded-lg border border-border bg-surface-secondary p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-shadow-grey text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Disponibilizado no acervo por</p>
              <p className="text-sm font-bold text-foreground">{book.curatorName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
