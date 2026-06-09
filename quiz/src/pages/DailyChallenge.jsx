import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Zap, Trophy, Clock, RotateCcw, CheckCircle, XCircle, Flame, Star } from "lucide-react";
import { showToast } from "../utils/toast";
import "./daily-challenge.css";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "General Science", "History", "Geography"];
const DAILY_Q_COUNT = 10;
const TODAY = new Date().toDateString();

function getStoredChallenge() {
  try {
    const d = JSON.parse(localStorage.getItem("dailyChallenge") || "{}");
    return d.date === TODAY ? d : null;
  } catch { return null; }
}

export default function DailyChallenge() {
  const [phase, setPhase]         = useState("pick"); // pick | loading | quiz | result
  const [subject, setSubject]     = useState("Physics");
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState([]);
  const [selected, setSelected]   = useState(null);
  const [timeLeft, setTimeLeft]   = useState(30);
  const [score, setScore]         = useState(0);
  const [stored, setStored]       = useState(getStoredChallenge);

  // Timer
  useEffect(() => {
    if (phase !== "quiz") return;
    if (timeLeft <= 0) { handleNext(null); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, current]);

  const startChallenge = async () => {
    setPhase("loading");
    try {
      const settings = JSON.parse(localStorage.getItem("quizSettings") || "{}");
      const { data } = await axios.post("/api/ai/generate-quiz", {
        topic: subject,
        subject,
        questionCount: DAILY_Q_COUNT,
        apiKey: settings.geminiApiKey || "",
      });
      setQuestions(data.questions || []);
      setAnswers([]);
      setCurrent(0);
      setScore(0);
      setSelected(null);
      setTimeLeft(30);
      setPhase("quiz");
    } catch {
      showToast("Failed to load challenge. Try again!", "error");
      setPhase("pick");
    }
  };

  const handleNext = useCallback((sel) => {
    const q = questions[current];
    const isCorrect = sel === q?.answer;
    const newScore = score + (isCorrect ? 1 : 0);
    const newAnswers = [...answers, { selected: sel, correct: q?.answer, isCorrect }];

    if (current + 1 >= questions.length) {
      const xp = newScore * 15;
      const result = { date: TODAY, subject, score: newScore, total: questions.length, xp };
      localStorage.setItem("dailyChallenge", JSON.stringify(result));
      // Update XP
      const totalXP = parseInt(localStorage.getItem("totalXP") || "0") + xp;
      localStorage.setItem("totalXP", String(totalXP));
      setStored(result);
      setScore(newScore);
      setAnswers(newAnswers);
      setPhase("result");
    } else {
      setScore(newScore);
      setAnswers(newAnswers);
      setCurrent(p => p + 1);
      setSelected(null);
      setTimeLeft(30);
    }
  }, [current, questions, score, answers, subject]);

  const handleSelect = (i) => {
    if (selected !== null) return;
    setSelected(i);
    setTimeout(() => handleNext(i), 700);
  };

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const OPTS = ["A","B","C","D"];

  // Already done today
  if (stored && phase === "pick") {
    return (
      <div className="dc-page">
        <div className="dc-hero">
          <div className="dc-eyebrow"><Flame size={13} /> Daily Challenge</div>
          <h1>Today's Challenge Done! 🎉</h1>
          <p>Come back tomorrow for a new challenge.</p>
        </div>
        <div className="dc-result-card">
          <div className="dc-result-circle" style={{ "--pct": stored.score / stored.total }}>
            <span className="dc-result-big">{stored.score}/{stored.total}</span>
            <span className="dc-result-sub">{Math.round((stored.score/stored.total)*100)}%</span>
          </div>
          <div className="dc-result-meta">
            <span className="dc-result-subject">{stored.subject}</span>
            <span className="dc-xp-badge"><Zap size={14} /> +{stored.xp} XP earned</span>
          </div>
          <button className="dc-retry-btn" onClick={() => { localStorage.removeItem("dailyChallenge"); setStored(null); }}>
            <RotateCcw size={15} /> Reset (Practice Mode)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dc-page">
      <div className="dc-hero">
        <div className="dc-eyebrow"><Flame size={13} /> Daily Challenge</div>
        <h1>Daily Quiz Challenge</h1>
        <p>10 questions · 30 sec each · Earn XP · Beat your streak!</p>
      </div>

      {phase === "pick" && (
        <div className="dc-pick-card">
          <h2 className="dc-pick-title"><Star size={18} /> Choose Today's Subject</h2>
          <div className="dc-subject-grid">
            {SUBJECTS.map(s => (
              <button key={s} className={`dc-subj-btn ${subject === s ? "active" : ""}`} onClick={() => setSubject(s)}>{s}</button>
            ))}
          </div>
          <button className="dc-start-btn" onClick={startChallenge}>
            <Zap size={18} /> Start Challenge
          </button>
        </div>
      )}

      {phase === "loading" && (
        <div className="dc-loading">
          <div className="dc-spinner" />
          <p>Generating {DAILY_Q_COUNT} questions on {subject}...</p>
        </div>
      )}

      {phase === "quiz" && questions[current] && (
        <div className="dc-quiz-card">
          <div className="dc-quiz-top">
            <span className="dc-q-num">Q {current + 1} / {questions.length}</span>
            <span className={`dc-timer ${timeLeft <= 10 ? "danger" : ""}`}><Clock size={14} /> {timeLeft}s</span>
          </div>
          <div className="dc-progress-bar"><div className="dc-progress-fill" style={{ width: `${((current) / questions.length) * 100}%` }} /></div>
          <p className="dc-question">{questions[current].question}</p>
          <div className="dc-options">
            {questions[current].options.map((opt, i) => {
              let cls = "";
              if (selected !== null) {
                if (i === questions[current].answer) cls = "correct";
                else if (i === selected) cls = "wrong";
              }
              return (
                <button key={i} className={`dc-opt ${cls}`} onClick={() => handleSelect(i)} disabled={selected !== null}>
                  <span className="dc-opt-key">{OPTS[i]}</span> {opt}
                </button>
              );
            })}
          </div>
          <div className="dc-score-live"><Trophy size={14} /> Score: {score}/{current + (selected !== null ? 1 : 0)}</div>
        </div>
      )}

      {phase === "result" && (
        <div className="dc-result-card">
          <h2 style={{ textAlign:"center", marginBottom: 8 }}>{pct >= 80 ? "🔥 Excellent!" : pct >= 50 ? "👍 Good Job!" : "📚 Keep Practicing!"}</h2>
          <div className="dc-result-circle" style={{ "--pct": score / questions.length }}>
            <span className="dc-result-big">{score}/{questions.length}</span>
            <span className="dc-result-sub">{pct}%</span>
          </div>
          <div className="dc-result-meta">
            <span className="dc-result-subject">{subject}</span>
            <span className="dc-xp-badge"><Zap size={14} /> +{score * 15} XP earned</span>
          </div>
          <div className="dc-answers-review">
            {answers.map((a, i) => (
              <div key={i} className={`dc-ans-row ${a.isCorrect ? "ok" : "no"}`}>
                {a.isCorrect ? <CheckCircle size={15} /> : <XCircle size={15} />}
                <span>Q{i+1}: {a.isCorrect ? "Correct" : `Wrong (Ans: ${OPTS[a.correct]})`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
