import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Brain,
  Trophy,
  BarChart3,
  GraduationCap,
  Sparkles,
  Moon,
  Sun,
  Zap,
  ShieldCheck,
  Clock,
  Users,
  Target,
  BookOpen,
  CheckCircle2,
  Star,
  ArrowRight,
  Play,
  Layers3,
  TrendingUp,
  Bell,
  Lock,
  Smartphone,
  Globe,
} from "lucide-react";

import "./features.css";

const mainFeatures = [
  {
    icon: <Brain size={44} />,
    title: "Smart Quizzes",
    subtitle: "AI-Powered Learning",
    description:
      "Our AI engine creates personalized subject-wise quizzes that adapt to your level. Get instant analysis after every attempt with detailed explanations for each answer.",
    points: [
      "Subject-wise question banks",
      "Instant result analysis",
      "Detailed answer explanations",
      "Adaptive difficulty levels",
    ],
    color: "#6366f1",
  },
  {
    icon: <Trophy size={44} />,
    title: "Live Rankings",
    subtitle: "Compete & Dominate",
    description:
      "Challenge students from your school and across the platform. Weekly leaderboard battles keep you motivated and push you to improve every single day.",
    points: [
      "Weekly leaderboard battles",
      "Subject-wise rankings",
      "School vs school comparison",
      "Achievement badges",
    ],
    color: "#f59e0b",
  },
  {
    icon: <BarChart3 size={44} />,
    title: "Advanced Analytics",
    subtitle: "Track Everything",
    description:
      "Deep performance analytics that show your accuracy, speed, and weak topics. Visual charts make it easy to understand exactly where you need to improve.",
    points: [
      "Real-time progress tracking",
      "Speed and accuracy metrics",
      "Weak topic identification",
      "Visual performance charts",
    ],
    color: "#10b981",
  },
  {
    icon: <GraduationCap size={44} />,
    title: "Teacher Tools",
    subtitle: "Built for Educators",
    description:
      "A complete quiz management system for teachers. Create custom quizzes, assign to students, monitor results, and export detailed performance reports as PDF.",
    points: [
      "Custom quiz creation",
      "Student performance monitoring",
      "PDF report export",
      "Subject-wise filtering",
    ],
    color: "#3b82f6",
  },
  {
    icon: <ShieldCheck size={44} />,
    title: "Secure Platform",
    subtitle: "Safe & Reliable",
    description:
      "Role-based login system separates students and teachers. All data is stored securely with a reliable backend, so your quiz history and results are always safe.",
    points: [
      "Role-based access control",
      "Secure authentication",
      "Persistent result storage",
      "Privacy first design",
    ],
    color: "#8b5cf6",
  },
  {
    icon: <Zap size={44} />,
    title: "Timed Quizzes",
    subtitle: "Real Exam Pressure",
    description:
      "Practice under real exam conditions with countdown timers. Auto-submit feature ensures your answers are recorded even if time runs out, just like the real thing.",
    points: [
      "Countdown timer per question",
      "Auto-submit on timeout",
      "Time pressure simulation",
      "Speed improvement tracking",
    ],
    color: "#06b6d4",
  },
];

const quickFeatures = [
  {
    icon: <Clock size={28} />,
    title: "24/7 Availability",
    text: "Quiz anytime, anywhere, on any device.",
  },
  {
    icon: <Smartphone size={28} />,
    title: "Mobile Friendly",
    text: "Fully responsive design for phones and tablets.",
  },
  {
    icon: <Globe size={28} />,
    title: "Multiple Subjects",
    text: "Math, Physics, Chemistry, Biology, CS, English.",
  },
  {
    icon: <Bell size={28} />,
    title: "Instant Feedback",
    text: "Know your score the moment you submit.",
  },
  {
    icon: <Layers3 size={28} />,
    title: "500+ Questions",
    text: "Large question bank growing every week.",
  },
  {
    icon: <TrendingUp size={28} />,
    title: "Progress Graphs",
    text: "Visual charts to track your improvement.",
  },
  {
    icon: <Target size={28} />,
    title: "Accuracy Tracking",
    text: "Know exactly how accurate you are per subject.",
  },
  {
    icon: <Lock size={28} />,
    title: "Safe Login",
    text: "Secure credentials with role-based access.",
  },
  {
    icon: <Star size={28} />,
    title: "Leaderboards",
    text: "Weekly rankings to keep you motivated.",
  },
  {
    icon: <BookOpen size={28} />,
    title: "Quiz Library",
    text: "Browse all available quizzes by subject.",
  },
  {
    icon: <Users size={28} />,
    title: "10K+ Students",
    text: "A growing community of active learners.",
  },
  {
    icon: <CheckCircle2 size={28} />,
    title: "98% Success Rate",
    text: "Students consistently improve their scores.",
  },
];

const readSavedTheme = () => {
  try {
    return JSON.parse(localStorage.getItem("quizSettings"))?.theme || "dark";
  } catch (error) {
    console.error("Invalid quiz settings:", error);
    return "dark";
  }
};

const readSavedSettings = () => {
  try {
    return JSON.parse(localStorage.getItem("quizSettings")) || {};
  } catch (error) {
    console.error("Invalid quiz settings:", error);
    return {};
  }
};

