import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "../../data/user";
import Tabs from "../../ui/Tabs";
import usePlayground from "./usePlayground";
import PlaygroundStage from "./PlaygroundStage";
import { ChatLog, Composer, Roster } from "./ChatParts";
import "../battle/battle.css"; // the touch pad's styles live with the battle pad
import "./playground.css";

const isTyping = (el) => !!el?.closest?.("input, textarea, select, [contenteditable=true]");

const Keys = ({ keys, label }) => (
	<span className="pg__legend-item">
		{keys.map((k) => (
			<kbd key={k} className="pg__key">
				{k}
			</kbd>
		))}
		<span>{label}</span>
	</span>
);

/** A game window: cream paper, plum frame, a pixel title plate. */
const Window = ({ title, className = "", children, ...rest }) => (
	<section className={`pg__window ${className}`} {...rest}>
		<h2 className="pg__window-title font-pixel">{title}</h2>
		{children}
	</section>
);

/** Social lobby: the park map, everyone on it, and proximity chat. */
const PlaygroundScreen = () => {
	const { user } = useUser();
	const play = usePlayground();
	const [tab, setTab] = useState("chat");
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

	// Enter jumps to the chat box, Escape hands the keys back to the map.
	useEffect(() => {
		const onKey = (e) => {
			if (e.key === "Enter" && !isTyping(e.target)) {
				const box = document.getElementById("chat-input");
				if (!box || box.disabled) return;
				e.preventDefault();
				setTab("chat");
				box.focus();
			} else if (e.key === "Escape" && e.target?.id === "chat-input") {
				e.target.blur();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const onlineIds = useMemo(() => new Set(play.roster.map((r) => r.trainerId)), [play.roster]);
	const me = play.roster.find((r) => r.trainerId === play.selfId);
	const count = play.roster.length;

	return (
		<div className="pg">
			<header className="pg__head">
				<div className="pg__plate font-pixel">
					<span className="pg__title">Playground</span>
					<span className="pg__count">
						<span className="presence presence--online" aria-hidden="true" />
						{play.status === "ready" ? `${count} here` : "Joining…"}
					</span>
				</div>
				<p className="pg__who read">
					{play.status === "ready" ? (
						<>
							You are <b>{me?.name || "…"}</b>
							{user ? "" : " (guest)"}. Trainers within six steps hear you.
						</>
					) : (
						"Walking over to the park…"
					)}
				</p>
				<div className="pg__legend font-pixel" aria-label="Controls">
					<Keys keys={["W", "A", "S", "D"]} label="Walk" />
					<Keys keys={["Shift"]} label="Run" />
					<Keys keys={["Enter"]} label="Chat" />
					<Keys keys={["Esc"]} label="Back to map" />
				</div>
			</header>

			{play.status === "error" ? (
				<Window title="Can't reach the Playground" className="pg__error">
					<p className="read">The Playground server is not answering. Check your connection and try again.</p>
					<button type="button" className="pg__retry font-pixel" onClick={() => window.location.reload()}>
						Try again
					</button>
				</Window>
			) : (
				<div className="pg__layout">
					<div className="pg__frame">
						{play.status === "ready" ? (
							<PlaygroundStage play={play} bubbles={play.bubbles} nearIds={nearIds} />
						) : (
							<p className="pg__loading font-pixel loading-dots">Joining the map</p>
						)}
					</div>

					<aside className="pg__side">
						<Tabs
							className="pg__tabs"
							label="Playground panels"
							value={tab}
							onChange={setTab}
							tabs={[
								{ id: "chat", label: "Chat" },
								{ id: "trainers", label: `Trainers (${count})` },
							]}
						/>
						<Window title={`Trainers · ${count}`} className="pg__roster" data-tab-active={tab === "trainers"}>
							<Roster roster={play.roster} selfId={play.selfId} nearIds={nearIds} />
						</Window>
						<Window title="Chat" className="pg__chat" data-tab-active={tab === "chat"}>
							<ChatLog messages={play.messages} selfId={play.selfId} onlineIds={onlineIds} />
							<Composer onSend={play.send} disabled={play.status !== "ready"} />
						</Window>
					</aside>
				</div>
			)}
		</div>
	);
};

export default PlaygroundScreen;
