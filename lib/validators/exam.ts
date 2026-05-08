import { z } from "zod"

export const generateExamSchema = z.object({
  examId: z.string().optional(),
})

export const saveAnswerSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  optionId: z.string().nullable(),
})

export const finishExamSchema = z.object({
  sessionId: z.string().min(1),
})
