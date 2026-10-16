// Neighbouring izakaya, alley clutter, back yard walls and greenery, notice board.
import { THREE, scene, toon, glow, box, cyl, add, push, pop, placeMesh, rand, rr, canvasTex } from './core.js';
import { lanternTex, norenTex, shopSignTex, shojiTex, curtainWindowTex, bulletinTex } from './tex-street.js';

const B = 0.15;
const M = {
  wall: toon(0xc9bfae), wall2: toon(0xb3a894), wood: toon(0x5a3e2b), woodDark: toon(0x3a281d), roof: toon(0x3d4558),
  roofRib: toon(0x323949), trim: toon(0x2f3239), block: toon(0x9c9a93), blockCap: toon(0x86847d), leaf: toon(0x2f6a55),
  leaf2: toon(0x3f8466), bark: toon(0x4a3a2e), pot: toon(0xa0573a), steel: toon(0x8b929b), crate: toon(0xd9a23a),
  crate2: toon(0x2f7fc4), gas: toon(0x9fb4c4), net: toon(0x3f8f62), white: toon(0xeeeeea), dark: toon(0x2e3138),
};

function izakaya() {
  const x0 = -11.8, x1 = -6.6, z0 = -4.5, z1 = 2.8, H1 = 2.9, H2 = 5.6;
  const W = x1 - x0, D = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  box(M.wood, W, H1 - B, D, cx, B, cz);
  box(M.wall, W, H2 - H1, D, cx, H1, cz);
  box(M.woodDark, W + 0.06, 0.12, D + 0.06, cx, H1 - 0.06, cz);
  // gable roof with tile ribs
  const ridge = H2 + 1.5, ov = 0.5, ang = Math.atan(1.5 / (D / 2));
  const half = D / 2 + ov, len = half / Math.cos(ang);
  for (const s of [1, -1]) {
    const zc = cz + s * half / 2, yc = ridge - (half / 2) * Math.tan(ang) + 0.06;
    add(M.roof, new THREE.BoxGeometry(W + 0.8, 0.12, len), { x: cx, y: yc, z: zc, rx: s * ang });
    for (let x = x0 - 0.3; x <= x1 + 0.3; x += 0.32) add(M.roofRib, new THREE.BoxGeometry(0.06, 0.05, len), { x, y: yc + 0.08 * Math.cos(ang), z: zc, rx: s * ang, shadow: false });
  }
  add(M.roofRib, new THREE.BoxGeometry(W + 0.9, 0.22, 0.3), { x: cx, y: ridge + 0.1, z: cz });
  for (const gx of [x0 + 0.08, x1 - 0.08]) {
    const sh = new THREE.Shape([new THREE.Vector2(z0, H2), new THREE.Vector2(z1, H2), new THREE.Vector2(cz, ridge)]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: false });
    g.rotateY(-Math.PI / 2);
    g.translate(gx + 0.08, 0, 0);
    add(M.wall2, g);
  }
  // Ground floor front: shoji window, lit sliding doors, noren, sign, lantern
  const fz = z1 + 0.01;
  const shoji = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1), glow(0xffffff, 0.95, { map: shojiTex(true) }));
  placeMesh(shoji, { x: -10.8, y: 1.55, z: fz });
  box(M.woodDark, 1.5, 0.08, 0.1, -10.8, 0.96, z1);
  for (const dx of [-0.42, 0.42]) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.0), glow(0xffffff, 0.9, { map: shojiTex(true) }));
    placeMesh(d, { x: -9.0 + dx, y: B + 1.0, z: fz });
  }
  box(M.woodDark, 1.8, 0.1, 0.12, -9.0, B + 2.0, z1);
  for (const dx of [-0.9, 0.9]) box(M.woodDark, 0.08, 2.0, 0.12, -9.0 + dx, B, z1);
  const noren = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.72), toon(0xffffff, { map: norenTex(), side: THREE.DoubleSide }));
  noren.castShadow = true;
  placeMesh(noren, { x: -9.0, y: B + 1.7, z: z1 + 0.16 });
  box(M.woodDark, 1.75, 0.04, 0.04, -9.0, B + 2.06, z1 + 0.16);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.36), glow(0xffffff, 0.75, { map: shopSignTex() }));
  placeMesh(sign, { x: -9.0, y: 2.55, z: z1 + 0.06 });
  // small eave over the entrance
  add(M.roof, new THREE.BoxGeometry(2.4, 0.07, 0.8), { x: -9.0, y: 2.82, z: z1 + 0.36, rx: 0.22 });
  // lantern
  const lan = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16), glow(0xffffff, 1.7, { map: lanternTex() }));
  placeMesh(lan, { x: -7.45, y: 1.95, z: z1 + 0.32 });
  box(M.trim, 0.3, 0.05, 0.3, -7.45, 2.2, z1 + 0.32);
  box(M.trim, 0.3, 0.05, 0.3, -7.45, 1.66, z1 + 0.32);
  box(M.trim, 0.04, 0.4, 0.04, -7.45, 2.25, z1 + 0.32);
  box(M.trim, 0.04, 0.04, 0.34, -7.45, 2.63, z1 + 0.17);
  const ll = new THREE.PointLight(0xff4a32, 1.6, 4, 2);
  ll.position.set(-7.45, 1.9, z1 + 0.8);
  const dl = new THREE.PointLight(0xffb36b, 1.6, 4.5, 2);
  dl.position.set(-9.0, 1.4, z1 + 0.9);
  scene.add(ll, dl);
  // Upstairs: balcony + windows
  box(M.trim, 1.8, 0.1, 0.62, -10.7, 3.35, z1 + 0.31);
  for (let x = -11.55; x <= -9.85; x += 0.12) box(M.steel, 0.02, 0.9, 0.02, x, 3.45, z1 + 0.6);
  box(M.steel, 1.8, 0.04, 0.04, -10.7, 4.35, z1 + 0.6);
  box(toon(0xd6d8d4), 0.7, 0.55, 0.28, -11.1, 3.45, z1 + 0.2);
  cyl(M.dark, 0.18, 0.18, 0.02, -11.1, 3.72, z1 + 0.34, { rx: Math.PI / 2 });
  const darkWin = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), new THREE.MeshBasicMaterial({ color: 0x1c2638 }));
  placeMesh(darkWin, { x: -10.45, y: 4.2, z: fz });
  const litWin = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.2), glow(0xffffff, 1.0, { map: curtainWindowTex() }));
  placeMesh(litWin, { x: -8.1, y: 4.25, z: fz });
  for (const [wx, ww] of [[-10.45, 1.1], [-8.1, 1.5]]) {
    box(M.woodDark, ww + 0.12, 0.08, 0.12, wx, 3.55, z1);
    box(M.woodDark, ww + 0.12, 0.08, 0.12, wx, 4.85, z1);
  }
  // Alley side: small lit window, meters, pipes
  const sideWin = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), glow(0xffffff, 0.7, { map: shojiTex(true) }));
  placeMesh(sideWin, { x: x1 + 0.01, y: 1.7, z: -2.6, ry: Math.PI / 2 });
  box(M.steel, 0.12, 0.35, 0.28, x1 + 0.06, 1.4, 0.6);
  box(M.white, 0.1, 0.3, 0.22, x1 + 0.05, 1.45, -0.2);
  box(M.steel, 0.07, H2 - B, 0.07, x1 + 0.05, B, 2.3);
  box(M.steel, 0.07, 0.07, 3.5, x1 + 0.05, 2.4, -1.0);
  // Gable-end windows (street-edge side)
  const sw1 = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), glow(0xffffff, 0.75, { map: shojiTex(true) }));
  placeMesh(sw1, { x: x0 - 0.01, y: 1.6, z: -0.6, ry: -Math.PI / 2 });
  const sw2 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ color: 0x1c2638 }));
  placeMesh(sw2, { x: x0 - 0.01, y: 4.2, z: -1.6, ry: -Math.PI / 2 });
  for (const [wy, wz, wh] of [[1.6, -0.6, 0.7], [4.2, -1.6, 1.0]]) {
    box(M.woodDark, 0.1, 0.07, 1.1, x0 - 0.03, wy - wh / 2 - 0.07, wz);
    box(M.woodDark, 0.1, 0.07, 1.1, x0 - 0.03, wy + wh / 2, wz);
  }
  box(toon(0xd6d8d4), 0.3, 0.55, 0.75, x0 - 0.15, 0.15, 1.6);
  // Front yard bits
  for (const [px, pz, s] of [[-10.2, 3.35, 1], [-7.9, 3.25, 0.8], [-6.95, 4.4, 1.2]]) plant(px, pz, s);
  // beer crates
  for (let i = 0; i < 3; i++) box(i % 2 ? M.crate : M.crate2, 0.45, 0.3, 0.35, -7.1, B + i * 0.3, 2.05);
  // A-frame chalkboard
  push(-8.1, B, 3.6, 0.15);
  const chalk = canvasTex(256, 384, (g, w, h) => {
    g.fillStyle = '#23302b'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f4f1e6'; g.font = '800 34px "M PLUS Rounded 1c", sans-serif'; g.textAlign = 'center';
    g.fillText('本日の', w / 2, 60); g.fillText('おすすめ', w / 2, 102);
    g.font = '500 26px "M PLUS Rounded 1c", sans-serif'; g.fillStyle = '#ffd36b';
    ['ねぎま', 'つくね', '熱燗'].forEach((t, i) => g.fillText(t, w / 2, 170 + i * 52));
    g.strokeStyle = '#8fd4c4'; g.lineWidth = 3; g.strokeRect(14, 14, w - 28, h - 28);
  });
  const cb = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.75), toon(0xffffff, { map: chalk }));
  placeMesh(cb, { y: 0.5, z: 0.12, rx: -0.2 });
  add(M.wood, new THREE.BoxGeometry(0.56, 0.82, 0.04), { y: 0.47, z: 0.1, rx: -0.2 });
  add(M.wood, new THREE.BoxGeometry(0.56, 0.82, 0.04), { y: 0.47, z: -0.1, rx: 0.2 });
  pop();
}

