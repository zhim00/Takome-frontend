<script setup lang="ts">
interface ThumbnailItem {
  id: string
  title: string
  thumbnail: string
}

defineProps<{
  items: ThumbnailItem[]
  activeIndex: number
}>()

const emit = defineEmits<{
  select: [index: number]
}>()
</script>

<template>
  <div class="thumbnail-switcher">
    <button
      v-for="(item, index) in items"
      :key="item.id"
      class="thumbnail-button"
      :class="{ 'thumbnail-button-active': activeIndex === index }"
      type="button"
      :aria-label="`切换到${item.title}`"
      @click="emit('select', index)"
    >
      <img class="thumbnail-image" :src="item.thumbnail" :alt="item.title" />
    </button>
  </div>
</template>
