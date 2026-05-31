<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import ChapterDrawer from '@/components/ChapterDrawer.vue'
import ReaderChapterInfo from '@/components/reader/ReaderChapterInfo.vue'
import ReaderChapterNav from '@/components/reader/ReaderChapterNav.vue'
import ReaderHeader from '@/components/reader/ReaderHeader.vue'
import ReaderSideMenu from '@/components/reader/ReaderSideMenu.vue'
import { useAuth } from '@/composables/useAuth'
import { getReaderSettings, setReaderSettings } from '@/services/storage'
import {
  addBookToBookshelf,
  fetchBookshelfStatus,
  fetchChapterContent,
  fetchChapters,
  fetchNextChapterId,
  fetchPreviousChapterId,
  recordReadingHistory,
  removeBookFromBookshelf,
} from '@/services/novelApi'
import type { Chapter, ChapterContent } from '@/services/types'

const emit = defineEmits<{
  loginRequired: []
}>()

const route = useRoute()
const { isAuthenticated } = useAuth()

const content = shallowRef<ChapterContent>()
const chapters = shallowRef<Chapter[]>([])
const isCatalogOpen = shallowRef(false)
const loading = shallowRef(false)
const errorMessage = shallowRef('')
const previousChapterId = shallowRef<string>()
const nextChapterId = shallowRef<string>()
const backendBookshelfStatus = shallowRef<boolean>()
const bookshelfLoading = shallowRef(false)
const isHeaderVisible = shallowRef(true)
const lastScrollY = shallowRef(0)
const settings = shallowRef(getReaderSettings())
const fontSizes = [16, 20, 24, 28, 32]

const chapterId = computed(() => String(route.params.chapterId))
const book = computed(() => content.value?.book)
const chapter = computed(() => content.value?.chapter)
const paragraphs = computed(() => content.value?.content.split('\n').filter((item) => item.trim()) ?? [])
const isSaved = computed(() => {
  if (!book.value) {
    return false
  }

  return backendBookshelfStatus.value ?? false
})
const readerClass = computed(() => ({
  'reader-night': settings.value.night,
}))
const contentStyle = computed(() => ({
  fontSize: `${settings.value.fontSize}px`,
}))

async function loadReader() {
  const activeChapterId = chapterId.value

  loading.value = true
  errorMessage.value = ''
  content.value = undefined
  previousChapterId.value = undefined
  nextChapterId.value = undefined
  backendBookshelfStatus.value = undefined

  try {
    const chapterContent = await fetchChapterContent(activeChapterId)

    if (activeChapterId !== chapterId.value) {
      return
    }

    content.value = chapterContent
    window.scrollTo({ top: 0 })

    const [chapterData, previousId, nextId, bookshelfStatus] = await Promise.all([
      fetchChapters(chapterContent.book.id, { fallback: false }),
      fetchPreviousChapterId(activeChapterId),
      fetchNextChapterId(activeChapterId),
      isAuthenticated.value
        ? fetchBookshelfStatus(chapterContent.book.id).catch(() => undefined)
        : Promise.resolve(undefined),
      isAuthenticated.value
        ? recordReadingHistory(chapterContent.book.id, chapterContent.chapter.id).catch(() => undefined)
        : Promise.resolve(undefined),
    ])

    if (activeChapterId !== chapterId.value) {
      return
    }

    chapters.value = chapterData.chapters
    previousChapterId.value = previousId
    nextChapterId.value = nextId
    backendBookshelfStatus.value = bookshelfStatus
  } catch (error) {
    if (activeChapterId === chapterId.value) {
      errorMessage.value = error instanceof Error ? error.message : '章节内容加载失败'
    }
  } finally {
    if (activeChapterId === chapterId.value) {
      loading.value = false
    }
  }
}

function toggleNight() {
  settings.value = { ...settings.value, night: !settings.value.night }
  setReaderSettings(settings.value)
}

function setFontSize(fontSize: number) {
  settings.value = { ...settings.value, fontSize }
  setReaderSettings(settings.value)
}

