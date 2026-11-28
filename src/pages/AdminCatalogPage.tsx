import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  BookCopy,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from 'lucide-react'
import { BookCover } from '@/components/BookCover'
import { BookFormModal } from '@/components/admin/BookFormModal'
import { StudentFormModal } from '@/components/admin/StudentFormModal'
import { DialogModal } from '@/components/ui/DialogModal'
import { useApp } from '@/context/AppContext'
import { cn, formatDateBR } from '@/lib/utils'
import { ApiError } from '@/services/api'
import {
  createAdminBook,
  createCategoria,
  getAdminSummary,
  listAdminBooks,
  listCategorias,
  toggleAdminBookVisibility,
  updateAdminBook,
  type SaveAdminBookInput,
} from '@/services/acervoService'
import {
  createAluno,
  createTurma,
  listAlunos,
  listTurmas,
  updateAluno,
  type CreateAlunoInput,
  type UpdateAlunoInput,
} from '@/services/gestaoContasService'
import type {
  AdminSummary,
  Book,
  CatalogCategory,
  ClassRoom,
  SchoolShiftCode,
  Student,
} from '@/types/arandu'

type AdminTab = 'books' | 'students'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AL'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function AdminCatalogPage() {
  const { user, can, schoolLoans, notify } = useApp()

  const [activeTab, setActiveTab] = useState<AdminTab>('books')
  const [summary, setSummary] = useState<AdminSummary | null>(null)

  // Estado real da API para Acervo e Categorias (Épico 3)
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [booksTotal, setBooksTotal] = useState(0)
  const [booksPage, setBooksPage] = useState(1)
  const [booksTotalPages, setBooksTotalPages] = useState(1)
  const [booksLoading, setBooksLoading] = useState(true)
  const [booksError, setBooksError] = useState('')
  const [togglingBookId, setTogglingBookId] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [loansBook, setLoansBook] = useState<Book | null>(null)

  // Estado real da API para Alunos e Turmas (Épico 2 — Onda 1)
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [studentsTotal, setStudentsTotal] = useState(0)
  const [studentsPage, setStudentsPage] = useState(1)
  const [studentsTotalPages, setStudentsTotalPages] = useState(1)
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState('')
  const [togglingStudentId, setTogglingStudentId] = useState<string | null>(null)

  const [studentQuery, setStudentQuery] = useState('')
  const [debouncedStudentQuery, setDebouncedStudentQuery] = useState('')
  const [classRoomFilter, setClassRoomFilter] = useState('Todas')
  const [studentModalOpen, setStudentModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [createdCredentials, setCreatedCredentials] = useState<{
    student: Student
    temporaryPassword: string
  } | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
      setBooksPage(1)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedStudentQuery(studentQuery.trim())
      setStudentsPage(1)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [studentQuery])

  const loadSummary = useCallback(async () => {
    if (!can('admin:panel')) return
    try {
      const data = await getAdminSummary()
      setSummary(data)
    } catch {
      // KPIs continuam com fallback dos totais carregados
    }
  }, [can])

  const loadCategories = useCallback(async () => {
    try {
      const data = await listCategorias()
      setCategories(data)
    } catch {
      // fallback silencioso
    }
  }, [])

  const loadBooks = useCallback(async () => {
    if (!can('admin:books')) return
    setBooksLoading(true)
    setBooksError('')
    try {
      const response = await listAdminBooks({
        page: booksPage,
        pageSize: 12,
        search: debouncedQuery || undefined,
        categoria: categoryFilter !== 'Todas' ? categoryFilter : undefined,
      })
      setBooks(response.results)
      setBooksTotal(response.count)
      setBooksTotalPages(Math.max(1, response.total_pages))
    } catch (err) {
      setBooksError(
        err instanceof ApiError ? err.message : 'Não foi possível carregar o acervo da API.',
      )
    } finally {
      setBooksLoading(false)
    }
  }, [booksPage, can, categoryFilter, debouncedQuery])

  const loadTurmas = useCallback(async () => {
    if (!can('admin:classes')) return
    try {
      const response = await listTurmas({ pageSize: 50, ativa: true })
      setClassRooms(response.results)
    } catch {
      // erro de turma será visível ao carregar alunos ou criar turma
    }
  }, [can])

  const loadAlunos = useCallback(async () => {
    if (!can('admin:students')) return
    setStudentsLoading(true)
    setStudentsError('')
    try {
      const response = await listAlunos({
        page: studentsPage,
        pageSize: 12,
        search: debouncedStudentQuery || undefined,
        turma: classRoomFilter !== 'Todas' ? classRoomFilter : undefined,
      })
      setStudents(response.results)
      setStudentsTotal(response.count)
      setStudentsTotalPages(Math.max(1, response.total_pages))
    } catch (err) {
      setStudentsError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar os estudantes da API.',
      )
    } finally {
      setStudentsLoading(false)
    }
  }, [can, classRoomFilter, debouncedStudentQuery, studentsPage])

  useEffect(() => {
    void loadSummary()
    void loadCategories()
    void loadTurmas()
  }, [loadCategories, loadSummary, loadTurmas])

  useEffect(() => {
    void loadBooks()
  }, [loadBooks])

  useEffect(() => {
    void loadAlunos()
  }, [loadAlunos])

  const totalBooks = summary?.totalBooks ?? booksTotal
  const activeLoansTotal = summary?.activeLoans ?? 0
  const overdueTotal = summary?.overdueLoans ?? 0
  const totalStudents = summary?.totalStudents ?? studentsTotal

  const handleCreateCategory = async (name: string): Promise<CatalogCategory> => {
    const created = await createCategoria(name)
    setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    notify({
      title: 'Categoria criada',
      description: created.name,
      variant: 'success',
    })
    return created
  }

  const handleSaveBook = async (payload: SaveAdminBookInput, editingId?: string) => {
    if (editingId) {
      const updated = await updateAdminBook(editingId, payload)
      setBooks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      notify({
        title: 'Obra atualizada',
        description: `"${updated.title}" salva no acervo.`,
        variant: 'success',
      })
    } else {
      const created = await createAdminBook(payload)
      setActiveTab('books')
      notify({
        title: 'Obra publicada no acervo',
        description: `"${created.title}" cadastrada no PostgreSQL.`,
        variant: 'success',
      })
      await Promise.all([loadBooks(), loadSummary()])
    }
  }

  const handleToggleBookVisibility = async (book: Book) => {
    const nextVisible = !book.visible
    setTogglingBookId(book.id)
    try {
      const updated = await toggleAdminBookVisibility(book.id, nextVisible)
      setBooks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      void loadSummary()
      notify({
        title: nextVisible ? 'Obra visível no catálogo' : 'Obra ocultada do catálogo',
        description: updated.title,
        actionLabel: 'Desfazer',
        onAction: () => {
          void toggleAdminBookVisibility(book.id, !nextVisible).then((reverted) => {
            setBooks((prev) => prev.map((item) => (item.id === reverted.id ? reverted : item)))
            void loadSummary()
          })
        },
      })
    } catch (err) {
      notify({
        title: 'Erro ao atualizar obra',
        description:
          err instanceof ApiError ? err.message : 'Não foi possível alterar a visibilidade.',
      })
    } finally {
      setTogglingBookId(null)
    }
  }

  const handleCreateClassRoom = async (payload: {
    name: string
    shiftCode: SchoolShiftCode
    schoolYear: number
  }): Promise<ClassRoom> => {
    const created = await createTurma(payload)
    setClassRooms((prev) => [created, ...prev])
    notify({
      title: 'Turma cadastrada',
      description: `${created.name} (${created.shift} • ${created.schoolYear})`,
      variant: 'success',
    })
    return created
  }

  const handleSaveStudent = async (
    payload: CreateAlunoInput | UpdateAlunoInput,
    editingId?: string,
  ) => {
    if (editingId) {
      const updated = await updateAluno(editingId, payload as UpdateAlunoInput)
      setStudents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      notify({
        title: 'Cadastro do aluno atualizado',
        description: `${updated.name} • Matrícula ${updated.enrollmentId}`,
        variant: 'success',
      })
    } else {
      const { student, temporaryPassword } = await createAluno(payload as CreateAlunoInput)
      setActiveTab('students')
      if (temporaryPassword) {
        setCopiedPassword(false)
        setCreatedCredentials({ student, temporaryPassword })
      }
      notify({
        title: 'Aluno cadastrado no PostgreSQL',
        description: `${student.name} • Matrícula ${student.enrollmentId}`,
        variant: 'success',
      })
      await loadAlunos()
    }
  }

  const handleToggleStudentStatus = async (student: Student) => {
    const nextActive = student.status !== 'ativo'
    setTogglingStudentId(student.id)
    try {
      const updated = await updateAluno(student.id, { active: nextActive })
      setStudents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      notify({
        title: nextActive ? 'Aluno reativado' : 'Aluno desativado',
        description: `${updated.name} (${updated.enrollmentId})`,
        actionLabel: 'Desfazer',
        onAction: () => {
          void updateAluno(student.id, { active: !nextActive }).then((reverted) => {
            setStudents((prev) => prev.map((item) => (item.id === reverted.id ? reverted : item)))
          })
        },
      })
    } catch (err) {
      notify({
        title: 'Erro ao atualizar status',
        description:
          err instanceof ApiError ? err.message : 'Não foi possível alterar o status do aluno.',
      })
    } finally {
      setTogglingStudentId(null)
    }
  }

  const handleCopyTempPassword = async () => {
    if (!createdCredentials) return
    try {
      await navigator.clipboard.writeText(createdCredentials.temporaryPassword)
      setCopiedPassword(true)
      notify({
        title: 'Senha temporária copiada',
        description: 'Pronta para compartilhar com o estudante.',
        variant: 'success',
      })
    } catch {
      // clipboard indisponível em contexto restrito
    }
  }

  const loansForBook = loansBook ? schoolLoans.filter((l) => l.bookId === loansBook.id) : []

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brilliant-azure-700">
            Painel Docente • {user?.name || 'Bibliotecário'}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Gestão do Acervo e Alunos
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEditingStudent(null)
              setStudentModalOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-field border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-secondary focus-visible:outline-focus"
          >
            <UserPlus className="h-4 w-4 text-brilliant-azure-600" />
            Cadastrar Aluno
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingBook(null)
              setModalOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-field bg-shadow-grey px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-focus"
          >
            <Plus className="h-4 w-4" />
            Adicionar Livro Digital
          </button>
        </div>
      </div>

      {/* 4 KPIs */}
      <section aria-label="Indicadores do painel docente" className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total de Obras', value: totalBooks, icon: BookCopy },
          { label: 'Empréstimos Ativos', value: activeLoansTotal, icon: Users },
          { label: 'Alunos Cadastrados', value: totalStudents, icon: GraduationCap },
          { label: 'Em Atraso', value: overdueTotal, icon: Clock },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-2 text-xs font-medium text-muted">
                <span>{kpi.label}</span>
                <Icon className="h-4 w-4 shrink-0 text-brilliant-azure-600" />
              </div>
              <p className="mt-2.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">
                {kpi.value}
              </p>
            </div>
          )
        })}
      </section>

      {/* Abas de Gestão */}
      <div className="mt-7 flex items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Seções de gestão"
          className="inline-flex rounded-lg border border-border bg-surface-secondary p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'books'}
            onClick={() => setActiveTab('books')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-focus',
              activeTab === 'books'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted hover:text-foreground',
            )}
          >
            <BookCopy className="h-4 w-4" />
            Acervo Digital
            <span className="rounded-full bg-default px-2 py-0.5 text-[11px] font-bold tabular-nums text-foreground">
              {booksTotal}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'students'}
            onClick={() => setActiveTab('students')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-focus',
              activeTab === 'students'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted hover:text-foreground',
            )}
          >
            <GraduationCap className="h-4 w-4" />
            Alunos
            <span className="rounded-full bg-default px-2 py-0.5 text-[11px] font-bold tabular-nums text-foreground">
              {studentsTotal}
            </span>
          </button>
        </div>
      </div>

      {/* Tabela filtrável */}
      {activeTab === 'books' ? (
        <div className="mt-4 rounded-lg border border-border bg-surface">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar título ou autor..."
                aria-label="Pesquisar na tabela do acervo"
                className="h-10 w-full rounded-field border border-border bg-background pl-10 pr-3.5 text-sm text-foreground focus-visible:outline-focus"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setBooksPage(1)
              }}
              aria-label="Filtrar por categoria"
              className="h-10 rounded-field border border-border bg-background px-3 text-sm leading-normal text-foreground focus-visible:outline-focus"
            >
              <option value="Todas">Todas as categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            {booksError ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <AlertCircle className="h-6 w-6 text-watermelon-600" />
                <p className="text-sm font-medium text-foreground">{booksError}</p>
                <button
                  type="button"
                  onClick={() => void loadBooks()}
                  className="inline-flex items-center gap-1.5 rounded-field border border-border bg-surface-secondary px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-default"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Tentar novamente
                </button>
              </div>
            ) : booksLoading ? (
              <div className="flex items-center justify-center gap-2.5 p-10 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin text-brilliant-azure-600" />
                Carregando acervo...
              </div>
            ) : books.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  Nenhuma obra encontrada no acervo.
                </p>
                <p className="mt-1 text-xs text-muted">
                  Clique em <strong>Adicionar Livro Digital</strong> para cadastrar o primeiro título.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-secondary text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Obra</th>
                    <th className="px-4 py-3 font-semibold">Categoria</th>
                    <th className="px-4 py-3 font-semibold">Acesso / Formato</th>
                    <th className="px-4 py-3 font-semibold">Licenças / Acessos</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {books.map((book) => {
                    const activeCount = book.activeLoansCount ?? 0
                    const isToggling = togglingBookId === book.id

                    return (
                      <tr key={book.id} className="hover:bg-surface-secondary/50">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 shrink-0">
                              <BookCover
                                title={book.title}
                                author={book.author}
                                coverUrl={book.coverUrl}
                                format={book.format}
                                tone={book.fallbackTone}
                                size="xs"
                              />
                            </div>
                            <div className="min-w-0 max-w-[220px]">
                              <p className="truncate font-bold text-foreground">{book.title}</p>
                              <p className="truncate text-xs text-muted">{book.author}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {book.categories.map((cat) => (
                              <span
                                key={cat}
                                className="whitespace-nowrap rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-[11px] font-medium text-foreground"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-xs border border-border bg-surface-secondary px-2 py-0.5 text-[11px] font-bold text-foreground">
                              {book.format}
                            </span>
                            <span className="whitespace-nowrap text-xs text-muted">
                              {book.accessMode === 'public_domain'
                                ? 'Domínio público'
                                : 'Aluguel (web)'}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs tabular-nums text-foreground">
                          <span className="font-semibold">
                            {book.accessMode === 'public_domain'
                              ? 'Livre'
                              : `${book.quantityAvailable ?? 0}/${book.quantityTotal ?? 1}`}
                          </span>
                          <span className="ml-2 text-muted">• {book.downloadsCount} acessos</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                              book.visible
                                ? 'bg-light-green/65 text-shadow-grey'
                                : 'bg-default text-muted',
                            )}
                          >
                            {book.visible ? 'Visível' : 'Oculto'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBook(book)
                                setModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-default"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => void handleToggleBookVisibility(book)}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-default disabled:opacity-50"
                            >
                              {isToggling ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : book.visible ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5" />
                                  Ocultar
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5" />
                                  Ativar
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setLoansBook(book)}
                              className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-secondary"
                            >
                              <Users className="h-3.5 w-3.5" />
                              Empréstimos ({activeCount})
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {booksTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
              <span>
                Página <strong className="text-foreground">{booksPage}</strong> de{' '}
                <strong className="text-foreground">{booksTotalPages}</strong> • {booksTotal}{' '}
                obra(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={booksPage <= 1 || booksLoading}
                  onClick={() => setBooksPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-field border border-border bg-surface-secondary px-3 py-1.5 font-semibold text-foreground hover:bg-default disabled:opacity-45"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={booksPage >= booksTotalPages || booksLoading}
                  onClick={() => setBooksPage((p) => Math.min(booksTotalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-field border border-border bg-surface-secondary px-3 py-1.5 font-semibold text-foreground hover:bg-default disabled:opacity-45"
                >
                  Próxima
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-border bg-surface">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder="Pesquisar por nome ou matrícula..."
                aria-label="Pesquisar estudantes cadastrados"
                className="h-10 w-full rounded-field border border-border bg-background pl-10 pr-3.5 text-sm text-foreground focus-visible:outline-focus"
              />
            </div>

            <select
              value={classRoomFilter}
              onChange={(e) => {
                setClassRoomFilter(e.target.value)
                setStudentsPage(1)
              }}
              aria-label="Filtrar por turma"
              className="h-10 rounded-field border border-border bg-background px-3 text-sm leading-normal text-foreground focus-visible:outline-focus"
            >
              <option value="Todas">Todas as turmas</option>
              {classRooms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.shift})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            {studentsError ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <AlertCircle className="h-6 w-6 text-watermelon-600" />
                <p className="text-sm font-medium text-foreground">{studentsError}</p>
                <button
                  type="button"
                  onClick={() => void loadAlunos()}
                  className="inline-flex items-center gap-1.5 rounded-field border border-border bg-surface-secondary px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-default"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Tentar novamente
                </button>
              </div>
            ) : studentsLoading ? (
              <div className="flex items-center justify-center gap-2.5 p-10 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin text-brilliant-azure-600" />
                Carregando estudantes...
              </div>
            ) : students.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  Nenhum estudante encontrado com os filtros atuais.
                </p>
                {(studentQuery || classRoomFilter !== 'Todas') && (
                  <button
                    type="button"
                    onClick={() => {
                      setStudentQuery('')
                      setClassRoomFilter('Todas')
                      setStudentsPage(1)
                    }}
                    className="mt-3 rounded-field border border-border bg-surface-secondary px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-default"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-secondary text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Estudante</th>
                    <th className="px-4 py-3 font-semibold">Matrícula</th>
                    <th className="px-4 py-3 font-semibold">Turma / Turno</th>
                    <th className="px-4 py-3 font-semibold">Empréstimos</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {students.map((student) => {
                    const activeLoansCount = schoolLoans.filter(
                      (loan) =>
                        loan.enrollmentId === student.enrollmentId && loan.status !== 'devolvido',
                    ).length
                    const isToggling = togglingStudentId === student.id

                    return (
                      <tr key={student.id} className="hover:bg-surface-secondary/50">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brilliant-azure-50 text-xs font-bold text-brilliant-azure-700">
                              {getInitials(student.name)}
                            </div>
                            <div className="min-w-0 max-w-[240px]">
                              <p className="truncate font-bold text-foreground">{student.name}</p>
                              <p className="truncate text-xs text-muted">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-semibold tabular-nums text-foreground">
                          {student.enrollmentId}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="whitespace-nowrap rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                              {student.gradeClass}
                            </span>
                            {student.classRoomId && (
                              <span className="text-xs text-muted">{student.shift}</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-foreground">
                          {activeLoansCount > 0 ? (
                            <span className="font-semibold text-brilliant-azure-700">
                              {activeLoansCount} {activeLoansCount === 1 ? 'ativo' : 'ativos'}
                            </span>
                          ) : (
                            <span className="text-muted">Nenhum</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                              student.status === 'ativo'
                                ? 'bg-light-green/65 text-shadow-grey'
                                : 'bg-default text-muted',
                            )}
                          >
                            {student.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudent(student)
                                setStudentModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-default"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => void handleToggleStudentStatus(student)}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-default disabled:opacity-50"
                            >
                              {isToggling ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : student.status === 'ativo' ? (
                                <>
                                  <UserX className="h-3.5 w-3.5" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Ativar
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {studentsTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
              <span>
                Página <strong className="text-foreground">{studentsPage}</strong> de{' '}
                <strong className="text-foreground">{studentsTotalPages}</strong> •{' '}
                {studentsTotal} estudante(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={studentsPage <= 1 || studentsLoading}
                  onClick={() => setStudentsPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-field border border-border bg-surface-secondary px-3 py-1.5 font-semibold text-foreground hover:bg-default disabled:opacity-45"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={studentsPage >= studentsTotalPages || studentsLoading}
                  onClick={() => setStudentsPage((p) => Math.min(studentsTotalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-field border border-border bg-surface-secondary px-3 py-1.5 font-semibold text-foreground hover:bg-default disabled:opacity-45"
                >
                  Próxima
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Upload / Edição de Obra */}
      <BookFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingBook={editingBook}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        onSave={handleSaveBook}
      />

      {/* Modal de Cadastro / Edição de Aluno */}
      <StudentFormModal
        open={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        editingStudent={editingStudent}
        classRooms={classRooms}
        existingEnrollmentIds={students.map((s) => s.enrollmentId)}
        onCreateClassRoom={handleCreateClassRoom}
        onSave={handleSaveStudent}
      />

      {/* Modal de exibição única da senha temporária gerada */}
      <DialogModal
        open={Boolean(createdCredentials)}
        onClose={() => setCreatedCredentials(null)}
        labelledBy="temp-password-modal-title"
        maxWidthClass="max-w-md"
        className="p-6"
      >
        {createdCredentials && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-separator pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-light-green/50 text-shadow-grey">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h2 id="temp-password-modal-title" className="text-base font-bold text-foreground">
                    Senha temporária gerada
                  </h2>
                  <p className="text-xs text-muted">
                    Exibida uma única vez para o primeiro acesso do estudante.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                aria-label="Fechar aviso de senha temporária"
                className="rounded-md p-1 text-muted hover:bg-default hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 rounded-field border border-border bg-surface-secondary p-3.5 text-xs">
              <p>
                <span className="text-muted">Estudante:</span>{' '}
                <strong className="text-foreground">{createdCredentials.student.name}</strong>
              </p>
              <p>
                <span className="text-muted">Matrícula:</span>{' '}
                <strong className="tabular-nums text-foreground">
                  {createdCredentials.student.enrollmentId}
                </strong>
              </p>
              <p>
                <span className="text-muted">E-mail:</span>{' '}
                <strong className="text-foreground">{createdCredentials.student.email}</strong>
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-field border border-shadow-grey/30 bg-background px-3.5 py-2.5">
              <code className="select-all text-base font-bold tracking-wider text-foreground">
                {createdCredentials.temporaryPassword}
              </code>
              <button
                type="button"
                onClick={() => void handleCopyTempPassword()}
                className="inline-flex items-center gap-1.5 rounded-field bg-shadow-grey px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent hover:text-accent-foreground"
              >
                {copiedPassword ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copiada
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="rounded-field border border-border bg-surface-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-default"
              >
                Entendi, fechar
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Modal de Empréstimos por obra */}
      <DialogModal
        open={Boolean(loansBook)}
        onClose={() => setLoansBook(null)}
        labelledBy="modal-loans-title"
        maxWidthClass="max-w-lg"
        className="p-6"
      >
        {loansBook && (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-separator pb-3">
              <div>
                <h2 id="modal-loans-title" className="text-lg font-bold text-foreground">
                  Empréstimos de “{loansBook.title}”
                </h2>
                <p className="text-xs text-muted">Estudantes com exemplares digitais recentes.</p>
              </div>
              <button
                type="button"
                onClick={() => setLoansBook(null)}
                aria-label="Fechar janela"
                className="rounded-md p-1 text-muted hover:bg-default hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {loansForBook.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-5 text-center text-sm text-muted">
                  Nenhum empréstimo registrado para esta obra.
                </p>
              ) : (
                loansForBook.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-secondary px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.studentName}</p>
                      <p className="text-xs text-muted">
                        <span className="whitespace-nowrap">Matrícula {item.enrollmentId}</span> •{' '}
                        {item.gradeClass}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                          item.status === 'ativo'
                            ? 'bg-light-green/70 text-shadow-grey'
                            : item.status === 'atrasado'
                              ? 'bg-watermelon text-white'
                              : 'bg-default text-foreground',
                        )}
                      >
                        {item.status === 'ativo'
                          ? 'Ativo'
                          : item.status === 'atrasado'
                            ? 'Atrasado'
                            : 'Devolvido'}
                      </span>
                      <p className="mt-1 text-[11px] text-muted">
                        Prazo: {formatDateBR(item.dueAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </DialogModal>
    </div>
  )
}
