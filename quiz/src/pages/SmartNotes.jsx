import { useState, useEffect, useRef } from "react";
import { StickyNote, Plus, Trash2, Save, Search, Tag } from "lucide-react";
import { showToast } from "../utils/toast";
import "./smart-notes.css";

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"];
const SUBJECTS = ["Physics","Chemistry","Mathematics","Biology","English","History","Geography","General","Other"];

const load = () => { try { return JSON.parse(localStorage.getItem("smartNotes") || "[]"); } catch { return []; } };
const save = (d) => localStorage.setItem("smartNotes", JSON.stringify(d));

export default function SmartNotes() {
  const [notes, setNotes]     = useState(load);
  const [active, setActive]   = useState(null);
  const [search, setSearch]   = useState("");
  const [filterSub, setFilterSub] = useState("All");
  const textRef = useRef(null);

  useEffect(() => { if (active && textRef.current) textRef.current.focus(); }, [active]);

  const update = (n) => { setNotes(n); save(n); };

  const newNote = () => {
    const note = { id: Date.now(), title: "Untitled Note", content: "", subject: "General", color: COLORS[0], updatedAt: new Date().toISOString() };
    const updated = [note, ...notes];
    update(updated);
    setActive(note.id);
  };

  const del = (id) => { update(notes.filter(n => n.id !== id)); if (active === id) setActive(null); };

  const patch = (id, field, val) => {
    const updated = notes.map(n => n.id === id ? { ...n, [field]: val, updatedAt: new Date().toISOString() } : n);
    update(updated);
  };

  const saveNote = () => { showToast("Note saved! 📝", "success"); };

  const current = notes.find(n => n.id === active);
  const filtered = notes.filter(n => {
    const matchSub = filterSub === "All" || n.subject === filterSub;
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    return matchSub && matchSearch;
  });

  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });

  return (
    <div className="sn-page">
      {/* SIDEBAR */}
      <div className="sn-sidebar">
        <div className="sn-sidebar-top">
          <div className="sn-eyebrow"><StickyNote size={13} /> Smart Notes</div>
          <button className="sn-new-btn" onClick={newNote}><Plus size={15} /> New Note</button>
        </div>

        <div className="sn-search-row">
          <div className="sn-search-wrap"><Search size={14} className="sn-search-icon" /><input className="sn-search" placeholder="Search notes..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        </div>

        <div className="sn-filter-row">
          {["All",...SUBJECTS].map(s => (
            <button key={s} className={`sn-filter-pill ${filterSub===s?"active":""}`} onClick={()=>setFilterSub(s)}>{s}</button>
          ))}
        </div>

        <div className="sn-list">
          {filtered.length === 0 && <p className="sn-empty-list">No notes found.</p>}
          {filtered.map(n => (
            <div key={n.id} className={`sn-item ${active===n.id?"selected":""}`} onClick={()=>setActive(n.id)}>
              <div className="sn-item-dot" style={{background:n.color}} />
              <div className="sn-item-info">
                <span className="sn-item-title">{n.title || "Untitled"}</span>
                <span className="sn-item-meta">{n.subject} · {fmt(n.updatedAt)}</span>
              </div>
              <button className="sn-item-del" onClick={e=>{e.stopPropagation();del(n.id);}}><Trash2 size={13}/></button>
            </div>
          ))}
        </div>
      </div>

      {/* EDITOR */}
      <div className="sn-editor">
        {!current ? (
          <div className="sn-empty-editor">
            <StickyNote size={60} strokeWidth={1.2} />
            <h2>Select a note or create one</h2>
            <p>Your notes are saved locally on this device.</p>
            <button className="sn-new-big" onClick={newNote}><Plus size={18}/> Create First Note</button>
          </div>
        ) : (
          <>
            <div className="sn-editor-top">
              <input className="sn-title-input" value={current.title} onChange={e=>patch(current.id,"title",e.target.value)} placeholder="Note title..." />
              <div className="sn-editor-meta">
                <select className="sn-subj-sel" value={current.subject} onChange={e=>patch(current.id,"subject",e.target.value)}>
                  {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                </select>
                <div className="sn-colors">
                  {COLORS.map(c=>(
                    <button key={c} className={`sn-color-dot ${current.color===c?"ring":""}`} style={{background:c}} onClick={()=>patch(current.id,"color",c)} />
                  ))}
                </div>
                <button className="sn-save-btn" onClick={saveNote}><Save size={14}/> Save</button>
              </div>
            </div>
            <div className="sn-tag-row">
              <Tag size={13} style={{color:"#94a3b8"}}/>
              <span className="sn-tag" style={{borderColor:current.color,color:current.color}}>{current.subject}</span>
              <span className="sn-updated">Last updated: {fmt(current.updatedAt)}</span>
            </div>
            <textarea ref={textRef} className="sn-textarea" value={current.content} onChange={e=>patch(current.id,"content",e.target.value)} placeholder="Start writing your notes here...&#10;&#10;✏️ Use this space for:&#10;• Key formulas and concepts&#10;• Summary of topics&#10;• Important points to remember&#10;• Revision notes" />
            <div className="sn-word-count">{current.content.trim() ? current.content.trim().split(/\s+/).length : 0} words · {current.content.length} chars</div>
          </>
        )}
      </div>
    </div>
  );
}
