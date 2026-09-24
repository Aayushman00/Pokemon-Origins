import React, { useCallback, useRef, useState } from "react";
import { ToastContext } from "./toastContext";

/** Item-get style notifications: `toast(text, { tone: "error" })`. */
export const ToastProvider = ({ children }) => {
	const [toasts, setToasts] = useState([]);
	const idRef = useRef(0);

	const toast = useCallback((text, { tone = "info", ms = 3200 } = {}) => {
		const id = ++idRef.current;
		setToasts((list) => [...list.slice(-2), { id, text, tone }]);
		setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), ms);
	}, []);

	return (
		<ToastContext.Provider value={toast}>
			{children}
			<div className="toasts" role="status" aria-live="polite">
				{toasts.map((t) => (
					<div key={t.id} className={`frame toast frame--lift ${t.tone === "error" ? "toast--error" : ""}`}>
						{t.text}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
};
