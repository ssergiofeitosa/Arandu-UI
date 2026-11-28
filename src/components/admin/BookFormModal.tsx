import React, { useEffect, useRef, useState } from 'react'
import { FileUp, ImagePlus, Loader2, Plus, UploadCloud, X } from 'lucide-react'
import { BookCover } from '@/components/BookCover'
import { DialogModal } from '@/components/ui/DialogModal'
import { cn, formatFileSize } from '@/lib/utils'
import { ApiError } from '@/services/api'
import type { SaveAdminBookInput } from '@/services/acervoService'
import type { Book, BookAccessMode, BookFormat, CatalogCategory } from '@/types/arandu'

interface BookFormModalProps {
  open: boolean
  onClose: () => void
  editingBook: Book | null
  categories: CatalogCategory[]
  onCreateCategory: (name: string) => Promise<CatalogCategory>
  onSave: (payload: SaveAdminBookInput, editingId?: string) => Promise<void>
}

export function BookFormModal({
  open,
  onClose,
  editingBook,
  categories,
  onCreateCategory,
  onSave,
}: BookFormModalProps) {
  const [title, setTitle] = useState('')
  const [authorsText, setAuthorsText] = useState('')
  const [isbn, setIsbn] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [quantityTotal, setQuantityTotal] = useState('3')
  const [synopsis, setSynopsis] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accessMode, setAccessMode] = useState<BookAccessMode>('public_domain')
  const [visible, setVisible] = useState(true)

  const [digitalFile, setDigitalFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [format, setFormat] = useState<BookFormat>('PDF')

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | undefined>(undefined)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Criação inline de categoria
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState('')

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
    setDigitalFile(null)
    setCoverFile(null)
    setShowNewCategory(false)
    setNewCategoryName('')
    setCategoryError('')
    setError('')

    if (editingBook) {
      setTitle(editingBook.title)
      setAuthorsText(editingBook.author === 'Autor não informado' ? '' : editingBook.author)
      setIsbn(editingBook.isbn || '')
      setYear(String(editingBook.year))
      setQuantityTotal(String(editingBook.quantityTotal ?? 1))
      setSynopsis(
        editingBook.synopsis === 'Sinopse ainda não informada para esta obra.'
          ? ''
          : editingBook.synopsis,
      )
      setCategoryId(editingBook.categoryId || categories[0]?.id || '')
      setFormat(editingBook.format)
      setAccessMode(editingBook.accessMode)
      setVisible(editingBook.visible)
      setFileName(editingBook.hasFile ? editingBook.fileName : '')
      setFileSize(editingBook.hasFile ? editingBook.fileSize : '')
      setCoverPreviewUrl(editingBook.coverUrl)
    } else {
      setTitle('')
      setAuthorsText('')
      setIsbn('')
      setYear(String(new Date().getFullYear()))
      setQuantityTotal('3')
      setSynopsis('')
      setCategoryId(categories[0]?.id || '')
      setFormat('PDF')
      setAccessMode('public_domain')
      setVisible(true)
      setFileName('')
      setFileSize('')
      setCoverPreviewUrl(undefined)
    }
  }, [categories, editingBook, open])

  const handleFilePick = (file: File) => {
    const lowerName = file.name.toLowerCase()
    const isEpub = lowerName.endsWith('.epub')
    const isPdf = lowerName.endsWith('.pdf')

    if (!isPdf && !isEpub) {
      setError('Selecione um arquivo .pdf ou .epub válido.')
      return
    }
    if (isEpub && accessMode === 'temporary_loan') {
      setError('Obras em aluguel temporário precisam estar em PDF para leitura no navegador.')
      return
    }

    setDigitalFile(file)
    setFormat(isEpub ? 'EPUB' : 'PDF')
    setFileName(file.name)
    setFileSize(formatFileSize(file.size))
    setError('')
  }

  const handleCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    revokeBlobCover()
    const nextUrl = URL.createObjectURL(file)
    blobUrlRef.current = nextUrl
    setCoverFile(file)
    setCoverPreviewUrl(nextUrl)
  }

  const handleQuickCreateCategory = async () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) {
      setCategoryError('Informe o nome da categoria.')
      return
    }
    setCategoryError('')
    setCreatingCategory(true)
    try {
      const created = await onCreateCategory(trimmed)
      setCategoryId(created.id)
      setNewCategoryName('')
      setShowNewCategory(false)
    } catch (err) {
      setCategoryError(
        err instanceof ApiError ? err.message : 'Não foi possível criar a categoria.',
      )
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !authorsText.trim()) {
      setError('Informe ao menos título e autor da obra.')
      return
    }
    if (!categoryId) {
      setError('Selecione ou crie uma categoria para classificar a obra.')
      return
    }
    if (accessMode === 'temporary_loan' && format === 'EPUB') {
      setError('Obras em aluguel temporário devem estar em PDF para leitura no navegador.')
      return
    }

    const parsedYear = Number.parseInt(year, 10)
    const resolvedYear =
      Number.isFinite(parsedYear) && parsedYear >= 1500 && parsedYear <= 2100
        ? parsedYear
        : new Date().getFullYear()

    const parsedQty = Number.parseInt(quantityTotal, 10)
    const resolvedQty = Number.isFinite(parsedQty) && parsedQty >= 1 ? parsedQty : 1

    setError('')
    setSubmitting(true)
    try {
      await onSave(
        {
          title: title.trim(),
          authorsText: authorsText.trim(),
          categoryId,
          isbn: isbn.trim() || undefined,
          year: resolvedYear,
          synopsis: synopsis.trim() || undefined,
          accessMode,
          visible,
          quantityTotal: resolvedQty,
          digitalFile,
          coverFile,
        },
        editingBook?.id,
      )
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível salvar a obra no servidor.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const titleMissing = Boolean(error && !title.trim())
  const authorMissing = Boolean(error && !authorsText.trim())

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
            Domínio público aceita PDF ou EPUB (download direto). Aluguel temporário exige PDF
            (leitura no navegador).
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
                  Autor(es) * <span className="font-normal text-muted">(separe por vírgula)</span>
                </label>
                <input
                  id="book-author"
                  required
                  aria-invalid={authorMissing}
                  value={authorsText}
                  onChange={(e) => {
                    setAuthorsText(e.target.value)
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
                  placeholder="978-85-359-0277-8"
                  className="mt-1 h-10 w-full rounded-field border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-focus"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="book-year" className="text-xs font-semibold text-foreground">
                  Ano de publicação *
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
              <div>
                <label htmlFor="book-qty" className="text-xs font-semibold text-foreground">
                  Licenças / Exemplares *
                </label>
                <input
                  id="book-qty"
                  type="number"
                  min={1}
                  max={999}
                  value={quantityTotal}
                  onChange={(e) => setQuantityTotal(e.target.value)}
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
                    onClick={() => {
                      setAccessMode('public_domain')
                      if (error) setError('')
                    }}
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
                    onClick={() => {
                      setAccessMode('temporary_loan')
                      if (error) setError('')
                    }}
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
                <span className="text-xs font-semibold text-foreground">Visibilidade</span>
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

            {/* Categoria única (FK) + criação inline */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="book-category" className="text-xs font-semibold text-foreground">
                  Categoria principal *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory((prev) => !prev)
                    setCategoryError('')
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brilliant-azure-700 hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  {showNewCategory ? 'Cancelar' : 'Nova categoria'}
                </button>
              </div>
              <select
                id="book-category"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  if (error) setError('')
                }}
                className="mt-1 h-10 w-full rounded-field border border-border bg-background px-3 text-sm leading-normal text-foreground focus-visible:outline-focus"
              >
                <option value="">Selecione uma categoria...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {showNewCategory && (
                <div className="mt-2 flex flex-col gap-2 rounded-field border border-border bg-surface-secondary p-3 sm:flex-row">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value)
                      if (categoryError) setCategoryError('')
                    }}
                    placeholder="Ex.: Literatura Brasileira"
                    aria-label="Nome da nova categoria"
                    className="h-9 flex-1 rounded-field border border-border bg-background px-3 text-xs text-foreground focus-visible:outline-focus"
                  />
                  <button
                    type="button"
                    disabled={creatingCategory}
                    onClick={() => void handleQuickCreateCategory()}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-field bg-shadow-grey px-3.5 text-xs font-semibold text-white hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
                  >
                    {creatingCategory && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Criar
                  </button>
                </div>
              )}
              {categoryError && (
                <p role="alert" className="mt-1 text-xs font-medium text-watermelon-700">
                  {categoryError}
                </p>
              )}
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

            {/* Upload real de PDF / EPUB */}
            <div className="rounded-lg border border-dashed border-border bg-surface-secondary p-3.5 text-center">
              <UploadCloud className="mx-auto h-5 w-5 text-brilliant-azure-600" />
              {fileName ? (
                <p className="mt-1.5 text-xs font-semibold text-foreground">
                  {fileName} <span className="text-muted">({format} • {fileSize})</span>
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-muted">
                  {accessMode === 'temporary_loan' ? (
                    <>
                      Envie um arquivo <strong>.pdf</strong> válido (máx. 25 MB) para leitura no
                      navegador.
                    </>
                  ) : (
                    <>
                      Envie um arquivo <strong>.pdf</strong> ou <strong>.epub</strong> válido (máx.
                      25 MB) para download direto.
                    </>
                  )}
                </p>
              )}

              <div className="mt-2.5 flex flex-wrap justify-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-default">
                  <FileUp className="h-3.5 w-3.5" />
                  {fileName ? 'Trocar arquivo' : 'Escolher arquivo'}
                  <input
                    type="file"
                    accept={accessMode === 'temporary_loan' ? '.pdf' : '.pdf,.epub'}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFilePick(f)
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Pré-visualização 2:3 */}
          <div className="space-y-3 md:col-span-4">
            <span className="text-xs font-semibold text-foreground">Pré-visualização (2:3)</span>
            <div className="mx-auto max-w-[175px]">
              <BookCover
                title={title.trim() || 'Título da Obra'}
                author={authorsText.trim() || 'Autor(a)'}
                coverUrl={coverPreviewUrl}
                format={format}
                tone={editingBook?.fallbackTone || 'shadow'}
                size="sm"
              />
            </div>

            <label className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-surface-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-default">
              <ImagePlus className="h-3.5 w-3.5" />
              {coverPreviewUrl ? 'Trocar capa' : 'Enviar imagem de capa'}
              <input type="file" accept="image/*" onChange={handleCoverPick} className="sr-only" />
            </label>
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
            disabled={submitting}
            onClick={onClose}
            className="rounded-field border border-border bg-surface-secondary px-4 py-2 text-sm font-semibold text-foreground hover:bg-default disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-field bg-shadow-grey px-5 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingBook ? 'Salvar alterações' : 'Publicar obra'}
          </button>
        </div>
      </form>
    </DialogModal>
  )
}
