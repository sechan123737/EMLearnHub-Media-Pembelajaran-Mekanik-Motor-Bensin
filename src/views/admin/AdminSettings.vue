<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminSidebar from '../../components/AdminSidebar.vue'
import { useAuthStore } from '../../stores/authStore'

const auth       = useAuthStore()
const router     = useRouter()
const drawerOpen = ref(false)
const activeTab  = ref('password')
const toast      = ref('')
const saving     = ref(false)

const pwd = ref({ lama:'', baru:'', konfirmasi:'' })
const pwdError = ref('')

const sistem = ref({
  namaAplikasi:    'EMLearn Hub',
  tagline:         'Engine Mechanics Learning Hub',
  bahasa:          'id',
  batasUpload:     10,
  notifEmail:      true,
  autoSave:        true,
  maintenanceMode: false,
})

const tabs = [
  { key:'password', icon:'/icons/password.png',   label:'Ubah Password' },
  { key:'sistem',   icon:'/icons/setting.png',  label:'Pengaturan Sistem' },
]

function showToast(msg) { toast.value = msg; setTimeout(() => toast.value = '', 2500) }

async function savePassword() {
  pwdError.value = ''
  if (!pwd.value.lama) { pwdError.value = 'Password lama wajib diisi!'; return }
  if (pwd.value.baru.length < 6) { pwdError.value = 'Password baru minimal 6 karakter!'; return }
  if (pwd.value.baru !== pwd.value.konfirmasi) { pwdError.value = 'Konfirmasi password tidak cocok!'; return }
  saving.value = true
  await new Promise(r => setTimeout(r, 800))
  saving.value = false
  pwd.value = { lama: '', baru: '', konfirmasi: '' }
  showToast('Password berhasil diubah!')
}

