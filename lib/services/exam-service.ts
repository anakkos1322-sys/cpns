import { CategoryCode, ExamStatus, Prisma, SessionStatus } from "@prisma/client"
import { EXAM_DURATION_MINUTES, PASSING_GRADES } from "@/lib/constants"
import { requireUser } from "@/lib/auth"
import { sanitizeQuestionBody } from "@/lib/helpers/question"
import { evaluateScores } from "@/lib/helpers/score"
import { shuffleArray } from "@/lib/helpers/randomizer"
import { prisma } from "@/lib/prisma"

interface LoadedQuestion {
  id: string
  subtopic: string
  body: string
  explanation: string | null
  category: { code: CategoryCode }
  options: { id: string; label: string; content: string }[]
}

interface SubtopicCountRow {
  subtopic: string
  _count: {
    _all: number
  }
}

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

function allocateCountsBySubtopic(rows: SubtopicCountRow[], targetCount: number) {
  const totalAvailable = rows.reduce((sum, row) => sum + row._count._all, 0)
  if (totalAvailable < targetCount) {
    throw new Error(`Soal tidak cukup. Dibutuhkan ${targetCount}, tersedia ${totalAvailable}.`)
  }

  const shuffledRows = shuffleArray(rows)
  const allocation = new Map<string, number>()
  let remaining = targetCount

  for (const row of shuffledRows) {
    if (remaining === 0) {
      break
    }

    allocation.set(row.subtopic, 1)
    remaining -= 1
  }

  while (remaining > 0) {
    let distributed = false

    for (const row of shuffleArray(shuffledRows)) {
      const current = allocation.get(row.subtopic) ?? 0
      if (current >= row._count._all) {
        continue
      }

      allocation.set(row.subtopic, current + 1)
      remaining -= 1
      distributed = true

      if (remaining === 0) {
        break
      }
    }

    if (!distributed) {
      break
    }
  }

  return shuffledRows
    .map((row) => ({
      subtopic: row.subtopic,
      count: allocation.get(row.subtopic) ?? 0,
    }))
    .filter((row) => row.count > 0)
}

async function loadSelectedQuestionsByCategory(categoryCode: CategoryCode, count: number) {
  const category = await prisma.category.findUnique({
    where: { code: categoryCode },
    select: { id: true },
  })

  if (!category) {
    throw new Error(`Kategori ${categoryCode} tidak ditemukan.`)
  }

  const subtopics = await prisma.question.groupBy({
    by: ["subtopic"],
    where: { categoryId: category.id },
    _count: { _all: true },
  })

  const plan = allocateCountsBySubtopic(subtopics as SubtopicCountRow[], count)

  const pickedRows = await Promise.all(
    plan.map(({ subtopic, count: subtopicCount }) =>
      prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM questions
        WHERE "categoryId" = ${category.id}
          AND subtopic = ${subtopic}
        ORDER BY random()
        LIMIT ${subtopicCount}
      `,
    ),
  )

  const selectedIds = pickedRows.flat().map((row) => row.id)
  if (selectedIds.length < count) {
    throw new Error(`Soal ${categoryCode} tidak cukup untuk membentuk paket ujian.`)
  }

  const questions = await prisma.question.findMany({
    where: { id: { in: selectedIds } },
    include: {
      category: {
        select: {
          code: true,
        },
      },
      options: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          label: true,
          content: true,
        },
      },
    },
  })

  const questionMap = new Map(questions.map((question) => [question.id, question]))

  return shuffleArray(
    selectedIds
      .map((id) => questionMap.get(id))
      .filter((question): question is LoadedQuestion => Boolean(question)),
  )
}

function serializeSessionQuestion(
  sessionQuestion: {
    orderIndex: number
    question: {
      id: string
      subtopic: string
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
    subtopic: sessionQuestion.question.subtopic,
    body: sanitizeQuestionBody(sessionQuestion.question.body),
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

  const grouped = await Promise.all([
    loadSelectedQuestionsByCategory(CategoryCode.TWK, exam.twkCount),
    loadSelectedQuestionsByCategory(CategoryCode.TIU, exam.tiuCount),
    loadSelectedQuestionsByCategory(CategoryCode.TKP, exam.tkpCount),
  ])

  const selectedQuestions = [
    ...grouped[0].map((question) => ({
      question,
      categoryCode: CategoryCode.TWK,
    })),
    ...grouped[1].map((question) => ({
      question,
      categoryCode: CategoryCode.TIU,
    })),
    ...grouped[2].map((question) => ({
      question,
      categoryCode: CategoryCode.TKP,
    })),
  ]

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
