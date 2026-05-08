export const AUTH_COOKIE_NAME = "cpns_auth"

export const EXAM_BLUEPRINT = {
  TWK: 30,
  TIU: 35,
  TKP: 45,
} as const

export const PASSING_GRADES = {
  TWK: 65,
  TIU: 80,
  TKP: 166,
} as const

export const TOTAL_QUESTIONS =
  EXAM_BLUEPRINT.TWK + EXAM_BLUEPRINT.TIU + EXAM_BLUEPRINT.TKP

export const EXAM_DURATION_MINUTES = 100

export const EXCEL_HEADERS = [
  "soal",
  "pilihan_a",
  "pilihan_b",
  "pilihan_c",
  "pilihan_d",
  "pilihan_e",
  "jawaban_benar",
  "pembahasan",
  "kategori",
] as const

export const CATEGORY_META = {
  TWK: {
    name: "Tes Wawasan Kebangsaan",
    passingGrade: PASSING_GRADES.TWK,
  },
  TIU: {
    name: "Tes Intelegensi Umum",
    passingGrade: PASSING_GRADES.TIU,
  },
  TKP: {
    name: "Tes Karakteristik Pribadi",
    passingGrade: PASSING_GRADES.TKP,
  },
} as const
