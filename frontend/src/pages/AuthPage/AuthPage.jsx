import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import RegistrationForm from "./RegistrationForm";
import LoginForm from "./LoginForm";
import { useUser } from "../../App";
import Shell from "../../components/Shell/Shell";
import LcdPanel from "../../components/Shell/LcdPanel";

const AuthPage = () => {
	const { user } = useUser();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("login");
	const [poweredOn, setPoweredOn] = useState(false);
	const formRef = useRef(null);

	// Redirect to /game if user is already logged in
	useEffect(() => {
		if (user) {
			navigate("/game", { replace: true });
		}
	}, [user, navigate]);

	// GameBoy boot sequence; instant under reduced motion
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setPoweredOn(true);
			return;
		}
		const timer = setTimeout(() => setPoweredOn(true), 1200);
		return () => clearTimeout(timer);
	}, []);

	const toggleTab = () =>
		setActiveTab((tab) => (tab === "login" ? "register" : "login"));
	const submitActiveForm = () => formRef.current?.requestSubmit();

	return (
		<div className="device-backdrop flex flex-col items-center justify-center min-h-screen p-4">
			<div className="w-full max-w-md">
				<Shell
					poweredOn={poweredOn}
					controls={
						<>
							{/* D-pad and A/B buttons */}
							<div className="flex justify-between items-center mt-6 px-1">
								<div className="relative w-24 h-24" aria-hidden="true">
									<div className="absolute inset-0 bg-stone-900 rounded-full shadow-inner"></div>
									<div className="absolute left-8 top-0 w-8 h-8 bg-stone-700 rounded-md shadow-md"></div>
									<div className="absolute left-0 top-8 w-8 h-8 bg-stone-700 rounded-md shadow-md"></div>
									<div className="absolute left-8 bottom-0 w-8 h-8 bg-stone-700 rounded-md shadow-md"></div>
									<div className="absolute right-0 top-8 w-8 h-8 bg-stone-700 rounded-md shadow-md"></div>
									<div className="absolute left-8 top-8 w-8 h-8 bg-stone-800 rounded-sm"></div>
								</div>

								<div className="flex space-x-4 items-center">
									<button
										type="button"
										className="shell-btn-round"
										onClick={() => setActiveTab("login")}
										title="B — back to login"
										aria-label="B — back to login"
									>
										B
									</button>
									<button
										type="button"
										className="shell-btn-round"
										onClick={submitActiveForm}
										title="A — confirm"
										aria-label="A — confirm"
									>
										A
									</button>
								</div>
							</div>

							{/* SELECT switches tabs, START submits */}
							<div className="flex justify-center mt-6 space-x-8">
								<button
									type="button"
									className="shell-btn-pill -rotate-6"
									onClick={toggleTab}
								>
									SELECT
								</button>
								<button
									type="button"
									className="shell-btn-pill -rotate-6"
									onClick={submitActiveForm}
								>
									START
								</button>
							</div>

							{/* Speaker grill */}
							<div
								className="absolute bottom-5 right-7 flex space-x-1"
								aria-hidden="true"
							>
								{[...Array(6)].map((_, i) => (
									<div
										key={i}
										className="w-1 h-10 bg-stone-700/60 rounded-full"
									></div>
								))}
							</div>
						</>
					}
				>
					<LcdPanel on={poweredOn}>
						{/* Brand hero */}
						<div className="text-center mb-6">
							<h1
								className="font-pixel text-2xl leading-snug"
								style={{
									color: "var(--lcd-ink-bright)",
									textShadow: "0 3px 0 var(--lcd-shadow)",
								}}
							>
								POKEMON
								<br />
								ORIGINS
							</h1>
							<p
								className="font-pixel text-[0.55rem] mt-3 tracking-wider"
								style={{ color: "var(--lcd-ink-dim)" }}
							>
								BEGIN YOUR JOURNEY IN KANTO
							</p>
						</div>

						{/* Login / Register tabs */}
						<div className="flex justify-center gap-2 mb-5" role="tablist">
							<button
								role="tab"
								aria-selected={activeTab === "login"}
								className={`lcd-tab ${activeTab === "login" ? "lcd-tab--active" : ""}`}
								onClick={() => setActiveTab("login")}
							>
								Login
							</button>
							<button
								role="tab"
								aria-selected={activeTab === "register"}
								className={`lcd-tab ${activeTab === "register" ? "lcd-tab--active" : ""}`}
								onClick={() => setActiveTab("register")}
							>
								Register
							</button>
						</div>

						{activeTab === "login" ? (
							<LoginForm formRef={formRef} />
						) : (
							<RegistrationForm formRef={formRef} />
						)}

						<p
							className="font-pixel text-[0.5rem] text-center mt-5"
							style={{ color: "var(--lcd-ink-dim)" }}
						>
							SELECT: SWITCH · START / A: CONFIRM
						</p>
					</LcdPanel>
				</Shell>

				<p className="mt-6 text-center font-pixel text-[0.55rem] text-stone-500">
					© 2025 SAHIL · AYUSHMAN · ATHARVA · HIMANSHU
				</p>
			</div>
		</div>
	);
};

export default AuthPage;
