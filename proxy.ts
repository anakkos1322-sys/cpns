import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { AUTH_COOKIE_NAME } from "@/lib/constants"

async function verifyToken(token: string) {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return payload as { role?: string }
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null

  const needsAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/upload-soal") ||
    pathname.startsWith("/api/admin")

  const needsParticipantApi =
    pathname.startsWith("/api/generate-exam") ||
    pathname.startsWith("/api/save-answer") ||
    pathname.startsWith("/api/finish-exam") ||
    pathname.startsWith("/api/get-result") ||
    pathname.startsWith("/api/get-explanations")

  if (needsAdmin) {
    if (!payload) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    if (payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  if (needsParticipantApi && !payload) {
    return NextResponse.json(
      { success: false, error: "Silakan login terlebih dahulu." },
      { status: 401 },
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
}
