import { useState } from "react";
import toast from "react-hot-toast";
import CreatableDropdown from "../components/CreatableDropdown";
import RichTextEditor from "../components/RichTextEditor";
import ImageUpload from "../components/ImageUpload";
import {
  useSections,
  useTopics,
  useTests,
  useNotes,
} from "../hooks/useSupabase";
import { uploadImage } from "../lib/supabase";

export default function CreateNote() {
  const {
    sections,
    loading: sectionsLoading,
    create: createSection,
  } = useSections();
  const { topics, loading: topicsLoading, create: createTopic } = useTopics();
  const { tests, loading: testsLoading, create: createTest } = useTests();
  const { create: createNote } = useNotes();

  const [testId, setTestId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [topicIds, setTopicIds] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleCreateTest = async (name) => {
    try {
      const test = await createTest(name);
      setTestId(test.id);
      toast.success(`Test "${name}" created`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreateSection = async (name) => {
    try {
      const section = await createSection(name);
      setSectionId(section.id);
      toast.success(`Section "${name}" created`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreateTopic = async (name) => {
    try {
      const topic = await createTopic(name);
      setTopicIds((prev) => [...prev, topic.id]);
      toast.success(`Topic "${name}" created`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImageAdd = (file) => {
    setImages((prev) => [...prev, { file, preview: URL.createObjectURL(file) }]);
  };

  const handleImageRemove = (index) => {
    setImages((prev) => {
      const target = prev[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearImages = () => {
    setImages((prev) => {
      prev.forEach((img) => img.preview && URL.revokeObjectURL(img.preview));
      return [];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a note title");
      return;
    }
    if (!testId) {
      toast.error("Please select or create a test");
      return;
    }
    if (!sectionId) {
      toast.error("Please select or create a section");
      return;
    }
    if (topicIds.length === 0) {
      toast.error("Please select or create at least one topic");
      return;
    }

    setSubmitting(true);
    try {
      const image_urls = await Promise.all(
        images.map((img) => uploadImage(img.file)),
      );

      await createNote({
        test_id: testId,
        section_id: sectionId,
        topic_ids: topicIds,
        title: title.trim(),
        content,
        image_urls,
      });
      toast.success("Note saved!");
      setTitle("");
      setContent("");
      setTestId(null);
      setSectionId(null);
      setTopicIds([]);
      clearImages();
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
            <label>Topics</label>
            <CreatableDropdown
              options={topics}
              value={topicIds}
              onChange={setTopicIds}
              onCreate={handleCreateTopic}
              placeholder="Select topics..."
              isLoading={topicsLoading}
              isMulti
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
          <label>Images (optional)</label>
          <ImageUpload
            previews={images.map((img) => img.preview)}
            onAdd={handleImageAdd}
            onRemove={handleImageRemove}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save Note"}
        </button>
      </form>
    </div>
  );
}
