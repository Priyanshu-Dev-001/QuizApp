import { useEffect, useState } from "react";
import axios from "axios";
import {
  buildFilterSummary,
  filterByDateWeek,
  formatDisplayDate,
  getScheduleValue,
  getWeekDay,
  weekDays,
} from "../utils/dateFilters";
import { getSubjectOptions } from "../utils/subjects";
import "./teacherQuiz.css";

export default function TeacherQuizList() {
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [filtered, setFiltered] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const subjects = getSubjectOptions(allQuizzes);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/quiz");
        setAllQuizzes(res.data || []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchQuizzes();
  }, []);

  const handleFilter = () => {
    if (!selectedSubject && !selectedDate && !selectedWeek && !selectedDay) {
      alert("Select subject, date, week or day");
      return;
    }

    const subjectData = selectedSubject
      ? allQuizzes.filter((q) => q.subject === selectedSubject)
      : allQuizzes;

    const data = filterByDateWeek(
      subjectData,
      {
        date: selectedDate,
        week: selectedWeek,
        day: selectedDay,
      },
      ["examDate", "createdAt"]
    );

    setFiltered(data);
  };

  return (
    <div className="teacher-page">

      {/* HEADER */}
      <header className="teacher-header">
        <div>
          <p className="teacher-eyebrow">Teacher workspace</p>
          <h1>Quiz Library</h1>
        </div>
      </header>

      <main className="teacher-layout">

        {/* SIDEBAR */}
        <aside className="quiz-sidebar">
          <div className="sidebar-card">
            <span className="card-label">Filter quizzes</span>

            <label>
              Subject
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">Select Subject</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Exam date
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

            <button className="create-btn" onClick={handleFilter}>
              Show Quizzes
            </button>

            {filtered !== null && (
              <button
                className="header-action"
                onClick={() => {
                  setFiltered(null);
                  setSelectedSubject("");
                  setSelectedDate("");
                  setSelectedWeek("");
                  setSelectedDay("");
                }}
              >
                Reset
              </button>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="question-builder">

          {/* INITIAL STATE */}
          {filtered === null && (
            <div className="empty-state">
              <p className="teacher-eyebrow">Browse quizzes</p>
              <h2>Select subject, date, week or weekday to view quizzes.</h2>
            </div>
          )}

          {/* EMPTY RESULT */}
          {filtered && filtered.length === 0 && (
            <div className="empty-state">
              <p className="teacher-eyebrow">{selectedSubject}</p>
              <h2>No quizzes found.</h2>
            </div>
          )}

          {/* QUIZ LIST */}
          {filtered && filtered.length > 0 &&
            filtered.map((quiz) => (
              <article className="question-box" key={quiz._id}>

                <div className="question-head">
                  <div>
                    <span>{quiz.subject}</span>
                    <h2>{quiz.title}</h2>
                    <p className="schedule-note">
                      {getWeekDay(getScheduleValue(quiz, ["examDate", "createdAt"]))} -{" "}
                      {formatDisplayDate(getScheduleValue(quiz, ["examDate", "createdAt"]))}
                    </p>
                    {filtered !== null && (
                      <p className="schedule-note">
                        Filter: {buildFilterSummary({
                          date: selectedDate,
                          week: selectedWeek,
                          day: selectedDay,
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {quiz.questions.map((q, i) => (
                  <div key={i} className="question-box" style={{ marginTop: "16px" }}>

                    <h3>Q{i + 1}. {q.question}</h3>

                    <div className="options-grid">
                      {q.options.map((opt, j) => (
                        <div
                          key={j}
                          className={`option-box ${j === q.answer ? "correct" : ""}`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>

                    <p style={{ color: "#10b981", marginTop: "10px" }}>
                      Correct: {q.options[q.answer]}
                    </p>

                  </div>
                ))}

              </article>
            ))}

        </section>

      </main>
    </div>
  );
}
