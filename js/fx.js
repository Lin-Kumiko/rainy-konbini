// Weather effects, all animated on the GPU: rain streaks, splash rings, eave drips, spout stream, oden steam.
import { THREE, scene, camera, U, LAYER_FX, rand, rr } from './core.js';

// Lights that tint nearby rain (position, colour, radius). Index 5 follows the traffic signal.
export const RAIN_LIGHTS = [
  [new THREE.Vector3(7.55, 5.0, 5.5), new THREE.Color(0.75, 0.85, 1.25), 2.6],
  [new THREE.Vector3(0.0, 2.4, 1.8), new THREE.Color(1.1, 0.85, 0.55), 2.2],
  [new THREE.Vector3(4.2, 2.0, -0.75), new THREE.Color(0.35, 0.95, 0.85), 1.4],
  [new THREE.Vector3(4.9, 1.3, -5.75), new THREE.Color(0.6, 0.8, 1.2), 1.6],
  [new THREE.Vector3(-7.45, 1.9, 3.4), new THREE.Color(1.3, 0.25, 0.15), 1.4],
  [new THREE.Vector3(9.35, 4.4, -6.9), new THREE.Color(0.2, 1.0, 0.7), 1.6],
];
const lightUniforms = {
  uLP: { value: RAIN_LIGHTS.map((l) => l[0]) },
  uLC: { value: RAIN_LIGHTS.map((l) => l[1]) },
  uLR: { value: RAIN_LIGHTS.map((l) => l[2]) },
};
const LIGHT_GLSL = /* glsl */`
  uniform vec3 uLP[6]; uniform vec3 uLC[6]; uniform float uLR[6];
  vec3 rainLight(vec3 p) {
    vec3 c = vec3(0.0);
    for (int i = 0; i < 6; i++) { vec3 d = p - uLP[i]; c += uLC[i] * exp(-dot(d, d) / (uLR[i] * uLR[i])); }
    return c;
  }`;

// Sheltered volumes: xmin, zmin, xmax, zmax and roof height.
const SHELTERS = [
  [new THREE.Vector4(-4.15, -7.1, 3.95, 1.32), 3.9],
  [new THREE.Vector4(-12.3, -5.0, -6.1, 3.35), 7.2],
  [new THREE.Vector4(3.66, -6.85, 4.46, -4.72), 2.0],
  [new THREE.Vector4(-10.1, 2.8, -7.9, 3.75), 2.85],
];

function quadGeo(count, attrs) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('corner', new THREE.Float32BufferAttribute([-1, 0, 1, 0, 1, 1, -1, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 3));
  for (const [name, size, data] of attrs) g.setAttribute(name, new THREE.InstancedBufferAttribute(data, size));
  g.instanceCount = count;
  return g;
}
function fxMesh(geo, mat, order = 1) {
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  m.layers.set(LAYER_FX);
  m.renderOrder = order;
  scene.add(m);
  return m;
}

