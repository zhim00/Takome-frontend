<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'

import emailIconUrl from '@/assets/contacts/email.svg'
import githubIconUrl from '@/assets/contacts/github.svg'
import logoUrl from '@/assets/takome-logo.svg'

const contactEmail = 'zhim00@163.com'
const githubUrl = 'https://github.com/zhim00/Takome-backend'
const isContactOpen = shallowRef(false)
const isContactPinned = shallowRef(false)
const contactMenuRef = useTemplateRef<HTMLElement>('contactMenu')

function openContactMenu() {
  isContactOpen.value = true
}

function closeContactMenu() {
  if (!isContactPinned.value) {
    isContactOpen.value = false
  }
}

function toggleContactMenu() {
  isContactPinned.value = !isContactPinned.value
  isContactOpen.value = isContactPinned.value
}

function closeContactMenuFromOutside(event: MouseEvent) {
  if (!contactMenuRef.value?.contains(event.target as Node)) {
    isContactOpen.value = false
    isContactPinned.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeContactMenuFromOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeContactMenuFromOutside)
})
</script>

<template>
  <header class="site-header">
    <a href="/" class="site-logo-link">
      <img class="site-logo" :src="logoUrl" alt="Takome" />
    </a>

    <nav class="site-nav">
      <div
        ref="contactMenu"
        class="site-contact-menu"
        @mouseenter="openContactMenu"
        @mouseleave="closeContactMenu"
      >
        <button
          class="site-nav-link"
          type="button"
          :aria-expanded="isContactOpen"
          aria-controls="site-contact-panel"
          @click.stop="toggleContactMenu"
        >
          联系我们
        </button>

        <div v-if="isContactOpen" id="site-contact-panel" class="site-contact-panel">
          <section class="site-contact-section">
            <p class="site-contact-title">问题反馈</p>

            <div class="site-contact-item">
              <img class="site-contact-icon" :src="emailIconUrl" alt="" aria-hidden="true" />
              <span class="site-contact-value">{{ contactEmail }}</span>
            </div>
          </section>

          <section class="site-contact-section">
            <p class="site-contact-title">项目仓库</p>

            <div class="site-contact-item">
              <img class="site-contact-icon" :src="githubIconUrl" alt="" aria-hidden="true" />
              <a
                class="site-contact-link"
                :href="githubUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                Takome-backend
              </a>
            </div>
          </section>
        </div>
      </div>

      <button class="site-nav-link" type="button">AI助手</button>
      <button class="site-login-button" type="button">登录</button>
    </nav>
  </header>
</template>
