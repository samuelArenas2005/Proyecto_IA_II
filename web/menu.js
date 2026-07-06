'use strict';
/* ══════════════════════════════════════════════════════════════
   menu.js – Knight Energy · Menú interactivo
   Partículas doradas + transiciones suaves entre paneles
══════════════════════════════════════════════════════════════ */

// ── Partículas doradas decorativas ─────────────────────────
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const PARTICLE_COUNT = 18;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top  = `${60 + Math.random() * 40}%`;
    p.style.width  = `${2 + Math.random() * 3}px`;
    p.style.height = p.style.width;
    p.style.animationDuration = `${6 + Math.random() * 10}s`;
    p.style.animationDelay    = `${Math.random() * 8}s`;
    container.appendChild(p);
  }
})();

// Small toast helper for menu page (used for validation messages)
function mostrarToast(msg, dur = 2500) {
  let t = document.getElementById('menu-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'menu-toast';
    t.style.position = 'fixed';
    t.style.bottom = '70px';
    t.style.left = '50%';
    t.style.transform = 'translateX(-50%)';
    t.style.background = 'rgba(18,16,12,0.9)';
    t.style.color = '#f6ecd2';
    t.style.padding = '10px 18px';
    t.style.borderRadius = '6px';
    t.style.zIndex = 9999;
    t.style.fontFamily = "'Cinzel', serif";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = '0'; }, dur);
}

// ── Transiciones entre paneles ─────────────────────────────
const playSound = new Audio('assets/Sounds/play_game.mp3');
playSound.volume = 0.3;

window.irASeleccionNivel = function () {
  // Reproducir el sonido de presionar Play de forma sutil
  playSound.currentTime = 0;
  playSound.play().catch(() => {});

  const mainPanel  = document.getElementById('main-panel');
  const nivelPanel = document.getElementById('nivel-panel');

  mainPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  mainPanel.style.opacity    = '0';
  mainPanel.style.transform  = 'translateY(-20px) scale(0.97)';

  setTimeout(() => {
    mainPanel.style.display   = 'none';
    nivelPanel.style.display  = 'flex';
    nivelPanel.offsetHeight; // force reflow
    nivelPanel.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    nivelPanel.style.opacity    = '1';
    nivelPanel.style.transform  = 'translateY(0) scale(1)';
  }, 420);
};

window.regresarAlMenu = function () {
  const mainPanel  = document.getElementById('main-panel');
  const nivelPanel = document.getElementById('nivel-panel');

  nivelPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  nivelPanel.style.opacity    = '0';
  nivelPanel.style.transform  = 'translateY(20px) scale(0.97)';

  setTimeout(() => {
    nivelPanel.style.display  = 'none';
    mainPanel.style.display   = 'flex';
    mainPanel.offsetHeight; // force reflow
    mainPanel.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    mainPanel.style.opacity    = '1';
    mainPanel.style.transform  = 'translateY(0) scale(1)';
  }, 420);
};

window.seleccionarNivelYJugar = async function (nivel) {
  const root    = document.getElementById('menu-root');
  const overlay = document.getElementById('overlay');
  localStorage.setItem('knight_nivel_seleccionado', nivel);
  localStorage.setItem('knight_game_source', 'random');

  const entrySound = new Audio('assets/Sounds/entry_game.mp3');
  entrySound.volume = 0.6;
  entrySound.play().catch(()=>{});

  // Animación de salida
  root.style.transition    = 'opacity 0.5s ease';
  overlay.style.transition = 'opacity 0.5s ease';
  root.style.opacity    = '0';
  overlay.style.opacity = '0';

  setTimeout(() => {
    window.location.href = 'RenderMap/index.html';
  }, 520);
};

window.exitGame = function () {
  // Si tenemos Eel, cerramos la ventana; si no, intentamos cerrar la pestaña
  if (typeof eel !== 'undefined' && eel.close_window) {
    eel.close_window();
  } else {
    window.close();
  }
};

