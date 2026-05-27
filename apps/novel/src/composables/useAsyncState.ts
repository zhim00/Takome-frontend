import { onMounted, readonly, shallowRef } from 'vue'

export function useAsyncState<T>(loader: () => Promise<T>, initialValue: T) {
  const data = shallowRef<T>(initialValue)
  const loading = shallowRef(false)
  const error = shallowRef('')

  async function execute() {
    loading.value = true
    error.value = ''

    try {
      data.value = await loader()
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void execute()
  })

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    execute,
  }
}
