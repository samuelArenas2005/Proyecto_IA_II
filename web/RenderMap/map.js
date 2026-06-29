'use strict';
/* ══════════════════════════════════════════════════════════════
   map.js – Tablero 8×8 · Vista 2D Top-Down · Knight Energy
   Canvas 2D puro, sin Three.js. Estilo chess.com medieval.
══════════════════════════════════════════════════════════════ */

const GRID = 8;
const ASSET_BASE = '../assets/sprints/';

// ── Colores del tablero ──────────────────────────────
const LIGHT  = '#f0d9b5';
const DARK   = '#b58863';
const BG_COL = '#1a1714';

window.__gameState = null;
window.__sceneData = {};

// Estado interno del renderizador
let _canvas, _ctx;
let _sprites  = {};
let _cellSize = 80;
let _bx = 0, _by = 0;   // board origin (px)
let _zoom = 1.0;
const MIN_ZOOM = 0.6, MAX_ZOOM = 1.8;

// Animación de piezas
let _wAnim = null;   // { fromR, fromC, toR, toC, start, dur }
let _bAnim = null;
const ANIM_DUR = 340; // ms

// Partículas 2D
let _particles = [];

// Highlights casillas válidas
let _validMoves = [];

// Fase de flotación para coleccionables
let _float = 0;

let _busy      = false;
let _animating = false;

// ── Cargar sprites ───────────────────────────────────
async function loadSprites() {
  const defs = {
    tileWhite: `${ASSET_BASE}bloque_blanco_ajedrez_sprint.png`,
    tileBlack: `${ASSET_BASE}bloque_gris_ajedez_sprint.png`,
    jugador: `${ASSET_BASE}jugador.png`,
  };
  const out = {};
  await Promise.all(Object.entries(defs).map(([k, src]) =>
    new Promise(res => {
      const img = new Image();
      img.onload  = () => { out[k] = img; res(); };
      img.onerror = () => { out[k] = null; res(); };
      img.src = src;
    })
  ));
  return out;
}

// ── Layout sin zoom (fijo y cómodo por defecto) ─────
function computeLayout() {
  const w = _canvas.width;
  const h = _canvas.height;
  // Padding cómodo: 60px vertical, 40px lateral
  const padV = 60;
  const padH = 40;
  const avW = w - padH * 2;
  const avH = h - padV * 2;
  // Calculamos el tamaño para que quepa bien el grid
  _cellSize = Math.floor(Math.min(avW / GRID, avH / GRID));
  // Limitar el tamaño máximo a algo agradable (por ej 85px max) si sobra mucho
  _cellSize = Math.min(_cellSize, 90);
  
  const bpx = _cellSize * GRID;
  _bx = Math.floor((w - bpx) / 2);
  _by = Math.floor((h - bpx) / 2);
}

function cellCenter(row, col) {
  return { x: _bx + col * _cellSize + _cellSize / 2,
           y: _by + row * _cellSize + _cellSize / 2 };
}

function hitCell(px, py) {
  const col = Math.floor((px - _bx) / _cellSize);
  const row = Math.floor((py - _by) / _cellSize);
  if (row < 0 || row >= GRID || col < 0 || col >= GRID) return null;
  return [row, col];
}

