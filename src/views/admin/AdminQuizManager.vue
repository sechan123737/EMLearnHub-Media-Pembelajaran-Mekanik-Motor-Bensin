<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'

const props      = defineProps({ materialId: String })
const store      = useStore()
const router     = useRouter()
const drawerOpen = ref(false)
const material   = computed(() => store.getMaterialById(props.materialId))
const questions  = ref([])
const saving     = ref(false)

function newQuestion() {
  return { question_text:'', option_a:'', option_b:'', option_c:'', option_d:'', correct_option:'a', explanation:'' }
}

function normalizeQuestion(q) {
  return {
    id: q.id,
    material_id: q.material_id,
    question_text: q.question_text || '',
    option_a: q.option_a || '',
    option_b: q.option_b || '',
    option_c: q.option_c || '',
    option_d: q.option_d || '',
    correct_option: q.correct_option || 'a',
    explanation: q.explanation || '',
  }
}
function addQuestion() {
  questions.value.push(newQuestion())
  setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100)
}
function removeQuestion(idx) { if (!confirm('Hapus soal ini?')) return; questions.value.splice(idx, 1) }
function moveUp(idx)   { if (idx === 0) return; [questions.value[idx], questions.value[idx-1]] = [questions.value[idx-1], questions.value[idx]] }
function moveDown(idx) { if (idx === questions.value.length-1) return; [questions.value[idx], questions.value[idx+1]] = [questions.value[idx+1], questions.value[idx]] }

async function saveAll() {
  const invalid = questions.value.find(q => !q.question_text.trim())
  if (invalid) return alert('Pastikan semua soal sudah terisi pertanyaannya!')
  saving.value = true
  const ok = await store.saveQuizForMaterial(props.materialId, questions.value)
  saving.value = false
  if (ok) alert('✅ Kuis berhasil disimpan!')
}

