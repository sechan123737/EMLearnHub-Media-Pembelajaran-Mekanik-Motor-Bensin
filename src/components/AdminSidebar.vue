<script setup>
import { ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const props = defineProps({ open: { type: Boolean, default: false } })
const emit  = defineEmits(['close'])

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

// Pertahankan scroll position sidebar desktop saat navigasi
const desktopNav = ref(null)
let savedScrollTop = 0

function saveScroll() {
  if (desktopNav.value) savedScrollTop = desktopNav.value.scrollTop
}
function restoreScroll() {
  nextTick(() => {
    if (desktopNav.value) desktopNav.value.scrollTop = savedScrollTop
  })
}

const learnNav = [
  { label: 'Dashboard',    icon: '/icons/dashboard.png',  to: '/admin',             exact: true  },
  { label: 'Materi',       icon: '/icons/materi.png',  to: '/admin/materi',      exact: false },
  { label: 'Video',        icon: '/icons/video.png',  to: '/admin/video',       exact: false },
  { label: 'Jobsheet',     icon: '/icons/jobsheet.png',  to: '/admin/jobsheet',    exact: false },
  { label: 'Evaluasi',     icon: '/icons/kuis.png',  to: '/admin/kuis-global', exact: false },
  { label: 'Topik Materi', icon: '/icons/modul.png',  to: '/admin/modul',       exact: false },
]
const userNav = [
  { label: 'Mahasiswa', icon: '/icons/mahasiswa.png', to: '/admin/mahasiswa' },
]
const reportNav = [
  { label: 'Progress Belajar',   icon: '/icons/progress.png', to: '/admin/progress'  },
  { label: 'Hasil Evaluasi',     icon: '/icons/soal.png', to: '/admin/nilai'     },
  { label: 'Aktivitas Pengguna', icon: '/icons/aktivitas.png', to: '/admin/aktivitas' },
]
const settingNav = [
  { label: 'Pengaturan', icon: '/icons/setting.png', to: '/admin/pengaturan' },
]

function isActive(item) {
  if (!item.to) return false
  if (item.exact) return route.path === item.to
  return route.path.startsWith(item.to)
}
function navigate(to) {
  if (to) {
    saveScroll()
    router.push(to)
    emit('close')
  }
}
async function logout() {
  await auth.logout()
  router.push('/login')
  emit('close')
}
function onEnter(e, active) { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }
function onLeave(e, active) { if (!active) e.currentTarget.style.background = '' }
function onEnterPlain(e)    { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }
function onLeavePlain(e)    { e.currentTarget.style.background = '' }
function onEnterRed(e)      { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }
function onLeaveRed(e)      { e.currentTarget.style.background = '' }

// Restore scroll setelah navigasi, hanya tutup drawer di mobile
watch(() => route.path, () => {
  emit('close')
  restoreScroll()
})
</script>

<template>
  <!-- DESKTOP fixed sidebar -->
  <aside class="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-40"
    style="background:#0d1526; border-right:1px solid rgba(255,255,255,0.06);">

    <!-- Logo -->
    <div class="px-5 py-5 flex-shrink-0" style="border-bottom:1px solid rgba(255,255,255,0.06);">
      <div class="flex items-center gap-3 cursor-pointer" @click="router.push('/')">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
          style="background: linear-gradient(135deg, #ffffff, #f3f4f6);">
          <img src="/logo.png" alt="Logo" class="w-full h-full object-cover" />
        </div>
        <div>
          <div class="flex items-center gap-0.5">
            <span class="font-bold text-white text-sm">EMLearn</span>
            <span class="font-bold text-sm" style="color:#3b82f6;">Hub</span>
          </div>
          <p class="text-xs" style="color:#64748b;">Engine Mechanics Learning Hub</p>
        </div>
      </div>
    </div>

    <!-- Nav -->
    <nav ref="desktopNav" class="flex-1 px-3 py-4 overflow-y-auto space-y-5">

      <div>
        <p class="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style="color:#475569;">KELOLA PEMBELAJARAN</p>
        <div class="space-y-0.5">
          <button v-for="item in learnNav" :key="item.label + item.to"
            @click="navigate(item.to)"
            @mouseenter="onEnter($event, isActive(item))"
            @mouseleave="onLeave($event, isActive(item))"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
            :style="isActive(item) ? 'background:#1e40af;color:#fff;' : 'color:#94a3b8;'">
            <span class="flex-shrink-0"><template v-if="item.icon?.startsWith('/')"><img :src="item.icon" class="w-5 h-5 inline-block object-contain align-middle" alt="" /></template><template v-else>{{ item.icon }}</template></span>
            <span class="flex-1">{{ item.label }}</span>
            <span v-if="isActive(item)" class="w-1.5 h-1.5 rounded-full" style="background:#60a5fa;"></span>
          </button>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style="color:#475569;">KELOLA PENGGUNA</p>
        <div class="space-y-0.5">
          <button v-for="item in userNav" :key="item.label"
            @click="navigate(item.to)"
            @mouseenter="onEnter($event, isActive(item))"
            @mouseleave="onLeave($event, isActive(item))"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all"
            :style="isActive(item) ? 'background:#1e40af;color:#fff;' : 'color:#94a3b8;'">
            <span><template v-if="item.icon?.startsWith('/')"><img :src="item.icon" class="w-5 h-5 inline-block object-contain align-middle" alt="" /></template><template v-else>{{ item.icon }}</template></span>{{ item.label }}
          </button>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style="color:#475569;">LAPORAN &amp; ANALITIK</p>
        <div class="space-y-0.5">
          <button v-for="item in reportNav" :key="item.label"
            @click="navigate(item.to)"
            @mouseenter="onEnter($event, isActive(item))"
            @mouseleave="onLeave($event, isActive(item))"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all"
            :style="isActive(item) ? 'background:#1e40af;color:#fff;' : 'color:#94a3b8;'">
            <span><template v-if="item.icon?.startsWith('/')"><img :src="item.icon" class="w-5 h-5 inline-block object-contain align-middle" alt="" /></template><template v-else>{{ item.icon }}</template></span>{{ item.label }}
          </button>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style="color:#475569;">PENGATURAN</p>
        <div class="space-y-0.5">
          <button v-for="item in settingNav" :key="item.label"
            @click="navigate(item.to)"
            @mouseenter="onEnter($event, isActive(item))"
            @mouseleave="onLeave($event, isActive(item))"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all"
            :style="isActive(item) ? 'background:#1e40af;color:#fff;' : 'color:#94a3b8;'">
            <span><template v-if="item.icon?.startsWith('/')"><img :src="item.icon" class="w-5 h-5 inline-block object-contain align-middle" alt="" /></template><template v-else>{{ item.icon }}</template></span>{{ item.label }}
          </button>
        </div>
      </div>

    </nav>

    <!-- Aksi bawah public -->
    <div class="p-4 flex-shrink-0 space-y-1" style="border-top:1px solid rgba(255,255,255,0.06);">
      <!-- Ke Halaman Publik -->
      <button @click="router.push('/')"
        @mouseenter="onEnterPlain" @mouseleave="onLeavePlain"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all"
        style="color:#94a3b8;">
        <img src="/logo.png" class="w-5 h-5 inline-block object-contain" alt="" /> Halaman Publik
      </button>
      <!-- Logout -->
      <button @click="logout"
        @mouseenter="onEnterRed" @mouseleave="onLeaveRed"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all"
        style="color:#f87171;">
        <img src="/icons/keluar.png" class="w-5 h-5 inline-block object-contain" alt="" /> Keluar
      </button>
    </div>
  </aside>

  <!-- MOBILE drawer -->
  <Teleport to="body">
    <Transition name="mmb-fade">
      <div v-if="open" class="lg:hidden fixed inset-0 z-[60]"
        style="background:rgba(0,0,0,0.65);" @click="emit('close')" />
    </Transition>
    <Transition name="mmb-slide">
      <div v-if="open" class="lg:hidden fixed top-0 left-0 h-full w-72 z-[70] flex flex-col shadow-2xl"
        style="background:#0d1526; overflow-y:auto;">

        <div class="px-5 py-5 flex items-center justify-between flex-shrink-0"
          style="border-bottom:1px solid rgba(255,255,255,0.06);">
          <div class="flex items-center gap-3 cursor-pointer" @click="router.push('/'); emit('close')">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" 
            style="background: linear-gradient(135deg, #ffffff, #f3f4f6);">
            <img src="/logo.png" alt="Logo" class="w-full h-full object-cover" /></div>
            <div>
              <div class="flex items-center gap-0.5">
                <span class="font-bold text-white text-sm">EMLearn</span>
                <span class="font-bold text-sm" style="color:#3b82f6;">Hub</span>
              </div>
              <p class="text-xs" style="color:#64748b;">Engine Mechanics Learning Hub</p>
            </div>
          </div>
          <button @click="emit('close')" class="w-8 h-8 rounded-xl flex items-center justify-center"
            style="background:rgba(255,255,255,0.05);color:#94a3b8;">✕</button>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style="color:#475569;">KELOLA PEMBELAJARAN</p>
            <div class="space-y-0.5">
              <button v-for="item in learnNav" :key="item.label + item.to"
                @click="navigate(item.to)"
                class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-left"
                :style="isActive(item) ? 'background:#1e40af;color:#fff;' : 'color:#94a3b8;'">
                <span><template v-if="item.icon?.startsWith('/')"><img :src="item.icon" class="w-5 h-5 inline-block object-contain align-middle" alt="" /></template><template v-else>{{ item.icon }}</template></span><span class="flex-1">{{ item.label }}</span>
                <span v-if="isActive(item)" class="w-2 h-2 rounded-full" style="background:#60a5fa;"></span>
              </button>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style="color:#475569;">KELOLA PENGGUNA</p>
            <div class="space-y-0.5">
              <button v-for="item in userNav" :key="item.label"
                @click="navigate(item.to)"
                class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-left"
                :style="isActive(item) ? 'background:#1e40af;color:#fff;' : 'color:#94a3b8;'">
                <span><template v-if="item.icon?.startsWith('/')"><img :src="item.icon" class="w-5 h-5 inline-block object-contain align-middle" alt="" /></template><template v-else>{{ item.icon }}</template></span>{{ item.label }}
              </button>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style="color:#475569;">LAPORAN &amp; ANALITIK</p>
            <div class="space-y-0.5">
              <button v-for="item in reportNav" :key="item.label"
                @click="navigate(item.to)"
                class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-left"
                :style="isActive(item) ? 'background:#1e40af;color:#fff;' : 'color:#94a3b8;'">
                <span><template v-if="item.icon?.startsWith('/')"><img :src="item.icon" class="w-5 h-5 inline-block object-contain align-middle" alt="" /></template><template v-else>{{ item.icon }}</template></span>{{ item.label }}
              </button>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style="color:#475569;">PENGATURAN</p>
            <div class="space-y-0.5">
              <button v-for="item in settingNav" :key="item.label"
                @click="navigate(item.to)"
                class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-left"
                :style="isActive(item) ? 'background:#1e40af;color:#fff;' : 'color:#94a3b8;'">
                <span><template v-if="item.icon?.startsWith('/')"><img :src="item.icon" class="w-5 h-5 inline-block object-contain align-middle" alt="" /></template><template v-else>{{ item.icon }}</template></span>{{ item.label }}
              </button>
            </div>
          </div>
        </nav>

        <div class="p-4 flex-shrink-0 space-y-1" style="border-top:1px solid rgba(255,255,255,0.06);">
          <button @click="router.push('/'); emit('close')" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold"
            style="color:#94a3b8;">
            <img src="/logo.png" class="w-5 h-5 inline-block object-contain" alt="" /> Halaman Publik
          </button>
          <button @click="logout" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold"
            style="color:#f87171;">
            <img src="/icons/keluar.png" class="w-5 h-5 inline-block object-contain" alt="" /> Keluar
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mmb-fade-enter-active, .mmb-fade-leave-active { transition: opacity 0.25s ease; }
.mmb-fade-enter-from,   .mmb-fade-leave-to     { opacity: 0; }
.mmb-slide-enter-active, .mmb-slide-leave-active { transition: transform 0.28s cubic-bezier(0.4,0,0.2,1); }
.mmb-slide-enter-from,   .mmb-slide-leave-to    { transform: translateX(-100%); }
</style>
