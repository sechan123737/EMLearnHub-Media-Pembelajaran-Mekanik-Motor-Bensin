<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

const email    = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)
const showPwd  = ref(false)

async function login() {
  if (!email.value.trim() || !password.value) { error.value = 'Email dan password wajib diisi!'; return }
  error.value = ''
  loading.value = true
  const res = await auth.login(email.value.trim(), password.value)
  loading.value = false
  if (!res.ok) {
    error.value = 'Email atau password salah!'
    return
  }
  // Redirect: admin ke dashboard, user ke halaman sebelumnya atau home
  const redirect = route.query.redirect || '/'
  if (auth.isAdmin) router.push('/admin')
  else router.push(redirect)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4"
    style="background:linear-gradient(135deg,#0d1526 0%,#0f1f3d 50%,#0d1526 100%);">

    <!-- BG glows -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div style="position:absolute;top:25%;left:20%;width:280px;height:280px;background:rgba(37,99,235,0.08);border-radius:50%;filter:blur(60px);"></div>
      <div style="position:absolute;bottom:25%;right:20%;width:350px;height:350px;background:rgba(37,99,235,0.05);border-radius:50%;filter:blur(80px);"></div>
    </div>

    <div class="relative w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4"
          style="background: linear-gradient(135deg, #ffffff, #f3f4f6);">
          <img src="/logo.png" alt="Logo" class="w-full h-full object-cover" />
        </div>
        <div class="flex items-center justify-center gap-1 mb-1">
          <span class="font-bold text-2xl text-white">EMLearn</span>
          <span class="font-bold text-2xl" style="color:#3b82f6;">Hub</span>
        </div>
        <p style="color:#64748b;font-size:0.875rem;">Engine Mechanics Learning Hub</p>
      </div>

      <!-- Card -->
      <div class="rounded-2xl p-8"
        style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(12px);">
        <h2 class="font-bold text-xl text-white mb-1">Masuk</h2>
        <p class="text-sm mb-6" style="color:#64748b;">Masuk untuk mengakses EMLearn Hub</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">Email</label>
            <input v-model="email" type="email" placeholder="nama@email.com"
              @keydown.enter="login"
              class="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 transition-all"
              style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);outline:none;"
              onfocus="this.style.borderColor='#2563eb';this.style.boxShadow='0 0 0 3px rgba(37,99,235,0.2)'"
              onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'" />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">Password</label>
            <div class="relative">
              <input v-model="password" :type="showPwd ? 'text' : 'password'" placeholder="••••••••"
                @keydown.enter="login"
                class="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-slate-500 transition-all"
                style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);outline:none;"
                onfocus="this.style.borderColor='#2563eb';this.style.boxShadow='0 0 0 3px rgba(37,99,235,0.2)'"
                onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'" />
              <button type="button" @click="showPwd=!showPwd"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                style="color:#64748b;">{{ showPwd ? '🙈' : '👁️' }}</button>
            </div>
          </div>

          <div v-if="error" class="p-3 rounded-xl text-sm"
            style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;">
            ⚠️ {{ error }}
          </div>

          <button @click="login" :disabled="loading"
            class="w-full py-3 rounded-xl font-semibold text-sm transition-all"
            style="background:#2563eb;color:#fff;"
            :style="loading ? 'opacity:0.7;cursor:not-allowed;' : 'hover:background:#1d4ed8;'">
            {{ loading ? 'Memuat...' : 'Masuk →' }}
          </button>
        </div>
      </div>

      <p class="text-center text-sm mt-5" style="color:#64748b;">
        Belum punya akun?
        <button @click="router.push('/register')"
          class="font-semibold transition-colors hover:text-blue-400"
          style="color:#3b82f6;">
          Daftar di sini
        </button>
      </p>
    </div>
  </div>
</template>
