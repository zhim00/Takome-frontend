<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import assistantIcon from '@/assets/ai_assistant.apng'
import logo from '@/assets/logo.png'
import LoginDialog from '@/components/LoginDialog.vue'
import ReadingAssistantPanel from '@/components/ReadingAssistantPanel.vue'
import { useAuth } from '@/composables/useAuth'
import { AUTH_EXPIRED_EVENT } from '@/services/storage'

const route = useRoute()
const router = useRouter()
const { user, isAuthenticated, logout } = useAuth()

const isLoginOpen = shallowRef(false)
const isAssistantOpen = shallowRef(false)
const isUserMenuOpen = shallowRef(false)
const searchKeyword = shallowRef('')
const userMenuRef = useTemplateRef<HTMLElement>('userMenu')

const navItems = [
  { label: '首页', name: 'home' },
  { label: '书库', name: 'library' },
  { label: '书架', name: 'bookshelf' },
  { label: '排行榜', name: 'rankings' },
]
const dockItems = [
  { label: '阅读助手', icon: assistantIcon },
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

function openLoginDialog() {
  isLoginOpen.value = true
}

function syncSearchFromRoute() {
  const keyword = route.query.keyword
  searchKeyword.value = typeof keyword === 'string' ? keyword : ''
}

function submitSearch() {
  const keyword = searchKeyword.value.trim()

  void router.push({
    name: 'library',
    query: keyword ? { keyword } : undefined,
  })
}

function closeUserMenuFromOutside(event: MouseEvent) {
  if (!userMenuRef.value?.contains(event.target as Node)) {
    isUserMenuOpen.value = false
  }
}

async function logoutAndClose() {
  logout()
  isUserMenuOpen.value = false
  await router.replace({ name: 'home' })
  window.location.reload()
}

async function handleAuthExpired() {
  isLoginOpen.value = false
  isUserMenuOpen.value = false

  if (route.name !== 'home') {
    await router.replace({ name: 'home' })
  }
}

async function returnHomeIfSignedOut() {
  if (!isAuthenticated.value && route.meta.requiresAuth) {
    await router.replace({ name: 'home' })
  }
}

watch(
  () => route.query.keyword,
  () => {
    syncSearchFromRoute()
  },
  { immediate: true },
)

watch(
  [isAuthenticated, () => route.meta.requiresAuth],
  () => {
    void returnHomeIfSignedOut()
  },
)

onMounted(() => {
  document.addEventListener('click', closeUserMenuFromOutside)
  window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeUserMenuFromOutside)
  window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
})
</script>

<template>
  <div class="app-shell paper-grain" :class="{ 'app-shell-reader': isReader }">
    <header v-if="!isReader" class="site-header">
      <RouterLink class="brand" :to="{ name: 'home' }">
        <img :src="logo" width="38" height="38" alt="logo" />
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
        <form class="site-search" role="search" @submit.prevent="submitSearch">
          <input v-model="searchKeyword" type="search" placeholder="请输入书名或作者名" aria-label="搜索小说" />
          <button class="site-search-button" type="submit" aria-label="搜索">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </button>
        </form>

        <span class="site-action-divider" aria-hidden="true"></span>

        <button v-if="!isAuthenticated" class="btn-secondary" type="button" @click="openLoginDialog">
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
            <RouterLink class="user-menu-item" :to="{ name: 'profile' }" @click="isUserMenuOpen = false">
              个人中心
            </RouterLink>
            <button class="user-menu-item" type="button" @click="logoutAndClose">退出登录</button>
          </div>
        </div>
      </div>
    </header>

    <RouterView @login-required="openLoginDialog" />

    <aside v-if="!isReader" class="assistant-dock" aria-label="浮动工具">
      <button
        v-for="item in dockItems"
        :key="item.label"
        class="assistant-dock-item"
        type="button"
        @click="isAssistantOpen = true"
      >
        <img :src="item.icon" alt="" />
        <span>{{ item.label }}</span>
      </button>
    </aside>

    <ReadingAssistantPanel
      v-if="!isReader && isAssistantOpen"
      :is-authenticated="isAuthenticated"
      @close="isAssistantOpen = false"
      @login-required="openLoginDialog"
    />

    <footer v-if="!isReader" class="site-footer">
      <div class="layout-container site-footer-inner">
        <div class="site-footer-brand">
          <p class="serif">Takome Novel</p>
          <span>© 2026 Takome. 致力于长篇叙事的艺术。</span>
        </div>
        <span class="site-footer-desc">发现、收藏、阅读、评论</span>
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
  grid-template-columns: auto minmax(280px, 1fr) auto;
  gap: 22px;
  align-items: center;
  min-height: 72px;
  padding: 0 clamp(20px, 4vw, 48px);
  border-bottom: 1px solid rgba(110, 122, 109, 0.16);
  background: rgba(251, 249, 248, 0.9);
  backdrop-filter: blur(18px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
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
  justify-content: flex-start;
  gap: 8px;
  margin-left: clamp(8px, 2vw, 32px);
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
  align-items: center;
  justify-content: end;
  gap: 14px;
}

