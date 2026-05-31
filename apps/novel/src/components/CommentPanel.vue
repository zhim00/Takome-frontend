<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

import { ApiError } from '@/services/apiClient'
import { createBookComment, deleteBookComment, updateBookComment } from '@/services/novelApi'
import { useAuth } from '@/composables/useAuth'
import type { Book, BookComment } from '@/services/types'

const props = defineProps<{
  book: Book
  apiComments: BookComment[]
  commentTotal: number
}>()

const emit = defineEmits<{
  loginRequired: []
  changed: []
}>()

const MAX_COMMENT_LENGTH = 240

const { user, isAuthenticated } = useAuth()

const draft = shallowRef('')
const editDraft = shallowRef('')
const editingCommentId = shallowRef('')
const pendingDeleteComment = shallowRef<BookComment>()
const message = shallowRef('')
const isSubmitting = shallowRef(false)

const visibleComments = computed(() => props.apiComments.slice(0, 5))
const commentCount = computed(() => Math.max(props.commentTotal, props.apiComments.length))
const currentUserComment = computed(() =>
  user.value ? props.apiComments.find((comment) => isOwnComment(comment)) : undefined,
)
const remaining = computed(() => MAX_COMMENT_LENGTH - draft.value.length)
const hasViewAllEntry = computed(() => visibleComments.value.length >= 5)

function isOwnComment(comment: BookComment) {
  return Boolean(user.value?.uid && comment.userId === String(user.value.uid))
}

function getMessageFromError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message && !/^HTTP\s\d+/.test(error.message)) {
    return error.message
  }

  return fallback
}

function requireLogin() {
  if (!isAuthenticated.value || !user.value) {
    emit('loginRequired')
    return true
  }

  return false
}

async function submitComment() {
  message.value = ''

  if (requireLogin()) {
    return
  }

  const currentUser = user.value

  if (!currentUser) {
    return
  }

  if (currentUserComment.value) {
    message.value = '你已经评论过这本书'
    return
  }

  const content = draft.value.trim()

  if (content.length < 6) {
    message.value = '评论至少 6 个字'
    return
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    message.value = `评论最多 ${MAX_COMMENT_LENGTH} 个字`
    return
  }

  isSubmitting.value = true

  try {
    await createBookComment(props.book.id, String(currentUser.uid), content)
    draft.value = ''
    message.value = '评论已发布'
    emit('changed')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      emit('loginRequired')
      return
    }

    message.value = getMessageFromError(error, '你已经评论过这本书或评论暂时发布失败')
  } finally {
    isSubmitting.value = false
  }
}

function startEdit(comment: BookComment) {
  if (!isOwnComment(comment)) {
    return
  }

  message.value = ''
  editingCommentId.value = comment.id
  editDraft.value = comment.content
}

function cancelEdit() {
  editingCommentId.value = ''
  editDraft.value = ''
}

async function saveEdit(comment: BookComment) {
  if (requireLogin() || !isOwnComment(comment)) {
    return
  }

  const content = editDraft.value.trim()

  if (content.length < 6) {
    message.value = '评论至少 6 个字'
    return
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    message.value = `评论最多 ${MAX_COMMENT_LENGTH} 个字`
    return
  }

  isSubmitting.value = true

  try {
    await updateBookComment(comment.id, content)
    cancelEdit()
    message.value = '评论已修改'
    emit('changed')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      emit('loginRequired')
      return
    }

    message.value = getMessageFromError(error, '评论修改失败')
  } finally {
    isSubmitting.value = false
  }
}

function requestDelete(comment: BookComment) {
  if (!isOwnComment(comment)) {
    return
  }

  pendingDeleteComment.value = comment
}

function cancelDelete() {
  pendingDeleteComment.value = undefined
}

async function confirmDelete() {
  const comment = pendingDeleteComment.value

  if (!comment || requireLogin() || !isOwnComment(comment)) {
    return
  }

  isSubmitting.value = true
  message.value = ''

  try {
    await deleteBookComment(comment.id)
    cancelEdit()
    cancelDelete()
    message.value = '评论已删除'
    emit('changed')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      emit('loginRequired')
      return
    }

    message.value = getMessageFromError(error, '评论删除失败')
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.book.id,
  () => {
    draft.value = ''
    cancelEdit()
    cancelDelete()
    message.value = ''
  },
)
</script>