window.irAEditor = function () {
  const mainPanel   = document.getElementById('main-panel');
  const editorPanel = document.getElementById('editor-panel');

  playSound.currentTime = 0;
  playSound.play().catch(() => {});

  mainPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  mainPanel.style.opacity    = '0';
  mainPanel.style.transform  = 'translateY(-20px) scale(0.97)';

  setTimeout(() => {
    mainPanel.style.display   = 'none';
    editorPanel.style.display = 'flex';
    editorPanel.offsetHeight; // force reflow
    editorPanel.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    editorPanel.style.opacity    = '1';
    editorPanel.style.transform  = 'translateY(0) scale(1)';
  }, 420);
};

window.regresarAlMenuDesdeEditor = function () {
  const mainPanel   = document.getElementById('main-panel');
  const editorPanel = document.getElementById('editor-panel');

  editorPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  editorPanel.style.opacity    = '0';
  editorPanel.style.transform  = 'translateY(20px) scale(0.97)';

  setTimeout(() => {
    editorPanel.style.display = 'none';
    mainPanel.style.display   = 'flex';
    mainPanel.offsetHeight; // force reflow
    mainPanel.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    mainPanel.style.opacity    = '1';
    mainPanel.style.transform  = 'translateY(0) scale(1)';
  }, 420);
};

window.iniciarPartidaEditor = function () {
  const config = JSON.parse(localStorage.getItem('knight_editor_config') || '{}');
  config.level = config.level || 'principiante';
  config.depth = config.depth || (config.level === 'amateur' ? 4 : config.level === 'experto' ? 6 : 2);
  config.potions = config.potions || 0;
  config.snitches = config.snitches || 0;
  config.player = config.player || null;
  config.opponent = config.opponent || null;
  localStorage.setItem('knight_editor_config', JSON.stringify(config));
  localStorage.setItem('knight_nivel_seleccionado', config.level);
  localStorage.setItem('knight_game_source', 'editor');

  const entrySound = new Audio('assets/Sounds/entry_game.mp3');
  entrySound.volume = 0.6;
  entrySound.play().catch(()=>{});

  const root    = document.getElementById('menu-root');
  const overlay = document.getElementById('overlay');
  root.style.transition    = 'opacity 0.5s ease';
  overlay.style.transition = 'opacity 0.5s ease';
  root.style.opacity    = '0';
  overlay.style.opacity = '0';

  setTimeout(() => {
    window.location.href = 'RenderMap/index.html';
  }, 520);
};

window.seleccionarDificultadEditor = function (btn) {
  document.querySelectorAll('.ed-diff-btn').forEach(el => el.classList.remove('active'));
  btn.classList.add('active');
  const level = btn.dataset.diff;
  const depth = level === 'principiante' ? 2 : level === 'amateur' ? 4 : 6;
  document.getElementById('editor-diff-depth').textContent = `Depth ${depth}`;
  const config = JSON.parse(localStorage.getItem('knight_editor_config') || '{}');
  config.level = level;
  config.depth = depth;
  localStorage.setItem('knight_editor_config', JSON.stringify(config));
};

window.drag = function (event) {
  // keep for backward compatibility but selection mode preferred
  event.dataTransfer?.setData('text/plain', event.currentTarget.dataset.type);
};

window.allowDrop = function (event) {
  event.preventDefault();
};

