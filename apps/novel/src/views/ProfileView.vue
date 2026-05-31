<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef, watch } from 'vue'
import { RouterLink } from 'vue-router'

import BookCover from '@/components/BookCover.vue'
import { ApiError } from '@/services/apiClient'
import { useAuth } from '@/composables/useAuth'
import {
  deleteUserFeedback,
  deleteBookComment,
  fetchUserComments,
  fetchUserFeedback,
  submitUserFeedback,
} from '@/services/novelApi'
import type { PageResult, UserCommentItem, UserFeedbackItem, UserSex } from '@/services/types'

const COMMENT_PAGE_SIZE = 5
const FEEDBACK_PAGE_SIZE = 5
const emptyCommentPage: PageResult<UserCommentItem> = {
  pageNum: 1,
  pageSize: COMMENT_PAGE_SIZE,
  total: 0,
  list: [],
  pages: 0,
}
const emptyFeedbackPage: PageResult<UserFeedbackItem> = {
  pageNum: 1,
  pageSize: FEEDBACK_PAGE_SIZE,
  total: 0,
  list: [],
  pages: 0,
}

const { user, refreshProfile, updateProfile, updateAvatar } = useAuth()

const profileForm = reactive({
  nickName: '',
  sex: 'unknown' as UserSex,
  signature: '',
})
const feedbackDraft = shallowRef('')
const commentsPage = shallowRef<PageResult<UserCommentItem>>(emptyCommentPage)
const feedbackPage = shallowRef<PageResult<UserFeedbackItem>>(emptyFeedbackPage)
const commentsLoading = shallowRef(false)
const feedbackLoading = shallowRef(false)
const profileSaving = shallowRef(false)
const avatarSaving = shallowRef(false)
const feedbackSubmitting = shallowRef(false)
const deletingFeedbackId = shallowRef('')
const deletingCommentId = shallowRef('')
const profileMessage = shallowRef('')
const avatarMessage = shallowRef('')
const commentsMessage = shallowRef('')
const feedbackMessage = shallowRef('')
const commentPageNum = shallowRef(1)
const feedbackPageNum = shallowRef(1)

const avatarLabel = computed(() => user.value?.nickName?.slice(0, 1) || '读')
const profileName = computed(() => user.value?.nickName || '读取资料中')
const signatureText = computed(() => user.value?.signature || '这个人还没有留下签名。')
const canGoPrevComments = computed(() => commentPageNum.value > 1)
const canGoNextComments = computed(() => commentPageNum.value < commentsPage.value.pages)
const canGoPrevFeedback = computed(() => feedbackPageNum.value > 1)
const canGoNextFeedback = computed(() => feedbackPageNum.value < feedbackPage.value.pages)
const feedbackSubmitDisabled = computed(
  () => feedbackSubmitting.value || feedbackDraft.value.trim().length === 0,
)

function messageFromError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message && !/^HTTP\s\d+/.test(error.message)) {
    return error.message
  }

  if (error instanceof Error && error.message && !/^HTTP\s\d+/.test(error.message)) {
    return error.message
  }

  return fallback
}

function syncProfileForm() {
  profileForm.nickName = user.value?.nickName ?? ''
  profileForm.sex = user.value?.sex ?? 'unknown'
  profileForm.signature = user.value?.signature ?? ''
}

async function saveProfile() {
  if (!user.value) {
    return
  }

  profileSaving.value = true
  profileMessage.value = ''

  try {
    const nickName = profileForm.nickName.trim()

    if (nickName.length < 2 || nickName.length > 10) {
      profileMessage.value = '昵称需为 2 到 10 个字符'
      return
    }

    await updateProfile({
      nickName,
      sex: profileForm.sex,
      signature: profileForm.signature.trim(),
    })
    profileMessage.value = '资料已保存'
  } catch (error) {
    profileMessage.value = messageFromError(error, '资料保存失败')
  } finally {
    profileSaving.value = false
  }
}

async function handleAvatarUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  avatarSaving.value = true
  avatarMessage.value = ''

  try {
    await updateAvatar(file)
    avatarMessage.value = '头像已更新'
  } catch (error) {
    avatarMessage.value = messageFromError(error, '头像更新失败')
  } finally {
    avatarSaving.value = false
    input.value = ''
  }
}

