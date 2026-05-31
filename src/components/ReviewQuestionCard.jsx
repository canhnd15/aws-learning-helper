import { useState } from 'react'
import RichTextEditor from './RichTextEditor'
import { WRONG_REASONS } from '../lib/reviewReasons'

export default function ReviewQuestionCard({ question, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(null)

  const startEdit = (e) => {
    e.stopPropagation()
    setDraft({
      test_number: question.test_number || 1,
      question: question.question || '',
      why_chose: question.why_chose || '',
      options: question.options || '',
      correct_answer: question.correct_answer || '',
      wrong_reasons: question.wrong_reasons || [],
      knowledge: question.knowledge || '',
    })
    setEditing(true)
    setExpanded(true)
  }

  const cancelEdit = (e) => {
    e.stopPropagation()
    setEditing(false)
    setDraft(null)
  }

  const saveEdit = async (e) => {
    e.stopPropagation()
    if (!onUpdate) return
    setSaving(true)
    try {
      await onUpdate(question.id, draft)
      setEditing(false)
      setDraft(null)
    } finally {
      setSaving(false)
    }
  }

  const toggleReason = (reason) => {
    setDraft((d) => ({
      ...d,
      wrong_reasons: d.wrong_reasons.includes(reason)
        ? d.wrong_reasons.filter((r) => r !== reason)
        : [...d.wrong_reasons, reason],
    }))
  }

  // Plain-text preview of the question for the collapsed header
  const preview = (question.question || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return (
    <div className={`note-card ${editing ? 'note-card-editing' : ''}`}>
      <div className="note-card-header" onClick={() => { if (!editing) setExpanded(!expanded) }}>
        <div className="note-card-left">
          <span className={`note-card-expand ${expanded ? 'expanded' : ''}`}>&#9654;</span>
          <h3 className="note-card-title">{preview || 'Untitled Question'}</h3>
          <div className="note-card-meta">
            {question.correct_answer && (
              <span className="badge badge-green">Đáp án: {question.correct_answer}</span>
            )}
          </div>
        </div>
        <div className="note-card-right">
          <span className="badge badge-blue">Đề {question.test_number}</span>
          <span className="note-card-date">
            {new Date(question.created_at).toLocaleDateString()}
          </span>
          {!editing && onUpdate && (
            <button className="btn-sm btn-edit" onClick={startEdit} title="Edit question">
              Edit
            </button>
          )}
          {onDelete && !editing && (
            <button
              className="btn-icon btn-danger"
              onClick={(e) => { e.stopPropagation(); onDelete(question.id) }}
              title="Delete question"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {expanded && !editing && (
        <div className="note-card-body review-body">
          {question.question && (
            <div className="review-field">
              <span className="review-label">Question</span>
              <div className="note-card-content" dangerouslySetInnerHTML={{ __html: question.question }} />
            </div>
          )}
          {question.options && (
            <div className="review-field">
              <span className="review-label">Các đáp án</span>
              <pre className="review-options">{question.options}</pre>
            </div>
          )}
          {question.why_chose && (
            <div className="review-field">
              <span className="review-label">Tại sao tôi chọn đáp án này?</span>
              <p className="review-text">{question.why_chose}</p>
            </div>
          )}
          {question.correct_answer && (
            <div className="review-field">
              <span className="review-label">Đáp án đúng</span>
              <p className="review-text review-correct">{question.correct_answer}</p>
            </div>
          )}
          {question.wrong_reasons?.length > 0 && (
            <div className="review-field">
              <span className="review-label">Tôi sai vì</span>
              <div className="note-card-meta">
                {question.wrong_reasons.map((r) => (
                  <span key={r} className="badge badge-orange">{r}</span>
                ))}
              </div>
            </div>
          )}
          {question.knowledge && (
            <div className="review-field">
              <span className="review-label">Kiến thức cần nhớ</span>
              <div className="note-card-content" dangerouslySetInnerHTML={{ __html: question.knowledge }} />
            </div>
          )}
        </div>
      )}

      {editing && draft && (
        <div className="note-card-body review-body" onClick={(e) => e.stopPropagation()}>
          <div className="form-group">
            <label>Đề số</label>
            <select
              className="input"
              value={draft.test_number}
              onChange={(e) => setDraft({ ...draft, test_number: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>Đề {n}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Question</label>
            <RichTextEditor
              content={draft.question}
              onChange={(v) => setDraft({ ...draft, question: v })}
            />
          </div>
          <div className="form-group">
            <label>Các đáp án (A. B. C. ...)</label>
            <textarea
              className="input"
              rows={4}
              value={draft.options}
              onChange={(e) => setDraft({ ...draft, options: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Tại sao tôi chọn đáp án này?</label>
            <textarea
              className="input"
              rows={3}
              value={draft.why_chose}
              onChange={(e) => setDraft({ ...draft, why_chose: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Đáp án đúng</label>
            <input
              type="text"
              className="input"
              value={draft.correct_answer}
              onChange={(e) => setDraft({ ...draft, correct_answer: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Tôi sai vì</label>
            <div className="reason-chips">
              {WRONG_REASONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  className={`reason-chip ${draft.wrong_reasons.includes(r) ? 'active' : ''}`}
                  onClick={() => toggleReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Kiến thức cần nhớ</label>
            <RichTextEditor
              content={draft.knowledge}
              onChange={(v) => setDraft({ ...draft, knowledge: v })}
            />
          </div>
          <div className="note-card-edit-actions">
            <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
