import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageShell, FadeItem, StatusBadge, SectionHeader, EmptyState } from '../components/AppShell';
import SkillMap from '../components/SkillMapLazy';
import { subscribeSessionsForStudent } from '../services/sessionService';
import { getUserById, getAllTutors } from '../services/userService';

function statusTone(status) {
  return status === 'completed'
    ? 'teal'
    : status === 'accepted' || status === 'in_progress'
      ? 'cyan'
      : status === 'rejected'
        ? 'coral'
        : 'muted';
}

function statusLabel(status) {
  return {
    pending: 'Pending',
    accepted: 'Confirmed',
    in_progress: 'Live now',
    completed: 'Completed',
    rejected: 'Declined',
  }[status] || status;
}

export default function StudentDashboard({ user, userProfile }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [tutorNames, setTutorNames] = useState({});
  const [liveSkills, setLiveSkills] = useState([]);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    getAllTutors().then((all) => {
      const seen = new Set();
      all.forEach((tutor) => (tutor.skills || []).forEach((skill) => {
        const name = typeof skill === 'string' ? skill : skill?.name || '';
        if (name) seen.add(name);
      }));
      setLiveSkills([...seen].sort());
    });
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeSessionsForStudent(user.uid, setSessions);
  }, [user?.uid]);

  useEffect(() => {
    sessions.forEach((session) => {
      if (!tutorNames[session.tutorId]) {
        getUserById(session.tutorId).then((tutor) => {
          if (tutor) {
            setTutorNames((previous) => ({ ...previous, [session.tutorId]: tutor.displayName }));
          }
        });
      }
    });
  }, [sessions, tutorNames]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = userProfile?.displayName || user?.displayName || user?.email || 'there';
  const upcoming = sessions.filter((session) => session.status === 'accepted' || session.status === 'in_progress');
  const pending = sessions.filter((session) => session.status === 'pending');
  const recent = sessions.filter((session) => session.status === 'completed').slice(0, 4);
  const activeCount = upcoming.length + pending.length;

  return (
    <PageShell>
      <FadeItem>
        <div style={{ paddingBottom: 28, borderBottom: '1px solid var(--border-0)', marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            <span className="e-dot" />Student workspace
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 className="page-title">{greeting}, {name.split(' ')[0]} 👋</h1>
              <p className="page-desc">Track your sessions, discover tutors, and jump into live rooms.</p>
            </div>
            <Link to="/find-skills" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
              Find tutors →
            </Link>
          </div>
        </div>
      </FadeItem>

      <FadeItem delay={0.04}>
        <div className="g3" style={{ marginBottom: 28 }}>
          {[
            { value: activeCount, label: 'Active sessions', color: 'var(--primary)' },
            { value: sessions.filter((session) => session.status === 'completed').length, label: 'Completed', color: 'var(--success)' },
            { value: liveSkills.length, label: 'Skills available', color: 'var(--info)' },
          ].map((stat) => (
            <div key={stat.label} className="stat-c">
              <div className="stat-v" style={{ color: stat.color }}>{stat.value}</div>
              <div className="stat-l">{stat.label}</div>
            </div>
          ))}
        </div>
      </FadeItem>

      <div className="student-dash-grid">
        <FadeItem delay={0.07} className="student-map-card-wrap">
          <div className="card card-glow student-map-card">
            <div className="student-map-header">
              <div>
                <div className="eyebrow" style={{ marginBottom: 12 }}>
                  <span className="e-dot" />Discover visually
                </div>
                <div className="student-map-title-row">
                  <h2 className="student-map-title">3D Skill Universe</h2>
                  <StatusBadge tone="cyan">{liveSkills.length} live</StatusBadge>
                </div>
                <p className="student-map-desc">
                  Spin through the active tutoring skills and click any sphere to jump straight into matching tutors.
                </p>
              </div>
              <div className="student-map-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowMap((value) => !value)}>
                  {showMap ? 'Hide map' : 'Show map'}
                </button>
                <Link to="/find-skills" className="btn btn-primary btn-sm">
                  Browse tutors
                </Link>
              </div>
            </div>

            {showMap ? (
              <div className="student-map-canvas">
                <SkillMap
                  skills={liveSkills}
                  onSkillSelect={(skill) => navigate(`/find-skills?skill=${encodeURIComponent(skill)}`)}
                />
              </div>
            ) : (
              <div className="student-map-chipwrap">
                {liveSkills.slice(0, 12).map((skill) => (
                  <Link
                    key={skill}
                    to={`/find-skills?skill=${encodeURIComponent(skill)}`}
                    className="s-chip"
                    style={{ fontSize: 12 }}
                  >
                    {skill}
                  </Link>
                ))}
                {liveSkills.length > 12 && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: '5px 0', alignSelf: 'center' }}>
                    +{liveSkills.length - 12} more
                  </span>
                )}
              </div>
            )}
          </div>
        </FadeItem>

        <FadeItem delay={0.1} className="student-side-card-wrap">
          <div className="card card-cyan student-side-card">
            <SectionHeader
              title="My sessions"
              badge={<StatusBadge tone="cyan">{activeCount} active</StatusBadge>}
              action={<Link to="/my-sessions" style={{ fontSize: 13, color: 'var(--primary)' }}>View all →</Link>}
            />
            {activeCount === 0 ? (
              <EmptyState
                icon="🗓"
                title="No active sessions"
                desc="Book a session with a tutor to get started."
                action={<Link to="/find-skills" className="btn btn-primary btn-sm">Find tutors</Link>}
              />
            ) : (
              <div className="stack" style={{ marginTop: 12 }}>
                {[...upcoming, ...pending].slice(0, 4).map((session) => (
                  <motion.div
                    key={session.id}
                    className={`s-card ${session.status}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: '#fff', marginBottom: 3 }}>{session.skill}</div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)' }}>{tutorNames[session.tutorId] || 'Tutor'}</span>
                          <StatusBadge tone={statusTone(session.status)}>{statusLabel(session.status)}</StatusBadge>
                        </div>
                        {session.scheduledAt && (
                          <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>
                            🗓 {new Date(session.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        )}
                      </div>
                      {(session.status === 'accepted' || session.status === 'in_progress') && (
                        <Link to={`/session/lobby/${session.id}`} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                          {session.status === 'in_progress' ? '▶ Rejoin' : 'Join room'}
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </FadeItem>
      </div>

      <FadeItem delay={0.12}>
        <div className="g2">
          <div className="card">
            <SectionHeader title="Recent sessions" badge={<StatusBadge tone="teal">{recent.length}</StatusBadge>} />
            {recent.length === 0 ? (
              <EmptyState icon="✅" title="No completed sessions yet" desc="Finished sessions appear here." />
            ) : (
              <div className="stack" style={{ marginTop: 12 }}>
                {recent.map((session) => (
                  <div key={session.id} className="s-card completed" style={{ cursor: 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#fff', marginBottom: 2 }}>{session.skill}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>{tutorNames[session.tutorId] || 'Tutor'}</div>
                      </div>
                      <Link to={`/session/rate/${session.id}`} className="btn btn-teal btn-sm">★ Rate</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <SectionHeader
              title="Quick paths"
              badge={<StatusBadge tone="violet">Smart shortcuts</StatusBadge>}
            />
            <div className="student-shortcuts">
              <Link to="/find-skills" className="student-shortcut">
                <div className="student-shortcut-icon">🔍</div>
                <div>
                  <div className="student-shortcut-title">Discover tutors</div>
                  <div className="student-shortcut-copy">Search by skill and compare active tutor profiles.</div>
                </div>
              </Link>
              <Link to="/my-sessions" className="student-shortcut">
                <div className="student-shortcut-icon">🗓</div>
                <div>
                  <div className="student-shortcut-title">Open my sessions</div>
                  <div className="student-shortcut-copy">Review pending, live, and completed sessions in one place.</div>
                </div>
              </Link>
              <Link to="/analytics" className="student-shortcut">
                <div className="student-shortcut-icon">📈</div>
                <div>
                  <div className="student-shortcut-title">Track progress</div>
                  <div className="student-shortcut-copy">See how your learning history is building across skills.</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </FadeItem>
    </PageShell>
  );
}
