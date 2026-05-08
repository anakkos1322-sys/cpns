export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function sampleSize<T>(items: T[], size: number): T[] {
  if (items.length < size) {
    throw new Error(`Data tidak cukup untuk mengambil ${size} item.`)
  }
  return shuffleArray(items).slice(0, size)
}
