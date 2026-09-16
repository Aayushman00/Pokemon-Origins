// Level.jsx — generic campaign level page (Phase 10).
// /level/:levelNumber plays any configured level (1–10) under server
// progress locks; /level/1 keeps working through the same route. Locked
// levels are rejected server-side (403) and rendered as a locked screen —
// the UI never soft-locks the player past it.
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BattleSim from './BattleSim';
import RewardPicker from './RewardPicker';
import { api, getErrorMessage } from '../../api';

// Highest authored campaign level (backend/data/campaign/level10.json).
export const MAX_CAMPAIGN_LEVEL = 10;

const Level = () => {
  const navigate = useNavigate();
  const params = useParams();
  const levelNumber = Number(params.levelNumber || 1);

  const [levelName, setLevelName] = useState('');
  const [progress, setProgress] = useState(null);
  const [viewBattle, setViewBattle] = useState(null);
  const [showComplete, setShowComplete] = useState(false);
  // Every "level finished" transition passes through RewardPicker, which
  // checks the server for a pending boss offer (covers both the
  // just-beat-the-boss case and refresh-before-claim resume).
  const [checkingReward, setCheckingReward] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState('');
  // Bumped by the error screen's Retry button to re-run the initial load.
  const [attempt, setAttempt] = useState(0);

  const validLevel =
    Number.isInteger(levelNumber) &&
    levelNumber >= 1 &&
    levelNumber <= MAX_CAMPAIGN_LEVEL;

  const loadCampaign = useCallback(async () => {
    const { data } = await api.get(`/api/campaign/level/${levelNumber}`);
    if (!data?.success || !data.battles?.length) {
      throw new Error(data?.error || `Campaign level ${levelNumber} returned no battles`);
    }
    setLevelName(data.name || '');
  }, [levelNumber]);

  useEffect(() => {
    if (!validLevel) return;
    const load = async () => {
      try {
        const { data } = await api.get('/api/campaign/progress');
        if (!data?.success || !data.progress) {
          throw new Error(data?.error || 'Failed to load campaign progress');
        }
        const nextProgress = data.progress;
        setProgress(nextProgress);
        if (nextProgress.current_level > levelNumber) {
          // Level already beaten — check for an unclaimed boss offer, then
          // show the complete screen (which points at the next level).
          setCheckingReward(true);
          return;
        }
        if (nextProgress.current_level < levelNumber) {
          // Server would reject battles here anyway (403); render the
          // locked state without soft-locking.
          setLocked(true);
          return;
        }
        await loadCampaign();
        // Every entry passes through the reward check before the battle:
        // a refresh after a mid-level boss win (each level 10 legendary)
        // or entering with the previous level's offer still unclaimed
        // must surface the pending cards instead of skipping them.
        setCheckingReward(true);
      } catch (err) {
        console.error('Error loading campaign:', err.response || err.message);
        if (err.response?.status === 403) {
          setLocked(true);
          return;
        }
        setError(getErrorMessage(err, 'Error loading level data'));
      }
    };
    load();
  }, [validLevel, levelNumber, loadCampaign, attempt]);

  // The server session awards progress on a real win; BattleSim hands us
  // the authoritative progress object to sync local state.
  const handleBattleWon = (nextProgress) => {
    if (nextProgress) setProgress(nextProgress);
  };

  // Every post-battle continue passes through RewardPicker: bosses mid-level
  // (each level 10 legendary) create offers too, not just level-enders. The
  // picker calls onEmpty immediately when nothing is pending.
  const handleContinue = () => {
    if (!progress) return;
    setViewBattle(null);
    setCheckingReward(true);
  };

  // RewardPicker hands control back once the offer is claimed, deferred, or
  // absent; next is either the following battle or the level-complete screen.
  const handleRewardDone = () => {
    setCheckingReward(false);
    if (!progress || progress.current_level > levelNumber) {
      setShowComplete(true);
      return;
    }
    setViewBattle(progress.current_battle);
  };

  const nextLevel = levelNumber + 1;
  const hasNextLevel = levelNumber < MAX_CAMPAIGN_LEVEL;

  if (!validLevel)
    return (
      <div className="device-backdrop flex items-center justify-center p-4">
        <div className="font-pixel text-center space-y-4" style={{ color: 'var(--lcd-ink)' }}>
          <p className="text-[0.7rem] leading-relaxed">That route doesn&apos;t exist.</p>
          <button className="pixel-btn" onClick={() => navigate('/game')}>
            Back to hub
          </button>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="device-backdrop flex items-center justify-center p-4">
        <div className="font-pixel text-center max-w-md space-y-4">
          <p
            className="text-[0.7rem] leading-relaxed"
            role="alert"
            style={{ color: 'var(--hp-red)' }}
          >
            {error}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              className="pixel-btn pixel-btn--primary"
              onClick={() => {
                setError('');
                setAttempt((n) => n + 1);
              }}
            >
              Retry
            </button>
            <button className="pixel-btn" onClick={() => navigate('/game')}>
              Back to hub
            </button>
          </div>
        </div>
      </div>
    );

  if (locked)
    return (
      <div className="device-backdrop flex items-center justify-center p-4">
        <div className="font-pixel text-center max-w-md space-y-4" style={{ color: 'var(--lcd-ink)' }}>
          <p className="text-[0.8rem] leading-relaxed">Level {levelNumber} is locked.</p>
          <p className="text-[0.65rem] leading-relaxed" style={{ color: 'var(--lcd-ink-dim)' }}>
            Beat the earlier levels to unlock this route.
          </p>
          <button className="pixel-btn mt-2" onClick={() => navigate('/game')}>
            Back to hub
          </button>
        </div>
      </div>
    );

  if (checkingReward)
    return <RewardPicker onClaimed={handleRewardDone} onEmpty={handleRewardDone} />;

  if (showComplete)
    return (
      <div className="device-backdrop flex items-center justify-center p-4">
        <div className="font-pixel text-center max-w-md space-y-4" style={{ color: 'var(--lcd-ink)' }}>
          <p className="text-[0.8rem] leading-relaxed">Level {levelNumber} complete.</p>
          {hasNextLevel ? (
            <>
              <p className="text-[0.65rem] leading-relaxed" style={{ color: 'var(--lcd-ink-dim)' }}>
                The road to Level {nextLevel} is open.
              </p>
              <button className="pixel-btn mt-2" onClick={() => navigate(`/level/${nextLevel}`)}>
                Continue to Level {nextLevel}
              </button>
            </>
          ) : (
            <p className="text-[0.65rem] leading-relaxed" style={{ color: 'var(--lcd-ink-dim)' }}>
              You beat the Legendary Gauntlet. You are the Champion of Kanto!
            </p>
          )}
          <div>
            <button className="pixel-btn mt-2" onClick={() => navigate('/game')}>
              Back to hub
            </button>
          </div>
        </div>
      </div>
    );

  if (viewBattle == null)
    return (
      <div className="device-backdrop flex items-center justify-center p-4">
        <p
          className="font-pixel text-[0.7rem]"
          style={{ color: 'var(--lcd-ink)' }}
        >
          Loading {levelName ? levelName : 'level data'}...
        </p>
      </div>
    );

  return (
    <BattleSim
      key={`${levelNumber}-${viewBattle}`}
      levelNumber={levelNumber}
      battleNumber={viewBattle}
      onBattleWon={handleBattleWon}
      onContinue={handleContinue}
    />
  );
};

export default Level;
