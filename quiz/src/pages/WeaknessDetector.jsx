import { useState, useEffect } from "react";
import axios from "axios";
import {
  Zap, AlertTriangle, CheckCircle, Target, RotateCcw,
  Lightbulb, BookOpen, Star, Brain, ChevronRight
} from "lucide-react";
import { showToast } from "../utils/toast";
import "./weakness-detector.css";

const OPTION_KEYS = ["A", "B", "C", "D"];

function PracticeQuestion({ pq, idx }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (i) => {
    if (selected !== null) return;
    setSelected(i);
  };

  return (
    <div className="wd-pq-item">
      <span className="wd-pq-subject"><Target size={11} /> {pq.subject}</span>
      <p className="wd-pq-q">Q{idx + 1}. {pq.question}</p>
      <div className="wd-pq-options">
        {pq.options.map((opt, i) => {
          let cls = "";
          if (selected !== null) {
            if (i === pq.answer) cls = "correct";
            else if (i === selected && i !== pq.answer) cls = "wrong";
          }
          return (
            <button
              key={i}
              className={`wd-pq-opt ${cls}`}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
            >
              <span className="wd-pq-opt-key">{OPTION_KEYS[i]}</span>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && pq.explanation && (
        <div className="wd-pq-explanation">
          <Lightbulb size={15} style={{ color: "var(--wd-brand)", flexShrink: 0, marginTop: 2 }} />
          <span>{pq.explanation}</span>
        </div>
      )}
    </div>
  );
}

const LOADING_STEPS = [
  "📊 Reading your quiz history...",
  "🔍 Detecting weak areas...",
  "🧠 Generating AI analysis...",
  "✏️ Creating practice questions...",
  "✅ Almost ready!",
];

export default function WeaknessDetector() {
  const [loading, setLoading]       = useState(false);
  const [stepIdx, setStepIdx]       = useState(0);
  const [analysis, setAnalysis]     = useState(null);
  const [subjectStats, setSubjectStats] = useState([]);
  const [hasData, setHasData]       = useState(true);
  const [source, setSource]         = useState("");

  useEffect(() => {
    let t;
    if (loading) {
      setStepIdx(0);
      t = setInterval(() => setStepIdx((p) => Math.min(p + 1, LOADING_STEPS.length - 1)), 900);
    }
    return () => clearInterval(t);
  }, [loading]);

  const runAnalysis = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.username) { showToast("Please login first", "error"); return; }

    setLoading(true);
    setAnalysis(null);
    setSubjectStats([]);

    try {
      const { data: resultsData } = await axios.get("/api/results");
      const mine = (resultsData || []).filter((r) => r.username === user.username);

      if (mine.length === 0) {
        setHasData(false);
        setLoading(false);
        return;
      }

      const settings = JSON.parse(localStorage.getItem("quizSettings") || "{}");
      const { data } = await axios.post("/api/ai/weakness-analysis", {
        results: mine,
        apiKey: settings.geminiApiKey || "",
      });

      setAnalysis(data.analysis);
      setSubjectStats(data.subjectStats || []);
      setSource(data.source);
      showToast(
        data.source === "ai"
          ? "AI analysis complete! 🎯"
          : "Analysis ready (add Gemini key for AI insights) 📊",
        "success"
      );
    } catch (err) {
      showToast("Analysis failed. Try again.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBarColor = (score) => {
    if (score >= 70) return "#10b981";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };
  const getChipClass = (score) => score >= 70 ? "good" : score >= 40 ? "avg" : "weak";

  return (
    <div className="wd-page">
      {/* HERO */}
      <div className="wd-hero">
        <div className="wd-eyebrow"><AlertTriangle size={13} /> AI Weakness Detector</div>
        <h1>Find & Fix Your Weak Spots</h1>
        <p>AI analyzes your quiz history, detects gaps, and generates targeted practice questions just for you.</p>
      </div>

      {/* ANALYSE BUTTON (shown when no analysis yet) */}
      {!analysis && !loading && (
        <>
          {hasData ? (
            <button className="wd-analyse-btn" onClick={runAnalysis}>
              <Zap size={20} /> Analyse My Performance
            </button>
          ) : (
            <div className="wd-no-data">
              <BookOpen size={56} strokeWidth={1.2} />
              <h2>No quiz data found</h2>
              <p>Take some quizzes first, then come back for a personalized weakness analysis!</p>
            </div>
          )}
        </>
      )}

      {/* LOADING */}
      {loading && (
        <div className="wd-loading">
          <div className="wd-spinner" />
          <div className="wd-loading-steps">
            {LOADING_STEPS.map((s, i) => (
              <span key={i} className={i <= stepIdx ? "active" : ""}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* RESULTS */}
      {analysis && !loading && (
        <>
          {/* Summary */}
          <div className="wd-summary">
            <div className="wd-summary-icon"><Brain size={22} /></div>
            <p>{analysis.summary}</p>
          </div>

          {/* Subject Score Overview */}
          {subjectStats.length > 0 && (
            <div className="wd-card">
              <h2 className="wd-card-title"><BookOpen size={18} /> Subject Overview</h2>
              <div className="wd-subject-grid">
                {subjectStats.map((s) => (
                  <div className={`wd-subject-chip ${getChipClass(s.avgScore)}`} key={s.subject}>
                    <span className="wd-chip-name">{s.subject}</span>
                    <span className={`wd-chip-score ${getChipClass(s.avgScore)}`}>{s.avgScore}%</span>
                    <span className="wd-chip-label">{s.attempts} attempt{s.attempts > 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="wd-score-bar-wrap" style={{ marginTop: 22 }}>
                {subjectStats.map((s) => (
                  <div className="wd-score-bar-row" key={s.subject}>
                    <div className="wd-score-bar-label">
                      <span>{s.subject}</span>
                      <span style={{ color: getBarColor(s.avgScore), fontWeight: 800 }}>{s.avgScore}%</span>
                    </div>
                    <div className="wd-score-bar-track">
                      <div
                        className="wd-score-bar-fill"
                        style={{ width: `${s.avgScore}%`, background: getBarColor(s.avgScore) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Focus */}
          {analysis.weeklyFocus && (
            <div className="wd-focus-banner">
              <div className="wd-focus-icon"><Target size={26} /></div>
              <div className="wd-focus-text">
                <h3>This Week's Focus</h3>
                <p>{analysis.weeklyFocus}</p>
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses?.length > 0 && (
            <div className="wd-card">
              <h2 className="wd-card-title"><AlertTriangle size={18} color="var(--wd-red)" /> Areas Needing Work</h2>
              <div className="wd-weakness-list">
                {analysis.weaknesses.map((w) => (
                  <div className="wd-weakness-item" key={w.subject}>
                    <div className="wd-weakness-top">
                      <span className="wd-weakness-subj"><ChevronRight size={16} color="var(--wd-red)" />{w.subject}</span>
                      <span className="wd-weakness-badge">{w.score ?? ""}% Avg</span>
                    </div>
                    <p className="wd-weakness-reason">💡 {w.reason}</p>
                    <div className="wd-tips">
                      {w.tips?.map((tip, i) => (
                        <div className="wd-tip" key={i}>
                          <span className="wd-tip-dot">{i + 1}</span>
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {analysis.strengths?.length > 0 && (
            <div className="wd-card">
              <h2 className="wd-card-title"><Star size={18} color="var(--wd-green)" /> Your Strengths</h2>
              <div className="wd-strengths">
                {analysis.strengths.map((s) => (
                  <span className="wd-strength-badge" key={s}>
                    <CheckCircle size={15} /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Practice Questions */}
          {analysis.practiceQuestions?.length > 0 && (
            <div className="wd-card">
              <h2 className="wd-card-title"><Brain size={18} /> Targeted Practice Questions</h2>
              <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--wd-muted)" }}>
                {source === "ai" ? "AI-generated questions targeting your exact weak areas." : "Practice questions to help you improve."}
              </p>
              <div className="wd-pq-list">
                {analysis.practiceQuestions.map((pq, i) => (
                  <PracticeQuestion key={i} pq={pq} idx={i} />
                ))}
              </div>
            </div>
          )}

          {/* Re-analyse */}
          <div className="wd-reanalyse">
            <button className="wd-reanalyse-btn" onClick={runAnalysis}>
              <RotateCcw size={15} /> Re-analyse
            </button>
          </div>
        </>
      )}
    </div>
  );
}
