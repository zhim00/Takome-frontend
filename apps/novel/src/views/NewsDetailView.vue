<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { fetchNewsDetail } from '@/services/novelApi'
import { formatDateLabel } from '@/services/format'
import type { NewsItem } from '@/services/types'

const route = useRoute()
const news = shallowRef<NewsItem>()
const loading = shallowRef(false)
const error = shallowRef('')

const newsId = computed(() => String(route.params.id))
const contentParagraphs = computed(() => {
  const content = news.value?.content?.trim()

  if (!content) {
    return []
  }

  const sentences = content.match(/[^。！？]+[。！？]?/g) ?? [content]
  const paragraphs: string[] = []

  for (let index = 0; index < sentences.length; index += 3) {
    paragraphs.push(sentences.slice(index, index + 3).join('').trim())
  }

  return paragraphs.filter(Boolean)
})

async function loadNews() {
  loading.value = true
  error.value = ''

  try {
    news.value = await fetchNewsDetail(newsId.value)
  } catch (caught) {
    news.value = undefined
    error.value = caught instanceof Error ? caught.message : '资讯加载失败'
  } finally {
    loading.value = false
  }
}

watch(newsId, () => {
  void loadNews()
})

onMounted(() => {
  void loadNews()
})
</script>

<template>
  <main class="news-detail-page">
    <article v-if="news" class="layout-container news-article">
      <RouterLink class="back-link" :to="{ name: 'home' }">返回首页</RouterLink>

      <header class="news-article-head">
        <p class="meta-label">{{ news.category }}</p>
        <h1 class="serif">{{ news.title }}</h1>
        <div class="news-meta">
          <span>{{ news.sourceName }}</span>
          <span>{{ formatDateLabel(news.updatedAt) }}</span>
        </div>
      </header>

      <div class="news-body">
        <p v-for="paragraph in contentParagraphs" :key="paragraph">
          {{ paragraph }}
        </p>
        <p v-if="!contentParagraphs.length">暂无资讯正文。</p>
      </div>
    </article>

    <section v-else class="layout-container news-state">
      <p class="serif">{{ loading ? '正在打开资讯' : error || '未找到资讯' }}</p>
      <RouterLink class="btn-secondary" :to="{ name: 'home' }">返回首页</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.news-detail-page {
  padding-top: 58px;
}

.news-article {
  max-width: 860px;
}

.back-link {
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 800;
}

.news-article-head {
  margin-top: 32px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--color-line);
}

.news-article-head h1 {
  margin: 12px 0 18px;
  color: var(--color-ink);
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 600;
  line-height: 1.08;
}

.news-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 700;
}

.news-body {
  padding-top: 34px;
  color: var(--color-ink);
  font-size: 18px;
  line-height: 1.9;
}

.news-body p {
  margin: 0 0 22px;
}

.news-state {
  display: grid;
  min-height: 420px;
  place-items: center;
  color: var(--color-muted);
}

.news-state p {
  margin: 0;
  color: var(--color-ink);
  font-size: 30px;
}
</style>
