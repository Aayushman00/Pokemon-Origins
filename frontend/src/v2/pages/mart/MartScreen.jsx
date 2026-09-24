import React, { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../../../api";
import Panel from "../../ui/Panel";
import Button from "../../ui/Button";
import MenuList from "../../ui/MenuList";
import Modal from "../../ui/Modal";
import DialogueBox from "../../ui/DialogueBox";
import { useToast } from "../../ui/toastContext";
import "../bag/items.css";

/** Mart: server-priced stock, coin balance, one-item purchases. */
const MartScreen = () => {
	const toast = useToast();
	const [mart, setMart] = useState(null);
	const [owned, setOwned] = useState({});
	const [focus, setFocus] = useState(null);
	const [confirm, setConfirm] = useState(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");

	const ownedMap = (items) => Object.fromEntries((items || []).map((i) => [i.itemId, i.quantity]));

	const load = useCallback(async () => {
		setError("");
		try {
			const [m, inv] = await Promise.all([api.get("/api/mart"), api.get("/api/inventory")]);
			if (!m.data?.success) throw new Error(m.data?.error || "Failed to load the mart");
			setMart(m.data);
			setOwned(ownedMap(inv.data?.items));
		} catch (err) {
			setError(getErrorMessage(err, "Couldn't reach the Mart"));
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const buy = async (row) => {
		setBusy(true);
		try {
			const { data } = await api.post("/api/mart/purchase", { itemId: row.itemId });
			if (!data?.success) throw new Error(data?.error || "Purchase failed");
			setMart((prev) => ({ ...prev, coins: data.coins }));
			setOwned(ownedMap(data.items));
			toast(`Bought ${data.purchased.name} for ${data.purchased.totalPrice} coins.`);
			setConfirm(null);
		} catch (err) {
			toast(getErrorMessage(err, "Purchase failed"), { tone: "error" });
		} finally {
			setBusy(false);
		}
	};

	if (error)
		return (
			<div className="page-center">
				<Panel lift title="Couldn't reach the Mart" className="journey-card">
					<p className="read" role="alert">
						{error}
					</p>
					<div className="result__actions">
						<Button variant="primary" onClick={load}>
							Try again
						</Button>
						<Button to="/game">Back to hub</Button>
					</div>
				</Panel>
			</div>
		);

	const current = focus?.row;
	const clerk = !mart
		? "…"
		: !mart.available
		? mart.unlockHint || "We're closed until you beat the first Gym Leader. Come back then!"
		: current
		? `${current.name}: ${current.description}`
		: "Welcome! How may I serve you?";

	return (
		<div className="page items">
			<div className="items__side">
				<div className="frame panel items__wallet">
					<span className="items__wallet-label">Coins</span>
					<strong className="items__wallet-value">
						<span className="coin" aria-hidden="true" /> {mart ? mart.coins.toLocaleString() : "…"}
					</strong>
				</div>
			</div>

			<Panel className="items__list" plate="Mart">
				{!mart ? (
					<p className="loading-dots muted">Opening the shop</p>
				) : !mart.available ? (
					<p className="read muted">The shelves are covered for now.</p>
				) : (
					<MenuList
						label="Items for sale"
						autoFocus
						onActiveChange={(it) => setFocus(it)}
						items={mart.stock.map((row) => ({
							id: row.itemId,
							label: (
								<span className="mart-line">
									<span>{row.name}</span>
									{owned[row.itemId] ? <span className="muted mart-line__own">have {owned[row.itemId]}</span> : null}
								</span>
							),
							hint: `${row.price}c`,
							row,
							disabled: mart.coins < row.price,
							onSelect: () => setConfirm(row),
						}))}
					/>
				)}
				<Button to="/game" className="items__back">
					Leave the Mart
				</Button>
			</Panel>

			<DialogueBox className="items__desc" keys={false} text={clerk} />

			<Modal open={!!confirm} onClose={() => !busy && setConfirm(null)} title="Buy this?">
				{confirm && (
					<>
						<p className="read">
							{confirm.name} costs {confirm.price} coins. You have {mart.coins}.
						</p>
						<div className="result__actions">
							<Button variant="go" disabled={busy} onClick={() => buy(confirm)}>
								{busy ? "Buying…" : "Buy it"}
							</Button>
							<Button disabled={busy} onClick={() => setConfirm(null)}>
								Not now
							</Button>
						</div>
					</>
				)}
			</Modal>
		</div>
	);
};

export default MartScreen;
