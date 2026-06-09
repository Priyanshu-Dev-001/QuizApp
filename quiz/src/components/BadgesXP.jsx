import { useEffect, useState } from "react";
import axios from "axios";
import { Zap, Star, Trophy, Flame, Target, BookOpen, Award, Shield } from "lucide-react";
import "./BadgesXP.css";

const BADGE_DEFS = [
  { id:"first_quiz",   label:"First Quiz",     icon:<BookOpen size={18}/>,  color:"#6366f1", desc:"Completed your first quiz",   check: (r) => r.length >= 1 },
  { id:"five_quizzes", label:"Quiz Explorer",  icon:<Target size={18}/>,    color:"#06b6d4", desc:"Completed 5 quizzes",          check: (r) => r.length >= 5 },
  { id:"ten_quizzes",  label:"Quiz Master",    icon:<Trophy size={18}/>,    color:"#f59e0b", desc:"Completed 10 quizzes",         check: (r) => r.length >= 10 },
  { id:"twenty_five",  label:"Quiz Legend",    icon:<Award size={18}/>,     color:"#8b5cf6", desc:"Completed 25 quizzes",         check: (r) => r.length >= 25 },
  { id:"perfect",      label:"Perfect Score",  icon:<Star size={18}/>,      color:"#10b981", desc:"Got 100% in a quiz",           check: (r) => r.some(x => x.score === x.total && x.total > 0) },
  { id:"streak3",      label:"On Fire 🔥",      icon:<Flame size={18}/>,     color:"#ef4444", desc:"3-day study streak",           check: (r, streak) => streak >= 3 },
  { id:"streak7",      label:"Week Warrior",   icon:<Shield size={18}/>,    color:"#f97316", desc:"7-day study streak",           check: (r, streak) => streak >= 7 },
  { id:"xp500",        label:"XP Hunter",      icon:<Zap size={18}/>,       color:"#a855f7", desc:"Earned 500 XP total",          check: (r) => r.reduce((s,x)=>s+x.score*15,0) >= 500 },
];

const LEVELS = [
  { min:0,    max:199,   label:"Beginner",    color:"#94a3b8" },
  { min:200,  max:499,   label:"Learner",     color:"#6366f1" },
  { min:500,  max:999,   label:"Scholar",     color:"#06b6d4" },
  { min:1000, max:1999,  label:"Expert",      color:"#10b981" },
  { min:2000, max:3999,  label:"Master",      color:"#f59e0b" },
  { min:4000, max:99999, label:"Legend",      color:"#ef4444" },
];

function calcStreak(results) {
  const dates = [...new Set(results.map(r => new Date(r.date).toDateString()))].map(d => new Date(d)).sort((a,b)=>b-a);
  if (!dates.length) return 0;
  const today = new Date(); today.setHours(0,0,0,0);
  if (Math.ceil(Math.abs(today - dates[0]) / 86400000) > 1) return 0;
  let streak = 1;
  for (let i=0;i<dates.length-1;i++) {
    if (Math.ceil(Math.abs(dates[i]-dates[i+1])/86400000) === 1) streak++;
    else break;
  }
  return streak;
}

export default function BadgesXP({ compact = false }) {
  const [xp, setXp]           = useState(0);
  const [badges, setBadges]   = useState([]);
  const [streak, setStreak]   = useState(0);
  const [level, setLevel]     = useState(LEVELS[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.username) { setLoading(false); return; }
    axios.get("/api/results").then(({ data }) => {
      const mine = (data||[]).filter(r=>r.username===user.username);
      const totalXP = mine.reduce((s,r)=>s+r.score*15,0);
      const str = calcStreak(mine);
      const earned = BADGE_DEFS.filter(b => b.check(mine, str));
      const lv = LEVELS.slice().reverse().find(l => totalXP >= l.min) || LEVELS[0];
      setXp(totalXP); setBadges(earned); setStreak(str); setLevel(lv);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const nextLevel = LEVELS[LEVELS.indexOf(level)+1];
  const pct = nextLevel ? Math.min(100, Math.round(((xp - level.min)/(nextLevel.min - level.min))*100)) : 100;

  if (loading) return null;

  if (compact) return (
    <div className="bxp-compact">
      <div className="bxp-compact-xp"><Zap size={14}/> {xp} XP</div>
      <div className="bxp-compact-level" style={{color:level.color}}>{level.label}</div>
      {streak > 0 && <div className="bxp-compact-streak"><Flame size={13}/>{streak}d</div>}
    </div>
  );

  return (
    <div className="bxp-card">
      <div className="bxp-header">
        <div>
          <h2 className="bxp-title"><Zap size={18}/> XP & Badges</h2>
          <p className="bxp-sub">Keep quizzing to earn more!</p>
        </div>
        {streak > 0 && <div className="bxp-streak"><Flame size={16}/> {streak}d streak</div>}
      </div>

      {/* XP Bar */}
      <div className="bxp-xp-section">
        <div className="bxp-xp-top">
          <span className="bxp-level-badge" style={{background:level.color+"22", color:level.color, borderColor:level.color+"44"}}>
            {level.label}
          </span>
          <span className="bxp-xp-val"><Zap size={13}/> {xp} XP</span>
        </div>
        <div className="bxp-xp-track">
          <div className="bxp-xp-fill" style={{width:`${pct}%`, background:level.color}} />
        </div>
        {nextLevel && <div className="bxp-xp-next">{pct}% to {nextLevel.label} ({nextLevel.min - xp} XP needed)</div>}
      </div>

      {/* Badges */}
      <div className="bxp-badges-label">Badges Earned ({badges.length}/{BADGE_DEFS.length})</div>
      <div className="bxp-badges-grid">
        {BADGE_DEFS.map(b => {
          const earned = badges.find(e=>e.id===b.id);
          return (
            <div key={b.id} className={`bxp-badge ${earned?"earned":"locked"}`} title={b.desc}>
              <div className="bxp-badge-icon" style={earned?{background:b.color+"22",color:b.color}:{}}>
                {b.icon}
              </div>
              <span className="bxp-badge-label">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
