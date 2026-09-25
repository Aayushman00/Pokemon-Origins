import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../data/user";
import { api } from "../../../api";
import BattlePokemonSprite from "../../../components/PokemonSprite/BattlePokemonSprite";
import MenuList from "../../ui/MenuList";
import PixelArt from "../../ui/PixelArt";
import SkyFlock from "../../ui/SkyFlock";
import { scatter } from "../../ui/scatter";
import { typeColor } from "../../../utils/typeColors";
import "./title.css";

const ROTATE_MS = 3200;

// Hand-drawn 14x14 Diglett (bottom rows stay below the hole line).
// K outline, B body, H highlight, D shade, E eye, W glint, N nose, n nose shade.
const DIGLETT_MAP = [
	".....KKKK.....",
	"...KKHHBBKK...",
	"..KHHBBBBBBK..",
	".KHBBBBBBBBDK.",
	".KHBEWBBEWBDK.",
	"KBBBEEBBEEBBDK",
	"KBBBEEBBEEBBDK",
	"KBBBBNNNNBBBDK",
	"KBBBNNNNNNBBDK",
	"KBBBNnnnnNBBDK",
	"KBBBBNNNNBBBDK",
	"KBBBBBBBBBBBDK",
	"KBBBBBBBBBBBDK",
	"KBBBBBBBBBBBDK",
];
const DIGLETT_PAL = { K: "#3a2618", B: "#a0663a", H: "#c98a55", D: "#7a4a28", E: "#1b1410", W: "#fbf6e6", N: "#e9828f", n: "#c65a6a" };

const DIGG_W = 64;
const DIGG_H = 56; // hole box + mound lip

const STAR_COUNT = 36;

/**
 * Random spot for Diglett on the grass: below `groundTop`, inside `w`x`h`,
 * clear of every `avoid` rect ({left, top, right, bottom}, all relative to the
 * same box). Returns null when nothing fits in `tries` attempts.
 */
export function pickDiggSpot({ w, h, groundTop, avoid, rand = Math.random, tries = 40, pad = 12 }) {
	const minY = groundTop + pad;
	const maxY = h - DIGG_H - pad;
	const maxX = w - DIGG_W - pad;
	if (maxY < minY || maxX < pad) return null;
	for (let i = 0; i < tries; i++) {
		const x = pad + rand() * (maxX - pad);
		const y = minY + rand() * (maxY - minY);
		const hit = avoid.some(
			(r) => x < r.right + pad && x + DIGG_W > r.left - pad && y < r.bottom + pad && y + DIGG_H > r.top - pad
		);
		if (!hit) return { x, y, depth: (y - minY) / Math.max(1, maxY - minY) };
	}
	return null;
}

const PixelDiglett = (props) => (
	<PixelArt map={DIGLETT_MAP} pal={DIGLETT_PAL} {...props}>
		{/* eyelids: cover the top two eye rows so the last row reads as a shut eye */}
		<path className="title__digg-lids" fill={DIGLETT_PAL.B} d="M4 4h2v2H4zM8 4h2v2H8z" />
	</PixelArt>
);

/** "#025 Pikachu" + one chip per type, from a /pokemon record. */
const NamePlate = ({ mon }) => (
	<p className="title__plate">
		<span className="title__plate-name">
			#{String(mon.pokemon_id).padStart(3, "0")} {mon.name}
		</span>
		{String(mon.types || "")
			.split(",")
			.filter(Boolean)
			.map((t) => (
				<span key={t} className="title__plate-type" style={{ background: typeColor(t) }}>
					{t}
				</span>
			))}
	</p>
);

