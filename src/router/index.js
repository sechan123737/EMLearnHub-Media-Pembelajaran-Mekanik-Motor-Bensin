import { createRouter, createWebHistory } from 'vue-router'

// Public views
import LoginView        from '../views/public/LoginView.vue'
import RegisterView     from '../views/public/RegisterView.vue'
import HomeView         from '../views/public/HomeView.vue'
import MateriListView   from '../views/public/MateriListView.vue'
import VideoListView    from '../views/public/VideoListView.vue'
import JobsheetListView from '../views/public/JobsheetListView.vue'
import TentangView      from '../views/public/TentangView.vue'
import ModuleView       from '../views/public/ModuleView.vue'
import MaterialView     from '../views/public/MaterialView.vue'
import QuizView         from '../views/public/QuizView.vue'
import GlobalQuizView   from '../views/public/GlobalQuizView.vue'

// Admin views
import AdminDashboard       from '../views/admin/AdminDashboard.vue'
import AdminModules         from '../views/admin/AdminModules.vue'
import AdminMaterials       from '../views/admin/AdminMaterials.vue'
import AdminMaterialForm    from '../views/admin/AdminMaterialForm.vue'
import AdminVideoManager    from '../views/admin/AdminVideoManager.vue'
import AdminJobsheetManager from '../views/admin/AdminJobsheetManager.vue'
import AdminQuizManager     from '../views/admin/AdminQuizManager.vue'
import AdminPraktikumSteps  from '../views/admin/AdminPraktikumSteps.vue'
import AdminGlobalQuiz      from '../views/admin/AdminGlobalQuiz.vue'
import AdminQuizResults     from '../views/admin/AdminQuizResults.vue'
import AdminStudents        from '../views/admin/AdminStudents.vue'
import AdminProgress        from '../views/admin/AdminProgress.vue'
import AdminActivity        from '../views/admin/AdminActivity.vue'
import AdminSettings        from '../views/admin/AdminSettings.vue'

const routes = [
  // ── AUTH ───────────────────────────────────────────────
  { path: '/admin/login', redirect: '/login' }, // backward compat
  { path: '/login',    name: 'Login',    component: LoginView,    meta: { guestOnly: true } },
  { path: '/register', name: 'Register', component: RegisterView, meta: { guestOnly: true } },

  // ── PUBLIC (wajib login) ────────────────────────────────
  { path: '/',            name: 'Home',         component: HomeView,         meta: { requiresAuth: true } },
  { path: '/materi',      name: 'MateriList',    component: MateriListView,   meta: { requiresAuth: true } },
  { path: '/video',       name: 'VideoList',     component: VideoListView,    meta: { requiresAuth: true } },
  { path: '/jobsheet',    name: 'JobsheetList',  component: JobsheetListView, meta: { requiresAuth: true } },
  { path: '/tentang',     name: 'Tentang',       component: TentangView,      meta: { requiresAuth: true } },
  { path: '/kuis-global', name: 'GlobalQuiz',    component: GlobalQuizView,   meta: { requiresAuth: true } },

  { path: '/modul/:moduleId',  name: 'ModuleView',   component: ModuleView,   props: true, meta: { requiresAuth: true } },
  { path: '/materi/:id',       name: 'MaterialView',  component: MaterialView, props: true, meta: { requiresAuth: true } },
  { path: '/materi/:id/kuis',  name: 'QuizView',      component: QuizView,     props: true, meta: { requiresAuth: true } },

  // ── ADMIN (wajib login + role admin) ───────────────────
  { path: '/admin',                   name: 'AdminDashboard',      component: AdminDashboard,       meta: { requiresAdmin: true } },
  { path: '/admin/modul',             name: 'AdminModules',        component: AdminModules,         meta: { requiresAdmin: true } },
  { path: '/admin/materi',            name: 'AdminMaterials',      component: AdminMaterials,       meta: { requiresAdmin: true } },
  { path: '/admin/materi/tambah',     name: 'AdminMaterialAdd',    component: AdminMaterialForm,    meta: { requiresAdmin: true } },
  { path: '/admin/materi/edit/:id',   name: 'AdminMaterialEdit',   component: AdminMaterialForm,    meta: { requiresAdmin: true }, props: true },
  { path: '/admin/video',             name: 'AdminVideo',          component: AdminVideoManager,    meta: { requiresAdmin: true } },
  { path: '/admin/jobsheet',                    name: 'AdminJobsheet',       component: AdminJobsheetManager, meta: { requiresAdmin: true } },
  { path: '/admin/praktikum/:materialId',       name: 'AdminPraktikumSteps', component: AdminPraktikumSteps,  meta: { requiresAdmin: true }, props: true },
  { path: '/admin/kuis/:materialId',            name: 'AdminQuizManager',    component: AdminQuizManager,     meta: { requiresAdmin: true }, props: true },
  { path: '/admin/kuis-global',       name: 'AdminGlobalQuiz',     component: AdminGlobalQuiz,      meta: { requiresAdmin: true } },
  { path: '/admin/nilai',             name: 'AdminQuizResults',    component: AdminQuizResults,     meta: { requiresAdmin: true } },
  { path: '/admin/mahasiswa',         name: 'AdminStudents',       component: AdminStudents,        meta: { requiresAdmin: true } },
  { path: '/admin/progress',          name: 'AdminProgress',       component: AdminProgress,        meta: { requiresAdmin: true } },
  { path: '/admin/aktivitas',         name: 'AdminActivity',       component: AdminActivity,        meta: { requiresAdmin: true } },
  { path: '/admin/pengaturan',        name: 'AdminSettings',       component: AdminSettings,        meta: { requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0, behavior: 'smooth' } }
})

router.beforeEach(async (to, from, next) => {
  const { useAuthStore } = await import('../stores/authStore')
  const auth = useAuthStore()

  // Tunggu sampai auth.init() benar-benar selesai (termasuk fetchProfile)
  if (!auth.initialized) {
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (auth.initialized) { clearInterval(interval); resolve() }
      }, 30)
    })
  }

  const loggedIn = auth.isLoggedIn
  const isAdmin  = auth.isAdmin

  // Halaman login/register — redirect jika sudah login
  if (to.meta.guestOnly && loggedIn) {
    return next(isAdmin ? '/admin' : '/')
  }

  // Halaman public — wajib login
  if (to.meta.requiresAuth && !loggedIn) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  // Halaman admin — wajib login + role admin
  if (to.meta.requiresAdmin) {
    if (!loggedIn) return next({ name: 'Login', query: { redirect: to.fullPath } })
    if (!isAdmin)  return next({ name: 'Home' })
  }

  next()
})

export default router
