'use strict';

function mostrarToast(msg, dur = 3000) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), dur);
}

let _lightMode = false;
window.toggleTheme = function () {
  _lightMode = !_lightMode;
  document.body.classList.toggle('light', _lightMode);
  const icon = document.getElementById('icon-theme');
  if (icon) icon.className = _lightMode ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  window.setMapTheme?.(_lightMode);
};

window._FA = { SUN: 'fa-solid fa-sun', MOON: 'fa-solid fa-moon' };

const NIVEL_LABELS = {
  principiante: 'Principiante · Minimax prof. 2',
  amateur: 'Amateur · Minimax prof. 4',
  experto: 'Experto · Minimax prof. 6',
};

const MAX_POINTS = 37;
const MAX_ENERGY = 15;
const INITIAL_SNITCHES = 7;
const INITIAL_POTIONS = 4;

function setBar(id, value, max) {
  const el = document.getElementById(id);
  if (!el) return;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  el.style.width = `${pct}%`;
}

function updateHUD(estado) {
  if (!estado) return;

  document.getElementById('white-points').textContent = estado.white_points;
  document.getElementById('white-energy').textContent = estado.white_energy;
  document.getElementById('black-points').textContent = estado.black_points;
  document.getElementById('black-energy').textContent = estado.black_energy;

  setBar('white-points-bar', estado.white_points, MAX_POINTS);
  setBar('black-points-bar', estado.black_points, MAX_POINTS);
  setBar('white-energy-bar', estado.white_energy, MAX_ENERGY);
  setBar('black-energy-bar', estado.black_energy, MAX_ENERGY);

  const nivelEl = document.getElementById('nav-nivel-title');
  if (nivelEl) nivelEl.textContent = NIVEL_LABELS[estado.nivel] || estado.nivel;

  const turnEl = document.getElementById('nav-turn-title');
  if (turnEl) {
    if (estado.game_over) turnEl.textContent = 'Partida terminada';
    else turnEl.textContent = estado.current_turn === 'white' ? 'Turno: IA' : 'Turno: Tú';
  }

  const statusEl = document.getElementById('game-status');
  if (statusEl) {
    const stars = Object.keys(estado.stars || {}).length;
    const potions = Object.keys(estado.energy_tiles || {}).length;
    const starsPct = (stars / INITIAL_SNITCHES) * 100;
    const potionsPct = (potions / INITIAL_POTIONS) * 100;

    let turnoTexto = 'Esperando...';
    if (estado.game_over) turnoTexto = 'La partida ha concluido';
    else if (estado.current_turn === 'white') turnoTexto = 'La IA (blanco) está moviendo su caballo';
    else turnoTexto = 'Tu turno — elige una casilla verde';

    statusEl.innerHTML = `
      <div class="status-block">
        <span class="status-block__label">Estado de la contienda</span>
        <span class="status-block__value">${turnoTexto}</span>
      </div>
      <div class="status-block">
        <div class="stat-row__head">
          <span class="stat-row__label">Snitches en el tablero</span>
          <span class="stat-row__value">${stars} / ${INITIAL_SNITCHES}</span>
        </div>
        <div class="stat-bar stat-bar--thin"><div class="stat-bar__fill stat-bar__fill--snitch" style="width:${starsPct}%"></div></div>
      </div>
      <div class="status-block">
        <div class="stat-row__head">
          <span class="stat-row__label">Pociones en el tablero</span>
          <span class="stat-row__value">${potions} / ${INITIAL_POTIONS}</span>
        </div>
        <div class="stat-bar stat-bar--thin"><div class="stat-bar__fill stat-bar__fill--potion" style="width:${potionsPct}%"></div></div>
      </div>
      <div class="status-divider"></div>
      <div class="status-block status-block--msg">
        <span class="status-block__label">Último suceso</span>
        <span class="status-block__value status-block__value--msg">${estado.message || 'La batalla acaba de comenzar'}</span>
      </div>
    `;
  }
}

