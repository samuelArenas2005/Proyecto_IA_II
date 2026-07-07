'use strict';

const GRID = 8;
const ASSET_BASE = '../assets/NewSprints/';
const SOUND_BASE = '../assets/Sounds/';
const GAME_OVER_DELAY_MS = 450;

let currentGameState = null;
let previousState = null;
let isBoardInitialized = false;
let resolvingForcedPass = false;

const hoverSound = new Audio(`${SOUND_BASE}select_menu_sound.mp3`);
hoverSound.volume = 0.35;
const potionSound = new Audio(`${SOUND_BASE}energy.mp3`);
const snitchSound = new Audio(`${SOUND_BASE}coin.mp3`);
potionSound.volume = 0.6;
snitchSound.volume = 0.6;

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

function mostrarToast(msg, dur = 2400) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), dur);
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
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.style.animationDelay = `${Math.random() * 0.35}s`;
        grid.appendChild(cell);
      }
    }

    const horsesContainer = document.createElement('div');
    horsesContainer.id = 'horses-container';
    horsesContainer.className = 'horses-container';
    horsesContainer.innerHTML = `
      <div id="horse-white" class="cell__piece horse-piece">
        <div class="cell__shadow"></div><img src="${ASSET_BASE}enemy_player.png" alt="Plateado" class="cell__img" />
      </div>
      <div id="horse-black" class="cell__piece horse-piece">
        <div class="cell__shadow"></div><img src="${ASSET_BASE}player.png" alt="Dorado" class="cell__img" />
      </div>`;
    grid.appendChild(horsesContainer);
    isBoardInitialized = true;
  }

  document.getElementById('horse-white').style.top = `${estado.white_pos[0] * 12.5}%`;
  document.getElementById('horse-white').style.left = `${estado.white_pos[1] * 12.5}%`;
  document.getElementById('horse-black').style.top = `${estado.black_pos[0] * 12.5}%`;
  document.getElementById('horse-black').style.left = `${estado.black_pos[1] * 12.5}%`;

  const legalMoves = getLegalMoves(estado, estado.current_turn);

  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const cell = document.getElementById(`cell-${r}-${c}`);
      const key = `${r},${c}`;
      const starVal = estado.stars?.[key];
      const potionVal = estado.energy_tiles?.[key];
      const isValid = legalMoves.some(move => move[0] === r && move[1] === c);
      const isOccupied = (r === estado.white_pos[0] && c === estado.white_pos[1]) || (r === estado.black_pos[0] && c === estado.black_pos[1]);

      cell.className = 'cell';
      cell.onclick = (!isOccupied && isValid) ? () => onCellClick(r, c) : null;
      if (isValid) cell.classList.add('cell--valid');

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
          cell.innerHTML = `<div class="item-container" style="width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;">
            <div class="cell__glow cell__glow--snitch"></div>
            <img src="${ASSET_BASE}snitch_dorada.png" alt="Snitch" class="cell__img cell__img--snitch" />
            <span class="cell__value">${starVal}</span>
          </div>`;
        } else if (newItemType === 'potion') {
          cell.innerHTML = `<div class="item-container" style="width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;">
            <div class="cell__glow cell__glow--potion"></div>
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

function updateHUD(estado) {
  currentGameState = estado;
  document.getElementById('white-energy').textContent = estado.white_energy;
  document.getElementById('white-points').textContent = estado.white_points;
  document.getElementById('black-energy').textContent = estado.black_energy;
  document.getElementById('black-points').textContent = estado.black_points;
  document.getElementById('turn-label').textContent = estado.game_over
    ? 'PARTIDA TERMINADA'
    : estado.current_turn === 'white' ? 'JUGADOR PLATEADO' : 'JUGADOR DORADO';

  document.getElementById('scoreboard-enemy').classList.toggle('human-active', estado.current_turn === 'white' && !estado.game_over);
  document.getElementById('scoreboard-player').classList.toggle('human-active', estado.current_turn === 'black' && !estado.game_over);

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
  resolveForcedPassIfNeeded();
}

async function resolveForcedPassIfNeeded() {
  if (resolvingForcedPass || !currentGameState || currentGameState.game_over) return;
  if (getLegalMoves(currentGameState, currentGameState.current_turn).length > 0) return;

  resolvingForcedPass = true;
  const label = currentGameState.current_turn === 'white' ? 'Jugador plateado' : 'Jugador dorado';
  const nextState = await eel.aplicar_movimiento(currentGameState, null)();
  resolvingForcedPass = false;
  if (!nextState) return;
  mostrarToast(`${label} pierde turno (-3 pts).`, 1800);
  updateHUD(nextState);
  if (nextState.game_over) showGameOverAfterMove(nextState);
}

async function onCellClick(row, col) {
  if (!currentGameState || currentGameState.game_over) return;
  const validMoves = getLegalMoves(currentGameState, currentGameState.current_turn);
  if (!validMoves.some(move => move[0] === row && move[1] === col)) {
    mostrarToast('Movimiento invalido para este caballo.', 1800);
    return;
  }

  const nextState = await eel.aplicar_movimiento(currentGameState, [row, col])();
  if (!nextState) return;
  updateHUD(nextState);
  if (nextState.game_over) showGameOverAfterMove(nextState);
}

function showGameOverAfterMove(estado) {
  setTimeout(() => showGameOver(estado), GAME_OVER_DELAY_MS);
}

function showGameOver(estado) {
  const modal = document.getElementById('game-over-modal');
  const title = document.getElementById('game-over-title');
  const content = document.getElementById('game-over-content');
  let resultText = 'EMPATE';
  if (estado.winner === 'white') resultText = 'GANA JUGADOR PLATEADO';
  if (estado.winner === 'black') resultText = 'GANA JUGADOR DORADO';
  title.textContent = resultText;
  content.innerHTML = `
    <div class="result-row"><span>Plateado</span><span>${estado.white_points} pts</span></div>
    <div class="result-row"><span>Dorado</span><span>${estado.black_points} pts</span></div>`;
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
    nivel: 'humano-vs-humano'
  };
  updateHUD({ ...defaultState, ...randomState });
}

window.nuevaPartida = async function () {
  document.getElementById('game-over-modal')?.classList.remove('modal-overlay--open');
  isBoardInitialized = false;
  previousState = null;
  await cargarPartida();
  mostrarToast('Nueva partida humano vs humano');
};

window.irAlMenu = function () {
  document.body.classList.add('fade-out');
  setTimeout(() => { window.location.href = '../menu.html'; }, 450);
};

document.addEventListener('DOMContentLoaded', () => {
  cargarPartida();
  document.getElementById('btn-close-game-over')?.addEventListener('click', () => {
    document.getElementById('game-over-modal')?.classList.remove('modal-overlay--open');
  });
  document.querySelectorAll('.footer-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      hoverSound.currentTime = 0;
      hoverSound.play().catch(() => {});
    });
  });
});