<template>
  <section id="comments" class="comment-panel surface-panel">
    <div class="comment-head">
      <div>
        <p class="meta-label">Comments</p>
        <h2 class="section-title">读者书评</h2>
      </div>
      <span class="comment-count">{{ commentCount }} 条</span>
    </div>

    <div class="comment-editor">
      <textarea v-model="draft" maxlength="240" placeholder="写下你的阅读印象" />
      <div class="comment-editor-foot">
        <span>{{ isAuthenticated ? `剩余 ${remaining} 字` : '登录后可以发表评论' }}</span>
        <button class="btn-primary" type="button" :disabled="isSubmitting" @click="submitComment">
          发表评论
        </button>
      </div>
      <p v-if="message" class="comment-message">{{ message }}</p>
    </div>

    <div v-if="visibleComments.length" class="comment-list">
      <article v-for="comment in visibleComments" :key="comment.id" class="comment-item">
        <div class="comment-avatar">
          <img v-if="comment.userPhoto" :src="comment.userPhoto" alt="" />
          <span v-else>{{ comment.userName.slice(0, 1) }}</span>
        </div>

        <div class="comment-body">
          <div class="comment-meta">
            <span>
              <strong>{{ comment.userName }}</strong>
              <small>{{ comment.createdAt }}</small>
            </span>
            <div v-if="isOwnComment(comment)" class="comment-actions">
              <button type="button" @click="startEdit(comment)">修改</button>
              <button type="button" @click="requestDelete(comment)">删除</button>
            </div>
          </div>

          <div v-if="editingCommentId === comment.id" class="comment-edit">
            <textarea v-model="editDraft" maxlength="240" />
            <div class="comment-edit-actions">
              <button class="btn-secondary" type="button" @click="cancelEdit">取消</button>
              <button class="btn-primary" type="button" :disabled="isSubmitting" @click="saveEdit(comment)">
                保存修改
              </button>
            </div>
          </div>
          <p v-else>{{ comment.content }}</p>
        </div>
      </article>

      <button v-if="hasViewAllEntry" class="comment-view-all" type="button">查看全部评论</button>
    </div>

    <div v-else class="empty-state">
      <p class="serif">还没有评论</p>
      <span v-if="!isAuthenticated">登录后可以留下第一条书评。</span>
    </div>

    <Teleport to="body">
      <Transition name="confirm-dialog">
        <div v-if="pendingDeleteComment" class="confirm-layer" @click.self="cancelDelete">
          <section class="confirm-card" role="dialog" aria-modal="true" aria-labelledby="delete-comment-title">
            <p class="meta-label">Delete</p>
            <h3 id="delete-comment-title" class="serif">删除这条评论？</h3>
            <p>删除后评论会从作品书评区移除，此操作不能撤回。</p>
            <div class="confirm-actions">
              <button class="btn-secondary" type="button" @click="cancelDelete">取消</button>
              <button class="btn-primary" type="button" :disabled="isSubmitting" @click="confirmDelete">
                确认删除
              </button>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.comment-panel {
  display: grid;
  gap: 22px;
  padding: 24px;
}

.comment-head,
.comment-editor-foot,
.comment-meta,
.comment-actions,
.comment-edit-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.comment-count {
  color: var(--color-muted);
  font-weight: 700;
}

.comment-editor {
  padding: 16px;
  border: 1px solid rgba(110, 122, 109, 0.16);
  border-radius: 6px;
  background: rgba(240, 237, 237, 0.42);
}

.comment-editor textarea,
.comment-edit textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--color-line);
  border-radius: 4px;
  padding: 12px;
  background: var(--color-surface);
  color: var(--color-ink);
  outline: none;
}

.comment-editor textarea {
  min-height: 108px;
}

.comment-edit textarea {
  min-height: 92px;
}

.comment-editor textarea:focus,
.comment-edit textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(52, 168, 83, 0.14);
}

.comment-editor-foot {
  margin-top: 12px;
  color: var(--color-muted);
  font-size: 13px;
}

.comment-editor-foot button:disabled,
.comment-edit-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.56;
}

.comment-message {
  margin: 10px 0 0;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
}

.comment-list {
  display: grid;
  border-top: 1px solid var(--color-line);
}

.comment-item {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 18px;
  padding: 22px 0;
  border-bottom: 1px solid var(--color-line);
}

.comment-avatar {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-ivory);
  color: var(--color-primary);
  font-weight: 800;
}

.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-body {
  min-width: 0;
}

.comment-body p {
  margin: 10px 0 0;
  color: var(--color-ink);
  font-size: 15px;
  line-height: 1.75;
}

.comment-meta {
  align-items: start;
}

.comment-meta span {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.comment-meta strong {
  color: var(--color-ink);
  font-size: 15px;
}

.comment-meta small {
  color: var(--color-muted);
  font-size: 12px;
}

.comment-actions {
  justify-content: end;
}

.comment-actions button {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.comment-actions button:hover {
  color: var(--color-primary);
}

.comment-edit {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.comment-edit-actions {
  justify-content: end;
}

.comment-view-all {
  justify-self: center;
  margin: 18px 0 0;
  padding: 8px 18px;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 800;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease;
}

.comment-view-all:hover {
  border-color: var(--color-primary);
  background: rgba(52, 168, 83, 0.08);
}

.empty-state {
  padding: 30px 0 6px;
  color: var(--color-muted);
  text-align: center;
}

.empty-state p {
  margin: 0 0 6px;
  color: var(--color-ink);
  font-size: 24px;
}

.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
  transition: opacity 160ms ease;
}

.confirm-dialog-enter-from,
.confirm-dialog-leave-to {
  opacity: 0;
}

.confirm-layer {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(27, 28, 28, 0.32);
}

.confirm-card {
  width: min(100%, 360px);
  padding: 24px;
  border: 1px solid rgba(110, 122, 109, 0.18);
  border-radius: 10px;
  background: var(--color-surface);
  box-shadow: 0 24px 70px rgba(27, 28, 28, 0.22);
}

.confirm-card h3 {
  margin: 6px 0 10px;
  color: var(--color-ink);
  font-size: 28px;
  font-weight: 600;
}

.confirm-card p:not(.meta-label) {
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.7;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

@media (max-width: 620px) {
  .comment-editor-foot,
  .comment-edit-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .comment-item {
    grid-template-columns: 1fr;
  }
}
</style>
