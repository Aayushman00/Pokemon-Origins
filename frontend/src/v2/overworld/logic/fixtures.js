// Test helper: build a parsed map from ASCII rows through the real Tiled parser.
// '.' free  '#' solid  'v' '<' '>' '^' one-way ledges (hop in that direction)
import { parseTiledMap } from "./mapModel.js";

const CODE = { "#": 100, v: 101, "<": 102, ">": 103, "^": 104 };

export function asciiMap(id, rows, { props = {}, npcs = [], warps = [], triggers = [], signs = [] } = {}) {
	const height = rows.length;
	const width = rows[0].length;
	const obj = (kind, list, extra) =>
		({ id: kind, name: kind, type: "", objects: list.map((o, i) => ({ id: i + 1, name: o.name || `${kind}${i}`, x: o.x * 16, y: o.y * 16, width: (o.w || 1) * 16, height: (o.h || 1) * 16, point: !!extra?.point, properties: Object.entries(o.props || {}).map(([name, value]) => ({ name, value })) })) });
	return parseTiledMap(
		{
			orientation: "orthogonal",
			infinite: false,
			width,
			height,
			tilewidth: 16,
			tileheight: 16,
			tilesets: [
				{ firstgid: 1, name: "overworld", image: "t.png", columns: 8, tilecount: 24, tiles: [{ id: 4, animation: [{ tileid: 4, duration: 500 }, { tileid: 5, duration: 500 }] }] },
				{ firstgid: 100, name: "collision", tilecount: 5 },
			],
			layers: [
				{ name: "ground", type: "tilelayer", data: Array(width * height).fill(1) },
				{ name: "collision", type: "tilelayer", data: rows.join("").split("").map((c) => CODE[c] || 0) },
				{ ...obj("npcs", npcs, { point: true }), type: "objectgroup", name: "npcs" },
				{ ...obj("warps", warps), type: "objectgroup", name: "warps" },
				{ ...obj("triggers", triggers), type: "objectgroup", name: "triggers" },
				{ ...obj("signs", signs), type: "objectgroup", name: "signs" },
			],
			properties: Object.entries(props).map(([name, value]) => ({ name, value })),
		},
		id
	);
}

export const worldOf = (...maps) => {
	const byId = new Map(maps.map((m) => [m.id, m]));
	return { get: (id) => byId.get(id), byId };
};
