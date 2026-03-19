import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell, Card, FadeItem, StatusBadge } from '../components/AppShell';
import { subscribeSessionById, startSession, rejectSession } from '../services/sessionService';
import { getUserById } from '../services/userService';
import { useToast } from '../context/ToastContext';

const STATUS_INFO = {
  pending:     { icon: '⏳', label: 'Waiting for tutor',    desc: 'Your request is with the tutor. They\'ll accept shortly.',  tone: 'muted' },
  accepted:    { icon: '✅', label: 'Confirmed — ready!',    desc: 'The tutor accepted. You can join the live room now.',        tone: 'teal' },
  in_progress: { icon: '📹', label: 'Session in progress',  desc: 'This session is live. Rejoin to continue.',                  tone: 'cyan' },
  completed:   { icon: '🏁', label: 'Session completed',    desc: 'This session has ended.',                                    tone: 'muted' },
  rejected:    { icon: '❌', label: 'Request declined',      desc: 'The tutor could not take this session. Try another tutor.',  tone: 'coral' },
};

export default function SessionLobby({ user, userProfile }) {
  const { sessionId } = useParams();
  const navigate      = useNavigate();
  const toast         = useToast();
  const [session, setSession]   = useState(null);
  const [otherUser, setOther]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [starting, setStarting] = useState(false);
  const [elapsed, setElapsed]   = useState(0);

  const role    = userProfile?.role || 'student';
  const isTutor = role === 'tutor';

  useEffect(() => {
    const unsub = subscribeSessionById(sessionId, s => {
      setSession(s); setLoading(false);
      if (!s) return;
      const id = isTutor ? s.studentId : s.tutorId;
      if (id) getUserById(id).then(setOther);
    });
    return unsub;
  }, [sessionId, isTutor]);

  // Pending elapsed timer
  useEffect(() => {
    if (session?.status !== 'pending') return;
    const start = session.createdAt?.seconds ? session.createdAt.seconds * 1000 : Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [session?.status, session?.createdAt]);

  const handleStart = async () => {
    setStarting(true);
    try {
      await startSession(sessionId);
      navigate(`/session/room/${sessionId}`);
    } catch {
      toast.error('Could not start session. Try again.');
      setStarting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await rejectSession(sessionId);
      toast.info('Session request cancelled.');
      navigate(isTutor ? '/tutor/dashboard' : '/student/dashboard');
    } catch { toast.error('Failed to cancel.'); }
  };

  const fmtElapsed = s => {
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  if (loading) return (
    <PageShell>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div className="spinner" />
      </div>
    </PageShell>
  );

  if (!session) return (
    <PageShell>
      <Card><div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)' }}>Session not found.</div></Card>
    </PageShell>
  );

  const info    = STATUS_INFO[session.status] || STATUS_INFO.pending;
  const canJoin = session.status === 'accepted' || session.status === 'in_progress';
  const otherName = otherUser?.displayName || (isTutor ? 'Student' : 'Tutor');

  return (
    <PageShell>
      <FadeItem>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {/* Status card */}
          <Card style={{ textAlign: 'center', padding: '48px 32px', marginBottom: 20 }}>
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 56, marginBottom: 20, display: 'block' }}>
              {info.icon}
            </motion.div>

            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 10 }}>
              {info.label}
            </div>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 24 }}>
              {info.desc}
            </p>
            <StatusBadge tone={info.tone}>{session.status.replace('_', ' ')}</StatusBadge>

            {session.status === 'pending' && elapsed > 0 && (
              <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Waiting {fmtElapsed(elapsed)}
              </div>
            )}
          </Card>

          {/* Session details */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { l: 'Skill',                 v: session.skill },
                { l: isTutor ? 'Student' : 'Tutor', v: otherName },
                { l: 'Scheduled',             v: session.scheduledAt
                    ? new Date(session.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                    : '—' },
                { l: 'Status',                v: session.status.replace('_', ' ') },
              ].map(row => (
                <div key={row.l}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{row.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{row.v}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {canJoin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary btn-lg w-full"
                onClick={handleStart}
                disabled={starting}>
                {starting
                  ? <span className="spinner spinner-sm" style={{ borderColor: 'rgba(10,15,30,0.2)', borderTopColor: 'var(--ink)' }} />
                  : '📹 Enter live room'}
              </motion.button>
            )}

            {session.status === 'pending' && !isTutor && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="btn btn-danger w-full"
                onClick={handleCancel}>
                Cancel request
              </motion.button>
            )}

            <button
              className="btn btn-secondary w-full"
              onClick={() => navigate(isTutor ? '/tutor/dashboard' : '/student/dashboard')}>
              ← Back to dashboard
            </button>
          </div>
        </div>
      </FadeItem>
    </PageShell>
  );
}
