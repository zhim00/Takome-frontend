<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import BookCover from '@/components/BookCover.vue'
import ChapterDrawer from '@/components/ChapterDrawer.vue'
import CommentPanel from '@/components/CommentPanel.vue'
import { useAuth } from '@/composables/useAuth'
import { useLibraryState } from '@/composables/useLibraryState'
import {
  fetchBook,
  fetchBookComments,
  fetchBookRecommendations,
  fetchChapters,
  increaseBookVisit,
} from '@/services/novelApi'
import { formatCount, formatWords, statusLabel } from '@/services/format'
import type { Book, BookComment, Chapter } from '@/services/types'

const emit = defineEmits<{
  loginRequired: []
}>()

const route = useRoute()
const { isAuthenticated } = useAuth()
const { isInBookshelf, toggleBookshelf } = useLibraryState()

const book = shallowRef<Book>()
const chapters = shallowRef<Chapter[]>([])
const apiComments = shallowRef<BookComment[]>([])
const relatedBooks = shallowRef<Book[]>([])
const commentTotal = shallowRef(0)
const chapterTotal = shallowRef(0)
const loading = shallowRef(false)
const isCatalogOpen = shallowRef(false)

const bookId = computed(() => String(route.params.id))
const firstChapter = computed(() => chapters.value[0])
const isSaved = computed(() => (book.value ? isInBookshelf(book.value.id) : false))
const previewChapters = computed(() => chapters.value.slice(0, 30))
const authorAvatar = computed(() => {
  const seed = encodeURIComponent(book.value?.author || 'Takome')
  return `https://api.dicebear.com/9.x/personas/svg?seed=${seed}&backgroundColor=e8e2d6,c4e4f9`
})

async function loadDetail() {
  loading.value = true
  const currentBookId = bookId.value

  try {
    await increaseBookVisit(currentBookId).catch(() => undefined)

    const [bookData, chapterData, commentData, recommendationData] = await Promise.all([
      fetchBook(currentBookId),
      fetchChapters(currentBookId),
      fetchBookComments(currentBookId),
      fetchBookRecommendations(currentBookId),
    ])

    book.value = bookData
    chapters.value = chapterData.chapters
    chapterTotal.value = chapterData.total
    apiComments.value = commentData.comments
    commentTotal.value = commentData.total
    relatedBooks.value = recommendationData
  } finally {
    loading.value = false
  }
}

async function reloadComments() {
  const commentData = await fetchBookComments(bookId.value)
  apiComments.value = commentData.comments
  commentTotal.value = commentData.total
}

function handleBookshelf() {
  if (!book.value) {
    return
  }

  if (!isAuthenticated.value) {
    emit('loginRequired')
    return
  }

  toggleBookshelf(book.value.id)
}

watch(bookId, () => {
  void loadDetail()
})

onMounted(() => {
  void loadDetail()
})
</script>

