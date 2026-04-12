import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import CreatableDropdown from '../components/CreatableDropdown'
import RichTextEditor from '../components/RichTextEditor'
import { useSections, useTopics, useTests, useNotes } from '../hooks/useSupabase'
import { uploadImage } from '../lib/supabase'

export default function CreateNote() {
  const { sections, loading: sectionsLoading, create: createSection } = useSections()
  const { topics, loading: topicsLoading, create: createTopic } = useTopics()
  const { tests, loading: testsLoading, create: createTest } = useTests()
  const { create: createNote } = useNotes()

  const [testId, setTestId] = useState(null)
  const [sectionId, setSectionId] = useState(null)
  const [topicId, setTopicId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const handleCreateTest = async (name) => {
    try {
      const test = await createTest(name)
      setTestId(test.id)
      toast.success(`Test "${name}" created`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleCreateSection = async (name) => {
    try {
      const section = await createSection(name)
      setSectionId(section.id)
      toast.success(`Section "${name}" created`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleCreateTopic = async (name) => {
    try {
      const topic = await createTopic(name)
      setTopicId(topic.id)
      toast.success(`Topic "${name}" created`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please enter a note title')
      return
    }
    if (!testId) {
      toast.error('Please select or create a test')
      return
    }
    if (!sectionId) {
      toast.error('Please select or create a section')
      return
    }
    if (!topicId) {
      toast.error('Please select or create a topic')
      return
    }

    setSubmitting(true)
    try {
      let image_url = null
      if (imageFile) {
        image_url = await uploadImage(imageFile)
      }

      await createNote({
        test_id: testId,
        section_id: sectionId,
        topic_id: topicId,
        title: title.trim(),
        content,
        image_url,
      })
      toast.success('Note saved!')
      setTitle('')
      setContent('')
      setTestId(null)
      setSectionId(null)
      setTopicId(null)
      removeImage()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h1>Create Note</h1>
      <p className="page-description">
        Record a question you got wrong or misunderstood during your practice test.
      </p>

      <form onSubmit={handleSubmit} className="note-form">
        <div className="form-group">
          <label>Test Name</label>
          <CreatableDropdown
            options={tests}
            value={testId}
            onChange={setTestId}
            onCreate={handleCreateTest}
            placeholder="Select or create a test..."
            isLoading={testsLoading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Section</label>
            <CreatableDropdown
              options={sections}
              value={sectionId}
              onChange={setSectionId}
              onCreate={handleCreateSection}
              placeholder="Select a section..."
              isLoading={sectionsLoading}
            />
          </div>

          <div className="form-group">
            <label>Topic</label>
            <CreatableDropdown
              options={topics}
              value={topicId}
              onChange={setTopicId}
              onCreate={handleCreateTopic}
              placeholder="Select a topic..."
              isLoading={topicsLoading}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Note Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., S3 bucket policy vs ACL confusion"
            className="input"
          />
        </div>

        <div className="form-group">
          <label>Note Content</label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Write your notes here... Use the toolbar to bold, underline, or highlight key points."
          />
        </div>

        <div className="form-group">
          <label>Image (optional)</label>
          <div className="image-upload">
            {imagePreview ? (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  className="image-remove"
                  onClick={removeImage}
                  title="Remove image"
                >
                  &times;
                </button>
              </div>
            ) : (
              <label className="image-dropzone" htmlFor="image-input">
                <span className="image-dropzone-icon">+</span>
                <span>Click to upload an image</span>
                <span className="image-dropzone-hint">PNG, JPG, GIF up to 5MB</span>
              </label>
            )}
            <input
              id="image-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Note'}
        </button>
      </form>
    </div>
  )
}
