// ══════════════════════════════════════════════════════════════
//  api.js — Comunicación con Python (Eel) para Knight Energy
// ══════════════════════════════════════════════════════════════

async function obtenerMovimientoIA(estado, profundidad) {
  if (typeof eel !== 'undefined' && eel.obtener_movimiento_ia) {
    return await eel.obtener_movimiento_ia(estado, profundidad)();
  }
  return null;
}