/** Title screen: wordmark, a rotating creature from the real dex, main menu. */
const TitleScreen = () => {
	const { user } = useUser();
	const navigate = useNavigate();
	const [pool, setPool] = useState([]);
	const [idx, setIdx] = useState(0);

	useEffect(() => {
		let alive = true;
		api
			.get("/pokemon")
			.then(({ data }) => {
				if (!alive || !Array.isArray(data)) return;
				// keep whole records: the name plate needs name + types
				const mons = data.filter((p) => p.pokemon_id);
				const picks = [];
				while (picks.length < Math.min(8, mons.length)) {
					const mon = mons[Math.floor(Math.random() * mons.length)];
					if (!picks.includes(mon)) picks.push(mon);
				}
				setPool(picks);
			})
			.catch(() => {});
		return () => {
			alive = false;
		};
	}, []);

	useEffect(() => {
		// CSS reduced-motion (base.css) can't reach this JS timer; hold one mon instead
		if (pool.length < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
		const id = setInterval(() => setIdx((i) => (i + 1) % pool.length), ROTATE_MS);
		return () => clearInterval(id);
	}, [pool.length]);

	const items = user
		? [
				{ id: "continue", label: "Continue", hint: user.name, onSelect: () => navigate("/game") },
				{ id: "play", label: "Playground", onSelect: () => navigate("/playground") },
				{ id: "dex", label: "Pokédex", onSelect: () => navigate("/pokedex") },
		]
		: [
				{ id: "new", label: "New game", onSelect: () => navigate("/auth?mode=register") },
				{ id: "continue", label: "Continue", hint: "log in", onSelect: () => navigate("/auth") },
				{ id: "play", label: "Visit the Playground", hint: "as a guest", onSelect: () => navigate("/playground") },
				{ id: "dex", label: "Pokédex", onSelect: () => navigate("/pokedex") },
		];

	const featured = pool[idx];

	// Randomized once per mount; each re-picks its spot only on a fresh load.
	const stars = useMemo(() => scatter(STAR_COUNT, { minTop: 0, maxTop: 55, dur: [2.5, 5] }), []);

	// Diglett re-spawns somewhere new on the grass each cycle (called while it is
	// underground, so the jump is never seen).
	const titleRef = useRef(null);
	const stageRef = useRef(null);
	const menuRef = useRef(null);
	const [digg, setDigg] = useState(null);
	const placeDigg = useCallback(() => {
		const box = titleRef.current?.getBoundingClientRect();
		const stage = stageRef.current?.getBoundingClientRect();
		const menu = menuRef.current?.getBoundingClientRect();
		if (!box || !stage || !menu) return;
		const rel = (r, extraBottom = 0) => ({
			left: r.left - box.left,
			right: r.right - box.left,
			top: r.top - box.top,
			bottom: r.bottom - box.top + extraBottom,
		});
		const groundTop = rel(stage).top + (parseFloat(getComputedStyle(stageRef.current).getPropertyValue("--ground-top")) || 0);
		const spot = pickDiggSpot({
			w: box.width,
			h: box.height,
			groundTop,
			avoid: [rel(stage, 40 /* name plate */), rel(menu, 30 /* sign posts */)],
		});
		if (spot) setDigg(spot);
	}, []);
	useEffect(placeDigg, [placeDigg]);
	const onDiggCycle = (e) => {
		if (e.animationName === "digg-pop") placeDigg();
	};

	return (
		<div className="title" ref={titleRef}>
			<div className="title__sky" aria-hidden="true">
				<span className="title__star-field">
					{stars.map((s, i) => (
						<span
							key={i}
							className="title__star"
							style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }}
						/>
					))}
				</span>
				<span className="title__moon" />
				<span className="title__sun" />
				<span className="title__cloud title__cloud--1" />
				<span className="title__cloud title__cloud--2" />
				<span className="title__cloud title__cloud--3" />
				<span className="title__cloud title__cloud--4" />
				<span className="title__cloud title__cloud--5" />
				<span className="title__cloud title__cloud--6" />
				<SkyFlock />
			</div>
			<div className="title__inner">
				<h1 className="title__word">
					<span className="title__battle">Pokémon</span>
					<span className="title__sim">Origins</span>
				</h1>
				<p className="title__tag read">Build a party, clear ten towns, and meet other trainers along the way.</p>

				<div className="title__stage" ref={stageRef}>
					<span className="title__plat" aria-hidden="true" />
					{featured && (
						<>
							<BattlePokemonSprite
								key={featured.pokemon_id}
								pokemonId={featured.pokemon_id}
								variant="front"
								alt=""
								className="sprite title__mon"
							/>
							<NamePlate key={`plate-${featured.pokemon_id}`} mon={featured} />
						</>
					)}
				</div>

				<nav className="frame panel panel--sign title__menu frame--lift" aria-label="Title menu" ref={menuRef}>
					<MenuList items={items} label="Title menu" autoFocus />
				</nav>
			</div>
			<span
				className="title__digg"
				aria-hidden="true"
				style={
					digg
						? { left: digg.x, top: digg.y, scale: String(0.75 + 0.25 * digg.depth) }
						: { visibility: "hidden" }
				}
			>
				<span className="title__digg-hole">
					<PixelDiglett className="title__digg-mon" onAnimationIteration={onDiggCycle} />
				</span>
			</span>
		</div>
	);
};

export default TitleScreen;
