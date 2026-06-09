import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import { Award, Download, Calendar, Activity, CheckCircle } from "lucide-react";
import {
  filterByDateWeek,
  formatDisplayDate,
  getScheduleValue,
  getWeekDay,
  weekDays,
} from "../utils/dateFilters";
import { getSubjectOptions } from "../utils/subjects";
import { showToast } from "../utils/toast";
import QuizCopilot from "../components/QuizCopilot";
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
        const res = await axios.get("/api/results");
        setRawResults(res.data || []);
      } catch (err) {
        console.error(err);
        showToast("Error loading results", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user]);

  // Clamped at 0 to prevent negative marks display
  const calculateScore = (r) => {
    const raw = r.correct * 2 - r.wrong * 0.25;
    return Math.max(0, raw).toFixed(2);
  };

  const getPercentage = (r) => {
    const max = r.total * 2;
    const obtained = parseFloat(calculateScore(r));
    return max > 0 ? ((obtained / max) * 100).toFixed(1) : "0.0";
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
        set: latest.set || "Set 1",
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

  // Dynamic Landscape Vector Certificate PDF Downloader
  const downloadCertificate = (r, percentage) => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [600, 400],
      });

      // 1. Elegant Gold Double Border
      doc.setDrawColor(245, 158, 11); // Golden Orange
      doc.setLineWidth(5);
      doc.rect(15, 15, 570, 370);
      doc.setLineWidth(1.5);
      doc.rect(20, 20, 560, 360);

      // Corner gold details
      doc.setFillColor(245, 158, 11);
      doc.rect(15, 15, 15, 15);
      doc.rect(570, 15, 15, 15);
      doc.rect(15, 370, 15, 15);
      doc.rect(570, 370, 15, 15);

      // 2. Title & Headers
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(20, 33, 61); // Muted Dark Ink
      doc.text("CERTIFICATE OF EXCELLENCE", 300, 75, { align: "center" });

      doc.setFont("Helvetica", "italic");
      doc.setFontSize(12);
      doc.setTextColor(96, 112, 137); // Steel Blue Muted
      doc.text("THIS CERTIFICATE IS PROUDLY PRESENTED TO", 300, 115, { align: "center" });

      // 3. Recipient Name
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(99, 102, 241); // Royal Indigo
      doc.text(user?.username?.toUpperCase() || "STUDENT", 300, 150, { align: "center" });

      // 4. Citation Content
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(20, 33, 61);
      const line1 = `for outstanding commitment and excellent scoring in the subject evaluation of`;
      const line2 = `Subject: ${r.subject}  |  Paper Set: ${r.set}`;
      const line3 = `achieving a dynamic score of ${percentage}% and showing exceptional academic skill.`;
      doc.text(line1, 300, 190, { align: "center" });
      
      doc.setFont("Helvetica", "bold");
      doc.text(line2, 300, 210, { align: "center" });
      
      doc.setFont("Helvetica", "normal");
      doc.text(line3, 300, 230, { align: "center" });

      // 5. Verification Gold Ribbon Seal (Drawn on canvas)
      doc.setFillColor(245, 158, 11);
      doc.circle(490, 310, 24, "F");
      doc.setFillColor(251, 191, 36);
      doc.circle(490, 310, 19, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(20, 33, 61);
      doc.text("QUIZAPP", 490, 308, { align: "center" });
      doc.setFontSize(6);
      doc.text("VERIFIED", 490, 316, { align: "center" });

      // 6. Signatures and Date lines
      doc.setDrawColor(156, 163, 175);
      doc.setLineWidth(1);
      doc.line(100, 310, 220, 310);
      doc.line(280, 310, 400, 310);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(96, 112, 137);
      doc.text(`DATE: ${formatDisplayDate(r.latestDate)}`, 160, 322, { align: "center" });
      
      doc.setFont("Helvetica", "italic");
      doc.text("Evaluation Director", 340, 322, { align: "center" });

      doc.save(`certificate-${r.subject.toLowerCase()}-${user?.username.toLowerCase()}.pdf`);
      showToast("Certificate downloaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Error generating certificate", "error");
    }
  };

  return (
    <div className="results-page">
      <section className="results-hero">
        <div>
          <p className="results-eyebrow">Performance report</p>
          <h1>Your Results</h1>
          <p>
            Welcome back, {user?.username}. Track your latest quiz performance
            and claim your certified achievement awards!
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
            const canClaim = Number(percentage) >= 80;

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

                {/* Claim Certificate Button for Performance >= 80% */}
                {canClaim && (
                  <button
                    className="claim-certificate-btn"
                    onClick={() => downloadCertificate(r, percentage)}
                    type="button"
                  >
                    <Award size={16} />
                    <span>Claim Certificate</span>
                    <Download size={14} className="download-sub-icon" />
                  </button>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* Supportive AI Study Companion */}
      <QuizCopilot />
    </div>
  );
}
