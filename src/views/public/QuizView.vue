<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import PublicNavbar from '../../components/PublicNavbar.vue'

const props = defineProps({ id: String })
const store = useStore()
const auth  = useAuthStore()
const router = useRouter()

const material = computed(() => store.getMaterialById(props.id))
const questions = computed(() => store.getQuizByMaterialId(props.id))
const studentName = computed(() => auth.displayName)

const currentIndex = ref(0)
const selected = ref(null)
const answered = ref(false)
const score = ref(0)
const finished = ref(false)
const results = ref([])
const started = ref(false)
const answeredMap = ref({})

const current = computed(() => questions.value[currentIndex.value])
const progress = computed(() => questions.value.length > 0 ? ((currentIndex.value) / questions.value.length) * 100 : 0)
const optionKeys = ['a', 'b', 'c', 'd', 'e']

const module = computed(() => store.modules.find(m => String(m.id) === String(material.value?.module_id)))
const moduleMaterials = computed(() => {
  if (!module.value) return []
  return store.materials.filter(m => String(m.module_id) === String(module.value.id)).sort((a, b) => (a.order_num||0)-(b.order_num||0))
})
const completedIds = ref(new Set())
const progressPct  = computed(() => moduleMaterials.value.length > 0
  ? Math.round((completedIds.value.size / moduleMaterials.value.length) * 100) : 0)

async function fetchProgress() {
  if (!auth.user) return
  const matIds = moduleMaterials.value.map(m => m.id)
  if (!matIds.length) return
  const { data } = await supabase.from('material_progress')
    .select('material_id').eq('user_id', auth.user.id).in('material_id', matIds)
  if (data) completedIds.value = new Set(data.map(r => r.material_id))
}

onMounted(async () => {
  if (store.materials.length === 0) await store.fetchMaterials()
  if (store.modules.length === 0) await store.fetchModules()
  await store.fetchQuizByMaterial(props.id)
  await fetchProgress()
})

function startQuiz() {
  currentIndex.value = 0; selected.value = null; answered.value = false
  score.value = 0; finished.value = false; results.value = []; started.value = true
  answeredMap.value = {}
}

function selectOption(opt) {
  if (answered.value) return
  selected.value = opt
  answered.value = true
  const isCorrect = opt === current.value.correct_option
  if (isCorrect) score.value++
  answeredMap.value[currentIndex.value] = { selected: opt, correct: current.value.correct_option }
  results.value.push({ question: current.value.question_text, selected: opt, correct: current.value.correct_option, isCorrect, explanation: current.value.explanation })
}

function goToQuestion(idx) {
  if (!started.value) return
  currentIndex.value = idx
  const ans = answeredMap.value[idx]
  if (ans) { selected.value = ans.selected; answered.value = true }
  else { selected.value = null; answered.value = false }
}

function next() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    const ans = answeredMap.value[currentIndex.value]
    if (ans) { selected.value = ans.selected; answered.value = true }
    else { selected.value = null; answered.value = false }
  } else {
    finished.value = true
    saveResult()
  }
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    const ans = answeredMap.value[currentIndex.value]
    if (ans) { selected.value = ans.selected; answered.value = true }
    else { selected.value = null; answered.value = false }
  }
}

async function saveResult() {
  const pct = Math.round((score.value / questions.value.length) * 100)
  await store.saveQuizResult({ student_name: studentName.value, quiz_type: 'material', material_id: props.id, material_name: material.value?.title || '', score: score.value, total: questions.value.length, percentage: pct })
}

function getOptionLabel(key) { return key.toUpperCase() }
function getOptionText(q, key) { return q['option_' + key] || '' }

const scoreColor = computed(() => {
  const pct = (score.value / questions.value.length) * 100
  if (pct >= 80) return '#22c55e'
  if (pct >= 60) return '#eab308'
  return '#ef4444'
})

const scoreMessage = computed(() => {
  const pct = (score.value / questions.value.length) * 100
  if (pct === 100) return { msg: 'Sempurna! 🎉', sub: 'Kamu menguasai materi ini dengan baik!' }
  if (pct >= 80) return { msg: 'Sangat Baik! 👏', sub: 'Pemahaman kamu sudah sangat bagus.' }
  if (pct >= 60) return { msg: 'Cukup Baik 👍', sub: 'Kamu bisa memperbaiki dengan mengulang materi.' }
  return { msg: 'Perlu Belajar Lagi 📚', sub: 'Kembali ke materi dan coba lagi ya!' }
})

