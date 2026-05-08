import { requireAdmin } from "@/lib/auth"
import { ok, fromError } from "@/lib/http"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get("page") ?? "1")
    const pageSize = Number(searchParams.get("pageSize") ?? "20")
    const query = searchParams.get("query") ?? ""
    const category = searchParams.get("category") ?? ""

    const where: Prisma.QuestionWhereInput = {
      OR: query
        ? [
            { body: { contains: query, mode: "insensitive" } },
            { subtopic: { contains: query, mode: "insensitive" } },
          ]
        : undefined,
      category: category
        ? {
            code: category as "TWK" | "TIU" | "TKP",
          }
        : undefined,
    }

    const [items, total] = await prisma.$transaction([
      prisma.question.findMany({
        where,
        include: {
          category: true,
          options: {
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.question.count({ where }),
    ])

    return ok({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    return fromError(error)
  }
}