export default function Features() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(readSavedTheme);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    const savedSettings = readSavedSettings();

    localStorage.setItem(
      "quizSettings",
      JSON.stringify({
        ...savedSettings,
        theme: nextTheme,
      })
    );

    document.body.dataset.theme = nextTheme;
    setTheme(nextTheme);
  };

  return (
    <div className="feat-container">
      <div className="feat-glow feat-glow1"></div>
      <div className="feat-glow feat-glow2"></div>
      <div className="feat-glow feat-glow3"></div>

      {/* ===== HEADER ===== */}
      <header className="feat-header">
        <button
          className="feat-logo"
          onClick={() => navigate("/")}
          type="button"
        >
          <div className="feat-logo-mark">
            <Sparkles size={24} />
          </div>

          <span>QuizApp</span>
        </button>

        {/* ===== SAME NAVBAR AS HOME ===== */}
        <nav className="feat-nav">
          <button
            onClick={() => navigate("/")}
            type="button"
          >
            Home
          </button>

          <button
            onClick={() => navigate("/#subjects")}
            type="button"
          >
            Subjects
          </button>

          <button
            onClick={() => navigate("/#reviews")}
            type="button"
          >
            Reviews
          </button>

          <button
            onClick={() => navigate("/features")}
            type="button"
          >
            All Features
          </button>

          <button
            onClick={() => navigate("/contact")}
            type="button"
          >
            Contact
          </button>
        </nav>

        <div className="feat-header-actions">
          <button
            className="feat-theme-btn"
            onClick={toggleTheme}
            type="button"
          >
            {theme === "dark" ? (
              <Sun size={17} />
            ) : (
              <Moon size={17} />
            )}

            {theme === "dark" ? "Light" : "Dark"}
          </button>

          <button
            className="feat-login-btn"
            onClick={() => navigate("/login")}
            type="button"
          >
            Login
          </button>

          <button
            className="feat-register-btn"
            onClick={() => navigate("/register")}
            type="button"
          >
            Register
          </button>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="feat-hero">
        <div className="feat-hero-badge">
          <Zap size={16} />
          <span>Everything you need to excel</span>
        </div>

        <h1>
          Platform <span>Features</span>
        </h1>

        <p>
          QuizApp is packed with powerful tools for students and teachers alike.
          From AI-powered quizzes to deep analytics — everything is built to
          help you learn faster and smarter.
        </p>

        <div className="feat-hero-btns">
          <button
            className="feat-primary-btn"
            onClick={() => navigate("/register")}
            type="button"
          >
            <Play size={17} />
            Get Started Free
          </button>

          <button
            className="feat-secondary-btn"
            onClick={() => navigate("/login")}
            type="button"
          >
            Already have account
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* ===== MAIN FEATURES ===== */}
      <section className="feat-main-section">
        <div className="feat-section-heading">
          <p>CORE FEATURES</p>
          <h2>Everything built for you.</h2>
        </div>

        <div className="feat-main-grid">
          {mainFeatures.map((f, i) => (
            <article
              className="feat-main-card"
              key={f.title}
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div
                className="feat-main-icon"
                style={{
                  color: f.color,
                  background: `${f.color}18`,
                }}
              >
                {f.icon}
              </div>

              <div className="feat-main-tag">
                {f.subtitle}
              </div>

              <h3>{f.title}</h3>

              <p>{f.description}</p>

              <ul className="feat-points">
                {f.points.map((point) => (
                  <li key={point}>
                    <CheckCircle2
                      size={16}
                      style={{ color: f.color }}
                    />

                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <button
                className="feat-card-btn"
                onClick={() => navigate("/register")}
                type="button"
                style={{
                  background: f.color,
                }}
              >
                Try Now
                <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* ===== QUICK FEATURES ===== */}
      <section className="feat-quick-section">
        <div className="feat-section-heading">
          <p>AND MUCH MORE</p>
          <h2>Packed with powerful extras.</h2>
        </div>

        <div className="feat-quick-grid">
          {quickFeatures.map((f) => (
            <div
              className="feat-quick-card"
              key={f.title}
            >
              <div className="feat-quick-icon">
                {f.icon}
              </div>

              <h4>{f.title}</h4>

              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="feat-cta-section">
        <div className="feat-cta-box">
          <p>READY TO START?</p>

          <h2>
            Join 10,000+ students already learning smarter.
          </h2>

          <button
            className="feat-cta-btn"
            onClick={() => navigate("/register")}
            type="button"
          >
            Create Free Account
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="feat-footer">
        <div>
          <h2>QuizApp</h2>

          <p>
            Modern animated learning platform for students and teachers.
          </p>
        </div>

        <div className="feat-footer-links">
          <button
            onClick={() => navigate("/")}
            type="button"
          >
            Home
          </button>

          <button
            onClick={() => navigate("/features")}
            type="button"
          >
            Features
          </button>

          <button
            onClick={() => navigate("/login")}
            type="button"
          >
            Login
          </button>

          <button
            onClick={() => navigate("/register")}
            type="button"
          >
            Register
          </button>
        </div>
      </footer>
    </div>
  );
}
