# AmritaHub 🎓
**Collaborative study resource platform for Amrita CSE students**
B.Tech CSE · 2023 Curriculum · Amrita School of Engineering

---

## 🔥 Features
- **Auth** — Register / Login / Logout via Firebase Email+Password
- **Upload** — Share a Google Drive link, YouTube video, or upload a file directly (PDF, DOCX, PPT, ZIP)
- **Per-user bookmarks** — Each student's saved resources are stored individually in Firestore
- **Per-user upvotes** — One vote per person, no duplicates, persisted in database
- **Search & Filter** — By course code, resource type, keyword
- **Sort** — Recent / Top Voted / My Uploads
- **Curriculum browser** — All 8 semesters + professional elective tracks from PDF
- **Fully mobile responsive** — Slide-out drawer nav, bottom-sheet upload modal

---

## 🚀 Setup (one-time, ~10 minutes)

### Step 1 — Install
```bash
cd amritahub
npm install
```

### Step 2 — Create Firebase project
1. Go to → **https://console.firebase.google.com**
2. Click **"Add project"**
3. Project name: `amritahub` → Disable Google Analytics → **Create**

### Step 3 — Get your config
1. In your project dashboard, click the **`</>`** (Web) icon
2. App nickname: `AmritaHub Web` → Register app
3. You will see a `firebaseConfig` object — **copy it**

### Step 4 — Paste config into the app
Open `src/firebase.js` and replace each `REPLACE_WITH_YOUR_...` value:
```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "amritahub-xxxxx.firebaseapp.com",
  projectId:         "amritahub-xxxxx",
  storageBucket:     "amritahub-xxxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId:             "1:1234:web:abcdef",
};
```

### Step 5 — Enable Authentication
- Firebase Console → **Build → Authentication → Get started**
- Sign-in method tab → **Email/Password → Enable → Save**

### Step 6 — Enable Firestore Database
- Firebase Console → **Build → Firestore Database → Create database**
- Choose **"Start in test mode"** → select your region → **Enable**

### Step 7 — Enable Storage (for file uploads)
- Firebase Console → **Build → Storage → Get started**
- Choose **"Start in test mode"** → select same region → **Done**

### Step 8 — Add Firestore security rules
- Firebase Console → Firestore Database → **Rules** tab
- Replace the content with the contents of `firestore.rules` in this project
- Click **Publish**

### Step 9 — Run the app
```bash
npm start
```
App opens at **http://localhost:3000** 🎉

---

## 📁 Project Structure
```
amritahub/
├── src/
│   ├── firebase.js              ← 🔑 Paste your Firebase config here
│   ├── App.jsx                  ← Router
│   ├── index.js                 ← Entry point
│   │
│   ├── context/
│   │   └── AuthContext.jsx      ← Auth state (login, register, logout)
│   │
│   ├── hooks/
│   │   └── useResources.js      ← All Firestore + Storage operations
│   │
│   ├── data/
│   │   └── curriculum.js        ← Full CSE 2023 curriculum data
│   │
│   ├── components/
│   │   ├── Navbar.jsx            ← Responsive nav with mobile drawer
│   │   ├── ResourceCard.jsx      ← Resource card (vote, save, open)
│   │   ├── AddResourceModal.jsx  ← Upload form (link or file)
│   │   └── ProtectedRoute.jsx    ← Route guard
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Home.jsx              ← Main feed with sidebar + filters
│   │   ├── Saved.jsx             ← Bookmarked resources
│   │   ├── Trending.jsx          ← Top voted
│   │   └── Curriculum.jsx        ← Semester tables + electives
│   │
│   └── styles/
│       └── global.css            ← Design tokens + utilities
│
├── firestore.rules               ← Security rules (paste into Firebase)
└── README.md
```

---

## 🗃️ Database Schema

### `users/{uid}`
```json
{
  "uid": "abc123",
  "name": "Student Name",
  "email": "student@cb.amrita.edu",
  "year": "2nd Year",
  "department": "CSE",
  "savedResources": ["id1", "id2"],
  "createdAt": "timestamp"
}
```

### `resources/{id}`
```json
{
  "title": "DBMS Normalization Notes",
  "courseCode": "23CSE202",
  "type": "PDF",
  "link": "https://storage.googleapis.com/...",
  "fileName": "dbms_notes.pdf",
  "description": "Complete notes covering 1NF to BCNF",
  "uploadedBy": "uid_of_uploader",
  "uploaderName": "Student Name",
  "votes": 12,
  "votedBy": ["uid1", "uid2"],
  "savedBy": ["uid3"],
  "createdAt": "timestamp"
}
```

---

## 🚢 Deploy (Free)

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# → Public dir: build
# → Single-page app: Yes
npm run build
firebase deploy
```
Your app will be live at `https://your-project.web.app`

### Vercel (alternative)
```bash
npm install -g vercel
npm run build
vercel --prod
```

---

## 🔮 Extend Later
- Add ECE / EEE departments (copy `curriculum.js` pattern)
- Comment threads per resource
- Admin moderation panel
- AI-powered resource summarization
- Notification when someone upvotes your resource
