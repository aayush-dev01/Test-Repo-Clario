# Clario — Campus Peer Learning Platform

A full-stack React + Firebase peer tutoring platform where students book live 1-on-1 video sessions with fellow students who've mastered the skills they're learning.

---

## 🚀 Getting Started

### 1. Clone & install
```bash
git clone <your-repo>
cd clario
npm install
```

### 2. Set up Firebase
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password
3. Enable **Cloud Firestore**
4. Copy `.env.example` → `.env.local` and fill in your project credentials

```bash
cp .env.example .env.local
# Edit .env.local with your Firebase values
```

### 3. Deploy Firestore security rules
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 4. Run dev server
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── AppShell.jsx      # Shared UI components (Card, Button, Modal…)
│   ├── Layout.jsx        # Authenticated app shell with sidebar
│   ├── Sidebar.jsx       # Desktop sidebar + mobile drawer + bottom nav
│   ├── SkillMap.jsx      # 3D interactive skill visualization (Three.js)
│   └── WebRTCCall.jsx    # Peer-to-peer video call via WebRTC + Firestore
├── context/
│   └── ToastContext.jsx  # Global toast notification system
├── pages/
│   ├── Landing.jsx           # Public marketing page
│   ├── Login.jsx             # Sign in + forgot password
│   ├── Register.jsx          # Sign up with role selection
│   ├── StudentDashboard.jsx  # Student home
│   ├── TutorDashboard.jsx    # Tutor home with stats
│   ├── FindSkills.jsx        # Browse & search tutors
│   ├── TutorProfile.jsx      # Public tutor profile + booking form
│   ├── TutorProfileEditor.jsx# Tutor edit skills, bio, rates
│   ├── TutorRequests.jsx     # Incoming session requests
│   ├── MySessions.jsx        # Session history with filters
│   ├── SessionLobby.jsx      # Pre-session waiting room
│   ├── SessionRoom.jsx       # Live video room with timer + notes
│   ├── SessionComplete.jsx   # Post-session summary
│   ├── RateSession.jsx       # Star rating + written review
│   ├── Settings.jsx          # Full account management
│   └── NotFound.jsx          # 404 page
├── services/
│   ├── authService.js    # Firebase Auth (register, login, reset, delete)
│   ├── firebase.js       # Firebase app init (reads from .env.local)
│   ├── sessionService.js # Session CRUD + real-time subscriptions
│   ├── userService.js    # User profile read/write
│   └── ratingService.js  # Ratings + aggregated averages
└── utils/
    └── skills.js         # Skill list, timing options, normalizers
```

---

## 🔒 Security Checklist

- [x] Firebase credentials stored in `.env.local` (not committed)
- [x] `.gitignore` excludes all `.env*` files
- [x] Firestore rules: users can only read/write their own data
- [x] Sessions readable only by participants (`participantIds` array)
- [x] Ratings writable only by the authenticated rater
- [x] Tutor email addresses **never exposed** in UI
- [x] Account deletion requires password re-authentication

---

## 📱 Mobile

- Responsive breakpoint at 768px
- Desktop: fixed sidebar (256px)
- Mobile: hamburger → slide-in drawer + bottom navigation bar
- Touch-safe WebRTC video grid
- `touchAction: none` on 3D SkillMap canvas

---

## 🎨 Design System

All design tokens are in `src/index.css` as CSS custom properties:

| Token | Value | Use |
|---|---|---|
| `--navy` | `#060d1b` | Page background |
| `--cyan` | `#00e5ff` | Primary accent |
| `--teal` | `#3fe0c5` | Success / completed |
| `--coral` | `#ff6b6b` | Danger / pending |
| `--violet` | `#7c6fff` | Secondary accent |

---

## 🔧 Deployment

### Firebase Hosting
```bash
firebase init hosting
# Set public dir to: dist
# Configure as SPA: yes
npm run build
firebase deploy
```

### Vercel / Netlify
Point build command to `npm run build`, output dir to `dist`. Add a rewrite rule: `/* → /index.html`.

Created with 💗 for Students by Students.