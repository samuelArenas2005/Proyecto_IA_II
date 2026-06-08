import * as THREE from 'three';

const TILE = 2;
const GRID = 8;
const OFFSET = (GRID * TILE) / 2;

const LIGHT_SQ = 0xf0d9b5;
const DARK_SQ  = 0xb58863;

function mm(geo, color, opts = {}) {
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, ...opts }));
}
function em(geo, color, intensity = 0.85) {
  return mm(geo, color, { emissive: color, emissiveIntensity: intensity });
}
function darken(hex, f) {
  const r = ((hex >> 16) & 0xff) * f | 0;
  const g = ((hex >> 8) & 0xff) * f | 0;
  const b = (hex & 0xff) * f | 0;
  return (r << 16) | (g << 8) | b;
}

function createKnight(color) {
  const g = new THREE.Group();
  const base = mm(new THREE.CylinderGeometry(0.35, 0.42, 0.12, 12), darken(color, 0.55));
  base.position.y = 0.06;
  const body = mm(new THREE.BoxGeometry(0.55, 0.45, 0.35), color);
  body.position.set(0, 0.38, 0.05);
  const neck = mm(new THREE.BoxGeometry(0.22, 0.35, 0.18), color);
  neck.position.set(0.12, 0.72, 0.12);
  neck.rotation.z = -0.35;
  const head = mm(new THREE.BoxGeometry(0.28, 0.22, 0.2), color);
  head.position.set(0.24, 0.95, 0.18);
  head.rotation.z = -0.5;
  g.add(base, body, neck, head);
  return g;
}

function createStar() {
  const shape = new THREE.Shape();
  const spikes = 5;
  const outer = 0.28;
  const inner = 0.12;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false });
  const star = em(geo, 0xffd43b, 1.1);
  star.rotation.x = -Math.PI / 2;
  star.position.y = 0.35;
  return star;
}

function createBolt() {
  const g = new THREE.Group();
  const bolt = em(new THREE.BoxGeometry(0.08, 0.35, 0.08), 0xffe066, 1.2);
  bolt.position.y = 0.35;
  const bolt2 = bolt.clone();
  bolt2.rotation.y = Math.PI / 2;
  g.add(bolt, bolt2);
  return g;
}

function buildChessScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x141824);
  scene.fog = new THREE.Fog(0x141824, 70, 200);

  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const sun = new THREE.DirectionalLight(0xfff4dd, 1.8);
  sun.position.set(20, 35, 15);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xaac8ff, 0.6);
  fill.position.set(-12, 12, 18);
  scene.add(fill);

  const board = new THREE.Group();
  scene.add(board);

  const tileGeo = new THREE.BoxGeometry(TILE * 0.98, 0.18, TILE * 0.98);
  const ground = mm(new THREE.PlaneGeometry(GRID * TILE + 6, GRID * TILE + 6), 0x1a2030);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(OFFSET, -0.12, OFFSET);
  board.add(ground);

  const demoStars = [[1, 3, 5], [4, 6, 8], [6, 2, 4]];
  const demoBolts = [[2, 5, 3], [5, 1, 4]];

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const light = (row + col) % 2 === 0;
      const tile = mm(tileGeo, light ? LIGHT_SQ : DARK_SQ);
      tile.position.set(col * TILE + TILE / 2, 0.09, row * TILE + TILE / 2);
      board.add(tile);

      const x = col * TILE + TILE / 2;
      const z = row * TILE + TILE / 2;

      demoStars.forEach(([r, c, v]) => {
        if (r === row && c === col) {
          const star = createStar();
          star.position.set(x, 0, z);
          board.add(star);
        }
      });
      demoBolts.forEach(([r, c, v]) => {
        if (r === row && c === col) {
          const bolt = createBolt();
          bolt.position.set(x, 0, z);
          board.add(bolt);
        }
      });
    }
  }

  const whiteKnight = createKnight(0xf8f8f2);
  whiteKnight.position.set(2 * TILE + TILE / 2, 0, 1 * TILE + TILE / 2);
  board.add(whiteKnight);

  const blackKnight = createKnight(0x2b2b2b);
  blackKnight.position.set(5 * TILE + TILE / 2, 0, 6 * TILE + TILE / 2);
  board.add(blackKnight);

  board.position.set(-OFFSET, 0, -OFFSET);
  return { scene, board, whiteKnight, blackKnight };
}

