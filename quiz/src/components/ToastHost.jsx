import { useEffect, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { TOAST_EVENT } from "../utils/toast";
import "./toast.css";

const icons = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <TriangleAlert size={18} />,
  info: <Info size={18} />,
};

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const addToast = (event) => {
      const toast = event.detail;
      setToasts((current) => [toast, ...current].slice(0, 4));

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 3600);
    };

    window.addEventListener(TOAST_EVENT, addToast);
    return () => window.removeEventListener(TOAST_EVENT, addToast);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div className={`toast-card ${toast.type || "info"}`} key={toast.id}>
          <span className="toast-icon">{icons[toast.type] || icons.info}</span>
          <p>{toast.message}</p>
          <button
            aria-label="Dismiss notification"
            onClick={() =>
              setToasts((current) => current.filter((item) => item.id !== toast.id))
            }
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
