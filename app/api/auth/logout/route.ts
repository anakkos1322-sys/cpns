import { clearUserSession } from "@/lib/auth"
import { ok } from "@/lib/http"

export async function POST() {
  await clearUserSession()
  return ok({ loggedOut: true })
}
