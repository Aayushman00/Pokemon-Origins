import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "../../data/user";
import Panel from "../../ui/Panel";
import Tabs from "../../ui/Tabs";
import Button from "../../ui/Button";
import usePlayground from "./usePlayground";
import World from "./World";
import { ChatLog, Composer, Roster } from "./ChatParts";
import "./playground.css";

/** Social lobby: overworld map + trainer roster + proximity chat. */
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

	const onlineIds = useMemo(() => new Set(play.roster.map((r) => r.trainerId)), [play.roster]);

	if (play.status === "error") {
		return (
			<div className="page-center">
				<Panel lift title="Can't reach the Playground" className="journey-card">
					<p className="read">The Playground server is not answering. Check your connection and try again.</p>
					<div className="result__actions">
						<Button variant="primary" onClick={() => window.location.reload()}>
							Try again
						</Button>
					</div>
				</Panel>
			</div>
		);
	}

	const me = play.roster.find((r) => r.trainerId === play.selfId);

	return (
		<div className="pg">
			<header className="pg__head">
				<div>
					<h1 className="pg__title">Playground</h1>
					<p className="pg__sub read">
						{play.status === "ready"
							? `${play.roster.length} trainer${play.roster.length === 1 ? "" : "s"} here. You are ${me?.name || "…"}${user ? "" : " (guest)"}.`
							: "Joining the map…"}
					</p>
				</div>
				<p className="pg__hint read">Click or tap the ground to walk. Point at or tap a name to see their trainer card.</p>
			</header>

			<div className="pg__layout">
				<Panel plate={`Trainers (${play.roster.length})`} className="pg__roster" data-tab-active={tab === "trainers"}>
					<Roster roster={play.roster} selfId={play.selfId} nearIds={nearIds} />
				</Panel>

				<div className="pg__world frame">
					{play.status === "ready" ? <World play={play} bubbles={play.bubbles} /> : <p className="pg__loading loading-dots">Joining the map</p>}
				</div>

				<Tabs
					className="pg__tabs"
					label="Playground panels"
					value={tab}
					onChange={setTab}
					tabs={[
						{ id: "chat", label: "Chat" },
						{ id: "trainers", label: `Trainers (${play.roster.length})` },
					]}
				/>

				<Panel plate="Chat" className="pg__chat" data-tab-active={tab === "chat"}>
					<ChatLog messages={play.messages} selfId={play.selfId} onlineIds={onlineIds} />
					<Composer onSend={play.send} disabled={play.status !== "ready"} />
				</Panel>
			</div>
		</div>
	);
};

export default PlaygroundScreen;
