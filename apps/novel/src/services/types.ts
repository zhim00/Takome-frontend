export interface ApiResult<T> {
  code?: string
  message?: string
  data?: T
  ok?: boolean
}

export interface PageResult<T> {
  pageNum: number
  pageSize: number
  total: number
  list: T[]
  pages: number
}

export interface Book {
  id: string
  categoryId: string
  categoryName: string
  cover: string
  title: string
  author: string
  description: string
  status: 'serial' | 'finished'
  visits: number
  words: number
  comments: number
  firstChapterId?: string
  lastChapterId?: string
  lastChapterName: string
  updatedAt: string
  source: 'api' | 'mock'
}

export interface Chapter {
  id: string
  bookId: string
  order: number
  title: string
  words: number
  updatedAt: string
  isVip: boolean
  source: 'api' | 'mock'
}

export interface ChapterContent {
  book: Book
  chapter: Chapter
  content: string
  source: 'api' | 'mock'
}

export interface Category {
  id: string
  name: string
}

export interface NewsItem {
  id: string
  title: string
  category: string
  sourceName: string
  updatedAt: string
  content?: string
  source: 'api' | 'mock'
}

export interface CommentReply {
  id: string
  content: string
  userName: string
  createdAt: string
}

export interface BookComment {
  id: string
  bookId: string
  userId: string
  userName: string
  userPhoto?: string
  content: string
  createdAt: string
  replies: CommentReply[]
  source: 'api' | 'mock'
}

import type { SharedAuthUser } from '@takome/shared-auth'

export type AuthUser = SharedAuthUser

export interface LegacyAuthUser {
  uid: string
  token: string
  nickName: string
  avatar?: string
  sex?: 'unknown' | 'male' | 'female'
  signature?: string
  source: 'api' | 'mock'
}

export interface BookshelfEntry {
  bookId: string
  addedAt: string
}

export interface ReadingRecord {
  bookId: string
  chapterId: string
  bookTitle: string
  chapterTitle: string
  cover: string
  updatedAt: string
}

export interface FeedbackItem {
  id: string
  content: string
  createdAt: string
  reply?: string
  source: 'api' | 'mock'
}

export interface SearchOptions {
  keyword?: string
  categoryId?: string
  bookStatus?: string
  pageNum?: number
  pageSize?: number
  sort?: string
  order?: string
}
