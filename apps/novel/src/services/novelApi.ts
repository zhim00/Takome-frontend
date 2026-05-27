import { apiRequest } from './apiClient'
import {
  mockBooks,
  mockCategories,
  mockNews,
  fallbackBook,
  createMockChapters,
  createMockContent,
} from './mockData'
import { compactText, resolveAssetUrl, stripHtml, toNumber, toText } from './format'
import type {
  Book,
  BookComment,
  Category,
  Chapter,
  ChapterContent,
  NewsItem,
  PageResult,
  SearchOptions,
} from './types'

interface ApiBook {
  id?: string | number
  categoryId?: string | number
  categoryName?: string
  picUrl?: string
  bookName?: string
  authorName?: string
  bookDesc?: string
  bookStatus?: string | number | null
  visitCount?: string | number | null
  wordCount?: string | number | null
  commentCount?: string | number | null
  firstChapterId?: string | number | null
  lastChapterId?: string | number | null
  lastChapterName?: string | null
  lastChapterUpdateTime?: string | null
  updateTime?: string | null
}

interface ApiChapter {
  id?: string | number
  bookId?: string | number | null
  chapterNum?: string | number | null
  chapterName?: string
  chapterWordCount?: string | number | null
  chapterUpdateTime?: string | null
  isVip?: string | number | null
}

interface ApiNews {
  id?: string | number
  categoryName?: string
  sourceName?: string
  title?: string
  updateTime?: string
  content?: string
}

interface ApiCommentInfo {
  id?: string | number
  commentContent?: string
  commentUser?: string
  commentUserId?: string | number
  commentUserPhoto?: string
  commentTime?: string
}

function mapBook(raw: ApiBook, source: Book['source'] = 'api'): Book {
  const id = toText(raw.id, `mock-${Math.random()}`)
  const title = stripHtml(raw.bookName, '未命名作品')

  return {
    id,
    categoryId: toText(raw.categoryId, '0'),
    categoryName: stripHtml(raw.categoryName, '未分类'),
    cover: resolveAssetUrl(raw.picUrl),
    title,
    author: stripHtml(raw.authorName, '佚名'),
    description: compactText(raw.bookDesc, 160),
    status: toNumber(raw.bookStatus) === 1 ? 'finished' : 'serial',
    visits: toNumber(raw.visitCount),
    words: toNumber(raw.wordCount),
    comments: toNumber(raw.commentCount),
    firstChapterId: toText(raw.firstChapterId) || undefined,
    lastChapterId: toText(raw.lastChapterId) || undefined,
    lastChapterName: stripHtml(raw.lastChapterName, '暂无最新章节'),
    updatedAt: toText(raw.updateTime ?? raw.lastChapterUpdateTime, '最近更新'),
    source,
  }
}

function mapChapter(raw: ApiChapter, bookId: string, order: number): Chapter {
  return {
    id: toText(raw.id, `${bookId}-${order + 1}`),
    bookId: toText(raw.bookId, bookId),
    order: toNumber(raw.chapterNum, order + 1),
    title: stripHtml(raw.chapterName, `第 ${order + 1} 章`),
    words: toNumber(raw.chapterWordCount),
    updatedAt: toText(raw.chapterUpdateTime, '最近更新'),
    isVip: toNumber(raw.isVip) === 1,
    source: 'api',
  }
}

function mapNews(raw: ApiNews, index: number): NewsItem {
  return {
    id: toText(raw.id, `news-${index}`),
    title: stripHtml(raw.title, '未命名资讯'),
    category: stripHtml(raw.categoryName, '资讯'),
    sourceName: stripHtml(raw.sourceName, 'Takome'),
    updatedAt: toText(raw.updateTime, '最近更新'),
    content: raw.content ? stripHtml(raw.content) : undefined,
    source: 'api',
  }
}

function fallbackBooks(pageNum = 1, pageSize = 10): PageResult<Book> {
  const start = (pageNum - 1) * pageSize
  const list = mockBooks.slice(start, start + pageSize)

  return {
    pageNum,
    pageSize,
    total: mockBooks.length,
    list,
    pages: Math.ceil(mockBooks.length / pageSize),
  }
}

export async function fetchUpdateRank() {
  try {
    const data = await apiRequest<ApiBook[]>('/api/front/book/update_rank')
    const books = (data ?? []).map((book) => mapBook(book))
    return books.length ? books : mockBooks.slice(0, 20)
  } catch {
    return mockBooks.slice(0, 20)
  }
}

export async function fetchVisitRank() {
  try {
    const data = await apiRequest<ApiBook[]>('/api/front/book/visit_rank')
    const books = (data ?? []).map((book) => mapBook(book))
    return books.length ? books : mockBooks.slice(0, 20)
  } catch {
    return mockBooks.slice(0, 20)
  }
}

