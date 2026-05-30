import { computed, readonly, shallowRef } from 'vue'
import { createDemoAuthUser } from '@takome/shared-auth'

import { apiRequest } from '@/services/apiClient'
import { getAuthUser, getProfileDraft, setAuthUser, setProfileDraft } from '@/services/storage'
import { nowIso } from '@/services/format'
import type { AuthUser } from '@/services/types'

interface LoginPayload {
  username: string
  password: string
}

interface LoginResponse {
  uid?: string | number
  nickName?: string
  token?: string
}

interface RegisterPayload {
  username: string
  password: string
  velCode: string
  sessionId: string
}

interface RegisterResponse {
  uid?: string | number
  token?: string
}

interface ImgVerifyCodeResponse {
  sessionId?: string
  img?: string
}

const currentUser = shallowRef<AuthUser | null>(getAuthUser())
const authError = shallowRef('')
const isLoggingIn = shallowRef(false)

function persistUser(user: AuthUser | null) {
  currentUser.value = user
  setAuthUser(user)
}

function createMockUser(payload: LoginPayload): AuthUser {
  return {
    ...createDemoAuthUser(payload.username, 'Takome 书屋'),
    signature: '用阅读抵达更远的地方。',
  }
}

export function useAuth() {
  const isAuthenticated = computed(() => currentUser.value !== null)

  function createApiUser(payload: {
    uid?: string | number
    username: string
    token: string
    nickName?: string
  }): AuthUser {
    const savedProfile = getProfileDraft()

    return {
      uid: String(payload.uid ?? payload.username),
      token: payload.token,
      nickName: payload.nickName ?? savedProfile.nickName ?? `读者 ${payload.username.slice(-4)}`,
      avatar: savedProfile.avatar,
      sex: savedProfile.sex,
      signature: savedProfile.signature,
      source: 'api',
    }
  }

  async function fetchImgVerifyCode() {
    authError.value = ''
    const data = await apiRequest<ImgVerifyCodeResponse>('/api/front/resource/img_verify_code')

    if (!data?.sessionId || !data.img) {
      throw new Error('图形验证码响应缺少必要字段')
    }

    return {
      sessionId: data.sessionId,
      img: data.img,
    }
  }

  async function login(payload: LoginPayload) {
    isLoggingIn.value = true
    authError.value = ''

    try {
      const data = await apiRequest<LoginResponse>('/api/front/user/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!data?.token) {
        throw new Error('登录响应缺少 token')
      }

      const user = createApiUser({
        uid: data.uid,
        username: payload.username,
        token: data.token,
        nickName: data.nickName,
      })

      persistUser(user)
      return { ok: true, user, fallback: false }
    } catch (error) {
      const user = { ...createMockUser(payload), ...getProfileDraft() }
      persistUser(user)
      authError.value = error instanceof Error ? error.message : '后端登录失败，已启用演示登录'
      return { ok: true, user, fallback: true }
    } finally {
      isLoggingIn.value = false
    }
  }

  async function register(payload: RegisterPayload) {
    isLoggingIn.value = true
    authError.value = ''

    try {
      const data = await apiRequest<RegisterResponse>('/api/front/user/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!data?.token) {
        throw new Error('注册响应缺少 token')
      }

      const user = createApiUser({
        uid: data.uid,
        username: payload.username,
        token: data.token,
      })

      persistUser(user)
      return { ok: true, user }
    } catch (error) {
      authError.value = error instanceof Error ? error.message : '注册失败'
      throw error
    } finally {
      isLoggingIn.value = false
    }
  }

  function logout() {
    persistUser(null)
  }

  function updateProfile(profile: Pick<AuthUser, 'nickName' | 'sex' | 'signature'>) {
    if (!currentUser.value) {
      return
    }

    const updated = {
      ...currentUser.value,
      ...profile,
    }

    setProfileDraft({
      nickName: updated.nickName,
      sex: updated.sex,
      signature: updated.signature,
      avatar: updated.avatar,
    })
    persistUser(updated)
  }

  function updateAvatar(avatar: string) {
    if (!currentUser.value) {
      return
    }

    const updated = {
      ...currentUser.value,
      avatar,
      signature: currentUser.value.signature ?? `头像更新于 ${new Date(nowIso()).toLocaleDateString()}`,
    }

    setProfileDraft({
      nickName: updated.nickName,
      sex: updated.sex,
      signature: updated.signature,
      avatar: updated.avatar,
    })
    persistUser(updated)
  }

  return {
    user: readonly(currentUser),
    isAuthenticated,
    authError: readonly(authError),
    isLoggingIn: readonly(isLoggingIn),
    fetchImgVerifyCode,
    login,
    register,
    logout,
    updateProfile,
    updateAvatar,
  }
}
