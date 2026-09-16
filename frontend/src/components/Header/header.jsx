import React from "react";
import { NavLink, useLocation } from "react-router-dom";

// Browsing surfaces get the site header; in-device screens (hub, bag, mart,
// battle levels) render their own full-stage Shell/LCD chrome instead.
const NAV_ITEMS = [
	{ name: "Pokédex", path: "/pokedex" },
	{ name: "Game", path: "/game" },
];

const Header = () => {
	const location = useLocation();

	if (
		location.pathname === "/game" ||
		location.pathname.startsWith("/game/") ||
		location.pathname.startsWith("/level")
	) {
		return null;
	}

	return (
		<header className="app-header">
			<NavLink to="/" className="app-header-brand font-pixel">
				POKEMON ORIGINS
			</NavLink>

			<nav className="app-header-nav" aria-label="Main navigation">
				{NAV_ITEMS.map(({ name, path }) => (
					<NavLink
						key={name}
						to={path}
						className={({ isActive }) =>
							`app-header-link font-pixel ${
								isActive ? "app-header-link--active" : ""
							}`
						}
					>
						{name}
					</NavLink>
				))}
			</nav>
		</header>
	);
};

export default Header;
