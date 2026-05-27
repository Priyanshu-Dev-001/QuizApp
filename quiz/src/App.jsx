import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeContext";
import Layout from "./components/layout";
import { useState } from "react";

// ================= PAGES =================
import Home from "./pages/Home";
import Login from "./pages/login";
import Register from "./pages/register";
import Contact from "./pages/contact";
import Features from "./pages/Features";

import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import Quiz from "./pages/quiz";
import Results from "./pages/Result";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import TeacherQuizList from "./pages/TeacherQuizList";
import TeacherResults from "./pages/TeacherResults";

const readInitialUser = () => {
  const stored = localStorage.getItem("user");

  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);

    return {
      ...parsed,
      role: parsed.role?.toLowerCase(),
    };
  } catch (error) {
    console.error("Invalid user data:", error);
    localStorage.removeItem("user");
    return null;
  }
};

export default function App() {
  const [user, setUser] = useState(readInitialUser);

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // ================= LOADING =================
  if (user === undefined) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#fff",
          fontSize: "18px",
          fontWeight: "600",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}

        {/* HOME */}
        <Route path="/" element={<Home />} />

        {/* LOGIN */}
        <Route path="/login" element={<Login setUser={setUser} />} />

        {/* REGISTER */}
        <Route path="/register" element={<Register />} />

        {/* CONTACT */}
        <Route path="/contact" element={<Contact />} />

        {/* ✅ FEATURES PAGE */}
        <Route path="/features" element={<Features />} />

        {/* ================= STUDENT ROUTES ================= */}

        <Route
          path="/dashboard"
          element={
            user?.role === "student" ? (
              <Layout logout={logout}>
                <StudentDashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ================= TEACHER ROUTES ================= */}

        <Route
          path="/teacher"
          element={
            user?.role === "teacher" ? (
              <Layout logout={logout}>
                <TeacherDashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/teacher-quizzes"
          element={
            user?.role === "teacher" ? (
              <Layout logout={logout}>
                <TeacherQuizList />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/teacher-results"
          element={
            user?.role === "teacher" ? (
              <Layout logout={logout}>
                <TeacherResults />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ================= COMMON PROTECTED ROUTES ================= */}

        <Route
          path="/quiz"
          element={
            user ? (
              <Layout logout={logout}>
                <Quiz />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/results"
          element={
            user ? (
              <Layout logout={logout}>
                <Results />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/leaderboard"
          element={
            user ? (
              <Layout logout={logout}>
                <Leaderboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/settings"
          element={
            user ? (
              <Layout logout={logout}>
                <Settings />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ================= FALLBACK ================= */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
