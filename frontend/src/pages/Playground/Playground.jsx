import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../../config";
import "./Playground.css";

const LERP_FACTOR = 0.25;
const MOVE_EMIT_INTERVAL_MS = 50; // ~20/sec
const MAX_CLIENT_MESSAGES = 50;
const GUEST_NAME_KEY = "playground_guest_name";

/** Kept for the tab session so a reconnect/reload doesn't reroll a new guest identity. */
function getOrCreateGuestName() {
  try {
    const existing = sessionStorage.getItem(GUEST_NAME_KEY);
    if (existing) return existing;
    const name = `Guest${Math.floor(1000 + Math.random() * 9000)}`;
    sessionStorage.setItem(GUEST_NAME_KEY, name);
    return name;
  } catch {
    // Private browsing / blocked storage: fall back to a one-off name.
    return `Guest${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

const Playground = () => {
  const [selfId, setSelfId] = useState(null);
  const [connectError, setConnectError] = useState(false);
  const [, forceRender] = useState(0);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const playersRef = useRef(new Map()); // trainerId -> {trainerId,name,initial,color,x,y,targetX,targetY}
  const socketRef = useRef(null);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const lastEmitRef = useRef(0);
  const chatLogRef = useRef(null);

  const rerender = () => forceRender((n) => n + 1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const auth = token ? { token } : { name: getOrCreateGuestName() };
    const socket = io(API_URL, { auth });
    socketRef.current = socket;

    socket.on("connect_error", () => setConnectError(true));

    socket.on("room:init", ({ self, players, messages: initialMessages }) => {
      const map = new Map();
      players.forEach((p) => map.set(p.trainerId, { ...p, targetX: p.x, targetY: p.y }));
      playersRef.current = map;
      setSelfId(self.trainerId);
      setMessages(initialMessages || []);
      rerender();
    });

    socket.on("chat:message", (msg) => {
      setMessages((prev) => {
        const next = [...prev, msg];
        return next.length > MAX_CLIENT_MESSAGES ? next.slice(next.length - MAX_CLIENT_MESSAGES) : next;
      });
    });

    socket.on("player:joined", (player) => {
      playersRef.current.set(player.trainerId, {
        ...player,
        targetX: player.x,
        targetY: player.y,
      });
      rerender();
    });

    socket.on("player:moved", ({ trainerId, x, y }) => {
      const existing = playersRef.current.get(trainerId);
      if (existing) {
        existing.targetX = x;
        existing.targetY = y;
      }
    });

    socket.on("player:left", ({ trainerId }) => {
      playersRef.current.delete(trainerId);
      rerender();
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      let changed = false;
      playersRef.current.forEach((player, id) => {
        if (draggingRef.current && id === selfId) return;
        const dx = player.targetX - player.x;
        const dy = player.targetY - player.y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          player.x += dx * LERP_FACTOR;
          player.y += dy * LERP_FACTOR;
          changed = true;
        }
      });
      if (changed) rerender();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selfId]);

  useEffect(() => {
    const el = chatLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const pointToRoom = (clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.min(Math.max(clientX - rect.left, 0), rect.width),
      y: Math.min(Math.max(clientY - rect.top, 0), rect.height),
    };
  };

  const handlePointerDown = () => {
    if (selfId != null) draggingRef.current = true;
  };

  const handlePointerMove = (event) => {
    if (!draggingRef.current || selfId == null) return;
    const { x, y } = pointToRoom(event.clientX, event.clientY);
    const self = playersRef.current.get(selfId);
    if (self) {
      self.x = x;
      self.y = y;
      self.targetX = x;
      self.targetY = y;
      rerender();
    }
    const now = performance.now();
    if (now - lastEmitRef.current > MOVE_EMIT_INTERVAL_MS) {
      lastEmitRef.current = now;
      socketRef.current?.emit("move", { x, y });
    }
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const self = playersRef.current.get(selfId);
    if (self) {
      socketRef.current?.emit("move", { x: self.x, y: self.y });
    }
  };

  const handleChatSubmit = (event) => {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    socketRef.current?.emit("chat:send", text);
    setChatInput("");
  };

  if (connectError) {
    return (
      <div className="playground-error font-pixel">
        Could not connect to the Playground.
      </div>
    );
  }

  return (
    <div className="playground-layout">
      <div
        className="playground-room"
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {Array.from(playersRef.current.values()).map((player) => (
          <div
            key={player.trainerId}
            className={`playground-avatar${player.trainerId === selfId ? " is-self" : ""}`}
            style={{ left: player.x, top: player.y, background: player.color }}
            onPointerDown={player.trainerId === selfId ? handlePointerDown : undefined}
          >
            {player.initial}
          </div>
        ))}
      </div>

      <div className="playground-chat">
        <div className="playground-chat-log" ref={chatLogRef}>
          {messages.map((msg) => (
            <div key={`${msg.trainerId}-${msg.ts}`} className="playground-chat-message">
              <span className="playground-chat-author">{msg.name}:</span> {msg.text}
            </div>
          ))}
        </div>
        <form className="playground-chat-form" onSubmit={handleChatSubmit}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            maxLength={300}
            placeholder="Say something..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
};

export default Playground;
