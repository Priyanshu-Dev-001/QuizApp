export const defaultSubjects = ["Math", "Physics", "Chemistry"];

export const normalizeSubject = (value = "") =>
  value.trim().replace(/\s+/g, " ");

export const getSubjectOptions = (items = [], extras = []) => {
  const seen = new Set();
  const options = [];

  [...defaultSubjects, ...extras, ...items.map((item) => item?.subject)]
    .map(normalizeSubject)
    .filter(Boolean)
    .forEach((subject) => {
      const key = subject.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        options.push(subject);
      }
    });

  return options;
};
