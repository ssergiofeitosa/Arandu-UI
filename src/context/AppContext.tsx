import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  INITIAL_BOOKS,
  INITIAL_LOANS,
  INITIAL_SCHOOL_LOANS,
  INITIAL_STUDENTS,
  STUDENT_USER,
  TEACHER_USER,
} from '@/data/mockData'
import { addDaysIso } from '@/lib/utils'
import type { Book, Loan, SchoolLoan, Student, ToastItem, UserRole } from '@/types/arandu'

export type NewBookPayload = Omit<Book, 'id' | 'downloadsCount'>
export type NewStudentPayload = Omit<Student, 'id' | 'createdAt'>

interface AppContextValue {
  isAuthenticated: boolean
  role: UserRole
  books: Book[]
  loans: Loan[]
  schoolLoans: SchoolLoan[]
  students: Student[]
  toasts: ToastItem[]
  login: (roleOverride?: UserRole) => UserRole
  logout: () => void
  setRole: (nextRole: UserRole) => void
  getActiveLoan: (bookId: string) => Loan | undefined
  borrowBook: (bookId: string) => Loan | null
  returnBook: (loanId: string) => void
  downloadBook: (bookId: string) => void
  addBook: (payload: NewBookPayload) => Book
  updateBook: (bookId: string, payload: Partial<NewBookPayload>) => void
  toggleBookVisibility: (bookId: string) => void
  addStudent: (payload: NewStudentPayload) => Student
  updateStudent: (studentId: string, payload: Partial<NewStudentPayload>) => void
  toggleStudentStatus: (studentId: string) => void
  dismissToast: (id: string) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

const SESSION_STORAGE_KEY = 'arandu_mock_session'

interface StoredSession {
  isAuthenticated: boolean
  role: UserRole
}

function readStoredSession(): StoredSession {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return { isAuthenticated: false, role: 'student' }
    const parsed = JSON.parse(raw) as Partial<StoredSession>
    if (
      parsed.isAuthenticated === true &&
      (parsed.role === 'student' || parsed.role === 'teacher')
    ) {
      return { isAuthenticated: true, role: parsed.role }
    }
  } catch {
    // ignore storage access errors in restricted environments
  }
  return { isAuthenticated: false, role: 'student' }
}

