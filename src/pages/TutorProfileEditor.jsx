import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell, PageHero, Card, FadeItem, SectionHeader, StatusBadge, EmptyState } from '../components/AppShell';
import { getUserById, updateUser, addTutorSkill, removeTutorSkill } from '../services/userService';
import { AVAILABLE_SKILLS, TIMING_OPTIONS, normalizeSkill, getSkillName } from '../utils/skills';
import { useToast } from '../context/ToastContext';

export default function TutorProfileEditor({ user, userProfile, setUserProfile }) {
  const toast = useToast();

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio]                 = useState('');
  const [saving, setSaving]           = useState(false);

  // Skill editor
  const [skills, setSkills]           = useState([]);
  const [newSkill, setNewSkill]       = useState('');
  const [newRate, setNewRate]         = useState('');
  const [newSlots, setNewSlots]       = useState([]);
  const [customSkill, setCustomSkill] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [removingId, setRemovingId]   = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    getUserById(user.uid).then(p => {
      if (!p) return;
      setDisplayName(p.displayName || '');
      setBio(p.bio || '');
      setSkills((p.skills || []).map(normalizeSkill));
    });
  }, [user?.uid]);

  const saveProfile = async () => {
    if (!displayName.trim()) { toast.error('Display name is required.'); return; }
    setSaving(true);
    try {
      const updated = await updateUser(user.uid, { displayName: displayName.trim(), bio: bio.trim() });
      if (setUserProfile) setUserProfile(p => ({ ...p, displayName: displayName.trim(), bio: bio.trim() }));
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const skillNameToAdd = newSkill === '__custom__' ? customSkill.trim() : newSkill;

  const addSkill = async () => {
    if (!skillNameToAdd) { toast.error('Choose or enter a skill name.'); return; }
    const rate = parseFloat(newRate) || 0;
    if (skills.some(s => getSkillName(s).toLowerCase() === skillNameToAdd.toLowerCase())) {
      toast.error('You already have that skill listed.'); return;
    }
    setAddingSkill(true);
    try {
      const entry = { name: skillNameToAdd, rate, timingSlots: newSlots };
      await addTutorSkill(user.uid, entry);
      setSkills(p => [...p, entry]);
      setNewSkill(''); setNewRate(''); setNewSlots([]); setCustomSkill('');
      toast.success(`"${skillNameToAdd}" added!`);
    } catch { toast.error('Failed to add skill.'); }
    finally { setAddingSkill(false); }
  };

  const removeSkill = async sName => {
    setRemovingId(sName);
    try {
      await removeTutorSkill(user.uid, sName);
      setSkills(p => p.filter(s => getSkillName(s) !== sName));
      toast.info(`"${sName}" removed.`);
    } catch { toast.error('Failed to remove skill.'); }
    finally { setRemovingId(null); }
  };

  const toggleSlot = slot => setNewSlots(p => p.includes(slot) ? p.filter(s => s !== slot) : [...p, slot]);

  return (
    <PageShell>
      <PageHero
        eyebrow="Profile settings"
        title="Edit your tutor profile"
        description="Keep your profile up to date so students can find and book you."
      />

      <div className="g2" style={{ alignItems: 'flex-start' }}>
        {/* Left – identity */}
        <div className="stack">
          <FadeItem delay={0.05}>
            <Card>
              <SectionHeader title="Identity" />
              <div className="stack">
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="dn">Display name</label>
                  <input id="dn" className="form-inp" value={displayName}
                    onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="bio">Bio</label>
                  <textarea id="bio" className="form-inp" value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Tell students about your background, teaching style, and what you love about your subjects…"
                    rows={5} />
                  <span className="form-hint">{bio.length}/300 characters</span>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                  {saving
                    ? <><span className="spinner spinner-sm" style={{ borderColor: 'rgba(10,15,30,0.2)', borderTopColor: 'var(--ink)' }} /> Saving…</>
                    : '💾 Save profile'}
                </motion.button>
              </div>
            </Card>
          </FadeItem>

          {/* Add skill */}
          <FadeItem delay={0.1}>
            <Card accent="cyan">
              <SectionHeader title="Add a skill" badge={<StatusBadge tone="cyan">new</StatusBadge>} />
              <div className="stack">
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="sk-name">Skill</label>
                  <select id="sk-name" className="form-inp" value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}>
                    <option value="">Choose a skill…</option>
                    {AVAILABLE_SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="__custom__">+ Custom skill…</option>
                  </select>
                </div>
                {newSkill === '__custom__' && (
                  <div className="form-grp">
                    <label className="form-lbl" htmlFor="sk-custom">Custom skill name</label>
                    <input id="sk-custom" className="form-inp" value={customSkill}
                      onChange={e => setCustomSkill(e.target.value)} placeholder="e.g. Machine Learning" />
                  </div>
                )}
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="sk-rate">Rate per session (₹)</label>
                  <input id="sk-rate" type="number" min="0" className="form-inp" value={newRate}
                    onChange={e => setNewRate(e.target.value)} placeholder="0 for free" />
                </div>
                <div className="form-grp">
                  <label className="form-lbl">Availability slots</label>
                  <div className="timing-grid">
                    {TIMING_OPTIONS.map(t => (
                      <button key={t} type="button"
                        className={`timing-btn${newSlots.includes(t) ? ' on' : ''}`}
                        onClick={() => toggleSlot(t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="btn btn-primary" onClick={addSkill}
                  disabled={addingSkill || !skillNameToAdd}>
                  {addingSkill
                    ? <span className="spinner spinner-sm" style={{ borderColor: 'rgba(10,15,30,0.2)', borderTopColor: 'var(--ink)' }} />
                    : '+ Add skill'}
                </motion.button>
              </div>
            </Card>
          </FadeItem>
        </div>

        {/* Right – current skills */}
        <FadeItem delay={0.1}>
          <Card>
            <SectionHeader title="Your skills"
              badge={<StatusBadge tone={skills.length > 0 ? 'teal' : 'muted'}>{skills.length} active</StatusBadge>} />
            {skills.length === 0 ? (
              <EmptyState icon="🎯" title="No skills yet"
                desc="Add skills from the panel on the left so students can book sessions with you." />
            ) : (
              <AnimatePresence>
                {skills.map(entry => {
                  const sName = getSkillName(entry);
                  const rate  = entry.rate || 0;
                  const slots = entry.timingSlots || [];
                  return (
                    <motion.div key={sName}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, height: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                      style={{
                        padding: '16px', borderRadius: 14, marginBottom: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{sName}</div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: 'var(--success)' }}>
                              {rate > 0 ? `₹${rate} / session` : 'Free'}
                            </span>
                            {slots.length > 0 && (
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                                {slots.slice(0, 2).join(', ')}{slots.length > 2 ? ` +${slots.length - 2} more` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          className="btn btn-danger btn-sm"
                          disabled={removingId === sName}
                          onClick={() => removeSkill(sName)}
                          style={{ flexShrink: 0 }}>
                          {removingId === sName
                            ? <span className="spinner spinner-sm" style={{ borderColor: 'rgba(244,63,94,0.2)', borderTopColor: 'var(--danger)' }} />
                            : '✕ Remove'}
                        </motion.button>
                      </div>
                      {slots.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                          {slots.map(s => (
                            <span key={s} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', color: 'var(--primary)' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </Card>
        </FadeItem>
      </div>
    </PageShell>
  );
}
