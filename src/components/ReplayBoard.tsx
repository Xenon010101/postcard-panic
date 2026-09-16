import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  FastForward,
  Map,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { clockLabel, type Simulation } from "../game/simulation";
const CityScene = lazy(() => import("./CityScene"));

export default function ReplayBoard({
  image,
  sim,
  reducedMotion,
  onFinish,
  sound,
}: {
  image: string;
  sim: Simulation;
  reducedMotion: boolean;
  onFinish: () => void;
  sound: boolean;
}) {
  const [time, setTime] = useState(0),
    [playing, setPlaying] = useState(true),
    [speed, setSpeed] = useState(1),
    [topDown, setTopDown] = useState(false);
  const timeRef = useRef(0),
    finished = useRef(false),
    eventRef = useRef(-1),
    audioRef = useRef<AudioContext | null>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  useEffect(() => {
    if (!playing) return;
    let raf = 0,
      last = 0;
    const tick = (now: number) => {
      if (!last) last = now;
      const dt = document.hidden
        ? 0
        : Math.min((now - last) / 1000, 0.1) * speed;
      last = now;
      timeRef.current = Math.min(sim.duration, timeRef.current + dt);
      setTime(timeRef.current);
      if (timeRef.current >= sim.duration) {
        setPlaying(false);
        if (!finished.current) {
          finished.current = true;
          finishRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, sim]);
  useEffect(() => {
    const index = sim.events.filter((e) => e.at <= time).length - 1;
    if (index === eventRef.current) return;
    eventRef.current = index;
    if (!sound) return;
    try {
      const context =
        audioRef.current || (audioRef.current = new AudioContext());
      void context.resume();
      const oscillator = context.createOscillator(),
        gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.type = "sine";
      oscillator.frequency.value =
        sim.events[index]?.tone === "danger"
          ? 160
          : sim.events[index]?.tone === "success"
            ? 660
            : 440;
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    } catch {
      /* Sound is optional. */
    }
  }, [time, sim, sound]);
  useEffect(
    () => () => {
      void audioRef.current?.close();
    },
    [],
  );
  const event = sim.events.filter((e) => e.at <= time).at(-1)!;
  const skip = () => {
    timeRef.current = sim.duration;
    setTime(sim.duration);
    setPlaying(false);
    if (!finished.current) {
      finished.current = true;
      finishRef.current();
    }
  };
  return (
    <div className="replay-board">
      <div className="replay-head">
        <span>
          <i className={playing ? "live-light" : ""} />
          {time >= sim.duration
            ? "REPLAY COMPLETE"
            : playing
              ? "GETAWAY IN PROGRESS"
              : "REPLAY PAUSED"}
        </span>
        <button className="text-button" onClick={() => setTopDown(!topDown)}>
          <Map size={13} />
          {topDown ? "View city" : "View map"}
        </button>
      </div>
      <div className="replay-scene">
        <Suspense
          fallback={<div className="city-loading">Unfolding Palmetto Bay…</div>}
        >
          <CityScene
            image={image}
            sim={sim}
            time={time}
            reducedMotion={reducedMotion}
            topDown={topDown}
          />
        </Suspense>
        <div className="replay-hud">
          <span>THE FLAMINGO JOB</span>
          <strong>
            {clockLabel(time)} <small>/ 00:48</small>
          </strong>
        </div>
      </div>
      <div className="playback-controls">
        <button
          className="icon-button"
          aria-label={playing ? "Pause replay" : "Play replay"}
          disabled={time >= sim.duration}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause size={19} /> : <Play size={19} />}
        </button>
        <input
          type="range"
          min={0}
          max={sim.duration}
          step={0.1}
          value={time}
          aria-label="Replay position"
          onChange={(e) => {
            timeRef.current = Number(e.target.value);
            setTime(timeRef.current);
            setPlaying(false);
          }}
        />
        <button
          className="playback-speed"
          onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 3 : 1))}
          aria-label={`Playback speed ${speed}x`}
        >
          <FastForward size={14} />
          {speed}×
        </button>
        <button
          className="icon-button"
          aria-label="Restart replay"
          onClick={() => {
            timeRef.current = 0;
            setTime(0);
            setPlaying(true);
            eventRef.current = -1;
          }}
        >
          <RotateCcw size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Skip to result"
          onClick={skip}
        >
          <SkipForward size={18} />
        </button>
      </div>
      <div className={`dispatch ${event.tone}`} role="status">
        <span>CREW RADIO</span>
        <strong>{event.title}</strong>
        <p>{event.detail}</p>
      </div>
    </div>
  );
}
