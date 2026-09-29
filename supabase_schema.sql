-- ============================================================
-- EMLearnHUB — UNIFIED DATABASE SCHEMA
-- Jalankan SATU FILE INI saja di Supabase SQL Editor
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- BAGIAN 1: TABEL UTAMA
-- ════════════════════════════════════════════════════════════

-- ── 1.1 PROFILES (Profil Pengguna) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name  TEXT NOT NULL,
  nim        TEXT DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Allow update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Allow insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Trigger: buat profil otomatis saat user baru register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, nim, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'nim', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ── 1.2 MODULES (Bab / Modul) ────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon        TEXT DEFAULT '⚙️',
  image_url   TEXT DEFAULT '',
  order_num   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read modules"  ON modules FOR SELECT USING (true);
CREATE POLICY "Allow public write modules" ON modules FOR ALL    USING (true);

CREATE INDEX IF NOT EXISTS idx_modules_order ON modules(order_num);


-- ── 1.3 MATERIALS (Materi Pembelajaran) ──────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id    UUID REFERENCES modules(id) ON DELETE SET NULL,
  module_name  TEXT DEFAULT '',
  title        TEXT NOT NULL,
  content      TEXT DEFAULT '',       -- HTML rich text
  ppt_url      TEXT DEFAULT '',       -- Google Slides / Canva embed URL
  video_url    TEXT DEFAULT '',       -- YouTube URL
  jobsheet_url TEXT DEFAULT '',       -- Supabase Storage public URL
  order_num    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read materials"  ON materials FOR SELECT USING (true);
CREATE POLICY "Allow public write materials" ON materials FOR ALL    USING (true);

CREATE INDEX IF NOT EXISTS idx_materials_module_id ON materials(module_id);
CREATE INDEX IF NOT EXISTS idx_materials_order     ON materials(order_num);


-- ── 1.4 JOBSHEETS (File PDF) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS jobsheets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  file_url    TEXT NOT NULL,
  file_name   TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE jobsheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read jobsheets"  ON jobsheets FOR SELECT USING (true);
CREATE POLICY "Allow public write jobsheets" ON jobsheets FOR ALL    USING (true);


-- ── 1.5 PRAKTIKUM STEPS (Langkah Praktikum) ──────────────────
CREATE TABLE IF NOT EXISTS praktikum_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  step_text   TEXT NOT NULL,
  order_num   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE praktikum_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_praktikum_steps"
  ON praktikum_steps FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_praktikum_steps_material ON praktikum_steps(material_id);


-- ── 1.6 QUIZ QUESTIONS (Soal Kuis per Materi) ────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id    UUID REFERENCES materials(id) ON DELETE CASCADE,
  question_text  TEXT NOT NULL,
  option_a       TEXT DEFAULT '',
  option_b       TEXT DEFAULT '',
  option_c       TEXT DEFAULT '',
  option_d       TEXT DEFAULT '',
  correct_option TEXT DEFAULT 'a',   -- 'a', 'b', 'c', atau 'd'
  explanation    TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_quiz_questions"
  ON quiz_questions FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_quiz_material_id ON quiz_questions(material_id);


-- ── 1.7 GLOBAL QUIZ (Soal Kuis Global) ───────────────────────
CREATE TABLE IF NOT EXISTS global_quiz (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text  TEXT NOT NULL,
  option_a       TEXT DEFAULT '',
  option_b       TEXT DEFAULT '',
  option_c       TEXT DEFAULT '',
  option_d       TEXT DEFAULT '',
  correct_option TEXT DEFAULT 'a',
  explanation    TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE global_quiz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read global_quiz"  ON global_quiz FOR SELECT USING (true);
CREATE POLICY "Allow public write global_quiz" ON global_quiz FOR ALL    USING (true);


-- ── 1.8 QUIZ RESULTS (Hasil Kuis Mahasiswa) ──────────────────
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name  TEXT NOT NULL,
  quiz_type     TEXT NOT NULL DEFAULT 'material',  -- 'material' | 'global'
  material_id   UUID REFERENCES materials(id) ON DELETE SET NULL,
  material_name TEXT DEFAULT '',
  score         INTEGER NOT NULL DEFAULT 0,
  total         INTEGER NOT NULL DEFAULT 0,
  percentage    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read all results"
  ON public.quiz_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own results"
  ON public.quiz_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_created ON public.quiz_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_results_name    ON public.quiz_results(student_name);


-- ── 1.9 MATERIAL PROGRESS (Progress Baca Materi) ─────────────
CREATE TABLE IF NOT EXISTS public.material_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id  UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, material_id)
);

ALTER TABLE public.material_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON public.material_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.material_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.material_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_progress_user_id     ON public.material_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_material_id ON public.material_progress(material_id);


-- ════════════════════════════════════════════════════════════
-- BAGIAN 2: STORAGE BUCKETS
-- ════════════════════════════════════════════════════════════

-- ── 2.1 Bucket: jobsheets ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('jobsheets', 'jobsheets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read jobsheets storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'jobsheets');

CREATE POLICY "Public upload jobsheets storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'jobsheets');

CREATE POLICY "Public update jobsheets storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'jobsheets');

CREATE POLICY "Public delete jobsheets storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'jobsheets');


-- ── 2.2 Bucket: module-images ────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('module-images', 'module-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read module images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'module-images');

CREATE POLICY "Auth upload module images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'module-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update module images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'module-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete module images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'module-images' AND auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════
-- BAGIAN 3: DATA CONTOH (OPSIONAL)
-- Hapus komentar untuk mengisi data awal
-- ════════════════════════════════════════════════════════════

/*
INSERT INTO modules (name, description, icon, order_num) VALUES
  ('Pengenalan Motor Bensin', 'Konsep dasar mesin bensin, komponen utama, dan cara kerja', '🔧', 1),
  ('Sistem Bahan Bakar',      'Karburator, injeksi bensin, dan sistem penyaluran bahan bakar', '⛽', 2),
  ('Sistem Pengapian',        'Busi, koil, distributor, dan sistem pengapian elektronik', '💡', 3),
  ('Sistem Pendingin',        'Radiator, coolant, termostat, dan pompa air', '🌡️', 4),
  ('Sistem Pelumasan',        'Oli mesin, pompa oli, dan filter oli', '🛢️', 5);
*/


-- ════════════════════════════════════════════════════════════
-- CARA UBAH ROLE JADI ADMIN (jalankan terpisah setelah register):
--
--   UPDATE public.profiles
--   SET role = 'admin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'email@kamu.com');
--
-- ════════════════════════════════════════════════════════════