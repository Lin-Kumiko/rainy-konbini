// Canvas-painted textures for the shop: signs, posters, product atlas, floor.
import { canvasTex, rrect, FONT_JP, FONT_DISPLAY } from './core.js';

export const BRAND = { teal: '#16a99b', orange: '#f2963a', navy: '#24418f', cream: '#f7f3e8', ink: '#1d2a3a' };

function umbrella(g, cx, cy, r, col, handle = '#ffffff') {
  g.save();
  g.translate(cx, cy);
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(-r, 0);
  g.quadraticCurveTo(-r, -r * 0.95, 0, -r);
  g.quadraticCurveTo(r, -r * 0.95, r, 0);
  for (let i = 3; i >= 0; i--) {
    const x0 = -r + (i + 1) * (r / 2), x1 = -r + i * (r / 2);
    g.quadraticCurveTo((x0 + x1) / 2, -r * 0.18, x1, 0);
  }
  g.fill();
  g.strokeStyle = handle; g.lineWidth = r * 0.12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -r * 0.05); g.lineTo(0, r * 0.75); g.arc(-r * 0.18, r * 0.75, r * 0.18, 0, Math.PI, false); g.stroke();
  g.restore();
}
export { umbrella };

export function signFront(variant = 'front') {
  return canvasTex(2048, 256, (g, w, h) => {
    g.fillStyle = BRAND.cream; g.fillRect(0, 0, w, h);
    g.fillStyle = BRAND.teal; g.fillRect(0, 0, w, h * 0.2);
    g.fillStyle = BRAND.orange; g.fillRect(0, h * 0.2, w, h * 0.07);
    g.fillStyle = BRAND.navy; g.fillRect(0, h * 0.86, w, h * 0.14);
    const cx = variant === 'front' ? w * 0.36 : w * 0.5;
    // Emblem
    g.fillStyle = BRAND.teal; g.beginPath(); g.arc(cx - 470, h * 0.56, 72, 0, Math.PI * 2); g.fill();
    umbrella(g, cx - 470, h * 0.6, 50, '#ffffff', BRAND.orange);
    g.fillStyle = BRAND.ink; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.font = `800 112px ${FONT_JP}`;
    g.fillText('あまやどり', cx - 370, h * 0.56);
    g.fillStyle = BRAND.orange; g.font = `800 92px ${FONT_JP}`;
    g.fillText('マート', cx + 210, h * 0.58);
    if (variant === 'front') {
      // 24H badge and tagline on the right
      g.fillStyle = BRAND.navy; rrect(g, w * 0.78, h * 0.33, 270, 128, 22); g.fill();
      g.fillStyle = '#ffffff'; g.font = `112px ${FONT_DISPLAY}`; g.textAlign = 'center';
      g.fillText('24H', w * 0.78 + 135, h * 0.56);
    } else {
      g.fillStyle = BRAND.navy; g.font = `800 44px ${FONT_JP}`; g.textAlign = 'left';
      g.fillText('OPEN 24 HOURS', w * 0.04, h * 0.56);
      g.fillText('ATM・コピー', w * 0.8, h * 0.56);
    }
  }, { aniso: 16 });
}

