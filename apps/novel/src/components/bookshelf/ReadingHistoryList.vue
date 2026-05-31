<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { RouterLink } from 'vue-router'

import BookCover from '@/components/BookCover.vue'
import { formatDateLabel } from '@/services/format'
import type { UserReadingHistoryItem } from '@/services/types'

const props = defineProps<{
  items: UserReadingHistoryItem[]
  deletingIds: string[]
}>()

const emit = defineEmits<{
  deleteOne: [historyId: string]
  deleteBatch: [historyIds: string[]]
}>()

const selectedIds = shallowRef<string[]>([])

const selectedSet = computed(() => new Set(selectedIds.value))
const deletableSelectedIds = computed(() =>
  selectedIds.value.filter((id) => !props.deletingIds.includes(id)),
)
const isAllSelected = computed(
  () => props.items.length > 0 && props.items.every((item) => selectedSet.value.has(item.id)),
)
const selectedCountText = computed(() =>
  selectedIds.value.length ? `已选 ${selectedIds.value.length}` : '近30天',
)

function toggleItem(historyId: string) {
  if (selectedSet.value.has(historyId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== historyId)
    return
  }

  selectedIds.value = [...selectedIds.value, historyId]
}

function toggleAll() {
  selectedIds.value = isAllSelected.value ? [] : props.items.map((item) => item.id)
}

function deleteSelected() {
  if (!deletableSelectedIds.value.length) {
    return
  }

  emit('deleteBatch', deletableSelectedIds.value)
}

watch(
  () => props.items,
  (items) => {
    const availableIds = new Set(items.map((item) => item.id))
    selectedIds.value = selectedIds.value.filter((id) => availableIds.has(id))
  },
)
</script>

<template>
  <section class="history-panel">
    <header class="history-toolbar">
      <div class="history-toolbar-copy">
        <span class="history-eyebrow">{{ selectedCountText }}</span>
        <strong>阅读轨迹</strong>
      </div>

      <div class="history-actions">
        <button class="select-all-button" type="button" @click="toggleAll">
          <span class="check-box" :class="{ 'check-box-on': isAllSelected }">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m3.2 8.3 3 3 6.6-7" />
            </svg>
          </span>
          <span>{{ isAllSelected ? '取消全选' : '全选' }}</span>
        </button>

        <button
          class="batch-delete-button"
          type="button"
          :disabled="!deletableSelectedIds.length"
          @click="deleteSelected"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16" />
            <path d="M10 11v6M14 11v6" />
            <path d="m6 7 .8 13h10.4L18 7" />
            <path d="M9 7V4h6v3" />
          </svg>
          <span>批量删除</span>
        </button>
      </div>
    </header>

    <div class="history-list">
      <article
        v-for="item in items"
        :key="item.id"
        class="history-row"
        :class="{ 'history-row-selected': selectedSet.has(item.id) }"
      >
        <button
          class="row-check"
          type="button"
          :aria-label="`选择 ${item.bookTitle}`"
          @click="toggleItem(item.id)"
        >
          <span class="check-box" :class="{ 'check-box-on': selectedSet.has(item.id) }">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m3.2 8.3 3 3 6.6-7" />
            </svg>
          </span>
        </button>

        <RouterLink
          class="history-cover"
          :to="{ name: 'reader', params: { chapterId: item.chapterId } }"
        >
          <BookCover :title="item.bookTitle" :cover="item.cover" size="sm" />
        </RouterLink>

        <RouterLink
          class="history-main"
          :to="{ name: 'reader', params: { chapterId: item.chapterId } }"
        >
          <span class="history-book-line">
            <strong>{{ item.bookTitle }}</strong>
            <em>继续阅读</em>
          </span>
          <span class="history-chapter">{{ item.chapterTitle }}</span>
          <span class="history-meta">上次阅读 · {{ formatDateLabel(item.updatedAt) }}</span>
        </RouterLink>

        <div class="history-row-actions">
          <time class="history-time">{{ formatDateLabel(item.updatedAt) }}</time>
          <button
            class="delete-button"
            type="button"
            :disabled="deletingIds.includes(item.id)"
            :aria-label="`删除 ${item.bookTitle} 阅读记录`"
            @click="emit('deleteOne', item.id)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16" />
              <path d="M10 11v6M14 11v6" />
              <path d="m6 7 .8 13h10.4L18 7" />
              <path d="M9 7V4h6v3" />
            </svg>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.history-panel {
  overflow: hidden;
  border: 1px solid rgba(110, 122, 109, 0.14);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 246, 239, 0.82)),
    var(--color-surface);
  box-shadow:
    0 22px 58px rgba(27, 28, 28, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.76);
}

.history-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 72px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(110, 122, 109, 0.12);
  background:
    linear-gradient(125deg, rgba(27, 28, 28, 0.96), rgba(49, 65, 56, 0.94)), var(--color-ink);
  color: #fff;
}

.history-toolbar-copy {
  display: grid;
  gap: 5px;
}

.history-toolbar-copy strong {
  font-family: Newsreader, Georgia, 'Times New Roman', serif;
  font-size: 24px;
  font-weight: 650;
  line-height: 1;
}

