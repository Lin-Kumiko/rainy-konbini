// Street furniture: vending machines, bicycle, bins, poles and wires, lamp, signals, signs, guard pipes.
import { THREE, scene, toon, glow, box, cyl, add, push, pop, placeMesh, rand, canvasTex } from './core.js';
import { vendingFront, plateTex, stopSign, crossingSign, binLabel, pedTex } from './tex-street.js';

const B = 0.15;
const M = {
  pole: toon(0xa9a8a1), poleDark: toon(0x6c6e72), steel: toon(0x8b929b), dark: toon(0x2e3138), wire: toon(0x15161b),
  white: toon(0xeeeeea), orange: toon(0xf07a2a), red: toon(0xc8322d), blue: toon(0x2c63b8), mint: toon(0x7fc4b8),
  rubber: toon(0x1d1e22), concrete: toon(0xb5b2aa), yellow: toon(0xf2c230), binBody: toon(0x5b6470),
  vinyl: new THREE.MeshToonMaterial({ color: 0xe6eef4, transparent: true, opacity: 0.55, depthWrite: false }),
};

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion();
// Cylinder between two points (in current builder frame).
export function rod(mat, a, b, r, seg = 8, opts = {}) {
  _a.set(...a); _b.set(...b);
  const len = _a.distanceTo(_b);
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  _q.setFromUnitVectors(_up, _b.clone().sub(_a).normalize());
  g.applyQuaternion(_q);
  g.translate((_a.x + _b.x) / 2, (_a.y + _b.y) / 2, (_a.z + _b.z) / 2);
  add(mat, g, opts);
}

function wire(p0, p1, sag, r = 0.014) {
  const a = new THREE.Vector3(...p0), b = new THREE.Vector3(...p1);
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const p = a.clone().lerp(b, t);
    p.y -= sag * 4 * t * (1 - t);
    pts.push(p);
  }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, r, 4, false);
  add(M.wire, g, { shadow: false });
}

// ---------- Vending machines & bins ----------
function vending(z, theme) {
  const x0 = 3.68, d = 0.75, w = 1.0, h = 1.83;
  const body = theme === 'red' ? M.red : M.blue;
  box(body, d, h, w, x0 + d / 2, B, z);
  box(M.dark, d + 0.02, 0.06, w + 0.02, x0 + d / 2, B + h, z);
  box(M.white, 0.04, 0.06, w - 0.1, x0 + d + 0.01, B + 1.15, z);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.12), glow(0xffffff, 1.05, { map: vendingFront(theme) }));
  placeMesh(f, { x: x0 + d + 0.006, y: B + 0.06 + (h - 0.12) / 2, z, ry: Math.PI / 2 });
}
function recycleBin(x, z) {
  box(M.binBody, 0.5, 0.95, 0.42, x, B, z);
  box(M.dark, 0.54, 0.05, 0.46, x, B + 0.95, z);
  for (const [dz, txt, col] of [[-0.1, 'カン', '#2c63b8'], [0.1, 'ペット', '#2f8a4a']]) {
    cyl(M.rubber, 0.07, 0.07, 0.02, x + 0.25, B + 0.75, z + dz, { rz: Math.PI / 2, seg: 12 });
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.085), new THREE.MeshBasicMaterial({ map: binLabel(txt, col) }));
    placeMesh(l, { x: x + 0.252, y: B + 0.58, z: z + dz, ry: Math.PI / 2 });
  }
}
function trashStation() {
  const x0 = -3.95, w = 1.2, z = 0.12;
  box(M.binBody, w, 0.95, 0.46, x0 + w / 2, B, z);
  box(M.dark, w + 0.08, 0.06, 0.54, x0 + w / 2, B + 0.95, z);
  const items = [['もえるゴミ', '#c63d2f'], ['カン・ビン', '#2c63b8'], ['ペットボトル', '#2f8a4a']];
  items.forEach(([t, c], i) => {
    const cx = x0 + 0.2 + i * 0.4;
    box(M.rubber, 0.26, 0.12, 0.02, cx, B + 0.66, z + 0.23);
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.12), new THREE.MeshBasicMaterial({ map: binLabel(t, c) }));
    placeMesh(l, { x: cx, y: B + 0.5, z: z + 0.236 });
  });
}

