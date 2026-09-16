import random
import json
from pathlib import Path

# Load extra move effects from move_effects.json if it exists.
_MOVE_EFFECTS_PATH = Path(__file__).resolve().parent / "data" / "move_effects.json"
try:
    with open(_MOVE_EFFECTS_PATH, "r", encoding="utf-8") as file:
        move_effects = json.load(file)
except FileNotFoundError:
    print(f"move_effects.json not found at {_MOVE_EFFECTS_PATH}; proceeding with empty move effects.")
    move_effects = {}

def get_move_category(move_type: str) -> str:
    type_categories = {
        'normal': 'physical',
        'fighting': 'physical',
        'flying': 'physical',
        'poison': 'physical',
        'ground': 'physical',
        'rock': 'physical',
        'bug': 'physical',
        'ghost': 'physical',
        'steel': 'physical',
        'fire': 'special',
        'water': 'special',
        'electric': 'special',
        'grass': 'special',
        'ice': 'special',
        'psychic': 'special',
        'dragon': 'special',
        'dark': 'special',
        'fairy': 'special'
    }
    return type_categories.get(move_type.lower(), 'physical')

def augment_move_data(move_data: dict) -> dict:
    """Merge move_effects.json extras into a move payload.

    Payloads often carry explicit ``None`` placeholders (e.g. status_effect),
    so treat None the same as missing — otherwise effects would never apply.
    """
    extra = move_effects.get(move_data.get("name"))
    if extra:
        for key, value in extra.items():
            if move_data.get(key) is None:
                move_data[key] = value
    if move_data.get("effect_type") is None:
        move_data["effect_type"] = "damage"
    return move_data

# In-memory type chart for effectiveness.
# Multipliers: 2.0 is super effective, 0.5 is not very effective, 0 means no effect.
type_chart = {
    "normal": {"rock": 0.5, "ghost": 0, "steel": 0.5},
    "fire": {"fire": 0.5, "water": 0.5, "grass": 2, "ice": 2, "bug": 2, "rock": 0.5, "dragon": 0.5, "steel": 2},
    "water": {"fire": 2, "water": 0.5, "grass": 0.5, "ground": 2, "rock": 2, "dragon": 0.5},
    "electric": {"water": 2, "electric": 0.5, "grass": 0.5, "ground": 0, "flying": 2, "dragon": 0.5},
    "grass": {"fire": 0.5, "water": 2, "grass": 0.5, "poison": 0.5, "ground": 2, "flying": 0.5, "bug": 0.5, "rock": 2, "dragon": 0.5, "steel": 0.5},
    "ice": {"fire": 0.5, "water": 0.5, "grass": 2, "ice": 0.5, "ground": 2, "flying": 2, "dragon": 2, "steel": 0.5},
    "fighting": {"normal": 2, "ice": 2, "rock": 2, "dark": 2, "steel": 2, "flying": 0.5, "poison": 0.5, "psychic": 0.5, "bug": 0.5, "ghost": 0},
    "poison": {"grass": 2, "poison": 0.5, "ground": 0.5, "rock": 0.5, "ghost": 0.5, "steel": 0},
    "ground": {"fire": 2, "electric": 2, "grass": 0.5, "poison": 2, "flying": 0, "bug": 0.5, "rock": 2, "steel": 2},
    "flying": {"electric": 0.5, "grass": 2, "fighting": 2, "bug": 2, "rock": 0.5, "steel": 0.5},
    "psychic": {"fighting": 2, "poison": 2, "psychic": 0.5, "dark": 0, "steel": 0.5},
    "bug": {"fire": 0.5, "grass": 2, "fighting": 0.5, "poison": 0.5, "flying": 0.5, "psychic": 2, "ghost": 0.5, "dark": 2, "steel": 0.5, "fairy": 0.5},
    "rock": {"fire": 2, "ice": 2, "fighting": 0.5, "ground": 0.5, "flying": 2, "bug": 2, "steel": 0.5},
    "ghost": {"normal": 0, "psychic": 2, "ghost": 2, "dark": 0.5},
    "dragon": {"dragon": 2, "steel": 0.5, "fairy": 0},
    "dark": {"fighting": 0.5, "psychic": 2, "ghost": 2, "dark": 0.5, "fairy": 0.5},
    "steel": {"fire": 0.5, "water": 0.5, "electric": 0.5, "ice": 2, "rock": 2, "steel": 0.5, "fairy": 2},
    "fairy": {"fighting": 2, "dragon": 2, "dark": 2, "fire": 0.5, "poison": 0.5, "steel": 0.5}
}

def get_type_effectiveness(attacking_type: str, defender_types: list) -> float:
    multiplier = 1.0
    for d_type in defender_types:
        type_multiplier = type_chart.get(attacking_type.lower(), {}).get(d_type.lower(), 1.0)
        multiplier *= type_multiplier
    return multiplier

# --- XP and Level-Up System Functions ---

def xp_needed_for_level(level: int) -> int:
    """Simple cubic formula for XP needed to reach a given level."""
    return level ** 3

def add_experience(stats: dict, xp_gained: int, increments: dict) -> dict:
    """
    Add experience points to a Pokémon and level up if needed.
    
    stats: dictionary with keys 'level', 'xp', 'xp_to_next', and stat values.
    xp_gained: XP earned.
    increments: dictionary with stat increments per level.
    """
    stats["xp"] += xp_gained
    # Level up until XP is less than the threshold.
    while stats["xp"] >= stats["xp_to_next"]:
        stats["xp"] -= stats["xp_to_next"]
        stats["level"] += 1
        stats["attack"] += increments.get("attack", 2)
        stats["defense"] += increments.get("defense", 2)
        stats["hp"] += increments.get("hp", 5)
        stats["speed"] += increments.get("speed", 1)
        stats["special_atk"] += increments.get("special_atk", 2)
        stats["special_def"] += increments.get("special_def", 2)
        stats["xp_to_next"] = xp_needed_for_level(stats["level"])
        print(f"Leveled up! Now level {stats['level']} (next level requires {stats['xp_to_next']} XP)")
    return stats
