# Hadoku Task - Tech Stack & Architecture

## Complete technical overview of the Hadoku Task ecosystem

**Date:** October 15, 2025

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Parent API Worker (Cloudflare/Hono)                   │
│  - Routes requests to TaskHandlers                      │
│  - Implements storage interface                         │
│  - Handles authentication                               │
└─────────────────────────────────────────────────────────┘
                         ▲
                         │ imports @wolffm/task
                         │
┌─────────────────────────────────────────────────────────┐
│  @wolffm/task (npm package)                             │
│  Repo: hadoku-task                                      │
│  ├── /api      → TaskHandlers (for parent API)         │
│  ├── /frontend → React web app (for embedding)         │
│  └── /style.css → Styles                               │
└─────────────────────────────────────────────────────────┘
                    ▲                    ▲
                    │                    │
         ┌──────────┴─────────┐   ┌─────┴──────────┐
         │                    │   │                │
    ┌────┴────┐         ┌─────┴───┴─┐        ┌────┴─────┐
    │ Browser │         │ APK       │        │ Widget   │
    │ Users   │         │ WebView   │        │ WebView  │
    └─────────┘         └───────────┘        └──────────┘
         │                    │                     │
         └────────────────────┴─────────────────────┘
                              │
                    Loads hadoku.me/task/
                    (deployed from @wolffm/task)
```

---

## 📦 Repository Structure

### **Repo 1: `hadoku-task`** (Current - npm package)

**Purpose:** Core application - web app + API handlers

**Published as:** `@wolffm/task@3.0.x` on GitHub Packages

**Exports:**
```typescript
// API handlers for parent worker
import { TaskHandlers, type TaskStorage } from '@wolffm/task/api'

// Frontend app for embedding
import { TaskApp } from '@wolffm/task/frontend'
import '@wolffm/task/style.css'
```

**Tech Stack:**
- **Language:** TypeScript 5.6
- **Framework:** React 18.3
- **Build:** Vite 5.4
- **Bundler:** Rollup (via Vite)
- **CSS:** Vanilla CSS with custom properties
- **Package Manager:** npm

**Build Outputs:**
```
dist/
├── server/              → API handlers (for parent)
│   ├── index.js
│   └── index.d.ts
├── index.js            → Frontend bundle
├── style.css           → Styles
└── assets/             → Images, fonts, etc.
```

**Dependencies:**
- `react` - UI framework
- `react-dom` - DOM rendering

**Dev Dependencies:**
- `typescript` - Type checking
- `vite` - Build tool
- `@vitejs/plugin-react` - React support

---

### **Repo 2: `hadoku-task-mobile`** (New - Android app)

**Purpose:** Android APK wrapper + Widget

**Published as:** APK on Google Play Store

**Does NOT export anything** - it's a final product, not a library

**Tech Stack:**
- **Framework:** Capacitor 6.x
- **Language:** 
  - JavaScript/HTML/CSS (auth screen wrapper)
  - Kotlin (widget implementation)
- **Build:** 
  - npm scripts (web assets)
  - Gradle (Android build)
  - Android Studio (development)
- **Target:** Android 7.0+ (API 24+)

**Dependencies:**
```json
{
  "dependencies": {
    "@capacitor/core": "^6.0.0",
    "@capacitor/android": "^6.0.0"
  }
}
```

**Build Outputs:**
- `app-debug.apk` - Development build
- `app-release.apk` - Signed production build

---

## 🔌 Integration Points

### **Parent API Worker** (Cloudflare Worker)

**File:** `worker/src/index.ts` (in parent repo)

```typescript
import { TaskHandlers, type TaskStorage } from '@wolffm/task/api'

// Implement storage interface
const storage: TaskStorage = {
  async getBoards(userType, userId) { /* ... */ },
  async saveBoards(userType, boards, userId) { /* ... */ },
  // ... other methods
}

// Use handlers in routes
app.post('/task/api', async (c) => {
  const auth = { userType: 'friend', userId: 'user-123' }
  const body = await c.req.json()
  const result = await TaskHandlers.createTask(storage, auth, body, body.boardId)
  return c.json(result)
})

// More routes...
app.post('/task/api/tags/delete', async (c) => {
  const auth = getAuth(c)
  const body = await c.req.json()
  const result = await TaskHandlers.deleteTag(storage, auth, body)
  return c.json(result)
})

// Batch operations
app.post('/task/api/boards/:boardId/tasks/batch/update-tags', async (c) => {
  const auth = getAuth(c)
  const body = await c.req.json()
  const result = await TaskHandlers.batchUpdateTags(storage, auth, body)
  return c.json(result)
})
```

**✅ NO CHANGES NEEDED** - API handlers remain the same, just import from npm package.

---

### **Web Deployment** (hadoku.me/task/)

**Built from:** `hadoku-task` repo

**Deployment:**
```bash
# In hadoku-task repo
npm run build           # Creates dist/
# Deploy dist/ to hadoku.me/task/
```

**Accessed by:**
- Browser users directly
- APK WebView (via URL)
- Widget WebView (via URL)

**✅ NO CHANGES NEEDED** - Already works, just add mobile CSS/components.

---

### **Android APK** (hadoku-task-mobile)

**Does NOT import @wolffm/task package!**

Instead, it:
1. Shows native auth screen (HTML/CSS/JS)
2. Loads `https://hadoku.me/task/` in WebView
3. Passes credentials via URL params

