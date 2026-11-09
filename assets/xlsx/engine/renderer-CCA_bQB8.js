import { An as e, Br as t, Dn as n, Do as r, Dr as i, En as a, Fa as o, Ia as s, Io as c, Jr as l, Kr as u, Mn as d, Mo as f, No as p, On as m, Oo as h, Po as g, So as _, Tn as v, Vr as y, _o as b, ai as x, ar as S, cr as C, do as w, fo as T, fr as E, go as D, ho as O, jn as k, jo as A, kn as j, mo as M, ni as N, nr as P, or as ee, pr as te, u as F, uo as I, vo as L, wn as R, wo as z, xo as B, xr as V, yo as ne } from "./plot-area-frame-DNYMd9Pf.js";
import { $ as re, C as H, Ct as U, D as W, E as G, Pt as K, Rt as ie, S as q, a as ae, b as oe, ct as se, dn as ce, et as le, g as J, h as ue, in as de, kn as fe, l as pe, ln as me, nn as he, nt as ge, on as _e, st as ve, tn as ye, tt as be, un as xe, v as Se, x as Ce, y as we, yn as Te } from "./bounded-raw-part-cache-B5a6cGKO.js";
import { H as Ee, r as De } from "./renderer-DpTePxGq.js";
import { r as Oe } from "./drawingml-shape-B1_kg4BV.js";
import { _ as ke, v as Ae } from "./worksheet-pull-client-BudfclVl.js";
import { _ as je, a as Me, c as Ne, d as Pe, g as Fe, h as Ie, i as Le, l as Re, m as ze, o as Be, p as Ve, s as He, u as Ue, v as We, y as Ge } from "./resource-measurement-CfJtbwiR.js";
import { c as Ke, m as qe, p as Je, s as Ye, t as Xe } from "./grid-geometry-DpMAiSZb.js";
function Ze(e, t, n) {
	let { values: r } = n;
	if (r.length === 0 || t.w <= 0 || t.h <= 0) return;
	let i = n.colorSeries ?? "#5B9BD5", a = Math.min(2, t.w * .08), o = Math.max(2, t.h * .2), c = t.x + a, l = t.y + o, u = Math.max(1, t.w - a * 2), d = Math.max(1, t.h - o * 2), f = r.filter((e) => typeof e == "number");
	if (f.length === 0) return;
	let p = Math.min(...f), m = Math.max(...f), h = n.min ?? p, g = n.max ?? m;
	h === g && (g = h + 1, --h);
	let _ = g - h, v = (e) => l + d - (e - h) / _ * d;
	if (n.kind === "stem") {
		et(e, n, c, l, u, d);
		return;
	}
	if (n.kind === "column") {
		$e(e, n, r, c, l, u, d, h, g);
		return;
	}
	if (n.displayXAxis && h < 0 && g > 0) {
		e.save(), e.strokeStyle = n.colorAxis ?? "#000000", e.lineWidth = 1, e.beginPath();
		let t = v(0);
		e.moveTo(c, t), e.lineTo(c + u, t), e.stroke(), e.restore();
	}
	let y = r.length, b = (e) => y === 1 ? c + u / 2 : c + e / (y - 1) * u;
	e.save(), e.strokeStyle = i, e.lineCap = "round", e.lineJoin = "round", e.lineWidth = (n.lineWeight ?? .75) * s, e.beginPath();
	let x = !1, S = n.displayEmptyCellsAs ?? "gap";
	for (let t = 0; t < y; t++) {
		let n = r[t];
		if (n == null) {
			if (S === "zero") {
				let n = b(t), r = v(0);
				x ? e.lineTo(n, r) : (e.moveTo(n, r), x = !0);
			} else S === "gap" && (x = !1);
			continue;
		}
		let i = b(t), a = v(n);
		x ? e.lineTo(i, a) : (e.moveTo(i, a), x = !0);
	}
	e.stroke(), e.restore();
	let C = Math.max(1, Math.min(2.5, d * .12)), w = Qe(r, n);
	for (let t = 0; t < y; t++) {
		let a = r[t];
		if (a == null) continue;
		let o = w[t];
		(n.markers || o != null) && (e.save(), e.fillStyle = o ?? n.colorMarkers ?? i, e.beginPath(), e.arc(b(t), v(a), C, 0, Math.PI * 2), e.fill(), e.restore());
	}
}
function Qe(e, t) {
	let n = e.map(() => null), r = e.map((e) => typeof e == "number" ? e : null), i = r.findIndex((e) => e != null), a = -1;
	for (let e = r.length - 1; e >= 0; e--) if (r[e] != null) {
		a = e;
		break;
	}
	let o = r.filter((e) => e != null), s = NaN, c = NaN;
	if (o.length > 0 && (s = Math.max(...o), c = Math.min(...o)), t.negative && t.colorNegative) for (let e = 0; e < r.length; e++) {
		let i = r[e];
		i != null && i < 0 && (n[e] = t.colorNegative);
	}
	if (t.first && t.colorFirst && i >= 0 && (n[i] = t.colorFirst), t.last && t.colorLast && a >= 0 && (n[a] = t.colorLast), t.high && t.colorHigh && !Number.isNaN(s)) for (let e = 0; e < r.length; e++) r[e] === s && (n[e] = t.colorHigh);
	if (t.low && t.colorLow && !Number.isNaN(c)) for (let e = 0; e < r.length; e++) r[e] === c && (n[e] = t.colorLow);
	return n;
}
function $e(e, t, n, r, i, a, o, s, c) {
	let l = n.length;
	if (l === 0) return;
	let u = s < 0 && c > 0 ? 0 : s, d = c - s, f = (e) => i + o - (e - s) / d * o, p = f(u), m = a / l, h = Math.min(1.5, m * .15), g = Qe(n, t);
	for (let i = 0; i < l; i++) {
		let a = n[i];
		if (a == null) continue;
		let o = g[i] ?? (a < 0 && t.colorNegative ? t.colorNegative : t.colorSeries ?? "#5B9BD5"), s = f(a), c = r + m * i + h / 2, l = Math.max(1, m - h);
		e.save(), e.fillStyle = o, e.fillRect(c, Math.min(p, s), l, Math.abs(p - s)), e.restore();
	}
}
function et(e, t, n, r, i, a) {
	let o = t.values.length;
	if (o === 0) return;
	let s = r + a / 2, c = a / 2, l = i / o, u = Math.min(1.5, l * .15), d = Qe(t.values, t);
	for (let r = 0; r < o; r++) {
		let i = t.values[r];
		if (i == null || i === 0) continue;
		let a = i < 0, o = d[r] ?? (a && t.colorNegative ? t.colorNegative : t.colorSeries ?? "#5B9BD5"), f = n + l * r + u / 2, p = Math.max(1, l - u);
		e.save(), e.fillStyle = o, a ? e.fillRect(f, s, p, c) : e.fillRect(f, s - c, p, c), e.restore();
	}
}
function tt(e, t) {
	return e === !0 ? "rtl" : e === !1 ? "ltr" : l().computeLevels(t, "auto").paragraphLevel === 1 ? "rtl" : "ltr";
}
function nt(e, t, n, r) {
	let i = t;
	for (let t of e) r(t, i, n), i += t.width;
	return i;
}
var rt = /* @__PURE__ */ new WeakMap();
function it() {
	return typeof navigator < "u" && (navigator.language || "").toLowerCase().startsWith("ja");
}
function at(e, t) {
	rt.set(e, t === !0);
}
function ot(e) {
	if (!e) return !1;
	let t = rt.get(e);
	return t === void 0 && (t = it(), rt.set(e, t)), t;
}
function st(e, t) {
	at(t, ot(e));
}
function ct(e) {
	let t = e.fontFace?.trim();
	if (!t) return;
	let n = (e) => !e?.trim() || e.trim().toLocaleLowerCase("en-US") === t.toLocaleLowerCase("en-US");
	return n(e.fontFaceEa) && n(e.fontFaceCs) ? t : void 0;
}
function lt(e) {
	let t = [];
	for (let n of e.paragraphs) for (let e of n.runs) e.type === "text" && ct(e) && t.push(e);
	return t;
}
function ut(e) {
	return e && (e.type === "pts" ? {
		type: "pts",
		val: Math.floor(e.val + .5)
	} : {
		type: "pct",
		val: Math.floor(e.val / 1e3 + .5) * 1e3
	});
}
function dt(e) {
	let t = e.family.trim().toLowerCase(), n = e.weight ?? 400, r = e.style ?? "normal";
	return n === 400 && r === "normal" ? t : `${t}:${n}:${r}`;
}
function ft(e) {
	return dt({
		family: e.fontFace,
		weight: e.bold ? 700 : 400,
		style: e.italic ? "italic" : "normal"
	});
}
var pt = 1e3, mt = 2 / pt, ht = /* @__PURE__ */ new WeakMap();
function gt(e) {
	return (t) => {
		let n = ht.get(t);
		if (n !== void 0) return n ?? void 0;
		let r = e.font, i = null;
		try {
			e.font = `${t.style} ${t.weight} ${pt}px "${t.family}"`;
			let n = e.measureText("H"), r = n.fontBoundingBoxAscent, a = n.fontBoundingBoxDescent;
			Number.isFinite(r) && Number.isFinite(a) && r + a > 0 && (i = {
				ascent: r / pt,
				descent: a / pt
			});
		} finally {
			e.font = r;
		}
		return ht.set(t, i), i ?? void 0;
	};
}
var _t = (e) => e.source === "macos-system" || e.source === "macos-supplemental";
function vt(e) {
	if (e.source !== "published-open-font" && !(e.farEastCodePage == null || !e.win)) return pe({
		faceSource: _t(e) ? "system" : "office-bundle",
		unitsPerEm: e.unitsPerEm,
		hhea: e.hhea,
		win: e.win,
		typoMetrics: e.typoMetrics,
		farEastCodePage: e.farEastCodePage
	}) ?? void 0;
}
function yt(e) {
	let t;
	for (let n of e) {
		let e = vt(n);
		if (!e || t && (e.ascentRatio !== t.ascentRatio || e.descentRatio !== t.descentRatio)) return;
		t = e;
	}
	return t;
}
function bt(e, t) {
	let n = t.unitsPerEm, r = [[t.hhea[0], -t.hhea[1]]];
	return t.win && r.push(t.win), t.typoMetrics && r.push([t.typoMetrics[0], -t.typoMetrics[1]]), r.some(([t, r]) => Math.abs(e.ascent - t / n) <= mt && Math.abs(e.descent - r / n) <= mt);
}
function xt(e, t, n) {
	let r = ct(e);
	if (!r || !t || t.source !== "local" || t.metric.synthesized || !t.resourceIdentity.startsWith("office-local:") || t.requestedFamily.toLocaleLowerCase("en-US") !== r.toLocaleLowerCase("en-US") || t.weight !== (e.bold ? 700 : 400) || t.style !== (e.italic ? "italic" : "normal")) return;
	let i = _(r, {
		weight: t.weight,
		style: t.style
	});
	if (i.length === 0) return;
	let a = yt(i);
	if (a || i.length === 1) return a;
	let o = n?.(t);
	if (!o) return;
	let s = i.filter((e) => bt(o, e));
	if (s.length !== 0 && !(i.some(_t) && !s.every(_t))) return yt(s);
}
var St = {
	...A,
	...T
};
function* Ct(e) {
	for (let t of e?.sharedStrings ?? []) if (t.runs && t.runs.length > 0) for (let e of t.runs) yield e.text;
	else yield t.text;
}
function wt(e, t) {
	let n = /* @__PURE__ */ new Set(), r = null;
	for (let t of e?.styles?.fonts ?? []) if (t.name) {
		n.add(t.name);
		let e = /^(.*?)\s+Regular$/i.exec(t.name.trim());
		if (e) {
			let t = e[1].trim(), r = c(St, t.toLocaleLowerCase("en-US"));
			r && (!r.loadFamily || r.loadFamily.toLocaleLowerCase("en-US") === t.toLocaleLowerCase("en-US")) && n.add(t);
		}
		r ??= D(t.name);
	}
	for (let i of B(Ct(e), r ?? t ?? null)) n.add(i);
	return n;
}
function Tt(e, t) {
	for (let t of e?.styles?.fonts ?? []) {
		let n = D(t.name);
		if (n) return O(Ct(e), n);
	}
	return O(Ct(e), t);
}
function Et(e) {
	let t = /* @__PURE__ */ new Map(), n = (e, n, r) => {
		if ((e?.trim().toLowerCase() || "calibri") !== "calibri") return;
		let i = n ? 700 : 400, a = r ? "italic" : "normal";
		t.set(`${i}:${a}`, {
			family: "Calibri",
			weight: i,
			style: a
		});
	};
	for (let t of e?.styles?.fonts ?? []) n(t.name, t.bold, t.italic);
	for (let t of e?.sharedStrings ?? []) for (let e of t.runs ?? []) e.font && n(e.font.name, e.font.bold, e.font.italic);
	return [...t.values()];
}
function Dt(e) {
	let t = /* @__PURE__ */ new Map(), n = e.defaultFontFamily?.trim(), r = e.defaultFontBold ? 700 : 400, i = e.defaultFontItalic ? "italic" : "normal";
	if (n && _(n, {
		weight: r,
		style: i
	}).length) {
		let e = {
			family: n,
			weight: r,
			style: i
		};
		t.set(dt(e), e);
	}
	for (let n of e.rows) for (let e of n.cells) if (e.value.type === "text") for (let n of e.value.runs ?? []) {
		let e = n.font;
		if (!e || (e.name?.trim().toLowerCase() || "calibri") !== "calibri") continue;
		let r = {
			family: "Calibri",
			weight: e.bold ? 700 : 400,
			style: e.italic ? "italic" : "normal"
		};
		t.set(dt(r), r);
	}
	for (let n of e.shapeGroups ?? []) for (let e of n.shapes) if (e.text) for (let n of lt(e.text)) {
		let e = n.bold ? 700 : 400, r = n.italic ? "italic" : "normal";
		if (_(n.fontFace, {
			weight: e,
			style: r
		}).length === 0) continue;
		let i = {
			family: n.fontFace.trim(),
			weight: e,
			style: r
		};
		t.set(dt(i), i);
	}
	return [...t.values()];
}
function Ot(e, t) {
	if (e.length === 0 || t.length === 0) return 0;
	let n = [...e, ...t], r = e.length;
	return r - G(n, r, W, 1);
}
function kt(e, t) {
	let n = t;
	for (; n < e.length;) {
		let t = e[e.length - n - 1], r = e[e.length - n], i = t?.codePointAt(0), a = r?.codePointAt(0);
		if (i !== void 0 && a !== void 0 && ce(i) && ce(a)) n++;
		else break;
	}
	return n >= e.length ? t : n;
}
function At(e, t) {
	if (e.length === 0 || t.length === 0) return 0;
	let n = t[0].codePointAt(0), r = e.length - 1, i = e[r].codePointAt(0);
	if (i === void 0 || n === void 0 || i === 8203 || n === 8203 || !H(i, n)) return 0;
	for (; r > 0;) {
		let t = e[r - 1].codePointAt(0), n = e[r].codePointAt(0);
		if (t === void 0 || n === void 0 || !H(t, n)) break;
		r--;
	}
	return r === 0 ? 0 : e.length - r;
}
function jt(e, t, n) {
	let r = [], i = [], a = 0;
	for (; a < e.length;) {
		let t = e[a], n = t.codePointAt(0) ?? 0;
		if (xe(n)) i.push(t), a += n > 65535 ? 2 : 1;
		else if (t === " ") {
			let t = a;
			for (; t < e.length && e[t] === " ";) t++;
			i.push(e.slice(a, t)), a = t;
		} else {
			let t = a;
			for (; t < e.length;) {
				let n = e[t], r = n.codePointAt(0) ?? 0;
				if (n === " " || xe(r)) break;
				t += r > 65535 ? 2 : 1;
			}
			let n = e.slice(a, t), r = ye(n) ? me(n) : null;
			if (r && r.length > 0) {
				let e = 0;
				for (let t of r) i.push(n.slice(e, t)), e = t;
				i.push(n.slice(e));
			} else i.push(n);
			a = t;
		}
	}
	let o = "";
	for (let e of i) {
		if (o === "") {
			o = e;
			continue;
		}
		let i = o + e;
		if (n(i) <= t) o = i;
		else {
			let t = e.replace(/^ +/, "");
			t === "" && (t = e);
			let n = [...o], i = Ot(n, [...t]);
			if (i > 0) {
				let e = n.length - i;
				r.push(n.slice(0, e).join("")), o = n.slice(e).join("") + t;
			} else r.push(o), o = t;
		}
	}
	return r.push(o), r;
}
function Mt(e, t, n, r, i, a, o) {
	let s = [], c = [], l = 0, u = 0, d = n.size, f = 0, p = () => {
		c.length !== 0 && (s.push({
			segments: c,
			maxFontSize: u,
			para: f
		}), c = [], l = 0, u = 0);
	}, m = () => {
		if (c.length === 0) {
			s.push({
				segments: [],
				maxFontSize: d || o,
				para: f
			});
			return;
		}
		p();
	}, h = (t, n) => {
		if (!t) return;
		d = n.size, a(n, t);
		let i = e.measureText(t).width;
		if (c.length > 0 && l + i > r) {
			let r = c.flatMap((e) => [...e.text]), i = Ot(r, [...t]);
			i > 0 ? i = kt(r, i) : !ye(t) && !ye(c[c.length - 1]?.text ?? "") && !/^\s/u.test(t) && !/\s$/u.test(r.at(-1) ?? "") && (i = At(r, [...t]));
			let o = c[c.length - 1], s = [...o.text];
			i > s.length && (i = s.length);
			let d = null;
			if (i > 0) {
				let t = s.slice(0, s.length - i), n = s.slice(s.length - i);
				if (t.length === 0) c.pop();
				else {
					let n = t.join("");
					a(o.font, n), o.text = n, o.width = e.measureText(n).width;
				}
				let r = n.join("");
				a(o.font, r), d = {
					text: r,
					font: o.font,
					width: e.measureText(r).width
				};
			}
			p(), d && (c.push(d), l += d.width, d.font.size > u && (u = d.font.size)), a(n, t);
		}
		c.push({
			text: t,
			font: n,
			width: i
		}), l += i, n.size > u && (u = n.size);
	}, g = (t, n) => {
		let i = me(t);
		if (i.length === 0) {
			h(t, n);
			return;
		}
		a(n, t);
		let o = (t) => e.measureText(t).width, s = _e(t), c = t.length, u = 0;
		for (; u < c;) {
			let e = r - l, a = he(t, i, u, e, o, s);
			if (a <= u) {
				if (l > 0) {
					p();
					continue;
				}
				let n = i.find((e) => e > u) ?? c, r = t.slice(u, n), d = de(r), f = he(r, d, 0, e, o, s);
				f <= 0 && (f = d.length > 0 ? d[0] : r.length), a = u + f;
			}
			h(t.slice(u, a), n), u = a, u < c && p();
		}
	};
	for (let e of t) {
		let t = i(n, e), r = [], a = 0;
		for (; a < e.text.length;) {
			let t = e.text[a], n = t.codePointAt(0) ?? 0;
			if (n === 10) r.push("\n"), a += 1;
			else if (xe(n)) r.push(t), a += n > 65535 ? 2 : 1;
			else if (t === " ") {
				let t = a;
				for (; t < e.text.length && e.text[t] === " ";) t++;
				r.push(e.text.slice(a, t)), a = t;
			} else {
				let t = a;
				for (; t < e.text.length;) {
					let n = e.text[t], r = n.codePointAt(0) ?? 0;
					if (n === " " || n === "\n" || xe(r)) break;
					t += r > 65535 ? 2 : 1;
				}
				r.push(e.text.slice(a, t)), a = t;
			}
		}
		for (let e of r) e === "\n" ? (m(), f++) : ye(e) ? g(e, t) : h(e, t);
	}
	return (c.length > 0 || s.length > 0) && m(), s;
}
function Nt(e, t, n, r, i, a, o) {
	let s = (t, n) => {
		e.font = n.font;
		let r = Ue(n.face ?? "", n.bold, n.italic), i = r ? void 0 : e.measureText("M"), a = r ? r.ascent * n.px : i?.fontBoundingBoxAscent ?? n.px, o = r ? r.descent * n.px : i?.fontBoundingBoxDescent ?? 0, s = Re * (a + o);
		return Be(t, {
			family: n.face ?? "",
			bold: n.bold,
			italic: n.italic
		}, {
			upright: s,
			verticalGlyph: n.px,
			rotated: (t) => e.measureText(t).width
		}).map(({ text: e, kind: t, advance: r, nominal: i }) => ({
			text: e,
			style: n,
			kind: t,
			advance: r + n.spacing,
			thickness: s,
			space: e === " ",
			cell: s,
			ascent: a,
			descent: o,
			...i ? { nominal: i } : {}
		}));
	}, c = (e, t) => !e.equation && !t.equation && e.font === t.font && e.color === t.color && e.spacing === t.spacing, l = Pe(t.paragraphs.map((e) => {
		let t = [], n, r = "", l = 11;
		for (let s of e.runs) {
			if (s.type === "break") {
				t.push({ type: "break" });
				continue;
			}
			if (s.type === "math") {
				let e = o(s, l);
				if (!e) continue;
				let n = {
					font: "",
					px: 0,
					color: s.color ?? "#000000",
					spacing: 0,
					bold: !1,
					italic: !1,
					equation: e
				};
				t.push({
					type: "object",
					width: e.height,
					style: n,
					display: s.display
				}), r = "";
				continue;
			}
			l = s.size > 0 ? s.size : 11;
			let e = "", u, d = () => {
				u && e && t.push({
					type: "text",
					text: e,
					style: u
				});
			};
			for (let t of s.text) {
				let n = /^[\p{M}\p{Cf}]$/u.test(t) && r ? r : t, o = a(s, n);
				r = n;
				let l = {
					...o,
					color: s.color ?? "#000000",
					spacing: (s.spacing ?? 0) * i,
					bold: s.bold,
					italic: s.italic
				};
				u && !c(u, l) && (d(), e = ""), u = l, e += t;
			}
			u ??= {
				...a(s, "M"),
				color: s.color ?? "#000000",
				spacing: (s.spacing ?? 0) * i,
				bold: s.bold,
				italic: s.italic
			}, n = u, d(), s.text === "" && t.push({
				type: "text",
				text: "",
				style: u
			});
		}
		let u = {
			font: `${11 * i}px sans-serif`,
			px: 11 * i,
			color: "#000000",
			spacing: 0,
			bold: !1,
			italic: !1
		};
		return {
			runs: t,
			alignment: e.align,
			lineSpacing: ut(e.spaceLine),
			spaceBefore: ut(e.spaceBefore),
			spaceAfter: ut(e.spaceAfter),
			emptyThickness: s("M", n ?? u)[0].thickness
		};
	}), {
		direction: n,
		rect: r,
		anchor: t.anchor,
		anchorCtr: t.anchorCtr,
		wrap: t.wrap !== "none",
		spcFirstLastPara: t.spcFirstLastPara,
		lnSpcReduction: t.autoFit === "norm" ? t.lnSpcReduction ?? 0 : 0,
		pxPerPt: i,
		glyphs: s,
		sameStyle: c,
		objectGlyph: ({ style: e }) => {
			let t = e.equation;
			return {
				text: "",
				style: e,
				kind: "upright",
				advance: t.height,
				thickness: t.width,
				space: !1,
				cell: t.height,
				ascent: 0,
				descent: 0
			};
		}
	});
	e.save();
	for (let t of l.glyphs) {
		if (t.style.equation) {
			t.style.equation.draw(t.axisX - t.thickness / 2, t.cellTop);
			continue;
		}
		if (!t.space) if (e.font = t.style.font, e.fillStyle = t.style.color, e.textAlign = "center", e.textBaseline = "alphabetic", t.kind === "upright") e.fillText(t.text, t.axisX, He(t.cellTop, t.cell, t, 1));
		else {
			let n = t.kind === "verticalGlyph" ? Ne(t) : null;
			n === null ? Le(e, t.text, t.axisX, t.cellTop, t, 1) : Me(e, n, t.axisX, t.cellTop, t, 1);
		}
	}
	e.restore();
}
var Pt = [
	"bold",
	"italic",
	"underline",
	"strike"
];
function Ft(e, t) {
	if (e.font) return e.fontToggles ? e.fontToggles[t] : e.font[t] || void 0;
}
var It = Te, Lt = 2 ** 53 - 1 - 1;
function Rt(e) {
	let t = e.limit;
	if (t === void 0) return It;
	if (typeof t != "number") throw TypeError("coordinate index limit must be a number");
	if (!Number.isSafeInteger(t) || t <= 0 || t > Lt) throw RangeError(`coordinate index limit must be a positive safe integer no greater than ${Lt}`);
	return t;
}
function zt(e, t, n, r) {
	return new z(`XLSX renderer ${e.resource} exceeded its limit of ${t} entries`, {
		stage: "rendering",
		violation: {
			format: "xlsx",
			operation: e.operation,
			resource: e.resource,
			metric: "entry-count",
			limit: t,
			observed: Math.min(n, t + 1),
			configurable: r,
			usage: {
				archiveEntryCount: 0,
				declaredInflatedBytes: 0,
				distinctInflatedBytes: 0,
				operationInflatedBytes: 0
			}
		}
	});
}
function Bt(e, t, n = 0) {
	let r = Rt(t), { top: i, bottom: a, left: o, right: s } = e;
	if (!Number.isSafeInteger(i) || !Number.isSafeInteger(a) || !Number.isSafeInteger(o) || !Number.isSafeInteger(s) || !Number.isSafeInteger(n) || n < 0) throw zt(t, r, r + 1, !1);
	if (a < i || s < o) return 0;
	let c = a - i + 1, l = s - o + 1;
	if (!Number.isSafeInteger(c) || !Number.isSafeInteger(l)) throw zt(t, r, r + 1, !1);
	let u;
	if (l <= Math.floor((2 ** 53 - 1) / c)) {
		let e = c * l;
		if (n > e) throw zt(t, r, r + 1, !1);
		u = e - n;
	} else {
		let e = BigInt(c) * BigInt(l), i = BigInt(n);
		if (i > e) throw zt(t, r, r + 1, !1);
		let a = e - i;
		if (a > BigInt(2 ** 53 - 1)) throw zt(t, r, r + 1, !1);
		u = Number(a);
	}
	if (u > r) throw zt(t, r, u, !0);
	return u;
}
function Vt(e, t, n, r) {
	let i = Rt(r);
	if (!e.has(t) && e.size >= i) throw zt(r, i, e.size + 1, !0);
	e.set(t, n);
}
function Ht(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) for (let e of r.cells) Vt(n, `${e.row}:${e.col}`, e, t);
	return n;
}
function Ut(e, t, n) {
	let r = Rt(n);
	if (!e.has(t) && e.size >= r) throw zt(n, r, e.size + 1, !0);
	e.add(t);
}
var Wt = [
	"wholeTable",
	"pageFieldLabels",
	"pageFieldValues",
	"firstColumnStripe",
	"secondColumnStripe",
	"firstRowStripe",
	"secondRowStripe",
	"firstColumn",
	"headerRow",
	"firstHeaderCell",
	"firstSubtotalColumn",
	"secondSubtotalColumn",
	"thirdSubtotalColumn",
	"blankRow",
	"firstSubtotalRow",
	"secondSubtotalRow",
	"thirdSubtotalRow",
	"firstColumnSubheading",
	"secondColumnSubheading",
	"thirdColumnSubheading",
	"firstRowSubheading",
	"secondRowSubheading",
	"thirdRowSubheading",
	"lastColumn",
	"totalRow"
], Gt = new Set([
	"default",
	"sum",
	"countA",
	"avg",
	"max",
	"min",
	"product",
	"count",
	"stdDev",
	"stdDevP",
	"var",
	"varP"
]);
function Kt(e) {
	return e === 0 ? "first" : e % 2 == 1 ? "second" : "third";
}
function qt(e, t, n, r) {
	let i = {
		first: [],
		second: []
	}, a = e, o = !0;
	for (; a <= t;) {
		let e = Math.min(t, a + Math.max(1, o ? n : r) - 1);
		(o ? i.first : i.second).push({
			top: a,
			bottom: e,
			left: 0,
			right: 0
		}), a = e + 1, o = !o;
	}
	return i;
}
function Jt(e, t) {
	let n = e.style, { top: r, bottom: i, left: a, right: o, firstDataRow: s, firstDataCol: c } = e.location, l = r + s, u = a + c, d = /* @__PURE__ */ new Map(), f = (e, t) => {
		if (t.top > t.bottom || t.left > t.right) return;
		let n = d.get(e);
		n ? n.push(t) : d.set(e, [t]);
	};
	if (f("wholeTable", {
		top: r,
		bottom: i,
		left: a,
		right: o
	}), n.showColumnStripes) {
		let e = qt(u, o, t.get("firstColumnStripe") ?? 1, t.get("secondColumnStripe") ?? 1);
		for (let t of e.first) f("firstColumnStripe", {
			top: l,
			bottom: i,
			left: t.top,
			right: t.bottom
		});
		for (let t of e.second) f("secondColumnStripe", {
			top: l,
			bottom: i,
			left: t.top,
			right: t.bottom
		});
	}
	if (n.showRowStripes) {
		let e = qt(l, i, t.get("firstRowStripe") ?? 1, t.get("secondRowStripe") ?? 1);
		for (let t of e.first) f("firstRowStripe", {
			...t,
			left: a,
			right: o
		});
		for (let t of e.second) f("secondRowStripe", {
			...t,
			left: a,
			right: o
		});
	}
	n.showRowHeaders && f("firstColumn", {
		top: r,
		bottom: i,
		left: a,
		right: u - 1
	}), n.showColumnHeaders && f("headerRow", {
		top: r,
		bottom: l - 1,
		left: a,
		right: o
	}), f("firstHeaderCell", {
		top: r,
		bottom: l - 2,
		left: a,
		right: u - 1
	});
	let p = Math.max(0, e.rowFields.length - 1);
	return (e.rowItems ?? []).forEach((e, t) => {
		let r = l + t;
		if (r > i) return;
		let s = {
			top: r,
			bottom: r,
			left: a,
			right: o
		}, c = Kt(e.depth);
		e.kind === "blank" ? f("blankRow", s) : e.kind === "grand" ? f("totalRow", s) : Gt.has(e.kind) ? f(`${c}SubtotalRow`, s) : e.kind === "data" && e.depth < p && n.showRowHeaders && f(`${c}RowSubheading`, s);
	}), (e.columnItems ?? []).forEach((e, t) => {
		let a = u + t;
		if (a > o) return;
		let s = {
			top: r,
			bottom: i,
			left: a,
			right: a
		}, c = Kt(e.depth);
		e.kind === "grand" ? n.showLastColumn && f("lastColumn", s) : Gt.has(e.kind) && f(`${c}SubtotalColumn`, s);
	}), d;
}
function Yt(e) {
	return e.patternType === "solid" && e.bgColor && e.bgColor !== e.fgColor ? {
		...e,
		fgColor: e.bgColor
	} : e;
}
function Xt(e, t, n, r, i, a) {
	t.fill && (e.fill = Yt(t.fill));
	let o = t.font;
	if (o) {
		o.color ? (e.fontColor = o.color, delete e.fontColorAuto, a ? e.fontColorFromTable = !0 : delete e.fontColorFromTable) : t.fontToggles?.automaticColor && (delete e.fontColor, e.fontColorAuto = !0, a ? e.fontColorFromTable = !0 : delete e.fontColorFromTable);
		for (let n of Pt) {
			let r = Ft(t, n);
			r !== void 0 && (e[n] = r);
		}
	}
	let s = t.border;
	if (!s) return;
	let c = (e, t, n) => n ? e : t, l = c(s.top, s.horizontal, r === n.top), u = c(s.bottom, s.horizontal, r === n.bottom), d = c(s.left, s.vertical, i === n.left), f = c(s.right, s.vertical, i === n.right);
	l && (e.top = l), u && (e.bottom = u), d && (e.left = d), f && (e.right = f);
}
var Zt = [
	"wholeTable",
	"firstColumnStripe",
	"secondColumnStripe",
	"firstRowStripe",
	"secondRowStripe",
	"lastColumn",
	"firstColumn",
	"headerRow",
	"totalRow",
	"firstHeaderCell",
	"lastHeaderCell",
	"firstTotalCell",
	"lastTotalCell"
];
function Qt(e, t, n, r, i) {
	let a = {
		first: [],
		second: []
	}, o = !0, s = Math.max(1, n), c = null;
	for (let l = e; l <= t; l++) i(l) || (c || (c = {
		top: l,
		bottom: l,
		left: 0,
		right: 0
	}, (o ? a.first : a.second).push(c)), c.bottom = l, --s, s === 0 && (o = !o, s = Math.max(1, o ? n : r), c = null));
	return a;
}
function $t(e, t, n) {
	let { top: r, bottom: i, left: a, right: o } = e.range, s = Math.max(0, e.headerRowCount ?? 1), c = Math.max(0, e.totalsRowCount ?? 0), l = r + s, u = i - c, d = /* @__PURE__ */ new Map(), f = (e, t) => {
		if (t.top > t.bottom || t.left > t.right) return;
		let n = d.get(e);
		n ? n.push(t) : d.set(e, [t]);
	};
	if (f("wholeTable", {
		top: r,
		bottom: i,
		left: a,
		right: o
	}), e.showColumnStripes) {
		let e = qt(a, o, t.get("firstColumnStripe") ?? 1, t.get("secondColumnStripe") ?? 1);
		for (let t of e.first) f("firstColumnStripe", {
			top: l,
			bottom: u,
			left: t.top,
			right: t.bottom
		});
		for (let t of e.second) f("secondColumnStripe", {
			top: l,
			bottom: u,
			left: t.top,
			right: t.bottom
		});
	}
	if (e.showRowStripes) {
		let e = Qt(l, u, t.get("firstRowStripe") ?? 1, t.get("secondRowStripe") ?? 1, n);
		for (let t of e.first) f("firstRowStripe", {
			...t,
			left: a,
			right: o
		});
		for (let t of e.second) f("secondRowStripe", {
			...t,
			left: a,
			right: o
		});
	}
	return e.showLastColumn && f("lastColumn", {
		top: r,
		bottom: i,
		left: o,
		right: o
	}), e.showFirstColumn && f("firstColumn", {
		top: r,
		bottom: i,
		left: a,
		right: a
	}), s > 0 && (f("headerRow", {
		top: r,
		bottom: l - 1,
		left: a,
		right: o
	}), f("firstHeaderCell", {
		top: r,
		bottom: l - 1,
		left: a,
		right: a
	}), f("lastHeaderCell", {
		top: r,
		bottom: l - 1,
		left: o,
		right: o
	})), c > 0 && (f("totalRow", {
		top: u + 1,
		bottom: i,
		left: a,
		right: o
	}), f("firstTotalCell", {
		top: u + 1,
		bottom: i,
		left: a,
		right: a
	}), f("lastTotalCell", {
		top: u + 1,
		bottom: i,
		left: o,
		right: o
	})), d;
}
function en(e, t, n, r, i, a) {
	let o = new Map(r.map((e) => [e.kind, e]));
	for (let r of n) {
		let n = o.get(r), s = i.get(r);
		if (!(!n || !s)) for (let r of s) for (let i = r.top; i <= r.bottom; i++) for (let o = r.left; o <= r.right; o++) {
			let s = `${i}:${o}`, c = e.get(s);
			c || (c = {}, Vt(e, s, c, t)), Xt(c, n.dxf, r, i, o, a);
		}
	}
}
function tn(e, t) {
	return !t || e.styleError ? [] : [
		["wholeTable", e.wholeTableDxf],
		["headerRow", e.headerRowDxf],
		["totalRow", e.totalRowDxf],
		["firstColumn", e.firstColumnDxf],
		["lastColumn", e.lastColumnDxf],
		["firstRowStripe", e.band1HorizontalDxf],
		["secondRowStripe", e.band2HorizontalDxf]
	].flatMap(([e, n]) => {
		let r = n === void 0 ? void 0 : t[n];
		return r ? [{
			kind: e,
			size: 1,
			dxf: r
		}] : [];
	});
}
function nn(e, t) {
	let n = /* @__PURE__ */ new Map(), r = {
		resource: "worksheet-structured-style-index",
		operation: "expand-structured-style-coordinates",
		limit: ke(e).maxCoordinateIndexEntries
	}, i = new Set((e.rows ?? []).filter((e) => e.hidden).map((e) => e.index)), a = (e) => i.has(e);
	for (let i of e.tables ?? []) {
		let e = i.styleElements ?? tn(i, t);
		e.length !== 0 && (Bt(i.range, r), en(n, r, Zt, e, $t(i, new Map(e.map((e) => [e.kind, e.size])), a), !0));
	}
	for (let t of e.pivotTables ?? []) {
		let e = t.style;
		if (!e || e.elements.length === 0) continue;
		let i = new Map(e.elements.map((e) => [e.kind, e.size]));
		Bt(t.location, r), en(n, r, Wt, e.elements, Jt(t, i), !1);
	}
	return n;
}
function rn(e, t, n) {
	let r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set(), a = [];
	for (let i of e) Ut(r, `${i.top}:${i.left}`, t), Bt(i, n, 1), i.bottom >= i.top && i.right >= i.left && a.push(i);
	if (a.length === 0) return {
		anchors: r,
		continuations: i
	};
	let o = [...new Set(a.flatMap((e) => [e.left, e.right + 1]))].sort((e, t) => e - t), s = /* @__PURE__ */ new Map();
	o.forEach((e, t) => s.set(e, t));
	let c = o.length - 1, l = new Int32Array(c * 4), u = new Uint8Array(c * 4), d = (e, t, n, r, i, a) => {
		if (!(i < t || n < r)) {
			if (r <= t && n <= i) l[e] += a;
			else {
				let o = t + n >> 1;
				d(e * 2, t, o, r, i, a), d(e * 2 + 1, o + 1, n, r, i, a);
			}
			u[e] = l[e] > 0 || t < n && (u[e * 2] || u[e * 2 + 1]) ? 1 : 0;
		}
	}, f = (e) => {
		let t = 1, n = 0, r = c - 1, i = 0;
		for (;;) {
			if (i += l[t], n === r) return i;
			let a = n + r >> 1;
			e <= a ? (t *= 2, r = a) : (t = t * 2 + 1, n = a + 1);
		}
	}, p = (e, t, n, r) => {
		if (!u[e]) return;
		if (l[e] > 0) {
			let e = r.at(-1);
			e && e[1] === o[t] - 1 ? e[1] = o[n + 1] - 1 : r.push([o[t], o[n + 1] - 1]);
			return;
		}
		let i = t + n >> 1;
		p(e * 2, t, i, r), p(e * 2 + 1, i + 1, n, r);
	}, m = [], h = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map();
	for (let e of a) {
		let t = s.get(e.left), n = s.get(e.right + 1) - 1;
		m.push({
			row: e.top,
			l: t,
			r: n,
			delta: 1
		}, {
			row: e.bottom + 1,
			l: t,
			r: n,
			delta: -1
		});
		let r = `${e.top}:${e.left}`, i = h.get(r);
		if (h.set(r, (i ?? 0) + 1), i === void 0) {
			let t = g.get(e.top);
			t ? t.push(e.left) : g.set(e.top, [e.left]);
		}
	}
	m.sort((e, t) => e.row - t.row);
	let _ = 0;
	for (; _ < m.length;) {
		let e = m[_].row;
		for (; _ < m.length && m[_].row === e;) {
			let { l: e, r: t, delta: n } = m[_++];
			d(1, 0, c - 1, e, t, n);
		}
		if (!u[1] || _ >= m.length) continue;
		let t = m[_].row - 1, r = /* @__PURE__ */ new Set();
		for (let t of g.get(e) ?? []) {
			let n = `${e}:${t}`;
			f(s.get(t)) === h.get(n) && r.add(n);
		}
		let a = [];
		p(1, 0, c - 1, a);
		for (let o = e; o <= t; o++) for (let [t, s] of a) for (let a = t; a <= s; a++) {
			let t = `${o}:${a}`;
			o === e && r.has(t) || Ut(i, t, n);
		}
	}
	return {
		anchors: r,
		continuations: i
	};
}
function an(e) {
	return Array.from(e);
}
function on(e, t, n, r, i) {
	let a = an(t), o = a.length, s = [];
	for (let t of e) {
		let e = t.sb, c = t.eb;
		if (!(e < c) || e >= o) continue;
		let l = Math.min(c, o), u = n + i(a.slice(0, e).join("")), d = i(a.slice(e, l).join("")), f = r === "center" ? "center" : r === "distributed" ? "distribute" : "start";
		s.push({
			text: t.text,
			x: u,
			width: d,
			spread: f
		});
	}
	return s;
}
function sn(e) {
	switch (e.type) {
		case "empty": return "";
		case "text": return e.text;
		case "number": return String(e.number);
		case "bool": return e.bool ? "TRUE" : "FALSE";
		case "error": return e.error;
		case "shared": return "";
	}
}
function cn(e, t, n, r = !1) {
	return ln(e, t, n, r).text;
}
function ln(e, t, n, r = !1) {
	let i = t.cellXfs[e.styleIndex ?? 0]?.numFmtId ?? 0, a = t.numFmts?.find((e) => e.numFmtId === i)?.formatCode ?? null, o = n?.numFmtId ?? i, s = n ? n.formatCode : a;
	if (e.value.type !== "number") {
		let t = sn(e.value);
		return { text: s ? un(t, s) : t };
	}
	return vn(e.value.number, o, s, r);
}
function un(e, t) {
	let n = m(t), r = j(n);
	if (r < 0) return e;
	let i = n[r];
	if (i === "") return "";
	let a = "", o = 0;
	for (; o < i.length;) {
		let t = i[o];
		if (t === "\"") {
			for (o++; o < i.length && i[o] !== "\"";) a += i[o++];
			o < i.length && o++;
		} else if (t === "\\") o + 1 < i.length && (a += i[o + 1]), o += 2;
		else if (t === "[") {
			for (; o < i.length && i[o] !== "]";) o++;
			o < i.length && o++;
		} else t === "@" ? (a += e, o++) : t === "_" || t === "*" ? o += 2 : (a += t, o++);
	}
	return a;
}
var dn = {
	15: "d-mmm-yy",
	16: "d-mmm",
	17: "mmm-yy",
	18: "h:mm AM/PM",
	19: "h:mm:ss AM/PM",
	20: "h:mm",
	21: "h:mm:ss",
	22: "m/d/yyyy h:mm",
	27: "[$-411]ge.m.d",
	28: "[$-411]ggge\"年\"m\"月\"d\"日\"",
	29: "[$-411]ggge\"年\"m\"月\"d\"日\"",
	30: "m/d/yy",
	31: "yyyy\"年\"m\"月\"d\"日\"",
	45: "mm:ss",
	46: "[h]:mm:ss",
	47: "mm:ss.0",
	50: "[$-411]ge.m.d",
	51: "[$-411]ggge\"年\"m\"月\"d\"日\"",
	52: "yyyy\"年\"m\"月\"",
	53: "m\"月\"d\"日\"",
	54: "[$-411]ggge\"年\"m\"月\"d\"日\"",
	55: "yyyy\"年\"m\"月\"",
	56: "m\"月\"d\"日\"",
	57: "[$-411]ge.m.d",
	58: "[$-411]ggge\"年\"m\"月\"d\"日\""
}, fn = 11, pn = 6;
function mn(e) {
	return e.includes(".") ? e.replace(/0+$/, "").replace(/\.$/, "") : e;
}
function hn(e) {
	return `${e >= 0 ? "+" : "-"}${Math.abs(e).toString().padStart(2, "0")}`;
}
function gn(e) {
	let [t, n] = e.toExponential(pn - 1).split("e");
	return `${mn(t)}E${hn(Number(n))}`;
}
function _n(e) {
	if (!Number.isFinite(e)) return String(e);
	if (e === 0) return "0";
	let t = e < 0, n = Math.abs(e), r = Number(n.toExponential(fn - 1).split("e")[1]), i = r >= fn || r < -5 ? gn(n) : mn(n.toPrecision(fn));
	return t ? `-${i}` : i;
}
function vn(e, t, n, r = !1) {
	if (t === 14 && !n) return yn(R(e, r), e, r);
	if (n && n.trim().toLowerCase() === "general") return { text: _n(e) };
	if (n) return jn(e, n, r);
	let i = dn[t];
	if (i) return yn(a(e, i, r), e, r);
	switch (t) {
		case 0: return { text: _n(e) };
		case 1: return jn(e, "0");
		case 2: return jn(e, "0.00");
		case 3: return jn(e, "#,##0");
		case 4: return jn(e, "#,##0.00");
		case 9: return jn(e, "0%");
		case 10: return jn(e, "0.00%");
		case 11: return jn(e, "0.00E+00");
		case 37: return jn(e, "#,##0 ;(#,##0)");
		case 38: return jn(e, "#,##0 ;[Red](#,##0)");
		case 39: return jn(e, "#,##0.00;(#,##0.00)");
		case 40: return jn(e, "#,##0.00;[Red](#,##0.00)");
		case 48: return jn(e, "##0.0E+0");
		case 49: return { text: String(e) };
		default: return { text: _n(e) };
	}
}
function yn(e, t, n) {
	return e === "#" && !k(t, n) ? {
		text: e,
		fill: !0
	} : { text: e };
}
var bn = {
	black: "#000000",
	blue: "#0000FF",
	cyan: "#00FFFF",
	green: "#008000",
	magenta: "#FF00FF",
	red: "#FF0000",
	white: "#FFFFFF",
	yellow: "#FFFF00"
}, xn = /* @__PURE__ */ "#000000.#FFFFFF.#FF0000.#00FF00.#0000FF.#FFFF00.#FF00FF.#00FFFF.#000000.#FFFFFF.#FF0000.#00FF00.#0000FF.#FFFF00.#FF00FF.#00FFFF.#800000.#008000.#000080.#808000.#800080.#008080.#C0C0C0.#808080.#9999FF.#993366.#FFFFCC.#CCFFFF.#660066.#FF8080.#0066CC.#CCCCFF.#000080.#FF00FF.#FFFF00.#00FFFF.#800080.#800000.#008080.#0000FF.#00CCFF.#CCFFFF.#CCFFCC.#FFFF99.#99CCFF.#FF99CC.#CC99FF.#FFCC99.#3366FF.#33CCCC.#99CC00.#FFCC00.#FF9900.#FF6600.#666699.#969696.#003366.#339966.#003300.#333300.#993300.#993366.#333399.#333333".split(".");
function Sn(e) {
	let t = "", n, r, i = 0;
	for (; i < e.length;) {
		let a = e[i];
		if (a === "\"") {
			for (t += a, i++; i < e.length && e[i] !== "\"";) t += e[i++];
			i < e.length && (t += e[i++]);
		} else if (a === "\\" || a === "_" || a === "*") t += a, i + 1 < e.length && (t += e[i + 1]), i += 2;
		else if (a === "[") {
			let o = e.indexOf("]", i);
			if (o < 0) {
				t += a, i++;
				continue;
			}
			let s = e.slice(i + 1, o), c = s.toLowerCase(), l = c.match(/^color(\d{1,2})$/), u = s.match(/^(<=|>=|<>|<|>|=)\s*(-?[0-9.]+(?:[eE][-+]?\d+)?)$/);
			if (g(bn, c)) n = bn[c];
			else if (l) {
				let e = parseInt(l[1], 10);
				e >= 1 && e <= 56 && (n = xn[e + 7] ?? n);
			} else u ? r = {
				op: u[1],
				value: Number(u[2])
			} : t += e.slice(i, o + 1);
			i = o + 1;
		} else t += a, i++;
	}
	return {
		body: t,
		color: n,
		condition: r
	};
}
function Cn(e, t) {
	switch (e.op) {
		case "<": return t < e.value;
		case "<=": return t <= e.value;
		case ">": return t > e.value;
		case ">=": return t >= e.value;
		case "=": return t === e.value;
		case "<>": return t !== e.value;
	}
}
function wn(e) {
	let t = [], n = "", r = "", i = !1, a = !1, o, s = !1, c = 0, l = 0, u = (e) => {
		if (!e) return;
		!a && !s && (c = n.replace(/,/g, "").length);
		let r = t[t.length - 1];
		r && r.kind === "lit" ? r.text += e : t.push({
			kind: "lit",
			text: e
		});
	}, d = 0;
	for (; d < e.length;) {
		let c = e[d];
		if (c === "\"") {
			d++;
			let t = "";
			for (; d < e.length && e[d] !== "\"";) t += e[d++];
			d < e.length && d++, u(t);
		} else if (c === "\\") d + 1 < e.length && u(e[d + 1]), d += 2;
		else if (c === "[") {
			let t = e.indexOf("]", d), n = t > d ? e.slice(d + 1, t) : "";
			if (n.startsWith("$")) {
				let e = n.slice(1), t = e.indexOf("-");
				u(t >= 0 ? e.slice(0, t) : e);
			}
			d = t < 0 ? e.length : t + 1;
		} else if (c === "_") u(" "), d += 2;
		else if (c === "*") u(e[d + 1] ?? ""), d += 2;
		else if (c === "#" || c === "0" || c === "?") a ? (r += c, t.push({
			kind: "fracph",
			ph: c
		})) : (n += c, t.push({
			kind: "intph",
			ph: c
		})), l = 0, d++;
		else if (c === ".") a = !0, t.push({ kind: "dot" }), d++;
		else if (c === ",") a || (n += ","), l++, d++;
		else if (c === "/" && n.replace(/,/g, "").length > 0) {
			s = !0, t.push({ kind: "fraction" }), d++;
			let n = "";
			for (; d < e.length && /[0-9#?]/.test(e[d]);) n += e[d++];
			t[t.length - 1].den = n;
		} else if (c === "%") i = !0, t.push({ kind: "percent" }), d++;
		else if ((c === "E" || c === "e") && (e[d + 1] === "+" || e[d + 1] === "-")) {
			let n = e[d + 1] === "+";
			d += 2;
			let r = 0;
			for (; d < e.length && (e[d] === "0" || e[d] === "#" || e[d] === "?");) r++, d++;
			o = {
				plus: n,
				width: Math.max(r, 1)
			}, t.push({ kind: "exp" });
		} else u(c), d++;
	}
	let f = l, p = /,(?=[#0?])/.test(n), m = n.replace(/,/g, ""), h;
	if (s) {
		let e = t.find((e) => e.kind === "fraction")?.den ?? "?", n = e.match(/[0-9]+/);
		h = {
			wholeSpec: m.slice(0, c),
			numSpec: m.slice(c) || "?",
			denSpec: e.replace(/[^0#?]/g, ""),
			fixedDen: n ? parseInt(n[0], 10) : null
		};
	}
	return {
		parts: t,
		intSpec: m,
		fracSpec: r,
		hasPercent: i,
		commaScale: f,
		grouping: p,
		exp: o,
		fraction: h
	};
}
function Tn(e) {
	return e.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function En(e, t, n) {
	let r = t.split(""), i = e.split(""), a = [], o = i.length - 1, s = [];
	for (let e = r.length - 1; e >= 0; e--) o >= 0 ? (a.unshift(i[o]), s.unshift(i[o]), o--) : r[e] === "0" ? (a.unshift("0"), s.unshift("0")) : r[e] === "?" && a.unshift(" ");
	for (; o >= 0;) a.unshift(i[o]), s.unshift(i[o]), o--;
	if (n) {
		let e = Tn(s.join(""));
		return (a.length - s.length > 0 ? a.slice(0, a.length - s.length).join("") : "") + e;
	}
	return a.join("");
}
function Dn(e, t) {
	let n = t.length;
	if (n === 0) return "";
	let r = e.padEnd(n, "0").slice(0, n).split("");
	for (let e = n - 1; e >= 0; e--) {
		let n = t[e] ?? "#";
		if (r[e] === "0" && n === "#") r[e] = "";
		else if (r[e] === "0" && n === "?") r[e] = " ";
		else break;
	}
	return r.join("");
}
function On(e, t, n) {
	if (n !== null) return [Math.round(e * n), n];
	let r = 10 ** Math.max(t, 1) - 1, i = 0, a = 1, o = Math.abs(e), s = [0, 1], c = [1, 1];
	for (let t = 0; t < 100; t++) {
		let t = s[0] + c[0], n = s[1] + c[1];
		if (n > r) break;
		let l = t / n, u = Math.abs(l - e);
		if (u < o && (o = u, i = t, a = n), l < e) s = [t, n];
		else if (l > e) c = [t, n];
		else break;
	}
	return [i, a];
}
function kn(e, t, n) {
	let r = wn(t), i = n ? Math.abs(e) : e;
	r.hasPercent && (i *= 100), r.commaScale > 0 && (i /= 1e3 ** r.commaScale);
	let a = i < 0 ? "-" : "", o = Math.abs(i);
	if (r.fraction) {
		let e = Math.floor(o), t = o - e, { wholeSpec: n, numSpec: i, denSpec: s, fixedDen: c } = r.fraction, l = n.length > 0, [u, d] = On(t, s.length, c), f = (e, t) => {
			let n = String(e), r = t.includes("0") ? "0" : " ";
			for (; n.length < t.length;) n = r + n;
			return n;
		}, p = (e, t) => {
			let n = String(e), r = t.includes("0") ? "0" : " ";
			for (; n.length < t.length;) n += r;
			return n;
		}, m = a;
		if (l) {
			let t = e > 0 ? String(e) : n.includes("0") ? "0" : "";
			if (u === 0) {
				let e = c === null ? s.length || 1 : String(c).length;
				m += t + " ".repeat(1 + i.length + 1 + e);
			} else {
				let e = c === null ? p(d, s) : String(c);
				m += t + " " + f(u, i) + "/" + e;
			}
		} else {
			let t = u + e * d, n = c === null ? p(d, s) : String(c);
			m += f(t, i) + "/" + n;
		}
		return m;
	}
	if (r.exp) {
		let e = Math.max(r.intSpec.length, 1), t = r.fracSpec.length, n = 0, i = 0;
		o !== 0 && (i = Math.floor(Math.log10(o)), i = Math.floor(i / e) * e, n = o / 10 ** i, parseFloat(v(n, t)) >= 10 ** e && (i += e, n = o / 10 ** i));
		let [s, c = ""] = v(n, t).split(".");
		return a + An(r, En(s, r.intSpec, !1), Dn(c, r.fracSpec), "E" + (i < 0 ? "-" : r.exp.plus ? "+" : "") + String(Math.abs(i)).padStart(r.exp.width, "0"));
	}
	let s = r.fracSpec.length, [c, l = ""] = v(o, s).split("."), u = c.replace(/^0+/, ""), d = /[0]/.test(r.intSpec) || r.intSpec === "" && !1;
	return u === "" && d && (u = "0"), a + An(r, En(u, r.intSpec, r.grouping), Dn(l, r.fracSpec), "");
}
function An(e, t, n, r) {
	let i = t.split(""), a = [];
	e.parts.forEach((e, t) => {
		e.kind === "intph" && a.push(t);
	});
	let o = n.split(""), s = [];
	e.parts.forEach((e, t) => {
		e.kind === "fracph" && s.push(t);
	});
	let c = /* @__PURE__ */ new Map(), l = i.length - 1;
	for (let e = a.length - 1; e >= 0; e--) if (e === 0) {
		let t = "";
		for (; l >= 0;) t = i[l--] + t;
		c.set(a[e], t);
	} else l >= 0 ? c.set(a[e], i[l--]) : c.set(a[e], "");
	let u = /* @__PURE__ */ new Map();
	for (let e = 0; e < s.length; e++) u.set(s[e], o[e] ?? "");
	let d = e.fracSpec.length > 0 && (n.length > 0 || /[0?]/.test(e.fracSpec)), f = "";
	for (let t = 0; t < e.parts.length; t++) {
		let n = e.parts[t];
		n.kind === "lit" ? f += n.text : n.kind === "intph" ? f += c.get(t) ?? "" : n.kind === "fracph" ? f += u.get(t) ?? "" : n.kind === "dot" ? f += d ? "." : "" : n.kind === "percent" ? f += "%" : n.kind === "exp" && (f += r);
	}
	return f;
}
function jn(e, t, r = !1) {
	let i = m(t), o = j(i), s = i.filter((e, t) => t !== o).map(Sn);
	if (s.length === 0) return { text: _n(e) };
	let c = s.some((e) => e.condition), l, u = !1;
	if (c) {
		let t = !1;
		for (let n of s) if (n.condition) {
			if (Cn(n.condition, e)) {
				l = n, t = !0;
				break;
			}
		} else if (l ??= n, l === n) break;
		if (!l) return { text: "#" };
		u = t && e < 0;
	} else e > 0 ? l = s[0] : e < 0 ? s.length > 1 ? (l = s[1], u = !0) : l = s[0] : l = s.length > 2 ? s[2] : s[0];
	let d = u ? Math.abs(e) : e, f = n(l.body) ? yn(a(d, l.body, r), d, r) : { text: kn(e, l.body, u) };
	return l.color ? {
		...f,
		color: l.color
	} : f;
}
var Mn = Object.freeze({
	kind: "unsupported",
	reason: "syntax"
}), Nn = Object.freeze({
	kind: "unsupported",
	reason: "outOfGrid"
}), Pn = Object.freeze({
	kind: "unsupported",
	reason: "unresolvedValue"
}), Fn = Object.freeze({ kind: "error" }), In = Object.freeze({
	kind: "value",
	value: null
}), Ln = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/, Rn = /^"(?:[^"]|"")*"$/, zn = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})$/, Bn = 1048576, Vn = 16384;
function Hn(e) {
	let t = e.trim();
	if (Rn.test(t)) return t.slice(1, -1).replace(/""/g, "\"");
	if (Ln.test(t)) {
		let e = Number(t);
		return Number.isFinite(e) ? e : void 0;
	}
}
function Un(e, t) {
	let n = Hn(e);
	if (n !== void 0) return {
		kind: "value",
		value: n
	};
	let r = zn.exec(e.trim());
	if (!r) return Mn;
	let i = 0;
	for (let e of r[2].toUpperCase()) i = i * 26 + (e.charCodeAt(0) - 64);
	let a = Number(r[4]);
	if (a < 1 || a > Bn || i > Vn) return Mn;
	let o = r[3] === "$" ? a : a + (t.row - t.anchorRow), s = r[1] === "$" ? i : i + (t.col - t.anchorCol);
	if (o < 1 || o > Bn || s < 1 || s > Vn) return Nn;
	let c = t.cellIndex.get(`${o}:${s}`)?.value;
	if (!c) return In;
	switch (c.type) {
		case "empty": return In;
		case "number": return {
			kind: "value",
			value: c.number
		};
		case "text": return {
			kind: "value",
			value: c.text
		};
		case "bool": return {
			kind: "value",
			value: c.bool
		};
		case "error": return Fn;
		default: return Pn;
	}
}
var Wn = 1048576, Gn = 16384, Kn = class {
	code;
	constructor(e) {
		this.code = e;
	}
}, Y = class extends Error {
	kind;
	code;
	constructor(e, t) {
		super(`CF formula ${e}`), this.kind = e, this.code = t;
	}
};
function qn(e) {
	return Array.isArray(e) ? e : [e];
}
function Jn(e) {
	return Array.isArray(e) ? e[0] ?? 0 : e;
}
function Yn(e) {
	let t = Jn(e);
	if (t instanceof Kn) throw new Y("error", t.code);
	return t;
}
function Xn(e) {
	return e.flatMap(qn).map((e) => Yn(e));
}
var Zn = 8, Qn = 128, $n = 64 * 1024;
function er(e) {
	if (e.kind !== "value") return !1;
	try {
		return nr(e.value);
	} catch (e) {
		if (e instanceof Y) return !1;
		throw e;
	}
}
function tr(e, t) {
	try {
		let n = fr(e, t);
		return n instanceof Kn ? { kind: "error" } : {
			kind: "value",
			value: n
		};
	} catch (e) {
		if (e instanceof Y) return { kind: e.kind };
		throw e;
	}
}
function nr(e) {
	let t = Yn(e);
	return typeof t == "boolean" ? t : typeof t == "number" ? t !== 0 : typeof t == "string" ? t.length > 0 && t.toUpperCase() !== "FALSE" : !1;
}
function X(e) {
	let t = Yn(e);
	if (typeof t == "number") {
		if (!Number.isFinite(t)) throw new Y("error", "#NUM!");
		return t;
	}
	if (typeof t == "boolean") return +!!t;
	if (t == null) return 0;
	let n = rr(t);
	if (n === null) throw new Y("error", "#VALUE!");
	return n;
}
function rr(e) {
	if (!/^ *[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)? *$/u.test(e)) return null;
	let t = Number(e);
	return Number.isFinite(t) ? t : null;
}
function Z(e) {
	let t = Yn(e);
	return t == null ? "" : typeof t == "boolean" ? t ? "TRUE" : "FALSE" : String(t);
}
function Q(e) {
	return new Kn(e);
}
var ir = new Set([
	"<",
	">",
	"=",
	"+",
	"-",
	"*",
	"/",
	"&",
	"^",
	"%"
]);
function ar(e) {
	let t = [], n = 0, r = e;
	for (; n < r.length;) {
		let e = r[n];
		if (e === " " || e === "	" || e === "\n" || e === "\r") {
			n++;
			continue;
		}
		if (e === "(") {
			t.push({
				kind: "lparen",
				text: e
			}), n++;
			continue;
		}
		if (e === ")") {
			t.push({
				kind: "rparen",
				text: e
			}), n++;
			continue;
		}
		if (e === ",") {
			t.push({
				kind: "comma",
				text: e
			}), n++;
			continue;
		}
		if (e === ":") {
			t.push({
				kind: "colon",
				text: e
			}), n++;
			continue;
		}
		if (e === "\"") {
			let e = n + 1, i = "";
			for (; e < r.length;) {
				if (r[e] === "\"" && r[e + 1] === "\"") {
					i += "\"", e += 2;
					continue;
				}
				if (r[e] === "\"") break;
				i += r[e], e++;
			}
			if (e === r.length) throw new Y("invalid");
			t.push({
				kind: "str",
				text: i
			}), n = e + 1;
			continue;
		}
		if (e === "#") {
			let e = /^#(?:NULL!|DIV\/0!|VALUE!|REF!|NAME\?|NUM!|N\/A|GETTING_DATA)/u.exec(r.slice(n));
			if (!e) throw new Y("unsupported");
			t.push({
				kind: "error",
				text: e[0]
			}), n += e[0].length;
			continue;
		}
		if (e >= "0" && e <= "9" || e === "." && /[0-9]/u.test(r[n + 1] ?? "")) {
			let e = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/u.exec(r.slice(n));
			if (!e || !Number.isFinite(Number(e[0]))) throw new Y("invalid");
			t.push({
				kind: "num",
				text: e[0]
			}), n += e[0].length;
			continue;
		}
		if (ir.has(e)) {
			(e === "<" || e === ">") && (r[n + 1] === "=" || e === "<" && r[n + 1] === ">") ? (t.push({
				kind: "op",
				text: r.slice(n, n + 2)
			}), n += 2) : (t.push({
				kind: "op",
				text: e
			}), n++);
			continue;
		}
		if (e === "$" || or(e)) {
			let e = n;
			for (; e < r.length && (r[e] === "$" || sr(r[e]));) e++;
			let i = r.slice(n, e);
			n = e;
			let a = r[n] === "(" ? null : cr(i);
			if (a) t.push({
				kind: "ref",
				text: i,
				ref: a
			});
			else {
				let e = i.toUpperCase();
				(e === "TRUE" || e === "FALSE") && r[n] !== "(" ? t.push({
					kind: "bool",
					text: e
				}) : t.push({
					kind: "name",
					text: i
				});
			}
			continue;
		}
		throw new Y("unsupported");
	}
	return t;
}
function or(e) {
	return e >= "A" && e <= "Z" || e >= "a" && e <= "z" || e === "_";
}
function sr(e) {
	return or(e) || e >= "0" && e <= "9" || e === ".";
}
function cr(e) {
	let t = 0, n = !1, r = !1;
	e[t] === "$" && (n = !0, t++);
	let i = t;
	for (; t < e.length && e[t] >= "A" && e[t].toUpperCase() <= "Z" && !(!(e[t] >= "A" && e[t] <= "Z") && !(e[t] >= "a" && e[t] <= "z"));) t++;
	if (t === i) return null;
	let a = e.slice(i, t).toUpperCase();
	e[t] === "$" && (r = !0, t++);
	let o = t;
	for (; t < e.length && e[t] >= "0" && e[t] <= "9";) t++;
	if (t === o || t !== e.length) return null;
	let s = parseInt(e.slice(o, t), 10), c = 0;
	for (let e = 0; e < a.length; e++) c = c * 26 + (a.charCodeAt(e) - 64);
	return s < 1 || s > Wn || c > Gn ? null : {
		colAbs: n,
		col: c,
		rowAbs: r,
		row: s
	};
}
var lr = /* @__PURE__ */ new WeakMap();
function ur(e) {
	return e.replace(/[A-Z]+/gu, (e) => e.toLowerCase());
}
function dr(e, t) {
	let n = lr.get(e);
	if (!n || n.size !== e.size) {
		let t = /* @__PURE__ */ new Map();
		for (let n of e.keys()) t.set(ur(n), n);
		n = {
			size: e.size,
			keys: t
		}, lr.set(e, n);
	}
	let r = n.keys.get(ur(t));
	return r === void 0 ? void 0 : e.get(r);
}
function fr(e, t) {
	return Or(pr(e, t.definedNames, t.depth, {
		depth: 0,
		remainingNameSourceUnits: $n
	}), t);
}
function pr(e, t, n, r) {
	let i = e.trim(), a = ar(i.startsWith("=") ? i.slice(1) : i), o = {
		toks: a,
		pos: 0,
		budget: r,
		names: t,
		nameDepth: n
	}, s = gr(o);
	if (o.pos !== a.length) throw new Y("unsupported");
	return s;
}
function mr(e) {
	return e.toks[e.pos];
}
function hr(e) {
	return e.toks[e.pos++];
}
function gr(e) {
	if (e.budget.depth >= Qn) throw new Y("unsupported");
	e.budget.depth++;
	try {
		return _r(e);
	} finally {
		e.budget.depth--;
	}
}
function _r(e) {
	let t = yr(e), n = mr(e);
	return n && n.kind === "op" && (n.text === "<" || n.text === ">" || n.text === "<=" || n.text === ">=" || n.text === "=" || n.text === "<>") ? (hr(e), {
		t: "bin",
		op: n.text,
		l: t,
		r: yr(e)
	}) : t;
}
function vr(e, t, n) {
	let r = n(e), i = [];
	for (;;) {
		let r = mr(e);
		if (!r || r.kind !== "op" || !t.includes(r.text)) break;
		hr(e), i.push({
			op: r.text,
			r: n(e)
		});
	}
	return i.length ? {
		t: "chain",
		first: r,
		rest: i
	} : r;
}
function yr(e) {
	return vr(e, ["&"], br);
}
function br(e) {
	return vr(e, ["+", "-"], xr);
}
function xr(e) {
	return vr(e, ["*", "/"], Er);
}
function Sr(e) {
	return Number.isFinite(e) ? e : Q("#NUM!");
}
function Cr(e, t, n) {
	switch (e) {
		case "&": return Z(t) + Z(n);
		case "+": return Sr(X(t) + X(n));
		case "-": return Sr(X(t) - X(n));
		case "*": return Sr(X(t) * X(n));
		case "/": {
			let e = X(t), r = X(n);
			return r === 0 ? Q("#DIV/0!") : Sr(e / r);
		}
		default: return wr(e, Yn(t), Yn(n));
	}
}
function wr(e, t, n) {
	let r = typeof t == "string" && isNaN(parseFloat(t)) ? null : Tr(t), i = typeof n == "string" && isNaN(parseFloat(n)) ? null : Tr(n);
	if (r !== null && i !== null) switch (e) {
		case "<": return r < i;
		case ">": return r > i;
		case "<=": return r <= i;
		case ">=": return r >= i;
		case "=": return r === i;
		case "<>": return r !== i;
	}
	let a = String(t ?? ""), o = String(n ?? "");
	switch (e) {
		case "<": return a < o;
		case ">": return a > o;
		case "<=": return a <= o;
		case ">=": return a >= o;
		case "=": return a === o;
		case "<>": return a !== o;
	}
	return !1;
}
function Tr(e) {
	let t = Yn(e);
	if (typeof t == "number") return t;
	if (typeof t == "boolean") return +!!t;
	if (t == null) return 0;
	let n = parseFloat(t);
	return isNaN(n) ? 0 : n;
}
function Er(e) {
	if (e.budget.depth >= Qn) throw new Y("unsupported");
	e.budget.depth++;
	try {
		let t = mr(e);
		return t && t.kind === "op" && t.text === "-" ? (hr(e), {
			t: "neg",
			e: Er(e)
		}) : t && t.kind === "op" && t.text === "+" ? (hr(e), {
			t: "pos",
			e: Er(e)
		}) : Dr(e);
	} finally {
		e.budget.depth--;
	}
}
function Dr(e) {
	let t = hr(e);
	if (!t) throw new Y("invalid");
	if (t.kind === "num") return {
		t: "lit",
		v: parseFloat(t.text)
	};
	if (t.kind === "str") return {
		t: "lit",
		v: t.text
	};
	if (t.kind === "bool") return {
		t: "lit",
		v: t.text === "TRUE"
	};
	if (t.kind === "error") return {
		t: "lit",
		v: Q(t.text)
	};
	if (t.kind === "lparen") {
		let t = gr(e), n = hr(e);
		if (!n || n.kind !== "rparen") throw new Y("invalid");
		return t;
	}
	if (t.kind === "ref") {
		if (mr(e)?.kind === "colon") {
			hr(e);
			let n = hr(e);
			if (n?.kind !== "ref" || !n.ref) throw new Y("invalid");
			return {
				t: "range",
				a: t.ref,
				b: n.ref
			};
		}
		return {
			t: "ref",
			ref: t.ref
		};
	}
	if (t.kind === "name") {
		if (mr(e)?.kind === "lparen") {
			hr(e);
			let n = [];
			if (mr(e)?.kind !== "rparen") for (n.push(gr(e)); mr(e)?.kind === "comma";) hr(e), n.push(gr(e));
			let r = hr(e);
			if (!r || r.kind !== "rparen") throw new Y("invalid");
			let i = t.text.toUpperCase();
			return jr(i, n.length), {
				t: "call",
				name: i,
				args: n
			};
		}
		let n = dr(e.names, t.text);
		if (!n || e.nameDepth >= Zn || n.formula.length > e.budget.remainingNameSourceUnits) throw new Y("unsupported");
		return e.budget.remainingNameSourceUnits -= n.formula.length, {
			t: "name",
			body: pr(Mr(n.formula), e.names, e.nameDepth + 1, e.budget)
		};
	}
	throw new Y("invalid");
}
function Or(e, t) {
	try {
		return kr(e, t);
	} catch (e) {
		if (e instanceof Y && e.kind === "error") return Q(e.code ?? "#VALUE!");
		throw e;
	}
}
function kr(e, t) {
	switch (e.t) {
		case "lit": return e.v;
		case "ref": return Pr(e.ref, t);
		case "range": return Rr(e.a, e.b, t);
		case "neg": return -X(Or(e.e, t));
		case "pos": return X(Or(e.e, t));
		case "bin": return Cr(e.op, Or(e.l, t), Or(e.r, t));
		case "chain": {
			let n = Or(e.first, t);
			for (let { op: r, r: i } of e.rest) n = Cr(r, n, Or(i, t));
			return n;
		}
		case "call": return Hr(e.name, e.args, t);
		case "name": return Or(e.body, {
			...t,
			anchorRow: 1,
			anchorCol: 1
		});
	}
}
var Ar = {
	AND: [1, 255],
	OR: [1, 255],
	NOT: [1, 1],
	IF: [2, 3],
	IFERROR: [2, 2],
	IFS: [2, 254],
	TRUE: [0, 0],
	FALSE: [0, 0],
	ISBLANK: [1, 1],
	ISNUMBER: [1, 1],
	ISTEXT: [1, 1],
	ISNONTEXT: [1, 1],
	ISERROR: [1, 1],
	ISERR: [1, 1],
	ISNA: [1, 1],
	ISLOGICAL: [1, 1],
	ROUNDDOWN: [2, 2],
	ROUNDUP: [2, 2],
	ROUND: [2, 2],
	INT: [1, 1],
	TRUNC: [1, 2],
	CEILING: [2, 2],
	FLOOR: [2, 2],
	MOD: [2, 2],
	POWER: [2, 2],
	SQRT: [1, 1],
	ABS: [1, 1],
	SIGN: [1, 1],
	EXP: [1, 1],
	LN: [1, 1],
	LOG10: [1, 1],
	MIN: [1, 255],
	MAX: [1, 255],
	SUM: [1, 255],
	AVERAGE: [1, 255],
	COUNT: [1, 255],
	COUNTA: [1, 255],
	COUNTBLANK: [1, 1],
	COUNTIF: [2, 2],
	SUMIF: [2, 3],
	AVERAGEIF: [2, 3],
	LEN: [1, 1],
	LEFT: [1, 2],
	RIGHT: [1, 2],
	MID: [3, 3],
	UPPER: [1, 1],
	LOWER: [1, 1],
	TRIM: [1, 1],
	EXACT: [2, 2],
	FIND: [2, 3],
	SEARCH: [2, 3],
	CONCATENATE: [1, 255],
	CONCAT: [1, 253],
	T: [1, 1],
	N: [1, 1],
	VALUE: [1, 1],
	ROW: [0, 1],
	COLUMN: [0, 1],
	TODAY: [0, 0],
	NOW: [0, 0],
	DATE: [3, 3],
	YEAR: [1, 1],
	MONTH: [1, 1],
	DAY: [1, 1],
	WEEKDAY: [1, 2]
};
function jr(e, t) {
	let n = c(Ar, e);
	if (!n) throw new Y("unsupported");
	if (t < n[0] || t > n[1] || e === "IFS" && t % 2 != 0) throw new Y("invalid");
}
function Mr(e) {
	let t = e.match(/^(?:'[^']*'|[A-Za-z_][A-Za-z0-9_.]*)!(.*)$/);
	return t ? t[1] : e;
}
function Nr(e, t) {
	return {
		col: e.colAbs ? e.col : e.col + (t.col - t.anchorCol),
		row: e.rowAbs ? e.row : e.row + (t.row - t.anchorRow)
	};
}
function Pr(e, t) {
	let { row: n, col: r } = Nr(e, t);
	return Vr(t.cellIndex.get(`${n}:${r}`));
}
var Fr = 4096;
function Ir(e, t, n) {
	let r = Nr(e, n), i = Nr(t, n);
	return {
		r1: Math.min(r.row, i.row),
		c1: Math.min(r.col, i.col),
		r2: Math.max(r.row, i.row),
		c2: Math.max(r.col, i.col)
	};
}
function Lr({ r1: e, c1: t, r2: n, c2: r }, i) {
	if ((n - e + 1) * (r - t + 1) > Fr) throw new Y("unsupported");
	let a = [];
	for (let o = e; o <= n; o++) for (let e = t; e <= r; e++) a.push(Vr(i.cellIndex.get(`${o}:${e}`)));
	return a;
}
function Rr(e, t, n) {
	return Lr(Ir(e, t, n), n);
}
function zr(e, t) {
	switch (e.t) {
		case "ref": {
			let { row: n, col: r } = Nr(e.ref, t);
			return {
				r1: n,
				c1: r,
				r2: n,
				c2: r
			};
		}
		case "range": return Ir(e.a, e.b, t);
		case "name": return zr(e.body, {
			...t,
			anchorRow: 1,
			anchorCol: 1
		});
		default: return null;
	}
}
function Br(e, t, n) {
	let r = zr(e, n), i = zr(t, n);
	if (!r || !i) return null;
	let a = i.r1 + (r.r2 - r.r1), o = i.c1 + (r.c2 - r.c1);
	if (i.r1 < 1 || i.c1 < 1 || a > Wn || o > Gn) throw new Y("unsupported");
	return Lr({
		r1: i.r1,
		c1: i.c1,
		r2: a,
		c2: o
	}, n);
}
function Vr(e) {
	if (!e) return null;
	switch (e.value.type) {
		case "number": return e.value.number;
		case "bool": return e.value.bool;
		case "text": return e.value.text;
		case "error": return Q(e.value.error);
		default: return null;
	}
}
function Hr(e, t, n) {
	let r = (e) => Or(t[e], n);
	switch (e) {
		case "IF": return nr(r(0)) ? r(1) : t.length > 2 ? r(2) : !1;
		case "IFERROR": {
			let e = Jn(r(0));
			return (e instanceof Kn ? r(1) : e) ?? "";
		}
		case "ISERROR": return Jn(r(0)) instanceof Kn;
		case "ISERR": {
			let e = Jn(r(0));
			return e instanceof Kn && e.code !== "#N/A";
		}
		case "ISNA": {
			let e = Jn(r(0));
			return e instanceof Kn && e.code === "#N/A";
		}
		case "ROW":
		case "COLUMN": {
			let r = t[0], i = r === void 0 ? n : r.t === "ref" ? Nr(r.ref, n) : null;
			if (!i) throw new Y("unsupported");
			return e === "ROW" ? i.row : i.col;
		}
		case "SUMIF":
		case "AVERAGEIF": {
			let i = qn(r(0)), a = r(1), o = t.length > 2 ? Br(t[0], t[2], n) ?? qn(r(2)) : null;
			return e === "SUMIF" ? Gr(i, a, o) : Kr(i, a, o);
		}
	}
	let i = t.map((e) => Or(e, n));
	switch (e) {
		case "IFS":
			Xn(i);
			for (let e = 0; e < i.length; e += 2) if (nr(i[e])) return i[e + 1];
			return Q("#N/A");
		case "AND": return Xn(i).every((e) => nr(e));
		case "OR": return Xn(i).some((e) => nr(e));
		case "NOT": return !nr(i[0]);
		case "TRUE": return !0;
		case "FALSE": return !1;
		case "ISBLANK": return Jn(i[0]) === null;
		case "ISNUMBER": return typeof Jn(i[0]) == "number";
		case "ISTEXT": return typeof Jn(i[0]) == "string";
		case "ISNONTEXT": return typeof Jn(i[0]) != "string";
		case "ISLOGICAL": return typeof Jn(i[0]) == "boolean";
		case "ROUNDDOWN": {
			let e = X(i[0]), t = 10 ** X(i[1]);
			return (e >= 0 ? Math.floor(e * t) : Math.ceil(e * t)) / t;
		}
		case "ROUNDUP": {
			let e = X(i[0]), t = 10 ** X(i[1]);
			return (e >= 0 ? Math.ceil(e * t) : Math.floor(e * t)) / t;
		}
		case "ROUND": return Ur(X(i[0]), X(i[1]));
		case "INT": return Math.floor(X(i[0]));
		case "TRUNC": {
			let e = X(i[0]), t = 10 ** X(i[1] ?? 0);
			return (e >= 0 ? Math.floor(e * t) : Math.ceil(e * t)) / t;
		}
		case "CEILING": {
			let e = X(i[0]), t = X(i[1]);
			return t === 0 ? 0 : Math.ceil(e / t) * t;
		}
		case "FLOOR": {
			let e = X(i[0]), t = X(i[1]);
			return e > 0 && t < 0 ? Q("#NUM!") : t === 0 ? 0 : Math.floor(e / t) * t;
		}
		case "MOD": {
			let e = X(i[0]), t = X(i[1]);
			return t === 0 ? Q("#DIV/0!") : e - Math.floor(e / t) * t;
		}
		case "POWER": {
			let e = X(i[0]), t = X(i[1]);
			return e === 0 && t <= 0 ? Q("#DIV/0!") : Sr(e ** +t);
		}
		case "SQRT": {
			let e = X(i[0]);
			return e < 0 ? Q("#NUM!") : Math.sqrt(e);
		}
		case "ABS": return Math.abs(X(i[0]));
		case "SIGN": {
			let e = X(i[0]);
			return e > 0 ? 1 : e < 0 ? -1 : 0;
		}
		case "EXP": return Sr(Math.exp(X(i[0])));
		case "LN": {
			let e = X(i[0]);
			return e <= 0 ? Q("#NUM!") : Math.log(e);
		}
		case "LOG10": {
			let e = X(i[0]);
			return e <= 0 ? Q("#NUM!") : Math.log10(e);
		}
		case "MIN": {
			let e = Xn(i).filter((e) => typeof e == "number");
			return e.length ? Math.min(...e) : 0;
		}
		case "MAX": {
			let e = Xn(i).filter((e) => typeof e == "number");
			return e.length ? Math.max(...e) : 0;
		}
		case "SUM": return Xn(i).reduce((e, t) => e + (typeof t == "number" ? t : 0), 0);
		case "AVERAGE": {
			let e = Xn(i).filter((e) => typeof e == "number");
			return e.length ? e.reduce((e, t) => e + t, 0) / e.length : Q("#DIV/0!");
		}
		case "COUNT": return i.flatMap(qn).filter((e) => typeof e == "number").length;
		case "COUNTA": return i.flatMap(qn).filter((e) => e != null).length;
		case "COUNTBLANK": return i.flatMap(qn).filter((e) => e == null || e === "").length;
		case "COUNTIF": return Wr(qn(i[0]), i[1]);
		case "LEN": return Z(i[0]).length;
		case "LEFT": {
			let e = Z(i[0]), t = X(i[1] ?? 1);
			return t < 0 ? Q("#VALUE!") : e.slice(0, t);
		}
		case "RIGHT": {
			let e = Z(i[0]), t = X(i[1] ?? 1);
			return t < 0 ? Q("#VALUE!") : t >= e.length ? e : e.slice(e.length - t);
		}
		case "MID": {
			let e = Z(i[0]), t = X(i[1]), n = X(i[2]);
			return t < 1 || n < 0 ? Q("#VALUE!") : e.slice(t - 1, t - 1 + n);
		}
		case "UPPER": return Z(i[0]).toUpperCase();
		case "LOWER": return Z(i[0]).toLowerCase();
		case "TRIM": {
			let e = Z(i[0]).replace(/ +/g, " ");
			return e.slice(+!!e.startsWith(" "), e.endsWith(" ") ? e.length - 1 : e.length);
		}
		case "EXACT": return Z(i[0]) === Z(i[1]);
		case "FIND": {
			let e = Z(i[0]), t = Z(i[1]), n = X(i[2] ?? 1);
			if (n < 1) return Q("#VALUE!");
			let r = t.indexOf(e, n - 1);
			return r < 0 ? Q("#VALUE!") : r + 1;
		}
		case "SEARCH": {
			let e = Z(i[0]).toLowerCase(), t = Z(i[1]), n = t.toLowerCase(), r = X(i[2] ?? 1);
			if (r < 1 || t.length > 0 && Number.isInteger(r) && r > t.length) return Q("#VALUE!");
			let a = n.indexOf(e, r - 1);
			return a < 0 ? Q("#VALUE!") : a + 1;
		}
		case "CONCATENATE":
		case "CONCAT": return i.flatMap(qn).map((e) => Z(e)).join("");
		case "T": {
			let e = Yn(i[0]);
			return typeof e == "string" ? e : "";
		}
		case "N": {
			let e = Yn(i[0]);
			return typeof e == "number" ? e : typeof e == "boolean" ? +!!e : 0;
		}
		case "VALUE": return X(i[0]);
		case "TODAY": return Jr();
		case "NOW": return Yr();
		case "DATE": return Xr(X(i[0]), X(i[1]), X(i[2]));
		case "YEAR": return Qr(X(i[0])).y;
		case "MONTH": return Qr(X(i[0])).m;
		case "DAY": return Qr(X(i[0])).d;
		case "WEEKDAY": {
			let e = Zr(X(i[0])).getUTCDay(), t = X(i[1] ?? 1);
			return t === 2 ? e === 0 ? 7 : e : t === 3 ? e === 0 ? 6 : e - 1 : e + 1;
		}
		default: throw new Y("unsupported");
	}
}
function Ur(e, t) {
	if (!Number.isInteger(t)) throw new Y("unsupported");
	if (e === 0) return 0;
	let n = Math.max(-400, Math.min(400, t)), [r, i = "0"] = String(Math.abs(e)).split("e"), a = r.indexOf("."), o = r.replace(".", ""), s = (a === -1 ? r.length : a) + Number(i) + n;
	if (s >= o.length) return e;
	if (s < 0) return 0;
	let c = (s === 0 ? 0n : BigInt(o.slice(0, s))) + (o[s] >= "5" ? 1n : 0n), l = Number(`${c}e${-n}`);
	if (!Number.isFinite(l)) throw new Y("error", "#NUM!");
	return l === 0 ? 0 : Math.sign(e) * l;
}
function Wr(e, t) {
	let n = qr(t), r = 0;
	for (let t of e) n(t) && r++;
	return r;
}
function Gr(e, t, n) {
	let r = qr(t), i = n ?? e, a = 0;
	for (let t = 0; t < e.length; t++) if (r(e[t])) {
		let e = i[t];
		typeof e == "number" && (a += e);
	}
	return a;
}
function Kr(e, t, n) {
	let r = qr(t), i = n ?? e, a = 0, o = 0;
	for (let t = 0; t < e.length; t++) if (r(e[t])) {
		let e = i[t];
		if (e === null) continue;
		typeof e == "number" && (a += e), o++;
	}
	return o === 0 ? Q("#DIV/0!") : a / o;
}
function qr(e) {
	let t = Jn(e);
	if (t instanceof Kn) throw new Y("unsupported");
	if (typeof t != "string") {
		let e = typeof t == "number" ? t : null;
		return (n) => e !== null && typeof n == "number" ? n === e : n === t;
	}
	let n = t.match(/^(<=|>=|<>|<|>|=)(.*)$/), r = n ? n[1] : "=", i = n ? n[2] : t, a = i.trim() === "" ? NaN : parseFloat(i), o = !isNaN(a) && /^-?\d+(\.\d+)?$/.test(i.trim()), s = ur(i);
	return (e) => {
		if (o && typeof e == "number") switch (r) {
			case "<": return e < a;
			case ">": return e > a;
			case "<=": return e <= a;
			case ">=": return e >= a;
			case "<>": return e !== a;
			default: return e === a;
		}
		if (typeof e == "string" && (r === "=" || r === "<>")) {
			let t = ur(e) === s;
			return r === "=" ? t : !t;
		}
		let t = e == null ? "" : typeof e == "boolean" ? e ? "TRUE" : "FALSE" : e instanceof Kn ? e.code : String(e);
		switch (r) {
			case "<>": return t !== i;
			case "<": return t < i;
			case ">": return t > i;
			case "<=": return t <= i;
			case ">=": return t >= i;
			default: return t === i;
		}
	};
}
function Jr() {
	let e = /* @__PURE__ */ new Date();
	return d(new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate())), !1);
}
function Yr() {
	return d(new Date(Date.now()), !1);
}
function Xr(e, t, n) {
	return Math.floor(d(new Date(Date.UTC(e, t - 1, n)), !1));
}
function Zr(t) {
	return e(Math.floor(t), !1);
}
function Qr(e) {
	let t = Zr(e);
	return {
		y: t.getUTCFullYear(),
		m: t.getUTCMonth() + 1,
		d: t.getUTCDate()
	};
}
function $r(e, t, n) {
	for (let r of e) if (t >= r.top && t <= r.bottom && n >= r.left && n <= r.right) return !0;
	return !1;
}
function ei(e) {
	return e && e.value.type === "number" ? e.value.number : null;
}
function ti(e) {
	return e && e.value.type === "text" ? e.value.text : null;
}
function ni(e, t) {
	let n = [];
	for (let r of e.rows) for (let e of r.cells) e.value.type === "number" && $r(t, e.row, e.col) && n.push(e.value.number);
	return n;
}
function ri(e) {
	let t = e.value;
	if (t == null || t.trim() === "") return e.kind === "formula" ? "invalid" : void 0;
	let n = Hn(t);
	return typeof n == "number" ? n : "unsupported";
}
function ii(e, t) {
	let n = t.length ? Infinity : 0, r = t.length ? -Infinity : 0;
	for (let e of t) e < n && (n = e), e > r && (r = e);
	if (e.kind === "min") return n;
	if (e.kind === "max") return r;
	if (![
		"num",
		"formula",
		"percent",
		"percentile"
	].includes(e.kind)) return "unsupported";
	let i = ri(e);
	if (typeof i == "string") return i;
	switch (e.kind) {
		case "percent": {
			let e = i ?? 50;
			return n + (r - n) * (e / 100);
		}
		case "percentile": {
			if (!t.length) return 0;
			let e = [...t].sort((e, t) => e - t), n = (i ?? 50) / 100;
			return e[Math.max(0, Math.min(e.length - 1, Math.round(n * (e.length - 1))))];
		}
		default: return i ?? 0;
	}
}
function ai(e, t) {
	let n = !0;
	for (let r of t) r === "unsupported" ? (e.thresholdUnsupported = !0, n = !1) : r === "invalid" && (e.thresholdInvalid = !0, n = !1);
	return n ? t : void 0;
}
function oi(e, t = si(e)) {
	let n = [], r = /* @__PURE__ */ new Map();
	for (let t of e.definedNames ?? []) r.set(t.name, t);
	let i = e.conditionalFormats ?? [];
	for (let t of i) {
		let r = t.rules.some((e) => e.type !== "expression" && e.type !== "cellIs" && e.type !== "other" && !(e.type === "dataBar" && e.extThresholdFormula)) ? ni(e, t.sqref) : [];
		for (let e of t.rules) {
			let i = {
				rule: e,
				sqref: t.sqref
			};
			if (e.type === "colorScale") i.scaleStops = ai(i, e.stops.map((e) => ii(e, r)));
			else if (e.type === "dataBar") if (e.extThresholdFormula) i.thresholdUnsupported = !0;
			else {
				let t = ai(i, [ii(e.min, r), ii(e.max, r)]);
				t && (i.barMin = t[0], i.barMax = t[1]);
			}
			else if (e.type === "top10") {
				let t = [...r].sort((e, t) => e - t), n = t.length;
				if (n > 0) {
					let r = Math.min(e.rank, n);
					if (e.percent) {
						let a = e.top ? 1 - r / 100 : r / 100;
						i.top10Threshold = t[Math.max(0, Math.min(n - 1, Math.round(a * (n - 1))))];
					} else i.top10Threshold = e.top ? t[Math.max(0, n - r)] : t[Math.min(n - 1, r - 1)];
					i.top10IsTop = e.top;
				}
			} else if (e.type === "aboveAverage") {
				if (r.length > 0) {
					let t = r.reduce((e, t) => e + t, 0) / r.length;
					if (i.avgValue = t, i.avgIsAbove = e.aboveAverage, e.stdDev && e.stdDev > 0) {
						let e = r.reduce((e, n) => e + (n - t) * (n - t), 0) / r.length;
						i.avgStdDev = Math.sqrt(e);
					}
				}
			} else e.type === "iconSet" ? i.iconThresholds = ai(i, e.cfvos.map((e) => ii(e, r))) : e.type === "cellIs" && (i.cellIsOperands = e.formulas.map(ui));
			n.push(i);
		}
	}
	return n.sort((e, t) => (e.rule.priority ?? 0) - (t.rule.priority ?? 0)), {
		compiled: n,
		worksheet: e,
		cellIndex: t,
		definedNames: r
	};
}
function si(e) {
	return Ht(e.rows, {
		resource: "worksheet-cell-index",
		operation: "index-worksheet-cells",
		limit: ke(e).maxCoordinateIndexEntries
	});
}
var ci = new Set([
	"lessThan",
	"lessThanOrEqual",
	"equal",
	"notEqual",
	"greaterThanOrEqual",
	"greaterThan",
	"between",
	"notBetween",
	"containsText",
	"notContains",
	"beginsWith",
	"endsWith"
]);
function li(e, t, n) {
	switch (t) {
		case "greaterThan": return e > (n[0] ?? 0);
		case "greaterThanOrEqual": return e >= (n[0] ?? 0);
		case "lessThan": return e < (n[0] ?? 0);
		case "lessThanOrEqual": return e <= (n[0] ?? 0);
		case "equal": return e === (n[0] ?? 0);
		case "notEqual": return e !== (n[0] ?? 0);
		case "between": return e >= (n[0] ?? 0) && e <= (n[1] ?? 0);
		case "notBetween": return e < (n[0] ?? 0) || e > (n[1] ?? 0);
		default: return !1;
	}
}
function ui(e) {
	let t = Hn(e);
	return t === void 0 ? { formula: e } : { literal: t };
}
function di(e, t, n) {
	let r = n[0] ?? "", i = n[1] ?? "", a = (e) => e.toLowerCase();
	switch (t) {
		case "equal": return a(e) === a(r);
		case "notEqual": return a(e) !== a(r);
		case "containsText": return a(e).includes(a(r));
		case "notContains": return !a(e).includes(a(r));
		case "beginsWith": return a(e).startsWith(a(r));
		case "endsWith": return a(e).endsWith(a(r));
		case "between": return a(e) >= a(r) && a(e) <= a(i);
		case "notBetween": return a(e) < a(r) || a(e) > a(i);
		default: return !1;
	}
}
function fi(e, t, n) {
	let r = e.replace("#", ""), i = t.replace("#", ""), a = parseInt(r.slice(0, 2), 16), o = parseInt(r.slice(2, 4), 16), s = parseInt(r.slice(4, 6), 16), c = parseInt(i.slice(0, 2), 16), l = parseInt(i.slice(2, 4), 16), u = parseInt(i.slice(4, 6), 16), d = Math.round(a + (c - a) * n), f = Math.round(o + (l - o) * n), p = Math.round(s + (u - s) * n);
	return `#${d.toString(16).padStart(2, "0").toUpperCase()}${f.toString(16).padStart(2, "0").toUpperCase()}${p.toString(16).padStart(2, "0").toUpperCase()}`;
}
function pi(e, t, n) {
	if (!t.length) return "#FFFFFF";
	if (e <= n[0]) return t[0].color;
	if (e >= n[n.length - 1]) return t[t.length - 1].color;
	for (let r = 1; r < n.length; r++) if (e <= n[r]) {
		let i = n[r - 1], a = n[r], o = a === i ? 0 : (e - i) / (a - i);
		return fi(t[r - 1].color, t[r].color, o);
	}
	return t[t.length - 1].color;
}
function mi(e, t) {
	if (t && (t.fill && !e.fill && (e.fill = t.fill), t.font?.color && e.fontColor == null && (e.fontColor = t.font.color), e.fontBold ??= Ft(t, "bold"), e.fontItalic ??= Ft(t, "italic"), e.fontUnderline ??= Ft(t, "underline"), e.fontStrike ??= Ft(t, "strike"), t.numFmt && e.numFmt == null && (e.numFmt = {
		numFmtId: t.numFmt.numFmtId,
		formatCode: t.numFmt.formatCode || null
	}), t.border)) {
		let n = e.border ?? {};
		e.border = {
			left: n.left ?? t.border.left,
			right: n.right ?? t.border.right,
			top: n.top ?? t.border.top,
			bottom: n.bottom ?? t.border.bottom,
			diagonalUp: n.diagonalUp ?? t.border.diagonalUp,
			diagonalDown: n.diagonalDown ?? t.border.diagonalDown
		};
	}
}
function hi(e, t, n, r, i) {
	if (e == null) return "active";
	let a = t.sqref[0];
	if (!a) return "inactive";
	let o = Un(e, {
		row: n,
		col: r,
		anchorRow: a.top,
		anchorCol: a.left,
		cellIndex: i.cellIndex
	});
	return o.kind === "unsupported" ? "unsupported" : o.kind === "error" ? "inactive" : typeof o.value == "number" && o.value !== 0 ? "active" : "inactive";
}
function gi(e) {
	return e.thresholdUnsupported === !0 || e.thresholdInvalid === !0;
}
function _i(e, t, n, r, i) {
	let a = hi(t, e, n, r, i);
	return a === "unsupported" || a === "inactive" ? !1 : !gi(e);
}
function vi(e, t, n, r, i) {
	let a = {};
	if (!r.compiled.length) return a;
	for (let o of r.compiled) {
		if (!$r(o.sqref, t, n)) continue;
		let s = o.rule, c = ei(e), l = !1;
		if (s.type === "expression") {
			let e = o.sqref[0];
			if (!e) continue;
			l = er(tr(s.formula, {
				row: t,
				col: n,
				anchorRow: e.top,
				anchorCol: e.left,
				cellIndex: r.cellIndex,
				definedNames: r.definedNames,
				depth: 0
			})), l && mi(a, s.dxfId == null ? null : i[s.dxfId]);
		} else if (s.type === "cellIs") {
			let u = o.sqref[0];
			if (!u) continue;
			let d = o.cellIsOperands ?? [], f = s.operator === "between" || s.operator === "notBetween" ? 2 : 1;
			if (!(!ci.has(s.operator) || d.length < f)) {
				let i = [], a = !0;
				for (let e of d) {
					if ("literal" in e) {
						i.push(e.literal);
						continue;
					}
					let o = Un(e.formula, {
						row: t,
						col: n,
						anchorRow: u.top,
						anchorCol: u.left,
						cellIndex: r.cellIndex
					});
					if (o.kind === "value") {
						i.push(o.value);
						continue;
					}
					a = !1;
					break;
				}
				let o = ti(e);
				a && (c != null && i.every((e) => typeof e == "number") ? l = li(c, s.operator, i) : o != null && i.every((e) => typeof e == "string") && (l = di(o, s.operator, i)));
			}
			l && mi(a, s.dxfId == null ? null : i[s.dxfId]);
		} else if (s.type === "top10") {
			if (c == null || o.top10Threshold == null) continue;
			l = o.top10IsTop ? c >= o.top10Threshold : c <= o.top10Threshold, l && mi(a, s.dxfId == null ? null : i[s.dxfId]);
		} else if (s.type === "aboveAverage") {
			if (c == null || o.avgValue == null) continue;
			let e = o.avgStdDev == null ? 0 : o.avgStdDev * (s.stdDev ?? 1), t = o.avgIsAbove ? o.avgValue + e : o.avgValue - e, n = s.equalAverage === !0;
			l = o.avgIsAbove ? n ? c >= t : c > t : n ? c <= t : c < t, l && mi(a, s.dxfId == null ? null : i[s.dxfId]);
		} else if (s.type === "iconSet") {
			if (c == null || !gi(o) && !o.iconThresholds?.length || !_i(o, s.activeFormula, t, n, r)) continue;
			let e = o.iconThresholds;
			if (!e?.length) continue;
			l = !0;
			let i = e.length, u = 0;
			for (let t = 1; t < i; t++) c >= e[t] && (u = t);
			if (s.reverse && (u = i - 1 - u), s.customIcons && s.customIcons[u]) {
				let e = s.customIcons[u];
				e.iconSet !== "NoIcons" && (a.iconSet = {
					name: e.iconSet,
					index: e.iconId
				});
			} else a.iconSet = {
				name: s.iconSet,
				index: u
			};
		} else if (s.type === "colorScale") {
			if (c == null || !gi(o) && !o.scaleStops || !_i(o, s.activeFormula, t, n, r)) continue;
			let e = o.scaleStops;
			if (!e) continue;
			if (l = !0, !a.fill) {
				let t = pi(c, s.stops, e);
				a.fill = {
					patternType: "solid",
					fgColor: t,
					bgColor: t
				};
			}
		} else if (s.type === "dataBar") {
			if (c == null || !gi(o) && (o.barMin == null || o.barMax == null) || !_i(o, s.activeFormula, t, n, r)) continue;
			let e = o.barMin, i = o.barMax;
			if (e == null || i == null) continue;
			if (l = !0, !a.dataBar) {
				let t = i - e, n = t === 0 ? 0 : Math.max(0, Math.min(1, (c - e) / t));
				a.dataBar = {
					color: s.color,
					ratio: n,
					gradient: s.gradient
				};
			}
		}
		if (l && s.stopIfTrue) break;
	}
	return a;
}
function yi(e, t) {
	return e === 2 ? !0 : e === 1 ? !1 : tt(void 0, t) === "rtl";
}
function bi(e, t) {
	let n = e === 2 || u(t);
	return {
		needBidi: n,
		baseRtl: n && yi(e, t)
	};
}
var xi = (e, t) => ae(e, t);
function Si(e) {
	let t = /^\$?([A-Z]+)\$?(\d+)$/.exec(e.trim());
	if (!t) return null;
	let n = t[1], r = 0;
	for (let e = 0; e < n.length; e++) r = r * 26 + (n.charCodeAt(e) - 64);
	let i = parseInt(t[2], 10);
	return i < 1 || i > 1048576 || r > 16384 ? null : {
		row: i,
		col: r
	};
}
function Ci(e, t) {
	let n = "", r = t;
	for (; r > 0;) {
		let e = (r - 1) % 26;
		n = String.fromCharCode(65 + e) + n, r = Math.floor((r - 1) / 26);
	}
	return `${n}${e}`;
}
function wi(e, t, n, r, i, a = !1, o = (t, n, r) => e.fillText(t, n, r)) {
	let s = t.codePointAt(0) ?? 0, c = oe(s);
	if (a && Ce(s)) {
		e.save(), e.translate(n, r + i / 2), e.textAlign = "center", e.textBaseline = "middle", J(e, () => o(t, 0, 0)), e.restore();
		return;
	}
	if (c === "Tr") {
		let a = Se(s);
		if (a !== null) {
			o(String.fromCodePoint(a), n, r);
			return;
		}
		if (q(s)) {
			o(t, n, r);
			return;
		}
		e.save(), e.translate(n, r + i / 2), e.rotate(Math.PI / 2), e.textAlign = "center", e.textBaseline = "middle", o(t, 0, 0), e.restore();
		return;
	}
	let l = c === "Tu" ? we(s) : null;
	o(l === null ? t : String.fromCodePoint(l), n, r);
}
function Ti(e) {
	return e.editAs === "oneCell" && (e.nativeExtCx ?? 0) > 0 && (e.nativeExtCy ?? 0) > 0;
}
function Ei(e, t, n, r, i) {
	let a = t.offsetOf(e.fromCol + 1) + e.fromColOff * r / o, s = n.offsetOf(e.fromRow + 1) + e.fromRowOff * r / o, c = Di(e, i);
	if (c) return {
		x: a,
		y: s,
		width: c.cx * r / o,
		height: c.cy * r / o
	};
	let l = t.offsetOf(e.toCol + 1) + e.toColOff * r / o, u = n.offsetOf(e.toRow + 1) + e.toRowOff * r / o;
	return {
		x: a,
		y: s,
		width: l - a,
		height: u - s
	};
}
function Di(e, t) {
	return e.anchorTag === void 0 ? Ti(e) ? {
		cx: e.nativeExtCx,
		cy: e.nativeExtCy
	} : null : e.anchorTag === "oneCellAnchor" ? {
		cx: e.anchorExtCx ?? 0,
		cy: e.anchorExtCy ?? 0
	} : e.anchorTag === "twoCellAnchor" && e.editAs === "oneCell" && t !== void 0 ? {
		cx: t.cx,
		cy: t.cy
	} : null;
}
var Oi = [
	"fromCol",
	"fromColOff",
	"fromRow",
	"fromRowOff",
	"toCol",
	"toColOff",
	"toRow",
	"toRowOff"
], ki = Object.freeze([]), Ai = Object.freeze({
	cx: 0,
	cy: 0
}), ji = /* @__PURE__ */ new WeakMap(), Mi = /* @__PURE__ */ new WeakSet();
function Ni(e) {
	return e.anchorTag === "twoCellAnchor" && e.editAs === "oneCell";
}
function Pi(e) {
	let t, n = [e.images, e.shapeGroups];
	for (let e of n) for (let n of e ?? []) {
		if (!Ni(n)) continue;
		let e = n, r = 0;
		for (let t of [e.fromRow, e.toRow]) typeof t == "number" && Number.isFinite(t) && t >= 0 && (r = Math.max(r, Math.floor(t) + 1));
		t = Math.max(t ?? 0, r);
	}
	return t;
}
function Fi(e) {
	let t = e * o;
	return Number.isFinite(t) && t > 0 ? t : 0;
}
function Ii(e) {
	throw Error(`XLSX initial anchor size reference does not match this worksheet projection: ${e}`);
}
function Li(e, t, n = 1) {
	if (!Number.isFinite(n) || n <= 0) throw RangeError(`XLSX initial anchor size capture requires a finite positive scale: ${n}`);
	let r = e.images ?? ki, i = e.shapeGroups ?? ki, a, o;
	for (let e = 0; e < 2; e++) {
		let s = e === 0 ? "image" : "shape", c = e === 0 ? r : i;
		for (let e = 0; e < c.length; e++) {
			let r = c[e];
			if (!Ni(r)) continue;
			o ??= t.axesAtScale(n);
			let i = Ei(r, o.col, o.row, n);
			(a ??= []).push(Object.freeze({
				family: s,
				index: e,
				fromCol: r.fromCol,
				fromColOff: r.fromColOff,
				fromRow: r.fromRow,
				fromRowOff: r.fromRowOff,
				toCol: r.toCol,
				toColOff: r.toColOff,
				toRow: r.toRow,
				toRowOff: r.toRowOff,
				cx: Fi(i.width / n),
				cy: Fi(i.height / n)
			}));
		}
	}
	if (a) return Object.freeze({
		version: 1,
		imageCount: r.length,
		shapeGroupCount: i.length,
		entries: Object.freeze(a)
	});
}
function Ri(e, t) {
	Mi.has(t) && Ii("the reference was released");
	let n = ji.get(e);
	if (n) {
		if (n.reference === t && e.images === n.images && e.shapeGroups === n.shapeGroups) return;
		Ii("the projection is already bound to another reference");
	}
	(t.version !== 1 || !Array.isArray(t.entries)) && Ii("unsupported reference shape");
	let r = e.images ?? ki, i = e.shapeGroups ?? ki;
	(r.length !== t.imageCount || i.length !== t.shapeGroupCount) && Ii("anchor counts differ");
	let a = /* @__PURE__ */ new WeakMap();
	for (let e of t.entries) {
		let t = e.family === "image" ? r : e.family === "shape" ? i : ki, n = Number.isInteger(e.index) ? t[e.index] : void 0;
		(!n || !Ni(n) || a.has(n)) && Ii(`${e.family}[${e.index}] is not an eligible anchor`);
		for (let t of Oi) Object.is(n[t], e[t]) || Ii(`${e.family}[${e.index}].${t} differs`);
		(!Number.isFinite(e.cx) || !Number.isFinite(e.cy) || e.cx < 0 || e.cy < 0) && Ii(`${e.family}[${e.index}] has an invalid EMU size`), a.set(n, e);
	}
	let o = 0;
	for (let e of r) Ni(e) && o++;
	for (let e of i) Ni(e) && o++;
	o !== t.entries.length && Ii("an eligible anchor has no captured initial size");
	for (let e of t.entries) Object.freeze(e);
	Object.freeze(t.entries), Object.freeze(t), ji.set(e, {
		reference: t,
		images: e.images,
		shapeGroups: e.shapeGroups,
		sizes: a
	});
}
function zi(e, t) {
	if (!Ni(t)) return;
	let n = ji.get(e);
	if (n) return Mi.has(n.reference) || e.images !== n.images || e.shapeGroups !== n.shapeGroups ? Ai : n.sizes.get(t) ?? Ai;
}
function Bi(e, t, n, r, i) {
	return Ei(t, n, r, i, zi(e, t));
}
function Vi(e) {
	Mi.add(e);
}
var Hi = /* @__PURE__ */ new WeakMap();
function Ui(e) {
	Hi.delete(e);
}
function Wi(e, t, n) {
	let r = Hi.get(e);
	r || (r = /* @__PURE__ */ new Map(), Hi.set(e, r)), r.set(t, n);
}
function Gi(e, t, n) {
	return e !== void 0 && Hi.get(e)?.get(t) === n;
}
function Ki(e) {
	if (!Number.isFinite(e)) return [0, 1];
	let t = (e % 360 + 360) % 360;
	if (t === 0) return [0, 1];
	if (t === 90) return [1, 0];
	if (t === 180) return [0, -1];
	if (t === 270) return [-1, 0];
	let n = e * Math.PI / 180;
	return [Math.sin(n), Math.cos(n)];
}
function qi(e, t = 0) {
	let [n, r] = Ki(t);
	if (n === 0 && Math.abs(r) === 1) return e;
	let i = Math.abs(e.width * r) + Math.abs(e.height * n), a = Math.abs(e.width * n) + Math.abs(e.height * r);
	return {
		x: e.x + (e.width - i) / 2,
		y: e.y + (e.height - a) / 2,
		width: i,
		height: a
	};
}
function Ji(e, t, n = 0, r = !1, i = !1) {
	if (n === 0 && !r && !i) return e;
	let a = t.x + t.width / 2, o = t.y + t.height / 2, [s, c] = Ki(-n), l = e.x - a, u = e.y - o, d = a + l * c - u * s, f = o + l * s + u * c;
	return r && (d = 2 * a - d), i && (f = 2 * o - f), {
		x: d,
		y: f
	};
}
function Yi(e, t, n, r, i) {
	let a = x(e);
	if (!a || !(a.width > 0) || !(a.height > 0)) return null;
	let o = e, s = r / a.width, c = i / a.height;
	return {
		x: t - a.x * s,
		y: n - a.y * c,
		width: o.width * s,
		height: o.height * c
	};
}
function Xi(e, t, n, r, i, a) {
	let o = r * Math.PI / 180, s = Math.cos(o), c = Math.sin(o), l = Infinity, u = Infinity, d = -Infinity, f = -Infinity;
	for (let [r, o] of [
		[e.x, e.y],
		[e.x + e.width, e.y],
		[e.x, e.y + e.height],
		[e.x + e.width, e.y + e.height]
	]) {
		let e = (r - t) * (i ? -1 : 1), p = (o - n) * (a ? -1 : 1), m = t + e * s - p * c, h = n + e * c + p * s;
		l = Math.min(l, m), u = Math.min(u, h), d = Math.max(d, m), f = Math.max(f, h);
	}
	return {
		x: l,
		y: u,
		width: d - l,
		height: f - u
	};
}
function Zi(e, t, n) {
	if (!t) return e;
	if ("effects" in t) {
		let { widthPt: r, heightPt: i } = Qi(n);
		return JSON.stringify([
			"blip",
			e,
			se(t),
			r,
			i
		]);
	}
	return `${e}|duo:${t.clr1}:${t.clr2}`;
}
function Qi(e) {
	if (!(e && Number.isFinite(e.cx) && Number.isFinite(e.cy) && e.cx > 0 && e.cy > 0)) return {
		widthPt: 0,
		heightPt: 0
	};
	let t = i(e.cx / 12700, e.cy / 12700, e.srcRect, null);
	return {
		widthPt: t.width,
		heightPt: t.height
	};
}
function $i(e) {
	let t = e.nativeExtCx > 0 && e.nativeExtCy > 0;
	return {
		cx: t ? e.nativeExtCx : e.anchorExtCx ?? 0,
		cy: t ? e.nativeExtCy : e.anchorExtCy ?? 0,
		srcRect: e.srcRect ?? null,
		rotation: e.rotation ?? 0,
		flipH: e.flipH ?? !1,
		flipV: e.flipV ?? !1
	};
}
function ea(e, t) {
	return {
		cx: e.nativeExtCx * t.w,
		cy: e.nativeExtCy * t.h,
		srcRect: t.geom.type === "image" ? t.geom.srcRect ?? null : null,
		rotation: t.rot,
		flipH: t.flipH,
		flipV: t.flipV
	};
}
function ta(e, t) {
	return e.blipEffects?.length ? {
		effects: e.blipEffects,
		duotone: e.duotone ?? null,
		hostRotation: t?.rotation ?? 0,
		hostFlipH: t?.flipH ?? !1,
		hostFlipV: t?.flipV ?? !1
	} : e.duotone ?? null;
}
var na = I.map((e) => `"${e}"`).join(", "), ra = w.map((e) => `"${e}"`).join(", "), ia = `"Calibri", Arial, ${na}, sans-serif`, aa = `"Calibri", "Carlito", Arial, ${na}, sans-serif`, oa = `Arial, Helvetica, "Liberation Sans", ${na}, sans-serif`, sa = `"Times New Roman", "Liberation Serif", ${ra}, serif`, ca = `"Carlito", ${oa}`, la = `"Caladea", ${sa}`, ua = /* @__PURE__ */ new WeakMap(), da = /* @__PURE__ */ new WeakMap(), fa = /* @__PURE__ */ new WeakMap(), pa = /* @__PURE__ */ new WeakMap(), ma = /* @__PURE__ */ new WeakMap(), ha = /* @__PURE__ */ new WeakMap(), ga = /* @__PURE__ */ new WeakMap(), _a = /* @__PURE__ */ new WeakMap(), va = /* @__PURE__ */ new WeakMap();
function ya(e, t) {
	let n = ot(t), r = va.get(t);
	(!r || r.japanese !== n || r.themeJapaneseMajorFont !== t.themeJapaneseMajorFont || r.themeJapaneseMinorFont !== t.themeJapaneseMinorFont) && (r = {
		themeJapaneseMajorFont: t.themeJapaneseMajorFont,
		themeJapaneseMinorFont: t.themeJapaneseMinorFont,
		japanese: n,
		cache: /* @__PURE__ */ new Map()
	}, st(t, r), va.set(t, r)), _a.set(e, r);
}
function ba(e, t, n, r, i, a = /* @__PURE__ */ new Map()) {
	let o = e.defaultFontFamily ? dt({
		family: e.defaultFontFamily,
		weight: e.defaultFontBold ? 700 : 400,
		style: e.defaultFontItalic ? "italic" : "normal"
	}) : null, s = o === null || !t ? void 0 : c(t, o), l = {
		tupleKey: o,
		route: s,
		hasDeclaredFace: e.defaultFontFamily ? Fa(e.defaultFontFamily, n) : !1,
		canvasMdw: i && e.defaultFontFamily && e.defaultFontSize ? Na(e.defaultFontFamily, e.defaultFontSize, s, r, e.defaultFontBold ? 700 : 400, e.defaultFontItalic ? "italic" : "normal", i, a.get(e.defaultFontFamily.trim().toLocaleLowerCase("en-US"))) : void 0
	}, u = fa.get(e);
	(!u || u.tupleKey !== l.tupleKey || u.route !== l.route || u.hasDeclaredFace !== l.hasDeclaredFace || u.canvasMdw !== l.canvasMdw) && Xe.invalidate(e), fa.set(e, l);
}
function xa(e, t, n, r = !1) {
	ya(e, t), (da.get(t) !== n || ma.get(t) !== r) && Xe.invalidate(t), pa.set(e, r);
	let i = (re(e.canvas) ? e.canvas.ownerDocument?.fonts : void 0) ?? fe(), a = r ? f(i, St) : /* @__PURE__ */ new Map();
	ha.set(e, a), ga.set(t, a), ba(t, n, i, r, e, a), ma.set(t, r), n ? (ua.set(e, n), da.set(t, n)) : (ua.delete(e), da.delete(t));
}
function Sa(e, t) {
	return t ? ha.get(e)?.get(t.trim().toLocaleLowerCase("en-US")) : void 0;
}
function Ca(e, t, n = !1) {
	(da.get(e) !== t || ma.get(e) !== n) && Xe.invalidate(e), t ? da.set(e, t) : da.delete(e), ma.set(e, n);
	let r = fe(), i = n ? f(r, St) : /* @__PURE__ */ new Map();
	ga.set(e, i), ba(e, t, r, n, void 0, i);
}
function wa(e, t, n = !1, r = !1) {
	let i = dt({
		family: t?.trim() || "Calibri",
		weight: n ? 700 : 400,
		style: r ? "italic" : "normal"
	}), a = ua.get(e);
	return a ? c(a, i) : void 0;
}
function Ta(e, t) {
	if (t !== void 0) {
		if (!Number.isFinite(t) || t <= 0) throw Error("XLSX maximum digit width must be a finite positive number");
		Xe.forWorksheet(e, t);
	}
}
var Ea = "\"Courier New\", \"Liberation Mono\", monospace";
function Da(e, t, n = !1, i = "") {
	let a = e?.trim() || null, o = a ? D(a) : null, s = b(a), c = (e, n = !0) => {
		let a = [...n && t ? M(t, s === "serif" ? "serif" : "sans") : [], ...h(i) ? r(s === "serif") : []];
		if (a.length === 0) return e;
		let o = e.lastIndexOf(",");
		return `${e.slice(0, o)}, ${a.map((e) => `"${e}"`).join(", ")}${e.slice(o)}`;
	};
	if (!o) return c(a ? a.toLowerCase() === "calibri" ? n ? ca : oa : a.toLowerCase() === "cambria" ? n ? la : sa : s === "serif" ? sa : s === "mono" ? Ea : oa : n ? aa : ia);
	let l = s === "serif", u = ne(a), d = [...u ? [u] : [], ...M(o, l ? "serif" : "sans").filter((e) => e !== u)].map((e) => `"${e}"`).join(", ");
	return c(`${d ? `${d}, ` : ""}${l ? sa : oa}`, !1);
}
function Oa(e, t, n = "", r, i = !1, a, o) {
	let s = e?.trim(), c = L(n) ? t : void 0, l = r && (s?.toLocaleLowerCase("en-US") || "calibri") === r.requestedFamily.trim().toLocaleLowerCase("en-US") ? r : void 0, u = a && a.toLocaleLowerCase("en-US") !== s?.toLocaleLowerCase("en-US") ? `${p(a)}, ` : "", d = o && o.toLocaleLowerCase("en-US") !== s?.toLocaleLowerCase("en-US") ? `${p(o)}, ` : "";
	return l ? `${p(l.family)}, ${u}${d}${Da(s, c, i, n)}` : s ? `${p(s)}, ${u}${d}${Da(s, c, i, n)}` : Da(null, c, i, n);
}
var ka = 11;
function Aa(e, t, n) {
	return n - e - t;
}
function ja(e, t, n, r) {
	return r ? Aa(e, t, n) : e;
}
var Ma = "#7a7a7a";
function Na(e, t, n, r = !1, i = 400, a = "normal", o, c) {
	let l = t * s, u = o ? null : typeof OffscreenCanvas < "u" ? new OffscreenCanvas(1, 1) : typeof document < "u" ? document.createElement("canvas") : null, d = o ?? u?.getContext("2d");
	if (!d) return 8;
	let f = i !== 400 || a !== "normal" ? `${a} ${i} ` : "";
	o && d.save();
	try {
		d.font = `${f}${l}px ${Oa(e, void 0, "", n, r, void 0, c)}`;
		let t = 0;
		for (let e of "0123456789") {
			let n = d.measureText(e).width;
			n > t && (t = n);
		}
		return Pa(t);
	} finally {
		o && d.restore();
	}
}
function Pa(e) {
	return Math.round(e) || 8;
}
function Fa(e, t) {
	if (!t || typeof t[Symbol.iterator] != "function") return !1;
	let n = e.trim().toLocaleLowerCase("en-US");
	for (let e of t) if (e.family.trim().replace(/^(['"])(.*)\1$/u, "$2").toLocaleLowerCase("en-US") === n) return !0;
	return !1;
}
function Ia(e) {
	if (!e.defaultFontFamily || !e.defaultFontSize) return 8;
	let t = e.defaultFontBold ? 700 : 400, n = e.defaultFontItalic ? "italic" : "normal", r = dt({
		family: e.defaultFontFamily,
		weight: t,
		style: n
	}), i = da.get(e), a = i ? c(i, r) : void 0;
	return fa.get(e)?.canvasMdw ?? Na(e.defaultFontFamily, e.defaultFontSize, a, ma.get(e) === !0, t, n, void 0, ga.get(e)?.get(e.defaultFontFamily.trim().toLocaleLowerCase("en-US")));
}
function La(e) {
	return Xe.forWorksheetMeasured(e, () => Ia(e));
}
function Ra(e, t, n, r, i, a, o) {
	if (!(i <= 0 || a <= 0)) {
		if (o) {
			let a = e.createLinearGradient(n, r, n + i, r);
			a.addColorStop(0, S(t, .85)), a.addColorStop(1, S(t, .15)), e.fillStyle = a;
		} else e.fillStyle = S(t);
		e.fillRect(n, r, i, a);
	}
}
function za(e) {
	switch (e) {
		case "solid": return 1;
		case "darkGray": return .75;
		case "mediumGray": return .5;
		case "lightGray": return .25;
		case "gray125": return .125;
		case "gray0625": return .0625;
		case "darkHorizontal":
		case "darkVertical":
		case "darkDown":
		case "darkUp":
		case "darkGrid":
		case "darkTrellis": return .5;
		case "lightHorizontal":
		case "lightVertical":
		case "lightDown":
		case "lightUp":
		case "lightGrid":
		case "lightTrellis": return .25;
		default: return 1;
	}
}
var Ba = /* @__PURE__ */ new Map(), Va = {
	gray0625: [
		128,
		0,
		8,
		0,
		128,
		0,
		8,
		0
	],
	gray125: [
		136,
		0,
		34,
		0,
		136,
		0,
		34,
		0
	],
	lightGray: [
		170,
		0,
		85,
		0,
		170,
		0,
		85,
		0
	],
	mediumGray: [
		170,
		85,
		170,
		85,
		170,
		85,
		170,
		85
	],
	darkGray: [
		119,
		221,
		119,
		221,
		119,
		221,
		119,
		221
	],
	darkHorizontal: [
		4095,
		4095,
		0,
		4095,
		4095,
		0,
		4095,
		4095,
		0,
		4095,
		4095,
		0
	],
	lightHorizontal: [
		4095,
		0,
		0,
		4095,
		0,
		0,
		4095,
		0,
		0,
		4095,
		0,
		0
	],
	darkVertical: Array(12).fill(3510),
	lightVertical: Array(12).fill(2340),
	darkGrid: [
		204,
		204,
		51,
		51,
		204,
		204,
		51,
		51
	],
	lightGrid: [
		255,
		136,
		136,
		136,
		255,
		136,
		136,
		136
	],
	darkDown: [
		204,
		102,
		51,
		153,
		204,
		102,
		51,
		153
	],
	lightDown: [
		136,
		68,
		34,
		17,
		136,
		68,
		34,
		17
	],
	darkUp: [
		51,
		102,
		204,
		153,
		51,
		102,
		204,
		153
	],
	lightUp: [
		17,
		34,
		68,
		136,
		17,
		34,
		68,
		136
	],
	darkTrellis: [
		255,
		102,
		255,
		153,
		255,
		102,
		255,
		153
	],
	lightTrellis: [
		153,
		102,
		102,
		153,
		153,
		102,
		102,
		153
	]
};
function Ha(e, t, n, r) {
	let i = e.getTransform(), a = Math.max(1, Math.round(Math.hypot(i.a, i.b))), o = Math.max(1, Math.round(Math.hypot(i.c, i.d))), s = `${t}|${n}|${r}|${a}|${o}`;
	if (Ba.has(s)) return Ba.get(s);
	let l = c(Va, t);
	if (!l) return Ba.set(s, null), null;
	let u = l.length, d = N(u, u);
	if (!d) return Ba.set(s, null), null;
	let f = d.getContext("2d");
	if (!f) return Ba.set(s, null), null;
	f.fillStyle = S(r), f.fillRect(0, 0, u, u), f.fillStyle = S(n);
	for (let e = 0; e < u; e++) {
		let t = l[e];
		for (let n = 0; n < u; n++) t & 1 << u - 1 - n && f.fillRect(n, e, 1, 1);
	}
	let p = e.createPattern(d, "repeat");
	if (p && typeof DOMMatrix < "u" && (a >= 2 || o >= 2)) {
		let e = new DOMMatrix();
		e.scaleSelf(1 / a, 1 / o), p.setTransform(e);
	}
	return Ba.set(s, p), p;
}
function Ua(e, t, n, r, i, a) {
	if (t.gradient && t.gradient.stops.length > 0) return e.fillStyle = Wa(e, t.gradient, n, r, i, a), e.fillRect(n, r, i, a), !0;
	let o = t.patternType;
	if (!o || o === "none") return !1;
	let s = t.fgColor ?? "000000", c = t.bgColor ?? "FFFFFF";
	if (o === "solid") return e.fillStyle = S(s), e.fillRect(n, r, i, a), !0;
	let l = Ha(e, o, s, c);
	if (l) e.fillStyle = l;
	else {
		let t = za(o);
		e.fillStyle = t >= 1 ? S(s) : qa(s, c, t);
	}
	return e.fillRect(n, r, i, a), !0;
}
function Wa(e, t, n, r, i, a) {
	let o;
	if (t.gradientType === "path") {
		let s = n + i * (t.left + (1 - t.right - t.left) / 2), c = r + a * (t.top + (1 - t.bottom - t.top) / 2), l = Math.hypot(Math.max(s - n, n + i - s), Math.max(c - r, r + a - c));
		o = e.createRadialGradient(s, c, 0, s, c, l);
	} else {
		let s = t.degree * Math.PI / 180, c = n + i / 2, l = r + a / 2, u = (Math.abs(Math.cos(s)) * i + Math.abs(Math.sin(s)) * a) / 2;
		o = e.createLinearGradient(c - Math.cos(s) * u, l - Math.sin(s) * u, c + Math.cos(s) * u, l + Math.sin(s) * u);
	}
	for (let e of t.stops) {
		let t = Math.min(1, Math.max(0, e.position));
		o.addColorStop(t, S(e.color));
	}
	return o;
}
var Ga = Si;
function Ka(e, t, n, r, i) {
	let a = Math.max(4, Math.min(8, Math.min(r, i) * .18));
	e.save(), e.fillStyle = "#D40000", e.beginPath(), e.moveTo(t + r - a, n), e.lineTo(t + r, n), e.lineTo(t + r, n + a), e.closePath(), e.fill(), e.restore();
}
function qa(e, t, n) {
	let r = e.replace("#", ""), i = t.replace("#", ""), a = parseInt(r.slice(0, 2), 16), o = parseInt(r.slice(2, 4), 16), s = parseInt(r.slice(4, 6), 16), c = parseInt(i.slice(0, 2), 16), l = parseInt(i.slice(2, 4), 16), u = parseInt(i.slice(4, 6), 16), d = Math.min(1, Math.max(0, n));
	return `rgb(${Math.round(a * d + c * (1 - d))},${Math.round(o * d + l * (1 - d))},${Math.round(s * d + u * (1 - d))})`;
}
function $(e, t, n = 1) {
	return Math.round(e * s * n * t);
}
function Ja(e, t) {
	let n = {
		family: e.name,
		weight: e.bold ? 700 : 400
	};
	if (!ot(t)) return n;
	let r = Ya(e, t);
	if (!r) return n;
	let i = _(r, { source: "office-mac" }), a = new Set(i.map((e) => e.weight)), o = a.size === 1 ? i[0].weight : 400, s = !i.length || a.has(n.weight) ? n.weight : o, c = i.filter((e) => e.weight === s), l = c.filter((t) => t.style === (e.italic ? "italic" : "normal")), u = l.length ? l : c, d = new Set(u.flatMap((e) => e.aliases).filter((e) => /-(?:Regular|Bold|Italic|BoldItalic|Light|Medium)$/i.test(e)).map((e) => e.replace(/-(?:Regular|Bold|Italic|BoldItalic|Light|Medium)$/i, ""))), f = new Set(u.map((e) => e.family)), p = d.size === 1 ? [...d][0] : f.size === 1 ? [...f][0] : void 0;
	return {
		family: r,
		weight: s,
		...e.bold && (s === 300 || s === 400) && i.length ? { syntheticBold: !0 } : {},
		...p && p.toLocaleLowerCase("en-US") !== r.toLocaleLowerCase("en-US") ? { fallbackAlias: p } : {}
	};
}
function Ya(e, t) {
	return e.scheme === "major" ? t?.themeJapaneseMajorFont : e.scheme === "minor" ? t?.themeJapaneseMinorFont : void 0;
}
function Xa(e, t) {
	let n = t?.japanese && Ya(e, t);
	if (!t || !n) return {
		family: e.name,
		weight: e.bold ? 700 : 400
	};
	let r = `${e.scheme}:${+!!e.bold}:${+!!e.italic}`, i = t.cache.get(r);
	return i || (i = Ja(e, t), t.cache.size < 8 && t.cache.set(r, i)), i;
}
function Za(e, t, n, r, i, a = 1) {
	if (e.fillText(t, n, r), !i.bold) return;
	let o = _a.get(e);
	!o?.japanese || !Xa(i, o).syntheticBold || (e.save(), e.strokeStyle = e.fillStyle, e.lineWidth = Math.max(1, Math.round(i.size * s * a)) / 35, e.setLineDash([]), e.lineJoin = "miter", e.miterLimit = 10, e.strokeText(t, n, r), e.restore());
}
function Qa(e, t, n = 1, r, i = "") {
	let a = t.italic ? "italic " : "", o = Math.max(1, Math.round(t.size * s * n)), c = Xa(t, _a.get(e));
	return `${a}${c.weight === 400 ? "" : `${c.weight} `}${o}px ${Oa(c.family, r, i, wa(e, c.family, t.bold, t.italic), pa.get(e) === !0, c.fallbackAlias, Sa(e, c.family))}`;
}
function $a(e, t, n, r, i, a, o, s, c, l, u) {
	if (t.length === 0) return;
	let d = n?.fontId ?? 0, f = a.fonts[d] ?? a.fonts[0];
	if (!f) return;
	let p = n?.alignment ?? "left";
	e.save(), e.font = Qa(e, f, c, u, t.map((e) => e.text).join("")), e.textBaseline = "top", e.textAlign = "left", e.fillStyle = l;
	let m = s + Math.round(2 * c);
	if (p === "noControl") {
		let n = o;
		for (let r of t) Za(e, r.text, n, m, f, c), n += e.measureText(r.text).width;
		e.restore();
		return;
	}
	let h = on(t, r, o, p, (t) => eo(e, t, i));
	for (let t of h) {
		let n = e.measureText(t.text).width, r = [...t.text];
		if (t.spread === "distribute" && r.length > 1 && n < t.width) {
			let i = (t.width - n) / (r.length - 1);
			try {
				e.letterSpacing = `${i}px`;
			} catch {}
			Za(e, t.text, t.x, m, f, c);
			try {
				e.letterSpacing = "0px";
			} catch {}
		} else t.spread === "center" ? Za(e, t.text, t.x + (t.width - n) / 2, m, f, c) : Za(e, t.text, t.x, m, f, c);
	}
	e.restore();
}
function eo(e, t, n) {
	let r = e.font;
	e.font = n;
	let i = e.measureText(t).width;
	return e.font = r, i;
}
function to(e, t, n, r, i, a, o = 1) {
	if (e.save(), e.strokeStyle = i, e.lineWidth = .5, e.beginPath(), a) {
		let i = r - 1, a = r + 1, s = i + y(i, .5, o), c = a + y(a, .5, o);
		e.moveTo(t, s), e.lineTo(n, s), e.moveTo(t, c), e.lineTo(n, c);
	} else {
		let i = r + y(r, .5, o);
		e.moveTo(t, i), e.lineTo(n, i);
	}
	e.stroke(), e.restore();
}
function no(e, t) {
	let n = t.font;
	return n ? {
		bold: n.bold,
		italic: n.italic,
		underline: n.underline,
		underlineStyle: n.underlineStyle,
		strike: n.strike,
		size: n.size ?? e.size,
		color: n.color ?? null,
		name: n.name ?? e.name,
		vertAlign: n.vertAlign
	} : e;
}
function ro(e, t) {
	let n = e.cellXfs[t] ?? e.cellXfs[0] ?? {
		fontId: 0,
		fillId: 0,
		borderId: 0,
		numFmtId: 0,
		alignH: null,
		alignV: null,
		wrapText: !1
	};
	return {
		font: e.fonts[n.fontId] ?? {
			bold: !1,
			italic: !1,
			underline: !1,
			strike: !1,
			size: ka,
			color: null,
			name: null
		},
		fill: e.fills[n.fillId] ?? {
			patternType: "none",
			fgColor: null,
			bgColor: null
		},
		border: e.borders[n.borderId] ?? {
			left: null,
			right: null,
			top: null,
			bottom: null
		},
		xf: n
	};
}
function io(e, t) {
	let n = e.colStyleRanges ?? [];
	for (let e = n.length - 1; e >= 0; e--) {
		let r = n[e];
		if (t >= r.min && t <= r.max) return r.styleIndex;
	}
	return 0;
}
function ao(e, t, n) {
	return t?.styleIndex ?? io(e, n);
}
function oo(e, t, n, r) {
	let i = [];
	for (let a of t.split("\n")) i.push(...so(e, a, n, r));
	return i;
}
function so(e, t, n, r = (t) => e.measureText(t).width) {
	return jt(t, n, r);
}
function co(e, t, n, r, i, a) {
	return Mt(e, t, n, i, no, (t, n) => {
		e.font = Qa(e, po(t), r, a, n);
	}, ka);
}
function lo(e) {
	return e === "number" ? "right" : e === "bool" ? "center" : "left";
}
function uo(e, t, n) {
	return e === "middle" ? {
		underline: t + Math.round(n * .55),
		strike: t
	} : e === "bottom" ? {
		underline: t + 1,
		strike: t - Math.round(n * .35)
	} : {
		underline: t + n + 1,
		strike: t + Math.round(n * .5)
	};
}
function fo(e) {
	let { alignV: t, cy: n, cellH: r, paddingY: i } = e;
	return t === "top" ? {
		baseline: "top",
		textY: n + i
	} : t === "center" ? {
		baseline: "middle",
		textY: n + r / 2
	} : {
		baseline: "bottom",
		textY: n + r - i
	};
}
function po(e) {
	return e.vertAlign === "superscript" || e.vertAlign === "subscript" ? {
		...e,
		size: e.size * .65
	} : e;
}
function mo(e, t, n, r, i, a, o, s, c) {
	e.textAlign = "left", e.textBaseline = i;
	let l = s.needBidi ? xi(t, s.baseRtl ?? !1) : null, u = e, d = n;
	for (let n = 0; n < t.length; n++) {
		let f = l ? l.order[n] : n;
		if (l) try {
			u.direction = l.rtl[f] ? "rtl" : "ltr";
		} catch {}
		let p = t[f], m = po(p.font);
		e.font = Qa(e, m, a, c, p.text);
		let h = s.fontColor ?? p.font.color;
		e.fillStyle = h ? S(h) : "#000000";
		let g = $(p.font.size, a), _ = 0;
		p.font.vertAlign === "superscript" ? _ = -Math.round(g * .35) : p.font.vertAlign === "subscript" && (_ = Math.round(g * .1)), Za(e, p.text, d, r + _, m, a);
		let v = $(m.size, a);
		if (p.font.underline || p.font.strike) {
			let t = uo(i, r, v);
			if (p.font.underline) {
				let n = h ? S(h) : "#000000", r = p.font.underlineStyle === "double" || p.font.underlineStyle === "doubleAccounting";
				to(e, d, d + p.width, t.underline + _, n, r, o);
			}
			if (p.font.strike) {
				let n = t.strike + _, r = n + y(n, .5, o);
				e.save(), e.strokeStyle = h ? S(h) : "#000000", e.lineWidth = .5, e.beginPath(), e.moveTo(d, r), e.lineTo(d + p.width, r), e.stroke(), e.restore();
			}
		}
		d += p.width;
	}
	if (l) try {
		u.direction = "ltr";
	} catch {}
}
function ho(e, t, n, r, i, a, o, s, c) {
	let { alignH: l, cx: u, cellW: d, leftPad: f, paddingX: p } = n, m = t.reduce((e, t) => e + t.width, 0), h;
	h = l === "right" ? u + d - p - m : l === "center" ? u + d / 2 - m / 2 : u + f;
	let { needBidi: g, baseRtl: _ } = bi(a.readingOrder, t.map((e) => e.text).join(""));
	mo(e, t, h, o, s, r, i, {
		fontColor: a.fontColor,
		needBidi: g,
		baseRtl: _
	}, c);
}
function go(e, t, n, r, i, a, o, s, c, l) {
	ho(e, t.map((t) => {
		let r = no(n, t);
		return e.font = Qa(e, po(r), i, l, t.text), {
			text: t.text,
			font: r,
			width: e.measureText(t.text).width
		};
	}), r, i, a, o, s, c, l);
}
function _o(e, t, n, r, i, a, o = {}, s) {
	let { baseline: c, textY: l } = fo(r);
	go(e, t, n, r, i, a, o, l, c, s);
}
function vo(e, t, n, r, i, a, o = {}, s) {
	let { alignV: c, cy: l, cellH: u, paddingY: d } = r, f = Vo(t, n, i), p = f.reduce((e, t) => e + t.heightPx, 0), m;
	m = c === "top" ? l + d : c === "center" ? l + (u - p) / 2 : l + u - p - d;
	for (let t of f) t.runs.length > 0 && go(e, t.runs, n, r, i, a, o, m, "top", s), m += t.heightPx;
}
function yo(e, t, n, r, i, a, o, s) {
	let c = Math.max(0, t) + 3, l = Math.min(t + r, e.canvas.width) - 3 - c;
	if (l <= 0) return;
	let u = e.measureText("#").width, d = u > 0 ? Math.max(1, Math.floor(l / u)) : 1;
	e.textAlign = "left";
	let { baseline: f, textY: p } = fo({
		alignH: "left",
		alignV: a,
		cx: t,
		cy: n,
		cellW: r,
		cellH: i,
		leftPad: 3,
		paddingX: 3,
		paddingY: 2
	});
	e.textBaseline = f, Za(e, "#".repeat(d), c, p, o, s);
}
function bo(e, t, n, r, i, a, o = {}, s) {
	t.some((e) => e.text.includes("\n")) ? vo(e, t, n, r, i, a, o, s) : _o(e, t, n, r, i, a, o, s);
}
function xo(e, t, n, r, i, a) {
	let { alignV: o, cy: s, cellH: c, leftPad: l, paddingX: u, paddingY: d } = i, f = oo(e, t, i.cellW - l - u);
	if (f.length === 1) {
		let { baseline: t, textY: o } = fo(i);
		e.textBaseline = t, Za(e, f[0], n, o, r, a);
		return;
	}
	let p = $(r.size, a, 1.2), m = f.length * p, h;
	h = o === "top" ? s + d : o === "center" ? s + (c - m) / 2 : s + c - m - d, e.textBaseline = "top";
	for (let t = 0; t < f.length; t++) Za(e, f[t], n, h + t * p, r, a);
}
function So(e, t, n, r, i, a, o = {}, s) {
	let { alignH: c, alignV: l, cx: u, cy: d, cellW: f, cellH: p, leftPad: m, paddingX: h, paddingY: g } = r, _ = co(e, t, n, i, f - m - h, s);
	if (_.length === 1) {
		let { baseline: t, textY: n } = fo(r);
		ho(e, _[0].segments, r, i, a, o, n, t, s);
		return;
	}
	let v = _.reduce((e, t) => e + $(t.maxFontSize, i, 1.2), 0), y;
	y = l === "top" ? d + g : l === "center" ? d + (p - v) / 2 : d + p - v - g;
	let b = t.map((e) => e.text).join("").split("\n").map((e) => bi(o.readingOrder, e));
	for (let t of _) {
		let n = t.segments.reduce((e, t) => e + t.width, 0), r;
		r = c === "right" ? u + f - h - n : c === "center" ? u + f / 2 - n / 2 : u + m;
		let { needBidi: l, baseRtl: d } = b[t.para];
		mo(e, t.segments, r, y, "top", i, a, {
			fontColor: o.fontColor,
			needBidi: l,
			baseRtl: d
		}, s), y += $(t.maxFontSize, i, 1.2);
	}
}
function Co(e) {
	let t = "";
	for (; e > 0;) {
		let n = (e - 1) % 26;
		t = String.fromCharCode(65 + n) + t, e = Math.floor((e - 1) / 26);
	}
	return t;
}
var wo = [
	"#FF0000",
	"#FFFF00",
	"#00B050"
], To = [
	"#FF0000",
	"#FF6600",
	"#FFFF00",
	"#00B050"
], Eo = [
	"#FF0000",
	"#FF6600",
	"#FFFF00",
	"#92D050",
	"#00B050"
];
function Do(e, t, n, r, i, a) {
	if (t === "NoIcons") return;
	let o = t || "3TrafficLights1", s = parseInt(o[0]) || 3, c = s === 5 ? Eo : s === 4 ? To : wo, l = c[Math.max(0, Math.min(n, c.length - 1))];
	if (e.save(), e.fillStyle = l, o.includes("Arrow")) {
		let t = a / 2;
		e.beginPath(), n === s - 1 ? (e.moveTo(r + t, i), e.lineTo(r + a, i + a), e.lineTo(r, i + a)) : n === 0 ? (e.moveTo(r, i), e.lineTo(r + a, i), e.lineTo(r + t, i + a)) : (e.moveTo(r, i + a * .3), e.lineTo(r + a, i + t), e.lineTo(r, i + a * .7)), e.closePath(), e.fill();
	} else o === "3Signs" && n < 2 ? (e.beginPath(), n === 0 ? (e.moveTo(r + a / 2, i), e.lineTo(r + a, i + a / 2), e.lineTo(r + a / 2, i + a), e.lineTo(r, i + a / 2)) : (e.moveTo(r + a / 2, i), e.lineTo(r + a, i + a), e.lineTo(r, i + a)), e.closePath(), e.fill()) : o.includes("Flag") ? (e.beginPath(), e.moveTo(r, i), e.lineTo(r + a, i), e.lineTo(r, i + a), e.closePath(), e.fill()) : (e.beginPath(), e.arc(r + a / 2, i + a / 2, a / 2, 0, Math.PI * 2), e.fill());
	e.restore();
}
function Oo(e, t, n, r, i) {
	let a = Math.max(6, Math.round(Math.min(r, i) * .45)), o = t + r - a - 1, s = n + i - a - 1;
	e.save(), e.fillStyle = "#D0D0D0", e.fillRect(o, s, a, a), e.fillStyle = "#444444";
	let c = a * .55, l = o + (a - c) / 2, u = s + (a - c * .5) / 2;
	e.beginPath(), e.moveTo(l, u), e.lineTo(l + c, u), e.lineTo(l + c / 2, u + c * .5), e.closePath(), e.fill(), e.restore();
}
function ko(e) {
	let t = /* @__PURE__ */ new Map(), n = No(e, "worksheet-sparkline-index", "index-sparkline-coordinates");
	for (let r of e.sparklineGroups ?? []) {
		let e = Infinity, i = -Infinity;
		if (r.minAxisType === "group" || r.maxAxisType === "group") {
			for (let t of r.sparklines) for (let n of t.values) typeof n == "number" && (n < e && (e = n), n > i && (i = n));
			(!isFinite(e) || !isFinite(i)) && (e = 0, i = 1);
		}
		for (let a of r.sparklines) {
			let o = a.values.filter((e) => typeof e == "number"), s = o.length ? Math.min(...o) : 0, c = o.length ? Math.max(...o) : 1, l = r.minAxisType === "custom" && typeof r.manualMin == "number" ? r.manualMin : r.minAxisType === "group" ? e : s, u = r.maxAxisType === "custom" && typeof r.manualMax == "number" ? r.manualMax : r.maxAxisType === "group" ? i : c;
			Vt(t, `${a.row}:${a.col}`, {
				kind: r.kind,
				values: a.values,
				min: l,
				max: u,
				displayEmptyCellsAs: r.displayEmptyCellsAs === "zero" || r.displayEmptyCellsAs === "span" ? r.displayEmptyCellsAs : "gap",
				displayXAxis: r.displayXAxis,
				lineWeight: r.lineWeight,
				markers: r.markers,
				high: r.high,
				low: r.low,
				first: r.first,
				last: r.last,
				negative: r.negative,
				colorSeries: r.colorSeries,
				colorNegative: r.colorNegative,
				colorAxis: r.colorAxis,
				colorMarkers: r.colorMarkers,
				colorFirst: r.colorFirst,
				colorLast: r.colorLast,
				colorHigh: r.colorHigh,
				colorLow: r.colorLow
			}, n);
		}
	}
	return t;
}
function Ao(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g) {
	if (m <= 0 || h <= 0) return;
	let { styles: _, cellMap: v, mergeAnchorMap: b, mergeSkipSet: x, cfContext: C, cs: w, dpr: T } = t, E = i.length, D = a.length, O = new Set(s), k = new Set(o), A = (e, n) => t.rtl ? Aa(e, n, t.canvasW) : e, j = [], M = -c;
	for (let e = 0; e < E; e++) j.push(M), M += i[e];
	let N = [], P = -l;
	for (let e = 0; e < D; e++) N.push(P), P += a[e];
	e.save(), e.beginPath(), e.rect(A(f, m), p, m, h), e.clip();
	let ee = [], te = [], F = [];
	for (let i of t.worksheet.mergeCells ?? []) {
		let a = i.top, v = i.left;
		if (O.has(a) && k.has(v) || !s.some((e) => e >= i.top && e <= i.bottom) || !o.some((e) => e >= i.left && e <= i.right)) continue;
		let y = t.mergeAnchorMap.get(`${a}:${v}`);
		if (!y) continue;
		let b = u - c + t.colAxis.offsetOf(v) - t.colAxis.offsetOf(r), x = d - l + t.rowAxis.offsetOf(a) - t.rowAxis.offsetOf(n), E = y.totalW, D = y.totalH;
		if (b + E <= f || b >= f + m || x + D <= p || x >= p + h) continue;
		b = A(b, E);
		let j = `${a}:${v}`, M = t.cellMap.get(j), { font: N, fill: P, border: ee, xf: F } = ro(_, ao(t.worksheet, M, v)), I = vi(M, a, v, C, _.dxfs ?? []), L = I.fill ?? P, R = t.structuredStyleMap.get(j);
		if (!Ua(e, L, b, x, E, D) && R?.fill && Ua(e, R.fill, b, x, E, D), I.dataBar && I.dataBar.ratio > 0) {
			let t = Math.max(0, (E - 4) * I.dataBar.ratio);
			Ra(e, I.dataBar.color, b + 2, x + 2, t, D - 4, I.dataBar.gradient);
		}
		let z = Ts(ws(ee, a, v, y.right, y.bottom, t.cellMap, _), I.border);
		if (te.push(() => Ds(e, z, b, x, E, D, T)), !M) continue;
		let B = ln(M, _, I.numFmt, t.worksheet.date1904), V = B.text;
		if (!V || V === "0" && t.worksheet.showZeros === !1) continue;
		let ne = Bo(N, I, R);
		e.font = Qa(e, ne, w, g, V);
		let re = t.hyperlinkMap.get(j), H = Ro(R, F), U = re ? "#0563C1" : I.fontColor ?? B.color ?? H ?? N.color;
		e.fillStyle = U ? S(U) : "#000000";
		let W = F.alignH ?? lo(M.value.type), G = F.alignV ?? "bottom", K = F.indent ? Math.round(F.indent * 3 * t.mdw) : 0, ie = 3 + (W === "left" || !F.alignH ? K : 0);
		if (e.save(), e.beginPath(), e.rect(b, x, E, D), e.clip(), B.fill) {
			yo(e, b, x, E, D, G, ne, w), e.restore();
			continue;
		}
		let q;
		W === "right" ? (q = b + E - 3, e.textAlign = "right") : W === "center" ? (q = b + E / 2, e.textAlign = "center") : (q = b + ie, e.textAlign = "left");
		let ae = Io(R, F), oe = M.value.type === "text" ? M.value.runs : void 0, se = oe && zo(oe, ae), ce = ae == null ? ne : {
			...ne,
			color: ae
		}, le = se && se.length > 0;
		if (F.wrapText && le) So(e, se, ce, {
			alignH: W,
			alignV: G,
			cx: b,
			cy: x,
			cellW: E,
			cellH: D,
			leftPad: ie,
			paddingX: 3,
			paddingY: 2
		}, w, T, {
			fontColor: I.fontColor,
			readingOrder: F.readingOrder
		}, g);
		else if (F.wrapText) xo(e, V, q, ne, {
			alignH: W,
			alignV: G,
			cx: b,
			cy: x,
			cellW: E,
			cellH: D,
			leftPad: ie,
			paddingX: 3,
			paddingY: 2
		}, w);
		else if (le) bo(e, se, ce, {
			alignH: W,
			alignV: G,
			cx: b,
			cy: x,
			cellW: E,
			cellH: D,
			leftPad: ie,
			paddingX: 3,
			paddingY: 2
		}, w, T, {
			fontColor: I.fontColor,
			readingOrder: F.readingOrder
		}, g);
		else {
			let { baseline: t, textY: n } = fo({
				alignH: W,
				alignV: G,
				cx: b,
				cy: x,
				cellW: E,
				cellH: D,
				leftPad: ie,
				paddingX: 3,
				paddingY: 2
			});
			e.textBaseline = t, Za(e, V, q, n, ne, w);
		}
		e.restore();
	}
	for (let n = 0; n < D; n++) {
		let r = s[n], c = d + N[n], l = a[n];
		if ((c + l <= p || c >= p + h) && !o.some((e) => {
			let t = b.get(`${r}:${e}`);
			return t != null && c + t.totalH > p && c < p + h;
		})) continue;
		let D = /* @__PURE__ */ new Set(), O = /* @__PURE__ */ new Set(), k = -1, M = (e) => {
			if (k >= 0 && e - k >= 2) {
				for (let t = k; t < e - 1; t++) D.add(t);
				for (let t = k + 1; t < e; t++) O.add(t);
			}
			k = -1;
		};
		for (let e = 0; e <= E; e++) {
			let n = !1, i = !1;
			if (e < E && o[e] <= t.selectionLastCol) {
				let a = `${r}:${o[e]}`;
				if (!x.has(a) && !b.has(a)) {
					let r = v.get(a);
					n = ro(_, ao(t.worksheet, r, o[e])).xf.alignH === "centerContinuous", i = !!(r && r.value && r.value.type !== "empty");
				}
			}
			n ? i && k >= 0 && e > k ? (M(e), k = e) : k < 0 && (k = e) : M(e);
		}
		let P = !0;
		for (let a = 0; a < E; a++) {
			let s = o[a], d = u + j[a], k = i[a], M = s === t.firstViewportCol && P, N = `${r}:${s}`;
			if (x.has(N)) {
				P = d + k <= f || d >= f + m;
				continue;
			}
			let I = b.get(N), L = I ? I.totalW : k, R = I ? I.totalH : l, z = d + L <= f || d >= f + m;
			if (c + R <= p || c >= p + h || z && !t.overflowTextAnchors.has(N)) {
				P = !0;
				continue;
			}
			P = !1;
			let B = A(d, L), V = v.get(N), { font: ne, fill: re, border: H, xf: U } = ro(_, ao(t.worksheet, V, s)), W = vi(V, r, s, C, _.dxfs ?? []), G = Ua(e, W.fill ?? re, B, c, L, R), K = t.structuredStyleMap.get(N);
			if (!G && K?.fill && (G = Ua(e, K.fill, B, c, L, R)), t.commentCells.has(N) && Ka(e, B, c, L, R), W.dataBar && W.dataBar.ratio > 0) {
				let t = Math.max(0, (L - 4) * W.dataBar.ratio);
				Ra(e, W.dataBar.color, B + 2, c + 2, t, R - 4, W.dataBar.gradient);
			}
			let ie = t.sparklineMap.get(N);
			if (ie && Ze(e, {
				x: B,
				y: c,
				w: L,
				h: R
			}, ie), t.worksheet.isChartSheet !== !0 && t.worksheet.showGridlines !== !1 && !G) {
				if (e.strokeStyle = "#d0d0d0", e.lineWidth = .5, e.beginPath(), !D.has(a)) {
					let t = B + L + y(B + L, .5, T);
					e.moveTo(t, c), e.lineTo(t, c + R);
				}
				let t = c + R + y(c + R, .5, T);
				if (e.moveTo(B, t), e.lineTo(B + L, t), n === 0) {
					let t = c + y(c, .5, T);
					e.moveTo(B, t), e.lineTo(B + L, t);
				}
				if (M) {
					let t = B + y(B, .5, T);
					e.moveTo(t, c), e.lineTo(t, c + R);
				}
				e.stroke();
			}
			let q = Ts(I ? ws(H, r, s, I.right, I.bottom, v, _) : H, W.border);
			K && (q = {
				...q,
				top: q.top?.style ? q.top : K.top ?? q.top,
				bottom: q.bottom?.style ? q.bottom : K.bottom ?? q.bottom,
				left: q.left?.style ? q.left : K.left ?? q.left,
				right: q.right?.style ? q.right : K.right ?? q.right
			}), (D.has(a) || O.has(a)) && (q = {
				...q,
				left: O.has(a) ? null : q.left,
				right: D.has(a) ? null : q.right
			});
			let ae = v.get(`${r - 1}:${s}`), oe = ae ? ro(_, ao(t.worksheet, ae, s)).border.bottom : null;
			if (oe?.style && (n === 0 || q.top?.style) && (q = {
				...q,
				top: js(q.top, oe)
			}), !O.has(a)) {
				let e = v.get(`${r}:${s - 1}`), n = e ? ro(_, ao(t.worksheet, e, s - 1)).border.right : null;
				n?.style && (M || q.left?.style) && (q = {
					...q,
					left: js(q.left, n)
				});
			}
			let se = t.autoFilterCells.has(N), ce = () => {
				se && Oo(e, B, c, k, R);
			};
			if (I) {
				let t = q;
				te.push(() => Ds(e, t, B, c, L, R, T)), ce();
			} else {
				let t = q;
				F.push(() => {
					Ds(e, t, B, c, L, R, T), ce();
				});
			}
			if (!V) continue;
			let le = ln(V, _, W.numFmt, t.worksheet.date1904), J = le.text;
			!J || J === "0" && t.worksheet.showZeros === !1 || ee.push(() => {
				let n = Bo(ne, W, K);
				e.font = Qa(e, n, w, g, J);
				let l = t.hyperlinkMap.get(N), u = Ro(K, U), f = l ? "#0563C1" : W.fontColor ?? le.color ?? u ?? ne.color;
				e.fillStyle = f ? S(f) : "#000000";
				let p = V.value.type === "number", m = U.alignH ?? lo(V.value.type), h = U.alignV ?? "bottom", C = U.indent ? Math.round(U.indent * 3 * t.mdw) : 0, D = W.iconSet ? Math.max(8, Math.round(Math.min(L, R) * .55)) : 0, O = D > 0 ? D + 4 : 0, k = 3 + (m === "left" || !U.alignH ? C : 0) + O, j = L, M = a;
				if (m === "centerContinuous" && !I) for (let e = a + 1; e < E && o[e] <= t.selectionLastCol; e++) {
					let n = `${r}:${o[e]}`;
					if (x.has(n) || b.has(n)) break;
					let a = v.get(n);
					if (a && a.value.type !== "empty" || ro(_, ao(t.worksheet, a, o[e])).xf.alignH !== "centerContinuous") break;
					j += i[e], M = e;
				}
				let P = t.rtl ? B - (j - L) : B, ee = m === "centerContinuous" ? P : B, te = m === "centerContinuous" ? j : L, F = J.includes("\n");
				if (!I && !U.wrapText && !U.textRotation && !p && !F) {
					let n = e.measureText(J).width, s = m === "centerContinuous", c = s ? n + 6 : n + k + 3, l = s ? j : L;
					if (c > l) {
						let e = c - l, n = 0, u = 0;
						m === "right" ? u = e : m === "center" || s ? (u = e / 2, n = e / 2) : n = e;
						let d = t.rtl ? -1 : 1, f = t.rtl ? a - 1 : M + 1, p = t.rtl ? 1 : -1, h = t.rtl ? M + 1 : a - 1;
						if (n > 0) {
							let e = n;
							for (let t = f; t >= 0 && t < E && e > 0; t += d) {
								let n = `${r}:${o[t]}`;
								if (x.has(n) || b.has(n)) break;
								let a = v.get(n);
								if (a && a.value.type !== "empty") break;
								te += i[t], e -= i[t];
							}
						}
						if (u > 0) {
							let e = u;
							for (let t = h; t >= 0 && t < E && e > 0; t += p) {
								let n = `${r}:${o[t]}`;
								if (x.has(n) || b.has(n)) break;
								let a = v.get(n);
								if (a && a.value.type !== "empty") break;
								ee -= i[t], te += i[t], e -= i[t];
							}
						}
					}
				}
				let z = J, re = 0;
				if (m === "fill" && !p && J.length > 0) {
					let t = Math.max(1, L - 6), n = e.measureText(J).width;
					if (n > 0 && n < t) {
						let e = Math.max(1, Math.floor(t / n));
						z = J.repeat(e);
					}
				}
				if (m === "distributed" || m === "justify" && !U.wrapText && !F) {
					let t = Math.max(1, L - 6), n = e.measureText(z).width, r = Math.max(1, [...z].length - 1);
					n < t && (re = Math.max(0, (t - n) / r));
				}
				let H, G;
				m === "right" ? (H = B + L - 3, G = "right") : m === "center" ? (H = B + L / 2, G = "center") : m === "centerContinuous" ? (H = P + j / 2, G = "center") : m === "distributed" || m === "justify" && !U.wrapText && !F ? (H = B + 3, G = "left") : (H = B + k, G = "left");
				let ie = U.textRotation ?? 0, q = ie === 255, ae = ie > 0 && ie !== 255;
				if (W.iconSet && D > 0 && (e.save(), e.beginPath(), e.rect(B, c, L, R), e.clip(), Do(e, W.iconSet.name, W.iconSet.index, B + 2, c + (R - D) / 2, D), e.restore()), e.save(), e.beginPath(), e.rect(ee, c, te, R), e.clip(), le.fill) {
					yo(e, B, c, L, R, h, n, w), e.restore();
					return;
				}
				if (q) {
					let t = $(ne.size, w, 1.1), r = [...J].length * t, i = h === "top" ? c + 2 : h === "center" ? c + (R - r) / 2 : c + R - r - 2;
					e.textAlign = "center", e.textBaseline = "top";
					let a = (t, r, i) => Za(e, t, r, i, n, w);
					for (let n of J) {
						let r = n.codePointAt(0) ?? 0, o = Ce(r) && ue(e, r);
						wi(e, n, B + L / 2, i, t, o, a), i += t;
					}
					e.restore();
					return;
				}
				if (ae) {
					let t = ie <= 90 ? -(ie * Math.PI / 180) : (ie - 90) * Math.PI / 180;
					e.translate(B + L / 2, c + R / 2), e.rotate(t), e.textAlign = "center", e.textBaseline = "middle", Za(e, J, 0, 0, n, w), e.restore();
					return;
				}
				if (U.shrinkToFit) {
					let t = e.measureText(J).width, n = L - k - 3;
					if (t > n && t > 0) {
						let r = n / t, i = m === "right" ? B + L - 3 : m === "center" ? B + L / 2 : B + k;
						e.transform(r, 0, 0, 1, i * (1 - r), 0);
					}
				}
				if (e.textAlign = G, re > 0) try {
					e.letterSpacing = `${re}px`;
				} catch {}
				try {
					e.direction = yi(U.readingOrder, J) ? "rtl" : "ltr";
				} catch {}
				let oe = Io(K, U), se = V.value.type === "text" ? V.value.runs : void 0, ce = se && zo(se, oe), de = oe == null ? n : {
					...n,
					color: oe
				}, fe = ce && ce.length > 0;
				if (U.wrapText && fe) So(e, ce, de, {
					alignH: m,
					alignV: h,
					cx: B,
					cy: c,
					cellW: L,
					cellH: R,
					leftPad: k,
					paddingX: 3,
					paddingY: 2
				}, w, T, {
					fontColor: W.fontColor,
					readingOrder: U.readingOrder
				}, g);
				else if (U.wrapText) xo(e, J, H, n, {
					alignH: m,
					alignV: h,
					cx: B,
					cy: c,
					cellW: L,
					cellH: R,
					leftPad: k,
					paddingX: 3,
					paddingY: 2
				}, w);
				else if (fe) bo(e, ce, de, {
					alignH: m,
					alignV: h,
					cx: B,
					cy: c,
					cellW: L,
					cellH: R,
					leftPad: k,
					paddingX: 3,
					paddingY: 2
				}, w, T, {
					fontColor: W.fontColor,
					readingOrder: U.readingOrder
				}, g);
				else {
					let t = n.vertAlign, r = $(ne.size, w), i = 0;
					t === "superscript" ? i = -Math.round(r * .35) : t === "subscript" && (i = Math.round(r * .1));
					let a = t ? {
						...n,
						size: n.size * .65
					} : n;
					t && (e.font = Qa(e, a, w, g, J));
					let o = null, s = () => o ??= e.measureText(J), u = () => {
						let e = Math.min(s().width, te - k - 3);
						return {
							x: m === "right" ? B + L - 3 - e : m === "center" ? B + L / 2 - e / 2 : B + k,
							width: e
						};
					}, d = $(a.size, w);
					if (n.underline || l) {
						let { x: t, width: r } = u(), a = (h === "top" ? c + 2 + d + 1 : h === "center" ? c + R / 2 + Math.round(d * .55) : c + R - 2 + 1) + i, o = l ? "#0563C1" : f ? S(f) : "#000000", s = n.underlineStyle === "double" || n.underlineStyle === "doubleAccounting";
						to(e, t, t + r, a, o, s, T);
					}
					if (n.strike) {
						let { x: t, width: n } = u(), r = (h === "top" ? c + 2 + Math.round(d * .5) : h === "center" ? c + R / 2 : c + R - 2 - Math.round(d * .35)) + i, a = r + y(r, .5, T);
						e.save(), e.strokeStyle = f ? S(f) : "#000000", e.lineWidth = .5, e.beginPath(), e.moveTo(t, a), e.lineTo(t + n, a), e.stroke(), e.restore();
					}
					if (J.includes("\n")) {
						let t = J.split("\n"), n = $(ne.size, w, 1.2), r = t.length * n, o;
						h === "top" ? (o = c + 2, e.textBaseline = "top") : h === "center" ? (o = c + (R - r) / 2, e.textBaseline = "top") : (o = c + R - r - 2, e.textBaseline = "top");
						for (let r = 0; r < t.length; r++) Za(e, t[r], H, o + r * n + i, a, w);
					} else {
						let { baseline: t, textY: n } = fo({
							alignH: m,
							alignV: h,
							cx: B,
							cy: c,
							cellW: L,
							cellH: R,
							leftPad: k,
							paddingX: 3,
							paddingY: 2
						});
						e.textBaseline = t, Za(e, z, H, n + i, a, w);
					}
				}
				let pe = V.value.type === "text" ? V.value.phoneticRuns : void 0;
				if (V.showPhonetic && pe && pe.length > 0 && !J.includes("\n")) {
					let t = Qa(e, n, w, g, J), r = eo(e, J, t), i;
					i = m === "right" ? B + L - 3 - r : m === "center" ? B + L / 2 - r / 2 : B + k;
					let a = f ? S(f) : "#000000";
					$a(e, pe, V.value.type === "text" ? V.value.phoneticPr : void 0, J, t, _, i, c, w, a, g);
				}
				if (e.restore(), J && t.textRuns) {
					let e = s >= t.textRunPane.first && s <= t.textRunPane.last, n = e ? t.textRuns.owned : t.textRuns.foreign;
					n.has(N) || n.set(N, {
						sheetName: t.worksheet.name,
						cellRef: Ci(r, s),
						text: J,
						x: e ? B : A(d + t.textRunPane.ownerShiftX, L),
						y: c,
						width: L,
						height: R,
						row: r,
						col: s
					});
				}
			});
		}
	}
	for (let e of F) e();
	for (let e of te) e();
	for (let e of ee) e();
	e.restore();
}
var jo = /* @__PURE__ */ new WeakMap();
function Mo(e) {
	jo.delete(e);
}
function No(e, t, n) {
	return {
		resource: t,
		operation: n,
		limit: ke(e).maxCoordinateIndexEntries
	};
}
function Po(e, t) {
	let n = ke(e).maxCoordinateIndexEntries, r = jo.get(e);
	if (r && r.rowCount === e.rows.length && r.coordinateIndexLimit === n && (t === void 0 || r.styleDxfs === t.dxfs)) return r;
	r && jo.delete(e);
	let i = No(e, "worksheet-cell-index", "index-worksheet-cells"), a = Ht(e.rows, i), o = /* @__PURE__ */ new Map();
	for (let t of e.rows) {
		let e = t.cells.filter((e) => e.value.type !== "empty").map((e) => e.col).sort((e, t) => e - t);
		e.length > 0 && o.set(t.index, e);
	}
	let s = No(e, "worksheet-merge-anchor-index", "index-merge-anchor-coordinates"), c = No(e, "worksheet-merge-skip-index", "expand-merged-cell-coordinates"), { anchors: l, continuations: u } = rn(e.mergeCells ?? [], s, c), d = /* @__PURE__ */ new Set();
	if (e.autoFilter) {
		let t = e.autoFilter, n = No(e, "worksheet-auto-filter-index", "expand-auto-filter-coordinates");
		Bt({
			top: t.top,
			bottom: t.top,
			left: t.left,
			right: t.right
		}, n);
		for (let e = t.left; e <= t.right; e++) Ut(d, `${t.top}:${e}`, n);
	}
	let f = /* @__PURE__ */ new Map(), p = No(e, "worksheet-hyperlink-index", "index-hyperlink-coordinates");
	for (let t of e.hyperlinks ?? []) t.url && Vt(f, `${t.row}:${t.col}`, t.url, p);
	let m = /* @__PURE__ */ new Set(), h = No(e, "worksheet-comment-index", "index-comment-coordinates");
	for (let t of e.commentRefs ?? []) {
		let e = Ga(t);
		e && Ut(m, `${e.row}:${e.col}`, h);
	}
	let g = {
		rowCount: e.rows.length,
		coordinateIndexLimit: n,
		cellMap: a,
		nonEmptyColsByRow: o,
		cfContext: oi(e, a),
		mergeAnchorSet: l,
		mergeSkipSet: u,
		autoFilterCells: d,
		hyperlinkMap: f,
		commentCells: m,
		structuredStyleMap: nn(e, t?.dxfs),
		styleDxfs: t?.dxfs,
		sparklineMap: ko(e)
	};
	return jo.set(e, g), g;
}
var Fo = /* @__PURE__ */ new WeakMap();
function Io(e, t) {
	return t.ownFontColor || !e?.fontColorFromTable ? null : e.fontColorAuto ? Lo : e.fontColor ?? null;
}
var Lo = "#000000";
function Ro(e, t) {
	return t.ownFontColor ? null : e?.fontColorAuto ? Lo : e?.fontColor ?? null;
}
function zo(e, t) {
	return t == null ? e : e.map((e) => e.font?.normalColor ? {
		...e,
		font: {
			...e.font,
			color: t
		}
	} : e);
}
function Bo(e, t, n) {
	let r = t.fontBold ?? (e.bold || !!n?.bold), i = t.fontItalic ?? (e.italic || !!n?.italic), a = t.fontUnderline ?? (e.underline || !!n?.underline), o = t.fontStrike ?? (e.strike || !!n?.strike);
	return r === e.bold && i === e.italic && a === e.underline && o === e.strike ? e : {
		...e,
		bold: r,
		italic: i,
		underline: a,
		strike: o
	};
}
function Vo(e, t, n) {
	let r = [[]];
	for (let t of e) {
		let e = t.text.split("\n");
		for (let n = 0; n < e.length; n++) n > 0 && r.push([]), e[n] !== "" && r[r.length - 1].push({
			...t,
			text: e[n]
		});
	}
	let i = t.size;
	return r.map((e) => {
		if (e.length === 0) return {
			runs: e,
			heightPx: $(i || ka, n, 1.2)
		};
		let r = 0;
		for (let n of e) {
			let e = no(t, n);
			e.size > r && (r = e.size), i = e.size;
		}
		return {
			runs: e,
			heightPx: $(r, n, 1.2)
		};
	});
}
function Ho(e, t, n, r, i, a, o, s, c, l) {
	let u = i.alignH ?? lo(t.value.type), d = i.indent ? Math.round(i.indent * 3 * o) : 0, f = s ? Math.max(8, Math.round(Math.min(a, c) * .55)) : 0, p = f > 0 ? f + 4 : 0, m = 3 + (u === "left" || !i.alignH ? d : 0) + p, h = Math.max(1, a - m - 3), g = t.value.type === "text" ? t.value.runs : void 0, _ = !!g?.length, v = i.textRotation ?? 0;
	if (e.font = Qa(e, r, 1, l, n), v === 255) return [...n].length * $(r.size, 1, 1.1) + 4;
	if (v > 0) {
		let t = v <= 90 ? v * Math.PI / 180 : (v - 90) * Math.PI / 180, i = $(r.size, 1, 1.2), a = e.measureText(n.replace(/\n/g, " ")).width;
		return Math.abs(Math.sin(t)) * a + Math.abs(Math.cos(t)) * i + 4;
	}
	let y;
	if (i.wrapText && _) y = co(e, g, r, 1, h, l).map((e) => $(e.maxFontSize, 1, 1.2));
	else if (i.wrapText) {
		e.font = Qa(e, r, 1, l, n);
		let t = $(r.size, 1, 1.2);
		y = oo(e, n, h).map(() => t);
	} else if (_) y = Vo(g, r, 1).map((e) => e.heightPx);
	else {
		let e = Math.max(1, n.split("\n").length), t = $(r.size, 1, 1.2);
		y = Array.from({ length: e }, () => t);
	}
	return y.reduce((e, t) => e + t, 0) + (y.length > 1 ? 4 : 2);
}
function Uo(e, t, n, r) {
	if (n.wrapText || (n.textRotation ?? 0) > 0) return !0;
	if (e.value.type === "text") {
		if (e.value.text.includes("\n")) return !0;
		for (let n of e.value.runs ?? []) if ($(no(t, n).size, 1, 1.2) > r) return !0;
	}
	return $(t.size, 1, 1.2) > r;
}
function Wo(e, t, n, r) {
	if (Fo.has(t) || t.isChartSheet) return !1;
	if (t.defaultRowHeightCustom === !0) return Fo.set(t, { derived: /* @__PURE__ */ new Map() }), !1;
	let i = La(t), a = qe(t.defaultRowHeight), o = $(t.normalFontSize ?? t.defaultFontSize ?? ka, 1, 1.2), { cfContext: s, mergeAnchorSet: c, mergeSkipSet: l, structuredStyleMap: u } = Po(t, n), d = /* @__PURE__ */ new Map(), f = !1;
	e.save();
	try {
		for (let p of t.rows) {
			if (p.hidden || p.customHeight === !0 || p.height !== null || Ye(Ke(t), p.index) || Object.hasOwn(t.rowHeights, p.index)) continue;
			let m = a, h = [];
			for (let a of p.cells) {
				let d = `${p.index}:${a.col}`;
				if (a.value.type === "empty" || c.has(d) || l.has(d)) continue;
				let { font: f, xf: g } = ro(n, a.styleIndex ?? 0);
				if (!Uo(a, f, g, o)) continue;
				let _ = vi(a, p.index, a.col, s, n.dxfs ?? []), v = Bo(f, _, u.get(d)), y = ln(a, n, _.numFmt, t.date1904).text;
				if (!y || y === "0" && t.showZeros === !1) continue;
				let b = i.col.sizeOf(a.col);
				m = Math.max(m, Ho(e, a, y, v, g, b, i.maximumDigitWidth, _.iconSet, Math.ceil(m), r)), _.iconSet && h.push({
					cell: a,
					text: y,
					font: v,
					xf: g,
					cellWidthPx: b,
					iconSet: _.iconSet
				});
			}
			let g = h.length === 0;
			for (let t = 0; !g && t < 32; t++) {
				let t = Math.ceil(m), n = m;
				for (let a of h) n = Math.max(n, Ho(e, a.cell, a.text, a.font, a.xf, a.cellWidthPx, i.maximumDigitWidth, a.iconSet, t, r));
				m = n, g = Math.ceil(m) === t;
			}
			if (!g) for (let t of h) m = Math.max(m, Ho(e, t.cell, t.text, t.font, t.xf, t.cellWidthPx, i.maximumDigitWidth, t.iconSet, t.cellWidthPx, r));
			let _ = Math.ceil(m);
			if (_ > a) {
				let e = Je(_);
				t.rowHeights[p.index] = e, d.set(p.index, e), f = !0;
			}
		}
	} finally {
		e.restore();
	}
	return Fo.set(t, { derived: d }), f && Xe.invalidate(t), f;
}
function Go(e) {
	return Fo.has(e);
}
function Ko(e) {
	return Fo.get(e)?.derived ?? /* @__PURE__ */ new Map();
}
function qo(e, t = []) {
	let n = Fo.get(e);
	if (!n) return;
	let r = new Set(t), i = !1;
	for (let [t, a] of n.derived) Ye(Ke(e), t) || r.has(t) || e.rowHeights[t] === a && (delete e.rowHeights[t], i = !0);
	Fo.delete(e), i && Xe.invalidate(e);
}
var Jo = /* @__PURE__ */ new WeakMap();
function Yo(e, t) {
	let n = Jo.get(t);
	n || (n = /* @__PURE__ */ new WeakMap(), Jo.set(t, n));
	let r = n.get(e);
	return r || (r = e.filter((e) => t.sizeOf(e) > 0), n.set(e, r)), r;
}
function Xo(e, t) {
	let n = 0, r = e.length;
	for (; n < r;) {
		let i = n + r >> 1;
		e[i] < t ? n = i + 1 : r = i;
	}
	return n - 1;
}
function Zo(e, t) {
	let n = 0, r = e.length;
	for (; n < r;) {
		let i = n + r >> 1;
		e[i] <= t ? n = i + 1 : r = i;
	}
	return n;
}
function Qo(e, t, n) {
	let r = e[Xo(e, t)];
	if (r == null || n.sizeOf(r) > 0) return r;
	let i = Yo(e, n);
	return i[Xo(i, t)];
}
function $o(e, t, n) {
	let r = e[Zo(e, t)];
	if (r == null || n.sizeOf(r) > 0) return r;
	let i = Yo(e, n);
	return i[Zo(i, t)];
}
function es(e, t, n, r, i) {
	return (e.mergeCells ?? []).some((e) => {
		if (t < e.top || t > e.bottom) return !1;
		let a = Math.max(n, e.left), o = Math.min(r, e.right);
		return a <= o && i.offsetOf(o + 1) > i.offsetOf(a);
	});
}
function ts(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g) {
	let _ = d, v = f, y = /* @__PURE__ */ new Set(), b = (i, u, d, f) => {
		let _ = `${i}:${u}`, v = r.get(_);
		if (!v || v.value.type === "empty" || s.has(_)) return !1;
		let { font: y, xf: b } = ro(n, ao(t, v, u)), x = vi(v, i, u, a, n.dxfs ?? []), S = ln(v, n, x.numFmt, t.date1904).text;
		if (!S || S === "0" && t.showZeros === !1 || v.value.type === "number" || b.wrapText || b.textRotation || S.includes("\n")) return !1;
		let C = o.get(_), w = x.fontBold ?? (y.bold || !!C?.bold), T = x.fontItalic ?? (y.italic || !!C?.italic);
		e.font = Qa(e, w !== y.bold || T !== y.italic ? {
			...y,
			bold: w,
			italic: T
		} : y, p, g, S);
		let E = b.alignH ?? lo(v.value.type), D = b.indent ? Math.round(b.indent * 3 * m) : 0, O = c.sizeOf(u), k = l.sizeOf(i), A = x.iconSet ? Math.max(8, Math.round(Math.min(O, k) * .55)) : 0, j = A > 0 ? A + 4 : 0, M = 3 + (E === "left" || !b.alignH ? D : 0) + j, N = e.measureText(S).width + M + 3, P = Math.max(0, N - O);
		return P <= 0 ? !1 : (E === "center" || E === "centerContinuous" ? P / 2 : ((h ? d === "higher" ? "left" : "right" : d === "higher" ? "right" : "left") == "left" ? E === "right" : E !== "right") ? P : 0) > f;
	};
	for (let e of u) {
		let n = i.get(e);
		if (!n) continue;
		let a = Qo(n, d, c), o = r.get(`${e}:${d}`);
		a != null && (!o || o.value.type === "empty") && !es(t, e, a + 1, d, c) && b(e, a, "higher", c.offsetOf(d) - c.offsetOf(a + 1)) && (_ = Math.min(_, a), y.add(`${e}:${a}`));
		let s = $o(n, f, c), l = r.get(`${e}:${f}`);
		s != null && s <= 16384 && (!l || l.value.type === "empty") && !es(t, e, f, s - 1, c) && b(e, s, "lower", c.offsetOf(s) - c.offsetOf(f + 1)) && (v = Math.max(v, s), y.add(`${e}:${s}`));
	}
	return {
		startCol: _,
		endCol: v,
		anchorKeys: y
	};
}
function ns(e, t) {
	st(e, t), Ae(e, t), jo.set(t, Po(e));
}
function rs(e, t, n, r, i = {}, a) {
	xa(e, t, i.officeFontRoutes, i.googleSubstitutes === !0), Ta(t, i.authoritativeMdw);
	let o = i.dpr ?? 1, s = i.cellScale ?? 1, c = t.isChartSheet === !0, l = La(t), u = l.maximumDigitWidth, d = e.canvas.width / o, f = e.canvas.height / o;
	e.clearRect(0, 0, d, f), e.fillStyle = "#ffffff", e.fillRect(0, 0, d, f);
	let p = (e) => Math.round(e * s), m = c ? 0 : p(50), h = c ? 0 : p(22), { rows: g, cols: _ } = r, v = Math.max(1, Math.trunc(r.row) || 1), b = Math.max(1, Math.trunc(r.col) || 1), x = (i.scrollOffsetX ?? 0) * s, S = (i.scrollOffsetY ?? 0) * s, { col: C, row: w } = l.axesAtScale(s), T = C.bandsToCover(1, c ? 0 : i.freezeCols ?? 0, Math.max(0, d - m)), E = w.bandsToCover(1, c ? 0 : i.freezeRows ?? 0, Math.max(0, f - h)), D = E.at(-1)?.index ?? 0, O = T.at(-1)?.index ?? 0, k = T.map(({ index: e }) => e), A = E.map(({ index: e }) => e), j = T.map(({ size: e }) => e), M = E.map(({ size: e }) => e), N = j.reduce((e, t) => e + t, 0), P = M.reduce((e, t) => e + t, 0), ee = C.bandsToCover(b, Math.min(16384, b + _ - 1)), te = w.bandsToCover(v, Math.min(1048576, v + g - 1)), F = ee.map(({ index: e }) => e), I = te.map(({ index: e }) => e), L = ee.map(({ size: e }) => e), R = te.map(({ size: e }) => e), { cellMap: z, cfContext: B, mergeSkipSet: V, autoFilterCells: ne, hyperlinkMap: re, commentCells: H, structuredStyleMap: U, sparklineMap: W, nonEmptyColsByRow: G } = Po(t, n), K = /* @__PURE__ */ new Map(), ie = No(t, "worksheet-merge-anchor-index", "index-merge-anchor-coordinates");
	for (let e of t.mergeCells ?? []) {
		let t = C.offsetOf(e.right + 1) - C.offsetOf(e.left), n = w.offsetOf(e.bottom + 1) - w.offsetOf(e.top);
		Vt(K, `${e.top}:${e.left}`, {
			totalW: t,
			totalH: n,
			right: e.right,
			bottom: e.bottom
		}, ie);
	}
	let q = F[0] ?? b, ae = F.at(-1) ?? Math.min(16384, b + _ - 1), oe = [...new Set([...A, ...I])], se = ts(e, t, n, z, G, B, U, K, C, w, oe, q, ae, s, u, t.rightToLeft === !0, a), ce = O > 0 ? ts(e, t, n, z, G, B, U, K, C, w, oe, 1, O, s, u, t.rightToLeft === !0, a) : {
		startCol: 1,
		endCol: 0,
		anchorKeys: /* @__PURE__ */ new Set()
	}, le = ce.endCol > O ? C.bandsToCover(1, ce.endCol) : T, J = le.map(({ index: e }) => e), ue = le.map(({ size: e }) => e), de = C.bandsToCover(se.startCol, se.endCol), fe = de.map(({ index: e }) => e), pe = de.map(({ size: e }) => e), me = x + C.offsetOf(q) - C.offsetOf(se.startCol), he = {
		worksheet: t,
		styles: n,
		cellMap: z,
		mergeAnchorMap: K,
		mergeSkipSet: V,
		cfContext: B,
		colWidths: pe,
		rowHeights: R,
		colAxis: C,
		rowAxis: w,
		frozenColWidths: j,
		frozenRowHeights: M,
		frozenW: N,
		frozenH: P,
		startRow: v,
		startCol: b,
		cs: s,
		dpr: o,
		autoFilterCells: ne,
		hyperlinkMap: re,
		commentCells: H,
		structuredStyleMap: U,
		sparklineMap: W,
		overflowTextAnchors: se.anchorKeys,
		textRunPane: {
			first: O + 1,
			last: Infinity,
			ownerShiftX: 0
		},
		firstViewportCol: q,
		selectionLastCol: Infinity,
		textRuns: i.onTextRun ? {
			owned: /* @__PURE__ */ new Map(),
			foreign: /* @__PURE__ */ new Map()
		} : void 0,
		mdw: u,
		rtl: t.rightToLeft === !0,
		canvasW: d,
		threeD: i.threeD
	}, ge = m, _e = h, ve = ge + N, ye = _e + P, be = Math.max(0, d - ve), xe = Math.max(0, f - ye), Se = ge - C.offsetOf(1), Ce = ve - x - C.offsetOf(q), we = c ? 0 : Math.max(0, Math.trunc(i.freezeCols ?? 0)), Te = {
		...he,
		textRunPane: {
			first: we + 1,
			last: Infinity,
			ownerShiftX: Se - Ce
		}
	}, Ee = {
		...he,
		overflowTextAnchors: ce.anchorKeys,
		textRunPane: {
			first: 1,
			last: we,
			ownerShiftX: Ce - Se
		},
		firstViewportCol: k[0] ?? 1,
		selectionLastCol: O
	};
	if (D > 0 && O > 0 && Ao(e, Ee, 1, 1, ue, M, J, A, 0, 0, ge, _e, ge, _e, N, P, a), D > 0 && Ao(e, Te, 1, se.startCol, pe, M, fe, A, me, 0, ve, _e, ve, _e, be, P, a), O > 0 && Ao(e, Ee, v, 1, ue, R, J, I, 0, S, ge, ye, ge, ye, N, xe, a), c || Ao(e, Te, v, se.startCol, pe, R, fe, I, me, S, ve, ye, ve, ye, be, xe, a), he.textRuns && i.onTextRun) {
		for (let e of he.textRuns.owned.values()) i.onTextRun(e);
		for (let [e, t] of he.textRuns.foreign) he.textRuns.owned.has(e) || i.onTextRun(t);
	}
	as(e, t, C, w, i.loadedImages, s, v, b, x, S, ve, ye, be, xe, t.rightToLeft === !0, d, i.threeD, i.regionMap, i.chartEx, a), !c && t.slicers && t.slicers.length > 0 && Gs(e, t, C, w, s, v, b, x, S, ve, ye, be, xe, t.rightToLeft === !0, d), c || is(e, d, f, v, b, g, _, L, R, F, I, x, S, j, M, k, A, N, P, m, h, s, o, i.selectedRowRange ?? null, i.selectedColRange ?? null, t.rightToLeft === !0, i.chromeColors);
	let De = t.rightToLeft === !0;
	if (D > 0) {
		e.save(), e.strokeStyle = Ma, e.lineWidth = .5, e.beginPath();
		let t = ye + y(ye, .5, o);
		e.moveTo(0, t), e.lineTo(d, t), e.stroke(), e.restore();
	}
	if (O > 0) {
		e.save(), e.strokeStyle = Ma, e.lineWidth = .5, e.beginPath();
		let t = De ? d - ve : ve, n = t + y(t, .5, o);
		e.moveTo(n, h), e.lineTo(n, f), e.stroke(), e.restore();
	}
}
function is(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, b, x, S, C, w, T, E, D) {
	let O = D?.surface ?? "#f8f9fa", k = D?.mutedSurface ?? "#e8eaed", A = D?.selectedSurface ?? "#caddf6", j = D?.border ?? "#c8ccd0", M = D?.accent ?? "#5b9bd5", N = D?.text ?? "#444", P = (e) => !T || e < T.start || e > T.end ? O : T.strong ? A : k, ee = (e) => !T || e < T.start || e > T.end ? j : T.strong ? M : j, te = (e) => !w || e < w.start || e > w.end ? O : w.strong ? A : k, F = (e) => !w || e < w.start || e > w.end ? j : w.strong ? M : j, I = `${Math.max(1, Math.round(11 * S))}px ${ia}`, L = b + _, R = x + v, z = .5 / C, B = (e, n) => E ? Aa(e, n, t) : e, V = E ? t - b : 0;
	e.fillStyle = O, e.fillRect(V, 0, b, x), e.strokeStyle = j, e.lineWidth = .5, e.beginPath();
	let ne = E ? V + y(V, .5, C) : V + b - z;
	e.moveTo(ne, 0), e.lineTo(ne, x), e.moveTo(V, x - z), e.lineTo(V + b, x - z), e.stroke(), e.font = I, e.fillStyle = N;
	let re = (t, n, r) => {
		let i = B(n, r);
		e.fillStyle = P(t), e.fillRect(i, 0, r, x), e.strokeStyle = ee(t), e.lineWidth = .5, e.beginPath();
		let a = i + y(i, .5, C);
		e.moveTo(a, 0), e.lineTo(a, x), e.moveTo(i, x - z), e.lineTo(i + r, x - z), e.stroke(), e.fillStyle = N, e.textAlign = "center", e.textBaseline = "middle", e.fillText(Co(t), i + r / 2, x / 2);
	}, H = (t, n, r) => {
		let i = V;
		e.fillStyle = te(t), e.fillRect(i, n, b, r), e.strokeStyle = F(t), e.lineWidth = .5, e.beginPath();
		let a = n + y(n, .5, C), o = E ? i + y(i, .5, C) : i + b - z;
		e.moveTo(o, n), e.lineTo(o, n + r), e.moveTo(i, a), e.lineTo(i + b, a), e.stroke(), e.fillStyle = N, e.textBaseline = "middle";
		let s = Math.max(2, Math.round(4 * S));
		E ? (e.textAlign = "left", e.fillText(String(t), i + s, n + r / 2)) : (e.textAlign = "right", e.fillText(String(t), i + b - s, n + r / 2));
	};
	if (p.length > 0) {
		e.save(), e.beginPath(), e.rect(B(b, _), 0, _, x), e.clip();
		let t = b;
		for (let e = 0; e < p.length; e++) re(h[e], t, p[e]), t += p[e];
		e.restore();
	}
	e.save(), e.beginPath(), e.rect(B(L, t - L), 0, t - L, x), e.clip();
	let U = L - d;
	for (let e = 0; e < s.length; e++) {
		let n = s[e];
		U + n > L && U < t && re(l[e], U, n), U += n;
	}
	if (e.restore(), m.length > 0) {
		e.save(), e.beginPath(), e.rect(V, x, b, v), e.clip();
		let t = x;
		for (let e = 0; e < m.length; e++) H(g[e], t, m[e]), t += m[e];
		e.restore();
	}
	e.save(), e.beginPath(), e.rect(V, R, b, n - R), e.clip();
	let W = R - f;
	for (let e = 0; e < c.length; e++) {
		let t = c[e];
		W + t > R && W < n && H(u[e], W, t), W += t;
	}
	e.restore();
}
function as(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y) {
	let b = [], x = 0;
	if (i) for (let e of t.images ?? []) b.push({
		kind: "image",
		zOrder: e.zOrder ?? 2 ** 53 - 1,
		fallbackOrder: x++,
		anchor: e
	});
	for (let e of t.shapeGroups ?? []) for (let t of e.shapes) b.push({
		kind: "shape",
		zOrder: t.zOrder ?? 2 ** 53 - 1,
		fallbackOrder: x++,
		anchor: e,
		shape: t
	});
	for (let e of t.charts ?? []) b.push({
		kind: "chart",
		zOrder: e.zOrder ?? 2 ** 53 - 1,
		fallbackOrder: x++,
		anchor: e
	});
	b.sort((e, t) => e.zOrder - t.zOrder || e.fallbackOrder - t.fallbackOrder);
	for (let x of b) x.kind === "image" ? cs(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, [x.anchor]) : x.kind === "shape" ? ls(e, t, n, r, a, o, s, c, l, u, d, f, p, i, m, h, [x.anchor], y, x.shape) : Ms(e, t, n, r, a, o, s, c, l, u, d, f, p, m, h, i, [x.anchor], g, _, v);
}
function os(e, t) {
	return e.offsetOf(t);
}
function ss(e, t) {
	return e.offsetOf(t);
}
function cs(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g = t.images) {
	if (f <= 0 || p <= 0) return;
	let _ = os(n, s), v = ss(r, o);
	e.save(), e.beginPath();
	let y = ja(u, f, h, m);
	e.rect(y, d, f, p), e.clip();
	for (let o of g) {
		let s = $i(o), g = Zi(o.imagePath, ta(o, s), s), b = i.get(g), x = Gi(i, g, "tiff");
		if (!b && !x) continue;
		let { x: S, y: C, width: w, height: T } = Bi(t, o, n, r, a);
		if (w <= 0 || T <= 0) continue;
		let E = ja(u + (S - _) - c, w, h, m), D = d + (C - v) - l, O = b && !o.srcRect ? Yi(b, E, D, w, T) : null, k = O ? Xi(O, E + w / 2, D + T / 2, o.rotation ?? 0, o.flipH ?? !1, o.flipV ?? !1) : qi({
			x: E,
			y: D,
			width: w,
			height: T
		}, o.rotation);
		if (k.x + k.width < y || k.x > y + f || k.y + k.height < d || k.y > d + p) continue;
		let A = () => {
			b ? V(e, b, o.srcRect, E, D, w, T) : Ee(e, "tiff", {
				x: E,
				y: D,
				width: w,
				height: T
			});
		}, j = () => {
			if (o.alpha != null && o.alpha < 1) {
				e.save();
				try {
					e.globalAlpha = o.alpha, A();
				} finally {
					e.restore();
				}
			} else A();
		}, M = o.rotation ?? 0, N = o.flipH ?? !1, P = o.flipV ?? !1;
		M === 0 && !N && !P ? j() : Oe(e, {
			rect: {
				x: E,
				y: D,
				w,
				h: T
			},
			geometry: {
				kind: "preset",
				name: "rect",
				adjustments: []
			},
			fill: null,
			stroke: null,
			transform: {
				rotationDeg: M,
				flipH: N,
				flipV: P
			}
		}, j);
	}
	e.restore();
}
function ls(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g = t.shapeGroups ?? [], _, v) {
	if (d <= 0 || f <= 0 || g.length === 0) return;
	let y = os(n, o), b = ss(r, a);
	e.save(), e.beginPath();
	let x = ja(l, d, h, m);
	e.rect(x, u, d, f), e.clip();
	for (let a of g) {
		let { x: o, y: g, width: S, height: C } = Bi(t, a, n, r, i);
		if (S <= 0 || C <= 0) continue;
		let w = ja(l + (o - y) - s, S, h, m), T = u + (g - b) - c, E = v ? [v] : a.shapes, D = E.some((e) => e.geom?.type === "image" && ve(e.geom.blipEffects ?? []));
		if (!(!D && (w + S < x || w > x + d)) && !(!D && (T + C < u || T > u + f))) for (let t of E) {
			let n = w + t.x * S, r = T + t.y * C, o = t.w * S, s = t.h * C;
			o <= 0 || s <= 0 || fs(e, t, n, r, o, s, i, p, _, a);
		}
	}
	e.restore();
}
function us(e, t, n, r, i, a) {
	if (t.w <= 0 || t.h <= 0) return;
	let o = i / t.w, s = a / t.h, c = n, l = r, u = n, d = r;
	for (let i of t.commands) switch (i.op) {
		case "moveTo": {
			let t = n + i.x * o, a = r + i.y * s;
			e.moveTo(t, a), c = u = t, l = d = a;
			break;
		}
		case "lineTo": {
			let t = n + i.x * o, a = r + i.y * s;
			e.lineTo(t, a), c = t, l = a;
			break;
		}
		case "cubicBezTo": {
			let t = n + i.x3 * o, a = r + i.y3 * s;
			e.bezierCurveTo(n + i.x1 * o, r + i.y1 * s, n + i.x2 * o, r + i.y2 * s, t, a), c = t, l = a;
			break;
		}
		case "quadBezTo": {
			let t = n + i.x2 * o, a = r + i.y2 * s;
			e.quadraticCurveTo(n + i.x1 * o, r + i.y1 * s, t, a), c = t, l = a;
			break;
		}
		case "arcTo": {
			let t = i.wr * o, n = i.hr * s;
			if (t <= 0 || n <= 0) break;
			let r = i.stAng / 6e4 * (Math.PI / 180), a = i.swAng / 6e4 * (Math.PI / 180), u = c - Math.cos(r) * t, d = l - Math.sin(r) * n, f = r + a;
			e.ellipse(u, d, t, n, 0, r, f, a < 0), c = u + Math.cos(f) * t, l = d + Math.sin(f) * n;
			break;
		}
		case "close":
			e.closePath(), c = u, l = d;
			break;
	}
}
function ds(e, t, n, r, i, a) {
	if (t.geom.type === "custom") for (let o of t.geom.paths) o.fill !== "none" && us(e, o, n, r, i, a);
	else (t.geom.type !== "preset" || !K(e, t.geom.name, n, r, i, a, t.geom.adj ?? [])) && e.rect(n, r, i, a);
}
function fs(e, t, n, r, i, a, o, s, c, l) {
	if (C(t.strokeFill) && (e = te(e)), e.save(), t.rot !== 0 || t.flipH || t.flipV ? (e.translate(n + i / 2, r + a / 2), e.rotate(t.rot * Math.PI / 180), e.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1), e.translate(-i / 2, -a / 2)) : e.translate(n, r), t.geom.type === "custom") {
		let n = bs(e, t, i, a, o);
		for (let r of t.geom.paths) if (!(r.w <= 0 || r.h <= 0)) {
			if (e.beginPath(), us(e, r, 0, 0, i, a), r.fill !== "none" && xs(e, t, i, a, o, n)) {
				let t = ie(r.fill);
				t && (e.fillStyle = t, e.fill());
			}
			r.stroke !== !1 && Cs(e, t, i, a, o);
		}
	} else if (t.geom.type === "preset") {
		let n = bs(e, t, i, a, o), r = t.strokeColor && t.strokeWidth > 0 ? () => Cs(e, t, i, a, o) : null;
		U(e, t.geom.name, 0, 0, i, a, t.geom.adj ?? [], n, r, () => {}) || (e.beginPath(), e.rect(0, 0, i, a), vs(e, t, i, a, o));
	} else if (t.geom.type === "image") {
		let n = t.geom, r = l ? ea(l, t) : void 0, o = Zi(n.imagePath, ta(n, r), r), c = s?.get(o), u = Gi(s, o, "tiff");
		if (c || u) {
			let t = n.alpha, r = () => {
				c ? V(e, c, n.srcRect, 0, 0, i, a) : Ee(e, "tiff", {
					x: 0,
					y: 0,
					width: i,
					height: a
				});
			};
			t != null && t < 1 ? (e.save(), e.globalAlpha = t, r(), e.restore()) : r();
		}
	}
	t.text && ((t.text.vert === "wordArtVert" || t.text.vert === "wordArtVertRtl") && (t.flipH || t.flipV) ? (e.save(), e.translate(i / 2, a / 2), e.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1), t.flipV && e.rotate(Math.PI), e.translate(-i / 2, -a / 2), _s(e, t.text, i, a, o, c), e.restore()) : _s(e, t.text, i, a, o, c)), e.restore();
}
var ps = /* @__PURE__ */ new WeakMap();
function ms(e) {
	let t = [];
	for (let n of e.shapeGroups ?? []) for (let e of n.shapes) for (let n of e.text?.paragraphs ?? []) for (let e of n.runs) e.type === "math" && t.push({
		nodes: e.nodes,
		display: e.display
	});
	return t;
}
function hs(e) {
	for (let t of e.shapeGroups ?? []) for (let e of t.shapes) for (let t of e.text?.paragraphs ?? []) for (let e of t.runs) if (e.type === "math" && !ps.has(e.nodes)) return !0;
	return !1;
}
async function gs(e, t) {
	let n = ms(e).filter((e) => !ps.has(e.nodes));
	if (n.length !== 0) {
		await t.loadMathJax();
		for (let e of n) if (!ps.has(e.nodes)) try {
			let n = await t.mathMLToSvg(ge(e.nodes, e.display)), r = await be(n, "#000000");
			ps.set(e.nodes, {
				raster: r,
				widthEm: n.widthEm,
				ascentEm: n.ascentEm,
				descentEm: n.descentEm,
				tinted: /* @__PURE__ */ new Map()
			});
		} catch {}
	}
}
function _s(e, t, n, r, i, a) {
	if (n <= 0 || r <= 0 || t.paragraphs.length === 0) return;
	let l = We(n, r, {
		lIns: t.lIns,
		rIns: t.rIns,
		tIns: t.tIns,
		bIns: t.bIns
	}, i / o), u = l.left, d = l.width, f = l.height;
	if (d <= 0 || f <= 0) return;
	let p = (t, n = 1) => {
		let r = (t.size > 0 ? t.size : ka) * s * i * n, o = Oa(t.fontFace, a, t.text, wa(e, t.fontFace, t.bold, t.italic), pa.get(e) === !0, void 0, Sa(e, t.fontFace));
		return {
			font: `${t.italic ? "italic " : ""}${t.bold ? "bold " : ""}${r}px ${o}`,
			px: r
		};
	};
	if (t.vert === "wordArtVert" || t.vert === "wordArtVertRtl") {
		let n = t.autoFit === "norm" ? t.fontScale ?? 1 : 1;
		if (n === 0) return;
		Nt(e, t, t.vert, l, s * i, (e, t) => {
			let r = xe(t.codePointAt(0) ?? 0) ? e.fontFaceEa ?? e.fontFace : e.fontFace;
			return {
				...p({
					...e,
					text: t,
					fontFace: r
				}, n),
				face: r
			};
		}, (t, r) => {
			let a = ps.get(t.nodes);
			if (!a) return;
			let o = (t.fontSize ?? r) * s * i * n, c = a.widthEm * o, l = (a.ascentEm + a.descentEm) * o;
			return {
				width: c,
				height: l,
				draw: (n, r) => {
					c > 0 && l > 0 && e.drawImage(le(a, t.color ?? "#000000"), n, r, c, l);
				}
			};
		});
		return;
	}
	let m = /* @__PURE__ */ new Map(), h = !t.paragraphs.some((e) => e.runs.some((e) => e.type === "math")), g = ua.get(e), _ = gt(e);
	for (let e of t.paragraphs) for (let t of e.runs) {
		if (!h) break;
		if (t.type !== "text") continue;
		let e = t.fontFace ? xt(t, g ? c(g, ft(t)) : void 0, _) : void 0;
		e ? m.set(t, e) : h = !1;
	}
	t.paragraphs.some((e) => e.runs.some((e) => e.type === "text")) || (h = !1);
	let v = (t, n) => {
		let r = e.font;
		e.font = t;
		let i = e.measureText("M").actualBoundingBoxAscent;
		return e.font = r, i > 0 ? i : n * .85;
	}, y = t.wrap !== "none", b = [], x = [], S;
	for (let n of t.paragraphs) {
		let r = n.align || "l", a = (n.marL ?? 0) / o * i, c = (n.marR ?? 0) / o * i, l = Math.max(0, (n.indent ?? 0) / o * i), u = Math.max(0, d - a - c), f = [], g = 0;
		for (let e of n.runs) {
			if (e.type === "break") {
				f.push({ type: "break" });
				continue;
			}
			if (e.type === "math") {
				let t = ps.get(e.nodes);
				if (!t) continue;
				let n = (e.fontSize ?? (g || ka)) * s * i, r = t.ascentEm * n, a = t.descentEm * n, o = {
					kind: "math",
					font: "",
					color: e.color ?? "#000000",
					pxSize: n,
					render: t,
					ascent: r,
					descent: a,
					display: e.display === !0
				};
				f.push({
					type: "object",
					width: t.widthEm * n,
					style: o,
					payload: o,
					display: e.display
				});
				continue;
			}
			g = e.size > 0 ? e.size : ka;
			let { font: t, px: n } = p(e);
			f.push({
				type: "text",
				text: e.text,
				style: {
					kind: "text",
					font: t,
					color: e.color ?? "#000000",
					pxSize: n,
					face: e.fontFace,
					ratios: h ? m.get(e) : void 0
				}
			});
		}
		let _ = Ge(f, {
			maxWidth: y ? u : Infinity,
			firstLineIndent: l,
			measureText(t, n) {
				return e.font = n.font, e.measureText(t).width;
			},
			sameStyle: (e, t) => e.kind === t.kind && e.font === t.font && e.color === t.color && e.pxSize === t.pxSize,
			tabStops: n.tabStops?.map((e) => ({
				pos: e.pos / o * i,
				algn: e.algn
			})),
			defaultTabSize: (n.defTabSz ?? 914400) / o * i,
			tabStartPen: (e) => a + (e === 0 ? l : 0)
		}), C = [], w = !1;
		for (let e of f) {
			if (e.type === "break") {
				w = !1;
				continue;
			}
			if (e.type === "object") {
				e.display ? (C.push(!w), w = !1) : w = !0;
				continue;
			}
			if (e.text === "") {
				w = !0;
				continue;
			}
			e.text.split("\n").forEach((e, t) => {
				t > 0 && (w = !1), e.replace(/\r/gu, "") !== "" && (w = !0);
			});
		}
		let T = 0, E = /* @__PURE__ */ new Map();
		f.forEach((e, t) => {
			e.type === "text" && E.set(e.style, t);
		});
		let D, O = -1, k = (e) => {
			let t = E.get(e) ?? -1;
			t >= O && (D = e, O = t);
		}, A = () => {
			let t = D?.pxSize ?? ka * 1.3333333333333333 * i, n = D?.face;
			return D?.ratios ? {
				height: t * (D.ratios.ascentRatio + D.ratios.descentRatio),
				ascent: t * D.ratios.ascentRatio
			} : {
				height: t * 1.2,
				ascent: v(`${t}px ${Oa(n, void 0, "", wa(e, n), pa.get(e) === !0, void 0, Sa(e, n))}`, t)
			};
		}, j = t.autoFit === "norm" ? t.lnSpcReduction ?? 0 : 0, M = ut(n.spaceLine), N = (e) => Ie(e, M, s * i, j), P = (e, t) => {
			let n = je({
				ascent: e,
				descent: t
			}, M, s * i, j);
			return {
				height: n.ascent + n.descent,
				ascent: n.ascent
			};
		}, ee = b.length;
		for (let [e, t] of _.entries()) {
			let n = [], i = 0, o = 0, s = 0, c = 0, d = !1, p = !1;
			for (let e of t.segments) {
				if (e.type === "tab") {
					n.push({
						kind: "tab",
						w: e.width
					});
					continue;
				}
				if (e.type === "object") {
					let t = e.style;
					if (!t.render) continue;
					let r = t.ascent ?? 0, a = t.descent ?? 0;
					n.push({
						kind: "math",
						render: t.render,
						color: t.color,
						w: e.width,
						ascent: r,
						descent: a
					}), i = Math.max(i, r + a), o = Math.max(o, r), d = !0, t.display && (p = !0);
					continue;
				}
				let t = e.style;
				n.push({
					kind: "text",
					text: e.text,
					font: t.font,
					color: t.color,
					w: e.width
				}), i = Math.max(i, t.pxSize * 1.2), o = Math.max(o, v(t.font, t.pxSize)), t.ratios && (s = Math.max(s, t.pxSize * t.ratios.ascentRatio), c = Math.max(c, t.pxSize * t.ratios.descentRatio)), k(t);
			}
			if (p && C[T++]) {
				let e = A();
				b.push({
					segs: [],
					align: r,
					height: N(e.height),
					ascent: e.ascent,
					hasMath: !1,
					leftInset: a,
					availW: u,
					gapBefore: 0
				}), x.push(e.height);
			}
			for (let e of t.hiddenRuns ?? []) {
				let t = f[e];
				t.type === "text" && (i = Math.max(i, t.style.pxSize * 1.2), o = Math.max(o, v(t.style.font, t.style.pxSize)), t.style.ratios && (s = Math.max(s, t.style.pxSize * t.style.ratios.ascentRatio), c = Math.max(c, t.style.pxSize * t.style.ratios.descentRatio)), k(t.style));
			}
			let m;
			if (h) {
				if (s + c === 0) {
					let e = A();
					s = e.ascent, c = e.height - e.ascent;
				}
				i = s + c, {height: m, ascent: o} = P(s, c);
			} else i === 0 && ({height: i, ascent: o} = A()), m = N(i);
			let g = p;
			b.push({
				segs: n,
				align: r,
				height: m,
				ascent: o,
				hasMath: d,
				leftInset: g ? a : a + (e === 0 ? l : 0),
				availW: g ? u : u - (e === 0 ? l : 0),
				gapBefore: 0
			}), x.push(i);
		}
		b.length > ee && (S && ee > 0 && (b[ee].gapBefore = Fe(ut(S.spaceAfter), S.lastNaturalHeight, s * i) + Fe(ut(n.spaceBefore), x[ee], s * i)), S = {
			spaceAfter: n.spaceAfter,
			lastNaturalHeight: x[b.length - 1]
		});
	}
	let C = (e) => Number(/(\d+(?:\.\d+)?)px/u.exec(e)?.[1] ?? 0), w = (t) => {
		let n = e.font, r = e.textBaseline;
		e.font = t.font, e.textBaseline = "alphabetic";
		let i = e.measureText(t.text).actualBoundingBoxAscent;
		e.textBaseline = "middle";
		let a = e.measureText(t.text).actualBoundingBoxAscent;
		e.font = n, e.textBaseline = r;
		let o = i - a;
		return Number.isFinite(o) ? o : 0;
	}, T = b.reduce((e, t) => e + t.gapBefore + t.height, 0), E = ze(t.anchor, l, T);
	for (let t of b) {
		E += t.gapBefore;
		let n = t.segs.reduce((e, t) => e + t.w, 0), r = u + t.leftInset, i = Ve(t.align, r, t.availW, n), a = t.segs.map((e) => ({
			type: "object",
			style: e,
			width: e.w
		}));
		if (t.hasMath) {
			e.textBaseline = "alphabetic";
			let n = E + t.ascent;
			nt(a, i, n, (t, r) => {
				let i = t.style;
				if (i.kind === "text") e.font = i.font, e.fillStyle = i.color, e.fillText(i.text, r, n);
				else if (i.kind === "math") {
					let t = le(i.render, i.color);
					e.drawImage(t, r, n - i.ascent, i.w, i.ascent + i.descent);
				}
			});
		} else if (h) {
			e.textBaseline = "alphabetic";
			let n = E + t.ascent;
			nt(a, i, n, (t, r) => {
				let i = t.style;
				i.kind === "text" && (e.font = i.font, e.fillStyle = i.color, e.fillText(i.text, r, n));
			});
		} else {
			let n = E + t.height / 2, r = t.segs.filter((e) => e.kind === "text"), o = r.reduce((e, t) => !e || C(t.font) > C(e.font) ? t : e, void 0), s = o && r.some((e) => e.font !== o.font) ? n + w(o) : void 0;
			e.textBaseline = s === void 0 ? "middle" : "alphabetic";
			let c = s ?? n;
			nt(a, i, c, (t, n) => {
				let r = t.style;
				r.kind === "text" && (e.font = r.font, e.fillStyle = r.color, e.fillText(r.text, n, c));
			});
		}
		E += t.height;
	}
}
function vs(e, t, n, r, i) {
	xs(e, t, n, r, i), Cs(e, t, n, r, i);
}
function ys(e, t, n) {
	if (e.rot === 0 && !e.flipH && !e.flipV) return;
	let r = e.rot * Math.PI / 180, i = Math.cos(r), a = Math.sin(r), o = e.flipH ? -1 : 1, s = e.flipV ? -1 : 1, c = o * i, l = -s * a, u = o * a, d = s * i, f = t / 2, p = n / 2;
	return {
		a: c,
		b: l,
		c: u,
		d,
		e: f - c * f - u * p,
		f: p - l * f - d * p
	};
}
function bs(e, t, n, r, i) {
	return ee(t.fill ?? (t.fillColor ? {
		fillType: "solid",
		color: t.fillColor
	} : null), e, 0, 0, n, r, t.rot, s * i, ys(t, n, r), (e, n, r, i, a) => ds(e, t, n, r, i, a));
}
function xs(e, t, n, r, i, a = bs(e, t, n, r, i)) {
	return a ? (e.fillStyle = a, e.fill(), !0) : !1;
}
function Ss(e) {
	return !e.strokeColor || e.strokeWidth <= 0 ? null : {
		color: e.strokeColor,
		width: e.strokeWidth,
		...e.strokeFill ? { fill: e.strokeFill } : {},
		...e.strokeDashStyle ? { dashStyle: e.strokeDashStyle } : {},
		...e.strokeCustomDash?.length ? { customDash: e.strokeCustomDash } : {},
		...e.strokeLineCap ? { lineCap: e.strokeLineCap } : {},
		...e.strokeLineJoin ? { lineJoin: e.strokeLineJoin } : {},
		...e.strokeMiterLimit === void 0 ? {} : { miterLimit: e.strokeMiterLimit },
		...e.strokeAlignment ? { alignment: e.strokeAlignment } : {},
		...e.strokeCmpd ? { cmpd: e.strokeCmpd } : {},
		...e.strokeHeadEnd ? { headEnd: e.strokeHeadEnd } : {},
		...e.strokeTailEnd ? { tailEnd: e.strokeTailEnd } : {}
	};
}
function Cs(e, t, n, r, i) {
	let a = Ss(t);
	if (a) {
		if (P(e, a, 1 / o), a.fill) {
			let o = ee(a.fill, e, 0, 0, n, r, t.rot, s * i, ys(t, n, r), void 0, E(e));
			o && (e.strokeStyle = o);
		}
		e.stroke();
	}
}
function ws(e, t, n, r, i, a, o) {
	if (r === n && i === t) return e;
	let s = (e, r) => {
		if (e === t && r === n) return null;
		let i = a.get(`${e}:${r}`);
		return i ? ro(o, i.styleIndex ?? 0).border : null;
	}, c = s(t, r), l = s(i, n), u = s(i, r), d = (e, ...t) => {
		if (e?.style) return e;
		for (let e of t) if (e?.style) return e;
		return e ?? null;
	};
	return {
		left: e.left,
		top: e.top,
		right: d(c?.right, u?.right, e.right),
		bottom: d(l?.bottom, u?.bottom, e.bottom),
		diagonalUp: e.diagonalUp ?? null,
		diagonalDown: e.diagonalDown ?? null
	};
}
function Ts(e, t) {
	if (!t) return e;
	let n = (e, t) => t && t.style ? t : e ?? null;
	return {
		left: n(e.left, t.left),
		right: n(e.right, t.right),
		top: n(e.top, t.top),
		bottom: n(e.bottom, t.bottom),
		diagonalUp: n(e.diagonalUp, t.diagonalUp),
		diagonalDown: n(e.diagonalDown, t.diagonalDown)
	};
}
function Es(e, t, n, r, i = 1) {
	return {
		outerStart: n ? e - i : e,
		outerEnd: r ? t + i : t,
		innerStart: n ? e + i : e,
		innerEnd: r ? t - i : t
	};
}
function Ds(e, t, n, r, i, a, o = 1) {
	let s = [
		{
			edge: t.top,
			x1: n,
			y1: r,
			x2: n + i,
			y2: r,
			kind: "h"
		},
		{
			edge: t.bottom,
			x1: n,
			y1: r + a,
			x2: n + i,
			y2: r + a,
			kind: "h"
		},
		{
			edge: t.left,
			x1: n,
			y1: r,
			x2: n,
			y2: r + a,
			kind: "v"
		},
		{
			edge: t.right,
			x1: n + i,
			y1: r,
			x2: n + i,
			y2: r + a,
			kind: "v"
		},
		{
			edge: t.diagonalUp,
			x1: n,
			y1: r + a,
			x2: n + i,
			y2: r,
			kind: "d"
		},
		{
			edge: t.diagonalDown,
			x1: n,
			y1: r,
			x2: n + i,
			y2: r + a,
			kind: "d"
		}
	];
	for (let { edge: c, x1: l, y1: u, x2: d, y2: f, kind: p } of s) {
		if (!c || !c.style || c.style === "none") continue;
		let s = c.color ? S(c.color) : "#000000";
		if (c.style === "double" && p === "d") {
			e.strokeStyle = s, e.lineWidth = 1, e.setLineDash([]);
			let t = d - l, n = f - u, r = Math.hypot(t, n), i = -n / r * 1, a = t / r * 1;
			e.beginPath(), e.moveTo(l + i, u + a), e.lineTo(d + i, f + a), e.moveTo(l - i, u - a), e.lineTo(d - i, f - a), e.stroke();
			continue;
		}
		if (c.style === "double" && p !== "d") {
			if (e.strokeStyle = s, e.lineWidth = 1, e.setLineDash([]), e.beginPath(), p === "h") {
				let o = u === r, s = o ? r - 1 : r + a + 1, c = o ? r + 1 : r + a - 1, l = Es(n, n + i, !!t.left?.style && t.left.style !== "none", !!t.right?.style && t.right.style !== "none", 1);
				e.moveTo(l.outerStart, s), e.lineTo(l.outerEnd, s), e.moveTo(l.innerStart, c), e.lineTo(l.innerEnd, c);
			} else {
				let o = l === n, s = o ? n - 1 : n + i + 1, c = o ? n + 1 : n + i - 1, u = Es(r, r + a, !!t.top?.style && t.top.style !== "none", !!t.bottom?.style && t.bottom.style !== "none", 1);
				e.moveTo(s, u.outerStart), e.lineTo(s, u.outerEnd), e.moveTo(c, u.innerStart), e.lineTo(c, u.innerEnd);
			}
			e.stroke();
			continue;
		}
		e.beginPath(), e.strokeStyle = s;
		let m = Os(c.style);
		e.lineWidth = m;
		let h = ks(c.style);
		e.setLineDash(h);
		let g = p === "v" ? y(l, m, o) : 0, _ = p === "h" ? y(u, m, o) : 0;
		e.moveTo(l + g, u + _), e.lineTo(d + g, f + _), e.stroke(), e.setLineDash([]);
	}
}
function Os(e) {
	switch (e) {
		case "thick": return 3;
		case "medium":
		case "mediumDashed":
		case "mediumDashDot":
		case "mediumDashDotDot":
		case "slantDashDot": return 2;
		case "hair": return .5;
		default: return 1;
	}
}
function ks(e) {
	return t(e);
}
function As(e) {
	switch (e) {
		case "double": return 13;
		case "thick": return 12;
		case "medium": return 11;
		case "mediumDashed": return 10;
		case "mediumDashDot": return 9;
		case "slantDashDot": return 8;
		case "mediumDashDotDot": return 7;
		case "thin": return 6;
		case "dashed": return 5;
		case "dashDot": return 4;
		case "dashDotDot": return 3;
		case "dotted": return 2;
		case "hair": return 1;
		default: return 0;
	}
}
function js(e, t) {
	let n = As(e?.style), r = As(t?.style);
	return n === 0 && r === 0 ? null : n >= r ? e ?? null : t ?? null;
}
function Ms(e, t, n, r, i, a, c, l, u, d, f, p, m, h, g, _, v = t.charts, y, b, x) {
	if (p <= 0 || m <= 0) return;
	let S = os(n, c), C = ss(r, a), w = ja(d, p, g, h);
	for (let t of v) {
		let a = t.fromCol + 1, c = t.fromRow + 1, v = t.toCol + 1, T = t.toRow + 1, E = os(n, a) + t.fromColOff * i / o, D = ss(r, c) + t.fromRowOff * i / o, O = os(n, v) + t.toColOff * i / o, k = ss(r, T) + t.toRowOff * i / o, A = O - E, j = k - D;
		if (A <= 0 || j <= 0) continue;
		let M = ja(d + (E - S) - l, A, g, h), N = f + (D - C) - u;
		M + A < w || M > w + p || N + j < f || N > f + m || (e.save(), e.beginPath(), e.rect(w, f, p, m), e.clip(), e.save(), i !== 1 && e.scale(i, i), De(e, t.chart, i === 1 ? {
			x: M,
			y: N,
			w: A,
			h: j
		} : {
			x: M / i,
			y: N / i,
			w: A / i,
			h: j / i
		}, s, 0, y, b, _ ? F(_) : void 0, x), e.restore(), e.restore());
	}
}
var Ns = "600 12px \"Meiryo UI\", \"Segoe UI\", sans-serif", Ps = "11px \"Meiryo UI\", \"Segoe UI\", sans-serif", Fs = "#FFFFFF", Is = "#BFBFBF", Ls = "#F2F2F2", Rs = "#404040", zs = "#FFFFFF", Bs = "#000000", Vs = "#A5A5A5", Hs = "#E7E6E6", Us = "#A6A6A6", Ws = "#C6C6C6";
function Gs(e, t, n, r, i, a, s, c, l, u, d, f, p, m, h) {
	if (f <= 0 || p <= 0) return;
	let g = t.slicers;
	if (!g) return;
	let _ = os(n, s), v = ss(r, a), y = ja(u, f, h, m);
	for (let t of g) {
		let a = t.fromCol + 1, s = t.fromRow + 1, g = t.toCol + 1, b = t.toRow + 1, x = os(n, a) + t.fromColOff * i / o, S = ss(r, s) + t.fromRowOff * i / o, C = os(n, g) + t.toColOff * i / o, w = ss(r, b) + t.toRowOff * i / o, T = C - x, E = w - S;
		if (T <= 0 || E <= 0) continue;
		let D = ja(u + (x - _) - c, T, h, m), O = d + (S - v) - l;
		D + T < y || D > y + f || O + E < d || O > d + p || (e.save(), e.beginPath(), e.rect(y, d, f, p), e.clip(), Ks(e, t.caption, t.items, D, O, T, E, i, t.style), e.restore());
	}
}
function Ks(e, t, n, r, i, a, o, s, c) {
	let l = c != null;
	e.fillStyle = c?.whole?.fillColor ?? Fs, e.fillRect(r, i, a, o);
	let u = l ? c.whole?.borderColor : Is;
	u && (e.strokeStyle = u, e.lineWidth = 1, e.strokeRect(r + .5, i + .5, a - 1, o - 1));
	let d = Math.max(20 * s, 14), f = l ? c.header?.fillColor : Ls;
	f && (e.fillStyle = f, e.fillRect(r + 1, i + 1, a - 2, d)), e.fillStyle = c?.header?.fontColor ?? Rs, e.font = Js(c?.header, Ns, s), e.textBaseline = "middle", e.textAlign = "left";
	let p = 6 * s;
	if (Xs(e, t, r + p, i + d / 2 + 1, a - 2 * p), n.length === 0) return;
	let m = Math.max(1, Math.round(2 * s)), h = 4 * s, g = r + h, _ = i + d + h, v = a - 2 * h, y = o - d - 2 * h;
	if (v <= 0 || y <= 0) return;
	let b = Math.max(18 * s, 16), x = Math.max(1, Math.floor((y + m) / (b + m))), S = Math.min(n.length, x), C = Math.min(b, (y - m * (S - 1)) / S);
	if (C <= 0) return;
	e.font = Ys(Ps, s);
	let w = 8 * s;
	for (let t = 0; t < S; t++) {
		let r = n[t], i = _ + t * (C + m), a = r.selected, o = a ? c?.selectedItemWithData : c?.unselectedItemWithData, u = o?.fillColor ?? (a ? zs : Hs), d = l ? o?.borderColor : a ? Vs : Ws;
		e.fillStyle = u, l ? (qs(e, g, i, v, C, Math.min(4 * s, C / 4)), e.fill(), d && (e.strokeStyle = d, e.lineWidth = 1, e.stroke())) : (e.fillRect(g, i, v, C), d && (e.strokeStyle = d, e.lineWidth = 1, e.strokeRect(g + .5, i + .5, v - 1, C - 1))), e.font = Js(o, Ps, s), e.fillStyle = o?.fontColor ?? (a ? Bs : Us), Xs(e, r.name, g + w, i + C / 2 + 1, v - 2 * w);
	}
}
function qs(e, t, n, r, i, a) {
	let o = Math.max(0, Math.min(a, r / 2, i / 2));
	e.beginPath(), e.moveTo(t + o, n), e.lineTo(t + r - o, n), e.quadraticCurveTo(t + r, n, t + r, n + o), e.lineTo(t + r, n + i - o), e.quadraticCurveTo(t + r, n + i, t + r - o, n + i), e.lineTo(t + o, n + i), e.quadraticCurveTo(t, n + i, t, n + i - o), e.lineTo(t, n + o), e.quadraticCurveTo(t, n, t + o, n), e.closePath();
}
function Js(e, t, n) {
	if (!e) return Ys(t, n);
	let r = Math.round((e.fontSize ?? 11) * n);
	return `${e.fontBold ? "bold " : ""}${r}px ${e.fontFamily ? `"${e.fontFamily}", "Segoe UI", sans-serif` : "\"Meiryo UI\", \"Segoe UI\", sans-serif"}`;
}
function Ys(e, t) {
	return e.replace(/(\d+(?:\.\d+)?)px/, (e, n) => `${Math.round(Number(n) * t)}px`);
}
function Xs(e, t, n, r, i) {
	if (i <= 0) return;
	let a = t;
	if (e.measureText(a).width > i) {
		for (; a.length > 0 && e.measureText(a + "…").width > i;) a = a.slice(0, -1);
		a = a.length > 0 ? a + "…" : "";
	}
	e.fillText(a, n, r);
}
export { Bi as A, at as B, qi as C, Li as D, Ri as E, Tt as F, it as H, wt as I, Et as L, Si as M, cn as N, Pi as O, St as P, Dt as R, Ji as S, Wi as T, st as V, gs as _, Na as a, ja as b, ea as c, Zi as d, ta as f, Ta as g, Mo as h, Qi as i, Ci as j, Vi as k, Go as l, qo as m, xa as n, Ko as o, ns as p, Ca as r, La as s, Wo as t, $i as u, rs as v, Ui as w, hs as x, Aa as y, dt as z };
