import { CategoryCode } from "@prisma/client"
import { requireAdmin } from "@/lib/auth"
import { ok, fromError } from "@/lib/http"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await requireAdmin()

    const [twk, tiu, tkp, totalResults, passedResults, aggregate] = await Promise.all([
      prisma.question.count({
        where: {
          category: { code: CategoryCode.TWK },
        },
      }),
      prisma.question.count({
        where: {
          category: { code: CategoryCode.TIU },
        },
      }),
      prisma.question.count({
        where: {
          category: { code: CategoryCode.TKP },
        },
      }),
      prisma.result.count(),
      prisma.result.count({
        where: { passed: true },
      }),
      prisma.result.aggregate({
        _avg: {
          totalScore: true,
        },
      }),
    ])

    return ok({
      totalQuestions: twk + tiu + tkp,
      totalResults,
      avgTotalScore: Math.round(aggregate._avg.totalScore ?? 0),
      passRate: totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
      byCategory: {
        TWK: twk,
        TIU: tiu,
        TKP: tkp,
      },
    })
  } catch (error) {
    return fromError(error)
  }
}
