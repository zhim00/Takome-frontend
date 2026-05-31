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
  lastChapterUpdateTime?: string
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

export interface ChapterListResult {
  total: number
  chapters: Chapter[]
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
  workDirection?: 0 | 1
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

export interface BookCommentResult {
  total: number
  comments: BookComment[]
}

import type { SharedAuthUser } from '@takome/shared-auth'

export type AuthUser = SharedAuthUser

export type UserSex = 'unknown' | 'male' | 'female'

export interface UserProfileInfo {
  nickName: string
  avatar: string
  avatarPath: string
  sex: UserSex
}

export interface LegacyAuthUser {
  uid: string
  token: string
  nickName: string
  avatar?: string
  avatarPath?: string
  sex?: UserSex
  signature?: string
  source: 'api' | 'mock'
}

export interface BookshelfEntry {
  bookId: string
  addedAt: string
}

export interface UserBookshelfEntry {
  id: string
  bookId: string
  chapterId?: string
  chapterNum?: number
  chapterName?: string
  chapterTotal: number
  addedAt: string
  updatedAt: string
}

export interface BookshelfBookItem {
  entry: UserBookshelfEntry
  book: Book
  continueChapterId?: string
  progressText: string
}

export interface ReadingRecord {
  bookId: string
  chapterId: string
  bookTitle: string
  chapterTitle: string
  cover: string
  updatedAt: string
}

export interface UserReadingHistoryItem {
  id: string
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
  updatedAt?: string
  reply?: string
  source: 'api' | 'mock'
}

export interface UserCommentItem {
  id: string
  commentId: string
  bookId: string
  bookTitle: string
  bookCover: string
  content: string
  createdAt: string
}

export interface UserFeedbackItem {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface SearchOptions {
  keyword?: string
  workDirection?: string
  categoryId?: string
  isVip?: string
  bookStatus?: string
  wordCountMin?: number
  wordCountMax?: number
  updateTimeMin?: string
  pageNum?: number
  pageSize?: number
  sort?: string
  order?: string
  hydrateDetails?: boolean
}
