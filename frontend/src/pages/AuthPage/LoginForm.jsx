// LoginForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../App";
import { api, getErrorMessage } from "../../api";

const LoginForm = ({ formRef }) => {
	const { setUser } = useUser();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setErrorMsg("");
		setLoading(true);

		try {
			const { data } = await api.post("/api/login", { email, password });
			if (data.success) {
				localStorage.setItem("token", data.token);

				const { data: validateData } = await api.get("/api/validate");
				if (validateData.success) {
					localStorage.setItem("trainer", JSON.stringify(validateData.user));
					setUser(validateData.user);
					navigate("/game");
				} else {
					setErrorMsg(validateData.error || "Validation failed.");
				}
			} else {
				setErrorMsg(data.error || "Login failed.");
			}
		} catch (err) {
			setErrorMsg(getErrorMessage(err, "Error during login"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<form ref={formRef} onSubmit={handleSubmit} className="space-y-4 max-w-xs mx-auto py-10">
			<div>
				<label htmlFor="login-email" className="lcd-label">
					Email
				</label>
				<input
					id="login-email"
					type="email"
					placeholder="trainer@kanto.net"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					className="lcd-field"
				/>
			</div>
			<div>
				<label htmlFor="login-password" className="lcd-label">
					Password
				</label>
				<input
					id="login-password"
					type="password"
					placeholder="Enter your password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					className="lcd-field"
				/>
			</div>
			<button
				type="submit"
				disabled={loading}
				className="pixel-btn pixel-btn--primary w-full"
			>
				{loading ? "Logging in..." : "Login"}
			</button>
			{errorMsg && (
				<p
					className="font-pixel text-[0.6rem] leading-relaxed"
					role="alert"
					style={{ color: "var(--hp-red)" }}
				>
					{errorMsg}
				</p>
			)}
		</form>
	);
};

export default LoginForm;
