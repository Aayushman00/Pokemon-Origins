import React from "react";
import { Link } from "react-router-dom";

/** Chunky pixel button. Pass `to` to render a router Link. */
const Button = ({ variant, size, block, to, className = "", children, ...rest }) => {
	const cls = `frame btn ${variant ? `btn--${variant}` : ""} ${size ? `btn--${size}` : ""} ${
		block ? "btn--block" : ""
	} ${className}`;
	if (to) {
		return (
			<Link to={to} className={cls} {...rest}>
				{children}
			</Link>
		);
	}
	return (
		<button type="button" className={cls} {...rest}>
			{children}
		</button>
	);
};

export default Button;
