export const TOAST_EVENT = "quizapp:toast";

export function showToast(message, type = "info") {
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        type,
      },
    })
  );
}
