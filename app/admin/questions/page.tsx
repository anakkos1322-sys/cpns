"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface QuestionItem {
  id: string
  body: string
  explanation: string | null
  category: {
    code: "TWK" | "TIU" | "TKP"
  }
  options: Array<{
    id: string
    label: string
    content: string
    isCorrect: boolean
  }>
}

export default function AdminQuestionsPage() {
  const [items, setItems] = useState<QuestionItem[]>([])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "12",
        query,
      })
      if (category !== "ALL") {
        params.set("category", category)
      }
      const response = await fetch(`/api/admin/questions?${params.toString()}`)
      const payload = await response.json()
      setItems(payload.data.items as QuestionItem[])
      setTotalPages(payload.data.totalPages as number)
    }

    const timer = window.setTimeout(() => void run(), 250)
    return () => window.clearTimeout(timer)
  }, [category, page, query])

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardContent className="p-4 flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Cari soal..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {["ALL", "TWK", "TIU", "TKP"].map((value) => (
              <Button key={value} variant={category === value ? "default" : "outline"} size="sm" onClick={() => setCategory(value)}>
                {value}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="border-border/50">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{item.category.code}</span>
              </div>
              <p className="font-medium leading-relaxed">{item.body}</p>
              <div className="grid gap-2">
                {item.options.map((option) => (
                  <div key={option.id} className={`rounded-xl border p-3 text-sm ${option.isCorrect ? "border-emerald-500/30 bg-emerald-500/10" : "border-border"}`}>
                    <span className="font-semibold mr-2">{option.label}.</span>
                    {option.content}
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-primary/5 p-4 text-sm">
                <span className="font-semibold text-primary">Pembahasan:</span> {item.explanation ?? "-"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