window.dropOnCell = function (event, row, col) {
  event.preventDefault();
  const type = event.dataTransfer?.getData('text/plain');
  if (!type) return;

  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;
  if (cell.dataset.item === 'player' || cell.dataset.item === 'opponent') {
    cell.dataset[`${cell.dataset.item}-placed`] = 'false';
  }

  const config = JSON.parse(localStorage.getItem('knight_editor_config') || '{}');
  config.board = config.board || {};

  if (type === 'player' || type === 'opponent') {
    // Solo un jugador y un oponente pueden existir simultáneamente
    const existingKey = Object.keys(config.board || {}).find(key => {
      const it = config.board[key];
      const tt = typeof it === 'string' ? it : (it.t || '');
      return tt === type;
    });
    if (existingKey) {
      delete config.board[existingKey];
      const [oldRow, oldCol] = existingKey.split(',').map(Number);
      const oldCell = document.querySelector(`[data-row="${oldRow}"][data-col="${oldCol}"]`);
      if (oldCell) {
        oldCell.dataset.item = '';
        oldCell.querySelector('.cell-icon')?.remove();
      }
    }
    if (type === 'player') config.player = [row, col];
    if (type === 'opponent') config.opponent = [row, col];
  }

  // store as object to support values later
  config.board[`${row},${col}`] = { t: type };
  cell.dataset.item = type;
  cell.querySelector('.cell-icon')?.remove();

  const icon = document.createElement('img');
  icon.className = 'cell-icon';
  icon.alt = type;
  icon.src = type === 'snitch' ? 'assets/NewSprints/snitch_dorada.png'
            : type === 'potion' ? 'assets/NewSprints/energy_potion.png'
            : type === 'player' ? 'assets/NewSprints/player.png'
            : 'assets/NewSprints/enemy_player.png';
  cell.appendChild(icon);

  localStorage.setItem('knight_editor_config', JSON.stringify(config));
  actualizarContadoresEditor();
};

window.generarEditorBoard = function () {
  const board = document.getElementById('editor-board');
  if (!board) return;
  board.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.className = 'editor-cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.ondragover = allowDrop;
      cell.ondrop = event => dropOnCell(event, row, col);
      board.appendChild(cell);
    }
  }
};

window.actualizarContadoresEditor = function () {
  const config = JSON.parse(localStorage.getItem('knight_editor_config') || '{}');
  const board = config.board || {};
  const counts = { snitch: 0, potion: 0, player: 0, opponent: 0 };
    Object.values(board).forEach(item => {
      if (!item) return;
      const t = typeof item === 'string' ? item : (item.t || '');
      if (counts[t] !== undefined) counts[t] += 1;
    });
  document.getElementById('snitch-count').textContent = counts.snitch;
  document.getElementById('potion-count').textContent = counts.potion;
  document.getElementById('player-count').textContent = `${Math.min(1, counts.player)}/1`;
  document.getElementById('opponent-count').textContent = `${Math.min(1, counts.opponent)}/1`;
};

window.cargarEditor = function () {
  generarEditorBoard();
  const config = JSON.parse(localStorage.getItem('knight_editor_config') || '{}');
  const level = config.level || 'principiante';
  const initialBtn = document.querySelector(`.ed-diff-btn[data-diff="${level}"]`);
  if (initialBtn) initialBtn.click();

  const cells = document.querySelectorAll('.editor-cell');
  cells.forEach(cell => {
    const key = `${cell.dataset.row},${cell.dataset.col}`;
    if (config.board?.[key]) {
      const item = config.board[key];
      const type = typeof item === 'string' ? item : (item.t || '');
      const icon = document.createElement('img');
      icon.className = 'cell-icon';
      icon.alt = type;
      icon.src = type === 'snitch' ? 'assets/NewSprints/snitch_dorada.png'
                : type === 'potion' ? 'assets/NewSprints/energy_potion.png'
                : type === 'player' ? 'assets/NewSprints/player.png'
                : 'assets/NewSprints/enemy_player.png';
      cell.appendChild(icon);
      cell.dataset.item = type;
      // show value badge if present
      const val = typeof item === 'object' ? item.v : null;
      if (val) {
        const b = document.createElement('div'); b.className = 'cell-value-badge'; b.textContent = val; b.style.position='absolute'; b.style.right='6px'; b.style.bottom='6px'; b.style.background='rgba(10,10,12,0.7)'; b.style.color='#f3e8c1'; b.style.padding='2px 6px'; b.style.borderRadius='6px'; b.style.fontFamily = "'Cinzel', serif"; b.style.fontSize='0.8rem'; cell.appendChild(b);
      }
    }
  });
  actualizarContadoresEditor();
  updatePaletteState();
  updateStartButtonState();
};

