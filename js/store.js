// Convenience store shell: walls, glazing, automatic door, canopy, signage, roof plant.
import { THREE, scene, toon, glow, interior, box, cyl, add, placeMesh, LAYER_FX, rand } from './core.js';
import { glassPane } from './glass.js';
import { signFront, bladeSign, standSign, poster, smallLabel, BRAND } from './tex-store.js';

export const STORE = { x0: -4, x1: 3.6, z0: -7, z1: -0.2, floor: 0.2, ceil: 2.95, T: 0.18 };
const { x0, x1, z0, z1, T } = STORE;
const BASE = 0.15;

const M = {
  wall: toon(0xd8d2c4), wallLow: toon(0x8b7f73), trim: toon(0x3a3e48), alu: toon(0x9aa1aa), aluDark: toon(0x60666f),
  roof: toon(0x6b6f79), roofEdge: toon(0x50545d), canopy: toon(0xe9e6df), teal: toon(0x16a99b), orange: toon(0xf2963a),
  steel: toon(0x7c838c), unit: toon(0xc9cbc8), grille: toon(0x2e3138), pipe: toon(0xd8cfbc), mat: toon(0x2c3036),
};
const IN = { wall: interior(0xf2ede3), trim: interior(0xb9b2a6) };

const flickers = [];
function makeFlicker(mat, base, light, lightBase, { every = [7, 15], dur = [0.35, 1.0] } = {}) {
  const f = { mat, base: base.clone(), light, lightBase, next: 3 + rand() * every[1], end: 0, every, dur, v: 1, tick: 0 };
  flickers.push(f);
  return f;
}

function windowRun(axis, a0, a1, posts, rainAmt, outer) {
  // axis 'x': front wall (normal +z); axis 'z': right wall (normal +x)
  const sill = 0.32, head = 2.6, fw = 0.08;
  const front = axis === 'x';
  // kick plate + header panel
  if (front) {
    box(M.trim, a1 - a0, sill - BASE, T, (a0 + a1) / 2, BASE, outer - T / 2);
    box(M.wall, a1 - a0, STORE.ceil + 0.05 - head, T, (a0 + a1) / 2, head, outer - T / 2);
  } else {
    box(M.trim, T, sill - BASE, a1 - a0, outer - T / 2, BASE, (a0 + a1) / 2);
    box(M.wall, T, STORE.ceil + 0.05 - head, a1 - a0, outer - T / 2, head, (a0 + a1) / 2);
  }
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    if (front) box(M.alu, fw, head - sill, 0.12, p, sill, outer - 0.07);
    else box(M.alu, 0.12, head - sill, fw, outer - 0.07, sill, p);
    if (i < posts.length - 1) {
      const q = posts[i + 1], w = q - p - fw, c = (p + q) / 2;
      if (front) glassPane(w, head - sill, c, sill, outer - 0.09, 0, { rain: rainAmt });
      else glassPane(w, head - sill, outer - 0.09, sill, c, Math.PI / 2, { rain: rainAmt });
    }
  }
  if (front) { box(M.alu, a1 - a0, 0.06, 0.14, (a0 + a1) / 2, sill - 0.03, outer - 0.07); box(M.alu, a1 - a0, 0.06, 0.14, (a0 + a1) / 2, head - 0.03, outer - 0.07); }
  else { box(M.alu, 0.14, 0.06, a1 - a0, outer - 0.07, sill - 0.03, (a0 + a1) / 2); box(M.alu, 0.14, 0.06, a1 - a0, outer - 0.07, head - 0.03, (a0 + a1) / 2); }
}

function posterPlane(kind, w, x, y, z, ry = 0) {
  const tex = poster(kind);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 4 / 3), interior(0xffffff, { map: tex, glow: 0.25 }));
  m.castShadow = true;
  placeMesh(m, { x, y: y + w * 2 / 3, z, ry });
}

const door = { L: null, R: null, state: 'closed', t: 0, wait: 6, open: 0 };

