import React, { useEffect, useState } from "react";
import usePlayground from "./usePlayground";
import PlaygroundStage from "./PlaygroundStage";
import { ChatLog, Composer, Roster } from "./ChatParts";
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

	return (
		<div className="pg">
			<div className="pg__layout">
				<div className="pg__frame">
					{ready ? <PlaygroundStage play={play} nearIds={nearIds} /> : <p className="pg__loading font-pixel loading-dots">Joining the park</p>}
				</div>
				<aside className="pg__side">
					<Window title="Trainers" badge={ready ? play.roster.length : "…"} className="pg__roster">
						<Roster roster={play.roster} selfId={play.selfId} nearIds={nearIds} />
					</Window>
					<Window title="Nearby chat" className="pg__chat">
						<ChatLog messages={play.messages} selfId={play.selfId} roster={play.roster} />
						<Composer onSend={play.send} disabled={!ready} />
					</Window>
				</aside>
			</div>
		</div>
	);
};

export default PlaygroundScreen;
