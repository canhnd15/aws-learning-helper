import { letterFor } from '../lib/reviewOptions'
import AutoTextarea from './AutoTextarea'

// Renders the "Các đáp án" dynamic input list + the "Đáp án đúng" checkboxes.
// `options` is an array of answer texts; `correctAnswers` is an array of letters.
// `onChange` receives the full next state: { options, correctAnswers }.
export default function AnswerOptionsEditor({ options, correctAnswers, onChange }) {
  const setOption = (i, val) => {
    const next = options.map((o, idx) => (idx === i ? val : o))
    onChange({ options: next, correctAnswers })
  }

  const addOption = () => onChange({ options: [...options, ''], correctAnswers })

  const removeOption = (i) => {
    if (options.length <= 1) return
    const next = options.filter((_, idx) => idx !== i)
    // Remap selected letters: drop the removed one, shift later letters down.
    const nextCorrect = correctAnswers
      .map((l) => l.charCodeAt(0) - 65)
      .filter((idx) => idx !== i)
      .map((idx) => (idx > i ? idx - 1 : idx))
      .map((idx) => letterFor(idx))
    onChange({ options: next, correctAnswers: nextCorrect })
  }

  const toggleCorrect = (letter) => {
    const next = correctAnswers.includes(letter)
      ? correctAnswers.filter((l) => l !== letter)
      : [...correctAnswers, letter].sort()
    onChange({ options, correctAnswers: next })
  }

  // Randomly reorder answers, keeping the correct selections on the same texts.
  const shuffleOptions = () => {
    const correctIdx = new Set(correctAnswers.map((l) => l.charCodeAt(0) - 65))
    const items = options.map((opt, i) => ({ opt, correct: correctIdx.has(i) }))
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[items[i], items[j]] = [items[j], items[i]]
    }
    const nextOptions = items.map((it) => it.opt)
    const nextCorrect = items
      .map((it, idx) => (it.correct ? letterFor(idx) : null))
      .filter(Boolean)
      .sort()
    onChange({ options: nextOptions, correctAnswers: nextCorrect })
  }

  const hasAnswers = options.some((o) => o.trim())
  const canShuffle = options.filter((o) => o.trim()).length > 1

  return (
    <>
      <div className="form-group">
        <label>Các đáp án</label>
        <div className="answer-options">
          {options.map((opt, i) => (
            <div className="answer-option-row" key={i}>
              <span className="answer-letter">{letterFor(i)}</span>
              <AutoTextarea
                className="input answer-textarea"
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Đáp án ${letterFor(i)}`}
              />
              {options.length > 1 && (
                <button
                  type="button"
                  className="btn-icon btn-danger"
                  onClick={() => removeOption(i)}
                  title="Remove answer"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="answer-options-actions">
          <button type="button" className="btn btn-secondary btn-add-option" onClick={addOption}>
            + Add answer
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-add-option"
            onClick={shuffleOptions}
            disabled={!canShuffle}
            title="Randomly reorder answers"
          >
            🔀 Shuffle
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Đáp án đúng</label>
        {!hasAnswers ? (
          <p className="review-hint">Nhập đáp án trước để chọn đáp án đúng.</p>
        ) : (
          <div className="correct-answer-checks">
            {options.map((opt, i) =>
              opt.trim() ? (
                <label className="correct-check" key={i}>
                  <input
                    type="checkbox"
                    checked={correctAnswers.includes(letterFor(i))}
                    onChange={() => toggleCorrect(letterFor(i))}
                  />
                  <span className="answer-letter">{letterFor(i)}</span>
                </label>
              ) : null,
            )}
          </div>
        )}
      </div>
    </>
  )
}
