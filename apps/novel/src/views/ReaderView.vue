<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import ChapterDrawer from '@/components/ChapterDrawer.vue'
import { useLibraryState } from '@/composables/useLibraryState'
import { getReaderSettings, setReaderSettings } from '@/services/storage'
import { fetchChapterContent, fetchChapters } from '@/services/novelApi'
import type { Chapter, ChapterContent } from '@/services/types'

const route = useRoute()
const { isInBookshelf, recordReading, toggleBookshelf } = useLibraryState()

const content = shallowRef<ChapterContent>()
const chapters = shallowRef<Chapter[]>([])
const isCatalogOpen = shallowRef(false)
const isTopVisible = shallowRef(true)
const lastScrollY = shallowRef(0)
const settings = shallowRef(getReaderSettings())
const fontSizes = [16, 20, 24, 28, 32]

const chapterId = computed(() => String(route.params.chapterId))
const book = computed(() => content.value?.book)
const chapter = computed(() => content.value?.chapter)
const isSaved = computed(() => (book.value ? isInBookshelf(book.value.id) : false))
const readerClass = computed(() => ({
  'reader-night': settings.value.night,
}))
const contentStyle = computed(() => ({
  fontSize: `${settings.value.fontSize}px`,
}))

async function loadReader() {
  const chapterContent = await fetchChapterContent(chapterId.value)
  content.value = chapterContent
  chapters.value = await fetchChapters(chapterContent.book.id)
  recordReading(chapterContent.book, chapterContent.chapter.id, chapterContent.chapter.title)
}

function toggleNight() {
  settings.value = { ...settings.value, night: !settings.value.night }
  setReaderSettings(settings.value)
}

function setFontSize(fontSize: number) {
  settings.value = { ...settings.value, fontSize }
  setReaderSettings(settings.value)
}

function handleScroll() {
  const nextY = window.scrollY
  isTopVisible.value = nextY < 24 || nextY < lastScrollY.value
  lastScrollY.value = nextY
}

function preventCopy(event: ClipboardEvent) {
  event.preventDefault()
}

function handleBookshelf() {
  if (book.value) {
    toggleBookshelf(book.value.id)
  }
}

watch(chapterId, () => {
  void loadReader()
})

onMounted(() => {
  void loadReader()
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('copy', preventCopy)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('copy', preventCopy)
})
</script>

<template>
  <main class="reader-page" :class="readerClass">
    <div class="reader-progress" />

    <header class="reader-topbar" :class="{ 'reader-topbar-hidden': !isTopVisible }">
      <RouterLink v-if="book" class="reader-book-title serif" :to="{ name: 'book-detail', params: { id: book.id } }">
        {{ book.title }}
      </RouterLink>
      <span v-else class="reader-book-title serif">Takome 书屋</span>

      <div class="reader-actions">
        <button class="reader-button" type="button" @click="isCatalogOpen = true">目录</button>
        <button class="reader-button" type="button" @click="toggleNight">
          {{ settings.night ? '☀ 日间' : '☾ 夜间' }}
        </button>
        <button class="reader-button" type="button" @click="handleBookshelf">
          {{ isSaved ? '移除书架' : '加入书架' }}
        </button>
      </div>
    </header>

    <article v-if="content" class="reading-container reader-article" :style="contentStyle">
      <p class="meta-label">{{ content.book.categoryName }}</p>
      <h1 class="serif">{{ content.chapter.title }}</h1>
      <div class="reader-content" @copy.prevent>
        <p v-for="(paragraph, index) in content.content.split('\n')" :key="`${chapterId}-${index}`">
          {{ paragraph || ' ' }}
        </p>
      </div>
    </article>

    <section v-else class="reading-container reader-loading">
      <p class="serif">正在取回章节</p>
    </section>

    <div class="reader-toolbar">
      <button
        v-for="fontSize in fontSizes"
        :key="fontSize"
        class="font-button"
        :class="{ 'font-button-active': settings.fontSize === fontSize }"
        type="button"
        @click="setFontSize(fontSize)"
      >
        {{ fontSize }}
      </button>
    </div>

    <ChapterDrawer
      :open="isCatalogOpen"
      :chapters="chapters"
      :active-chapter-id="chapter?.id"
      :title="book?.title"
      @close="isCatalogOpen = false"
    />
  </main>
</template>

<style scoped>
.reader-page {
  min-height: 100vh;
  padding-bottom: 96px;
  background: #f5f0e8;
  color: #22211f;
  transition:
    background 180ms ease,
    color 180ms ease;
}

.reader-night {
  background: #161817;
  color: #e8e2d6;
}

.reader-progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 70;
  width: 100%;
  height: 4px;
  background: var(--color-secondary);
}

.reader-topbar {
  position: fixed;
  top: 4px;
  left: 0;
  right: 0;
  z-index: 65;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 62px;
  padding: 0 clamp(18px, 4vw, 44px);
  border-bottom: 1px solid rgba(110, 122, 109, 0.18);
  background: rgba(251, 249, 248, 0.86);
  backdrop-filter: blur(14px);
  transition: transform 180ms ease;
}

.reader-night .reader-topbar {
  background: rgba(22, 24, 23, 0.9);
}

.reader-topbar-hidden {
  transform: translateY(-78px);
}

.reader-book-title {
  min-width: 0;
  overflow: hidden;
  font-size: 22px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reader-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.reader-button,
.font-button {
  min-height: 36px;
  border: 1px solid rgba(110, 122, 109, 0.34);
  border-radius: 4px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.72);
  color: inherit;
  font-size: 13px;
  font-weight: 800;
}

.reader-night .reader-button,
.reader-night .font-button {
  background: rgba(255, 255, 255, 0.08);
}

.reader-article {
  padding-top: 132px;
  user-select: none;
}

.reader-article h1 {
  margin: 8px 0 42px;
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 600;
  line-height: 1.14;
}

.reader-content {
  line-height: 1.9;
  letter-spacing: 0;
}

.reader-content p {
  min-height: 1.9em;
  margin: 0 0 1.15em;
}

.reader-loading {
  min-height: 70vh;
  display: grid;
  place-items: center;
  padding-top: 120px;
}

.reader-loading p {
  font-size: 32px;
}

.reader-toolbar {
  position: fixed;
  right: clamp(14px, 4vw, 34px);
  bottom: 24px;
  z-index: 60;
  display: flex;
  gap: 6px;
  padding: 8px;
  border: 1px solid rgba(110, 122, 109, 0.18);
  border-radius: 8px;
  background: rgba(251, 249, 248, 0.86);
  box-shadow: var(--shadow-paper);
  backdrop-filter: blur(14px);
}

.reader-night .reader-toolbar {
  background: rgba(22, 24, 23, 0.88);
}

.font-button {
  width: 42px;
  padding: 0;
}

.font-button-active {
  border-color: var(--color-primary);
  color: var(--color-primary-bright);
}

@media (max-width: 680px) {
  .reader-topbar {
    align-items: flex-start;
    flex-direction: column;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .reader-article {
    padding-top: 158px;
  }
}
</style>
