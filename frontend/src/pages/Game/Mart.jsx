// Mart.jsx — Phase 8 shop.
// Availability, coins, stock, and prices are server truth (GET /api/mart);
// the mart stays locked until the Level 1 gym boss is beaten. Purchases go
// through POST /api/mart/purchase, which debits coins and credits the
// inventory in one transaction — the UI just renders the returned balance
// and quantities. Text/LCD only: no shopkeeper art.
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../App";
import { api, getErrorMessage } from "../../api";
import Shell from "../../components/Shell/Shell";
import LcdPanel from "../../components/Shell/LcdPanel";

const Mart = () => {
	const { user } = useUser();
	const navigate = useNavigate();
	const [mart, setMart] = useState(null); // { available, coins, stock, unlockHint? }
	const [owned, setOwned] = useState({}); // itemId -> quantity
	const [busyItemId, setBusyItemId] = useState(null);
	const [message, setMessage] = useState("");
	const [messageTone, setMessageTone] = useState("info"); // 'info' | 'error'
	const [error, setError] = useState("");

	useEffect(() => {
		if (!user) navigate("/auth");
	}, [user, navigate]);

	const toOwnedMap = (items) =>
		Object.fromEntries((items || []).map((item) => [item.itemId, item.quantity]));

	const load = useCallback(async () => {
		try {
			const [martRes, invRes] = await Promise.all([
				api.get("/api/mart"),
				api.get("/api/inventory"),
			]);
			if (!martRes.data?.success) {
				throw new Error(martRes.data?.error || "Failed to load the mart");
			}
			setMart(martRes.data);
			setOwned(toOwnedMap(invRes.data?.items));
		} catch (err) {
			console.error("Failed to load mart:", err.response || err.message);
			setError(getErrorMessage(err, "Failed to load the mart"));
		}
	}, []);

	useEffect(() => {
		if (user) load();
	}, [user, load]);

	const buy = async (row) => {
		setBusyItemId(row.itemId);
		setMessage("");
		try {
			const { data } = await api.post("/api/mart/purchase", {
				itemId: row.itemId,
			});
			if (!data?.success) {
				throw new Error(data?.error || "Purchase failed");
			}
			setMart((prev) => ({ ...prev, coins: data.coins }));
			setOwned(toOwnedMap(data.items));
			setMessage(
				`Bought ${data.purchased.name} for ${data.purchased.totalPrice} coins!`
			);
			setMessageTone("info");
		} catch (err) {
			console.error("Purchase failed:", err.response || err.message);
			setMessage(getErrorMessage(err, "Purchase failed"));
			setMessageTone("error");
		} finally {
			setBusyItemId(null);
		}
	};

	if (error)
		return (
			<div className="device-backdrop flex items-center justify-center p-4">
				<div className="font-pixel text-center max-w-md space-y-4">
					<p
						className="text-[0.7rem] leading-relaxed"
						role="alert"
						style={{ color: "var(--hp-red)" }}
					>
						{error}
					</p>
					<div className="flex gap-2 justify-center">
						<button
							className="pixel-btn pixel-btn--primary"
							onClick={() => {
								setError("");
								load();
							}}
						>
							Retry
						</button>
						<button className="pixel-btn" onClick={() => navigate("/game")}>
							Back to hub
						</button>
					</div>
				</div>
			</div>
		);

	return (
		<div className="device-backdrop flex items-center justify-center p-4">
			<div className="w-full max-w-xl">
				<Shell poweredOn>
					<LcdPanel>
						<h1
							className="font-pixel text-base text-center leading-relaxed"
							style={{
								color: "var(--lcd-ink-bright)",
								textShadow: "0 2px 0 var(--lcd-shadow)",
							}}
						>
							POKé MART
						</h1>
						<hr className="lcd-divider" />

						{mart === null ? (
							<p
								className="font-pixel text-[0.6rem] text-center"
								style={{ color: "var(--lcd-ink-dim)" }}
							>
								Opening the shop...
							</p>
						) : !mart.available ? (
							<>
								<p
									className="font-pixel text-[0.65rem] text-center leading-relaxed"
									style={{ color: "var(--lcd-ink-bright)" }}
								>
									CLOSED
								</p>
								<p
									className="font-pixel text-[0.55rem] text-center mt-3 leading-relaxed"
									style={{ color: "var(--lcd-ink-dim)" }}
								>
									{mart.unlockHint ||
										"Defeat the Level 1 Gym Leader to open the Mart."}
								</p>
							</>
						) : (
							<>
								<p
									className="font-pixel text-[0.6rem] text-right"
									style={{ color: "var(--lcd-ink-bright)" }}
								>
									COINS: {mart.coins}
								</p>
								<div className="space-y-2 mt-3">
									{mart.stock.map((row) => {
										const canAfford = mart.coins >= row.price;
										const isBusy = busyItemId === row.itemId;
										return (
											<div
												key={row.itemId}
												className="starter-slot w-full !flex-row !items-start gap-3 text-left"
											>
												<span className="flex-1">
													<span
														className="font-pixel text-[0.6rem] block"
														style={{ color: "var(--lcd-ink-bright)" }}
													>
														{row.name.toUpperCase()}{" "}
														<span style={{ color: "var(--lcd-ink-dim)" }}>
															{owned[row.itemId]
																? `(own x${owned[row.itemId]})`
																: ""}
														</span>
													</span>
													<span
														className="font-pixel text-[0.45rem] block mt-1 leading-relaxed"
														style={{ color: "var(--lcd-ink-dim)" }}
													>
														{row.description}
													</span>
												</span>
												<span className="flex flex-col items-end gap-1 shrink-0">
													<span
														className="font-pixel text-[0.55rem]"
														style={{ color: "var(--lcd-ink)" }}
													>
														{row.price}c
													</span>
													<button
														className="pixel-btn pixel-btn--primary !text-[0.5rem] px-2 py-1"
														disabled={isBusy || !canAfford}
														onClick={() => buy(row)}
													>
														{isBusy ? "..." : "BUY"}
													</button>
												</span>
											</div>
										);
									})}
								</div>
							</>
						)}

						{message && (
							<p
								className="font-pixel text-[0.55rem] text-center mt-4 leading-relaxed"
								role={messageTone === "error" ? "alert" : "status"}
								style={{
									color:
										messageTone === "error"
											? "var(--hp-red)"
											: "var(--lcd-accent)",
								}}
							>
								{message}
							</p>
						)}

						<button
							className="pixel-btn w-full mt-5"
							onClick={() => navigate("/game")}
						>
							Back to hub
						</button>
					</LcdPanel>
				</Shell>
			</div>
		</div>
	);
};

export default Mart;
