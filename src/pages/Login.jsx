import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login, getAuthErrorMessage, sendPasswordReset } from '../services/authService';
import { useToast } from '../context/ToastContext';

const BRAND_FONT = "'Plus Jakarta Sans', sans-serif";

export default function Login() {
  const [email, setEmail]         = useState('');
  const [pw, setPw]               = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [err, setErr]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate     = useNavigate();
  const toast        = useToast();
  const [params]     = useSearchParams();
  const justVerified = params.get('verified') === '1';

  const handleLogin = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try { await login(email, pw); navigate('/'); }
    catch (ex) { setErr(getAuthErrorMessage(ex)); }
    finally { setLoading(false); }
  };

  const handleReset = async e => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
      toast.success('Password reset email sent!');
    } catch (ex) { setErr(getAuthErrorMessage(ex)); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      {/* Ambient orbs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none' }}>
        <div className="hero-orb-1" style={{ top:'-20%', right:'-5%' }} />
        <div className="hero-orb-2" style={{ bottom:'-10%', left:'-10%' }} />
      </div>

      <motion.div
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5, ease:[0.16,1,0.3,1] }}
        style={{ position:'relative', zIndex:1, width:'100%', maxWidth:900, display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, alignItems:'center' }}
      >
        {/* ── Left brand panel ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div className="sb-mark">C</div>
            <span style={{ fontFamily:BRAND_FONT, fontWeight:700, fontSize:15, color:'#fff' }}>Clario</span>
          </Link>

          <h1 style={{ fontFamily:BRAND_FONT, fontWeight:800, fontSize:'clamp(26px,3vw,38px)', lineHeight:1.1, letterSpacing:'-.03em', color:'#fff' }}>
            Welcome back to your learning network
          </h1>

          <p style={{ fontSize:15, color:'rgba(255,255,255,0.42)', lineHeight:1.72 }}>
            Your sessions, tutors, and progress — all in one place.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {['Smart matching with peer tutors', 'Live video — no downloads needed', 'Session ratings you can trust'].map(f => (
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

          {justVerified && (
            <div className="form-ok" style={{ marginTop:14 }}>
              ✅ Email verified — you can sign in now.
            </div>
          )}

          <h2 style={{ fontFamily:BRAND_FONT, fontWeight:700, fontSize:22, marginTop:16, marginBottom:20, color:'#fff' }}>
            {resetMode ? 'Reset your password' : 'Sign in'}
          </h2>

          {resetSent ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="form-ok">✓ Reset link sent to <strong>{email}</strong></div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.42)', lineHeight:1.65 }}>
                Check your inbox (and spam folder). Click the link to set a new password, then come back to sign in.
              </p>
              <button type="button" onClick={() => { setResetSent(false); setResetMode(false); setErr(''); }}
                style={{ background:'none', border:'none', color:'var(--primary)', cursor:'pointer', fontSize:13, textAlign:'left', padding:0 }}>
                ← Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={resetMode ? handleReset : handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="form-grp">
                <label className="form-lbl" htmlFor="email">Email</label>
                <input id="email" type="email" className="form-inp" value={email}
                  onChange={e => setEmail(e.target.value)} required placeholder="you@college.edu" autoComplete="email" />
              </div>

              {!resetMode && (
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="pw">Password</label>
                  <div className="inp-wrap">
                    <input id="pw" type={showPw ? 'text' : 'password'} className="form-inp"
                      value={pw} onChange={e => setPw(e.target.value)} required
                      placeholder="••••••••" autoComplete="current-password"
                      style={{ paddingRight:44 }} />
                    <button type="button" className="inp-eye" onClick={() => setShowPw(v => !v)}>
                      {showPw ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
              )}

              {err && <div className="form-err">⚠ {err}</div>}

              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading && <span className="spinner spinner-sm" style={{ borderColor:'rgba(10,15,30,0.2)', borderTopColor:'var(--ink)' }} />}
                {loading ? 'Please wait…' : resetMode ? 'Send reset email' : 'Sign in'}
              </motion.button>
            </form>
          )}

          <div className="divider" />

          <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
            {!resetSent && (
              <button type="button"
                onClick={() => { setResetMode(v => !v); setErr(''); }}
                style={{ background:'none', border:'none', color:'var(--primary)', cursor:'pointer', fontSize:13, padding:0 }}>
                {resetMode ? '← Back to sign in' : 'Forgot password?'}
              </button>
            )}
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.38)' }}>
              No account yet?{' '}
              <Link to="/register" style={{ color:'var(--primary)', fontWeight:600 }}>Sign up free</Link>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
