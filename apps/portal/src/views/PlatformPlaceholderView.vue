<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <main class="platform-placeholder-page">
    <h1 class="platform-placeholder-title">
      {{ title }}
    </h1>
    <p class="platform-placeholder-desc">
      页面建设中
    </p>
  </main>
</template>
