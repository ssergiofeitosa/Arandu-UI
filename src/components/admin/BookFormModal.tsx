import React, { useEffect, useRef, useState } from 'react'
import { Check, FileUp, ImagePlus, UploadCloud, X } from 'lucide-react'
import { BookCover } from '@/components/BookCover'
import { DialogModal } from '@/components/ui/DialogModal'
import type { NewBookPayload } from '@/context/AppContext'
import { CATEGORIES, TEACHER_USER } from '@/data/mockData'
import { cn, formatFileSize, slugifyFilename } from '@/lib/utils'
import type { Book, BookAccessMode, BookFormat, Category, FallbackTone } from '@/types/arandu'

interface BookFormModalProps {
  open: boolean
  onClose: () => void
  editingBook: Book | null
  onSave: (payload: NewBookPayload, editingId?: string) => void
}

const TONES: { id: FallbackTone; label: string }[] = [
  { id: 'shadow', label: 'Grafite' },
  { id: 'azure', label: 'Azul' },
  { id: 'peach', label: 'Pêssego' },
  { id: 'green', label: 'Claro' },
]

export function BookFormModal({ open, onClose, editingBook, onSave }: BookFormModalProps) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [pages, setPages] = useState('120')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [synopsis, setSynopsis] = useState('')
  const [categories, setCategories] = useState<Category[]>(['Literatura Brasileira'])
  const [format, setFormat] = useState<BookFormat>('PDF')
  const [accessMode, setAccessMode] = useState<BookAccessMode>('public_domain')
  const [visible, setVisible] = useState(true)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined)
  const [tone, setTone] = useState<FallbackTone>('shadow')
  const [error, setError] = useState('')
  const blobUrlRef = useRef<string | null>(null)

  const revokeBlobCover = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      revokeBlobCover()
    }
  }, [])

  useEffect(() => {
    if (!open) return
    revokeBlobCover()
    if (editingBook) {
      setTitle(editingBook.title)
      setAuthor(editingBook.author)
      setIsbn(editingBook.isbn || '')
      setPages(String(editingBook.pages))
      setYear(String(editingBook.year))
      setSynopsis(editingBook.synopsis)
      setCategories(editingBook.categories)
      setFormat(editingBook.format)
      setAccessMode(editingBook.accessMode)
      setVisible(editingBook.visible)
      setFileName(editingBook.fileName)
      setFileSize(editingBook.fileSize)
      setCoverUrl(editingBook.coverUrl)
      setTone(editingBook.fallbackTone || 'shadow')
      setError('')
    } else {
      setTitle('')
      setAuthor('')
      setIsbn('')
      setPages('120')
      setYear(String(new Date().getFullYear()))
      setSynopsis('')
      setCategories(['Literatura Brasileira'])
      setFormat('PDF')
      setAccessMode('public_domain')
      setVisible(true)
      setFileName('')
      setFileSize('')
      setCoverUrl(undefined)
      setTone('shadow')
      setError('')
    }
  }, [editingBook, open])

  const toggleCategory = (cat: Category) => {
    setCategories((prev) =>
      prev.includes(cat) ? (prev.length > 1 ? prev.filter((c) => c !== cat) : prev) : [...prev, cat],
    )
  }

  const handleFilePick = (file: File) => {
    const isEpub = file.name.toLowerCase().endsWith('.epub')
    setFormat(isEpub ? 'EPUB' : 'PDF')
    setFileName(file.name)
    setFileSize(formatFileSize(file.size))
    setError('')
  }

  const attachDemoFile = (demoFmt: BookFormat) => {
    setFormat(demoFmt)
    setFileName(slugifyFilename(title.trim() || 'material-arandu', demoFmt))
    setFileSize(demoFmt === 'PDF' ? '2,4 MB' : '1,2 MB')
    setError('')
  }

  const handleCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    revokeBlobCover()
    const nextUrl = URL.createObjectURL(file)
    blobUrlRef.current = nextUrl
    setCoverUrl(nextUrl)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !author.trim()) {
      setError('Informe ao menos título e autor da obra.')
      return
    }
    const parsedPages = Number.parseInt(pages, 10)
    const parsedYear = Number.parseInt(year, 10)
    const resolvedPages = Number.isFinite(parsedPages) && parsedPages > 0 ? parsedPages : 120
    const resolvedYear =
      Number.isFinite(parsedYear) && parsedYear >= 1500 && parsedYear <= 2100
        ? parsedYear
        : new Date().getFullYear()

    const resolvedFile = fileName || slugifyFilename(title, format)
    onSave(
      {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim() || undefined,
        categories,
        format,
        accessMode,
        fileName: resolvedFile,
        fileSize: fileSize || '2,1 MB',
        pages: resolvedPages,
        year: resolvedYear,
        synopsis:
          synopsis.trim() ||
          'Material digital publicado pela equipe docente para leitura gratuita dos estudantes.',
        curatorName: editingBook?.curatorName ?? TEACHER_USER.name,
        visible,
        coverUrl,
        fallbackTone: tone,
      },
      editingBook?.id,
    )
    onClose()
  }

  const titleMissing = Boolean(error && !title.trim())
  const authorMissing = Boolean(error && !author.trim())

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      labelledBy="modal-book-title"
      maxWidthClass="max-w-3xl"
      className="p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4 border-b border-separator pb-4">
        <div>
          <h2 id="modal-book-title" className="text-xl font-bold text-foreground">
            {editingBook ? 'Editar obra do acervo' : 'Publicar novo livro digital'}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Preencha os metadados, modalidade de acesso e arquivo PDF ou EPUB para o catálogo.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="rounded-md p-1.5 text-muted hover:bg-default hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <div className="grid gap-5 md:grid-cols-12">
          <div className="space-y-3.5 md:col-span-8">
            <div>
              <label htmlFor="book-title" className="text-xs font-semibold text-foreground">
                Título da obra *
              </label>
              <input
                id="book-title"
                required
                aria-invalid={titleMissing}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Ex.: Memórias Póstumas de Brás Cubas"
                className={cn(
                  'mt-1 h-10 w-full rounded-field border bg-background px-3.5 text-sm text-foreground focus-visible:outline-focus',
                  titleMissing ? 'border-watermelon-500' : 'border-border',
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="book-author" className="text-xs font-semibold text-foreground">
                  Autor(a) *
                </label>
                <input
                  id="book-author"
                  required
                  aria-invalid={authorMissing}
                  value={author}
                  onChange={(e) => {
                    setAuthor(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Ex.: Machado de Assis"
                  className={cn(
                    'mt-1 h-10 w-full rounded-field border bg-background px-3.5 text-sm text-foreground focus-visible:outline-focus',
                    authorMissing ? 'border-watermelon-500' : 'border-border',
                  )}
                />
              </div>
              <div>
                <label htmlFor="book-isbn" className="text-xs font-semibold text-foreground">
                  ISBN (opcional)
                </label>
                <input
                  id="book-isbn"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-85-000-0000-0"
                  className="mt-1 h-10 w-full rounded-field border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-focus"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="book-pages" className="text-xs font-semibold text-foreground">
                  Páginas
                </label>
                <input
                  id="book-pages"
                  type="number"
                  min={1}
                  max={5000}
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="mt-1 h-10 w-full rounded-field border border-border bg-background px-3.5 text-sm tabular-nums text-foreground focus-visible:outline-focus"
                />
              </div>
              <div>
                <label htmlFor="book-year" className="text-xs font-semibold text-foreground">
                  Ano da edição
                </label>
                <input
                  id="book-year"
                  type="number"
                  min={1500}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="mt-1 h-10 w-full rounded-field border border-border bg-background px-3.5 text-sm tabular-nums text-foreground focus-visible:outline-focus"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="text-xs font-semibold text-foreground">Modalidade de acesso</span>
                <div role="group" aria-label="Modalidade de acesso" className="mt-1.5 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    aria-pressed={accessMode === 'public_domain'}
                    onClick={() => setAccessMode('public_domain')}
                    className={cn(
                      'rounded-field border px-2.5 py-2 text-xs font-semibold transition-colors',
                      accessMode === 'public_domain'
                        ? 'border-shadow-grey bg-shadow-grey text-white'
                        : 'border-border bg-surface-secondary text-foreground hover:bg-default',
                    )}
                  >
                    Domínio público
                  </button>
                  <button
                    type="button"
                    aria-pressed={accessMode === 'temporary_loan'}
                    onClick={() => setAccessMode('temporary_loan')}
                    className={cn(
                      'rounded-field border px-2.5 py-2 text-xs font-semibold transition-colors',
                      accessMode === 'temporary_loan'
                        ? 'border-shadow-grey bg-shadow-grey text-white'
                        : 'border-border bg-surface-secondary text-foreground hover:bg-default',
                    )}
                  >
                    Aluguel temporário
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-foreground">Publicação inicial</span>
                <div role="group" aria-label="Visibilidade no catálogo" className="mt-1.5 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    aria-pressed={visible}
                    onClick={() => setVisible(true)}
                    className={cn(
                      'rounded-field border px-2.5 py-2 text-xs font-semibold transition-colors',
                      visible
                        ? 'border-shadow-grey bg-light-green/70 text-shadow-grey'
                        : 'border-border bg-surface-secondary text-muted hover:text-foreground',
                    )}
                  >
                    Visível no catálogo
                  </button>
                  <button
                    type="button"
                    aria-pressed={!visible}
                    onClick={() => setVisible(false)}
                    className={cn(
                      'rounded-field border px-2.5 py-2 text-xs font-semibold transition-colors',
                      !visible
                        ? 'border-shadow-grey bg-default text-foreground'
                        : 'border-border bg-surface-secondary text-muted hover:text-foreground',
                    )}
                  >
                    Rascunho oculto
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="book-synopsis" className="text-xs font-semibold text-foreground">
                Sinopse
              </label>
              <textarea
                id="book-synopsis"
                rows={3}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Resumo da obra para os estudantes..."
                className="mt-1 w-full rounded-field border border-border bg-background p-3 text-sm text-foreground focus-visible:outline-focus"
              />
            </div>

            <div>
              <span className="text-xs font-semibold text-foreground">Categorias</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => {
                  const active = categories.includes(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      aria-pressed={active}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'border-shadow-grey bg-shadow-grey text-white'
                          : 'border-border bg-surface text-muted hover:text-foreground',
                      )}
                    >
                      {active && <Check className="h-3 w-3" />}
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Upload de PDF / EPUB */}
            <div className="rounded-lg border border-dashed border-border bg-surface-secondary p-3.5 text-center">
              <UploadCloud className="mx-auto h-5 w-5 text-brilliant-azure-600" />
              {fileName ? (
                <p className="mt-1.5 text-xs font-semibold text-foreground">
                  {fileName} <span className="text-muted">({format} • {fileSize})</span>
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-muted">
                  Selecione um arquivo <strong>.pdf</strong> ou <strong>.epub</strong> (ou use o
                  exemplo)
                </p>
              )}

              <div className="mt-2.5 flex flex-wrap justify-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-default">
                  <FileUp className="h-3.5 w-3.5" />
                  Escolher arquivo
                  <input
                    type="file"
                    accept=".pdf,.epub"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFilePick(f)
                    }}
                    className="sr-only"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => attachDemoFile('PDF')}
                  className="rounded-md bg-peach-fuzz px-2.5 py-1.5 text-[11px] font-semibold text-shadow-grey"
                >
                  Anexar PDF exemplo
                </button>
                <button
                  type="button"
                  onClick={() => attachDemoFile('EPUB')}
                  className="rounded-md bg-light-green/70 px-2.5 py-1.5 text-[11px] font-semibold text-shadow-grey"
                >
                  Anexar EPUB exemplo
                </button>
              </div>
            </div>
          </div>

          {/* Pré-visualização 2:3 */}
          <div className="space-y-3 md:col-span-4">
            <span className="text-xs font-semibold text-foreground">Pré-visualização (2:3)</span>
            <div className="mx-auto max-w-[175px]">
              <BookCover
                title={title.trim() || 'Título da Obra'}
                author={author.trim() || 'Autor(a)'}
                coverUrl={coverUrl}
                format={format}
                tone={tone}
                size="sm"
              />
            </div>

            <label className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-surface-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-default">
              <ImagePlus className="h-3.5 w-3.5" />
              {coverUrl ? 'Trocar capa' : 'Enviar imagem de capa'}
              <input type="file" accept="image/*" onChange={handleCoverPick} className="sr-only" />
            </label>

            {!coverUrl && (
              <div role="group" aria-label="Tom da capa automática" className="grid grid-cols-2 gap-1.5">
                {TONES.map((t) => {
                  const selected = tone === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setTone(t.id)}
                      className={cn(
                        'rounded-sm border px-2 py-1 text-[11px] font-medium',
                        selected
                          ? 'border-shadow-grey bg-light-green/60 font-semibold text-shadow-grey'
                          : 'border-border bg-surface text-muted',
                      )}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-watermelon-50 px-3 py-2 text-xs font-semibold text-watermelon-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-separator pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-field border border-border bg-surface-secondary px-4 py-2 text-sm font-semibold text-foreground hover:bg-default"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-field bg-shadow-grey px-5 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-accent-foreground"
          >
            {editingBook ? 'Salvar alterações' : 'Publicar obra'}
          </button>
        </div>
      </form>
    </DialogModal>
  )
}
