"use client"

import { useCallback, useEffect, useState } from "react"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: "ADMIN" | "PARTICIPANT"
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (!response.ok) {
        setUser(null)
        return
      }

      const payload = (await response.json()) as { data: AuthUser }
      setUser(payload.data)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    setUser(null)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    refresh,
    logout,
  }
}