// ── Dibujo del tablero con assets de textura ───────────
function drawBoard() {
  const ctx = _ctx;

  // Sombra exterior
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur  = 30;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle   = '#181410';
  ctx.fillRect(_bx - 8, _by - 8, GRID * _cellSize + 16, GRID * _cellSize + 16);
  ctx.restore();

  // Dibujar casillas
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const isLight = (r + c) % 2 === 0;
      const x = _bx + c * _cellSize;
      const y = _by + r * _cellSize;
      
      const img = isLight ? _sprites.tileWhite : _sprites.tileBlack;
      
      if (img) {
        ctx.drawImage(img, x, y, _cellSize, _cellSize);
        // Oscurecer ligeramente las casillas oscuras si la imagen la hace ver plana
        if (!isLight) {
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(x, y, _cellSize, _cellSize);
        }
      } else {
        ctx.fillStyle = isLight ? LIGHT : DARK;
        ctx.fillRect(x, y, _cellSize, _cellSize);
      }
    }
  }

  // Border temático (doble línea gruesa)
  ctx.strokeStyle = '#c9a961'; // Acento dorado
  ctx.lineWidth   = 4;
  ctx.strokeRect(_bx - 2, _by - 2, GRID * _cellSize + 4, GRID * _cellSize + 4);
  ctx.strokeStyle = '#3e2723';
  ctx.lineWidth   = 6;
  ctx.strokeRect(_bx - 7, _by - 7, GRID * _cellSize + 14, GRID * _cellSize + 14);

  // Coordenadas (a–h, 8–1)
  const fSize = Math.max(12, _cellSize * 0.18);
  ctx.font         = `bold ${fSize}px Cinzel, serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = 'rgba(201,169,97,0.6)';
  for (let r = 0; r < GRID; r++) {
    ctx.fillText(String(GRID - r),
      _bx - fSize * 1.1,
      _by + r * _cellSize + _cellSize / 2);
  }
  for (let c = 0; c < GRID; c++) {
    ctx.fillText(String.fromCharCode(97 + c),
      _bx + c * _cellSize + _cellSize / 2,
      _by + GRID * _cellSize + fSize * 1.2);
  }
}

// ── Casillas válidas (highlights) ─────────────────────
function drawHighlights() {
  const ctx = _ctx;
  for (const [row, col] of _validMoves) {
    const { x, y } = cellCenter(row, col);
    const r = _cellSize * 0.24;

    ctx.save();
    ctx.shadowColor = 'rgba(80,220,110,0.8)';
    ctx.shadowBlur  = 14;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(105,219,124,0.38)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(81,207,102,0.9)';
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    ctx.restore();
  }
}

// ── Aura por valor ───────────────────────────
// Snitch: valores 2,3,4,5,6,8,9
function snitchGlow(value) {
  if (value >= 8) return { color: '#ff6b00', blur: 30, ring: 'rgba(255,140,0,0.6)', label: '#fff7e6' };
  if (value >= 6) return { color: '#f59f00', blur: 22, ring: 'rgba(245,159,0,0.5)',  label: '#ffe8a1' };
  if (value >= 4) return { color: '#ffd43b', blur: 15, ring: 'rgba(255,212,59,0.4)',  label: '#fff3cd' };
  return               { color: '#fde68a', blur:  9, ring: 'rgba(253,230,138,0.3)', label: '#fef9e3' };
}
// Potion: valores 2,3,4,5
function potionGlow(value) {
  if (value >= 5) return { color: '#06b6d4', blur: 28, ring: 'rgba(6,182,212,0.65)',  label: '#cffafe' };
  if (value >= 4) return { color: '#22d3ee', blur: 20, ring: 'rgba(34,211,238,0.55)', label: '#e0f9fd' };
  if (value >= 3) return { color: '#67e8f9', blur: 13, ring: 'rgba(103,232,249,0.4)', label: '#ecfeff' };
  return               { color: '#a5f3fc', blur:  8, ring: 'rgba(165,243,252,0.3)', label: '#f0feff' };
}


// ── Dibujo 3D simulado para Snitch y Poción ──────────────────
function drawCustomOrb(ctx, x, y, s, colorType, valueText) {
  const r = s / 2;
  
  ctx.save();
  // 1. Aura
  const auraColor = colorType === 'gold' ? 'rgba(255,212,59,0.7)' : 'rgba(34,211,238,0.7)';
  ctx.shadowColor = auraColor;
  ctx.shadowBlur = 20;

  // 2. Base del orbe con degradado radial simulando iluminación esférica
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

  // 3. Brillo especular (Highlight superior)
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.35, r * 0.4, r * 0.15, Math.PI / -8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();

  // 4. Si es Snitch (gold), dibujarle unas alitas muy sutiles a los lados
  if (colorType === 'gold') {
    ctx.lineWidth = s * 0.05;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    
    // Ala izquierda
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y);
    ctx.bezierCurveTo(x - r * 2.2, y - r * 0.8, x - r * 1.5, y - r * 1.8, x - r * 0.2, y - r * 0.5);
    ctx.fill(); ctx.stroke();
    // Ala derecha
    ctx.beginPath();
    ctx.moveTo(x + r * 0.9, y);
    ctx.bezierCurveTo(x + r * 2.2, y - r * 0.8, x + r * 1.5, y - r * 1.8, x + r * 0.2, y - r * 0.5);
    ctx.fill(); ctx.stroke();
  } else {
    // Si es poción (cyan), dibujarle un tapón de corcho arriba
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

  // 5. Etiqueta / Número arriba del orbe (no en el centro, para que se lea mejor)
  ctx.font = `bold ${r * 0.8}px Cinzel, serif`;
  ctx.textAlign = 'center'; 
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colorType === 'gold' ? '#ffe8a1' : '#e0f9fd';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(valueText, x, y);
  ctx.fillText(valueText, x, y);
  
  ctx.restore();
}

// ── Coleccionables (snitch y poción) ──────────────────
function drawCollectibles(state) {
  const ctx = _ctx;
  const stars  = state?.stars  || {};
  const pots   = state?.energy_tiles || {};

  // Tamaño fijo
  const SPRITE_MAX = 48;

  Object.entries(stars).forEach(([key, val], i) => {
    const [row, col] = key.split(',').map(Number);
    const { x, y } = cellCenter(row, col);
    const fy   = Math.sin(_float + i * 1.1) * (_cellSize * 0.04);
    const glow = snitchGlow(val);
    const s    = Math.min(_cellSize * 0.55, SPRITE_MAX);

    ctx.save();
    // Halo de anillo bajo el orbe
    ctx.beginPath();
    ctx.arc(x, y + fy + s * 0.6, s * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = glow.ring;
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.restore();

    // Orbe estilizado 3D (dorado)
    drawCustomOrb(ctx, x, y + fy, s, 'gold', String(val));
  });

  Object.entries(pots).forEach(([key, val], i) => {
    const [row, col] = key.split(',').map(Number);
    const { x, y } = cellCenter(row, col);
    const fy   = Math.sin(_float + i * 1.4 + 2) * (_cellSize * 0.04);
    const glow = potionGlow(val);
    const s    = Math.min(_cellSize * 0.55, SPRITE_MAX);

    ctx.save();
    // Halo inferior
    ctx.beginPath();
    ctx.arc(x, y + fy + s * 0.6, s * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = glow.ring;
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.restore();

    // Orbe estilizado 3D (cian)
    drawCustomOrb(ctx, x, y + fy, s, 'cyan', '+' + val);
  });
}

// ── Pieza de caballero ────────────────────────────────
function drawKnight(x, y, isWhite, glowing) {
  const ctx = _ctx;
  const r = _cellSize * 0.39;

  ctx.save();
  ctx.shadowColor = isWhite ? 'rgba(255,255,220,0.8)' : 'rgba(120,80,240,0.75)';
  ctx.shadowBlur  = glowing ? 28 : 14;

  // Círculo base
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const gr = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.05, x, y, r);
  if (isWhite) {
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.65, '#e4d8c0');
    gr.addColorStop(1, '#b09070');
  } else {
    gr.addColorStop(0, '#5a4880');
    gr.addColorStop(0.65, '#281e40');
    gr.addColorStop(1, '#0e0a1c');
  }
  ctx.fillStyle = gr;
  ctx.fill();

  // Aro dorado/morado
  ctx.strokeStyle = isWhite ? 'rgba(201,169,97,0.95)' : 'rgba(160,120,255,0.85)';
  ctx.lineWidth   = _cellSize * 0.04;
  ctx.stroke();

  // Símbolo de caballo
  ctx.shadowBlur = 0;
  ctx.font = `${_cellSize * 0.42}px serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isWhite ? '#3a2510' : '#c9a961';
  ctx.fillText('♞', x, y + _cellSize * 0.02);
  ctx.restore();
}

