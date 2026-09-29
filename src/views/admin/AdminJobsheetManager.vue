<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'

const store  = useStore()
const router = useRouter()
const drawerOpen   = ref(false)
const searchQuery  = ref('')
const filterModule = ref('')
const uploading    = ref(null)
const toast        = ref('')

const filtered = computed(() => store.materials.filter(m => {
  const q = searchQuery.value.toLowerCase()
  return (!q || m.title.toLowerCase().includes(q)) &&
         (!filterModule.value || m.module_name === filterModule.value)
}))

const moduleNames = computed(() => [...new Set(store.materials.map(m => m.module_name).filter(Boolean))])
const hasJobsheet  = computed(() => store.materials.filter(m => m.jobsheet_url).length)
const noJobsheet   = computed(() => store.materials.filter(m => !m.jobsheet_url).length)

async function handleFileUpload(mat, e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.type !== 'application/pdf') { alert('Hanya file PDF yang diizinkan!'); return }
  if (file.size > 10 * 1024 * 1024) { alert('Ukuran file maksimal 10 MB!'); return }
  uploading.value = mat.id
  const url = await store.uploadJobsheet(mat.id, file)
  uploading.value = null
  if (url) showToast('✅ Jobsheet berhasil diunggah!')
  e.target.value = ''
}

async function deleteJobsheet(mat) {
  if (!confirm(`Hapus jobsheet dari "${mat.title}"?`)) return
  await store.deleteJobsheet(mat.id)
  showToast('🗑️ Jobsheet berhasil dihapus')
}

function showToast(msg) { toast.value = msg; setTimeout(() => toast.value = '', 2500) }
function triggerUpload(matId) { document.getElementById(`upload-${matId}`).click() }

