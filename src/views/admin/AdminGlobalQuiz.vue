<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'

const store      = useStore()
const router     = useRouter()
const drawerOpen = ref(false)
const questions  = ref([])
const saving     = ref(false)

function newQuestion() {
  return { question_text:'', option_a:'', option_b:'', option_c:'', option_d:'', correct_option:'a', explanation:'' }
}
function addQuestion()       { questions.value.push(newQuestion()) }
function removeQuestion(idx) { if (!confirm('Hapus soal ini?')) return; questions.value.splice(idx, 1) }

async function saveAll() {
  const invalid = questions.value.find(q => !q.question_text.trim())
  if (invalid) return alert('Semua soal harus memiliki pertanyaan!')
  saving.value = true
  const ok = await store.saveGlobalQuiz(questions.value)
  saving.value = false
  if (ok) alert('✅ Evaluasi Akhir berhasil disimpan!')
}

onMounted(async () => {
  await store.fetchGlobalQuiz()
  questions.value = store.globalQuestions.length > 0
    ? store.globalQuestions.map(q => ({ ...q }))
    : [newQuestion()]
})
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen = false" />

    <div class="flex-1 min-w-0" style="margin-left:256px;">

      <!-- Header -->
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center justify-between"
        style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div class="flex items-center gap-3">
          <button @click="drawerOpen = true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center" style="background:#0d1526;">☰</button>
          <div>
            <h1 class="font-bold text-xs" style="color:#0f172a;">Evaluasi Akhir</h1>
            <p class="text-xs" style="color:#64748b;">{{ questions.length }} soal tersedia</p>
          </div>
        </div>
        <div class="gq-header-actions">
          <button @click="router.push('/')" class="px-4 py-2 rounded-xl text-sm font-semibold" style="border:1px solid #e2e8f0;color:#475569;">
            <img src="/logo.png" class="w-5 h-5 inline-block object-contain" alt="" />
            <span class="gq-beranda-label"> Beranda</span>
          </button>
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

      <div class="p-6 lg:p-8 gq-content">

        <!-- Info banner -->
        <div class="mb-6 p-4 rounded-2xl flex items-start gap-3"
          style="background:#f0fdf4;border:1px solid #bbf7d0;">
          <span class="text-2xl">🏆</span>
          <div>
            <p class="font-bold text-sm" style="color:#15803d;">Evaluasi Akhir</p>
            <p class="text-sm" style="color:#166534;">Soal-soal ini muncul di halaman Evaluasi Akhir mahasiswa. Soal diacak setiap sesi pengerjaan.</p>
          </div>
        </div>

        <!-- Questions -->
        <div class="space-y-4">
          <div v-for="(q, idx) in questions" :key="idx"
            class="rounded-2xl p-5 gq-card" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">

            <!-- Question header -->
            <div class="flex items-center justify-between mb-4">
              <span class="px-3 py-1 rounded-full text-xs font-bold"
                style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;">Soal {{ idx + 1 }}</span>
              <button @click="removeQuestion(idx)"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                style="background:#fef2f2;color:#dc2626;">✕</button>
            </div>

            <!-- Question text -->
            <div class="mb-4">
              <label class="block text-xs font-semibold mb-1.5" style="color:#374151;">Pertanyaan *</label>
              <textarea v-model="q.question_text" rows="2" placeholder="Tulis pertanyaan..."
                class="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                style="border:1px solid #e2e8f0;color:#0f172a;outline:none;background:#f8fafc;"></textarea>
            </div>

            <!-- Options grid -->
            <div class="gq-options-grid mb-4">
              <div v-for="key in ['a','b','c','d']" :key="key">
                <label class="flex items-center gap-2 mb-1.5 text-xs font-semibold"
                  :style="q.correct_option === key ? 'color:#15803d;' : 'color:#374151;'">
                  <input type="radio" :name="`g_correct_${idx}`" :value="key" v-model="q.correct_option"
                    class="accent-green-600" />
                  Opsi {{ key.toUpperCase() }}
                  <span v-if="q.correct_option === key" class="font-normal">(Jawaban Benar)</span>
                </label>
                <input v-model="q['option_' + key]" type="text" :placeholder="`Isi opsi ${key.toUpperCase()}`"
                  class="w-full px-3 py-2 rounded-xl text-sm"
                  :style="q.correct_option === key
                    ? 'border:2px solid #22c55e;background:#f0fdf4;color:#0f172a;outline:none;'
                    : 'border:1px solid #e2e8f0;color:#0f172a;outline:none;background:#fff;'" />
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
        <div class="mt-5 gq-save-row">
          <button @click="saveAll" :disabled="saving"
            class="gq-save-btn px-8 py-3 rounded-xl font-semibold transition-all hover:bg-blue-700 flex items-center gap-2"
            style="background:#2563eb;color:#fff;">
            <span v-if="saving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>💾 Simpan Semua Soal</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* =============================================
   LAYOUT CLASSES - desktop default
   ============================================= */

.gq-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Options: 2 kolom di desktop */
.gq-options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.gq-save-row {
  display: flex;
  justify-content: flex-end;
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
  .gq-beranda-label { display: none; }

  /* Content padding & max-width */
  .p-6.lg\:p-8 { padding: 12px !important; }
  .gq-content { max-width: 100% !important; }

  /* Card padding */
  .gq-card { padding: 14px !important; }

  /* Options: 1 kolom di mobile */
  .gq-options-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  /* Save button full width */
  .gq-save-row { justify-content: stretch; }
  .gq-save-btn {
    width: 100% !important;
    justify-content: center;
  }

  /* Header actions: sembunyikan Beranda, kompres */
  .gq-header-actions { gap: 6px; }
  .gq-header-actions button {
    padding: 8px 10px !important;
    font-size: 0.75rem !important;
  }

  /* Prevent overflow */
  * { box-sizing: border-box; max-width: 100%; }
}
</style>