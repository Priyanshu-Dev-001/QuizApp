const Result = require("../models/result.model");

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const getDayName = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return weekDays[date.getDay()];
};

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

const applyResultFilters = (filters = {}) => {
  const conditions = [];
  const dateRange = getDateRange(filters.date);
  const weekRange = getWeekRange(filters.week);

  if (dateRange) {
    conditions.push({
      $or: [
        { examDate: { $gte: dateRange.start, $lt: dateRange.end } },
        { date: { $gte: dateRange.start, $lt: dateRange.end } },
      ],
    });
  }

  if (weekRange) {
    conditions.push({
      $or: [
        { examDate: { $gte: weekRange.start, $lt: weekRange.end } },
        { date: { $gte: weekRange.start, $lt: weekRange.end } },
      ],
    });
  }

  if (filters.day) {
    conditions.push({ examDay: filters.day });
  }

  if (filters.subject) {
    conditions.push({ subject: filters.subject });
  }

  if (filters.set) {
    conditions.push({ set: filters.set });
  }

  if (filters.username) {
    conditions.push({ username: new RegExp(filters.username, "i") });
  }

  if (filters.userId) {
    conditions.push({ userId: filters.userId });
  }

  return conditions.length ? { $and: conditions } : {};
};

exports.saveResult = async (req, res) => {
  try {
    const {
      username,
      userId,
      quizId,
      title,
      subject,
      set,
      score,
      total,
      examDate,
      examDay,
      duration,
      timeSpent,
      answers,
    } = req.body;

    const result = new Result({
      userId: userId || null,
      quizId: quizId || null,
      username,
      title,
      subject,
      set: set || "Set 1",
      score,
      total,
      examDate: examDate || null,
      examDay: examDay || getDayName(examDate),
      duration: Number(duration) || 60,
      timeSpent: Number(timeSpent) || 0,
      answers: Array.isArray(answers) ? answers : [],
    });

    await result.save();

    res.status(201).json({ message: "Result saved", result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const query = applyResultFilters(req.query);
    const results = await Result.find(query).sort({ date: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
