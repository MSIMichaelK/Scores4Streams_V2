# Assumptions — Scores4Streams V2

> Unverified assumptions that need confirmation. Track lifecycle:
> OPEN -> CONFIRMED / DISPROVED -> resolved section.

---

## Open

### A-001: Firebase free tier is sufficient for current usage

**Raised:** 2026-03-21 | **Status:** OPEN
**Raised by:** Retrofit audit

**Assumption:** The Spark (free) plan handles current game volume without hitting Firestore read/write limits or Cloud Function invocation limits.

**How to verify:** Monitor Firebase console usage dashboard during a multi-game weekend.

---

### A-002: SettingsPage.jsx version display is not user-visible in production

**Raised:** 2026-03-21 | **Status:** OPEN
**Raised by:** Retrofit audit — `src/pages/SettingsPage.jsx` line 104 shows version 2.0.0 (stale, should be 2.1.0)

**Assumption:** This page may not be deployed or visible to end users yet, so the stale version is low priority.

**How to verify:** Check if SettingsPage is accessible in production Firebase Hosting deployment.

---

## Resolved

(No resolved assumptions yet)
