"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          role: "admin",
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error)
      }

      router.push("/admin")
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Login admin gagal.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/50">
        <CardContent className="p-8">
          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">Admin Login</h1>
              <p className="text-sm text-muted-foreground">Masuk untuk mengelola bank soal dan hasil ujian.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Login Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
