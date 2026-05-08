"use client"

import { useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PreviewRow {
  rowNumber: number
  soal: string
  jawaban_benar: string
  kategori: string
  valid: boolean
  errors: string[]
}

export default function UploadQuestionsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const validCount = useMemo(() => previewRows.filter((item) => item.valid).length, [previewRows])

  async function submit(mode: "preview" | "import") {
    if (!file) {
      setError("Pilih file Excel terlebih dahulu.")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set("mode", mode)

      const response = await fetch("/api/upload-soal", {
        method: "POST",
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error)
      }

      if (mode === "preview") {
        setPreviewRows(payload.data.rows as PreviewRow[])
      } else {
        setSuccess(`${payload.data.imported} soal berhasil diimport.`)
        setPreviewRows([])
        setFile(null)
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Upload gagal.")
    } finally {
      setLoading(false)
    }
  }

  function downloadTemplate() {
    const rows = [
      [
        "soal",
        "pilihan_a",
        "pilihan_b",
        "pilihan_c",
        "pilihan_d",
        "pilihan_e",
        "jawaban_benar",
        "pembahasan",
        "kategori",
      ],
      [
        "Pancasila ditetapkan sebagai dasar negara pada tanggal?",
        "18 Agustus 1945",
        "17 Agustus 1945",
        "1 Juni 1945",
        "22 Juni 1945",
        "20 Mei 1908",
        "A",
        "Penetapan dilakukan oleh PPKI pada 18 Agustus 1945.",
        "TWK",
      ],
    ]

    const csv = rows.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "template-bank-soal-cpns.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Template Excel</CardTitle>
          <CardDescription>Gunakan kolom wajib: soal, pilihan_a sampai pilihan_e, jawaban_benar, pembahasan, kategori.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Upload Bank Soal</CardTitle>
          <CardDescription>Preview dulu sebelum import massal ke PostgreSQL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border p-10 text-center hover:border-primary/40">
            <FileSpreadsheet className="h-10 w-10 text-primary" />
            <p className="mt-3 font-medium">{file ? file.name : "Pilih file .xlsx atau .xls"}</p>
            <p className="text-sm text-muted-foreground">Mendukung ribuan baris soal.</p>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
          ) : null}
          {success ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700">{success}</div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void submit("preview")} disabled={loading || !file}>
              <Upload className="h-4 w-4 mr-2" />
              {loading ? "Memproses..." : "Preview Data"}
            </Button>
            <Button variant="outline" onClick={() => void submit("import")} disabled={loading || previewRows.length === 0}>
              Import ke Database
            </Button>
          </div>
        </CardContent>
      </Card>

      {previewRows.length > 0 ? (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {validCount} valid dari {previewRows.length} baris.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3">Row</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Soal</th>
                  <th className="px-4 py-3">Jawaban</th>
                  <th className="px-4 py-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr key={row.rowNumber} className="border-b border-border/60 align-top">
                    <td className="px-4 py-3">{row.rowNumber}</td>
                    <td className="px-4 py-3">
                      {row.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </td>
                    <td className="px-4 py-3">{row.kategori}</td>
                    <td className="px-4 py-3">{row.soal}</td>
                    <td className="px-4 py-3">{row.jawaban_benar}</td>
                    <td className="px-4 py-3 text-destructive">{row.errors.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
