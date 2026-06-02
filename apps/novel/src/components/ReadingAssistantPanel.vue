<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, shallowRef, useTemplateRef, watch } from 'vue'

import assistantIcon from '@/assets/ai_assistant.apng'

interface PromptCard {
  title: string
  description: string
  prompt: string
}

interface ChatMessage {
  id: number
  role: 'assistant' | 'user'
  content: string
  kind?: 'loginRequired'
  pending?: boolean
}

const props = defineProps<{
  isAuthenticated: boolean
}>()

const emit = defineEmits<{
  close: []
  loginRequired: []
}>()

const promptCards: PromptCard[] = [
  {
    title: '查阅书架',
    description: '快速整理我的收藏、阅读进度和最近打开的作品。',
    prompt: '请帮我查看书架，整理我正在阅读和已收藏的书籍。',
  },
  {
    title: '书籍搜索',
    description: '按书名、作者或题材查找作品，缩小筛选范围。',
    prompt: '请帮我搜索书籍，我会提供书名、作者或题材关键词。',
  },
  {
    title: '书籍详情',
    description: '汇总作品简介、作者信息、章节和阅读入口。',
    prompt: '请帮我查看书籍详情，并说明这本书适合什么读者。',
  },
  {
    title: '推荐好书',
    description: '结合偏好推荐下一本值得打开的长篇作品。',
    prompt: '请根据我的阅读偏好推荐几本好书，并说明推荐理由。',
  },
]

const CAROUSEL_INTERVAL_MS = 4400
const CAROUSEL_FALLBACK_MS = 760
const HERO_ICON_COMBO_RESET_MS = 1200
const HERO_ICON_TAP_ANIMATION_MS = 360

const messages = shallowRef<ChatMessage[]>([])
const draft = shallowRef('')
const isFloating = shallowRef(false)
const copiedMessageId = shallowRef<number | null>(null)
const activeCardIndex = shallowRef(promptCards.length)
const isCarouselResetting = shallowRef(true)
const cardStep = shallowRef(0)
const cardWidth = shallowRef(0)
const pendingUnauthenticatedMessage = shallowRef<string | null>(null)
const shouldReplayPendingAfterLogin = shallowRef(false)
const heroIconTapCount = shallowRef(0)
const heroIconEffectKey = shallowRef(0)
const isHeroIconTapping = shallowRef(false)
const inputRef = useTemplateRef<HTMLTextAreaElement>('input')
const panelRef = useTemplateRef<HTMLElement>('panel')
const messagesRef = useTemplateRef<HTMLElement>('messages')
const carouselViewportRef = useTemplateRef<HTMLElement>('carouselViewport')
const cardTrackRef = useTemplateRef<HTMLElement>('cardTrack')
const floatingPosition = reactive({
  x: 0,
  y: 96,
})

let messageId = 0
let carouselTimer: number | undefined
let carouselFallbackTimer: number | undefined
let heroIconComboTimer: number | undefined
let heroIconTapAnimationTimer: number | undefined
let heroIconAnimationFrame: number | undefined
let isCarouselAnimating = false
let queuedCarouselSteps = 0
let dragStart:
  | {
      pointerId: number
      originX: number
      originY: number
      panelX: number
      panelY: number
    }
  | null = null

const hasConversation = computed(() => messages.value.length > 0)
const dockStateLabel = computed(() => (isFloating.value ? '窗口吸附' : '窗口浮动'))
const dockStateTitle = computed(() => (isFloating.value ? '吸附到右侧边栏' : '切换为可拖动浮动窗口'))
const heroIconLabel = computed(() =>
  heroIconTapCount.value > 0
    ? `阅读助手图标，已连续点击 ${heroIconTapCount.value} 次`
    : '点击阅读助手图标',
)
const carouselCards = computed<PromptCard[]>(() => {
  return [...promptCards, ...promptCards, ...promptCards]
})
const carouselTrackStyle = computed(() => ({
  transform: `translate3d(-${activeCardIndex.value * cardStep.value}px, 0, 0)`,
}))
const carouselCardStyle = computed(() => {
  if (!cardWidth.value) {
    return undefined
  }

  return {
    flexBasis: `${cardWidth.value}px`,
  }
})
const panelStyle = computed(() => {
  if (!isFloating.value) {
    return undefined
  }

  return {
    left: `${floatingPosition.x}px`,
    top: `${floatingPosition.y}px`,
  }
})

function createMessage(role: ChatMessage['role'], content: string, options: Partial<ChatMessage> = {}) {
  messageId += 1

  return {
    id: messageId,
    role,
    content,
    ...options,
  }
}

