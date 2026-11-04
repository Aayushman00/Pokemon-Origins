import { TICK_MS, TILE, VIEW_H, VIEW_W } from "../constants.js";
import { actorFrame, actorPixel } from "../logic/movement.js";
import { computeCamera } from "../logic/camera.js";
import { neighbourOrigin } from "../logic/world.js";
import { coverage } from "../logic/transition.js";
import { createFx, stepFx } from "./fieldfx.js";
import { clouds, particles, smoke, tintFor } from "./ambient.js";

const ROW = { down: 0, up: 1, left: 2, right: 3 };

// Ground shadow under an actor in mid-air (ledge hop). Hand-drawn, 16x3.
const HOP_SHADOW = ["....xxxxxxxx....", "..xxxxxxxxxxxx..", "....xxxxxxxx...."];
// Ground shadow under a 32x32 legendary. Hand-drawn, 24x3.
const LEGEND_SHADOW = ["......xxxxxxxxxxxx......", "..xxxxxxxxxxxxxxxxxxxx..", "......xxxxxxxxxxxx......"];

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
export function createRenderer({ canvas, assets, playerSprite = "player" }) {
	const off = document.createElement("canvas");
	off.width = VIEW_W;
	off.height = VIEW_H;
	const g = off.getContext("2d");
	g.imageSmoothingEnabled = false;
	const out = canvas.getContext("2d");
	const fx = createFx();
	const calm = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

	function tileFlag(map, x, y, flag) {
		if (x < 0 || y < 0 || x >= map.width || y >= map.height) return undefined;
		for (const name of ["ground", "objects", "above"]) {
			const gid = map.layers[name][y * map.width + x];
			const ts = gid && map.tilesets.find((t) => gid >= t.firstgid);
			if (!ts) continue;
			const set = ts[flag];
			const id = gid - ts.firstgid;
			if (set.has(id)) return flag === "glow" ? set.get(id) : true;
		}
		return undefined;
	}

	// Blades kicked up by a step into tall grass, and the puff of a ledge landing.
	function drawEffect(e, ox, oy, cam) {
		const x = ox + e.x * TILE - cam.x;
		const y = oy + e.y * TILE - cam.y;
		const p = e.t / e.dur;
		// Pale on purpose: anything near the grass's own greens vanishes against it.
		g.fillStyle = e.kind === "rustle" ? "#f2fbc8" : "#e8dcc0";
		for (const [dx, dy] of e.kind === "rustle" ? [[-6, -4], [6, -5], [0, -8]] : [[-6, 0], [6, 0]]) {
			const px = Math.round(x + 7 + dx * p);
			const py = Math.round(y + 12 + dy * p + (e.kind === "rustle" ? p * p * 7 : -p * 2));
			g.fillRect(px, py, 2, 2);
		}
	}

	// Fixed time of day: multiply the scene, then add light back around lamps and windows.
	function drawTime(map, cam, ms) {
		const tint = tintFor(map.properties.time);
		if (!tint) return;
		g.globalCompositeOperation = "multiply";
		g.fillStyle = tint;
		g.fillRect(0, 0, VIEW_W, VIEW_H);
		g.globalCompositeOperation = "lighter";
		const pulse = 1 + Math.round(Math.sin(ms / 900));
		const x0 = Math.floor(cam.x / TILE);
		const y0 = Math.floor(cam.y / TILE);
		for (let ty = y0; ty <= y0 + VIEW_H / TILE + 1; ty++) {
			for (let tx = x0; tx <= x0 + VIEW_W / TILE + 1; tx++) {
				const r = tileFlag(map, tx, ty, "glow");
				if (!r) continue;
				const cx = tx * TILE + 8 - cam.x;
				const cy = ty * TILE + 8 - cam.y;
				for (const [k, a] of [[1, 0.1], [0.6, 0.14]]) {
					g.fillStyle = `rgba(255, 200, 120, ${a})`;
					g.beginPath();
					g.arc(cx, cy, r * k + pulse, 0, Math.PI * 2);
					g.fill();
				}
			}
		}
		g.globalCompositeOperation = "source-over";
	}

	// Chimneys per map, found once: scanning every tile each frame would be wasted work.
	const chimneys = new WeakMap();
	function chimneysOf(map) {
		if (!chimneys.has(map)) {
			const found = [];
			for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) if (tileFlag(map, x, y, "smoke")) found.push([x, y]);
			chimneys.set(map, found);
		}
		return chimneys.get(map);
	}

	function drawSky(map, cam, tick) {
		if (calm) return;
		chimneysOf(map).forEach(([x, y], i) => {
			for (const p of smoke(tick, i)) {
				g.fillStyle = `rgba(236, 236, 240, ${p.alpha})`;
				g.fillRect(x * TILE + 10 - cam.x + p.dx, y * TILE - cam.y + p.dy, p.size, p.size);
			}
		});
		if (!map.properties.clouds) return;
		g.fillStyle = "rgba(46, 74, 74, 0.1)";
		for (const r of clouds(tick, cam.x, cam.y)) g.fillRect(r.x, r.y, r.w, r.h);
	}

	function drawAmbient(map, tick) {
		if (calm) return;
		for (const kind of [map.properties.ambient, map.properties.weather]) {
			for (const p of particles(kind, tick)) {
				g.fillStyle = p.c;
				g.fillRect(p.x, p.y, p.w, p.h);
			}
		}
		if (map.properties.weather === "fog") {
			g.fillStyle = "rgba(235, 240, 245, 0.28)";
			g.fillRect(0, 0, VIEW_W, VIEW_H);
		}
	}

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

	function coverAt(map, x, y) {
		if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
		const gid = map.layers.ground[y * map.width + x];
		const ts = gid && map.tilesets.find((t) => gid >= t.firstgid);
		return ts ? ts.cover.has(gid - ts.firstgid) : false;
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

	// 32x32 legendary on its tile: 2-frame idle, soft ground shadow (drawn here,
	// so the sheets need no translucent pixels), shiny = palette-swapped sheet.
	function drawLegendary(a, ox, oy, camX, camY, tick) {
		const sheet = (a.shiny && assets.sprites[`${a.sprite}_shiny`]) || assets.sprites[a.sprite];
		if (!sheet) return;
		const { px, py } = actorPixel(a);
		const dx = Math.round(ox + px - camX) - 8;
		const dy = Math.round(oy + py - camY) - TILE;
		g.fillStyle = "rgba(24, 32, 40, 0.35)";
		LEGEND_SHADOW.forEach((row, y) => {
			for (let x = 0; x < row.length; x++) if (row[x] === "x") g.fillRect(dx + 4 + x, dy + 28 + y, 1, 1);
		});
		const frame = Math.floor(tick / 32) % 2;
		g.drawImage(sheet, frame * 32, 0, 32, 32, dx, dy, 32, 32);
	}

	// The "!" over a trainer who has spotted the player.
	function drawAlert(a, ox, oy, camX, camY) {
		const { px, py } = actorPixel(a);
		const x = Math.round(ox + px - camX) + 5;
		const y = Math.round(oy + py - camY) - TILE - 12;
		g.fillStyle = "#3a2426";
		g.fillRect(x, y, 6, 12);
		g.fillStyle = "#fff";
		g.fillRect(x + 1, y + 1, 4, 10);
		g.fillStyle = "#e04838";
		g.fillRect(x + 2, y + 2, 2, 5);
		g.fillRect(x + 2, y + 8, 2, 2);
	}

	function drawActor(a, ox, oy, camX, camY, tick, map) {
		if (a.kind === "legendary") return drawLegendary(a, ox, oy, camX, camY, tick);
		const sheet = assets.sprites[a.sprite || "player"];
		if (!sheet) return;
		const { px, py, lift } = actorPixel(a);
		const dx = Math.round(ox + px - camX);
		const dy = Math.round(oy + py - camY) - TILE - lift;
		// Everyone stands on a contact shadow; it darkens while a hop lifts them off it.
		g.fillStyle = lift > 0 ? "rgba(24, 32, 40, 0.45)" : "rgba(46, 74, 74, 0.3)";
		HOP_SHADOW.forEach((row, y) => {
			for (let x = 0; x < row.length; x++) if (row[x] === "x") g.fillRect(dx + x, dy + lift + TILE + 13 + y, 1, 1);
		});
		const sx = actorFrame(a, tick) * TILE;
		const sy = ROW[a.facing] * 32;
		// Standing just above water: a faint upside-down copy, clipped to that tile row.
		if (map && !lift && tileFlag(map, a.x, a.y + 1, "water")) {
			const feet = dy + 32;
			g.save();
			g.beginPath();
			g.rect(dx - 2, feet, TILE + 4, TILE);
			g.clip();
			g.globalAlpha = 0.3;
			g.translate(0, feet * 2);
			g.scale(1, -1);
			g.drawImage(sheet, sx, sy, TILE, 32, dx, dy, TILE, 32);
			g.restore();
		}
		g.drawImage(sheet, sx, sy, TILE, 32, dx, dy, TILE, 32);
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

			// An open doorway under the player while they go in. Sized to the door panel in
			// slice_art.building, which rises 9px into the row above the door cell.
			if (game.doorOpening) {
				const doorX = game.player.x * TILE - cam.x;
				const doorY = game.player.y * TILE - cam.y;
				g.fillStyle = "#26223a";
				g.fillRect(doorX + 3, doorY - 9, 10, 23);
			}
			const originOf = (id) => drawn.find((d) => d.map.id === id);
			for (const t of game.puzzleTiles()) drawGid(map, t.gid, t.x * TILE - cam.x, t.y * TILE - cam.y, ms);
			const actors = [{ ...game.player, sprite: playerSprite, mapId: map.id }, ...game.npcs()]
				.map((a) => ({ a, d: originOf(a.mapId) }))
				.filter((e) => e.d)
				.sort((p, q) => actorPixel(p.a).py + p.d.oy - (actorPixel(q.a).py + q.d.oy));
			for (const { a, d } of actors) {
				drawActor(a, d.ox, d.oy, cam.x, cam.y, game.tickCount, d.map);
				drawCover(a, d, cam, ms);
			}
			stepFx(fx, { tick: game.tickCount, player: { ...game.player, mapId: map.id }, isGrass: (x, y) => Boolean(coverAt(map, x, y)) });
			if (!calm) for (const e of fx.effects) drawEffect(e, 0, 0, cam);

			for (const d of drawn) drawLayer(d.map, "above", d.ox - cam.x, d.oy - cam.y, ms);
			drawSky(map, cam, game.tickCount);
			drawTime(map, cam, ms);
			drawAmbient(map, game.tickCount);
			overlay(game, cam.x, cam.y);
			const seen = actors.find(({ a }) => a.id === game.alert);
			if (seen) drawAlert(seen.a, seen.d.ox, seen.d.oy, cam.x, cam.y);
			if (game.flash > 0) {
				g.fillStyle = "#fff";
				g.fillRect(0, 0, VIEW_W, VIEW_H);
			}
			this.present();
		},
		present() {
			out.imageSmoothingEnabled = false;
			out.drawImage(off, 0, 0, VIEW_W, VIEW_H, 0, 0, canvas.width, canvas.height);
		},
	};
}
