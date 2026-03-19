import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageShell, PageHero, Card, FadeItem, SectionHeader, PrimaryButton } from '../components/AppShell';
import { updateUser } from '../services/userService';
import { signOut } from '../services/authService';
import { auth } from '../services/firebase';
import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider, deleteUser, sendEmailVerification } from 'firebase/auth';
import { useToast } from '../context/ToastContext';

export default function Settings({ user, userProfile, setUserProfile }) {
  const toast    = useToast();
  const navigate = useNavigate();

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio]                 = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Email change
  const [newEmail, setNewEmail]       = useState('');
  const [emailPw, setEmailPw]         = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Password change
  const [currentPw, setCurrentPw]     = useState('');
  const [newPw, setNewPw]             = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [savingPw, setSavingPw]       = useState(false);

  // Delete
  const [deletePw, setDeletePw]       = useState('');
  const [showDelete, setShowDelete]   = useState(false);
  const [deleting, setDeleting]       = useState(false);

  useEffect(() => {
    setDisplayName(userProfile?.displayName || user?.displayName || '');
    setBio(userProfile?.bio || '');
  }, [userProfile, user]);

  const saveProfile = async () => {
    if (!displayName.trim()) { toast.error('Name cannot be empty.'); return; }
    setSavingProfile(true);
    try {
      await updateUser(user.uid, { displayName: displayName.trim(), bio: bio.trim() });
      if (setUserProfile) setUserProfile(p => ({ ...p, displayName: displayName.trim(), bio: bio.trim() }));
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save profile.'); }
    finally { setSavingProfile(false); }
  };

  const reauth = async pw => {
    const cred = EmailAuthProvider.credential(auth.currentUser.email, pw);
    await reauthenticateWithCredential(auth.currentUser, cred);
  };

  const changeEmail = async e => {
    e.preventDefault();
    if (!newEmail || !emailPw) { toast.error('Fill in both fields.'); return; }
    setSavingEmail(true);
    try {
      await reauth(emailPw);
      await updateEmail(auth.currentUser, newEmail);
      await updateUser(user.uid, { email: newEmail });
      toast.success('Email updated! Please verify your new address.');
      setNewEmail(''); setEmailPw('');
    } catch (ex) {
      toast.error(ex.code === 'auth/wrong-password' ? 'Incorrect current password.' : ex.message || 'Failed to update email.');
    } finally { setSavingEmail(false); }
  };

  const changePassword = async e => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error("New passwords don't match."); return; }
    if (newPw.length < 6)   { toast.error('Password must be at least 6 characters.'); return; }
    setSavingPw(true);
    try {
      await reauth(currentPw);
      await updatePassword(auth.currentUser, newPw);
      toast.success('Password changed!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (ex) {
      toast.error(ex.code === 'auth/wrong-password' ? 'Current password is incorrect.' : ex.message || 'Failed to change password.');
    } finally { setSavingPw(false); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePw) { toast.error('Enter your password to confirm.'); return; }
    setDeleting(true);
    try {
      await reauth(deletePw);
      await deleteUser(auth.currentUser);
      toast.info('Account deleted.');
      navigate('/');
    } catch (ex) {
      toast.error(ex.code === 'auth/wrong-password' ? 'Incorrect password.' : 'Failed to delete account.');
    } finally { setDeleting(false); }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <PageShell>
      <PageHero eyebrow="Account" title="Settings" description="Manage your profile, credentials, and account preferences." />

      <div className="g2" style={{ alignItems: 'flex-start' }}>
        {/* Left column */}
        <div className="stack">
          {/* Profile */}
          <FadeItem>
            <Card>
              <SectionHeader title="Profile" />
              <div className="stack">
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="s-name">Display name</label>
                  <input id="s-name" className="form-inp" value={displayName}
                    onChange={e => setDisplayName(e.target.value)} />
                </div>
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="s-bio">Bio</label>
                  <textarea id="s-bio" className="form-inp" value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Tell people about yourself…" rows={4} />
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 13 }}>
                  <div style={{ color: 'rgba(255,255,255,0.38)', marginBottom: 3 }}>Email</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)' }}>{user?.email}</div>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 13 }}>
                  <div style={{ color: 'rgba(255,255,255,0.38)', marginBottom: 3 }}>Role</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', textTransform: 'capitalize' }}>{userProfile?.role || '—'}</div>
                </div>
                <PrimaryButton onClick={saveProfile} loading={savingProfile} className="w-full">
                  💾 Save profile
                </PrimaryButton>
              </div>
            </Card>
          </FadeItem>

          {/* Change email */}
          <FadeItem delay={0.05}>
            <Card>
              <SectionHeader title="Change email" />
              <form onSubmit={changeEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="new-email">New email address</label>
                  <input id="new-email" type="email" className="form-inp" value={newEmail}
                    onChange={e => setNewEmail(e.target.value)} placeholder="new@college.edu" />
                </div>
                <div className="form-grp">
                  <label className="form-lbl" htmlFor="email-pw">Current password (to confirm)</label>
                  <input id="email-pw" type="password" className="form-inp" value={emailPw}
                    onChange={e => setEmailPw(e.target.value)} placeholder="••••••••" />
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  type="submit" className="btn btn-secondary w-full" disabled={savingEmail}>
                  {savingEmail ? 'Updating…' : 'Update email'}
                </motion.button>
              </form>
            </Card>
          </FadeItem>
        </div>

        {/* Right column */}
        <div className="stack">
          {/* Change password */}
          <FadeItem delay={0.1}>
            <Card>
              <SectionHeader title="Change password" />
              <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { id: 'cur-pw',  label: 'Current password', val: currentPw,  set: setCurrentPw },
                  { id: 'new-pw',  label: 'New password',     val: newPw,      set: setNewPw },
                  { id: 'conf-pw', label: 'Confirm new',      val: confirmPw,  set: setConfirmPw },
                ].map(f => (
                  <div key={f.id} className="form-grp">
                    <label className="form-lbl" htmlFor={f.id}>{f.label}</label>
                    <input id={f.id} type="password" className="form-inp" value={f.val}
                      onChange={e => f.set(e.target.value)} placeholder="••••••••" />
                  </div>
                ))}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  type="submit" className="btn btn-secondary w-full" disabled={savingPw}>
                  {savingPw ? 'Changing…' : '🔑 Change password'}
                </motion.button>
              </form>
            </Card>
          </FadeItem>

          {/* Danger zone */}
          <FadeItem delay={0.15}>
            <Card style={{ border: '1px solid rgba(244,63,94,0.18)' }}>
              <SectionHeader title="Danger zone" />
              <div className="stack">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="btn btn-secondary w-full" onClick={handleSignOut}>
                  🚪 Sign out
                </motion.button>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

                {!showDelete ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="btn btn-danger w-full" onClick={() => setShowDelete(true)}>
                    ⚠ Delete account
                  </motion.button>
                ) : (
                  <div className="stack">
                    <div style={{ padding: '12px 14px', background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.18)', borderRadius: 12, fontSize: 13, color: 'rgba(244,63,94,0.85)', lineHeight: 1.6 }}>
                      ⚠ This permanently deletes your account and all data. This cannot be undone.
                    </div>
                    <div className="form-grp">
                      <label className="form-lbl" htmlFor="del-pw">Enter password to confirm</label>
                      <input id="del-pw" type="password" className="form-inp" value={deletePw}
                        onChange={e => setDeletePw(e.target.value)} placeholder="••••••••" />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className="btn btn-danger" style={{ flex: 1 }}
                        onClick={handleDeleteAccount} disabled={deleting}>
                        {deleting ? 'Deleting…' : 'Delete permanently'}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className="btn btn-secondary" onClick={() => { setShowDelete(false); setDeletePw(''); }}>
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </FadeItem>
        </div>
      </div>
    </PageShell>
  );
}
