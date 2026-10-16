// Base plinth, roads, sidewalks, markings and the wet reflective ground shader.
import { THREE, scene, U, GRADIENT, toon, add, box, canvasTex, rand, rr, FONT_DISPLAY } from './core.js';

const S = 2048 / 24; // canvas pixels per metre
const X = (x) => (x + 12) * S;
const Z = (z) => (z + 12) * S;

function speckle(g, x0, z0, x1, z1, count, cols, size = 2) {
  for (let i = 0; i < count; i++) {
    g.fillStyle = cols[(Math.random() * cols.length) | 0];
    const px = X(x0) + Math.random() * (x1 - x0) * S, pz = Z(z0) + Math.random() * (z1 - z0) * S;
    const s = size * (0.5 + Math.random());
    g.fillRect(px, pz, s, s);
  }
}
function rectW(g, x0, z0, x1, z1, col) { g.fillStyle = col; g.fillRect(X(x0), Z(z0), (x1 - x0) * S, (z1 - z0) * S); }

function paving(g, x0, z0, x1, z1, cell, colA, colB, joint) {
  rectW(g, x0, z0, x1, z1, colA);
  for (let x = x0; x < x1 - 1e-3; x += cell) for (let z = z0; z < z1 - 1e-3; z += cell) {
    const r = Math.random();
    g.fillStyle = r < 0.33 ? colB : colA;
    g.globalAlpha = 0.55 + Math.random() * 0.45;
    g.fillRect(X(x) + 1, Z(z) + 1, Math.min(cell, x1 - x) * S - 2, Math.min(cell, z1 - z) * S - 2);
  }
  g.globalAlpha = 1;
  g.strokeStyle = joint; g.lineWidth = 1.4;
  g.beginPath();
  for (let x = x0; x <= x1 + 1e-3; x += cell) { g.moveTo(X(x), Z(z0)); g.lineTo(X(x), Z(z1)); }
  for (let z = z0; z <= z1 + 1e-3; z += cell) { g.moveTo(X(x0), Z(z)); g.lineTo(X(x1), Z(z)); }
  g.stroke();
}

