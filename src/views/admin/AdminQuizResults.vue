<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'

const store = useStore()
const router = useRouter()
const drawerOpen = ref(false)
const searchName = ref('')
const filterType = ref('')
const filterMaterial = ref('')

const filtered = computed(() => {
  return store.quizResults.filter(r => {
    const matchName = r.student_name.toLowerCase().includes(searchName.value.toLowerCase())
    const matchType = filterType.value === '' || r.quiz_type === filterType.value
    const matchMat  = filterMaterial.value === '' || r.material_name === filterMaterial.value
    return matchName && matchType && matchMat
  })
})

const materialNames = computed(() => [...new Set(store.quizResults.map(r => r.material_name).filter(Boolean))])

const stats = computed(() => {
  const data = filtered.value
  if (!data.length) return { count: 0, avg: 0, highest: 0, lowest: 0 }
  const pcts = data.map(r => r.percentage)
  return {
    count:   data.length,
    avg:     Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
    highest: Math.max(...pcts),
    lowest:  Math.min(...pcts),
  }
})

function scoreColor(pct) {
  if (pct >= 80) return '#22c55e'
  if (pct >= 60) return '#eab308'
  return '#ef4444'
}
function scoreBadgeBg(pct) {
  if (pct >= 80) return 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;'
  if (pct >= 60) return 'background:#fefce8;color:#a16207;border:1px solid #fde68a;'
  return 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;'
}
function formatDate(str) {
  if (!str) return '-'
  const d = new Date(str)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}
async function deleteResult(id) {
  if (!confirm('Hapus data nilai ini?')) return
  await store.deleteQuizResult(id)
}
async function clearAll() {
  if (!confirm('Hapus SEMUA data nilai? Tindakan ini tidak bisa dibatalkan!')) return
  await store.clearAllQuizResults()
}

