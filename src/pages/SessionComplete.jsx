import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageShell, Card, FadeItem, StatusBadge } from '../components/AppShell';
import { getSessionById } from '../services/sessionService';
import { getUserById } from '../services/userService';

function fmt(ts) {
  if (!ts) return '—';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function SessionComplete({ user, userProfile }) {
  const { sessionId } = useParams();
  const navigate      = useNavigate();
  const [session, setSession]   = useState(null);
  const [otherUser, setOther]   = useState(null);

  const role    = userProfile?.role || 'student';
  const isTutor = role === 'tutor';

  useEffect(() => {
    getSessionById(sessionId).then(s => {
      setSession(s);
      if (!s) return;
      const id = isTutor ? s.studentId : s.tutorId;
      if (id) getUserById(id).then(setOther);
    });
  }, [sessionId, isTutor]);

  return (
    <PageShell>
      <FadeItem>
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          {/* Celebration */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
            style={{ fontSize: 72, marginBottom: 24, display: 'block' }}>
            🏁
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(24px,3vw,34px)', marginBottom: 12, letterSpacing: '-.02em' }}>
            Session complete!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.72, marginBottom: 28 }}>
            Great work! Your live session has ended. {!isTutor && 'Take a moment to rate your tutor — it helps the community.'}
          </motion.p>

          {/* Summary card */}
          {session && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card style={{ marginBottom: 20, textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
                  Session summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { l: 'Skill',   v: session.skill },
                    { l: isTutor ? 'Student' : 'Tutor', v: otherUser?.displayName || '—' },
                    { l: 'Started', v: fmt(session.startedAt || session.createdAt) },
                    { l: 'Ended',   v: fmt(session.completedAt) },
                  ].map(row => (
                    <div key={row.l}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginBottom: 3 }}>{row.l}</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{row.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14 }}>
                  <StatusBadge tone="teal">✓ Completed</StatusBadge>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!isTutor && (
              <Link to={`/session/rate/${sessionId}`} className="btn btn-primary btn-lg w-full">
                ★ Rate this session
              </Link>
            )}
            <Link to="/find-skills" className="btn btn-secondary w-full">
              🔍 Book another session
            </Link>
            <Link to={isTutor ? '/tutor/dashboard' : '/student/dashboard'} className="btn btn-secondary w-full">
              ← Back to dashboard
            </Link>
          </motion.div>
        </div>
      </FadeItem>
    </PageShell>
  );
}