**File:** `hadoku-task-mobile/src/js/app.js`
```javascript
// Simple wrapper - NO npm imports needed
function showWebView() {
  const key = localStorage.getItem('hadoku_access_key')
  const url = key 
    ? `https://hadoku.me/task/?key=${encodeURIComponent(key)}`
    : `https://hadoku.me/task/?mode=public`
  
  document.getElementById('task-iframe').src = url
}
```

**✅ NO PACKAGE IMPORT** - Just loads deployed web app via URL.

---

## 🔄 Data Flow

### **Creating a Task**

```
┌─────────────┐
│ User taps   │
│ "Add Task"  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ Browser/APK/Widget              │
│ (hadoku.me/task/ loaded)        │
│ - Calls frontend client API     │
└──────┬──────────────────────────┘
       │ POST /task/api
       ▼
┌─────────────────────────────────┐
│ Parent API Worker               │
│ - Receives request              │
│ - Extracts auth context         │
└──────┬──────────────────────────┘
       │ TaskHandlers.createTask()
       ▼
┌─────────────────────────────────┐
│ @wolffm/task handlers           │
│ - Validates input               │
│ - Generates ULID                │
│ - Updates stats                 │
└──────┬──────────────────────────┘
       │ storage.saveTasks()
       ▼
┌─────────────────────────────────┐
│ Storage (KV/R2/etc)             │
│ - Persists data                 │
└─────────────────────────────────┘
```

**All platforms use the same flow - no special handling needed!**

---

## 📋 Requirements & Dependencies

### **Development Environment**

**For Web App (hadoku-task):**
- Node.js 20+
- npm 10+
- TypeScript knowledge
- React knowledge

**For Android App (hadoku-task-mobile):**
- Node.js 20+ (for Capacitor CLI)
- JDK 17+ (for Android builds)
- Android Studio (latest)
- Kotlin knowledge (for widget only)
- Physical Android device or emulator for testing

---

### **Runtime Requirements**

**Web App:**
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- JavaScript enabled
- Internet connection

**Android APK:**
- Android 7.0+ (API 24+)
- ~15MB storage for app
- Internet connection

**Widget (Interactive):**
- Android 12+ (API 31+) for interactive WebView
- Android 7-11 falls back to "tap to open" widget

---

## 🔐 Authentication Flow

### **Browser Users**
```
hadoku.me/task/?key=USER_KEY
         ↓
Frontend reads URL param
         ↓
Includes in API headers
         ↓
Parent worker validates
```

### **APK/Widget Users**
```
Native auth screen
         ↓
Stores key in localStorage
         ↓
Loads hadoku.me/task/?key=STORED_KEY
         ↓
Same as browser flow
```

**✅ NO CHANGES NEEDED** - Auth already works via URL params.

---

## 🚀 Deployment Pipeline

### **hadoku-task (Web App)**

```bash
# Version bump
npm version patch

# Build
npm run build:all

# Test
npm run test:server  # (if tests exist)

# Publish to npm
npm publish

# Deploy web app
# (Copy dist/ to hadoku.me/task/)
```

**Triggers:**
- Git tag push
- GitHub Actions (optional)

---

### **hadoku-task-mobile (Android APK)**

```bash
# Sync web assets
npx cap sync

# Open in Android Studio
npx cap open android

# In Android Studio:
# Build > Generate Signed Bundle/APK
# Or: ./gradlew assembleRelease
```

**Triggers:**
- Manual build for now
- GitHub Actions for automated APK builds (optional)

---

## 📊 Version Management

### **Package Versions**
```
@wolffm/task@3.0.25
└── Published on GitHub Packages
    Used by: parent API worker

hadoku-task-mobile v1.0.0
└── APK version code: 1
    Published on: Google Play Store
```

**Versioning Strategy:**
- Web package follows semver (3.x.x)
- APK uses independent versioning (1.x.x)
- APK can update without web package changes (just loads latest URL)
- Web package can update without APK changes (transparent to users)

---

## ⚠️ Critical Constraints

### **What CANNOT Change (Breaking Changes)**

1. **API Handler Signatures**
   ```typescript
   // These must stay stable
   TaskHandlers.createTask(storage, auth, input, boardId)
   TaskHandlers.deleteTag(storage, auth, { boardId, tag })
   // etc.
   ```

2. **Storage Interface**
   ```typescript
   interface TaskStorage {
     getBoards(userType, userId?): Promise<BoardsFile>
     // etc.
   }
   ```

3. **Type Definitions**
   ```typescript
   interface Task { id, title, tag, state, createdAt, ... }
   interface Board { id, name, tasks, tags, ... }
   // etc.
   ```

**Why?** Parent API worker imports these. Changes = forced updates.

### **What CAN Change (Non-Breaking)**

1. **Frontend UI/UX** - APK just loads URL, doesn't care
2. **CSS styles** - Pure visual changes
3. **Internal implementation** - As long as exports stay same
4. **New optional fields** - Backwards compatible
5. **New handlers** - Additive, not breaking

---

## 🎯 Summary

### **Mobile Implementation = Zero API Changes**

**Phase 1-6 (Mobile Web Fixes):**
- ✅ All in `hadoku-task` repo
- ✅ Pure frontend changes (CSS + React components)
- ✅ Exports unchanged
- ✅ API handlers unchanged
- ✅ Parent worker unaffected

**Phase 7 (Android APK):**
- ✅ New repo `hadoku-task-mobile`
- ✅ Does NOT import @wolffm/task package
- ✅ Just loads hadoku.me/task/ via WebView
- ✅ Zero code coupling

**Result:**
- ✨ No parent API updates needed
- ✨ No breaking changes
- ✨ Clean separation of concerns
- ✨ Easy to maintain

---

**Questions to confirm:**
1. ✅ Parent API stays unchanged? **YES**
2. ✅ APK just loads web URL? **YES**
3. ✅ Mobile fixes go in hadoku-task? **YES**
4. ✅ No package imports in APK? **YES**

Everything is designed to avoid touching the parent API! 🎉
