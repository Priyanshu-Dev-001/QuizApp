export const defaultSubjects = ["Math", "Physics", "Chemistry"];

export const normalizeSubject = (value = "") =>
  value.trim().replace(/\s+/g, " ");

export const readCustomSubjects = () => {
  try {
    return JSON.parse(localStorage.getItem("quizCustomSubjects")) || [];
  } catch (error) {
    console.error("Invalid custom subjects:", error);
    return [];
  }
};

const uniqueSubjects = (subjects = []) => {
  const seen = new Set();
  const options = [];

  subjects
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

export const saveCustomSubjects = (subjects = []) => {
  localStorage.setItem("quizCustomSubjects", JSON.stringify(uniqueSubjects(subjects)));
};

export const addCustomSubject = (subject) => {
  const normalized = normalizeSubject(subject);
  if (!normalized) return readCustomSubjects();

  const nextSubjects = uniqueSubjects([...readCustomSubjects(), normalized]);
  localStorage.setItem("quizCustomSubjects", JSON.stringify(nextSubjects));
  return nextSubjects;
};

export const getSubjectOptions = (items = [], extras = []) => {
  const seen = new Set();
  const options = [];

  [...defaultSubjects, ...readCustomSubjects(), ...extras, ...items.map((item) => item?.subject)]
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
