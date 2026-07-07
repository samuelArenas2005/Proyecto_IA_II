'use strict';

let heuristicOptions = [];
let tournamentRunning = false;
let bracketRounds = [];

const SOUND_BASE = '../assets/Sounds/';
const hoverSound = new Audio(`${SOUND_BASE}select_menu_sound.mp3`);
const clickSound = new Audio(`${SOUND_BASE}play_game.mp3`);
const roundSound = new Audio(`${SOUND_BASE}coin.mp3`);
const tiebreakerSound = new Audio(`${SOUND_BASE}energy.mp3`);
const championSound = new Audio(`${SOUND_BASE}victory.mp3`);
const bgTracks = [`${SOUND_BASE}bg_1.mp3`, `${SOUND_BASE}bg_2.mp3`, `${SOUND_BASE}bg_3.mp3`];
const bgAudio = new Audio(bgTracks[0]);
let bgTrackIndex = 0;

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

const HEURISTIC_ICONS = {
  balanced: '../assets/NewSprints/balanceada.png',
  collector: '../assets/NewSprints/Recolectora.png',
  energizer: '../assets/NewSprints/Energizante.png',
  mobile: '../assets/NewSprints/movil.png',
  aggressive: '../assets/NewSprints/agresiva.png',
  defensive: '../assets/NewSprints/defensiva.png',
  opportunist: '../assets/NewSprints/Oportunista.png',
  star_hunter: '../assets/NewSprints/Cazadora.png',
  battery_saver: '../assets/NewSprints/Ahorradora.png',
  center_control: '../assets/NewSprints/Controlcentral.png',
  blocker: '../assets/NewSprints/bloqueadora.png',
  sprinter: '../assets/NewSprints/velocista.png',
  patient: '../assets/NewSprints/paciente.png',
  greedy_energy: '../assets/NewSprints/codiciosa.png',
  endgame: '../assets/NewSprints/Finalizadora.png',
  chaos: '../assets/NewSprints/caotica.png',
};