function toggleFloatMode() {
  if (isFloating.value) {
    isFloating.value = false
    return
  }

  const rect = panelRef.value?.getBoundingClientRect()
  const width = rect?.width ?? 380
  const height = rect?.height ?? 620

  floatingPosition.x = clamp(rect?.left ?? window.innerWidth - width - 24, 12, window.innerWidth - width - 12)
  floatingPosition.y = clamp(rect?.top ?? 96, 12, window.innerHeight - height - 12)
  isFloating.value = true
}

function startDrag(event: PointerEvent) {
  if (!isFloating.value || (event.target as HTMLElement).closest('button')) {
    return
  }

  const rect = panelRef.value?.getBoundingClientRect()

  dragStart = {
    pointerId: event.pointerId,
    originX: event.clientX,
    originY: event.clientY,
    panelX: floatingPosition.x,
    panelY: floatingPosition.y,
  }

  if (rect) {
    floatingPosition.x = rect.left
    floatingPosition.y = rect.top
  }

  window.addEventListener('pointermove', dragPanel)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}

function dragPanel(event: PointerEvent) {
  if (!dragStart || event.pointerId !== dragStart.pointerId) {
    return
  }

  const rect = panelRef.value?.getBoundingClientRect()
  const width = rect?.width ?? 380
  const height = rect?.height ?? 620
  const nextX = dragStart.panelX + event.clientX - dragStart.originX
  const nextY = dragStart.panelY + event.clientY - dragStart.originY

  floatingPosition.x = clamp(nextX, 8, window.innerWidth - width - 8)
  floatingPosition.y = clamp(nextY, 8, window.innerHeight - height - 8)
}

function stopDrag(event: PointerEvent) {
  if (dragStart && event.pointerId !== dragStart.pointerId) {
    return
  }

  dragStart = null
  window.removeEventListener('pointermove', dragPanel)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min
  }

  return Math.min(Math.max(value, min), max)
}

function scrollCards(direction: -1 | 1) {
  restartCarousel()
  advanceCarousel(direction)
}

function advanceCarousel(direction: -1 | 1) {
  measureCarouselStep()

  if (isCarouselAnimating) {
    queuedCarouselSteps = clamp(queuedCarouselSteps + direction, -2, 2)
    return
  }

  startCarouselTransition(direction)
}

function startCarouselTransition(direction: -1 | 1) {
  isCarouselAnimating = true
  window.clearTimeout(carouselFallbackTimer)

  if (activeCardIndex.value <= 0 || activeCardIndex.value >= promptCards.length * 2) {
    jumpToLoopedCard(activeCardIndex.value)
  }

  isCarouselResetting.value = false

  window.requestAnimationFrame(() => {
    activeCardIndex.value += direction

    carouselFallbackTimer = window.setTimeout(finishCarouselTransition, CAROUSEL_FALLBACK_MS)
  })
}

function finishCarouselTransition(event?: TransitionEvent) {
  if (event && (event.target !== cardTrackRef.value || event.propertyName !== 'transform')) {
    return
  }

  if (!isCarouselAnimating) {
    return
  }

  isCarouselAnimating = false
  window.clearTimeout(carouselFallbackTimer)
  jumpToLoopedCard(activeCardIndex.value)

  if (queuedCarouselSteps !== 0) {
    const direction = queuedCarouselSteps > 0 ? 1 : -1
    queuedCarouselSteps -= direction
    window.requestAnimationFrame(() => {
      startCarouselTransition(direction)
    })
    return
  }
}

function jumpToLoopedCard(index: number) {
  const loopLength = promptCards.length
  const normalizedIndex = ((index % loopLength) + loopLength) % loopLength
  const loopedIndex = normalizedIndex + loopLength

  if (activeCardIndex.value === loopedIndex) {
    return
  }

  isCarouselResetting.value = true
  activeCardIndex.value = loopedIndex

  window.setTimeout(() => {
    isCarouselResetting.value = false
  }, 0)
}

function requestLoginMessage() {
  messages.value = [
    ...messages.value,
    createMessage('assistant', '该功能需要登录后才能使用，请先登录。', {
      kind: 'loginRequired',
    }),
  ]
  void scrollMessagesToBottom()
}

function appendUserMessage(content: string) {
  messages.value = [...messages.value, createMessage('user', content)]
}

async function submitCardPrompt(card: PromptCard) {
  await submitMessage(card.prompt)
}

async function submitDraft() {
  const content = draft.value.trim()

  if (!content) {
    return
  }

  draft.value = ''
  await nextTick()
  syncInputHeight()
  await submitMessage(content)
}

async function submitMessage(content: string) {
  appendUserMessage(content)
  await scrollMessagesToBottom()

  if (!props.isAuthenticated) {
    pendingUnauthenticatedMessage.value = content
    requestLoginMessage()
    return
  }

  pendingUnauthenticatedMessage.value = null
  shouldReplayPendingAfterLogin.value = false
  await streamAssistantReply(content)
}

