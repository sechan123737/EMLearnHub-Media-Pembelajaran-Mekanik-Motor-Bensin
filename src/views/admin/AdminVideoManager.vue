<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'

const store  = useStore()
const router = useRouter()
const drawerOpen  = ref(false)
const searchQuery = ref('')
const filterModule = ref('')
const editingId    = ref(null)
const editUrl      = ref('')
const saving       = ref(false)
const toast        = ref('')

const videosAll = computed(() => store.materials.filter(m => {
  const q = searchQuery.value.toLowerCase()
  const matchSearch = !q || m.title.toLowerCase().includes(q)
  const matchMod    = !filterModule.value || m.module_name === filterModule.value
  return matchSearch && matchMod
}))

const moduleNames = computed(() => [...new Set(store.materials.map(m => m.module_name).filter(Boolean))])

function startEdit(mat) { editingId.value = mat.id; editUrl.value = mat.video_url || '' }
function cancelEdit()   { editingId.value = null; editUrl.value = '' }

async function saveUrl(mat) {
  saving.value = true
  await store.updateMaterial(mat.id, { ...mat, video_url: editUrl.value.trim() })
  saving.value = false
  editingId.value = null
  showToast('✅ URL Video berhasil disimpan!')
}
async function clearUrl(mat) {
  if (!confirm('Hapus URL video dari materi ini?')) return
  await store.updateMaterial(mat.id, { ...mat, video_url: '' })
  showToast('🗑️ Video berhasil dihapus')
}

function showToast(msg) { toast.value = msg; setTimeout(() => toast.value = '', 2500) }

function getYtThumb(url) {
  if (!url) return null
  for (const p of [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&]+)/]) {
    const m = url.match(p); if (m) return `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg`
  }
  return null
}
function getYtEmbed(url) {
  if (!url) return ''
  for (const p of [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/]) {
    const m = url.match(p); if (m) return `https://www.youtube.com/embed/${m[1]}`
  }
  return url
}

const hasVideo = computed(() => store.materials.filter(m => m.video_url).length)
const noVideo  = computed(() => store.materials.filter(m => !m.video_url).length)

