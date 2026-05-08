"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ResultItem {
  id: string
  scoreTWK: number
  scoreTIU: number
  scoreTKP: number
  totalScore: number
  passed: boolean
  createdAt: string
  user: {
    name: string
    email: string
  }
}

export default function AdminResultsPage() {
  const [items, setItems] = useState<ResultItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const run = async () => {
      const response = await fetch(`/api/admin/results?page=${page}&pageSize=12`)
      const payload = await response.json()
      setItems(payload.data.items as ResultItem[])
      setTotalPages(payload.data.totalPages as number)
    }

    void run()
  }, [page])

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardContent className="overflow-auto p-0">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3">Peserta</th>
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
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.user.name}</p>
                    <p className="text-muted-foreground">{item.user.email}</p>
                  </td>
                  <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3">{item.scoreTWK}</td>
                  <td className="px-4 py-3">{item.scoreTIU}</td>
                  <td className="px-4 py-3">{item.scoreTKP}</td>
                  <td className="px-4 py-3 font-semibold">{item.totalScore}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.passed ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                      {item.passed ? "Lulus" : "Tidak lulus"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/results/${item.id}`}>Detail</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
          Sebelumnya
        </Button>
        <p className="text-sm text-muted-foreground">
          Halaman {page} dari {totalPages}
        </p>
        <Button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>
          Berikutnya
        </Button>
      </div>
    </div>
  )
}
