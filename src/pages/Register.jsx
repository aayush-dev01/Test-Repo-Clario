import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { register, getAuthErrorMessage } from '../services/authService';
import { useToast } from '../context/ToastContext';

const BRAND_FONT = "'Plus Jakarta Sans', sans-serif";

function pwStrength(pw) {
  if (!pw) return { score:0, label:'', color:'' };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['','Weak','Fair','Good','Strong','Very strong'];
  const colors = ['','var(--danger)','#f59e0b','#eab308','var(--success)','var(--primary)'];
  return { score:s, label:labels[Math.min(s,5)], color:colors[Math.min(s,5)] };
}

export default function Register() {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [pw, setPw]           = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [role, setRole]       = useState('student');
  const [agreed, setAgreed]   = useState(false);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast    = useToast();
  const [params] = useSearchParams();

  // Pre-select role from URL if coming from landing CTA
  useState(() => {
    const r = params.get('role');
    if (r === 'tutor' || r === 'student') setRole(r);
  });

  const strength = pwStrength(pw);

  const handleSubmit = async e => {
    e.preventDefault(); setErr('');
    if (pw !== confirm) { setErr('Passwords do not match.'); return; }
    if (pw.length < 6)  { setErr('Password must be at least 6 characters.'); return; }
    if (!agreed)        { setErr('Please accept the Terms of Service to continue.'); return; }
    setLoading(true);
    try {
      await register(email, pw, name, role);
      toast.success('Account created! Check your email to verify your address 📧');
      navigate(role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard');
    } catch (ex) { setErr(getAuthErrorMessage(ex)); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none' }}>
        <div className="hero-orb-1" /><div className="hero-orb-2" />
      </div>

      <motion.div
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5, ease:[0.16,1,0.3,1] }}
        style={{ position:'relative', zIndex:1, width:'100%', maxWidth:920, display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, alignItems:'center' }}
      >
        {/* ── Left brand panel ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div className="sb-mark">C</div>
            <span style={{ fontFamily:BRAND_FONT, fontWeight:700, fontSize:15, color:'#fff' }}>Clario</span>
          </Link>

          <h1 style={{ fontFamily:BRAND_FONT, fontWeight:800, fontSize:'clamp(26px,3vw,38px)', lineHeight:1.1, letterSpacing:'-.03em', color:'#fff' }}>
            Join your campus learning community
          </h1>

          <p style={{ fontSize:15, color:'rgba(255,255,255,0.42)', lineHeight:1.7 }}>
            Learn from peers who just mastered the subject you're studying — or teach what you know and help others while you're at it.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              'Free for students and tutors',
              'Live video — no downloads needed',
              'Rated sessions you can trust',
              'Book a session in under 15 minutes',
            ].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'rgba(255,255,255,0.45)' }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--primary)', flexShrink:0, boxShadow:'0 0 6px var(--primary)' }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right form card ── */}
        <div className="card" style={{ padding:'32px 28px' }}>
          <Link to="/" style={{ fontSize:12, color:'var(--primary)', fontWeight:600, letterSpacing:'.05em', textTransform:'uppercase' }}>
            ← Back to Clario
          </Link>

          <h2 style={{ fontFamily:BRAND_FONT, fontWeight:700, fontSize:22, marginTop:16, marginBottom:20, color:'#fff' }}>
            Create your account
          </h2>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-grp">
              <label className="form-lbl" htmlFor="reg-name">Display name</label>
              <input id="reg-name" type="text" className="form-inp" value={name}
                onChange={e => setName(e.target.value)} required placeholder="Your full name" autoComplete="name" />
            </div>

            <div className="form-grp">
              <label className="form-lbl" htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" className="form-inp" value={email}
                onChange={e => setEmail(e.target.value)} required placeholder="you@college.edu" autoComplete="email" />
            </div>

            <div className="form-grp">
              <label className="form-lbl" htmlFor="reg-pw">Password</label>
              <div className="inp-wrap">
                <input id="reg-pw" type={showPw ? 'text' : 'password'} className="form-inp"
                  value={pw} onChange={e => setPw(e.target.value)} required minLength={6}
                  placeholder="Min 6 characters" autoComplete="new-password" style={{ paddingRight:44 }} />
                <button type="button" className="inp-eye" onClick={() => setShowPw(v => !v)}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              {pw && (
                <>
                  <div className="pw-bar">
                    <div className="pw-fill" style={{ width:`${(strength.score/5)*100}%`, background:strength.color }} />
                  </div>
                  <span style={{ fontSize:12, color:strength.color }}>{strength.label}</span>
                </>
              )}
            </div>

            <div className="form-grp">
              <label className="form-lbl" htmlFor="reg-confirm">Confirm password</label>
              <input id="reg-confirm" type="password" className="form-inp"
                value={confirm} onChange={e => setConfirm(e.target.value)} required
                placeholder="Repeat password" autoComplete="new-password" />
              {confirm && pw !== confirm && (
                <span style={{ fontSize:12, color:'var(--danger)' }}>Passwords don't match</span>
              )}
            </div>

            {/* Role picker */}
            <div className="form-grp">
              <label className="form-lbl">I want to</label>
              <div className="role-toggle">
                <div className="role-slider" style={{ left:role==='student' ? '4px' : 'calc(50%)' }} />
                <button type="button" className="role-btn"
                  onClick={() => setRole('student')}
                  style={{ color:role==='student' ? 'var(--ink)' : 'rgba(255,255,255,0.55)' }}>
                  📚 Learn
                </button>
                <button type="button" className="role-btn"
                  onClick={() => setRole('tutor')}
                  style={{ color:role==='tutor' ? 'var(--ink)' : 'rgba(255,255,255,0.55)' }}>
                  🎓 Teach
                </button>
              </div>
            </div>

            {/* Terms */}
            <label style={{ display:'flex', gap:10, alignItems:'flex-start', cursor:'pointer', fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.55 }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop:2, accentColor:'var(--primary)', flexShrink:0 }} />
              I agree to the{' '}
              <a href="#" style={{ color:'var(--primary)' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" style={{ color:'var(--primary)' }}>Privacy Policy</a>
            </label>

            {err && <div className="form-err">⚠ {err}</div>}

            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading && <span className="spinner spinner-sm" style={{ borderColor:'rgba(10,15,30,0.2)', borderTopColor:'var(--ink)' }} />}
              {loading ? 'Creating account…' : 'Create account'}
            </motion.button>
          </form>

          <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'rgba(255,255,255,0.38)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--primary)', fontWeight:600 }}>Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
