<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import { useAuthStore } from '../../stores/authStore'
import PublicNavbar from '../../components/PublicNavbar.vue'

const store = useStore()
const auth  = useAuthStore()
const router = useRouter()

// Nama diambil otomatis dari profil user
const studentName = computed(() => auth.displayName)

const started = ref(false)
const finished = ref(false)
const currentIndex = ref(0)
const selected = ref(null)
const answered = ref(false)
const score = ref(0)
const results = ref([])

const questions = computed(() => store.globalQuestions)
const current = computed(() => questions.value[currentIndex.value])
const progress = computed(() => questions.value.length > 0 ? (currentIndex.value / questions.value.length) * 100 : 0)
const optionKeys = ['a', 'b', 'c', 'd']

function getOptionLabel(k) { return k.toUpperCase() }
function getOptionText(q, k) { return q['option_' + k] || '' }

function startQuiz() {
  store.globalQuestions = [...questions.value].sort(() => Math.random() - 0.5)
  currentIndex.value = 0
  selected.value = null
  answered.value = false
  score.value = 0
  finished.value = false
  results.value = []
  started.value = true
}

function selectOption(opt) {
  if (answered.value) return
  selected.value = opt
  answered.value = true
  const isCorrect = opt === current.value.correct_option
  if (isCorrect) score.value++
  results.value.push({ question: current.value.question_text, selected: opt, correct: current.value.correct_option, isCorrect, explanation: current.value.explanation })
}

function next() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    selected.value = null
    answered.value = false
  } else {
    finished.value = true
    saveResult()
  }
}

async function saveResult() {
  const pct = Math.round((score.value / questions.value.length) * 100)
  await store.saveQuizResult({
    student_name:  studentName.value,
    quiz_type:     'global',
    material_id:   null,
    material_name: 'Kuis Global',
    score:         score.value,
    total:         questions.value.length,
    percentage:    pct,
  })
}

const scoreColor = computed(() => {
  const pct = questions.value.length > 0 ? (score.value / questions.value.length) * 100 : 0
  if (pct >= 80) return 'text-green-400'
  if (pct >= 60) return 'text-yellow-400'
  return 'text-red-400'
})

const scoreMessage = computed(() => {
  const pct = questions.value.length > 0 ? (score.value / questions.value.length) * 100 : 0
  if (pct === 100) return { msg: 'Sempurna! 🎉', sub: 'Kamu menguasai semua materi dengan luar biasa!' }
  if (pct >= 80)  return { msg: 'Sangat Baik! 👏', sub: 'Pemahaman kamu tentang MMB sudah sangat bagus.' }
  if (pct >= 60)  return { msg: 'Cukup Baik 👍', sub: 'Ulangi beberapa materi yang masih kurang.' }
  return { msg: 'Perlu Belajar Lagi 📚', sub: 'Kembali ke modul dan pelajari ulang materi MMB.' }
})

onMounted(() => { store.fetchGlobalQuiz() })
</script>

