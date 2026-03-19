import { useEffect, useState } from 'react';
import { PageShell, PageHero, Card, FadeItem, StatusBadge, SectionHeader } from '../components/AppShell';
import { subscribeSessionsForStudent, subscribeSessionsForTutor } from '../services/sessionService';
import { getRatingsForTutor } from '../services/ratingService';
import { getUserById } from '../services/userService';

function fmt(ts) {
  if (!ts) return '—';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

function getSkillName(s) { return typeof s === 'string' ? s : s?.name || ''; }

// Simple bar chart rendered in pure CSS
function BarChart({ data, color = 'var(--primary)' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{d.value || ''}</div>
          <div style={{
            width: '100%', borderRadius: '4px 4px 0 0',
            background: d.value > 0 ? color : 'rgba(255,255,255,0.06)',
            height: `${Math.max((d.value / max) * 80, d.value > 0 ? 6 : 2)}px`,
            transition: 'height .4s cubic-bezier(.4,0,.2,1)',
          }} />
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ value, label, color = 'var(--primary)', sub }) {
  return (
    <div className="stat-c">
      <div className="stat-v" style={{ color }}>{value}</div>
      <div className="stat-l">{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// Build last-6-months bar chart data from sessions
function monthlyData(sessions, field = 'createdAt') {
  const now    = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('en-IN', { month: 'short' }),
      year:  d.getFullYear(),
      month: d.getMonth(),
      value: 0,
    });
  }
  sessions.forEach(s => {
    const ts = s[field];
    if (!ts) return;
    const d  = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    const m  = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth());
    if (m) m.value++;
  });
  return months;
}

// ── Tutor Analytics ────────────────────────────────────────────────────────────
function TutorAnalytics({ user, userProfile }) {
  const [sessions, setSessions] = useState([]);
  const [ratings, setRatings]   = useState(null);
  const [names, setNames]       = useState({});

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeSessionsForTutor(user.uid, setSessions);
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) getRatingsForTutor(user.uid).then(setRatings);
  }, [user?.uid]);

  useEffect(() => {
    sessions.forEach(s => {
      if (!names[s.studentId])
        getUserById(s.studentId).then(u => { if (u) setNames(p => ({...p, [s.studentId]: u.displayName})); });
    });
  }, [sessions]);

  const completed  = sessions.filter(s => s.status === 'completed');
  const pending    = sessions.filter(s => s.status === 'pending');
  const upcoming   = sessions.filter(s => s.status === 'accepted' || s.status === 'in_progress');
  const skills     = userProfile?.skills || [];
  const totalRate  = skills.reduce((sum, s) => sum + (typeof s === 'object' ? (s.rate || 0) : 0), 0);
  const estEarnings = completed.length * (skills.length > 0 ? Math.round(totalRate / Math.max(skills.length, 1)) : 0);

  // Skill demand — count completed sessions per skill
  const skillDemand = {};
  completed.forEach(s => { skillDemand[s.skill] = (skillDemand[s.skill] || 0) + 1; });
  const topSkills = Object.entries(skillDemand).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const chartData = monthlyData(completed, 'completedAt');

  // Rating distribution
  const ratingDist = [1,2,3,4,5].map(star => ({
    star,
    count: (ratings?.ratings || []).filter(r => r.rating === star).length,
  }));

  return (
    <>
      {/* Key stats */}
      <FadeItem delay={0.05}>
        <div className="g3" style={{ marginBottom: 20 }}>
          <StatCard value={completed.length} label="Sessions taught" color="var(--primary)" sub="All time" />
          <StatCard value={ratings?.count ? `${ratings.average}★` : '—'} label="Avg rating" color="var(--info)" sub={`${ratings?.count || 0} reviews`} />
          <StatCard value={skills.length} label="Active skills" color="var(--success)" sub={`${pending.length} pending requests`} />
        </div>
      </FadeItem>

      <div className="g2" style={{ marginBottom: 20 }}>
        <FadeItem delay={0.1}>
          <Card>
            <SectionHeader title="Sessions per month" badge={<StatusBadge tone="cyan">{completed.length} total</StatusBadge>} />
            <div style={{ marginTop: 16 }}>
              <BarChart data={chartData} color="var(--primary)" />
            </div>
          </Card>
        </FadeItem>

        <FadeItem delay={0.12}>
          <Card>
            <SectionHeader title="Top skills by demand" />
            {topSkills.length === 0
              ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '20px 0' }}>No completed sessions yet.</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                  {topSkills.map(([skill, count]) => (
                    <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, minWidth: 120, color: 'rgba(255,255,255,0.8)' }}>{skill}</div>
                      <div style={{ flex: 1, height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 6, background: 'var(--success)', width: `${(count / Math.max(...topSkills.map(x=>x[1]))) * 100}%`, transition: 'width .5s' }} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--success)', minWidth: 28 }}>{count}</div>
                    </div>
                  ))}
                </div>
            }
          </Card>
        </FadeItem>
      </div>

      <div className="g2">
        <FadeItem delay={0.15}>
          <Card>
            <SectionHeader title="Rating breakdown" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {ratingDist.reverse().map(({ star, count }) => (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', minWidth: 24 }}>{star}★</div>
                  <div style={{ flex: 1, height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 6, background: star >= 4 ? 'var(--success)' : star === 3 ? 'var(--primary)' : 'var(--danger)',
                      width: `${ratings?.count ? (count / ratings.count) * 100 : 0}%`, transition: 'width .5s' }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', minWidth: 20 }}>{count}</div>
                </div>
              ))}
            </div>
          </Card>
        </FadeItem>

        <FadeItem delay={0.17}>
          <Card>
            <SectionHeader title="Recent completions" />
            {completed.length === 0
              ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '20px 0' }}>No completed sessions yet.</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {completed.slice(0, 5).map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{s.skill}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{names[s.studentId] || 'Student'}</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{fmt(s.completedAt || s.createdAt)}</div>
                    </div>
                  ))}
                </div>
            }
          </Card>
        </FadeItem>
      </div>
    </>
  );
}

