"use client"

import { useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PreviewRow {
  rowNumber: number
  soal: string
  subtopik: string
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
        "subtopik",
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
        "Sejarah Perumusan Pancasila",
        "18 Agustus 1945",
        "17 Agustus 1945",
        "1 Juni 1945",
        "22 Juni 1945",
        "20 Mei 1908",
        "A",
        "Penetapan dilakukan oleh PPKI pada 18 Agustus 1945.",
        "TWK",
      ],
      [
        "Semboyan Bhinneka Tunggal Ika terdapat dalam kitab?",
        "Nasionalisme dan Integrasi Bangsa",
        "Sutasoma",
        "Negarakertagama",
        "Arjunawiwaha",
        "Pararaton",
        "Babad Tanah Jawi",
        "A",
        "Bhinneka Tunggal Ika dikenal dari kitab Sutasoma karya Mpu Tantular.",
        "TWK",
      ],
      [
        "Jika 4x - 6 = 18, maka nilai x adalah?",
        "Aritmetika Dasar",
        "6",
        "5",
        "7",
        "8",
        "4",
        "A",
        "4x = 24 sehingga x = 6.",
        "TIU",
      ],
      [
        "KATA : HURUF = KALIMAT : ...",
        "Analogi Verbal",
        "Paragraf",
        "Bacaan",
        "Makna",
        "Bahasa",
        "Buku",
        "A",
        "Kata tersusun dari huruf, kalimat tersusun menjadi paragraf.",
        "TIU",
      ],
      [
        "Saat target kerja mepet dan tim terlihat kewalahan, sikap yang paling tepat adalah...",
        "Kerja Sama Tim",
        "Menunggu instruksi atasan tanpa inisiatif",
        "Fokus pada tugas sendiri dan mengabaikan tim",
        "Membantu menyusun prioritas kerja tim dan menawarkan bantuan yang relevan",
        "Meminta tenggat diundur tanpa mencoba solusi lain",
        "Menyalahkan pembagian tugas sejak awal",
        "C",
        "Sikap terbaik adalah proaktif membantu tim tetap efektif dan terarah.",
        "TKP",
      ],
      [
        "Ketika menerima kritik atas hasil kerja, respons terbaik adalah...",
        "Profesionalisme",
        "Membela diri agar tidak disalahkan",
        "Menerima masukan, mengevaluasi kekurangan, lalu memperbaiki hasil kerja",
        "Diam dan tetap memakai cara lama",
        "Menyerahkan perbaikan ke rekan kerja",
        "Menghindari tugas serupa berikutnya",
        "B",
        "Respons profesional adalah terbuka pada evaluasi dan segera memperbaiki pekerjaan.",
        "TKP",
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
          <CardDescription>Gunakan kolom wajib: soal, subtopik, pilihan_a sampai pilihan_e, jawaban_benar, pembahasan, kategori. Template contoh sudah memuat beberapa subtopik TWK, TIU, dan TKP.</CardDescription>
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
            <p className="mt-3 font-medium">{file ? file.name : "Pilih file .csv, .xlsx, atau .xls"}</p>
            <p className="text-sm text-muted-foreground">Template download berbentuk CSV, dan upload mendukung CSV maupun Excel.</p>
            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
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
                  <th className="px-4 py-3">Subtopik</th>
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
                    <td className="px-4 py-3">{row.subtopik}</td>
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
