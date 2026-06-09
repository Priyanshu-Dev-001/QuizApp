import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from "recharts";
import { TrendingUp, Award, BookOpen, Target, Flame, Zap } from "lucide-react";
import "./progress.css";

const SUBJECT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="pg-tooltip">
        <p className="pg-tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}{p.name.includes("Score") || p.name.includes("%") ? "%" : ""}</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Progress() {
  const [loading, setLoading]         = useState(true);
  const [trendData, setTrendData]     = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [radarData, setRadarData]     = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    total: 0, best: 0, avg: 0, streak: 0, totalCorrect: 0, perfectScores: 0
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.username) { setLoading(false); return; }

    axios.get("/api/results")
      .then(({ data }) => {
        const mine = (data || [])
          .filter((r) => r.username === user.username)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (mine.length === 0) { setLoading(false); return; }

        // 1. Score Trend (last 20 quizzes)
        const trend = mine.slice(-20).map((r, i) => {
          const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
          const dateStr = new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
          return { quiz: `#${mine.indexOf(mine.slice(-20)[i]) + 1}`, date: dateStr, "Score %": pct, subject: r.subject || "General" };
        });
        setTrendData(trend);

        // 2. Subject-wise performance
        const subjectMap = {};
        mine.forEach((r) => {
          const sub = r.subject || "General";
          if (!subjectMap[sub]) subjectMap[sub] = { total: 0, score: 0, count: 0 };
          subjectMap[sub].total += r.total;
          subjectMap[sub].score += r.score;
          subjectMap[sub].count += 1;
        });
        const subArr = Object.entries(subjectMap).map(([subject, val]) => ({
          subject: subject.length > 12 ? subject.slice(0, 12) + "…" : subject,
          "Avg Score": val.total > 0 ? Math.round((val.score / val.total) * 100) : 0,
          Attempts: val.count,
        })).sort((a, b) => b["Avg Score"] - a["Avg Score"]);
        setSubjectData(subArr);

        // 3. Radar Data (skill areas)
        const areas = [
          { area: "Speed",       value: Math.min(100, Math.round((mine.length / 20) * 100)) },
          { area: "Accuracy",    value: mine.length > 0 ? Math.round((mine.reduce((s, r) => s + (r.total > 0 ? r.score / r.total : 0), 0) / mine.length) * 100) : 0 },
          { area: "Consistency", value: subArr.length > 0 ? Math.round(100 - (Math.max(...subArr.map(s => s["Avg Score"])) - Math.min(...subArr.map(s => s["Avg Score"]))) / 2) : 50 },
          { area: "Breadth",     value: Math.min(100, subArr.length * 20) },
          { area: "Streaks",     value: Math.min(100, mine.length * 5) },
          { area: "XP",          value: Math.min(100, Math.round(mine.reduce((s, r) => s + r.score, 0) * 15 / 100)) },
        ];
        setRadarData(areas);

        // 4. Summary stats
        const scores = mine.map((r) => r.total > 0 ? Math.round((r.score / r.total) * 100) : 0);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const best = Math.max(...scores);
        const totalCorrect = mine.reduce((s, r) => s + r.score, 0);
        const perfectScores = mine.filter((r) => r.score === r.total).length;

        // Streak
        const uniqueDates = [...new Set(mine.map((r) => new Date(r.date).toDateString()))].map((d) => new Date(d)).sort((a, b) => b - a);
        let streak = 0;
        if (uniqueDates.length > 0) {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const diff = Math.ceil(Math.abs(today - uniqueDates[0]) / 86400000);
          if (diff <= 1) {
            streak = 1;
            for (let i = 0; i < uniqueDates.length - 1; i++) {
              const between = Math.ceil(Math.abs(uniqueDates[i] - uniqueDates[i + 1]) / 86400000);
              if (between === 1) streak++; else break;
            }
          }
        }
        setSummaryStats({ total: mine.length, best, avg, streak, totalCorrect, perfectScores });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="pg-page">
      <div className="pg-loading">
        <div className="pg-spinner" />
        <p>Loading your analytics...</p>
      </div>
    </div>
  );

  const hasData = trendData.length > 0;

  return (
    <div className="pg-page">
      <div className="pg-hero">
        <div className="pg-eyebrow"><TrendingUp size={14} /> Progress Analytics</div>
        <h1>Your Performance Overview</h1>
        <p>Track your improvement, spot weak areas, and celebrate your growth.</p>
      </div>

      {/* Summary Cards */}
      <div className="pg-summary-grid">
        {[
          { icon: <BookOpen size={20} />, label: "Quizzes Taken",    value: summaryStats.total,        color: "brand"   },
          { icon: <Target size={20} />,   label: "Average Score",     value: `${summaryStats.avg}%`,    color: "green"   },
          { icon: <Award size={20} />,    label: "Best Score",        value: `${summaryStats.best}%`,   color: "amber"   },
          { icon: <Flame size={20} />,    label: "Day Streak",        value: summaryStats.streak,       color: "orange"  },
          { icon: <Zap size={20} />,      label: "Total XP Earned",   value: `${summaryStats.totalCorrect * 15} XP`, color: "purple" },
          { icon: <Award size={20} />,    label: "Perfect Scores",    value: summaryStats.perfectScores, color: "teal"  },
        ].map((s) => (
          <div className={`pg-stat-card pg-stat-${s.color}`} key={s.label}>
            <div className="pg-stat-icon">{s.icon}</div>
            <strong>{hasData ? s.value : "—"}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="pg-empty">
          <TrendingUp size={60} strokeWidth={1.2} />
          <h2>No quiz data yet</h2>
          <p>Take some quizzes to see your progress charts here!</p>
        </div>
      ) : (
        <>
          {/* Score Trend Chart */}
          <div className="pg-chart-card">
            <h2><TrendingUp size={20} /> Score Trend (Last {trendData.length} Quizzes)</h2>
            <p className="pg-chart-sub">See how your scores have improved over time</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--pg-line)" />
                <XAxis dataKey="quiz" tick={{ fontSize: 12, fill: "var(--pg-muted)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--pg-muted)" }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="Score %" stroke="#6366f1"
                  strokeWidth={3} dot={{ fill: "#6366f1", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Performance Chart */}
          {subjectData.length > 1 && (
            <div className="pg-chart-card">
              <h2><BookOpen size={20} /> Subject-wise Performance</h2>
              <p className="pg-chart-sub">Which subjects are your strongest?</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={subjectData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--pg-line)" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12, fill: "var(--pg-muted)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--pg-muted)" }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Avg Score" radius={[6, 6, 0, 0]}>
                    {subjectData.map((_, i) => (
                      <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Skill Radar */}
          <div className="pg-chart-card pg-chart-radar">
            <h2><Zap size={20} /> Skill Radar</h2>
            <p className="pg-chart-sub">A complete view of your learning profile</p>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--pg-line)" />
                <PolarAngleAxis dataKey="area" tick={{ fontSize: 13, fill: "var(--pg-ink)" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--pg-muted)" }} />
                <Radar name="You" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Table */}
          {subjectData.length > 0 && (
            <div className="pg-chart-card">
              <h2><Target size={20} /> Subject Breakdown</h2>
              <div className="pg-subject-table">
                <div className="pg-table-head">
                  <span>Subject</span>
                  <span>Avg Score</span>
                  <span>Attempts</span>
                  <span>Status</span>
                </div>
                {subjectData.map((s, i) => (
                  <div className="pg-table-row" key={s.subject}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: SUBJECT_COLORS[i % SUBJECT_COLORS.length], flexShrink: 0 }} />
                      {s.subject}
                    </span>
                    <span className={`pg-score-badge ${s["Avg Score"] >= 70 ? "good" : s["Avg Score"] >= 40 ? "avg" : "low"}`}>
                      {s["Avg Score"]}%
                    </span>
                    <span>{s.Attempts}</span>
                    <span className={`pg-status ${s["Avg Score"] >= 70 ? "strong" : s["Avg Score"] >= 40 ? "medium" : "weak"}`}>
                      {s["Avg Score"] >= 70 ? "✅ Strong" : s["Avg Score"] >= 40 ? "📈 Improving" : "⚠️ Needs Work"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
