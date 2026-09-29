<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'
import { supabase } from '../../lib/supabase'

const store  = useStore()
const router = useRouter()
const drawerOpen  = ref(false)
const searchQuery = ref('')
const sortBy      = ref('name')
const nimMap = ref({})

const students = computed(() => {
  const map = {}
  store.quizResults.forEach(r => {
    const key = r.student_name.trim().toLowerCase()
    if (!map[key]) {
      map[key] = {
        name:       r.student_name.trim(),
        user_id:    r.user_id || '',
        nim:        nimMap.value[r.user_id] || nimMap.value['name:' + r.student_name?.trim().toLowerCase()] || '',
        count:      0,
        totalScore: 0,
        highest:    0,
        lowest:     100,
        lastActive: r.created_at,
        results:    [],
      }
    }
    if (!map[key].nim) {
      map[key].nim = nimMap.value[r.user_id]
        || nimMap.value['name:' + r.student_name?.trim().toLowerCase()]
        || ''
    }
    map[key].count++
    map[key].totalScore += r.percentage
    map[key].highest = Math.max(map[key].highest, r.percentage)
    map[key].lowest  = Math.min(map[key].lowest,  r.percentage)
    if (r.created_at > map[key].lastActive) map[key].lastActive = r.created_at
    map[key].results.push(r)
  })
  return Object.values(map)
})