async function streamAssistantReply(_content: string) {
  const reply = createMessage('assistant', '后端 AI 聊天接口尚未接入，接口确定后这里会展示服务端返回的流式消息。', {
    pending: true,
  })

  messages.value = [...messages.value, reply]
  await scrollMessagesToBottom()

  messages.value = messages.value.map((message) =>
    message.id === reply.id
      ? {
          ...message,
          pending: false,
        }
      : message,
  )
}

async function scrollMessagesToBottom() {
  await nextTick()
  const container = messagesRef.value

  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

async function copyMessage(message: ChatMessage) {
  try {
    await navigator.clipboard.writeText(message.content)
    copiedMessageId.value = message.id
    window.setTimeout(() => {
      if (copiedMessageId.value === message.id) {
        copiedMessageId.value = null
      }
    }, 1400)
  } catch {
    copiedMessageId.value = null
  }
}

function openLogin() {
  emit('loginRequired')
}

function openLoginFromReminder() {
  shouldReplayPendingAfterLogin.value = pendingUnauthenticatedMessage.value !== null
  emit('loginRequired')
}

function tapHeroIcon() {
  heroIconTapCount.value += 1
  heroIconEffectKey.value += 1
  isHeroIconTapping.value = false

  window.clearTimeout(heroIconComboTimer)
  window.clearTimeout(heroIconTapAnimationTimer)
  if (heroIconAnimationFrame !== undefined) {
    window.cancelAnimationFrame(heroIconAnimationFrame)
    heroIconAnimationFrame = undefined
  }

  heroIconAnimationFrame = window.requestAnimationFrame(() => {
    heroIconAnimationFrame = undefined
    isHeroIconTapping.value = true
    heroIconTapAnimationTimer = window.setTimeout(() => {
      isHeroIconTapping.value = false
    }, HERO_ICON_TAP_ANIMATION_MS)
  })

  heroIconComboTimer = window.setTimeout(() => {
    heroIconTapCount.value = 0
    isHeroIconTapping.value = false
  }, HERO_ICON_COMBO_RESET_MS)
}

function moveLoginGlow(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()

  target.style.setProperty('--login-glow-x', `${event.clientX - rect.left}px`)
  target.style.setProperty('--login-glow-y', `${event.clientY - rect.top}px`)
}

function syncInputHeight() {
  const input = inputRef.value

  if (!input) {
    return
  }

  input.style.height = 'auto'
  input.style.height = `${Math.min(input.scrollHeight, 126)}px`
}

function measureCarouselStep() {
  const track = cardTrackRef.value
  const viewport = carouselViewportRef.value

  if (!track || !viewport) {
    return
  }

  const styles = window.getComputedStyle(track)
  const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0
  const viewportWidth = viewport.getBoundingClientRect().width

  if (viewportWidth <= 0) {
    return
  }

  const peekWidth = Math.min(34, Math.max(18, viewportWidth * 0.08))
  const nextCardWidth = (viewportWidth - gap + peekWidth) / 2

  cardWidth.value = nextCardWidth
  cardStep.value = nextCardWidth + gap
}

function startCarousel() {
  carouselTimer = window.setInterval(() => {
    advanceCarousel(1)
  }, CAROUSEL_INTERVAL_MS)
}

function restartCarousel() {
  if (carouselTimer) {
    window.clearInterval(carouselTimer)
  }

  startCarousel()
}

onMounted(() => {
  void nextTick().then(measureCarouselStep)
  window.addEventListener('resize', measureCarouselStep)
  startCarousel()
})

watch(
  () => props.isAuthenticated,
  (isAuthenticated, wasAuthenticated) => {
    if (!isAuthenticated || wasAuthenticated || !shouldReplayPendingAfterLogin.value) {
      return
    }

    const messageToReplay = pendingUnauthenticatedMessage.value
    pendingUnauthenticatedMessage.value = null
    shouldReplayPendingAfterLogin.value = false
    messages.value = []
    copiedMessageId.value = null

    if (messageToReplay) {
      void nextTick().then(() => submitMessage(messageToReplay))
    }
  },
)

onBeforeUnmount(() => {
  if (carouselTimer) {
    window.clearInterval(carouselTimer)
  }

  window.clearTimeout(carouselFallbackTimer)
  window.clearTimeout(heroIconComboTimer)
  window.clearTimeout(heroIconTapAnimationTimer)
  if (heroIconAnimationFrame !== undefined) {
    window.cancelAnimationFrame(heroIconAnimationFrame)
    heroIconAnimationFrame = undefined
  }

  window.removeEventListener('resize', measureCarouselStep)
  window.removeEventListener('pointermove', dragPanel)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
})
</script>

<template>
  <section
    ref="panel"
    class="reading-assistant"
    :class="{ 'reading-assistant-floating': isFloating }"
    :style="panelStyle"
    aria-label="Takome 阅读助手"
  >
    <header class="assistant-header" @pointerdown="startDrag">
      <div class="assistant-title">
        <span class="assistant-mark" aria-hidden="true">T</span>
        <strong>Takome 阅读助手</strong>
      </div>

      <nav class="assistant-menu" aria-label="阅读助手菜单">
        <button
          class="assistant-icon-button"
          type="button"
          :aria-label="dockStateLabel"
          :data-tooltip="dockStateLabel"
          :title="dockStateTitle"
          @click="toggleFloatMode"
        >
          <svg v-if="isFloating" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6h12v12H6zM9 3h12v12" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 4h12v12H8zM4 8h12v12H4z" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
        </button>
        <button
          class="assistant-icon-button"
          type="button"
          aria-label="关闭"
          data-tooltip="关闭"
          title="关闭"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
        </button>
      </nav>
    </header>

    <main class="assistant-body" :class="{ 'assistant-body-chatting': hasConversation }">
      <section v-if="!hasConversation" class="assistant-intro">
        <div class="assistant-hero">
          <button
            class="assistant-hero-icon-button"
            :class="{ 'assistant-hero-icon-button-tapping': isHeroIconTapping }"
            type="button"
            :aria-label="heroIconLabel"
            @click="tapHeroIcon"
          >
            <span :key="heroIconEffectKey" class="assistant-hero-icon-pulse" aria-hidden="true"></span>
            <img class="assistant-hero-icon" :src="assistantIcon" alt="" />
            <span v-if="heroIconTapCount > 0" class="assistant-hero-icon-count" aria-live="polite">
              ×{{ heroIconTapCount }}
            </span>
          </button>
          <h2>你好，我是 <span>Takome 阅读助手</span></h2>
        </div>

        <button
          v-if="!isAuthenticated"
          class="assistant-login-button"
          type="button"
          @click="openLogin"
          @pointerenter="moveLoginGlow"
          @pointermove="moveLoginGlow"
        >
          <span class="assistant-login-button-bg" aria-hidden="true"></span>
          <span class="assistant-login-button-label">登录后使用</span>
        </button>

        <section class="assistant-carousel" aria-label="快捷提示词">
          <div ref="carouselViewport" class="assistant-carousel-viewport">
            <div
              ref="cardTrack"
              class="assistant-card-track"
              :class="{ 'assistant-card-track-resetting': isCarouselResetting }"
              :style="carouselTrackStyle"
              @transitionend="finishCarouselTransition"
            >
              <button
                v-for="(card, index) in carouselCards"
                :key="`${card.title}-${index}`"
                class="assistant-card"
                type="button"
                :style="carouselCardStyle"
                @click="submitCardPrompt(card)"
              >
                <span class="assistant-card-panel">
                  <span class="assistant-card-head">
                    <strong>{{ card.title }}</strong>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" />
                    </svg>
                  </span>
                  <span class="assistant-card-desc">{{ card.description }}</span>
                </span>
              </button>
            </div>
          </div>

          <div class="assistant-carousel-actions">
            <button class="assistant-round-button" type="button" aria-label="上一组" @click="scrollCards(-1)">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" />
              </svg>
            </button>
            <button class="assistant-round-button" type="button" aria-label="下一组" @click="scrollCards(1)">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" />
              </svg>
            </button>
          </div>
        </section>
      </section>

      <section ref="messages" class="assistant-messages" aria-live="polite">
        <article
          v-for="message in messages"
          :key="message.id"
          class="assistant-message"
          :class="[`assistant-message-${message.role}`, { 'assistant-message-pending': message.pending }]"
        >
          <div class="assistant-message-bubble">
            <template v-if="message.kind === 'loginRequired'">
              <span>该功能需要登录后才能使用，请先</span>
              <button class="assistant-inline-login" type="button" @click="openLoginFromReminder">登录</button>
              <span>。</span>
            </template>
            <template v-else>
              {{ message.content }}
            </template>
          </div>
          <button
            class="assistant-copy-button"
            type="button"
            :aria-label="copiedMessageId === message.id ? '已复制' : '复制消息'"
            :title="copiedMessageId === message.id ? '已复制' : '复制消息'"
            @click="copyMessage(message)"
          >
            <svg v-if="copiedMessageId === message.id" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M8 8V5.8C8 4.8 8.8 4 9.8 4h8.4C19.2 4 20 4.8 20 5.8v8.4c0 1-.8 1.8-1.8 1.8H16M5.8 8h8.4c1 0 1.8.8 1.8 1.8v8.4c0 1-.8 1.8-1.8 1.8H5.8C4.8 20 4 19.2 4 18.2V9.8C4 8.8 4.8 8 5.8 8Z"
                fill="none"
                stroke="currentColor"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </button>
        </article>
      </section>
    </main>

    <form class="assistant-input-row" @submit.prevent="submitDraft">
      <div class="assistant-input-shell">
        <div class="assistant-input-box">
          <div class="assistant-input-editor">
            <div v-if="!draft" class="assistant-placeholder">输入书名、作者，或直接对我说…… (Shift + Enter 换行)</div>
            <textarea
              ref="input"
              v-model="draft"
              class="assistant-input"
              rows="1"
              @input="syncInputHeight"
              @keydown.enter.exact.prevent="submitDraft"
            ></textarea>
          </div>
          <div class="assistant-input-actions">
            <button class="assistant-send-button" type="submit" aria-label="发送消息" :disabled="!draft.trim()">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 19V5m0 0-6 6m6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" />
              </svg>
            </button>
          </div>
        </div>
        <p class="assistant-ai-note">本回答由 AI 生成，内容仅供参考，请仔细甄别。</p>
      </div>
    </form>
  </section>
</template>

<style scoped>
.reading-assistant {
  --assistant-surface: #ffffff;
  --assistant-panel: #f8faf7;
  --assistant-panel-muted: #eef3ec;
  --assistant-ink: #18201a;
  --assistant-muted: #57635b;
  --assistant-soft: #7a847a;
  --assistant-line: rgba(104, 119, 103, 0.18);
  --assistant-line-strong: rgba(104, 119, 103, 0.28);
  --assistant-accent: var(--color-primary);
  --assistant-accent-hover: #07833a;
  --assistant-accent-soft: rgba(52, 168, 83, 0.12);
  --assistant-focus: rgba(52, 168, 83, 0.22);
  position: fixed;
  top: 72px;
  right: 0;
  z-index: 70;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: min(460px, calc(100vw - 24px));
  height: calc(100vh - 72px);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 247, 0.96)),
    var(--assistant-panel);
  box-shadow:
    -1px 0 0 var(--assistant-line),
    -18px 0 42px rgba(27, 28, 28, 0.12);
  color: var(--assistant-ink);
}

