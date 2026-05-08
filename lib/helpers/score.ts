import { PASSING_GRADES } from "@/lib/constants"

export interface ScoreBreakdown {
  TWK: number
  TIU: number
  TKP: number
  total: number
  passed: boolean
}

export function evaluateScores(scores: Omit<ScoreBreakdown, "total" | "passed">): ScoreBreakdown {
  const total = scores.TWK + scores.TIU + scores.TKP
  const passed =
    scores.TWK >= PASSING_GRADES.TWK &&
    scores.TIU >= PASSING_GRADES.TIU &&
    scores.TKP >= PASSING_GRADES.TKP

  return {
    ...scores,
    total,
    passed,
  }
}
