<script setup>
import { onMounted } from 'vue'
import { useStore } from './stores/mainStore'

const store = useStore()

onMounted(async () => {
  // Fetch semua data penting sekaligus (parallel) saat app pertama load
  await Promise.all([
    store.fetchModules(),
    store.fetchMaterials(),
    store.fetchGlobalQuiz(),
  ])
})
</script>

<template>
  <div class="min-h-screen bg-engine-dark font-body">
    <!-- Global loading bar -->
    <div
      v-if="store.loading"
      class="fixed top-0 left-0 w-full h-0.5 bg-primary-500 z-[9999] animate-pulse"
    />
    <router-view />
  </div>
</template>
