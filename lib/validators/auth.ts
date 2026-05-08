import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
})

export const registerSchema = loginSchema.extend({
  name: z.string().min(3, "Nama minimal 3 karakter."),
})
