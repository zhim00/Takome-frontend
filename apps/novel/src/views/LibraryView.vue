<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import BookCover from '@/components/BookCover.vue'
import { fetchCategories, searchBooks } from '@/services/novelApi'
import { formatWords, statusLabel } from '@/services/format'
import type { Book, Category, PageResult } from '@/services/types'

type FilterKey = 'workDirection' | 'categoryId' | 'bookStatus' | 'isVip' | 'wordRange' | 'updateRange'

interface FilterOption {
  label: string
  value: string
  query?: {
    wordCountMin?: number
    wordCountMax?: number
    updateTimeMin?: string
  }
}

interface FilterGroup {
  key: FilterKey
  label: string
  options: FilterOption[]
}

interface SortOption {
  label: string
  value: string
}

const PAGE_SIZE = 18
const route = useRoute()
const router = useRouter()

const categories = shallowRef<Category[]>([])
const result = shallowRef<PageResult<Book>>({
  pageNum: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  list: [],
  pages: 1,
})
const loading = shallowRef(false)
const error = shallowRef('')
const mounted = shallowRef(false)
const filters = reactive<Record<FilterKey | 'keyword', string>>({
  keyword: '',
  workDirection: '',
  categoryId: '',
  bookStatus: '',
  isVip: '',
  wordRange: '',
  updateRange: '',
})
const activeSort = shallowRef('visit_count')

const directionOptions: FilterOption[] = [
  { label: '全部', value: '' },
  { label: '男频', value: '0' },
  { label: '女频', value: '1' },
]

const statusOptions: FilterOption[] = [
  { label: '全部', value: '' },
  { label: '连载中', value: '0' },
  { label: '已完结', value: '1' },
]

const vipOptions: FilterOption[] = [
  { label: '全部', value: '' },
  { label: '免费', value: '0' },
  { label: 'VIP', value: '1' },
]

const wordOptions: FilterOption[] = [
  { label: '全部', value: '' },
  { label: '30万字以下', value: 'short', query: { wordCountMax: 300000 } },
  { label: '30-50万字', value: 'medium', query: { wordCountMin: 300000, wordCountMax: 500000 } },
  { label: '50-100万字', value: 'large', query: { wordCountMin: 500000, wordCountMax: 1000000 } },
  { label: '100万字以上', value: 'huge', query: { wordCountMin: 1000000 } },
]

const updateOptions: FilterOption[] = [
  { label: '全部', value: '' },
  { label: '三日内', value: '3d', query: { updateTimeMin: daysAgo(3) } },
  { label: '七日内', value: '7d', query: { updateTimeMin: daysAgo(7) } },
  { label: '半月内', value: '15d', query: { updateTimeMin: daysAgo(15) } },
  { label: '一月内', value: '30d', query: { updateTimeMin: daysAgo(30) } },
]

const sortOptions: SortOption[] = [
  { label: '最热', value: 'visit_count' },
  { label: '最新', value: 'last_chapter_update_time' },
  { label: '字数', value: 'word_count' },
]

const categoryOptions = computed<FilterOption[]>(() => [
  { label: '全部', value: '' },
  ...categories.value
    .filter((category) => filters.workDirection === '' || String(category.workDirection) === filters.workDirection)
    .map((category) => ({
      label: category.name,
      value: category.id,
    })),
])

const filterGroups = computed<FilterGroup[]>(() => [
  { key: 'workDirection', label: '作品方向', options: directionOptions },
  { key: 'categoryId', label: '作品分类', options: categoryOptions.value },
  { key: 'bookStatus', label: '写作状态', options: statusOptions },
  { key: 'isVip', label: '作品属性', options: vipOptions },
  { key: 'wordRange', label: '作品字数', options: wordOptions },
  { key: 'updateRange', label: '更新时间', options: updateOptions },
])

const visiblePages = computed(() => {
  const total = Math.max(result.value.pages, 1)
  const current = result.value.pageNum
  const start = Math.max(1, Math.min(current - 2, total - 4))
  const end = Math.min(total, start + 4)

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const pageSummary = computed(() => {
  const total = result.value.total
  const start = total ? (result.value.pageNum - 1) * result.value.pageSize + 1 : 0
  const end = Math.min(result.value.pageNum * result.value.pageSize, total)

  return { start, end, total }
})

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 19)
}

function readRouteKeyword() {
  const keyword = route.query.keyword
  return typeof keyword === 'string' ? keyword.trim() : ''
}

function queryFromOption(options: FilterOption[], value: string) {
  return options.find((option) => option.value === value)?.query ?? {}
}

function selectFilter(key: FilterKey, value: string) {
  filters[key] = value

  if (key === 'workDirection') {
    const matched = categoryOptions.value.some((category) => category.value === filters.categoryId)

    if (!matched) {
      filters.categoryId = ''
    }
  }

  void loadBooks(1)
}

