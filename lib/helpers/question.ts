export function sanitizeQuestionBody(body: string) {
  return body
    .replace(/\s*\[(?:kode\s+latihan)\s*\d+\]\s*$/i, "")
    .replace(/\s*\((?:skenario|scenario)\s*\d+\/?\)\s*$/i, "")
    .replace(/\s*(?:skenario|scenario)\s*\d+\/?\s*$/i, "")
    .trim()
}