function buildDoor() {
  const d0 = 0.95, d1 = 2.75, h = 2.3, pw = 0.94;
  // operator header box
  box(M.alu, d1 - d0 + 0.1, 0.3, 0.26, (d0 + d1) / 2, 2.3, z1 - 0.02);
  const lab = smallLabel('自動ドア', '#24418f', '#ffffff', 256, 64);
  const mk = (cx) => {
    const g = new THREE.Group();
    const fr = 0.05;
    const parts = [[pw, fr, 0, h - fr / 2], [pw, 0.12, 0, 0.06], [fr, h, -pw / 2 + fr / 2, h / 2], [fr, h, pw / 2 - fr / 2, h / 2]];
    for (const [w, hh, x, y] of parts) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, 0.05), M.aluDark);
      m.position.set(x, y, 0);
      g.add(m);
    }
    const gp = glassPane(pw - fr * 2, h - 0.17, 0, 0.12, 0.0, 0, { rain: 0.35, parent: g });
    gp.position.set(0, 0.12 + (h - 0.17) / 2, 0.005);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.07), new THREE.MeshBasicMaterial({ map: lab }));
    s.position.set(cx < 1.85 ? 0.3 : -0.3, 1.15, 0.03);
    g.add(s);
    g.position.set(cx, STORE.floor, z1 - 0.06);
    scene.add(g);
    return g;
  };
  door.L = mk(d0 + pw / 2 - 0.02);
  door.R = mk(d1 - pw / 2 + 0.02);
  door.L.userData.closed = door.L.position.x;
  door.R.userData.closed = door.R.position.x;
  // floor rail and mat
  box(M.aluDark, d1 - d0, 0.03, 0.1, (d0 + d1) / 2, STORE.floor - 0.03, z1 - 0.06);
  box(M.mat, 1.7, 0.025, 0.95, (d0 + d1) / 2, BASE, z1 + 0.5);
  box(M.teal, 1.7, 0.026, 0.08, (d0 + d1) / 2, BASE, z1 + 0.06);
  box(M.teal, 1.7, 0.026, 0.08, (d0 + d1) / 2, BASE, z1 + 0.93);
}

function buildSigns() {
  // Fascia band (internally lit) on front and right faces.
  const front = signFront('front'), side = signFront('side');
  const fMat = glow(0xffffff, 1.12, { map: front });
  const sMat = glow(0xffffff, 1.12, { map: side });
  const fH = 0.74, fy = 3.12;
  const fm = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 0.12, fH), fMat);
  placeMesh(fm, { x: (x0 + x1) / 2, y: fy + fH / 2, z: z1 + 0.07 });
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0 + 0.12, fH), sMat);
  placeMesh(sm, { x: x1 + 0.07, y: fy + fH / 2, z: (z0 + z1) / 2, ry: Math.PI / 2 });
  box(M.trim, x1 - x0 + 0.16, 0.07, 0.2, (x0 + x1) / 2, fy + fH, z1 - 0.02);
  box(M.trim, 0.2, 0.07, z1 - z0 + 0.16, x1 - 0.02, fy + fH, (z0 + z1) / 2);
  box(M.trim, x1 - x0 + 0.16, 0.05, 0.2, (x0 + x1) / 2, fy - 0.03, z1 - 0.02);
  box(M.trim, 0.2, 0.05, z1 - z0 + 0.16, x1 - 0.02, fy - 0.03, (z0 + z1) / 2);
  const signLight = new THREE.PointLight(0xf4f0e6, 5, 7, 2);
  signLight.position.set(1.0, 3.5, 1.2);
  scene.add(signLight);

  // Blade sign sticking out of the right wall near the corner.
  const bMat = glow(0xffffff, 1.5, { map: bladeSign() });
  const bw = 0.55, bh = 1.6, by = 1.3, bz = -0.75;
  box(M.trim, bw + 0.06, bh + 0.06, 0.16, x1 + 0.12 + bw / 2, by - 0.03, bz);
  for (const s of [1, -1]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), bMat);
    placeMesh(p, { x: x1 + 0.12 + bw / 2, y: by + bh / 2, z: bz + s * 0.085, ry: s > 0 ? 0 : Math.PI });
  }
  box(M.steel, 0.14, 0.05, 0.05, x1 + 0.06, by + bh - 0.2, bz);
  box(M.steel, 0.14, 0.05, 0.05, x1 + 0.06, by + 0.2, bz);
  const bLight = new THREE.PointLight(0x9fe8dc, 2.2, 4.5, 2);
  bLight.position.set(x1 + 0.6, by + 0.8, bz + 0.5);
  scene.add(bLight);
  makeFlicker(bMat, bMat.color, bLight, bLight.intensity, { every: [6, 13], dur: [0.4, 1.1] });

  // Standing lightbox by the entrance.
  const sTex = standSign();
  const stMat = glow(0xffffff, 1.25, { map: sTex });
  const sx = 3.25, sz = 1.05;
  box(M.aluDark, 0.62, 0.9, 0.14, sx, BASE + 0.12, sz);
  for (const s of [1, -1]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.84), stMat);
    placeMesh(p, { x: sx, y: BASE + 0.12 + 0.45, z: sz + s * 0.075, ry: s > 0 ? 0 : Math.PI });
  }
  box(M.aluDark, 0.08, 0.12, 0.4, sx - 0.24, BASE, sz);
  box(M.aluDark, 0.08, 0.12, 0.4, sx + 0.24, BASE, sz);
  const stLight = new THREE.PointLight(0xffc29a, 1.2, 2.6, 2);
  stLight.position.set(sx, 0.7, sz + 0.5);
  scene.add(stLight);
  makeFlicker(stMat, stMat.color, stLight, stLight.intensity, { every: [9, 20], dur: [0.25, 0.7] });
}

