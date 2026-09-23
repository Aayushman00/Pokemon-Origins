import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api, getErrorMessage } from '../../api';
import { TYPE_COLORS } from '../../utils/typeColors';
import PokemonSprite from '../../components/PokemonSprite/PokemonSprite';
import BattlePokemonSprite from '../../components/PokemonSprite/BattlePokemonSprite';
import TrainerAvatar from '../../components/TrainerAvatar/TrainerAvatar';
import Shell from '../../components/Shell/Shell';
import LcdPanel from '../../components/Shell/LcdPanel';
import HpBox from './battle/HpBox';
import MoveMenu from './battle/MoveMenu';
import MessageLog from './battle/MessageLog';
import GbaControls from '../../components/Shell/GbaControls';
import './BattleGround.css';
import { slotStyle, shadowStyle } from './battleLayout';
import { useUser } from '../../App';
import { playerTrainerSprite } from '../../utils/trainerSprite';
import { getAnimState, ANIMATION_VARIANTS, getMoveAnimCategory } from './battleAnimation';

// Native stage size; fixed, never scaled
const STAGE_WIDTH = 808; // fills the GBA screen edge-to-edge (lcd-panel--fixed, .lcd-content padding zeroed for battle)
const STAGE_TOTAL_HEIGHT = 580; // stage only -- dev log now renders outside the GBA casing

// Gen 3 battle fidelity (Phase 14): client-side text for server events.
// The server log carries the same lines; the client re-derives them so the
// battle log stays in playback order with the animations.
const STATUS_APPLIED_TEXT = {
  brn: (name) => `${name} was burned!`,
  par: (name) => `${name} is paralyzed! It may be unable to move!`,
  psn: (name) => `${name} was poisoned!`,
  slp: (name) => `${name} fell asleep!`,
  frz: (name) => `${name} was frozen solid!`,
};
const CANT_MOVE_TEXT = {
  slp: (name) => `${name} is fast asleep.`,
  par: (name) => `${name} is paralyzed! It can't move!`,
  frz: (name) => `${name} is frozen solid!`,
};
const STATUS_END_TEXT = {
  slp: (name) => `${name} woke up!`,
  frz: (name) => `${name} thawed out!`,
};
const STATUS_HURT_TEXT = {
  brn: (name) => `${name} was hurt by its burn!`,
  psn: (name) => `${name} was hurt by poison!`,
};

const STAT_LABELS = {
  atk: 'ATTACK',
  def: 'DEFENSE',
  spa: 'SP. ATK',
  spd: 'SP. DEF',
  spe: 'SPEED',
  acc: 'accuracy',
  eva: 'evasiveness',
};

const statChangeText = ({ nickname, stat, delta, failed }) => {
  const label = STAT_LABELS[stat] || String(stat).toUpperCase();
  if (failed) {
    return delta > 0
      ? `${nickname}'s ${label} won't go any higher!`
      : `${nickname}'s ${label} won't go any lower!`;
  }
  const sharply = Math.abs(delta) >= 2 ? ' sharply' : '';
  return delta > 0
    ? `${nickname}'s ${label} rose${sharply}!`
    : `${nickname}'s ${label} fell${sharply}!`;
};

// BRN/PAR/PSN/SLP/FRZ chip shown next to names (HP boxes + party rows)
const StatusBadge = ({ status }) =>
  status ? (
    <span className={`gba-status-badge status-${status}`}>
      {String(status).toUpperCase()}
    </span>
  ) : null;

// Synthetic Struggle action (server validates that PP really is out)
const STRUGGLE_MOVE = { move_id: -1, name: 'Struggle', move_type: 'Normal' };

/**
 * Thin client of the server battle session (Phase 3, party-aware since
 * Phase 4). The backend owns HP/turn order/winner/party state; this
 * component only sends { sessionId, action } where action is
 * { type: 'move', moveId } or { type: 'switch', partyPosition } and
 * animates the server-returned events.
 */
