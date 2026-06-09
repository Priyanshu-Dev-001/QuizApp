import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Timer, BookOpen, ChevronLeft, ChevronRight, CheckCircle, XCircle, Award, Loader2, AlertTriangle, RotateCcw, Sparkles } from "lucide-react";
import { showToast } from "../utils/toast";
import "./mock-test.css";

const SUBJECTS_LIST = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English"];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"];
const DURATIONS = [15, 30, 45, 60, 90, 120];
const QUESTION_COUNTS = [10, 15, 20, 25, 30];

export default function MockTest() {
  const [phase, setPhase] = useState("setup");
  const [subject, setSubject] = useState("Physics");
  const [difficulty, setDifficulty] = useState("Mixed");
  const [duration, setDuration] = useState(30);
  const [questionCount, setQuestionCount] = useState(15);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);

  const timerRef = useRef(null);

  const submitTest = useCallback((auto = false) => {
    clearInterval(timerRef.current);
    if (auto) showToast("Time's up! Test submitted automatically.", "warning");

    let correct = 0, wrong = 0, skipped = 0;
    const detailed = questions.map((q, i) => {
      const sel = answers[i];
      if (sel === undefined || sel === null) { skipped++; return { ...q, selectedAnswer: null, isCorrect: false }; }
      const isCorrect = sel === q.answer;
      if (isCorrect) correct++; else wrong++;
      return { ...q, selectedAnswer: sel, isCorrect };
    });

    const rawScore = correct * 4 - wrong * 1;
    const maxScore = questions.length * 4;
    const pct = Math.max(0, Math.round((rawScore / maxScore) * 100));

    const timeUsed = duration * 60 - timeLeft;
    const mins = Math.floor(timeUsed / 60);
    const secs = timeUsed % 60;

    setResult({ correct, wrong, skipped, rawScore: Math.max(0, rawScore), maxScore, pct, timeUsed: `${mins}m ${secs}s`, detailed });
    setPhase("result");
  }, [questions, answers, duration, timeLeft]);

  useEffect(() => {
    if (phase !== "test") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); submitTest(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, submitTest]);

  const startTest = async () => {
    try {
      setLoading(true);
      const settings = JSON.parse(localStorage.getItem("quizSettings") || "{}");
      const res = await axios.post("/api/ai/mock-test", {
        subject, difficulty, questionCount, apiKey: settings.geminiApiKey || ""
      });
      const qs = res.data.questions;
      if (!qs || qs.length === 0) throw new Error("No questions generated");
      setQuestions(qs);
      setAnswers({});
      setCurrentIdx(0);
      setTimeLeft(duration * 60);
      setResult(null);
      setReviewMode(false);
      setPhase("test");
      showToast(`Mock test started! ${qs.length} questions, ${duration} minutes.`, "success");
    } catch (err) {
      showToast("Error generating test. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (optIdx) => {
    if (reviewMode) return;
    setAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getResultMessage = (pct) => {
    if (pct >= 85) return "Excellent! Outstanding performance! 🌟";
    if (pct >= 70) return "Great job! You're well prepared! 🎯";
    if (pct >= 50) return "Good effort! Keep practicing! 📈";
    if (pct >= 35) return "Needs improvement. Review weak topics! 📚";
    return "Don't give up! Consistent practice is key! 💪";
  };

  if (phase === "setup") {
    return (
      <div className="mock-page">
        <div className="mt-setup-card">
          <div className="mt-eyebrow"><Sparkles size={13} /> AI Mock Test</div>
          <h1>JEE / NEET Style Mock Test</h1>
          <p>AI-generated questions with negative marking. Just like the real exam experience.</p>

          <div className="mt-config-grid">
            <div className="mt-config-item">
              <label>Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                {SUBJECTS_LIST.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="mt-config-item">
              <label>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="mt-config-item">
              <label>Duration (minutes)</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {DURATIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="mt-config-item">
              <label>No. of Questions</label>
              <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
                {QUESTION_COUNTS.map((q) => <option key={q}>{q}</option>)}
              </select>
            </div>
          </div>

          <div style={{ background: "rgba(249,115,22,0.08)", border: "1.5px solid rgba(249,115,22,0.25)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertTriangle size={18} style={{ color: "#f97316", flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 14, color: "var(--mt-ink)", lineHeight: 1.6 }}>
              <strong>Marking Scheme:</strong> +4 for correct, −1 for wrong, 0 for unattempted.
              Total marks: <strong>{questionCount * 4}</strong> | Duration: <strong>{duration} min</strong>
            </div>
          </div>

          <button className="mt-start-btn" onClick={startTest} disabled={loading}>
            {loading ? <><Loader2 size={18} className="spin" /> Generating Questions...</> : <><BookOpen size={18} /> Start Mock Test</>}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[
            { icon: "⏱️", label: "Timed Exam", desc: "Strict time limit like real exams" },
            { icon: "❌", label: "Negative Marking", desc: "−1 for each wrong answer" },
            { icon: "🤖", label: "AI Generated", desc: "Fresh questions every time" },
            { icon: "📊", label: "Detailed Analysis", desc: "Full report after submission" },
          ].map((f) => (
            <div key={f.label} style={{ background: "var(--mt-surface)", border: "1px solid var(--mt-line)", borderRadius: 14, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mt-heading)", marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 13, color: "var(--mt-muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="mock-page">
        <div className="mt-result-card">
          <div className="mt-result-circle">
            <span className="score-num">{result.pct}%</span>
            <span className="score-total">{result.rawScore}/{result.maxScore}</span>
          </div>
          <h2>{getResultMessage(result.pct)}</h2>
          <p>Subject: <strong>{subject}</strong> · Time Taken: <strong>{result.timeUsed}</strong></p>

          <div className="mt-result-stats">
            <div className="mt-stat-box"><strong style={{ color: "var(--mt-green)" }}>{result.correct}</strong><span>Correct (+{result.correct * 4})</span></div>
            <div className="mt-stat-box"><strong style={{ color: "var(--mt-red)" }}>{result.wrong}</strong><span>Wrong (−{result.wrong})</span></div>
            <div className="mt-stat-box"><strong style={{ color: "var(--mt-muted)" }}>{result.skipped}</strong><span>Skipped</span></div>
            <div className="mt-stat-box"><strong>{result.rawScore}</strong><span>Final Score</span></div>
          </div>

          <div className="mt-result-actions">
            <button className="mt-nav-btn primary" onClick={() => { setReviewMode(true); setCurrentIdx(0); setPhase("test"); }}>
              <BookOpen size={15} /> Review Answers
            </button>
            <button className="mt-nav-btn" onClick={() => setPhase("setup")}>
              <RotateCcw size={15} /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase !== "test" || questions.length === 0) return null;

  const q = questions[currentIdx];
  const selected = answers[currentIdx];
  const answered = Object.keys(answers).length;
  const isWarning = timeLeft <= 60;

  return (
    <div className="mock-page">
      <div className="mt-test-header">
        <div className="mt-progress-info">
          <span>{subject} — {reviewMode ? "Review Mode" : "Mock Test"}</span>
          <strong>Q {currentIdx + 1} / {questions.length}</strong>
        </div>
        <div style={{ flex: 1, maxWidth: 300 }}>
          <div className="mt-progress-bar">
            <div className="mt-progress-fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
          </div>
          <div style={{ fontSize: 12, color: "var(--mt-muted)", marginTop: 4 }}>{answered} answered</div>
        </div>
        {!reviewMode && (
          <div className={`mt-timer ${isWarning ? "warning" : ""}`}>
            <Timer size={18} /> {formatTime(timeLeft)}
          </div>
        )}
        {reviewMode && (
          <div style={{ fontSize: 13, color: "var(--mt-brand)", fontWeight: 700, background: "rgba(99,102,241,0.1)", padding: "8px 16px", borderRadius: 10 }}>
            Review Mode
          </div>
        )}
      </div>

      <div className="mt-question-card">
        <div className="mt-q-meta">
          <span className="mt-q-num">Q{currentIdx + 1}</span>
          <span className="mt-q-subject">{subject}</span>
          {reviewMode && (
            answers[currentIdx] !== undefined
              ? (result?.detailed[currentIdx]?.isCorrect
                  ? <span style={{ fontSize: 12, color: "var(--mt-green)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={13} /> Correct</span>
                  : <span style={{ fontSize: 12, color: "var(--mt-red)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><XCircle size={13} /> Wrong</span>)
              : <span style={{ fontSize: 12, color: "var(--mt-muted)", fontWeight: 600 }}>Skipped</span>
          )}
        </div>

        <div className="mt-question-text">{q.question}</div>

        <div className="mt-options-grid">
          {(q.options || []).map((opt, oi) => {
            let cls = "mt-option-btn";
            if (reviewMode) {
              if (oi === q.answer) cls += " correct";
              else if (oi === answers[currentIdx] && answers[currentIdx] !== q.answer) cls += " wrong";
            } else {
              if (oi === selected) cls += " selected";
            }
            return (
              <button key={oi} className={cls} onClick={() => selectAnswer(oi)} disabled={reviewMode}>
                <span className="mt-option-letter">{String.fromCharCode(65 + oi)}</span>
                {opt}
              </button>
            );
          })}
        </div>

        <div className="mt-nav-row">
          <button className="mt-nav-btn" onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))} disabled={currentIdx === 0}>
            <ChevronLeft size={16} /> Previous
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {reviewMode
              ? <button className="mt-nav-btn" onClick={() => setPhase("result")}><Award size={15} /> View Score</button>
              : <button className="mt-nav-btn danger" onClick={() => submitTest(false)}><CheckCircle size={15} /> Submit Test</button>
            }
          </div>

          {currentIdx < questions.length - 1
            ? <button className="mt-nav-btn" onClick={() => setCurrentIdx((p) => p + 1)}>Next <ChevronRight size={16} /></button>
            : !reviewMode
              ? <button className="mt-nav-btn primary" onClick={() => submitTest(false)}><CheckCircle size={15} /> Submit</button>
              : <button className="mt-nav-btn" onClick={() => setPhase("result")}><Award size={15} /> Score</button>
          }
        </div>
      </div>

      <div className="mt-palette">
        <h3>Question Palette</h3>
        <div className="mt-palette-grid">
          {questions.map((_, i) => (
            <button
              key={i}
              className={`mt-palette-dot ${i === currentIdx ? "current" : answers[i] !== undefined ? "answered" : ""}`}
              onClick={() => setCurrentIdx(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
