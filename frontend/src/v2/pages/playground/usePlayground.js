import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../../../config";

const MAX_MESSAGES = 50;
const GUEST_NAME_KEY = "playground_guest_name";
const BUBBLE_MS = 4500;

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
 * Socket.IO playground session (same protocol as V1: room:init,
 * player:joined/moved/left, chat:message, move, chat:send).
 * Positions live in a ref (they change every frame); the roster — who is
 * here — is React state so lists re-render only on join/leave.
 */
export default function usePlayground() {
	const [status, setStatus] = useState("connecting"); // connecting | ready | error
	const [selfId, setSelfId] = useState(null);
	const [roster, setRoster] = useState([]);
	const [messages, setMessages] = useState([]);
	const [bubbles, setBubbles] = useState({}); // trainerId -> { text, ts }
	const [world, setWorld] = useState({ width: 3000, height: 2000, chatRadius: 250 });
	const playersRef = useRef(new Map());
	const socketRef = useRef(null);

	const syncRoster = () =>
		setRoster(
			Array.from(playersRef.current.values()).map(({ trainerId, name, color }) => ({ trainerId, name, color }))
		);

	useEffect(() => {
		const token = localStorage.getItem("token");
		const socket = io(API_URL, { auth: token ? { token } : { name: guestName() } });
		socketRef.current = socket;

		socket.on("connect_error", () => setStatus("error"));
		socket.on("connect", () => setStatus((s) => (s === "error" ? "connecting" : s)));

		socket.on("room:init", ({ self, players, messages: initial, roomWidth, roomHeight, chatRadius }) => {
			const map = new Map();
			players.forEach((p) => map.set(p.trainerId, { ...p, targetX: p.x, targetY: p.y }));
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

		socket.on("player:joined", (p) => {
			playersRef.current.set(p.trainerId, { ...p, targetX: p.x, targetY: p.y });
			syncRoster();
		});

		socket.on("player:moved", ({ trainerId, x, y }) => {
			const p = playersRef.current.get(trainerId);
			if (p) {
				p.targetX = x;
				p.targetY = y;
			}
		});

		socket.on("player:left", ({ trainerId }) => {
			playersRef.current.delete(trainerId);
			syncRoster();
		});

		return () => socket.disconnect();
	}, []);

	const send = useCallback((text, { everyone = false } = {}) => {
		const body = text.trim();
		if (!body) return false;
		socketRef.current?.emit("chat:send", everyone ? `/all ${body}` : body);
		return true;
	}, []);

	const emitMove = useCallback((x, y) => socketRef.current?.emit("move", { x, y }), []);

	return { status, selfId, roster, messages, bubbles, world, playersRef, send, emitMove };
}
