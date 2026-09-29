<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'

const store = useStore()
const router = useRouter()
const drawerOpen = ref(false)
const showForm = ref(false)
const editingId = ref(null)
const form = ref({ name: '', description: '', image_url: '', order_num: 0 })
const imagePreview = ref('')
const saving = ref(false)
const uploadError = ref('')
const fileInput = ref(null)

function openAdd() {
  editingId.value = null
  form.value = { name: '', description: '', image_url: '', order_num: store.modules.length + 1 }
  imagePreview.value = ''
  uploadError.value = ''
  showForm.value = true
}

function openEdit(mod) {
  editingId.value = mod.id
  form.value = { name: mod.name, description: mod.description || '', image_url: mod.image_url || '', order_num: mod.order_num || 0 }
  imagePreview.value = mod.image_url || ''
  uploadError.value = ''
  showForm.value = true
}

function onFileChange(e) {
  const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { uploadError.value = 'Hanya file gambar (PNG, JPG, WebP)!'; return }
  uploadError.value = ''
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const maxW = 480
    let w = img.width, h = img.height
    if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
    canvas.width = w; canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    const base64 = canvas.toDataURL('image/jpeg', 0.7)
    imagePreview.value = base64
    form.value.image_url = base64
  }
  img.src = URL.createObjectURL(file)
}

