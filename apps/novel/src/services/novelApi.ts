import { apiRequest } from './apiClient'
import { mockBooks, fallbackBook, createMockChapters } from './mockData'
import { compactText, resolveAssetUrl, stripHtml, toNumber, toText } from './format'
import type {
  Book,
  BookComment,
  BookCommentResult,
  BookshelfBookItem,
  Category,
  Chapter,
  ChapterContent,
  ChapterListResult,
  NewsItem,
  PageResult,
  SearchOptions,
  UserBookshelfEntry,
  UserCommentItem,
  UserFeedbackItem,
  UserProfileInfo,
  UserReadingHistoryItem,
  UserSex,
} from './types'

interface ApiBook {
  id?: string | number
  bookId?: string | number
  type?: string | number | null
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

interface ApiBookCommentResult {
  commentTotal?: string | number | null
  comments?: ApiCommentInfo[]
}

interface ApiBookshelfEntry {
  id?: string | number
  bookId?: string | number
  preContentId?: string | number | null
  chapterId?: string | number | null
  contentId?: string | number | null
  chapterNum?: string | number | null
  chapterName?: string | null
  chapterTotal?: string | number | null
  createTime?: string | null
  updateTime?: string | null
}

interface ApiReadingHistory {
  id?: string | number
  bookId?: string | number
  preContentId?: string | number | null
  chapterId?: string | number | null
  contentId?: string | number | null
  picUrl?: string
  bookName?: string
  chapterName?: string
  createTime?: string | null
  updateTime?: string | null
}

interface ApiUserInfo {
  nickName?: string | null
  userPhoto?: string | null
  userSex?: string | number | null
}

interface ApiUserComment {
  id?: string | number
  commentId?: string | number
  commentBookCommentId?: string | number
  commentContent?: string
  commentBookPic?: string
  commentBookId?: string | number
  commentBook?: string
  commentTime?: string
}

interface ApiUserFeedback {
  id?: string | number
  userId?: string | number
  content?: string
  createTime?: string
  updateTime?: string
}

interface PageQuery {
  pageNum?: number
  pageSize?: number
  sort?: string
  order?: string
}

function mapBook(raw: ApiBook, source: Book['source'] = 'api'): Book {
  const id = toText(raw.id ?? raw.bookId, `api-book-${Math.random().toString(36).slice(2)}`)
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
    lastChapterUpdateTime: toText(raw.lastChapterUpdateTime) || undefined,
    updatedAt: toText(raw.updateTime ?? raw.lastChapterUpdateTime, '最近更新'),
    source,
  }
}

function pageList<T>(data?: PageResult<T> | T[] | null) {
  return Array.isArray(data) ? data : (data?.list ?? [])
}

function normalizePageResult<T>(
  data: PageResult<T> | T[] | null | undefined,
  fallback: Required<Pick<PageQuery, 'pageNum' | 'pageSize'>>,
): PageResult<T> {
  const list = pageList(data)

  if (Array.isArray(data)) {
    return {
      pageNum: fallback.pageNum,
      pageSize: fallback.pageSize,
      total: list.length,
      list,
      pages: list.length > 0 ? 1 : 0,
    }
  }

  return {
    pageNum: toNumber(data?.pageNum, fallback.pageNum),
    pageSize: toNumber(data?.pageSize, fallback.pageSize),
    total: toNumber(data?.total, list.length),
    list,
    pages: toNumber(data?.pages, list.length > 0 ? 1 : 0),
  }
}

function mapApiSex(value: unknown): UserSex {
  const sex = toNumber(value, -1)

  if (sex === 0) {
    return 'male'
  }

  if (sex === 1) {
    return 'female'
  }

  return 'unknown'
}

function sexToApi(sex?: UserSex) {
  if (sex === 'male') {
    return 0
  }

  if (sex === 'female') {
    return 1
  }

  return undefined
}

