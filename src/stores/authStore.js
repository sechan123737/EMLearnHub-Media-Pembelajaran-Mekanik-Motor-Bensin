import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user:        null,
    profile:     null,
    loading:     false,
    initialized: false,
  }),

  getters: {
    isLoggedIn:  (state) => !!state.user,
    isAdmin:     (state) => state.profile?.role === 'admin',
    displayName: (state) => state.profile?.full_name || state.user?.email || '',
    displayNim:  (state) => state.profile?.nim || '',
  },

  actions: {
    async init() {
      this.loading = true
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[Auth] session:', session?.user?.email ?? 'none')

        if (session?.user) {
          this.user = session.user
          await this.fetchProfile()
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
          console.log('[Auth] state change:', _event, session?.user?.email ?? 'none')
          this.user = session?.user || null
          if (this.user) await this.fetchProfile()
          else this.profile = null
        })
      } finally {
        this.loading     = false
        this.initialized = true
        console.log('[Auth] initialized | user:', this.user?.email, '| profile:', this.profile, '| isAdmin:', this.isAdmin)
      }
    },

    async fetchProfile() {
      if (!this.user) return
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, nim, role')
        .eq('id', this.user.id)
        .single()
      console.log('[Auth] fetchProfile result:', data, 'error:', error?.message)
      this.profile = data
    },

    async login(email, password) {
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        this.user = data.user
        await this.fetchProfile()
        return { ok: true }
      } catch (e) {
        return { ok: false, message: e.message }
      } finally {
        this.loading = false
      }
    },

    async register(fullName, nim, email, password) {
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, nim: nim } }
        })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles')
            .upsert({ id: data.user.id, full_name: fullName, nim: nim, role: 'user' })
          this.user = data.user
          await this.fetchProfile()
        }
        return { ok: true }
      } catch (e) {
        return { ok: false, message: e.message }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      await supabase.auth.signOut()
      this.user    = null
      this.profile = null
    },
  },
})
