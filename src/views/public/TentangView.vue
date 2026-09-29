<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PublicNavbar from '../../components/PublicNavbar.vue'
import { useStore } from '../../stores/mainStore'

const router = useRouter()
const store = useStore()

onMounted(async () => {
  if (store.modules.length === 0) await store.fetchModules()
  if (store.materials.length === 0) await store.fetchMaterials()
})

const features = [
  { icon: '/icons/materi.png', title: 'Materi Terintegrasi', desc: 'Materi disusun secara sistematis, mencakup teori dasar hingga komponen lanjutan mesin bensin.', color: '#eff6ff', iconColor: '#2563eb' },
  { icon: '/icons/video.png', title: 'Video Interaktif', desc: 'Video pembelajaran visual yang menjelaskan proses kerja mesin bensin.', color: '#f0fdf4', iconColor: '#22c55e' },
  { icon: '/icons/jobsheet.png', title: 'Jobsheet Terstruktur', desc: 'Lembar kerja praktikum yang sistematis untuk membantu mahasiswa melakukan pengamatan dan analisis secara mandiri.', color: '#fff7ed', iconColor: '#f97316' },
  { icon: '/icons/kuis.png', title: 'Evaluasi', desc: 'Sistem evaluasi interaktif untuk mengukur pemahaman dan perkembangan belajar.', color: '#faf5ff', iconColor: '#a855f7' },
  { icon: '/icons/progress.png', title: 'Pantau Progress', desc: 'Fitur tracking progress belajar yang membantu mahasiswa dan dosen memantau perkembangan secara real-time.', color: '#ecfeff', iconColor: '#06b6d4' },
]

// Topics dari database (modul)
const topics = computed(() =>
  store.modules.map(m => ({
    icon: '/icons/materi.png',
    name: m.name,
    count: store.materials.filter(mat => String(mat.module_id) === String(m.id)).length,
  }))
)

// Stats real dari database
const stats = computed(() => [
  { value: store.modules.length || 0, label: 'Topik Materi', icon: '/icons/modul.png' },
  { value: store.materials.length || 0, label: 'Sub-Materi', icon: '/icons/materi.png' },
  { value: store.materials.filter(m => m.video_url).length || 0, label: 'Video Pembelajaran', icon: '/icons/video.png' },
  { value: store.materials.filter(m => m.jobsheet_url).length || 0, label: 'Jobsheet Praktikum', icon: '/icons/jobsheet.png' },
])
</script>

