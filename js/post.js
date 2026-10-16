// Render pipeline: planar reflection -> normal/depth pre-pass -> colour -> outlines -> bloom -> grade.
import { THREE, renderer, scene, camera, U, REFLECT_Y, LAYER_FX } from './core.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const size = new THREE.Vector2();
renderer.getDrawingBufferSize(size);

// ---- Normal + depth pre-pass (opaque layer only) ----
const normalRT = new THREE.WebGLRenderTarget(size.x, size.y, {
  depthTexture: new THREE.DepthTexture(size.x, size.y, THREE.FloatType),
});
const normalMat = new THREE.MeshNormalMaterial();

// ---- Planar reflection ----
const REFL_SCALE = 0.5;
const reflRT = new THREE.WebGLRenderTarget(Math.round(size.x * REFL_SCALE), Math.round(size.y * REFL_SCALE), { type: THREE.HalfFloatType });
U.reflTex.value = reflRT.texture;
const vCam = new THREE.PerspectiveCamera();
vCam.layers.set(0);
const _n = new THREE.Vector3(0, 1, 0), _rp = new THREE.Vector3(0, REFLECT_Y, 0), _cp = new THREE.Vector3();
const _rot = new THREE.Matrix4(), _look = new THREE.Vector3(), _tgt = new THREE.Vector3(), _view = new THREE.Vector3();
const _plane = new THREE.Plane(), _clip = new THREE.Vector4(), _q = new THREE.Vector4();
const groundMeshes = [];
export function registerGround(mesh) { groundMeshes.push(mesh); }

function renderReflection() {
  _cp.setFromMatrixPosition(camera.matrixWorld);
  _view.subVectors(_rp, _cp);
  _view.reflect(_n).negate().add(_rp);
  _rot.extractRotation(camera.matrixWorld);
  _look.set(0, 0, -1).applyMatrix4(_rot).add(_cp);
  _tgt.subVectors(_rp, _look).reflect(_n).negate().add(_rp);
  vCam.position.copy(_view);
  vCam.up.set(0, 1, 0).applyMatrix4(_rot).reflect(_n);
  vCam.lookAt(_tgt);
  vCam.far = camera.far;
  vCam.updateMatrixWorld();
  vCam.projectionMatrix.copy(camera.projectionMatrix);

  U.reflMatrix.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  U.reflMatrix.value.multiply(vCam.projectionMatrix).multiply(vCam.matrixWorldInverse);

  // Oblique near plane so nothing below the water line leaks into the mirror.
  _plane.setFromNormalAndCoplanarPoint(_n, _rp).applyMatrix4(vCam.matrixWorldInverse);
  _clip.set(_plane.normal.x, _plane.normal.y, _plane.normal.z, _plane.constant);
  const pm = vCam.projectionMatrix.elements;
  _q.x = (Math.sign(_clip.x) + pm[8]) / pm[0];
  _q.y = (Math.sign(_clip.y) + pm[9]) / pm[5];
  _q.z = -1.0;
  _q.w = (1.0 + pm[10]) / pm[14];
  _clip.multiplyScalar(2.0 / _clip.dot(_q));
  pm[2] = _clip.x; pm[6] = _clip.y; pm[10] = _clip.z + 1.0; pm[14] = _clip.w;

  for (const m of groundMeshes) m.visible = false;
  renderer.setRenderTarget(reflRT);
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  renderer.render(scene, vCam);
  for (const m of groundMeshes) m.visible = true;
}

// ---- Composer ----
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));

