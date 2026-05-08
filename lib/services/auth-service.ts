import { UserRole } from "@prisma/client"
import { createUserSession, hashPassword, verifyPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { loginSchema, registerSchema } from "@/lib/validators/auth"

export async function registerParticipant(input: unknown) {
  const data = registerSchema.parse(input)

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  })

  if (existingUser) {
    throw new Error("Email sudah terdaftar.")
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: await hashPassword(data.password),
      role: UserRole.PARTICIPANT,
    },
  })

  await createUserSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

export async function loginUser(input: unknown, role?: UserRole) {
  const data = loginSchema.parse(input)

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  })

  if (!user) {
    throw new Error("Email atau password salah.")
  }

  if (role && user.role !== role) {
    throw new Error("Role akun tidak sesuai.")
  }

  const isValid = await verifyPassword(data.password, user.passwordHash)
  if (!isValid) {
    throw new Error("Email atau password salah.")
  }

  await createUserSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}
