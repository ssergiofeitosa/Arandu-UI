import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  Star,
  X,
} from 'lucide-react'
import { BookCover } from '@/components/BookCover'
import { cn } from '@/lib/utils'
import { ApiError } from '@/services/api'
import { listCatalogBooks, listCategorias } from '@/services/acervoService'
import type { Book, BookFormat, CatalogCategory } from '@/types/arandu'

export function CatalogPage() {
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [totalBooks, setTotalBooks] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')
  const [selectedFormat, setSelectedFormat] = useState<'Todos' | BookFormat>('Todos')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPage(1)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    listCategorias()
      .then(setCategories)
      .catch(() => {
        // segue sem pílulas se categorias falharem
      })
  }, [])

  const loadBooks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await listCatalogBooks({
        page,
        pageSize: 12,
        search: debouncedQuery || undefined,
        categoria: selectedCategory !== 'Todas' ? selectedCategory : undefined,
        formato: selectedFormat !== 'Todos' ? selectedFormat : undefined,
      })
      setBooks(response.results)
      setTotalBooks(response.count)
      setTotalPages(Math.max(1, response.total_pages))
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar o catálogo digital.',
      )
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, page, selectedCategory, selectedFormat])

  useEffect(() => {
    void loadBooks()
  }, [loadBooks])

  const clearFilters = () => {
    setQuery('')
    setSelectedCategory('Todas')
    setSelectedFormat('Todos')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-10">
      {/* Cabeçalho e filtros */}
      <div className="rounded-lg border border-border bg-surface p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Catálogo Digital
            </h1>
            <p className="mt-1 text-sm text-muted">
              Escolha uma obra para consultar a sinopse, avaliar, baixar ou ler no navegador.
            </p>
          </div>
          <span className="text-xs font-medium text-muted">
            <strong className="tabular-nums text-foreground">{totalBooks}</strong>{' '}
            {totalBooks === 1 ? 'obra encontrada' : 'obras encontradas'}
          </span>
        </div>

        {/* Busca + formato */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título, autor ou ISBN..."
              aria-label="Buscar livros no catálogo"
              className="h-11 w-full rounded-field border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-field-placeholder focus-visible:outline-focus"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filtrar por formato"
            className="grid h-11 grid-cols-3 items-center rounded-field border border-border bg-surface-secondary p-1 md:inline-flex"
          >
            {(['Todos', 'PDF', 'EPUB'] as const).map((fmt) => {
              const active = selectedFormat === fmt
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    setSelectedFormat(fmt)
                    setPage(1)
                  }}
                  aria-pressed={active}
                  className={cn(
                    'rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors',
                    active ? 'bg-shadow-grey text-white' : 'text-muted hover:text-foreground',
                  )}
                >
                  {fmt}
                </button>
              )
            })}
          </div>
        </div>

        {/* Pílulas de categoria vindas da API */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('Todas')
              setPage(1)
            }}
            aria-pressed={selectedCategory === 'Todas'}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              selectedCategory === 'Todas'
                ? 'border-shadow-grey bg-light-green/60 font-semibold text-shadow-grey'
                : 'border-border bg-surface text-muted hover:text-foreground',
            )}
          >
            Todas
          </button>

          {categories.map((cat) => {
            const active = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id)
                  setPage(1)
                }}
                aria-pressed={active}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-shadow-grey bg-light-green/60 font-semibold text-shadow-grey'
                    : 'border-border bg-surface text-muted hover:text-foreground',
                )}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid de obras */}
      {error ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-14 text-center">
          <AlertCircle className="h-8 w-8 text-watermelon-600" />
          <h2 className="text-lg font-bold text-foreground">Erro ao carregar catálogo</h2>
          <p className="text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => void loadBooks()}
            className="mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-surface-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-default"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tentar novamente
          </button>
        </div>
      ) : loading ? (
        <div className="mt-10 flex items-center justify-center gap-2.5 py-14 text-sm text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-brilliant-azure-600" />
          Carregando obras do acervo...
        </div>
      ) : books.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted" />
          <h2 className="mt-3 text-lg font-bold text-foreground">Nenhuma obra encontrada</h2>
          <p className="mt-1 text-sm text-muted">
            {query || selectedCategory !== 'Todas' || selectedFormat !== 'Todos'
              ? 'Tente outro termo ou limpe os filtros para ver todo o acervo.'
              : 'O acervo ainda não possui obras publicadas. Peça ao bibliotecário para cadastrar livros no Painel do Acervo.'}
          </p>
          {(query || selectedCategory !== 'Todas' || selectedFormat !== 'Todos') && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-md border border-border bg-surface-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-default"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {books.map((book) => {
              const loan = book.myLoan
              const isAvailable = book.available !== false

              return (
                <Link
                  key={book.id}
                  to={`/livros/${book.id}`}
                  className="group flex flex-col rounded-lg border border-border bg-surface p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <BookCover
                    title={book.title}
                    author={book.author}
                    coverUrl={book.coverUrl}
                    format={book.format}
                    tone={book.fallbackTone}
                    size="md"
                  />

                  <div className="mt-3.5 flex flex-1 flex-col justify-between gap-2.5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] font-semibold text-brilliant-azure-700">
                          {book.categories[0] || 'Acervo'}
                        </p>
                        {typeof book.ratingAvg === 'number' && (
                          <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                            {book.ratingAvg.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-foreground group-hover:text-brilliant-azure-700">
                        {book.title}
                      </h2>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted">{book.author}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-separator pt-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-xs border border-border bg-surface-secondary px-2 py-0.5 text-[11px] font-bold text-foreground">
                          {book.format}
                        </span>
                        <span className="hidden text-[11px] font-medium text-muted sm:inline">
                          {book.accessMode === 'public_domain' ? 'Download' : 'Leitor web'}
                        </span>
                      </div>

                      {loan ? (
                        loan.status === 'atrasado' ? (
                          <span className="rounded-full bg-watermelon px-2.5 py-0.5 text-[11px] font-semibold text-white">
                            Atrasado
                          </span>
                        ) : (
                          <span className="rounded-full bg-shadow-grey px-2.5 py-0.5 text-[11px] font-semibold text-white">
                            Ativo • {Math.max(0, loan.daysLeft)}d
                          </span>
                        )
                      ) : isAvailable ? (
                        <span className="rounded-full bg-light-green/55 px-2.5 py-0.5 text-[11px] font-semibold text-shadow-grey">
                          Disponível
                        </span>
                      ) : (
                        <span className="rounded-full bg-default px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                          Indisponível
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-xs text-muted">
              <span>
                Página <strong className="text-foreground">{page}</strong> de{' '}
                <strong className="text-foreground">{totalPages}</strong> • {totalBooks} obra(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-field border border-border bg-surface-secondary px-3 py-1.5 font-semibold text-foreground hover:bg-default disabled:opacity-45"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-field border border-border bg-surface-secondary px-3 py-1.5 font-semibold text-foreground hover:bg-default disabled:opacity-45"
                >
                  Próxima
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
