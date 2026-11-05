import React, { useEffect, useState } from "react";

/**
 * The Start menu. Buttons reach it through `keys`, which the game loop calls with each
 * pressed button instead of ticking the world, so keyboard, gamepad and pad all work.
 */
const StartMenu = ({ items, keys, onClose }) => {
	const [i, setI] = useState(0);

	useEffect(() => {
		keys.current = (button) => {
			if (button === "up") setI((n) => (n + items.length - 1) % items.length);
			else if (button === "down") setI((n) => (n + 1) % items.length);
			else if (button === "a") items[i].run();
			else if (button === "b" || button === "start") onClose();
		};
		return () => {
			keys.current = null;
		};
	}, [i, items, keys, onClose]);

	return (
		<nav className="ow__menu frame panel font-pixel" aria-label="Start menu">
			{items.map((item, n) => (
				<button key={item.label} type="button" className="ow__menu-item" aria-current={n === i} onClick={item.run} onMouseEnter={() => setI(n)}>
					{item.label}
				</button>
			))}
		</nav>
	);
};

export default StartMenu;
