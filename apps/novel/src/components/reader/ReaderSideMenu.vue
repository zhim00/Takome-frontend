<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, useTemplateRef } from 'vue'

const props = defineProps<{
  fontSize: number
  fontSizes: number[]
  night: boolean
  isSaved: boolean
  bookshelfLoading?: boolean
}>()

const emit = defineEmits<{
  bookshelf: []
  catalog: []
  toggleNight: []
  setFontSize: [fontSize: number]
}>()

const isFontPanelOpen = shallowRef(false)
const isFontThumbHovered = shallowRef(false)
const isDraggingFont = shallowRef(false)
const fontTrackRef = useTemplateRef<HTMLDivElement>('fontTrack')

const activeFontIndex = computed(() => {
  const index = props.fontSizes.indexOf(props.fontSize)
  return index >= 0 ? index : 0
})

const fontProgress = computed(() => {
  const max = Math.max(props.fontSizes.length - 1, 1)
  return `${(activeFontIndex.value / max) * 100}%`
})
const isFontHandleActive = computed(() => isFontThumbHovered.value || isDraggingFont.value)

function toggleFontPanel() {
  isFontPanelOpen.value = !isFontPanelOpen.value
}

function chooseFontSizeByIndex(index: number) {
  const fontSize = props.fontSizes[index]

  if (!fontSize) {
    return
  }

  emit('setFontSize', fontSize)
}

function updateFontSizeFromPointer(clientX: number) {
  const track = fontTrackRef.value

  if (!track) {
    return
  }

  const rect = track.getBoundingClientRect()
  const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
  const index = Math.round(ratio * Math.max(props.fontSizes.length - 1, 0))
  chooseFontSizeByIndex(index)
}

function stopFontDrag() {
  isDraggingFont.value = false
  window.removeEventListener('pointermove', handleFontPointerMove)
  window.removeEventListener('pointerup', stopFontDrag)
  window.removeEventListener('pointercancel', stopFontDrag)
}

function handleFontPointerMove(event: PointerEvent) {
  updateFontSizeFromPointer(event.clientX)
}

function startFontDrag(event: PointerEvent) {
  event.preventDefault()
  isDraggingFont.value = true
  updateFontSizeFromPointer(event.clientX)
  window.addEventListener('pointermove', handleFontPointerMove)
  window.addEventListener('pointerup', stopFontDrag)
  window.addEventListener('pointercancel', stopFontDrag)
}

onBeforeUnmount(() => {
  stopFontDrag()
})
</script>

<template>
  <aside class="reader-side-menu" aria-label="阅读工具">
    <button
      class="side-action"
      type="button"
      :disabled="bookshelfLoading"
      @click="emit('bookshelf')"
    >
      <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5.8c2.8-.7 4.9-.2 7 1.4 2.1-1.6 4.2-2.1 7-1.4v12.3c-2.8-.7-4.9-.2-7 1.4-2.1-1.6-4.2-2.1-7-1.4V5.8Z" />
        <path d="M12 7.2v12.3" />
        <path v-if="isSaved" d="m8.5 12.2 2 2 4.2-4.8" />
        <path v-else d="M16.7 2.8v5.1M14.1 5.35h5.2" />
      </svg>
      <span>加入书架</span>
    </button>

    <button class="side-action" type="button" @click="emit('catalog')">
      <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
      <span>目录</span>
    </button>

    <button class="side-action" type="button" @click="emit('toggleNight')">
      <svg v-if="night" class="side-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.8v2.1M12 19.1v2.1M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
      </svg>
      <svg v-else class="side-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.2 15.5A7.2 7.2 0 0 1 8.5 5.8 7.6 7.6 0 1 0 18.2 15.5Z" />
      </svg>
      <span>{{ night ? '日间' : '夜间' }}</span>
    </button>

    <div class="font-menu">
      <button
        class="side-action"
        type="button"
        :aria-expanded="isFontPanelOpen"
        @click="toggleFontPanel"
      >
        <svg class="side-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 18.5 9.4 5h1.9l5.4 13.5" />
          <path d="M6.2 13.4h8.3" />
          <path d="M18 8h3M19.5 6.5v3" />
        </svg>
        <span>字号</span>
      </button>

      <div v-if="isFontPanelOpen" class="font-popover">
        <span class="font-edge font-edge-small" aria-hidden="true">A</span>

        <div
          ref="fontTrack"
          class="font-track"
          :style="{ '--font-progress': fontProgress }"
          @pointerdown="startFontDrag"
        >
          <div v-if="isFontHandleActive" class="font-hint">{{ fontSize }}</div>
          <button
            v-for="(size, index) in fontSizes"
            :key="size"
            class="font-dot"
            :class="{ 'font-dot-active': size === fontSize }"
            type="button"
            :aria-label="`字号 ${size}`"
            @click="chooseFontSizeByIndex(index)"
          ></button>
          <button
            class="font-thumb"
            type="button"
            :aria-label="`当前字号 ${fontSize}`"
            @pointerdown.stop="startFontDrag"
            @mouseenter="isFontThumbHovered = true"
            @mouseleave="isFontThumbHovered = false"
            @focus="isFontThumbHovered = true"
            @blur="isFontThumbHovered = false"
          ></button>
        </div>

        <span class="font-edge font-edge-large" aria-hidden="true">A</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.reader-side-menu {
  position: fixed;
  top: 260px;
  right: max(18px, calc((100vw - 900px) / 2 - 82px));
  z-index: 30;
  display: grid;
  gap: 14px;
  width: 58px;
}