// ── Pieza jugador (sprite o fallback) ────────────────
function drawPlayer(x, y, glowing) {
  const ctx = _ctx;
  const s = _cellSize * 0.84;
  ctx.save();
  ctx.shadowColor = 'rgba(120,80,255,0.8)';
  ctx.shadowBlur  = glowing ? 30 : 18;
  if (_sprites.jugador) {
    ctx.drawImage(_sprites.jugador, x - s / 2, y - s / 2, s, s);
  } else {
    drawKnight(x, y, false, glowing);
  }
  ctx.restore();
}

// ── Lerp animado ────────────────────────────────────
function lerpPos(anim) {
  const now = performance.now();
  const t   = Math.min(1, (now - anim.start) / anim.dur);
  const e   = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return {
    x: (_bx + anim.fromC * _cellSize + _cellSize / 2) + (anim.toC - anim.fromC) * _cellSize * e,
    y: (_by + anim.fromR * _cellSize + _cellSize / 2) + (anim.toR - anim.fromR) * _cellSize * e,
    done: t >= 1,
  };
}

// ── Dibujar piezas ───────────────────────────────────
function drawPieces(state) {
  if (!state) return;
  const [wr, wc] = state.white_pos || [0, 0];
  const [br, bc] = state.black_pos || [7, 7];

  // Caballo blanco (IA)
  if (_wAnim) {
    const lp = lerpPos(_wAnim);
    drawKnight(lp.x, lp.y, true, true);
    if (lp.done) _wAnim = null;
  } else {
    const { x, y } = cellCenter(wr, wc);
    drawKnight(x, y, true, false);
  }

  // Caballo negro (Jugador)
  if (_bAnim) {
    const lp = lerpPos(_bAnim);
    drawPlayer(lp.x, lp.y, true);
    if (lp.done) _bAnim = null;
  } else {
    const { x, y } = cellCenter(br, bc);
    drawPlayer(x, y, false);
  }
}

