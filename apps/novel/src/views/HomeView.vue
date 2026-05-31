<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import { RouterLink } from 'vue-router'

import BookCard from '@/components/BookCard.vue'
import BookCover from '@/components/BookCover.vue'
import { useAuth } from '@/composables/useAuth'
import {
  addBookToBookshelf,
  fetchBookshelfStatus,
  fetchHomeBooks,
  fetchNews,
  fetchUpdateRank,
  fetchVisitRank,
  removeBookFromBookshelf,
} from '@/services/novelApi'
import { formatDateLabel, formatWords, statusLabel } from '@/services/format'
import type { Book, NewsItem } from '@/services/types'

const emit = defineEmits<{
  loginRequired: []
}>()

const { isAuthenticated } = useAuth()

const updateRank = shallowRef<Book[]>([])
const visitRank = shallowRef<Book[]>([])
const homeHotBooks = shallowRef<Book[]>([])
const news = shallowRef<NewsItem[]>([])
const todayRecommendation = shallowRef<Book>()
const recommendationSaved = shallowRef(false)
const recommendationBookshelfLoading = shallowRef(false)
const loading = shallowRef(false)
const recommendationError = shallowRef('')

const hotBooks = computed(() => homeHotBooks.value.slice(0, 6))
const latestNews = computed(() => news.value.slice(0, 6))
const latestUpdates = computed(() => updateRank.value)
const rankTopTen = computed(() => updateRank.value.slice(0, 10))
const topRankBook = computed(() => rankTopTen.value[0])
const restRankBooks = computed(() => rankTopTen.value.slice(1))

function pickRandomBook(books: Book[]) {
  if (!books.length) {
    return undefined
  }

  return books[Math.floor(Math.random() * books.length)]
}

async function loadRecommendationBookshelfStatus() {
  const bookId = todayRecommendation.value?.id
  recommendationSaved.value = false

  if (!bookId || !isAuthenticated.value) {
    return
  }

  try {
    recommendationSaved.value = await fetchBookshelfStatus(bookId)
  } catch {
    recommendationSaved.value = false
  }
}

async function loadHome() {
  loading.value = true
  recommendationError.value = ''

  const [updatesResult, visitsResult, hotBooksResult, newsResult] = await Promise.allSettled([
    fetchUpdateRank(),
    fetchVisitRank(),
    fetchHomeBooks(3, 6),
    fetchNews(),
  ])

  updateRank.value = updatesResult.status === 'fulfilled' ? updatesResult.value : []
  visitRank.value = visitsResult.status === 'fulfilled' ? visitsResult.value : []
  homeHotBooks.value = hotBooksResult.status === 'fulfilled' ? hotBooksResult.value : []
  news.value = newsResult.status === 'fulfilled' ? newsResult.value : []

  todayRecommendation.value = pickRandomBook(visitRank.value)

  if (!todayRecommendation.value) {
    recommendationError.value = '暂无可用推荐，稍后再试试吧'
  }

  loading.value = false
}

async function handleAddToBookshelf() {
  if (!todayRecommendation.value) {
    return
  }

  if (!isAuthenticated.value) {
    emit('loginRequired')
    return
  }

  recommendationBookshelfLoading.value = true

  try {
    if (recommendationSaved.value) {
      await removeBookFromBookshelf(todayRecommendation.value.id)
      recommendationSaved.value = false
    } else {
      await addBookToBookshelf(todayRecommendation.value.id)
      recommendationSaved.value = true
    }
  } finally {
    recommendationBookshelfLoading.value = false
  }
}

watch([todayRecommendation, isAuthenticated], () => {
  void loadRecommendationBookshelfStatus()
})

onMounted(() => {
  void loadHome()
})
</script>

