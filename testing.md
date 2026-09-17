# Verification plan

## Automated

- Route fixtures: empty map; valid short and scenic paths; variable stroke widths; modest offsets; missing edge; disconnected island; branch; loop; wrong color; cyan annotations outside road corridors.
- Simulation: stable identical output for identical routes; bridge timing; patrol encounter; successful route; slow route; event ordering; pause-independent time sampling.
- Briefing: deterministic codename and bounded risk score; exactly three advisories; bridge, patrol and boat states; safe, caught, bridge-delayed and late routes; suggested revisions independently reproduce a successful outcome.
- PNG: exported postcard decodes and reproduces route/outcome; wrong dimensions, non-PNG, oversize file, and damaged registration marks fail clearly.
- App: guarded storage corruption; editor save/cancel/error; replay cleanup and loading behavior where practical.
- TypeScript check and production build.

## Browser integration

Use the actual Unlayer editor. Draw or amend a route, save, inspect recognized path, run, revise, and export/import. Verify cancellation and retry. Check wide desktop and narrow touch layout, keyboard focus, reduced motion, muted play, and WebGL fallback. Inspect console/runtime errors. Record checks actually performed in `tasks.md`.

## Human usability

Ask a first-time user to draw and run without coaching. Target <=90 seconds. Until a human trial occurs, report this as an unverified target.

## Release

Confirm public GitHub source, anonymous deployment access, working editor CDN loading, original asset attribution, and README commands. Submission and social posting are user actions; provide drafts only.

## Verification evidence

`npm test`: 38 tests pass across route, simulation, actual raster PNG round-trip and storage suites. Fixtures are generated in ignored `.qa/` for browser import checks. Browser checks confirmed a hand-drawn cyan route through the actual editor, saved-image recognition, persistence on reload, successful scenic replay (31 seconds), and imported bridge-route failure (29 seconds) with the patrol explanation. See tasks.md for unverified acceptance items.
