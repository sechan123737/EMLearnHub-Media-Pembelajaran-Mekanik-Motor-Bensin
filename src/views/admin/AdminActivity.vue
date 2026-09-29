<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'

const store      = useStore()
const drawerOpen = ref(false)
const filterType = ref('')

const activities = computed(() => {
  const list = store.quizResults.map(r => ({
    id:     r.id,
    type:   r.quiz_type === 'global' ? 'kuis-global' : 'kuis-materi',
    actor:  r.student_name,
    detail: r.quiz_type === 'global' ? 'Mengerjakan Kuis Global' : `Evaluasi: ${r.material_name || '-'}`,
    score:  r.percentage,
    time:   r.created_at,
    icon:   r.quiz_type === 'global' ? '🏆' : '✅',
    color:  r.quiz_type === 'global' ? '#a855f7' : '#2563eb',
    bg:     r.quiz_type === 'global' ? '#faf5ff' : '#eff6ff',
  }))
  list.sort((a,b) => new Date(b.time) - new Date(a.time))
  if (filterType.value) return list.filter(a => a.type === filterType.value)
  return list
})

function formatTime(str) {
  if (!str) return '-'
  const diff = Date.now() - new Date(str).getTime()
  const mins  = Math.floor(diff/60000)
  const hours = Math.floor(diff/3600000)
  const days  = Math.floor(diff/86400000)
  if (mins  < 1)  return 'Baru saja'
  if (mins  < 60) return `${mins} mnt lalu`
  if (hours < 24) return `${hours} jam lalu`
  return `${days} hari lalu`
}
function fullDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}
function avatarColor(name) {
  const colors = ['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#16a34a','#0891b2']
  return colors[name.charCodeAt(0) % colors.length]
}
function scoreStyle(pct) {
  if (pct>=80) return 'color:#15803d;'
  if (pct>=60) return 'color:#a16207;'
  return 'color:#dc2626;'
}

onMounted(() => store.fetchQuizResults())
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen=false" />

    <div class="flex-1 min-w-0" style="margin-left:256px;">
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center justify-between"
        style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div class="flex items-center gap-3">
          <button @click="drawerOpen=true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center" style="background:#0d1526;">☰</button>
          <h1 class="font-bold text-xl" style="color:#0f172a;">Aktivitas Pengguna</h1>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span class="text-sm" style="color:#64748b;">Live</span>
        </div>
      </header>

      <div class="p-6 lg:p-8">

        <!-- Stats -->
        <div class="act-stats-grid mb-6">
          <div class="rounded-2xl p-4" style="background:#fff;border:1px solid #e2e8f0;">
            <p class="text-xl font-bold" style="color:#0f172a;">{{ store.quizResults.length }}</p>
            <p class="text-xs" style="color:#64748b;">Total Aktivitas</p>
          </div>
          <div class="rounded-2xl p-4" style="background:#fff;border:1px solid #e2e8f0;">
            <p class="text-xl font-bold" style="color:#2563eb;">{{ store.quizResults.filter(r=>r.quiz_type==='material').length }}</p>
            <p class="text-xs" style="color:#64748b;">Kuis Materi</p>
          </div>
          <div class="rounded-2xl p-4" style="background:#fff;border:1px solid #e2e8f0;">
            <p class="text-xl font-bold" style="color:#a855f7;">{{ store.quizResults.filter(r=>r.quiz_type==='global').length }}</p>
            <p class="text-xs" style="color:#64748b;">Kuis Global</p>
          </div>
          <div class="rounded-2xl p-4" style="background:#fff;border:1px solid #e2e8f0;">
            <p class="text-xl font-bold" style="color:#22c55e;">{{ new Set(store.quizResults.map(r=>r.student_name)).size }}</p>
            <p class="text-xs" style="color:#64748b;">Mahasiswa Unik</p>
          </div>
        </div>

        <!-- Filter pills -->
        <div class="act-filter-row mb-6">
          <button v-for="f in [
            {key:'', label:'Semua'},
            {key:'kuis-materi', label:'Kuis Materi'},
            {key:'kuis-global', label:'Kuis Global'},
          ]" :key="f.key" @click="filterType=f.key"
            class="act-filter-btn"
            :style="filterType===f.key ? 'background:#2563eb;color:#fff;' : 'background:#fff;border:1px solid #e2e8f0;color:#475569;'">
            {{ f.label }}
          </button>
        </div>

        <!-- Empty -->
        <div v-if="activities.length === 0" class="text-center py-20 rounded-2xl"
          style="background:#fff;border:1px solid #e2e8f0;">
          <span style="font-size:4rem;">⚡</span>
          <p class="font-semibold mt-4" style="color:#475569;">Belum ada aktivitas</p>
          <p class="text-sm mt-1" style="color:#94a3b8;">Aktivitas akan muncul saat mahasiswa mengerjakan evaluasi.</p>
        </div>

        <!-- Activity feed -->
        <div v-else class="space-y-2">
          <div v-for="act in activities" :key="act.id"
            class="act-card p-4 rounded-2xl transition-all hover:shadow-sm"
            style="background:#fff;border:1px solid #e2e8f0;">

            <!-- Avatar -->
            <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
              :style="`background:${avatarColor(act.actor)};`">
              {{ act.actor.charAt(0).toUpperCase() }}
            </div>

            <!-- Icon -->
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              :style="`background:${act.bg};`">
              <span class="text-sm">{{ act.icon }}</span>
            </div>

            <!-- Detail -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold" style="color:#0f172a;">
                <span :style="`color:${act.color};`">{{ act.actor }}</span>
                {{ act.detail }}
              </p>
              <p class="act-fulldate text-xs" style="color:#94a3b8;">{{ fullDate(act.time) }}</p>
            </div>

            <!-- Score + badge + time -->
            <div class="act-right flex items-center gap-3 flex-shrink-0">
              <span class="text-sm font-bold" :style="scoreStyle(act.score)">{{ act.score }}%</span>
              <span class="act-type-badge px-2.5 py-1 rounded-full text-xs font-semibold"
                :style="act.type==='kuis-global' ? 'background:#faf5ff;color:#7e22ce;border:1px solid #e9d5ff;' : 'background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;'">
                {{ act.type === 'kuis-global' ? 'Global' : 'Materi' }}
              </span>
              <div class="act-time text-xs text-right w-20" style="color:#94a3b8;">
                {{ formatTime(act.time) }}
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

.act-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.act-filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.act-filter-btn {
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

/* Card: 1 baris di desktop */
.act-card {
  display: flex;
  align-items: center;
  gap: 16px;
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

  /* Content padding */
  .p-6.lg\:p-8 { padding: 12px !important; }

  /* Stats: 2 kolom */
  .act-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .act-stats-grid .rounded-2xl { padding: 10px !important; }

  /* Filter pills: wrap */
  .act-filter-btn {
    padding: 6px 12px;
    font-size: 0.8rem;
    flex: 1;
    text-align: center;
  }

  /* Card: stack vertikal di mobile */
  .act-card {
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-start;
  }


  /* Detail full width */
  .act-card .flex-1 { width: 100%; }

  /* Sembunyikan tanggal lengkap (sudah ada waktu relatif) */
  .act-fulldate { display: none; }

  /* Right section: sejajar di bawah detail */
  .act-right {
    width: 100%;
    justify-content: space-between;
  }

  /* Sembunyikan badge tipe (sudah ada ikon di card) */
  .act-type-badge { display: none; }

  /* Waktu full width rata kanan */
  .act-time { width: auto; }

  /* Prevent overflow */
  * { box-sizing: border-box; max-width: 100%; }
}
</style>