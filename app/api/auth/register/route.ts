import { registerParticipant } from "@/lib/services/auth-service"
import { fromError, ok } from "@/lib/http"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const user = await registerParticipant(body)
    return ok(user)
  } catch (error) {
    return fromError(error)
  }
}
