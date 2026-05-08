import { CategoryCode, Prisma } from "@prisma/client"
import * as XLSX from "xlsx"
import { EXCEL_HEADERS } from "@/lib/constants"
import { prisma } from "@/lib/prisma"
import { excelRowSchema } from "@/lib/validators/upload"

interface ParsedRow {
  rowNumber: number
  soal: string
  pilihan_a: string
  pilihan_b: string
  pilihan_c: string
  pilihan_d: string
  pilihan_e: string
  jawaban_benar: "A" | "B" | "C" | "D" | "E"
  pembahasan: string
  kategori: "TWK" | "TIU" | "TKP"
}

export interface UploadPreviewItem extends ParsedRow {
  valid: boolean
  errors: string[]
}

function normalizeHeader(header: unknown) {
  return String(header ?? "")
    .trim()
    .toLowerCase()
}

export function parseExcelBuffer(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    throw new Error("Sheet Excel tidak ditemukan.")
  }

  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: false,
    defval: "",
  })

  const headers = Object.keys(rows[0] ?? {}).map(normalizeHeader)
  const missingHeaders = EXCEL_HEADERS.filter((header) => !headers.includes(header))

  if (missingHeaders.length > 0) {
    throw new Error(`Template Excel tidak valid. Kolom kurang: ${missingHeaders.join(", ")}`)
  }

  return rows
}

export function buildUploadPreview(rows: Record<string, unknown>[]) {
  return rows.map((row, index) => {
    const normalized = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [normalizeHeader(key), String(value ?? "").trim()]),
    )

    const candidate = {
      soal: normalized.soal,
      pilihan_a: normalized.pilihan_a,
      pilihan_b: normalized.pilihan_b,
      pilihan_c: normalized.pilihan_c,
      pilihan_d: normalized.pilihan_d,
      pilihan_e: normalized.pilihan_e,
      jawaban_benar: normalized.jawaban_benar.toUpperCase(),
      pembahasan: normalized.pembahasan,
      kategori: normalized.kategori.toUpperCase(),
    }

    const validation = excelRowSchema.safeParse(candidate)

    return {
      rowNumber: index + 2,
      ...candidate,
      valid: validation.success,
      errors: validation.success
        ? []
        : validation.error.issues.map((issue) => issue.message),
    } satisfies UploadPreviewItem
  })
}

function answerToIndex(answer: ParsedRow["jawaban_benar"]) {
  return ["A", "B", "C", "D", "E"].indexOf(answer)
}

export async function importQuestions(preview: UploadPreviewItem[]) {
  const validRows = preview.filter((item) => item.valid)
  if (validRows.length === 0) {
    throw new Error("Tidak ada baris valid untuk diimport.")
  }

  const categories = await prisma.category.findMany({
    where: { code: { in: [CategoryCode.TWK, CategoryCode.TIU, CategoryCode.TKP] } },
  })
  const categoryMap = new Map(categories.map((category) => [category.code, category.id]))

  const batchSize = 250
  let imported = 0

  for (let index = 0; index < validRows.length; index += batchSize) {
    const batch = validRows.slice(index, index + batchSize)

    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        const question = await tx.question.create({
          data: {
            body: row.soal,
            explanation: row.pembahasan,
            categoryId: categoryMap.get(row.kategori as CategoryCode) ?? "",
          },
        })

        const options: Prisma.QuestionOptionCreateManyInput[] = [
          row.pilihan_a,
          row.pilihan_b,
          row.pilihan_c,
          row.pilihan_d,
          row.pilihan_e,
        ].map((content, optionIndex) => ({
          questionId: question.id,
          label: String.fromCharCode(65 + optionIndex),
          content,
          isCorrect: optionIndex === answerToIndex(row.jawaban_benar),
          sortOrder: optionIndex,
        }))

        await tx.questionOption.createMany({ data: options })
        imported += 1
      }
    })
  }

  return { imported }
}
