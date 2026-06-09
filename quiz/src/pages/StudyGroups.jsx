import { useState, useEffect } from "react";
import axios from "axios";
import { Users, Plus, LogIn, Trophy, Copy, ArrowLeft, Sparkles, Loader2, UserPlus } from "lucide-react";
import { showToast } from "../utils/toast";
import "./study-groups.css";

const SUBJECTS = ["General", "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English"];

export default function StudyGroups() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user.username || "Student";

  const [view, setView] = useState("list");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [createName, setCreateName] = useState("");
  const [createSubject, setCreateSubject] = useState("General");
  const [createDesc, setCreateDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => { fetchMyGroups(); }, []);

  const fetchMyGroups = async () => {
    try {
      setPageLoading(true);
      const res = await axios.get(`/api/groups/my-groups/${username}`);
      setGroups(res.data || []);
    } catch (err) {
      console.error("Groups fetch error:", err.message);
    } finally {
      setPageLoading(false);
    }
  };

  const openGroup = async (group) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/groups/${group.code}/leaderboard`);
      setSelectedGroup(res.data.group);
      setLeaderboard(res.data.leaderboard || []);
      setView("detail");
    } catch (err) {
      showToast("Could not load group details", "error");
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!createName.trim()) return showToast("Enter a group name", "error");
    try {
      setLoading(true);
      const res = await axios.post("/api/groups/create", {
        name: createName.trim(),
        subject: createSubject,
        description: createDesc.trim(),
        createdBy: username
      });
      showToast(`Group "${res.data.name}" created! Code: ${res.data.code}`, "success");
      setCreateName("");
      setCreateDesc("");
      await fetchMyGroups();
    } catch (err) {
      showToast(err.response?.data?.message || "Error creating group", "error");
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) return showToast("Enter a group code", "error");
    try {
      setLoading(true);
      const res = await axios.post("/api/groups/join", {
        code: joinCode.trim().toUpperCase(),
        username
      });
      showToast(res.data.message || "Joined successfully!", "success");
      setJoinCode("");
      await fetchMyGroups();
    } catch (err) {
      showToast(err.response?.data?.message || "Invalid code or group not found", "error");
    } finally {
      setLoading(false);
    }
  };

  const leaveGroup = async (code) => {
    if (!window.confirm("Leave this group?")) return;
    try {
      await axios.post("/api/groups/leave", { code, username });
      showToast("Left group", "success");
      setView("list");
      await fetchMyGroups();
    } catch (err) {
      showToast("Error leaving group", "error");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => showToast("Code copied!", "success"));
  };

  const getRankClass = (idx) => {
    if (idx === 0) return "first";
    if (idx === 1) return "second";
    if (idx === 2) return "third";
    return "";
  };

  if (view === "detail" && selectedGroup) {
    return (
      <div className="groups-page">
        <button className="sg-detail-back" onClick={() => setView("list")}>
          <ArrowLeft size={16} /> Back to Groups
        </button>

        <div className="sg-detail-header">
          <h2>{selectedGroup.name}</h2>
          <div className="sg-detail-meta">
            <span>📚 {selectedGroup.subject}</span>
            <span><Users size={14} /> {selectedGroup.members?.length || 0} members</span>
            {selectedGroup.description && <span>💬 {selectedGroup.description}</span>}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button className="sg-copy-code-btn" onClick={() => copyCode(selectedGroup.code)}>
              <Copy size={13} /> {selectedGroup.code}
            </button>
            <button
              className="sg-btn"
              style={{ width: "auto", padding: "8px 16px", border: "1.5px solid #ef4444", background: "none", color: "#ef4444", borderRadius: 8, fontSize: 13, cursor: "pointer" }}
              onClick={() => leaveGroup(selectedGroup.code)}
            >
              Leave Group
            </button>
          </div>
        </div>

        <div className="sg-leaderboard">
          <h3><Trophy size={18} /> Group Leaderboard</h3>
          {leaderboard.length === 0 ? (
            <div className="sg-empty">
              <Trophy size={40} />
              <h3>No results yet</h3>
              <p>Members need to take quizzes to appear here</p>
            </div>
          ) : (
            leaderboard.map((item, idx) => (
              <div className={`sg-lb-item ${getRankClass(idx)}`} key={item.username}>
                <div className="sg-lb-rank">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                </div>
                <div className="sg-lb-name">
                  {item.username}
                  {item.username === username && (
                    <span style={{ fontSize: 11, color: "var(--sg-brand)", marginLeft: 8, fontWeight: 700 }}>YOU</span>
                  )}
                </div>
                <div className="sg-lb-stats">
                  <strong>{item.avgPercent}%</strong>
                  <span>{item.totalQuizzes} quizzes</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ background: "var(--sg-surface)", border: "1px solid var(--sg-line)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--sg-heading)", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <UserPlus size={17} /> Invite Friends
          </h3>
          <p style={{ fontSize: 14, color: "var(--sg-muted)", margin: "0 0 14px" }}>
            Share this code with your friends so they can join:
          </p>
          <button className="sg-copy-code-btn" style={{ fontSize: 18, letterSpacing: 3, padding: "12px 24px" }} onClick={() => copyCode(selectedGroup.code)}>
            <Copy size={16} /> {selectedGroup.code}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="groups-page">
      <div className="sg-hero">
        <div className="sg-hero-text">
          <div className="sg-eyebrow"><Sparkles size={13} /> Study Together</div>
          <h1>Study Groups</h1>
          <p>Create or join groups with friends. Compete on leaderboards and motivate each other.</p>
        </div>
      </div>

      <div className="sg-action-panel">
        <div className="sg-action-card">
          <h2><Plus size={18} /> Create a Group</h2>
          <div className="sg-input-row">
            <input
              className="sg-input"
              placeholder="Group name e.g. JEE Warriors 2025"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
            <select className="sg-select" value={createSubject} onChange={(e) => setCreateSubject(e.target.value)}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input
              className="sg-input"
              placeholder="Short description (optional)"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
            />
            <button className="sg-btn primary" onClick={createGroup} disabled={loading}>
              {loading ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
              Create Group
            </button>
          </div>
        </div>

        <div className="sg-action-card">
          <h2><LogIn size={18} /> Join a Group</h2>
          <div className="sg-input-row">
            <input
              className="sg-input"
              placeholder="Enter 6-character group code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ letterSpacing: "3px", fontSize: 18, fontWeight: 700, textTransform: "uppercase" }}
            />
            <button className="sg-btn success" onClick={joinGroup} disabled={loading}>
              {loading ? <Loader2 size={15} className="spin" /> : <LogIn size={15} />}
              Join Group
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--sg-muted)", margin: "12px 0 0", lineHeight: 1.5 }}>
            💡 Ask your friend to share their group code. It's a 6-character code like "ABC123"
          </p>
        </div>
      </div>

      <div className="sg-groups-section">
        <div className="sg-section-header">
          <h2><Users size={20} /> My Groups ({groups.length})</h2>
        </div>

        {pageLoading ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--sg-muted)" }}>
            <Loader2 size={32} className="spin" />
            <p style={{ marginTop: 12 }}>Loading your groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="sg-empty">
            <Users size={48} />
            <h3>No groups yet</h3>
            <p>Create a new group or join one with a code to get started!</p>
          </div>
        ) : (
          <div className="sg-groups-grid">
            {groups.map((group, idx) => (
              <div
                className="sg-group-card"
                key={group._id}
                style={{ animationDelay: `${idx * 0.08}s` }}
                onClick={() => openGroup(group)}
              >
                <div className="sg-group-top">
                  <div className="sg-group-icon">👥</div>
                  <div className="sg-group-code" onClick={(e) => { e.stopPropagation(); copyCode(group.code); }}>
                    {group.code}
                  </div>
                </div>
                <div className="sg-group-name">{group.name}</div>
                <div className="sg-group-subject">📚 {group.subject}</div>
                <div className="sg-group-footer">
                  <span className="sg-members-count"><Users size={13} /> {group.members?.length || 0} members</span>
                  <span style={{ fontSize: 12, color: "var(--sg-brand)", fontWeight: 600 }}>View →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