<template>
  <div class="min-h-screen" style="background:#f8fafc;">
    <PublicNavbar active="tentang" />

    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#0d1526,#0f1f3d);padding:80px 0 60px;" class="relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div style="position:absolute;top:30%;left:10%;width:300px;height:300px;background:rgba(37,99,235,0.07);border-radius:50%;filter:blur(60px);"></div>
        <div style="position:absolute;bottom:0;right:10%;width:400px;height:400px;background:rgba(37,99,235,0.04);border-radius:50%;filter:blur(80px);"></div>
      </div>
      <div class="max-w-4xl mx-auto px-6 text-center relative z-10">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
          style="background:rgba(37,99,235,0.15);border:1px solid rgba(37,99,235,0.3);color:#93c5fd;">
          Tentang EMLearn Hub
        </div>
        <h1 class="font-bold text-white mb-4" style="font-size:2.5rem;line-height:1.2;">
          Platform Pembelajaran<br/>
          <span style="color:#3b82f6;">Mekanik Motor Bensin</span>
        </h1>
        <p class="text-base leading-relaxed max-w-2xl mx-auto" style="color:#94a3b8;">
          EMLearn Hub adalah platform pembelajaran digital terintegrasi yang dirancang khusus untuk
          mata kuliah Mekanik Motor Bensin. Menggabungkan teori, video, praktikum, dan evaluasi
          dalam satu sistem yang mudah diakses kapan saja dan di mana saja.
        </p>
        <div class="flex items-center justify-center gap-4 mt-8">
          <button @click="router.push('/materi')"
            class="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-blue-700"
            style="background:#2563eb;color:#fff;">
            <img src="/icons/materi.png" class="w-5 h-5 inline-block object-contain" alt="" /> Mulai Belajar
          </button>
          <button @click="router.push('/kuis-global')"
            class="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/10"
            style="border:1px solid rgba(255,255,255,0.2);color:#e2e8f0;">
            <img src="/icons/kuis.png" class="w-5 h-5 inline-block object-contain" alt="" /> Coba Evaluasi Akhir
          </button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div style="background:#fff;border-bottom:1px solid #e2e8f0;">
      <div class="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="s in stats" :key="s.label" class="text-center">
          <div class="text-3xl mb-2"><template v-if="s.icon?.startsWith('/')"><img :src="s.icon" class="w-5 h-5 inline-block object-contain align-middle" alt="" /></template><template v-else>{{ s.icon }}</template></div>
          <p class="font-bold text-3xl mb-1" style="color:#2563eb;">{{ s.value }}</p>
          <p class="text-sm" style="color:#64748b;">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-6 py-16 space-y-16">

      <!-- About section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 class="font-bold text-2xl mb-4" style="color:#0f172a;">Apa itu EMLearn Hub?</h2>
          <div class="space-y-4 text-sm leading-relaxed" style="color:#475569;">
            <p>
              EMLearn Hub (Engine Mechanics Learning Hub) adalah sistem pembelajaran berbasis web yang
              dikembangkan untuk mendukung proses belajar-mengajar mata kuliah Mekanik Motor Bensin
              di lingkungan akademik.
            </p>
            <p>
              Platform ini memungkinkan mahasiswa untuk mengakses materi kuliah, menonton video
              penjelasan, mengunduh jobsheet praktikum, dan mengerjakan evaluasi — semuanya dalam
              satu platform yang terintegrasi.
            </p>
          </div>
        </div>
        <div class="rounded-2xl p-8 flex flex-col gap-4" style="background:#0d1526;">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" 
              style="background: linear-gradient(135deg, #ffffff, #f3f4f6);">
              <img src="/logo.png" alt="Logo" class="w-full h-full object-cover" />
            </div>
            <div>
              <p class="font-bold text-white">EMLearn Hub</p>
              <p class="text-xs" style="color:#64748b;">Engine Mechanics Learning Hub</p>
            </div>
          </div>
          <div class="space-y-3">
            <div v-for="(s, i) in ['Sistem Terintegrasi', 'Video Interaktif', 'Jobsheet Terstruktur', 'Evaluasi Pembelajaran']" :key="i"
              class="flex items-center gap-3 p-3 rounded-xl" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);">
              <span class="text-green-400">✓</span>
              <span class="text-sm text-white">{{ s }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div>
        <div class="text-center mb-10">
          <h2 class="font-bold text-2xl mb-2" style="color:#0f172a;">Fitur Unggulan</h2>
          <p style="color:#64748b;">Semua yang kamu butuhkan untuk belajar mekanik motor bensin</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div v-for="f in features.slice(0, 3)" :key="f.title"
            class="rounded-2xl p-6" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" :style="`background:${f.color};`">
              <template v-if="f.icon?.startsWith('/')"><img :src="f.icon" class="w-8 h-8 object-contain" alt="" /></template><template v-else>{{ f.icon }}</template>
            </div>
            <h3 class="font-bold mb-2" style="color:#0f172a;">{{ f.title }}</h3>
            <p class="text-sm leading-relaxed" style="color:#64748b;">{{ f.desc }}</p>
          </div>
        </div>
        <div class="flex justify-center gap-5 mt-5 flex-wrap">
          <div v-for="f in features.slice(3)" :key="f.title"
            class="rounded-2xl p-6 w-full sm:w-auto sm:flex-1 lg:max-w-xs"
            style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" :style="`background:${f.color};`">
              <template v-if="f.icon?.startsWith('/')"><img :src="f.icon" class="w-8 h-8 object-contain" alt="" /></template><template v-else>{{ f.icon }}</template>
            </div>
            <h3 class="font-bold mb-2" style="color:#0f172a;">{{ f.title }}</h3>
            <p class="text-sm leading-relaxed" style="color:#64748b;">{{ f.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Topics -->
      <div>
        <div class="text-center mb-10">
          <h2 class="font-bold text-2xl mb-2" style="color:#0f172a;">Topik yang Dipelajari</h2>
          <p style="color:#64748b;">8 topik utama mekanik motor bensin yang tersusun sistematis</p>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="t in topics" :key="t.name"
            @click="router.push('/materi')"
            class="rounded-2xl p-5 text-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
            style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div class="text-4xl mb-3"><template v-if="t.icon?.startsWith('/')"><img :src="t.icon" class="w-5 h-5 inline-block object-contain align-middle" alt="" /></template><template v-else>{{ t.icon }}</template></div>
            <p class="font-bold text-sm mb-1" style="color:#0f172a;">{{ t.name }}</p>
            <p class="text-xs" style="color:#94a3b8;">{{ t.count }} Materi</p>
          </div>
        </div>
      </div>

      <!-- How to use -->
      <div class="rounded-2xl p-8" style="background:#0d1526;">
        <div class="text-center mb-8">
          <h2 class="font-bold text-2xl mb-2 text-white">Cara Menggunakan EMLearn Hub</h2>
          <p style="color:#94a3b8;">Ikuti langkah berikut untuk pengalaman belajar terbaik</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div v-for="(step, i) in [
            { num:'01', icon: '/icons/modul.png', title:'Pilih Topik', desc:'Pilih topik materi yang ingin dipelajari dari daftar yang tersedia' },
            { num:'02', icon: '/icons/materi.png', title:'Pelajari Materi', desc:'Baca materi teks dan tonton video penjelasan yang mudah dipahami' },
            { num:'03', icon: '/icons/jobsheet.png', title:'Praktikum', desc:'Unduh dan kerjakan jobsheet praktikum sesuai panduan yang diberikan' },
            { num:'04', icon: '/icons/kuis.png', title:'Evaluasi', desc:'Kerjakan evaluasi untuk mengukur pemahaman dan pantau progressmu' },
          ]" :key="i"
            class="p-5 rounded-2xl" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
            <div class="font-bold text-4xl mb-3" style="color:rgba(37,99,235,0.4);">{{ step.num }}</div>
            <div class="text-3xl mb-3"><template v-if="step.icon?.startsWith('/')"><img :src="step.icon" class="w-8 h-8 object-contain" alt="" /></template><template v-else>{{ step.icon }}</template></div>
            <h3 class="font-bold text-white mb-2">{{ step.title }}</h3>
            <p class="text-sm" style="color:#94a3b8;">{{ step.desc }}</p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="rounded-2xl p-10 text-center" style="background:linear-gradient(135deg,#1e40af,#2563eb);">
        <h2 class="font-bold text-2xl text-white mb-3">Siap Mulai Belajar?</h2>
        <p class="text-blue-100 mb-8">Akses semua materi, video, jobsheet dan evaluasi</p>
        <div class="flex items-center justify-center gap-4 flex-wrap">
          <button @click="router.push('/materi')" class="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/90" style="background:#fff;color:#2563eb;">
            <img src="/icons/materi.png" class="w-5 h-5 inline-block object-contain" alt="" /> Mulai Belajar Sekarang
          </button>
          <button @click="router.push('/kuis-global')" class="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/10" style="border:2px solid rgba(255,255,255,0.4);color:#fff;">
            <img src="/icons/kuis.png" class="w-5 h-5 inline-block object-contain" alt="" /> Coba Evaluasi Akhir
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer style="background:#0d1526;border-top:1px solid rgba(255,255,255,0.06);">
      <div class="max-w-7xl mx-auto px-6 py-8 text-center">
        <div class="flex items-center justify-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-xl flex items-center justify-center" 
          style="background: linear-gradient(135deg, #ffffff, #f3f4f6);">
          <img src="/logo.png" alt="Logo" class="w-full h-full object-cover" />
        </div>
          <span class="font-bold text-white">EMLearn Hub</span>
        </div>
        <p style="color:#475569;font-size:0.875rem;">Platform Media Pembelajaran Mekanik Motor Bensin</p>
      </div>
    </footer>
  </div>
</template>
