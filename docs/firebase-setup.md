# SP Academy — Firebase setup (Phase 2)

> **Status:** No Firebase project exists yet for SP Academy. Nothing in the
> code invents a project ID or API key — the app runs in honest demo mode
> until the steps below are done. Do these steps once, in the Firebase console.

## 1. Create the project

1. Go to <https://console.firebase.google.com> and sign in (use the account that
   owns SP Academy — the same Google account used for the other SP projects).
2. **Add project** → name: `sp-academy` → continue (Google Analytics optional;
   leave off unless needed).
3. No billing is needed for Phase 2 (Spark / no-cost plan is enough for Auth +
   Firestore at this scale).

## 2. Register the web app + copy the config

1. Project Overview → **Add app → Web (`</>`)** → nickname: `sp-academy-web`.
2. Copy the `firebaseConfig` values shown.
3. In the local repo, copy `.env.example` to `.env.local` and fill in ONLY these:
   ```bash
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```
4. **Never commit `.env.local`** (it is in `.gitignore`) and never paste real
   keys into GitHub, chat, or the frontend code. The web `apiKey` is a client
   identifier, but it still belongs in env vars only.
5. For Vercel: add the same six `VITE_FIREBASE_*` variables in the Vercel
   dashboard (Project → Settings → Environment Variables, Production) and
   redeploy. Without them the live site stays in demo mode.

## 3. Enable Authentication

Build → **Authentication** → **Get started** → **Sign-in method**:

| Provider | Setting |
| --- | --- |
| Email/Password | Enable → Save |
| Google | Enable → pick the project support email → Save |

Phone sign-in is NOT enabled in Phase 2 (it needs extra verification setup);
it is a later phase if the user asks for it.

## 4. Create Firestore

Build → **Firestore Database** → **Create database**:

- Location: `asia-southeast1` (Singapore — closest to Bangladesh, same as the
  other SP projects).
- Start in **production mode** (rules below replace the defaults anyway).

Then publish the rules:

1. Firestore Database → **Rules** tab.
2. Paste the contents of `firestore.rules` (repo root) and **Publish**.
3. Test first with the Rules Playground: a signed-in student reading another
   user's `users/{otherUid}` doc must be **denied**; reading their own must be
   **allowed**.

## 5. Create the roles / permissions seed docs (admin only)

In Firestore, create these documents manually (or via an admin script later):

- `roles/super_admin`, `roles/admin`, `roles/moderator`, `roles/teacher`,
  `roles/student` — fields: `label` (Bengali name), `permissions` (array).
  The exact seed values are in `src/firebase/profiles.ts` (`ROLE_SEEDS`) and
  mirror `src/lib/roles.ts` (`ROLE_PERMISSIONS`).
- `permissions/*` — one doc per permission id if granular permission docs are
  wanted; optional in Phase 2.

## 6. Create the first admin (do NOT let users self-promote)

New registrations are always `student`. To make the first admin:

1. Register once on the live site with the admin's email.
2. In the Firebase console → Authentication → find the user → copy the UID.
3. Set a custom claim with the Admin SDK (or a one-time script — never from
   the browser):
   ```js
   await admin.auth().setCustomUserClaims(uid, { role: 'super_admin' })
   ```
4. Also set `users/{uid}.role` to `super_admin` in Firestore so the profile
   and the claim agree.
5. The user must log out and back in for the claim to take effect.

**Never** add a "make me admin" button or any client-side role picker.

## 7. Verify Phase 2 works

1. `npm run build` passes locally; deploy.
2. On the live site: register a new account → you land on `/dashboard` and
   see your name + `শিক্ষার্থী` role.
3. Log out → `/dashboard` redirects to `/login`.
4. `/profile` saves a name/phone change.
5. With Firebase env vars **removed**, the same pages show the honest
   "Firebase এখনো কনফিগার করা হয়নি" message and no fake login occurs.

## What Phase 2 deliberately does NOT include

- No backend / Admin SDK server, no Cloud Functions (Phases 7–9).
- No phone auth, no payment, no video, no exam engine.
- No real course enrolment data (dashboard enrolments are labelled নমুনা
  until Phase 3).
