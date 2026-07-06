"""
Lógica del algoritmo Minimax, poda alfa-beta y otras utilidades.
"""
import random

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


