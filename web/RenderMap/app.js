'use strict';
/* ═══════════════════════════════════════════════════════════════
   app.js — Knight Energy · Game Board Logic & Rendering
   Genera el tablero HTML, gestiona HUD, sonidos y navegación
═══════════════════════════════════════════════════════════════ */

const GRID = 8;
const ASSET_BASE = '../assets/NewSprints/';
const SOUND_BASE = '../assets/Sounds/';
const GAME_OVER_DELAY_MS = 450;

function getLegalMoves(estado, turn = estado.current_turn || 'black') {
  const whitePos = estado.white_pos || [0, 0];
  const blackPos = estado.black_pos || [0, 0];
  const energy = turn === 'white' ? estado.white_energy : estado.black_energy;
  if (typeof energy !== 'number' || energy < 1) {
    return [];
  }

  const source = turn === 'white' ? whitePos : blackPos;
  const moves = [
    [source[0] + 2, source[1] + 1], [source[0] + 2, source[1] - 1],
    [source[0] - 2, source[1] + 1], [source[0] - 2, source[1] - 1],
    [source[0] + 1, source[1] + 2], [source[0] + 1, source[1] - 2],
    [source[0] - 1, source[1] + 2], [source[0] - 1, source[1] - 2]
  ];

  return moves.filter(([r, c]) => {
    if (r < 0 || r >= GRID || c < 0 || c >= GRID) return false;
    if (r === whitePos[0] && c === whitePos[1]) return false;
    if (r === blackPos[0] && c === blackPos[1]) return false;
    return true;
  });
}

function cloneState(estado) {
  return JSON.parse(JSON.stringify(estado));
}

function isSameMove(moveA, moveB) {
  return Array.isArray(moveA) && Array.isArray(moveB) && moveA[0] === moveB[0] && moveA[1] === moveB[1];
}

function showGameOverAfterMove(estado) {
  setTimeout(() => { showGameOver(estado); }, GAME_OVER_DELAY_MS);
}
async function processAIMove() {
  if (!currentGameState || currentGameState.game_over || currentGameState.current_turn !== 'white') {
    return;
  }

  const depth = NIVEL_MAP[currentGameState.nivel]?.depth || 2;
  mostrarToast('IA calculando movimiento...', 1800);

  // Ask the backend for the best move
  const response = await eel.obtener_movimiento_ia(currentGameState, depth)();
  const movimiento = response?.movimiento || null;

  if (!movimiento || !Array.isArray(movimiento)) {
    const nextState = await eel.aplicar_movimiento(currentGameState, null)();
    if (!nextState) return;
    currentGameState = nextState;
    mostrarToast('IA pierde turno (-3 pts).', 1800);
    updateHUD(currentGameState);
    if (currentGameState.game_over) {
      showGameOverAfterMove(currentGameState);
    }
    return;
  }

  // Delegate the state transition entirely to the backend
  const nextState = await eel.aplicar_movimiento(currentGameState, movimiento)();
  if (!nextState) return;

  currentGameState = nextState;
  mostrarToast(`IA movió a (${movimiento[0]}, ${movimiento[1]})`, 1500);
  updateHUD(currentGameState);

  if (currentGameState.game_over) {
    showGameOverAfterMove(currentGameState);
    return;
  }

  if (currentGameState.current_turn === 'white') {
    setTimeout(() => { processAIMove(); }, 600);
  }
}


// ── Sonido hover para botones ──────────────────────────────
const hoverSound = new Audio(`${SOUND_BASE}select_menu_sound.mp3`);
hoverSound.preload = 'auto';
hoverSound.volume = 0.35;

// ── Música de fondo ────────────────────────────────────────
const bgTracks = [`${SOUND_BASE}bg_1.mp3`, `${SOUND_BASE}bg_2.mp3`, `${SOUND_BASE}bg_3.mp3`];
let currentBgTrack = 0;
const bgAudio = new Audio(bgTracks[0]);
bgAudio.volume = 0.10; // Volumen sutil
bgAudio.addEventListener('ended', () => {
  currentBgTrack = (currentBgTrack + 1) % bgTracks.length;
  bgAudio.src = bgTracks[currentBgTrack];
  bgAudio.play().catch(() => { });
});

