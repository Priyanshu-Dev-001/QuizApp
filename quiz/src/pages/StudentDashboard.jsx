import { useNavigate } from "react-router-dom";
import "./student.css";

const actions = [
  {
    title: "Take Quiz",
    text: "Start subject-wise practice quizzes.",
    path: "/quiz",
    meta: "Practice",
  },
  {
    title: "Results",
    text: "Review scores and improvement areas.",
    path: "/results",
    meta: "Analytics",
  },
  {
    title: "Leaderboard",
    text: "See top performers and your rank.",
    path: "/leaderboard",
    meta: "Compete",
  },
  {
    title: "Settings",
    text: "Manage your profile and preferences.",
    path: "/settings",
    meta: "Account",
  },
];

const stats = [
  { value: "12", label: "Quizzes Taken" },
  { value: "86%", label: "Average Score" },
  { value: "#3", label: "Current Rank" },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="student-page">
      <section className="student-hero">
        <div>
          <p className="student-eyebrow">Student dashboard</p>
          <h1>Welcome, {user?.username || "Student"}</h1>
          <p className="hero-text">
            Keep your practice streak alive, track your progress, and jump into
            your next quiz when you are ready.
          </p>
          <button className="hero-btn" onClick={() => navigate("/quiz")}>
            Start Quiz
          </button>
        </div>

        <div className="score-preview">
          <span>Today's progress</span>
          <strong>86%</strong>
          <div className="progress-track">
            <div />
          </div>
          <p>Great pace. One more quiz can push your weekly score higher.</p>
        </div>
      </section>

      <section className="student-stats">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="dashboard-actions">
        {actions.map((item) => (
          <button
            className="student-card"
            key={item.path}
            onClick={() => navigate(item.path)}
            type="button"
          >
            <span className="card-meta">{item.meta}</span>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </button>
        ))}
      </section>
    </div>
  );
}