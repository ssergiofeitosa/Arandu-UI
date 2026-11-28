import { apiRequest } from '@/services/api'
import type {
  ClassRoom,
  PaginatedResponse,
  SchoolShift,
  SchoolShiftCode,
  Student,
} from '@/types/arandu'

interface BackendTurma {
  id: string
  nome: string
  turno: SchoolShiftCode
  turno_display: string
  ano_letivo: number
  ativa: boolean
  total_alunos?: number
}

interface BackendAluno {
  id: string
  user_id: number | null
  nome: string
  email: string
  matricula: string
  tipo: string
  tipo_display: string
  turma: string | null
  turma_detalhes: BackendTurma | null
  telefone: string | null
  ativo: boolean
  precisa_trocar_senha: boolean
  criado_em: string
  atualizado_em: string
  senha_temporaria?: string | null
}

function mapShiftCodeToLabel(code?: SchoolShiftCode | string | null): SchoolShift {
  if (code === 'MANHA') return 'Manhã'
  if (code === 'TARDE') return 'Tarde'
  return 'Integral'
}

export function adaptTurma(raw: BackendTurma): ClassRoom {
  return {
    id: raw.id,
    name: raw.nome,
    shiftCode: raw.turno,
    shift: mapShiftCodeToLabel(raw.turno),
    schoolYear: raw.ano_letivo,
    active: Boolean(raw.ativa),
    studentsCount: raw.total_alunos ?? 0,
  }
}

export function adaptAluno(raw: BackendAluno): Student {
  return {
    id: raw.id,
    name: raw.nome,
    enrollmentId: raw.matricula,
    email: raw.email,
    classRoomId: raw.turma,
    gradeClass: raw.turma_detalhes ? raw.turma_detalhes.nome : 'Sem turma',
    shift: raw.turma_detalhes ? mapShiftCodeToLabel(raw.turma_detalhes.turno) : 'Integral',
    phone: raw.telefone,
    status: raw.ativo ? 'ativo' : 'inativo',
    mustChangePassword: Boolean(raw.precisa_trocar_senha),
    createdAt: raw.criado_em,
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

export async function listTurmas(params?: {
  page?: number
  pageSize?: number
  ativa?: boolean
  search?: string
}): Promise<PaginatedResponse<ClassRoom>> {
  const qs = buildQuery({
    page: params?.page,
    page_size: params?.pageSize,
    ativa: params?.ativa,
    search: params?.search,
  })
  const data = await apiRequest<PaginatedResponse<BackendTurma>>(`/gestao/turmas/${qs}`)
  return {
    ...data,
    results: data.results.map(adaptTurma),
  }
}

export async function createTurma(payload: {
  name: string
  shiftCode: SchoolShiftCode
  schoolYear: number
}): Promise<ClassRoom> {
  const data = await apiRequest<BackendTurma>('/gestao/turmas/', {
    method: 'POST',
    body: {
      nome: payload.name.trim(),
      turno: payload.shiftCode,
      ano_letivo: payload.schoolYear,
      ativa: true,
    },
  })
  return adaptTurma(data)
}

export async function listAlunos(params?: {
  page?: number
  pageSize?: number
  search?: string
  turma?: string
  ativo?: boolean
}): Promise<PaginatedResponse<Student>> {
  const qs = buildQuery({
    page: params?.page,
    page_size: params?.pageSize,
    search: params?.search,
    turma: params?.turma,
    ativo: params?.ativo,
  })
  const data = await apiRequest<PaginatedResponse<BackendAluno>>(`/gestao/alunos/${qs}`)
  return {
    ...data,
    results: data.results.map(adaptAluno),
  }
}

export interface CreateAlunoInput {
  name: string
  email: string
  enrollmentId: string
  classRoomId: string | null
  phone?: string
  password?: string
  active?: boolean
  mustChangePassword?: boolean
}

export async function createAluno(
  payload: CreateAlunoInput,
): Promise<{ student: Student; temporaryPassword: string | null }> {
  const body: Record<string, unknown> = {
    nome: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    matricula: payload.enrollmentId.trim(),
    turma: payload.classRoomId || null,
    telefone: payload.phone?.trim() || null,
    ativo: payload.active ?? true,
    precisa_trocar_senha: payload.mustChangePassword ?? true,
  }
  if (payload.password && payload.password.trim()) {
    body.senha = payload.password
  }

  const data = await apiRequest<BackendAluno>('/gestao/alunos/', {
    method: 'POST',
    body,
  })

  return {
    student: adaptAluno(data),
    temporaryPassword: data.senha_temporaria ?? null,
  }
}

export interface UpdateAlunoInput {
  name?: string
  email?: string
  enrollmentId?: string
  classRoomId?: string | null
  phone?: string | null
  password?: string
  active?: boolean
  mustChangePassword?: boolean
}

export async function updateAluno(studentId: string, payload: UpdateAlunoInput): Promise<Student> {
  const body: Record<string, unknown> = {}
  if (payload.name !== undefined) body.nome = payload.name.trim()
  if (payload.email !== undefined) body.email = payload.email.trim().toLowerCase()
  if (payload.enrollmentId !== undefined) body.matricula = payload.enrollmentId.trim()
  if (payload.classRoomId !== undefined) body.turma = payload.classRoomId || null
  if (payload.phone !== undefined) body.telefone = payload.phone?.trim() || null
  if (payload.active !== undefined) body.ativo = payload.active
  if (payload.mustChangePassword !== undefined) {
    body.precisa_trocar_senha = payload.mustChangePassword
  }
  if (payload.password && payload.password.trim()) {
    body.senha = payload.password
  }

  const data = await apiRequest<BackendAluno>(`/gestao/alunos/${studentId}/`, {
    method: 'PATCH',
    body,
  })
  return adaptAluno(data)
}
