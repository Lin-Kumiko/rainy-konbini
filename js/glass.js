// Window glass with procedural raindrops: beaded droplets plus drops that slide down in bursts.
import { THREE, U, LAYER_FX, placeMesh } from './core.js';

const vs = /* glsl */`
  uniform vec2 uSize;
  varying vec2 vP; varying vec3 vWP; varying vec3 vWN;
  void main() {
    vP = uv * uSize;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWP = w.xyz;
    vWN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const fs = /* glsl */`
  uniform float uTime; uniform vec2 uSize; uniform vec3 uTint; uniform float uOpacity; uniform float uSeed; uniform float uRain;
  uniform vec3 uGlint;
  varying vec2 vP; varying vec3 vWP; varying vec3 vWN;
  float h21(vec2 p) { p = fract(p * vec2(233.34, 851.73) + uSeed); p += dot(p, p + 23.45); return fract(p.x * p.y); }

  // Beaded droplets that slowly appear and evaporate.
  vec3 beads(vec2 p, float t, float scale) {
    vec2 c = p * scale;
    vec2 id = floor(c), f = fract(c) - 0.5;
    float r1 = h21(id), r2 = h21(id + 7.13), r3 = h21(id + 3.31);
    vec2 o = (vec2(r1, r2) - 0.5) * 0.55;
    float life = fract(t * 0.035 + r3);
    float rad = (0.1 + 0.2 * r2) * smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.85, 1.0, life));
    vec2 d = (f - o) * vec2(1.0, 0.9);
    float m = smoothstep(rad, rad * 0.55, length(d)) * step(0.45, r3);
    float spec = smoothstep(rad * 0.45, 0.0, length(d - vec2(-0.3, 0.35) * rad)) * m;
    float rim = m * smoothstep(-rad, rad * 0.8, -d.y) * 0.6;
    return vec3(m, spec, rim);
  }

  // Drops sliding down in stick-slip bursts, leaving a beaded trail.
  vec3 sliders(vec2 p, float t) {
    float cw = 0.12;
    float col = floor(p.x / cw);
    float rx = h21(vec2(col, 1.7)), rs = h21(vec2(col, 9.2)), rp = h21(vec2(col, 4.4));
    if (rs > 0.6 * uRain + 0.12) return vec3(0.0);
    float cx = (col + 0.25 + 0.5 * rx) * cw;
    float span = uSize.y + 0.4;
    float ph = t * (0.05 + 0.06 * rs) + rp;
    float k = fract(ph);
    float stepPos = (floor(k * 4.0) + smoothstep(0.55, 1.0, fract(k * 4.0))) / 4.0;
    float y = uSize.y + 0.2 - stepPos * span;
    float wob = sin(p.y * 22.0 + col) * 0.004;
    vec2 d = vec2(p.x - cx - wob, p.y - y);
    float rad = 0.017 + 0.008 * rx;
    float drop = smoothstep(rad, rad * 0.6, length(d * vec2(1.0, 0.78)));
    float spec = smoothstep(rad * 0.5, 0.0, length(d - vec2(-0.006, 0.007))) * drop;
    float above = p.y - y;
    float trail = smoothstep(0.006, 0.002, abs(d.x)) * step(0.0, above) * (1.0 - smoothstep(0.0, 0.5, above));
    float beadsT = 0.0;
    if (above > 0.02 && above < 0.5) {
      float bi = floor(above / 0.035);
      float bf = fract(above / 0.035) - 0.5;
      float br = 0.25 * step(0.35, h21(vec2(col, bi)));
      beadsT = smoothstep(br, br * 0.4, length(vec2(d.x / 0.035 * 1.6, bf))) * (1.0 - above * 1.8);
    }
    return vec3(max(drop, beadsT * 0.9), spec, trail * 0.35);
  }

  void main() {
    vec3 V = normalize(cameraPosition - vWP);
    vec3 N = normalize(vWN);
    float fres = pow(1.0 - abs(dot(V, N)), 3.0);
    float t = uTime;
    vec3 b1 = beads(vP, t, 13.0) * uRain;
    vec3 b2 = beads(vP + 3.7, t * 1.3, 24.0) * uRain;
    vec3 s = sliders(vP, t);
    float drop = clamp(b1.x + b2.x * 0.8 + s.x, 0.0, 1.0);
    float spec = clamp(b1.y + b2.y + s.y, 0.0, 1.0);
    float rim = b1.z + b2.z * 0.6;
    // Anime glass gleam: two soft diagonal bands.
    float diag = vP.x * 0.8 + vP.y;
    float gleam = smoothstep(0.1, 0.0, abs(fract(diag * 0.42 + 0.15) - 0.5) - 0.06) * 0.07
                + smoothstep(0.03, 0.0, abs(fract(diag * 0.42 + 0.31) - 0.5) - 0.012) * 0.06;
    vec3 col = uTint * (0.15 + fres * 0.5);
    float a = uOpacity + fres * 0.22 + gleam;
    col += uGlint * gleam * 2.0;
    col = mix(col, uGlint * 1.25, drop * 0.7);
    a = max(a, drop * 0.62 + s.z);
    col += uGlint * s.z * 0.9;
    col = mix(col, vec3(0.02, 0.03, 0.06), clamp(rim, 0.0, 1.0) * 0.5);
    col += vec3(1.6, 1.55, 1.45) * spec;
    a = clamp(max(a, spec), 0.0, 0.92);
    gl_FragColor = vec4(col, a);
  }`;

let seed = 0.1;
export function makeGlassMaterial(w, h, { rain = 1, tint = 0x88a6c8, opacity = 0.05, glint = 0xfff0d8 } = {}) {
  seed += 0.137;
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.time,
      uSize: { value: new THREE.Vector2(w, h) },
      uTint: { value: new THREE.Color(tint) },
      uGlint: { value: new THREE.Color(glint) },
      uOpacity: { value: opacity },
      uSeed: { value: seed },
      uRain: { value: rain },
    },
    vertexShader: vs,
    fragmentShader: fs,
    transparent: true,
    depthWrite: false,
  });
}

// A pane of glass in the current builder frame. ry rotates the pane; its front faces +z before rotation.
export function glassPane(w, h, x, y, z, ry = 0, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), makeGlassMaterial(w, h, opts));
  mesh.layers.set(LAYER_FX);
  mesh.renderOrder = 2;
  return placeMesh(mesh, { x, y: y + h / 2, z, ry, parent: opts.parent });
}
