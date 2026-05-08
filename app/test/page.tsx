"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Grid3X3, History, LogIn, Save, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/use-auth"
import { useExamSession } from "@/hooks/use-exam-session"
import { cn } from "@/lib/utils"

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return [hours, minutes, secs].map((item) => String(item).padStart(2, "0")).join(":")
}

const CATEGORY_LABELS = {
  TWK: "Tes Wawasan Kebangsaan",
  TIU: "Tes Intelegensi Umum",
  TKP: "Tes Karakteristik Pribadi",
} as const

export default function TestPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { session, loading, loadingProgress, saving, answeredCount, startExam, updateAnswer, finishExam } =
    useExamSession()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [showConfirmEnd, setShowConfirmEnd] = useState(false)
  const [showNavGrid, setShowNavGrid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoNextEnabled, setAutoNextEnabled] = useState(true)

  useEffect(() => {
    if (!session?.expiresAt) {
      setSecondsLeft(null)
      return
    }

    const tick = () => {
      const delta = Math.max(
        0,
        Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000),
      )
      setSecondsLeft(delta)
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [session?.expiresAt])

  useEffect(() => {
    if (secondsLeft === null || secondsLeft !== 0 || !session || submitting) {
      return
    }

    setSubmitting(true)
    void finishExam()
      .then((result) => {
        router.push(`/results/${result.id}`)
      })
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : "Gagal submit otomatis.")
      })
      .finally(() => {
        setSubmitting(false)
      })
  }, [finishExam, router, secondsLeft, session, submitting])

  const currentQuestion = session?.questions[currentIndex] ?? null
  const totalQuestions = session?.questions.length ?? 0
  const previousQuestion = currentIndex > 0 ? session?.questions[currentIndex - 1] ?? null : null
  const isCategoryStart = Boolean(
    currentQuestion && (!previousQuestion || previousQuestion.category !== currentQuestion.category),
  )

  const categoryStats = useMemo(() => {
    const items = session?.questions ?? []
    return {
      TWK: items.filter((item) => item.category === "TWK").length,
      TIU: items.filter((item) => item.category === "TIU").length,
      TKP: items.filter((item) => item.category === "TKP").length,
    }
  }, [session?.questions])

  const handleFinish = async () => {
    try {
      setSubmitting(true)
      const result = await finishExam()
      router.push(`/results/${result.id}`)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gagal menyelesaikan ujian.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    router.push("/")
    router.refresh()
  }

  if (authLoading) {
    return <div className="min-h-screen bg-background p-6 text-center text-muted-foreground">Memuat akun...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-border/50">
          <CardContent className="p-8 text-center space-y-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LogIn className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Login untuk memulai tes</h1>
              <p className="text-muted-foreground">
                Peserta perlu login atau membuat akun sebelum sesi ujian dibuat.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href="/login">Login Peserta</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-border/50">
          <CardContent className="p-8">
            <div className="space-y-6 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Clock className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Simulasi CAT CPNS</h1>
                <p className="text-muted-foreground">
                  Saat mulai tes, sistem akan mengambil 30 TWK, 35 TIU, dan 45 TKP secara acak.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-blue-500/10 p-4">
                  <p className="text-3xl font-bold text-blue-600">30</p>
                  <p className="text-sm text-muted-foreground">TWK</p>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 p-4">
                  <p className="text-3xl font-bold text-emerald-600">35</p>
                  <p className="text-sm text-muted-foreground">TIU</p>
                </div>
                <div className="rounded-2xl bg-amber-500/10 p-4">
                  <p className="text-3xl font-bold text-amber-600">45</p>
                  <p className="text-sm text-muted-foreground">TKP</p>
                </div>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {loading ? (
                <div className="mx-auto w-full max-w-md space-y-3 text-left">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Menyiapkan soal dan mengacak subtopik...</span>
                    <span className="font-semibold text-primary">{loadingProgress}%</span>
                  </div>
                  <Progress value={loadingProgress} className="h-3" />
                </div>
              ) : null}
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button onClick={() => void startExam()} size="lg" disabled={loading}>
                  {loading ? "Menyiapkan soal..." : "Mulai Tes"}
                </Button>
                <Button asChild variant="outline" size="lg" disabled={loading}>
                  <Link href="/my-results">
                    <History className="h-4 w-4 mr-2" />
                    Riwayat Nilai
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentQuestion) {
    return <div className="min-h-screen bg-background p-6 text-center text-muted-foreground">Soal tidak tersedia.</div>
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Simulasi CAT CPNS</p>
              <p className="text-sm text-muted-foreground">
                {user?.name ? `${user.name} · ` : ""}{answeredCount} dari {totalQuestions} soal terjawab
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <span className="hidden rounded-full bg-muted px-3 py-2 text-sm font-medium text-foreground md:inline-flex">
                  {user.name}
                </span>
              ) : null}
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 font-mono font-semibold",
                  secondsLeft <= 300 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
                )}
              >
                <Clock className="h-4 w-4" />
                {formatTime(secondsLeft ?? 0)}
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowNavGrid(true)}>
                <Grid3X3 className="h-4 w-4 mr-2" />
                Navigasi
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/my-results">
                  <History className="h-4 w-4 mr-2" />
                  Riwayat
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
                Logout
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setShowConfirmEnd(true)} disabled={submitting}>
                Selesai
              </Button>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>TWK: {categoryStats.TWK}</span>
            <span>TIU: {categoryStats.TIU}</span>
            <span>TKP: {categoryStats.TKP}</span>
            <div className="ml-auto flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs">
              <Label htmlFor="auto-next-switch" className="cursor-pointer text-xs font-medium text-foreground">
                Auto lanjut
              </Label>
              <Switch
                id="auto-next-switch"
                checked={autoNextEnabled}
                onCheckedChange={setAutoNextEnabled}
              />
            </div>
            {saving ? (
              <span className="inline-flex items-center gap-1 text-primary">
                <Save className="h-3 w-3" />
                Autosave...
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        <div className="mx-auto max-w-4xl space-y-6">
          {error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {currentQuestion.category}
            </span>
            <span className="text-sm text-muted-foreground">
              Soal {currentIndex + 1} / {totalQuestions}
            </span>
          </div>

          {isCategoryStart ? (
            <motion.div
              key={`section-${currentQuestion.category}-${currentIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Bagian {currentQuestion.category}
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {CATEGORY_LABELS[currentQuestion.category]}
              </p>
            </motion.div>
          ) : null}

          <Card className="border-border/50">
            <CardContent className="p-6">
              <p className="text-lg leading-relaxed">{currentQuestion.body}</p>
            </CardContent>
          </Card>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.questionId}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => {
                const active = option.id === currentQuestion.selectedOptionId
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      void updateAnswer(currentQuestion.questionId, option.id)
                      if (autoNextEnabled) {
                        setCurrentIndex((value) => Math.min(totalQuestions - 1, value + 1))
                      }
                    }}
                    className={cn(
                      "w-full rounded-2xl border-2 p-4 text-left transition-colors",
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl font-semibold",
                          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {option.label}
                      </div>
                      <p className="pt-1">{option.content}</p>
                    </div>
                  </button>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Button variant="outline" onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))} disabled={currentIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Sebelumnya
          </Button>
          <p className="text-sm text-muted-foreground">
            {session.questions.filter((item) => !item.selectedOptionId).length} belum dijawab
          </p>
          <Button onClick={() => setCurrentIndex((value) => Math.min(totalQuestions - 1, value + 1))} disabled={currentIndex === totalQuestions - 1}>
            Selanjutnya
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </footer>

      <AnimatePresence>
        {showNavGrid ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowNavGrid(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-xl rounded-3xl border border-border bg-background p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Navigasi Soal</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowNavGrid(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-[60vh] overflow-auto">
                {session.questions.map((question, index) => (
                  <button
                    key={question.questionId}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(index)
                      setShowNavGrid(false)
                    }}
                    className={cn(
                      "h-10 rounded-xl text-sm font-medium",
                      index === currentIndex
                        ? "bg-primary text-primary-foreground"
                        : question.selectedOptionId
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmEnd ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowConfirmEnd(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-border bg-background p-6 text-center"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-semibold">Akhiri tes sekarang?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Anda sudah menjawab {answeredCount} dari {totalQuestions} soal.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setShowConfirmEnd(false)}>
                  Lanjutkan
                </Button>
                <Button variant="destructive" onClick={() => void handleFinish()} disabled={submitting}>
                  {submitting ? "Memproses..." : "Selesai"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
