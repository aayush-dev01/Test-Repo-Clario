import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageShell, FadeItem, StatusBadge, SectionHeader, EmptyState } from '../components/AppShell';
import { subscribeSessionsForTutor, subscribePendingRequestsForTutor } from '../services/sessionService';
import { getUserById } from '../services/userService';
import { getRatingsForTutor } from '../services/ratingService';

function fmt(ts) {
  if (!ts) return '';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' });
}

function getSkillName(s) { return typeof s === 'string' ? s : s?.name || ''; }

export default function TutorDashboard({ user, userProfile }) {
  const [sessions, setSessions]   = useState([]);
  const [pending, setPending]     = useState([]);
  const [names, setNames]         = useState({});
  const [ratings, setRatings]     = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const u1 = subscribeSessionsForTutor(user.uid, setSessions);
    const u2 = subscribePendingRequestsForTutor(user.uid, setPending);
    return () => { u1(); u2(); };
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) getRatingsForTutor(user.uid).then(setRatings);
  }, [user?.uid]);

  useEffect(() => {
    [...sessions, ...pending].forEach(s => {
      if (!names[s.studentId])
        getUserById(s.studentId).then(u => { if (u) setNames(p => ({...p, [s.studentId]:u.displayName})); });
    });
  }, [sessions, pending]);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name     = userProfile?.displayName || user?.displayName || 'Tutor';
  const skills   = userProfile?.skills || [];
  const upcoming = sessions.filter(s => s.status === 'accepted' || s.status === 'in_progress');
  const completed = sessions.filter(s => s.status === 'completed');

  return (
    <PageShell>
      {/* Hero — greeting + key action */}
      <FadeItem>
        <div style={{ paddingBottom:28, borderBottom:'1px solid var(--border-0)', marginBottom:28 }}>
          <div className="eyebrow" style={{ marginBottom:14 }}>
            <span className="e-dot" />Tutor workspace
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:16, flexWrap:'wrap' }}>
            <div>
              <h1 className="page-title">{greeting}, {name.split(' ')[0]} 🎓</h1>
              <p className="page-desc">Review requests, manage your profile, and launch live sessions.</p>
            </div>
            <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
              <Link to="/tutor/profile" className="btn btn-secondary btn-sm">✏ Edit profile</Link>
              <Link to="/tutor/requests" className="btn btn-primary btn-sm">
                Review requests {pending.length > 0 && <span style={{ background:'rgba(10,15,30,0.4)', borderRadius:100, padding:'1px 7px', marginLeft:4, fontWeight:700 }}>{pending.length}</span>}
              </Link>
            </div>
          </div>
        </div>
      </FadeItem>

      {/* Stats row — real data */}
      <FadeItem delay={0.04}>
        <div className="g3" style={{ marginBottom:28 }}>
          {[
            { v: skills.length,    l:'Skills listed',    c:'var(--primary)' },
            { v: completed.length, l:'Sessions taught',  c:'var(--success)' },
            { v: ratings?.count ? `${ratings.average}★` : '—', l:'Avg rating', c:'var(--info)' },
          ].map(s => (
            <div key={s.l} className="stat-c">
              <div className="stat-v" style={{ color:s.c }}>{s.v}</div>
              <div className="stat-l">{s.l}</div>
            </div>
          ))}
        </div>
      </FadeItem>

      {/* Active requests — shown first if any exist */}
      {pending.length > 0 && (
        <FadeItem delay={0.07}>
          <div className="card card-coral" style={{ marginBottom:20 }}>
            <SectionHeader
              title="Pending requests"
              badge={<StatusBadge tone="coral">{pending.length}</StatusBadge>}
              action={<Link to="/tutor/requests" style={{ fontSize:13, color:'var(--primary)' }}>Review all →</Link>}
            />
            <div className="stack" style={{ marginTop:12 }}>
              {pending.slice(0, 3).map(r => (
                <motion.div key={r.id} className="s-card pending"
                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                >
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:15, color:'#fff', marginBottom:3 }}>{r.skill}</div>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,0.42)' }}>
                        {names[r.studentId] || 'Student'} · {fmt(r.createdAt)}
                      </div>
                      {r.message && (
                        <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontStyle:'italic', marginTop:6, lineHeight:1.55 }}>
                          "{r.message.slice(0, 80)}{r.message.length > 80 ? '…' : ''}"
                        </p>
                      )}
                    </div>
                    <Link to="/tutor/requests" className="btn btn-primary btn-sm" style={{ flexShrink:0 }}>Review →</Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeItem>
      )}

      {/* Two column — upcoming + skills */}
      <div className="g2">
        <FadeItem delay={0.1}>
          <div className="card card-cyan">
            <SectionHeader
              title="Upcoming sessions"
              badge={<StatusBadge tone="cyan">{upcoming.length}</StatusBadge>}
            />
            {upcoming.length === 0
              ? <EmptyState icon="📅" title="No sessions yet" desc="Accepted requests will appear here." />
              : <div className="stack" style={{ marginTop:12 }}>
                  {upcoming.map(s => (
                    <motion.div key={s.id} className={`s-card ${s.status}`}
                      initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                    >
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:15, color:'#fff', marginBottom:3 }}>{s.skill}</div>
                          <div style={{ fontSize:13, color:'rgba(255,255,255,0.42)' }}>{names[s.studentId] || 'Student'}</div>
                          {s.scheduledAt && (
                            <div style={{ fontSize:12, color:'var(--success)', marginTop:4 }}>
                              📅 {new Date(s.scheduledAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
                            </div>
                          )}
                        </div>
                        <Link to={`/session/lobby/${s.id}`} className="btn btn-primary btn-sm">Open room</Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
            }
          </div>
        </FadeItem>

        <FadeItem delay={0.12}>
          <div className="card">
            <SectionHeader
              title="My skills"
              badge={<StatusBadge tone="cyan">{skills.length} live</StatusBadge>}
              action={<Link to="/tutor/profile" className="btn btn-secondary btn-sm">+ Add</Link>}
            />
            {skills.length === 0
              ? <EmptyState icon="🎯" title="No skills yet" desc="Add skills students can book you for."
                  action={<Link to="/tutor/profile" className="btn btn-primary btn-sm">Add skill</Link>} />
              : <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:12 }}>
                  {skills.map(s => {
                    const n = getSkillName(s);
                    const r = typeof s === 'object' && s.rate ? s.rate : null;
                    return (
                      <div key={n} style={{ padding:'8px 14px', borderRadius:'var(--radius-md)', background:'var(--surface-1)', border:'1px solid var(--border-0)' }}>
                        <div style={{ fontWeight:600, fontSize:14, color:'#fff' }}>{n}</div>
                        {r > 0 && <div style={{ fontSize:12, color:'var(--success)', marginTop:2 }}>₹{r} / session</div>}
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        </FadeItem>
      </div>
    </PageShell>
  );
}
