<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef, watch } from 'vue'

import { useAuth } from '@/composables/useAuth'

type LoginMode = 'password' | 'register'

const isOpen = defineModel<boolean>({ required: true })

const { fetchImgVerifyCode, login, register, isLoggingIn, authError } = useAuth()
const activeMode = shallowRef<LoginMode>('password')
const fallbackNotice = shallowRef('')
const verifyCodeError = shallowRef('')
const isLoadingVerifyCode = shallowRef(false)
const verifyCodeImg = shallowRef('')
const verifyCodeSessionId = shallowRef('')
const form = reactive({
  username: '',
  password: '',
  registerPhone: '',
  registerPassword: '',
  code: '',
})
const errors = reactive({
  username: '',
  password: '',
  registerPhone: '',
  registerPassword: '',
  code: '',
})

const phonePattern = /^1[3-9]\d{9}$/
const isPasswordReady = computed(() => form.username.trim() !== '' && form.password !== '')
const isRegisterReady = computed(
  () =>
    form.registerPhone.trim() !== '' &&
    form.registerPassword !== '' &&
    form.code.trim() !== '' &&
    verifyCodeSessionId.value !== '',
)
const verifyCodeSrc = computed(() => {
  if (!verifyCodeImg.value) {
    return ''
  }

  return verifyCodeImg.value.startsWith('data:')
    ? verifyCodeImg.value
    : `data:image/jpeg;base64,${verifyCodeImg.value}`
})

function clearErrors() {
  errors.username = ''
  errors.password = ''
  errors.registerPhone = ''
  errors.registerPassword = ''
  errors.code = ''
  fallbackNotice.value = ''
  verifyCodeError.value = ''
}

function switchMode(mode: LoginMode) {
  activeMode.value = mode
  clearErrors()

  if (mode === 'register') {
    void refreshVerifyCode()
  }
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

function validateRegister() {
  clearErrors()

  if (!phonePattern.test(form.registerPhone.trim())) {
    errors.registerPhone = '请输入 11 位手机号'
  }

  if (form.registerPassword.length < 6) {
    errors.registerPassword = '密码至少 6 位'
  }

  if (!/^[a-z0-9]{6}$/i.test(form.code.trim())) {
    errors.code = '请输入 6 位图形验证码'
  }

  if (!verifyCodeSessionId.value) {
    verifyCodeError.value = '请先获取图形验证码'
  }

  return (
    errors.registerPhone === '' &&
    errors.registerPassword === '' &&
    errors.code === '' &&
    verifyCodeError.value === ''
  )
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

async function refreshVerifyCode() {
  isLoadingVerifyCode.value = true
  verifyCodeError.value = ''

  try {
    const data = await fetchImgVerifyCode()
    verifyCodeSessionId.value = data.sessionId
    verifyCodeImg.value = data.img
  } catch (error) {
    verifyCodeSessionId.value = ''
    verifyCodeImg.value = ''
    verifyCodeError.value = error instanceof Error ? error.message : '图形验证码加载失败'
  } finally {
    isLoadingVerifyCode.value = false
  }
}

async function submitRegister() {
  if (!isRegisterReady.value || !validateRegister()) {
    return
  }

  try {
    await register({
      username: form.registerPhone.trim(),
      password: form.registerPassword,
      velCode: form.code.trim().toLowerCase(),
      sessionId: verifyCodeSessionId.value,
    })

    isOpen.value = false
  } catch {
    await refreshVerifyCode()
  }
}

watch(isOpen, (open) => {
  if (open && activeMode.value === 'register') {
    void refreshVerifyCode()
  }
})

onMounted(() => {
  if (isOpen.value && activeMode.value === 'register') {
    void refreshVerifyCode()
  }
})
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
          <h2 class="login-title serif">登录/注册</h2>

          <div class="login-tabs" role="tablist" aria-label="登录方式">
            <button
              class="login-tab"
              :class="{ 'login-tab-active': activeMode === 'password' }"
              type="button"
              @click="switchMode('password')"
            >
              登录
            </button>
            <button
              class="login-tab"
              :class="{ 'login-tab-active': activeMode === 'register' }"
              type="button"
              @click="switchMode('register')"
            >
              注册
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

          <form v-else class="login-form" @submit.prevent="submitRegister">
            <label class="field">
              <span>手机号</span>
              <input v-model.trim="form.registerPhone" type="tel" autocomplete="tel-national" />
              <small v-if="errors.registerPhone">{{ errors.registerPhone }}</small>
            </label>
            <label class="field">
              <span>密码</span>
              <input v-model="form.registerPassword" type="password" autocomplete="new-password" />
              <small v-if="errors.registerPassword">{{ errors.registerPassword }}</small>
            </label>
            <label class="field">
              <span>图形验证码</span>
              <div class="verify-row">
                <input v-model.trim="form.code" type="text" maxlength="6" autocomplete="off" />
                <button
                  class="verify-image-button"
                  type="button"
                  :disabled="isLoadingVerifyCode"
                  aria-label="刷新图形验证码"
                  @click="refreshVerifyCode"
                >
                  <img v-if="verifyCodeSrc" :src="verifyCodeSrc" alt="图形验证码" />
                  <span v-else>{{ isLoadingVerifyCode ? '加载中' : '刷新' }}</span>
                </button>
              </div>
              <small v-if="errors.code">{{ errors.code }}</small>
              <small v-if="verifyCodeError">{{ verifyCodeError }}</small>
            </label>
            <button class="btn-primary login-submit" type="submit" :disabled="!isRegisterReady || isLoggingIn">
              {{ isLoggingIn ? '注册中' : '注册' }}
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
  height: 44px;
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

.verify-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 128px;
  gap: 10px;
}

.verify-image-button {
  --verify-img-scale: 1.24;
  --verify-img-x: 12px;
  --verify-img-y: 5px;

  display: grid;
  width: 128px;
  height: 44px;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 4px;
  padding: 0;
  background: var(--color-paper-muted);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 800;
}

.verify-image-button:hover {
  border-color: var(--color-primary);
}

.verify-image-button:disabled {
  cursor: wait;
  opacity: 0.68;
}

.verify-image-button img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: translate(var(--verify-img-x), var(--verify-img-y)) scale(var(--verify-img-scale));
  transform-origin: center;
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
