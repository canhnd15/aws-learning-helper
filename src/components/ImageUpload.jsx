import { useState, useRef, useEffect } from 'react'

export default function ImageUpload({ previews = [], onAdd, onRemove }) {
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  const processFiles = (files) => {
    if (!files || files.length === 0) return
    for (const file of files) {
      if (file && file.type.startsWith('image/')) {
        onAdd(file)
      }
    }
  }

  const handleFileChange = (e) => {
    processFiles(e.target.files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFiles(files)
      return
    }

    const html = e.dataTransfer.getData('text/html')
    if (html) {
      const matches = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]
      if (matches.length > 0) {
        matches.forEach((m) => fetchImageAsFile(m[1]))
        return
      }
    }

    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (url && /^https?:\/\/.+/i.test(url)) {
      fetchImageAsFile(url)
    }
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    let consumed = false
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          onAdd(file)
          consumed = true
        }
      }
    }
    if (consumed) {
      e.preventDefault()
      return
    }

    const html = e.clipboardData.getData('text/html')
    if (html) {
      const match = html.match(/<img[^>]+src="([^"]+)"/)
      if (match?.[1]) {
        e.preventDefault()
        fetchImageAsFile(match[1])
      }
    }
  }

  const fetchImageAsFile = async (url) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      if (!blob.type.startsWith('image/')) return
      const ext = blob.type.split('/')[1] || 'png'
      const file = new File([blob], `pasted-image.${ext}`, { type: blob.type })
      onAdd(file)
    } catch {
      // Fetch may fail due to CORS — silently ignore
    }
  }

  useEffect(() => {
    const handler = (e) => handlePaste(e)
    document.addEventListener('paste', handler)
    return () => document.removeEventListener('paste', handler)
  })

  return (
    <div className="image-upload">
      {previews.length > 0 && (
        <div className="image-gallery">
          {previews.map((src, idx) => (
            <div className="image-gallery-item" key={`${src}-${idx}`}>
              <img src={src} alt={`Preview ${idx + 1}`} />
              <button
                type="button"
                className="image-remove"
                onClick={() => onRemove(idx)}
                title="Remove image"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
      <label
        className={`image-dropzone ${dragging ? 'image-dropzone-active' : ''}`}
        htmlFor="image-input"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="image-dropzone-icon">+</span>
        <span>Click, drag & drop, or paste images</span>
        <span className="image-dropzone-hint">PNG, JPG, GIF — multiple allowed</span>
      </label>
      <input
        id="image-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        hidden
      />
    </div>
  )
}
