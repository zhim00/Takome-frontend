<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import BookCover from '@/components/BookCover.vue'
import { formatDateLabel, formatWords, statusLabel } from '@/services/format'
import type { Book } from '@/services/types'

const props = defineProps<{
  book: Book
  rank?: number
}>()

const stats = computed(() => [
  props.book.categoryName,
  statusLabel(props.book.status),
  formatWords(props.book.words),
])

const latestUpdateTime = computed(() => props.book.lastChapterUpdateTime || props.book.updatedAt)
</script>

<template>
  <RouterLink class="book-list-item" :to="{ name: 'book-detail', params: { id: book.id } }">
    <span v-if="rank" class="book-rank-box">
      <span class="book-rank serif">{{ String(rank).padStart(2, '0') }}</span>
      <span class="book-rank-dash">-</span>
    </span>

    <span class="book-cover-frame">
      <BookCover :title="book.title" :cover="book.cover" size="sm" />
    </span>

    <div class="book-list-content">
      <span class="book-list-title serif">{{ book.title }}</span>
      <span class="book-list-author">{{ book.author }}</span>
      <p class="book-list-desc">{{ book.description }}</p>
      <div class="book-list-footer">
        <div class="book-list-meta">
          <span v-for="item in stats" :key="item">{{ item }}</span>
          <span class="book-list-chapter">最新更新：{{ book.lastChapterName }}</span>
        </div>
        <time class="book-list-time">{{ formatDateLabel(latestUpdateTime) }}</time>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.book-list-item {
  display: grid;
  grid-template-columns: 44px 140px minmax(0, 1fr);
  gap: 26px;
  align-items: start;
  border-radius: 7px;
  padding: 20px 30px;
  transition:
    background 180ms ease,
    box-shadow 180ms ease;
}

.book-list-item:hover {
  background: rgba(240, 237, 237, 0.82);
  box-shadow: inset 0 0 0 1px rgba(27, 28, 28, 0.025);
}

.book-rank-box {
  display: grid;
  justify-items: center;
  padding-top: 64px;
}

.book-rank {
  color: #d8a75b;
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
}

.book-rank-dash {
  margin-top: 12px;
  color: rgba(95, 104, 95, 0.44);
  font-size: 14px;
  line-height: 1;
}

.book-cover-frame {
  display: block;
  width: 140px;
}

.book-cover-frame :deep(.book-cover-sm) {
  width: 140px;
  border-radius: 7px;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease;
}

.book-cover-frame:hover :deep(.book-cover-sm) {
  transform: translateY(-5px) scale(1.025);
  box-shadow:
    inset 5px 0 0 rgba(27, 28, 28, 0.08),
    0 24px 42px rgba(27, 28, 28, 0.18);
}

.book-list-content {
  display: grid;
  gap: 9px;
  min-width: 0;
  padding-top: 18px;
}

.book-list-title {
  color: var(--color-ink);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.25;
}

.book-list-author {
  color: var(--color-muted);
  font-size: 15px;
  line-height: 1.4;
}

.book-list-desc {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 16px;
  line-height: 1.72;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.book-list-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  gap: 20px;
  align-items: end;
}

.book-list-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  min-width: 0;
  color: var(--color-muted);
  font-size: 15px;
  line-height: 1.5;
}

.book-list-meta span {
  min-width: 0;
}

.book-list-meta span:not(:last-child)::after {
  margin: 0 13px;
  color: rgba(95, 104, 95, 0.55);
  content: '|';
}

.book-list-chapter {
  display: inline-block;
  max-width: 430px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-list-time {
  color: var(--color-muted);
  font-size: 15px;
  line-height: 1.5;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .book-list-item {
    grid-template-columns: 38px 112px minmax(0, 1fr);
    gap: 18px;
    padding: 18px;
  }

  .book-rank-box {
    padding-top: 48px;
  }

  .book-cover-frame,
  .book-cover-frame :deep(.book-cover-sm) {
    width: 112px;
  }

  .book-list-content {
    padding-top: 5px;
  }

  .book-list-footer {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .book-list-chapter {
    max-width: 100%;
  }
}

@media (max-width: 720px) {
  .book-list-item {
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 14px;
    padding: 14px;
  }

  .book-rank-box {
    display: none;
  }

  .book-cover-frame,
  .book-cover-frame :deep(.book-cover-sm) {
    width: 84px;
  }

  .book-list-title {
    font-size: 19px;
  }

  .book-list-desc {
    font-size: 14px;
    -webkit-line-clamp: 2;
  }

  .book-list-meta,
  .book-list-time {
    font-size: 13px;
  }
}
</style>
