### Fixed
- Settings page roles now fall back to AuthContext roles when team-level roles unavailable (#39)
- Settings page shows "Unknown Team" instead of raw Firestore doc ID for unresolved teams (#39)
- Team resolution in `listUserTeams` now catches per-team errors instead of failing all teams (#39)
- TeamRosterManager shows actionable error message and handles missing team gracefully (#39)