function clearKeyword() {
  void router.push({ name: 'library' })
}

function selectSort(value: string) {
  activeSort.value = value
  void loadBooks(1)
}

async function loadBooks(pageNum = 1) {
  loading.value = true
  error.value = ''

  const wordQuery = queryFromOption(wordOptions, filters.wordRange)
  const updateQuery = queryFromOption(updateOptions, filters.updateRange)

  try {
    const data = await searchBooks({
      keyword: filters.keyword,
      workDirection: filters.workDirection,
      categoryId: filters.categoryId,
      isVip: filters.isVip,
      bookStatus: filters.bookStatus,
      ...wordQuery,
      ...updateQuery,
      pageNum,
      pageSize: PAGE_SIZE,
      sort: activeSort.value,
      hydrateDetails: true,
    })

    result.value = data
  } catch (caught) {
    result.value = {
      pageNum: 1,
      pageSize: PAGE_SIZE,
      total: 0,
      list: [],
      pages: 1,
    }
    error.value = caught instanceof Error ? caught.message : '书库加载失败'
  } finally {
    loading.value = false
  }
}

function goPage(page: number) {
  const targetPage = Math.min(Math.max(page, 1), Math.max(result.value.pages, 1))

  if (targetPage !== result.value.pageNum && !loading.value) {
    void loadBooks(targetPage)
  }
}

watch(
  () => route.query.keyword,
  () => {
    filters.keyword = readRouteKeyword()

    if (mounted.value) {
      void loadBooks(1)
    }
  },
)

onMounted(async () => {
  filters.keyword = readRouteKeyword()

  try {
    categories.value = await fetchCategories()
  } catch {
    categories.value = []
  }

  mounted.value = true
  await loadBooks(1)
})
</script>

<template>
  <main class="library-page layout-container">
    <section class="page-head">
      <p class="meta-label">Library</p>
      <h1 class="serif">书库</h1>
    </section>

    <section v-if="filters.keyword" class="search-summary">
      <span>当前搜索：{{ filters.keyword }}</span>
      <button type="button" @click="clearKeyword">清除</button>
    </section>

    <section class="filter-panel surface-panel">
      <div v-for="group in filterGroups" :key="group.key" class="filter-row">
        <span class="filter-label">{{ group.label }}</span>
        <div class="filter-options">
          <button
            v-for="option in group.options"
            :key="option.value || 'all'"
            class="filter-chip"
            :class="{ 'filter-chip-active': filters[group.key] === option.value }"
            type="button"
            @click="selectFilter(group.key, option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="library-list surface-panel">
      <div class="library-toolbar">
        <div>
          <p class="meta-label">Books</p>
          <h2 class="serif">全部作品</h2>
          <div class="sort-tabs" aria-label="书库排序">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              class="sort-tab"
              :class="{ 'sort-tab-active': activeSort === option.value }"
              type="button"
              @click="selectSort(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <span>
          共 {{ pageSummary.total }} 本
          <template v-if="pageSummary.total"> · {{ pageSummary.start }}-{{ pageSummary.end }}</template>
        </span>
      </div>

      <p v-if="error" class="error-state">{{ error }}</p>

      <div v-else-if="result.list.length" class="book-grid" :class="{ 'book-grid-loading': loading }">
        <RouterLink
          v-for="book in result.list"
          :key="book.id"
          class="library-book"
          :to="{ name: 'book-detail', params: { id: book.id } }"
        >
          <span class="library-book-cover">
            <BookCover :title="book.title" :cover="book.cover" size="sm" />
          </span>
          <div class="library-book-body">
            <h3 class="serif">{{ book.title }}</h3>
            <p class="library-book-author">作者：{{ book.author }}</p>
            <p class="library-book-meta">{{ statusLabel(book.status) }} · {{ formatWords(book.words) }}</p>
            <p class="library-book-desc">{{ book.description }}</p>
          </div>
        </RouterLink>
      </div>

      <div v-else-if="!loading" class="empty-state">
        <p class="serif">暂无更多作品</p>
      </div>

      <div v-if="loading && !result.list.length" class="loading-state">
        <p class="serif">正在载入作品</p>
      </div>

      <nav v-if="result.pages > 1" class="pagination" aria-label="书库分页">
        <button type="button" :disabled="result.pageNum <= 1 || loading" @click="goPage(result.pageNum - 1)">
          上一页
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          :class="{ 'page-active': result.pageNum === page }"
          :disabled="loading"
          @click="goPage(page)"
        >
          {{ page }}
        </button>
        <button type="button" :disabled="result.pageNum >= result.pages || loading" @click="goPage(result.pageNum + 1)">
          下一页
        </button>
      </nav>
    </section>
  </main>
</template>

