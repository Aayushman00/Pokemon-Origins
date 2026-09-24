import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../data/user";
import useBattle, { TEXT_SPEEDS } from "../../battle/useBattle";
import DialogueBox from "../../ui/DialogueBox";
import Button from "../../ui/Button";
import Panel from "../../ui/Panel";
import BattleStage from "./BattleStage";
import { BagMenu, CommandMenu, MoveMenu, PartyMenu, RestartMenu, ResultPanel } from "./BattleMenus";
import "./battle.css";

const SPEED_KEY = "battlesim.textSpeed";
const readSpeed = () => {
	try {
		return localStorage.getItem(SPEED_KEY) === "fast" ? "fast" : "normal";
	} catch {
		return "normal";
	}
};

/** Battle screen: stage on top, FRLG-style text + command boxes below. */
const BattleView = ({ levelNumber, battleNumber, levelName, onBattleWon, onContinue }) => {
	const navigate = useNavigate();
	const { user } = useUser();
	const [speed, setSpeed] = useState(readSpeed);
	const battle = useBattle({ levelNumber, battleNumber, trainerId: user?.trainer_id, onBattleWon, textSpeed: speed });
	const { phase, player, session } = battle;

	const toggleSpeed = () => {
		const next = speed === "fast" ? "normal" : "fast";
		setSpeed(next);
		try {
			localStorage.setItem(SPEED_KEY, next);
		} catch {
			/* speed just won't persist */
		}
	};

	if (battle.error) {
		return (
			<div className="page-center">
				<Panel title="The battle couldn't continue" lift className="battle-error">
					<p className="read" role="alert">
						{battle.error}
					</p>
					<div className="result__actions">
						<Button variant="primary" onClick={() => battle.restart()}>
							Try again
						</Button>
						<Button onClick={() => navigate("/game")}>Back to hub</Button>
					</div>
				</Panel>
			</div>
		);
	}

	const opponent = session ? (session.battleType === "legendary" ? `Wild ${session.enemy?.nickname}` : session.trainerName) : null;
	const prompt = player ? `What will ${player.nickname} do?` : "";
	const messageText = battle.line || (phase === "acting" ? "" : phase === "loading" || phase === "restarting" ? "…" : prompt);

	let hud;
	if (phase === "moveSelect") hud = <MoveMenu battle={battle} />;
	else if (phase === "partySelect") hud = <PartyMenu battle={battle} />;
	else if (phase === "bagSelect") hud = <BagMenu battle={battle} />;
	else if (phase === "finished") hud = <ResultPanel battle={battle} onContinue={onContinue} onLeave={() => navigate("/game")} />;
	else if (phase === "command" || phase === "restartConfirm") {
		hud = (
			<div className="hud__split hud__split--cmd">
				<DialogueBox
					text={phase === "restartConfirm" ? "Restart this battle from the beginning?" : battle.line || prompt}
					keys={false}
					charMs={TEXT_SPEEDS[speed]}
					className="hud__dialogue"
				/>
				{phase === "command" ? <CommandMenu battle={battle} /> : <RestartMenu battle={battle} />}
			</div>
		);
	} else {
		hud = <DialogueBox text={messageText} onSkip={battle.skipLine} charMs={TEXT_SPEEDS[speed]} showNext className="hud__dialogue" />;
	}

	return (
		<div className="battle">
			<div className="battle__bar">
				<p className="battle__where">
					<strong>{levelName || `Stage ${levelNumber}`}</strong>
					<span className="muted"> battle {battleNumber}</span>
					{opponent && <span className="battle__vs"> against {opponent}</span>}
				</p>
				<div className="battle__controls">
					<button type="button" className="chip-btn" onClick={toggleSpeed} aria-pressed={speed === "fast"} title="Text speed">
						Text: {speed === "fast" ? "Fast" : "Normal"}
					</button>
					<button type="button" className="chip-btn" onClick={() => navigate("/game")} title="Your battle is saved on the server; you can resume it">
						Leave
					</button>
				</div>
			</div>

			<div className="battle__layout">
				<div className="battle__main">
					<div className="battle__frame">
						<BattleStage battle={battle} />
					</div>
					<div className="hud">{hud}</div>
					<p className="battle__keys muted">
						Arrows move the cursor. Enter or Z confirms, Esc or X goes back. Click the text box to speed it up.
					</p>
				</div>

				<aside className="battle__rail" aria-label="Battle log">
					<Panel plate="Battle log" className="log">
						<ol className="log__list">
							{battle.log.map((l, i) => (
								<li key={i}>{l}</li>
							))}
						</ol>
					</Panel>
				</aside>
			</div>
		</div>
	);
};

export default BattleView;
