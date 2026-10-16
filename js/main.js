// Entry: build the diorama, light it, run the animation loop.
import { THREE, renderer, scene, camera, controls, U, flush, FONT_JP, FONT_DISPLAY } from './core.js';
import { buildGround } from './ground.js';
import { buildStore, updateStore } from './store.js';
import { buildInterior } from './interior.js';
import { buildStreet, updateStreet, signalColor } from './street.js';
import { buildTown } from './town.js';
import { buildFx, updateFx } from './fx.js';
import { render, resize, registerGround, updateShadows, setPixelRatio } from './post.js';

async function loadFonts() {
  const sample = 'あまやどりマート止まれ営業中おでんたばこ自動ドア24HOURSいらっしゃいませ肉まんコーヒー新発売';
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`800 64px ${FONT_JP}`, sample),
        document.fonts.load(`500 64px ${FONT_JP}`, sample),
        document.fonts.load(`64px ${FONT_DISPLAY}`, sample),
      ]),
      new Promise((r) => setTimeout(r, 3500)),
    ]);
  } catch (e) { /* fall back to system fonts */ }
}

function lights() {
  const hemi = new THREE.HemisphereLight(0x5a6aa8, 0x1c1a2c, 0.72);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x8090c8, 0.35);
  moon.position.set(-14, 26, 10);
  scene.add(moon);
}

async function init() {
  await loadFonts();
  buildGround();
  buildStore();
  buildInterior();
  buildStreet();
  buildTown();
  buildFx();
  lights();
  flush();
  scene.traverse((o) => { if (o.userData.ground) registerGround(o); });
  updateShadows();
  renderer.compile(scene, camera);
  window.addEventListener('resize', resize);
  let shown = false;
  const clock = new THREE.Clock();
  // Adaptive resolution: drop the pixel ratio a notch while frames stay slow.
  let acc = 0, frames = 0, pr = renderer.getPixelRatio();
  const adapt = (raw) => {
    if (raw > 0.25 || document.visibilityState !== 'visible') return;
    acc += raw; frames++;
    if (acc < 2.5) return;
    const avg = acc / frames;
    acc = 0; frames = 0;
    if (avg > 1 / 38 && pr > 0.75) { pr = Math.max(0.75, pr - 0.25); setPixelRatio(pr); }
  };
  renderer.setAnimationLoop(() => {
    const raw = clock.getDelta();
    adapt(raw);
    const dt = Math.min(raw, 0.1);
    U.time.value += dt;
    updateStore(U.time.value, dt);
    updateStreet(U.time.value);
    updateFx(signalColor());
    controls.update();
    render();
    if (!shown) { shown = true; renderer.domElement.classList.add('ready'); }
  });
}
init();
