<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'
import { supabase } from '../../lib/supabase'

const props = defineProps({ id: String })
const store  = useStore()
const router = useRouter()
const drawerOpen  = ref(false)
const isEdit      = computed(() => !!props.id)
const form        = ref({ title:'', content:'', video_url:'', ppt_url:'', module_id:'', module_name:'', order_num:1 })
const jobsheetFile    = ref(null)
const jobsheetPreview = ref('')
const removingJobsheet = ref(false)
const saving      = ref(false)
const activeSection = ref('info')
const editorRef = ref(null)

const sections = [
  { key:'info',     label:'Info',     icon: '/icons/materi.png' },
  { key:'content',  label:'Materi',   icon: '/icons/materi.png' },
  { key:'ppt',      label:'PPT',      icon: '/icons/ppt.png' },
  { key:'video',    label:'Video',    icon: '/icons/video.png' },
  { key:'jobsheet', label:'Jobsheet', icon: '/icons/jobsheet.png' },
]

function execCommand(cmd, val=null) { document.execCommand(cmd, false, val); editorRef.value?.focus(); syncContent() }
function insertTable() {
  const html = `<table style="width:100%;border-collapse:collapse;margin:1rem 0;"><thead><tr><th style="background:#eff6ff;color:#1d4ed8;padding:0.5rem 1rem;border:1px solid #bfdbfe;">Kolom 1</th><th style="background:#eff6ff;color:#1d4ed8;padding:0.5rem 1rem;border:1px solid #bfdbfe;">Kolom 2</th></tr></thead><tbody><tr><td style="padding:0.5rem 1rem;border:1px solid #e2e8f0;">Data 1</td><td style="padding:0.5rem 1rem;border:1px solid #e2e8f0;">Data 2</td></tr></tbody></table>`
  document.execCommand('insertHTML', false, html); syncContent()
}
function syncContent() { if (editorRef.value) form.value.content = editorRef.value.innerHTML }
function onModuleChange(e) {
  form.value.module_id = e.target.value
  const mod = store.modules.find(m => String(m.id) === String(e.target.value))
  form.value.module_name = mod ? mod.name : ''
}
function onJobsheetChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.type !== 'application/pdf') { alert('Hanya file PDF yang diizinkan!'); return }
  if (file.size > 10*1024*1024) { alert('Ukuran maksimal 10 MB!'); return }
  jobsheetFile.value = file
}
async function removeJobsheet() {
  if (!confirm('Hapus jobsheet?')) return
  removingJobsheet.value = true
  await store.deleteJobsheet(props.id)
  jobsheetPreview.value = ''
  removingJobsheet.value = false
}
async function save() {
  if (!form.value.title.trim()) { alert('Judul materi wajib diisi!'); return }
  saving.value = true
  try {
    let materialId = props.id
    if (isEdit.value) { const ok = await store.updateMaterial(props.id, form.value); if (!ok) { saving.value = false; return } }
    else { const mat = await store.addMaterial(form.value); if (!mat) { saving.value = false; return }; materialId = mat.id }
    if (jobsheetFile.value && materialId) await store.uploadJobsheet(materialId, jobsheetFile.value)
    router.push('/admin/materi')
  } finally { saving.value = false }
}

watch(activeSection, async (val) => {
  if (val === 'content') {
    await nextTick()
    if (editorRef.value) editorRef.value.innerHTML = form.value.content || ''
  }
})

