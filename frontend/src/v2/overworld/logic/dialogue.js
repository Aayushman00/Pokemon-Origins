// One page of the overworld talk box. OverworldScreen hands these to the CSS, which sizes the box from them.
export const PAGE = { lineChars: 30, lines: 2 };

// Word-wrap text into GBA-style pages (lines x chars). Pure.
export function paginate(text, { lineChars = PAGE.lineChars, lines = PAGE.lines } = {}) {
	const words = String(text).trim().split(/\s+/).filter(Boolean);
	const rows = [];
	let row = "";
	for (const word of words) {
		const w = word.length > lineChars ? word.slice(0, lineChars) : word;
		if (!row) row = w;
		else if (row.length + 1 + w.length <= lineChars) row += ` ${w}`;
		else {
			rows.push(row);
			row = w;
		}
	}
	if (row) rows.push(row);
	const pages = [];
	for (let i = 0; i < rows.length; i += lines) pages.push(rows.slice(i, i + lines).join("\n"));
	return pages.length ? pages : [""];
}
