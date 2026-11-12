import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AppShell from "./v2/layout/AppShell";
import { ToastProvider } from "./v2/ui/Toast";
import { isEnabled } from "./flags";

// One chunk per screen: a page's code downloads only when it is visited.
const TitleScreen = lazy(() => import("./v2/pages/title/TitleScreen"));
const AuthScreen = lazy(() => import("./v2/pages/auth/AuthScreen"));
const HubScreen = lazy(() => import("./v2/pages/hub/HubScreen"));
const JourneyScreen = lazy(() => import("./v2/pages/battle/JourneyScreen"));
const PlaygroundScreen = lazy(() => import("./v2/pages/playground/PlaygroundScreen"));
const TrainerScreen = lazy(() => import("./v2/pages/trainer/TrainerScreen"));
const HistoryScreen = lazy(() => import("./v2/pages/trainer/HistoryScreen"));
const BagScreen = lazy(() => import("./v2/pages/bag/BagScreen"));
const MartScreen = lazy(() => import("./v2/pages/mart/MartScreen"));
const DexScreen = lazy(() => import("./v2/pages/dex/DexScreen"));
const DexEntryScreen = lazy(() => import("./v2/pages/dex/DexEntryScreen"));
const MoveLabScreen = lazy(() => import("./v2/pages/movelab/MoveLabScreen"));
const OverworldScreen = lazy(() => import("./v2/overworld/ui/OverworldScreen"));
import { api } from "./api";
import { UserContext } from "./v2/data/user";


const Protected = ({ user, children }) => (user ? children : <Navigate to="/auth" replace />);

function App() {
	const [user, setUser] = useState(null);
	const [rehydrated, setRehydrated] = useState(false);

	useEffect(() => {
		async function validateSession() {
			const storedUser = localStorage.getItem("trainer");
			const token = localStorage.getItem("token");
			if (storedUser && token) {
				try {
					const { data } = await api.get("/api/validate");
					if (data.success) {
						setUser(data.user);
						localStorage.setItem("trainer", JSON.stringify(data.user));
					} else {
						localStorage.removeItem("trainer");
						localStorage.removeItem("token");
					}
				} catch (error) {
					console.error("Validation error:", error);
					localStorage.removeItem("trainer");
					localStorage.removeItem("token");
				}
			}
			setRehydrated(true);
		}
		validateSession();
	}, []);

	if (!rehydrated)
		return (
			<div className="page-center">
				<p className="loading-dots">Loading save file</p>
			</div>
		);

	return (
		<UserContext.Provider value={{ user, setUser }}>
			<ToastProvider>
				<Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
					<AppShell>
						<Suspense
							fallback={
								<div className="page-center">
									<p className="loading-dots">Loading</p>
								</div>
							}
						>
						<Routes>
							<Route path="/" element={<TitleScreen />} />
							<Route path="/auth" element={<AuthScreen />} />
							<Route path="/pokedex" element={<DexScreen />} />
							<Route path="/pokedex/:id" element={<DexEntryScreen />} />
							<Route path="/playground" element={<PlaygroundScreen />} />
							<Route path="/trainer/:trainerId" element={<TrainerScreen />} />
							<Route path="/trainer/:trainerId/battles" element={<HistoryScreen />} />
							<Route path="/trainer" element={<Protected user={user}><TrainerScreen /></Protected>} />
							<Route path="/game" element={<Protected user={user}><HubScreen /></Protected>} />
							<Route path="/game/bag" element={<Protected user={user}><BagScreen /></Protected>} />
							<Route path="/game/mart" element={<Protected user={user}><MartScreen /></Protected>} />
							<Route path="/level/:levelNumber" element={<Protected user={user}><JourneyScreen /></Protected>} />
							<Route path="/game/movelab" element={<Protected user={user}><MoveLabScreen /></Protected>} />
							{isEnabled("OVERWORLD") && <Route path="/overworld" element={<Protected user={user}><OverworldScreen /></Protected>} />}
							<Route path="*" element={<Navigate to={user ? "/game" : "/"} replace />} />
						</Routes>
						</Suspense>
					</AppShell>
				</Router>
			</ToastProvider>
		</UserContext.Provider>
	);
}

export default App;
