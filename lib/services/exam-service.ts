import { CategoryCode, ExamStatus, Prisma, SessionStatus } from "@prisma/client"
import { EXAM_BLUEPRINT, EXAM_DURATION_MINUTES, PASSING_GRADES } from "@/lib/constants"
import { requireUser } from "@/lib/auth"
import { evaluateScores } from "@/lib/helpers/score"
import { sampleSize, shuffleArray } from "@/lib/helpers/randomizer"
import { prisma } from "@/lib/prisma"

function toExpiryDate() {
  return new Date(Date.now() + EXAM_DURATION_MINUTES * 60 * 1000)
}

async function getExam(examId?: string) {
  if (examId) {
    const exam = await prisma.exam.findUnique({ where: { id: examId } })
    if (!exam) {
      throw new Error("Paket ujian tidak ditemukan.")
    }
    return exam
  }

  const exam = await prisma.exam.findFirst({
    where: { status: ExamStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
  })

  if (!exam) {
    throw new Error("Belum ada ujian aktif.")
  }

  return exam
}

async function loadQuestionsByCategory() {
  const questions = await prisma.question.findMany({
    include: {
      category: true,
      options: {
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  return {
    TWK: questions.filter((question) => question.category.code === CategoryCode.TWK),
    TIU: questions.filter((question) => question.category.code === CategoryCode.TIU),
    TKP: questions.filter((question) => question.category.code === CategoryCode.TKP),
  }
}

function serializeSessionQuestion(
  sessionQuestion: {
    orderIndex: number
    question: {
      id: string
      body: string
      explanation: string | null
      category: { code: CategoryCode }
      options: { id: string; label: string; content: string }[]
    }
    optionOrder: Prisma.JsonValue
  },
  selectedOptionId?: string | null,
) {
  const optionOrder = Array.isArray(sessionQuestion.optionOrder)
    ? (sessionQuestion.optionOrder as string[])
    : []

  const optionMap = new Map(
    sessionQuestion.question.options.map((option) => [option.id, option]),
  )

  return {
    questionId: sessionQuestion.question.id,
    orderIndex: sessionQuestion.orderIndex,
    category: sessionQuestion.question.category.code,
    body: sessionQuestion.question.body,
    explanation: sessionQuestion.question.explanation,
    selectedOptionId: selectedOptionId ?? null,
    options: optionOrder
      .map((optionId) => optionMap.get(optionId))
      .filter((option): option is NonNullable<typeof option> => Boolean(option))
      .map((option, index) => ({
        id: option.id,
        label: String.fromCharCode(65 + index),
        originalLabel: option.label,
        content: option.content,
      })),
  }
}

export async function generateExamSession(examId?: string) {
  const user = await requireUser()
  const exam = await getExam(examId)

  const activeSession = await prisma.examSession.findFirst({
    where: {
      userId: user.id,
      status: SessionStatus.IN_PROGRESS,
      expiresAt: { gt: new Date() },
    },
    include: {
      exam: true,
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
  })

  if (activeSession) {
    return {
      sessionId: activeSession.id,
      examId: activeSession.examId,
      durationMinutes: activeSession.exam.durationMinutes,
      expiresAt: activeSession.expiresAt.toISOString(),
      status: activeSession.status,
      questions: activeSession.sessionQuestions.map((sessionQuestion) =>
        serializeSessionQuestion(
          sessionQuestion,
          activeSession.answers.find((answer) => answer.questionId === sessionQuestion.questionId)
            ?.selectedOptionId,
        ),
      ),
    }
  }

  const grouped = await loadQuestionsByCategory()

  const selectedQuestions = shuffleArray([
    ...sampleSize(grouped.TWK, EXAM_BLUEPRINT.TWK).map((question) => ({
      question,
      categoryCode: CategoryCode.TWK,
    })),
    ...sampleSize(grouped.TIU, EXAM_BLUEPRINT.TIU).map((question) => ({
      question,
      categoryCode: CategoryCode.TIU,
    })),
    ...sampleSize(grouped.TKP, EXAM_BLUEPRINT.TKP).map((question) => ({
      question,
      categoryCode: CategoryCode.TKP,
    })),
  ])

  const created = await prisma.examSession.create({
    data: {
      userId: user.id,
      examId: exam.id,
      expiresAt: toExpiryDate(),
      sessionQuestions: {
        create: selectedQuestions.map(({ question, categoryCode }, index) => ({
          questionId: question.id,
          orderIndex: index,
          categoryCode,
          optionOrder: shuffleArray(question.options.map((option) => option.id)),
        })),
      },
    },
    include: {
      exam: true,
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
  })

  return {
    sessionId: created.id,
    examId: created.examId,
    durationMinutes: created.exam.durationMinutes,
    expiresAt: created.expiresAt.toISOString(),
    status: created.status,
    questions: created.sessionQuestions.map((sessionQuestion) =>
      serializeSessionQuestion(sessionQuestion),
    ),
  }
}

export async function saveAnswerForSession(input: {
  sessionId: string
  questionId: string
  optionId: string | null
}) {
  const user = await requireUser()

  const session = await prisma.examSession.findFirst({
    where: {
      id: input.sessionId,
      userId: user.id,
    },
  })

  if (!session) {
    throw new Error("Sesi ujian tidak ditemukan.")
  }

  if (session.status !== SessionStatus.IN_PROGRESS) {
    throw new Error("Sesi ujian sudah selesai.")
  }

  if (session.expiresAt <= new Date()) {
    await finalizeExamSession(input.sessionId, true)
    throw new Error("Waktu ujian sudah habis. Sesi disubmit otomatis.")
  }

  await prisma.answer.upsert({
    where: {
      examSessionId_questionId: {
        examSessionId: input.sessionId,
        questionId: input.questionId,
      },
    },
    update: {
      selectedOptionId: input.optionId,
    },
    create: {
      examSessionId: input.sessionId,
      questionId: input.questionId,
      selectedOptionId: input.optionId,
    },
  })

  return { saved: true, savedAt: new Date().toISOString() }
}

export async function finalizeExamSession(sessionId: string, autoSubmit = false) {
  const user = await requireUser()

  const session = await prisma.examSession.findFirst({
    where: {
      id: sessionId,
      userId: user.id,
    },
    include: {
      answers: true,
      result: true,
      sessionQuestions: {
        include: {
          question: {
            include: {
              category: true,
              options: true,
            },
          },
        },
      },
    },
  })

  if (!session) {
    throw new Error("Sesi ujian tidak ditemukan.")
  }

  if (session.result) {
    return session.result
  }

  const scores = { TWK: 0, TIU: 0, TKP: 0 }

  const answerMap = new Map(session.answers.map((answer) => [answer.questionId, answer]))

  const detailRows = session.sessionQuestions.map((sessionQuestion) => {
    const selectedAnswer = answerMap.get(sessionQuestion.questionId)
    const correctOption = sessionQuestion.question.options.find((option) => option.isCorrect)
    const isCorrect =
      Boolean(selectedAnswer?.selectedOptionId) &&
      selectedAnswer?.selectedOptionId === correctOption?.id

    const category = sessionQuestion.question.category.code
    if (isCorrect) {
      scores[category] += 5
    }

    return {
      questionId: sessionQuestion.questionId,
      category,
      correctOptionId: correctOption?.id ?? null,
      selectedOptionId: selectedAnswer?.selectedOptionId ?? null,
      isCorrect,
    }
  })

  const evaluation = evaluateScores(scores)

  const result = await prisma.$transaction(async (tx) => {
    await tx.examSession.update({
      where: { id: sessionId },
      data: {
        status: autoSubmit ? SessionStatus.EXPIRED : SessionStatus.SUBMITTED,
        submittedAt: new Date(),
        autoSubmittedAt: autoSubmit ? new Date() : null,
      },
    })

    return tx.result.create({
      data: {
        examSessionId: sessionId,
        userId: session.userId,
        scoreTWK: evaluation.TWK,
        scoreTIU: evaluation.TIU,
        scoreTKP: evaluation.TKP,
        totalScore: evaluation.total,
        passed: evaluation.passed,
        passingGrade: PASSING_GRADES,
        summary: {
          durationSeconds: Math.max(
            0,
            Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
          ),
          autoSubmit,
          answers: detailRows,
        },
      },
    })
  })

  return result
}
