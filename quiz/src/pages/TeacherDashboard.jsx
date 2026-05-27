import { useEffect, useState } from "react";
import axios from "axios";
import { getWeekDay, toDateInputValue } from "../utils/dateFilters";
import { defaultSubjects, normalizeSubject } from "../utils/subjects";
import "./teacher.css";

// ✅ PRESET SETS — teacher can pick or type custom
const presetSets = ["Set 1", "Set 2", "Set 3"];

const emptyQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  answer: null,
});

export default function TeacherDashboard() {
  const [quiz, setQuiz] = useState({
    title: "",
    subject: "",
    set: "Set 1",
    customSet: "",       // when teacher types a custom name
    examDate: toDateInputValue(),
    questions: [],
  });
  const [username, setUsername] = useState("");
  const [userId, setUserId]     = useState("");
  const [loading, setLoading]   = useState(false);

  // resolved set value (preset or custom)
  const resolvedSet =
    quiz.set === "__custom__"
      ? quiz.customSet.trim()
      : quiz.set;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user._id) { alert("User not loaded properly"); return; }
    setUsername(user.username);
    setUserId(user._id);
  }, []);

  /* ─── question helpers ─── */
  const addQuestion = () =>
    setQuiz(p => ({ ...p, questions: [...p.questions, emptyQuestion()] }));

  const removeQuestion = (idx) =>
    setQuiz(p => ({ ...p, questions: p.questions.filter((_, i) => i !== idx) }));

  const updateQuestion = (idx, val) =>
    setQuiz(p => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i === idx ? { ...q, question: val } : q
      ),
    }));

  const updateOption = (qIdx, oIdx, val) =>
    setQuiz(p => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, j) => (j === oIdx ? val : o)) }
          : q
      ),
    }));

  const setCorrect = (qIdx, oIdx) =>
    setQuiz(p => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i === qIdx ? { ...q, answer: oIdx } : q
      ),
    }));

  const addOption = (qIdx) =>
    setQuiz(p => ({
      ...p,
      questions: p.questions.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, ""] } : q
      ),
    }));

  const removeOption = (qIdx, oIdx) =>
    setQuiz(p => ({
      ...p,
      questions: p.questions.map((q, i) => {
        if (i !== qIdx) return q;
        const nextOptions = q.options.filter((_, j) => j !== oIdx);
        const nextAnswer =
          q.answer === oIdx ? null
          : q.answer > oIdx ? q.answer - 1
          : q.answer;
        return { ...q, options: nextOptions, answer: nextAnswer };
      }),
    }));

  /* ─── create quiz ─── */
  const createQuiz = async () => {
    try {
      const subject = normalizeSubject(quiz.subject);

      if (!quiz.title.trim() || !subject) { alert("Title & Subject required"); return; }
      if (!userId)                         { alert("User not loaded properly"); return; }
      if (!resolvedSet)                    { alert("Set name required");        return; }
      if (quiz.questions.length === 0)     { alert("Add at least 1 question");  return; }

      for (const q of quiz.questions) {
        if (!q.question.trim())              { alert("Question cannot be empty");  return; }
        if (q.answer === null)               { alert("Select correct answer");     return; }
        if (q.options.some(o => !o.trim())) { alert("Options cannot be empty");   return; }
      }

      setLoading(true);

      await axios.post("http://localhost:5000/api/teacher-quiz", {
        ...quiz,
        title:   quiz.title.trim(),
        subject,
        set:     resolvedSet,
        examDay: getWeekDay(quiz.examDate),
        createdBy: userId,
      });

      alert(`Quiz Created — ${subject} • ${resolvedSet}`);
      setQuiz({
        title: "", subject: "", set: "Set 1", customSet: "",
        examDate: toDateInputValue(), questions: [],
      });
    } catch (err) {
      console.log("ERROR:", err.response?.data || err.message);
      alert("Error creating quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-page">
      <header className="teacher-header">
        <div>
          <p className="teacher-eyebrow">Teacher workspace</p>
          <h1>Welcome, {username || "Teacher"}</h1>
        </div>
      </header>

      <main className="teacher-layout">
        <aside className="quiz-sidebar">
          <div className="sidebar-card">
            <span className="card-label">Quiz setup</span>

            {/* TITLE */}
            <label>
              Quiz title
              <input
                placeholder="Example: Motion and Forces"
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              />
            </label>

            {/* SUBJECT */}
            <label>
              Subject
              <input
                list="teacher-subject-options"
                placeholder="Select or type new subject"
                value={quiz.subject}
                onChange={(e) => setQuiz({ ...quiz, subject: e.target.value })}
              />
              <datalist id="teacher-subject-options">
                {defaultSubjects.map((s) => <option key={s} value={s} />)}
              </datalist>
            </label>

            {/* ✅ SET */}
            <label>
              Paper Set
              <select
                value={quiz.set}
                onChange={(e) => setQuiz({ ...quiz, set: e.target.value, customSet: "" })}
              >
                {presetSets.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="__custom__">Custom Set…</option>
              </select>
            </label>

            {/* CUSTOM SET INPUT — shows only when "__custom__" is selected */}
            {quiz.set === "__custom__" && (
              <label>
                Custom set name
                <input
                  placeholder="e.g. Practice Paper, Final, Mock 1"
                  value={quiz.customSet}
                  onChange={(e) => setQuiz({ ...quiz, customSet: e.target.value })}
                />
              </label>
            )}

            {/* EXAM DATE */}
            <label>
              Exam date
              <input
                type="date"
                value={quiz.examDate}
                onChange={(e) => setQuiz({ ...quiz, examDate: e.target.value })}
              />
            </label>

            <p className="schedule-note">
              Week day: {getWeekDay(quiz.examDate) || "Select date"}
              {resolvedSet && (
                <span style={{ display: "block", marginTop: 4 }}>
                  Set: <strong>{resolvedSet}</strong>
                </span>
              )}
            </p>

            <button className="create-btn" disabled={loading} onClick={createQuiz}>
              {loading ? "Creating..." : "Create Quiz"}
            </button>
          </div>

          {/* SUMMARY */}
          <div className="summary-grid">
            <div>
              <strong>{quiz.questions.length}</strong>
              <span>Questions</span>
            </div>
            <div>
              <strong>
                {quiz.questions.reduce((t, q) => t + q.options.length, 0)}
              </strong>
              <span>Options</span>
            </div>
          </div>
        </aside>

        <section className="question-builder">
          {quiz.questions.length === 0 ? (
            <div className="empty-state">
              <p className="teacher-eyebrow">No questions yet</p>
              <h2>Build your first quiz question.</h2>
              <button onClick={addQuestion}>Add First Question</button>
            </div>
          ) : (
            quiz.questions.map((q, i) => (
              <article className="question-box" key={i}>
                <div className="question-head">
                  <div>
                    <span>Question {i + 1}</span>
                    <h2>{q.question || "Untitled question"}</h2>
                  </div>
                  <button className="remove-btn" onClick={() => removeQuestion(i)}>
                    Remove
                  </button>
                </div>

                <label className="question-input">
                  Question text
                  <input
                    placeholder="Enter question"
                    value={q.question}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                  />
                </label>

                <div className="options-grid">
                  {q.options.map((opt, j) => (
                    <div
                      className={`option-box ${q.answer === j ? "correct" : ""}`}
                      key={j}
                    >
                      <label className="radio-wrap">
                        <input
                          type="radio"
                          name={`q-${i}`}
                          checked={q.answer === j}
                          onChange={() => setCorrect(i, j)}
                        />
                        <span />
                      </label>

                      <input
                        type="text"
                        className="option-input"
                        placeholder={`Option ${j + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(i, j, e.target.value)}
                      />

                      {q.options.length > 2 && (
                        <button
                          className="remove-option"
                          onClick={() => removeOption(i, j)}
                          aria-label={`Remove option ${j + 1}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="btn-row">
                  <button onClick={() => addOption(i)}>Add Option</button>
                  <button onClick={addQuestion}>Add Question</button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}