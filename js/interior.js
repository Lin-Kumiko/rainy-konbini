// Shop interior: floor, ceiling lights, coolers, gondolas, counter, magazine rack, freezer.
import { THREE, scene, interior, glow, box, add, placeMesh, rand, rr, pick } from './core.js';
import { productAtlas, ATLAS_N, CELL, floorTex, coolerHeader, menuBoard, poster, smallLabel } from './tex-store.js';
import { makeGlassMaterial } from './glass.js';
import { STORE } from './store.js';

const FY = STORE.floor, CY = STORE.ceil;
const IX0 = -3.82, IX1 = 3.42, IZ0 = -6.82, IZ1 = -0.38;

const C = {
  white: interior(0xf3efe6), shelf: interior(0xdcd8d0), dark: interior(0x4a4e58), mid: interior(0x8d939c),
  teal: interior(0x16a99b), orange: interior(0xf2963a), wood: interior(0xc8a477), red: interior(0xd8473a),
  beige: interior(0xe9dcc4), black: interior(0x2a2c33), steel: interior(0xb8bec6),
};

// ---- Instanced products ----
let atlas;
const lists = { box: [], bottle: [], cap: [], prism: [], cyl: [] };
function prod(type, x, y, z, sx, sy, sz, ry = 0, color = 0xffffff, cell = 0) {
  lists[type].push({ x, y, z, sx, sy, sz, ry, color, cell });
}
function flushProducts() {
  const geos = {
    box: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    bottle: new THREE.CylinderGeometry(0.42, 0.5, 1, 10).translate(0, 0.5, 0),
    cap: new THREE.CylinderGeometry(0.5, 0.5, 1, 8).translate(0, 0.5, 0),
    prism: new THREE.CylinderGeometry(0.5, 0.5, 1, 3).rotateX(-Math.PI / 2).translate(0, 0.25, 0),
    cyl: new THREE.CylinderGeometry(0.5, 0.44, 1, 12).translate(0, 0.5, 0),
  };
  const mat = interior(0xffffff, { map: atlas, atlasN: ATLAS_N, glow: 0.16 });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  for (const [type, list] of Object.entries(lists)) {
    if (!list.length) continue;
    const geo = geos[type];
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    const cells = new Float32Array(list.length);
    list.forEach((p, i) => {
      m4.compose(new THREE.Vector3(p.x, p.y, p.z), q.setFromEuler(e.set(0, p.ry, 0)), new THREE.Vector3(p.sx, p.sy, p.sz));
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, col.set(p.color));
      cells[i] = p.cell;
    });
    geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 1));
    mesh.frustumCulled = false;
    scene.add(mesh);
  }
}

const DRINKS = [0x3d9a4f, 0x8fd0f0, 0xb32b2b, 0xf29a2e, 0x6b4630, 0xf5f2e8, 0xe8d24a, 0x4466cc, 0xe46a9a, 0x2ec4b6];

function shelfRow(x0, x1, y, z, depth, face, opts = {}) {
  // Fill a shelf running along x with packaged goods; face = +1 means fronts toward +z.
  let x = x0 + 0.03;
  while (x < x1 - 0.08) {
    const w = rr(0.1, 0.2), h = rr(0.12, opts.maxH || 0.26), d = Math.min(depth, rr(0.12, 0.22));
    if (x + w > x1) break;
    const cell = Math.floor(rand() * 56);
    const type = rand() < 0.18 ? 'cyl' : 'box';
    prod(type, x + w / 2, y, z, w * 0.94, h, d, face > 0 ? 0 : Math.PI, 0xffffff, type === 'cyl' ? CELL.cup : cell);
    x += w + 0.012;
  }
}
function shelfRowZ(z0, z1, y, x, depth, face, opts = {}) {
  let z = z0 + 0.03;
  while (z < z1 - 0.08) {
    const w = rr(0.1, 0.2), h = rr(0.12, opts.maxH || 0.26), d = Math.min(depth, rr(0.12, 0.22));
    if (z + w > z1) break;
    const cell = Math.floor(rand() * 56);
    const type = rand() < 0.15 ? 'cyl' : 'box';
    prod(type, x, y, z + w / 2, w * 0.94, h, d, face > 0 ? Math.PI / 2 : -Math.PI / 2, 0xffffff, type === 'cyl' ? CELL.cup : cell);
    z += w + 0.012;
  }
}

