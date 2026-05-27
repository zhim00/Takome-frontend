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

      const savedProfile = getProfileDraft()
      const user: AuthUser = {
        uid: String(data.uid ?? payload.username),
        token: data.token,
        nickName: data.nickName ?? savedProfile.nickName ?? `读者 ${payload.username.slice(-4)}`,
        avatar: savedProfile.avatar,
        sex: savedProfile.sex,
        signature: savedProfile.signature,
        source: 'api',
      }

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
    login,
    logout,
    updateProfile,
    updateAvatar,
  }
}
