import { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw, X, Coffee, Brain, ChevronUp } from "lucide-react";
import { showToast } from "../utils/toast";
import "./PomodoroTimer.css";

const MODES = {
  focus:  { label: "Focus",       minutes: 25, color: "#6366f1" },
  short:  { label: "Short Break", minutes: 5,  color: "#10b981" },
  long:   { label: "Long Break",  minutes: 15, color: "#8b5cf6" },
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PomodoroTimer() {
  const [mode, setMode]         = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning]   = useState(false);
  const [sessions, setSessions] = useState(0);
  const [open, setOpen]         = useState(false);
  const intervalRef = useRef(null);

  const totalSeconds = MODES[mode].minutes * 60;
  const progress     = secondsLeft / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        clearInterval(intervalRef.current);
        setRunning(false);
        setSessions((s) => s + 1);
        showToast(
          mode === "focus"
            ? "Focus session done! Take a break 🎉"
            : "Break over! Time to focus 🚀",
          "success"
        );
        return 0;
      }
      return prev - 1;
    });
  }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, tick]);

  const switchMode = (m) => {
    stop();
    setMode(m);
    setSecondsLeft(MODES[m].minutes * 60);
  };

  const reset = () => {
    stop();
    setSecondsLeft(MODES[mode].minutes * 60);
  };

  const color = MODES[mode].color;

  return (
    <div className={`pomo-widget ${open ? "pomo-open" : "pomo-closed"}`}>
      {!open ? (
        <button className="pomo-fab" onClick={() => setOpen(true)} style={{ "--pomo-color": color }} title="Pomodoro Timer">
          <Timer size={22} />
          {running && <span className="pomo-fab-time">{mins}:{secs}</span>}
          {running && <span className="pomo-fab-dot" />}
        </button>
      ) : (
        <div className="pomo-panel" style={{ "--pomo-color": color }}>
          <div className="pomo-header">
            <div className="pomo-title"><Timer size={16} /> Pomodoro Timer</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="pomo-icon-btn" onClick={() => setOpen(false)} title="Minimize"><ChevronUp size={15} /></button>
              <button className="pomo-icon-btn" onClick={() => { stop(); setOpen(false); }} title="Close"><X size={15} /></button>
            </div>
          </div>

          <div className="pomo-mode-tabs">
            {Object.entries(MODES).map(([key, val]) => (
              <button
                key={key}
                className={`pomo-mode-btn ${mode === key ? "active" : ""}`}
                onClick={() => switchMode(key)}
                style={mode === key ? { "--pomo-color": val.color } : {}}
              >
                {key === "focus" ? <Brain size={12} /> : <Coffee size={12} />}
                {val.label}
              </button>
            ))}
          </div>

          <div className="pomo-ring-wrap">
            <svg className="pomo-ring" viewBox="0 0 120 120">
              <circle className="pomo-ring-bg" cx="60" cy="60" r={RADIUS} />
              <circle
                className="pomo-ring-fill"
                cx="60" cy="60" r={RADIUS}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                style={{ stroke: color }}
              />
            </svg>
            <div className="pomo-time-display">
              <span className="pomo-time">{mins}:{secs}</span>
              <span className="pomo-mode-label">{MODES[mode].label}</span>
            </div>
          </div>

          <div className="pomo-controls">
            <button className="pomo-ctrl-btn reset" onClick={reset} title="Reset">
              <RotateCcw size={16} />
            </button>
            <button
              className={`pomo-ctrl-btn main ${running ? "pause" : "play"}`}
              onClick={() => setRunning((r) => !r)}
            >
              {running ? <Pause size={20} /> : <Play size={20} />}
              {running ? "Pause" : "Start"}
            </button>
          </div>

          {sessions > 0 && (
            <div className="pomo-sessions">
              🍅 {sessions} session{sessions > 1 ? "s" : ""} completed today
            </div>
          )}

          <div className="pomo-tip">
            💡 25 min focus → 5 min break → repeat!
          </div>
        </div>
      )}
    </div>
  );
}
