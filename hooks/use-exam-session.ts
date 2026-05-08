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
  const [saving, setSaving] = useState(false)
  const saveTimerRef = useRef<number | null>(null)

  const startExam = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/generate-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error)
      }

      setSession(payload.data as SessionPayload)
    } finally {
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
    }
  }, [])

  return {
    session,
    loading,
    saving,
    answeredCount,
    startExam,
    updateAnswer,
    finishExam,
  }
}
