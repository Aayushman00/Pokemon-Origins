import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "../../data/user";
import { api, getErrorMessage } from "../../../api";
import Panel from "../../ui/Panel";
import Button from "../../ui/Button";
import Tabs from "../../ui/Tabs";
import DialogueBox from "../../ui/DialogueBox";
import PixelTrainer from "../../ui/PixelTrainer";
import "./auth.css";

const Field = ({ id, label, as, ...input }) => (
	<div className="field">
		<label className="field__label" htmlFor={id}>
			{label}
		</label>
		{as === "select" ? <select id={id} className="field__input" {...input} /> : <input id={id} className="field__input" {...input} />}
	</div>
);

/** Log in / new trainer. Same endpoints as V1 (/api/login, /api/register, /api/validate). */
const AuthScreen = () => {
	const { user, setUser } = useUser();
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "login");
	const [form, setForm] = useState({ name: "", email: "", gender: "", password: "" });
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (user) navigate("/game", { replace: true });
	}, [user, navigate]);

	const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

	const submit = async (e) => {
		e.preventDefault();
		setError("");
		setBusy(true);
		try {
			if (mode === "login") {
				const { data } = await api.post("/api/login", { email: form.email, password: form.password });
				if (!data.success) throw new Error(data.error || "Login failed.");
				localStorage.setItem("token", data.token);
				const { data: v } = await api.get("/api/validate");
				if (!v.success) throw new Error(v.error || "Couldn't load your save file.");
				localStorage.setItem("trainer", JSON.stringify(v.user));
				setUser(v.user);
			} else {
				const { data } = await api.post("/api/register", form);
				if (!data.success) throw new Error(data.error || "Registration failed.");
				localStorage.setItem("trainer", JSON.stringify(data.user));
				localStorage.setItem("token", data.token);
				setUser(data.user);
			}
			navigate("/game");
		} catch (err) {
			setError(getErrorMessage(err, mode === "login" ? "Couldn't log in" : "Couldn't create your trainer"));
		} finally {
			setBusy(false);
		}
	};

	const guide =
		mode === "login"
			? "Welcome back! Enter the email and password on your trainer license."
			: "Hello there! A new trainer? Fill in your license and your adventure begins.";

	return (
		<div className="page auth">
			<div className="auth__guide">
				<div className="auth__portrait" aria-hidden="true">
					<PixelTrainer gender={form.gender || (mode === "login" ? "Male" : "Other")} size={120} />
				</div>
				<DialogueBox text={guide} keys={false} />
			</div>

			<Panel lift className="auth__panel">
				<Tabs
					label="Account"
					value={mode}
					onChange={(m) => {
						setMode(m);
						setError("");
					}}
					tabs={[
						{ id: "login", label: "Log in" },
						{ id: "register", label: "New trainer" },
					]}
				/>
				<form className="auth__form" onSubmit={submit}>
					{mode === "register" && <Field id="reg-name" label="Trainer name" value={form.name} onChange={set("name")} required autoComplete="nickname" maxLength={40} />}
					<Field id="auth-email" label="Email" type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
					{mode === "register" && (
						<Field id="reg-gender" label="Trainer look" as="select" value={form.gender} onChange={set("gender")} required>
							<option value="">Choose one</option>
							<option value="Male">Boy</option>
							<option value="Female">Girl</option>
							<option value="Other">Other</option>
						</Field>
					)}
					<Field
						id="auth-password"
						label="Password"
						type="password"
						value={form.password}
						onChange={set("password")}
						required
						autoComplete={mode === "login" ? "current-password" : "new-password"}
					/>
					{error && (
						<p className="form-error" role="alert">
							{error}
						</p>
					)}
					<Button type="submit" variant="go" size="lg" block disabled={busy}>
						{busy ? "One moment…" : mode === "login" ? "Log in" : "Create trainer"}
					</Button>
				</form>
			</Panel>
		</div>
	);
};

export default AuthScreen;
