import React, { useCallback, useEffect, useState } from "react";
import usePlayground from "./usePlayground";
import PlaygroundStage from "./PlaygroundStage";
import LadderPanel from "./LadderPanel";
import MartScreen from "../mart/MartScreen";
import { ChatLog, Composer, Roster } from "./ChatParts";
import BattleView from "../battle/BattleView";
import { parkBusy } from "./playgroundGame";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import "../battle/battle.css"; // the touch pad's styles live with the battle pad
import "./playground.css";

const isTyping = (el) => !!el?.closest?.("input, textarea, select, [contenteditable=true]");

/** A game window: dark panel, bevelled frame, a pixel title plate. */
const Window = ({ title, badge, className = "", children }) => (
	<section className={`pg__window ${className}`}>
		<h2 className="pg__window-title font-pixel">
			{title}
			{badge != null && <span className="pg__badge">{badge}</span>}
		</h2>
		{children}
	</section>
);

/** Social lobby: the park map, everyone on it, and proximity chat. */
const PlaygroundScreen = () => {
	const play = usePlayground();
	const [nearIds, setNearIds] = useState(new Set());
	const [confirmId, setConfirmId] = useState(null); // trainer you are about to challenge
	const [ladderOpen, setLadderOpen] = useState(false);
	const [martOpen, setMartOpen] = useState(false);
	const [standsOpen, setStandsOpen] = useState(false); // the benches: pick a live match to watch // the barrel stall's Mart, over the park
	const [park, setPark] = useState(null); // a wild battle from the park's tall grass: { key }
	const { pvp, clearNotice } = play;
	const signedIn = Number.isInteger(play.selfId);
	const nameOf = (id) => play.roster.find((r) => r.trainerId === id)?.name || "that trainer";

	// Notices (declined, too far, …) fade on their own.
	useEffect(() => {
		if (!pvp.notice) return undefined;
		const t = setTimeout(clearNotice, 4000);
		return () => clearTimeout(t);
	}, [pvp.notice, clearNotice]);

	// Tall grass: signed-in trainers only, and only while the server has catching on.
	const meetWild = useCallback(() => setPark({ key: Date.now() }), []);
	const leavePark = useCallback(() => setPark(null), []);

	// Busy in the grass (or in the stands): a challenge that lands now is turned down for you.
	const { respond } = play;
	const away = !!park || !!play.watching;
	useEffect(() => {
		if (parkBusy(pvp.incoming, away)) respond(pvp.incoming.fromId, false);
	}, [pvp.incoming, away, respond]);

	// Plaza spots the screen answers: the notice board's ladder, the Mart stall.
	const onSpot = useCallback((kind) => {
		if (kind === "board") setLadderOpen(true);
		else if (kind === "mart") setMartOpen(true);
		else if (kind === "stands") setStandsOpen(true);
		else return false;
		return true;
	}, []);

	const askChallenge = useCallback(
		(id) => {
			if (!signedIn || !Number.isInteger(id) || pvp.outgoing != null) return;
			setConfirmId(id);
		},
		[signedIn, pvp.outgoing]
	);

	// "In earshot" is derived from live positions twice a second, not per frame.
	useEffect(() => {
		const id = setInterval(() => {
			const me = play.playersRef.current.get(play.selfId);
			if (!me) return;
			const next = new Set();
			play.playersRef.current.forEach((p, pid) => {
				if (pid !== play.selfId && Math.hypot(p.x - me.x, p.y - me.y) <= play.world.chatRadius) next.add(pid);
			});
			setNearIds((prev) => (prev.size === next.size && [...next].every((x) => prev.has(x)) ? prev : next));
		}, 500);
		return () => clearInterval(id);
	}, [play.playersRef, play.selfId, play.world.chatRadius]);

	// Enter jumps to the chat box, Escape hands the keys back to the map. Captured
	// before the game's input sees it, so Enter never doubles as the A button.
	useEffect(() => {
		const onKey = (e) => {
			if (e.key === "Enter" && !isTyping(e.target)) {
				const box = document.getElementById("chat-input");
				if (!box || box.disabled) return;
				e.preventDefault();
				e.stopPropagation();
				box.focus();
			} else if (e.key === "Escape" && e.target?.id === "chat-input") {
				e.target.blur();
			}
		};
		window.addEventListener("keydown", onKey, true);
		return () => window.removeEventListener("keydown", onKey, true);
	}, []);

	const ready = play.status === "ready";

	if (play.status === "error") {
		return (
			<div className="pg">
				<Window title="Can't reach the Playground" className="pg__error">
					<p className="read">The Playground server is not answering. Check your connection and try again.</p>
					<button type="button" className="pg__retry font-pixel" onClick={() => window.location.reload()}>
						Try again
					</button>
				</Window>
			</div>
		);
	}

	// A live match takes the whole screen; the socket (and so the match) stays up underneath.
	if (pvp.match) {
		return (
			<BattleView
				key={pvp.match.matchId}
				transport={pvp.match.transport}
				levelName="Playground battle"
				onContinue={play.leaveMatch}
				onLost={play.leaveMatch}
				onLeave={play.leaveMatch}
			/>
		);
	}

	if (play.watching) {
		return (
			<BattleView
				key={play.watching.matchId}
				transport={play.watching.transport}
				levelName="Battle stands"
				onContinue={play.stopWatching}
				onLeave={play.stopWatching}
				onLost={play.stopWatching}
			/>
		);
	}

	if (park) {
		return (
			<BattleView
				key={park.key}
				wild="playground"
				levelName="In the park's tall grass"
				onContinue={leavePark}
				onLeave={leavePark}
				onLost={leavePark}
				onRun={leavePark}
			/>
		);
	}

	const busy = confirmId != null || ladderOpen || martOpen || standsOpen || !!pvp.incoming;

	return (
		<div className="pg">
			<div className="pg__layout">
				<div className="pg__frame">
					{ready ? (
						<PlaygroundStage play={play} nearIds={nearIds} busy={busy} onSpot={onSpot} onTrainer={askChallenge} onWild={signedIn && play.catchOn ? meetWild : undefined} />
					) : (
						<p className="pg__loading font-pixel loading-dots">Joining the park</p>
					)}
					{(pvp.notice || pvp.outgoing != null) && (
						<p className="pg__notice" role="status">
							{pvp.notice?.text || `Waiting for ${nameOf(pvp.outgoing)} to answer…`}
						</p>
					)}
				</div>
				<aside className="pg__side">
					<Window title="Trainers" badge={ready ? play.roster.length : "…"} className="pg__roster">
						<Roster roster={play.roster} selfId={play.selfId} nearIds={nearIds} onChallenge={signedIn ? askChallenge : undefined} />
					</Window>
					<Window title="Nearby chat" className="pg__chat">
						<ChatLog messages={play.messages} selfId={play.selfId} roster={play.roster} />
						<Composer onSend={play.send} disabled={!ready} />
					</Window>
				</aside>
			</div>

			<Modal open={confirmId != null} onClose={() => setConfirmId(null)} title="Challenge">
				<p className="read">Challenge {nameOf(confirmId)} to a battle? Both teams fight at level 50.</p>
				<div className="result__actions">
					<Button
						variant="go"
						onClick={() => {
							play.challenge(confirmId);
							setConfirmId(null);
						}}
					>
						Challenge
					</Button>
					<Button onClick={() => setConfirmId(null)}>Not now</Button>
				</div>
			</Modal>

			<Modal open={!!pvp.incoming} onClose={() => play.respond(pvp.incoming.fromId, false)} title="Challenge!">
				<p className="read">{pvp.incoming?.name} wants to battle! Both teams fight at level 50.</p>
				<div className="result__actions">
					<Button variant="go" onClick={() => play.respond(pvp.incoming.fromId, true)}>
						Accept
					</Button>
					<Button onClick={() => play.respond(pvp.incoming.fromId, false)}>Decline</Button>
				</div>
			</Modal>

			<Modal open={ladderOpen} onClose={() => setLadderOpen(false)} title="Park ladder">
				<LadderPanel selfId={play.selfId} />
			</Modal>

			<Modal open={standsOpen} onClose={() => setStandsOpen(false)} title="Battle stands">
				{play.matches.length === 0 ? (
					<p className="read muted">No battles right now. Challenge someone, or check back soon.</p>
				) : (
					<ul className="stands">
						{play.matches.map((m) => (
							<li key={m.matchId} className="stands__row">
								<span>
									{m.names.player} vs {m.names.enemy}
									{m.round ? <span className="muted"> · round {m.round}</span> : null}
								</span>
								<Button
									size="sm"
									onClick={() => {
										setStandsOpen(false);
										play.watch(m.matchId);
									}}
								>
									Watch
								</Button>
							</li>
						))}
					</ul>
				)}
			</Modal>

			<Modal open={martOpen} onClose={() => setMartOpen(false)} title="Mart stall">
				{martOpen && (
					<div className="pg__mart">
						<MartScreen onClose={() => setMartOpen(false)} />
					</div>
				)}
			</Modal>
		</div>
	);
};

export default PlaygroundScreen;