.reading-assistant-floating {
  right: auto;
  height: min(680px, calc(100vh - 16px));
  border: 1px solid var(--assistant-line-strong);
  border-radius: 8px;
  box-shadow: 0 10px 14px rgba(27, 28, 28, 0.16);
}

.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 56px;
  padding: 0 16px 0 18px;
  border-bottom: 1px solid var(--assistant-line);
  background: color-mix(in srgb, var(--assistant-surface) 94%, var(--assistant-panel-muted));
  user-select: none;
}

.reading-assistant-floating .assistant-header {
  cursor: grab;
}

.assistant-title {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  color: var(--assistant-ink);
  font-size: 15px;
  font-weight: 800;
}

.assistant-mark {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 6px;
  background: var(--assistant-ink);
  color: var(--assistant-surface);
  font-family: Newsreader, Georgia, 'Times New Roman', serif;
  font-size: 20px;
}

.assistant-menu {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.assistant-icon-button {
  position: relative;
  display: grid;
  height: 34px;
  width: 34px;
  place-items: center;
  padding: 0;
  border-radius: 6px;
  color: var(--assistant-muted);
  font-size: 12px;
  font-weight: 800;
  transition:
    background 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.assistant-icon-button:hover {
  background: var(--assistant-accent-soft);
  color: var(--assistant-accent);
}

.assistant-icon-button:focus-visible,
.assistant-round-button:focus-visible,
.assistant-card:focus-visible,
.assistant-login-button:focus-visible,
.assistant-hero-icon-button:focus-visible,
.assistant-send-button:focus-visible,
.assistant-copy-button:focus-visible,
.assistant-inline-login:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 2px var(--assistant-focus);
}

.assistant-icon-button svg {
  width: 18px;
  height: 18px;
}

.assistant-icon-button::after {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 2;
  width: max-content;
  max-width: 88px;
  border: 1px solid rgba(27, 28, 28, 0.08);
  border-radius: 5px;
  padding: 5px 7px;
  background: rgba(27, 28, 28, 0.92);
  color: #fff;
  content: attr(data-tooltip);
  font-size: 12px;
  line-height: 1;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-3px);
  transition:
    opacity 140ms ease,
    transform 140ms ease;
  white-space: nowrap;
}