export function plant(x, z, s = 1) {
  cyl(M.pot, 0.2 * s, 0.15 * s, 0.32 * s, x, B, z, { seg: 12 });
  add(M.leaf, new THREE.IcosahedronGeometry(0.3 * s, 1), { x, y: B + 0.52 * s, z });
  add(M.leaf2, new THREE.IcosahedronGeometry(0.2 * s, 1), { x: x + 0.12 * s, y: B + 0.72 * s, z: z + 0.05 });
}

function tree(x, z) {
  cyl(M.bark, 0.1, 0.16, 2.0, x, B, z, { seg: 8 });
  const blobs = [[0, 2.5, 0, 1.0], [0.6, 2.2, 0.3, 0.75], [-0.55, 2.3, -0.2, 0.8], [0.1, 3.1, -0.1, 0.7], [-0.2, 2.0, 0.55, 0.6]];
  blobs.forEach(([dx, dy, dz, r], i) => add(i % 2 ? M.leaf2 : M.leaf, new THREE.IcosahedronGeometry(r, 1), { x: x + dx, y: B + dy, z: z + dz }));
}

function blockWall(x0, z0, x1, z1, h = 1.2) {
  const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0), x1 - x0);
  add(M.block, new THREE.BoxGeometry(len, h, 0.15), { x: (x0 + x1) / 2, y: B + h / 2, z: (z0 + z1) / 2, ry });
  add(M.blockCap, new THREE.BoxGeometry(len + 0.04, 0.06, 0.19), { x: (x0 + x1) / 2, y: B + h + 0.03, z: (z0 + z1) / 2, ry });
  // block joints as shallow ribs
  for (let y = 0.2; y < h; y += 0.2) add(M.blockCap, new THREE.BoxGeometry(len, 0.012, 0.155), { x: (x0 + x1) / 2, y: B + y, z: (z0 + z1) / 2, ry, shadow: false });
}

