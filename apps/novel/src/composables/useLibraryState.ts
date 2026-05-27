import { computed, readonly, shallowRef } from 'vue'

import {
  getBookshelf,
  getComments,
  getFeedback,
  getReadingRecords,
  setBookshelf,
  setComments,
  setFeedback,
  setReadingRecords,
} from '@/services/storage'
import { nowIso } from '@/services/format'
import type {
  Book,
  BookComment,
  CommentReply,
  FeedbackItem,
  ReadingRecord,
} from '@/services/types'

const bookshelf = shallowRef(getBookshelf())
const readingRecords = shallowRef(getReadingRecords())
const localComments = shallowRef(getComments())
const feedback = shallowRef(getFeedback())

function persistBookshelf() {
  setBookshelf(bookshelf.value)
}

function persistReadingRecords() {
  setReadingRecords(readingRecords.value)
}

function persistComments() {
  setComments(localComments.value)
}

function persistFeedback() {
  setFeedback(feedback.value)
}

export function useLibraryState() {
  const bookshelfIds = computed(() => new Set(bookshelf.value.map((entry) => entry.bookId)))

  function isInBookshelf(bookId: string) {
    return bookshelfIds.value.has(bookId)
  }

  function toggleBookshelf(bookId: string) {
    if (isInBookshelf(bookId)) {
      bookshelf.value = bookshelf.value.filter((entry) => entry.bookId !== bookId)
      persistBookshelf()
      return false
    }

    bookshelf.value = [{ bookId, addedAt: nowIso() }, ...bookshelf.value]
    persistBookshelf()
    return true
  }

  function recordReading(book: Book, chapterId: string, chapterTitle: string) {
    const record: ReadingRecord = {
      bookId: book.id,
      chapterId,
      bookTitle: book.title,
      chapterTitle,
      cover: book.cover,
      updatedAt: nowIso(),
    }

    readingRecords.value = [
      record,
      ...readingRecords.value.filter((item) => item.bookId !== book.id),
    ].slice(0, 20)
    persistReadingRecords()
  }

  function commentsForBook(bookId: string) {
    return computed(() => localComments.value.filter((comment) => comment.bookId === bookId))
  }

  function userCommentForBook(bookId: string, userId: string) {
    return localComments.value.find(
      (comment) => comment.bookId === bookId && comment.userId === userId,
    )
  }

  function addComment(book: Book, userId: string, userName: string, userPhoto: string, content: string) {
    if (userCommentForBook(book.id, userId)) {
      return { ok: false, message: '一本书每位用户只能评论一次' }
    }

    const comment: BookComment = {
      id: `comment-${Date.now()}`,
      bookId: book.id,
      userId,
      userName,
      userPhoto,
      content,
      createdAt: nowIso(),
      replies: [],
      source: 'mock',
    }

    localComments.value = [comment, ...localComments.value]
    persistComments()
    return { ok: true, comment }
  }

  function addReply(commentId: string, bookId: string, userName: string, content: string) {
    const reply: CommentReply = {
      id: `reply-${Date.now()}`,
      content,
      userName,
      createdAt: nowIso(),
    }

    localComments.value = localComments.value.map((comment) =>
      comment.id === commentId ? { ...comment, replies: [...comment.replies, reply] } : comment,
    )

    if (!localComments.value.some((comment) => comment.id === commentId)) {
      localComments.value = [
        {
          id: commentId,
          bookId,
          userId: 'api-user',
          userName: '接口评论',
          content: '接口评论的本地回复容器',
          createdAt: nowIso(),
          replies: [reply],
          source: 'mock',
        },
        ...localComments.value,
      ]
    }

    persistComments()
  }

  function addFeedback(content: string) {
    const item: FeedbackItem = {
      id: `feedback-${Date.now()}`,
      content,
      createdAt: nowIso(),
      reply: '已收到反馈，演示环境下回复会在本地保留。',
      source: 'mock',
    }

    feedback.value = [item, ...feedback.value]
    persistFeedback()
  }

  return {
    bookshelf: readonly(bookshelf),
    readingRecords: readonly(readingRecords),
    localComments: readonly(localComments),
    feedback: readonly(feedback),
    bookshelfIds,
    isInBookshelf,
    toggleBookshelf,
    recordReading,
    commentsForBook,
    userCommentForBook,
    addComment,
    addReply,
    addFeedback,
  }
}
