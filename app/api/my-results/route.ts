import { fromError, ok } from "@/lib/http"
import { getCurrentUserResultHistory } from "@/lib/services/result-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get("page") ?? "1")
    const pageSize = Number(searchParams.get("pageSize") ?? "10")

    const data = await getCurrentUserResultHistory({ page, pageSize })
    return ok(data)
  } catch (error) {
    return fromError(error)
  }
}
