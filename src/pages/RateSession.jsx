import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell, Card, FadeItem, PrimaryButton } from '../components/AppShell';
import { getSessionById } from '../services/sessionService';
import { addRating, getRatingsForTutor } from '../services/ratingService';
import { getUserById } from '../services/userService';
import { useToast } from '../context/ToastContext';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export default function RateSession({ user }) {
  const { sessionId } = useParams();
  const navigate      = useNavigate();
  const toast         = useToast();

  const [session, setSession]     = useState(null);
  const [tutor, setTutor]         = useState(null);
  const [rating, setRating]       = useState(0);
  const [hover, setHover]         = useState(0);
  const [review, setReview]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [alreadyRated, setAlready] = useState(false);
  const [done, setDone]           = useState(false);

  useEffect(() => {
    if (!sessionId || !user?.uid) return;
    getSessionById(sessionId).then(s => {
      setSession(s);
      if (!s) return;
      getUserById(s.tutorId).then(setTutor);
      // Check for existing rating
      getRatingsForTutor(s.tutorId).then(r => {
        const exists = r.ratings?.some(rt => rt.sessionId === sessionId && rt.raterId === user.uid);
        if (exists) setAlready(true);
      });
    });
  }, [sessionId, user?.uid]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!rating) { toast.error('Please pick a star rating.'); return; }
    setLoading(true);
    try {
      await addRating(sessionId, user.uid, session.tutorId, rating, review.trim());
      setDone(true);
      toast.success('Rating submitted — thank you! 🙏');
      setTimeout(() => navigate('/my-sessions'), 2200);
    } catch { toast.error('Failed to submit. Please try again.'); }
    finally { setLoading(false); }
  };

  const displayed = hover || rating;

  return (
    <PageShell>
      <FadeItem>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '60px 20px' }}>
                <motion.div style={{ fontSize: 64 }}
                  animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6 }}>
                  🙏
                </motion.div>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 26, marginTop: 20 }}>
                  Thank you!
                </h2>
                <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>
                  Redirecting to your sessions…
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <motion.div style={{ fontSize: 52 }}
                    animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                    ⭐
                  </motion.div>
                  <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 26, marginTop: 12 }}>
                    Rate your session
                  </h1>
                  {tutor && (
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                      How was your session with <strong style={{ color: '#fff' }}>{tutor.displayName}</strong> on <strong style={{ color: '#fff' }}>{session?.skill}</strong>?
                    </p>
                  )}
                </div>

                {alreadyRated ? (
                  <Card style={{ textAlign: 'center', padding: '36px' }}>
                    <div style={{ fontSize: 36, marginBottom: 14 }}>✅</div>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Already rated</div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>You've already left a rating for this session.</p>
                    <button className="btn btn-secondary" onClick={() => navigate('/my-sessions')}>← Back to sessions</button>
                  </Card>
                ) : (
                  <Card>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {/* Stars */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginBottom: 14 }}>
                          Your rating
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <motion.button
                              key={n} type="button"
                              className={`star-btn${displayed >= n ? ' lit' : ''}`}
                              whileHover={{ scale: 1.2, rotate: -5 }}
                              whileTap={{ scale: 0.9 }}
                              onMouseEnter={() => setHover(n)}
                              onMouseLeave={() => setHover(0)}
                              onClick={() => setRating(n)}>
                              {displayed >= n ? '⭐' : '☆'}
                            </motion.button>
                          ))}
                        </div>
                        {displayed > 0 && (
                          <motion.div
                            key={displayed}
                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                            style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, marginTop: 10 }}>
                            {STAR_LABELS[displayed]}
                          </motion.div>
                        )}
                      </div>

                      {/* Review */}
                      <div className="form-grp">
                        <label className="form-lbl" htmlFor="review">
                          Written review <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span>
                        </label>
                        <textarea id="review" className="form-inp" value={review}
                          onChange={e => setReview(e.target.value)}
                          placeholder="What did you learn? How was the tutor's explanation style? Any feedback…"
                          rows={4} />
                      </div>

                      <PrimaryButton type="submit" loading={loading} className="w-full">
                        {loading ? 'Submitting…' : 'Submit rating'}
                      </PrimaryButton>

                      <button type="button" className="btn btn-secondary w-full"
                        onClick={() => navigate('/my-sessions')}>
                        Skip for now
                      </button>
                    </form>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </FadeItem>
    </PageShell>
  );
}
