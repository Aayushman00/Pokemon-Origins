import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../../config";
import "./Playground.css";

const LERP_FACTOR = 0.25;
const MOVE_EMIT_INTERVAL_MS = 50; // ~20/sec

const Playground = () => {
  const [selfId, setSelfId] = useState(null);
  const [connectError, setConnectError] = useState(false);
  const [, forceRender] = useState(0);

  const playersRef = useRef(new Map()); // trainerId -> {trainerId,name,initial,color,x,y,targetX,targetY}
  const socketRef = useRef(null);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const lastEmitRef = useRef(0);

  const rerender = () => forceRender((n) => n + 1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = io(API_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect_error", () => setConnectError(true));

    socket.on("room:init", ({ self, players }) => {
      const map = new Map();
      players.forEach((p) => map.set(p.trainerId, { ...p, targetX: p.x, targetY: p.y }));
      playersRef.current = map;
      setSelfId(self.trainerId);
      rerender();
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

  if (connectError) {
    return (
      <div className="playground-error font-pixel">
        Could not connect to the Playground.
      </div>
    );
  }

  return (
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
  );
};

export default Playground;
