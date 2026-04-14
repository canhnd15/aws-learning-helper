import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import CreatableDropdown from "../components/CreatableDropdown";
import RichTextEditor from "../components/RichTextEditor";
import { useTopics, useQuickNotes } from "../hooks/useSupabase";
import QuickNoteCard from "../components/QuickNoteCard";
import Select from "react-select";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    background: "#1e293b",
    borderColor: state.isFocused ? "#3b82f6" : "#334155",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    "&:hover": { borderColor: "#3b82f6" },
    minHeight: "38px",
    minWidth: "200px",
  }),
  menu: (base) => ({
    ...base,
    background: "#1e293b",
    border: "1px solid #334155",
    zIndex: 20,
  }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? "#334155" : "transparent",
    color: "#e2e8f0",
    cursor: "pointer",
  }),
  singleValue: (base) => ({ ...base, color: "#e2e8f0" }),
  input: (base) => ({ ...base, color: "#e2e8f0" }),
  placeholder: (base) => ({ ...base, color: "#64748b" }),
};

export default function QuickNotes() {
  const { topics, loading: topicsLoading, create: createTopic } = useTopics();

  // Form state
  const [topicIds, setTopicIds] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [filterTopicId, setFilterTopicId] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    quickNotes,
    loading: notesLoading,
    create: createQuickNote,
    update: updateQuickNote,
    remove: removeQuickNote,
  } = useQuickNotes({
    topicId: filterTopicId,
    search: debouncedSearch,
  });

  const handleCreateTopic = async (name) => {
    try {
      const topic = await createTopic(name);
      setTopicIds((prev) => [...prev, topic.id]);
      toast.success(`Topic "${name}" created`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (topicIds.length === 0) {
      toast.error("Please select or create at least one topic");
      return;
    }

    setSubmitting(true);
    try {
      await createQuickNote({
        topic_ids: topicIds,
        title: title.trim(),
        content,
      });
      toast.success("Quick note saved!");
      setTitle("");
      setContent("");
      setTopicIds([]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this quick note?")) return;
      try {
        await removeQuickNote(id);
        toast.success("Quick note deleted");
      } catch (err) {
        toast.error(err.message);
      }
    },
    [removeQuickNote],
  );

  const handleUpdate = useCallback(
    async (id, updates) => {
      try {
        await updateQuickNote(id, updates);
        toast.success("Quick note updated");
      } catch (err) {
        toast.error(err.message);
      }
    },
    [updateQuickNote],
  );

  // Dropdown options for topic filter
  const { quickNotes: allQuickNotes } = useQuickNotes();
  const topicCounts = {};
  for (const note of allQuickNotes) {
    for (const t of note.topics || []) {
      topicCounts[t.id] = (topicCounts[t.id] || 0) + 1;
    }
  }

  const filterOptions = [
    { value: null, label: `All (${allQuickNotes.length})` },
    ...topics.map((t) => ({
      value: t.id,
      label: `${t.name} (${topicCounts[t.id] || 0})`,
    })),
  ];

  const selectedFilterOption =
    filterOptions.find((o) => o.value === filterTopicId) || filterOptions[0];

  return (
    <div className="page">
      <h1>Quick Notes</h1>
      <p className="page-description">
        Jot down quick notes that don't belong to any test or section.
      </p>

      <form onSubmit={handleSubmit} className="note-form quick-note-form">
        <div className="form-group">
          <label>Topics</label>
          <CreatableDropdown
            options={topics}
            value={topicIds}
            onChange={setTopicIds}
            onCreate={handleCreateTopic}
            placeholder="Select or create topics..."
            isLoading={topicsLoading}
            isMulti
          />
        </div>

        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Remember: S3 lifecycle rules"
            className="input"
          />
        </div>

        <div className="form-group">
          <label>Content</label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Write your quick note here..."
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save Quick Note"}
        </button>
      </form>

      <div className="quick-notes-divider" />

      <div className="quick-notes-browse">
        <h2>Your Quick Notes</h2>
        <div className="pool-controls">
          <Select
            options={filterOptions}
            value={selectedFilterOption}
            onChange={(opt) => { setFilterTopicId(opt ? opt.value : null); setPage(1); }}
            isSearchable
            placeholder="Filter by topic..."
            styles={selectStyles}
          />
          <div className="pool-search-inline">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search quick notes..."
              className="input"
            />
          </div>
        </div>

        <div className="pool-notes-area">
          {notesLoading ? (
            <div className="loading">Loading quick notes...</div>
          ) : quickNotes.length === 0 ? (
            <div className="empty-state">
              <p>No quick notes found.</p>
              <p>Create one above to get started.</p>
            </div>
          ) : (
            <>
              <div className="notes-list">
                {quickNotes
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((note) => (
                    <QuickNoteCard
                      key={note.id}
                      note={note}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  ))}
              </div>
              {quickNotes.length > pageSize && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <div className="pagination-pages">
                    {Array.from(
                      { length: Math.ceil(quickNotes.length / pageSize) },
                      (_, i) => i + 1,
                    ).map((p) => (
                      <button
                        key={p}
                        className={`pagination-page ${p === page ? "active" : ""}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    className="pagination-btn"
                    disabled={page >= Math.ceil(quickNotes.length / pageSize)}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                  <span className="pagination-info">
                    {(page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, quickNotes.length)} of{" "}
                    {quickNotes.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