<template>
  <main class="home-page">
    <section class="hero-section layout-container">
      <article v-if="todayRecommendation" class="daily-recommendation">
        <div class="daily-copy">
          <p class="meta-label">今日推荐</p>
          <h1 class="daily-title serif">{{ todayRecommendation.title }}</h1>
          <p class="daily-desc">{{ todayRecommendation.description }}</p>

          <div class="daily-meta">
            <span>{{ todayRecommendation.author }}</span>
            <span>{{ todayRecommendation.categoryName }}</span>
            <span>{{ statusLabel(todayRecommendation.status) }}</span>
            <span>{{ formatWords(todayRecommendation.words) }}</span>
          </div>

          <div class="daily-actions">
            <RouterLink
              class="btn-primary"
              :to="{ name: 'book-detail', params: { id: todayRecommendation.id } }"
            >
              开始阅读
            </RouterLink>
            <button
              class="btn-secondary"
              type="button"
              :disabled="recommendationBookshelfLoading"
              @click="handleAddToBookshelf"
            >
              {{ recommendationSaved ? '移除书架' : '加入书架' }}
            </button>
          </div>
        </div>

        <div class="daily-cover-stage">
          <BookCover :title="todayRecommendation.title" :cover="todayRecommendation.cover" size="lg" />
        </div>
      </article>

      <article v-else class="daily-empty">
        <p class="meta-label">今日推荐</p>
        <h1 class="serif">{{ loading ? '正在查询推荐列表' : recommendationError }}</h1>
        <RouterLink class="btn-secondary" :to="{ name: 'library' }">去书库浏览</RouterLink>
      </article>
    </section>

    <section class="content-section layout-container">
      <div class="popular-news-layout">
        <div class="popular-panel">
          <div class="section-head">
            <div>
              <p class="meta-label">Popular</p>
              <h2 class="section-title">热门推荐</h2>
            </div>
            <RouterLink class="section-more" :to="{ name: 'library' }">更多作品</RouterLink>
          </div>

          <div v-if="hotBooks.length" class="hot-grid">
            <BookCard v-for="book in hotBooks" :key="book.id" :book="book" />
          </div>
          <p v-else class="section-empty">暂无热门推荐数据</p>
        </div>

        <aside class="news-panel">
          <div class="section-head compact">
            <div>
              <p class="meta-label">News</p>
              <h2 class="section-title">最新资讯</h2>
            </div>
          </div>

          <div v-if="latestNews.length" class="news-list">
            <RouterLink
              v-for="item in latestNews"
              :key="item.id"
              class="news-item"
              :to="{ name: 'news-detail', params: { id: item.id } }"
            >
              <span>{{ item.category }}</span>
              <strong>{{ item.title }}</strong>
              <small>{{ item.sourceName }} · {{ formatDateLabel(item.updatedAt) }}</small>
            </RouterLink>
          </div>
          <p v-else class="section-empty">暂无资讯</p>
        </aside>
      </div>
    </section>

    <section class="content-section layout-container home-split">
      <div class="updates-panel">
        <div class="section-head">
          <div>
            <p class="meta-label">Updated</p>
            <h2 class="section-title">最新更新</h2>
          </div>
        </div>

        <div v-if="latestUpdates.length" class="update-list">
          <RouterLink
            v-for="book in latestUpdates"
            :key="book.id"
            class="update-row"
            :to="{ name: 'book-detail', params: { id: book.id } }"
          >
            <span>{{ book.categoryName }}</span>
            <strong>{{ book.title }}</strong>
            <small>{{ book.lastChapterName }}</small>
            <time>{{ formatDateLabel(book.updatedAt) }}</time>
          </RouterLink>
        </div>
        <p v-else class="section-empty">暂无更新数据</p>
      </div>

      <aside class="update-rank-panel">
        <div class="section-head compact">
          <div>
            <p class="meta-label">Top 10</p>
            <h2 class="section-title">更新榜单</h2>
          </div>
        </div>

        <RouterLink
          v-if="topRankBook"
          class="rank-feature"
          :to="{ name: 'book-detail', params: { id: topRankBook.id } }"
        >
          <div class="rank-feature-head">
            <span class="rank-feature-index serif">01</span>
            <strong class="serif">{{ topRankBook.title }}</strong>
          </div>
          <div class="rank-feature-body">
            <BookCover class="rank-feature-cover" :title="topRankBook.title" :cover="topRankBook.cover" size="sm" />
            <p>{{ topRankBook.description }}</p>
          </div>
        </RouterLink>

        <div class="rank-title-list">
          <RouterLink
            v-for="(book, index) in restRankBooks"
            :key="book.id"
            class="rank-title-row"
            :to="{ name: 'book-detail', params: { id: book.id } }"
          >
            <span class="serif">{{ String(index + 2).padStart(2, '0') }}</span>
            <strong>{{ book.title }}</strong>
          </RouterLink>
        </div>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  padding-top: 50px;
}

.hero-section {
  min-height: 480px;
}

.daily-recommendation {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
  gap: clamp(32px, 7vw, 86px);
  align-items: center;
  padding: clamp(34px, 6vw, 68px);
  border: 1px solid rgba(110, 122, 109, 0.18);
  border-radius: 8px;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.94), rgba(232, 226, 214, 0.74)),
    var(--color-surface);
  box-shadow: var(--shadow-paper);
}

.daily-copy {
  min-width: 0;
}

.daily-title {
  max-width: 720px;
  margin: 10px 0 18px;
  color: var(--color-ink);
  font-size: clamp(42px, 5.7vw, 72px);
  font-weight: 600;
  line-height: 1.04;
}

.daily-desc {
  display: -webkit-box;
  max-width: 690px;
  margin: 0;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 17px;
  line-height: 1.85;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.daily-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.daily-meta span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(67, 98, 116, 0.1);
}

