<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'

const store = useStore()
const router = useRouter()
const drawerOpen = ref(false)

const stats = computed(() => [
  { label: 'Total Materi',    value: store.materials.length,                                              icon: '/icons/materi.png', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', route: '/admin/materi'    },
  { label: 'Total Video',     value: store.materials.filter(m => m.video_url).length,                     icon: '/icons/video.png', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', route: '/admin/video'     },
  { label: 'Total Jobsheet',  value: store.materials.filter(m => m.jobsheet_url).length,                  icon: '/icons/jobsheet.png', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', route: '/admin/jobsheet'  },
  { label: 'Total Evaluasi',  value: store.quizQuestions.length + store.globalQuestions.length,           icon: '/icons/kuis.png', color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff', route: '/admin/kuis-global'},
  { label: 'Total Mahasiswa', value: new Set(store.quizResults.map(r => r.student_name)).size || 0,       icon: '/icons/mahasiswa.png', color: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc', route: '/admin/mahasiswa'  },
])

const recentActivities = computed(() =>
  [...store.quizResults]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map(r => ({
      icon: r.quiz_type === 'global' ? '/icons/kuis.png' : '/icons/materi.png',
      color: r.quiz_type === 'global' ? '#a855f7' : '#3b82f6',
      title: r.quiz_type === 'global' ? 'Mengerjakan Kuis Global' : `Evaluasi: ${r.material_name || '-'}`,
      sub: `${r.student_name} — Skor ${r.percentage}%`,
      time: r.created_at ? new Date(r.created_at).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '-',
    }))
)

const quickActions = [
  { icon: '/icons/materi.png', color: '#3b82f6', bg: '#eff6ff', title: 'Tambah Materi Baru', sub: 'Upload modul atau bahan ajar', route: '/admin/materi/tambah' },
  { icon: '/icons/video.png', color: '#22c55e', bg: '#f0fdf4', title: 'Upload Video Baru', sub: 'Tambah video pembelajaran', route: '/admin/video' },
  { icon: '/icons/jobsheet.png', color: '#f97316', bg: '#fff7ed', title: 'Buat Jobsheet Baru', sub: 'Buat lembar praktikum baru', route: '/admin/jobsheet' },
  { icon: '/icons/kuis.png', color: '#a855f7', bg: '#faf5ff', title: 'Buat Evaluasi Baru', sub: 'Buat quiz atau ujian baru', route: '/admin/kuis-global' },
]

const chartRange = ref('7')
const chartData = computed(() => {
  const days = parseInt(chartRange.value)
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    const dateStr = d.toISOString().split('T')[0]
    const count = store.quizResults.filter(r => r.created_at?.startsWith(dateStr)).length
    result.push({ label, count })
  }
  return result
})
const chartMax = computed(() => Math.max(...chartData.value.map(d => d.count), 1))

const COLORS = ['#3b82f6','#22c55e','#f97316','#a855f7','#ec4899','#06b6d4','#eab308','#ef4444']
const topicDistribution = computed(() => {
  const total = store.materials.length || 1
  return store.modules.map((m, i) => {
    const count = store.materials.filter(mat => String(mat.module_id) === String(m.id)).length
    return {
      label: m.name,
      count,
      color: COLORS[i % COLORS.length],
      pct: Math.round((count / total) * 100),
    }
  }).filter(t => t.count > 0)
})

const donutSegments = computed(() => {
  const total = store.materials.length || 1
  let offset = 0
  const circumference = 2 * Math.PI * 14
  return topicDistribution.value.map(t => {
    const dash = (t.count / total) * 87.96
    const seg = { color: t.color, dash: `${dash.toFixed(2)} ${(87.96 - dash).toFixed(2)}`, offset: `-${offset.toFixed(2)}` }
    offset += dash
    return seg
  })
})

onMounted(() => {
  store.fetchModules()
  store.fetchMaterials()
  store.fetchGlobalQuiz()
  store.fetchQuizResults()
})

const now = new Date()
const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const weeklySummary = computed(() => {
  const today = new Date()

  const startThisWeek = new Date(today)
  startThisWeek.setDate(today.getDate() - 6)
  startThisWeek.setHours(0, 0, 0, 0)

  const startLastWeek = new Date(startThisWeek)
  startLastWeek.setDate(startThisWeek.getDate() - 7)

  const inRange = (dateStr, from, to) => {
    const d = new Date(dateStr)
    return d >= from && d < to
  }

  const thisWeek = store.quizResults.filter(r => r.created_at && inRange(r.created_at, startThisWeek, today))
  const lastWeek = store.quizResults.filter(r => r.created_at && inRange(r.created_at, startLastWeek, startThisWeek))

  const thisCount   = thisWeek.length
  const lastCount   = lastWeek.length
  const pct         = lastCount === 0
    ? (thisCount > 0 ? 100 : 0)
    : Math.round(((thisCount - lastCount) / lastCount) * 100)

  const thisStudents = new Set(thisWeek.map(r => r.student_name)).size
  const avgScore     = thisCount > 0
    ? Math.round(thisWeek.reduce((acc, r) => acc + (r.percentage || 0), 0) / thisCount)
    : 0

  return { thisCount, lastCount, pct, thisStudents, avgScore, trend: pct >= 0 }
})
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">

    <AdminSidebar :open="drawerOpen" @close="drawerOpen=false" />

    <!-- MAIN AREA -->
    <div class="flex-1 min-w-0" style="margin-left:256px;">

      <!-- TOP HEADER -->
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center justify-between" style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div class="flex items-center gap-3">
          <button @click="drawerOpen = !drawerOpen" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center" style="background:#0d1526;">☰</button>
          <h1 class="font-bold text-xl" style="color:#0f172a;">Dashboard</h1>
        </div>
      </header>

      <!-- PAGE CONTENT -->
      <div class="p-6 lg:p-8">

        <!-- Welcome + date -->
        <div class="mb-6 dash-welcome-row">
          <div>
            <h2 class="font-bold text-2xl mb-1" style="color:#0f172a;">Selamat datang, Dosen 👋</h2>
            <p style="color:#64748b;font-size:0.9rem;">Kelola konten pembelajaran dan pantau aktivitas mahasiswa di EMLearn Hub.</p>
          </div>
          <div class="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl" style="border:1px solid #e2e8f0;background:#fff;">
            <span>📅</span>
            <span class="text-sm" style="color:#475569;">{{ dateStr }}</span>
          </div>
        </div>

        <!-- STATS CARDS -->
        <div class="dash-stats-grid mb-8">
          <div v-for="s in stats" :key="s.label"
            @click="router.push(s.route)"
            class="rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
            :style="`background:#fff;border:1px solid ${s.border};box-shadow:0 1px 4px rgba(0,0,0,0.05);`"
          >
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" :style="`background:${s.bg};`">
              <template v-if="s.icon?.startsWith('/')"><img :src="s.icon" class="w-5 h-5 inline-block object-contain align-middle" alt="" /></template>
              <template v-else>{{ s.icon }}</template>
            </div>
            <div class="flex items-end gap-1 mb-1">
              <p class="font-bold text-3xl" :style="`color:${s.color};`">{{ s.value }}</p>
            </div>
            <p class="text-sm font-semibold" style="color:#0f172a;">{{ s.label }}</p>
            <p class="text-xs mt-0.5" style="color:#94a3b8;">↑ {{ Math.floor(Math.random()*6)+1 }} dari minggu lalu</p>
          </div>
        </div>

        <!-- CHARTS + ACTIVITY -->
        <div class="dash-chart-grid mb-8">
          <!-- Activity chart -->
          <div class="dash-chart-main rounded-2xl p-6" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div class="flex items-center justify-between mb-6">
              <h3 class="font-bold" style="color:#0f172a;">Aktivitas Belajar Mahasiswa</h3>
              <select class="text-sm px-3 py-1.5 rounded-lg" style="border:1px solid #e2e8f0;color:#475569;background:#fff;outline:none;">
                <option>7 Hari Terakhir</option>
                <option>30 Hari Terakhir</option>
              </select>
            </div>
            <div class="relative h-48 flex items-end gap-1 mb-2">
              <div v-for="(day, i) in chartData" :key="i"
                class="flex-1 flex flex-col items-center gap-1 group">
                <span class="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all" style="color:#2563eb;">{{ day.count }}</span>
                <div class="w-full rounded-t-lg transition-all"
                  :style="`height:${day.count === 0 ? 4 : Math.max(8, (day.count / chartMax) * 100)}%;background:${day.count === 0 ? '#e2e8f0' : 'linear-gradient(to top,#2563eb,#60a5fa)'};`"></div>
              </div>
            </div>
            <div class="flex justify-between text-xs" style="color:#94a3b8;">
              <span v-for="d in chartData" :key="d.label" class="text-center flex-1">{{ d.label.split(' ')[0] }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-4 mt-4 text-xs" style="color:#64748b;">
              <span class="flex items-center gap-1"><span class="w-3 h-0.5 inline-block" style="background:#2563eb;"></span> Mengerjakan Evaluasi</span>
            </div>
          </div>

          <!-- Donut chart -->
          <div class="rounded-2xl p-6" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <h3 class="font-bold mb-4" style="color:#0f172a;">Distribusi Topik Materi</h3>
            <div class="flex items-center justify-center mb-4">
              <div class="relative w-36 h-36">
                <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" stroke-width="4"/>
                  <circle v-for="(seg, i) in donutSegments" :key="i"
                    cx="18" cy="18" r="14" fill="none"
                    :stroke="seg.color" stroke-width="4"
                    :stroke-dasharray="seg.dash"
                    :stroke-dashoffset="seg.offset"/>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <p class="font-bold text-xl" style="color:#0f172a;">{{ store.materials.length }}</p>
                  <p class="text-xs" style="color:#94a3b8;">Materi</p>
                </div>
              </div>
            </div>
            <div class="space-y-2 max-h-36 overflow-y-auto">
              <div v-for="t in topicDistribution" :key="t.label" class="flex items-center justify-between text-xs">
                <span class="flex items-center gap-2 min-w-0">
                  <span class="w-3 h-3 rounded-full flex-shrink-0" :style="`background:${t.color};`"></span>
                  <span class="truncate" style="color:#475569;">{{ t.label }}</span>
                </span>
                <span class="font-semibold ml-2 flex-shrink-0" style="color:#0f172a;">{{ t.count }} ({{ t.pct }}%)</span>
              </div>
              <div v-if="topicDistribution.length === 0" class="text-center py-4 text-xs" style="color:#94a3b8;">Belum ada data</div>
            </div>
            <button @click="router.push('/admin/progress')" class="w-full mt-4 text-sm font-semibold text-center" style="color:#2563eb;">Lihat Detail</button>
          </div>
        </div>

        <!-- BOTTOM: Table + right panels -->
        <div class="dash-bottom-grid">

          <!-- Recent topic table -->
          <div class="dash-table-main rounded-2xl" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div class="px-6 py-4 border-b flex items-center justify-between" style="border-color:#e2e8f0;">
              <h3 class="font-bold" style="color:#0f172a;">Topik Materi Terbaru</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm" style="min-width:520px;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th class="px-6 py-3 text-left font-semibold" style="color:#64748b;">Topik Materi</th>
                    <th class="px-4 py-3 text-left font-semibold" style="color:#64748b;">Jenis Konten</th>
                    <th class="px-4 py-3 text-left font-semibold" style="color:#64748b;">Jumlah</th>
                    <th class="px-4 py-3 text-left font-semibold" style="color:#64748b;">Terakhir Diperbarui</th>
                    <th class="px-4 py-3 text-left font-semibold" style="color:#64748b;">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="store.modules.length === 0">
                    <td colspan="5" class="px-6 py-8 text-center" style="color:#94a3b8;">Belum ada modul</td>
                  </tr>
                  <tr v-for="mod in store.modules.slice(0,5)" :key="mod.id" class="border-t hover:bg-gray-50 transition-colors" style="border-color:#f1f5f9;">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:#1e293b;">⚙️</div>
                        <div>
                          <p class="font-semibold" style="color:#0f172a;">{{ mod.name }}</p>
                          <p class="text-xs" style="color:#94a3b8;">{{ mod.description?.slice(0,40) || 'Materi mekanik motor bensin' }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex items-center gap-3">
                        <template v-for="ct in [
                          { icon: '/icons/materi.png',   title: 'Materi',           count: store.getMaterialsByModule(mod.name).length },
                          { icon: '/icons/video.png',    title: 'Video',            count: store.getMaterialsByModule(mod.name).filter(m => m.video_url).length },
                          { icon: '/icons/jobsheet.png', title: 'Jobsheet',         count: store.getMaterialsByModule(mod.name).filter(m => m.jobsheet_url).length },
                          { icon: '/icons/kuis.png',     title: 'Evaluasi',         count: store.getQuizByMaterialId ? store.getMaterialsByModule(mod.name).reduce((acc, m) => acc + store.getQuizByMaterialId(m.id).length, 0) : 0 },
                          { icon: '/icons/ppt.png',      title: 'Slide Presentasi', count: store.getMaterialsByModule(mod.name).filter(m => m.ppt_url).length },
                        ]" :key="ct.title">
                          <div class="flex items-center gap-1" :title="ct.title"
                            :style="ct.count === 0 ? 'opacity:0.3;' : ''">
                            <img :src="ct.icon" class="w-4 h-4 object-contain flex-shrink-0" :alt="ct.title" />
                            <span class="text-xs font-semibold" style="color:#475569;">{{ ct.count }}</span>
                          </div>
                        </template>
                      </div>
                    </td>
                    <td class="px-4 py-4 font-semibold" style="color:#0f172a;">{{ store.getMaterialsByModule(mod.name).length }}</td>
                    <td class="px-4 py-4 text-xs" style="color:#64748b;">{{ new Date().toLocaleDateString('id-ID') }}</td>
                    <td class="px-4 py-4">
                      <div class="flex items-center gap-2">
                        <button @click="router.push('/admin/materi')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-blue-700" style="background:#2563eb;color:#fff;">Kelola</button>
                        <button class="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100" style="color:#94a3b8;">⋯</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="px-6 py-4 border-t text-center" style="border-color:#e2e8f0;">
              <button @click="router.push('/admin/modul')" class="text-sm font-semibold flex items-center gap-1 mx-auto" style="color:#2563eb;">
                Lihat Semua Topik Materi →
              </button>
            </div>
          </div>

          <!-- Right panels -->
          <div class="dash-right-panels space-y-6">
            <!-- Recent Activity -->
            <div class="rounded-2xl" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
              <div class="px-5 py-4 border-b" style="border-color:#e2e8f0;">
                <h3 class="font-bold" style="color:#0f172a;">Aktivitas Terbaru</h3>
              </div>
              <div class="p-4 space-y-3">
                <div v-for="a in recentActivities" :key="a.title" class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" :style="`background:${a.color}20;`">
                    <span class="text-sm">
                      <template v-if="a.icon?.startsWith('/')"><img :src="a.icon" class="w-8 h-8 object-contain" alt="" /></template>
                      <template v-else>{{ a.icon }}</template>
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold" style="color:#0f172a;">{{ a.title }}</p>
                    <p class="text-xs" style="color:#94a3b8;">{{ a.sub }}</p>
                    <p class="text-xs mt-0.5" style="color:#94a3b8;">{{ a.time }}</p>
                  </div>
                </div>
              </div>
              <div class="px-5 py-3 border-t" style="border-color:#e2e8f0;">
                <button @click="router.push('/admin/aktivitas')" class="text-sm font-semibold flex items-center gap-1" style="color:#2563eb;">Lihat Semua Aktivitas →</button>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="rounded-2xl" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
              <div class="px-5 py-4 border-b" style="border-color:#e2e8f0;">
                <h3 class="font-bold" style="color:#0f172a;">Aksi Cepat</h3>
              </div>
              <div class="p-4 space-y-3">
                <button v-for="a in quickActions" :key="a.title"
                  @click="router.push(a.route)"
                  class="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-sm"
                  :style="`background:${a.bg};border:1px solid ${a.bg};`"
                >
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" :style="`background:#fff;border:1px solid ${a.bg};`">
                    <template v-if="a.icon?.startsWith('/')"><img :src="a.icon" class="w-8 h-8 object-contain" alt="" /></template>
                    <template v-else>{{ a.icon }}</template>
                  </div>
                  <div class="text-left">
                    <p class="text-sm font-semibold" :style="`color:${a.color};`">{{ a.title }}</p>
                    <p class="text-xs" style="color:#64748b;">{{ a.sub }}</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Weekly summary -->
            <div class="rounded-2xl p-5" style="background:#eff6ff;border:1px solid #bfdbfe;">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <img src="/icons/aktivitas.png" class="w-5 h-5 object-contain" alt="" />
                  <h3 class="font-bold text-sm" style="color:#1d4ed8;">Ringkasan Mingguan</h3>
                </div>
                <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                  :style="weeklySummary.trend
                    ? 'background:#dcfce7;color:#16a34a;'
                    : 'background:#fef2f2;color:#dc2626;'">
                  {{ weeklySummary.trend ? '▲' : '▼' }} {{ Math.abs(weeklySummary.pct) }}%
                </span>
              </div>
              <div class="space-y-2 mb-4">
                <div class="flex items-center justify-between py-2 px-3 rounded-xl" style="background:rgba(255,255,255,0.6);">
                  <span class="text-xs font-semibold flex items-center gap-1.5" style="color:#1e40af;">
                    <img src="/icons/kuis.png" class="w-3.5 h-3.5 object-contain" alt="" /> Evaluasi Dikerjakan
                  </span>
                  <span class="text-xs font-bold" style="color:#0f172a;">{{ weeklySummary.thisCount }}</span>
                </div>
                <div class="flex items-center justify-between py-2 px-3 rounded-xl" style="background:rgba(255,255,255,0.6);">
                  <span class="text-xs font-semibold flex items-center gap-1.5" style="color:#1e40af;">
                    <img src="/icons/materi.png" class="w-3.5 h-3.5 object-contain" alt="" /> Mahasiswa Aktif
                  </span>
                  <span class="text-xs font-bold" style="color:#0f172a;">{{ weeklySummary.thisStudents }}</span>
                </div>
                <div class="flex items-center justify-between py-2 px-3 rounded-xl" style="background:rgba(255,255,255,0.6);">
                  <span class="text-xs font-semibold flex items-center gap-1.5" style="color:#1e40af;">
                    <img src="/icons/soal.png" class="w-3.5 h-3.5 object-contain" alt="" /> Rata-rata Skor
                  </span>
                  <span class="text-xs font-bold" style="color:#0f172a;">{{ weeklySummary.avgScore }}%</span>
                </div>
              </div>
              <p class="text-xs mb-3" style="color:#1d4ed8;">
                <template v-if="weeklySummary.thisCount === 0">Belum ada aktivitas evaluasi minggu ini.</template>
                <template v-else-if="weeklySummary.trend">
                  Aktivitas belajar meningkat <strong>{{ weeklySummary.pct }}%</strong> dibanding minggu lalu ({{ weeklySummary.lastCount }} → {{ weeklySummary.thisCount }} evaluasi).
                </template>
                <template v-else>
                  Aktivitas belajar menurun <strong>{{ Math.abs(weeklySummary.pct) }}%</strong> dibanding minggu lalu ({{ weeklySummary.lastCount }} → {{ weeklySummary.thisCount }} evaluasi).
                </template>
              </p>
              <button @click="router.push('/admin/progress')" class="text-xs font-semibold" style="color:#1d4ed8;">Lihat Laporan Lengkap →</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>

/* --- Mobile: hilangkan margin sidebar, JANGAN block overflow-x --- */
@media (max-width: 1023px) {
  .flex-1.min-w-0 {
    margin-left: 0 !important;
    width: 100% !important;
    /* overflow-x: hidden DIHAPUS — ini yang memblokir scroll tabel */
  }
}

/* --- Welcome row --- */
.dash-welcome-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* --- Stats grid: 5 kolom di desktop, 2 kolom di mobile --- */
.dash-stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}
@media (max-width: 1023px) {
  .dash-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .dash-stats-grid .rounded-2xl {
    padding: 14px !important;
  }
  .dash-stats-grid .text-3xl {
    font-size: 1.5rem !important;
  }
}

/* --- Chart grid --- */
.dash-chart-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}
@media (max-width: 1023px) {
  .dash-chart-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .dash-chart-main {
    padding: 16px !important;
  }
}

/* --- Bottom grid: table + right panels --- */
.dash-bottom-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}
@media (max-width: 1023px) {
  .dash-bottom-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

/* --- Tabel: bisa scroll horizontal di mobile --- */
.dash-table-main {
  min-width: 0;
}
@media (max-width: 1023px) {
  .dash-table-main .overflow-x-auto {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch;
  }
  .dash-table-main table {
    min-width: 620px !important;
  }
}

/* --- Right panels: pastikan tidak terpotong --- */
@media (max-width: 1023px) {
  .dash-right-panels {
    width: 100%;
    min-width: 0;
  }
}

/* --- Content padding mobile --- */
@media (max-width: 1023px) {
  .p-6.lg\:p-8 {
    padding: 12px !important;
  }
  header.sticky {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
}

/* --- Box sizing tanpa max-width: 100% yang merusak scroll --- */
@media (max-width: 1023px) {
  * {
    box-sizing: border-box;
    /* max-width: 100% DIHAPUS dari sini — ini yang mencegah tabel bisa scroll */
  }
}
</style>