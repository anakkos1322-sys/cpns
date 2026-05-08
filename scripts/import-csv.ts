import { readFile } from "node:fs/promises"
import { buildUploadPreview, importQuestions, parseSpreadsheetBuffer } from "../lib/services/upload-service"

async function main() {
  const filePath = process.argv[2]
  const mode = process.argv[3] ?? "preview"

  if (!filePath) {
    throw new Error("Path file wajib diberikan.")
  }

  const file = await readFile(filePath)
  const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
  const rows = parseSpreadsheetBuffer(buffer)
  const preview = buildUploadPreview(rows)

  const valid = preview.filter((item) => item.valid).length
  const invalid = preview.length - valid

  if (mode === "preview") {
    console.log(
      JSON.stringify(
        {
          totalRows: preview.length,
          valid,
          invalid,
          sampleErrors: preview.filter((item) => !item.valid).slice(0, 5),
        },
        null,
        2,
      ),
    )
    return
  }

  const result = await importQuestions(preview)
  console.log(
    JSON.stringify(
      {
        totalRows: preview.length,
        valid,
        invalid,
        imported: result.imported,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
