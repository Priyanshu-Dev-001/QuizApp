import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getWeekDay, toDateInputValue } from "../utils/dateFilters";
import {
  addCustomSubject,
  getSubjectOptions,
  normalizeSubject,
  readCustomSubjects,
  saveCustomSubjects,
} from "../utils/subjects";
import {
  createEmptyQuestion,
  formatDuration,
  questionTypeOptions,
} from "../utils/quizHelpers";
import { showToast } from "../utils/toast";
import "./teacher.css";

const presetSets = ["Set 1", "Set 2", "Set 3"];
const timerOptions = [30, 60, 120, 300, 600, 900, 1800, 3600];

const readQuestionBank = () => {
  try {
    return JSON.parse(localStorage.getItem("quizQuestionBank")) || [];
  } catch (error) {
    console.error("Invalid question bank:", error);
    return [];
  }
};

const saveQuestionBank = (questions) => {
  localStorage.setItem("quizQuestionBank", JSON.stringify(questions));
};

const combineDateTime = (date, time) => {
  if (!date || !time) return "";
  return new Date(`${date}T${time}:00`).toISOString();
};

const isAnswered = (question) => {
  if (question.type === "short") return Boolean(String(question.answer).trim());
  if (question.type === "multiselect") return question.answer.length > 0;
  return question.answer !== null;
};

const sanitizeQuestion = (question) => ({
  ...question,
  type: question.type || "mcq",
  question: question.question.trim(),
  options:
    question.type === "short"
      ? []
      : question.options.map((option) => option.trim()),
  answer:
    question.type === "short" ? String(question.answer).trim() : question.answer,
});

