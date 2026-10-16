// Canvas textures for street furniture and the neighbouring izakaya.
import { canvasTex, rrect, FONT_JP, FONT_DISPLAY } from './core.js';

export function vendingFront(theme) {
  const body = theme === 'red' ? '#c8322d' : '#2c63b8';
  return canvasTex(512, 1024, (g, w, h) => {
    g.fillStyle = body; g.fillRect(0, 0, w, h);
    // display window
    g.fillStyle = '#eef6ff'; rrect(g, 28, 40, w - 56, 560, 14); g.fill();
    const drinks = ['#3d9a4f', '#b32b2b', '#f29a2e', '#6b4630', '#8fd0f0', '#e8d24a', '#4466cc', '#e46a9a', '#2ec4b6', '#f5f2e8'];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        const x = 52 + c * 54, y = 70 + r * 135;
        const col = drinks[(r * 8 + c * 3) % drinks.length];
        g.fillStyle = col; rrect(g, x, y + 18, 34, 78, 8); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(x + 4, y + 44, 26, 18);
        g.fillStyle = '#9aa0a8'; g.fillRect(x + 10, y + 6, 14, 14);
        // price + button
        g.fillStyle = '#222'; g.fillRect(x + 2, y + 102, 30, 12);
        g.fillStyle = '#ff5a4a'; g.font = '700 11px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(r === 3 ? '160' : '130', x + 17, y + 108);
        g.fillStyle = (r + c) % 5 === 0 ? '#ffde59' : '#d6dbe2'; g.fillRect(x + 6, y + 117, 22, 8);
      }
    }
    // brand band and coin panel
    g.fillStyle = '#ffffff'; g.font = `800 64px ${FONT_JP}`; g.textAlign = 'center';
    g.fillText(theme === 'red' ? 'つめた〜い' : 'あったか〜い', w / 2, 660);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 700, w, 6);
    g.fillStyle = '#1b1e24'; rrect(g, 330, 730, 140, 170, 10); g.fill();
    g.fillStyle = '#5ee08a'; g.fillRect(352, 750, 96, 26);
    g.fillStyle = '#c9ced6'; g.fillRect(372, 800, 56, 10); g.fillRect(372, 830, 56, 40);
    g.fillStyle = 'rgba(0,0,0,0.35)'; rrect(g, 50, 880, 250, 110, 10); g.fill();
    g.fillStyle = '#0d0f13'; g.fillRect(70, 920, 210, 50);
  });
}

export function plateTex(lines, bg, fg, w = 256, h = 512, size = 52) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${size}px ${FONT_JP}`;
    const vertical = h > w;
    if (vertical) {
      const chars = [...lines.join('')];
      chars.forEach((ch, i) => g.fillText(ch, w / 2, 60 + i * (h - 100) / Math.max(chars.length - 1, 1) * 0.95));
    } else {
      lines.forEach((t, i) => g.fillText(t, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.15));
    }
  });
}

export function stopSign() {
  return canvasTex(256, 256, (g, w) => {
    g.clearRect(0, 0, w, w);
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(8, 18); g.lineTo(w - 8, 18); g.lineTo(w / 2, w - 12); g.closePath(); g.fill();
    g.fillStyle = '#d0262c';
    g.beginPath(); g.moveTo(26, 30); g.lineTo(w - 26, 30); g.lineTo(w / 2, w - 34); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.font = `60px ${FONT_DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('止まれ', w / 2, 92);
  });
}

export function crossingSign() {
  return canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#1f5fbf'; g.fillRect(10, 10, w - 20, w - 20);
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(w / 2, 34); g.lineTo(w - 34, w - 40); g.lineTo(34, w - 40); g.closePath(); g.fill();
    g.fillStyle = '#1b1b1b';
    g.beginPath(); g.arc(w / 2 + 6, 98, 13, 0, 7); g.fill();
    g.lineWidth = 12; g.strokeStyle = '#1b1b1b'; g.lineCap = 'round';
    g.beginPath(); g.moveTo(w / 2 + 2, 116); g.lineTo(w / 2 - 6, 160); g.lineTo(w / 2 - 26, 192); g.moveTo(w / 2 - 6, 160); g.lineTo(w / 2 + 16, 192);
    g.moveTo(w / 2 - 22, 136); g.lineTo(w / 2 + 2, 124); g.lineTo(w / 2 + 24, 146); g.stroke();
    g.fillRect(40, w - 34, w - 80, 8);
  });
}

