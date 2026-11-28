import { resolveRoleFromBackend } from '@/lib/rbac'
import { apiRequest } from '@/services/api'
import type { AuthLoanSummary, AuthUser, BackendUserType } from '@/types/arandu'

interface BackendTurmaResumo {
  id: string
  nome: string
  turno: 'MANHA' | 'TARDE' | 'INTEGRAL'
  turno_display: string
  ano_letivo: number
  ativa: boolean
}

interface BackendUsuarioPayload {
  id: string | null
  user_id: number
  username?: string
  nome: string
  email: string
  matricula: string | null
  tipo: BackendUserType
  tipo_display: string
  eh_bibliotecario: boolean
  turma: BackendTurmaResumo | null
  telefone: string | null
  ativo: boolean
  precisa_trocar_senha: boolean
  resumo_emprestimos?: AuthLoanSummary
}

interface BackendLoginResponse {
  access: string
  refresh: string
  usuario: BackendUsuarioPayload
}

interface BackendDetailResponse {
  detail: string
}

export function adaptBackendUser(raw: BackendUsuarioPayload): AuthUser {
  const role = resolveRoleFromBackend(raw.tipo, raw.eh_bibliotecario)
  return {
    id: raw.id,
    userId: raw.user_id,
    username: raw.username,
    name: raw.nome,
    email: raw.email,
    enrollmentId: raw.matricula,
    backendType: raw.tipo,
    typeDisplay: raw.tipo_display,
    role,
    isLibrarian: Boolean(raw.eh_bibliotecario),
    classRoom: raw.turma
      ? {
          id: raw.turma.id,
          nome: raw.turma.nome,
          turno: raw.turma.turno,
          turnoDisplay: raw.turma.turno_display,
          anoLetivo: raw.turma.ano_letivo,
          ativa: raw.turma.ativa,
        }
      : null,
    phone: raw.telefone,
    active: Boolean(raw.ativo),
    mustChangePassword: Boolean(raw.precisa_trocar_senha),
    loanSummary: raw.resumo_emprestimos,
  }
}

export async function loginWithApi(
  identificador: string,
  password: string,
): Promise<{ access: string; refresh: string; user: AuthUser }> {
  const data = await apiRequest<BackendLoginResponse>('/auth/login/', {
    method: 'POST',
    auth: false,
    retryOn401: false,
    body: {
      identificador: identificador.trim(),
      password,
    },
  })

  return {
    access: data.access,
    refresh: data.refresh,
    user: adaptBackendUser(data.usuario),
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const data = await apiRequest<BackendUsuarioPayload>('/auth/me/', {
    method: 'GET',
    auth: true,
  })
  return adaptBackendUser(data)
}

export async function requestPasswordReset(email: string): Promise<string> {
  const data = await apiRequest<BackendDetailResponse>('/auth/esqueci-senha/', {
    method: 'POST',
    auth: false,
    retryOn401: false,
    body: { email: email.trim().toLowerCase() },
  })
  return data.detail
}

export async function confirmPasswordReset(params: {
  uid: string
  token: string
  novaSenha: string
  confirmarNovaSenha: string
}): Promise<string> {
  const data = await apiRequest<BackendDetailResponse>('/auth/redefinir-senha/', {
    method: 'POST',
    auth: false,
    retryOn401: false,
    body: {
      uid: params.uid.trim(),
      token: params.token.trim(),
      nova_senha: params.novaSenha,
      confirmar_nova_senha: params.confirmarNovaSenha,
    },
  })
  return data.detail
}
