import { useState } from 'react'
import RichTextEditor from './RichTextEditor'

export default function NoteCard({ note, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const startEdit = (e) => {
    e.stopPropagation()
    setEditTitle(note.title || '')
    setEditContent(note.content || '')
    setEditing(true)
    setExpanded(true)
  }

  const cancelEdit = (e) => {
    e.stopPropagation()
    setEditing(false)
  }

  const saveEdit = async (e) => {
    e.stopPropagation()
    if (!onUpdate) return
    setSaving(true)
    try {
      await onUpdate(note.id, { title: editTitle, content: editContent })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`note-card ${editing ? 'note-card-editing' : ''}`}>
      <div className="note-card-header" onClick={() => { if (!editing) setExpanded(!expanded) }}>
        <div className="note-card-left">
          <span className={`note-card-expand ${expanded ? 'expanded' : ''}`}>&#9654;</span>
          {editing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input note-card-title-input"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="note-card-title">{note.title || 'Untitled Note'}</h3>
          )}
          <div className="note-card-meta">
            {note.section && <span className="badge badge-green">{note.section.name}</span>}
            {note.topic && <span className="badge badge-orange">{note.topic.name}</span>}
          </div>
        </div>
        <div className="note-card-right">
          {note.test && <span className="badge badge-blue">{note.test.name}</span>}
          <span className="note-card-date">
            {new Date(note.created_at).toLocaleDateString()}
          </span>
          {!editing && onUpdate && (
            <button
              className="btn-sm btn-edit"
              onClick={startEdit}
              title="Edit note"
            >
              Edit
            </button>
          )}
          {onDelete && !editing && (
            <button
              className="btn-icon btn-danger"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(note.id)
              }}
              title="Delete note"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {expanded && !editing && (
        <div className="note-card-body">
          <div
            className="note-card-content"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
          {note.image_url && (
            <div className="note-card-image">
              <img src={note.image_url} alt="Note attachment" />
            </div>
          )}
        </div>
      )}

      {editing && (
        <div className="note-card-body" onClick={(e) => e.stopPropagation()}>
          <RichTextEditor
            content={editContent}
            onChange={setEditContent}
          />
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
