<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import PublicNavbar from '../../components/PublicNavbar.vue'

const store = useStore()
const router = useRouter()

const modules = computed(() => store.modules)

onMounted(() => {
  store.fetchModules()
  store.fetchMaterials()
})


const features = [
  { icon: '/icons/sistem.png', title: 'Sistem Terintegrasi', desc: 'Semua kebutuhan belajar dalam satu platform' },
  { icon: '/icons/video.png', title: 'Video Interaktif',    desc: 'Pembelajaran visual yang mudah dipahami' },
  { icon: '/icons/jobsheet.png', title: 'Praktikum Terstruktur', desc: 'Jobsheet sistematis untuk keterampilan praktik' },
  { icon: '/icons/soal.png', title: 'Evaluasi', desc: 'Uji pemahaman dan pantau perkembangan belajar' },
]

// const highlights = [
//   { icon: '🕐', title: 'Akses Fleksibel',   desc: 'Belajar kapan saja dan di mana saja' },
//   { icon: '📱', title: 'Multi Perangkat',   desc: 'Dapat diakses melalui PC, tablet, dan smartphone' },
//   { icon: '🛡️', title: 'Materi Berkualitas', desc: 'Disusun oleh dosen dan praktisi berpengalaman' },
//   { icon: '👥', title: 'Untuk Mahasiswa',   desc: 'Cocok untuk pembelajaran mandiri dan kelas' },
// ]

const learningSteps = [
  { num: 1, icon: '/icons/materi.png', title: 'Materi',    desc: 'Pelajari konsep teori dan sistem mekanik motor bensin.', bg: '#eff6ff', to: '/materi' },
  { num: 2, icon: '/icons/video.png', title: 'Video',     desc: 'Tonton video penjelasan dan demonstrasi yang mudah dipahami.', bg: '#f0fdf4', to: '/video' },
  { num: 3, icon: '/icons/jobsheet.png', title: 'Jobsheet',  desc: 'Ikuti langkah-langkah praktikum dengan jobsheet terstruktur.', bg: '#fff7ed', to: '/jobsheet' },
  { num: 4, icon: '/icons/kuis.png', title: 'Evaluasi',  desc: 'Kerjakan evaluasi untuk mengukur pemahaman Anda.', bg: '#faf5ff', to: '/kuis-global' },
  { num: 5, icon: '/icons/progress.png', title: 'Progress',  desc: 'Pantau perkembangan belajar Anda secara real-time.', bg: '#f0fdf4', to: null },
]
</script>

