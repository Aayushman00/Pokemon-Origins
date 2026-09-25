import React, { useEffect, useRef, useState } from "react";
import PokemonSprite from "../../components/PokemonSprite/PokemonSprite";
import { getPokemonSprite } from "../../sprites/pokemonSprites";

const DARK = 70; // luma below this counts as outline / eye detail

/**
 * Halve an RGBA image into chunkier pixels without losing what makes a sprite
 * readable. Per 2x2 block: transparent if <2 of 4 pixels are solid; the darkest
 * pixel if the block holds outline/eye detail; otherwise the average colour.
 */
export function halfPixelate(data, w, h) {
	const ow = w >> 1;
	const oh = h >> 1;
	const out = new Uint8ClampedArray(ow * oh * 4);
	for (let y = 0; y < oh; y++) {
		for (let x = 0; x < ow; x++) {
			let solid = 0;
			let r = 0;
			let g = 0;
			let b = 0;
			let dark = null;
			let darkLuma = DARK;
			for (let dy = 0; dy < 2; dy++) {
				for (let dx = 0; dx < 2; dx++) {
					const i = ((y * 2 + dy) * w + (x * 2 + dx)) * 4;
					if (data[i + 3] < 128) continue;
					solid++;
					r += data[i];
					g += data[i + 1];
					b += data[i + 2];
					const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
					if (luma < darkLuma) {
						darkLuma = luma;
						dark = i;
					}
				}
			}
			if (solid < 2) continue;
			const o = (y * ow + x) * 4;
			if (dark !== null) {
				out[o] = data[dark];
				out[o + 1] = data[dark + 1];
				out[o + 2] = data[dark + 2];
			} else {
				out[o] = r / solid;
				out[o + 1] = g / solid;
				out[o + 2] = b / solid;
			}
			out[o + 3] = 255;
		}
	}
	return out;
}

/**
 * Front sprite redrawn at half resolution on a canvas (show it with
 * image-rendering: pixelated) so it matches the chunky 12x16 trainer tokens.
 * Falls back to the normal sprite if the image can't be read.
 */
const PixelSprite = ({ pokemonId, className }) => {
	const ref = useRef(null);
	const [failed, setFailed] = useState(false);
	const src = getPokemonSprite({ pokemonId, variant: "front" });

	useEffect(() => {
		setFailed(false);
		const img = new Image();
		img.onload = () => {
			const cv = ref.current;
			if (!cv) return;
			try {
				const w = img.naturalWidth;
				const h = img.naturalHeight;
				const scratch = document.createElement("canvas");
				scratch.width = w;
				scratch.height = h;
				const sctx = scratch.getContext("2d");
				sctx.drawImage(img, 0, 0);
				const px = halfPixelate(sctx.getImageData(0, 0, w, h).data, w, h);
				cv.width = w >> 1;
				cv.height = h >> 1;
				cv.getContext("2d").putImageData(new ImageData(px, w >> 1, h >> 1), 0, 0);
			} catch {
				setFailed(true); // e.g. a cross-origin fallback image tainted the canvas
			}
		};
		img.onerror = () => setFailed(true);
		img.src = src;
		return () => {
			img.onload = null;
			img.onerror = null;
		};
	}, [src]);

	if (failed) return <PokemonSprite pokemonId={pokemonId} variant="front" alt="" className={className} />;
	return <canvas ref={ref} className={className} aria-hidden="true" />;
};

export default PixelSprite;