function buildFloorCeiling() {
  const fm = new THREE.Mesh(new THREE.PlaneGeometry(IX1 - IX0, IZ1 - IZ0).rotateX(-Math.PI / 2), interior(0xffffff, { map: floorTex(), glow: 0.1 }));
  fm.position.set((IX0 + IX1) / 2, FY + 0.002, (IZ0 + IZ1) / 2);
  scene.add(fm);
  const cm = new THREE.Mesh(new THREE.PlaneGeometry(IX1 - IX0, IZ1 - IZ0).rotateX(Math.PI / 2), C.white);
  cm.position.set((IX0 + IX1) / 2, CY - 0.002, (IZ0 + IZ1) / 2);
  scene.add(cm);
  const lamp = glow(0xfff4e2, 1.8);
  for (const z of [-1.3, -2.9, -4.5, -6.0]) for (const x of [-2.7, -0.6, 1.5]) {
    box(lamp, 1.3, 0.03, 0.2, x, CY - 0.035, z, { shadow: false });
  }
}

function buildCoolers() {
  const x0 = -3.8, x1 = 0.92, z0 = IZ0, z1 = -6.12, top = 2.25, n = 5, dw = (x1 - x0) / n;
  box(C.dark, x1 - x0, top - FY, 0.05, (x0 + x1) / 2, FY, z0 + 0.025);
  box(C.dark, x1 - x0, 0.12, z1 - z0, (x0 + x1) / 2, FY, (z0 + z1) / 2);
  box(C.dark, x1 - x0, 0.25, z1 - z0 + 0.04, (x0 + x1) / 2, top, (z0 + z1) / 2);
  const back = glow(0xdff0ff, 1.15);
  box(back, x1 - x0 - 0.06, top - FY - 0.2, 0.02, (x0 + x1) / 2, FY + 0.12, z0 + 0.06, { shadow: false });
  for (let i = 0; i <= n; i++) box(C.mid, 0.05, top - FY, 0.08, x0 + i * dw, FY, z1 - 0.04);
  const shelves = [0.42, 0.78, 1.12, 1.46, 1.8];
  for (const sy of shelves) {
    box(C.steel, x1 - x0, 0.02, z1 - z0 - 0.1, (x0 + x1) / 2, sy - 0.02, (z0 + z1) / 2);
    let x = x0 + 0.06;
    while (x < x1 - 0.06) {
      const col = pick(DRINKS), h = rr(0.2, 0.27), r = rr(0.06, 0.075);
      for (const dz of [0.0, 0.2]) {
        prod('bottle', x + r / 2, sy, z1 - 0.12 - dz, r, h, r, 0, col, CELL.bottle);
        prod('cap', x + r / 2, sy + h, z1 - 0.12 - dz, r * 0.55, 0.025, r * 0.55, 0, rand() < 0.5 ? 0xffffff : col, 63);
      }
      x += r + 0.018;
    }
  }
  for (let i = 0; i < n; i++) {
    const cx = x0 + (i + 0.5) * dw;
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.06, top - FY - 0.14), makeGlassMaterial(dw, top - FY, { rain: 0, opacity: 0.05, tint: 0xbfdcff }));
    gm.layers.set(1);
    gm.position.set(cx, FY + 0.07 + (top - FY - 0.14) / 2, z1);
    scene.add(gm);
    box(C.steel, 0.03, 0.7, 0.03, cx + dw / 2 - 0.12, 0.95, z1 + 0.03);
  }
  const hdr = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 0.24), glow(0xffffff, 1.2, { map: coolerHeader() }));
  hdr.position.set((x0 + x1) / 2, top + 0.125, z1 + 0.025);
  scene.add(hdr);
}

