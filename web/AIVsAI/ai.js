'use strict';

const GRID = 8;
const ASSET_BASE = '../assets/NewSprints/';
const SOUND_BASE = '../assets/Sounds/';
const GAME_OVER_DELAY_MS = 450;

let currentGameState = null;
let previousState = null;
let isBoardInitialized = false;
let autoPlaying = false;
let aiTimer = null;
let heuristicOptions = [];

const CUSTOM_HEURISTICS_KEY = 'knight_custom_heuristics';
const CUSTOM_WEIGHT_FIELDS = [
  { key: 'points', label: 'Diferencia de puntos', symbol: 'Pdiff', value: 100 },
  { key: 'energy', label: 'Diferencia de energia', symbol: 'Ediff', value: 10 },
  { key: 'mobility', label: 'Diferencia de movilidad', symbol: 'Mdiff', value: 5 },
  { key: 'stars', label: 'Estrellas alcanzables', symbol: 'Sdiff', value: 20 },
  { key: 'energy_tiles', label: 'Pociones alcanzables', symbol: 'Tdiff', value: 8 },
  { key: 'blocked', label: 'Bloqueo', symbol: 'Bscore', value: 50 },
  { key: 'center', label: 'Control central', symbol: 'Cdiff', value: 2 },
];

const hoverSound = new Audio(`${SOUND_BASE}select_menu_sound.mp3`);
hoverSound.volume = 0.35;
const potionSound = new Audio(`${SOUND_BASE}energy.mp3`);
const snitchSound = new Audio(`${SOUND_BASE}coin.mp3`);
potionSound.volume = 0.55;
snitchSound.volume = 0.55;

function getLegalMoves(estado, turn = estado.current_turn || 'white') {
  const whitePos = estado.white_pos || [0, 0];
  const blackPos = estado.black_pos || [0, 0];
  const energy = turn === 'white' ? estado.white_energy : estado.black_energy;
  if (typeof energy !== 'number' || energy < 1) return [];

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

function mostrarToast(msg, dur = 2200) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), dur);
}

function labelForHeuristic(id) {
  return heuristicOptions.find(item => item.id === id)?.label || id;
}

function heuristicFor(id) {
  return heuristicOptions.find(item => item.id === id) || heuristicOptions[0];
}

function renderFormulaMarkup(item) {
  const terms = item.weights
    .filter(weight => Number(weight.value) !== 0)
    .map(weight => `
      <span class="formula-term">
        <strong>${weight.value}</strong><span>${weight.symbol}</span>
      </span>
    `);

  return `
    <div class="formula-line" aria-label="Formula de la heuristica">
      <span class="formula-name">H(s)</span>
      <span>=</span>
      ${terms.join('<span class="formula-plus">+</span>')}
    </div>
  `;
}

function renderHeuristicDetail(targetId, heuristicId, title) {
  const target = document.getElementById(targetId);
  const item = heuristicFor(heuristicId);
  if (!target || !item) return;

  target.innerHTML = `
    <h3>${title}: ${item.label}</h3>
    <p>${item.description}</p>
    ${renderFormulaMarkup(item)}
    <div class="weight-grid">
      ${item.weights.map(weight => `
        <div class="weight-pill">
          <span>${weight.symbol} · ${weight.label}</span>
          <strong>${weight.value}</strong>
        </div>
      `).join('')}
    </div>
  `;
}

function updateHeuristicDetails() {
  renderHeuristicDetail('white-heuristic-detail', document.getElementById('white-heuristic').value, 'Plateada');
  renderHeuristicDetail('black-heuristic-detail', document.getElementById('black-heuristic').value, 'Dorada');
}

function renderHeuristicSelects() {
  const whiteSelect = document.getElementById('white-heuristic');
  const blackSelect = document.getElementById('black-heuristic');
  const previousWhite = whiteSelect.value || 'balanced';
  const previousBlack = blackSelect.value || 'aggressive';
  const html = heuristicOptions.map(item => `<option value="${item.id}">${item.label}</option>`).join('');
  whiteSelect.innerHTML = html;
  blackSelect.innerHTML = html;
  whiteSelect.value = heuristicOptions.some(item => item.id === previousWhite) ? previousWhite : 'balanced';
  blackSelect.value = heuristicOptions.some(item => item.id === previousBlack) ? previousBlack : 'aggressive';
  whiteSelect.onchange = updateHeuristicDetails;
  blackSelect.onchange = updateHeuristicDetails;
  updateHeuristicDetails();
}

function getCustomHeuristics() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_HEURISTICS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCustomHeuristic(name, weights) {
  const custom = getCustomHeuristics();
  custom.push({
    id: `custom_${Date.now()}`,
    label: name,
    weights,
  });
  localStorage.setItem(CUSTOM_HEURISTICS_KEY, JSON.stringify(custom));
}

