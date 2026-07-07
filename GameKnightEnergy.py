"""
Lógica del algoritmo Minimax, poda alfa-beta y otras utilidades.
"""
import random

def minimax_alpha_beta(game_state, depth, alpha=float("-inf"), beta=float("inf")):
    """
    Implementación de Minimax con poda alfa-beta.
    """
    if game_state.is_end_game():
        return game_state.utility_function()

    if depth == 0:
        return game_state.heuristica_utility_function()

    possible_states = game_state.get_gamestate_possible()
    if not possible_states:
        return game_state.heuristica_utility_function()

    if game_state.current_turn == "white":
        best_value = float("-inf")
        for child_state in possible_states:
            value = minimax_alpha_beta(child_state, depth - 1, alpha, beta)
            best_value = max(best_value, value)
            alpha = max(alpha, best_value)
            if beta <= alpha:
                break
        return best_value

    best_value = float("inf")
    for child_state in possible_states:
        value = minimax_alpha_beta(child_state, depth - 1, alpha, beta)
        best_value = min(best_value, value)
        beta = min(beta, best_value)
        if beta <= alpha:
            break
    return best_value

def get_best_movement(game_state, depth):
    """
    Abstracción principal que recibe el estado actual del juego 
    y la profundidad del árbol de búsqueda, retornando el mejor movimiento calculado.
    """
    if not hasattr(game_state, "get_valid_moves"):
        return None

    if not game_state.can_player_move(game_state.current_turn):
        return None

    valid_moves = game_state.get_valid_moves()
    if not valid_moves:
        return None

    maximizing = game_state.current_turn == "white"
    best_move = None
    best_score = float("-inf") if maximizing else float("inf")

    for move in valid_moves:
        child_state = game_state.apply_move(move)
        score = minimax_alpha_beta(child_state, depth - 1)

        if maximizing and score > best_score:
            best_score = score
            best_move = move
        elif not maximizing and score < best_score:
            best_score = score
            best_move = move

    return best_move




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
