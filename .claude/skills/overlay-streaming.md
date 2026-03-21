---
name: overlay-streaming
description: "Use when modifying the SVG overlay, OBS browser source integration, overlay templates, streaming setup, YouTube/Twitch integration, public scoreboard viewer, updateSVGNodes, OverlayFromFigma, or the /overlay route"
---

# Overlay & Streaming Navigator

The overlay system renders live game data as SVG for OBS browser sources. Currently a single Figma-designed template with no customization. This domain covers everything from the SVG rendering to streaming platform integration and public viewers.

## Key Files

| File | Role |
|------|------|
| `src/pages/OverlayFromFigma.jsx` | Overlay page: loads SVG, onSnapshot listener, calls updateSVGNodes |
| `src/utils/updateSVGNodes.js` | SVG DOM manipulation: team names, scores, inning, BSO, runners, pitch count |
| `public/figma_overlay_template.svg` | SVG template designed in Figma |
| `src/__tests__/OverlayFromFigma.test.jsx` | Unit tests |
| `src/__tests__/OverlayFromFigma.integration.test.jsx` | Integration tests |

## Architecture

- **Public route:** `/overlay/:gameId` — no auth required, reads aggregate state only
- **Real-time:** `onSnapshot(games/{gameId})` fires on every state change
- **SVG manipulation:** `updateSVGNodes(svg, gameData)` updates text content and visibility of SVG elements by ID
- **OBS integration:** user adds a Browser Source pointing at the overlay URL

## Current Limitations

- Single hardcoded SVG template — no template picker or customization
- No color/logo customization per team
- No streaming platform integration (manual OBS setup only)
- No public-facing scoreboard viewer (overlay is designed for OBS, not mobile browsers)
- No overlay URL management UX in the app
- No preview/test mode without a live game

## As-Built Decisions

- **AB-001 (dual-write):** Overlay reads ONLY aggregate state from `games/{gameId}`. Never reads events subcollection. This is intentional — keep overlay reads cheap and simple.

## Findings

- None specific to overlay yet — this domain hasn't been touched since initial implementation.

## Open Assumptions

- **A-001:** Firebase free tier handles current overlay onSnapshot volume. Multiple concurrent viewers = multiple listeners on same doc.

## Related Closed Issues

- **#14** Dynamic Game ID functions
- **#31** Full field view with fielder positions

## Regression Risks

1. **Public access** — overlay route must remain unauthenticated. Don't add auth guards to `/overlay/:gameId`.
2. **SVG element IDs** — `updateSVGNodes` relies on specific element IDs in the SVG template. Changing the SVG template requires updating the ID mappings.
3. **Aggregate state shape** — overlay reads the game document directly. Any field renames break the overlay.
4. **Performance** — onSnapshot fires on every scoring action. Keep updateSVGNodes fast (DOM reads/writes only, no computation).
