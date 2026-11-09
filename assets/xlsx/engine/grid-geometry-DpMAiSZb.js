import { Ia as e } from "./plot-area-frame-DNYMd9Pf.js";
function t(e, t = 8) {
	return Math.trunc((256 * e + Math.trunc(128 / t)) / 256 * t);
}
function n(e, n = 8) {
	return t(Math.trunc((e * n + 5) / n * 256) / 256, n);
}
function r(e, t) {
	return Math.ceil(Math.round(e * t + 5) / 8) * 8;
}
function i(e, t = 8) {
	return e / t;
}
function a(t) {
	return Math.round(t * e);
}
function o(t) {
	return t / e;
}
var s = class e {
	maxIndex;
	indices;
	cumulativeDelta;
	customPx;
	defaultPx;
	spans;
	constructor(e, t, n, r, i, a) {
		this.maxIndex = r, this.defaultPx = Number.isFinite(t) && t >= 0 ? t : 0, this.indices = i ? i.map((e) => e.index) : Object.keys(e).map(Number).filter((e) => e >= 1 && e <= r).sort((e, t) => e - t), this.cumulativeDelta = Array(this.indices.length), this.customPx = Array(this.indices.length);
		let o = 0;
		for (let t = 0; t < this.indices.length; t++) {
			let r = i?.[t]?.px ?? n(e[this.indices[t]]), a = Number.isFinite(r) && r >= 0 ? r : this.defaultPx;
			this.customPx[t] = a, o += a - this.defaultPx, this.cumulativeDelta[t] = o;
		}
		if (a?.length) {
			let e = [...new Set([
				1,
				r + 1,
				...a.flatMap((e) => [e.first, e.last + 1]),
				...this.indices.flatMap((e) => [e, e + 1])
			])].sort((e, t) => e - t), t = new Map(this.indices.map((e, t) => [e, this.customPx[t]])), n = [], i = [], o = 0, s = 0;
			for (let r = 0; r < e.length; r++) {
				let c = e[r];
				for (; o < a.length && a[o].last < c;) o++;
				let l = a[o], u = t.get(c) ?? (l && l.first <= c ? l.px : this.defaultPx);
				i.push(s), n.push(u), r + 1 < e.length && (s += (e[r + 1] - c) * u);
			}
			this.spans = {
				starts: e,
				pixels: n,
				offsets: i
			};
		}
	}
	deltaBefore(e) {
		let t = 0, n = this.indices.length;
		for (; t < n;) {
			let r = t + n >> 1;
			this.indices[r] < e ? t = r + 1 : n = r;
		}
		return t === 0 ? 0 : this.cumulativeDelta[t - 1];
	}
	offsetOf(e) {
		if (this.spans) {
			let t = 0, n = this.spans.starts.length;
			for (; t < n;) {
				let r = t + n >>> 1;
				this.spans.starts[r] <= e ? t = r + 1 : n = r;
			}
			let r = Math.max(0, t - 1);
			return this.spans.offsets[r] + (e - this.spans.starts[r]) * this.spans.pixels[r];
		}
		return (e - 1) * this.defaultPx + this.deltaBefore(e);
	}
	indexAt(e) {
		if (e < 0) return {
			index: 1,
			partial: 0
		};
		let t = 1, n = this.maxIndex;
		for (; t < n;) {
			let r = t + n + 1 >> 1;
			this.offsetOf(r) <= e ? t = r : n = r - 1;
		}
		return {
			index: t,
			partial: e - this.offsetOf(t)
		};
	}
	scrollableIndexAt(e, t) {
		let n = e + this.offsetOf(t);
		return n >= this.offsetOf(this.maxIndex) + this.sizeOf(this.maxIndex) ? null : this.indexAt(n).index;
	}
	sizeOf(e) {
		return this.offsetOf(e + 1) - this.offsetOf(e);
	}
	scaled(t) {
		return this.spans ? new e({}, Math.round(this.defaultPx * t), (e) => e, this.maxIndex, [], this.spans.starts.slice(0, -1).map((e, n) => ({
			first: e,
			last: this.spans.starts[n + 1] - 1,
			px: Math.round(this.spans.pixels[n] * t)
		}))) : new e({}, Math.round(this.defaultPx * t), (e) => e, this.maxIndex, this.indices.map((e, n) => ({
			index: e,
			px: Math.round(this.customPx[n] * t)
		})));
	}
	positiveRanges() {
		let e = [], t = (t, n, r) => {
			if (r <= 0 || t > n) return;
			let i = e.at(-1);
			i && i.last + 1 === t ? i.last = n : e.push({
				first: t,
				last: n
			});
		};
		if (this.spans) for (let e = 0; e + 1 < this.spans.starts.length; e++) t(this.spans.starts[e], this.spans.starts[e + 1] - 1, this.spans.pixels[e]);
		else {
			let e = 1;
			for (let n = 0; n < this.indices.length; n++) t(e, this.indices[n] - 1, this.defaultPx), t(this.indices[n], this.indices[n], this.customPx[n]), e = this.indices[n] + 1;
			t(e, this.maxIndex, this.defaultPx);
		}
		return e;
	}
	countToCover(e, t) {
		if (e > this.maxIndex || t <= 0) return 0;
		let n = this.offsetOf(e) + t;
		if (n >= this.offsetOf(this.maxIndex) + this.sizeOf(this.maxIndex)) return this.maxIndex - e + 1;
		let r = this.indexAt(n);
		return r.index - e + +(r.partial > 0);
	}
	bandsToCover(e, t, n = Infinity) {
		let r = Math.max(1, e), i = Math.min(this.maxIndex, t);
		if (r > i || n <= 0) return [];
		let a = [], o = 0, s = Math.max(r, this.indexAt(this.offsetOf(r)).index);
		for (; s <= i && o < n;) {
			let e = this.sizeOf(s);
			if (Number.isFinite(e) && e > 0 && (a.push({
				index: s,
				size: e
			}), o += e), s >= i) break;
			let t = this.offsetOf(s + 1), n = this.indexAt(t).index;
			s = Math.max(s + 1, n);
		}
		return a;
	}
}, c = /* @__PURE__ */ new WeakMap(), l = Object.freeze([]);
function u(e, t) {
	t.columns || t.rows ? c.set(e, t) : c.delete(e);
}
function d(e) {
	return c.get(e)?.columns;
}
function f(e, t) {
	return c.get(e)?.columns?.get(t);
}
function p(e, t, n) {
	let r = c.get(e), i = r?.columns;
	return n === null || !Number.isFinite(n) || n < 0 ? i?.delete(t) ? (i.size === 0 && (delete r.columns, u(e, r)), !0) : !1 : i?.get(t) === n ? !1 : (i ? i.set(t, n) : c.set(e, {
		...r,
		columns: new Map([[t, n]])
	}), !0);
}
function m(e) {
	return c.get(e)?.rows ?? l;
}
function h(e, t) {
	let n = 0, r = e.length;
	for (; n < r;) {
		let i = n + r >>> 1;
		e[i].first <= t ? n = i + 1 : r = i;
	}
	return n > 0 && e[n - 1].last >= t;
}
var g = 16384;
function _(e) {
	if (e.length > 16384) throw RangeError("Too many row resize intervals.");
	let t = 0;
	for (let n of e) {
		if (!Number.isInteger(n.first) || !Number.isInteger(n.last) || n.first <= t || n.last < n.first || n.last > 1048576 || !Number.isFinite(n.height) || n.height <= 0) throw RangeError("Invalid row resize interval.");
		t = n.last;
	}
}
function v(e, t) {
	_(t);
	let n = c.get(e) ?? {};
	t.length ? n.rows = Object.isFrozen(t) && t.every(Object.isFrozen) ? t : Object.freeze(t.map((e) => Object.freeze({ ...e }))) : delete n.rows, u(e, n);
}
function y(e, t) {
	let n = c.get(e);
	n ? c.set(t, {
		...n,
		columns: n.columns && new Map(n.columns)
	}) : c.delete(t);
}
var b = 1048576, x = 16384, S = class e {
	static cache = /* @__PURE__ */ new WeakMap();
	static forWorksheet(t, n) {
		let r = this.cache.get(t);
		if (r && Object.is(r.mdw, n)) return r.geometry;
		let i = new e(t, n);
		return this.cache.set(t, {
			mdw: n,
			geometry: i
		}), i;
	}
	static forWorksheetMeasured(e, t) {
		let n = this.cache.get(e);
		return n ? n.geometry : this.forWorksheet(e, t());
	}
	static invalidate(e) {
		this.cache.delete(e);
	}
	col;
	row;
	maximumDigitWidth;
	freezeRows;
	freezeCols;
	scaledCache = null;
	constructor(e, i) {
		this.maximumDigitWidth = i, this.freezeRows = Math.min(b, Math.max(0, e.freezeRows ?? 0)), this.freezeCols = Math.min(x, Math.max(0, e.freezeCols ?? 0));
		let o = e.baseColWidth === void 0 ? e.defaultColWidthIsUi === !0 ? n(e.defaultColWidth, i) : t(e.defaultColWidth, i) : r(e.baseColWidth, i), c = new Float64Array(16385);
		c.fill(NaN);
		let l = new Int32Array(16386);
		for (let e = 1; e < l.length; e++) l[e] = e;
		let u = (e) => {
			let t = e;
			for (; l[t] !== t;) t = l[t];
			let n = e;
			for (; l[n] !== n;) {
				let e = l[n];
				l[n] = t, n = e;
			}
			return t;
		}, f = e.colWidthRanges ?? [];
		for (let e = f.length - 1; e >= 0; e--) {
			let t = f[e], n = Math.max(1, Math.min(x, Math.trunc(t.min))), r = Math.max(1, Math.min(x, Math.trunc(t.max)));
			if (r < n || !Number.isFinite(t.width) || t.width < 0) continue;
			let i = u(n);
			for (; i <= r;) c[i] = t.width, l[i] = u(i + 1), i = l[i];
		}
		for (let [t, n] of Object.entries(e.colWidths)) {
			let e = Number(t);
			Number.isInteger(e) && e >= 1 && e <= 16384 && (c[e] = n);
		}
		let p = d(e), g = [];
		for (let e = 1; e <= x; e++) {
			let n = p?.get(e), r = c[e];
			if (n === void 0 && (!Number.isFinite(r) || r < 0)) continue;
			let a = n ?? t(r, i);
			a !== o && g.push({
				index: e,
				px: a
			});
		}
		this.col = new s({}, o, (e) => t(e, i), x, g);
		let _ = m(e), v = _.length ? Object.fromEntries(Object.entries(e.rowHeights).filter(([e, t]) => t === 0 || !h(_, Number(e)))) : e.rowHeights;
		this.row = new s(v, a(e.defaultRowHeight), a, b, void 0, _.map((e) => ({
			first: e.first,
			last: e.last,
			px: a(e.height)
		})));
	}
	logicalFrozenExtent() {
		return {
			width: this.col.offsetOf(this.freezeCols + 1),
			height: this.row.offsetOf(this.freezeRows + 1)
		};
	}
	roundedFrozenExtent(e) {
		let t = this.axesAtScale(e);
		return {
			width: t.col.offsetOf(this.freezeCols + 1),
			height: t.row.offsetOf(this.freezeRows + 1)
		};
	}
	effectiveFrozenBands(e) {
		let t = this.axesAtScale(e.scale), n = t.row.bandsToCover(1, Math.max(0, e.rows), Math.max(0, e.height - Math.round(e.headerHeight * e.scale))), r = t.col.bandsToCover(1, Math.max(0, e.cols), Math.max(0, e.width - Math.round(e.headerWidth * e.scale)));
		return {
			rows: n.at(-1)?.index ?? 0,
			cols: r.at(-1)?.index ?? 0
		};
	}
	logicalContentExtent(e, t, n, r) {
		return {
			width: n + this.col.offsetOf(Math.min(x, t) + 1),
			height: r + this.row.offsetOf(Math.min(b, e) + 1)
		};
	}
	roundedContentExtent(e, t, n, r, i) {
		let a = this.axesAtScale(n);
		return {
			width: Math.round(r * n) + a.col.offsetOf(Math.min(x, t) + 1),
			height: Math.round(i * n) + a.row.offsetOf(Math.min(b, e) + 1)
		};
	}
	cellAt(e, t, n) {
		if (e < 0 || t < 0) return null;
		let r = this.rowAt(t, n.scrollY, n.scale);
		if (r === null) return null;
		let i = this.colAt(e, n.scrollX, n.scale);
		return i === null ? null : {
			row: r,
			col: i
		};
	}
	rowAt(e, t, n = 1) {
		if (e < 0) return null;
		let r = this.axesAtScale(n).row, i = r.offsetOf(this.freezeRows + 1);
		return e < i ? this.indexWithinFrozen(r, e, this.freezeRows) : r.scrollableIndexAt(e - i + t, this.freezeRows + 1);
	}
	colAt(e, t, n = 1) {
		if (e < 0) return null;
		let r = this.axesAtScale(n).col, i = r.offsetOf(this.freezeCols + 1);
		return e < i ? this.indexWithinFrozen(r, e, this.freezeCols) : r.scrollableIndexAt(e - i + t, this.freezeCols + 1);
	}
	cellRect(e, t, n) {
		if (e < 1 || e > 1048576 || t < 1 || t > 16384) return null;
		let r = this.axesAtScale(n.scale), i = Math.round(n.headerWidth * n.scale), a = Math.round(n.headerHeight * n.scale), o = this.roundedFrozenExtent(n.scale);
		return {
			x: t <= this.freezeCols ? i + r.col.offsetOf(t) : this.scrollableCellPosition(r.col, t, this.freezeCols, n.scrollX, i + o.width),
			y: e <= this.freezeRows ? a + r.row.offsetOf(e) : this.scrollableCellPosition(r.row, e, this.freezeRows, n.scrollY, a + o.height),
			w: r.col.sizeOf(t),
			h: r.row.sizeOf(e)
		};
	}
	visibleRange(e) {
		let t = this.axesAtScale(e.scale), n = this.roundedFrozenExtent(e.scale), r = t.col.indexAt(e.scrollX + t.col.offsetOf(this.freezeCols + 1)), i = t.row.indexAt(e.scrollY + t.row.offsetOf(this.freezeRows + 1)), a = e.width - Math.round(e.headerWidth * e.scale) - n.width, o = e.height - Math.round(e.headerHeight * e.scale) - n.height, s = e.buffer ?? 0;
		return {
			range: {
				row: i.index,
				col: r.index,
				rows: t.row.countToCover(i.index, o + i.partial * 2) + s,
				cols: t.col.countToCover(r.index, a + r.partial * 2) + s
			},
			offsetX: r.partial / e.scale,
			offsetY: i.partial / e.scale,
			frozenWidth: n.width / e.scale,
			frozenHeight: n.height / e.scale
		};
	}
	scrollOffsetForCell(e, t, n) {
		let r = this.roundedFrozenExtent(n.scale), i = Math.round(n.headerHeight * n.scale) + r.height, a = Math.round(n.headerWidth * n.scale) + r.width, o = n.currentY, s = this.axesAtScale(n.scale);
		if (e > this.freezeRows && e <= 1048576) {
			let t = s.row.offsetOf(e) - s.row.offsetOf(this.freezeRows + 1), r = s.row.sizeOf(e);
			o = this.alignedOffset(t, r, n.currentY, i, n.viewportHeight, n.align);
		}
		let c = n.currentX;
		if (t > this.freezeCols && t <= 16384) {
			let e = s.col.offsetOf(t) - s.col.offsetOf(this.freezeCols + 1), r = s.col.sizeOf(t);
			c = this.alignedOffset(e, r, n.currentX, a, n.viewportWidth, n.align);
		}
		return {
			x: Math.max(0, c),
			y: Math.max(0, o)
		};
	}
	axesAtScale(e) {
		if (this.scaledCache?.scale === e) return this.scaledCache;
		let t = {
			scale: e,
			row: this.row.scaled(e),
			col: this.col.scaled(e)
		};
		return this.scaledCache = t, t;
	}
	indexWithinFrozen(e, t, n) {
		if (n === 0) return null;
		let r = e.indexAt(t).index;
		return r <= n ? r : null;
	}
	scrollableCellPosition(e, t, n, r, i) {
		let a = e.indexAt(r + e.offsetOf(n + 1));
		return i - a.partial + e.offsetOf(t) - e.offsetOf(a.index);
	}
	alignedOffset(e, t, n, r, i, a) {
		let o = r + e - n;
		return a === "start" ? e : a === "center" ? e - (i - r - t) / 2 : a === "end" ? e - (i - r - t) : o < r ? e : o + t > i ? e - (i - r - t) : n;
	}
};
export { f as a, m as c, _ as d, i as f, g as i, p as l, a as m, x as n, y as o, o as p, b as r, h as s, S as t, v as u };