export async function fetchNewestRank() {
  try {
    const data = await apiRequest<ApiBook[]>('/api/front/book/newest_rank')
    const books = (data ?? []).map((book) => mapBook(book))
    return books.length ? books : mockBooks.slice(0, 20)
  } catch {
    return mockBooks.slice(0, 20)
  }
}

export async function fetchNews() {
  try {
    const data = await apiRequest<ApiNews[]>('/api/front/news/latest_list')
    const news = (data ?? []).map(mapNews)
    return news.length >= 6 ? news.slice(0, 6) : [...news, ...mockNews].slice(0, 6)
  } catch {
    return mockNews
  }
}

export async function searchBooks(options: SearchOptions = {}): Promise<PageResult<Book>> {
  const pageNum = options.pageNum ?? 1
  const pageSize = options.pageSize ?? 10

  try {
    const data = await apiRequest<PageResult<ApiBook>>('/api/front/search/books', {
      query: {
        keyword: options.keyword,
        categoryId: options.categoryId,
        bookStatus: options.bookStatus,
        pageNum,
        pageSize,
        sort: options.sort,
        order: options.order,
      },
    })
    const list = (data?.list ?? []).map((book) => mapBook(book))

    return {
      pageNum: toNumber(data?.pageNum, pageNum),
      pageSize: toNumber(data?.pageSize, pageSize),
      total: toNumber(data?.total, list.length),
      list,
      pages: toNumber(data?.pages, 1),
    }
  } catch {
    return fallbackBooks(pageNum, pageSize)
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const [male, female] = await Promise.all([
      apiRequest<Category[]>('/api/front/book/category/list', { query: { workDirection: 0 } }),
      apiRequest<Category[]>('/api/front/book/category/list', { query: { workDirection: 1 } }),
    ])
    const categories = [...(male ?? []), ...(female ?? [])].map((category) => ({
      id: toText(category.id),
      name: stripHtml(category.name, '未分类'),
    }))

    return categories.length ? categories : mockCategories
  } catch {
    return mockCategories
  }
}

export async function fetchBook(bookId: string): Promise<Book> {
  try {
    const data = await apiRequest<ApiBook>(`/api/front/book/${bookId}`)
    return data ? mapBook(data) : (mockBooks.find((book) => book.id === bookId) ?? fallbackBook)
  } catch {
    return mockBooks.find((book) => book.id === bookId) ?? fallbackBook
  }
}

export async function fetchChapters(bookId: string): Promise<Chapter[]> {
  try {
    const data = await apiRequest<ApiChapter[]>('/api/front/book/chapter/list', {
      query: { bookId },
    })
    const chapters = (data ?? []).map((chapter, index) => mapChapter(chapter, bookId, index))
    return chapters.length ? chapters : createMockChapters(bookId)
  } catch {
    return createMockChapters(bookId)
  }
}

export async function fetchChapterContent(chapterId: string): Promise<ChapterContent> {
  try {
    const data = await apiRequest<{
      bookInfo?: ApiBook
      chapterInfo?: ApiChapter
      bookContent?: string
    }>(`/api/front/book/content/${chapterId}`)

    if (data?.bookInfo && data.chapterInfo) {
      const book = mapBook(data.bookInfo)
      const chapter = mapChapter(data.chapterInfo, book.id, 0)
      const content = stripHtml(data.bookContent, createMockContent(book, chapter))

      return { book, chapter, content, source: 'api' }
    }
  } catch {
    // fall through to mock content
  }

  const book = mockBooks[0] ?? fallbackBook
  const fallbackChapters = createMockChapters(book.id)
  const chapter =
    fallbackChapters.find((item) => item.id === chapterId) ??
    fallbackChapters[0] ?? {
      id: `${book.id}-1`,
      bookId: book.id,
      order: 1,
      title: '第一章',
      words: 3200,
      updatedAt: '最近更新',
      isVip: false,
      source: 'mock',
    }
  return {
    book,
    chapter,
    content: createMockContent(book, chapter),
    source: 'mock',
  }
}

export async function fetchBookComments(bookId: string): Promise<BookComment[]> {
  try {
    const data = await apiRequest<{ comments?: ApiCommentInfo[] }>('/api/front/book/comment/newest_list', {
      query: { bookId },
    })

    return (data?.comments ?? []).map((comment) => ({
      id: toText(comment.id, `${bookId}-comment`),
      bookId,
      userId: toText(comment.commentUserId, 'api-user'),
      userName: stripHtml(comment.commentUser, '读者'),
      userPhoto: resolveAssetUrl(comment.commentUserPhoto),
      content: stripHtml(comment.commentContent, '这本书值得继续读下去。'),
      createdAt: toText(comment.commentTime, '最近'),
      replies: [],
      source: 'api',
    }))
  } catch {
    return []
  }
}
