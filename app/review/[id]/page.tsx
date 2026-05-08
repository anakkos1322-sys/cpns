"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Filter, Home, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type FilterType = "all" | "correct" | "incorrect"
type CategoryFilter = "ALL" | "TWK" | "TIU" | "TKP"

interface ExplanationItem {
  orderIndex: number
  questionId: string
  category: "TWK" | "TIU" | "TKP"
  body: string
  explanation: string | null
  selectedOptionId: string | null
  correctOptionId: string | null
  isCorrect: boolean
  options: Array<{
    id: string
    label: string
    content: string
    isCorrect: boolean
  }>
}

export default function ReviewPage() {
  const params = useParams<{ id: string }>()
  const [items, setItems] = useState<ExplanationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [filter, setFilter] = useState<FilterType>("all")
  const [category, setCategory] = useState<CategoryFilter>("ALL")

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch(`/api/get-explanations/${params.id}`)
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload.error)
        }
        setItems(payload.data.items as ExplanationItem[])
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Gagal memuat pembahasan.")
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [params.id])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (category !== "ALL" && item.category !== category) {
        return false
      }
      if (filter === "correct") {
        return item.isCorrect
      }
      if (filter === "incorrect") {
        return !item.isCorrect
      }
      return true
    })
  }, [category, filter, items])

  const current = filteredItems[currentIndex] ?? null

  useEffect(() => {
    setCurrentIndex(0)
  }, [filter, category])

  if (loading) {
    return <div className="min-h-screen bg-background p-6 text-center text-muted-foreground">Memuat pembahasan...</div>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-muted-foreground">{error}</p>
            <Button asChild>
              <Link href="/">Kembali ke beranda</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link href={`/results/${params.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <p className="font-semibold">Pembahasan Soal</p>
              <p className="text-sm text-muted-foreground">{filteredItems.length} soal</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Beranda
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="border-border/50">
            <CardContent className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {(["all", "correct", "incorrect"] as const).map((value) => (
                  <Button key={value} variant={filter === value ? "default" : "outline"} size="sm" onClick={() => setFilter(value)}>
                    <Filter className="h-4 w-4 mr-2" />
                    {value === "all" ? "Semua" : value === "correct" ? "Benar" : "Salah"}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(["ALL", "TWK", "TIU", "TKP"] as const).map((value) => (
                  <Button key={value} variant={category === value ? "default" : "outline"} size="sm" onClick={() => setCategory(value)}>
                    {value}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {!current ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center text-muted-foreground">Tidak ada soal untuk filter ini.</CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{current.category}</span>
                <span className={cn("rounded-full px-3 py-1 text-sm font-medium", current.isCorrect ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive")}>
                  {current.isCorrect ? "Benar" : "Salah"}
                </span>
              </div>

              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <p className="text-lg leading-relaxed">{current.body}</p>
                  <div className="space-y-3">
                    {current.options.map((option) => {
                      const isSelected = option.id === current.selectedOptionId
                      const isCorrect = option.id === current.correctOptionId
                      return (
                        <div
                          key={option.id}
                          className={cn(
                            "rounded-2xl border-2 p-4",
                            isCorrect
                              ? "border-emerald-500 bg-emerald-500/10"
                              : isSelected
                              ? "border-destructive bg-destructive/10"
                              : "border-border",
                          )}
                        >
                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted font-semibold text-muted-foreground">
                              {option.label}
                            </div>
                            <div className="space-y-2">
                              <p>{option.content}</p>
                              {isCorrect ? (
                                <p className="text-sm font-medium text-emerald-600">Jawaban benar</p>
                              ) : null}
                              {isSelected && !isCorrect ? (
                                <p className="text-sm font-medium text-destructive">Jawaban peserta</p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-primary">Pembahasan</h2>
                  <p className="mt-2 leading-relaxed">{current.explanation ?? "Pembahasan belum tersedia."}</p>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))} disabled={currentIndex === 0}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Sebelumnya
                </Button>
                <p className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {filteredItems.length}
                </p>
                <Button onClick={() => setCurrentIndex((value) => Math.min(filteredItems.length - 1, value + 1))} disabled={currentIndex === filteredItems.length - 1}>
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
