<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'

const props = defineProps({ materialId: String })
const store = useStore()
const router = useRouter()
const drawerOpen = ref(false)
const saving = ref(false)
const steps = ref([])
const toast = ref('')

const material = computed(() => store.getMaterialById(props.materialId))

function newStep() { return { step_text: '' } }
function addStep() { steps.value.push(newStep()) }
function removeStep(i) { steps.value.splice(i, 1) }
function moveUp(i) { if (i === 0) return; [steps.value[i], steps.value[i-1]] = [steps.value[i-1], steps.value[i]] }
function moveDown(i) { if (i === steps.value.length - 1) return; [steps.value[i], steps.value[i+1]] = [steps.value[i+1], steps.value[i]] }

function showToast(msg) { toast.value = msg; setTimeout(() => toast.value = '', 2500) }

async function saveAll() {
  const invalid = steps.value.find(s => !s.step_text.trim())
  if (invalid) { alert('Pastikan semua langkah sudah terisi!'); return }
  saving.value = true
  const ok = await store.savePraktikumSteps(props.materialId, steps.value)
  saving.value = false
  if (ok) showToast('✅ Langkah praktikum berhasil disimpan!')
}

onMounted(async () => {
  if (store.materials.length === 0) await store.fetchMaterials()
  const data = await store.fetchPraktikumSteps(props.materialId)
  steps.value = data.length > 0 ? data.map(s => ({ ...s })) : [newStep()]
})
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen = false" />

    <div class="praktikum-content flex-1 min-w-0" style="margin-left:256px;">

      <!-- Header -->
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center justify-between"
        style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div class="flex items-center gap-3 min-w-0">
          <button @click="drawerOpen = true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center" style="background:#0d1526;">☰</button>
          <div class="min-w-0">
            <h1 class="font-bold text-xl truncate" style="color:#0f172a;">Langkah Praktikum</h1>
            <p class="text-xs truncate" style="color:#64748b;">{{ material?.title }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="addStep"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-gray-100"
            style="border:1px solid #e2e8f0;color:#475569;">+ Langkah</button>
          <button @click="saveAll" :disabled="saving"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-blue-700 flex items-center gap-2"
            style="background:#2563eb;color:#fff;">
            <span v-if="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>💾 Simpan</span>
          </button>
        </div>
      </header>

      <!-- Toast -->
      <div v-if="toast" class="fixed top-20 right-6 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all"
        style="background:#0f172a;color:#fff;">{{ toast }}</div>

      <div class="praktikum-inner p-6 lg:p-8 max-w-2xl">

        <!-- Info bar -->
        <div class="mb-6 flex items-center justify-between p-4 rounded-2xl"
          style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <div class="min-w-0 mr-3">
            <p class="font-bold text-sm truncate" style="color:#0f172a;">{{ material?.title }}</p>
            <p class="text-xs" style="color:#64748b;">{{ steps.length }} langkah praktikum</p>
          </div>
          <button @click="router.push('/admin/jobsheet')"
            class="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100"
            style="border:1px solid #e2e8f0;color:#475569;">← Kembali</button>
        </div>

        <!-- Steps list -->
        <div class="space-y-3">
          <div v-for="(step, i) in steps" :key="i"
            class="step-card rounded-2xl p-4 flex items-center gap-3"
            style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">

            <!-- Nomor -->
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;">
              {{ i + 1 }}
            </div>

            <!-- Input -->
            <input v-model="step.step_text" type="text" :placeholder="`Langkah ${i+1}...`"
              class="flex-1 px-3 py-2 rounded-xl text-sm"
              style="border:1px solid #e2e8f0;color:#0f172a;outline:none;background:#f8fafc;" />

            <!-- Aksi -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <button @click="moveUp(i)" :disabled="i === 0"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                :style="i === 0 ? 'background:#f1f5f9;color:#cbd5e1;cursor:not-allowed;' : 'background:#f1f5f9;color:#475569;'">↑</button>
              <button @click="moveDown(i)" :disabled="i === steps.length - 1"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                :style="i === steps.length-1 ? 'background:#f1f5f9;color:#cbd5e1;cursor:not-allowed;' : 'background:#f1f5f9;color:#475569;'">↓</button>
              <button @click="removeStep(i)"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                style="background:#fef2f2;color:#dc2626;">✕</button>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="steps.length === 0" class="text-center py-12 rounded-2xl"
          style="background:#fff;border:2px dashed #e2e8f0;color:#94a3b8;">
          <p class="text-4xl mb-3">📋</p>
          <p class="font-semibold">Belum ada langkah</p>
          <p class="text-sm mt-1">Klik "+ Langkah" untuk menambahkan</p>
        </div>

        <!-- Add button -->
        <button @click="addStep"
          class="w-full mt-4 py-4 rounded-2xl text-sm font-semibold transition-all hover:border-blue-400 hover:text-blue-600"
          style="border:2px dashed #e2e8f0;color:#94a3b8;">
          + Tambah Langkah Baru
        </button>

        <!-- Save bottom -->
        <div class="mt-5 flex justify-end">
          <button @click="saveAll" :disabled="saving"
            class="praktikum-save-btn px-8 py-3 rounded-xl font-semibold transition-all hover:bg-blue-700 flex items-center gap-2"
            style="background:#2563eb;color:#fff;">
            <span v-if="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>💾 Simpan Semua Langkah</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

@media (max-width: 1023px) {

  /* Hilangkan margin sidebar */
  .praktikum-content {
    margin-left: 0 !important;
    width: 100% !important;
    overflow-x: hidden;
  }

  /* Header padding lebih kecil */
  header.sticky {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  /* Content padding & max-width dibebaskan */
  .praktikum-inner {
    padding: 12px !important;
    max-width: 100% !important;
  }

  /* Prevent overflow */
  * { box-sizing: border-box; max-width: 100%; }
}

@media (max-width: 480px) {

  /* Header: tombol teks dipersingkat */
  header .flex.gap-2 button:first-child {
    padding: 6px 10px;
    font-size: 12px;
  }

  /* Step card: susun input dan aksi secara vertikal */
  .step-card {
    flex-wrap: wrap;
    gap: 8px !important;
  }

  /* Input ambil lebar penuh di bawah nomor */
  .step-card input {
    width: 100%;
    order: 3;
    flex: unset !important;
  }

  /* Tombol aksi geser ke kanan sejajar nomor */
  .step-card .flex.items-center.gap-1 {
    margin-left: auto;
  }

  /* Tombol simpan full width di bawah */
  .praktikum-save-btn {
    width: 100%;
    justify-content: center;
    padding: 12px !important;
  }

  .mt-5.flex.justify-end {
    display: block !important;
  }
}
</style>