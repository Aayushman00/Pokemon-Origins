import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, getErrorMessage } from "../../../api";
import Panel from "../../ui/Panel";
import Button from "../../ui/Button";
import BattleView from "./BattleView";
import RewardScreen from "./RewardScreen";
import "./battle.css";

// Highest authored campaign level (backend/data/campaign/level10.json).
export const MAX_CAMPAIGN_LEVEL = 10;

const Card = ({ title, children, actions }) => (
	<div className="page-center">
		<Panel lift className="journey-card">
			<h1 className="journey-card__title">{title}</h1>
			<div className="read">{children}</div>
			{actions && <div className="result__actions">{actions}</div>}
		</Panel>
	</div>
);

/**
 * /level/:levelNumber — walks one campaign level under server progress
 * locks. Same flow as V1: every "level finished" and every entry passes
 * through the reward check (pending boss offers survive refresh).
 */
const JourneyScreen = () => {
	const params = useParams();
	const levelNumber = Number(params.levelNumber || 1);
	const valid = Number.isInteger(levelNumber) && levelNumber >= 1 && levelNumber <= MAX_CAMPAIGN_LEVEL;

	const [levelName, setLevelName] = useState("");
	const [progress, setProgress] = useState(null);
	const [battleNumber, setBattleNumber] = useState(null);
	const [view, setView] = useState("loading"); // loading | locked | reward | battle | complete | error
	const [error, setError] = useState("");
	const [attempt, setAttempt] = useState(0);

	const load = useCallback(async () => {
		setView("loading");
		try {
			const { data } = await api.get("/api/campaign/progress");
			if (!data?.success || !data.progress) throw new Error(data?.error || "Failed to load campaign progress");
			const p = data.progress;
			setProgress(p);
			if (p.current_level < levelNumber) {
				setView("locked");
				return;
			}
			if (p.current_level === levelNumber) {
				const level = await api.get(`/api/campaign/level/${levelNumber}`);
				if (!level.data?.success || !level.data.battles?.length) throw new Error(level.data?.error || "This level has no battles");
				setLevelName(level.data.name || "");
			}
			setView("reward");
		} catch (err) {
			if (err.response?.status === 403) {
				setView("locked");
				return;
			}
			setError(getErrorMessage(err, "Couldn't load this level"));
			setView("error");
		}
	}, [levelNumber]);

	useEffect(() => {
		if (valid) load();
	}, [valid, load, attempt]);

	const afterReward = () => {
		if (!progress || progress.current_level > levelNumber) {
			setView("complete");
			return;
		}
		setBattleNumber(progress.current_battle);
		setView("battle");
	};

	if (!valid)
		return (
			<Card title="No such route" actions={<Button to="/game">Back to hub</Button>}>
				<p>The campaign has stages 1 to {MAX_CAMPAIGN_LEVEL}.</p>
			</Card>
		);

	if (view === "error")
		return (
			<Card
				title="Couldn't load this level"
				actions={
					<>
						<Button variant="primary" onClick={() => setAttempt((n) => n + 1)}>
							Try again
						</Button>
						<Button to="/game">Back to hub</Button>
					</>
				}
			>
				<p role="alert">{error}</p>
			</Card>
		);

	if (view === "locked")
		return (
			<Card title={`Stage ${levelNumber} is locked`} actions={<Button to="/game">Back to hub</Button>}>
				<p>Clear the earlier stages to open this road.</p>
			</Card>
		);

	if (view === "reward") return <RewardScreen onDone={afterReward} />;

	if (view === "complete") {
		const next = levelNumber + 1;
		return (
			<Card
				title={`${levelName || `Stage ${levelNumber}`} cleared!`}
				actions={
					<>
						{next <= MAX_CAMPAIGN_LEVEL && (
							<Button variant="go" to={`/level/${next}`}>
								Continue to stage {next}
							</Button>
						)}
						<Button to="/game">Back to hub</Button>
					</>
				}
			>
				<p>{next <= MAX_CAMPAIGN_LEVEL ? `The road to stage ${next} is open.` : "You beat the Legendary Gauntlet. You are the Champion!"}</p>
			</Card>
		);
	}

	if (view === "battle" && battleNumber != null)
		return (
			<BattleView
				key={`${levelNumber}-${battleNumber}`}
				levelNumber={levelNumber}
				battleNumber={battleNumber}
				levelName={levelName}
				onBattleWon={(p) => p && setProgress(p)}
				onContinue={() => setView("reward")}
			/>
		);

	return (
		<div className="page-center">
			<p className="loading-dots">Heading to {levelName || `stage ${levelNumber}`}</p>
		</div>
	);
};

export default JourneyScreen;
