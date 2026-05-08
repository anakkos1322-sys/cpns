import { getCurrentUser } from "@/lib/auth"
import { fail, ok } from "@/lib/http"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return fail("Belum login.", 401)
  }
  return ok(user)
}