// ── Partículas 2D ────────────────────────────────────
function spawnParticles2D(row, col, color, n = 16) {
  const { x, y } = cellCenter(row, col);
  for (let i = 0; i < n; i++) {
    const ang   = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const spd   = 3 + Math.random() * 4;
    _particles.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 5,
      r:  2.5 + Math.random() * 3,
      color,
      life: 1.0,
    });
  }
}

function drawParticles() {
  const ctx  = _ctx;
  _particles = _particles.filter(p => p.life > 0);
  for (const p of _particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.35;
    p.life -= 0.03;
  }
}

// ── Loop de render ───────────────────────────────────
function renderLoop(state) {
  if (!_canvas) return;
  const ctx = _ctx;
  ctx.fillStyle = BG_COL;
  ctx.fillRect(0, 0, _canvas.width, _canvas.height);

  _float += 0.025;
  drawBoard();
  drawHighlights();
  drawCollectibles(state);
  drawPieces(state);
  drawParticles();

  requestAnimationFrame(() => renderLoop(window.__gameState));
}

// ── Detectar recogida entre estados ──────────────────
function detectPickup(prev, next) {
  if (!prev) return null;
  for (const k of Object.keys(prev.stars || {})) {
    if (!(next.stars || {})[k]) {
      const [row, col] = k.split(',').map(Number);
      return { type: 'star',   row, col, value: prev.stars[k] };
    }
  }
  for (const k of Object.keys(prev.energy_tiles || {})) {
    if (!(next.energy_tiles || {})[k]) {
      const [row, col] = k.split(',').map(Number);
      return { type: 'potion', row, col, value: prev.energy_tiles[k] };
    }
  }
  return null;
}

