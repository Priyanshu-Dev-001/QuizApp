import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  buildFilterSummary,
  filterByDateWeek,
  formatDisplayDate,
  getScheduleValue,
  getWeekDay,
  toDateInputValue,
  weekDays,
} from "../utils/dateFilters";
import { getSubjectOptions, normalizeSubject } from "../utils/subjects";
import {
  createEmptyQuestion,
  formatDuration,
  getQuizStatus,
  questionTypeOptions,
  toTimeInputValue,
} from "../utils/quizHelpers";
import { showToast } from "../utils/toast";
import "./teacherQuiz.css";

const combineDateTime = (date, time) => {
  if (!date || !time) return "";
  return new Date(`${date}T${time}:00`).toISOString();
};

const normalizeQuestionForDraft = (question = {}) => {
  const type = question.type || "mcq";
  const base = createEmptyQuestion(type);

  return {
    ...base,
    ...question,
    type,
    options: type === "short" ? [] : [...(question.options || base.options)],
    answer:
      type === "multiselect"
        ? Array.isArray(question.answer)
          ? [...question.answer]
          : []
        : type === "short"
          ? question.answer || ""
          : Number.isInteger(question.answer)
            ? question.answer
            : null,
  };
};

const sanitizeQuestion = (question) => ({
  ...question,
  question: question.question.trim(),
  options:
    question.type === "short"
      ? []
      : question.options.map((option) => option.trim()),
  answer:
    question.type === "short" ? String(question.answer).trim() : question.answer,
});

const isQuestionReady = (question) => {
  if (!question.question.trim()) return false;
  if (question.type === "short") return Boolean(String(question.answer).trim());
  if (question.options.some((option) => !option.trim())) return false;
  if (question.type === "multiselect") return question.answer.length > 0;
  return question.answer !== null;
};