async function saveSistem() {
  saving.value = true
  await new Promise(r => setTimeout(r, 800))
  saving.value = false
  showToast('Pengaturan sistem berhasil disimpan!')
}

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex" style="background:#f8fafc;">
    <AdminSidebar :open="drawerOpen" @close="drawerOpen=false" />

    <div class="settings-content flex-1 min-w-0" style="margin-left:256px;">
      <header class="sticky top-0 z-30 px-6 h-16 flex items-center gap-3"
        style="background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
        <button @click="drawerOpen=true" class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center" style="background:#0d1526;">☰</button>
        <h1 class="font-bold text-xl" style="color:#0f172a;">Pengaturan</h1>
      </header>

      <Transition name="toast">
        <div v-if="toast" class="fixed top-20 right-6 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg"
          style="background:#0f172a;color:#fff;">{{ toast }}</div>
      </Transition>

      <div class="settings-inner p-6 lg:p-8 max-w-3xl">

        <!-- Tab switcher -->
        <div class="settings-tabs flex gap-1 mb-8 p-1 rounded-xl" style="background:#f1f5f9;display:inline-flex;">
          <button v-for="t in tabs" :key="t.key" @click="activeTab=t.key"
            class="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
            :style="activeTab===t.key ? 'background:#fff;color:#2563eb;box-shadow:0 1px 4px rgba(0,0,0,0.08);' : 'color:#64748b;'">
            <img :src="t.icon" class="w-4 h-4 object-contain" alt="" />
            <span class="settings-tab-label">{{ t.label }}</span>
          </button>
        </div>

        <!-- PASSWORD -->
        <div v-if="activeTab === 'password'" class="rounded-2xl p-6"
          style="background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
          <h2 class="font-bold text-lg mb-2" style="color:#0f172a;">Ubah Password</h2>
          <p class="text-sm mb-6" style="color:#64748b;">Password minimal 6 karakter. Gunakan kombinasi huruf dan angka.</p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-2" style="color:#374151;">Password Lama</label>
              <input v-model="pwd.lama" type="password" placeholder="••••••••" class="w-full px-4 py-3 rounded-xl text-sm"
                style="border:1px solid #e2e8f0;color:#0f172a;outline:none;" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-2" style="color:#374151;">Password Baru</label>
              <input v-model="pwd.baru" type="password" placeholder="••••••••" class="w-full px-4 py-3 rounded-xl text-sm"
                style="border:1px solid #e2e8f0;color:#0f172a;outline:none;" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-2" style="color:#374151;">Konfirmasi Password Baru</label>
              <input v-model="pwd.konfirmasi" type="password" placeholder="••••••••" class="w-full px-4 py-3 rounded-xl text-sm"
                style="border:1px solid #e2e8f0;color:#0f172a;outline:none;" />
            </div>
            <div v-if="pwdError" class="p-3 rounded-xl text-sm"
              style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;">
              ⚠️ {{ pwdError }}
            </div>
          </div>
          <button @click="savePassword" :disabled="saving"
            class="mt-6 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 flex items-center gap-2"
            style="background:#2563eb;color:#fff;">
            <img src="/icons/password.png" class="w-4 h-4 object-contain" alt="" />
            {{ saving ? 'Menyimpan...' : 'Ubah Password' }}
          </button>
        </div>

        <!-- SISTEM -->
        <div v-if="activeTab === 'sistem'" class="space-y-5">
          <div class="rounded-2xl p-6" style="background:#fff;border:1px solid #e2e8f0;">
            <h2 class="font-bold text-lg mb-6" style="color:#0f172a;">Informasi Aplikasi</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#374151;">Nama Aplikasi</label>
                <input v-model="sistem.namaAplikasi" type="text" class="w-full px-4 py-3 rounded-xl text-sm"
                  style="border:1px solid #e2e8f0;color:#0f172a;outline:none;" />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#374151;">Tagline</label>
                <input v-model="sistem.tagline" type="text" class="w-full px-4 py-3 rounded-xl text-sm"
                  style="border:1px solid #e2e8f0;color:#0f172a;outline:none;" />
              </div>
              <div class="settings-grid-2 grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#374151;">Bahasa</label>
                  <select v-model="sistem.bahasa" class="w-full px-4 py-3 rounded-xl text-sm"
                    style="border:1px solid #e2e8f0;color:#0f172a;outline:none;background:#fff;">
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#374151;">Batas Upload (MB)</label>
                  <input v-model.number="sistem.batasUpload" type="number" min="1" max="50"
                    class="w-full px-4 py-3 rounded-xl text-sm"
                    style="border:1px solid #e2e8f0;color:#0f172a;outline:none;" />
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl p-6" style="background:#fff;border:1px solid #e2e8f0;">
            <h2 class="font-bold text-lg mb-5" style="color:#0f172a;">Preferensi Sistem</h2>
            <div class="space-y-4">
              <label v-for="opt in [
                { key:'notifEmail', label:'Notifikasi Email', desc:'Kirim email saat ada mahasiswa baru atau nilai masuk' },
                { key:'autoSave',   label:'Auto-save Draft',  desc:'Simpan draft materi secara otomatis' },
              ]" :key="opt.key"
                class="flex items-start justify-between gap-4 p-4 rounded-xl cursor-pointer"
                style="border:1px solid #f1f5f9;background:#f8fafc;">
                <div>
                  <p class="font-semibold text-sm" style="color:#0f172a;">{{ opt.label }}</p>
                  <p class="text-xs mt-0.5" style="color:#94a3b8;">{{ opt.desc }}</p>
                </div>
                <div @click="sistem[opt.key] = !sistem[opt.key]"
                  class="w-11 h-6 rounded-full cursor-pointer transition-colors flex-shrink-0"
                  :style="sistem[opt.key] ? 'background:#2563eb;' : 'background:#e2e8f0;'">
                  <div class="w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5"
                    :style="`transform:translateX(${sistem[opt.key] ? '22' : '2'}px);`"></div>
                </div>
              </label>
            </div>
          </div>

          <div class="rounded-2xl p-6" style="background:#fff;border:1px solid #fecaca;">
            <h2 class="font-bold text-lg mb-2" style="color:#dc2626;">⚠️ Zona Berbahaya</h2>
            <p class="text-sm mb-5" style="color:#64748b;">Pengaturan berikut dapat mempengaruhi seluruh pengguna aplikasi.</p>
            <div class="flex items-center justify-between gap-4 p-4 rounded-xl"
              style="border:1px solid #fecaca;background:#fef2f2;">
              <div>
                <p class="font-semibold text-sm" style="color:#dc2626;">Mode Maintenance</p>
                <p class="text-xs mt-0.5" style="color:#94a3b8;">Halaman publik tidak bisa diakses sementara</p>
              </div>
              <div @click="sistem.maintenanceMode = !sistem.maintenanceMode"
                class="w-11 h-6 rounded-full cursor-pointer transition-colors flex-shrink-0"
                :style="sistem.maintenanceMode ? 'background:#dc2626;' : 'background:#e2e8f0;'">
                <div class="w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5"
                  :style="`transform:translateX(${sistem.maintenanceMode ? '22' : '2'}px);`"></div>
              </div>
            </div>
          </div>

          <button @click="saveSistem" :disabled="saving"
            class="px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 flex items-center gap-2"
            style="background:#2563eb;color:#fff;">
            <img src="/icons/setting.png" class="w-4 h-4 object-contain" alt="" />
            {{ saving ? 'Menyimpan...' : 'Simpan Pengaturan Sistem' }}
          </button>
        </div>

        <!-- Logout -->
        <div class="mt-6 rounded-2xl p-5 flex items-center justify-between"
          style="background:#fff;border:1px solid #e2e8f0;">
          <div>
            <p class="font-semibold text-sm" style="color:#0f172a;">Keluar dari Akun</p>
            <p class="text-xs" style="color:#94a3b8;">Anda akan diarahkan ke halaman login</p>
          </div>
          <button @click="logout" class="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
            style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;">
            <img src="/icons/keluar.png" class="w-4 h-4 object-contain" alt="" />
            Keluar
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-10px); }

@media (max-width: 1023px) {

  /* Hilangkan margin sidebar */
  .settings-content {
    margin-left: 0 !important;
    width: 100% !important;
    overflow-x: hidden;
  }

  /* Header padding lebih kecil */
  header.sticky {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  /* Content padding */
  .settings-inner {
    padding: 12px !important;
    max-width: 100% !important;
  }

  /* Tab: full width, rata kiri-kanan */
  .settings-tabs {
    display: flex !important;
    width: 100%;
  }
  .settings-tabs button {
    flex: 1;
    justify-content: center;
  }

  /* Grid 2 kolom (Bahasa + Batas Upload) jadi 1 kolom di hp kecil */
  .settings-grid-2 {
    grid-template-columns: 1fr !important;
  }

  /* Prevent overflow */
  * { box-sizing: border-box; max-width: 100%; }
}

@media (max-width: 480px) {
  /* Label tab disembunyikan, hanya ikon */
  .settings-tab-label { display: none; }

  /* Tabs lebih compact */
  .settings-tabs button {
    padding: 8px 12px;
  }
}
</style>