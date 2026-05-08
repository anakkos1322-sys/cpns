import { UserRole } from "@prisma/client"
import { loginUser } from "@/lib/services/auth-service"
import { fromError, ok } from "@/lib/http"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string; role?: string }
    const user = await loginUser(
      {
        email: body.email,
        password: body.password,
      },
      body.role === "admin" ? UserRole.ADMIN : undefined,
    )
    return ok(user)
  } catch (error) {
    return fromError(error)
  }
}
