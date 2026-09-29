<script setup>
import { computed, onMounted, ref } from 'vue'
import PublicNavbar from '../../components/PublicNavbar.vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'

const props = defineProps({ moduleId: String })
const store = useStore()
const router = useRouter()
const searchQuery = ref('')

const module = computed(() => store.modules.find(m => String(m.id) === String(props.moduleId)))
const materials = computed(() => {
  if (!module.value) return []
  return store.materials
    .filter(m => String(m.module_id) === String(props.moduleId))
    .sort((a, b) => (a.order_num || 0) - (b.order_num || 0))
})

const allModules = computed(() => store.modules)

onMounted(() => {
  if (store.modules.length === 0) store.fetchModules()
  if (store.materials.length === 0) store.fetchMaterials()
})

const moduleIcons = ['⚙️','🔩','🛢️','📋','💡','🔥','🌡️','🏎️']

function goToFirstMaterial(mod) {
  const mats = store.getMaterialsByModule(mod.name)
  if (mats && mats.length > 0) router.push(`/materi/${mats[0].id}`)
  else router.push(`/modul/${mod.id}`)
}

const navItems = [
  { label: 'Beranda',   icon: '🏠', to: '/' },
  { label: 'Materi',    icon: '/icons/materi.png', to: '/materi', active: true },
  { label: 'Video',     icon: '/icons/video.png', to: '/video' },
  { label: 'Jobsheet',  icon: '/icons/jobsheet.png', to: '/jobsheet' },
  { label: 'Evaluasi',  icon: '/icons/jobsheet.png', to: '/kuis-global' },
  { label: 'Progress',  icon: '📈', to: null },
  { label: 'Pengumuman',icon: '🔔', to: null },
]
</script>

<template>
  <div class="min-h-screen" style="background:#f8fafc;">
    <PublicNavbar active="materi" />
    <div class="flex" style="min-height:calc(100vh - 64px);">

      <!-- SIDEBAR KIRI -->
      <aside class="hidden lg:flex flex-col w-64 flex-shrink-0 sticky top-16 self-start"
        style="height:calc(100vh - 64px);background:#fff;border-right:1px solid #e2e8f0;overflow-y:auto;">
        <div class="p-5 border-b" style="border-color:#e2e8f0;">
          <h2 class="font-bold text-sm mb-4" style="color:#0f172a;">📚 Semua Topik</h2>
          <div class="space-y-1">
            <button v-for="(mod, idx) in allModules" :key="mod.id"
              @click="router.push(`/modul/${mod.id}`)"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm font-medium"
              style="color:#475569;"
              onmouseenter="this.style.background='#f1f5f9'"
              onmouseleave="this.style.background=''">
              <span class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style="background:#eff6ff;color:#2563eb;">{{ idx + 1 }}</span>
              {{ mod.name }}
            </button>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="flex-1 min-w-0 p-6 lg:p-8">
        <!-- Header -->
        <div class="flex items-start justify-between mb-6">
          <div>
            <h1 class="font-bold text-2xl mb-1" style="color:#0f172a;">Topik Materi</h1>
            <p style="color:#64748b;font-size:0.9rem;">Pilih topik materi yang ingin dipelajari. Materi disusun secara sistematis<br/>agar memudahkan pemahaman Anda.</p>
          </div>
          <!-- Search -->
          <div class="relative hidden md:block">
            <input v-model="searchQuery" type="text" placeholder="Cari topik materi..." class="pl-4 pr-10 py-2.5 rounded-xl text-sm" style="background:#fff;border:1px solid #e2e8f0;color:#0f172a;width:240px;outline:none;" />
            <span class="absolute right-3 top-1/2 -translate-y-1/2" style="color:#94a3b8;">🔍</span>
          </div>
        </div>

        <!-- Category filter pills -->
        <div class="flex flex-wrap gap-2 mb-8">
          <button class="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2" style="background:#2563eb;color:#fff;">
            ⊞ Semua Topik
          </button>
          <button v-for="mod in allModules.slice(0,5)" :key="mod.id"
            @click="router.push(`/modul/${mod.id}`)"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-gray-200"
            style="background:#fff;border:1px solid #e2e8f0;color:#475569;"
          >
            {{ mod.name }}
          </button>
          <button v-if="allModules.length > 5" class="px-4 py-2 rounded-xl text-sm font-semibold" style="background:#fff;border:1px solid #e2e8f0;color:#475569;">
            ··· Lainnya
          </button>
        </div>

        <!-- Loading -->
        <div v-if="store.loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <div v-for="i in 8" :key="i" class="rounded-2xl animate-pulse" style="background:#e2e8f0;height:280px;"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="allModules.length === 0" class="text-center py-20">
          <span style="font-size:4rem;">📚</span>
          <p class="font-semibold mt-4 mb-2" style="color:#475569;">Belum Ada Materi</p>
          <p style="color:#94a3b8;font-size:0.875rem;">Admin belum menambahkan modul pembelajaran.</p>
        </div>

        <!-- Modules grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <div
            v-for="(mod, idx) in allModules"
            :key="mod.id"
            @click="router.push(`/modul/${mod.id}`)"
            class="rounded-2xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-lg"
            style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.06);"
          >
            <!-- Image -->
            <div class="relative h-44 flex items-center justify-center" style="background:linear-gradient(135deg,#1e293b,#334155);">
              <img v-if="mod.image_url" :src="mod.image_url" :alt="mod.name" class="w-full h-full object-cover" />
              <span v-else style="font-size:4rem;opacity:0.4;">📷</span>
              <div class="absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background:rgba(37,99,235,0.85);">
                {{ String(idx+1).padStart(2,'0') }}
              </div>
            </div>
            <!-- Info -->
            <div class="p-4">
              <h3 class="font-bold text-sm mb-1 group-hover:text-blue-600 transition-colors" style="color:#0f172a;">{{ mod.name }}</h3>
              <p class="text-xs mb-4 line-clamp-2" style="color:#64748b;">{{ mod.description || 'Mempelajari konsep dan sistem pada mekanik motor bensin.' }}</p>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 text-xs" style="color:#64748b;">
                  <span><img src="/icons/materi.png" class="w-5 h-5 inline-block object-contain" alt="" /> {{ store.getMaterialsByModule(mod.name).length }} Materi</span>
                  <span>🕐 {{ (store.getMaterialsByModule(mod.name).length * 7) || 0 }} Menit</span>
                </div>
                <button @click.stop="goToFirstMaterial(mod)" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-blue-700" style="background:#2563eb;color:#fff;">
                  Mulai
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom tip -->
        <div v-if="allModules.length > 0" class="mt-8 flex items-center gap-2 p-4 rounded-xl" style="background:#eff6ff;border:1px solid #bfdbfe;">
          <span>💡</span>
          <p class="text-sm" style="color:#1d4ed8;">Ikuti urutan materi secara sistematis untuk hasil belajar yang lebih optimal.</p>
        </div>
      </main>
    </div>
  </div>
</template>
