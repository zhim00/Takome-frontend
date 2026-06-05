import { toRef, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

const APP_TITLE = 'Takome 书屋'

export function formatDocumentTitle(pageTitle?: string) {
  const normalizedTitle = pageTitle?.trim()

  return normalizedTitle ? `${normalizedTitle} - ${APP_TITLE}` : APP_TITLE
}

export function setDocumentTitle(pageTitle?: string) {
  if (typeof document === 'undefined') {
    return
  }

  document.title = formatDocumentTitle(pageTitle)
}

export function useDocumentTitle(pageTitle: MaybeRefOrGetter<string | undefined>) {
  watch(toRef(pageTitle), setDocumentTitle, { immediate: true })
}
