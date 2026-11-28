import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  INITIAL_BOOKS,
  INITIAL_LOANS,
  INITIAL_SCHOOL_LOANS,
  INITIAL_STUDENTS,
} from '@/data/mockData'
import { hasPermission } from '@/lib/rbac'
import { addDaysIso } from '@/lib/utils'
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  setUnauthorizedHandler,
} from '@/services/api'
import { fetchCurrentUser, loginWithApi } from '@/services/authService'
import type {
  AuthUser,
  Book,
  Loan,
  Permission,
  SchoolLoan,
  Student,
  ToastItem,
  UserRole,
} from '@/types/arandu'

export type NewBookPayload = Omit<Book, 'id' | 'downloadsCount'>
export type NewStudentPayload = Omit<Student, 'id' | 'createdAt'>

interface AppContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  role: UserRole
  can: (permission: Permission) => boolean
  books: Book[]
  loans: Loan[]
  schoolLoans: SchoolLoan[]
  students: Student[]
  toasts: ToastItem[]
  login: (identificador: string, password: string) => Promise<AuthUser>
  logout: () => void
  refreshUser: () => Promise<AuthUser | null>
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(() =>
    Boolean(getAccessToken() || getRefreshToken()),
  )
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS)
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS)
  const [schoolLoans, setSchoolLoans] = useState<SchoolLoan[]>(INITIAL_SCHOOL_LOANS)
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const isAuthenticated = Boolean(user)
  const role: UserRole = user?.role ?? 'student'

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

  const can = useCallback(
    (permission: Permission) => hasPermission(user, permission),
    [user],
  )

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    if (!getAccessToken() && !getRefreshToken()) {
      setUser(null)
      return null
    }

    try {
      const current = await fetchCurrentUser()
      setUser(current)
      return current
    } catch {
      clearAuthTokens()
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler((reason) => {
      setUser((prev) => {
        if (prev) {
          pushToast({
            title: 'Sessão encerrada',
            description: reason || 'Faça login novamente para continuar.',
          })
        }
        return null
      })
    })
    return () => setUnauthorizedHandler(null)
  }, [pushToast])

  useEffect(() => {
    let active = true
    if (!getAccessToken() && !getRefreshToken()) {
      setIsAuthLoading(false)
      return
    }

    fetchCurrentUser()
      .then((current) => {
        if (active) setUser(current)
      })
      .catch(() => {
        clearAuthTokens()
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setIsAuthLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(
    async (identificador: string, password: string): Promise<AuthUser> => {
      const { access, refresh, user: loggedUser } = await loginWithApi(identificador, password)
      setAuthTokens(access, refresh)
      setUser(loggedUser)

      // Enriquecer com resumo_emprestimos do /auth/me/ em segundo plano sem bloquear login
      fetchCurrentUser()
        .then((fresh) => setUser(fresh))
        .catch(() => {
          // mantém dados básicos retornados pelo login
        })

      pushToast({
        title: `Bem-vindo(a), ${loggedUser.name}`,
        description:
          loggedUser.role === 'teacher'
            ? 'Acesso de Bibliotecário / Gestão ativado.'
            : loggedUser.enrollmentId
              ? `Matrícula ${loggedUser.enrollmentId} conectada.`
              : 'Sessão de estudante iniciada.',
        variant: 'success',
      })

      return loggedUser
    },
    [pushToast],
  )

  const logout = useCallback(() => {
    clearAuthTokens()
    setUser(null)
    pushToast({
      title: 'Sessão encerrada',
      description: 'Você voltou para a tela inicial.',
    })
  }, [pushToast])

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
          studentName: user?.name || 'Estudante',
          enrollmentId: user?.enrollmentId || '—',
          gradeClass: user?.classRoom?.nome || 'Sem turma',
          dueAt: dueIso,
          status: 'ativo',
        },
        ...prev,
      ])

      pushToast({
        title:
          book.accessMode === 'temporary_loan'
            ? 'Empréstimo temporário confirmado'
            : 'Obra liberada para download',
        description:
          book.accessMode === 'temporary_loan'
            ? `Leitura de "${book.title}" disponível no navegador.`
            : `"${book.title}" pronta para download (${book.format}).`,
        variant: 'success',
      })
      return created
    },
    [books, loans, pushToast, user],
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

      const currentEnrollment = user?.enrollmentId
      setSchoolLoans((prev) =>
        prev.map((s) =>
          s.bookId === target.bookId &&
          (!currentEnrollment || s.enrollmentId === currentEnrollment) &&
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
    [books, loans, pushToast, user],
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
      const previous = target.visible
      const next = !previous
      setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, visible: next } : b)))
      pushToast({
        title: next ? 'Obra visível no catálogo' : 'Obra ocultada do catálogo',
        description: target.title,
        actionLabel: 'Desfazer',
        onAction: () => {
          setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, visible: previous } : b)))
        },
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
      const previousStatus = target.status
      const nextStatus: Student['status'] = previousStatus === 'ativo' ? 'inativo' : 'ativo'
      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId ? { ...student, status: nextStatus } : student,
        ),
      )
      pushToast({
        title: nextStatus === 'ativo' ? 'Aluno reativado' : 'Aluno desativado',
        description: `${target.name} (${target.enrollmentId})`,
        actionLabel: 'Desfazer',
        onAction: () => {
          setStudents((prev) =>
            prev.map((student) =>
              student.id === studentId ? { ...student, status: previousStatus } : student,
            ),
          )
        },
      })
    },
    [pushToast, students],
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isAuthLoading,
      role,
      can,
      books,
      loans,
      schoolLoans,
      students,
      toasts,
      login,
      logout,
      refreshUser,
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
      user,
      isAuthenticated,
      isAuthLoading,
      role,
      can,
      books,
      loans,
      schoolLoans,
      students,
      toasts,
      login,
      logout,
      refreshUser,
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
