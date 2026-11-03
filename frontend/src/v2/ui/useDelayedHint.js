import { useEffect, useState } from "react";

/** True once `ms` have elapsed while `active`; resets when `active` goes false.
 * Used to surface a "still working" hint on loads that are usually instant
 * but occasionally stall on a cold backend (Render free-tier spin-up). */
export default function useDelayedHint(active, ms = 4000) {
	const [show, setShow] = useState(false);
	useEffect(() => {
		if (!active) {
			setShow(false);
			return undefined;
		}
		const t = setTimeout(() => setShow(true), ms);
		return () => clearTimeout(t);
	}, [active, ms]);
	return show;
}
