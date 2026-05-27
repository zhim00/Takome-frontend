<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import BookCover from '@/components/BookCover.vue'
import { formatCount, formatWords, statusLabel } from '@/services/format'
import type { Book } from '@/services/types'

const props = defineProps<{
  book: Book
  rank?: number
}>()

const stats = computed(() => [
  props.book.categoryName,
  statusLabel(props.book.status),
  formatWords(props.book.words),
  `${formatCount(props.book.visits)} 次阅读`,
])
</script>

<template>
  <article class="book-list-item">
    <span v-if="rank" class="book-rank serif">{{ String(rank).padStart(2, '0') }}</span>
    <BookCover :title="book.title" :cover="book.cover" size="sm" />

    <div class="book-list-content">
      <RouterLink class="book-list-title serif" :to="{ name: 'book-detail', params: { id: book.id } }">
        {{ book.title }}
      </RouterLink>
      <p class="book-list-desc">{{ book.description }}</p>
      <div class="book-list-meta">
        <span v-for="item in stats" :key="item">{{ item }}</span>
      </div>
    </div>

    <RouterLink class="book-list-action btn-secondary" :to="{ name: 'book-detail', params: { id: book.id } }">
      详情
    </RouterLink>
  </article>
</template>

<style scoped>
.book-list-item {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid var(--color-line);
}

.book-rank {
  min-width: 38px;
  color: var(--color-secondary);
  font-size: 26px;
  font-weight: 600;
}

.book-list-content {
  min-width: 0;
}

.book-list-title {
  color: var(--color-ink);
  font-size: 21px;
  font-weight: 600;
}

.book-list-desc {
  display: -webkit-box;
  margin: 8px 0;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.book-list-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--color-muted);
  font-size: 12px;
}

.book-list-action {
  white-space: nowrap;
}

@media (max-width: 720px) {
  .book-list-item {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .book-rank,
  .book-list-action {
    display: none;
  }
}
</style>