// ---------------- Rain ----------------
function buildRain(count) {
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    seeds[i * 4] = rr(-12, 12); seeds[i * 4 + 1] = rr(-12, 12); seeds[i * 4 + 2] = rand(); seeds[i * 4 + 3] = rand();
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.time, uCam: { value: camera.position }, uWind: { value: new THREE.Vector3(0.12, 0, 0.05) },
      uHeight: { value: 15.0 }, uOpacity: { value: 0.36 },
      uShelter: { value: SHELTERS.map((s) => s[0]) }, uShelterY: { value: SHELTERS.map((s) => s[1]) },
      ...lightUniforms,
    },
    vertexShader: /* glsl */`
      attribute vec2 corner; attribute vec4 aSeed;
      uniform float uTime; uniform vec3 uCam; uniform vec3 uWind; uniform float uHeight;
      uniform vec4 uShelter[4]; uniform float uShelterY[4];
      ${LIGHT_GLSL}
      varying float vAlong; varying float vSide; varying float vVis; varying vec3 vCol;
      void main() {
        vec3 dir = normalize(vec3(uWind.x, -1.0, uWind.z));
        float travel = uHeight / -dir.y;
        float speed = 6.5 + aSeed.w * 2.0;
        float s = fract(aSeed.z + uTime * speed / travel);
        vec3 ground = vec3(aSeed.x, 0.0, aSeed.y);
        vec3 head = ground - dir * travel * (1.0 - s);
        float vis = smoothstep(0.0, 0.1, s) * (1.0 - smoothstep(6.5, 11.0, head.y));
        for (int i = 0; i < 4; i++) {
          vec4 b = uShelter[i];
          if (head.x > b.x && head.x < b.z && head.z > b.y && head.z < b.w && head.y < uShelterY[i]) vis = 0.0;
        }
        if (abs(head.x) > 12.0 || abs(head.z) > 12.0) vis = 0.0;
        float len = 0.18 + 0.16 * aSeed.w;
        vec3 p = head - dir * len * corner.y;
        vec3 toCam = normalize(uCam - p);
        vec3 side = normalize(cross(dir, toCam));
        float dist = length(uCam - p);
        p += side * corner.x * max(0.006, dist * 0.0008);
        vAlong = corner.y; vSide = corner.x; vVis = vis * smoothstep(2.0, 6.0, dist);
        vCol = vec3(0.3, 0.35, 0.46) + rainLight(p) * 1.6;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uOpacity;
      varying float vAlong; varying float vSide; varying float vVis; varying vec3 vCol;
      void main() {
        float a = (1.0 - vAlong) * (1.0 - abs(vSide)) * vVis * uOpacity;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vCol, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  fxMesh(quadGeo(count, [['aSeed', 4, seeds]]), mat, 3);
}

// ---------------- Splash rings ----------------
function surfaceAt(x, z) {
  if (x > -4.15 && x < 3.95 && z > -0.2 && z < 1.3) return 3.13;          // canopy top
  if (x > -3.85 && x < 3.45 && z > -6.85 && z < -0.35) return 3.475;       // store roof
  if (x > -4.15 && x < 3.95 && z > -7.1 && z < 1.3) return null;           // walls / edges
  if (x > -12.3 && x < -6.1 && z > -5.0 && z < 3.35) return null;          // izakaya roof (sloped)
  if (x > 3.66 && x < 4.46 && z > -6.85 && z < -4.72) return 1.99;         // vending tops
  const raised = (x < 6.5 && z < 6.5) || z > 11.2 || (x > 11.2 && z < 6.5);
  return raised ? 0.155 : 0.005;
}
const splashes = [];
function addSplash(x, y, z, period, phase, size = 1) { splashes.push([x, y, z, period, phase, size]); }

function buildSplashMesh() {
  const n = splashes.length;
  const pos = new Float32Array(n * 3), sd = new Float32Array(n * 3);
  splashes.forEach((s, i) => { pos.set([s[0], s[1], s[2]], i * 3); sd.set([s[3], s[4], s[5]], i * 3); });
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, ...lightUniforms },
    vertexShader: /* glsl */`
      attribute vec2 corner; attribute vec3 aPos; attribute vec3 aSd;
      uniform float uTime;
      ${LIGHT_GLSL}
      varying vec2 vQ; varying float vT; varying vec3 vCol;
      void main() {
        float t = fract(uTime / aSd.x + aSd.y);
        float r = (0.025 + 0.12 * sqrt(t)) * aSd.z;
        vec2 q = vec2(corner.x, corner.y * 2.0 - 1.0);
        vec3 p = aPos + vec3(q.x * r, 0.004, q.y * r);
        vQ = q; vT = t;
        vCol = vec3(0.4, 0.46, 0.6) + rainLight(aPos + vec3(0.0, 0.3, 0.0)) * 1.6;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying float vT; varying vec3 vCol;
      void main() {
        float d = length(vQ);
        float ring = smoothstep(0.72, 0.9, d) * smoothstep(1.0, 0.9, d);
        float dot0 = smoothstep(0.35, 0.0, d) * smoothstep(0.25, 0.0, vT);
        float a = (ring * (1.0 - vT) * (1.0 - vT) + dot0 * 0.6) * 0.38;
        if (a < 0.004) discard;
        gl_FragColor = vec4(vCol, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  fxMesh(quadGeo(n, [['aPos', 3, pos], ['aSd', 3, sd]]), mat, 3);
}

// ---------------- Drips and streams ----------------
const drips = [];
// origin, velocity, period, hang fraction, phase, ground height
function addDrip(o, v, period, hang, phase, groundY) { drips.push([o, v, period, hang, phase, groundY]); }

function buildDripMesh() {
  const n = drips.length;
  const o = new Float32Array(n * 3), v = new Float32Array(n * 3), p = new Float32Array(n * 4);
  drips.forEach((d, i) => { o.set(d[0], i * 3); v.set(d[1], i * 3); p.set([d[2], d[3], d[4], d[5]], i * 4); });
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uCam: { value: camera.position }, ...lightUniforms },
    vertexShader: /* glsl */`
      attribute vec2 corner; attribute vec3 aO; attribute vec3 aV; attribute vec4 aP;
      uniform float uTime; uniform vec3 uCam;
      ${LIGHT_GLSL}
      varying float vAlong; varying float vSide; varying float vVis; varying vec3 vCol;
      void main() {
        float t = fract(uTime / aP.x + aP.z) * aP.x;
        float hang = aP.y * aP.x;
        float tau = max(0.0, t - hang);
        vec3 vel = aV + vec3(0.0, -9.8, 0.0) * tau;
        vec3 head = aO + aV * tau + vec3(0.0, -4.9, 0.0) * tau * tau;
        float grow = hang > 0.0 ? smoothstep(0.0, hang, t) : 1.0;
        float vis = head.y > aP.w ? 1.0 : 0.0;
        float spd = length(vel);
        vec3 dir = spd > 0.01 ? vel / spd : vec3(0.0, -1.0, 0.0);
        float len = 0.025 + spd * 0.035;
        vec3 pos = head - dir * len * corner.y;
        vec3 side = normalize(cross(dir, normalize(uCam - pos)));
        pos += side * corner.x * (0.012 + 0.006 * grow);
        vAlong = corner.y; vSide = corner.x; vVis = vis * (0.4 + 0.6 * grow);
        vCol = vec3(0.45, 0.52, 0.66) + rainLight(pos) * 1.5;
        gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
      }`,
    fragmentShader: /* glsl */`
      varying float vAlong; varying float vSide; varying float vVis; varying vec3 vCol;
      void main() {
        float a = (1.0 - vAlong * 0.7) * (1.0 - abs(vSide)) * vVis * 0.85;
        if (a < 0.004) discard;
        gl_FragColor = vec4(vCol, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  fxMesh(quadGeo(n, [['aO', 3, o], ['aV', 3, v], ['aP', 4, p]]), mat, 3);
}

function eaveLine(x0, x1, z, y, groundY, step) {
  for (let x = x0; x <= x1; x += step * rr(0.7, 1.3)) {
    const period = rr(1.4, 3.6), hang = rr(0.45, 0.7), phase = rand();
    addDrip([x, y, z], [0, 0, 0], period, hang, phase, groundY);
    // ring where it lands, timed to the impact
    const tLand = hang * period + Math.sqrt(2 * (y - groundY) / 9.8);
    addSplash(x, groundY, z, period, (((phase - tLand / period) % 1) + 1) % 1, 1.2);
  }
}

function spout(o, v, groundY) {
  for (let i = 0; i < 26; i++) addDrip(o, [v[0] * rr(0.85, 1.15), v[1], v[2] * rr(0.85, 1.15)], 0.42, 0, i / 26, groundY);
  // estimated landing point
  const tL = (v[1] + Math.sqrt(v[1] * v[1] + 2 * 9.8 * (o[1] - groundY))) / 9.8;
  const lx = o[0] + v[0] * tL, lz = o[2] + v[2] * tL;
  for (let i = 0; i < 6; i++) addSplash(lx + rr(-0.06, 0.06), groundY, lz + rr(-0.06, 0.06), rr(0.35, 0.6), rand(), 0.9);
}

// ---------------- Steam ----------------
function buildSteam() {
  const n = 14, sd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) sd.set([1.4 + rr(0, 0.25), 1.43, -3.48 + rr(-0.12, 0.12), i / n], i * 4);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time },
    vertexShader: /* glsl */`
      attribute vec2 corner; attribute vec4 aS;
      uniform float uTime;
      varying vec2 vQ; varying float vT;
      void main() {
        float t = fract(uTime * 0.28 + aS.w);
        vec3 c = aS.xyz + vec3(sin(t * 6.0 + aS.w * 20.0) * 0.05, t * 0.7, 0.0);
        float s = 0.06 + t * 0.16;
        vec4 mv = viewMatrix * vec4(c, 1.0);
        vec2 q = vec2(corner.x, corner.y * 2.0 - 1.0);
        mv.xy += q * s;
        vQ = q; vT = t;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying float vT;
      void main() {
        float a = smoothstep(1.0, 0.2, length(vQ)) * smoothstep(0.0, 0.15, vT) * (1.0 - vT) * 0.22;
        gl_FragColor = vec4(vec3(1.0, 0.97, 0.92), a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  fxMesh(quadGeo(n, [['aS', 4, sd]]), mat, 1);
}

// ---------------- Light pools (soft additive decals under lamps) ----------------
const poolGeo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
let signalPool = null;
function lightPool(x, y, z, rx, rz, color, intensity) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uI: { value: intensity } },
    vertexShader: /* glsl */`varying vec2 vQ; void main(){ vQ = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uI; varying vec2 vQ;
      void main() {
        float d = length(vQ);
        float soft = pow(max(0.0, 1.0 - d), 1.6);
        float band = smoothstep(0.42, 0.47, 1.0 - d) * 0.35;
        gl_FragColor = vec4(uColor * uI * (soft + band), 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const m = new THREE.Mesh(poolGeo, mat);
  m.position.set(x, y, z);
  m.scale.set(rx, 1, rz);
  m.layers.set(LAYER_FX);
  m.renderOrder = 0;
  scene.add(m);
  return m;
}

export function buildFx() {
  lightPool(7.9, 0.012, 6.0, 3.4, 3.4, 0x9fb6ff, 0.22);
  lightPool(4.9, 0.162, -5.75, 0.9, 1.5, 0xbcd4ff, 0.3);
  lightPool(-7.45, 0.162, 3.6, 1.1, 1.0, 0xff4030, 0.3);
  lightPool(-9.0, 0.162, 3.7, 1.4, 1.0, 0xffb066, 0.26);
  lightPool(-5.4, 0.162, -1.2, 1.2, 1.4, 0xffc27a, 0.3);
  lightPool(4.35, 0.162, -0.6, 0.8, 1.0, 0x5fe6d0, 0.18);
  lightPool(3.25, 0.162, 1.55, 0.6, 0.5, 0xff9a7a, 0.16);
  signalPool = lightPool(9.35, 0.012, -6.4, 1.4, 2.6, 0x1fe0b0, 0.14);
  buildRain(2000);
  // random splashes over every exposed surface
  for (let i = 0; i < 550; i++) {
    const x = rr(-11.9, 11.9), z = rr(-11.9, 11.9), y = surfaceAt(x, z);
    if (y === null) continue;
    addSplash(x, y, z, rr(0.9, 1.8), rand(), rr(0.7, 1.1));
  }
  eaveLine(-4.05, 3.85, 1.36, 3.0, 0.155, 0.5);                 // shop canopy gutter
  eaveLine(-12.0, -6.4, 3.32, 5.42, 0.155, 0.55);               // izakaya roof edge
  eaveLine(-10.05, -7.95, 3.78, 2.72, 0.155, 0.45);              // izakaya entrance eave
  eaveLine(-11.4, -9.8, 5.48, 2.04, 0.155, 0.4);                 // notice board roof
  for (const z of [-6.7, -6.2, -5.8, -5.2, -4.8]) addDrip([4.47, 1.99, z], [0, 0, 0], rr(2, 4), 0.6, rand(), 0.155);
  spout([-3.76, 0.32, -0.06], [0.55, 0.05, 0.42], 0.155);       // front-left downspout
  spout([3.76, 0.32, -6.82], [0.6, 0.05, 0.1], 0.155);
  buildSplashMesh();
  buildDripMesh();
  buildSteam();
}

export function updateFx(signalColor) {
  if (!signalColor) return;
  RAIN_LIGHTS[5][1].copy(signalColor).multiplyScalar(0.9);
  if (signalPool) signalPool.material.uniforms.uColor.value.copy(signalColor);
}
