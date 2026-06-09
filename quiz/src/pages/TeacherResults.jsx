import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  filterByDateWeek,
  formatDisplayDate,
  getScheduleValue,
  getWeekDay,
  weekDays,
} from "../utils/dateFilters";
import { getSubjectOptions } from "../utils/subjects";
import { showToast } from "../utils/toast";
import "./teacher.css";

// ✅ Get unique sets from result data
const getSetOptions = (data) =>
  [...new Set(data.map((r) => r.set || "Set 1"))].sort();

export default function TeacherResults() {
  const [data, setData]               = useState([]);
  const [search, setSearch]           = useState("");
  const [subject, setSubject]         = useState("");
  const [selectedSet, setSelectedSet] = useState("");
  const [selectedDate, setSelectedDate]   = useState("");
  const [selectedWeek, setSelectedWeek]   = useState("");
  const [selectedDay, setSelectedDay]     = useState("");
  const [loading, setLoading]         = useState(false);

  const subjects    = getSubjectOptions(data);
  const setOptions  = getSetOptions(data);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/results");
        setData(res.data || []);
      } catch (err) {
        console.error(err);
        showToast("Error loading student results", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const calculateMarks = (r) => {
    const raw = r.correct * 2 - r.wrong * 0.25;
    return Math.max(0, raw).toFixed(2);
  };

  const getPercent = (r) => {
    const max = r.total * 2;
    return max > 0 ? ((calculateMarks(r) / max) * 100).toFixed(1) : "0.0";
  };

  const groupedData = useMemo(() => {
    const dateFiltered = filterByDateWeek(
      data,
      { date: selectedDate, week: selectedWeek, day: selectedDay },
      ["examDate", "date", "createdAt"]
    );

    const grouped = {};

    dateFiltered.forEach((r) => {
      const key = `${r.username}_${r.subject}_${r.set || "Set 1"}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    return Object.values(grouped).map((attempts) => {
      const sorted  = [...attempts].sort(
        (a, b) =>
          new Date(getScheduleValue(a)).getTime() -
          new Date(getScheduleValue(b)).getTime()
      );
      const latest       = sorted[sorted.length - 1];
      const scheduleValue = getScheduleValue(latest);

      return {
        username:   latest.username,
        subject:    latest.subject,
        set:        latest.set || "Set 1",
        attempts:   attempts.length,
        correct:    latest.score,
        wrong:      latest.total - latest.score,
        total:      latest.total,
        latestDate: scheduleValue,
        latestDay:  getWeekDay(scheduleValue),
      };
    });
  }, [data, selectedDate, selectedWeek, selectedDay]);

  const filtered = useMemo(() => {
    return groupedData.filter((r) => {
      return (
        r.username.toLowerCase().includes(search.toLowerCase()) &&
        (subject     ? r.subject === subject             : true) &&
        (selectedSet ? r.set     === selectedSet          : true)
      );
    });
  }, [groupedData, search, subject, selectedSet]);

  // Premium charts datasets
  const subjectChartData = useMemo(() => {
    const subjectsMap = {};
    filtered.forEach((r) => {
      if (!subjectsMap[r.subject]) {
        subjectsMap[r.subject] = { sum: 0, count: 0 };
      }
      subjectsMap[r.subject].sum += Number(getPercent(r));
      subjectsMap[r.subject].count += 1;
    });

    return Object.keys(subjectsMap).map((subjName) => ({
      subject: subjName,
      avgPercent: Math.round(subjectsMap[subjName].sum / subjectsMap[subjName].count),
    }));
  }, [filtered]);

  const studentChartData = useMemo(() => {
    const sorted = [...filtered]
      .sort((a, b) => Number(getPercent(b)) - Number(getPercent(a)))
      .slice(0, 5);

    return sorted.map((r) => ({
      username: r.username,
      percent: Math.round(Number(getPercent(r))),
    }));
  }, [filtered]);

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Student Performance Report", 14, 15);

      const tableData = filtered.map((r) => [
        r.username,
        r.subject,
        r.set,
        formatDisplayDate(r.latestDate),
        r.attempts,
        r.correct,
        r.wrong,
        calculateMarks(r),
        getPercent(r) + "%",
      ]);

      autoTable(doc, {
        startY: 20,
        head: [["Student", "Subject", "Set", "Date", "Attempts", "Correct", "Wrong", "Marks", "%"]],
        body: tableData,
      });

      doc.save("student-results.pdf");
      showToast("PDF report exported successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Error exporting PDF report", "error");
    }
  };

  const exportCSV = () => {
    try {
      const headers = ['Student', 'Subject', 'Set', 'Date', 'Attempts', 'Correct', 'Wrong', 'Marks', 'Percentage'];
      const rows = filtered.map((r) => [
        r.username,
        r.subject,
        r.set,
        formatDisplayDate(r.latestDate),
        r.attempts,
        r.correct,
        r.wrong,
        calculateMarks(r),
        getPercent(r) + '%',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student-results.csv';
      link.click();
      URL.revokeObjectURL(url);
      showToast('CSV report exported successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error exporting CSV report', 'error');
    }
  };

  return (
    <div className="teacher-page">
      {/* HEADER */}
      <header className="teacher-header">
        <div>
          <p className="teacher-eyebrow">Teacher analytics</p>
          <h1>Student Performance</h1>
        </div>
      </header>

      <main className="teacher-layout">
        {/* SIDEBAR */}
        <aside className="quiz-sidebar">
          <div className="sidebar-card">
            <span className="card-label">Filters</span>

            <label>
              Search student
              <input
                placeholder="Enter name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <label>
              Subject
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            {/* ✅ SET FILTER */}
            <label>
              Paper Set
              <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)}>
                <option value="">All Sets</option>
                {setOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
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
              <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                <option value="">All Days</option>
                {weekDays.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </label>

            <button className="create-btn" onClick={exportPDF}>
              Export PDF
            </button>
            <button className="create-btn" onClick={exportCSV} style={{ background: '#10b981' }}>
              Export CSV
            </button>
          </div>

          {/* SUMMARY */}
          <div className="summary-grid">
            <div>
              <strong>{filtered.length}</strong>
              <span>Students</span>
            </div>
            <div>
              <strong>
                {filtered.reduce((acc, r) => acc + Number(calculateMarks(r)), 0).toFixed(0)}
              </strong>
              <span>Total Marks</span>
            </div>
          </div>
        </aside>

        {/* MAIN COMPONENT */}
        <section className="question-builder">
          {loading ? (
            <div className="empty-state">
              <p className="teacher-eyebrow">Loading</p>
              <h2>Fetching statistics...</h2>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <p className="teacher-eyebrow">No data</p>
              <h2>No student results found.</h2>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "28px" }}>
              {/* PREMIUM ANALYTICS CHARTS */}
              <div className="teacher-charts-grid">
                {subjectChartData.length > 0 && (
                  <div className="teacher-chart-card">
                    <span className="chart-meta">Performance Graph</span>
                    <h3>Subject-Wise Performance</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={subjectChartData} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#26354f" opacity={0.15} />
                        <XAxis dataKey="subject" stroke="#607089" tickLine={false} />
                        <YAxis stroke="#607089" tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ background: "rgba(17, 28, 50, 0.95)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff", borderRadius: "10px" }} />
                        <Bar dataKey="avgPercent" name="Avg Score %" fill="#6366f1" radius={[8, 8, 0, 0]}>
                          {subjectChartData.map((entry, index) => (
                            <Cell key={index} fill={index % 2 === 0 ? "#6366f1" : "#06b6d4"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {studentChartData.length > 0 && (
                  <div className="teacher-chart-card">
                    <span className="chart-meta">Student Ranking</span>
                    <h3>Top Scoring Students</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={studentChartData} layout="vertical" barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#26354f" opacity={0.15} />
                        <XAxis type="number" stroke="#607089" tickLine={false} domain={[0, 100]} />
                        <YAxis dataKey="username" type="category" stroke="#607089" tickLine={false} width={80} />
                        <Tooltip contentStyle={{ background: "rgba(17, 28, 50, 0.95)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff", borderRadius: "10px" }} />
                        <Bar dataKey="percent" name="Score %" fill="#10b981" radius={[0, 8, 8, 0]}>
                          {studentChartData.map((entry, index) => (
                            <Cell key={index} fill={index === 0 ? "#10b981" : index === 1 ? "#2563eb" : "#f59e0b"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* TABLE */}
              <div className="table-card">
                {/* ✅ Added "Set" column */}
                <div className="table-head table-head-9">
                  <span>Student</span>
                  <span>Subject</span>
                  <span>Set</span>
                  <span>Date</span>
                  <span>Attempts</span>
                  <span>Correct</span>
                  <span>Wrong</span>
                  <span>Marks</span>
                  <span>%</span>
                </div>

                {filtered.map((r, i) => (
                  <div className="table-row table-row-9" key={i}>
                    <span>{r.username}</span>
                    <span>{r.subject}</span>
                    <span className="set-tag">{r.set}</span>
                    <span>
                      {r.latestDay ? `${r.latestDay}, ` : ""}
                      {formatDisplayDate(r.latestDate)}
                    </span>
                    <span>{r.attempts}</span>
                    <span className="green">{r.correct}</span>
                    <span className="red">{r.wrong}</span>
                    <span>{calculateMarks(r)}</span>
                    <span>{getPercent(r)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}