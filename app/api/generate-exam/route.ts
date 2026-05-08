import { generateExamSchema } from "@/lib/validators/exam"
import { fromError, ok } from "@/lib/http"
import { generateExamSession } from "@/lib/services/exam-service"

export async function POST(request: Request) {
  try {
    const body = generateExamSchema.parse(await request.json().catch(() => ({})))
    const session = await generateExamSession(body.examId)
    return ok(session)
  } catch (error) {
    return fromError(error)
  }
}
