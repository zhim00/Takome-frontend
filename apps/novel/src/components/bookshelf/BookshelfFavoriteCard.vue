<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import BookCover from '@/components/BookCover.vue'
import { formatDateLabel } from '@/services/format'
import type { BookshelfBookItem } from '@/services/types'

const props = defineProps<{
  item: BookshelfBookItem
}>()

const targetRoute = computed(() => {
  if (props.item.continueChapterId) {
    return {
      name: 'reader',
      params: { chapterId: props.item.continueChapterId },
    }
  }

  return {
    name: 'book-detail',
    params: { id: props.item.book.id },
  }
})

const updateText = computed(
  () => props.item.book.lastChapterUpdateTime ?? props.item.book.updatedAt,
)
const progressBrief = computed(
  () => props.item.progressText.split('/')[0] || props.item.progressText,
)
const progressValue = computed(() =>
  props.item.progressText === '未读过' ? '未读过' : `读到${progressBrief.value}`,
)
const chapterTotalText = computed(() =>
  props.item.entry.chapterTotal ? `${props.item.entry.chapterTotal}章` : '章节数未知',
)
const lastReadText = computed(() =>
  props.item.progressText === '未读过'
    ? '未读过'
    : formatRelativeLabel(props.item.entry.updatedAt || updateText.value, '最近'),
)
const addedText = computed(() => formatRelativeLabel(props.item.entry.addedAt, '已收藏'))
const chapterText = computed(
  () => props.item.entry.chapterName || props.item.book.lastChapterName || '暂无章节',
)

function formatRelativeLabel(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  const parsedTime = Date.parse(value)
  const normalizedTime = Date.parse(value.replace(/-/g, '/'))
  const time = Number.isNaN(parsedTime) ? normalizedTime : parsedTime

  if (Number.isNaN(time)) {
    return formatDateLabel(value)
  }

  const diff = Date.now() - time

  if (diff < 0) {
    return formatDateLabel(value)
  }

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const month = 30 * day
  const year = 365 * day

  if (diff < minute) {
    return '刚刚'
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  }

  if (diff < month) {
    return `${Math.floor(diff / day)}天前`
  }

  if (diff < year) {
    return `${Math.floor(diff / month)}个月前`
  }

  return `${Math.floor(diff / year)}年前`
}
</script>

<template>
  <RouterLink class="favorite-card" :to="targetRoute">
    <div class="favorite-cover-wrap">
      <BookCover :title="item.book.title" :cover="item.book.cover" size="lg" />
    </div>

    <h3 class="favorite-title">{{ item.book.title }}</h3>
    <p class="favorite-progress">{{ item.progressText }}</p>

    <div class="favorite-hover">
      <strong class="favorite-hover-title">{{ item.book.title }}</strong>

      <div class="favorite-hover-stats">
        <span class="favorite-stat">
          <b class="favorite-stat-value">{{ progressValue }}</b>
          <em class="favorite-stat-label">{{ chapterTotalText }}</em>
        </span>
        <span class="favorite-stat">
          <b class="favorite-stat-value">{{ lastReadText }}</b>
          <em class="favorite-stat-label">阅读过</em>
        </span>
        <span class="favorite-stat">
          <b class="favorite-stat-value">{{ addedText }}</b>
          <em class="favorite-stat-label">已加入书架</em>
        </span>
      </div>

      <div class="favorite-hover-content">
        <span class="favorite-chapter">{{ chapterText }}</span>
        <p class="favorite-desc">{{ item.book.description }}</p>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.favorite-card {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 344px;
  overflow: hidden;
  justify-items: center;
  align-content: center;
  padding: 24px 18px;
  border: 1px solid rgba(110, 122, 109, 0.1);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(249, 247, 239, 0.92)),
    var(--color-surface);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.favorite-card:hover,
.favorite-card:focus-visible {
  transform: translateY(-3px);
  box-shadow: 0 20px 46px rgba(27, 28, 28, 0.1);
}

.favorite-cover-wrap {
  position: relative;
  display: grid;
  justify-items: center;
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.favorite-cover-wrap :deep(.book-cover-lg) {
  width: 150px;
}

.favorite-hover {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  align-content: start;
  gap: 24px;
  padding: 32px 30px 28px;
  border-radius: inherit;
  background:
    repeating-linear-gradient(
      45deg,
      rgba(211, 145, 88, 0.045) 0,
      rgba(211, 145, 88, 0.045) 8px,
      transparent 8px,
      transparent 16px
    ),
    linear-gradient(135deg, rgba(255, 250, 242, 0.99), rgba(252, 250, 243, 0.97) 68%, #fff8d7);
  color: var(--color-ink);
  opacity: 0;
  pointer-events: none;
  transform: translateY(8px);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.favorite-card:hover .favorite-hover,
.favorite-card:focus-visible .favorite-hover {
  opacity: 1;
  transform: translateY(0);
}

.favorite-card:hover .favorite-cover-wrap,
.favorite-card:focus-visible .favorite-cover-wrap {
  opacity: 0.14;
  transform: scale(0.96);
}

.favorite-hover-stats,
.favorite-hover-content {
  position: relative;
  z-index: 1;
}

.favorite-hover-title {
  position: relative;
  z-index: 1;
  overflow: hidden;
  color: #060807;
  font-size: 25px;
  font-weight: 500;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-hover-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.favorite-stat {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.favorite-stat-value {
  overflow: hidden;
  color: #020303;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-stat-label {
  overflow: hidden;
  color: #3f4a54;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-hover-content {
  display: grid;
  min-height: 0;
  align-content: start;
  gap: 8px;
}

.favorite-chapter {
  overflow: hidden;
  color: #53606d;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-desc {
  display: -webkit-box;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  color: #3d4853;
  font-size: 16px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
}

.favorite-title {
  max-width: 100%;
  margin: 22px 0 8px;
  overflow: hidden;
  color: var(--color-ink);
  font-size: 22px;
  font-weight: 800;
  line-height: 1.28;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-progress {
  margin: 0;
  color: var(--color-muted);
  font-size: 15px;
}

@media (max-width: 680px) {
  .favorite-card {
    min-height: 328px;
    padding: 22px 16px;
  }

  .favorite-hover {
    gap: 12px;
    padding: 24px 22px;
  }

  .favorite-hover-stats {
    gap: 12px;
  }
}
</style>
