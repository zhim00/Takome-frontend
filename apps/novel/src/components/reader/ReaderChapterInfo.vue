<script setup lang="ts">
import { computed } from 'vue'

import type { Chapter } from '@/services/types'

const props = defineProps<{
  chapter: Chapter
}>()

const chapterWordLabel = computed(() => `${props.chapter.words}字`)
const updateTimeLabel = computed(() => {
  const dateMatch = props.chapter.updatedAt.match(/^\d{4}-\d{2}-\d{2}/)

  return dateMatch?.[0] ?? props.chapter.updatedAt
})
</script>

<template>
  <section class="chapter-info">
    <h1 class="chapter-title">{{ chapter.title }}</h1>
    <div class="chapter-meta">
      <span>本章字数：{{ chapterWordLabel }}</span>
      <span>更新时间：{{ updateTimeLabel }}</span>
    </div>
  </section>
</template>

<style scoped>
.chapter-info {
  width: min(100%, 760px);
  margin: 0 auto;
  padding: 78px 24px 34px;
}

.chapter-title {
  margin: 0;
  color: var(--reader-ink-strong);
  font-size: 22px;
  font-weight: 800;
  line-height: 1.36;
}

.chapter-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  margin-top: 12px;
  color: var(--reader-muted);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 760px) {
  .chapter-info {
    padding: 56px 20px 28px;
  }

  .chapter-title {
    font-size: 20px;
  }
}
</style>
