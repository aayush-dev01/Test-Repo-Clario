import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllTutors } from '../services/userService';
import SkillMap from '../components/SkillMapLazy';

const steps = [
  { n:'01', icon:'✦', title:'Sign up free', body:'Choose your role — student or tutor — in under 30 seconds. No credit card needed.' },
  { n:'02', icon:'◈', title:'Find a tutor', body:'Browse by skill or explore the live 3D skill map. See real ratings from real sessions.' },
  { n:'03', icon:'◎', title:'Book instantly', body:'Send a request with your learning goal. Tutors respond in minutes, not days.' },
  { n:'04', icon:'▶', title:'Learn live', body:'Join a private WebRTC video room in your browser. Chat, draw on the whiteboard, share files.' },
];

const features = [
  { icon:'📹', title:'Browser-native video', body:'WebRTC peer-to-peer — no app download, no plugin. Works on any device with a camera.' },
  { icon:'🖊', title:'Live whiteboard', body:'Draw, annotate and explain together in real time. Tutors control student access.' },
  { icon:'💬', title:'Session chat + files', body:'Share PDFs, slides and images directly in chat. History saved for the full session.' },
  { icon:'⭐', title:'Verified ratings', body:'Every session is rated. Ratings are permanent and public — no gaming the system.' },
  { icon:'🗺️', title:'3D skill map', body:'See which skills have active tutors right now. Only live skills appear on the map.' },
  { icon:'📊', title:'Learning analytics', body:'Both students and tutors get session history, skill breakdowns and rating trends.' },
];

