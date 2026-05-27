import { getAuthUser } from './storage'
import type { ApiResult } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8888'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
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
  options: RequestInit & { query?: Record<string, string | number | boolean | undefined> } = {},
) {
  const token = getAuthUser()?.token
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
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
    throw new ApiError(result.message ?? '接口返回失败')
  }

  return result.data as T
}

export function getApiBase() {
  return API_BASE
}