function buildCanopy() {
  const cz0 = z1, cz1 = 1.25, cy = 2.95;
  box(M.canopy, x1 - x0 + 0.3, 0.17, cz1 - cz0, (x0 + x1) / 2 + 0.05, cy, (cz0 + cz1) / 2);
  box(M.teal, x1 - x0 + 0.32, 0.12, 0.05, (x0 + x1) / 2 + 0.05, cy + 0.04, cz1 + 0.02);
  box(M.orange, x1 - x0 + 0.32, 0.035, 0.052, (x0 + x1) / 2 + 0.05, cy + 0.01, cz1 + 0.02);
  // gutter
  add(M.aluDark, new THREE.CylinderGeometry(0.05, 0.05, x1 - x0 + 0.3, 8, 1, true, 0, Math.PI), { x: (x0 + x1) / 2 + 0.05, y: cy + 0.06, z: cz1 + 0.08, rz: Math.PI / 2, rx: Math.PI });
  // tie rods to the fascia
  for (const x of [-3.3, -0.4, 2.5]) add(M.steel, new THREE.CylinderGeometry(0.015, 0.015, 1.44, 6), { x, y: 3.435, z: 0.5, rx: -1.118 });
  // downlights
  const dl = glow(0xfff1d6, 2.6);
  for (const x of [-3.2, -1.6, 0.0, 1.85, 3.1]) add(dl, new THREE.CylinderGeometry(0.09, 0.09, 0.02, 14), { x, y: cy - 0.01, z: 0.55, shadow: false });
  for (const [x, i] of [[-1.6, 2.2], [1.9, 2.2]]) {
    const pl = new THREE.PointLight(0xffe2b8, i, 6.5, 2);
    pl.position.set(x, 2.75, 0.75);
    scene.add(pl);
  }
}

