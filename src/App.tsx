import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CircleHelp,
  Compass,
  FileUp,
  Map,
  Pencil,
  Play,
  RotateCcw,
  Route as RouteIcon,
  Ship,
  Volume2,
  VolumeX,
} from "lucide-react";
import { EXAMPLE_ROUTE, nodes, WIDTH, HEIGHT } from "./game/map";
import { analyzeRoute, type RouteAnalysis } from "./game/route";
import {
  decodeImage,
  downloadPostcard,
  makePostcard,
  readPostcard,
  validateFormat,
} from "./game/postcard";
import { simulate, clockLabel, type Simulation } from "./game/simulation";
import { loadSession, saveSession } from "./game/storage";
import ReplayBoard from "./components/ReplayBoard";
import { useGameTools } from "./game/webmcp";
const EditorModal = lazy(() => import("./components/EditorModal"));
const blankAnalysis: RouteAnalysis = {
  route: null,
  error: null,
  markedEdges: [],
  problemNodes: [],
};

export default function App() {
  const [postcard, setPostcard] = useState(""),
    [side, setSide] = useState<"front" | "map">("front"),
    [editing, setEditing] = useState(false),
    [analysis, setAnalysis] = useState(blankAnalysis),
    [notice, setNotice] = useState(""),
    [sound, setSound] = useState(false);
  const [run, setRun] = useState<{ sim: Simulation; id: number } | null>(null),
    [finished, setFinished] = useState(false),
    [best, setBest] = useState<number | null>(null),
    [reducedMotion, setReducedMotion] = useState(false),
    [busy, setBusy] = useState(false);
  const predicted = useMemo(
    () => (analysis.route ? simulate(analysis.route) : null),
    [analysis.route],
  );
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let live = true;
    void document.fonts.ready.then(async () => {
      const saved = loadSession();
      if (saved) {
        try {
          const { pixels } = await decodeImage(saved.image);
          validateFormat(pixels);
          if (live) {
            setPostcard(saved.image);
            const restored = analyzeRoute(pixels);
            setAnalysis(restored.markedEdges.length ? restored : blankAnalysis);
            setSound(saved.sound);
            setBest(saved.best);
          }
          return;
        } catch {
          /* Corrupt local state cannot prevent play. */
        }
      }
      if (live) setPostcard(makePostcard());
    });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReducedMotion(query.matches);
    change();
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  const commit = async (data: string) => {
    const { pixels } = await decodeImage(data);
    validateFormat(pixels);
    const result = analyzeRoute(pixels);
    setPostcard(data);
    setAnalysis(result);
    setSide("map");
    setEditing(false);
    setRun(null);
    setFinished(false);
    const persisted = saveSession({ version: 1, image: data, sound, best });
    setNotice(
      (result.error || "Route connected. Your driver has a plan.") +
        (!persisted
          ? " Local saving is unavailable; download your PNG to keep it."
          : ""),
    );
  };
  const importFile = async (f: File) => {
    setBusy(true);
    try {
      await commit(await readPostcard(f));
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "Could not import this postcard.",
      );
    } finally {
      setBusy(false);
    }
  };
  const startRun = () => {
    if (!predicted) return;
    setRun({ sim: predicted, id: Date.now() });
    setFinished(false);
    setNotice("");
    requestAnimationFrame(() => document.querySelector('.postcard-area')?.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'}));
  };
  const finishRun = () => {
    setFinished(true);
    if (run?.sim.outcome === "escaped") {
      const next =
        best === null ? run.sim.duration : Math.min(best, run.sim.duration);
      setBest(next);
      saveSession({ version: 1, image: postcard, sound, best: next });
    }
  };
  const reset = () => {
    const data = makePostcard();
    setPostcard(data);
    setAnalysis(blankAnalysis);
    setRun(null);
    setFinished(false);
    setSide("map");
    setNotice("A fresh postcard. A fresh bad idea.");
    saveSession({ version: 1, image: data, sound, best });
  };
  const toggleSound = () => {
    setSound(!sound);
    if (postcard)
      saveSession({ version: 1, image: postcard, sound: !sound, best });
  };
  useGameTools({
    getState: () => ({
      phase: editing
        ? "editing"
        : run
          ? finished
            ? "result"
            : "replay"
          : analysis.route
            ? "ready"
            : "planning",
      route: analysis.route?.nodes || [],
      validationError: analysis.error,
      outcome: finished ? run?.sim.outcome : null,
    }),
    openEditor: () => setEditing(true),
    startRun,
  });
  return (
    <div className="app-shell">
      <header className="masthead">
        <a className="wordmark" href="/" aria-label="Postcard Panic home">
          <span className="brand-icon">
            <Compass size={23} />
          </span>
          POSTCARD<span>PANIC</span>
        </a>
        <div className="header-center">
          PALMETTO BAY, LEONIDA <span>26° N / 80° W</span>
        </div>
        <div className="header-tools">
          <button
            className="icon-button"
            aria-label={sound ? "Mute sound" : "Enable sound"}
            aria-pressed={sound}
            onClick={toggleSound}
          >
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            className="help-button"
            aria-label="How to play"
            onClick={() =>
              setNotice(
                "Open the editor, choose Draw and cyan #00D8FF, then connect A to B along the streets. Save to check your route. Use Fresh map in the editor to remove old ink. Avoid the patrol and watch the bridge timing.",
              )
            }
          >
            <CircleHelp size={18} />
            <span>How to play</span>
          </button>
        </div>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="little-rule" />A GETAWAY, IN YOUR HANDWRITING
            </div>
            <h1>
              WISH YOU <em>WEREN’T</em> HERE.
            </h1>
          </div>
          <div className="edition">
            <span>ONE POSTCARD.</span>
            <span>ONE VERY BAD IDEA.</span>
            <b>VOL. 01 — THE FLAMINGO JOB</b>
          </div>
        </div>
        <div className="workspace">
          <section className="postcard-area" aria-label="Your postcard">
            <div className="card-topline">
              <span>
                <i className="status-dot" />
                {analysis.route
                  ? "ESCAPE ROUTE READY"
                  : "YOUR NEXT BAD DECISION"}
              </span>
              <div className="view-switch">
                <button
                  className={side === "front" ? "active" : ""}
                  onClick={() => {
                    setSide("front");
                    setRun(null);
                    setFinished(false);
                  }}
                >
                  Postcard
                </button>
                <button
                  className={side === "map" ? "active" : ""}
                  onClick={() => {
                    setSide("map");
                    setRun(null);
                    setFinished(false);
                  }}
                >
                  <Map size={13} /> Escape map
                </button>
              </div>
            </div>
            {run ? (
              <ReplayBoard
                key={run.id}
                image={postcard}
                sim={run.sim}
                reducedMotion={reducedMotion}
                onFinish={finishRun}
                sound={sound}
              />
            ) : (
              <div
                className={`postcard-paper ${side === "front" ? "cover" : ""}`}
              >
                {side === "front" ? (
                  <>
                    <div className="postcard-art">
                      <img
                        src="/assets/palmetto-postcard.png"
                        alt="A cream pickup carrying an enormous pink flamingo through a sunlit coastal town"
                      />
                      <div className="art-title">
                        <span>Greetings from</span>
                        <strong>
                          PALMETTO
                          <br />
                          BAY
                        </strong>
                      </div>
                      <div className="postage-stamp">
                        <Compass size={27} />
                        <span>LEONIDA</span>
                        <b>25¢</b>
                      </div>
                      <div className="art-caption">
                        SUNSHINE. SEA BREEZE. QUESTIONABLE DECISIONS.
                      </div>
                    </div>
                    <div className="postcard-bottom">
                      <span>
                        A small slice of paradise.
                        <br />
                        <b>A spectacular place to make a mistake.</b>
                      </span>
                      <button
                        className="round-button"
                        aria-label="Flip to escape map"
                        onClick={() => setSide("map")}
                      >
                        <ArrowUpRight size={23} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="map-image">
                    {postcard && (
                      <img
                        src={postcard}
                        alt="Editable Palmetto Bay street map. Pickup A is southwest; escape boat B is northeast."
                      />
                    )}
                    {analysis.problemNodes.length > 0 && (
                      <svg
                        className="map-problems"
                        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                        aria-label="Junctions that need attention"
                      >
                        {analysis.problemNodes.map((id) => (
                          <circle
                            key={id}
                            cx={nodes[id].x}
                            cy={nodes[id].y}
                            r="24"
                          />
                        ))}
                      </svg>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="card-tools">
              <button
                className="text-button"
                disabled={busy}
                onClick={() => file.current?.click()}
              >
                <FileUp size={16} />{" "}
                {busy ? "Reading postcard…" : "Import a postcard"}
              </button>
              <button
                className="text-button"
                disabled={!postcard}
                onClick={() => downloadPostcard(postcard)}
              >
                <ArrowDownToLine size={16} /> Save PNG
              </button>
              <span>Made to be sent. Built to be played.</span>
            </div>
            {notice && (
              <div
                className={`notice ${analysis.error ? "warning" : ""}`}
                role="status"
              >
                <RouteIcon size={18} />
                <span>{notice}</span>
                <button
                  aria-label="Dismiss message"
                  onClick={() => setNotice("")}
                >
                  ×
                </button>
              </div>
            )}
          </section>
          <aside className="mission-panel">
            <div className="mission-meta">
              <span>YOUR FIRST JOB</span>
              <span>01 / 01</span>
            </div>
            <h2>
              THE <br />
              FLAMINGO <br />
              <em>JOB.</em>
            </h2>
            <div className="mission-message">
              <span className="message-from">INCOMING FROM: THE CREW</span>
              <p>
                “We have the flamingo.
                <br />
                It doesn’t fit in the car.
                <br />
                <strong>Draw us a way out.”</strong>
              </p>
              <span className="message-time">
                17:42 · DELIVERED, UNFORTUNATELY
              </span>
            </div>
            <div className="mission-facts">
              <div>
                <span>THE CARGO</span>
                <strong>One enormous flamingo</strong>
              </div>
              <div>
                <span>THE DESTINATION</span>
                <strong>
                  <Ship size={15} /> Marina escape boat
                </strong>
              </div>
              <div>
                <span>THE CATCH</span>
                <strong>48 seconds. Zero good excuses.</strong>
              </div>
            </div>
            {finished && run && (
              <div className={`result-card ${run.sim.outcome}`} role="status">
                <span>
                  {run.sim.outcome === "escaped"
                    ? "MISSION PASSED"
                    : "A PLAN WITH ROOM FOR IMPROVEMENT"}
                </span>
                <h3>
                  {run.sim.outcome === "escaped"
                    ? "SOUVENIR SECURED."
                    : run.sim.outcome === "busted"
                      ? "FLAMINGO DOWN."
                      : "MISSED THE BOAT."}
                </h3>
                <p>{run.sim.events.at(-1)!.detail}</p>
                <div>
                  <strong>{clockLabel(run.sim.duration)}</strong>
                  <span>
                    {run.sim.outcome === "escaped"
                      ? "TO FREEDOM"
                      : "UNTIL TROUBLE"}
                  </span>
                </div>
              </div>
            )}
            <button
              className="btn primary main-action"
              disabled={!postcard || busy}
              onClick={analysis.route ? startRun : () => setEditing(true)}
            >
              {analysis.route ? <Play size={19} /> : <Pencil size={19} />}{" "}
              {analysis.route
                ? run
                  ? "Run it again"
                  : "Run the getaway"
                : "Draw your escape"}
              <ArrowRight size={20} />
            </button>
            {analysis.route || analysis.error ? (
              <button
                className="btn secondary"
                onClick={() => setEditing(true)}
              >
                <Pencil size={15} />{" "}
                {analysis.route ? "Revise your postcard" : "Fix your route"}
              </button>
            ) : (
              <button
                className="btn secondary"
                disabled={!postcard || busy}
                onClick={() =>
                  void commit(makePostcard(EXAMPLE_ROUTE)).catch(() =>
                    setNotice("Could not load the example. Please try again."),
                  )
                }
              >
                <Play size={15} /> Load an example route
              </button>
            )}
            {(analysis.route || analysis.error) && (
              <div className="route-ready">
                <span>
                  <RouteIcon size={16} />{" "}
                  {analysis.route
                    ? `${analysis.route.nodes.length - 1} connected streets`
                    : "Route needs attention"}
                </span>
                <button className="text-button" onClick={reset}>
                  <RotateCcw size={13} /> Start over
                </button>
              </div>
            )}
            {best !== null && (
              <div className="personal-best">
                PERSONAL BEST <b>{clockLabel(best)}</b>
              </div>
            )}
            <p className="editor-credit">
              Your ink. Your consequences.
              <br />
              Powered by{" "}
              <a
                href="https://github.com/unlayer/react-image-editor"
                target="_blank"
                rel="noreferrer"
              >
                React Image Editor <ArrowUpRight size={11} />
              </a>
            </p>
          </aside>
        </div>
        <section className="steps-strip" aria-label="How it works">
          <div>
            <span>01</span>
            <div>
              <h3>MAKE YOUR MARK.</h3>
              <p>Draw a route on the postcard.</p>
            </div>
            <Pencil size={22} />
          </div>
          <div>
            <span>02</span>
            <div>
              <h3>WATCH IT GO SIDEWAYS.</h3>
              <p>Your plan becomes a live getaway.</p>
            </div>
            <RouteIcon size={24} />
          </div>
          <div>
            <span>03</span>
            <div>
              <h3>SEND A LITTLE CHAOS.</h3>
              <p>Share the PNG. They can play it.</p>
            </div>
            <FileUp size={22} />
          </div>
        </section>
      </main>
      <footer>
        <span>
          POSTCARD PANIC © 2026 <b>AN ORIGINAL, UNOFFICIAL FAN EXPERIENCE.</b>
        </span>
        <span>
          NO VACATION DAYS WERE APPROVED. <Compass size={16} />
        </span>
      </footer>
      <input
        ref={file}
        type="file"
        accept="image/png"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importFile(f);
          e.target.value = "";
        }}
      />
      {editing && postcard && (
        <Suspense
          fallback={
            <div className="loading-toast" role="status">
              Opening the editor…
            </div>
          }
        >
          <EditorModal
            image={postcard}
            onSave={commit}
            onClose={() => setEditing(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