.site-search {
  display: grid;
  grid-template-columns: minmax(150px, 230px) 38px;
  align-items: center;
  border: 1px solid rgba(110, 122, 109, 0.28);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.76);
}

.site-search input {
  width: 100%;
  min-height: 38px;
  border: 0;
  padding: 0 12px;
  background: transparent;
  color: var(--color-ink);
  outline: none;
}

.site-search input::placeholder {
  color: rgba(95, 104, 95, 0.74);
}

.site-search-button {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-left: 1px solid rgba(110, 122, 109, 0.2);
  color: var(--color-primary);
}

.site-search-button svg {
  width: 18px;
  height: 18px;
}

.site-action-divider {
  width: 1px;
  height: 30px;
  background: rgba(110, 122, 109, 0.22);
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
  padding: 0;
  background: var(--color-surface);
  color: var(--color-primary);
  font-weight: 800;
  line-height: 1;
}

.avatar-image {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  border-radius: inherit;
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

.user-menu-item {
  padding: 10px 12px;
  border-radius: 4px;
  color: var(--color-ink);
  font-size: 14px;
  text-align: left;
}

.user-menu-item:hover {
  background: var(--color-paper-muted);
  color: var(--color-primary);
}

.assistant-dock {
  position: fixed;
  top: 64%;
  right: clamp(14px, 2.2vw, 32px);
  z-index: 40;
  display: grid;
  gap: 8px;
  width: 92px;
  padding: 9.5px;
  border: 1px solid rgba(110, 122, 109, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 42px rgba(27, 28, 28, 0.12);
  transform: translateY(-50%);
  backdrop-filter: blur(14px);
}

.assistant-dock-item {
  display: grid;
  gap: 7px;
  justify-items: center;
  align-content: center;
  width: 72px;
  aspect-ratio: 1;
  border-radius: 8px;
  color: var(--color-ink);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.assistant-dock-item:hover {
  background: rgba(52, 168, 83, 0.1);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.assistant-dock-item img {
  width: 32px;
  height: 32px;
  object-fit: contain;
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

.site-footer-brand {
  display: grid;
  gap: 8px;
}

.site-footer p {
  margin: 0;
  color: var(--color-ink);
  font-size: 22px;
}

.site-footer-brand span,
.site-footer-desc {
  line-height: 1.6;
}

@media (max-width: 1040px) {
  .site-header {
    grid-template-columns: 1fr auto;
  }

  .site-nav {
    grid-column: 1 / -1;
    grid-row: 2;
    margin-left: 0;
    overflow-x: auto;
    padding-bottom: 12px;
  }
}

@media (max-width: 720px) {
  .site-actions {
    grid-column: 1 / -1;
    justify-content: stretch;
  }

  .site-search {
    flex: 1;
    grid-template-columns: minmax(0, 1fr) 38px;
  }

  .site-footer-inner {
    display: grid;
  }
}

@media (max-width: 520px) {
  .brand-text small,
  .site-action-divider,
  .site-footer-desc {
    display: none;
  }
}
</style>