async function refreshHeuristics() {
  heuristicOptions = await eel.registrar_heuristicas_personalizadas(getCustomHeuristics())();
  renderHeuristicSelects();
}

function openCustomHeuristicModal() {
  document.getElementById('custom-heuristic-name').value = '';
  document.getElementById('custom-weight-grid').innerHTML = CUSTOM_WEIGHT_FIELDS.map(field => `
    <label class="custom-weight-row">
      <span>${field.symbol}</span>
      ${field.label}
      <input type="number" step="1" value="${field.value}" data-weight-key="${field.key}" />
    </label>
  `).join('');
  document.getElementById('heuristic-modal').classList.add('modal-overlay--open');
}

function closeCustomHeuristicModal() {
  document.getElementById('heuristic-modal').classList.remove('modal-overlay--open');
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

function renderBoard(estado) {
  const grid = document.getElementById('board-grid');
  if (!grid) return;

  if (!isBoardInitialized) {
    grid.innerHTML = '';
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell cell--animate-entry';
        cell.id = `cell-${r}-${c}`;
        cell.style.animationDelay = `${Math.random() * 0.35}s`;
        grid.appendChild(cell);
      }
    }
    const horsesContainer = document.createElement('div');
    horsesContainer.id = 'horses-container';
    horsesContainer.className = 'horses-container';
    horsesContainer.innerHTML = `
      <div id="horse-white" class="cell__piece horse-piece">
        <div class="cell__shadow"></div><img src="${ASSET_BASE}enemy_player.png" alt="IA plateada" class="cell__img" />
      </div>
      <div id="horse-black" class="cell__piece horse-piece">
        <div class="cell__shadow"></div><img src="${ASSET_BASE}player.png" alt="IA dorada" class="cell__img" />
      </div>`;
    grid.appendChild(horsesContainer);
    isBoardInitialized = true;
  }

  document.getElementById('horse-white').style.top = `${estado.white_pos[0] * 12.5}%`;
  document.getElementById('horse-white').style.left = `${estado.white_pos[1] * 12.5}%`;
  document.getElementById('horse-black').style.top = `${estado.black_pos[0] * 12.5}%`;
  document.getElementById('horse-black').style.left = `${estado.black_pos[1] * 12.5}%`;

  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const cell = document.getElementById(`cell-${r}-${c}`);
      const key = `${r},${c}`;
      const starVal = estado.stars?.[key];
      const potionVal = estado.energy_tiles?.[key];
      cell.className = 'cell';
      let newItemType = '';
      let newItemVal = '';
      if (starVal !== undefined) {
        newItemType = 'snitch';
        newItemVal = String(starVal);
      } else if (potionVal !== undefined) {
        newItemType = 'potion';
        newItemVal = String(potionVal);
      }
      if (cell.dataset.itemType !== newItemType || cell.dataset.itemVal !== newItemVal) {
        cell.dataset.itemType = newItemType;
        cell.dataset.itemVal = newItemVal;
        if (newItemType === 'snitch') {
          cell.innerHTML = `<div class="item-container" style="width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;"><div class="cell__glow cell__glow--snitch"></div><img src="${ASSET_BASE}snitch_dorada.png" alt="Snitch" class="cell__img cell__img--snitch" /><span class="cell__value">${starVal}</span></div>`;
        } else if (newItemType === 'potion') {
          cell.innerHTML = `<div class="item-container" style="width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;"><div class="cell__glow cell__glow--potion"></div><img src="${ASSET_BASE}energy_potion.png" alt="Potion" class="cell__img cell__img--potion" /><span class="cell__value">${potionVal}</span></div>`;
        } else {
          cell.innerHTML = '';
        }
      }
    }
  }
}

function updateHUD(estado) {
  currentGameState = estado;
  document.getElementById('white-energy').textContent = estado.white_energy;
  document.getElementById('white-points').textContent = estado.white_points;
  document.getElementById('black-energy').textContent = estado.black_energy;
  document.getElementById('black-points').textContent = estado.black_points;
  document.getElementById('turn-label').textContent = estado.game_over
    ? 'PARTIDA TERMINADA'
    : estado.current_turn === 'white' ? 'IA PLATEADA' : 'IA DORADA';

  if (previousState) {
    const turnJustMoved = previousState.current_turn;
    const pos = turnJustMoved === 'white' ? estado.white_pos : estado.black_pos;
    const key = `${pos[0]},${pos[1]}`;
    if (previousState.stars?.[key] !== undefined) {
      snitchSound.currentTime = 0;
      snitchSound.play().catch(() => {});
      spawnFloatingText(pos, `+${previousState.stars[key]}`, 'snitch');
    }
    if (previousState.energy_tiles?.[key] !== undefined) {
      potionSound.currentTime = 0;
      potionSound.play().catch(() => {});
      spawnFloatingText(pos, `+${previousState.energy_tiles[key]}`, 'potion');
    }
  }

  previousState = JSON.parse(JSON.stringify(estado));
  renderBoard(estado);
}