function tactile(g, x0, z0, x1, z1) {
  rectW(g, x0, z0, x1, z1, '#d9b23a');
  g.fillStyle = '#b8932a';
  for (let x = x0 + 0.05; x < x1; x += 0.075) for (let z = z0 + 0.05; z < z1; z += 0.075) {
    g.beginPath(); g.arc(X(x), Z(z), 2.1, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = '#8f7220'; g.lineWidth = 1;
  for (let x = x0; x < x1; x += 0.3) g.strokeRect(X(x), Z(z0), 0.3 * S, (z1 - z0) * S);
}

function gutterStripX(g, x0, x1, z0, z1) { // along x
  rectW(g, x0, z0, x1, z1, '#8d8b85');
  g.strokeStyle = '#5f5d59'; g.lineWidth = 1.2;
  for (let x = x0; x < x1; x += 0.5) { g.beginPath(); g.moveTo(X(x), Z(z0)); g.lineTo(X(x), Z(z1)); g.stroke(); }
  for (let x = x0 + 1.2; x < x1 - 0.5; x += 3.6) { // steel grates
    rectW(g, x, z0 + 0.04, x + 0.5, z1 - 0.04, '#2b2d31');
    g.fillStyle = '#55585e';
    for (let k = 0; k < 9; k++) g.fillRect(X(x + 0.03 + k * 0.052), Z(z0 + 0.06), 2, (z1 - z0 - 0.12) * S);
  }
}
function gutterStripZ(g, z0, z1, x0, x1) { // along z
  rectW(g, x0, z0, x1, z1, '#8d8b85');
  g.strokeStyle = '#5f5d59'; g.lineWidth = 1.2;
  for (let z = z0; z < z1; z += 0.5) { g.beginPath(); g.moveTo(X(x0), Z(z)); g.lineTo(X(x1), Z(z)); g.stroke(); }
  for (let z = z0 + 1.0; z < z1 - 0.5; z += 3.6) {
    rectW(g, x0 + 0.04, z, x1 - 0.04, z + 0.5, '#2b2d31');
    g.fillStyle = '#55585e';
    for (let k = 0; k < 9; k++) g.fillRect(X(x0 + 0.06), Z(z + 0.03 + k * 0.052), (x1 - x0 - 0.12) * S, 2);
  }
}

function manhole(g, x, z) {
  g.save();
  g.translate(X(x), Z(z));
  g.fillStyle = '#4b4a4a'; g.beginPath(); g.arc(0, 0, 0.32 * S, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#2c2b2c'; g.lineWidth = 3; g.stroke();
  g.strokeStyle = '#5f5e5d'; g.lineWidth = 2;
  for (let r = 0.08; r < 0.3; r += 0.07) { g.beginPath(); g.arc(0, 0, r * S, 0, Math.PI * 2); g.stroke(); }
  for (let a = 0; a < 12; a++) { g.save(); g.rotate(a * Math.PI / 6); g.beginPath(); g.moveTo(0.08 * S, 0); g.lineTo(0.29 * S, 0); g.stroke(); g.restore(); }
  g.restore();
}

// Paint text onto the road, stretched along the driving direction.
function roadText(g, text, x, z, rot, wM, hM) {
  g.save();
  g.translate(X(x), Z(z));
  g.rotate(rot);
  g.scale(1, (hM / wM) * 1.0);
  g.fillStyle = 'rgba(236,234,226,0.92)';
  g.font = `${Math.round(wM * S / text.length * 1.05)}px ${FONT_DISPLAY}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 0, 0);
  g.restore();
}

function drawGround(g, W) {
  // Asphalt everywhere first.
  g.fillStyle = '#3c3f48'; g.fillRect(0, 0, W, W);
  speckle(g, -12, -12, 12, 12, 70000, ['#383a43', '#41444d', '#35373f', '#444750'], 2.2);
  // Tyre-darkened lanes.
  g.fillStyle = 'rgba(20,20,26,0.18)';
  g.fillRect(X(-12), Z(7.6), 24 * S, 0.7 * S); g.fillRect(X(-12), Z(9.9), 24 * S, 0.7 * S);
  g.fillRect(X(7.5), Z(-12), 0.7 * S, 18.5 * S); g.fillRect(X(9.8), Z(-12), 0.7 * S, 18.5 * S);
  // Patch repairs.
  g.fillStyle = 'rgba(25,26,31,0.45)'; g.fillRect(X(-8.2), Z(8.1), 2.3 * S, 1.4 * S); g.fillRect(X(8.9), Z(-5.5), 1.6 * S, 2.6 * S);

  // Lot surfaces (raised block): forecourt concrete, alley, backyard.
  rectW(g, -12, -12, 6.5, 6.5, '#85837c');
  speckle(g, -12, -12, 6.5, 6.5, 30000, ['#807e77', '#8a8881', '#7d7b74'], 2);
  g.strokeStyle = 'rgba(70,68,64,0.6)'; g.lineWidth = 1.5; // expansion joints
  for (let x = -4; x <= 5; x += 2.25) { g.beginPath(); g.moveTo(X(x), Z(-0.2)); g.lineTo(X(x), Z(5)); g.stroke(); }
  g.beginPath(); g.moveTo(X(-4), Z(2.4)); g.lineTo(X(5), Z(2.4)); g.stroke();
  rectW(g, -6.4, -12, -4, 5, '#6f6d68'); // alley
  speckle(g, -6.4, -12, -4, 5, 9000, ['#5f5d59', '#7a7873', '#66645f'], 2.5);
  rectW(g, -5.35, -12, -5.05, 5, '#4c4b48'); // alley drain channel
  g.fillStyle = '#2a2b2d';
  for (let z = -11.5; z < 4.8; z += 0.16) g.fillRect(X(-5.33), Z(z), 0.26 * S, 0.05 * S);
  rectW(g, -4, -12, 6.5, -7.2, '#77756f'); // backyard
  speckle(g, -4, -12, 6.5, -7.2, 12000, ['#6a6863', '#83817b'], 2.5);

  // Sidewalks along both roads.
  paving(g, -12, 5, 6.5, 6.5, 0.3, '#8f8a85', '#7e7a76', '#5d5a57');
  paving(g, 5, -12, 6.5, 6.5, 0.3, '#8f8a85', '#7e7a76', '#5d5a57');
  paving(g, -12, 11.2, 12, 12, 0.3, '#8f8a85', '#7e7a76', '#5d5a57');
  paving(g, 11.2, -12, 12, 6.5, 0.3, '#8f8a85', '#7e7a76', '#5d5a57');
  // Tactile paving at the crossings.
  tactile(g, 1.4, 5.65, 4.2, 5.95); tactile(g, 1.4, 11.35, 4.2, 11.65);
  tactile(g, 5.65, -10.5, 5.95, -7.7); tactile(g, 11.35, -10.5, 11.65, -7.7);
  // Line of yellow paving along the shop front sidewalk.
  tactile(g, -12, 5.7, 1.4, 5.92);

  // Gutters at the road edge.
  gutterStripX(g, -12, 5.0, 6.5, 6.85); gutterStripX(g, -12, 12, 10.85, 11.2);
  gutterStripZ(g, -12, 5.0, 6.5, 6.85); gutterStripZ(g, -12, 6.5, 10.85, 11.2);

  // Road markings.
  g.fillStyle = 'rgba(232,230,222,0.9)';
  const lineX = (x0, x1, z, w = 0.15) => g.fillRect(X(x0), Z(z - w / 2), (x1 - x0) * S, w * S);
  const lineZ = (z0, z1, x, w = 0.15) => g.fillRect(X(x - w / 2), Z(z0), w * S, (z1 - z0) * S);
  lineX(-12, 1.0, 7.05); lineX(4.6, 6.3, 7.05); lineX(-12, 1.0, 10.65); lineX(4.6, 12, 10.65);
  lineZ(-12, -11.0, 7.05); lineZ(-7.2, 5.6, 7.05); lineZ(-12, -11.0, 10.65); lineZ(-7.2, 6.3, 10.65);
  // Crosswalk across road A.
  for (let z = 7.0; z < 10.8; z += 0.9) g.fillRect(X(1.4), Z(z), 2.8 * S, 0.45 * S);
  // Mid-block crosswalk across road B.
  for (let x = 6.95; x < 10.8; x += 0.9) g.fillRect(X(x), Z(-10.5), 0.45 * S, 2.8 * S);
  // Stop line + 止まれ in the lane heading into the junction.
  g.fillRect(X(8.9), Z(5.55), 2.1 * S, 0.45 * S);
  roadText(g, '止まれ', 9.95, 3.1, Math.PI, 1.7, 3.6);
  // Diamond "crossing ahead" marks.
  const diamond = (x, z, rot) => {
    g.save(); g.translate(X(x), Z(z)); g.rotate(rot);
    g.strokeStyle = 'rgba(232,230,222,0.88)'; g.lineWidth = 0.15 * S;
    g.beginPath(); g.moveTo(0, -1.6 * S); g.lineTo(0.45 * S, 0); g.lineTo(0, 1.6 * S); g.lineTo(-0.45 * S, 0); g.closePath(); g.stroke();
    g.restore();
  };
  diamond(-4.5, 9.8, Math.PI / 2); diamond(9.8, -3.2, 0);
  // Wear on paint.
  speckle(g, -12, 6.5, 12, 11.2, 14000, ['rgba(60,63,72,0.75)'], 3);
  speckle(g, 6.5, -12, 11.2, 6.5, 9000, ['rgba(60,63,72,0.75)'], 3);

  // Parking bays on the forecourt.
  g.fillStyle = 'rgba(236,234,228,0.92)';
  for (const x of [-3.9, -1.6, 0.7]) g.fillRect(X(x - 0.06), Z(1.0), 0.12 * S, 3.7 * S);
  g.fillRect(X(-3.9), Z(0.94), 4.6 * S, 0.12 * S);
  speckle(g, -4, 0.9, 0.8, 4.8, 2500, ['rgba(120,118,112,0.8)'], 3);
  // Oil stains in the bays.
  g.fillStyle = 'rgba(40,38,36,0.25)';
  for (const [x, z] of [[-2.7, 2.6], [-0.4, 2.9], [-2.9, 3.6]]) { g.beginPath(); g.ellipse(X(x), Z(z), 0.5 * S, 0.3 * S, 0.3, 0, 7); g.fill(); }

  manhole(g, -6.8, 8.9); manhole(g, 8.8, -4.4); manhole(g, 3.0, -9.5);
}

// R = puddle mask, G = wetness (reflectivity), B = dry shelter.
function drawWet(g, W) {
  const s = W / 24, x = (v) => (v + 12) * s, z = (v) => (v + 12) * s;
  g.fillStyle = 'rgb(0,150,0)'; g.fillRect(0, 0, W, W);              // road: quite wet
  g.fillStyle = 'rgb(0,105,0)'; g.fillRect(x(-12), z(-12), 18.5 * s, 18.5 * s); // lot
  g.fillStyle = 'rgb(0,95,0)'; g.fillRect(x(-12), z(5), 18.5 * s, 1.5 * s); g.fillRect(x(5), z(-12), 1.5 * s, 18.5 * s);
  g.fillStyle = 'rgb(0,25,255)'; g.fillRect(x(-4.3), z(-0.3), 8.2 * s, 1.55 * s); // under the canopy: dry
  // Puddles: soft blobs, thresholded in the shader for crisp edges.
  const blob = (cx, cz, rx, rz, k = 1) => {
    for (let i = 0; i < 5; i++) {
      const ox = (rand() - 0.5) * rx, oz = (rand() - 0.5) * rz;
      const rad = Math.max(rx, rz) * (0.55 + rand() * 0.45);
      const gr = g.createRadialGradient(x(cx + ox), z(cz + oz), 0, x(cx + ox), z(cz + oz), rad * s);
      gr.addColorStop(0, `rgba(255,0,0,${0.85 * k})`); gr.addColorStop(1, 'rgba(255,0,0,0)');
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr;
      g.translate(x(cx + ox), z(cz + oz)); g.scale(rx / Math.max(rx, rz), rz / Math.max(rx, rz)); g.translate(-x(cx + ox), -z(cz + oz));
      g.beginPath(); g.arc(x(cx + ox), z(cz + oz), rad * s, 0, 7); g.fill(); g.restore();
    }
  };
  blob(-2.0, 7.5, 2.4, 0.55); blob(4.2, 7.3, 1.6, 0.5); blob(-8.5, 10.3, 2.2, 0.6); blob(6.0, 9.4, 1.8, 1.2);
  blob(7.5, 1.0, 0.6, 2.4); blob(10.2, -6.0, 0.55, 2.0); blob(8.4, -10.8, 1.3, 0.8); blob(0.5, 9.0, 1.2, 0.7);
  blob(-1.6, 3.6, 1.1, 0.6); blob(2.5, 4.2, 0.9, 0.45); blob(-5.2, -2.0, 0.5, 1.6); blob(-5.1, 3.8, 0.45, 0.8);
  blob(1.0, -9.4, 1.6, 0.9); blob(-8.0, 5.8, 0.9, 0.3); blob(4.7, -3.2, 0.3, 1.2);
}

const GROUND_PARS = /* glsl */`
  varying vec3 vGW; varying vec4 vRC;
  uniform float uTime; uniform sampler2D uReflTex; uniform sampler2D uWet; uniform float uReflBoost;
  float gh21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  vec2 gh22(vec2 p){ float n = gh21(p); return vec2(n, gh21(p + n)); }
  vec3 rainRipples(vec2 p, float t) {
    vec2 acc = vec2(0.0); float ring = 0.0;
    for (int L = 0; L < 2; L++) {
      float sc = L == 0 ? 2.1 : 3.3;
      vec2 q = p * sc + float(L) * 17.31;
      vec2 id = floor(q);
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        vec2 cid = id + vec2(float(i), float(j));
        vec2 rnd = gh22(cid);
        float period = 1.5 + rnd.x * 1.2;
        float ph = fract(t / period + rnd.y);
        vec2 c = cid + 0.15 + 0.7 * gh22(cid + 3.7);
        vec2 d = q - c;
        float dist = length(d);
        float x = (dist - ph * 0.85) * 10.0;
        float f = exp(-x * x) * (1.0 - ph) * (1.0 - ph) * step(0.45, gh21(cid + 9.1));
        acc += (d / (dist + 1e-4)) * (-x) * f;
        ring += f;
      }
    }
    return vec3(acc, ring);
  }
`;
const GROUND_MAIN = /* glsl */`
  {
    vec2 wuv = vec2((vGW.x + 12.0) / 24.0, 1.0 - (vGW.z + 12.0) / 24.0);
    vec4 wet = texture2D(uWet, wuv);
    float puddle = smoothstep(0.42, 0.5, wet.r);
    float wetness = wet.g * (1.0 - wet.b);
    float dry = wet.b;
    vec3 rp = rainRipples(vGW.xz, uTime) * (1.0 - dry);
    vec3 V = normalize(cameraPosition - vGW);
    float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
    vec2 ruv = vRC.xy / vRC.w + rp.xy * mix(0.004, 0.012, puddle);
    float blurY = mix(0.0065, 0.0016, puddle);
    vec3 refl = vec3(0.0); float ws = 0.0;
    for (int i = -6; i <= 6; i++) {
      float fi = float(i);
      float w = exp(-fi * fi / 18.0);
      refl += texture2D(uReflTex, ruv + vec2(fi * blurY * 0.12, fi * blurY)).rgb * w;
      ws += w;
    }
    refl /= ws;
    float reflK = mix(wetness * 0.75, 0.95, puddle) * (0.45 + 0.55 * fres) * uReflBoost;
    outgoingLight *= mix(1.0, 0.74, wetness) * mix(1.0, 0.32, puddle);
    outgoingLight += refl * reflK;
    outgoingLight += vec3(0.5, 0.62, 0.9) * clamp(rp.z, 0.0, 1.0) * 0.035 * (0.3 + puddle);
  }
`;

export function makeWetMaterial(map, wetTex, { color = 0xffffff, boost = 1 } = {}) {
  const m = new THREE.MeshToonMaterial({ color, map, gradientMap: GRADIENT });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time;
    sh.uniforms.uReflTex = U.reflTex;
    sh.uniforms.uReflMatrix = U.reflMatrix;
    sh.uniforms.uWet = { value: wetTex };
    sh.uniforms.uReflBoost = { value: boost };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGW; varying vec4 vRC; uniform mat4 uReflMatrix;')
      .replace('#include <fog_vertex>', '#include <fog_vertex>\n{ vec4 gw = modelMatrix * vec4(transformed, 1.0); vGW = gw.xyz; vRC = uReflMatrix * gw; }');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GROUND_PARS)
      .replace('#include <opaque_fragment>', GROUND_MAIN + '\n#include <opaque_fragment>');
  };
  return m;
}

// UVs from world XZ so a single painted canvas covers the whole diorama top.
function worldUV(geo) {
  const p = geo.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + 12) / 24; uv[i * 2 + 1] = 1 - (p.getZ(i) + 12) / 24; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

function strataTexture() {
  return canvasTex(1024, 128, (g, w, h) => {
    const bands = [[0, 0.12, '#2b2c31'], [0.12, 0.3, '#6c6862'], [0.3, 1, '#5a4334']];
    for (const [a, b, c] of bands) { g.fillStyle = c; g.fillRect(0, a * h, w, (b - a) * h); }
    for (let i = 0; i < 2600; i++) {
      const y = 0.32 * h + Math.random() * 0.66 * h;
      g.fillStyle = Math.random() < 0.5 ? '#4a372b' : '#6d5442';
      g.beginPath(); g.ellipse(Math.random() * w, y, 1 + Math.random() * 3, 1 + Math.random() * 2, 0, 0, 7); g.fill();
    }
    for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < 0.5 ? '#827d75' : '#55524d'; g.fillRect(Math.random() * w, 0.13 * h + Math.random() * 0.16 * h, 2, 2); }
  }, { wrap: true });
}

export function buildGround() {
  const groundTex = canvasTex(2048, 2048, drawGround, { aniso: 16 });
  const wetTex = canvasTex(512, 512, drawWet, { srgb: false, mips: false });
  const groundMat = makeWetMaterial(groundTex, wetTex);
  const curbMat = toon(0xaaa79f);

  // Road surface (y = 0).
  const road = worldUV(new THREE.PlaneGeometry(24, 24).rotateX(-Math.PI / 2));
  const roadMesh = new THREE.Mesh(road, groundMat);
  roadMesh.receiveShadow = true;
  roadMesh.userData.ground = true;
  scene.add(roadMesh);

  // Raised blocks (lot + sidewalks) with rounded kerb corners.
  const H = 0.15;
  const mk = (pts, corner) => {
    const s = new THREE.Shape();
    pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
    if (corner) corner(s);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: H, bevelEnabled: false, curveSegments: 16 });
    g.rotateX(-Math.PI / 2);
    return g;
  };
  const lot = mk([[-12, -12], [6.5, -12], [6.5, 5]], (s) => {
    s.absarc(5, -5, 1.5, 0, -Math.PI / 2, true);
    s.lineTo(-12, -6.5);
  });
  const oppA = mk([[-12, 11.2], [12, 11.2], [12, 12], [-12, 12]]);
  const oppB = mk([[11.2, -12], [12, -12], [12, 6.5]], (s) => { s.absarc(12, -5.7, 0.8, -Math.PI / 2, -Math.PI, true); });
  for (const g of [lot, oppA, oppB]) {
    worldUV(g);
    const mesh = new THREE.Mesh(g, [groundMat, curbMat]);
    mesh.receiveShadow = true; mesh.castShadow = true;
    mesh.userData.ground = true;
    scene.add(mesh);
  }

  // Cut-away slab and display plinth.
  const strata = strataTexture();
  strata.repeat.set(4, 1);
  const slabMat = toon(0xffffff, { map: strata });
  box(slabMat, 24, 0.69, 24, 0, -0.7, 0, { shadow: false });
  const wood = toon(0x3a2620);
  const woodLight = toon(0x5b3c2c);
  box(woodLight, 24.5, 0.08, 24.5, 0, -0.78, 0, { shadow: false });
  box(wood, 24.9, 0.9, 24.9, 0, -1.68, 0, { shadow: false });
  box(toon(0x1a1416), 25.3, 0.14, 25.3, 0, -1.82, 0, { shadow: false });
  box(toon(0xa88a55), 25.0, 0.03, 25.0, 0, -0.81, 0, { shadow: false }); // brass inlay line

  return { groundMat, groundTex, wetTex };
}