function buildBentoCase() {
  const x0 = IX0, x1 = -3.12, z0 = -5.9, z1 = -1.55;
  box(C.white, x1 - x0, 0.6, z1 - z0, (x0 + x1) / 2, FY, (z0 + z1) / 2);
  box(C.teal, 0.02, 0.1, z1 - z0, x1 + 0.005, FY + 0.48, (z0 + z1) / 2);
  box(C.dark, 0.25, 1.95 - FY, z1 - z0, x0 + 0.125, FY, (z0 + z1) / 2);
  box(C.dark, x1 - x0 + 0.05, 0.12, z1 - z0, (x0 + x1) / 2, 1.95, (z0 + z1) / 2);
  box(glow(0xfff6e8, 2.0), 0.03, 0.03, z1 - z0 - 0.1, x1 - 0.05, 1.93, (z0 + z1) / 2, { shadow: false });
  const tiers = [[0.8, 'bento'], [1.18, 'onigiri'], [1.55, 'sandwich']];
  for (const [ty, kind] of tiers) {
    box(C.steel, x1 - x0 - 0.2, 0.02, z1 - z0, (x0 + x1) / 2 + 0.1, ty - 0.02, (z0 + z1) / 2);
    let z = z0 + 0.06;
    while (z < z1 - 0.1) {
      if (kind === 'bento') {
        prod('box', -3.42, ty, z + 0.1, 0.32, 0.06, 0.19, Math.PI / 2, 0xffffff, CELL.bento);
        prod('box', -3.42, ty + 0.065, z + 0.1, 0.3, 0.05, 0.18, Math.PI / 2, 0xffffff, CELL.bento);
        z += 0.24;
      } else if (kind === 'onigiri') {
        for (const dx of [-0.05, -0.25]) prod('prism', x1 + dx - 0.1, ty, z + 0.06, 0.13, 0.15, 0.04, Math.PI / 2, 0xffffff, CELL.onigiri);
        z += 0.15;
      } else {
        prod('prism', x1 - 0.18, ty, z + 0.08, 0.16, 0.2, 0.06, Math.PI / 2, 0xffffff, CELL.sandwich);
        z += 0.2;
      }
    }
  }
}

function gondola(cx, z0, z1) {
  const d = 0.62;
  box(C.dark, d - 0.04, 0.14, z1 - z0, cx, FY, (z0 + z1) / 2);
  box(C.beige, 0.05, 1.45, z1 - z0, cx, FY, (z0 + z1) / 2);
  box(C.mid, d, 0.04, z1 - z0, cx, FY + 1.45, (z0 + z1) / 2);
  for (const side of [1, -1]) {
    for (const sy of [0.36, 0.7, 1.04]) {
      box(C.shelf, d / 2 - 0.03, 0.025, z1 - z0, cx + side * d / 4, FY + sy - 0.025, (z0 + z1) / 2);
      box(C.orange, 0.012, 0.04, z1 - z0, cx + side * (d / 2 - 0.02), FY + sy - 0.04, (z0 + z1) / 2);
      shelfRowZ(z0, z1, FY + sy, cx + side * (d / 4 + 0.02), 0.22, side, { maxH: 0.27 });
    }
    shelfRowZ(z0, z1, FY + 0.14, cx + side * (d / 4 + 0.02), 0.22, side, { maxH: 0.2 });
  }
  // End cap facing the windows
  box(C.white, d, 1.3, 0.38, cx, FY, z1 + 0.19);
  for (const sy of [0.45, 0.85]) {
    box(C.shelf, d, 0.025, 0.36, cx, FY + sy, z1 + 0.2);
    shelfRow(cx - d / 2, cx + d / 2, FY + sy + 0.025, z1 + 0.22, 0.26, 1, { maxH: 0.3 });
  }
  shelfRow(cx - d / 2, cx + d / 2, FY + 1.3, z1 + 0.22, 0.26, 1, { maxH: 0.22 });
  // POP card
  const pop = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), interior(0xffffff, { map: smallLabel(pick(['新商品', 'おすすめ', '期間限定']), '#f2963a', '#ffffff', 256, 160), glow: 0.3 }));
  pop.position.set(cx, FY + 1.9, z1 + 0.05);
  scene.add(pop);
  box(C.steel, 0.02, 0.3, 0.02, cx, FY + 1.47, z1 + 0.05);
}

