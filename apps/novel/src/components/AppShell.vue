<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import LoginDialog from '@/components/LoginDialog.vue'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { user, isAuthenticated, logout, updateAvatar } = useAuth()

const isLoginOpen = shallowRef(false)
const isUserMenuOpen = shallowRef(false)
const userMenuRef = useTemplateRef<HTMLElement>('userMenu')

const navItems = [
  { label: '首页', name: 'home' },
  { label: '书库', name: 'library' },
  { label: '书架', name: 'bookshelf' },
  { label: '排行榜', name: 'rankings' },
]

const isReader = computed(() => route.name === 'reader')
const avatarLabel = computed(() => user.value?.nickName?.slice(0, 1) || '读')

function isActive(name: string) {
  return route.name === name
}

function handleNavClick(event: MouseEvent, targetName: string) {
  if (targetName !== 'bookshelf') {
    return
  }

  if (!isAuthenticated.value) {
    event.preventDefault()
    isLoginOpen.value = true
  }
}

function closeUserMenuFromOutside(event: MouseEvent) {
  if (!userMenuRef.value?.contains(event.target as Node)) {
    isUserMenuOpen.value = false
  }
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

function logoutAndClose() {
  logout()
  isUserMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', closeUserMenuFromOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeUserMenuFromOutside)
})
</script>

<template>
  <div class="app-shell paper-grain" :class="{ 'app-shell-reader': isReader }">
    <header v-if="!isReader" class="site-header">
      <RouterLink class="brand" :to="{ name: 'home' }">
        <span class="brand-mark serif">T</span>
        <span class="brand-text">
          <strong class="serif">Takome 书屋</strong>
          <small>Digital Paper</small>
        </span>
      </RouterLink>

      <nav class="site-nav" aria-label="小说平台导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          class="site-nav-link"
          :class="{ 'site-nav-link-active': isActive(item.name) }"
          :to="{ name: item.name }"
          @click="handleNavClick($event, item.name)"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="site-actions">
        <button v-if="!isAuthenticated" class="btn-secondary" type="button" @click="isLoginOpen = true">
          登录
        </button>

        <div v-else ref="userMenu" class="user-menu">
          <button
            class="avatar-button"
            type="button"
            aria-label="打开个人菜单"
            @click.stop="isUserMenuOpen = !isUserMenuOpen"
          >
            <img v-if="user?.avatar" class="avatar-image" :src="user.avatar" alt="" />
            <span v-else>{{ avatarLabel }}</span>
          </button>

          <div v-if="isUserMenuOpen" class="user-menu-panel">
            <label class="user-menu-upload">
              上传头像
              <input type="file" accept="image/*" @change="handleAvatarUpload" />
            </label>
            <RouterLink class="user-menu-item" :to="{ name: 'profile' }" @click="isUserMenuOpen = false">
              个人中心
            </RouterLink>
            <button class="user-menu-item" type="button" @click="logoutAndClose">退出登录</button>
          </div>
        </div>
      </div>
    </header>

    <RouterView @login-required="isLoginOpen = true" />

    <footer v-if="!isReader" class="site-footer">
      <div class="layout-container site-footer-inner">
        <p class="serif">Takome Novel</p>
        <span>核心演示流程：发现、收藏、阅读、评论与个人中心。</span>
      </div>
    </footer>

    <LoginDialog v-model="isLoginOpen" />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background-color: var(--color-paper);
}

.app-shell-reader {
  background: var(--color-paper);
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 24px;
  align-items: center;
  min-height: 72px;
  padding: 0 clamp(20px, 4vw, 48px);
  border-bottom: 1px solid rgba(110, 122, 109, 0.16);
  background: rgba(251, 249, 248, 0.86);
  backdrop-filter: blur(18px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 6px;
  background: var(--color-ink);
  color: var(--color-paper);
  font-size: 26px;
  font-weight: 600;
}

.brand-text {
  display: grid;
  gap: 2px;
}

.brand-text strong {
  font-size: 20px;
  font-weight: 600;
}

.brand-text small {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.site-nav {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.site-nav-link {
  padding: 10px 14px;
  border-radius: 4px;
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 700;
  transition:
    color 160ms ease,
    background 160ms ease;
}

.site-nav-link:hover,
.site-nav-link-active {
  background: rgba(52, 168, 83, 0.1);
  color: var(--color-primary);
}

.site-actions {
  display: flex;
  justify-content: end;
}

.user-menu {
  position: relative;
}

.avatar-button {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-primary);
  font-weight: 800;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-menu-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  display: grid;
  min-width: 156px;
  padding: 8px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: var(--color-surface);
  box-shadow: var(--shadow-paper);
}

.user-menu-item,
.user-menu-upload {
  padding: 10px 12px;
  border-radius: 4px;
  color: var(--color-ink);
  font-size: 14px;
  text-align: left;
}

.user-menu-item:hover,
.user-menu-upload:hover {
  background: var(--color-paper-muted);
  color: var(--color-primary);
}

.user-menu-upload input {
  display: none;
}

.site-footer {
  margin-top: 72px;
  border-top: 1px solid var(--color-line);
}

.site-footer-inner {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-top: 28px;
  padding-bottom: 28px;
  color: var(--color-muted);
  font-size: 14px;
}

.site-footer p {
  margin: 0;
  color: var(--color-ink);
  font-size: 22px;
}

@media (max-width: 820px) {
  .site-header {
    grid-template-columns: 1fr auto;
  }

  .site-nav {
    grid-column: 1 / -1;
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 12px;
  }
}

@media (max-width: 520px) {
  .brand-text small {
    display: none;
  }
}
</style>
