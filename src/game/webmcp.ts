import { useEffect, useRef } from "react";
interface GameState {
  phase: string;
  route: number[];
  validationError: string | null;
  outcome: string | null | undefined;
}
interface Actions {
  getState: () => GameState;
  openEditor: () => void;
  startRun: () => void;
}
interface Tool {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
}
export function useGameTools(actions: Actions) {
  const latest = useRef(actions);
  latest.current = actions;
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const schema = {
      type: "object",
      properties: {},
      additionalProperties: false,
    };
    const check = (input: unknown) => {
      if (
        input !== undefined &&
        input !== null &&
        (typeof input !== "object" ||
          Array.isArray(input) ||
          Object.keys(input).length)
      )
        throw new Error("This tool accepts an empty object only.");
    };
    const tools: Tool[] = [
      {
        name: "get_getaway_state",
        title: "Read getaway state",
        description: "Read the visible route validation and replay state.",
        inputSchema: schema,
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute(input) {
          check(input);
          return latest.current.getState();
        },
      },
      {
        name: "open_postcard_editor",
        title: "Open postcard editor",
        description:
          "Open the Unlayer editor for the current postcard. Does not draw or save a route.",
        inputSchema: schema,
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
          check(input);
          latest.current.openEditor();
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          return { editorRequested: true };
        },
      },
      {
        name: "start_getaway_replay",
        title: "Start getaway replay",
        description:
          "Run the already validated saved route through the deterministic getaway simulation.",
        inputSchema: schema,
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
          check(input);
          if (!latest.current.getState().route.length)
            throw new Error("Save a valid route first.");
          latest.current.startRun();
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          return { started: true, ...latest.current.getState() };
        },
      },
    ];
    for (const tool of tools) {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Optional browser capability. */
      }
    }
    return () => lifecycle.abort();
  }, []);
}
