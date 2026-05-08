import { UserRole } from "@prisma/client"
import { getCurrentUser } from "@/lib/auth"
import { PASSING_GRADES } from "@/lib/constants"
import { prisma } from "@/lib/prisma"

async function authorizeResultAccess(resultId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Silakan login terlebih dahulu.")
  }

  const result = await prisma.result.findUnique({
    where: { id: resultId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      examSession: {
        include: {
          answers: true,
          sessionQuestions: {
            orderBy: { orderIndex: "asc" },
            include: {
              question: {
                include: {
                  category: true,
                  options: {
                    orderBy: { sortOrder: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!result) {
    throw new Error("Hasil ujian tidak ditemukan.")
  }

  if (user.role !== UserRole.ADMIN && result.userId !== user.id) {
    throw new Error("Anda tidak berhak mengakses hasil ini.")
  }

  return result
}

export async function getResultDetail(resultId: string) {
  const result = await authorizeResultAccess(resultId)
  const summary = result.summary as {
    durationSeconds?: number
    autoSubmit?: boolean
    answers?: Array<{
      questionId: string
      isCorrect: boolean
      selectedOptionId: string | null
      correctOptionId: string | null
      category: "TWK" | "TIU" | "TKP"
    }>
  }

  const answers = summary.answers ?? []
  const answeredCount = answers.filter((answer) => Boolean(answer.selectedOptionId)).length
  const correctCount = answers.filter((answer) => answer.isCorrect).length

  return {
    id: result.id,
    participant: result.user,
    createdAt: result.createdAt.toISOString(),
    scores: {
      TWK: result.scoreTWK,
      TIU: result.scoreTIU,
      TKP: result.scoreTKP,
      total: result.totalScore,
    },
    passingGrade: PASSING_GRADES,
    passed: result.passed,
    answeredCount,
    correctCount,
    incorrectCount: answers.length - correctCount,
    durationSeconds: summary.durationSeconds ?? 0,
    autoSubmit: summary.autoSubmit ?? false,
  }
}

export async function getResultExplanations(resultId: string) {
  const result = await authorizeResultAccess(resultId)
  const summary = result.summary as {
    answers?: Array<{
      questionId: string
      isCorrect: boolean
      selectedOptionId: string | null
      correctOptionId: string | null
      category: "TWK" | "TIU" | "TKP"
    }>
  }

  const answerMap = new Map(
    (summary.answers ?? []).map((answer) => [answer.questionId, answer]),
  )

  return {
    id: result.id,
    items: result.examSession.sessionQuestions.map((sessionQuestion) => {
      const answer = answerMap.get(sessionQuestion.questionId)
      return {
        orderIndex: sessionQuestion.orderIndex,
        questionId: sessionQuestion.questionId,
        category: sessionQuestion.question.category.code,
        body: sessionQuestion.question.body,
        explanation: sessionQuestion.question.explanation,
        selectedOptionId: answer?.selectedOptionId ?? null,
        correctOptionId: answer?.correctOptionId ?? null,
        isCorrect: answer?.isCorrect ?? false,
        options: sessionQuestion.question.options.map((option) => ({
          id: option.id,
          label: option.label,
          content: option.content,
          isCorrect: option.isCorrect,
        })),
      }
    }),
  }
}
