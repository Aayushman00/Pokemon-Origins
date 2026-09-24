import React, { useEffect, useRef } from "react";
import PokemonSprite from "../../../components/PokemonSprite/PokemonSprite";
import PixelTrainer from "../../ui/PixelTrainer";
import Button from "../../ui/Button";
import { MAX_CAMPAIGN_LEVEL } from "../battle/JourneyScreen";

/**
 * Hub hero: the campaign drawn as an overworld road. Every town is a real
 * campaign level; the trainer stands on their actual current level.
 */
const JourneyRoad = ({ user, progress, profile, lead }) => {
	const roadRef = useRef(null);
	const currentLevel = progress?.current_level ?? 1;
	const done = currentLevel > MAX_CAMPAIGN_LEVEL;
	const entryLevel = Math.min(currentLevel, MAX_CAMPAIGN_LEVEL);
	const route =
		profile?.campaign?.route ||
		Array.from({ length: MAX_CAMPAIGN_LEVEL }, (_, i) => ({ level: i + 1, name: null }));
	const here = route.find((r) => r.level === entryLevel);

	// Keep the trainer's town in view on narrow screens (horizontal road).
	useEffect(() => {
		const road = roadRef.current;
		const stop = road?.querySelector(".stop--here");
		if (!road || !stop) return;
		road.scrollLeft = stop.offsetLeft - road.clientWidth / 2 + stop.clientWidth / 2;
	}, [entryLevel, route.length]);

	return (
		<section className="journey" aria-labelledby="journey-title">
			<div className="journey__sky" aria-hidden="true">
				<span className="cloud cloud--a" />
				<span className="cloud cloud--b" />
				<span className="cloud cloud--c" />
			</div>
			<div className="journey__hills" aria-hidden="true" />

			<div className="journey__sign frame panel panel--sign frame--lift">
				<p className="journey__hello">Welcome back,</p>
				<h1 id="journey-title" className="journey__name">
					{user.name}
				</h1>
				{done ? (
					<p className="journey__next">Every town is behind you. You are the Champion.</p>
				) : (
					<p className="journey__next">
						Next stop: <strong>{here?.name || `Stage ${entryLevel}`}</strong>
						{progress && <>, battle {progress.current_battle}</>}
					</p>
				)}
				{done ? (
					<Button variant="primary" to="/trainer">
						View trainer card
					</Button>
				) : (
					<Button variant="go" size="lg" to={`/level/${entryLevel}`}>
						Continue journey
					</Button>
				)}
			</div>

			<div className="journey__roadwrap" ref={roadRef}>
				<ol className="journey__road" aria-label="Journey">
					{route.map((stop) => {
						const cleared = stop.level < currentLevel;
						const isHere = !done && stop.level === entryLevel;
						const last = stop.level === MAX_CAMPAIGN_LEVEL;
						const state = cleared ? "cleared" : isHere ? "here" : "locked";
						return (
							<li key={stop.level} className={`stop stop--${state} ${last ? "stop--final" : ""}`}>
								{isHere && (
									<span className="stop__party" aria-hidden="true">
										<PixelTrainer gender={user.gender} size={44} className="stop__trainer" />
										{lead && (
											<PokemonSprite
												pokemonId={lead.pokemon_id}
												variant="front"
												alt=""
												className="sprite stop__mon"
											/>
										)}
									</span>
								)}
								<span className="stop__marker" aria-hidden="true" />
								<span className="stop__name">
									{stop.name || `Stage ${stop.level}`}
									<span className="sr-only">
										{cleared ? " (cleared)" : isHere ? " (you are here)" : " (locked)"}
									</span>
								</span>
							</li>
						);
					})}
				</ol>
			</div>
		</section>
	);
};

export default JourneyRoad;
