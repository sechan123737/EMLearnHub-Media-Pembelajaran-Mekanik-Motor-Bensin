<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const props = defineProps({
  active: { type: String, default: '' }
})

const router = useRouter()
const auth   = useAuthStore()

const navItems = [
  { key: 'beranda',   label: 'Beranda',   to: '/' },
  { key: 'materi',    label: 'Materi',    to: '/materi' },
  { key: 'video',     label: 'Video',     to: '/video' },
  { key: 'jobsheet',  label: 'Jobsheet',  to: '/jobsheet' },
  { key: 'evaluasi',  label: 'Evaluasi',  to: '/kuis-global' },
  { key: 'tentang',   label: 'Tentang',   to: '/tentang' },
]

function isActive(key) { return props.active === key }

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <nav style="background:#0d1526;border-bottom:1px solid rgba(255,255,255,0.06);" class="sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

      <!-- Logo -->
      <div class="flex items-center gap-3 cursor-pointer flex-shrink-0" @click="router.push('/')">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
          style="background: linear-gradient(135deg, #ffffff, #f3f4f6);">
          <img src="/logo.png" alt="Logo" class="w-full h-full object-cover" />
        </div>
        <div class="hidden sm:block">
          <div class="flex items-center gap-0.5">
            <span class="font-bold text-white text-lg">EMLearn</span>
            <span class="font-bold text-lg" style="color:#3b82f6;">Hub</span>
          </div>
          <p class="text-xs" style="color:#64748b;">Engine Mechanics Learning Hub</p>
        </div>
      </div>

      <!-- Nav links (desktop) -->
      <div class="hidden md:flex items-center gap-6">
        <button
          v-for="item in navItems" :key="item.key"
          @click="router.push(item.to)"
          class="text-sm font-medium transition-colors hover:text-white relative pb-0.5"
          :style="isActive(item.key)
            ? 'color:#3b82f6;border-bottom:2px solid #3b82f6;padding-bottom:2px;'
            : 'color:#94a3b8;'"
        >{{ item.label }}</button>
      </div>

      <!-- User area -->
      <div class="flex items-center gap-2 flex-shrink-0">

        <!-- Sudah login -->
        <template v-if="auth.isLoggedIn">
          <!-- Nama user -->
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style="background:#2563eb;">{{ auth.displayName.charAt(0).toUpperCase() }}</span>
            <div class="flex flex-col leading-tight">
              <span class="text-sm font-semibold" style="color:#e2e8f0;">{{ auth.displayName }}</span>
              <span v-if="auth.displayNim" class="text-xs" style="color:#64748b;">{{ auth.displayNim }}</span>
            </div>
            <span v-if="auth.isAdmin" class="text-xs px-1.5 py-0.5 rounded-md font-bold"
              style="background:#1e40af;color:#93c5fd;">Admin</span>
          </div>
          <!-- Tombol admin (hanya untuk admin) -->
          <button v-if="auth.isAdmin"
            @click="router.push('/admin')"
            class="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-blue-700"
            style="background:#2563eb;color:#fff;">
            🛠️ Dashboard
          </button>
          <!-- Logout -->
          <button @click="logout"
            class="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style="border:1px solid rgba(239,68,68,0.3);color:#f87171;"
            onmouseenter="this.style.background='rgba(239,68,68,0.1)'"
            onmouseleave="this.style.background='transparent'">
            <img src="/icons/keluar.png" class="w-5 h-5 inline-block object-contain" alt="" /> Keluar
          </button>
        </template>

        <!-- Belum login -->
        <template v-else>
          <button @click="router.push('/login')"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-blue-700"
            style="background:#2563eb;color:#fff;">
            👤 Masuk
          </button>
        </template>

        <!-- Mobile hamburger -->
        <div class="md:hidden relative ml-1">
          <details class="group">
            <summary class="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer list-none"
              style="background:rgba(255,255,255,0.06);color:#94a3b8;">☰</summary>
            <div class="absolute right-0 top-11 rounded-2xl p-2 w-48 z-50 shadow-2xl"
              style="background:#0d1526;border:1px solid rgba(255,255,255,0.1);">
              <button v-for="item in navItems" :key="item.key"
                @click="router.push(item.to)"
                class="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                :style="isActive(item.key) ? 'background:#1e40af;color:#fff;' : 'color:#94a3b8;'"
              >{{ item.label }}</button>
              <div style="border-top:1px solid rgba(255,255,255,0.06);margin:6px 0;"></div>
              <div v-if="auth.isLoggedIn" class="px-3 py-1.5" style="color:#64748b;">
                <div class="text-xs font-semibold" style="color:#e2e8f0;">{{ auth.displayName }}</div>
                <div v-if="auth.displayNim" class="text-xs">{{ auth.displayNim }}</div>
              </div>
              <button v-if="auth.isAdmin" @click="router.push('/admin')"
                class="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold"
                style="color:#60a5fa;">🛠️ Dashboard Admin</button>
              <button v-if="auth.isLoggedIn" @click="logout"
                class="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold"
                style="color:#f87171;">🚪 Keluar</button>
              <button v-else @click="router.push('/login')"
                class="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold"
                style="color:#60a5fa;">👤 Masuk</button>
            </div>
          </details>
        </div>
      </div>
    </div>
  </nav>
</template>