// Selection-based placement (no drag)
window.selectedEditorType = null;
window.editorMode = 'place'; // 'place' or 'erase'

function getPaletteSelect(paletteItem) {
  return paletteItem?.querySelector('.value-select, .select-medieval') || null;
}

function getPaletteValue(paletteItem) {
  const select = getPaletteSelect(paletteItem);
  if (!select) return null;
  const value = Number(select.value);
  return Number.isFinite(value) ? value : null;
}

function updateSelectedPaletteLabel() {
  const activePalette = document.querySelector('.palette-item.active');
  if (!activePalette) return;
  const type = activePalette.dataset.type;
  const value = getPaletteValue(activePalette);
  document.getElementById('editor-selected-label').textContent = value
    ? `${type.toUpperCase()} (${value})`
    : type.toUpperCase();
}

window.selectPalette = function (el) {
  document.querySelectorAll('.palette-item').forEach(p => p.classList.remove('active'));
  if (!el) {
    window.selectedEditorType = null;
    document.getElementById('editor-selected-label').textContent = 'Ninguno';
    return;
  }
  const type = el.dataset.type;
  window.selectedEditorType = type;
  window.editorMode = 'place';
  el.classList.add('active');
  document.getElementById('editor-mode-label').textContent = 'Colocar';
  updateSelectedPaletteLabel();
  highlightPlaceableCells();
};

function highlightPlaceableCells() {
  const cells = document.querySelectorAll('.editor-cell');
  cells.forEach(cell => {
    if (!cell.dataset.item) cell.classList.add('editor-cell--highlight');
    else cell.classList.remove('editor-cell--highlight');
  });
}

function clearHighlights() {
  document.querySelectorAll('.editor-cell').forEach(c => c.classList.remove('editor-cell--highlight'));
}

window.generarEditorBoard = function () {
  const board = document.getElementById('editor-board');
  if (!board) return;
  board.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.className = 'editor-cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.onclick = () => onEditorCellClick(row, col, cell);
      board.appendChild(cell);
    }
  }
};

window.onEditorCellClick = function (row, col, cellEl) {
  if (window.editorMode === 'erase') {
    clearCellAt(row, col, true);
    return;
  }
  const sel = window.selectedEditorType;
  if (!sel) return;
  // If placing player/opponent ensure uniqueness
  const config = JSON.parse(localStorage.getItem('knight_editor_config') || '{}');
  config.board = config.board || {};
  const targetKey = `${row},${col}`;
  const previousItem = config.board[targetKey];
  const previousType = typeof previousItem === 'string' ? previousItem : (previousItem?.t || '');
  if (previousType === 'player') delete config.player;
  if (previousType === 'opponent') delete config.opponent;

  if (sel === 'player' || sel === 'opponent') {
    const existingKey = Object.keys(config.board).find(k => {
      const it = config.board[k];
      const tt = typeof it === 'string' ? it : (it?.t || '');
      return tt === sel;
    });
    if (existingKey) {
      // remove previous
      delete config.board[existingKey];
      const [r,c] = existingKey.split(',').map(Number);
      const oldCell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      if (oldCell) {
        oldCell.dataset.item = '';
        oldCell.querySelector('.cell-icon')?.remove();
        oldCell.querySelector('.cell-value-badge')?.remove();
      }
    }
    if (sel === 'player') config.player = [row, col];
    if (sel === 'opponent') config.opponent = [row, col];
  }
  // determine value for snitch/potion
  let placeValue = null;
  const activePalette = document.querySelector(`.palette-item.active`);
  if (activePalette) placeValue = getPaletteValue(activePalette);

  // place (store as object with type and value when applicable)
  if (sel === 'snitch' || sel === 'potion') {
    config.board[targetKey] = { t: sel, v: placeValue || (sel==='snitch'?5:3) };
  } else {
    config.board[targetKey] = { t: sel };
  }
  localStorage.setItem('knight_editor_config', JSON.stringify(config));

  // render icon
  const iconSrc = sel === 'snitch' ? 'assets/NewSprints/snitch_dorada.png'
                : sel === 'potion' ? 'assets/NewSprints/energy_potion.png'
                : sel === 'player' ? 'assets/NewSprints/player.png'
                : 'assets/NewSprints/enemy_player.png';
  cellEl.dataset.item = sel;
  cellEl.querySelector('.cell-icon')?.remove();
  cellEl.querySelector('.cell-value-badge')?.remove();
  const img = document.createElement('img'); img.className = 'cell-icon'; img.src = iconSrc; img.alt = sel;
  cellEl.appendChild(img);
  // show value badge if applicable
  const cfg = config.board[targetKey];
  if (cfg && cfg.v) {
    const b = document.createElement('div'); b.className = 'cell-value-badge'; b.textContent = cfg.v; b.style.position='absolute'; b.style.right='6px'; b.style.bottom='6px'; b.style.background='rgba(10,10,12,0.7)'; b.style.color='#f3e8c1'; b.style.padding='2px 6px'; b.style.borderRadius='6px'; b.style.fontFamily = "'Cinzel', serif"; b.style.fontSize='0.8rem'; cellEl.appendChild(b);
  }

  actualizarContadoresEditor();
  updatePaletteState();
  updateStartButtonState();
};

