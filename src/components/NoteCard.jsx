import { useState } from 'react'
import RichTextEditor from './RichTextEditor'
import ImageUpload from './ImageUpload'
import { uploadImage } from '../lib/supabase'

export default function NoteCard({ note, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editImages, setEditImages] = useState([])
  const [saving, setSaving] = useState(false)

  const startEdit = (e) => {
    e.stopPropagation()
    setEditTitle(note.title || '')
    setEditContent(note.content || '')
    setEditImages(
      (note.image_urls || []).map((url) => ({ url, isExisting: true })),
    )
    setEditing(true)
    setExpanded(true)
  }

  const cancelEdit = (e) => {
    e.stopPropagation()
    editImages.forEach((img) => {
      if (!img.isExisting && img.preview) URL.revokeObjectURL(img.preview)
    })
    setEditImages([])
    setEditing(false)
  }

  const handleEditImageAdd = (file) => {
    setEditImages((prev) => [
      ...prev,
      { file, preview: URL.createObjectURL(file), isExisting: false },
    ])
  }

  const handleEditImageRemove = (index) => {
    setEditImages((prev) => {
      const target = prev[index]
      if (target && !target.isExisting && target.preview) {
        URL.revokeObjectURL(target.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const saveEdit = async (e) => {
    e.stopPropagation()
    if (!onUpdate) return
    setSaving(true)
    try {
      const image_urls = await Promise.all(
        editImages.map((img) =>
          img.isExisting ? Promise.resolve(img.url) : uploadImage(img.file),
        ),
      )
      await onUpdate(note.id, {
        title: editTitle,
        content: editContent,
        image_urls,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const images = note.image_urls || []

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
            {note.topics?.map((t) => (
              <span key={t.id} className="badge badge-orange">{t.name}</span>
            ))}
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
          {images.length > 0 && (
            <div className="note-card-images">
              {images.map((url, idx) => (
                <a
                  key={`${url}-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="note-card-image"
                >
                  <img src={url} alt={`Note attachment ${idx + 1}`} />
                </a>
              ))}
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
          <div className="note-card-edit-images">
            <ImageUpload
              previews={editImages.map((img) => (img.isExisting ? img.url : img.preview))}
              onAdd={handleEditImageAdd}
              onRemove={handleEditImageRemove}
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