function clearImage() {
  imagePreview.value = ''
  form.value.image_url = ''
  uploadError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function save() {
  if (!form.value.name.trim()) { uploadError.value = 'Nama topik wajib diisi!'; return }
  saving.value = true
  uploadError.value = ''
  try {
    if (editingId.value) await store.updateModule(editingId.value, { ...form.value })
    else await store.addModule({ ...form.value })
    showForm.value = false
  } catch (e) {
    uploadError.value = 'Gagal menyimpan: ' + e.message
  } finally {
    saving.value = false
  }
}

async function deleteModule(mod) {
  if (!confirm(`Hapus modul "${mod.name}"?`)) return
  await store.deleteModule(mod.id)
}

onMounted(() => { store.fetchModules(); store.fetchMaterials() })
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen = false" />
    <div class="flex-1 min-w-0" style="margin-left:256px;">

      <header class="sticky top-0 z-30 px-6 h-16 flex items-center justify-between" style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div class="flex items-center gap-3">
          <button @click="drawerOpen = true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center" style="background:#0d1526;">☰</button>
          <h1 class="font-bold text-xl" style="color:#0f172a;">Kelola Topik Materi</h1>
        </div>
        <div class="mod-header-actions">
          <button @click="router.push('/')" class="px-4 py-2 rounded-xl text-sm font-semibold" style="border:1px solid #e2e8f0;color:#475569;">
            <img src="/logo.png" class="w-5 h-5 inline-block object-contain" alt="" />
            <span class="mod-beranda-label"> Beranda</span>
          </button>
          <button @click="openAdd" class="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700" style="background:#2563eb;color:#fff;">+ Topik</button>
        </div>
      </header>

      <div class="p-6 lg:p-8">

        <!-- Modal -->
        <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.5);">
          <div class="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style="background:#fff;box-shadow:0 20px 60px rgba(0,0,0,0.15);">
            <div class="flex items-center justify-between mb-6">
              <h2 class="font-bold text-xl" style="color:#0f172a;">{{ editingId ? 'Edit Topik' : 'Tambah Topik Baru' }}</h2>
              <button @click="showForm = false" class="w-8 h-8 rounded-xl flex items-center justify-center" style="background:#f1f5f9;color:#64748b;">✕</button>
            </div>

            <div v-if="uploadError" class="mb-4 px-4 py-3 rounded-xl text-sm" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;">⚠️ {{ uploadError }}</div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#374151;">Nama Topik *</label>
                <input v-model="form.name" type="text" placeholder="Contoh: Sistem Bahan Bakar"
                  class="w-full px-4 py-3 rounded-xl text-sm" style="border:1px solid #e2e8f0;color:#0f172a;outline:none;" />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#374151;">Deskripsi</label>
                <textarea v-model="form.description" rows="3" placeholder="Deskripsi singkat topik..."
                  class="w-full px-4 py-3 rounded-xl text-sm resize-none" style="border:1px solid #e2e8f0;color:#0f172a;outline:none;"></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#374151;">Gambar Cover</label>
                <div v-if="imagePreview" class="relative mb-3 rounded-xl overflow-hidden" style="height:160px;background:#0f172a;">
                  <img :src="imagePreview" alt="preview" class="w-full h-full object-cover" />
                  <button @click="clearImage" class="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style="background:rgba(220,38,38,0.9);color:#fff;">✕</button>
                </div>
                <div v-else @click="fileInput.click()" @dragover.prevent @drop.prevent="e => onFileChange(e)"
                  class="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer"
                  style="height:140px;border:2px dashed #cbd5e1;background:#f8fafc;"
                  onmouseenter="this.style.borderColor='#2563eb';this.style.background='#eff6ff'"
                  onmouseleave="this.style.borderColor='#cbd5e1';this.style.background='#f8fafc'">
                  <span style="font-size:2rem;">🖼️</span>
                  <p class="text-sm font-semibold" style="color:#475569;">Klik atau drag gambar ke sini</p>
                  <p class="text-xs" style="color:#94a3b8;">PNG, JPG, WebP — semua ukuran</p>
                </div>
                <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#374151;">Urutan</label>
                <input v-model.number="form.order_num" type="number" min="1"
                  class="w-full px-4 py-3 rounded-xl text-sm" style="border:1px solid #e2e8f0;color:#0f172a;outline:none;" />
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button @click="save" :disabled="saving"
                class="flex-1 py-3 rounded-xl font-semibold text-sm"
                :style="saving ? 'background:#93c5fd;color:#fff;cursor:not-allowed;' : 'background:#2563eb;color:#fff;'">
                {{ saving ? 'Menyimpan...' : (editingId ? '💾 Simpan Perubahan' : '+ Tambah Topik') }}
              </button>
              <button @click="showForm = false" :disabled="saving"
                class="flex-1 py-3 rounded-xl font-semibold text-sm" style="border:1px solid #e2e8f0;color:#475569;">Batal</button>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="store.modules.length === 0 && !store.loading" class="rounded-2xl text-center py-20" style="background:#fff;border:1px solid #e2e8f0;">
          <span style="font-size:4rem;">📦</span>
          <p class="font-semibold mt-4 mb-2" style="color:#475569;">Belum ada topik materi</p>
          <button @click="openAdd" class="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold" style="background:#2563eb;color:#fff;">+ Tambah Topik Pertama</button>
        </div>

        <!-- Grid -->
        <div class="mod-grid">
          <div v-for="(mod, idx) in store.modules" :key="mod.id"
            class="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
            style="background:#fff;border:1px solid #e2e8f0;">
            <div class="relative h-36 flex items-center justify-center" style="background:linear-gradient(135deg,#0f172a,#1e293b);">
              <img v-if="mod.image_url" :src="mod.image_url" :alt="mod.name" class="w-full h-full object-cover" />
              <span v-else style="font-size:3.5rem;opacity:0.4;">📷</span>
              <div class="absolute top-3 left-3 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background:rgba(37,99,235,0.85);">
                {{ String(idx+1).padStart(2,'0') }}
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-bold mb-1" style="color:#0f172a;">{{ mod.name }}</h3>
              <p class="text-xs mb-3 line-clamp-2" style="color:#64748b;">{{ mod.description || 'Belum ada deskripsi.' }}</p>
              <div class="flex items-center justify-between pt-3" style="border-top:1px solid #f1f5f9;">
                <span class="text-xs" style="color:#64748b;">📚 {{ store.getMaterialsByModule(mod.name).length }} materi</span>
                <div class="flex items-center gap-2">
                  <button @click="openEdit(mod)" class="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-600" style="background:#2563eb;color:#fff;">✏️ Edit</button>
                  <button @click="deleteModule(mod)" class="px-3 py-1.5 rounded-lg text-xs font-semibold" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;">🗑️</button>
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
/* =============================================
   LAYOUT CLASSES - desktop default
   ============================================= */

.mod-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Grid: 4 kolom di xl, 3 di lg, 2 di sm */
.mod-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 1279px) {
  .mod-grid { grid-template-columns: repeat(3, 1fr); }
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
  .mod-beranda-label { display: none; }

  /* Content padding */
  .p-6.lg\:p-8 { padding: 12px !important; }

  /* Grid: 2 kolom di mobile */
  .mod-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  /* Card image lebih kecil */
  .mod-grid .h-36 { height: 100px !important; }

  /* Card padding */
  .mod-grid .p-4 { padding: 10px !important; }

  /* Tombol edit & hapus full width */
  .mod-grid .flex.items-center.gap-2 {
    width: 100%;
    margin-top: 6px;
  }
  .mod-grid .flex.items-center.gap-2 > button {
    flex: 1;
    text-align: center;
    justify-content: center;
  }

  /* Prevent overflow */
  * { box-sizing: border-box; max-width: 100%; }
}

@media (max-width: 480px) {
  /* 1 kolom di layar sangat kecil */
  .mod-grid { grid-template-columns: 1fr; }
}
</style>