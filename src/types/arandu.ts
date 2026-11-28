export type UserRole = 'student' | 'teacher'

export type BackendUserType = 'ALUNO' | 'BIBLIOTECARIO'

export type Permission =
  | 'catalog:read'
  | 'loans:self'
  | 'admin:panel'
  | 'admin:books'
  | 'admin:students'
  | 'admin:classes'

export interface AuthClassRoom {
  id: string
  nome: string
  turno: 'MANHA' | 'TARDE' | 'INTEGRAL'
  turnoDisplay: string
  anoLetivo: number
  ativa: boolean
}

export interface AuthLoanSummary {
  ativos: number
  atrasados: number
  devolvidos: number
  total: number
}

export interface AuthUser {
  id: string | null
  userId: number
  username?: string
  name: string
  email: string
  enrollmentId: string | null
  backendType: BackendUserType
  typeDisplay: string
  role: UserRole
  isLibrarian: boolean
  classRoom: AuthClassRoom | null
  phone: string | null
  active: boolean
  mustChangePassword: boolean
  loanSummary?: AuthLoanSummary
}

export type BookFormat = 'PDF' | 'EPUB'

export type BookAccessMode = 'public_domain' | 'temporary_loan'

export type Category = string

export interface CatalogCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  booksCount: number
}

export interface BookReview {
  id: string
  userId: string
  userName: string
  userClassRoom: string | null
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
}

export interface BookUserLoan {
  id: string
  status: LoanStatus
  statusDisplay: string
  borrowedAt: string
  dueAt: string
  daysLeft: number
  renewals: number
  canRead: boolean
}

export interface AdminSummary {
  totalBooks: number
  activeBooks: number
  activeLoans: number
  overdueLoans: number
  totalReads: number
  totalDownloads: number
  totalStudents: number
}

export type FallbackTone = 'shadow' | 'azure' | 'peach' | 'green'

export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  categoryId?: string
  categories: Category[]
  publisherName?: string | null
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
  quantityTotal?: number
  quantityAvailable?: number
  available?: boolean
  hasFile?: boolean
  hasPdf?: boolean
  canRead?: boolean
  canDownload?: boolean
  ratingAvg?: number | null
  reviewsCount?: number
  activeLoansCount?: number
  myLoan?: BookUserLoan | null
  myReview?: BookReview | null
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

export type SchoolShiftCode = 'INTEGRAL' | 'MANHA' | 'TARDE'

export interface PaginatedResponse<T> {
  count: number
  total_pages: number
  current_page: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ClassRoom {
  id: string
  name: string
  shiftCode: SchoolShiftCode
  shift: SchoolShift
  schoolYear: number
  active: boolean
  studentsCount: number
}

export interface Student {
  id: string
  name: string
  enrollmentId: string
  email: string
  classRoomId?: string | null
  gradeClass: string
  shift: SchoolShift
  phone?: string | null
  status: 'ativo' | 'inativo'
  mustChangePassword?: boolean
  createdAt: string
}