async function processAIMove() {
  if (!autoPlaying || !currentGameState || currentGameState.game_over) return;

  const turn = currentGameState.current_turn;
  const heuristic = turn === 'white'
    ? document.getElementById('white-heuristic').value
    : document.getElementById('black-heuristic').value;
  const depth = Number(document.getElementById('ai-depth').value || 2);
  const label = turn === 'white' ? 'IA plateada' : 'IA dorada';

  document.getElementById('ai-status-label').textContent = `${label}: ${labelForHeuristic(heuristic)}`;
  mostrarToast(`${label} calculando...`, 900);

  let movimiento = null;
  if (getLegalMoves(currentGameState, turn).length > 0) {
    const response = await eel.obtener_movimiento_ia_heuristica(currentGameState, depth, heuristic)();
    movimiento = response?.movimiento || null;
  }

  const nextState = await eel.aplicar_movimiento(currentGameState, movimiento)();
  if (!nextState) return;
  updateHUD(nextState);

  if (nextState.game_over) {
    autoPlaying = false;
    showGameOverAfterMove(nextState);
    return;
  }

  aiTimer = setTimeout(processAIMove, 650);
}

function showGameOverAfterMove(estado) {
  setTimeout(() => showGameOver(estado), GAME_OVER_DELAY_MS);
}

function showGameOver(estado) {
  const modal = document.getElementById('game-over-modal');
  const title = document.getElementById('game-over-title');
  const content = document.getElementById('game-over-content');
  let resultText = 'EMPATE';
  if (estado.winner === 'white') resultText = 'GANA IA PLATEADA';
  if (estado.winner === 'black') resultText = 'GANA IA DORADA';
  title.textContent = resultText;
  content.innerHTML = `
    <div class="result-row"><span>Plateada (${labelForHeuristic(document.getElementById('white-heuristic').value)})</span><span>${estado.white_points} pts</span></div>
    <div class="result-row"><span>Dorada (${labelForHeuristic(document.getElementById('black-heuristic').value)})</span><span>${estado.black_points} pts</span></div>`;
  modal.classList.add('modal-overlay--open');
}

async function cargarPartida() {
  const randomState = await eel.solicitar_mapa_aleatorio()();
  const defaultState = {
    white_energy: 7,
    black_energy: 7,
    white_points: 0,
    black_points: 0,
    current_turn: 'white',
    game_over: false,
    winner: null,
    nivel: 'ia-vs-ia'
  };
  updateHUD({ ...defaultState, ...randomState });
}

window.nuevaPartida = async function () {
  autoPlaying = false;
  clearTimeout(aiTimer);
  document.getElementById('game-over-modal')?.classList.remove('modal-overlay--open');
  isBoardInitialized = false;
  previousState = null;
  await cargarPartida();
  mostrarToast('Nueva partida IA vs IA');
};

window.irAlMenu = function () {
  autoPlaying = false;
  clearTimeout(aiTimer);
  document.body.classList.add('fade-out');
  setTimeout(() => { window.location.href = '../menu.html'; }, 450);
};

document.addEventListener('DOMContentLoaded', async () => {
  await refreshHeuristics();
  await cargarPartida();

  document.getElementById('btn-ai-play').addEventListener('click', () => {
    if (currentGameState?.game_over) return;
    autoPlaying = true;
    clearTimeout(aiTimer);
    processAIMove();
  });
  document.getElementById('btn-ai-pause').addEventListener('click', () => {
    autoPlaying = false;
    clearTimeout(aiTimer);
    document.getElementById('ai-status-label').textContent = 'PAUSADO';
  });
  document.getElementById('btn-close-game-over')?.addEventListener('click', () => {
    document.getElementById('game-over-modal')?.classList.remove('modal-overlay--open');
  });
  document.getElementById('btn-custom-heuristic').addEventListener('click', openCustomHeuristicModal);
  document.getElementById('btn-close-heuristic-modal').addEventListener('click', closeCustomHeuristicModal);
  document.getElementById('custom-heuristic-form').addEventListener('submit', async event => {
    event.preventDefault();
    const name = document.getElementById('custom-heuristic-name').value.trim();
    if (!name) return;
    const weights = {};
    document.querySelectorAll('[data-weight-key]').forEach(input => {
      weights[input.dataset.weightKey] = Number(input.value || 0);
    });
    saveCustomHeuristic(name, weights);
    closeCustomHeuristicModal();
    await refreshHeuristics();
    mostrarToast(`Heuristica "${name}" creada.`);
  });
  document.querySelectorAll('.footer-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      hoverSound.currentTime = 0;
      hoverSound.play().catch(() => {});
    });
  });
});
