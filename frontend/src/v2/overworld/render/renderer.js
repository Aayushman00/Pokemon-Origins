import { TICK_MS, TILE, VIEW_H, VIEW_W } from "../constants.js";
import { actorFrame, actorPixel } from "../logic/movement.js";
import { computeCamera } from "../logic/camera.js";
import { neighbourOrigin } from "../logic/world.js";
import { coverage } from "../logic/transition.js";

const ROW = { down: 0, up: 1, left: 2, right: 3 };

// Ground shadow under an actor in mid-air (ledge hop). Hand-drawn, 16x3.
const HOP_SHADOW = ["....xxxxxxxx....", "..xxxxxxxxxxxx..", "....xxxxxxxx...."];

function tileFrame(ts, localId, ms) {
	const anim = ts.anim.get(localId);
	if (!anim) return localId;
	let t = ms % anim.total;
	for (const f of anim.frames) {
		if (t < f.ms) return f.id;
		t -= f.ms;
	}
	return localId;
}

/**
 * Canvas renderer. Draws the world into a fixed 240x160 offscreen canvas at
 * integer camera positions, then blits it to the visible canvas with an
 * integer scale and smoothing off. Reads game state; owns no logic.
 */
export function createRenderer({ canvas, assets }) {
	const off = document.createElement("canvas");
	off.width = VIEW_W;
	off.height = VIEW_H;
	const g = off.getContext("2d");
	g.imageSmoothingEnabled = false;
	const out = canvas.getContext("2d");

	function drawGid(map, gid, dx, dy, ms, fromRow = 0) {
		const ts = map.tilesets.find((t) => gid >= t.firstgid);
		if (!ts) return;
		const img = assets.tilesets.get(ts.image);
		if (!img) return;
		const id = tileFrame(ts, gid - ts.firstgid, ms);
		const h = TILE - fromRow;
		g.drawImage(img, (id % ts.columns) * TILE, Math.floor(id / ts.columns) * TILE + fromRow, TILE, h, dx, dy + fromRow, TILE, h);
	}

	// Fill every on-screen cell that no drawn map covers with the map's border block.
	function drawBorder(map, drawn, cam, ms) {
		if (!map.border) return;
		const inside = (tx, ty) =>
			drawn.some((d) => {
				const x = tx - d.ox / TILE;
				const y = ty - d.oy / TILE;
				return x >= 0 && y >= 0 && x < d.map.width && y < d.map.height;
			});
		const tx0 = Math.floor(cam.x / TILE);
		const ty0 = Math.floor(cam.y / TILE);
		const tx1 = Math.floor((cam.x + VIEW_W - 1) / TILE);
		const ty1 = Math.floor((cam.y + VIEW_H - 1) / TILE);
		for (let ty = ty0; ty <= ty1; ty++) {
			for (let tx = tx0; tx <= tx1; tx++) {
				if (inside(tx, ty)) continue;
				const gid = map.border[(ty & 1) * 2 + (tx & 1)];
				drawGid(map, gid, tx * TILE - cam.x, ty * TILE - cam.y, ms);
			}
		}
	}

	// Tall grass: draw the lower rows of a "cover" tile again over an actor standing in it.
	function drawCover(a, d, cam, ms) {
		if (a.phase === "hop") return;
		const map = d.map;
		const cells = [{ x: a.x, y: a.y }];
		if (a.to && a.to.mapId === a.mapId) cells.push({ x: a.to.x, y: a.to.y });
		for (const c of cells) {
			if (c.x < 0 || c.y < 0 || c.x >= map.width || c.y >= map.height) continue;
			for (const name of ["ground", "decor", "objects"]) {
				const gid = map.layers[name][c.y * map.width + c.x];
				if (!gid) continue;
				const ts = map.tilesets.find((t) => gid >= t.firstgid);
				const row = ts?.cover?.get(gid - ts.firstgid);
				if (row === undefined) continue;
				drawGid(map, gid, d.ox + c.x * TILE - cam.x, d.oy + c.y * TILE - cam.y, ms, row);
			}
		}
	}

	function drawLayer(map, name, ox, oy, ms) {
		const data = map.layers[name];
		const x0 = Math.max(0, Math.floor(-ox / TILE));
		const y0 = Math.max(0, Math.floor(-oy / TILE));
		const x1 = Math.min(map.width, Math.ceil((VIEW_W - ox) / TILE));
		const y1 = Math.min(map.height, Math.ceil((VIEW_H - oy) / TILE));
		for (let y = y0; y < y1; y++) {
			for (let x = x0; x < x1; x++) {
				const gid = data[y * map.width + x];
				if (gid) drawGid(map, gid, ox + x * TILE, oy + y * TILE, ms);
			}
		}
	}

	function drawActor(a, ox, oy, camX, camY) {
		const sheet = assets.sprites[a.sprite || "player"];
		if (!sheet) return;
		const { px, py, lift } = actorPixel(a);
		const dx = Math.round(ox + px - camX);
		const dy = Math.round(oy + py - camY) - TILE - lift;
		if (lift > 0) {
			g.fillStyle = "rgba(24, 32, 40, 0.45)";
			HOP_SHADOW.forEach((row, y) => {
				for (let x = 0; x < row.length; x++) if (row[x] === "x") g.fillRect(dx + x, dy + lift + TILE + 13 + y, 1, 1);
			});
		}
		g.drawImage(sheet, actorFrame(a) * TILE, ROW[a.facing] * 32, TILE, 32, dx, dy, TILE, 32);
	}

	function overlay(game, camX, camY) {
		const tr = game.transition;
		if (!tr) return;
		const cov = coverage(tr);
		if (cov <= 0) return;
		g.fillStyle = "#000";
		if (tr.kind === "iris") {
			const { px, py } = actorPixel(game.player);
			const cx = px + 8 - camX;
			const cy = py + 8 - camY;
			const r = Math.round((1 - cov) * Math.hypot(VIEW_W, VIEW_H));
			g.beginPath();
			g.rect(0, 0, VIEW_W, VIEW_H);
			g.arc(cx, cy, r, 0, Math.PI * 2, true);
			g.fill("evenodd");
		} else {
			g.globalAlpha = cov;
			g.fillRect(0, 0, VIEW_W, VIEW_H);
			g.globalAlpha = 1;
		}
	}

	return {
		draw(game) {
			const map = game.map;
			if (!map) return;
			const ms = game.tickCount * TICK_MS;
			const { px, py } = actorPixel(game.player);
			const drawn = [{ map, ox: 0, oy: 0 }];
			for (const [side, link] of Object.entries(map.connections)) {
				const other = game.neighbourMap(link.map);
				if (!other) continue;
				const o = neighbourOrigin(map, side, other);
				drawn.push({ map: other, ox: o.x, oy: o.y });
			}
			const cam = computeCamera({ px, py });
			g.fillStyle = "#000";
			g.fillRect(0, 0, VIEW_W, VIEW_H);
			drawBorder(map, drawn, cam, ms);
			for (const name of ["ground", "decor", "objects"]) for (const d of drawn) drawLayer(d.map, name, d.ox - cam.x, d.oy - cam.y, ms);

			const originOf = (id) => drawn.find((d) => d.map.id === id);
			const actors = [{ ...game.player, sprite: "player", mapId: map.id }, ...game.npcs()]
				.map((a) => ({ a, d: originOf(a.mapId) }))
				.filter((e) => e.d)
				.sort((p, q) => actorPixel(p.a).py + p.d.oy - (actorPixel(q.a).py + q.d.oy));
			for (const { a, d } of actors) {
				drawActor(a, d.ox, d.oy, cam.x, cam.y);
				drawCover(a, d, cam, ms);
			}

			for (const d of drawn) drawLayer(d.map, "above", d.ox - cam.x, d.oy - cam.y, ms);
			overlay(game, cam.x, cam.y);
			this.present();
		},
		present() {
			out.imageSmoothingEnabled = false;
			out.drawImage(off, 0, 0, VIEW_W, VIEW_H, 0, 0, canvas.width, canvas.height);
		},
	};
}
