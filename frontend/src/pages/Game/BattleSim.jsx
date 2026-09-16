import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api, getErrorMessage } from '../../api';
import { TYPE_COLORS } from '../../utils/typeColors';
import PokemonSprite from '../../components/PokemonSprite/PokemonSprite';
import './BattleGround.css';

// Native stage size; scaled down responsively, never up
const STAGE_WIDTH = 768;
const STAGE_TOTAL_HEIGHT = 698; // stage (540) + margin-top (12) + battle log container (146)

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

  // Server session + displayed battle state (HP animates beat-by-beat)
  const [session, setSession] = useState(null);
  const [userPokemon, setUserPokemon] = useState(null);
  const [trainerPokemon, setTrainerPokemon] = useState(null);
  const [battleOutcome, setBattleOutcome] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [error, setError] = useState('');
  const [selectedMove, setSelectedMove] = useState(null);
  const [hoveredMove, setHoveredMove] = useState(null);
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
  const [hitFlash, setHitFlash] = useState(null); // type-tinted overlay color

  // Responsive stage scale
  const [stageScale, setStageScale] = useState(1);

  const logRef = useRef(null);
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

  // Scale the fixed 768px stage down on narrow screens
  useEffect(() => {
    const onResize = () =>
      setStageScale(Math.min(1, (window.innerWidth - 24) / STAGE_WIDTH));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-scroll battle log when updated
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleLog]);

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

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setBattleLog((prevLog) => [...prevLog, `${timestamp} - ${message}`]);
  };

  // Brief type-tinted flash over the stage on a landed hit
  const triggerHitFlash = (moveType) => {
    if (reduceMotion) return;
    const typeKey = String(moveType || '').toLowerCase();
    setHitFlash(TYPE_COLORS[typeKey] || '#ffffff');
    timersRef.current.push(setTimeout(() => setHitFlash(null), 280));
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

    const setAttacking = isPlayer ? setPlayerAttacking : setEnemyAttacking;
    setAttacking(true);
    playSound('attack');
    await wait(motionMs(500));
    setAttacking(false);
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
    const setDamageEffect = isPlayer ? setEnemyDamageEffect : setPlayerDamageEffect;
    const setDefender = isPlayer ? setTrainerPokemon : setUserPokemon;
    if (isPlayer) view.enemy = { ...view.enemy, current_hp: event.targetHpAfter };
    else view.player = { ...view.player, current_hp: event.targetHpAfter };
    setDamageEffect(true);
    playSound('damage');
    setDefender((prev) => ({ ...prev, current_hp: event.targetHpAfter }));
    await wait(motionMs(600));
    setDamageEffect(false);

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
    setBattleLog([]);
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
    setHitFlash(null);
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
  const trainerHealthPercent = (trainerPokemon.current_hp / trainerPokemon.max_hp) * 100;
  const userHealthPercent = (userPokemon.current_hp / userPokemon.max_hp) * 100;

  const getHealthColorClass = (percentage) => {
    if (percentage <= 25) return 'health-critical';
    if (percentage <= 50) return 'health-warning';
    return 'health-good';
  };

  const grid = gridMoves();
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
      <div
        className="battle-scale-outer"
        style={{
          width: STAGE_WIDTH * stageScale,
          height: STAGE_TOTAL_HEIGHT * stageScale,
        }}
      >
        <div style={{ transform: `scale(${stageScale})`, transformOrigin: 'top left', width: STAGE_WIDTH }}>
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

              {/* Enemy: HP box + sprite */}
              <div className="gba-enemy-container">
                {introStarted && (
                  <div className="gba-hp-box enemy-hp-box">
                    <div className="gba-pokemon-name">
                      {trainerPokemon.nickname}{' '}
                      <span className="gba-level-text">Lv.{trainerPokemon.level}</span>
                      <StatusBadge status={trainerPokemon.status} />
                    </div>
                    {enemyParty.length > 1 && (
                      <div className="gba-party-dots" aria-hidden="true">
                        {enemyParty.map((mon) => {
                          const hp =
                            trainerPokemon && mon.position === trainerPokemon.position
                              ? trainerPokemon.current_hp
                              : mon.current_hp;
                          return (
                            <span
                              key={mon.position}
                              className={`gba-party-dot ${hp <= 0 ? 'fainted' : ''} ${
                                mon.position === enemyActivePosition ? 'active' : ''
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}
                    <div className="gba-health-container">
                      <div className="gba-health-bar">
                        <motion.div
                          className={`gba-health-fill ${getHealthColorClass(trainerHealthPercent)}`}
                          initial={{ width: '100%' }}
                          animate={{ width: `${trainerHealthPercent}%` }}
                          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                        />
                      </div>
                    </div>
                    {opponentMove && (
                      <div className="opponent-move">Move: {opponentMove.name}</div>
                    )}
                  </div>
                )}
                <motion.div
                  className={`gba-pokemon-sprite enemy-sprite ${enemyDamageEffect ? 'damage-effect' : ''}`}
                  animate={
                    enemyFainted
                      ? { y: 46, opacity: 0 }
                      : enemyDamageEffect && !reduceMotion
                      ? { x: [-10, 10, -10, 10, 0], opacity: [1, 0.7, 1, 0.7, 1] }
                      : { y: 0, opacity: 1 }
                  }
                  transition={{ duration: motionMs(500) / 1000 || 0.01, ease: 'easeIn' }}
                >
                  <PokemonSprite
                    as={motion.img}
                    // Remount on species change so an enemy send-out (Phase
                    // 10) replays the slide-in, like the battle intro.
                    key={trainerPokemon.pokemon_id}
                    pokemonId={trainerPokemon.pokemon_id}
                    variant="front"
                    alt={trainerPokemon.nickname}
                    initial={{ x: 60, opacity: 0 }}
                    animate={{
                      x: enemyAttacking && !reduceMotion ? [0, -24, 0] : introStarted ? 0 : 60,
                      opacity: introStarted ? 1 : 0,
                    }}
                    transition={{
                      x: enemyAttacking
                        ? { duration: 0.45 }
                        : { duration: motionMs(450) / 1000, ease: 'easeOut' },
                      opacity: { duration: motionMs(350) / 1000 },
                    }}
                  />
                </motion.div>
              </div>

              {/* Player: sprite + HP box */}
              <div className="gba-player-container">
                <motion.div
                  className={`gba-pokemon-sprite player-sprite ${playerDamageEffect ? 'damage-effect' : ''}`}
                  animate={{
                    scaleX: -1,
                    ... (playerFainted
                      ? { y: 46, opacity: 0 }
                      : playerDamageEffect && !reduceMotion
                      ? { x: [-10, 10, -10, 10, 0], opacity: [1, 0.7, 1, 0.7, 1] }
                      : { y: 0, opacity: 1 })
                  }}
                  transition={{ duration: motionMs(500) / 1000 || 0.01, ease: 'easeIn' }}
                >
                  <PokemonSprite
                    as={motion.img}
                    pokemonId={userPokemon.pokemon_id}
                    variant="back"
                    alt={userPokemon.nickname}
                    initial={{ x: -60, opacity: 0, scaleX: -1 }}
                    animate={{
                      scaleX: -1,
                      x: playerAttacking && !reduceMotion ? [0, 24, 0] : introStarted ? 0 : -60,
                      opacity: introStarted ? 1 : 0,
                    }}
                    transition={{
                      x: playerAttacking
                        ? { duration: 0.45 }
                        : { duration: motionMs(450) / 1000, delay: motionMs(350) / 1000, ease: 'easeOut' },
                      opacity: { duration: motionMs(350) / 1000, delay: motionMs(350) / 1000 },
                    }}
                  />
                </motion.div>
                {introStarted && (
                  <div
                    className="gba-hp-box player-hp-box"
                    style={{ animationDelay: reduceMotion ? '0s' : '0.45s', animationFillMode: 'both' }}
                  >
                    <div className="gba-pokemon-name">
                      {userPokemon.nickname}{' '}
                      <span className="gba-level-text">Lv.{userPokemon.level}</span>
                      <StatusBadge status={userPokemon.status} />
                    </div>
                    {party.length > 1 && (
                      <div className="gba-party-dots" aria-hidden="true">
                        {party.map((mon) => {
                          const hp =
                            userPokemon && mon.position === userPokemon.position
                              ? userPokemon.current_hp
                              : mon.current_hp;
                          return (
                            <span
                              key={mon.position}
                              className={`gba-party-dot ${hp <= 0 ? 'fainted' : ''} ${
                                mon.position === activePosition ? 'active' : ''
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}
                    <div className="gba-health-container">
                      <div className="gba-health-bar">
                        <motion.div
                          className={`gba-health-fill ${getHealthColorClass(userHealthPercent)}`}
                          initial={{ width: '100%' }}
                          animate={{ width: `${userHealthPercent}%` }}
                          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                        />
                      </div>
                      <div className="gba-hp-text">
                        HP: {userPokemon.current_hp}/{userPokemon.max_hp}
                      </div>
                    </div>
                  </div>
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
                        className="gba-restart-btn"
                        onClick={retryProgressAward}
                        whileHover={reduceMotion ? {} : { scale: 1.05 }}
                        whileTap={reduceMotion ? {} : { scale: 0.95 }}
                      >
                        Retry save
                      </motion.button>
                    ) : (
                      <motion.button
                        className="gba-restart-btn"
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
                        className="gba-restart-btn"
                        onClick={restartBattle}
                        whileHover={reduceMotion ? {} : { scale: 1.05 }}
                        whileTap={reduceMotion ? {} : { scale: 0.95 }}
                      >
                        Battle Again
                      </motion.button>
                      <button
                        className="gba-restart-btn gba-restart-btn--secondary"
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
                  <div className={`gba-dialog-box ${uiPhase !== 'moveSelect' ? 'gba-dialog-box--message' : ''}`}>
                    {uiPhase === 'moveSelect' ? (
                      session?.mustStruggle ? (
                        // Every move is out of PP: FireRed offers Struggle.
                        <div className="gba-move-grid">
                          <button
                            className="gba-move-btn gba-move-btn--struggle"
                            onClick={() => handleSelectMove(STRUGGLE_MOVE)}
                          >
                            STRUGGLE
                          </button>
                        </div>
                      ) : (
                        <div className="gba-move-grid">
                          {grid.map((move, index) =>
                            move ? (
                              <button
                                key={move.move_id}
                                className={`gba-move-btn ${selectedMove?.move_id === move.move_id ? 'selected' : ''}`}
                                onClick={() => handleSelectMove(move)}
                                onMouseEnter={() => setHoveredMove(move)}
                                onMouseLeave={() => setHoveredMove(null)}
                                onFocus={() => setHoveredMove(move)}
                                onBlur={() => setHoveredMove(null)}
                                disabled={
                                  typeof move.current_pp === 'number' &&
                                  move.current_pp <= 0
                                }
                              >
                                <span className="gba-move-btn-name">{move.name}</span>
                                {typeof move.current_pp === 'number' && (
                                  <span className="gba-move-btn-pp">
                                    {move.current_pp}/{move.max_pp}
                                  </span>
                                )}
                              </button>
                            ) : (
                              <button key={index} className="gba-move-btn blank" disabled></button>
                            )
                          )}
                        </div>
                      )
                    ) : (
                      <div className="gba-dialog-text">
                        {uiPhase === 'restartConfirm'
                          ? 'Restart this battle?'
                          : uiPhase === 'restarting'
                          ? 'Restarting battle...'
                          : currentTurn === 'player' && selectedMove
                          ? `${userPokemon.nickname} used ${selectedMove.name}!`
                          : currentTurn === 'enemy'
                          ? `${trainerPokemon.nickname} is attacking...`
                          : `What will ${userPokemon.nickname} do?`}
                      </div>
                    )}
                  </div>
                  <div className="gba-menu-box">
                    {uiPhase === 'moveSelect' ? (
                      <div className="gba-move-info">
                        {hoveredMove ? (
                          <>
                            <p><strong>{hoveredMove.name}</strong></p>
                            <p>
                              Type:{' '}
                              {(hoveredMove.type || hoveredMove.move_type) && (
                                <span
                                  className="move-type"
                                  style={{
                                    background:
                                      TYPE_COLORS[String(hoveredMove.type || hoveredMove.move_type).toLowerCase()] ||
                                      '#a8a77a',
                                  }}
                                >
                                  {hoveredMove.type || hoveredMove.move_type}
                                </span>
                              )}
                            </p>
                            <p>
                              PP:{' '}
                              {typeof hoveredMove.current_pp === 'number'
                                ? `${hoveredMove.current_pp}/${hoveredMove.max_pp}`
                                : '—'}
                            </p>
                            <p>
                              Description:{' '}
                              {hoveredMove.description
                                ? hoveredMove.description
                                : 'No description available.'}
                            </p>
                          </>
                        ) : (
                          <p>Hover over a move for details</p>
                        )}
                      </div>
                    ) : uiPhase === 'command' ? (
                      <div className="gba-main-menu">
                        <button onClick={() => handleMainMenuSelection('FIGHT')}>FIGHT</button>
                        <button onClick={() => handleMainMenuSelection('BAG')}>BAG</button>
                        <button onClick={() => handleMainMenuSelection('POKEMON')}>POKéMON</button>
                        <button onClick={() => handleMainMenuSelection('RESTART')}>RESTART</button>
                      </div>
                    ) : uiPhase === 'restartConfirm' ? (
                      <div className="gba-main-menu">
                        <button onClick={() => confirmRestart(true)}>YES</button>
                        <button onClick={() => confirmRestart(false)}>NO</button>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Battle log lives below the stage so it is actually visible */}
          <div className="gba-battle-log-container">
            <div className="gba-battle-log" ref={logRef}>
              {battleLog.map((entry, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {entry}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleSim;
