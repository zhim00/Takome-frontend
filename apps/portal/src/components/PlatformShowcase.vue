<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import ThumbnailSwitcher from '@/components/ThumbnailSwitcher.vue'
import { defaultPlatform, platforms } from '@/data/platforms'
import type { PlatformItem } from '@/types/platform'

const router = useRouter()
const activeIndex = shallowRef(0)
const activePlatform = computed<PlatformItem>(() => platforms[activeIndex.value] ?? defaultPlatform)
const enterDisabled = computed(() => activePlatform.value.disabled || !activePlatform.value.entryRoute)

function enterPlatform(platform: PlatformItem) {
  if (platform.disabled || !platform.entryRoute) {
    return
  }

  const route = router.resolve(platform.entryRoute)
  window.open(route.href, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="platform-page">
    <SiteHeader />

    <main class="platform-layout">
      <section class="platform-art-section">
        <div class="platform-art-frame">
          <Transition name="art-slide" mode="out-in">
            <img
              :key="activePlatform.id"
              class="platform-art-image"
              :src="activePlatform.image"
              :alt="activePlatform.title"
            />
          </Transition>
        </div>

        <ThumbnailSwitcher
          class="thumbnail-switcher-offset"
          :items="platforms"
          :active-index="activeIndex"
          @select="activeIndex = $event"
        />
      </section>

      <section class="platform-info-section">
        <Transition name="info-slide" mode="out-in">
          <div :key="activePlatform.id" class="platform-info">
            <p class="platform-subtitle">
              {{ activePlatform.subtitle }}
            </p>
            <h1 class="platform-title">
              {{ activePlatform.title }}
            </h1>
            <div class="platform-title-rule" />
            <p class="platform-desc">
              {{ activePlatform.desc }}
            </p>
            <div class="platform-socials">
              <span>游戏官网</span>
              <span>微博</span>
              <span>微信公众号</span>
              <span>Bilibili</span>
            </div>
            <button
              class="platform-enter-button group"
              :class="{ 'platform-enter-button-disabled': enterDisabled }"
              type="button"
              :disabled="enterDisabled"
              @click="enterPlatform(activePlatform)"
            >
              <span class="platform-enter-icon">→</span>
              {{ activePlatform.enterButtonLabel }}
            </button>
          </div>
        </Transition>
      </section>
    </main>
  </div>
</template>

<style scoped>
.art-slide-enter-active,
.art-slide-leave-active,
.info-slide-enter-active,
.info-slide-leave-active {
  transition:
    opacity 420ms ease,
    transform 420ms ease;
}

.art-slide-enter-from,
.art-slide-leave-to {
  opacity: 0;
  transform: translateX(-44px);
}

.info-slide-enter-from,
.info-slide-leave-to {
  opacity: 0;
  transform: translateX(44px);
}
</style>
