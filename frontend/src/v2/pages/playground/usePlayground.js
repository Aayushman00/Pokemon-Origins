import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../../../config";

const MAX_MESSAGES = 50;
const GUEST_NAME_KEY = "playground_guest_name";
const BUBBLE_MS = 4500;
const EMOTE_MS = 2600;

/** Kept for the tab session so a reload doesn't reroll the guest identity. */
function guestName() {
	try {
		const existing = sessionStorage.getItem(GUEST_NAME_KEY);
		if (existing) return existing;
		const name = `Guest${Math.floor(1000 + Math.random() * 9000)}`;
		sessionStorage.setItem(GUEST_NAME_KEY, name);
		return name;
	} catch {
		return `Guest${Math.floor(1000 + Math.random() * 9000)}`;
	}
}

/**
 * Socket.IO playground session (room:init, player:joined/moved/left,
 * chat:message, player:emote, move, chat:send, emote). `move` carries
 * { x, y, facing, run }; `emote` is one of the ids in Emote.jsx.
 * Positions live in a ref (they change every frame); the roster — who is
 * here — is React state so lists re-render only on join/leave.
 */
export default function usePlayground() {
	const [status, setStatus] = useState("connecting"); // connecting | ready | error
	const [selfId, setSelfId] = useState(null);
	const [roster, setRoster] = useState([]);
	const [messages, setMessages] = useState([]);
	const [bubbles, setBubbles] = useState({}); // trainerId -> { text, ts }
	const [emotes, setEmotes] = useState({}); // trainerId -> { emote, ts }
	const [world, setWorld] = useState({ width: 640, height: 448, chatRadius: 96 });
	const playersRef = useRef(new Map());
	const socketRef = useRef(null);

	const syncRoster = () =>
		setRoster(
			Array.from(playersRef.current.values()).map(({ trainerId, name, color, gender }) => ({ trainerId, name, color, gender }))
		);

	useEffect(() => {
		const token = localStorage.getItem("token");
		const socket = io(API_URL, { auth: token ? { token } : { name: guestName() } });
		socketRef.current = socket;

		socket.on("connect_error", () => setStatus("error"));
		socket.on("connect", () => setStatus((s) => (s === "error" ? "connecting" : s)));

		socket.on("room:init", ({ self, players, messages: initial, roomWidth, roomHeight, chatRadius }) => {
			const map = new Map();
			players.forEach((p) => map.set(p.trainerId, { ...p }));
			playersRef.current = map;
			setWorld((w) => ({
				width: roomWidth || w.width,
				height: roomHeight || w.height,
				chatRadius: chatRadius || w.chatRadius,
			}));
			setSelfId(self.trainerId);
			setMessages(initial || []);
			syncRoster();
			setStatus("ready");
		});

		socket.on("chat:message", (msg) => {
			setMessages((prev) => [...prev, msg].slice(-MAX_MESSAGES));
			setBubbles((prev) => ({ ...prev, [msg.trainerId]: { text: msg.text, ts: msg.ts } }));
			setTimeout(
				() =>
					setBubbles((prev) => {
						if (prev[msg.trainerId]?.ts !== msg.ts) return prev;
						const next = { ...prev };
						delete next[msg.trainerId];
						return next;
					}),
				BUBBLE_MS
			);
		});

		socket.on("player:emote", ({ trainerId, emote, ts }) => {
			setEmotes((prev) => ({ ...prev, [trainerId]: { emote, ts } }));
			setTimeout(
				() =>
					setEmotes((prev) => {
						if (prev[trainerId]?.ts !== ts) return prev;
						const next = { ...prev };
						delete next[trainerId];
						return next;
					}),
				EMOTE_MS
			);
		});

		socket.on("player:joined", (p) => {
			playersRef.current.set(p.trainerId, { ...p });
			syncRoster();
		});

		// Positions are map pixels at the start of each step; the Playground game walks everyone there.
		socket.on("player:moved", ({ trainerId, x, y, facing, run }) => {
			const p = playersRef.current.get(trainerId);
			if (p) Object.assign(p, { x, y, facing: facing || p.facing, run: !!run });
		});

		socket.on("player:left", ({ trainerId }) => {
			playersRef.current.delete(trainerId);
			syncRoster();
		});

		return () => socket.disconnect();
	}, []);

	// Proximity only: a typed "/all" prefix is escaped so it can't reach the whole map.
	const send = useCallback((text) => {
		const body = text.trim().replace(/^\/all(\s)/i, "⁠/all$1");
		if (!body) return false;
		socketRef.current?.emit("chat:send", body);
		return true;
	}, []);

	const emote = useCallback((id) => socketRef.current?.emit("emote", id), []);

	const emitMove = useCallback((step) => socketRef.current?.emit("move", step), []);

	return { status, selfId, roster, messages, bubbles, emotes, world, playersRef, send, emote, emitMove };
}