<style scoped>
.library-page {
  padding-top: 54px;
  padding-bottom: 72px;
}

.page-head {
  max-width: 720px;
}

.page-head h1 {
  margin: 8px 0 10px;
  font-size: 52px;
  font-weight: 600;
}

.page-head p:last-child {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.8;
}

.search-summary {
  display: inline-flex;
  gap: 12px;
  align-items: center;
  margin-top: 28px;
  padding: 9px 13px;
  border: 1px solid rgba(67, 98, 116, 0.18);
  border-radius: 999px;
  background: rgba(196, 228, 249, 0.32);
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.search-summary button {
  color: var(--color-primary);
  font-weight: 900;
}

.filter-panel {
  display: grid;
  gap: 2px;
  margin-top: 24px;
  padding: 18px 22px 24px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
  box-shadow: 0 12px 30px rgba(27, 28, 28, 0.04);
}

.filter-row {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 18px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(215, 221, 212, 0.7);
}

.filter-row:last-child {
  border-bottom: 0;
}

.filter-label {
  padding-top: 7px;
  color: var(--color-secondary);
  font-size: 13px;
  font-weight: 800;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  min-height: 32px;
  border-radius: 999px;
  padding: 0 12px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
  transition:
    background 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.filter-chip:hover,
.filter-chip-active {
  background: var(--color-ink);
  color: var(--color-surface);
  box-shadow: 0 12px 24px rgba(27, 28, 28, 0.12);
}

.library-list {
  margin-top: 0;
  padding: 0 26px 26px;
  border-top-right-radius: 0;
  border-top-left-radius: 0;
}

.library-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: end;
  padding: 24px 0 0;
  border-bottom: 1px solid var(--color-line);
}

.library-toolbar h2 {
  margin: 6px 0 0;
  color: var(--color-ink);
  font-size: 30px;
  font-weight: 600;
}

.library-toolbar span {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.sort-tabs {
  display: flex;
  gap: 32px;
  margin-top: 22px;
}

.sort-tab {
  position: relative;
  padding: 0 0 17px;
  color: var(--color-muted);
  font-size: 15px;
  font-weight: 800;
  transition: color 160ms ease;
}

.sort-tab::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--color-primary-bright);
  content: '';
  opacity: 0;
  transform: scaleX(0.4);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.sort-tab:hover,
.sort-tab-active {
  color: var(--color-primary);
}

.sort-tab-active::after {
  opacity: 1;
  transform: scaleX(1);
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 40px;
  row-gap: 38px;
  padding-top: 28px;
  transition: opacity 160ms ease;
}

.book-grid-loading {
  opacity: 0.58;
}

.library-book {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 20px;
  min-width: 0;
  min-height: 128px;
  align-items: stretch;
}

.library-book-cover {
  display: block;
  width: 96px;
  height: 128px;
}

.library-book-cover :deep(.book-cover-sm) {
  width: 96px;
  height: 128px;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease;
}

.library-book-cover:hover :deep(.book-cover-sm) {
  transform: translateY(-5px) scale(1.035);
  box-shadow:
    inset 5px 0 0 rgba(27, 28, 28, 0.08),
    0 24px 42px rgba(27, 28, 28, 0.18);
}

.library-book-body {
  display: flex;
  min-height: 128px;
  min-width: 0;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 1px;
}

.library-book h3 {
  display: -webkit-box;
  margin: 0 0 9px;
  overflow: hidden;
  color: var(--color-ink);
  font-size: 21px;
  font-weight: 600;
  line-height: 1.25;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.library-book-author,
.library-book-meta,
.library-book-desc {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}

.library-book-meta {
  margin-top: 5px;
}

.library-book-desc {
  display: -webkit-box;
  margin-top: 8px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.empty-state,
.error-state,
.loading-state {
  padding: 58px 0 34px;
  color: var(--color-muted);
  text-align: center;
}

.error-state {
  margin: 0;
  color: var(--color-primary);
  font-weight: 800;
}

.empty-state p,
.loading-state p {
  margin: 0 0 8px;
  color: var(--color-ink);
  font-size: 26px;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 64px;
}

.pagination button {
  min-width: 38px;
  min-height: 36px;
  border: 1px solid var(--color-line);
  border-radius: 5px;
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-ink);
  font-size: 14px;
  font-weight: 700;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease;
}

.pagination button:hover:not(:disabled),
.pagination .page-active {
  border-color: var(--color-primary);
  background: var(--color-primary-bright);
  color: white;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

@media (max-width: 980px) {
  .book-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .filter-row,
  .library-book {
    grid-template-columns: 1fr;
  }

  .filter-label {
    padding-top: 0;
  }

  .library-toolbar {
    align-items: start;
    flex-direction: column;
  }

  .book-grid {
    grid-template-columns: 1fr;
  }
}
</style>
