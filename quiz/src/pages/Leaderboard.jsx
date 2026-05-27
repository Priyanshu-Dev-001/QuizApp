import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  filterByDateWeek,
  formatDisplayDate,
  getScheduleValue,
  getWeekDay,
  weekDays,
} from "../utils/dateFilters";
import "./leaderboard.css";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { getSubjectOptions } from "../utils/subjects";

export default function Leaderboard() {
  const [rawResults, setRawResults] = useState([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [loading, setLoading] = useState(false);
  const subjects = getSubjectOptions(rawResults);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/results");
        setRawResults(res.data || []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const data = useMemo(() => {
    const dateFiltered = filterByDateWeek(
      rawResults,
      {
        date: selectedDate,
        week: selectedWeek,
        day: selectedDay,
      },
      ["examDate", "date", "createdAt"]
    );
    const grouped = {};

    dateFiltered.forEach((r) => {
      const key = `${r.username}_${r.subject}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    const final = Object.values(grouped).map((arr) => {
      const sorted = [...arr].sort(
        (a, b) =>
          new Date(getScheduleValue(a)).getTime() -
          new Date(getScheduleValue(b)).getTime()
      );
      const latest = sorted[sorted.length - 1];
      const maxScore = latest.total || 1;
      const percentage = (latest.score / maxScore) * 100;
      const scheduleValue = getScheduleValue(latest);

      return {
        username: latest.username,
        subject: latest.subject,
        attempts: arr.length,
        score: latest.score,
        total: latest.total,
        latestDate: scheduleValue,
        latestDay: getWeekDay(scheduleValue),
        avgScore: Number(percentage.toFixed(1)),
      };
    });

    final.sort((a, b) => b.avgScore - a.avgScore);
    return final;
  }, [rawResults, selectedDate, selectedWeek, selectedDay]);

  const filtered = useMemo(() => {
    return data.filter((u) => {
      return (
        u.username.toLowerCase().includes(search.toLowerCase()) &&
        (subject ? u.subject === subject : true)
      );
    });
  }, [data, search, subject]);

  const podium = filtered.slice(0, 3);
  const totalStudents = new Set(filtered.map((u) => u.username)).size;
  const bestScore = filtered[0]?.avgScore || 0;

  const getRankLabel = (i) => {
    if (i === 0) return "1";
    if (i === 1) return "2";
    if (i === 2) return "3";
    return `${i + 1}`;
  };

  return (
    <div className="leaderboard-page">
      <section className="leaderboard-hero">
        <div>
          <p className="leaderboard-eyebrow">Leaderboard</p>
          <h1>Top performers</h1>
          <p>
            Compare student performance by subject, attempts, and latest quiz
            score.
          </p>
        </div>

        <div className="leaderboard-summary">
          <div>
            <strong>{totalStudents}</strong>
            <span>Students</span>
          </div>
          <div>
            <strong>{filtered.length}</strong>
            <span>Entries</span>
          </div>
          <div>
            <strong>{bestScore}%</strong>
            <span>Best Score</span>
          </div>
        </div>
      </section>

      <section className="filter-bar">
        <label>
          Search student
          <input
            placeholder="Type a student name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <label>
          Subject
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Result date
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>

        <label>
          Week
          <input
            type="week"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
          />
        </label>

        <label>
          Week day
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="">All Days</option>
            {weekDays.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>
      </section>

      {podium.length > 0 && (
        <section className="podium-grid">
          {podium.map((student, i) => (
            <article
              className={`podium-card rank-${i + 1}`}
              key={`${student.username}-${student.subject}`}
            >
              <span className="rank-badge">#{getRankLabel(i)}</span>
              <h2>{student.username}</h2>
              <p>{student.subject}</p>
              <strong>{student.avgScore}%</strong>
            </article>
          ))}
        </section>
      )}

      <section className="leaderboard-table">
        <div className="table-head">
          <span>Rank</span>
          <span>Student</span>
          <span>Subject</span>
          <span>Date</span>
          <span>Attempts</span>
          <span>Score</span>
        </div>

        {loading ? (
          <div className="leaderboard-empty">Loading leaderboard...</div>
        ) : filtered.length === 0 ? (
          <div className="leaderboard-empty">No leaderboard entries found.</div>
        ) : (
          filtered.map((u, i) => (
            <div
              key={`${u.username}-${u.subject}`}
              className={`table-row ${i < 3 ? `top-${i + 1}` : ""}`}
            >
              <span>#{getRankLabel(i)}</span>
              <span>{u.username}</span>
              <span>{u.subject}</span>
              <span>
                {u.latestDay ? `${u.latestDay}, ` : ""}
                {formatDisplayDate(u.latestDate)}
              </span>
              <span>{u.attempts}</span>
              <span>{u.avgScore}%</span>
            </div>
          ))
        )}
      </section>

      <section className="chart-box">
        <div className="chart-heading">
          <p className="leaderboard-eyebrow">Performance graph</p>
          <h2>Score comparison</h2>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={filtered.slice(0, 12)} barCategoryGap="30%">
            <XAxis dataKey="username" stroke="#607089" tickLine={false} />
            <YAxis stroke="#607089" tickLine={false} axisLine={false} />
            <Bar dataKey="avgScore" barSize={24} radius={[10, 10, 0, 0]}>
              <LabelList
                dataKey="avgScore"
                position="top"
                fill="#14213d"
                fontSize={12}
                formatter={(value) => `${value}%`}
              />

              {filtered.slice(0, 12).map((entry, index) => (
                <Cell
                  key={`${entry.username}-${entry.subject}`}
                  fill={
                    index === 0
                      ? "#10b981"
                      : index === 1
                        ? "#2563eb"
                        : index === 2
                          ? "#f59e0b"
                          : "#8aa4d6"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
