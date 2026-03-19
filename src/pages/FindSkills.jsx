import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell, PageHero, Card, FadeItem, StatusBadge, EmptyState } from '../components/AppShell';
import SkillMap from '../components/SkillMapLazy';
import { getAllTutors, getTutorsBySkill } from '../services/userService';
import { getRatingsForTutor } from '../services/ratingService';

function getSkillName(s) { return typeof s === 'string' ? s : s?.name || s?.skill || ''; }
function initials(n='') { return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?'; }

function TutorCard({ tutor, rating }) {
  const skills = tutor.skills || [];
  const avg    = rating?.count ? rating.average : null;
  return (
    <motion.div className="t-card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} whileHover={{y:-4}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:14,justifyContent:'space-between'}}>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <div className="t-avatar">{initials(tutor.displayName)}</div>
          <div>
            <div style={{fontWeight:600,fontSize:15,color:'#fff'}}>{tutor.displayName}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.35)',marginTop:2}}>{skills.length} skill{skills.length!==1?'s':''}</div>
          </div>
        </div>
        <div>{avg ? <span className="badge b-teal">★ {avg}</span> : <span className="badge b-muted">New</span>}</div>
      </div>
      {tutor.bio && <p style={{fontSize:13,color:'rgba(255,255,255,0.48)',lineHeight:1.65,margin:'4px 0'}}>{tutor.bio}</p>}
      <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
        {skills.slice(0,4).map(s => {
          const n = getSkillName(s);
          const r = typeof s==='object' && s.rate ? s.rate : null;
          return <span key={n} className="s-chip" style={{fontSize:12}}>{n}{r>0?` · ₹${r}`:''}</span>;
        })}
        {skills.length > 4 && <span style={{fontSize:12,color:'rgba(255,255,255,0.35)',alignSelf:'center'}}>+{skills.length-4} more</span>}
      </div>
      <Link to={`/tutor/${tutor.id}`} className="btn btn-primary btn-sm" style={{alignSelf:'flex-start'}}>View profile →</Link>
    </motion.div>
  );
}

export default function FindSkills() {
  const [params] = useSearchParams();
  const [skill, setSkill]         = useState(params.get('skill') || '');
  const [search, setSearch]       = useState('');
  const [tutors, setTutors]       = useState([]);
  const [ratings, setRatings]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [showMap, setShowMap]     = useState(false);
  const [liveSkills, setLiveSkills] = useState([]);

  // Fetch all tutors once to build live skill list for map + filter chips
  useEffect(() => {
    getAllTutors().then(all => {
      const seen = new Set();
      all.forEach(t => (t.skills || []).forEach(s => {
        const n = getSkillName(s);
        if (n) seen.add(n);
      }));
      setLiveSkills([...seen].sort());
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const fn = skill ? getTutorsBySkill(skill) : getAllTutors();
    fn.then(t => { setTutors(t); setLoading(false); });
  }, [skill]);

  useEffect(() => {
    tutors.forEach(t => {
      getRatingsForTutor(t.id).then(r => setRatings(p => ({ ...p, [t.id]: r })));
    });
  }, [tutors]);

  const filtered = tutors.filter(t =>
    !search ||
    t.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    (t.skills || []).some(s => getSkillName(s).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PageShell>
      <PageHero
        eyebrow="Tutor discovery"
        title="Find your perfect tutor"
        description="Browse peer tutors by skill, rating, and availability. Book a live session in minutes."
        aside={<StatusBadge tone="cyan">{filtered.length} tutors found</StatusBadge>}
      />

      {/* Map toggle */}
      <FadeItem delay={0.05}>
        <div style={{marginBottom:20}}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowMap(v => !v)}>
            🗺️ {showMap ? 'Hide' : 'Show'} 3D Skill Map
          </button>
        </div>
        <AnimatePresence>
          {showMap && (
            <motion.div
              initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
              style={{overflow:'hidden',marginBottom:20}}
            >
              <Card className="card-glow">
                <SkillMap skills={liveSkills} onSkillSelect={s => { setSkill(s); setShowMap(false); }} />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </FadeItem>

      {/* Filter bar */}
      <FadeItem delay={0.1}>
        <Card style={{marginBottom:20}} className="card-sm">
          <div style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              <button className={`s-chip${!skill?' on':''}`} onClick={() => setSkill('')}>All skills</button>
              {liveSkills.map(s => (
                <button key={s} className={`s-chip${skill===s?' on':''}`} onClick={() => setSkill(s)}>{s}</button>
              ))}
            </div>
            <input
              type="text" className="form-inp" placeholder="Search tutors or skills…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{maxWidth:260,padding:'8px 14px',fontSize:14}}
            />
          </div>
        </Card>
      </FadeItem>

      {/* Tutors grid */}
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{height:200,borderRadius:20}} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon="🔍" title="No tutors found" desc="Try a different skill or clear your search." /></Card>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
          {filtered.map(t => <TutorCard key={t.id} tutor={t} rating={ratings[t.id]} />)}
        </div>
      )}
    </PageShell>
  );
}