const answeredCount = computed(() => Object.keys(answeredMap.value).length)
const skippedCount = computed(() => 0)
</script>

<template>
  <div class="min-h-screen" style="background:#f8fafc;">
    <PublicNavbar active="materi" />
    <div class="flex" style="min-height:calc(100vh - 64px);">

      <!-- SIDEBAR KIRI -->
      <aside class="hidden lg:flex flex-col w-72 flex-shrink-0 sticky top-16 self-start"
        style="height:calc(100vh - 64px);background:#fff;border-right:1px solid #e2e8f0;overflow-y:auto;">

        <div class="p-5 border-b" style="border-color:#e2e8f0;">
          <div class="w-full h-28 rounded-xl overflow-hidden mb-4"
            style="background:linear-gradient(135deg,#1e293b,#334155);">
            <img v-if="module?.image_url" :src="module.image_url" :alt="module.name"
              class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span style="font-size:3rem;opacity:0.4;">📷</span>
            </div>
          </div>
          <h2 class="font-bold text-base mb-1" style="color:#0f172a;">{{ module?.name }}</h2>
          <p class="text-xs" style="color:#64748b;">{{ moduleMaterials.length }} Materi</p>
        </div>

        <div class="px-5 py-4 border-b" style="border-color:#e2e8f0;">
          <p class="text-xs font-semibold uppercase tracking-wider mb-3" style="color:#475569;">DAFTAR MATERI</p>
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-bold" style="color:#0f172a;">Progress Belajar</span>
            <span class="text-sm font-bold" style="color:#2563eb;">{{ progressPct }}%</span>
          </div>
          <div class="w-full h-2 rounded-full mb-2" style="background:#e2e8f0;">
            <div class="h-2 rounded-full transition-all duration-500" style="background:#2563eb;"
              :style="`width:${progressPct}%;`"></div>
          </div>
          <p class="text-xs" style="color:#94a3b8;">{{ completedIds.size }} dari {{ moduleMaterials.length }} materi selesai</p>
        </div>

        <nav class="flex-1 p-3">
          <button v-for="(mat, idx) in moduleMaterials" :key="mat.id"
            @click="router.push(`/materi/${mat.id}`)"
            class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left mb-1 transition-all"
            style="border:1px solid transparent;"
            onmouseenter="if(!this.classList.contains('active'))this.style.background='#f8fafc'"
            onmouseleave="if(!this.classList.contains('active'))this.style.background=''">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              :style="completedIds.has(mat.id)
                ? 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;'
                : 'background:#f1f5f9;color:#64748b;'">
              {{ completedIds.has(mat.id) ? '✓' : idx + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate" style="color:#0f172a;">{{ mat.title }}</p>
              <p class="text-xs" style="color:#94a3b8;">7 Menit</p>
            </div>
          </button>
        </nav>
      </aside>

      <!-- MAIN -->
      <main class="flex-1 min-w-0 p-6 lg:p-8">

        <!-- START SCREEN -->
        <div v-if="!started" class="max-w-2xl mx-auto">
          <!-- Breadcrumb -->
          <div class="flex items-center gap-2 text-sm mb-6" style="color:#94a3b8;">
            <span @click="router.push('/')" class="cursor-pointer hover:text-blue-500">Materi</span>
            <span>›</span>
            <span>{{ module?.name }}</span>
            <span>›</span>
            <span>{{ material?.title }}</span>
            <span>›</span>
            <span style="color:#0f172a;">Evaluasi</span>
          </div>

          <div class="rounded-2xl p-8" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <h1 class="font-bold text-2xl mb-2" style="color:#0f172a;">Evaluasi</h1>
            <p class="text-sm mb-6" style="color:#64748b;">Kerjakan evaluasi berikut untuk menguji pemahaman Anda tentang materi {{ material?.title }}.</p>

            <div class="flex items-center gap-6 mb-8 p-4 rounded-xl" style="background:#f8fafc;border:1px solid #e2e8f0;">
              <div class="flex items-center gap-2 text-sm" style="color:#475569;"><span>📚</span> Jumlah Soal<br/><strong style="color:#0f172a;">{{ questions.length }} Soal</strong></div>
              <div class="w-px h-10" style="background:#e2e8f0;"></div>
              <div class="flex items-center gap-2 text-sm" style="color:#475569;"><span>🕐</span> Waktu<br/><strong style="color:#0f172a;">30 Menit</strong></div>
              <div class="w-px h-10" style="background:#e2e8f0;"></div>
              <div class="flex items-center gap-2 text-sm" style="color:#475569;"><span>🔄</span> Batas Pengerjaan<br/><strong style="color:#0f172a;">Tidak ada batas</strong></div>
              <button @click="startQuiz" class="ml-auto px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all hover:bg-blue-700" style="background:#2563eb;color:#fff;">
                ▶ Mulai Ujian
              </button>
            </div>

            <div class="flex gap-4 border-b mb-6" style="border-color:#e2e8f0;">
              <button class="px-4 py-3 text-sm font-semibold" style="color:#64748b;border-bottom:2px solid transparent;">Informasi Evaluasi</button>
              <button class="px-4 py-3 text-sm font-semibold" style="color:#2563eb;border-bottom:2px solid #2563eb;margin-bottom:-1px;">Kerjakan Evaluasi</button>
            </div>

            <div v-if="questions.length === 0" class="text-center py-10" style="color:#94a3b8;">
              <span style="font-size:3rem;">📚</span>
              <p class="font-semibold mt-3 mb-1">Kuis belum tersedia</p>
              <p class="text-sm">Admin belum menambahkan soal untuk materi ini.</p>
            </div>
            <div v-else>
              <button @click="startQuiz" class="w-full py-3 rounded-xl font-semibold transition-all hover:bg-blue-700" style="background:#2563eb;color:#fff;">🚀 Mulai Evaluasi</button>
              <button @click="router.push(`/materi/${id}`)" class="w-full py-2.5 rounded-xl font-semibold mt-2 transition-all hover:bg-gray-100" style="border:1px solid #e2e8f0;color:#475569;">← Kembali ke Materi</button>
            </div>
          </div>
        </div>

        <!-- QUIZ IN PROGRESS -->
        <div v-else-if="!finished && current" class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Left: question -->
          <div class="lg:col-span-2">
            <!-- Breadcrumb -->
            <div class="flex items-center gap-2 text-sm mb-4" style="color:#94a3b8;">
              <span>Materi</span><span>›</span>
              <span>{{ module?.name }}</span><span>›</span>
              <span>{{ material?.title }}</span><span>›</span>
              <span style="color:#0f172a;">Evaluasi</span>
            </div>

            <div class="rounded-2xl p-6" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
              <p class="font-bold text-sm mb-1" style="color:#64748b;">Soal {{ currentIndex+1 }} dari {{ questions.length }}</p>
              <p class="text-base font-semibold mb-6 leading-relaxed" style="color:#0f172a;">
                {{ current.question_text }}
              </p>

              <div class="space-y-3">
                <button
                  v-for="key in optionKeys.filter(k => getOptionText(current, k))"
                  :key="key"
                  :disabled="answered"
                  @click="selectOption(key)"
                  class="w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all font-medium text-sm"
                  :style="!answered
                    ? (selected === key ? 'border:2px solid #2563eb;background:#eff6ff;color:#1d4ed8;' : 'border:1px solid #e2e8f0;background:#fff;color:#374151;')
                    : key === current.correct_option
                      ? 'border:2px solid #22c55e;background:#f0fdf4;color:#15803d;cursor:default;'
                      : key === selected && key !== current.correct_option
                        ? 'border:2px solid #ef4444;background:#fef2f2;color:#dc2626;cursor:default;'
                        : 'border:1px solid #e2e8f0;background:#f8fafc;color:#94a3b8;cursor:default;'"
                >
                  <span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    :style="!answered ? 'background:#f1f5f9;color:#475569;'
                      : key === current.correct_option ? 'background:#22c55e;color:#fff;'
                      : key === selected && key !== current.correct_option ? 'background:#ef4444;color:#fff;'
                      : 'background:#f1f5f9;color:#94a3b8;'"
                  >{{ getOptionLabel(key) }}</span>
                  <span>{{ getOptionText(current, key) }}</span>
                  <span v-if="answered && key === current.correct_option" class="ml-auto text-green-500">✓</span>
                  <span v-else-if="answered && key === selected && key !== current.correct_option" class="ml-auto text-red-500">✗</span>
                </button>
              </div>
            </div>

            <!-- Feedback -->
            <div v-if="answered" class="mt-4 rounded-2xl p-5" :style="selected === current.correct_option ? 'background:#f0fdf4;border:1px solid #bbf7d0;' : 'background:#fef2f2;border:1px solid #fecaca;'">
              <div class="flex items-start gap-3">
                <span class="text-2xl">{{ selected === current.correct_option ? '🎉' : '❌' }}</span>
                <div>
                  <p class="font-bold mb-1" :style="selected === current.correct_option ? 'color:#15803d;' : 'color:#dc2626;'">
                    {{ selected === current.correct_option ? 'Jawaban Benar!' : 'Jawaban Salah!' }}
                  </p>
                  <p v-if="current.explanation" class="text-sm" style="color:#374151;">{{ current.explanation }}</p>
                  <p v-if="selected !== current.correct_option" class="text-sm mt-1" style="color:#64748b;">
                    Jawaban benar: <span style="color:#15803d;font-weight:600;">{{ getOptionLabel(current.correct_option) }}. {{ getOptionText(current, current.correct_option) }}</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Nav buttons -->
            <div class="flex items-center justify-between mt-4 gap-3">
              <button @click="prev" :disabled="currentIndex === 0" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all" style="border:1px solid #e2e8f0;color:#475569;background:#fff;" :class="currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'">
                ← Soal Sebelumnya
              </button>
              <div v-if="answered">
                <button @click="next" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-blue-700" style="background:#2563eb;color:#fff;">
                  {{ currentIndex < questions.length - 1 ? 'Soal Selanjutnya →' : '📊 Lihat Hasil' }}
                </button>
              </div>
            </div>

            <!-- Warning -->
            <div class="mt-4 p-4 rounded-xl flex items-center gap-2" style="background:#fffbeb;border:1px solid #fde68a;">
              <span>⚠️</span>
              <p class="text-sm font-semibold" style="color:#92400e;">Perhatian</p>
              <p class="text-sm" style="color:#92400e;">Pastikan Anda telah menjawab semua soal sebelum menekan tombol selesai.</p>
            </div>
          </div>

          <!-- Right: navigation panel -->
          <div class="space-y-4">
            <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
              <h3 class="font-bold mb-4" style="color:#0f172a;">Navigasi Soal</h3>
              <div class="flex items-center gap-4 mb-4 text-xs" style="color:#64748b;">
                <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full inline-block" style="background:#22c55e;"></span> Sudah Dijawab</span>
                <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full inline-block" style="background:#3b82f6;"></span> Sedang Dikerjakan</span>
                <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full inline-block" style="background:#e2e8f0;"></span> Belum Dijawab</span>
              </div>
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="(q, i) in questions"
                  :key="i"
                  @click="goToQuestion(i)"
                  class="w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all"
                  :style="i === currentIndex
                    ? 'background:#2563eb;color:#fff;'
                    : answeredMap[i]
                      ? 'background:#22c55e;color:#fff;'
                      : 'background:#f1f5f9;color:#475569;'"
                >{{ i+1 }}</button>
              </div>
            </div>

            <!-- Status -->
            <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
              <h3 class="font-bold mb-4" style="color:#0f172a;">Status Pengerjaan</h3>
              <div class="relative flex items-center justify-center mb-4">
                <svg viewBox="0 0 80 80" class="w-24 h-24">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" stroke-width="8"/>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#2563eb" stroke-width="8"
                    stroke-dasharray="201" :stroke-dashoffset="201 - (201 * answeredCount / Math.max(questions.length,1))"
                    stroke-linecap="round" transform="rotate(-90 40 40)"/>
                </svg>
                <div class="absolute text-center">
                  <p class="font-bold text-lg" style="color:#0f172a;">{{ answeredCount }}/{{ questions.length }}</p>
                  <p class="text-xs" style="color:#64748b;">{{ Math.round(answeredCount/Math.max(questions.length,1)*100) }}%</p>
                </div>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between"><span style="color:#22c55e;">● Soal Dijawab</span><span class="font-bold" style="color:#22c55e;">{{ answeredCount }}</span></div>
                <div class="flex items-center justify-between"><span style="color:#f97316;">● Soal Dilewati</span><span class="font-bold" style="color:#f97316;">{{ skippedCount }}</span></div>
                <div class="flex items-center justify-between"><span style="color:#94a3b8;">● Belum Dijawab</span><span class="font-bold" style="color:#94a3b8;">{{ questions.length - answeredCount }}</span></div>
              </div>
            </div>

            <!-- Tips -->
            <div class="rounded-2xl p-5" style="background:#fffbeb;border:1px solid #fde68a;">
              <p class="font-bold text-sm mb-2 flex items-center gap-1" style="color:#92400e;">💡 Tips</p>
              <p class="text-xs" style="color:#92400e;">Bacalah setiap soal dengan teliti sebelum memilih jawaban yang paling tepat.</p>
            </div>
          </div>
        </div>

        <!-- RESULT -->
        <div v-else-if="finished" class="max-w-3xl mx-auto">
          <div class="rounded-2xl p-8 text-center mb-8" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6" style="background:#f1f5f9;border:1px solid #e2e8f0;color:#475569;">
              👤 {{ studentName }}
            </div>
            <div class="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 border-4" :style="`border-color:${scoreColor};`">
              <span class="font-bold text-3xl" :style="`color:${scoreColor};`">{{ score }}/{{ questions.length }}</span>
            </div>
            <h2 class="font-bold text-2xl mb-2" style="color:#0f172a;">{{ scoreMessage.msg }}</h2>
            <p class="mb-6" style="color:#64748b;">{{ scoreMessage.sub }}</p>
            <div class="flex items-center justify-center gap-8 mb-8">
              <div class="text-center"><p class="font-bold text-2xl" style="color:#22c55e;">{{ score }}</p><p class="text-xs" style="color:#64748b;">Benar</p></div>
              <div class="w-px h-10" style="background:#e2e8f0;"></div>
              <div class="text-center"><p class="font-bold text-2xl" style="color:#ef4444;">{{ questions.length - score }}</p><p class="text-xs" style="color:#64748b;">Salah</p></div>
              <div class="w-px h-10" style="background:#e2e8f0;"></div>
              <div class="text-center"><p class="font-bold text-2xl" style="color:#2563eb;">{{ Math.round((score/questions.length)*100) }}%</p><p class="text-xs" style="color:#64748b;">Nilai</p></div>
            </div>
            <div class="p-3 rounded-xl mb-6 text-sm" style="background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;">
              <img src="/icons/kuis.png" class="w-5 h-5 inline-block object-contain" alt="" /> Nilai kamu telah tersimpan dan dapat dilihat oleh admin.
            </div>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button @click="started = false" class="px-6 py-2.5 rounded-xl font-semibold transition-all hover:bg-blue-700" style="background:#2563eb;color:#fff;">🔄 Kuis Lagi</button>
              <button @click="router.push(`/materi/${id}`)" class="px-6 py-2.5 rounded-xl font-semibold transition-all hover:bg-gray-100" style="border:1px solid #e2e8f0;color:#475569;">← Kembali ke Materi</button>
            </div>
          </div>

          <h3 class="font-bold text-xl mb-4" style="color:#0f172a;">Pembahasan Soal</h3>
          <div class="space-y-4">
            <div v-for="(r, i) in results" :key="i" class="rounded-2xl p-5" :style="r.isCorrect ? 'background:#fff;border:1px solid #bbf7d0;' : 'background:#fff;border:1px solid #fecaca;'">
              <div class="flex items-start gap-3 mb-3">
                <span class="text-xl flex-shrink-0">{{ r.isCorrect ? '✅' : '❌' }}</span>
                <p class="font-semibold text-sm" style="color:#0f172a;">{{ i+1 }}. {{ r.question }}</p>
              </div>
              <div class="ml-8 space-y-1 text-sm">
                <p style="color:#64748b;">Jawabanmu: <span :style="r.isCorrect ? 'color:#15803d;font-weight:600;' : 'color:#dc2626;font-weight:600;'">{{ getOptionLabel(r.selected) }}</span></p>
                <p v-if="!r.isCorrect" style="color:#64748b;">Jawaban benar: <span style="color:#15803d;font-weight:600;">{{ getOptionLabel(r.correct) }}</span></p>
                <p v-if="r.explanation" class="mt-2 italic" style="color:#94a3b8;">📌 {{ r.explanation }}</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>
