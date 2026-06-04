import { clearExpiredAuth, getAuthUser } from './storage'
import type { ApiResult } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8888'
const SSE_BLOCK_SEPARATOR = /\r\n\r\n|\n\n|\r\r/

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message)
  }
}

export interface SseStreamEvent {
  event: string
  data: string
}

type SseStreamEventHandler = (event: SseStreamEvent) => void | boolean | Promise<void | boolean>

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

function parseSseBlock(block: string): SseStreamEvent | null {
  let event = 'message'
  const dataLines: string[] = []
  let hasEventContent = false

  for (const line of block.split(/\r\n|\n|\r/)) {
    if (!line || line.startsWith(':')) {
      continue
    }

    hasEventContent = true

    const separatorIndex = line.indexOf(':')
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    let value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1)

    if (value.startsWith(' ')) {
      value = value.slice(1)
    }

    if (field === 'event') {
      event = value
      continue
    }

    if (field === 'data') {
      dataLines.push(value)
    }
  }

  if (!hasEventContent || (event === 'message' && dataLines.length === 0)) {
    return null
  }

  return {
    event,
    data: dataLines.join('\n'),
  }
}

async function dispatchSseBuffer(buffer: string, onEvent: SseStreamEventHandler) {
  let remaining = buffer

  while (true) {
    const match = remaining.match(SSE_BLOCK_SEPARATOR)

    if (!match || match.index === undefined) {
      return {
        buffer: remaining,
        shouldStop: false,
      }
    }

    const block = remaining.slice(0, match.index)
    remaining = remaining.slice(match.index + match[0].length)

    const event = parseSseBlock(block)

    if (!event) {
      continue
    }

    const result = await onEvent(event)

    if (result === false) {
      return {
        buffer: remaining,
        shouldStop: true,
      }
    }
  }
}

async function dispatchRemainingSseBuffer(buffer: string, onEvent: SseStreamEventHandler) {
  if (!buffer.trim()) {
    return false
  }

  const event = parseSseBlock(buffer)

  if (!event) {
    return false
  }

  return (await onEvent(event)) === false
}

async function readApiError(response: Response, skipAuthExpiredHandler?: boolean) {
  const bodyText = await response.text().catch(() => '')

  if (bodyText) {
    try {
      const result = JSON.parse(bodyText) as ApiResult<unknown>

      if (result.ok === false) {
        if (result.code === 'A0230' && !skipAuthExpiredHandler) {
          clearExpiredAuth()
        }

        return new ApiError(result.message ?? '接口返回失败', response.status, result.code)
      }
    } catch {
      // Fall through to the same HTTP status message used by apiRequest.
    }
  }

  return new ApiError(`HTTP ${response.status}`, response.status)
}

export async function apiStreamRequest(
  path: string,
  options: RequestInit & {
    query?: Record<string, string | number | boolean | undefined>
    skipAuth?: boolean
    skipAuthExpiredHandler?: boolean
    onEvent: SseStreamEventHandler
  },
) {
  const {
    query,
    skipAuth,
    skipAuthExpiredHandler,
    onEvent,
    headers: initHeaders,
    ...fetchOptions
  } = options
  const token = getAuthUser()?.token
  const headers = new Headers(initHeaders)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'text/event-stream')
  }

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !skipAuth) {
    headers.set('Authorization', token)
  }

  const response = await fetch(buildUrl(path, query), {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    throw await readApiError(response, skipAuthExpiredHandler)
  }

  if (!response.body) {
    throw new ApiError('接口未返回可读取的响应流', response.status)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let streamEndedNaturally = false

  try {
    while (true) {
      const { value, done } = await reader.read()

      if (done) {
        streamEndedNaturally = true
        break
      }

      buffer += decoder.decode(value, { stream: true })

      const result = await dispatchSseBuffer(buffer, onEvent)
      buffer = result.buffer

      if (result.shouldStop) {
        return
      }
    }

    buffer += decoder.decode()
    await dispatchRemainingSseBuffer(buffer, onEvent)
  } finally {
    if (!streamEndedNaturally) {
      await reader.cancel().catch(() => undefined)
    }

    reader.releaseLock()
  }
}

export function getApiBase() {
  return API_BASE
}
