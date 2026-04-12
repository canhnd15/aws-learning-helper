import { useState, useEffect, useCallback } from "react";
import {
  useSections,
  useTopics,
  useTests,
  useNotes,
} from "../hooks/useSupabase";
import Select from "react-select";
import NoteCard from "../components/NoteCard";
import toast from "react-hot-toast";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    background: "#1e293b",
    borderColor: state.isFocused ? "#3b82f6" : "#334155",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    "&:hover": { borderColor: "#3b82f6" },
    minHeight: "38px",
    minWidth: "240px",
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

export default function Pools() {
  const { sections, loading: sectionsLoading } = useSections();
  const { topics, loading: topicsLoading } = useTopics();
  const { tests, loading: testsLoading } = useTests();

  const [poolType, setPoolType] = useState("section");
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filterParams = (() => {
    const base = { search: debouncedSearch };
    if (poolType === "section") return { ...base, sectionId: selectedId };
    if (poolType === "topic") return { ...base, topicId: selectedId };
    return { ...base, testId: selectedId };
  })();

  const {
    notes,
    loading: notesLoading,
    remove,
    update,
  } = useNotes(selectedId ? filterParams : { search: debouncedSearch });

  const items =
    poolType === "section" ? sections : poolType === "topic" ? topics : tests;
  const itemsLoading =
    poolType === "section"
      ? sectionsLoading
      : poolType === "topic"
        ? topicsLoading
        : testsLoading;

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this note?")) return;
      try {
        await remove(id);
        toast.success("Note deleted");
      } catch (err) {
        toast.error(err.message);
      }
    },
    [remove],
  );

  const handleUpdate = useCallback(
    async (id, updates) => {
      try {
        await update(id, updates);
        toast.success("Note updated");
      } catch (err) {
        toast.error(err.message);
      }
    },
    [update],
  );

  const { notes: allNotes } = useNotes();

  const switchPool = (type) => {
    setPoolType(type);
    setSelectedId(null);
    setSearch("");
    setPage(1);
  };

  // Build dropdown options with note counts
  const counts = {};
  for (const note of allNotes) {
    if (poolType === "topic") {
      for (const t of note.topics || []) {
        counts[t.id] = (counts[t.id] || 0) + 1;
      }
    } else {
      const key = poolType === "section" ? note.section_id : note.test_id;
      if (key) counts[key] = (counts[key] || 0) + 1;
    }
  }

  const dropdownOptions = [
    { value: null, label: `All (${allNotes.length})` },
    ...items.map((item) => ({
      value: item.id,
      label: `${item.name} (${counts[item.id] || 0})`,
    })),
  ];

  const selectedOption =
    dropdownOptions.find((o) => o.value === selectedId) || dropdownOptions[0];

  return (
    <div className="page">
      <h1>Knowledge Pools</h1>
      <p className="page-description">
        Browse and search your notes by section, topic, or test.
      </p>

      <div className="pool-controls">
        <div className="pool-tabs">
          <button
            className={`tab ${poolType === "section" ? "active" : ""}`}
            onClick={() => switchPool("section")}
          >
            By Section
          </button>
          <button
            className={`tab ${poolType === "topic" ? "active" : ""}`}
            onClick={() => switchPool("topic")}
          >
            By Topic
          </button>
          <button
            className={`tab ${poolType === "test" ? "active" : ""}`}
            onClick={() => switchPool("test")}
          >
            By Test
          </button>
        </div>

        <Select
          options={dropdownOptions}
          value={selectedOption}
          onChange={(opt) => { setSelectedId(opt ? opt.value : null); setPage(1); }}
          isLoading={itemsLoading}
          isSearchable
          placeholder="Filter..."
          styles={selectStyles}
        />

        <div className="pool-search-inline">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search notes..."
            className="input"
          />
        </div>
      </div>

      <div className="pool-notes-area">
        {notesLoading ? (
          <div className="loading">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <p>No notes found.</p>
            {selectedId && (
              <p>Try selecting a different filter or clearing your search.</p>
            )}
          </div>
        ) : (
          <>
            <div className="notes-list">
              {notes.slice((page - 1) * pageSize, page * pageSize).map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
            {notes.length > pageSize && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: Math.ceil(notes.length / pageSize) }, (_, i) => i + 1).map((p) => (
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
                  disabled={page >= Math.ceil(notes.length / pageSize)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
                <span className="pagination-info">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, notes.length)} of {notes.length}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
