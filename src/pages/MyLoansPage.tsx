import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, BookOpen, Calendar, Download, RotateCcw } from 'lucide-react'
import { BookCover } from '@/components/BookCover'
import { WebReaderModal } from '@/components/WebReaderModal'
import { useApp } from '@/context/AppContext'
import { cn, formatDateBR, getRemainingDays } from '@/lib/utils'
import type { Book, LoanStatus } from '@/types/arandu'

export function MyLoansPage() {
  const { user, books, loans, downloadBook, returnBook, borrowBook } = useApp()
  const [activeTab, setActiveTab] = useState<LoanStatus>('ativo')
  const [readingBook, setReadingBook] = useState<Book | null>(null)

  const entries = loans
    .map((loan) => ({
      loan,
      book: books.find((b) => b.id === loan.bookId),
    }))
    .filter((entry): entry is { loan: typeof entry.loan; book: NonNullable<typeof entry.book> } =>
      Boolean(entry.book),
    )

  const counts = {
    ativo: entries.filter((e) => e.loan.status === 'ativo').length,
    atrasado: entries.filter((e) => e.loan.status === 'atrasado').length,
    devolvido: entries.filter((e) => e.loan.status === 'devolvido').length,
  }

  const visibleEntries = entries.filter((e) => e.loan.status === activeTab)

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-10 lg:px-10">
      {/* Cabeçalho do aluno */}
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brilliant-azure-700">
            Estante do Estudante
            {user?.enrollmentId && (
              <>
                {' '}•{' '}
                <span className="whitespace-nowrap">Matrícula {user.enrollmentId}</span>
              </>
            )}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Meus Empréstimos
          </h1>
          <p className="mt-1 text-sm text-muted">
            {user?.name || 'Estudante'}
            {user?.classRoom ? ` • ${user.classRoom.nome}` : ''}
          </p>
        </div>

        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 rounded-field border border-border bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-default"
        >
          Explorar catálogo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Abas por status */}
      <div
        role="tablist"
        aria-label="Filtrar empréstimos por status"
        className="mt-7 inline-flex flex-wrap gap-1 rounded-lg border border-border bg-surface-secondary p-1"
      >
        {(
          [
            { id: 'ativo', label: 'Ativos', badgeClass: 'bg-light-green/70 text-shadow-grey' },
            { id: 'atrasado', label: 'Atrasados', badgeClass: 'bg-watermelon text-white' },
            { id: 'devolvido', label: 'Devolvidos', badgeClass: 'bg-default text-foreground' },
          ] as const
        ).map((tab) => {
          const isSelected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-surface font-semibold text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground',
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                  tab.badgeClass,
                )}
              >
                {counts[tab.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista de empréstimos */}
      <div className="mt-6 space-y-4">
        {activeTab === 'atrasado' && counts.atrasado > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-watermelon-300 bg-watermelon-50 p-4 text-sm text-watermelon-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Você possui obras com o prazo de empréstimo encerrado. Clique em{' '}
              <strong>Devolver agora</strong> para regularizar sua estante.
            </p>
          </div>
        )}

        {visibleEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted" />
            <h2 className="mt-3 text-lg font-bold text-foreground">
              Nenhum empréstimo nesta aba
            </h2>
            <p className="mt-1 text-sm text-muted">
              Explore o catálogo digital para solicitar novos livros gratuitamente.
            </p>
          </div>
        ) : (
          visibleEntries.map(({ loan, book }) => {
            const daysLeft = getRemainingDays(loan.dueAt)
            const totalWindowDays = Math.max(1, getRemainingDays(loan.dueAt) + Math.max(0, Math.round((Date.now() - new Date(loan.borrowedAt).getTime()) / (1000 * 60 * 60 * 24))))
            const progress =
              loan.status === 'ativo'
                ? Math.max(10, Math.min(100, Math.round((daysLeft / totalWindowDays) * 100)))
                : 100

            return (
              <article
                key={loan.id}
                className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <Link to={`/livros/${book.id}`} className="w-24 shrink-0">
                  <BookCover
                    title={book.title}
                    author={book.author}
                    coverUrl={book.coverUrl}
                    format={book.format}
                    tone={book.fallbackTone}
                    size="sm"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {loan.status === 'ativo' && (
                      <span className="rounded-full bg-light-green/70 px-2.5 py-0.5 text-[11px] font-bold text-shadow-grey">
                        Ativo • {daysLeft <= 0 ? 'Vence hoje' : `Restam ${daysLeft}d`}
                      </span>
                    )}
                    {loan.status === 'atrasado' && (
                      <span className="rounded-full bg-watermelon px-2.5 py-0.5 text-[11px] font-bold text-white">
                        Atrasado ({Math.abs(daysLeft)}d)
                      </span>
                    )}
                    {loan.status === 'devolvido' && (
                      <span className="rounded-full bg-default px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                        Devolvido
                      </span>
                    )}

                    <span className="rounded-xs border border-border bg-surface-secondary px-2 py-0.5 text-[11px] font-bold text-foreground">
                      {book.format}
                    </span>
                    <span className="text-xs text-muted">
                      {book.accessMode === 'temporary_loan'
                        ? 'Leitura no navegador'
                        : `${book.fileSize} • Domínio público`}
                    </span>
                  </div>

                  <Link
                    to={`/livros/${book.id}`}
                    className="mt-2 block text-lg font-bold text-foreground hover:text-brilliant-azure-700"
                  >
                    {book.title}
                  </Link>
                  <p className="text-sm text-muted">{book.author}</p>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Retirado em <strong className="text-foreground">{formatDateBR(loan.borrowedAt)}</strong>
                    </span>
                    <span>
                      {loan.status === 'devolvido' ? 'Devolvido em ' : 'Prazo limite: '}
                      <strong className="text-foreground">
                        {formatDateBR(
                          loan.status === 'devolvido' ? loan.returnedAt || loan.dueAt : loan.dueAt,
                        )}
                      </strong>
                    </span>
                  </div>

                  {loan.status === 'ativo' && book.accessMode === 'public_domain' && (
                    <p className="mt-2 text-xs text-muted">
                      Dica: abra o arquivo {book.format} com ReadEra ou Google Play Livros no celular.
                    </p>
                  )}

                  {loan.status !== 'devolvido' && (
                    <div className="mt-3 max-w-sm">
                      <div
                        role="progressbar"
                        aria-label={`Tempo restante de empréstimo para ${book.title}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        className="h-2 w-full overflow-hidden rounded-full bg-default"
                      >
                        <div
                          style={{ width: `${progress}%` }}
                          className={cn(
                            'h-full rounded-full transition-all',
                            loan.status === 'atrasado'
                              ? 'bg-watermelon'
                              : daysLeft <= 2
                                ? 'bg-warning'
                                : 'bg-accent',
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                  {loan.status === 'ativo' && (
                    <>
                      {book.accessMode === 'temporary_loan' ? (
                        <button
                          type="button"
                          onClick={() => setReadingBook(book)}
                          className="inline-flex items-center justify-center gap-2 rounded-field bg-shadow-grey px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Ler no navegador
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => downloadBook(book.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-field bg-shadow-grey px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Baixar {book.format}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => returnBook(loan.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-field border border-border bg-surface-secondary px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-default"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Devolver
                      </button>
                    </>
                  )}

                  {loan.status === 'atrasado' && (
                    <button
                      type="button"
                      onClick={() => returnBook(loan.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-field bg-watermelon px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-watermelon-600"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Devolver agora
                    </button>
                  )}

                  {loan.status === 'devolvido' && (
                    <button
                      type="button"
                      onClick={() => borrowBook(book.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-field border border-border bg-surface-secondary px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-default"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Emprestar novamente
                    </button>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>

      <WebReaderModal
        open={Boolean(readingBook)}
        onClose={() => setReadingBook(null)}
        book={readingBook}
      />
    </div>
  )
}
