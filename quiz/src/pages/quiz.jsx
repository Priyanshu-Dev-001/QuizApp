import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  buildFilterSummary,
  filterByDateWeek,
  formatDisplayDate,
  getScheduleValue,
  getWeekDay,
  weekDays,
} from "../utils/dateFilters";
import { getSubjectOptions } from "../utils/subjects";
import "./quiz.css";

// ✅ Helper: get all unique sets for a subject's quizzes
const getSetsForSubject = (quizzes, subject) => {
  const filtered = quizzes.filter((q) => q.subject === subject);
  const sets = [...new Set(filtered.map((q) => q.set || "Set 1"))];
  return sets.sort();
};

export default function Quiz() {
  const [allQuiz, setAllQuiz]           = useState([]);
  const [quiz, setQuiz]                 = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSet, setSelectedSet]   = useState("");   // ✅ NEW
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDay, setSelectedDay]   = useState("");
  const [current, setCurrent]           = useState(0);
  const [answers, setAnswers]           = useState({});
  const [time, setTime]                 = useState(60);
  const [submitted, setSubmitted]       = useState(false);
  const [score, setScore]               = useState(0);
  const [loading, setLoading]           = useState(false);

  const navigate = useNavigate();
  const user = useMemo(() => {
    try   { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  }, []);

  useEffect(() => {
    if (!user) { alert("Please login first"); window.location.href = "/"; return; }

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/quiz");
        setAllQuiz(res.data || []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [user]);

  // reset set when subject changes
  useEffect(() => {
    setSelectedSet("");
  }, [selectedSubject]);

  const scheduleFilters = { date: selectedDate, week: selectedWeek, day: selectedDay };

  const getAvailableQuizzesForSubject = (subject, set = "") => {
    const bySubject = allQuiz.filter((q) => q.subject === subject);
    const bySet     = set ? bySubject.filter((q) => (q.set || "Set 1") === set) : bySubject;
    return filterByDateWeek(bySet, scheduleFilters, ["examDate", "createdAt"]);
  };

  const startQuiz = () => {
    const filtered = getAvailableQuizzesForSubject(selectedSubject, selectedSet);

    if (filtered.length === 0) {
      alert("No quiz for this subject / set / date filter");
      return;
    }

    const mergedQuestions = filtered.flatMap((q) => q.questions);
    const scheduleValue   = getScheduleValue(filtered[0], ["examDate", "createdAt"]);
    const setLabel        = selectedSet || (filtered[0]?.set) || "Set 1";

    setQuiz({
      subject:     selectedSubject,
      set:         setLabel,
      title:       `${selectedSubject} — ${setLabel}`,
      examDate:    scheduleValue,
      examDay:     getWeekDay(scheduleValue),
      filterLabel: buildFilterSummary(scheduleFilters),
      questions:   mergedQuestions,
    });

    setCurrent(0);
    setAnswers({});
    setTime(60);
    setSubmitted(false);
    setScore(0);
  };

  const next = () => setCurrent((c) => Math.min(c + 1, quiz.questions.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  const handleSubmit = useCallback(async () => {
    if (submitted || !quiz || !user) return;

    let sc = 0;
    quiz.questions.forEach((q, i) => { if (answers[i] === q.answer) sc++; });

    setScore(sc);
    setSubmitted(true);

    try {
      await axios.post("http://localhost:5000/api/results", {
        username: user.username,
        title:    quiz.title,
        subject:  quiz.subject,
        set:      quiz.set,        // ✅ save set
        examDate: quiz.examDate,
        examDay:  quiz.examDay,
        score:    sc,
        total:    quiz.questions.length,
      });

      setTimeout(() => { navigate("/results"); }, 1500);
    } catch (err) {
      console.log(err);
    }
  }, [answers, navigate, quiz, submitted, user]);

  useEffect(() => {
    if (!quiz || submitted) return;

    const timer = setInterval(() => {
      setTime((t) => {
        if (t <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, submitted, handleSubmit]);

  const subjects = getSubjectOptions(allQuiz);
  const availableSets = selectedSubject ? getSetsForSubject(allQuiz, selectedSubject) : [];
  const hasSelectedQuiz =
    selectedSubject &&
    getAvailableQuizzesForSubject(selectedSubject, selectedSet).length > 0;
  const answeredCount = Object.keys(answers).length;

  /* ─── SUBJECT SELECT SCREEN ─── */
  if (!quiz) {
    return (
      <div className="quiz-page">
        <section className="quiz-select">
          <div>
            <p className="quiz-eyebrow">Quiz center</p>
            <h1>Select your subject</h1>
            <p>
              Choose a subject, paper set and start a timed practice quiz.
            </p>
          </div>

          <div className="subject-panel">
            {/* SUBJECT */}
            <label>
              Subject
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            {/* ✅ SET — only shows when a subject is chosen */}
            {selectedSubject && availableSets.length > 0 && (
              <label>
                Paper Set
                <select
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                >
                  <option value="">All Sets</option>
                  {availableSets.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}

            {/* DATE FILTERS */}
            <label>
              Exam date
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </label>

            <label>
              Week
              <input
                type="week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
              />
            </label>

            <label>
              Week day
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                <option value="">All Days</option>
                {weekDays.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </label>

            {selectedSubject && !hasSelectedQuiz && (
              <p className="empty-message">
                No quiz available for this subject
                {selectedSet ? ` / ${selectedSet}` : ""}.
              </p>
            )}

            <button disabled={!selectedSubject || loading} onClick={startQuiz}>
              {loading ? "Loading..." : "Start Quiz"}
            </button>
          </div>
        </section>

        {/* SUBJECT CARDS */}
        <section className="subject-cards">
          {subjects.map((subject) => {
            const sets = getSetsForSubject(allQuiz, subject);
            return (
              <button
                className={selectedSubject === subject ? "active" : ""}
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                type="button"
              >
                <span>{subject}</span>
                <small>
                  {getAvailableQuizzesForSubject(subject, "").length} quizzes
                  {sets.length > 1 ? ` · ${sets.length} sets` : ""}
                </small>
              </button>
            );
          })}
        </section>
      </div>
    );
  }

  /* ─── QUIZ ATTEMPT SCREEN ─── */
  const q        = quiz.questions[current];
  const progress = ((current + 1) / quiz.questions.length) * 100;

  return (
    <div className="quiz-page">
      <section className="quiz-attempt">
        <header className="attempt-header">
          <div>
            <p className="quiz-eyebrow">
              {quiz.subject}
              {quiz.set ? <span className="set-badge"> — {quiz.set}</span> : null}
            </p>
            <h1>{quiz.title}</h1>
            <p className="attempt-date">
              {quiz.examDay ? `${quiz.examDay}, ` : ""}
              {formatDisplayDate(quiz.examDate)}
            </p>
          </div>

          <div className={`timer-card ${time <= 10 ? "danger" : ""}`}>
            <span>Time Left</span>
            <strong>{time}s</strong>
          </div>
        </header>

        <div className="attempt-meta">
          <span>{user?.username}</span>
          <span>Question {current + 1} of {quiz.questions.length}</span>
          <span>{answeredCount} answered</span>
          <span>{quiz.filterLabel}</span>
        </div>

        <div className="progress">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <article className="question-card">
          <span className="question-count">Q{current + 1}</span>
          <h2>{q.question}</h2>

          <div className="quiz-options-grid">
            {q.options.map((opt, i) => {
              const selected = answers[current] === i;
              let className  = "quiz-option";
              if (submitted) {
                if (i === q.answer) className += " correct";
                else if (selected) className += " wrong";
              } else if (selected) {
                className += " selected";
              }

              return (
                <label key={i} className={className}>
                  <input
                    type="radio"
                    checked={selected}
                    disabled={submitted}
                    onChange={() => setAnswers({ ...answers, [current]: i })}
                  />
                  <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </article>

        <div className="quiz-nav-buttons">
          <button onClick={prev} disabled={current === 0}>Prev</button>
          {current === quiz.questions.length - 1 ? (
            <button className="submit-btn" onClick={handleSubmit} disabled={submitted}>
              Submit
            </button>
          ) : (
            <button onClick={next}>Next</button>
          )}
        </div>

        {submitted && (
          <div className="result-box">
            <strong>Score: {score} / {quiz.questions.length}</strong>
            <p>Redirecting to results...</p>
          </div>
        )}
      </section>
    </div>
  );
}