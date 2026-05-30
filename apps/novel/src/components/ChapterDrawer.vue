<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { Chapter } from '@/services/types'

const props = defineProps<{
  open: boolean
  chapters: Chapter[]
  activeChapterId?: string
  title?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const orderedChapters = computed(() => [...props.chapters].sort((a, b) => a.order - b.order))
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="drawer-layer" @click.self="emit('close')">
        <aside class="chapter-drawer" aria-label="小说目录">
          <header class="chapter-drawer-head">
            <div>
              <p class="meta-label">Catalog</p>
              <h2 class="chapter-drawer-title serif">{{ title ?? '全部目录' }}</h2>
            </div>
            <button class="chapter-drawer-close" type="button" @click="emit('close')">关闭</button>
          </header>

          <div class="chapter-list">
            <RouterLink
              v-for="chapter in orderedChapters"
              :key="chapter.id"
              class="chapter-link"
              :class="{ 'chapter-link-active': chapter.id === activeChapterId }"
              :to="{ name: 'reader', params: { chapterId: chapter.id } }"
              @click="emit('close')"
            >
              <span>{{ chapter.title }}</span>
              <small>{{ chapter.words ? `${chapter.words} 字` : chapter.updatedAt }}</small>
            </RouterLink>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 180ms ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-layer {
  position: fixed;
  inset: 0;
  z-index: 75;
  display: flex;
  justify-content: flex-end;
  background: rgba(27, 28, 28, 0.26);
}

.chapter-drawer {
  width: min(100%, 520px);
  height: 100%;
  overflow: hidden;
  background: var(--color-surface);
  box-shadow: -24px 0 68px rgba(27, 28, 28, 0.18);
}

.chapter-drawer-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 28px;
  border-bottom: 1px solid var(--color-line);
}

.chapter-drawer-title {
  margin: 6px 0 0;
  font-size: 30px;
  font-weight: 600;
}

.chapter-drawer-close {
  align-self: start;
  color: var(--color-primary);
  font-weight: 700;
}

.chapter-list {
  height: calc(100% - 106px);
  overflow: auto;
  padding: 12px;
  padding-bottom: 50px;
}

.chapter-link {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 6px;
}

.chapter-link:hover,
.chapter-link-active {
  background: var(--color-paper-muted);
}

.chapter-link span {
  color: var(--color-ink);
  font-weight: 700;
  line-height: 1.4;
}

.chapter-link small {
  color: var(--color-muted);
}
</style>
