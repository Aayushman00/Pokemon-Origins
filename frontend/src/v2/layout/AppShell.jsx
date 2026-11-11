import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../data/user";
import MenuList from "../ui/MenuList";
import PixelAvatar from "../ui/PixelAvatar";
import MenuIcon from "../ui/MenuIcon";
import useTheme from "../data/theme";
import "./shell.css";

const Crest = () => (
	<svg className="brand__crest" viewBox="0 0 12 12" aria-hidden="true" shapeRendering="crispEdges">
		<rect x="2" y="0" width="8" height="1" fill="#2b211c" />
		<rect x="1" y="1" width="10" height="5" fill="#d5473a" />
		<rect x="0" y="2" width="1" height="8" fill="#2b211c" />
		<rect x="11" y="2" width="1" height="8" fill="#2b211c" />
		<rect x="1" y="6" width="10" height="5" fill="#fbf6e6" />
		<rect x="1" y="5" width="10" height="2" fill="#2b211c" />
		<rect x="4" y="4" width="4" height="4" fill="#2b211c" />
		<rect x="5" y="5" width="2" height="2" fill="#f3c64b" />
		<rect x="2" y="11" width="8" height="1" fill="#2b211c" />
		<rect x="2" y="2" width="2" height="1" fill="#ee7a6c" />
	</svg>
);

/** Global chrome: brand, your avatar, day/night, and the START menu, which is the app's only nav. */
const AppShell = ({ children }) => {
	const { user, setUser } = useUser();
	const navigate = useNavigate();
	const location = useLocation();
	const [menuOpen, setMenuOpen] = useState(false);
	const [theme, toggleTheme] = useTheme();
	const startRef = useRef(null);
	const menuRef = useRef(null);

	useEffect(() => setMenuOpen(false), [location.pathname]);

	useEffect(() => {
		if (!menuOpen) return undefined;
		const onDown = (e) => {
			if (menuRef.current?.contains(e.target) || startRef.current?.contains(e.target)) return;
			setMenuOpen(false);
		};
		document.addEventListener("pointerdown", onDown);
		return () => document.removeEventListener("pointerdown", onDown);
	}, [menuOpen]);

	const close = () => {
		setMenuOpen(false);
		startRef.current?.focus();
	};

	const logOut = () => {
		localStorage.removeItem("trainer");
		localStorage.removeItem("token");
		setUser(null);
		navigate("/auth", { replace: true });
	};

	const menuItems = user
		? [
				{ id: "hub", label: "Hub", to: "/game" },
				{ id: "party", label: "Party", to: "/game#party" },
				{ id: "bag", label: "Bag", to: "/game/bag" },
				{ id: "mart", label: "Mart", to: "/game/mart" },
				{ id: "dex", label: "Pokédex", to: "/pokedex" },
				{ id: "play", label: "Playground", to: "/playground" },
				{ id: "card", label: "Trainer card", to: "/trainer" },
				{ id: "out", label: "Log out", onSelect: logOut, className: "menu__item--sep" },
				{ id: "exit", label: "Exit", onSelect: close },
		]
		: [
				{ id: "hub", label: "Title screen", to: "/" },
				{ id: "card", label: "Log in / Sign up", to: "/auth" },
				{ id: "dex", label: "Pokédex", to: "/pokedex" },
				{ id: "play", label: "Playground", to: "/playground" },
				{ id: "exit", label: "Exit", onSelect: close, className: "menu__item--sep" },
		];
	const here = location.pathname + location.hash;
	const rows = menuItems.map((item) => ({
		...item,
		icon: <MenuIcon name={item.id} />,
		hint: item.to === here ? "here" : undefined,
	}));

	return (
		<>
			<a className="skip-link" href="#main">
				Skip to content
			</a>
			<header className="topbar">
				<NavLink to="/" end className="brand" aria-label="Pokémon Origins title screen">
					<Crest />
					<span className="brand__word">
						Pokémon <span>Origins</span>
					</span>
				</NavLink>

				<div className="topbar__right">
					{user && (
						<NavLink to="/trainer" className="topbar__me" aria-label="Your trainer card">
							<PixelAvatar gender={user.gender} size={28} />
							<span>{user.name}</span>
						</NavLink>
					)}
					<button
						type="button"
						className="theme-btn"
						onClick={toggleTheme}
						aria-pressed={theme === "dark"}
						aria-label="Night mode"
						title={theme === "dark" ? "Switch to day" : "Switch to night"}
					>
						<span className={`theme-btn__icon theme-btn__icon--${theme === "dark" ? "moon" : "sun"}`} aria-hidden="true" />
						<span className="theme-btn__label">{theme === "dark" ? "Night" : "Day"}</span>
					</button>
					<button
						ref={startRef}
						type="button"
						className="start-btn"
						aria-expanded={menuOpen}
						aria-controls="start-menu"
						onClick={() => setMenuOpen((o) => !o)}
					>
						START
					</button>
				</div>

				{menuOpen && (
					<div ref={menuRef} id="start-menu" className="frame panel start-menu frame--lift">
						{user && (
							<div className="start-menu__me">
								<PixelAvatar gender={user.gender} size={40} />
								<span>
									<strong className="caps">{user.name}</strong>
									<span className="start-menu__sub">Trainer</span>
								</span>
							</div>
						)}
						<MenuList items={rows} label="Start menu" autoFocus onBack={close} />
						<p className="start-menu__keys" aria-hidden="true">
							↑↓ move · Enter · Esc
						</p>
					</div>
				)}
			</header>
			<main id="main" key={location.pathname} className="screen-enter">
				{children}
			</main>
		</>
	);
};

export default AppShell;