.daily-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.daily-cover-stage {
  display: grid;
  justify-items: center;
  gap: 18px;
  padding: 28px 18px;
  border-left: 1px solid rgba(110, 122, 109, 0.18);
}

.daily-cover-stage :deep(.book-cover-lg) {
  width: clamp(176px, 19vw, 236px);
}

.section-more {
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 800;
}

.daily-empty {
  display: grid;
  gap: 20px;
  min-height: 360px;
  align-content: center;
  justify-items: start;
  padding: 48px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
}

.daily-empty h1 {
  margin: 0;
  color: var(--color-ink);
  font-size: clamp(32px, 5vw, 56px);
}

.content-section {
  margin-top: 72px;
}

.popular-news-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(300px, 0.82fr);
  gap: 28px;
  align-items: stretch;
  padding: 28px;
  border: 1px solid rgba(110, 122, 109, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.36);
}

.home-split {
  display: grid;
  grid-template-columns: minmax(0, 1.82fr) minmax(280px, 0.74fr);
  gap: 0;
  align-items: start;
  padding: 28px;
  border: 1px solid rgba(110, 122, 109, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.26);
}

.popular-panel,
.news-panel,
.updates-panel,
.update-rank-panel {
  min-width: 0;
}

.updates-panel {
  padding-right: 28px;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.section-head.compact {
  margin-bottom: 16px;
}

.hot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.news-panel {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  padding: 6px 0 6px 28px;
  border-left: 1px solid var(--color-line);
}

.update-rank-panel {
  padding: 4px 0 4px 28px;
  border-left: 1px solid var(--color-line);
}

.update-rank-panel .section-title {
  font-size: 28px;
}

.news-list {
  display: grid;
  align-content: start;
}

.news-item {
  display: grid;
  gap: 5px;
  min-height: 74px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-line);
}

.news-item:last-child {
  border-bottom: 0;
}

.news-item span {
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 800;
}

.news-item strong {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-ink);
  font-size: 15px;
  line-height: 1.38;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.news-item small {
  overflow: hidden;
  color: var(--color-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.update-list {
  display: grid;
  border-top: 1px solid var(--color-line);
}

.update-row {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr) minmax(170px, 0.74fr) 76px;
  gap: 14px;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid var(--color-line);
}

.update-row span,
.update-row small,
.update-row time {
  color: var(--color-muted);
  font-size: 12px;
}

.update-row strong,
.update-row small {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.update-row strong {
  color: var(--color-ink);
  font-size: 16px;
}

.rank-feature {
  display: grid;
  gap: 14px;
  padding: 2px 0 20px;
  border-bottom: 1px solid var(--color-line);
}

.rank-feature-head {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 12px;
  align-items: baseline;
}

.rank-feature-index {
  color: rgba(67, 98, 116, 0.34);
  font-size: 34px;
  font-weight: 600;
  line-height: 1;
}

.rank-feature strong {
  min-width: 0;
  overflow: hidden;
  color: var(--color-ink);
  font-size: 21px;
  font-weight: 600;
  line-height: 1.18;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-feature-body {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.rank-feature-cover {
  opacity: 0.92;
}

.rank-feature p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.rank-title-list {
  display: grid;
  padding-top: 8px;
}

.rank-title-row {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 10px 0;
}

.rank-title-row span {
  color: rgba(67, 98, 116, 0.82);
  font-size: 18px;
  font-weight: 600;
}

.rank-title-row strong {
  min-width: 0;
  overflow: hidden;
  color: var(--color-ink);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-empty {
  margin: 0;
  padding: 28px 0;
  color: var(--color-muted);
}

@media (max-width: 1040px) {
  .daily-recommendation,
  .popular-news-layout,
  .home-split {
    grid-template-columns: 1fr;
  }

  .news-panel {
    padding: 24px 0 0;
    border-top: 1px solid var(--color-line);
    border-left: 0;
  }

  .updates-panel {
    padding-right: 0;
  }

  .update-rank-panel {
    margin-top: 26px;
    padding: 26px 0 0;
    border-top: 1px solid var(--color-line);
    border-left: 0;
  }

  .daily-cover-stage {
    border-top: 1px solid rgba(110, 122, 109, 0.18);
    border-left: 0;
  }
}

@media (max-width: 680px) {
  .hot-grid {
    grid-template-columns: 1fr;
  }

  .daily-recommendation,
  .daily-empty {
    padding: 22px;
  }

  .home-split,
  .popular-news-layout {
    padding: 20px;
  }

  .update-rank-panel {
    padding: 22px 0 0;
  }

  .news-panel {
    padding: 22px 0 0;
  }

  .update-row {
    grid-template-columns: 76px minmax(0, 1fr);
  }

  .update-row small,
  .update-row time {
    grid-column: 2;
  }
}
</style>