// ---------- Bicycle ----------
function bicycle(x, z, ry) {
  push(x, B, z, ry);
  const R = 0.33, wy = R + 0.01;
  for (const wz of [-0.52, 0.52]) {
    add(M.rubber, new THREE.TorusGeometry(R, 0.028, 6, 28), { y: wy, z: wz, ry: Math.PI / 2, rx: 0.06 });
    add(M.steel, new THREE.TorusGeometry(R * 0.82, 0.006, 4, 24), { y: wy, z: wz, ry: Math.PI / 2 });
    add(M.steel, new THREE.CylinderGeometry(0.03, 0.03, 0.07, 8), { y: wy, z: wz, rz: Math.PI / 2 });
  }
  const f = M.mint;
  rod(f, [0, wy, -0.52], [0, 0.62, -0.1], 0.022);        // chain stay to seat
  rod(f, [0, wy, -0.52], [0, 0.32, 0.0], 0.02);
  rod(f, [0, 0.32, 0.0], [0, 0.62, -0.1], 0.024);         // seat tube
  rod(f, [0, 0.32, 0.0], [0, 0.78, 0.42], 0.026);         // down tube (step-through)
  rod(f, [0, 0.78, 0.42], [0, wy, 0.52], 0.02);           // fork
  rod(M.steel, [0, 0.62, -0.1], [0, 0.82, -0.14], 0.014); // seat post
  add(M.dark, new THREE.BoxGeometry(0.16, 0.06, 0.26), { y: 0.85, z: -0.15 });
  rod(M.steel, [0, 0.78, 0.42], [0, 1.0, 0.38], 0.016);
  rod(M.steel, [-0.26, 1.02, 0.34], [0.26, 1.02, 0.34], 0.014);
  for (const s of [-1, 1]) add(M.rubber, new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6), { x: s * 0.29, y: 1.02, z: 0.34, rz: Math.PI / 2 });
  // basket
  add(M.steel, new THREE.BoxGeometry(0.34, 0.24, 0.26), { y: 0.88, z: 0.66 });
  add(M.dark, new THREE.BoxGeometry(0.3, 0.02, 0.22), { y: 0.77, z: 0.66 });
  // fenders + chain guard + rear carrier + stand
  add(M.white, new THREE.TorusGeometry(R + 0.04, 0.02, 4, 16, Math.PI * 0.75), { y: wy, z: 0.52, ry: Math.PI / 2, rx: -Math.PI * 0.12 });
  add(M.white, new THREE.TorusGeometry(R + 0.04, 0.02, 4, 16, Math.PI * 0.75), { y: wy, z: -0.52, ry: Math.PI / 2, rx: Math.PI * 0.38 });
  add(M.mint, new THREE.BoxGeometry(0.04, 0.09, 0.5), { x: 0.05, y: 0.36, z: -0.26 });
  add(M.steel, new THREE.BoxGeometry(0.2, 0.02, 0.36), { y: 0.72, z: -0.52 });
  rod(M.steel, [0.08, 0.36, -0.42], [0.18, 0.0, -0.46], 0.012);
  // a vinyl umbrella hooked on the handlebar
  add(M.vinyl, new THREE.ConeGeometry(0.07, 0.86, 8), { x: 0.27, y: 0.55, z: 0.36, rx: Math.PI, rz: 0.08, shadow: false });
  pop();
}

function umbrellaStand(x, z) {
  box(M.steel, 0.56, 0.05, 0.3, x, B + 0.5, z);
  box(M.steel, 0.56, 0.04, 0.3, x, B + 0.05, z);
  for (const dx of [-0.26, 0.26]) box(M.steel, 0.03, 0.55, 0.3, x + dx, B, z);
  const cols = [M.vinyl, M.vinyl, toon(0x24418f), M.vinyl, toon(0xd8473a)];
  cols.forEach((m, i) => {
    const ux = x - 0.2 + i * 0.1;
    add(m, new THREE.ConeGeometry(0.055, 0.8, 8), { x: ux, y: B + 0.48, z: z + (i % 2 ? 0.05 : -0.05), rx: Math.PI + (i - 2) * 0.05, shadow: m !== M.vinyl });
    add(M.dark, new THREE.TorusGeometry(0.04, 0.008, 4, 10, Math.PI), { x: ux, y: B + 0.9, z: z + (i % 2 ? 0.05 : -0.05) });
  });
}

function wheelStop(x) {
  box(M.concrete, 1.4, 0.12, 0.16, x, B, 1.35);
  for (const dx of [-0.45, 0, 0.45]) box(M.yellow, 0.18, 0.121, 0.161, x + dx, B, 1.35);
}