const BattleSim = ({
  levelNumber,
  battleNumber,
  onBattleWon,
  onContinue,
}) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { user } = useUser();

  // Server session + displayed battle state (HP animates beat-by-beat)
  const [session, setSession] = useState(null);
  const [userPokemon, setUserPokemon] = useState(null);
  const [trainerPokemon, setTrainerPokemon] = useState(null);
  const [battleOutcome, setBattleOutcome] = useState(null);
  const [activeBeatLines, setActiveBeatLines] = useState([]);
  const messageQueueRef = useRef([]);
  const messageTimerRef = useRef(null);
  const [error, setError] = useState('');
  const [selectedMove, setSelectedMove] = useState(null);
  const [hoveredMove, setHoveredMove] = useState(null);
  // D-pad/A/B cursor for the command menu, move grid, and restart confirm --
  // index into that phase's option list (2x2 grid or YES/NO pair).
  const [menuCursor, setMenuCursor] = useState(0);
  const [opponentMove, setOpponentMove] = useState(null);
  const [progressSave, setProgressSave] = useState('idle'); // idle | saving | saved | error
  const [progressError, setProgressError] = useState('');
  const [xpSummary, setXpSummary] = useState([]); // server XP/level-up lines shown on the win screen
  const [bagItems, setBagItems] = useState([]); // battle-usable inventory (server-fetched on BAG)

  // Battle beat state machine:
  // encounter → intro → command ↔ (moveSelect | partySelect | restartConfirm) → acting →
  // (command | partySelect on forced switch | finished)
  // restartConfirm → restarting (once YES is confirmed; blocks re-entry and
  // double-fires while the forced restart request is in flight) → encounter
  // (via startEncounter, once the fresh session loads) → intro → command
  const [uiPhase, setUiPhase] = useState('encounter');
  const [currentTurn, setCurrentTurn] = useState('none'); // 'player' | 'enemy' | 'none'

  // Per-beat animation flags
  const [playerAttacking, setPlayerAttacking] = useState(false);
  const [enemyAttacking, setEnemyAttacking] = useState(false);
  const [playerDamageEffect, setPlayerDamageEffect] = useState(false);
  const [enemyDamageEffect, setEnemyDamageEffect] = useState(false);
  const [playerFainted, setPlayerFainted] = useState(false);
  const [enemyFainted, setEnemyFainted] = useState(false);
  const [playerCritical, setPlayerCritical] = useState(false);
  const [enemyCritical, setEnemyCritical] = useState(false);
  const [hitFlash, setHitFlash] = useState(null); // type-tinted overlay color
  const [criticalFlash, setCriticalFlash] = useState(false); // white double-pulse accent, crits only
  const [rangedFlash, setRangedFlash] = useState(null); // ranged-move projectile flash, tinted by type
  const [statusSparkle, setStatusSparkle] = useState(false); // status/heal move accent on the user

  const battleSoundRef = useRef(null);
  const timersRef = useRef([]);
  const sessionIdRef = useRef(null);

  // Collapse beat waits under reduced motion (state updates still happen)
  const motionMs = (ms) => (reduceMotion ? 0 : ms);
  const wait = (ms) => new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    timersRef.current.push(t);
  });

  // Encounter flash + pokéball throw, then intro slides, then command menu
  // (or the forced party panel when resuming mid-switch)
  const startEncounter = (needsSwitch = false) => {
    setUiPhase('encounter');
    const introAt = reduceMotion ? 0 : 2200;
    const commandAt = introAt + (reduceMotion ? 0 : 1100);
    timersRef.current.push(
      setTimeout(() => setUiPhase('intro'), introAt),
      setTimeout(() => {
        if (needsSwitch) {
          setUiPhase('partySelect');
          addLog('Choose your next Pokémon!');
        } else {
          setUiPhase('command');
          addLog('Battle started!');
        }
      }, commandAt)
    );
  };

  // Create/resume the server session; snapshots become the UI truth
  const startBattle = async (force = false) => {
    try {
      const { data } = await api.post('/api/battle/start', {
        level: levelNumber,
        battleNumber,
        ...(force ? { force: true } : {}),
      });
      if (!data?.success || !data.state) {
        throw new Error(data?.error || 'Failed to start battle');
      }
      sessionIdRef.current = data.state.sessionId;
      setSession(data.state);
      setUserPokemon(data.state.player);
      setTrainerPokemon(data.state.enemy);
      setPlayerFainted(data.state.player.current_hp <= 0);
      setEnemyFainted(false);
      setXpSummary([]);
      setError('');
      // First log line anchors the fight: level, battle number, and the
      // opponent (trainer name is text only — no trainer art).
      addLog(
        data.state.battleType === 'legendary'
          ? `Level ${levelNumber} · Battle ${battleNumber} — a wild ${data.state.enemy.nickname}!`
          : `Level ${levelNumber} · Battle ${battleNumber} — vs ${
              data.state.trainerName || 'Trainer'
            }`
      );
      startEncounter(!!data.state.requiresSwitch);
    } catch (err) {
      console.error('Error starting battle:', err.response || err.message);
      setError(getErrorMessage(err, 'Error starting battle'));
    }
  };

  useEffect(() => {
    startBattle();
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelNumber, battleNumber]);

  // Reset the D-pad cursor to the first option whenever a cursor-driven
  // screen (command menu / move grid / restart confirm) opens.
  useEffect(() => {
    setMenuCursor(0);
  }, [uiPhase]);

  // D-pad + A/B keyboard control for the command menu, move grid, and
  // restart confirm. Command menu is the floor for B (Ruling: never exits
  // the battle or navigates away from it).
  useEffect(() => {
    const cursorPhases = ['command', 'moveSelect', 'restartConfirm'];
    if (!cursorPhases.includes(uiPhase)) return undefined;

    const onKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (uiPhase === 'restartConfirm') {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            setMenuCursor((c) => (c === 0 ? 1 : 0));
          }
          return;
        }
        setMenuCursor((c) => {
          const next = moveCursorInGrid(c, e.key);
          if (uiPhase === 'moveSelect' && !session?.mustStruggle && !gridMoves()[next]) return c;
          return next;
        });
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'Enter') {
        e.preventDefault();
        confirmMenuCursor();
      } else if (e.key === 'b' || e.key === 'B' || e.key === 'Escape') {
        e.preventDefault();
        pressBackButton();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiPhase, menuCursor, session?.mustStruggle]);

  // Play sound effects; missing files must never break the battle
  const playSound = (soundType) => {
    if (!battleSoundRef.current) return;
    const sources = {
      select: '/sounds/select.wav',
      attack: '/sounds/attack.wav',
      damage: '/sounds/damage.wav',
      victory: '/sounds/victory.wav',
      defeat: '/sounds/defeat.wav',
    };
    const src = sources[soundType];
    if (!src) return;
    try {
      battleSoundRef.current.pause();
      battleSoundRef.current.src = src;
      battleSoundRef.current
        .play()
        .catch((e) => console.warn('Audio unavailable:', e?.message || e));
    } catch (e) {
      console.warn('Audio unavailable:', e?.message || e);
    }
  };

  // Drains messageQueueRef one at a time, pacing the in-game dialog box
  // independently of however many times addLog was called back-to-back
  // (React 18 batches synchronous setState calls, so without this a
  // multi-message beat like "dealt damage" + "critical hit" + "super
  // effective" would silently collapse to only the last message -- see
  // Phase 8 plan Ruling 2).
  const flushNextMessage = () => {
    if (messageQueueRef.current.length === 0) {
      messageTimerRef.current = null;
      return;
    }
    const next = messageQueueRef.current.shift();
    setActiveBeatLines((prev) => [...prev, next]);
    messageTimerRef.current = setTimeout(flushNextMessage, motionMs(600));
    timersRef.current.push(messageTimerRef.current);
  };

  const addLog = (message) => {
    messageQueueRef.current.push(message);
    if (!messageTimerRef.current) {
      flushNextMessage();
    }
  };

  // Brief type-tinted flash over the stage on a landed hit
  const triggerHitFlash = (moveType) => {
    if (reduceMotion) return;
    const typeKey = String(moveType || '').toLowerCase();
    setHitFlash(TYPE_COLORS[typeKey] || '#ffffff');
    timersRef.current.push(setTimeout(() => setHitFlash(null), 280));
  };

  // Extra white double-pulse accent layered on top of the normal hit flash,
  // critical hits only (spec Section 6: "sharper shake + a brief screen-flash accent").
  const triggerCriticalFlash = () => {
    if (reduceMotion) return;
    setCriticalFlash(true);
    timersRef.current.push(setTimeout(() => setCriticalFlash(false), 220));
  };

  const triggerRangedFlash = (moveType) => {
    if (reduceMotion) return;
    const typeKey = String(moveType || '').toLowerCase();
    setRangedFlash(TYPE_COLORS[typeKey] || '#ffffff');
    timersRef.current.push(setTimeout(() => setRangedFlash(null), 350));
  };

  const triggerStatusSparkle = () => {
    if (reduceMotion) return;
    setStatusSparkle(true);
    timersRef.current.push(setTimeout(() => setStatusSparkle(false), 500));
  };

  const logEffectiveness = (event, defenderName) => {
    if (event.critical_hit) addLog('A critical hit!');
    const mult = event.type_multiplier;
    if (typeof mult !== 'number') return;
    if (mult === 0) addLog(`It doesn't affect ${defenderName}...`);
    else if (mult > 1) addLog("It's super effective!");
    else if (mult < 1) addLog("It's not very effective...");
  };

  // Fetch the server inventory and open the bag panel (battle-usable items)
  const openBag = async () => {
    try {
      const { data } = await api.get('/api/inventory');
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to load the bag');
      }
      const usable = (data.items || []).filter(
        (item) => item.usableInBattle && item.quantity > 0
      );
      if (!usable.length) {
        addLog('Your bag has no battle items!');
        return;
      }
      setBagItems(usable);
      setUiPhase('bagSelect');
    } catch (err) {
      console.error('Failed to load inventory:', err.response || err.message);
      addLog(getErrorMessage(err, 'Could not open the bag'));
    }
  };

  // Handle main menu selection (FIGHT, BAG and POKéMON are implemented)
  const handleMainMenuSelection = (action) => {
    playSound('select');
    if (action === 'FIGHT') {
      setUiPhase('moveSelect');
    } else if (action === 'BAG') {
      openBag();
    } else if (action === 'POKEMON') {
      if ((session?.party?.length || 0) > 1) {
        setUiPhase('partySelect');
      } else {
        addLog('You have no other Pokémon!');
      }
    } else if (action === 'RESTART') {
      setUiPhase('restartConfirm');
    }
  };

  const confirmRestart = (confirmed) => {
    playSound('select');
    if (confirmed) {
      restartBattle();
    } else {
      setUiPhase('command');
    }
  };

  // Prepare a 2x2 grid of moves; fill with null if fewer than 4 moves exist
  const gridMoves = () => {
    const moves = userPokemon?.moves || [];
    const grid = [];
    for (let i = 0; i < 4; i++) {
      grid.push(i < moves.length ? moves[i] : null);
    }
    return grid;
  };

  // D-pad cursor within a 2x2 option grid (command menu / move grid) --
  // arrows toggle row/col, wrapping like the original games' menus.
  const moveCursorInGrid = (cursor, key) => {
    const row = Math.floor(cursor / 2);
    const col = cursor % 2;
    if (key === 'ArrowLeft' || key === 'ArrowRight') return row * 2 + (1 - col);
    if (key === 'ArrowUp' || key === 'ArrowDown') return (1 - row) * 2 + col;
    return cursor;
  };

  // A: confirm whatever the arrow cursor is currently on.
  const confirmMenuCursor = () => {
    if (uiPhase === 'command') {
      const actions = ['FIGHT', 'BAG', 'POKEMON', 'RESTART'];
      handleMainMenuSelection(actions[menuCursor]);
    } else if (uiPhase === 'moveSelect') {
      if (session?.mustStruggle) {
        handleSelectMove(STRUGGLE_MOVE);
        return;
      }
      const move = gridMoves()[menuCursor];
      if (!move) return;
      if (typeof move.current_pp === 'number' && move.current_pp <= 0) return;
      handleSelectMove(move);
    } else if (uiPhase === 'restartConfirm') {
      confirmRestart(menuCursor === 0);
    }
  };

  // B: back one screen. Command menu is the floor -- never leaves the battle.
  const pressBackButton = () => {
    if (uiPhase === 'moveSelect') {
      playSound('select');
      setUiPhase('command');
    } else if (uiPhase === 'restartConfirm') {
      confirmRestart(false);
    }
  };

  // Animate one server event with the existing lunge/flash/HP/faint beats.
  // `view` tracks the currently displayed player/enemy through the event
  // sequence — a switch event swaps view.player mid-round, so later beats
  // use the right names and sprites.
  const playEvent = async (event, view) => {
    if (event.type === 'switch') {
      setCurrentTurn('none');
      view.player = { ...event.pokemon };
      setPlayerDamageEffect(false);
      setPlayerFainted(false);
      setUserPokemon(event.pokemon);
      addLog(`Go! ${event.pokemon.nickname}!`);
      playSound('select');
      await wait(motionMs(600));
      return;
    }

    // Phase 10: the fainted enemy's trainer sends the next party member.
    // The faint beat already played; swap in the fresh mon (Pokéball →
    // Pokémon presentation only, no trainer sprite).
    if (event.type === 'enemy_send') {
      setCurrentTurn('none');
      const previousPosition = view.enemy.position;
      view.enemy = { ...event.pokemon };
      // Patch the session snapshot so the enemy party dots stay truthful
      // mid-playback (the full state re-sync lands after all events).
      setSession((prev) =>
        prev
          ? {
              ...prev,
              enemyParty: (prev.enemyParty || []).map((mon) =>
                mon.position === previousPosition
                  ? { ...mon, current_hp: 0 }
                  : mon
              ),
              enemyActivePosition: event.position,
            }
          : prev
      );
      setEnemyDamageEffect(false);
      setEnemyFainted(false);
      setTrainerPokemon(event.pokemon);
      addLog(`${session?.trainerName || 'The trainer'} sent out ${event.pokemon.nickname}!`);
      playSound('select');
      await wait(motionMs(900));
      return;
    }

    // Item beat (Phase 7): text + HP tick; the enemy's counter beat follows
    // as its own event. Bench heals only log — party HP re-syncs from the
    // final authoritative state.
    if (event.type === 'item') {
      setCurrentTurn('none');
      addLog(`Used ${event.itemName}! ${event.nickname} recovered ${event.amount} HP.`);
      playSound('select');
      if (view.player.position === event.position) {
        view.player = { ...view.player, current_hp: event.targetHpAfter };
        setUserPokemon((prev) => ({ ...prev, current_hp: event.targetHpAfter }));
      }
      await wait(motionMs(700));
      return;
    }

    // Post-win XP/level-up beats (server-computed; text only)
    if (event.type === 'xp_gain') {
      addLog(`${event.nickname} gained ${event.amount} XP!`);
      await wait(motionMs(500));
      return;
    }
    // Post-win coin award (Phase 8; server-computed, text only)
    if (event.type === 'coins') {
      addLog(`Got ${event.amount} coins!`);
      await wait(motionMs(500));
      return;
    }
    if (event.type === 'level_up') {
      addLog(`${event.nickname} grew to Lv ${event.level}!`);
      setUserPokemon((prev) =>
        prev && prev.nickname === event.nickname ? { ...prev, level: event.level } : prev
      );
      await wait(motionMs(600));
      return;
    }
    // Phase 9: the new level meets an evolution rule — confirm on the hub
    if (event.type === 'evolution_available') {
      addLog(`${event.nickname} can now evolve!`);
      await wait(motionMs(600));
      return;
    }
    // Move learning: a free slot learned it right away (text only)…
    if (event.type === 'move_learned') {
      addLog(`${event.nickname} learned ${event.moveName}!`);
      playSound('select');
      await wait(motionMs(600));
      return;
    }
    // …or all 4 slots are taken — the forget-or-skip decision lives on
    // the hub (pending offer survives refresh).
    if (event.type === 'move_learn_available') {
      addLog(`${event.nickname} wants to learn ${event.moveName}!`);
      await wait(motionMs(600));
      return;
    }

    // ---- Gen 3 fidelity events (Phase 14) -------------------------------
    // Helper keyed by the affected side ('player' | 'enemy').
    const patchSide = (side, patch) => {
      if (side === 'player') {
        view.player = { ...view.player, ...patch };
        setUserPokemon((prev) => (prev ? { ...prev, ...patch } : prev));
      } else {
        view.enemy = { ...view.enemy, ...patch };
        setTrainerPokemon((prev) => (prev ? { ...prev, ...patch } : prev));
      }
    };

    // Silent PP tick (keeps the FIGHT grid truthful mid-round)
    if (event.type === 'pp_change') {
      if (event.actor === 'player') {
        const patchMoves = (moves) =>
          (moves || []).map((m) =>
            m.move_id === event.moveId ? { ...m, current_pp: event.currentPp } : m
          );
        view.player = { ...view.player, moves: patchMoves(view.player.moves) };
        setUserPokemon((prev) =>
          prev ? { ...prev, moves: patchMoves(prev.moves) } : prev
        );
      }
      return;
    }

    // Sleep/paralysis/freeze blocked the whole beat
    if (event.type === 'cant_move') {
      setCurrentTurn('none');
      const line = CANT_MOVE_TEXT[event.status] || ((n) => `${n} can't move!`);
      addLog(line(event.nickname));
      await wait(motionMs(700));
      return;
    }

    // A major status landed (from a move's effect or an ability like Static)
    if (event.type === 'status_applied') {
      const line = STATUS_APPLIED_TEXT[event.status] || ((n) => `${n} was afflicted!`);
      addLog(line(event.nickname));
      patchSide(event.target, { status: event.status });
      await wait(motionMs(600));
      return;
    }

    // Woke up / thawed out (also via a Fire-type hit)
    if (event.type === 'status_end') {
      const line = STATUS_END_TEXT[event.status] || ((n) => `${n} returned to normal!`);
      addLog(line(event.nickname));
      patchSide(event.target, { status: null });
      await wait(motionMs(500));
      return;
    }

    // End-of-round burn/poison chip (can faint)
    if (event.type === 'status_damage') {
      const side = event.target;
      const line = STATUS_HURT_TEXT[event.status] || ((n) => `${n} was hurt!`);
      addLog(line(event.nickname));
      const setDamageFx = side === 'player' ? setPlayerDamageEffect : setEnemyDamageEffect;
      setDamageFx(true);
      playSound('damage');
      patchSide(side, { current_hp: event.targetHpAfter });
      await wait(motionMs(500));
      setDamageFx(false);
      if (event.targetFainted) {
        const setFaint = side === 'player' ? setPlayerFainted : setEnemyFainted;
        setFaint(true);
        addLog(`${event.nickname} fainted!`);
        playSound(side === 'player' ? 'defeat' : 'victory');
        await wait(motionMs(700));
      }
      return;
    }

    // Stat stage rose/fell (or clamped at ±6: "won't go any higher!")
    if (event.type === 'stat_change') {
      addLog(statChangeText(event));
      await wait(motionMs(450));
      return;
    }

    // Recoil damage to the attacker (Take-down family, Struggle)
    if (event.type === 'recoil') {
      const side = event.target;
      addLog(`${event.nickname} is damaged by recoil!`);
      const setDamageFx = side === 'player' ? setPlayerDamageEffect : setEnemyDamageEffect;
      setDamageFx(true);
      playSound('damage');
      patchSide(side, { current_hp: event.hpAfter });
      await wait(motionMs(500));
      setDamageFx(false);
      if (event.targetFainted) {
        const setFaint = side === 'player' ? setPlayerFainted : setEnemyFainted;
        setFaint(true);
        addLog(`${event.nickname} fainted!`);
        playSound(side === 'player' ? 'defeat' : 'victory');
        await wait(motionMs(700));
      }
      return;
    }

    // HP drained from the defender (Absorb family)
    if (event.type === 'drain') {
      addLog(`${event.nickname} drained energy!`);
      patchSide(event.target, { current_hp: event.hpAfter });
      await wait(motionMs(500));
      return;
    }

    // Self-heal move (Recover / Soft-boiled)
    if (event.type === 'heal_move') {
      addLog(`${event.nickname} regained health!`);
      patchSide(event.target, { current_hp: event.hpAfter });
      await wait(motionMs(500));
      return;
    }

    const isPlayer = event.actor === 'player';
    const attackerName = isPlayer ? view.player.nickname : view.enemy.nickname;
    const defenderName = isPlayer ? view.enemy.nickname : view.player.nickname;

    setCurrentTurn(isPlayer ? 'player' : 'enemy');
    addLog(`${attackerName} used ${event.moveName}!`);
    if (!isPlayer) {
      setOpponentMove({ name: event.moveName });
      await wait(motionMs(700)); // telegraph beat
    }

    const isStatusLike = event.result === 'status' || event.result === 'heal';
    const category = getMoveAnimCategory(event.moveType);
    const setAttacking = isPlayer ? setPlayerAttacking : setEnemyAttacking;

    if (isStatusLike) {
      triggerStatusSparkle();
      playSound('attack');
      await wait(motionMs(400));
    } else if (category === 'physical') {
      setAttacking(true);
      playSound('attack');
      await wait(motionMs(500));
      setAttacking(false);
    } else {
      playSound('attack');
      await wait(motionMs(200));
      triggerRangedFlash(event.moveType);
      await wait(motionMs(300));
    }
    if (!isPlayer) {
      timersRef.current.push(setTimeout(() => setOpponentMove(null), 1500));
    }

    if (event.result === 'miss') {
      addLog(`${attackerName}'s attack missed!`);
      await wait(motionMs(400));
      return;
    }

    // OHKO level check / status move with no possible effect
    if (event.result === 'failed') {
      addLog(
        event.type_multiplier === 0
          ? `It doesn't affect ${defenderName}...`
          : 'But it failed!'
      );
      await wait(motionMs(400));
      return;
    }

    // Pure status/stat move connected: its outcome arrives as separate
    // status_applied / stat_change events right after this one.
    if (event.result === 'status') {
      await wait(motionMs(200));
      return;
    }

    // Self-heal move: the heal_move event that follows carries the HP tick.
    if (event.result === 'heal') {
      await wait(motionMs(200));
      return;
    }

    triggerHitFlash(event.moveType);
    if (event.critical_hit) triggerCriticalFlash();
    const setDamageEffect = isPlayer ? setEnemyDamageEffect : setPlayerDamageEffect;
    const setDefender = isPlayer ? setTrainerPokemon : setUserPokemon;
    if (isPlayer) view.enemy = { ...view.enemy, current_hp: event.targetHpAfter };
    else view.player = { ...view.player, current_hp: event.targetHpAfter };
    const setCritical = isPlayer ? setEnemyCritical : setPlayerCritical;
    setDamageEffect(true);
    setCritical(!!event.critical_hit);
    playSound('damage');
    setDefender((prev) => ({ ...prev, current_hp: event.targetHpAfter }));
    await wait(motionMs(600));
    setDamageEffect(false);
    setCritical(false);

    addLog(`${attackerName} dealt ${event.damage} damage!`);
    if (event.hits > 1) addLog(`Hit ${event.hits} time(s)!`);
    if (event.ohko) addLog("It's a one-hit KO!");
    logEffectiveness(event, defenderName);

    if (event.targetFainted) {
      await wait(motionMs(300));
      const setFainted = isPlayer ? setEnemyFainted : setPlayerFainted;
      setFainted(true);
      addLog(`${defenderName} fainted!`);
      playSound(isPlayer ? 'victory' : 'defeat');
      await wait(motionMs(700));
    }
  };

  const finishBattle = (state, progress) => {
    if (state.status === 'won') {
      setBattleOutcome({ outcome: 'win', winner: state.player.nickname });
      if (progress) {
        setProgressSave('saved');
        if (onBattleWon) onBattleWon(progress);
      } else {
        // Server session is won but the award did not land; the gated
        // complete-battle endpoint is the recovery path.
        setProgressSave('error');
        setProgressError('Could not save progress');
      }
    } else {
      setBattleOutcome({ outcome: 'lose', winner: state.enemy.nickname });
    }
    setUiPhase('finished');
  };

  // One full round resolved by the server; the client only sends the action
  const resolveServerAction = async (action) => {
    setUiPhase('acting');
    setError('');

    try {
      const { data } = await api.post('/api/battle/action', {
        sessionId: sessionIdRef.current,
        action,
      });
      if (!data?.success || !data.state) {
        throw new Error(data?.error || 'Battle action failed');
      }

      const view = { player: { ...userPokemon }, enemy: { ...trainerPokemon } };
      for (const event of data.events || []) {
        await playEvent(event, view);
      }

      // Keep the server's XP/level-up/coin/move lines for the win screen
      const rewardLines = (data.events || [])
        .filter(
          (e) =>
            e.type === 'xp_gain' ||
            e.type === 'level_up' ||
            e.type === 'coins' ||
            e.type === 'evolution_available' ||
            e.type === 'move_learned' ||
            e.type === 'move_learn_available'
        )
        .map((e) =>
          e.type === 'xp_gain'
            ? `${e.nickname} gained ${e.amount} XP!`
            : e.type === 'level_up'
            ? `${e.nickname} grew to Lv ${e.level}!`
            : e.type === 'evolution_available'
            ? `${e.nickname} can now evolve! (see hub)`
            : e.type === 'move_learned'
            ? `${e.nickname} learned ${e.moveName}!`
            : e.type === 'move_learn_available'
            ? `${e.nickname} wants to learn ${e.moveName}! (choose on the hub)`
            : `Got ${e.amount} coins!`
        );
      if (rewardLines.length) setXpSummary(rewardLines);

      // Sync displayed state to the authoritative snapshot
      setSession(data.state);
      setUserPokemon(data.state.player);
      setTrainerPokemon(data.state.enemy);
      setCurrentTurn('none');
      setSelectedMove(null);
      setHoveredMove(null);
      // Drop any messages the queue hasn't painted yet (e.g. a multi-line
      // damage beat that outlasted this round's own animation timing) so a
      // stale queued line can't overwrite "What will X do?" after control
      // has already returned to the player.
      messageQueueRef.current = [];
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
      setActiveBeatLines([]);

      if (data.state.status === 'active') {
        if (data.state.requiresSwitch) {
          setUiPhase('partySelect');
        } else {
          setUiPhase('command');
        }
      } else {
        finishBattle(data.state, data.progress);
      }
    } catch (err) {
      console.error('Battle action failed:', err.response || err.message);
      const message = getErrorMessage(err, 'Error resolving battle action');
      if (err.response?.status === 400) {
        // Recoverable rule rejection (full HP, no stock, invalid target):
        // log it and hand the menu back instead of a hard error screen.
        addLog(message);
        setUiPhase(session?.requiresSwitch ? 'partySelect' : 'command');
      } else {
        setError(message);
      }
    }
  };

  const handleSelectMove = async (move) => {
    if (!move || uiPhase === 'acting') return;
    playSound('select');
    setSelectedMove(move);
    await resolveServerAction({ type: 'move', moveId: move.move_id });
  };

  const handleSelectSwitch = async (mon) => {
    if (uiPhase === 'acting') return;
    playSound('select');
    await resolveServerAction({ type: 'switch', partyPosition: mon.position });
  };

  // Battle item use targets the active Pokémon (the server also accepts a
  // bench partyPosition; the UI keeps Gen-style simplicity for now).
  const handleSelectItem = async (item) => {
    if (uiPhase === 'acting') return;
    playSound('select');
    await resolveServerAction({ type: 'item', itemId: item.itemId });
  };

  // Recovery path when the win did not persist progress (session-gated)
  const retryProgressAward = async () => {
    setProgressSave('saving');
    setProgressError('');
    try {
      const { data } = await api.post('/api/campaign/progress/complete-battle', {
        level: levelNumber,
        battleNumber,
      });
      if (!data?.success || !data.progress) {
        throw new Error(data?.error || 'Failed to save progress');
      }
      setProgressSave('saved');
      if (onBattleWon) onBattleWon(data.progress);
    } catch (err) {
      console.error('Failed to save campaign progress:', err);
      setProgressSave('error');
      setProgressError(getErrorMessage(err, 'Could not save progress'));
    }
  };

  // Restart after a loss (or a confirmed mid-battle RESTART): a fresh server
  // session replaces the current one. Moves uiPhase to 'restarting'
  // synchronously so the restart-confirm YES/NO buttons (and re-entry into
  // the confirm flow, and a fast double-click on this same trigger) are
  // impossible while the forced restart request is in flight; startEncounter
  // (called from startBattle's success path) drives uiPhase back to
  // 'encounter' → 'intro' → 'command' once the new session actually loads.
  const restartBattle = () => {
    setUiPhase('restarting');
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    messageQueueRef.current = [];
    messageTimerRef.current = null;
    setActiveBeatLines([]);
    setBattleOutcome(null);
    setSelectedMove(null);
    setHoveredMove(null);
    setCurrentTurn('none');
    setPlayerAttacking(false);
    setEnemyAttacking(false);
    setPlayerDamageEffect(false);
    setEnemyDamageEffect(false);
    setPlayerFainted(false);
    setEnemyFainted(false);
    setPlayerCritical(false);
    setEnemyCritical(false);
    setHitFlash(null);
    setCriticalFlash(false);
    setRangedFlash(null);
    setStatusSparkle(false);
    setOpponentMove(null);
    setProgressSave('idle');
    setProgressError('');

    startBattle(true);
    timersRef.current.push(
      setTimeout(() => addLog('Battle restarted!'), reduceMotion ? 0 : 3300)
    );
  };

  if (error)
    return (
      <div className="battle-page device-backdrop">
        <div className="error font-pixel">
          <p>{error}</p>
          <button className="pixel-btn mt-4" onClick={() => navigate('/game')}>
            Back to hub
          </button>
        </div>
      </div>
    );
  if (!userPokemon || !trainerPokemon)
    return (
      <div className="battle-page device-backdrop">
        <div className="loading font-pixel">Loading battle data...</div>
      </div>
    );

  // Calculate health percentages

  const getHealthColorClass = (percentage) => {
    if (percentage <= 25) return 'health-critical';
    if (percentage <= 50) return 'health-warning';
    return 'health-good';
  };

  const grid = gridMoves();
  const isMessageOnlyPhase = !['command', 'moveSelect', 'partySelect', 'bagSelect', 'restartConfirm', 'finished'].includes(uiPhase);
  const playerSpriteUrl = playerTrainerSprite(user?.gender);
  const introStarted = uiPhase !== 'encounter';
  const trainerName = session?.trainerName || 'The trainer';
  const party = session?.party || [];
  const activePosition = session?.activePosition ?? null;
  const requiresSwitch = !!session?.requiresSwitch;
  // Phase 10: enemy side is a party too (1–N); legendaries are wild fights
  const enemyParty = session?.enemyParty || [];
  const enemyActivePosition = session?.enemyActivePosition ?? null;
  const isLegendary = session?.battleType === 'legendary';

  return (
    <div className="battle-page device-backdrop">
      <Shell
        poweredOn
        controls={
          <>
            <GbaControls onB={pressBackButton} onA={confirmMenuCursor} />
          </>
        }
      >
        <LcdPanel scanlines={false} className="lcd-panel--fixed">
          <div className="battle-scale-outer" style={{ width: STAGE_WIDTH, height: STAGE_TOTAL_HEIGHT }}>
            <div style={{ width: STAGE_WIDTH }}>
              <div className="gba-battle-container">
                {/* Sound Effects */}
                <audio ref={battleSoundRef} />
            <div className="gba-battle-background">
              {/* Encounter beat: flash + pokéball throw + appear text */}
              <AnimatePresence>
                {uiPhase === 'encounter' && (
                  <motion.div
                    className="battle-start-animation"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: motionMs(400) / 1000 } }}
                  >
                    {!reduceMotion && (
                      <motion.div
                        className="battle-flash"
                        animate={{ opacity: [0, 1, 0, 1, 0] }}
                        transition={{ duration: 1.2 }}
                      />
                    )}
                    {!reduceMotion && (
                      <motion.div
                        className="pokeball-throw"
                        initial={{ x: -160, y: 90, scale: 0.55, opacity: 1, rotate: 0 }}
                        animate={{
                          x: [-160, 20, 70],
                          y: [90, -10, -36],
                          rotate: [0, 360, 720],
                          scale: [0.55, 1, 0.15],
                          opacity: [1, 1, 0],
                        }}
                        transition={{ duration: 1.15, times: [0, 0.62, 1], delay: 0.35 }}
                        aria-hidden="true"
                      />
                    )}
                    {session?.trainerSprite && (
                      <motion.div
                        className="gba-trainer-avatar-wrap"
                        initial={{ x: 80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: motionMs(150) / 1000, duration: motionMs(350) / 1000 }}
                      >
                        <TrainerAvatar
                          trainerSprite={session.trainerSprite}
                          alt={trainerName}
                          className="gba-trainer-avatar pixelated"
                        />
                      </motion.div>
                    )}
                    {/* Unlike the opponent avatar above (gated on session?.trainerSprite for wild/legendary fights), the player always throws their own Poké Ball, so this renders unconditionally on every encounter */}
                    <motion.div
                      className="gba-player-trainer-avatar-wrap"
                      initial={{ x: -80, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: motionMs(150) / 1000, duration: motionMs(350) / 1000 }}
                    >
                      <img
                        src={playerSpriteUrl}
                        alt=""
                        aria-hidden="true"
                        className="gba-trainer-avatar pixelated"
                      />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: motionMs(900) / 1000, duration: motionMs(500) / 1000 }}
                      className="battle-start-text"
                    >
                      {isLegendary
                        ? `A wild ${trainerPokemon.nickname} appeared!`
                        : `${trainerName} sent out ${trainerPokemon.nickname}!`}
                    </motion.h2>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Type-tinted hit flash */}
              <AnimatePresence>
                {hitFlash && (
                  <motion.div
                    className="hit-flash"
                    style={{ background: hitFlash }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  />
                )}
              </AnimatePresence>

              {/* Critical-hit white double-pulse accent */}
              <AnimatePresence>
                {criticalFlash && (
                  <motion.div
                    className="hit-flash"
                    style={{ background: '#ffffff' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.7, 0, 0.5, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, times: [0, 0.25, 0.5, 0.75, 1] }}
                  />
                )}
              </AnimatePresence>

              {rangedFlash && (
                <div
                  className="ranged-flash"
                  style={{ background: rangedFlash }}
                  aria-hidden="true"
                />
              )}
              {statusSparkle && <div className="status-sparkle" aria-hidden="true" />}

              {/* Enemy: HP box + sprite */}
              <div className="gba-enemy-container" style={slotStyle('opponent')}>
                <img
                  src="/shadows/oval.png"
                  alt=""
                  aria-hidden="true"
                  style={{ ...shadowStyle('opponent'), imageRendering: 'pixelated' }}
                />
                {introStarted && (
                  <HpBox
                    pokemon={trainerPokemon}
                    role="enemy"
                    party={enemyParty}
                    activePosition={enemyActivePosition}
                    opponentMove={opponentMove}
                    getHealthColorClass={getHealthColorClass}
                  />
                )}
                <motion.div
                  className={`gba-pokemon-sprite enemy-sprite ${enemyDamageEffect ? 'damage-effect' : ''}`}
                  animate={
                    reduceMotion
                      ? (enemyFainted ? ANIMATION_VARIANTS.FAINT : ANIMATION_VARIANTS.IDLE)
                      : ANIMATION_VARIANTS[
                          getAnimState({ fainted: enemyFainted, critical: enemyCritical, damageEffect: enemyDamageEffect })
                        ]
                  }
                  transition={{ duration: motionMs(500) / 1000 || 0.01, ease: 'easeIn' }}
                >
                  <BattlePokemonSprite
                    as={motion.img}
                    // Remount on species change so an enemy send-out (Phase
                    // 10) replays the slide-in, like the battle intro.
                    key={trainerPokemon.pokemon_id}
                    pokemonId={trainerPokemon.pokemon_id}
                    variant="front"
                    alt={trainerPokemon.nickname}
                    initial={{ x: 60, opacity: 0 }}
                    animate={{
                      x:
                        enemyAttacking && !reduceMotion
                          ? [0, 8, -32, -26, 0]
                          : introStarted
                          ? 0
                          : 60,
                      opacity: introStarted ? 1 : 0,
                    }}
                    transition={{
                      x:
                        enemyAttacking && !reduceMotion
                          ? { duration: 0.45, times: [0, 0.15, 0.6, 0.8, 1] }
                          : reduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 260, damping: 20 },
                      opacity: { duration: motionMs(350) / 1000 },
                    }}
                  />
                </motion.div>
              </div>

              {/* Player: sprite + HP box */}
              <div className="gba-player-container" style={slotStyle('player')}>
                <img
                  src="/shadows/oval.png"
                  alt=""
                  aria-hidden="true"
                  style={{ ...shadowStyle('player'), imageRendering: 'pixelated' }}
                />
                <motion.div
                  className={`gba-pokemon-sprite player-sprite ${playerDamageEffect ? 'damage-effect' : ''}`}
                  animate={{
                    ...(reduceMotion
                      ? (playerFainted ? ANIMATION_VARIANTS.FAINT : ANIMATION_VARIANTS.IDLE)
                      : ANIMATION_VARIANTS[
                          getAnimState({ fainted: playerFainted, critical: playerCritical, damageEffect: playerDamageEffect })
                        ])
                  }}
                  transition={{ duration: motionMs(500) / 1000 || 0.01, ease: 'easeIn' }}
                >
                  <BattlePokemonSprite
                    as={motion.img}
                    pokemonId={userPokemon.pokemon_id}
                    variant="back"
                    alt={userPokemon.nickname}
                    initial={{ x: -60, opacity: 0 }}
                    animate={{
                      x:
                        playerAttacking && !reduceMotion
                          ? [0, -8, 32, 26, 0]
                          : introStarted
                          ? 0
                          : -60,
                      opacity: introStarted ? 1 : 0,
                    }}
                    transition={{
                      x:
                        playerAttacking && !reduceMotion
                          ? { duration: 0.45, times: [0, 0.15, 0.6, 0.8, 1] }
                          : reduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 260, damping: 20, delay: motionMs(350) / 1000 },
                      opacity: { duration: motionMs(350) / 1000, delay: motionMs(350) / 1000 },
                    }}
                  />
                </motion.div>
                {introStarted && (
                  <HpBox
                    pokemon={userPokemon}
                    role="player"
                    party={party}
                    activePosition={activePosition}
                    opponentMove={null}
                    getHealthColorClass={getHealthColorClass}
                    style={{ animationDelay: reduceMotion ? '0s' : '0.45s', animationFillMode: 'both' }}
                  />
                )}
              </div>
            </div>

            {/* Bottom UI: dialog + menu, driven by uiPhase */}
            <div className="gba-bottom-ui">
              {uiPhase === 'finished' && battleOutcome ? (
                <div className="gba-dialog-box gba-dialog-box--message">
                  <div className="gba-dialog-text">
                    {battleOutcome.outcome === 'win'
                      ? `You won! ${battleOutcome.winner} wins the battle!`
                      : `You lost... ${battleOutcome.winner} wins the battle!`}
                  </div>
                  {battleOutcome.outcome === 'win' && xpSummary.length > 0 && (
                    <div className="gba-xp-summary">
                      {xpSummary.map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  )}
                  {battleOutcome.outcome === 'win' && progressError ? (
                    <p className="gba-dialog-text" role="alert">{progressError}</p>
                  ) : null}
                  {battleOutcome.outcome === 'win' ? (
                    progressSave === 'error' ? (
                      <motion.button
                        className="pixel-btn pixel-btn--primary"
                        onClick={retryProgressAward}
                        whileHover={reduceMotion ? {} : { scale: 1.05 }}
                        whileTap={reduceMotion ? {} : { scale: 0.95 }}
                      >
                        Retry save
                      </motion.button>
                    ) : (
                      <motion.button
                        className="pixel-btn pixel-btn--primary"
                        onClick={() => (onContinue ? onContinue() : restartBattle())}
                        disabled={progressSave !== 'saved'}
                        whileHover={reduceMotion || progressSave !== 'saved' ? {} : { scale: 1.05 }}
                        whileTap={reduceMotion || progressSave !== 'saved' ? {} : { scale: 0.95 }}
                      >
                        {progressSave === 'saving' ? 'Saving...' : 'Continue'}
                      </motion.button>
                    )
                  ) : (
                    <div className="gba-finish-actions">
                      <motion.button
                        className="pixel-btn pixel-btn--primary"
                        onClick={restartBattle}
                        whileHover={reduceMotion ? {} : { scale: 1.05 }}
                        whileTap={reduceMotion ? {} : { scale: 0.95 }}
                      >
                        Battle Again
                      </motion.button>
                      <button
                        className="pixel-btn"
                        onClick={() => navigate('/game')}
                      >
                        Back to hub
                      </button>
                    </div>
                  )}
                </div>
              ) : uiPhase === 'bagSelect' ? (
                <div className="gba-party-panel">
                  <div className="gba-bag-rows">
                    {bagItems.map((item) => (
                      <button
                        key={item.itemId}
                        className="gba-bag-row"
                        onClick={() => handleSelectItem(item)}
                      >
                        <span className="gba-bag-row-name">{item.name}</span>
                        <span className="gba-bag-row-qty">x{item.quantity}</span>
                        <span className="gba-bag-row-desc">{item.description}</span>
                      </button>
                    ))}
                  </div>
                  <div className="gba-party-side">
                    <p className="gba-party-hint">
                      Use which item on {userPokemon.nickname}?
                    </p>
                    <button
                      className="gba-party-cancel"
                      onClick={() => {
                        playSound('select');
                        setUiPhase('command');
                      }}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : uiPhase === 'partySelect' ? (
                <div className="gba-party-panel">
                  <div className="gba-party-rows">
                    {party.map((mon) => {
                      const isActive = mon.position === activePosition;
                      const isFainted = mon.current_hp <= 0;
                      const pct = (mon.current_hp / mon.max_hp) * 100;
                      return (
                        <button
                          key={mon.position}
                          className={`gba-party-row ${isActive ? 'is-active' : ''} ${
                            isFainted ? 'is-fainted' : ''
                          }`}
                          disabled={isActive || isFainted}
                          onClick={() => handleSelectSwitch(mon)}
                        >
                          <PokemonSprite
                            pokemonId={mon.pokemon_id}
                            variant="front"
                            alt={mon.nickname}
                            className="gba-party-row-sprite"
                          />
                          <span className="gba-party-row-name">
                            {mon.nickname}{' '}
                            <span className="gba-level-text">Lv.{mon.level}</span>
                            <StatusBadge
                              status={
                                mon.position === userPokemon.position
                                  ? userPokemon.status
                                  : mon.status
                              }
                            />
                          </span>
                          <span className="gba-party-row-bar-track">
                            <span
                              className={`gba-health-fill ${getHealthColorClass(pct)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          <span className="gba-party-row-hp">
                            {mon.current_hp}/{mon.max_hp}
                          </span>
                          {(isActive || isFainted) && (
                            <span className="gba-party-row-tag">
                              {isActive ? 'IN BATTLE' : 'FNT'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="gba-party-side">
                    <p className="gba-party-hint">
                      {requiresSwitch
                        ? 'Choose your next Pokémon!'
                        : 'Switch to which Pokémon?'}
                    </p>
                    {!requiresSwitch && (
                      <button
                        className="gba-party-cancel"
                        onClick={() => {
                          playSound('select');
                          setUiPhase('command');
                        }}
                      >
                        CANCEL
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`gba-dialog-box ${uiPhase !== 'moveSelect' ? 'gba-dialog-box--message' : ''} ${
                      isMessageOnlyPhase ? 'gba-dialog-box--fullwidth' : ''
                    }`}
                  >
                    {uiPhase === 'moveSelect' ? (
                      <MoveMenu
                        part="grid"
                        grid={grid}
                        menuCursor={menuCursor}
                        mustStruggle={session?.mustStruggle}
                        onSelectMove={(move, index) => {
                          if (index != null) setMenuCursor(index);
                          handleSelectMove(move);
                        }}
                        onHoverMove={(move, index) => {
                          setMenuCursor(index);
                          setHoveredMove(move);
                        }}
                        onLeaveHover={() => setHoveredMove(null)}
                        onFocusMove={(move) => setHoveredMove(move)}
                        onBlurMove={() => setHoveredMove(null)}
                      />
                    ) : isMessageOnlyPhase ? (
                      <MessageLog lines={activeBeatLines} />
                    ) : (
                      <div className="gba-dialog-text">
                        {uiPhase === 'restartConfirm'
                          ? 'Restart this battle?'
                          : uiPhase === 'restarting'
                          ? 'Restarting battle...'
                          : `What will ${userPokemon.nickname} do?`}
                      </div>
                    )}
                  </div>
                  {!isMessageOnlyPhase && (
                    <div className="gba-menu-box">
                      {uiPhase === 'moveSelect' ? (
                        <MoveMenu part="info" grid={grid} menuCursor={menuCursor} hoveredMove={hoveredMove} />
                      ) : uiPhase === 'command' ? (
                        <div className="gba-main-menu">
                          {[
                            { action: 'FIGHT', label: 'FIGHT' },
                            { action: 'BAG', label: 'BAG' },
                            { action: 'POKEMON', label: 'POKéMON' },
                            { action: 'RESTART', label: 'RESTART' },
                          ].map(({ action, label }, index) => (
                            <button
                              key={action}
                              onClick={() => {
                                setMenuCursor(index);
                                handleMainMenuSelection(action);
                              }}
                              onMouseEnter={() => setMenuCursor(index)}
                            >
                              <span className="gba-cursor-arrow">{menuCursor === index ? '▶' : ''}</span>
                              {label}
                            </button>
                          ))}
                        </div>
                      ) : uiPhase === 'restartConfirm' ? (
                        <div className="gba-main-menu">
                          {['YES', 'NO'].map((label, index) => (
                            <button
                              key={label}
                              onClick={() => confirmRestart(index === 0)}
                              onMouseEnter={() => setMenuCursor(index)}
                            >
                              <span className="gba-cursor-arrow">{menuCursor === index ? '▶' : ''}</span>
                              {label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
              </div>
            </div>
        </LcdPanel>
      </Shell>
    </div>
  );
};

export default BattleSim;