function buildMagazineRack() {
  const x0 = -3.15, x1 = 0.7, z = -0.72;
  box(C.mid, x1 - x0, 0.45, 0.42, (x0 + x1) / 2, FY, z);
  box(C.mid, x1 - x0, 0.92, 0.05, (x0 + x1) / 2, FY, z + 0.2);
  box(C.teal, x1 - x0, 0.04, 0.052, (x0 + x1) / 2, FY + 0.88, z + 0.2);
  for (const [sy, dz] of [[0.48, -0.05], [0.8, 0.02], [1.08, 0.08]]) {
    box(C.shelf, x1 - x0, 0.02, 0.2, (x0 + x1) / 2, FY + sy - 0.02, z + dz);
    let x = x0 + 0.04;
    while (x < x1 - 0.22) {
      const w = rr(0.18, 0.23);
      prod('box', x + w / 2, FY + sy, z + dz - 0.02, w, rr(0.24, 0.3), 0.02, Math.PI, pick([0xffffff, 0xffd6d0, 0xd0e4ff, 0xfff0b0, 0xd8f5dc]), rand() < 0.5 ? CELL.magazine : Math.floor(rand() * 56));
      x += w + 0.015;
    }
  }
}

function buildCounter() {
  const x0 = 1.25, x1 = IX1, z0 = -3.8, z1 = -3.15;
  box(C.beige, x1 - x0, 0.95, z1 - z0, (x0 + x1) / 2, FY, (z0 + z1) / 2);
  box(C.teal, x1 - x0, 0.08, 0.01, (x0 + x1) / 2, FY + 0.7, z1 + 0.005);
  box(C.wood, x1 - x0 + 0.04, 0.05, z1 - z0 + 0.08, (x0 + x1) / 2, FY + 0.95, (z0 + z1) / 2 + 0.02);
  // Register
  box(C.black, 0.36, 0.08, 0.3, 2.7, FY + 1.0, -3.55);
  box(C.black, 0.34, 0.26, 0.04, 2.7, FY + 1.08, -3.66, { ry: 0 });
  box(glow(0x7fd6ff, 1.1), 0.3, 0.2, 0.01, 2.7, FY + 1.11, -3.635, { shadow: false });
  box(C.black, 0.22, 0.14, 0.02, 2.7, FY + 1.05, -3.2);
  // Hot snack warmer
  box(C.dark, 0.6, 0.06, 0.42, 2.0, FY + 1.0, -3.5);
  box(glow(0xffb36b, 0.9), 0.56, 0.36, 0.38, 2.0, FY + 1.06, -3.5, { shadow: false });
  for (let i = 0; i < 6; i++) prod('box', 1.82 + (i % 3) * 0.18, FY + 1.08 + Math.floor(i / 3) * 0.17, -3.42, 0.13, 0.08, 0.1, 0, 0xd9902f, 62);
  // Oden pot with dividers
  box(C.steel, 0.55, 0.22, 0.42, 1.52, FY + 1.0, -3.48);
  box(interior(0xc98f3e, { glow: 0.5 }), 0.5, 0.01, 0.37, 1.52, FY + 1.21, -3.48, { shadow: false });
  box(C.steel, 0.01, 0.06, 0.37, 1.52, FY + 1.18, -3.48);
  box(C.steel, 0.5, 0.06, 0.01, 1.52, FY + 1.18, -3.48);
  for (let i = 0; i < 7; i++) prod('cyl', 1.33 + rand() * 0.38, FY + 1.19, -3.62 + rand() * 0.28, 0.07, 0.03, 0.07, 0, pick([0xf2e6c8, 0xa8763e, 0xe8d6a8]), 63);
  // Coffee machine
  box(C.black, 0.42, 0.62, 0.4, 3.12, FY + 1.0, -3.47);
  box(C.mid, 0.36, 0.2, 0.02, 3.12, FY + 1.35, -3.26);
  box(glow(0xff9a3c, 1.2), 0.08, 0.03, 0.01, 3.03, FY + 1.48, -3.255, { shadow: false });
  box(glow(0x6fe3d1, 1.2), 0.08, 0.03, 0.01, 3.2, FY + 1.48, -3.255, { shadow: false });
  // Menu lightbox hanging above the counter
  const mb = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.48), glow(0xffffff, 1.15, { map: menuBoard() }));
  mb.position.set(2.32, 2.42, -3.83);
  scene.add(mb);
  box(C.dark, 1.96, 0.54, 0.06, 2.32, 2.15, -3.87);
  for (const x of [1.5, 3.1]) box(C.steel, 0.015, 0.3, 0.015, x, 2.66, -3.87);
  // Back counter, cigarette wall and back-room door
  box(C.beige, IX1 - 2.05, 0.95, 0.5, (IX1 + 2.05) / 2, FY, IZ0 + 0.25);
  box(C.dark, IX1 - 2.05, 1.0, 0.25, (IX1 + 2.05) / 2, 1.3, IZ0 + 0.125);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 12; c++) {
    prod('box', 2.15 + c * 0.105, 1.36 + r * 0.19, IZ0 + 0.22, 0.08, 0.13, 0.04, 0, pick([0xffffff, 0xd8e8ff, 0xffe0d8, 0xe8f6e0, 0xfff2c8, 0x404858]), 62);
  }
  box(C.steel, 0.85, 2.05, 0.05, 1.5, FY, IZ0 + 0.03);
  box(C.dark, 0.25, 0.25, 0.01, 1.5, FY + 1.45, IZ0 + 0.06);
  const staff = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.12), interior(0xffffff, { map: smallLabel('STAFF ONLY', '#24418f', '#ffffff', 256, 80) }));
  staff.position.set(1.5, FY + 1.75, IZ0 + 0.065);
  scene.add(staff);
}

