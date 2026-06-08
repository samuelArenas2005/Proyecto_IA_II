"""Knight Energy – servidor Eel entre Python y el frontend web."""

import eel

from knight_energy import obtener_mejor_movimiento

eel.init("web")

# Movimientos predefinidos relativos (saltos de caballo) para el mockup
MOCK_DELTAS = [[2, 1], [1, 2], [-1, 2]]
mock_index = 0

@eel.expose
def obtener_movimiento_ia(estado, profundidad):
    global mock_index
    """
    Recibe el estado actual del juego y la profundidad del árbol desde el frontend 
    y retorna el mejor movimiento calculado usando Minimax. 
    """
    # === MOCKUP DE 3 MOVIMIENTOS ===
    white_pos = estado.get("white_pos", [0, 0]) if estado else [0, 0]
    
    if mock_index < len(MOCK_DELTAS):
        dr, dc = MOCK_DELTAS[mock_index]
        movimiento = [white_pos[0] + dr, white_pos[1] + dc]
        mock_index += 1
    else:
        # Una vez agotados los 3 mocks, intenta usar la función que programarán
        # Ahora pasándole el argumento extra que quieres implementar
        movimiento = obtener_mejor_movimiento(estado, profundidad)
    # ===============================
        
    return {"movimiento": movimiento, "estado_recibido": estado}


if __name__ == "__main__":
    print("Iniciando Knight Energy con Eel...")
    eel.start(
        "menu.html",
        size=(1920, 1080),
        position=(0, 0),
        mode="chrome",
    )