export function bladeSign() {
  return canvasTex(256, 1024, (g, w, h) => {
    g.fillStyle = BRAND.cream; g.fillRect(0, 0, w, h);
    g.fillStyle = BRAND.teal; g.fillRect(0, 0, w * 0.16, h); g.fillRect(w * 0.84, 0, w * 0.16, h);
    g.fillStyle = BRAND.orange; g.fillRect(w * 0.16, 0, w * 0.05, h); g.fillRect(w * 0.79, 0, w * 0.05, h);
    g.fillStyle = BRAND.teal; g.beginPath(); g.arc(w / 2, 120, 70, 0, 7); g.fill();
    umbrella(g, w / 2, 128, 46, '#ffffff', BRAND.orange);
    g.fillStyle = BRAND.ink; g.font = `800 112px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    [...'あまやどり'].forEach((ch, i) => g.fillText(ch, w / 2, 270 + i * 118));
    g.fillStyle = BRAND.navy; g.fillRect(w * 0.21, h - 170, w * 0.58, 120);
    g.fillStyle = '#fff'; g.font = `82px ${FONT_DISPLAY}`; g.fillText('24h', w / 2, h - 108);
  });
}

export function standSign() {
  return canvasTex(512, 768, (g, w, h) => {
    g.fillStyle = '#fff6e2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c63d2f'; g.fillRect(0, 0, w, 150);
    g.fillStyle = '#fff'; g.font = `112px ${FONT_DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('おでん', w / 2, 80);
    // pot + steam
    g.fillStyle = '#7a4b2a'; rrect(g, 96, 330, 320, 150, 26); g.fill();
    g.fillStyle = '#e9b44c'; g.beginPath(); g.ellipse(256, 330, 160, 34, 0, 0, 7); g.fill();
    g.fillStyle = '#f7e9c9'; g.beginPath(); g.arc(196, 318, 30, 0, 7); g.fill();
    g.fillStyle = '#9a6b3c'; g.beginPath(); g.moveTo(266, 340); g.lineTo(300, 290); g.lineTo(334, 340); g.fill();
    g.fillStyle = '#d9c19a'; g.fillRect(226, 280, 22, 60);
    g.strokeStyle = 'rgba(160,160,170,0.8)'; g.lineWidth = 12; g.lineCap = 'round';
    for (const x of [180, 256, 332]) { g.beginPath(); g.moveTo(x, 260); g.bezierCurveTo(x - 30, 230, x + 30, 200, x, 170); g.stroke(); }
    g.fillStyle = '#c63d2f'; g.font = `800 64px ${FONT_JP}`;
    g.fillText('全品', w / 2, 560);
    g.font = `150px ${FONT_DISPLAY}`; g.fillText('70円', w / 2, 670);
    g.fillStyle = '#24418f'; g.font = `800 34px ${FONT_JP}`; g.fillText('〜11月まで', w / 2, 740);
  });
}

const POSTERS = {
  oden: ['#c63d2f', '#fff2d6', 'おでん', 'はじめました', '#7a4b2a'],
  nikuman: ['#f2963a', '#fffaf0', '肉まん', 'ふっくら新登場', '#b55a1c'],
  coffee: ['#3b2a22', '#f3e6d3', 'COFFEE', '挽きたて 100円', '#c8894a'],
  baito: ['#16a99b', '#ffffff', 'スタッフ募集', '深夜 時給1,300円〜', '#24418f'],
  ice: ['#5aa6e0', '#f2fbff', 'アイス', '冬こそ、ひんやり', '#e46a9a'],
  sweets: ['#e46a9a', '#fff4f7', 'いちご', 'スイーツフェア', '#9b2c5a'],
};
export function poster(kind) {
  const [hd, bg, title, sub, acc] = POSTERS[kind];
  return canvasTex(384, 512, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = hd; g.fillRect(0, 0, w, h * 0.3);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${title.length > 4 ? 58 : 92}px ${FONT_DISPLAY}`;
    g.fillText(title, w / 2, h * 0.15);
    g.fillStyle = acc;
    g.beginPath(); g.arc(w / 2, h * 0.56, w * 0.24, 0, 7); g.fill();
    g.fillStyle = bg; g.beginPath(); g.arc(w / 2 - 22, h * 0.53, w * 0.07, 0, 7); g.fill();
    g.fillStyle = hd; g.font = `800 40px ${FONT_JP}`;
    g.fillText(sub, w / 2, h * 0.86);
  });
}

// 8x8 atlas of packaging fronts. Row-major from the bottom (CanvasTexture flips Y).
export const ATLAS_N = 8;
const PALETTE = ['#e04b3c', '#f2a03a', '#f4d03f', '#4fb36b', '#2d8fd5', '#7b5ec8', '#e46a9a', '#3b3b4a', '#f6f1e6', '#1f9e8f', '#c0392b', '#8bc34a', '#ff8a65', '#5c6bc0', '#26a69a', '#d4a373'];
const WORDS = ['ポテト', 'チョコ', 'のり', 'カレー', 'うま', 'ガム', 'グミ', 'えび', 'しお', 'あめ', 'パン', 'めん', 'お茶', 'みず', 'ラムネ', 'クッキー'];
export const CELL = { onigiri: 56, bento: 57, sandwich: 58, cup: 59, magazine: 60, bottle: 61 };
export function productAtlas() {
  return canvasTex(1024, 1024, (g, w) => {
    const c = w / ATLAS_N;
    const at = (i) => [(i % ATLAS_N) * c, (ATLAS_N - 1 - Math.floor(i / ATLAS_N)) * c];
    for (let i = 0; i < 56; i++) {
      const [x, y] = at(i);
      const a = PALETTE[i % PALETTE.length], b = PALETTE[(i * 7 + 3) % PALETTE.length];
      g.fillStyle = a; g.fillRect(x, y, c, c);
      const style = i % 4;
      g.fillStyle = b;
      if (style === 0) g.fillRect(x, y + c * 0.55, c, c * 0.25);
      else if (style === 1) { g.beginPath(); g.arc(x + c * 0.5, y + c * 0.6, c * 0.28, 0, 7); g.fill(); }
      else if (style === 2) { for (let k = 0; k < 4; k++) g.fillRect(x + k * c * 0.27, y, c * 0.12, c); }
      else { g.beginPath(); g.moveTo(x, y + c); g.lineTo(x + c, y + c * 0.35); g.lineTo(x + c, y + c); g.fill(); }
      g.fillStyle = '#ffffff'; g.fillRect(x + c * 0.1, y + c * 0.12, c * 0.8, c * 0.26);
      g.fillStyle = '#1d1d26'; g.font = `800 ${c * 0.17}px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(WORDS[i % WORDS.length], x + c * 0.5, y + c * 0.26);
    }
    // Special cells
    let [x, y] = at(CELL.onigiri);
    g.fillStyle = '#f5f2ea'; g.fillRect(x, y, c, c);
    g.fillStyle = '#1e2a22'; g.fillRect(x + c * 0.3, y + c * 0.45, c * 0.4, c * 0.55);
    g.fillStyle = '#d23b2e'; g.fillRect(x + c * 0.45, y, c * 0.1, c * 0.45);
    [x, y] = at(CELL.bento);
    g.fillStyle = '#2b2b30'; g.fillRect(x, y, c, c);
    g.fillStyle = '#f4f1e8'; g.fillRect(x + c * 0.06, y + c * 0.08, c * 0.5, c * 0.84);
    g.fillStyle = '#c9772e'; g.fillRect(x + c * 0.6, y + c * 0.08, c * 0.34, c * 0.4);
    g.fillStyle = '#5fae4f'; g.fillRect(x + c * 0.6, y + c * 0.52, c * 0.34, c * 0.18);
    g.fillStyle = '#e8c547'; g.fillRect(x + c * 0.6, y + c * 0.72, c * 0.34, c * 0.2);
    g.fillStyle = '#d23b2e'; g.beginPath(); g.arc(x + c * 0.31, y + c * 0.5, c * 0.07, 0, 7); g.fill();
    [x, y] = at(CELL.sandwich);
    g.fillStyle = '#f3e3b5'; g.fillRect(x, y, c, c);
    g.fillStyle = '#7fbf5a'; g.fillRect(x, y + c * 0.45, c, c * 0.1);
    g.fillStyle = '#f0c75e'; g.fillRect(x, y + c * 0.55, c, c * 0.12);
    g.fillStyle = '#e46a5a'; g.fillRect(x, y + c * 0.67, c, c * 0.08);
    [x, y] = at(CELL.cup);
    g.fillStyle = '#f6efe2'; g.fillRect(x, y, c, c);
    g.fillStyle = '#e04b3c'; g.fillRect(x, y + c * 0.25, c, c * 0.35);
    g.fillStyle = '#fff'; g.font = `800 ${c * 0.2}px ${FONT_JP}`; g.fillText('ラーメン', x + c * 0.5, y + c * 0.43);
    [x, y] = at(CELL.magazine);
    g.fillStyle = '#e8e4f0'; g.fillRect(x, y, c, c);
    g.fillStyle = '#e04b3c'; g.fillRect(x, y, c, c * 0.22);
    g.fillStyle = '#5c6bc0'; g.fillRect(x + c * 0.15, y + c * 0.3, c * 0.7, c * 0.55);
    [x, y] = at(CELL.bottle);
    g.fillStyle = '#ffffff'; g.fillRect(x, y, c, c);
    g.fillStyle = '#d8d8d8'; g.fillRect(x, y + c * 0.38, c, c * 0.3);
    for (let i = 62; i < 64; i++) { [x, y] = at(i); g.fillStyle = PALETTE[i % 16]; g.fillRect(x, y, c, c); }
  }, { aniso: 4 });
}

