import { formatFileSize } from '@/lib/utils'
import { API_BASE_URL, apiRequest } from '@/services/api'
import type {
  AdminSummary,
  Book,
  BookFormat,
  BookReview,
  BookUserLoan,
  CatalogCategory,
  FallbackTone,
  LoanStatus,
  PaginatedResponse,
} from '@/types/arandu'

interface BackendCategoria {
  id: string
  nome: string
  slug: string
  descricao?: string | null
  total_livros?: number
}

interface BackendAutorResumo {
  id: string
  nome: string
}

interface BackendEditoraResumo {
  id: string
  nome: string
}

interface BackendEmprestimoResumo {
  id: string
  status: 'ATIVO' | 'ATRASADO' | 'DEVOLVIDO'
  status_display: string
  data_emprestimo: string
  data_prevista_devolucao: string
  dias_restantes: number
  renovacoes: number
  pode_ler: boolean
}

interface BackendAvaliacao {
  id: string
  usuario_id: string
  usuario_nome: string
  usuario_turma: string | null
  nota: number
  comentario: string | null
  criado_em: string
  atualizado_em: string
}

interface BackendLivro {
  id: string
  titulo: string
  autores: BackendAutorResumo[]
  categoria: BackendCategoria
  editora: BackendEditoraResumo | null
  isbn: string | null
  ano_publicacao: number
  sinopse?: string | null
  capa: string | null
  formato: BookFormat
  formato_display: string
  possui_arquivo: boolean
  possui_pdf: boolean
  nome_arquivo: string | null
  tamanho_arquivo: number | null
  quantidade_total: number
  quantidade_disponivel: number
  disponivel: boolean
  dominio_publico: boolean
  ativo: boolean
  nota_media: number | null
  total_avaliacoes: number
  total_acessos: number
  meu_emprestimo: BackendEmprestimoResumo | null
  cadastrado_por_nome?: string | null
  pode_ler?: boolean
  pode_baixar?: boolean
  minha_avaliacao?: BackendAvaliacao | null
  emprestimos_ativos?: number
}

interface BackendResumo {
  total_obras: number
  obras_ativas: number
  emprestimos_ativos: number
  em_atraso: number
  total_leituras: number
  total_downloads: number
  total_alunos: number
}

const FALLBACK_TONES: FallbackTone[] = ['shadow', 'azure', 'peach', 'green']

function resolveTone(id: string): FallbackTone {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 997
  }
  return FALLBACK_TONES[Math.abs(hash) % FALLBACK_TONES.length]
}

function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  try {
    const origin = new URL(API_BASE_URL).origin
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
  } catch {
    return url
  }
}

function mapLoanStatus(status: BackendEmprestimoResumo['status']): LoanStatus {
  if (status === 'ATRASADO') return 'atrasado'
  if (status === 'DEVOLVIDO') return 'devolvido'
  return 'ativo'
}

export function adaptCategoria(raw: BackendCategoria): CatalogCategory {
  return {
    id: raw.id,
    name: raw.nome,
    slug: raw.slug,
    description: raw.descricao ?? null,
    booksCount: raw.total_livros ?? 0,
  }
}

export function adaptAvaliacao(raw: BackendAvaliacao): BookReview {
  return {
    id: raw.id,
    userId: raw.usuario_id,
    userName: raw.usuario_nome,
    userClassRoom: raw.usuario_turma,
    rating: raw.nota,
    comment: raw.comentario,
    createdAt: raw.criado_em,
    updatedAt: raw.atualizado_em,
  }
}

function adaptUserLoan(raw: BackendEmprestimoResumo | null): BookUserLoan | null {
  if (!raw) return null
  return {
    id: raw.id,
    status: mapLoanStatus(raw.status),
    statusDisplay: raw.status_display,
    borrowedAt: raw.data_emprestimo,
    dueAt: raw.data_prevista_devolucao,
    daysLeft: raw.dias_restantes,
    renewals: raw.renovacoes,
    canRead: Boolean(raw.pode_ler),
  }
}

export function adaptLivro(raw: BackendLivro): Book {
  const authorsText =
    raw.autores && raw.autores.length > 0
      ? raw.autores.map((a) => a.nome).join(', ')
      : 'Autor não informado'

  return {
    id: raw.id,
    title: raw.titulo,
    author: authorsText,
    isbn: raw.isbn || undefined,
    categoryId: raw.categoria?.id,
    categories: raw.categoria ? [raw.categoria.nome] : [],
    publisherName: raw.editora?.nome ?? null,
    format: raw.formato === 'EPUB' ? 'EPUB' : 'PDF',
    accessMode: raw.dominio_publico ? 'public_domain' : 'temporary_loan',
    fileName: raw.nome_arquivo || 'Sem arquivo anexado',
    fileSize:
      typeof raw.tamanho_arquivo === 'number' && raw.tamanho_arquivo > 0
        ? formatFileSize(raw.tamanho_arquivo)
        : '—',
    pages: 0,
    year: raw.ano_publicacao,
    synopsis: raw.sinopse || 'Sinopse ainda não informada para esta obra.',
    curatorName: raw.cadastrado_por_nome || 'Equipe da Biblioteca',
    visible: Boolean(raw.ativo),
    downloadsCount: raw.total_acessos ?? 0,
    coverUrl: resolveMediaUrl(raw.capa),
    fallbackTone: resolveTone(raw.id),
    quantityTotal: raw.quantidade_total,
    quantityAvailable: raw.quantidade_disponivel,
    available: Boolean(raw.disponivel),
    hasFile: Boolean(raw.possui_arquivo),
    hasPdf: Boolean(raw.possui_pdf),
    canRead: raw.pode_ler,
    canDownload: raw.pode_baixar,
    ratingAvg: raw.nota_media,
    reviewsCount: raw.total_avaliacoes ?? 0,
    activeLoansCount: raw.emprestimos_ativos ?? 0,
    myLoan: adaptUserLoan(raw.meu_emprestimo),
    myReview: raw.minha_avaliacao ? adaptAvaliacao(raw.minha_avaliacao) : null,
  }
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value))
    }
  }
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

