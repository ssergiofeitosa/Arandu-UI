const DEFAULT_API_URL = 'http://localhost:8080/api'

export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '')

const ACCESS_TOKEN_KEY = 'arandu_access_token'
const REFRESH_TOKEN_KEY = 'arandu_refresh_token'

export type FieldErrorMap = Record<string, string[]>

export class ApiError extends Error {
  status: number
  fieldErrors?: FieldErrorMap

  constructor(message: string, status: number, fieldErrors?: FieldErrorMap) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type UnauthorizedListener = (reason?: string) => void
let unauthorizedListener: UnauthorizedListener | null = null
let activeRefreshPromise: Promise<string | null> | null = null

export function setUnauthorizedHandler(handler: UnauthorizedListener | null) {
  unauthorizedListener = handler
}

export function getAccessToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function getRefreshToken(): string | null {
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthTokens(access: string, refresh?: string) {
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access)
    if (refresh) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    }
  } catch {
    // ignore restricted storage errors
  }
}

export function clearAuthTokens() {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // ignore restricted storage errors
  }
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

function parseErrorPayload(
  payload: unknown,
  fallbackMessage: string,
): { message: string; fieldErrors?: FieldErrorMap } {
  if (!payload || typeof payload !== 'object') {
    return { message: fallbackMessage }
  }

  const record = payload as Record<string, unknown>

  if (typeof record.detail === 'string' && record.detail.trim()) {
    return { message: record.detail.trim() }
  }

  const fieldErrors: FieldErrorMap = {}
  const messages: string[] = []

  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      const strs = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      if (strs.length > 0) {
        fieldErrors[key] = strs
        messages.push(strs[0])
      }
    } else if (typeof value === 'string' && value.trim()) {
      fieldErrors[key] = [value.trim()]
      messages.push(value.trim())
    }
  }

  return {
    message: messages[0] || fallbackMessage,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  }
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  if (!activeRefreshPromise) {
    activeRefreshPromise = (async () => {
      try {
        const response = await fetch(buildUrl('/auth/refresh/'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Accept-Language': 'pt-br',
          },
          body: JSON.stringify({ refresh }),
        })

        if (!response.ok) {
          clearAuthTokens()
          const payload = await parseJsonSafely(response)
          const { message } = parseErrorPayload(
            payload,
            'Sua sessão expirou. Faça login novamente.',
          )
          unauthorizedListener?.(message)
          return null
        }

        const data = (await response.json()) as { access?: string; refresh?: string }
        if (!data.access) {
          clearAuthTokens()
          return null
        }

        setAuthTokens(data.access, data.refresh)
        return data.access
      } catch {
        return null
      } finally {
        activeRefreshPromise = null
      }
    })()
  }

  return activeRefreshPromise
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  auth?: boolean
  retryOn401?: boolean
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    auth = true,
    retryOn401 = true,
    body,
    headers: customHeaders,
    ...rest
  } = options

  const headers = new Headers(customHeaders)
  headers.set('Accept', 'application/json')
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', 'pt-br')
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path), {
      ...rest,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      'Não foi possível conectar à API do Arandu. Verifique se o servidor Django está ativo.',
      0,
    )
  }

  if (response.status === 401 && auth && retryOn401 && getRefreshToken()) {
    const newAccess = await tryRefreshAccessToken()
    if (newAccess) {
      return apiRequest<T>(path, {
        ...options,
        retryOn401: false,
      })
    }
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await parseJsonSafely(response)

  if (!response.ok) {
    const defaultMessage =
      response.status === 401
        ? 'Sessão inválida ou credenciais incorretas.'
        : response.status === 403
          ? 'Você não tem permissão para realizar esta ação.'
          : response.status === 429
            ? 'Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.'
            : 'Não foi possível concluir a solicitação.'

    const { message, fieldErrors } = parseErrorPayload(payload, defaultMessage)

    if (response.status === 401 && auth) {
      clearAuthTokens()
      unauthorizedListener?.(message)
    }

    throw new ApiError(message, response.status, fieldErrors)
  }

  return payload as T
}
