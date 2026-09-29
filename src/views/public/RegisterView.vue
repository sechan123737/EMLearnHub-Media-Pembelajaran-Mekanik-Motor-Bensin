<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const auth   = useAuthStore()
const router = useRouter()

const fullName  = ref('')
const nim       = ref('')
const email     = ref('')
const password  = ref('')
const confirm   = ref('')
const error     = ref('')
const loading   = ref(false)
const showPwd   = ref(false)
const showCfm   = ref(false)
const success   = ref(false)

async function register() {
  error.value = ''
  if (!fullName.value.trim())           { error.value = 'Nama lengkap wajib diisi!'; return }
  if (fullName.value.trim().length < 3) { error.value = 'Nama minimal 3 karakter!'; return }
  if (!nim.value.trim())                { error.value = 'NIM wajib diisi!'; return }
  if (!/^\d{6,20}$/.test(nim.value.trim())) { error.value = 'NIM harus berupa angka (6-20 digit)!'; return }
  if (!email.value.trim())              { error.value = 'Email wajib diisi!'; return }
  if (password.value.length < 6)        { error.value = 'Password minimal 6 karakter!'; return }
  if (password.value !== confirm.value) { error.value = 'Konfirmasi password tidak cocok!'; return }

  loading.value = true
  const res = await auth.register(fullName.value.trim(), nim.value.trim(), email.value.trim(), password.value)
  loading.value = false

  if (!res.ok) {
    if (res.message?.includes('already registered')) error.value = 'Email sudah terdaftar!'
    else error.value = res.message || 'Pendaftaran gagal, coba lagi.'
    return
  }

  // Jika Supabase memerlukan konfirmasi email
  if (!auth.isLoggedIn) {
    success.value = true
  } else {
    router.push('/')
  }
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

      <!-- Sukses (jika perlu konfirmasi email) -->
      <div v-if="success" class="rounded-2xl p-8 text-center"
        style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);">
        <div class="text-5xl mb-4">📧</div>
        <h2 class="font-bold text-xl text-white mb-2">Cek Email Kamu!</h2>
        <p class="text-sm mb-6" style="color:#94a3b8;">
          Kami mengirim link konfirmasi ke <span class="text-white font-semibold">{{ email }}</span>.
          Klik link tersebut untuk mengaktifkan akunmu.
        </p>
        <button @click="router.push('/login')"
          class="w-full py-3 rounded-xl font-semibold text-sm"
          style="background:#2563eb;color:#fff;">
          Kembali ke Login
        </button>
      </div>

      <!-- Form register -->
      <div v-else class="rounded-2xl p-8"
        style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(12px);">
        <h2 class="font-bold text-xl text-white mb-1">Daftar Akun</h2>
        <p class="text-sm mb-6" style="color:#64748b;">Buat akun untuk mulai belajar di EMLearn Hub</p>

        <div class="space-y-4">

          <!-- Nama Lengkap -->
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">Nama Lengkap</label>
            <input v-model="fullName" type="text" placeholder="Contoh: Devii"
              @keydown.enter="register"
              class="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 transition-all"
              style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);outline:none;"
              onfocus="this.style.borderColor='#2563eb';this.style.boxShadow='0 0 0 3px rgba(37,99,235,0.2)'"
              onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'" />
          </div>

          <!-- NIM -->
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">NIM</label>
            <input v-model="nim" type="text" placeholder="Contoh: 1234567890"
              @keydown.enter="register"
              class="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 transition-all"
              style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);outline:none;"
              onfocus="this.style.borderColor='#2563eb';this.style.boxShadow='0 0 0 3px rgba(37,99,235,0.2)'"
              onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'" />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">Email</label>
            <input v-model="email" type="email" placeholder="nama@email.com"
              @keydown.enter="register"
              class="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 transition-all"
              style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);outline:none;"
              onfocus="this.style.borderColor='#2563eb';this.style.boxShadow='0 0 0 3px rgba(37,99,235,0.2)'"
              onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'" />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">Password</label>
            <div class="relative">
              <input v-model="password" :type="showPwd ? 'text' : 'password'" placeholder="Min. 6 karakter"
                @keydown.enter="register"
                class="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-slate-500 transition-all"
                style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);outline:none;"
                onfocus="this.style.borderColor='#2563eb';this.style.boxShadow='0 0 0 3px rgba(37,99,235,0.2)'"
                onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'" />
              <button type="button" @click="showPwd=!showPwd"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                style="color:#64748b;">{{ showPwd ? '🙈' : '👁️' }}</button>
            </div>
          </div>

          <!-- Konfirmasi Password -->
          <div>
            <label class="block text-sm font-semibold mb-2" style="color:#94a3b8;">Konfirmasi Password</label>
            <div class="relative">
              <input v-model="confirm" :type="showCfm ? 'text' : 'password'" placeholder="Ulangi password"
                @keydown.enter="register"
                class="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-slate-500 transition-all"
                style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);outline:none;"
                onfocus="this.style.borderColor='#2563eb';this.style.boxShadow='0 0 0 3px rgba(37,99,235,0.2)'"
                onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'" />
              <button type="button" @click="showCfm=!showCfm"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                style="color:#64748b;">{{ showCfm ? '🙈' : '👁️' }}</button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="p-3 rounded-xl text-sm"
            style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;">
            ⚠️ {{ error }}
          </div>

          <!-- Submit -->
          <button @click="register" :disabled="loading"
            class="w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2"
            style="background:#2563eb;color:#fff;"
            :style="loading ? 'opacity:0.7;cursor:not-allowed;' : ''">
            {{ loading ? 'Mendaftarkan...' : 'Daftar Sekarang →' }}
          </button>
        </div>
      </div>

      <!-- Link ke login -->
      <p class="text-center text-sm mt-5" style="color:#64748b;">
        Sudah punya akun?
        <button @click="router.push('/login')"
          class="font-semibold transition-colors hover:text-blue-400"
          style="color:#3b82f6;">
          Masuk di sini
        </button>
      </p>

    </div>
  </div>
</template>
