import { useState } from "react";
import toast from "react-hot-toast";
import CreatableDropdown from "../components/CreatableDropdown";
import RichTextEditor from "../components/RichTextEditor";
import ImageUpload from "../components/ImageUpload";
import { useCourseSections, useCourseNotes } from "../hooks/useSupabase";
import { uploadImage } from "../lib/supabase";

export default function CourseNote() {
  const {
    sections,
    loading: sectionsLoading,
    create: createSection,
  } = useCourseSections();
  const { create: createNote } = useCourseNotes();

  const [sectionId, setSectionId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreateSection = async (name) => {
    try {
      const section = await createSection(name);
      setSectionId(section.id);
      toast.success(`Section "${name}" created`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImageSelect = (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a note title");
      return;
    }
    if (!sectionId) {
      toast.error("Please select or create a section");
      return;
    }

    setSubmitting(true);
    try {
      let image_url = null;
      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      await createNote({
        section_id: sectionId,
        title: title.trim(),
        content,
        image_url,
      });
      toast.success("Course note saved!");
      setTitle("");
      setContent("");
      setSectionId(null);
      removeImage();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <form onSubmit={handleSubmit} className="note-form">
        <div className="form-group">
          <label>Section</label>
          <CreatableDropdown
            options={sections}
            value={sectionId}
            onChange={setSectionId}
            onCreate={handleCreateSection}
            placeholder="Select or create a section..."
            isLoading={sectionsLoading}
          />
        </div>

        <div className="form-group">
          <label>Note Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., VPC peering vs Transit Gateway"
            className="input"
          />
        </div>

        <div className="form-group">
          <label>Note Content</label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Write your course notes here..."
          />
        </div>

        <div className="form-group">
          <label>Image (optional)</label>
          <ImageUpload
            imagePreview={imagePreview}
            onImageSelect={handleImageSelect}
            onRemove={removeImage}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save Course Note"}
        </button>
      </form>
    </div>
  );
}
