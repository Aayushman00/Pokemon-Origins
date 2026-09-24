"""Pure combat helpers used by HTTP routes and internal battle simulation.

Gen 3 (FireRed-style) fidelity, stateless by design:
- physical/special split by move type, STAB x1.5, crit 1/16 at x2.0,
  random factor 0.85-1.0, full type chart.
- stat stages (-6..+6) supplied by the caller on ``Pokemon.stages``:
  atk/def/spa/spd scale damage, acc/eva scale the hit roll. The engine never
  mutates stages; it only echoes requested ``stat_changes`` verdicts.
- burn halves physical attack.
- ability shortlist: Levitate (Ground immunity), Overgrow/Blaze/Torrent/Swarm
  (x1.5 on matching type at <=1/3 HP), Static (30% paralyze on physical hits).
- extra per-move behaviour comes from data/move_effects.json via
  ``augment_move_data``: multi_hit, status, heal, ohko, recoil, drain,
  stat_changes, always_hit, typeless.

The Node backend owns all battle state. Statuses/stages arrive on the request
and verdicts (status_effect_applied, attacker_status_applied, stat_changes,
recoil/drain fractions) are applied to session state by the caller.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List, Optional, Tuple

from .models import BattleRequest, Move
from .utils import (
    augment_move_data,
    get_move_category,
    get_type_effectiveness,
)

CRIT_RATE = 0.0625        # 1/16
CRIT_MULTIPLIER = 2.0     # Gen 3
STAB_MULTIPLIER = 1.5
STAGE_MIN, STAGE_MAX = -6, 6
OHKO_ACCURACY = 0.30      # flat Gen 3-ish approximation

# Pinch abilities: x1.5 on moves of the mapped type when HP <= 1/3.
PINCH_ABILITIES = {
    "overgrow": "grass",
    "blaze": "fire",
    "torrent": "water",
    "swarm": "bug",
}

# Types that cannot receive a given major status.
STATUS_TYPE_IMMUNITY = {
    "brn": {"fire"},
    "frz": {"ice"},
    "psn": {"poison", "steel"},
}

_LEGACY_STATUS_NAMES = {
    "burn": "brn",
    "paralysis": "par",
    "paralyze": "par",
    "poison": "psn",
    "sleep": "slp",
    "freeze": "frz",
}


def _move_to_dict(move: Move) -> dict:
    if hasattr(move, "model_dump"):
        return move.model_dump()
    return move.dict()


def clamp_stage(value: Any) -> int:
    try:
        stage = int(value or 0)
    except (TypeError, ValueError):
        stage = 0
    return max(STAGE_MIN, min(STAGE_MAX, stage))


def stage_multiplier(stage: int) -> float:
    """Gen 3 multiplier for atk/def/spa/spd/spe stages."""
    stage = clamp_stage(stage)
    return (2 + stage) / 2 if stage >= 0 else 2 / (2 - stage)


def accuracy_stage_multiplier(stage: int) -> float:
    """Gen 3 multiplier for the combined accuracy/evasion stage."""
    stage = clamp_stage(stage)
    return (3 + stage) / 3 if stage >= 0 else 3 / (3 - stage)


def _stages(pokemon: Any) -> Dict[str, int]:
    raw = getattr(pokemon, "stages", None) or {}
    return {
        key: clamp_stage(raw.get(key, 0))
        for key in ("atk", "def", "spa", "spd", "spe", "acc", "eva")
    }


def _ability_name(pokemon: Any) -> Optional[str]:
    raw = getattr(pokemon, "ability", None)
    if raw is None:
        return None
    if isinstance(raw, str):
        name = raw
    elif isinstance(raw, dict):
        name = raw.get("name")
    else:
        name = getattr(raw, "name", None)
    return str(name).strip().lower() if name else None


def normalize_status(value: Any) -> Optional[str]:
    if not value:
        return None
    code = str(value).strip().lower()
    if code in ("healthy", "none", "ok"):
        return None
    return _LEGACY_STATUS_NAMES.get(code, code)


def _has_major_status(pokemon: Any) -> bool:
    return normalize_status(getattr(pokemon, "status", None)) is not None


def determine_turn_order(
    pokemon1: dict,
    pokemon2: dict,
    priority1: int = 0,
    priority2: int = 0,
) -> Dict[str, str]:
    """Priority wins outright; ties fall back to (effective) speed; speed tie -> "tie"."""
    if priority1 != priority2:
        return {"first": "pokemon1" if priority1 > priority2 else "pokemon2"}
    if pokemon1["speed"] > pokemon2["speed"]:
        first = "pokemon1"
    elif pokemon1["speed"] < pokemon2["speed"]:
        first = "pokemon2"
    else:
        first = "tie"
    return {"first": first}


def _hit_check(battle: BattleRequest, move_dict: dict, details: Dict[str, Any]) -> bool:
    """One accuracy roll with Gen 3 acc/eva stages. Accuracy is a 0..1 fraction."""
    if move_dict.get("always_hit"):
        details["hit"] = True
        details["always_hit"] = True
        return True
    accuracy = move_dict.get("accuracy")
    if accuracy is None:
        details["hit"] = True
        return True
    combined_stage = clamp_stage(
        _stages(battle.attacker)["acc"] - _stages(battle.defender)["eva"]
    )
    chance = min(1.0, float(accuracy) * accuracy_stage_multiplier(combined_stage))
    hit_roll = random.random()
    details["hit_roll"] = hit_roll
    details["accuracy"] = accuracy
    details["accuracy_stage"] = combined_stage
    details["hit_chance"] = chance
    hit = hit_roll <= chance
    details["hit"] = hit
    return hit


def _type_multiplier(battle: BattleRequest, move_dict: dict) -> float:
    if move_dict.get("typeless"):
        return 1.0
    move_type = str(move_dict["move_type"]).lower()
    defender_types = battle.defender.types or ["normal"]
    if _ability_name(battle.defender) == "levitate" and move_type == "ground":
        return 0.0
    return get_type_effectiveness(move_type, defender_types)


def _stab(battle: BattleRequest, move_dict: dict) -> bool:
    if move_dict.get("typeless"):
        return False
    move_type = str(move_dict["move_type"]).lower()
    attacker_types = [str(t).lower() for t in (battle.attacker.types or [])]
    return move_type in attacker_types


def _ability_power_multiplier(battle: BattleRequest, move_dict: dict) -> float:
    """Overgrow/Blaze/Torrent/Swarm pinch boost."""
    if move_dict.get("typeless"):
        return 1.0
    ability = _ability_name(battle.attacker)
    boosted_type = PINCH_ABILITIES.get(ability or "")
    if not boosted_type:
        return 1.0
    if str(move_dict["move_type"]).lower() != boosted_type:
        return 1.0
    if battle.attacker.max_hp <= 0:
        return 1.0
    if battle.attacker.current_hp <= battle.attacker.max_hp / 3:
        return 1.5
    return 1.0


def _offense_defense(battle: BattleRequest, category: str) -> Tuple[float, float]:
    """Stats after stages; burn halves physical attack."""
    attacker_stages = _stages(battle.attacker)
    defender_stages = _stages(battle.defender)
    if category == "special":
        attack = battle.attacker.special_atk * stage_multiplier(attacker_stages["spa"])
        defense = battle.defender.special_def * stage_multiplier(defender_stages["spd"])
    else:
        attack = battle.attacker.attack * stage_multiplier(attacker_stages["atk"])
        if normalize_status(battle.attacker.status) == "brn":
            attack *= 0.5
        defense = battle.defender.defense * stage_multiplier(defender_stages["def"])
    return max(1.0, attack), max(1.0, defense)


def _single_hit_damage(
    battle: BattleRequest,
    move_dict: dict,
    category: str,
    type_multiplier: float,
    stab: bool,
    ability_multiplier: float,
) -> Dict[str, Any]:
    """One damage roll (own crit + random factor, per Gen 3 multi-hit rules).

    Gen III truncates (floors) after every single step of the calculation,
    not just once at the end (see https://bulbapedia.bulbagarden.net/wiki/Damage):
    the level factor, the base-damage division, and each modifier multiply
    (critical, random, STAB, type, and this engine's own ability bonus) are
    all floored in sequence. Doing the whole thing in continuous floats and
    rounding once at the end silently overshoots the real games' numbers
    whenever an intermediate value is non-integer.
    """
    attack, defense = _offense_defense(battle, category)
    attack = int(attack)
    defense = max(1, int(defense))

    level_factor = (2 * battle.attacker.level) // 5 + 2
    base_before_scale = (level_factor * move_dict["power"] * attack) // defense
    base_damage = base_before_scale // 50 + 2

    # Confusion self-hit damage is typeless AND cannot crit in the real games.
    crit = False if move_dict.get("no_crit") else random.random() < CRIT_RATE
    crit_multiplier = CRIT_MULTIPLIER if crit else 1.0
    stab_multiplier = STAB_MULTIPLIER if stab else 1.0
    random_factor = random.uniform(0.85, 1.0)

    # Gen III modifier order: Critical -> Random -> STAB -> Type -> Other,
    # flooring after every multiply.
    damage = base_damage
    damage = int(damage * crit_multiplier)
    damage = int(damage * random_factor)
    damage = int(damage * stab_multiplier)
    damage = int(damage * type_multiplier)
    damage = int(damage * ability_multiplier)

    return {
        "damage": float(damage),
        "critical_hit": crit,
        "base_damage": float(base_damage),
        "random_factor": random_factor,
    }


def _status_verdict(battle: BattleRequest, move_dict: dict, details: Dict[str, Any]) -> Optional[str]:
    """Decide whether this move statuses the defender (secondary or pure status)."""
    status = normalize_status(move_dict.get("status_effect"))
    if not status:
        return None
    if _has_major_status(battle.defender):
        details["status_blocked"] = "already_statused"
        return None
    immune_types = STATUS_TYPE_IMMUNITY.get(status, set())
    defender_types = {str(t).lower() for t in (battle.defender.types or [])}
    if immune_types & defender_types:
        details["status_blocked"] = "type_immune"
        return None
    chance = move_dict.get("effect_chance")
    chance = 1.0 if chance is None else float(chance)
    roll = random.random()
    details["status_roll"] = roll
    details["status_chance"] = chance
    return status if roll < chance else None


def _stat_changes_verdict(move_dict: dict, details: Dict[str, Any]) -> List[dict]:
    """Echo the move's stat changes when their (optional) chance passes."""
    changes = move_dict.get("stat_changes") or []
    if not changes:
        return []
    chance = move_dict.get("stat_change_chance")
    if chance is not None:
        roll = random.random()
        details["stat_change_roll"] = roll
        if roll >= float(chance):
            return []
    return [
        {
            "stat": change.get("stat"),
            "delta": int(change.get("delta", 0)),
            "target": change.get("target", "enemy"),
        }
        for change in changes
    ]


def _num_multi_hits(move_dict: dict, details: Dict[str, Any]) -> int:
    hit_range = move_dict.get("hit_range")
    if not (hit_range and len(hit_range) == 2):
        return 1
    min_hits, max_hits = int(hit_range[0]), int(hit_range[1])
    details["hit_range"] = [min_hits, max_hits]
    if (min_hits, max_hits) == (2, 5):
        # Gen 3 weights: 2 or 3 hits 37.5% each, 4 or 5 hits 12.5% each.
        roll = random.random()
        if roll < 0.375:
            num = 2
        elif roll < 0.75:
            num = 3
        elif roll < 0.875:
            num = 4
        else:
            num = 5
    else:
        num = random.randint(min_hits, max_hits)
    details["num_hits"] = num
    return num


def calculate_damage_result(battle: BattleRequest) -> Dict[str, Any]:
    """Resolve a single move's outcome (same contract as POST /calculate_damage/).

    Result kinds: "hit" (damage, possibly 0 on immunity), "miss", "failed"
    (OHKO level check / pure status that could not apply), "status" (pure
    status/stat move that connected), "heal" (self-heal move).
    """
    move_dict = augment_move_data(_move_to_dict(battle.move))
    details: Dict[str, Any] = {}
    effect_type = move_dict.get("effect_type", "damage")
    category = get_move_category(str(move_dict["move_type"]))

    # --- OHKO moves (Guillotine, Horn-drill, Fissure) -----------------------
    if effect_type == "ohko":
        if battle.defender.level > battle.attacker.level:
            details["reason"] = "ohko_level"
            return {"result": "failed", "damage": 0, "details": details}
        type_multiplier = _type_multiplier(battle, move_dict)
        if type_multiplier == 0:
            return {
                "result": "hit",
                "damage": 0,
                "category": category,
                "critical_hit": False,
                "stab": False,
                "type_multiplier": 0.0,
                "status_effect_applied": None,
                "details": details,
            }
        roll = random.random()
        details["hit_roll"] = roll
        details["accuracy"] = OHKO_ACCURACY
        if roll > OHKO_ACCURACY:
            details["hit"] = False
            return {"result": "miss", "damage": 0, "details": details}
        return {
            "result": "hit",
            "damage": float(battle.defender.current_hp),
            "category": category,
            "critical_hit": False,
            "stab": False,
            "type_multiplier": type_multiplier,
            "ohko": True,
            "status_effect_applied": None,
            "details": details,
        }

    # --- Self-heal moves (Recover, Softboiled) ------------------------------
    if effect_type == "heal":
        if not _hit_check(battle, move_dict, details):
            return {"result": "miss", "damage": 0, "details": details}
        heal_fraction = move_dict.get("heal_fraction")
        if heal_fraction is not None:
            heal_amount = round(battle.attacker.max_hp * float(heal_fraction), 2)
        else:
            # Legacy fallback: heal by move power with a small roll.
            heal_amount = round(
                (move_dict.get("power") or 0) * random.uniform(0.9, 1.0), 2
            )
        details["heal_amount"] = heal_amount
        return {
            "result": "heal",
            "heal_amount": heal_amount,
            "target": "self",
            "details": details,
        }

    # --- Disable (locks the target's last-used move; session tracks which
    # move that is, since this engine is stateless) -------------------------
    if effect_type == "disable":
        if not _hit_check(battle, move_dict, details):
            return {"result": "miss", "damage": 0, "details": details}
        return {
            "result": "status",
            "damage": 0,
            "disable_applied": True,
            "details": details,
        }

    # --- Pure status / stat-change moves ------------------------------------
    if effect_type == "status":
        # Volatile effects (confusion/attract) are mutually exclusive with
        # major-status/stat-change moves in move_effects.json and have no
        # type-immunity rule, so they short-circuit the rest of this branch.
        volatile = move_dict.get("volatile_effect")
        if volatile:
            if not _hit_check(battle, move_dict, details):
                return {"result": "miss", "damage": 0, "details": details}
            chance = move_dict.get("effect_chance")
            chance = 1.0 if chance is None else float(chance)
            roll = random.random()
            details["volatile_roll"] = roll
            details["volatile_chance"] = chance
            if roll >= chance:
                return {"result": "failed", "damage": 0, "details": details}
            return {
                "result": "status",
                "damage": 0,
                "status_effect_applied": None,
                "volatile_effect_applied": volatile,
                "stat_changes": [],
                "details": details,
            }

        type_multiplier = _type_multiplier(battle, move_dict)
        targets_enemy = bool(move_dict.get("status_effect")) or any(
            (change.get("target", "enemy") == "enemy")
            for change in (move_dict.get("stat_changes") or [])
        )
        if targets_enemy and type_multiplier == 0:
            # e.g. Thunder-wave vs Ground: "It doesn't affect ..."
            details["reason"] = "type_immune"
            return {
                "result": "failed",
                "damage": 0,
                "type_multiplier": 0.0,
                "details": details,
            }
        if not _hit_check(battle, move_dict, details):
            return {"result": "miss", "damage": 0, "details": details}
        status_applied = _status_verdict(battle, move_dict, details)
        stat_changes = _stat_changes_verdict(move_dict, details)
        if move_dict.get("status_effect") and not status_applied and not stat_changes:
            # Connected but had no possible effect (target already statused /
            # type-immune to the status): "But it failed!"
            return {"result": "failed", "damage": 0, "details": details}
        return {
            "result": "status",
            "damage": 0,
            "status_effect_applied": status_applied,
            "stat_changes": stat_changes,
            "details": details,
        }

    # --- Damaging moves ------------------------------------------------------
    move_power = move_dict.get("power")
    if not move_power:
        return {
            "result": "hit",
            "damage": 0,
            "category": category,
            "critical_hit": False,
            "stab": False,
            "type_multiplier": 1.0,
            "status_effect_applied": None,
            "details": {"reason": "Move has no power"},
        }

    type_multiplier = _type_multiplier(battle, move_dict)
    details["type_multiplier"] = type_multiplier
    if type_multiplier == 0:
        return {
            "result": "hit",
            "damage": 0,
            "category": category,
            "critical_hit": False,
            "stab": False,
            "type_multiplier": 0.0,
            "status_effect_applied": None,
            "details": details,
        }

    if not _hit_check(battle, move_dict, details):
        return {"result": "miss", "damage": 0, "details": details}

    stab = _stab(battle, move_dict)
    ability_multiplier = _ability_power_multiplier(battle, move_dict)
    details["stab"] = stab
    details["ability_multiplier"] = ability_multiplier

    num_hits = 1
    hit_details: List[float] = []
    if effect_type == "multi_hit":
        num_hits = _num_multi_hits(move_dict, details)

    total_damage = 0.0
    any_crit = False
    details["individual_hits"] = []
    for _ in range(num_hits):
        hit = _single_hit_damage(
            battle, move_dict, category, type_multiplier, stab, ability_multiplier
        )
        total_damage = round(total_damage + hit["damage"], 2)
        any_crit = any_crit or hit["critical_hit"]
        hit_details.append(hit["damage"])
        details["individual_hits"].append(hit)

    status_applied = _status_verdict(battle, move_dict, details)

    # Static: physical contact has a 30% chance to paralyze the attacker.
    attacker_status_applied = None
    if (
        category == "physical"
        and total_damage > 0
        and _ability_name(battle.defender) == "static"
        and not _has_major_status(battle.attacker)
    ):
        static_roll = random.random()
        details["static_roll"] = static_roll
        if static_roll < 0.3:
            attacker_status_applied = "par"

    stat_changes = _stat_changes_verdict(move_dict, details)

    # Secondary flinch (Bite/Stomp/Rock-slide family): only rolled on a hit
    # that actually dealt damage, same as every other secondary effect above.
    flinch_applied = False
    flinch_chance = move_dict.get("flinch_chance")
    if flinch_chance and total_damage > 0:
        flinch_roll = random.random()
        details["flinch_roll"] = flinch_roll
        flinch_applied = flinch_roll < float(flinch_chance)

    result: Dict[str, Any] = {
        "result": "hit",
        "damage": total_damage,
        "category": category,
        "critical_hit": any_crit,
        "stab": stab,
        "type_multiplier": type_multiplier,
        "status_effect_applied": status_applied,
        "attacker_status_applied": attacker_status_applied,
        "stat_changes": stat_changes,
        "flinch_applied": flinch_applied,
        "details": details,
    }
    if num_hits > 1 or effect_type == "multi_hit":
        result["hits"] = num_hits
        result["hit_details"] = hit_details
    if move_dict.get("recoil"):
        result["recoil_fraction"] = float(move_dict["recoil"])
    if move_dict.get("drain"):
        result["drain_fraction"] = float(move_dict["drain"])
    return result