onMounted(() => { store.fetchQuizResults() })
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen = false" />

    <div class="flex-1 min-w-0" style="margin-left:256px;">
      <!-- Header -->
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center justify-between"
        style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div class="flex items-center gap-3 min-w-0">
          <button @click="drawerOpen = true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#0d1526;">☰</button>
          <h1 class="font-bold text-lg truncate" style="color:#0f172a;">Hasil Evaluasi</h1>
        </div>
        <div class="qr-header-actions">
          <button @click="router.push('/')" class="px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-gray-50" style="border:1px solid #e2e8f0;color:#475569;">
            <span class="qr-beranda-label">🏠 Beranda</span>
            <span class="qr-beranda-icon">🏠</span>
          </button>
          <button v-if="store.quizResults.length > 0" @click="clearAll"
            class="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;">🗑️ <span class="qr-clear-label">Hapus Semua</span></button>
        </div>
      </header>

      <div class="p-6 lg:p-8">

        <!-- Stats -->
        <div class="qr-stats-grid mb-6">
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #bfdbfe;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <p class="text-xs font-semibold mb-1" style="color:#64748b;">Total Pengerjaan</p>
            <p class="font-bold text-3xl" style="color:#2563eb;">{{ stats.count }}</p>
          </div>
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #fed7aa;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <p class="text-xs font-semibold mb-1" style="color:#64748b;">Rata-rata</p>
            <p class="font-bold text-3xl" style="color:#f97316;">{{ stats.avg }}%</p>
          </div>
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #bbf7d0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <p class="text-xs font-semibold mb-1" style="color:#64748b;">Tertinggi</p>
            <p class="font-bold text-3xl" style="color:#22c55e;">{{ stats.highest }}%</p>
          </div>
          <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #fecaca;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <p class="text-xs font-semibold mb-1" style="color:#64748b;">Terendah</p>
            <p class="font-bold text-3xl" style="color:#ef4444;">{{ stats.count > 0 ? stats.lowest : 0 }}%</p>
          </div>
        </div>

        <!-- Filters -->
        <div class="qr-filter-row mb-6">
          <div class="relative flex-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2" style="color:#94a3b8;">🔍</span>
            <input v-model="searchName" type="text" placeholder="Cari nama mahasiswa..."
              class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;" />
          </div>
          <select v-model="filterType" class="px-4 py-2.5 rounded-xl text-sm qr-select"
            style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;">
            <option value="">Semua Tipe</option>
            <option value="material">Kuis Materi</option>
            <option value="global">Kuis Global</option>
          </select>
          <select v-model="filterMaterial" class="px-4 py-2.5 rounded-xl text-sm qr-select"
            style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;">
            <option value="">Semua Materi</option>
            <option v-for="name in materialNames" :key="name" :value="name">{{ name }}</option>
          </select>
        </div>

        <!-- Empty -->
        <div v-if="filtered.length === 0 && !store.loading" class="rounded-2xl text-center py-20"
          style="background:#fff;border:1px solid #e2e8f0;">
          <span style="font-size:4rem;">📊</span>
          <p class="font-semibold mt-4 mb-2" style="color:#475569;">
            {{ store.quizResults.length === 0 ? 'Belum ada data nilai' : 'Tidak ada hasil yang cocok' }}
          </p>
          <p class="text-sm" style="color:#94a3b8;">
            {{ store.quizResults.length === 0 ? 'Data akan muncul setelah mahasiswa mengerjakan evaluasi.' : 'Coba ubah filter pencarian.' }}
          </p>
        </div>

        <!-- Desktop Table -->
        <div v-if="filtered.length > 0" class="rounded-2xl overflow-hidden qr-table-wrap"
          style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <div class="overflow-x-auto">
            <table class="w-full text-sm" style="min-width:620px;">
              <thead>
                <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                  <th class="text-left px-6 py-3.5 font-semibold" style="color:#64748b;">Nama Mahasiswa</th>
                  <th class="text-left px-4 py-3.5 font-semibold" style="color:#64748b;">Materi / Kuis</th>
                  <th class="text-left px-4 py-3.5 font-semibold" style="color:#64748b;">Tipe</th>
                  <th class="text-center px-4 py-3.5 font-semibold" style="color:#64748b;">Skor</th>
                  <th class="text-center px-4 py-3.5 font-semibold" style="color:#64748b;">Nilai</th>
                  <th class="text-left px-4 py-3.5 font-semibold" style="color:#64748b;">Waktu</th>
                  <th class="text-center px-4 py-3.5 font-semibold" style="color:#64748b;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in filtered" :key="r.id"
                  class="border-t transition-colors hover:bg-gray-50" style="border-color:#f1f5f9;">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style="background:#eff6ff;color:#2563eb;">
                        {{ r.student_name.charAt(0).toUpperCase() }}
                      </div>
                      <p class="font-semibold" style="color:#0f172a;">{{ r.student_name }}</p>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <p class="text-sm" style="color:#475569;">{{ r.material_name || 'Kuis Global' }}</p>
                  </td>
                  <td class="px-4 py-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                      :style="r.quiz_type === 'global' ? 'background:#faf5ff;color:#7e22ce;border:1px solid #e9d5ff;' : 'background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;'">
                      {{ r.quiz_type === 'global' ? '🏆 Global' : '📚 Materi' }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-center font-semibold" style="color:#0f172a;">{{ r.score }}/{{ r.total }}</td>
                  <td class="px-4 py-4 text-center">
                    <span class="px-2.5 py-1 rounded-full text-sm font-bold" :style="scoreBadgeBg(r.percentage)">{{ r.percentage }}%</span>
                  </td>
                  <td class="px-4 py-4">
                    <p class="text-xs" style="color:#94a3b8;">{{ formatDate(r.created_at) }}</p>
                  </td>
                  <td class="px-4 py-4 text-center">
                    <button @click="deleteResult(r.id)"
                      class="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all mx-auto"
                      style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="px-6 py-3" style="border-top:1px solid #f1f5f9;background:#f8fafc;">
            <p class="text-sm" style="color:#64748b;">Menampilkan {{ filtered.length }} data nilai</p>
          </div>
        </div>

        <!-- Mobile Cards -->
        <div v-if="filtered.length > 0" class="qr-mobile-cards space-y-3">
          <div v-for="r in filtered" :key="'m-'+r.id"
            class="rounded-2xl p-4" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
            <!-- Header: avatar + nama + nilai badge -->
            <div class="flex items-center gap-3 mb-2">
              <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style="background:#eff6ff;color:#2563eb;">
                {{ r.student_name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm truncate" style="color:#0f172a;">{{ r.student_name }}</p>
                <p class="text-xs truncate" style="color:#64748b;">{{ r.material_name || 'Kuis Global' }}</p>
              </div>
              <span class="px-2.5 py-1 rounded-full text-sm font-bold flex-shrink-0" :style="scoreBadgeBg(r.percentage)">
                {{ r.percentage }}%
              </span>
            </div>
            <!-- Info row -->
            <div class="flex items-center justify-between text-xs mb-3">
              <span class="px-2 py-0.5 rounded-full font-semibold"
                :style="r.quiz_type === 'global' ? 'background:#faf5ff;color:#7e22ce;border:1px solid #e9d5ff;' : 'background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;'">
                {{ r.quiz_type === 'global' ? '🏆 Global' : '📚 Materi' }}
              </span>
              <span style="color:#0f172a;font-weight:600;">Skor: {{ r.score }}/{{ r.total }}</span>
              <span style="color:#94a3b8;">{{ formatDate(r.created_at) }}</span>
            </div>
            <!-- Progress bar -->
            <div class="h-1.5 rounded-full mb-2" style="background:#f1f5f9;">
              <div class="h-full rounded-full" :style="`background:${scoreColor(r.percentage)};width:${r.percentage}%;`"></div>
            </div>
            <!-- Delete -->
            <div class="flex justify-end">
              <button @click="deleteResult(r.id)"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;">🗑️ Hapus</button>
            </div>
          </div>
          <p class="text-sm text-center py-1" style="color:#64748b;">{{ filtered.length }} data nilai</p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* =============================================
   LAYOUT CLASSES - desktop default
   ============================================= */

.qr-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.qr-beranda-icon { display: none; }

.qr-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.qr-filter-row {
  display: flex;
  flex-direction: row;
  gap: 12px;
}
.qr-select { min-width: 160px; }

/* Mobile cards hidden di desktop */
.qr-mobile-cards { display: none; }

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
  /* Sembunyikan teks, tampilkan ikon saja */
  .qr-beranda-label { display: none; }
  .qr-beranda-icon  { display: inline; }
  .qr-clear-label   { display: none; }

  /* Content padding */
  .p-6.lg\:p-8 { padding: 12px !important; }

  /* Stats: 2 kolom */
  .qr-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .qr-stats-grid .rounded-2xl { padding: 12px !important; }
  .qr-stats-grid .text-3xl { font-size: 1.75rem !important; }

  /* Filters: stack vertikal */
  .qr-filter-row { flex-direction: column; gap: 8px; }
  .qr-select { min-width: unset; width: 100%; }

  /* Sembunyikan tabel, tampilkan cards */
  .qr-table-wrap    { display: none !important; }
  .qr-mobile-cards  { display: block !important; }

  /* Prevent overflow */
  * { box-sizing: border-box; max-width: 100%; }
}
</style>