// ── Efectos de Sonido ──────────────────────────────────────
const potionSound = new Audio(`${SOUND_BASE}energy.mp3`);
const snitchSound = new Audio(`${SOUND_BASE}coin.mp3`);
potionSound.volume = 0.6;
snitchSound.volume = 0.6;

let previousState = null;
let resolvingForcedPass = false;

// ── Niveles ────────────────────────────────────────────────
const NIVEL_MAP = {
  principiante: { label: 'BEGINNER (D2)', depth: 2 },
  amateur: { label: 'AMATEUR (D4)', depth: 4 },
  experto: { label: 'EXPERT (D6)', depth: 6 },
};

// ── Toast ──────────────────────────────────────────────────
function mostrarToast(msg, dur = 3000) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), dur);
}
window.mostrarToast = mostrarToast;

// ═══════════════════════════════════════════════════════════
// RENDERIZADO DEL TABLERO (HTML GRID)
// ═══════════════════════════════════════════════════════════

let isBoardInitialized = false;

function renderBoard(estado) {
  const grid = document.getElementById('board-grid');
  if (!grid) return;

  if (!isBoardInitialized) {
    grid.innerHTML = '';
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${r}-${c}`;
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.style.animationDelay = `${Math.random() * 0.4}s`;
        cell.classList.add('cell--animate-entry');
        grid.appendChild(cell);
      }
    }

    // Add horses container
    const horsesContainer = document.createElement('div');
    horsesContainer.id = 'horses-container';
    horsesContainer.className = 'horses-container';

    const whiteHorse = document.createElement('div');
    whiteHorse.id = 'horse-white';
    whiteHorse.className = 'cell__piece horse-piece';
    whiteHorse.innerHTML = `<div class="cell__shadow"></div><img src="${ASSET_BASE}enemy_player.png" alt="IA" class="cell__img" />`;

    const blackHorse = document.createElement('div');
    blackHorse.id = 'horse-black';
    blackHorse.className = 'cell__piece horse-piece';
    blackHorse.innerHTML = `<div class="cell__shadow"></div><img src="${ASSET_BASE}player.png" alt="Jugador" class="cell__img" />`;

    horsesContainer.appendChild(whiteHorse);
    horsesContainer.appendChild(blackHorse);
    grid.appendChild(horsesContainer);

    isBoardInitialized = true;
  }

  const whitePos = estado.white_pos;
  const blackPos = estado.black_pos;
  const stars = estado.stars || {};
  const energyTiles = estado.energy_tiles || {};

  // Update Horses positions (smooth animation)
  const wHorse = document.getElementById('horse-white');
  const bHorse = document.getElementById('horse-black');
  if (wHorse) {
    wHorse.style.top = `${whitePos[0] * 12.5}%`;
    wHorse.style.left = `${whitePos[1] * 12.5}%`;
  }
  if (bHorse) {
    bHorse.style.top = `${blackPos[0] * 12.5}%`;
    bHorse.style.left = `${blackPos[1] * 12.5}%`;
  }

  // Update Cells content directly to avoid flashes
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const cell = document.getElementById(`cell-${r}-${c}`);
      if (!cell) continue;

      const key = `${r},${c}`;
      const starVal = stars[key];
      const potionVal = energyTiles[key];
      const legalMoves = estado.current_turn === 'black' ? getLegalMoves(estado, 'black') : [];
      const isValid = legalMoves.some(move => move[0] === r && move[1] === c);
      const isOccupied = (r === whitePos[0] && c === whitePos[1]) || (r === blackPos[0] && c === blackPos[1]);

      cell.className = 'cell'; // reset classes keeping DOM intact
      cell.onclick = (!isOccupied && isValid) ? () => onCellClick(r, c) : null;
      if (isValid) {
        cell.classList.add('cell--valid');
      }
      const currentItemType = cell.dataset.itemType || '';
      const currentItemVal = cell.dataset.itemVal || '';
      let newItemType = '';
      let newItemVal = '';

      if (starVal !== undefined) {
        newItemType = 'snitch';
        newItemVal = starVal.toString();
      } else if (potionVal !== undefined) {
        newItemType = 'potion';
        newItemVal = potionVal.toString();
      }

      if (currentItemType !== newItemType || currentItemVal !== newItemVal) {
        cell.dataset.itemType = newItemType;
        cell.dataset.itemVal = newItemVal;

        if (newItemType === 'snitch') {
          const glowIntensity = starVal >= 6 ? 'cell__glow--high' : (starVal >= 4 ? 'cell__glow--mid' : '');
          cell.innerHTML = `
            <div class="item-container" style="width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;">
              <div class="cell__glow cell__glow--snitch ${glowIntensity}"></div>
              <img src="${ASSET_BASE}snitch_dorada.png" alt="Snitch" class="cell__img cell__img--snitch" />
              <span class="cell__value">${starVal}</span>
            </div>`;
        } else if (newItemType === 'potion') {
          const glowIntensity = potionVal >= 4 ? 'cell__glow--high' : (potionVal >= 3 ? 'cell__glow--mid' : '');
          cell.innerHTML = `
            <div class="item-container" style="width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;">
              <div class="cell__glow cell__glow--potion ${glowIntensity}"></div>
              <img src="${ASSET_BASE}energy_potion.png" alt="Potion" class="cell__img cell__img--potion" />
              <span class="cell__value">${potionVal}</span>
            </div>`;
        } else {
          cell.innerHTML = '';
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// HUD UPDATE
// ═══════════════════════════════════════════════════════════

function updateHUD(estado) {
  if (!estado) return;

  // Puntos y energía
  const we = document.getElementById('white-energy');
  const wp = document.getElementById('white-points');
  const be = document.getElementById('black-energy');
  const bp = document.getElementById('black-points');

  // El panel izquierdo en la UI es el jugador negro, el derecho es la IA blanca.
  if (we) we.textContent = estado.black_energy;
  if (wp) wp.textContent = estado.black_points;
  if (be) be.textContent = estado.white_energy;
  if (bp) bp.textContent = estado.white_points;

  // Turnos
  const turnLabel = document.getElementById('turn-label');
  if (turnLabel) {
    if (estado.game_over) {
      turnLabel.textContent = 'PARTIDA TERMINADA';
    } else if (estado.current_turn) {
      turnLabel.textContent = estado.current_turn === 'white' ? 'TURNO IA' : 'TURNO JUGADOR';
    } else {
      turnLabel.textContent = 'TURNO JUGADOR';
    }
  }

  // Dificultad
  const diffLabel = document.getElementById('difficulty-label');
  if (diffLabel && estado.nivel) {
    const info = NIVEL_MAP[estado.nivel] || { label: estado.nivel.toUpperCase() };
    diffLabel.textContent = `DIFFICULTY: ${info.label}`;
  }

  currentGameState = estado;

  // Animación dopamínica y sonidos si los stats del jugador (Negro) suben tras su movimiento
  if (previousState && estado.current_turn === 'white') {
    // Es turno de IA, lo que significa que el jugador negro acaba de mover
    const r = estado.black_pos[0];
    const c = estado.black_pos[1];
    const key = `${r},${c}`;

    if (previousState.stars && previousState.stars[key] !== undefined) {
      const val = previousState.stars[key];
      if (wp) { wp.classList.remove('dopamine-pop'); void wp.offsetWidth; wp.classList.add('dopamine-pop'); }
      snitchSound.currentTime = 0; snitchSound.play().catch(() => { });
      spawnFloatingText([r, c], `+${val}`, 'snitch');
    }

    if (previousState.energy_tiles && previousState.energy_tiles[key] !== undefined) {
      const val = previousState.energy_tiles[key];
      if (we) { we.classList.remove('dopamine-pop'); void we.offsetWidth; we.classList.add('dopamine-pop'); }
      potionSound.currentTime = 0; potionSound.play().catch(() => { });
      spawnFloatingText([r, c], `+${val}`, 'potion');
    }
  }
  previousState = JSON.parse(JSON.stringify(estado));

  // Render tablero
  renderBoard(estado);

  if (
    !resolvingForcedPass &&
    !estado.game_over &&
    estado.current_turn === 'black' &&
    getLegalMoves(estado, 'black').length === 0
  ) {
    resolvingForcedPass = true;
    setTimeout(async () => {
      const nextState = await eel.aplicar_movimiento(currentGameState, null)();
      resolvingForcedPass = false;
      if (!nextState) return;
      currentGameState = nextState;
      mostrarToast('Pierdes turno (-3 pts).', 1800);
      updateHUD(currentGameState);
      if (currentGameState.game_over) {
        showGameOverAfterMove(currentGameState);
        return;
      }
      if (currentGameState.current_turn === 'white') {
        setTimeout(() => { processAIMove(); }, 300);
      }
    }, 0);
  }
}

function spawnFloatingText(pos, text, type) {
  const container = document.getElementById('horses-container');
  if (!container) return;
  const floating = document.createElement('div');
  floating.className = `floating-text floating-text--${type}`;
  floating.textContent = text;
  floating.style.top = `${pos[0] * 12.5 + 6.25}%`;
  floating.style.left = `${pos[1] * 12.5 + 6.25}%`;
  container.appendChild(floating);
  setTimeout(() => floating.remove(), 1200);
}

// ═══════════════════════════════════════════════════════════
// GAME OVER
// ═══════════════════════════════════════════════════════════

function showGameOver(estado) {
  const modal = document.getElementById('game-over-modal');
  const title = document.getElementById('game-over-title');
  const content = document.getElementById('game-over-content');
  if (!modal || !content) return;

  let resultText = 'EMPATE';
  if (estado.winner === 'white') resultText = 'VICTORIA DE LA IA';
  else if (estado.winner === 'black') resultText = '¡VICTORIA TUYA!';

  title.textContent = resultText;
  content.innerHTML = `
    <div class="result-row">
      <span>IA (Blanco)</span>
      <span>${estado.white_points} pts</span>
    </div>
    <div class="result-row">
      <span>Tú (Negro)</span>
      <span>${estado.black_points} pts</span>
    </div>
  `;
  modal.classList.add('modal-overlay--open');
}

// ═══════════════════════════════════════════════════════════
// CELL CLICK (jugador humano)
// ═══════════════════════════════════════════════════════════

let currentGameState = null;
window.debugMode = false;

window.onDebugMode = function (enabled) {
  window.debugMode = !!enabled;
  mostrarToast(`Debug ${window.debugMode ? 'ACTIVADO' : 'DESACTIVADO'}`, 2200);
};

async function onCellClick(row, col) {
  if (!currentGameState || currentGameState.game_over) {
    return;
  }

  if (window.debugMode) {
    const debugPayload = { ...currentGameState, debug_move: [row, col] };
    if (typeof eel !== 'undefined' && eel.dev_show_state) {
      eel.dev_show_state(debugPayload)();
    }
    mostrarToast(`Debug: movimiento de jugador a (${row}, ${col})`, 1800);
    return;
  }

  if (currentGameState.current_turn !== 'black') {
    mostrarToast('No es tu turno. Espera al caballo blanco.', 1800);
    return;
  }

  // Validate locally (for UI feedback only — the backend enforces rules)
  const validMoves = getLegalMoves(currentGameState, 'black');
  const isValid = validMoves.some(move => move[0] === row && move[1] === col);
  if (!isValid) {
    mostrarToast('Movimiento inválido para el caballo negro.', 1800);
    return;
  }

  // Delegate the state transition entirely to the backend
  const nextState = await eel.aplicar_movimiento(currentGameState, [row, col])();
  if (!nextState) return;

  currentGameState = nextState;
  updateHUD(currentGameState);

  if (currentGameState.game_over) {
    showGameOverAfterMove(currentGameState);
    return;
  }

  setTimeout(() => { processAIMove(); }, 300);
}

// ═══════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════

async function cargarPartida() {
  try {
    if (typeof eel !== 'undefined' && eel.solicitar_mapa_aleatorio) {
      const estadoMock = await eel.solicitar_mapa_aleatorio()();
      if (estadoMock) {
        const nivelGuardado = localStorage.getItem('knight_nivel_seleccionado') || 'principiante';
        const defaultState = {
          white_energy: 7,
          black_energy: 7,
          white_points: 0,
          black_points: 0,
          current_turn: 'white',
          game_over: false,
          winner: null,
          nivel: nivelGuardado
        };
        currentGameState = { ...defaultState, ...estadoMock };
        updateHUD(currentGameState);
        if (currentGameState.current_turn === 'white') {
          setTimeout(async () => {
            await processAIMove();
          }, 1500);
        }
        return;
      }
    }

    // Fallback por si EEL no responde
    const nivelGuardado = localStorage.getItem('knight_nivel_seleccionado') || 'principiante';
    const editorConfig = JSON.parse(localStorage.getItem('knight_editor_config') || '{}');
    const boardConfig = editorConfig.board || {};
    const whitePos = editorConfig.player || [6, 1];
    const blackPos = editorConfig.opponent || [1, 5];

    const stars = {};
    const energy_tiles = {};
    let counterSnitch = 0;
    let counterPotion = 0;

    Object.entries(boardConfig).forEach(([key, item]) => {
      // item can be legacy string ('snitch'|'potion') or an object {t: 'snitch'|'potion', v: number}
      const type = typeof item === 'string' ? item : (item.t || '');
      const val = typeof item === 'string' ? (type === 'snitch' ? 5 : (type === 'potion' ? 3 : null)) : (item.v || null);
      if (type === 'snitch') {
        stars[key] = val || 5;
        counterSnitch += 1;
      }
      if (type === 'potion') {
        energy_tiles[key] = val || 3;
        counterPotion += 1;
      }
    });

    const estadoInicial = {
      board_size: 8,
      nivel: nivelGuardado,
      white_pos: whitePos,
      black_pos: blackPos,
      stars,
      energy_tiles,
      white_energy: 7,
      black_energy: 7,
      white_points: 0,
      black_points: 0,
      current_turn: 'white',
      game_over: false,
      winner: null,
      valid_moves: []
    };
    currentGameState = estadoInicial;
    updateHUD(currentGameState);
    if (currentGameState.current_turn === 'white') {
      setTimeout(async () => {
        await processAIMove();
      }, 1500);
    }
  } catch (e) {
    console.error('Error cargando partida:', e);
  }
}

// ── API pública ────────────────────────────────────────────
function onEstadoActualizado(estado) {
  updateHUD(estado);
  if (estado.game_over) showGameOverAfterMove(estado);
}
window.onEstadoActualizado = onEstadoActualizado;

window.nuevaPartida = async function () {
  const modal = document.getElementById('game-over-modal');
  if (modal) modal.classList.remove('modal-overlay--open');

  const entrySound = new Audio(`${SOUND_BASE}entry_game.mp3`);
  entrySound.volume = 0.6;
  entrySound.play().catch(() => { });

  isBoardInitialized = false;
  await cargarPartida();
  mostrarToast('Nueva partida inicializada');
};

window.irAlMenu = function () {
  document.body.classList.add('fade-out');
  setTimeout(() => { window.location.href = '../menu.html'; }, 450);
};

// ── DOM Ready ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  cargarPartida();

  // Close game over modal
  document.getElementById('btn-close-game-over')?.addEventListener('click', () => {
    document.getElementById('game-over-modal')?.classList.remove('modal-overlay--open');
  });

  // Hover sound para botones del footer
  document.querySelectorAll('.footer-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      hoverSound.currentTime = 0;
      hoverSound.play().catch(() => { });
    });
  });

  // Reproducir música al primer tap/click (autolay policy protection)
  document.addEventListener('click', () => {
    if (bgAudio.paused) {
      bgAudio.play().catch(() => { });
    }
  }, { once: true });
});

// ── Eel expose ─────────────────────────────────────────────
if (typeof eel !== 'undefined') {
  eel.expose(mostrar_notificacion);
  eel.expose(onEstadoActualizado);
}
function mostrar_notificacion(msg) { mostrarToast(msg, 4000); }
