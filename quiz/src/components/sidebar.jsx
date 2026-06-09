import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  FaBook,
  FaChartBar,
  FaCog,
  FaHome,
  FaTrophy,
  FaClone,
  FaBookmark,
  FaUsers,
  FaCalendarAlt,
  FaLightbulb,
} from "react-icons/fa";
import { Sparkles, FileText, TrendingUp, AlertTriangle, Flame, Sigma, ClipboardList, StickyNote } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  PROFILE_UPDATED_EVENT,
  readStoredProfile,
  readStoredUser,
  saveProfileSnapshot,
} from "../utils/profileSync";
import "./sidebar.css";

const getInitialSidebarProfile = () => {
  const user = readStoredUser();
  const localProfile = readStoredProfile(user?._id);

  return {
    role: user?.role?.toLowerCase() || "student",
    username: user?.username || "",
    avatar: localProfile.photo || "",
    fullName: localProfile.fullName || "",
  };
};

export default function Sidebar() {
  const [profileState, setProfileState] = useState(getInitialSidebarProfile);

  const navigate = useNavigate();
  const location = useLocation();

  const applyProfile = useCallback((profile) => {
    setProfileState((prev) => ({
      ...prev,
      avatar: profile?.photo || "",
      fullName: profile?.fullName || "",
    }));
  }, []);

  const loadProfile = useCallback(async () => {
    const user = readStoredUser();

    if (!user?._id) return;

    try {
      const res = await axios.get(
        `/api/profile/${user._id}`
      );

      const profile = res.data;

      if (profile) {
        const syncedProfile = saveProfileSnapshot(
          {
            ...profile,
            userId: user._id,
          },
          user
        );

        applyProfile(syncedProfile);
      }
    } catch (err) {
      console.log("Sidebar profile error:", err.message);
    }
  }, [applyProfile]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadProfile();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadProfile]);

  useEffect(() => {
    const update = (event) => {
      if (event?.detail) {
        applyProfile(event.detail);
        return;
      }

      setProfileState(getInitialSidebarProfile());
      loadProfile();
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [applyProfile, loadProfile]);

  const { role, username, avatar, fullName } = profileState;
  const dashboardPath = role === "teacher" ? "/teacher" : "/dashboard";
  const quizPath = role === "teacher" ? "/teacher-quizzes" : "/quiz";
  const resultPath = role === "teacher" ? "/teacher-results" : "/results";

  const menu = [
    { name: "Dashboard", path: dashboardPath, icon: <FaHome /> },
    {
      name: role === "teacher" ? "My Quizzes" : "Quiz",
      path: quizPath,
      icon: <FaBook />,
    },
    ...(role === "student"
      ? [
          { name: "Mock Test", path: "/mock-test", icon: <FileText size={14} /> },
          { name: "Doubt Solver", path: "/doubt-solver", icon: <FaLightbulb /> },
          { name: "Flashcards", path: "/flashcards", icon: <FaClone /> },
          { name: "Study Plan", path: "/study-plan", icon: <FaCalendarAlt /> },
          { name: "Study Groups", path: "/study-groups", icon: <FaUsers /> },
          { name: "Bookmarks", path: "/bookmarks", icon: <FaBookmark /> },
          { name: "Progress", path: "/progress", icon: <TrendingUp size={14} /> },
          { name: "Weak Spots", path: "/weakness-detector", icon: <AlertTriangle size={14} /> },
          { name: "Daily Challenge", path: "/daily-challenge", icon: <Flame size={14} /> },
          { name: "Formula Sheet", path: "/formula-sheet", icon: <Sigma size={14} /> },
          { name: "Assignments", path: "/assignments", icon: <ClipboardList size={14} /> },
          { name: "Smart Notes", path: "/notes", icon: <StickyNote size={14} /> },
        ]
      : []),
    {
      name: role === "teacher" ? "Student Results" : "Results",
      path: resultPath,
      icon: <FaChartBar />,
    },
    { name: "Leaderboard", path: "/leaderboard", icon: <FaTrophy /> },
    { name: "Settings", path: "/settings", icon: <FaCog /> },
  ];

  const isActive = (path) => {
    if (location.pathname === path) return true;
    return location.pathname.startsWith(path) && path !== dashboardPath;
  };

  const displayName = fullName || username || "Quiz User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="quiz-side-glow quiz-side-glow-one"></div>
      <div className="quiz-side-glow quiz-side-glow-two"></div>

      <button
        className="quiz-side-brand"
        onClick={() => navigate(dashboardPath)}
        type="button"
      >
        <span className="quiz-side-brand-icon">
          <Sparkles size={25} />
        </span>

        <span className="quiz-side-brand-copy">
          <strong>QuizApp</strong>
          <small>Learning Hub</small>
        </span>
      </button>

      <div className="quiz-side-user">
        <div className="quiz-side-avatar">
          {avatar ? (
            <img src={avatar} alt="Profile" />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        <div className="quiz-side-user-copy">
          <strong title={displayName}>{displayName}</strong>
          <span>{role}</span>
        </div>
      </div>

      <nav className="quiz-side-menu" aria-label="Sidebar navigation">
        {menu.map((item) => (
          <button
            key={item.path}
            className={`quiz-side-menu-item ${
              isActive(item.path) ? "active" : ""
            }`}
            onClick={() => navigate(item.path)}
            type="button"
          >
            <span className="quiz-side-menu-icon">{item.icon}</span>
            <span className="quiz-side-menu-label">{item.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
