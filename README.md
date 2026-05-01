# Revise — Spaced Repetition Study Planner

A full-stack Android app clone of Revu (revu.co.in), built with React Native (Expo) + Fastify + Supabase. Monetised at ₹100/year via Google Play subscriptions.

---

## Project Structure

```
revise/
├── app/          ← React Native (Expo) mobile app
└── backend/      ← Fastify REST API
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 9+ |
| Expo CLI | `npm i -g expo-cli` |
| EAS CLI | `npm i -g eas-cli` |
| Supabase account | free tier sufficient |
| Firebase project | for FCM push notifications |
| Google Play Console | for publishing + billing |

---

## 1 · Backend Setup

### 1.1 Supabase

1. Create a new Supabase project at https://supabase.com
2. In the SQL Editor, run migrations **in order**:
   - `backend/src/db/migrations/001_initial_schema.sql`
   - `backend/src/db/migrations/002_vocab_seed.sql`
   - `backend/src/db/migrations/003_cron_jobs.sql`
3. In **Storage**, create a public bucket named `topic-images`
4. Copy your **Project URL**, **anon key**, **service_role key**, and **JWT secret** from Settings → API

### 1.2 Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Add an Android app with package name `com.yourapp.revise`
3. Download `google-services.json` → place it at `app/android/app/google-services.json`
4. In Project Settings → Service Accounts → Generate new private key → download JSON
5. Extract `project_id`, `client_email`, `private_key` for backend env

### 1.3 Google Play (billing verification)

1. In Google Play Console → Setup → API access → Link to a Google Cloud project
2. Create a Service Account with **Android Publisher** role
3. Download service account JSON key
4. Extract `client_email` and `private_key` for backend env

### 1.4 Deploy Backend

```bash
cd backend
cp .env.example .env
# Fill in all values in .env

npm install
npm run build

# Deploy to Railway
npm install -g @railway/cli
railway login
railway init
railway up

# Set env vars in Railway dashboard (Settings → Variables)
# All keys from .env must be added there
```

### 1.5 Verify Backend

```bash
curl https://your-backend.railway.app/health
# → {"status":"ok","ts":"..."}
```

---

## 2 · App Setup

### 2.1 Configure environment

```bash
cd app
cp .env.example .env   # create this from .env.example template below
```

Create `app/.env`:
```
EXPO_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_PLAY_SKU=revise_premium_yearly
```

### 2.2 Install dependencies

```bash
cd app
npm install
```

### 2.3 Place Firebase config

```bash
# Download google-services.json from Firebase Console
cp ~/Downloads/google-services.json app/android/app/google-services.json
```

### 2.4 Run locally (development)

```bash
cd app
npx expo start --android
# or
npx expo run:android
```

### 2.5 Build release APK/AAB with EAS

```bash
cd app
eas login
eas build:configure

# Development APK (for testing)
eas build --platform android --profile development

# Production AAB (for Play Store)
eas build --platform android --profile production
```

---

## 3 · Google Play Store Setup

1. Create app in **Google Play Console**
2. Set package name: `com.yourapp.revise`
3. Upload AAB from EAS build
4. **Create subscription product**:
   - Product ID: `revise_premium_yearly`
   - Price: ₹100
   - Billing period: 1 year
   - Grace period: 3 days
5. Fill in **Data safety form** (see spec Section 11)
6. Complete store listing, screenshots, privacy policy URL
7. Submit for review

---

## 4 · API Reference

All endpoints: `https://your-backend.railway.app/api/v1`  
Auth header: `Authorization: Bearer <supabase_jwt>`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/topics` | List topics. Query: `status`, `tag`, `search` |
| POST | `/topics` | Create topic |
| GET | `/topics/:id` | Get topic + revision history |
| PATCH | `/topics/:id` | Update topic |
| DELETE | `/topics/:id` | Soft delete topic |
| POST | `/topics/:id/revise` | Mark as revised |
| PATCH | `/topics/:id/intervals` | Set custom intervals (premium) |
| GET | `/dashboard/today` | Today's due/overdue/upcoming + streak |
| GET | `/dashboard/calendar?month=YYYY-MM` | Calendar dot data |
| GET | `/vocab` | List all 1,000 GRE words |
| POST | `/vocab/:word_id/add` | Add word to revision plan |
| GET | `/vocab/my` | User's added vocab words |
| GET | `/profile` | Get profile + stats |
| PATCH | `/profile` | Update profile fields |
| PATCH | `/profile/intervals` | Set global custom intervals (premium) |
| GET | `/leaderboard` | Top 100 + user rank |
| POST | `/billing/verify` | Verify Play Store purchase |
| POST | `/billing/restore` | Restore existing purchase |

---

## 5 · Spaced Repetition Algorithm

Default 7-step schedule:

| Step | Days until next revision |
|------|--------------------------|
| 0 → 1 | 1 day |
| 1 → 2 | 3 days |
| 2 → 3 | 7 days |
| 3 → 4 | 14 days |
| 4 → 5 | 30 days |
| 5 → 6 | 60 days |
| 6 → Done | 90 days |

Premium users can customise all 7 values.

---

## 6 · Colour Grade System

| Grade | Colour | Condition |
|-------|--------|-----------|
| `new` | Blue | Never revised (step = 0) |
| `due` | Orange | Due today |
| `overdue` | Red | Past due date |
| `upcoming` | Gray | Due in the future |
| `done` | Green | All 7 steps complete |

---

## 7 · Acceptance Criteria

See Section 15 of the product specification document for the full 14-point acceptance criteria checklist.

Key checks:
- [ ] Sign up / log in / log out works
- [ ] 21st topic on free plan shows paywall
- [ ] Marking revised 7 times completes topic with correct dates
- [ ] Push notification arrives at configured time
- [ ] Calendar shows dots on correct dates
- [ ] Offline mark-as-revised syncs when back online
- [ ] Google Play subscription flow sets `is_premium = true`
- [ ] All 9 Revu bugs from spec Section 12 are absent

---

## 8 · Known Bugs Fixed vs Revu

| Revu Bug | Our Fix |
|----------|---------|
| Offline crashes | WatermelonDB offline queue |
| JWT expired crash | Auto-refresh via Supabase session |
| Skip referral JsonNull crash | null handled gracefully server-side |
| Greeting overlaps date | `flex:1` on greeting, fixed-width date |
| Notification has no topic name | Backend includes topic name when N=1 |
| Topics appear after deletion | Optimistic UI + soft delete filter |
| Cannot rename/edit topics | PATCH endpoint + edit UI |
| Status bar overlaps content | SafeAreaView on all root screens |
| Dark mode inconsistent | Single theme source across all screens |

---

## License

Private — not for redistribution.
