import { clearExpiredAuth, getAuthUser } from './storage'
import type { ApiResult } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8888'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message)
  }
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(path, API_BASE)

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return url
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & {
    query?: Record<string, string | number | boolean | undefined>
    skipAuth?: boolean
    skipAuthExpiredHandler?: boolean
  } = {},
) {
  const token = getAuthUser()?.token
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !options.skipAuth) {
    headers.set('Authorization', token)
  }

  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new ApiError(`HTTP ${response.status}`, response.status)
  }

  const result = (await response.json()) as ApiResult<T>

  if (result.ok === false) {
    if (result.code === 'A0230' && !options.skipAuthExpiredHandler) {
      clearExpiredAuth()
    }

    throw new ApiError(result.message ?? '接口返回失败', undefined, result.code)
  }

  return result.data as T
}

export function getApiBase() {
  return API_BASE
}
