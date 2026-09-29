import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import './style.css'

const app   = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Init auth DULU, tunggu selesai (termasuk fetchProfile), baru mount
import { useAuthStore } from './stores/authStore'
const auth = useAuthStore()
auth.init().then(() => app.mount('#app'))
