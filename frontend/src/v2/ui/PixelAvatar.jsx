import React from "react";
import PixelTrainer from "./PixelTrainer";

/**
 * Trainer avatar: the head of the trainer's own overworld sprite, so the top
 * bar, chat and hover cards show the same person the world does. Guests and
 * trainers whose gender is not known yet get the neutral townsperson.
 */
const PixelAvatar = ({ gender, tint, size = 40, guest = false, className = "", label }) => (
	<span
		className={`avatar ${className}`}
		style={{ width: size, height: size }}
		role={label ? "img" : undefined}
		aria-label={label}
		aria-hidden={label ? undefined : true}
	>
		<PixelTrainer gender={guest ? undefined : gender} sprite={guest || !gender ? "npc" : undefined} tint={tint} head />
	</span>
);

export default PixelAvatar;
