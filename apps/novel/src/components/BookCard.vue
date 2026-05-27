<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import BookCover from '@/components/BookCover.vue'
import { formatWords, statusLabel } from '@/services/format'
import type { Book } from '@/services/types'

const props = defineProps<{
  book: Book
}>()

const meta = computed(() => `${props.book.author} · ${formatWords(props.book.words)}`)
</script>

<template>
  <RouterLink class="book-card" :to="{ name: 'book-detail', params: { id: book.id } }">
    <BookCover :title="book.title" :cover="book.cover" />

    <div class="book-card-body">
      <div class="book-card-tags">
        <span>{{ book.categoryName }}</span>
        <span>{{ statusLabel(book.status) }}</span>
      </div>
      <h3 class="book-card-title serif">{{ book.title }}</h3>
      <p class="book-card-meta">{{ meta }}</p>
      <p class="book-card-desc">{{ book.description }}</p>
    </div>
  </RouterLink>
</template>

<style scoped>
.book-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  min-width: 0;
  padding: 16px;
  border-radius: 8px;
  background: var(--color-surface);
  box-shadow: var(--shadow-paper);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.book-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 22px 54px rgba(27, 28, 28, 0.11);
}

.book-card-body {
  min-width: 0;
}

.book-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 700;
}

.book-card-title {
  margin: 12px 0 6px;
  color: var(--color-ink);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.book-card-meta,
.book-card-desc {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.65;
}

.book-card-desc {
  display: -webkit-box;
  margin-top: 10px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

@media (max-width: 520px) {
  .book-card {
    grid-template-columns: 1fr;
  }
}
</style>
