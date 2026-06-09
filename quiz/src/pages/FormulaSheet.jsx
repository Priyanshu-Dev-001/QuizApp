import { useState } from "react";
import axios from "axios";
import { BookOpen, Zap, Copy, CheckCheck, ChevronDown, ChevronUp, Sigma } from "lucide-react";
import { showToast } from "../utils/toast";
import "./formula-sheet.css";

const SUBJECTS = [
  "Physics", "Chemistry", "Mathematics", "Biology",
  "Organic Chemistry", "Trigonometry", "Calculus",
  "Mechanics", "Electrostatics", "Thermodynamics",
  "Algebra", "Coordinate Geometry"
];

function FormulaCard({ formula }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(`${formula.name}: ${formula.formula}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="fs-formula-card">
      <div className="fs-formula-top">
        <span className="fs-formula-name">{formula.name}</span>
        <button className="fs-copy-btn" onClick={copy} title="Copy">
          {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="fs-formula-box">{formula.formula}</div>
      {formula.description && <p className="fs-formula-desc">{formula.description}</p>}
      {formula.variables && <p className="fs-formula-vars"><strong>Where:</strong> {formula.variables}</p>}
    </div>
  );
}

function Section({ section }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="fs-section">
      <button className="fs-section-head" onClick={() => setOpen(o => !o)}>
        <span><Sigma size={16} /> {section.title}</span>
        <span className="fs-section-meta">
          {section.formulas?.length} formulas
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && (
        <div className="fs-section-body">
          {section.formulas?.map((f, i) => <FormulaCard key={i} formula={f} />)}
        </div>
      )}
    </div>
  );
}

export default function FormulaSheet() {
  const [subject, setSubject]   = useState("Physics");
  const [custom, setCustom]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [sheet, setSheet]       = useState(null);
  const [source, setSource]     = useState("");

  const generate = async () => {
    const sub = custom.trim() || subject;
    setLoading(true);
    setSheet(null);
    try {
      const settings = JSON.parse(localStorage.getItem("quizSettings") || "{}");
      const { data } = await axios.post("/api/ai/formula-sheet", {
        subject: sub,
        apiKey: settings.geminiApiKey || "",
      });
      setSheet(data.sheet);
      setSource(data.source);
      showToast(data.source === "ai" ? "Formula sheet ready! 📐" : "Sheet ready (add Gemini key for AI) 📐", "success");
    } catch {
      showToast("Failed to generate. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!sheet) return;
    const text = sheet.sections.map(s =>
      `## ${s.title}\n` + s.formulas.map(f => `${f.name}: ${f.formula}\n  ${f.description || ""}`).join("\n")
    ).join("\n\n");
    navigator.clipboard.writeText(text);
    showToast("All formulas copied!", "success");
  };

  return (
    <div className="fs-page">
      <div className="fs-hero">
        <div className="fs-eyebrow"><BookOpen size={13} /> Formula Sheet</div>
        <h1>Formula Sheet Generator</h1>
        <p>AI generates a complete, exam-ready formula cheatsheet for any subject.</p>
      </div>

      <div className="fs-controls">
        <div className="fs-subject-grid">
          {SUBJECTS.map(s => (
            <button key={s} className={`fs-subj-btn ${subject === s && !custom ? "active" : ""}`}
              onClick={() => { setSubject(s); setCustom(""); }}>{s}</button>
          ))}
        </div>
        <div className="fs-custom-row">
          <input
            className="fs-custom-input"
            placeholder="Or type a custom subject / topic..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === "Enter" && generate()}
          />
          <button className="fs-generate-btn" onClick={generate} disabled={loading}>
            <Zap size={16} /> {loading ? "Generating..." : "Generate Sheet"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="fs-loading">
          <div className="fs-spinner" />
          <p>AI is building your formula sheet for <strong>{custom || subject}</strong>...</p>
        </div>
      )}

      {sheet && !loading && (
        <div className="fs-result">
          <div className="fs-result-header">
            <div>
              <h2 className="fs-result-title">{sheet.subject} — Formula Sheet</h2>
              <span className="fs-result-meta">
                {source === "ai" ? "🤖 AI Generated" : "📋 Template"} ·{" "}
                {sheet.sections?.reduce((a, s) => a + (s.formulas?.length || 0), 0)} formulas
              </span>
            </div>
            <button className="fs-copy-all-btn" onClick={copyAll}><Copy size={14} /> Copy All</button>
          </div>
          <div className="fs-sections">
            {sheet.sections?.map((s, i) => <Section key={i} section={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}