.history-eyebrow {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
}

.history-actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.select-all-button,
.batch-delete-button,
.row-check,
.delete-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.select-all-button {
  gap: 9px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 900;
  transition:
    background 160ms ease,
    border-color 160ms ease;
}

.select-all-button:hover {
  border-color: rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.13);
}

.batch-delete-button {
  gap: 8px;
  min-height: 36px;
  padding: 0 13px;
  border: 1px solid rgba(230, 112, 88, 0.34);
  border-radius: 4px;
  background: rgba(230, 112, 88, 0.13);
  color: #ffd2c9;
  font-size: 13px;
  font-weight: 900;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    opacity 160ms ease;
}

.batch-delete-button:hover {
  border-color: rgba(230, 112, 88, 0.54);
  background: rgba(230, 112, 88, 0.2);
}

.batch-delete-button:disabled,
.delete-button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.batch-delete-button svg,
.delete-button svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.history-list {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.history-row {
  position: relative;
  display: grid;
  grid-template-columns: 34px auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  min-height: 116px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid rgba(110, 122, 109, 0.1);
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.96), rgba(252, 250, 243, 0.92)),
    var(--color-surface);
  box-shadow: 0 12px 30px rgba(27, 28, 28, 0.045);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.history-row::before {
  position: absolute;
  inset: 14px auto 14px 0;
  width: 3px;
  border-radius: 0 999px 999px 0;
  background: rgba(0, 110, 44, 0.42);
  content: '';
}

.history-row:hover,
.history-row-selected {
  border-color: rgba(0, 110, 44, 0.22);
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 1), rgba(243, 249, 241, 0.92)), var(--color-surface);
  box-shadow: 0 18px 38px rgba(27, 28, 28, 0.075);
  transform: translateY(-2px);
}

.row-check {
  position: relative;
  z-index: 1;
  width: 30px;
  height: 30px;
}

.check-box {
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border: 1px solid rgba(110, 122, 109, 0.38);
  border-radius: 4px;
  background: #fff;
  color: #fff;
}

.history-toolbar .check-box {
  border-color: rgba(255, 255, 255, 0.34);
  background: rgba(255, 255, 255, 0.08);
}

.check-box svg {
  width: 13px;
  height: 13px;
  fill: none;
  opacity: 0;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  transition: opacity 120ms ease;
}

.check-box-on,
.history-toolbar .check-box-on {
  border-color: var(--color-primary);
  background: var(--color-primary);
}

.check-box-on svg {
  opacity: 1;
}

.history-cover {
  position: relative;
  z-index: 1;
  border-radius: 8px;
  transition:
    transform 180ms ease,
    filter 180ms ease;
}

.history-cover :deep(.book-cover-sm) {
  width: 74px;
}

.history-cover:hover {
  filter: saturate(1.05);
  transform: translateY(-3px) rotate(-1deg);
}

.history-main {
  position: relative;
  z-index: 1;
  display: grid;
  min-width: 0;
  gap: 9px;
}

.history-book-line {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.history-book-line strong,
.history-chapter,
.history-meta,
.history-time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-book-line strong {
  min-width: 0;
  color: var(--color-ink);
  font-size: 21px;
  font-weight: 900;
  line-height: 1.2;
}

.history-book-line em {
  flex: 0 0 auto;
  padding: 4px 7px;
  border-radius: 4px;
  background: rgba(0, 110, 44, 0.08);
  color: var(--color-primary);
  font-size: 11px;
  font-style: normal;
  font-weight: 900;
}

.history-chapter {
  color: rgba(27, 28, 28, 0.76);
  font-size: 15px;
  font-weight: 800;
}

.history-meta,
.history-time {
  color: var(--color-muted);
  font-size: 13px;
}

.history-row-actions {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.delete-button {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(190, 64, 47, 0.12);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.62);
  color: rgba(164, 61, 49, 0.8);
  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.delete-button:hover {
  border-color: rgba(190, 64, 47, 0.26);
  background: rgba(190, 64, 47, 0.1);
  color: #a43d31;
  transform: translateY(-1px);
}

@media (max-width: 760px) {
  .history-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .history-actions,
  .batch-delete-button {
    width: 100%;
  }

  .select-all-button,
  .batch-delete-button {
    flex: 1;
  }

  .history-row {
    grid-template-columns: 30px auto minmax(0, 1fr);
    gap: 12px;
    padding: 14px;
  }

  .history-row-actions {
    grid-column: 3 / 4;
    justify-content: space-between;
    width: 100%;
  }

  .history-book-line {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .history-meta {
    display: none;
  }
}

@media (max-width: 520px) {
  .history-list {
    padding: 12px;
  }

  .history-row {
    grid-template-columns: 30px 74px minmax(0, 1fr);
  }

  .history-cover {
    grid-column: 2 / 3;
    grid-row: 1 / 3;
  }

  .history-main {
    grid-column: 3 / 4;
  }

  .history-row-actions {
    grid-column: 3 / 4;
  }
}
</style>
