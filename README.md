# 🧠 Sellerpintar - Fullstack Project (sp_fs_Pangdam_Setiawan)

Ini adalah hasil pengerjaan **Tes Fullstack Developer - Sellerpintar** oleh **Pangdam Setiawan**.

## 🚀 Fitur Utama

✅ Login dan Register menggunakan token JWT  
✅ CRUD Proyek  
✅ CRUD Task (To Do / In Progress / Done)  
✅ Drag & Drop Task (Kanban-style)  
✅ Menambahkan Anggota ke Proyek (dengan validasi & autocomplete email)  
✅ Menampilkan Daftar Anggota Proyek  
✅ Menampilkan Statistik Task dalam bentuk Chart  
✅ Menampilkan Assignee pada Card Task  
✅ Semua fitur memiliki autentikasi (berbasis token)

---

## 🛠️ Teknologi

- Next.js 14 (App Router + API Route)
- TypeScript
- TailwindCSS + shadcn/ui
- Prisma ORM + SQLite
- JWT untuk autentikasi
- Chart.js untuk statistik
- DnD Drag & Drop native
- Database: **SQLite (dev)** 

---

## 📦 Struktur Direktori

├── prisma/
│ └── schema.prisma # Skema database (User, Project, Task, Membership)
│
├── src/
│ ├── app/
│ │ ├── api/ # API routes (projects, tasks, auth, members)
│ │ ├── login/ # Halaman login
│ │ ├── register/ # Halaman register
│ │ └── projects/ # Halaman project dan task board
│ │
│ └── components/ # UI Components (shadcn/ui based)
│
├── .env # Variabel lingkungan lokal
├── .env.example # Template env
├── README.md
└── package.json


---

## ⚙️ Setup Lokal

```bash
git clone https://github.com/pangdamsetiawan/-sp_fs_-Pangdam-Setiawan-.git
cd -sp_fs_-Pangdam-Setiawan-

# Install dependencies
npm install

# Copy file .env.example ke .env
cp .env.example .env

# Setup database
npx prisma migrate dev --name init

# Jalankan server
npm run dev

🧪 Catatan Tambahan
Backend tidak dideploy, namun bisa dijalankan secara lokal.

Frontend terhubung langsung ke backend lokal.

Untuk login & register, token JWT disimpan di cookie.

💡 Penutup

Terima kasih atas kesempatan mengikuti tes ini.
Apabila ada pertanyaan lanjutan, saya siap untuk menjawab.

Nama: Pangdam Setiawan
Email: pangdamsetiawan09@gmail.com
Github: https://github.com/pangdamsetiawan
