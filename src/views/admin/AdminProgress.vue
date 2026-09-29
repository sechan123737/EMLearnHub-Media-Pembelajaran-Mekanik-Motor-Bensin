<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'

const store  = useStore()
const router = useRouter()
const drawerOpen = ref(false)
const view = ref('overview')

const moduleStats = computed(() => {
  return store.modules.map(mod => {
    const mats = store.getMaterialsByModule(mod.name)
    const matIds = new Set(mats.map(m => String(m.id)))
    const results = store.quizResults.filter(r => matIds.has(String(r.material_id)))
    const avg = results.length ? Math.round(results.reduce((a,r) => a + r.percentage, 0) / results.length) : 0
    const students = new Set(results.map(r => r.student_name)).size
    return {
      id: mod.id, name: mod.name,
      materialCount: mats.length,
      withVideo:     mats.filter(m => m.video_url).length,
      withJobsheet:  mats.filter(m => m.jobsheet_url).length,
      quizCount:     results.length,
      avgScore:      avg,
      studentCount:  students,
    }
  })
})

const studentStats = computed(() => {
  const map = {}
  store.quizResults.forEach(r => {
    const k = r.student_name.toLowerCase()
    if (!map[k]) map[k] = { name: r.student_name, scores: [], count: 0 }
    map[k].scores.push(r.percentage)
    map[k].count++
  })
  return Object.values(map).map(s => ({
    ...s,
    avg: Math.round(s.scores.reduce((a,b)=>a+b,0)/s.scores.length),
    highest: Math.max(...s.scores),
  })).sort((a,b) => b.avg - a.avg)
})

const overallAvg = computed(() => {
  if (!store.quizResults.length) return 0
  return Math.round(store.quizResults.reduce((a,r)=>a+r.percentage,0)/store.quizResults.length)
})

const statsCards = computed(() => [
  { label:'Total Materi',     value: store.materials.length,                                 icon:'/icons/materi.png', color:'#2563eb', border:'#bfdbfe' },
  { label:'Total Pengerjaan', value: store.quizResults.length,                               icon:'/icons/kuis.png',   color:'#22c55e', border:'#bbf7d0' },
  { label:'Mahasiswa Aktif',  value: new Set(store.quizResults.map(r=>r.student_name)).size, icon:'/icons/mahasiswa.png',               color:'#f97316', border:'#fed7aa' },
  { label:'Rata-rata Nilai',  value: overallAvg.value + '%',                                 icon:'/icons/ppt.png',   color:'#a855f7', border:'#e9d5ff' },
])

const tabs = [
  { key:'overview',    label:'Ringkasan' },
  { key:'per-module',  label:'Per Topik' },
  { key:'per-student', label:'Per Mahasiswa' },
]

function isPath(v) { return typeof v === 'string' && v.startsWith('/') }
function scoreColor(pct) {
  if (pct>=80) return '#22c55e'; if (pct>=60) return '#eab308'; return '#ef4444'
}
function scoreBg(pct) {
  if (pct>=80) return 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;'
  if (pct>=60) return 'background:#fefce8;color:#a16207;border:1px solid #fde68a;'
  return 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;'
}
function avatarColor(name) {
  const colors = ['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#16a34a','#0891b2']
  return colors[name.charCodeAt(0) % colors.length]
}

