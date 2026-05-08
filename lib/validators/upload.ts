import { z } from "zod"

export const excelRowSchema = z.object({
  soal: z.string().min(1, "Kolom soal wajib diisi."),
  pilihan_a: z.string().min(1, "pilihan_a wajib diisi."),
  pilihan_b: z.string().min(1, "pilihan_b wajib diisi."),
  pilihan_c: z.string().min(1, "pilihan_c wajib diisi."),
  pilihan_d: z.string().min(1, "pilihan_d wajib diisi."),
  pilihan_e: z.string().min(1, "pilihan_e wajib diisi."),
  jawaban_benar: z.enum(["A", "B", "C", "D", "E"]),
  pembahasan: z.string().min(1, "Kolom pembahasan wajib diisi."),
  kategori: z.enum(["TWK", "TIU", "TKP"]),
})
