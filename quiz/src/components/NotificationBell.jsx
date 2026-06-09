import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import "./NotificationBell.css";

const generateNotifications = () => {
  const stored = JSON.parse(localStorage.getItem("quizNotifications") || "null");
  if (stored) return stored;

  const now = Date.now();
  const initial = [
    { id: 1, type: "sparkle", icon: "✨", title: "Welcome to QuizApp!", body: "Start your learning journey today.", time: now, read: false },
    { id: 2, type: "book", icon: "📚", title: "New Feature: AI Doubt Solver", body: "Upload photos to solve doubts instantly.", time: now - 60000, read: false },
    { id: 3, type: "trophy", icon: "🏆", title: "New Feature: Study Groups", body: "Create groups and compete with friends.", time: now - 120000, read: false },
    { id: 4, type: "sparkle", icon: "🧠", title: "New Feature: Mock Tests", body: "JEE/NEET style timed mock exams available.", time: now - 180000, read: false },
  ];
  localStorage.setItem("quizNotifications", JSON.stringify(initial));
  return initial;
};

const formatTime = (ts) => {
  const diff = Date.now() - ts;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(generateNotifications);
  const wrapperRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const checkAchievements = () => {
      try {
        const results = JSON.parse(localStorage.getItem("cachedResults") || "[]");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userResults = results.filter((r) => r.username === user.username);

        const newNotifs = [...notifications];
        let changed = false;

        if (userResults.length >= 1 && !newNotifs.find((n) => n.id === 100)) {
          newNotifs.unshift({ id: 100, type: "trophy", icon: "🎉", title: "First Quiz Done!", body: "You completed your first quiz. Keep going!", time: Date.now(), read: false });
          changed = true;
        }
        if (userResults.length >= 10 && !newNotifs.find((n) => n.id === 101)) {
          newNotifs.unshift({ id: 101, type: "trophy", icon: "🔟", title: "10 Quizzes Completed!", body: "Badge unlocked: Tenacious 💪", time: Date.now(), read: false });
          changed = true;
        }

        if (changed) {
          const trimmed = newNotifs.slice(0, 20);
          setNotifications(trimmed);
          localStorage.setItem("quizNotifications", JSON.stringify(trimmed));
        }
      } catch {}
    };
    checkAchievements();
  }, []);

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("quizNotifications", JSON.stringify(updated));
  };

  const addStreakNotif = () => {
    const alreadyHas = notifications.find((n) => n.id === 200);
    if (alreadyHas) return;
    const updated = [
      { id: 200, type: "fire", icon: "🔥", title: "Keep Your Streak Going!", body: "Take a quiz today to maintain your streak.", time: Date.now(), read: false },
      ...notifications
    ].slice(0, 20);
    setNotifications(updated);
    localStorage.setItem("quizNotifications", JSON.stringify(updated));
  };

  useEffect(() => {
    const t = setTimeout(addStreakNotif, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button className="notif-btn" onClick={() => { setOpen((o) => !o); if (!open && unreadCount > 0) setTimeout(markAllRead, 2000); }} aria-label="Notifications">
        <Bell size={17} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && <button className="notif-clear-btn" onClick={markAllRead}>Mark all read</button>}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={28} strokeWidth={1.5} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div className={`notif-item ${!notif.read ? "unread" : ""}`} key={notif.id}>
                  <div className={`notif-icon ${notif.type}`}>{notif.icon}</div>
                  <div className="notif-content">
                    <strong>{notif.title}</strong>
                    <span>{notif.body}</span>
                    <span style={{ display: "block", marginTop: 4, fontSize: 11, opacity: 0.7 }}>{formatTime(notif.time)}</span>
                  </div>
                  {!notif.read && <div className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
