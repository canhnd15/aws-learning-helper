// Helpers for working with review-question answer options.
// Storage: `options` is newline-joined answer texts (letters A,B,C.. derived by
// index); `correct_answer` is comma-joined letters, e.g. "A, C".

export const letterFor = (i) => String.fromCharCode(65 + i)

export const parseOptions = (text) =>
  text ? text.split('\n').map((s) => s.trim()).filter(Boolean) : []

export const parseCorrect = (text) =>
  text ? text.split(',').map((s) => s.trim()).filter(Boolean) : []

export const serializeOptions = (arr) => arr.join('\n')

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
