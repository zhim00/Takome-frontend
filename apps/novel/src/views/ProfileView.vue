<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef, watch } from 'vue'
import { RouterLink } from 'vue-router'

import BookCover from '@/components/BookCover.vue'
import { useAuth } from '@/composables/useAuth'
import { useLibraryState } from '@/composables/useLibraryState'
import { mockFeedback } from '@/services/mockData'
import { fetchBook } from '@/services/novelApi'
import type { Book } from '@/services/types'

const { user, updateProfile, updateAvatar } = useAuth()
const { localComments, feedback, addFeedback } = useLibraryState()

const profileForm = reactive({
  nickName: '',
  sex: 'unknown' as 'unknown' | 'male' | 'female',
  signature: '',
})
const feedbackDraft = shallowRef('')
const reviewedBooks = shallowRef<Record<string, Book>>({})
const feedbackItems = computed(() => [...feedback.value, ...mockFeedback])
const myComments = computed(() =>
  user.value ? localComments.value.filter((comment) => comment.userId === user.value?.uid) : [],
)
const avatarLabel = computed(() => user.value?.nickName?.slice(0, 1) || '读')

function syncProfileForm() {
  profileForm.nickName = user.value?.nickName ?? ''
  profileForm.sex = user.value?.sex ?? 'unknown'
  profileForm.signature = user.value?.signature ?? ''
}

function saveProfile() {
  updateProfile({
    nickName: profileForm.nickName.trim() || 'Takome 读者',
    sex: profileForm.sex,
    signature: profileForm.signature.trim(),
  })
}

function submitFeedback() {
  const content = feedbackDraft.value.trim()

  if (!content) {
    return
  }

  addFeedback(content)
  feedbackDraft.value = ''
}

function handleAvatarUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.addEventListener('load', () => {
    if (typeof reader.result === 'string') {
      updateAvatar(reader.result)
    }
  })
  reader.readAsDataURL(file)
  input.value = ''
}

async function loadReviewedBooks() {
  const ids = [...new Set(myComments.value.map((comment) => comment.bookId))]
  const entries = await Promise.all(ids.map(async (id) => [id, await fetchBook(id)] as const))
  reviewedBooks.value = Object.fromEntries(entries)
}

watch(user, syncProfileForm, { immediate: true })
watch(myComments, () => {
  void loadReviewedBooks()
})

onMounted(() => {
  void loadReviewedBooks()
})
</script>

<template>
  <main class="profile-page layout-container">
    <section class="profile-head surface-panel">
      <label class="profile-avatar">
        <img v-if="user?.avatar" :src="user.avatar" alt="" />
        <span v-else>{{ avatarLabel }}</span>
        <input type="file" accept="image/*" @change="handleAvatarUpload" />
      </label>

      <div>
        <p class="meta-label">Profile</p>
        <h1 class="serif">{{ user?.nickName ?? 'Takome 读者' }}</h1>
        <p>{{ user?.signature || '这个人还没有留下签名。' }}</p>
      </div>
    </section>

    <section class="profile-grid">
      <form class="profile-card surface-panel" @submit.prevent="saveProfile">
        <p class="meta-label">Edit</p>
        <h2 class="section-title">编辑资料</h2>

        <label class="field">
          <span>昵称</span>
          <input v-model.trim="profileForm.nickName" type="text" />
        </label>

        <label class="field">
          <span>性别</span>
          <select v-model="profileForm.sex">
            <option value="unknown">保密</option>
            <option value="female">女</option>
            <option value="male">男</option>
          </select>
        </label>

        <label class="field">
          <span>个性签名</span>
          <textarea v-model.trim="profileForm.signature" maxlength="80" />
        </label>

        <button class="btn-primary" type="submit">保存资料</button>
      </form>

      <section class="profile-card surface-panel">
        <p class="meta-label">Reviews</p>
        <h2 class="section-title">我的书评</h2>

        <div v-if="myComments.length" class="review-list">
          <article v-for="comment in myComments" :key="comment.id" class="review-item">
            <BookCover title="书评" size="sm" />
            <div>
              <RouterLink :to="{ name: 'book-detail', params: { id: comment.bookId } }">
                {{ reviewedBooks[comment.bookId]?.title ?? `作品 #${comment.bookId}` }}
              </RouterLink>
              <p>{{ comment.content }}</p>
            </div>
          </article>
        </div>
        <div v-else class="mini-empty">你还没有发布书评。</div>
      </section>
    </section>

    <section class="feedback-card surface-panel">
      <div class="feedback-editor">
        <div>
          <p class="meta-label">Feedback</p>
          <h2 class="section-title">我的反馈</h2>
        </div>
        <textarea v-model="feedbackDraft" placeholder="写下遇到的问题或建议" />
        <button class="btn-primary" type="button" @click="submitFeedback">提交反馈</button>
      </div>

      <div class="feedback-list">
        <article v-for="item in feedbackItems" :key="item.id" class="feedback-item">
          <p>{{ item.content }}</p>
          <small>{{ new Date(item.createdAt).toLocaleString() }} · {{ item.source === 'mock' ? '本地' : '接口' }}</small>
          <div v-if="item.reply" class="feedback-reply">{{ item.reply }}</div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.profile-page {
  padding-top: 54px;
}

.profile-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 24px;
  align-items: center;
  padding: 30px;
}

.profile-avatar {
  display: grid;
  width: 104px;
  height: 104px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-ivory);
  color: var(--color-primary);
  cursor: pointer;
  font-size: 42px;
  font-weight: 900;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar input {
  display: none;
}

.profile-head h1 {
  margin: 8px 0 8px;
  font-size: 48px;
  font-weight: 600;
}

.profile-head p:last-child {
  margin: 0;
  color: var(--color-muted);
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 22px;
  margin-top: 24px;
}

.profile-card,
.feedback-card {
  padding: 24px;
}

.field {
  display: grid;
  gap: 8px;
  margin-top: 16px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
}

.field input,
.field select,
.field textarea,
.feedback-editor textarea {
  width: 100%;
  border: 1px solid var(--color-line);
  border-radius: 4px;
  padding: 10px 12px;
  background: var(--color-surface);
  color: var(--color-ink);
  outline: none;
}

.field input,
.field select {
  min-height: 42px;
}

.field textarea,
.feedback-editor textarea {
  min-height: 92px;
  resize: vertical;
}

.profile-card button {
  margin-top: 18px;
}

.review-list,
.feedback-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.review-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
}

.review-item a {
  color: var(--color-primary);
  font-weight: 800;
}

.review-item p,
.feedback-item p {
  margin: 6px 0 0;
  color: var(--color-muted);
  line-height: 1.65;
}

.mini-empty {
  margin-top: 18px;
  color: var(--color-muted);
}

.feedback-card {
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1fr);
  gap: 24px;
  margin-top: 24px;
}

.feedback-editor {
  display: grid;
  gap: 14px;
  align-content: start;
}

.feedback-item {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-line);
}

.feedback-item:last-child {
  border-bottom: 0;
}

.feedback-item small {
  display: block;
  margin-top: 6px;
  color: var(--color-muted);
}

.feedback-reply {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 4px;
  background: var(--color-paper-muted);
  color: var(--color-ink);
  font-size: 14px;
}

@media (max-width: 880px) {
  .profile-grid,
  .feedback-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .profile-head {
    grid-template-columns: 1fr;
  }
}
</style>
