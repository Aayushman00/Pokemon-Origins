import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import PokemonSprite from "../../components/PokemonSprite/PokemonSprite";
import PixelAvatar from "./PixelAvatar";
import { ProgressBar } from "./Bars";
import { badgeCount, fetchProfile, isGuestId } from "../data/profiles";

const OPEN_DELAY_MS = 220;
const CLOSE_DELAY_MS = 180;
const CARD_W = 300;

const Stat = ({ label, value }) => (
	<div className="stats__row">
		<dt>{label}</dt>
		<span className="stats__lead" aria-hidden="true" />
		<dd>{value}</dd>
	</div>
);

const Presence = ({ online, guest }) => (
	<div className="hovercard__foot">
		<span className={`presence ${online ? (guest ? "presence--guest" : "presence--online") : ""}`} aria-hidden="true" />
		{online ? (guest ? "In the playground as a guest" : "Online in the playground") : "Offline"}
	</div>
);

function CardBody({ state, name, trainerId, online }) {
	if (!state || state.status === "loading") {
		return (
			<div className="hovercard__head">
				<PixelAvatar seed={trainerId ?? name} size={48} />
				<div>
					<p className="hovercard__name">{name}</p>
					<p className="hovercard__sub loading-dots">Checking trainer records</p>
				</div>
			</div>
		);
	}

	if (state.status !== "ok") {
		const guest = state.status === "guest";
		return (
			<div className="hovercard--unknown">
				<div className="hovercard__head">
					<span className="hovercard__glyph" aria-hidden="true">
						?
					</span>
					<div>
						<p className="hovercard__name">{name}</p>
						<p className="hovercard__sub">{guest ? "Unregistered trainer" : "Unknown trainer"}</p>
					</div>
				</div>
				<p className="hovercard__section read">
					{guest
						? "Exploring without a BattleSIM account, so there's no journey, party, or battle record to show."
						: state.status === "error"
						? "Trainer records couldn't be reached. Hover again in a moment."
						: "No BattleSIM profile matches this trainer."}
				</p>
				<Presence online={online} guest={guest} />
			</div>
		);
	}

	const p = state.profile;
	const c = p.campaign;
	const r = p.record;
	return (
		<>
			<div className="hovercard__head">
				<PixelAvatar seed={p.trainer_id} size={48} />
				<div>
					<p className="hovercard__name">{p.name}</p>
					<p className="hovercard__sub">
						{c.champion ? "Champion" : `Stage ${c.current_level}: ${c.level_name || "Kanto"}`}
					</p>
				</div>
			</div>

			<div className="hovercard__section">
				<p className="hovercard__label">Journey</p>
				<ProgressBar value={c.battles_cleared} max={c.total_battles} label="Campaign battles cleared" />
			</div>

			<dl className="stats hovercard__section">
				<Stat label="Wins" value={r.wins} />
				<Stat label="Losses" value={r.losses} />
				<Stat label="Win rate" value={r.win_rate == null ? "No battles yet" : `${r.win_rate}%`} />
				<Stat label="Badges" value={`${badgeCount(c)} / 8`} />
			</dl>

			<div className="hovercard__section">
				<p className="hovercard__label">Party</p>
				{p.party.length ? (
					<div className="hovercard__party">
						{p.party.map((mon) => (
							<div className="hovercard__mon" key={mon.position}>
								<PokemonSprite pokemonId={mon.pokemon_id} variant="front" alt="" className="sprite" />
								<span className="caps">{mon.nickname}</span>
								<span>Lv. {mon.level}</span>
							</div>
						))}
					</div>
				) : (
					<p className="hovercard__sub">No partner chosen yet</p>
				)}
			</div>

			<Presence online={online} />
			<Link className="hovercard__link" to={`/trainer/${p.trainer_id}`}>
				Open trainer card
			</Link>
		</>
	);
}

/**
 * Wraps a trainer identity (avatar, name, map token). Desktop: opens on
 * hover after a short delay and stays open while the pointer is inside the
 * card. Keyboard: opens on focus. Touch: tap toggles, tap outside closes.
 */