export function bulletinTex() {
  return canvasTex(768, 512, (g, w, h) => {
    g.fillStyle = '#5b6b4e'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c8b48a'; g.fillRect(12, 12, w - 24, h - 24);
    const notes = [
      [30, 30, 220, 290, '#fff8e8', '秋まつり', '10/25 (土)\n神社境内', '#c63d2f'],
      [270, 40, 200, 200, '#f4f9ff', 'ゴミ出し', '月・木 可燃\n水 資源', '#24418f'],
      [490, 26, 240, 160, '#fff1f4', '迷いねこ', '白黒・オス\n見かけたら連絡を', '#9b2c5a'],
      [270, 262, 210, 220, '#f6fff2', '防犯', '夜道に\n気をつけて', '#2f7a3a'],
      [500, 208, 230, 270, '#fffbe0', '町内会', '清掃活動\n11/3 朝9時', '#7a4b2a'],
      [40, 340, 200, 140, '#eef3ff', 'ラジオ体操', '毎朝6:30', '#1f5fbf'],
    ];
    for (const [x, y, nw, nh, bg, title, body, ac] of notes) {
      g.save(); g.translate(x + nw / 2, y + nh / 2); g.rotate((Math.random() - 0.5) * 0.06);
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-nw / 2 + 4, -nh / 2 + 5, nw, nh);
      g.fillStyle = bg; g.fillRect(-nw / 2, -nh / 2, nw, nh);
      g.fillStyle = ac; g.fillRect(-nw / 2, -nh / 2, nw, 46);
      g.fillStyle = '#fff'; g.font = `800 30px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(title, 0, -nh / 2 + 24);
      g.fillStyle = '#333'; g.font = `500 22px ${FONT_JP}`;
      body.split('\n').forEach((l, i) => g.fillText(l, 0, -nh / 2 + 80 + i * 30));
      if (title === '迷いねこ') { g.fillStyle = '#222'; g.beginPath(); g.ellipse(0, nh / 2 - 26, 30, 16, 0, 0, 7); g.fill(); }
      g.fillStyle = '#d33'; g.beginPath(); g.arc(0, -nh / 2 + 6, 6, 0, 7); g.fill();
      g.restore();
    }
  });
}

export function lanternTex() {
  return canvasTex(256, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#8e1414'); gr.addColorStop(0.5, '#ff4a32'); gr.addColorStop(1, '#8e1414');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(80,0,0,0.5)'; g.lineWidth = 3;
    for (let y = 20; y < h; y += 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#1a0a08'; g.font = `110px ${FONT_DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('や', w / 2, h * 0.3); g.fillText('き', w / 2, h * 0.52); g.fillText('鳥', w / 2, h * 0.74);
  });
}

export function norenTex() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#23345e'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f3ecd8'; g.font = `96px ${FONT_DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('灯', w * 0.5, h * 0.45);
    g.font = `800 34px ${FONT_JP}`; g.fillText('やきとり・おでん', w * 0.5, h * 0.82);
    g.fillStyle = '#1a2646';
    for (let i = 1; i < 4; i++) g.fillRect(i * w / 4 - 3, h * 0.25, 6, h);
  });
}

export function shopSignTex() {
  return canvasTex(1024, 192, (g, w, h) => {
    g.fillStyle = '#2b1d16'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a25b'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#f3e3b8'; g.font = `110px ${FONT_DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('居酒屋　灯', w / 2, h / 2 + 4);
  });
}

export function shojiTex(lit = true) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = lit ? '#fff1d2' : '#cfd6e0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = lit ? '#7a5a3a' : '#5a6070'; g.lineWidth = 6;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); }
    for (let i = 0; i <= 5; i++) { g.beginPath(); g.moveTo(0, i * h / 5); g.lineTo(w, i * h / 5); g.stroke(); }
  });
}

export function curtainWindowTex() {
  return canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#ffd89a'); gr.addColorStop(1, '#ffb866');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(190,120,80,0.55)';
    for (let i = 0; i < 9; i++) g.fillRect(i * 30 + (i > 4 ? 40 : 0), 0, 14, h);
    g.fillStyle = 'rgba(90,50,40,0.5)'; g.beginPath(); g.ellipse(w * 0.62, h * 0.82, 26, 40, 0, 0, 7); g.fill();
  });
}

export function binLabel(text, col) {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = `800 40px ${FONT_JP}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2);
  });
}

export function pedTex(kind) {
  return canvasTex(128, 128, (g, w) => {
    g.fillStyle = '#111316'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(w / 2, 28, 12, 0, 7); g.fill();
    g.lineWidth = 14; g.lineCap = 'round'; g.strokeStyle = '#ffffff';
    g.beginPath();
    if (kind === 'walk') { g.moveTo(w / 2, 46); g.lineTo(w / 2 - 4, 80); g.lineTo(w / 2 - 22, 108); g.moveTo(w / 2 - 4, 80); g.lineTo(w / 2 + 18, 108); g.moveTo(w / 2 - 20, 66); g.lineTo(w / 2, 52); g.lineTo(w / 2 + 20, 70); }
    else { g.moveTo(w / 2, 46); g.lineTo(w / 2, 84); g.lineTo(w / 2 - 10, 112); g.moveTo(w / 2, 84); g.lineTo(w / 2 + 10, 112); g.moveTo(w / 2 - 18, 50); g.lineTo(w / 2 - 18, 82); g.moveTo(w / 2 + 18, 50); g.lineTo(w / 2 + 18, 82); }
    g.stroke();
  });
}
