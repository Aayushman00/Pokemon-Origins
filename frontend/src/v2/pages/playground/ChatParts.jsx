import React, { useEffect, useRef, useState } from "react";
import PixelAvatar from "../../ui/PixelAvatar";
import TrainerTrigger from "../../ui/TrainerHoverCard";
import Button from "../../ui/Button";
import { fetchProfile, isGuestId } from "../../data/profiles";

const MAX_LEN = 300;
const SEND_COOLDOWN_MS = 1000; // matches the server's per-trainer flood guard

const time = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Chat history as a trainer log: avatar, name (hover for profile), channel, time. */
export const ChatLog = ({ messages, selfId, onlineIds }) => {
	const ref = useRef(null);
	const stick = useRef(true);

	useEffect(() => {
		const el = ref.current;
		if (el && stick.current) el.scrollTop = el.scrollHeight;
	}, [messages]);

	if (!messages.length) {
		return (
			<div className="chatlog chatlog--empty">
				<p className="read">
					No one has said anything yet. Say hello — trainers inside your earshot ring hear you, or switch to Everyone to reach the whole map.
				</p>
			</div>
		);
	}

	return (
		<ol
			ref={ref}
			className="chatlog"
			aria-label="Messages"
			onScroll={(e) => {
				const el = e.currentTarget;
				stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
			}}
		>
			{messages.map((m, i) => {
				const prev = messages[i - 1];
				const grouped = prev && prev.trainerId === m.trainerId && m.ts - prev.ts < 120000 && prev.broadcast === m.broadcast;
				const mine = m.trainerId === selfId;
				const guest = isGuestId(m.trainerId);
				return (
					<li key={`${m.trainerId}-${m.ts}`} className={`msg ${mine ? "msg--mine" : ""} ${grouped ? "msg--grouped" : ""}`}>
						{!grouped && (
							<div className="msg__head">
								{mine ? (
									<span className="trainer-trigger">
										<PixelAvatar seed={m.trainerId} guest={guest} size={28} />
										<span className="trainer-trigger__name msg__name">{m.name}</span>
									</span>
								) : (
									<TrainerTrigger trainerId={m.trainerId} name={m.name} online={onlineIds.has(m.trainerId)}>
										<PixelAvatar seed={m.trainerId} guest={guest} size={28} />
										<span className="trainer-trigger__name msg__name">{m.name}</span>
									</TrainerTrigger>
								)}
								{guest && <span className="msg__tag">Guest</span>}
								<span className={`msg__tag ${m.broadcast ? "msg__tag--all" : ""}`}>{m.broadcast ? "Everyone" : "Nearby"}</span>
								<time className="msg__time" dateTime={new Date(m.ts).toISOString()}>
									{time(m.ts)}
								</time>
							</div>
						)}
						<p className="msg__text read">{m.text}</p>
					</li>
				);
			})}
		</ol>
	);
};

/** Message box with a Nearby / Everyone channel switch. */
export const Composer = ({ onSend, disabled }) => {
	const [text, setText] = useState("");
	const [everyone, setEveryone] = useState(false);
	const [cooling, setCooling] = useState(false);

	const submit = (e) => {
		e.preventDefault();
		if (cooling || !onSend(text, { everyone })) return;
		setText("");
		setCooling(true);
		setTimeout(() => setCooling(false), SEND_COOLDOWN_MS);
	};

	return (
		<form className="composer" onSubmit={submit}>
			<div className="composer__channels" role="radiogroup" aria-label="Who hears you">
				<button type="button" role="radio" aria-checked={!everyone} className="tab" onClick={() => setEveryone(false)}>
					Nearby
				</button>
				<button type="button" role="radio" aria-checked={everyone} className="tab" onClick={() => setEveryone(true)}>
					Everyone
				</button>
				<span className="composer__count muted" aria-live="polite">
					{text.length > MAX_LEN - 40 ? `${MAX_LEN - text.length} left` : ""}
				</span>
			</div>
			<div className="composer__row">
				<label htmlFor="chat-input" className="sr-only">
					Message
				</label>
				<input
					id="chat-input"
					className="field__input composer__input"
					value={text}
					onChange={(e) => setText(e.target.value)}
					maxLength={MAX_LEN}
					autoComplete="off"
					placeholder={everyone ? "Message everyone on the map" : "Message trainers in earshot"}
					disabled={disabled}
				/>
				<Button type="submit" variant="primary" disabled={disabled || cooling || !text.trim()}>
					Send
				</Button>
			</div>
		</form>
	);
};

const RosterRow = ({ p, self, near }) => {
	const guest = isGuestId(p.trainerId);
	const [info, setInfo] = useState(null);
	useEffect(() => {
		if (guest) return;
		let alive = true;
		fetchProfile(p.trainerId).then((r) => alive && setInfo(r));
		return () => {
			alive = false;
		};
	}, [p.trainerId, guest]);

	const prof = info?.status === "ok" ? info.profile : null;
	const sub = guest
		? "Guest, no account"
		: prof
		? `${prof.campaign.champion ? "Champion" : `Stage ${prof.campaign.current_level}`}, ${prof.record.wins} win${prof.record.wins === 1 ? "" : "s"}`
		: info
		? "Unknown trainer"
		: "…";

	const body = (
		<>
			<span className="roster__avatar">
				<PixelAvatar seed={p.trainerId} guest={guest} size={36} />
				<span className={`presence ${guest ? "presence--guest" : "presence--online"} roster__dot`} aria-hidden="true" />
			</span>
			<span className="roster__text">
				<span className="trainer-trigger__name roster__name">
					{p.name}
					{self && <span className="muted"> (you)</span>}
				</span>
				<span className="roster__sub">{sub}</span>
			</span>
		</>
	);

	return (
		<li className={`roster__row ${near && !self ? "is-near" : ""}`}>
			{self ? <span className="trainer-trigger">{body}</span> : <TrainerTrigger trainerId={p.trainerId} name={p.name} online>{body}</TrainerTrigger>}
			{near && !self && <span className="roster__near">In earshot</span>}
		</li>
	);
};

/** Everyone currently on the map, you first, then registered, then guests. */
export const Roster = ({ roster, selfId, nearIds }) => {
	const sorted = [...roster].sort((a, b) => {
		if (a.trainerId === selfId) return -1;
		if (b.trainerId === selfId) return 1;
		const ga = isGuestId(a.trainerId);
		const gb = isGuestId(b.trainerId);
		if (ga !== gb) return ga ? 1 : -1;
		return String(a.name).localeCompare(String(b.name));
	});
	return (
		<ul className="roster" aria-label="Trainers on the map">
			{sorted.map((p) => (
				<RosterRow key={p.trainerId} p={p} self={p.trainerId === selfId} near={nearIds.has(p.trainerId)} />
			))}
		</ul>
	);
};