function toNumericId(value?: string) {
  if (!value || !/^\d+$/.test(value)) {
    return undefined
  }

  return Number(value)
}

function mapUserProfile(raw?: ApiUserInfo | null): UserProfileInfo {
  const avatarPath = toText(raw?.userPhoto)

  return {
    nickName: stripHtml(raw?.nickName, ''),
    avatar: resolveAssetUrl(avatarPath),
    avatarPath,
    sex: mapApiSex(raw?.userSex),
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

function parseChineseNumber(value: string) {
  const digits: Record<string, number> = {
    零: 0,
    〇: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  }
  const units: Record<string, number> = {
    十: 10,
    百: 100,
    千: 1000,
    万: 10000,
  }

  let total = 0
  let section = 0
  let current = 0

  for (const char of value) {
    if (char in digits) {
      current = digits[char] ?? 0
      continue
    }

    const unit = units[char]

    if (!unit) {
      return 0
    }

    if (unit === 10000) {
      section = (section + current) * unit
      total += section
      section = 0
    } else {
      section += (current || 1) * unit
    }

    current = 0
  }

  return total + section + current
}

function parseChapterTitleNumber(title?: string) {
  const text = stripHtml(title, '')
  const matched = text.match(/第\s*([0-9零〇一二两三四五六七八九十百千万]+)\s*章/)

  if (!matched) {
    return 0
  }

  const rawNumber = matched[1] ?? ''

  if (/^\d+$/.test(rawNumber)) {
    return Number(rawNumber)
  }

  return parseChineseNumber(rawNumber)
}

function getChapterTotal(data: PageResult<ApiChapter> | ApiChapter[] | null | undefined) {
  if (Array.isArray(data)) {
    return data.length
  }

  return toNumber(data?.total, pageList(data).length)
}

function mapNews(raw: ApiNews, index: number, fallbackId = `news-${index}`): NewsItem {
  return {
    id: toText(raw.id, fallbackId),
    title: stripHtml(raw.title, '未命名资讯'),
    category: stripHtml(raw.categoryName, '资讯'),
    sourceName: stripHtml(raw.sourceName, 'Takome'),
    updatedAt: toText(raw.updateTime, '最近更新'),
    content: raw.content ? stripHtml(raw.content) : undefined,
    source: 'api',
  }
}

function mapBookshelfEntry(raw: ApiBookshelfEntry, index: number): UserBookshelfEntry {
  const bookId = toText(raw.bookId)
  const chapterId = toText(raw.preContentId ?? raw.chapterId ?? raw.contentId) || undefined
  const chapterName = chapterId ? stripHtml(raw.chapterName, '') : undefined
  const chapterNum = chapterId
    ? toNumber(raw.chapterNum) || parseChapterTitleNumber(chapterName)
    : undefined

  return {
    id: toText(raw.id, `${bookId || 'bookshelf'}-${index}`),
    bookId,
    chapterId,
    chapterNum,
    chapterName,
    chapterTotal: toNumber(raw.chapterTotal),
    addedAt: toText(raw.createTime, ''),
    updatedAt: toText(raw.updateTime ?? raw.createTime, ''),
  }
}

function mapReadingHistory(raw: ApiReadingHistory, index: number): UserReadingHistoryItem {
  const bookId = toText(raw.bookId)
  const chapterId = toText(raw.preContentId ?? raw.chapterId ?? raw.contentId)

  return {
    id: toText(raw.id, `${bookId || 'history'}-${chapterId || index}`),
    bookId,
    chapterId,
    bookTitle: stripHtml(raw.bookName, bookId ? `作品 #${bookId}` : '未知作品'),
    chapterTitle: stripHtml(raw.chapterName, chapterId ? `章节 #${chapterId}` : '未知章节'),
    cover: resolveAssetUrl(raw.picUrl),
    updatedAt: toText(raw.updateTime ?? raw.createTime, ''),
  }
}

function mapUserComment(raw: ApiUserComment, index: number): UserCommentItem {
  const bookId = toText(raw.commentBookId)
  const commentId = toText(raw.commentId ?? raw.id ?? raw.commentBookCommentId)

  return {
    id: commentId || `${bookId || 'comment'}-${index}`,
    commentId,
    bookId,
    bookTitle: stripHtml(raw.commentBook, bookId ? `作品 #${bookId}` : '未知作品'),
    bookCover: resolveAssetUrl(raw.commentBookPic),
    content: stripHtml(raw.commentContent, ''),
    createdAt: toText(raw.commentTime, ''),
  }
}

function mapUserFeedback(raw: ApiUserFeedback, index: number): UserFeedbackItem {
  const createdAt = toText(raw.createTime, '')

  return {
    id: toText(raw.id, `feedback-${index}`),
    content: stripHtml(raw.content, ''),
    createdAt,
    updatedAt: toText(raw.updateTime, createdAt),
  }
}

function progressText(entry: UserBookshelfEntry) {
  if (!entry.chapterId) {
    return '未读过'
  }

  if (entry.chapterNum && entry.chapterTotal) {
    return `${entry.chapterNum}章/${entry.chapterTotal}章`
  }

  if (entry.chapterName) {
    return `读至 ${entry.chapterName}`
  }

  return '已读过'
}

export async function fetchUpdateRank() {
  const data = await apiRequest<ApiBook[]>('/api/front/book/update_rank')
  return (data ?? []).map((book) => mapBook(book))
}

export async function fetchVisitRank() {
  const data = await apiRequest<ApiBook[]>('/api/front/book/visit_rank')
  return (data ?? []).map((book) => mapBook(book))
}

export async function increaseBookVisit(bookId: string) {
  await apiRequest<void>('/api/front/book/visit', {
    method: 'POST',
    query: { bookId },
  })
}

export async function fetchNewestRank() {
  const data = await apiRequest<ApiBook[]>('/api/front/book/newest_rank')
  return (data ?? []).map((book) => mapBook(book))
}

export async function fetchHomeBooks(type: number, limit?: number) {
  const data = await apiRequest<ApiBook[]>('/api/front/home/books')

  const books = (data ?? [])
    .filter((book) => String(book.type) === String(type))
    .slice(0, limit)

  return Promise.all(
    books.map(async (book) => {
      const bookId = toText(book.bookId ?? book.id)

      if (!bookId) {
        return mapBook(book)
      }

      try {
        const detail = await apiRequest<ApiBook>(`/api/front/book/${bookId}`)
        return mapBook(detail ?? book)
      } catch {
        return mapBook(book)
      }
    }),
  )
}

export async function fetchBookRecommendations(bookId: string): Promise<Book[]> {
  try {
    const data = await apiRequest<ApiBook[]>('/api/front/book/rec_list', {
      query: { bookId },
    })

    return (data ?? []).slice(0, 4).map((book) => mapBook(book))
  } catch {
    return []
  }
}

export async function fetchNews() {
  const data = await apiRequest<ApiNews[]>('/api/front/news/latest_list')
  return (data ?? []).map((item, index) => mapNews(item, index))
}

export async function fetchNewsDetail(newsId: string): Promise<NewsItem> {
  const data = await apiRequest<ApiNews>(`/api/front/news/${newsId}`)
  return mapNews(data ?? { id: newsId }, 0, newsId)
}

export async function fetchUserProfile(token?: string): Promise<UserProfileInfo> {
  const data = await apiRequest<ApiUserInfo>(
    '/api/front/user',
    token
      ? {
          headers: { Authorization: token },
          skipAuth: true,
        }
      : undefined,
  )
  return mapUserProfile(data)
}

export async function updateUserProfile(options: {
  userId: string
  nickName?: string
  avatarPath?: string
  sex?: UserSex
}) {
  const body: {
    userId?: number
    nickName?: string
    userPhoto?: string
    userSex?: number
  } = {
    userId: toNumericId(options.userId),
    nickName: options.nickName,
    userPhoto: options.avatarPath,
    userSex: sexToApi(options.sex),
  }

  await apiRequest<void>('/api/front/user', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function uploadUserImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const imagePath = await apiRequest<string>('/api/front/resource/image', {
    method: 'POST',
    body: formData,
  })

  return toText(imagePath)
}

export function createDefaultUserAvatar(seed = 'takome-reader') {
  const encodedSeed = encodeURIComponent(seed || 'takome-reader')

  return {
    path: '',
    url: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodedSeed}`,
  }
}

export async function searchBooks(options: SearchOptions = {}): Promise<PageResult<Book>> {
  const pageNum = options.pageNum ?? 1
  const pageSize = options.pageSize ?? 10

  const data = await apiRequest<PageResult<ApiBook>>('/api/front/search/books', {
    query: {
      keyword: options.keyword,
      workDirection: options.workDirection,
      categoryId: options.categoryId,
      isVip: options.isVip,
      bookStatus: options.bookStatus,
      wordCountMin: options.wordCountMin,
      wordCountMax: options.wordCountMax,
      updateTimeMin: options.updateTimeMin,
      pageNum,
      pageSize,
      sort: options.sort,
      order: options.order,
    },
  })
  const sourceList = data?.list ?? []
  const list = options.hydrateDetails
    ? await Promise.all(
        sourceList.map(async (book) => {
          const bookId = toText(book.id ?? book.bookId)

          if (!bookId) {
            return mapBook(book)
          }

          try {
            const detail = await apiRequest<ApiBook>(`/api/front/book/${bookId}`)
            return mapBook(detail ?? book)
          } catch {
            return mapBook(book)
          }
        }),
      )
    : sourceList.map((book) => mapBook(book))

  return {
    pageNum: toNumber(data?.pageNum, pageNum),
    pageSize: toNumber(data?.pageSize, pageSize),
    total: toNumber(data?.total, list.length),
    list,
    pages: toNumber(data?.pages, 1),
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const [male, female] = await Promise.all([
    apiRequest<Category[]>('/api/front/book/category/list', { query: { workDirection: 0 } }),
    apiRequest<Category[]>('/api/front/book/category/list', { query: { workDirection: 1 } }),
  ])

  return [
    ...(male ?? []).map((category) => ({
      id: toText(category.id),
      name: stripHtml(category.name, '未分类'),
      workDirection: 0 as const,
    })),
    ...(female ?? []).map((category) => ({
      id: toText(category.id),
      name: stripHtml(category.name, '未分类'),
      workDirection: 1 as const,
    })),
  ]
}

export async function fetchBook(
  bookId: string,
  options: { fallback?: boolean } = {},
): Promise<Book> {
  const shouldFallback = options.fallback ?? true

  try {
    const data = await apiRequest<ApiBook>(`/api/front/book/${bookId}`)

    if (data) {
      return mapBook(data)
    }
  } catch {
    if (!shouldFallback) {
      throw new Error('小说详情加载失败')
    }
  }

  if (!shouldFallback) {
    throw new Error('小说详情不存在')
  }

  return mockBooks.find((book) => book.id === bookId) ?? fallbackBook
}

export async function fetchChapters(
  bookId: string,
  options: { fallback?: boolean } = {},
): Promise<ChapterListResult> {
  const shouldFallback = options.fallback ?? true

  try {
    const data = await apiRequest<PageResult<ApiChapter> | ApiChapter[]>(
      '/api/front/book/chapter/list',
      {
        query: { bookId },
      },
    )
    const rawChapters = pageList(data)
    const chapters = rawChapters.map((chapter, index) => mapChapter(chapter, bookId, index))
    const usesApiChapters = chapters.length > 0 || !shouldFallback
    const fallbackChapters = usesApiChapters ? chapters : createMockChapters(bookId)

    return {
      total: usesApiChapters ? getChapterTotal(data) : fallbackChapters.length,
      chapters: fallbackChapters,
    }
  } catch {
    if (!shouldFallback) {
      return {
        total: 0,
        chapters: [],
      }
    }

    const chapters = createMockChapters(bookId)
    return {
      total: chapters.length,
      chapters,
    }
  }
}

export async function fetchChapterContent(chapterId: string): Promise<ChapterContent> {
  const data = await apiRequest<{
    bookInfo?: ApiBook
    chapterInfo?: ApiChapter
    bookContent?: string
  }>(`/api/front/book/content/${chapterId}`)

  if (!data?.bookInfo || !data.chapterInfo) {
    throw new Error('章节内容接口缺少书籍或章节信息')
  }

  const book = mapBook(data.bookInfo)
  const chapter = mapChapter(data.chapterInfo, book.id, 0)
  const content = stripHtml(data.bookContent, '')

  return { book, chapter, content, source: 'api' }
}

function normalizeChapterId(value: unknown, currentChapterId: string) {
  const id = toText(value)

  if (!id || id === '0' || id === currentChapterId) {
    return undefined
  }

  return id
}

export async function fetchPreviousChapterId(chapterId: string) {
  const data = await apiRequest<string | number | null>(`/api/front/book/pre_chapter_id/${chapterId}`)
  return normalizeChapterId(data, chapterId)
}

export async function fetchNextChapterId(chapterId: string) {
  const data = await apiRequest<string | number | null>(`/api/front/book/next_chapter_id/${chapterId}`)
  return normalizeChapterId(data, chapterId)
}

export async function fetchBookshelfStatus(bookId: string) {
  const data = await apiRequest<string | number | boolean | null>('/api/front/user/bookshelf_status', {
    query: { bookId },
  })

  if (typeof data === 'boolean') {
    return data
  }

  return toNumber(data) === 1 || toText(data).toLowerCase() === 'true'
}

export async function fetchUserBookshelfEntries(options: {
  pageNum?: number
  pageSize?: number
  fetchAll?: boolean
} = {}): Promise<UserBookshelfEntry[]> {
  const data = await apiRequest<PageResult<ApiBookshelfEntry> | ApiBookshelfEntry[]>(
    '/api/front/user/bookshelf',
    {
      query: {
        pageNum: options.pageNum,
        pageSize: options.pageSize,
        fetchAll: options.fetchAll ?? true,
      },
    },
  )

  return pageList(data)
    .map((entry, index) => mapBookshelfEntry(entry, index))
    .filter((entry) => entry.bookId)
}

export async function fetchUserBookshelfBooks(): Promise<BookshelfBookItem[]> {
  const entries = await fetchUserBookshelfEntries({ fetchAll: true })

  return Promise.all(
    entries.map(async (entry) => {
      const book = await fetchBook(entry.bookId, { fallback: false })

      return {
        entry,
        book,
        continueChapterId: entry.chapterId ?? book.firstChapterId,
        progressText: progressText(entry),
      }
    }),
  )
}

export async function addBookToBookshelf(bookId: string) {
  await apiRequest<void>('/api/front/user/bookshelf', {
    method: 'POST',
    body: JSON.stringify({ bookId }),
  })
}

export async function removeBookFromBookshelf(bookId: string) {
  await apiRequest<void>(`/api/front/user/bookshelf/${bookId}`, {
    method: 'DELETE',
  })
}

export async function recordReadingHistory(bookId: string, chapterId: string) {
  await apiRequest<void>('/api/front/user/read_history', {
    method: 'POST',
    body: JSON.stringify({ bookId, chapterId }),
  })
}

export async function fetchUserReadingHistory(options: {
  pageNum?: number
  pageSize?: number
  withinDays?: number
  fetchAll?: boolean
} = {}): Promise<UserReadingHistoryItem[]> {
  const data = await apiRequest<PageResult<ApiReadingHistory> | ApiReadingHistory[]>(
    '/api/front/user/read_history',
    {
      query: {
        pageNum: options.pageNum,
        pageSize: options.pageSize,
        withinDays: options.withinDays ?? 30,
        fetchAll: options.fetchAll ?? true,
      },
    },
  )

  return pageList(data)
    .map((history, index) => mapReadingHistory(history, index))
    .filter((history) => history.bookId && history.chapterId)
}

export async function deleteReadingHistory(historyId: string) {
  await apiRequest<void>(`/api/front/user/read_history/${historyId}`, {
    method: 'DELETE',
  })
}

export async function deleteReadingHistories(historyIds: string[]) {
  await apiRequest<void>('/api/front/user/read_history/batch', {
    method: 'DELETE',
    body: JSON.stringify({ ids: historyIds }),
  })
}

export async function fetchBookComments(bookId: string): Promise<BookCommentResult> {
  try {
    const data = await apiRequest<ApiBookCommentResult>('/api/front/book/comment/newest_list', {
      query: { bookId },
    })
    const comments = data?.comments ?? []

    return {
      total: toNumber(data?.commentTotal, comments.length),
      comments: comments.map((comment) => ({
        id: toText(comment.id, `${bookId}-comment`),
        bookId,
        userId: toText(comment.commentUserId, 'api-user'),
        userName: stripHtml(comment.commentUser, '读者'),
        userPhoto: resolveAssetUrl(comment.commentUserPhoto),
        content: stripHtml(comment.commentContent, '这本书值得继续读下去。'),
        createdAt: toText(comment.commentTime, '最近'),
        replies: [],
        source: 'api',
      })),
    }
  } catch {
    return { total: 0, comments: [] }
  }
}

export async function fetchUserComments(options: PageQuery = {}): Promise<PageResult<UserCommentItem>> {
  const pageNum = options.pageNum ?? 1
  const pageSize = options.pageSize ?? 10
  const data = await apiRequest<PageResult<ApiUserComment>>('/api/front/user/comments', {
    query: {
      pageNum,
      pageSize,
      sort: options.sort,
      order: options.order,
    },
  })
  const page = normalizePageResult(data, { pageNum, pageSize })

  return {
    ...page,
    list: page.list.map((comment, index) => mapUserComment(comment, index)),
  }
}

export async function createBookComment(bookId: string, userId: string, commentContent: string) {
  await apiRequest<void>('/api/front/user/comment', {
    method: 'POST',
    body: JSON.stringify({ userId, bookId, commentContent }),
  })
}

export async function updateBookComment(commentId: string, content: string) {
  await apiRequest<void>(`/api/front/user/comment/${commentId}`, {
    method: 'PUT',
    query: { content },
  })
}

export async function deleteBookComment(commentId: string) {
  await apiRequest<void>(`/api/front/user/comment/${commentId}`, {
    method: 'DELETE',
  })
}

export async function fetchUserFeedback(options: PageQuery = {}): Promise<PageResult<UserFeedbackItem>> {
  const pageNum = options.pageNum ?? 1
  const pageSize = options.pageSize ?? 10
  const data = await apiRequest<PageResult<ApiUserFeedback> | ApiUserFeedback[]>(
    '/api/front/user/feedback',
    {
      query: {
        pageNum,
        pageSize,
        sort: options.sort,
        order: options.order,
      },
    },
  )
  const page = normalizePageResult(data, { pageNum, pageSize })

  return {
    ...page,
    list: page.list.map((feedback, index) => mapUserFeedback(feedback, index)),
  }
}

export async function submitUserFeedback(content: string) {
  await apiRequest<void>('/api/front/user/feedback', {
    method: 'POST',
    body: content,
  })
}

export async function deleteUserFeedback(feedbackId: string) {
  await apiRequest<void>(`/api/front/user/feedback/${feedbackId}`, {
    method: 'DELETE',
  })
}
