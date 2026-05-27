const Quiz = require("../models/quiz.model");

const weekDays = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

const getDayName = (value) => {
  const date = value ? new Date(value) : new Date();
  return weekDays[date.getDay()];
};

const normalizeSubject = (value = "") => value.trim().replace(/\s+/g, " ");

const escapeRegExp = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getDateRange = (value) => {
  if (!value) return null;
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return null;
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const getWeekRange = (value) => {
  if (!value) return null;
  const [year, week] = value.split("-W").map(Number);
  if (!year || !week) return null;
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const day = simple.getUTCDay() || 7;
  const start = new Date(simple);
  if (day <= 4) start.setUTCDate(simple.getUTCDate() - day + 1);
  else start.setUTCDate(simple.getUTCDate() + 8 - day);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
};

const applyScheduleFilters = (query, filters = {}) => {
  const conditions = [];
  const dateRange = getDateRange(filters.date);
  const weekRange = getWeekRange(filters.week);

  if (dateRange) {
    conditions.push({
      $or: [
        { examDate: { $gte: dateRange.start, $lt: dateRange.end } },
        { examDate: { $exists: false }, createdAt: { $gte: dateRange.start, $lt: dateRange.end } },
      ],
    });
  }

  if (weekRange) {
    conditions.push({
      $or: [
        { examDate: { $gte: weekRange.start, $lt: weekRange.end } },
        { examDate: { $exists: false }, createdAt: { $gte: weekRange.start, $lt: weekRange.end } },
      ],
    });
  }

  if (filters.day) conditions.push({ examDay: filters.day });

  // ✅ SET FILTER
  if (filters.set) conditions.push({ set: filters.set });

  if (!conditions.length) return query;
  return { ...query, $and: conditions };
};

exports.createQuiz = async (req, res) => {
  try {
    const { title, subject, questions, createdBy, examDate, set } = req.body;
    const normalizedSubject = normalizeSubject(subject);

    if (!title || !normalizedSubject || !questions?.length || !createdBy) {
      return res.status(400).json({
        message: "Title, subject, questions and createdBy required",
      });
    }

    const quiz = new Quiz({
      title: title.trim(),
      subject: normalizedSubject,
      set: set?.trim() || "Set 1",
      questions,
      createdBy,
      examDate: examDate || new Date(),
      examDay: getDayName(examDate),
    });

    await quiz.save();
    res.status(201).json({ message: "Quiz created", quiz });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    const query = applyScheduleFilters({}, req.query);
    const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuizBySubject = async (req, res) => {
  try {
    const subject = normalizeSubject(req.params.subject);
    const query = applyScheduleFilters(
      { subject: new RegExp(`^${escapeRegExp(subject)}$`, "i") },
      req.query
    );
    const quizzes = await Quiz.find(query);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeacherQuizzes = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const query = applyScheduleFilters(
      { $or: [{ createdBy: teacherId }, { createdBy: null }] },
      req.query
    );
    const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const quiz = await Quiz.findById(id);

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.createdBy?.toString() !== userId)
      return res.status(403).json({ message: "Not authorized" });

    await Quiz.findByIdAndDelete(id);
    res.json({ message: "Quiz deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, examDate } = req.body;
    const quiz = await Quiz.findById(id);

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.createdBy?.toString() !== userId)
      return res.status(403).json({ message: "Not authorized" });

    const updated = await Quiz.findByIdAndUpdate(
      id,
      {
        ...req.body,
        ...(req.body.subject ? { subject: normalizeSubject(req.body.subject) } : {}),
        ...(req.body.set ? { set: req.body.set.trim() } : {}),
        ...(examDate ? { examDay: getDayName(examDate) } : {}),
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};