import { useMemo, useState } from 'react'
import {
  BookCopy,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  Plus,
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
import { useApp, type NewBookPayload, type NewStudentPayload } from '@/context/AppContext'
import { CATEGORIES, GRADE_CLASSES, TEACHER_USER } from '@/data/mockData'
import { cn, formatDateBR } from '@/lib/utils'
import type { Book, Student } from '@/types/arandu'

type AdminTab = 'books' | 'students'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AL'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function AdminCatalogPage() {
  const {
    books,
    schoolLoans,
    students,
    addBook,
    updateBook,
    toggleBookVisibility,
    addStudent,
    updateStudent,
    toggleStudentStatus,
  } = useApp()

  const [activeTab, setActiveTab] = useState<AdminTab>('books')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [loansBook, setLoansBook] = useState<Book | null>(null)

  const [studentQuery, setStudentQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('Todas')
  const [studentModalOpen, setStudentModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  const totalBooks = books.length
  const activeLoansTotal = schoolLoans.filter((l) => l.status === 'ativo').length
  const overdueTotal = schoolLoans.filter((l) => l.status === 'atrasado').length
  const totalStudents = students.length

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return books.filter((book) => {
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q)
      const matchesCat =
        categoryFilter === 'Todas' ||
        book.categories.includes(categoryFilter as Book['categories'][number])
      return matchesQuery && matchesCat
    })
  }, [books, categoryFilter, query])

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase()
    return students.filter((student) => {
      const matchesQuery =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.enrollmentId.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q)
      const matchesGrade = gradeFilter === 'Todas' || student.gradeClass === gradeFilter
      return matchesQuery && matchesGrade
    })
  }, [gradeFilter, studentQuery, students])

  const handleSave = (payload: NewBookPayload, editingId?: string) => {
    if (editingId) {
      updateBook(editingId, payload)
    } else {
      addBook(payload)
    }
  }

  const handleSaveStudent = (payload: NewStudentPayload, editingId?: string) => {
    if (editingId) {
      updateStudent(editingId, payload)
    } else {
      addStudent(payload)
      setActiveTab('students')
    }
  }

  const loansForBook = loansBook ? schoolLoans.filter((l) => l.bookId === loansBook.id) : []

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brilliant-azure-700">
            Painel Docente • {TEACHER_USER.name}
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
              {books.length}
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
              {students.length}
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
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filtrar por categoria"
              className="h-10 rounded-field border border-border bg-background px-3 text-sm leading-normal text-foreground focus-visible:outline-focus"
            >
              <option value="Todas">Todas as categorias</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-secondary text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Obra</th>
                  <th className="px-4 py-3 font-semibold">Categorias</th>
                  <th className="px-4 py-3 font-semibold">Acesso / Formato</th>
                  <th className="px-4 py-3 font-semibold">Acessos</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {filteredBooks.map((book) => {
                  const activeCount = schoolLoans.filter(
                    (l) => l.bookId === book.id && l.status !== 'devolvido',
                  ).length

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
                            {book.accessMode === 'public_domain' ? 'Domínio público' : 'Leitor web'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold tabular-nums text-foreground">
                        {book.downloadsCount}
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
                            onClick={() => toggleBookVisibility(book.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-default"
                          >
                            {book.visible ? (
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
          </div>
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
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              aria-label="Filtrar por turma"
              className="h-10 rounded-field border border-border bg-background px-3 text-sm leading-normal text-foreground focus-visible:outline-focus"
            >
              <option value="Todas">Todas as turmas</option>
              {GRADE_CLASSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  Nenhum estudante encontrado com os filtros atuais.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStudentQuery('')
                    setGradeFilter('Todas')
                  }}
                  className="mt-3 rounded-field border border-border bg-surface-secondary px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-default"
                >
                  Limpar filtros
                </button>
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
                  {filteredStudents.map((student) => {
                    const activeLoansCount = schoolLoans.filter(
                      (loan) =>
                        loan.enrollmentId === student.enrollmentId && loan.status !== 'devolvido',
                    ).length

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
                            <span className="text-xs text-muted">{student.shift}</span>
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
                              onClick={() => toggleStudentStatus(student.id)}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-default"
                            >
                              {student.status === 'ativo' ? (
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
        </div>
      )}

      {/* Modal de Upload / Edição de Obra */}
      <BookFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingBook={editingBook}
        onSave={handleSave}
      />

      {/* Modal de Cadastro / Edição de Aluno */}
      <StudentFormModal
        open={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        editingStudent={editingStudent}
        existingEnrollmentIds={students.map((s) => s.enrollmentId)}
        onSave={handleSaveStudent}
      />

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
