<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import BookCard from '@/components/BookCard.vue'
import BookCover from '@/components/BookCover.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { fetchNews, fetchUpdateRank, fetchVisitRank } from '@/services/novelApi'
import { formatCount, formatDateLabel, formatWords } from '@/services/format'
import type { Book, NewsItem } from '@/services/types'

const { data: updateRank } = useAsyncState<Book[]>(fetchUpdateRank, [])
const { data: visitRank } = useAsyncState<Book[]>(fetchVisitRank, [])
const { data: news } = useAsyncState<NewsItem[]>(fetchNews, [])

const todayRecommendation = computed(() => {
  const books = updateRank.value
  if (!books.length) {
    return undefined
  }

  const dateSeed = new Date().getDate() % books.length
  return books[dateSeed]
})
const hotBooks = computed(() => visitRank.value.slice(0, 6))
const latestUpdates = computed(() => updateRank.value.slice(0, 10))
const rankTopTen = computed(() => updateRank.value.slice(0, 10))
</script>

<template>
  <main class="home-page">
    <section class="hero-section layout-container">
      <div class="hero-copy">
        <p class="meta-label">Immersive Reading</p>
        <h1 class="hero-title serif">在安静的纸面里，继续下一章。</h1>
        <p class="hero-desc">
          Takome 书屋聚合推荐、书库、榜单、书架和阅读页，优先接入真实小说接口，并用本地演示数据兜底用户链路。
        </p>
        <div class="hero-actions">
          <RouterLink class="btn-primary" :to="{ name: 'library' }">进入书库</RouterLink>
          <RouterLink class="btn-secondary" :to="{ name: 'rankings' }">查看榜单</RouterLink>
        </div>
      </div>

      <article v-if="todayRecommendation" class="today-card">
        <div class="today-card-info">
          <p class="meta-label">今日推荐</p>
          <h2 class="serif">{{ todayRecommendation.title }}</h2>
          <p>{{ todayRecommendation.description }}</p>
          <div class="today-meta">
            <span>{{ todayRecommendation.author }}</span>
            <span>{{ todayRecommendation.categoryName }}</span>
            <span>{{ formatWords(todayRecommendation.words) }}</span>
          </div>
          <RouterLink
            class="btn-primary"
            :to="{ name: 'book-detail', params: { id: todayRecommendation.id } }"
          >
            开始阅读
          </RouterLink>
        </div>
        <BookCover :title="todayRecommendation.title" :cover="todayRecommendation.cover" size="lg" />
      </article>
    </section>

    <section class="content-section layout-container">
      <div class="section-head">
        <div>
          <p class="meta-label">Popular</p>
          <h2 class="section-title">热门推荐</h2>
        </div>
        <RouterLink class="section-more" :to="{ name: 'library' }">更多作品</RouterLink>
      </div>
      <div class="book-grid">
        <BookCard v-for="book in hotBooks" :key="book.id" :book="book" />
      </div>
    </section>

    <section class="content-section layout-container home-split">
      <div class="news-panel surface-panel">
        <div class="section-head compact">
          <div>
            <p class="meta-label">News</p>
            <h2 class="section-title">最新资讯</h2>
          </div>
        </div>
        <article v-for="item in news" :key="item.id" class="news-item">
          <span>{{ item.category }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.sourceName }} · {{ formatDateLabel(item.updatedAt) }}</p>
        </article>
      </div>

      <div class="updates-panel surface-panel">
        <div class="section-head compact">
          <div>
            <p class="meta-label">Updated</p>
            <h2 class="section-title">最新更新</h2>
          </div>
        </div>
        <RouterLink
          v-for="book in latestUpdates"
          :key="book.id"
          class="update-row"
          :to="{ name: 'book-detail', params: { id: book.id } }"
        >
          <span>{{ book.categoryName }}</span>
          <strong>{{ book.title }}</strong>
          <small>{{ book.lastChapterName }}</small>
        </RouterLink>
      </div>
    </section>

    <section class="content-section layout-container rank-section">
      <div class="section-head">
        <div>
          <p class="meta-label">Top 10</p>
          <h2 class="section-title">更新榜单</h2>
        </div>
      </div>
      <div class="rank-grid">
        <RouterLink
          v-for="(book, index) in rankTopTen"
          :key="book.id"
          class="rank-row"
          :to="{ name: 'book-detail', params: { id: book.id } }"
        >
          <span class="rank-index serif">{{ index + 1 }}</span>
          <strong>{{ book.title }}</strong>
          <small>{{ formatCount(book.visits) }} 阅读</small>
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  padding-top: 56px;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(420px, 1.18fr);
  gap: 34px;
  align-items: stretch;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 440px;
}

.hero-title {
  max-width: 620px;
  margin: 10px 0 18px;
  font-size: clamp(44px, 6vw, 76px);
  font-weight: 600;
  line-height: 1.04;
}

.hero-desc {
  max-width: 560px;
  margin: 0;
  color: var(--color-muted);
  font-size: 17px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.today-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 26px;
  align-items: end;
  padding: clamp(24px, 4vw, 42px);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(232, 226, 214, 0.95), rgba(255, 255, 255, 0.88)),
    var(--color-surface);
  box-shadow: var(--shadow-paper);
}

.today-card h2 {
  margin: 8px 0 12px;
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 600;
  line-height: 1.12;
}

.today-card p {
  color: var(--color-muted);
  line-height: 1.75;
}

.today-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 22px 0;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
}

.content-section {
  margin-top: 72px;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.section-head.compact {
  margin-bottom: 12px;
}

.section-more {
  color: var(--color-primary);
  font-weight: 700;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.home-split {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 22px;
}

.news-panel,
.updates-panel {
  padding: 24px;
}

.news-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--color-line);
}

.news-item:last-child {
  border-bottom: 0;
}

.news-item span {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
}

.news-item h3 {
  margin: 6px 0;
  color: var(--color-ink);
  font-size: 17px;
  line-height: 1.45;
}

.news-item p {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
}

.update-row {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 8px 14px;
  padding: 13px 0;
  border-bottom: 1px solid var(--color-line);
}

.update-row:last-child {
  border-bottom: 0;
}

.update-row span,
.update-row small {
  color: var(--color-muted);
  font-size: 12px;
}

.update-row strong {
  min-width: 0;
  overflow: hidden;
  color: var(--color-ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.update-row small {
  grid-column: 2;
}

.rank-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
}

.rank-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-line);
}

.rank-index {
  color: var(--color-secondary);
  font-size: 30px;
  font-weight: 600;
}

.rank-row strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-row small {
  color: var(--color-muted);
}

@media (max-width: 980px) {
  .hero-section,
  .home-split {
    grid-template-columns: 1fr;
  }

  .book-grid,
  .rank-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .today-card {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    min-height: auto;
  }
}
</style>
