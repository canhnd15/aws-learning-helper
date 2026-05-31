import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import RichTextEditor from "../components/RichTextEditor";
import { useReviewQuestions } from "../hooks/useSupabase";
import ReviewQuestionCard from "../components/ReviewQuestionCard";
import { WRONG_REASONS } from "../lib/reviewReasons";
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

const TEST_NUMBERS = [1, 2, 3, 4, 5, 6];

const emptyForm = {
  test_number: 1,
  question: "",
  why_chose: "",
  options: "",
  correct_answer: "",
  wrong_reasons: [],
  knowledge: "",
};

export default function ReviewQuestions() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [filterTest, setFilterTest] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    questions,
    loading,
    create: createQuestion,
    update: updateQuestion,
    remove: removeQuestion,
  } = useReviewQuestions({
    testNumber: filterTest,
    search: debouncedSearch,
  });

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleReason = (reason) =>
    setForm((f) => ({
      ...f,
      wrong_reasons: f.wrong_reasons.includes(reason)
        ? f.wrong_reasons.filter((r) => r !== reason)
        : [...f.wrong_reasons, reason],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.question.trim()) {
      toast.error("Please enter the question");
      return;
    }

    setSubmitting(true);
    try {
      await createQuestion({
        test_number: form.test_number,
        question: form.question,
        why_chose: form.why_chose.trim(),
        options: form.options.trim(),
        correct_answer: form.correct_answer.trim(),
        wrong_reasons: form.wrong_reasons,
        knowledge: form.knowledge,
      });
      toast.success("Review question saved!");
      setForm({ ...emptyForm, test_number: form.test_number });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this review question?")) return;
      try {
        await removeQuestion(id);
        toast.success("Review question deleted");
      } catch (err) {
        toast.error(err.message);
      }
    },
    [removeQuestion],
  );

  const handleUpdate = useCallback(
    async (id, updates) => {
      try {
        await updateQuestion(id, updates);
        toast.success("Review question updated");
      } catch (err) {
        toast.error(err.message);
      }
    },
    [updateQuestion],
  );

  // Counts per test number for the filter dropdown
  const { questions: allQuestions } = useReviewQuestions();
  const testCounts = {};
  for (const q of allQuestions) {
    testCounts[q.test_number] = (testCounts[q.test_number] || 0) + 1;
  }

  const filterOptions = [
    { value: null, label: `All (${allQuestions.length})` },
    ...TEST_NUMBERS.map((n) => ({
      value: n,
      label: `Đề ${n} (${testCounts[n] || 0})`,
    })),
  ];

  const selectedFilterOption =
    filterOptions.find((o) => o.value === filterTest) || filterOptions[0];

  return (
    <div className="page">
      <h1>Review Questions</h1>
      <p className="page-description">
        Ghi lại những câu hỏi đã làm sai: lý do bạn chọn, đáp án đúng, vì sao
        sai và kiến thức cần nhớ.
      </p>

      <form onSubmit={handleSubmit} className="note-form">
        <div className="form-group">
          <label>Đề số</label>
          <select
            className="input"
            value={form.test_number}
            onChange={(e) => setField("test_number", Number(e.target.value))}
            style={{ maxWidth: 160 }}
          >
            {TEST_NUMBERS.map((n) => (
              <option key={n} value={n}>Đề {n}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Question</label>
          <RichTextEditor
            content={form.question}
            onChange={(v) => setField("question", v)}
            placeholder="Dán nội dung câu hỏi vào đây..."
          />
        </div>

        <div className="form-group">
          <label>Các đáp án (A. B. C. ...)</label>
          <textarea
            className="input"
            rows={4}
            value={form.options}
            onChange={(e) => setField("options", e.target.value)}
            placeholder={"A. ...\nB. ...\nC. ...\nD. ..."}
          />
        </div>

        <div className="form-group">
          <label>Tại sao tôi chọn đáp án này?</label>
          <textarea
            className="input"
            rows={3}
            value={form.why_chose}
            onChange={(e) => setField("why_chose", e.target.value)}
            placeholder="Lý do bạn đã chọn đáp án của mình..."
          />
        </div>

        <div className="form-group">
          <label>Đáp án đúng</label>
          <input
            type="text"
            className="input"
            value={form.correct_answer}
            onChange={(e) => setField("correct_answer", e.target.value)}
            placeholder="e.g., D"
            style={{ maxWidth: 160 }}
          />
        </div>

        <div className="form-group">
          <label>Tôi sai vì</label>
          <div className="reason-chips">
            {WRONG_REASONS.map((r) => (
              <button
                type="button"
                key={r}
                className={`reason-chip ${form.wrong_reasons.includes(r) ? "active" : ""}`}
                onClick={() => toggleReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Kiến thức cần nhớ</label>
          <RichTextEditor
            content={form.knowledge}
            onChange={(v) => setField("knowledge", v)}
            placeholder="Ghi lại kiến thức cần nhớ..."
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save Review Question"}
        </button>
      </form>

      <div className="quick-notes-divider" />

      <div className="quick-notes-browse">
        <h2>Your Review Questions</h2>
        <div className="pool-controls">
          <Select
            options={filterOptions}
            value={selectedFilterOption}
            onChange={(opt) => { setFilterTest(opt ? opt.value : null); setPage(1); }}
            isSearchable
            placeholder="Filter by đề..."
            styles={selectStyles}
          />
          <div className="pool-search-inline">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search review questions..."
              className="input"
            />
          </div>
        </div>

        <div className="pool-notes-area">
          {loading ? (
            <div className="loading">Loading review questions...</div>
          ) : questions.length === 0 ? (
            <div className="empty-state">
              <p>No review questions found.</p>
              <p>Create one above to get started.</p>
            </div>
          ) : (
            <>
              <div className="notes-list">
                {questions
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((q) => (
                    <ReviewQuestionCard
                      key={q.id}
                      question={q}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  ))}
              </div>
              {questions.length > pageSize && (
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
                      { length: Math.ceil(questions.length / pageSize) },
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
                    disabled={page >= Math.ceil(questions.length / pageSize)}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                  <span className="pagination-info">
                    {(page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, questions.length)} of{" "}
                    {questions.length}
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
