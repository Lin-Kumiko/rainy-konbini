// Core: renderer, camera, controls, shared uniforms, materials and a static-geometry batcher.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export { THREE };

// Layer 1 = effects (rain, glass, decals). Excluded from the outline normal pass and the reflection pass.
export const LAYER_FX = 1;

export const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.NoToneMapping;
document.body.appendChild(renderer.domElement);

export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 260);
camera.layers.enable(LAYER_FX);
{
  const r = 43, polar = THREE.MathUtils.degToRad(57), az = THREE.MathUtils.degToRad(36);
  camera.position.set(r * Math.sin(polar) * Math.sin(az), r * Math.cos(polar), r * Math.sin(polar) * Math.cos(az));
}

export const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.2, 0.8, 0.2);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.8;
controls.panSpeed = 0.6;
controls.minDistance = 13;
controls.maxDistance = 78;
controls.minPolarAngle = THREE.MathUtils.degToRad(8);
controls.maxPolarAngle = THREE.MathUtils.degToRad(86);
controls.screenSpacePanning = true;
controls.update();
// Keep the pivot on the diorama so it can never be panned away.
controls.addEventListener('change', () => {
  const t = controls.target;
  const cx = THREE.MathUtils.clamp(t.x, -9, 9), cy = THREE.MathUtils.clamp(t.y, 0, 6), cz = THREE.MathUtils.clamp(t.z, -9, 9);
  if (cx !== t.x || cy !== t.y || cz !== t.z) {
    const d = new THREE.Vector3(cx - t.x, cy - t.y, cz - t.z);
    t.add(d); camera.position.add(d);
  }
});

// Uniforms shared by many shaders.
export const U = {
  time: { value: 0 },
  reflTex: { value: null },
  reflMatrix: { value: new THREE.Matrix4() },
  reflRes: { value: new THREE.Vector2(1, 1) },
};

export const REFLECT_Y = 0.075;

// ---------- Toon materials ----------
function makeGradient(stops) {
  const n = 64, data = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const c = (i + 0.5) / n;
    let v = stops[stops.length - 1][1];
    for (const [edge, val] of stops) { if (c < edge) { v = val; break; } }
    data[i] = Math.round(v * 255);
  }
  const t = new THREE.DataTexture(data, n, 1, THREE.RedFormat, THREE.UnsignedByteType);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}
export const GRADIENT = makeGradient([[0.47, 0.3], [0.6, 0.64], [2, 1.0]]);

const toonCache = new Map();
export function toon(hex, opts = {}) {
  const key = hex + JSON.stringify(opts);
  if (toonCache.has(key)) return toonCache.get(key);
  const m = new THREE.MeshToonMaterial({ color: hex, gradientMap: GRADIENT, ...opts });
  toonCache.set(key, m);
  return m;
}

// Unlit glowing material (HDR colour so bloom picks it up).
const glowCache = new Map();
export function glow(hex, intensity = 1, opts = {}) {
  const key = hex + '|' + intensity + JSON.stringify(Object.keys(opts));
  if (!opts.map && glowCache.has(key)) return glowCache.get(key);
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(intensity), ...opts });
  if (!opts.map) glowCache.set(key, m);
  return m;
}