function flashBar(id, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 900);
}

function animatePickup(pickup, player) {
  if (!pickup) return;
  if (pickup.type === 'star') {
    spawnParticles2D(pickup.row, pickup.col, '#ffd43b', 18);
    flashBar(player === 'white' ? 'white-points-bar' : 'black-points-bar', 'bar-flash--gold');
    window.mostrarToast?.(`★ Snitch +${pickup.value} pts → ${player === 'white' ? 'IA' : 'Tú'}`, 2500);
  } else {
    spawnParticles2D(pickup.row, pickup.col, '#22d3ee', 14);
    flashBar(player === 'white' ? 'white-energy-bar' : 'black-energy-bar', 'bar-flash--cyan');
    window.mostrarToast?.(`⚡ Poción +${pickup.value} energía → ${player === 'white' ? 'IA' : 'Tú'}`, 2500);
  }
}

// ── Animación de salto ───────────────────────────────
function startAnim(piece, fromR, fromC, toR, toC) {
  _animating = true;
  const anim = { fromR, fromC, toR, toC, start: performance.now(), dur: ANIM_DUR };
  if (piece === 'white') _wAnim = anim;
  else                   _bAnim = anim;
  return new Promise(res => setTimeout(() => { _animating = false; res(); }, ANIM_DUR + 40));
}

// ── Aplicar estado ───────────────────────────────────
async function applyState(state, animW = false, animB = false, prevState = null) {
  const pickup   = detectPickup(prevState, state);
  const moverFue = prevState ? prevState.current_turn : null;
  const prev     = window.__gameState;

  if (animW && prev) await startAnim('white', prev.white_pos[0], prev.white_pos[1], state.white_pos[0], state.white_pos[1]);
  if (animB && prev) await startAnim('black', prev.black_pos[0], prev.black_pos[1], state.black_pos[0], state.black_pos[1]);

  if (pickup && moverFue) animatePickup(pickup, moverFue);

  window.__gameState = state;
  _validMoves = (state.current_turn === 'black' && !state.game_over)
    ? (state.valid_moves || [])
    : [];

  window.onEstadoActualizado?.(state);
}

// ── Turno de la IA ───────────────────────────────────
async function runAITurn() {
  if (_busy || window.__gameState?.game_over) return;
  if (window.__gameState?.current_turn !== 'white') return;
  _busy = true;
  _validMoves = [];

  const prevState = JSON.parse(JSON.stringify(window.__gameState));
  try {
    const profs = { principiante: 2, amateur: 4, experto: 6 };
    const prof  = profs[prevState.nivel] || 2;
    const resp  = await obtenerMovimientoIA(prevState, prof);

    if (resp?.movimiento?.length === 2) {
      const [r, c] = resp.movimiento;
      await startAnim('white', prevState.white_pos[0], prevState.white_pos[1], r, c);

      const next = JSON.parse(JSON.stringify(prevState));
      next.white_pos     = [r, c];
      next.current_turn  = 'black';
      const dKey = `${r},${c}`;
      if (prevState.stars?.[dKey] !== undefined) {
        next.white_points = (next.white_points || 0) + prevState.stars[dKey];
        delete next.stars[dKey];
        next.message = `IA recoge snitch: +${prevState.stars[dKey]} pts`;
      } else if (prevState.energy_tiles?.[dKey] !== undefined) {
        next.white_energy = (next.white_energy || 0) + prevState.energy_tiles[dKey];
        delete next.energy_tiles[dKey];
        next.message = `IA recoge poción: +${prevState.energy_tiles[dKey]} energía`;
      } else {
        next.message = `IA movió a [${r}, ${c}]`;
      }
      next.white_energy = Math.max(0, (next.white_energy || 0) - 1);
      const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      next.valid_moves = deltas.map(([dr,dc]) => [next.black_pos[0]+dr, next.black_pos[1]+dc])
                               .filter(([nr,nc]) => nr>=0&&nr<8&&nc>=0&&nc<8);
      await applyState(next, false, false, prevState);
    } else {
      const next = { ...prevState, current_turn: 'black', message: 'IA pasó su turno' };
      await applyState(next, false, false, prevState);
    }
  } catch (e) { console.error(e); }
  finally { _busy = false; }
}

