"""Tests for pure combat helpers (Gen 3 fidelity: STAB, crit 2x, stages,
burn, abilities, move effects, priority turn order)."""
from __future__ import annotations

from unittest.mock import patch

import pytest

from app.combat import calculate_damage_result, determine_turn_order
from app.models import BattleRequest, Move, Pokemon

# Reference math (level 5, power 40, atk 50 / def 40, random factor 1.0):
# level_factor = (2*5)/5 + 2 = 4
# base = (4 * 40 * 1.25) / 50 + 2 = 6.0 -> STAB x1.5 = 9.0, crit x2 = 12.0


def _pokemon(**overrides) -> Pokemon:
    base = {
        "pokemon_id": 1,
        "nickname": "Testmon",
        "level": 5,
        "max_hp": 40,
        "current_hp": 40,
        "attack": 50,
        "defense": 40,
        "speed": 45,
        "special_atk": 50,
        "special_def": 40,
        "status": "Healthy",
        "types": ["normal"],
        "moves": [],
    }
    base.update(overrides)
    return Pokemon(**base)


def _move(**overrides) -> Move:
    base = {
        "move_id": 33,
        "name": "Tackle",
        "power": 40,
        "accuracy": 1.0,
        "move_type": "Normal",
        "pp": 35,
    }
    base.update(overrides)
    return Move(**base)


def _battle(attacker=None, defender=None, move=None) -> BattleRequest:
    return BattleRequest(
        attacker=attacker or _pokemon(),
        defender=defender or _pokemon(pokemon_id=2, nickname="Foe"),
        move=move or _move(),
    )


def _resolve(battle, rolls, uniform=1.0):
    """Run with deterministic random.random rolls and a fixed 0.85-1.0 factor."""
    with patch("app.combat.random.random", side_effect=rolls), patch(
        "app.combat.random.uniform", return_value=uniform
    ):
        return calculate_damage_result(battle)


# --- turn order --------------------------------------------------------------


def test_turn_order_faster_first():
    p1 = {"speed": 60}
    p2 = {"speed": 40}
    assert determine_turn_order(p1, p2)["first"] == "pokemon1"
    assert determine_turn_order(p2, p1)["first"] == "pokemon2"


def test_turn_order_tie():
    assert determine_turn_order({"speed": 50}, {"speed": 50})["first"] == "tie"


def test_turn_order_priority_beats_speed():
    slow = {"speed": 10}
    fast = {"speed": 90}
    assert determine_turn_order(slow, fast, priority1=1)["first"] == "pokemon1"
    assert (
        determine_turn_order(fast, slow, priority1=-6, priority2=0)["first"]
        == "pokemon2"
    )
    # Equal priority falls back to speed.
    assert (
        determine_turn_order(slow, fast, priority1=1, priority2=1)["first"]
        == "pokemon2"
    )


# --- core damage: STAB / crit / stages / burn --------------------------------


def test_miss():
    result = _resolve(_battle(move=_move(accuracy=0.5)), rolls=[0.9])
    assert result["result"] == "miss"
    assert result["damage"] == 0
    assert result["details"]["hit"] is False


def test_neutral_hit_no_stab():
    # Fire attacker using a Normal move: no STAB. Rolls: hit, crit(no).
    result = _resolve(
        _battle(attacker=_pokemon(types=["fire"])), rolls=[0.0, 0.9]
    )
    assert result["result"] == "hit"
    assert result["damage"] == pytest.approx(6.0)
    assert result["stab"] is False
    assert result["critical_hit"] is False


def test_stab_multiplies_1_5():
    # Normal attacker + Normal move -> x1.5.
    result = _resolve(_battle(), rolls=[0.0, 0.9])
    assert result["stab"] is True
    assert result["damage"] == pytest.approx(9.0)


def test_crit_is_2x():
    result = _resolve(
        _battle(attacker=_pokemon(types=["fire"])), rolls=[0.0, 0.0]
    )
    assert result["critical_hit"] is True
    assert result["damage"] == pytest.approx(12.0)


def test_gen3_floors_after_every_step_like_the_real_games():
    # Gen III (see https://bulbapedia.bulbagarden.net/wiki/Damage) floors
    # after EVERY step: floor(2*Level/5) first, then floor(base-before-/50),
    # then floor(.../50), then floor after each modifier multiply. Level 6
    # is chosen because 2*6/5 = 2.4 is non-integer, so continuous float math
    # (no intermediate flooring) silently overshoots the real games' number.
    #
    # True Gen III math (atk 50 / def 40 -> ratio 1.25, power 40, STAB):
    #   level_factor = floor(2*6/5) + 2      = floor(2.4) + 2 = 4
    #   step2        = floor(4 * 40 * 1.25)  = floor(200)     = 200
    #   step3        = floor(200 / 50)       = floor(4.0)     = 4
    #   base         = step3 + 2                              = 6
    #   STAB         = floor(6 * 1.5)                          = 9
    attacker = _pokemon(level=6, types=["normal"])
    result = _resolve(_battle(attacker=attacker), rolls=[0.0, 0.9])
    assert result["stab"] is True
    assert result["damage"] == pytest.approx(9.0)