onMounted(async () => {
  await store.fetchMaterials()
  await store.fetchQuizByMaterial(props.materialId)
  const stored = store.getQuizByMaterialId(props.materialId)
  questions.value = stored.length > 0 ? stored.map(q => normalizeQuestion(q)) : [newQuestion()]
})
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen = false" />

    <div class="flex-1 min-w-0" style="margin-left:256px;">

      <!-- Header -->
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center justify-between"
        style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div class="flex items-center gap-3 min-w-0">
          <button @click="drawerOpen = true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#f1f5f9;">☰</button>
          <div class="min-w-0">
            <h1 class="font-bold text-xl truncate" style="color:#0f172a;">Kelola Evaluasi</h1>
            <p class="text-xs truncate" style="color:#64748b;">{{ material?.title }}</p>
          </div>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <button @click="addQuestion"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-gray-100"
            style="border:1px solid #e2e8f0;color:#475569;">+ Soal</button>
          <button @click="saveAll" :disabled="saving"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-blue-700 flex items-center gap-2"
            style="background:#2563eb;color:#fff;">
            <span v-if="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>💾 Simpan</span>
          </button>
        </div>
      </header>

      <div class="p-6 lg:p-8 max-w-3xl">

        <!-- Info bar -->
        <div class="mb-6 flex items-center justify-between p-4 rounded-2xl"
          style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <div class="min-w-0">
            <p class="font-bold text-sm truncate" style="color:#0f172a;">{{ material?.title }}</p>
            <p class="text-xs" style="color:#64748b;">{{ questions.length }} soal evaluasi</p>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button @click="router.push('/admin/materi')"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-gray-100"
              style="border:1px solid #e2e8f0;color:#475569;">← Kembali</button>
            <router-link :to="`/materi/${materialId}/kuis`" target="_blank"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-gray-100"
              style="border:1px solid #e2e8f0;color:#2563eb;">👁 Preview</router-link>
          </div>
        </div>

        <!-- Questions -->
        <div class="space-y-4">
          <div v-for="(q, idx) in questions" :key="idx"
            class="rounded-2xl p-5" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">

            <!-- Question header -->
            <div class="flex items-center justify-between mb-4">
              <span class="px-3 py-1 rounded-full text-xs font-bold"
                style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;">Soal {{ idx + 1 }}</span>
              <div class="flex items-center gap-1">
                <button @click="moveUp(idx)" :disabled="idx === 0"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                  :style="idx === 0 ? 'background:#f1f5f9;color:#cbd5e1;cursor:not-allowed;' : 'background:#f1f5f9;color:#475569;'">↑</button>
                <button @click="moveDown(idx)" :disabled="idx === questions.length-1"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                  :style="idx === questions.length-1 ? 'background:#f1f5f9;color:#cbd5e1;cursor:not-allowed;' : 'background:#f1f5f9;color:#475569;'">↓</button>
                <button @click="removeQuestion(idx)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                  style="background:#fef2f2;color:#dc2626;">✕</button>
              </div>
            </div>

            <!-- Question text -->
            <div class="mb-4">
              <label class="block text-xs font-semibold mb-1.5" style="color:#374151;">Pertanyaan *</label>
              <textarea v-model="q.question_text" rows="2" placeholder="Tulis pertanyaan..."
                class="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                style="border:1px solid #e2e8f0;color:#0f172a;outline:none;background:#f8fafc;"></textarea>
            </div>

            <!-- Options -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label class="flex items-center gap-2 mb-1.5 text-xs font-semibold"
                  :style="q.correct_option === 'a' ? 'color:#15803d;' : 'color:#374151;'">
                  <input type="radio" :name="`correct_${idx}`" value="a" v-model="q.correct_option" class="accent-green-600" />
                  Opsi A <span v-if="q.correct_option === 'a'" class="font-normal">(Benar)</span>
                </label>
                <input v-model="q.option_a" type="text" placeholder="Jawaban opsi A"
                  class="w-full px-3 py-2 rounded-xl text-sm"
                  :style="q.correct_option === 'a' ? 'border:2px solid #22c55e;background:#f0fdf4;color:#0f172a;outline:none;' : 'border:1px solid #e2e8f0;color:#0f172a;outline:none;background:#fff;'" />
              </div>
              <div>
                <label class="flex items-center gap-2 mb-1.5 text-xs font-semibold"
                  :style="q.correct_option === 'b' ? 'color:#15803d;' : 'color:#374151;'">
                  <input type="radio" :name="`correct_${idx}`" value="b" v-model="q.correct_option" class="accent-green-600" />
                  Opsi B <span v-if="q.correct_option === 'b'" class="font-normal">(Benar)</span>
                </label>
                <input v-model="q.option_b" type="text" placeholder="Jawaban opsi B"
                  class="w-full px-3 py-2 rounded-xl text-sm"
                  :style="q.correct_option === 'b' ? 'border:2px solid #22c55e;background:#f0fdf4;color:#0f172a;outline:none;' : 'border:1px solid #e2e8f0;color:#0f172a;outline:none;background:#fff;'" />
              </div>
              <div>
                <label class="flex items-center gap-2 mb-1.5 text-xs font-semibold"
                  :style="q.correct_option === 'c' ? 'color:#15803d;' : 'color:#374151;'">
                  <input type="radio" :name="`correct_${idx}`" value="c" v-model="q.correct_option" class="accent-green-600" />
                  Opsi C <span v-if="q.correct_option === 'c'" class="font-normal">(Benar)</span>
                </label>
                <input v-model="q.option_c" type="text" placeholder="Jawaban opsi C"
                  class="w-full px-3 py-2 rounded-xl text-sm"
                  :style="q.correct_option === 'c' ? 'border:2px solid #22c55e;background:#f0fdf4;color:#0f172a;outline:none;' : 'border:1px solid #e2e8f0;color:#0f172a;outline:none;background:#fff;'" />
              </div>
              <div>
                <label class="flex items-center gap-2 mb-1.5 text-xs font-semibold"
                  :style="q.correct_option === 'd' ? 'color:#15803d;' : 'color:#374151;'">
                  <input type="radio" :name="`correct_${idx}`" value="d" v-model="q.correct_option" class="accent-green-600" />
                  Opsi D <span v-if="q.correct_option === 'd'" class="font-normal">(Benar)</span>
                </label>
                <input v-model="q.option_d" type="text" placeholder="Jawaban opsi D"
                  class="w-full px-3 py-2 rounded-xl text-sm"
                  :style="q.correct_option === 'd' ? 'border:2px solid #22c55e;background:#f0fdf4;color:#0f172a;outline:none;' : 'border:1px solid #e2e8f0;color:#0f172a;outline:none;background:#fff;'" />
              </div>
            </div>

            <!-- Explanation -->
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:#374151;">
                Pembahasan <span class="font-normal" style="color:#94a3b8;">(opsional)</span>
              </label>
              <textarea v-model="q.explanation" rows="2" placeholder="Penjelasan jawaban yang benar..."
                class="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                style="border:1px solid #e2e8f0;color:#0f172a;outline:none;background:#f8fafc;"></textarea>
            </div>
          </div>
        </div>

        <!-- Add button -->
        <button @click="addQuestion"
          class="w-full mt-4 py-4 rounded-2xl text-sm font-semibold transition-all hover:border-blue-400 hover:text-blue-600"
          style="border:2px dashed #e2e8f0;color:#94a3b8;">
          + Tambah Soal Baru
        </button>

        <!-- Save bottom -->
        <div class="mt-5 flex justify-end">
          <button @click="saveAll" :disabled="saving"
            class="px-8 py-3 rounded-xl font-semibold transition-all hover:bg-blue-700 flex items-center gap-2"
            style="background:#2563eb;color:#fff;">
            <span v-if="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>💾 Simpan Semua Soal</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
