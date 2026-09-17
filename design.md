# Visual and interaction design

## Thesis

A sun-faded tourist postcard becomes an absurd, cinematic getaway. Tactile paper and confident editorial typography surround a crisp, colorful map; the same map becomes the ground of a miniature city.

## Palette and typography

- Ink: `#142f32`; paper: `#f8f1de`; desk: `#e9e4d7`.
- Coral action: `#ef654a`; sea: `#187d82`; flamingo: `#f3789d`.
- Functional route cyan: `#00d8ff`, reserved inside the road region for route ink.
- Display: condensed, bold sans serif. Body: legible neutral sans serif. Metadata: monospace.
- Body 16px minimum; regular controls 14px minimum. Visible focus rings and sufficient contrast.

## Workspace

Compact masthead with product name, sound toggle, and help. Main work area pairs a large postcard with a compact mission brief, editing steps, and primary action. Use restrained borders, printed rules, stamp details, and ample spacing. The map is the main product surface; no marketing hero.

The postcard has a title band, route diagram, legend, and version markings. Start and boat destination are unmistakable. Landmarks distinguish the bridge, patrol district, and slower promenade. Decorative imagery never uses route cyan in sampled road corridors.

## States

- Briefing: postcard visible, mission note and Edit postcard action.
- Editing: real Unlayer editor in a full workspace overlay; explicit cyan color, instruction to trace existing streets, Save validates, Cancel preserves last committed image.
- Invalid: explain disconnected or branching routes, highlight affected streets; offer editing and reset.
- Ready: treat the recognized postcard as recovered evidence. A live postal-intelligence card names the route, grades viability, and exposes bridge, patrol, and boat timing before the player runs it. The map gains a non-interactive scanning treatment and an evidence stamp derived only from the deterministic simulation.
- Reveal/replay: tilt from overhead to isometric, raise buildings, follow truck; elapsed time and current event remain readable. Pause/replay controls available.
- Result: escaped/busted/too late, precise reason and location, retry and export actions.

## Responsive and accessibility

Two columns on wide screens, stacked on narrow screens; no horizontal page overflow. Editor receives most of the screen, with compact instructions. Honor reduced motion by skipping reveal and camera movement. Top-down canvas replay uses the same simulation if WebGL is unavailable. Sound is opt-in and never conveys exclusive information. Dialogs trap focus, close with Escape, and restore focus. Status updates use live regions without announcing every frame.
