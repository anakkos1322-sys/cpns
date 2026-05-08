"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export interface SessionQuestionOption {
  id: string
  label: string
  originalLabel: string
  content: string
}

export interface SessionQuestion {
  questionId: string
  orderIndex: number
  category: "TWK" | "TIU" | "TKP"
  body: string
  explanation: string | null
  selectedOptionId: string | null
  options: SessionQuestionOption[]
}

interface SessionPayload {
  sessionId: string
  durationMinutes: number
  expiresAt: string
  questions: SessionQuestion[]
}

export function useExamSession() {
  const [session, setSession] = useState<SessionPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const saveTimerRef = useRef<number | null>(null)
  const progressTimerRef = useRef<number | null>(null)

  const startExam = useCallback(async () => {
    setLoading(true)
    setLoadingProgress(0)

    progressTimerRef.current = window.setInterval(() => {
      setLoadingProgress((current) => {
        if (current >= 92) {
          return current
        }

        if (current < 40) {
          return current + 8
        }

        if (current < 70) {
          return current + 5
        }

        return current + 2
      })
    }, 350)

    try {
      const response = await fetch("/api/generate-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error)
      }

      setLoadingProgress(100)
      setSession(payload.data as SessionPayload)
    } finally {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
      setLoading(false)
    }
  }, [])

  const updateAnswer = useCallback(
    async (questionId: string, optionId: string | null) => {
      if (!session) {
        return
      }

      setSession((current) =>
        current
          ? {
              ...current,
              questions: current.questions.map((question) =>
                question.questionId === questionId
                  ? { ...question, selectedOptionId: optionId }
                  : question,
              ),
            }
          : current,
      )

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = window.setTimeout(async () => {
        setSaving(true)
        try {
          await fetch("/api/save-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: session.sessionId,
              questionId,
              optionId,
            }),
          })
        } finally {
          setSaving(false)
        }
      }, 350)
    },
    [session],
  )

  const finishExam = useCallback(async () => {
    if (!session) {
      throw new Error("Sesi ujian belum tersedia.")
    }

    const response = await fetch("/api/finish-exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.sessionId }),
    })

    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload.error)
    }

    return payload.data as { id: string }
  }, [session])

  const answeredCount = useMemo(
    () => session?.questions.filter((question) => Boolean(question.selectedOptionId)).length ?? 0,
    [session],
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current)
      }
    }
  }, [])

  return {
    session,
    loading,
    loadingProgress,
    saving,
    answeredCount,
    startExam,
    updateAnswer,
    finishExam,
  }
}
