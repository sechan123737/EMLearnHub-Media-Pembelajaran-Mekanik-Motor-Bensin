# 🔧 EMLearnHub — Media Pembelajaran Mekanik Motor Bensin

Platform media pembelajaran interaktif berbasis Vue.js + Supabase untuk mata kuliah **Mekanik Motor Bensin**.

---

## 📦 Fitur

### Halaman Mahasiswa
| Fitur | Deskripsi |
|---|---|
| 📖 Materi Teks | Konten teks dengan format rich text (bold, italic, heading, tabel, list) |
| 📊 Embed PPT | Google Slides, Canva, OneDrive langsung di browser |
| 🎬 Video YouTube | Embed otomatis dari URL YouTube |
| 📋 Jobsheet PDF | Preview & download PDF langsung di browser |
| ✅ Kuis Per Materi | Pilihan ganda + feedback + pembahasan jawaban |
| 🏆 Kuis Global | Gabungan semua materi, soal diacak |
| 📈 Progress Materi | Tandai materi selesai, pantau progres per modul |
| 🔬 Langkah Praktikum | Panduan step-by-step per materi praktikum |
| 📱 Responsive | Tampilan optimal di HP & laptop |

### Panel Admin
| Fitur | Route |
|---|---|
| Dashboard statistik | `/admin` |
| Kelola Modul | `/admin/modul` |
| Kelola Materi | `/admin/materi` |
| Kelola Video | `/admin/video` |
| Kelola Jobsheet | `/admin/jobsheet` |
| Kelola Langkah Praktikum | `/admin/praktikum/:materialId` |
| Kelola Soal Kuis per Materi | `/admin/kuis/:materialId` |
| Kelola Kuis Global | `/admin/kuis-global` |
| Nilai Mahasiswa | `/admin/nilai` |
| Data Mahasiswa | `/admin/mahasiswa` |
| Progress Mahasiswa | `/admin/progress` |
| Log Aktivitas | `/admin/aktivitas` |
| Pengaturan | `/admin/pengaturan` |

---

## 🚀 Cara Setup

### 1. Clone & Install

```bash
cd EMLearnHub
npm install
```

### 2. Setup Supabase

1. Buat project di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** → jalankan file SQL berikut
   - `supabase_schema.sql` — skema utama (wajib pertama)
3. Buka **Storage** → buat dua bucket:
   - `jobsheets` → set **Public**
   - `module-images` → set **Public** 
4. Copy **Project URL** dan **anon public key** dari Settings → API

### 3. Konfigurasi Environment

```bash
cp .env.example .env
```

Edit file `.env`:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx
```

### 4. Jalankan Development

```bash
npm run dev
```

Buka `http://localhost:5173`

### 5. Build Production

```bash
npm run build
```

---

## 🗂️ Struktur Project