async function loadComments() {
  commentsLoading.value = true
  commentsMessage.value = ''

  try {
    commentsPage.value = await fetchUserComments({
      pageNum: commentPageNum.value,
      pageSize: COMMENT_PAGE_SIZE,
      sort: 'commentTime',
      order: 'desc',
    })
  } catch (error) {
    commentsPage.value = {
      ...emptyCommentPage,
      pageNum: commentPageNum.value,
    }
    commentsMessage.value = messageFromError(error, '我的书评加载失败')
  } finally {
    commentsLoading.value = false
  }
}

async function loadFeedback() {
  feedbackLoading.value = true
  feedbackMessage.value = ''

  try {
    feedbackPage.value = await fetchUserFeedback({
      pageNum: feedbackPageNum.value,
      pageSize: FEEDBACK_PAGE_SIZE,
      sort: 'createTime',
      order: 'desc',
    })
  } catch (error) {
    feedbackPage.value = {
      ...emptyFeedbackPage,
      pageNum: feedbackPageNum.value,
    }
    feedbackMessage.value = messageFromError(error, '反馈查询失败')
  } finally {
    feedbackLoading.value = false
  }
}

async function submitFeedback() {
  const content = feedbackDraft.value.trim()

  if (!content) {
    return
  }

  feedbackSubmitting.value = true
  feedbackMessage.value = ''

  try {
    await submitUserFeedback(content)
    feedbackDraft.value = ''
    feedbackPageNum.value = 1
    await loadFeedback()
    feedbackMessage.value = '反馈已提交'
  } catch (error) {
    feedbackMessage.value = messageFromError(error, '反馈提交失败')
  } finally {
    feedbackSubmitting.value = false
  }
}

async function removeFeedback(id: string) {
  deletingFeedbackId.value = id
  feedbackMessage.value = ''

  try {
    await deleteUserFeedback(id)
    await loadFeedback()
    feedbackMessage.value = '反馈已删除'
  } catch (error) {
    feedbackMessage.value = messageFromError(error, '反馈删除失败')
  } finally {
    deletingFeedbackId.value = ''
  }
}

async function removeComment(comment: UserCommentItem) {
  const commentId = comment.commentId

  deletingCommentId.value = commentId || comment.id
  commentsMessage.value = ''

  try {
    if (!commentId) {
      commentsMessage.value = '当前书评缺少评论ID，无法删除'
      return
    }

    await deleteBookComment(commentId)
    await loadComments()
    commentsMessage.value = '书评已删除'
  } catch (error) {
    commentsMessage.value = messageFromError(error, '书评删除失败')
  } finally {
    deletingCommentId.value = ''
  }
}

function changeCommentPage(nextPage: number) {
  if (nextPage < 1 || nextPage === commentPageNum.value) {
    return
  }

  commentPageNum.value = nextPage
}

function changeFeedbackPage(nextPage: number) {
  if (nextPage < 1 || nextPage === feedbackPageNum.value) {
    return
  }

  feedbackPageNum.value = nextPage
}

watch(user, syncProfileForm, { immediate: true })
watch(commentPageNum, () => {
  void loadComments()
})
watch(feedbackPageNum, () => {
  void loadFeedback()
})

onMounted(() => {
  void refreshProfile().catch(() => undefined)
  void loadComments()
  void loadFeedback()
})
</script>

