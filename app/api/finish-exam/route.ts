import { finalizeExamSession } from "@/lib/services/exam-service"
import { fromError, ok } from "@/lib/http"
import { finishExamSchema } from "@/lib/validators/exam"

export async function POST(request: Request) {
  try {
    const body = finishExamSchema.parse(await request.json())
    const result = await finalizeExamSession(body.sessionId)
    return ok(result)
  } catch (error) {
    return fromError(error)
  }
}
