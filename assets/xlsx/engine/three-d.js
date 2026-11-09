// optional-renderer: packages/core/src/chart/three-d-renderer.ts
import { $a as e, $i as t, Bi as n, Ca as r, Ci as i, Cn as a, Da as o, Di as s, Ea as c, Ga as l, Gi as u, Hi as d, Ia as f, Ji as p, Ka as m, Ki as h, Ln as g, Nt as _, Oa as v, Ot as y, Pa as b, Qi as x, Rn as S, Rr as C, Sa as w, Ua as T, Ui as E, Vi as D, Wa as O, Wi as k, Xa as A, Ya as j, Yi as M, Za as N, Zi as P, _a as F, aa as I, ao as L, ba as R, bi as z, bn as B, da as V, ea as H, fa as U, ga as ee, io as te, l as W, la as G, ma as K, n as q, na as J, oa as Y, on as ne, pa as X, qa as Z, qt as re, sa as ie, sn as ae, so as oe, sr as se, t as ce, ta as le, v as ue, va as de, vn as fe, wa as pe, xi as me, xn as he, xt as ge, ya as _e, yi as ve, yn as ye, zi as be, zn as xe, zr as Se } from "./plot-area-frame-DNYMd9Pf.js";
import { a as Ce, c as we, i as Te, m as Ee, n as De, o as Oe, p as ke, r as Ae, s as je, t as Me, u as Ne, v as Pe, y as Fe } from "./three-d-BfMZVR0w.js";
import { t as Ie } from "./renderer-module-contract-BuTx2FWJ.js";
function Le(e, t, n, r) {
	return te(e, r) ? n : t.chartexFormatIdx ?? r;
}
function Re(t, n, r, i, a) {
	let o = Le(t, n, i, a), s = e(t, "dataPoint3D", a), c = oe(t, "dataPoint3D"), u = T(r?.chartexStyle, c, i);
	if (u !== void 0) return u;
	if (r?.fillHidden === !0) {
		let e = l(c);
		if (e !== void 0) return e;
	}
	if (r?.color === "00000000") return null;
	if (r?.color) return {
		fillType: "solid",
		color: r.color
	};
	let d = T(n.chartexStyle, c, o);
	return d === void 0 ? Z(s, c, o, r?.chartexStyle, n.chartexStyle) : d;
}
var ze = 32;
function Be(e) {
	switch (e) {
		case "cylinder":
		case "cone":
		case "coneToMax":
		case "pyramid":
		case "pyramidToMax": return e;
		default: return "box";
	}
}
var Ve = (e) => Math.max(0, Math.min(1, e));
function He(e, t) {
	if (t.length < 3) return null;
	let n = e[t[0]];
	for (let r = 1; r + 1 < t.length; r++) for (let i = r + 1; i < t.length; i++) {
		let a = e[t[r]], o = e[t[i]], s = {
			x: a.x - n.x,
			y: a.y - n.y,
			depth: a.depth - n.depth
		}, c = {
			x: o.x - n.x,
			y: o.y - n.y,
			depth: o.depth - n.depth
		}, l = {
			x: s.y * c.depth - s.depth * c.y,
			y: s.depth * c.x - s.x * c.depth,
			depth: s.x * c.y - s.y * c.x
		}, u = Math.hypot(l.x, l.y, l.depth);
		if (u > 2 ** -52) return {
			x: l.x / u,
			y: l.y / u,
			depth: l.depth / u
		};
	}
	return null;
}
function Ue(e, t) {
	let n = e.reduce((t, n) => ({
		x: t.x + n.x / e.length,
		y: t.y + n.y / e.length,
		depth: t.depth + n.depth / e.length
	}), {
		x: 0,
		y: 0,
		depth: 0
	});
	return t.map((t) => {
		let r = He(e, t.indices);
		if (!r) return t;
		let i = t.indices.reduce((n, r) => ({
			x: n.x + e[r].x / t.indices.length,
			y: n.y + e[r].y / t.indices.length,
			depth: n.depth + e[r].depth / t.indices.length
		}), {
			x: 0,
			y: 0,
			depth: 0
		}), a = {
			x: i.x - n.x,
			y: i.y - n.y,
			depth: i.depth - n.depth
		};
		return r.x * a.x + r.y * a.y + r.depth * a.depth >= 0 ? t : {
			...t,
			indices: [...t.indices].reverse()
		};
	});
}
function We(e) {
	let { horizontal: t, crossStart: n, crossSize: r, baseCoord: i, endCoord: a, nearDepth: o, farDepth: s } = e;
	if (![
		n,
		r,
		i,
		a,
		o,
		s
	].every(Number.isFinite) || r <= 0 || i === a || o === s) return null;
	let c = Be(e.shape), l = c === "cylinder" || c === "cone" || c === "coneToMax", u = c !== "box" && c !== "cylinder", d = c === "coneToMax" || c === "pyramidToMax", f = l ? Math.max(8, Math.min(64, Math.trunc(e.roundSegments ?? ze))) : 4, p = Ve(e.baseScale ?? (d ? e.toMaxBaseScale ?? 1 : 1)), m = Ve(e.endScale ?? (u ? d ? e.toMaxEndScale ?? 0 : 0 : 1));
	if (p === 0 && m === 0) return null;
	let h = n + r / 2, g = r / 2, _ = (o + s) / 2, v = Math.abs(s - o) / 2, y = [], b = (e, n) => {
		if (n === 0) {
			let n = y.length;
			return y.push(t ? {
				x: e,
				y: h,
				depth: _
			} : {
				x: h,
				y: e,
				depth: _
			}), [n];
		}
		let r = [];
		for (let i = 0; i < f; i++) {
			let a = l ? i / f * Math.PI * 2 : Math.PI / 4 + i / f * Math.PI * 2, o = l ? 1 : Math.SQRT2, s = h + Math.cos(a) * g * n * o, c = _ + Math.sin(a) * v * n * o;
			r.push(y.length), y.push(t ? {
				x: e,
				y: s,
				depth: c
			} : {
				x: s,
				y: e,
				depth: c
			});
		}
		return r;
	}, x = b(i, p), S = b(a, m), C = l, w = [];
	x.length > 1 && e.omitBaseCap !== !0 && w.push({
		indices: x,
		role: "baseCap",
		smoothSurface: C
	}), S.length > 1 && e.omitEndCap !== !0 && w.push({
		indices: S,
		role: "endCap",
		smoothSurface: C
	});
	let T = [], E = Math.max(x.length, S.length);
	for (let e = 0; e < E; e++) {
		let t = (e + 1) % E, n = x.length === 1 ? x[0] : x[e], r = x.length === 1 ? x[0] : x[t], i = S.length === 1 ? S[0] : S[e], a = S.length === 1 ? S[0] : S[t], o = x.length === 1 ? [
			n,
			a,
			i
		] : S.length === 1 ? [
			n,
			r,
			i
		] : [
			n,
			r,
			a,
			i
		];
		w.push({
			indices: o,
			role: "side",
			smoothSurface: C,
			segmentIndex: e,
			baseRimEdge: x.length > 1 ? [n, r] : void 0,
			endRimEdge: S.length > 1 ? [i, a] : void 0
		}), T.push([n, i]);
	}
	return {
		shape: c,
		vertices: y,
		faces: Ue(y, w),
		silhouetteEdges: T
	};
}
function Ge(e) {
	let { x0: t, x1: n, lower0: r, lower1: i, upper0: a, upper1: o, nearDepth: s, farDepth: c, capStart: l, capEnd: u } = e;
	if (![
		t,
		n,
		r,
		i,
		a,
		o,
		s,
		c
	].every(Number.isFinite) || t === n || s === c) return null;
	n < t && ([t, n] = [n, t], [r, i] = [i, r], [a, o] = [o, a], [l, u] = [u, l]);
	let d = Math.min(s, c), f = Math.max(s, c), p = Math.min(r, a), m = Math.min(i, o), h = Math.max(r, a), g = Math.max(i, o);
	if (Math.max(h - p, g - m) < 1e-9) return null;
	let _ = [
		{
			x: t,
			y: p,
			depth: d
		},
		{
			x: n,
			y: m,
			depth: d
		},
		{
			x: n,
			y: g,
			depth: d
		},
		{
			x: t,
			y: h,
			depth: d
		},
		{
			x: t,
			y: p,
			depth: f
		},
		{
			x: n,
			y: m,
			depth: f
		},
		{
			x: n,
			y: g,
			depth: f
		},
		{
			x: t,
			y: h,
			depth: f
		}
	];
	return {
		shape: "areaStrip",
		vertices: _,
		faces: Ue(_, [
			{
				indices: [
					0,
					3,
					2,
					1
				],
				role: "side",
				smoothSurface: !1
			},
			{
				indices: [
					4,
					5,
					6,
					7
				],
				role: "side",
				smoothSurface: !1
			},
			{
				indices: [
					0,
					4,
					7,
					3
				],
				role: "baseCap",
				smoothSurface: !1
			},
			{
				indices: [
					1,
					2,
					6,
					5
				],
				role: "endCap",
				smoothSurface: !1
			},
			{
				indices: [
					0,
					1,
					5,
					4
				],
				role: "side",
				smoothSurface: !1
			},
			{
				indices: [
					3,
					7,
					6,
					2
				],
				role: "side",
				smoothSurface: !1
			}
		].filter((e) => (e.role !== "baseCap" || l) && (e.role !== "endCap" || u))),
		silhouetteEdges: []
	};
}
function Ke(e) {
	let t = e.upper0 - e.lower0, n = e.upper1 - e.lower1;
	if (Number.isFinite(t) && Number.isFinite(n) && t * n < 0) {
		let r = t / (t - n), i = e.x0 + (e.x1 - e.x0) * r, a = e.lower0 + (e.lower1 - e.lower0) * r;
		return [Ge({
			...e,
			x1: i,
			lower1: a,
			upper1: a,
			capEnd: !1
		}), Ge({
			...e,
			x0: i,
			lower0: a,
			upper0: a,
			capStart: !1
		})].filter((e) => e != null);
	}
	let r = Ge(e);
	return r ? [r] : [];
}
function qe(e) {
	let t = e.outline;
	if (t.length < 3 || t.length > 64 || ![e.nearDepth, e.farDepth].every(Number.isFinite) || Math.abs(e.nearDepth - e.farDepth) < 1e-9 || !t.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y))) return null;
	let n = Math.min(e.nearDepth, e.farDepth), r = Math.max(e.nearDepth, e.farDepth), i = t.length, a = [...t.map((e) => ({
		...e,
		depth: n
	})), ...t.map((e) => ({
		...e,
		depth: r
	}))], o = Array.from({ length: i }, (e, t) => t), s = Array.from({ length: i }, (e, t) => i + t).reverse();
	return {
		shape: "lineRibbon",
		vertices: a,
		faces: Ue(a, [
			{
				indices: o,
				role: "side",
				smoothSurface: !1
			},
			{
				indices: s,
				role: "side",
				smoothSurface: !1
			},
			...Array.from({ length: i }, (e, t) => {
				let n = (t + 1) % i;
				return {
					indices: [
						t,
						n,
						i + n,
						i + t
					],
					role: "side",
					smoothSurface: !1
				};
			})
		]),
		silhouetteEdges: []
	};
}
function Je(e) {
	let { centerX: t, centerY: n, centerDepth: r, radius: i, modelDepth: a, thickness: o, startAngle: s, endAngle: c } = e;
	if (![
		t,
		n,
		r,
		i,
		a,
		o,
		s,
		c
	].every(Number.isFinite) || !(i > 0) || !(a > 0) || !(o > 0) || !(c > s)) return null;
	let l = Math.min(Math.PI * 2, c - s), u = l >= Math.PI * 2 - 1e-9, d = Math.max(2, Math.min(128, Math.trunc(e.segments ?? Math.ceil(ze * l / (Math.PI * 2))))), f = n - o / 2, p = n + o / 2, m = [{
		x: t,
		y: f,
		depth: r
	}, {
		x: t,
		y: p,
		depth: r
	}], h = [], g = [], _ = u ? d : d + 1;
	for (let e = 0; e < _; e++) {
		let n = s + l * e / d, o = t + Math.cos(n) * i, c = r + Math.sin(n) * i / a;
		h.push(m.length), m.push({
			x: o,
			y: f,
			depth: c
		}), g.push(m.length), m.push({
			x: o,
			y: p,
			depth: c
		});
	}
	let v = u ? [{
		indices: [...h],
		role: "baseCap",
		smoothSurface: !0
	}, {
		indices: [...g],
		role: "endCap",
		smoothSurface: !0
	}] : [
		{
			indices: [0, ...h],
			role: "baseCap",
			smoothSurface: !0
		},
		{
			indices: [1, ...g],
			role: "endCap",
			smoothSurface: !0
		},
		{
			indices: [
				0,
				1,
				g[0],
				h[0]
			],
			role: "baseCap",
			smoothSurface: !1
		},
		{
			indices: [
				0,
				h.at(-1),
				g.at(-1),
				1
			],
			role: "endCap",
			smoothSurface: !1
		}
	];
	for (let e = 0; e < d; e++) {
		let t = u ? (e + 1) % d : e + 1;
		v.push({
			indices: [
				h[e],
				g[e],
				g[t],
				h[t]
			],
			role: "side",
			smoothSurface: !0,
			segmentIndex: e,
			baseRimEdge: [h[e], h[t]],
			endRimEdge: [g[e], g[t]]
		});
	}
	return {
		shape: "pieSector",
		vertices: m,
		faces: Ue(m, v),
		silhouetteEdges: h.slice(0, u ? void 0 : -1).map((e, t) => [e, g[t]])
	};
}
function Ye(e, t) {
	if (![e, t].every(Number.isFinite)) return null;
	let n = t - e;
	if (n === 0) return e >= 0 && e <= 1 ? {
		startT: 0,
		endT: 1
	} : null;
	let r = -e / n, i = (1 - e) / n, a = Math.max(0, Math.min(r, i)), o = Math.min(1, Math.max(r, i));
	return a <= o ? {
		startT: a,
		endT: o
	} : null;
}
function Xe(e, t, n, r) {
	if (![
		e,
		t,
		n,
		r
	].every(Number.isFinite)) return [];
	let i = [0, 1], a = (e, t) => {
		let n = t - e;
		if (n !== 0) for (let t of [0, 1]) {
			let r = (t - e) / n;
			r > 0 && r < 1 && Number.isFinite(r) && i.push(r);
		}
	};
	a(e, t), a(n, r), i.sort((e, t) => e - t);
	let o = i.filter((e, t) => t === 0 || Math.abs(e - i[t - 1]) > 1e-12), s = (e, t, n) => e + (t - e) * n, c = (e) => Math.max(0, Math.min(1, e)), l = [];
	for (let i = 0; i + 1 < o.length; i++) {
		let a = o[i], u = o[i + 1], d = (a + u) / 2, f = c(s(e, t, d)), p = c(s(n, r, d));
		Math.abs(p - f) <= 1e-12 || l.push({
			startT: a,
			endT: u,
			lowerStart: c(s(e, t, a)),
			lowerEnd: c(s(e, t, u)),
			upperStart: c(s(n, r, a)),
			upperEnd: c(s(n, r, u))
		});
	}
	return l;
}
var Ze = (e) => ({
	minX: Math.min(...e.map((e) => e.x)),
	maxX: Math.max(...e.map((e) => e.x)),
	minY: Math.min(...e.map((e) => e.y)),
	maxY: Math.max(...e.map((e) => e.y))
}), Qe = (e, t) => {
	let n = !1;
	for (let r = 0, i = e.length - 1; r < e.length; i = r++) {
		let a = e[r], o = e[i], s = (a.x - t.x) * (o.y - t.y) - (a.y - t.y) * (o.x - t.x), c = Math.max(1, Math.abs(a.x), Math.abs(a.y), Math.abs(o.x), Math.abs(o.y));
		if (Math.abs(s) <= c * 1e-9 && t.x >= Math.min(a.x, o.x) - 1e-9 && t.x <= Math.max(a.x, o.x) + 1e-9 && t.y >= Math.min(a.y, o.y) - 1e-9 && t.y <= Math.max(a.y, o.y) + 1e-9) return !0;
		a.y > t.y != o.y > t.y && t.x < (o.x - a.x) * (t.y - a.y) / (o.y - a.y) + a.x && (n = !n);
	}
	return n;
}, $e = (e, t, n, r) => {
	let i = {
		x: t.x - e.x,
		y: t.y - e.y
	}, a = {
		x: r.x - n.x,
		y: r.y - n.y
	}, o = i.x * a.y - i.y * a.x;
	if (Math.abs(o) < 1e-12) return null;
	let s = {
		x: n.x - e.x,
		y: n.y - e.y
	}, c = (s.x * a.y - s.y * a.x) / o, l = (s.x * i.y - s.y * i.x) / o;
	return c < -1e-9 || c > 1.000000001 || l < -1e-9 || l > 1.000000001 ? null : {
		x: e.x + i.x * c,
		y: e.y + i.y * c
	};
};
function et(e, t, n, r) {
	let i = [], a = (e) => {
		i.length >= 12 || i.some((t) => Math.hypot(t.x - e.x, t.y - e.y) < 1e-7) || i.push(e);
	}, o = {
		x: (Math.max(n.minX, r.minX) + Math.min(n.maxX, r.maxX)) / 2,
		y: (Math.max(n.minY, r.minY) + Math.min(n.maxY, r.maxY)) / 2
	};
	Qe(e, o) && Qe(t, o) && a(o);
	for (let n of e) Qe(t, n) && a(n);
	for (let n of t) Qe(e, n) && a(n);
	for (let n = 0; n < e.length && i.length < 12; n++) for (let r = 0; r < t.length && i.length < 12; r++) {
		let i = $e(e[n], e[(n + 1) % e.length], t[r], t[(r + 1) % t.length]);
		i && a(i);
	}
	return i;
}
function tt(e, t) {
	let n = e.cameraDepths;
	if (!n || n.length !== e.points.length || e.points.length < 3) return e.cameraDepth;
	let r = e.cameraWeights?.length === e.points.length ? e.cameraWeights : e.points.map(() => 1), i = e.points[0];
	for (let a = 1; a + 1 < e.points.length; a++) {
		let o = e.points[a], s = e.points[a + 1], c = (o.y - s.y) * (i.x - s.x) + (s.x - o.x) * (i.y - s.y);
		if (Math.abs(c) < 1e-12) continue;
		let l = ((o.y - s.y) * (t.x - s.x) + (s.x - o.x) * (t.y - s.y)) / c, u = ((s.y - i.y) * (t.x - s.x) + (i.x - s.x) * (t.y - s.y)) / c, d = 1 - l - u;
		if (Math.min(l, u, d) < -1e-7) continue;
		let f = l * r[0] + u * r[a] + d * r[a + 1];
		if (Math.abs(f) > 2 ** -52) return (l * n[0] * r[0] + u * n[a] * r[a] + d * n[a + 1] * r[a + 1]) / f;
	}
	return e.cameraDepth;
}
function nt(e) {
	if (e.length < 2) return [...e];
	let t = [...e.keys()].sort((t, n) => e[t].cameraDepth - e[n].cameraDepth || t - n), n = e.map((e) => Ze(e.points)), r = [...e.keys()].sort((e, t) => n[e].minX - n[t].minX || e - t), i = e.map(() => /* @__PURE__ */ new Set()), a = e.map(() => 0), o = [], s = 0;
	for (let c of r) {
		for (let e = o.length - 1; e >= 0; e--) n[o[e]].maxX < n[c].minX - 1e-9 && o.splice(e, 1);
		for (let r of o) {
			if (++s > 2e5) return t.map((t) => e[t]);
			if (n[r].maxY < n[c].minY - 1e-9 || n[c].maxY < n[r].minY - 1e-9) continue;
			let o = et(e[r].points, e[c].points, n[r], n[c]), l = 0;
			for (let t of o) {
				let n = tt(e[r], t) - tt(e[c], t), i = 1e-8 * Math.max(1, Math.abs(e[r].cameraDepth), Math.abs(e[c].cameraDepth));
				if (Math.abs(n) <= i) continue;
				let a = n < 0 ? -1 : 1;
				if (l !== 0 && l !== a) {
					l = 0;
					break;
				}
				l = a;
			}
			if (l === 0) continue;
			let u = l < 0 ? r : c, d = l < 0 ? c : r;
			i[u].has(d) || (i[u].add(d), a[d]++);
		}
		o.push(c);
	}
	let c = new Set(e.keys()), l = [];
	for (; c.size;) {
		let n = t.find((e) => c.has(e) && a[e] === 0);
		if (n ??= t.find((e) => c.has(e)), n == null) break;
		c.delete(n), l.push(e[n]);
		for (let e of i[n]) a[e]--;
	}
	return l;
}
var Q = 1e-9, rt = 1e4, it = (e, t, n) => ({
	x: e.x + (t.x - e.x) * n,
	y: e.y + (t.y - e.y) * n,
	cameraDepth: e.cameraDepth + (t.cameraDepth - e.cameraDepth) * n,
	cameraWeight: (e.cameraWeight ?? 1) + ((t.cameraWeight ?? 1) - (e.cameraWeight ?? 1)) * n
}), at = (e, t) => Math.hypot(e.x - t.x, e.y - t.y) <= Q;
function ot(e, t, n = 0) {
	let r = t.filter((e) => Number.isFinite(e) && e > Q);
	if (r.length === 0) return e.length >= 2 ? [[...e]] : [];
	r.length % 2 == 1 && r.push(...r);
	let i = [], a = 0, o = r[0], s = !0, c = r.reduce((e, t) => e + t, 0), l = c > Q && Number.isFinite(n) ? (n % c + c) % c : 0;
	for (; l > Q;) {
		let e = Math.min(l, o);
		l -= e, o -= e, o <= Q && (a = (a + 1) % r.length, o = r[a], s = a % 2 == 0);
	}
	let u = null;
	for (let t = 0; t + 1 < e.length; t++) {
		let n = e[t], c = e[t + 1], l = Math.hypot(c.x - n.x, c.y - n.y);
		if (!(l > Q)) continue;
		let d = 0;
		for (; d < l - Q;) {
			let e = Math.min(o, l - d), t = it(n, c, d / l), f = it(n, c, (d + e) / l);
			if (s && (u ??= [], (u.length === 0 || !at(u.at(-1), t)) && u.push(t), u.push(f)), d += e, o -= e, o <= Q) {
				if (s && u && u.length >= 2) {
					if (i.length >= 1e4) return null;
					i.push(u);
				}
				u = null, a = (a + 1) % r.length, o = r[a], s = a % 2 == 0;
			}
		}
	}
	if (s && u && u.length >= 2) {
		if (i.length >= 1e4) return null;
		i.push(u);
	}
	if (i.length > 1 && at(e[0], e.at(-1)) && at(i[0][0], e[0]) && at(i.at(-1).at(-1), e.at(-1))) {
		let e = i.shift(), t = i.pop();
		i.unshift([...t, ...e.slice(1)]);
	}
	return i;
}
var st = (e, t) => ({
	kind: e,
	points: t.map(({ x: e, y: t }) => ({
		x: e,
		y: t
	})),
	cameraDepths: t.map((e) => e.cameraDepth),
	cameraWeights: t.map((e) => e.cameraWeight ?? 1),
	cameraDepth: t.reduce((e, t) => e + t.cameraDepth, 0) / t.length
}), ct = (e, t, n) => {
	let r = [];
	for (let n = 0; n < 12; n++) {
		let i = Math.PI * 2 * n / 12;
		r.push({
			...e,
			x: e.x + Math.cos(i) * t,
			y: e.y + Math.sin(i) * t
		});
	}
	return st(n, r);
};
function lt(e, t, n) {
	let r = Number.isFinite(n.width) ? Math.max(0, n.width) : 0;
	if (!(r > Q) || t.length < 3) return null;
	let i = r / 2;
	if ((n.lineJoin ?? "miter") === "round") return ct(e, i, "join");
	let a = [];
	for (let n of t) {
		let t = n.x - e.x, r = n.y - e.y, o = Math.hypot(t, r);
		if (!(o > Q)) continue;
		let s = -r / o * i, c = t / o * i;
		a.push({
			...e,
			x: e.x + s,
			y: e.y + c
		}, {
			...e,
			x: e.x - s,
			y: e.y - c
		});
	}
	if (a.length < 3) return null;
	a.sort((e, t) => e.x - t.x || e.y - t.y);
	let o = (e, t, n) => (t.x - e.x) * (n.y - e.y) - (t.y - e.y) * (n.x - e.x), s = [];
	for (let e of a) {
		for (; s.length >= 2 && o(s.at(-2), s.at(-1), e) <= Q;) s.pop();
		s.push(e);
	}
	let c = [];
	for (let e of [...a].reverse()) {
		for (; c.length >= 2 && o(c.at(-2), c.at(-1), e) <= Q;) c.pop();
		c.push(e);
	}
	let l = [...s.slice(0, -1), ...c.slice(0, -1)];
	return l.length >= 3 ? st("join", l) : null;
}
var ut = (e, t, n, r) => {
	let i = t.x * r.y - t.y * r.x;
	if (Math.abs(i) <= Q) return null;
	let a = {
		x: n.x - e.x,
		y: n.y - e.y
	}, o = (a.x * r.y - a.y * r.x) / i;
	return {
		x: e.x + t.x * o,
		y: e.y + t.y * o
	};
};
function dt(e, t) {
	let n = Number.isFinite(t.width) ? Math.max(0, t.width) : 0;
	if (!(n > Q) || e.length < 2) return [];
	let r = n / 2, i = t.lineCap ?? "butt", a = t.lineJoin ?? "miter", o = Math.max(1, t.miterLimit ?? 10), s = [], c = ot(e, t.dash ?? [], t.dashOffset);
	if (c == null) return null;
	let l = (e) => s.length >= 1e4 ? !1 : (s.push(e), !0);
	for (let n = 0; n < c.length; n++) {
		let s = c[n], u = s.length > 2 && at(s[0], s.at(-1)), d = n === 0 && at(s[0], e[0]) ? t.startCap ?? i : i, f = n + 1 === c.length && at(s.at(-1), e.at(-1)) ? t.endCap ?? i : i, p = [];
		for (let e = 0; e + 1 < s.length; e++) {
			let t = s[e], n = s[e + 1], r = Math.hypot(n.x - t.x, n.y - t.y);
			p.push(r > Q ? {
				x: (n.x - t.x) / r,
				y: (n.y - t.y) / r
			} : null);
		}
		for (let e = 0; e + 1 < s.length; e++) {
			let n = p[e];
			if (!n) continue;
			let i = {
				x: -n.y * r,
				y: n.x * r
			}, a = e === 0, o = e + 2 === s.length, c = Math.min(.5, r / 2), m = u || !a || t.overlapStart === !0, h = u || !o || t.overlapEnd === !0, g = !u && a && d === "square" ? r : m ? c : 0, _ = !u && o && f === "square" ? r : h ? c : 0, v = {
				...s[e],
				x: s[e].x - n.x * g,
				y: s[e].y - n.y * g
			}, y = {
				...s[e + 1],
				x: s[e + 1].x + n.x * _,
				y: s[e + 1].y + n.y * _
			};
			if (!l(st("segment", [
				{
					...v,
					x: v.x + i.x,
					y: v.y + i.y
				},
				{
					...y,
					x: y.x + i.x,
					y: y.y + i.y
				},
				{
					...y,
					x: y.x - i.x,
					y: y.y - i.y
				},
				{
					...v,
					x: v.x - i.x,
					y: v.y - i.y
				}
			]))) return null;
		}
		if (!u && d === "round" && !l(ct(s[0], r, "cap")) || !u && f === "round" && !l(ct(s.at(-1), r, "cap"))) return null;
		let m = (e, t, n) => {
			if (!t || !n) return !0;
			let i = t.x * n.y - t.y * n.x;
			if (Math.abs(i) <= Q) return !0;
			if (a === "round") return l(ct(e, r, "join"));
			let s = i > 0 ? -1 : 1, c = {
				...e,
				x: e.x + -t.y * r * s,
				y: e.y + t.x * r * s
			}, u = {
				...e,
				x: e.x + -n.y * r * s,
				y: e.y + n.x * r * s
			};
			if (a === "miter") {
				let i = ut(c, t, u, n);
				if (i && Math.hypot(i.x - e.x, i.y - e.y) <= r * o) return !!l(st("join", [
					c,
					{
						...e,
						...i
					},
					u
				]));
			}
			return l(st("join", [
				c,
				e,
				u
			]));
		};
		for (let e = 1; e + 1 < s.length; e++) if (!m(s[e], p[e - 1], p[e])) return null;
		if (u && !m(s[0], p.at(-1) ?? null, p[0] ?? null)) return null;
	}
	return s;
}
var ft = 1e-9, pt = (e, t) => Math.hypot(e.x - t.x, e.y - t.y, e.depth - t.depth) <= ft, mt = (e, t) => e.x - t.x || e.y - t.y || e.depth - t.depth, ht = (e, t) => {
	let n = Math.min(e.length, t.length);
	for (let r = 0; r < n; r++) {
		let n = mt(e[r], t[r]);
		if (n !== 0) return n;
	}
	return e.length - t.length;
};
function gt(e) {
	let t = [...e].reverse();
	return ht(e, t) <= 0 ? e : t;
}
function _t(e) {
	let t = pt(e[0], e.at(-1)) ? e.slice(0, -1) : [...e];
	if (t.length === 0) return [];
	let n = 0;
	for (let e = 1; e < t.length; e++) mt(t[e], t[n]) < 0 && (n = e);
	let r = t.map((e, r) => t[(n + r) % t.length]), i = t.map((e, r) => t[(n - r + t.length) % t.length]), a = ht(r, i) <= 0 ? r : i;
	return [...a, a[0]];
}
function vt(e) {
	let t = [], n = (e) => {
		let n = t.find((t) => pt(t.point, e));
		if (n) return mt(e, n.point) < 0 && (n.point = e), n;
		let r = {
			point: e,
			edges: [],
			order: -1
		};
		return t.push(r), r;
	}, r = [];
	for (let [t, i] of e) {
		if (pt(t, i)) continue;
		let e = n(t), a = n(i);
		e !== a && r.push([e, a]);
	}
	t.sort((e, t) => mt(e.point, t.point)), t.forEach((e, t) => {
		e.order = t;
	});
	let i = [], a = /* @__PURE__ */ new Set();
	for (let [e, t] of r) {
		let n = e.order < t.order ? e : t, r = e.order < t.order ? t : e, o = `${n.order}:${r.order}`;
		a.has(o) || (a.add(o), i.push({
			first: n,
			second: r,
			key: o
		}));
	}
	i.sort((e, t) => e.key.localeCompare(t.key)), i.forEach((e, t) => {
		e.first.edges.push(t), e.second.edges.push(t);
	});
	for (let e of t) e.edges.sort((e, t) => e - t);
	let o = /* @__PURE__ */ new Set(), s = (e, t) => {
		let n = [e.point], r = e, a = t;
		for (; !o.has(a);) {
			o.add(a);
			let e = i[a], t = e.first === r ? e.second : e.first;
			if (n.push(t.point), t.edges.length !== 2) break;
			let s = t.edges.find((e) => !o.has(e));
			if (s === void 0) break;
			r = t, a = s;
		}
		return n;
	}, c = [];
	for (let e of t) if (e.edges.length !== 2) for (let t of e.edges) o.has(t) || c.push(gt(s(e, t)));
	for (let e = 0; e < i.length; e++) {
		if (o.has(e)) continue;
		let t = i[e], n = t.first.order <= t.second.order ? t.first : t.second;
		c.push(_t(s(n, e)));
	}
	let l = t.filter((e) => e.edges.length > 2).map((e) => ({
		point: e.point,
		neighbours: e.edges.map((t) => {
			let n = i[t];
			return n.first === e ? n.second.point : n.first.point;
		}).sort(mt)
	}));
	return {
		paths: c.sort(ht),
		junctions: l
	};
}
function yt(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.legendEntries ?? []) t.set(n.idx, n);
	return t;
}
function bt(e, t, n) {
	let r = G(t?.fontSizeHpt ?? e.legendFontSizeHpt, n) ?? 9 * n, i = t?.fontFace ?? e.legendFontFace, a = t?.fontBold ?? e.legendFontBold ?? !1;
	return {
		fontPx: r,
		font: `${t?.fontItalic ?? e.legendFontItalic ?? !1 ? "italic " : ""}${a ? "bold " : ""}${r}px ${Lt(e, i)}`,
		color: t?.fontColor ? `#${t.fontColor}` : e.legendFontColor ? `#${e.legendFontColor}` : "#595959"
	};
}
var xt = [
	"4472C4",
	"ED7D31",
	"70AD47",
	"A5A5A5",
	"FFC000",
	"5B9BD5"
], St = ae, Ct = ne, wt = new Set([
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
function Tt(e, t) {
	let n = Number.isFinite(t) && t > 0 ? t / f : 1, r = Number.isFinite(e) && e >= 0 ? e / b : 0;
	return Math.max(.25, r) * n;
}
function Et(e, t) {
	let n = Number.isSafeInteger(t) && t > 0 ? t : 0, r = Array.from({ length: n }, () => []);
	for (let t of e) {
		let e = t.categoryIndex;
		Number.isSafeInteger(e) && e >= 0 && e < n && r[e].push(t);
	}
	return r;
}
var Dt = (e, t) => `#${t?.color ?? xt[e % xt.length]}`;
function Ot(e, t, n) {
	let r = 0;
	for (let a of e) for (let e of [t(a), n(a)]) {
		if (e == null) continue;
		let t = i(e);
		if (e.fillType === "gradient" && t > St || t > Ct - r) return !1;
		r += t;
	}
	return !0;
}
function kt(e, t) {
	let n = Array.from({ length: t }, () => ({
		maxMagnitude: 0,
		scaledTotal: 0
	}));
	for (let r of e.series) for (let e = 0; e < t; e++) {
		let t = r.values[e];
		t != null && Number.isFinite(t) && (n[e].maxMagnitude = Math.max(n[e].maxMagnitude, Math.abs(t)));
	}
	for (let r of e.series) for (let e = 0; e < t; e++) {
		let t = r.values[e], i = n[e].maxMagnitude;
		t != null && Number.isFinite(t) && i > 0 && (n[e].scaledTotal += Math.abs(t) / i);
	}
	return n;
}
function At(e, t, n, r) {
	let i = e.series[t]?.values[n] ?? 0;
	if (!Number.isFinite(i)) return 0;
	if (!r) return i;
	let { maxMagnitude: a, scaledTotal: o } = r[n] ?? {
		maxMagnitude: 0,
		scaledTotal: 0
	};
	return a > 0 && o > 0 ? i / a / o * 100 : 0;
}
function jt(e, t) {
	let n = e + t;
	return Number.isFinite(n) ? n : t < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
}
function Mt(e) {
	let t = [];
	for (let [n, r] of [
		[e.threeD?.floor, "floor"],
		[e.threeD?.sideWall, "wall"],
		[e.threeD?.backWall, "wall"]
	]) {
		let i = N(e, n, r);
		t.push({
			fill: i.fill,
			line: i.line
		});
	}
	if (e.chartType === "pie") {
		let n = e.series[0];
		if (n) {
			let r = new Map(n.dataPointOverrides?.map((e) => [e.idx, e]) ?? []);
			for (let i = 0; i < n.values.length; i++) {
				let a = n.values[i];
				if (a == null || !Number.isFinite(a) || Math.abs(a) <= 0) continue;
				let o = $(e, n, r.get(i), i, 0);
				t.push({
					fill: o.fill,
					line: o.lineFill
				});
			}
		}
	} else if (e.chartType === "clusteredBar" || e.chartType === "clusteredBarH" || e.chartType.startsWith("stackedBar")) {
		let n = e.chartType.startsWith("stacked"), r = e.chartType.endsWith("Pct"), i = n || e.dispBlanksAs === "zero", a = e.valAxisLogBase != null && Number.isFinite(e.valAxisLogBase) && e.valAxisLogBase >= 2, o = Math.max(1, e.categories.length, ...e.series.map((e) => Math.max(e.values.length, e.categories?.length ?? 0))), s = r ? kt(e, o) : void 0, c = (t, n) => {
			if (t === n) return !1;
			let r = Math.min(t, n), i = Math.max(t, n), o = e.valMin, s = e.valMax;
			return o != null && Number.isFinite(o) && i <= o || s != null && Number.isFinite(s) && r >= s ? !1 : !a || i > 0;
		}, l = Array(o).fill(0), u = Array(o).fill(0);
		for (let r = 0; r < e.series.length; r++) {
			let d = e.series[r], f = new Map(d.dataPointOverrides?.map((e) => [e.idx, e]) ?? []);
			for (let p = 0; p < o; p++) {
				let o = d.values[p];
				if (!(o != null && Number.isFinite(o) && (!a || o > 0) || o == null && i)) continue;
				let m = At(e, r, p, s), h = n ? m >= 0 ? l[p] : u[p] : 0, g = jt(h, m);
				if (n && (m >= 0 ? l[p] = g : u[p] = g), !c(h, g)) continue;
				let _ = $(e, d, f.get(p), p, r);
				t.push({
					fill: _.fill,
					line: _.lineFill
				});
			}
		}
	} else {
		let n = e.chartType.toLowerCase().includes("area"), r = e.chartType.startsWith("stacked"), i = e.chartType.endsWith("Pct"), a = r || e.dispBlanksAs === "zero", o = e.valAxisLogBase != null && Number.isFinite(e.valAxisLogBase) && e.valAxisLogBase >= 2, s = Math.max(e.categories.length, ...e.series.map((e) => Math.max(e.categories?.length ?? 0, e.values.length))), c = i ? kt(e, s) : void 0, l = e.series.map(() => Array(s).fill(0));
		if (r) {
			let t = Array(s).fill(0), n = Array(s).fill(0);
			for (let r = 0; r < e.series.length; r++) for (let i = 0; i < s; i++) {
				let a = At(e, r, i, c), o = jt(a >= 0 ? t[i] : n[i], a);
				l[r][i] = o, a >= 0 ? t[i] = o : n[i] = o;
			}
		}
		for (let i = 0; i < e.series.length; i++) {
			let u = e.series[i], d = new Map(u.dataPointOverrides?.map((e) => [e.idx, e]) ?? []), f = s, p = 0, m = null, h = !1, g = !1;
			for (let s = 0; s < f; s++) {
				let f = u.values[s];
				if (f != null && Number.isFinite(f) && (!o || f > 0) || f == null && a) {
					p++;
					let a = r ? l[i][s] : At(e, i, s, c), o = m == null ? a : Math.min(m, a), f = m == null ? a : Math.max(m, a), _ = e.valMin != null && Number.isFinite(e.valMin) && f <= e.valMin || e.valMax != null && Number.isFinite(e.valMax) && o >= e.valMax;
					if (p >= 2 && (n || u.smooth === !0 || !_)) {
						if (h = !0, n) break;
						let r = d.get(s);
						if (Pt(r)) {
							let n = $(e, u, r, s, i);
							t.push({
								fill: void 0,
								line: n.lineFill
							});
						} else g = !0;
					}
					m = a;
				} else (e.dispBlanksAs ?? "gap") === "gap" && (p = 0, m = null);
			}
			if (!h) continue;
			let _ = $(e, u, void 0, i, i);
			n ? t.push({
				fill: _.fill,
				line: _.lineFill
			}) : g && t.push({
				fill: void 0,
				line: _.lineFill
			});
		}
	}
	return Ot(t, (e) => e.fill, (e) => e.line);
}
function Nt(e, t) {
	return e?.fillType === "solid" ? {
		color: `#${e.color}`,
		fill: void 0
	} : {
		color: t,
		fill: e
	};
}
function $(t, n, r, i, a, o = !0) {
	let s = o && n.dataPointColors?.[i] ? `#${n.dataPointColors[i]}` : Dt(a, n), c = te(t, a) ? i : n.chartexFormatIdx ?? a, l = n.seriesType ?? t.chartType, u = l === "line" || l === "stackedLine" || l === "stackedLinePct", d = e(t, "dataPoint3D", a), f = oe(t, "dataPoint3D"), p, h = s, g = Re(t, n, r, i, a);
	g !== void 0 && ({color: h, fill: p} = Nt(g, h));
	let _, v = null, y = O(r?.chartexStyle, f, i);
	if (y === void 0 && r?.lineHidden === !0 && (y = m(f)), y !== void 0) y?.fillType === "solid" ? v = `#${y.color}` : _ = y;
	else if (r?.lineColor) v = `#${r.lineColor}`;
	else {
		let e = O(n.chartexStyle, f, c);
		if (e === void 0 && n.lineHidden === !0 && (e = m(f)), e !== void 0) e?.fillType === "solid" ? v = `#${e.color}` : _ = e;
		else if (n.lineColor) v = `#${n.lineColor}`;
		else if (u) _ = p === null ? null : p;
		else {
			let e = j(d, f, c, r?.chartexStyle, n.chartexStyle);
			e !== void 0 && (e?.fillType === "solid" ? v = `#${e.color}` : _ = e);
		}
	}
	let b = u ? void 0 : d, x = r?.chartexStyle?.lineCap ?? n.chartexStyle?.lineCap ?? b?.lineCap, S = r?.chartexStyle?.lineJoin ?? n.chartexStyle?.lineJoin ?? b?.lineJoin, C = L(r?.lineDash == null ? r?.chartexStyle : {
		lineDash: r.lineDash,
		lineDashAuthored: !0
	}, n.chartexStyle, b);
	return {
		color: h,
		fill: p,
		lineColor: v,
		lineFill: _,
		lineWidthEmu: r?.lineWidthEmu ?? r?.chartexStyle?.lineWidthEmu ?? n.lineWidthEmu ?? n.chartexStyle?.lineWidthEmu ?? b?.lineWidthEmu,
		lineDash: C?.lineDash,
		lineCustomDash: C?.lineCustomDash,
		lineCap: x === "rnd" ? "round" : x === "sq" ? "square" : "butt",
		lineJoin: S === "round" || S === "bevel" ? S : "miter"
	};
}
function Pt(e) {
	if (!e) return !1;
	let t = e.chartexStyle;
	return e.lineHidden != null || e.lineColor != null || e.lineWidthEmu != null || e.lineDash != null || t?.linePaintAuthored === !0 || t?.lineHidden != null || t?.lineNoStyle === !0 || t?.lineColors?.some((e) => e != null) === !0 || t?.linePaints?.some((e) => e != null) === !0 || t?.lineWidthEmu != null || t?.lineDash != null || t?.lineCustomDash != null || t?.lineCap != null || t?.lineJoin != null;
}
function Ft(e, t) {
	let n = e.cameraNormal(t);
	if (!n) return 1;
	let r = {
		x: -.2,
		y: .25,
		z: 1
	}, i = Math.hypot(r.x, r.y, r.z), a = Math.max(0, (n.x * r.x + n.y * r.y + n.z * r.z) / i);
	return Math.max(.78, Math.min(1, .78 + .24 * a));
}
var It = (e) => `"${e && !e.startsWith("+") ? e.replace(/["\\]/g, "") : "Arial"}"`, Lt = (e, t) => It(ge(e, t)), Rt = (e, t, n = "minor") => It((t?.startsWith("+mj-") ? e.themeMajorFontLatin : t?.startsWith("+mn-") ? e.themeMinorFontLatin : t) ?? (n === "major" ? e.themeMajorFontLatin : e.themeMinorFontLatin));
function zt(e, t) {
	if (t.length) {
		e.beginPath(), e.moveTo(t[0].x, t[0].y);
		for (let n = 1; n < t.length; n++) e.lineTo(t[n].x, t[n].y);
		e.closePath();
	}
}
var Bt = (e) => e === "transparent" || e === "#00000000" || e === "rgba(0,0,0,0)";
function Vt(e, t, n, r) {
	Bt(n) || (zt(e, t), e.fillStyle = n, e.fill(), r > 0 && (zt(e, t), e.fillStyle = `rgba(0,0,0,${r})`, e.fill()));
}
function Ht(e, t, n, r, i, a, o, s, c, l, u, d) {
	return Ke({
		x0: t,
		x1: n,
		lower0: r,
		lower1: i,
		upper0: a,
		upper1: o,
		nearDepth: s,
		farDepth: c,
		capStart: u,
		capEnd: d
	}).flatMap((t) => Wt(e, t, l).map((e) => ({
		...e,
		outline: !1,
		outlineSegments: void 0
	})));
}
function Ut(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m = !1, h = !1, g, _) {
	if (![
		r,
		i,
		a,
		o,
		s,
		c,
		l,
		u
	].every(Number.isFinite) || a <= 0 || o <= 0 || s === c) return [];
	let v = We({
		shape: t,
		horizontal: n,
		crossStart: n ? i : r,
		crossSize: n ? o : a,
		baseCoord: s,
		endCoord: c,
		nearDepth: l,
		farDepth: u,
		baseScale: f,
		endScale: p,
		omitBaseCap: m,
		omitEndCap: h
	});
	return v ? Wt(e, v, d, g, _) : [];
}
function Wt(e, t, n, r, i, a = !1) {
	if (i?.exceeded) return [];
	let o = t.faces.map((r) => {
		let i = r.indices.map((e) => t.vertices[e]), a = e.cameraFacing(i);
		if (!a) return {
			meshFace: r,
			facing: a,
			face: null
		};
		let o = i.map((t) => e.project(t.x, t.y, t.depth)), s = o.reduce((e, t, n) => {
			let r = o[(n + 1) % o.length];
			return e + t.x * r.y - t.y * r.x;
		}, 0);
		return !Number.isFinite(s) || Math.abs(s) < 1e-7 ? {
			meshFace: r,
			facing: a,
			face: null
		} : {
			meshFace: r,
			facing: a,
			face: {
				points: o,
				color: Ne(n, Ft(e, i)),
				paintRole: "fill",
				shade: 0,
				cameraDepth: i.reduce((t, n) => t + e.cameraDepth(n.x, n.y, n.depth), 0) / i.length,
				cameraDepths: i.map((t) => e.cameraDepth(t.x, t.y, t.depth)),
				cameraWeights: i.map((t) => e.cameraProjectionWeight(t.x, t.y, t.depth)),
				outline: !1
			}
		};
	}), s = a ? [] : o.map((e) => e.face).filter((e) => e != null);
	if (i) {
		if (s.length > i.remaining) return i.exceeded = !0, [];
		i.remaining -= s.length;
	}
	let c = /* @__PURE__ */ new Map(), l = (e, t) => {
		if (e === t) return;
		let n = e < t ? `${e}:${t}` : `${t}:${e}`;
		c.has(n) || c.set(n, [e, t]);
	};
	for (let e of o) {
		if (!e.facing || !e.face) continue;
		let { indices: t, smoothSurface: n, role: r } = e.meshFace;
		if (!(n && r === "side")) for (let e = 0; e < t.length; e++) l(t[e], t[(e + 1) % t.length]);
	}
	let u = o.filter((e) => e.meshFace.role === "side").sort((e, t) => (e.meshFace.segmentIndex ?? 0) - (t.meshFace.segmentIndex ?? 0));
	if (t.silhouetteEdges.length === u.length && u.length > 0) for (let e = 0; e < u.length; e++) {
		let n = u[(e + u.length - 1) % u.length], r = u[e];
		if (n.facing === r.facing || !(r.facing ? r.face : n.face)) continue;
		let [i, a] = t.silhouetteEdges[e];
		l(i, a);
	}
	let d = o.some((e) => e.meshFace.role === "baseCap" && e.facing && e.face != null), f = o.some((e) => e.meshFace.role === "endCap" && e.facing && e.face != null);
	for (let e of u) {
		if (!e.facing || !e.face) continue;
		let t = [d ? void 0 : e.meshFace.baseRimEdge, f ? void 0 : e.meshFace.endRimEdge].filter((e) => e != null);
		for (let [e, n] of t) l(e, n);
	}
	let p = vt([...c.values()].map(([e, n]) => [t.vertices[e], t.vertices[n]]));
	if (!r) return s;
	let m = (e, t) => Math.hypot(e.x - t.x, e.y - t.y, e.depth - t.depth) <= 1e-9, h = (e) => p.junctions.some((t) => m(t.point, e));
	for (let t of p.paths) {
		let n = t.map((t) => e.project(t.x, t.y, t.depth)), a = t.map((t) => e.cameraDepth(t.x, t.y, t.depth)), o = t.map((t) => e.cameraProjectionWeight(t.x, t.y, t.depth)), c = dt(n.map((e, t) => ({
			...e,
			cameraDepth: a[t],
			cameraWeight: o[t]
		})), {
			width: r.width,
			dash: r.dash,
			lineCap: r.cap,
			startCap: h(t[0]) ? "butt" : r.cap,
			endCap: h(t.at(-1)) ? "butt" : r.cap,
			overlapStart: h(t[0]),
			overlapEnd: h(t.at(-1)),
			lineJoin: r.join
		});
		if (!c || i && c.length > i.remaining) return i && (i.exceeded = !0), [];
		i && (i.remaining -= c.length), s.push(...c.map((e) => {
			let t = 1e-6 * Math.max(1, Math.abs(e.cameraDepth));
			return {
				points: e.points,
				color: r.color,
				paintRole: "outline",
				shade: 0,
				cameraDepth: e.cameraDepth + t,
				cameraDepths: e.cameraDepths?.map((e) => e + t),
				cameraWeights: e.cameraWeights,
				outline: !1
			};
		}));
	}
	for (let t of p.junctions) {
		let n = lt({
			...e.project(t.point.x, t.point.y, t.point.depth),
			cameraDepth: e.cameraDepth(t.point.x, t.point.y, t.point.depth),
			cameraWeight: e.cameraProjectionWeight(t.point.x, t.point.y, t.point.depth)
		}, t.neighbours.map((t) => ({
			...e.project(t.x, t.y, t.depth),
			cameraDepth: e.cameraDepth(t.x, t.y, t.depth),
			cameraWeight: e.cameraProjectionWeight(t.x, t.y, t.depth)
		})), {
			width: r.width,
			lineJoin: r.join
		});
		if (!n) continue;
		if (i && i.remaining < 1) return i.exceeded = !0, [];
		i && --i.remaining;
		let a = 1e-6 * Math.max(1, Math.abs(n.cameraDepth));
		s.push({
			points: n.points,
			color: r.color,
			paintRole: "outline",
			shade: 0,
			cameraDepth: n.cameraDepth + a,
			cameraDepths: n.cameraDepths?.map((e) => e + a),
			cameraWeights: n.cameraWeights,
			outline: !1
		});
	}
	return s;
}
function Gt(e, t, n, r, i, a, o) {
	if (!t.length || o.exceeded) return [];
	let s = [...t].sort((e, t) => e.start - t.start), c = n - i / 2, l = n + i / 2, u = s[0], d = e.cameraDepth(u.centerX, c, u.centerDepth) >= e.cameraDepth(u.centerX, l, u.centerDepth) ? c : l, f = d === c ? l : c, p = (t, n, i) => ({
		x: t.centerX + Math.cos(n) * r,
		y: i,
		depth: t.centerDepth + Math.sin(n) * r / e.modelDepth
	}), m = (e) => ({
		x: e.centerX,
		y: d,
		depth: e.centerDepth
	}), h = [], g = (t, n = !1) => {
		if (t.length < 2 || o.exceeded) return;
		let r = t[0], i = t.at(-1), s = Math.hypot(r.x - i.x, r.y - i.y, r.depth - i.depth) <= 1e-9, c = dt((n && !s ? [...t, r] : [...t]).map((t) => ({
			...e.project(t.x, t.y, t.depth),
			cameraDepth: e.cameraDepth(t.x, t.y, t.depth),
			cameraWeight: e.cameraProjectionWeight(t.x, t.y, t.depth)
		})), {
			width: a.width,
			dash: a.dash,
			lineCap: a.cap,
			startCap: "butt",
			endCap: "butt",
			lineJoin: a.join
		});
		if (!c || c.length > o.remaining) {
			o.exceeded = !0;
			return;
		}
		o.remaining -= c.length;
		for (let e of c) {
			let t = 1e-6 * Math.max(1, Math.abs(e.cameraDepth));
			h.push({
				points: e.points,
				color: a.color,
				paintRole: "outline",
				shade: 0,
				cameraDepth: e.cameraDepth + t,
				cameraDepths: e.cameraDepths?.map((e) => e + t),
				cameraWeights: e.cameraWeights,
				outline: !1
			});
		}
	}, _ = [], v = [], y = [], b = /* @__PURE__ */ new Set(), x = (e) => {
		let t = Math.PI * 2, n = (e % t + t) % t;
		return (n < 1e-8 || t - n < 1e-8 ? 0 : n).toFixed(8);
	}, S = /* @__PURE__ */ new Map();
	for (let t of s) {
		S.set(x(t.start), {
			slice: t,
			angle: t.start
		}), S.set(x(t.end), {
			slice: t,
			angle: t.end
		});
		for (let n = 0; n <= t.segments; n++) {
			let r = t.start + (t.end - t.start) * n / t.segments, i = p(t, r, d);
			if ((!_.length || Math.hypot(_.at(-1).x - i.x, _.at(-1).y - i.y, _.at(-1).depth - i.depth) > 1e-9) && _.push(i), n === t.segments) continue;
			let a = t.start + (t.end - t.start) * (n + 1) / t.segments, o = p(t, r, c), s = p(t, r, l), u = p(t, a, l), m = p(t, a, c);
			if (e.cameraFacing([
				o,
				s,
				u,
				m
			])) {
				let e = p(t, r, f), n = p(t, a, f);
				y.length || y.push(e), y.push(n), b.add(x(r)), b.add(x(a));
			} else y.length && (v.push(y), y = []);
		}
	}
	if (y.length && v.push(y), v.length > 1) {
		let e = v[0], t = v.at(-1), n = e[0], r = t.at(-1);
		Math.hypot(n.x - r.x, n.y - r.y, n.depth - r.depth) <= 1e-9 && (v[0] = [...t, ...e.slice(1)], v.pop());
	}
	g(_, !0);
	let C = /* @__PURE__ */ new Map();
	for (let { slice: e, angle: t } of S.values()) g([m(e), p(e, t, d)]), b.has(x(t)) && C.set(x(t), {
		slice: e,
		angle: t
	});
	for (let t of v) {
		g(t);
		for (let n of [t[0], t.at(-1)]) {
			let t = Math.atan2((n.depth - u.centerDepth) * e.modelDepth, n.x - u.centerX);
			C.set(x(t), {
				slice: u,
				angle: t
			});
		}
	}
	for (let { slice: e, angle: t } of C.values()) g([p(e, t, d), p(e, t, f)]);
	return h;
}
function Kt(e, t) {
	t.paint !== null && (t.paint === void 0 ? Vt(e, t.points, t.color, t.shade) : (zt(e, t.points), e.fillStyle = t.paint, e.fill()), t.outline && (e.strokeStyle = t.outlineColor ?? "rgba(0,0,0,0.42)", e.lineWidth = t.outlineWidth ?? .75, e.setLineDash(Se(t.outlineDash ?? "solid", e.lineWidth)), e.lineCap = t.outlineCap ?? "butt", e.lineJoin = t.outlineJoin ?? "miter", t.outline && (zt(e, t.points), e.stroke()), e.setLineDash([])));
}
function qt(e, t) {
	let n = t.filter((e) => e.paint !== null && e.points.length >= 3);
	if (n.length) {
		e.beginPath();
		for (let t of n) {
			e.moveTo(t.points[0].x, t.points[0].y);
			for (let n = 1; n < t.points.length; n++) e.lineTo(t.points[n].x, t.points[n].y);
			e.closePath();
		}
		e.fillStyle = "#000000", e.fill();
	}
}
function Jt(e, t, n, r, i) {
	if (r === void 0) return;
	let a = t.filter((e) => e.paintRole === n);
	if (!a.length) return;
	if (r === null) {
		for (let e of a) e.paint = null;
		return;
	}
	let o = a.flatMap((e) => e.points), s = Math.min(...o.map((e) => e.x)), c = Math.max(...o.map((e) => e.x)), l = Math.min(...o.map((e) => e.y)), u = Math.max(...o.map((e) => e.y)), d = se(r, e, s, l, c - s, u - l, i);
	for (let e of a) e.paint = d;
}
function Yt(e, t) {
	e.fillStyle = "#888", e.font = "12px sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText("(too many data points)", t.x + t.w / 2, t.y + t.h / 2);
}
function Xt(e) {
	let t = e.catAxisLabelRotation;
	return t == null ? null : !Number.isFinite(t) || Math.abs(t) > 54e5 ? 0 : t / 6e4 * Math.PI / 180;
}
function Zt(e) {
	return Math.max(e * 1.2, 10);
}
function Qt(e, t) {
	let n = Math.max(1, ...e.map(F));
	return n > 1 ? (n - 1) * Zt(t) : 0;
}
function $t(e, t, n, r, i, a = 1, o = 6, s = 0) {
	if (i || r === 0) {
		e.textAlign = i ? "right" : "center", e.textBaseline = i ? "middle" : a < 0 ? "bottom" : "top", R(e, t, n.x + (i ? -o : 0), n.y + (i ? 0 : a * o), s);
		return;
	}
	e.save(), e.translate(n.x, n.y + a * o), e.rotate(r), e.textAlign = a < 0 ? "left" : "right", e.textBaseline = "middle", R(e, t, 0, 0, s), e.restore();
}
function en(e, t, n, r, i, a, o, s = void 0, c = 0, l = f, u = void 0, d = void 0, p = 0, m = p, h = void 0, g = void 0, _ = void 0, v = void 0, y = void 0) {
	if (!(r > 0) || !Number.isFinite(t.x) || !Number.isFinite(t.y)) return;
	let b = r / 2;
	if (u !== void 0 || d !== void 0) {
		S(e, u, d, p, {
			x: t.x - b,
			y: t.y - b,
			w: r,
			h: r
		}, l, (e) => en(e, t, n, r, i, a, o, s, c, l, void 0, void 0, 0, 0, h, g, _, v, y), m);
		return;
	}
	e.beginPath();
	let x = h === void 0 ? a : h == null ? null : h.fillType === "solid" ? `#${h.color}` : se(h, e, t.x - b, t.y - b, r, r, c);
	switch (x && (e.strokeStyle = x, e.lineWidth = o, e.setLineDash(C(_, g, o)), e.lineCap = v === "rnd" ? "round" : v === "sq" ? "square" : "butt", e.lineJoin = y === "round" || y === "bevel" ? y : "miter"), n) {
		case "square":
			e.rect(t.x - b, t.y - b, r, r);
			break;
		case "diamond":
			e.moveTo(t.x, t.y - b), e.lineTo(t.x + b, t.y), e.lineTo(t.x, t.y + b), e.lineTo(t.x - b, t.y), e.closePath();
			break;
		case "triangle":
			e.moveTo(t.x, t.y - b), e.lineTo(t.x + b, t.y + b), e.lineTo(t.x - b, t.y + b), e.closePath();
			break;
		case "x":
		case "plus": {
			let r = n === "x";
			e.moveTo(t.x - b, t.y + (r ? -b : 0)), e.lineTo(t.x + b, t.y + (r ? b : 0)), e.moveTo(t.x + (r ? -b : 0), t.y + b), e.lineTo(t.x + (r ? b : 0), t.y - b), x && e.stroke();
			return;
		}
		case "dash":
			e.rect(t.x - b, t.y - r * .1, r, r * .2);
			break;
		case "star":
			for (let n = 0; n < 10; n++) {
				let r = -Math.PI / 2 + n * Math.PI / 5, i = n % 2 == 0 ? b : b * .4, a = t.x + Math.cos(r) * i, o = t.y + Math.sin(r) * i;
				n ? e.lineTo(a, o) : e.moveTo(a, o);
			}
			e.closePath();
			break;
		case "dot":
			e.ellipse(t.x, t.y, r * .25, r * .1, 0, 0, Math.PI * 2);
			break;
		case "picture":
			s?.fillType === "image" && ue(e, s, t.x - b, t.y - b, r, r, l, c), x && e.strokeRect(t.x - b, t.y - b, r, r);
			return;
		default:
			e.arc(t.x, t.y, b, 0, Math.PI * 2);
			break;
	}
	let w = s?.fillType === "image" ? s : void 0, T = w ? null : s === void 0 ? i === "transparent" ? null : i : s == null ? null : se(s, e, t.x - b, t.y - b, r, r, c);
	T == null ? w && (e.save(), e.clip(), ue(e, w, t.x - b, t.y - b, r, r, l, c), e.restore()) : (e.fillStyle = T, e.fill()), x && e.stroke();
}
function tn(e, t, r, i, a, o, s, c, l, f = 0, p, m, g = "t", _ = s, v = !0, y, x, S = o, C = 0) {
	let w = m, T = r.seriesDataLabels;
	if (d(T, w) || t.showDataLabelsOverMax !== !0 && x != null && Number.isFinite(x) && S > x) return;
	let O = w?.showVal ?? T?.showVal ?? t.showDataLabels, A = w?.showCatName ?? T?.showCatName ?? !1, j = w?.showSerName ?? T?.showSerName ?? !1, N = w?.showPercent ?? T?.showPercent ?? !1, P = w?.text, F = B({
		customText: P,
		showCategory: A,
		showSeries: j,
		showValue: O,
		showPercent: N,
		category: r.categories?.[a] ?? t.categories[a] ?? `${a + 1}`,
		seriesName: r.name || `Series ${i + 1}`,
		sourceValue: o,
		valueDivisor: y?.divisor,
		percentRatio: p != null && Number.isFinite(p) ? p : void 0,
		formatCode: w?.formatCode ?? T?.formatCode ?? t.dataLabelFormatCode ?? r.valFormatCode,
		percentFormatCode: w?.formatCode ?? T?.formatCode ?? t.dataLabelFormatCode ?? "0%",
		date1904: t.date1904,
		separator: w?.separator ?? T?.separator
	});
	if (!F) return;
	let I = G(w?.fontSizeHpt ?? T?.fontSizeHpt ?? t.dataLabelFontSizeHpt, l) ?? 9 * l, L = w?.fontBold ?? T?.fontBold ?? t.dataLabelFontBold ?? !1, R = E(w, T), z = Rt(t, w?.fontFace ?? T?.fontFace ?? t.dataLabelFontFace);
	e.font = `${R.fontItalic ? "italic " : ""}${L ? "bold " : ""}${I}px ${z}`;
	let V = `#${w?.fontColor ?? T?.fontColor ?? r.labelColor ?? t.dataLabelFontColor ?? "111111"}`, H = P && w?.richRuns?.length ? Fe(e, {
		runs: w.richRuns,
		ptToPx: l,
		fontFamily: z,
		fallbackBold: L,
		fallbackItalic: R.fontItalic,
		fallbackBaseline: R.fontBaseline,
		fallbackColorHidden: R.fontPaintAuthored === !0 && (R.fontHidden === !0 || R.fontColor == null),
		fontFamilyForFace: (e) => Rt(t, e)
	}, I, V) : null, U = H ? [] : k(F, Math.max(I, c.w * .45), Math.max(I * 1.2, c.h * .35), I * 1.2, (t) => e.measureText(t).width, R);
	if (!H && !U.length) return;
	let ee = H?.width ?? Math.max(...U.map((t) => e.measureText(t).width)), te = H?.height ?? U.length * I * 1.2, W = D(R, l), K = u(ee + W.left + W.right, te + W.top + W.bottom, R.textRotation, R.textVerticalMode), q = M({
		kind: "point",
		x: s.x,
		y: s.y,
		position: w?.position ?? T?.position ?? t.dataLabelPosition ?? g,
		markerGap: f
	}, c, {
		w: K.w,
		h: K.h
	}, I, w?.manualLayout, c);
	if (!q) return;
	let J = fe(w?.labelBox, T?.labelBox);
	T?.showLeaderLines && T.leaderLineHidden !== !0 && v && (e.beginPath(), e.moveTo(_.x, _.y), e.lineTo(Math.max(q.rect.x, Math.min(_.x, q.rect.x + q.rect.w)), Math.max(q.rect.y, Math.min(_.y, q.rect.y + q.rect.h))), e.strokeStyle = `#${T.leaderLineColor ?? "808080"}`, e.lineWidth = T.leaderLineWidthEmu == null ? .75 * l : Math.max(.25, T.leaderLineWidthEmu / b * l), e.setLineDash(Se(T.leaderLineDash ?? "solid", e.lineWidth)), e.stroke()), ye(e, J, q.rect, l, C), e.save(), e.beginPath(), e.rect(q.clip.x, q.clip.y, q.clip.w, q.clip.h), e.clip();
	let Y = n(R, q.textAlign), ne = be(q.x, q.y, q.rect, te + W.top + W.bottom, R, w?.manualLayout != null, Y, q.textAlign, ee + W.left + W.right, K.radians), X = h(e, ne.x, ne.y, K.radians, Y, q.textBaseline, W);
	if (H) {
		Pe(e, H, X.x, X.y, Y, q.textBaseline, w?.manualLayout ? Math.max(0, q.rect.w - W.left - W.right) : H.width), e.restore();
		return;
	}
	if (!(R.fontPaintAuthored === !0 && (R.fontHidden === !0 || R.fontColor == null))) {
		e.fillStyle = V, e.textAlign = Y, e.textBaseline = "middle";
		let t = I * 1.2, n = (R.fontBaseline ?? 0) * I, r = X.y - (U.length - 1) * t / 2 - n;
		U.forEach((n, i) => e.fillText(n, X.x, r + i * t));
	}
	e.restore();
}
function nn(e, t, n) {
	let r = t.seriesDataLabels;
	return d(r, n) ? !1 : n?.text ? !0 : (n?.showVal ?? r?.showVal ?? e.showDataLabels) || (n?.showCatName ?? r?.showCatName ?? !1) || (n?.showSerName ?? r?.showSerName ?? !1) || (n?.showPercent ?? r?.showPercent ?? !1);
}
function rn(e, n, r, i, a, o) {
	let s = J(n, r.h, i), c = n.titleRichRuns?.length ? {
		...s,
		bandH: s.bandH + K(n.title, s.fontPx)
	} : s;
	if (n.title) {
		e.font = `${n.titleFontBold === !1 ? "" : "bold "}${c.fontPx}px ${Lt(n, n.titleFontFace)}`, e.fillStyle = n.titleFontColor ? `#${n.titleFontColor}` : "#111111", e.textAlign = "center", e.textBaseline = "top";
		let t = w(e, n.title), i = {
			x: r.x + (r.w - t) / 2,
			y: r.y + c.topPad,
			w: t,
			h: Math.max(1, c.fontPx) + K(n.title, c.fontPx)
		}, a = n.titleManualLayout ? X({
			...n.titleManualLayout,
			w: void 0,
			h: void 0
		}, r, i) : null;
		R(e, n.title, a ? a.x + a.w / 2 : r.x + r.w / 2, a?.y ?? i.y, c.fontPx);
	}
	let l = yt(n);
	e.save();
	let u = (n.chartType === "pie" ? n.series[0]?.categories?.length ? n.series[0].categories : n.categories : n.series.map((e, t) => e.name || `Series ${t + 1}`)).flatMap((e, t) => l.get(t)?.deleted === !0 ? [] : [{
		label: e,
		index: t
	}]), d = u.map((e) => bt(n, l.get(e.index), i)), f = Math.max(0, ...d.map((e) => e.fontPx)), p = u.map((t, n) => (e.font = d[n].font, 7 * i + 4 + w(e, t.label))), m = ie(n, r.w, r.h, {
		itemWidths: p,
		rowHeight: Math.max(f * 1.45, 12) + Qt(u.map((e) => e.label), f),
		itemGap: 12,
		horizontalPadding: 8,
		verticalPadding: 4
	});
	e.restore();
	let h = Y(m, n.legendOverlay === !0), g = I(n, r.w, r.h, i), _ = le(n.catAxisTitleTextVerticalInsetEmu, i), v = le(n.valAxisTitleTextVerticalInsetEmu, i), y = a === "horizontal" ? n.catAxisTitle ? g.catFontPx + _ + t(r.w) + 4 + P(n.catAxisTitle, g.catFontPx, "left", n.catAxisTitleRotation, n.catAxisTitleVerticalMode) : 0 : a === "vertical" ? g.valBandW : 0, b = a === "horizontal" ? n.valAxisTitle ? g.valFontPx + v + t(r.h) + 4 + P(n.valAxisTitle, g.valFontPx, "horizontal", n.valAxisTitleRotation, n.valAxisTitleVerticalMode) : 0 : a === "vertical" ? g.catBandH : 0, x = V(n, r.x, r.y, r.w, r.h, i, {
		titleBand: c,
		legendReserve: m,
		pad: {
			t: c.bandH + h.legTopH + r.h * .04,
			r: h.legRightW + r.w * .05,
			b: h.legBottomH + r.h * .19 + b,
			l: h.legLeftW + r.w * .13 + y
		},
		honorPlotAreaManualLayout: !0,
		manualOuterInsets: {
			t: c.bandH,
			r: h.legRightW,
			b: h.legBottomH + b,
			l: h.legLeftW + y
		}
	}), S = {
		x: x.plotRect.px0,
		y: x.plotRect.py0,
		w: Math.max(1, x.plotRect.pw),
		h: Math.max(1, x.plotRect.ph)
	};
	ce(e, n, S.x, S.y, S.w, S.h, i, o);
	let C = m ? m.side === "r" ? {
		x: r.x + r.w - m.reserveW,
		y: S.y,
		w: m.reserveW,
		h: S.h
	} : m.side === "l" ? {
		x: r.x,
		y: S.y,
		w: m.reserveW,
		h: S.h
	} : m.side === "t" ? {
		x: r.x + 4,
		y: r.y + c.bandH,
		w: Math.max(1, r.w - 8),
		h: m.reserveH
	} : {
		x: r.x + 4,
		y: r.y + r.h - m.reserveH,
		w: Math.max(1, r.w - 8),
		h: m.reserveH
	} : null;
	return {
		plot: S,
		legend: (C && n.legendManualLayout ? X(n.legendManualLayout, r, C) : null) ?? C,
		legendMeasure: {
			labels: u.map((e) => e.label),
			styles: d,
			itemWidths: p
		}
	};
}
function an(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
	e.save(), e.font = `${l ? "italic " : ""}${c ? "bold " : ""}${a}px ${o}`, e.fillStyle = s ? `#${s}` : "#555";
	let m = f ? t : on(e, t, p), h = H(i, u, d), g = r;
	if (f) {
		let t = w(e, m), i = a + K(m, a), o = Math.abs(Math.cos(h)), s = Math.abs(Math.sin(h)), c = {
			x: r.x - (t * o + i * s) / 2,
			y: r.y - (t * s + i * o) / 2,
			w: t * o + i * s,
			h: t * s + i * o
		}, l = X({
			...f,
			w: void 0,
			h: void 0
		}, n, c);
		l && (g = {
			x: l.x + l.w / 2,
			y: l.y + l.h / 2
		});
	}
	e.translate(g.x, g.y), h && e.rotate(h), e.textAlign = "center", e.textBaseline = "middle", R(e, m, 0, 0, a), e.restore();
}
function on(e, t, n) {
	let i = de(t);
	return i.length === 1 ? r(e, t, n) : i.map((t) => r(e, t, n)).join("\n");
}
function sn(e, n, r, i, a, o) {
	if (n.valAxisTitle) {
		let s = x(n.valAxisTitleFontSizeHpt, o), c = a ? "horizontal" : "left", l = P(n.valAxisTitle, s, c, n.valAxisTitleRotation, n.valAxisTitleVerticalMode) / 2;
		an(e, n.valAxisTitle, r, a ? {
			x: i.x + i.w / 2,
			y: i.y + i.h + t(r.h) + s / 2 + l
		} : {
			x: i.x - t(r.w) - s / 2 - l,
			y: i.y + i.h / 2
		}, c, s, Rt(n, n.valAxisTitleFontFace, "major"), n.valAxisTitleFontColor, n.valAxisTitleFontBold ?? !0, n.valAxisTitleFontItalic ?? !1, n.valAxisTitleRotation, n.valAxisTitleVerticalMode, n.valAxisTitleManualLayout, a ? i.w : i.h);
	}
	if (n.catAxisTitle) {
		let s = x(n.catAxisTitleFontSizeHpt, o), c = a ? "left" : "horizontal", l = P(n.catAxisTitle, s, c, n.catAxisTitleRotation, n.catAxisTitleVerticalMode) / 2;
		an(e, n.catAxisTitle, r, a ? {
			x: i.x - t(r.w) - s / 2 - l,
			y: i.y + i.h / 2
		} : {
			x: i.x + i.w / 2,
			y: i.y + i.h + t(r.h) + s / 2 + l
		}, c, s, Rt(n, n.catAxisTitleFontFace, "major"), n.catAxisTitleFontColor, n.catAxisTitleFontBold ?? !0, n.catAxisTitleFontItalic ?? !1, n.catAxisTitleRotation, n.catAxisTitleVerticalMode, n.catAxisTitleManualLayout, a ? i.h : i.w);
	}
}
function cn(e, t, n, r, i, a, o, s, c, l, u) {
	let d = t.threeD?.seriesAxis;
	if (!d || d.hidden || t.threeD?.barGrouping !== "standard" || t.series.length === 0) return;
	let f = Dn(t, r, i, a, o, s, c), p = hn(r), m = c === "vertical" ? p.seriesAxisX : f.axisX, h = c === "horizontal" ? p.floorY === r.front.y ? r.front.y + r.front.h : r.front.y : p.floorY, g = r.project(m, h, r.topology.nearDepth), _ = r.project(m, h, r.topology.farDepth), v = Math.hypot(_.x - g.x, _.y - g.y);
	if (!(v > 1e-6)) return;
	let y = {
		x: (_.x - g.x) / v,
		y: (_.y - g.y) / v
	}, b = {
		x: -y.y,
		y: y.x
	}, S = r.project(r.front.x + r.front.w / 2, r.front.y + r.front.h / 2, .5), C = {
		x: (g.x + _.x) / 2,
		y: (g.y + _.y) / 2
	};
	(C.x - S.x) * b.x + (C.y - S.y) * b.y < 0 && (b = {
		x: -b.x,
		y: -b.y
	}), (d.tickLabelPos === "low" && b.y < 0 || d.tickLabelPos === "high" && b.y > 0) && (b = {
		x: -b.x,
		y: -b.y
	}), d.lineHidden || (yn(e, _n(d.lineColor, d.lineWidthEmu, d.lineDash, u)), e.beginPath(), e.moveTo(g.x, g.y), e.lineTo(_.x, _.y), e.stroke());
	let w = Math.max(1, Math.floor(d.tickMarkSkip ?? 1)), T = Math.max(1, Math.floor(d.tickLabelSkip ?? 1)), E = d.majorTickMark ?? "out", D = G(d.fontSizeHpt, u) ?? 9 * u;
	if (e.font = `${d.fontItalic ? "italic " : ""}${d.fontBold ? "bold " : ""}${D}px ${Rt(t, d.fontFace)}`, e.fillStyle = d.fontColor ? `#${d.fontColor}` : "#595959", e.textAlign = Math.abs(b.x) < .2 ? "center" : b.x < 0 ? "right" : "left", e.textBaseline = Math.abs(b.y) < .2 ? "middle" : b.y < 0 ? "bottom" : "top", l && !d.lineHidden && E !== "none") {
		yn(e, vn(d.lineColor, d.lineWidthEmu, d.lineDash, u));
		let n = t.series.length;
		for (let t = 0; t <= n; t += w) {
			let i = t / n, a = d.orientation === "maxMin" ? 1 - i : i, o = r.project(m, h, a), s = 6 * u, c = E === "cross" ? s / 2 : E === "out" ? s : 0, l = E === "cross" ? s / 2 : E === "in" ? s : 0;
			e.beginPath(), e.moveTo(o.x + b.x * c, o.y + b.y * c), e.lineTo(o.x - b.x * l, o.y - b.y * l), e.stroke();
		}
	}
	for (let n = 0; n < t.series.length; n++) {
		let i = r.seriesDepth(n, t.series.length, !1), a = d.orientation === "maxMin" ? 1 - i : i, o = r.project(m, h, a);
		if (!l && !d.lineHidden && n % w === 0 && E !== "none") {
			let t = 6 * u, n = E === "cross" ? t / 2 : E === "out" ? t : 0, r = E === "cross" ? t / 2 : E === "in" ? t : 0;
			e.beginPath(), e.moveTo(o.x + b.x * n, o.y + b.y * n), e.lineTo(o.x - b.x * r, o.y - b.y * r), e.stroke();
		}
		d.tickLabelPos !== "none" && n % T === 0 && R(e, t.series[n].name || `Series ${n + 1}`, o.x + b.x * (6 * u + 3), o.y + b.y * (6 * u + 3), _e(D));
	}
	if (e.setLineDash([]), d.title) {
		let i = x(d.titleFontSizeHpt, u), a = D + i + 12 + ee(t.series.map((e, t) => e.name || `Series ${t + 1}`), _e(D)) + K(d.title, i) / 2;
		an(e, d.title, n, {
			x: C.x + b.x * a,
			y: C.y + b.y * a
		}, "horizontal", i, Rt(t, d.titleFontFace, "major"), d.titleFontColor, d.titleFontBold ?? !0, d.titleFontItalic ?? !1, d.titleRotation, d.titleVerticalMode, d.titleManualLayout, Math.max(r.front.w, r.front.h));
	}
}
function ln(t, n, r, i, a, o, s) {
	let c = e(t, "dataPointMarker", a), l = oe(t, "dataPointMarker"), u = n.chartexFormatIdx ?? a, d = T(r?.markerStyle, l, i), f = T(n.markerStyle, l, u), p = d !== void 0 || r?.markerFillPaint !== void 0 || r?.markerFill != null || r?.color != null || r?.markerFillPaintAuthored === !0 && r.markerStyle?.fillHidden !== !0, m = f !== void 0 || n.markerFillPaint !== void 0 || n.markerFill != null || n.markerFillPaintAuthored === !0 && n.markerStyle?.fillHidden !== !0, h = Z(c, l, u), _ = p ? d ?? r?.markerFillPaint : m ? f ?? n.markerFillPaint : h, v = me(n, r, i, o), y = _;
	_?.fillType === "solid" ? (v = _.color, y = void 0) : _ === null && (v = "00000000");
	let x = O(r?.markerStyle, l, i), S = O(n.markerStyle, l, u), C = x !== void 0 || r?.markerLine != null || r?.markerLinePaintAuthored === !0 && r.markerStyle?.lineHidden !== !0, w = S !== void 0 || n.markerLine != null || n.markerLinePaintAuthored === !0 && n.markerStyle?.lineHidden !== !0, E = A(c, u), D = C ? x ?? (r?.markerLinePaintAuthored === !0 ? null : void 0) : w ? S ?? (n.markerLinePaintAuthored === !0 ? null : void 0) : E, k = r?.markerLine ?? n.markerLine ?? n.lineColor ?? o, j = D;
	D?.fillType === "solid" ? (k = D.color, j = void 0) : D === null && (k = "00000000");
	let M = r?.markerStyle ?? n.markerStyle ?? c, N = L(r?.markerStyle, n.markerStyle, c);
	return {
		fill: v,
		fillPaint: y,
		line: k,
		linePaint: j,
		lineWidth: (r?.markerLineWidthEmu ?? n.markerLineWidthEmu ?? M?.lineWidthEmu) == null ? Math.max(.75, s) : Math.max(.25, (r?.markerLineWidthEmu ?? n.markerLineWidthEmu ?? M?.lineWidthEmu ?? 0) / b * s),
		lineDash: N?.lineDash,
		lineCustomDash: N?.lineCustomDash,
		lineCap: M?.lineCap,
		lineJoin: M?.lineJoin,
		effectDirect: g(r?.markerStyle, r?.chartexStyle, n.markerStyle),
		effectFallback: c,
		effectIndex: r?.markerStyle || r?.chartexStyle ? i : u,
		effectFallbackIndex: u
	};
}
function un(t, n, r, i, a, o, s, c, l, u, d, f) {
	let p = $(n, r, i, a, o, f), m = Le(n, r, a, o), h = {
		x: s,
		y: c - l / 2,
		w: l,
		h: l
	}, _ = (e) => {
		if (p.fill !== null) {
			let t = p.fill === void 0 ? p.color : p.fill.fillType === "image" ? null : se(p.fill, e, h.x, h.y, h.w, h.h, d);
			t && (e.fillStyle = t, e.fillRect(h.x, h.y, h.w, h.h));
		}
		let t = p.lineFill === void 0 ? p.lineColor : p.lineFill == null || p.lineFill.fillType === "image" ? null : se(p.lineFill, e, h.x, h.y, h.w, h.h, d);
		t && (e.strokeStyle = t, e.lineWidth = p.lineWidthEmu == null ? .75 * u : Math.max(.25, p.lineWidthEmu / b * u), e.setLineDash(C(p.lineCustomDash, p.lineDash, e.lineWidth)), e.lineCap = p.lineCap, e.lineJoin = p.lineJoin, e.strokeRect(h.x, h.y, h.w, h.h), e.setLineDash([]));
	}, v = g(i?.chartexStyle, r.chartexStyle);
	S(t, v, e(n, "dataPoint3D", o), v === i?.chartexStyle ? a : m, h, u, _, m);
}
function dn(t, n, r, i, a, o, s, c, l, u) {
	let d = $(n, r, void 0, i, i, !1), f = d.lineFill === void 0 ? d.lineColor == null ? d.fill : {
		fillType: "solid",
		color: d.lineColor.replace(/^#/, "")
	} : d.lineFill;
	if (f !== null) {
		let a = d.lineWidthEmu == null ? Math.max(1, 2 * l) : Math.max(.5, d.lineWidthEmu / b * l), p = {
			x: o,
			y: s - a / 2,
			w: c,
			h: a
		}, m = f === void 0 ? d.color : f.fillType === "image" ? null : f.fillType === "solid" ? `#${f.color}` : se(f, t, o, s - a / 2, c, a, u);
		if (m) {
			let h = (e) => {
				e.beginPath(), e.moveTo(o, s), e.lineTo(o + c, s), e.strokeStyle = e === t ? m : f === void 0 ? d.color : f.fillType === "image" ? "rgba(0,0,0,0)" : f.fillType === "solid" ? `#${f.color}` : se(f, e, o, s - a / 2, c, a, u) ?? "rgba(0,0,0,0)", e.lineWidth = a, e.setLineDash(C(d.lineCustomDash, d.lineDash, a)), e.stroke(), e.setLineDash([]);
			}, _ = Le(n, r, i, i);
			S(t, g(r.chartexStyle), e(n, "dataPoint3D", i), _, p, l, h, _);
		}
	}
	if (r.showMarker !== !0 || r.markerSymbol === "none") return;
	let p = r.markerSymbol ?? "circle", m = ln(n, r, void 0, i, i, a.replace(/^#/, ""), l);
	en(t, {
		x: o + c / 2,
		y: s
	}, p, Math.min(c, Math.max(2, (r.markerSize ?? 5) * l)), m.fill === "00000000" ? "transparent" : `#${m.fill.replace(/^#/, "")}`, m.line === "00000000" ? "rgba(0,0,0,0)" : `#${m.line.replace(/^#/, "")}`, m.lineWidth, m.fillPaint, u, l, m.effectDirect, m.effectFallback, m.effectIndex, m.effectFallbackIndex, m.linePaint, m.lineDash, m.lineCustomDash, m.lineCap, m.lineJoin);
}
function fn(e, t, n, r, i = !1, a, o = 0) {
	if (!n) return;
	re(e, t, n, r, o);
	let s = new Map(t.series[0]?.dataPointOverrides?.map((e) => [e.idx, e]) ?? []), c = i ? (t.series[0]?.categories?.length ? t.series[0].categories : t.categories).map((e, n) => {
		let r = t.series[0]?.dataPointColors?.[n];
		return {
			label: e,
			color: r === "00000000" ? "transparent" : r ? `#${r}` : Dt(n),
			series: t.series[0],
			point: s.get(n),
			sourceIndex: n,
			seriesIndex: 0
		};
	}) : t.series.map((e, t) => ({
		label: e.name || `Series ${t + 1}`,
		color: Dt(t, e),
		series: e,
		point: void 0,
		sourceIndex: t,
		seriesIndex: t
	})), l = yt(t), u = c.filter((e) => l.get(e.sourceIndex)?.deleted !== !0), d = a != null && a.labels.length === u.length && a.labels.every((e, t) => e === u[t].label), f = d ? a.styles : u.map((e) => bt(t, l.get(e.sourceIndex), r));
	e.textAlign = "left", e.textBaseline = "middle";
	let m = Math.max(0, ...f.map((e) => e.fontPx)), h = Math.max(m * 1.45, 12), g = Math.min(7 * r, h * .7), _ = h + Qt(u.map((e) => e.label), m);
	if (t.legendPos === "t" || t.legendPos === "b" || t.legendManualLayout != null && n.w >= n.h) {
		let s = d ? a.itemWidths : u.map((t, n) => (e.font = f[n].font, g + 4 + w(e, t.label))), c = U(s, Math.max(1, n.w - 8), 12).slice(0, Math.max(0, Math.floor((n.h - 4 + 1e-6) / _))), l = n.y + 2 + _ / 2;
		for (let a of c) {
			let c = a.map((e) => Math.min(n.w, s[e])), d = c.reduce((e, t) => e + t, 0) + Math.max(0, a.length - 1) * 12, p = n.x + Math.max(4, (n.w - d) / 2);
			for (let n = 0; n < a.length; n++) {
				let s = a[n], d = u[s], m = f[s];
				e.font = m.font;
				let h = Math.max(0, c[n] - g - 4);
				!i && t.chartType.toLowerCase().includes("line") && d.series ? dn(e, t, d.series, d.seriesIndex, d.color, p, l, g, r, o) : d.series && un(e, t, d.series, d.point, d.sourceIndex, d.seriesIndex, p, l, g, r, o, i), e.fillStyle = m.color, R(e, d.label, p + g + 4, l, Zt(m.fontPx), h), p += c[n] + 12;
			}
			l += _;
		}
		return;
	}
	let v = n.y;
	for (let a = 0; a < u.length; a++) {
		let s = u[a], c = f[a];
		e.font = c.font;
		let l = n.x + 8 + g, d = Math.max(0, n.x + n.w - 4 - l), m = Math.max(c.fontPx * 1.2, 10), _ = de(s.label), y = (t) => p(t, d, m * (i ? 1 : 2), m, (t) => e.measureText(t).width), b = _.length === 1 ? y(s.label) : _.flatMap(y);
		if (b.length === 0) continue;
		let x = Math.max(h, b.length * m + 2);
		if (v + x > n.y + n.h + 1e-6) break;
		let S = v + x / 2;
		!i && t.chartType.toLowerCase().includes("line") && s.series ? dn(e, t, s.series, s.seriesIndex, s.color, n.x + 4, S, g, r, o) : s.series && un(e, t, s.series, s.point, s.sourceIndex, s.seriesIndex, n.x + 4, S, g, r, o, i), e.fillStyle = c.color;
		let C = S - (b.length - 1) * m / 2;
		b.forEach((t, n) => e.fillText(t, l, C + n * m)), v += x;
	}
}
function pn(e, t, n, r, i, a) {
	let o = i ? 100 : 1, s = e.valAxisMinorTickMark ?? "none";
	return _({
		dataMin: t,
		dataMax: n,
		explicitMin: e.valMin == null ? i ? t : null : e.valMin * o,
		explicitMax: e.valMax == null ? i ? n : null : e.valMax * o,
		majorUnit: e.valAxisMajorUnit == null ? null : e.valAxisMajorUnit * o,
		minorUnit: e.valAxisMinorUnit == null ? null : e.valAxisMinorUnit * o,
		axisLenPt: r,
		axisOrientation: a,
		logBase: e.valAxisLogBase,
		reversed: e.valAxisOrientation === "maxMin",
		needMinor: e.valAxisMinorGridlines === !0 || s !== "none"
	});
}
function mn(e, t, n) {
	let r = e != null && Number.isFinite(e) ? (e % 360 + 360) % 360 : 0, i = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0, a = Number.isFinite(n) ? Math.max(0, Math.min(1 - i, n)) : 0, o = Math.PI / 2 - (r * Math.PI / 180 + i * Math.PI * 2), s = o - a * Math.PI * 2;
	return {
		start: Math.min(o, s),
		end: Math.max(o, s),
		middle: (o + s) / 2,
		leading: o
	};
}
function hn(e) {
	let { front: t } = e, n = t.x, r = t.x + t.w, i = e.topology.farX === "min" ? n : r, a = i === n ? r : n, o = e.topology.axisY === "min" ? t.y : t.y + t.h, s = o === t.y ? t.y + t.h : t.y, { nearDepth: c, farDepth: l } = e.topology, u = e.project(n, o, c), d = e.project(r, o, c), f = e.project(r, o, l), p = e.project(n, o, l), m = e.project(n, s, l), h = e.project(r, s, l), g = e.project(i, o, c), _ = e.project(i, o, l), v = e.project(i, s, l), y = e.project(i, s, c);
	return {
		floor: [
			u,
			d,
			f,
			p
		],
		sideWall: [
			g,
			_,
			v,
			y
		],
		backWall: [
			p,
			f,
			h,
			m
		],
		sideX: i,
		seriesAxisX: a,
		floorY: o,
		oppositeFloorY: s,
		nearDepth: c,
		farDepth: l
	};
}
function gn(e, t, n, r, i = "A6A6A6", a = .75) {
	let o = t != null && Number.isFinite(t) && t >= 0 ? Math.max(.25, t / b * r) : a * r;
	return {
		color: `#${e ?? i}`,
		width: o,
		dash: Se(n ?? "solid", o)
	};
}
function _n(e, t, n, r) {
	let i = gn(e, t, n, r, "898989", 1);
	if (t == null || !Number.isFinite(t) || t < 0) return i;
	let a = t / b * r;
	if (!(a > 0)) return i;
	let o = a;
	return {
		...i,
		width: o,
		dash: Se(n ?? "solid", o)
	};
}
function vn(e, t, n, r) {
	return _n(e, t, n, r);
}
function yn(e, t) {
	e.strokeStyle = t.color, e.lineWidth = t.width, e.setLineDash(t.dash);
}
function bn(e, t, n, r, i, a, s, c, l) {
	let { front: u } = n, d = u.x, f = u.x + u.w, p = hn(n), { sideX: m, floorY: h, oppositeFloorY: g, nearDepth: _, farDepth: v } = p, y = Dn(t, n, r, a, s, c, i), x = [], S = t.catAxisLinePaintAuthored === !0, w = t.valAxisLinePaintAuthored === !0, T = i === "vertical" ? S && !t.catAxisHidden && !t.catAxisLineHidden : w && !t.valAxisHidden && !t.valAxisLineHidden, E = i === "vertical" ? w && !t.valAxisHidden && !t.valAxisLineHidden : S && !t.catAxisHidden && !t.catAxisLineHidden;
	T && x.push([y.horizontalStart, y.horizontalEnd]), E && x.push([y.verticalStart, y.verticalEnd]);
	let D = t.threeD?.seriesAxis, O = D?.linePaintAuthored === !0;
	if (D && !D.hidden && !D.lineHidden && O && t.threeD?.barGrouping === "standard" && t.series.length > 0) {
		let e = i === "vertical" ? p.seriesAxisX : y.axisX, t = i === "horizontal" ? h === n.front.y ? n.front.y + n.front.h : n.front.y : h;
		x.push([n.project(e, t, _), n.project(e, t, v)]);
	}
	let k = (e, t) => Math.hypot(e.x - t.x, e.y - t.y) <= 1e-6, A = (e, t) => x.some(([n, r]) => k(e, n) && k(t, r) || k(e, r) && k(t, n)), j = (e, t) => {
		let r = Ce(n, e, t?.thicknessPercent), i = r.faces.map((e, t) => ({
			scenePoints: e,
			faceIndex: t
		})).filter(({ scenePoints: e }) => r.thickness === 0 || n.cameraFacing(e)).map(({ scenePoints: e, faceIndex: t }) => ({
			faceIndex: t,
			scenePoints: e,
			points: e.map((e) => n.projectUnbounded(e.x, e.y, e.depth)),
			depth: e.reduce((e, t) => e + n.cameraDepth(t.x, t.y, t.depth), 0) / e.length
		})).sort((e, t) => e.depth - t.depth);
		return {
			slab: r,
			faces: i,
			visibleFaceIndices: new Set(i.map((e) => e.faceIndex))
		};
	}, M = j("floor", t.threeD?.floor), P = j("sideWall", t.threeD?.sideWall), F = j("backWall", t.threeD?.backWall), I = M.faces, L = P.faces, R = F.faces, z = (i, a, o, s) => {
		let c = N(t, a, o), u = i.faces;
		if (!c.fill || !u.length) return;
		if (c.fill.fillType === "image") {
			let t = c.fill, o = ke(i.slab, l), u = W(c.fill, o ? q(c.fill, o.widthPt, o.heightPt) : void 0);
			if (!u) return;
			Ee(e, c.fill, u, a, s, i.slab, i.faces.map((e) => e.faceIndex), (e) => n.projectUnbounded(e.x, e.y, e.depth), r.max - r.min, (e, n) => W(t, q(t, e, n)), l);
			return;
		}
		let d = u.flatMap((e) => e.points), f = Math.min(...d.map((e) => e.x)), p = Math.max(...d.map((e) => e.x)), m = Math.min(...d.map((e) => e.y)), h = Math.max(...d.map((e) => e.y)), g = c.fill.fillType === "solid" ? `#${c.fill.color}` : se(c.fill, e, f, m, p - f, h - m);
		if (g) for (let t of u) t.points.length < 3 || (zt(e, t.points), e.fillStyle = g, e.fill());
	};
	z(M, t.threeD?.floor, "floor", "floor"), z(P, t.threeD?.sideWall, "wall", "sideWall"), z(F, t.threeD?.backWall, "wall", "backWall");
	let B = (t, r, i, a, o = !0) => {
		for (let s of Oe(t.slab, r, i, a)) {
			if (!o && s.faceIndex !== 0 || !t.visibleFaceIndices.has(s.faceIndex)) continue;
			let [r, i] = s.scenePoints.map((e) => n.projectUnbounded(e.x, e.y, e.depth));
			e.beginPath(), e.moveTo(r.x, r.y), e.lineTo(i.x, i.y), e.stroke();
		}
	}, V = (t, a, o) => {
		yn(e, a);
		for (let a of t) {
			let t = r.fraction(a);
			if (o) {
				i === "horizontal" ? (B(M, "floor", "x", t), B(F, "backWall", "x", t)) : (B(P, "sideWall", "y", t), B(F, "backWall", "y", t));
				continue;
			}
			if (i === "horizontal") {
				let r = u.x + t * u.w, i = n.project(r, h, v), a = n.project(r, g, v);
				e.beginPath(), e.moveTo(i.x, i.y), e.lineTo(a.x, a.y), e.stroke();
			} else {
				let r = u.y + u.h - t * u.h, i = n.project(m, r, _), a = n.project(m, r, v), o = n.project(m === d ? f : d, r, v);
				e.beginPath(), e.moveTo(i.x, i.y), e.lineTo(a.x, a.y), e.stroke(), e.beginPath(), e.moveTo(a.x, a.y), e.lineTo(o.x, o.y), e.stroke();
			}
		}
	};
	t.valAxisMinorGridlines === !0 && V(r.minorTicks, gn(t.valAxisMinorGridlineColor, t.valAxisMinorGridlineWidthEmu, t.valAxisMinorGridlineDash, l, "D9D9D9", .5), !0), t.valAxisMajorGridlines === !0 && V(r.majorTicks, gn(t.valAxisGridlineColor, t.valAxisGridlineWidthEmu, t.valAxisGridlineDash, l, "898989", 1), !0);
	let H = (t, n) => {
		yn(e, n);
		for (let e of t) i === "vertical" ? (B(M, "floor", "x", e), B(F, "backWall", "x", e)) : (B(P, "sideWall", "y", e), B(F, "backWall", "y", e));
	};
	t.catAxisMinorGridlines === !0 && H(o(a, s), gn(t.catAxisMinorGridlineColor, t.catAxisMinorGridlineWidthEmu, t.catAxisMinorGridlineDash, l, "E0E0E0", .5)), t.catAxisMajorGridlines === !0 && H(pe(a, s), gn(t.catAxisGridlineColor, t.catAxisGridlineWidthEmu, t.catAxisGridlineDash, l, "E0E0E0", .5));
	let U = (n, r, i) => {
		if (!n.length) return;
		let a = N(t, r, i);
		if (a.line === null) return;
		let o = a.line ?? {
			fillType: "solid",
			color: "898989"
		}, s = n.flatMap((e) => e.points), c = Math.min(...s.map((e) => e.x)), u = Math.max(...s.map((e) => e.x)), d = Math.min(...s.map((e) => e.y)), f = Math.max(...s.map((e) => e.y)), p = o.fillType === "solid" ? `#${o.color}` : se(o, e, c, d, u - c, f - d);
		if (!p) return;
		let m = a.lineWidthEmu == null ? l : Math.max(.25, a.lineWidthEmu / b * l);
		e.strokeStyle = p, e.lineWidth = m, e.setLineDash(C(a.lineCustomDash, a.lineDash, m)), e.lineCap = a.lineCap === "rnd" ? "round" : a.lineCap === "sq" ? "square" : "butt", e.lineJoin = a.lineJoin === "round" || a.lineJoin === "bevel" ? a.lineJoin : "miter";
		for (let t of n) {
			if (t.points.length < 2) continue;
			let n = t.points.map((e, n) => ({
				start: e,
				end: t.points[(n + 1) % t.points.length]
			}));
			if (n.some((e) => A(e.start, e.end))) {
				for (let t of n) A(t.start, t.end) || (e.beginPath(), e.moveTo(t.start.x, t.start.y), e.lineTo(t.end.x, t.end.y), e.stroke());
				continue;
			}
			e.beginPath(), e.moveTo(t.points[0].x, t.points[0].y);
			for (let n = 1; n < t.points.length; n++) e.lineTo(t.points[n].x, t.points[n].y);
			e.lineTo(t.points[0].x, t.points[0].y), e.closePath(), e.stroke();
		}
	};
	U(I, t.threeD?.floor, "floor"), U(L, t.threeD?.sideWall, "wall"), U(R, t.threeD?.backWall, "wall"), e.setLineDash([]);
}
function xn(e, t, n, r, i, a, o, s, c) {
	let l = Dn(t, n, r, i, a, o, c), u = c === "vertical" ? !t.catAxisHidden && !t.catAxisLineHidden : !t.valAxisHidden && !t.valAxisLineHidden, d = c === "vertical" ? !t.valAxisHidden && !t.valAxisLineHidden : !t.catAxisHidden && !t.catAxisLineHidden;
	u && (yn(e, _n(c === "vertical" ? t.catAxisLineColor : t.valAxisLineColor, c === "vertical" ? t.catAxisLineWidthEmu : t.valAxisLineWidthEmu, c === "vertical" ? t.catAxisLineDash : t.valAxisLineDash, s)), e.beginPath(), e.moveTo(l.horizontalStart.x, l.horizontalStart.y), e.lineTo(l.horizontalEnd.x, l.horizontalEnd.y), e.stroke()), d && (yn(e, _n(c === "vertical" ? t.valAxisLineColor : t.catAxisLineColor, c === "vertical" ? t.valAxisLineWidthEmu : t.catAxisLineWidthEmu, c === "vertical" ? t.valAxisLineDash : t.catAxisLineDash, s)), e.beginPath(), e.moveTo(l.verticalStart.x, l.verticalStart.y), e.lineTo(l.verticalEnd.x, l.verticalEnd.y), e.stroke()), e.setLineDash([]);
}
function Sn(e, t, n, r) {
	let i = {
		x: (e.x + t.x) / 2,
		y: (e.y + t.y) / 2
	};
	return r === "horizontal" ? {
		x: i.x <= n.x ? -1 : 1,
		y: 0
	} : {
		x: 0,
		y: i.y <= n.y ? -1 : 1
	};
}
function Cn(e, t, n, r, i, a, o, s, c) {
	if (!t || t === "none") return;
	let l = Sn(r, i, a, o), u = wn(s, c), d = t === "cross" ? u / 2 : u, f = t === "out" || t === "cross" ? d : 0, p = t === "in" || t === "cross" ? d : 0;
	e.beginPath(), e.moveTo(n.x + l.x * f, n.y + l.y * f), e.lineTo(n.x - l.x * p, n.y - l.y * p), e.stroke();
}
function wn(e, t) {
	return (e === "minor" ? 4 : 6) * t;
}
function Tn(e, t, n) {
	if (e !== "out" && e !== "cross") return 0;
	let r = wn(t, n);
	return e === "cross" ? r / 2 : r;
}
function En(e, t, n, r) {
	if (t) return r;
	let i = Tn(e, "major", n);
	return Math.max(r, i + 3 * n);
}
function Dn(e, t, n, r, i, a, o) {
	let { front: s } = t, c = (e) => Math.max(0, Math.min(1, e)), l = t.topology.axisX === "min" ? s.x : s.x + s.w, u = t.topology.axisY === "min" ? s.y : s.y + s.h, d = () => {
		if (e.catAxisCrossesAt != null && Number.isFinite(e.catAxisCrossesAt)) {
			let t = e.chartType.endsWith("Pct") ? e.catAxisCrossesAt * 100 : e.catAxisCrossesAt;
			return c(n.fraction(t));
		}
		let t = e.catAxisCrosses ?? "autoZero";
		return c(t === "min" ? n.fraction(n.min) : t === "max" ? n.fraction(n.max) : n.fraction(0));
	}, f = () => {
		let t = e.valAxisCrossesAt;
		if (t != null && Number.isFinite(t)) return v(t - 1, r, i, a);
		let n = e.valAxisCrosses;
		if (n !== "min" && n !== "max") return null;
		let o = +(n === "max");
		return a ? 1 - o : o;
	}, p = d(), m = f(), h = o === "horizontal" ? s.x + p * s.w : m == null ? l : s.x + m * s.w, g = o === "vertical" ? s.y + s.h - p * s.h : m == null ? u : s.y + m * s.h, _ = t.topology.nearDepth;
	return {
		axisX: h,
		axisY: g,
		depth: _,
		horizontalStart: t.project(s.x, g, _),
		horizontalEnd: t.project(s.x + s.w, g, _),
		verticalStart: t.project(h, s.y + s.h, _),
		verticalEnd: t.project(h, s.y, _)
	};
}
function On(e, t, n, r, i, a, o, s, c, l) {
	let { front: u } = n, d = Dn(t, n, r, i, a, o, s), { axisX: f, axisY: p, depth: m } = d, h = n.project(u.x + u.w / 2, u.y + u.h / 2, m), g = t.valAxisMinorTickMark ?? "none", _ = c ? vn : _n;
	if (!t.valAxisHidden && !t.valAxisLineHidden) {
		yn(e, _(t.valAxisLineColor, t.valAxisLineWidthEmu, t.valAxisLineDash, l));
		let i = (e) => s === "horizontal" ? n.project(u.x + r.fraction(e) * u.w, p, m) : n.project(f, u.y + u.h - r.fraction(e) * u.h, m), a = s === "horizontal" ? d.horizontalStart : d.verticalStart, o = s === "horizontal" ? d.horizontalEnd : d.verticalEnd;
		for (let n of r.majorTicks) Cn(e, t.valAxisMajorTickMark, i(n), a, o, h, s === "vertical" ? "horizontal" : "vertical", "major", l);
		for (let t of r.minorTicks) Cn(e, g, i(t), a, o, h, s === "vertical" ? "horizontal" : "vertical", "minor", l);
	}
	if (!t.catAxisHidden && !t.catAxisLineHidden) {
		yn(e, _(t.catAxisLineColor, t.catAxisLineWidthEmu, t.catAxisLineDash, l));
		let r = s === "vertical" ? d.horizontalStart : d.verticalStart, g = s === "vertical" ? d.horizontalEnd : d.verticalEnd, y = Math.max(1, Math.floor(t.catAxisTickMarkSkip ?? 1)), b = (i) => {
			let a = s === "vertical" ? n.project(u.x + i * u.w, p, m) : n.project(f, u.y + i * u.h, m);
			Cn(e, t.catAxisMajorTickMark, a, r, g, h, s === "vertical" ? "vertical" : "horizontal", "major", l);
		};
		if (c) {
			let e = pe(i, a);
			for (let t = 0; t < e.length; t += y) b(o ? 1 - e[t] : e[t]);
		} else for (let e = 0; e < i; e += y) b(v(e, i, a, o));
		let x = t.catAxisMinorUnit;
		if (t.catAxisMinorTickMark && t.catAxisMinorTickMark !== "none" && x != null && Number.isFinite(x) && x > 0) {
			let c = t.catAxisMajorUnit != null && Number.isFinite(t.catAxisMajorUnit) && t.catAxisMajorUnit > 0 ? t.catAxisMajorUnit : y, d = Math.min(512, Math.ceil(i / x));
			for (let _ = 1; _ < d; _++) {
				let d = _ * x;
				if (!(d < i)) break;
				if (Math.abs(d / c - Math.round(d / c)) < 1e-9) continue;
				let y = v(d, i, a, o), b = s === "vertical" ? n.project(u.x + y * u.w, p, m) : n.project(f, u.y + y * u.h, m);
				Cn(e, t.catAxisMinorTickMark, b, r, g, h, s === "vertical" ? "vertical" : "horizontal", "minor", l);
			}
		}
	}
	e.setLineDash([]);
}
function kn(t, n, r, i, o) {
	if (!n.threeD) return !1;
	let l = n.chartType === "clusteredBar" || n.chartType === "clusteredBarH" || n.chartType.startsWith("stackedBar"), u = n.chartType.endsWith("H") || n.chartType.includes("BarH"), d = n.chartType.startsWith("stacked"), p = l && !d && n.threeD.barGrouping === "standard", { plot: m, legend: h, legendMeasure: _ } = rn(t, n, r, i, u ? "horizontal" : "vertical", o), x = Te(n.threeD, m, {
		sceneDepthScale: l ? p ? .65 : .1 : .4,
		perspectiveTangentGain: p ? 1 : 2,
		sceneHeightScale: !l && !(n.threeD.heightPercentAuthored ?? n.threeD.heightPercent != null) ? 1 / 3 : void 0
	});
	if (!x) return !0;
	x = De(x, n.threeD, m);
	let S = n.chartType.endsWith("Pct"), T = n.series.find((e) => (e.categories?.length ?? 0) > 0)?.categories ?? n.categories, E = Math.max(1, T.length, ...n.series.map((e) => e.values.length)), D = S ? kt(n, E) : void 0, O = n.catAxisOrientation === "maxMin", k = n.catAxisCrossBetween === "between", A = n.dispBlanksAs ?? "gap", j = n.valAxisLogBase != null && Number.isFinite(n.valAxisLogBase) && n.valAxisLogBase >= 2, M = (e, t) => {
		let r = n.series[e]?.values[t];
		return r != null && Number.isFinite(r) && (!j || r > 0) || r == null && (d || A === "zero");
	}, N = (e, t) => At(n, e, t, D), P = 0, F = 0;
	if (d) {
		for (let e = 0; e < E; e++) {
			let t = 0, r = 0;
			for (let i = 0; i < n.series.length; i++) {
				let n = N(i, e);
				n >= 0 ? t = jt(t, n) : r = jt(r, n);
			}
			P = Math.min(P, r), F = Math.max(F, t);
		}
		S && (P = P < 0 ? -100 : 0, F = F > 0 ? 100 : 0, P === 0 && F === 0 && (F = 1));
	} else {
		let e = y(n.series.flatMap((e) => e.values).filter((e) => e != null && Number.isFinite(e) && (!j || e > 0)), j ? {
			min: 1,
			max: 10
		} : {
			min: 0,
			max: 1
		});
		P = j ? e.min : Math.min(0, e.min), F = j ? e.max : Math.max(0, e.max);
	}
	let I = u ? x.project(x.front.x, x.topology.axisY === "min" ? x.front.y : x.front.y + x.front.h, x.topology.nearDepth) : x.project(x.topology.axisX === "min" ? x.front.x : x.front.x + x.front.w, x.front.y, x.topology.nearDepth), L = u ? x.project(x.front.x + x.front.w, x.topology.axisY === "min" ? x.front.y : x.front.y + x.front.h, x.topology.nearDepth) : x.project(x.topology.axisX === "min" ? x.front.x : x.front.x + x.front.w, x.front.y + x.front.h, x.topology.nearDepth), B = Math.hypot(L.x - I.x, L.y - I.y) / i, V = pn(n, P, F, B, S, u ? "horizontal" : "vertical"), H = (e) => Number.isFinite(e) ? Math.max(V.min, Math.min(V.max, e)) : V.min;
	l || bn(t, n, x, V, u ? "horizontal" : "vertical", E, k, O, i);
	let { front: U } = x, ee = Math.max(1, n.series.length), te = [], W = n.series.map((e) => new Map(e.dataPointOverrides?.map((e) => [e.idx, e]) ?? [])), K = n.series.map((e) => new Map(e.dataLabelOverrides?.map((e) => [e.idx, e]) ?? []));
	if (l) {
		let a = x.prismInterval(0, 1, !0), s = [], c = Array(E).fill(0), l = Array(E).fill(0), m = (u ? U.h : U.w) / E, h = n.barGapWidth != null && Number.isFinite(n.barGapWidth) && n.barGapWidth >= 0 ? n.barGapWidth : 150;
		for (let e = 0; e < n.series.length; e++) {
			let t = n.series[e], r = p ? x.prismInterval(e, ee, !1) : a, o = je(m, h, p ? 0 : e, p ? 1 : ee, d || p);
			for (let a = 0; a < E; a++) {
				if (!M(e, a)) continue;
				let p = N(e, a), h = $(n, t, W[e].get(a), a, e), g = h.fill === null ? "transparent" : h.color, _ = h.lineFill !== null && (h.lineColor != null || h.lineFill !== void 0), v = d ? p >= 0 ? c[a] : l[a] : 0, y = jt(v, p);
				d && (p >= 0 ? c[a] = y : l[a] = y);
				let b = H(v), x = H(y), C = t.threeDShape ?? n.threeD.shape ?? "box", w = C === "cone" || C === "pyramid", T = C === "coneToMax" || C === "pyramidToMax", D = (e) => {
					if (!w) return 1;
					let t = j && !(v > 0) ? V.min : v, n = V.fraction(t), r = V.fraction(y), i = V.fraction(e), a = r - n;
					return a === 0 || !Number.isFinite(a) || !Number.isFinite(i - n) ? +(e === t) : Math.max(0, Math.min(1, 1 - (i - n) / a));
				}, k = (e) => {
					if (!T) return 1;
					let t = y >= v ? V.max : V.min, n = j ? V.min : 0, r = V.fraction(t), i = V.fraction(n), a = V.fraction(e), o = Math.abs(r - i);
					return !(o > 0) || ![
						r,
						i,
						a
					].every(Number.isFinite) ? we(e, V.min, V.max) : Math.max(0, Math.min(1, Math.abs(r - a) / o));
				}, A = T ? k(b) : D(b), P = T ? k(x) : D(x);
				if (u) {
					let t = U.x + V.fraction(b) * U.w, n = U.x + V.fraction(x) * U.w, c = O ? E - 1 - a : a, l = U.y + c * m + o.offset;
					s.push({
						x: Math.min(t, n),
						y: l,
						width: Math.abs(n - t),
						height: o.size,
						nearDepth: r.near,
						farDepth: r.far,
						categoryIndex: a,
						seriesIndex: e,
						color: g,
						fillPaint: h.fill,
						lineFill: h.lineFill,
						shape: C,
						baseCoord: t,
						endCoord: n,
						baseScale: A,
						endScale: P,
						omitBaseCap: !1,
						omitEndCap: !1,
						outline: _,
						outlineColor: h.lineColor ?? "rgba(0,0,0,0.42)",
						outlineWidth: h.lineWidthEmu == null ? .75 * i / f : Tt(h.lineWidthEmu, i),
						outlineDash: h.lineDash ?? "solid",
						outlineCustomDash: h.lineCustomDash,
						outlineCap: h.lineCap,
						outlineJoin: h.lineJoin,
						labelValue: S ? p / 100 : p,
						plottedLabelValue: y
					});
				} else {
					let t = U.y + U.h - V.fraction(b) * U.h, n = U.y + U.h - V.fraction(x) * U.h, c = O ? E - 1 - a : a, l = U.x + c * m + o.offset;
					s.push({
						x: l,
						y: Math.min(t, n),
						width: o.size,
						height: Math.abs(n - t),
						nearDepth: r.near,
						farDepth: r.far,
						categoryIndex: a,
						seriesIndex: e,
						color: g,
						fillPaint: h.fill,
						lineFill: h.lineFill,
						shape: C,
						baseCoord: t,
						endCoord: n,
						baseScale: A,
						endScale: P,
						omitBaseCap: !1,
						omitEndCap: !1,
						outline: _,
						outlineColor: h.lineColor ?? "rgba(0,0,0,0.42)",
						outlineWidth: h.lineWidthEmu == null ? .75 * i / f : Tt(h.lineWidthEmu, i),
						outlineDash: h.lineDash ?? "solid",
						outlineCustomDash: h.lineCustomDash,
						outlineCap: h.lineCap,
						outlineJoin: h.lineJoin,
						labelValue: S ? p / 100 : p,
						plottedLabelValue: y
					});
				}
			}
		}
		if (d) {
			let e = Et(s, E);
			for (let t = 0; t < E; t++) {
				let n = e[t];
				for (let e of [-1, 1]) {
					let t = n.filter((t) => Math.sign(t.labelValue) === e && !Bt(t.color) && Math.abs(t.endCoord - t.baseCoord) > 1e-9).sort((e, t) => e.seriesIndex - t.seriesIndex);
					for (let e = 0; e + 1 < t.length; e++) {
						let n = t[e], r = t[e + 1], i = 1e-8 * Math.max(1, Math.abs(n.endCoord), Math.abs(r.baseCoord));
						n.shape !== r.shape || Math.abs(n.endCoord - r.baseCoord) > i || Math.abs(n.endScale - r.baseScale) > 1e-9 || n.nearDepth !== r.nearDepth || n.farDepth !== r.farDepth || (n.omitEndCap = !0, r.omitBaseCap = !0);
					}
				}
				let r = n.find((e) => e.labelValue > 0 && !Bt(e.color)), i = n.find((e) => e.labelValue < 0 && !Bt(e.color));
				if (r && i) {
					let e = 1e-8 * Math.max(1, Math.abs(r.baseCoord), Math.abs(i.baseCoord));
					r.shape === i.shape && Math.abs(r.baseCoord - i.baseCoord) <= e && Math.abs(r.baseScale - i.baseScale) <= 1e-9 && r.nearDepth === i.nearDepth && r.farDepth === i.farDepth && (r.omitBaseCap = !0, i.omitBaseCap = !0);
				}
			}
		}
		bn(t, n, x, V, u ? "horizontal" : "vertical", E, k, O, i);
		let _ = {
			remaining: rt,
			exceeded: !1
		}, v = s.map((e) => {
			let n = Ut(x, e.shape, u, e.x, e.y, e.width, e.height, e.baseCoord, e.endCoord, e.nearDepth, e.farDepth, e.color, e.baseScale, e.endScale, e.omitBaseCap, e.omitEndCap, e.outline && e.outlineColor ? {
				color: e.outlineColor,
				width: e.outlineWidth,
				dash: C(e.outlineCustomDash, e.outlineDash, e.outlineWidth),
				cap: e.outlineCap,
				join: e.outlineJoin
			} : void 0, _);
			return Jt(t, n, "fill", e.fillPaint, o), Jt(t, n, "outline", e.lineFill, o), {
				item: e,
				faces: n
			};
		}), y = v.flatMap((e) => e.faces);
		if (_.exceeded) return Yt(t, r), !0;
		for (let e of nt(y)) Kt(t, e);
		for (let { item: r, faces: a } of v) {
			let o = n.series[r.seriesIndex], s = W[r.seriesIndex].get(r.categoryIndex), c = Le(n, o, r.categoryIndex, r.seriesIndex), l = g(s?.chartexStyle), u = g(o.chartexStyle);
			xe(t, l ?? u, e(n, "dataPoint3D", r.seriesIndex), l ? r.categoryIndex : c, i, (e) => qt(e, a), c);
		}
		for (let e of s) {
			let a = n.series[e.seriesIndex], s = u ? x.project(e.endCoord, e.y + e.height / 2, (e.nearDepth + e.farDepth) / 2) : x.project(e.x + e.width / 2, e.endCoord, (e.nearDepth + e.farDepth) / 2), c = K[e.seriesIndex].get(e.categoryIndex);
			nn(n, a, c) && te.push(() => tn(t, n, a, e.seriesIndex, e.categoryIndex, e.labelValue, s, r, i, 0, void 0, c, "t", s, !0, n.valAxisDisplayUnits, V.max, e.plottedLabelValue, o));
		}
	} else {
		let e = n.series.map(() => Array(E).fill(0)), a = n.series.map(() => Array(E).fill(0));
		if (d) {
			let t = Array(E).fill(0), r = Array(E).fill(0);
			for (let i = 0; i < n.series.length; i++) for (let n = 0; n < E; n++) {
				let o = N(i, n), s = o >= 0 ? t[n] : r[n];
				e[i][n] = s, a[i][n] = jt(s, o), o >= 0 ? t[n] = jt(t[n], o) : r[n] = jt(r[n], o);
			}
		}
		let c = (e) => {
			let t = x.seriesDepth(e, ee, d), n = 0, r = 0;
			for (let i = 0; i < E; i++) {
				if (!M(e, i)) continue;
				let o = d ? a[e][i] : N(e, i), s = U.x + v(i, E, k, O) * U.w, c = U.y + U.h - V.fraction(H(o)) * U.h;
				n += x.cameraDepth(s, c, t), r++;
			}
			return r > 0 ? n / r : -Infinity;
		}, l = n.series.map((e, t) => t).sort((e, t) => c(e) - c(t) || t - e), u = n.series.map((e, t) => $(n, e, void 0, t, t)), f = [], p = [], m = !1;
		for (let c of l) {
			if (m) break;
			let l = n.series[c], h = u[c], g = h.fill === null ? "transparent" : h.color, _ = d ? x.prismInterval(0, 1, !0) : x.prismInterval(c, ee, !1), y = U.x + U.w / 2, w = U.y + U.h / 2, T = x.cameraDepth(y, w, _.near) >= x.cameraDepth(y, w, _.far) ? _.near : _.far, D = [], j = [], P = [], F = [], I = [], L = [], R = [], B = [], H = [], G = [];
			for (let t = 0; t < E; t++) {
				if (!M(c, t)) {
					D.push(null), j.push(null), P.push(null), F.push(null), I.push(null), L.push(null), R.push(null), B.push(null), H.push(null), G.push(null);
					continue;
				}
				let r = d ? a[c][t] : N(c, t), i = d ? e[c][t] : 0, o = U.x + v(t, E, k, O) * U.w, s = V.fraction(r), l = V.fraction(i), u = Number.isFinite(l) ? l : i <= V.min ? 0 : 1, f = Number.isFinite(s) && s >= 0 && s <= 1, p = Number.isFinite(s) ? Math.max(0, Math.min(1, s)) : r <= V.min ? 0 : 1, m = U.y + U.h - p * U.h, h = U.y + U.h - Math.max(0, Math.min(1, u)) * U.h;
				D.push(n.chartType.toLowerCase().includes("area") || f ? x.project(o, m, T) : null), j.push(x.project(o, h, T)), P.push(f ? x.cameraDepth(o, m, T) : null), F.push(x.cameraDepth(o, h, T)), I.push(r), L.push(o), R.push(m), B.push(h), H.push(s), G.push(u);
			}
			let q = [], J = null;
			for (let e = 0; e < D.length; e++) {
				let t = D[e], n = j[e];
				if (!t || !n) {
					A === "gap" && (J && q.push(J), J = null);
					continue;
				}
				J ??= {
					upper: [],
					lower: [],
					upperDepths: [],
					lowerDepths: [],
					indices: [],
					sceneXs: [],
					upperYs: [],
					lowerYs: [],
					upperFractions: [],
					lowerFractions: []
				}, J.upper.push(t), J.lower.push(n), J.upperDepths.push(P[e] ?? 0), J.lowerDepths.push(F[e] ?? 0), J.indices.push(e), J.sceneXs.push(L[e] ?? 0), J.upperYs.push(R[e] ?? 0), J.lowerYs.push(B[e] ?? 0), J.upperFractions.push(H[e] ?? 0), J.lowerFractions.push(G[e] ?? 0);
			}
			J && q.push(J);
			let Y = [], ne = [];
			if (n.chartType.toLowerCase().includes("area")) {
				for (let e of q) {
					let n = null;
					for (let r = 0; r + 1 < e.upper.length; r++) {
						let i = Xe(e.lowerFractions[r], e.lowerFractions[r + 1], e.upperFractions[r], e.upperFractions[r + 1]);
						for (let a = 0; a < i.length; a++) {
							let o = i[a], s = e.sceneXs[r] + (e.sceneXs[r + 1] - e.sceneXs[r]) * o.startT, c = e.sceneXs[r] + (e.sceneXs[r + 1] - e.sceneXs[r]) * o.endT, l = U.y + U.h - o.lowerStart * U.h, u = U.y + U.h - o.lowerEnd * U.h, d = U.y + U.h - o.upperStart * U.h, p = U.y + U.h - o.upperEnd * U.h, h = {
								...x.project(s, d, T),
								cameraDepth: x.cameraDepth(s, d, T),
								cameraWeight: x.cameraProjectionWeight(s, d, T)
							}, v = {
								...x.project(c, p, T),
								cameraDepth: x.cameraDepth(c, p, T),
								cameraWeight: x.cameraProjectionWeight(c, p, T)
							};
							n != null && Math.hypot(n.at(-1).x - h.x, n.at(-1).y - h.y) <= 1e-8 ? n.push(v) : (n && n.length >= 2 && Y.push(n), n = [h, v]);
							let y = Ht(x, s, c, l, u, d, p, _.near, _.far, g, r === 0 && a === 0 && o.startT === 0, r + 2 === e.upper.length && a + 1 === i.length && o.endT === 1);
							for (let e of y) {
								if (f.length >= 1e4) {
									m = !0;
									break;
								}
								f.push({
									points: e.points,
									cameraDepth: e.cameraDepth,
									cameraDepths: e.cameraDepths,
									cameraWeights: e.cameraWeights,
									layer: 0,
									paint: () => Kt(t, e)
								}), ne.push(e);
							}
							if (m) break;
						}
						if (m) break;
					}
					if (n && n.length >= 2 && Y.push(n), m) break;
				}
				Jt(t, ne, "fill", h.fill, o);
			}
			let X = [];
			if (!n.chartType.toLowerCase().includes("area")) {
				let e = [], t = null;
				for (let n = 0; n < E; n++) {
					let r = I[n], i = r == null ? NaN : V.fraction(r);
					if (r == null || !Number.isFinite(i)) {
						A === "gap" && t && (e.push(t), t = null);
						continue;
					}
					t ??= [], t.push({
						x: U.x + v(n, E, k, O) * U.w,
						fraction: i,
						ownerIndex: n
					});
				}
				t && e.push(t);
				let n = (e) => {
					let t = Math.max(0, Math.min(1, e.fraction)), n = U.y + U.h - t * U.h;
					return {
						...x.project(e.x, n, T),
						cameraDepth: x.cameraDepth(e.x, n, T),
						cameraWeight: x.cameraProjectionWeight(e.x, n, T)
					};
				}, r = (e) => {
					e && e.path.length >= 2 && X.push(e);
				};
				for (let t of e) {
					if (t.length < 2) continue;
					let e = [t[0]];
					for (let n = 0; n + 1 < t.length; n++) {
						let r = t[n - 1] ?? t[n], i = t[n], a = t[n + 1], o = t[n + 2] ?? a;
						if (l.smooth !== !0 || t.length < 3) {
							e.push(a);
							continue;
						}
						let s = {
							x: i.x + (a.x - r.x) / 6,
							fraction: i.fraction + (a.fraction - r.fraction) / 6
						}, c = {
							x: a.x - (o.x - i.x) / 6,
							fraction: a.fraction - (o.fraction - i.fraction) / 6
						};
						for (let t = 1; t <= 12; t++) {
							let n = t / 12, r = 1 - n;
							e.push({
								x: r * r * r * i.x + 3 * r * r * n * s.x + 3 * r * n * n * c.x + n * n * n * a.x,
								fraction: r * r * r * i.fraction + 3 * r * r * n * s.fraction + 3 * r * n * n * c.fraction + n * n * n * a.fraction,
								ownerIndex: a.ownerIndex
							});
						}
					}
					let i = null, a = 0;
					for (let t = 0; t + 1 < e.length; t++) {
						let o = e[t], s = e[t + 1], c = (e) => x.project(e.x, U.y + U.h - e.fraction * U.h, T), l = c(o), u = c(s), d = Math.hypot(u.x - l.x, u.y - l.y), f = Number.isFinite(d) ? d : Math.hypot(s.x - o.x, (s.fraction - o.fraction) * U.h), p = Ye(o.fraction, s.fraction);
						if (!p || p.endT - p.startT <= 1e-12) {
							r(i), i = null, a += f;
							continue;
						}
						let m = (e) => ({
							x: o.x + (s.x - o.x) * e,
							fraction: o.fraction + (s.fraction - o.fraction) * e,
							ownerIndex: s.ownerIndex
						}), h = c(m(p.startT)), g = Math.hypot(h.x - l.x, h.y - l.y), _ = n(m(p.startT)), v = n(m(p.endT)), y = m(p.startT), b = m(p.endT), S = (e) => ({
							x: e.x,
							y: U.y + U.h - Math.max(0, Math.min(1, e.fraction)) * U.h
						});
						i != null && Math.hypot(i.path.at(-1).x - _.x, i.path.at(-1).y - _.y) <= 1e-8 && i.ownerIndex === s.ownerIndex ? (i.path.push(v), i.modelPath.push(S(b)), i.endClipped = t + 1 < e.length - 1 || p.endT < 1) : (r(i), i = {
							path: [_, v],
							modelPath: [S(y), S(b)],
							ownerIndex: s.ownerIndex,
							startClipped: t > 0 || p.startT > 0,
							endClipped: t + 1 < e.length - 1 || p.endT < 1,
							dashOffset: a + (Number.isFinite(g) ? g : f * p.startT)
						}), a += f;
					}
					r(i);
				}
			}
			let Z = n.chartType.toLowerCase().includes("area"), re = l.lineHidden != null || l.lineColor != null || l.lineWidthEmu != null || l.chartexStyle?.lineHidden != null || l.chartexStyle?.lineColors?.some(Boolean) || l.chartexStyle?.lineWidthEmu != null || l.chartexStyle?.lineDash != null || l.chartexStyle?.lineCap != null || l.chartexStyle?.lineJoin != null || h.lineColor != null || h.lineFill !== void 0;
			if (!Z || h.lineFill !== null && re) {
				let e = /* @__PURE__ */ new Map(), r = (t) => {
					let r = W[c].get(t);
					if (!Pt(r)) return h;
					let i = e.get(t);
					return i || (i = $(n, l, r, t, c), e.set(t, i)), i;
				}, a = /* @__PURE__ */ new Map(), s = {
					remaining: rt,
					exceeded: !1
				}, u = (e, n, r, o = r, c = 0, l) => {
					if (n.lineFill === null) return;
					let u = n === h ? g : n.color, d = n.lineColor ?? Ne(u, .7), p = n.lineWidthEmu ? Math.max(.5, n.lineWidthEmu / b) * i : Z ? .75 * i : Math.max(1, 2 * i), v = {
						width: p,
						dash: C(n.lineCustomDash, n.lineDash, p),
						dashOffset: c,
						lineCap: n.lineCap,
						startCap: r,
						endCap: o,
						lineJoin: n.lineJoin
					};
					if (!Z && l && l.length >= 2) {
						let e = dt(l.map((e) => ({
							...e,
							cameraDepth: 0,
							cameraWeight: 1
						})), v);
						if (e == null) {
							m = !0;
							return;
						}
						let r = a.get(n) ?? [];
						for (let n of e) {
							let e = qe({
								outline: n.points,
								nearDepth: _.near,
								farDepth: _.far
							});
							if (!e) continue;
							let i = Wt(x, e, d, void 0, s).map((e) => ({
								...e,
								paintRole: "outline"
							}));
							if (s.exceeded) {
								m = !0;
								return;
							}
							r.push(...i);
							for (let e of i) f.push({
								points: e.points,
								cameraDepth: e.cameraDepth,
								cameraDepths: e.cameraDepths,
								cameraWeights: e.cameraWeights,
								layer: 1,
								paint: () => Kt(t, e)
							});
						}
						a.set(n, r);
						return;
					}
					let y = dt(e, v);
					if (y == null) {
						m = !0;
						return;
					}
					if (f.length + y.length > 1e4) {
						m = !0;
						return;
					}
					for (let e of y) {
						let r = {
							points: e.points,
							color: d,
							paintRole: "outline",
							shade: 0,
							cameraDepth: e.cameraDepth,
							cameraDepths: e.cameraDepths,
							cameraWeights: e.cameraWeights,
							outline: !1
						}, i = a.get(n) ?? [];
						i.push(r), a.set(n, i), f.push({
							points: e.points,
							cameraDepth: e.cameraDepth,
							cameraDepths: e.cameraDepths,
							cameraWeights: e.cameraWeights,
							layer: 1,
							paint: () => Kt(t, r)
						});
					}
				};
				if (Z) for (let e of Y) u(e, h, h.lineCap);
				else for (let e of X) {
					let t = r(e.ownerIndex);
					u(e.path, t, e.startClipped ? "butt" : t.lineCap, e.endClipped ? "butt" : t.lineCap, e.dashOffset, e.modelPath);
				}
				for (let [e, n] of a) Jt(t, n, "outline", e.lineFill, o);
			}
			let ie = (Z ? l.showMarker === !0 || s(l) : l.showMarker === !0) && l.markerSymbol !== "none";
			if ((n.chartType.toLowerCase().includes("line") || Z) && (ie || z(l))) for (let e = 0; e < D.length; e++) {
				let r = D[e];
				if (!r) continue;
				let a = W[c].get(e), s = ve(l, a, "circle", ie);
				if (s === "none") continue;
				let u = a?.markerSize ?? l.markerSize ?? 5, d = ln(n, l, a, e, c, l.color ?? xt[c % xt.length], i);
				p.push(() => en(t, r, s, Math.max(2, u) * i, d.fill === "00000000" ? "transparent" : `#${d.fill.replace(/^#/, "")}`, d.line === "00000000" ? "rgba(0,0,0,0)" : `#${d.line.replace(/^#/, "")}`, d.lineWidth, d.fillPaint, o, i, d.effectDirect, d.effectFallback, d.effectIndex, d.effectFallbackIndex, d.linePaint, d.lineDash, d.lineCustomDash, d.lineCap, d.lineJoin));
			}
			for (let e = 0; e < D.length; e++) {
				let s = D[e];
				if (!s) continue;
				let u = N(c, e), f = W[c].get(e), p = f?.markerSize ?? l.markerSize ?? 5, m = K[c].get(e);
				nn(n, l, m) && te.push(() => tn(t, n, l, c, e, S ? u / 100 : u, s, r, i, l.showMarker === !0 || f?.markerSymbol != null ? p * i / 2 : 0, void 0, m, "t", s, !0, n.valAxisDisplayUnits, V.max, d ? a[c][e] : u, o));
			}
		}
		if (m) return Yt(t, r), !0;
		for (let e of nt(f)) e.paint();
		for (let e of p) e();
	}
	xn(t, n, x, V, E, k, O, i, u ? "horizontal" : "vertical"), On(t, n, x, V, E, k, O, u ? "horizontal" : "vertical", l, i), cn(t, n, r, x, V, E, k, O, u ? "horizontal" : "vertical", l, i);
	let q = Dn(n, x, V, E, k, O, u ? "horizontal" : "vertical"), J = (e, t) => {
		if (t !== "low" && t !== "high") return q;
		let n = x.topology.nearDepth, r = q.axisX, i = q.axisY;
		if (e === "value" === u) {
			let e = U.y, r = U.y + U.h, a = x.project(U.x + U.w / 2, e, n), o = x.project(U.x + U.w / 2, r, n), s = a.y >= o.y ? e : r;
			i = t === "low" ? s : s === e ? r : e;
		} else {
			let e = U.x, i = U.x + U.w, a = x.project(e, U.y + U.h / 2, n), o = x.project(i, U.y + U.h / 2, n), s = a.x <= o.x ? e : i;
			r = t === "low" ? s : s === e ? i : e;
		}
		return {
			axisX: r,
			axisY: i,
			depth: n,
			horizontalStart: x.project(U.x, i, n),
			horizontalEnd: x.project(U.x + U.w, i, n),
			verticalStart: x.project(r, U.y + U.h, n),
			verticalEnd: x.project(r, U.y, n)
		};
	}, Y = J("value", n.valAxisTickLabelPos), ne = J("category", n.catAxisTickLabelPos), X = G(n.valAxisFontSizeHpt, i) ?? 9 * i;
	if (t.font = `${n.valAxisFontItalic ? "italic " : ""}${n.valAxisFontBold ? "bold " : ""}${X}px ${Lt(n, n.valAxisFontFace)}`, t.fillStyle = n.valAxisFontColor ? `#${n.valAxisFontColor}` : "#595959", t.textAlign = u ? "center" : "right", t.textBaseline = u ? "top" : "middle", !n.valAxisHidden && n.valAxisTickLabelPos !== "none") {
		let { axisX: e, axisY: r, depth: o } = Y, s = x.project(U.x + U.w / 2, U.y + U.h / 2, o), c = Sn(u ? Y.horizontalStart : Y.verticalStart, u ? Y.horizontalEnd : Y.verticalEnd, s, u ? "vertical" : "horizontal");
		t.textAlign = Math.abs(c.x) < .2 ? "center" : c.x < 0 ? "right" : "left", t.textBaseline = Math.abs(c.y) < .2 ? "middle" : c.y < 0 ? "bottom" : "top";
		let l = En(n.valAxisMajorTickMark, n.valAxisLineHidden, i, 5), d = n.valAxisDisplayUnits?.divisor;
		for (let i of V.majorTicks) {
			let s = u ? x.project(U.x + V.fraction(i) * U.w, r, o) : x.project(e, U.y + U.h - V.fraction(i) * U.h, o);
			R(t, a(S ? i / 100 : d != null && Number.isFinite(d) && d > 0 ? i / d : i, S ? n.valAxisFormatCode ?? "0%" : n.valAxisFormatCode, n.date1904), s.x + c.x * l, s.y + c.y * l, _e(X));
		}
	}
	let Z = G(n.catAxisFontSizeHpt, i) ?? 9 * i;
	if (t.font = `${n.catAxisFontItalic ? "italic " : ""}${n.catAxisFontBold ? "bold " : ""}${Z}px ${Lt(n, n.catAxisFontFace)}`, t.fillStyle = n.catAxisFontColor ? `#${n.catAxisFontColor}` : "#595959", !n.catAxisHidden && n.catAxisTickLabelPos !== "none") {
		let e = c(En(n.catAxisMajorTickMark, n.catAxisLineHidden, i, 6), n.catAxisLabelOffsetPercent), r = Array.from({ length: E }, (e, t) => he(String(T[t] ?? t + 1), n.catAxisFormatCode, n.date1904)), a = Xt(n);
		if (a == null && (a = 0, !u && E > 1)) {
			let e = Infinity, n = null, i = ne.axisY;
			for (let t = 0; t < E; t++) {
				let r = v(t, E, k, O), a = x.project(U.x + r * U.w, i, x.topology.nearDepth);
				n && (e = Math.min(e, Math.hypot(a.x - n.x, a.y - n.y))), n = a;
			}
			Math.max(0, ...r.map((e) => w(t, e))) > e * .9 && (a = -Math.PI / 4);
		}
		let o = Math.max(1, Math.floor(n.catAxisTickLabelSkip ?? 1));
		for (let n = 0; n < E; n += o) {
			let i = v(n, E, k, O), { axisX: o, axisY: s, depth: c } = ne, l = u ? x.project(o, U.y + v(n, E, k, O) * U.h, c) : x.project(U.x + i * U.w, s, c);
			if (u) {
				let i = x.project(o, U.y + U.h / 2, c), a = x.project(U.x + U.w / 2, U.y + U.h / 2, c), s = i.x <= a.x;
				t.textAlign = s ? "right" : "left", t.textBaseline = "middle", R(t, r[n], l.x + (s ? -e : e), l.y, _e(Z));
			} else {
				let i = x.project(U.x + U.w / 2, U.y + U.h / 2, c), o = Sn(ne.horizontalStart, ne.horizontalEnd, i, "vertical");
				$t(t, r[n], l, a, u, o.y < 0 ? -1 : 1, e, _e(Z));
			}
		}
	}
	sn(t, n, r, m, u, i);
	for (let e of te) e();
	return fn(t, n, h, i, !1, _, o), !0;
}
function An(t, n, r, i, a) {
	if (!n.threeD || n.chartType !== "pie") return !1;
	let o = n.series[0];
	if (!o) return !0;
	let s = o.values.flatMap((e, t) => e != null && Number.isFinite(e) ? [{
		index: t,
		value: Math.abs(e)
	}] : []), c = 0;
	for (let e of s) c = Math.max(c, e.value);
	if (!(c > 0)) return !0;
	let l = s.reduce((e, t) => e + t.value / c, 0);
	if (!(l > 0) || !Number.isFinite(l)) return !0;
	let { plot: u, legend: d, legendMeasure: f } = rn(t, n, r, i, "radial", a), p = Te({
		...n.threeD,
		rotationY: n.threeD.rotationY ?? 0,
		heightPercent: void 0,
		depthPercent: 100
	}, u, {
		sceneDepthScale: 1,
		sceneHeightScale: .15
	});
	if (!p) return !0;
	let m = new Map(o.dataPointOverrides?.map((e) => [e.idx, e]) ?? []), h = 0;
	for (let e of m.values()) e.explosion != null && Number.isFinite(e.explosion) && (h = Math.max(h, Math.max(0, Math.min(100, e.explosion)) / 100));
	let { scene: _ } = p, v = Math.min(_.w * .45 / (1 + h), p.modelDepth * .45 / (1 + h), _.h / .45);
	if (!(v > 0)) return !0;
	let y = _.x + _.w / 2, x = _.y + _.h / 2, S = .5, w = v * .3 * Ae(n.threeD), T = 0, E = [], D = new Map(o.dataLabelOverrides?.map((e) => [e.idx, e]) ?? []), O = Math.max(48, Math.min(128, Math.ceil(Math.PI * 2 * v / 4)));
	for (let e of s) {
		let t = e.value / c / l, r = mn(n.firstSliceAngle, T, t), i = m.get(e.index), a = $(n, o, i, e.index, 0), s = r.middle, u = i?.explosion != null && Number.isFinite(i.explosion) ? Math.max(0, Math.min(100, i.explosion)) / 100 : 0, d = y + Math.cos(s) * v * u, f = S + Math.sin(s) * v * u / p.modelDepth, h = Math.max(2, Math.ceil(O * t)), g = Je({
			centerX: d,
			centerY: x,
			centerDepth: f,
			radius: v,
			modelDepth: p.modelDepth,
			thickness: w,
			startAngle: r.start,
			endAngle: r.end,
			segments: h
		});
		if (!g) {
			T += t;
			continue;
		}
		E.push({
			index: e.index,
			start: r.start,
			end: r.end,
			color: a.fill === null ? "transparent" : a.color,
			fillPaint: a.fill,
			value: e.value,
			percentValue: t,
			centerX: d,
			centerDepth: f,
			segments: h,
			mesh: g,
			lineColor: a.lineColor,
			lineFill: a.lineFill,
			lineWidthEmu: a.lineWidthEmu ?? null,
			lineDash: a.lineDash ?? "solid",
			lineCustomDash: a.lineCustomDash,
			lineCap: a.lineCap,
			lineJoin: a.lineJoin
		}), T += t;
	}
	p = Me(p, E.flatMap((e) => e.mesh.vertices), u, .08);
	let k = [], A = {
		remaining: rt,
		exceeded: !1
	}, j = (e) => {
		let t = e.lineWidthEmu == null ? .75 * i : Math.max(.25, e.lineWidthEmu / b * i);
		return e.lineFill !== null && (e.lineColor != null || e.lineFill !== void 0) ? {
			color: e.lineColor ?? "rgba(0,0,0,0.42)",
			width: t,
			dash: C(e.lineCustomDash, e.lineDash, t),
			cap: e.lineCap,
			join: e.lineJoin
		} : void 0;
	}, M = E.map((e) => {
		let n = Wt(p, e.mesh, e.color, void 0, A);
		return Jt(t, n, "fill", e.fillPaint, a), {
			slice: e,
			faces: n
		};
	}), N = M.flatMap((e) => e.faces), P = [], F = E.map(j), I = F[0], L = (e) => e == null ? null : [
		e.color,
		e.width,
		e.dash.join(","),
		e.cap,
		e.join
	].join("|"), R = I != null && E.every((e) => e.lineFill === void 0) && F.every((e) => L(e) === L(I)) && E.every((e) => Math.abs(e.centerX - y) < 1e-9 && Math.abs(e.centerDepth - S) < 1e-9);
	if (R) P.push(...Gt(p, E, x, v, w, I, A));
	else for (let e = 0; e < E.length; e++) {
		let n = F[e];
		if (!n) continue;
		let r = Wt(p, E[e].mesh, "transparent", n, A, !0);
		Jt(t, r, "outline", E[e].lineFill, a), P.push(...r);
	}
	if (A.exceeded) return Yt(t, r), !0;
	if (R) {
		for (let e of nt(N)) Kt(t, e);
		for (let e of nt(P)) Kt(t, e);
	} else for (let e of nt([...N, ...P])) Kt(t, e);
	for (let { slice: r, faces: a } of M) {
		let s = m.get(r.index), c = Le(n, o, r.index, 0), l = g(s?.chartexStyle);
		xe(t, l ?? g(o.chartexStyle), e(n, "dataPoint3D", 0), l ? r.index : c, i, (e) => qt(e, a), c);
	}
	for (let e of E) {
		let r = (e.start + e.end) / 2, s = D.get(e.index);
		if (nn(n, o, s)) {
			let c = o.seriesDataLabels, l = G(s?.fontSizeHpt ?? c?.fontSizeHpt ?? n.dataLabelFontSizeHpt, i) ?? 9 * i;
			t.font = `${s?.fontBold ?? c?.fontBold ?? n.dataLabelFontBold ? "bold " : ""}${l}px ${Rt(n, s?.fontFace ?? c?.fontFace ?? n.dataLabelFontFace)}`;
			let d = B({
				customText: s?.text,
				showCategory: s?.showCatName ?? c?.showCatName ?? !1,
				showSeries: s?.showSerName ?? c?.showSerName ?? !1,
				showValue: s?.showVal ?? c?.showVal ?? n.showDataLabels,
				showPercent: s?.showPercent ?? c?.showPercent ?? !1,
				category: o.categories?.[e.index] ?? n.categories[e.index] ?? `${e.index + 1}`,
				seriesName: o.name || "Series 1",
				sourceValue: e.value,
				percentRatio: e.percentValue,
				formatCode: s?.formatCode ?? c?.formatCode ?? n.dataLabelFormatCode ?? o.valFormatCode,
				separator: s?.separator ?? c?.separator,
				date1904: n.date1904
			}), f = Rt(n, s?.fontFace ?? c?.fontFace ?? n.dataLabelFontFace), m = s?.text && s.richRuns?.length ? Fe(t, {
				runs: s.richRuns,
				ptToPx: i,
				fontFamily: f,
				fallbackBold: s.fontBold ?? c?.fontBold ?? n.dataLabelFontBold ?? !1,
				fontFamilyForFace: (e) => Rt(n, e)
			}, l, `#${s.fontColor ?? c?.fontColor ?? o.labelColor ?? n.dataLabelFontColor ?? "111111"}`) : null, h = s?.position ?? c?.position ?? n.dataLabelPosition, g = x - w / 2, _ = x + w / 2, y = p.cameraDepth(e.centerX, g, e.centerDepth) >= p.cameraDepth(e.centerX, _, e.centerDepth) ? g : _, b = 0, S = null;
			for (let t = 0; t <= 12; t++) {
				let n = e.start + (e.end - e.start) * t / 12, r = p.project(e.centerX + Math.cos(n) * v * .64, y, e.centerDepth + Math.sin(n) * v * .64 / p.modelDepth);
				S && (b += Math.hypot(r.x - S.x, r.y - S.y)), S = r;
			}
			let C = (h == null || h === "bestFit") && (e.percentValue === 0 || b < (m?.width ?? t.measureText(d).width)) || h === "outEnd", T = v * (C ? 1.12 : .64), E = p.project(e.centerX + Math.cos(r) * T, y, e.centerDepth + Math.sin(r) * T / p.modelDepth), D = p.project(e.centerX + Math.cos(r) * v, y, e.centerDepth + Math.sin(r) * v / p.modelDepth);
			k.push(() => tn(t, n, o, 0, e.index, e.value, E, u, i, 0, e.percentValue, s, "ctr", D, C, void 0, void 0, void 0, a));
		}
	}
	for (let e of k) e();
	let z = o.categories?.length ? o.categories : n.categories, V = Array.from({ length: z.length }, (e, t) => {
		let r = m.get(t), i = Re(n, o, r, t, 0);
		if (i === null) return "00000000";
		let a = i?.fillType === "solid" ? i.color : r?.color ?? o.dataPointColors?.[t] ?? o.color;
		return a === "00000000" ? "00000000" : Ne(a ? `#${a}` : Dt(t), .8).replace(/^#/, "");
	});
	return fn(t, {
		...n,
		categories: z,
		series: [{
			...o,
			categories: z,
			dataPointColors: V
		}]
	}, d, i, !0, f, a), !0;
}
function jn(e, t, n, r, i = 0) {
	return !t.threeD || !(t.chartType === "pie" || wt.has(t.chartType)) ? !1 : Mt(t) ? An(e, t, n, r, i) ? !0 : kn(e, t, n, r, i) : (Yt(e, n), !0);
}
var Mn = Ie({ render: jn }, "threeD");
export { Mn as threeD };