<template>
  <div class="min-h-screen" style="background:#f8fafc;">
    <PublicNavbar active="evaluasi" />

    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-10">

            <!-- ② START SCREEN -->
      <div v-if="!started" class="animate-fade-up">
        <div class="rounded-2xl bg-white border border-gray-200 shadow-sm p-8 sm:p-12 text-center">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-semibold mb-6">
            👤 {{ studentName }}
          </div>
          <div class="w-24 h-24 bg-primary-500/10 border border-primary-500/20 rounded-3xl flex items-center justify-center text-6xl mx-auto mb-8">🏆</div>
          <h1 class="font-bold font-bold text-3xl text-white mb-3">Kuis Global</h1>
          <p class="text-gray-400 mb-2">Mekanik Motor Bensin</p>
          <p class="text-gray-400 mb-10">
            Terdapat <span class="text-primary-400 font-bold">{{ questions.length }}</span> soal yang mencakup seluruh materi.</p>
          <div v-if="questions.length === 0" class="mb-8 p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p class="text-yellow-400 font-semibold mb-1">Kuis belum tersedia</p>
            <p class="text-gray-400 text-sm">Admin belum menambahkan soal kuis global.</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button v-if="questions.length > 0" @click="startQuiz" class="btn-primary text-lg px-10 py-3">🚀 Mulai Evaluasi Akhir</button>
            <button @click="router.push('/')" class="btn-secondary">← Kembali</button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 mt-6 max-w-sm mx-auto w-full">
          <div class="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 text-center"><p class="text-2xl font-bold text-primary-400">{{ questions.length }}</p><p class="text-xs text-gray-400 mt-1">Total Soal</p></div>
          <div class="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 text-center"><p class="text-2xl font-bold text-primary-400">🔀</p><p class="text-xs text-gray-400 mt-1">Soal Diacak</p></div>
        </div>
      </div>

      <!-- ③ QUIZ IN PROGRESS -->
      <div v-else-if="!finished && current" class="animate-fade-up">
        <div class="mb-6">
          <div class="flex justify-between text-xs text-gray-400 mb-2">
            <span>Soal {{ currentIndex + 1 }} dari {{ questions.length }}</span>
            <span>{{ Math.round(progress) }}%</span>
          </div>
          <div class="h-2 bg-engine-steel rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-primary-500 to-orange-400 rounded-full progress-glow transition-all duration-500" :style="{ width: progress + '%' }" />
          </div>
        </div>
        <div class="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 sm:p-8 mb-5">
          <div class="flex items-start gap-4 mb-8">
            <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center font-bold font-bold text-white flex-shrink-0">{{ currentIndex + 1 }}</div>
            <p class="text-white text-lg font-semibold leading-relaxed">{{ current.question_text }}</p>
          </div>
          <div class="space-y-3">
            <button v-for="key in optionKeys" :key="key" :disabled="answered" @click="selectOption(key)"
              :class="['quiz-option w-full text-left p-4 rounded-xl border font-medium flex items-center gap-4 transition-all',
                !answered ? 'border-gray-200 bg-engine-metal/30 text-gray-700 hover:border-primary-500/50 hover:bg-primary-500/10 hover:text-white cursor-pointer'
                : key === current.correct_option ? 'border-green-500 bg-green-500/15 text-green-300 cursor-default'
                : key === selected && key !== current.correct_option ? 'border-red-500 bg-red-500/15 text-red-300 cursor-default'
                : 'border-gray-100 bg-gray-900/30 text-gray-400 cursor-default']">
              <span :class="['w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                !answered ? 'bg-white/10' : key === current.correct_option ? 'bg-green-500 text-white' : key === selected && key !== current.correct_option ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500']">
                {{ getOptionLabel(key) }}
              </span>
              <span>{{ getOptionText(current, key) }}</span>
              <span v-if="answered && key === current.correct_option" class="ml-auto text-green-400">✓</span>
              <span v-else-if="answered && key === selected && key !== current.correct_option" class="ml-auto text-red-400">✗</span>
            </button>
          </div>
        </div>
        <div v-if="answered" class="animate-fade-up">
          <div :class="['card p-5 mb-5 border', selected === current.correct_option ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30']">
            <div class="flex items-start gap-3">
              <span class="text-2xl">{{ selected === current.correct_option ? '🎉' : '❌' }}</span>
              <div>
                <p :class="['font-bold mb-1', selected === current.correct_option ? 'text-green-400' : 'text-red-400']">
                  {{ selected === current.correct_option ? 'Jawaban Benar!' : 'Jawaban Salah!' }}
                </p>
                <p v-if="current.explanation" class="text-gray-700 text-sm">{{ current.explanation }}</p>
                <p v-if="selected !== current.correct_option" class="text-gray-400 text-sm mt-1">
                  Jawaban benar: <span class="text-green-400 font-semibold">{{ getOptionLabel(current.correct_option) }}. {{ getOptionText(current, current.correct_option) }}</span>
                </p>
              </div>
            </div>
          </div>
          <button @click="next" class="btn-primary w-full justify-center py-3">
            {{ currentIndex < questions.length - 1 ? 'Soal Berikutnya →' : '📊 Lihat Hasil' }}
          </button>
        </div>
      </div>

      <!-- ④ RESULT -->
      <div v-else-if="finished" class="animate-fade-up">
        <div class="rounded-2xl bg-white border border-gray-200 shadow-sm p-8 sm:p-12 text-center mb-8">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-engine-steel border border-gray-200 rounded-full text-gray-700 text-sm font-semibold mb-6">
            👤 {{ studentName }}
          </div>
          <div class="w-28 h-28 bg-engine-steel rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-primary-500/30">
            <span :class="['font-bold font-bold text-4xl', scoreColor]">{{ score }}/{{ questions.length }}</span>
          </div>
          <h2 class="font-bold font-bold text-2xl text-white mb-2">{{ scoreMessage.msg }}</h2>
          <p class="text-gray-400 mb-6">{{ scoreMessage.sub }}</p>
          <div class="flex items-center justify-center gap-8 mb-6">
            <div class="text-center"><p class="font-bold text-2xl text-green-400">{{ score }}</p><p class="text-xs text-gray-400">Benar</p></div>
            <div class="w-px h-10 bg-white/10" />
            <div class="text-center"><p class="font-bold text-2xl text-red-400">{{ questions.length - score }}</p><p class="text-xs text-gray-400">Salah</p></div>
            <div class="w-px h-10 bg-white/10" />
            <div class="text-center"><p class="font-bold text-2xl text-primary-400">{{ Math.round((score / questions.length) * 100) }}%</p><p class="text-xs text-gray-400">Nilai</p></div>
          </div>
          <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs mb-6">
            <img src="/icons/kuis.png" class="w-5 h-5 inline-block object-contain" alt="" /> Nilai kamu telah tersimpan dan dapat dilihat oleh admin.
          </div>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button @click="nameSubmitted = false; started = false; studentName = ''" class="btn-primary">🔄 Kuis Lagi</button>
            <button @click="router.push('/')" class="btn-secondary">← Beranda</button>
          </div>
        </div>
        <h3 class="font-bold font-bold text-xl text-white mb-4">Pembahasan</h3>
        <div class="space-y-4">
          <div v-for="(r, i) in results" :key="i" :class="['card p-5 border', r.isCorrect ? 'border-green-500/20' : 'border-red-500/20']">
            <div class="flex items-start gap-3 mb-2">
              <span class="text-xl flex-shrink-0">{{ r.isCorrect ? '✅' : '❌' }}</span>
              <p class="font-semibold text-white">{{ i + 1 }}. {{ r.question }}</p>
            </div>
            <div class="ml-8 space-y-1 text-sm">
              <p class="text-gray-400">Jawabanmu: <span :class="r.isCorrect ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'">{{ getOptionLabel(r.selected) }}</span></p>
              <p v-if="!r.isCorrect" class="text-gray-400">Jawaban benar: <span class="text-green-400 font-semibold">{{ getOptionLabel(r.correct) }}</span></p>
              <p v-if="r.explanation" class="text-gray-400 mt-2 italic">📌 {{ r.explanation }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
