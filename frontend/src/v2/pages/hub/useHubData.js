import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../../../api";
import { fetchProfile } from "../../data/profiles";

/**
 * Everything the hub shows, from the same endpoints V1 used plus the public
 * profile (record, journey route). Each source fails independently: a
 * missing wallet only hides the coin count, it never blanks the hub.
 */
export default function useHubData(user) {
	const [party, setParty] = useState(null);
	const [progress, setProgress] = useState(null);
	const [coins, setCoins] = useState(null);
	const [profile, setProfile] = useState(null);
	const [pendingEvos, setPendingEvos] = useState([]);
	const [pendingLearns, setPendingLearns] = useState([]);
	const [pc, setPc] = useState(null);

	const loadParty = useCallback(async () => {
		try {
			const { data } = await api.get(`/trainer/${user.trainer_id}/data`);
			setParty(data?.pokemon || []);
		} catch (err) {
			console.error("Failed to load party:", err.message);
			setParty([]);
		}
	}, [user?.trainer_id]);

	const loadPc = useCallback(async () => {
		try {
			const { data } = await api.get("/api/party/pc");
			setPc(data?.pc || []);
		} catch (err) {
			console.error("Failed to load PC:", err.message);
			setPc([]);
		}
	}, []);

	/**
	 * Party + PC layout write (reorder / deposit / withdraw / swap). Applies
	 * optimistically, then re-syncs from the server; on failure the server
	 * copy wins and the error message is returned for a toast.
	 */
	const arrange = useCallback(
		async (layout) => {
			const byId = new Map([...(party || []), ...(pc || [])].map((m) => [Number(m.id), m]));
			setParty(layout.party.map((id, i) => ({ ...byId.get(id), position: i + 1 })));
			setPc(layout.pc.map((id) => byId.get(id)));
			try {
				await api.post("/api/party/arrange", layout);
				return null;
			} catch (err) {
				return getErrorMessage(err, "Couldn't move that Pokémon");
			} finally {
				loadParty();
				loadPc();
			}
		},
		[party, pc, loadParty, loadPc]
	);

	const loadEvos = useCallback(async () => {
		try {
			const { data } = await api.get("/api/evolutions/pending");
			setPendingEvos(data?.pending || []);
		} catch (err) {
			console.error("Failed to load pending evolutions:", err.message);
		}
	}, []);

	const loadLearns = useCallback(async () => {
		try {
			const { data } = await api.get("/api/moves/pending");
			setPendingLearns(data?.pending || []);
		} catch (err) {
			console.error("Failed to load pending move offers:", err.message);
		}
	}, []);

	const loadRest = useCallback(async () => {
		const [prog, mart, prof] = await Promise.allSettled([
			api.get("/api/campaign/progress"),
			api.get("/api/mart"),
			fetchProfile(user.trainer_id, { fresh: true }),
		]);
		if (prog.status === "fulfilled" && prog.value.data?.success) setProgress(prog.value.data.progress);
		if (mart.status === "fulfilled" && typeof mart.value.data?.coins === "number") setCoins(mart.value.data.coins);
		if (prof.status === "fulfilled" && prof.value.status === "ok") setProfile(prof.value.profile);
	}, [user?.trainer_id]);

	useEffect(() => {
		if (!user?.starterChosen) return;
		loadParty();
		loadPc();
		loadEvos();
		loadLearns();
		loadRest();
	}, [user?.starterChosen, loadParty, loadPc, loadEvos, loadLearns, loadRest]);

	return { party, pc, progress, coins, profile, pendingEvos, pendingLearns, loadParty, loadEvos, loadLearns, arrange };
}