export function menuBoard() {
  return canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#2a2622'; g.fillRect(0, 0, w, h);
    const items = [['からあげ', '220円', '#f2a03a'], ['肉まん', '160円', '#f6f1e6'], ['おでん', '70円〜', '#e9b44c'], ['コーヒー', '100円', '#c8894a']];
    items.forEach(([n, p, col], i) => {
      const x = i * w / 4;
      g.fillStyle = col; g.beginPath(); g.arc(x + 128, 96, 52, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = `800 40px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(n, x + 128, 190);
      g.fillStyle = '#ffd36b'; g.font = `800 30px ${FONT_JP}`; g.fillText(p, x + 128, 232);
      g.strokeStyle = '#4a4440'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w / 4, 20); g.lineTo(x + w / 4, h - 20); g.stroke();
    });
  });
}

export function floorTex() {
  // Covers x [-3.82, 3.42], z [-6.82, -0.38]
  const x0 = -3.82, z0 = -6.82, W = 7.24, D = 6.44, P = 1024 / W;
  return canvasTex(1024, Math.round(D * P), (g, w, h) => {
    g.fillStyle = '#e9e4d8'; g.fillRect(0, 0, w, h);
    const t = 0.3 * P;
    for (let x = 0; x < w; x += t) for (let y = 0; y < h; y += t) {
      g.fillStyle = ((x / t + y / t) | 0) % 2 ? '#e3ddcf' : '#ece8dc';
      g.fillRect(x + 1, y + 1, t - 2, t - 2);
    }
    const X = (v) => (v - x0) * P, Z = (v) => (v - z0) * P;
    // Queue guide in front of the counter
    g.fillStyle = '#16a99b';
    for (let i = 0; i < 4; i++) g.fillRect(X(1.6), Z(-2.75 + i * 0.5), 0.06 * P, 0.3 * P);
    g.fillStyle = '#f2963a'; rrect(g, X(1.35), Z(-2.4), 0.8 * P, 0.34 * P, 8); g.fill();
    g.fillStyle = '#fff'; g.font = `800 ${0.1 * P}px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('こちらでお待ちください', X(1.75), Z(-2.23));
    // Footprints
    g.fillStyle = '#24418f';
    for (const [fx, fz] of [[1.62, -1.75], [1.88, -1.7]]) { g.beginPath(); g.ellipse(X(fx), Z(fz), 0.05 * P, 0.11 * P, 0, 0, 7); g.fill(); }
    // Welcome mat zone and arrows
    g.fillStyle = 'rgba(22,169,155,0.85)';
    for (let i = 0; i < 3; i++) {
      const zz = Z(-1.0 - i * 0.45);
      g.beginPath(); g.moveTo(X(-0.25) - 0.12 * P, zz); g.lineTo(X(-0.25), zz - 0.16 * P); g.lineTo(X(-0.25) + 0.12 * P, zz); g.closePath(); g.fill();
    }
  }, { aniso: 8 });
}

export function coolerHeader() {
  return canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = '#16a99b'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = `800 64px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('つめたい ドリンク', w * 0.3, h / 2);
    g.fillStyle = '#f2963a'; g.fillText('COLD DRINKS', w * 0.75, h / 2);
  });
}

export function smallLabel(text, bg, fg, w = 512, h = 128, font = FONT_JP, weight = 800) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = `${weight} ${Math.round(h * 0.55)}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 2);
  });
}