// ── Student Analytics ──────────────────────────────────────────────────────────
function StudentAnalytics({ user }) {
  const [sessions, setSessions] = useState([]);
  const [names, setNames]       = useState({});

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeSessionsForStudent(user.uid, setSessions);
  }, [user?.uid]);

  useEffect(() => {
    sessions.forEach(s => {
      if (!names[s.tutorId])
        getUserById(s.tutorId).then(u => { if (u) setNames(p => ({...p, [s.tutorId]: u.displayName})); });
    });
  }, [sessions]);

  const completed = sessions.filter(s => s.status === 'completed');
  const upcoming  = sessions.filter(s => s.status === 'accepted' || s.status === 'in_progress');
  const chartData = monthlyData(sessions, 'createdAt');

  // Skills studied
  const skillCount = {};
  completed.forEach(s => { skillCount[s.skill] = (skillCount[s.skill] || 0) + 1; });
  const topSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Unique tutors
  const uniqueTutors = new Set(completed.map(s => s.tutorId)).size;

  return (
    <>
      <FadeItem delay={0.05}>
        <div className="g3" style={{ marginBottom: 20 }}>
          <StatCard value={completed.length} label="Sessions completed" color="var(--primary)" sub="All time" />
          <StatCard value={uniqueTutors} label="Tutors worked with" color="var(--success)" sub="Unique" />
          <StatCard value={upcoming.length} label="Upcoming sessions" color="var(--info)" sub="Confirmed" />
        </div>
      </FadeItem>

      <div className="g2" style={{ marginBottom: 20 }}>
        <FadeItem delay={0.1}>
          <Card>
            <SectionHeader title="Learning activity" badge={<StatusBadge tone="cyan">{sessions.length} total</StatusBadge>} />
            <div style={{ marginTop: 16 }}>
              <BarChart data={chartData} color="var(--info)" />
            </div>
          </Card>
        </FadeItem>

        <FadeItem delay={0.12}>
          <Card>
            <SectionHeader title="Skills you've studied" />
            {topSkills.length === 0
              ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '20px 0' }}>Complete sessions to see insights.</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                  {topSkills.map(([skill, count]) => (
                    <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, minWidth: 120, color: 'rgba(255,255,255,0.8)' }}>{skill}</div>
                      <div style={{ flex: 1, height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 6, background: 'var(--info)', width: `${(count / Math.max(...topSkills.map(x=>x[1]))) * 100}%`, transition: 'width .5s' }} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--info)', minWidth: 28 }}>{count}</div>
                    </div>
                  ))}
                </div>
            }
          </Card>
        </FadeItem>
      </div>

      <FadeItem delay={0.15}>
        <Card>
          <SectionHeader title="Session history" />
          {completed.length === 0
            ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '20px 0' }}>No completed sessions yet.</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {completed.slice(0, 8).map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{s.skill}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>with {names[s.tutorId] || 'Tutor'}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{fmt(s.completedAt || s.createdAt)}</div>
                  </div>
                ))}
              </div>
          }
        </Card>
      </FadeItem>
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function Analytics({ user, userProfile }) {
  const role    = userProfile?.role || 'student';
  const isTutor = role === 'tutor';
  const name    = userProfile?.displayName || user?.displayName || '';

  return (
    <PageShell>
      <PageHero
        eyebrow="Insights"
        title={isTutor ? `Your teaching analytics` : `Your learning analytics`}
        description={isTutor
          ? 'Track your sessions, earnings, ratings, and top skills over time.'
          : 'See your learning progress, most-studied skills, and session history.'}
        aside={<StatusBadge tone={isTutor ? 'cyan' : 'violet'}>{isTutor ? 'Tutor view' : 'Student view'}</StatusBadge>}
      />
      {isTutor
        ? <TutorAnalytics user={user} userProfile={userProfile} />
        : <StudentAnalytics user={user} />
      }
    </PageShell>
  );
}
