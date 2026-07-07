import eel
import sys
from types import SimpleNamespace
from GameState import GameState
from GameKnightEnergy import get_best_movement, build_random_map_state
from TournamentLogic.GameKnightHeuristicAI import get_best_movement_with_heuristic
from TournamentLogic.GameKnightTournament import play_tournament_round, run_tournament
from TournamentLogic.HeuristicStrategies import list_heuristics

eel.init("web")

debug_mode = True
machine_move_mode = "minmax"  # options: "infinite", "minmax"

def normalize_state(state):
    if isinstance(state, dict):
        return SimpleNamespace(**state)
    return state

@eel.expose
def solicitar_mapa_aleatorio():
    """Envía un diccionario de estado de mapa aleatorio al frontend."""
    return build_random_map_state()


@eel.expose
def set_debug_mode(enabled):
    global debug_mode
    debug_mode = bool(enabled)
    if hasattr(eel, 'onDebugMode'):
        eel.onDebugMode(debug_mode)
    return debug_mode

@eel.expose
def close_window():
    """Cierra el proceso cuando el usuario elige salir desde el menu."""
    sys.exit(0)

@eel.expose
def obtener_movimiento_ia(estado, profundidad):
    try:
        profundidad = int(profundidad)
    except (TypeError, ValueError):
        profundidad = 2

    print(profundidad)
    
    state_obj = normalize_state(estado)
    game_state = GameState(state_obj)
    
    if game_state.is_end_game():
        return {"movimiento": None, "mensaje": "El juego ha terminado."}

    if debug_mode:
        game_state.show_state()

    movimiento = None
    valid_moves = game_state.get_valid_moves() if hasattr(game_state, 'get_valid_moves') else []
    
    if machine_move_mode == "infinite":
        movimiento = valid_moves[0] if valid_moves else None
    else:
        movimiento = get_best_movement(game_state, profundidad)

    if game_state.is_end_game():
        return {"movimiento": movimiento, "mensaje": "El juego ha terminado por la IA.", "mode": machine_move_mode}

    return {"movimiento": movimiento, "mode": machine_move_mode}


@eel.expose
def listar_heuristicas():
    return list_heuristics()


@eel.expose
def obtener_movimiento_ia_heuristica(estado, profundidad, heuristica):
    try:
        profundidad = int(profundidad)
    except (TypeError, ValueError):
        profundidad = 2

    game_state = GameState(normalize_state(estado))
    if game_state.is_end_game():
        return {"movimiento": None, "mensaje": "El juego ha terminado."}

    movimiento = get_best_movement_with_heuristic(game_state, profundidad, heuristica)
    return {"movimiento": movimiento, "heuristica": heuristica}


@eel.expose
def ejecutar_torneo_heuristicas(heuristicas, profundidad):
    try:
        return run_tournament(heuristicas, profundidad)
    except Exception as error:
        return {"error": str(error)}


@eel.expose
def ejecutar_ronda_torneo_heuristicas(heuristicas, profundidad, total_participantes, numero_ronda):
    try:
        return play_tournament_round(heuristicas, profundidad, total_participantes, numero_ronda)
    except Exception as error:
        return {"error": str(error)}


@eel.expose
def aplicar_movimiento(estado, movimiento):
    """Applies a move to the given state and returns the resulting state.
    Single source of truth for all game transitions — called by the frontend
    for both the human player's move and the AI move.
    """
    state_obj = GameState(normalize_state(estado))
    new_state_obj = state_obj.apply_move(movimiento)
    return new_state_obj.to_dict()
@eel.expose
def dev_show_state(estado):
    state_obj = normalize_state(estado)
    game_state = GameState(state_obj)
    if hasattr(estado, 'debug_move') or isinstance(estado, dict) and estado.get('debug_move') is not None:
        print("Debug move enviado al backend:", estado.get('debug_move') if isinstance(estado, dict) else getattr(estado, 'debug_move', None))
    game_state.show_state()
    return True

if __name__ == "__main__":
    print("Iniciando Knight Energy con Eel...")
    eel.start(
        "menu.html",
        size=(1920, 1080),
        position=(0, 0),
        mode="chrome",
        cmdline_args=['--autoplay-policy=no-user-gesture-required'],
        shutdown_delay=5.0
    )
