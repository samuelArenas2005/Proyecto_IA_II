"""Knight Energy – servidor Eel entre Python y el frontend web.

══════════════════════════════════════════════════════════════════════
CONTRATO DE DATOS: lo que el FRONTEND envía y lo que PYTHON retorna
══════════════════════════════════════════════════════════════════════

1. ESTADO que recibe Python desde el frontend (argumento `estado`):
───────────────────────────────────────────────────────────────────
{
  "white_pos": [2, 3],           # [fila, columna] del caballo blanco (IA)
  "black_pos": [5, 4],           # [fila, columna] del caballo negro (Jugador)

  "stars": {                     # Casillas con puntos que aún quedan en el tablero
    "1,2": 5,                   # clave "fila,col" → valor de la snitch
    "3,7": 9,
    "6,0": 2
  },
  "energy_tiles": {              # Casillas de energía que aún quedan en el tablero
    "4,4": 3,                   # clave "fila,col" → energía que otorga
    "0,6": 5
  },

  "white_energy": 6,             # Energía actual del caballo blanco (IA)
  "black_energy": 7,             # Energía actual del caballo negro (Jugador)
  "white_points": 9,             # Puntos acumulados del caballo blanco (IA)
  "black_points": 5,             # Puntos acumulados del caballo negro (Jugador)
}

2. MOVIMIENTO que Python debe RETORNAR al frontend:
────────────────────────────────────────────────────
{
  "movimiento": [4, 2],          # [fila, columna] destino del caballo blanco (IA)
}

  ↑ El frontend leerá `response.movimiento` para animar el caballo y
    luego actualizará el estado del juego (puntos, energía, tablero).

NOTAS PARA IMPLEMENTAR obtener_mejor_movimiento(estado, profundidad):
──────────────────────────────────────────────────────────────────────
  - `estado` es el dict descrito arriba (parseado desde JSON)
  - `profundidad` es 2, 4 o 6 según el nivel
  - La función debe retornar [fila, columna], un movimiento válido de caballo en L
  - Movimientos en L del caballo: (±1,±2) o (±2,±1)  →  8 posibles saltos
  - Un movimiento es válido si la casilla destino está dentro del tablero (0–7)

══════════════════════════════════════════════════════════════════════
"""

import eel

from knight_energy import obtener_mejor_movimiento

eel.init("web")


@eel.expose
def obtener_movimiento_ia(estado, profundidad):
    """
    Recibe el estado del juego desde el frontend y retorna el mejor movimiento
    de la IA calculado con Minimax.

    Parámetros:
        estado      (dict)  – Estado completo del juego (ver ejemplo arriba)
        profundidad (int)   – Profundidad del árbol: 2, 4 o 6

    Retorna:
        dict con clave "movimiento": [fila, columna]
    """
    return 


if __name__ == "__main__":
    print("Iniciando Knight Energy con Eel...")
    eel.start(
        "menu.html",
        size=(1920, 1080),
        position=(0, 0),
        mode="chrome",
    )