// ---------- Poles, wires, lamp ----------
function utilityPole(x, z, h, facing = 0) {
  cyl(M.pole, 0.12, 0.17, h, x, B, z, { seg: 14 });
  push(x, B, z, facing);
  box(M.steel, 1.9, 0.1, 0.1, 0, h - 0.5, 0);
  box(M.steel, 1.5, 0.08, 0.08, 0, h - 1.1, 0);
  for (const dx of [-0.8, 0, 0.8]) cyl(M.white, 0.05, 0.06, 0.18, dx, h - 0.4, 0, { seg: 8 });
  for (const dx of [-0.6, 0.6]) cyl(M.white, 0.04, 0.05, 0.14, dx, h - 1.02, 0, { seg: 8 });
  for (let y = 1.8; y < h - 1.5; y += 0.45) add(M.poleDark, new THREE.BoxGeometry(0.34, 0.03, 0.03), { y, ry: y * 1.7 });
  box(M.poleDark, 0.5, 0.06, 0.1, 0, 4.2, 0);
  pop();
  return [x, B + h, z];
}

function streetLamp(px, pz) {
  // slim lamp post at the corner, arm reaching over the junction
  const y = B + 5.7;
  cyl(M.steel, 0.06, 0.085, y + 0.1 - B, px, B, pz, { seg: 10 });
  cyl(M.steel, 0.11, 0.11, 0.5, px, B, pz, { seg: 10 });
  rod(M.steel, [px, y - 0.4, pz], [px + 1.0, y + 0.05, pz + 0.85], 0.04);
  rod(M.steel, [px + 1.0, y + 0.05, pz + 0.85], [px + 1.45, y, pz + 1.25], 0.035);
  push(px + 1.5, y - 0.05, pz + 1.3, -0.72);
  box(M.dark, 0.62, 0.1, 0.26, 0, 0, 0);
  box(glow(0xe9f1ff, 9.0), 0.5, 0.03, 0.18, 0, -0.02, 0, { shadow: false });
  pop();
  const s = new THREE.SpotLight(0xdbe5ff, 60, 15, 0.9, 0.55, 2);
  s.position.set(px + 1.5, y - 0.15, pz + 1.3);
  s.target.position.set(px + 2.0, 0, pz + 1.8);
  s.castShadow = true;
  s.shadow.mapSize.set(1024, 1024);
  s.shadow.bias = -0.0006;
  s.shadow.normalBias = 0.02;
  scene.add(s, s.target);
}

// ---------- Guard pipes ----------
function guardLine(pts, closed = false) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], 0, p[1])), closed, 'centripetal', 0.0);
  const len = curve.getLength();
  for (const h of [0.45, 0.8]) {
    const g = new THREE.TubeGeometry(curve, Math.max(4, Math.round(len * 3)), 0.032, 6, false);
    g.translate(0, B + h, 0);
    add(M.white, g);
  }
  const n = Math.max(2, Math.round(len / 1.8) + 1);
  for (let i = 0; i < n; i++) {
    const p = curve.getPointAt(i / (n - 1));
    cyl(M.white, 0.04, 0.04, 0.82, p.x, B, p.z, { seg: 8 });
    cyl(M.white, 0.05, 0.05, 0.02, p.x, B + 0.82, p.z, { seg: 8 });
  }
}

// ---------- Signals ----------
const signal = { lamps: [], ped: [], light: null, t: 0 };
const SIG_COL = [0x1fe0b0, 0xffb11f, 0xff3b2f];
function trafficSignal() {
  const px = 11.62, pz = -7.3;
  cyl(M.poleDark, 0.09, 0.11, 5.2, px, B, pz, { seg: 12 });
  rod(M.poleDark, [px, B + 4.9, pz], [8.5, B + 4.9, pz], 0.05);
  push(9.35, B + 4.62, pz);
  box(M.dark, 1.3, 0.38, 0.22, 0, -0.19, 0);
  box(M.dark, 1.42, 0.5, 0.03, 0, -0.25, -0.12);
  [-0.4, 0, 0.4].forEach((dx, i) => {
    const off = new THREE.Color(SIG_COL[i]).multiplyScalar(0.06);
    const mat = new THREE.MeshBasicMaterial({ color: off });
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), mat);
    placeMesh(lamp, { x: dx, y: 0, z: 0.115 });
    signal.lamps.push({ mat, on: new THREE.Color(SIG_COL[i]).multiplyScalar(3.2), off });
    add(M.dark, new THREE.CylinderGeometry(0.16, 0.16, 0.2, 14, 1, true, -Math.PI / 2, Math.PI), { x: dx, y: 0.0, z: 0.2, rx: -Math.PI / 2 });
  });
  pop();
  signal.light = new THREE.PointLight(SIG_COL[0], 2.2, 8, 2);
  signal.light.position.set(9.35, B + 4.1, pz + 0.6);
  scene.add(signal.light);
  // Pedestrian heads at both ends of the crossing
  for (const [x, z, ry] of [[11.62, -10.95, -Math.PI / 2], [5.8, -11.0, Math.PI / 2]]) {
    cyl(M.poleDark, 0.06, 0.07, 2.9, x, B, z, { seg: 10 });
    push(x, B + 2.2, z, ry);
    box(M.dark, 0.36, 0.72, 0.2, 0, 0, 0.12);
    const red = new THREE.MeshBasicMaterial({ map: pedTex('stop'), color: 0x111111 });
    const grn = new THREE.MeshBasicMaterial({ map: pedTex('walk'), color: 0x111111 });
    const r = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), red);
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), grn);
    placeMesh(r, { x: 0, y: 0.52, z: 0.225 });
    placeMesh(gm, { x: 0, y: 0.19, z: 0.225 });
    signal.ped.push({ red, grn });
    pop();
  }
}