function clearCellAt(row, col, save = true) {
  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;
  const config = JSON.parse(localStorage.getItem('knight_editor_config') || '{}');
  config.board = config.board || {};
  const key = `${row},${col}`;
  const was = config.board[key];
  if (was) delete config.board[key];
  const wasType = typeof was === 'string' ? was : (was?.t || '');
  if (wasType === 'player') delete config.player;
  if (wasType === 'opponent') delete config.opponent;
  cell.dataset.item = '';
  cell.querySelector('.cell-icon')?.remove();
  cell.querySelector('.cell-value-badge')?.remove();
  if (save) localStorage.setItem('knight_editor_config', JSON.stringify(config));
  actualizarContadoresEditor();
  updatePaletteState();
  updateStartButtonState();
}

window.clearAllBoard = function () {
  const cells = document.querySelectorAll('.editor-cell');
  const config = {};
  config.board = {};
  localStorage.setItem('knight_editor_config', JSON.stringify(config));
  cells.forEach(c => {
    c.dataset.item = '';
    c.querySelector('.cell-icon')?.remove();
    c.querySelector('.cell-value-badge')?.remove();
  });
  actualizarContadoresEditor();
  updatePaletteState();
  updateStartButtonState();
};

window.setEraseMode = function () {
  window.editorMode = 'erase';
  document.getElementById('editor-mode-label').textContent = 'Eliminar';
  document.getElementById('editor-selected-label').textContent = 'Clic en celda';
  clearHighlights();
};

window.randomizeBoard = function () {
  const cells = Array.from(document.querySelectorAll('.editor-cell'));
  clearAllBoard();
  const config = { board: {} };
  // place one player and opponent
  function pickEmpty() { return cells.splice(Math.floor(Math.random() * cells.length), 1)[0]; }
  const pCell = pickEmpty(); const pRow = pCell.dataset.row; const pCol = pCell.dataset.col;
  config.board[`${pRow},${pCol}`] = { t: 'player' }; config.player = [Number(pRow), Number(pCol)];
  const oCell = pickEmpty(); const oRow = oCell.dataset.row; const oCol = oCell.dataset.col;
  config.board[`${oRow},${oCol}`] = { t: 'opponent' }; config.opponent = [Number(oRow), Number(oCol)];
  // random snitches and potions
  const toPlace = Math.floor(Math.random()*6)+2; // 2-7 items
  for (let i=0;i<toPlace;i++) {
    if (cells.length===0) break; const c = pickEmpty(); const r=c.dataset.row; const col=c.dataset.col;
    const t = Math.random() < 0.5 ? 'snitch' : 'potion';
    const v = t === 'snitch' ? [2,3,4,5,6,8,9][Math.floor(Math.random()*7)] : [2,3,4,5][Math.floor(Math.random()*4)];
    config.board[`${r},${col}`] = { t, v };
  }
  localStorage.setItem('knight_editor_config', JSON.stringify(config));
  cargarEditor();
  updateStartButtonState();
};

