# POSTCARD PANIC

**Wish you weren’t here.** Draw an escape route on a tourist postcard, watch it become a miniature coastal getaway, and share the PNG so someone else can replay your plan.

Built with React, TypeScript, Vite, Unlayer React Image Editor and Three.js. Original fan-inspired work; not affiliated with Rockstar Games.

## Play locally

Requires Node.js 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open the localhost address printed by Vite. No API key or account is needed. The Unlayer editor loads from its hosted service and needs internet access.

```sh
npm test
npm run build
npm run preview
```

## How to play

1. Open **Edit your postcard**. Choose Draw, set color to **#00D8FF**, and use an 8–12px brush.
2. Trace one continuous route along streets from pickup A (southwest) to boat B (northeast). Avoid branches. Text and shapes can decorate areas away from roads and corner marks.
3. Save and check the route, then run the getaway. The bridge, patrol and slower promenade affect your timing.
4. Revise after failure. **Fresh map** inside the editor clears the flattened image for a new route; Cancel keeps the previously saved postcard.
5. Save PNG and import that original file to reproduce the route and outcome. Screenshots, resized images and ordinary pictures are rejected.

The labeled example route demonstrates play without pretending to be an editor interaction. Sound starts muted. The map replay works without WebGL. Progress is stored locally when browser storage is available.

## Implementation

One district, one mission, several valid routes, deterministic replay, PNG sharing, original artwork, accessible replay controls and optional WebMCP actions are implemented. See [tasks.md](tasks.md) for release status and honest verification limits. The first-use 90-second target still needs a new human participant.

## Project guide

[Instructions](instruction.md) · [Design](design.md) · [Architecture](architecture.md) · [Testing](testing.md) · [Submission draft](submission.md) · [Asset credits](assets.md)