export async function listCategorias(): Promise<CatalogCategory[]> {
  const data = await apiRequest<PaginatedResponse<BackendCategoria>>('/categorias/?page_size=50')
  return data.results.map(adaptCategoria)
}

export async function createCategoria(name: string, description?: string): Promise<CatalogCategory> {
  const data = await apiRequest<BackendCategoria>('/categorias/', {
    method: 'POST',
    body: {
      nome: name.trim(),
      ...(description?.trim() ? { descricao: description.trim() } : {}),
    },
  })
  return adaptCategoria(data)
}

export async function listCatalogBooks(params?: {
  page?: number
  pageSize?: number
  search?: string
  categoria?: string
  formato?: BookFormat
  dominioPublico?: boolean
  disponivel?: boolean
}): Promise<PaginatedResponse<Book>> {
  const qs = buildQuery({
    page: params?.page,
    page_size: params?.pageSize,
    search: params?.search,
    categoria: params?.categoria,
    formato: params?.formato,
    dominio_publico: params?.dominioPublico,
    disponivel: params?.disponivel,
  })
  const data = await apiRequest<PaginatedResponse<BackendLivro>>(`/livros/${qs}`)
  return {
    ...data,
    results: data.results.map(adaptLivro),
  }
}

export async function getCatalogBook(bookId: string): Promise<Book> {
  const data = await apiRequest<BackendLivro>(`/livros/${bookId}/`)
  return adaptLivro(data)
}

export async function listBookReviews(
  bookId: string,
  page = 1,
): Promise<PaginatedResponse<BookReview>> {
  const data = await apiRequest<PaginatedResponse<BackendAvaliacao>>(
    `/livros/${bookId}/avaliacoes/?page=${page}`,
  )
  return {
    ...data,
    results: data.results.map(adaptAvaliacao),
  }
}

export async function submitBookReview(
  bookId: string,
  rating: number,
  comment?: string,
): Promise<BookReview> {
  const data = await apiRequest<BackendAvaliacao>(`/livros/${bookId}/avaliacoes/`, {
    method: 'POST',
    body: {
      nota: rating,
      comentario: comment?.trim() || '',
    },
  })
  return adaptAvaliacao(data)
}

export async function listAdminBooks(params?: {
  page?: number
  pageSize?: number
  search?: string
  categoria?: string
  ativo?: boolean
}): Promise<PaginatedResponse<Book>> {
  const qs = buildQuery({
    page: params?.page,
    page_size: params?.pageSize,
    search: params?.search,
    categoria: params?.categoria,
    ativo: params?.ativo,
  })
  const data = await apiRequest<PaginatedResponse<BackendLivro>>(`/gestao/livros/${qs}`)
  return {
    ...data,
    results: data.results.map(adaptLivro),
  }
}

export interface SaveAdminBookInput {
  title: string
  authorsText: string
  categoryId: string
  isbn?: string
  year: number
  synopsis?: string
  accessMode: 'public_domain' | 'temporary_loan'
  visible: boolean
  quantityTotal: number
  digitalFile?: File | null
  coverFile?: File | null
}

function buildBookFormData(input: SaveAdminBookInput): FormData {
  const form = new FormData()
  form.append('titulo', input.title.trim())
  form.append('categoria', input.categoryId)
  form.append('ano_publicacao', String(input.year))
  form.append('quantidade_total', String(Math.max(1, input.quantityTotal)))
  form.append('dominio_publico', input.accessMode === 'public_domain' ? 'true' : 'false')
  form.append('ativo', input.visible ? 'true' : 'false')
  form.append('sinopse', input.synopsis?.trim() || '')
  form.append('isbn', input.isbn?.trim() || '')

  const authorNames = input.authorsText
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  for (const name of authorNames) {
    form.append('autores_nomes', name)
  }

  if (input.digitalFile) {
    form.append('arquivo_pdf', input.digitalFile)
  }
  if (input.coverFile) {
    form.append('capa', input.coverFile)
  }

  return form
}

export async function createAdminBook(input: SaveAdminBookInput): Promise<Book> {
  const data = await apiRequest<BackendLivro>('/gestao/livros/', {
    method: 'POST',
    body: buildBookFormData(input),
  })
  return adaptLivro(data)
}

export async function updateAdminBook(bookId: string, input: SaveAdminBookInput): Promise<Book> {
  const data = await apiRequest<BackendLivro>(`/gestao/livros/${bookId}/`, {
    method: 'PATCH',
    body: buildBookFormData(input),
  })
  return adaptLivro(data)
}

export async function toggleAdminBookVisibility(bookId: string, ativo: boolean): Promise<Book> {
  const data = await apiRequest<BackendLivro>(`/gestao/livros/${bookId}/`, {
    method: 'PATCH',
    body: { ativo },
  })
  return adaptLivro(data)
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const data = await apiRequest<BackendResumo>('/gestao/resumo/')
  return {
    totalBooks: data.total_obras,
    activeBooks: data.obras_ativas,
    activeLoans: data.emprestimos_ativos,
    overdueLoans: data.em_atraso,
    totalReads: data.total_leituras,
    totalDownloads: data.total_downloads,
    totalStudents: data.total_alunos,
  }
}
