import { fromError, ok } from "@/lib/http"
import { getResultExplanations } from "@/lib/services/result-service"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const result = await getResultExplanations(id)
    return ok(result)
  } catch (error) {
    return fromError(error)
  }
}
