<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  previousChapterId?: string
  nextChapterId?: string
}>()
</script>

<template>
  <nav class="chapter-nav" aria-label="章节切换">
    <RouterLink
      v-if="previousChapterId"
      class="chapter-nav-button chapter-nav-secondary"
      :to="{ name: 'reader', params: { chapterId: previousChapterId } }"
    >
      上一章
    </RouterLink>
    <span v-else class="chapter-nav-button chapter-nav-disabled">上一章</span>

    <RouterLink
      v-if="nextChapterId"
      class="chapter-nav-button chapter-nav-primary"
      :to="{ name: 'reader', params: { chapterId: nextChapterId } }"
    >
      下一章
    </RouterLink>
    <span v-else class="chapter-nav-button chapter-nav-disabled">下一章</span>
  </nav>
</template>

<style scoped>
.chapter-nav {
  display: flex;
  justify-content: center;
  gap: 42px;
  margin-top: 66px;
  padding-bottom: 58px;
}

.chapter-nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: min(168px, 34vw);
  min-height: 46px;
  border-radius: 999px;
  font-size: 15px;
}

.chapter-nav-secondary {
  background: var(--reader-button-muted);
  color: var(--reader-ink);
}

.chapter-nav-primary {
  background: var(--reader-accent);
  color: #fff;
}

.chapter-nav-disabled {
  cursor: default;
  background: var(--reader-button-muted);
  color: var(--reader-muted);
  opacity: 0.58;
}

@media (max-width: 560px) {
  .chapter-nav {
    gap: 14px;
    margin-top: 48px;
    padding-bottom: 120px;
  }

  .chapter-nav-button {
    width: min(142px, 42vw);
    min-height: 44px;
  }
}
</style>