// Interior material: lit by a baked "ceiling panel" key instead of scene lights, so the shop
// reads bright and warm without its lights leaking onto the street.
const interiorVS = /* glsl */`
  #ifdef ATLAS
  attribute float aCell;
  uniform float uAtlasN;
  #endif
  varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec3 vCol;
  void main() {
    vec4 p = vec4(position, 1.0);
    vec3 n = normal;
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
      n = mat3(instanceMatrix) * n;
    #endif
    vec4 w = modelMatrix * p;
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * n);
    vUv = uv;
    #ifdef ATLAS
      float cs = 1.0 / uAtlasN;
      vUv = uv * cs + vec2(mod(aCell, uAtlasN), floor(aCell / uAtlasN)) * cs;
    #endif
    vCol = vec3(1.0);
    #ifdef USE_INSTANCING_COLOR
      vCol = instanceColor;
    #endif
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const interiorFS = /* glsl */`
  uniform vec3 uColor; uniform float uGlow; uniform vec3 uLight;
  #ifdef USE_TEX
  uniform sampler2D uMap;
  #endif
  varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec3 vCol;
  void main() {
    vec3 base = uColor * vCol;
    #ifdef USE_TEX
      vec4 t = texture2D(uMap, vUv);
      base *= t.rgb;
    #endif
    vec3 n = normalize(vN);
    float k = dot(n, normalize(vec3(0.3, 1.0, 0.55)));
    float band = k > 0.3 ? 1.0 : (k > -0.2 ? 0.8 : 0.62);
    float ao = mix(0.74, 1.0, smoothstep(0.15, 1.7, vW.y));
    vec3 col = base * uLight * band * ao + base * uGlow;
    gl_FragColor = vec4(col, 1.0);
  }`;
export const INTERIOR_LIGHT = new THREE.Color(1.22, 1.1, 0.92);
const interiorCache = new Map();
export function interior(hex, { map = null, glow: g = 0.12, atlasN = 0 } = {}) {
  const key = hex + '|' + (map ? map.uuid : '') + '|' + g + '|' + atlasN;
  if (interiorCache.has(key)) return interiorCache.get(key);
  const defines = {};
  if (map) defines.USE_TEX = '';
  if (atlasN) defines.ATLAS = '';
  const m = new THREE.ShaderMaterial({
    defines,
    uniforms: {
      uColor: { value: new THREE.Color(hex) },
      uGlow: { value: g },
      uLight: { value: INTERIOR_LIGHT },
      uMap: { value: map },
      uAtlasN: { value: atlasN },
    },
    vertexShader: interiorVS,
    fragmentShader: interiorFS,
  });
  interiorCache.set(key, m);
  return m;
}

// ---------- Static geometry batcher (merges by material) ----------
const _stack = [new THREE.Matrix4()];
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
export function push(x = 0, y = 0, z = 0, ry = 0, s = 1) {
  _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(s, s, s));
  _stack.push(_stack[_stack.length - 1].clone().multiply(_m));
}
export function pop() { _stack.pop(); }
export function topMatrix() { return _stack[_stack.length - 1]; }

const batches = new Map();
function normalizeGeo(g) {
  let geo = g.index ? g.toNonIndexed() : g;
  for (const name of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geo.deleteAttribute(name);
  if (!geo.attributes.normal) geo.computeVertexNormals();
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
  geo.clearGroups();
  return geo;
}
// opts: { shadow: cast shadows (default true), receive (default true), fx: put on FX layer }
export function add(mat, geo, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, shadow = true, receive = true, fx = false } = {}) {
  _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(sx, sy, sz));
  geo.applyMatrix4(_m);
  geo.applyMatrix4(topMatrix());
  const key = mat.uuid + (shadow ? 's' : '') + (receive ? 'r' : '') + (fx ? 'f' : '');
  if (!batches.has(key)) batches.set(key, { mat, shadow, receive, fx, geos: [] });
  batches.get(key).geos.push(normalizeGeo(geo));
}
// Box with its base at y.
export function box(mat, w, h, d, x, y, z, opts = {}) {
  add(mat, new THREE.BoxGeometry(w, h, d), { x, y: y + h / 2, z, ...opts });
}
export function cyl(mat, rt, rb, h, x, y, z, opts = {}) {
  const seg = opts.seg || 14;
  add(mat, new THREE.CylinderGeometry(rt, rb, h, seg), { x, y: y + h / 2, z, ...opts });
}
export function flush() {
  for (const b of batches.values()) {
    if (!b.geos.length) continue;
    const merged = mergeGeometries(b.geos, false);
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, b.mat);
    mesh.castShadow = b.shadow;
    mesh.receiveShadow = b.receive;
    mesh.matrixAutoUpdate = false;
    if (b.fx) mesh.layers.set(LAYER_FX);
    scene.add(mesh);
  }
  batches.clear();
}

// Place a standalone mesh using the current builder matrix.
export function placeMesh(mesh, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = scene } = {}) {
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz, 'YXZ');
  mesh.updateMatrix();
  mesh.matrix.premultiply(topMatrix());
  mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
  parent.add(mesh);
  return mesh;
}

// ---------- Canvas textures ----------
export const FONT_JP = '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Yu Gothic", "Meiryo", sans-serif';
export const FONT_DISPLAY = '"Dela Gothic One", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif';
export function canvasTex(w, h, draw, { srgb = true, aniso = 8, wrap = false, mips = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (!mips) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  return t;
}

// Deterministic random so the diorama is identical on every load.
let _seed = 1337;
export function rand() {
  _seed = (_seed * 16807) % 2147483647;
  return (_seed - 1) / 2147483646;
}
export const rr = (a, b) => a + (b - a) * rand();
export const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// Rounded rectangle path helper for canvas drawing.
export function rrect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