function writeStoredSession(session: StoredSession | null) {
  try {
    if (!session) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
      return
    }
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // ignore storage access errors in restricted environments
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [initialSession] = useState<StoredSession>(() => readStoredSession())
  const [isAuthenticated, setIsAuthenticated] = useState(initialSession.isAuthenticated)
  const [role, setRoleState] = useState<UserRole>(initialSession.role)
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS)
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS)
  const [schoolLoans, setSchoolLoans] = useState<SchoolLoan[]>(INITIAL_SCHOOL_LOANS)
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }])
      window.setTimeout(() => {
        dismissToast(id)
      }, 3800)
    },
    [dismissToast],
  )

  const login = useCallback(
    (roleOverride?: UserRole): UserRole => {
      const resolvedRole = roleOverride ?? role
      setRoleState(resolvedRole)
      setIsAuthenticated(true)
      writeStoredSession({ isAuthenticated: true, role: resolvedRole })
      pushToast({
        title:
          resolvedRole === 'teacher'
            ? `Bem-vindo, ${TEACHER_USER.name}`
            : `Bem-vinda, ${STUDENT_USER.name}`,
        description:
          resolvedRole === 'teacher'
            ? 'Visão de professor ativada (mock).'
            : `Matrícula ${STUDENT_USER.enrollmentId} acessada (mock).`,
        variant: 'success',
      })
      return resolvedRole
    },
    [pushToast, role],
  )

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    writeStoredSession(null)
    pushToast({
      title: 'Sessão encerrada',
      description: 'Você voltou para a tela inicial.',
    })
  }, [pushToast])

  const setRole = useCallback(
    (nextRole: UserRole) => {
      setRoleState(nextRole)
      setIsAuthenticated(true)
      writeStoredSession({ isAuthenticated: true, role: nextRole })
      pushToast({
        title: nextRole === 'teacher' ? 'Modo Professor' : 'Modo Aluno',
        description:
          nextRole === 'teacher'
            ? 'Visualizando o painel de gestão do acervo.'
            : 'Visualizando a experiência do estudante.',
      })
    },
    [pushToast],
  )

  const getActiveLoan = useCallback(
    (bookId: string) =>
      loans.find(
        (loan) => loan.bookId === bookId && (loan.status === 'ativo' || loan.status === 'atrasado'),
      ),
    [loans],
  )

  const borrowBook = useCallback(
    (bookId: string): Loan | null => {
      const book = books.find((b) => b.id === bookId)
      if (!book) return null

      const existing = loans.find(
        (loan) => loan.bookId === bookId && (loan.status === 'ativo' || loan.status === 'atrasado'),
      )
      if (existing) return existing

      const nowIso = new Date().toISOString()
      const dueIso = addDaysIso(7)
      const created: Loan = {
        id: `loan-${Date.now()}`,
        bookId,
        borrowedAt: nowIso,
        dueAt: dueIso,
        status: 'ativo',
      }

      setLoans((prev) => [created, ...prev])
      setSchoolLoans((prev) => [
        {
          id: `sch-${Date.now()}`,
          bookId,
          studentName: STUDENT_USER.name,
          enrollmentId: STUDENT_USER.enrollmentId,
          gradeClass: STUDENT_USER.gradeClass,
          dueAt: dueIso,
          status: 'ativo',
        },
        ...prev,
      ])

      pushToast({
        title: 'Empréstimo confirmado por 7 dias',
        description: `"${book.title}" liberado para download (${book.format}).`,
        variant: 'success',
      })
      return created
    },
    [books, loans, pushToast],
  )

  const returnBook = useCallback(
    (loanId: string) => {
      const target = loans.find((l) => l.id === loanId)
      if (!target) return
      const book = books.find((b) => b.id === target.bookId)

      setLoans((prev) =>
        prev.map((loan) =>
          loan.id === loanId
            ? { ...loan, status: 'devolvido', returnedAt: new Date().toISOString() }
            : loan,
        ),
      )

      setSchoolLoans((prev) =>
        prev.map((s) =>
          s.bookId === target.bookId &&
          s.enrollmentId === STUDENT_USER.enrollmentId &&
          s.status !== 'devolvido'
            ? { ...s, status: 'devolvido' }
            : s,
        ),
      )

      pushToast({
        title: 'Obra devolvida ao acervo',
        description: book ? `"${book.title}" marcada como devolvida.` : 'Devolução registrada.',
      })
    },
    [books, loans, pushToast],
  )

  const downloadBook = useCallback(
    (bookId: string) => {
      const book = books.find((b) => b.id === bookId)
      if (!book) return

      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, downloadsCount: b.downloadsCount + 1 } : b)),
      )

      pushToast({
        title: `Download iniciado (${book.format})`,
        description: `${book.fileName} • ${book.fileSize}`,
        variant: 'success',
      })
    },
    [books, pushToast],
  )

  const addBook = useCallback(
    (payload: NewBookPayload): Book => {
      const slug = payload.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      const created: Book = {
        ...payload,
        id: `${slug || 'obra'}-${Date.now().toString().slice(-4)}`,
        downloadsCount: 0,
      }

      setBooks((prev) => [created, ...prev])
      pushToast({
        title: 'Obra publicada no acervo',
        description: `"${created.title}" já aparece no catálogo.`,
        variant: 'success',
      })
      return created
    },
    [pushToast],
  )

  const updateBook = useCallback(
    (bookId: string, payload: Partial<NewBookPayload>) => {
      setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, ...payload } : b)))
      pushToast({
        title: 'Obra atualizada',
        description: 'Alterações aplicadas no acervo.',
        variant: 'success',
      })
    },
    [pushToast],
  )

  const toggleBookVisibility = useCallback(
    (bookId: string) => {
      const target = books.find((b) => b.id === bookId)
      if (!target) return
      const next = !target.visible
      setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, visible: next } : b)))
      pushToast({
        title: next ? 'Obra visível no catálogo' : 'Obra ocultada do catálogo',
        description: target.title,
      })
    },
    [books, pushToast],
  )

  const addStudent = useCallback(
    (payload: NewStudentPayload): Student => {
      const created: Student = {
        ...payload,
        id: `std-${Date.now().toString().slice(-5)}`,
        createdAt: new Date().toISOString(),
      }
      setStudents((prev) => [created, ...prev])
      pushToast({
        title: 'Aluno cadastrado na plataforma',
        description: `${created.name} • Matrícula ${created.enrollmentId}`,
        variant: 'success',
      })
      return created
    },
    [pushToast],
  )

  const updateStudent = useCallback(
    (studentId: string, payload: Partial<NewStudentPayload>) => {
      setStudents((prev) =>
        prev.map((student) => (student.id === studentId ? { ...student, ...payload } : student)),
      )
      pushToast({
        title: 'Cadastro do aluno atualizado',
        description: 'Os dados escolares foram salvos.',
        variant: 'success',
      })
    },
    [pushToast],
  )

  const toggleStudentStatus = useCallback(
    (studentId: string) => {
      const target = students.find((student) => student.id === studentId)
      if (!target) return
      const nextStatus: Student['status'] = target.status === 'ativo' ? 'inativo' : 'ativo'
      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId ? { ...student, status: nextStatus } : student,
        ),
      )
      pushToast({
        title: nextStatus === 'ativo' ? 'Aluno reativado' : 'Aluno desativado',
        description: `${target.name} (${target.enrollmentId})`,
      })
    },
    [pushToast, students],
  )

  const value = useMemo(
    () => ({
      isAuthenticated,
      role,
      books,
      loans,
      schoolLoans,
      students,
      toasts,
      login,
      logout,
      setRole,
      getActiveLoan,
      borrowBook,
      returnBook,
      downloadBook,
      addBook,
      updateBook,
      toggleBookVisibility,
      addStudent,
      updateStudent,
      toggleStudentStatus,
      dismissToast,
    }),
    [
      isAuthenticated,
      role,
      books,
      loans,
      schoolLoans,
      students,
      toasts,
      login,
      logout,
      setRole,
      getActiveLoan,
      borrowBook,
      returnBook,
      downloadBook,
      addBook,
      updateBook,
      toggleBookVisibility,
      addStudent,
      updateStudent,
      toggleStudentStatus,
      dismissToast,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider')
  return ctx
}
