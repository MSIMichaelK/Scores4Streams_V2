# Changelog Fragments

Write one fragment per logical unit of work before committing.

## Naming

- Feature/fix work: `<issue>-<slug>.md` (e.g. `86-isPitch-fix.md`)
- Chore (no issue): `0-chore-<slug>.md` (e.g. `0-chore-fix-typos.md`)

## Format

```markdown
### Added
- **Feature name** (#N) — description

### Fixed
- **Bug name** (#N) — description

### Changed
- **What changed** (#N) — description

### Discovered
- **Finding** (#N) — description
```

Recognised headings: `Added`, `Fixed`, `Changed`, `Discovered`, `Investigated`, `Notes`.

Fragments are assembled into CHANGELOG.md at release time and then deleted.
