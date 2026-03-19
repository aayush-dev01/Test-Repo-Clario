import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none' }}>
        <div className="hero-orb-1" /><div className="hero-orb-2" />
      </div>
      <motion.div
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:480 }}
      >
        <motion.div
          style={{ fontSize:72, marginBottom:4 }}
          animate={{ rotate:[0,-8,8,-4,0] }} transition={{ duration:1, delay:.3 }}
        >
          🗺️
        </motion.div>
        <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:'clamp(60px,12vw,100px)', color:'rgba(255,255,255,0.06)', lineHeight:1 }}>
          404
        </div>
        <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:26, marginTop:-12, marginBottom:10, color:'#fff' }}>
          Page not found
        </h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.42)', lineHeight:1.7, marginBottom:28 }}>
          This page doesn't exist or was moved. Let's get you back on track.
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/" className="btn btn-primary">Go home</Link>
          <Link to="/find-skills" className="btn btn-secondary">Find tutors</Link>
        </div>
      </motion.div>
    </div>
  );
}
