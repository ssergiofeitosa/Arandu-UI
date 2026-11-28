import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Download,
  Globe,
  GraduationCap,
  Loader2,
  MessageSquare,
  RotateCcw,
  Smartphone,
  Star,
} from 'lucide-react'
import { BookCover } from '@/components/BookCover'
import { WebReaderModal } from '@/components/WebReaderModal'
import { useApp } from '@/context/AppContext'
import { cn, formatDateBR } from '@/lib/utils'
import { ApiError } from '@/services/api'
import {
  getCatalogBook,
  listBookReviews,
  submitBookReview,
} from '@/services/acervoService'
import type { Book, BookReview } from '@/types/arandu'

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { notify } = useApp()

  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [readerOpen, setReaderOpen] = useState(false)

  // Avaliações reais (/api/livros/<uuid>/avaliacoes/)
  const [reviews, setReviews] = useState<BookReview[]>([])
  const [reviewsTotal, setReviewsTotal] = useState(0)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const loadBookAndReviews = useCallback(async () => {
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setNotFound(false)
    setError('')
    try {
      const [bookData, reviewsData] = await Promise.all([
        getCatalogBook(id),
        listBookReviews(id, 1),
      ])
      setBook(bookData)
      setReviews(reviewsData.results)
      setReviewsTotal(reviewsData.count)
      if (bookData.myReview) {
        setMyRating(bookData.myReview.rating)
        setMyComment(bookData.myReview.comment || '')
      } else {
        setMyRating(0)
        setMyComment('')
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true)
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar os detalhes desta obra.',
        )
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadBookAndReviews()
  }, [loadBookAndReviews])

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!book) return
    if (myRating < 1 || myRating > 5) {
      setReviewError('Selecione uma nota de 1 a 5 estrelas.')
      return
    }

    setReviewError('')
    setSubmittingReview(true)
    try {
      await submitBookReview(book.id, myRating, myComment)
      notify({
        title: book.myReview ? 'Avaliação atualizada' : 'Avaliação publicada',
        description: `Você avaliou "${book.title}" com ${myRating}/5.`,
        variant: 'success',
      })
      setReviewsLoading(true)
      const [freshBook, freshReviews] = await Promise.all([
        getCatalogBook(book.id),
        listBookReviews(book.id, 1),
      ])
      setBook(freshBook)
      setReviews(freshReviews.results)
      setReviewsTotal(freshReviews.count)
    } catch (err) {
      setReviewError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível salvar sua avaliação agora.',
      )
    } finally {
      setSubmittingReview(false)
      setReviewsLoading(false)
    }
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/catalogo')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-2.5 px-5 py-24 text-sm text-muted">
        <Loader2 className="h-5 w-5 animate-spin text-brilliant-azure-600" />
        Carregando detalhes da obra...
      </div>
    )
  }

  if (notFound || !book) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        {error ? (
          <AlertCircle className="mx-auto h-10 w-10 text-watermelon-600" />
        ) : (
          <BookOpen className="mx-auto h-10 w-10 text-muted" />
        )}
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          {error ? 'Erro ao carregar obra' : 'Obra não encontrada'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {error || 'Este livro não está disponível no acervo ou foi ocultado.'}
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

  const activeLoan = book.myLoan
  const isPublicDomain = book.accessMode === 'public_domain'
  const isAvailable = book.available !== false

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-10 lg:px-10">
      <button
        type="button"
        onClick={handleBack}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Informações principais e Card de Leitura/Empréstimo */}
        <div className="order-1 min-w-0 lg:order-2 lg:col-span-8 lg:col-start-5">
          <div className="flex flex-wrap items-center gap-2">
            {book.categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs font-medium text-foreground"
              >
                {cat}
              </span>
            ))}
            {typeof book.ratingAvg === 'number' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold tabular-nums text-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                {book.ratingAvg.toFixed(1)} ({book.reviewsCount ?? 0})
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {book.title}
          </h1>
          <p className="mt-1.5 text-base font-medium text-brilliant-azure-700">por {book.author}</p>

          {/* Card interativo por modalidade de acesso */}
          <div className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
            {isPublicDomain ? (
              <div>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-light-green/60 px-3 py-1 text-xs font-semibold text-shadow-grey">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Domínio Público • Download direto
                    </span>
                    <h2 className="mt-2.5 text-lg font-bold text-foreground">
                      Baixe esta obra gratuitamente
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Arquivo em <strong className="text-foreground">{book.format}</strong> (
                      {book.fileSize}) pronto para leitura offline, sem precisar de empréstimo.
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!book.hasFile}
                      onClick={() =>
                        notify({
                          title: 'Endpoint de download em breve',
                          description:
                            'O download protegido autenticado (/download/) será conectado na próxima etapa.',
                        })
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-field bg-shadow-grey px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-focus disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      {book.hasFile ? `Baixar ${book.format}` : 'Arquivo não anexado'}
                    </button>

                    {book.canRead && (
                      <button
                        type="button"
                        onClick={() => setReaderOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-field border border-border bg-surface-secondary px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-default"
                      >
                        <BookOpen className="h-4 w-4" />
                        Ler online
                      </button>
                    )}
                  </div>
                </div>

                {/* Dica prática de apps gratuitos após baixar */}
                <div className="mt-5 flex items-start gap-3 rounded-md border border-border bg-surface-secondary p-3.5">
                  <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-brilliant-azure-700" />
                  <div className="text-xs leading-relaxed text-muted">
                    <p className="font-semibold text-foreground">
                      Dica de leitura após o download ({book.format})
                    </p>
                    <p className="mt-0.5">
                      {book.format === 'EPUB'
                        ? 'No celular, abra o arquivo .epub usando aplicativos gratuitos como ReadEra, Google Play Livros ou Lithium. No computador, você pode usar o Calibre.'
                        : 'No celular ou computador, abra o PDF direto no navegador ou com leitores gratuitos como ReadEra, Google Drive e Adobe Acrobat.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : !activeLoan ? (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brilliant-azure-50 px-3 py-1 text-xs font-semibold text-brilliant-azure-800">
                    <Globe className="h-3.5 w-3.5" />
                    Aluguel Temporário • Leitura em PDF no navegador
                  </span>
                  <h2 className="mt-2.5 text-lg font-bold text-foreground">
                    {isAvailable
                      ? 'Solicite o empréstimo para ler online'
                      : 'Sem exemplares disponíveis no momento'}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {isAvailable
                      ? `Exemplares disponíveis agora: ${book.quantityAvailable ?? 0} de ${book.quantityTotal ?? 1}.`
                      : 'Todos os exemplares digitais desta obra estão emprestados.'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() =>
                    notify({
                      title: 'Empréstimos ACID em breve',
                      description:
                        'O fluxo real de empréstimo (/api/emprestimos/) entra na próxima etapa (Épico 4).',
                    })
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-field bg-shadow-grey px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-focus disabled:opacity-50"
                >
                  <BookOpen className="h-4 w-4" />
                  Solicitar Empréstimo Temporário
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
                        {activeLoan.daysLeft === 1
                          ? 'Resta 1 dia'
                          : activeLoan.daysLeft <= 0
                            ? 'Vence hoje'
                            : `Restam ${activeLoan.daysLeft} dias`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-watermelon px-3 py-1 text-xs font-bold text-white">
                        Empréstimo Atrasado
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Prazo:{' '}
                      <strong className="text-foreground">{formatDateBR(activeLoan.dueAt)}</strong>
                    </span>
                  </div>

                  <Link
                    to="/meus-emprestimos"
                    className="text-xs font-semibold text-brilliant-azure-700 hover:underline"
                  >
                    Ir para Meus Empréstimos
                  </Link>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={!book.canRead}
                    onClick={() => setReaderOpen(true)}
                    className="inline-flex items-center gap-2 rounded-field bg-shadow-grey px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                  >
                    <BookOpen className="h-4 w-4" />
                    Ler no navegador
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      notify({
                        title: 'Devolução ACID em breve',
                        description: 'A devolução via API entra junto com o Épico 4.',
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-field border border-border bg-surface-secondary px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-default"
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

          {/* Curador */}
          <div className="mt-7 flex items-center gap-3.5 rounded-lg border border-border bg-surface-secondary p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-shadow-grey text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Disponibilizado no acervo por</p>
              <p className="text-sm font-bold text-foreground">{book.curatorName}</p>
            </div>
          </div>

          {/* Seção real de Avaliações */}
          <section aria-labelledby="reviews-heading" className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-separator pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-brilliant-azure-600" />
                <h2 id="reviews-heading" className="text-lg font-bold text-foreground">
                  Avaliações dos leitores ({reviewsTotal})
                </h2>
              </div>
              {typeof book.ratingAvg === 'number' && (
                <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-foreground">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                  {book.ratingAvg.toFixed(1)} / 5
                </span>
              )}
            </div>

            {/* Formulário de avaliação */}
            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3 rounded-field border border-border bg-surface-secondary p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {book.myReview ? 'Atualize sua avaliação' : 'Deixe sua avaliação'}
                </span>
                <div role="group" aria-label="Nota de 1 a 5 estrelas" className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setMyRating(star)
                        if (reviewError) setReviewError('')
                      }}
                      aria-label={`Nota ${star} de 5`}
                      aria-pressed={myRating === star}
                      className="rounded p-1 transition-transform hover:scale-110 focus-visible:outline-focus"
                    >
                      <Star
                        className={cn(
                          'h-5 w-5',
                          star <= myRating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-muted',
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={2}
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                placeholder="O que você achou desta leitura? (opcional)"
                aria-label="Comentário da avaliação"
                className="w-full rounded-field border border-border bg-background p-2.5 text-sm text-foreground placeholder:text-field-placeholder focus-visible:outline-focus"
              />

              {reviewError && (
                <p role="alert" className="text-xs font-medium text-watermelon-700">
                  {reviewError}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="inline-flex items-center gap-2 rounded-field bg-shadow-grey px-4 py-2 text-xs font-semibold text-white hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
                >
                  {submittingReview && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {book.myReview ? 'Atualizar avaliação' : 'Enviar avaliação'}
                </button>
              </div>
            </form>

            {/* Lista de avaliações */}
            <div className="mt-4 space-y-3">
              {reviewsLoading ? (
                <div className="flex items-center gap-2 py-4 text-xs text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Atualizando avaliações...
                </div>
              ) : reviews.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted">
                  Nenhuma avaliação ainda. Seja o primeiro a avaliar esta obra!
                </p>
              ) : (
                reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-field border border-border bg-background p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {review.userName}
                          {review.userClassRoom && (
                            <span className="ml-1.5 font-normal text-muted">
                              • {review.userClassRoom}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted">{formatDateBR(review.createdAt)}</p>
                      </div>
                      <div className="inline-flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'h-3.5 w-3.5',
                              star <= review.rating
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-border',
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm leading-relaxed text-foreground">
                        {review.comment}
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Capa 2:3 e ficha técnica */}
        <div className="order-2 min-w-0 lg:order-1 lg:col-span-4 lg:col-start-1 lg:row-start-1">
          <div className="mx-auto max-w-[220px] lg:max-w-none">
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
                <dt className="text-muted">Acesso</dt>
                <dd className="text-xs font-semibold text-foreground">
                  {isPublicDomain ? 'Domínio público (download)' : 'Aluguel temporário (web)'}
                </dd>
              </div>
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
              {!isPublicDomain && (
                <div className="flex items-center justify-between border-b border-separator pb-2">
                  <dt className="text-muted">Disponíveis</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {book.quantityAvailable ?? 0} / {book.quantityTotal ?? 1}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-separator pb-2">
                <dt className="text-muted">Ano</dt>
                <dd className="font-medium tabular-nums text-foreground">{book.year}</dd>
              </div>
              {book.publisherName && (
                <div className="flex items-center justify-between border-b border-separator pb-2">
                  <dt className="text-muted">Editora</dt>
                  <dd className="text-xs font-medium text-foreground">{book.publisherName}</dd>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-separator pb-2">
                <dt className="text-muted">ISBN</dt>
                <dd className="text-xs font-medium text-foreground">{book.isbn || 'Edição escolar'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Acessos</dt>
                <dd className="font-semibold tabular-nums text-foreground">{book.downloadsCount}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <WebReaderModal open={readerOpen} onClose={() => setReaderOpen(false)} book={book} />
    </div>
  )
}
