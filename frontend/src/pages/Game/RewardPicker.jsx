// RewardPicker.jsx — Phase 6 boss reward cards.
// Fetches the trainer's pending server-generated offer and lets them claim
// exactly one option. Species/level/stats/types all come from the server;
// the client only ever sends offerId + optionId (+ replacement position).
// Pokémon sprites only — no trainer art.
import React, { useCallback, useEffect, useState } from 'react';
import PokemonSprite from '../../components/PokemonSprite/PokemonSprite';
import { typeColor } from '../../utils/typeColors';
import { api, getErrorMessage } from '../../api';
import './RewardPicker.css';

const MAX_PARTY = 3;

// Offer sources (Phase 10): gym leaders, the champion, and legendaries all
// use the same server offer/claim flow — only the headline differs.
const REWARD_TITLES = {
  gym_boss: 'Gym victory reward',
  champion: 'Champion victory reward',
  legendary: 'Legendary victory reward',
};

const RewardPicker = ({ onClaimed, onEmpty }) => {
  const [loading, setLoading] = useState(true);
  const [reward, setReward] = useState(null);
  const [party, setParty] = useState([]);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [phase, setPhase] = useState('cards'); // 'cards' | 'replace' | 'claimed'
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await api.get('/api/rewards/pending');
        if (cancelled) return;
        if (!data?.success || !data.reward) {
          onEmpty?.();
          return;
        }
        setReward(data.reward);
        setParty(data.party || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load pending reward:', err.response || err.message);
        if (!cancelled) onEmpty?.();
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOption = reward?.options?.find(
    (o) => o.optionId === selectedOptionId
  );
  const partyFull = party.length >= MAX_PARTY;

  const claim = useCallback(
    async (replacePartyPosition) => {
      if (!reward || !selectedOption || claiming) return;
      setClaiming(true);
      setError('');
      try {
        const { data } = await api.post('/api/rewards/claim', {
          offerId: reward.offerId,
          optionId: selectedOption.optionId,
          ...(replacePartyPosition != null ? { replacePartyPosition } : {}),
        });
        if (!data?.success) {
          throw new Error(data?.error || 'Failed to claim reward');
        }
        setClaimResult(data);
        setPhase('claimed');
      } catch (err) {
        console.error('Reward claim failed:', err.response || err.message);
        const status = err.response?.status;
        if (status === 404 || status === 409) {
          // Offer gone or already claimed — nothing left to pick here.
          onEmpty?.();
          return;
        }
        setError(getErrorMessage(err, 'Could not claim the reward'));
      } finally {
        setClaiming(false);
      }
    },
    [reward, selectedOption, claiming, onEmpty]
  );

  const handleChoose = () => {
    if (!selectedOption) return;
    if (partyFull) {
      setPhase('replace');
      return;
    }
    claim(null);
  };

  if (loading)
    return (
      <div className="device-backdrop flex items-center justify-center p-4">
        <p className="font-pixel text-[0.7rem]" style={{ color: 'var(--lcd-ink)' }}>
          Checking rewards...
        </p>
      </div>
    );

  if (phase === 'claimed' && claimResult)
    return (
      <div className="device-backdrop flex items-center justify-center p-4">
        <div className="reward-panel font-pixel">
          <p className="reward-title">Reward claimed!</p>
          <div className="reward-claimed-mon">
            <PokemonSprite
              pokemon={claimResult.pokemon}
              variant="front"
              className="reward-card-sprite"
            />
            <p className="reward-claimed-text">
              {claimResult.pokemon.nickname} (Lv {claimResult.pokemon.level}) joined
              your party at slot {claimResult.position}!
            </p>
          </div>
          <div className="reward-party-strip">
            {(claimResult.party || []).map((mon) => (
              <div key={mon.position} className="reward-party-chip">
                <PokemonSprite pokemon={mon} variant="front" className="reward-chip-sprite" />
                <span>{mon.nickname}</span>
              </div>
            ))}
          </div>
          <button className="pixel-btn" onClick={() => onClaimed?.(claimResult)}>
            Continue
          </button>
        </div>
      </div>
    );

  if (phase === 'replace')
    return (
      <div className="device-backdrop flex items-center justify-center p-4">
        <div className="reward-panel font-pixel">
          <p className="reward-title">Party is full</p>
          <p className="reward-subtitle">
            Choose who makes room for {selectedOption?.nickname}.
          </p>
          <div className="reward-replace-new">
            <PokemonSprite
              pokemon={selectedOption}
              variant="front"
              className="reward-chip-sprite"
            />
            <span>
              {selectedOption?.nickname} Lv {selectedOption?.level} joins instead of:
            </span>
          </div>
          <div className="reward-party-list" role="listbox" aria-label="Party member to replace">
            {party.map((mon) => (
              <button
                key={mon.position}
                className="reward-party-row"
                disabled={claiming}
                onClick={() => claim(mon.position)}
              >
                <PokemonSprite pokemon={mon} variant="front" className="reward-chip-sprite" />
                <span className="reward-party-name">{mon.nickname}</span>
                <span className="reward-party-meta">
                  Lv {mon.level} · {mon.current_hp}/{mon.max_hp} HP
                </span>
                <span className="reward-party-action">Send away</span>
              </button>
            ))}
          </div>
          {error && <p className="reward-error" role="alert">{error}</p>}
          <button
            className="pixel-btn reward-secondary"
            disabled={claiming}
            onClick={() => setPhase('cards')}
          >
            Back to cards
          </button>
        </div>
      </div>
    );

  return (
    <div className="device-backdrop flex items-center justify-center p-4">
      <div className="reward-panel font-pixel">
        <p className="reward-title">
          {REWARD_TITLES[reward?.source] || 'Victory reward'}
        </p>
        <p className="reward-subtitle">Choose ONE Pokémon to join your party.</p>
        <div className="reward-cards">
          {(reward?.options || []).map((option) => (
            <button
              key={option.optionId}
              className={`reward-card${
                selectedOptionId === option.optionId ? ' is-selected' : ''
              }`}
              onClick={() => setSelectedOptionId(option.optionId)}
              aria-pressed={selectedOptionId === option.optionId}
            >
              <PokemonSprite
                pokemon={option}
                variant="front"
                className="reward-card-sprite"
              />
              <span className="reward-card-name">{option.nickname}</span>
              <span className="reward-card-level">Lv {option.level}</span>
              <span className="reward-card-types">
                {(option.types || []).map((type) => (
                  <span
                    key={type}
                    className="reward-type-chip"
                    style={{ backgroundColor: typeColor(type) }}
                  >
                    {type}
                  </span>
                ))}
              </span>
              <span className="reward-card-stats">
                <span>HP {option.max_hp}</span>
                <span>ATK {option.attack}</span>
                <span>DEF {option.defense}</span>
                <span>SPD {option.speed}</span>
              </span>
            </button>
          ))}
        </div>
        {error && <p className="reward-error" role="alert">{error}</p>}
        <div className="reward-actions">
          <button
            className="pixel-btn"
            disabled={!selectedOption || claiming}
            onClick={handleChoose}
          >
            {claiming
              ? 'Claiming...'
              : partyFull
                ? 'Choose (replace a party member)'
                : 'Choose'}
          </button>
          <button
            className="pixel-btn reward-secondary"
            disabled={claiming}
            onClick={() => onEmpty?.()}
          >
            Claim later
          </button>
          <p className="reward-hint">
            Claim later keeps the offer — these cards will be shown again the
            next time you enter this level.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RewardPicker;
