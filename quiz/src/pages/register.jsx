import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Brain,
  Rocket,
  Trophy,
  ChevronDown,
  User,
  LockKeyhole,
  ArrowRight,
  CheckCircle2,
  Star,
  KeyRound,
  Moon,
  Sun,
} from "lucide-react";

import "./register.css";

const roles = [
  {
    value: "student",
    title: "Student",
    text: "Practice quizzes and track progress.",
    icon: <Brain size={22} />,
  },
  {
    value: "teacher",
    title: "Teacher",
    text: "Create quizzes and monitor learners.",
    icon: <GraduationCap size={22} />,
  },
];

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "student",
    teacherPasskey: "",
  });

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");

  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  const selectedRole =
    roles.find((role) => role.value === form.role) || roles[0];

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

  // =========================================
  // CLOSE DROPDOWN
  // =========================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () =>
      document.removeEventListener(
        "click",
        handleClickOutside
      );
  }, []);

  // =========================================
  // HANDLE CHANGE
  // =========================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================
  // REGISTER
  // =========================================
  const register = async (e) => {
    e.preventDefault();

    try {
      // 🔥 VALIDATION
      if (!form.username.trim() || !form.password) {
        alert("⚠️ Please fill all fields");
        return;
      }

      // 🔥 TEACHER PASSKEY CHECK
      if (
        form.role === "teacher" &&
        !form.teacherPasskey.trim()
      ) {
        alert("⚠️ Teacher PassKey required");
        return;
      }

      setLoading(true);

      // 🔥 SEND DATA
      await axios.post(
        "/api/users/register",
        form
      );

      alert("✅ Registered Successfully");

      navigate("/login");

    } catch (err) {
      alert(
        err.response?.data?.message ||
          "❌ Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* ================= BACKGROUND ================= */}

      <button
        className="register-theme-btn"
        onClick={toggleTheme}
        type="button"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        <span>{theme === "dark" ? "Light" : "Dark"}</span>
      </button>

      <div className="bg-orb orb1"></div>
      <div className="bg-orb orb2"></div>
      <div className="bg-orb orb3"></div>

      <div className="register-wrapper">

        {/* ================= LEFT SIDE ================= */}

        <aside className="register-preview">

          {/* CONTENT */}

          <div className="preview-content">

            <div className="preview-badge">
              <Rocket size={16} />
              Premium Learning Platform
            </div>

            <h1>
              Build your
              <span> smart learning </span>
              experience.
            </h1>

            <p>
              Join thousands of students and teachers
              using QuizApp for quizzes, analytics,
              rankings, smooth dashboards and AI
              learning tools.
            </p>

          </div>

          {/* STATS */}

          <div className="preview-stats">

            <div className="stat-card">
              <UsersIcon />
              <h3>10K+</h3>
              <p>Students</p>
            </div>

            <div className="stat-card">
              <Trophy size={28} />
              <h3>500+</h3>
              <p>Quizzes</p>
            </div>

            <div className="stat-card">
              <ShieldCheck size={28} />
              <h3>99%</h3>
              <p>Secure</p>
            </div>

          </div>

          {/* FEATURES */}

          <div className="preview-features">

            <div className="feature-item">
              <CheckCircle2 size={18} />
              Real-time analytics dashboard
            </div>

            <div className="feature-item">
              <CheckCircle2 size={18} />
              Live leaderboard battles
            </div>

            <div className="feature-item">
              <CheckCircle2 size={18} />
              Modern animated interface
            </div>

          </div>

        </aside>

        {/* ================= RIGHT PANEL ================= */}

        <section className="register-panel">

          <div className="panel-glow"></div>

          {/* LOGO */}

          <button
            className="register-logo"
            onClick={() => navigate("/")}
            type="button"
          >
            <div className="logo-icon">
              <Sparkles size={24} />
            </div>

            <span>Home</span>
          </button>

          {/* HEADING */}

          <div className="register-heading">

            <p>
              CREATE ACCOUNT
            </p>

            <h2>
              Register to continue
            </h2>

            <span>
              Start your learning journey with QuizApp.
            </span>

          </div>

          {/* FORM */}

          <form
            className="register-form"
            onSubmit={register}
          >

            {/* USERNAME */}

            <div className="input-group">

              <label>
                Username
              </label>

              <div className="input-box">

                <User size={20} />

                <input
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  autoComplete="username"
                  value={form.username}
                  onChange={handleChange}
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="input-group">

              <label>
                Password
              </label>

              <div className="input-box">

                <LockKeyhole size={20} />

                <input
                  type="password"
                  name="password"
                  placeholder="Create password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                />

              </div>

            </div>

            {/* ROLE SELECT */}

            <div
              className="role-field"
              ref={dropdownRef}
            >

              <label>
                Select Role
              </label>

              <button
                type="button"
                className="selected-role"
                onClick={() =>
                  setOpen((prev) => !prev)
                }
              >

                <div className="selected-role-left">

                  <div className="role-icon">
                    {selectedRole.icon}
                  </div>

                  <div>

                    <strong>
                      {selectedRole.title}
                    </strong>

                    <span>
                      {selectedRole.text}
                    </span>

                  </div>

                </div>

                <ChevronDown
                  size={20}
                  className={
                    open ? "rotate-arrow" : ""
                  }
                />

              </button>

              {/* OPTIONS */}

              {open && (
                <div className="role-options">

                  {roles.map((role) => (

                    <button
                      key={role.value}
                      type="button"
                      className={
                        form.role === role.value
                          ? "role-option active-role"
                          : "role-option"
                      }
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          role: role.value,
                        }));

                        setOpen(false);
                      }}
                    >

                      <div className="role-option-icon">
                        {role.icon}
                      </div>

                      <div>

                        <strong>
                          {role.title}
                        </strong>

                        <span>
                          {role.text}
                        </span>

                      </div>

                    </button>

                  ))}

                </div>
              )}

            </div>

            {/* 🔥 TEACHER PASSKEY */}

            {form.role === "teacher" && (
              <div className="input-group">

                <label>
                  Teacher PassKey
                </label>

                <div className="input-box">

                  <KeyRound size={20} />

                  <input
                    type="password"
                    name="teacherPasskey"
                    placeholder="Enter teacher passkey"
                    value={form.teacherPasskey}
                    onChange={handleChange}
                  />

                </div>

              </div>
            )}

            {/* SUBMIT BUTTON */}

            <button
              className="register-submit"
              disabled={loading}
              type="submit"
            >

              {loading
                ? "Creating Account..."
                : "Create Account"}

              <ArrowRight size={18} />

            </button>

          </form>

          {/* FOOTER */}

          <div className="register-footer">

            <p>
              Already have an account?
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>

          </div>

          {/* FLOATING CARDS */}

          <div className="floating-card card1">
            <Star size={16} />
            Smooth UI
          </div>

          <div className="floating-card card2">
            <Brain size={16} />
            AI Learning
          </div>

        </section>

      </div>

    </div>
  );
}

// =========================================
// ICON
// =========================================
function UsersIcon() {
  return <Brain size={28} />;
}
