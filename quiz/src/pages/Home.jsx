import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Brain,
  Trophy,
  BarChart3,
  GraduationCap,
  Atom,
  Calculator,
  FlaskConical,
  Code2,
  BookOpen,
  Rocket,
  Star,
  Play,
  ChevronRight,
  Sparkles,
  Users,
  ShieldCheck,
  TimerReset,
  Medal,
  Laptop,
  Target,
  Crown,
  Flame,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Layers3,
  Lightbulb,
  Award,
  Moon,
  Sun,
} from "lucide-react";

import "./home.css";

const features = [
  {
    title: "Smart Quizzes",
    text: "AI-based subject-wise quizzes with instant analysis and review.",
    icon: <Brain size={38} />,
  },
  {
    title: "Live Rankings",
    text: "Challenge your friends and dominate weekly leaderboard battles.",
    icon: <Trophy size={38} />,
  },
  {
    title: "Analytics",
    text: "Track progress, speed, accuracy and weak topics in real-time.",
    icon: <BarChart3 size={38} />,
  },
  {
    title: "Teacher Tools",
    text: "Teachers can create quizzes and monitor student performance.",
    icon: <GraduationCap size={38} />,
  },
];

const subjects = [
  { title: "Mathematics", icon: <Calculator size={52} /> },
  { title: "Physics",     icon: <Rocket size={52} /> },
  { title: "Chemistry",   icon: <FlaskConical size={52} /> },
  { title: "Biology",     icon: <Atom size={52} /> },
  { title: "Computer Science", icon: <Code2 size={52} /> },
  { title: "English",     icon: <BookOpen size={52} /> },
];

const stats = [
  { value: "10K+", label: "Students",     icon: <Users size={34} /> },
  { value: "500+", label: "Quizzes",      icon: <Layers3 size={34} /> },
  { value: "98%",  label: "Success Rate", icon: <TrendingUp size={34} /> },
  { value: "120+", label: "Schools",      icon: <Award size={34} /> },
];

