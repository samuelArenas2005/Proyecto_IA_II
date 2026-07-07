'use strict';

let heuristicOptions = [];
let tournamentRunning = false;

function mostrarToast(msg, dur = 2600) {
  const toast = document.getElementById('menu-toast');
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, dur);
}

function labelFor(id) {
  return heuristicOptions.find(item => item.id === id)?.label || id;
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

function renderFormulaDetail(item) {
  return `
    <div class="heuristic-detail">
      ${renderFormulaMarkup(item)}
      <div class="weight-grid">
        ${item.weights.map(weight => `
          <div class="weight-pill">
            <span>${weight.symbol} · ${weight.label}</span>
            <strong>${weight.value}</strong>
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

function renderHeuristics() {
  const list = document.getElementById('heuristic-list');
  list.innerHTML = heuristicOptions.map(item => `
    <article class="heuristic-option">
      <label class="heuristic-main">
        <span><input type="checkbox" class="heuristic-check" value="${item.id}" /> <strong>${item.label}</strong></span>
      </label>
      <p>${item.description}</p>
      <button type="button" class="detail-toggle" disabled aria-expanded="false">Ver formula</button>
      ${renderFormulaDetail(item)}
    </article>
  `).join('');

  document.querySelectorAll('.heuristic-check').forEach(input => {
    input.addEventListener('change', () => enforceLimit(input));
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
  autoSelectFirstN();
}

function renderResults(result) {
  const championBox = document.getElementById('champion-box');
  const rounds = document.getElementById('rounds');

  if (result.error) {
    championBox.textContent = result.error;
    rounds.innerHTML = '';
    return;
  }

  championBox.textContent = `CAMPEONA: ${labelFor(result.champion)} | Profundidad ${result.depth}`;
  rounds.innerHTML = result.rounds.map(round => `
    <section class="round">
      <div class="round-title">RONDA ${round.round}</div>
      ${round.matches.map(match => `
        <article class="match">
          <div class="match-main">
            <span>${labelFor(match.a)} vs ${labelFor(match.b)}</span>
            <span class="match-winner">Gana ${labelFor(match.winner)}</span>
          </div>
          <div class="match-detail">
            Victorias: ${match.score_a}-${match.score_b} | Puntos acumulados: ${match.points_a}-${match.points_b}
          </div>
        </article>
      `).join('')}
    </section>
  `).join('');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function renderPendingRound(label) {
  const rounds = document.getElementById('rounds');
  const pending = document.createElement('section');
  pending.className = 'round round--pending';
  pending.id = 'pending-round';
  pending.innerHTML = `
    <div class="round-title">${label}</div>
    <div class="round-status">Calculando enfrentamientos...</div>
  `;
  rounds.appendChild(pending);
}

function renderCompletedRound(roundResult) {
  document.getElementById('pending-round')?.remove();
  const rounds = document.getElementById('rounds');
  const section = document.createElement('section');
  section.className = 'round round--complete';
  section.innerHTML = `
    <div class="round-title">${roundResult.label}</div>
    ${roundResult.matches.map(match => `
      <article class="match">
        <div class="match-main">
          <span>${labelFor(match.a)} vs ${labelFor(match.b)}</span>
          <span class="match-winner">Avanza ${labelFor(match.winner)}</span>
        </div>
        <div class="match-detail">
          Victorias: ${match.score_a}-${match.score_b} | Puntos acumulados: ${match.points_a}-${match.points_b}
        </div>
      </article>
    `).join('')}
  `;
  rounds.appendChild(section);
}

function nextRoundLabel(playersRemaining) {
  if (playersRemaining === 16) return 'Octavos de final (Ronda de 16)';
  if (playersRemaining === 8) return 'Cuartos de final';
  if (playersRemaining === 4) return 'Semifinales';
  if (playersRemaining === 2) return 'Final';
  return `Ronda de ${playersRemaining}`;
}

async function runTournament() {
  if (tournamentRunning) return;

  const selected = selectedHeuristics();
  const limit = Number(document.getElementById('participant-count').value);
  const depth = Number(document.getElementById('tournament-depth').value);
  const runButton = document.getElementById('btn-run-tournament');

  if (selected.length !== limit) {
    mostrarToast(`Debes seleccionar exactamente ${limit} heuristicas.`);
    return;
  }

  tournamentRunning = true;
  runButton.disabled = true;
  runButton.classList.add('disabled');
  document.getElementById('champion-box').textContent = `Torneo iniciado: ${limit} heuristicas`;
  document.getElementById('rounds').innerHTML = '';

  let currentRound = selected;
  let roundNumber = 1;

  while (currentRound.length > 1) {
    const label = nextRoundLabel(currentRound.length);
    document.getElementById('champion-box').textContent = `${label}: ${currentRound.length} heuristicas en competencia`;
    renderPendingRound(label);
    await sleep(300);

    const result = await eel.ejecutar_ronda_torneo_heuristicas(currentRound, depth, limit, roundNumber)();
    if (result.error) {
      document.getElementById('pending-round')?.remove();
      document.getElementById('champion-box').textContent = result.error;
      tournamentRunning = false;
      runButton.disabled = false;
      runButton.classList.remove('disabled');
      return;
    }

    renderCompletedRound(result);
    currentRound = result.winners;
    roundNumber += 1;

    if (currentRound.length > 1) {
      document.getElementById('champion-box').textContent = `Clasifican a ${nextRoundLabel(currentRound.length)}: ${currentRound.map(labelFor).join(', ')}`;
      await sleep(900);
    }
  }

  document.getElementById('champion-box').textContent = `CAMPEONA: ${labelFor(currentRound[0])} | Profundidad ${depth}`;
  tournamentRunning = false;
  runButton.disabled = false;
  runButton.classList.remove('disabled');
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

  heuristicOptions = await eel.listar_heuristicas()();
  renderHeuristics();
  document.getElementById('participant-count').addEventListener('change', autoSelectFirstN);
  document.getElementById('btn-run-tournament').addEventListener('click', runTournament);
});
