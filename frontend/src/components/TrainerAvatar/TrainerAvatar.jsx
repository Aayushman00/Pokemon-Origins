import React, { useEffect, useState } from "react";

/**
 * Renders a trainer's battle-intro portrait from the local sprite tree
 * (/sprites/trainers/{trainerSprite}.png). Legendary/wild encounters have
 * no trainer, so callers should only mount this when `trainerSprite` is
 * a non-empty string — it renders nothing itself on a missing sprite.
 */
const TrainerAvatar = ({ trainerSprite, alt, className, ...rest }) => {
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		setFailed(false);
	}, [trainerSprite]);

	if (!trainerSprite || failed) return null;

	return (
		<img
			src={`/sprites/trainers/${trainerSprite}.png`}
			alt={alt || "Opposing trainer"}
			className={className}
			onError={() => setFailed(true)}
			{...rest}
		/>
	);
};

export default TrainerAvatar;
