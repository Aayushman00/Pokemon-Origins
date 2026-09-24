import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "../../data/user";
import useHubData from "./useHubData";
import JourneyRoad from "./JourneyRoad";
import PartyBoard from "./PartyBoard";
import TrainerRecord from "./TrainerRecord";
import HubEvents from "./HubEvents";
import StarterPick from "./StarterPick";
import "./hub.css";

const PLACES = [
	{ to: "/playground", name: "Playground", note: "Walk around and chat with trainers nearby" },
	{ to: "/game/bag", name: "Bag", note: "Heal, restore PP, use evolution stones" },
	{ to: "/game/mart", name: "Mart", note: "Spend battle coins on supplies" },
	{ to: "/pokedex", name: "Pokédex", note: "Look up any of the first 151" },
];

const HubScreen = () => {
	const { user, setUser } = useUser();
	const hub = useHubData(user);
	const { hash } = useLocation();

	// START menu "Party" links to /game#party; scroll once the party has loaded.
	const scrolledRef = useRef(false);
	useEffect(() => {
		if (hash !== "#party" || !hub.party || scrolledRef.current) return;
		scrolledRef.current = true;
		document.getElementById("party")?.scrollIntoView({ block: "start" });
	}, [hash, hub.party]);

	if (!user.starterChosen) return <StarterPick user={user} setUser={setUser} />;

	return (
		<div className="hub">
			<JourneyRoad user={user} progress={hub.progress} profile={hub.profile} lead={hub.party?.[0]} />

			<div className="page hub__body">
				<HubEvents
					pendingEvos={hub.pendingEvos}
					pendingLearns={hub.pendingLearns}
					reloadEvos={hub.loadEvos}
					reloadLearns={hub.loadLearns}
					reloadParty={hub.loadParty}
				/>

				<div className="hub__grid">
					<div className="hub__left">
						<PartyBoard party={hub.party} pc={hub.pc} onArrange={hub.arrange} />
					</div>
					<TrainerRecord profile={hub.profile} coins={hub.coins} />
				</div>

				<nav className="places" aria-label="Places">
					{PLACES.map((p) => (
						<Link key={p.to} to={p.to} className="place">
							<span className="place__post" aria-hidden="true" />
							<span className="place__board">
								<span className="place__name">{p.name}</span>
								<span className="place__note read">{p.note}</span>
							</span>
						</Link>
					))}
				</nav>
			</div>
		</div>
	);
};

export default HubScreen;
