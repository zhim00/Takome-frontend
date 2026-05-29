<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'

import BookListItem from '@/components/BookListItem.vue'
import { fetchNewestRank, fetchUpdateRank, fetchVisitRank } from '@/services/novelApi'
import type { Book } from '@/services/types'

type RankingType = 'update' | 'visit' | 'newest'

const activeType = shallowRef<RankingType>('update')
const rankings = shallowRef<Record<RankingType, Book[]>>({
  update: [],
  visit: [],
  newest: [],
})

const tabs: Array<{ type: RankingType; label: string; desc: string }> = [
  { type: 'update', label: '更新榜', desc: '按最新章节活跃度' },
  { type: 'visit', label: '点击榜', desc: '按阅读访问热度' },
  { type: 'newest', label: '新书榜', desc: '按新书受欢迎程度' },
]

const visibleBooks = computed(() => rankings.value[activeType.value].slice(0, 20))

onMounted(async () => {
  const [update, visit, newest] = await Promise.all([
    fetchUpdateRank(),
    fetchVisitRank(),
    fetchNewestRank(),
  ])

  rankings.value = { update, visit, newest }
})
</script>

<template>
  <main class="rankings-page layout-container">
    <section class="page-head">
      <p class="meta-label">Rankings</p>
      <h1 class="serif">排行榜</h1>
    </section>

    <div class="ranking-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.type"
        class="ranking-tab"
        :class="{ 'ranking-tab-active': activeType === tab.type }"
        type="button"
        @click="activeType = tab.type"
      >
        <strong>{{ tab.label }}</strong>
        <span>{{ tab.desc }}</span>
      </button>
    </div>

    <section class="ranking-list surface-panel">
      <BookListItem
        v-for="(book, index) in visibleBooks"
        :key="`${activeType}-${book.id}`"
        :book="book"
        :rank="index + 1"
      />
    </section>
  </main>
</template>

<style scoped>
.rankings-page {
  padding-top: 54px;
}

.page-head h1 {
  margin: 8px 0 10px;
  font-size: 52px;
  font-weight: 600;
}

.page-head p:last-child {
  margin: 0;
  color: var(--color-muted);
}

.ranking-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 32px;
}

.ranking-tab {
  display: grid;
  gap: 6px;
  padding: 18px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: var(--color-surface);
  text-align: left;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.ranking-tab:hover,
.ranking-tab-active {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.ranking-tab strong {
  color: var(--color-ink);
  font-size: 18px;
}

.ranking-tab span {
  color: var(--color-muted);
  font-size: 13px;
}

.ranking-list {
  display: grid;
  gap: 2px;
  margin-top: 24px;
  padding: 18px;
}

@media (max-width: 720px) {
  .ranking-tabs {
    grid-template-columns: 1fr;
  }
}
</style>
