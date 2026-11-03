import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api, getErrorMessage } from "../../../api";
import Panel from "../../ui/Panel";
import Button from "../../ui/Button";
import "./movelab.css";

const STATUS_OPTIONS = ["Healthy", "brn", "par", "psn", "slp", "frz"];
const STAGE_KEYS = ["atk", "def", "spa", "spd", "acc", "eva"];
const TRI_STATE_OPTIONS = [
	{ value: "unset", label: "Normal RNG" },
	{ value: "true", label: "Force yes" },
	{ value: "false", label: "Force no" },
];

// Each override is tri-state: null = let RNG decide (omitted from the
// request), true = force it, false = force it not to happen. A checkbox
// can't represent "unset" distinctly from "force false", so these render
// as <select> controls instead.
function triStateToValue(v) {
	return v === null ? "unset" : String(v);
}

function valueToTriState(s) {
	if (s === "unset") return null;
	return s === "true";
}

function defaultMon() {
	return {
		pokemonId: "",
		level: 50,
		moveId: "",
		status: "Healthy",
		hpPercent: 100,
		stages: { atk: 0, def: 0, spa: 0, spd: 0, acc: 0, eva: 0 },
		forceHit: null,
		forceCrit: null,
		forceSecondary: null,
	};
}

function MonSetupPanel({ label, mon, setMon, species, moves }) {
	const update = (patch) => setMon((prev) => ({ ...prev, ...patch }));
	const updateStage = (key, value) =>
		setMon((prev) => ({ ...prev, stages: { ...prev.stages, [key]: value } }));

	return (
		<Panel className="movelab-panel">
			<h3>{label}</h3>
			<label>
				Species
				<select
					value={mon.pokemonId}
					onChange={(e) => update({ pokemonId: e.target.value })}
				>
					<option value="">Select a species...</option>
					{species.map((s) => (
						<option key={s.pokemon_id} value={s.pokemon_id}>
							{s.name}
						</option>
					))}
				</select>
			</label>
			<label>
				Level
				<input
					type="number"
					min={1}
					max={100}
					value={mon.level}
					onChange={(e) => update({ level: Number(e.target.value) })}
				/>
			</label>
			<label>
				Move
				<select value={mon.moveId} onChange={(e) => update({ moveId: e.target.value })}>
					<option value="">Select a move...</option>
					{moves.map((m) => (
						<option key={m.move_id} value={m.move_id}>
							{m.name} ({m.move_type})
						</option>
					))}
				</select>
			</label>
			<label>
				Status
				<select value={mon.status} onChange={(e) => update({ status: e.target.value })}>
					{STATUS_OPTIONS.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
			</label>
			<label>
				HP%
				<input
					type="range"
					min={1}
					max={100}
					value={mon.hpPercent}
					onChange={(e) => update({ hpPercent: Number(e.target.value) })}
				/>
				<span>{mon.hpPercent}%</span>
			</label>
			<div className="movelab-stages">
				{STAGE_KEYS.map((key) => (
					<label key={key}>
						{key}
						<input
							type="number"
							min={-6}
							max={6}
							value={mon.stages[key]}
							onChange={(e) => updateStage(key, Number(e.target.value))}
						/>
					</label>
				))}
			</div>
			<div className="movelab-overrides">
				<label>
					Hit roll
					<select
						value={triStateToValue(mon.forceHit)}
						onChange={(e) => update({ forceHit: valueToTriState(e.target.value) })}
					>
						{TRI_STATE_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</label>
				<label>
					Crit roll
					<select
						value={triStateToValue(mon.forceCrit)}
						onChange={(e) => update({ forceCrit: valueToTriState(e.target.value) })}
					>
						{TRI_STATE_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</label>
				<label>
					Secondary-effect proc
					<select
						value={triStateToValue(mon.forceSecondary)}
						onChange={(e) => update({ forceSecondary: valueToTriState(e.target.value) })}
					>
						{TRI_STATE_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</label>
			</div>
		</Panel>
	);
}

const MoveLabScreen = () => {
	const [species, setSpecies] = useState([]);
	const [moves, setMoves] = useState([]);
	const [monA, setMonA] = useState(defaultMon);
	const [monB, setMonB] = useState(defaultMon);
	const [result, setResult] = useState(null);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		setError("");
		try {
			const [speciesRes, movesRes] = await Promise.all([
				api.get("/api/playground/species"),
				api.get("/api/playground/moves"),
			]);
			setSpecies(speciesRes.data?.species || []);
			setMoves(movesRes.data?.moves || []);
		} catch (err) {
			setError(getErrorMessage(err, "Couldn't load Move Lab data"));
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const canRun = useMemo(
		() => monA.pokemonId && monA.moveId && monB.pokemonId && monB.moveId,
		[monA, monB]
	);

	const runExchange = async () => {
		setBusy(true);
		setError("");
		try {
			const payload = {
				monA: { ...monA, pokemonId: Number(monA.pokemonId), moveId: Number(monA.moveId) },
				monB: { ...monB, pokemonId: Number(monB.pokemonId), moveId: Number(monB.moveId) },
			};
			const { data } = await api.post("/api/playground/exchange", payload);
			if (!data?.success) throw new Error(data?.error || "Exchange failed");
			setResult(data);
		} catch (err) {
			setError(getErrorMessage(err, "Exchange failed"));
			setResult(null);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="movelab">
			<h2>Move Lab</h2>
			<p>Pick two Pokémon and a move for each, then run the exchange through the real battle engine.</p>
			{error && <p className="movelab-error">{error}</p>}
			<div className="movelab-panels">
				<MonSetupPanel label="Mon A" mon={monA} setMon={setMonA} species={species} moves={moves} />
				<MonSetupPanel label="Mon B" mon={monB} setMon={setMonB} species={species} moves={moves} />
			</div>
			<Button disabled={!canRun || busy} onClick={runExchange}>
				{busy ? "Running..." : "Run exchange"}
			</Button>
			{result && (
				<div className="movelab-log">
					{result.log.map((line, i) => (
						<div key={i}>{line}</div>
					))}
					<hr />
					<pre>{JSON.stringify(result.events, null, 2)}</pre>
				</div>
			)}
		</div>
	);
};

export default MoveLabScreen;