function buildMisc() {
  // Ice cream chest
  box(C.white, 0.95, 0.75, 0.62, 0.35, FY, -1.8);
  box(glow(0xdaf0ff, 1.1), 0.88, 0.02, 0.55, 0.35, FY + 0.74, -1.8, { shadow: false });
  for (let i = 0; i < 14; i++) prod('box', -0.02 + (i % 7) * 0.12, FY + 0.76, -1.95 + Math.floor(i / 7) * 0.28, 0.1, 0.05, 0.16, 0, 0xffffff, Math.floor(rand() * 56));
  // Copier / ATM against the left wall
  box(C.white, 0.6, 1.05, 0.62, IX0 + 0.3, FY, -0.9);
  box(C.mid, 0.5, 0.05, 0.4, IX0 + 0.3, FY + 1.05, -0.9);
  box(glow(0x8fd4ff, 1.0), 0.02, 0.14, 0.22, IX0 + 0.61, FY + 0.85, -0.9, { shadow: false });
  // Shopping baskets
  for (let i = 0; i < 5; i++) box(C.red, 0.48, 0.07, 0.32, 0.58, FY + i * 0.07, -0.72);
  // Vinyl umbrellas for sale by the door
  box(C.steel, 0.32, 0.6, 0.32, 0.6, FY + 0.35, -1.2);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    add(interior(0xe4eef5, { glow: 0.3 }), new THREE.ConeGeometry(0.05, 0.85, 6), { x: 0.6 + Math.cos(a) * 0.09, y: FY + 0.85, z: -1.2 + Math.sin(a) * 0.09, rx: Math.PI, shadow: false });
  }
  // Hanging promo cards
  for (const [x, z, k] of [[-1.25, -3.0, 'sweets'], [1.0, -4.8, 'coffee']]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), interior(0xffffff, { map: poster(k), glow: 0.25 }));
    p.position.set(x, 2.35, z);
    scene.add(p);
  }
}

export function buildInterior() {
  atlas = productAtlas();
  buildFloorCeiling();
  buildCoolers();
  buildBentoCase();
  gondola(-2.2, -5.2, -2.25);
  gondola(-0.65, -5.2, -2.25);
  buildMagazineRack();
  buildCounter();
  buildMisc();
  flushProducts();
}
