"use client"

import { useEffect, useState } from "react"
import { BarChart3, BookOpen, Brain, FileText, Trophy, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface DashboardStats {
  totalQuestions: number
  totalResults: number
  avgTotalScore: number
  passRate: number
  byCategory: {
    TWK: number
    TIU: number
    TKP: number
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/admin/stats")
      const payload = await response.json()
      setStats(payload.data as DashboardStats)
    }

    void run()
  }, [])

  const items = stats
    ? [
        { label: "Total Soal", value: stats.totalQuestions, icon: FileText },
        { label: "Soal TWK", value: stats.byCategory.TWK, icon: BookOpen },
        { label: "Soal TIU", value: stats.byCategory.TIU, icon: Brain },
        { label: "Soal TKP", value: stats.byCategory.TKP, icon: Users },
        { label: "Tes Selesai", value: stats.totalResults, icon: BarChart3 },
        { label: "Tingkat Lulus", value: `${stats.passRate}%`, icon: Trophy },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.label} className="border-border/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-3xl font-bold">{item.value}</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <item.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Rata-rata skor total</p>
          <p className="mt-2 text-4xl font-bold text-primary">{stats?.avgTotalScore ?? 0}</p>
        </CardContent>
      </Card>
    </div>
  )
}
