import React from "react";

/**
 * Notched pixel panel. `variant`: paper (default) | navy | sign | inset.
 * `plate` renders a title tab on the top edge; `title`/`meta` a header row.
 */
const Panel = ({
	as: Tag = "section",
	variant,
	plate,
	plateTone,
	title,
	meta,
	lift = false,
	className = "",
	children,
	...rest
}) => (
	<Tag
		className={`frame panel ${variant ? `panel--${variant}` : ""} ${lift ? "frame--lift" : ""} ${className}`}
		{...rest}
	>
		{plate && <div className={`plate ${plateTone ? `plate--${plateTone}` : ""}`}>{plate}</div>}
		{(title || meta) && (
			<header className="panel__head">
				{title && <h2 className="panel__title">{title}</h2>}
				{meta && <span className="panel__meta">{meta}</span>}
			</header>
		)}
		{children}
	</Tag>
);

export default Panel;
