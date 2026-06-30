import eel
import random


eel.init("web")

mock_state = {} # Initialize global variable

# Definición de la función para reiniciar/obtener estado
@eel.expose
def get_initial_mock_state():
    global mock_state
    mock_state = {
        "board_size": 8,
        "nivel": "amateur",
        "white_pos": [6, 1], # Jugador
        "black_pos": [1, 5], # IA
        "stars": {
            "2,2": 5, "3,4": 5, "4,6": 5,
            "1,0": 5, "2,4": 5, "5,1": 5, "5,7": 5
        },
        "energy_tiles": {
            "1,3": 3, "3,2": 3, "4,4": 3, "1,6": 3
        },
        "white_energy": 7,
        "black_energy": 7,
        "white_points": 0,
        "black_points": 0,
        "current_turn": "white",
        "game_over": False,
        "winner": None,
        "message": "Partida simulada iniciada",
        "valid_moves": [
            [4, 0], [4, 2], [5, 3], [7, 3] # Movimientos válidos de caballo para (6,1) Jugador
        ]
    }
    return mock_state

@eel.expose
def mover_humano(row, col):
    """
    Mockup: El humano mueve a (row, col). Descontamos energía, sumamos posibles
    puntos (snitch) o energía (poción), y luego la IA realiza un movimiento aleatorio.
    """
    global mock_state
    
    # 1. MOVER AL HUMANO (Blanco)
    mock_state["white_pos"] = [row, col]
    k = f"{row},{col}"
    
    if k in mock_state["stars"]:
        mock_state["white_points"] += mock_state["stars"].pop(k)
        
    if k in mock_state["energy_tiles"]:
        mock_state["white_energy"] += mock_state["energy_tiles"].pop(k)
        
    mock_state["white_energy"] -= 1 # Costo de mover
    mock_state["current_turn"] = "black"
    mock_state["valid_moves"] = []
    
    # Notificamos que humano movió para reproducir sonido de inmediato
    eel.onEstadoActualizado(mock_state)
    
    # Simulamos que la IA procesa
    eel.sleep(0.8)
    
    # 2. MOVER A LA IA (Caballo Negro)
    br, bc = mock_state["black_pos"]
    posibles = [(br+2, bc+1), (br+2, bc-1), (br-2, bc+1), (br-2, bc-1),
                (br+1, bc+2), (br+1, bc-2), (br-1, bc+2), (br-1, bc-2)]
    validas = [(r, c) for r, c in posibles if 0 <= r < 8 and 0 <= c < 8]
    best = validas[0] if validas else (br, bc)
    
    mock_state["black_pos"] = list(best)
    bk = f"{best[0]},{best[1]}"
    
    if bk in mock_state["stars"]:
        mock_state["black_points"] += mock_state["stars"].pop(bk)
    if bk in mock_state["energy_tiles"]:
        mock_state["black_energy"] += mock_state["energy_tiles"].pop(bk)
        
    mock_state["black_energy"] -= 1
    mock_state["current_turn"] = "white"
    
    # 3. Calcular los próximos movimientos válidos para el humano
    wr, wc = mock_state["white_pos"]
    w_cand = [(wr+2, wc+1), (wr+2, wc-1), (wr-2, wc+1), (wr-2, wc-1),
              (wr+1, wc+2), (wr+1, wc-2), (wr-1, wc+2), (wr-1, wc-2)]
    mock_state["valid_moves"] = [[r, c] for r, c in w_cand if 0 <= r < 8 and 0 <= c < 8]
    
    return mock_state

@eel.expose
def obtener_movimiento_ia(estado, profundidad):
    return {"movimiento": [4, 2]} # Placeholder clásico original


if __name__ == "__main__":
    print("Iniciando Knight Energy con Eel...")
    eel.start(
        "menu.html",
        size=(1920, 1080),
        position=(0, 0),
        mode="chrome",
        cmdline_args=['--autoplay-policy=no-user-gesture-required']
    )
