<script setup lang="ts">
import { computed } from 'vue'

import { initials } from '@/services/format'

const props = defineProps<{
  title: string
  cover?: string
  size?: 'sm' | 'md' | 'lg'
}>()

const coverClass = computed(() => ({
  'book-cover-sm': props.size === 'sm',
  'book-cover-lg': props.size === 'lg',
}))
</script>

<template>
  <div class="book-cover" :class="coverClass">
    <img v-if="cover" class="book-cover-image" :src="cover" :alt="title" />
    <div v-else class="book-cover-fallback">
      <span class="book-cover-mark serif">{{ initials(title) }}</span>
      <span class="book-cover-title">{{ title }}</span>
    </div>
  </div>
</template>

<style scoped>
.book-cover {
  position: relative;
  width: 104px;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: 8px;
  background: linear-gradient(155deg, #e8e2d6, #ffffff 46%, #c4e4f9);
  box-shadow:
    inset 5px 0 0 rgba(27, 28, 28, 0.08),
    0 18px 32px rgba(27, 28, 28, 0.12);
}

.book-cover-sm {
  width: 72px;
}

.book-cover-lg {
  width: clamp(156px, 18vw, 220px);
}

.book-cover-image,
.book-cover-fallback {
  width: 100%;
  height: 100%;
}

.book-cover-image {
  object-fit: cover;
}

.book-cover-fallback {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 14px 12px;
}

.book-cover-mark {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-primary);
}

.book-cover-title {
  display: -webkit-box;
  overflow: hidden;
  color: #2f2c24;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
</style>