.side-action {
  display: grid;
  place-items: center;
  width: 58px;
  min-height: 58px;
  border-radius: 8px;
  background: var(--reader-control);
  color: var(--reader-ink);
  font-size: 11px;
  line-height: 1.15;
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.side-action:hover {
  background: var(--reader-control-hover);
  color: var(--reader-accent);
  transform: translateY(-1px);
}

.side-action:disabled {
  cursor: wait;
  opacity: 0.62;
  transform: none;
}

.side-icon {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.font-menu {
  position: relative;
}

.font-popover {
  position: absolute;
  right: 78px;
  bottom: 0;
  display: grid;
  grid-template-columns: 32px 1fr 38px;
  align-items: center;
  width: 284px;
  min-height: 62px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--reader-control);
  box-shadow: 0 20px 46px rgba(27, 28, 28, 0.12);
}

.font-hint {
  position: absolute;
  top: -42px;
  left: var(--font-progress);
  display: grid;
  min-width: 42px;
  min-height: 36px;
  place-items: center;
  border-radius: 4px;
  background: var(--reader-control);
  color: var(--reader-ink);
  font-size: 17px;
  box-shadow: 0 10px 22px rgba(27, 28, 28, 0.12);
  transform: translateX(-50%);
  pointer-events: none;
}

.font-edge {
  color: var(--reader-ink);
  line-height: 1;
}

.font-edge-small {
  font-size: 24px;
}

.font-edge-large {
  font-size: 31px;
}

.font-track {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  padding: 0 14px;
  border-radius: 999px;
  background:
    linear-gradient(
      90deg,
      var(--reader-accent) 0,
      var(--reader-accent) var(--font-progress),
      var(--reader-track) var(--font-progress),
      var(--reader-track) 100%
    );
}

.font-dot {
  position: relative;
  z-index: 1;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--reader-dot);
  pointer-events: auto;
}

.font-thumb {
  position: absolute;
  top: 50%;
  left: var(--font-progress);
  z-index: 3;
  width: 28px;
  height: 28px;
  border: 1px solid var(--reader-line);
  border-radius: 999px;
  background: var(--reader-control);
  box-shadow: 0 8px 20px rgba(27, 28, 28, 0.16);
  cursor: grab;
  transform: translate(-50%, -50%);
}

.font-thumb:active {
  cursor: grabbing;
}

.font-dot-active {
  background: var(--reader-accent);
}

@media (max-width: 980px) {
  .reader-side-menu {
    position: fixed;
    right: 14px;
    bottom: 18px;
    top: auto;
    z-index: 30;
    grid-auto-flow: column;
    width: auto;
    gap: 10px;
  }

  .side-action {
    width: 54px;
    min-height: 54px;
    font-size: 11px;
  }

  .side-icon {
    width: 22px;
    height: 22px;
  }

  .font-popover {
    right: 0;
    bottom: 76px;
    width: min(310px, calc(100vw - 28px));
  }
}

@media (max-width: 560px) {
  .reader-side-menu {
    left: 10px;
    right: 10px;
    justify-content: center;
    gap: 8px;
  }
}
</style>
