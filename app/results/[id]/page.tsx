"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CheckCircle2, Clock, FileText, Home, RotateCcw, Trophy, XCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ResultPayload {
  id: string
  scores: {
    TWK: number
    TIU: number
    TKP: number
    total: number
  }
  passingGrade: {
    TWK: number
    TIU: number
    TKP: number
  }
  passed: boolean
  answeredCount: number
  correctCount: number
  incorrectCount: number
  durationSeconds: number
  autoSubmit: boolean
}

export default function ResultPage() {
  const params = useParams<{ id: string }>()
  const [result, setResult] = useState<ResultPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch(`/api/get-result/${params.id}`)
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload.error)
        }
        setResult(payload.data as ResultPayload)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Gagal memuat hasil.")
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [params.id])

  if (loading) {
    return <div className="min-h-screen bg-background p-6 text-center text-muted-foreground">Memuat hasil ujian...</div>
  }

  if (!result || error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-muted-foreground">{error ?? "Hasil tidak ditemukan."}</p>
            <Button asChild>
              <Link href="/">Kembali ke beranda</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div
            className={cn(
              "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl",
              result.passed ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive",
            )}
          >
            {result.passed ? <Trophy className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
          </div>
          <h1 className={cn("text-3xl font-bold", result.passed ? "text-emerald-600" : "text-destructive")}>
            {result.passed ? "Lulus Passing Grade" : "Belum Lulus"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {result.autoSubmit ? "Sesi berakhir karena waktu habis." : "Sesi berhasil disubmit."}
          </p>
        </motion.div>

        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Total Skor</p>
            <p className="text-6xl font-bold text-primary">{result.scores.total}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {(["TWK", "TIU", "TKP"] as const).map((category) => {
            const passed = result.scores[category] >= result.passingGrade[category]
            return (
              <Card key={category} className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{category}</p>
                      <p className="text-3xl font-bold">{result.scores[category]}</p>
                    </div>
                    {passed ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-destructive" />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Passing grade: {result.passingGrade[category]}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50">
            <CardContent className="p-5 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{result.correctCount}</p>
              <p className="text-sm text-muted-foreground">Benar</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-5 text-center">
              <XCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold">{result.incorrectCount}</p>
              <p className="text-sm text-muted-foreground">Salah / kosong</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-5 text-center">
              <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{Math.floor(result.durationSeconds / 60)}</p>
              <p className="text-sm text-muted-foreground">Menit</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Button asChild variant="outline">
            <Link href={`/review/${result.id}`}>
              <FileText className="h-4 w-4 mr-2" />
              Pembahasan
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/test">
              <RotateCcw className="h-4 w-4 mr-2" />
              Ulangi Tes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Beranda
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
