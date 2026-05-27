import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  Sparkles,
  ShieldCheck,
  Trophy,
  BarChart3,
  User,
  LockKeyhole,
  ArrowRight,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Rocket,
  CheckCircle2,
  TimerReset,
  Star,
} from "lucide-react";

import "./login.css";

export default function Login({ setUser }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState("dark");

  const navigate = useNavigate();

  useEffect(() => {
    const savedSettings =
      JSON.parse(localStorage.getItem("quizSettings")) || {};

    const activeTheme = savedSettings.theme || "dark";

    setTheme(activeTheme);
    document.body.dataset.theme = activeTheme;
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    const savedSettings =
      JSON.parse(localStorage.getItem("quizSettings")) || {};

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const login = async (e) => {
    e.preventDefault();

    try {
      if (!form.username.trim() || !form.password.trim()) {
        alert("Fill all fields");
        return;
      }

      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/users/login",
        {
          username: form.username.trim(),
          password: form.password,
        }
      );

      const user = res.data;

      localStorage.setItem("user", JSON.stringify(user));
      setUser?.(user);

      navigate(user.role === "teacher" ? "/teacher" : "/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-grid"></div>

      <button
        className="login-theme-btn"
        onClick={toggleTheme}
        type="button"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        <span>{theme === "dark" ? "Light" : "Dark"}</span>
      </button>

      <div className="login-orb login-orb-one"></div>
      <div className="login-orb login-orb-two"></div>
      <div className="login-orb login-orb-three"></div>

      <div className="login-shell">
        <section className="login-panel">
          <button
            className="login-logo"
            onClick={() => navigate("/")}
            type="button"
          >
            <span>
              <Sparkles size={24} />
            </span>
            Home
          </button>

          <div className="login-heading">
            <p>WELCOME BACK</p>
            <h1>Login to continue learning smarter.</h1>
            <span>
              Track quizzes, improve scores, and continue your learning streak.
            </span>
          </div>

          <form className="login-form" onSubmit={login}>
            <label className="login-input-group">
              <span>Username</span>

              <div className="login-input-box">
                <User size={20} />

                <input
                  name="username"
                  value={form.username}
                  placeholder="Enter your username"
                  autoComplete="username"
                  onChange={handleChange}
                />
              </div>
            </label>

            <label className="login-input-group">
              <span>Password</span>

              <div className="login-input-box">
                <LockKeyhole size={20} />

                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  onChange={handleChange}
                />

                <button
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  type="button"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div className="login-options-row">
              <label className="login-check">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <button type="button">Forgot password?</button>
            </div>

            <button
              className="login-submit"
              disabled={loading}
              type="submit"
            >
              {loading ? "Logging in..." : "Login"}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="register-link">
            Don't have an account?
            <button onClick={() => navigate("/register")} type="button">
              Register
            </button>
          </p>
        </section>

        <aside className="login-preview" aria-label="QuizApp highlights">
          <div className="login-preview-top">
            <div className="login-preview-badge">
              <Rocket size={16} />
              Live Progress
            </div>

            <div className="login-secure-pill">
              <ShieldCheck size={16} />
              Secure
            </div>
          </div>

          <h2>Track every quiz, score, and improvement streak.</h2>

          <p>
            Your dashboard keeps performance, ranks, and practice history in
            one clean place.
          </p>

          <div className="login-progress-card">
            <div className="login-progress-head">
              <div>
                <span>Today's score</span>
                <strong>86%</strong>
              </div>

              <BarChart3 size={34} />
            </div>

            <div className="login-progress-bar">
              <span />
            </div>
          </div>

          <div className="login-mini-stats">
            <div>
              <Trophy size={24} />
              <strong>12</strong>
              <span>Quizzes</span>
            </div>

            <div>
              <Star size={24} />
              <strong>4</strong>
              <span>Badges</span>
            </div>

            <div>
              <TimerReset size={24} />
              <strong>#3</strong>
              <span>Rank</span>
            </div>
          </div>

          <div className="login-feature-list">
            <div>
              <CheckCircle2 size={18} />
              Role based dashboard access
            </div>

            <div>
              <CheckCircle2 size={18} />
              Performance analytics
            </div>

            <div>
              <CheckCircle2 size={18} />
              Leaderboard tracking
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
