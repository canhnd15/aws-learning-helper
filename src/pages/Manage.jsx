import { useState } from 'react'
import toast from 'react-hot-toast'
import { useSections, useTopics, useTests, useNotes, useQuickNotes } from '../hooks/useSupabase'

function ManageTable({ title, items, loading, onCreate, onUpdate, onDelete, columns }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await onCreate(newName.trim())
      setNewName('')
      toast.success(`${title.slice(0, -1)} created`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditValue(item.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const saveEdit = async (id) => {
    if (!editValue.trim()) return
    try {
      await onUpdate(id, editValue.trim())
      setEditingId(null)
      setEditValue('')
      toast.success('Updated')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This may affect related notes.`)) return
    try {
      await onDelete(id)
      toast.success('Deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="manage-section">
      <h2 className="manage-section-title">{title}</h2>
      <form onSubmit={handleCreate} className="manage-add-form">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`Add new ${title.slice(0, -1).toLowerCase()}...`}
          className="input"
        />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : items.length === 0 ? (
        <div className="manage-empty">No {title.toLowerCase()} yet.</div>
      ) : (
        <table className="manage-table">
          <thead>
            <tr>
              <th>Name</th>
              {columns?.map((col) => <th key={col.key}>{col.label}</th>)}
              <th className="manage-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="input manage-edit-input"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(item.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                    />
                  ) : (
                    item.name
                  )}
                </td>
                {columns?.map((col) => <td key={col.key}>{col.render(item)}</td>)}
                <td className="manage-actions">
                  {editingId === item.id ? (
                    <>
                      <button className="btn-sm btn-save" onClick={() => saveEdit(item.id)}>Save</button>
                      <button className="btn-sm btn-cancel" onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-sm btn-edit" onClick={() => startEdit(item)}>Edit</button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(item.id, item.name)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ManageQuickNotes() {
  const { quickNotes, loading, remove } = useQuickNotes()

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete quick note "${title}"?`)) return
    try {
      await remove(id)
      toast.success('Quick note deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="manage-section">
      <h2 className="manage-section-title">Quick Notes</h2>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : quickNotes.length === 0 ? (
        <div className="manage-empty">No quick notes yet.</div>
      ) : (
        <table className="manage-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Topics</th>
              <th>Created</th>
              <th className="manage-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quickNotes.map((note) => (
              <tr key={note.id}>
                <td className="manage-title-cell">{note.title || 'Untitled'}</td>
                <td>{note.topics?.length > 0 ? note.topics.map((t) => <span key={t.id} className="badge badge-orange" style={{ marginRight: 4 }}>{t.name}</span>) : '—'}</td>
                <td className="manage-date">{new Date(note.created_at).toLocaleDateString()}</td>
                <td className="manage-actions">
                  <button className="btn-sm btn-delete" onClick={() => handleDelete(note.id, note.title)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ManageNotes() {
  const { notes, loading, remove } = useNotes()

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete note "${title}"?`)) return
    try {
      await remove(id)
      toast.success('Note deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="manage-section">
      <h2 className="manage-section-title">Notes</h2>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : notes.length === 0 ? (
        <div className="manage-empty">No notes yet.</div>
      ) : (
        <table className="manage-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Test</th>
              <th>Section</th>
              <th>Topic</th>
              <th>Created</th>
              <th className="manage-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id}>
                <td className="manage-title-cell">{note.title || 'Untitled'}</td>
                <td><span className="badge badge-blue">{note.test?.name || '—'}</span></td>
                <td><span className="badge badge-green">{note.section?.name || '—'}</span></td>
                <td>{note.topics?.length > 0 ? note.topics.map((t) => <span key={t.id} className="badge badge-orange" style={{ marginRight: 4 }}>{t.name}</span>) : '—'}</td>
                <td className="manage-date">{new Date(note.created_at).toLocaleDateString()}</td>
                <td className="manage-actions">
                  <button className="btn-sm btn-delete" onClick={() => handleDelete(note.id, note.title)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function Manage() {
  const [activeTab, setActiveTab] = useState('tests')
  const { tests, loading: testsLoading, create: createTest, update: updateTest, remove: removeTest } = useTests()
  const { sections, loading: sectionsLoading, create: createSection, update: updateSection, remove: removeSection } = useSections()
  const { topics, loading: topicsLoading, create: createTopic, update: updateTopic, remove: removeTopic } = useTopics()

  return (
    <div className="page">
      <h1>Manage</h1>
      <p className="page-description">
        Create, edit, and delete tests, sections, topics, and notes.
      </p>

      <div className="pool-controls">
        <div className="pool-tabs">
          <button className={`tab ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>Tests</button>
          <button className={`tab ${activeTab === 'sections' ? 'active' : ''}`} onClick={() => setActiveTab('sections')}>Sections</button>
          <button className={`tab ${activeTab === 'topics' ? 'active' : ''}`} onClick={() => setActiveTab('topics')}>Topics</button>
          <button className={`tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
          <button className={`tab ${activeTab === 'quickNotes' ? 'active' : ''}`} onClick={() => setActiveTab('quickNotes')}>Quick Notes</button>
        </div>
      </div>

      {activeTab === 'tests' && (
        <ManageTable
          title="Tests"
          items={tests}
          loading={testsLoading}
          onCreate={createTest}
          onUpdate={updateTest}
          onDelete={removeTest}
          columns={[
            { key: 'created', label: 'Created', render: (item) => new Date(item.created_at).toLocaleDateString() }
          ]}
        />
      )}

      {activeTab === 'sections' && (
        <ManageTable
          title="Sections"
          items={sections}
          loading={sectionsLoading}
          onCreate={createSection}
          onUpdate={updateSection}
          onDelete={removeSection}
        />
      )}

      {activeTab === 'topics' && (
        <ManageTable
          title="Topics"
          items={topics}
          loading={topicsLoading}
          onCreate={createTopic}
          onUpdate={updateTopic}
          onDelete={removeTopic}
        />
      )}

      {activeTab === 'notes' && <ManageNotes />}

      {activeTab === 'quickNotes' && <ManageQuickNotes />}
    </div>
  )
}
