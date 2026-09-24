import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Panel from "./Panel";

/** Accessible modal: focus moves in, Escape closes, focus returns on close. */
const Modal = ({ open, onClose, title, children, variant }) => {
	const ref = useRef(null);
	const closeRef = useRef(onClose);
	closeRef.current = onClose;

	useEffect(() => {
		if (!open) return undefined;
		const previous = document.activeElement;
		const first = ref.current?.querySelector("button, [href], input, select, textarea");
		(first || ref.current)?.focus();
		const onKey = (e) => {
			if (e.key === "Escape") closeRef.current?.();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			previous?.focus?.();
		};
	}, [open]);

	if (!open) return null;
	return createPortal(
		<div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
			<div ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
				<Panel variant={variant} lift title={title}>
					{children}
				</Panel>
			</div>
		</div>,
		document.body
	);
};

export default Modal;
