# Worktree Session Prompt Template

> Copy this template when starting a new worktree session. Fill in the blanks and paste as your first message.

---

## Issue: #[NUMBER] — [TITLE]

### Scope
[1-2 sentences describing what this worktree will accomplish]

### Related Issues
- #[N] — [brief description of how it relates]

### Key Context
[What does Claude need to know that isn't in the standard docs? Examples:]
- Which files are most relevant
- Any prior attempts or rejected approaches
- Specific test data or game scenarios to consider
- Relevant as-built decisions (e.g., "AB-004 is directly relevant")

### Tasks
1. [ ] [First task]
2. [ ] [Second task]
3. [ ] [Final verification: build, test, preview]

### Rules Reminder
- Context recovery is mandatory (the hook will remind you)
- Create a PR to merge back to main: `gh pr create`
- Bump version in MEMORY.md and CHANGELOG.md
- Keep responses short (32K output token limit)

---

## Example: PIR Sensor Replacement

### Issue: #5 — Replace failed SML001 PIR sensors with Aqara P1

### Scope
Replace the Study PIR sensor (currently SML001, failing intermittently) with an Aqara FP1 presence sensor. Update automations to use the new entity.

### Related Issues
- #3 — Original PIR strategy discussion (see AB-005)

### Key Context
- Current Study PIR entity: `binary_sensor.study_pir_sml001`
- New sensor will need Zigbee pairing via HA Yellow
- AB-005 has the full PIR inventory and replacement strategy
- Automations `automation.study_lights_on` and `automation.study_lights_off` need updating

### Tasks
1. [ ] Pair new Aqara P1 via Zigbee
2. [ ] Update Study light automations to use new entity
3. [ ] Test motion detection and timeout
4. [ ] Update MEMORY.md PIR sensor map
5. [ ] Update as-built.md AB-005 with new sensor details
6. [ ] Build, test, create PR

---

## Example: Scores4Streams — Add Stolen Base Action

### Issue: #12 — Add stolen base to Advanced Scorer

### Scope
Add a "SB" button to the Advanced Scorer that toggles a runner to the next base and records a stolen_base event.

### Related Issues
- #8 — Advanced Scorer mode (AB-008)
- Drillers test game has stolen bases modeled as toggle pairs

### Key Context
- `scoringEngine.js` needs a new `stolen_base` action
- `ManualScoreController.jsx` needs a new handler, gated behind `scoringMode === "advanced"`
- Drillers test (`gameReplayDrillers.test.js`) uses `toggle_second`/`toggle_first` pairs for SBs — could be upgraded to use the new action
- Must decide: does SB count as isPitch? (No — it happens between pitches)

### Tasks
1. [ ] Add `stolen_base` action to scoringEngine.js (isPitch: false)
2. [ ] Add handler + button to ManualScoreController (Advanced mode only)
3. [ ] Add CSS for `.action-btn.sb`
4. [ ] Update Drillers test to use new action (optional — existing test still valid)
5. [ ] Build, test, preview, create PR
