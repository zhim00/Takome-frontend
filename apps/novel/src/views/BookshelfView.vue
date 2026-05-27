<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { RouterLink } from 'vue-router'

import BookCard from '@/components/BookCard.vue'
import BookCover from '@/components/BookCover.vue'
import { useLibraryState } from '@/composables/useLibraryState'
import { fetchBook } from '@/services/novelApi'
import type { Book } from '@/services/types'

const { bookshelf, readingRecords } = useLibraryState()
const savedBooks = shallowRef<Book[]>([])

const latestReading = computed(() => readingRecords.value.slice(0, 12))

async function loadSavedBooks() {
  savedBooks.value = await Promise.all(bookshelf.value.map((entry) => fetchBook(entry.bookId)))
}

onMounted(() => {
  void loadSavedBooks()
})
</script>

<template>
  <main class="bookshelf-page layout-container">
    <section class="page-head">
      <p class="meta-label">Bookshelf</p>
      <h1 class="serif">我的书架</h1>
      <p>收藏和最近阅读都保存在当前浏览器，可用于开发环境跨端口演示。</p>
    </section>

    <section class="content-block">
      <div class="section-head">
        <h2 class="section-title">我的收藏</h2>
        <span>{{ savedBooks.length }} 本</span>
      </div>

      <div v-if="savedBooks.length" class="book-grid">
        <BookCard v-for="book in savedBooks" :key="book.id" :book="book" />
      </div>
      <div v-else class="empty-state surface-panel">
        <p class="serif">收藏还为空</p>
        <span>在详情页或阅读页点击“加入书架”后会出现在这里。</span>
        <RouterLink class="btn-primary" :to="{ name: 'library' }">去书库找书</RouterLink>
      </div>
    </section>

    <section class="content-block">
      <div class="section-head">
        <h2 class="section-title">最近阅读</h2>
        <span>{{ latestReading.length }} 本</span>
      </div>

      <div v-if="latestReading.length" class="reading-list surface-panel">
        <RouterLink
          v-for="record in latestReading"
          :key="`${record.bookId}-${record.chapterId}`"
          class="reading-row"
          :to="{ name: 'reader', params: { chapterId: record.chapterId } }"
        >
          <BookCover :title="record.bookTitle" :cover="record.cover" size="sm" />
          <div>
            <strong class="serif">{{ record.bookTitle }}</strong>
            <p>{{ record.chapterTitle }}</p>
          </div>
          <span>{{ new Date(record.updatedAt).toLocaleString() }}</span>
        </RouterLink>
      </div>
      <div v-else class="empty-state surface-panel">
        <p class="serif">暂无阅读记录</p>
        <span>打开任意章节后，这里会记录最近阅读。</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.bookshelf-page {
  padding-top: 54px;
}

.page-head h1 {
  margin: 8px 0 10px;
  font-size: 52px;
  font-weight: 600;
}

.page-head p:last-child,
.section-head span {
  color: var(--color-muted);
}

.content-block {
  margin-top: 42px;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.reading-list {
  display: grid;
  padding: 8px 22px;
}

.reading-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-line);
}

.reading-row:last-child {
  border-bottom: 0;
}

.reading-row strong {
  color: var(--color-ink);
  font-size: 21px;
  font-weight: 600;
}

.reading-row p,
.reading-row span {
  color: var(--color-muted);
}

.reading-row p {
  margin: 6px 0 0;
}

.reading-row span {
  font-size: 13px;
}

.empty-state {
  display: grid;
  gap: 14px;
  justify-items: start;
  padding: 32px;
  color: var(--color-muted);
}

.empty-state p {
  margin: 0;
  color: var(--color-ink);
  font-size: 28px;
}

@media (max-width: 920px) {
  .book-grid {
    grid-template-columns: 1fr;
  }

  .reading-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .reading-row span {
    grid-column: 2;
  }
}
</style>