export const signalColor = () => signal.light.color;
const CYCLE = [9, 3, 10]; // green, yellow, red seconds
export function updateStreet(t) {
  const total = CYCLE[0] + CYCLE[1] + CYCLE[2];
  const k = (t + 2) % total;
  const phase = k < CYCLE[0] ? 0 : k < CYCLE[0] + CYCLE[1] ? 1 : 2;
  signal.lamps.forEach((l, i) => l.mat.color.copy(i === phase ? l.on : l.off));
  signal.light.color.setHex(SIG_COL[phase]);
  signal.light.intensity = 2.2;
  // Pedestrians walk during the vehicle red; the walk light blinks for the last 3 s.
  const redT = k - CYCLE[0] - CYCLE[1];
  let walk = phase === 2 && redT > 0.8;
  const blink = walk && redT > CYCLE[2] - 3.5;
  for (const p of signal.ped) {
    const greenOn = walk && (!blink || Math.floor(t * 4) % 2 === 0);
    p.grn.color.setRGB(greenOn ? 0.2 : 0.035, greenOn ? 2.6 : 0.06, greenOn ? 1.9 : 0.05);
    p.red.color.setRGB(walk ? 0.08 : 2.8, walk ? 0.02 : 0.25, walk ? 0.02 : 0.2);
  }
}

function signPost(x, z, tex, w, h, ry, y = 2.3, alpha = false) {
  cyl(M.steel, 0.035, 0.035, y + h * 0.5, x, B, z, { seg: 8 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshToonMaterial({ map: tex, transparent: alpha, alphaTest: alpha ? 0.5 : 0, side: THREE.DoubleSide }));
  m.castShadow = true;
  placeMesh(m, { x, y: B + y, z, ry });
  let bg = new THREE.PlaneGeometry(w * 0.98, h * 0.98);
  if (alpha) {
    const s = new THREE.Shape([new THREE.Vector2(-w / 2 + 0.02, h / 2 - 0.06), new THREE.Vector2(w / 2 - 0.02, h / 2 - 0.06), new THREE.Vector2(0, -h / 2 + 0.04)]);
    bg = new THREE.ShapeGeometry(s);
  }
  const back = new THREE.Mesh(bg, M.steel);
  placeMesh(back, { x: x - Math.sin(ry) * 0.012, y: B + y, z: z - Math.cos(ry) * 0.012, ry: ry + Math.PI });
}

function curveMirror(x, z) {
  cyl(M.orange, 0.05, 0.05, 2.9, x, B, z, { seg: 10 });
  const mirrorTex = canvasTex(256, 256, (g, w) => {
    const gr = g.createRadialGradient(w * 0.4, w * 0.35, 10, w / 2, w / 2, w / 2);
    gr.addColorStop(0, '#8fa3c8'); gr.addColorStop(0.6, '#3d4a6c'); gr.addColorStop(1, '#1a2036');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.fillStyle = 'rgba(255,220,160,0.9)'; g.beginPath(); g.ellipse(w * 0.7, w * 0.62, 18, 8, 0.3, 0, 7); g.fill();
    g.fillStyle = 'rgba(160,240,220,0.8)'; g.beginPath(); g.ellipse(w * 0.3, w * 0.66, 10, 5, -0.2, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, w / 2, w * 0.36, 3.6, 4.4); g.stroke();
  });
  for (const s of [-1, 1]) {
    push(x + s * 0.32, B + 2.75, z, Math.PI + s * 0.45);
    add(M.poleDark, new THREE.CylinderGeometry(0.43, 0.43, 0.08, 24), { rx: Math.PI / 2 });
    add(M.orange, new THREE.TorusGeometry(0.42, 0.03, 6, 24), { z: 0.04 });
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.38, 24), new THREE.MeshBasicMaterial({ map: mirrorTex, color: 0xcccccc }));
    placeMesh(face, { z: 0.045 });
    pop();
  }
  box(M.orange, 0.8, 0.06, 0.06, x, B + 2.72, z);
}

