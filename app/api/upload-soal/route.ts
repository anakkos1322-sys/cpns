import { requireAdmin } from "@/lib/auth"
import { fromError, ok } from "@/lib/http"
import { buildUploadPreview, importQuestions, parseSpreadsheetBuffer } from "@/lib/services/upload-service"

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const formData = await request.formData()
    const file = formData.get("file")
    const mode = String(formData.get("mode") ?? "preview")

    if (!(file instanceof File)) {
      throw new Error("File CSV, XLSX, atau XLS wajib dipilih.")
    }

    const rows = parseSpreadsheetBuffer(await file.arrayBuffer())
    const preview = buildUploadPreview(rows)

    if (mode === "import") {
      const result = await importQuestions(preview)
      return ok({
        ...result,
        totalRows: preview.length,
        invalidRows: preview.filter((item) => !item.valid).length,
      })
    }

    return ok({
      totalRows: preview.length,
      validRows: preview.filter((item) => item.valid).length,
      invalidRows: preview.filter((item) => !item.valid).length,
      rows: preview,
    })
  } catch (error) {
    return fromError(error)
  }
}
