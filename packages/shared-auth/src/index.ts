export interface SharedAuthUser {
  uid: string
  token: string
  nickName: string
  avatar?: string
  avatarPath?: string
  sex?: 'unknown' | 'male' | 'female'
  signature?: string
  source: 'api' | 'mock'
}

export const SHARED_AUTH_KEY = 'takome:auth'

export function readSharedAuth() {
  try {
    const raw = localStorage.getItem(SHARED_AUTH_KEY)
    return raw ? (JSON.parse(raw) as SharedAuthUser) : null
  } catch {
    return null
  }
}

export function writeSharedAuth(user: SharedAuthUser | null) {
  if (user) {
    localStorage.setItem(SHARED_AUTH_KEY, JSON.stringify(user))
    return
  }

  localStorage.removeItem(SHARED_AUTH_KEY)
}

export function createDemoAuthUser(account: string, sourceLabel = 'Takome'): SharedAuthUser {
  const suffix = account.slice(-4) || '0000'

  return {
    uid: `demo-${suffix}`,
    token: `demo-token-${suffix}-${Date.now()}`,
    nickName: `读者 ${suffix}`,
    avatar: '',
    sex: 'unknown',
    signature: `从 ${sourceLabel} 进入阅读。`,
    source: 'mock',
  }
}