export function buildStreet() {
  vending(-6.3, 'red');
  vending(-5.25, 'blue');
  recycleBin(3.95, -4.45);
  const vl = new THREE.PointLight(0xd6e6ff, 2.4, 4.8, 2);
  vl.position.set(5.0, 1.1, -5.75);
  scene.add(vl);
  trashStation();
  umbrellaStand(3.0, 0.25);
  bicycle(4.4, -2.3, 0.0);
  wheelStop(-2.75); wheelStop(-0.45);

  // Poles frame the back of the lot; their wires sweep over the roof.
  const Bp = utilityPole(-9.4, 5.8, 8.2, 0);
  const Cp = utilityPole(5.75, -8.2, 8.2, Math.PI / 2);
  const Ep = utilityPole(-11.2, -11.0, 7.8, Math.PI / 4);
  streetLamp(6.05, 4.25);
  const top = (p, dx, dz, dy) => [p[0] + dx, p[1] + dy, p[2] + dz];
  const c45 = Math.SQRT1_2 * 0.8;
  for (const k of [-1, 0, 1]) {
    wire(top(Bp, k * 0.8, 0, -0.25), top(Cp, 0, -k * 0.8, -0.25), 1.0 + k * 0.06);
    wire(top(Cp, 0, -k * 0.8, -0.25), top(Ep, k * c45, -k * c45, -0.25), 0.9 + k * 0.05);
    wire(top(Ep, k * c45, -k * c45, -0.25), top(Bp, k * 0.8, 0, -0.25), 0.8 + k * 0.05);
  }
  wire(top(Bp, 0, 0, -1.6), top(Cp, 0, 0, -1.6), 1.2, 0.03);
  wire(top(Ep, 0, 0, -1.6), top(Bp, 0, 0, -1.6), 1.0, 0.03);
  wire(top(Cp, 0, -0.4, -1.1), [3.55, 3.85, -6.9], 0.3, 0.012);
  wire(top(Bp, 0.5, 0, -1.1), [-6.65, 6.1, 2.6], 0.3, 0.012);
  const al = new THREE.PointLight(0xffc98a, 1.8, 5, 2);
  al.position.set(-6.05, 2.55, -1.2);
  scene.add(al);
  // transformer + address plate on pole B, hydrant plate on pole C
  cyl(M.poleDark, 0.24, 0.24, 0.75, -9.4, 6.0, 5.48, { seg: 14 });
  const addr = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.5), new THREE.MeshToonMaterial({ map: plateTex(['雨宿町', '二丁目'], '#1f4f9a', '#ffffff', 128, 400, 46) }));
  placeMesh(addr, { x: -9.4, y: 2.3, z: 5.8 + 0.165 });
  const hyd = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.55), new THREE.MeshToonMaterial({ map: plateTex(['消火栓'], '#d0262c', '#ffffff', 128, 360, 56) }));
  placeMesh(hyd, { x: 5.75 + 0.165, y: 2.4, z: -8.2, ry: Math.PI / 2 });

  streetLampAlley();
  trafficSignal();
  signPost(11.62, 4.3, stopSign(), 0.8, 0.8, Math.PI, 2.2, true);
  signPost(1.15, 5.35, crossingSign(), 0.6, 0.6, Math.PI / 2, 2.4);
  curveMirror(8.9, 11.62);

  // Guard pipes
  guardLine([[-11.6, 11.42], [0.9, 11.42]]);
  guardLine([[4.7, 11.42], [11.6, 11.42]]);
  guardLine([[11.42, -6.9], [11.42, 3.4]]);
  const arc = [];
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; arc.push([5 + Math.cos(a) * 1.32, 5 + Math.sin(a) * 1.32]); }
  guardLine([[6.32, 2.4], ...arc, [4.4, 6.32]]);
  guardLine([[6.32, -6.9], [6.32, -1.0]]);
}

function streetLampAlley() {
  // Bare bulb under a tin shade on the izakaya wall, lighting the alley.
  push(-6.5, 2.75, -1.2, 0);
  rod(M.dark, [0, 0, 0], [0.45, 0, 0], 0.015);
  add(M.dark, new THREE.ConeGeometry(0.16, 0.12, 12, 1, true), { x: 0.45, y: -0.04 });
  add(glow(0xffd59a, 4.0), new THREE.SphereGeometry(0.045, 10, 8), { x: 0.45, y: -0.09, shadow: false });
  pop();
}
