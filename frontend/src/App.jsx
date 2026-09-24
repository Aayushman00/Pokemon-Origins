import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AppShell from "./v2/layout/AppShell";
import { ToastProvider } from "./v2/ui/Toast";
import TitleScreen from "./v2/pages/title/TitleScreen";
import AuthScreen from "./v2/pages/auth/AuthScreen";
import HubScreen from "./v2/pages/hub/HubScreen";
import JourneyScreen from "./v2/pages/battle/JourneyScreen";
import PlaygroundScreen from "./v2/pages/playground/PlaygroundScreen";
import TrainerScreen from "./v2/pages/trainer/TrainerScreen";
import BagScreen from "./v2/pages/bag/BagScreen";
import MartScreen from "./v2/pages/mart/MartScreen";
import DexScreen from "./v2/pages/dex/DexScreen";
import DexEntryScreen from "./v2/pages/dex/DexEntryScreen";
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
						<Routes>
							<Route path="/" element={<TitleScreen />} />
							<Route path="/auth" element={<AuthScreen />} />
							<Route path="/pokedex" element={<DexScreen />} />
							<Route path="/pokedex/:id" element={<DexEntryScreen />} />
							<Route path="/playground" element={<PlaygroundScreen />} />
							<Route path="/trainer/:trainerId" element={<TrainerScreen />} />
							<Route path="/trainer" element={<Protected user={user}><TrainerScreen /></Protected>} />
							<Route path="/game" element={<Protected user={user}><HubScreen /></Protected>} />
							<Route path="/game/bag" element={<Protected user={user}><BagScreen /></Protected>} />
							<Route path="/game/mart" element={<Protected user={user}><MartScreen /></Protected>} />
							<Route path="/level/:levelNumber" element={<Protected user={user}><JourneyScreen /></Protected>} />
							<Route path="*" element={<Navigate to={user ? "/game" : "/"} replace />} />
						</Routes>
					</AppShell>
				</Router>
			</ToastProvider>
		</UserContext.Provider>
	);
}

export default App;