function buildShell() {
  const top = STORE.ceil + 0.05;
  // Solid walls
  box(M.wall, 0.7, top - BASE, T, x0 + 0.35, BASE, z1 - T / 2);                    // front-left solid
  box(M.wall, T, top - BASE, z1 - z0, x0 + T / 2, BASE, (z0 + z1) / 2);             // left
  box(M.wall, x1 - x0, top - BASE, T, (x0 + x1) / 2, BASE, z0 + T / 2);             // back
  box(M.wall, T, top - BASE, -3.9 - z0, x1 - T / 2, BASE, (z0 - 3.9) / 2);          // right solid
  // Tile wainscot
  box(M.wallLow, 0.72, 0.55, T + 0.02, x0 + 0.35, BASE, z1 - T / 2);
  box(M.wallLow, T + 0.02, 0.55, z1 - z0, x0 + T / 2, BASE, (z0 + z1) / 2);
  box(M.wallLow, x1 - x0, 0.55, T + 0.02, (x0 + x1) / 2, BASE, z0 + T / 2);
  box(M.wallLow, T + 0.02, 0.55, -3.9 - z0, x1 - T / 2, BASE, (z0 - 3.9) / 2);
  // Windows
  windowRun('x', -3.3, 0.95, [-3.3, -2.2, -1.12, -0.04, 0.95], 0.5, z1);
  windowRun('x', 2.75, 3.6, [2.75, 3.6], 0.5, z1);
  windowRun('z', -3.9, -0.2, [-3.9, -2.67, -1.44, -0.2], 1.0, x1);
  box(M.alu, 0.12, 2.45, 0.12, x1 - 0.06, BASE, z1 - 0.06); // corner post
  // Door surround
  box(M.wall, 1.8, top - 2.6, T, 1.85, 2.6, z1 - T / 2);
  buildDoor();
  // Store floor slab and interior lining
  box(M.trim, x1 - x0, STORE.floor - BASE, z1 - z0, (x0 + x1) / 2, BASE, (z0 + z1) / 2, { shadow: false });
  box(IN.wall, 0.02, STORE.ceil - STORE.floor, z1 - z0 - 2 * T, x0 + T + 0.01, STORE.floor, (z0 + z1) / 2, { shadow: false });
  box(IN.wall, x1 - x0 - 2 * T, STORE.ceil - STORE.floor, 0.02, (x0 + x1) / 2, STORE.floor, z0 + T + 0.01, { shadow: false });
  box(IN.wall, 0.02, STORE.ceil - STORE.floor, -3.9 - z0 - T, x1 - T - 0.01, STORE.floor, (z0 + T - 3.9) / 2, { shadow: false });
  box(IN.wall, 0.5, STORE.ceil - STORE.floor, 0.02, x0 + T + 0.25, STORE.floor, z1 - T - 0.01, { shadow: false });
  // Roof
  box(M.roofEdge, x1 - x0, 0.5, z1 - z0, (x0 + x1) / 2, STORE.ceil, (z0 + z1) / 2);
  box(M.roof, x1 - x0 - 0.3, 0.02, z1 - z0 - 0.3, (x0 + x1) / 2 - 0.15, STORE.ceil + 0.5, (z0 + z1) / 2 - 0.15);
  box(M.roofEdge, 0.15, 0.32, z1 - z0, x0 + 0.075, STORE.ceil + 0.5, (z0 + z1) / 2);
  box(M.roofEdge, x1 - x0, 0.32, 0.15, (x0 + x1) / 2, STORE.ceil + 0.5, z0 + 0.075);
  box(M.wall, x1 - x0 + 0.1, 0.78, 0.12, (x0 + x1) / 2, 3.1, z1 + 0.0);
  box(M.wall, 0.12, 0.78, z1 - z0 + 0.1, x1, 3.1, (z0 + z1) / 2);
  // Rooftop condensers with fans
  for (const [ux, uz] of [[-2.6, -5.6], [-1.3, -5.6], [0.0, -5.6]]) {
    box(M.unit, 1.0, 0.85, 0.7, ux, 3.47, uz);
    cyl(M.grille, 0.3, 0.3, 0.02, ux, 3.47 + 0.85, uz, { seg: 18 });
    box(M.steel, 1.1, 0.06, 0.8, ux, 3.45, uz);
  }
  add(M.pipe, new THREE.BoxGeometry(0.18, 0.14, 3.6), { x: 1.1, y: 3.55, z: -3.8 });
  add(M.pipe, new THREE.BoxGeometry(3.4, 0.14, 0.18), { x: -1.2, y: 3.55, z: -4.9 });
  box(M.steel, 0.7, 0.5, 0.7, 2.4, 3.47, -2.0); // roof hatch
  box(M.roofEdge, 0.8, 0.06, 0.8, 2.4, 3.97, -2.0);
  // Downspout at front-left corner and right-back corner
  for (const [px, pz] of [[x0 + 0.08, z1 + 0.08], [x1 + 0.08, z0 + 0.12]]) {
    cyl(M.aluDark, 0.05, 0.05, 3.25, px, BASE + 0.12, pz, { seg: 10 });
    add(M.aluDark, new THREE.CylinderGeometry(0.05, 0.05, 0.25, 10), { x: px + 0.08, y: BASE + 0.1, z: pz + 0.06, rz: Math.PI / 2.6 });
  }
  // Back door to the alley + staff sign
  box(M.steel, 0.06, 2.05, 0.9, x0 - 0.03, BASE, -5.85);
  box(M.trim, 0.04, 0.05, 0.06, x0 - 0.08, 1.1, -5.55);
  const staff = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.13), new THREE.MeshBasicMaterial({ map: smallLabel('STAFF ONLY', '#f2ede3', '#24418f', 256, 80) }));
  placeMesh(staff, { x: x0 - 0.065, y: 1.75, z: -5.85, ry: -Math.PI / 2 });
  // Alley-side condensers on a rack
  for (const [uz, uy] of [[-3.0, BASE], [-1.8, BASE], [-3.0, 1.15]]) {
    box(M.unit, 0.38, 0.7, 0.95, x0 - 0.21, uy, uz);
    add(M.grille, new THREE.CylinderGeometry(0.27, 0.27, 0.02, 18), { x: x0 - 0.41, y: uy + 0.35, z: uz, rz: Math.PI / 2 });
  }
  box(M.steel, 0.42, 0.05, 1.0, x0 - 0.21, 1.1, -3.0);
  for (const uz of [-3.45, -2.55]) box(M.steel, 0.04, 1.0, 0.04, x0 - 0.4, BASE, uz);
  add(M.pipe, new THREE.BoxGeometry(0.1, 2.0, 0.1), { x: x0 - 0.06, y: 1.9, z: -2.4 });
  add(M.pipe, new THREE.BoxGeometry(0.1, 0.1, 1.4), { x: x0 - 0.06, y: 2.85, z: -3.05 });
  // Window posters (inside the glass, facing out)
  posterPlane('oden', 0.62, -2.75, 0.45, z1 - 0.13);
  posterPlane('nikuman', 0.5, -1.65, 1.55, z1 - 0.13);
  posterPlane('baito', 0.36, 3.18, 1.6, z1 - 0.13);
  posterPlane('coffee', 0.55, x1 - 0.13, 0.5, -1.0, Math.PI / 2);
  posterPlane('ice', 0.48, x1 - 0.13, 1.6, -3.25, Math.PI / 2);
  posterPlane('sweets', 0.44, -0.6, 1.62, z1 - 0.13);
  // Opening-hours sticker on the corner pane
  const hours = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), new THREE.MeshBasicMaterial({ map: smallLabel('OPEN 24h', BRAND.teal, '#ffffff', 256, 90) }));
  placeMesh(hours, { x: 3.18, y: 1.25, z: z1 - 0.11 });
}

