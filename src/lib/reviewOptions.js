// Helpers for working with review-question answer options.
// Storage: `options` is a JSON array of answer texts (letters A,B,C.. derived
// by index); each answer may contain its own line breaks. `correct_answer` is
// comma-joined letters, e.g. "A, C".

export const letterFor = (i) => String.fromCharCode(65 + i)

export const parseOptions = (text) => {
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      return parsed.map((s) => String(s).trim()).filter(Boolean)
    }
  } catch {
    // Legacy format: newline-joined answer texts.
  }
  return text.split('\n').map((s) => s.trim()).filter(Boolean)
}

export const parseCorrect = (text) =>
  text ? text.split(',').map((s) => s.trim()).filter(Boolean) : []

export const serializeOptions = (arr) => JSON.stringify(arr)

export const serializeCorrect = (arr) => arr.join(', ')

// Drop empty option rows and remap the selected correct letters to the new
// (compacted) indices so letters stay aligned with their answers.
export function normalizeAnswers(options, correctAnswers) {
  const kept = []
  const cleaned = []
  options.forEach((opt, i) => {
    if (opt.trim()) {
      cleaned.push(opt.trim())
      kept.push(i)
    }
  })

  const correctLetters = correctAnswers
    .map((l) => l.charCodeAt(0) - 65)
    .map((oldIdx) => kept.indexOf(oldIdx))
    .filter((newIdx) => newIdx !== -1)
    .map((newIdx) => letterFor(newIdx))

  return { options: cleaned, correctAnswers: correctLetters }
}