const filtered = computed(() => {
  let list = students.value.filter(s =>
    !searchQuery.value || s.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
  if (sortBy.value === 'name')  list = [...list].sort((a,b) => a.name.localeCompare(b.name))
  if (sortBy.value === 'score') list = [...list].sort((a,b) => (b.totalScore/b.count) - (a.totalScore/a.count))
  if (sortBy.value === 'count') list = [...list].sort((a,b) => b.count - a.count)
  return list
})

function avgScore(s) { return s.count ? Math.round(s.totalScore / s.count) : 0 }
function scoreStyle(pct) {
  if (pct >= 80) return 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;'
  if (pct >= 60) return 'background:#fefce8;color:#a16207;border:1px solid #fde68a;'
  return 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;'
}
function formatDate(str) {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
}
function avatarColor(name) {
  const colors = ['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#16a34a','#0891b2']
  return colors[name.charCodeAt(0) % colors.length]
}

onMounted(async () => {
  await store.fetchQuizResults()
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, nim')
  if (profiles) {
    const byId   = {}
    const byName = {}
    profiles.forEach(p => {
      if (p.id)        byId[p.id] = p.nim || ''
      if (p.full_name) byName[p.full_name.trim().toLowerCase()] = p.nim || ''
    })
    const map = {}
    store.quizResults.forEach(r => {
      const nim = (r.user_id && byId[r.user_id]) ? byId[r.user_id] : byName[r.student_name?.trim().toLowerCase()] || ''
      if (r.user_id) map[r.user_id] = nim
      map['name:' + r.student_name?.trim().toLowerCase()] = nim
    })
    nimMap.value = map
  }
})
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen=false" />

    <div class="flex-1 min-w-0" style="margin-left:256px;">
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center gap-3"
        style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <button @click="drawerOpen=true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center" style="background:#0d1526;">☰</button>
        <h1 class="font-bold text-xl" style="color:#0f172a;">Data Mahasiswa</h1>
      </header>

      <div class="p-6 lg:p-8">
        <!-- Stats -->
        <div class="stu-stats-grid mb-6">
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #bfdbfe;">
            <p class="text-2xl font-bold" style="color:#2563eb;">{{ students.length }}</p>
            <p class="text-sm" style="color:#64748b;">Total Mahasiswa</p>
          </div>
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #bbf7d0;">
            <p class="text-2xl font-bold" style="color:#22c55e;">{{ store.quizResults.length }}</p>
            <p class="text-sm" style="color:#64748b;">Total Pengerjaan</p>
          </div>
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #fed7aa;">
            <p class="text-2xl font-bold" style="color:#f97316;">
              {{ students.length ? Math.round(students.reduce((a,s) => a + avgScore(s), 0) / students.length) : 0 }}%
            </p>
            <p class="text-sm" style="color:#64748b;">Rata-rata Nilai</p>
          </div>
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #e9d5ff;">
            <p class="text-2xl font-bold" style="color:#a855f7;">{{ students.filter(s => avgScore(s) >= 80).length }}</p>
            <p class="text-sm" style="color:#64748b;">Nilai Baik (≥80%)</p>
          </div>
        </div>

        <!-- Search + sort -->
        <div class="stu-filter-row mb-6">
          <div class="relative flex-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2" style="color:#94a3b8;">🔍</span>
            <input v-model="searchQuery" type="text" placeholder="Cari nama mahasiswa..."
              class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;" />
          </div>
          <select v-model="sortBy" class="px-4 py-2.5 rounded-xl text-sm stu-sort-select"
            style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;">
            <option value="name">Urutkan: Nama</option>
            <option value="score">Urutkan: Nilai</option>
            <option value="count">Urutkan: Aktivitas</option>
          </select>
        </div>

        <!-- Loading -->
        <div v-if="store.loading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-20 rounded-2xl animate-pulse" style="background:#e2e8f0;"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="filtered.length === 0" class="text-center py-20 rounded-2xl"
          style="background:#fff;border:1px solid #e2e8f0;">
          <span style="font-size:4rem;">👥</span>
          <p class="font-semibold mt-4 mb-2" style="color:#475569;">{{ students.length === 0 ? 'Belum ada data mahasiswa' : 'Tidak ditemukan' }}</p>
          <p class="text-sm" style="color:#94a3b8;">Data muncul setelah mahasiswa mengerjakan evaluasi.</p>
        </div>

        <!-- Desktop Table -->
        <div v-else class="rounded-2xl overflow-hidden stu-table-wrap"
          style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <div class="overflow-x-auto">
            <table class="w-full text-sm" style="min-width:640px;">
              <thead>
                <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                  <th class="text-left px-6 py-3.5 font-semibold" style="color:#64748b;">Mahasiswa</th>
                  <th class="text-center px-4 py-3.5 font-semibold" style="color:#64748b;">Pengerjaan</th>
                  <th class="text-center px-4 py-3.5 font-semibold" style="color:#64748b;">Rata-rata</th>
                  <th class="text-center px-4 py-3.5 font-semibold" style="color:#64748b;">Tertinggi</th>
                  <th class="text-center px-4 py-3.5 font-semibold" style="color:#64748b;">Terendah</th>
                  <th class="text-left px-4 py-3.5 font-semibold" style="color:#64748b;">Terakhir Aktif</th>
                  <th class="text-center px-4 py-3.5 font-semibold" style="color:#64748b;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in filtered" :key="s.name"
                  class="border-t hover:bg-gray-50 transition-colors" style="border-color:#f1f5f9;">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                        :style="`background:${avatarColor(s.name)};`">
                        {{ s.name.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <p class="font-semibold" style="color:#0f172a;">{{ s.name }}</p>
                        <p class="text-xs font-mono font-semibold" style="color:#2563eb;">{{ s.nim || "-" }}</p>
                        <p class="text-xs" style="color:#94a3b8;">{{ s.count }} kuis dikerjakan</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-4 text-center font-bold" style="color:#0f172a;">{{ s.count }}</td>
                  <td class="px-4 py-4 text-center">
                    <span class="px-2.5 py-1 rounded-full text-sm font-bold" :style="scoreStyle(avgScore(s))">{{ avgScore(s) }}%</span>
                  </td>
                  <td class="px-4 py-4 text-center font-semibold" style="color:#22c55e;">{{ s.highest }}%</td>
                  <td class="px-4 py-4 text-center font-semibold" style="color:#ef4444;">{{ s.lowest }}%</td>
                  <td class="px-4 py-4 text-xs" style="color:#94a3b8;">{{ formatDate(s.lastActive) }}</td>
                  <td class="px-4 py-4 text-center">
                    <button @click="router.push('/admin/nilai')"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-600"
                      style="background:#2563eb;color:#fff;">📊 Detail</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="px-6 py-3" style="border-top:1px solid #f1f5f9;background:#f8fafc;">
            <p class="text-sm" style="color:#64748b;">{{ filtered.length }} mahasiswa aktif</p>
          </div>
        </div>

        <!-- Mobile Cards -->
        <div v-if="filtered.length > 0" class="stu-mobile-cards space-y-3">
          <div v-for="s in filtered" :key="'m-'+s.name"
            class="rounded-2xl p-4" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <!-- Header: avatar + nama + badge -->
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                :style="`background:${avatarColor(s.name)};`">
                {{ s.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm truncate" style="color:#0f172a;">{{ s.name }}</p>
                <p class="text-xs font-mono font-semibold" style="color:#2563eb;">{{ s.nim || '-' }}</p>
              </div>
              <span class="px-2.5 py-1 rounded-full text-sm font-bold flex-shrink-0" :style="scoreStyle(avgScore(s))">
                {{ avgScore(s) }}%
              </span>
            </div>
            <!-- Stats row -->
            <div class="grid grid-cols-3 gap-2 mb-3 text-center">
              <div class="rounded-xl py-2" style="background:#f8fafc;">
                <p class="font-bold text-sm" style="color:#0f172a;">{{ s.count }}</p>
                <p class="text-xs" style="color:#64748b;">Kuis</p>
              </div>
              <div class="rounded-xl py-2" style="background:#f0fdf4;">
                <p class="font-bold text-sm" style="color:#16a34a;">{{ s.highest }}%</p>
                <p class="text-xs" style="color:#64748b;">Tertinggi</p>
              </div>
              <div class="rounded-xl py-2" style="background:#fef2f2;">
                <p class="font-bold text-sm" style="color:#dc2626;">{{ s.lowest }}%</p>
                <p class="text-xs" style="color:#64748b;">Terendah</p>
              </div>
            </div>
            <!-- Footer: tanggal + tombol -->
            <div class="flex items-center justify-between">
              <p class="text-xs" style="color:#94a3b8;">Aktif: {{ formatDate(s.lastActive) }}</p>
              <button @click="router.push('/admin/nilai')"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style="background:#2563eb;color:#fff;">📊 Detail</button>
            </div>
          </div>
          <p class="text-sm text-center py-1" style="color:#64748b;">{{ filtered.length }} mahasiswa aktif</p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* =============================================
   LAYOUT CLASSES - desktop default
   ============================================= */

.stu-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stu-filter-row {
  display: flex;
  flex-direction: row;
  gap: 12px;
}
.stu-sort-select { min-width: 160px; }

/* Mobile cards hidden di desktop */
.stu-mobile-cards { display: none; }

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

  /* Stats: 2 kolom di mobile */
  .stu-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .stu-stats-grid .rounded-2xl { padding: 12px !important; }
  .stu-stats-grid .text-2xl { font-size: 1.4rem !important; }

  /* Filter: stack vertikal */
  .stu-filter-row { flex-direction: column; gap: 8px; }
  .stu-sort-select { min-width: unset; width: 100%; }

  /* Sembunyikan tabel, tampilkan cards */
  .stu-table-wrap { display: none !important; }
  .stu-mobile-cards { display: block !important; }

  /* Prevent overflow */
  * { box-sizing: border-box; max-width: 100%; }
}
</style>