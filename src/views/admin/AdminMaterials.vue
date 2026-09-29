<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useStore } from '../../stores/mainStore'
import AdminSidebar from '../../components/AdminSidebar.vue'

const store = useStore()
const router = useRouter()
const auth   = useAuthStore()
const drawerOpen = ref(false)
const searchQuery = ref('')
const filterModule = ref('')

const filteredMaterials = computed(() => {
  return store.materials.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchModule = filterModule.value === '' || m.module_name === filterModule.value
    return matchSearch && matchModule
  })
})

const moduleNames = computed(() => [...new Set(store.materials.map(m => m.module_name).filter(Boolean))])

async function deleteMaterial(mat) {
  if (!confirm(`Hapus materi "${mat.title}"?`)) return
  await store.deleteMaterial(mat.id)
}
async function logout() { await auth.logout(); router.push('/login') }
onMounted(() => { store.fetchMaterials(); store.fetchModules() })
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen = false" />

    <div class="flex-1 min-w-0" style="margin-left:256px;">
      <!-- Header -->
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center justify-between" style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <div class="flex items-center gap-3">
          <button @click="drawerOpen = true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center" style="background:#0d1526;">☰</button>
          <h1 class="font-bold text-xl" style="color:#0f172a;">Kelola Materi</h1>
        </div>
        <div class="mat-header-actions">
          <button @click="router.push('/')" class="px-4 py-2 rounded-xl text-sm font-semibold" style="border:1px solid #e2e8f0;color:#475569;">
            <img src="/logo.png" class="w-5 h-5 inline-block object-contain" alt="" /> <span class="mat-beranda-label">Beranda</span>
          </button>
          <router-link to="/admin/materi/tambah" class="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-blue-700 flex items-center gap-2" style="background:#2563eb;color:#fff;">+ Tambah</router-link>
        </div>
      </header>

      <div class="p-6 lg:p-8">
        <!-- Filters -->
        <div class="mat-filter-row mb-6">
          <div class="relative flex-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2" style="color:#94a3b8;">🔍</span>
            <input v-model="searchQuery" type="text" placeholder="Cari materi..." class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm" style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;" />
          </div>
          <select v-model="filterModule" class="px-4 py-2.5 rounded-xl text-sm mat-filter-select" style="border:1px solid #e2e8f0;background:#fff;color:#0f172a;outline:none;">
            <option value="">Semua Modul</option>
            <option v-for="name in moduleNames" :key="name" :value="name">{{ name }}</option>
          </select>
        </div>

        <!-- Stats row -->
        <div class="mat-stats-grid mb-6">
          <div class="rounded-2xl p-4" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <p class="text-2xl font-bold" style="color:#2563eb;">{{ store.materials.length }}</p>
            <p class="text-sm" style="color:#64748b;">Total Materi</p>
          </div>
          <div class="rounded-2xl p-4" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <p class="text-2xl font-bold" style="color:#22c55e;">{{ store.materials.filter(m=>m.video_url).length }}</p>
            <p class="text-sm" style="color:#64748b;">Ada Video</p>
          </div>
          <div class="rounded-2xl p-4" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <p class="text-2xl font-bold" style="color:#f97316;">{{ store.materials.filter(m=>m.jobsheet_url).length }}</p>
            <p class="text-sm" style="color:#64748b;">Ada Jobsheet</p>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="filteredMaterials.length === 0 && !store.loading" class="rounded-2xl text-center py-20" style="background:#fff;border:1px solid #e2e8f0;">
          <span style="font-size:4rem;">📚</span>
          <p class="font-semibold mt-4 mb-2" style="color:#475569;">{{ store.materials.length === 0 ? 'Belum ada materi' : 'Tidak ada hasil' }}</p>
          <router-link v-if="store.materials.length === 0" to="/admin/materi/tambah" class="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold" style="background:#2563eb;color:#fff;">+ Tambah Materi</router-link>
        </div>

        <!-- Desktop Table -->
        <div v-if="filteredMaterials.length > 0" class="rounded-2xl overflow-hidden mat-table-wrap" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <div class="overflow-x-auto">
            <table class="w-full text-sm" style="min-width:600px;">
              <thead>
                <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                  <th class="text-left px-6 py-3.5 font-semibold" style="color:#64748b;">Judul Materi</th>
                  <th class="text-left px-4 py-3.5 font-semibold" style="color:#64748b;">Modul</th>
                  <th class="text-left px-4 py-3.5 font-semibold" style="color:#64748b;">Konten</th>
                  <th class="text-left px-4 py-3.5 font-semibold" style="color:#64748b;">Ringkasan</th>
                  <th class="text-center px-4 py-3.5 font-semibold" style="color:#64748b;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mat in filteredMaterials" :key="mat.id" class="border-t transition-colors hover:bg-gray-50" style="border-color:#f1f5f9;">
                  <td class="px-6 py-4">
                    <p class="font-semibold" style="color:#0f172a;">{{ mat.title }}</p>
                    <div class="flex gap-1.5 mt-1.5">
                      <span v-if="mat.ppt_url" class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background:#eff6ff;color:#2563eb;">PPT</span>
                      <span v-if="mat.video_url" class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background:#fef2f2;color:#dc2626;">Video</span>
                      <span v-if="mat.jobsheet_url" class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background:#fff7ed;color:#ea580c;">Jobsheet</span>
                    </div>
                  </td>
                  <td class="px-4 py-4 text-sm" style="color:#475569;">{{ mat.module_name || '-' }}</td>
                  <td class="px-4 py-4">
                    <div class="flex items-center gap-2">
                      <span :class="mat.content ? 'text-green-500' : 'text-gray-300'">{{ mat.content ? '✓' : '—' }}</span>
                      <span :class="mat.video_url ? 'text-green-500' : 'text-gray-300'">{{ mat.video_url ? '✓' : '—' }}</span>
                      <span :class="mat.jobsheet_url ? 'text-green-500' : 'text-gray-300'">{{ mat.jobsheet_url ? '✓' : '—' }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <p class="text-xs line-clamp-2 max-w-xs" style="color:#94a3b8;">
                      {{ mat.content ? mat.content.replace(/<[^>]*>/g, '').slice(0, 70) + '...' : '-' }}
                    </p>
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex items-center justify-center gap-2">
                      <router-link :to="`/admin/materi/edit/${mat.id}`" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-blue-600" style="background:#2563eb;color:#fff;">✏️ Edit</router-link>
                      <router-link :to="`/admin/kuis/${mat.id}`" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;">✅ Kuis</router-link>
                      <button @click="deleteMaterial(mat)" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;">🗑️</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="px-6 py-3" style="border-top:1px solid #f1f5f9;background:#f8fafc;">
            <p class="text-sm" style="color:#64748b;">Menampilkan {{ filteredMaterials.length }} dari {{ store.materials.length }} materi</p>
          </div>
        </div>

        <!-- Mobile Cards (hanya tampil di mobile) -->
        <div v-if="filteredMaterials.length > 0" class="mat-mobile-cards space-y-3">
          <div v-for="mat in filteredMaterials" :key="'m-'+mat.id"
            class="rounded-2xl p-4" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div class="flex items-start justify-between gap-2 mb-2">
              <p class="font-semibold text-sm flex-1" style="color:#0f172a;">{{ mat.title }}</p>
              <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style="background:#f1f5f9;color:#475569;">{{ mat.module_name || '-' }}</span>
            </div>
            <div class="flex gap-1.5 mb-3">
              <span v-if="mat.ppt_url" class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background:#eff6ff;color:#2563eb;">PPT</span>
              <span v-if="mat.video_url" class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background:#fef2f2;color:#dc2626;">Video</span>
              <span v-if="mat.jobsheet_url" class="px-2 py-0.5 rounded-full text-xs font-semibold" style="background:#fff7ed;color:#ea580c;">Jobsheet</span>
              <span v-if="!mat.ppt_url && !mat.video_url && !mat.jobsheet_url" class="text-xs" style="color:#94a3b8;">Belum ada konten tambahan</span>
            </div>
            <div class="flex items-center gap-2">
              <router-link :to="`/admin/materi/edit/${mat.id}`" class="flex-1 text-center px-3 py-2 rounded-xl text-xs font-semibold" style="background:#2563eb;color:#fff;">✏️ Edit</router-link>
              <router-link :to="`/admin/kuis/${mat.id}`" class="flex-1 text-center px-3 py-2 rounded-xl text-xs font-semibold" style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;">✅ Kuis</router-link>
              <button @click="deleteMaterial(mat)" class="px-3 py-2 rounded-xl text-xs font-semibold" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;">🗑️</button>
            </div>
          </div>
          <p class="text-sm text-center py-2" style="color:#64748b;">Menampilkan {{ filteredMaterials.length }} dari {{ store.materials.length }} materi</p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>

/* Mobile cards: hidden di desktop, tampil di mobile */
.mat-mobile-cards { display: none; }

/* Filter row */
.mat-filter-row {
  display: flex;
  flex-direction: row;
  gap: 12px;
}
.mat-filter-select { min-width: 180px; }

/* Stats grid: 3 kolom (sama di semua ukuran) */
.mat-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* Header actions */
.mat-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 1023px) {
  /* Hilangkan margin sidebar */
  .flex-1.min-w-0 {
    margin-left: 0 !important;
    width: 100% !important;
    overflow-x: hidden;
  }

  /* Header padding */
  header.sticky {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  /* Content padding */
  .p-6.lg\:p-8 {
    padding: 12px !important;
  }

  /* Sembunyikan tabel, tampilkan cards */
  .mat-table-wrap { display: none !important; }
  .mat-mobile-cards { display: block !important; }

  /* Filter row stack */
  .mat-filter-row {
    flex-direction: column;
    gap: 8px;
  }
  .mat-filter-select { min-width: unset; width: 100%; }

  /* Stats grid lebih kecil */
  .mat-stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .mat-stats-grid .rounded-2xl {
    padding: 10px !important;
  }
  .mat-stats-grid .text-2xl {
    font-size: 1.25rem !important;
  }

  /* Header: sembunyikan label "Beranda" */
  .mat-beranda-label { display: none; }

  /* Prevent overflow */
  * { box-sizing: border-box; max-width: 100%; }
}
</style>