onMounted(async () => {
  await store.fetchModules()
  await store.fetchMaterials()
  if (isEdit.value) {
    let m = store.getMaterialById(props.id)
    if (!m) {
      const { data } = await supabase.from('materials').select('*').eq('id', props.id).single()
      m = data
    }
    if (m) {
      form.value = {
        title:       m.title       || '',
        content:     m.content     || '',
        video_url:   m.video_url   || '',
        ppt_url:     m.ppt_url     || '',
        module_id:   m.module_id   || '',
        module_name: m.module_name || '',
        order_num:   m.order_num   || 1,
      }
      jobsheetPreview.value = m.jobsheet_url || ''
      await nextTick()
      if (editorRef.value) editorRef.value.innerHTML = form.value.content || ''
    }
  }
})
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen = false" />

    <div class="flex-1 min-w-0" style="margin-left:256px;">
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center justify-between"
        style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div class="flex items-center gap-3 min-w-0">
          <button @click="drawerOpen = true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#f1f5f9;">☰</button>
          <h1 class="font-bold text-xl truncate" style="color:#0f172a;">{{ isEdit ? 'Edit Materi' : 'Tambah Materi Baru' }}</h1>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <button @click="router.push('/admin/materi')" class="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-gray-100"
            style="border:1px solid #e2e8f0;color:#475569;">Batal</button>
          <button @click="save" :disabled="saving"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-blue-700 flex items-center gap-2"
            style="background:#2563eb;color:#fff;">
            <span v-if="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>💾 {{ isEdit ? 'Simpan' : 'Tambah' }}</span>
          </button>
        </div>
      </header>

      <div class="p-6 lg:p-8 max-w-4xl">
        <!-- Section tabs -->
        <div class="form-tabs-wrap mb-6" style="background:#f1f5f9;">
          <button v-for="s in sections" :key="s.key" @click="activeSection = s.key"
            class="form-tab-btn"
            :style="activeSection === s.key ? 'background:#2563eb;color:#fff;' : 'color:#64748b;'">
            <template v-if="s.icon?.startsWith('/')"><img :src="s.icon" class="w-4 h-4 inline-block object-contain align-middle" alt="" /></template>
            <template v-else>{{ s.icon }}</template>
            <span>{{ s.label }}</span>
          </button>
        </div>

        <!-- INFO -->
        <div v-if="activeSection === 'info'" class="rounded-2xl p-6 space-y-4"
          style="background:#fff;border:1px solid #e2e8f0;">
          <h2 class="font-bold text-lg pb-3" style="color:#0f172a;border-bottom:1px solid #f1f5f9;">📚 Informasi Dasar</h2>
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:#374151;">Judul Materi *</label>
            <input v-model="form.title" type="text" placeholder="Contoh: Sistem Bahan Bakar Motor Bensin"
              class="w-full px-4 py-3 rounded-xl text-sm" style="border:1px solid #e2e8f0;color:#0f172a;outline:none;" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:#374151;">Modul / Bab</label>
            <select :value="form.module_id" @change="onModuleChange" class="w-full px-4 py-3 rounded-xl text-sm"
              style="border:1px solid #e2e8f0;color:#0f172a;outline:none;background:#fff;">
              <option value="">— Pilih Modul —</option>
              <option v-for="mod in store.modules" :key="mod.id" :value="mod.id">{{ mod.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:#374151;">Urutan dalam Modul</label>
            <input v-model.number="form.order_num" type="number" min="1" class="w-32 px-4 py-3 rounded-xl text-sm"
              style="border:1px solid #e2e8f0;color:#0f172a;outline:none;" />
          </div>
        </div>

        <!-- CONTENT -->
        <div v-show="activeSection === 'content'" class="rounded-2xl overflow-hidden"
          style="background:#fff;border:1px solid #e2e8f0;">
          <div class="px-5 py-4" style="border-bottom:1px solid #f1f5f9;">
            <h2 class="font-bold text-lg" style="color:#0f172a;">📚 Konten Materi</h2>
          </div>
          <div class="px-4 py-2 flex flex-wrap gap-1" style="border-bottom:1px solid #f1f5f9;background:#f8fafc;">
            <button @click="execCommand('bold')"      class="px-2.5 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200" style="color:#374151;">B</button>
            <button @click="execCommand('italic')"    class="px-2.5 py-1.5 rounded-lg text-sm italic hover:bg-gray-200" style="color:#374151;">I</button>
            <button @click="execCommand('underline')" class="px-2.5 py-1.5 rounded-lg text-sm underline hover:bg-gray-200" style="color:#374151;">U</button>
            <div class="w-px mx-1" style="background:#e2e8f0;"></div>
            <button @click="execCommand('formatBlock','h2')" class="px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200" style="color:#374151;">H2</button>
            <button @click="execCommand('formatBlock','h3')" class="px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200" style="color:#374151;">H3</button>
            <button @click="execCommand('formatBlock','p')"  class="px-2 py-1.5 rounded-lg text-xs hover:bg-gray-200" style="color:#374151;">P</button>
            <div class="w-px mx-1" style="background:#e2e8f0;"></div>
            <button @click="execCommand('insertUnorderedList')" class="px-2.5 py-1.5 rounded-lg text-sm hover:bg-gray-200" style="color:#374151;">•</button>
            <button @click="execCommand('insertOrderedList')"   class="px-2.5 py-1.5 rounded-lg text-sm hover:bg-gray-200" style="color:#374151;">1.</button>
            <div class="w-px mx-1" style="background:#e2e8f0;"></div>
            <button @click="insertTable" class="px-2 py-1.5 rounded-lg text-xs hover:bg-gray-200" style="color:#374151;">⊞ Tabel</button>
          </div>
          <div ref="editorRef" contenteditable="true" @input="syncContent"
            class="min-h-96 p-6 outline-none editor-content"
            style="color:#374151;line-height:1.8;"
            placeholder="Tulis konten materi di sini..."></div>
        </div>

        <!-- PPT -->
        <div v-if="activeSection === 'ppt'" class="rounded-2xl p-6 space-y-4"
          style="background:#fff;border:1px solid #e2e8f0;">
          <h2 class="font-bold text-lg pb-3" style="color:#0f172a;border-bottom:1px solid #f1f5f9;">📊 Slide Presentasi (PPT)</h2>
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:#374151;">URL PPT (Google Slides / Canva)</label>
            <input v-model="form.ppt_url" type="url" placeholder="https://docs.google.com/presentation/d/..."
              class="w-full px-4 py-3 rounded-xl text-sm" style="border:1px solid #e2e8f0;color:#0f172a;outline:none;" />
          </div>
          <div class="p-4 rounded-xl text-sm" style="background:#eff6ff;border:1px solid #bfdbfe;">
            <p class="font-semibold mb-1" style="color:#1d4ed8;">💡 Cara mendapatkan URL embed:</p>
            <ul class="space-y-1 text-xs" style="color:#1e40af;">
              <li>• <strong>Google Slides:</strong> File → Bagikan → Publikasikan ke web → Embed → Salin URL</li>
              <li>• <strong>Canva:</strong> Share → Embed → Salin link</li>
            </ul>
          </div>
          <div v-if="form.ppt_url" class="rounded-xl overflow-hidden border" style="aspect-ratio:16/9;border-color:#e2e8f0;">
            <iframe :src="form.ppt_url" class="w-full h-full" frameborder="0" allowfullscreen />
          </div>
        </div>

        <!-- VIDEO -->
        <div v-if="activeSection === 'video'" class="rounded-2xl p-6 space-y-4"
          style="background:#fff;border:1px solid #e2e8f0;">
          <h2 class="font-bold text-lg pb-3" style="color:#0f172a;border-bottom:1px solid #f1f5f9;">🎬 Video YouTube</h2>
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:#374151;">URL YouTube</label>
            <input v-model="form.video_url" type="url" placeholder="https://www.youtube.com/watch?v=..."
              class="w-full px-4 py-3 rounded-xl text-sm" style="border:1px solid #e2e8f0;color:#0f172a;outline:none;" />
          </div>
          <div v-if="form.video_url" class="rounded-xl overflow-hidden border" style="aspect-ratio:16/9;border-color:#e2e8f0;">
            <iframe :src="form.video_url.replace('watch?v=','embed/').replace('youtu.be/','www.youtube.com/embed/')"
              class="w-full h-full" frameborder="0" allowfullscreen />
          </div>
        </div>

        <!-- JOBSHEET -->
        <div v-if="activeSection === 'jobsheet'" class="rounded-2xl p-6"
          style="background:#fff;border:1px solid #e2e8f0;">
          <h2 class="font-bold text-lg pb-3 mb-4" style="color:#0f172a;border-bottom:1px solid #f1f5f9;">📋 Jobsheet PDF</h2>
          <div v-if="(jobsheetPreview) && !jobsheetFile" class="mb-5">
            <div class="flex items-center justify-between p-4 rounded-xl" style="background:#fff7ed;border:1px solid #fed7aa;">
              <div class="flex items-center gap-3">
                <span class="text-2xl">📋</span>
                <div>
                  <p class="font-semibold text-sm" style="color:#c2410c;">Jobsheet sudah ada</p>
                  <a :href="jobsheetPreview" target="_blank" class="text-xs hover:underline" style="color:#ea580c;">Buka preview ↗</a>
                </div>
              </div>
              <button @click="removeJobsheet" :disabled="removingJobsheet"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;">
                {{ removingJobsheet ? 'Menghapus...' : '🗑️ Hapus' }}
              </button>
            </div>
          </div>
          <label class="block rounded-2xl p-8 text-center cursor-pointer" style="border:2px dashed #e2e8f0;">
            <input type="file" accept=".pdf" @change="onJobsheetChange" class="hidden" />
            <div v-if="!jobsheetFile">
              <p class="text-4xl mb-3">📤</p>
              <p class="font-semibold mb-1" style="color:#475569;">Klik untuk upload PDF</p>
              <p class="text-sm" style="color:#94a3b8;">Maksimal 10MB, format PDF</p>
            </div>
            <div v-else class="flex items-center justify-center gap-3">
              <span class="text-3xl">📋</span>
              <div class="text-left">
                <p class="font-semibold text-sm" style="color:#0f172a;">{{ jobsheetFile.name }}</p>
                <p class="text-xs" style="color:#94a3b8;">{{ (jobsheetFile.size/1024/1024).toFixed(2) }} MB</p>
              </div>
              <button @click.prevent="jobsheetFile = null" class="ml-2 text-red-500 text-xs font-semibold">✕ Batal</button>
            </div>
          </label>
        </div>

        <!-- Bottom save -->
        <div class="mt-5 flex gap-3 justify-end">
          <button @click="router.push('/admin/materi')"
            class="px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-100"
            style="border:1px solid #e2e8f0;color:#475569;">Batal</button>
          <button @click="save" :disabled="saving"
            class="px-8 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 flex items-center gap-2"
            style="background:#2563eb;color:#fff;">
            <span v-if="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>💾 {{ isEdit ? 'Simpan Perubahan' : 'Tambah Materi' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* == EDITOR STYLES (tidak berubah) == */
.editor-content:empty:before { content: attr(placeholder); color: #94a3b8; pointer-events: none; }
.editor-content :deep(h2) { font-size:1.4rem; font-weight:700; color:#0f172a; margin:1.2rem 0 0.6rem; border-bottom:1px solid #e2e8f0; padding-bottom:0.4rem; }
.editor-content :deep(h3) { font-size:1.1rem; font-weight:700; color:#2563eb; margin:1rem 0 0.4rem; }
.editor-content :deep(p)  { margin-bottom:0.75rem; line-height:1.8; }
.editor-content :deep(ul) { list-style:disc;    padding-left:1.5rem; margin-bottom:0.75rem; }
.editor-content :deep(ol) { list-style:decimal; padding-left:1.5rem; margin-bottom:0.75rem; }
.editor-content :deep(strong) { color:#0f172a; font-weight:700; }
.editor-content :deep(table) { width:100%; border-collapse:collapse; margin:1rem 0; }
.editor-content :deep(td), .editor-content :deep(th) { border:1px solid #e2e8f0; padding:0.5rem 1rem; }
.editor-content :deep(th) { background:#eff6ff; color:#1d4ed8; font-weight:600; }


/* Tabs: scroll horizontal di mobile */
.form-tabs-wrap {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.form-tabs-wrap::-webkit-scrollbar { display: none; }

.form-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  flex: 1;
  justify-content: center;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  background: transparent;
}

@media (max-width: 1023px) {
  /* Hilangkan margin sidebar */
  .flex-1.min-w-0 {
    margin-left: 0 !important;
    width: 100% !important;
    overflow-x: hidden;
  }

  /* Header padding */
  header.sticky {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  /* Content padding */
  .p-6.lg\:p-8 {
    padding: 12px !important;
  }

  /* max-w-4xl full di mobile */
  .max-w-4xl {
    max-width: 100% !important;
  }

  /* Tab label — sembunyikan teks, hanya icon di mobile kecil */
  @media (max-width: 400px) {
    .form-tab-btn span { display: none; }
    .form-tab-btn { padding: 8px 10px; flex: none; }
  }

  /* Card padding */
  .rounded-2xl.p-6 {
    padding: 16px !important;
  }

  /* Editor min-height lebih kecil di mobile */
  .min-h-96 {
    min-height: 200px !important;
    padding: 12px !important;
  }

  /* Bottom buttons full width di mobile */
  .mt-5.flex.gap-3.justify-end {
    flex-direction: column !important;
  }
  .mt-5.flex.gap-3.justify-end > button {
    width: 100% !important;
    justify-content: center !important;
  }

  /* Prevent overflow */
  * { box-sizing: border-box; max-width: 100%; }
}
</style>