onMounted(() => { store.fetchModules(); store.fetchMaterials(); store.fetchQuizResults() })
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen=false" />

    <div class="flex-1 min-w-0" style="margin-left:256px;">
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center gap-3"
        style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <button @click="drawerOpen=true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center" style="background:#0d1526;">☰</button>
        <h1 class="font-bold text-xl" style="color:#0f172a;">Progress Belajar</h1>
      </header>

      <div class="p-6 lg:p-8">

        <!-- Stats cards -->
        <div class="prog-stats-grid mb-8">
          <div v-for="s in statsCards" :key="s.label"
            class="rounded-2xl p-5" :style="`background:#fff;border:1px solid ${s.border};`">
            <div class="flex items-center gap-2 mb-2">
              <img v-if="isPath(s.icon)" :src="s.icon" class="w-6 h-6 object-contain" alt="" />
              <span v-else class="text-2xl">{{ s.icon }}</span>
            </div>
            <p class="font-bold text-2xl" :style="`color:${s.color};`">{{ s.value }}</p>
            <p class="text-sm" style="color:#64748b;">{{ s.label }}</p>
          </div>
        </div>

        <!-- Tab switcher -->
        <div class="prog-tabs-wrap mb-6" style="background:#f1f5f9;">
          <button v-for="t in tabs" :key="t.key" @click="view=t.key"
            class="prog-tab-btn"
            :style="view===t.key ? 'background:#fff;color:#2563eb;box-shadow:0 1px 4px rgba(0,0,0,0.08);' : 'color:#64748b;'">
            {{ t.label }}
          </button>
        </div>

        <!-- OVERVIEW -->
        <div v-if="view === 'overview'">
          <div class="prog-overview-grid">
            <!-- Kelengkapan konten -->
            <div class="rounded-2xl p-6" style="background:#fff;border:1px solid #e2e8f0;">
              <h3 class="font-bold mb-4" style="color:#0f172a;">Kelengkapan Konten per Topik</h3>
              <div class="space-y-4">
                <div v-for="m in moduleStats" :key="m.id">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-semibold" style="color:#0f172a;">{{ m.name }}</span>
                    <span class="text-xs" style="color:#64748b;">{{ m.materialCount }} materi</span>
                  </div>
                  <div class="flex gap-2 text-xs">
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-0.5">
                        <span style="color:#64748b;">Video</span>
                        <span class="font-semibold" style="color:#22c55e;">{{ m.withVideo }}/{{ m.materialCount }}</span>
                      </div>
                      <div class="h-1.5 rounded-full" style="background:#f1f5f9;">
                        <div class="h-full rounded-full" style="background:#22c55e;"
                          :style="`width:${m.materialCount ? (m.withVideo/m.materialCount*100) : 0}%`"></div>
                      </div>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-0.5">
                        <span style="color:#64748b;">Jobsheet</span>
                        <span class="font-semibold" style="color:#f97316;">{{ m.withJobsheet }}/{{ m.materialCount }}</span>
                      </div>
                      <div class="h-1.5 rounded-full" style="background:#f1f5f9;">
                        <div class="h-full rounded-full" style="background:#f97316;"
                          :style="`width:${m.materialCount ? (m.withJobsheet/m.materialCount*100) : 0}%`"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Distribusi nilai -->
            <div class="rounded-2xl p-6" style="background:#fff;border:1px solid #e2e8f0;">
              <h3 class="font-bold mb-4" style="color:#0f172a;">Distribusi Nilai Mahasiswa</h3>
              <div v-if="store.quizResults.length === 0" class="text-center py-10" style="color:#94a3b8;">
                <img src="/icons/ppt.png" class="w-12 h-12 mx-auto object-contain opacity-40" alt="" />
                <p class="mt-2 text-sm">Belum ada data nilai</p>
              </div>
              <div v-else class="space-y-3">
                <div v-for="range in [
                  { label:'Sangat Baik (90-100%)', min:90, max:100, color:'#22c55e' },
                  { label:'Baik (80-89%)',          min:80, max:89,  color:'#3b82f6' },
                  { label:'Cukup (60-79%)',          min:60, max:79,  color:'#eab308' },
                  { label:'Perlu Belajar (<60%)',    min:0,  max:59,  color:'#ef4444' },
                ]" :key="range.label">
                  <div class="flex items-center gap-3">
                    <div class="prog-range-label flex-shrink-0">
                      <p class="text-xs font-semibold" style="color:#475569;">{{ range.label }}</p>
                    </div>
                    <div class="flex-1 h-6 rounded-lg overflow-hidden" style="background:#f1f5f9;">
                      <div class="h-full rounded-lg transition-all"
                        :style="`background:${range.color};width:${Math.round(store.quizResults.filter(r=>r.percentage>=range.min&&r.percentage<=range.max).length/store.quizResults.length*100)}%;min-width:2px;`">
                      </div>
                    </div>
                    <span class="text-sm font-bold w-8 text-right" :style="`color:${range.color};`">
                      {{ store.quizResults.filter(r=>r.percentage>=range.min&&r.percentage<=range.max).length }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PER-MODULE -->
        <div v-if="view === 'per-module'" class="prog-module-grid">
          <div v-for="m in moduleStats" :key="m.id"
            class="rounded-2xl p-5" style="background:#fff;border:1px solid #e2e8f0;">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#0d1526;">
                <img src="/icons/modul.png" class="w-6 h-6 object-contain" alt="" />
              </div>
              <div>
                <p class="font-bold text-sm" style="color:#0f172a;">{{ m.name }}</p>
                <p class="text-xs" style="color:#64748b;">{{ m.materialCount }} materi</p>
              </div>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span style="color:#64748b;">Video tersedia</span>
                <span class="font-semibold" style="color:#22c55e;">{{ m.withVideo }}/{{ m.materialCount }}</span>
              </div>
              <div class="flex justify-between">
                <span style="color:#64748b;">Jobsheet tersedia</span>
                <span class="font-semibold" style="color:#f97316;">{{ m.withJobsheet }}/{{ m.materialCount }}</span>
              </div>
              <div class="flex justify-between">
                <span style="color:#64748b;">Pengerjaan kuis</span>
                <span class="font-semibold" style="color:#2563eb;">{{ m.quizCount }}</span>
              </div>
              <div class="flex justify-between">
                <span style="color:#64748b;">Mahasiswa aktif</span>
                <span class="font-semibold" style="color:#a855f7;">{{ m.studentCount }}</span>
              </div>
              <div class="flex justify-between pt-2" style="border-top:1px solid #f1f5f9;">
                <span class="font-semibold" style="color:#64748b;">Rata-rata nilai</span>
                <span class="font-bold" :style="`color:${scoreColor(m.avgScore)};`">{{ m.avgScore ? m.avgScore+'%' : '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PER-STUDENT -->
        <div v-if="view === 'per-student'">
          <div v-if="studentStats.length === 0" class="text-center py-20 rounded-2xl"
            style="background:#fff;border:1px solid #e2e8f0;">
            <span style="font-size:4rem;">👥</span>
            <p class="font-semibold mt-4" style="color:#475569;">Belum ada data mahasiswa</p>
          </div>

          <!-- Desktop table -->
          <div v-else class="rounded-2xl overflow-hidden prog-student-table"
            style="background:#fff;border:1px solid #e2e8f0;">
            <div class="overflow-x-auto">
              <table class="w-full text-sm" style="min-width:560px;">
                <thead>
                  <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                    <th class="text-left px-6 py-3.5 font-semibold" style="color:#64748b;">Peringkat</th>
                    <th class="text-left px-4 py-3.5 font-semibold" style="color:#64748b;">Mahasiswa</th>
                    <th class="text-center px-4 py-3.5 font-semibold" style="color:#64748b;">Kuis</th>
                    <th class="text-center px-4 py-3.5 font-semibold" style="color:#64748b;">Rata-rata</th>
                    <th class="text-center px-4 py-3.5 font-semibold" style="color:#64748b;">Tertinggi</th>
                    <th class="px-4 py-3.5 font-semibold" style="color:#64748b;">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(s, i) in studentStats" :key="s.name"
                    class="border-t hover:bg-gray-50 transition-colors" style="border-color:#f1f5f9;">
                    <td class="px-6 py-4">
                      <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        :style="i===0?'background:#fbbf24;color:#92400e;':i===1?'background:#94a3b8;color:#fff;':i===2?'background:#f97316;color:#fff;':'background:#f1f5f9;color:#475569;'">
                        {{ i+1 }}
                      </span>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                          :style="`background:${avatarColor(s.name)};`">
                          {{ s.name.charAt(0).toUpperCase() }}
                        </div>
                        <span class="font-semibold" style="color:#0f172a;">{{ s.name }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-4 text-center font-bold" style="color:#0f172a;">{{ s.count }}</td>
                    <td class="px-4 py-4 text-center">
                      <span class="px-2.5 py-1 rounded-full text-sm font-bold" :style="scoreBg(s.avg)">{{ s.avg }}%</span>
                    </td>
                    <td class="px-4 py-4 text-center font-semibold" style="color:#22c55e;">{{ s.highest }}%</td>
                    <td class="px-4 py-4">
                      <div class="h-2 rounded-full" style="background:#f1f5f9;">
                        <div class="h-full rounded-full" :style="`background:${scoreColor(s.avg)};width:${s.avg}%;`"></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Mobile cards untuk per-student -->
          <div v-if="studentStats.length > 0" class="prog-student-cards space-y-3">
            <div v-for="(s, i) in studentStats" :key="'m-'+s.name"
              class="rounded-2xl p-4" style="background:#fff;border:1px solid #e2e8f0;">
              <div class="flex items-center gap-3 mb-3">
                <!-- Rank badge -->
                <span class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  :style="i===0?'background:#fbbf24;color:#92400e;':i===1?'background:#94a3b8;color:#fff;':i===2?'background:#f97316;color:#fff;':'background:#f1f5f9;color:#475569;'">
                  {{ i+1 }}
                </span>
                <!-- Avatar + name -->
                <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                  :style="`background:${avatarColor(s.name)};`">
                  {{ s.name.charAt(0).toUpperCase() }}
                </div>
                <p class="font-semibold flex-1 truncate" style="color:#0f172a;">{{ s.name }}</p>
                <span class="px-2.5 py-1 rounded-full text-sm font-bold flex-shrink-0" :style="scoreBg(s.avg)">{{ s.avg }}%</span>
              </div>
              <!-- Progress bar -->
              <div class="h-2 rounded-full mb-2" style="background:#f1f5f9;">
                <div class="h-full rounded-full" :style="`background:${scoreColor(s.avg)};width:${s.avg}%;`"></div>
              </div>
              <div class="flex items-center justify-between text-xs" style="color:#64748b;">
                <span>{{ s.count }} kuis dikerjakan</span>
                <span>Tertinggi: <strong style="color:#22c55e;">{{ s.highest }}%</strong></span>
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

.prog-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* Tabs */
.prog-tabs-wrap {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
}
.prog-tab-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  background: transparent;
  white-space: nowrap;
}

/* Overview: 2 kolom */
.prog-overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.prog-range-label { width: 112px; }

/* Per-module: 3 kolom */
.prog-module-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* Per-student mobile cards: hidden di desktop */
.prog-student-cards { display: none; }

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

  /* Content padding */
  .p-6.lg\:p-8 { padding: 12px !important; }

  /* Stats: 2 kolom */
  .prog-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .prog-stats-grid .rounded-2xl { padding: 12px !important; }
  .prog-stats-grid .text-2xl { font-size: 1.4rem !important; }

  /* Tabs: full width, semua tab tampil */
  .prog-tabs-wrap {
    display: flex;
    width: 100%;
  }
  .prog-tab-btn {
    flex: 1;
    text-align: center;
    padding: 8px 6px;
    font-size: 0.75rem;
  }

  /* Overview: 1 kolom */
  .prog-overview-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  /* Range label lebih pendek */
  .prog-range-label { width: 80px; }

  /* Per-module: 1 kolom */
  .prog-module-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  /* Per-student: sembunyikan tabel, tampilkan cards */
  .prog-student-table { display: none !important; }
  .prog-student-cards { display: block !important; }

  /* Prevent overflow */
  * { box-sizing: border-box; max-width: 100%; }
}

@media (min-width: 640px) and (max-width: 1023px) {
  /* Tablet: per-module 2 kolom */
  .prog-module-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>