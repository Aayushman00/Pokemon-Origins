// RegistrationForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../App";
import { api, getErrorMessage } from "../../api";

const RegistrationForm = ({ formRef }) => {
	const { setUser } = useUser();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [gender, setGender] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setErrorMsg("");
		setLoading(true);

		try {
			const { data } = await api.post("/api/register", {
				name,
				email,
				gender,
				password,
			});
			if (data.success) {
				localStorage.setItem("trainer", JSON.stringify(data.user));
				localStorage.setItem("token", data.token);
				setUser(data.user);
				navigate("/game");
			} else {
				setErrorMsg(data.error || "Registration failed.");
			}
		} catch (err) {
			setErrorMsg(getErrorMessage(err, "Error during registration"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label htmlFor="register-name" className="lcd-label">
					Your Name
				</label>
				<input
					id="register-name"
					type="text"
					placeholder="Enter your name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
					className="lcd-field"
				/>
			</div>
			<div>
				<label htmlFor="register-email" className="lcd-label">
					Email
				</label>
				<input
					id="register-email"
					type="email"
					placeholder="trainer@kanto.net"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					className="lcd-field"
				/>
			</div>
			<div>
				<label htmlFor="register-gender" className="lcd-label">
					Gender
				</label>
				<select
					id="register-gender"
					value={gender}
					onChange={(e) => setGender(e.target.value)}
					required
					className="lcd-field"
				>
					<option value="">Select gender</option>
					<option value="Male">Male</option>
					<option value="Female">Female</option>
					<option value="Other">Other</option>
				</select>
			</div>
			<div>
				<label htmlFor="register-password" className="lcd-label">
					Password
				</label>
				<input
					id="register-password"
					type="password"
					placeholder="Enter a secure password"
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
				{loading ? "Registering..." : "Register"}
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

export default RegistrationForm;