export function buildStore() {
  buildShell();
  buildCanopy();
  buildSigns();
  // Interior spill: shadowed spots inside so the window frames print light onto the wet forecourt.
  const mkSpill = (px, py, pz, tx, tz, angle) => {
    const s = new THREE.SpotLight(0xffe7c4, 34, 14, angle, 0.55, 2);
    s.position.set(px, py, pz);
    s.target.position.set(tx, 0, tz);
    s.castShadow = true;
    s.shadow.mapSize.set(1024, 1024);
    s.shadow.bias = -0.0006;
    s.shadow.normalBias = 0.02;
    s.shadow.camera.near = 0.5;
    scene.add(s, s.target);
    return s;
  };
  mkSpill(-0.6, 2.7, -4.6, -0.6, 3.6, 0.95);
  mkSpill(0.2, 2.7, -2.2, 7.5, -2.2, 0.9);
}

function updateFlicker(f, t) {
  if (t > f.next && f.end === 0) { f.end = t + f.dur[0] + rand() * (f.dur[1] - f.dur[0]); }
  if (f.end > 0) {
    if (t > f.tick) { f.v = rand() < 0.55 ? 0.12 + rand() * 0.3 : 1; f.tick = t + 0.03 + rand() * 0.08; }
    if (t > f.end) { f.end = 0; f.v = 1; f.next = t + f.every[0] + rand() * (f.every[1] - f.every[0]); }
  } else {
    f.v = 0.965 + 0.035 * Math.sin(t * 37.0) * Math.sin(t * 3.1);
  }
  f.mat.color.copy(f.base).multiplyScalar(f.v);
  if (f.light) f.light.intensity = f.lightBase * f.v;
}

const ease = (x) => x * x * (3 - 2 * x);
export function updateStore(t, dt) {
  for (const f of flickers) updateFlicker(f, t);
  // Automatic door: rests closed, now and then slides open as if someone just stepped up.
  door.t += dt;
  if (door.state === 'closed' && door.t > door.wait) { door.state = 'opening'; door.t = 0; }
  else if (door.state === 'opening') { door.open = Math.min(1, door.t / 0.9); if (door.t > 0.9) { door.state = 'open'; door.t = 0; } }
  else if (door.state === 'open' && door.t > 2.6) { door.state = 'closing'; door.t = 0; }
  else if (door.state === 'closing') { door.open = Math.max(0, 1 - door.t / 1.3); if (door.t > 1.3) { door.state = 'closed'; door.t = 0; door.wait = 9 + rand() * 12; } }
  const o = ease(door.open) * 0.86;
  door.L.position.x = door.L.userData.closed - o;
  door.R.position.x = door.R.userData.closed + o;
}