onMounted(() => { store.fetchMaterials(); store.fetchModules() })
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen=false" />

    <div class="flex-1 min-w-0" style="margin-left:256px;">
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center justify-between"
        style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div class="flex items-center gap-3">
          <button @click="drawerOpen=true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center" style="background:#0d1526;">☰</button>
          <h1 class="font-bold text-xl" style="color:#0f172a;">Kelola Jobsheet</h1>
        </div>
        <div class="js-header-actions">
          <button @click="router.push('/')" class="px-4 py-2 rounded-xl text-sm font-semibold" style="border:1px solid #e2e8f0;color:#475569;">
            <img src="/logo.png" class="w-5 h-5 inline-block object-contain" alt="" />
            <span class="js-beranda-label"> Beranda</span>
          </button>
          <button @click="router.push('/admin/materi/tambah')" class="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2" style="background:#2563eb;color:#fff;">+ Tambah</button>
        </div>
      </header>

      <Transition name="toast">
        <div v-if="toast" class="fixed top-20 right-6 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg"
          style="background:#0f172a;color:#fff;">{{ toast }}</div>
      </Transition>

      <div class="p-6 lg:p-8">
        <!-- Stats -->
        <div class="js-stats-grid mb-6">
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #fed7aa;">
            <p class="text-2xl font-bold" style="color:#f97316;">{{ store.materials.length }}</p>
            <p class="text-sm" style="color:#64748b;">Total Materi</p>
          </div>
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #bbf7d0;">
            <p class="text-2xl font-bold" style="color:#22c55e;">{{ hasJobsheet }}</p>
            <p class="text-sm" style="color:#64748b;">Ada Jobsheet</p>
          </div>
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #fecaca;">
            <p class="text-2xl font-bold" style="color:#ef4444;">{{ noJobsheet }}</p>
            <p class="text-sm" style="color:#64748b;">Belum Ada</p>
          </div>
        </div>

        <!-- Filters -->
        <div class="js-filter-row mb-6">
          <div class="relative flex-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2" style="color:#94a3b8;">🔍</span>
            <input v-model="searchQuery" type="text" placeholder="Cari materi..."
              class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;" />
          </div>
          <select v-model="filterModule" class="px-4 py-2.5 rounded-xl text-sm js-filter-select"
            style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;">
            <option value="">Semua Modul</option>
            <option v-for="n in moduleNames" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>

        <!-- Tip -->
        <div class="mb-6 p-4 rounded-xl flex items-start gap-3 text-sm"
          style="background:#fff7ed;border:1px solid #fed7aa;">
          <span>💡</span>
          <p style="color:#c2410c;">Upload file PDF jobsheet praktikum untuk setiap materi. Ukuran maksimal 10 MB per file.</p>
        </div>

        <!-- Loading -->
        <div v-if="store.loading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-20 rounded-2xl animate-pulse" style="background:#e2e8f0;"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="filtered.length === 0" class="text-center py-20 rounded-2xl"
          style="background:#fff;border:1px solid #e2e8f0;">
          <span style="font-size:4rem;">📋</span>
          <p class="font-semibold mt-4" style="color:#475569;">Belum ada materi</p>
        </div>

        <!-- List -->
        <div v-else class="space-y-3">
          <div v-for="mat in filtered" :key="mat.id"
            class="rounded-2xl p-5 js-card" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">

            <!-- Desktop layout: semua dalam 1 baris -->
            <div class="js-card-row">
              <!-- Icon -->
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                :style="mat.jobsheet_url ? 'background:#fff7ed;' : 'background:#f1f5f9;'">
                {{ mat.jobsheet_url ? '📋' : '📄' }}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm" style="color:#0f172a;">{{ mat.title }}</p>
                <p class="text-xs" style="color:#64748b;">{{ mat.module_name || 'Tanpa Modul' }}</p>
                <div v-if="mat.jobsheet_url" class="flex items-center gap-2 mt-1">
                  <span class="text-xs" style="color:#94a3b8;">📄 Jobsheet tersedia</span>
                  <a :href="mat.jobsheet_url" target="_blank"
                    class="text-xs font-semibold hover:underline" style="color:#2563eb;">Lihat →</a>
                </div>
                <p v-else class="text-xs mt-1" style="color:#ef4444;">Belum ada jobsheet</p>
              </div>

              <!-- Status badge -->
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold js-badge"
                :style="mat.jobsheet_url ? 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;' : 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;'">
                {{ mat.jobsheet_url ? '✓ Ada' : '✗ Belum' }}
              </span>

              <!-- Actions -->
              <div class="js-actions">
                <input :id="`upload-${mat.id}`" type="file" accept=".pdf" class="hidden"
                  @change="handleFileUpload(mat, $event)" />

                <button @click="triggerUpload(mat.id)"
                  :disabled="uploading === mat.id"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-blue-600"
                  style="background:#2563eb;color:#fff;">
                  <span v-if="uploading === mat.id" class="flex items-center gap-1">
                    <span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Upload...
                  </span>
                  <span v-else>{{ mat.jobsheet_url ? '🔄 Ganti' : '⬆ Upload' }}</span>
                </button>

                <button v-if="mat.jobsheet_url" @click="deleteJobsheet(mat)"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;">🗑️</button>

                <router-link v-if="mat.jobsheet_url" :to="`/materi/${mat.id}`"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;">👁</router-link>

                <router-link :to="`/admin/praktikum/${mat.id}`"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style="background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;">📋 Langkah</router-link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-10px); }

/* =============================================
   LAYOUT CLASSES - desktop default
   ============================================= */

.js-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.js-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.js-filter-row {
  display: flex;
  flex-direction: row;
  gap: 12px;
}
.js-filter-select { min-width: 180px; }

/* Card row: semua dalam 1 baris di desktop */
.js-card-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.js-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

@media (max-width: 1023px) {

  /* Hilangkan margin sidebar */
  .flex-1.min-w-0 {
    margin-left: 0 !important;
    width: 100% !important;
    overflow-x: hidden;
  }

  /* Header */
  header.sticky {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
  .js-beranda-label { display: none; }

  /* Content padding */
  .p-6.lg\:p-8 { padding: 12px !important; }

  /* Stats: tetap 3 kolom, lebih compact */
  .js-stats-grid { gap: 8px; }
  .js-stats-grid .rounded-2xl { padding: 10px !important; }
  .js-stats-grid .text-2xl { font-size: 1.2rem !important; }
  .js-stats-grid .text-sm { font-size: 0.7rem !important; }

  /* Filter: stack vertikal */
  .js-filter-row { flex-direction: column; gap: 8px; }
  .js-filter-select { min-width: unset; width: 100%; }

  /* Card: stack vertikal */
  .js-card { padding: 14px !important; }
  .js-card-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  /* Badge inline dengan icon di mobile */
  .js-badge { align-self: flex-start; }

  /* Actions: full width, wrap */
  .js-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  .js-actions > * {
    flex: 1;
    text-align: center;
    justify-content: center;
    min-width: 0;
  }

  /* Prevent overflow */
  * { box-sizing: border-box; max-width: 100%; }
}
</style>