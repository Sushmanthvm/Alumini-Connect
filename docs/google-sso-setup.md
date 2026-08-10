# Google SSO (students & alumni)

Users can sign in with either:

1. **Traditional login** — email/password (alumni also need alumni code)  
2. **Google SSO** — Google account via Supabase Auth

Which dashboard they get depends on the tab they used:

| Started from | Creates / expects role | Lands on |
|--------------|------------------------|----------|
| Student tab → Google | `student` | `/student` |
| Alumni tab → Google | `alumni` | `/alumni` |

A Google account already linked as **student** cannot sign in from the Alumni tab (and vice versa).

---

## 1. Create Google OAuth credentials

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Go to **APIs & Services → OAuth consent screen**
   - User type: **External** (or Internal if using Google Workspace only)
   - App name: `Alumni Connect`
   - Add scopes: `email`, `profile`, `openid`
4. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins:
   - `http://localhost:8080`
   - your production site URL (later)
7. Authorized redirect URIs:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
8. Create and copy:
   - **Client ID**
   - **Client Secret**

---

## 2. Enable Google in Supabase

1. Supabase Dashboard → **Authentication → Providers → Google**
2. Enable Google
3. Paste Client ID + Client Secret
4. Save

Under **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:8080`
- **Redirect URLs**:
  - `http://localhost:8080/auth/callback`
  - your production URL + `/auth/callback`

---

## 3. App behavior (already in code)

| File | Role |
|------|------|
| `src/lib/auth.ts` | `loginStudentWithGoogle()`, `loginAlumniWithGoogle()`, `completeOAuthCallback()` |
| `src/routes/auth.callback.tsx` | Handles OAuth return, creates the right role profile |
| Landing student tab | **Continue with Google** → `/student` |
| Landing alumni tab | **Continue with Google** → `/alumni` |

Flow:

```
User clicks Google (Student or Alumni tab)
  → Google account picker
  → Supabase /auth/v1/callback
  → App /auth/callback
  → ensure student or alumni profile (from tab intent)
  → /student or /alumni
```

---

## 4. Test locally

```bash
npm run dev
```

1. Open http://localhost:8080/
2. **Student** tab → **Continue with Google** → should land on `/student`
3. Sign out, then **Alumni** tab → **Continue with Google** with a *different* Google account → `/alumni`

> Tip: Use two Google accounts when testing both roles. One Google identity maps to one role.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Google redirect URI must be exactly `https://<ref>.supabase.co/auth/v1/callback` |
| Provider disabled | Enable Google in Supabase Auth providers |
| Stuck on callback | Add `http://localhost:8080/auth/callback` to Supabase redirect allowlist |
| Consent screen “Testing” | Add your Google account as a test user |
| “linked to an alumni/student profile” | That Google account already has the other role — use the matching tab |
