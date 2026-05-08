"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BarChart3, Clock, FileText, Home, LogIn, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"

interface ResultHistoryItem {
  id: string
  scoreTWK: number
  scoreTIU: number
  scoreTKP: number
  totalScore: number
  passed: boolean
  createdAt: string
}

export default function MyResultsPage() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<ResultHistoryItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/my-results?page=${page}&pageSize=10`)
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload.error)
        }

        setItems(payload.data.items as ResultHistoryItem[])
        setTotalPages(payload.data.totalPages as number)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Gagal memuat riwayat nilai.")
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [page, user])

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
              <h1 className="text-2xl font-bold">Login untuk melihat riwayat nilai</h1>
              <p className="text-muted-foreground">Riwayat hasil tes hanya tersedia untuk peserta yang sudah login.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href="/login">Login Peserta</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Kembali</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Riwayat Nilai Saya</h1>
            <p className="text-muted-foreground">Semua hasil tes dari akun {user.name}.</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/test">
                <FileText className="h-4 w-4 mr-2" />
                Kembali ke Tes
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

        {error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-border/50 p-8 text-center text-muted-foreground">
            Memuat riwayat nilai...
          </div>
        ) : items.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center space-y-3">
              <BarChart3 className="mx-auto h-10 w-10 text-primary" />
              <p className="text-lg font-semibold">Belum ada hasil tes</p>
              <p className="text-muted-foreground">Mulai tes pertama kamu dulu, nanti riwayat nilainya akan muncul di sini.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50">
            <CardContent className="overflow-auto p-0">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">TWK</th>
                    <th className="px-4 py-3">TIU</th>
                    <th className="px-4 py-3">TKP</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/60">
                      <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3">{item.scoreTWK}</td>
                      <td className="px-4 py-3">{item.scoreTIU}</td>
                      <td className="px-4 py-3">{item.scoreTKP}</td>
                      <td className="px-4 py-3 font-semibold">{item.totalScore}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.passed ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                          {item.passed ? "Lulus" : "Belum lulus"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/results/${item.id}`}>Detail</Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/review/${item.id}`}>Pembahasan</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {items.length > 0 ? (
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
              Sebelumnya
            </Button>
            <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Halaman {page} dari {totalPages}
            </p>
            <Button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>
              Berikutnya
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
