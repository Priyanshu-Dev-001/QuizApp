export const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const defaultScheduleFields = ["examDate", "date", "createdAt"];

export function toDateInputValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getWeekDay(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return weekDays[date.getDay()];
}

export function getIsoWeekValue(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );

  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);

  return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function getScheduleValue(item, fields = defaultScheduleFields) {
  for (const field of fields) {
    if (item?.[field]) return item[field];
  }

  return "";
}

export function filterByDateWeek(items, filters = {}, fields = defaultScheduleFields) {
  const { date = "", week = "", day = "" } = filters;

  return items.filter((item) => {
    const scheduleValue = getScheduleValue(item, fields);

    if (!scheduleValue) return !(date || week || day);

    if (date && toDateInputValue(scheduleValue) !== date) return false;
    if (week && getIsoWeekValue(scheduleValue) !== week) return false;
    if (day && getWeekDay(scheduleValue) !== day) return false;

    return true;
  });
}

export function formatDisplayDate(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function buildFilterSummary({ date = "", week = "", day = "" } = {}) {
  const parts = [];

  if (date) parts.push(formatDisplayDate(date));
  if (week) parts.push(week);
  if (day) parts.push(day);

  return parts.length ? parts.join(" • ") : "All dates";
}