// ── Click del jugador ────────────────────────────────
async function onPlayerClick(row, col) {
  if (_busy || _animating || window.__gameState?.game_over) return;
  if (window.__gameState?.current_turn !== 'black') return;

  const valid = (_validMoves).some(([r, c]) => r === row && c === col);
  if (!valid) { window.mostrarToast?.('Movimiento inválido'); return; }

  _busy = true;
  _validMoves = [];
  const prevState = JSON.parse(JSON.stringify(window.__gameState));

  await startAnim('black', prevState.black_pos[0], prevState.black_pos[1], row, col);

  const next  = JSON.parse(JSON.stringify(prevState));
  next.black_pos     = [row, col];
  next.current_turn  = 'white';
  next.valid_moves   = [];
  const dKey = `${row},${col}`;
  if (prevState.stars?.[dKey] !== undefined) {
    next.black_points = (next.black_points || 0) + prevState.stars[dKey];
    delete next.stars[dKey];
    next.message = `Recogiste snitch: +${prevState.stars[dKey]} pts`;
  } else if (prevState.energy_tiles?.[dKey] !== undefined) {
    next.black_energy = (next.black_energy || 0) + prevState.energy_tiles[dKey];
    delete next.energy_tiles[dKey];
    next.message = `Recogiste poción: +${prevState.energy_tiles[dKey]} energía`;
  } else {
    next.message = `Moviste a [${row}, ${col}]`;
  }
  next.black_energy = Math.max(0, (next.black_energy || 0) - 1);

  await applyState(next, false, false, prevState);
  _busy = false;
  setTimeout(runAITurn, 500);
}

// ── Construir tablero ─────────────────────────────────
async function buildBoard(estado) {
  const container = document.getElementById('map-canvas');
  container.innerHTML = '';

  _canvas = document.createElement('canvas');
  _canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;cursor:pointer;';
  container.appendChild(_canvas);
  _ctx = _canvas.getContext('2d');

  function resize() {
    _canvas.width  = container.clientWidth  || window.innerWidth;
    _canvas.height = container.clientHeight || window.innerHeight;
    computeLayout();
  }
  resize();
  window.addEventListener('resize', resize);

  _sprites = await loadSprites();

  // Click (solo interacción del juego, sin zoom)
  _canvas.addEventListener('click', e => {
    const rect = _canvas.getBoundingClientRect();
    const scaleX = _canvas.width  / rect.width;
    const scaleY = _canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top)  * scaleY;
    const cell = hitCell(px, py);
    if (cell) onPlayerClick(cell[0], cell[1]);
  });

  window.__sceneData = { applyState, runAITurn };

  // Iniciar loop
  renderLoop(window.__gameState);
  return { applyState, runAITurn };
}

// ── Eventos externos ──────────────────────────────────
window.addEventListener('partida-lista', async (e) => {
  const { applyState: aS, runAITurn: rAI } = await buildBoard(e.detail);
  await aS(e.detail);
  if (e.detail.current_turn === 'white' && !e.detail.game_over) {
    setTimeout(rAI, 800);
  }
});

window.addEventListener('partida-reiniciada', async (e) => {
  const sd = window.__sceneData;
  if (sd?.applyState) {
    _validMoves = [];
    _particles  = [];
    _wAnim = null; _bAnim = null;
    await sd.applyState(e.detail);
    if (e.detail.current_turn === 'white') setTimeout(() => sd.runAITurn?.(), 800);
  } else {
    await buildBoard(e.detail);
  }
});
