import { useState, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Brain, Upload, X, Sparkles, History, Trash2, Image, MessageSquare, Loader2, CheckCircle } from "lucide-react";
import { showToast } from "../utils/toast";
import "./doubt-solver.css";

export default function DoubtSolver() {
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("doubtHistory") || "[]"); } catch { return []; }
  });
  const fileRef = useRef(null);

  const handleImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      const base64 = e.target.result.split(",")[1];
      setImage({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleImage(e.dataTransfer.files[0]);
  };

  const handleSolve = async () => {
    if (!question.trim() && !image) {
      showToast("Type a question or upload an image", "error");
      return;
    }
    try {
      setLoading(true);
      setAnswer(null);
      const settings = JSON.parse(localStorage.getItem("quizSettings") || "{}");
      const res = await axios.post("/api/ai/solve-doubt", {
        question: question.trim(),
        image,
        apiKey: settings.geminiApiKey || ""
      });
      const sol = res.data.solution;
      setAnswer(sol);
      const entry = {
        id: Date.now(),
        question: question.trim() || "Image question",
        answer: sol,
        hasImage: !!image,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      const newHistory = [entry, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem("doubtHistory", JSON.stringify(newHistory));
    } catch (err) {
      showToast("Error solving doubt. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("doubtHistory");
    showToast("History cleared", "success");
  };

  const loadHistoryItem = (item) => {
    setQuestion(item.question === "Image question" ? "" : item.question);
    setAnswer(item.answer);
    setImage(null);
    setImagePreview(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="doubt-page">
      <div className="ds-hero">
        <div className="ds-hero-eyebrow">
          <Brain size={14} /> AI Doubt Solver
        </div>
        <h1>Solve Any Doubt Instantly</h1>
        <p>Type your question or upload a photo of your notes/textbook. Our AI will explain it step-by-step.</p>
      </div>

      <div className="ds-input-card">
        <h2><MessageSquare size={20} /> Your Question</h2>

        <textarea
          className="ds-textarea"
          placeholder="Type your question here... e.g. 'What is Newton's second law?' or 'Solve: 2x + 5 = 15'"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSolve(); }}
        />

        {!imagePreview ? (
          <div
            className={`ds-upload-zone ${dragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={32} />
            <strong>Drop image here or click to upload</strong>
            <span>JPG, PNG, WEBP up to 5MB — upload a photo of your notes or textbook</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleImage(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="ds-img-preview">
            <img src={imagePreview} alt="Question" />
            <button className="ds-img-remove" onClick={() => { setImage(null); setImagePreview(null); }}>
              <X size={14} />
            </button>
          </div>
        )}

        <button className="ds-solve-btn" onClick={handleSolve} disabled={loading}>
          {loading ? <><Loader2 size={18} className="spin" /> Solving...</> : <><Sparkles size={18} /> Solve with AI</>}
        </button>
      </div>

      {answer && (
        <div className="ds-answer-card">
          <div className="ds-answer-header">
            <div className="ds-answer-badge"><CheckCircle size={15} /> AI Solution</div>
          </div>
          <div className="ds-answer-text ds-markdown"><ReactMarkdown>{answer}</ReactMarkdown></div>
        </div>
      )}

      {history.length > 0 && (
        <div className="ds-history-section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h2><History size={20} /> Recent Doubts</h2>
            <button className="ds-clear-btn" onClick={clearHistory}><Trash2 size={14} /> Clear All</button>
          </div>
          <div className="ds-history-grid">
            {history.map((item) => (
              <div className="ds-history-item" key={item.id} onClick={() => loadHistoryItem(item)}>
                <strong>{item.hasImage ? "📷 " : ""}{item.question.slice(0, 80)}{item.question.length > 80 ? "…" : ""}</strong>
                <span>{item.hasImage && <Image size={12} />} {item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ds-tips-grid">
        {[
          { icon: "📸", title: "Photo of Notes", desc: "Snap your handwritten notes or textbook pages" },
          { icon: "➗", title: "Math Problems", desc: "Algebra, geometry, calculus — anything" },
          { icon: "🔬", title: "Science Concepts", desc: "Physics, Chemistry, Biology explained simply" },
          { icon: "📝", title: "Step-by-Step", desc: "Get detailed solutions, not just answers" },
        ].map((t) => (
          <div className="ds-tip-card" key={t.title}>
            <span className="tip-icon">{t.icon}</span>
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
