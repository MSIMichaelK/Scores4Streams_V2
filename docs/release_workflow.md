# Release Workflow — Scores4Streams V2

> How to release a new version. Follow every step — skipping causes version drift.

---

## Current Version

**v2.3.0** (21 March 2026)

---

## Version Locations

These files contain version numbers and must all match at release:

| File | Field | Example |
|------|-------|---------|
| `package.json` | `"version"` | `"2.1.0"` |
| `MEMORY.md` | Version History table | `2.1.0` |
| `ARCHITECTURE.md` | Header line | `Version: 1.0.0` (doc version, not app version) |

Note: `src/pages/SettingsPage.jsx` now reads version from `package.json` automatically (#51).

---

## Release Process

### 1. Assemble Changelog

1. Read all `.changelog/*.md` fragments
2. Create new entry at top of `CHANGELOG.md`:
   ```
   ## [vX.Y.Z] - YYYY-MM-DD

   ### Added
   ...
   ### Fixed
   ...
   ```
3. Delete assembled fragments (`rm .changelog/*.md`, keep `README.md`)

### 2. Bump Versions

Update version in all files listed in `.claude/version-files`:
- `package.json`
- `MEMORY.md` — add row to Version History table
- `ARCHITECTURE.md` — update header version and date

### 3. Commit and Tag

```bash
git add -A
git commit -m "vX.Y.Z: Short description (#N, #M)"
git tag -a vX.Y.Z -m "vX.Y.Z: summary"
git push && git push --tags
```

### 4. GitHub Release (minor+ only)

```bash
gh release create vX.Y.Z --notes "summary"
```

### 5. Close Issues

For each resolved issue, post an enriched closing comment (see workflow standard) then:
```bash
gh issue close N
```

### 6. Deploy

```bash
npm run build
firebase deploy
```

---

## Dev Commands

```bash
export PATH="/opt/homebrew/bin:/usr/bin:$PATH"   # Required before npm commands
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build
npm test             # Run Jest tests (13 suites, 211 tests)
```
