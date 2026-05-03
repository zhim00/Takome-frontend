<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'

import logoUrl from '@/assets/takome-logo.svg'

type LoginMode = 'sms' | 'password'

const isOpen = defineModel<boolean>({ required: true })

const activeMode = shallowRef<LoginMode>('sms')
const smsForm = reactive({
  phone: '',
  code: '',
})
const passwordForm = reactive({
  account: '',
  password: '',
})
const errors = reactive({
  smsPhone: '',
  smsCode: '',
  passwordAccount: '',
  password: '',
})

const isSmsReady = computed(() => smsForm.phone.trim() !== '' && smsForm.code.trim() !== '')
const isSmsPhoneFilled = computed(() => smsForm.phone.trim() !== '')
const isPasswordReady = computed(
  () => passwordForm.account.trim() !== '' && passwordForm.password.trim() !== '',
)

const phonePattern = /^1[3-9]\d{9}$/
const codePattern = /^\d{6}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function closeDialog() {
  isOpen.value = false
}

function switchMode(mode: LoginMode) {
  activeMode.value = mode
  clearErrors()
}

function clearErrors() {
  errors.smsPhone = ''
  errors.smsCode = ''
  errors.passwordAccount = ''
  errors.password = ''
}

function validateSmsLogin() {
  clearErrors()

  if (!phonePattern.test(smsForm.phone.trim())) {
    errors.smsPhone = '请输入有效的中国大陆手机号'
  }

  if (!codePattern.test(smsForm.code.trim())) {
    errors.smsCode = '验证码需为 6 位数字'
  }

  return errors.smsPhone === '' && errors.smsCode === ''
}

function validatePasswordLogin() {
  clearErrors()

  const account = passwordForm.account.trim()
  const isPhone = phonePattern.test(account)
  const isEmail = emailPattern.test(account)

  if (!isPhone && !isEmail) {
    errors.passwordAccount = '请输入有效的手机号或邮箱'
  }

  if (passwordForm.password.length < 6 || passwordForm.password.length > 32) {
    errors.password = '密码长度需为 6-32 位'
  }

  return errors.passwordAccount === '' && errors.password === ''
}

function submitSmsLogin() {
  if (!isSmsReady.value || !validateSmsLogin()) {
    return
  }

  console.info('SMS login payload is valid; request is not implemented yet.')
}

function submitPasswordLogin() {
  if (!isPasswordReady.value || !validatePasswordLogin()) {
    return
  }

  console.info('Password login payload is valid; request is not implemented yet.')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="login-dialog">
      <div v-if="isOpen" class="login-dialog-layer">
        <div class="login-dialog-shell">
          <button
            class="login-dialog-close"
            type="button"
            aria-label="关闭登录弹窗"
            @click="closeDialog"
          >
            ×
          </button>

          <section class="login-dialog" role="dialog" aria-modal="true" aria-label="登录">
            <img class="login-dialog-logo" :src="logoUrl" alt="Takome" />

            <div class="login-dialog-tabs" role="tablist" aria-label="登录方式">
              <button
                class="login-dialog-tab"
                :class="{ 'login-dialog-tab-active': activeMode === 'sms' }"
                type="button"
                role="tab"
                :aria-selected="activeMode === 'sms'"
                @click="switchMode('sms')"
              >
                短信登录
              </button>
              <button
                class="login-dialog-tab"
                :class="{ 'login-dialog-tab-active': activeMode === 'password' }"
                type="button"
                role="tab"
                :aria-selected="activeMode === 'password'"
                @click="switchMode('password')"
              >
                密码登录
              </button>
              <span
                class="login-tab-indicator"
                :class="{ 'login-tab-indicator-password': activeMode === 'password' }"
                aria-hidden="true"
              />
            </div>

            <form v-if="activeMode === 'sms'" class="login-form" @submit.prevent="submitSmsLogin">
              <label class="login-field">
                <div class="login-phone-control">
                  <span class="login-country-code">+86</span>
                  <input
                    v-model.trim="smsForm.phone"
                    class="login-control-input"
                    type="tel"
                    inputmode="numeric"
                    autocomplete="tel-national"
                    aria-label="手机号"
                    placeholder="请输入手机号"
                  />
                </div>
                <span v-if="errors.smsPhone" class="login-error">{{ errors.smsPhone }}</span>
              </label>

              <label class="login-field">
                <div class="login-code-control">
                  <input
                    v-model.trim="smsForm.code"
                    class="login-control-input"
                    type="text"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    maxlength="6"
                    aria-label="验证码"
                    placeholder="验证码"
                  />
                  <button class="login-code-button" type="button" :disabled="!isSmsPhoneFilled">
                    获取验证码
                  </button>
                </div>
                <span v-if="errors.smsCode" class="login-error">{{ errors.smsCode }}</span>
              </label>

              <p class="login-tip">未注册的手机号验证通过将自动注册</p>

              <button
                class="login-submit-button"
                :class="{ 'login-submit-button-active': isSmsReady }"
                type="submit"
                :disabled="!isSmsReady"
              >
                登录
              </button>

              <a class="login-help-link" href="#" @click.prevent>遇到问题</a>
            </form>

            <form v-else class="login-form" @submit.prevent="submitPasswordLogin">
              <label class="login-field">
                <div class="login-text-control">
                  <input
                    v-model.trim="passwordForm.account"
                    class="login-control-input"
                    type="text"
                    autocomplete="username"
                    aria-label="手机号或邮箱"
                    placeholder="手机号/邮箱"
                  />
                </div>
                <span v-if="errors.passwordAccount" class="login-error">
                  {{ errors.passwordAccount }}
                </span>
              </label>

              <label class="login-field">
                <div class="login-text-control">
                  <input
                    v-model="passwordForm.password"
                    class="login-control-input"
                    type="password"
                    autocomplete="current-password"
                    aria-label="密码"
                    placeholder="密码"
                  />
                </div>
                <span v-if="errors.password" class="login-error">{{ errors.password }}</span>
              </label>

              <div class="login-link-row">
                <a class="login-help-link" href="#" @click.prevent>忘记密码</a>
                <a class="login-help-link" href="#" @click.prevent>遇到问题</a>
              </div>

              <button
                class="login-submit-button"
                :class="{ 'login-submit-button-active': isPasswordReady }"
                type="submit"
                :disabled="!isPasswordReady"
              >
                登录
              </button>
            </form>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.login-dialog-enter-active,
.login-dialog-leave-active {
  transition: opacity 180ms ease;
}

.login-dialog-enter-from,
.login-dialog-leave-to {
  opacity: 0;
}

.login-dialog-shell {
  --login-dialog-width: 460px;
  --login-dialog-radius: 12px;
  --login-dialog-padding-x: 42px;
  --login-dialog-padding-top: 32px;
  --login-dialog-padding-bottom: 36px;
  --login-form-width: 400px;
  --login-logo-width: 164px;
  --login-logo-offset-x: 12px;
  --login-logo-margin-bottom: 34px;
  --login-close-size: 34px;
  --login-close-top: 0px;
  --login-close-right: -48px;
  --login-tab-gap: 82px;
  --login-tab-width: 82px;
  --login-tab-font-size: 16px;
  --login-tab-indicator-width: 34px;
  --login-field-height: 46px;
  --login-field-radius: 8px;
  --login-input-font-size: 15px;
  --login-button-font-size: 16px;
}

@media (max-width: 680px) {
  .login-dialog-shell {
    --login-dialog-padding-x: 24px;
    --login-close-top: -48px;
    --login-close-right: 4px;
    --login-tab-width: 88px;
    --login-tab-gap: 56px;
  }
}
</style>
