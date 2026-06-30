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