function StatCard({ value, label }) {
  return (
    <motion.div
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      style={{ textAlign:'center' }}
    >
      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:'clamp(28px,4vw,44px)', color:'#fff', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:5, letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</div>
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [tutorCount, setTutorCount] = useState(null);
  const [skillCount, setSkillCount] = useState(null);
  const [liveSkills, setLiveSkills] = useState([]);

  // Pull real stats from Firestore
  useEffect(() => {
    getAllTutors().then(tutors => {
      setTutorCount(tutors.length);
      const skills = new Set();
      tutors.forEach(t => (t.skills||[]).forEach(s => {
        const n = typeof s === 'string' ? s : s?.name || '';
        if (n) skills.add(n);
      }));
      const nextSkills = [...skills].sort();
      setSkillCount(nextSkills.length);
      setLiveSkills(nextSkills);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ background:'var(--ink)', minHeight:'100vh', color:'var(--white)' }}>

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="land-nav">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="sb-mark">C</div>
          <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:15, color:'#fff' }}>Clario</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Join free →</Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{ position:'relative', minHeight:'92vh', display:'flex', alignItems:'center', overflow:'hidden' }}>
        <div className="hero-grid-bg" />
        <div className="hero-orb-1" />
        <div className="hero-orb-2" />

        <div style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'72px 28px 60px', width:'100%' }}>
          <motion.div initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:.65, ease:[0.16,1,0.3,1] }}>

            {/* Eyebrow */}
            <div className="eyebrow" style={{ marginBottom:20 }}>
              <span className="e-dot" />Campus peer-to-peer learning
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800,
              fontSize:'clamp(36px,6vw,72px)', lineHeight:1.05,
              letterSpacing:'-.03em', maxWidth:760, color:'#fff',
            }}>
              Learn from students{' '}
              <span className="text-grad">who've been exactly where you are</span>
            </h1>

            <p style={{ fontSize:'clamp(15px,1.6vw,18px)', color:'rgba(255,255,255,0.48)', lineHeight:1.7, marginTop:20, maxWidth:520 }}>
              Clario connects you with peer tutors on your campus. Book a live 1-on-1 session in minutes — no scheduling apps, no middleman.
            </p>

            {/* Single primary CTA */}
            <div style={{ marginTop:28 }}>
              <Link to="/register" className="btn btn-primary btn-lg" style={{ display:'inline-flex' }}>
                Start learning free →
              </Link>
              <Link to="/login" style={{ marginLeft:16, fontSize:14, color:'rgba(255,255,255,0.38)', textDecoration:'underline', textUnderlineOffset:3 }}>
                Already have an account?
              </Link>
            </div>

            {/* Real stats */}
            <motion.div
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:.35, duration:.55 }}
              className="landing-stats"
            >
              <StatCard value={tutorCount !== null ? `${tutorCount}` : '—'} label="Active tutors" />
              <StatCard value={skillCount !== null ? `${skillCount}` : '—'} label="Skills available" />
              <StatCard value="15 min" label="Avg booking time" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px 88px' }}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <div className="card card-glow" style={{ padding: '28px 28px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 12 }}>
                  <span className="e-dot" />Live skill map
                </div>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 'clamp(22px,3vw,34px)', letterSpacing: '-.025em', color: '#fff' }}>
                  Explore the floating skill spheres
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.46)', lineHeight: 1.7, marginTop: 6, maxWidth: 560 }}>
                  Browse the skills that currently have tutors on Clario, then jump straight into discovery.
                </p>
              </div>
              <Link to="/find-skills" className="btn btn-secondary btn-sm">
                View all tutors
              </Link>
            </div>

            <SkillMap
              skills={liveSkills}
              onSkillSelect={(skill) => navigate(`/find-skills?skill=${encodeURIComponent(skill)}`)}
            />
          </div>
        </motion.div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section style={{ maxWidth:1200, margin:'0 auto', padding:'88px 28px' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div className="eyebrow" style={{ justifyContent:'center', marginBottom:14 }}>
            <span className="e-dot" />How it works
          </div>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:'clamp(24px,3vw,36px)', letterSpacing:'-.025em' }}>
            From sign-up to live session in under 15 minutes
          </h2>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16 }}>
          {steps.map((s, i) => (
            <motion.div
              key={s.n} className="step-card"
              initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ delay:i*.08 }}
            >
              <div className="step-num">{s.n}</div>
              <div style={{ fontSize:24, marginBottom:14, opacity:.7 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:17, marginBottom:8, color:'#fff' }}>{s.title}</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.7 }}>{s.body}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section style={{ background:'rgba(255,255,255,0.018)', borderTop:'1px solid var(--border-0)', borderBottom:'1px solid var(--border-0)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'88px 28px' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <div className="eyebrow" style={{ justifyContent:'center', marginBottom:14 }}>
              <span className="e-dot" />Features
            </div>
            <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:'clamp(24px,3vw,36px)', letterSpacing:'-.025em' }}>
              Everything in one session
            </h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title} className="card"
                initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*.06 }}
                style={{ transition:'border-color .2s, background .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,212,255,0.16)'; e.currentTarget.style.background='var(--surface-1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-0)'; e.currentTarget.style.background='var(--surface-0)'; }}
              >
                <div style={{ fontSize:26, marginBottom:14 }}>{f.icon}</div>
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600, fontSize:16, marginBottom:7, color:'#fff' }}>{f.title}</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.7 }}>{f.body}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ maxWidth:1200, margin:'0 auto', padding:'88px 28px', textAlign:'center' }}>
        <motion.div initial={{ opacity:0, scale:.97 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }}>
          <div className="card card-glow" style={{ maxWidth:600, margin:'0 auto', padding:'52px 40px' }}>
            <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:'clamp(22px,3vw,32px)', letterSpacing:'-.025em', marginBottom:12, color:'#fff' }}>
              Ready to start?
            </h2>
            <p style={{ fontSize:15, color:'rgba(255,255,255,0.42)', lineHeight:1.7, marginBottom:28 }}>
              Join your campus on Clario. It's free — for students and tutors.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <Link to="/register?role=student" className="btn btn-primary btn-lg">I want to learn</Link>
              <Link to="/register?role=tutor"   className="btn btn-secondary btn-lg">I want to teach</Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="land-footer">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="sb-mark" style={{ width:28, height:28, fontSize:12 }}>C</div>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.35)' }}>© 2025 Clario. Peer learning platform.</span>
        </div>
        <div className="lf-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Help</a>
        </div>
      </footer>

      <button
        type="button"
        className="land-back-btn"
        onClick={() => navigate(-1)}
        aria-label="Go back"
        title="Go back"
      >
        ← Back
      </button>
    </div>
  );
}