function backyard() {
  blockWall(-11.9, -11.9, 6.4, -11.9);
  blockWall(-11.9, -11.9, -11.9, -4.7);
  blockWall(6.42, -11.9, 6.42, -8.8, 0.9);
  tree(-9.4, -8.6);
  plant(-10.8, -6.0, 1.1); plant(-7.4, -10.9, 0.9);
  // Store back: crates, LPG cylinders, a caged garbage corner
  for (let i = 0; i < 4; i++) box(i % 2 ? M.crate2 : M.crate, 0.55, 0.32, 0.38, -2.6 + (i > 1 ? 0.6 : 0), B + (i % 2) * 0.32, -7.45);
  for (const gx of [1.2, 1.55]) {
    cyl(M.gas, 0.17, 0.17, 1.2, gx, B, -7.35, { seg: 14 });
    add(M.gas, new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), { x: gx, y: B + 1.2, z: -7.35 });
    cyl(M.steel, 0.04, 0.04, 0.12, gx, B + 1.33, -7.35, { seg: 8 });
  }
  box(M.steel, 1.0, 0.05, 0.05, 1.37, B + 0.85, -7.12);
  // garbage cage
  const gx0 = 3.0, gz = -9.3;
  box(M.net, 1.8, 0.04, 1.2, gx0, B + 1.1, gz);
  for (const [dx, dz] of [[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6]]) box(M.steel, 0.04, 1.1, 0.04, gx0 + dx, B, gz + dz);
  for (let i = 0; i <= 12; i++) {
    box(M.net, 0.012, 1.1, 0.012, gx0 - 0.9 + i * 0.15, B, gz + 0.6);
    box(M.net, 0.012, 1.1, 0.012, gx0 - 0.9 + i * 0.15, B, gz - 0.6);
  }
  for (let i = 0; i < 4; i++) add(toon(i % 2 ? 0xdfe6ea : 0x8fb3cf), new THREE.IcosahedronGeometry(0.28, 1), { x: gx0 - 0.5 + i * 0.32, y: B + 0.25, z: gz + rr(-0.2, 0.2), sy: 0.8 });
  // back door light of the store
  add(glow(0xffe1b0, 3.0), new THREE.BoxGeometry(0.22, 0.08, 0.1), { x: 2.0, y: 2.4, z: -7.06, shadow: false });
  const bl = new THREE.PointLight(0xffd8a0, 1.4, 4, 2);
  bl.position.set(2.0, 2.2, -7.6);
  scene.add(bl);
  box(toon(0x7c838c), 0.9, 2.05, 0.06, 2.0, B, -7.03);
}

