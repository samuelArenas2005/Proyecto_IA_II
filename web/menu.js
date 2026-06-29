'use strict';
/* ══════════════════════════════════════════════════════
   menu.js – Fondo 2D top-down animado (sin Three.js)
   Tablero de ajedrez con piezas flotando suavemente
══════════════════════════════════════════════════════ */

const GRID = 8;
const ASSET_BASE = 'assets/sprints/';

// Colores del tablero menú (un poco más oscuros/misteriosos que el juego)
const ML  = '#2a2218'; // fondo exterior
const MT1 = '#3d3020'; // casilla clara (oscura para el menú bg)
const MT2 = '#1e180e'; // casilla oscura

let _cvs, _ctx;
let _spr = {};
let _cellSize = 0;
let _bx = 0, _by = 0;
let _float = 0;

// Piezas decorativas que se mueven por el tablero
const _deco = [
  { r: 0, c: 1, type: 'white', vr:  0.004, vc:  0.003 },
  { r: 7, c: 6, type: 'black', vr: -0.003, vc: -0.004 },
  { r: 2, c: 4, type: 'white', vr:  0.002, vc: -0.003 },
];
// Coleccionables decorativos
const _items = [
  { r: 2, c: 2, type: 'snitch', phase: 0.0 },
  { r: 5, c: 5, type: 'snitch', phase: 1.2 },
  { r: 4, c: 1, type: 'snitch', phase: 2.4 },
  { r: 3, c: 3, type: 'potion', phase: 0.8 },
  { r: 6, c: 1, type: 'potion', phase: 2.1 },
];

async function loadSprites() {
  const defs = {
    tileWhite: `${ASSET_BASE}bloque_blanco_ajedrez_sprint.png`,
    tileBlack: `${ASSET_BASE}bloque_gris_ajedez_sprint.png`,
    jugador: `${ASSET_BASE}jugador.png`,
  };
  await Promise.all(Object.entries(defs).map(([k, src]) =>
    new Promise(res => {
      const img = new Image();
      img.onload  = () => { _spr[k] = img; res(); };
      img.onerror = () => res();
      img.src = src;
    })
  ));
}

function computeLayout() {
  const w = _cvs.width, h = _cvs.height;
  _cellSize = Math.ceil(Math.max(w, h) * 1.1 / GRID); // Fill + bleed
  _bx = Math.round((w - _cellSize * GRID) / 2);
  _by = Math.round((h - _cellSize * GRID) / 2);
}

function drawMenuBoard() {
  const ctx = _ctx;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const isLight = (r + c) % 2 === 0;
      const x = _bx + c * _cellSize;
      const y = _by + r * _cellSize;
      const img = isLight ? _spr.tileWhite : _spr.tileBlack;

      if (img) {
        ctx.drawImage(img, x, y, _cellSize, _cellSize);
        // Oscurecer todo el tablero ligeramente porque es el menú
        ctx.fillStyle = isLight ? 'rgba(30,20,10,0.45)' : 'rgba(20,15,5,0.7)';
        ctx.fillRect(x, y, _cellSize, _cellSize);
      } else {
        ctx.fillStyle = isLight ? MT1 : MT2;
        ctx.fillRect(x, y, _cellSize, _cellSize);
      }
    }
  }
  // faint golden grid lines
  ctx.strokeStyle = 'rgba(201,169,97,0.07)';
  ctx.lineWidth = 1;
  for (let r = 0; r <= GRID; r++) {
    ctx.beginPath();
    ctx.moveTo(_bx, _by + r * _cellSize);
    ctx.lineTo(_bx + GRID * _cellSize, _by + r * _cellSize);
    ctx.stroke();
  }
  for (let c = 0; c <= GRID; c++) {
    ctx.beginPath();
    ctx.moveTo(_bx + c * _cellSize, _by);
    ctx.lineTo(_bx + c * _cellSize, _by + GRID * _cellSize);
    ctx.stroke();
  }
}

