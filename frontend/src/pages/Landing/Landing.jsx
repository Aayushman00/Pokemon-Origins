// Landing.jsx — marketing/entry front door at "/", same handheld language
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useUser } from "../../App";
import { api } from "../../api";
import Shell from "../../components/Shell/Shell";
import LcdPanel from "../../components/Shell/LcdPanel";
import PokemonSprite from "../../components/PokemonSprite/PokemonSprite";
import { typeColor } from "../../utils/typeColors";

const POOL_SIZE = 8;
const ROTATE_MS = 4000;

function shuffle(list) {
	const arr = [...list];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

const Landing = () => {
	const { user } = useUser();
	const reduceMotion = useReducedMotion();
	const [pool, setPool] = useState([]);
	const [featuredIdx, setFeaturedIdx] = useState(0);
	const [status, setStatus] = useState("loading"); // loading | ready | error
	const [paused, setPaused] = useState(false);

	const primaryTo = user ? "/game" : "/auth";
	const primaryLabel = user ? "Continue" : "Start adventure";

	// One public fetch; shuffle once into a small rotation pool
	useEffect(() => {
		let cancelled = false;
		api
			.get("/pokemon")
			.then(({ data }) => {
				if (cancelled) return;
				if (Array.isArray(data) && data.length > 0) {
					setPool(shuffle(data).slice(0, POOL_SIZE));
					setStatus("ready");
				} else {
					setStatus("error");
				}
			})
			.catch(() => {
				if (!cancelled) setStatus("error");
			});
		return () => {
			cancelled = true;
		};
	}, []);

	// Auto-advance the featured Pokémon; paused on hover/focus
	useEffect(() => {
		if (status !== "ready" || paused || pool.length < 2) return;
		const timer = setInterval(
			() => setFeaturedIdx((i) => (i + 1) % pool.length),
			ROTATE_MS
		);
		return () => clearInterval(timer);
	}, [status, paused, pool.length]);

	const featured = pool[featuredIdx];
	const thumbs = useMemo(() => {
		if (pool.length <= 1) return [];
		const list = [];
		for (let offset = 1; offset <= Math.min(4, pool.length - 1); offset++) {
			list.push(pool[(featuredIdx + offset) % pool.length]);
		}
		return list;
	}, [pool, featuredIdx]);

	return (
		<div className="device-backdrop">
			{/* Section 1 — Hero */}
			<section className="max-w-6xl mx-auto px-4 pt-10 pb-10 sm:pt-16 grid md:grid-cols-2 gap-10 items-center">
				<div className="text-center md:text-left">
					<p
						className="font-pixel text-[0.55rem] tracking-widest"
						style={{ color: "var(--lcd-ink-dim)" }}
					>
						A KANTO ADVENTURE
					</p>
					<h1
						className="font-pixel text-3xl sm:text-4xl leading-snug mt-4"
						style={{
							color: "var(--lcd-ink-bright)",
							textShadow: "0 4px 0 var(--lcd-shadow)",
						}}
					>
						POKEMON
						<br />
						ORIGINS
					</h1>
					<p
						className="mt-5 text-lg max-w-md mx-auto md:mx-0"
						style={{ color: "var(--lcd-ink)" }}
					>
						Choose your starter, fill a 151-entry Pokédex, and win turn-based
						battles — straight from the handheld era.
					</p>
					<div className="flex flex-wrap gap-3 justify-center md:justify-start mt-7">
						<Link to={primaryTo} className="pixel-btn pixel-btn--primary">
							{primaryLabel}
						</Link>
						<Link to="/pokedex" className="pixel-btn">
							Pokédex
						</Link>
					</div>
				</div>

				{/* Dominant visual: live rotating showcase */}
				<div
					className="w-full max-w-md mx-auto md:mx-0 md:justify-self-end"
					onMouseEnter={() => setPaused(true)}
					onMouseLeave={() => setPaused(false)}
					onFocus={() => setPaused(true)}
					onBlur={() => setPaused(false)}
				>
					<Shell poweredOn>
						<LcdPanel>
							{status === "loading" && (
								<div className="flex items-center justify-center py-20">
									<p
										className="font-pixel text-[0.65rem]"
										style={{ color: "var(--lcd-ink)" }}
									>
										LOADING...
									</p>
								</div>
							)}

							{status === "error" && (
								<div className="flex flex-col items-center justify-center py-20 text-center gap-2">
									<p
										className="font-pixel text-[0.6rem]"
										style={{ color: "var(--lcd-ink-dim)" }}
									>
										SHOWCASE OFFLINE
									</p>
									<p
										className="font-pixel text-[0.5rem]"
										style={{ color: "var(--lcd-ink-dim)" }}
									>
										THE ADVENTURE STILL AWAITS
									</p>
								</div>
							)}

							{status === "ready" && featured && (
								<>
									<p
										className="font-pixel text-[0.5rem] text-center tracking-widest"
										style={{ color: "var(--lcd-ink-dim)" }}
									>
										NOW APPEARING
									</p>

									<AnimatePresence mode="wait">
										<motion.div
											key={featured.pokemon_id}
											className="text-center"
											initial={
												reduceMotion ? { opacity: 1 } : { opacity: 0, x: 24 }
											}
											animate={{ opacity: 1, x: 0 }}
											exit={
												reduceMotion ? { opacity: 1 } : { opacity: 0, x: -24 }
											}
											transition={{
												duration: reduceMotion ? 0 : 0.28,
												ease: "easeOut",
											}}
										>
											<Link
												to={`/pokedex/${featured.pokemon_id}`}
												className="inline-block"
												aria-label={`Open ${featured.name} in the Pokédex`}
											>
												<PokemonSprite
													as={motion.img}
													pokemon={featured}
													variant="front"
													className="w-40 h-40 sm:w-48 sm:h-48 object-contain mx-auto pixelated"
													animate={reduceMotion ? {} : { y: [0, -5, 0] }}
													transition={
														reduceMotion
															? {}
															: {
																	duration: 2.6,
																	repeat: Infinity,
																	ease: "easeInOut",
															  }
													}
												/>
											</Link>
											<p
												className="font-pixel text-[0.5rem] mt-2"
												style={{ color: "var(--lcd-ink-dim)" }}
											>
												No.{String(featured.pokemon_id).padStart(4, "0")}
											</p>
											<p
												className="font-pixel text-[0.75rem] capitalize mt-1"
												style={{ color: "var(--lcd-ink-bright)" }}
											>
												{featured.name}
											</p>
											<div className="flex justify-center gap-1 mt-2 flex-wrap">
												{featured.types.map((t) => (
													<span
														key={t}
														className="dex-chip"
														style={{ background: typeColor(t) }}
													>
														{t}
													</span>
												))}
											</div>
										</motion.div>
									</AnimatePresence>

									<hr className="lcd-divider" />
									<div className="grid grid-cols-4 gap-2">
										{thumbs.map((p) => (
											<button
												key={p.pokemon_id}
												type="button"
												className="starter-slot !p-2"
												onClick={() => setFeaturedIdx(pool.indexOf(p))}
												aria-label={`Feature ${p.name}`}
											>
												<PokemonSprite
													pokemon={p}
													variant="icon"
													alt=""
													className="w-12 h-12 object-contain pixelated"
												/>
											</button>
										))}
									</div>
								</>
							)}
						</LcdPanel>
					</Shell>
				</div>
			</section>

			{/* Section 2 — What you can do */}
			<section className="max-w-3xl mx-auto px-4 pb-12">
				<div className="shell-bezel">
					<LcdPanel>
						<p
							className="font-pixel text-[0.6rem] mb-3 tracking-widest"
							style={{ color: "var(--lcd-ink-dim)" }}
						>
							WHAT YOU CAN DO
						</p>
						<nav className="space-y-1" aria-label="Product actions">
							<Link className="menu-row" to="/pokedex">
								Browse the Pokédex — 151 Kanto entries
							</Link>
							<Link className="menu-row" to={primaryTo}>
								Choose your starter — Bulbasaur, Charmander or Squirtle
							</Link>
							<Link className="menu-row" to={primaryTo}>
								Battle — 10 levels to the Champion
							</Link>
						</nav>
					</LcdPanel>
				</div>
			</section>

			{/* Section 3 — Thin closer */}
			<section className="text-center px-4 pb-16">
				<p
					className="font-pixel text-[0.7rem] mb-5"
					style={{ color: "var(--lcd-ink-bright)" }}
				>
					READY, TRAINER?
				</p>
				<Link to={primaryTo} className="pixel-btn pixel-btn--primary">
					{primaryLabel}
				</Link>
			</section>
		</div>
	);
};

export default Landing;
