<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import PublicNavbar from '../../components/PublicNavbar.vue'
import { useRouter } from 'vue-router'
import { useStore } from '../../stores/mainStore'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'

const props = defineProps({ id: String })
const store = useStore()
const auth  = useAuthStore()
const router = useRouter()

const material = computed(() => store.getMaterialById(props.id))
const activeTab = ref('materi')
const completedIds = ref(new Set())
const savingProgress = ref(false)
const praktikumSteps = ref([])
const showMobileSidebar = ref(false)

const tabs = [
  { key: 'materi', label: 'Ringkasan', icon: '/icons/ringkasan.png' },
  { key: 'materi-teks', label: 'Materi Teks', icon: '/icons/materi.png' },
  { key: 'video', label: 'Video', icon: '/icons/video.png' },
  { key: 'ppt', label: 'PPT', icon: '/icons/ppt.png' },
  { key: 'jobsheet', label: 'Jobsheet', icon: '/icons/jobsheet.png' },
  { key: 'kuis', label: 'Evaluasi', icon: '/icons/kuis.png' },
]

function getEmbedUrl(url) {
  if (!url) return ''
  if (url.includes('docs.google.com/presentation')) {
    const base = url.split('/edit')[0].split('/pub')[0].split('/embed')[0]
    return base + '/embed?start=false&loop=false&delayms=3000'
  }
  if (url.includes('canva.com')) {
    if (url.includes('/embed')) return url
    return url.replace('/view', '/embed').replace('/edit', '/embed')
  }
  return url
}

function getYoutubeEmbed(url) {
  if (!url) return ''
  let id = ''
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&]+)/]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) { id = m[1]; break }
  }
  return id ? `https://www.youtube.com/embed/${id}` : url
}

const module = computed(() => store.modules.find(m => String(m.id) === String(material.value?.module_id)))

const moduleMaterials = computed(() => {
  if (!module.value) return []
  return store.materials
    .filter(m => String(m.module_id) === String(module.value.id))
    .sort((a, b) => (a.order_num || 0) - (b.order_num || 0))
})

const currentIndex = computed(() => moduleMaterials.value.findIndex(m => String(m.id) === String(props.id)))
const prevMaterial = computed(() => currentIndex.value > 0 ? moduleMaterials.value[currentIndex.value - 1] : null)
const nextMaterial = computed(() => currentIndex.value < moduleMaterials.value.length - 1 ? moduleMaterials.value[currentIndex.value + 1] : null)

const progressPct = computed(() => {
  if (!moduleMaterials.value.length) return 0
  return Math.round((completedIds.value.size / moduleMaterials.value.length) * 100)
})
const isCurrentDone = computed(() => completedIds.value.has(props.id))

async function fetchProgress() {
  if (!auth.user) return
  const matIds = moduleMaterials.value.map(m => m.id)
  if (!matIds.length) return
  const { data } = await supabase
    .from('material_progress')
    .select('material_id')
    .eq('user_id', auth.user.id)
    .in('material_id', matIds)
  if (data) completedIds.value = new Set(data.map(r => r.material_id))
}

onMounted(async () => {
  if (store.materials.length === 0) await store.fetchMaterials()
  if (store.modules.length === 0) await store.fetchModules()
  await fetchProgress()
  praktikumSteps.value = await store.fetchPraktikumSteps(props.id)
})

watch(() => props.id, async () => { await store.fetchMaterials(); await fetchProgress() })

async function toggleSelesai() {
  if (!auth.user || savingProgress.value) return
  savingProgress.value = true
  try {
    if (isCurrentDone.value) {
      await supabase.from('material_progress')
        .delete()
        .eq('user_id', auth.user.id)
        .eq('material_id', props.id)
      completedIds.value.delete(props.id)
      completedIds.value = new Set(completedIds.value)
    } else {
      await supabase.from('material_progress')
        .upsert({ user_id: auth.user.id, material_id: props.id })
      completedIds.value = new Set([...completedIds.value, props.id])
    }
  } finally {
    savingProgress.value = false
  }
}

// Tutup sidebar mobile saat tab berubah
watch(activeTab, () => { showMobileSidebar.value = false })
</script>

