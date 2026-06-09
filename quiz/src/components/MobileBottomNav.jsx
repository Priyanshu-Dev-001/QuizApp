import { FaBook, FaChartBar, FaCog, FaHome, FaTrophy, FaUsers, FaLightbulb } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { readStoredUser } from "../utils/profileSync";

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = readStoredUser()?.role?.toLowerCase() || "student";

  const items = [
    { label: "Home", path: role === "teacher" ? "/teacher" : "/dashboard", icon: <FaHome /> },
    { label: role === "teacher" ? "Quizzes" : "Quiz", path: role === "teacher" ? "/teacher-quizzes" : "/quiz", icon: <FaBook /> },
    ...(role === "student" ? [
      { label: "Doubts", path: "/doubt-solver", icon: <FaLightbulb /> },
      { label: "Groups", path: "/study-groups", icon: <FaUsers /> },
    ] : []),
    { label: role === "teacher" ? "Results" : "Results", path: role === "teacher" ? "/teacher-results" : "/results", icon: <FaChartBar /> },
    { label: "Ranks", path: "/leaderboard", icon: <FaTrophy /> },
    { label: "Settings", path: "/settings", icon: <FaCog /> },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile app navigation">
      {items.map((item) => (
        <button
          className={location.pathname === item.path ? "active" : ""}
          key={item.path}
          onClick={() => navigate(item.path)}
          type="button"
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
