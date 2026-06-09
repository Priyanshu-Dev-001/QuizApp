import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeContext";
import Layout from "./components/layout";
import ToastHost from "./components/ToastHost";
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
import Flashcards from "./pages/Flashcards";
import Bookmarks from "./pages/Bookmarks";

// ================= NEW PAGES =================
import DoubtSolver from "./pages/DoubtSolver";
import MockTest from "./pages/MockTest";
import StudyPlan from "./pages/StudyPlan";
import StudyGroups from "./pages/StudyGroups";
import Progress from "./pages/Progress";
import WeaknessDetector from "./pages/WeaknessDetector";
import DailyChallenge from "./pages/DailyChallenge";
import FormulaSheet from "./pages/FormulaSheet";
import AssignmentTracker from "./pages/AssignmentTracker";
import SmartNotes from "./pages/SmartNotes";

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

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

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
      <ToastHost />
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/features" element={<Features />} />

        {/* ================= STUDENT ROUTES ================= */}
        <Route
          path="/dashboard"
          element={
            user?.role === "student" ? (
              <Layout logout={logout}><StudentDashboard /></Layout>
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
              <Layout logout={logout}><TeacherDashboard /></Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/teacher-quizzes"
          element={
            user?.role === "teacher" ? (
              <Layout logout={logout}><TeacherQuizList /></Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/teacher-results"
          element={
            user?.role === "teacher" ? (
              <Layout logout={logout}><TeacherResults /></Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ================= COMMON PROTECTED ROUTES ================= */}
        <Route
          path="/quiz"
          element={user ? <Layout logout={logout}><Quiz /></Layout> : <Navigate to="/login" replace />}
        />

        <Route
          path="/results"
          element={user ? <Layout logout={logout}><Results /></Layout> : <Navigate to="/login" replace />}
        />

        <Route
          path="/leaderboard"
          element={user ? <Layout logout={logout}><Leaderboard /></Layout> : <Navigate to="/login" replace />}
        />

        <Route
          path="/settings"
          element={user ? <Layout logout={logout}><Settings /></Layout> : <Navigate to="/login" replace />}
        />

        <Route
          path="/flashcards"
          element={user ? <Layout logout={logout}><Flashcards /></Layout> : <Navigate to="/login" replace />}
        />

        <Route
          path="/bookmarks"
          element={user ? <Layout logout={logout}><Bookmarks /></Layout> : <Navigate to="/login" replace />}
        />

        {/* ================= NEW FEATURE ROUTES ================= */}
        <Route
          path="/doubt-solver"
          element={
            user?.role === "student" ? (
              <Layout logout={logout}><DoubtSolver /></Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/mock-test"
          element={
            user?.role === "student" ? (
              <Layout logout={logout}><MockTest /></Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/study-plan"
          element={
            user?.role === "student" ? (
              <Layout logout={logout}><StudyPlan /></Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/study-groups"
          element={
            user?.role === "student" ? (
              <Layout logout={logout}><StudyGroups /></Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/progress"
          element={
            user?.role === "student" ? (
              <Layout logout={logout}><Progress /></Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/weakness-detector"
          element={
            user?.role === "student" ? (
              <Layout logout={logout}><WeaknessDetector /></Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/daily-challenge"
          element={
            user?.role === "student" ? (
              <Layout logout={logout}><DailyChallenge /></Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/formula-sheet"
          element={
            user ? <Layout logout={logout}><FormulaSheet /></Layout> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/assignments"
          element={
            user ? <Layout logout={logout}><AssignmentTracker /></Layout> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/notes"
          element={
            user ? <Layout logout={logout}><SmartNotes /></Layout> : <Navigate to="/login" replace />
          }
        />

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
