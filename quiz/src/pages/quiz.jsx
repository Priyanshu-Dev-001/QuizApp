import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Sparkles, Shield, Volume2, Bookmark, BookmarkCheck, Eye, Zap, GraduationCap } from "lucide-react";
import {
  buildFilterSummary,
  filterByDateWeek,
  formatDisplayDate,
  getScheduleValue,
  getWeekDay,
  weekDays,
} from "../utils/dateFilters";
import { getSubjectOptions } from "../utils/subjects";
import {
  compareAnswers,
  formatAnswer,
  formatDuration,
  getQuizStatus,
  isQuizOpen,
} from "../utils/quizHelpers";
import { showToast } from "../utils/toast";
import QuizCopilot from "../components/QuizCopilot";
import "./quiz.css";

// Native Web Audio API Sound Synthesizer (No external dependencies)
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === "correct") {
      // Pleasant double synth beep
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.start();
      
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.1);
      
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.2);
      
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      // Soft declining thud
      osc.type = "triangle";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.warn("Audio Context blocked or not supported:", e.message);
  }
};

const getSetsForSubject = (quizzes, subject) => {
  const filtered = quizzes.filter((q) => q.subject === subject);
  const sets = [...new Set(filtered.map((q) => q.set || "Set 1"))];
  return sets.sort();
};

const getEmptyAnswer = (question) => {
  if (question.type === "multiselect") return [];
  if (question.type === "short") return "";
  return null;
};

