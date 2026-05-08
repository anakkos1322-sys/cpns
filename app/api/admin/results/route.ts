import { requireAdmin } from "@/lib/auth"
import { fail, ok, fromError } from "@/lib/http"
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

export async function DELETE(request: Request) {
  try {
    await requireAdmin()
    const body = (await request.json().catch(() => ({}))) as { id?: string }

    if (!body.id) {
      return fail("ID hasil wajib dikirim.", 400)
    }

    const result = await prisma.result.findUnique({
      where: { id: body.id },
      select: { examSessionId: true },
    })

    if (!result) {
      return fail("Hasil tes tidak ditemukan.", 404)
    }

    await prisma.examSession.delete({
      where: { id: result.examSessionId },
    })

    return ok({ deleted: true, id: body.id })
  } catch (error) {
    return fromError(error)
  }
}
