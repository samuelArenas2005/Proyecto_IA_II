import * as THREE from 'three';

/* ══════════════════════════════════════════════════════════════
   map.js – Tablero 8×8 isométrico · Knight Energy
   Texturas pixel art · vista isométrica limpia
══════════════════════════════════════════════════════════════ */

const TILE = 2;
const GRID = 8;
const OFFSET = (GRID * TILE) / 2;
const ASSET_BASE = '../assets/sprints/';

const HIGHLIGHT = 0x69db7c;
const VALID_RING = 0x51cf66;

const CAM_TARGET = new THREE.Vector3(0, 0, 0);
const CAM_POSITION = new THREE.Vector3(28, 32, 28);
const DEFAULT_ZOOM = 0.78;
const MIN_ZOOM = 0.55;
const MAX_ZOOM = 2.2;
const ZOOM_STEP = 1.12;
const FRUST_SIZE = 12;
const TILE_HEIGHT = 0.18;
const PIECE_Y = TILE_HEIGHT;

window.__gameState = null;
window.__sceneData = {};

function mm(geo, color, opts = {}) {
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, ...opts }));
}
function em(geo, color, intensity = 0.9) {
  return mm(geo, color, { emissive: color, emissiveIntensity: intensity });
}
function darken(hex, f) {
  const r = ((hex >> 16) & 0xff) * f | 0;
  const g = ((hex >> 8) & 0xff) * f | 0;
  const b = (hex & 0xff) * f | 0;
  return (r << 16) | (g << 8) | b;
}

function boardToWorld(row, col) {
  return { x: col * TILE + TILE / 2, z: row * TILE + TILE / 2 };
}

function loadTexture(path) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      path,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        resolve(tex);
      },
      undefined,
      reject
    );
  });
}

async function loadAssets() {
  const [white, gray, snitch, potion, jugador] = await Promise.all([
    loadTexture(`${ASSET_BASE}bloque_blanco_ajedrez_sprint.png`),
    loadTexture(`${ASSET_BASE}bloque_gris_ajedez_sprint.png`),
    loadTexture(`${ASSET_BASE}sprint_stich_dorada.png`),
    loadTexture(`${ASSET_BASE}sprints_pocion.png`),
    loadTexture(`${ASSET_BASE}jugador.png`),
  ]);
  return { white, gray, snitch, potion, jugador };
}

