# Aplikasi Tes CPNS

Backend dan logic lengkap aplikasi simulasi CAT CPNS berbasis:

- Next.js App Router
- TypeScript strict mode
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- shadcn/ui

## Fitur

- Auth peserta register/login dan admin login.
- Schema Prisma untuk `users`, `categories`, `questions`, `question_options`, `exams`, `exam_sessions`, `answers`, `results`.
- Upload bank soal Excel memakai `xlsx/sheetjs`.
- Validasi template, preview, row error, dan bulk import ribuan soal.
- Generate ujian acak 30 TWK, 35 TIU, 45 TKP.
- Urutan soal dan opsi jawaban diacak per sesi.
- Autosave jawaban, timer ujian, submit otomatis saat waktu habis.
- Perhitungan skor TWK, TIU, TKP, total skor, dan passing grade.
- Halaman hasil dan pembahasan lengkap.
- Pagination admin untuk bank soal dan hasil ujian.
- Compatible untuk Vercel + Supabase PostgreSQL.

## Struktur penting

- `prisma/schema.prisma`: model database utama.
- `prisma/seed.ts`: seed kategori, admin, peserta demo, paket ujian, dan dummy questions.
- `lib/services/*`: service layer untuk auth, upload, exam, result.
- `lib/validators/*`: validasi Zod.
- `app/api/*`: route handler utama.
- `hooks/use-auth.ts`: hook session user.
- `hooks/use-exam-session.ts`: hook start exam, autosave, finish exam.

## Setup lokal

1. Install dependency:

```bash
npm install
```

2. Copy env:

```bash
cp .env.example .env
```

3. Isi `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, dan `ADMIN_PASSWORD`.

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Push schema ke database:

```bash
npm run prisma:push
```

6. Jalankan seed:

```bash
npm run prisma:seed
```

7. Jalankan aplikasi:

```bash
npm run dev
```

## Akun seed

- Admin:
  - Email: sesuai `ADMIN_EMAIL`
  - Password: sesuai `ADMIN_PASSWORD`
- Peserta demo:
  - Email: `peserta@cpns.local`
  - Password: `Peserta12345!`

## Format Excel

Kolom wajib:

- `soal`
- `pilihan_a`
- `pilihan_b`
- `pilihan_c`
- `pilihan_d`
- `pilihan_e`
- `jawaban_benar`
- `pembahasan`
- `kategori`

Nilai valid:

- `jawaban_benar`: `A` sampai `E`
- `kategori`: `TWK`, `TIU`, `TKP`

## Endpoint utama

- `POST /api/upload-soal`
- `POST /api/generate-exam`
- `POST /api/save-answer`
- `POST /api/finish-exam`
- `GET /api/get-result/:id`
- `GET /api/get-explanations/:id`

Endpoint auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Endpoint admin:

- `GET /api/admin/questions`
- `GET /api/admin/results`

## Deployment

### Vercel

- Tambahkan env yang sama seperti `.env.example`.
- Pastikan `DATABASE_URL` mengarah ke Supabase/PostgreSQL production.
- Jalankan `npm run prisma:generate` saat build.

### Supabase PostgreSQL

- Gunakan connection string pooler atau direct connection sesuai kebutuhan deployment.
- Jalankan `npm run prisma:push` sebelum seed pertama.

## Catatan implementasi

- Proteksi admin dan API dilakukan lewat `proxy.ts`.
- Session memakai HTTP-only cookie + JWT `jose`.
- Import Excel menggunakan batching transaction untuk volume besar.
- Hasil ujian disimpan final di tabel `results`, detail ringkas tersimpan di `summary`.
- Randomisasi opsi disimpan per `exam_session_questions` agar review konsisten.

## Verifikasi

Build production sudah lolos:

```bash
npm run build
```