function showGameOver(estado) {
  const modal = document.getElementById('game-over-modal');
  const title = document.getElementById('game-over-title');
  const content = document.getElementById('game-over-content');
  if (!modal || !content) return;

  let resultText = 'Empate';
  if (estado.winner === 'white') resultText = 'Victoria de la IA';
  else if (estado.winner === 'black') resultText = '¡Victoria tuya!';

  title.textContent = resultText;
  content.innerHTML = `
    <div class="stat-row">
      <div class="stat-row__head">
        <span class="stat-row__label">IA (Blanco)</span>
        <span class="stat-row__value">${estado.white_points} pts</span>
      </div>
      <div class="stat-bar"><div class="stat-bar__fill stat-bar__fill--points" style="width:${(estado.white_points / MAX_POINTS) * 100}%"></div></div>
    </div>
    <div class="stat-row">
      <div class="stat-row__head">
        <span class="stat-row__label">Tú (Negro)</span>
        <span class="stat-row__value">${estado.black_points} pts</span>
      </div>
      <div class="stat-bar"><div class="stat-bar__fill stat-bar__fill--points" style="width:${(estado.black_points / MAX_POINTS) * 100}%"></div></div>
    </div>
  `;
  modal.classList.add('report-modal--open');
}

async function cargarPartida() {
  try {
    // TODO: Inicializar y mantener el estado de verdad desde el lado del cliente (Frontend)
    // ==== ESTADO SIMULADO PARA PORDER VISUALIZAR EL MOCKUP ====
    const nivelGuardado = localStorage.getItem('knight_nivel_seleccionado') || 'principiante';
    const estadoInicial = {
      board_size: 8,
      nivel: nivelGuardado,
      white_pos: [0, 1],
      black_pos: [7, 6],
      stars: {'2,2': 2, '5,5': 3, '4,1': 4},
      energy_tiles: {'3,3': 2, '6,1': 3},
      white_energy: 7,
      black_energy: 7,
      white_points: 0,
      black_points: 0,
      current_turn: 'white',
      game_over: false,
      winner: null,
      message: 'Partida simulada iniciada (turno IA primer movimiento)',
      valid_moves: []
    };
    updateHUD(estadoInicial);
    // Dispara el evento clave que levanta el tablero en map.js
    window.dispatchEvent(new CustomEvent('partida-lista', { detail: estadoInicial }));
  } catch (e) {
    console.error(e);
  }
}

window.onEstadoActualizado = function (estado) {
  updateHUD(estado);
  if (estado.game_over) showGameOver(estado);
};

window.nuevaPartida = async function () {
  const modal = document.getElementById('game-over-modal');
  if (modal) modal.classList.remove('report-modal--open');
  
  // TODO: Reiniciar estado en el lado del cliente
  const nivelGuardado = localStorage.getItem('knight_nivel_seleccionado') || 'principiante';
  const nuevoEstado = {
      board_size: 8,
      nivel: nivelGuardado,
      white_pos: [0, 1],
      black_pos: [7, 6],
      stars: {'2,2': 2, '5,5': 3, '4,1': 4},
      energy_tiles: {'3,3': 2, '6,1': 3},
      white_energy: 7,
      black_energy: 7,
      white_points: 0,
      black_points: 0,
      current_turn: 'white',
      game_over: false,
      winner: null,
      message: 'Nueva partida simulada',
      valid_moves: []
  };
  updateHUD(nuevoEstado);
  window.dispatchEvent(new CustomEvent('partida-reiniciada', { detail: nuevoEstado }));
  mostrarToast('Nueva partida simulada inicializada');
};

window.irAlMenu = function () {
  document.body.classList.add('fade-out');
  setTimeout(() => { window.location.href = '../menu.html'; }, 450);
};

window.toggleLegend = function () {
  const content = document.getElementById('legend-content');
  const arrow = document.getElementById('legend-arrow');
  const hidden = content.classList.toggle('legend-body--hidden');
  arrow.style.transform = hidden ? 'rotate(180deg)' : 'rotate(0deg)';
};

document.addEventListener('DOMContentLoaded', () => {
  cargarPartida();
  document.getElementById('btn-close-game-over')?.addEventListener('click', () => {
    document.getElementById('game-over-modal')?.classList.remove('report-modal--open');
  });
});

if (typeof eel !== 'undefined') {
  eel.expose(mostrar_notificacion);
}
function mostrar_notificacion(msg) { mostrarToast(msg, 4000); }
window.mostrarToast = mostrarToast;
