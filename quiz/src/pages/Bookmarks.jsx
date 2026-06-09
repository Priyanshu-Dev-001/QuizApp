import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, X, Trash2, BookOpen, Eye, EyeOff } from "lucide-react";
import { showToast } from "../utils/toast";
import "./bookmarks.css";

export default function Bookmarks() {
  const navigate = useNavigate();
  
  // State for loading bookmarks from localStorage
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const stored = localStorage.getItem("quizBookmarks");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error reading bookmarks", e);
      return [];
    }
  });

  // State for subject filter
  const [selectedSubject, setSelectedSubject] = useState("all");
  
  // State to track which question answers are revealed
  const [revealedIds, setRevealedIds] = useState({});

  // State for confirmation modal
  const [showClearModal, setShowClearModal] = useState(false);

  // Extract unique subjects
  const subjects = useMemo(() => {
    const list = bookmarks.map((b) => b.subject || "General");
    return ["all", ...new Set(list)];
  }, [bookmarks]);

  // Filtered bookmarks
  const filteredBookmarks = useMemo(() => {
    if (selectedSubject === "all") return bookmarks;
    return bookmarks.filter(
      (b) => (b.subject || "General") === selectedSubject
    );
  }, [bookmarks, selectedSubject]);

  // Remove single bookmark
  const handleRemove = (id) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem("quizBookmarks", JSON.stringify(updated));
    showToast("Bookmark removed", "success");
  };

  // Clear all bookmarks
  const handleClearAll = () => {
    setBookmarks([]);
    localStorage.removeItem("quizBookmarks");
    setShowClearModal(false);
    showToast("All bookmarks cleared", "success");
  };

  // Toggle reveal answer
  const toggleReveal = (id) => {
    setRevealedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Date formatting helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "";
    }
  };

  const getOptionLabel = (index) => {
    return ["A", "B", "C", "D"][index] || String(index + 1);
  };

  return (
    <div className="bookmarks-page">
      {/* HERO SECTION */}
      <section className="bm-hero">
        <div>
          <p className="bm-eyebrow">Personal Revision Hub</p>
          <h1>Bookmarked Questions</h1>
          <p>
            Review questions you saved during your quizzes. Revise difficult
            concepts, reveal correct answers, and test your understanding
            anytime.
          </p>
        </div>
        <div className="bm-summary">
          <div>
            <strong>{bookmarks.length}</strong>
            <span>Total Saved</span>
          </div>
          <div>
            <strong>{subjects.length - 1}</strong>
            <span>Subjects</span>
          </div>
        </div>
      </section>

      {bookmarks.length === 0 ? (
        /* EMPTY STATE */
        <section className="bm-empty">
          <div className="bm-empty-icon">
            <Bookmark size={40} />
          </div>
          <h2>No bookmarks saved yet</h2>
          <p>
            You can bookmark challenging questions while taking practice or exam
            quizzes. They will appear here for easy review and revision.
          </p>
          <button className="bm-empty-action" onClick={() => navigate("/quiz")}>
            <BookOpen size={18} />
            Go to Quizzes
          </button>
        </section>
      ) : (
        <>
          {/* TOOLBAR */}
          <section className="bm-toolbar">
            <span className="bm-toolbar-label">Filter:</span>
            <div className="bm-pills">
              {subjects.map((subj) => {
                const count =
                  subj === "all"
                    ? bookmarks.length
                    : bookmarks.filter((b) => (b.subject || "General") === subj)
                        .length;
                return (
                  <button
                    key={subj}
                    className={`bm-pill ${
                      selectedSubject === subj ? "active" : ""
                    }`}
                    onClick={() => setSelectedSubject(subj)}
                  >
                    {subj.charAt(0).toUpperCase() + subj.slice(1)}
                    <span className="pill-count">{count}</span>
                  </button>
                );
              })}
            </div>
            <button
              className="bm-clear-btn"
              onClick={() => setShowClearModal(true)}
            >
              <Trash2 size={16} />
              Clear Revision List
            </button>
          </section>

          {/* GRID OF BOOKMARKS */}
          <section className="bm-grid">
            {filteredBookmarks.map((bookmark) => {
              const isRevealed = !!revealedIds[bookmark.id];
              return (
                <article className="bm-card" key={bookmark.id}>
                  <div className="bm-card-head">
                    <span className="bm-subject-badge">
                      {bookmark.subject || "General"}
                    </span>
                    <button
                      className="bm-remove-btn"
                      onClick={() => handleRemove(bookmark.id)}
                      title="Remove Bookmark"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <h3 className="bm-question">{bookmark.question}</h3>

                  <span className="bm-type-tag">
                    {bookmark.type === "mcq" ? "Multiple Choice" : "Question"}
                  </span>

                  {bookmark.options && bookmark.options.length > 0 && (
                    <div className="bm-options">
                      {bookmark.options.map((opt, idx) => {
                        const isCorrect = idx === bookmark.answer;
                        const revealClass =
                          isRevealed && isCorrect ? "correct-reveal" : "";
                        return (
                          <div
                            key={idx}
                            className={`bm-option ${revealClass}`}
                          >
                            <span className="bm-option-label">
                              {getOptionLabel(idx)}
                            </span>
                            <span className="bm-option-text">{opt}</span>
                            {isRevealed && isCorrect && (
                              <span className="bm-correct-icon">Correct</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="bm-card-foot">
                    <span className="bm-date">
                      Saved {formatDate(bookmark.bookmarkedAt)}
                    </span>
                    <button
                      className={`bm-reveal-btn ${isRevealed ? "revealed" : ""}`}
                      onClick={() => toggleReveal(bookmark.id)}
                    >
                      {isRevealed ? (
                        <>
                          <EyeOff size={15} />
                          Hide Answer
                        </>
                      ) : (
                        <>
                          <Eye size={15} />
                          Reveal Answer
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      {/* CONFIRM CLEAR ALL MODAL */}
      {showClearModal && (
        <div className="bm-confirm-overlay">
          <div className="bm-confirm-box">
            <h3>Clear Revision List?</h3>
            <p>
              Are you sure you want to remove all saved questions? This action
              cannot be undone.
            </p>
            <div className="bm-confirm-actions">
              <button
                className="bm-confirm-cancel"
                onClick={() => setShowClearModal(false)}
              >
                Cancel
              </button>
              <button className="bm-confirm-delete" onClick={handleClearAll}>
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