.assistant-icon-button:hover::after,
.assistant-icon-button:focus-visible::after {
  opacity: 0;
  transform: translateY(0);
}

.assistant-icon-button:hover::after {
  opacity: 1;
}

.assistant-body {
  min-height: 0;
  overflow: hidden;
  padding: 22px 18px 12px;
}

.assistant-body-chatting {
  padding-top: 12px;
}

.assistant-intro {
  display: grid;
  gap: 18px;
}

.assistant-hero {
  display: grid;
  gap: 10px;
  padding: 18px 2px 4px;
}

.assistant-hero-icon-button {
  position: relative;
  isolation: isolate;
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  overflow: visible;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  transition:
    transform 180ms ease;
}

.assistant-hero-icon-button:hover {
  transform: translateY(-2px);
}

.assistant-hero-icon-button:active,
.assistant-hero-icon-button-tapping {
  transform: scale(0.92);
}

.assistant-hero-icon-button::before {
  position: absolute;
  inset: 5px;
  z-index: 0;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 122, 78, 0.2), transparent 42%),
    conic-gradient(
      from 18deg,
      transparent 0 12deg,
      rgba(255, 122, 78, 0.56) 12deg 18deg,
      transparent 18deg 86deg,
      rgba(255, 122, 78, 0.48) 86deg 93deg,
      transparent 93deg 178deg,
      rgba(255, 184, 118, 0.58) 178deg 184deg,
      transparent 184deg 278deg,
      rgba(255, 122, 78, 0.44) 278deg 285deg,
      transparent 285deg 360deg
    );
  content: '';
  opacity: 0;
  transform: scale(0.46) rotate(-8deg);
  pointer-events: none;
}