<template>
  <div class="min-h-screen" style="background-color:#0a0f1e; color:#f1f5f9;">

    <PublicNavbar active="beranda" />

    <!-- HERO -->
    <section style="background:linear-gradient(135deg,#0d1526 0%,#0f1f3d 50%,#0d1526 100%); min-height:420px;" class="relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div style="position:absolute;top:60px;left:80px;width:250px;height:250px;background:rgba(37,99,235,0.07);border-radius:50%;filter:blur(50px);"></div>
        <div style="position:absolute;bottom:0;right:100px;width:350px;height:350px;background:rgba(37,99,235,0.04);border-radius:50%;filter:blur(70px);"></div>
      </div>
      <div class="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-3 gap-10 items-center relative z-10">
        <!-- Left -->
        <div class="lg:col-span-1">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style="background:rgba(37,99,235,0.15);border:1px solid rgba(37,99,235,0.3);color:#93c5fd;">
            Selamat datang di EMLearn Hub
          </div>
          <h1 class="font-bold text-white mb-4" style="font-size:2.4rem;line-height:1.15;">
            Belajar Mekanik Motor Bensin<br/>
            <span style="color:#3b82f6;">Lebih Terintegrasi</span>
          </h1>
          <p class="text-sm leading-relaxed mb-8" style="color:#94a3b8;">
            Platform pembelajaran terintegrasi yang menggabungkan teori, video pembelajaran, jobsheet praktikum, dan evaluasi dalam satu sistem.
          </p>
          <div class="flex items-center gap-3 flex-wrap">
            <button @click="router.push('/materi')"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-blue-700"
              style="background:#2563eb;color:#fff;">
              <img src="/icons/materi.png" class="w-5 h-5 inline-block object-contain" alt="" /> Mulai Belajar
            </button>
            <button @click="router.push('/materi')"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/10"
              style="border:1px solid rgba(255,255,255,0.2);color:#e2e8f0;">
              ▶ Jelajahi Materi
            </button>
          </div>
        </div>

        <!-- Container Utama (Pastikan parent menggunakan flex atau grid) -->
        <div class="flex justify-center items-center relative w-full h-[400px]">
          
          <!-- Gambar Mesin yang Dibuat Menonjol -->
          <div class="relative z-10 cursor-pointer transition-all duration-500 hover:scale-110"
              @click="router.push('/materi')">
            
            <!-- Efek Cahaya/Glow di Belakang Mesin (Opsional agar mirip Gambar 2) -->
            <div class="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>

            <!-- Gambar Mesin -->
            <img src="/mesin_mobil.png" 
                alt="Materi Mesin" 
                class="w-[450px] h-auto object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)]" />
          </div>
        </div>

        <!-- Right feature list -->
        <div class="space-y-3">
          <div v-for="f in features" :key="f.title"
            class="flex items-start gap-3 p-4 rounded-xl"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
            <span class="text-2xl flex-shrink-0"><template v-if="f.icon?.startsWith('/')"><img :src="f.icon" class="w-8 h-8 object-contain" alt="" /></template><template v-else>{{ f.icon }}</template></span>
            <div>
              <p class="font-semibold text-white text-sm">{{ f.title }}</p>
              <p class="text-xs mt-0.5" style="color:#64748b;">{{ f.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- HIGHLIGHTS BAR
    <section style="background:#fff;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
      <div class="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="h in highlights" :key="h.title" class="flex items-start gap-3">
          <span class="text-2xl flex-shrink-0"><template v-if="h.icon?.startsWith('/')"><img :src="h.icon" class="w-8 h-8 object-contain" alt="" /></template><template v-else>{{ h.icon }}</template></span>
          <div>
            <p class="font-semibold text-sm" style="color:#0f172a;">{{ h.title }}</p>
            <p class="text-xs mt-1" style="color:#64748b;">{{ h.desc }}</p>
          </div>
        </div>
      </div>
    </section> -->

    <!-- INTEGRATED LEARNING SYSTEM -->
    <section style="background:#f8fafc;">
      <div class="max-w-7xl mx-auto px-6 py-16">
        <div class="text-center mb-12">
          <h2 class="font-bold text-2xl mb-2" style="color:#0f172a;">Integrated Learning System</h2>
          <p style="color:#64748b;">Alur pembelajaran terintegrasi untuk pemahaman yang lebih efektif</p>
        </div>
        <div class="flex flex-wrap lg:flex-nowrap items-stretch gap-3">
          <template v-for="(step, i) in learningSteps" :key="step.num">
            <div
              class="flex-1 min-w-[140px] rounded-2xl p-5 text-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
              style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);"
              @click="step.to ? router.push(step.to) : null"
            >
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3" :style="`background:${step.bg};`">
                <template v-if="step.icon?.startsWith('/')"><img :src="step.icon" class="w-8 h-8 object-contain" alt="" /></template><template v-else>{{ step.icon }}</template>
              </div>
              <p class="font-bold text-sm mb-1" style="color:#0f172a;">{{ step.num }}. {{ step.title }}</p>
              <p class="text-xs leading-relaxed" style="color:#64748b;">{{ step.desc }}</p>
            </div>
            <div v-if="i < 4" class="hidden lg:flex items-center flex-shrink-0">
              <span style="color:#94a3b8;font-size:1.4rem;">→</span>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- TOPIK MATERI -->
    <section id="materi" style="background:#f8fafc;border-top:1px solid #e2e8f0;">
      <div class="max-w-7xl mx-auto px-6 py-16">
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-bold text-2xl" style="color:#0f172a;">Topik Materi</h2>
          <button @click="router.push('/materi')"
            class="text-sm font-semibold flex items-center gap-1 transition-colors hover:text-blue-700"
            style="color:#2563eb;">
            Lihat Semua Materi →
          </button>
        </div>

        <div v-if="store.loading" class="grid grid-cols-2 lg:grid-cols-5 gap-5">
          <div v-for="i in 5" :key="i" class="rounded-2xl overflow-hidden animate-pulse" style="background:#e2e8f0;height:220px;"></div>
        </div>

        <div v-else-if="modules.length === 0" class="text-center py-20">
          <span style="font-size:4rem;">⚙️</span>
          <p class="font-semibold mt-4 mb-2" style="color:#475569;">Belum Ada Modul</p>
          <p style="color:#94a3b8;font-size:0.875rem;">Admin belum menambahkan modul pembelajaran.</p>
        </div>

        <div v-else class="grid grid-cols-2 lg:grid-cols-5 gap-5">
          <div v-for="(mod, idx) in modules.slice(0, 5)" :key="mod.id"
            @click="router.push(`/modul/${mod.id}`)"
            class="rounded-2xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-lg"
            style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);">
            <div class="relative h-36 flex items-center justify-center overflow-hidden" style="background:linear-gradient(135deg,#1e293b,#334155);">
              <img
                :src="mod.image_url || '/icons/modul.png'"
                :alt="mod.name"
                class="w-full h-full object-cover"
                @error="(e) => e.target.src = '/icons/modul.png'"
              />
              <div class="absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style="background:rgba(37,99,235,0.85);">
                {{ String(idx+1).padStart(2,'0') }}
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-bold text-sm text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">{{ mod.name }}</h3>
              <div class="flex items-center justify-between">
                <span class="text-xs flex items-center gap-1" style="color:#64748b;">
                  <img src="/icons/materi.png" class="w-5 h-5 inline-block object-contain" alt="" /> {{ store.getMaterialsByModule(mod.name).length }} Materi
                </span>
                <button class="px-2.5 py-1 rounded-lg text-xs font-semibold" style="background:#2563eb;color:#fff;">
                  Lihat Materi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- QUICK LINKS SECTION -->
    <section style="background:#fff;border-top:1px solid #e2e8f0;">
      <div class="max-w-7xl mx-auto px-6 py-14">
        <div class="text-center mb-10">
          <h2 class="font-bold text-2xl mb-2" style="color:#0f172a;">Akses Cepat</h2>
          <p style="color:#64748b;">Langsung menuju konten yang kamu butuhkan</p>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div v-for="link in [
            { icon: '/icons/materi.png', title:'Materi', desc:'Baca teori & modul', to:'/materi', color:'#eff6ff', iconColor:'#2563eb' },
            { icon: '/icons/video.png', title:'Video', desc:'Tonton video pembelajaran', to:'/video', color:'#f0fdf4', iconColor:'#22c55e' },
            { icon: '/icons/jobsheet.png', title:'Jobsheet', desc:'Unduh lembar praktikum', to:'/jobsheet', color:'#fff7ed', iconColor:'#f97316' },
            { icon: '/icons/kuis.png', title:'Evaluasi', desc:'Kerjakan Evaluasi', to:'/kuis-global', color:'#faf5ff', iconColor:'#a855f7' },
          ]" :key="link.title"
            @click="router.push(link.to)"
            class="rounded-2xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
            style="border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);"
            :style="`background:${link.color};border-color:${link.color};`"
          >
            <div class="text-4xl mb-3"><template v-if="link.icon?.startsWith('/')"><img :src="link.icon" class="w-5 h-5 inline-block object-contain align-middle" alt="" /></template><template v-else>{{ link.icon }}</template></div>
            <h3 class="font-bold mb-1" :style="`color:${link.iconColor};`">{{ link.title }}</h3>
            <p class="text-xs" style="color:#64748b;">{{ link.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer style="background:#0d1526;border-top:1px solid rgba(255,255,255,0.06);">
      <div class="max-w-7xl mx-auto px-6 py-10">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center" 
              style="background: linear-gradient(135deg, #ffffff, #f3f4f6);">
              <img src="/logo.png" alt="Logo" class="w-full h-full object-cover" />
            </div>
            <div>
              <span class="font-bold text-white">EMLearn Hub</span>
              <p class="text-xs" style="color:#475569;">Platform Media Pembelajaran Mekanik Motor Bensin</p>
            </div>
          </div>
          <div class="flex items-center gap-6">
            <button v-for="item in [{label:'Materi',to:'/materi'},{label:'Video',to:'/video'},{label:'Jobsheet',to:'/jobsheet'},{label:'Evaluasi',to:'/kuis-global'},{label:'Tentang',to:'/tentang'}]"
              :key="item.label" @click="router.push(item.to)"
              class="text-sm transition-colors hover:text-white" style="color:#475569;">
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
