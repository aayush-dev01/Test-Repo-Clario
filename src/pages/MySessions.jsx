import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell, PageHero, Card, FadeItem, StatusBadge, SectionHeader, EmptyState } from '../components/AppShell';
import { subscribeSessionsForStudent, subscribeSessionsForTutor } from '../services/sessionService';
import { getUserById } from '../services/userService';

const STATUS_ORDER = ['in_progress','accepted','pending','completed','rejected'];
const TABS = ['All','Active','Completed','Declined'];

function fmt(ts) {
  if (!ts) return '—';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusTone(s) {
  return s === 'completed' ? 'teal' : s === 'in_progress' ? 'teal' : s === 'accepted' ? 'cyan' : s === 'rejected' ? 'coral' : 'muted';
}

function statusLabel(s) {
  const m = { pending: 'Pending', accepted: 'Confirmed', in_progress: 'In progress', completed: 'Completed', rejected: 'Declined' };
  return m[s] || s;
}

export default function MySessions({ user, userProfile }) {
  const [sessions, setSessions] = useState([]);
  const [names, setNames]       = useState({});
  const [tab, setTab]           = useState('All');
  const role = userProfile?.role || 'student';

  useEffect(() => {
    if (!user?.uid) return;
    const sub = role === 'tutor'
      ? subscribeSessionsForTutor(user.uid, setSessions)
      : subscribeSessionsForStudent(user.uid, setSessions);
    return sub;
  }, [user?.uid, role]);

  useEffect(() => {
    sessions.forEach(s => {
      const otherId = role === 'tutor' ? s.studentId : s.tutorId;
      if (otherId && !names[otherId]) {
        getUserById(otherId).then(u => { if (u) setNames(p => ({ ...p, [otherId]: u.displayName })); });
      }
    });
  }, [sessions, role]);

  const sorted = [...sessions].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status), bi = STATUS_ORDER.indexOf(b.status);
    if (ai !== bi) return ai - bi;
    const at = a.createdAt?.seconds || 0, bt = b.createdAt?.seconds || 0;
    return bt - at;
  });

  const filtered = sorted.filter(s => {
    if (tab === 'Active')    return s.status === 'accepted' || s.status === 'in_progress' || s.status === 'pending';
    if (tab === 'Completed') return s.status === 'completed';
    if (tab === 'Declined')  return s.status === 'rejected';
    return true;
  });

  return (
    <PageShell>
      <PageHero
        eyebrow="Session history"
        title="My sessions"
        description="All your past and upcoming sessions in one place."
        aside={<StatusBadge tone="cyan">{sessions.length} total</StatusBadge>}
      />

      {/* Tab bar */}
      <FadeItem>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 4, marginBottom: 20, overflowX: 'auto', flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, minWidth: 'max-content', padding: '8px 18px', borderRadius: 10,
                fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
                background: tab === t ? 'rgba(0,212,255,0.1)' : 'transparent',
                color: tab === t ? 'var(--primary)' : 'rgba(255,255,255,0.45)',
                transition: 'all .18s', fontFamily: 'inherit',
              }}>
              {t}
            </button>
          ))}
        </div>
      </FadeItem>

      <FadeItem delay={0.05}>
        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon="📋"
              title={tab === 'All' ? 'No sessions yet' : `No ${tab.toLowerCase()} sessions`}
              desc={tab === 'All' ? 'Your sessions will appear here once you book or accept one.' : ''}
              action={role === 'student' ? <Link to="/find-skills" className="btn btn-primary btn-sm">Find tutors</Link> : null}
            />
          </Card>
        ) : (
          <div className="stack">
            <AnimatePresence mode="popLayout">
              {filtered.map(s => {
                const otherId   = role === 'tutor' ? s.studentId : s.tutorId;
                const otherName = names[otherId] || (role === 'tutor' ? 'Student' : 'Tutor');
                const canJoin   = s.status === 'accepted' || s.status === 'in_progress';
                const canRate   = s.status === 'completed' && role === 'student';
                return (
                  <motion.div
                    key={s.id}
                    layout
                    className={`card s-card ${s.status}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{ padding: '20px 22px' }}>

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      {/* Left */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 16 }}>{s.skill}</span>
                          <StatusBadge tone={statusTone(s.status)}>{statusLabel(s.status)}</StatusBadge>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                            {role === 'tutor' ? '👤' : '🎓'} {otherName}
                          </span>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                            🕒 {fmt(s.createdAt)}
                          </span>
                          {s.scheduledAt && (
                            <span style={{ fontSize: 13, color: 'var(--success)' }}>
                              📅 {new Date(s.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          )}
                        </div>
                        {s.status === 'rejected' && (
                          <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(244,63,94,0.7)' }}>
                            This request was declined. Try booking a different tutor.
                          </div>
                        )}
                        {s.message && (
                          <p style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', lineHeight: 1.55 }}>
                            "{s.message.slice(0, 100)}{s.message.length > 100 ? '…' : ''}"
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                        {canJoin && (
                          <Link to={`/session/lobby/${s.id}`} className="btn btn-primary btn-sm">
                            {s.status === 'in_progress' ? '▶ Rejoin' : '▶ Join room'}
                          </Link>
                        )}
                        {canRate && (
                          <Link to={`/session/rate/${s.id}`} className="btn btn-teal btn-sm">★ Rate</Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </FadeItem>
    </PageShell>
  );
}
