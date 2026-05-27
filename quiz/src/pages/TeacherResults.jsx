import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  filterByDateWeek,
  formatDisplayDate,
  getScheduleValue,
  getWeekDay,
  weekDays,
} from "../utils/dateFilters";
import { getSubjectOptions } from "../utils/subjects";
import "./teacher.css";

// ✅ Get unique sets from result data
const getSetOptions = (data) =>
  [...new Set(data.map((r) => r.set || "Set 1"))].sort();

export default function TeacherResults() {
  const [data, setData]               = useState([]);
  const [search, setSearch]           = useState("");
  const [subject, setSubject]         = useState("");
  const [selectedSet, setSelectedSet] = useState("");   // ✅ NEW
  const [selectedDate, setSelectedDate]   = useState("");
  const [selectedWeek, setSelectedWeek]   = useState("");
  const [selectedDay, setSelectedDay]     = useState("");

  const subjects    = getSubjectOptions(data);
  const setOptions  = getSetOptions(data);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/results");
        setData(res.data || []);
      } catch (err) {
        console.log(err);
      }
    };
    fetchResults();
  }, []);

  const calculateMarks = (r) => (r.correct * 2 - r.wrong * 0.25).toFixed(2);

  const getPercent = (r) => {
    const max = r.total * 2;
    return ((calculateMarks(r) / max) * 100).toFixed(1);
  };

  const groupedData = useMemo(() => {
    const dateFiltered = filterByDateWeek(
      data,
      { date: selectedDate, week: selectedWeek, day: selectedDay },
      ["examDate", "date", "createdAt"]
    );

    const grouped = {};

    dateFiltered.forEach((r) => {
      // ✅ Group by username + subject + set
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

  const filtered = groupedData.filter((r) => {
    return (
      r.username.toLowerCase().includes(search.toLowerCase()) &&
      (subject     ? r.subject === subject             : true) &&
      (selectedSet ? r.set     === selectedSet          : true)
    );
  });

  const exportPDF = () => {
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

        {/* MAIN TABLE */}
        <section className="question-builder">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p className="teacher-eyebrow">No data</p>
              <h2>No student results found.</h2>
            </div>
          ) : (
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
          )}
        </section>
      </main>
    </div>
  );
}