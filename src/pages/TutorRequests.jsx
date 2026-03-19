import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell, PageHero, Card, FadeItem, StatusBadge, EmptyState } from '../components/AppShell';
import { subscribePendingRequestsForTutor, acceptSession, rejectSession } from '../services/sessionService';
import { getUserById } from '../services/userService';
import { createNotification } from '../services/notificationService';
import { useToast } from '../context/ToastContext';

function defaultSchedule() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

function fmt(ts) {
  if (!ts) return '';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' });
}

// Inline confirm — no separate ConfirmModal import needed, avoids the stale-closure bug
function InlineConfirm({ title, desc, danger, onConfirm, onCancel }) {
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <p className="sec-title" style={{ marginBottom:10 }}>{title}</p>
        {desc && <p style={{ fontSize:14, color:'rgba(255,255,255,0.55)', lineHeight:1.65, marginBottom:22 }}>{desc}</p>}
        <div className="row">
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Confirm</button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function TutorRequests({ user, userProfile }) {
  const toast = useToast();
  const [requests, setRequests]     = useState([]);
  const [names, setNames]           = useState({});
  const [processing, setProcessing] = useState({});
  const [schedules, setSchedules]   = useState({});
  // confirm stores the full snapshot needed for the action — no stale ref issues
  const [confirm, setConfirm]       = useState(null);
  // { id, action, studentId, skill, scheduledAt }

  useEffect(() => {
    if (!user?.uid) return;
    return subscribePendingRequestsForTutor(user.uid, reqs => {
      setRequests(reqs);
      setSchedules(prev => {
        const next = { ...prev };
        reqs.forEach(r => { if (!next[r.id]) next[r.id] = defaultSchedule(); });
        return next;
      });
      reqs.forEach(r => {
        if (!names[r.studentId]) {
          getUserById(r.studentId).then(u => {
            if (u) setNames(p => ({ ...p, [r.studentId]: u.displayName }));
          });
        }
      });
    });
  }, [user?.uid]);

  const tutorName = userProfile?.displayName || user?.displayName || 'Tutor';

  // Called with a fully-resolved snapshot — no stale closures
  const handle = async ({ id, action, studentId, skill, scheduledAt }) => {
    setProcessing(p => ({ ...p, [id]: true }));
    setConfirm(null);
    try {
      if (action === 'accept') {
        await acceptSession(id, scheduledAt);
        if (studentId) {
          await createNotification(studentId, {
            type:  'session_accepted',
            title: 'Session confirmed! 🎉',
            body:  `${tutorName} accepted your ${skill} session. Scheduled: ${new Date(scheduledAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}`,
            link:  `/session/lobby/${id}`,
          }).catch(() => {});
        }
        toast.success('Session accepted!');
      } else {
        await rejectSession(id);
        if (studentId) {
          await createNotification(studentId, {
            type:  'session_rejected',
            title: 'Request declined',
            body:  `${tutorName} couldn't take your ${skill} session. Try another tutor.`,
            link:  '/find-skills',
          }).catch(() => {});
        }
        toast.info('Request declined.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Action failed. Please try again.');
    } finally {
      setProcessing(p => ({ ...p, [id]: false }));
    }
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Tutor inbox"
        title="Session requests"
        description="Review incoming requests, pick a time, then accept or decline."
        aside={requests.length > 0 ? <StatusBadge tone="coral">{requests.length} pending</StatusBadge> : null}
      />

      <FadeItem>
        {requests.length === 0 ? (
          <Card>
            <EmptyState icon="📬" title="Your inbox is clear" desc="New session requests will appear here in real time." />
          </Card>
        ) : (
          <div className="stack">
            <AnimatePresence>
              {requests.map(req => {
                const studentName = names[req.studentId] || 'Student';
                const busy        = processing[req.id];
                const sched       = schedules[req.id] || defaultSchedule();

                return (
                  <motion.div
                    key={req.id}
                    className="card s-card pending"
                    layout
                    initial={{ opacity:0, y:16, scale:0.98 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, x:-40, scale:0.95 }}
                    transition={{ type:'spring', stiffness:300, damping:28 }}
                    style={{ padding:'22px 24px' }}
                  >
                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:14 }}>
                      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                        <div className="t-avatar" style={{ width:42, height:42, fontSize:16 }}>
                          {studentName.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:15 }}>{studentName}</div>
                          <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:2 }}>{fmt(req.createdAt)}</div>
                        </div>
                      </div>
                      <span className="badge b-cyan">{req.skill}</span>
                    </div>

                    {req.message && (
                      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
                        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.07em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:6 }}>
                          Student's goal
                        </div>
                        <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.62)', lineHeight:1.65 }}>{req.message}</p>
                      </div>
                    )}

                    {/* Schedule picker */}
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.07em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:8 }}>
                        📅 Schedule session
                      </div>
                      <input
                        type="datetime-local"
                        className="form-inp"
                        value={sched}
                        min={new Date().toISOString().slice(0,16)}
                        onChange={e => setSchedules(s => ({ ...s, [req.id]: e.target.value }))}
                        style={{ maxWidth:280, fontSize:13.5, padding:'9px 14px', colorScheme:'dark' }}
                      />
                      {sched && (
                        <div style={{ fontSize:12, color:'var(--success)', marginTop:6 }}>
                          📌 {new Date(sched).toLocaleString('en-IN', { dateStyle:'full', timeStyle:'short' })}
                        </div>
                      )}
                    </div>

                    {/* Actions — capture all needed data at click time */}
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      <motion.button
                        whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                        className="btn btn-primary btn-sm"
                        disabled={busy}
                        onClick={() => setConfirm({
                          id:          req.id,
                          action:      'accept',
                          studentId:   req.studentId,
                          skill:       req.skill,
                          scheduledAt: schedules[req.id] || defaultSchedule(),
                        })}
                      >
                        {busy
                          ? <span className="spinner spinner-sm" style={{ borderColor:'rgba(10,15,30,0.2)', borderTopColor:'var(--ink)' }}/>
                          : '✓ Accept & schedule'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                        className="btn btn-danger btn-sm"
                        disabled={busy}
                        onClick={() => setConfirm({
                          id:        req.id,
                          action:    'reject',
                          studentId: req.studentId,
                          skill:     req.skill,
                          scheduledAt: null,
                        })}
                      >
                        ✕ Decline
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </FadeItem>

      {confirm && (
        <InlineConfirm
          title={confirm.action === 'accept' ? 'Accept & schedule this session?' : 'Decline this request?'}
          desc={confirm.action === 'accept'
            ? `Student will be notified and the room will be created.`
            : 'The student will be notified that you declined. This cannot be undone.'}
          danger={confirm.action === 'reject'}
          onConfirm={() => handle(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </PageShell>
  );
}