export default function TeacherQuizList() {
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editDraft, setEditDraft] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      console.error("Invalid user data:", error);
      return null;
    }
  }, []);

  const subjects = getSubjectOptions(allQuizzes);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const url = user?._id
        ? `/api/teacher-quiz/${user._id}`
        : "/api/quiz";
      const res = await axios.get(url);
      setAllQuizzes(res.data || []);
    } catch (err) {
      console.log(err);
      showToast("Error loading quizzes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const filtered = useMemo(() => {
    const byDate = filterByDateWeek(
      allQuizzes,
      {
        date: selectedDate,
        week: selectedWeek,
        day: selectedDay,
      },
      ["examDate", "createdAt"]
    );

    return byDate.filter((quiz) => {
      const text = `${quiz.title} ${quiz.subject} ${quiz.set || ""}`.toLowerCase();
      const status = getQuizStatus(quiz).key;

      return (
        text.includes(search.toLowerCase()) &&
        (selectedSubject ? quiz.subject === selectedSubject : true) &&
        (selectedStatus ? status === selectedStatus : true)
      );
    });
  }, [
    allQuizzes,
    search,
    selectedDate,
    selectedDay,
    selectedStatus,
    selectedSubject,
    selectedWeek,
  ]);

  const canManageQuiz = (quiz) => {
    if (!user?._id || !quiz.createdBy) return false;
    return String(quiz.createdBy) === String(user._id);
  };

  const startEdit = (quiz) => {
    setEditingId(quiz._id);
    setEditDraft({
      title: quiz.title || "",
      subject: quiz.subject || "",
      set: quiz.set || "Set 1",
      examDate: toDateInputValue(getScheduleValue(quiz, ["examDate", "createdAt"])),
      startTime: toTimeInputValue(quiz.startAt),
      endTime: toTimeInputValue(quiz.endAt),
      duration: quiz.duration || 60,
      questions: (quiz.questions || []).map(normalizeQuestionForDraft),
    });
  };

  const updateDraftQuestion = (index, patch) => {
    setEditDraft((draft) => ({
      ...draft,
      questions: draft.questions.map((question, itemIndex) =>
        itemIndex === index ? { ...question, ...patch } : question
      ),
    }));
  };

  const changeQuestionType = (index, type) => {
    setEditDraft((draft) => ({
      ...draft,
      questions: draft.questions.map((question, itemIndex) =>
        itemIndex === index
          ? { ...createEmptyQuestion(type), question: question.question }
          : question
      ),
    }));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setEditDraft((draft) => ({
      ...draft,
      questions: draft.questions.map((question, itemIndex) =>
        itemIndex === questionIndex
          ? {
              ...question,
              options: question.options.map((option, index) =>
                index === optionIndex ? value : option
              ),
            }
          : question
      ),
    }));
  };

  const toggleCorrect = (questionIndex, optionIndex) => {
    setEditDraft((draft) => ({
      ...draft,
      questions: draft.questions.map((question, itemIndex) => {
        if (itemIndex !== questionIndex) return question;

        if (question.type === "multiselect") {
          const selected = new Set(question.answer);
          if (selected.has(optionIndex)) selected.delete(optionIndex);
          else selected.add(optionIndex);
          return { ...question, answer: [...selected].sort((a, b) => a - b) };
        }

        return { ...question, answer: optionIndex };
      }),
    }));
  };

  const addEditQuestion = () => {
    setEditDraft((draft) => ({
      ...draft,
      questions: [...draft.questions, createEmptyQuestion()],
    }));
  };

  const removeEditQuestion = (index) => {
    setEditDraft((draft) => ({
      ...draft,
      questions: draft.questions.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const saveEdit = async () => {
    if (!editDraft || !editingId) return;

    const subject = normalizeSubject(editDraft.subject);
    if (!editDraft.title.trim() || !subject || !editDraft.set.trim()) {
      showToast("Title, subject and set are required", "warning");
      return;
    }

    if (!editDraft.questions.length || editDraft.questions.some((q) => !isQuestionReady(q))) {
      showToast("Complete all questions before saving", "warning");
      return;
    }

    try {
      await axios.put(`/api/teacher-quiz/${editingId}`, {
        userId: user._id,
        title: editDraft.title,
        subject,
        set: editDraft.set,
        examDate: editDraft.examDate,
        examDay: getWeekDay(editDraft.examDate),
        startAt: combineDateTime(editDraft.examDate, editDraft.startTime),
        endAt: combineDateTime(editDraft.examDate, editDraft.endTime),
        duration: editDraft.duration,
        questions: editDraft.questions.map(sanitizeQuestion),
      });

      setEditingId("");
      setEditDraft(null);
      showToast("Quiz updated", "success");
      fetchQuizzes();
    } catch (err) {
      console.log(err);
      showToast(err.response?.data?.message || "Error updating quiz", "error");
    }
  };

  const deleteQuiz = async (quiz) => {
    if (!window.confirm(`Delete "${quiz.title}"?`)) return;

    try {
      await axios.delete(`/api/teacher-quiz/${quiz._id}`, {
        data: { userId: user._id },
      });
      showToast("Quiz deleted", "success");
      fetchQuizzes();
    } catch (err) {
      console.log(err);
      showToast(err.response?.data?.message || "Error deleting quiz", "error");
    }
  };

  const duplicateQuiz = async (quiz) => {
    try {
      await axios.post("/api/teacher-quiz", {
        title: `${quiz.title} Copy`,
        subject: quiz.subject,
        set: quiz.set || "Set 1",
        examDate: quiz.examDate,
        examDay: quiz.examDay,
        startAt: quiz.startAt || null,
        endAt: quiz.endAt || null,
        duration: quiz.duration || 60,
        questions: (quiz.questions || []).map(sanitizeQuestion),
        createdBy: user._id,
      });

      showToast("Quiz duplicated", "success");
      fetchQuizzes();
    } catch (err) {
      console.log(err);
      showToast(err.response?.data?.message || "Error duplicating quiz", "error");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedSubject("");
    setSelectedDate("");
    setSelectedWeek("");
    setSelectedDay("");
    setSelectedStatus("");
  };

  return (
    <div className="teacher-page">
      <header className="teacher-header">
        <div>
          <p className="teacher-eyebrow">Teacher workspace</p>
          <h1>Quiz Library</h1>
        </div>
      </header>

      <main className="teacher-layout">
        <aside className="quiz-sidebar">
          <div className="sidebar-card">
            <span className="card-label">Search and filter</span>

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
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </label>

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

            <button className="header-action" onClick={resetFilters} type="button">
              Reset Filters
            </button>
          </div>
        </aside>

        <section className="question-builder">
          {loading ? (
            <div className="empty-state">
              <p className="teacher-eyebrow">Loading</p>
              <h2>Loading quiz library...</h2>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <p className="teacher-eyebrow">No quizzes</p>
              <h2>No quizzes found for these filters.</h2>
            </div>
          ) : (
            filtered.map((quiz) => {
              const status = getQuizStatus(quiz);
              const scheduleValue = getScheduleValue(quiz, ["examDate", "createdAt"]);
              const canManage = canManageQuiz(quiz);

              return (
                <article className="question-box" key={quiz._id}>
                  <div className="question-head">
                    <div>
                      <span>{quiz.subject}</span>
                      <h2>{quiz.title}</h2>
                      <p className="schedule-note">
                        {getWeekDay(scheduleValue)} - {formatDisplayDate(scheduleValue)}
                        <span>
                          {quiz.set || "Set 1"} - {formatDuration(quiz.duration || 60)} -{" "}
                          {buildFilterSummary({
                            date: selectedDate,
                            week: selectedWeek,
                            day: selectedDay,
                          })}
                        </span>
                      </p>
                    </div>

                    <div className="library-actions">
                      <span className={`status-pill ${status.key}`}>{status.label}</span>
                      {canManage ? (
                        <>
                          <button onClick={() => startEdit(quiz)} type="button">
                            Edit
                          </button>
                          <button onClick={() => duplicateQuiz(quiz)} type="button">
                            Duplicate
                          </button>
                          <button
                            className="danger-action"
                            onClick={() => deleteQuiz(quiz)}
                            type="button"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="readonly-pill">Read only</span>
                      )}
                    </div>
                  </div>

                  {editingId === quiz._id && editDraft ? (
                    <div className="edit-quiz-form">
                      <div className="edit-grid">
                        <label>
                          Title
                          <input
                            value={editDraft.title}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, title: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Subject
                          <input
                            value={editDraft.subject}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, subject: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Set
                          <input
                            value={editDraft.set}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, set: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Date
                          <input
                            type="date"
                            value={editDraft.examDate}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, examDate: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Start
                          <input
                            type="time"
                            value={editDraft.startTime}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, startTime: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          End
                          <input
                            type="time"
                            value={editDraft.endTime}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, endTime: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Timer
                          <input
                            min="30"
                            step="30"
                            type="number"
                            value={editDraft.duration}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                duration: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                      </div>

                      {editDraft.questions.map((question, questionIndex) => (
                        <div className="edit-question-card" key={questionIndex}>
                          <div className="edit-question-head">
                            <strong>Question {questionIndex + 1}</strong>
                            <select
                              value={question.type}
                              onChange={(e) =>
                                changeQuestionType(questionIndex, e.target.value)
                              }
                            >
                              {questionTypeOptions.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                            <button
                              className="danger-action"
                              onClick={() => removeEditQuestion(questionIndex)}
                              type="button"
                            >
                              Remove
                            </button>
                          </div>

                          <input
                            placeholder="Question text"
                            value={question.question}
                            onChange={(e) =>
                              updateDraftQuestion(questionIndex, {
                                question: e.target.value,
                              })
                            }
                          />

                          {question.type === "short" ? (
                            <input
                              placeholder="Correct short answer"
                              value={question.answer}
                              onChange={(e) =>
                                updateDraftQuestion(questionIndex, {
                                  answer: e.target.value,
                                })
                              }
                            />
                          ) : (
                            <div className="edit-options-list">
                              {question.options.map((option, optionIndex) => {
                                const selected =
                                  question.type === "multiselect"
                                    ? question.answer.includes(optionIndex)
                                    : question.answer === optionIndex;

                                return (
                                  <label key={optionIndex}>
                                    <input
                                      checked={selected}
                                      name={`edit-${quiz._id}-${questionIndex}`}
                                      type={
                                        question.type === "multiselect"
                                          ? "checkbox"
                                          : "radio"
                                      }
                                      onChange={() =>
                                        toggleCorrect(questionIndex, optionIndex)
                                      }
                                    />
                                    <input
                                      disabled={question.type === "truefalse"}
                                      value={option}
                                      onChange={(e) =>
                                        updateOption(
                                          questionIndex,
                                          optionIndex,
                                          e.target.value
                                        )
                                      }
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="library-actions">
                        <button onClick={addEditQuestion} type="button">
                          Add Question
                        </button>
                        <button onClick={saveEdit} type="button">
                          Save Changes
                        </button>
                        <button
                          className="danger-action"
                          onClick={() => {
                            setEditingId("");
                            setEditDraft(null);
                          }}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    quiz.questions.map((q, i) => (
                      <div key={i} className="question-box quiz-library-question">
                        <h3>
                          Q{i + 1}. {q.question}
                        </h3>

                        {q.type === "short" ? (
                          <p className="schedule-note">Answer: {q.answer}</p>
                        ) : (
                          <div className="options-grid">
                            {q.options.map((opt, j) => (
                              <div
                                key={j}
                                className={`option-box ${
                                  Array.isArray(q.answer)
                                    ? q.answer.includes(j)
                                      ? "correct"
                                      : ""
                                    : j === q.answer
                                      ? "correct"
                                      : ""
                                }`}
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
