import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Search, X } from 'lucide-react'
import { BookCover } from '@/components/BookCover'
import { useApp } from '@/context/AppContext'
import { CATEGORIES } from '@/data/mockData'
import { cn, getRemainingDays } from '@/lib/utils'
import type { BookFormat, Category } from '@/types/arandu'

export function CatalogPage() {
  const { books, getActiveLoan } = useApp()
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | Category>('Todas')
  const [selectedFormat, setSelectedFormat] = useState<'Todos' | BookFormat>('Todos')

  const visibleBooks = useMemo(() => books.filter((b) => b.visible), [books])

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return visibleBooks.filter((book) => {
      const matchesCat = selectedCategory === 'Todas' || book.categories.includes(selectedCategory)
      const matchesFmt = selectedFormat === 'Todos' || book.format === selectedFormat
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        (book.isbn && book.isbn.toLowerCase().includes(q))
      return matchesCat && matchesFmt && matchesQuery
    })
  }, [query, selectedCategory, selectedFormat, visibleBooks])

  const clearFilters = () => {
    setQuery('')
    setSelectedCategory('Todas')
    setSelectedFormat('Todos')
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
              Escolha uma obra para ler a sinopse e solicitar o empréstimo por 7 dias.
            </p>
          </div>
          <span className="text-xs font-medium text-muted">
            <strong className="tabular-nums text-foreground">{filteredBooks.length}</strong> obras
            exibidas
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
            className="inline-flex h-11 items-center rounded-field border border-border bg-surface-secondary p-1"
          >
            {(['Todos', 'PDF', 'EPUB'] as const).map((fmt) => {
              const active = selectedFormat === fmt
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors',
                    active ? 'bg-shadow-grey text-white' : 'text-muted hover:text-foreground',
                  )}
                >
                  {fmt === 'Todos' ? 'Todos' : fmt}
                </button>
              )
            })}
          </div>
        </div>

        {/* Pílulas de categoria */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(['Todas', ...CATEGORIES] as const).map((cat) => {
            const active = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={active}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-shadow-grey bg-light-green/60 font-semibold text-shadow-grey'
                    : 'border-border bg-surface text-muted hover:text-foreground',
                )}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid de obras */}
      {filteredBooks.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted" />
          <h2 className="mt-3 text-lg font-bold text-foreground">Nenhuma obra encontrada</h2>
          <p className="mt-1 text-sm text-muted">
            Tente outro termo ou limpe os filtros para ver todo o acervo.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-md border border-border bg-surface-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-default"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {filteredBooks.map((book) => {
            const loan = getActiveLoan(book.id)
            const daysLeft = loan ? getRemainingDays(loan.dueAt) : 0

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
                    <p className="truncate text-[11px] font-semibold text-brilliant-azure-700">
                      {book.categories[0]}
                    </p>
                    <h2 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-foreground group-hover:text-brilliant-azure-700">
                      {book.title}
                    </h2>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted">{book.author}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-separator pt-2.5">
                    <span className="rounded-xs border border-border bg-surface-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                      {book.format}
                    </span>

                    {!loan ? (
                      <span className="rounded-full bg-light-green/55 px-2.5 py-0.5 text-[11px] font-semibold text-shadow-grey">
                        Disponível
                      </span>
                    ) : loan.status === 'atrasado' ? (
                      <span className="rounded-full bg-watermelon px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        Atrasado
                      </span>
                    ) : (
                      <span className="rounded-full bg-shadow-grey px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        Ativo • {daysLeft}d
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