function preventCopy(event: ClipboardEvent) {
  event.preventDefault()
}

function handleScroll() {
  const nextY = window.scrollY
  isHeaderVisible.value = nextY < 28 || nextY < lastScrollY.value
  lastScrollY.value = nextY
}

async function handleBookshelf() {
  if (!book.value) {
    return
  }

  if (!isAuthenticated.value) {
    emit('loginRequired')
    return
  }

  bookshelfLoading.value = true

  try {
    if (isSaved.value) {
      await removeBookFromBookshelf(book.value.id)
      backendBookshelfStatus.value = false
    } else {
      await addBookToBookshelf(book.value.id)
      backendBookshelfStatus.value = true
    }
  } finally {
    bookshelfLoading.value = false
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
    <ReaderHeader :book="book" :visible="isHeaderVisible" />

    <section class="reader-shell">
      <ReaderChapterInfo v-if="chapter" :chapter="chapter" />

      <article v-if="content" class="reader-article" :style="contentStyle">
        <div class="reader-content" @copy.prevent>
          <p v-for="(paragraph, index) in paragraphs" :key="`${chapterId}-${index}`">
            {{ paragraph }}
          </p>
        </div>

        <ReaderChapterNav
          :previous-chapter-id="previousChapterId"
          :next-chapter-id="nextChapterId"
        />
      </article>

      <section v-else class="reader-loading">
        <p class="loading-title">{{ loading ? '正在取回章节' : '章节暂时无法打开' }}</p>
        <p v-if="errorMessage" class="loading-message">{{ errorMessage }}</p>
      </section>
    </section>

    <ReaderSideMenu
      :font-size="settings.fontSize"
      :font-sizes="fontSizes"
      :night="settings.night"
      :is-saved="isSaved"
      :bookshelf-loading="bookshelfLoading"
      @bookshelf="handleBookshelf"
      @catalog="isCatalogOpen = true"
      @toggle-night="toggleNight"
      @set-font-size="setFontSize"
    />

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
  --reader-bg: #dedede;
  --reader-surface: #f7f7f7;
  --reader-control: #f8f8f8;
  --reader-control-hover: #ffffff;
  --reader-track: #eeeeee;
  --reader-dot: #c9c9c9;
  --reader-button-muted: #e7e7e7;
  --reader-line: #dedede;
  --reader-ink: #18202a;
  --reader-ink-strong: #071322;
  --reader-muted: #858d97;
  --reader-accent: #ff6425;
  min-height: 100vh;
  background: var(--reader-bg);
  color: var(--reader-ink);
  transition:
    background 180ms ease,
    color 180ms ease;
}

.reader-night {
  --reader-bg: #202322;
  --reader-surface: #171a19;
  --reader-control: #2a2d2c;
  --reader-control-hover: #333735;
  --reader-track: #242827;
  --reader-dot: #636966;
  --reader-button-muted: #2c302f;
  --reader-line: #303533;
  --reader-ink: #e6e1d8;
  --reader-ink-strong: #f5efe5;
  --reader-muted: #a9afa9;
}

.reader-shell {
  width: min(100%, 900px);
  min-height: 100vh;
  margin: 0 auto;
  padding-top: 72px;
  background: var(--reader-surface);
}

.reader-article {
  width: min(100%, 760px);
  margin: 0 auto;
  padding: 10px 24px 0;
  user-select: none;
}

.reader-content {
  color: var(--reader-ink-strong);
  line-height: 2.02;
  letter-spacing: 0;
}

.reader-content p {
  min-height: 2em;
  margin: 0 0 1.05em;
  text-indent: 2em;
}

.reader-loading {
  display: grid;
  min-height: 500px;
  align-content: center;
  justify-items: center;
  padding: 60px 28px;
  color: var(--reader-muted);
}

.loading-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}

.loading-message {
  max-width: 520px;
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 1.7;
  text-align: center;
}

@media (max-width: 980px) {
  .reader-shell {
    width: 100%;
  }

  .reader-article {
    padding-top: 4px;
  }
}
</style>
