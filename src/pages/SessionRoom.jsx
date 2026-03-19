import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useBeforeUnload } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageShell, FadeItem } from '../components/AppShell';
import WebRTCCall from '../components/WebRTCCall';
import SessionChat from '../components/SessionChat';
import SessionWhiteboard from '../components/SessionWhiteboard';
import { subscribeSessionById, completeSession } from '../services/sessionService';
import { getUserById } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { useSessionGuard } from '../context/SessionGuardContext';

// ── Leave warning modal ───────────────────────────────────────────────────────
function LeaveModal({ onStay, onEnd, onLeave, isTutor }) {
  return (
    <div className="modal-bg" onClick={onStay}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
        <p className="sec-title" style={{ marginBottom: 8, textAlign: 'center' }}>Leave the session?</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 22, textAlign: 'center' }}>
          {isTutor
            ? 'You can end the session for everyone, or just leave the tab — the session stays live.'
            : 'The session will stay open. You can rejoin any time from My Sessions.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isTutor && (
            <button className="btn btn-danger" onClick={onEnd}>
              ⏹ End session for everyone
            </button>
          )}
          <button className="btn btn-secondary" onClick={onLeave}>
            ↩ Leave tab (session stays live)
          </button>
          <button className="btn btn-primary" onClick={onStay}>
            Stay in session
          </button>
        </div>
      </div>
    </div>
  );
}

// ── End session confirm (tutor only) ─────────────────────────────────────────
function EndConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <p className="sec-title" style={{ marginBottom: 10 }}>End session for everyone?</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 22 }}>
          This marks the session complete for both participants. The student will be prompted to leave a rating.
        </p>
        <div className="row">
          <button className="btn btn-danger" onClick={onConfirm}>⏹ End session</button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SessionRoom({ user, userProfile }) {
  const { sessionId } = useParams();
  const navigate      = useNavigate();
  const toast         = useToast();
  const { setInSession, setGuardHandler } = useSessionGuard();

  const [session, setSession]       = useState(null);
  const [otherUser, setOther]       = useState(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);
  const [elapsed, setElapsed]       = useState(0);
  const [activeTab, setActiveTab]   = useState('chat');
  const startRef = useRef(Date.now());

  const role    = userProfile?.role || 'student';
  const isTutor = role === 'tutor';

  // Register with SessionGuard so sidebar links trigger the leave modal
  useEffect(() => {
    setInSession(true);
    setGuardHandler((url) => {
      setPendingNav(url);
      setLeaveModal(true);
    });
    return () => {
      setInSession(false);
      setGuardHandler(null);
    };
  }, [setInSession, setGuardHandler]);

  // Subscribe to session state
  useEffect(() => {
    const unsub = subscribeSessionById(sessionId, s => {
      setSession(s);
      if (!s) return;
      const id = isTutor ? s.studentId : s.tutorId;
      if (id) getUserById(id).then(setOther);
      if (s?.status === 'completed') navigate(`/session/complete/${sessionId}`, { replace: true });
    });
    return unsub;
  }, [sessionId, isTutor, navigate]);

  // Session timer
  useEffect(() => {
    startRef.current = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // Warn on browser tab close / refresh
  useBeforeUnload(e => {
    e.preventDefault();
    e.returnValue = 'You are in an active session. Are you sure you want to leave?';
  });

  const fmtDuration = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const handleEndSession = async () => {
    try {
      await completeSession(sessionId);
      toast.success('Session completed!');
      navigate(`/session/complete/${sessionId}`);
    } catch {
      toast.error('Failed to end session.');
    }
    setConfirmEnd(false);
    setLeaveModal(false);
  };

  // Called by WebRTC leave button — shows modal instead of navigating
  const guardedLeave = () => {
    const dest = isTutor ? '/tutor/dashboard' : '/student/dashboard';
    setPendingNav(dest);
    setLeaveModal(true);
  };

  const confirmLeave = () => {
    setLeaveModal(false);
    navigate(pendingNav || (isTutor ? '/tutor/dashboard' : '/student/dashboard'));
  };

  if (!session) return (
    <PageShell>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div className="spinner" />
      </div>
    </PageShell>
  );

  const name = userProfile?.displayName || user?.displayName || 'You';

  return (
    <PageShell>
      {/* Session bar */}
      <FadeItem>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap', marginBottom: 20,
          padding: '14px 20px', borderRadius: 16,
          background: 'rgba(34,211,160,0.06)', border: '1px solid rgba(34,211,160,0.15)',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="live-dot" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Live: {session.skill}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
              with {otherUser?.displayName || (isTutor ? 'Student' : 'Tutor')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 16, color: 'var(--success)', fontWeight: 600 }}>
              {fmtDuration(elapsed)}
            </span>
            {isTutor ? (
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="btn btn-danger btn-sm"
                onClick={() => setConfirmEnd(true)}
              >
                ⏹ End session
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="btn btn-secondary btn-sm"
                onClick={guardedLeave}
              >
                ↩ Leave
              </motion.button>
            )}
          </div>
        </div>
      </FadeItem>

      {/* WebRTC video call */}
      <FadeItem delay={0.05}>
        <WebRTCCall
          sessionId={sessionId}
          userId={user?.uid}
          isTutor={isTutor}
          userDisplayName={name}
          onLeave={guardedLeave}
        />
      </FadeItem>

      {/* Chat & Whiteboard */}
      <FadeItem delay={0.1}>
        <div className="collab-panel">
          <div className="collab-tabs">
            <button
              className={`collab-tab${activeTab === 'chat' ? ' active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >💬 Chat</button>
            <button
              className={`collab-tab${activeTab === 'whiteboard' ? ' active' : ''}`}
              onClick={() => setActiveTab('whiteboard')}
            >🖊 Whiteboard</button>
          </div>
          <div className="collab-body">
            {activeTab === 'chat' && (
              <SessionChat
                sessionId={sessionId}
                userId={user?.uid}
                displayName={name}
              />
            )}
            {activeTab === 'whiteboard' && (
              <SessionWhiteboard
                sessionId={sessionId}
                userId={user?.uid}
                isTutor={isTutor}
              />
            )}
          </div>
        </div>
      </FadeItem>

      {/* End session confirm — tutor only */}
      {confirmEnd && (
        <EndConfirmModal
          onConfirm={handleEndSession}
          onCancel={() => setConfirmEnd(false)}
        />
      )}

      {/* Navigation / leave warning */}
      {leaveModal && (
        <LeaveModal
          isTutor={isTutor}
          onStay={() => { setLeaveModal(false); setPendingNav(null); }}
          onEnd={handleEndSession}
          onLeave={confirmLeave}
        />
      )}
    </PageShell>
  );
}
