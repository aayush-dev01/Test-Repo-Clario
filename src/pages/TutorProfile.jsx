import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageShell, PageHero, Card, FadeItem, StatusBadge, PrimaryButton, EmptyState } from '../components/AppShell';
import { getRatingsForTutor } from '../services/ratingService';
import { createSessionRequest } from '../services/sessionService';
import { getUserById } from '../services/userService';
import { useToast } from '../context/ToastContext';

function skillName(s){ return typeof s==='string'?s:s?.name||s?.skill||''; }
function initials(n=''){ return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?'; }

export default function TutorProfile({ user }) {
  const { tutorId } = useParams();
  const navigate    = useNavigate();
  const toast       = useToast();
  const [tutor, setTutor]     = useState(null);
  const [ratings, setRatings] = useState(null);
  const [skill, setSkill]     = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  useEffect(()=>{
    getUserById(tutorId).then(setTutor);
    getRatingsForTutor(tutorId).then(setRatings);
  },[tutorId]);

  const handleRequest = async e => {
    e.preventDefault();
    if(!user){ navigate('/login'); return; }
    if(!skill){ toast.error('Select a skill to request.'); return; }
    setLoading(true);
    try {
      await createSessionRequest(user.uid, tutorId, skill, message);
      setSent(true);
      toast.success('Session request sent! Tutor will respond shortly.');
    } catch{ toast.error('Failed to send request. Try again.'); }
    finally{ setLoading(false); }
  };

  if(!tutor) return (
    <PageShell>
      <div style={{display:'flex',justifyContent:'center',padding:'80px 0'}}>
        <div className="spinner"/>
      </div>
    </PageShell>
  );

  const skills  = tutor.skills||[];
  const avg     = ratings?.count ? ratings.average : null;
  const reviews = ratings?.ratings?.filter(r=>r.review)?.slice(0,3)||[];

  return (
    <PageShell>
      <FadeItem>
        <button onClick={()=>navigate(-1)} className="btn btn-secondary btn-sm" style={{marginBottom:16}}>
          ← Back
        </button>
      </FadeItem>

      <PageHero
        eyebrow="Tutor profile"
        title={tutor.displayName}
        description={tutor.bio||'Peer tutor on Clario — book a live session below.'}
        aside={
          <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
            {avg ? <span className="badge b-teal" style={{fontSize:14}}>★ {avg} / 5</span>
                 : <span className="badge b-muted">New tutor</span>}
            {ratings?.count>0 && <span style={{fontSize:12,color:'rgba(255,255,255,0.38)'}}>{ratings.count} review{ratings.count!==1?'s':''}</span>}
          </div>
        }
      />

      <div className="g2">
        {/* Left: info */}
        <div className="stack">
          <FadeItem delay={0.05}>
            <Card>
              <div style={{display:'flex',gap:14,alignItems:'center',marginBottom:20}}>
                <div className="t-avatar" style={{width:56,height:56,fontSize:22}}>{initials(tutor.displayName)}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:17}}>{tutor.displayName}</div>
                  <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginTop:3}}>
                    {skills.length} skill{skills.length!==1?'s':''} · {ratings?.count||0} sessions completed
                  </div>
                </div>
              </div>

              <div style={{fontSize:12,fontWeight:600,letterSpacing:'.07em',textTransform:'uppercase',color:'rgba(255,255,255,0.38)',marginBottom:12}}>
                Teaching skills
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                {skills.map(entry=>{
                  const n = skillName(entry);
                  const r = typeof entry==='object'&&entry.rate?entry.rate:null;
                  const slots = typeof entry==='object'&&entry.timingSlots?entry.timingSlots:[];
                  return (
                    <div key={n} style={{padding:'10px 14px',borderRadius:14,background:'rgba(0,212,255,0.07)',border:'1px solid rgba(0,212,255,0.18)'}}>
                      <div style={{fontWeight:600,fontSize:14}}>{n}</div>
                      {r>0 && <div style={{fontSize:12,color:'var(--success)',marginTop:2}}>₹{r} / session</div>}
                      {slots.length>0 && <div style={{fontSize:11,color:'rgba(255,255,255,0.38)',marginTop:4}}>{slots.slice(0,2).join(', ')}{slots.length>2?'…':''}</div>}
                    </div>
                  );
                })}
              </div>
            </Card>
          </FadeItem>

          {reviews.length>0 && (
            <FadeItem delay={0.1}>
              <Card>
                <div className="sec-hd"><span className="sec-title">Recent reviews</span></div>
                <div className="stack">
                  {reviews.map((r,i)=>(
                    <div key={i} style={{padding:'12px 14px',borderRadius:12,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
                      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}
                      </div>
                      <p style={{fontSize:13,color:'rgba(255,255,255,0.55)',lineHeight:1.6,fontStyle:'italic'}}>"{r.review}"</p>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeItem>
          )}
        </div>

        {/* Right: request form */}
        <FadeItem delay={0.1}>
          <Card accent="cyan">
            <div className="sec-hd"><span className="sec-title">Request a session</span></div>
            {!user ? (
              <EmptyState icon="🔒" title="Sign in to request"
                action={<button onClick={()=>navigate('/login')} className="btn btn-primary">Sign in</button>}/>
            ) : user.uid===tutorId ? (
              <EmptyState icon="🪞" title="This is your profile" desc="You can't book a session with yourself."/>
            ) : sent ? (
              <div className="form-ok" style={{flexDirection:'column',gap:12,alignItems:'center',padding:'28px',textAlign:'center'}}>
                <div style={{fontSize:32}}>✅</div>
                <div style={{fontWeight:600,fontSize:16}}>Request sent!</div>
                <div style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>The tutor will review and accept shortly.</div>
                <button className="btn btn-secondary btn-sm" onClick={()=>setSent(false)}>Book another skill</button>
              </div>
            ) : (
              <form onSubmit={handleRequest} style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="req-skill">Skill to learn</label>
                  <select id="req-skill" className="form-inp" value={skill}
                    onChange={e=>setSkill(e.target.value)} required>
                    <option value="">Select a skill…</option>
                    {skills.map(entry=>{
                      const n = skillName(entry);
                      const r = typeof entry==='object'&&entry.rate?entry.rate:null;
                      return <option key={n} value={n}>{n}{r>0?` — ₹${r}/session`:''}</option>;
                    })}
                  </select>
                </div>
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="req-msg">What do you want to focus on?</label>
                  <textarea id="req-msg" className="form-inp" value={message}
                    onChange={e=>setMessage(e.target.value)}
                    placeholder="Describe your learning goal or specific topic…" rows={4}/>
                </div>
                <PrimaryButton type="submit" loading={loading} className="w-full">
                  {loading?'Sending…':'Send session request'}
                </PrimaryButton>
              </form>
            )}
          </Card>
        </FadeItem>
      </div>
    </PageShell>
  );
}