function alley() {
  // Crates, bucket, folded cardboard, a couple of pots; drain cover strip is painted on the ground.
  for (let i = 0; i < 3; i++) box(i === 1 ? M.crate : M.crate2, 0.5, 0.3, 0.36, -6.2 + 0.05 * i, B + i * 0.3, -3.8 - 0.03 * i);
  cyl(toon(0x3f7fc8), 0.17, 0.14, 0.32, -4.4, B, -4.6, { seg: 12 });
  add(toon(0xb7926a), new THREE.BoxGeometry(0.8, 0.6, 0.05), { x: -6.25, y: B + 0.3, z: -5.6, ry: Math.PI / 2, rz: 0.12 });
  plant(-6.15, 1.6, 0.9);
  plant(-6.1, 0.8, 0.7);
  // pipes along the store wall top
  box(toon(0xd8cfbc), 0.08, 0.08, 6.8, -4.06, 2.65, -3.6);
}

function bulletinBoard(x, z) {
  for (const dx of [-0.75, 0.75]) box(M.steel, 0.06, 1.75, 0.06, x + dx, B, z);
  box(M.wood, 1.65, 1.1, 0.08, x, B + 0.75, z);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.98), toon(0xffffff, { map: bulletinTex() }));
  placeMesh(p, { x, y: B + 1.3, z: z + 0.045 });
  add(M.roof, new THREE.BoxGeometry(1.85, 0.06, 0.36), { x, y: B + 1.92, z: z + 0.06, rx: 0.25 });
}

export function buildTown() {
  izakaya();
  backyard();
  alley();
  bulletinBoard(-10.6, 5.25);
}
