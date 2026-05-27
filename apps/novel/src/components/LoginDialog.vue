<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'

import { useAuth } from '@/composables/useAuth'

type LoginMode = 'password' | 'sms'

const isOpen = defineModel<boolean>({ required: true })

const { login, isLoggingIn, authError } = useAuth()
const activeMode = shallowRef<LoginMode>('password')
const fallbackNotice = shallowRef('')
const form = reactive({
  username: '',
  password: '',
  phone: '',
  code: '',
})
const errors = reactive({
  username: '',
  password: '',
  phone: '',
  code: '',
})

const phonePattern = /^1[3-9]\d{9}$/
const isPasswordReady = computed(() => form.username.trim() !== '' && form.password !== '')
const isSmsReady = computed(() => form.phone.trim() !== '' && form.code.trim() !== '')

function clearErrors() {
  errors.username = ''
  errors.password = ''
  errors.phone = ''
  errors.code = ''
  fallbackNotice.value = ''
}

function switchMode(mode: LoginMode) {
  activeMode.value = mode
  clearErrors()
}

function validatePassword() {
  clearErrors()

  if (!phonePattern.test(form.username.trim())) {
    errors.username = '请输入 11 位手机号'
  }

  if (form.password.length < 6) {
    errors.password = '密码至少 6 位'
  }

  return errors.username === '' && errors.password === ''
}

function validateSms() {
  clearErrors()

  if (!phonePattern.test(form.phone.trim())) {
    errors.phone = '请输入 11 位手机号'
  }

  if (!/^\d{4,6}$/.test(form.code.trim())) {
    errors.code = '请输入 4-6 位验证码'
  }

  return errors.phone === '' && errors.code === ''
}

async function submitPassword() {
  if (!isPasswordReady.value || !validatePassword()) {
    return
  }

  const result = await login({
    username: form.username.trim(),
    password: form.password,
  })

  fallbackNotice.value = result.fallback ? '后端账号不可用，已进入演示登录态。' : ''
  isOpen.value = false
}

async function submitSms() {
  if (!isSmsReady.value || !validateSms()) {
    return
  }

  const result = await login({
    username: form.phone.trim(),
    password: form.code.trim().padEnd(6, '0'),
  })

  fallbackNotice.value = result.fallback ? '短信接口未接入，已进入演示登录态。' : ''
  isOpen.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="isOpen" class="dialog-layer">
        <section class="login-dialog" role="dialog" aria-modal="true" aria-label="登录">
          <button class="dialog-close" type="button" aria-label="关闭" @click="isOpen = false">
            ×
          </button>

          <p class="meta-label">Takome Account</p>
          <h2 class="login-title serif">登录后同步书架与阅读记录</h2>

          <div class="login-tabs" role="tablist" aria-label="登录方式">
            <button
              class="login-tab"
              :class="{ 'login-tab-active': activeMode === 'password' }"
              type="button"
              @click="switchMode('password')"
            >
              密码
            </button>
            <button
              class="login-tab"
              :class="{ 'login-tab-active': activeMode === 'sms' }"
              type="button"
              @click="switchMode('sms')"
            >
              验证码
            </button>
          </div>

          <form v-if="activeMode === 'password'" class="login-form" @submit.prevent="submitPassword">
            <label class="field">
              <span>手机号</span>
              <input v-model.trim="form.username" type="tel" autocomplete="username" />
              <small v-if="errors.username">{{ errors.username }}</small>
            </label>
            <label class="field">
              <span>密码</span>
              <input v-model="form.password" type="password" autocomplete="current-password" />
              <small v-if="errors.password">{{ errors.password }}</small>
            </label>
            <button class="btn-primary login-submit" type="submit" :disabled="!isPasswordReady || isLoggingIn">
              {{ isLoggingIn ? '登录中' : '登录' }}
            </button>
          </form>

          <form v-else class="login-form" @submit.prevent="submitSms">
            <label class="field">
              <span>手机号</span>
              <input v-model.trim="form.phone" type="tel" autocomplete="tel-national" />
              <small v-if="errors.phone">{{ errors.phone }}</small>
            </label>
            <label class="field">
              <span>验证码</span>
              <input v-model.trim="form.code" type="text" maxlength="6" autocomplete="one-time-code" />
              <small v-if="errors.code">{{ errors.code }}</small>
            </label>
            <button class="btn-primary login-submit" type="submit" :disabled="!isSmsReady || isLoggingIn">
              {{ isLoggingIn ? '登录中' : '登录 / 注册' }}
            </button>
          </form>

          <p v-if="fallbackNotice || authError" class="login-notice">
            {{ fallbackNotice || authError }}
          </p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 180ms ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-layer {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(27, 28, 28, 0.34);
  backdrop-filter: blur(6px);
}

.login-dialog {
  position: relative;
  width: min(100%, 440px);
  padding: 32px;
  border-radius: 8px;
  background: var(--color-surface);
  box-shadow: 0 32px 88px rgba(27, 28, 28, 0.22);
}

.dialog-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  color: var(--color-muted);
  font-size: 28px;
  line-height: 1;
}

.login-title {
  margin: 8px 0 22px;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.2;
}

.login-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--color-line);
  border-radius: 6px;
  background: var(--color-paper-muted);
}

.login-tab {
  padding: 8px 18px;
  border-radius: 4px;
  color: var(--color-muted);
  font-weight: 700;
}

.login-tab-active {
  background: var(--color-surface);
  color: var(--color-primary);
}

.login-form {
  display: grid;
  gap: 16px;
  margin-top: 22px;
}

.field {
  display: grid;
  gap: 8px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
}

.field input {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--color-line);
  border-radius: 4px;
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-ink);
  outline: none;
}

.field input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(52, 168, 83, 0.16);
}

.field small,
.login-notice {
  color: #93000a;
}

.login-submit {
  width: 100%;
}

.login-submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.login-notice {
  margin: 16px 0 0;
  font-size: 13px;
  line-height: 1.6;
}
</style>