function tileTopMaterial(baseTex, row, col, sideTint) {
  const map = baseTex.clone();
  map.repeat.set(0.5, 0.5);
  map.offset.set((col % 2) * 0.5, (row % 2) * 0.5);
  const sideMat = new THREE.MeshLambertMaterial({ color: sideTint });
  const topMat = new THREE.MeshLambertMaterial({ map, color: 0xffffff });
  return [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
}

function createTexturedTile(row, col, isLight, tex) {
  const geo = new THREE.BoxGeometry(TILE, TILE_HEIGHT, TILE);
  const sideTint = isLight ? 0xc8b898 : 0x5a5348;
  const materials = tileTopMaterial(isLight ? tex.white : tex.gray, row, col, sideTint);
  const tile = new THREE.Mesh(geo, materials);
  const { x, z } = boardToWorld(row, col);
  tile.position.set(x, TILE_HEIGHT / 2, z);
  tile.userData = { row, col, type: 'tile' };
  return tile;
}

function createCollectible(groupName, spriteTex, scaleW, scaleH) {
  const g = new THREE.Group();
  g.name = groupName;

  const map = spriteTex.clone();
  const mat = new THREE.SpriteMaterial({
    map,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scaleW, scaleH, 1);
  sprite.position.y = 0.45 + scaleH * 0.2;
  sprite.center.set(0.5, 0.38);
  g.add(sprite);
  return g;
}

function createSnitchMesh(_value, tex) {
  return createCollectible('star', tex.snitch, 0.72, 0.72);
}

function createPotionMesh(_value, tex) {
  const img = tex.potion.image;
  const aspect = img && img.height ? img.width / img.height : 0.55;
  const h = 0.76;
  const w = Math.min(h * aspect, 0.46);
  return createCollectible('bolt', tex.potion, w, h);
}

function createKnightMesh(color) {
  const g = new THREE.Group();
  g.name = 'knight';
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

/** Jugador en 2.5D: sprite pixel art orientado a la cámara isométrica */
function createPlayerPiece(tex) {
  const g = new THREE.Group();
  g.name = 'knight';
  g.userData.isSpritePiece = true;

  const shadow = mm(new THREE.CircleGeometry(0.32, 16), 0x000000, {
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  g.add(shadow);

  const map = tex.jugador.clone();
  const mat = new THREE.SpriteMaterial({
    map,
    transparent: true,
    alphaTest: 0.06,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  const img = tex.jugador.image;
  const aspect = img && img.height ? img.width / img.height : 1.15;
  const h = 1.0;
  const w = Math.min(h * aspect, 1.12);
  sprite.scale.set(w, h, 1);
  sprite.position.y = h * 0.4;
  sprite.center.set(0.5, 0.32);
  g.userData.sprite = sprite;
  g.userData.baseScaleX = w;
  g.add(sprite);
  return g;
}

function facePiece(piece, dx, dz) {
  if (piece.userData.isSpritePiece && piece.userData.sprite) {
    const sprite = piece.userData.sprite;
    const base = piece.userData.baseScaleX;
    if (Math.abs(dx) > 0.02) {
      sprite.scale.x = dx >= 0 ? base : -base;
    }
    return;
  }
  if (dx !== 0 || dz !== 0) {
    piece.rotation.y = Math.atan2(-dz, dx);
  }
}

async function buildBoard(estado) {
  const container = document.getElementById('map-canvas');
  container.innerHTML = '';

  let tex;
  try {
    tex = await loadAssets();
  } catch (e) {
    console.error('Error cargando texturas:', e);
    window.mostrarToast?.('Error al cargar texturas del escenario');
    tex = await loadAssets().catch(() => null);
  }

  const W = container.clientWidth;
  const H = container.clientHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1d33);

  const aspect = W / H;
  const frust = FRUST_SIZE;
  const camera = new THREE.OrthographicCamera(
    -frust * aspect / 2, frust * aspect / 2, frust / 2, -frust / 2, 0.1, 400
  );

  function computeFitZoom(viewAspect) {
    const boardRadius = GRID * TILE / 2 + 0.6;
    const padding = 1.62;
    const zoomV = FRUST_SIZE / (boardRadius * padding);
    const zoomH = (FRUST_SIZE * viewAspect) / (boardRadius * padding);
    return Math.min(zoomV, zoomH) * 0.82;
  }

  function applyFixedCamera() {
    camera.position.copy(CAM_POSITION);
    camera.lookAt(CAM_TARGET);
    camera.updateProjectionMatrix();
  }

  function setZoom(value) {
    camera.zoom = THREE.MathUtils.clamp(value, MIN_ZOOM, MAX_ZOOM);
    camera.updateProjectionMatrix();
  }

  setZoom(computeFitZoom(aspect));
  applyFixedCamera();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  let initialZoom = computeFitZoom(aspect);

  renderer.domElement.addEventListener('wheel', (event) => {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
    setZoom(camera.zoom * factor);
  }, { passive: false });

  scene.add(new THREE.AmbientLight(0xffffff, 1.35));
  scene.add(new THREE.HemisphereLight(0xfff8ee, 0x334466, 0.45));

  const sun = new THREE.DirectionalLight(0xfff8e7, 1.9);
  sun.position.set(18, 32, 14);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xaad4ff, 0.85);
  fill.position.set(-12, 16, 18);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffeedd, 0.45);
  rim.position.set(8, 8, -16);
  scene.add(rim);

  const boardBase = mm(
    new THREE.BoxGeometry(GRID * TILE + 0.08, 0.06, GRID * TILE + 0.08),
    0x2a2520
  );
  boardBase.position.set(0, -0.03, 0);
  scene.add(boardBase);

  const ground = mm(new THREE.PlaneGeometry(GRID * TILE + 8, GRID * TILE + 8), 0x141824);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.06, 0);
  scene.add(ground);

  const boardGroup = new THREE.Group();
  boardGroup.position.set(-OFFSET, 0, -OFFSET);
  scene.add(boardGroup);

  const highlights = new THREE.Group();
  highlights.name = 'highlights';
  boardGroup.add(highlights);

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const isLight = (row + col) % 2 === 0;
      const tile = tex
        ? createTexturedTile(row, col, isLight, tex)
        : (() => {
            const fallback = mm(
              new THREE.BoxGeometry(TILE, TILE_HEIGHT, TILE),
              isLight ? 0xf0d9b5 : 0xb58863
            );
            const { x, z } = boardToWorld(row, col);
            fallback.position.set(x, TILE_HEIGHT / 2, z);
            fallback.userData = { row, col, type: 'tile' };
            return fallback;
          })();
      boardGroup.add(tile);
    }
  }

  const specials = new THREE.Group();
  specials.name = 'specials';
  boardGroup.add(specials);

  function syncSpecials(state) {
    while (specials.children.length) specials.remove(specials.children[0]);
    if (!tex) return;
    Object.entries(state.stars || {}).forEach(([key, value]) => {
      const [row, col] = key.split(',').map(Number);
      const snitch = createSnitchMesh(value, tex);
      const { x, z } = boardToWorld(row, col);
      snitch.position.set(x, PIECE_Y, z);
      specials.add(snitch);
    });
    Object.entries(state.energy_tiles || {}).forEach(([key, value]) => {
      const [row, col] = key.split(',').map(Number);
      const potion = createPotionMesh(value, tex);
      const { x, z } = boardToWorld(row, col);
      potion.position.set(x, PIECE_Y, z);
      specials.add(potion);
    });
  }

  const whiteKnight = createKnightMesh(0xf8f8f2);
  whiteKnight.userData.player = 'white';
  const blackKnight = tex ? createPlayerPiece(tex) : createKnightMesh(0x2a2a2a);
  blackKnight.userData.player = 'black';
  boardGroup.add(whiteKnight, blackKnight);

  function placeKnights(state) {
    const w = boardToWorld(state.white_pos[0], state.white_pos[1]);
    const b = boardToWorld(state.black_pos[0], state.black_pos[1]);
    whiteKnight.position.set(w.x, PIECE_Y, w.z);
    blackKnight.position.set(b.x, PIECE_Y, b.z);
  }

  function showValidMoves(moves) {
    while (highlights.children.length) highlights.remove(highlights.children[0]);
    moves.forEach(([row, col]) => {
      const { x, z } = boardToWorld(row, col);

      const disc = mm(new THREE.CircleGeometry(TILE * 0.28, 24), HIGHLIGHT, {
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      });
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(x, TILE_HEIGHT + 0.01, z);
      disc.userData = { row, col, type: 'highlight' };
      highlights.add(disc);

      const ring = em(new THREE.RingGeometry(TILE * 0.24, TILE * 0.30, 24), VALID_RING, 0.55);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, TILE_HEIGHT + 0.015, z);
      ring.userData = { row, col, type: 'highlight' };
      highlights.add(ring);
    });
  }

  let animating = false;
  let busy = false;
  let floatPhase = 0;

  async function animateKnight(knight, toRow, toCol) {
    animating = true;
    const start = { x: knight.position.x, z: knight.position.z };
    const end = boardToWorld(toRow, toCol);
    let t = 0;
    const jumpH = 0.55;
    await new Promise((resolve) => {
      function step() {
        t += 0.045;
        if (t >= 1) {
          knight.position.set(end.x, PIECE_Y, end.z);
          animating = false;
          resolve();
          return;
        }
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        knight.position.x = start.x + (end.x - start.x) * ease;
        knight.position.z = start.z + (end.z - start.z) * ease;
        knight.position.y = PIECE_Y + Math.sin(Math.PI * ease) * jumpH;
        facePiece(knight, end.x - start.x, end.z - start.z);
        requestAnimationFrame(step);
      }
      step();
    });
  }

  async function applyState(state, animateWhite = false, animateBlack = false) {
    window.__gameState = state;
    syncSpecials(state);
    placeKnights(state);

    if (animateWhite) await animateKnight(whiteKnight, state.white_pos[0], state.white_pos[1]);
    if (animateBlack) await animateKnight(blackKnight, state.black_pos[0], state.black_pos[1]);

    if (state.current_turn === 'black' && !state.game_over) {
      showValidMoves(state.valid_moves || []);
    } else {
      showValidMoves([]);
    }

    window.onEstadoActualizado?.(state);
  }

  async function runAITurn() {
    if (busy || window.__gameState?.game_over) return;
    if (window.__gameState?.current_turn !== 'white') return;
    busy = true;
    showValidMoves([]);
    try {
      const profundidades = { principiante: 2, amateur: 4, experto: 6 };
      const nivel = window.__gameState.nivel || 'principiante';
      const prof = profundidades[nivel] || 2;
      
      const response = await obtenerMovimientoIA(window.__gameState, prof);
      if (response && response.movimiento && response.movimiento.length === 2) {
        const [r, c] = response.movimiento;
        await animateKnight(whiteKnight, r, c);
        window.__gameState.white_pos = [r, c];
        window.__gameState.current_turn = 'black';
        window.__gameState.message = 'La IA movió a ' + r + ', ' + c;
        
        // Calcular saltos iniciales válidos de demo para la UI
        const br = window.__gameState.black_pos[0];
        const bc = window.__gameState.black_pos[1];
        const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        window.__gameState.valid_moves = deltas
          .map(([dr, dc]) => [br+dr, bc+dc])
          .filter(([nr, nc]) => nr>=0 && nr<8 && nc>=0 && nc<8);
        
        await applyState(window.__gameState, false, false);
      } else {
        window.__gameState.current_turn = 'black';
        window.__gameState.message = 'La IA pasó su turno';
        await applyState(window.__gameState, false, false);
      }
    } catch (e) {
      console.error('Error calculando turno de IA:', e);
    } finally {
      busy = false;
    }
  }

  async function onPlayerClick(row, col) {
    if (busy || animating || window.__gameState?.game_over) return;
    if (window.__gameState?.current_turn !== 'black') return;

    const valid = (window.__gameState.valid_moves || []).some(
      ([r, c]) => r === row && c === col
    );
    if (!valid) {
      window.mostrarToast?.('Movimiento inválido para el caballo');
      return;
    }

    busy = true;
    showValidMoves([]);
    
    // Aplicamos movimiento del jugador
    await animateKnight(blackKnight, row, col);
    window.__gameState.black_pos = [row, col];
    window.__gameState.current_turn = 'white';
    window.__gameState.message = 'Moviste a ' + row + ', ' + col;
    window.__gameState.valid_moves = [];
    await applyState(window.__gameState, false, false);
    
    setTimeout(runAITurn, 600);
    busy = false;
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  renderer.domElement.addEventListener('click', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects([boardGroup, highlights], true);
    for (const hit of hits) {
      let obj = hit.object;
      while (obj) {
        if (obj.userData?.type === 'highlight' || obj.userData?.type === 'tile') {
          onPlayerClick(obj.userData.row, obj.userData.col);
          return;
        }
        obj = obj.parent;
      }
    }
  });

  document.getElementById('btn-zoom-in').onclick = () => setZoom(camera.zoom * ZOOM_STEP);
  document.getElementById('btn-zoom-out').onclick = () => setZoom(camera.zoom / ZOOM_STEP);
  document.getElementById('btn-reset-cam').onclick = () => {
    setZoom(initialZoom);
    applyFixedCamera();
  };

  window.setMapTheme = (lightOn) => {
    scene.background.setHex(lightOn ? 0xd8e4f8 : 0x1a1d33);
    ground.material.color.setHex(lightOn ? 0xc8d0e0 : 0x141824);
  };

  window.addEventListener('resize', () => {
    const nW = container.clientWidth;
    const nH = container.clientHeight;
    const nA = nW / nH;
    camera.left = -frust * nA / 2;
    camera.right = frust * nA / 2;
    camera.updateProjectionMatrix();
    initialZoom = computeFitZoom(nA);
    renderer.setSize(nW, nH);
  });

  window.__sceneData = { applyState, runAITurn, scene, renderer };

  (function loop() {
    if (!renderer.domElement.isConnected) return;
    requestAnimationFrame(loop);
    floatPhase += 0.03;
    specials.children.forEach((item, i) => {
      item.position.y = PIECE_Y + Math.sin(floatPhase + i * 1.1) * 0.03;
    });
    renderer.render(scene, camera);
  })();

  return { applyState, runAITurn };
}

window.addEventListener('partida-lista', async (e) => {
  const { applyState, runAITurn } = await buildBoard(e.detail);
  await applyState(e.detail);
  if (e.detail.current_turn === 'white' && !e.detail.game_over) {
    setTimeout(runAITurn, 800);
  }
});

window.addEventListener('partida-reiniciada', async (e) => {
  if (window.__sceneData.applyState) {
    await window.__sceneData.applyState(e.detail);
    if (e.detail.current_turn === 'white') {
      setTimeout(() => window.__sceneData.runAITurn?.(), 800);
    }
  } else {
    await buildBoard(e.detail);
  }
});