onMounted(() => { store.fetchMaterials(); store.fetchModules() })
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen=false" />

    <div class="flex-1 min-w-0" style="margin-left:256px;">
      <!-- Header -->
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center justify-between"
        style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div class="flex items-center gap-3">
          <button @click="drawerOpen=true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center" style="background:#0d1526;">☰</button>
          <h1 class="font-bold text-xl" style="color:#0f172a;">Kelola Video</h1>
        </div>
        <div class="vid-header-actions">
          <button @click="router.push('/')" class="px-4 py-2 rounded-xl text-sm font-semibold" style="border:1px solid #e2e8f0;color:#475569;">
            <img src="/logo.png" class="w-5 h-5 inline-block object-contain" alt="" />
            <span class="vid-beranda-label"> Beranda</span>
          </button>
          <button @click="router.push('/admin/materi/tambah')" class="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2" style="background:#2563eb;color:#fff;">+ Tambah</button>
        </div>
      </header>

      <!-- Toast -->
      <Transition name="toast">
        <div v-if="toast" class="fixed top-20 right-6 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg"
          style="background:#0f172a;color:#fff;">{{ toast }}</div>
      </Transition>

      <div class="p-6 lg:p-8">
        <!-- Stats -->
        <div class="vid-stats-grid mb-6">
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #bfdbfe;">
            <p class="text-2xl font-bold" style="color:#2563eb;">{{ store.materials.length }}</p>
            <p class="text-sm" style="color:#64748b;">Total Materi</p>
          </div>
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #bbf7d0;">
            <p class="text-2xl font-bold" style="color:#22c55e;">{{ hasVideo }}</p>
            <p class="text-sm" style="color:#64748b;">Ada Video</p>
          </div>
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #fecaca;">
            <p class="text-2xl font-bold" style="color:#ef4444;">{{ noVideo }}</p>
            <p class="text-sm" style="color:#64748b;">Belum Ada</p>
          </div>
        </div>

        <!-- Filters -->
        <div class="vid-filter-row mb-6">
          <div class="relative flex-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2" style="color:#94a3b8;">🔍</span>
            <input v-model="searchQuery" type="text" placeholder="Cari materi..."
              class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;" />
          </div>
          <select v-model="filterModule" class="px-4 py-2.5 rounded-xl text-sm vid-filter-select"
            style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;">
            <option value="">Semua Modul</option>
            <option v-for="n in moduleNames" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>

        <!-- Tip -->
        <div class="mb-6 p-4 rounded-xl flex items-start gap-3 text-sm"
          style="background:#eff6ff;border:1px solid #bfdbfe;">
          <span>💡</span>
          <p style="color:#1d4ed8;">Masukkan URL YouTube (contoh: <code>https://youtu.be/xxxxx</code>) untuk setiap materi.</p>
        </div>

        <!-- Loading -->
        <div v-if="store.loading" class="space-y-4">
          <div v-for="i in 5" :key="i" class="h-24 rounded-2xl animate-pulse" style="background:#e2e8f0;"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="videosAll.length === 0" class="text-center py-20 rounded-2xl"
          style="background:#fff;border:1px solid #e2e8f0;">
          <span style="font-size:4rem;">▶️</span>
          <p class="font-semibold mt-4" style="color:#475569;">Belum ada materi</p>
        </div>

        <!-- List -->
        <div v-else class="space-y-3">
          <div v-for="mat in videosAll" :key="mat.id"
            class="rounded-2xl overflow-hidden" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">

            <div class="p-5 vid-card-inner">
              <!-- Thumbnail -->
              <div class="vid-thumb rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                style="background:#1e293b;">
                <img v-if="getYtThumb(mat.video_url)" :src="getYtThumb(mat.video_url)" class="w-full h-full object-cover" />
                <span v-else style="font-size:2rem;color:#475569;">▶️</span>
              </div>

              <div class="flex-1 min-w-0">
                <!-- Title + badge -->
                <div class="vid-title-row mb-1">
                  <div class="min-w-0">
                    <p class="font-bold text-sm" style="color:#0f172a;">{{ mat.title }}</p>
                    <p class="text-xs" style="color:#64748b;">{{ mat.module_name || 'Tanpa Modul' }}</p>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                    :style="mat.video_url ? 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;' : 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;'">
                    {{ mat.video_url ? '✓ Ada' : '✗ Belum' }}
                  </span>
                </div>

                <!-- Edit mode -->
                <div v-if="editingId === mat.id" class="mt-3 vid-edit-row">
                  <input v-model="editUrl" type="url" placeholder="https://youtu.be/..."
                    class="flex-1 px-3 py-2 rounded-xl text-sm"
                    style="border:1px solid #bfdbfe;background:#eff6ff;color:#0f172a;outline:none;" />
                  <div class="vid-edit-btns">
                    <button @click="saveUrl(mat)" :disabled="saving"
                      class="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
                      style="background:#2563eb;color:#fff;">{{ saving ? '...' : '💾 Simpan' }}</button>
                    <button @click="cancelEdit"
                      class="px-4 py-2 rounded-xl text-sm font-semibold"
                      style="border:1px solid #e2e8f0;color:#475569;">Batal</button>
                  </div>
                </div>

                <!-- View mode -->
                <div v-else class="mt-2 vid-view-row">
                  <p class="text-xs truncate flex-1" style="color:#94a3b8;">
                    {{ mat.video_url || 'Belum ada URL video' }}
                  </p>
                  <div class="vid-view-btns">
                    <button @click="startEdit(mat)"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-600"
                      style="background:#2563eb;color:#fff;">✏️ Edit</button>
                    <button v-if="mat.video_url" @click="clearUrl(mat)"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;">🗑️</button>
                    <router-link v-if="mat.video_url" :to="`/materi/${mat.id}`"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;">👁 Preview</router-link>
                  </div>
                </div>
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

.vid-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vid-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.vid-filter-row {
  display: flex;
  flex-direction: row;
  gap: 12px;
}
.vid-filter-select { min-width: 180px; }

/* Card inner layout */
.vid-card-inner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.vid-thumb {
  width: 128px;
  height: 80px;
  flex-shrink: 0;
}

.vid-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.vid-edit-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.vid-edit-btns {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.vid-view-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.vid-view-btns {
  display: flex;
  gap: 6px;
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
  .vid-beranda-label { display: none; }

  /* Content padding */
  .p-6.lg\:p-8 { padding: 12px !important; }

  /* Stats: tetap 3 kolom tapi lebih compact */
  .vid-stats-grid {
    gap: 8px;
  }
  .vid-stats-grid .rounded-2xl {
    padding: 12px !important;
  }
  .vid-stats-grid .text-2xl {
    font-size: 1.25rem !important;
  }
  .vid-stats-grid .text-sm {
    font-size: 0.7rem !important;
  }

  /* Filter: stack vertikal */
  .vid-filter-row { flex-direction: column; gap: 8px; }
  .vid-filter-select { min-width: unset; width: 100%; }

  /* Card: thumbnail lebih kecil */
  .vid-thumb {
    width: 80px;
    height: 56px;
  }

  /* Edit row: stack vertikal */
  .vid-edit-row {
    flex-direction: column;
    align-items: stretch;
  }
  .vid-edit-btns {
    width: 100%;
  }
  .vid-edit-btns button {
    flex: 1;
    justify-content: center;
  }

  /* View row: wrap */
  .vid-view-row {
    flex-wrap: wrap;
    gap: 6px;
  }
  .vid-view-btns {
    flex-shrink: 0;
  }

  /* Card padding */
  .vid-card-inner { padding: 12px !important; gap: 10px; }

  /* Prevent overflow */
  * { box-sizing: border-box; max-width: 100%; }
}
</style>