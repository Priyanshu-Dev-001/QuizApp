export const questionTypeOptions = [
  { value: "mcq", label: "MCQ" },
  { value: "truefalse", label: "True / False" },
  { value: "multiselect", label: "Multi-select" },
  { value: "short", label: "Short Answer" },
];

export const createEmptyQuestion = (type = "mcq") => {
  if (type === "truefalse") {
    return { type, question: "", options: ["True", "False"], answer: null };
  }

  if (type === "short") {
    return { type, question: "", options: [], answer: "" };
  }

  if (type === "multiselect") {
    return { type, question: "", options: ["", "", "", ""], answer: [] };
  }

  return { type, question: "", options: ["", "", "", ""], answer: null };
};

export const formatDuration = (seconds = 0) => {
  const value = Number(seconds) || 0;
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  const remaining = value % 60;
  return remaining ? `${minutes}m ${remaining}s` : `${minutes} min`;
};

export const toTimeInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

export const getQuizStatus = (quiz, now = new Date()) => {
  const start = quiz?.startAt ? new Date(quiz.startAt) : null;
  const end = quiz?.endAt ? new Date(quiz.endAt) : null;

  if (start && !Number.isNaN(start.getTime()) && now < start) {
    return { key: "upcoming", label: "Upcoming" };
  }

  if (end && !Number.isNaN(end.getTime()) && now > end) {
    return { key: "expired", label: "Expired" };
  }

  if (start || end) return { key: "open", label: "Open now" };
  return { key: "open", label: "Practice" };
};

export const isQuizOpen = (quiz) => getQuizStatus(quiz).key === "open";

export const normalizeText = (value = "") =>
  String(value).trim().replace(/\s+/g, " ").toLowerCase();

export const compareAnswers = (question, selectedAnswer) => {
  if (question.type === "short") {
    return normalizeText(selectedAnswer) === normalizeText(question.answer);
  }

  if (question.type === "multiselect") {
    const selected = Array.isArray(selectedAnswer) ? [...selectedAnswer].sort() : [];
    const correct = Array.isArray(question.answer) ? [...question.answer].sort() : [];

    return (
      selected.length === correct.length &&
      selected.every((value, index) => value === correct[index])
    );
  }

  return Number(selectedAnswer) === Number(question.answer);
};

export const formatAnswer = (answer, options = []) => {
  if (Array.isArray(answer)) {
    return answer.map((index) => options[index] ?? index).join(", ") || "Not answered";
  }

  if (Number.isInteger(answer)) {
    return options[answer] ?? "Not answered";
  }

  return answer || "Not answered";
};
