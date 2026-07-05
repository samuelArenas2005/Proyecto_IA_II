"""
Lógica del algoritmo Minimax, poda alfa-beta y otras utilidades.
"""
import random
import copy
from types import SimpleNamespace

def minimax_alpha_beta(GameState,depth):
    """
    Implementación de Minimax con poda alfa-beta.
    """
    pass

def get_best_movement(game_state, depth):
    """
    Abstracción principal que recibe el estado actual del juego 
    y la profundidad del árbol de búsqueda, retornando el mejor movimiento calculado.
    """
    if hasattr(game_state, 'get_valid_moves'):
        valid_moves = game_state.get_valid_moves()
        return valid_moves[0] if valid_moves else None
    return None

def verify_state_values(state):
    """
    Función que verifica que los valores del estado del juego sean válidos.
    """
    if not isinstance(state.white_pos, list) or len(state.white_pos) != 2:
        return False
    if not isinstance(state.black_pos, list) or len(state.black_pos) != 2:
        return False
    if not isinstance(state.stars, dict):
        return False
    if not isinstance(state.energy_tiles, dict):
        return False
    if not isinstance(state.white_energy, int) or state.white_energy < 0:
        return False
    if not isinstance(state.black_energy, int) or state.black_energy < 0:
        return False
    if not isinstance(state.white_points, int) or state.white_points < 0:
        return False
    if not isinstance(state.black_points, int) or state.black_points < 0:
        return False
    if hasattr(state, 'current_turn') and state.current_turn is not None:
        if state.current_turn not in ["white", "black"]:
            return False
    
    return True


def _is_within_board(row, col):
    """Returns True if the position is inside the 8x8 board."""
    return 0 <= row < 8 and 0 <= col < 8


def _get_knight_jumps(row, col):
    """Returns all 8 theoretical L-shaped jumps from a given position."""
    return [
        (row + 2, col + 1), (row + 2, col - 1),
        (row - 2, col + 1), (row - 2, col - 1),
        (row + 1, col + 2), (row + 1, col - 2),
        (row - 1, col + 2), (row - 1, col - 2)
    ]


def _has_legal_moves(pos, other_pos):
    """
    Returns True if a knight at pos has at least one legal move:
    - The destination must be inside the board.
    - The destination must not be occupied by the other player.
    """
    row, col = pos
    other_row, other_col = other_pos

    for dest_row, dest_col in _get_knight_jumps(row, col):
        is_inside = _is_within_board(dest_row, dest_col)
        is_occupied_by_opponent = (dest_row == other_row and dest_col == other_col)

        if is_inside and not is_occupied_by_opponent:
            return True

    return False


def can_player_move(pos, other_pos, energy):
    """
    Returns True if a player is able to make a move this turn.
    A player needs at least 1 energy AND at least one legal square to jump to.
    """
    has_energy = energy >= 1
    has_moves = _has_legal_moves(pos, other_pos)

    return has_energy and has_moves


def is_end_game(state):
    """
    Returns True if the game is over. There are two ending conditions:
    1. No star tiles remain on the board.
    2. Neither player is able to make a move.
    """
    no_stars_left = len(state.stars) == 0

    if no_stars_left:
        return True

    white_stuck = not can_player_move(state.white_pos, state.black_pos, state.white_energy)
    black_stuck = not can_player_move(state.black_pos, state.white_pos, state.black_energy)
    both_stuck = white_stuck and black_stuck

    return both_stuck


def _determine_winner(state):
    """Returns 'white', 'black', or 'draw' based on current points."""
    if state["white_points"] > state["black_points"]:
        return "white"
    if state["black_points"] > state["white_points"]:
        return "black"
    return "draw"


def apply_move(state_dict, move):
    """
    Applies a move to the current state and returns the resulting state as a dict.
    This is the single source of truth for all game state transitions.

    Rules applied here:
    - Move the current player's knight to the destination.
    - Consume 1 energy from the current player.
    - Collect a star (points) or energy tile if the destination has one.
    - If the next player cannot move (no energy or no legal squares):
        - Deduct 3 points from the next player.
        - The turn stays with the current player.
    - Evaluate if the game is over after the move.
    """
    
    next_state = copy.deepcopy(state_dict)

    turn = next_state["current_turn"]
    other_turn = "black" if turn == "white" else "white"

   
    pos_key = f"{turn}_pos"
    energy_key = f"{turn}_energy"
    points_key = f"{turn}_points"

    next_state[pos_key] = list(move)
    next_state[energy_key] = max(0, next_state[energy_key] - 1)

    
    dest_key = f"{move[0]},{move[1]}"
    if dest_key in next_state["stars"]:
        next_state[points_key] += next_state["stars"].pop(dest_key)
    elif dest_key in next_state["energy_tiles"]:
        next_state[energy_key] += next_state["energy_tiles"].pop(dest_key)

    # Decide whose turn is next
    other_energy_key = f"{other_turn}_energy"
    other_points_key = f"{other_turn}_points"
    other_pos = next_state[f"{other_turn}_pos"]
    current_pos = next_state[pos_key]

    other_can_move = can_player_move(other_pos, current_pos, next_state[other_energy_key])

    if other_can_move:
        next_state["current_turn"] = other_turn
    else:
        next_state[other_points_key] -= 3
        next_state["current_turn"] = turn

    # Evaluate game over using the updated state as a namespace
    
    state_ns = SimpleNamespace(**next_state)
    game_is_over = is_end_game(state_ns)

    next_state["game_over"] = game_is_over
    next_state["winner"] = _determine_winner(next_state) if game_is_over else None

    return next_state


def assign_coordinates(target_dict, values, chosen_positions, start_index):
    """Auxiliary function to map coordinates from chosen_positions to values in a dictionary.
    
    It updates target_dict in-place and returns the next available index.
    """
    current_index = start_index
    for val in values:
        r, c = chosen_positions[current_index]
        target_dict[f"{r},{c}"] = val
        current_index += 1
    return current_index


def build_random_map_state():
    """Generador de mapa aleatorio.

    Esta función devuelve un diccionario con la forma esperada por el frontend y
    por GameState. Se usa únicamente para posicionar elementos en el inicio.
    """
    all_cells = [(r, c) for r in range(8) for c in range(8)]
    
    star_values = [2, 3, 4, 5, 6, 8, 9]
    energy_values = [2, 3, 4, 5]
    
    total_needed = 2 + len(star_values) + len(energy_values)
    chosen_positions = random.sample(all_cells, total_needed)
    
    white_pos = list(chosen_positions[0])
    black_pos = list(chosen_positions[1])
    
    position_index = 2
    
    # se asigna las posiciones a las estrellas y a la energía usando la función auxiliar para poder reutilizarla xd
    stars = {}
    position_index = assign_coordinates(stars, star_values, chosen_positions, position_index)
    
    energy_tiles = {}
    position_index = assign_coordinates(energy_tiles, energy_values, chosen_positions, position_index)
        
    return {
        "white_pos": white_pos,
        "black_pos": black_pos,
        "stars": stars,
        "energy_tiles": energy_tiles
    }


