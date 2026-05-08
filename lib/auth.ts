import { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { AUTH_COOKIE_NAME } from "@/lib/constants"
import { prisma } from "@/lib/prisma"

interface SessionPayload {
  sub: string
  role: UserRole
  email: string
  name: string
}

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_SECRET belum diatur.")
  }
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function createUserSession(payload: SessionPayload) {
  const token = await signSession(payload)
  const store = await cookies()
  store.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearUserSession() {
  const store = await cookies()
  store.delete(AUTH_COOKIE_NAME)
}

export async function getSessionPayload() {
  const store = await cookies()
  const token = store.get(AUTH_COOKIE_NAME)?.value
  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const session = await getSessionPayload()
  if (!session?.sub) {
    return null
  }

  return prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Silakan login terlebih dahulu.")
  }
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== UserRole.ADMIN) {
    throw new Error("Akses admin diperlukan.")
  }
  return user
}
