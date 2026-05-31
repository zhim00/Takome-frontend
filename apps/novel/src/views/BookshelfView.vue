<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { RouterLink } from 'vue-router'

import BookshelfFavoriteCard from '@/components/bookshelf/BookshelfFavoriteCard.vue'
import ReadingHistoryList from '@/components/bookshelf/ReadingHistoryList.vue'
import {
  deleteReadingHistories,
  deleteReadingHistory,
  fetchUserBookshelfBooks,
  fetchUserReadingHistory,
} from '@/services/novelApi'
import type { BookshelfBookItem, UserReadingHistoryItem } from '@/services/types'

const favoriteItems = shallowRef<BookshelfBookItem[]>([])
const historyItems = shallowRef<UserReadingHistoryItem[]>([])
const favoriteLoading = shallowRef(false)
const historyLoading = shallowRef(false)
const favoriteError = shallowRef('')
const historyError = shallowRef('')
const deletingIds = shallowRef<string[]>([])

const favoriteCountText = computed(() => `${favoriteItems.value.length} 本`)
const historyCountText = computed(() => `${historyItems.value.length} 条`)

async function loadFavorites() {
  favoriteLoading.value = true
  favoriteError.value = ''

  try {
    favoriteItems.value = await fetchUserBookshelfBooks()
  } catch (error) {
    favoriteItems.value = []
    favoriteError.value = error instanceof Error ? error.message : '我的收藏加载失败'
  } finally {
    favoriteLoading.value = false
  }
}

async function loadHistory() {
  historyLoading.value = true
  historyError.value = ''

  try {
    historyItems.value = await fetchUserReadingHistory({ withinDays: 30, fetchAll: true })
  } catch (error) {
    historyItems.value = []
    historyError.value = error instanceof Error ? error.message : '最近阅读加载失败'
  } finally {
    historyLoading.value = false
  }
}

async function deleteOneHistory(historyId: string) {
  deletingIds.value = [...deletingIds.value, historyId]

  try {
    await deleteReadingHistory(historyId)
    historyItems.value = historyItems.value.filter((item) => item.id !== historyId)
  } finally {
    deletingIds.value = deletingIds.value.filter((id) => id !== historyId)
  }
}

async function deleteBatchHistory(historyIds: string[]) {
  if (!historyIds.length) {
    return
  }

  deletingIds.value = [...new Set([...deletingIds.value, ...historyIds])]

  try {
    await deleteReadingHistories(historyIds)
    const deletedSet = new Set(historyIds)
    historyItems.value = historyItems.value.filter((item) => !deletedSet.has(item.id))
  } finally {
    deletingIds.value = deletingIds.value.filter((id) => !historyIds.includes(id))
  }
}

onMounted(() => {
  void loadFavorites()
  void loadHistory()
})
</script>

<template>
  <main class="bookshelf-page layout-container">
    <section class="page-head">
      <p class="meta-label">Bookshelf</p>
      <h1 class="serif">我的书架</h1>
    </section>

    <section class="content-block">
      <div class="section-head">
        <div>
          <p class="meta-label">Favorites</p>
          <h2 class="section-title">我的收藏</h2>
        </div>
        <span>{{ favoriteLoading ? '加载中' : favoriteCountText }}</span>
      </div>

      <div v-if="favoriteItems.length" class="favorite-grid">
        <BookshelfFavoriteCard v-for="item in favoriteItems" :key="item.entry.id" :item="item" />
      </div>

      <div v-else class="empty-state">
        <p class="empty-title">{{ favoriteLoading ? '正在加载我的收藏' : '空空如也' }}</p>
        <span>{{ favoriteError || '' }}</span>
        <RouterLink class="btn-primary" :to="{ name: 'library' }">去书库找书</RouterLink>
      </div>
    </section>

    <section class="content-block">
      <div class="section-head">
        <div>
          <p class="meta-label">Recent</p>
          <h2 class="section-title">最近阅读</h2>
        </div>
        <span>{{ historyLoading ? '加载中' : historyCountText }}</span>
      </div>

      <ReadingHistoryList
        v-if="historyItems.length"
        :items="historyItems"
        :deleting-ids="deletingIds"
        @delete-one="deleteOneHistory"
        @delete-batch="deleteBatchHistory"
      />

      <div v-else class="empty-state">
        <p class="empty-title">{{ historyLoading ? '正在加载最近阅读' : '暂无阅读记录' }}</p>
        <span>{{ historyError || '' }}</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.bookshelf-page {
  padding-top: 46px;
}

.page-head {
  display: grid;
  gap: 10px;
}

.page-head h1 {
  margin: 0;
  font-size: clamp(40px, 5vw, 58px);
  font-weight: 600;
}

.page-head p:last-child,
.section-head span {
  color: var(--color-muted);
}

.page-head p:last-child {
  margin: 0;
  font-size: 15px;
}

.content-block {
  margin-top: 36px;
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-head .meta-label {
  margin: 0 0 7px;
}

.section-head span {
  font-size: 14px;
  font-weight: 800;
}

.favorite-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.empty-state {
  display: grid;
  gap: 14px;
  justify-items: start;
  min-height: 176px;
  align-content: center;
  padding: 30px;
  border: 1px solid rgba(110, 122, 109, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  color: var(--color-muted);
  box-shadow: var(--shadow-paper);
}

.empty-title {
  margin: 0;
  color: var(--color-ink);
  font-family: Newsreader, Georgia, 'Times New Roman', serif;
  font-size: 27px;
  font-weight: 600;
}

.empty-state span {
  line-height: 1.7;
}

@media (max-width: 1120px) {
  .favorite-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .favorite-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .section-head {
    align-items: start;
    flex-direction: column;
  }

  .favorite-grid {
    grid-template-columns: 1fr;
  }
}
</style>