<template>
  <main class="profile-page layout-container">
    <section class="profile-head surface-panel">
      <label class="profile-avatar" :class="{ 'profile-avatar-busy': avatarSaving }">
        <img v-if="user?.avatar" :src="user.avatar" alt="" />
        <span v-else class="profile-avatar-fallback">{{ avatarLabel }}</span>
        <span class="profile-avatar-overlay">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M14.25 5.25h-4.5L8.1 7.5H5.75A2.75 2.75 0 0 0 3 10.25v5.5a2.75 2.75 0 0 0 2.75 2.75h12.5A2.75 2.75 0 0 0 21 15.75v-5.5a2.75 2.75 0 0 0-2.75-2.75H15.9l-1.65-2.25Z"
              fill="none"
              stroke="currentColor"
              stroke-linejoin="round"
              stroke-width="1.8"
            />
            <path
              d="M12 15.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            />
          </svg>
          <strong>{{ avatarSaving ? '上传中' : '更换头像' }}</strong>
        </span>
        <input type="file" accept="image/*" :disabled="avatarSaving" @change="handleAvatarUpload" />
      </label>

      <div class="profile-head-copy">
        <p class="meta-label">Profile</p>
        <h1 class="serif">{{ profileName }}</h1>
        <p>{{ signatureText }}</p>
        <small v-if="avatarMessage" class="form-message">{{ avatarMessage }}</small>
      </div>
    </section>

    <section class="profile-grid">
      <form class="profile-card surface-panel" @submit.prevent="saveProfile">
        <p class="meta-label">Edit</p>
        <h2 class="section-title">编辑资料</h2>

        <label class="field">
          <span>昵称</span>
          <input
            v-model.trim="profileForm.nickName"
            type="text"
            autocomplete="nickname"
            minlength="2"
            maxlength="10"
          />
        </label>

        <label class="field">
          <span>性别</span>
          <select v-model="profileForm.sex">
            <option value="unknown">保密</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </label>

        <label class="field">
          <span>个性签名</span>
          <textarea v-model.trim="profileForm.signature" maxlength="80" />
        </label>

        <button class="btn-primary" type="submit" :disabled="profileSaving">
          {{ profileSaving ? '保存中' : '保存资料' }}
        </button>
        <p v-if="profileMessage" class="form-message">{{ profileMessage }}</p>
      </form>

      <section class="profile-card surface-panel">
        <div class="section-row">
          <div>
            <p class="meta-label">Reviews</p>
            <h2 class="section-title">我的书评</h2>
          </div>
          <small>{{ commentsPage.total }} 条</small>
        </div>

        <div v-if="commentsLoading" class="mini-empty">正在加载书评...</div>
        <div v-else-if="commentsPage.list.length" class="review-list">
          <article v-for="comment in commentsPage.list" :key="comment.id" class="review-item">
            <RouterLink :to="{ name: 'book-detail', params: { id: comment.bookId }, hash: '#comments' }">
              <BookCover :title="comment.bookTitle" :cover="comment.bookCover" size="sm" />
            </RouterLink>
            <RouterLink
              class="review-body"
              :to="{ name: 'book-detail', params: { id: comment.bookId }, hash: '#comments' }"
            >
              <strong>{{ comment.bookTitle }}</strong>
              <p>{{ comment.content }}</p>
              <small>{{ comment.createdAt || '最近' }}</small>
            </RouterLink>
            <button
              class="review-delete"
              type="button"
              :disabled="deletingCommentId === (comment.commentId || comment.id) || !comment.commentId"
              @click="removeComment(comment)"
            >
              {{ deletingCommentId === (comment.commentId || comment.id) ? '删除中' : '删除' }}
            </button>
          </article>
        </div>
        <div v-else class="mini-empty">
          {{ commentsMessage || '你还没有发布书评。' }}
        </div>

        <div class="pager">
          <button
            class="btn-secondary"
            type="button"
            :disabled="!canGoPrevComments || commentsLoading"
            @click="changeCommentPage(commentPageNum - 1)"
          >
            上一页
          </button>
          <span>{{ commentsPage.pageNum }} / {{ Math.max(commentsPage.pages, 1) }}</span>
          <button
            class="btn-secondary"
            type="button"
            :disabled="!canGoNextComments || commentsLoading"
            @click="changeCommentPage(commentPageNum + 1)"
          >
            下一页
          </button>
        </div>
      </section>
    </section>

    <section class="feedback-card surface-panel">
      <div class="feedback-editor">
        <div>
          <p class="meta-label">Feedback</p>
          <h2 class="section-title">我的反馈</h2>
        </div>
        <textarea v-model="feedbackDraft" maxlength="512" placeholder="写下遇到的问题或建议" />
        <button
          class="btn-primary"
          type="button"
          :disabled="feedbackSubmitDisabled"
          @click="submitFeedback"
        >
          {{ feedbackSubmitting ? '提交中' : '提交反馈' }}
        </button>
        <p v-if="feedbackMessage" class="form-message">{{ feedbackMessage }}</p>
      </div>

      <div>
        <div class="section-row feedback-list-head">
          <strong>反馈记录</strong>
          <small>{{ feedbackPage.total }} 条</small>
        </div>

        <div v-if="feedbackLoading" class="mini-empty">正在加载反馈...</div>
        <div v-else-if="feedbackPage.list.length" class="feedback-list">
          <article v-for="item in feedbackPage.list" :key="item.id" class="feedback-item">
            <div>
              <p>{{ item.content }}</p>
              <small>{{ item.createdAt || '最近' }}</small>
            </div>
            <button
              type="button"
              :disabled="deletingFeedbackId === item.id"
              @click="removeFeedback(item.id)"
            >
              {{ deletingFeedbackId === item.id ? '删除中' : '删除' }}
            </button>
          </article>
        </div>
        <div v-else class="mini-empty">暂无反馈记录。</div>

        <div class="pager">
          <button
            class="btn-secondary"
            type="button"
            :disabled="!canGoPrevFeedback || feedbackLoading"
            @click="changeFeedbackPage(feedbackPageNum - 1)"
          >
            上一页
          </button>
          <span>{{ feedbackPage.pageNum }} / {{ Math.max(feedbackPage.pages, 1) }}</span>
          <button
            class="btn-secondary"
            type="button"
            :disabled="!canGoNextFeedback || feedbackLoading"
            @click="changeFeedbackPage(feedbackPageNum + 1)"
          >
            下一页
          </button>
        </div>
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
  position: relative;
  display: grid;
  width: 132px;
  height: 132px;
  place-items: center;
  overflow: hidden;
  border: 5px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-ivory);
  box-shadow:
    0 0 0 1px rgba(110, 122, 109, 0.16),
    0 20px 42px rgba(27, 28, 28, 0.12);
  color: var(--color-primary);
  cursor: pointer;
  font-size: 42px;
  font-weight: 900;
}