function updatePaletteState() {
  const config = JSON.parse(localStorage.getItem('knight_editor_config') || '{}');
  const board = config.board || {};
  const foundPlayer = Object.values(board).some(it => (typeof it === 'string' ? it : (it?.t || '')) === 'player') || !!config.player;
  const foundOpponent = Object.values(board).some(it => (typeof it === 'string' ? it : (it?.t || '')) === 'opponent') || !!config.opponent;
  const pp = document.getElementById('palette-player');
  const po = document.getElementById('palette-opponent');
  if (pp) { pp.disabled = !!foundPlayer; pp.classList.toggle('disabled', !!foundPlayer); }
  if (po) { po.disabled = !!foundOpponent; po.classList.toggle('disabled', !!foundOpponent); }
}

function updateStartButtonState() {
  const config = JSON.parse(localStorage.getItem('knight_editor_config') || '{}');
  const hasSnitch = Object.values(config.board || {}).some(item => {
    const type = typeof item === 'string' ? item : (item?.t || '');
    return type === 'snitch';
  });
  const ok = !!config.player && !!config.opponent && hasSnitch;
  const btn = document.getElementById('btn-editor-start');
  if (btn) { btn.disabled = !ok; btn.classList.toggle('disabled', !ok); }
}

// Ensure start checks for both players
const oldIniciar = window.iniciarPartidaEditor;
window.iniciarPartidaEditor = function () {
  const config = JSON.parse(localStorage.getItem('knight_editor_config') || '{}');
  if (!config.player || !config.opponent) {
    mostrarToast('Debe colocar Jugador y Oponente antes de iniciar', 3000);
    return;
  }
  const hasSnitch = Object.values(config.board || {}).some(item => {
    const type = typeof item === 'string' ? item : (item?.t || '');
    return type === 'snitch';
  });
  if (!hasSnitch) {
    mostrarToast('Debe colocar al menos una Snitch para que la partida tenga objetivo', 3000);
    return;
  }
  // proceed (save config is already stored) and navigate
  oldIniciar();
};

const menuBgTracks = ['assets/Sounds/bg_1.mp3', 'assets/Sounds/bg_2.mp3', 'assets/Sounds/bg_3.mp3'];
let menuBgIndex = 0;
const menuBgAudio = new Audio(menuBgTracks[0]);
menuBgAudio.volume = 0.08;
menuBgAudio.addEventListener('ended', () => {
  menuBgIndex = (menuBgIndex + 1) % menuBgTracks.length;
  menuBgAudio.src = menuBgTracks[menuBgIndex];
  menuBgAudio.play().catch(() => {});
});

document.addEventListener('DOMContentLoaded', () => {
  // Always start editor empty on page load (clear previous placements)
  localStorage.setItem('knight_game_source', 'random');
  localStorage.setItem('knight_editor_config', JSON.stringify({}));
  cargarEditor();
  document.querySelectorAll('.palette-item .select-medieval').forEach(select => {
    select.addEventListener('click', event => event.stopPropagation());
    select.addEventListener('change', event => {
      const paletteItem = event.currentTarget.closest('.palette-item');
      if (!paletteItem) return;
      selectPalette(paletteItem);
    });
  });
  document.addEventListener('click', () => {
    if (menuBgAudio.paused) menuBgAudio.play().catch(() => {});
  }, { once: true });
});

// ── Hover SFX — sonido al pasar sobre los botones ──────────
const hoverSound = new Audio('assets/Sounds/select_menu_sound.mp3');
hoverSound.preload = 'auto';
hoverSound.volume  = 0.4;

document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    // Reiniciar el sonido para que funcione en hovers rápidos
    hoverSound.currentTime = 0;
    hoverSound.play().catch(() => {});
  });
});
