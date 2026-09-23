import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../../config";
import "./Playground.css";

const LERP_FACTOR = 0.25;
const MOVE_EMIT_INTERVAL_MS = 50; // ~20/sec
const MAX_CLIENT_MESSAGES = 50;
const GUEST_NAME_KEY = "playground_guest_name";

// The room div is a fixed-size viewport onto a larger world; the world's
// real size comes from the server (room:init) since only it knows the
// authoritative bounds movement is clamped against.
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;
const CAMERA_LERP = 0.15;
const DEFAULT_CHAT_RADIUS = 250;
// Avatar drag was 1:1 with the cursor (snapping straight to pointer
// position), which reads as too fast. Scale cursor movement down instead.
const DRAG_SPEED_FACTOR = 0.45;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

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

  const worldSizeRef = useRef({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });
  const chatRadiusRef = useRef(DEFAULT_CHAT_RADIUS);
  const cameraRef = useRef({ x: VIEWPORT_WIDTH / 2, y: VIEWPORT_HEIGHT / 2 });
  const panningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, camX: 0, camY: 0 });
  const dragLastClientRef = useRef({ x: 0, y: 0 });

  const rerender = () => forceRender((n) => n + 1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const auth = token ? { token } : { name: getOrCreateGuestName() };
    const socket = io(API_URL, { auth });
    socketRef.current = socket;

    socket.on("connect_error", () => setConnectError(true));

    socket.on("room:init", ({ self, players, messages: initialMessages, roomWidth, roomHeight, chatRadius }) => {
      const map = new Map();
      players.forEach((p) => map.set(p.trainerId, { ...p, targetX: p.x, targetY: p.y }));
      playersRef.current = map;
      if (roomWidth && roomHeight) worldSizeRef.current = { width: roomWidth, height: roomHeight };
      if (chatRadius) chatRadiusRef.current = chatRadius;
      cameraRef.current = clampCamera(self.x, self.y);
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

      // Camera auto-follows the self player unless a manual pan is in
      // progress; releasing the pan lets it lerp back to following.
      if (!panningRef.current && selfId != null) {
        const self = playersRef.current.get(selfId);
        if (self) {
          const desired = clampCamera(self.x, self.y);
          const cam = cameraRef.current;
          const camDx = desired.x - cam.x;
          const camDy = desired.y - cam.y;
          if (Math.abs(camDx) > 0.25 || Math.abs(camDy) > 0.25) {
            cameraRef.current = { x: cam.x + camDx * CAMERA_LERP, y: cam.y + camDy * CAMERA_LERP };
            changed = true;
          }
        }
      }

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

  function clampCamera(x, y) {
    const { width, height } = worldSizeRef.current;
    const halfW = VIEWPORT_WIDTH / 2;
    const halfH = VIEWPORT_HEIGHT / 2;
    return {
      x: clamp(x, halfW, Math.max(halfW, width - halfW)),
      y: clamp(y, halfH, Math.max(halfH, height - halfH)),
    };
  }

  const handleAvatarPointerDown = (event) => {
    if (selfId == null) return;
    event.stopPropagation();
    draggingRef.current = true;
    dragLastClientRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleRoomPointerDown = (event) => {
    if (draggingRef.current) return; // dragging own avatar takes priority
    panningRef.current = true;
    const cam = cameraRef.current;
    panStartRef.current = { x: event.clientX, y: event.clientY, camX: cam.x, camY: cam.y };
  };

  const handlePointerMove = (event) => {
    if (draggingRef.current && selfId != null) {
      const last = dragLastClientRef.current;
      const dxScreen = event.clientX - last.x;
      const dyScreen = event.clientY - last.y;
      dragLastClientRef.current = { x: event.clientX, y: event.clientY };

      const self = playersRef.current.get(selfId);
      if (self) {
        const x = clamp(self.x + dxScreen * DRAG_SPEED_FACTOR, 0, worldSizeRef.current.width);
        const y = clamp(self.y + dyScreen * DRAG_SPEED_FACTOR, 0, worldSizeRef.current.height);
        self.x = x;
        self.y = y;
        self.targetX = x;
        self.targetY = y;
        rerender();

        const now = performance.now();
        if (now - lastEmitRef.current > MOVE_EMIT_INTERVAL_MS) {
          lastEmitRef.current = now;
          socketRef.current?.emit("move", { x, y });
        }
      }
      return;
    }

    if (panningRef.current) {
      const start = panStartRef.current;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      cameraRef.current = clampCamera(start.camX - dx, start.camY - dy);
      rerender();
    }
  };

  const handlePointerUp = () => {
    if (draggingRef.current) {
      draggingRef.current = false;
      const self = playersRef.current.get(selfId);
      if (self) {
        socketRef.current?.emit("move", { x: self.x, y: self.y });
      }
    }
    panningRef.current = false;
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
        onPointerDown={handleRoomPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="playground-world"
          style={{
            width: worldSizeRef.current.width,
            height: worldSizeRef.current.height,
            transform: `translate(${-(cameraRef.current.x - VIEWPORT_WIDTH / 2)}px, ${-(
              cameraRef.current.y - VIEWPORT_HEIGHT / 2
            )}px)`,
          }}
        >
          {selfId != null && playersRef.current.get(selfId) && (
            <div
              className="playground-chat-radius"
              style={{
                left: playersRef.current.get(selfId).x - chatRadiusRef.current,
                top: playersRef.current.get(selfId).y - chatRadiusRef.current,
                width: chatRadiusRef.current * 2,
                height: chatRadiusRef.current * 2,
              }}
            />
          )}
          {Array.from(playersRef.current.values()).map((player) => (
            <div
              key={player.trainerId}
              className={`playground-avatar${player.trainerId === selfId ? " is-self" : ""}`}
              style={{ left: player.x, top: player.y, background: player.color }}
              onPointerDown={player.trainerId === selfId ? handleAvatarPointerDown : undefined}
            >
              {player.initial}
            </div>
          ))}
        </div>
      </div>

      <div className="playground-chat">
        <div className="playground-chat-log" ref={chatLogRef}>
          {messages.map((msg) => (
            <div
              key={`${msg.trainerId}-${msg.ts}`}
              className={`playground-chat-message${msg.broadcast ? " is-broadcast" : ""}`}
            >
              <span className="playground-chat-author">{msg.name}:</span>{" "}
              {msg.broadcast && <span className="playground-chat-all-tag">[ALL]</span>} {msg.text}
            </div>
          ))}
        </div>
        <form className="playground-chat-form" onSubmit={handleChatSubmit}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            maxLength={300}
            placeholder="Say something... (/all to broadcast to everyone)"
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
};

export default Playground;