<template>
  <main class="detail-page">
    <section v-if="book" class="detail-hero">
      <div class="layout-container detail-hero-inner">
        <BookCover :title="book.title" :cover="book.cover" size="lg" />

        <div class="detail-copy">
          <p class="meta-label">{{ book.categoryName }} · {{ statusLabel(book.status) }}</p>
          <h1 class="serif">{{ book.title }}</h1>
          <p class="detail-desc">{{ book.description }}</p>

          <div class="detail-stats">
            <span>{{ formatWords(book.words) }}</span>
            <span>评论 {{ commentTotal }}</span>
            <span>总点击 {{ formatCount(book.visits) }}</span>
          </div>

          <div class="detail-actions">
            <RouterLink
              v-if="firstChapter"
              class="btn-primary"
              :to="{ name: 'reader', params: { chapterId: firstChapter.id } }"
            >
              开始阅读
            </RouterLink>
            <button class="btn-secondary" type="button" @click="handleBookshelf">
              {{ isSaved ? '移除书架' : '加入书架' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="book" class="layout-container detail-content">
      <div class="detail-main">
        <div class="chapter-preview surface-panel">
          <div class="section-head">
            <div>
              <p class="meta-label">Catalog</p>
              <h2 class="section-title">目录 · {{ chapterTotal }}章</h2>
            </div>
            <button type="button" class="section-more" @click="isCatalogOpen = true">全部目录</button>
          </div>

          <div class="chapter-grid">
            <RouterLink
              v-for="chapter in previewChapters"
              :key="chapter.id"
              class="chapter-chip"
              :to="{ name: 'reader', params: { chapterId: chapter.id } }"
            >
              {{ chapter.title }}
            </RouterLink>
          </div>
        </div>

        <CommentPanel
          :book="book"
          :api-comments="apiComments"
          :comment-total="commentTotal"
          @login-required="emit('loginRequired')"
          @changed="reloadComments"
        />
      </div>

      <aside class="detail-sidebar">
        <section class="author-card surface-panel">
          <div class="author-avatar">
            <img :src="authorAvatar" :alt="book.author" />
            <span class="author-badge">签约作者</span>
          </div>
          <strong class="serif">{{ book.author }}</strong>
          <div class="author-line"></div>
          <p class="author-label">作者有话说</p>
          <p class="author-note">亲爱的读者，感谢你翻开这部作品。每一次点击、收藏和评论，都会成为故事继续向前的动力。</p>
        </section>

        <section class="related-card surface-panel">
          <div class="section-head compact">
            <div>
              <p class="meta-label">Similar</p>
              <h2 class="section-title">同类推荐</h2>
            </div>
          </div>

          <div v-if="relatedBooks.length" class="related-list">
            <RouterLink
              v-for="item in relatedBooks"
              :key="item.id"
              class="related-item"
              :to="{ name: 'book-detail', params: { id: item.id } }"
            >
              <BookCover :title="item.title" :cover="item.cover" size="sm" />
              <span>
                <strong>{{ item.title }}</strong>
                <small>{{ item.description }}</small>
              </span>
            </RouterLink>
          </div>
          <p v-else class="sidebar-empty">暂无同类推荐</p>
        </section>
      </aside>
    </section>

    <section v-else class="layout-container loading-state">
      <p class="serif">{{ loading ? '正在打开书页' : '未找到作品' }}</p>
    </section>

    <ChapterDrawer
      v-if="book"
      :open="isCatalogOpen"
      :chapters="chapters"
      :title="book.title"
      @close="isCatalogOpen = false"
    />
  </main>
</template>

<style scoped>
.detail-page {
  padding-bottom: 24px;
}

.detail-hero {
  padding: 62px 0;
  background:
    linear-gradient(135deg, rgba(232, 226, 214, 0.76), rgba(255, 255, 255, 0.24)),
    var(--color-paper);
}

.detail-hero-inner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: clamp(28px, 5vw, 56px);
  align-items: center;
}

.detail-copy h1 {
  max-width: 760px;
  margin: 10px 0 18px;
  font-size: clamp(42px, 6vw, 68px);
  font-weight: 600;
  line-height: 1.05;
}

.detail-desc {
  color: var(--color-muted);
}

.detail-desc {
  max-width: 760px;
  margin: 0;
  font-size: 16px;
  line-height: 1.85;
}

.detail-stats,
.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.detail-stats {
  margin-top: 22px;
}

.detail-stats span {
  padding: 8px 12px;
  border: 1px solid rgba(110, 122, 109, 0.18);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.64);
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.detail-actions {
  margin-top: 28px;
}

.detail-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 312px;
  gap: 26px;
  align-items: start;
  margin-top: 42px;
}

.detail-main,
.detail-sidebar {
  display: grid;
  gap: 26px;
  min-width: 0;
}

.chapter-preview {
  padding: 24px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-head.compact {
  margin-bottom: 16px;
}

.section-more {
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 800;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.chapter-chip {
  overflow: hidden;
  min-height: 43px;
  padding: 12px;
  border-radius: 4px;
  background: var(--color-paper-muted);
  color: var(--color-ink);
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-chip:hover {
  background: rgba(52, 168, 83, 0.1);
  color: var(--color-primary);
}

.author-card,
.related-card {
  padding: 24px;
}

.author-card {
  display: grid;
  justify-items: center;
  text-align: center;
}

.author-avatar {
  position: relative;
  display: grid;
  width: 96px;
  height: 96px;
  place-items: center;
  margin-bottom: 18px;
}

.author-avatar::before {
  position: absolute;
  inset: -7px;
  border: 1px solid rgba(110, 122, 109, 0.22);
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(232, 226, 214, 0.5), rgba(196, 228, 249, 0.28));
  content: '';
}

.author-avatar img {
  position: relative;
  width: 88px;
  height: 88px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-paper-muted);
}

.author-badge {
  position: absolute;
  right: -10px;
  bottom: 2px;
  z-index: 1;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--color-primary-bright);
  color: white;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.author-card strong {
  color: var(--color-ink);
  font-size: 19px;
  font-weight: 700;
}

.author-line {
  width: 100%;
  height: 1px;
  margin: 16px 0;
  border-top: 1px dotted rgba(110, 122, 109, 0.42);
}

.author-label {
  justify-self: start;
  margin: 0 0 10px;
  color: var(--color-ink);
  font-size: 14px;
  font-weight: 800;
}

.author-note {
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.8;
  text-align: left;
}

.related-list {
  display: grid;
}

.related-item {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  gap: 14px;
  padding: 16px 0;
  border-top: 1px solid var(--color-line);
}

.related-item:first-child {
  border-top: 0;
  padding-top: 0;
}

.related-item :deep(.book-cover-sm) {
  width: 78px;
}

.related-item span {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: 8px;
}

.related-item strong {
  overflow: hidden;
  color: var(--color-ink);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-item small {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.sidebar-empty {
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
}

.loading-state {
  min-height: 420px;
  display: grid;
  place-items: center;
  color: var(--color-muted);
}

.loading-state p {
  font-size: 32px;
}

@media (max-width: 760px) {
  .detail-hero-inner,
  .detail-content,
  .chapter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
