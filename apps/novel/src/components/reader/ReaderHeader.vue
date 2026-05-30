<script setup lang="ts">
import { RouterLink } from 'vue-router'

import type { Book } from '@/services/types'

defineProps<{
  book?: Book
  visible: boolean
}>()
</script>

<template>
  <header class="reader-header" :class="{ 'reader-header-hidden': !visible }">
    <div class="reader-header-inner">
      <RouterLink
        class="reader-back"
        :to="book ? { name: 'book-detail', params: { id: book.id } } : { name: 'home' }"
        aria-label="退出阅读"
      >
        <svg class="reader-back-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5 8 12l7 7" />
        </svg>
        <span class="reader-book-name">{{ book?.title ?? 'Takome 书屋' }}</span>
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.reader-header {
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 40;
  width: min(100%, 900px);
  background: color-mix(in srgb, var(--reader-surface) 92%, transparent);
  backdrop-filter: blur(10px);
  transform: translateX(-50%);
  transition: transform 180ms ease;
}

.reader-header-hidden {
  transform: translate(-50%, -100%);
}

.reader-header-inner {
  width: min(100%, 760px);
  margin: 0 auto;
  padding: 28px 14px 34px;
  border-bottom: 1px solid var(--reader-line);
}

.reader-back {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  color: var(--reader-ink);
}

.reader-back-icon {
  width: 25px;
  height: 25px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.3;
}

.reader-book-name {
  overflow: hidden;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .reader-header-inner {
    padding: 18px 20px 24px;
  }

  .reader-book-name {
    font-size: 18px;
  }
}
</style>
