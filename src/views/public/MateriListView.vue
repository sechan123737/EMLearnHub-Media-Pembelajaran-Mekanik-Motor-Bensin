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

const modules = computed(() => store.modules)

const filteredMaterials = computed(() => {
  return store.materials.filter(m => {
    const matchSearch = !searchQuery.value || m.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchModule = !activeModule.value || String(m.module_id) === String(activeModule.value)
    return matchSearch && matchModule
  })
})

</script>

<template>
  <div class="min-h-screen" style="background:#f8fafc;">
    <PublicNavbar active="materi" />

    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#0d1526,#0f1f3d);padding:48px 0 40px;">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex items-center gap-2 text-sm mb-4" style="color:#64748b;">
          <span @click="router.push('/')" class="cursor-pointer hover:text-blue-400">Beranda</span>
          <span>›</span>
          <span style="color:#93c5fd;">Materi</span>
        </div>
        <h1 class="font-bold text-white mb-2" style="font-size:2rem;">Topik Materi</h1>
        <p style="color:#94a3b8;">Pilih topik materi yang ingin dipelajari.</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-10">
      <!-- Search + filter -->
      <div class="flex flex-col md:flex-row gap-4 mb-8">
        <div class="relative flex-1">
          <span class="absolute left-3 top-1/2 -translate-y-1/2" style="color:#94a3b8;">🔍</span>
          <input v-model="searchQuery" type="text" placeholder="Cari materi..."
            class="w-full pl-9 pr-4 py-3 rounded-xl text-sm"
            style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;" />
        </div>
      </div>

      <!-- Module pills -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button @click="activeModule = null"
          class="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          :style="!activeModule ? 'background:#2563eb;color:#fff;' : 'background:#fff;border:1px solid #e2e8f0;color:#475569;'">
          ⊞ Semua Topik
        </button>
        <button v-for="mod in modules" :key="mod.id"
          @click="activeModule = mod.id"
          class="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          :style="String(activeModule) === String(mod.id) ? 'background:#2563eb;color:#fff;' : 'background:#fff;border:1px solid #e2e8f0;color:#475569;'">
          {{ mod.name }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div v-for="i in 8" :key="i" class="rounded-2xl animate-pulse" style="background:#e2e8f0;height:280px;"></div>
      </div>

      <!-- Module sections -->
      <template v-else-if="!activeModule">
        <div v-for="(mod, mi) in modules" :key="mod.id" class="mb-12">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style="background:#0d1526;"><img v-if="mod.image_url" :src="mod.image_url" :alt="mod.name" class="w-full h-full object-cover" /><span v-else style="font-size:1.4rem;opacity:0.5;">📷</span></div>
              <div>
                <h2 class="font-bold text-lg" style="color:#0f172a;">{{ mod.name }}</h2>
                <p class="text-xs" style="color:#64748b;">{{ store.getMaterialsByModule(mod.name).length }} Materi</p>
              </div>
            </div>
            <button @click="router.push(`/modul/${mod.id}`)" class="text-sm font-semibold flex items-center gap-1" style="color:#2563eb;">
              Lihat Semua →
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="(mat, idx) in store.getMaterialsByModule(mod.name).slice(0,4)" :key="mat.id"
              @click="router.push(`/materi/${mat.id}`)"
              class="rounded-2xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-md"
              style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
              <div class="h-32 flex items-center justify-center" style="background:linear-gradient(135deg,#1e293b,#334155);"><img v-if="mod.image_url" :src="mod.image_url" :alt="mod.name" class="w-full h-full object-cover" /><span v-else style="font-size:3rem;opacity:0.4;">📷</span></div>
              <div class="p-4">
                <div class="flex items-center gap-1 mb-2">
                  <span class="text-xs px-2 py-0.5 rounded-full font-semibold" style="background:#eff6ff;color:#2563eb;">
                    {{ idx + 1 }}
                  </span>
                </div>
                <h3 class="font-bold text-sm mb-2 group-hover:text-blue-600 transition-colors line-clamp-2" style="color:#0f172a;">{{ mat.title }}</h3>
                <div class="flex items-center gap-2 text-xs" style="color:#94a3b8;">
                  <span v-if="mat.video_url">▶️ Video</span>
                  <span v-if="mat.jobsheet_url">📋 Jobsheet</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="modules.length === 0" class="text-center py-20">
          <span style="font-size:4rem;">📚</span>
          <p class="font-semibold mt-4" style="color:#475569;">Belum ada materi tersedia</p>
        </div>
      </template>

      <!-- Filtered by module -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div v-for="mat in filteredMaterials" :key="mat.id"
          @click="router.push(`/materi/${mat.id}`)"
          class="rounded-2xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-md"
          style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <div class="h-36 flex items-center justify-center" style="background:linear-gradient(135deg,#1e293b,#334155);">
            <img v-if="modules.find(m => String(m.id) === String(mat.module_id))?.image_url":src="modules.find(m => String(m.id) === String(mat.module_id)).image_url"class="w-full h-full object-cover"/>
            <span v-else style="font-size:3rem;opacity:0.4;">📷</span>
          </div>
          <div class="p-4">
            <h3 class="font-bold text-sm mb-2 group-hover:text-blue-600 transition-colors line-clamp-2" style="color:#0f172a;">{{ mat.title }}</h3>
            <div class="flex items-center gap-2 text-xs" style="color:#94a3b8;">
              <span v-if="mat.video_url">▶️ Video</span>
              <span v-if="mat.jobsheet_url">📋 Jobsheet</span>
            </div>
          </div>
        </div>
        <div v-if="filteredMaterials.length === 0" class="col-span-4 text-center py-16" style="color:#94a3b8;">
          <span style="font-size:3rem;">🔍</span>
          <p class="mt-3">Tidak ada materi ditemukan</p>
        </div>
      </div>
    </div>
  </div>
</template>