(function initBackground() {
  const container = document.getElementById('bg-canvas');
  const W = window.innerWidth;
  const H = window.innerHeight;
  const { scene, whiteKnight, blackKnight } = buildChessScene();

  const frust = 24;
  const aspect = W / H;
  const camera = new THREE.OrthographicCamera(
    -frust * aspect / 2, frust * aspect / 2, frust / 2, -frust / 2, 0.1, 400
  );
  camera.zoom = 1.55;
  camera.updateProjectionMatrix();
  window._menuCamera = camera;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  let orbit = Math.PI / 4;
  const ORBIT_R = 42;
  const ORBIT_H = 38;

  window.addEventListener('resize', () => {
    const nW = window.innerWidth;
    const nH = window.innerHeight;
    const nA = nW / nH;
    camera.left = -frust * nA / 2;
    camera.right = frust * nA / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });

  let t = 0;
  function loop() {
    requestAnimationFrame(loop);
    t += 0.01;
    orbit += 0.00025;
    whiteKnight.position.y = Math.sin(t) * 0.04;
    blackKnight.position.y = Math.sin(t + 1.2) * 0.04;
    camera.position.set(
      Math.cos(orbit) * ORBIT_R,
      ORBIT_H,
      Math.sin(orbit) * ORBIT_R
    );
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  loop();
})();

window.irASeleccionNivel = function () {
  const mainPanel = document.getElementById('main-panel');
  const nivelPanel = document.getElementById('nivel-panel');
  mainPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  mainPanel.style.opacity = '0';
  mainPanel.style.transform = 'translateY(-20px)';
  setTimeout(() => {
    mainPanel.style.display = 'none';
    nivelPanel.style.display = 'flex';
    nivelPanel.offsetHeight;
    nivelPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    nivelPanel.style.opacity = '1';
    nivelPanel.style.transform = 'translateY(0)';
  }, 400);
};

window.regresarAlMenu = function () {
  const mainPanel = document.getElementById('main-panel');
  const nivelPanel = document.getElementById('nivel-panel');
  nivelPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  nivelPanel.style.opacity = '0';
  nivelPanel.style.transform = 'translateY(20px)';
  setTimeout(() => {
    nivelPanel.style.display = 'none';
    mainPanel.style.display = 'flex';
    mainPanel.offsetHeight;
    mainPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    mainPanel.style.opacity = '1';
    mainPanel.style.transform = 'translateY(0)';
  }, 400);
};

window.seleccionarNivelYJugar = async function (nivel) {
  const root = document.getElementById('menu-root');
  const bgEl = document.getElementById('bg-canvas');
  const overlay = document.getElementById('overlay');
  const camera = window._menuCamera;
  const DURATION = 1100;
  const startTime = performance.now();
  const startZoom = camera ? camera.zoom : 1.55;
  const targetZoom = startZoom * 4.5;

  // Aquí el frontend guardará el nivel y transicionará, ya no llamamos al backend
  localStorage.setItem('knight_nivel_seleccionado', nivel);

  root.style.transition = `opacity ${DURATION * 0.55}ms ease`;
  overlay.style.transition = `opacity ${DURATION * 0.7}ms ease`;
  root.style.opacity = '0';
  overlay.style.opacity = '0';
  bgEl.style.transition = `filter ${DURATION * 0.85}ms ease`;
  bgEl.style.filter = 'blur(0px) brightness(1) saturate(1)';

  function animateZoom(now) {
    const t = Math.min((now - startTime) / DURATION, 1);
    const eased = t * t * t;
    if (camera) {
      camera.zoom = startZoom + (targetZoom - startZoom) * eased;
      camera.updateProjectionMatrix();
    }
    if (t < 1) requestAnimationFrame(animateZoom);
    else window.location.href = 'RenderMap/index.html';
  }
  requestAnimationFrame(animateZoom);
};
