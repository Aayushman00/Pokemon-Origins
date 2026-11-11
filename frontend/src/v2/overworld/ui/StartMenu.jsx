import React, { useEffect, useRef, useState } from "react";
import Cursor from "../../ui/Cursor";
import MenuIcon from "../../ui/MenuIcon";

/**
 * The Start menu. Buttons reach it through `keys`, which the game loop calls with each
 * pressed button instead of ticking the world, so keyboard, gamepad and pad all work.
 */
const StartMenu = ({ items, keys, onClose }) => {
	const [i, setI] = useState(0);
	const cursor = useRef(0); // several buttons can land in one frame, before a render catches up
	const point = (n) => {
		cursor.current = n;
		setI(n);
	};

	useEffect(() => {
		keys.current = (button) => {
			if (button === "up") point((cursor.current + items.length - 1) % items.length);
			else if (button === "down") point((cursor.current + 1) % items.length);
			else if (button === "a") items[cursor.current].run();
			else if (button === "b" || button === "start") onClose();
		};
		return () => {
			keys.current = null;
		};
	}, [items, keys, onClose]);

	return (
		<nav className="ow__menu frame panel font-pixel" aria-label="Start menu">
			{items.map((item, n) => (
				<button key={item.label} type="button" className="ow__menu-item" aria-current={n === i} onClick={item.run} onMouseEnter={() => point(n)}>
					<Cursor hidden={n !== i} />
					<MenuIcon name={item.icon} />
					{item.label}
				</button>
			))}
		</nav>
	);
};

export default StartMenu;