export default function Quiz() {
  const [allQuiz, setAllQuiz] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSet, setSelectedSet] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("open");
  const [search, setSearch] = useState("");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [time, setTime] = useState(60);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [startedAt, setStartedAt] = useState(null);

  // Gamification & Anti-cheating strict mode states
  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // Practice Mode & Bookmarks
  const [quizMode, setQuizMode] = useState(null); // 'exam' | 'practice'
  const [showModeModal, setShowModeModal] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState(null);
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('quizBookmarks')) || [];
    } catch { return []; }
  });

  const navigate = useNavigate();
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      showToast("Please login first", "warning");
      window.location.href = "/";
      return;
    }

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/quiz");
        setAllQuiz(res.data || []);
      } catch (err) {
        console.log(err);
        showToast("Error loading quizzes", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [user]);

  useEffect(() => {
    setSelectedSet("");
  }, [selectedSubject]);

  const scheduleFilters = useMemo(
    () => ({
      date: selectedDate,
      week: selectedWeek,
      day: selectedDay,
    }),
    [selectedDate, selectedWeek, selectedDay]
  );

  const subjects = getSubjectOptions(allQuiz);
  const availableSets = selectedSubject ? getSetsForSubject(allQuiz, selectedSubject) : [];

  const availableQuizzes = useMemo(() => {
    const dateFiltered = filterByDateWeek(
      allQuiz,
      scheduleFilters,
      ["examDate", "createdAt"]
    );

    return dateFiltered.filter((item) => {
      const text = `${item.title} ${item.subject} ${item.set || ""}`.toLowerCase();
      const status = getQuizStatus(item).key;

      return (
        text.includes(search.toLowerCase()) &&
        (selectedSubject ? item.subject === selectedSubject : true) &&
        (selectedSet ? (item.set || "Set 1") === selectedSet : true) &&
        (selectedStatus ? status === selectedStatus : true)
      );
    });
  }, [
    allQuiz,
    scheduleFilters,
    search,
    selectedSet,
    selectedStatus,
    selectedSubject,
  ]);

  const startQuiz = (selectedQuiz) => {
    if (!isQuizOpen(selectedQuiz)) {
      showToast("This quiz is not open right now", "warning");
      return;
    }
    // Show mode selection modal
    setPendingQuiz(selectedQuiz);
    setShowModeModal(true);
  };

  const confirmStartQuiz = (mode) => {
    if (!pendingQuiz) return;
    const selectedQuiz = pendingQuiz;
    const scheduleValue = getScheduleValue(selectedQuiz, ["examDate", "createdAt"]);
    const duration = selectedQuiz.duration || 60;

    setQuizMode(mode);
    setShowModeModal(false);
    setPendingQuiz(null);

    setQuiz({
      ...selectedQuiz,
      set: selectedQuiz.set || "Set 1",
      examDate: scheduleValue,
      examDay: getWeekDay(scheduleValue),
      filterLabel: buildFilterSummary(scheduleFilters),
    });

    setCurrent(0);
    setAnswers({});
    setTime(duration);
    setSubmitted(false);
    setScore(0);
    setStartedAt(Date.now());
    setWarnings(0);
    setShowWarningModal(false);
    setTriggerConfetti(false);
    setRevealedAnswers({});
  };

  // Bookmark toggle
  const toggleBookmark = (question) => {
    setBookmarks((prev) => {
      const id = `${quiz._id}_${current}`;
      const exists = prev.find((b) => b.id === id);
      let updated;
      if (exists) {
        updated = prev.filter((b) => b.id !== id);
        showToast('Bookmark removed', 'info');
      } else {
        updated = [...prev, {
          id,
          question: question.question,
          options: question.options || [],
          answer: question.answer,
          type: question.type || 'mcq',
          subject: quiz.subject,
          bookmarkedAt: new Date().toISOString(),
        }];
        showToast('Question bookmarked!', 'success');
      }
      localStorage.setItem('quizBookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  const isBookmarked = (qIndex) => {
    if (!quiz) return false;
    return bookmarks.some((b) => b.id === `${quiz._id}_${qIndex}`);
  };

  const next = () => setCurrent((c) => Math.min(c + 1, quiz.questions.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  const setAnswer = (question, value) => {
    setAnswers((currentAnswers) => {
      if (question.type !== "multiselect") {
        return { ...currentAnswers, [current]: value };
      }

      const selected = new Set(currentAnswers[current] || []);
      if (selected.has(value)) selected.delete(value);
      else selected.add(value);

      return { ...currentAnswers, [current]: [...selected].sort((a, b) => a - b) };
    });
  };

  const handleSubmit = useCallback(async () => {
    if (submitted || !quiz || !user) return;

    let calculatedScore = 0;
    const answerDetails = quiz.questions.map((question, index) => {
      const selectedAnswer =
        answers[index] === undefined ? getEmptyAnswer(question) : answers[index];
      const isCorrect = compareAnswers(question, selectedAnswer);

      if (isCorrect) calculatedScore += 1;

      return {
        question: question.question,
        type: question.type || "mcq",
        options: question.options || [],
        selectedAnswer,
        correctAnswer: question.answer,
        isCorrect,
      };
    });

    setScore(calculatedScore);
    setSubmitted(true);

    // Dynamic gamified visual & audio rewards
    const isGoodScore = (calculatedScore / quiz.questions.length) >= 0.75;
    if (isGoodScore) {
      setTriggerConfetti(true);
      playSound("correct");
      showToast("Fabulous Performance! Level XP boosted!", "success");
    } else {
      playSound("wrong");
    }

    try {
      await axios.post("/api/results", {
        userId: user._id,
        username: user.username,
        quizId: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        set: quiz.set,
        examDate: quiz.examDate,
        examDay: quiz.examDay,
        duration: quiz.duration || 60,
        timeSpent: startedAt
          ? Math.max(0, Math.round((Date.now() - startedAt) / 1000))
          : 0,
        answers: answerDetails,
        score: calculatedScore,
        total: quiz.questions.length,
      });

      showToast("Result saved successfully", "success");
      setTimeout(() => {
        navigate("/results");
      }, 3500);
    } catch (err) {
      console.log(err);
      showToast("Error saving result", "error");
    }
  }, [answers, navigate, quiz, startedAt, submitted, user]);

  // Anti-Cheating strict mode implementation (disabled in Practice Mode)
  useEffect(() => {
    if (!quiz || submitted || quizMode === 'practice') return;

    const handleBlur = () => {
      setWarnings((w) => {
        const nextW = w + 1;
        if (nextW >= 3) {
          showToast("Quiz auto-submitted due to multiple tab-switching warnings!", "error");
          setShowWarningModal(false);
          handleSubmit();
          return 3;
        } else {
          setShowWarningModal(true);
          playSound("wrong");
          return nextW;
        }
      });
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [quiz, submitted, handleSubmit, quizMode]);

  // Timer control (disabled in Practice Mode)
  useEffect(() => {
    if (!quiz || submitted || quizMode === 'practice') return;

    const timer = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, submitted, handleSubmit, quizMode]);

  // Confetti Particle System Render loop
  useEffect(() => {
    if (!triggerConfetti) return;

    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrame;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#f59e0b", "#10b981", "#2563eb", "#8b5cf6", "#ec4899", "#06b6d4"];
    const particles = Array.from({ length: 100 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 5 + 3,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2.2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 12;

        if (p.y > canvas.height) {
          p.x = Math.random() * canvas.width;
          p.y = -20;
          p.tilt = Math.random() * 10 - 5;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const timer = setTimeout(() => {
      cancelAnimationFrame(animationFrame);
      setTriggerConfetti(false);
    }, 4000);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [triggerConfetti]);

  if (!quiz) {
    return (
      <div className="quiz-page">
        <section className="quiz-select">
          <div>
            <p className="quiz-eyebrow">Quiz center</p>
            <h1>Select your quiz</h1>
            <p>Choose a subject, paper set and scheduled quiz to begin.</p>
          </div>

          <div className="subject-panel">
            <label>
              Search
              <input
                placeholder="Title, subject or set"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <label>
              Subject
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            {selectedSubject && availableSets.length > 0 && (
              <label>
                Paper Set
                <select
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                >
                  <option value="">All Sets</option>
                  {availableSets.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label>
              Status
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
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

            <p className="empty-message">
              {loading
                ? "Loading quizzes..."
                : `${availableQuizzes.length} quiz available`}
            </p>
          </div>
        </section>

        <section className="subject-cards">
          {subjects.map((subject) => {
            const sets = getSetsForSubject(allQuiz, subject);
            const count = availableQuizzes.filter((item) => item.subject === subject).length;

            return (
              <button
                className={selectedSubject === subject ? "active" : ""}
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                type="button"
              >
                <span>{subject}</span>
                <small>
                  {count} quizzes{sets.length > 1 ? ` - ${sets.length} sets` : ""}
                </small>
              </button>
            );
          })}
        </section>

        <section className="quiz-list-grid">
          {availableQuizzes.length === 0 && !loading ? (
            <div className="quiz-empty-card">No quiz found for these filters.</div>
          ) : (
            availableQuizzes.map((item) => {
              const status = getQuizStatus(item);
              const scheduleValue = getScheduleValue(item, ["examDate", "createdAt"]);

              return (
                <article className="quiz-pick-card" key={item._id}>
                  <div>
                    <span className={`status-pill ${status.key}`}>{status.label}</span>
                    <h2>{item.title}</h2>
                    <p>
                      {item.subject} - {item.set || "Set 1"} -{" "}
                      {formatDuration(item.duration || 60)}
                    </p>
                    <small>
                      {getWeekDay(scheduleValue)} - {formatDisplayDate(scheduleValue)}
                    </small>
                  </div>
                  <button
                    disabled={!isQuizOpen(item)}
                    onClick={() => startQuiz(item)}
                    type="button"
                  >
                    Start Quiz
                  </button>
                </article>
              );
            })
          )}
        </section>

        {/* Mode Selection Modal */}
        {showModeModal && (
          <div className="strict-warning-backdrop">
            <div className="mode-select-card">
              <h2>Choose Quiz Mode</h2>
              <p>Select how you want to attempt this quiz</p>
              <div className="mode-options">
                <button className="mode-option exam" onClick={() => confirmStartQuiz('exam')}>
                  <GraduationCap size={32} />
                  <strong>Exam Mode</strong>
                  <span>Timer active, anti-cheat enabled, strict rules apply</span>
                </button>
                <button className="mode-option practice" onClick={() => confirmStartQuiz('practice')}>
                  <Zap size={32} />
                  <strong>Practice Mode</strong>
                  <span>No timer, no anti-cheat, reveal answers anytime</span>
                </button>
              </div>
              <button className="mode-cancel" onClick={() => { setShowModeModal(false); setPendingQuiz(null); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Supportive Chat Widget (QuizCopilot) at general pages */}
        <QuizCopilot />
      </div>
    );
  }

  const q = quiz.questions[current];
  const progress = ((current + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(answers).filter((key) => {
    const value = answers[key];
    return Array.isArray(value) ? value.length > 0 : value !== "" && value !== null;
  }).length;

  return (
    <div className="quiz-page">
      {/* 1. Confetti Particle canvas overlay */}
      {triggerConfetti && (
        <canvas id="confetti-canvas" className="confetti-overlay" />
      )}

      {/* 2. Strict Cheating Warning Modal */}
      {showWarningModal && (
        <div className="strict-warning-backdrop">
          <div className="strict-warning-card">
            <AlertTriangle className="strict-warning-icon" size={48} />
            <h2>Strict Exam Warning!</h2>
            <p>
              Tab-switching or closing window is strictly prohibited. Your actions are monitored!
            </p>
            <div className="warning-count-badge">
              Warning {warnings} of 3
            </div>
            <small>At warning 3, your quiz will automatically submit!</small>
            <button onClick={() => setShowWarningModal(false)}>
              I Understand, Continue Test
            </button>
          </div>
        </div>
      )}

      <section className="quiz-attempt">
        <header className="attempt-header">
          <div>
            <p className="quiz-eyebrow">
              {quiz.subject}
              {quiz.set ? <span className="set-badge"> - {quiz.set}</span> : null}
              {quizMode === 'practice' ? (
                <span className="practice-mode-tag">
                  <Zap size={12} className="inline-icon" /> PRACTICE MODE
                </span>
              ) : (
                <span className="strict-mode-tag">
                  <Shield size={12} className="inline-icon" /> STRICT MODE ACTIVE
                </span>
              )}
            </p>
            <h1>{quiz.title}</h1>
            <p className="attempt-date">
              {quiz.examDay ? `${quiz.examDay}, ` : ""}
              {formatDisplayDate(quiz.examDate)}
            </p>
          </div>

          {quizMode !== 'practice' && (
            <div className={`timer-card ${time <= 15 ? "danger" : ""}`}>
              <span>Time Left</span>
              <strong>{formatDuration(time)}</strong>
            </div>
          )}
          {quizMode === 'practice' && (
            <div className="timer-card practice">
              <span>Mode</span>
              <strong>Practice</strong>
            </div>
          )}
        </header>

        <div className="attempt-meta">
          <span>{user?.username}</span>
          <span>
            Question {current + 1} of {quiz.questions.length}
          </span>
          <span>{answeredCount} answered</span>
          {warnings > 0 && (
            <span className="warning-meta-tag">
              {warnings} Warning(s)
            </span>
          )}
        </div>

        <div className="progress">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <article className="question-card">
          <div className="question-card-header">
            <span className="question-count">Q{current + 1}</span>
            <button
              className={`bookmark-toggle ${isBookmarked(current) ? 'active' : ''}`}
              onClick={() => toggleBookmark(q)}
              type="button"
              title={isBookmarked(current) ? 'Remove bookmark' : 'Bookmark question'}
            >
              {isBookmarked(current) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            </button>
          </div>
          <h2>{q.question}</h2>

          {q.type === "short" ? (
            <div className="short-answer-input">
              <input
                disabled={submitted}
                placeholder="Type your answer"
                value={answers[current] || ""}
                onChange={(e) => setAnswer(q, e.target.value)}
              />
              {submitted && (
                <p>
                  Correct answer: <strong>{q.answer}</strong>
                </p>
              )}
            </div>
          ) : (
            <div className="quiz-options-grid">
              {q.options.map((opt, i) => {
                const selected =
                  q.type === "multiselect"
                    ? (answers[current] || []).includes(i)
                    : answers[current] === i;
                let className = "quiz-option";
                if (submitted) {
                  if (
                    q.type === "multiselect"
                      ? q.answer.includes(i)
                      : compareAnswers(q, i)
                  ) {
                    className += " correct";
                  } else if (selected) {
                    className += " wrong";
                  }
                } else if (selected) {
                  className += " selected";
                }

                const inputType = q.type === "multiselect" ? "checkbox" : "radio";

                return (
                  <label key={i} className={className}>
                    <input
                      checked={selected}
                      disabled={submitted}
                      type={inputType}
                      onChange={() => setAnswer(q, i)}
                    />
                    <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          )}
        </article>

        {/* Practice Mode: Reveal Answer Button */}
        {quizMode === 'practice' && !submitted && (
          <div className="practice-reveal-row">
            <button
              className="reveal-answer-btn"
              onClick={() => setRevealedAnswers((prev) => ({ ...prev, [current]: !prev[current] }))}
              type="button"
            >
              <Eye size={16} />
              {revealedAnswers[current] ? 'Hide Answer' : 'Reveal Answer'}
            </button>
            {revealedAnswers[current] && (
              <div className="revealed-answer">
                <strong>Correct Answer:</strong>{' '}
                {q.type === 'short'
                  ? q.answer
                  : q.type === 'multiselect'
                    ? q.answer.map((a) => q.options[a]).join(', ')
                    : q.options[q.answer]}
              </div>
            )}
          </div>
        )}

        <div className="quiz-nav-buttons">
          <button onClick={prev} disabled={current === 0}>
            Prev
          </button>
          {current === quiz.questions.length - 1 ? (
            <button className="submit-btn" onClick={handleSubmit} disabled={submitted}>
              Submit
            </button>
          ) : (
            <button onClick={next}>Next</button>
          )}
        </div>

        {submitted && (
          <div className="result-box">
            <strong>
              Score: {score} / {quiz.questions.length}
            </strong>
            <p>
              Your answer: {formatAnswer(answers[current], q.options)}. Redirecting to
              results...
            </p>
          </div>
        )}
      </section>

      {/* 3. Supportive Chat Widget (QuizCopilot) contextually linked to active question */}
      <QuizCopilot activeQuestion={q} submitted={submitted} />
    </div>
  );
}
