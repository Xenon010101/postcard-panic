# Architecture

## Stack and boundaries

React + TypeScript + Vite, real `@unlayer/react-image-editor`, Three.js, and browser Canvas APIs. Static deployment; no application backend. Unlayer loads its hosted editor, so editing requires network availability even though gameplay data stays local.

Implemented module boundaries:
- `src/game/map.ts`: immutable street graph, landmarks, start/end, and postcard format constants.
- `src/game/postcard.ts`: canonical postcard drawing, PNG decoding, import validation, and image conversion.
- `src/game/route.ts`: pure cyan-pixel sampling and graph validation.
- `src/game/simulation.ts`: pure route-to-timeline simulation.
- `src/components`: editor, postcard, city/replay, and accessible controls.

## Data flow

Canonical postcard → Unlayer image input → documented `getImage()` / `onSave({dataUrl})` output → decoded RGBA → sampled street edges → one start-to-exit path → deterministic timeline → Three.js or 2D replay.

Draw, text, and shapes can customize the postcard. Crop/rotate/resize/filter controls are disabled because the map's coordinate system and cyan recognition are part of the file format. Configure editor options before mounting; do not change remount-tier options during an edit. Show loading, image-load error, wrapper error, and retry states.

## Route recognition

Sample along fixed road segments with tolerance for stroke width, antialiasing, and modest hand wobble. Classify sufficiently bright blue/green cyan pixels. Reject empty, disconnected, branching, or incomplete paths. Never silently choose a path at a branch. Show the recognized route before simulation. Sampling ignores decorative regions outside roads.

## Simulation

Use fixed edge lengths and speed, authored patrol timing, a drawbridge closed from seconds 14 to 24, and a slower promenade. Time and outcome are pure functions of ordered route node IDs. Animation time only selects a frame from that timeline. Pause and tab visibility do not change results. Return event records explaining failure and success.

## Portable postcard

One versioned, fixed-size PNG map for one district. Export the committed edited raster. Import checks PNG signature, file-size limits, decoded dimensions, and protected map registration marks before route recognition. No embedded executable code or hidden route metadata. Imported pixels are authoritative. The exact original PNG must round-trip; reject resized or compressed screenshots clearly.

## Persistence and failure handling

Persist the committed postcard and preference state locally, with schema versioning and guarded storage access. Corrupt or unavailable storage cannot prevent play. Imports stay on-device. Dispose Three.js resources and object URLs. Fall back to top-down replay when WebGL cannot initialize or its context is lost.

## Public interfaces

Only PNG import/export is a portable external contract. Internal Route and Simulation types connect modules. Optional, feature-detected WebMCP tools must invoke the same app actions and report their actual state; support is not required for ordinary play.

## Verified parameters

The canonical format is PP-PALMETTO-1, 1024 × 704. Each street has 18 samples; at least 14 must contain cyan within a 24px radius. This accepts moderate hand wobble while rejecting routes offset 40px. Registration marks protect format identity. Import checks IHDR dimensions before image decoding, with an 8 MB file limit. Streets run at 46 units/s; the boardwalk runs at 31. The patrol catches crossings between seconds 18 and 30. The boat leaves at 48 seconds. All timing is authored, not random.

Unlayer mounts with a measured pixel height so its drawing surface fits the available screen. Fresh map calls the documented reset API; cancellation preserves the committed image. A saved PNG has no editable layer history. Three.js loads only when replay begins. The postcard art is a visual front; the functional map is the editable reverse and city ground texture.

