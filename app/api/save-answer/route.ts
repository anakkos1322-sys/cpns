import { fromError, ok } from "@/lib/http"
import { saveAnswerForSession } from "@/lib/services/exam-service"
import { saveAnswerSchema } from "@/lib/validators/exam"

export async function POST(request: Request) {
  try {
    const body = saveAnswerSchema.parse(await request.json())
    const result = await saveAnswerForSession(body)
    return ok(result)
  } catch (error) {
    return fromError(error)
  }
}
