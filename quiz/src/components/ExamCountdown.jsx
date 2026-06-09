import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import "./ExamCountdown.css";

const load = () => { try { return JSON.parse(localStorage.getItem("examDates") || "[]"); } catch { return []; } };
const save = (d) => localStorage.setItem("examDates", JSON.stringify(d));

export default function ExamCountdown() {
  const [exams, setExams]   = useState(load);
  const [open, setOpen]     = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({ name:"", date:"", subject:"" });
  const [now, setNow]       = useState(Date.now());

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);

  const addExam = () => {
    if (!form.name.trim() || !form.date) return;
    const exam = { id: Date.now(), ...form };
    const updated = [...exams, exam].sort((a,b) => new Date(a.date)-new Date(b.date));
    setExams(updated); save(updated);
    setForm({ name:"", date:"", subject:"" }); setAdding(false);
  };
  const remove = (id) => { const u = exams.filter(e=>e.id!==id); setExams(u); save(u); };

  const getDiff = (dateStr) => {
    const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
    const days = Math.ceil(diff / 86400000);
    return days;
  };

  const upcoming = exams.filter(e => getDiff(e.date) >= 0).slice(0, 5);

  return (
    <div className="ec-widget">
      <div className="ec-head" onClick={() => setOpen(o=>!o)}>
        <span className="ec-head-title"><Calendar size={16} /> Exam Countdown</span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {upcoming.length > 0 && <span className="ec-count-badge">{upcoming.length}</span>}
          {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </div>
      </div>

      {open && (
        <div className="ec-body">
          {upcoming.length === 0 && !adding && (
            <p className="ec-empty">No upcoming exams. Add one! 📅</p>
          )}
          {upcoming.map(e => {
            const days = getDiff(e.date);
            const urgent = days <= 7;
            return (
              <div key={e.id} className={`ec-exam ${urgent?"urgent":""}`}>
                <div className="ec-exam-info">
                  <span className="ec-exam-name">{e.name}</span>
                  {e.subject && <span className="ec-exam-sub">{e.subject}</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span className={`ec-days ${days===0?"today":days<=3?"near":""}`}>
                    {days===0?"Today!":days===1?"Tomorrow":`${days}d`}
                  </span>
                  <button className="ec-del" onClick={()=>remove(e.id)}><Trash2 size={12}/></button>
                </div>
              </div>
            );
          })}

          {adding ? (
            <div className="ec-form">
              <input className="ec-input" placeholder="Exam name *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
              <input className="ec-input" placeholder="Subject" value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} />
              <input className="ec-input" type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} />
              <div style={{display:"flex",gap:8}}>
                <button className="ec-cancel" onClick={()=>setAdding(false)}>Cancel</button>
                <button className="ec-save" onClick={addExam}>Save</button>
              </div>
            </div>
          ) : (
            <button className="ec-add-btn" onClick={()=>setAdding(true)}><Plus size={14}/> Add Exam</button>
          )}
        </div>
      )}
    </div>
  );
}
