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

const jobsheetsOnly = computed(() => {
  return store.materials.filter(m => {
    const has = !!m.jobsheet_url
    const matchSearch = !searchQuery.value || m.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchModule = !activeModule.value || String(m.module_id) === String(activeModule.value)
    return has && matchSearch && matchModule
  })
})

const modules = computed(() => store.modules)

function moduleOf(mat) {
  return store.modules.find(m => String(m.id) === String(mat.module_id))
}

const practiceSteps = [
  { icon: '/icons/materi.png', title: 'Baca Tujuan', desc: 'Pahami tujuan praktikum sebelum mulai' },
  { icon: '/icons/jobsheet.png', title: 'Siapkan Alat', desc: 'Persiapkan semua alat dan bahan yang dibutuhkan' },
  { icon: '/icons/pengamatan.png', title: 'Lakukan Pengamatan', desc: 'Ikuti langkah-langkah secara sistematis' },
  { icon: '/icons/materi.png', title: 'Catat Hasil', desc: 'Catat semua hasil pengamatan dengan teliti' },
  { icon: '/icons/analisis.png', title: 'Analisis', desc: 'Buat analisis dan kesimpulan dari hasil praktikum' },
]
</script>

<template>
  <div class="min-h-screen" style="background:#f8fafc;">
    <PublicNavbar active="jobsheet" />

    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#0d1526,#0f1f3d);padding:48px 0 40px;">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex items-center gap-2 text-sm mb-4" style="color:#64748b;">
          <span @click="router.push('/')" class="cursor-pointer hover:text-blue-400">Beranda</span>
          <span>›</span>
          <span style="color:#93c5fd;">Jobsheet</span>
        </div>
        <h1 class="font-bold text-white mb-2" style="font-size:2rem;">Jobsheet Praktikum</h1>
        <p style="color:#94a3b8;">Unduh dan kerjakan jobsheet praktikum untuk melatih keterampilan teknis mekanik motor bensin.</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-10">

      <!-- Practice steps guide -->
      <div class="rounded-2xl p-6 mb-8" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
        <h2 class="font-bold mb-5" style="color:#0f172a;">Cara Mengerjakan Jobsheet</h2>
        <div class="flex flex-wrap lg:flex-nowrap items-center gap-3">
          <template v-for="(step, i) in practiceSteps" :key="step.title">
            <div class="flex-1 min-w-[120px] text-center p-4 rounded-xl" style="background:#f8fafc;border:1px solid #e2e8f0;">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl mx-auto mb-2" style="background:#eff6ff;"><template v-if="step.icon?.startsWith('/')"><img :src="step.icon" class="w-8 h-8 object-contain" alt="" /></template><template v-else>{{ step.icon }}</template></div>
              <p class="font-bold text-xs mb-1" style="color:#0f172a;">{{ step.title }}</p>
              <p class="text-xs" style="color:#64748b;">{{ step.desc }}</p>
            </div>
            <div v-if="i < 4" class="hidden lg:block flex-shrink-0" style="color:#94a3b8;">→</div>
          </template>
        </div>
      </div>

      <!-- Search + filter -->
      <div class="flex flex-col md:flex-row gap-4 mb-6">
        <div class="relative flex-1">
          <span class="absolute left-3 top-1/2 -translate-y-1/2" style="color:#94a3b8;">🔍</span>
          <input v-model="searchQuery" type="text" placeholder="Cari jobsheet..."
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

      <!-- Loading -->
      <div v-if="store.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="i in 6" :key="i" class="rounded-2xl animate-pulse" style="background:#e2e8f0;height:180px;"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="jobsheetsOnly.length === 0" class="text-center py-20 rounded-2xl" style="background:#fff;border:1px solid #e2e8f0;">
        <span style="font-size:4rem;">📋</span>
        <p class="font-semibold mt-4 mb-2" style="color:#475569;">Belum ada jobsheet tersedia</p>
        <p class="text-sm" style="color:#94a3b8;">Jobsheet akan muncul setelah admin mengunggah konten.</p>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="mat in jobsheetsOnly" :key="mat.id"
          class="rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-md"
          style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <div class="flex items-start gap-4 mb-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style="background:#fff7ed;">📋</div>
            <div class="flex-1 min-w-0">
              <div v-if="moduleOf(mat)" class="text-xs font-semibold mb-1" style="color:#f97316;">
                {{ moduleOf(mat)?.name }}
              </div>
              <h3 class="font-bold text-sm line-clamp-2" style="color:#0f172a;">{{ mat.title }}</h3>
            </div>
          </div>

          <div class="flex items-center gap-3 p-3 rounded-xl mb-4" style="background:#fff7ed;border:1px solid #fed7aa;">
            <span>📄</span>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold truncate" style="color:#0f172a;">Jobsheet_{{ mat.title.replace(/\s+/g,'_').slice(0,20) }}.pdf</p>
              <p class="text-xs" style="color:#94a3b8;">PDF • Jobsheet Praktikum</p>
            </div>
          </div>

          <div class="flex gap-2">
            <button @click="router.push(`/materi/${mat.id}`)"
              class="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-blue-700"
              style="background:#2563eb;color:#fff;">
              <img src="/icons/materi.png" class="w-5 h-5 inline-block object-contain" alt="" /> Lihat Materi
            </button>
            <a :href="mat.jobsheet_url" download target="_blank"
              class="flex-1 py-2 rounded-xl text-xs font-semibold text-center transition-all hover:bg-orange-600"
              style="background:#f97316;color:#fff;">
              ⬇ Unduh
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
