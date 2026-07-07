"""
Minimax con poda alfa-beta parametrizado por heuristica externa.
"""

from .HeuristicStrategies import evaluate_state, normalize_heuristic_name


def minimax_alpha_beta_custom(game_state, depth, heuristic_name, alpha=float("-inf"), beta=float("inf")):
    heuristic_name = normalize_heuristic_name(heuristic_name)

    if game_state.is_end_game():
        return game_state.utility_function()

    if depth <= 0:
        return evaluate_state(game_state, heuristic_name)

    possible_states = game_state.get_gamestate_possible()
    if not possible_states:
        return evaluate_state(game_state, heuristic_name)

    if game_state.current_turn == "white":
        best_value = float("-inf")
        for child_state in possible_states:
            value = minimax_alpha_beta_custom(child_state, depth - 1, heuristic_name, alpha, beta)
            best_value = max(best_value, value)
            alpha = max(alpha, best_value)
            if beta <= alpha:
                break
        return best_value

    best_value = float("inf")
    for child_state in possible_states:
        value = minimax_alpha_beta_custom(child_state, depth - 1, heuristic_name, alpha, beta)
        best_value = min(best_value, value)
        beta = min(beta, best_value)
        if beta <= alpha:
            break
    return best_value


def get_best_movement_with_heuristic(game_state, depth, heuristic_name="balanced"):
    heuristic_name = normalize_heuristic_name(heuristic_name)

    try:
        depth = int(depth)
    except (TypeError, ValueError):
        depth = 2

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
        score = minimax_alpha_beta_custom(child_state, depth - 1, heuristic_name)

        if maximizing and score > best_score:
            best_score = score
            best_move = move
        elif not maximizing and score < best_score:
            best_score = score
            best_move = move

    return best_move