const TrainerTrigger = ({ trainerId, name, online = false, className = "", children }) => {
	const [open, setOpen] = useState(false);
	const [state, setState] = useState(null);
	const [pos, setPos] = useState(null);
	const anchorRef = useRef(null);
	const cardRef = useRef(null);
	const openTimer = useRef(null);
	const closeTimer = useRef(null);
	const cardId = useId();

	const load = useCallback(() => {
		if (isGuestId(trainerId)) {
			setState({ status: "guest" });
			return;
		}
		setState((s) => (s?.status === "ok" ? s : { status: "loading" }));
		fetchProfile(trainerId).then(setState);
	}, [trainerId]);

	const show = useCallback(() => {
		clearTimeout(closeTimer.current);
		clearTimeout(openTimer.current);
		openTimer.current = setTimeout(() => {
			load();
			setOpen(true);
		}, OPEN_DELAY_MS);
	}, [load]);

	const hide = useCallback(() => {
		clearTimeout(openTimer.current);
		clearTimeout(closeTimer.current);
		closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
	}, []);

	useEffect(() => () => {
		clearTimeout(openTimer.current);
		clearTimeout(closeTimer.current);
	}, []);

	// Position next to the anchor, flipping to stay inside the viewport.
	useLayoutEffect(() => {
		if (!open || !anchorRef.current) return;
		const place = () => {
			const a = anchorRef.current.getBoundingClientRect();
			const h = cardRef.current?.offsetHeight || 320;
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			let left = a.left;
			if (left + CARD_W > vw - 8) left = Math.max(8, vw - CARD_W - 8);
			let top = a.bottom + 8;
			let origin = "top left";
			if (top + h > vh - 8 && a.top - h - 8 > 8) {
				top = a.top - h - 8;
				origin = "bottom left";
			}
			top = Math.max(8, Math.min(top, vh - h - 8));
			setPos({ left, top, origin });
		};
		place();
		window.addEventListener("scroll", place, true);
		window.addEventListener("resize", place);
		return () => {
			window.removeEventListener("scroll", place, true);
			window.removeEventListener("resize", place);
		};
	}, [open, state]);

	// Tap outside / Escape closes.
	useEffect(() => {
		if (!open) return undefined;
		const onDown = (e) => {
			if (anchorRef.current?.contains(e.target) || cardRef.current?.contains(e.target)) return;
			setOpen(false);
		};
		const onKey = (e) => e.key === "Escape" && setOpen(false);
		document.addEventListener("pointerdown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("pointerdown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	const onPointerEnter = (e) => e.pointerType === "mouse" && show();
	const onPointerLeave = (e) => e.pointerType === "mouse" && hide();
	const onClick = (e) => {
		e.stopPropagation();
		clearTimeout(openTimer.current);
		if (open) {
			setOpen(false);
		} else {
			load();
			setOpen(true);
		}
	};

	return (
		<>
			<button
				ref={anchorRef}
				type="button"
				className={`trainer-trigger ${className}`}
				aria-expanded={open}
				aria-controls={open ? cardId : undefined}
				aria-label={`${name}: trainer profile`}
				onPointerEnter={onPointerEnter}
				onPointerLeave={onPointerLeave}
				onFocus={show}
				onBlur={hide}
				onClick={onClick}
				onPointerDown={(e) => e.stopPropagation()}
			>
				{children}
			</button>
			{open &&
				createPortal(
					<div
						ref={cardRef}
						id={cardId}
						role="dialog"
						aria-label={`${name}'s trainer profile`}
						className="frame panel hovercard frame--lift"
						style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, "--origin": pos?.origin }}
						onPointerEnter={() => clearTimeout(closeTimer.current)}
						onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
						onFocus={() => clearTimeout(closeTimer.current)}
						onBlur={hide}
					>
						<CardBody state={state} name={name} trainerId={trainerId} online={online} />
					</div>,
					document.body
				)}
		</>
	);
};

export default TrainerTrigger;