[hoverSound, clickSound, roundSound, tiebreakerSound, championSound, bgAudio].forEach(sound => {
  sound.preload = 'auto';
});
hoverSound.volume = 0.34;
clickSound.volume = 0.32;
roundSound.volume = 0.42;
tiebreakerSound.volume = 0.38;
championSound.volume = 0.58;
bgAudio.volume = 0.08;
bgAudio.addEventListener('ended', () => {
  bgTrackIndex = (bgTrackIndex + 1) % bgTracks.length;
  bgAudio.src = bgTracks[bgTrackIndex];
  bgAudio.play().catch(() => {});
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function playSfx(sound, reset = true) {
  if (!sound) return;
  try {
    if (reset) sound.currentTime = 0;
    sound.play().catch(() => {});
  } catch {
    // El navegador puede bloquear audio hasta el primer click del usuario.
  }
}

function startBackgroundMusic() {
  if (bgAudio.paused) {
    bgAudio.play().catch(() => {});
  }
}

function mostrarToast(msg, dur = 2600) {
  const toast = document.getElementById('menu-toast');
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, dur);
}

function iconFor(id) {
  return HEURISTIC_ICONS[id] || '../assets/NewSprints/personalizated.png';
}

function labelFor(id) {
  return heuristicOptions.find(item => item.id === id)?.label || id || 'Pendiente';
}

function formatPoints(value) {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue < 0) {
    return `(${numericValue})`;
  }
  return String(value);
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
  renderHeuristics();
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

function openWinnerModal(championId) {
  playSfx(championSound);
  document.getElementById('winner-symbol').src = iconFor(championId);
  document.getElementById('winner-title').textContent = labelFor(championId);
  document.getElementById('winner-modal').classList.add('modal-overlay--open');
}

function closeWinnerModal() {
  document.getElementById('winner-modal').classList.remove('modal-overlay--open');
}

function renderFormulaMarkup(item) {
  const terms = item.weights
    .filter(weight => Number(weight.value) !== 0)
    .map(weight => `
      <span class="formula-term">
        <strong>${escapeHtml(weight.value)}</strong><span>${escapeHtml(weight.symbol)}</span>
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

function renderFormulaDetail(item) {
  return `
    <div class="heuristic-detail">
      ${renderFormulaMarkup(item)}
      <div class="weight-grid">
        ${item.weights.map(weight => `
          <div class="weight-pill">
            <span>${escapeHtml(weight.symbol)} - ${escapeHtml(weight.label)}</span>
            <strong>${escapeHtml(weight.value)}</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function selectedHeuristics() {
  return Array.from(document.querySelectorAll('.heuristic-check:checked')).map(input => input.value);
}

function enforceLimit(changedInput = null) {
  const limit = Number(document.getElementById('participant-count').value);
  let selected = selectedHeuristics();

  if (selected.length > limit && changedInput?.checked) {
    changedInput.checked = false;
    mostrarToast(`Solo puedes elegir ${limit} heuristicas.`);
    selected = selectedHeuristics();
  }

  document.querySelectorAll('.heuristic-option').forEach(option => {
    const input = option.querySelector('input');
    const detail = option.querySelector('.heuristic-detail');
    const toggle = option.querySelector('.detail-toggle');
    option.classList.toggle('is-selected', input.checked);
    if (!input.checked) {
      detail?.classList.remove('is-visible');
      if (toggle) toggle.textContent = 'Ver formula';
    }
    if (toggle) {
      toggle.disabled = !input.checked;
      toggle.setAttribute('aria-expanded', detail?.classList.contains('is-visible') ? 'true' : 'false');
    }
  });
}

function autoSelectFirstN() {
  const limit = Number(document.getElementById('participant-count').value);
  document.querySelectorAll('.heuristic-check').forEach((input, index) => {
    input.checked = index < limit;
  });
  enforceLimit();
}

function attachTournamentSounds(root = document) {
  root.querySelectorAll('button, .heuristic-main, .slot-card').forEach(element => {
    if (element.dataset.soundReady === 'true') return;
    element.dataset.soundReady = 'true';
    element.addEventListener('mouseenter', () => playSfx(hoverSound));
    element.addEventListener('click', () => {
      playSfx(clickSound);
      startBackgroundMusic();
    });
  });
}

function renderHeuristics() {
  const list = document.getElementById('heuristic-list');
  list.innerHTML = heuristicOptions.map(item => `
    <article class="heuristic-option">
      <label class="heuristic-main">
        <input type="checkbox" class="heuristic-check" value="${escapeHtml(item.id)}" />
        <span class="heuristic-button-face">
          <img class="heuristic-symbol" src="${iconFor(item.id)}" alt="" />
          <strong>${escapeHtml(item.label)}</strong>
        </span>
      </label>
      <p>${escapeHtml(item.description)}</p>
      <button type="button" class="detail-toggle" disabled aria-expanded="false">Ver formula</button>
      ${renderFormulaDetail(item)}
    </article>
  `).join('');

  document.querySelectorAll('.heuristic-check').forEach(input => {
    input.addEventListener('change', () => {
      playSfx(input.checked ? roundSound : clickSound);
      enforceLimit(input);
    });
  });
  document.querySelectorAll('.detail-toggle').forEach(button => {
    button.addEventListener('click', event => {
      const option = event.currentTarget.closest('.heuristic-option');
      const detail = option.querySelector('.heuristic-detail');
      const expanded = detail.classList.toggle('is-visible');
      event.currentTarget.textContent = expanded ? 'Ocultar formula' : 'Ver formula';
      event.currentTarget.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  });
  attachTournamentSounds(list);
  autoSelectFirstN();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffleList(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function nextRoundLabel(playersRemaining) {
  if (playersRemaining === 16) return 'Octavos';
  if (playersRemaining === 8) return 'Cuartos';
  if (playersRemaining === 4) return 'Semifinales';
  if (playersRemaining === 2) return 'Final';
  return `Ronda de ${playersRemaining}`;
}

function buildBracket(initialOrder) {
  const rounds = [];
  let playersRemaining = initialOrder.length;

  while (playersRemaining >= 2) {
    const matchCount = playersRemaining / 2;
    const matches = Array.from({ length: matchCount }, (_, index) => {
      if (rounds.length === 0) {
        return {
          a: initialOrder[index * 2],
          b: initialOrder[index * 2 + 1],
          winner: null,
          result: null,
          pending: false,
        };
      }
      return { a: null, b: null, winner: null, result: null, pending: false };
    });

    rounds.push({
      label: nextRoundLabel(playersRemaining),
      matches,
    });
    playersRemaining /= 2;
  }

  return rounds;
}

function showSelectionView() {
  if (tournamentRunning) return;
  bracketRounds = [];
  document.getElementById('tournament-selection-view').hidden = false;
  document.getElementById('tournament-bracket-view').hidden = true;
  document.getElementById('bracket-board').innerHTML = '';
  document.getElementById('champion-box').textContent = 'Selecciona heuristicas para iniciar.';
  closeWinnerModal();
}

function showBracketView(participants) {
  document.getElementById('tournament-selection-view').hidden = true;
  document.getElementById('tournament-bracket-view').hidden = false;
  document.getElementById('bracket-title').textContent = participants.length === 2
    ? 'FINAL'
    : `BRACKET DE ${participants.length}`;
}

function renderSlot(id, winnerId) {
  if (!id) {
    return `
      <div class="slot-placeholder">
        <span>Esperando ganador</span>
      </div>
    `;
  }

  const isWinner = winnerId && winnerId === id;
  return `
    <div class="slot-card ${isWinner ? 'slot-card--winner' : ''}">
      <img class="slot-symbol" src="${iconFor(id)}" alt="" />
      <span>${escapeHtml(labelFor(id))}</span>
    </div>
  `;
}

function renderMatchResult(match) {
  const winnerIsA = match.winner === match.a;
  const winnerName = labelFor(match.winner);
  const loserName = labelFor(winnerIsA ? match.b : match.a);
  const winnerWins = winnerIsA ? match.score_a : match.score_b;
  const loserWins = winnerIsA ? match.score_b : match.score_a;
  const winnerPoints = winnerIsA ? match.points_a : match.points_b;
  const loserPoints = winnerIsA ? match.points_b : match.points_a;
  const winnerVictoryText = winnerWins === 1 ? 'Victoria' : 'Victorias';
  const loserVictoryText = loserWins === 1 ? 'Victoria' : 'Victorias';

  return `
    <div>${escapeHtml(winnerName)} (${winnerWins} ${winnerVictoryText}/${formatPoints(winnerPoints)} Puntos)</div>
    <div>${escapeHtml(loserName)} (${loserWins} ${loserVictoryText}/${formatPoints(loserPoints)} Puntos)</div>
  `;
}

function renderTiebreaker(match) {
  if (!match.tiebreaker_game) return '';

  return `
    <div class="match-tiebreaker">
      <div>Desempate: ${formatPoints(match.tiebreaker_game.white_points)} puntos - ${formatPoints(match.tiebreaker_game.black_points)} puntos</div>
      <div>Ganador: ${escapeHtml(labelFor(match.winner))}</div>
    </div>
  `;
}

function renderMatch(match, matchIndex) {
  return `
    <article class="bracket-match ${match.pending ? 'bracket-match--pending' : ''} ${match.winner ? 'bracket-match--complete' : ''}">
      <div class="bracket-match-index">Partido ${matchIndex + 1}</div>
      <div class="bracket-slots">
        ${renderSlot(match.a, match.winner)}
        <span class="match-versus">VS</span>
        ${renderSlot(match.b, match.winner)}
      </div>
      ${match.pending ? '<div class="match-calculating">Calculando...</div>' : ''}
      ${match.result ? `
        <div class="match-result">${renderMatchResult(match.result)}</div>
        ${renderTiebreaker(match.result)}
      ` : ''}
    </article>
  `;
}

function renderRoundColumn(roundIndex, side) {
  const round = bracketRounds[roundIndex];
  const isFinal = round.matches.length === 1;
  const half = Math.ceil(round.matches.length / 2);
  const start = side === 'right' && !isFinal ? half : 0;
  const end = side === 'left' && !isFinal ? half : round.matches.length;
  const matches = round.matches.slice(start, end);

  return `
    <section class="bracket-round bracket-round--${side}">
      <h4 class="bracket-round-title">${escapeHtml(round.label)}</h4>
      <div class="bracket-round-matches">
        ${matches.map((match, localIndex) => renderMatch(match, start + localIndex)).join('')}
      </div>
    </section>
  `;
}

function getBracketColumns() {
  if (bracketRounds.length === 1) {
    return [{ roundIndex: 0, side: 'final' }];
  }

  const finalIndex = bracketRounds.length - 1;
  const leftColumns = [];
  const rightColumns = [];

  for (let roundIndex = 0; roundIndex < finalIndex; roundIndex++) {
    leftColumns.push({ roundIndex, side: 'left' });
    rightColumns.unshift({ roundIndex, side: 'right' });
  }

  return [
    ...leftColumns,
    { roundIndex: finalIndex, side: 'final' },
    ...rightColumns,
  ];
}

function renderBracket() {
  const board = document.getElementById('bracket-board');
  const columns = getBracketColumns();
  board.style.setProperty('--round-count', columns.length);
  board.innerHTML = columns
    .map(column => renderRoundColumn(column.roundIndex, column.side))
    .join('');
  attachTournamentSounds(board);
}

function applyRoundResult(roundIndex, roundResult) {
  const round = bracketRounds[roundIndex];

  roundResult.matches.forEach((match, index) => {
    round.matches[index] = {
      ...round.matches[index],
      a: match.a,
      b: match.b,
      winner: match.winner,
      result: match,
      pending: false,
    };

    const nextRound = bracketRounds[roundIndex + 1];
    if (nextRound) {
      const nextMatch = nextRound.matches[Math.floor(index / 2)];
      if (index % 2 === 0) {
        nextMatch.a = match.winner;
      } else {
        nextMatch.b = match.winner;
      }
    }
  });
}

async function runTournament() {
  if (tournamentRunning) return;
  startBackgroundMusic();

  const selected = selectedHeuristics();
  const limit = Number(document.getElementById('participant-count').value);
  const depth = Number(document.getElementById('tournament-depth').value);
  const runButton = document.getElementById('btn-run-tournament');

  if (selected.length !== limit) {
    mostrarToast(`Debes seleccionar exactamente ${limit} heuristicas.`);
    return;
  }

  const initialOrder = shuffleList(selected);
  bracketRounds = buildBracket(initialOrder);
  tournamentRunning = true;
  runButton.disabled = true;
  runButton.classList.add('disabled');
  showBracketView(initialOrder);
  renderBracket();

  let currentRound = initialOrder;

  for (let roundIndex = 0; roundIndex < bracketRounds.length; roundIndex++) {
    const round = bracketRounds[roundIndex];
    document.getElementById('champion-box').textContent = `${round.label}: calculando ${round.matches.length} enfrentamiento${round.matches.length === 1 ? '' : 's'}.`;
    round.matches.forEach(match => { match.pending = true; });
    renderBracket();
    await sleep(350);

    const result = await eel.ejecutar_ronda_torneo_heuristicas(currentRound, depth, limit, roundIndex + 1)();
    if (result.error) {
      round.matches.forEach(match => { match.pending = false; });
      renderBracket();
      document.getElementById('champion-box').textContent = result.error;
      tournamentRunning = false;
      runButton.disabled = false;
      runButton.classList.remove('disabled');
      return;
    }

    applyRoundResult(roundIndex, result);
    renderBracket();
    playSfx(result.matches.some(match => match.tiebreaker_game) ? tiebreakerSound : roundSound);
    currentRound = result.winners;

    if (currentRound.length > 1) {
      document.getElementById('champion-box').textContent = `Clasifican a ${bracketRounds[roundIndex + 1].label}: ${currentRound.map(labelFor).join(', ')}.`;
      await sleep(900);
    }
  }

  const champion = currentRound[0];
  document.getElementById('champion-box').textContent = `CAMPEONA: ${labelFor(champion)} | Profundidad ${depth}`;
  tournamentRunning = false;
  runButton.disabled = false;
  runButton.classList.remove('disabled');
  openWinnerModal(champion);
}

window.irAlMenu = function () {
  document.body.classList.add('fade-out');
  setTimeout(() => { window.location.href = '../menu.html'; }, 450);
};

document.addEventListener('DOMContentLoaded', async () => {
  const particles = document.getElementById('particles');
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${60 + Math.random() * 40}%`;
    p.style.animationDuration = `${6 + Math.random() * 10}s`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    particles.appendChild(p);
  }

  await refreshHeuristics();
  document.getElementById('participant-count').addEventListener('change', autoSelectFirstN);
  document.getElementById('btn-run-tournament').addEventListener('click', runTournament);
  document.getElementById('btn-back-selection').addEventListener('click', showSelectionView);
  document.getElementById('btn-custom-heuristic').addEventListener('click', openCustomHeuristicModal);
  document.getElementById('btn-close-heuristic-modal').addEventListener('click', closeCustomHeuristicModal);
  document.getElementById('btn-close-winner-modal').addEventListener('click', closeWinnerModal);
  attachTournamentSounds();
  document.addEventListener('click', startBackgroundMusic, { once: true });
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
});
