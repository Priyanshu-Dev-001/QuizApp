import { useState } from "react";
import { ClipboardList, Plus, Trash2, CheckCircle, Circle, AlertCircle, Calendar, Flag } from "lucide-react";
import "./assignment-tracker.css";

const SUBJECTS = ["Physics","Chemistry","Mathematics","Biology","English","History","Geography","Other"];
const PRIORITIES = [
  { value:"high",   label:"High",   color:"#ef4444" },
  { value:"medium", label:"Medium", color:"#f59e0b" },
  { value:"low",    label:"Low",    color:"#10b981" },
];

const load = () => { try { return JSON.parse(localStorage.getItem("assignments") || "[]"); } catch { return []; } };
const save = (data) => localStorage.setItem("assignments", JSON.stringify(data));

const daysLeft = (due) => {
  const d = Math.ceil((new Date(due) - new Date().setHours(0,0,0,0)) / 86400000);
  return d;
};

export default function AssignmentTracker() {
  const [tasks, setTasks]     = useState(load);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter]   = useState("all"); // all | pending | done
  const [form, setForm]       = useState({ title:"", subject:"Physics", due:"", priority:"medium", notes:"" });

  const update = (newTasks) => { setTasks(newTasks); save(newTasks); };

  const addTask = () => {
    if (!form.title.trim() || !form.due) return;
    const task = { id: Date.now(), ...form, done: false, createdAt: new Date().toISOString() };
    update([task, ...tasks]);
    setForm({ title:"", subject:"Physics", due:"", priority:"medium", notes:"" });
    setShowForm(false);
  };

  const toggle = (id) => update(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => update(tasks.filter(t => t.id !== id));

  const filtered = tasks.filter(t => filter === "all" ? true : filter === "done" ? t.done : !t.done)
    .sort((a, b) => new Date(a.due) - new Date(b.due));

  const pending = tasks.filter(t => !t.done).length;
  const overdue = tasks.filter(t => !t.done && daysLeft(t.due) < 0).length;

  return (
    <div className="at-page">
      <div className="at-hero">
        <div className="at-eyebrow"><ClipboardList size={13} /> Assignment Tracker</div>
        <h1>Assignment Tracker</h1>
        <p>Never miss a deadline. Track all your homework and assignments.</p>
      </div>

      {/* Stats */}
      <div className="at-stats">
        <div className="at-stat blue"><span>{tasks.length}</span><small>Total</small></div>
        <div className="at-stat amber"><span>{pending}</span><small>Pending</small></div>
        <div className="at-stat green"><span>{tasks.length - pending}</span><small>Done</small></div>
        {overdue > 0 && <div className="at-stat red"><span>{overdue}</span><small>Overdue</small></div>}
      </div>

      {/* Controls */}
      <div className="at-controls">
        <div className="at-filters">
          {["all","pending","done"].map(f => (
            <button key={f} className={`at-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="at-add-btn" onClick={() => setShowForm(s => !s)}>
          <Plus size={16} /> Add Assignment
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="at-form">
          <h3 className="at-form-title"><Plus size={16} /> New Assignment</h3>
          <div className="at-form-grid">
            <input className="at-input span2" placeholder="Assignment title *" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
            <select className="at-input" value={form.subject} onChange={e => setForm(p=>({...p,subject:e.target.value}))}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
            <input className="at-input" type="date" value={form.due} onChange={e => setForm(p=>({...p,due:e.target.value}))} />
            <select className="at-input" value={form.priority} onChange={e => setForm(p=>({...p,priority:e.target.value}))}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label} Priority</option>)}
            </select>
            <textarea className="at-input span2 at-textarea" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} rows={2} />
          </div>
          <div className="at-form-actions">
            <button className="at-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="at-save-btn" onClick={addTask}><CheckCircle size={15} /> Save Assignment</button>
          </div>
        </div>
      )}

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="at-empty">
          <ClipboardList size={52} strokeWidth={1.2} />
          <h2>{filter === "done" ? "No completed assignments yet" : "No assignments! 🎉"}</h2>
          <p>{filter === "all" ? "Click 'Add Assignment' to get started." : "Switch filter to see other tasks."}</p>
        </div>
      ) : (
        <div className="at-list">
          {filtered.map(t => {
            const days = daysLeft(t.due);
            const pri = PRIORITIES.find(p => p.value === t.priority);
            return (
              <div key={t.id} className={`at-task ${t.done ? "done" : ""} ${!t.done && days < 0 ? "overdue" : ""}`}>
                <button className="at-check" onClick={() => toggle(t.id)}>
                  {t.done ? <CheckCircle size={22} color="#10b981" /> : <Circle size={22} color="#94a3b8" />}
                </button>
                <div className="at-task-info">
                  <div className="at-task-top">
                    <span className="at-task-title">{t.title}</span>
                    <span className="at-priority-dot" style={{ background: pri?.color }} title={pri?.label + " Priority"} />
                  </div>
                  <div className="at-task-meta">
                    <span className="at-task-subject">{t.subject}</span>
                    <span className={`at-due ${!t.done && days < 0 ? "red" : days <= 2 && !t.done ? "amber" : ""}`}>
                      <Calendar size={12} />
                      {t.done ? "Completed" : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                    </span>
                    {t.notes && <span className="at-task-notes">{t.notes}</span>}
                  </div>
                </div>
                <button className="at-del-btn" onClick={() => remove(t.id)}><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
