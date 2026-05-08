import { requireAdmin } from "@/lib/auth"
import { ok, fromError } from "@/lib/http"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get("page") ?? "1")
    const pageSize = Number(searchParams.get("pageSize") ?? "20")

    const [items, total] = await prisma.$transaction([
      prisma.result.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.result.count(),
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
