import { TICK_MS, TILE, VIEW_H, VIEW_W } from "../constants.js";
import { actorFrame, actorPixel } from "../logic/movement.js";
import { computeCamera } from "../logic/camera.js";
import { neighbourOrigin } from "../logic/world.js";
import { coverage } from "../logic/transition.js";

const ROW = { down: 0, up: 1, left: 2, right: 3 };
const SIDE_OF = { north: "north", south: "south", east: "east", west: "west" };

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

	function drawLayer(map, name, ox, oy, ms) {
		const data = map.layers[name];
		const x0 = Math.max(0, Math.floor(-ox / TILE));
		const y0 = Math.max(0, Math.floor(-oy / TILE));
		const x1 = Math.min(map.width, Math.ceil((VIEW_W - ox) / TILE));
		const y1 = Math.min(map.height, Math.ceil((VIEW_H - oy) / TILE));
		for (let y = y0; y < y1; y++) {
			for (let x = x0; x < x1; x++) {
				const gid = data[y * map.width + x];
				if (!gid) continue;
				const ts = map.tilesets.find((t) => gid >= t.firstgid);
				if (!ts) continue;
				const img = assets.tilesets.get(ts.image);
				if (!img) continue;
				const id = tileFrame(ts, gid - ts.firstgid, ms);
				g.drawImage(img, (id % ts.columns) * TILE, Math.floor(id / ts.columns) * TILE, TILE, TILE, ox + x * TILE, oy + y * TILE, TILE, TILE);
			}
		}
	}

	function drawActor(a, ox, oy, camX, camY) {
		const sheet = assets.sprites[a.sprite || "player"];
		if (!sheet) return;
		const { px, py, lift } = actorPixel(a);
		const dx = Math.round(ox + px - camX);
		const dy = Math.round(oy + py - camY) - TILE - lift;
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
			const open = {};
			const drawn = [{ map, ox: 0, oy: 0 }];
			for (const [side, link] of Object.entries(map.connections)) {
				const other = game.neighbourMap(link.map);
				if (!other) continue;
				open[SIDE_OF[side]] = true;
				const o = neighbourOrigin(map, side, other);
				drawn.push({ map: other, ox: o.x, oy: o.y });
			}
			const cam = computeCamera({ px, py, mapW: map.width, mapH: map.height, open });
			g.fillStyle = "#000";
			g.fillRect(0, 0, VIEW_W, VIEW_H);
			for (const name of ["ground", "decor", "objects"]) for (const d of drawn) drawLayer(d.map, name, d.ox - cam.x, d.oy - cam.y, ms);

			const originOf = (id) => drawn.find((d) => d.map.id === id);
			const actors = [{ ...game.player, sprite: "player", mapId: map.id }, ...game.npcs()]
				.map((a) => ({ a, d: originOf(a.mapId) }))
				.filter((e) => e.d)
				.sort((p, q) => actorPixel(p.a).py + p.d.oy - (actorPixel(q.a).py + q.d.oy));
			for (const { a, d } of actors) drawActor(a, d.ox, d.oy, cam.x, cam.y);

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
