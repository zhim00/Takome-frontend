import { computed, readonly, shallowRef } from 'vue'

import {
  createDefaultUserAvatar,
  fetchUserProfile,
  updateUserProfile,
  uploadUserImage,
} from '@/services/novelApi'
import { apiRequest } from '@/services/apiClient'
import {
  AUTH_EXPIRED_EVENT,
  getAuthUser,
  getProfileSignature,
  setAuthUser,
  setProfileSignature,
} from '@/services/storage'
import type { AuthUser, UserProfileInfo, UserSex } from '@/services/types'

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

interface ProfileUpdatePayload {
  nickName: string
  sex: UserSex
  signature: string
}

const currentUser = shallowRef<AuthUser | null>(withStoredAuthDefaults(getAuthUser()))
const authError = shallowRef('')
const isLoggingIn = shallowRef(false)
let hasBootstrappedProfile = false

const nicknameAdjectives = [
  '清澈的', '温柔的', '自在的', '明亮的', '安静的',
  '松弛的', '灵动的', '悠然的', '热烈的', '轻盈的',
  '烂漫的', '慵懒的', '澄澈的', '从容的', '率真的',
  '皎洁的', '温暖的', '清冷的', '璀璨的', '缥缈的',
  '自由的', '勇敢的', '洒脱的', '炽热的', '深邃的',
  '静谧的', '明媚的', '纯粹的', '迷人的', '浪漫的',
]
const nicknameNouns = [
  '书签', '月光', '星河', '纸鹤', '茶盏',
  '云朵', '花火', '海风', '竹影', '灯塔',
  '晚霞', '落叶', '微风', '白雪', '晨曦',
  '流星', '飞鸟', '森林', '清泉', '岛屿',
  '诗篇', '琥珀', '极光', '彩虹', '雪松',
  '山川', '星辰', '烟雨', '风铃', '画卷',
]

function randomItem(items: string[]) {
  return items[Math.floor(Math.random() * items.length)] ?? ''
}

function createRandomNickName() {
  const adjective = randomItem(nicknameAdjectives)
  const noun = randomItem(nicknameNouns)
  const digits = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  const nickName = `${adjective}${noun}${digits}`

  return nickName.slice(0, 10)
}

function withDisplayDefaults(user: AuthUser | null): AuthUser | null {
  if (!user) {
    return null
  }

  const defaultAvatar = createDefaultUserAvatar(user.uid)

  return {
    ...user,
    avatar: user.avatar || defaultAvatar.url,
    avatarPath: user.avatarPath ?? defaultAvatar.path,
    sex: user.sex ?? 'unknown',
    signature: getProfileSignature(user.uid) || user.signature || '',
  }
}

function withStoredAuthDefaults(user: AuthUser | null): AuthUser | null {
  const displayUser = withDisplayDefaults(user)

  if (!displayUser) {
    return null
  }

  return {
    ...displayUser,
    nickName: '',
    signature: getProfileSignature(displayUser.uid),
  }
}

function userFromApi(payload: {
  uid?: string | number
  username: string
  token: string
  nickName?: string
  profile?: UserProfileInfo
}): AuthUser {
  const uid = String(payload.uid ?? payload.username)
  const rawNickName = payload.profile?.nickName || payload.nickName || ''
  const defaultAvatar = createDefaultUserAvatar(uid)

  return {
    uid,
    token: payload.token,
    nickName: rawNickName,
    avatar: payload.profile?.avatar || defaultAvatar.url,
    avatarPath: payload.profile?.avatarPath || defaultAvatar.path,
    sex: payload.profile?.sex ?? 'unknown',
    signature: getProfileSignature(uid),
    source: 'api',
  }
}

function persistUser(user: AuthUser | null) {
  currentUser.value = withDisplayDefaults(user)
  setAuthUser(currentUser.value)
}

function syncUserFromStorage() {
  currentUser.value = withStoredAuthDefaults(getAuthUser())
}

if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_EXPIRED_EVENT, syncUserFromStorage)
}

function mergeProfile(user: AuthUser, profile: UserProfileInfo, username: string): AuthUser {
  return userFromApi({
    uid: user.uid,
    username,
    token: user.token,
    nickName: profile.nickName || user.nickName,
    profile,
  })
}

export function useAuth() {
  const isAuthenticated = computed(() => currentUser.value !== null)

  if (currentUser.value && !hasBootstrappedProfile) {
    hasBootstrappedProfile = true
    void refreshProfile().catch(() => undefined)
  }

  async function refreshProfile(username = currentUser.value?.nickName ?? '') {
    if (!currentUser.value) {
      return null
    }

    const profile = await fetchUserProfile()
    const updated = mergeProfile(currentUser.value, profile, username)
    persistUser(updated)
    return updated
  }

  async function fetchImgVerifyCode() {
    authError.value = ''
    const data = await apiRequest<ImgVerifyCodeResponse>('/api/front/resource/img_verify_code', {
      skipAuth: true,
    })

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
        skipAuth: true,
        skipAuthExpiredHandler: true,
      })

      if (!data?.token) {
        throw new Error('登录响应缺少 token')
      }

      const profile = await fetchUserProfile(data.token).catch(() => undefined)
      const provisionalUser = userFromApi({
        uid: data.uid,
        username: payload.username,
        token: data.token,
        nickName: data.nickName,
        profile,
      })
      persistUser(provisionalUser)

      return { ok: true, user: currentUser.value, fallback: false }
    } catch (error) {
      authError.value = error instanceof Error ? error.message : '登录失败'
      throw error
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
        skipAuth: true,
      })

      if (!data?.token) {
        throw new Error('注册响应缺少 token')
      }

      const nickName = createRandomNickName()
      const user = userFromApi({
        uid: data.uid,
        username: payload.username,
        token: data.token,
        nickName,
      })
      persistUser(user)

      await updateUserProfile({
        userId: user.uid,
        nickName,
      })
      await refreshProfile(payload.username).catch(() => undefined)

      return { ok: true, user: currentUser.value }
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

  async function updateProfile(profile: ProfileUpdatePayload) {
    if (!currentUser.value) {
      return null
    }

    const userId = currentUser.value.uid

    await updateUserProfile({
      userId,
      nickName: profile.nickName,
      sex: profile.sex,
    })

    setProfileSignature(userId, profile.signature)

    const updated = {
      ...currentUser.value,
      nickName: profile.nickName,
      sex: profile.sex,
      signature: profile.signature,
    }

    persistUser(updated)
    return updated
  }

  async function updateAvatar(file: File) {
    if (!currentUser.value) {
      return null
    }

    const avatarPath = await uploadUserImage(file)

    if (!avatarPath) {
      throw new Error('头像上传响应缺少图片地址')
    }

    await updateUserProfile({
      userId: currentUser.value.uid,
      nickName: currentUser.value.nickName,
      avatarPath,
      sex: currentUser.value.sex,
    })

    const profile = await fetchUserProfile().catch(() => undefined)
    const updated = profile
      ? mergeProfile(currentUser.value, profile, currentUser.value.nickName)
      : {
          ...currentUser.value,
          avatarPath,
        }

    persistUser(updated)
    return currentUser.value
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
    refreshProfile,
    updateProfile,
    updateAvatar,
  }
}
