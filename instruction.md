# Product instructions

## Objective

Create POSTCARD PANIC, an original GTA-inspired browser getaway game for the Build with React Image Editor Challenge. A route drawn on a tourist postcard becomes the route a miniature getaway truck drives through a coastal city. The crew has stolen an oversized flamingo statue.

## Required experience

Briefing → edit postcard → validate route → unfold city → watch chase → inspect result → revise or export. Importing an exported postcard reproduces its route and outcome. Start with one authored district, one mission, and several possible routes.

The first screen must expose the postcard and the editing action. The primary interaction uses the real `@unlayer/react-image-editor`. A guided example may demonstrate a route, but must be clearly labeled and must not impersonate an edit.

## Delivery requirements

- Source in a public GitHub repository and an anonymously accessible deployment.
- User can edit at least one visual; edited pixels affect gameplay.
- Account-free play, original visual identity, keyboard-accessible controls, responsive layout, reduced-motion and WebGL fallbacks.
- Local-only progress and PNG file import/export.
- A clear README and a short demonstration script.

## Scope boundaries

Single-player route planning and deterministic replay. No free-roaming driving, multiplayer, paid AI runtime, global leaderboard, or authentication in v1.

## Workflow

Write documentation first. Prove the editor and pixel-to-route integration before 3D polish. Implement chase and retry, then city reveal, portability, accessibility, and publication. Follow `tasks.md`; use `testing.md` for completion evidence. Maintain one source of truth for design (`design.md`) and technical behavior (`architecture.md`).
