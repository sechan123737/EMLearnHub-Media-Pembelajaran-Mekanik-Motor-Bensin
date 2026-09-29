import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useStore = defineStore('main', {
  state: () => ({
    materials: [],
    modules: [],
    quizQuestions: [],
    globalQuestions: [],
    quizResults: [],       // hasil kuis mahasiswa
    loading: false,
    error: null,
  }),

  getters: {
    getMaterialById: (state) => (id) => state.materials.find(m => String(m.id) === String(id)),
    getMaterialsByModule: (state) => (moduleName) => state.materials.filter(m => m.module_name === moduleName),
    getQuizByMaterialId: (state) => (materialId) => state.quizQuestions.filter(q => String(q.material_id) === String(materialId)),
  },

  actions: {
    // ─── MODULES ─────────────────────────────────────────────────────────────
    async fetchModules() {
      if (this.modules.length > 0) return // sudah ada, skip
      try {
        const { data, error } = await supabase.from('modules').select('*').order('order_num', { ascending: true })
        if (data) this.modules = data
        if (error) console.warn('fetchModules error:', error.message)
      } catch (e) { console.warn('fetchModules catch:', e) }
    },

    async addModule(payload) {
      this.loading = true
      try {
        const { data, error } = await supabase.from('modules').insert([{ name: payload.name, description: payload.description || '', order_num: payload.order_num || 0, image_url: payload.image_url || '' }]).select()
        if (error) throw error
        await this.fetchModules()
        return true
      } catch (e) { alert('Gagal tambah modul: ' + e.message); return false }
      finally { this.loading = false }
    },

    async updateModule(id, payload) {
      this.loading = true
      try {
        const { error } = await supabase.from('modules').update({ name: payload.name, description: payload.description || '', order_num: payload.order_num || 0, image_url: payload.image_url || '' }).eq('id', id)
        if (error) throw error
        await this.fetchModules()
        return true
      } catch (e) { alert('Gagal update modul: ' + e.message); return false }
      finally { this.loading = false }
    },

    async deleteModule(id) {
      try {
        const mats = this.materials.filter(m => m.module_id === id)
        for (const m of mats) await this.deleteMaterial(m.id)
        const { error } = await supabase.from('modules').delete().eq('id', id)
        if (error) throw error
        this.modules = this.modules.filter(m => m.id !== id)
      } catch (e) { alert('Gagal hapus modul: ' + e.message) }
    },

    // ─── MATERIALS ───────────────────────────────────────────────────────────
    async fetchMaterials() {
      if (this.materials.length > 0) return // sudah ada, skip
      this.loading = true
      try {
        const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: true })
        if (data) this.materials = data
        if (error) console.warn('fetchMaterials error:', error.message)
      } catch (e) { console.warn('fetchMaterials catch:', e) }
      finally { this.loading = false }
    },

    async addMaterial(payload) {
      this.loading = true
      try {
        const { data, error } = await supabase.from('materials').insert([{ title: payload.title, content: payload.content || '', video_url: payload.video_url || '', ppt_url: payload.ppt_url || '', module_id: payload.module_id || null, module_name: payload.module_name || '', order_num: payload.order_num || 0 }]).select()
        if (error) throw error
        await this.fetchMaterials()
        return data ? data[0] : null
      } catch (e) { alert('Gagal simpan materi: ' + e.message); return null }
      finally { this.loading = false }
    },

    async updateMaterial(id, payload) {
      this.loading = true
      try {
        const { error } = await supabase.from('materials').update({ title: payload.title, content: payload.content || '', video_url: payload.video_url || '', ppt_url: payload.ppt_url || '', module_id: payload.module_id || null, module_name: payload.module_name || '', order_num: payload.order_num || 0, updated_at: new Date().toISOString() }).eq('id', id)
        if (error) throw error
        await this.fetchMaterials()
        return true
      } catch (e) { alert('Gagal update materi: ' + e.message); return false }
      finally { this.loading = false }
    },

    async deleteMaterial(id) {
      try {
        await supabase.from('quiz_questions').delete().eq('material_id', id)
        await supabase.from('jobsheets').delete().eq('material_id', id)
        const { error } = await supabase.from('materials').delete().eq('id', id)
        if (error) throw error
        this.materials = this.materials.filter(m => m.id !== id)
      } catch (e) { alert('Gagal hapus materi: ' + e.message) }
    },

    // ─── JOBSHEET ─────────────────────────────────────────────────────────────
    async uploadJobsheet(materialId, file) {
      try {
        const fileName = `jobsheet_${materialId}_${Date.now()}.pdf`
        const { error } = await supabase.storage.from('jobsheets').upload(fileName, file, { upsert: true })
        if (error) throw error
        const { data: urlData } = supabase.storage.from('jobsheets').getPublicUrl(fileName)
        await supabase.from('jobsheets').upsert({ material_id: materialId, file_url: urlData.publicUrl, file_name: file.name })
        await supabase.from('materials').update({ jobsheet_url: urlData.publicUrl }).eq('id', materialId)
        await this.fetchMaterials()
        return urlData.publicUrl
      } catch (e) { alert('Gagal upload jobsheet: ' + e.message); return null }
    },

    async deleteJobsheet(materialId) {
      try {
        await supabase.from('jobsheets').delete().eq('material_id', materialId)
        await supabase.from('materials').update({ jobsheet_url: null }).eq('id', materialId)
        await this.fetchMaterials()
        return true
      } catch (e) { alert('Gagal hapus jobsheet: ' + e.message); return false }
    },

    // ─── QUIZ PER MATERI ─────────────────────────────────────────────────────
    async fetchQuizByMaterial(materialId) {
      try {
        const { data, error } = await supabase.from('quiz_questions').select('*').eq('material_id', materialId).order('created_at', { ascending: true })
        if (data) {
          const others = this.quizQuestions.filter(q => String(q.material_id) !== String(materialId))
          this.quizQuestions = [...others, ...data]
        }
        if (error) console.warn('fetchQuiz error:', error.message)
      } catch (e) { console.warn('fetchQuiz catch:', e) }
    },

    async saveQuizForMaterial(materialId, questions) {
      this.loading = true
      try {
        await supabase.from('quiz_questions').delete().eq('material_id', materialId)
        const valid = questions.filter(q => q.question_text && q.question_text.trim())
        if (valid.length > 0) {
          const { error } = await supabase.from('quiz_questions').insert(valid.map(q => ({ material_id: materialId, question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option, explanation: q.explanation || '' })))
          if (error) throw error
        }
        await this.fetchQuizByMaterial(materialId)
        return true
      } catch (e) { alert('Gagal simpan kuis: ' + e.message); return false }
      finally { this.loading = false }
    },

    // ─── GLOBAL QUIZ ─────────────────────────────────────────────────────────
    async fetchGlobalQuiz() {
      if (this.globalQuestions.length > 0) return // sudah ada, skip
      try {
        const { data, error } = await supabase.from('global_quiz').select('*').order('created_at', { ascending: true })
        if (data) this.globalQuestions = data
        if (error) console.warn('fetchGlobalQuiz error:', error.message)
      } catch (e) { console.warn('fetchGlobalQuiz catch:', e) }
    },

    async saveGlobalQuiz(questions) {
      this.loading = true
      try {
        await supabase.from('global_quiz').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        const valid = questions.filter(q => q.question_text && q.question_text.trim())
        if (valid.length > 0) {
          const { error } = await supabase.from('global_quiz').insert(valid.map(q => ({ question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option, explanation: q.explanation || '' })))
          if (error) throw error
        }
        await this.fetchGlobalQuiz()
        return true
      } catch (e) { alert('Gagal simpan kuis global: ' + e.message); return false }
      finally { this.loading = false }
    },

    // ─── QUIZ RESULTS (NILAI MAHASISWA) ──────────────────────────────────────
    async saveQuizResult(payload) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('quiz_results').insert([{
          student_name:  payload.student_name,
          quiz_type:     payload.quiz_type,
          material_id:   payload.material_id || null,
          material_name: payload.material_name || null,
          score:         payload.score,
          total:         payload.total,
          percentage:    payload.percentage,
          user_id:       user?.id || null,   // ← tambahan ini
        }])
        if (error) throw error
        return true
      } catch (e) { console.warn('Gagal simpan hasil kuis:', e.message); return false }
    },

    async fetchQuizResults() {
      this.loading = true
      try {
        // Fetch quiz_results dulu tanpa join
        const { data: results, error } = await supabase
          .from('quiz_results')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) console.warn('fetchQuizResults error:', error.message)
        if (!results) return

        // Fetch profiles terpisah untuk ambil NIM
        const userIds = [...new Set(results.map(r => r.user_id).filter(Boolean))]
        let nimMap = {}
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nim')
            .in('id', userIds)
          if (profiles) profiles.forEach(p => { nimMap[p.id] = p.nim || '' })
        }

        this.quizResults = results.map(r => ({ ...r, nim: nimMap[r.user_id] || '' }))
      } catch (e) { console.warn('fetchQuizResults catch:', e) }
      finally { this.loading = false }
    },

    async deleteQuizResult(id) {
      try {
        const { error } = await supabase.from('quiz_results').delete().eq('id', id)
        if (error) throw error
        this.quizResults = this.quizResults.filter(r => r.id !== id)
      } catch (e) { alert('Gagal hapus data: ' + e.message) }
    },

    async clearAllQuizResults() {
      try {
        const { error } = await supabase.from('quiz_results').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) throw error
        this.quizResults = []
      } catch (e) { alert('Gagal hapus semua data: ' + e.message) }
    },

    // ─── PRAKTIKUM STEPS ─────────────────────────────────────────────────────
    async fetchPraktikumSteps(materialId) {
      try {
        const { data, error } = await supabase
          .from('praktikum_steps')
          .select('*')
          .eq('material_id', materialId)
          .order('order_num', { ascending: true })
        if (error) throw error
        return data || []
      } catch (e) { console.warn('fetchPraktikumSteps error:', e.message); return [] }
    },

    async savePraktikumSteps(materialId, steps) {
      try {
        await supabase.from('praktikum_steps').delete().eq('material_id', materialId)
        const valid = steps.filter(s => s.step_text && s.step_text.trim())
        if (valid.length > 0) {
          const { error } = await supabase.from('praktikum_steps').insert(
            valid.map((s, i) => ({ material_id: materialId, step_text: s.step_text.trim(), order_num: i }))
          )
          if (error) throw error
        }
        return true
      } catch (e) { alert('Gagal simpan langkah: ' + e.message); return false }
    },
  }
})