```
EMLearnHub/
├── src/
│   ├── views/
│   │   ├── public/                   # Halaman mahasiswa (wajib login)
│   │   │   ├── LoginView.vue         # Login (mahasiswa & admin)
│   │   │   ├── RegisterView.vue      # Registrasi mahasiswa
│   │   │   ├── HomeView.vue          # Beranda + daftar modul
│   │   │   ├── MateriListView.vue    # Daftar semua materi
│   │   │   ├── VideoListView.vue     # Daftar semua video
│   │   │   ├── JobsheetListView.vue  # Daftar semua jobsheet
│   │   │   ├── ModuleView.vue        # Daftar materi dalam 1 modul
│   │   │   ├── MaterialView.vue      # Detail materi (teks/PPT/video/jobsheet)
│   │   │   ├── QuizView.vue          # Kuis per materi
│   │   │   ├── GlobalQuizView.vue    # Kuis global gabungan
│   │   │   └── TentangView.vue       # Halaman tentang aplikasi
│   │   └── admin/                    # Panel admin (wajib role admin)
│   │       ├── AdminDashboard.vue
│   │       ├── AdminModules.vue
│   │       ├── AdminMaterials.vue
│   │       ├── AdminMaterialForm.vue
│   │       ├── AdminVideoManager.vue
│   │       ├── AdminJobsheetManager.vue
│   │       ├── AdminPraktikumSteps.vue
│   │       ├── AdminQuizManager.vue
│   │       ├── AdminGlobalQuiz.vue
│   │       ├── AdminQuizResults.vue
│   │       ├── AdminStudents.vue
│   │       ├── AdminProgress.vue
│   │       ├── AdminActivity.vue
│   │       └── AdminSettings.vue
│   ├── components/
│   │   ├── AdminSidebar.vue          # Sidebar navigasi admin
│   │   └── PublicNavbar.vue          # Navbar halaman mahasiswa
│   ├── stores/
│   │   ├── authStore.js              # Pinia store — autentikasi & profil user
│   │   └── mainStore.js              # Pinia store — CRUD data utama
│   ├── router/
│   │   └── index.js                  # Vue Router + auth guard
│   ├── lib/
│   │   └── supabase.js               # Supabase client
│   ├── App.vue
│   ├── main.js
│   └── style.css                     # Tailwind CSS global
├── public/
│   ├── icons/                        # Ikon sidebar & navigasi
│   └── logo.png
├── supabase_schema.sql               # Skema utama database
├── .env.example
└── vite.config.js
```

---

## 🗄️ Skema Database

| Tabel | Fungsi |
|---|---|
| `profiles` | Profil pengguna (nama, NIM, role: `user` / `admin`) |
| `modules` | Daftar modul/bab beserta gambar cover |
| `materials` | Materi pembelajaran (teks, PPT, video, jobsheet) |
| `jobsheets` | Metadata file PDF jobsheet |
| `praktikum_steps` | Langkah-langkah praktikum per materi |
| `quiz_questions` | Soal kuis per materi |
| `global_quiz` | Soal kuis global gabungan |
| `quiz_results` | Hasil kuis mahasiswa |
| `material_progress` | Progress penyelesaian materi per mahasiswa |

---

## 📊 Cara Embed PPT

### Google Slides
1. **File → Bagikan → Publikasikan ke web → tab Embed**
2. Klik **Publikasikan** → salin URL dari dalam atribut `src="..."`
3. Paste URL tersebut di form admin

### Canva
1. Klik **Share → Embed**
2. Salin link dari kolom embed

### PowerPoint (OneDrive)
1. Upload ke OneDrive → **Share → Embed**
2. Salin URL dari atribut `src` pada iframe

---

## 🎬 Cara Embed Video

Paste URL YouTube langsung, contoh:
- `https://www.youtube.com/watch?v=xxxxxxxx`
- `https://youtu.be/xxxxxxxx`

Sistem otomatis mengkonversi ke format embed.

---

## 📋 Upload Jobsheet

- Format: **PDF** saja
- Ukuran maksimal: **10 MB**
- File disimpan di Supabase Storage bucket `jobsheets`
- Mahasiswa bisa preview langsung di browser dan download

---

## 👤 Role Pengguna

| Role | Akses |
|---|---|
| `user` (mahasiswa) | Baca materi, kerjakan kuis, tandai progress |
| `admin` | Semua akses mahasiswa + seluruh panel admin |

Role diatur di tabel `profiles`. Untuk membuat akun admin pertama, daftarkan akun lewat halaman `/register` lalu ubah kolom `role` menjadi `'admin'` langsung di Supabase Table Editor.

---

## 🚢 Deploy ke Vercel

```bash
npm run build
```

1. Push project ke GitHub
2. Import repository di [vercel.com](https://vercel.com)
3. Set environment variables di Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Tambahkan file `vercel.json` di root untuk SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 🛠️ Tech Stack

| Kategori | Library |
|---|---|
| Frontend | Vue 3 (Composition API) + Vite |
| State Management | Pinia |
| Routing | Vue Router 4 |
| Database | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage |
| Styling | Tailwind CSS v3 |
| Font | Sora + Plus Jakarta Sans |
