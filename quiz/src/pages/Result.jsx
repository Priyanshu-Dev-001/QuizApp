import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  filterByDateWeek,
  formatDisplayDate,
  getScheduleValue,
  getWeekDay,
  weekDays,
} from "../utils/dateFilters";
import "./studentresult.css";

export default function Results() {
  const [rawResults, setRawResults] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      console.error("Invalid user data:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      window.location.href = "/";
      return;
    }

    const fetchResults = async () => {
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

    fetchResults();
  }, [user]);

  const calculateScore = (r) => {
    return (r.correct * 2 - r.wrong * 0.25).toFixed(2);
  };

  const getPercentage = (r) => {
    const max = r.total * 2;
    const obtained = parseFloat(calculateScore(r));
    return ((obtained / max) * 100).toFixed(1);
  };

  const results = useMemo(() => {
    const mine = rawResults.filter((r) => r.username === user?.username);
    const dateFiltered = filterByDateWeek(
      mine,
      {
        date: selectedDate,
        week: selectedWeek,
        day: selectedDay,
      },
      ["examDate", "date", "createdAt"]
    );
    const grouped = {};

    dateFiltered.forEach((r) => {
      if (!grouped[r.subject]) grouped[r.subject] = [];
      grouped[r.subject].push(r);
    });

    return Object.keys(grouped).map((subject) => {
      const attempts = grouped[subject].sort(
        (a, b) =>
          new Date(getScheduleValue(a)).getTime() -
          new Date(getScheduleValue(b)).getTime()
      );
      const latest = attempts[attempts.length - 1];
      const scheduleValue = getScheduleValue(latest);

      return {
        subject,
        attempts: attempts.length,
        correct: latest.score,
        wrong: latest.total - latest.score,
        total: latest.total,
        latestDate: scheduleValue,
        latestDay: getWeekDay(scheduleValue),
      };
    });
  }, [rawResults, selectedDate, selectedWeek, selectedDay, user?.username]);

  const totalAttempts = results.reduce((sum, r) => sum + r.attempts, 0);
  const average =
    results.length === 0
      ? "0.0"
      : (
          results.reduce((sum, r) => sum + Number(getPercentage(r)), 0) /
          results.length
        ).toFixed(1);
  const bestSubject = [...results].sort(
    (a, b) => Number(getPercentage(b)) - Number(getPercentage(a))
  )[0];

  return (
    <div className="results-page">
      <section className="results-hero">
        <div>
          <p className="results-eyebrow">Performance report</p>
          <h1>Your Results</h1>
          <p>
            Welcome back, {user?.username}. Track your latest quiz performance
            and keep improving subject by subject.
          </p>
        </div>

        <div className="score-summary">
          <span>Average score</span>
          <strong>{average}%</strong>
          <div className="summary-bar">
            <div style={{ width: `${Math.min(Number(average), 100)}%` }} />
          </div>
        </div>
      </section>

      <section className="result-stats">
        <div>
          <strong>{results.length}</strong>
          <span>Subjects</span>
        </div>
        <div>
          <strong>{totalAttempts}</strong>
          <span>Total Attempts</span>
        </div>
        <div>
          <strong>{bestSubject?.subject || "-"}</strong>
          <span>Best Subject</span>
        </div>
      </section>

      <section className="result-filters">
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

      {loading ? (
        <div className="results-empty">Loading results...</div>
      ) : results.length === 0 ? (
        <div className="results-empty">No results found yet.</div>
      ) : (
        <section className="result-grid">
          {results.map((r) => {
            const percentage = getPercentage(r);

            return (
              <article className="result-card" key={r.subject}>
                <div className="result-card-head">
                  <div>
                    <span>Subject</span>
                    <h2>{r.subject}</h2>
                    <small>
                      {r.latestDay ? `${r.latestDay}, ` : ""}
                      {formatDisplayDate(r.latestDate)}
                    </small>
                  </div>
                  <strong>{percentage}%</strong>
                </div>

                <div className="result-progress">
                  <div style={{ width: `${Math.min(Number(percentage), 100)}%` }} />
                </div>

                <div className="result-details">
                  <span>Attempts: {r.attempts}</span>
                  <span>Correct: {r.correct}</span>
                  <span>Wrong: {r.wrong}</span>
                  <span>
                    Marks: {calculateScore(r)} / {r.total * 2}
                  </span>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