const outlinePass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    tNormal: { value: normalRT.texture },
    tDepth: { value: normalRT.depthTexture },
    uRes: { value: new THREE.Vector2(size.x, size.y) },
    uNear: { value: camera.near }, uFar: { value: camera.far },
    uPx: { value: 1.0 },
    uLine: { value: new THREE.Color(0x0b0a1a) },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform sampler2D tNormal; uniform sampler2D tDepth;
    uniform vec2 uRes; uniform float uNear; uniform float uFar; uniform float uPx; uniform vec3 uLine;
    varying vec2 vUv;
    float viewZ(float d) { return (uNear * uFar) / ((uFar - uNear) * d - uFar); }
    float invZ(vec2 uv) { float d = texture2D(tDepth, uv).r; return d >= 0.99999 ? 0.0 : -1.0 / viewZ(d); }
    vec3 nrm(vec2 uv) { return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      vec2 px = uPx / uRes;
      float c0 = invZ(vUv);
      float l = invZ(vUv - vec2(px.x, 0.0)), r = invZ(vUv + vec2(px.x, 0.0));
      float u = invZ(vUv + vec2(0.0, px.y)), b = invZ(vUv - vec2(0.0, px.y));
      float lap = abs(l + r - 2.0 * c0) + abs(u + b - 2.0 * c0);
      float ref = max(max(c0, max(l, r)), max(u, b));
      float depthEdge = smoothstep(0.006, 0.016, lap / max(ref, 1e-5));
      vec3 n0 = nrm(vUv);
      float nd = max(max(1.0 - dot(n0, nrm(vUv - vec2(px.x, 0.0))), 1.0 - dot(n0, nrm(vUv + vec2(px.x, 0.0)))),
                     max(1.0 - dot(n0, nrm(vUv + vec2(0.0, px.y))), 1.0 - dot(n0, nrm(vUv - vec2(0.0, px.y)))));
      float normalEdge = smoothstep(0.22, 0.42, nd) * step(1e-6, c0);
      float dist = ref > 0.0 ? 1.0 / ref : 1000.0;
      float fade = 1.0 - smoothstep(70.0, 140.0, dist);
      float e = max(depthEdge, normalEdge * 0.8) * fade;
      gl_FragColor = vec4(mix(col, col * 0.16 + uLine, e * 0.92), 1.0);
    }`,
});
composer.addPass(outlinePass);

const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.38, 0.0, 1.0);
composer.addPass(bloom);

const finalPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: normalRT.depthTexture },
    uRes: { value: new THREE.Vector2(size.x, size.y) },
    uTime: U.time,
    uExposure: { value: 1.0 },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform sampler2D tDepth; uniform vec2 uRes; uniform float uTime; uniform float uExposure;
    varying vec2 vUv;
    vec3 toSRGB(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      float aspect = uRes.x / uRes.y;
      // Gentle tilt-shift at the top and bottom edges for the miniature feel.
      float ts = smoothstep(0.3, 0.5, abs(uv.y - 0.5)) * 2.6;
      vec3 c = texture2D(tDiffuse, uv).rgb;
      if (ts > 0.02) {
        vec3 acc = c;
        for (int i = 0; i < 10; i++) {
          float a = float(i) * 2.39996;
          float rad = sqrt(float(i + 1) / 10.0) * ts;
          acc += texture2D(tDiffuse, uv + vec2(cos(a), sin(a)) * rad / uRes * 2.0).rgb;
        }
        c = acc / 11.0;
      }
      // Night backdrop wherever no geometry was drawn.
      float d = texture2D(tDepth, uv).r;
      if (d >= 0.99999) {
        vec2 q = (uv - vec2(0.5, 0.56)) * vec2(aspect, 1.0);
        float r = length(q);
        vec3 bg = mix(vec3(0.03, 0.038, 0.075), vec3(0.004, 0.005, 0.012), smoothstep(0.05, 0.95, r));
        c += bg;
      }
      c *= uExposure;
      // Hue-preserving tone curve, highlights roll toward white like cel highlights.
      float m = max(c.r, max(c.g, c.b));
      if (m > 1e-5) {
        float mm = m * (1.0 + m / 9.0) / (1.0 + m);
        c *= mm / m;
        c = mix(c, vec3(mm), smoothstep(1.2, 5.0, m) * 0.5);
      }
      // Grade: cool, lifted shadows; a touch more saturation.
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, 1.12);
      c += vec3(0.010, 0.014, 0.032) * (1.0 - smoothstep(0.0, 0.35, l));
      c = max(c, 0.0);
      vec2 vq = (uv - 0.5) * vec2(aspect, 1.0);
      c *= mix(1.0, 0.62, smoothstep(0.45, 1.25, length(vq)));
      vec3 o = toSRGB(c);
      o += (hash(uv * uRes + fract(uTime)) - 0.5) / 255.0;
      gl_FragColor = vec4(o, 1.0);
    }`,
});
composer.addPass(finalPass);
// ShaderPass clones its uniforms and drops render-target textures, so wire them up afterwards.
outlinePass.uniforms.tNormal.value = normalRT.texture;
outlinePass.uniforms.tDepth.value = normalRT.depthTexture;
finalPass.uniforms.tDepth.value = normalRT.depthTexture;
finalPass.uniforms.uTime = U.time;

export function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.getDrawingBufferSize(size);
  normalRT.setSize(size.x, size.y);
  reflRT.setSize(Math.round(size.x * REFL_SCALE), Math.round(size.y * REFL_SCALE));
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(w, h);
  outlinePass.uniforms.uRes.value.set(size.x, size.y);
  finalPass.uniforms.uRes.value.set(size.x, size.y);
  outlinePass.uniforms.uPx.value = Math.max(1, renderer.getPixelRatio() * 0.75);
}
resize();

let shadowsDirty = true;
export function updateShadows() { shadowsDirty = true; }
export function render() {
  if (size.x < 2 || size.y < 2) return;
  renderReflection();
  // Normal/depth pre-pass, opaque layer only. Static shadow maps are refreshed here on demand.
  camera.layers.set(0);
  if (shadowsDirty) { renderer.shadowMap.needsUpdate = true; shadowsDirty = false; }
  scene.overrideMaterial = normalMat;
  renderer.setRenderTarget(normalRT);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(scene, camera);
  scene.overrideMaterial = null;
  camera.layers.enable(LAYER_FX);
  renderer.setClearColor(0x000000, 1);
  composer.render();
}

export function setPixelRatio(pr) {
  renderer.setPixelRatio(pr);
  resize();
}