const reviews = [
  {
    name: "Priyanshu",
    role: "Student",
    text: "The animations and dashboard experience feel premium and super smooth.",
  },
  {
    name: "Mohit",
    role: "Teacher",
    text: "Creating quizzes and checking results became very easy.",
  },
  {
    name: "Sagar",
    role: "Learner",
    text: "Leaderboard battles motivate me to practice every single day.",
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

export default function Home() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(readSavedTheme);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const savedSettings = readSavedSettings();
    localStorage.setItem("quizSettings", JSON.stringify({ ...savedSettings, theme: nextTheme }));
    document.body.dataset.theme = nextTheme;
    setTheme(nextTheme);
  };

  return (
    <div className="home-container">
      <div className="bg-glow glow1"></div>
      <div className="bg-glow glow2"></div>
      <div className="bg-glow glow3"></div>

      {/* ===== HEADER ===== */}
      <header className="home-header">
        <button className="logo" onClick={() => navigate("/")} type="button">
          <div className="logo-mark">
            <Sparkles size={24} />
          </div>
          <span>QuizApp</span>
        </button>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#subjects">Subjects</a>
          <a href="#reviews">Reviews</a>
          

          {/* ✅ Features page link added in header */}
          <button
            className="contact-nav-btn"
            onClick={() => navigate("/features")}
            type="button"
          >
            All Features
          </button>

          <button
            className="contact-nav-btn"
            onClick={() => navigate("/contact")}
            type="button"
          >
            Contact
          </button>
        </nav>

        <div className="auth-buttons">
          <button className="theme-toggle-btn" onClick={toggleTheme} type="button">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>

          <button className="login-btn" onClick={() => navigate("/login")}>
            Login
          </button>

          <button className="register-btn" onClick={() => navigate("/register")}>
            Register
          </button>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero-section" id="home">
        <div className="hero-left">
          <div className="hero-badge">
            <Flame size={18} />
            <span>Modern Animated Learning Platform</span>
          </div>

          <h1>
            Experience the future of <span>quiz learning.</span>
          </h1>

          <p className="hero-text">
            QuizApp combines AI-powered quizzes, advanced analytics, beautiful
            animations, live rankings, and real-time performance tracking in one
            modern platform.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn" onClick={() => navigate("/register")}>
              <Play size={18} />
              Start Learning
            </button>

            <button className="secondary-btn" type="button" onClick={() => navigate("/features")}>
              Explore Platform
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="hero-mini-grid">
            <div className="mini-card">
              <Users size={26} />
              <h3>10K+</h3>
              <p>Active Learners</p>
            </div>
            <div className="mini-card">
              <Target size={26} />
              <h3>95%</h3>
              <p>Accuracy Rate</p>
            </div>
            <div className="mini-card">
              <TimerReset size={26} />
              <h3>24/7</h3>
              <p>Accessibility</p>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="quiz-preview">
            <div className="preview-header">
              <div>
                <p>Science Challenge</p>
                <span>Live Quiz Battle</span>
              </div>
              <strong>08:24</strong>
            </div>

            <div className="question-card">
              <h3>Which planet is called the Red Planet?</h3>
              <div className="answer-grid">
                <button type="button">Earth</button>
                <button type="button" className="active-answer">Mars</button>
                <button type="button">Venus</button>
                <button type="button">Jupiter</button>
              </div>
            </div>

            <div className="progress-wrapper">
              <div className="progress-top">
                <span>Quiz Progress</span>
                <span>86%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>

            <div className="quiz-bottom">
              <div className="bottom-box">
                <h4>25+</h4>
                <p>Questions</p>
              </div>
              <div className="bottom-box">
                <h4>#2</h4>
                <p>Rank</p>
              </div>
              <div className="bottom-box">
                <h4>15m</h4>
                <p>Duration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features-section" id="features">
        <div className="section-heading">
          <p>PLATFORM FEATURES</p>
          <h2>Powerful features built for modern learners.</h2>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              {/* ✅ Learn More → /features page */}
              <button type="button" onClick={() => navigate("/features")}>
                Learn More
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ===== SUBJECTS ===== */}
      <section className="subjects-section" id="subjects">
        <div className="section-heading">
          <p>SUBJECTS</p>
          <h2>Interactive animated subject categories.</h2>
        </div>

        <div className="subjects-grid">
          {subjects.map((subject) => (
            <div className="subject-card" key={subject.title}>
              <div className="subject-icon">{subject.icon}</div>
              <h3>{subject.title}</h3>
              <p>Smart quizzes with concepts, analytics and interactive practice.</p>
              {/* ✅ Start Subject → /register page */}
              <button type="button" onClick={() => navigate("/register")}>
                Start Subject
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ===== WHY ===== */}
      <section className="why-section">
        <div className="why-left">
          <p>WHY QUIZAPP</p>
          <h2>Built for speed, smoothness and performance.</h2>
          <div className="why-list">
            <div className="why-item">
              <CheckCircle2 size={24} />
              <span>Real-time quiz analytics</span>
            </div>
            <div className="why-item">
              <ShieldCheck size={24} />
              <span>Secure login system</span>
            </div>
            <div className="why-item">
              <Laptop size={24} />
              <span>Responsive premium UI</span>
            </div>
            <div className="why-item">
              <Lightbulb size={24} />
              <span>AI learning experience</span>
            </div>
          </div>
        </div>

        <div className="why-right">
          <div className="why-card">
            <div className="floating-icon crown"><Crown size={24} /></div>
            <div className="floating-icon medal"><Medal size={24} /></div>
            <div className="floating-icon star"><Star size={24} /></div>
            <h3>Weekly Leaderboard</h3>
            <div className="chart-area">
              <div className="bar bar1"></div>
              <div className="bar bar2"></div>
              <div className="bar bar3"></div>
              <div className="bar bar4"></div>
              <div className="bar bar5"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="stats-section" id="stats">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-icon">{stat.icon}</div>
            <h2>{stat.value}</h2>
            <p>{stat.label}</p>
          </div>
        ))}
      </section>

      {/* ===== REVIEWS ===== */}
      <section className="reviews-section" id="reviews">
        <div className="section-heading">
          <p>USER REVIEWS</p>
          <h2>What students and teachers say.</h2>
        </div>

        <div className="reviews-grid">
          {reviews.map((review) => (
            <div className="review-card" key={review.name}>
              <div className="review-top">
                <div className="review-avatar">{review.name.charAt(0)}</div>
                <div>
                  <h4>{review.name}</h4>
                  <span>{review.role}</span>
                </div>
              </div>
              <MessageSquare size={24} />
              <p>"{review.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section">
        <div className="cta-box">
          <p>START YOUR JOURNEY</p>
          <h2>Ready to improve your learning experience?</h2>
          <button className="cta-btn" onClick={() => navigate("/register")}>
            Create Free Account
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-left">
          <h2>QuizApp</h2>
          <p>Modern animated learning platform for students and teachers.</p>
        </div>

        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#subjects">Subjects</a>
          <a href="#reviews">Reviews</a>
        </div>
      </footer>
    </div>
  );
}
