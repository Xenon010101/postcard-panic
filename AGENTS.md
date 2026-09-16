# POSTCARD PANIC — agent entry point

Read `instruction.md`, `design.md`, `architecture.md`, and `tasks.md` before changing product code. Consult `skills.md` for tool workflows, `testing.md` for acceptance checks, and `submission.md` for release requirements.

## Working rules

- Preserve the React + TypeScript + Vite + Unlayer + Three.js architecture.
- Implement the actual playable experience, not a marketing page or a mock editor.
- All route decisions must come from saved image pixels and the known street graph. Never invent semantic image analysis, hidden editor APIs, or random verdicts.
- Simulation must be deterministic and independently testable. Rendering must not determine game outcomes.
- Keep route color distinct from artwork. Changes to map geometry or import format need matching fixtures and documentation.
- Keep user data local. Do not add accounts, analytics, external uploads, or runtime AI services.
- Run the relevant tests and production build before delivery. The user explicitly requested verification of the editor and gameplay; include browser interaction checks.
- Update `tasks.md` honestly. Never mark deployment, browser checks, or human usability testing complete without evidence.
- Do not send the submission or announcement. Prepare drafts only.
- Never commit secrets, generated dependency directories, local QA output, or source-repository credentials.

Each document owns its topic; cross-link instead of copying competing specifications.
