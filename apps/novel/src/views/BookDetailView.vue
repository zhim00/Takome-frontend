<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import BookCover from '@/components/BookCover.vue'
import ChapterDrawer from '@/components/ChapterDrawer.vue'
import CommentPanel from '@/components/CommentPanel.vue'
import { useAuth } from '@/composables/useAuth'
import { useLibraryState } from '@/composables/useLibraryState'
import { fetchBook, fetchBookComments, fetchChapters } from '@/services/novelApi'
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
const loading = shallowRef(false)
const isCatalogOpen = shallowRef(false)

const bookId = computed(() => String(route.params.id))
const firstChapter = computed(() => chapters.value[0])
const isSaved = computed(() => (book.value ? isInBookshelf(book.value.id) : false))

async function loadDetail() {
  loading.value = true

  try {
    const [bookData, chapterData, commentData] = await Promise.all([
      fetchBook(bookId.value),
      fetchChapters(bookId.value),
      fetchBookComments(bookId.value),
    ])

    book.value = bookData
    chapters.value = chapterData
    apiComments.value = commentData
  } finally {
    loading.value = false
  }
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
          <p class="detail-author">作者：{{ book.author }}</p>
          <p class="detail-desc">{{ book.description }}</p>

          <div class="detail-stats">
            <span>{{ formatWords(book.words) }}</span>
            <span>{{ formatCount(book.visits) }} 阅读</span>
            <span>{{ book.comments + apiComments.length }} 评论</span>
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
            <button class="btn-secondary" type="button" @click="isCatalogOpen = true">
              全部目录
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="book" class="layout-container detail-content">
      <div class="chapter-preview surface-panel">
        <div class="section-head">
          <div>
            <p class="meta-label">Catalog</p>
            <h2 class="section-title">最新目录</h2>
          </div>
          <button type="button" class="section-more" @click="isCatalogOpen = true">查看全部</button>
        </div>

        <div class="chapter-grid">
          <RouterLink
            v-for="chapter in chapters.slice(0, 12)"
            :key="chapter.id"
            class="chapter-chip"
            :to="{ name: 'reader', params: { chapterId: chapter.id } }"
          >
            {{ chapter.title }}
          </RouterLink>
        </div>
      </div>

      <CommentPanel :book="book" :api-comments="apiComments" @login-required="emit('loginRequired')" />
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
  margin: 10px 0 10px;
  font-size: clamp(42px, 6vw, 68px);
  font-weight: 600;
  line-height: 1.05;
}

.detail-author,
.detail-desc {
  color: var(--color-muted);
}

.detail-author {
  margin: 0 0 18px;
  font-weight: 700;
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
  color: var(--color-muted);
  font-weight: 700;
}

.detail-actions {
  margin-top: 28px;
}

.detail-content {
  display: grid;
  gap: 36px;
  margin-top: 42px;
}

.chapter-preview {
  padding: 24px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-more {
  color: var(--color-primary);
  font-weight: 800;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.chapter-chip {
  overflow: hidden;
  padding: 12px 14px;
  border-radius: 4px;
  background: var(--color-paper-muted);
  color: var(--color-ink);
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-chip:hover {
  color: var(--color-primary);
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
  .chapter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