<template>
  <div class="min-h-screen" style="background:#f8fafc;">
    <PublicNavbar active="materi" />

    <!-- MOBILE SIDEBAR OVERLAY -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showMobileSidebar"
          class="fixed inset-0 z-40 lg:hidden"
          style="background:rgba(0,0,0,0.5);"
          @click="showMobileSidebar = false" />
      </Transition>
      <Transition name="slide-up">
        <div v-if="showMobileSidebar"
          class="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-2xl overflow-hidden"
          style="background:#fff;max-height:80vh;display:flex;flex-direction:column;">

          <!-- Handle bar -->
          <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div class="w-10 h-1 rounded-full" style="background:#e2e8f0;"></div>
          </div>

          <!-- Header drawer -->
          <div class="px-5 py-3 border-b flex items-center justify-between flex-shrink-0" style="border-color:#e2e8f0;">
            <h3 class="font-bold text-base" style="color:#0f172a;">Daftar Materi</h3>
            <button @click="showMobileSidebar = false"
              class="w-8 h-8 rounded-full flex items-center justify-center"
              style="background:#f1f5f9;color:#64748b;">✕</button>
          </div>

          <!-- Module info (compact) -->
          <div class="px-5 py-3 border-b flex-shrink-0" style="border-color:#e2e8f0;background:#f8fafc;">
            <p class="font-semibold text-sm mb-1" style="color:#0f172a;">{{ module?.name }}</p>
            <!-- Progress bar -->
            <div class="flex items-center gap-2">
              <div class="flex-1 h-1.5 rounded-full" style="background:#e2e8f0;">
                <div class="h-1.5 rounded-full transition-all duration-500"
                  style="background:#2563eb;"
                  :style="`width:${progressPct}%;`"></div>
              </div>
              <span class="text-xs font-bold" style="color:#2563eb;">{{ progressPct }}%</span>
            </div>
            <p class="text-xs mt-1" style="color:#94a3b8;">{{ completedIds.size }} dari {{ moduleMaterials.length }} selesai</p>
          </div>

          <!-- Daftar materi scrollable -->
          <nav class="flex-1 overflow-y-auto p-3">
            <button
              v-for="(mat, idx) in moduleMaterials" :key="mat.id"
              @click="router.push(`/materi/${mat.id}`); showMobileSidebar = false"
              class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left mb-1 transition-all"
              :style="String(mat.id) === String(props.id)
                ? 'background:#eff6ff;border:1px solid #bfdbfe;'
                : 'border:1px solid transparent;'"
            >
              <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                :style="completedIds.has(mat.id)
                  ? 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;'
                  : String(mat.id) === String(props.id)
                    ? 'background:#2563eb;color:#fff;'
                    : 'background:#f1f5f9;color:#64748b;'">
                {{ completedIds.has(mat.id) ? '✓' : idx + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate"
                  :style="String(mat.id) === String(props.id) ? 'color:#1d4ed8;' : 'color:#0f172a;'">
                  {{ mat.title }}
                </p>
                <p class="text-xs" style="color:#94a3b8;">7 Menit</p>
              </div>
            </button>
          </nav>
        </div>
      </Transition>
    </Teleport>

    <div class="flex" style="min-height:calc(100vh - 64px);">

      <!-- SIDEBAR KIRI (desktop only) -->
      <aside class="hidden lg:flex flex-col w-72 flex-shrink-0 sticky top-16 self-start"
        style="height:calc(100vh - 64px);background:#fff;border-right:1px solid #e2e8f0;overflow-y:auto;">

        <div class="p-5 border-b" style="border-color:#e2e8f0;">
          <div class="w-full h-28 rounded-xl overflow-hidden flex items-center justify-center mb-4"
            style="background:linear-gradient(135deg,#1e293b,#334155);">
            <img v-if="module?.image_url" :src="module.image_url" :alt="module?.name" class="w-full h-full object-cover" />
            <span v-else style="font-size:3rem;opacity:0.4;">📷</span>
          </div>
          <h2 class="font-bold text-base mb-1" style="color:#0f172a;">{{ module?.name }}</h2>
          <p class="text-xs" style="color:#64748b;">{{ moduleMaterials.length }} Materi • {{ moduleMaterials.length * 7 }} Menit</p>
        </div>

        <div class="px-5 py-4 border-b" style="border-color:#e2e8f0;">
          <p class="text-xs font-semibold uppercase tracking-wider mb-3" style="color:#475569;">DAFTAR MATERI</p>
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-bold" style="color:#0f172a;">Progress Belajar</span>
            <span class="text-sm font-bold" style="color:#2563eb;">{{ progressPct }}%</span>
          </div>
          <div class="w-full h-2 rounded-full mb-2" style="background:#e2e8f0;">
            <div class="h-2 rounded-full transition-all duration-500"
              style="background:#2563eb;"
              :style="`width:${progressPct}%;`"></div>
          </div>
          <p class="text-xs" style="color:#94a3b8;">{{ completedIds.size }} dari {{ moduleMaterials.length }} materi selesai</p>
        </div>

        <nav class="flex-1 p-3">
          <button
            v-for="(mat, idx) in moduleMaterials" :key="mat.id"
            @click="router.push(`/materi/${mat.id}`)"
            class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left mb-1 transition-all"
            :style="String(mat.id) === String(props.id)
              ? 'background:#eff6ff;border:1px solid #bfdbfe;'
              : 'hover:background:#f8fafc;border:1px solid transparent;'"
          >
            <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              :style="completedIds.has(mat.id)
                ? 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;'
                : String(mat.id) === String(props.id)
                  ? 'background:#2563eb;color:#fff;'
                  : 'background:#f1f5f9;color:#64748b;'">
              {{ completedIds.has(mat.id) ? '✓' : idx + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate"
                :style="String(mat.id) === String(props.id) ? 'color:#1d4ed8;' : 'color:#0f172a;'">
                {{ mat.title }}
              </p>
              <p class="text-xs" style="color:#94a3b8;">7 Menit</p>
            </div>
          </button>
        </nav>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="flex-1 min-w-0 p-4 lg:p-8">

        <!-- Loading -->
        <div v-if="store.loading" class="flex items-center justify-center min-h-60">
          <div class="text-center">
            <div class="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p style="color:#64748b;">Memuat materi...</p>
          </div>
        </div>

        <!-- Not found -->
        <div v-else-if="!material" class="flex items-center justify-center min-h-60">
          <div class="text-center">
            <span style="font-size:4rem;">🔍</span>
            <p class="font-semibold mt-4 mb-4" style="color:#475569;">Materi tidak ditemukan</p>
            <button @click="router.push('/')" class="px-5 py-2.5 rounded-xl text-sm font-semibold" style="background:#2563eb;color:#fff;">Kembali ke Beranda</button>
          </div>
        </div>

        <template v-else>

          <!-- MOBILE: Module info bar + trigger sidebar -->
          <div class="lg:hidden mb-4 rounded-xl px-4 py-3 flex items-center gap-3"
            style="background:#fff;border:1px solid #e2e8f0;">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold truncate" style="color:#64748b;">{{ module?.name }}</p>
              <div class="flex items-center gap-2 mt-1">
                <div class="flex-1 h-1.5 rounded-full" style="background:#e2e8f0;">
                  <div class="h-1.5 rounded-full transition-all duration-500" style="background:#2563eb;" :style="`width:${progressPct}%;`"></div>
                </div>
                <span class="text-xs font-bold flex-shrink-0" style="color:#2563eb;">{{ progressPct }}%</span>
              </div>
            </div>
            <button @click="showMobileSidebar = true"
              class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0"
              style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;">
              ☰ Materi
            </button>
          </div>

          <!-- Breadcrumb -->
          <div class="flex items-center gap-1.5 text-xs lg:text-sm mb-4 flex-wrap" style="color:#94a3b8;">
            <span @click="router.push('/')" class="cursor-pointer hover:text-blue-500">Materi</span>
            <span>›</span>
            <span @click="module ? router.push(`/modul/${module.id}`) : null"
              class="cursor-pointer hover:text-blue-500 truncate max-w-[120px] lg:max-w-none">{{ module?.name }}</span>
            <span>›</span>
            <span class="truncate max-w-[120px] lg:max-w-none" style="color:#0f172a;">{{ material.title }}</span>
          </div>

          <!-- Title + actions -->
          <div class="mb-5">
            <h1 class="font-bold text-xl lg:text-2xl mb-2" style="color:#0f172a;">{{ material.title }}</h1>
            <p class="text-sm mb-4" style="color:#64748b;">Pada materi ini akan membahas tentang tahapan proses pada mesin bensin 4 langkah (siklus Otto) secara detail.</p>
            <!-- Actions: full width on mobile -->
            <div class="flex items-center gap-2">
              <button @click="module ? router.push(`/modul/${module.id}`) : router.push('/')"
                class="flex-1 lg:flex-none px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:bg-gray-100"
                style="border:1px solid #e2e8f0;color:#475569;background:#fff;">
                ← Kembali
              </button>
              <button
                @click="toggleSelesai"
                :disabled="savingProgress"
                class="flex-1 lg:flex-none px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
                :style="isCurrentDone
                  ? 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;'
                  : 'background:#2563eb;color:#fff;'"
              >
                {{ savingProgress ? '⏳' : isCurrentDone ? '✅ Selesai' : '✓ Tandai Selesai' }}
              </button>
            </div>
          </div>

          <!-- TABS — horizontal scroll on mobile -->
          <div class="mb-6 border-b overflow-x-auto" style="border-color:#e2e8f0;">
            <div class="flex gap-0 min-w-max">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                @click="activeTab = tab.key"
                class="flex items-center gap-1.5 px-3 lg:px-4 py-3 text-xs lg:text-sm font-semibold whitespace-nowrap transition-all"
                :style="activeTab === tab.key
                  ? 'color:#2563eb;border-bottom:2px solid #2563eb;margin-bottom:-1px;'
                  : 'color:#64748b;border-bottom:2px solid transparent;margin-bottom:-1px;'"
              >
                <img v-if="tab.icon?.startsWith('/')" :src="tab.icon" class="w-4 h-4 object-contain" alt="" />
                <template v-else>{{ tab.icon }}</template>
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- TAB: RINGKASAN -->
          <div v-if="activeTab === 'materi'" class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div class="lg:col-span-2">
              <div class="rounded-2xl p-5 lg:p-6" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
                <h2 class="font-bold text-lg mb-4" style="color:#0f172a;">Ringkasan Materi</h2>
                <div v-if="material.content" class="prose-content text-sm leading-relaxed" style="color:#475569;" v-html="material.content" />
                <div v-else class="text-center py-12" style="color:#94a3b8;">
                  <span style="font-size:3rem;">📚</span>
                  <p class="mt-3">Konten materi belum ditambahkan.</p>
                </div>
              </div>
            </div>
            <div class="space-y-4">
              <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #e2e8f0;">
                <h3 class="font-bold text-sm mb-3" style="color:#0f172a;">Informasi Materi</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center gap-2" style="color:#64748b;"><span>📚</span> {{ moduleMaterials.length }} Sub-materi</div>
                  <div class="flex items-center gap-2" style="color:#64748b;"><span>🕐</span> Estimasi {{ moduleMaterials.length * 7 }} Menit</div>
                  <div v-if="material.video_url" class="flex items-center gap-2" style="color:#64748b;"><span>▶️</span> Video tersedia</div>
                  <div v-if="material.jobsheet_url" class="flex items-center gap-2" style="color:#64748b;"><span>📋</span> Jobsheet tersedia</div>
                </div>
              </div>
              <div class="rounded-2xl p-5" style="background:#eff6ff;border:1px solid #bfdbfe;">
                <h3 class="font-bold text-sm mb-2" style="color:#1d4ed8;">💡 Catatan</h3>
                <p class="text-xs" style="color:#1d4ed8;">Pelajari materi secara berurutan untuk hasil yang optimal.</p>
              </div>
            </div>
          </div>

          <!-- TAB: MATERI TEKS -->
          <div v-if="activeTab === 'materi-teks'" class="rounded-2xl p-5 lg:p-8" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div class="flex items-center gap-3 mb-6 pb-5 border-b" style="border-color:#e2e8f0;">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style="background:#eff6ff;">📄</div>
              <h2 class="font-bold text-lg lg:text-xl" style="color:#0f172a;">Materi Pembelajaran</h2>
            </div>
            <div v-if="material.content" class="prose-content leading-relaxed" style="color:#374151;" v-html="material.content" />
            <div v-else class="text-center py-12" style="color:#94a3b8;">
              <span style="font-size:3rem;">📚</span>
              <p class="mt-3">Konten materi belum ditambahkan.</p>
            </div>
          </div>

          <!-- TAB: VIDEO -->
          <div v-if="activeTab === 'video'">
            <div class="rounded-2xl overflow-hidden" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
              <div class="px-4 lg:px-6 py-4 border-b flex items-center gap-3" style="border-color:#e2e8f0;">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style="background:#fff7ed;">▶️</div>
                <h2 class="font-bold text-lg lg:text-xl" style="color:#0f172a;">Video Pembelajaran</h2>
              </div>
              <div v-if="material.video_url" class="p-3 lg:p-4">
                <div class="rounded-xl overflow-hidden bg-black" style="aspect-ratio:16/9;">
                  <iframe :src="getYoutubeEmbed(material.video_url)" class="w-full h-full" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen />
                </div>
                <div class="mt-4 p-3 rounded-xl flex items-start gap-2 text-sm" style="background:#eff6ff;">
                  <span>ℹ️</span>
                  <p style="color:#1d4ed8;">Video ini menjelaskan siklus pembakaran pada mesin bensin 4 langkah secara visual dan mudah dipahami.</p>
                </div>
                <div class="mt-4">
                  <h3 class="font-bold mb-2" style="color:#0f172a;">Deskripsi Video</h3>
                  <p class="text-sm" style="color:#64748b;">Video ini menjelaskan secara visual tahapan proses pada mesin bensin 4 langkah mulai dari langkah hisap, kompresi, usaha, hingga buang.</p>
                </div>
              </div>
              <div v-else class="py-16 text-center" style="color:#94a3b8;">
                <span style="font-size:3rem;">▶️</span>
                <p class="font-semibold mt-3 mb-1">Belum Ada Video</p>
                <p class="text-sm">Admin belum menambahkan video pembelajaran.</p>
              </div>
            </div>
            <div class="mt-5 rounded-2xl p-5" style="background:#fff;border:1px solid #e2e8f0;">
              <h3 class="font-bold mb-3" style="color:#0f172a;">Tips Belajar</h3>
              <div class="grid grid-cols-2 lg:grid-cols-1 gap-2 text-sm" style="color:#64748b;">
                <div class="flex items-center gap-2"><span class="text-green-500">✓</span> Tonton video sampai selesai</div>
                <div class="flex items-center gap-2"><span class="text-green-500">✓</span> Catat poin penting dari video</div>
                <div class="flex items-center gap-2"><span class="text-green-500">✓</span> Kerjakan jobsheet terkait</div>
                <div class="flex items-center gap-2"><span class="text-green-500">✓</span> Uji pemahaman dengan evaluasi</div>
              </div>
            </div>
          </div>

          <!-- TAB: PPT -->
          <div v-if="activeTab === 'ppt'" class="rounded-2xl overflow-hidden" style="background:#fff;border:1px solid #e2e8f0;">
            <div class="px-4 lg:px-6 py-4 border-b flex items-center justify-between" style="border-color:#e2e8f0;">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style="background:#eff6ff;">📊</div>
                <h2 class="font-bold text-lg lg:text-xl" style="color:#0f172a;">Presentasi Materi</h2>
              </div>
              <a v-if="material.ppt_url" :href="material.ppt_url" target="_blank"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style="background:#2563eb;color:#fff;">🔗 Buka</a>
            </div>
            <div v-if="material.ppt_url" class="p-3 lg:p-4">
              <!-- Aspect ratio lebih pendek di mobile agar tidak terlalu kecil -->
              <div class="rounded-xl overflow-hidden" style="background:#0f172a;">
                <div style="position:relative;padding-bottom:56.25%;height:0;">
                  <iframe :src="getEmbedUrl(material.ppt_url)"
                    style="position:absolute;top:0;left:0;width:100%;height:100%;min-height:260px;"
                    frameborder="0" allowfullscreen allow="autoplay" />
                </div>
              </div>
              <div class="mt-4 p-3 rounded-xl flex items-center gap-2 text-sm" style="background:#eff6ff;border:1px solid #bfdbfe;">
                <span>💡</span>
                <p style="color:#1d4ed8;">Gunakan ikon fullscreen untuk tampilan lebih besar. Ketuk/klik layar untuk navigasi slide.</p>
              </div>
            </div>
            <div v-else class="py-16 text-center" style="color:#94a3b8;">
              <span style="font-size:3rem;">📊</span>
              <p class="font-semibold mt-3 mb-1">Belum Ada Presentasi</p>
              <p class="text-sm">Admin belum menambahkan file PPT untuk materi ini.</p>
            </div>
          </div>

          <!-- TAB: JOBSHEET -->
          <div v-if="activeTab === 'jobsheet'">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div class="lg:col-span-2 rounded-2xl overflow-hidden" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
                <div class="px-4 lg:px-6 py-4 border-b flex items-center gap-3" style="border-color:#e2e8f0;">
                  <h2 class="font-bold text-lg lg:text-xl" style="color:#0f172a;">Jobsheet Praktikum</h2>
                </div>
                <div class="px-4 lg:px-6 py-2 border-b" style="border-color:#e2e8f0;">
                  <p style="color:#64748b;font-size:0.875rem;">{{ material.title }}</p>
                </div>
                <div v-if="material.jobsheet_url" class="p-3 lg:p-4">
                  <!-- PDF embed: fixed height on mobile, larger on desktop -->
                  <div class="rounded-xl overflow-hidden border" style="border-color:#e2e8f0;height:55vw;min-height:280px;max-height:65vh;">
                    <embed :src="material.jobsheet_url" type="application/pdf" class="w-full h-full" />
                  </div>
                  <!-- Mobile: tombol buka PDF baru agar lebih mudah -->
                  <a :href="material.jobsheet_url" target="_blank"
                    class="lg:hidden mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                    style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;">
                    📄 Buka PDF di Tab Baru
                  </a>
                  <div class="mt-4 p-4 rounded-xl flex items-start gap-2 text-sm" style="background:#eff6ff;">
                    <span>ℹ️</span>
                    <p class="font-semibold" style="color:#1d4ed8;">Petunjuk</p>
                  </div>
                </div>
                <div v-else class="py-16 text-center" style="color:#94a3b8;">
                  <span style="font-size:3rem;">📋</span>
                  <p class="font-semibold mt-3 mb-1">Belum Ada Jobsheet</p>
                  <p class="text-sm">Admin belum mengunggah jobsheet praktik.</p>
                </div>
              </div>

              <!-- Right sidebar -->
              <div class="space-y-4">
                <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #e2e8f0;">
                  <h3 class="font-bold text-sm mb-3" style="color:#0f172a;">Unduh Jobsheet</h3>
                  <p class="text-xs mb-3" style="color:#64748b;">Unduh file jobsheet untuk praktikum ini.</p>
                  <div v-if="material.jobsheet_url" class="flex items-center gap-3 p-3 rounded-xl mb-3" style="background:#fef2f2;border:1px solid #fecaca;">
                    <span>📄</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-semibold" style="color:#0f172a;">Jobsheet.pdf</p>
                      <p class="text-xs" style="color:#94a3b8;">PDF • 1.2 MB</p>
                    </div>
                    <a :href="material.jobsheet_url" download class="text-blue-500 hover:text-blue-700">⬇</a>
                  </div>
                  <a v-if="material.jobsheet_url" :href="material.jobsheet_url" download
                    class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold mt-2"
                    style="background:#2563eb;color:#fff;">
                    ⬇ Unduh Semua File
                  </a>
                </div>

                <div class="rounded-2xl p-5" style="background:#fff;border:1px solid #e2e8f0;">
                  <h3 class="font-bold text-sm mb-3" style="color:#0f172a;">Langkah Praktikum</h3>
                  <div v-if="praktikumSteps.length > 0" class="space-y-2">
                    <div v-for="(step, i) in praktikumSteps" :key="step.id"
                      class="flex items-center gap-2 p-3 rounded-xl" style="border:1px solid #e2e8f0;">
                      <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style="background:#2563eb;">{{ i+1 }}</span>
                      <span class="text-sm" style="color:#374151;">{{ step.step_text }}</span>
                    </div>
                  </div>
                  <div v-else class="text-center py-6" style="color:#94a3b8;">
                    <p class="text-sm">Langkah praktikum belum ditambahkan.</p>
                  </div>
                </div>

                <div class="rounded-2xl p-5" style="background:#fffbeb;border:1px solid #fde68a;">
                  <h3 class="font-bold text-sm mb-2 flex items-center gap-2" style="color:#92400e;">💡 Catatan</h3>
                  <p class="text-xs" style="color:#92400e;">Utamakan Keselamatan.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB: EVALUASI -->
          <div v-if="activeTab === 'kuis'" class="rounded-2xl p-6 lg:p-8 text-center" style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div class="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center text-4xl lg:text-5xl mx-auto mb-5" style="background:#f0fdf4;">✅</div>
            <h2 class="font-bold text-xl lg:text-2xl mb-3" style="color:#0f172a;">Evaluasi: {{ material.title }}</h2>
            <p class="mb-8 max-w-md mx-auto text-sm" style="color:#64748b;">
              Kerjakan evaluasi berikut untuk menguji pemahamanmu. Setiap jawaban akan memberikan feedback langsung.
            </p>
            <router-link :to="`/materi/${material.id}/kuis`"
              class="inline-flex items-center gap-2 px-6 lg:px-8 py-3 rounded-xl text-base font-semibold transition-all hover:bg-blue-700"
              style="background:#2563eb;color:#fff;">
              🚀 Mulai Evaluasi Sekarang
            </router-link>
          </div>

          <!-- Navigation bottom -->
          <div class="flex items-stretch justify-between mt-8 gap-3">
            <button v-if="prevMaterial"
              @click="router.push(`/materi/${prevMaterial.id}`)"
              class="flex-1 flex flex-col items-start px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-gray-100"
              style="border:1px solid #e2e8f0;color:#475569;background:#fff;">
              <span class="text-xs mb-0.5" style="color:#94a3b8;">← Sebelumnya</span>
              <span class="truncate w-full" style="color:#0f172a;font-size:0.8rem;">{{ prevMaterial.title }}</span>
            </button>
            <div v-else class="flex-1"></div>
            <button v-if="nextMaterial"
              @click="router.push(`/materi/${nextMaterial.id}`)"
              class="flex-1 flex flex-col items-end px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-blue-700 text-right"
              style="background:#2563eb;color:#fff;">
              <span class="text-xs mb-0.5" style="opacity:0.7;">Selanjutnya →</span>
              <span class="truncate w-full" style="font-size:0.8rem;">{{ nextMaterial.title }}</span>
            </button>
          </div>

        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Sidebar bottom sheet transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }

/* Prose content */
.prose-content :deep(h1), .prose-content :deep(h2), .prose-content :deep(h3) { font-weight:700; color:#0f172a; margin-top:1.5rem; margin-bottom:0.75rem; }
.prose-content :deep(h1) { font-size:1.75rem; }
.prose-content :deep(h2) { font-size:1.4rem; border-bottom:1px solid #e2e8f0; padding-bottom:0.5rem; }
.prose-content :deep(h3) { font-size:1.15rem; color:#2563eb; }
.prose-content :deep(p) { margin-bottom:1rem; line-height:1.8; }
.prose-content :deep(ul), .prose-content :deep(ol) { padding-left:1.5rem; margin-bottom:1rem; }
.prose-content :deep(li) { margin-bottom:0.4rem; }
.prose-content :deep(strong) { color:#0f172a; font-weight:700; }
.prose-content :deep(img) { border-radius:0.75rem; max-width:100%; margin:1rem 0; }
.prose-content :deep(table) { width:100%; border-collapse:collapse; margin:1.5rem 0; font-size:0.9rem; }
.prose-content :deep(th) { background:#eff6ff; color:#1d4ed8; padding:0.75rem 1rem; text-align:left; font-weight:600; border-bottom:2px solid #bfdbfe; }
.prose-content :deep(td) { padding:0.75rem 1rem; border-bottom:1px solid #e2e8f0; color:#374151; }
.prose-content :deep(blockquote) { border-left:3px solid #2563eb; padding-left:1rem; color:#64748b; font-style:italic; margin:1rem 0; }
.prose-content :deep(code) { background:#eff6ff; padding:0.2rem 0.4rem; border-radius:4px; font-size:0.85rem; color:#2563eb; }

/* Hide scrollbar on tab strip */
.overflow-x-auto::-webkit-scrollbar { display: none; }
.overflow-x-auto { -ms-overflow-style: none; scrollbar-width: none; }
</style>