def test_attack_stage_raises_damage():
    attacker = _pokemon(types=["fire"], stages={"atk": 2})
    # atk x2 -> ratio 2.5 -> base (4*40*2.5)/50 + 2 = 10
    result = _resolve(_battle(attacker=attacker), rolls=[0.0, 0.9])
    assert result["damage"] == pytest.approx(10.0)


def test_defense_stage_lowers_damage():
    defender = _pokemon(pokemon_id=2, nickname="Foe", stages={"def": 2})
    # def x2 -> ratio 0.625 -> base (4*40*0.625)/50 + 2 = 4
    result = _resolve(_battle(defender=defender), rolls=[0.0, 0.9])
    assert result["damage"] == pytest.approx(4.0 * 1.5)  # attacker keeps STAB


def test_burn_halves_physical_only():
    burned = _pokemon(types=["fire"], status="brn")
    physical = _resolve(_battle(attacker=burned), rolls=[0.0, 0.9])
    assert physical["damage"] == pytest.approx(4.0)  # atk 25 -> base 4

    special = _resolve(
        _battle(attacker=burned, move=_move(name="Water-gun", move_type="Water")),
        rolls=[0.0, 0.9],
    )
    assert special["damage"] == pytest.approx(6.0)  # special ignores burn


def test_accuracy_and_evasion_stages():
    # acc -6 -> hit chance 1/3; roll 0.5 misses.
    low_acc = _pokemon(stages={"acc": -6})
    assert _resolve(_battle(attacker=low_acc), rolls=[0.5])["result"] == "miss"

    # Defender eva +6 has the same effect...
    evasive = _pokemon(pokemon_id=2, nickname="Foe", stages={"eva": 6})
    assert _resolve(_battle(defender=evasive), rolls=[0.5])["result"] == "miss"

    # ...but Swift (always_hit) connects anyway. Rolls: crit only.
    swift = _move(move_id=129, name="Swift", power=60)
    result = _resolve(_battle(defender=evasive, move=swift), rolls=[0.9])
    assert result["result"] == "hit"
    assert result["damage"] > 0


# --- abilities ----------------------------------------------------------------


def test_levitate_blocks_ground_moves():
    defender = _pokemon(pokemon_id=2, nickname="Foe", ability="Levitate")
    quake = _move(move_id=89, name="Earthquake", power=100, move_type="Ground")
    result = _resolve(_battle(defender=defender, move=quake), rolls=[])
    assert result["result"] == "hit"
    assert result["damage"] == 0
    assert result["type_multiplier"] == 0.0


def test_pinch_ability_boosts_matching_type_at_low_hp():
    vine = _move(move_id=22, name="Vine-whip", power=45, move_type="Grass")
    healthy = _pokemon(ability={"id": 65, "name": "Overgrow"})
    low_hp = _pokemon(ability={"id": 65, "name": "Overgrow"}, current_hp=10)

    base = _resolve(_battle(attacker=healthy, move=vine), rolls=[0.0, 0.9])
    boosted = _resolve(_battle(attacker=low_hp, move=vine), rolls=[0.0, 0.9])
    # Gen III floors after every step (see test_gen3_floors_after_every_step_
    # like_the_real_games above): base = floor(floor(4*45*50/40)/50)+2 = 6
    # (no STAB: attacker is Normal-type, move is Grass).
    assert base["damage"] == pytest.approx(6.0)
    assert boosted["damage"] == pytest.approx(9.0)  # floor(6 * 1.5) Overgrow


def test_static_can_paralyze_physical_attacker():
    defender = _pokemon(pokemon_id=2, nickname="Foe", ability="Static")
    # Rolls: hit, crit(no), static (0.1 < 0.3 -> applies).
    result = _resolve(_battle(defender=defender), rolls=[0.0, 0.9, 0.1])
    assert result["attacker_status_applied"] == "par"

    # An already-statused attacker cannot be paralyzed again.
    burned = _pokemon(status="brn")
    result = _resolve(
        _battle(attacker=burned, defender=defender), rolls=[0.0, 0.9]
    )
    assert result["attacker_status_applied"] is None


# --- move effects (data-driven from move_effects.json) ------------------------


def test_recoil_and_drain_fractions_are_reported():
    take_down = _move(move_id=36, name="Take-down", power=90, accuracy=0.85)
    result = _resolve(_battle(move=take_down), rolls=[0.0, 0.9])
    assert result["recoil_fraction"] == pytest.approx(0.25)

    absorb = _move(move_id=71, name="Absorb", power=20, move_type="Grass")
    result = _resolve(_battle(move=absorb), rolls=[0.0, 0.9])
    assert result["drain_fraction"] == pytest.approx(0.5)


