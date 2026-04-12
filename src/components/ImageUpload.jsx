import { useState, useRef, useEffect } from 'react'

export default function ImageUpload({ imagePreview, onImageSelect, onRemove }) {
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)
  const dropzoneRef = useRef(null)

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    onImageSelect(file)
  }

  const handleFileChange = (e) => {
    processFile(e.target.files?.[0])
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

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
      return
    }

    // Handle image dragged from a webpage (as HTML with <img> src)
    const html = e.dataTransfer.getData('text/html')
    if (html) {
      const match = html.match(/<img[^>]+src="([^"]+)"/)
      if (match?.[1]) {
        fetchImageAsFile(match[1])
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

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        processFile(item.getAsFile())
        return
      }
    }

    // Check for pasted HTML with image URL
    const html = e.clipboardData.getData('text/html')
    if (html) {
      const match = html.match(/<img[^>]+src="([^"]+)"/)
      if (match?.[1]) {
        e.preventDefault()
        fetchImageAsFile(match[1])
        return
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
      processFile(file)
    } catch {
      // Fetch might fail due to CORS — silently ignore
    }
  }

  // Listen for paste events on the document when dropzone is visible
  useEffect(() => {
    if (imagePreview) return
    const handler = (e) => handlePaste(e)
    document.addEventListener('paste', handler)
    return () => document.removeEventListener('paste', handler)
  })

  const handleRemove = () => {
    if (fileInputRef.current) fileInputRef.current.value = ''
    onRemove()
  }

  return (
    <div className="image-upload">
      {imagePreview ? (
        <div className="image-preview">
          <img src={imagePreview} alt="Preview" />
          <button
            type="button"
            className="image-remove"
            onClick={handleRemove}
            title="Remove image"
          >
            &times;
          </button>
        </div>
      ) : (
        <label
          ref={dropzoneRef}
          className={`image-dropzone ${dragging ? 'image-dropzone-active' : ''}`}
          htmlFor="image-input"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span className="image-dropzone-icon">+</span>
          <span>Click, drag & drop, or paste an image</span>
          <span className="image-dropzone-hint">PNG, JPG, GIF up to 5MB</span>
        </label>
      )}
      <input
        id="image-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        hidden
      />
    </div>
  )
}