.assistant-hero-icon-button-tapping::before {
  animation: assistant-hero-hit-burst 360ms ease-out;
}

.assistant-hero-icon-pulse {
  position: absolute;
  inset: 6px;
  z-index: 1;
  border: 2px solid rgba(255, 122, 78, 0.58);
  border-radius: 999px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.74) inset,
    0 0 18px rgba(255, 122, 78, 0.22);
  opacity: 0;
  pointer-events: none;
}

.assistant-hero-icon-button-tapping .assistant-hero-icon-pulse {
  animation: assistant-hero-icon-pulse 360ms ease-out;
}

.assistant-hero-icon {
  width: 62px;
  height: 62px;
  object-fit: contain;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 8px 12px rgba(158, 70, 36, 0.14));
  pointer-events: none;
  transition:
    filter 180ms ease,
    transform 180ms ease;
}

.assistant-hero-icon-button:hover .assistant-hero-icon {
  filter:
    drop-shadow(0 10px 14px rgba(158, 70, 36, 0.16))
    drop-shadow(0 0 10px rgba(255, 122, 78, 0.1));
  transform: translateY(-2px);
}

.assistant-hero-icon-button-tapping .assistant-hero-icon {
  animation: assistant-hero-icon-hit 360ms cubic-bezier(0.2, 0.9, 0.2, 1);
}

