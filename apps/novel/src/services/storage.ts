import { readSharedAuth, writeSharedAuth } from '@takome/shared-auth'
import type { AuthUser, BookComment, BookshelfEntry, FeedbackItem, ReadingRecord } from './types'

const STORAGE_PREFIX = 'takome:novel:'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getAuthUser() {
  return readSharedAuth() as AuthUser | null
}

export function setAuthUser(user: AuthUser | null) {
  writeSharedAuth(user)
}

export function getBookshelf() {
  return readJson<BookshelfEntry[]>(`${STORAGE_PREFIX}bookshelf`, [])
}

export function setBookshelf(entries: BookshelfEntry[]) {
  writeJson(`${STORAGE_PREFIX}bookshelf`, entries)
}

export function getReadingRecords() {
  return readJson<ReadingRecord[]>(`${STORAGE_PREFIX}reading-records`, [])
}

export function setReadingRecords(records: ReadingRecord[]) {
  writeJson(`${STORAGE_PREFIX}reading-records`, records)
}

export function getComments() {
  return readJson<BookComment[]>(`${STORAGE_PREFIX}comments`, [])
}

export function setComments(comments: BookComment[]) {
  writeJson(`${STORAGE_PREFIX}comments`, comments)
}

export function getFeedback() {
  return readJson<FeedbackItem[]>(`${STORAGE_PREFIX}feedback`, [])
}

export function setFeedback(items: FeedbackItem[]) {
  writeJson(`${STORAGE_PREFIX}feedback`, items)
}

export function getProfileDraft() {
  return readJson<Partial<AuthUser>>(`${STORAGE_PREFIX}profile`, {})
}

export function setProfileDraft(profile: Partial<AuthUser>) {
  writeJson(`${STORAGE_PREFIX}profile`, profile)
}

export function getReaderSettings() {
  return readJson(`${STORAGE_PREFIX}reader-settings`, { fontSize: 20, night: false })
}

export function setReaderSettings(settings: { fontSize: number; night: boolean }) {
  writeJson(`${STORAGE_PREFIX}reader-settings`, settings)
}
