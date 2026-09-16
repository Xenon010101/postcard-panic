import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { WIDTH, HEIGHT, nodes } from "../game/map";
import { sampleSimulation, type Simulation } from "../game/simulation";

export default function CityScene({
  image,
  sim,
  time,
  reducedMotion,
  topDown = false,
}: {
  image: string;
  sim: Simulation;
  time: number;
  reducedMotion: boolean;
  topDown?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    timeRef = useRef(time);
  timeRef.current = time;
  const [fallback, setFallback] = useState(topDown);
  useEffect(() => setFallback(topDown), [topDown]);
  useEffect(() => {
    if (fallback) return;
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "low-power",
      });
    } catch {
      setFallback(true);
      return;
    }
    let alive = true,
      frame = 0;
    const started = performance.now();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor("#d9e1cf");
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Animated miniature Palmetto Bay. A pickup carrying a pink flamingo follows your route.",
    );
    renderer.domElement.setAttribute("role", "img");
    const lost = (e: Event) => {
      e.preventDefault();
      setFallback(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#d9e1cf", 1300, 2400);
    const camera = new THREE.OrthographicCamera(-620, 620, 450, -450, 1, 3000);
    scene.add(new THREE.HemisphereLight("#fff8df", "#467b77", 1.6));
    const sun = new THREE.DirectionalLight("#ffe6af", 2);
    sun.position.set(-450, 850, 500);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -700,
      right: 700,
      top: 600,
      bottom: -600,
      near: 1,
      far: 1800,
    });
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const material = (color: string) =>
      new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 });
    const mesh = (
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      parent: THREE.Object3D = scene,
    ) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const box = (
      w: number,
      h: number,
      d: number,
      color: string,
      x: number,
      y: number,
      z: number,
      parent?: THREE.Object3D,
    ) => mesh(new THREE.BoxGeometry(w, h, d), material(color), x, y, z, parent);
    box(WIDTH + 18, 18, HEIGHT + 18, "#e2d9bf", 0, -14, 0);
    const texture = new THREE.TextureLoader().load(image, () => {
      if (!alive) texture.dispose();
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const ground = mesh(
      new THREE.PlaneGeometry(WIDTH, HEIGHT),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }),
      0,
      -4,
      0,
    );
    ground.rotation.x = -Math.PI / 2;
    ground.castShadow = false;
    const town = new THREE.Group();
    scene.add(town);
    const colors = [
      "#e4a58f",
      "#d4d5af",
      "#ecc770",
      "#e9b9b5",
      "#94b4a7",
      "#ede1bd",
    ];
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 4; col++) {
        if (col === 2) continue;
        const cx = 126 + col * 176 + 88 - WIDTH / 2,
          cz = 188 + row * 136 + 68 - HEIGHT / 2;
        const h = 28 + ((row * 3 + col * 7) % 5) * 12;
        box(
          103,
          h,
          63,
          colors[(col + row * 2) % colors.length],
          cx,
          h / 2,
          cz,
          town,
        );
        box(108, 5, 68, "#f3e9cc", cx, h + 2.5, cz, town);
        box(76, 5, 40, "#d2c7b2", cx, h + 7, cz, town);
        for (let y = 13; y < h - 5; y += 15)
          for (let x = -36; x <= 36; x += 18) {
            box(9, 9, 1, "#376b6a", cx + x, y, cz + 32, town);
            box(9, 9, 1, "#376b6a", cx + x, y, cz - 32, town);
          }
        box(20, 14, 2, "#2d5856", cx, 7, cz + 32, town);
        if ((row + col) % 2 === 0) {
          const awning = box(72, 3, 15, "#d45d49", cx, 17, cz + 39, town);
          awning.rotation.x = 0.1;
        }
      }
    function palm(x: number, z: number, height: number) {
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      town.add(group);
      mesh(
        new THREE.CylinderGeometry(2, 3, height, 5),
        material("#a88754"),
        0,
        height / 2,
        0,
        group,
      );
      for (let i = 0; i < 7; i++) {
        const leaf = mesh(
          new THREE.ConeGeometry(6, 33, 3),
          material(i % 2 ? "#467957" : "#608b58"),
          Math.sin(i) * 10,
          height + 2,
          Math.cos(i) * 10,
          group,
        );
        leaf.rotation.set(Math.sin(i) * 1.3, i, Math.cos(i) * 1.3);
      }
    }
    for (let i = 0; i < 7; i++) palm(374, -180 + i * 59, 35 + (i % 3) * 6);
    for (let i = 0; i < 5; i++) palm(-428, -115 + i * 88, 32 + (i % 2) * 8);
    palm(-198, -160, 45);
    palm(-45, 205, 35);
    const bridge = new THREE.Group();
    bridge.position.set(566 - WIDTH / 2, 0, 324 - HEIGHT / 2);
    scene.add(bridge);
    box(176, 5, 30, "#ccbaa0", 0, 1, 0, bridge);
    box(176, 8, 2, "#f1e2bb", 0, 7, 16, bridge);
    box(176, 8, 2, "#f1e2bb", 0, 7, -16, bridge);
    const boat = new THREE.Group();
    boat.position.set(830 - WIDTH / 2, 0, 188 - HEIGHT / 2 - 34);
    scene.add(boat);
    const hull = mesh(
      new THREE.ConeGeometry(13, 40, 4),
      material("#f6efcf"),
      0,
      6,
      0,
      boat,
    );
    hull.rotation.z = Math.PI / 2;
    box(15, 11, 18, "#e4ba77", 0, 12, 0, boat);
    box(10, 7, 12, "#316b6e", 2, 15, 0, boat);
    function vehicle(police = false) {
      const group = new THREE.Group();
      box(18, 8, 34, police ? "#eef0e5" : "#f1dfb4", 0, 10, 0, group);
      box(17, 11, 13, police ? "#223e45" : "#f6e9c9", 0, 19, 5, group);
      box(15, 6, 1, "#548c89", 0, 20, 12, group);
      box(1, 6, 10, "#548c89", 9, 20, 6, group);
      box(1, 6, 10, "#548c89", -9, 20, 6, group);
      for (const x of [-10, 10])
        for (const z of [-10, 11]) {
          const wheel = mesh(
            new THREE.CylinderGeometry(4.5, 4.5, 4, 10),
            material("#223b3b"),
            x,
            5,
            z,
            group,
          );
          wheel.rotation.z = Math.PI / 2;
        }
      if (police) {
        box(6, 3, 4, "#d94f4d", -4, 26, 4, group);
        box(6, 3, 4, "#5c94c5", 4, 26, 4, group);
      } else {
        const pink = material("#f283a2"),
          dark = material("#273935");
        mesh(
          new THREE.SphereGeometry(10, 12, 8),
          pink,
          0,
          26,
          -8,
          group,
        ).scale.set(0.8, 0.85, 1.3);
        const neckCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(1, 30, -5),
          new THREE.Vector3(1, 42, -9),
          new THREE.Vector3(1, 50, -3),
          new THREE.Vector3(1, 46, 4),
        ]);
        mesh(
          new THREE.TubeGeometry(neckCurve, 18, 3, 6, false),
          pink,
          0,
          0,
          0,
          group,
        );
        mesh(new THREE.SphereGeometry(4.4, 10, 7), pink, 1, 46, 4, group);
        const beak = mesh(
          new THREE.ConeGeometry(2.6, 7, 7),
          dark,
          1,
          44,
          9,
          group,
        );
        beak.rotation.x = -Math.PI / 2;
        mesh(new THREE.SphereGeometry(0.7, 6, 4), dark, 4.5, 47, 5, group);
        for (const x of [-4, 4]) box(1, 13, 1, "#d4617d", x, 16, -8, group);
      }
      scene.add(group);
      return group;
    }
    const truck = vehicle(),
      cop = vehicle(true);
    cop.position.set(744 - WIDTH / 2, 0, 324 - HEIGHT / 2);
    cop.rotation.y = Math.PI / 2;
    const resize = () => {
      if (!el.clientWidth || !el.clientHeight) return;
      const a = el.clientWidth / el.clientHeight;
      camera.left = (-530 * a) / 1.5;
      camera.right = (530 * a) / 1.5;
      camera.top = 355;
      camera.bottom = -355;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    function draw() {
      if (!alive) return;
      frame = requestAnimationFrame(draw);
      const reveal = reducedMotion
          ? 1
          : Math.min(1, (performance.now() - started) / 1900),
        ease = 1 - (1 - reveal) ** 3;
      town.scale.y = Math.max(0.001, ease);
      camera.position.set(140 * ease, 1100 - 340 * ease, 35 + 590 * ease);
      camera.lookAt(0, 0, 0);
      const t = timeRef.current,
        p = sampleSimulation(sim, t);
      truck.position.set(p.x - WIDTH / 2, 0, p.y - HEIGHT / 2);
      if (!p.waiting) truck.rotation.y = p.angle;
      bridge.rotation.z = t >= 14 && t < 24 ? -0.36 : 0;
      cop.position.x =
        744 +
        (t >= 18 && t < 30 ? Math.sin((t - 18) * 0.7) * 14 : 120) -
        WIDTH / 2;
      renderer.render(scene, camera);
    }
    draw();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const mats = Array.isArray(object.material)
            ? object.material
            : [object.material];
          mats.forEach((m) => m.dispose());
        }
      });
      texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [image, sim, reducedMotion, fallback]);
  return (
    <div className="city-host" ref={host}>
      {fallback && <TopDown image={image} sim={sim} time={time} />}
    </div>
  );
}
function TopDown({
  image,
  sim,
  time,
}: {
  image: string;
  sim: Simulation;
  time: number;
}) {
  const p = sampleSimulation(sim, time);
  return (
    <div className="topdown-scene">
      <img src={image} alt="Top-down replay of your marked postcard" />
      <div
        className="truck-marker"
        style={{
          left: `${(p.x / WIDTH) * 100}%`,
          top: `${(p.y / HEIGHT) * 100}%`,
          transform: `translate(-50%,-50%) rotate(${(-p.angle * 180) / Math.PI}deg)`,
        }}
        aria-label="Your getaway truck"
      >
        ▰
      </div>
      <span className="fallback-label">TOP-DOWN REPLAY</span>
    </div>
  );
}