.assistant-hero-icon-count {
  position: absolute;
  top: -3px;
  right: 0;
  z-index: 3;
  display: grid;
  min-width: 26px;
  height: 22px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 999px;
  padding: 0 7px;
  background: linear-gradient(135deg, #3a241a, #d55e32);
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
  box-shadow:
    0 6px 10px rgba(24, 32, 26, 0.18),
    0 0 0 3px rgba(255, 255, 255, 0.72);
  animation: assistant-hero-count-pop 180ms ease-out;
  pointer-events: none;
}

.assistant-hero h2 {
  margin: 0;
  color: var(--assistant-ink);
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.16;
  text-wrap: balance;
}

.assistant-hero h2 span {
  position: relative;
  display: inline-block;
  margin-left: 3px;
  color: var(--assistant-accent);
  transition:
    color 160ms ease,
    text-shadow 160ms ease;
}

.assistant-hero h2 span::after {
  position: absolute;
  right: 7px;
  bottom: -3px;
  left: 7px;
  height: 2px;
  border-radius: 999px;
  background: var(--assistant-accent);
  content: '';
  opacity: 0;
  transform: scaleX(0.54);
  transform-origin: center;
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.assistant-hero h2 span:hover {
  color: var(--assistant-accent-hover);
  text-shadow: 0 1px 0 rgba(52, 168, 83, 0.1);
}

.assistant-hero h2 span:hover::after {
  opacity: 0.42;
  transform: scaleX(1);
}

.assistant-hero p {
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.7;
}

.assistant-login-button {
  --login-glow-x: -120px;
  --login-glow-y: -120px;
  position: relative;
  display: inline-flex;
  width: 168px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 48px;
  border-radius: 9px;
  background: var(--assistant-accent);
  color: #fff;
  font-size: 15px;
  font-weight: 900;
  box-shadow: 0 6px 12px rgba(0, 110, 44, 0.22);
  transition:
    background 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.assistant-login-button::after {
  position: absolute;
  inset: 1px;
  border-radius: 7px;
  background: radial-gradient(circle at var(--login-glow-x) var(--login-glow-y), rgba(255, 255, 255, 0.5), transparent 36px);
  content: '';
  opacity: 0;
  transition: opacity 120ms ease;
}

.assistant-login-button-bg {
  position: absolute;
  left: var(--login-glow-x);
  top: var(--login-glow-y);
  width: 86px;
  height: 86px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.28), transparent 66%);
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: opacity 120ms ease;
}

.assistant-login-button-label {
  position: relative;
  z-index: 1;
}

.assistant-login-button:hover::after {
  opacity: 1;
}

.assistant-login-button:hover {
  background: var(--assistant-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 8px 14px rgba(0, 110, 44, 0.26);
}

.assistant-login-button:hover .assistant-login-button-bg {
  opacity: 1;
}

.assistant-carousel {
  position: relative;
  display: grid;
  gap: 10px;
  overflow: hidden;
}

.assistant-carousel-viewport {
  position: relative;
  overflow: hidden;
}

.assistant-carousel-viewport::after {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  width: min(72px, 18%);
  background:
    linear-gradient(90deg, rgba(248, 250, 247, 0), rgba(248, 250, 247, 0.72) 58%, rgba(248, 250, 247, 0.98)),
    linear-gradient(90deg, rgba(77, 128, 255, 0), rgba(77, 128, 255, 0.08));
  content: '';
  pointer-events: none;
}

.assistant-card-track {
  display: flex;
  gap: 12px;
  padding: 1px 0;
  transition: transform 560ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.assistant-card-track-resetting {
  transition: none;
}

.assistant-card {
  position: relative;
  display: grid;
  flex: 0 0 196px;
  min-height: 118px;
  align-content: start;
  border: 1px solid var(--assistant-line);
  border-radius: 6px;
  padding: 0;
  background: var(--assistant-surface);
  text-align: left;
}

.assistant-card-panel {
  display: grid;
  min-height: inherit;
  align-content: start;
  gap: 10px;
  border-radius: inherit;
  padding: 16px 15px 14px;
  background: linear-gradient(180deg, var(--assistant-surface), rgba(248, 250, 247, 0.82));
}

.assistant-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.assistant-card strong {
  color: var(--assistant-ink);
  font-size: 16px;
  font-weight: 900;
}

.assistant-card-head svg {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  border-radius: 50%;
  padding: 4px;
  background: var(--assistant-accent-soft);
  color: var(--assistant-accent);
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.assistant-card-desc {
  color: var(--assistant-muted);
  font-size: 12.5px;
  line-height: 1.5;
  text-wrap: pretty;
  transition:
    color 160ms ease,
    transform 160ms ease;
}

.assistant-card:has(.assistant-card-desc:hover, .assistant-card-head svg:hover) .assistant-card-desc {
  color: #354138;
  transform: translateY(-1px);
}

.assistant-card:has(.assistant-card-desc:hover, .assistant-card-head svg:hover) .assistant-card-head svg {
  background: var(--assistant-accent);
  color: #fff;
  transform: translateX(2px);
}

.assistant-carousel-actions {
  display: flex;
  gap: 10px;
}

.assistant-round-button {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid var(--assistant-line-strong);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.74);
  color: var(--assistant-muted);
  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.assistant-round-button:hover {
  border-color: rgba(52, 168, 83, 0.42);
  background: var(--assistant-surface);
  color: var(--assistant-accent);
  transform: translateY(-1px);
}

.assistant-round-button svg {
  width: 18px;
  height: 18px;
}

.assistant-messages {
  display: grid;
  max-height: 100%;
  gap: 14px;
  overflow-y: auto;
  padding: 4px 2px 10px;
  scrollbar-color: rgba(104, 119, 103, 0.38) transparent;
}

.assistant-message {
  position: relative;
  display: grid;
  gap: 5px;
  max-width: 86%;
}

.assistant-message-user {
  justify-self: end;
}

.assistant-message-assistant {
  justify-self: start;
}

.assistant-message-bubble {
  border-radius: 8px;
  padding: 8px;
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}

.assistant-message-user .assistant-message-bubble {
  background: var(--assistant-accent);
  color: #fff;
}

.assistant-message-assistant .assistant-message-bubble {
  border: 1px solid var(--assistant-line);
  background: rgba(255, 255, 255, 0.9);
  color: var(--assistant-ink);
}

.assistant-message-pending .assistant-message-bubble {
  color: var(--assistant-muted);
}

.assistant-inline-login {
  padding: 0 2px;
  border-radius: 4px;
  color: var(--assistant-accent);
  font-weight: 900;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.assistant-copy-button {
  display: grid;
  width: 25px;
  height: 25px;
  justify-self: end;
  place-items: center;
  border-radius: 6px;
  background: rgba(27, 28, 28, 0.06);
  color: var(--assistant-muted);
  opacity: 0;
  transition:
    background 160ms ease,
    color 160ms ease,
    opacity 160ms ease;
  justify-content: center;
}

.assistant-message:hover .assistant-copy-button,
.assistant-copy-button:focus-visible {
  opacity: 1;
}

.assistant-copy-button:hover {
  background: var(--assistant-accent-soft);
  color: var(--assistant-accent);
}

.assistant-copy-button svg {
  width: 15px;
  height: 15px;
}

.assistant-input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  padding: 12px 18px 15px;
  border-top: 1px solid var(--assistant-line);
  background: color-mix(in srgb, var(--assistant-surface) 94%, var(--assistant-panel-muted));
}

.assistant-input-shell {
  display: grid;
  gap: 7px;
}

.assistant-input-box {
  display: grid;
  grid-template-rows: minmax(0, auto) auto;
  min-height: 80px;
  border: 1px solid var(--assistant-line-strong);
  border-radius: 10px;
  padding: 6px 7px;
  background: var(--assistant-surface);
  transition: border-color 160ms ease;
}

.assistant-input-box:focus-within {
  border-color: rgba(52, 168, 83, 0.82);
}

.assistant-input-editor {
  position: relative;
  min-height: 48px;
}

.assistant-placeholder {
  position: absolute;
  top: 7px;
  left: 7px;
  right: 7px;
  color: #69736b;
  font-size: 14px;
  line-height: 1.45;
  pointer-events: none;
}

.assistant-input {
  width: 100%;
  height: 48px;
  min-height: 48px;
  max-height: 126px;
  resize: none;
  overflow-y: auto;
  border: 0;
  padding: 7px;
  background: transparent;
  color: var(--assistant-ink);
  font-size: 14px;
  line-height: 1.45;
  outline: none;
  scrollbar-color: rgba(104, 119, 103, 0.42) transparent;
  scrollbar-width: thin;
}

.assistant-input::-webkit-scrollbar {
  width: 5px;
}

.assistant-input::-webkit-scrollbar-track {
  background: transparent;
}

.assistant-input::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(104, 119, 103, 0.34);
}

.assistant-input::-webkit-scrollbar-thumb:hover {
  background: rgba(104, 119, 103, 0.5);
}

.assistant-ai-note {
  margin: 0;
  padding-right: 4px;
  color: var(--assistant-soft);
  font-size: 11px;
  line-height: 1.2;
  text-align: center;
}

.assistant-send-button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 7px;
  background: var(--assistant-accent);
  color: #fff;
  transition:
    background 160ms ease,
    opacity 160ms ease,
    transform 160ms ease;
}

.assistant-input-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 2px;
}

.assistant-send-button:hover:not(:disabled) {
  background: var(--assistant-accent-hover);
  transform: translateY(-1px);
}

.assistant-send-button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.assistant-send-button svg {
  width: 16px;
  height: 16px;
}

@keyframes assistant-hero-icon-pulse {
  from {
    opacity: 0.72;
    transform: scale(0.68);
  }

  to {
    opacity: 0;
    transform: scale(1.34);
  }
}

@keyframes assistant-hero-hit-burst {
  0% {
    opacity: 0;
    transform: scale(0.38) rotate(-8deg);
  }

  18% {
    opacity: 0.92;
  }

  100% {
    opacity: 0;
    transform: scale(1.18) rotate(24deg);
  }
}

@keyframes assistant-hero-icon-hit {
  0% {
    transform: scale(1) rotate(0deg);
  }

  26% {
    transform: scale(0.86) rotate(-4deg);
  }

  64% {
    transform: scale(1.12) rotate(2deg);
  }

  100% {
    transform: scale(1) rotate(0deg);
  }
}

@keyframes assistant-hero-count-pop {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.92);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 640px) {
  .reading-assistant,
  .reading-assistant-floating {
    top: 0;
    left: 0 !important;
    right: 0;
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }

  .assistant-card {
    flex-basis: 72%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .assistant-card-track,
  .assistant-card,
  .assistant-card-head svg,
  .assistant-hero-icon,
  .assistant-hero-icon-button,
  .assistant-icon-button,
  .assistant-login-button,
  .assistant-round-button,
  .assistant-send-button,
  .assistant-copy-button {
    transition: none;
  }

  .assistant-hero-icon-pulse,
  .assistant-hero-icon-count {
    animation: none;
  }
}
</style>
