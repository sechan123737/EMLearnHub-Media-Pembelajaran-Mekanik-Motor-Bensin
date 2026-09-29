<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import PublicNavbar from '../../components/PublicNavbar.vue'

const store = useStore()
const router = useRouter()
const searchQuery = ref('')
const activeModule = ref(null)

onMounted(() => {
  store.fetchModules()
  store.fetchMaterials()
})

const videosOnly = computed(() => {
  return store.materials.filter(m => {
    const hasVideo = !!m.video_url
    const matchSearch = !searchQuery.value || m.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchModule = !activeModule.value || String(m.module_id) === String(activeModule.value)
    return hasVideo && matchSearch && matchModule
  })
})

const modules = computed(() => store.modules)

function getYoutubeThumbnail(url) {
  if (!url) return null
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&]+)/]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg`
  }
  return null
}

const moduleIcons = ['⚙️','🔩','🛢️','📋','💡','🔥','🌡️','🏎️']
function moduleOf(mat) {
  return store.modules.find(m => String(m.id) === String(mat.module_id))
}
</script>

<template>
  <div class="min-h-screen" style="background:#f8fafc;">
    <PublicNavbar active="video" />

    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#0d1526,#0f1f3d);padding:48px 0 40px;">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex items-center gap-2 text-sm mb-4" style="color:#64748b;">
          <span @click="router.push('/')" class="cursor-pointer hover:text-blue-400">Beranda</span>
          <span>›</span>
          <span style="color:#93c5fd;">Video</span>
        </div>
        <h1 class="font-bold text-white mb-2" style="font-size:2rem;">Video Pembelajaran</h1>
        <p style="color:#94a3b8;">Tonton video penjelasan dan demonstrasi mekanik motor bensin yang mudah dipahami.</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-10">
      <!-- Search -->
      <div class="flex flex-col md:flex-row gap-4 mb-8">
        <div class="relative flex-1">
          <span class="absolute left-3 top-1/2 -translate-y-1/2" style="color:#94a3b8;">🔍</span>
          <input v-model="searchQuery" type="text" placeholder="Cari video..."
            class="w-full pl-9 pr-4 py-3 rounded-xl text-sm"
            style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;" />
        </div>
      </div>

      <!-- Module pills -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button @click="activeModule = null"
          class="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          :style="!activeModule ? 'background:#2563eb;color:#fff;' : 'background:#fff;border:1px solid #e2e8f0;color:#475569;'">
          ⊞ Semua
        </button>
        <button v-for="mod in modules" :key="mod.id"
          @click="activeModule = mod.id"
          class="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          :style="String(activeModule) === String(mod.id) ? 'background:#2563eb;color:#fff;' : 'background:#fff;border:1px solid #e2e8f0;color:#475569;'">
          {{ mod.name }}
        </button>
      </div>

      <!-- Stats -->
      <div class="flex items-center gap-2 mb-6 text-sm" style="color:#64748b;">
        <span><img src="/icons/video.png" class="w-5 h-5 inline-block object-contain" alt="" /></span>
        <span><strong style="color:#0f172a;">{{ videosOnly.length }}</strong> video tersedia</span>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="rounded-2xl animate-pulse" style="background:#e2e8f0;height:240px;"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="videosOnly.length === 0" class="text-center py-20 rounded-2xl" style="background:#fff;border:1px solid #e2e8f0;">
        <span style="font-size:4rem;">▶️</span>
        <p class="font-semibold mt-4 mb-2" style="color:#475569;">Belum ada video tersedia</p>
        <p class="text-sm" style="color:#94a3b8;">Video akan muncul setelah admin mengunggah konten.</p>
      </div>

      <!-- Video grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="mat in videosOnly" :key="mat.id"
          @click="router.push(`/materi/${mat.id}`)"
          class="rounded-2xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-lg"
          style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">

          <!-- Thumbnail -->
          <div class="relative" style="aspect-ratio:16/9;background:#1e293b;overflow:hidden;">
            <img v-if="getYoutubeThumbnail(mat.video_url)"
              :src="getYoutubeThumbnail(mat.video_url)"
              class="w-full h-full object-cover" :alt="mat.title" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span style="font-size:3rem;">▶️</span>
            </div>
            <!-- Play overlay -->
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style="background:rgba(0,0,0,0.4);">
              <div class="w-14 h-14 rounded-full flex items-center justify-center" style="background:#2563eb;">
                <span style="font-size:1.5rem;">▶</span>
              </div>
            </div>
            <!-- Module badge -->
            <div v-if="moduleOf(mat)" class="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-semibold"
              style="background:rgba(37,99,235,0.85);color:#fff;">
              {{ moduleOf(mat)?.name }}
            </div>
          </div>

          <!-- Info -->
          <div class="p-4">
            <h3 class="font-bold text-sm mb-2 group-hover:text-blue-600 transition-colors line-clamp-2" style="color:#0f172a;">
              {{ mat.title }}
            </h3>
            <div class="flex items-center gap-2 text-xs" style="color:#94a3b8;">
              <span><img src="/icons/video.png" class="w-5 h-5 inline-block object-contain" alt="" /> Video</span>
              <span v-if="mat.jobsheet_url">• 📋 Jobsheet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