function drawDecoPiece(rf, cf, isWhite) {
  const ctx = _ctx;
  const x = _bx + cf * _cellSize + _cellSize / 2;
  const y = _by + rf * _cellSize + _cellSize / 2;
  const r = _cellSize * 0.34;

  ctx.save();
  ctx.shadowColor = isWhite ? 'rgba(255,255,230,0.35)' : 'rgba(140,100,255,0.35)';
  ctx.shadowBlur  = 18;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const gr = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.05, x, y, r);
  if (isWhite) {
    gr.addColorStop(0, 'rgba(255,255,240,0.55)');
    gr.addColorStop(1, 'rgba(180,160,120,0.2)');
  } else {
    gr.addColorStop(0, 'rgba(140,100,255,0.45)');
    gr.addColorStop(1, 'rgba(30,20,60,0.15)');
  }
  ctx.fillStyle = gr;
  ctx.fill();
  ctx.strokeStyle = isWhite ? 'rgba(201,169,97,0.45)' : 'rgba(160,120,255,0.45)';
  ctx.lineWidth = _cellSize * 0.035;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.font = `${_cellSize * 0.38}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isWhite ? 'rgba(80,50,20,0.6)' : 'rgba(201,169,97,0.6)';
  ctx.fillText('♞', x, y + _cellSize * 0.02);
  ctx.restore();
}

function drawCustomOrb(ctx, x, y, s, colorType) {
  const r = s / 2;
  
  ctx.save();
  // Aura
  const auraColor = colorType === 'gold' ? 'rgba(255,212,59,0.5)' : 'rgba(34,211,238,0.5)';
  ctx.shadowColor = auraColor;
  ctx.shadowBlur = 15;

  // Base
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const gr = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  if (colorType === 'gold') {
    gr.addColorStop(0, '#fff3cd');
    gr.addColorStop(0.3, '#f5ba00');
    gr.addColorStop(0.8, '#a36d00');
    gr.addColorStop(1, '#4a3000');
  } else {
    gr.addColorStop(0, '#cffafe');
    gr.addColorStop(0.3, '#06b6d4');
    gr.addColorStop(0.8, '#0891b2');
    gr.addColorStop(1, '#164e63');
  }
  ctx.fillStyle = gr;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Brillo
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.35, r * 0.4, r * 0.15, Math.PI / -8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();

  // Detalles
  if (colorType === 'gold') {
    ctx.lineWidth = s * 0.05;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y);
    ctx.bezierCurveTo(x - r * 2.2, y - r * 0.8, x - r * 1.5, y - r * 1.8, x - r * 0.2, y - r * 0.5);
    ctx.fill(); ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + r * 0.9, y);
    ctx.bezierCurveTo(x + r * 2.2, y - r * 0.8, x + r * 1.5, y - r * 1.8, x + r * 0.2, y - r * 0.5);
    ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.3, y - r * 0.9);
    ctx.lineTo(x + r * 0.3, y - r * 0.9);
    ctx.lineTo(x + r * 0.25, y - r * 1.2);
    ctx.lineTo(x - r * 0.25, y - r * 1.2);
    ctx.fillStyle = '#8d6e63';
    ctx.fill();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawDecoItem(r, c, type, phase) {
  const ctx = _ctx;
  const x = _bx + c * _cellSize + _cellSize / 2;
  const y = _by + r * _cellSize + _cellSize / 2;
  const fy = Math.sin(_float + phase) * (_cellSize * 0.05);
  const s = Math.min(_cellSize * 0.5, 45);

  ctx.save();
  ctx.globalAlpha = 0.85;

  // Halo anillo
  ctx.beginPath();
  ctx.arc(x, y + fy + s * 0.6, s * 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = type === 'snitch' ? 'rgba(255,212,59,0.3)' : 'rgba(34,211,238,0.3)';
  ctx.lineWidth   = 2;
  ctx.stroke();

  drawCustomOrb(ctx, x, y + fy, s, type === 'snitch' ? 'gold' : 'cyan');
  
  ctx.restore();
}

function menuLoop() {
  if (!_cvs) return;
  const ctx = _ctx;

  // Clear
  ctx.clearRect(0, 0, _cvs.width, _cvs.height);
  _float += 0.018;

  drawMenuBoard();

  // Items decorativos
  _items.forEach(it => drawDecoItem(it.r, it.c, it.type, it.phase));

  // Piezas que se "mueven" suavemente (posición flotante continua)
  _deco.forEach(d => {
    d.r = (d.r + d.vr + GRID) % GRID;
    d.c = (d.c + d.vc + GRID) % GRID;
    drawDecoPiece(d.r, d.c, d.type === 'white');
  });

  requestAnimationFrame(menuLoop);
}

// ── API pública ───────────────────────────────────────────
window.irASeleccionNivel = function () {
  const mainPanel  = document.getElementById('main-panel');
  const nivelPanel = document.getElementById('nivel-panel');
  mainPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  mainPanel.style.opacity   = '0';
  mainPanel.style.transform = 'translateY(-20px)';
  setTimeout(() => {
    mainPanel.style.display   = 'none';
    nivelPanel.style.display  = 'flex';
    nivelPanel.offsetHeight;
    nivelPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    nivelPanel.style.opacity    = '1';
    nivelPanel.style.transform  = 'translateY(0)';
  }, 400);
};

window.regresarAlMenu = function () {
  const mainPanel  = document.getElementById('main-panel');
  const nivelPanel = document.getElementById('nivel-panel');
  nivelPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  nivelPanel.style.opacity    = '0';
  nivelPanel.style.transform  = 'translateY(20px)';
  setTimeout(() => {
    nivelPanel.style.display  = 'none';
    mainPanel.style.display   = 'flex';
    mainPanel.offsetHeight;
    mainPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    mainPanel.style.opacity    = '1';
    mainPanel.style.transform  = 'translateY(0)';
  }, 400);
};

window.seleccionarNivelYJugar = async function (nivel) {
  const root    = document.getElementById('menu-root');
  const overlay = document.getElementById('overlay');
  localStorage.setItem('knight_nivel_seleccionado', nivel);

  root.style.transition    = 'opacity 0.5s ease';
  overlay.style.transition = 'opacity 0.5s ease';
  root.style.opacity    = '0';
  overlay.style.opacity = '0';

  setTimeout(() => { window.location.href = 'RenderMap/index.html'; }, 520);
};

// ── Inicialización ────────────────────────────────────────
(async function initMenuBg() {
  const container = document.getElementById('bg-canvas');
  if (!container) return;

  _cvs = document.createElement('canvas');
  _cvs.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  container.appendChild(_cvs);
  _ctx = _cvs.getContext('2d');

  function resize() {
    _cvs.width  = window.innerWidth;
    _cvs.height = window.innerHeight;
    computeLayout();
  }
  resize();
  window.addEventListener('resize', resize);

  await loadSprites();
  menuLoop();
})();