.profile-avatar img,
.profile-avatar-fallback {
  width: 100%;
  height: 100%;
}

.profile-avatar img {
  object-fit: cover;
}

.profile-avatar-fallback {
  display: grid;
  place-items: center;
}

.profile-avatar-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  background: rgba(27, 28, 28, 0.56);
  color: #fff;
  opacity: 0;
  transition: opacity 160ms ease;
}

.profile-avatar:hover .profile-avatar-overlay,
.profile-avatar-busy .profile-avatar-overlay {
  opacity: 1;
}

.profile-avatar-overlay svg {
  width: 40px;
  height: 40px;
}

.profile-avatar-overlay strong {
  font-size: 22px;
  font-weight: 800;
}

.profile-avatar input {
  display: none;
}

.profile-head-copy {
  min-width: 0;
}

.profile-head h1 {
  margin: 8px 0;
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

.section-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 14px;
}

.section-row small,
.feedback-list-head small {
  color: var(--color-muted);
  font-weight: 800;
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

.profile-card button:disabled,
.feedback-card button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.form-message {
  margin: 10px 0 0;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.6;
}

.review-list,
.feedback-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.review-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  align-items: start;
}

.review-body {
  min-width: 0;
}

.review-body strong {
  color: var(--color-primary);
  font-weight: 800;
}

.review-delete {
  color: #93000a;
  font-size: 13px;
  font-weight: 800;
}

.review-delete:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.review-item p,
.feedback-item p {
  margin: 6px 0 0;
  color: var(--color-muted);
  line-height: 1.65;
}

.review-item small,
.feedback-item small {
  display: block;
  margin-top: 6px;
  color: var(--color-muted);
  font-size: 12px;
}

.mini-empty {
  margin-top: 18px;
  color: var(--color-muted);
  line-height: 1.6;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 10px;
  margin-top: 18px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.pager button {
  margin-top: 0;
  padding: 8px 12px;
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

.feedback-list-head {
  min-height: 34px;
  align-items: center;
}

.feedback-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-line);
}

.feedback-item:last-child {
  border-bottom: 0;
}

.feedback-item button {
  align-self: start;
  color: #93000a;
  font-size: 13px;
  font-weight: 800;
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

  .profile-avatar {
    width: 112px;
    height: 112px;
  }

  .profile-head h1 {
    font-size: 38px;
  }

  .section-row,
  .feedback-item {
    grid-template-columns: 1fr;
  }

  .review-item {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .review-delete {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
