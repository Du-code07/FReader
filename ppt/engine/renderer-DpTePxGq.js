import { $ as e, $a as t, $i as n, A as r, Aa as i, Ai as a, Ar as o, At as s, B as c, Ba as l, Bi as u, Bn as d, Bt as f, C as p, Ca as m, Ci as h, Cn as g, Co as _, Cr as v, Ct as y, D as b, Da as x, Di as S, Dt as C, E as w, Ea as T, Ei as E, Et as D, F as O, Fi as k, Ft as A, G as j, Ga as ee, Gi as M, Gt as te, H as N, Ha as P, Hi as F, Ht as ne, I as re, Ia as I, Ii as L, It as R, J as z, Ja as ie, Jt as ae, K as B, Ka as V, Ki as oe, Kt as se, L as ce, La as le, Li as H, Ln as ue, Lt as de, M as fe, Mi as pe, Mr as me, N as he, Ni as ge, Nr as _e, Nt as ve, O as ye, Oa as U, Oi as be, Or as xe, Ot as Se, P as Ce, Pa as W, Pi as we, Pt as Te, Q as Ee, Qa as De, Qi as Oe, Qt as ke, R as Ae, Ra as je, Ri as Me, Rn as Ne, Rr as Pe, Rt as Fe, Sa as Ie, Si as Le, Sn as Re, St as ze, T as Be, Ta as Ve, Ti as G, Tt as He, U as Ue, Ua as We, Ui as Ge, V as Ke, Va as qe, Vi as Je, Vt as Ye, W as K, Wa as Xe, Wi as Ze, X as q, Xa as Qe, Xi as $e, Xn as et, Xt as tt, Y as nt, Ya as rt, Yi as J, Yt as it, Z as at, Za as ot, Zi as Y, Zt as st, _ as ct, _a as lt, _i as ut, _t as dt, aa as ft, ao as pt, ar as mt, at as ht, ba as gt, bi as _t, bn as vt, bt as yt, ca as bt, ci as xt, cn as St, co as Ct, ct as wt, da as Tt, di as Et, dn as Dt, dr as Ot, dt as kt, er as At, et as jt, fa as Mt, fi as Nt, ft as Pt, ga as Ft, gi as It, gt as Lt, ha as Rt, hi as zt, hn as Bt, ht as Vt, ia as Ht, in as Ut, io as Wt, it as Gt, j as Kt, ji as qt, jr as Jt, k as Yt, ka as Xt, ki as Zt, kt as Qt, l as $t, la as en, ln as tn, lo as nn, lt as rn, m as an, ma as on, mi as sn, mt as cn, n as ln, na as un, ni as dn, no as fn, nt as pn, o as mn, oa as hn, on as gn, oo as _n, ot as vn, pa as yn, pi as bn, pt as xn, q as Sn, qa as Cn, qi as wn, qt as Tn, r as En, ra as Dn, ro as On, rt as kn, s as An, sa as jn, sn as Mn, so as Nn, sr as Pn, st as Fn, t as In, to as Ln, tt as Rn, ui as zn, un as Bn, ut as Vn, v as Hn, va as Un, vi as Wn, vn as Gn, vt as Kn, w as qn, wi as Jn, wn as Yn, wo as Xn, wt as Zn, xa as Qn, xi as $n, xn as er, xt as tr, y as nr, ya as rr, yi as ir, yn as ar, yt as or, z as sr, za as X, zi as Z, zn as Q, zr as $, zt as cr } from "./plot-area-frame-DNYMd9Pf.js";
import { c as lr, f as ur, l as dr, o as fr, s as pr, u as mr } from "./pixel-budget-DI82Hn3R.js";
import { a as hr, i as gr, r as _r, t as vr } from "./tiff-contract-DEd8CGuz.js";
import { n as yr } from "./raster-target-Ca3tyA0L.js";
import { a as br, d as xr, f as Sr, i as Cr, l as wr, m as Tr, n as Er, o as Dr, p as Or, u as kr, v as Ar, y as jr } from "./three-d-BfMZVR0w.js";
var Mr = 7;
function Nr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.dataPointOverrides ?? []) t.has(n.idx) || t.set(n.idx, n);
	return t;
}
function Pr(e, t) {
	return e.chartexFormatIdx ?? t;
}
function Fr(e) {
	return e != null && Number.isFinite(e) && e !== 0;
}
function Ir(e) {
	return e === "line" || e === "stackedLine" || e === "stackedLinePct" || e === "scatter" || e === "radar" || e === "stock";
}
function Lr(e, t, n = 4 / 3, r, i = !1) {
	if (i || e.series.length === 0) return null;
	let a = Nt(e), o = ge(e), s = L(e, !0), c = e.series.some((t, n) => bn(e.chartType, a[n]) === "scatter" && (t.categories ?? e.categories).some((e) => Number.isFinite(Number.parseFloat(e)))), l = e.dataTable?.showKeys === !0 && zt(e.chartType) && (e.categories.length > 0 || e.series.some((e) => (e.categories?.length ?? e.values.length) > 0)), u = 0, d = (e, i = r?.w ?? 1, a = r?.h ?? 1) => {
		if (e == null) return !0;
		let o = e.fillType === "image" ? An(e, t, i, a, n) : h(e);
		return e.fillType === "gradient" && o > 4096 || o > 1048576 - u ? !1 : (u += o, !0);
	}, f = (t, n, i, a, o = "dataPoint", s = o === "dataPoint", c = r?.w ?? 1, l = r?.h ?? 1) => (!s || d(le(e, t, n, i, a), c, l)) && d(je(e, o, t, n, i).paint, c, l), p = (t, r, i, a, o) => {
		let s = en(e.dataTable?.fontSizeHpt, n) ?? 9 * n, c = en(t.seriesDataLabels?.fontSizeHpt ?? e.dataLabelFontSizeHpt, n) ?? 10 * n;
		for (let e of t.dataLabelOverrides ?? []) c = Math.max(c, en(e.fontSizeHpt, n) ?? c);
		let l = a === "table" ? s : a === "label" ? c : en(e.legendFontSizeHpt, n) ?? 10 * n;
		if (a === "table") return {
			width: Math.max(12 * n, l * 1.7),
			height: l
		};
		if (o !== "dataPointLine") {
			let e = Mr * n;
			return {
				width: e,
				height: e
			};
		}
		let u = je(e, o, t, r, i), d = it(u.widthEmu, n), f = $(u.dash ?? "solid", d), p = f.length > 0 ? f.reduce((e, t) => e + t, 0) + f[0] : 0;
		return {
			width: Math.max(l * 1.6, p),
			height: l
		};
	};
	for (let t = 0; t < e.series.length; t++) {
		let n = e.series[t], i = a[t], u = bn(n.seriesType ?? e.chartType, i);
		i?.kind === "bar3D" || i?.kind === "area3D" || i?.kind === "line3D" ? u = e.chartType : i?.kind === "pie3D" && (u = "pie");
		let d = Nr(n), m = Wt(e, t), h = Pr(n, t), g = (e) => m ? e : h, _ = i?.kind === "bar" || i?.kind === "bar3D" || i == null && (u === "clusteredBar" || u === "clusteredBarH" || u === "stackedBar" || u === "stackedBarH" || u === "stackedBarPct" || u === "stackedBarHPct"), v = i?.kind === "pie" || i?.kind === "pie3D" || i?.kind === "doughnut" || i?.kind === "ofPie" || i == null && (u === "pie" || u === "doughnut" || u === "ofPie"), y = i?.kind === "area" || i?.kind === "area3D" || i == null && (u === "area" || u === "stackedArea" || u === "stackedAreaPct"), b = u === "radar" && (i?.radarStyle ?? e.radarStyle) === "filled";
		if (_ || v) {
			let t = Math.max(1, n.values.length, e.categories.length), a = i?.barDirection === "bar" || u.endsWith("BarH") || u.endsWith("BarHPct"), o = _ && !a ? (r?.w ?? 1) / t : r?.w ?? 1, s = _ && a ? (r?.h ?? 1) / t : r?.h ?? 1;
			for (let e = 0; e < n.values.length; e++) if (Fr(n.values[e]) && !f(n, d.get(e), g(e), e, "dataPoint", !0, o, s)) return gn + 1;
			if (u === "ofPie") {
				let t = zn(e.ofPie, n.values), i = t == null ? void 0 : [...t].find((e) => Fr(n.values[e]));
				if (i != null && !f(n, d.get(i), g(i), i, "dataPoint", !0, r?.w ?? 1, r?.h ?? 1)) return gn + 1;
			}
		} else if ((y || b) && (b ? n.values.length >= 3 && n.values.every((e) => e != null && Number.isFinite(e)) : n.values.length > 0) && !f(n, void 0, h, void 0)) return gn + 1;
		let x = i?.kind === "bubble" || i == null && e.chartType === "bubble", S = u !== "scatter" || !x;
		if (Ir(u) && !b && S) {
			if (m && u !== "stock") {
				let t = u === "stackedLine" || u === "stackedLinePct" || i?.kind === "line" && (i.grouping === "stacked" || i.grouping === "percentStacked") || u === "line" && e.dispBlanksAs === "zero", r = !t && e.dispBlanksAs === "span", a = [], o = () => {
					for (let e = 1; e < a.length; e++) {
						let t = a[e];
						if (!f(n, d.get(t), t, t, "dataPointLine", !1)) return !1;
					}
					if (u === "radar" && a.length > 1) {
						let e = a[0];
						if (!f(n, d.get(e), e, e, "dataPointLine", !1)) return !1;
					}
					return a = [], !0;
				};
				for (let e = 0; e < n.values.length; e++) {
					if (n.sourceHidden?.[e] === !0) {
						if (!o()) return gn + 1;
						continue;
					}
					let i = n.values[e];
					if (i != null && Number.isFinite(i) || t) a.push(e);
					else if (!r && !o()) return gn + 1;
				}
				if (!o()) return gn + 1;
			} else if (!f(n, void 0, h, void 0, "dataPointLine", !1)) return gn + 1;
		}
		let C = v || m, w = Wn(e, n, u, Math.max(n.values.length, n.categories?.length ?? 0, e.categories.length), c, {
			chartType: bn(e.chartType, i),
			bubbleScale: i?.bubbleScale ?? e.bubbleScale,
			showNegativeBubbles: i?.showNegativeBubbles ?? e.showNegativeBubbles
		}, t), T = Me(s, o, t);
		if (u !== "bubble" && (e.showLegend && T || l || w > 0)) {
			let r = Ir(u) ? "dataPointLine" : "dataPoint", a = r === "dataPoint", m = (e, t, i, o) => {
				let s = p(n, t, i, e, r);
				return f(n, t, i, o, r, a, s.width, s.height);
			};
			if (C) {
				let r = Math.max(n.values.length, n.categories?.length ?? 0, e.categories.length), a = new Map((n.dataLabelOverrides ?? []).map((e) => [e.idx, e]));
				for (let l = 0; l < r; l++) {
					let r = g(l), f = d.get(l), p = a.get(l), h = !F(n.seriesDataLabels, p) && (p?.showLegendKey ?? n.seriesDataLabels?.showLegendKey ?? !1) === !0 && ut(e, n, u, l, c, {
						chartType: bn(e.chartType, i),
						bubbleScale: i?.bubbleScale ?? e.bubbleScale,
						showNegativeBubbles: i?.showNegativeBubbles ?? e.showNegativeBubbles
					});
					if (e.showLegend && k(s, o, t, l) && !m("legend", f, r, l) || h && !m("label", f, r, l)) return gn + 1;
				}
				let f = d.get(0);
				if (l && !m("table", f, g(0), 0)) return gn + 1;
			} else {
				if (e.showLegend && T && !m("legend", void 0, h, void 0) || l && !m("table", void 0, h, void 0)) return gn + 1;
				for (let e = 0; e < w; e++) if (!m("label", void 0, h, void 0)) return gn + 1;
			}
		}
	}
	let m = (t, n) => {
		let i = t[0], a = t.at(-1);
		if (!i || !a) return !0;
		let o = Math.max(i.values.length, a.values.length);
		for (let t = 0; t < o; t++) {
			let s = i.values[t], c = a.values[t];
			if (s == null || c == null || !Number.isFinite(s) || !Number.isFinite(c) || s === c) continue;
			let l = c > s ? "upBar" : "downBar", u = c > s ? n.up : n.down, f = e.chartType.endsWith("BarH") || e.chartType.endsWith("BarHPct"), p = f ? r?.w ?? 1 : (r?.w ?? 1) / o, m = f ? (r?.h ?? 1) / o : r?.h ?? 1;
			if (!d(qe(e, u, l), p, m)) return !1;
		}
		return !0;
	};
	for (let t of e.lineGroupDecorations ?? []) {
		if (!t.upDownBars) continue;
		let n = e.series.filter((e) => e.lineGroupIndex === t.groupIndex);
		if (n.length === 0 && t.groupIndex === 0 && (n = e.series), !m(n, t.upDownBars)) return gn + 1;
	}
	if (e.stockUpDownBars) {
		let t = e.plotGroups?.find((e) => e.kind === "stock");
		if (!m(t ? e.series.slice(t.seriesStart, t.seriesStart + t.seriesCount) : e.series, e.stockUpDownBarStyle ?? {
			gapWidthPercent: 150,
			up: {},
			down: {}
		})) return gn + 1;
	}
	return u;
}
function Rr(e, t, n = 4 / 3, r, i = !1) {
	return Ct(() => De(() => Lr(e, t, n, r, i)));
}
var zr = class e extends Error {
	codec;
	code = "ooxml-optional-image-codec-unavailable";
	constructor(t) {
		super(`${t.toUpperCase()} image requires an optional codec`), this.codec = t, this.name = "OptionalImageCodecUnavailableError", Object.setPrototypeOf(this, e.prototype);
	}
};
function Br(e, t) {
	if (typeof e != "object" || !e) return !1;
	try {
		let n = e;
		return n.code === "ooxml-optional-image-codec-unavailable" && n.codec === "tiff" && (t === void 0 || n.codec === t);
	} catch {
		return !1;
	}
}
var Vr = {
	tiff: "TIFF image unavailable",
	pict: "PICT image unsupported",
	equation: "Equation unavailable"
};
function Hr(e, t, n, r) {
	if (![
		n.x,
		n.y,
		n.width,
		n.height
	].every(Number.isFinite) || n.width <= 0 || n.height <= 0) return;
	let i = (n, r, i, a) => {
		e.save();
		try {
			e.fillStyle = "#888", e.font = "11px sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText(Vr[t], n + i / 2, r + a / 2, i);
		} finally {
			e.restore();
		}
	};
	if (!r) {
		i(n.x, n.y, n.width, n.height);
		return;
	}
	let a = v(n.width, n.height, null, r.transform);
	xe(e, n.x, n.y, a, i);
}
function Ur(e) {
	let t = e.close;
	typeof t == "function" && t.call(e);
}
function Wr(e, t) {
	return e[t] << 8 | e[t + 1];
}
function Gr(e, t) {
	return (e[t] << 24 | e[t + 1] << 16 | e[t + 2] << 8 | e[t + 3]) >>> 0;
}
function Kr(e, t) {
	return e[t] | e[t + 1] << 8;
}
function qr(e, t) {
	return e[t] | e[t + 1] << 8 | e[t + 2] << 16 | e[t + 3] << 24 | 0;
}
function Jr(e) {
	let t = e.length;
	return t >= 24 && e[0] === 137 && e[1] === 80 && e[2] === 78 && e[3] === 71 && e[4] === 13 && e[5] === 10 && e[6] === 26 && e[7] === 10 ? e[12] === 73 && e[13] === 72 && e[14] === 68 && e[15] === 82 ? {
		width: Gr(e, 16),
		height: Gr(e, 20)
	} : null : t >= 10 && e[0] === 71 && e[1] === 73 && e[2] === 70 && e[3] === 56 && (e[4] === 55 || e[4] === 57) && e[5] === 97 ? {
		width: Kr(e, 6),
		height: Kr(e, 8)
	} : t >= 26 && e[0] === 66 && e[1] === 77 ? Yr(e, 14) === 12 ? {
		width: Kr(e, 18),
		height: Kr(e, 20)
	} : {
		width: Math.abs(qr(e, 18)),
		height: Math.abs(qr(e, 22))
	} : t >= 16 && e[0] === 82 && e[1] === 73 && e[2] === 70 && e[3] === 70 && e[8] === 87 && e[9] === 69 && e[10] === 66 && e[11] === 80 ? Xr(e) : t >= 4 && e[0] === 255 && e[1] === 216 ? ei(e) : t >= 4 && (e[0] === 73 && e[1] === 73 || e[0] === 77 && e[1] === 77) ? hr(e) : null;
}
function Yr(e, t) {
	return (e[t] | e[t + 1] << 8 | e[t + 2] << 16 | e[t + 3] << 24) >>> 0;
}
function Xr(e) {
	let t = e.length, n = e[12], r = e[13], i = e[14], a = e[15];
	if (n === 86 && r === 80 && i === 56 && a === 32) return t < 30 ? null : {
		width: Kr(e, 26) & 16383,
		height: Kr(e, 28) & 16383
	};
	if (n === 86 && r === 80 && i === 56 && a === 76) {
		if (t < 25 || e[20] !== 47) return null;
		let n = Yr(e, 21);
		return {
			width: (n & 16383) + 1,
			height: (n >>> 14 & 16383) + 1
		};
	}
	return n === 86 && r === 80 && i === 56 && a === 88 ? t < 30 ? null : {
		width: (e[24] | e[25] << 8 | e[26] << 16) + 1,
		height: (e[27] | e[28] << 8 | e[29] << 16) + 1
	} : null;
}
function Zr(e) {
	return e.length >= 6 && e[0] === 69 && e[1] === 120 && e[2] === 105 && e[3] === 102 && e[4] === 0 && e[5] === 0;
}
function Qr(e) {
	if (e.length < 14 || !Zr(e)) return null;
	let t = e[6] === 73 && e[7] === 73, n = e[6] === 77 && e[7] === 77;
	if (!t && !n) return null;
	let r = new DataView(e.buffer, e.byteOffset, e.byteLength);
	if (r.getUint16(8, t) !== 42) return null;
	let i = r.getUint32(10, t), a = 6 + i;
	if (i < 8 || a + 2 > e.length) return null;
	let o = r.getUint16(a, t), s = a + 2, c = Math.min(o, Math.floor((e.length - s) / 12));
	for (let e = 0; e < c; e++) {
		let n = s + e * 12;
		if (r.getUint16(n, t) !== 274 || r.getUint16(n + 2, t) !== 3 || r.getUint32(n + 4, t) !== 1) continue;
		let i = r.getUint16(n + 8, t);
		if (i >= 1 && i <= 8) return i;
	}
	return null;
}
function $r(e, t) {
	return t !== null && t >= 5 && t <= 8 ? {
		width: e.height,
		height: e.width
	} : e;
}
function ei(e) {
	let t = e.length, n = 2, r = null, i = !1, a = null;
	for (; n + 1 < t;) {
		if (e[n] !== 255) {
			n += 1;
			continue;
		}
		let o = e[n + 1];
		if (o === 255) {
			n += 1;
			continue;
		}
		if (o === 216 || o === 1 || o >= 208 && o <= 215) {
			n += 2;
			continue;
		}
		if (o === 217 || o === 218) return a ? $r(a, r) : null;
		if (n + 3 >= t) return null;
		let s = Wr(e, n + 2);
		if (o >= 192 && o <= 207 && o !== 196 && o !== 200 && o !== 204) {
			if (s < 7 || n + 8 >= t) return null;
			let r = Wr(e, n + 5), i = Wr(e, n + 7);
			a ??= {
				width: i,
				height: r
			};
		}
		if (s < 2) return null;
		let c = n + 2 + s;
		if (c > t) return a ? $r(a, r) : null;
		if (o === 225 && !i) {
			let t = e.subarray(n + 4, c);
			Zr(t) && (i = !0, r = Qr(t));
		}
		n = c;
	}
	return a ? $r(a, r) : null;
}
function ti(e) {
	let { width: t, height: n } = e;
	return !Number.isFinite(t) || !Number.isFinite(n) || t <= 0 || n <= 0 || t > 32767 || n > 32767 ? !0 : t * n > pr;
}
function ni(e) {
	let { width: t, height: n } = e;
	return !Number.isFinite(t) || !Number.isFinite(n) || t <= 0 || n <= 0 || t > 134217728 || n > 134217728 ? !0 : t * n > dr;
}
function ri(e) {
	switch (e.split(";", 1)[0]?.trim().toLowerCase()) {
		case "image/png":
		case "image/jpeg":
		case "image/jpg":
		case "image/gif":
		case "image/bmp":
		case "image/x-ms-bmp":
		case "image/webp": return !0;
		default: return !1;
	}
}
function ii(e, t = !1) {
	return e !== null && e !== "wmf" && e !== "emf" && (e !== "tiff" || t);
}
var ai = 64 * 1024;
function oi(e) {
	return Jt(e) ? "wmf" : o(e) ? "emf" : e.length >= 8 && e[0] === 137 && e[1] === 80 && e[2] === 78 && e[3] === 71 && e[4] === 13 && e[5] === 10 && e[6] === 26 && e[7] === 10 ? "png" : e.length >= 2 && e[0] === 255 && e[1] === 216 ? "jpeg" : e.length >= 6 && e[0] === 71 && e[1] === 73 && e[2] === 70 && e[3] === 56 && (e[4] === 55 || e[4] === 57) && e[5] === 97 ? "gif" : e.length >= 2 && e[0] === 66 && e[1] === 77 ? "bmp" : e.length >= 12 && e[0] === 82 && e[1] === 73 && e[2] === 70 && e[3] === 70 && e[8] === 87 && e[9] === 69 && e[10] === 66 && e[11] === 80 ? "webp" : _r(e) ? "tiff" : null;
}
function si(e) {
	return e >= 192 && e <= 207 && e !== 196 && e !== 200 && e !== 204;
}
async function ci(e) {
	let t = e.slice(2).stream().getReader(), n = !1, r = -1, i = -1, a = 0, o = null, s = 0, c = 0, l = null, u = null, d = 0, f = null, p = !1;
	try {
		for (;;) {
			let { value: e, done: m } = await t.read();
			if (m) return l ? $r(l, f) : null;
			for (let m of e) {
				if (o) {
					if (o[s++] = m, s === o.length) {
						let e = o[1] << 8 | o[2], n = o[3] << 8 | o[4];
						if (l ??= {
							width: n,
							height: e
						}, o = null, s = 0, p) return await t.cancel(), $r(l, f);
						a = c, c = 0;
					}
					continue;
				}
				if (u) {
					if (u[d++] = m, d === u.length && (Zr(u) && (p = !0, f = Qr(u)), u = null, d = 0, p && l)) return await t.cancel(), $r(l, f);
					continue;
				}
				if (a > 0) {
					a--;
					continue;
				}
				if (r >= 0) {
					if (i < 0) {
						i = m;
						continue;
					}
					let e = i << 8 | m;
					if (e < 2) return null;
					if (si(r)) {
						if (e < 7) return null;
						l ? a = e - 2 : (o = new Uint8Array(5), s = 0, c = e - 7);
					} else r === 225 && !p && e > 2 ? (u = new Uint8Array(e - 2), d = 0) : a = e - 2;
					r = -1, i = -1;
					continue;
				}
				if (!n) {
					m === 255 && (n = !0);
					continue;
				}
				if (m !== 255 && (n = !1, m !== 0)) {
					if (m === 217 || m === 218) return await t.cancel(), l ? $r(l, f) : null;
					m === 216 || m === 1 || m >= 208 && m <= 215 || (r = m);
				}
			}
		}
	} finally {
		t.releaseLock();
	}
}
async function li(e, t) {
	if (t.length < 8 || !_r(t)) return null;
	let n = t[0] === 73, r = new DataView(t.buffer, t.byteOffset, t.byteLength).getUint32(4, n);
	if (!Number.isSafeInteger(r) || r < 8 || r > e.size - 2) return null;
	let i = new Uint8Array(await e.slice(r, r + 2).arrayBuffer());
	if (i.length !== 2) return null;
	let a = new DataView(i.buffer, i.byteOffset, 2).getUint16(0, n), o = a * 12;
	if (r + 2 + o > e.size) return null;
	let s = new Uint8Array(await e.slice(r + 2, r + 2 + o).arrayBuffer()), c = new DataView(s.buffer, s.byteOffset, s.byteLength), l, u;
	for (let e = 0; e < a; e++) {
		let t = e * 12, r = c.getUint16(t, n);
		if (r !== 256 && r !== 257) continue;
		let i = c.getUint16(t + 2, n);
		if (c.getUint32(t + 4, n) !== 1 || i !== 1 && i !== 3 && i !== 4) return null;
		let a = i === 1 ? c.getUint8(t + 8) : i === 3 ? c.getUint16(t + 8, n) : c.getUint32(t + 8, n);
		r === 256 ? l = a : u = a;
	}
	return l === void 0 || u === void 0 ? null : {
		width: l,
		height: u
	};
}
async function ui(e, t) {
	let n = t ?? new Uint8Array(await e.slice(0, ai).arrayBuffer()), r = oi(n);
	if (!r) return {
		format: null,
		dimensions: null
	};
	let i = Jr(n);
	return r === "jpeg" ? {
		format: r,
		dimensions: await ci(e) ?? i
	} : i ? {
		format: r,
		dimensions: i
	} : r === "tiff" ? {
		format: r,
		dimensions: await li(e, n)
	} : {
		format: r,
		dimensions: null
	};
}
var di = () => import("./emf--QWY-UlT.js"), fi = class e extends Error {
	format;
	unsupported;
	code = "ooxml-incomplete-metafile";
	constructor(t, n) {
		super(`OOXML ${t} metafile could not be fully played: ${n.join(", ")}`), this.format = t, this.unsupported = n, this.name = "OoxmlIncompleteMetafileError", Object.setPrototypeOf(this, e.prototype);
	}
};
function pi(e) {
	if (!e || typeof e != "object") return !1;
	try {
		let t = e;
		return t.code === "ooxml-incomplete-metafile" && Array.isArray(t.unsupported);
	} catch {
		return !1;
	}
}
var mi = /* @__PURE__ */ new WeakMap();
function hi(e, t) {
	if (!e || !t || e === t) return;
	let n = mi.get(e);
	n && mi.set(t, n);
}
function gi(e, t, n, r = "emf") {
	if (t.length === 0) return e;
	if (n === "reject") throw e && Ur(e), new fi(r, t);
	return e && mi.set(e, {
		format: r,
		unsupported: t
	}), e;
}
function _i(e, t) {
	return e.width <= 0 || e.height <= 0 || e.width > 32767 || e.height > 32767 || e.width * e.height > t;
}
function vi(e) {
	let t = e.split(";", 1)[0]?.trim().toLowerCase();
	return t === "image/tiff" || t === "image/x-tiff";
}
function yi(e, t, n, r = !1) {
	let i = {
		retainedDimensions: e,
		resizeOptions: null
	}, a = yr(e, typeof t == "number" && Number.isFinite(t) && t > 0 ? t : void 0, typeof n == "number" && Number.isFinite(n) && n > 0 ? n : void 0, r);
	return a ? {
		retainedDimensions: a,
		resizeOptions: {
			resizeWidth: a.width,
			resizeHeight: a.height,
			resizeQuality: "high"
		}
	} : i;
}
function bi(e, t, n) {
	let r = Math.max(e.width, e.height);
	if (!Number.isFinite(r) || r > t) return new mr("image-dimension", t, Number.isFinite(r) ? r : 2 ** 53 - 1);
	let i = e.width * e.height;
	return new mr("image-pixels", n, Number.isSafeInteger(i) && i >= 0 ? i : 2 ** 53 - 1);
}
async function xi(e, t = {}) {
	return Si(e, t);
}
async function Si(e, t = {}, n) {
	let { widthPt: r = 0, heightPt: i = 0, tiff: a, targetWidthPx: s, targetHeightPx: c, maxRetainedPixels: l = pr, incompleteMetafile: u = "draw-supported" } = t, d = Number.isSafeInteger(l) && l > 0 ? Math.min(l, pr) : pr, f = new Uint8Array(await e.slice(0, 64 * 1024).arrayBuffer());
	if (Jt(f)) {
		let { w: t, h: n } = _e(r, i), a = [];
		return Ci(gi(await me(new Uint8Array(await e.arrayBuffer()), t, n, (e) => {
			a = e;
		}), a, u, "wmf"), d);
	}
	if (o(f)) {
		let { w: t, h: n } = _e(r, i), { renderEmfToBitmap: a } = await di(), o = await a(new Uint8Array(await e.arrayBuffer()), t, n);
		return Ci(gi(o.bitmap, o.unsupported, u), d);
	}
	let p = (n ?? await ui(e, f)).dimensions;
	if (p && ni(p)) throw bi(p, lr, dr);
	let m = _r(f) || vi(e.type), h = p ? yi(p, s, c, m) : null;
	if (h && _i(h.retainedDimensions, d)) throw bi(h.retainedDimensions, fr, d);
	if (m) {
		if (!a) throw new zr("tiff");
		let t;
		try {
			t = await a.render(new Uint8Array(await e.arrayBuffer()), {
				targetWidthPx: s,
				targetHeightPx: c,
				maxRetainedPixels: d
			});
		} catch (e) {
			throw ur(e) || gr(e) ? e : new vr("TIFF codec failed to decode the image", { cause: e });
		}
		if (!t) throw new vr("TIFF codec failed to decode the image");
		return Ci(t, d);
	}
	return Ci(h?.resizeOptions ? await createImageBitmap(e, h.resizeOptions) : await createImageBitmap(e), d);
}
function Ci(e, t = pr) {
	if (!e) return null;
	let n = {
		width: Number(e.width),
		height: Number(e.height)
	};
	if (!_i(n, t)) return e;
	throw Ur(e), bi(n, fr, t);
}
function wi(e) {
	return e instanceof _ || e instanceof Xn || ur(e) || gr(e) || Br(e) || pi(e) ? e : new _("unsupported-image-effect", "Image effect preparation or evaluation failed");
}
var Ti = Mn, Ei = gn, Di = Ti, Oi = Ei, ki = new Set([
	"pie",
	"line",
	"stackedLine",
	"stackedLinePct",
	"area",
	"stackedArea",
	"stackedAreaPct",
	"clusteredBar",
	"clusteredBarH",
	"stackedBar",
	"stackedBarH",
	"stackedBarPct",
	"stackedBarHPct"
]);
function Ai(e, t, n, r, i) {
	return P(t, n, r);
}
function ji(e, t, n, r) {
	if (!t.length) return null;
	let i = e.chartexColorStyleMethod;
	return i === "withinLinear" || i === "acrossLinear" || i === "withinLinearReversed" || i === "acrossLinearReversed" ? t[i === "withinLinear" || i === "withinLinearReversed" ? 0 : n % t.length] ?? null : t[n % t.length] ?? null;
}
function Mi(e, t, n) {
	return (e.chartexColorPalette ? ji(e, e.chartexColorPalette, t, n) : null) ?? e.chartexAccents?.[t % (e.chartexAccents.length || 1)] ?? Te[t % Te.length];
}
function Ni(e, t, n, r) {
	return Ai(e, r, "fill", t, n) ?? Ai(e, e.chartexDataPointStyle, "fill", t, n) ?? Mi(e, t, n);
}
function Pi(e, t, n, r) {
	return Qe(t, n);
}
function Fi(e, t, n, r) {
	return ie(t, n);
}
function Ii(e, t, n, r, i, a) {
	let o = a === e.chartexDataPointMarkerStyle ? "dataPointMarker" : a === e.chartexDataPointStyle ? "dataPoint" : Object.entries(e.chartStyleRoles ?? {}).find(([, e]) => e === a)?.[0], s = We(r, o ? Nn(e, o) ?? (e.classicChartStyleRoles == null ? a : void 0) : a, t);
	if (s !== void 0) return s;
	if (i) return {
		fillType: "solid",
		color: i
	};
	let c = Fi(e, a, t, n);
	return c === void 0 ? {
		fillType: "solid",
		color: Mi(e, t, n)
	} : c;
}
function Li(e, t, n, r, i, a = e.chartexDataPointStyle) {
	let o = ie(r, t);
	if (o !== void 0) return o;
	if (r && i || i) return {
		fillType: "solid",
		color: i
	};
	let s = ie(a, t);
	return s === void 0 ? {
		fillType: "solid",
		color: Mi(e, t, n)
	} : s;
}
function Ri(e, t, n, r, i, a, o, s = 0) {
	return t.fillType === "solid" ? t.color.startsWith("#") ? t.color : `#${t.color}` : Pn(t, e, n, r, i, a, s) ?? o;
}
function zi(e, t, n, r, i, a = 0) {
	if (t === null) return !1;
	if (t?.fillType === "image") {
		e.save(), e.clip();
		let r = Hn(e, t, n.x, n.y, n.w, n.h, i, a);
		return e.restore(), r;
	}
	return e.fillStyle = t ? Ri(e, t, n.x, n.y, n.w, n.h, r, a) : r, e.fill(), !0;
}
function Bi(e, t, n, r, i, a = 0) {
	return t === null || !(n.w > 0) || !(n.h > 0) ? !1 : t?.fillType === "image" ? (e.beginPath(), e.rect(n.x, n.y, n.w, n.h), zi(e, t, n, r, i, a)) : (e.fillStyle = t ? Ri(e, t, n.x, n.y, n.w, n.h, r, a) : r, e.fillRect(n.x, n.y, n.w, n.h), !0);
}
function Vi(e, t, n, r, i, a, o = {}) {
	let s = n?.chartexStyle, c = Qe(s, r), l = n?.lineHidden === !0 ? null : void 0, u = n?.lineColor != null || l !== void 0, d = Qe(t, r), f = c === void 0 ? u ? l === void 0 ? {
		fillType: "solid",
		color: n?.lineColor ?? a
	} : l : d === void 0 ? void 0 : d : c, p = f === void 0 && t?.lineNoStyle === !0 && o.linkedNoStyleFallback !== !0;
	return {
		semanticFallback: f === void 0,
		visible: f !== null && !p,
		color: f?.fillType === "solid" ? f.color : a,
		paint: f?.fillType === "solid" ? void 0 : f,
		widthEmu: s?.lineWidthEmu ?? n?.lineWidthEmu ?? t?.lineWidthEmu ?? null,
		dash: s?.lineCustomDash == null ? s?.lineDash ?? t?.lineDash ?? null : null,
		customDash: s?.lineCustomDash ?? t?.lineCustomDash ?? null,
		cap: s?.lineCap ?? t?.lineCap ?? null,
		join: s?.lineJoin ?? t?.lineJoin ?? null
	};
}
var Hi = 9525;
function Ui(e, t, n, r, i, a = e.chartexDataPointStyle) {
	let o = l(e, t, n, r, a);
	return o === void 0 ? {
		fillType: "solid",
		color: Mi(e, r, i)
	} : o;
}
function Wi(e) {
	return e.paint != null && e.paint.fillType !== "solid";
}
function Gi(e, t) {
	let n = e?.chartexStyle, r = Qe(n, t);
	return !e || !r || r.fillType === "solid" ? e : {
		...e,
		lineColor: null,
		lineHidden: null,
		chartexStyle: {
			...n,
			linePaints: null,
			lineColors: null,
			lineColorIndex: null,
			linePaintAuthored: null,
			lineHidden: null
		}
	};
}
function Ki(e, t, n, r, i, a, o, s = {}) {
	t = Gi(t, i);
	let c = Vi(e, n[0], t, i, a, o, s);
	for (let t of n.slice(1)) {
		if (!c.semanticFallback) break;
		let n = Vi(e, t, null, i, a, o, s);
		n.semanticFallback || (c = n);
	}
	let l = t?.chartexStyle, u = l?.lineDash != null || l?.lineCustomDash != null, d = (c.semanticFallback ? n : r).find((e) => e != null && (e.lineWidthEmu != null || e.lineCap != null || e.lineJoin != null || e.lineDash != null || e.lineCustomDash != null || e.linePaintAuthored === !0 && e.lineNoStyle !== !0)), f = (e) => d ? e(d) ?? null : null, p = d;
	return {
		...c,
		widthEmu: l?.lineWidthEmu ?? t?.lineWidthEmu ?? f((e) => e.lineWidthEmu),
		dash: u ? l?.lineCustomDash == null ? l?.lineDash ?? null : null : p?.lineCustomDash == null ? p?.lineDash ?? null : null,
		customDash: u ? l?.lineCustomDash ?? null : p?.lineCustomDash ?? null,
		cap: l?.lineCap ?? f((e) => e.lineCap),
		join: l?.lineJoin ?? f((e) => e.lineJoin)
	};
}
function qi(e, t, n, r, i, a, o = e.chartexDataPointStyle, s = {}) {
	let c = o === e.chartexDataPointStyle ? [o, e.chartexDataPointLineStyle] : [o];
	if (n = Gi(n, r), !X(n)) return Ki(e, t, [o], c, r, i, a, s);
	let l = n?.chartexStyle, u = t?.chartexStyle, d = l?.lineDash != null || l?.lineCustomDash != null, f = n?.lineColor != null || n?.lineHidden === !0 || l?.linePaintAuthored === !0 || l?.lineHidden === !0 || l?.linePaints?.some((e) => e != null) === !0 || l?.lineColors?.some((e) => e != null) === !0 ? {
		lineColor: n?.lineColor,
		lineHidden: n?.lineHidden,
		style: l
	} : {
		lineColor: t?.lineColor,
		lineHidden: t?.lineHidden,
		style: u
	};
	return Ki(e, {
		lineColor: f.lineColor,
		lineHidden: f.lineHidden,
		lineWidthEmu: n?.lineWidthEmu ?? t?.lineWidthEmu,
		chartexStyle: {
			...l,
			linePaints: f.style?.linePaints,
			lineColors: f.style?.lineColors,
			lineColorIndex: f.style?.lineColorIndex,
			linePaintAuthored: f.style?.linePaintAuthored,
			lineHidden: f.style?.lineHidden,
			lineNoStyle: f.style?.lineNoStyle,
			lineWidthEmu: l?.lineWidthEmu ?? n?.lineWidthEmu ?? u?.lineWidthEmu ?? t?.lineWidthEmu,
			lineDash: d ? l?.lineDash : u?.lineDash,
			lineCustomDash: d ? l?.lineCustomDash : u?.lineCustomDash,
			lineCap: l?.lineCap ?? u?.lineCap,
			lineJoin: l?.lineJoin ?? u?.lineJoin
		}
	}, [o], c, r, i, a, s);
}
function Ji(e, t, n, r, i = 0) {
	if (!t.visible) return !1;
	if (t.paint && t.paint.fillType !== "solid" && r) {
		let n = Pn(t.paint, e, r.x, r.y, r.w, r.h, i);
		if (!n) return !1;
		e.strokeStyle = n;
	} else e.strokeStyle = t.color.startsWith("#") ? t.color : `#${t.color}`;
	return e.lineWidth = t.widthEmu == null ? t.semanticFallback ? 1 : it(Hi, n) : it(t.widthEmu, n), e.setLineDash(Zn(t.customDash, t.dash, e.lineWidth)), e.lineCap = t.cap === "rnd" ? "round" : t.cap === "sq" ? "square" : "butt", e.lineJoin = t.join === "round" || t.join === "bevel" ? t.join : "miter", !0;
}
function Yi(e, t, n, r, i, a, o, s, c = {}) {
	return Ji(e, Vi(t, n, r, i, a, o, c), s);
}
function Xi(e, t, n, r, i, a, o, s = !1, c = !0, l = !1) {
	let u = Ki(e, n, [r], r === e.chartexDataPointStyle ? [r, e.chartexDataPointLineStyle] : [r], i, a, o, { linkedNoStyleFallback: s }), d = c && !(l && Wi(u));
	return {
		...p(t, n ?? void 0),
		color: o.replace(/^#/, ""),
		lineHidden: !d || !u.visible,
		lineColor: d && u.visible ? u.color.replace(/^#/, "") : null,
		lineWidthEmu: d ? u.widthEmu ?? (u.visible && !u.semanticFallback ? 9525 : null) : null,
		chartexStyle: {
			linePaints: d && u.paint !== void 0 ? [u.paint] : null,
			linePaintAuthored: d && u.paint !== void 0 ? !0 : null,
			lineDash: d ? u.dash : null,
			lineCustomDash: d ? u.customDash : null,
			lineCap: d ? u.cap : null,
			lineJoin: d ? u.join : null
		}
	};
}
var Zi = .8;
function Qi(e, t, n, r, i) {
	let a = e.chartexDataPointStyle, o = Gi(t, n), s = qi(e, o, void 0, n, r, i, a, { linkedNoStyleFallback: !0 }), c = o != null && (o.lineColor != null || o.lineHidden === !0 || Qe(o.chartexStyle, n) !== void 0), l = Qe(a, n), u = ie(a, n);
	if (c || !s.visible || s.paint != null || l?.fillType !== "solid" || u?.fillType !== "solid") return {
		line: s,
		darkened: !1
	};
	let d = (e) => e.replace(/^#/, "").toUpperCase(), f = d(l.color);
	if (!/^[0-9A-F]{6}$/.test(f) || f !== d(u.color)) return {
		line: s,
		darkened: !1
	};
	let p = (e) => Math.round(parseInt(f.slice(e, e + 2), 16) * Zi).toString(16).padStart(2, "0");
	return {
		line: {
			...s,
			color: `#${p(0)}${p(2)}${p(4)}`.toUpperCase()
		},
		darkened: !0
	};
}
function $i(e, t, n, r) {
	return $n(e, t, n, r);
}
function ea(e, n, r, i, a, o, s = sn(n, r)) {
	let c = n.bubbleSizes?.[i];
	if (c != null && Number.isFinite(c) && c < 0) return n.invertedFillHidden === !0 ? {
		color: "00000000",
		paint: null
	} : n.invertedFill ? {
		color: n.invertedFill.fillType === "solid" ? n.invertedFill.color : o,
		paint: n.invertedFill
	} : s ? {
		color: "FFFFFF",
		paint: void 0
	} : {
		color: "00000000",
		paint: null
	};
	let l = Nn(e, "dataPoint"), u = We(r?.chartexStyle, l, i);
	if (u !== void 0) return {
		color: u?.fillType === "solid" ? u.color : o,
		paint: u
	};
	let d = Math.max(0, On(e, n)), f = t(e, "dataPoint", d), p = Wt(e, d) ? i : a;
	if (r?.fillHidden === !0) {
		let e = ee(l);
		if (e !== void 0) return {
			color: "00000000",
			paint: e
		};
	}
	if (r?.color != null) return {
		color: r.color,
		paint: void 0
	};
	let m = n.dataPointColors?.[i];
	if (m != null) return {
		color: m,
		paint: void 0
	};
	let h = We(n.chartexStyle, l, a);
	if (h !== void 0) return {
		color: h?.fillType === "solid" ? h.color : o,
		paint: h
	};
	if (n.color != null) return {
		color: n.color,
		paint: void 0
	};
	let g = Fi(e, f, p, n.values.length);
	return g === void 0 ? {
		color: $i(n, r, i, o),
		paint: Le(n, r, i)
	} : {
		color: g?.fillType === "solid" ? g.color : o,
		paint: g
	};
}
function ta(e, n, r, i, a) {
	let o = r?.chartexStyle, s = n.chartexStyle, c = Math.max(0, On(e, n)), l = t(e, "dataPoint", c), u = Nn(e, "dataPoint"), d = Wt(e, c) ? i : a, f = l, p = [
		o,
		s,
		f
	], m = r?.lineDash, h;
	if (m == null) {
		for (let e of p) if (e?.lineDash != null || e?.lineCustomDash != null || e?.lineDashAuthored === !0) {
			m = e.lineDash, h = e.lineCustomDash ?? void 0;
			break;
		}
	}
	let g = {
		widthEmu: r?.lineWidthEmu ?? o?.lineWidthEmu ?? n.lineWidthEmu ?? s?.lineWidthEmu ?? f?.lineWidthEmu ?? r?.markerLineWidthEmu ?? n.markerLineWidthEmu,
		dash: m,
		customDash: h,
		cap: o?.lineCap ?? s?.lineCap ?? f?.lineCap,
		join: o?.lineJoin ?? s?.lineJoin ?? f?.lineJoin
	}, _ = Xe(o, u, i);
	if (_ !== void 0) return {
		color: _?.fillType === "solid" ? _.color : r?.lineColor ?? null,
		paint: _,
		...g
	};
	if (r?.lineHidden === !0) {
		let e = V(u);
		if (e !== void 0) return {
			color: null,
			paint: e,
			...g
		};
	}
	if (r?.lineColor != null) return {
		color: r.lineColor,
		paint: void 0,
		...g
	};
	let v = Xe(s, u, a);
	if (v !== void 0) return {
		color: v?.fillType === "solid" ? v.color : n.lineColor ?? null,
		paint: v,
		...g
	};
	if (n.lineHidden === !0) {
		let e = V(u);
		if (e !== void 0) return {
			color: null,
			paint: e,
			...g
		};
	}
	if (n.lineColor != null) return {
		color: n.lineColor,
		paint: void 0,
		...g
	};
	let y = Pi(e, l, d, n.values.length);
	if (y !== void 0) return {
		color: y?.fillType === "solid" ? y.color : null,
		paint: y,
		...g
	};
	let b = n.bubbleSizes?.[i], x = b != null && Number.isFinite(b) && b < 0 && sn(n, r) ? "000000" : null;
	return {
		color: r?.markerLine ?? n.markerLine ?? n.lineColor ?? x,
		paint: void 0,
		...g
	};
}
function na(e, t, n, r) {
	let i = e.globalCompositeOperation, a = e.fillStyle;
	e.save(), e.clip();
	let o = (i) => {
		e.globalCompositeOperation = "source-atop", e.fillStyle = i, e.fillRect(t - r / 2, n - r / 2, r, r);
	}, s = t - r * .08, c = n - r * .17, l = e.createRadialGradient(s, c, 0, s, c, r * .55);
	l.addColorStop(0, "rgba(255,255,255,0.72)"), l.addColorStop(.14, "rgba(255,255,255,0.48)"), l.addColorStop(.38, "rgba(255,255,255,0.1)"), l.addColorStop(1, "rgba(255,255,255,0)"), o(l);
	let u = t - r * .08, d = n - r * .18, f = e.createRadialGradient(u, d, 0, u, d, r * .78);
	f.addColorStop(0, "rgba(0,0,0,0)"), f.addColorStop(.3, "rgba(0,0,0,0)"), f.addColorStop(.46, "rgba(0,0,0,0.22)"), f.addColorStop(.66, "rgba(0,0,0,0.48)"), f.addColorStop(1, "rgba(0,0,0,0.62)"), o(f);
	let p = t - r * .2, m = n - r * .45, h = e.createRadialGradient(p, m, 0, p, m, r);
	h.addColorStop(0, "rgba(255,255,255,0)"), h.addColorStop(.76, "rgba(255,255,255,0)"), h.addColorStop(.82, "rgba(255,255,255,0.05)"), h.addColorStop(.87, "rgba(255,255,255,0.12)"), h.addColorStop(.95, "rgba(255,255,255,0.28)"), h.addColorStop(1, "rgba(255,255,255,0)"), o(h), e.globalCompositeOperation = i, e.fillStyle = a, e.restore();
}
function ra(e, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g = void 0, _ = void 0, v = void 0, y = void 0, b = void 0, x = !1, S = !1) {
	let C = S ? ue(i?.chartexStyle) : ue(i?.markerStyle, i?.chartexStyle), w = ue(S ? r.chartexStyle : r.markerStyle), T = C ?? w, E = Math.max(0, On(n, r)), D = r.chartexFormatIdx ?? E, O = Wt(n, E), k = C ? a : D, A = t(n, "dataPointMarker", E), j = Nn(n, "dataPointMarker"), ee = O ? a : D, M = We(i?.markerStyle, j, a), te = We(r.markerStyle, j, D), N = M !== void 0 || i?.markerFill != null || i?.markerFillPaintAuthored === !0 && i.markerStyle?.fillHidden !== !0, P = te !== void 0 || r.markerFill != null || r.markerFillPaintAuthored === !0 && r.markerStyle?.fillHidden !== !0, F = u, ne = m;
	if (!S && !N && !P) {
		let e = Cn(A, j, ee, i?.markerStyle?.shapePropertiesPresent === !0 ? i.markerStyle : r.markerStyle);
		e === null ? (F = "00000000", ne = null) : e?.fillType === "solid" ? (F = e.color, ne = void 0) : e !== void 0 && (ne = e);
	}
	let re = Xe(i?.markerStyle, j, a), I = Xe(r.markerStyle, j, D), L = d, R = g;
	if (!S && R === void 0) if (re !== void 0) R = re?.fillType === "solid" ? void 0 : re;
	else if (i?.markerLine != null) R = void 0;
	else if (i?.markerLinePaintAuthored === !0 && i.markerStyle?.lineHidden !== !0 && (i.markerLine == null || i.markerLine === "00000000")) R = null;
	else if (I !== void 0) R = I?.fillType === "solid" ? void 0 : I;
	else if (r.markerLine != null) R = void 0;
	else if (r.markerLinePaintAuthored === !0 && r.markerStyle?.lineHidden !== !0 && (r.markerLine == null || r.markerLine === "00000000")) R = null;
	else {
		let e = rt(A, j, ee, i?.markerStyle?.shapePropertiesPresent === !0 ? i.markerStyle : r.markerStyle);
		e?.fillType === "solid" ? (L = e.color, R = void 0) : (R = e, e === null && (L = null));
	}
	let z = S ? void 0 : A, ie = p ?? (() => {
		let e = i?.markerStyle?.lineWidthEmu ?? r.markerStyle?.lineWidthEmu ?? z?.lineWidthEmu;
		return e == null ? void 0 : it(e, f);
	})(), ae = pt(_ != null || v != null ? {
		lineDash: _,
		lineCustomDash: v,
		lineDashAuthored: !0
	} : void 0, i?.markerStyle, r.markerStyle, z), B = ae?.lineDash, V = ae?.lineCustomDash, oe = y ?? i?.markerStyle?.lineCap ?? r.markerStyle?.lineCap ?? z?.lineCap, se = b ?? i?.markerStyle?.lineJoin ?? r.markerStyle?.lineJoin ?? z?.lineJoin, ce = S ? t(n, x ? "dataPoint3D" : "dataPoint", E) : A, le = S && Wt(n, E) || O ? a : D;
	aa(e, o, s, c, l, F, L, f, ie, ne, h, R, B, V, oe, se, x, T, ce, k, le);
}
function ia(e, n, r = Math.max(0, On(e, n))) {
	return S(n) || t(e, "dataPointMarker", r) != null;
}
function aa(e, t, n, r, i, a, o, s, c = 1, l = void 0, u = 0, d = void 0, f = void 0, p = void 0, m = void 0, h = void 0, g = !1, _ = void 0, v = void 0, y = 0, b = y) {
	let x = Math.max(2, i * s), S = x / 2;
	if (_ !== void 0 || v !== void 0) {
		Ne(e, _, v, y, {
			x: t - S,
			y: n - S,
			w: x,
			h: x
		}, s, (e) => aa(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g), b);
		return;
	}
	let C = a.startsWith("#") ? a : `#${a}`, w = o ? o.startsWith("#") ? o : `#${o}` : null;
	e.save(), e.fillStyle = l === void 0 ? C : l == null ? "rgba(0,0,0,0)" : Pn(l, e, t - S, n - S, x, x, u) ?? "rgba(0,0,0,0)";
	let T = d === void 0 ? w : d == null ? null : Pn(d, e, t - S, n - S, x, x, u), E = T != null;
	T && (e.strokeStyle = T, e.lineWidth = c, e.setLineDash(Zn(p, f, c)), e.lineCap = m === "rnd" ? "round" : m === "sq" ? "square" : "butt", e.lineJoin = h === "round" || h === "bevel" ? h : "miter");
	let D = l?.fillType === "image" ? l : void 0, O = () => {
		if (!D) {
			l !== null && e.fill();
			return;
		}
		e.save(), e.clip(), Hn(e, D, t - S, n - S, x, x, s, u), e.restore();
	}, k = () => {
		g && l !== null && na(e, t, n, x);
	};
	switch (r) {
		case "square":
			D || g ? (e.beginPath(), e.rect(t - S, n - S, x, x), O(), k()) : l !== null && e.fillRect(t - S, n - S, x, x), E && e.strokeRect(t - S, n - S, x, x);
			break;
		case "diamond":
			e.beginPath(), e.moveTo(t, n - S), e.lineTo(t + S, n), e.lineTo(t, n + S), e.lineTo(t - S, n), e.closePath(), O(), k(), E && e.stroke();
			break;
		case "triangle":
			e.beginPath(), e.moveTo(t, n - S), e.lineTo(t + S, n + S), e.lineTo(t - S, n + S), e.closePath(), O(), k(), E && e.stroke();
			break;
		case "x":
			e.strokeStyle = T ?? e.fillStyle, e.lineWidth = Math.max(1, x * .18), e.beginPath(), e.moveTo(t - S, n - S), e.lineTo(t + S, n + S), e.moveTo(t - S, n + S), e.lineTo(t + S, n - S), e.stroke();
			break;
		case "plus":
			e.strokeStyle = T ?? e.fillStyle, e.lineWidth = Math.max(1, x * .18), e.beginPath(), e.moveTo(t - S, n), e.lineTo(t + S, n), e.moveTo(t, n - S), e.lineTo(t, n + S), e.stroke();
			break;
		case "star":
			e.beginPath();
			for (let r = 0; r < 10; r++) {
				let i = r % 2 == 0 ? S : S * .45, a = -Math.PI / 2 + r * Math.PI / 5, o = t + Math.cos(a) * i, s = n + Math.sin(a) * i;
				r === 0 ? e.moveTo(o, s) : e.lineTo(o, s);
			}
			e.closePath(), O(), k(), E && e.stroke();
			break;
		case "dot":
			e.beginPath(), e.ellipse(t, n, x * .25, x * .1, 0, 0, Math.PI * 2), O(), k(), E && e.stroke();
			break;
		case "dash": {
			let r = x * .2;
			D || g ? (e.beginPath(), e.rect(t - S, n - r / 2, x, r), O(), k()) : l !== null && e.fillRect(t - S, n - r / 2, x, r), E && e.strokeRect(t - S, n - r / 2, x, r);
			break;
		}
		case "picture":
			e.beginPath(), e.rect(t - S, n - S, x, x), D && Hn(e, D, t - S, n - S, x, x, s, u), k(), E && e.strokeRect(t - S, n - S, x, x), e.restore();
			return;
		default:
			e.beginPath(), e.arc(t, n, S, 0, Math.PI * 2), O(), k(), E && e.stroke();
			break;
	}
	e.restore();
}
function oa(e, t, n, r, i, a, o) {
	if (![
		n,
		r,
		i
	].every(Number.isFinite) || n <= 0 || r <= 0 || t.w <= 0 || t.h <= 0) return null;
	let s = Math.max(4, i * .5), c = Math.min(n, Math.max(0, t.w - s * 2)), l = Math.min(r, t.h), u = t.x + t.w * .75, d = {
		x: o ? Math.max(t.x, Math.min(t.x + t.w - c, u - c)) : Math.max(t.x, t.x + t.w - s - c),
		y: o ? Math.max(t.y, Math.min(t.y + t.h - l, o.y - l + i * .25)) : Math.min(t.y + t.h - l, t.y + s),
		w: c,
		h: l
	};
	if (a) {
		let t = yn(a, e, d);
		if (t) return {
			...t,
			automatic: !1
		};
	}
	return {
		...d,
		automatic: !0
	};
}
function sa(e, t) {
	return t && t.trim().toLowerCase() !== "general" ? g(e, t) : Re(Number(e.toPrecision(6)));
}
function ca(e, t, n) {
	if (e.labelText) return e.labelText.split(/\r?\n/);
	if (!t) return [];
	let r = e.labelFormatSourceLinked === !0 ? n : e.labelFormatCode, i = [];
	if (e.dispEq) {
		let e = t.intercept < 0 ? "−" : "+";
		i.push(`y = ${sa(t.slope, r)}x ${e} ${sa(Math.abs(t.intercept), r)}`);
	}
	return e.dispRSqr && i.push(`R² = ${sa(t.rSquared, r)}`), i;
}
function la(e, t, n, r, i, a) {
	if (!i) return;
	let o = ca(t, n, a);
	if (o.length === 0) return;
	let { chart: s, chartRect: c, plotRect: l } = i, u = en(t.labelFontSizeHpt, r) ?? en(s.dataLabelFontSizeHpt, r) ?? 10 * r, d = yt(s, t.labelFontFace ?? s.dataLabelFontFace, "minor"), f = t.labelFontBold ?? s.dataLabelFontBold ?? !1, p = t.labelFontItalic ?? !1;
	e.font = or(u, d, f, p);
	let h = u * 1.2, g = t.labelFontColor ?? s.dataLabelFontColor, _ = t.labelRichRuns?.length ? jr(e, {
		runs: t.labelRichRuns,
		ptToPx: r,
		fontFamily: d,
		fallbackBold: f,
		fallbackItalic: p,
		fallbackBaseline: t.labelFontBaseline ?? void 0,
		fallbackColorHidden: t.labelFontPaintAuthored === !0 && (t.labelFontHidden === !0 || t.labelFontColor == null),
		fontFamilyForFace: (e) => yt(s, e, "minor")
	}, u, g ? `#${g}` : "#595959") : null, v = _?.width ?? Math.max(...o.map((t) => e.measureText(t).width)), y = {
		fontColor: t.labelFontColor ?? void 0,
		fontItalic: p,
		fontPaintAuthored: t.labelFontPaintAuthored ?? void 0,
		fontHidden: t.labelFontHidden ?? void 0,
		fontLanguage: t.labelFontLanguage ?? void 0,
		fontBaseline: t.labelFontBaseline ?? void 0,
		textRotation: t.labelTextRotation ?? void 0,
		textWrap: t.labelTextWrap ?? void 0,
		textVerticalAnchor: t.labelTextVerticalAnchor ?? void 0,
		textVerticalMode: t.labelTextVerticalMode ?? void 0,
		textLInsEmu: t.labelTextLInsEmu ?? void 0,
		textTInsEmu: t.labelTextTInsEmu ?? void 0,
		textRInsEmu: t.labelTextRInsEmu ?? void 0,
		textBInsEmu: t.labelTextBInsEmu ?? void 0,
		textBodyAuthored: t.labelTextBodyAuthored ?? void 0
	}, b = Je(y, r), x = v + b.left + b.right, S = (_?.height ?? o.length * h) + b.top + b.bottom, C = M(x, S, t.labelTextRotation ?? void 0, t.labelTextVerticalMode ?? void 0), w = oa(c, l, C.w, C.h, u, t.labelManualLayout, i.automaticAnchor);
	if (!w) return;
	e.save(), w.automatic && (e.beginPath(), e.rect(l.x, l.y, l.w, l.h), e.clip());
	let T = w.x + w.w / 2, E = w.y + w.h / 2, D = t.labelTextBodyAuthored === !0 || t.labelTextRotation != null || t.labelTextWrap != null || t.labelTextVerticalAnchor != null || t.labelTextVerticalMode != null || t.labelTextLInsEmu != null || t.labelTextTInsEmu != null || t.labelTextRInsEmu != null || t.labelTextBInsEmu != null, O = w.automatic ? {
		x: T - x / 2,
		y: E - S / 2,
		w: x,
		h: S
	} : {
		x: w.x,
		y: w.y,
		w: w.w,
		h: w.h
	}, k = t.labelBox;
	ar(e, k, O, r, i.shapeRotationDeg ?? 0);
	let A = t.labelTextAlign;
	e.textAlign = A === "r" ? "right" : A === "ctr" ? "center" : "left", e.textBaseline = "top", e.fillStyle = g ? `#${g}` : "#595959";
	let j = Math.max(0, O.w - b.left - b.right), ee = Math.max(0, O.h - b.top - b.bottom), te = w.automatic && C.radians === 0 && w.w === C.w && w.h === C.h && (t.labelTextWrap == null || t.labelTextWrap === "none"), N = _ ? [] : D && !te ? Ze(o.join("\n"), j, ee, h, (t) => e.measureText(t).width, y) : o;
	if (!_ && N.length === 0) {
		e.restore();
		return;
	}
	let P = D ? e.textAlign === "right" ? O.x + O.w - b.right : e.textAlign === "center" ? O.x + (O.w + b.left - b.right) / 2 : O.x + b.left : e.textAlign === "right" ? w.x + w.w : e.textAlign === "center" ? w.x + w.w / 2 : w.x, F = (t.labelFontBaseline ?? 0) * u, ne = D ? t.labelTextVerticalAnchor === "b" ? O.y + O.h - b.bottom - (_?.height ?? N.length * h) : t.labelTextVerticalAnchor === "ctr" ? O.y + (O.h - (_?.height ?? N.length * h) + b.top - b.bottom) / 2 : O.y + b.top : w.y, re = w.automatic ? N.length : Math.min(N.length, Math.floor(ee / h));
	if (C.radians !== 0 && (e.translate(T, E), e.rotate(C.radians), e.translate(-T, -E)), _) Ar(e, _, P, ne, e.textAlign, "top", Math.max(_.width, j));
	else if (!(t.labelFontPaintAuthored === !0 && (t.labelFontHidden === !0 || t.labelFontColor == null))) for (let t = 0; t < re; t++) e.fillText(D && y.textWrap === "none" ? N[t] : m(e, N[t], Math.max(0, j || v)), P, ne + t * h - F);
	e.restore();
}
function ua(e, t, n, r, i, a, o, c, l) {
	let u = t.trendLines;
	if (!u || u.length === 0) return;
	let d = [], f = [];
	for (let e = 0; e < t.values.length; e++) {
		let n = t.values[e], r = o ? o[e] : e;
		n != null && r != null && Number.isFinite(n) && Number.isFinite(r) && (d.push(r), f.push(n));
	}
	if (d.length < 2) return;
	let p = e.getLineDash ? e.getLineDash() : [];
	for (let o of u) {
		let u = Qt(d, f, o.trendlineType, {
			period: o.period,
			order: o.order,
			intercept: o.intercept,
			forward: o.forward,
			backward: o.backward
		});
		if (u.xs.length < 2 || ![...u.xs, ...u.ys].every(Number.isFinite)) continue;
		let p = o.trendlineType === "linear" ? s(d, f, o.intercept) : null, m = p && [
			p.slope,
			p.intercept,
			p.rSquared
		].every(Number.isFinite) ? p : null, h = u.xs, g = u.ys;
		if (o.trendlineType === "linear") {
			let e = (u.ys[1] - u.ys[0]) / (u.xs[1] - u.xs[0] || 1), t = o.backward ?? 0, n = o.forward ?? 0;
			h = [u.xs[0] - t, u.xs[1] + n], g = [u.ys[0] - e * t, u.ys[1] + e * n];
		}
		if (![...h, ...g].every(Number.isFinite)) continue;
		let _ = h.map((e, t) => l ? l(e, g[t]) : {
			x: r(e),
			y: i(g[t])
		});
		if (_.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y))) {
			if (!o.lineHidden && (o.linePaintAuthored !== !0 || o.lineColor != null)) {
				c?.clipLineToPlot && (e.save(), e.beginPath(), e.rect(c.plotRect.x, c.plotRect.y, c.plotRect.w, c.plotRect.h), e.clip()), e.strokeStyle = o.lineColor ? `#${o.lineColor}` : n, e.lineWidth = o.lineWidthEmu ? it(o.lineWidthEmu, a) : 1.5, e.setLineDash(He(o.lineDash ?? void 0, e.lineWidth)), e.beginPath();
				for (let t = 0; t < _.length; t++) {
					let { x: n, y: r } = _[t];
					t === 0 ? e.moveTo(n, r) : e.lineTo(n, r);
				}
				e.stroke(), c?.clipLineToPlot && e.restore();
			}
			la(e, o, m, a, c ? {
				...c,
				automaticAnchor: _.at(-1)
			} : void 0, t.valFormatCode);
		}
	}
	e.setLineDash(p);
}
function da(e) {
	let t = (e) => {
		switch (e) {
			case "exp": return "Exponential";
			case "log": return "Logarithmic";
			case "poly": return "Polynomial";
			case "power": return "Power";
			case "movingAvg": return "Moving Average";
			default: return "Linear";
		}
	}, n = [];
	for (let r of e) for (let e of r.trendLines ?? []) {
		if (e.lineHidden === !0 || e.linePaintAuthored === !0 && e.lineColor == null) continue;
		let i = r.lineColor ?? r.color;
		n.push({
			name: e.name ?? `${t(e.trendlineType)} (${r.name || "Series"})`,
			color: e.lineColor ?? i,
			lineColor: e.lineColor ?? i,
			lineWidthEmu: e.lineWidthEmu,
			lineHidden: !1,
			chartexStyle: { lineDash: e.lineDash },
			values: [],
			seriesType: "line",
			showMarker: !1
		});
	}
	return n;
}
function fa(e) {
	return H(e.chartType, e.series.length, e.varyColors !== !1) || pe(e) ? e.series : e.series.flatMap((e) => [e, ...da([e])]);
}
function pa(e) {
	return e && (e === "line" || e === "stackedLine" || e === "stackedLinePct" || e === "radar" || e === "scatter" || e === "stock") ? "line" : "fill";
}
function ma(e, t, n) {
	if (e !== "scatter") return !1;
	let r = t ?? "marker";
	return (r === "marker" || r === "line" || r === "lineMarker" || r === "lineNoMarker" || r === "smooth" || r === "smoothMarker" || r === "smoothNoMarker") && n.lineHidden !== !0;
}
function ha(e, n, r, i, o, s) {
	let c = i[o];
	if (!c) return null;
	let l = s ? Math.max(0, On(s, c)) : o, u = s ? fn(s, l) : void 0, d = s && u ? bn(s.chartType, u) : c.seriesType ?? e, f = u?.scatterStyle ?? n, p = u?.radarStyle ?? r, m = u?.kind === "bubble" ? "bubble" : d, h = m === "stock", g = m === "line" || m === "stackedLine" || m === "stackedLinePct" || m === "radar" || h, _ = m === "bubble", v = m === "scatter" || _;
	if (!g && !v || !be(d, f, u ? {
		...c,
		seriesType: d
	} : c, p)) return null;
	let y = c.markerSymbol ?? c.automaticMarkerSymbol ?? (h ? "none" : "circle"), b = de(l, c), x = Zt(c, b.replace(/^#/, "")), S = _ ? !1 : v ? ma("scatter", f, c) : c.lineHidden !== !0;
	if (_ && s) {
		let e = Fe(c, l), n = ea(s, c, void 0, 0, e, b), r = ta(s, c, void 0, 0, e);
		return {
			symbol: "circle",
			fill: n.color,
			fillPaint: n.paint,
			line: r.color,
			lineWidthEmu: r.widthEmu ?? null,
			linePaint: r.paint,
			lineDash: r.dash,
			lineCustomDash: r.customDash,
			lineCap: r.cap,
			lineJoin: r.join,
			bubble3D: sn(c, void 0),
			withLine: !1,
			directEffect: ue(c.chartexStyle),
			fallbackEffect: t(s, sn(c, void 0) ? "dataPoint3D" : "dataPoint", l),
			directEffectIndex: e,
			fallbackEffectIndex: Wt(s, l) ? 0 : e
		};
	}
	return s ? _a(s, c, void 0, 0, l, m, f, p) : {
		symbol: y,
		fill: x,
		fillPaint: a(c),
		line: c.markerLine ?? null,
		lineWidthEmu: c.markerLineWidthEmu ?? null,
		withLine: S
	};
}
function ga(e, n, r, i) {
	let a = Math.max(0, On(e, n)), o = de(a, n), s = Fe(n, a), c = ea(e, n, r, i, s, o), l = ta(e, n, r, i, s), u = ue(r?.chartexStyle), d = ue(n.chartexStyle), f = sn(n, r);
	return {
		symbol: "circle",
		fill: c.color,
		fillPaint: c.paint,
		line: l.color,
		lineWidthEmu: l.widthEmu ?? null,
		linePaint: l.paint,
		lineDash: l.dash,
		lineCustomDash: l.customDash,
		lineCap: l.cap,
		lineJoin: l.join,
		bubble3D: f,
		withLine: !1,
		directEffect: u ?? d,
		fallbackEffect: t(e, f ? "dataPoint3D" : "dataPoint", a),
		directEffectIndex: u ? i : s,
		fallbackEffectIndex: Wt(e, a) ? i : s
	};
}
function _a(e, n, r, i, o, s, c, l) {
	let u = s === "line" || s === "stackedLine" || s === "stackedLinePct" || s === "radar" || s === "stock";
	if (!u && s !== "scatter") return null;
	let d = ir(n, r, "circle", be(s, c, n, l));
	if (d === "none") return null;
	let f = de(o, n).replace(/^#/, ""), p = n.chartexFormatIdx ?? o, m = t(e, "dataPointMarker", o), h = Nn(e, "dataPointMarker"), g = Wt(e, o) ? i : p, _ = We(r?.markerStyle, h, i), v = We(n.markerStyle, h, p), y = _ !== void 0 || r?.markerFill != null || r?.markerFillPaint !== void 0 || r?.markerFillPaintAuthored === !0 && r.markerStyle?.fillHidden !== !0, b = v !== void 0 || n.markerFill != null || n.markerFillPaint !== void 0 || n.markerFillPaintAuthored === !0 && n.markerStyle?.fillHidden !== !0, x = r ? $n(n, r, i, f) : Zt(n, f), S = r ? Le(n, r, i) : a(n);
	if (_ === null || _ === void 0 && v === null) x = "00000000", S = null;
	else if (!y && !b) {
		let e = ie(m, g);
		e === null ? (x = "00000000", S = null) : e?.fillType === "solid" ? (x = e.color, S = void 0) : e !== void 0 && (S = e);
	}
	let C = Xe(r?.markerStyle, h, i), w = Xe(n.markerStyle, h, p), T = r?.markerLine ?? n.markerLine ?? null, E;
	if (C !== void 0) C?.fillType === "solid" ? T = C.color : E = C;
	else if (r?.markerLinePaintAuthored === !0 && r.markerStyle?.lineHidden !== !0 && r.markerLine == null) E = null;
	else if (w !== void 0) w?.fillType === "solid" ? T = w.color : E = w;
	else if (n.markerLinePaintAuthored === !0 && n.markerStyle?.lineHidden !== !0 && n.markerLine == null) E = null;
	else if (r?.markerLine == null && n.markerLine == null) {
		let e = Qe(m, g);
		e?.fillType === "solid" ? T = e.color : (E = e, e === null && (T = null));
	}
	let D = m, O = pt(r?.markerStyle, n.markerStyle, D), k = ue(r?.markerStyle, r?.chartexStyle), A = ue(n.markerStyle);
	return {
		symbol: d,
		fill: x,
		fillPaint: S,
		line: T,
		linePaint: E,
		lineWidthEmu: r?.markerLineWidthEmu ?? r?.markerStyle?.lineWidthEmu ?? n.markerLineWidthEmu ?? n.markerStyle?.lineWidthEmu ?? D?.lineWidthEmu ?? null,
		lineDash: O?.lineDash,
		lineCustomDash: O?.lineCustomDash,
		lineCap: r?.markerStyle?.lineCap ?? n.markerStyle?.lineCap ?? D?.lineCap,
		lineJoin: r?.markerStyle?.lineJoin ?? n.markerStyle?.lineJoin ?? D?.lineJoin,
		withLine: u || ma("scatter", c, n),
		directEffect: k ?? A,
		fallbackEffect: m,
		directEffectIndex: k ? i : p,
		fallbackEffectIndex: g
	};
}
function va(e, t, n, r, i, a, o, s = null, c = void 0, l = void 0, u = null, d = null, f = null, p = void 0, m = null, h = null, g = 1, _ = 0, v, y, b = 0, x = b) {
	if (t !== "none") {
		if (s && !s.withLine) {
			aa(e, r + a / 2, i + o / 2, s.symbol, o * .58 / g, s.fill, s.line, g, s.lineWidthEmu == null ? void 0 : it(s.lineWidthEmu, g), s.fillPaint, _, s.linePaint, s.lineDash, s.lineCustomDash, s.lineCap, s.lineJoin, s.bubble3D, s.directEffect, s.fallbackEffect, s.directEffectIndex, s.fallbackEffectIndex);
			return;
		}
		Ne(e, v, y, b, {
			x: r,
			y: i,
			w: a,
			h: o
		}, g, (e) => ya(e, t, n, r, i, a, o, c, l, u, d, f, p, m, h, g, _), x), s && aa(e, r + a / 2, i + o / 2, s.symbol, o * .58 / g, s.fill, s.line, g, s.lineWidthEmu == null ? void 0 : it(s.lineWidthEmu, g), s.fillPaint, _, s.linePaint, s.lineDash, s.lineCustomDash, s.lineCap, s.lineJoin, s.bubble3D, s.directEffect, s.fallbackEffect, s.directEffectIndex, s.fallbackEffectIndex);
	}
}
function ya(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g) {
	if (e.fillStyle = n, t === "line") {
		if (!(c !== void 0 || l != null || u != null || d != null || p != null || m != null)) {
			e.strokeStyle = n;
			let t = e.lineWidth;
			e.lineWidth = Math.max(1.5, o * .15), e.beginPath();
			let s = i + o / 2;
			e.moveTo(r, s), e.lineTo(r + a, s), e.stroke(), e.lineWidth = t;
			return;
		}
		if (c === null) return;
		e.save();
		let t = c ? Pn(c, e, r, i, a, o, g) : l ? `#${l}` : n;
		if (!t) {
			e.restore();
			return;
		}
		e.strokeStyle = t, e.lineWidth = u == null ? Math.max(1.5, o * .15) : it(u, h), e.setLineDash(Pe(f, d, e.lineWidth)), e.lineCap = p === "rnd" ? "round" : p === "sq" ? "square" : "butt", e.lineJoin = m === "round" || m === "bevel" ? m : "miter", e.beginPath();
		let s = i + o / 2;
		e.moveTo(r, s), e.lineTo(r + a, s), e.stroke(), e.restore();
	} else {
		Bi(e, s, {
			x: r,
			y: i,
			w: a,
			h: o
		}, n, h, g);
		let t = c === null ? null : c ? Pn(c, e, r, i, a, o, g) : l ? `#${l}` : null;
		if (t) {
			let n = it(u, h);
			e.save(), e.strokeStyle = t, e.lineWidth = n, e.setLineDash(Pe(f, d, e.lineWidth)), e.lineCap = p === "rnd" ? "round" : p === "sq" ? "square" : "butt", e.lineJoin = m === "round" || m === "bevel" ? m : "miter", e.strokeRect(r + n / 2, i + n / 2, Math.max(0, a - n), Math.max(0, o - n)), e.restore();
		}
	}
}
function ba(e, t) {
	if (t.length === 0) return [...e];
	let n = /* @__PURE__ */ new Map();
	for (let e of t) n.set(e.idx, e);
	let r = [];
	for (let t = 0; t < e.length; t++) {
		let i = n.get(t);
		i?.deleted !== !0 && r.push({
			...e[t],
			textOverride: i ?? null
		});
	}
	return r;
}
function xa(e, n, r, i = !1, a = [], o = [], s = !0, c = [], l, u) {
	let d = H(n, e.length, s);
	if (i || d) {
		let f = e[0], p = f ? f.values.length : 0, m = f?.categories ?? a, h = u && f ? Math.max(0, On(u, f)) : 0, g = u ? fn(u, h) : void 0, _ = g?.kind === "bubble" ? "bubble" : f?.seriesType ?? n, v = g?.scatterStyle ?? r, y = g?.radarStyle ?? l, b = new Map(f?.dataPointOverrides?.map((e) => [e.idx, e]) ?? []);
		return ba(Array.from({ length: p }, (r, a) => {
			let c = b.get(a), l = u && f ? Ye(u, f, h, a) : a, p = pa(_), g = u && f ? je(u, p === "line" ? "dataPointLine" : "dataPoint", f, c, l) : void 0, x = a < o.length ? o[a] : u && f ? le(u, f, c, l, a) : c?.fillHidden === !0 ? null : c?.color || f?.dataPointColors?.[a] ? void 0 : f?.fillPattern ?? void 0, S = (_ === "bubble" && u && f ? ga(u, f, c, a) : null) ?? (u && f ? _a(u, f, c, a, h, _, v, y) : null), C = ue(c?.chartexStyle), w = ue(f?.chartexStyle), T = u && f ? t(u, p === "line" ? "dataPointLine" : "dataPoint", h) : void 0, E = d && f ? ne(a, f, s, 0) : za(n, e, a, i, s);
			return {
				label: (m[a] ?? `Item ${a + 1}`).toString(),
				color: x?.fillType === "solid" ? x.color.startsWith("#") ? x.color : `#${x.color}` : E,
				marker: S,
				swatchStyle: p,
				fillPaint: x,
				outlinePaint: g?.paint?.fillType === "solid" ? void 0 : g?.paint,
				outlineColor: g?.paint?.fillType === "solid" ? g.paint.color : c?.lineColor ?? f?.lineColor ?? null,
				outlineWidthEmu: g?.widthEmu ?? null,
				outlineDash: g?.dash ?? null,
				outlineCustomDash: g?.customDash,
				outlineCap: g?.cap ?? null,
				outlineJoin: g?.join ?? null,
				directEffect: C ?? w,
				fallbackEffect: T,
				directEffectIndex: C ? a : f ? Fe(f, h) : l,
				fallbackEffectIndex: l,
				textOverride: null
			};
		}), c);
	}
	return u && e.some((e) => {
		let t = On(u, e), n = fn(u, t);
		return t >= 0 && n?.kind !== "pie" && n?.kind !== "pie3D" && n?.kind !== "doughnut" && n?.kind !== "ofPie" && Wt(u, t);
	}) ? ba(e.flatMap((e) => {
		let t = On(u, e), i = fn(u, t), o = i?.kind === "bubble" ? "bubble" : e.seriesType ?? n;
		return t >= 0 && i?.kind !== "pie" && i?.kind !== "pie3D" && i?.kind !== "doughnut" && i?.kind !== "ofPie" && Wt(u, t) ? xa([e], o, i?.scatterStyle ?? r, !0, e.categories ?? a, [], s, [], i?.radarStyle ?? l, u) : xa([e], o, i?.scatterStyle ?? r, !1, e.categories ?? a, [], s, [], i?.radarStyle ?? l, u);
	}), c) : ba(e.map((i, a) => {
		let c = u ? On(u, i, a) : a, d = (u ? fn(u, c) : void 0)?.kind === "bubble" ? "bubble" : i.seriesType ?? n, f = i.lineHidden !== !0, p = f ? i.lineColor ?? null : null, m = ha(n, r, l, e, a, u), h = d === "stock" && !f && !m ? "none" : pa(d), g = Fe(i, c >= 0 ? c : a), _ = a < o.length ? o[a] : u ? le(u, i, void 0, g) : ie(i.chartexStyle, i.chartexFormatIdx ?? a) ?? i.fillPattern ?? void 0, v = u ? je(u, h === "line" ? "dataPointLine" : "dataPoint", i, void 0, g) : void 0, y = u ? t(u, h === "line" ? "dataPointLine" : "dataPoint", c) : void 0;
		return {
			label: i.name || `Series ${a + 1}`,
			color: h === "line" && v?.paint?.fillType === "solid" ? v.paint.color.startsWith("#") ? v.paint.color : `#${v.paint.color}` : h === "line" && p ? `#${p}` : _?.fillType === "solid" ? _.color.startsWith("#") ? _.color : `#${_.color}` : za(n, e, a, !1, s),
			marker: m,
			swatchStyle: h,
			fillPaint: _,
			outlinePaint: v?.paint?.fillType === "solid" ? void 0 : v?.paint,
			outlineColor: v?.paint?.fillType === "solid" ? v.paint.color : p,
			outlineWidthEmu: v?.widthEmu ?? (f ? i.lineWidthEmu ?? null : null),
			outlineDash: v?.dash ?? (f ? i.chartexStyle?.lineDash ?? null : null),
			outlineCustomDash: v?.customDash,
			outlineCap: v?.cap ?? (f ? i.chartexStyle?.lineCap ?? null : null),
			outlineJoin: v?.join ?? (f ? i.chartexStyle?.lineJoin ?? null : null),
			directEffect: ue(i.chartexStyle),
			fallbackEffect: y,
			directEffectIndex: g,
			fallbackEffectIndex: g,
			textOverride: null
		};
	}), c);
}
function Sa(e, t, n = 0) {
	let r = pe(e) || H(e.chartType, e.series.length, e.varyColors !== !1), i = xa(e.series, e.chartType, e.scatterStyle, pe(e), e.categories, [], e.varyColors !== !1, [], e.radarStyle, e), a = L(e);
	return (o, s) => {
		let c = r || Wt(e, o), l = r ? s : we(a, o, c ? s : 0), u = l == null ? void 0 : i[l];
		return u ? {
			entry: u,
			ptToPx: t,
			shapeRotationDeg: n
		} : void 0;
	};
}
function Ca(e, t, n, r) {
	if (!n) return t;
	let i = tr(e, n.fontFace) ?? n.fontFace;
	return {
		fontFamily: i ? Kn(i) : t.fontFamily,
		color: n.fontColor ? `#${n.fontColor}` : t.color,
		bold: n.fontBold ?? t.bold,
		italic: n.fontItalic ?? t.italic,
		sizePx: en(n.fontSizeHpt, r) ?? t.sizePx
	};
}
function wa(e, t, n) {
	let r = Aa(t, n);
	return e.font = `${t.italic ? "italic " : ""}${t.bold ? "bold " : ""}${r}px ${t.fontFamily}`, r;
}
var Ta = {
	fontFamily: "sans-serif",
	color: "#333",
	bold: !1,
	italic: !1,
	sizePx: null
}, Ea = 12, Da = 4, Oa = 8, ka = .01;
function Aa(e, t) {
	return e.sizePx ?? 10 * t;
}
function ja(e, t, n) {
	return e.map((e) => {
		if (e.swatchStyle === "fill") return 7 * n;
		let r = t * 1.6;
		if (e.swatchStyle !== "line" || !e.outlineDash) return r;
		let i = e.outlineWidthEmu == null ? Math.max(1.5, t * .15) : it(e.outlineWidthEmu, n), a = He(e.outlineDash, i), o = a.length > 0 ? a.reduce((e, t) => e + t, 0) + a[0] : 0;
		return Math.max(r, o);
	});
}
function Ma(e, t) {
	return Math.max(0, ...t.map((t, n) => lt(e[n]?.label ?? "") * t)) + 4;
}
function Na(e, t, n) {
	return e.swatchStyle === "fill" ? 7 * n : t;
}
function Pa(e, t, n) {
	if (!(n > 0)) return [];
	let r = Un(t);
	if (r.length > 1) return r.flatMap((t) => Pa(e, t, n));
	let i = wt(e, t, n);
	return i.length <= 2 ? i : [i[0], m(e, i.slice(1).join(" "), n)];
}
function Fa(e, t, n, r, i) {
	if (!t.showLegend) return null;
	let a = La(t, i), o = xa(fa(t), t.chartType, t.scatterStyle, pe(t), t.categories, [], t.varyColors !== !1, t.legendEntries ?? [], t.radarStyle, t), s = o.map((e) => Ca(t, a, e.textOverride, i)), c = s.map((e) => Aa(e, i)), l = o.map((e, t) => ja([e], c[t], i)[0]);
	e.save();
	let u = o.map((t, n) => (wa(e, s[n], i), l[n] + 4 + Ie(e, t.label)));
	e.restore();
	let d = t.legendPos ?? "r", f = d === "t" || d === "b", p = jn(t, n, r, {
		itemWidths: u,
		rowHeight: Ma(o, c),
		itemGap: Ea,
		horizontalPadding: f ? 8 : Oa,
		verticalPadding: Da
	});
	return p ? {
		...p,
		measuredLabels: o.map((e) => e.label),
		entryStyles: s,
		fontSizes: c,
		swatches: l,
		itemWidths: u
	} : null;
}
function Ia(e, t, n, r, i, a, o = "vertical", s, c = Ta, l, u = !1, d = [], f = 1, p = [], h = 0, g = !0, _, v) {
	let y = xa(t, s, l, u, d, p, g, _?.legendEntries ?? [], _?.radarStyle, _), b = v != null && v.measuredLabels.length === y.length && v.measuredLabels.every((e, t) => e === y[t].label), x = b ? v.entryStyles : y.map((e) => _ ? Ca(_, c, e.textOverride, f) : c), S = b ? v.fontSizes : x.map((e) => Aa(e, f));
	x[0] && wa(e, x[0], f), e.textBaseline = "middle";
	let C = Ma(y, S), w = b ? v.swatches : y.map((e, t) => ja([e], S[t], f)[0]), T = b ? v.itemWidths : y.map((t, n) => (wa(e, x[n], f), w[n] + 4 + Ie(e, t.label)));
	if (o === "horizontal") {
		let t = Mt(T, i, Ea).slice(0, Math.max(0, Math.floor((a - Da) / C))), o = r + Da / 2;
		for (let r = 0; r < t.length; r++) {
			let a = t[r], s = a.map((e) => Math.min(i, T[e])), c = s.reduce((e, t) => e + t, 0) + Ea * Math.max(0, a.length - 1), l = n + Math.max(0, (i - c) / 2), u = o + r * C + C / 2;
			for (let t = 0; t < a.length; t++) {
				let n = a[t], r = w[n], i = s[t];
				if (i < r) {
					l += i + Ea;
					continue;
				}
				let o = Math.max(0, i - r - 4 + ka);
				wa(e, x[n], f);
				let c = Na(y[n], S[n], f);
				va(e, y[n].swatchStyle, y[n].color, l, u - c / 2, r, c, y[n].marker, y[n].fillPaint, y[n].outlinePaint, y[n].outlineColor, y[n].outlineWidthEmu, y[n].outlineDash, y[n].outlineCustomDash, y[n].outlineCap, y[n].outlineJoin, f, h, y[n].directEffect, y[n].fallbackEffect, y[n].directEffectIndex, y[n].fallbackEffectIndex), e.fillStyle = x[n].color, e.textAlign = "left", gt(e, y[n].label, l + r + 4, u, S[n], o), l += i + Ea;
			}
		}
		return;
	}
	let E = i - Math.max(...w, 0) - 4, D = !u && !H(s, t.length, g), O = y.map((t, n) => (wa(e, x[n], f), D ? Pa(e, t.label, E) : Un(t.label).map((t) => m(e, t, E)))), k = O.map((e, t) => e.length * S[t] + 4), A = 0, j = 0;
	for (; A < y.length && j + k[A] <= a;) j += k[A], A++;
	let ee = A === y.length ? r + (a - j) / 2 : r;
	for (let t = 0; t < A; t++) {
		let r = w[t], a = k[t];
		if (i < r) {
			ee += a;
			continue;
		}
		let o = Na(y[t], S[t], f);
		va(e, y[t].swatchStyle, y[t].color, n, ee + (a - o) / 2, r, o, y[t].marker, y[t].fillPaint, y[t].outlinePaint, y[t].outlineColor, y[t].outlineWidthEmu, y[t].outlineDash, y[t].outlineCustomDash, y[t].outlineCap, y[t].outlineJoin, f, h, y[t].directEffect, y[t].fallbackEffect, y[t].directEffectIndex, y[t].fallbackEffectIndex), wa(e, x[t], f), e.fillStyle = x[t].color, e.textAlign = "left", O[t].forEach((i, a) => e.fillText(i, n + r + 4, ee + S[t] * (a + .5))), ee += a;
	}
}
function La(e, t) {
	let n = tr(e, e.legendFontFace) ?? e.themeMinorFontLatin;
	return {
		fontFamily: n ? Kn(n) : "sans-serif",
		color: e.legendFontColor ? `#${e.legendFontColor}` : "#333",
		bold: e.legendFontBold ?? !1,
		italic: e.legendFontItalic ?? !1,
		sizePx: en(e.legendFontSizeHpt, t)
	};
}
function Ra(e, t, n, r, i, a, o, s, c, l, u, d, f, p = [], m = 0) {
	if (!n) return;
	let h = La(t, f), g = fa(t), _ = pe(t), v = Math.min(Oa / 2, Math.max(0, n.reserveW) / 2), y = Math.max(0, n.reserveW - v * 2), b = n.side === "r" ? {
		x: r + a - n.reserveW + v,
		y: c,
		w: y,
		h: u
	} : n.side === "l" ? {
		x: r + v,
		y: c,
		w: y,
		h: u
	} : n.side === "t" ? {
		x: r + 4,
		y: i + d,
		w: Math.max(0, a - 8),
		h: n.reserveH
	} : {
		x: r + 4,
		y: i + o - n.reserveH,
		w: Math.max(0, a - 8),
		h: n.reserveH
	}, x = n.side === "t" || n.side === "b" ? "horizontal" : "vertical", S = t.legendManualLayout, C = S ? yn(S, {
		x: r,
		y: i,
		w: a,
		h: o
	}, b) : null;
	if (C) {
		let r = C.w >= C.h ? "horizontal" : "vertical";
		Tn(e, t, C, f, m), Ia(e, g, C.x, C.y, C.w, C.h, r, t.chartType, h, t.scatterStyle, _, t.categories, f, p, m, t.varyColors !== !1, t, n);
		return;
	}
	Tn(e, t, b, f, m), Ia(e, g, b.x, b.y, b.w, b.h, x, t.chartType, h, t.scatterStyle, _, t.categories, f, p, m, t.varyColors !== !1, t, n);
}
function za(e, t, n, r = !1, i = !0) {
	if (r || H(e, t.length, i)) {
		let e = t[0];
		return e ? ne(n, e, i, 0) : `#${A[n % A.length]}`;
	}
	return de(n, t[n]);
}
function Ba(e) {
	return e.dataTable != null && zt(e.chartType);
}
function Va(e) {
	return e.catAxisIsDate !== !0 || e.chartType === "clusteredBarH" || e.chartType === "stackedBarH" || e.chartType === "stackedBarHPct";
}
function Ha(e, t) {
	return !Ba(e) || Va(e) ? 0 : e.catAxisHidden || e.catAxisTickLabelPos === "none" || e.catAxisTickLabelPos === "high" ? t : Dn(t, e.catAxisLabelOffsetPercent, e.cartesianAutoLayoutProfile);
}
function Ua(e, t, n) {
	return !Va(e) && !e.plotAreaManualLayout ? t + n : t;
}
function Wa(e) {
	let t = e.chartType === "clusteredBarH" || e.chartType === "stackedBarH" || e.chartType === "stackedBarHPct", n = e.series.map((e, t) => ({
		series: e,
		sourceIndex: t
	}));
	return t ? n.reverse() : n;
}
function Ga(e, t, n) {
	let r = t.values[n];
	return r == null ? "" : g(r, t.valFormatCode, e.date1904);
}
function Ka(e, t) {
	let n = Ba(e) ? e.dataTable : null;
	if (!n) return 0;
	let r = en(n.fontSizeHpt, t) ?? 9 * t, i = Math.max(1, r * 1.2) + 4 * t;
	return (e.series.length + 1) * i;
}
function qa(e, t, n) {
	let r = Ba(t) ? t.dataTable : null;
	if (!r) return 0;
	let i = en(r.fontSizeHpt, n) ?? 9 * n, a = yt(t, r.fontFace, "minor");
	e.save(), e.font = or(i, a, r.fontBold ?? !1, r.fontItalic ?? !1);
	let o = t.series.reduce((t, n) => Math.max(t, Ie(e, n.name)), 0);
	e.restore();
	let s = r.showKeys ? Math.max(12 * n, i * 1.7) : 0, c = r.showKeys ? 4 * n : 0;
	return o + s + c + 6 * n;
}
function Ja(e, t, n, r) {
	let i = Ba(t) ? t.dataTable : null;
	if (!i) return null;
	let a = en(i.fontSizeHpt, r) ?? 9 * r, o = Math.max(1, a * 1.2), s = o + 4 * r, c = yt(t, i.fontFace, "minor");
	e.save(), e.font = or(a, c, i.fontBold ?? !1, i.fontItalic ?? !1);
	let l = t.series.find((e) => e.catFormatCode)?.catFormatCode ?? t.catAxisFormatCode, u = t.series.find((e) => e.catFormatBuiltinId != null)?.catFormatBuiltinId, d = Xt(t).map((i) => {
		let a = i.trim() === "" ? NaN : Number(i);
		return wt(e, u === 14 && Number.isFinite(a) ? Yn(a, t.date1904) : er(i, l, t.date1904), Math.max(1, n - 4 * r));
	});
	e.restore();
	let f = Math.max(1, ...d.map((e) => e.length)) * o + 4 * r, p = Wa(t), m = Xt(t).length, h = p.map(({ series: e }) => {
		let n = lt(e.name);
		for (let r = 0; r < m; r++) n = Math.max(n, lt(Ga(t, e, r)));
		return (n - 1) * o;
	}), g = h.reduce((e, t) => e + t, 0);
	return {
		fontPx: a,
		lineHeight: o,
		headerLines: d,
		headerHeight: f,
		rowHeight: s,
		rowExtraHeights: h,
		totalHeight: f + p.length * s + g
	};
}
function Ya(e, t, n, r, i, a, o, s) {
	let c = t.dataTable;
	if (!c || !n) return;
	let l = Xt(t);
	if (l.length === 0) return;
	let u = a / l.length, d = yt(t, c.fontFace, "minor"), f = or(n.fontPx, d, c.fontBold ?? !1, c.fontItalic ?? !1), p = c.showKeys ? Math.max(12 * s, n.fontPx * 1.7) : 0, m = c.showKeys ? 4 * s : 0;
	e.save(), e.font = f;
	let h = t.series.reduce((t, n) => Math.max(t, Ie(e, n.name)), 0) + p + m + 6 * s, g = Math.min(Math.max(0, r - o), h), _ = r - g, v = g + a, y = i + n.totalHeight, b = Wa(t), x = xa(t.series, t.chartType, t.scatterStyle, !1, t.categories, [], !0, [], t.radarStyle, t), S = L(t), C = c.fillColor ?? null;
	e.beginPath(), e.rect(_, i, v, n.totalHeight), e.clip();
	let w = c.fontHidden === !0 || c.fontPaintAuthored === !0 && c.fontColor == null ? "transparent" : c.fontColor ? `#${c.fontColor}` : "#000000", T = (e, t, r) => {
		let i = Un(e);
		if (i.length > 1) {
			let e = r - (i.length - 1) * n.lineHeight / 2;
			i.forEach((r, i) => E(r, t, e + i * n.lineHeight));
			return;
		}
		E(i[0], t, r);
	}, E = (t, r, i) => {
		if (C && t !== "") {
			let a = e.measureText(t).width;
			e.fillStyle = `#${C}`, e.fillRect(r - a / 2, i - n.lineHeight / 2, a, n.lineHeight);
		}
		e.fillStyle = w, e.textAlign = "center", e.fillText(t, r, i);
	};
	e.fillStyle = w, e.textAlign = "center", e.textBaseline = "middle";
	for (let e = 0; e < l.length; e++) {
		let t = r + (e + .5) * u, a = n.headerLines[e] ?? [""], o = a.length * n.lineHeight, s = i + (n.headerHeight - o) / 2 + n.lineHeight / 2;
		a.forEach((e, r) => {
			T(e, t, s + r * n.lineHeight);
		});
	}
	let D = 0;
	for (let a = 0; a < b.length; a++) {
		let { series: o, sourceIndex: d } = b[a], f = n.rowExtraHeights[a] ?? 0, h = i + n.headerHeight + a * n.rowHeight + D + (n.rowHeight + f) / 2;
		if (D += f, g > 0) {
			let t = _ + 3 * s + p + m;
			if (e.textAlign = "left", gt(e, o.name, t, h, n.lineHeight, Math.max(0, r - t - 2 * s)), c.showKeys && p > 0) {
				let t = _ + 3 * s, r = we(S, d), i = r == null ? void 0 : x[r];
				if (i) {
					let r = Math.min(n.fontPx, n.rowHeight - 2 * s);
					va(e, i.swatchStyle, i.color, t, h - r / 2, p, r, i.marker, i.fillPaint, i.outlinePaint, i.outlineColor, i.outlineWidthEmu, i.outlineDash, i.outlineCustomDash, i.outlineCap, i.outlineJoin, s, 0, i.directEffect, i.fallbackEffect, i.directEffectIndex, i.fallbackEffectIndex);
				}
				e.fillStyle = w;
			}
		}
		for (let e = 0; e < l.length; e++) T(Ga(t, o, e), r + (e + .5) * u, h);
	}
	if (c.lineHidden !== !0 && (c.linePaintAuthored !== !0 || c.lineColor != null)) {
		if (e.strokeStyle = c.lineColor ? `#${c.lineColor}` : "#808080", e.lineWidth = c.lineWidthEmu == null ? Math.max(.5, s * .75) : it(c.lineWidthEmu, s), e.setLineDash(He(c.lineDash ?? void 0, e.lineWidth)), c.showHorizontalBorder) {
			let t = i + n.headerHeight;
			for (let r = 0; r < b.length; r++) e.beginPath(), e.moveTo(_, t), e.lineTo(_ + v, t), e.stroke(), t += n.rowHeight + (n.rowExtraHeights[r] ?? 0);
		}
		if (c.showVerticalBorder) {
			e.beginPath(), e.moveTo(r, i), e.lineTo(r, y), e.stroke();
			for (let t = 1; t < l.length; t++) {
				let n = r + t * u;
				e.beginPath(), e.moveTo(n, i), e.lineTo(n, y), e.stroke();
			}
		}
		if (c.showOutline) {
			let t = e.lineWidth / 2;
			e.strokeRect(_ + t, i + t, Math.max(0, v - e.lineWidth), Math.max(0, n.totalHeight - e.lineWidth));
		}
	}
	e.restore();
}
function Xa(e, t, n) {
	if (n) return t + 1;
	let r = e[t];
	if (r == null) return null;
	let i = parseFloat(r);
	return Number.isNaN(i) ? null : i;
}
function Za(e, t) {
	return e.bubbleSizeRepresents === "w" ? t : Math.sqrt(t);
}
function Qa(e, t, n, r, i, a, o, s) {
	if (n.hidden === !0 || n.linePaintAuthored === !0 && n.color == null) return;
	e.save(), e.strokeStyle = n.color ? `#${n.color}` : s, e.lineWidth = n.lineWidthEmu ? Math.max(.5, n.lineWidthEmu / W) : 1, e.setLineDash(He(n.dash, e.lineWidth));
	let c = n.barType === "plus" || n.barType === "both", l = n.barType === "minus" || n.barType === "both", u = n.dir === "x", d = e.lineWidth / 2;
	for (let s = 0; s < t.values.length; s++) {
		let f = t.values[s];
		if (f == null) continue;
		let p = Xa(r, s, i);
		if (p == null) continue;
		let m = a(p), h = o(f), g = (t) => {
			let r = m, i = h;
			u ? r = a(p + t) : i = o(f + t), e.beginPath(), e.moveTo(m, h), e.lineTo(r, i), e.stroke(), n.noEndCap || (e.save(), e.setLineDash([]), e.beginPath(), u ? (e.moveTo(r, i - d), e.lineTo(r, i + d)) : (e.moveTo(r - d, i), e.lineTo(r + d, i)), e.stroke(), e.restore());
		};
		if (c) {
			let e = n.plus[s];
			e != null && g(e);
		}
		if (l) {
			let e = n.minus[s];
			e != null && g(-e);
		}
	}
	e.restore();
}
function $a(e, t, n, r, i, a, o, s) {
	if (n.hidden === !0 || n.linePaintAuthored === !0 && n.color == null || n.dir === "x") return;
	let c = n.barType === "plus" || n.barType === "both", l = n.barType === "minus" || n.barType === "both";
	e.save(), e.strokeStyle = n.color ? `#${n.color}` : s, e.lineWidth = n.lineWidthEmu ? Math.max(.5, n.lineWidthEmu / W) : 1, e.setLineDash(He(n.dash, e.lineWidth));
	let u = e.lineWidth / 2;
	for (let s = 0; s < r; s++) {
		if (t.values[s] == null) continue;
		let r = o(s), d = i(s), f = a(r), p = (t) => {
			let i = a(r + t);
			e.beginPath(), e.moveTo(d, f), e.lineTo(d, i), e.stroke(), n.noEndCap || (e.save(), e.setLineDash([]), e.beginPath(), e.moveTo(d - u, i), e.lineTo(d + u, i), e.stroke(), e.restore());
		};
		if (c) {
			let e = n.plus[s];
			e != null && p(e);
		}
		if (l) {
			let e = n.minus[s];
			e != null && p(-e);
		}
	}
	e.restore();
}
function eo(e, t, n) {
	return e.showDataLabelsOverMax === !0 || !Number.isFinite(n) || t <= n;
}
function to(e, t, n, r, i, a, o, s, c = !1, l = "sans-serif", u = "r", d = {
	x: -1e6,
	y: -1e6,
	w: 2e6,
	h: 2e6
}, f = d, p, m, h, _, v = 0, y) {
	let b = t.dataLabelOverrides ?? [], x = cr(b);
	if (b.length === 0 && !t.seriesDataLabels) return;
	let S = t.seriesDataLabels;
	for (let b = 0; b < t.values.length; b++) {
		let C = t.values[b];
		if (C == null || _ && !_(C)) continue;
		let w = Xa(n, b, r);
		if (w == null) continue;
		let T = x.get(b);
		if (F(S, T)) continue;
		let E = T?.showCatName ?? S?.showCatName, D = T?.showSerName ?? S?.showSerName, O = T?.showVal ?? S?.showVal, k = T?.showBubbleSize ?? S?.showBubbleSize, A = T?.showLegendKey ?? S?.showLegendKey ?? !1, j = vt({
			customText: T?.text,
			showCategory: E,
			showSeries: D,
			showValue: O,
			showBubbleSize: k,
			category: r ? er((n[b] ?? String(w)).toString(), t.catFormatCodes?.[b] ?? t.catFormatCode ?? null, c) : g(w, t.catFormatCodes?.[b] ?? t.catFormatCode ?? null, c),
			seriesName: t.name,
			sourceValue: C,
			bubbleSize: t.bubbleSizes?.[b] ?? void 0,
			valueDivisor: Sn(m),
			formatCode: T?.formatCode ?? S?.formatCode ?? null,
			date1904: c,
			separator: T?.separator ?? S?.separator
		}), ee = A ? h?.(b) : void 0;
		if (!j && !ee) continue;
		let M = T?.position ?? S?.position ?? u, te = en(T?.fontSizeHpt ?? S?.fontSizeHpt, s) ?? Math.max(9, Math.min(11, o / 25)), N = T?.fontColor ?? S?.fontColor, P = T?.fontBold ?? S?.fontBold ?? !1, ne = T?.fontFace ?? S?.fontFace, re = ne && p ? p(ne) : l;
		no(e, i(w), a(C), j, M, te, N, P, re, y?.(b) ?? 0, d, T?.manualLayout, f, T?.richRuns, s, p, ee, Ge(T, S), Gn(T?.labelBox, S?.labelBox), v);
	}
}
function no(e, t, n, r, i, a, o, s, c = "sans-serif", l = 0, u = {
	x: -1e6,
	y: -1e6,
	w: 2e6,
	h: 2e6
}, d, f = u, p, m = 1, h, g, _, v, y = 0) {
	e.save(), e.font = `${_?.fontItalic ? "italic " : ""}${s ? "bold " : ""}${a}px ${c}`, ao(e, r, {
		kind: "point",
		x: t,
		y: n,
		position: i,
		markerGap: l
	}, u, a, o ? `#${o}` : "#333", d, f, p && p.length > 0 ? {
		runs: p,
		ptToPx: m,
		fontFamily: c,
		fallbackBold: s,
		fallbackItalic: _?.fontItalic,
		fallbackBaseline: _?.fontBaseline,
		fallbackColorHidden: _?.fontPaintAuthored === !0 && (_.fontHidden === !0 || _.fontColor == null),
		fontFamilyForFace: h
	} : void 0, g, _, m, v, y), e.restore();
}
function ro(e, t, n, r, i, a) {
	if (!(!t?.text || !t.richRuns || t.richRuns.length === 0)) return io(e, t.richRuns, n, r, i, a);
}
function io(e, t, n, r, i, a) {
	if (!(!t || t.length === 0)) return {
		runs: t,
		ptToPx: n,
		fontFamily: r,
		fallbackBold: i,
		fallbackItalic: a?.fontItalic,
		fallbackBaseline: a?.fontBaseline,
		fallbackColorHidden: a?.fontPaintAuthored === !0 && (a.fontHidden === !0 || a.fontColor == null),
		fontFamilyForFace: (t) => yt(e, t, "minor")
	};
}
function ao(e, t, n, r, i, a, o, s = r, c, l, d, f = 1, p, m = 0) {
	if (!t && !l || !Number.isFinite(i) || i <= 0) return;
	if (l) {
		oo(e, t, n, r, i, a, o, s, c, l, d, p);
		return;
	}
	if (c) {
		let t = jr(e, c, i, a);
		if (!t) return;
		let l = Je(d, f), h = M(t.width + l.left + l.right, t.height + l.top + l.bottom, d?.textRotation, d?.textVerticalMode), g = J(n, r, {
			w: h.w,
			h: h.h
		}, i, o, s);
		if (!g) return;
		e.save(), e.beginPath(), e.rect(g.clip.x, g.clip.y, g.clip.w, g.clip.h), e.clip(), ar(e, p, g.rect, f, m);
		let _ = u(d, g.textAlign), v = Z(g.x, g.y, g.rect, t.height + l.top + l.bottom, d, o != null, _, g.textAlign, t.width + l.left + l.right, h.radians), y = oe(e, v.x, v.y, h.radians, _, g.textBaseline, l);
		Ar(e, t, y.x, y.y, _, g.textBaseline, o ? Math.max(0, g.rect.w - l.left - l.right) : t.width), e.restore();
		return;
	}
	let h = i * 1.15, g = wn(t).value.split(/\r?\n/), _ = g.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), v = Math.max(h, g.length * h), y = Je(d, f), b = M(_ + y.left + y.right, v + y.top + y.bottom, d?.textRotation, d?.textVerticalMode), x = J(n, r, {
		w: b.w,
		h: b.h
	}, i, o, s);
	if (!x) return;
	let S = (t) => e.measureText(t).width, C = Ze(t, x.maxWidth, x.maxHeight, h, S, d);
	if (C.length === 0) return;
	let w = C.reduce((e, t) => Math.max(e, S(t)), 0), T = C.length * h, E = M(w + y.left + y.right, T + y.top + y.bottom, d?.textRotation, d?.textVerticalMode);
	if (x = J(n, r, {
		w: E.w,
		h: E.h
	}, i, o, s), !x) return;
	e.save(), e.beginPath(), e.rect(x.clip.x, x.clip.y, x.clip.w, x.clip.h), e.clip(), ar(e, p, x.rect, f, m);
	let D = d?.fontPaintAuthored === !0 && (d.fontHidden === !0 || d.fontColor == null);
	e.fillStyle = a;
	let O = u(d, x.textAlign);
	e.textAlign = O, e.textBaseline = x.textBaseline;
	let k = Z(x.x, x.y, x.rect, T + y.top + y.bottom, d, o != null, O, x.textAlign, w + y.left + y.right, E.radians), A = oe(e, k.x, k.y, E.radians, O, x.textBaseline, y), j = (d?.fontBaseline ?? 0) * i, ee = x.textBaseline === "middle" ? A.y - (C.length - 1) * h / 2 : x.textBaseline === "bottom" ? A.y - (C.length - 1) * h : A.y;
	if (!D) for (let t = 0; t < C.length; t++) e.fillText(C[t], A.x, ee + t * h - j);
	e.restore();
}
function oo(e, t, n, r, i, a, o, s, c, l, d, f) {
	let { entry: p, ptToPx: m, shapeRotationDeg: h } = l, g = ja([p], i, m)[0] ?? 0, _ = Na(p, i, m), v = t ? 4 : 0, y = t && c ? jr(e, c, i, a) : null;
	if (t && c && !y) return;
	let b = i * 1.15, x = t && !y ? wn(t).value.split(/\r?\n/) : [], S = y?.width ?? x.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), C = y?.height ?? (x.length > 0 ? Math.max(b, x.length * b) : 0), w = Je(d, m), T = M(g + v + S + w.left + w.right, Math.max(_, C) + w.top + w.bottom, d?.textRotation, d?.textVerticalMode), E = J(n, r, {
		w: T.w,
		h: T.h
	}, i, o, s);
	if (!E) return;
	let D = x;
	if (t && !y && (D = Ze(t, Math.max(0, E.maxWidth - g - v), E.maxHeight, b, (t) => e.measureText(t).width, d), D.length === 0)) return;
	let O = y?.width ?? D.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), k = y?.height ?? D.length * b, A = g + v + O, j = Math.max(_, k), ee = A + w.left + w.right, te = j + w.top + w.bottom, N = M(ee, te, d?.textRotation, d?.textVerticalMode);
	if (E = J(n, r, {
		w: N.w,
		h: N.h
	}, i, o, s), !E) return;
	let P = E.textAlign === "left" ? E.x + N.w / 2 : E.textAlign === "right" ? E.x - N.w / 2 : E.x, F = E.textBaseline === "top" ? E.y + N.h / 2 : E.textBaseline === "bottom" ? E.y - N.h / 2 : E.y;
	if (o) {
		let e = u(d, "center"), t = Z(P, F, E.rect, te, d, !0, e);
		P = e === "left" ? t.x + ee / 2 : e === "right" ? t.x - ee / 2 : t.x, F = t.y;
	}
	let ne = P - ee / 2 + w.left, re = F - te / 2 + w.top;
	if (e.save(), e.beginPath(), e.rect(E.clip.x, E.clip.y, E.clip.w, E.clip.h), e.clip(), ar(e, f, E.rect, m, h), N.radians !== 0 && (e.translate(P, F), e.rotate(N.radians), e.translate(-P, -F)), va(e, p.swatchStyle, p.color, ne, re + (j - _) / 2, g, _, p.marker, p.fillPaint, p.outlinePaint, p.outlineColor, p.outlineWidthEmu, p.outlineDash, p.outlineCustomDash, p.outlineCap, p.outlineJoin, m, h, p.directEffect, p.fallbackEffect, p.directEffectIndex, p.fallbackEffectIndex), t) {
		let t = ne + g + v;
		if (y) Ar(e, y, t, re + (j - k) / 2, "left", "top");
		else if (!(d?.fontPaintAuthored === !0 && (d.fontHidden === !0 || d.fontColor == null))) {
			e.fillStyle = a, e.textAlign = "left", e.textBaseline = "top";
			let n = (d?.fontBaseline ?? 0) * i, r = re + (j - k) / 2 - n;
			for (let n = 0; n < D.length; n++) e.fillText(D[n], t, r + n * b);
		}
	}
	e.restore();
}
function so(e, t, n, r, i, a, o, s, c, l, u, d = "sans-serif", f = "t", p = {
	x: -1e6,
	y: -1e6,
	w: 2e6,
	h: 2e6
}, m = p, h, g, _, v, y, b, x = 0) {
	let S = t.dataLabelOverrides ?? [], C = cr(S), w = t.seriesDataLabels;
	if (S.length === 0 && !w) return !1;
	for (let S = 0; S < r; S++) {
		if (t.sourceHidden?.[S] === !0 || t.values[S] == null && !u) continue;
		let r = o(S);
		if (b && !b(r)) continue;
		let T = t.values[S] ?? 0, E = C.get(S);
		if (F(w, E)) continue;
		let D = E?.showCatName ?? w?.showCatName, O = E?.showSerName ?? w?.showSerName, k = E?.showVal ?? w?.showVal, A = E?.showPercent ?? w?.showPercent, j = E?.showLegendKey ?? w?.showLegendKey ?? !1, ee = vt({
			customText: E?.text,
			showCategory: D,
			showSeries: O,
			showValue: k,
			showPercent: A,
			category: n[S] ?? "",
			seriesName: t.name,
			sourceValue: T,
			valueDivisor: Sn(v),
			percentRatio: h?.(S),
			formatCode: E?.formatCode ?? w?.formatCode ?? null,
			date1904: l,
			separator: E?.separator ?? w?.separator
		}), M = j ? y?.(S) : void 0;
		if (!ee && !M) continue;
		let te = E?.position ?? w?.position ?? f, N = en(E?.fontSizeHpt ?? w?.fontSizeHpt, c) ?? Math.max(9, Math.min(11, s / 25)), P = E?.fontColor ?? w?.fontColor, ne = E?.fontBold ?? w?.fontBold ?? !1, re = E?.fontFace ?? w?.fontFace, I = re && _ ? _(re) : d;
		no(e, i(S), a(r), ee, te, N, P, ne, I, g?.(S) ?? 0, p, E?.manualLayout, m, E?.richRuns, c, _, M, Ge(E, w), Gn(E?.labelBox, w?.labelBox), x);
	}
	return !0;
}
function co(e, t, n, r, i) {
	let a = 0;
	for (let o of [e?.fillPaint, e?.borderFill]) {
		if (!o) continue;
		let e = o.fillType === "image" ? An(o, t, n, r, i) : h(o);
		if (o.fillType === "gradient" && e > Di) return null;
		a += e;
	}
	return a;
}
function lo(e, t, n, r) {
	let i = t.seriesDataLabels;
	return F(i, r) ? !1 : !!(r?.text || (r?.showVal ?? i?.showVal ?? e.showDataLabels) || (r?.showCatName ?? i?.showCatName) || (r?.showSerName ?? i?.showSerName) || (r?.showPercent ?? i?.showPercent) || (r?.showBubbleSize ?? i?.showBubbleSize) || (r?.showLegendKey ?? i?.showLegendKey)) && n < Math.max(t.values.length, t.categories?.length ?? 0, e.categories.length);
}
function uo(e, t, n, r = I, i) {
	if (e.chartexSunburst || e.chartexTreemap) return null;
	let a = 0, o = Math.max(1, i?.w ?? 32 * r), s = Math.max(1, i?.h ?? 16 * r), c = (e) => {
		let t = co(e, n, o, s, r);
		return t == null || t > Oi - a ? !1 : (a += t, !0);
	}, l = e.threeD != null && t != null && ki.has(e.chartType), u = e.series.some((t) => (t.seriesType ?? e.chartType) === "scatter" && (t.categories ?? e.categories).some((e) => Number.isFinite(Number.parseFloat(e))));
	for (let t = 0; t < e.series.length; t++) {
		let n = e.series[t], r = cr(n.dataLabelOverrides), i = n.seriesType ?? e.chartType, a = Math.max(n.values.length, n.categories?.length ?? 0, e.categories.length);
		for (let o = 0; o < a; o++) {
			let a = n.values[o];
			if (l) {
				if (a == null || !Number.isFinite(a)) continue;
				if (e.showDataLabelsOverMax !== !0) {
					let t = n.useSecondaryAxis ? e.secondaryValAxis?.max : e.valMax;
					if (t != null && Number.isFinite(t) && a > t) continue;
				}
			} else if (!It(e, n, i, o, u, t)) continue;
			let s = r.get(o);
			if (!lo(e, n, o, s)) continue;
			let d = Gn(s?.labelBox, n.seriesDataLabels?.labelBox);
			if (d && !c(d)) return Oi + 1;
		}
		if (!l) {
			for (let e of n.trendLines ?? []) if ((e.dispEq === !0 || e.dispRSqr === !0 || e.labelText || e.labelRichRuns?.some((e) => e.text.length > 0) === !0) && e.labelBox && !c(e.labelBox)) return Oi + 1;
		}
	}
	return a;
}
function fo(e, t, n, r = !1) {
	let i = n ?? "gap", a = [], o = [], s = () => {
		o.length > 0 && a.push(o), o = [];
	};
	for (let n = 0; n < t; n++) {
		if (e.sourceHidden?.[n] === !0) {
			s();
			continue;
		}
		if (!r && e.values[n] == null) {
			if (i === "gap") {
				s();
				continue;
			}
			if (i === "span") continue;
		}
		o.push(n);
	}
	return s(), a;
}
function po(e, t, n, r = t.smooth === !0) {
	return r && je(e, "dataPointLine", t, void 0, n).paint !== null;
}
var mo = (e) => Math.min(Math.max(e, Number.MIN_VALUE), Number.MAX_VALUE);
function ho(e, t) {
	let n = t != null && Number.isFinite(t) && t >= 2, r = (e) => n ? Math.log(e) / Math.log(t) : e, i = (e) => n ? t ** e : e, a = Infinity, o = -Infinity, s = (e) => {
		e < a && (a = e), e > o && (o = e);
	};
	for (let t of e) {
		if (t.length < 3 || t.some((e) => !Number.isFinite(e) || n && e <= 0)) continue;
		let e = t.map(r);
		for (let t = 0; t < e.length - 1; t++) {
			let n = e[t - 1] ?? e[t], r = e[t], i = e[t + 1], a = e[t + 2] ?? i, o = r + (i - n) / 6, c = i - (a - r) / 6;
			s(r), s(i);
			let l = -r + 3 * o - 3 * c + i, u = 2 * (r - 2 * o + c), d = o - r, f = Math.max(Math.abs(l), Math.abs(u), Math.abs(d));
			if (!(f > 0) || !Number.isFinite(f)) continue;
			let p = l / f, m = u / f, h = d / f, g = [];
			if (Math.abs(p) <= 1e-12) Math.abs(m) > 1e-12 && g.push(-h / m);
			else {
				let e = m * m - 4 * p * h;
				if (e >= 0) {
					let t = Math.sqrt(e);
					g.push((-m + t) / (2 * p), (-m - t) / (2 * p));
				}
			}
			for (let e of g) {
				if (!(e > 0 && e < 1)) continue;
				let t = 1 - e;
				s(t * t * t * r + 3 * t * t * e * o + 3 * t * e * e * c + e * e * e * i);
			}
		}
	}
	return Number.isFinite(a) ? n ? [mo(i(a)), mo(i(o))] : [a, o] : null;
}
function go(e, t, n) {
	let r = t === "smooth" || t === "smoothMarker" || t === "smoothNoMarker";
	return !(t === "marker" && se(e)) && t === "marker" && !n || r;
}
function _o(e, t, n, r, i, a, o, s, c) {
	if (!po(e, t, Fe(t, n), go(t, a, o))) return null;
	let l = [], u = [];
	for (let e = 0; e < t.values.length; e++) {
		let n = t.values[e];
		if (n == null) continue;
		let a = Xa(r, e, i);
		a != null && (l.push(a), u.push(n));
	}
	return {
		x: ho([l], s),
		y: ho([u], c)
	};
}
function vo(e, t, n) {
	return {
		series: t,
		seriesIndex: n,
		fallbackColor: de(n, t),
		cats: t.categories ?? e.categories,
		pointOverrides: new Map((t.dataPointOverrides ?? []).map((e) => [e.idx, e]))
	};
}
function yo(e, t, n, r, i) {
	let a = y(e.bubbleScale ?? 100, 0, 300);
	if (a <= 0) return 0;
	let o = 0;
	for (let { series: r, cats: i, pointOverrides: a } of t) if (!(r.showMarker === !1 || r.markerSymbol === "none")) for (let t = 0; t < r.values.length; t++) {
		if (r.values[t] == null || Xa(i, t, n) == null || a.get(t)?.markerSymbol === "none") continue;
		let s = qt(e, r.bubbleSizes?.[t]);
		s != null && (o = Math.max(o, Za(e, s)));
	}
	return o <= 0 ? 0 : Math.min(r, i) * a / (300 + a) / o;
}
function bo(e, t, n, r, i, a, o, s, c, l, u, d, p, m, h, g, _, v = 0, y) {
	let b = m === "line" || m === "lineMarker" || m === "lineNoMarker", x = G("scatter", t.chartType, m, t.radarStyle), S = n.map(({ series: e, index: n }) => vo(t, e, n)), C = Sa(t, d), w = y ?? t, T = p ? yo(w, S, r, l, u) : 0;
	for (let { series: n, fallbackColor: o, cats: s } of S) for (let c of n.errBars ?? []) Qa(e, n, Pt(t, c), s, r, i, a, o);
	for (let { series: n, seriesIndex: o, fallbackColor: h, cats: g } of S) {
		let _ = m === "marker" && se(n), y = _ || b, x = go(n, m, p);
		if (y || x) {
			let p = [];
			for (let e = 0; e < n.values.length; e++) {
				let t = n.values[e];
				if (t == null) continue;
				let o = Xa(g, e, r);
				o != null && p.push({
					x: i(o),
					y: a(t),
					index: e
				});
			}
			if (p.length >= 2) {
				let r = Fe(n, o), i = {
					x: s,
					y: c,
					w: l,
					h: u
				};
				if (Wt(t, o)) {
					f(e, t, n, [p], x, !1, h, 1.5, d, i, v, !0);
					continue;
				}
				Ne(e, ue(n.chartexStyle), t.chartStyleRoles?.dataPointLine, r, i, d, (e) => {
					e.save();
					let a = R(e, t, "dataPointLine", n, void 0, r, h, 1.5, d, i, v, !0, !1);
					if (a && _ && n.dataPointColors?.some(Boolean)) {
						e.lineWidth = 1.5;
						for (let t = 1; t < p.length; t++) e.strokeStyle = `#${n.dataPointColors[t] ?? n.color ?? h.replace(/^#/, "")}`, e.beginPath(), e.moveTo(p[t - 1].x, p[t - 1].y), e.lineTo(p[t].x, p[t].y), e.stroke();
					} else if (a) {
						if (e.beginPath(), e.moveTo(p[0].x, p[0].y), x && p.length >= 3) for (let t = 0; t < p.length - 1; t++) {
							let n = p[t - 1] ?? p[t], r = p[t], i = p[t + 1], a = p[t + 2] ?? i;
							e.bezierCurveTo(r.x + (i.x - n.x) / 6, r.y + (i.y - n.y) / 6, i.x - (a.x - r.x) / 6, i.y - (a.y - r.y) / 6, i.x, i.y);
						}
						else for (let t = 1; t < p.length; t++) e.lineTo(p[t].x, p[t].y);
						e.stroke();
					}
					e.restore();
				});
			}
		}
	}
	for (let { series: n, seriesIndex: o, fallbackColor: s, cats: c, pointOverrides: l } of S) {
		let u = !x && n.showMarker !== !1 && n.markerSymbol !== "none";
		if (u || !x && _t(n)) for (let f = 0; f < n.values.length; f++) {
			let m = n.values[f];
			if (m == null) continue;
			let h = Xa(c, f, r);
			if (h == null) continue;
			let g = l.get(f), _ = ir(n, g, p ? "circle" : n.automaticMarkerSymbol ?? "circle", u);
			if (_ === "none") continue;
			let y = g?.markerSize ?? n.markerSize ?? 5;
			if (p) {
				if (T <= 0) continue;
				let e = qt(w, n.bubbleSizes?.[f]);
				if (e == null) continue;
				y = Za(w, e) * T / d;
			}
			let b = p ? ea(t, n, g, f, Fe(n, o), s) : null, x = b?.color ?? $i(n, g, f, s), S = p ? ta(t, n, g, f, Fe(n, o)) : null, C = p ? S.color : g?.markerLine ?? n.markerLine ?? null, E = g?.markerLineWidthEmu ?? n.markerLineWidthEmu, D = S?.widthEmu, O = p ? D : E, k = O == null ? void 0 : it(O, d), A = p ? sn(n, g) : !1;
			ra(e, t, n, g, f, i(h), a(m), _, y, x, C, d, k, p ? b.paint : Le(n, g, f), v, p ? S.paint : void 0, p ? S.dash : void 0, p ? S.customDash : void 0, p ? S.cap : void 0, p ? S.join : void 0, A, p);
		}
	}
	for (let { series: n, seriesIndex: s, cats: l, pointOverrides: f } of S) to(e, n, l, r, i, a, u, d, t.date1904, yt(t, t.dataLabelFontFace, "minor"), t.dataLabelPosition ?? "r", {
		x: o.x,
		y: c,
		w: o.w,
		h: u
	}, h, (e) => yt(t, e, "minor"), _, (e) => C(s, e), (e) => eo(t, e, g), v, (e) => {
		if (x) return 0;
		let t = n.showMarker !== !1 && n.markerSymbol !== "none", r = f.get(e);
		if (ir(n, r, "circle", t) === "none") return 0;
		let i = r?.markerSize ?? n.markerSize ?? 5;
		if (p) {
			if (T <= 0) return 0;
			let t = qt(w, n.bubbleSizes?.[e]);
			if (t == null) return 0;
			i = Za(w, t) * T / d;
		}
		return Math.max(0, i * d / 2);
	});
	for (let { series: n, fallbackColor: f, cats: p } of S) ua(e, n, f, i, a, d, n.values.map((e, t) => Xa(p, t, r)), {
		chart: t,
		chartRect: o,
		plotRect: {
			x: s,
			y: c,
			w: l,
			h: u
		},
		clipLineToPlot: !0,
		shapeRotationDeg: v
	});
}
function xo(e, t, n) {
	let r = en(e.legendFontSizeHpt, n) ?? 10 * n, i = en(e.dataTable?.fontSizeHpt, n) ?? 9 * n, a = en(t.seriesDataLabels?.fontSizeHpt ?? e.dataLabelFontSizeHpt, n) ?? 10 * n;
	for (let e of t.dataLabelOverrides ?? []) a = Math.max(a, en(e.fontSizeHpt, n) ?? a);
	return {
		legend: Math.max(2, (2 * r + 4) * .58),
		table: Math.max(2, i),
		labels: Math.max(2, a)
	};
}
function So(e, t, n = I, r) {
	let i = Bn(e.chartType), o = e.chartexBox != null;
	if (!i && !o) return null;
	let s = Nt(e), c = e.series.some((t, n) => {
		let r = s[n];
		return (r?.kind === "bubble" || r?.kind === "scatter" ? "scatter" : t.seriesType ?? (e.chartType === "bubble" ? "scatter" : e.chartType)) === "scatter" ? (t.categories ?? e.categories).some((e) => Number.isFinite(Number.parseFloat(e))) : !1;
	}), l = Ba(e) && Xt(e).length > 0 && e.dataTable?.showKeys === !0, u = ge(e), d = L(e, !0), f = e.chartType === "bubble" && r ? yo(e, e.series.map((t, n) => vo(e, t, n)), !c, r.w, r.h) : 0, p = /* @__PURE__ */ new Map();
	if (r) for (let t of e.plotGroups ?? []) {
		if (t.kind !== "bubble" || t.seriesCount === 0) continue;
		let n = e.series.slice(t.seriesStart, t.seriesStart + t.seriesCount).map((n, r) => vo(e, n, t.seriesStart + r));
		p.set(t, yo({
			bubbleScale: t.bubbleScale ?? e.bubbleScale,
			bubbleSizeRepresents: t.bubbleSizeRepresents ?? e.bubbleSizeRepresents,
			showNegativeBubbles: t.showNegativeBubbles ?? e.showNegativeBubbles
		}, n, !c, r.w, r.h));
	}
	let m = 0, g = (e, t = 1) => t <= 0 || e <= 0 ? !0 : !Number.isSafeInteger(t) || e > Math.floor((Ei - m) / t) ? !1 : (m += e * t, !0), _ = (e, r = 1, i = Math.max(2, 5 * n)) => {
		if (r <= 0 || e == null) return !0;
		let a = e.fillType === "image" ? An(e, t, i, i, n) : h(e);
		return e.fillType === "gradient" && a > Ti ? !1 : g(a, r);
	};
	if (i) for (let t = 0; t < e.series.length; t++) {
		let i = e.series[t], o = s[t], m = o?.kind === "bubble" || o == null && e.chartType === "bubble", h = o?.kind === "bubble" || o?.kind === "scatter" ? "scatter" : i.seriesType ?? (e.chartType === "bubble" ? "scatter" : e.chartType), v = bn(e.chartType, o), y = o?.scatterStyle ?? e.scatterStyle, b = o?.radarStyle ?? e.radarStyle, x = {
			chartType: v,
			bubbleScale: o?.bubbleScale ?? e.bubbleScale,
			showNegativeBubbles: o?.showNegativeBubbles ?? e.showNegativeBubbles
		}, C = m ? {
			bubbleScale: x.bubbleScale,
			bubbleSizeRepresents: o?.bubbleSizeRepresents ?? e.bubbleSizeRepresents,
			showNegativeBubbles: x.showNegativeBubbles
		} : void 0, w = o?.kind === "bubble" ? p.get(o) ?? 0 : f;
		if (!(h === "line" || h === "stackedLine" || h === "stackedLinePct" || h === "area" || h === "stackedArea" || h === "stackedAreaPct" || h === "scatter" || h === "radar" || h === "stock") || G(h, v, y, b)) continue;
		let T = h === "area" || h === "stackedArea" || h === "stackedAreaPct" ? (i.showMarker === !0 || S(i)) && i.markerSymbol !== "none" : h === "stock" ? i.markerSymbol != null && i.markerSymbol !== "none" : i.showMarker !== !1 && i.markerSymbol !== "none";
		if (!T && !_t(i)) continue;
		let E = Math.max(i.values.length, i.categories?.length ?? 0, e.categories.length), D = cr(i.dataPointOverrides), O = new Map((i.dataLabelOverrides ?? []).map((e) => [e.idx, e])), A = xo(e, i, n), j = d[t]?.pointDriven === !0;
		for (let a = 0; a < E; a++) {
			let o = ut(e, i, h, a, c, x) && (!m || w > 0 && qt(C, i.bubbleSizes?.[a]) != null), s = j && e.showLegend && k(d, u, t, a), f = O.get(a), p = j && o && !F(i.seriesDataLabels, f) && (f?.showLegendKey ?? i.seriesDataLabels?.showLegendKey ?? !1) === !0, v = j && l && a === 0;
			if (!o && !s && !p && !v || m && o && (w <= 0 || qt(C, i.bubbleSizes?.[a]) == null)) continue;
			let S = D.get(a), E = ir(i, S, "circle", T);
			if (E === "none") continue;
			let ee = m ? ga(e, i, S, a) : _a(e, i, S, a, t, h, y, b), M = ee ? ee.fillPaint : m ? void 0 : Le(i, S, a), te = ee?.linePaint, N = Jn(ee?.symbol ?? E), P = (e) => (!N || _(M, 1, e)) && _(te, 1, e) && (!m || ee?.bubble3D !== !0 || M === null || g(15)), ne = Math.max(2, (S?.markerSize ?? i.markerSize ?? 5) * n);
			if (h === "scatter" && m) {
				let e = qt(C, i.bubbleSizes?.[a]);
				ne = e == null ? 0 : Za(C, e) * w;
			} else h === "radar" && S?.markerSize == null && i.markerSize == null && r && (ne = Math.max(4 * n, Math.min(r.w, r.h) * .025));
			if (o && !P(ne) || s && !P(A.legend) || v && !P(A.table) || p && !P(A.labels)) return Ei + 1;
		}
		let ee = i.markerSymbol ?? (h === "stock" ? "none" : "circle");
		if (!j && Jn(ee) && be(v, y, i, b)) {
			let n = k(d, u, t), r = Wn(e, i, h, E, c, x), o = m ? ea(e, i, void 0, t, Fe(i, t), de(t, i)) : null, s = m ? o.paint : a(i), f = m ? ta(e, i, void 0, t, Fe(i, t)) : null, p = (e, t) => _(s, e, t) && (!m || _(f.paint, e, t)) && (!m || !sn(i, void 0) || o.paint === null || g(15, e));
			if (e.showLegend && n && !p(1, A.legend) || l && !p(1, A.table) || !p(r, A.labels)) return Ei + 1;
		}
	}
	let v = e.chartexBox;
	if (v) {
		let t = v.series.length, r = e.chartexDataPointMarkerStyle ?? e.chartexDataPointStyle;
		if (Jn(e.chartStyleMarkerSymbol ?? e.chartexMarkerSymbol ?? "circle")) for (let i = 0; i < t; i++) {
			let a = v.series[i];
			if (!a.showNonoutliers && !a.showOutliers) continue;
			let o = 0;
			for (let e of a.valuesByCategory) {
				let t = At(e, a.quartileMethod);
				t && (o += et(t, a.showNonoutliers, a.showOutliers));
			}
			if (!_(Ii(e, Fe(a, i), t, a.chartexStyle, a.color, r), o, Math.max(2, 3 * n))) return Ei + 1;
		}
	}
	return m;
}
function Co(e, t) {
	if (!e.threeD || !t || !ki.has(e.chartType)) return null;
	let n = 0;
	for (let t of e.series) {
		let r = Math.max(1, t.values.length, t.categories?.length ?? 0), i = t.threeDShape ?? e.threeD.shape ?? "box", a = e.chartType === "pie" ? 36 : e.chartType.toLowerCase().includes("bar") ? i === "box" ? 4 : 36 : e.chartType.toLowerCase().includes("area") ? 4 : t.smooth === !0 ? 25 : 3;
		if (!Number.isSafeInteger(r) || r > Math.floor(1e4 / a) || (n += r * a, n > 1e4)) return Ut + 1;
	}
	return n;
}
function wo(e, t, n) {
	return n <= 1e4 ? !1 : (e.fillStyle = "#888", e.font = "12px sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText("(too many data points)", t.x + t.w / 2, t.y + t.h / 2), !0);
}
function To(e, t, n, r) {
	let i = t.chartTextBoxes;
	if (i?.length) for (let a of i) {
		let i = n.x + a.x * n.w, o = n.y + a.y * n.h, s = a.w * n.w, c = a.h * n.h;
		if (!(s > 0 && c > 0)) continue;
		let l = i + (a.lIns ?? 91440) / W * r, u = o + (a.tIns ?? 45720) / W * r, d = i + s - (a.rIns ?? 91440) / W * r, f = o + c - (a.bIns ?? 45720) / W * r, p = d - l, m = f - u;
		if (!(p > 0 && m > 0)) continue;
		let h = (e, t) => {
			let n = Math.max(1, ...t.map((e) => e.fontPx));
			return {
				paragraph: e,
				runs: t,
				width: t.reduce((e, t) => e + t.width, 0),
				height: n * 1.2,
				baseline: n * .9
			};
		}, g = (e) => {
			if (!e.runs.some((e) => /[\r\n]/.test(e.text))) return [e.runs];
			let t = [[]], n = [void 0];
			for (let r of e.runs) r.text.split(/\r\n|\r|\n/).forEach((e, i) => {
				i > 0 && (t.push([]), n.push(void 0)), e ? t[t.length - 1].push({
					...r,
					text: e
				}) : n[t.length - 1] ??= r;
			});
			return t.map((t, r) => t.length ? t : [{
				...n[r] ?? e.runs[0],
				text: ""
			}]);
		}, _ = a.paragraphs.flatMap((e) => g(e).map((t) => ({
			paragraph: e,
			runs: t
		}))).flatMap(({ paragraph: n, runs: i }) => {
			let o = i.map((n) => {
				let i = Math.max(1, (n.fontSizeHpt ?? 1e3) / 100 * r), a = `${n.bold ? "bold " : ""}${i}px ${yt(t, n.fontFace, "minor")}`;
				return e.font = a, {
					run: n,
					text: n.text,
					fontPx: i,
					font: a,
					width: e.measureText(n.text).width
				};
			}), s = o.reduce((e, t) => e + t.width, 0);
			if (a.wrap === "none" || s <= p) return [h(n, o)];
			let c = [], l = [], u = 0, d = () => {
				l.length && (c.push(h(n, l)), l = [], u = 0);
			};
			for (let t of o) {
				let n = t.text.match(/\s+|\S+/g) ?? [];
				for (let r of n) {
					let n = /^\s+$/.test(r);
					e.font = t.font;
					let i = e.measureText(r).width;
					l.length && u + i > p && d(), !(n && !l.length) && (l.push({
						...t,
						text: r,
						width: i
					}), u += i);
				}
			}
			return d(), c.length ? c : [h(n, o)];
		}), v = _.reduce((e, t) => e + t.height, 0), y = a.verticalAnchor === "b" ? f - v : a.verticalAnchor === "ctr" ? u + (m - v) / 2 : u;
		e.save(), e.beginPath(), e.rect(i, o, s, c), e.clip(), e.textAlign = "left", e.textBaseline = "alphabetic";
		let b = y;
		for (let t of _) {
			let n = t.paragraph.align, r = n === "ctr" ? l + (p - t.width) / 2 : n === "r" ? d - t.width : l;
			for (let n of t.runs) e.font = n.font, e.fillStyle = n.run.color ? `#${n.run.color}` : "#000000", e.fillText(n.text, r, b + t.baseline), r += n.width;
			b += t.height;
		}
		e.restore();
	}
}
function Eo(e, t, n, r, i, a) {
	let o = Math.max(0, Math.min(a, r / 2, i / 2));
	e.beginPath(), e.moveTo(t + o, n), e.lineTo(t + r - o, n), e.quadraticCurveTo(t + r, n, t + r, n + o), e.lineTo(t + r, n + i - o), e.quadraticCurveTo(t + r, n + i, t + r - o, n + i), e.lineTo(t + o, n + i), e.quadraticCurveTo(t, n + i, t, n + i - o), e.lineTo(t, n + o), e.quadraticCurveTo(t, n, t + o, n), e.closePath();
}
function Do(e, t, n) {
	let r = n / (e.titleFontSizeHpt != null && e.titleFontSizeHpt >= 100 && e.titleFontSizeHpt <= 4e5 ? e.titleFontSizeHpt / 100 : 14), i = en(t.fontSizeHpt, r) ?? n, a = tr(e, t.fontFace ?? e.titleFontFace);
	return {
		font: or(i, a ? Kn(a) : dt, t.bold ?? e.titleFontBold ?? !1, t.italic ?? e.titleFontItalic ?? !1),
		fontSize: i,
		color: t.colorPaintAuthored === !0 ? t.colorHidden === !0 || !t.color ? "transparent" : `#${t.color}` : t.color ? `#${t.color}` : e.titleFontPaintAuthored === !0 ? e.titleFontColor ? `#${e.titleFontColor}` : "transparent" : e.titleFontColor ? `#${e.titleFontColor}` : "#333"
	};
}
function Oo(e, t, n, r) {
	let i = t.titleRichRuns?.length ? t.titleRichRuns : t.title ? [{ text: t.title }] : [], a = [{
		pieces: [],
		width: 0,
		height: r
	}], o = () => {
		let e = {
			pieces: [],
			width: 0,
			height: r
		};
		return a.push(e), e;
	}, s = a[0];
	for (let a of i) {
		let i = Do(t, a, r);
		for (let t of a.text.split(/(\n|[\t ]+)/).filter((e) => e.length > 0)) {
			if (t === "\n") {
				s = o();
				continue;
			}
			e.font = i.font;
			let r = e.measureText(t).width, a = /^[\t ]+$/.test(t);
			!a && s.pieces.length > 0 && s.width + r > n && (s = o()), !(a && s.pieces.length === 0) && (s.pieces.push({
				text: t,
				width: r,
				font: i.font,
				color: i.color
			}), s.width += r, s.height = Math.max(s.height, i.fontSize));
		}
	}
	return a;
}
function ko(e, t, n, r, i) {
	let a = un(t, r, i);
	if (a.bandH === 0 || !t.titleRichRuns?.length) return a;
	let o = e.font, s = Oo(e, t, Math.max(1, n), a.fontPx);
	e.font = o;
	let c = s.reduce((e, t) => e + t.height, 0);
	return {
		...a,
		bandH: a.topPad + c + a.bottomPad
	};
}
function Ao(e, t, n, r, i, a) {
	if (!t.title) return;
	let o = Lt(t, t.titleStyle ? { style: t.titleStyle } : void 0, t.chartStyleRoles?.title, Nn(t, "title"), !0), s = a / Math.max(1, (t.titleFontSizeHpt ?? 1400) / 100);
	if (!t.titleRichRuns?.length) {
		let c = tr(t, t.titleFontFace);
		e.font = or(a, c ? Kn(c) : dt, t.titleFontBold ?? !0, t.titleFontItalic ?? !1), e.fillStyle = t.titleFontColor ? `#${t.titleFontColor}` : "#333", e.textAlign = "center", e.textBaseline = "top";
		let l = Math.min(i, Ie(e, t.title));
		ar(e, o, {
			x: n + (i - l) / 2,
			y: r,
			w: l,
			h: a * 1.2 + on(t.title, a)
		}, s), gt(e, t.title, n + i / 2, r, a);
		return;
	}
	e.save();
	let c = Oo(e, t, Math.max(1, i), a), l = Math.min(i, Math.max(...c.map((e) => e.width), 0)), u = c.reduce((e, t) => e + t.height, 0);
	ar(e, o, {
		x: n + (i - l) / 2,
		y: r,
		w: l,
		h: u
	}, s), e.textAlign = "left", e.textBaseline = "top";
	let d = r;
	for (let t of c) {
		let r = n + (i - t.width) / 2;
		for (let n of t.pieces) e.font = n.font, e.fillStyle = n.color, e.fillText(n.text, r, d), r += n.width;
		d += t.height;
	}
	e.restore();
}
function jo(e, t, n, r, i, a, o, s) {
	if (!t.title) return;
	let c = t.titleManualLayout;
	if (c) {
		let l = tr(t, t.titleFontFace);
		e.font = or(s, l ? Kn(l) : dt, t.titleFontBold ?? !0, t.titleFontItalic ?? !1);
		let u = Oo(e, t, Math.max(1, i), s), d = Math.min(i, Math.max(...u.map((e) => e.width), 0)), f = {
			x: n + (i - d) / 2,
			y: o,
			w: d,
			h: s + (t.titleRichRuns?.length ? 0 : on(t.title, s))
		}, p = yn({
			...c,
			w: void 0,
			h: void 0
		}, {
			x: n,
			y: r,
			w: i,
			h: a
		}, f);
		if (p) {
			Ao(e, t, p.x, p.y, p.w, s);
			return;
		}
	}
	Ao(e, t, n, o, i, s);
}
function Mo(e, t, n, r, i, a, o, s, c, l, u, d = 0) {
	let f = Number.isFinite(c.gapWidthPercent) && c.gapWidthPercent >= 0 ? c.gapWidthPercent : 150, p = Math.max(0, s / (1 + f / 100));
	for (let s = 0; s < r; s++) {
		let r = t(s), f = n(s);
		if (r == null || f == null || !Number.isFinite(r) || !Number.isFinite(f)) continue;
		let m = a(r), h = o(f), g = Math.abs(h - m);
		if (!(p > 0) || !(g > 0) || !Number.isFinite(g)) continue;
		let _ = f >= r ? c.up : c.down, v = _.fillPaintAuthored === !0 || _.fill != null || _.fillColor != null || _.fillHidden === !0 ? void 0 : f >= r ? u?.upFillColor : u?.downFillColor, y = _.fillColor ?? v, b = i(s) - p / 2, x = Math.min(m, h), S = _.linePaintAuthored === !0 || _.lineColor != null || _.lineHidden === !0, C = _.lineColor ?? (S ? void 0 : u?.lineColor), w = _.lineWidthEmu ?? (S ? void 0 : u?.lineWidthEmu);
		Ne(e, _.style, void 0, s, {
			x: b,
			y: x,
			w: p,
			h: g
		}, l, (e) => {
			if (!_.fillHidden && (_.fill != null || y != null) && Bi(e, _.fill ?? (y ? {
				fillType: "solid",
				color: y
			} : null), {
				x: b,
				y: x,
				w: p,
				h: g
			}, y ? `#${y}` : "rgba(0,0,0,0)", l, d), !_.lineHidden && (_.linePaintAuthored !== !0 || C != null) && (C != null || w != null)) {
				let t = e.getLineDash(), n = e.lineCap, r = e.lineJoin;
				e.strokeStyle = `#${C ?? "000000"}`, e.lineWidth = w == null ? Math.max(1, .75 * l) : it(w, l), e.setLineDash(He(_.lineDash ?? void 0, e.lineWidth)), e.lineCap = _.lineCap === "rnd" ? "round" : _.lineCap === "sq" ? "square" : "butt", e.lineJoin = _.lineJoin === "round" || _.lineJoin === "bevel" ? _.lineJoin : "miter", e.strokeRect(b, x, p, g), e.setLineDash(t), e.lineCap = n, e.lineJoin = r;
			}
		});
	}
}
function No(e, t, n, r, i, a, o, s, c, l, u) {
	for (let d of t.lineGroupDecorations ?? []) {
		let f = t.series.filter((e) => e.lineGroupIndex === d.groupIndex);
		if (f.length === 0 && d.groupIndex === 0 && [
			"line",
			"stackedLine",
			"stackedLinePct"
		].includes(t.chartType) && (f = t.series.filter((e) => e.seriesType == null || e.seriesType === "line")), f.length === 0) continue;
		if (u === "foreground" && d.upDownBars && f.length >= 2) {
			let a = f[0], u = f[f.length - 1], p = t.legacyChartStyle === 2 ? {
				lineColor: "000000",
				lineWidthEmu: 9525,
				upFillColor: "FFFFFF",
				downFillColor: "000000"
			} : void 0, m = {
				...d.upDownBars,
				up: kt(t, d.upDownBars.up, "upBar", p),
				down: kt(t, d.upDownBars.down, "downBar", p)
			};
			Mo(e, (e) => o(a, e), (e) => o(u, e), n, r, i(a), i(u), s, m, c, void 0, l);
		}
		if (u === "foreground") continue;
		let p = d.dropLines ? cn(t, d.dropLines, "dropLine") : null;
		p && rn(e, p, c) && Vt(e, f, n, r, i, a, o);
		let m = d.hiLowLines ? cn(t, d.hiLowLines, "hiLoLine") : null;
		if (m && f.length >= 2 && rn(e, m, c)) {
			let t = i(f[0]);
			for (let i = 0; i < n; i++) {
				let n = Infinity, a = -Infinity;
				for (let e of f) {
					let t = o(e, i);
					t == null || !Number.isFinite(t) || (n = Math.min(n, t), a = Math.max(a, t));
				}
				!Number.isFinite(n) || !Number.isFinite(a) || (e.beginPath(), e.moveTo(r(i), t(n)), e.lineTo(r(i), t(a)), e.stroke());
			}
		}
	}
}
function Po(e, t, n, r) {
	return e != null && Number.isFinite(e) ? y(e, n, r) : t === "max" ? r : t === "min" ? n : y(0, n, r);
}
function Fo(e, t, n) {
	return Po(e.catAxisCrossesAt, e.catAxisCrosses, t, n);
}
function Io(e) {
	return 7 * e;
}
function Lo(a, o, s, c, l = {}, u = 0) {
	let { x: d, y: p, w: m, h } = s, g = o.chartType === "clusteredBarH" || o.chartType === "stackedBarH" || o.chartType === "stackedBarHPct", _ = o.chartType.startsWith("stacked"), v = o.chartType === "stackedBarPct" || o.chartType === "stackedBarHPct", x = o.series.filter((e) => e.seriesType !== "line" && e.seriesType !== "scatter" && e.seriesType !== "area"), C = (e) => e.barGroupDirection == null ? g : e.barGroupDirection === "bar", D = x, k = (e) => e.useSecondaryAxis === !0 ? "secondary-default" : "primary-default", A = (e) => e.barGroupIndex == null ? k(e) : `group-${e.barGroupIndex}`, M = (e) => e.barGroupGrouping ?? (v ? "percentStacked" : _ ? "stacked" : "clustered"), te = (e) => {
		let t = M(e);
		return t === "stacked" || t === "percentStacked";
	}, P = (e) => M(e) === "percentStacked", F = o.series.filter((e) => e.seriesType === "line"), I = o.series.filter((e) => e.seriesType === "area"), L = o.series.filter((e) => e.seriesType === "scatter"), ie = new Map(o.series.map((e, t) => [e, t])), ae = /* @__PURE__ */ new Map();
	for (let e of o.plotGroups ?? []) for (let t = e.seriesStart; t < e.seriesStart + e.seriesCount; t++) {
		let n = o.series[t];
		n && ae.set(n, e);
	}
	let B = /* @__PURE__ */ new Map();
	for (let e of o.plotGroups ?? []) {
		if (e.seriesCount === 0) continue;
		let t = B.get(e.valueAxis) ?? {
			count: 0,
			percentCount: 0
		};
		t.count++, e.grouping === "percentStacked" && t.percentCount++, B.set(e.valueAxis, t);
	}
	let V = (e) => {
		let t = B.get(e.valueAxis);
		return t != null && t.count === t.percentCount;
	}, oe = Sa(o, c), se = o.series.some((e) => e.useSecondaryAxis === !0), H = !g && o.secondaryValAxis && se ? o.secondaryValAxis : null, me = !g && o.chartexPrimaryAxisRight === !0, ge = H ? D.filter((e) => e.useSecondaryAxis === !0) : [], _e = H ? D.filter((e) => e.useSecondaryAxis !== !0) : D, U = ge.length > 0 ? o.secondaryCatAxis : null, be = ge[0]?.categories?.length ? ge[0].categories : o.categories, xe = Xt(o), W = xe.length;
	if (W === 0) return;
	let we = /* @__PURE__ */ new Map();
	for (let e of D) {
		let t = A(e), n = we.get(t);
		n ? n.push(e) : we.set(t, [e]);
	}
	let Te = (e) => we.get(A(e)) ?? [e], De = /* @__PURE__ */ new Map();
	for (let [e, t] of we) {
		let n = Array(W).fill(0);
		for (let e of t) for (let t = 0; t < W; t++) n[t] += Math.abs(e.values[t] ?? 0);
		De.set(e, n);
	}
	let ke = (e, t) => De.get(A(e))?.[t] || 1, je = (e) => {
		let t = ae.get(e);
		return t == null || V(t) ? 100 : 1;
	}, Me = (e, t) => P(e) ? je(e) / ke(e, t) : 1, Pe = /* @__PURE__ */ new Map(), Re = /* @__PURE__ */ new Map();
	for (let e of [...F, ...I]) Pe.set(e, Array.from({ length: W }, (t, n) => e.values[n] ?? 0)), Re.set(e, Array(W).fill(0));
	for (let e of o.plotGroups ?? []) {
		if (e.kind !== "line" && e.kind !== "area") continue;
		let t = o.series.slice(e.seriesStart, e.seriesStart + e.seriesCount), n = e.grouping === "stacked" || e.grouping === "percentStacked", r = e.grouping === "percentStacked", i = r && V(e) ? 100 : 1;
		for (let e = 0; e < W; e++) {
			let a = r && t.reduce((t, n) => t + Math.abs(n.values[e] ?? 0), 0) || 1, o = 0;
			for (let s of t) {
				let t = s.values[e] ?? 0, c = r ? t / a * i : t, l = Re.get(s), u = Pe.get(s);
				l == null || u == null || (l[e] = n ? o : 0, o = n ? o + c : c, u[e] = o);
			}
		}
	}
	let G = (e, t) => Pe.get(e)?.[t] ?? e.values[t] ?? 0, He = (e, t) => Re.get(e)?.[t] ?? 0, Ge = (e) => P(e) ? (e.errBars ?? []).map((t) => ({
		...t,
		plus: t.plus.map((t, n) => t == null ? t : t * Me(e, n)),
		minus: t.minus.map((t, n) => t == null ? t : t * Me(e, n))
	})) : e.errBars ?? [], qe = (e) => {
		let t = ae.get(e);
		return t?.kind === "bar" || t?.kind === "bar3D" ? t.seriesCount === 1 && t.varyColors === !0 : pe(o);
	}, Je = D.map((e) => new Map((e.dataPointOverrides ?? []).map((e) => [e.idx, e]))), Ye = D.map((e) => new Map((e.dataLabelOverrides ?? []).map((e) => [e.idx, e]))), Xe = D.map((e, t) => Fe(e, t)), Ze = Ln(o), et = Ze && b(o, D), rt = /* @__PURE__ */ new Map();
	Ze && D.forEach((e, t) => {
		let n = Xe[t], r = e.color ?? Ni(o, n, D.length, e.chartexStyle);
		rt.set(e, Xi(o, e.name, e, o.chartexDataPointStyle, n, D.length, r, !1, !0, !0));
	});
	let J = D.findIndex(qe), at = J >= 0 ? D[J] : void 0, ot = {
		...o,
		series: (Ze ? D : o.series).map((e) => rt.get(e) ?? e)
	}, ct = ko(a, o, m, h, c), lt = ct.fontPx, ut = ct.topPad, dt = ct.bandH, pt = Ae(o.catAxisFontSizeHpt, h, c), mt = Ae(o.valAxisFontSizeHpt, h, c), ht = !g && !Ba(o) && o.catAxisNoMultiLevelLabels !== !0 && (o.categoryLevels?.length ?? 0) > 1 ? o.categoryLevels : null, vt = (e, t) => Ft((ht?.[e] ?? []).filter((e) => (e ?? "") !== ""), rr(t)), xt = ht ? (ht.length - 1) * (pt + 4) : 0;
	for (let e = 1; e < (ht?.length ?? 0); e++) xt += vt(e, pt);
	let St = Ba(o), Ct = St && Va(o), Et = Ha(o, pt), Dt = Ka(o, c), Ot = qa(a, o, c), kt = Fa(a, ot, m, h, c), { legRightW: At, legLeftW: Mt, legTopH: Nt, legBottomH: It } = hn(kt, o.legendOverlay === !0), Lt = ft(o, m, h, c), zt = Lt.catFontPx, Vt = Lt.valFontPx, Ut = g ? o.valAxisTitle ? Vt + n(h) + 4 + Y(o.valAxisTitle, Vt, "horizontal", o.valAxisTitleRotation, o.valAxisTitleVerticalMode) : 0 : Lt.catBandH, qt = g ? o.catAxisTitle ? zt + n(m) + 4 + Y(o.catAxisTitle, zt, "left", o.catAxisTitleRotation, o.catAxisTitleVerticalMode) : 0 : Lt.valBandW, Jt = en(U?.fontSizeHpt, c) ?? 9 * c, Zt = U && !U.hidden && U.tickLabelPos !== "none" ? Jt + ce(be, U, o, Jt) + T(Ht(Jt), U.labelOffsetPercent) + 2 : 0, Qt = U?.title ? Oe(U.titleFontSizeHpt, c) + 6 + Y(U.title, Oe(U.titleFontSizeHpt, c), "horizontal", U.titleRotation, U.titleVerticalMode) : 0, $t = dt + Nt + mt / 2 + 2 + Zt + Qt, tn = g ? (o.valAxisHidden ? h * .02 : Dn(mt)) + Dt + Ut + It : (St ? 0 : Dn(pt, o.catAxisLabelOffsetPercent, o.cartesianAutoLayoutProfile)) + xt + Dt + Et + Ut + It, nn = h - $t - tn, an = 0;
	if (g && !o.catAxisHidden && j(o)) {
		let e = o.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, nn / W * .5)) : pt;
		a.save(), a.font = or(e, yt(o, o.catAxisFontFace, "minor"), o.catAxisFontBold ?? !1, o.catAxisFontItalic ?? !1);
		for (let e of xe) an = Math.max(an, Ie(a, er(e, o.catAxisFormatCode, o.date1904)));
		a.restore(), an += T(o.catAxisFontSizeHpt == null ? 4 : Rt(e), o.catAxisLabelOffsetPercent) + $e * c;
	}
	let on = Math.min(an, Math.max(0, m / 2 - qt - Mt)), sn = g ? m - ((o.catAxisHidden ? m * .03 : on) + qt + Mt) - (At + m * .03) : 0, ln = o.valAxisHidden ? void 0 : (g ? sn : nn) / c, un = (e, t) => {
		let n = D[e], r = n?.values[t] ?? 0;
		if (!n || !te(n)) return r;
		let i = Te(n), a = P(n), o = 1;
		a && (o = i.reduce((e, n) => e + Math.abs(n.values[t] ?? 0), 0) || 1);
		let s = a ? Me(n, t) * o : 1, c = a ? r / o * s : r, l = 0, u = i.indexOf(n);
		for (let e = 0; e <= u; e++) {
			let n = i[e]?.values[t] ?? 0, r = a ? n / o * s : n;
			c < 0 == r < 0 && (l += r);
		}
		return l;
	}, dn = (o.plotGroups ?? []).filter((e) => e.seriesCount > 0 && e.valueAxis !== "secondary"), fn = dn.length > 0 ? dn.every((e) => e.grouping === "percentStacked") : _e.some(P), mn = 0, gn = 0;
	for (let e = 0; e < W; e++) {
		let t = /* @__PURE__ */ new Map();
		for (let e of _e) {
			let n = A(e), r = t.get(n);
			r ? r.push(e) : t.set(n, [e]);
		}
		for (let n of t.values()) {
			let t = n[0], r = te(t), i = P(t), a = i && n.reduce((t, n) => t + Math.abs(n.values[e] ?? 0), 0) || 1, o = 0, s = 0;
			for (let t of n) {
				let n = t.values[e] ?? 0, c = i ? n / a * je(t) : n;
				r ? c >= 0 ? o += c : s += c : (mn = Math.max(mn, c), gn = Math.min(gn, c));
			}
			r && (mn = Math.max(mn, o), gn = Math.min(gn, s));
		}
	}
	let _n = (e, t) => e.seriesType !== "line" || !po(o, e, Fe(e, ie.get(e) ?? 0)) ? null : ho(fo(e, W, o.dispBlanksAs).map((t) => t.map((t) => G(e, t))), t), yn = null;
	for (let e of [...F, ...I]) {
		if (H && e.useSecondaryAxis === !0) continue;
		for (let t = 0; t < W; t++) {
			if (e.values[t] == null) continue;
			let n = G(e, t);
			mn = Math.max(mn, n), gn = Math.min(gn, n);
		}
		let t = _n(e, o.valAxisLogBase);
		t && (fn ? yn = yn ? [Math.min(yn[0], t[0]), Math.max(yn[1], t[1])] : t : (gn = Math.min(gn, t[0]), mn = Math.max(mn, t[1])));
	}
	for (let e of _e) {
		let t = D.indexOf(e);
		for (let n of Ge(e)) O({
			...e,
			errBars: [n]
		}, g ? "x" : "y", (n) => e.values[n] == null ? null : un(t, n), (e) => {
			mn = Math.max(mn, e), gn = Math.min(gn, e);
		});
	}
	for (let e of [...F, ...I]) H && e.useSecondaryAxis === !0 || O(e, "y", (t) => e.values[t] ?? null, (e) => {
		let t = e;
		mn = Math.max(mn, t), gn = Math.min(gn, t);
	});
	fn && (_e.some((e) => e.values.some((e) => e != null && e > 0)) && (mn = Math.max(mn, 100)), _e.some((e) => e.values.some((e) => e != null && e < 0)) && (gn = Math.min(gn, -100))), o.valMax != null && (mn = fn ? o.valMax * 100 : o.valMax), o.valMin != null && (gn = fn ? o.valMin * 100 : o.valMin), mn === 0 && gn === 0 && (mn = 1);
	let bn = et ? Yt(o, _e, W, ln) : pn(o, gn, mn, ln, fn, g ? "horizontal" : "vertical", yn), { step: xn } = bn, Sn = new Set(D), Cn = new Set(x), wn = (o.plotGroups ?? []).filter((e) => e.seriesCount > 0 && e.valueAxis === "secondary"), Tn = wn.length > 0 ? wn.every((e) => e.grouping === "percentStacked") : ge.some(P), En = o.series.filter((e) => !Cn.has(e) || Sn.has(e)).map((e) => {
		if (e.useSecondaryAxis !== !0) return e;
		if (Pe.has(e)) return {
			...e,
			values: e.values.map((t, n) => t == null ? t : G(e, n)),
			errBars: Tn ? (e.errBars ?? []).map((e) => ({
				...e,
				plus: e.plus.map((e) => e == null ? e : e * 100),
				minus: e.minus.map((e) => e == null ? e : e * 100)
			})) : e.errBars
		};
		if (Sn.has(e)) {
			let t = D.indexOf(e);
			return {
				...e,
				values: e.values.map((e, n) => e == null ? e : un(t, n)),
				errBars: Ge(e)
			};
		}
		return Tn ? {
			...e,
			values: e.values.map((e) => e == null ? e : e * 100),
			errBars: (e.errBars ?? []).map((e) => ({
				...e,
				plus: e.plus.map((e) => e == null ? e : e * 100),
				minus: e.minus.map((e) => e == null ? e : e * 100)
			}))
		} : e;
	});
	if (Tn && ge[0]) {
		let e = [];
		ge.some((e) => e.values.some((e) => e != null && e > 0)) && e.push(100), ge.some((e) => e.values.some((e) => e != null && e < 0)) && e.push(-100), En.push({
			...ge[0],
			values: e,
			errBars: []
		});
	}
	let On = [];
	if (H) for (let e of F) {
		if (e.useSecondaryAxis !== !0) continue;
		let t = _n(e, H.logBase);
		t && On.push(...t);
	}
	let An = Kt(H, En, nn / c, g ? "x" : "y", Tn, ge.length > 0, void 0, void 0, On), jn = Math.max(8, Math.min(11, h / 20)), Mn = o.valAxisFontSizeHpt == null ? Math.max(8, Math.min(11, nn / 20)) : mt, Pn = a.font, zn = 0, Bn = 0;
	if (!g && !o.valAxisHidden) {
		a.font = or(Mn, yt(o, o.valAxisFontFace, "minor"), o.valAxisFontBold ?? !1, o.valAxisFontItalic ?? !1);
		let e = 0;
		for (let t of bn.majorLines) {
			let n = Rn(o, t, fn);
			e = Math.max(e, Ie(a, n));
		}
		zn = e, Bn = zn + 16;
	}
	let Vn = en(H?.fontSizeHpt, c) ?? jn, Hn = 0;
	if (H && !H.hidden) {
		a.font = `${Vn}px ${yt(o, H.fontFace, "minor")}`;
		let e = 0;
		for (let t of An?.majorLines ?? []) e = Math.max(e, Ie(a, jt(Tn ? t / 100 : t, H.formatCode ?? null, o.date1904, H.displayUnits)));
		Hn = e + 18;
	}
	a.font = Pn;
	let Wn = o.valAxisHidden || o.valAxisTickLabelPos === "none" ? 0 : Ft(bn.majorLines.map((e) => Rn(o, e, fn)), rr(Mn)), Kn = H && !H.hidden && H.tickLabelPos !== "none" && !g ? Ft((An?.majorLines ?? []).map((e) => jt(Tn ? e / 100 : e, H.formatCode ?? null, o.date1904, H.displayUnits)), rr(Vn)) : 0, Jn = g ? 0 : Math.max(Wn, Kn) / 2, Yn = g ? Wn : 0;
	$t += Jn;
	let Xn = H && H.title ? re(H, c) : 0, Zn = {
		t: $t,
		r: At + m * .03 + (me ? Bn + qt : Hn + Xn),
		b: tn + Yn,
		l: g ? Mt + Math.max((o.catAxisHidden ? m * .03 : on) + qt, Ot) : Mt + Math.max(me ? Hn + Xn : qt + Bn, Ot)
	};
	Zn.t = Vo(o, kt, d, p, m, h, dt, Zn.t);
	let tr = g ? {
		t: 0,
		r: o.valAxisHidden ? 0 : Mn / 2,
		b: o.valAxisHidden ? 0 : Mn + Yn + Ut,
		l: o.catAxisHidden ? 0 : an + qt
	} : bt({
		valAxisHidden: o.valAxisHidden,
		catAxisHidden: o.catAxisHidden,
		valLabelWidth: zn,
		valLabelFontPx: Mn,
		catLabelFontPx: pt,
		valLabelGapPx: o.valAxisFontSizeHpt == null ? 12 : Rt(Mn),
		catLabelGapPx: o.catAxisFontSizeHpt == null ? T(3, o.catAxisLabelOffsetPercent) : T(Ht(pt), o.catAxisLabelOffsetPercent),
		outerTextMarginPx: $e * c,
		valTitleBandW: qt,
		catTitleBandH: Ut,
		secondaryBandW: Hn + Xn,
		valLabelExtraTopPx: Jn
	}), nr = Tt(o, d, p, m, h, c, {
		titleBand: ct,
		legendReserve: kt,
		pad: Zn,
		honorPlotAreaManualLayout: !0,
		manualOuterInsets: tr
	}), ar = ko(a, o, nr.plotRect.pw, h, c);
	Math.abs(ar.bandH - ct.bandH) > .01 && (ct = ar, lt = ct.fontPx, ut = ct.topPad, dt = ct.bandH, $t = dt + Nt + mt / 2 + 2 + Zt + Qt + Jn, Zn.t = Vo(o, kt, d, p, m, h, dt, $t), nr = Tt(o, d, p, m, h, c, {
		titleBand: ct,
		legendReserve: kt,
		pad: Zn,
		honorPlotAreaManualLayout: !0,
		manualOuterInsets: tr
	}));
	let { px0: X, py0: Z, pw: Q } = nr.plotRect, { ph: $ } = nr.plotRect;
	if (jo(a, o, o.titleManualLayout || !o.titleRichRuns?.length ? d : X, p, o.titleManualLayout || !o.titleRichRuns?.length ? m : Q, h, p + ut, lt), Q <= 0 || $ <= 0) return;
	let lr = r(o, xe, g ? !Ke(o) : Ke(o)), ur = et ? ye(o, D, lr) : null, dr = K(o), fr = [], pr = 0, mr = 0;
	if (!Ct && !g && !lr && !o.catAxisHidden && j(o) && dr === 0) {
		let e = Q / W, t = o.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, e * .5)) : pt;
		a.save(), a.font = or(t, yt(o, o.catAxisFontFace, "minor"), o.catAxisFontBold ?? !1, o.catAxisFontItalic ?? !1);
		for (let n of xe) {
			let r = er(n, o.catAxisFormatCode, o.date1904);
			fr.push(wt(a, r, Math.max(1, e), Bo(r, t)));
		}
		a.restore();
		let n = Math.max(1, ...fr.map((e) => e.length));
		n > 1 && (pr = (n - 1) * (t + 2)), mr = Ft(xe.map((e) => er(e, o.catAxisFormatCode, o.date1904)), rr(t));
	} else if (!Ct && !g && !o.catAxisHidden && j(o)) {
		let e = o.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, Q / W * .5)) : pt;
		pr = Ft(lr ? lr.majorTicks.map((e) => er(String(e.serial), o.catAxisFormatCode, o.date1904)) : xe.map((e) => er(e.toString(), o.catAxisFormatCode, o.date1904)), rr(e), dr), mr = pr;
	}
	let hr = o.plotAreaManualLayout?.layoutTarget === "inner" && o.plotAreaManualLayout.w != null && o.plotAreaManualLayout.h != null;
	St && (Et += pr), !hr && pr > 0 && ($ = Math.max(1, $ - pr));
	let gr = Ua(o, Q, me ? 0 : Hn + Xn), _r = St ? Ja(a, o, gr / W, c) : null;
	_r && _r.totalHeight > Dt && ($ = Math.max(1, $ - (_r.totalHeight - Dt))), In(a, o, X, Z, Q, $, c, u);
	let vr = (e) => Z + $ - bn.frac(e) * $, yr = (e) => X + bn.frac(e) * Q, br = vr(0), xr = yr(0), Sr = (e) => vr(e), Cr = An ? An.makeToY(Z, $) : vr, wr = (e) => Cr(e), Tr = vn(o, c);
	a.textBaseline = "middle";
	let Er = o.valAxisFontSizeHpt == null ? Math.max(8, Math.min(11, $ / 20)) : mt;
	a.font = or(Er, yt(o, o.valAxisFontFace, "minor"), o.valAxisFontBold ?? !1, o.valAxisFontItalic ?? !1);
	let Dr = o.valAxisFontColor ? `#${o.valAxisFontColor}` : "#555";
	if (a.fillStyle = Dr, !o.valAxisHidden) {
		let t = Fn(o, c);
		for (let e of bn.minorLines) if (!g) Gt(a, X, Q, vr(e), !1, t);
		else {
			let n = yr(e);
			a.strokeStyle = t.color, a.lineWidth = t.width;
			let r = t.dash.length > 0 && a.getLineDash ? a.getLineDash() : [];
			t.dash.length > 0 && a.setLineDash(t.dash), a.beginPath(), a.moveTo(n, Z), a.lineTo(n, Z + $), a.stroke(), t.dash.length > 0 && a.setLineDash(r);
		}
		let n = e(o), r = o.valAxisTickLabelPos !== "none";
		for (let e of bn.majorLines) {
			let t = Math.abs(e) < xn * 1e-9, i = Rn(o, e, fn);
			if (g) {
				let s = yr(e);
				if (n) {
					a.strokeStyle = Tr.explicit ? Tr.color : t ? "#aaa" : Tr.color, a.lineWidth = Tr.explicit ? Tr.width : t ? 1 : Tr.width;
					let e = Tr.dash.length > 0 && a.getLineDash ? a.getLineDash() : [];
					Tr.dash.length > 0 && a.setLineDash(Tr.dash), a.beginPath(), a.moveTo(s, Z), a.lineTo(s, Z + $), a.stroke(), Tr.dash.length > 0 && a.setLineDash(e);
				}
				if (r) {
					a.textAlign = "center";
					let e = o.valAxisFontSizeHpt == null ? 10 : Ht(Er);
					Qn(a, i, s, Z + $ + e, rr(Er));
				}
			} else {
				let s = vr(e);
				if (n && Gt(a, X, Q, s, t, Tr), r) {
					a.textAlign = me ? "left" : "right";
					let e = l.gapPolicy === "chartex" ? Io(c) : o.valAxisFontSizeHpt == null ? 12 : Rt(Er);
					gt(a, i, me ? X + Q + e : X - e, s, rr(Er));
				}
			}
		}
	}
	if (H && An && Ce(a, H, An, Cr, X, Q, c), !o.catAxisHidden && q(o)) {
		let e = N(o, c);
		a.strokeStyle = e.color, a.lineWidth = e.width;
		let t = e.dash.length > 0 && a.getLineDash ? a.getLineDash() : [];
		e.dash.length > 0 && a.setLineDash(e.dash);
		let n = lr ? lr.majorTicks.map((e) => e.fraction) : Ue(o, W);
		for (let e of n) {
			if (a.beginPath(), g) {
				let t = Z + e * $;
				a.moveTo(X, t), a.lineTo(X + Q, t);
			} else {
				let t = X + e * Q;
				a.moveTo(t, Z), a.lineTo(t, Z + $);
			}
			a.stroke();
		}
		e.dash.length > 0 && a.setLineDash(t);
	}
	let { color: Or, width: kr } = st(o.catAxisLineColor, o.catAxisLineWidthEmu, c), { color: Ar, width: jr } = st(o.valAxisLineColor, o.valAxisLineWidthEmu, c), Mr = !o.catAxisHidden && !o.catAxisLineHidden, Nr = !o.valAxisHidden && !o.valAxisLineHidden && o.valAxisLineColor != null, Pr = Fo(o, bn.min, bn.max), Fr = g ? Z + $ : vr(Pr), Ir = g ? yr(Pr) : X, Lr = !g && (o.catAxisTickLabelPos ?? "nextTo") === "nextTo" ? Fr : Z + $, Rr = Math.max(1, Math.floor(o.catAxisTickMarkSkip ?? 1)), zr = !g && ht != null && lr == null && !o.catAxisLineHidden && tt(o) && Math.abs(Lr - Fr) < .01, Br = () => {
		if (g) Mr && kn(a, Ir, Z, Ir, Z + $, Or, kr, o.catAxisLineDash), Nr && kn(a, X, Z + $, X + Q, Z + $, Ar, jr, o.valAxisLineDash);
		else if (Mr && kn(a, X, Fr, X + Q, Fr, Or, kr, o.catAxisLineDash), Nr) {
			let e = me ? X + Q : X;
			kn(a, e, Z, e, Z + $, Ar, jr, o.valAxisLineDash);
		}
		if (!o.valAxisHidden && o.valAxisMajorTickMark && o.valAxisMajorTickMark !== "none") for (let e of bn.majorLines) g ? z(a, o.valAxisMajorTickMark, "cat", Z + $, yr(e), Ar, jr, !1, o.valAxisLineHidden, "major", c, o.valAxisLineDash) : z(a, o.valAxisMajorTickMark, "val", me ? X + Q : X, vr(e), Ar, jr, me, o.valAxisLineHidden, "major", c, o.valAxisLineDash);
		if (!o.valAxisHidden && o.valAxisMinorTickMark && o.valAxisMinorTickMark !== "none") for (let e of bn.minorTicks) g ? z(a, o.valAxisMinorTickMark, "cat", Z + $, yr(e), Ar, jr, !1, o.valAxisLineHidden, "minor", c, o.valAxisLineDash) : z(a, o.valAxisMinorTickMark, "val", me ? X + Q : X, vr(e), Ar, jr, me, o.valAxisLineHidden, "minor", c, o.valAxisLineDash);
		if (!o.catAxisHidden && o.catAxisMajorTickMark && o.catAxisMajorTickMark !== "none") {
			let e = zr ? [] : Ue(o, W), t = lr ? lr.majorTicks.map((e) => e.fraction) : e.filter((e, t) => t % Rr === 0);
			for (let e of t) g ? z(a, o.catAxisMajorTickMark, "val", Ir, Z + e * $, Or, kr, !1, o.catAxisLineHidden, "major", c, o.catAxisLineDash) : z(a, o.catAxisMajorTickMark, "cat", Fr, X + e * Q, Or, kr, !1, o.catAxisLineHidden, "major", c, o.catAxisLineDash);
		}
		if (!o.catAxisHidden && o.catAxisMinorTickMark && o.catAxisMinorTickMark !== "none") {
			let e = tt(o) ? Array.from({ length: W }, (e, t) => (t + .5) / W) : Array.from({ length: Math.max(0, W - 1) }, (e, t) => (t + .5) / (W - 1)), t = lr ? lr.minorTicks.map((e) => e.fraction) : e;
			for (let e of t) g ? z(a, o.catAxisMinorTickMark, "val", Ir, Z + e * $, Or, kr, !1, o.catAxisLineHidden, "minor", c, o.catAxisLineDash) : z(a, o.catAxisMinorTickMark, "cat", Fr, X + e * Q, Or, kr, !1, o.catAxisLineHidden, "minor", c, o.catAxisLineDash);
		}
	}, Vr = (e) => e ? $ / W : Q / W, Hr = Vr(g), Ur = Ke(o), Wr = (e, t) => t ? Ur ? e : W - 1 - e : Ur ? W - 1 - e : e, Gr = (e, t = g) => lr ? lr.categoryBandFractions[e] * (t ? $ : Q) : Vr(t), Kr = (e, t = g) => lr ? (t ? Z : X) + lr.positions[e] * (t ? $ : Q) - Gr(e, t) / 2 : (t ? Z : X) + Wr(e, t) * Vr(t), qr = (e) => lr ? X + lr.positions[e] * Q : X + Wr(e, !1) * Vr(!1) + Vr(!1) / 2, Jr = (e, t) => {
		let n = e[0], r = n ? te(n) : _, a = r ? 1 : Math.max(1, e.length), s = n?.barGroupOverlap ?? o.barOverlap ?? 0, c = r || !Number.isFinite(s) ? 0 : Math.max(-100, Math.min(100, s)), u = i(n?.barGroupGapWidth ?? o.barGapWidth, l.gapPolicy ?? "legacy"), d = t / (1 + (a - 1) * (1 - c / 100) + u / 100), f = r ? 0 : d * (1 - c / 100);
		return {
			barW: d,
			clusterGap: f,
			catStart: (t - (d + (a - 1) * f)) / 2
		};
	}, Yr = (o.barGroupDecorations ?? []).some((e) => e.seriesLines?.length === 1) ? D.map(() => Array(W).fill(null)) : null;
	for (let e = 0; e < I.length; e++) {
		let t = I[e], n = cr(t.dataPointOverrides), r = ie.get(t) ?? e, i = Fe(t, r), s = de(r, t), l = le(o, t, void 0, i), d = H && t.useSecondaryAxis === !0 ? wr : Sr, f = o.dispBlanksAs ?? "zero", p = [], m = () => {
			if (p.length !== 0) {
				lr && (a.save(), a.beginPath(), a.rect(X, Z, Q, $), a.clip()), a.beginPath(), a.moveTo(p[0].x, p[0].baseY), a.lineTo(p[0].x, p[0].y), ze(a, p, !1);
				for (let e = p.length - 1; e >= 0; e--) a.lineTo(p[e].x, p[e].baseY);
				a.closePath(), zi(a, l, {
					x: p[0].x,
					y: Z,
					w: Math.max(1, p[p.length - 1].x - p[0].x),
					h: $
				}, s, c, u), R(a, o, "dataPoint", t, void 0, i, s, 1.5, c, {
					x: X,
					y: Z,
					w: Q,
					h: $
				}, u) && a.stroke(), lr && a.restore(), p = [];
			}
		};
		for (let e = 0; e < W; e++) {
			if (t.sourceHidden?.[e] === !0) {
				m();
				continue;
			}
			t.values[e] == null && (f === "gap" && m(), f !== "zero") || p.push({
				x: qr(e),
				y: d(G(t, e)),
				baseY: d(He(t, e))
			});
		}
		m();
		let h = ia(o, t, r), g = (t.showMarker === !0 || S(t)) && t.markerSymbol !== "none";
		if (g || _t(t)) {
			let e = Math.max(2, 2.5 * c);
			for (let r = 0; r < W; r++) {
				if (t.sourceHidden?.[r] === !0 || t.values[r] == null) continue;
				let i = n.get(r), l = ir(t, i, "circle", g);
				if (l === "none") continue;
				let f = qr(r), p = d(G(t, r));
				if (h || E(i)) {
					let e = i?.markerLineWidthEmu ?? t.markerLineWidthEmu;
					ra(a, o, t, i, r, f, p, l, i?.markerSize ?? t.markerSize ?? 5, $n(t, i, r, s), i?.markerLine ?? t.markerLine ?? null, c, e == null ? void 0 : it(e, c), Le(t, i, r), u);
				} else a.fillStyle = s, a.beginPath(), a.arc(f, p, e, 0, Math.PI * 2), a.fill();
			}
		}
	}
	for (let e = 0; e < W; e++) {
		let n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
		for (let i = 0; i < D.length; i++) {
			let s = D[i], l = C(s), f = Gr(e, l), g = H != null && s.useSecondaryAxis === !0, _ = Te(s), v = A(s), b = te(s), x = P(s), S = x && _.reduce((t, n) => t + Math.abs(n.values[e] ?? 0), 0) || 1, T = n.get(v) ?? 0, E = r.get(v) ?? 0, O = Math.max(0, _.indexOf(s)), { barW: k, clusterGap: j, catStart: M } = Jr(_, f), N = g && An ? An.makeToY(Z, $) : vr, F = An ? U?.crossesAt != null && Number.isFinite(U.crossesAt) ? Math.max(An.min, Math.min(An.max, U.crossesAt)) : U?.crosses === "max" ? An.max : U?.crosses === "min" ? An.min : Math.max(An.min, Math.min(An.max, 0)) : 0, re = g ? N(F) : br, I = s.values[e] ?? 0, L = x ? I / S * je(s) : I, z = L < 0, ae = g && An ? An.max : bn.max, B = z && (s.invertIfNegative === !0 || s.automaticNegativeStyle === !0), V = Je[i].get(e), se = V?.color ?? s.dataPointColors?.[e], ce = qe(s), fe = Ze ? w(o, s, i, e) : ce ? e : Xe[i], pe = le(o, s, V, fe, e), me = pe?.fillType === "solid" ? pe.color.startsWith("#") ? pe.color : `#${pe.color}` : se ? `#${se}` : ce ? ne(e, s) : de(i, s), he = B ? s.automaticNegativeStyle === !0 || s.invertedFillHidden === !0 ? null : s.invertedFill : void 0, ge = Nn(o, "dataPoint"), _e = We(V?.chartexStyle, ge, fe), ve = V?.fillHidden === !0 ? ee(ge) : void 0, ye = _e !== void 0 || ve !== void 0 || V?.color != null, be = Ze ? Ui(o, s, V, fe, D.length) : void 0, Se = be === void 0 ? ye || he === void 0 ? pe : he : be, Ce = (e, n) => {
				if (Ze) {
					let t = qi(o, s, V, fe, D.length, me);
					return t.paint && t.paint.fillType !== "solid" ? !1 : Ji(e, t, c);
				}
				if (V?.lineHidden != null || V?.lineColor != null || V?.lineWidthEmu != null || V?.lineDash != null || V?.chartexStyle?.linePaintAuthored === !0 || V?.chartexStyle?.lineHidden === !0) return R(e, o, "dataPoint", s, V, fe, me, 1, c, n, u, !1);
				if (B && (s.invertedLineHidden != null || s.invertedLineColor != null || s.invertedLineWidthEmu != null)) return s.invertedLineHidden ? !1 : (e.strokeStyle = `#${s.invertedLineColor ?? "000000"}`, e.lineWidth = it(s.invertedLineWidthEmu, c), e.setLineDash([]), !0);
				if (s.automaticNegativeStyle === !0) return e.strokeStyle = "#000000", e.lineWidth = .75 * c, e.setLineDash([]), !0;
				let r = B && o.chartType === "clusteredBar" && o.legacyChartStyle === 2 && s.invertedFillAuthored === !0 && s.invertedFill != null && s.invertedLineAuthored === !1, a = s.lineHidden === !0 || s.lineColor != null || s.lineWidthEmu != null;
				if (r && a) return s.lineHidden || !s.lineColor ? !1 : (e.strokeStyle = `#${s.lineColor}`, e.lineWidth = it(s.lineWidthEmu, c), e.setLineDash([]), !0);
				if (r) return e.strokeStyle = "#000000", e.lineWidth = .75 * c, e.setLineDash([]), !0;
				let l = t(o, "dataPoint", ie.get(s) ?? i) ?? o.chartexDataPointStyle, d = Qe(V?.chartexStyle, fe), f = d === void 0 ? Qe(s.chartexStyle, fe) : d;
				return !l && !Ze && f === void 0 && !s.lineColor && s.lineHidden !== !0 ? !1 : R(e, o, "dataPoint", s, V, fe, me, 1, c, n, u, !1);
			}, W = ue(V?.chartexStyle, s.chartexStyle), we = (e, t, n, r, i) => {
				if (Bi(e, Se === void 0 ? s.fillPattern : Se, {
					x: t,
					y: n,
					w: r,
					h: i
				}, me, c, u), r > 0 && i > 0 && Ce(e, {
					x: t,
					y: n,
					w: r,
					h: i
				})) {
					let a = e.lineWidth;
					e.strokeRect(t + a / 2, n + a / 2, Math.max(0, r - a), Math.max(0, i - a));
				}
			};
			if (l) {
				let n = O, r = b ? Kr(e, !0) + M : Kr(e, !0) + M + n * j, l = b ? yr(z ? E : T) : xr, f = yr(b ? (z ? E : T) + L : L), g = y(Math.min(l, f), X, X + Q), _ = y(Math.max(l, f), X, X + Q), v = Math.max(0, _ - g);
				Yr && s.values[e] != null && (Yr[i][e] = {
					categoryStart: r,
					categoryEnd: r + k,
					valueEnd: y(f, X, X + Q)
				}), (!Ze || qn({
					categoryStart: r,
					categoryEnd: r + k,
					valueStart: l,
					valueEnd: f,
					clipCategory: !1,
					valueClipStart: X,
					valueClipEnd: X + Q
				})) && Ne(a, W, t(o, "dataPoint", ie.get(s) ?? i), fe, {
					x: g,
					y: r,
					w: v,
					h: k
				}, c, (e) => we(e, g, r, v, k));
				let S = s.seriesDataLabels, C = Bt(o, s, e, s.categories?.[e] ?? xe[e] ?? "", I, {
					visible: o.showDataLabels,
					showVal: o.showDataLabels && !x,
					showPercent: o.showDataLabels && x,
					showCatName: !1
				}, Ye[i], x ? L / 100 : void 0, s.useSecondaryAxis && H ? H.displayUnits : o.valAxisDisplayUnits);
				if (C && eo(o, I, ae)) {
					let t = en(C.fontSizeHpt ?? o.dataLabelFontSizeHpt, c) ?? Math.max(7, Math.min(11, k * .6)), n = Ye[i].get(e), l = C.fontBold || S?.fontBold == null && n?.fontBold == null, f = yt(o, C.fontFace ?? o.dataLabelFontFace, "minor");
					a.font = `${C.textStyle.fontItalic ? "italic " : ""}${l ? "bold " : ""}${t}px ${f}`, Ro(a, C.text, g, r, v, k, "horizontal", C.position ?? o.dataLabelPosition ?? (b ? "ctr" : null), s.dataLabelColors?.[e] ?? C.fontColor ?? s.labelColor ?? o.dataLabelFontColor ?? null, t, {
						x: X,
						y: Z,
						w: Q,
						h: $
					}, {
						x: d,
						y: p,
						w: m,
						h
					}, n?.manualLayout, z, ro(o, n, c, f, l, C.textStyle), C.showLegendKey ? oe(ie.get(s) ?? i, e) : void 0, C.textStyle, c, Gn(n?.labelBox, S?.labelBox), u);
				}
			} else {
				let n = b ? Kr(e, !1) + M : Kr(e, !1) + M + O * j;
				if (!Be(ur, i, e) || n + k <= X || n >= X + Q) continue;
				let r = b ? N(z ? E : T) : re, l = N(b ? (z ? E : T) + L : L), f = y(Math.min(r, l), Z, Z + $), g = y(Math.max(r, l), Z, Z + $), _ = Math.max(0, g - f);
				Yr && s.values[e] != null && (Yr[i][e] = {
					categoryStart: n,
					categoryEnd: n + k,
					valueEnd: y(l, Z, Z + $)
				}), (!Ze || qn({
					categoryStart: n,
					categoryEnd: n + k,
					valueStart: r,
					valueEnd: l,
					clipCategory: !0,
					categoryClipStart: X,
					categoryClipEnd: X + Q,
					valueClipStart: Z,
					valueClipEnd: Z + $
				})) && Ne(a, W, t(o, "dataPoint", ie.get(s) ?? i), fe, {
					x: n,
					y: f,
					w: k,
					h: _
				}, c, (e) => we(e, n, f, k, _));
				let v = s.seriesDataLabels, S = Bt(o, s, e, s.categories?.[e] ?? xe[e] ?? "", I, {
					visible: o.showDataLabels,
					showVal: o.showDataLabels && !x,
					showPercent: o.showDataLabels && x,
					showCatName: !1
				}, Ye[i], x ? L / 100 : void 0, s.useSecondaryAxis && H ? H.displayUnits : o.valAxisDisplayUnits);
				if (S && eo(o, I, ae)) {
					let t = en(S.fontSizeHpt ?? o.dataLabelFontSizeHpt, c) ?? Math.max(7, Math.min(11, k * .6)), r = Ye[i].get(e), l = S.fontBold || v?.fontBold == null && r?.fontBold == null, g = yt(o, S.fontFace ?? o.dataLabelFontFace, "minor");
					a.font = `${S.textStyle.fontItalic ? "italic " : ""}${l ? "bold " : ""}${t}px ${g}`, Ro(a, S.text, n, f, _, k, "vertical", S.position ?? o.dataLabelPosition ?? (b ? "ctr" : null), s.dataLabelColors?.[e] ?? S.fontColor ?? s.labelColor ?? o.dataLabelFontColor ?? null, t, {
						x: X,
						y: Z,
						w: Q,
						h: $
					}, {
						x: d,
						y: p,
						w: m,
						h
					}, r?.manualLayout, z, ro(o, r, c, g, l, S.textStyle), S.showLegendKey ? oe(ie.get(s) ?? i, e) : void 0, S.textStyle, c, Gn(r?.labelBox, v?.labelBox), u);
				}
			}
			b && (z ? r.set(v, E + L) : n.set(v, T + L));
		}
	}
	if (Yr) {
		let e = /* @__PURE__ */ new Map();
		for (let t = 0; t < D.length; t++) {
			let n = D[t].barGroupIndex ?? 0, r = e.get(n);
			r ? r.push(t) : e.set(n, [t]);
		}
		for (let t of o.barGroupDecorations ?? []) if (t.seriesLines?.length === 1) {
			if (a.save(), !rn(a, cn(o, t.seriesLines[0], "seriesLine"), c)) {
				a.restore();
				continue;
			}
			a.beginPath(), a.rect(X, Z, Q, $), a.clip();
			for (let n of e.get(t.groupIndex) ?? []) {
				let e = Yr[n], t = C(D[n]);
				for (let n = 0; n + 1 < W; n++) {
					let r = e[n], i = e[n + 1];
					if (!r || !i) continue;
					let o = (r.categoryStart + r.categoryEnd) / 2, s = (i.categoryStart + i.categoryEnd) / 2 >= o;
					a.beginPath(), t ? (a.moveTo(r.valueEnd, s ? r.categoryEnd : r.categoryStart), a.lineTo(i.valueEnd, s ? i.categoryStart : i.categoryEnd)) : (a.moveTo(s ? r.categoryEnd : r.categoryStart, r.valueEnd), a.lineTo(s ? i.categoryStart : i.categoryEnd, i.valueEnd)), a.stroke();
				}
			}
			a.restore();
		}
	}
	let Xr = (e, t) => {
		let n = Te(e), r = Math.max(0, n.indexOf(e)), i = C(e), a = Jr(n, Gr(t, i)), o = Kr(t, i) + a.catStart;
		return te(e) ? o + a.barW / 2 : o + r * a.clusterGap + a.barW / 2;
	}, Zr = (e, t) => {
		if (Number.isInteger(t) && t >= 0 && t < W) return Xr(e, t);
		let n = Te(e), r = Math.max(0, n.indexOf(e)), i = C(e), a = Vr(i), o = Jr(n, a), s = i ? Ur ? t : W - 1 - t : Ur ? W - 1 - t : t;
		return (i ? Z : X) + s * a + o.catStart + (te(e) ? 0 : r) * o.clusterGap + o.barW / 2;
	};
	for (let e = 0; e < D.length; e++) {
		let t = D[e], n = C(t), r = H != null && t.useSecondaryAxis === !0, i = n ? yr : r && An ? An.makeToY(Z, $) : vr, l = de(e, t), d = (t) => un(e, t);
		for (let e of Ge(t)) zo(a, t, Pt(o, e), W, n, (e) => Xr(t, e), i, d, l, c);
		ua(a, t, l, (e) => Zr(t, e - 1), i, c, t.values.map((e, t) => t + 1), {
			chart: o,
			chartRect: s,
			plotRect: {
				x: X,
				y: Z,
				w: Q,
				h: $
			},
			shapeRotationDeg: u
		}, (e, r) => n ? {
			x: i(r),
			y: Zr(t, e - 1)
		} : {
			x: Zr(t, e - 1),
			y: i(r)
		});
	}
	if ((!Ct || g) && !o.catAxisHidden && j(o)) {
		a.fillStyle = o.catAxisFontColor ? `#${o.catAxisFontColor}` : "#555";
		let e = o.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, Hr * .5)) : pt;
		a.font = or(e, yt(o, o.catAxisFontFace, "minor"), o.catAxisFontBold ?? !1, o.catAxisFontItalic ?? !1);
		let t = Hr - 4, n = X - 4 - (d + Mt + qt), r = dr, i = lr ? lr.majorTicks.map((e) => ({
			raw: er(String(e.serial), o.catAxisFormatCode, o.date1904),
			fraction: e.fraction,
			categoryIndex: -1
		})) : xe.map((e, t) => ({
			raw: er(e.toString(), o.catAxisFormatCode, o.date1904),
			fraction: null,
			categoryIndex: t
		}));
		for (let s of i) {
			let { raw: i } = s;
			if (g) {
				let t = s.fraction == null ? Z + Wr(s.categoryIndex, !0) * Hr + Hr / 2 : Z + s.fraction * $, r = T(o.catAxisFontSizeHpt == null ? 4 : Rt(e), o.catAxisLabelOffsetPercent), c = d + Mt + qt, l = X - r, u = o.catAxisLabelAlignment, f = u === "l" ? c : u === "ctr" ? (c + l) / 2 : l;
				a.textAlign = u === "l" ? "left" : u === "ctr" ? "center" : "right", a.textBaseline = "middle", gt(a, i, f, t, rr(e), n);
			} else {
				let n = s.fraction != null || s.categoryIndex < 0 ? {
					fraction: s.fraction ?? .5,
					textAlign: "center"
				} : Ve(s.categoryIndex, W, tt(o), Ur, o.catAxisLabelAlignment), c = X + n.fraction * Q;
				a.textAlign = n.textAlign, a.textBaseline = "top";
				let l = r === 0 ? t : $ * .4, u = T(o.catAxisFontSizeHpt == null ? 3 : Ht(e), o.catAxisLabelOffsetPercent);
				r === 0 ? (s.categoryIndex >= 0 ? fr[s.categoryIndex] ?? Un(i) : Un(i)).forEach((t, n) => {
					a.fillText(t, c, Lr + u + n * (e + 2));
				}) : Ee(a, i, c, Lr + u, r, rr(e), l);
			}
		}
		if (!g && ht) {
			let t = T(o.catAxisFontSizeHpt == null ? 3 : Ht(e), o.catAxisLabelOffsetPercent), n = e + 4;
			a.textAlign = "center", a.textBaseline = "top", a.strokeStyle = Or, a.lineWidth = kr, a.setLineDash([]);
			let r = (e) => {
				if (!zr || e % Rr !== 0) return Lr;
				let t = sr("major", kr, c);
				return o.catAxisMajorTickMark === "cross" ? Lr - t / 2 : o.catAxisMajorTickMark === "in" ? Lr - t : Lr;
			}, i = /* @__PURE__ */ new Set();
			for (let e = 1; e < ht.length; e++) {
				let t = ht[e] ?? [];
				for (let e = 0; e < W; e++) (t[e] ?? "") !== "" && i.add(e);
				i.add(W);
			}
			let s = mr, l = ht.map((t, n) => n === 0 ? s : vt(n, e)), u = (e) => {
				let r = Lr + t + e * n;
				for (let t = 0; t < e; t++) r += l[t];
				return r;
			}, d = Lr + t + e + 2 + s;
			for (let e = 0; e <= W; e++) {
				if (i.has(e)) continue;
				let t = X + e / W * Q;
				a.beginPath(), a.moveTo(t, r(e)), a.lineTo(t, d), a.stroke();
			}
			let f = /* @__PURE__ */ new Map();
			for (let t = 1; t < ht.length; t++) {
				let n = ht[t] ?? [], r = [];
				for (let e = 0; e < W; e++) (n[e] ?? "") !== "" && r.push(e);
				for (let i = 0; i < r.length; i++) {
					let s = r[i], c = r[i + 1] ?? W, d = n[s] ?? "", p = X + s / W * Q, m = X + c / W * Q, h = u(t), g = o.catAxisLabelAlignment, _ = g === "l" ? p : g === "r" ? m : (p + m) / 2;
					a.textAlign = g === "l" ? "left" : g === "r" ? "right" : "center", gt(a, d, _, h, rr(e), Math.max(0, m - p - 4));
					let v = h + e + 2 + l[t];
					for (let e of [s, c]) f.set(e, Math.max(f.get(e) ?? Lr, v));
				}
			}
			for (let [e, t] of f) {
				let n = X + e / W * Q;
				a.beginPath(), a.moveTo(n, r(e)), a.lineTo(n, t), a.stroke();
			}
		}
	}
	if (F.length > 0 && !g) {
		No(a, o, W, qr, (e) => H && e.useSecondaryAxis === !0 ? wr : Sr, () => Fr, (e, t) => e.values[t] == null ? null : G(e, t), Hr, c, u, "background"), lr && (a.save(), a.beginPath(), a.rect(X, Z, Q, $), a.clip());
		for (let e = 0; e < F.length; e++) {
			let t = F[e], n = cr(t.dataPointOverrides), r = de(D.length + e, t), i = H && t.useSecondaryAxis === !0 ? wr : Sr, d = ie.get(t) ?? e, p = Wt(o, d), m = Fe(t, d), h = t.chartexStyle != null || t.lineHidden != null || t.lineColor != null || t.lineWidthEmu != null || o.chartexDataPointLineStyle != null, g = t.smooth === !0, _ = fo(t, W, o.dispBlanksAs).map((e) => e.map((e) => ({
				x: qr(e),
				y: i(G(t, e)),
				index: e
			})));
			if (p) f(a, o, t, _, g, !1, r, 2, c, {
				x: X,
				y: Z,
				w: Q,
				h: $
			}, u, l.semanticLineNoStyleFallback !== !1);
			else {
				let e = (e) => {
					e.beginPath();
					for (let t of _) e.moveTo(t[0].x, t[0].y), ze(e, t, g);
					e.stroke();
				};
				Ne(a, ue(t.chartexStyle), o.chartStyleRoles?.dataPointLine, m, {
					x: X,
					y: Z,
					w: Q,
					h: $
				}, c, (n) => {
					if (Ze) {
						let r = [o.chartexDataPointStyle, o.chartexDataPointLineStyle];
						if (!Ji(n, {
							...Ki(o, Gi(t, m), r, r, m, F.length, `#${Ni(o, m, F.length, t.chartexStyle)}`, { linkedNoStyleFallback: !0 }),
							semanticFallback: !1
						}, c)) return;
						e(n);
						return;
					}
					(!h || Yi(n, o, o.chartexDataPointLineStyle, t, m, F.length, r, c, { linkedNoStyleFallback: l.semanticLineNoStyleFallback })) && (h || (n.strokeStyle = r, n.lineWidth = 2, n.setLineDash([])), e(n));
				});
			}
			let v = t.showMarker !== !1 && t.markerSymbol !== "none", y = v || _t(t), b = ia(o, t, d);
			if (y) for (let e = 0; e < W; e++) {
				if (t.sourceHidden?.[e] === !0 || t.values[e] == null) continue;
				let s = qr(e), l = i(G(t, e)), d = n.get(e), f = ir(t, d, "circle", v);
				if (f !== "none") if (b || E(d)) {
					let n = d?.markerLineWidthEmu ?? t.markerLineWidthEmu;
					ra(a, o, t, d, e, s, l, f, d?.markerSize ?? t.markerSize ?? 5, $n(t, d, e, r), d?.markerLine ?? t.markerLine ?? null, c, n == null ? void 0 : it(n, c), Le(t, d, e), u);
				} else a.fillStyle = r, a.beginPath(), a.arc(s, l, 3, 0, Math.PI * 2), a.fill();
			}
			ua(a, t, r, (e) => qr(e), i, c, void 0, {
				chart: o,
				chartRect: s,
				plotRect: {
					x: X,
					y: Z,
					w: Q,
					h: $
				},
				shapeRotationDeg: u
			});
		}
		No(a, o, W, qr, (e) => H && e.useSecondaryAxis === !0 ? wr : Sr, () => Fr, (e, t) => e.values[t] == null ? null : G(e, t), Hr, c, u, "foreground"), lr && a.restore();
	}
	if (L.length > 0) {
		let e = [], t = [];
		for (let n of L) {
			let r = n.categories ?? [];
			for (let i = 0; i < n.values.length; i++) {
				let a = Xa(r, i, !1), o = n.values[i];
				a == null || o == null || (e.push(a), t.push(o));
			}
			let i = _o(o, n, ie.get(n) ?? 0, n.categories ?? o.categories, !1, o.scatterStyle ?? "marker", !1, o.secondaryCatAxis?.logBase, o.secondaryValAxis?.logBase);
			i?.x && e.push(...i.x), i?.y && t.push(...i.y);
		}
		if (e.length && t.length) {
			let n = o.secondaryCatAxis, r = o.secondaryValAxis, i = Se(e), l = Se(t), f = (e) => e?.minorGridlines === !0 || e?.minorTickMark != null && e.minorTickMark !== "none", g = ve({
				dataMin: i.min,
				dataMax: i.max,
				explicitMin: n?.min,
				explicitMax: n?.max,
				axisLenPt: Q / c,
				axisOrientation: "horizontal",
				majorUnit: n?.majorUnit,
				minorUnit: n?.minorUnit,
				needMinor: f(n),
				logBase: n?.logBase,
				reversed: n?.orientation === "maxMin"
			}), _ = ve({
				dataMin: l.min,
				dataMax: l.max,
				explicitMin: r?.min,
				explicitMax: r?.max,
				axisLenPt: $ / c,
				axisOrientation: "vertical",
				majorUnit: r?.majorUnit,
				minorUnit: r?.minorUnit,
				needMinor: f(r),
				logBase: r?.logBase,
				reversed: r?.orientation === "maxMin"
			});
			bo(a, o, L.map((e, t) => ({
				series: e,
				index: ie.get(e) ?? t
			})), !1, (e) => X + g.fraction(e) * Q, (e) => Z + $ - _.fraction(e) * $, s, X, Z, Q, $, c, !1, o.scatterStyle ?? "marker", {
				x: d,
				y: p,
				w: m,
				h
			}, _.max, void 0, u);
		}
	}
	Br(), U && !g && fe(a, o, U, be, s, X, Z, Q, c), H && An && he(a, o, H, An, Cr, s, X, Z, Q, $, c, Vn, Hn, Dr, o.date1904, Tn, me ? "left" : "right"), _r && Ya(a, o, _r, X, Z + $ + (g ? o.valAxisHidden ? h * .02 : Dn(mt) : Et), gr, d + Mt, c);
	let Qr = at && o.series.length === 1 ? at.values.map((e, t) => le(o, at, Je[J].get(t), t, t)) : Ze ? D.flatMap((e, t) => [Li(o, Xe[t], D.length, e.chartexStyle, e.color), ...da([e]).map(() => void 0)]) : [];
	Ra(a, ot, kt, d, p, m, h, X, Z, Q, $, dt + 2, c, Qr), nt(a, o, d, p, m, h, X, Z, Q, $, Mt, It, zt, Vt, g);
}
function Ro(e, t, n, r, i, a, o, s, c, l, u, d, f, p = !1, m, h, g, _ = 1, v, y = 0) {
	ao(e, t, {
		kind: "bar",
		rect: o === "vertical" ? {
			x: n,
			y: r,
			w: a,
			h: i
		} : {
			x: n,
			y: r,
			w: i,
			h: a
		},
		orientation: o,
		negative: p,
		position: s ?? "outEnd"
	}, u, l, c ? `#${c}` : "#333", f, d, m, h, g, _, v, y);
}
function zo(e, t, n, r, i, a, o, s, c, l) {
	if (n.hidden === !0 || n.linePaintAuthored === !0 && n.color == null || !i && n.dir === "x" || i && n.dir === "y") return;
	let u = n.barType === "plus" || n.barType === "both", d = n.barType === "minus" || n.barType === "both";
	e.save(), e.strokeStyle = n.color ? `#${n.color}` : c, e.lineWidth = n.lineWidthEmu ? Math.max(.5, n.lineWidthEmu / W * l) : Math.max(.5, l * .75), e.setLineDash(He(n.dash, e.lineWidth));
	let f = Math.max(e.lineWidth / 2, 2 * l);
	for (let c = 0; c < r; c++) {
		if (t.values[c] == null) continue;
		let r = s(c), l = a(c), p = o(r), m = (t) => {
			let a = o(r + t);
			e.beginPath(), i ? (e.moveTo(p, l), e.lineTo(a, l)) : (e.moveTo(l, p), e.lineTo(l, a)), e.stroke(), n.noEndCap || (e.save(), e.setLineDash([]), e.beginPath(), i ? (e.moveTo(a, l - f), e.lineTo(a, l + f)) : (e.moveTo(l - f, a), e.lineTo(l + f, a)), e.stroke(), e.restore());
		};
		if (u) {
			let e = n.plus[c];
			e != null && m(e);
		}
		if (d) {
			let e = n.minus[c];
			e != null && m(-e);
		}
	}
	e.restore();
}
function Bo(e, t) {
	return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)%?$/.test(e) ? t * .15 : 0;
}
function Vo(e, t, n, r, i, a, o, s) {
	if (!t || t.side !== "t" || e.legendOverlay === !0 || e.legendManualLayout == null) return s;
	let c = {
		x: n + 4,
		y: r + o + 2,
		w: Math.max(0, i - 8),
		h: t.reserveH
	}, l = yn(e.legendManualLayout, {
		x: n,
		y: r,
		w: i,
		h: a
	}, c);
	if (!l) return s;
	let u = Math.max(0, r + s - (c.y + c.h));
	return Math.max(s, l.y + l.h - r + u);
}
function Ho(t, n, i, a, o = 0) {
	let { x: s, y: c, w: l, h: u } = i, d = Xt(n), p = d.length;
	if (p === 0) return;
	let m = Sa(n, a), h = n.chartType === "stackedLinePct" ? "percentStacked" : n.chartType === "stackedLine" ? "stacked" : "standard", g = n.plotGroups?.filter((e) => e.kind === "line") ?? [{
		kind: "line",
		seriesStart: 0,
		seriesCount: n.series.length,
		categoryAxis: "primary",
		valueAxis: "primary",
		seriesAxis: "none",
		grouping: h
	}], _ = Array(n.series.length).fill(!1), v = Array(n.series.length).fill(!1), y = Array(n.series.length).fill(!1), b = Array(n.series.length).fill(null), x = n.series.map(() => Array(p).fill(0)), S = /* @__PURE__ */ new Map();
	for (let e of g) {
		let t = e.valueAxis;
		S.set(t, (S.get(t) ?? !0) && e.grouping === "percentStacked");
	}
	for (let e of g) {
		let t = e.grouping ?? "standard", r = t === "stacked" || t === "percentStacked", i = t === "percentStacked", a = n.series.slice(e.seriesStart, e.seriesStart + e.seriesCount), o = i && S.get(e.valueAxis) === !0 ? 100 : 1, s = i ? d.map((e, t) => a.reduce((e, n) => e + Math.abs(n.values[t] ?? 0), 0) || 1) : null;
		for (let t = 0; t < a.length; t++) {
			let n = e.seriesStart + t;
			_[n] = r, v[n] = i, y[n] = e.valueAxis === "secondary", b[n] = s;
			for (let e = 0; e < p; e++) {
				let c = a[t].values[e] ?? 0;
				if (!r) {
					x[n][e] = c;
					continue;
				}
				let l = t === 0 ? 0 : x[n - 1][e], u = i && s ? c / s[e] * o : c;
				x[n][e] = l + u;
			}
		}
	}
	let C = (e, t) => x[e]?.[t] ?? 0, w = g.filter((e) => e.valueAxis !== "secondary"), D = w.length > 0 && w.every((e) => e.grouping === "percentStacked"), k = n.dispBlanksAs ?? "gap", A = g.filter((e) => e.valueAxis === "secondary"), ee = A.length > 0 && A.every((e) => e.grouping === "percentStacked"), M = n.secondaryValAxis && n.series.some((e, t) => y[t] || n.plotGroups == null && e.useSecondaryAxis === !0) ? n.secondaryValAxis : null, te = new Map(n.series.map((e, t) => [e, t])), P = (e) => {
		let t = te.get(e) ?? -1;
		return M != null && (y[t] || n.plotGroups == null && e.useSecondaryAxis === !0);
	}, F = Infinity, ne = -Infinity;
	for (let e = 0; e < p; e++) for (let t = 0; t < n.series.length; t++) {
		if (P(n.series[t]) || !_[t] && n.series[t].values[e] == null) continue;
		let r = C(t, e);
		F = Math.min(F, r), ne = Math.max(ne, r);
	}
	let I = (e, t) => {
		let r = n.series[e];
		return po(n, r, Fe(r, e)) ? ho(fo(r, p, k, _[e]).map((t) => t.map((t) => C(e, t))), t) : null;
	}, L = null;
	for (let e = 0; e < n.series.length; e++) {
		if (P(n.series[e])) continue;
		let t = I(e, n.valAxisLogBase);
		t && (D ? L = L ? [Math.min(L[0], t[0]), Math.max(L[1], t[1])] : t : (F = Math.min(F, t[0]), ne = Math.max(ne, t[1])));
	}
	let ie = [];
	for (let e = 0; e < n.series.length; e++) {
		if (!P(n.series[e])) continue;
		let t = I(e, M?.logBase);
		t && ie.push(...t);
	}
	for (let e = 0; e < n.series.length; e++) {
		let t = n.series[e];
		P(t) || O(t, "y", (n) => t.values[n] == null ? null : C(e, n), (e) => {
			F = Math.min(F, e), ne = Math.max(ne, e);
		});
	}
	isFinite(F) || (F = 0, ne = 1);
	let ae = n.valAxisLogBase != null && n.valAxisLogBase >= 2;
	n.valMin == null ? D && F > 0 && !ae && (F = 0) : F = D ? n.valMin * 100 : n.valMin, n.valMax == null ? D && ne < 0 && (ne = 0) : ne = D ? n.valMax * 100 : n.valMax;
	let B = ko(t, n, l, u, a), V = B.fontPx, oe = B.topPad, se = B.bandH, ce = Fa(t, n, l, u, a), { legRightW: le, legLeftW: H, legTopH: fe, legBottomH: pe } = hn(ce, n.legendOverlay === !0), me = Ae(n.catAxisFontSizeHpt, u, a), ge = Ae(n.valAxisFontSizeHpt, u, a), _e = ft(n, l, u, a), ve = _e.catFontPx, ye = _e.valFontPx, U = _e.catBandH, be = _e.valBandW, xe = Ba(n), Se = xe && Va(n), W = Ha(n, me), we = Ka(n, a), Te = qa(t, n, a), De = se + fe + ge / 2 + 2, Oe = (xe ? we + W : Dn(me, n.catAxisLabelOffsetPercent)) + U + pe, ke = u - De - Oe, je = Kt(M, n.series, ke / a, "y", ee, !1, (e, t) => y[t] || n.plotGroups == null && n.series[t].useSecondaryAxis === !0, (e, t, n) => !_[n] && e.values[t] == null ? null : C(n, t), ie), Me = Math.max(8, Math.min(11, u / 20)), Pe = en(M?.fontSizeHpt, a) ?? Me, Re = 0;
	if (M && je && !M.hidden) {
		let e = t.font;
		t.font = or(Pe, yt(n, M.fontFace, "minor"), !1, M.fontItalic ?? !1);
		let r = 0;
		for (let e of je.majorLines) r = Math.max(r, Ie(t, jt(e, M.formatCode ?? null, n.date1904, M.displayUnits)));
		Re = r + 18, t.font = e;
	}
	let Be = M && M.title ? re(M, a) : 0, G = H + Math.max(ge * 2.2 + 10 + be, Te), He = le + l * .05 + Re + Be, We = pn(n, F, ne, ke / a, D, "vertical", L), Ge = 0;
	if (!n.valAxisHidden && n.valAxisTickLabelPos !== "none" && (n.chartexParetoSortDescending != null || n.plotAreaManualLayout != null && n.plotAreaManualLayout.layoutTarget !== "inner")) {
		let e = t.font;
		t.font = or(ge, yt(n, n.valAxisFontFace, "minor"), n.valAxisFontBold ?? !1, n.valAxisFontItalic ?? !1);
		for (let e of We.majorLines) Ge = Math.max(Ge, Ie(t, Rn(n, e, D)));
		t.font = e;
	}
	n.chartexParetoSortDescending != null && (G = Math.max(G, H + Ge + 10 + be));
	let qe = Math.max(n.valAxisHidden || n.valAxisTickLabelPos === "none" ? 0 : Ft(We.majorLines.map((e) => Rn(n, e, D)), rr(ge)), M && je && !M.hidden && M.tickLabelPos !== "none" ? Ft(je.majorLines.map((e) => jt(e, M.formatCode ?? null, n.date1904, M.displayUnits)), rr(Pe)) : 0) / 2;
	De += qe;
	let Je = {
		t: De,
		r: He,
		b: Oe,
		l: G
	}, Ye = bt({
		valAxisHidden: n.valAxisHidden,
		catAxisHidden: n.catAxisHidden,
		valLabelWidth: Ge,
		valLabelFontPx: ge,
		catLabelFontPx: me,
		valLabelGapPx: n.valAxisFontSizeHpt == null ? 6 : Rt(ge),
		catLabelGapPx: n.catAxisFontSizeHpt == null ? T(5, n.catAxisLabelOffsetPercent) : T(Ht(me), n.catAxisLabelOffsetPercent),
		outerTextMarginPx: $e * a,
		valTitleBandW: be,
		catTitleBandH: U,
		secondaryBandW: Re + Be,
		valLabelExtraTopPx: qe
	}), Xe = Tt(n, s, c, l, u, a, {
		titleBand: B,
		legendReserve: ce,
		pad: Je,
		honorPlotAreaManualLayout: !0,
		manualOuterInsets: Ye
	}), Ze = ko(t, n, Xe.plotRect.pw, u, a);
	Math.abs(Ze.bandH - B.bandH) > .01 && (B = Ze, V = B.fontPx, oe = B.topPad, se = B.bandH, De = se + fe + ge / 2 + 2 + qe, Je.t = De, Xe = Tt(n, s, c, l, u, a, {
		titleBand: B,
		legendReserve: ce,
		pad: Je,
		honorPlotAreaManualLayout: !0,
		manualOuterInsets: Ye
	}));
	let { px0: Qe, py0: et, pw: rt } = Xe.plotRect, { ph: J } = Xe.plotRect;
	if (jo(t, n, n.titleManualLayout || !n.titleRichRuns?.length ? s : Qe, c, n.titleManualLayout || !n.titleRichRuns?.length ? l : rt, u, c + oe, V), rt <= 0 || J <= 0) return;
	let at = Ua(n, rt, Re + Be), ot = xe ? Ja(t, n, at / p, a) : null;
	ot && ot.totalHeight > we && (J = Math.max(1, J - (ot.totalHeight - we)));
	let Y = r(n, d), ct = K(n), lt = Math.max(1, Math.floor(n.catAxisTickLabelSkip ?? 1)), ut = () => Y ? Y.majorTicks.map((e) => er(String(e.serial), n.catAxisFormatCode, n.date1904)) : Array.from({ length: Math.ceil(p / lt) }, (e, t) => er((d[t * lt] ?? "").toString(), n.catAxisFormatCode, n.date1904));
	if (!n.catAxisHidden && !Se && j(n) && n.catAxisTickLabelPos !== "high") {
		let e = n.plotAreaManualLayout?.layoutTarget === "inner" && n.plotAreaManualLayout.w != null && n.plotAreaManualLayout.h != null, t = Ft(ut(), rr(me), ct);
		xe && (W += t), !e && t > 0 && (J = Math.max(1, J - t));
	}
	In(t, n, Qe, et, rt, J, a, o);
	let dt = pn(n, F, ne, J / a, D, "vertical", L);
	if (dt.max - dt.min === 0) return;
	let pt = (e) => et + J - dt.frac(e) * J, mt = je ? je.makeToY(et, J) : pt, ht = (e) => P(e) ? mt : pt, xt = pt(Fo(n, dt.min, dt.max)), St = M && je ? mt(Po(n.secondaryCatAxis?.crossesAt, n.secondaryCatAxis?.crosses, je.min, je.max)) : xt, Ct = (e) => P(e) ? St : xt, wt = st(n.catAxisLineColor, n.catAxisLineWidthEmu, a), Et = st(n.valAxisLineColor, n.valAxisLineWidthEmu, a), Dt = n.catAxisLineColor == null ? void 0 : wt.color, Ot = n.catAxisLineWidthEmu == null ? void 0 : wt.width, kt = n.valAxisLineColor == null ? void 0 : Et.color, At = n.valAxisLineWidthEmu == null ? void 0 : Et.width, Mt = tt(n), Nt = Ke(n), It = Y ? (e) => Qe + Y.positions[e] * rt : Mt ? (e) => Qe + ((Nt ? p - 1 - e : e) + .5) / p * rt : (e) => {
		let t = Nt ? p - 1 - e : e;
		return Qe + (p === 1 ? rt / 2 : t / (p - 1) * rt);
	};
	if (!n.valAxisHidden) {
		t.font = or(ge, yt(n, n.valAxisFontFace, "minor"), n.valAxisFontBold ?? !1, n.valAxisFontItalic ?? !1), t.textBaseline = "middle";
		let r = vn(n, a), i = Fn(n, a);
		for (let e of dt.minorLines) Gt(t, Qe, rt, pt(e), !1, i);
		let o = e(n), s = n.valAxisTickLabelPos !== "none";
		for (let e of dt.majorLines) {
			let i = pt(e);
			if (o && Gt(t, Qe, rt, i, e === 0, r), z(t, n.valAxisMajorTickMark, "val", Qe, i, kt, At, !1, n.valAxisLineHidden, "major", a, n.valAxisLineDash), s) {
				t.fillStyle = n.valAxisFontColor ? `#${n.valAxisFontColor}` : "#555", t.textAlign = "right";
				let r = n.valAxisFontSizeHpt == null ? 6 : Rt(ge);
				gt(t, Rn(n, e, D), Qe - r, i, rr(ge));
			}
		}
		if (n.valAxisMinorTickMark && n.valAxisMinorTickMark !== "none") for (let e of dt.minorTicks) z(t, n.valAxisMinorTickMark, "val", Qe, pt(e), kt, At, !1, n.valAxisLineHidden, "minor", a, n.valAxisLineDash);
	}
	if (M && je && Ce(t, M, je, mt, Qe, rt, a), !n.catAxisHidden && q(n)) {
		let e = N(n, a);
		t.strokeStyle = e.color, t.lineWidth = e.width;
		let r = e.dash.length > 0 && t.getLineDash ? t.getLineDash() : [];
		e.dash.length > 0 && t.setLineDash(e.dash);
		let i = Y ? Y.majorTicks.map((e) => e.fraction) : Ue(n, p);
		for (let e of i) {
			let n = Qe + e * rt;
			t.beginPath(), t.moveTo(n, et), t.lineTo(n, et + J), t.stroke();
		}
		e.dash.length > 0 && t.setLineDash(r);
	}
	!n.catAxisHidden && !n.catAxisLineHidden && kn(t, Qe, xt, Qe + rt, xt, wt.color, wt.width, n.catAxisLineDash), !n.valAxisHidden && !n.valAxisLineHidden && kn(t, Qe, et, Qe, et + J, Et.color, Et.width, n.valAxisLineDash);
	let Lt = Y ? (Y.categoryBandFractions[0] ?? 0) * rt : Mt ? rt / p : p > 1 ? rt / (p - 1) : rt, zt = new Map(n.series.map((e, t) => [e, t]));
	No(t, n, p, It, ht, Ct, (e, t) => {
		let n = zt.get(e);
		return n == null ? null : C(n, t);
	}, Lt, a, o, "background");
	let Bt = Math.max(1, 2.25 * a), Vt = Math.max(2, 2.5 * a), Ut = Ae(n.dataLabelFontSizeHpt, u, a), qt = [];
	for (let e = 0; e < n.series.length; e++) {
		let r = n.series[e], h = _[e], g = b[e], y = cr(r.dataPointOverrides), x = de(e, r), S = Fe(r, e), w = ht(r), T = r.smooth === !0, D = fo(r, p, k, h).map((t) => t.map((t) => ({
			x: It(t),
			y: w(C(e, t)),
			index: t
		}))), O = {
			x: Qe,
			y: et,
			w: rt,
			h: J
		};
		Wt(n, e) ? f(t, n, r, D, T, !1, x, Bt, a, O, o) : Ne(t, ue(r.chartexStyle), n.chartStyleRoles?.dataPointLine, S, O, a, (e) => {
			if (R(e, n, "dataPointLine", r, void 0, S, x, Bt, a, O, o)) {
				e.beginPath();
				for (let t of D) t.length !== 0 && (e.moveTo(t[0].x, t[0].y), ze(e, t, T));
				e.stroke();
			}
		});
		let A = (t) => C(e, t);
		for (let e of r.errBars ?? []) $a(t, r, Pt(n, e), p, It, w, A, x);
		t.fillStyle = x;
		let j = r.showMarker !== !1 && r.markerSymbol !== "none", ee = j || _t(r), te = ia(n, r, e), N = (r.dataLabelOverrides?.length ?? 0) > 0 || r.seriesDataLabels != null;
		N && qt.push(() => {
			so(t, r, d, p, It, w, A, J, a, n.date1904 ?? !1, h || k === "zero", yt(n, n.dataLabelFontFace, "minor"), n.dataLabelPosition ?? "r", {
				x: s,
				y: et,
				w: l,
				h: J
			}, {
				x: s,
				y: c,
				w: l,
				h: u
			}, v[e] && g ? (e) => (r.values[e] ?? 0) / g[e] : void 0, (e) => {
				if (!ee) return 0;
				let t = y.get(e);
				return !te && !E(t) ? Vt : ir(r, t, "circle", j) === "none" ? 0 : (t?.markerSize ?? r.markerSize ?? 5) / 2 * a;
			}, (e) => yt(n, e, "minor"), P(r) ? M?.displayUnits : n.valAxisDisplayUnits, (t) => m(e, t), (e) => eo(n, e, P(r) && je ? je.max : dt.max), o);
		});
		for (let i = 0; i < p; i++) {
			if (r.sourceHidden?.[i] === !0 || !h && r.values[i] == null && k !== "zero") continue;
			let s = C(e, i);
			if (ee) {
				let e = y.get(i);
				if (te || E(e)) {
					let c = ir(r, e, "circle", j);
					if (c !== "none") {
						let l = e?.markerSize ?? r.markerSize ?? 5, u = $n(r, e, i, x), d = e?.markerLine ?? r.markerLine ?? null, f = e?.markerLineWidthEmu ?? r.markerLineWidthEmu;
						ra(t, n, r, e, i, It(i), w(s), c, l, u, d, a, f == null ? void 0 : it(f, a), Le(r, e, i), o);
					}
				} else t.beginPath(), t.arc(It(i), w(s), Vt, 0, Math.PI * 2), t.fill();
			}
		}
		n.showDataLabels && !N && qt.push(() => {
			for (let i = 0; i < p; i++) {
				if (r.sourceHidden?.[i] === !0 || !h && r.values[i] == null && k !== "zero") continue;
				let a = C(e, i), o = vt({
					showValue: !0,
					sourceValue: r.values[i] ?? 0,
					valueDivisor: Sn(P(r) ? M?.displayUnits : n.valAxisDisplayUnits),
					formatCode: n.dataLabelFormatCode ?? r.valFormatCode ?? null,
					date1904: n.date1904
				});
				no(t, It(i), w(a), o, n.dataLabelPosition ?? "r", Ut, n.dataLabelFontColor ?? void 0, n.dataLabelFontBold ?? !1, yt(n, n.dataLabelFontFace, "minor"), ee ? Vt + 1 : 2, {
					x: Qe,
					y: et,
					w: rt,
					h: J
				});
			}
		}), ua(t, r, x, It, w, a, void 0, {
			chart: n,
			chartRect: i,
			plotRect: {
				x: Qe,
				y: et,
				w: rt,
				h: J
			},
			shapeRotationDeg: o
		});
	}
	No(t, n, p, It, ht, Ct, (e, t) => {
		let n = zt.get(e);
		return n == null ? null : C(n, t);
	}, Lt, a, o, "foreground");
	for (let e of qt) e();
	if (!n.catAxisHidden) {
		let e = n.catAxisFontColor ? `#${n.catAxisFontColor}` : "#555";
		t.fillStyle = e, t.textAlign = "center", t.textBaseline = "top", t.font = or(me, yt(n, n.catAxisFontFace, "minor"), n.catAxisFontBold ?? !1, n.catAxisFontItalic ?? !1);
		let r = Math.max(1, Math.floor(n.catAxisTickMarkSkip ?? 1)), i = Y ? Y.majorTicks.map((e) => Qe + e.fraction * rt) : Array.from({ length: Math.ceil(p / r) }, (e, t) => It(t * r));
		for (let e of i) z(t, n.catAxisMajorTickMark, "cat", xt, e, Dt, Ot, !1, n.catAxisLineHidden, "major", a, n.catAxisLineDash);
		if (n.catAxisMinorTickMark && n.catAxisMinorTickMark !== "none" && Y) for (let e of Y.minorTicks) z(t, n.catAxisMinorTickMark, "cat", xt, Qe + e.fraction * rt, Dt, Ot, !1, n.catAxisLineHidden, "minor", a, n.catAxisLineDash);
		let o = !Se && j(n), s = lt, c = ct, l = Y ? Y.majorTicks.map((e) => ({
			label: er(String(e.serial), n.catAxisFormatCode, n.date1904),
			x: Qe + e.fraction * rt,
			categoryIndex: -1
		})) : Array.from({ length: Math.ceil(p / s) }, (e, t) => {
			let r = t * s;
			return {
				label: er((d[r] ?? "").toString(), n.catAxisFormatCode, n.date1904),
				x: It(r),
				categoryIndex: r
			};
		});
		for (let r of l) {
			let i = r.categoryIndex < 0 ? null : Ve(r.categoryIndex, p, tt(n), Ke(n), n.catAxisLabelAlignment), a = i ? Qe + i.fraction * rt : r.x;
			if (!o) continue;
			t.textAlign = i?.textAlign ?? "center", t.fillStyle = e;
			let s = r.label;
			if (!s) continue;
			let l = T(n.catAxisFontSizeHpt == null ? 5 : Ht(me), n.catAxisLabelOffsetPercent), u = n.catAxisTickLabelPos ?? "nextTo";
			Ee(t, s, a, (u === "nextTo" ? xt : u === "high" ? et : et + J) + l, c, rr(me));
		}
	}
	if (M && je) {
		let e = n.valAxisFontColor ? `#${n.valAxisFontColor}` : "#555";
		he(t, n, M, je, mt, i, Qe, et, rt, J, a, Pe, Re, e, n.date1904);
	}
	ot && Ya(t, n, ot, Qe, et + J + W, at, s + H, a), Ra(t, n, ce, s, c, l, u, Qe, et, rt, J, se + 2, a), nt(t, n, s, c, l, u, Qe, et, rt, J, H, pe, ve, ye);
}
function Uo(t, n, i, a, o = 0) {
	let { x: s, y: c, w: l, h: u } = i, d = Xt(n), p = d.length;
	if (p === 0) return;
	let m = Sa(n, a), h = n.plotGroups?.find((e) => e.kind === "stock"), g = h ? n.series.slice(h.seriesStart, h.seriesStart + h.seriesCount) : n.series, _ = n.plotGroups == null ? [] : n.plotGroups.filter((e) => e.kind === "line").flatMap((e) => n.series.slice(e.seriesStart, e.seriesStart + e.seriesCount)), v = [...g, ..._], y = new Map(n.series.map((e, t) => [e, t])), b = g.length >= 4, x = b ? 0 : -1, C = +!!b, w = b ? 2 : 1, E = b ? 3 : 2, D = g[C], k = g[w], A = g[E], ee = x >= 0 ? g[x] : void 0, M = g[0], te = g.at(-1), N = n.secondaryValAxis && v.some((e) => e.useSecondaryAxis === !0) ? n.secondaryValAxis : null, P = (e) => N != null && e.useSecondaryAxis === !0, F = ko(t, n, l, u, a), ne = F.fontPx, I = F.topPad, L = F.bandH, ie = Fa(t, n, l, u, a), { legRightW: ae, legLeftW: B, legBottomH: V, legTopH: oe } = hn(ie, n.legendOverlay === !0), se = Ae(n.catAxisFontSizeHpt, u, a), ce = Ae(n.valAxisFontSizeHpt, u, a), le = ft(n, l, u, a), H = le.catFontPx, fe = le.valFontPx, pe = le.catBandH, me = le.valBandW, ge = Ba(n), _e = ge && Va(n), ve = Ha(n, se), ye = Ka(n, a), U = qa(t, n, a), be = L + oe + ce / 2 + 2, xe = (ge ? ye + ve : Dn(se, n.catAxisLabelOffsetPercent)) + pe + V, Se = u - be - xe, W = (e, t) => {
		if (!po(n, e, Fe(e, y.get(e) ?? 0))) return null;
		let r = [[]];
		for (let t = 0; t < p; t++) {
			let n = e.values[t];
			n == null ? r.push([]) : r[r.length - 1].push(n);
		}
		return ho(r, t);
	}, we = [];
	for (let e of _) {
		if (!P(e)) continue;
		let t = W(e, N?.logBase);
		t && we.push(...t);
	}
	let Te = Kt(N, v, Se / a, "y", !1, !1, void 0, void 0, we), De = Math.max(8, Math.min(11, u / 20)), Oe = en(N?.fontSizeHpt, a) ?? De, ke = 0;
	if (N && Te && !N.hidden) {
		let e = t.font;
		t.font = or(Oe, yt(n, N.fontFace, "minor"), N.fontBold ?? !1, N.fontItalic ?? !1);
		let r = 0;
		for (let e of Te.majorLines) r = Math.max(r, Ie(t, jt(e, N.formatCode ?? null, n.date1904, N.displayUnits)));
		ke = r + 18, t.font = e;
	}
	let je = N?.title ? re(N, a) : 0, Me = Infinity, Pe = -Infinity;
	for (let e of v) if (!P(e)) for (let t = 0; t < p; t++) {
		let n = e.values[t];
		n != null && (Me = Math.min(Me, n), Pe = Math.max(Pe, n));
	}
	for (let e of v) P(e) || O(e, "y", (t) => e.values[t] ?? null, (e) => {
		Me = Math.min(Me, e), Pe = Math.max(Pe, e);
	});
	for (let e of _) {
		if (P(e)) continue;
		let t = W(e, n.valAxisLogBase);
		t && (Me = Math.min(Me, t[0]), Pe = Math.max(Pe, t[1]));
	}
	isFinite(Me) || (Me = 0, Pe = 1), n.valMin != null && (Me = n.valMin), n.valMax != null && (Pe = n.valMax);
	let Re = {
		t: be + Math.max(n.valAxisHidden || n.valAxisTickLabelPos === "none" ? 0 : Ft(pn(n, Me, Pe, Se / a).majorLines.map((e) => Rn(n, e, !1)), rr(ce)), N && Te && !N.hidden && N.tickLabelPos !== "none" ? Ft(Te.majorLines.map((e) => jt(e, N.formatCode ?? null, n.date1904, N.displayUnits)), rr(Oe)) : 0) / 2,
		r: ae + l * .05 + ke + je,
		b: xe,
		l: B + Math.max(ce * 2.2 + 10 + me, U)
	};
	jo(t, n, s, c, l, u, c + I, ne);
	let Be = Tt(n, s, c, l, u, a, {
		titleBand: F,
		legendReserve: ie,
		pad: Re,
		honorPlotAreaManualLayout: !0
	}), { px0: G, py0: He, pw: Ue } = Be.plotRect, { ph: We } = Be.plotRect;
	if (Ue <= 0 || We <= 0) return;
	let Ge = Ua(n, Ue, ke + je), qe = ge ? Ja(t, n, Ge / p, a) : null;
	qe && qe.totalHeight > ye && (We = Math.max(1, We - (qe.totalHeight - ye)));
	let Je = r(n, d);
	if (!n.catAxisHidden && !_e && j(n)) {
		let e = Math.max(1, Math.floor(n.catAxisTickLabelSkip ?? 1)), t = Je && Je.majorTicks.length > 0 ? Je.majorTicks.map((e) => er(String(e.serial), n.catAxisFormatCode, n.date1904)) : Array.from({ length: Math.ceil(p / e) }, (t, r) => er((d[r * e] ?? "").toString(), n.catAxisFormatCode, n.date1904)), r = n.plotAreaManualLayout?.layoutTarget === "inner" && n.plotAreaManualLayout.w != null && n.plotAreaManualLayout.h != null, i = Ft(t, rr(se), K(n));
		ge && (ve += i), !r && i > 0 && (We = Math.max(1, We - i));
	}
	In(t, n, G, He, Ue, We, a, o);
	let Ye = pn(n, Me, Pe, We / a);
	if (Ye.max - Ye.min === 0) return;
	let Xe = (e) => He + We - Ye.frac(e) * We, Ze = Te?.makeToY(He, We) ?? Xe, q = (e) => P(e) ? Ze : Xe, Qe = tt(n), $e = Ke(n), et = Je ? (e) => G + Je.positions[e] * Ue : Qe ? (e) => G + (($e ? p - 1 - e : e) + .5) / p * Ue : (e) => {
		let t = $e ? p - 1 - e : e;
		return G + (p === 1 ? Ue / 2 : t / (p - 1) * Ue);
	};
	if (!n.valAxisHidden) {
		t.font = or(ce, yt(n, n.valAxisFontFace, "minor"), n.valAxisFontBold ?? !1, n.valAxisFontItalic ?? !1), t.textBaseline = "middle";
		let r = vn(n, a), i = Fn(n, a);
		for (let e of Ye.minorLines) Gt(t, G, Ue, Xe(e), !1, i);
		let o = e(n), s = n.valAxisTickLabelPos !== "none";
		for (let e of Ye.majorLines) {
			let i = Xe(e);
			o && Gt(t, G, Ue, i, e === 0, r), z(t, n.valAxisMajorTickMark, "val", G, i, void 0, void 0, !1, n.valAxisLineHidden, "major", a, n.valAxisLineDash), s && (t.fillStyle = n.valAxisFontColor ? `#${n.valAxisFontColor}` : "#555", t.textAlign = "right", gt(t, Rn(n, e, !1), G - 6, i, rr(ce)));
		}
		for (let e of Ye.minorTicks) z(t, n.valAxisMinorTickMark, "val", G, Xe(e), void 0, void 0, !1, n.valAxisLineHidden, "minor", a, n.valAxisLineDash);
	}
	N && Te && Ce(t, N, Te, Ze, G, Ue, a);
	let rt = st(n.catAxisLineColor, n.catAxisLineWidthEmu, a), J = st(n.valAxisLineColor, n.valAxisLineWidthEmu, a);
	if (!n.catAxisHidden && !n.catAxisLineHidden && kn(t, G, He + We, G + Ue, He + We, rt.color, rt.width, n.catAxisLineDash), !n.valAxisHidden && !n.valAxisLineHidden && kn(t, G, He, G, He + We, J.color, J.width, n.valAxisLineDash), n.stockDropLines) {
		let e = n.stockAutomaticStyle ? {
			lineColors: [n.stockAutomaticStyle.lineColor],
			linePaintAuthored: !0,
			lineWidthEmu: n.stockAutomaticStyle.lineWidthEmu
		} : void 0, r = cn(n, n.stockDropLines, "dropLine", e);
		(r.paintAuthored !== !0 || r.color != null) && (r.color != null || r.widthEmu != null || r.dash != null) && rn(t, r, a) && Vt(t, g, p, et, (e) => q(e), () => He + We, (e, t) => e.values[t] ?? null);
	}
	if (n.stockHiLowLines === !0 && D != null && k != null && D && k) {
		let e = cn(n, n.stockHiLowLineStyle ?? { color: n.stockHiLowLineColor ?? null }, "hiLoLine", n.stockAutomaticStyle ? {
			lineColors: [n.stockAutomaticStyle.lineColor],
			linePaintAuthored: !0,
			lineWidthEmu: n.stockAutomaticStyle.lineWidthEmu
		} : void 0);
		if ((e.paintAuthored !== !0 || e.color != null) && (e.color != null || e.widthEmu != null || e.dash != null) && rn(t, e, a)) for (let e = 0; e < p; e++) {
			let n = D.values[e], r = k.values[e];
			if (n == null || r == null) continue;
			let i = et(e), a = q(D), o = q(k);
			t.beginPath(), t.moveTo(i, a(n)), t.lineTo(i, o(r)), t.stroke();
		}
	}
	let at = (e, r, i) => {
		if (!e) return;
		let s = y.get(e) ?? r, c = de(s, e), l = Fe(e, s), u = cr(e.dataPointOverrides), d = e.markerSymbol != null && e.markerSymbol !== "none" && S(e), f = Math.max(3, Ue / p * .22);
		for (let r = 0; r < p; r++) {
			let s = e.values[r];
			if (s == null) continue;
			let p = et(r), m = q(e)(s), h = u.get(r);
			if (h?.markerSymbol === "none" || h?.markerSymbol == null && e.markerSymbol === "none") continue;
			if (d || h?.markerSymbol != null && h.markerSymbol !== "none") {
				let i = h?.markerSymbol ?? e.markerSymbol ?? "circle";
				ra(t, n, e, h, r, p, m, i, h?.markerSize ?? e.markerSize ?? 3, $n(e, h, r, c), h?.markerLine ?? e.markerLine ?? null, a, (h?.markerLineWidthEmu ?? e.markerLineWidthEmu) == null ? void 0 : it(h?.markerLineWidthEmu ?? e.markerLineWidthEmu, a), Le(e, h, r), o);
				continue;
			}
			let g = i === "right" ? p : i === "left" ? p - f : p - f / 2, _ = i === "right" ? p + f : i === "left" ? p : p + f / 2;
			Ne(t, ue(h?.chartexStyle, e.chartexStyle), n.chartStyleRoles?.dataPointLine, l, {
				x: g,
				y: m,
				w: _ - g,
				h: 0
			}, a, (t) => {
				R(t, n, "dataPointLine", e, h, l, c, Math.max(1, .75 * a), a, {
					x: G,
					y: He,
					w: Ue,
					h: We
				}, o) && (t.beginPath(), t.moveTo(g, m), t.lineTo(_, m), t.stroke());
			});
		}
	};
	for (let e of _) {
		let r = y.get(e) ?? 0, s = de(Math.max(0, r), e), c = q(e), l = cr(e.dataPointOverrides), u = Fe(e, r), d = Wt(n, r), m = [], h = [], g = () => {
			h.length > 0 && m.push(h), h = [];
		};
		for (let t = 0; t < p; t++) {
			let n = e.values[t];
			if (n == null) {
				g();
				continue;
			}
			h.push({
				x: et(t),
				y: c(n),
				index: t
			});
		}
		g(), d ? f(t, n, e, m, e.smooth === !0, !1, s, Math.max(1, 2.25 * a), a, {
			x: G,
			y: He,
			w: Ue,
			h: We
		}, o) : Ne(t, ue(e.chartexStyle), n.chartStyleRoles?.dataPointLine, u, {
			x: G,
			y: He,
			w: Ue,
			h: We
		}, a, (t) => {
			if (t.save(), R(t, n, "dataPointLine", e, void 0, u, s, Math.max(1, 2.25 * a), a, {
				x: G,
				y: He,
				w: Ue,
				h: We
			}, o)) {
				t.beginPath();
				for (let n of m) t.moveTo(n[0].x, n[0].y), ze(t, n, e.smooth === !0);
				t.stroke();
			}
			t.restore();
		});
		let _ = e.showMarker !== !1 && e.markerSymbol !== "none";
		if (_ || _t(e)) for (let r = 0; r < p; r++) {
			let i = e.values[r];
			if (i == null) continue;
			let u = l.get(r), d = ir(e, u, "circle", _);
			d !== "none" && ra(t, n, e, u, r, et(r), c(i), d, u?.markerSize ?? e.markerSize ?? 5, $n(e, u, r, s), u?.markerLine ?? e.markerLine ?? null, a, (u?.markerLineWidthEmu ?? e.markerLineWidthEmu) == null ? void 0 : it(u?.markerLineWidthEmu ?? e.markerLineWidthEmu, a), Le(e, u, r), o);
		}
		ua(t, e, s, et, c, a, void 0, {
			chart: n,
			chartRect: i,
			plotRect: {
				x: G,
				y: He,
				w: Ue,
				h: We
			},
			shapeRotationDeg: o
		});
	}
	if (n.stockUpDownBars && M && te) {
		let e = n.stockUpDownBarStyle ?? {
			gapWidthPercent: 150,
			up: {},
			down: {}
		}, r = {
			...e,
			up: kt(n, e.up, "upBar", n.stockAutomaticStyle ?? void 0),
			down: kt(n, e.down, "downBar", n.stockAutomaticStyle ?? void 0)
		}, i = Je ? (Je.categoryBandFractions[0] ?? 0) * Ue : Qe ? Ue / p : p > 1 ? Ue / (p - 1) : Ue;
		Mo(t, (e) => M.values[e] ?? null, (e) => te.values[e] ?? null, p, et, q(M), q(te), i, r, a, void 0, o);
	}
	at(ee, x, "left"), (D?.markerSymbol != null || D && _t(D)) && at(D, C, "both"), (k?.markerSymbol != null || k && _t(k)) && at(k, w, "both"), at(A, E, "right");
	for (let e of v) {
		let r = de(y.get(e) ?? 0, e);
		for (let i of e.errBars ?? []) $a(t, e, Pt(n, i), p, et, q(e), (t) => e.values[t] ?? 0, r);
	}
	if (g.length < 3) for (let e = 0; e < g.length; e++) at(g[e], e, "both");
	for (let e of v) {
		let r = y.get(e) ?? 0;
		to(t, e, d, !0, et, q(e), We, a, n.date1904, yt(n, n.dataLabelFontFace, "minor"), n.dataLabelPosition ?? "r", {
			x: G,
			y: He,
			w: Ue,
			h: We
		}, i, (e) => yt(n, e, "minor"), P(e) ? N?.displayUnits : n.valAxisDisplayUnits, (e) => m(r, e), (t) => eo(n, t, P(e) ? Te?.max ?? Ye.max : Ye.max), o);
	}
	if (!n.catAxisHidden) {
		let e = Math.max(1, Math.floor(n.catAxisTickLabelSkip ?? 1)), r = n.catAxisFontColor ? `#${n.catAxisFontColor}` : "#555";
		t.fillStyle = r, t.textAlign = "center", t.textBaseline = "top", t.font = or(se, yt(n, n.catAxisFontFace, "minor"), n.catAxisFontBold ?? !1, n.catAxisFontItalic ?? !1);
		let i = Je ? (Je.categoryBandFractions[0] ?? 0) * Ue - 4 : Ue / p * e - 4, o = !_e && j(n), s = K(n), c = Je && Je.majorTicks.length > 0 ? Je.majorTicks.map((e) => ({
			label: er(String(e.serial), n.catAxisFormatCode, n.date1904),
			x: G + e.fraction * Ue,
			categoryIndex: -1
		})) : Array.from({ length: Math.ceil(p / e) }, (t, r) => {
			let i = r * e;
			return {
				label: er((d[i] ?? "").toString(), n.catAxisFormatCode, n.date1904),
				x: et(i),
				categoryIndex: i
			};
		});
		for (let e of c) {
			let c = e.categoryIndex < 0 ? null : Ve(e.categoryIndex, p, tt(n), Ke(n), n.catAxisLabelAlignment), l = c ? G + c.fraction * Ue : e.x;
			if (z(t, n.catAxisMajorTickMark, "cat", He + We, l, rt.color, rt.width, !1, n.catAxisLineHidden, "major", a, n.catAxisLineDash), !o) continue;
			t.textAlign = c?.textAlign ?? "center", t.fillStyle = r;
			let u = e.label, d = s === 0 ? i : We * .4;
			Ee(t, u, l, He + We + T(5, n.catAxisLabelOffsetPercent), s, rr(se), d);
		}
		if (n.catAxisMinorTickMark && n.catAxisMinorTickMark !== "none" && Je) for (let e of Je.minorTicks) z(t, n.catAxisMinorTickMark, "cat", He + We, G + e.fraction * Ue, void 0, void 0, !1, n.catAxisLineHidden, "minor", a, n.catAxisLineDash);
	}
	if (N && Te) {
		let e = n.valAxisFontColor ? `#${n.valAxisFontColor}` : "#555";
		he(t, n, N, Te, Ze, i, G, He, Ue, We, a, Oe, ke, e, n.date1904);
	}
	qe && Ya(t, n, qe, G, He + We + ve, Ge, s + B, a), Ra(t, n, ie, s, c, l, u, G, He, Ue, We, L + 2, a), nt(t, n, s, c, l, u, G, He, Ue, We, B, V, H, fe);
}
var Wo = (e) => e[0] + e[2] > e[1] + e[3] ? [[
	0,
	1,
	2
], [
	0,
	2,
	3
]] : [[
	0,
	1,
	3
], [
	1,
	2,
	3
]], Go = 2e5, Ko = 1.25;
function qo(e, t, n) {
	if (e.length === 0) return [];
	let r = [], i = (e) => n ? e.value >= t : e.value <= t, a = e[e.length - 1], o = i(a);
	for (let n of e) {
		let e = i(n);
		if (e !== o) {
			let e = n.value - a.value, i = e === 0 ? 0 : (t - a.value) / e;
			r.push({
				x: a.x + (n.x - a.x) * i,
				y: a.y + (n.y - a.y) * i,
				depth: a.depth + (n.depth - a.depth) * i,
				value: t
			});
		}
		e && r.push(n), a = n, o = e;
	}
	return r;
}
function Jo(t, n, r, i, a = 0) {
	let { x: o, y: s, w: c, h: l } = r, u = Xt(n), d = n.series, f = u.length, p = d.length;
	if (f < 2 || p < 2) return;
	let m = Infinity, _ = -Infinity;
	for (let e of d) for (let t = 0; t < f; t++) {
		let n = e.values[t];
		n == null || !Number.isFinite(n) || (m = Math.min(m, n), _ = Math.max(_, n));
	}
	if (!Number.isFinite(m) || !Number.isFinite(_)) return;
	n.valMin != null && (m = n.valMin), n.valMax != null && (_ = n.valMax);
	let v = {
		...n.threeD ?? {},
		rotationX: n.threeD?.rotationX ?? 15,
		rotationY: n.threeD?.rotationY ?? 20,
		rightAngleAxes: n.threeD?.rightAngleAxes ?? !1,
		perspective: n.threeD?.perspective ?? 30
	}, y = wr(v), b = Sr(v), S = Cr(v, r, {
		sceneDepthScale: Ko,
		perspectiveTangentGain: b
	}), w;
	if (S) {
		let e = S.topology.axisX === "min" ? S.front.x : S.front.x + S.front.w, t = S.project(e, S.front.y + S.front.h, S.topology.nearDepth), n = S.project(e, S.front.y, S.topology.nearDepth);
		w = Math.hypot(n.x - t.x, n.y - t.y) / i;
	}
	let E = n.valAxisMajorUnit == null ? C(m, _, w) : null, D = pn(E == null ? n : {
		...n,
		valAxisMajorUnit: E
	}, m, _, w), O = D.step;
	if (!(O > 0) || !Number.isFinite(O)) return;
	let k = n.valMin ?? D.min, A = n.valMax ?? Math.max(k + O, k + Math.ceil((_ - k) / O) * O), j = A - k;
	if (!(j > 0) || !Number.isFinite(j)) return;
	let M = Math.ceil(j / O), te = Math.floor(j / O + 1e-9) + 1, N = (f - 1) * (p - 1) * 2;
	if (!Number.isSafeInteger(M) || !Number.isSafeInteger(te) || M < 1 || te < 2 || N < 1 || M > 512 || te > 512 || M > Math.floor(Go / N) || te > Go) return;
	let P = M, F = ht(n) ? (e) => 1 - (e - k) / j : (e) => (e - k) / j, ne = Array.from({ length: te }, (e, t) => k + t * O), re = (e, t) => {
		let n = Math.min(e, t), r = Math.max(e, t), i = Math.max(1, Math.floor((n - k) / O) + 1), a = Math.min(P - 1, Math.ceil((r - k) / O) - 1), o = [0];
		if (e !== t) for (let n = i; n <= a; n++) o.push((k + n * O - e) / (t - e));
		return o.push(1), o.sort((e, t) => e - t), o;
	}, I = Array.from({ length: P }, (e, t) => n.themeAccentColors?.[t % 6] ? `#${n.themeAccentColors[t % 6]}` : d[t]?.color ? `#${d[t].color}` : de(t, d[t])), L = new Map((n.surfaceBandFormats ?? []).map((e) => [e.idx, e])), R = n.linkedChartStyleRoles?.dataPoint3D ?? (n.classicChartStyleRoles == null ? n.chartStyleRoles?.dataPoint3D : void 0), z = P <= 48 ? n.classicSurfaceBandStyles?.byBandCount?.[P - 1] ?? n.classicSurfaceBandStyles?.fixed : void 0, ae = _n(z, R), oe = n.linkedChartStyleRoles?.dataPointWireframe ?? (n.classicChartStyleRoles == null ? n.chartStyleRoles?.dataPointWireframe : void 0), se = _n(z, oe), ce = (e) => e?.lineNoStyle !== !0 && (e?.linePaintAuthored === !0 || e?.lineHidden === !0 || (e?.lineColors?.length ?? 0) > 0 || (e?.linePaints?.length ?? 0) > 0), le = n.surfaceWireframe === !0 ? [] : Array.from({ length: P }, (e, t) => {
		let n = L.get(t), r, i = !0;
		if (n?.fillHidden === !0) r = ee(R), r !== void 0 && (i = !1);
		else if (n?.fill) r = n.fill, i = !1;
		else {
			let e = We(n?.style, R, t);
			e === void 0 ? r = ie(R, t) : (r = e, i = !1);
		}
		return r === void 0 && n?.fillHidden === !0 && (r = ie(R, t)), r === void 0 && (r = ie(z, t)), {
			recipe: r,
			fromRole: i
		};
	}), H = le.map((e) => e.recipe), ue = n.surfaceWireframe === !0 ? [] : Array.from({ length: P }, (e, t) => {
		let n = L.get(t), r;
		return r = n?.lineHidden === !0 ? V(R) : n?.lineColor ? {
			fillType: "solid",
			color: n.lineColor
		} : rt(R, R, t, n?.style), r === void 0 && n?.lineHidden === !0 && (r = Qe(R, t)), r === void 0 && (r = Qe(z, t)), r;
	}), fe = (e, t) => {
		let n = e, r = n?.lineDashAuthored === !0 || n?.lineDash != null || n?.lineCustomDash != null;
		return {
			lineWidthEmu: n?.lineWidthEmu ?? t.lineWidthEmu,
			lineDash: r ? n?.lineDash : t.lineDash,
			lineCustomDash: r ? n?.lineCustomDash : t.lineCustomDash,
			lineCap: n?.lineCap ?? t.lineCap,
			lineJoin: n?.lineJoin ?? t.lineJoin,
			lineCompound: n?.lineCompound ?? t.lineCompound
		};
	}, pe = se?.lineColorIndex, me;
	me = ce(se) ? se?.lineHidden === !0 ? Qe(se, 0) : pe == null ? void 0 : pe == null ? null : Qe(se, pe) : void 0;
	let he = pe == null && ce(se) && se?.lineHidden !== !0 ? Array.from({ length: P }, (e, t) => Qe(se, t)) : [], ge = se == null ? {
		paint: void 0,
		lineWidthEmu: void 0,
		lineDash: void 0,
		lineCustomDash: void 0,
		lineCap: void 0,
		lineJoin: void 0,
		lineCompound: void 0
	} : {
		paint: me,
		lineWidthEmu: se?.lineWidthEmu,
		lineDash: se?.lineDash,
		lineCustomDash: se?.lineCustomDash,
		lineCap: se?.lineCap,
		lineJoin: se?.lineJoin,
		lineCompound: se?.lineCompound
	}, _e = d[0], ve;
	ve = _e?.lineHidden === !0 ? V(oe) : _e?.lineColor == null ? Xe(_e?.chartexStyle, oe, 0) : {
		fillType: "solid",
		color: _e.lineColor
	};
	let ye = fe(_e?.chartexStyle, ge), be = {
		paint: ve === void 0 ? me : ve,
		...ye,
		lineWidthEmu: _e?.lineWidthEmu ?? ye.lineWidthEmu
	};
	be.lineCompound != null && be.lineCompound !== "sng" && (be.paint = null);
	let xe = Array.from({ length: P }, (e, t) => {
		let n = L.get(t);
		if (n) return n.lineHidden === !0 ? V(oe) : n.lineColor == null ? Xe(n.style, oe, t) : {
			fillType: "solid",
			color: n.lineColor
		};
	}), Se = xe.map((e, t) => {
		let n = L.get(t), r = fe(n?.style, be), i = ve === void 0 ? he[t] ?? be.paint : ve, a = {
			paint: e === void 0 ? i : e,
			...r,
			lineWidthEmu: n?.lineWidthEmu ?? r.lineWidthEmu
		};
		return a.lineCompound != null && a.lineCompound !== "sng" && (a.paint = null), a;
	}), Ce = (e, t) => e.paint !== void 0 && e.paint === t.paint && e.lineWidthEmu === t.lineWidthEmu && e.lineDash === t.lineDash && e.lineCustomDash === t.lineCustomDash && e.lineCap === t.lineCap && e.lineJoin === t.lineJoin && e.lineCompound === t.lineCompound, W = (e, t) => {
		let n = re(e, t), r = [];
		for (let i = 0; i < n.length - 1; i++) {
			let a = n[i], o = n[i + 1], s = e + (t - e) * ((a + o) / 2), c = Math.max(0, Math.min(P - 1, Math.floor((s - k) / O))), l = r[r.length - 1];
			l && xe[l.band] === void 0 && xe[c] === void 0 && Ce(Se[l.band], Se[c]) ? l.to = o : r.push({
				from: a,
				to: o,
				band: c
			});
		}
		return r;
	};
	if (n.surfaceWireframe === !0) {
		let e = 0, t = (t, n) => t == null || n == null || !Number.isFinite(t) || !Number.isFinite(n) ? !0 : (e += W(t, n).length, e <= Go);
		for (let e = 0; e < p; e++) for (let n = 0; n < f - 1; n++) if (!t(d[e].values[n], d[e].values[n + 1])) return;
		for (let e = 0; e < f; e++) for (let n = 0; n < p - 1; n++) if (!t(d[n].values[e], d[n + 1].values[e])) return;
		for (let t = 0; t < p - 1; t++) for (let n = 0; n < f - 1; n++) {
			let r = [
				d[t].values[n],
				d[t].values[n + 1],
				d[t + 1].values[n + 1],
				d[t + 1].values[n]
			];
			if (r.some((e) => e == null || !Number.isFinite(e))) continue;
			let i = r;
			for (let t of Wo(i)) {
				let n = Math.min(...t.map((e) => i[e])), r = Math.max(...t.map((e) => i[e])), a = Math.max(1, Math.floor((n - k) / O) + 1), o = Math.min(P - 1, Math.ceil((r - k) / O) - 1);
				if (!(o < a) && (e += o - a + 1, e > Go)) return;
			}
		}
	}
	let we = xe.some((e) => e === void 0) && (ve !== void 0 || he.length === 0), Te = [
		{
			surface: n.threeD?.floor,
			role: "floor"
		},
		{
			surface: n.threeD?.sideWall,
			role: "wall"
		},
		{
			surface: n.threeD?.backWall,
			role: "wall"
		}
	].map(({ surface: e, role: t }) => ot(n, e, t)), Ee = 0;
	for (let e of [
		...H,
		...ue,
		...n.surfaceWireframe === !0 && we ? [be.paint] : [],
		...n.surfaceWireframe === !0 ? he : [],
		...n.surfaceWireframe === !0 ? xe.filter((e) => e !== void 0) : [],
		...Te.flatMap((e) => [e.fill, e.line])
	]) {
		if (e == null) continue;
		let t = h(e);
		if (e.fillType === "gradient" && t > Ti || t > Ei - Ee) return;
		Ee += t;
	}
	let De = Array.from({ length: P }, (e, t) => {
		let n = k + t * O, r = Math.min(A, n + O);
		return `${Re(n)}-${Re(r)}`;
	}), Oe = {
		...n,
		series: De.map((e, t) => {
			let n = H[t], r = ue[t];
			return {
				name: e,
				color: n === null ? "00000000" : n?.fillType === "solid" ? n.color.replace(/^#/, "") : I[t].replace(/^#/, ""),
				...r?.fillType === "solid" ? { lineColor: r.color.replace(/^#/, "") } : r === null ? { lineHidden: !0 } : {},
				values: []
			};
		})
	}, je = [...H];
	Math.abs(v.rotationX) === 90 && (Oe.series.reverse(), je.reverse());
	let Me = Fa(t, Oe, c, l, i), { legRightW: Ne, legLeftW: Fe, legTopH: Ie, legBottomH: Le } = hn(Me, n.legendOverlay === !0), ze = ko(t, n, c, l, i), Be = Ae(n.catAxisFontSizeHpt, l, i), G = n.threeD?.seriesAxis, He = en(G?.fontSizeHpt, i) ?? Be, { px0: Ge, py0: qe, pw: Je, ph: Ye } = Tt(n, o, s, c, l, i, {
		titleBand: ze,
		legendReserve: Me,
		pad: {
			t: ze.bandH + Ie + He / 2,
			r: Ne + He * 3.2 + 12,
			b: Dn(Be, n.catAxisLabelOffsetPercent) + Le,
			l: Fe + Be * 1.5
		},
		honorPlotAreaManualLayout: !0
	}).plotRect;
	if (!(Je > 0) || !(Ye > 0)) return;
	jo(t, n, n.titleManualLayout || !n.titleRichRuns?.length ? o : Ge, s, n.titleManualLayout || !n.titleRichRuns?.length ? c : Je, l, s + ze.topPad, ze.fontPx), In(t, n, Ge, qe, Je, Ye, i, a);
	let K = Cr(v, {
		x: Ge,
		y: qe,
		w: Je,
		h: Ye
	}, {
		sceneDepthScale: Ko,
		perspectiveTangentGain: b
	});
	if (!K) return;
	K = Er(K, n.threeD ?? {}, {
		x: Ge,
		y: qe,
		w: Je,
		h: Ye
	});
	let Ze = y || Math.abs(v.rotationX) === 90 && v.rotationY === 0 && v.rightAngleAxes === !1 && v.perspective === 0, { front: q } = K, $e = n.catAxisOrientation === "maxMin", et = tt(n), nt = (e) => q.x + U(e, f, et, $e) * q.w, J = G?.orientation === "maxMin", at = (e) => U(e, p, !1, J), Y = (e) => q.y + q.h - F(e) * q.h, st = [], ct = [], lt = (e, t) => {
		let n = (n) => ({
			x: e.x + (t.x - e.x) * n,
			y: e.y + (t.y - e.y) * n,
			depth: e.depth + (t.depth - e.depth) * n,
			value: e.value + (t.value - e.value) * n
		});
		for (let r of W(e.value, t.value)) {
			let e = n(r.from), t = n(r.to);
			ct.push({
				points: [K.project(e.x, e.y, e.depth), K.project(t.x, t.y, t.depth)],
				band: r.band
			});
		}
	}, ut = (e) => {
		let t = Math.min(...e.map((e) => e.value)), n = Math.max(...e.map((e) => e.value)), r = Math.max(1, Math.floor((t - k) / O) + 1), i = Math.min(P - 1, Math.ceil((n - k) / O) - 1);
		for (let t = r; t <= i; t++) {
			let n = k + t * O, r = [], i = (e) => {
				r.some((t) => Math.abs(t.x - e.x) < 1e-9 && Math.abs(t.y - e.y) < 1e-9 && Math.abs(t.depth - e.depth) < 1e-9) || r.push(e);
			};
			for (let t = 0; t < e.length; t++) {
				let r = e[t], a = e[(t + 1) % e.length];
				if (r.value === n && i(r), r.value < n && a.value > n || r.value > n && a.value < n) {
					let e = (n - r.value) / (a.value - r.value);
					i({
						x: r.x + (a.x - r.x) * e,
						y: r.y + (a.y - r.y) * e,
						depth: r.depth + (a.depth - r.depth) * e,
						value: n
					});
				}
			}
			r.length === 2 && ct.push({
				points: [K.project(r[0].x, r[0].y, r[0].depth), K.project(r[1].x, r[1].y, r[1].depth)],
				band: t - 1
			});
		}
	}, dt = (e) => {
		if (n.surfaceWireframe === !0) {
			ut(e);
			return;
		}
		let t = Math.min(...e.map((e) => e.value)), r = Math.max(...e.map((e) => e.value)), i = Math.max(0, Math.floor((t - k) / O)), a = Math.min(P - 1, Math.floor((r - k) / O));
		for (let t = i; t <= a; t++) {
			let n = k + t * O, r = t === P - 1 ? A : n + O, i = qo(e, n, !0);
			if (i = qo(i, r, !1), i.length < 3) continue;
			let a = i.map((e) => K.project(e.x, e.y, e.depth));
			st.push({
				points: a,
				scenePoints: i,
				band: t,
				depth: i.reduce((e, t) => e + K.cameraDepth(t.x, t.y, t.depth), 0) / i.length
			});
		}
	};
	t.save(), t.beginPath(), t.rect(Ge, qe, Je, Ye), t.clip();
	let ft = (e, n, r, i, a = !1) => {
		if (e.length < 2) return;
		let o = a ? e.map((e) => K.projectUnbounded(e.x, e.y, e.depth)) : e.map((e) => K.project(e.x, e.y, e.depth));
		t.beginPath(), t.moveTo(o[0].x, o[0].y);
		for (let e = 1; e < o.length; e++) t.lineTo(o[e].x, o[e].y);
		t.strokeStyle = n, t.lineWidth = r, t.setLineDash($(i ?? "solid", r)), t.stroke();
	}, pt = K.topology.farDepth, mt = K.topology.nearDepth, _t = q.y + q.h, vt = q.y, bt = K.topology.farX === "min" ? q.x : q.x + q.w, xt = [
		"floor",
		"sideWall",
		"backWall"
	].map((e) => {
		let t = n.threeD?.[e];
		return br(K, e, t?.thicknessPercent);
	}), St = [
		"floor",
		"sideWall",
		"backWall"
	], Ct = (e, t, n, r, i, a) => {
		let o = xt[e], s = St[e];
		for (let e of Dr(o, s, t, n)) o.thickness > 0 && !K.cameraFacing(o.faces[e.faceIndex]) || ft(e.scenePoints, r, i, a, !0);
	}, wt = (e, t, n, r) => {
		for (let i of e) {
			let e = F(i);
			Ct(1, "y", e, t, n, r), Ct(2, "y", e, t, n, r);
		}
	}, Et = (e, t, n, r) => {
		for (let i of e) Ct(0, "x", i, t, n, r), Ct(2, "x", i, t, n, r);
	}, Dt = xt.some((e) => e.thickness > 0) ? xt.map((e) => e.faces.filter((t) => e.thickness === 0 || K.cameraFacing(t)).map((e) => e.map((e) => K.projectUnbounded(e.x, e.y, e.depth)))) : [
		[
			K.project(q.x, _t, mt),
			K.project(q.x + q.w, _t, mt),
			K.project(q.x + q.w, _t, pt),
			K.project(q.x, _t, pt)
		],
		[
			K.project(bt, _t, mt),
			K.project(bt, _t, pt),
			K.project(bt, vt, pt),
			K.project(bt, vt, mt)
		],
		[
			K.project(q.x, _t, pt),
			K.project(q.x + q.w, _t, pt),
			K.project(q.x + q.w, vt, pt),
			K.project(q.x, vt, pt)
		]
	].map((e) => [e]);
	for (let e = 0; e < Dt.length; e++) {
		let r = Dt[e];
		if (!r.length) continue;
		let a = r.flat(), o = Te[e], s = o.fill?.fillType === "image" ? o.fill : null;
		if (s) {
			let r = Or(xt[e], i), a = $t(s, r ? ln(s, r.widthPt, r.heightPt) : void 0), o = n.threeD?.[St[e]];
			a && Tr(t, s, a, o, St[e], xt[e], xt[e].faces.map((e, t) => ({
				face: e,
				faceIndex: t
			})).filter(({ face: t }) => xt[e].thickness === 0 || K.cameraFacing(t)).map(({ faceIndex: e }) => e), (e) => K.projectUnbounded(e.x, e.y, e.depth), j, (e, t) => $t(s, ln(s, e, t)), i);
		}
		let c = Math.min(...a.map((e) => e.x)), l = Math.max(...a.map((e) => e.x)), u = Math.min(...a.map((e) => e.y)), d = Math.max(...a.map((e) => e.y)), f = s ? null : o.fill?.fillType === "solid" ? `#${o.fill.color}` : o.fill ? Pn(o.fill, t, c, u, l - c, d - u) : null, p = o.line?.fillType === "solid" ? `#${o.line.color}` : o.line ? Pn(o.line, t, c, u, l - c, d - u) : null, m = o.lineWidthEmu == null ? 1 : it(o.lineWidthEmu, i);
		for (let e of r) {
			t.beginPath(), t.moveTo(e[0].x, e[0].y);
			for (let n = 1; n < e.length; n++) t.lineTo(e[n].x, e[n].y);
			t.closePath(), f && (t.fillStyle = f, t.fill()), p && (t.strokeStyle = p, t.lineWidth = m, t.setLineDash(Pe(o.lineCustomDash, o.lineDash, m)), t.lineCap = o.lineCap === "rnd" ? "round" : o.lineCap === "sq" ? "square" : "butt", t.lineJoin = o.lineJoin === "round" || o.lineJoin === "bevel" ? o.lineJoin : "miter", t.stroke());
		}
	}
	if (n.valAxisMinorGridlines === !0) {
		let e = Fn(n, i);
		wt(D.minorLines.filter((e) => e >= k && e <= A), e.color, e.width, n.valAxisMinorGridlineDash);
	}
	if (e(n)) {
		let e = ke(n.valAxisGridlineColor, n.valAxisGridlineWidthEmu, i);
		if (n.valAxisMajorGridlines === !0) wt(ne, e.color, e.width, n.valAxisGridlineDash);
		else for (let t of ne) {
			let r = F(t), i = Y(t);
			xt[2].thickness > 0 ? Ct(2, "y", r, e.color, e.width, n.valAxisGridlineDash) : ft([{
				x: q.x,
				y: i,
				depth: pt
			}, {
				x: q.x + q.w,
				y: i,
				depth: pt
			}], e.color, e.width, n.valAxisGridlineDash), xt[1].thickness > 0 ? Ct(1, "y", r, e.color, e.width, n.valAxisGridlineDash) : ft([{
				x: bt,
				y: i,
				depth: mt
			}, {
				x: bt,
				y: i,
				depth: pt
			}], e.color, e.width, n.valAxisGridlineDash);
		}
	}
	if (n.catAxisMinorGridlines === !0) {
		let e = B(n, i);
		Et(x(f, et), e.color, e.width, n.catAxisMinorGridlineDash);
	}
	if (n.catAxisMajorGridlines) {
		let e = ke(n.catAxisGridlineColor, n.catAxisGridlineWidthEmu, i);
		Et(Ue(n, f), e.color, e.width, n.catAxisGridlineDash);
	}
	for (let e = 0; e < p - 1; e++) for (let t = 0; t < f - 1; t++) {
		let n = [
			d[e].values[t],
			d[e].values[t + 1],
			d[e + 1].values[t + 1],
			d[e + 1].values[t]
		];
		if (n.some((e) => e == null || !Number.isFinite(e))) continue;
		let r = [
			{
				x: nt(t),
				y: Y(n[0]),
				depth: at(e),
				value: n[0]
			},
			{
				x: nt(t + 1),
				y: Y(n[1]),
				depth: at(e),
				value: n[1]
			},
			{
				x: nt(t + 1),
				y: Y(n[2]),
				depth: at(e + 1),
				value: n[2]
			},
			{
				x: nt(t),
				y: Y(n[3]),
				depth: at(e + 1),
				value: n[3]
			}
		];
		for (let e of Wo(n)) dt(e.map((e) => r[e]));
	}
	if (n.surfaceWireframe === !0) {
		for (let e = 0; e < p; e++) for (let t = 0; t < f - 1; t++) {
			let n = d[e].values[t], r = d[e].values[t + 1];
			n == null || r == null || !Number.isFinite(n) || !Number.isFinite(r) || lt({
				x: nt(t),
				y: Y(n),
				depth: at(e),
				value: n
			}, {
				x: nt(t + 1),
				y: Y(r),
				depth: at(e),
				value: r
			});
		}
		for (let e = 0; e < f; e++) for (let t = 0; t < p - 1; t++) {
			let n = d[t].values[e], r = d[t + 1].values[e];
			n == null || r == null || !Number.isFinite(n) || !Number.isFinite(r) || lt({
				x: nt(e),
				y: Y(n),
				depth: at(t),
				value: n
			}, {
				x: nt(e),
				y: Y(r),
				depth: at(t + 1),
				value: r
			});
		}
	}
	st.sort((e, t) => e.depth - t.depth);
	let Ot = Array.from({ length: P }, () => ({
		minX: Infinity,
		minY: Infinity,
		maxX: -Infinity,
		maxY: -Infinity
	})), kt = Array.from({ length: P }, () => []);
	for (let e of st) {
		kt[e.band].push(e);
		let t = Ot[e.band];
		for (let n of e.points) t.minX = Math.min(t.minX, n.x), t.minY = Math.min(t.minY, n.y), t.maxX = Math.max(t.maxX, n.x), t.maxY = Math.max(t.maxY, n.y);
	}
	for (let e of ct) {
		let t = Ot[e.band];
		for (let n of e.points) t.minX = Math.min(t.minX, n.x), t.minY = Math.min(t.minY, n.y), t.maxX = Math.max(t.maxX, n.x), t.maxY = Math.max(t.maxY, n.y);
	}
	let At = (e, n) => {
		if (e == null) return e;
		if (e.fillType === "solid") return `#${e.color}`;
		let r = Ot[n];
		return !Number.isFinite(r.minX) || !Number.isFinite(r.minY) || !Number.isFinite(r.maxX) || !Number.isFinite(r.maxY) ? null : Pn(e, t, r.minX, r.minY, r.maxX - r.minX, r.maxY - r.minY);
	}, jt = H.map(At), Mt = ue.map(At);
	for (let e = 0; e < P; e++) {
		if (jt[e] === null) continue;
		let n = kt[e].filter((e) => e.points.length >= 3);
		n.length && Q(t, L.get(e)?.style, ae, 0, i, (e) => {
			e.beginPath();
			for (let t of n) {
				e.moveTo(t.points[0].x, t.points[0].y);
				for (let n = 1; n < t.points.length; n++) e.lineTo(t.points[n].x, t.points[n].y);
				e.closePath();
			}
			e.fillStyle = "#000000", e.fill();
		}, e);
	}
	for (let e of st) {
		let n = L.get(e.band);
		t.beginPath(), t.moveTo(e.points[0].x, e.points[0].y);
		for (let n = 1; n < e.points.length; n++) t.lineTo(e.points[n].x, e.points[n].y);
		t.closePath();
		let r = jt[e.band];
		if (r !== null) {
			let n = Ze ? xr(K.cameraNormal(e.scenePoints)) : 1;
			t.fillStyle = typeof r == "string" && le[e.band]?.fromRole ? kr(r, n) : r ?? kr(I[e.band], n), t.fill();
		}
		let a = Mt[e.band];
		if (a != null) {
			let e = n?.style, r = R, o = z;
			t.strokeStyle = a;
			let s = n?.lineWidthEmu ?? e?.lineWidthEmu ?? r?.lineWidthEmu ?? o?.lineWidthEmu;
			t.lineWidth = s == null ? 1 : it(s, i), t.setLineDash(Pe(e?.lineCustomDash ?? r?.lineCustomDash ?? o?.lineCustomDash, e?.lineDash ?? r?.lineDash ?? o?.lineDash, t.lineWidth));
			let c = e?.lineCap ?? r?.lineCap ?? o?.lineCap, l = e?.lineJoin ?? r?.lineJoin ?? o?.lineJoin;
			t.lineCap = c === "rnd" ? "round" : c === "sq" ? "square" : "butt", t.lineJoin = l === "round" || l === "bevel" ? l : "miter", t.stroke();
		}
	}
	if (n.surfaceWireframe === !0) {
		let e = we ? be.paint?.fillType === "solid" ? `#${be.paint.color}` : be.paint ? Pn(be.paint, t, Ge, qe, Je, Ye) : be.paint : void 0, n = xe.map((t, n) => t === void 0 ? ve !== void 0 || he.length === 0 ? e : At(he[n], n) : At(t, n));
		for (let e of ct) {
			let r = Se[e.band], a = n[e.band];
			if (a === null) continue;
			t.beginPath(), t.moveTo(e.points[0].x, e.points[0].y), t.lineTo(e.points[1].x, e.points[1].y), t.strokeStyle = a ?? I[e.band], t.lineWidth = r.lineWidthEmu == null ? Math.max(1, .75 * i) : it(r.lineWidthEmu, i), t.setLineDash(Pe(r.lineCustomDash, r.lineDash, t.lineWidth));
			let o = r.lineCap, s = r.lineJoin;
			t.lineCap = o === "rnd" ? "round" : o === "sq" ? "square" : "butt", t.lineJoin = s === "round" || s === "bevel" ? s : "miter", t.stroke();
		}
	}
	t.restore();
	let Nt = K.project(q.x + q.w / 2, q.y + q.h / 2, .5), Pt = (e, n, r, a, o, s, c, l, u) => {
		if (c || e == null || e === "none") return;
		let d = a.x - r.x, f = a.y - r.y, p = Math.hypot(d, f);
		if (!(p > 1e-6)) return;
		let m = -f / p, h = d / p, g = (r.x + a.x) / 2, _ = (r.y + a.y) / 2;
		(g - Nt.x) * m + (_ - Nt.y) * h < 0 && (m = -m, h = -h);
		let v = sr(l, s, i), y = e === "cross" ? v / 2 : v, b = e === "out" || e === "cross" ? y : 0, x = e === "in" || e === "cross" ? y : 0;
		kn(t, n.x + m * b, n.y + h * b, n.x - m * x, n.y - h * x, o, s, u);
	}, Ft = K.project(q.x, _t, mt), It = K.project(q.x + q.w, _t, mt), Lt = n.catAxisLineWidthEmu == null ? 1 : it(n.catAxisLineWidthEmu, i);
	kn(t, Ft.x, Ft.y, It.x, It.y, n.catAxisLineColor ? `#${n.catAxisLineColor}` : "#000000", Lt, n.catAxisLineDash);
	let Rt = n.catAxisLineColor ? `#${n.catAxisLineColor}` : "#000000", zt = n.catAxisHidden || n.catAxisLineHidden === !0, Bt = Math.max(1, Math.floor(n.catAxisTickMarkSkip ?? 1));
	for (let e = 0; e < f; e += Bt) Pt(n.catAxisMajorTickMark, K.project(nt(e), _t, mt), Ft, It, Rt, Lt, zt, "major", n.catAxisLineDash);
	if (n.catAxisMinorTickMark != null && n.catAxisMinorTickMark !== "none") for (let e = 0; e < f - 1; e++) {
		let t = (U(e, f, et, $e) + U(e + 1, f, et, $e)) / 2;
		Pt(n.catAxisMinorTickMark, K.project(q.x + t * q.w, _t, mt), Ft, It, Rt, Lt, zt, "minor", n.catAxisLineDash);
	}
	t.font = or(Be, yt(n, n.catAxisFontFace, "minor"), n.catAxisFontBold ?? !1, n.catAxisFontItalic ?? !1), t.fillStyle = n.catAxisFontColor ? `#${n.catAxisFontColor}` : "#000000", t.textBaseline = "top";
	for (let e = 0; e < f; e++) {
		let r = Ve(e, f, tt(n), Ke(n), n.catAxisLabelAlignment), i = K.project(q.x + r.fraction * q.w, _t, mt);
		t.textAlign = r.textAlign, gt(t, u[e] ?? "", i.x, i.y + T(8, n.catAxisLabelOffsetPercent), rr(Be));
	}
	if (!G?.hidden) {
		let e = G?.lineWidthEmu == null ? 1 : it(G.lineWidthEmu, i), r = K.project(q.x, _t, .5), a = K.project(q.x + q.w, _t, .5), o = r.x >= a.x ? q.x : q.x + q.w, s = K.project(o, _t, mt), c = K.project(o, _t, pt);
		kn(t, s.x, s.y, c.x, c.y, G?.lineColor ? `#${G.lineColor}` : "#000000", e, G?.lineDash);
		let l = G?.lineColor ? `#${G.lineColor}` : "#000000", u = Math.max(1, Math.floor(G?.tickMarkSkip ?? 1));
		for (let t = 0; t < p; t += u) Pt(G?.majorTickMark, K.project(o, _t, at(t)), s, c, l, e, G?.lineHidden === !0, "major", G?.lineDash);
		if (G?.minorTickMark != null && G.minorTickMark !== "none") for (let t = 0; t < p - 1; t++) Pt(G.minorTickMark, K.project(o, _t, (at(t) + at(t + 1)) / 2), s, c, l, e, G.lineHidden === !0, "minor", G.lineDash);
		t.font = or(He, yt(n, G?.fontFace, "minor"), G?.fontBold ?? !1, G?.fontItalic ?? !1), t.fillStyle = G?.fontColor ? `#${G.fontColor}` : "#000000", t.textAlign = "left", t.textBaseline = "middle";
		for (let e = 0; e < p; e++) {
			let n = K.project(o, _t, at(e));
			gt(t, d[e].name, n.x + 8, n.y, rr(He));
		}
	}
	if (!n.valAxisHidden) {
		let e = K.topology.axisX === "min" ? q.x : q.x + q.w, r = K.project(e, q.y + q.h, mt), a = K.project(e, q.y, mt);
		if (Math.hypot(a.x - r.x, a.y - r.y) > 4) {
			let o = n.valAxisLineWidthEmu == null ? 1 : it(n.valAxisLineWidthEmu, i);
			kn(t, r.x, r.y, a.x, a.y, n.valAxisLineColor ? `#${n.valAxisLineColor}` : "#000000", o, n.valAxisLineDash);
			let s = Ae(n.valAxisFontSizeHpt, l, i);
			t.font = or(s, yt(n, n.valAxisFontFace, "minor"), n.valAxisFontBold ?? !1, n.valAxisFontItalic ?? !1), t.fillStyle = n.valAxisFontColor ? `#${n.valAxisFontColor}` : "#000000";
			let c = (r.x + a.x) / 2 < Ge + Je / 2;
			t.textAlign = c ? "right" : "left", t.textBaseline = "middle";
			for (let r of ne) {
				let i = K.project(e, Y(r), mt);
				gt(t, g(r, n.valAxisFormatCode, n.date1904), i.x + (c ? -6 : 6), i.y, rr(s));
			}
		}
	}
	Ra(t, Oe, Me, o, s, c, l, Ge, qe, Je, Ye, ze.bandH + 2, i, je);
}
function Yo(n, i, a, o, s = 0) {
	let { x: c, y: l, w: u, h: d } = a, p = Xt(i), m = p.length;
	if (m === 0) return;
	let h = Sa(i, o), g = i.series.map((e, t) => ({
		series: e,
		chartIndex: t
	})).filter(({ series: e }) => e.seriesType == null || e.seriesType === "area"), _ = i.series.map((e, t) => ({
		series: e,
		chartIndex: t
	})).filter(({ series: e }) => e.seriesType === "line");
	if (g.length === 0 && _.length === 0) return;
	let v = Nt(i), y = i.chartType === "stackedAreaPct" ? "percentStacked" : i.chartType === "stackedArea" ? "stacked" : "standard", b = i.plotGroups?.filter((e) => e.kind === "area") ?? [{
		kind: "area",
		seriesStart: 0,
		seriesCount: g.length,
		categoryAxis: "primary",
		valueAxis: "primary",
		seriesAxis: "none",
		grouping: y
	}], x = Array(i.series.length).fill(-1);
	for (let e = 0; e < g.length; e++) x[g[e].chartIndex] = e;
	let C = b.map((e) => {
		let t = [], n = Math.min(i.series.length, e.seriesStart + e.seriesCount);
		for (let r = e.seriesStart; r < n; r++) {
			let e = x[r];
			e >= 0 && t.push(e);
		}
		return {
			group: e,
			areaIndices: t
		};
	}), w = Array(g.length).fill(!1), D = Array(g.length).fill(!1), k = Array(g.length).fill(null), A = g.map(() => Array(m).fill(0)), ee = g.map(() => Array(m).fill(0)), M = i.plotGroups?.filter((e) => (e.kind === "area" || e.kind === "line") && e.seriesCount > 0) ?? b, te = /* @__PURE__ */ new Map();
	for (let e of M) {
		let t = e.valueAxis;
		te.set(t, (te.get(t) ?? !0) && e.grouping === "percentStacked");
	}
	for (let { group: e, areaIndices: t } of C) {
		let n = e.grouping ?? "standard", r = n === "stacked" || n === "percentStacked", i = n === "percentStacked", a = i && te.get(e.valueAxis) === !0 ? 100 : 1, o = i ? p.map((e, n) => t.reduce((e, t) => e + Math.abs(g[t].series.values[n] ?? 0), 0) || 1) : null;
		for (let e of t) w[e] = r, D[e] = i, k[e] = o;
		for (let e = 0; e < m; e++) {
			let n = 0, s = 0;
			for (let c of t) {
				let t = g[c].series.values[e] ?? 0, l = i && o ? t / o[e] * a : t, u = l >= 0 ? n : s;
				A[c][e] = r ? u : 0, ee[c][e] = r ? u + l : l, r && (l >= 0 ? n += l : s += l);
			}
		}
	}
	let P = M.filter((e) => e.valueAxis !== "secondary"), F = P.length > 0 && P.every((e) => e.grouping === "percentStacked"), ne = new Map(g.map((e, t) => [e.series, t])), I = new Map(i.series.map((e, t) => [e, t])), L = (e) => v[I.get(e) ?? -1]?.valueAxis === "secondary" || i.plotGroups == null && e.useSecondaryAxis === !0, ie = M.filter((e) => e.valueAxis === "secondary"), ae = ie.length > 0 && ie.every((e) => e.grouping === "percentStacked"), B = i.secondaryValAxis && i.series.some((e) => L(e)) ? i.secondaryValAxis : null, V = (e) => B != null && L(e), oe = ko(n, i, u, d, o), se = oe.fontPx, ce = oe.topPad, H = oe.bandH, fe = Ae(i.catAxisFontSizeHpt, d, o), pe = Ae(i.valAxisFontSizeHpt, d, o), me = Fa(n, i, u, d, o), { legRightW: ge, legLeftW: _e, legTopH: ve, legBottomH: ye } = hn(me, i.legendOverlay === !0), U = ft(i, u, d, o), be = U.catFontPx, xe = U.valFontPx, Se = U.catBandH, W = U.valBandW, we = Ba(i), Te = we && Va(i), Ee = Ha(i, fe), De = Ka(i, o), Oe = qa(n, i, o), ke = H + ve + pe / 2 + 2, je = (we ? De + Ee : Dn(fe, i.catAxisLabelOffsetPercent)) + Se + ye, Me = d - ke - je, Pe = (e, t, n) => po(i, e, Fe(e, t)) ? ho(fo(e, m, i.dispBlanksAs).map((t) => t.map((t) => e.values[t] ?? 0)), n) : null, Re = [];
	if (B) for (let { series: e, chartIndex: t } of _) {
		if (!V(e)) continue;
		let n = Pe(e, t, B.logBase);
		n && Re.push(...n);
	}
	let Be = Kt(B, i.series, Me / o, "y", ae, !1, (e) => L(e), (e, t) => {
		let n = ne.get(e);
		return n == null ? e.values[t] ?? null : e.values[t] == null ? null : ee[n][t] ?? null;
	}, Re), G = Math.max(8, Math.min(11, d / 20)), He = en(B?.fontSizeHpt, o) ?? G, We = 0;
	if (B && Be && !B.hidden) {
		let e = n.font;
		n.font = `${He}px ${yt(i, B.fontFace, "minor")}`;
		let t = 0;
		for (let e of Be.majorLines) t = Math.max(t, Ie(n, jt(e, B.formatCode ?? null, i.date1904, B.displayUnits)));
		We = t + 18, n.font = e;
	}
	let Ge = B && B.title ? re(B, o) : 0, qe = (() => {
		let e = Infinity, t = -Infinity;
		for (let n = 0; n < m; n++) {
			for (let r = 0; r < g.length; r++) {
				let { series: i } = g[r];
				V(i) || i.values[n] == null || (e = Math.min(e, A[r][n], ee[r][n]), t = Math.max(t, A[r][n], ee[r][n]));
			}
			for (let { series: r } of _) {
				if (V(r)) continue;
				let i = r.values[n];
				i != null && (e = Math.min(e, i), t = Math.max(t, i));
			}
		}
		return !isFinite(e) || !isFinite(t) ? {
			min: 0,
			max: 1
		} : F ? {
			min: e < 0 ? -100 : 0,
			max: t > 0 ? 100 : 0
		} : {
			min: e,
			max: t
		};
	})();
	if (!F) {
		let e = (e) => {
			qe = {
				min: Math.min(qe.min, e),
				max: Math.max(qe.max, e)
			};
		};
		for (let t = 0; t < g.length; t++) {
			let { series: n } = g[t];
			V(n) || O(n, "y", (e) => n.values[e] == null ? null : ee[t][e], e);
		}
		for (let { series: t } of _) V(t) || O(t, "y", (e) => t.values[e] ?? null, e);
	}
	let Je = null;
	for (let { series: e, chartIndex: t } of _) {
		if (V(e)) continue;
		let n = Pe(e, t, i.valAxisLogBase);
		n && (F ? Je = Je ? [Math.min(Je[0], n[0]), Math.max(Je[1], n[1])] : n : qe = {
			min: Math.min(qe.min, n[0]),
			max: Math.max(qe.max, n[1])
		});
	}
	let Ye = pn(i, qe.min, qe.max, Me / o, F, "vertical", Je), K = i.valAxisFontSizeHpt == null ? Math.max(8, Math.min(11, Me / 20)) : pe, Xe = 0;
	if (!i.valAxisHidden && i.plotAreaManualLayout != null && i.plotAreaManualLayout.layoutTarget !== "inner") {
		let e = n.font;
		n.font = or(K, yt(i, i.valAxisFontFace, "minor"), i.valAxisFontBold ?? !1, i.valAxisFontItalic ?? !1);
		for (let e of Ye.majorLines) Xe = Math.max(Xe, Ie(n, Rn(i, e, F)));
		n.font = e;
	}
	let Ze = Math.max(i.valAxisHidden ? 0 : Ft(Ye.majorLines.map((e) => Rn(i, e, F)), rr(K)), B && Be && !B.hidden && B.tickLabelPos !== "none" ? Ft(Be.majorLines.map((e) => jt(e, B.formatCode ?? null, i.date1904, B.displayUnits)), rr(He)) : 0) / 2, Qe = bt({
		valAxisHidden: i.valAxisHidden,
		catAxisHidden: i.catAxisHidden,
		valLabelWidth: Xe,
		valLabelFontPx: K,
		catLabelFontPx: fe,
		valLabelGapPx: i.valAxisFontSizeHpt == null ? 6 : Rt(K),
		catLabelGapPx: i.catAxisFontSizeHpt == null ? T(3, i.catAxisLabelOffsetPercent) : T(Ht(fe), i.catAxisLabelOffsetPercent),
		outerTextMarginPx: $e * o,
		valTitleBandW: W,
		catTitleBandH: Se,
		secondaryBandW: We + Ge,
		valLabelExtraTopPx: Ze
	}), et = {
		t: ke + Ze,
		r: ge + u * .05 + We + Ge,
		b: je,
		l: _e + Math.max(u * .12 + W, Oe)
	};
	jo(n, i, c, l, u, d, l + ce, se);
	let rt = Tt(i, c, l, u, d, o, {
		titleBand: oe,
		legendReserve: me,
		pad: et,
		honorPlotAreaManualLayout: !0,
		manualOuterInsets: Qe
	}), { px0: J, py0: at, pw: ot } = rt.plotRect, { ph: Y } = rt.plotRect;
	if (ot <= 0 || Y <= 0) return;
	let ct = Ua(i, ot, We + Ge), lt = we ? Ja(n, i, ct / m, o) : null;
	lt && lt.totalHeight > De && (Y = Math.max(1, Y - (lt.totalHeight - De)));
	let ut = r(i, p), dt = Math.max(1, Math.floor(i.catAxisTickLabelSkip ?? 1)), pt = () => ut ? ut.majorTicks.map((e) => er(String(e.serial), i.catAxisFormatCode, i.date1904)) : Array.from({ length: Math.ceil(m / dt) }, (e, t) => er((p[t * dt] ?? "").toString(), i.catAxisFormatCode, i.date1904));
	if (!Te && !i.catAxisHidden && i.catAxisTickLabelPos !== "high") {
		let e = i.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, ot / m * .8)) : fe, t = i.plotAreaManualLayout?.layoutTarget === "inner" && i.plotAreaManualLayout.w != null && i.plotAreaManualLayout.h != null, n = Ft(pt(), rr(e));
		we && (Ee += n), !t && n > 0 && (Y = Math.max(1, Y - n));
	}
	In(n, i, J, at, ot, Y, o, s);
	let mt = pn(i, qe.min, qe.max, Y / o, F, "vertical", Je), ht = tt(i), vt = Ke(i), xt = ut ? (e) => J + ut.positions[e] * ot : ht ? (e) => J + ((vt ? m - 1 - e : e) + .5) / m * ot : (e) => {
		let t = vt ? m - 1 - e : e;
		return J + (m === 1 ? ot / 2 : t / (m - 1) * ot);
	}, St = (e) => at + Y - mt.frac(e) * Y, Ct = Be ? Be.makeToY(at, Y) : St, wt = (e) => V(e) ? Ct : St, Et = St(Fo(i, mt.min, mt.max)), Dt = B && Be ? Ct(Po(i.secondaryCatAxis?.crossesAt, i.secondaryCatAxis?.crosses, Be.min, Be.max)) : Et, Ot = (e) => V(e) ? Dt : Et, { color: kt, width: At } = st(i.catAxisLineColor, i.catAxisLineWidthEmu, o), { color: Mt, width: It } = st(i.valAxisLineColor, i.valAxisLineWidthEmu, o);
	if (!i.valAxisHidden) {
		let t = vn(i, o), r = Fn(i, o);
		if (i.valAxisMinorGridlines) for (let e of mt.minorLines) Gt(n, J, ot, St(e), !1, r);
		if (e(i)) for (let e of mt.majorLines) Gt(n, J, ot, St(e), e === 0, t);
	}
	if (B && Be && Ce(n, B, Be, Ct, J, ot, o), !i.catAxisHidden && q(i)) {
		let e = N(i, o);
		n.strokeStyle = e.color, n.lineWidth = e.width;
		let t = e.dash.length > 0 && n.getLineDash ? n.getLineDash() : [];
		e.dash.length > 0 && n.setLineDash(e.dash);
		let r = ut ? ut.majorTicks.map((e) => e.fraction) : Ue(i, m);
		for (let e of r) {
			let t = J + e * ot;
			n.beginPath(), n.moveTo(t, at), n.lineTo(t, at + Y), n.stroke();
		}
		e.dash.length > 0 && n.setLineDash(t);
	}
	let Lt = C.flatMap(({ areaIndices: e }) => e), zt = (e, t) => ee[e]?.[t] ?? 0;
	for (let e of Lt) {
		let { series: r, chartIndex: a } = g[e], c = de(a, r), l = Fe(r, a), u = le(i, r, void 0, l), d = at + Y, f = wt(r), p = r.smooth === !0;
		Ne(n, ue(r.chartexStyle), t(i, "dataPoint", On(i, r)), l, {
			x: J,
			y: at,
			w: ot,
			h: Y
		}, o, (t) => {
			if (t.beginPath(), w[e]) {
				let n = [];
				for (let t = 0; t < m; t++) n.push({
					x: xt(t),
					y: St(ee[e][t])
				});
				t.moveTo(n[0].x, n[0].y), ze(t, n, p);
				for (let n = m - 1; n >= 0; n--) t.lineTo(xt(n), St(A[e][n]));
			} else {
				let e = [];
				for (let t = 0; t < m; t++) e.push({
					x: xt(t),
					y: f(r.values[t] ?? 0)
				});
				t.moveTo(xt(0), d), t.lineTo(e[0].x, e[0].y), ze(t, e, p), t.lineTo(xt(m - 1), d);
			}
			t.closePath(), zi(t, u, {
				x: J,
				y: at,
				w: ot,
				h: Y
			}, c, o, s), R(t, i, "dataPoint", r, void 0, l, c, 1.5, o, {
				x: J,
				y: at,
				w: ot,
				h: Y
			}, s) && t.stroke();
		});
	}
	let Bt = /* @__PURE__ */ new Map();
	for (let e = 0; e < g.length; e++) {
		let t = g[e].series, n = t.areaGroupIndex ?? 0, r = Bt.get(n) ?? [];
		r.push({
			series: t,
			areaIndex: e
		}), Bt.set(n, r);
	}
	for (let e of i.areaGroupDecorations ?? []) {
		if (!e.dropLines || !rn(n, cn(i, e.dropLines, "dropLine"), o)) continue;
		let t = Bt.get(e.groupIndex) ?? [];
		for (let e = 0; e < m; e++) {
			let r = Infinity, i = -Infinity, a = !1;
			for (let n of t) {
				if (n.series.values[e] == null) continue;
				let t = wt(n.series)(zt(n.areaIndex, e)), o = Ot(n.series);
				!Number.isFinite(t) || !Number.isFinite(o) || (r = Math.min(r, t, o), i = Math.max(i, t, o), a = !0);
			}
			!a || Math.abs(i - r) < .01 || (n.beginPath(), n.moveTo(xt(e), r), n.lineTo(xt(e), i), n.stroke());
		}
	}
	{
		let e = Math.max(2, 2.5 * o);
		for (let t = 0; t < g.length; t++) {
			let { series: r, chartIndex: a } = g[t], f = cr(r.dataPointOverrides), _ = de(a, r), v = wt(r), y = (e) => zt(t, e), b = k[t];
			for (let e of r.errBars ?? []) $a(n, r, Pt(i, e), m, xt, v, y, _);
			let x = (r.showMarker === !0 || S(r)) && r.markerSymbol !== "none", C = ia(i, r, a);
			if (x || _t(r)) for (let t = 0; t < m; t++) {
				if (r.sourceHidden?.[t] === !0 || r.values[t] == null) continue;
				let a = f.get(t), c = ir(r, a, "circle", x);
				if (c === "none") continue;
				let l = xt(t), u = v(y(t));
				if (C || E(a)) {
					let e = a?.markerSize ?? r.markerSize ?? 5, d = $n(r, a, t, _), f = a?.markerLine ?? r.markerLine ?? null, p = a?.markerLineWidthEmu ?? r.markerLineWidthEmu;
					ra(n, i, r, a, t, l, u, c, e, d, f, o, p == null ? void 0 : it(p, o), Le(r, a, t), s);
				} else n.fillStyle = _, n.beginPath(), n.arc(l, u, e, 0, Math.PI * 2), n.fill();
			}
			so(n, r, p, m, xt, v, y, Y, o, i.date1904 ?? !1, !0, yt(i, i.dataLabelFontFace, "minor"), i.dataLabelPosition ?? "ctr", {
				x: J,
				y: at,
				w: ot,
				h: Y
			}, {
				x: c,
				y: l,
				w: u,
				h: d
			}, D[t] && b ? (e) => (r.values[e] ?? 0) / b[e] : void 0, void 0, (e) => yt(i, e, "minor"), V(r) ? B?.displayUnits : i.valAxisDisplayUnits, (e) => h(a, e), (e) => eo(i, e, V(r) && Be ? Be.max : mt.max), s);
		}
	}
	for (let { series: e, chartIndex: t } of _) {
		let r = cr(e.dataPointOverrides), g = de(t, e), _ = e.lineColor ? `#${e.lineColor}` : g, v = Fe(e, t), y = wt(e), b = Wt(i, t), x = fo(e, m, i.dispBlanksAs).map((t) => t.map((t) => ({
			x: xt(t),
			y: y(e.values[t] ?? 0),
			index: t
		})));
		b ? f(n, i, e, x, e.smooth === !0, !1, g, Math.max(1, 2.25 * o), o, {
			x: J,
			y: at,
			w: ot,
			h: Y
		}, s) : Ne(n, ue(e.chartexStyle), i.chartStyleRoles?.dataPointLine, v, {
			x: J,
			y: at,
			w: ot,
			h: Y
		}, o, (t) => {
			if (R(t, i, "dataPointLine", e, void 0, v, g, Math.max(1, 2.25 * o), o, {
				x: J,
				y: at,
				w: ot,
				h: Y
			}, s)) {
				t.beginPath();
				for (let n of x) t.moveTo(n[0].x, n[0].y), ze(t, n, e.smooth === !0);
				t.stroke();
			}
		});
		let C = (t) => e.values[t] ?? 0;
		for (let t of e.errBars ?? []) $a(n, e, Pt(i, t), m, xt, y, C, _);
		let w = (e.showMarker === !0 || S(e)) && e.markerSymbol !== "none";
		if (w || _t(e)) for (let t = 0; t < m; t++) {
			if (e.sourceHidden?.[t] === !0) continue;
			let a = e.values[t];
			if (a == null) continue;
			let c = r.get(t), l = ir(e, c, "circle", w);
			l !== "none" && ra(n, i, e, c, t, xt(t), y(a), l, c?.markerSize ?? e.markerSize ?? 5, $n(e, c, t, _), c?.markerLine ?? e.markerLine ?? null, o, (c?.markerLineWidthEmu ?? e.markerLineWidthEmu) == null ? void 0 : it(c?.markerLineWidthEmu ?? e.markerLineWidthEmu, o), Le(e, c, t), s);
		}
		so(n, e, p, m, xt, y, C, Y, o, i.date1904 ?? !1, !1, yt(i, i.dataLabelFontFace, "minor"), i.dataLabelPosition ?? "r", {
			x: J,
			y: at,
			w: ot,
			h: Y
		}, {
			x: c,
			y: l,
			w: u,
			h: d
		}, void 0, void 0, (e) => yt(i, e, "minor"), V(e) ? B?.displayUnits : i.valAxisDisplayUnits, (e) => h(t, e), (t) => eo(i, t, V(e) && Be ? Be.max : mt.max), s), ua(n, e, _, xt, y, o, void 0, {
			chart: i,
			chartRect: a,
			plotRect: {
				x: J,
				y: at,
				w: ot,
				h: Y
			},
			shapeRotationDeg: s
		});
	}
	if (!i.valAxisHidden) {
		let e = i.valAxisFontSizeHpt == null ? Math.max(8, Math.min(11, Y / 20)) : pe;
		n.font = or(e, yt(i, i.valAxisFontFace, "minor"), i.valAxisFontBold ?? !1, i.valAxisFontItalic ?? !1), n.textBaseline = "middle";
		for (let t of mt.majorLines) {
			let r = St(t);
			z(n, i.valAxisMajorTickMark, "val", J, r, Mt, It, !1, i.valAxisLineHidden, "major", o, i.valAxisLineDash), n.fillStyle = i.valAxisFontColor ? `#${i.valAxisFontColor}` : "#555", n.textAlign = "right";
			let a = i.valAxisFontSizeHpt == null ? 6 : Rt(e);
			gt(n, Rn(i, t, F), J - a, r, rr(e));
		}
		if (i.valAxisMinorTickMark && i.valAxisMinorTickMark !== "none") for (let e of mt.minorTicks) z(n, i.valAxisMinorTickMark, "val", J, St(e), Mt, It, !1, i.valAxisLineHidden, "minor", o, i.valAxisLineDash);
	}
	if (!i.catAxisHidden && !i.catAxisLineHidden && kn(n, J, Et, J + ot, Et, kt, At, i.catAxisLineDash), !i.valAxisHidden && !i.valAxisLineHidden && i.valAxisLineColor != null && kn(n, J, at, J, at + Y, Mt, It, i.valAxisLineDash), !i.catAxisHidden && i.catAxisMajorTickMark && i.catAxisMajorTickMark !== "none") {
		let e = Math.max(1, Math.floor(i.catAxisTickMarkSkip ?? 1));
		if (ut) for (let e of ut.majorTicks) z(n, i.catAxisMajorTickMark, "cat", Et, J + e.fraction * ot, kt, At, !1, i.catAxisLineHidden, "major", o, i.catAxisLineDash);
		else if (ht) for (let t = 0; t <= m; t += e) z(n, i.catAxisMajorTickMark, "cat", Et, J + t / m * ot, kt, At, !1, i.catAxisLineHidden, "major", o, i.catAxisLineDash);
		else for (let t = 0; t < m; t += e) z(n, i.catAxisMajorTickMark, "cat", Et, xt(t), kt, At, !1, i.catAxisLineHidden, "major", o, i.catAxisLineDash);
	}
	if (!i.catAxisHidden && i.catAxisMinorTickMark && i.catAxisMinorTickMark !== "none" && ut) for (let e of ut.minorTicks) z(n, i.catAxisMinorTickMark, "cat", Et, J + e.fraction * ot, kt, At, !1, i.catAxisLineHidden, "minor", o, i.catAxisLineDash);
	if (!Te && !i.catAxisHidden && j(i)) {
		let e = i.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, ot / m * .8)) : fe;
		n.fillStyle = i.catAxisFontColor ? `#${i.catAxisFontColor}` : "#555", n.textAlign = "center", n.textBaseline = "top", n.font = or(e, yt(i, i.catAxisFontFace, "minor"), i.catAxisFontBold ?? !1, i.catAxisFontItalic ?? !1);
		let t = Math.max(1, Math.floor(i.catAxisTickLabelSkip ?? 1)), r = ut ? ut.majorTicks.map((e) => ({
			label: er(String(e.serial), i.catAxisFormatCode, i.date1904),
			x: J + e.fraction * ot,
			categoryIndex: -1
		})) : Array.from({ length: Math.ceil(m / t) }, (e, n) => {
			let r = n * t;
			return {
				label: er((p[r] ?? "").toString(), i.catAxisFormatCode, i.date1904),
				x: xt(r),
				categoryIndex: r
			};
		});
		for (let t of r) {
			let r = t.label;
			if (!r) continue;
			let a = t.categoryIndex < 0 ? null : Ve(t.categoryIndex, m, tt(i), Ke(i), i.catAxisLabelAlignment), o = T(i.catAxisFontSizeHpt == null ? 3 : Ht(e), i.catAxisLabelOffsetPercent);
			n.textAlign = a?.textAlign ?? "center";
			let s = i.catAxisTickLabelPos ?? "nextTo", c = s === "nextTo" ? Et : s === "high" ? at : at + Y;
			gt(n, r, a ? J + a.fraction * ot : t.x, c + o, rr(e));
		}
	}
	if (B && Be) {
		let e = i.valAxisFontColor ? `#${i.valAxisFontColor}` : "#555";
		he(n, i, B, Be, Ct, a, J, at, ot, Y, o, He, We, e, i.date1904);
	}
	lt && Ya(n, i, lt, J, at + Y + Ee, ct, c + _e, o), Ra(n, i, me, c, l, u, d, J, at, ot, Y, H + 2, o), nt(n, i, c, l, u, d, J, at, ot, Y, _e, ye, be, xe);
}
var Xo = .88;
function Zo(e, t, n) {
	return e === "ctr" || t > .01 ? (t + n) / 2 : n * Xo;
}
function Qo(e, n, r, i, a = 0) {
	let o = n.series[0];
	if (!o) return;
	let s = zn(n.ofPie, o.values);
	if (s == null || s.size === 0) {
		$o(e, {
			...n,
			chartType: "pie"
		}, r, !1, i, a);
		return;
	}
	let c = [], l = [];
	for (let e = 0; e < o.values.length; e++) {
		let t = o.values[e], n = t == null ? 0 : Math.abs(t);
		!(n > 0) || !Number.isFinite(n) || (s.has(e) ? l : c).push({
			sourceIndex: e,
			value: n
		});
	}
	if (l.length === 0) {
		$o(e, {
			...n,
			chartType: "pie"
		}, r, !1, i, a);
		return;
	}
	let u = {
		...n,
		chartType: "pie"
	}, d = Fa(e, u, r.w, r.h, i), f = Tt(n, r.x, r.y, r.w, r.h, i, {
		titleTopPadFrac: .035,
		titleBottomPadFrac: .035,
		legendReserve: d,
		radialGapFrac: .02,
		honorPlotAreaManualLayout: !0
	});
	jo(e, n, r.x, r.y, r.w, r.h, r.y + f.title.topPad, f.title.fontPx);
	let { px0: p, py0: m, pw: h, ph: g } = f.plotRect;
	if (!(h > 0) || !(g > 0)) return;
	In(e, n, p, m, h, g, i, a);
	let _ = n.ofPie, v = Math.max(.05, Math.min(2, (_?.secondPieSizePercent ?? 75) / 100)), y = Math.max(0, _?.gapWidthPercent ?? 150) / 100, b = Math.min(g * .44, h * .9 / (2 + 2 * v + y)), x = b * v;
	if (!(b > 0) || !(x > 0)) return;
	let S = p + (h - (2 * b + y * b + 2 * x)) / 2, C = S + b, w = S + 2 * b + y * b + x, T = m + g / 2, E = l.reduce((e, t) => e + t.value, 0), D = cr(o.dataPointOverrides), O = [...c, {
		sourceIndex: l[0].sourceIndex,
		value: E
	}], k = (r, s, c) => {
		let l = r.reduce((e, t) => e + t.value, 0), u = -Math.PI / 2, d = u, f = u;
		for (let p = 0; p < r.length; p++) {
			let m = r[p], h = l > 0 ? m.value / l * Math.PI * 2 : 0, g = D.get(m.sourceIndex), _ = Ye(n, o, 0, m.sourceIndex), v = ne(m.sourceIndex, o, n.varyColors !== !1, 0), y = le(n, o, g, _, m.sourceIndex), b = u, x = u + h;
			Ne(e, ue(g?.chartexStyle, o.chartexStyle), t(n, "dataPoint", 0), _, {
				x: s - c,
				y: T - c,
				w: c * 2,
				h: c * 2
			}, i, (e) => {
				e.beginPath(), e.moveTo(s, T), e.arc(s, T, c, b, x), e.closePath(), zi(e, y, {
					x: s - c,
					y: T - c,
					w: c * 2,
					h: c * 2
				}, v, i, a), os(e, n, o, g, _, "#FFFFFF", i, {
					x: s - c,
					y: T - c,
					w: c * 2,
					h: c * 2
				}, a);
			}), p === r.length - 1 && (d = u, f = u + h), u += h;
		}
		return {
			aggregateStart: d,
			aggregateEnd: f
		};
	}, A = k(O, C, b), j = T - x, ee = T + x;
	if ((_?.type ?? "pie") === "bar") {
		let r = T - x, s = x;
		for (let c of l) {
			let l = E > 0 ? 2 * x * c.value / E : 0, u = w - s / 2, d = D.get(c.sourceIndex), f = Ye(n, o, 0, c.sourceIndex), p = ne(c.sourceIndex, o, n.varyColors !== !1, 0), m = le(n, o, d, f, c.sourceIndex);
			Ne(e, ue(d?.chartexStyle, o.chartexStyle), t(n, "dataPoint", 0), f, {
				x: u,
				y: r,
				w: s,
				h: l
			}, i, (e) => {
				Bi(e, m, {
					x: u,
					y: r,
					w: s,
					h: l
				}, p, i, a), e.beginPath(), e.rect(u, r, s, l), os(e, n, o, d, f, "#FFFFFF", i, {
					x: u,
					y: r,
					w: s,
					h: l
				}, a);
			}), r += l;
		}
		j = T - x, ee = T + x;
	} else k(l, w, x);
	if (_?.seriesLines ?? !0) {
		let t = cn(n, _?.seriesLineStyle ?? {}, "seriesLine"), r = rn(e, {
			...t,
			color: t.color ?? "808080"
		}, i), a = {
			x: C + Math.cos(A.aggregateStart) * b,
			y: T + Math.sin(A.aggregateStart) * b
		}, o = {
			x: C + Math.cos(A.aggregateEnd) * b,
			y: T + Math.sin(A.aggregateEnd) * b
		};
		r && (e.beginPath(), e.moveTo(a.x, a.y), e.lineTo(w - x, j), e.stroke(), e.beginPath(), e.moveTo(o.x, o.y), e.lineTo(w - x, ee), e.stroke());
	}
	d && Ra(e, u, d, r.x, r.y, r.w, r.h, p, m, h, g, f.title.bandH + 2, i);
}
function $o(e, n, r, i, a, o = 0) {
	let { x: s, y: c, w: l, h: u } = r, d = n.series[0];
	if (!d) return;
	let f = d.categories && d.categories.length > 0 ? d.categories : n.categories, p = d.values.map((e) => Math.abs(e ?? 0)), m = p.reduce((e, t) => e + t, 0);
	if (m === 0) return;
	let h = i && n.varyColors === !1 && n.series.length > 1 ? n : {
		...n,
		series: [{
			...d,
			categories: f
		}]
	}, g = Fa(e, h, l, u, a), _ = Tt(n, s, c, l, u, a, {
		titleTopPadFrac: .035,
		titleBottomPadFrac: .035,
		legendReserve: g,
		radialGapFrac: .02,
		honorPlotAreaManualLayout: !0
	}), v = _.title.fontPx, y = _.title.bandH;
	jo(e, n, s, c, l, u, c + _.title.topPad, v);
	let { px0: b, py0: x, pw: S, ph: C } = _.plotRect;
	if (!(S > 0) || !(C > 0)) return;
	In(e, n, b, x, S, C, a, o);
	let w = _.center.cx, T = _.center.cy, E = Math.min(S, C) * .42, D = -Math.PI / 2 + (n.firstSliceAngle ?? 0) * Math.PI / 180, O = i ? Math.max(1, Math.min(90, n.holeSize ?? 50)) : 0, k = i ? n.series : [d], A = new Map(k.map((e) => [e, cr(e.dataPointOverrides)])), j = (E - O / 100 * E) / k.length, ee = (e, t) => {
		let n = A.get(e)?.get(t)?.explosion ?? e.explosion ?? 0;
		return n > 0 ? n / 100 * E : 0;
	}, M = d.seriesDataLabels ?? {
		showVal: !1,
		showCatName: !1,
		showSerName: !1,
		showPercent: !1
	}, te = d.seriesDataLabels != null || (d.dataLabelOverrides?.length ?? 0) > 0, N = n.showDataLabels && !te, P = yt(n, M.fontFace ?? n.dataLabelFontFace, "minor");
	for (let r = 0; r < k.length; r++) {
		let s = k[r], c = s.values.map((e) => Math.abs(e ?? 0)), l = c.reduce((e, t) => e + t, 0);
		if (l === 0) continue;
		let u = E - r * j, d = u - j, f = D;
		for (let p = 0; p < c.length; p++) {
			let m = c[p] / l * Math.PI * 2;
			if (!(m > 0)) continue;
			let h = Ye(n, s, r, p), g = ne(p, s, n.varyColors !== !1, r), _ = A.get(s)?.get(p), v = f + m / 2, y = ee(s, p), b = y > 0 ? Math.cos(v) * y : 0, x = y > 0 ? Math.sin(v) * y : 0, S = le(n, s, _, h, p), C = {
				x: w + b - u,
				y: T + x - u,
				w: u * 2,
				h: u * 2
			};
			if (Ne(e, ue(_?.chartexStyle, s.chartexStyle), t(n, "dataPoint", On(n, s)), h, C, a, (e) => {
				e.beginPath(), d > .01 ? (e.arc(w + b, T + x, u, f, f + m), e.arc(w + b, T + x, d, f + m, f, !0)) : (e.moveTo(w + b, T + x), e.arc(w + b, T + x, u, f, f + m)), e.closePath(), zi(e, S, C, g, a, o), os(e, n, s, _, h, g, a, C, o);
			}), N && r === 0 && m > .15) {
				let t = E * (i ? .75 : .6), n = w + b + Math.cos(v) * t, r = T + x + Math.sin(v) * t, a = Math.round(c[p] / l * 100);
				e.font = `bold ${Math.max(8, E * .1)}px ${P}`, e.fillStyle = "#fff", e.textAlign = "center", e.textBaseline = "middle", e.fillText(`${a}%`, n, r);
			}
			f += m;
		}
	}
	te && es(e, n, M, d, f, p, m, w, T, E, i ? E - j : 0, D, P, a, b, x, S, C, s, c, l, u, p.map((e, t) => ee(d, t)), o), g && Ra(e, h, g, s, c, l, u, b, x, S, C, y + 2, a);
}
function es(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y, b, x, S, C) {
	let w = cr(r.dataLabelOverrides ?? []), T = Sa({
		...t,
		series: [{
			...r,
			categories: i
		}]
	}, p), E = /* @__PURE__ */ new Set();
	for (let e = 0; e < a.length; e++) {
		if (r.sourceHidden?.[e] === !0) continue;
		let t = w.get(e);
		if (F(n, t)) continue;
		let i = Gn(t?.labelBox, n.labelBox);
		i?.fillHidden !== !0 && (i?.fill != null || i?.fillPaint != null) && E.add(e);
	}
	E.size > 0 && as(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, g, h, _, v, y, b, x, E, w, S, C);
	let D = [], O = d;
	for (let d = 0; d < a.length; d++) {
		let k = a[d] / o * Math.PI * 2, A = O + k / 2;
		if (O += k, !(k > 0) || r.sourceHidden?.[d] === !0 || E.has(d)) continue;
		let j = w.get(d);
		if (F(n, j)) continue;
		let ee = j?.showCatName ?? n.showCatName, M = j?.showSerName ?? n.showSerName, te = j?.showVal ?? n.showVal, N = j?.showPercent ?? n.showPercent, P = j?.showLegendKey ?? n.showLegendKey ?? !1, ne = vt({
			customText: j?.text,
			showCategory: ee,
			showSeries: M,
			showValue: te,
			showPercent: N,
			category: (i[d] ?? "").toString(),
			seriesName: r.name,
			sourceValue: a[d],
			percentRatio: a[d] / o,
			formatCode: j?.formatCode ?? n.formatCode ?? r.valFormatCode ?? null,
			percentFormatCode: j?.formatCode ?? n.formatCode ?? "0%",
			date1904: t.date1904 ?? !1,
			separator: j?.separator ?? n.separator
		}), re = P ? T(0, d) : void 0;
		if (!ne && !re) continue;
		let I = j?.position ?? n.position ?? "bestFit", L = I === "outEnd", R = en(j?.fontSizeHpt ?? n.fontSizeHpt, p) ?? Math.max(8, l * .1), z = j?.fontBold ?? n.fontBold, ie = j?.fontColor ?? n.fontColor, ae = j?.fontFace ?? n.fontFace ? yt(t, j?.fontFace ?? n.fontFace, "minor") : f, B = Ge(j, n), V = ro(t, j, p, ae, z ?? !1, B), oe = Zo(I, u, l) + (I === "ctr" ? S[d] ?? 0 : 0);
		if (j?.manualLayout) {
			e.font = `${B.fontItalic ? "italic " : ""}${z ? "bold " : ""}${R}px ${ae}`, ao(e, ne, {
				kind: "point",
				x: s + Math.cos(A) * oe,
				y: c + Math.sin(A) * oe,
				position: "ctr"
			}, {
				x: m,
				y: h,
				w: g,
				h: _
			}, R, ie ? `#${ie}` : "#fff", j.manualLayout, {
				x: v,
				y,
				w: b,
				h: x
			}, V, re, B, p, Gn(j?.labelBox, n.labelBox), C);
			continue;
		}
		if (L) {
			e.font = `${B.fontItalic ? "italic " : ""}${z ? "bold " : ""}${R}px ${ae}`;
			let t = V ? jr(e, V, R, ie ? `#${ie}` : "#333") : null, n = R * 1.15, r = t ? [] : Ze(ne, Math.max(0, b - R), Math.max(0, x - R), n, (t) => e.measureText(t).width, B);
			if (V && !t || !t && r.length === 0 && !re) continue;
			let i = t?.width ?? r.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), a = t?.height ?? R + Math.max(0, r.length - 1) * n, o = re ? ja([re.entry], R, p)[0] ?? 0 : 0, u = re ? Na(re.entry, R, p) : 0;
			D.push(rs(r, A, s, c, l, Math.min(o + (ne ? 4 : 0) + i, Math.max(0, b - R)), Math.min(Math.max(u, a), Math.max(0, x - R)), n, R, z ?? !1, ie ? `#${ie}` : "#333", ae, t ?? void 0, re, B, p));
			continue;
		}
		let se = oe, ce = s + Math.cos(A) * se, le = c + Math.sin(A) * se;
		e.font = `${B.fontItalic ? "italic " : ""}${z ? "bold " : ""}${R}px ${ae}`;
		let H = 2 * se * Math.sin(Math.min(Math.PI, Math.abs(k)) / 2) - R, ue = u > .01 ? l - u - R : l - R;
		if (I !== "ctr" && (!(H > 0) || !(ue > 0))) continue;
		let de = I === "ctr" ? {
			x: m,
			y: h,
			w: g,
			h: _
		} : ss({
			x: ce - H / 2,
			y: le - ue / 2,
			w: H,
			h: ue
		}, {
			x: m,
			y: h,
			w: g,
			h: _
		});
		de && ao(e, ne, {
			kind: "point",
			x: ce,
			y: le,
			position: "ctr"
		}, de, R, ie ? `#${ie}` : "#fff", void 0, {
			x: v,
			y,
			w: b,
			h: x
		}, V, re, B, p, Gn(j?.labelBox, n.labelBox), C);
	}
	is(e, D, v, y, b, x);
}
function ts(e, t, n, r, i, a) {
	let o = Math.max(Math.abs(n - e) - i, 0), s = Math.max(Math.abs(r - t) - a, 0);
	return Math.hypot(o, s);
}
function ns(e, t, n, r, i) {
	let a = Math.cos(e), o = Math.sin(e), s = t + i, c = 0, l = s + Math.hypot(n, r);
	for (let e = 0; e < 32; e++) {
		let e = (c + l) / 2;
		ts(0, 0, a * e, o * e, n, r) >= s ? l = e : c = e;
	}
	return l;
}
function rs(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m = {}, h = 1) {
	let g = M(a, o, m.textRotation, m.textVerticalMode), _ = Je(m, h), v = a + _.left + _.right, y = o + _.top + _.bottom, b = M(v, y, m.textRotation, m.textVerticalMode);
	a = b.w, o = b.h;
	let x = ns(t, i, g.w / 2, g.h / 2, c * .5), S = n + Math.cos(t) * x, C = r + Math.sin(t) * x;
	return {
		lines: e,
		rich: f,
		legendKey: p,
		boxW: a,
		boxH: o,
		unrotatedW: v,
		unrotatedH: y,
		textStyle: m,
		ptToPx: h,
		lineHeight: s,
		fontPx: c,
		bold: l,
		fontColor: u,
		font: d,
		cxBox: S,
		cyBox: C
	};
}
function is(e, t, n, r, i, a) {
	if (t.length !== 0) {
		e.save(), e.beginPath(), e.rect(n, r, i, a), e.clip();
		for (let n of t) {
			let t = Je(n.textStyle, n.ptToPx), r = M(n.unrotatedW, n.unrotatedH, n.textStyle.textRotation, n.textStyle.textVerticalMode), i = n.cxBox + (t.left - t.right) / 2, a = n.cyBox + (t.top - t.bottom) / 2, o = Math.max(0, n.unrotatedW - t.left - t.right), s = u(n.textStyle, "center"), c = s === "left" ? n.cxBox - n.unrotatedW / 2 + t.left : s === "right" ? n.cxBox + n.unrotatedW / 2 - t.right : i;
			if (e.save(), r.radians !== 0 && (e.translate(n.cxBox, n.cyBox), e.rotate(r.radians), e.translate(-n.cxBox, -n.cyBox)), !n.legendKey) {
				if (n.rich) {
					Ar(e, n.rich, c, a, s, "middle", o), e.restore();
					continue;
				}
				e.font = `${n.textStyle.fontItalic ? "italic " : ""}${n.bold ? "bold " : ""}${n.fontPx}px ${n.font}`, e.fillStyle = n.fontColor, e.textAlign = s, e.textBaseline = "middle";
				let t = (n.textStyle.fontBaseline ?? 0) * n.fontPx, r = a - (n.lines.length - 1) * n.lineHeight / 2 - t;
				if (!(n.textStyle.fontPaintAuthored === !0 && (n.textStyle.fontHidden === !0 || n.textStyle.fontColor == null))) for (let t = 0; t < n.lines.length; t++) e.fillText(n.lines[t], c, r + t * n.lineHeight);
				e.restore();
				continue;
			}
			e.font = `${n.textStyle.fontItalic ? "italic " : ""}${n.bold ? "bold " : ""}${n.fontPx}px ${n.font}`;
			let l = n.legendKey ? ja([n.legendKey.entry], n.fontPx, n.legendKey.ptToPx)[0] ?? 0 : 0, d = n.legendKey ? Na(n.legendKey.entry, n.fontPx, n.legendKey.ptToPx) : 0, f = n.rich?.width ?? n.lines.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), p = n.legendKey && (n.rich || n.lines.length > 0) ? 4 : 0, m = i - (l + p + f) / 2;
			if (n.legendKey && va(e, n.legendKey.entry.swatchStyle, n.legendKey.entry.color, m, a - d / 2, l, d, n.legendKey.entry.marker, n.legendKey.entry.fillPaint, n.legendKey.entry.outlinePaint, n.legendKey.entry.outlineColor, n.legendKey.entry.outlineWidthEmu, n.legendKey.entry.outlineDash, n.legendKey.entry.outlineCustomDash, n.legendKey.entry.outlineCap, n.legendKey.entry.outlineJoin, n.legendKey.ptToPx, n.legendKey.shapeRotationDeg, n.legendKey.entry.directEffect, n.legendKey.entry.fallbackEffect, n.legendKey.entry.directEffectIndex, n.legendKey.entry.fallbackEffectIndex), n.rich) {
				Ar(e, n.rich, m + l + p, a, "left", "middle"), e.restore();
				continue;
			}
			e.fillStyle = n.fontColor, e.textAlign = "left", e.textBaseline = "middle";
			let h = (n.textStyle.fontBaseline ?? 0) * n.fontPx, g = a - (n.lines.length - 1) * n.lineHeight / 2 - h;
			if (!(n.textStyle.fontPaintAuthored === !0 && (n.textStyle.fontHidden === !0 || n.textStyle.fontColor == null))) for (let t = 0; t < n.lines.length; t++) e.fillText(n.lines[t], m + l + p, g + t * n.lineHeight);
			e.restore();
		}
		e.restore();
	}
}
function as(e, t, n, r, i, a, o, s, c, l, d, f, p, m, h, g, _, v, y, b, x, S, C, w, T, E) {
	let D = Sa(t, m), O = (e) => w.get(e), k = en(n.fontSizeHpt, m) ?? Math.max(9, l * .09), A = n.labelBox, j = [], ee = f;
	for (let u = 0; u < a.length; u++) {
		let f = a[u] / o * Math.PI * 2, w = ee + f / 2;
		if (ee += f, f <= 0 || !C.has(u)) continue;
		let E = O(u);
		if (F(n, E)) continue;
		let te = E?.showCatName ?? n.showCatName, N = E?.showSerName ?? n.showSerName, P = E?.showVal ?? n.showVal, ne = E?.showPercent ?? n.showPercent, re = E?.showLegendKey ?? n.showLegendKey ?? !1, I = en(E?.fontSizeHpt, m) ?? k, L = E?.fontBold ?? n.fontBold ?? !1, R = E?.fontFace ?? n.fontFace ? yt(t, E?.fontFace ?? n.fontFace, "minor") : p, z = E?.fontColor ? `#${E.fontColor}` : n.fontColor ? `#${n.fontColor}` : "#000", ie = Gn(E?.labelBox, A), ae = E?.position ?? n.position ?? "bestFit", B = vt({
			customText: E?.text,
			showCategory: te,
			showSeries: N,
			showValue: P,
			showPercent: ne,
			category: (i[u] ?? "").toString(),
			seriesName: r.name,
			sourceValue: a[u],
			percentRatio: a[u] / o,
			formatCode: E?.formatCode ?? n.formatCode ?? r.valFormatCode ?? null,
			percentFormatCode: E?.formatCode ?? n.formatCode ?? "0%",
			date1904: t.date1904 ?? !1,
			separator: E?.separator ?? n.separator,
			defaultSeparator: "\n"
		}), V = re ? D(0, u) : void 0;
		if (!B && !V) continue;
		let oe = Ge(E, n), se = ro(t, E, m, R, L, oe), ce = oe.textBodyAuthored === !0 || oe.textLInsEmu != null || oe.textTInsEmu != null || oe.textRInsEmu != null || oe.textBInsEmu != null, le = Je(oe, m), H = ce ? le.left : Math.max(4, I * .45), ue = ce ? le.right : Math.max(4, I * .45), de = ce ? le.top : Math.max(2, I * .28), fe = ce ? le.bottom : Math.max(2, I * .28), pe = I * .22, me = I + pe;
		e.font = `${oe.fontItalic ? "italic " : ""}${L ? "bold " : ""}${I}px ${R}`;
		let he = se ? jr(e, se, I, z) : null;
		if (se && !he) continue;
		let ge = he ? [] : Ze(B, Math.max(0, g - H - ue), Math.max(0, v - de - fe), me, (t) => e.measureText(t).width, oe);
		if (!he && ge.length === 0 && !V) continue;
		let _e = he?.width ?? 0;
		if (!he) for (let t of ge) _e = Math.max(_e, e.measureText(t).width);
		let ve = V ? ja([V.entry], I, m)[0] ?? 0 : 0, ye = V ? Na(V.entry, I, m) : 0, U = V && B ? 4 : 0, be = ve + U + _e + H + ue, xe = Math.max(ye, he?.height ?? (ge.length > 0 ? ge.length * me - pe : 0)) + de + fe, Se = M(be, xe, oe.textRotation, oe.textVerticalMode), Ce = Math.min(Se.w, g), W = Math.max(ye, he?.height ?? (ge.length > 0 ? ge.length * me - pe : 0));
		W = Math.min(Se.h, v);
		let we = s + Math.cos(w) * l, Te = c + Math.sin(w) * l, Ee = Math.cos(w) < 0, De = Math.max(Ce, W) * .55 + l * .06, Oe = we + Math.cos(w) * De, ke = Te + Math.sin(w) * De, Ae, je = !1;
		if (E?.manualLayout) {
			let t = J({
				kind: "point",
				x: Oe,
				y: ke,
				position: "ctr"
			}, {
				x: h,
				y: _,
				w: g,
				h: v
			}, {
				w: Ce,
				h: W
			}, I, E.manualLayout, {
				x: y,
				y: b,
				w: x,
				h: S
			});
			if (!t || (Ce = t.rect.w, W = t.rect.h, be = Ce, xe = W, !he && (ge = Ze(B, Math.max(0, Ce - H - ue - ve - U), Math.max(0, W - de - fe), me, (t) => e.measureText(t).width, oe), ge.length === 0 && !V))) continue;
			Oe = t.rect.x + t.rect.w / 2, ke = t.rect.y + t.rect.h / 2, Ee = Oe < s, Ae = t.clip;
		} else if (ae !== "bestFit" && ae !== "outEnd") {
			let t = Zo(ae, d, l) + (ae === "ctr" ? T[u] ?? 0 : 0), n = s + Math.cos(w) * t, r = c + Math.sin(w) * t, i = 2 * t * Math.sin(Math.min(Math.PI, Math.abs(f)) / 2) - I, a = d > .01 ? l - d - I : l - I, o = ae === "ctr" ? {
				x: h,
				y: _,
				w: g,
				h: v
			} : ss({
				x: n - i / 2,
				y: r - a / 2,
				w: i,
				h: a
			}, {
				x: h,
				y: _,
				w: g,
				h: v
			});
			if (!o) continue;
			if (he) Ce = Math.min(Ce, o.w), W = Math.min(W, o.h);
			else {
				if (ge = Ze(B, Math.max(0, o.w - H - ue - ve - U), Math.max(0, o.h - de - fe), me, (t) => e.measureText(t).width, oe), ge.length === 0 && !V) continue;
				_e = ge.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), be = ve + U + _e + H + ue, xe = Math.max(ye, ge.length > 0 ? ge.length * me - pe : 0) + de + fe, Se = M(be, xe, oe.textRotation, oe.textVerticalMode), Ce = Se.w, W = Se.h;
			}
			let p = J({
				kind: "point",
				x: n,
				y: r,
				position: ae === "inBase" || ae === "inEnd" ? "ctr" : ae
			}, o, {
				w: Ce,
				h: W
			}, I);
			if (!p) continue;
			Oe = p.textAlign === "left" ? p.x + Ce / 2 : p.textAlign === "right" ? p.x - Ce / 2 : p.x, ke = p.textBaseline === "top" ? p.y + W / 2 : p.textBaseline === "bottom" ? p.y - W / 2 : p.y, Ee = Oe < s, Ae = p.clip, je = !0;
		}
		j.push({
			lines: ge,
			rich: he ?? void 0,
			legendKey: V,
			lineHeight: me,
			midAngle: w,
			rimX: we,
			rimY: Te,
			boxW: Ce,
			boxH: W,
			unrotatedW: be,
			unrotatedH: xe,
			cxBox: Oe,
			cyBox: ke,
			leftSide: Ee,
			fontColor: z,
			box: ie,
			fontPx: I,
			bold: L,
			font: R,
			textStyle: oe,
			ptToPx: m,
			inside: je,
			manualClip: Ae
		});
	}
	let te = _ + 2, N = _ + v - 2, P = N - te, ne = (e) => {
		if (e.length === 0) return;
		e.sort((e, t) => e.cyBox - t.cyBox);
		let t = 0;
		for (let n of e) t += n.boxH;
		if (t += (e.length - 1) * 3, t > P) {
			let t = e.reduce((e, t) => e + t.boxH, 0), n = e.length;
			if (n === 1) {
				e[0].cyBox = Math.min(Math.max(e[0].cyBox, te + e[0].boxH / 2), N - e[0].boxH / 2);
				return;
			}
			let r = (P - t) / (n - 1), i = te;
			for (let t of e) t.cyBox = i + t.boxH / 2, i += t.boxH + r;
			return;
		}
		for (let t = 1; t < e.length; t++) {
			let n = e[t - 1], r = e[t], i = (n.boxH + r.boxH) / 2 + 3;
			r.cyBox - n.cyBox < i && (r.cyBox = n.cyBox + i);
		}
		let n = e[e.length - 1].cyBox + e[e.length - 1].boxH / 2 - N;
		if (n > 0) for (let t of e) t.cyBox -= n;
		let r = te - (e[0].cyBox - e[0].boxH / 2);
		if (r > 0) for (let t of e) t.cyBox += r;
	};
	ne(j.filter((e) => !e.manualClip && !e.leftSide)), ne(j.filter((e) => !e.manualClip && e.leftSide));
	for (let e of j) e.manualClip || (e.cyBox = Math.max(te + e.boxH / 2, e.cyBox), e.cyBox = Math.min(N - e.boxH / 2, e.cyBox));
	let re = h + 2, I = h + g - 2;
	for (let e of j) {
		if (e.manualClip) continue;
		let t = e.boxW / 2;
		e.cxBox - t < re && (e.cxBox = re + t), e.cxBox + t > I && (e.cxBox = I - t);
	}
	e.save(), e.beginPath(), e.rect(h, _, g, v), e.clip();
	let L = xn(t, n), R = L.color ? `#${L.color}` : "#a6a6a6", z = L.widthEmu ? Math.max(.5, L.widthEmu / W * m) : 1;
	e.setLineDash(He(L.dash ?? void 0, z));
	for (let t of j) {
		let r = t.cxBox + (t.leftSide ? t.boxW / 2 : -t.boxW / 2), i = t.cyBox, a = r - t.rimX, o = i - t.rimY, s = Math.hypot(a, o);
		!t.inside && n.showLeaderLines && L.hidden !== !0 && (L.paintAuthored !== !0 || L.color != null) && s > t.fontPx * .9 && (e.beginPath(), e.moveTo(t.rimX, t.rimY), e.lineTo(r, i), e.strokeStyle = R, e.lineWidth = z, e.stroke());
	}
	for (let t of j) {
		t.manualClip && (e.save(), e.beginPath(), e.rect(t.manualClip.x, t.manualClip.y, t.manualClip.w, t.manualClip.h), e.clip());
		let n = t.cxBox - t.boxW / 2, r = t.cyBox - t.boxH / 2;
		ar(e, t.box, {
			x: n,
			y: r,
			w: t.boxW,
			h: t.boxH
		}, m, E);
		let i = t.textStyle.textBodyAuthored === !0 || t.textStyle.textLInsEmu != null || t.textStyle.textTInsEmu != null || t.textStyle.textRInsEmu != null || t.textStyle.textBInsEmu != null, a = Je(t.textStyle, t.ptToPx), o = i ? a.left : Math.max(4, t.fontPx * .45), s = i ? a.right : Math.max(4, t.fontPx * .45), c = i ? a.top : Math.max(2, t.fontPx * .28), l = i ? a.bottom : Math.max(2, t.fontPx * .28), d = M(t.unrotatedW, t.unrotatedH, t.textStyle.textRotation, t.textStyle.textVerticalMode), f = t.cxBox + (o - s) / 2, p = t.cyBox + (c - l) / 2, h = n + o, g = n + t.boxW - s, _ = Math.max(0, g - h), v = u(t.textStyle, "center"), y = v === "left" ? h : v === "right" ? g : f, b = (e) => (t.textStyle.textVerticalAnchor ?? (t.textStyle.textBodyAuthored === !0 ? "t" : "ctr")) === "t" ? r + c + e / 2 : (t.textStyle.textVerticalAnchor ?? (t.textStyle.textBodyAuthored === !0 ? "t" : "ctr")) === "b" ? r + t.boxH - l - e / 2 : p, x = (e) => v === "left" ? h : v === "right" ? g - e : f - e / 2;
		if (e.save(), e.beginPath(), e.rect(n, r, t.boxW, t.boxH), e.clip(), d.radians !== 0 && (e.translate(t.cxBox, t.cyBox), e.rotate(d.radians), e.translate(-t.cxBox, -t.cyBox)), !t.legendKey) {
			let n = b(t.rich?.height ?? Math.max(0, t.lines.length * t.lineHeight - (t.lineHeight - t.fontPx)));
			if (t.rich) {
				Ar(e, t.rich, y, n, v, "middle", _), e.restore(), t.manualClip && e.restore();
				continue;
			}
			e.font = `${t.textStyle.fontItalic ? "italic " : ""}${t.bold ? "bold " : ""}${t.fontPx}px ${t.font}`, e.fillStyle = t.fontColor, e.textAlign = v, e.textBaseline = "middle";
			let r = t.lineHeight - t.fontPx, i = (t.textStyle.fontBaseline ?? 0) * t.fontPx, a = n - (t.lines.length * t.lineHeight - r) / 2 + t.fontPx / 2 - i;
			if (!(t.textStyle.fontPaintAuthored === !0 && (t.textStyle.fontHidden === !0 || t.textStyle.fontColor == null))) for (let n = 0; n < t.lines.length; n++) e.fillText(t.lines[n], y, a + n * t.lineHeight);
			e.restore(), t.manualClip && e.restore();
			continue;
		}
		let S = t.legendKey ? ja([t.legendKey.entry], t.fontPx, t.legendKey.ptToPx)[0] ?? 0 : 0, C = t.legendKey ? Na(t.legendKey.entry, t.fontPx, t.legendKey.ptToPx) : 0, w = t.legendKey && (t.rich || t.lines.length > 0) ? 4 : 0, T = t.rich?.width ?? t.lines.reduce((t, n) => Math.max(t, e.measureText(n).width), 0), D = S + w + T, O = b(Math.max(C, t.rich?.height ?? Math.max(0, t.lines.length * t.lineHeight - (t.lineHeight - t.fontPx)))), k = x(D);
		if (t.legendKey && va(e, t.legendKey.entry.swatchStyle, t.legendKey.entry.color, k, O - C / 2, S, C, t.legendKey.entry.marker, t.legendKey.entry.fillPaint, t.legendKey.entry.outlinePaint, t.legendKey.entry.outlineColor, t.legendKey.entry.outlineWidthEmu, t.legendKey.entry.outlineDash, t.legendKey.entry.outlineCustomDash, t.legendKey.entry.outlineCap, t.legendKey.entry.outlineJoin, t.legendKey.ptToPx, t.legendKey.shapeRotationDeg, t.legendKey.entry.directEffect, t.legendKey.entry.fallbackEffect, t.legendKey.entry.directEffectIndex, t.legendKey.entry.fallbackEffectIndex), t.rich) {
			Ar(e, t.rich, k + S + w, O, "left", "middle", T), e.restore(), t.manualClip && e.restore();
			continue;
		}
		e.font = `${t.textStyle.fontItalic ? "italic " : ""}${t.bold ? "bold " : ""}${t.fontPx}px ${t.font}`, e.fillStyle = t.fontColor, e.textAlign = "left", e.textBaseline = "middle";
		let A = t.lineHeight - t.fontPx, j = (t.textStyle.fontBaseline ?? 0) * t.fontPx, ee = O - (t.lines.length * t.lineHeight - A) / 2 + t.fontPx / 2 - j;
		if (!(t.textStyle.fontPaintAuthored === !0 && (t.textStyle.fontHidden === !0 || t.textStyle.fontColor == null))) for (let n = 0; n < t.lines.length; n++) e.fillText(t.lines[n], k + S + w, ee + n * t.lineHeight);
		e.restore(), t.manualClip && e.restore();
	}
	e.restore();
}
function os(e, n, r, i, a, o, s, c, l) {
	let u = i?.chartexStyle, d = On(n, r), f = t(n, "dataPoint", d >= 0 ? d : a), p = r.chartexStyle, m = Qe(u, i?.idx ?? a) !== void 0 || i?.lineHidden === !0 || i?.lineColor != null, h = Qe(p, a) !== void 0 || r.lineHidden === !0 || r.lineColor != null, g = Qe(f, a) !== void 0;
	!m && !h && !g || (e.save(), R(e, n, "dataPoint", r, i, a, o, Math.max(.5, s * .75), s, c, l, !1) && e.stroke(), e.restore());
}
function ss(e, t) {
	let n = Math.max(e.x, t.x), r = Math.max(e.y, t.y), i = Math.min(e.x + e.w, t.x + t.w), a = Math.min(e.y + e.h, t.y + t.h);
	return i > n && a > r ? {
		x: n,
		y: r,
		w: i - n,
		h: a - r
	} : null;
}
function cs(n, r, i, a, o = 0) {
	let { x: s, y: c, w: l, h: u } = i, d = Xt(r), p = d.length;
	if (p < 3) return;
	let m = Fa(n, r, l, u, a), h = Tt(r, s, c, l, u, a, {
		titleTopPadFrac: .035,
		titleBottomPadFrac: .035,
		legendReserve: m,
		radialGapFrac: .02,
		honorPlotAreaManualLayout: !0
	}), g = h.title.fontPx;
	jo(n, r, s, c, l, u, c + h.title.topPad, g);
	let { px0: _, py0: v, pw: b, ph: x } = h.plotRect;
	if (!(b > 0) || !(x > 0)) return;
	In(n, r, _, v, b, x, a, o);
	let S = h.center.cx, C = h.center.cy, w = r.plotAreaManualLayout, E = w?.layoutTarget === "inner" && w.w != null && w.h != null && Number.isFinite(w.w) && Number.isFinite(w.h) && h.plotAreaManualLayoutApplied ? Math.min(b, x) / 2 : Math.min(b, x) * .38, O = Infinity, k = -Infinity;
	for (let e of r.series) for (let t of e.values) t != null && (O = Math.min(O, t), k = Math.max(k, t));
	isFinite(O) || (O = 0, k = 1), k === 0 && (k = 1);
	let A = r.valAxisMinorTickMark != null && r.valAxisMinorTickMark !== "none", ee = r.valAxisLogBase != null && Number.isFinite(r.valAxisLogBase) && r.valAxisLogBase >= 2, M = r.valAxisMajorUnit ?? (ee ? null : D(r.valMin ?? O, r.valMax ?? k, E / a)), te = ve({
		dataMin: O,
		dataMax: k,
		explicitMin: r.valMin,
		explicitMax: r.valMax,
		axisLenPt: E / a,
		axisOrientation: "vertical",
		majorUnit: M,
		minorUnit: r.valAxisMinorUnit,
		needMinor: r.valAxisMinorGridlines === !0 || A,
		logBase: r.valAxisLogBase,
		reversed: ht(r)
	}), N = (e) => y(te.fraction(e), 0, 1), P = -Math.PI / 2, F = (e) => P + e / p * Math.PI * 2, ne = te.majorTicks.filter((e) => N(e) > 0), re = (e) => {
		let t = N(e) * E;
		n.beginPath();
		for (let e = 0; e < p; e++) {
			let r = F(e), i = S + Math.cos(r) * t, a = C + Math.sin(r) * t;
			e === 0 ? n.moveTo(i, a) : n.lineTo(i, a);
		}
		n.closePath(), n.stroke();
	};
	if (r.valAxisMinorGridlines) {
		let e = Fn(r, a);
		n.strokeStyle = e.color, n.lineWidth = e.width;
		let t = e.dash.length > 0 && n.getLineDash ? n.getLineDash() : [];
		e.dash.length > 0 && n.setLineDash(e.dash);
		for (let e of te.minorTicks) re(e);
		e.dash.length > 0 && n.setLineDash(t);
	}
	if (!r.valAxisHidden && e(r)) {
		let e = vn(r, a);
		n.strokeStyle = e.color, n.lineWidth = e.width;
		let t = e.dash.length > 0 && n.getLineDash ? n.getLineDash() : [];
		e.dash.length > 0 && n.setLineDash(e.dash);
		for (let e of ne) re(e);
		e.dash.length > 0 && n.setLineDash(t);
	}
	n.strokeStyle = "#bbb", n.lineWidth = .5;
	for (let e = 0; e < p; e++) {
		let t = F(e);
		n.beginPath(), n.moveTo(S, C), n.lineTo(S + Math.cos(t) * E, C + Math.sin(t) * E), n.stroke();
	}
	if (!r.valAxisHidden) {
		let e = Ae(r.valAxisFontSizeHpt, u, a);
		n.font = or(e, yt(r, r.valAxisFontFace, "minor"), r.valAxisFontBold ?? !1, r.valAxisFontItalic ?? !1), n.fillStyle = r.valAxisFontColor ? `#${r.valAxisFontColor}` : "#555", n.textAlign = "right", n.textBaseline = "middle";
		for (let t of ne) {
			let i = C - N(t) * E, o = st(r.valAxisLineColor, r.valAxisLineWidthEmu, a);
			z(n, r.valAxisMajorTickMark, "val", S, i, o.color, o.width, !1, r.valAxisLineHidden, "major", a, r.valAxisLineDash), r.valAxisTickLabelPos !== "none" && gt(n, Rn(r, t, !1), S - 3, i, rr(e));
		}
		if (A) {
			let e = st(r.valAxisLineColor, r.valAxisLineWidthEmu, a);
			for (let t of te.minorTicks) z(n, r.valAxisMinorTickMark, "val", S, C - N(t) * E, e.color, e.width, !1, r.valAxisLineHidden, "minor", a, r.valAxisLineDash);
		}
	}
	let I = r.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, E * .2)) : Ae(r.catAxisFontSizeHpt, u, a);
	n.font = or(I, yt(r, r.catAxisFontFace, "minor"), r.catAxisFontBold ?? !1, r.catAxisFontItalic ?? !1), n.fillStyle = r.catAxisFontColor ? `#${r.catAxisFontColor}` : "#444", n.textBaseline = "middle";
	let L = S - b / 2, ie = S + b / 2;
	if (!r.catAxisHidden && j(r)) for (let e = 0; e < p; e++) {
		let t = F(e), i = T(12, r.catAxisLabelOffsetPercent), a = S + Math.cos(t) * (E + i), o = C + Math.sin(t) * (E + i), s = r.catAxisLabelAlignment, c = s === "l" ? "left" : s === "r" ? "right" : s === "ctr" ? "center" : Math.cos(t) < -.1 ? "right" : Math.cos(t) > .1 ? "left" : "center";
		n.textAlign = c;
		let l = c === "right" ? a - L : c === "left" ? ie - a : 2 * Math.min(ie - a, a - L);
		gt(n, er((d[e] ?? "").toString(), r.catAxisFormatCode, r.date1904), a, o, rr(I), l);
	}
	let ae = G("radar", r.chartType, r.scatterStyle, r.radarStyle), B = Math.max(2, E * .025);
	for (let e = 0; e < r.series.length; e++) {
		let i = r.series[e], s = de(e, i), c = Fe(i, e), l = [];
		for (let e = 0; e < p; e++) {
			let t = i.values[e];
			if (t == null) {
				l.push(null);
				continue;
			}
			let n = N(t), r = F(e);
			l.push([S + Math.cos(r) * E * n, C + Math.sin(r) * E * n]);
		}
		let u = l.every((e) => e != null), d = [], m = [];
		for (let e = 0; e < l.length; e++) {
			let t = l[e];
			t == null ? (m.length > 0 && d.push(m), m = []) : m.push({
				x: t[0],
				y: t[1],
				index: e
			});
		}
		m.length > 0 && d.push(m);
		let h = {
			x: _,
			y: v,
			w: b,
			h: x
		}, g = (e) => {
			let t = e.getLineDash ? e.getLineDash() : [], n = e.lineCap, d = e.lineJoin;
			e.beginPath();
			let f = !1;
			for (let t of l) {
				if (t == null) {
					f = !1;
					continue;
				}
				f ? e.lineTo(t[0], t[1]) : (e.moveTo(t[0], t[1]), f = !0);
			}
			u && e.closePath(), ae && u && zi(e, le(r, i, void 0, c), h, mt(s, .25), a, o), R(e, r, "dataPointLine", i, void 0, c, s, 2, a, h, o) && e.stroke(), e.setLineDash(t), e.lineCap = n, e.lineJoin = d;
		};
		if (Wt(r, e)) {
			if (ae && u) {
				let c = cr(i.dataPointOverrides).get(0);
				Ne(n, ue(c?.chartexStyle, i.chartexStyle), t(r, "dataPoint", e), 0, h, a, (e) => {
					let t = le(r, i, c, 0, 0);
					if (t !== null) {
						e.beginPath();
						for (let t = 0; t < l.length; t++) {
							let n = l[t];
							t === 0 ? e.moveTo(n[0], n[1]) : e.lineTo(n[0], n[1]);
						}
						e.closePath(), zi(e, t, h, mt(s, .25), a, o);
					}
				}, 0);
			}
			f(n, r, i, d, !1, u, s, 2, a, h, o);
		} else Ne(n, ue(i.chartexStyle), r.chartStyleRoles?.[ae ? "dataPoint" : "dataPointLine"], c, h, a, g);
		let y = !ae && i.showMarker !== !1 && i.markerSymbol !== "none";
		if (!ae && (y || _t(i))) {
			let e = cr(i.dataPointOverrides);
			for (let t = 0; t < l.length; t++) {
				let c = l[t];
				if (c == null) continue;
				let u = e.get(t), d = ir(i, u, "circle", y);
				if (d === "none") continue;
				let f = u?.markerSize ?? i.markerSize ?? Math.max(4, B * 2 / a), p = $n(i, u, t, s), m = u?.markerLine ?? i.markerLine ?? null, h = u?.markerLineWidthEmu ?? i.markerLineWidthEmu;
				ra(n, r, i, u, t, c[0], c[1], d, f, p, m, a, h == null ? 1 : it(h, a), Le(i, u, t), o);
			}
		}
	}
	Ra(n, r, m, s, c, l, u, _, v, b, x, h.title.bandH + 2, a);
}
function ls(t, n, r, i, a = 0) {
	let { x: o, y: s, w: l, h: u } = r, d = n.series.map((e, t) => ({
		series: e,
		index: t
	})), f = Nt(n), p = ({ series: e, index: t }) => f[t]?.categoryAxis === "secondary" || n.plotGroups == null && e.useSecondaryAxis === !0, m = ({ series: e, index: t }) => f[t]?.valueAxis === "secondary" || n.plotGroups == null && e.useSecondaryAxis === !0, h = d.filter((e) => !p(e)), g = d.filter(p), _ = d.filter((e) => !m(e)), v = d.filter(m), b = d.filter((e) => !p(e) && !m(e)), x = d.filter((e) => p(e) && m(e)), S = g.length > 0 ? n.secondaryCatAxis : null, C = v.length > 0 ? n.secondaryValAxis : null, w = ((e) => {
		let t = [];
		for (let { series: r } of e) {
			let e = r.categories ?? n.categories;
			for (let n of e) {
				let e = parseFloat(n);
				Number.isFinite(e) && t.push(e);
			}
		}
		return t;
	})(d).length === 0, T = d.length === 1 && d[0].series.bubbleXSourceIsString === !0 ? d[0].series.values.length + 1 : null, E = (e) => {
		if (n.plotGroups == null) {
			let e = n.chartType === "bubble";
			return {
				isBubble: e,
				style: e ? "marker" : n.scatterStyle ?? "marker"
			};
		}
		let t = f[e], r = t?.kind === "bubble";
		return {
			isBubble: r,
			style: r ? "marker" : t?.scatterStyle ?? n.scatterStyle ?? "marker"
		};
	}, D = (e, t, r) => {
		let i = [], a = [];
		for (let { series: o, index: s } of e) {
			let e = o.categories ?? n.categories, { style: c, isBubble: l } = E(s), u = _o(n, o, s, e, w, c, l, t, r);
			u?.x && i.push(...u.x), u?.y && a.push(...u.y);
			for (let t = 0; t < o.values.length; t++) {
				let n = o.values[t];
				if (n == null) continue;
				let r = Xa(e, t, w);
				r != null && (i.push(r), a.push(n));
			}
			O(o, "x", (t) => o.values[t] == null ? null : Xa(e, t, w), (e) => i.push(e)), O(o, "y", (t) => Xa(e, t, w) == null ? null : o.values[t] ?? null, (e) => a.push(e));
		}
		if (w && i.length === 0) {
			let t = 0;
			for (let { series: n } of e) t = Math.max(t, n.values.length);
			for (let e = 0; e < t; e++) i.push(e);
		}
		return {
			x: Se(i),
			y: Se(a)
		};
	}, k = {
		x: D(h.length > 0 ? h : g, n.catAxisLogBase, n.valAxisLogBase).x,
		y: D(_.length > 0 ? _ : v, n.catAxisLogBase, n.valAxisLogBase).y
	}, A = {
		x: D(g, S?.logBase, C?.logBase).x,
		y: D(v, S?.logBase, C?.logBase).y
	}, j = ko(t, n, l, u, i), ee = j.fontPx, M = j.topPad, te = Ae(n.catAxisFontSizeHpt, u, i), P = Ae(n.valAxisFontSizeHpt, u, i), F = Fa(t, n, l, u, i), { legRightW: ne, legLeftW: re, legTopH: I, legBottomH: L } = hn(F, n.legendOverlay === !0), R = ft(n, l, u, i), ie = R.catFontPx, ae = R.valFontPx, V = R.catBandH, oe = R.valBandW;
	jo(t, n, o, s, l, u, s + M, ee);
	let se = C ? ve({
		dataMin: A.y.min,
		dataMax: A.y.max,
		explicitMin: C.min,
		explicitMax: C.max,
		axisLenPt: Math.max(1, u * .7 / i),
		axisOrientation: "vertical",
		majorUnit: C.majorUnit,
		minorUnit: C.minorUnit,
		needMinor: C.minorGridlines === !0 || C.minorTickMark != null && C.minorTickMark !== "none",
		logBase: C.logBase,
		reversed: C.orientation === "maxMin"
	}) : null, ce = 0;
	if (C && se && !C.hidden && C.tickLabelPos !== "none") {
		let e = t.font;
		t.font = or(en(C.fontSizeHpt, i) ?? P, yt(n, C.fontFace, "minor"), C.fontBold ?? !1, C.fontItalic ?? !1);
		for (let e of se.majorTicks) ce = Math.max(ce, Ie(t, jt(e, C.formatCode, n.date1904, C.displayUnits)));
		ce += Rt(P) + 4, t.font = e;
	}
	let le = S && !S.hidden && S.tickLabelPos !== "none" ? (en(S.fontSizeHpt, i) ?? te) + Ht(te) + 2 : 0, H = (e, t, n, r, a, o, s, c) => ve({
		dataMin: t ?? e.min,
		dataMax: n ?? e.max,
		explicitMin: t,
		explicitMax: n,
		axisLenPt: Math.max(1, r * .7 / i),
		axisOrientation: a,
		majorUnit: o,
		minorUnit: null,
		needMinor: !1,
		logBase: s,
		reversed: c
	}).majorTicks, ue = n.valAxisHidden || n.valAxisTickLabelPos === "none" ? 0 : Ft(H(k.y, n.valMin, n.valMax, u, "vertical", n.valAxisMajorUnit, n.valAxisLogBase, ht(n)).map((e) => Rn(n, e, !1)), rr(P)), de = C && se && !C.hidden && C.tickLabelPos !== "none" ? Ft(se.majorTicks.map((e) => jt(e, C.formatCode, n.date1904, C.displayUnits)), rr(en(C.fontSizeHpt, i) ?? P)) : 0, fe = n.catAxisHidden || n.catAxisTickLabelPos === "none" ? 0 : Ft(H(k.x, n.catAxisMin ?? (T == null ? null : 0), n.catAxisMax ?? T, l, "horizontal", n.catAxisMajorUnit, n.catAxisLogBase, Ke(n)).map((e) => jt(e, n.catAxisFormatCode, n.date1904, n.catAxisDisplayUnits)), rr(te)), pe = S && !S.hidden && S.tickLabelPos !== "none" ? Ft(H(A.x, S.min, S.max, l, "horizontal", S.majorUnit, S.logBase, S.orientation === "maxMin").map((e) => jt(e, S.formatCode, n.date1904, S.displayUnits)), rr(en(S.fontSizeHpt, i) ?? te)) : 0, me = n.catAxisTickLabelPos === "high", ge = Math.max(Math.max(ue, de) / 2, pe) + (me ? fe : 0), _e = me ? 0 : fe, { plotRect: { px0: ye, py0: U, pw: be, ph: xe } } = Tt(n, o, s, l, u, i, {
		titleBand: j,
		legendReserve: F,
		pad: {
			t: j.bandH + I + P / 2 + 2 + le + ge,
			r: ne + l * .05 + ce,
			b: (n.catAxisHidden ? u * .04 : Dn(te) + _e) + V + L,
			l: (n.valAxisHidden ? l * .04 : l * .12) + oe + re
		},
		honorPlotAreaManualLayout: !0
	});
	if (be <= 0 || xe <= 0) return;
	In(t, n, ye, U, be, xe, i, a);
	let { min: Ce, max: W } = k.x, { min: we, max: Te } = k.y;
	n.valMin != null && (we = n.valMin), n.valMax != null && (Te = n.valMax);
	let Ee = n.valAxisMinorGridlines === !0 || n.valAxisMinorTickMark != null && n.valAxisMinorTickMark !== "none", De = ve({
		dataMin: we,
		dataMax: Te,
		explicitMin: n.valMin,
		explicitMax: n.valMax,
		axisLenPt: xe / i,
		axisOrientation: "vertical",
		majorUnit: n.valAxisMajorUnit,
		minorUnit: n.valAxisMinorUnit,
		needMinor: Ee,
		logBase: n.valAxisLogBase,
		reversed: ht(n)
	});
	we = De.min, Te = De.max;
	let Oe = n.catAxisMinorGridlines === !0 || n.catAxisMinorTickMark != null && n.catAxisMinorTickMark !== "none", ke = ve({
		dataMin: Ce,
		dataMax: W,
		explicitMin: n.catAxisMin ?? (T == null ? null : 0),
		explicitMax: n.catAxisMax ?? T,
		axisLenPt: be / i,
		axisOrientation: "horizontal",
		majorUnit: n.catAxisMajorUnit,
		minorUnit: n.catAxisMinorUnit,
		needMinor: Oe,
		logBase: n.catAxisLogBase,
		reversed: Ke(n)
	});
	Ce = ke.min, W = ke.max;
	let je = S ? ve({
		dataMin: A.x.min,
		dataMax: A.x.max,
		explicitMin: S.min,
		explicitMax: S.max,
		axisLenPt: be / i,
		axisOrientation: "horizontal",
		majorUnit: S.majorUnit,
		minorUnit: S.minorUnit,
		needMinor: S.minorGridlines === !0 || S.minorTickMark != null && S.minorTickMark !== "none",
		logBase: S.logBase,
		reversed: S.orientation === "maxMin"
	}) : null, Me = C ? ve({
		dataMin: A.y.min,
		dataMax: A.y.max,
		explicitMin: C.min,
		explicitMax: C.max,
		axisLenPt: xe / i,
		axisOrientation: "vertical",
		majorUnit: C.majorUnit,
		minorUnit: C.minorUnit,
		needMinor: C.minorGridlines === !0 || C.minorTickMark != null && C.minorTickMark !== "none",
		logBase: C.logBase,
		reversed: C.orientation === "maxMin"
	}) : null, Ne = (e) => ye + ke.fraction(e) * be, Pe = (e) => U + xe - De.fraction(e) * xe, Fe = (e) => ye + (je?.fraction(e) ?? 0) * be, Le = (e) => U + xe - (Me?.fraction(e) ?? 0) * xe, Re = ke.majorUnit, ze = De.majorTicks, Be = De.minorTicks, Ve = ke.majorTicks, G = ke.minorTicks, He = U + xe;
	if (n.catAxisCrossesAt != null) He = y(Pe(n.catAxisCrossesAt), U, U + xe);
	else {
		let e = n.catAxisCrosses ?? "autoZero";
		e === "autoZero" && we < 0 && Te > 0 ? He = y(Pe(0), U, U + xe) : e === "max" && (He = U);
	}
	let Ue = ye;
	if (n.valAxisCrossesAt != null) Ue = y(Ne(n.valAxisCrossesAt), ye, ye + be);
	else {
		let e = n.valAxisCrosses ?? "autoZero";
		e === "autoZero" && Ce < 0 && W > 0 ? Ue = y(Ne(0), ye, ye + be) : e === "max" && (Ue = ye + be);
	}
	let We = vn(n, i);
	if (!n.valAxisHidden) {
		let r = n.valAxisFontSizeHpt == null ? Math.max(8, Math.min(11, xe / 20)) : Ae(n.valAxisFontSizeHpt, u, i), a = n.valAxisFontSizeHpt == null ? 4 : Rt(r);
		t.font = or(r, yt(n, n.valAxisFontFace, "minor"), n.valAxisFontBold ?? !1, n.valAxisFontItalic ?? !1);
		let o = n.valAxisLineColor ? `#${n.valAxisLineColor}` : void 0, s = it(n.valAxisLineWidthEmu, i), l = n.valAxisLineHidden ? 0 : c(n.valAxisMajorTickMark, "major", s, i);
		if (n.valAxisMinorGridlines) {
			let e = Fn(n, i);
			for (let n of Be) Gt(t, ye, be, Pe(n), !1, e);
		}
		for (let c of ze) {
			let u = Pe(c);
			if (t.strokeStyle = We.color, t.lineWidth = We.width, e(n)) {
				let e = We.dash.length > 0 && t.getLineDash ? t.getLineDash() : [];
				We.dash.length > 0 && t.setLineDash(We.dash), t.beginPath(), t.moveTo(ye, u), t.lineTo(ye + be, u), t.stroke(), We.dash.length > 0 && t.setLineDash(e);
			}
			if (n.valAxisTickLabelPos !== "none") {
				t.fillStyle = n.valAxisFontColor ? `#${n.valAxisFontColor}` : "#555";
				let e = n.valAxisTickLabelPos ?? "nextTo", i;
				e === "high" ? (t.textAlign = "left", i = ye + be + a) : e === "low" ? (t.textAlign = "right", i = ye - a) : (t.textAlign = "right", i = Ue - l - a), t.textBaseline = "middle", gt(t, Rn(n, c, !1), i, u, rr(r));
			}
			z(t, n.valAxisMajorTickMark, "val", Ue, u, o, s, !1, n.valAxisLineHidden, "major", i, n.valAxisLineDash);
		}
		if (n.valAxisMinorTickMark && n.valAxisMinorTickMark !== "none") for (let e of Be) z(t, n.valAxisMinorTickMark, "val", Ue, Pe(e), o, s, !1, n.valAxisLineHidden, "minor", i, n.valAxisLineDash);
	}
	if (!n.catAxisHidden && q(n) && Re > 0) {
		let e = N(n, i);
		t.strokeStyle = e.color, t.lineWidth = e.width;
		let r = e.dash.length > 0 && t.getLineDash ? t.getLineDash() : [];
		e.dash.length > 0 && t.setLineDash(e.dash);
		for (let e of Ve) {
			let n = Ne(e);
			t.beginPath(), t.moveTo(n, U), t.lineTo(n, U + xe), t.stroke();
		}
		e.dash.length > 0 && t.setLineDash(r);
	}
	if (!n.catAxisHidden && n.catAxisMinorGridlines && Re > 0) {
		let e = B(n, i), r = e.dash.length > 0 && t.getLineDash ? t.getLineDash() : [];
		t.strokeStyle = e.color, t.lineWidth = e.width, e.dash.length > 0 && t.setLineDash(e.dash);
		for (let e of G) {
			let n = Ne(e);
			t.beginPath(), t.moveTo(n, U), t.lineTo(n, U + xe), t.stroke();
		}
		e.dash.length > 0 && t.setLineDash(r);
	}
	if (!n.catAxisHidden && !n.catAxisLineHidden && (t.save(), t.lineCap = "butt", kn(t, ye, He, ye + be, He, n.catAxisLineColor ? `#${n.catAxisLineColor}` : "#888", it(n.catAxisLineWidthEmu, i), n.catAxisLineDash), t.restore()), !n.valAxisHidden && !n.valAxisLineHidden && (t.save(), kn(t, Ue, U, Ue, U + xe, n.valAxisLineColor ? `#${n.valAxisLineColor}` : "#888", it(n.valAxisLineWidthEmu, i), n.valAxisLineDash), t.restore()), !n.catAxisHidden) {
		let e = n.catAxisFontSizeHpt == null ? Math.max(8, Math.min(11, xe / 20)) : Ae(n.catAxisFontSizeHpt, u, i), r = n.catAxisFontSizeHpt == null ? 4 : Ht(e);
		t.font = or(e, yt(n, n.catAxisFontFace, "minor"), n.catAxisFontBold ?? !1, n.catAxisFontItalic ?? !1), t.fillStyle = n.catAxisFontColor ? `#${n.catAxisFontColor}` : "#555", t.textAlign = "center";
		let a = n.catAxisTickLabelPos ?? "nextTo", o = it(n.catAxisLineWidthEmu, i), s = n.catAxisLineColor ? `#${n.catAxisLineColor}` : void 0, l = n.catAxisLineHidden ? 0 : c(n.catAxisMajorTickMark, "major", o, i), d = a === "low" ? U + xe + r : a === "high" ? U - r : He + l + r;
		t.textBaseline = a === "high" ? "bottom" : "top";
		for (let r of Ve) {
			let c = Ne(r);
			a !== "none" && gt(t, jt(r, n.catAxisFormatCode, n.date1904, n.catAxisDisplayUnits), c, d, rr(e)), z(t, n.catAxisMajorTickMark, "cat", He, c, s, o, !1, n.catAxisLineHidden, "major", i, n.catAxisLineDash);
		}
		if (n.catAxisMinorTickMark && n.catAxisMinorTickMark !== "none") for (let e of G) z(t, n.catAxisMinorTickMark, "cat", He, Ne(e), s, o, !1, n.catAxisLineHidden, "minor", i, n.catAxisLineDash);
	}
	let Ge = (e, c, d, f, p, m, h, g) => {
		e.length !== 0 && bo(t, n, e, w, f, p, r, ye, U, be, xe, i, c, d, {
			x: o,
			y: s,
			w: l,
			h: u
		}, m, h, a, g);
	};
	if (n.plotGroups == null) {
		let e = n.chartType === "bubble", t = e ? "marker" : n.scatterStyle ?? "marker";
		Ge(b, e, t, Ne, Pe, De.max, n.valAxisDisplayUnits), x.length > 0 && je && Me && Ge(x, e, t, Fe, Le, Me.max, C?.displayUnits);
	} else for (let e of n.plotGroups) {
		if (e.kind !== "scatter" && e.kind !== "bubble") continue;
		let t = n.series.slice(e.seriesStart, e.seriesStart + e.seriesCount).map((t, n) => ({
			series: t,
			index: e.seriesStart + n
		}));
		if (t.length === 0) continue;
		let r = e.kind === "bubble", i = e.categoryAxis === "secondary", a = e.valueAxis === "secondary";
		Ge(t, r, r ? "marker" : e.scatterStyle ?? n.scatterStyle ?? "marker", i ? Fe : Ne, a ? Le : Pe, a && Me ? Me.max : De.max, a ? C?.displayUnits : n.valAxisDisplayUnits, r ? {
			bubbleScale: e.bubbleScale ?? n.bubbleScale,
			bubbleSizeRepresents: e.bubbleSizeRepresents ?? n.bubbleSizeRepresents,
			showNegativeBubbles: e.showNegativeBubbles ?? n.showNegativeBubbles
		} : void 0);
	}
	if (S && je && !S.hidden) {
		let e = st(S.lineColor, S.lineWidthEmu, i);
		S.lineHidden || kn(t, ye, U, ye + be, U, e.color, e.width, S.lineDash);
		let r = en(S.fontSizeHpt, i) ?? te;
		t.font = or(r, yt(n, S.fontFace, "minor"), S.fontBold ?? !1, S.fontItalic ?? !1), t.fillStyle = S.fontColor ? `#${S.fontColor}` : "#555", t.textAlign = "center", t.textBaseline = "bottom";
		let a = S.lineHidden ? 0 : c(S.majorTickMark, "major", e.width, i);
		for (let o of je.majorTicks) {
			let s = Fe(o);
			S.tickLabelPos !== "none" && gt(t, jt(o, S.formatCode, n.date1904, S.displayUnits), s, U - a - Ht(r), rr(r)), z(t, S.majorTickMark, "cat", U, s, e.color, e.width, !0, S.lineHidden, "major", i, S.lineDash);
		}
		if (S.minorTickMark && S.minorTickMark !== "none") for (let n of je.minorTicks) z(t, S.minorTickMark, "cat", U, Fe(n), e.color, e.width, !0, S.lineHidden, "minor", i, S.lineDash);
	}
	C && Me && he(t, n, C, {
		min: Me.min,
		max: Me.max,
		step: Me.majorUnit,
		majorLines: Me.majorTicks,
		minorTicks: Me.minorTicks,
		makeToY: () => Le
	}, Le, r, ye, U, be, xe, i, en(C.fontSizeHpt, i) ?? P, ce, n.valAxisFontColor ? `#${n.valAxisFontColor}` : "#555", n.date1904), Ra(t, n, F, o, s, l, u, ye, U, be, xe, j.bandH + 2, i), nt(t, n, o, s, l, u, ye, U, be, xe, re, L, ie, ae);
}
var us = (e, t, n, r, i) => Lo(e, t, n, r, {}, i), ds = (e, t, n, r, i) => $o(e, t, n, !1, r, i), fs = (e, t, n, r, i) => $o(e, t, n, !0, r, i), ps = {
	"bar-combo": us,
	"line-groups": Ho,
	"area-groups": Yo,
	"scatter-bubble": ls,
	"stock-line": Uo
}, ms = {
	clusteredBar: us,
	clusteredBarH: us,
	stackedBar: us,
	stackedBarH: us,
	stackedBarPct: us,
	stackedBarHPct: us,
	line: Ho,
	stackedLine: Ho,
	stackedLinePct: Ho,
	area: Yo,
	stackedArea: Yo,
	stackedAreaPct: Yo,
	pie: ds,
	ofPie: Qo,
	doughnut: fs,
	radar: cs,
	scatter: ls,
	bubble: ls,
	stock: Uo,
	surface: Jo,
	surface3D: Jo
};
function hs(e, t, n, r = I, i = 0, a, o, s, c, l = Dt(t)) {
	e.save();
	try {
		if (wo(e, n, l)) return;
		t = Vn(t, r);
		let { x: u, y: d, w: f, h: p } = n, m = t.roundedCorners === !0, h = m ? 10 * r : 0, g = (e) => {
			m ? (Eo(e, u, d, f, p, h), e.fill()) : e.fillRect(u, d, f, p);
		};
		Ne(e, t.chartAreaStyle, t.chartStyleRoles?.chartArea, 0, n, r, (e) => {
			if (t.chartFillHidden !== !0) if (t.chartFill?.fillType === "image") m ? (e.save(), Eo(e, u, d, f, p, h), e.clip(), Hn(e, t.chartFill, u, d, f, p, r, i), e.restore()) : Hn(e, t.chartFill, u, d, f, p, r, i);
			else if (t.chartFill) {
				let n = Pn(t.chartFill, e, u, d, f, p, i);
				n && (e.fillStyle = n), n && g(e);
			} else t.chartBg && (e.fillStyle = `#${t.chartBg}`, g(e));
			if (t.chartBorderHidden !== !0 && (t.chartBorderLineFill || t.chartBorderColor)) {
				e.save();
				let n = t.chartBorderLineFill ? Pn(t.chartBorderLineFill, e, u, d, f, p, i) : t.chartBorderColor ? `#${t.chartBorderColor}` : null;
				if (!n) e.restore();
				else {
					e.strokeStyle = n;
					let i = t.chartBorderWidthEmu ? Math.max(.5, t.chartBorderWidthEmu / W) * r : 1;
					e.setLineDash(Zn(t.chartBorderCustomDash, t.chartBorderDash, i)), e.lineCap = t.chartBorderCap === "rnd" ? "round" : t.chartBorderCap === "sq" ? "square" : "butt", e.lineJoin = t.chartBorderJoin === "round" || t.chartBorderJoin === "bevel" ? t.chartBorderJoin : "miter", ae(e, u, d, f, p, i, t.chartBorderCompound, m ? h : 0), e.restore();
				}
			}
		});
		let _ = t.chartexBox != null || t.chartexSunburst != null || t.chartexTreemap != null || t.chartexRegionMap != null;
		if (t.series.length === 0 && !_) {
			t.authoredWithoutSeries !== !0 && (e.fillStyle = "#888", e.font = "12px sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText("(no data)", u + f / 2, d + p / 2)), To(e, t, n, r);
			return;
		}
		let v = tn(t), y = (v != null || t.chartexBox != null) && (v ?? 0) <= 1e4 ? So(t, s, r, n) : null, b = Co(t, a), x = v != null && v <= 1e4 ? Rr(t, s, r, n, b != null) : null, S = uo(t, a, s, r, n);
		if ((v != null || y != null || x != null || b != null || S != null) && wo(e, n, Math.max(v ?? 0, y != null && y + (x ?? 0) > Ei ? 10001 : 0, x != null && x > Ei ? 10001 : 0, b ?? 0, S != null && S > Oi ? 10001 : 0))) {
			To(e, t, n, r);
			return;
		}
		let C = Et(t);
		if (C === "unsupported") {
			e.fillStyle = "#888", e.font = "11px sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText("Unsupported chart", u + f / 2, d + p / 2), To(e, t, n, r);
			return;
		}
		if (C !== "legacy") {
			ps[C]?.(e, t, n, r, i), at(e, t, n, r), To(e, t, n, r);
			return;
		}
		if (a?.render(e, t, n, r, i)) {
			at(e, t, n, r), To(e, t, n, r);
			return;
		}
		if (o?.render(e, t, n, r, i)) {
			To(e, t, n, r);
			return;
		}
		if (c?.render(e, t, n, r, i)) {
			at(e, t, n, r), To(e, t, n, r);
			return;
		}
		let w = Object.hasOwn(ms, t.chartType) ? ms[t.chartType] : void 0;
		w ? w(e, t, n, r, i) : (e.fillStyle = "#888", e.font = "11px sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText("Unsupported chart", u + f / 2, d + p / 2)), at(e, t, n, r), To(e, t, n, r);
	} finally {
		e.restore();
	}
}
function gs(e, t, n = I, r = 0, i, a, o, s) {
	if (!an(e).some(({ fill: e }) => mn(e))) return [];
	let c = /* @__PURE__ */ new Map(), l = null;
	try {
		l = dn(1, 1);
		let u = l?.getContext("2d");
		if (!l || !u) throw new _("unsupported-image-effect", "Chart occurrence surface unavailable");
		let d = l;
		ct(d), vs(u, e, t, n, r, i, a, (e, t) => {
			if (!mn(e)) return null;
			let n = s?.(e, t);
			if (n !== void 0) return n;
			if (t) {
				let n = En(e, void 0, t);
				c.has(n) || (xt(c.size + 1, 256), c.set(n, {
					fill: e,
					occurrence: t
				}));
			}
			return d;
		}, o);
	} catch (e) {
		throw wi(e);
	} finally {
		l && (l.width = 0);
	}
	return [...c.values()];
}
function _s(e) {
	xt(e, 256);
}
function vs(e, t, n, r = I, i = 0, a, o, s, c) {
	Ot(e, r, () => Ct(() => {
		De(() => {
			nr(s, () => {
				let l = Dt(t), u = l <= 1e4 ? nn(te(t)) : t;
				d(e, () => {
					hs(e, u, n, r, i, a, o, s, c, l);
				}, void 0, l <= 1e4 ? St(u) : 1);
			});
		});
	}));
}
export { qi as A, Ur as B, Gi as C, Qi as D, Bi as E, Si as F, Hr as H, ui as I, ri as L, wi as M, hi as N, Ki as O, xi as P, ii as R, Ii as S, zi as T, Br as V, Ni as _, Io as a, Xi as b, ko as c, io as d, Ra as f, Ji as g, Hi as h, Ho as i, Vi as j, Ui as k, wo as l, aa as m, gs as n, Lo as o, Fa as p, vs as r, jo as s, _s as t, ao as u, Li as v, Ai as w, Wi as x, Ri as y, ti as z };
