// frontend/src/pages/Game/battle/HpBox.jsx
import React from 'react';
import { motion } from 'framer-motion';

// BRN/PAR/PSN/SLP/FRZ chip shown next to names — mirrors BattleSim.jsx's
// module-scope StatusBadge exactly (kept local here since that one isn't
// exported and this file shouldn't reach into BattleSim.jsx's internals).
const StatusBadge = ({ status }) =>
  status ? (
    <span className={`gba-status-badge status-${status}`}>
      {String(status).toUpperCase()}
    </span>
  ) : null;

const GenderSymbol = ({ gender }) => {
  if (gender === 'male') return <span className="gba-gender-male"> ♂</span>;
  if (gender === 'female') return <span className="gba-gender-female"> ♀</span>;
  return null;
};

/**
 * One HP box (name, gender, level, status, party dots, HP bar+number, and
 * -- player role only -- a live EXP bar). Lifted out of BattleSim.jsx's
 * inline JSX; same props/data the two call sites already compute, no new
 * data flow.
 */
const HpBox = ({
  pokemon,
  role, // 'enemy' | 'player'
  party,
  activePosition,
  opponentMove,
  getHealthColorClass,
  style,
}) => {
  const healthPercent = (pokemon.current_hp / pokemon.max_hp) * 100;
  const expPercent =
    role === 'player'
      ? Math.max(0, Math.min(100, (pokemon.experience / pokemon.xp_to_next) * 100))
      : 0;

  return (
    <div className={`gba-hp-box ${role}-hp-box`} style={style}>
      <div className="gba-pokemon-name">
        {pokemon.nickname}
        <GenderSymbol gender={pokemon.gender} />{' '}
        <span className="gba-level-text">Lv.{pokemon.level}</span>
        <StatusBadge status={pokemon.status} />
      </div>
      {party.length > 1 && (
        <div className="gba-party-dots" aria-hidden="true">
          {party.map((mon) => {
            const hp =
              pokemon && mon.position === pokemon.position ? pokemon.current_hp : mon.current_hp;
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
            className={`gba-health-fill ${getHealthColorClass(healthPercent)}`}
            initial={{ width: '100%' }}
            animate={{ width: `${healthPercent}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        {role === 'player' && (
          <div className="gba-hp-text">
            HP: {pokemon.current_hp}/{pokemon.max_hp}
          </div>
        )}
      </div>
      {role === 'player' && (
        <div className="gba-exp-container">
          <div className="gba-exp-bar">
            <motion.div
              className="gba-exp-fill"
              initial={{ width: '0%' }}
              animate={{ width: `${expPercent}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      )}
      {role === 'enemy' && opponentMove && (
        <div className="opponent-move">Move: {opponentMove.name}</div>
      )}
    </div>
  );
};

export default HpBox;