export default function TeacherDashboard() {
  const [quiz, setQuiz] = useState({
    title: "",
    subject: "",
    set: "Set 1",
    customSet: "",
    examDate: toDateInputValue(),
    startTime: "",
    endTime: "",
    duration: 60,
    questions: [],
  });
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [customSubjects, setCustomSubjects] = useState(readCustomSubjects);
  const [newSubject, setNewSubject] = useState("");
  const [renamingSubject, setRenamingSubject] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [questionBank, setQuestionBank] = useState(readQuestionBank);
  const [bankIndex, setBankIndex] = useState("");
  const [bankSearch, setBankSearch] = useState("");

  const resolvedSet = quiz.set === "__custom__" ? quiz.customSet.trim() : quiz.set;
  const subjectOptions = useMemo(
    () => getSubjectOptions([], customSubjects),
    [customSubjects]
  );
  const filteredBank = questionBank
    .map((question, index) => ({ ...question, index }))
    .filter((question) =>
      question.question.toLowerCase().includes(bankSearch.toLowerCase())
    );

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user._id) {
      showToast("User not loaded properly", "error");
      return;
    }

    setUsername(user.username);
    setUserId(user._id);
  }, []);

  const updateQuestions = (updater) => {
    setQuiz((prev) => ({ ...prev, questions: updater(prev.questions) }));
  };

  const addQuestion = (question = createEmptyQuestion()) => {
    updateQuestions((questions) => [...questions, question]);
  };

  const removeQuestion = (index) => {
    updateQuestions((questions) => questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, value) => {
    updateQuestions((questions) =>
      questions.map((question, i) =>
        i === index ? { ...question, question: value } : question
      )
    );
  };

  const updateQuestionType = (index, type) => {
    updateQuestions((questions) =>
      questions.map((question, i) =>
        i === index ? { ...createEmptyQuestion(type), question: question.question } : question
      )
    );
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    updateQuestions((questions) =>
      questions.map((question, i) =>
        i === questionIndex
          ? {
              ...question,
              options: question.options.map((option, j) =>
                j === optionIndex ? value : option
              ),
            }
          : question
      )
    );
  };

  const toggleCorrect = (questionIndex, optionIndex) => {
    updateQuestions((questions) =>
      questions.map((question, i) => {
        if (i !== questionIndex) return question;

        if (question.type === "multiselect") {
          const selected = new Set(question.answer);
          if (selected.has(optionIndex)) selected.delete(optionIndex);
          else selected.add(optionIndex);
          return { ...question, answer: [...selected].sort((a, b) => a - b) };
        }

        return { ...question, answer: optionIndex };
      })
    );
  };

  const updateShortAnswer = (questionIndex, value) => {
    updateQuestions((questions) =>
      questions.map((question, i) =>
        i === questionIndex ? { ...question, answer: value } : question
      )
    );
  };

  const addOption = (questionIndex) => {
    updateQuestions((questions) =>
      questions.map((question, i) =>
        i === questionIndex
          ? { ...question, options: [...question.options, ""] }
          : question
      )
    );
  };

  const removeOption = (questionIndex, optionIndex) => {
    updateQuestions((questions) =>
      questions.map((question, i) => {
        if (i !== questionIndex) return question;

        const nextOptions = question.options.filter((_, j) => j !== optionIndex);

        if (question.type === "multiselect") {
          const nextAnswer = question.answer
            .filter((item) => item !== optionIndex)
            .map((item) => (item > optionIndex ? item - 1 : item));
          return { ...question, options: nextOptions, answer: nextAnswer };
        }

        const nextAnswer =
          question.answer === optionIndex
            ? null
            : question.answer > optionIndex
              ? question.answer - 1
              : question.answer;

        return { ...question, options: nextOptions, answer: nextAnswer };
      })
    );
  };

  const addSubject = () => {
    const normalized = normalizeSubject(newSubject);
    if (!normalized) return showToast("Enter a subject name", "warning");
    const next = addCustomSubject(normalized);
    setCustomSubjects(next);
    setNewSubject("");
    showToast("Subject added", "success");
  };

  const removeSubject = (subject) => {
    const next = customSubjects.filter(
      (item) => item.toLowerCase() !== subject.toLowerCase()
    );
    saveCustomSubjects(next);
    setCustomSubjects(next);
    showToast("Subject removed", "info");
  };

  const startRenameSubject = (subject) => {
    setRenamingSubject(subject);
    setRenameValue(subject);
  };

  const saveRenameSubject = () => {
    const normalized = normalizeSubject(renameValue);
    if (!normalized) return showToast("Enter a new subject name", "warning");

    const next = customSubjects.map((subject) =>
      subject === renamingSubject ? normalized : subject
    );
    saveCustomSubjects(next);
    setCustomSubjects(readCustomSubjects());
    setRenamingSubject("");
    setRenameValue("");
    showToast("Subject renamed", "success");
  };

  const saveToBank = (question) => {
    if (!question.question.trim() || !isAnswered(question)) {
      showToast("Complete the question before saving to bank", "warning");
      return;
    }

    if (
      question.type !== "short" &&
      question.options.some((option) => !option.trim())
    ) {
      showToast("Options cannot be empty", "warning");
      return;
    }

    const next = [sanitizeQuestion(question), ...questionBank].slice(0, 80);
    setQuestionBank(next);
    saveQuestionBank(next);
    showToast("Question saved to bank", "success");
  };

  const addFromBank = () => {
    if (bankIndex === "") return showToast("Select a bank question", "warning");
    const bankQuestion = questionBank[Number(bankIndex)];
    if (!bankQuestion) return;

    addQuestion({
      ...bankQuestion,
      options: [...(bankQuestion.options || [])],
      answer: Array.isArray(bankQuestion.answer)
        ? [...bankQuestion.answer]
        : bankQuestion.answer,
    });
    setBankIndex("");
    showToast("Question added from bank", "success");
  };

  const removeFromBank = (index) => {
    const next = questionBank.filter((_, itemIndex) => itemIndex !== index);
    setQuestionBank(next);
    saveQuestionBank(next);
    showToast("Bank question deleted", "info");
  };

  const createQuiz = async () => {
    try {
      const subject = normalizeSubject(quiz.subject);

      if (!quiz.title.trim() || !subject) {
        showToast("Title and subject are required", "warning");
        return;
      }

      if (!userId) {
        showToast("User not loaded properly", "error");
        return;
      }

      if (!resolvedSet) {
        showToast("Set name is required", "warning");
        return;
      }

      if (quiz.questions.length === 0) {
        showToast("Add at least one question", "warning");
        return;
      }

      for (const question of quiz.questions) {
        if (!question.question.trim()) {
          showToast("Question text cannot be empty", "warning");
          return;
        }

        if (!isAnswered(question)) {
          showToast("Select or enter the correct answer", "warning");
          return;
        }

        if (
          question.type !== "short" &&
          question.options.some((option) => !option.trim())
        ) {
          showToast("Options cannot be empty", "warning");
          return;
        }
      }

      setLoading(true);

      await axios.post("/api/teacher-quiz", {
        title: quiz.title.trim(),
        subject,
        set: resolvedSet,
        examDate: quiz.examDate,
        examDay: getWeekDay(quiz.examDate),
        startAt: combineDateTime(quiz.examDate, quiz.startTime),
        endAt: combineDateTime(quiz.examDate, quiz.endTime),
        duration: quiz.duration,
        questions: quiz.questions.map(sanitizeQuestion),
        createdBy: userId,
      });

      setCustomSubjects(addCustomSubject(subject));
      showToast(`Quiz created: ${subject} / ${resolvedSet}`, "success");
      setQuiz({
        title: "",
        subject: "",
        set: "Set 1",
        customSet: "",
        examDate: toDateInputValue(),
        startTime: "",
        endTime: "",
        duration: 60,
        questions: [],
      });
    } catch (err) {
      console.log("ERROR:", err.response?.data || err.message);
      showToast(err.response?.data?.message || "Error creating quiz", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-page">
      <header className="teacher-header">
        <div>
          <p className="teacher-eyebrow">Teacher workspace</p>
          <h1>Welcome, {username || "Teacher"}</h1>
        </div>
      </header>

      <main className="teacher-layout">
        <aside className="quiz-sidebar">
          <div className="sidebar-card">
            <span className="card-label">Quiz setup</span>

            <label>
              Quiz title
              <input
                placeholder="Example: Motion and Forces"
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              />
            </label>

            <label>
              Subject
              <input
                list="teacher-subject-options"
                placeholder="Select or type new subject"
                value={quiz.subject}
                onChange={(e) => setQuiz({ ...quiz, subject: e.target.value })}
              />
              <datalist id="teacher-subject-options">
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject} />
                ))}
              </datalist>
            </label>

            <div className="subject-manager">
              <div className="inline-control">
                <input
                  placeholder="Add subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
                <button onClick={addSubject} type="button">
                  Add
                </button>
              </div>

              <div className="chip-list">
                {customSubjects.map((subject) => (
                  <div className="subject-chip" key={subject}>
                    {renamingSubject === subject ? (
                      <>
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                        />
                        <button onClick={saveRenameSubject} type="button">
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <span>{subject}</span>
                        <button onClick={() => startRenameSubject(subject)} type="button">
                          Rename
                        </button>
                        <button onClick={() => removeSubject(subject)} type="button">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <label>
              Paper set
              <select
                value={quiz.set}
                onChange={(e) =>
                  setQuiz({ ...quiz, set: e.target.value, customSet: "" })
                }
              >
                {presetSets.map((setName) => (
                  <option key={setName} value={setName}>
                    {setName}
                  </option>
                ))}
                <option value="__custom__">Custom Set</option>
              </select>
            </label>

            {quiz.set === "__custom__" && (
              <label>
                Custom set name
                <input
                  placeholder="Mock 1, Final, Practice"
                  value={quiz.customSet}
                  onChange={(e) => setQuiz({ ...quiz, customSet: e.target.value })}
                />
              </label>
            )}

            <label>
              Exam date
              <input
                type="date"
                value={quiz.examDate}
                onChange={(e) => setQuiz({ ...quiz, examDate: e.target.value })}
              />
            </label>

            <div className="time-grid">
              <label>
                Start time
                <input
                  type="time"
                  value={quiz.startTime}
                  onChange={(e) => setQuiz({ ...quiz, startTime: e.target.value })}
                />
              </label>
              <label>
                End time
                <input
                  type="time"
                  value={quiz.endTime}
                  onChange={(e) => setQuiz({ ...quiz, endTime: e.target.value })}
                />
              </label>
            </div>

            <label>
              Timer
              <select
                value={quiz.duration}
                onChange={(e) =>
                  setQuiz({ ...quiz, duration: Number(e.target.value) })
                }
              >
                {timerOptions.map((seconds) => (
                  <option key={seconds} value={seconds}>
                    {formatDuration(seconds)}
                  </option>
                ))}
              </select>
            </label>

            <p className="schedule-note">
              Week day: {getWeekDay(quiz.examDate) || "Select date"}
              <span>Set: {resolvedSet || "Select set"}</span>
            </p>

            <button className="create-btn" disabled={loading} onClick={createQuiz}>
              {loading ? "Creating..." : "Create Quiz"}
            </button>
          </div>

          <div className="sidebar-card">
            <span className="card-label">Question bank</span>
            <label>
              Search bank
              <input
                placeholder="Find saved question"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
              />
            </label>
            <div className="bank-controls">
              <select value={bankIndex} onChange={(e) => setBankIndex(e.target.value)}>
                <option value="">Select saved question</option>
                {filteredBank.map((question) => (
                  <option key={`${question.question}-${question.index}`} value={question.index}>
                    {question.question}
                  </option>
                ))}
              </select>
              <button className="header-action" onClick={addFromBank} type="button">
                Add From Bank
              </button>
            </div>
            {filteredBank.slice(0, 4).map((question) => (
              <div className="bank-row" key={`${question.question}-${question.index}`}>
                <span>{question.question}</span>
                <button onClick={() => removeFromBank(question.index)} type="button">
                  Delete
                </button>
              </div>
            ))}
          </div>

          <div className="summary-grid">
            <div>
              <strong>{quiz.questions.length}</strong>
              <span>Questions</span>
            </div>
            <div>
              <strong>
                {quiz.questions.reduce(
                  (total, question) => total + question.options.length,
                  0
                )}
              </strong>
              <span>Options</span>
            </div>
          </div>
        </aside>

        <section className="question-builder">
          {quiz.questions.length === 0 ? (
            <div className="empty-state">
              <p className="teacher-eyebrow">No questions yet</p>
              <h2>Build your first quiz question.</h2>
              <button onClick={() => addQuestion()} type="button">
                Add First Question
              </button>
            </div>
          ) : (
            quiz.questions.map((question, index) => (
              <article className="question-box" key={index}>
                <div className="question-head">
                  <div>
                    <span>Question {index + 1}</span>
                    <h2>{question.question || "Untitled question"}</h2>
                  </div>
                  <div className="question-tools">
                    <select
                      value={question.type || "mcq"}
                      onChange={(e) => updateQuestionType(index, e.target.value)}
                    >
                      {questionTypeOptions.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="header-action"
                      onClick={() => saveToBank(question)}
                      type="button"
                    >
                      Save Bank
                    </button>
                    <button
                      className="remove-btn"
                      onClick={() => removeQuestion(index)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <label className="question-input">
                  Question text
                  <input
                    placeholder="Enter question"
                    value={question.question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                  />
                </label>

                {question.type === "short" ? (
                  <label className="question-input short-answer-box">
                    Correct short answer
                    <input
                      placeholder="Accepted answer"
                      value={question.answer}
                      onChange={(e) => updateShortAnswer(index, e.target.value)}
                    />
                  </label>
                ) : (
                  <div className="options-grid">
                    {question.options.map((option, optionIndex) => {
                      const selected =
                        question.type === "multiselect"
                          ? question.answer.includes(optionIndex)
                          : question.answer === optionIndex;

                      return (
                        <div
                          className={`option-box ${selected ? "correct" : ""}`}
                          key={optionIndex}
                        >
                          <label className="radio-wrap">
                            <input
                              type={
                                question.type === "multiselect" ? "checkbox" : "radio"
                              }
                              name={`q-${index}`}
                              checked={selected}
                              onChange={() => toggleCorrect(index, optionIndex)}
                            />
                            <span />
                          </label>

                          <input
                            className="option-input"
                            disabled={question.type === "truefalse"}
                            placeholder={`Option ${optionIndex + 1}`}
                            type="text"
                            value={option}
                            onChange={(e) =>
                              updateOption(index, optionIndex, e.target.value)
                            }
                          />

                          {question.type !== "truefalse" &&
                            question.options.length > 2 && (
                              <button
                                aria-label={`Remove option ${optionIndex + 1}`}
                                className="remove-option"
                                onClick={() => removeOption(index, optionIndex)}
                                type="button"
                              >
                                x
                              </button>
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="btn-row">
                  {question.type !== "truefalse" && question.type !== "short" && (
                    <button onClick={() => addOption(index)} type="button">
                      Add Option
                    </button>
                  )}
                  <button onClick={() => addQuestion()} type="button">
                    Add Question
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
