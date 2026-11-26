import { useEffect, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Minus, Plus, ShieldCheck, X } from 'lucide-react'
import { DialogModal } from '@/components/ui/DialogModal'
import { cn } from '@/lib/utils'
import type { Book } from '@/types/arandu'

interface WebReaderModalProps {
  open: boolean
  onClose: () => void
  book: Book | null
}

type ReaderTheme = 'light' | 'sepia' | 'dark'

const THEME_STYLES: Record<ReaderTheme, { label: string; surface: string; muted: string; border: string }> = {
  light: {
    label: 'Claro',
    surface: 'bg-surface text-foreground',
    muted: 'text-muted',
    border: 'border-border',
  },
  sepia: {
    label: 'Sépia',
    surface: 'bg-[#f6efe2] text-[#2b241d]',
    muted: 'text-[#5b4d3f]',
    border: 'border-[#dfd2bd]',
  },
  dark: {
    label: 'Escuro',
    surface: 'bg-shadow-grey-900 text-shadow-grey-50',
    muted: 'text-shadow-grey-300',
    border: 'border-shadow-grey-700',
  },
}

export function WebReaderModal({ open, onClose, book }: WebReaderModalProps) {
  const [page, setPage] = useState(1)
  const [fontSize, setFontSize] = useState(16)
  const [theme, setTheme] = useState<ReaderTheme>('light')

  useEffect(() => {
    if (open) {
      setPage(1)
    }
  }, [book?.id, open])

  if (!book) return null

  const totalPages = Math.max(1, book.pages)
  const themeStyle = THEME_STYLES[theme]
  const paragraphs = book.synopsis.split('\n\n').filter(Boolean)

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      labelledBy="web-reader-title"
      maxWidthClass="max-w-3xl"
      className={cn('p-0 transition-colors', themeStyle.surface)}
    >
      {/* Cabeçalho do leitor */}
      <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5', themeStyle.border)}>
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brilliant-azure-600">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Leitura no navegador • Aluguel temporário
          </div>
          <h2 id="web-reader-title" className="truncate text-base font-bold sm:text-lg">
            {book.title}
          </h2>
          <p className={cn('truncate text-xs', themeStyle.muted)}>{book.author}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar leitor no navegador"
          className="rounded-md p-2 text-muted transition-colors hover:bg-black/10 hover:text-current focus-visible:outline-focus"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Barra de controles tipográficos e tema */}
      <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b px-5 py-2.5 text-xs', themeStyle.border)}>
        <div className="flex items-center gap-1.5">
          <span className={cn('mr-1 font-medium', themeStyle.muted)}>Texto:</span>
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.max(14, s - 2))}
            aria-label="Diminuir tamanho da fonte"
            className={cn('inline-flex h-7 w-7 items-center justify-center rounded-sm border', themeStyle.border)}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[3ch] text-center font-semibold tabular-nums">{fontSize}</span>
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.min(22, s + 2))}
            aria-label="Aumentar tamanho da fonte"
            className={cn('inline-flex h-7 w-7 items-center justify-center rounded-sm border', themeStyle.border)}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div role="group" aria-label="Tema de leitura" className="flex items-center gap-1">
          {(Object.keys(THEME_STYLES) as ReaderTheme[]).map((key) => {
            const active = theme === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                aria-pressed={active}
                className={cn(
                  'rounded-sm border px-2.5 py-1 text-xs font-semibold transition-colors',
                  active
                    ? 'border-shadow-grey bg-accent text-accent-foreground'
                    : cn(themeStyle.border, themeStyle.muted),
                )}
              >
                {THEME_STYLES[key].label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Área de leitura */}
      <div className="mx-auto max-w-[65ch] px-6 py-7 sm:px-10 sm:py-9">
        <p className={cn('text-xs font-semibold uppercase tracking-wider', themeStyle.muted)}>
          Capítulo {Math.min(Math.ceil(page / 12), 18)} • Página {page} de {totalPages}
        </p>

        <div
          style={{ fontSize: `${fontSize}px` }}
          className="mt-4 space-y-5 leading-relaxed"
        >
          {page === 1 ? (
            <>
              <p className="font-semibold">Apresentação da edição escolar</p>
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <p>
                Esta visualização web mantém a obra acessível em qualquer celular ou computador do{' '}
                <strong>Colégio Estadual de Tempo Integral Paulo José de Oliveira</strong> durante o
                período do empréstimo temporário, sem necessidade de baixar leitores externos.
              </p>
            </>
          ) : (
            <>
              <p>
                Trecho ilustrativo de leitura contínua referente à página{' '}
                <strong className="tabular-nums">{page}</strong> de <em>{book.title}</em> ({book.author},{' '}
                {book.year}). Na integração com o backend Django, o conteúdo completo paginado será
                carregado sob demanda para leitura leve mesmo em conexões móveis limitadas.
              </p>
              {paragraphs[0] && <p className={themeStyle.muted}>{paragraphs[0]}</p>}
            </>
          )}
        </div>
      </div>

      {/* Rodapé de paginação */}
      <div className={cn('flex items-center justify-between gap-3 border-t px-5 py-3.5', themeStyle.border)}>
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-field border px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-45',
            themeStyle.border,
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Página anterior
        </button>

        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium tabular-nums', themeStyle.muted)}>
          <BookOpen className="h-3.5 w-3.5" />
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-field bg-shadow-grey px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-45',
          )}
        >
          Próxima página
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </DialogModal>
  )
}
