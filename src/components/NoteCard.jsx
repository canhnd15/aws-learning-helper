import { useState } from 'react'

export default function NoteCard({ note, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="note-card" onClick={() => setExpanded(!expanded)}>
      <div className="note-card-header">
        <div className="note-card-left">
          <span className={`note-card-expand ${expanded ? 'expanded' : ''}`}>&#9654;</span>
          <h3 className="note-card-title">{note.title || 'Untitled Note'}</h3>
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
          {onDelete && (
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

      {expanded && (
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
    </div>
  )
}
