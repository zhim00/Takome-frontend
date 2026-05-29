import type { Book } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8888'

export function toText(value: unknown, fallback = '') {
  if (typeof value === 'string') {
    return value.trim() || fallback
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value)
  }

  return fallback
}

export function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

export function stripHtml(value: unknown, fallback = '暂无简介') {
  const text = toText(value, fallback)

  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim()
}

export function compactText(value: unknown, maxLength = 112, fallback = '暂无简介') {
  const text = stripHtml(value, fallback).replace(/\s+/g, ' ')
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

export function formatWords(words: number) {
  if (words >= 10000) {
    return `${(words / 10000).toFixed(1)} 万字`
  }

  return `${words} 字`
}

export function formatCount(count: number) {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)} 万`
  }

  return String(count)
}

export function formatDateLabel(value: string) {
  if (!value) {
    return '最近更新'
  }

  return value
}

export function statusLabel(status: Book['status']) {
  return status === 'finished' ? '已完结' : '连载中'
}

export function resolveAssetUrl(path?: string) {
  const value = toText(path)

  if (!value || value === '/images/default.gif') {
    return ''
  }

  if (/^https?:\/\//.test(value) || value.startsWith('data:')) {
    return value
  }

  return `${API_BASE}${value.startsWith('/') ? value : `/${value}`}`
}

export function initials(title: string) {
  return title.slice(0, 2).toUpperCase()
}

export function nowIso() {
  return new Date().toISOString()
}
