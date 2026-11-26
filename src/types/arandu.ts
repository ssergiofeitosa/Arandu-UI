export type UserRole = 'student' | 'teacher'

export type BookFormat = 'PDF' | 'EPUB'

export type BookAccessMode = 'public_domain' | 'temporary_loan'

export type Category =
  | 'Literatura Brasileira'
  | 'Matemática'
  | 'História'
  | 'Redação/ENEM'
  | 'Ciências'

export type FallbackTone = 'shadow' | 'azure' | 'peach' | 'green'

export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  categories: Category[]
  format: BookFormat
  accessMode: BookAccessMode
  fileSize: string
  fileName: string
  pages: number
  year: number
  synopsis: string
  curatorName: string
  visible: boolean
  downloadsCount: number
  coverUrl?: string
  fallbackTone?: FallbackTone
}

export type LoanStatus = 'ativo' | 'atrasado' | 'devolvido'

export interface Loan {
  id: string
  bookId: string
  borrowedAt: string
  dueAt: string
  returnedAt?: string
  status: LoanStatus
}

export interface SchoolLoan {
  id: string
  bookId: string
  studentName: string
  enrollmentId: string
  gradeClass: string
  dueAt: string
  status: LoanStatus
}

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success'
  actionLabel?: string
  onAction?: () => void
}

export type SchoolShift = 'Integral' | 'Manhã' | 'Tarde'

export interface Student {
  id: string
  name: string
  enrollmentId: string
  email: string
  gradeClass: string
  shift: SchoolShift
  status: 'ativo' | 'inativo'
  createdAt: string
}
