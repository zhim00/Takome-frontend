<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import BookListItem from '@/components/BookListItem.vue'
import { fetchCategories, searchBooks } from '@/services/novelApi'
import type { Book, Category, PageResult } from '@/services/types'

const route = useRoute()

const categories = shallowRef<Category[]>([])
const result = shallowRef<PageResult<Book>>({
  pageNum: 1,
  pageSize: 10,
  total: 0,
  list: [],
  pages: 1,
})
const loading = shallowRef(false)
const error = shallowRef('')
const mounted = shallowRef(false)
const filters = reactive({
  keyword: '',
  categoryId: '',
  bookStatus: '',
})

const hasMore = computed(() => result.value.pageNum < result.value.pages)

function readRouteKeyword() {
  const keyword = route.query.keyword
  return typeof keyword === 'string' ? keyword.trim() : ''
}

async function loadBooks(pageNum = 1, append = false) {
  loading.value = true
  error.value = ''

  try {
    const data = await searchBooks({
      keyword: filters.keyword,
      categoryId: filters.categoryId,
      bookStatus: filters.bookStatus,
      pageNum,
      pageSize: 10,
    })

    result.value = append ? { ...data, list: [...result.value.list, ...data.list] } : data
  } catch (caught) {
    if (!append) {
      result.value = {
        pageNum: 1,
        pageSize: 10,
        total: 0,
        list: [],
        pages: 1,
      }
    }

    error.value = caught instanceof Error ? caught.message : '书库加载失败'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  void loadBooks(1)
}

function loadMore() {
  if (hasMore.value && !loading.value) {
    void loadBooks(result.value.pageNum + 1, true)
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
      <p>按分类、连载状态和顶部搜索词筛选作品，所有列表结果来自后端搜索接口。</p>
    </section>

    <section v-if="filters.keyword" class="search-summary">
      <span>当前搜索：{{ filters.keyword }}</span>
      <RouterLink :to="{ name: 'library' }">清除</RouterLink>
    </section>

    <section class="filter-panel surface-panel">
      <label class="filter-field">
        <span>分类</span>
        <select v-model="filters.categoryId">
          <option value="">全部分类</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </label>

      <label class="filter-field">
        <span>状态</span>
        <select v-model="filters.bookStatus">
          <option value="">全部状态</option>
          <option value="0">连载中</option>
          <option value="1">已完结</option>
        </select>
      </label>

      <button class="btn-primary" type="button" @click="applyFilters">筛选</button>
    </section>

    <section class="library-list surface-panel">
      <div class="library-summary">
        <span>共 {{ result.total }} 本</span>
        <span>第 {{ result.pageNum }} / {{ result.pages }} 页</span>
      </div>

      <p v-if="error" class="error-state">{{ error }}</p>

      <BookListItem v-for="(book, index) in result.list" :key="book.id" :book="book" :rank="index + 1" />

      <div v-if="!result.list.length && !loading && !error" class="empty-state">
        <p class="serif">暂无作品</p>
        <span>当前条件没有返回数据，可调整分类、状态或顶部搜索词继续查找。</span>
      </div>

      <div class="load-more-row">
        <button class="btn-secondary" type="button" :disabled="!hasMore || loading" @click="loadMore">
          {{ loading ? '加载中' : hasMore ? '加载更多' : '没有更多了' }}
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.library-page {
  padding-top: 54px;
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
  padding: 9px 12px;
  border: 1px solid rgba(67, 98, 116, 0.18);
  border-radius: 999px;
  background: rgba(196, 228, 249, 0.32);
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.search-summary a {
  color: var(--color-primary);
}

.filter-panel {
  display: grid;
  grid-template-columns: 220px 180px auto;
  gap: 14px;
  align-items: end;
  margin-top: 24px;
  padding: 18px;
}

.filter-field {
  display: grid;
  gap: 8px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
}

.filter-field select {
  min-height: 42px;
  border: 1px solid var(--color-line);
  border-radius: 4px;
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-ink);
  outline: none;
}

.filter-field select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(52, 168, 83, 0.14);
}

.library-list {
  margin-top: 24px;
  padding: 10px 24px 24px;
}

.library-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
}

.empty-state,
.error-state {
  padding: 48px 0;
  color: var(--color-muted);
  text-align: center;
}

.error-state {
  margin: 0;
  color: var(--color-primary);
  font-weight: 800;
}

.empty-state p {
  margin: 0 0 8px;
  color: var(--color-ink);
  font-size: 26px;
}

.load-more-row {
  display: flex;
  justify-content: center;
  padding-top: 24px;
}

.load-more-row button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

@media (max-width: 760px) {
  .filter-panel {
    grid-template-columns: 1fr;
  }
}
</style>
