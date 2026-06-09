import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Sparkles, Trophy, Flame, Award, Calendar, BookOpen, Layers, Bookmark, Brain, FileText, Users, TrendingUp, AlertTriangle, Sigma, ClipboardList, StickyNote } from "lucide-react";
import { showToast } from "../utils/toast";
import QuizCopilot from "../components/QuizCopilot";
import BadgesXP from "../components/BadgesXP";
import ExamCountdown from "../components/ExamCountdown";
import "./student.css";

const actions = [
  {
    title: "Take Quiz",
    text: "Start subject-wise practice quizzes.",
    path: "/quiz",
    meta: "Practice",
    icon: <BookOpen size={20} />,
    highlight: false,
  },
  {
    title: "Mock Test",
    text: "JEE/NEET style timed test with negative marking.",
    path: "/mock-test",
    meta: "🆕 Exam Prep",
    icon: <FileText size={20} />,
    highlight: true,
  },
  {
    title: "Doubt Solver",
    text: "Upload photo or type your doubt — AI solves it.",
    path: "/doubt-solver",
    meta: "🆕 AI Powered",
    icon: <Brain size={20} />,
    highlight: true,
  },
  {
    title: "Study Plan",
    text: "Get a personalized AI weekly study schedule.",
    path: "/study-plan",
    meta: "🆕 AI Plan",
    icon: <Calendar size={20} />,
    highlight: true,
  },
  {
    title: "Study Groups",
    text: "Create groups & compete with friends.",
    path: "/study-groups",
    meta: "🆕 Social",
    icon: <Users size={20} />,
    highlight: true,
  },
  {
    title: "Progress Charts",
    text: "Score trends, subject analysis & skill radar.",
    path: "/progress",
    meta: "🆕 Analytics",
    icon: <TrendingUp size={20} />,
    highlight: true,
  },
  {
    title: "Weakness Detector",
    text: "AI finds your weak spots & gives targeted practice.",
    path: "/weakness-detector",
    meta: "🆕 AI Insights",
    icon: <AlertTriangle size={20} />,
    highlight: true,
  },
  {
    title: "Daily Challenge",
    text: "10 questions daily · earn XP · maintain streak!",
    path: "/daily-challenge",
    meta: "🆕 Daily XP",
    icon: <Flame size={20} />,
    highlight: true,
  },
  {
    title: "Formula Sheet",
    text: "AI generates complete formula cheatsheets instantly.",
    path: "/formula-sheet",
    meta: "🆕 AI Tool",
    icon: <Sigma size={20} />,
    highlight: true,
  },
  {
    title: "Assignments",
    text: "Track homework, deadlines & never miss a submission.",
    path: "/assignments",
    meta: "🆕 Tracker",
    icon: <ClipboardList size={20} />,
    highlight: true,
  },
  {
    title: "Smart Notes",
    text: "Write & organize subject-wise notes with color tags.",
    path: "/notes",
    meta: "🆕 Notes",
    icon: <StickyNote size={20} />,
    highlight: true,
  },
  {
    title: "AI Flashcards",
    text: "Generate interactive study decks using AI.",
    path: "/flashcards",
    meta: "AI Study",
    icon: <Layers size={20} />,
    highlight: false,
  },
  {
    title: "Bookmarks",
    text: "Review and revise your bookmarked questions.",
    path: "/bookmarks",
    meta: "Revision",
    icon: <Bookmark size={20} />,
    highlight: false,
  },
  {
    title: "Results",
    text: "Review scores and improvement areas.",
    path: "/results",
    meta: "Analytics",
    icon: <Trophy size={20} />,
    highlight: false,
  },
  {
    title: "Leaderboard",
    text: "See top performers and your rank.",
    path: "/leaderboard",
    meta: "Compete",
    icon: <Sparkles size={20} />,
    highlight: false,
  },
  {
    title: "Settings",
    text: "Manage your profile and preferences.",
    path: "/settings",
    meta: "Account",
    icon: <Award size={20} />,
    highlight: false,
  },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { value: "0", label: "Quizzes Taken" },
    { value: "0%", label: "Average Score" },
    { value: "#-", label: "Current Rank" },
  ]);
  const [todayProgress, setTodayProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpNeeded, setXpNeeded] = useState(100);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUser(storedUser);

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all results to calculate dynamic ranks and student statistics
        const res = await axios.get("/api/results");
        const allResults = res.data || [];

        // Filter results for this specific student
        const studentResults = allResults.filter(
          (r) => r.username === storedUser.username
        );

        // 1. Quizzes Taken
        const quizzesTaken = studentResults.length;

        // 2. Average Score percentage using correct marking formula bounded at 0
        let totalPct = 0;
        let perfectScoresCount = 0;
        studentResults.forEach((r) => {
          const correct = r.score;
          const wrong = r.total - r.score;
          const obtained = Math.max(0, correct * 2 - wrong * 0.25);
          const max = r.total * 2;
          const pct = max > 0 ? (obtained / max) * 100 : 0;
          totalPct += pct;

          if (correct === r.total) {
            perfectScoresCount++;
          }
        });
        const averageScore =
          quizzesTaken > 0 ? Math.round(totalPct / quizzesTaken) : 0;

        // 3. Dynamic Rank Calculation compared to all students
        const studentAverages = {};
        allResults.forEach((r) => {
          if (!studentAverages[r.username]) {
            studentAverages[r.username] = [];
          }
          studentAverages[r.username].push(r);
        });

        const leaderboard = Object.keys(studentAverages)
          .map((username) => {
            const attempts = studentAverages[username];
            let sumPct = 0;
            attempts.forEach((r) => {
              const correct = r.score;
              const wrong = r.total - r.score;
              const obtained = Math.max(0, correct * 2 - wrong * 0.25);
              const max = r.total * 2;
              sumPct += max > 0 ? (obtained / max) * 100 : 0;
            });
            return {
              username,
              avg: sumPct / attempts.length,
            };
          })
          .sort((a, b) => b.avg - a.avg);

        const rankIndex = leaderboard.findIndex(
          (item) => item.username === storedUser.username
        );
        const rankValue = rankIndex !== -1 ? `#${rankIndex + 1}` : "#-";

        setStats([
          { value: String(quizzesTaken), label: "Quizzes Taken" },
          { value: `${averageScore}%`, label: "Average Score" },
          { value: rankValue, label: "Current Rank" },
        ]);

        setTodayProgress(averageScore);

        // 4. Calculate Level and XP based on correct answers
        const totalCorrectAnswers = studentResults.reduce(
          (sum, r) => sum + r.score,
          0
        );
        const accumulatedXp = totalCorrectAnswers * 15; // 15 XP per correct answer
        const computedLevel = Math.floor(accumulatedXp / 100) + 1;
        const currentXpInLevel = accumulatedXp % 100;

        setLevel(computedLevel);
        setXp(currentXpInLevel);

        // 5. Daily Streak calculation
        const uniqueDates = [
          ...new Set(
            studentResults.map((r) => new Date(r.date).toDateString())
          ),
        ].map((d) => new Date(d));

        uniqueDates.sort((a, b) => b - a); // Sort descending

        let computedStreak = 0;
        if (uniqueDates.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const diffTime = Math.abs(today - uniqueDates[0]);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // If last attempt was today or yesterday, start streak calculation
          if (diffDays <= 1) {
            computedStreak = 1;
            for (let i = 0; i < uniqueDates.length - 1; i++) {
              const diffBetween = Math.abs(uniqueDates[i] - uniqueDates[i + 1]);
              const daysBetween = Math.ceil(
                diffBetween / (1000 * 60 * 60 * 24)
              );
              if (daysBetween === 1) {
                computedStreak++;
              } else if (daysBetween > 1) {
                break;
              }
            }
          }
        }
        setStreak(computedStreak);

        // 6. Badges & Achievements unlocked
        const earnedBadges = [];
        if (quizzesTaken >= 1) {
          earnedBadges.push({
            name: "Scholar Novice",
            desc: "Completed your first quiz!",
            color: "gold",
          });
        }
        if (quizzesTaken >= 10) {
          earnedBadges.push({
            name: "Tenacious",
            desc: "Completed 10 quizzes!",
            color: "purple",
          });
        }
        if (perfectScoresCount >= 1) {
          earnedBadges.push({
            name: "Bullseye",
            desc: "Scored 100% correct!",
            color: "emerald",
          });
        }
        if (computedStreak >= 3) {
          earnedBadges.push({
            name: "Streak Master",
            desc: "Maintained a 3-day streak!",
            color: "orange",
          });
        }
        setBadges(earnedBadges);
      } catch (err) {
        console.error("Dashboard calculation error:", err);
        showToast("Error loading statistics", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <div className="student-page">
      <section className="student-hero">
        <div className="hero-content">
          <p className="student-eyebrow">Student dashboard</p>
          <h1>Welcome back, {user?.username || "Student"}</h1>
          <p className="hero-text">
            Keep your practice streak alive, level up your knowledge, and track your metrics in real-time.
          </p>

          {/* XP & Level Progress Bar */}
          <div className="level-status-card">
            <div className="level-badge">
              <span>LEVEL</span>
              <strong>{level}</strong>
            </div>
            <div className="xp-bar-wrapper">
              <div className="xp-bar-labels">
                <span>{xp} / {xpNeeded} XP to Level {level + 1}</span>
                <span className="sparkle-text">
                  <Sparkles size={14} className="inline-icon" /> +15 XP per correct answer
                </span>
              </div>
              <div className="xp-progress-track">
                <div
                  className="xp-progress-fill"
                  style={{ width: `${(xp / xpNeeded) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="hero-btn-row">
            <button className="hero-btn" onClick={() => navigate("/quiz")}>
              Start Practice Quiz
            </button>
            {streak > 0 && (
              <span className="streak-indicator">
                <Flame size={20} className="flame-icon animate-pulse" />
                <strong>{streak} Day Streak!</strong>
              </span>
            )}
          </div>
        </div>

        <div className="score-preview">
          <span>Overall Standing</span>
          <strong>{stats[1].value}</strong>
          <div className="progress-track">
            <div style={{ width: stats[1].value }} />
          </div>
          <p>
            {todayProgress >= 80
              ? "Exceptional! You are currently scoring top-tier marks."
              : "Consistency is key. Regular practice will boost your score!"}
          </p>
        </div>
      </section>

      {/* STATS SUMMARY CARDS */}
      <section className="student-stats">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      {/* BADGES XP + EXAM COUNTDOWN ROW */}
      <section style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20, alignItems:"start" }} className="bxp-ec-row">
        <BadgesXP />
        <ExamCountdown />
      </section>

      {/* DASHBOARD DIRECT ACTIONS */}
      <section className="dashboard-actions">
        {actions.map((item) => (
          <button
            className={`student-card ${item.highlight ? "student-card--new" : ""}`}
            key={item.path}
            onClick={() => navigate(item.path)}
            type="button"
          >
            <span className="card-meta">
              {item.icon}
              {item.meta}
            </span>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </button>
        ))}
      </section>
      
      {/* Supportive AI Study Companion */}
      <QuizCopilot />
    </div>
  );
}