<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'

import { useAuth } from '@/composables/useAuth'
import { useLibraryState } from '@/composables/useLibraryState'
import type { Book, BookComment } from '@/services/types'

const props = defineProps<{
  book: Book
  apiComments: BookComment[]
}>()

const emit = defineEmits<{
  loginRequired: []
}>()

const { user, isAuthenticated } = useAuth()
const { commentsForBook, addComment, addReply, userCommentForBook } = useLibraryState()

const draft = shallowRef('')
const replyDrafts = reactive<Record<string, string>>({})
const message = shallowRef('')
const localComments = commentsForBook(props.book.id)

const mergedComments = computed(() =>
  [
    ...localComments.value,
    ...props.apiComments.map((comment) => {
      const replyHolder = localComments.value.find((localComment) => localComment.id === comment.id)
      return replyHolder ? { ...comment, replies: replyHolder.replies } : comment
    }),
  ].filter((comment, index, list) => list.findIndex((item) => item.id === comment.id) === index),
)
const currentUserComment = computed(() =>
  user.value ? userCommentForBook(props.book.id, user.value.uid) : undefined,
)
const remaining = computed(() => 240 - draft.value.length)

function submitComment() {
  message.value = ''

  if (!isAuthenticated.value || !user.value) {
    emit('loginRequired')
    return
  }

  if (draft.value.trim().length < 6) {
    message.value = '评论至少 6 个字'
    return
  }

  if (draft.value.length > 240) {
    message.value = '评论最多 240 个字'
    return
  }

  const result = addComment(
    props.book,
    user.value.uid,
    user.value.nickName,
    user.value.avatar ?? '',
    draft.value.trim(),
  )

  if (!result.ok) {
    message.value = result.message ?? '无法重复评论'
    return
  }

  draft.value = ''
  message.value = '评论已保存到本地演示数据'
}

function submitReply(commentId: string) {
  if (!isAuthenticated.value || !user.value) {
    emit('loginRequired')
    return
  }

  const content = replyDrafts[commentId]?.trim()

  if (!content) {
    return
  }

  addReply(commentId, props.book.id, user.value.nickName, content)
  replyDrafts[commentId] = ''
}
</script>

<template>
  <section class="comment-panel">
    <div class="comment-head">
      <div>
        <p class="meta-label">Comments</p>
        <h2 class="section-title">读者书评</h2>
      </div>
      <span class="comment-count">{{ mergedComments.length }} 条</span>
    </div>

    <div class="comment-editor">
      <textarea
        v-model="draft"
        :disabled="Boolean(currentUserComment)"
        maxlength="260"
        placeholder="写下你的阅读印象"
      />
      <div class="comment-editor-foot">
        <span>{{ currentUserComment ? '你已经评论过这本书' : `剩余 ${remaining} 字` }}</span>
        <button class="btn-primary" type="button" @click="submitComment">发表评论</button>
      </div>
      <p v-if="message" class="comment-message">{{ message }}</p>
    </div>

    <div v-if="mergedComments.length" class="comment-list">
      <article v-for="comment in mergedComments" :key="comment.id" class="comment-item">
        <div class="comment-avatar">
          <img v-if="comment.userPhoto" :src="comment.userPhoto" alt="" />
          <span v-else>{{ comment.userName.slice(0, 1) }}</span>
        </div>
        <div class="comment-body">
          <div class="comment-meta">
            <strong>{{ comment.userName }}</strong>
            <span>{{ comment.createdAt }}</span>
          </div>
          <p>{{ comment.content }}</p>

          <div v-if="comment.replies.length" class="reply-list">
            <p v-for="reply in comment.replies" :key="reply.id">
              <strong>{{ reply.userName }}：</strong>{{ reply.content }}
            </p>
          </div>

          <div class="reply-editor">
            <input v-model="replyDrafts[comment.id]" type="text" placeholder="回复这条评论" />
            <button class="btn-secondary" type="button" @click="submitReply(comment.id)">回复</button>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="empty-state">
      <p class="serif">还没有评论</p>
      <span>登录后可以留下第一条书评。</span>
    </div>
  </section>
</template>

<style scoped>
.comment-panel {
  display: grid;
  gap: 24px;
}

.comment-head,
.comment-editor-foot,
.comment-meta,
.reply-editor {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.comment-count {
  color: var(--color-muted);
  font-weight: 700;
}

.comment-editor,
.comment-item,
.empty-state {
  border-radius: 8px;
  background: var(--color-surface);
  box-shadow: var(--shadow-paper);
}

.comment-editor {
  padding: 18px;
}

.comment-editor textarea {
  width: 100%;
  min-height: 112px;
  resize: vertical;
  border: 1px solid var(--color-line);
  border-radius: 4px;
  padding: 12px;
  color: var(--color-ink);
  outline: none;
}

.comment-editor textarea:focus,
.reply-editor input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(52, 168, 83, 0.14);
}

.comment-editor textarea:disabled {
  cursor: not-allowed;
  background: var(--color-paper-muted);
}

.comment-editor-foot {
  margin-top: 12px;
  color: var(--color-muted);
  font-size: 13px;
}

.comment-message {
  margin: 10px 0 0;
  color: var(--color-primary);
  font-size: 13px;
}

.comment-list {
  display: grid;
  gap: 16px;
}

.comment-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  padding: 18px;
}

.comment-avatar {
  display: grid;
  width: 42px;
  height: 42px;
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

.comment-body p {
  margin: 8px 0 0;
  color: var(--color-ink);
  line-height: 1.7;
}

.comment-meta span {
  color: var(--color-muted);
  font-size: 12px;
}

.reply-list {
  margin-top: 12px;
  padding: 12px;
  border-radius: 6px;
  background: var(--color-paper-muted);
}

.reply-list p {
  margin: 0 0 6px;
  color: var(--color-muted);
  font-size: 14px;
}

.reply-list p:last-child {
  margin-bottom: 0;
}

.reply-editor {
  margin-top: 14px;
}

.reply-editor input {
  min-width: 0;
  flex: 1;
  min-height: 38px;
  border: 1px solid var(--color-line);
  border-radius: 4px;
  padding: 0 10px;
  outline: none;
}

.empty-state {
  padding: 28px;
  color: var(--color-muted);
}

.empty-state p {
  margin: 0 0 6px;
  color: var(--color-ink);
  font-size: 24px;
}

@media (max-width: 620px) {
  .comment-editor-foot,
  .reply-editor {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
