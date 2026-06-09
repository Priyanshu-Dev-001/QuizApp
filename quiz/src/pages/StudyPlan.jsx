import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Sparkles, CheckCircle, BookOpen, Target, Clock, Loader2, RefreshCw } from "lucide-react";
import { showToast } from "../utils/toast";
import "./study-plan.css";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "History", "Geography"];
const GOALS = ["JEE/NEET Preparation", "Board Exams", "General Improvement", "Competitive Exams", "Skill Building"];
const HOURS = ["1-2 hours/day", "2-3 hours/day", "3-4 hours/day", "4+ hours/day"];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const STUDY_TIPS = [
  "Use the Pomodoro technique: 25 min study + 5 min break",
  "Review previous day's notes before starting new topics",
  "Solve practice problems after each concept",
  "Take proper sleep — memory consolidation happens during sleep",
  "Stay hydrated and take short walks during breaks",
  "Use active recall instead of passive re-reading",
];

export default function StudyPlan() {
  const [weakSubjects, setWeakSubjects] = useState([]);
  const [goal, setGoal] = useState(GOALS[0]);
  const [hoursPerDay, setHoursPerDay] = useState(HOURS[1]);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [savedPlan, setSavedPlan] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("studyPlan"));
      if (saved) setSavedPlan(saved);
    } catch {}
  }, []);

  const toggleSubject = (sub) => {
    setWeakSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const generatePlan = async () => {
    try {
      setLoading(true);
      setPlan(null);
      const settings = JSON.parse(localStorage.getItem("quizSettings") || "{}");
      const res = await axios.post("/api/ai/study-plan", {
        weakSubjects,
        goal,
        hoursPerDay,
        apiKey: settings.geminiApiKey || ""
      });
      const newPlan = res.data.plan;
      setPlan(newPlan);
      const toSave = { plan: newPlan, weakSubjects, goal, generatedAt: new Date().toLocaleDateString() };
      setSavedPlan(toSave);
      localStorage.setItem("studyPlan", JSON.stringify(toSave));
      showToast("Study plan generated!", "success");
    } catch (err) {
      showToast("Error generating plan. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const activePlan = plan || savedPlan?.plan;

  return (
    <div className="studyplan-page">
      <div className="sp-hero">
        <div className="sp-eyebrow"><Calendar size={14} /> AI Study Planner</div>
        <h1>Your Personalized Study Plan</h1>
        <p>Tell us your weak subjects and goals. Our AI will create a custom weekly study schedule just for you.</p>
      </div>

      <div className="sp-config-card">
        <h2><Target size={20} /> Configure Your Plan</h2>

        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--sp-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>
            Select Weak / Focus Subjects
          </div>
          <div className="sp-subjects-grid">
            {SUBJECTS.map((sub) => (
              <button
                key={sub}
                className={`sp-subject-chip ${weakSubjects.includes(sub) ? "active" : ""}`}
                onClick={() => toggleSubject(sub)}
                type="button"
              >
                {weakSubjects.includes(sub) && <CheckCircle size={13} />}
                {sub}
              </button>
            ))}
          </div>
        </div>

        <div className="sp-input-grid">
          <div className="sp-input-item">
            <label>Your Goal</label>
            <select value={goal} onChange={(e) => setGoal(e.target.value)}>
              {GOALS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="sp-input-item">
            <label>Study Time Per Day</label>
            <select value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)}>
              {HOURS.map((h) => <option key={h}>{h}</option>)}
            </select>
          </div>
        </div>

        <button className="sp-generate-btn" onClick={generatePlan} disabled={loading}>
          {loading
            ? <><Loader2 size={17} className="spin" /> Generating Plan...</>
            : <><Sparkles size={17} /> {activePlan ? <><RefreshCw size={15} /> Regenerate Plan</> : "Generate My Plan"}</>
          }
        </button>

        {savedPlan && !loading && (
          <p style={{ fontSize: 12, color: "var(--sp-muted)", textAlign: "center", margin: "4px 0 0" }}>
            Last generated: {savedPlan.generatedAt}
          </p>
        )}
      </div>

      {activePlan && (
        <div className="sp-plan-section">
          <h2><Calendar size={22} /> Your Weekly Schedule</h2>
          <div className="sp-week-grid">
            {DAYS.map((day, idx) => {
              const dayData = activePlan[day] || activePlan[day.toLowerCase()] || {
                difficulty: "medium",
                tasks: [`Review ${weakSubjects[idx % weakSubjects.length] || "General"} concepts`, "Practice problems", "Quick revision"]
              };
              const difficulty = dayData.difficulty || "medium";
              return (
                <div className="sp-day-card" key={day} style={{ animationDelay: `${idx * 0.07}s` }}>
                  <div className="sp-day-header">
                    <span className="sp-day-name">{day.slice(0, 3)}</span>
                    <span className={`sp-day-badge ${day === "Sunday" ? "rest" : difficulty}`}>
                      {day === "Sunday" ? "Rest" : difficulty}
                    </span>
                  </div>
                  <div className="sp-task-list">
                    {(dayData.tasks || []).map((task, ti) => (
                      <div className="sp-task-item" key={ti}>
                        <span style={{ flex: 1 }}>{typeof task === "string" ? task : task.topic || task}</span>
                        {typeof task === "object" && task.duration && (
                          <span className="sp-task-duration">{task.duration}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="sp-tips-section">
        <h3><BookOpen size={17} /> Study Tips for Better Results</h3>
        <ul className="sp-tips-list">
          {STUDY_TIPS.map((tip, i) => <li key={i}>{tip}</li>)}
        </ul>
      </div>
    </div>
  );
}