def test_multi_hit_rolls_accuracy_once_and_sums_hits():
    fury = _move(move_id=31, name="Fury-attack", power=15, accuracy=0.85)
    # Rolls: hit(0.0), hit-count(0.0 -> 2 hits), crit x2 (no).
    result = _resolve(_battle(move=fury), rolls=[0.0, 0.0, 0.9, 0.9])
    assert result["hits"] == 2
    # Gen III floors after every step: base = floor(floor(4*15*50/40)/50)+2
    # = floor(1.5)+2 = 3; STAB floor(3*1.5) = 4 per hit -> two hits = 8.
    assert result["damage"] == pytest.approx(8.0)

    # One accuracy roll gates the whole move.
    result = _resolve(_battle(move=fury), rolls=[0.9])
    assert result["result"] == "miss"


def test_pure_status_move_applies_major_status():
    wave = _move(move_id=86, name="Thunder-wave", power=0, accuracy=0.9,
                 move_type="Electric")
    # Rolls: hit, status chance.
    result = _resolve(_battle(move=wave), rolls=[0.0, 0.0])
    assert result["result"] == "status"
    assert result["status_effect_applied"] == "par"

    # Already statused -> "But it failed!"
    asleep = _pokemon(pokemon_id=2, nickname="Foe", status="slp")
    result = _resolve(_battle(defender=asleep, move=wave), rolls=[0.0])
    assert result["result"] == "failed"

    # Ground types are immune to Electric -> type-immune failure.
    grounded = _pokemon(pokemon_id=2, nickname="Foe", types=["ground"])
    result = _resolve(_battle(defender=grounded, move=wave), rolls=[])
    assert result["result"] == "failed"
    assert result["type_multiplier"] == 0.0


def test_stat_change_move_echoes_changes():
    growl = _move(move_id=45, name="Growl", power=0)
    result = _resolve(_battle(move=growl), rolls=[0.0])
    assert result["result"] == "status"
    assert result["stat_changes"] == [
        {"stat": "atk", "delta": -1, "target": "enemy"}
    ]


def test_secondary_status_respects_chance_and_type_immunity():
    ember = _move(move_id=52, name="Ember", power=40, move_type="Fire")
    # Rolls: hit, crit(no), status(0.05 < 0.1 -> burn).
    result = _resolve(_battle(move=ember), rolls=[0.0, 0.9, 0.05])
    assert result["status_effect_applied"] == "brn"

    # Chance not met.
    result = _resolve(_battle(move=ember), rolls=[0.0, 0.9, 0.5])
    assert result["status_effect_applied"] is None

    # Fire types cannot be burned (no status roll is consumed).
    fire_foe = _pokemon(pokemon_id=2, nickname="Foe", types=["fire"])
    result = _resolve(_battle(defender=fire_foe, move=ember), rolls=[0.0, 0.9])
    assert result["status_effect_applied"] is None
    assert result["details"]["status_blocked"] == "type_immune"


def test_ohko_level_gate_accuracy_and_damage():
    guillotine = _move(move_id=12, name="Guillotine", power=0, accuracy=0.3)

    higher = _pokemon(pokemon_id=2, nickname="Foe", level=6)
    assert (
        _resolve(_battle(defender=higher, move=guillotine), rolls=[])["result"]
        == "failed"
    )

    hit = _resolve(_battle(move=guillotine), rolls=[0.2])
    assert hit["result"] == "hit"
    assert hit["ohko"] is True
    assert hit["damage"] == pytest.approx(40.0)  # defender current HP

    assert _resolve(_battle(move=guillotine), rolls=[0.5])["result"] == "miss"


def test_struggle_is_typeless_with_recoil():
    struggle = Move(
        move_id=-1, name="Struggle", power=50, accuracy=1.0, move_type="Normal"
    )
    ghost = _pokemon(pokemon_id=2, nickname="Foe", types=["ghost"])
    # Rolls: crit only (always_hit skips accuracy).
    result = _resolve(_battle(defender=ghost, move=struggle), rolls=[0.9])
    assert result["result"] == "hit"
    assert result["type_multiplier"] == 1.0  # ignores Normal->Ghost immunity
    assert result["stab"] is False  # typeless: no STAB even for Normal types
    assert result["damage"] == pytest.approx(7.0)
    assert result["recoil_fraction"] == pytest.approx(0.25)


def test_heal_move_restores_fraction_of_max_hp():
    recover = _move(move_id=105, name="Recover", power=0, accuracy=1.0)
    hurt = _pokemon(current_hp=10)
    result = _resolve(_battle(attacker=hurt, move=recover), rolls=[0.0])
    assert result["result"] == "heal"
    assert result["heal_amount"] == pytest.approx(20.0)  # 50% of 40


def test_calculate_damage_hit_non_negative():
    battle = BattleRequest(
        attacker=_pokemon(),
        defender=_pokemon(pokemon_id=2, nickname="Foe"),
        move=_move(accuracy=1.0, power=40),
    )
    with patch("app.combat.random.random", return_value=0.0), patch(
        "app.combat.random.uniform", return_value=0.9
    ):
        result = calculate_damage_result(battle)
    assert result["result"] == "hit"
    assert result["damage"] >= 0
    assert "details" in result
