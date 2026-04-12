import { useState, useEffect, useCallback } from "react";
import {
  useSections,
  useTopics,
  useTests,
  useNotes,
} from "../hooks/useSupabase";
import NoteCard from "../components/NoteCard";
import toast from "react-hot-toast";

export default function Pools() {
  const { sections, loading: sectionsLoading } = useSections();
  const { topics, loading: topicsLoading } = useTopics();
  const { tests, loading: testsLoading } = useTests();

  const [poolType, setPoolType] = useState("section");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
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
  const sidebarTitle =
    poolType === "section"
      ? "Sections"
      : poolType === "topic"
        ? "Topics"
        : "Tests";

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

  // Count notes per pool item
  const [counts, setCounts] = useState({});
  const { notes: allNotes } = useNotes();

  useEffect(() => {
    if (!allNotes.length) {
      setCounts({});
      return;
    }
    const map = {};
    for (const note of allNotes) {
      if (poolType === "topic") {
        // A note can belong to multiple topics
        for (const t of note.topics || []) {
          map[t.id] = (map[t.id] || 0) + 1;
        }
      } else {
        const key = poolType === "section" ? note.section_id : note.test_id;
        if (key) map[key] = (map[key] || 0) + 1;
      }
    }
    setCounts(map);
  }, [allNotes, poolType]);

  const switchPool = (type) => {
    setPoolType(type);
    setSelectedId(null);
    setSearch("");
  };

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
      </div>

      <div
        className={`pool-layout ${sidebarOpen ? "" : "pool-layout-collapsed"}`}
      >
        <aside
          className={`pool-sidebar ${sidebarOpen ? "" : "pool-sidebar-collapsed"}`}
        >
          <div className="pool-sidebar-header">
            <h3>{sidebarTitle}</h3>
            <button
              className="pool-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Collapse filters" : "Expand filters"}
            >
              {sidebarOpen ? "\u00AB" : "\u00BB"}
            </button>
          </div>
          {sidebarOpen &&
            (itemsLoading ? (
              <div className="loading">Loading...</div>
            ) : (
              <ul className="pool-list">
                <li>
                  <button
                    className={`pool-item ${!selectedId ? "active" : ""}`}
                    onClick={() => setSelectedId(null)}
                  >
                    All
                    <span className="pool-count">{allNotes.length}</span>
                  </button>
                </li>
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      className={`pool-item ${selectedId === item.id ? "active" : ""}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      {item.name}
                      <span className="pool-count">{counts[item.id] || 0}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ))}
        </aside>

        <main className="pool-main">
          <div className="pool-search">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="input"
            />
          </div>

          {notesLoading ? (
            <div className="loading">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <p>No notes found.</p>
              {selectedId && (
                <p>Try selecting a different pool or clearing your search.</p>
              )}
            </div>
          ) : (
            <div className="notes-list">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
