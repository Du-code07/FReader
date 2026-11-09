import { Ao as e, Co as t, Do as n, Dr as r, Fa as i, Fo as a, Fr as o, Gn as s, Hn as c, Io as l, Ir as u, Jn as d, Kn as f, No as p, Oo as m, Pa as h, Pr as g, So as _, Tr as v, Un as y, Vn as b, Vr as x, Wn as S, Yn as C, _o as w, a as T, ai as E, ar as D, bo as O, c as k, cr as A, d as j, do as M, fo as N, fr as P, go as F, gr as I, h as L, ho as R, i as z, ii as B, jo as V, ko as H, lr as U, m as W, mo as G, mr as ee, ni as te, nr as K, o as ne, oi as q, or as re, po as ie, pr as ae, qn as oe, r as se, ri as ce, u as le, uo as ue, ur as de, vo as fe, wo as J, wr as pe, xo as me, xr as he, yo as ge } from "./plot-area-frame-DNYMd9Pf.js";
import { $ as _e, At as ve, Ct as ye, Dt as be, Et as xe, Ft as Se, It as Ce, Jt as we, Kt as Te, Lt as Ee, Mt as De, Nt as Oe, Ot as ke, Pt as Ae, Q as je, Rt as Me, S as Ne, St as Pe, Z as Fe, _n as Ie, a as Le, at as Re, b as ze, bt as Be, d as Ve, en as He, et as Ue, f as We, g as Ge, gn as Ke, gt as qe, h as Je, ht as Ye, in as Xe, it as Ze, k as Qe, kt as $e, l as et, nt as tt, pt as nt, qt as rt, rt as it, s as at, tt as ot, un as st, ut as ct, v as lt, wt as ut, x as dt, xt as ft, y as pt, yt as mt } from "./bounded-raw-part-cache-B5a6cGKO.js";
import { a as ht, c as gt, d as _t, f as vt, h as yt, m as bt, o as xt, p as St, r as Ct, s as wt, t as Tt, u as Et, y as Dt } from "./line-distribute-CwtditQo.js";
import { a as Ot, f as kt, i as At, u as jt } from "./pixel-budget-DI82Hn3R.js";
import { H as Mt, L as Nt, M as Pt, R as Ft, V as It, n as Lt, r as Rt, t as zt } from "./renderer-DpTePxGq.js";
import { i as Bt } from "./tiff-contract-DEd8CGuz.js";
import { _ as Vt, g as Ht, h as Ut } from "./three-d-BfMZVR0w.js";
import { a as Wt, o as Gt } from "./duotone-GK4Hqn7f.js";
import { _ as Kt, a as qt, c as Jt, d as Yt, f as Xt, h as Zt, i as Qt, l as $t, m as en, n as tn, o as nn, p as rn, s as an, t as on, u as sn, v as cn, y as ln } from "./resource-measurement-CfJtbwiR.js";
function un(e, t, n) {
	let r = typeof e.getTransform == "function" ? e.getTransform() : {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		e: 0,
		f: 0
	};
	if (![
		t,
		n,
		t + n,
		e.canvas.width,
		e.canvas.height,
		r.a,
		r.b,
		r.c,
		r.d,
		r.e,
		r.f
	].every(Number.isFinite)) return;
	let i = Math.max(Math.abs(r.a), Math.abs(r.c)), a = Math.max(Math.abs(r.b), Math.abs(r.d));
	if (i === 0 || a === 0) return;
	let o = r.a / i, s = r.c / i, c = r.b / a, l = o * (r.d / a) - c * s;
	if (l === 0) return;
	let u = Infinity, d = -Infinity;
	for (let t of [0, e.canvas.width]) for (let n of [0, e.canvas.height]) {
		let e = ((c === 0 ? 0 : -c * ((t - r.e) / i)) + (o === 0 ? 0 : o * ((n - r.f) / a))) / l;
		if (!Number.isFinite(e)) return;
		u = Math.min(u, e), d = Math.max(d, e);
	}
	let f = d - u;
	Number.isFinite(f) && (e.beginPath(), e.rect(t, u, n, f), e.clip());
}
function dn(e, t) {
	let n = e.fieldType === "slidenum" && t !== void 0 ? String(t) : e.text;
	return e.caps === "all" || e.caps === "small" ? n.toUpperCase() : n;
}
function fn(e, t) {
	let n = ce(e, 1, 1)?.getContext("2d");
	if (!n) return;
	let r = { paths: [] }, i = Infinity, a = Infinity, o = -Infinity, s = -Infinity, c = (e) => {
		if (!(!e || ![
			e.x,
			e.y,
			e.w,
			e.h
		].every(Number.isFinite)) && (i = Math.min(i, e.x), a = Math.min(a, e.y), o = Math.max(o, e.x + e.w), s = Math.max(s, e.y + e.h), n.shadowColor !== "rgba(0, 0, 0, 0)" && n.shadowColor !== "transparent")) {
			let t = 3 * n.shadowBlur;
			i = Math.min(i, e.x + n.shadowOffsetX - t), a = Math.min(a, e.y + n.shadowOffsetY - t), o = Math.max(o, e.x + e.w + n.shadowOffsetX + t), s = Math.max(s, e.y + e.h + n.shadowOffsetY + t);
		}
	}, l = (e, t, r, i, a = 0) => {
		let o = n.getTransform(), s = [
			[e, t],
			[e + r, t],
			[e + r, t + i],
			[e, t + i]
		], l = s.map(([e, t]) => o.a * e + o.c * t + o.e), u = s.map(([e, t]) => o.b * e + o.d * t + o.f), d = a * Math.hypot(o.a, o.c), f = a * Math.hypot(o.b, o.d);
		c({
			x: Math.min(...l) - d,
			y: Math.min(...u) - f,
			w: Math.max(...l) - Math.min(...l) + 2 * d,
			h: Math.max(...u) - Math.min(...u) + 2 * f
		});
	};
	return t(new Proxy(n, {
		get(t, i) {
			if (i === "canvas") return e.canvas;
			let a = Reflect.get(t, i, t);
			return typeof a == "function" ? (...e) => {
				let o = String(i), s = n.getTransform();
				if (ee(r, {
					a: s.a,
					b: s.b,
					c: s.c,
					d: s.d,
					e: s.e,
					f: s.f
				}, o, e), o === "fillText" || o === "strokeText") {
					let [t, r, i, a] = e, s = n.measureText(t), c = a !== void 0 && s.width > a ? a / s.width : 1;
					l(r - s.actualBoundingBoxLeft * c, i - s.actualBoundingBoxAscent, (s.actualBoundingBoxLeft + s.actualBoundingBoxRight) * c, s.actualBoundingBoxAscent + s.actualBoundingBoxDescent, o === "strokeText" ? n.lineWidth / 2 * (n.lineJoin === "miter" ? n.miterLimit : 1) : 0);
					return;
				}
				if (o === "fill" || o === "stroke") {
					if (s.a * s.d - s.b * s.c === 0) return;
					c(I(r, s, {
						lineWidth: o === "stroke" ? n.lineWidth : 0,
						lineCap: n.lineCap,
						lineJoin: n.lineJoin,
						miterLimit: n.miterLimit,
						dash: n.getLineDash()
					}));
					return;
				}
				if (o === "fillRect" || o === "strokeRect") {
					let [t, r, i, a] = e;
					l(t, r, i, a, o === "strokeRect" ? n.lineWidth / 2 * Math.max(1, n.miterLimit) : 0);
					return;
				}
				if (o === "drawImage") {
					let t = e[0], [n, r, i, a] = e.length === 9 ? e.slice(5) : e.length === 5 ? e.slice(1) : [
						e[1],
						e[2],
						t.width,
						t.height
					];
					l(n, r, i, a);
					return;
				}
				if (o !== "clearRect") return Reflect.apply(a, t, e);
			} : a;
		},
		set(e, t, n) {
			return Reflect.set(e, t, n, e);
		}
	})), o > i && s > a ? {
		x: i,
		y: a,
		w: o - i,
		h: s - a
	} : void 0;
}
var pn = 6.28, mn = 26;
function Y(e = 0, t = 0, n = 0, r = 0, i = 0) {
	return {
		kind: "orthographic",
		baseLat: e,
		baseLon: t,
		baseRev: n,
		fovDeg: 0,
		shearX: r,
		shearY: i
	};
}
function X(e, t, n, r = 45) {
	return {
		kind: "perspective",
		baseLat: e,
		baseLon: t,
		baseRev: n,
		fovDeg: r,
		sceneInches: pn,
		shearX: 0,
		shearY: 0
	};
}
var hn = {
	isometricBottomDown: Y(35.4, 314.7, 299.8),
	isometricBottomUp: Y(35.4, 45.3, 60.2),
	isometricLeftDown: Y(35, 45, 0),
	isometricLeftUp: Y(325, 45, 0),
	isometricOffAxis1Left: Y(18, 64, 0),
	isometricOffAxis1Right: Y(18, 334, 0),
	isometricOffAxis1Top: Y(301.3, 306.5, 57.6),
	isometricOffAxis2Left: Y(18, 26, 0),
	isometricOffAxis2Right: Y(18, 296, 0),
	isometricOffAxis2Top: Y(301.3, 53.5, 302.4),
	isometricOffAxis3Bottom: Y(58.7, 306.5, 302.4),
	isometricOffAxis3Left: Y(342, 64, 0),
	isometricOffAxis3Right: Y(342, 334, 0),
	isometricOffAxis4Bottom: Y(58.7, 53.5, 57.6),
	isometricOffAxis4Left: Y(342, 26, 0),
	isometricOffAxis4Right: Y(342, 296, 0),
	isometricRightDown: Y(325, 315, 0),
	isometricRightUp: Y(35, 315, 0),
	isometricTopDown: Y(324.6, 45.3, 299.8),
	isometricTopUp: Y(324.6, 314.7, 60.2),
	obliqueBottom: Y(0, 0, 0, 0, -.3),
	obliqueBottomLeft: Y(0, 0, 0, .3 / Math.sqrt(2), -.3 / Math.sqrt(2)),
	obliqueBottomRight: Y(0, 0, 0, -.3 / Math.sqrt(2), -.3 / Math.sqrt(2)),
	obliqueLeft: Y(0, 0, 0, .3, 0),
	obliqueRight: Y(0, 0, 0, -.3, 0),
	obliqueTop: Y(0, 0, 0, 0, .3),
	obliqueTopLeft: Y(0, 0, 0, .3 / Math.sqrt(2), .3 / Math.sqrt(2)),
	obliqueTopRight: Y(0, 0, 0, -.3 / Math.sqrt(2), .3 / Math.sqrt(2)),
	orthographicFront: Y(0, 0, 0),
	perspectiveAbove: X(340, 0, 0),
	perspectiveAboveLeftFacing: X(39.3, 14.3, 341.1),
	perspectiveAboveRightFacing: X(39.3, 345.7, 18.9),
	perspectiveBelow: X(20, 0, 0),
	perspectiveContrastingLeftFacing: X(10.4, 43.9, 356.4),
	perspectiveContrastingRightFacing: X(10.4, 316.1, 3.6),
	perspectiveFront: X(0, 0, 0),
	perspectiveHeroicExtremeLeftFacing: X(8.1, 34.5, 357.1, 80),
	perspectiveHeroicExtremeRightFacing: X(8.1, 325.5, 2.9, 80),
	perspectiveHeroicLeftFacing: X(349, 14.3, 2.6),
	perspectiveHeroicRightFacing: X(349, 345.7, 357.4),
	perspectiveLeft: X(0, 20, 0),
	perspectiveRelaxed: X(309.6, 0, 0),
	perspectiveRelaxedModerately: X(324.8, 0, 0),
	perspectiveRight: X(0, 340, 0)
}, gn = {
	...X(0, 0, 0, mn),
	sceneInches: void 0
};
function _n(e, t) {
	let n = Array(9).fill(0);
	for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) {
		let a = 0;
		for (let n = 0; n < 3; n++) a += e[r * 3 + n] * t[n * 3 + i];
		n[r * 3 + i] = a;
	}
	return n;
}
function vn(e) {
	let t = e * Math.PI / 180, n = Math.cos(t), r = Math.sin(t);
	return [
		1,
		0,
		0,
		0,
		n,
		-r,
		0,
		r,
		n
	];
}
function yn(e) {
	let t = e * Math.PI / 180, n = Math.cos(t), r = Math.sin(t);
	return [
		n,
		0,
		r,
		0,
		1,
		0,
		-r,
		0,
		n
	];
}
function bn(e) {
	let t = e * Math.PI / 180, n = Math.cos(t), r = Math.sin(t);
	return [
		n,
		-r,
		0,
		r,
		n,
		0,
		0,
		0,
		1
	];
}
function xn(e, t, n, r) {
	return [
		e[0] * t + e[1] * n + e[2] * r,
		e[3] * t + e[4] * n + e[5] * r,
		e[6] * t + e[7] * n + e[8] * r
	];
}
function Sn(e, t) {
	let n = t ? t.lat : e.baseLat, r = t ? t.lon : e.baseLon;
	return _n(bn(-(t ? t.rev : e.baseRev)), _n(vn(-n), yn(-r)));
}
function Cn(e) {
	return l(hn, e) || (e.startsWith("perspective") ? gn : hn.orthographicFront);
}
function wn(e, t, n, r, i, a) {
	let o = e.fov ?? t.fovDeg, s = Math.max(1, Math.min(179, o)) * Math.PI / 180, c = (t.sceneInches === void 0 ? Math.max(r, i) / 2 : t.sceneInches * (e.unitsPerInch ?? 96)) / Math.tan(s / 2), l = Math.max(0, e.sceneDepth ?? 0, a), u = Math.abs(n[6]) * r / 2 + Math.abs(n[7]) * i / 2, d = -n[8] * l, f = u + Math.max(0, d), p = 2 * u + Math.abs(d);
	return Math.max(c, f + .02 * p);
}
function Tn(e, t, n, r = 0) {
	let i = Cn(e.prst), a = Sn(i, e.rot);
	if (t <= 0 || n <= 0) return {
		corners: [
			{
				x: 0,
				y: 0
			},
			{
				x: t,
				y: 0
			},
			{
				x: t,
				y: n
			},
			{
				x: 0,
				y: n
			}
		],
		isAffine: !0,
		isIdentity: !0
	};
	let o = t / 2, s = n / 2, c = [
		[-o, -s],
		[o, -s],
		[o, s],
		[-o, s]
	], l = e.zoom ?? 1, u;
	if (i.kind === "perspective") {
		let o = wn(e, i, a, t, n, r);
		u = c.map(([e, t]) => {
			let [n, i, s] = xn(a, e, t, -r), c = o / (o - s);
			return [n * c, i * c];
		});
	} else u = c.map(([e, t]) => {
		let [n, o, s] = xn(a, e, t, -r);
		return [n + s * i.shearX, o + s * i.shearY];
	});
	u = u.map(([e, t]) => [e * l, t * l]);
	let d = u.map(([e, r]) => ({
		x: t / 2 + e,
		y: n / 2 + r
	})), f = .001 * Math.max(t, n), p = d[0].x + d[2].x - (d[1].x + d[3].x), m = d[0].y + d[2].y - (d[1].y + d[3].y), h = Math.abs(p) < f && Math.abs(m) < f, g = [
		[0, 0],
		[t, 0],
		[t, n],
		[0, n]
	], _ = !0;
	for (let e = 0; e < 4; e++) if (Math.abs(d[e].x - g[e][0]) > f || Math.abs(d[e].y - g[e][1]) > f) {
		_ = !1;
		break;
	}
	return {
		corners: d,
		isAffine: h,
		isIdentity: _
	};
}
function En(e, t, n, r = 0) {
	if (t !== void 0 && n !== void 0) {
		if (t <= 0 || n <= 0) return !1;
		if (e = {
			...e,
			sceneDepth: Math.max(e.sceneDepth ?? 0, r)
		}, !Tn(e, t, n).isIdentity) return !0;
		if (r <= 0) return !1;
		let i = Tn(e, t, n, r);
		if (Cn(e.prst).sceneInches === void 0) return !i.isIdentity;
		let a = .001 * Math.max(t, n);
		return i.corners.some((e) => e.x < -a || e.y < -a || e.x > t + a || e.y > n + a);
	}
	let i = Cn(e.prst), a = Sn(i, e.rot), o = i.kind === "perspective" ? [
		a[0] - 1,
		a[1],
		a[3],
		a[4] - 1,
		a[6],
		a[7]
	] : [
		a[0] + i.shearX * a[6] - 1,
		a[1] + i.shearX * a[7],
		a[3] + i.shearY * a[6],
		a[4] + i.shearY * a[7] - 1
	];
	if (r > 0) {
		if (i.kind === "perspective") return !0;
		o.push(a[2] + i.shearX * a[8], a[5] + i.shearY * a[8]);
	}
	return (e.zoom ?? 1) !== 1 || o.some((e) => Math.abs(e) > 1e-12);
}
function Dn(e) {
	let t = Cn(e.prst), n = Sn(t, e.rot);
	return {
		rotation: n,
		backFacing: n[8] - t.shearX * n[2] - t.shearY * n[5] < 0
	};
}
function On(e, t, n, r) {
	let i = Cn(e.prst), a = Sn(i, e.rot);
	if (t <= 0 || n <= 0 || r === 0) return {
		x: 0,
		y: 0
	};
	let o = e.zoom ?? 1, s = i.kind === "perspective" ? wn(e, i, a, t, n, r) : 0, c = (e) => {
		let [t, n, r] = xn(a, 0, 0, e);
		if (i.kind === "perspective") {
			let e = s / (s - r);
			return [t * e * o, n * e * o];
		}
		return [(t + r * i.shearX) * o, (n + r * i.shearY) * o];
	}, [l, u] = c(0), [d, f] = c(-r);
	return {
		x: d - l,
		y: f - u
	};
}
var kn = {
	angle: [[1, 1]],
	artDeco: [[
		0,
		.184095,
		.149238,
		.333333,
		.333333,
		.333333
	], [
		.333333,
		.701523,
		.63181,
		1,
		1,
		1
	]],
	circle: [[
		0,
		.55627,
		.44373,
		1,
		1,
		1
	]],
	convex: [
		[
			0,
			.07082,
			.0297458,
			.1,
			.101416,
			.1
		],
		[
			.501416,
			.1,
			.9,
			.7,
			.901416,
			.899999
		],
		[
			.9,
			.97167,
			.93343,
			1,
			1,
			1
		]
	],
	coolSlant: [[
		0,
		.138122,
		0,
		.2,
		.271356,
		.775535
	], [
		.377654,
		1,
		.519455,
		1,
		.583589,
		1
	]],
	cross: [
		[
			0,
			.05563,
			.04437,
			.1,
			.1,
			.1
		],
		[.4, .1],
		[
			.45563,
			.1,
			.5,
			.14437,
			.5,
			.2
		],
		[.5, .9],
		[
			.5,
			.95563,
			.54437,
			1,
			.6,
			1
		]
	],
	divot: [
		[
			0,
			.236604,
			.119276,
			.607024,
			.263046,
			.760235
		],
		[
			.361098,
			.864726,
			.457934,
			.909567,
			.537806,
			.925082
		],
		[
			.559245,
			.929246,
			.567625,
			.89793,
			.542066,
			.845567
		],
		[
			.484073,
			.726757,
			.477103,
			.393693,
			.551651,
			.393693
		],
		[.899894, .393693],
		[
			.99148,
			.393693,
			.958466,
			.746659,
			.907348,
			.779629
		],
		[.879394, .797658],
		[
			.845545,
			.819489,
			.848775,
			.954172,
			.874334,
			.971627
		],
		[
			.915883,
			1,
			1,
			1
		]
	],
	hardEdge: [
		[
			0,
			.092437,
			.042353,
			.305322
		],
		[.170124, .947558],
		[
			.177203,
			.983142,
			.2,
			1,
			.268235,
			.998599
		],
		[.614118, .998599],
		[
			.647059,
			.998599,
			.656471,
			.987395,
			.663529,
			.969188
		],
		[
			.687006,
			.908633,
			.802353,
			.822129,
			1,
			.822129
		]
	],
	relaxedInset: [[
		0,
		.367,
		.124605,
		.82,
		.507899,
		1
	], [
		.724115,
		.737,
		.790455,
		.64,
		1,
		.64
	]],
	riblet: [
		[
			0,
			.238519,
			.132047,
			.500741,
			.357567,
			.731852
		],
		[
			.513167,
			.891311,
			.563798,
			.912593,
			.735905,
			.912593
		],
		[.873887, .912593],
		[
			.956973,
			.912593,
			.878338,
			1,
			1,
			1
		]
	],
	slope: [
		[
			0,
			.125,
			.025,
			.25
		],
		[.125, .75],
		[
			.175,
			1,
			.25,
			1,
			.375,
			1
		],
		[.5, 1],
		[
			.625,
			1,
			.7,
			1,
			.75,
			.75
		],
		[.875, .125],
		[
			.9,
			.01,
			.98,
			.01,
			1,
			.01
		]
	],
	softRound: [[
		0,
		.4775,
		.0968736,
		1,
		.156301,
		1
	], [
		.264179,
		1,
		.376919,
		.33333,
		1,
		.33333
	]]
}, An = 1024;
function jn(e) {
	let t = new Float64Array(1025).fill(-Infinity), n = new Float64Array(1025), r = [0], i = [0], a = 0, o = 0;
	for (let t of e) {
		let e = t.length / 2;
		for (let n = 1; n <= 256; n++) {
			let s = n / 256, c = 1 - s;
			e === 1 ? (r.push(c * a + s * t[0]), i.push(c * o + s * t[1])) : e === 2 ? (r.push(c * c * a + 2 * c * s * t[0] + s * s * t[2]), i.push(c * c * o + 2 * c * s * t[1] + s * s * t[3])) : (r.push(c * c * c * a + 3 * c * c * s * t[0] + 3 * c * s * s * t[2] + s * s * s * t[4]), i.push(c * c * c * o + 3 * c * c * s * t[1] + 3 * c * s * s * t[3] + s * s * s * t[5]));
		}
		a = t[t.length - 2], o = t[t.length - 1];
	}
	let s = Math.max(...i);
	for (let e = 1; e < r.length; e++) {
		let a = r[e - 1], o = r[e], c = i[e - 1] / s, l = o - a, u = i[e] / s - c;
		if (l === 0) continue;
		let d = Math.max(0, Math.ceil(Math.min(a, o) * An)), f = Math.min(An, Math.floor(Math.max(a, o) * An));
		for (let e = d; e <= f; e++) {
			let r = c + (e / An - a) * u / l;
			r > t[e] && (t[e] = r, n[e] = u / l);
		}
	}
	for (let e = 0; e <= An; e++) e / An >= a && (t[e] = o / s, n[e] = 0);
	return {
		height: t,
		slope: n
	};
}
var Mn = /* @__PURE__ */ new Map();
function Nn(e) {
	let t = Object.hasOwn(kn, e) ? e : "circle", n = Mn.get(t);
	return n === void 0 && (n = jn(kn[t]), Mn.set(t, n)), n;
}
function Pn(e, t) {
	let n = Math.max(0, Math.min(1, t)) * An, r = Math.min(An - 1, Math.floor(n));
	return e[r] + (e[r + 1] - e[r]) * (n - r);
}
function Fn(e, t) {
	return Pn(Nn(e).slope, t);
}
function In(e, t, n, r, i, a, o, s) {
	let c = e.slice(), l = new Int8Array(r * i);
	for (let t = 0; t < i; t++) for (let a = 0; a < r; a++) {
		let o = t * r + a, s = (a + 1 < r ? n[o + 1] : 0) - (a > 0 ? n[o - 1] : 0), c = (t + 1 < i ? n[o + r] : 0) - (t > 0 ? n[o - r] : 0);
		l[o] = Math.floor((Math.atan2(c, s) + Math.PI) * 16 / Math.PI) % 32, e[o * 4 + 3] = 0;
	}
	let u = (t, n, a, o) => {
		if (t < 0 || t >= r || n < 0 || n >= i) return;
		let s = (n * r + t) * 4, l = a * 4, u = c[l + 3] * Math.min(1, Math.max(0, o));
		u <= e[s + 3] || (e[s] = c[l], e[s + 1] = c[l + 1], e[s + 2] = c[l + 2], e[s + 3] = u);
	}, d = s && Number.isFinite(s.x) ? s.x : 0, f = s && Number.isFinite(s.y) ? s.y : 0, p = s ? new Uint8Array(r * i) : void 0;
	for (let e = 0; e < i; e++) for (let c = 0; c < r; c++) {
		let m = e * r + c;
		if (t[m] === 0) continue;
		let h = Math.max(0, n[m] - .5), g = Math.max(0, Math.min(1, o + .5 - h)), _ = a > o ? Math.max(0, o / 2 + .5 - Math.abs(h - a)) : 0, v = c + 1 < r && t[m + 1] > 0 && l[m] !== l[m + 1] || e + 1 < i && t[m + r] > 0 && l[m] !== l[m + r], y = Math.max(g, _, a > 0 && h <= a && v ? 1 : 0);
		y > 0 && (u(c, e, m, y), s && u(Math.round(c + d), Math.round(e + f), m, y)), p && g > 0 && v && (p[m] = 1);
	}
	if (!p || d === 0 && f === 0) return;
	let m = Math.abs(d) >= Math.abs(f), h = m ? r : i, g = m ? i : r, _ = m ? d : f, v = (m ? f : d) / _, y = _ > 0 ? 1 : -1, b = new Int32Array(g + 2 * h + 1).fill(-1), x = new Float64Array(b.length);
	for (let e = y > 0 ? 0 : h - 1; e >= 0 && e < h; e += y) {
		let t = Math.round(v * e);
		for (let n = 0; n < g; n++) {
			let i = m ? e : n, a = m ? n : e, o = a * r + i, s = n - t + h;
			p[o] && (b[s] = o, x[s] = y * e + Math.abs(_)), b[s] >= 0 && y * e <= x[s] && u(i, a, b[s], 1);
		}
	}
}
var Ln = {
	threePt: {
		ambient: 0,
		lights: [
			{
				rgb: [
					1.141,
					1.141,
					1.141
				],
				direction: [
					-.6515,
					-.2693,
					-.7093
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			},
			{
				rgb: [
					.5,
					.5,
					.5
				],
				direction: [
					.8482,
					.2469,
					-.4686
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			},
			{
				rgb: [
					1,
					1,
					1
				],
				direction: [
					.5634,
					-.2812,
					.7769
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			}
		]
	},
	balanced: {
		ambient: .13,
		lights: [
			{
				rgb: [
					1.05,
					1.05,
					1.05
				],
				direction: [
					.5263,
					-.4092,
					-.7453
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			},
			{
				rgb: [
					1,
					1,
					1
				],
				direction: [
					-.9386,
					.3426,
					-.041
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			},
			{
				rgb: [
					.5,
					.5,
					.5
				],
				direction: [
					.0934,
					.763,
					.6396
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			}
		]
	},
	soft: {
		ambient: .3,
		lights: [{
			rgb: [
				.8,
				.8,
				.8
			],
			direction: [
				-.6897,
				.2484,
				-.6802
			],
			scale: .5,
			offset: .5,
			specular: !0,
			diffuse: !0
		}]
	},
	harsh: {
		ambient: .28,
		lights: [{
			rgb: [
				.88,
				.88,
				.88
			],
			direction: [
				.6689,
				-.6755,
				-.3104
			],
			scale: 1,
			offset: 0,
			specular: !0,
			diffuse: !0
		}, {
			rgb: [
				.88,
				.88,
				.88
			],
			direction: [
				-.592,
				-.7371,
				-.326
			],
			scale: 1,
			offset: 0,
			specular: !0,
			diffuse: !0
		}]
	},
	flood: {
		ambient: .13,
		lights: [
			{
				rgb: [
					1.1,
					1.1,
					1.1
				],
				direction: [
					.5685,
					-.7651,
					-.3022
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			},
			{
				rgb: [
					1.1,
					1.1,
					1.1
				],
				direction: [
					-.2366,
					-.9595,
					-.1531
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			},
			{
				rgb: [
					.55,
					.55,
					.55
				],
				direction: [
					-.8982,
					.1386,
					-.4171
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			}
		]
	},
	contrasting: {
		ambient: 1,
		lights: [{
			rgb: [
				1,
				1,
				1
			],
			direction: [
				0,
				-1,
				0
			],
			scale: 1,
			offset: 0,
			specular: !0,
			diffuse: !1
		}, {
			rgb: [
				1,
				1,
				1
			],
			direction: [
				0,
				1,
				0
			],
			scale: 1,
			offset: 0,
			specular: !0,
			diffuse: !1
		}]
	},
	morning: {
		ambient: 0,
		lights: [
			{
				rgb: [
					.669,
					.648,
					.596
				],
				direction: [
					.6574,
					-.7316,
					-.1806
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			},
			{
				rgb: [
					.459,
					.454,
					.385
				],
				direction: [
					-.2781,
					-.4509,
					-.8482
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			},
			{
				rgb: [
					.9,
					.86,
					.83
				],
				direction: [
					.672,
					-.6185,
					-.4073
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			},
			{
				rgb: [
					.911,
					.846,
					.728
				],
				direction: [
					-.1825,
					.968,
					.1722
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			}
		]
	},
	sunrise: {
		ambient: 0,
		lights: [
			{
				rgb: [
					.667,
					.63,
					.527
				],
				direction: [
					.6574,
					-.7316,
					-.1806
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			},
			{
				rgb: [
					.459,
					.459,
					.371
				],
				direction: [
					-.2781,
					-.4509,
					-.8482
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			},
			{
				rgb: [
					.826,
					.712,
					.638
				],
				direction: [
					.672,
					-.6185,
					-.4073
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			},
			{
				rgb: [
					1.511,
					1.319,
					.994
				],
				direction: [
					-.1825,
					.968,
					.1722
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			}
		]
	},
	sunset: {
		ambient: 0,
		lights: [
			{
				rgb: [
					.672,
					.169,
					.169
				],
				direction: [
					.6574,
					-.7316,
					-.1806
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			},
			{
				rgb: [
					.459,
					.448,
					.327
				],
				direction: [
					.0922,
					-.3551,
					-.9303
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			},
			{
				rgb: [
					.775,
					.612,
					.502
				],
				direction: [
					.672,
					-.6185,
					-.4073
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			},
			{
				rgb: [
					.761,
					.69,
					.397
				],
				direction: [
					-.424,
					.8891,
					.1722
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			}
		]
	},
	chilly: {
		ambient: .11,
		lights: [
			{
				rgb: [
					.31,
					.32,
					.32
				],
				direction: [
					.6574,
					-.7316,
					-.1806
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			},
			{
				rgb: [
					.45,
					.45,
					.45
				],
				direction: [
					-.3539,
					-.1505,
					-.9231
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			},
			{
				rgb: [
					1.03,
					1.02,
					1.15
				],
				direction: [
					.672,
					-.6185,
					-.4073
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			},
			{
				rgb: [
					.41,
					.45,
					.48
				],
				direction: [
					-.5781,
					.7976,
					.1722
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			}
		]
	},
	freezing: {
		ambient: 0,
		lights: [
			{
				rgb: [
					.53,
					.567,
					.661
				],
				direction: [
					.6574,
					-.7316,
					-.1806
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			},
			{
				rgb: [
					.37,
					.461,
					.461
				],
				direction: [
					-.2781,
					-.4509,
					-.8482
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			},
			{
				rgb: [
					.649,
					.638,
					.904
				],
				direction: [
					.672,
					-.6185,
					-.4073
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			},
			{
				rgb: [
					.971,
					1.19,
					1.363
				],
				direction: [
					-.1825,
					.968,
					.1722
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !0
			}
		]
	},
	flat: {
		ambient: 1,
		lights: [
			{
				rgb: [
					.821,
					.821,
					.821
				],
				direction: [
					-.9546,
					-.1619,
					-.2502
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !1
			},
			{
				rgb: [
					2.072,
					2.54,
					2.91
				],
				direction: [
					9e-4,
					.8605,
					.5095
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !1
			},
			{
				rgb: [
					3.843,
					3.843,
					3.843
				],
				direction: [
					.6574,
					-.7316,
					-.1806
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !1
			}
		]
	},
	twoPt: {
		ambient: .25,
		lights: [{
			rgb: [
				.84,
				.84,
				.84
			],
			direction: [
				.5266,
				-.4089,
				-.7454
			],
			scale: 1,
			offset: 0,
			specular: !0,
			diffuse: !0
		}, {
			rgb: [
				.3,
				.3,
				.3
			],
			direction: [
				-.8983,
				.2365,
				-.3704
			],
			scale: 1,
			offset: 0,
			specular: !0,
			diffuse: !0
		}]
	},
	glow: {
		ambient: 1,
		lights: [{
			rgb: [
				1,
				1,
				1
			],
			direction: [
				0,
				-1,
				0
			],
			scale: 1,
			offset: 0,
			specular: !0,
			diffuse: !0
		}, {
			rgb: [
				.7,
				.7,
				.7
			],
			direction: [
				0,
				1,
				0
			],
			scale: 1,
			offset: 0,
			specular: !0,
			diffuse: !0
		}]
	},
	brightRoom: {
		ambient: 1.5,
		lights: [
			{
				rgb: [
					1,
					1,
					1
				],
				direction: [
					0,
					-1,
					0
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			},
			{
				rgb: [
					1,
					1,
					1
				],
				direction: [
					.8227,
					-.1882,
					-.5364
				],
				scale: 1,
				offset: 0,
				specular: !0,
				diffuse: !1
			},
			{
				rgb: [
					-.5,
					-.5,
					-.5
				],
				direction: [
					0,
					0,
					-1
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			},
			{
				rgb: [
					.5,
					.5,
					.5
				],
				direction: [
					0,
					1,
					0
				],
				scale: 1,
				offset: 0,
				specular: !1,
				diffuse: !0
			}
		]
	}
}, Rn = a();
for (let [e, t, n, r, i, a] of [
	[
		"Flat",
		.58,
		.58,
		.305,
		.5,
		.5
	],
	[
		"Normal",
		.671,
		.366,
		.153,
		.5,
		.5
	],
	[
		"Harsh",
		.793,
		.214,
		.061,
		1,
		0
	]
]) for (let o = 1; o <= 4; o++) {
	let s = o === 1 ? [
		0,
		0,
		-.2
	] : [
		o - 3,
		-1,
		-.2
	], c = o === 1 ? [
		0,
		0,
		-.2
	] : [
		0,
		1,
		-.2
	];
	Rn[`legacy${e}${o}`] = {
		ambient: r,
		lights: [{
			rgb: [
				t,
				t,
				t
			],
			direction: s,
			scale: 1,
			offset: 0,
			specular: !0,
			diffuse: !0
		}, {
			rgb: [
				n,
				n,
				n
			],
			direction: c,
			scale: i,
			offset: a,
			specular: !1,
			diffuse: !0
		}]
	};
}
function zn(e) {
	return Object.hasOwn(Ln, e) ? Ln[e] : Object.hasOwn(Rn, e) ? Rn[e] : Ln.threePt;
}
function Bn(e, t, n, r, i, a = !1, o = 0, s = 0, c = 1, l = c, u = 0) {
	return {
		specularShape: e,
		specularWhite: t,
		diffuseShape: n,
		diffuseWhite: r,
		power: i,
		blinn: a,
		diffuseFresnel: o,
		alphaFresnel: s,
		diffuseAlpha: c,
		ambientAlpha: l,
		emissive: u
	};
}
var Vn = {
	legacyMatte: Bn(0, 0, 1, 0, 0, !0),
	legacyPlastic: Bn(0, 1, 1, 0, 32, !0),
	legacyMetal: Bn(1, 0, 2 / 3, 0, 32, !0),
	legacyWireframe: Bn(0, 0, 0, 0, 0),
	matte: Bn(0, 0, 1, 0, 0),
	plastic: Bn(0, .6, 1, 0, 12),
	metal: Bn(-.32, 1.32, 1, 0, 12, !1, 4),
	warmMatte: Bn(0, .3, 1, 0, 8),
	translucentPowder: Bn(0, .3, 1, 0, 10, !0, 2, -1, .7),
	powder: Bn(0, .3, .5, .5, 10, !0, 2),
	dkEdge: Bn(0, 1, 1, 0, 35, !1, -2),
	softEdge: Bn(0, 1, 1, 0, 35, !1, 4, -10),
	clear: Bn(0, .6, 1, 0, 20, !1, -8, 1, .1, 1),
	flat: Bn(0, .8, 0, 0, 50, !1, -4, 0, 1, 1, 1),
	softmetal: Bn(.5, .5, 1, 0, 8)
};
function Hn(e) {
	return e && Object.hasOwn(Vn, e) ? e : "matte";
}
var Un = {
	t: 0,
	tr: 45,
	r: 90,
	br: 135,
	b: 180,
	bl: 225,
	l: 270,
	tl: 315
};
function Wn(e, t, n) {
	let r = zn(e), i = Math.PI / 180, a = (n?.lat ?? 0) * i, o = (n?.lon ?? 0) * i, s = (n ? n.rev : Object.hasOwn(Un, t) ? Un[t] : 0) * i, c = Math.cos(a), l = Math.sin(a), u = Math.cos(o), d = Math.sin(o), f = Math.cos(s), p = Math.sin(s), m = r.lights.map((e) => {
		let [t, n, r] = e.direction, i = Math.hypot(t, n, r) || 1, a = n / i, o = t / i, s = -r / i, m = f * a - p * o, h = p * a + f * o, g = c * h - l * s, _ = l * h + c * s, v = u * m + d * _, y = -d * m + u * _, b = Math.hypot(v, g, y + 1) || 1;
		return {
			x: v,
			y: g,
			z: y,
			hx: v / b,
			hy: g / b,
			hz: (y + 1) / b,
			rgb: e.rgb,
			scale: e.scale,
			offset: e.offset,
			specular: e.specular,
			diffuse: e.diffuse
		};
	});
	return {
		x: m[0].x,
		y: m[0].y,
		z: m[0].z,
		rigLights: m,
		rigAmbient: r.ambient
	};
}
function Gn(e, t) {
	let n = t, r = Math.hypot(t.x, t.y, t.z + 1) || 1, i = {
		material: Vn[e],
		ambient: n.rigAmbient ?? 0,
		lights: n.rigLights ?? [{
			...t,
			hx: t.x / r,
			hy: t.y / r,
			hz: (t.z + 1) / r,
			rgb: [
				1,
				1,
				1
			],
			scale: 1,
			offset: 0,
			specular: !0,
			diffuse: !0
		}],
		terms: new Float64Array(6),
		flatTerms: new Float64Array(6)
	};
	return Kn(i.flatTerms, 0, 0, 1, i), i;
}
function Kn(e, t, n, r, i) {
	let a = i.material, o = 0, s = 0, c = 0, l = 0, u = 0, d = 0;
	for (let e of i.lights) {
		let i = t * e.x + n * e.y + r * e.z;
		if (e.diffuse) {
			let t = Math.max(0, i * e.scale + e.offset);
			o += e.rgb[0] * t, s += e.rgb[1] * t, c += e.rgb[2] * t;
		}
		if (e.specular && i > 0 && (a.specularShape !== 0 || a.specularWhite !== 0)) {
			let o = a.blinn ? t * e.hx + n * e.hy + r * e.hz : 2 * i * r - e.z, s = Math.max(0, o) ** +a.power;
			l += e.rgb[0] * s, u += e.rgb[1] * s, d += e.rgb[2] * s;
		}
	}
	e[0] = o, e[1] = s, e[2] = c, e[3] = l, e[4] = u, e[5] = d;
}
function qn(e, t, n, r, i, a, o, s, c) {
	let l = c.material, u = 1 - Math.min(1, Math.abs(s)), d = l.diffuseFresnel === 0 ? 0 : u ** +Math.abs(l.diffuseFresnel), f = l.alphaFresnel === 0 ? 0 : u ** +Math.abs(l.alphaFresnel), p = l.diffuseAlpha;
	l.alphaFresnel > 0 ? p += (1 - p) * f : l.alphaFresnel < 0 && (p *= 1 - f);
	let m = a === 0 && o === 0 && s === 1 ? c.flatTerms : c.terms;
	m === c.terms && Kn(m, a, o, s, c);
	for (let i = 0; i < 3; i++) {
		let a = (i === 0 ? t : i === 1 ? n : r) / 255, o = a * l.diffuseShape + l.diffuseWhite;
		o = l.diffuseFresnel > 0 ? o + (1 - o) * d : o * (1 - d);
		let s = a * l.specularShape + l.specularWhite, u = a * l.emissive + (a * l.diffuseShape + l.diffuseWhite) * c.ambient + o * m[i] + s * m[i + 3];
		e[i] = Math.max(0, Math.min(255, u * 255));
	}
	e[3] = i * Math.max(0, Math.min(1, p));
}
function Jn(e) {
	let t = e.length, n = new Float64Array(t);
	if (t === 0) return n;
	let r = new Int32Array(t), i = new Float64Array(t + 1), a = 0;
	r[0] = 0, i[0] = -Infinity, i[1] = Infinity;
	for (let n = 1; n < t; n++) {
		let t = (e[n] + n * n - (e[r[a]] + r[a] * r[a])) / (2 * n - 2 * r[a]);
		for (; t <= i[a];) a--, t = (e[n] + n * n - (e[r[a]] + r[a] * r[a])) / (2 * n - 2 * r[a]);
		a++, r[a] = n, i[a] = t, i[a + 1] = Infinity;
	}
	a = 0;
	for (let o = 0; o < t; o++) {
		for (; i[a + 1] < o;) a++;
		let t = o - r[a];
		n[o] = t * t + e[r[a]];
	}
	return n;
}
function Yn(e, t = 3) {
	if (e <= 0) return Array(t).fill(1);
	let n = Math.sqrt(12 * e * e / t + 1), r = Math.floor(n);
	r % 2 == 0 && r--;
	let i = r + 2, a = (12 * e * e - t * r * r - 4 * t * r - 3 * t) / (-4 * r - 4), o = Math.round(a), s = [];
	for (let e = 0; e < t; e++) s.push(e < o ? r : i);
	return s;
}
function Xn(e, t, n, r, i, a) {
	let o = 1 / (2 * i + 1);
	if (a) for (let a = 0; a < r; a++) {
		let r = a * n, s = 0;
		for (let t = 0; t <= i; t++) t < n && (s += e[r + t]);
		for (let a = 0; a < n; a++) {
			t[r + a] = s * o;
			let c = a + i + 1, l = a - i;
			c < n && (s += e[r + c]), l >= 0 && (s -= e[r + l]);
		}
	}
	else for (let a = 0; a < n; a++) {
		let s = 0;
		for (let t = 0; t <= i; t++) t < r && (s += e[t * n + a]);
		for (let c = 0; c < r; c++) {
			t[c * n + a] = s * o;
			let l = c + i + 1, u = c - i;
			l < r && (s += e[l * n + a]), u >= 0 && (s -= e[u * n + a]);
		}
	}
}
function Zn(e, t, n, r) {
	let i = Float64Array.from(e);
	if (r <= 0 || t <= 0 || n <= 0) return i;
	let a = new Float64Array(t * n);
	for (let e of Yn(r, 3)) {
		let r = Math.max(1, (e - 1) / 2);
		Xn(i, a, t, n, r, !0), Xn(a, i, t, n, r, !1);
	}
	return i;
}
function Qn(e, t, n, r = 128) {
	let i = new Float64Array(t * n);
	for (let a = 0; a < t * n; a++) i[a] = (e[a] ?? 0) >= r ? 0x56bc75e2d63100000 : 0;
	let a = new Float64Array(n);
	for (let e = 0; e < t; e++) {
		for (let r = 0; r < n; r++) a[r] = i[r * t + e];
		let r = Jn(a);
		for (let a = 0; a < n; a++) i[a * t + e] = r[a];
	}
	let o = new Float64Array(t);
	for (let e = 0; e < n; e++) {
		for (let n = 0; n < t; n++) o[n] = i[e * t + n];
		let n = Jn(o);
		for (let r = 0; r < t; r++) i[e * t + r] = n[r];
	}
	for (let e = 0; e < n; e++) for (let r = 0; r < t; r++) {
		let a = e * t + r;
		if (i[a] === 0) continue;
		let o = (e + 1) * (e + 1), s = (n - e) * (n - e), c = (r + 1) * (r + 1), l = (t - r) * (t - r), u = Math.min(o, s, c, l);
		u < i[a] && (i[a] = u);
	}
	for (let e = 0; e < t * n; e++) i[e] = Math.sqrt(i[e]);
	return i;
}
function $n(e, t, n, r, i, a) {
	let o = new Float32Array(t * n * 3), s = new Uint8Array(t * n), c = new Float32Array(t * n);
	if (t <= 0 || n <= 0) return {
		normals: o,
		bandMask: s,
		bandWeight: c
	};
	let l = Qn(e, t, n, 1), u = r > 0 ? Zn(l, t, n, Math.max(1, r * .25)) : l;
	for (let d = 0; d < n; d++) for (let f = 0; f < t; f++) {
		let p = d * t + f;
		if (o[p * 3 + 2] = 1, (e[p] ?? 0) === 0 || r <= 0 || a <= 0) continue;
		let m = Math.max(0, l[p] - .5);
		if (m >= r) continue;
		s[p] = 1, c[p] = 1;
		let h = Math.max(0, f - 1), g = Math.min(t - 1, f + 1), _ = Math.max(0, d - 1), v = Math.min(n - 1, d + 1), y = (u[d * t + g] - u[d * t + h]) / (g - h || 1), b = (u[v * t + f] - u[_ * t + f]) / (v - _ || 1), x = Math.hypot(y, b), S = Fn(i, m / r) * a / r, C = x > 1e-9 ? -S * y / x : 0, w = x > 1e-9 ? -S * b / x : 0, T = Math.hypot(C, w, 1);
		o[p * 3] = C / T, o[p * 3 + 1] = w / T, o[p * 3 + 2] = 1 / T;
	}
	return {
		normals: o,
		bandMask: s,
		bandWeight: c
	};
}
function er(e, t, n) {
	return Wn(e, t, n);
}
function tr(e) {
	return Hn(e);
}
function nr(e, t, n) {
	if (!e) return {
		x: 0,
		y: 0,
		w: t,
		h: n
	};
	let r = Math.max(0, Math.floor(e.x)), i = Math.max(0, Math.floor(e.y)), a = Math.min(t, Math.ceil(e.x + e.w)), o = Math.min(n, Math.ceil(e.y + e.h));
	return {
		x: r,
		y: i,
		w: Math.max(0, a - r),
		h: Math.max(0, o - i)
	};
}
function rr(e, t, n) {
	if (e.canvas.width <= 0 || e.canvas.height <= 0) return;
	let r = t.camera ? Dn(t.camera) : void 0, i = r?.backFacing ?? !1;
	if (!!t.bottom !== i) return;
	let { x: a, y: o, w: s, h: c } = nr(n, e.canvas.width, e.canvas.height);
	if (s <= 0 || c <= 0) return;
	let l = e.getImageData(a, o, s, c), u = l.data, d = new Uint8ClampedArray(s * c);
	for (let e = 0; e < s * c; e++) d[e] = u[e * 4 + 3] > 0 ? 255 : 0;
	if (t.material === "legacyWireframe") {
		In(u, d, Qn(d, s, c), s, c, t.widthPx, t.wireframeLinePx ?? 1, t.wireframeDepth), e.putImageData(l, a, o);
		return;
	}
	let { normals: f } = $n(d, s, c, t.widthPx, t.prst, t.heightPx), p = Gn(t.material, t.light), m = new Float64Array(4);
	for (let e = 0; e < s * c; e++) {
		let n = e * 4;
		if (u[n + 3] === 0) continue;
		let i = f[e * 3], a = f[e * 3 + 1], o = f[e * 3 + 2];
		if (t.bottom && r) {
			let e = r.rotation, t = e[0] * i + e[1] * a - e[2] * o, n = e[3] * i + e[4] * a - e[5] * o;
			o = e[6] * i + e[7] * a - e[8] * o, i = t, a = n;
		}
		qn(m, u[n], u[n + 1], u[n + 2], u[n + 3], i, a, o, p), u[n] = m[0], u[n + 1] = m[1], u[n + 2] = m[2], u[n + 3] = m[3];
	}
	e.putImageData(l, a, o);
}
function ir(e, t, n) {
	let r = e.canvas.width, i = e.canvas.height;
	if (r <= 0 || i <= 0) return;
	let a = t.offsetX, o = t.offsetY, s = Math.hypot(a, o);
	if (s < .75) return;
	let { x: c, y: l, w: u, h: d } = nr(n, r, i);
	if (u <= 0 || d <= 0) return;
	let f = e.getImageData(c, l, u, d), p = f.data, m = new Uint8ClampedArray(u * d);
	for (let e = 0; e < u * d; e++) m[e] = p[e * 4 + 3];
	let h = Math.max(1, Math.ceil(s)), [g, _, v] = t.rgb;
	for (let e = 0; e < d; e++) for (let t = 0; t < u; t++) {
		let n = e * u + t;
		if (m[n] > 0) continue;
		let r = !1;
		for (let n = 1; n <= h; n++) {
			let i = n / h, s = Math.round(t - a * i), c = Math.round(e - o * i);
			if (!(s < 0 || c < 0 || s >= u || c >= d) && m[c * u + s] > 0) {
				r = !0;
				break;
			}
		}
		if (!r) continue;
		let i = n * 4;
		p[i] = g, p[i + 1] = _, p[i + 2] = v, p[i + 3] = 255;
	}
	e.putImageData(f, c, l);
}
function ar(e, t) {
	return {
		top: e - t * .85,
		height: t * 1.1
	};
}
function or(e, t, n, r, i = 0) {
	let a = [], o = 0, s = 0;
	for (let c of t) a.push({
		text: e.slice(o, c).join(""),
		dx: r(e.slice(0, o).join("")) + o * i + s * n
	}), o = c, s++;
	return a.push({
		text: e.slice(o).join(""),
		dx: r(e.slice(0, o).join("")) + o * i + s * n
	}), a;
}
var sr = {
	palatino: "Palatino Linotype",
	helvetica: "Arial",
	"helvetica neue": "Arial"
}, cr = /* @__PURE__ */ new Map();
function lr(e, t, n) {
	let r = `${e.trim().toLocaleLowerCase("en-US")}|${t ? 700 : 400}|${n ? "i" : "n"}`, i = cr.get(r);
	if (i !== void 0) return cr.delete(r), cr.set(r, i), i ?? void 0;
	let a = fr(e, t, n);
	if (cr.set(r, a ?? null), cr.size > 256) {
		let e = cr.keys().next().value;
		e !== void 0 && cr.delete(e);
	}
	return a;
}
function ur(e, t, n) {
	let r = t ? 700 : 400, i = l(sr, e.trim().toLocaleLowerCase("en-US")) ?? e.trim();
	if (!i) return r;
	let a = n ? "italic" : "normal";
	if (_(i, {
		weight: r,
		style: a
	}).length > 0) return r;
	let o = _(i, { style: a });
	return o.length > 0 && o.every((e) => e.weight === o[0].weight) ? o[0].weight : r;
}
function dr(e, t, n) {
	let r = e.trim();
	if (!r) return [];
	let i = l(sr, r.toLocaleLowerCase("en-US")) ?? r, a = n ? "italic" : "normal", o = _(i, {
		weight: t ? 700 : 400,
		style: a
	});
	if (o.length === 0) {
		let e = _(i, { style: a });
		e.length > 0 && e.every((t) => t.weight === e[0].weight) && (o = e);
	}
	let s = o.filter((e) => e.source === "macos-supplemental");
	return s.length > 0 ? s : o.filter((e) => e.source === "office-mac");
}
function fr(e, t, n) {
	let r = dr(e, t, n);
	if (r.length === 0) return;
	let i;
	for (let e of r) {
		let t;
		if (e.typoMetrics) {
			let [n, r, i] = e.typoMetrics, a = n + Math.max(0, i);
			t = a / (a - r);
		} else if (e.win) {
			let [n, r] = e.win;
			t = n / (n + r);
		}
		if (t === void 0 || !Number.isFinite(t) || t <= 0 || t >= 1 || i !== void 0 && Math.abs(i - t) > 1e-12) return;
		i = t;
	}
	return i;
}
function pr(e, t, n) {
	let r = dr(e, t, n);
	if (r.length === 0) return;
	let i;
	for (let e of r) {
		let t;
		if (e.typoMetrics) {
			let [n, r, i] = e.typoMetrics;
			t = {
				ascent: (n + Math.max(0, i)) / e.unitsPerEm,
				descent: -r / e.unitsPerEm
			};
		} else if (e.win) {
			let [n, r] = e.win;
			t = {
				ascent: n / e.unitsPerEm,
				descent: r / e.unitsPerEm
			};
		}
		if (t === void 0 || !(e.unitsPerEm > 0)) return;
		let n = t.ascent / (t.ascent + t.descent);
		if (!Number.isFinite(n) || n <= 0 || n >= 1 || i && (Math.abs(i.ascent - t.ascent) > 1e-12 || Math.abs(i.descent - t.descent) > 1e-12)) return;
		i = t;
	}
	return i;
}
function mr(e, t, n) {
	let r;
	for (let i of dr(e, t, n)) {
		if (i.farEastCodePage == null || !i.win) return;
		let e = et({
			faceSource: i.source === "macos-supplemental" ? "system" : "office-bundle",
			unitsPerEm: i.unitsPerEm,
			hhea: i.hhea,
			win: i.win,
			typoMetrics: i.typoMetrics,
			farEastCodePage: i.farEastCodePage
		});
		if (!e || r && (r.ascent !== e.ascentRatio || r.descent !== e.descentRatio)) return;
		r = {
			ascent: e.ascentRatio,
			descent: e.descentRatio
		};
	}
	return r;
}
function hr(e, t, n) {
	let r;
	for (let i of dr(e, t, n)) {
		let e = i.decoration;
		if (!e || !(i.unitsPerEm > 0)) return;
		let [t, n, a, o] = e;
		if (!(n > 0) || !(o > 0) || !(a > 0)) return;
		let s = i.unitsPerEm, c = {
			underlineTopEm: -t / s,
			underlineThicknessEm: n / s,
			strikeTopEm: -a / s,
			strikeThicknessEm: o / s
		};
		if (r && Object.keys(c).some((e) => Math.abs(r[e] - c[e]) > 1e-12)) return;
		r = Object.freeze(c);
	}
	return r;
}
var gr = /* @__PURE__ */ new Map();
function _r(e, t, n) {
	let r = `${e.trim().toLocaleLowerCase("en-US")}|${t ? 700 : 400}|${n ? "i" : "n"}`, i = gr.get(r);
	if (i !== void 0) return gr.delete(r), gr.set(r, i), i ?? void 0;
	let a = lr(e, t, n), o = a === void 0 ? null : Object.freeze({
		share: a,
		glyph: pr(e, t, n),
		excel: mr(e, t, n),
		decoration: hr(e, t, n)
	});
	if (gr.set(r, o), gr.size > 256) {
		let e = gr.keys().next().value;
		e !== void 0 && gr.delete(e);
	}
	return o ?? void 0;
}
function vr(e) {
	let t = 0, n = 0, r = 0;
	for (let i of e) t = Math.max(t, i.sizePx), n = Math.max(n, 1.2 * i.sizePx * i.share), r = Math.max(r, 1.2 * i.sizePx * (1 - i.share));
	let i = 1.2 * t;
	if (!(n + r > 0)) return {
		ascent: i * _t,
		descent: i * vt
	};
	let a = i * n / (n + r);
	return {
		ascent: a,
		descent: i - a
	};
}
function yr(e) {
	return Math.floor(e + .5);
}
function br(e) {
	let t = 0, n = 0;
	for (let r of e) t = Math.max(t, r.box.ascent * r.sizePx), n = Math.max(n, r.box.descent * r.sizePx);
	return {
		ascent: t,
		descent: n
	};
}
var xr = .72;
function Sr(e, t) {
	return t ? e.face.excel : e.face.glyph;
}
function Cr(e, t, n, r) {
	if (t.length === 0) return;
	let i = [];
	for (let e of t) {
		let t = Sr(e, n);
		if (!t) return;
		i.push({
			ascent: t.ascent * e.sizePx,
			descent: t.descent * e.sizePx
		});
	}
	if (!n) {
		let n = 0;
		for (let e of t) n = Math.max(n, e.sizePx);
		let i = 1.2 * n;
		if (e === "t") return {
			ascent: 0,
			descent: i
		};
		if (e === "ctr") return {
			ascent: i / 2,
			descent: i / 2
		};
		let a = vr(t.map((e) => ({
			sizePx: e.sizePx,
			share: e.face.share
		}))), o = (i - Math.round(a.ascent / r) * r) / 2;
		return {
			ascent: i - o,
			descent: o
		};
	}
	if (e === "b") {
		let e = 0, t = 0;
		for (let n of i) e = Math.max(e, n.ascent + n.descent / 2), t = Math.max(t, n.descent / 2);
		return {
			ascent: e,
			descent: t
		};
	}
	let a = 0;
	for (let e of i) a = Math.max(a, e.ascent + e.descent);
	return e === "t" ? {
		ascent: 0,
		descent: a
	} : {
		ascent: a / 2,
		descent: a / 2
	};
}
function wr(e, t, n, r) {
	let i = Sr(t, n);
	if (!i) return;
	let a = i.ascent * t.sizePx, o = i.descent * t.sizePx;
	if (e === "b") return -Math.round(o / 2 / r) * r;
	let s = e === "t" ? a : (a - o) / 2;
	return Math.round(s / r) * r;
}
var Tr = {
	...V,
	...N
};
function* Er(e) {
	let t = [e[Symbol.iterator]()];
	for (; t.length;) {
		let e = t[t.length - 1].next();
		if (e.done) {
			t.pop();
			continue;
		}
		let n = e.value;
		yield n, (n.type === "shape" || n.type === "table") && n.mathFallback && t.push(n.mathFallback.elements[Symbol.iterator]());
	}
}
function* Dr(e) {
	for (let t of e?.paragraphs ?? []) {
		for (let e of t.mathFallbacks ?? []) yield e.text;
		for (let e of t.runs) e.type === "text" && (yield e.text), e.type === "math" && e.fallbackText && (yield e.fallbackText);
	}
}
function* Or(e) {
	for (let t of e?.paragraphs ?? []) {
		t.defFontFamily && (yield t.defFontFamily);
		for (let e of t.runs) e.type === "text" && (e.fontFamily && (yield e.fontFamily), e.fontFamilyEa && (yield e.fontFamilyEa), e.fontFamilyCs && (yield e.fontFamilyCs), e.fontFamilySym && (yield e.fontFamilySym));
	}
}
function* kr(e) {
	for (let t of Er(e.elements)) if (t.type === "shape") yield* Dr(t.textBody);
	else if (t.type === "table") for (let e of t.rows) for (let t of e.cells) yield* Dr(t.textBody);
	else if (t.type === "chart") {
		t.chart.title && (yield t.chart.title);
		for (let e of t.chart.categories) yield e;
		for (let e of t.chart.series) e.name && (yield e.name);
	}
}
var Ar = class e {
	majorFont;
	minorFont;
	fallback;
	scriptNames;
	scripts;
	families;
	constructor(e, t, n, r, i, a = /* @__PURE__ */ new Set()) {
		this.majorFont = e, this.minorFont = t, this.fallback = i, this.scriptNames = a;
		let o = F(e) ?? F(t) ?? i ?? null;
		this.scripts = n ?? new ie(o), this.families = r ?? /* @__PURE__ */ new Set(), e && this.families.add(e), t && this.families.add(t);
	}
	addSlide(e) {
		e.theme?.majorFont && this.families.add(e.theme.majorFont), e.theme?.minorFont && this.families.add(e.theme.minorFont), this.scripts.addText(kr(e));
		for (let t of me(kr(e), F(e.theme ? e.theme.majorFont : this.majorFont) ?? F(e.theme ? e.theme.minorFont : this.minorFont) ?? this.fallback ?? null)) this.scriptNames.add(t);
		for (let t of Er(e.elements)) if (t.type === "shape") for (let e of Or(t.textBody)) this.families.add(e);
		else if (t.type === "table") for (let e of t.rows) for (let t of e.cells) for (let e of Or(t.textBody)) this.families.add(e);
	}
	names() {
		return [...new Set([
			...this.families,
			...this.scripts.names(),
			...this.scriptNames
		])];
	}
	withSlide(t) {
		let n = new e(this.majorFont, this.minorFont, this.scripts.clone(), new Set(this.families), this.fallback, new Set(this.scriptNames));
		return n.addSlide(t), n;
	}
}, jr = new Set([
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
	"system-ui"
]);
function Mr(e, t, n) {
	e.theme && (t = e.theme.majorFont, n = e.theme.minorFont);
	let r = /* @__PURE__ */ new Map(), i = (e) => e ? e.startsWith("+mn-") ? n : e.startsWith("+mj-") ? t : e.split(",")[0]?.trim() ?? null : null, a = (e, t, n) => {
		let a = i(e);
		if (!a || jr.has(a.toLowerCase())) return;
		let o = ur(a, t, n), s = n ? "italic" : "normal";
		r.set(`${a.toLowerCase()}:${o}:${s}`, {
			family: a,
			weight: o,
			style: s
		}), r.set(`presence:${a.toLowerCase()}`, {
			family: a,
			presenceOnly: !0
		});
	}, o = (e) => {
		for (let t of e?.paragraphs ?? []) {
			for (let n of t.runs) {
				if (n.type === "break") {
					a(n.fontFamily ?? t.defFontFamily, n.bold ?? t.defBold ?? e?.defaultBold ?? !1, n.italic ?? t.defItalic ?? e?.defaultItalic ?? !1);
					continue;
				}
				if (n.type !== "text") continue;
				let r = n.bold ?? t.defBold ?? e?.defaultBold ?? !1, i = n.italic ?? t.defItalic ?? e?.defaultItalic ?? !1;
				a(n.fontFamily ?? t.defFontFamily, r, i), n.fontFamilyEa && a(n.fontFamilyEa, r, i), n.fontFamilyCs && a(n.fontFamilyCs, r, i), n.fontFamilySym && a(n.fontFamilySym, r, i);
			}
			let n = t.endRunProperties;
			if (n && a(n.fontFamily ?? t.defFontFamily, n.bold ?? t.defBold ?? e?.defaultBold ?? !1, n.italic ?? t.defItalic ?? e?.defaultItalic ?? !1), t.bullet.type === "char" || t.bullet.type === "autoNum") {
				let e = t.runs.find((e) => e.type === "text" && !!e.fontFamily), n = e?.type === "text" ? e.fontFamily : null;
				a(t.bullet.fontFamily ?? (t.bullet.type === "autoNum" ? n ?? t.defFontFamily : void 0), !1, !1);
			}
		}
	};
	for (let t of Er(e.elements)) if (t.type === "shape" && o(t.textBody), t.type === "table") for (let e of t.rows) for (let t of e.cells) o(t.textBody);
	return [...r.values()];
}
function Nr(e, t, n, r) {
	return R(kr(e), F(t) ?? F(n) ?? r);
}
function Pr(e) {
	return e;
}
var Fr = .5;
function Ir(e, t) {
	if (!(t > 0) || !(e.h > 0)) return [{
		y: e.y,
		h: Math.max(0, e.h),
		radius: 0
	}];
	let n = Math.max(4, Math.min(24, Math.ceil(t / Fr) + 1)), r = e.y + e.h, i = [];
	for (let a = 0; a < n; a++) {
		let o = Math.sqrt(a / (n - 1)), s = a === 0 ? 0 : Math.sqrt((a - 1) / (n - 1)), c = a === n - 1 ? 1 : Math.sqrt((a + 1) / (n - 1)), l = a === 0 ? 0 : (s + o) / 2, u = a === n - 1 ? 1 : (o + c) / 2, d = r - u * e.h;
		i.push({
			y: d,
			h: (u - l) * e.h,
			radius: t * a / (n - 1)
		});
	}
	return i;
}
function Lr(e, t, n, r, i) {
	for (let a of Ir(n, r)) e.save(), e.beginPath(), e.rect(0, a.y, i, a.h), e.clip(), e.filter = a.radius > 0 ? `blur(${a.radius}px)` : "none", e.drawImage(t, 0, 0), e.restore();
}
function Rr(e, t) {
	let n = e !== void 0 && e !== "" ? e : void 0, r = t !== void 0 && t !== "" ? t : void 0;
	if (n === void 0 && r === void 0) return;
	if (r !== void 0) return {
		kind: "internal",
		ref: n ?? r
	};
	let i = n, a = We(i);
	return a !== null && Ve.includes(a) ? {
		kind: "external",
		url: i
	} : {
		kind: "internal",
		ref: i
	};
}
function zr(e, t, n, r, i, a) {
	let o = Math.max(18, Math.min(32, Math.min(r, i) * .25));
	if (e.save(), e.shadowColor = "rgba(0, 0, 0, 0.3)", e.shadowBlur = o * .35, e.fillStyle = "rgba(20, 20, 20, 0.7)", e.beginPath(), e.arc(t, n, o, 0, Math.PI * 2), e.fill(), e.shadowColor = "transparent", e.shadowBlur = 0, e.fillStyle = "#fff", a === "paused") {
		e.beginPath();
		let r = o * .48;
		e.moveTo(t - r * .4, n - r), e.lineTo(t - r * .4, n + r), e.lineTo(t + r * .75, n), e.closePath(), e.fill();
	} else {
		let r = o * .2, i = o * .8, a = o * .15;
		e.fillRect(t - a - r, n - i / 2, r, i), e.fillRect(t + a, n - i / 2, r, i);
	}
	e.restore();
}
var Br = { isTab: (e) => "isTab" in e }, Vr = (e) => at(e), Hr = (e, t) => Le(e, t, Br), Ur = (e) => /\s/.test(String.fromCodePoint(e));
function Wr(e, t, n, r, i) {
	if (r === "just" && i) return null;
	let a = t - n;
	if (a <= .5) return null;
	let o = Tt(e, a, {
		firstContentSi: 0,
		lastDrawnSi: e.length,
		isGapChar: st,
		isWhitespace: Ur,
		seaClusterGaps: r === "thaiDist"
	});
	if (!o) return null;
	let { perGap: s, perSeg: c } = o, l = [];
	for (let t = 0; t < e.length; t++) {
		let n = e[t], r = c.get(t), i = r?.trailingGap ? s : 0, a = r?.splitBefore;
		a && a.length > 0 ? l.push({
			...n,
			jext: i,
			splitBefore: [...a],
			perGap: s
		}) : l.push({
			...n,
			jext: i
		});
	}
	return l;
}
function Gr(e) {
	let t = e ? Wt(e.replace(/^#/, "").slice(0, 6)) : null;
	return t ? {
		r: t[0],
		g: t[1],
		b: t[2]
	} : {
		r: 0,
		g: 0,
		b: 0
	};
}
function Kr(e) {
	let t = Gr(e);
	return .299 * t.r + .587 * t.g + .114 * t.b;
}
function qr(e, t) {
	if (!e && !t) return null;
	if (!e) return t;
	if (!t) return e;
	if (e.width !== t.width) return e.width > t.width ? e : t;
	let n = Kr(e.color), r = Kr(t.color);
	return n === r || n < r ? e : t;
}
function Jr(e) {
	let t = Wt(e.length === 8 ? e.slice(0, 6) : e);
	if (!t) return null;
	let n = Gt(t[0], t[1], t[2]);
	if (e.length !== 8) return n;
	let r = Number.parseInt(e.slice(6, 8), 16);
	if (Number.isNaN(r)) return null;
	let i = r / 255;
	return i * n + (1 - i);
}
function Yr(e) {
	if (!e) return null;
	if (e.fillType === "solid") return Jr(e.color);
	if (e.fillType === "gradient") {
		let t = e.stops.map((e) => ({
			p: Math.min(1, Math.max(0, e.position)),
			l: Jr(e.color)
		})).filter((e) => e.l !== null).sort((e, t) => e.p - t.p);
		if (t.length === 0) return null;
		let n = t[0], r = t[t.length - 1], i = n.l * n.p + r.l * (1 - r.p);
		for (let e = 0; e + 1 < t.length; e++) i += (t[e].l + t[e + 1].l) / 2 * (t[e + 1].p - t[e].p);
		return i;
	}
	return null;
}
function Xr(e) {
	return e.name === "SmartArt" && e.id === void 0;
}
function Zr(e, t) {
	let n = Yr(e);
	if (n === null || n >= .5) return null;
	let r = Jr(t.replace(/^#/, ""));
	return r !== null && r >= .5 ? null : "#FFFFFF";
}
function Qr(e, t, n, r, i, a = 0) {
	let o = e.map((e) => e.width), s = (t) => {
		let n = 0;
		for (let r = t; r < e.length && !e[r].isTab; r++) n += o[r];
		return n;
	}, c = n;
	for (let n = 0; n < e.length; n++) {
		if (!e[n].isTab) {
			c += o[n];
			continue;
		}
		let l = null;
		for (let e of t) e.pos > c && (l === null || e.pos < l.pos) && (l = e);
		if (l === null) if (a > 0) l = {
			pos: (Math.floor(c / a) + 1) * a,
			algn: "l"
		};
		else {
			o[n] = i, c += i;
			continue;
		}
		let u = s(n + 1), d = l.algn === "ctr" ? .5 : +(l.algn === "r" || l.algn === "dec"), f = l.pos - u * d;
		f + u > r && (f = r - u), f < c && (f = c), o[n] = f - c, c = f;
	}
	return o;
}
var $r = () => !1;
function ei(e, t, n, r, i, a, o = "fill", s = $r) {
	let c = e.textAlign, l = e.textBaseline, u = o === "stroke" ? e.strokeText.bind(e) : e.fillText.bind(e), d = r - St(e, t, i), f = 0;
	for (let o of t) {
		let t = o.codePointAt(0) ?? 0, l = ze(t), p = e.measureText(o).width + a, m = l === "Tr" ? lt(t) : null, h = l === "Tr" && m === null && Ne(t), g = l === "U" || l === "Tu" || m !== null || h;
		if (dt(t) && s(t)) {
			let t = n + f + p / 2;
			e.save(), e.translate(t, d), e.rotate(-Math.PI / 2), e.textAlign = "center", e.textBaseline = "middle", Ge(e, () => u(o, 0, 0)), e.restore();
		} else if (g) {
			let r = m === null && l === "Tu" ? pt(t) : null, a = m === null ? r : m, s = a === null ? o : String.fromCodePoint(a), c = n + f + p / 2, h = r === null ? Ct(e, s) / i : 0;
			e.save(), e.translate(c, d), e.rotate(-Math.PI / 2), e.textAlign = "center", e.textBaseline = "middle", u(s, 0, h * i), e.restore();
		} else if (l === "Tr") {
			let t = n + f + p / 2;
			e.textAlign = "center", e.textBaseline = "middle", u(o, t, d);
		} else e.textAlign = c, e.textBaseline = "alphabetic", u(o, n + f, r);
		f += p;
	}
	e.textAlign = c, e.textBaseline = l;
}
function ti(e, t, n, r, i, a, o = "fill") {
	ei(e, t, n, r, i, a, o, (t) => Je(e, t));
}
var ni = /* @__PURE__ */ new WeakMap();
function ri(e) {
	let t = 0;
	for (let n of e) t++;
	return t;
}
function ii(e) {
	let t = ni.get(e);
	if (t !== void 0) return t;
	let n = e, r = n.letterSpacing;
	if (typeof r != "string") return ni.set(e, !1), !1;
	let i = !1;
	try {
		n.letterSpacing = "0px";
		let t = e.measureText("ii").width;
		n.letterSpacing = "1px";
		let r = e.measureText("ii").width;
		i = Number.isFinite(t) && Number.isFinite(r) && r !== t;
	} catch {
		i = !1;
	} finally {
		try {
			n.letterSpacing = r;
		} catch {}
	}
	return ni.set(e, i), i;
}
function ai(e, t, n = 0) {
	let r = e, i = r.letterSpacing;
	if (n !== 0 && ii(e)) try {
		r.letterSpacing = `${n}px`;
		let i = e.measureText(t).width;
		if (Number.isFinite(i)) return t.length > 0 ? i - n : i;
	} finally {
		try {
			r.letterSpacing = i;
		} catch {}
	}
	return e.measureText(t).width + n * Math.max(0, ri(t) - 1);
}
function oi(e, t) {
	let n = t.lineMetric?.glyph ?? (t.faceFamily ? sn(t.faceFamily, /\bbold\b/.test(t.font), /\bitalic\b/.test(t.font)) : void 0);
	if (n) return n;
	e.font = t.font;
	let r = e.measureText("M"), i = t.sizePx || 1, a = r.fontBoundingBoxAscent, o = r.fontBoundingBoxDescent;
	return Number.isFinite(a) && Number.isFinite(o) && a + o > 0 ? {
		ascent: a / i,
		descent: o / i
	} : {
		ascent: .9,
		descent: .25
	};
}
function si(e) {
	let t = /* @__PURE__ */ new Map();
	return (n, r, i = !1) => {
		let a = t.get(r);
		a || (a = oi(e, r), t.set(r, a));
		let o = r.faceFamily ?? "", s = a.ascent + a.descent, c = $t * s * r.sizePx, l = r.faceFamilyLatin ?? o, u = r.lineMetricLatin?.glyph ?? sn(l, /\bbold\b/.test(r.font), /\bitalic\b/.test(r.font)), d = l === o ? s : u ? u.ascent + u.descent : s, f = Math.max(c, $t * d * r.sizePx), p = r.letterSpacingPx ?? 0;
		return nn(n, {
			family: o,
			bold: /\bbold\b/.test(r.font),
			italic: /\bitalic\b/.test(r.font)
		}, {
			upright: c,
			verticalGlyph: r.sizePx,
			rotated: (t) => (e.font = r.font, e.measureText(t).width)
		}, i).map(({ text: e, kind: t, advance: n, nominal: i }) => ({
			text: e,
			style: r,
			kind: t,
			advance: n + p,
			thickness: f,
			space: e === " ",
			box: a,
			cell: c,
			...i ? { nominal: i } : {}
		}));
	};
}
function ci(e, t) {
	let n = si(e), r = t.paragraphs.map((e) => e.marker && "text" in e.marker ? n(e.marker.text, e.marker.style, !0) : []), i = Yt(t.paragraphs.map((e, t) => ({
		runs: e.runs.map((e) => e.type === "object" && e.style.math ? {
			...e,
			width: e.style.math.ascent + e.style.math.descent
		} : e),
		alignment: e.alignment,
		marginStart: e.marginStart,
		marginEnd: e.marginEnd,
		firstLineIndent: e.firstLineIndent,
		firstLinePrefix: e.marker && ("text" in e.marker ? {
			advance: r[t].reduce((e, t) => e + t.advance, 0),
			thickness: r[t].reduce((e, t) => Math.max(e, t.thickness), 0)
		} : e.marker),
		lineSpacing: e.lineSpacing,
		spaceBefore: e.spaceBefore,
		spaceAfter: e.spaceAfter,
		emptyThickness: n("M", e.markStyle)[0].thickness,
		eastAsianLineBreak: e.eastAsianLineBreak
	})), {
		direction: t.vert,
		rect: t.rect,
		anchor: t.anchor,
		anchorCtr: t.anchorCtr,
		wrap: t.wrap,
		spcFirstLastPara: t.spcFirstLastPara,
		lnSpcReduction: t.lnSpcReduction,
		pxPerPt: t.pxPerPt,
		glyphs: n,
		sameStyle: t.sameStyle,
		objectGlyph: ({ style: e }) => {
			if (!e.math || !t.drawObject) throw Error("Missing stacked equation adapter");
			let n = e.math.ascent + e.math.descent;
			return {
				text: "",
				style: e,
				kind: "upright",
				advance: n,
				thickness: e.math.width,
				space: !1,
				box: {
					ascent: 0,
					descent: 0
				},
				cell: n
			};
		}
	}), a = i.columns.map(() => ({
		descent: 0,
		size: 0
	}));
	for (let e of i.glyphs) {
		if (e.style.math) continue;
		let t = a[e.column];
		t.descent = Math.max(t.descent, e.box.descent * e.style.sizePx), t.size = Math.max(t.size, e.style.sizePx);
	}
	if (t.drawUnderline) {
		let n, r = () => {
			if (!n) return;
			let r = i.columns[n.column], o = a[n.column];
			e.save(), e.translate(r.axisX - r.thickness / 2 + o.descent, n.top), e.rotate(Math.PI / 2), t.drawUnderline(n.style, n.bottom - n.top, o.size), e.restore();
		};
		for (let e of i.glyphs) {
			if (e.style.math) {
				r(), n = void 0;
				continue;
			}
			n && n.column === e.column && (t.sameUnderline?.(n.style, e.style) ?? n.style === e.style) ? n.bottom = e.cellTop + e.advance : (r(), n = {
				style: e.style,
				column: e.column,
				top: e.cellTop,
				bottom: e.cellTop + e.advance
			});
		}
		r();
	}
	let o = [], s = e.textAlign, c = e.textBaseline, l = (n, r, i, a) => {
		let s = a !== void 0, { style: c, box: l } = n;
		if (c.math) {
			t.drawObject(c, r - n.thickness / 2, i);
			return;
		}
		let u = c.sizePx;
		s || o.push({
			text: n.text,
			font: c.font,
			fontSize: u,
			x: r - n.thickness / 2,
			y: i,
			w: n.thickness,
			h: n.advance,
			...c.hyperlink ? { hyperlink: c.hyperlink } : {}
		}), e.font = c.font;
		let d = (n, r, i, a = !1) => {
			if (s || !c.strikethrough || !t.drawStrike) return;
			let o = e.measureText(n).width;
			t.drawStrike(c, a ? r - o / 2 : r, i, o);
		};
		if (!c.noFill) if (e.fillStyle = s && t.markerPaint ? t.markerPaint(a, r, i + n.cell - l.descent * u) : c.color, n.kind === "upright") {
			e.textAlign = "center", e.textBaseline = "alphabetic";
			let t = an(i, n.cell, l, u);
			d(n.text, r, t, !0), n.space || e.fillText(n.text, r, t);
		} else if (n.kind === "verticalGlyph") {
			let a = Jt(n);
			if (a !== null) qt(e, a, r, i, l, u, (e, t) => d(a, e, t));
			else {
				let a = r - (l.ascent + l.descent) * u / 2;
				if (e.save(), e.translate(a + u / 2, i + u / 2), e.rotate(Math.PI / 2), e.textAlign = "center", !s && c.strikethrough && t.drawStrike) {
					e.textBaseline = "alphabetic";
					let t = e.measureText(n.text).fontBoundingBoxAscent;
					e.textBaseline = "middle";
					let r = e.measureText(n.text).fontBoundingBoxAscent, i = Number.isFinite(t - r) ? t - r : (l.ascent - l.descent) * u / 2;
					d(n.text, 0, i, !0);
				}
				e.textBaseline = "middle", e.fillText(n.text, 0, 0), e.restore();
			}
		} else Qt(e, n.text, r, i, l, u, () => d(n.text, 0, 0));
	}, u = 0;
	for (let [a, o] of i.columns.entries()) {
		if (o.prefixTop !== void 0) {
			let e = o.prefixTop;
			for (let t of r[o.paragraph]) l(t, o.axisX, e, o.paragraph), e += t.advance;
			t.drawMarker?.(o.paragraph, o.axisX, o.prefixTop);
		}
		let s;
		for (; u < i.glyphs.length && i.glyphs[u].column === a;) {
			let e = i.glyphs[u++];
			l(e, e.axisX, e.cellTop), s = e;
		}
		let c = t.paragraphs[o.paragraph].endMarkStyle ?? s?.style;
		if (s && c && !c.math && c.strikethrough && t.drawStrike && i.columns[a + 1]?.paragraph !== o.paragraph) {
			let r = n(" ", c)[0];
			e.font = c.font;
			let i = e.measureText(" ").width;
			t.drawStrike(c, o.axisX - i / 2, s.cellTop + s.advance + r.cell - r.box.descent * c.sizePx, i);
		}
	}
	return e.textAlign = s, e.textBaseline = c, o;
}
var li = [
	[12288, 40959],
	[44032, 55203],
	[63744, 64255],
	[65280, 65519]
], ui = "/////wEA/zj+////////////f/7///////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAD/////TwD+/wAAAAD///////////8P//////////////////////////9/+P//////////////P////39EAAAAAFAAAAAAAAAABQAAAAAEAAAAIBCCAAAIAAAAAAAAAIAAAAAAAAAAYAhAAAAAAAAAQAEAACAAAAQAABAAIAAAAAAAAAAABAAAAAAAAAAAQgIAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAGGCAAACAAAAAAAAACAAAABAEQIAEAAAAAgEAAAQAAEAIAAAAAAAAAAAAAAAAAAAAAAAAEAACABAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAgAAAAAAAAAAAAAAMAAAAQAAABAABQEAAAAAAAAAAAggACAIQAAEABAAAggAAAAAAEAAIAAAEAAAAAAAAAAAAAAAAAAAAAAAAAACAAEAAAAAAAAAAJAAAAAAAAAAAAQAAAAAAAABAAAAAABABAAAAAAACAAAAAAAACAAAAAAEEBAAAIABAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAIAAAACkAAAAAAAAQAAAAAKAAAAAAAAAAAAAAAAAAgAAAAEAAAAAAAAIAAAAAAAAAAAAAAAAACgAAAAAAAAAAIEAAAgAAAAAAAAAAAAQgAAAAABAQAgAgEAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAQABAIAAAAAAEAAAAAAgAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAEABAAABgBAEAAAAAAAICAAAQAQAAAIAAAAIQAAAEAAAAAAAACEAACAAAAAIAAAAAAAAAAAAACAAAAABAAAAACAEAAAAgAAAAAAAAAIAAAAgAAAAAAAAAAKAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAgAABAAAAAAAAQQAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAgAAABBAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAABAQEAAABAAAAAIAAAQAAAAAAAAAAAAAAAAAAAAAAAAAQAAIAAAAAAIAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAv//3w1r/Z5u/6eL3DAM6wmV/9vt3+Uke3+3x7z/p7/gP/+c2AMD7f837//8Z1uv/fv/f7wPo5Pp//5e9f8Bv9ff+3//+f20K79fvlu00dyF75X/fD7S/br32e/f+435O33v1/4q1vp///72VdX/qWX3+7yN/P//1fL9ueed2/2f/Tf4htEfvH7i+8P171r+jvTf+nfm+83/7t/f7/xf/z++96/+7vy//7z+eX+vyv++cQVinc+/9LS3//O7///8FHv8P7NP/cnvd5yLA1H/7uHv/Z5D3/47/32cAAWf3TvTz83EAAMxue/O2y31bAAD438+e95h/RYD6Wp79HALA4uDn1wsAk/+73/oZSF+/dgXxnTDm5XveUC//i//7ac+mn79uvf/3menl9AcC9u+73g4buPafFwkhydn88Nsi8f99PyDq06Q3pgO+t8eWCyXTq7/Z8EdPDl++df/3N9qfPmS+fT++/+/h2MO/76//fDsefOyquPGNXlovH/b4zdaJG3KO1bmnYRDzEyFE7DSAzBAITd6FEC79VpvBFGtGYSwDG8AqJjRVQSsY9/14yyv1+//7v3zz/5f/8t3v99t75f7/zsRde2f/Y+0r3r/zcz6AlRegzz/+XaAKhSID53cswmj3r90KEqLMXS+SF7ZJxp4dvaqVWJU3iHrPa/9LvmvNOHavIentYbla89keff3/m8zgFPU96uNO33/+Lxvb/9//+/v++/P5s3XbO9++v/e/v89zl/+7M7g733MX/2+9gOT9v/evKgTPP/emv7+jwH5//u39B/959M86/69B/z/P9//ehx3z9vZ/KOet2f/Zn2zft7F/RFfP/yHw7rL09Zt3f/zPzh3r33t/XRvhSv495v9bQBnq/vT3/z8D9P7wnj9Lg4CvZP5e/r0b4Hv2vZ3Xdc///zRoe8N/HCt+/AdApt1Rdbdx5ATIHr2LolgvqIEv73p7Dfq2frcF/7b37DOHWPtc3vb/uOP3480YtSW+V6e7+/i9s37b1YvnMzfe3fd+8P//+55/34b////535t7x79VaDbb39NQvkFbvf+r6/z6xX3a5eLze/J/9P/YstrvP0eC/zt/x59/1tL/2h4A2eOGvx/7f3e/u4jI995+odm/7+9/Hni//7e7/ec++//PHm4Fe6tkRrh+f/+//wdkdhnj6Zfdq/3LY6zvfuovnL7uH0/97/BPZ4vWDA7F22qT+C/cG+lOE3v8lBUPPPyOx+ibmeTvyHZdq//eue9/LuDJHf+///n73I3K2IqCNOefithR+M0H7LX+ha1db/4z/Z8GbB//drb/Pq//HwiR3I7O8M9++zIAgN/71pETp3f+GwDctLP13Wfvd9//H7EPqO7/+lRfOP/e+YzJTOgFsEmzpezerL//OmIA+JTrVrd7DW2+b9kigJ7/V/ERdd9534X7xWtS7wcwzRPba3bjrqLtyZGVVphfMmE42mFxYkb0ixD4mw8AjXqzEBACJvibEFZD6EMR4l7vVvVTACKxlXSOBdEPxhtb/ZbhcCDbwSOprBC9df/v2e3/j8uW+5diTAiF8VdC31LliycymH+0LMz7tN/+7jjgxeHJ36cf+0750WUvrLpl/0xi62ay7/sGCgx2/3+G2yiu/t3vT0Dri4fX788nrgCXWd3dz9edenDu1fufz//Z/5f+977//+bePzY8CL/3//S8+5/SH9afv2z7/yM9H/8fZJO291d9/3lp/v/l0aduf9Ta+1VXW9NftN514/B35eTE3f8dHfYReHLEtfZr+ogipt799hsZZHI2Iu9wtYS40QZwG90UVML0uuWaty/84l9/jNOV3O7DUAfe4X4z/POP+/2lK4TeM/x6OcLPG++Xv3bl/z4DGY1/st+D6Lf//fPhsq8uced/Df/BCdZp3vj/Lr7vv1Pv1I0Wy+n/e6rj+3cg8fa/htDq9/8jtHc995/QLnEn/Vff+p7K6x3a52m0//+78i1yzqq1yfdpz/615/z3xYp0Tf2v/39P/C/2//nLfu5Fb69uu8r+zfz/7/385nd/v3YOMw+n+M/57u76bHXn5u4p+873f30AAAAAAAAAAAAAAAAAAAAAAABA/bjwP7n7b6fj7f3TdF7nVLNr1TSIa9sN/v/9//NTUfn+WQRExVeh/+ryW0h/9r4WB3j19G9z4H9/7C/AXZmSK3bgXL+A4+uTh3/NaX0dQz3tb+/q77s9f/+/993/Bl/8F/nKwrfd7dbrm25er/v/n/9gAL/e/63abv9fwPkO+f83veb/AQwAqbn1Znz/xT8i4KPWW7Ejj9c72vyqAgWWIjPg58af//77NzYIvdJCpxb/1/9LFoDUl7zNULvd/rx84EvP7/cfr4Du85+bu/X/0feG7iG3cyfI3vVsz0+WokG3R2D9/5+a4g6AP2o12q/7g/tqtt758gB//e8f1yrDlv4peqqje8VWmfw7qcON+Crs009lln287s/q7n/fjmFnHn9/7v8fi6fqBynE3xVNs/Q//D77goG/c9b0bXfhDedPf7LE3F/svfzLr/md45b9tAEA9DXoKlqjvdX/6X+8+nzrY/9573rv3v2678f7883a3L///Nd4+9X3fNP+QzmJUn7zXt9IutfzO/x99gAAAAAAAAAAAAAAAAAAAAAAAIDn4t+7L14/aF/kfh17l//dv//van5ftbf9uu/dCAAAAAAAAAAA8HrbgDYlI8JJmaxe5d3yrrqdP7Byn1PgzwT7I5f/Mfofslcevi4/b4b+a0z7vRaYDGmDf62X/fvr//jP//a+8T4AAAAAAAD4++H33XdsPwR97/Nvf/n774/3/tO+/n977/P1t7/fowtvhX9hulWk+zap9eB1IfVXreLXNsj/3A++NrwP7m6/UVb9f73/+9v/+vbjuvN2/3F40/nX/e/Df/fD4/spZ+6fsanEv+/5rbO7d42fVaEz9//f/AyQL/ddsf579Ae99E3ae3EG+j/L8/YBoi+e4/mHAsh+rToVLt4P7afwGgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgEPd/17j/ztU/sg/f/d3AAAAAAAAcHbVnr8XuNX5flT9/X7v8r/5x98/835m/wyPxw7951p+ngVPa97n5l/fb9q/c6rh1015ftf6f5t7E+D+jf7131d7+L150Pz+T+ycGwAAAAAAAO3TnfwZAJjv7l9wrBf//ddZPn7ne7fbAQAAAAAAwOtocT+2egM//4R8N/s+3E9GnWnrQb989q00DgAAAAAAAAD19dtbwf/b/f6+rn97Rb/t774+PvnyTWr9/IP57t/kwX+X28PH16m+za+nVb9/f/7n5276x939qW/lDQAAAAAAAAAAAAAAAOAa3QLMS6b5SJ0d/P4FH/I/ns1c2ObsBxLeNr/fhvjG6eodZ4RkZ34AAAAAAAAAAAAAIL+/2e7pcPc5/1j5N/ux8fe7jMP/jkeclv76zPzlz/fvJACg93AvAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIwAAQAAAAAAAAQAAAAAAAAAAAAAAAQAAEAAAAAAPz////z/////////wMAAAAAAAAAAAAAAAAAAAAAAOD/////////////////////////DwAAAAAAAADw9wc=", di = [
	[12288, 12291],
	[12293, 12306],
	[12308, 12309],
	[12316, 12318],
	[12321, 12329],
	[12336, 12336],
	[12353, 12435],
	[12443, 12446],
	[12449, 12534],
	[12539, 12542],
	[12549, 12585],
	[12690, 12703],
	[12736, 12751],
	[12849, 12849],
	[12963, 12963],
	[13198, 13199],
	[13212, 13214],
	[13217, 13217],
	[13252, 13252],
	[13262, 13262],
	[13265, 13266],
	[13269, 13269],
	[13312, 19893],
	[19968, 40883],
	[40903, 40907],
	[63744, 64045],
	[65281, 65374],
	[65377, 65439],
	[65504, 65509],
	[65517, 65517]
], fi = [
	[12288, 12351],
	[12353, 12438],
	[12441, 12543],
	[12549, 12587],
	[12688, 12727],
	[12736, 12751],
	[12784, 12799],
	[12849, 12849],
	[12963, 12963],
	[13198, 13199],
	[13212, 13214],
	[13217, 13217],
	[13252, 13252],
	[13262, 13262],
	[13265, 13266],
	[13269, 13269],
	[13312, 19893],
	[19968, 40883],
	[63744, 64045],
	[65281, 65470],
	[65474, 65479],
	[65482, 65487],
	[65490, 65495],
	[65498, 65500],
	[65504, 65510],
	[65512, 65518]
], pi = [
	"MS Mincho",
	"PMingLiU",
	"Batang"
], mi = [
	"MS Gothic",
	"Microsoft JhengHei",
	"Malgun Gothic"
], hi = Object.freeze([
	"Arial",
	"Angsana New",
	"Mangal",
	"Latha"
]), gi = /\p{Script=Thai}/u, _i = /\p{Script=Devanagari}/u, vi = /\p{Script=Tamil}/u;
function yi(e) {
	return gi.test(e) ? "Angsana New" : _i.test(e) ? "Mangal" : vi.test(e) ? "Latha" : "Arial";
}
var bi;
function xi() {
	if (bi) return bi;
	let e = atob(ui), t = new Uint8Array(e.length);
	for (let n = 0; n < e.length; n++) t[n] = e.charCodeAt(n);
	return bi = t, t;
}
function Si(e) {
	let t = 0;
	for (let [n, r] of li) {
		if (e >= n && e <= r) return t + e - n;
		t += r - n + 1;
	}
	return -1;
}
function Ci(e, t) {
	let n = 0, r = t.length - 1;
	for (; n <= r;) {
		let i = n + r >> 1, [a, o] = t[i];
		if (e < a) r = i - 1;
		else if (e > o) n = i + 1;
		else return !0;
	}
	return !1;
}
function wi(e) {
	let t = Si(e);
	return t < 0 ? !1 : (xi()[t >> 3] & 1 << (t & 7)) != 0;
}
function Ti(e, t) {
	for (let n of t) {
		let t = n.codePointAt(0) ?? 0;
		if (!/\s/u.test(n) && !(e === "MS Mincho" || e === "MS Gothic" ? wi(t) : e === "PMingLiU" ? Ci(t, di) : e === "Microsoft JhengHei" && Ci(t, fi))) return !1;
	}
	return !0;
}
function Ei(e) {
	let t = _(e, { source: "office-mac" });
	return t.length > 0 ? t : _(e);
}
function Di(e) {
	return Ei(e).some((e) => e.farEastCodePage === !0);
}
function Oi(e) {
	return Ei(e).some((e) => {
		let t = e.panose;
		return !!t && t[0] === 2 && t[1] >= 2 && t[1] <= 10;
	});
}
function ki(e, t) {
	if (e && Di(e)) return F(e) === "jp" ? [
		e,
		"Microsoft JhengHei",
		"Malgun Gothic"
	] : [
		e,
		"PMingLiU",
		"Batang"
	];
	let n = e && Oi(e) ? pi : mi, r = n.slice(0, 2).find((e) => Ti(e, t));
	return r ? [r, ...n.filter((e) => e !== r)] : [
		n[2],
		n[0],
		n[1]
	];
}
var Ai = new Set([
	167,
	168,
	176,
	177,
	180
]), ji = new Set([
	215,
	247,
	8263,
	8264
]), Mi = /^(?:ja|ko|zh)(?:[-_]|$)/i, Ni = /^(?:ar|he|hi|th)(?:[-_]|$)/i;
function Pi(e, t) {
	return Ai.has(e) || e >= 9312 && e <= 9471 || e >= 9632 && e <= 10175 || e >= 65072 && e <= 65103 ? !0 : ji.has(e) ? !Ni.test(t ?? "") : e >= 8216 && e <= 8222 && Mi.test(t ?? "");
}
function Z(e, t) {
	return e * t;
}
function Fi(e, t, n, r) {
	let i = v(Math.abs(e * n), Math.abs(t * n), r);
	return i ? {
		targetWidthPx: i.width,
		targetHeightPx: i.height
	} : void 0;
}
function Ii(e, t) {
	return e.blipEffects?.length ? t.catch((e) => {
		throw Pt(e);
	}) : t;
}
function Li(e) {
	return e instanceof t && e.code === "unsupported-image-effect";
}
function Q(e, t = e) {
	if (!e.blipEffects?.length) return e.duotone ?? void 0;
	let n = e.tile ? 914400 / (e.dpi != null && e.dpi > 0 ? e.dpi : 96) : void 0;
	return {
		effects: e.blipEffects,
		duotone: e.duotone ?? null,
		hostRotation: e.rotWithShape === !1 ? 0 : t.rotation,
		hostFlipH: t.flipH,
		hostFlipV: t.flipV,
		...n === void 0 ? {} : {
			emuPerPixelX: n,
			emuPerPixelY: n
		}
	};
}
function Ri(e, t, n) {
	return e.tile && e.blipEffects?.length ? {
		widthPt: 0,
		heightPt: 0
	} : {
		widthPt: t,
		heightPt: n
	};
}
function zi(e, t) {
	return it(e, t);
}
function Bi(e, t) {
	let n = e.targets.get(t);
	return n ? {
		targetWidthPx: n.width,
		targetHeightPx: n.height,
		maxRetainedPixels: n.maxRetainedPixels
	} : void 0;
}
function Vi(e) {
	return !Q(e) && Re(e) ? e.svgImagePath : e.imagePath;
}
function Hi(e, t, n, r) {
	let i = Pr(t.bullet);
	if (i.type !== "blip") return;
	let a;
	for (let e of t.runs) if (e.type === "text" && e.fontSize != null) {
		a = e.fontSize;
		break;
	}
	let o = a ?? t.defFontSize ?? e.defaultFontSize ?? 18, s = i.sizePts == null ? o * ((i.sizePct ?? 100) / 100) : i.sizePts;
	return Math.max(1, s * h * n * r);
}
async function Ui(e, n, r, i, a, o, s, c, l, u) {
	let d = ft(o), f = [], p = [], m = (e, t, n, r, i, a = 1, o = i) => {
		if (!(!t || !i)) {
			if (Nt(r) && (d.resolution === "display" || d.strategy === "adaptive")) {
				f.push({
					key: e,
					...t,
					retainedSurfaceCount: a
				});
				return;
			}
			p.push(Ye(n, r, i, o).then((n) => n.dimensions && Ft(n.format, u !== void 0) ? {
				key: e,
				...t,
				sourceWidthPx: n.dimensions.width,
				sourceHeightPx: n.dimensions.height,
				retainedSurfaceCount: a
			} : null).catch((e) => {
				if (e instanceof J || Li(e) || kt(e)) throw e;
				return null;
			}));
		}
	}, g = e.background;
	if (g?.fillType === "image" && g.imagePath && !g.tile && !Q(g)) {
		let e = g.fillRect ?? {}, t = n * (1 - (e.l ?? 0) - (e.r ?? 0)), i = r * (1 - (e.t ?? 0) - (e.b ?? 0));
		m(zi(g.imagePath, Q(g)), Fi(t, i, a, g.srcRect), g.imagePath, g.mimeType, s, 1);
	}
	for (let n of e.elements) {
		for (let { fill: e, width: t, height: r } of Wi(n)) if (!e.tile && !Q(e)) {
			let n = e.fillRect ?? {}, o = Z(t, i) * (1 - (n.l ?? 0) - (n.r ?? 0)), c = Z(r, i) * (1 - (n.t ?? 0) - (n.b ?? 0));
			e.mimeType === "image/svg+xml" || Re(e) || m(zi(e.imagePath, Q(e)), Fi(o, c, a, e.srcRect), e.imagePath, e.mimeType, s, 1);
		}
		if (n.type === "picture") !(Re(n) || n.mimeType === "image/svg+xml") && !Q(n) && m(zi(n.imagePath, Q(n)), Fi(Z(n.width, i), Z(n.height, i), a, n.srcRect), n.imagePath, n.mimeType, s, 1);
		else if (n.type === "media" && n.posterPath) {
			let e = c ? No(c) : void 0;
			m(zi(n.posterPath), Fi(Z(n.width, i), Z(n.height, i), a), n.posterPath, n.posterMimeType || "application/octet-stream", e, 1, l ?? e);
		} else if (n.type === "chart") {
			if (!Number.isFinite(n.width) || !Number.isFinite(n.height) || n.width < 0 || n.height < 0) throw new t("unsupported-image-effect", "Invalid chart image frame");
			if (!(n.width > 0 && n.height > 0)) continue;
			let e = {
				widthPt: n.width / h,
				heightPt: n.height / h,
				targetWidthPx: Z(n.width, i) * a,
				targetHeightPx: Z(n.height, i) * a
			};
			for (let t of W(n.chart)) {
				let n = t.fill, r = j(t, e);
				!(n.mimeType === "image/svg+xml" || Re({
					svgImagePath: n.svgImagePath,
					srcRect: t.hasSourceCrop ? !0 : null
				})) && !Q(n) && !t.preserveNaturalSize && r?.targetWidthPx && r.targetHeightPx && m(zi(n.imagePath, Q(n)), {
					targetWidthPx: r.targetWidthPx,
					targetHeightPx: r.targetHeightPx
				}, n.imagePath, n.mimeType, s, 1);
			}
		} else if (n.type === "shape") {
			if (!n.textBody) continue;
			for (let e of n.textBody.paragraphs) {
				let t = Pr(e.bullet);
				if (t.type !== "blip") continue;
				let r = Hi(n.textBody, e, i, a);
				!r || !s || p.push(Ye(t.imagePath, t.mimeType, s).then((e) => e.dimensions && e.dimensions.width > 0 && e.dimensions.height > 0 && Ft(e.format, u !== void 0) ? {
					key: zi(t.imagePath),
					targetWidthPx: r * e.dimensions.width / e.dimensions.height,
					targetHeightPx: r,
					sourceWidthPx: e.dimensions.width,
					sourceHeightPx: e.dimensions.height
				} : null).catch((e) => {
					if (e instanceof J || Li(e) || kt(e)) throw e;
					return null;
				}));
			}
		}
	}
	return f.push(...(await Promise.all(p)).filter((e) => e !== null)), Pe(f, d);
}
function* Wi(e) {
	let n = (t, n, r) => t?.fillType === "image" && Ha(t) ? {
		fill: t,
		width: n,
		height: r,
		host: e
	} : null;
	if (e.type === "shape") {
		if (e.fill?.fillType === "image" && (![e.width, e.height].every(Number.isFinite) || e.width < 0 || e.height < 0)) throw new t("unsupported-image-effect", "Invalid image fill frame");
		let r = n(e.fill, e.width, e.height);
		r && e.height > 0 && (yield r);
	} else if (e.type === "table") {
		let t = [0];
		for (let n of e.cols) t.push(t[t.length - 1] + n);
		let r = [0];
		for (let t of e.rows) r.push(r[r.length - 1] + t.height);
		let i = t[t.length - 1], a = r[r.length - 1] || e.height, o = n(e.background, i, a);
		o && (yield o);
		for (let i = 0; i < e.rows.length; i++) {
			let a = e.rows[i];
			for (let o = 0; o < a.cells.length; o++) {
				let s = a.cells[o];
				if (s.hMerge || s.vMerge || s.fill?.fillType !== "image" || !Ha(s.fill)) continue;
				let c = (t[Math.min(o + (s.gridSpan || 1), e.cols.length)] ?? 0) - (t[o] ?? 0), l = r[Math.min(i + (s.rowSpan || 1), e.rows.length)] - r[i] || e.height, u = n(s.fill, c, l);
				u && (yield u);
			}
		}
	}
}
function* Gi(e) {
	for (let t of e.elements) yield* Wi(t);
}
function Ki(e) {
	return e.background?.fillType === "image" ? !0 : e.elements.some((e) => e.type === "picture" ? !0 : e.type === "media" ? !!e.posterPath : e.type === "chart" ? W(e.chart).length > 0 : !Wi(e).next().done || (e.type === "shape" || e.type === "table") && e.mathFallback?.elements.length ? !0 : e.type === "shape" && (e.fill?.fillType === "image" || !!e.textBody?.paragraphs.some((e) => Pr(e.bullet).type === "blip")));
}
var $ = D;
function qi(e, t, n, r, i, a, o, s) {
	let c = s?.glyph, { top: l, height: u } = s && c ? (() => {
		let e = n + 1.2 * i * (1 - s.share), t = (c.ascent + c.descent) * i;
		return {
			top: e - t,
			height: t
		};
	})() : ar(n, i);
	e.fillStyle = a, e.fillRect(t, l, r, u), e.fillStyle = o;
}
function Ji(e, t, n, r, i, a, o = 0, s = 4 / 3, c, l) {
	return re(e, t, n, r, i, a, o, s, void 0, c, l);
}
function Yi(e, t, n, r, i, a, o, s, c = t.drawSizePx ?? t.sizePx) {
	if (t.underline && !t.underlineLineNoFill && (!t.noFill || t.underlineFill || t.underlineColor || t.underlineLine?.fill)) {
		let l = t.underlineFill ? re(t.underlineFill, e, n, r, i, c * .05, 0, o * 12700) ?? "rgba(0,0,0,0)" : t.underlineLine?.fill ? re(t.underlineLine.fill, e, n, r, i, c * .05, 0, o * 12700) ?? "rgba(0,0,0,0)" : t.underlineColor ?? a, d = t.lineMetric?.decoration;
		u(e, n, r, i, c, l, t.underlineStyle, s, t.underlineLine?.width ? Z(t.underlineLine.width, o) : void 0, d ? {
			topPx: d.underlineTopEm * c,
			thicknessPx: d.underlineThicknessEm * c
		} : void 0);
	}
}
function Xi(e, t, n, r, i, a, s) {
	let c = t.drawSizePx ?? t.sizePx;
	if (t.strikethrough && !t.noFill) {
		let l = t.lineMetric?.decoration, u = l ? l.strikeThicknessEm * c : Math.max(1, c * g);
		e.strokeStyle = a, e.lineWidth = u, e.setLineDash([]);
		let d = l ? r + l.strikeTopEm * c + u / 2 : r - c * o;
		if (t.strikeDouble) {
			let t = l ? u : u * .9, r = d - t, a = d + t;
			e.beginPath(), e.moveTo(n, r + x(r, u, s)), e.lineTo(n + i, r + x(r, u, s)), e.moveTo(n, a + x(a, u, s)), e.lineTo(n + i, a + x(a, u, s)), e.stroke();
		} else {
			let t = d + x(d, u, s);
			e.beginPath(), e.moveTo(n, t), e.lineTo(n + i, t), e.stroke();
		}
	}
}
function Zi(e, t, n, r, i, a, o, s) {
	Yi(e, t, n, r, i, a, o, s), Xi(e, t, n, r, i, a, s);
}
var Qi = /* @__PURE__ */ new WeakMap(), $i = /* @__PURE__ */ new WeakSet();
function* ea(e) {
	if (e.type === "shape" && e.textBody) yield e.textBody;
	else if (e.type === "table") for (let t of e.rows) for (let e of t.cells) e.textBody && (yield e.textBody);
}
function ta(e) {
	let t = [];
	for (let n of e.elements) for (let e of ea(n)) for (let n of e.paragraphs) for (let e of n.runs) e.type === "math" && t.push({
		nodes: e.nodes,
		display: e.display
	});
	return t;
}
async function na(e, t) {
	let n = ta(e);
	if (n.length !== 0) {
		try {
			await t.loadMathJax();
		} catch (e) {
			if (e instanceof J || kt(e)) throw e;
			for (let e of n) Qi.has(e.nodes) || $i.add(e.nodes);
			return;
		}
		for (let e of n) if (!Qi.has(e.nodes)) try {
			let n = await t.mathMLToSvg(tt(e.nodes, e.display)), r = await ot(n, "#000000");
			$i.delete(e.nodes), Qi.set(e.nodes, {
				raster: r,
				widthEm: n.widthEm,
				ascentEm: n.ascentEm,
				descentEm: n.descentEm,
				tinted: /* @__PURE__ */ new Map()
			});
		} catch (t) {
			if (t instanceof J || Li(t) || kt(t)) throw t;
			$i.add(e.nodes);
		}
	}
}
function ra(e, t, n, r) {
	let i = t.math, a = i.unavailable ? void 0 : Qi.get(i.nodes), o = i.ascent + i.descent;
	if (i.width > 0 && o > 0) if (a) e.drawImage(Ue(a, t.color), n, r, i.width, o);
	else if (i.fallbackText) {
		e.font = t.font, e.fillStyle = t.color;
		let a = e.textBaseline, o = e.textAlign;
		e.textBaseline = "top", e.textAlign = "left", e.fillText(i.fallbackText, n, r), e.textBaseline = a, e.textAlign = o;
	} else i.unavailable && Mt(e, "equation", {
		x: n,
		y: r,
		width: i.width,
		height: o
	});
}
function ia(e, t, n, r, i) {
	return t.patternFill ? re(t.patternFill, e, n, r, 0, 0, 0, i * 12700) ?? t.color : t.color;
}
function aa(e, t) {
	let n = (e) => t.embeddedFontAliases?.get(e.trim().toLowerCase()) ?? e;
	if (!e) return n(t.themeMinorFont ?? "sans-serif");
	if (e.startsWith("+")) return n(e === "+mj-lt" || e === "+mj-ea" || e === "+mj-cs" ? t.themeMajorFont ?? "sans-serif" : t.themeMinorFont ?? "sans-serif");
	let r = e.split(",")[0].trim();
	return r ? n(r) : t.themeMinorFont ?? "sans-serif";
}
function oa(e) {
	return !!e?.trim();
}
var sa = new Set([
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
	"system-ui"
]);
function ca(e) {
	let t = w(e);
	return t === "mono" ? "monospace" : t === "serif" ? "serif" : "sans-serif";
}
function la(e) {
	if (H(e)?.includes("Arabic")) return !0;
	let t = e.toLowerCase();
	return /arabic|naskh|kufi|nastaliq|amiri|scheherazade|lateef|aldhabi|urdu|farsi|العرب|[؀-ۿ]/.test(t);
}
function ua(t, r = t, i, a = "", o = !1) {
	let s = ca(r), c = m(a), u = o ? H(r) : void 0, d = u && Dt(l(V, r.toLowerCase()), a, "any") ? u : void 0, f = d ? `${p(d)}, ` : "", h = ge(r), g = h ? `${p(h)}, ` : "", _ = n(s === "serif"), v = c ? `${e(_)}, ` : "";
	if (la(r) && c) {
		let n = i ? G(i, "sans") : [];
		return `${p(t)}, ${f}${v}${n.length ? `${e(n)}, ` : ""}${s}`;
	}
	let y = s === "serif" ? "serif" : "sans", b = F(r), x = b ?? i, S = x ? G(x, y).filter((e) => e !== h) : [], C = S.length > 0 ? `${e(S)}, ` : "", w = `${e(y === "serif" ? M : ue)}, `;
	return b ? `${p(t)}, ${f}${g}${C}${w}${v}${s}` : `${p(t)}, ${f}${g}${w}${C}${v}${s}`;
}
function da(e) {
	return e ? e.kind === "external" ? `e:${e.url}` : `i:${e.ref}` : "";
}
function fa(e) {
	let t = e.toLowerCase();
	return /\bthin\b/.test(t) ? 100 : /\b(extra[- ]?light|ultra[- ]?light)\b/.test(t) ? 200 : /\blight\b/.test(t) ? 300 : /\b(black|heavy)\b/.test(t) ? 900 : /\b(extra[- ]?bold|ultra[- ]?bold)\b/.test(t) ? 800 : /\b(semi[- ]?bold|demi[- ]?bold)\b/.test(t) ? 600 : /\bbold\b/.test(t) ? 700 : /\bmedium\b/.test(t) ? 500 : /\b(normal|regular)\b/.test(t) ? 400 : null;
}
function pa(e, t, n, r, i, a, o, s) {
	let c = Math.max(0, r.blur * i), l = Math.ceil(c * 3) + 2, u = Math.max(0, Math.floor(n.x - l)), d = Math.max(0, Math.floor(n.y - l)), f = Math.min(o, Math.ceil(n.x + n.w + l)), p = Math.min(s, Math.ceil(n.y + n.h + l)), m = Math.max(1, f - u), h = Math.max(1, p - d), g = te(m, h), _ = g?.getContext("2d");
	if (!g || !_) return;
	_.save(), _.setTransform(a.a, a.b, a.c, a.d, a.e - u, a.f - d), U(e, _, () => t(_), {
		x: u,
		y: d
	}), _.restore();
	let v = n.y - d, y = v + n.h, b = g, x = _;
	if (c > 0) {
		let e = te(m, h), t = e?.getContext("2d");
		e && t && (b = e, x = t);
	}
	b !== g && Lr(x, g, {
		x: n.x - u,
		y: v,
		w: n.w,
		h: n.h
	}, c, m);
	let S = Math.max(0, Math.min(1, r.stPos)), C = Math.max(0, Math.min(1, r.endPos)), w = Math.max(1, y - v);
	try {
		let e = x.getImageData(0, 0, m, h);
		for (let t = 0; t < h; t++) {
			let n = Math.max(0, Math.min(1, (y - (t + .5)) / w)), i;
			if (n <= S) i = r.stA;
			else if (n >= C || C <= S) i = r.endA;
			else {
				let e = (n - S) / (C - S);
				i = r.stA + (r.endA - r.stA) * e;
			}
			let a = Math.max(0, Math.min(1, i));
			for (let n = t * m * 4 + 3; n < (t + 1) * m * 4; n += 4) e.data[n] = Math.round(e.data[n] * a);
		}
		x.putImageData(e, 0, 0);
	} catch {
		x.save(), x.globalCompositeOperation = "destination-in", x.fillStyle = `rgba(0,0,0,${Math.max(0, Math.min(1, r.stA))})`, x.fillRect(0, 0, m, h), x.restore();
	}
	let T = r.dist * i, E = r.dir * Math.PI / 180, D = n.y + n.h;
	e.save(), e.setTransform(1, 0, 0, 1, 0, 0), e.translate(n.x + Math.cos(E) * T, D + Math.sin(E) * T), e.scale(r.sx, r.sy), e.translate(-n.x, -D), e.drawImage(b, u, d), e.restore();
}
function ma(t, n, r, i, a, o = "", s = !0, c = []) {
	let l = n ? "italic " : "", u = aa(i, a), { authoredFamily: d, officeRoute: f } = ga(u, t, n, a), p = fa(d), m = t ? "bold " : p ? `${p} ` : "", h = s ? f : void 0, g = fe(o) ? a.cjkFallback ?? F(a.themeMajorFont) ?? F(a.themeMinorFont) ?? void 0 : void 0;
	if (sa.has(u)) {
		let t = g ? G(g, u === "serif" ? "serif" : "sans") : [], n = u === "monospace" ? ["Courier New", "Liberation Mono"] : u === "serif" ? [
			...M,
			"Times New Roman",
			"Liberation Serif"
		] : [
			...ue,
			"Arial",
			"Helvetica",
			"Liberation Sans"
		];
		return `${l}${m}${r}px ${t.length ? `${e([...n, ...t])}, ` : ""}${u}`;
	}
	let _ = ua(h?.family ?? u, d, g, o, a.googleSubstitutes === !0), v = c.filter((e) => e !== u);
	return `${l}${m}${r}px ${v.length ? _.replace(/^("(?:[^"\\]|\\.)*"), /u, (t, n) => `${n}, ${e(v)}, `) : _}`;
}
function ha(e, t, n, r) {
	if (sa.has(e)) return;
	let { authoredFamily: i, embedded: a, officeRoute: o } = ga(aa(e, r), t, n, r);
	if (o) return _r(a ? i : e, t, n);
	if (!(a || !_a(i, r))) return _r(e, t, n);
}
function ga(e, t, n, r) {
	let i = r.embeddedFontAuthoredFamilies?.get(e), a = i ?? e, o = fa(a), s = `${a.toLowerCase()}:${t || o === 700 ? 700 : 400}:${n ? "italic" : "normal"}`, c = r.embeddedFontTuples?.has(s) ? void 0 : r.officeFontRoutes ? l(r.officeFontRoutes, va(a, ur(a, t, n), n)) : void 0;
	return {
		authoredFamily: a,
		embedded: i !== void 0,
		officeRoute: c
	};
}
function _a(e, t) {
	return t.officeInstalledFamilies?.includes(He(e)) === !0;
}
function va(e, t, n) {
	let r = He(e);
	return t === 400 && !n ? r : `${r}:${t}:${n ? "italic" : "normal"}`;
}
function ya(e) {
	return e.bullet.type === "char" || e.bullet.type === "autoNum" || Pr(e.bullet).type === "blip";
}
function ba(e, t, n) {
	let r = null;
	for (let e of t.runs) if (e.type === "text" && e.fontSize != null) {
		r = e.fontSize;
		break;
	}
	let i = r ?? t.defFontSize ?? e.defaultFontSize ?? 18;
	return n.sizePts == null ? i * ((n.sizePct ?? 100) / 100) : n.sizePts;
}
function xa(e, t) {
	return e ? 0 : t;
}
var Sa = /[\p{Script=Devanagari}\p{Script=Thai}\p{Script=Bengali}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Kannada}\p{Script=Malayalam}\p{Script=Gujarati}\p{Script=Gurmukhi}\p{Script=Oriya}\p{Script=Sinhala}\p{Script=Khmer}\p{Script=Lao}\p{Script=Myanmar}\p{Script=Tibetan}]/u;
function Ca(e, t) {
	return t != null && t !== 0 ? e * .65 : e;
}
function wa(e, t, n, r, i, a, o, s) {
	let c = (t.defaultFontSize ?? 18) * h * a;
	for (let l of t.paragraphs) {
		let u = Z(l.marL, a), d = Z(l.marR, a), f = Z(l.indent, a), p = xa(ya(l), f), m = n - r - i - u - d - p, { input: g } = ka(l, l.defFontSize == null ? c : l.defFontSize * h * a, "", a, t.defaultBold ?? !1, t.defaultItalic ?? !1, 1, s, o), _ = 0, v;
		for (let t of g) {
			if (t.type !== "text") {
				v = void 0;
				continue;
			}
			e.font = t.style.font;
			let n = t.style.letterSpacingPx ?? 0;
			if (_ += Oa(e, t.text, n), v?.sourceRunId === t.style.sourceRunId && (_ += n), v = t.style, _ > m) return !0;
		}
	}
	return !1;
}
function Ta(e) {
	let t = 0;
	for (let n of e) t++;
	return t;
}
var Ea = /* @__PURE__ */ new WeakMap();
function Da(e) {
	let t = Ea.get(e);
	if (t != null) return t;
	let n = e, r = n.letterSpacing;
	if (typeof r != "string") return Ea.set(e, !1), !1;
	let i = !1;
	try {
		n.letterSpacing = "0px";
		let t = e.measureText("ii").width;
		n.letterSpacing = "1px";
		let r = e.measureText("ii").width;
		i = Number.isFinite(t) && Number.isFinite(r) && r !== t;
	} catch {
		i = !1;
	} finally {
		try {
			n.letterSpacing = r;
		} catch {}
	}
	return Ea.set(e, i), i;
}
function Oa(e, t, n) {
	let r = e, i = r.letterSpacing;
	if (n !== 0 && Da(e)) try {
		r.letterSpacing = `${n}px`;
		let i = e.measureText(t).width;
		if (Number.isFinite(i)) return t.length > 0 ? i - n : i;
	} finally {
		try {
			r.letterSpacing = i;
		} catch {}
	}
	let a = Math.max(0, Ta(t) - 1);
	return e.measureText(t).width + n * a;
}
function ka(e, t, n, r, i, a, o, s, c, l = !1, u) {
	let d = [], f = e.runs.map((e) => e.type === "text" ? dn(e, s) : null), p = [], g = "";
	for (let e of f) p.push(g.length), g += e ?? "\n";
	let _ = Xe(g);
	_.push(g.length);
	let v = 0, y = (e) => {
		for (; v < _.length && _[v] < e;) v++;
		return v < _.length ? _[v] : g.length;
	}, b = null, x = /* @__PURE__ */ new Map(), S;
	if (e.mathFallbacks?.length) {
		S = /* @__PURE__ */ new Map();
		let t = [0];
		for (let n of e.runs) t.push(t[t.length - 1] + (n.type === "math" && $i.has(n.nodes) ? 1 : 0));
		for (let n of e.mathFallbacks) {
			let { start: r, end: i } = n;
			Number.isInteger(r) && Number.isInteger(i) && r >= 0 && i <= e.runs.length && i > r && e.runs[r].type === "math" && t[i] > t[r] && i >= (S.get(r)?.end ?? r) && S.set(r, n);
		}
	}
	let C = 0;
	for (let [s, g] of e.runs.entries()) {
		if (s < C) continue;
		let _ = S?.get(s);
		if (_ && (C = _.end), g.type !== "text" && (b = null), g.type === "break") {
			let s = g.fontSize == null ? t : g.fontSize * h * r * o, l = aa(g.fontFamily ?? e.defFontFamily ?? null, c), u = g.bold ?? e.defBold ?? i, f = g.italic ?? e.defItalic ?? a, p = g.fontSize != null || g.fontFamily != null || g.bold != null || g.italic != null ? {
				text: "",
				sizePx: s,
				color: n,
				font: ma(u, f, s, l, c, ""),
				underline: !1,
				strikethrough: !1,
				lineMetric: ha(l, u, f, c)
			} : void 0;
			x.set(d.length, {
				text: "",
				sizePx: s,
				color: n,
				font: ma(u, f, s, l, c, ""),
				underline: !1,
				strikethrough: !1,
				lineMetric: ha(l, u, f, c),
				markFace: {
					family: l,
					bold: u,
					italic: f
				}
			}), d.push({
				type: "break",
				style: p
			});
			continue;
		}
		if (g.type === "math") {
			let e = _ ? void 0 : Qi.get(g.nodes), i = g.fontSize == null ? t : g.fontSize * h * r * o, a = !!_ || !e && $i.has(g.nodes), s = _?.text ?? (a ? g.fallbackText : void 0);
			u && (u.font = `${i}px sans-serif`);
			let c = e ? e.widthEm * i : a ? u?.measureText(s ?? "Equation unavailable").width ?? 0 : 0, l = {
				text: "",
				font: `${i}px sans-serif`,
				sizePx: i,
				color: g.color ? $(g.color) : n,
				underline: !1,
				strikethrough: !1,
				math: {
					nodes: g.nodes,
					display: g.display,
					width: c,
					ascent: e ? e.ascentEm * i : a ? i : 0,
					descent: e ? e.descentEm * i : 0,
					fallbackText: s,
					unavailable: a
				}
			};
			d.push({
				type: "object",
				width: c,
				style: l,
				display: g.display
			});
			continue;
		}
		let v = g.fontSize == null ? t : g.fontSize * h * r * o, w = Ca(v, g.baseline ?? void 0), T = aa(g.fontFamily ?? e.defFontFamily ?? null, c), E = g.fontFamilySym ? aa(g.fontFamilySym, c) : null, D = g.bold ?? e.defBold ?? i, k = g.italic ?? e.defItalic ?? a, A = f[s] ?? "", j = g.fontFamilyEa ? [] : ki(g.fontFamily ?? e.defFontFamily ?? c.themeMinorFont ?? null, [...A].filter((e) => st(e.codePointAt(0) ?? 0)).join("")), M = g.fontFamilyEa ? aa(g.fontFamilyEa, c) : j[0], N = g.fontFamilyCs ? aa(g.fontFamilyCs, c) : null, P = p[s], F = P + A.length;
		if (b && A) {
			let e = Math.min(y(P), F);
			e > P && (b.text += A.slice(0, e - P), A = A.slice(e - P), P = e);
		}
		let I = ma(D, k, w, M, c, A, !0, j.slice(1)), L = /* @__PURE__ */ new Map(), R = (e, t, n, r = []) => {
			let i = `${e}\0${+!!n}\0${+!!fe(t)}\0${+!!m(t)}\0${r.join("\0")}`, a = L.get(i);
			if (a !== void 0) return a;
			let o = ma(D, k, w, e, c, t, n, r);
			return L.set(i, o), o;
		}, z = (e, t) => R(e, t, !0, hi), B = (g.letterSpacing ?? 0) * h * r, V = {
			text: "",
			font: "",
			sizePx: v,
			drawSizePx: w,
			color: g.color ? $(g.color) : g.hyperlink && !g.hyperlinkUsesTextFill && c.themeHlinkColor ? $(c.themeHlinkColor) : n,
			patternFill: g.hyperlink && !g.hyperlinkUsesTextFill ? void 0 : g.patternFill,
			noFill: g.noFill,
			underline: g.underline || g.hyperlink !== void 0,
			underlineStyle: g.underlineStyle,
			underlineColor: g.underlineColor ? $(g.underlineColor) : void 0,
			underlineFill: g.underlineFill,
			underlineLine: g.underlineLine,
			underlineLineNoFill: g.underlineLineNoFill,
			strikethrough: g.strikethrough,
			strikeDouble: g.strikeDouble === !0,
			letterSpacingPx: B || void 0,
			sourceRunId: s,
			lang: g.lang,
			baseline: g.baseline ?? void 0,
			shadow: g.shadow,
			reflection: g.reflection,
			outline: g.outline,
			highlight: g.highlight ? $(g.highlight) : void 0,
			hyperlink: Rr(g.hyperlink)
		}, H = "", U = "", W, G = T, ee = ha(T, D, k, c) ?? null, te = () => {
			H && d.push({
				type: "text",
				text: H,
				style: {
					...V,
					font: U,
					lineMetric: W,
					lineMetricLatin: ee,
					faceFamily: G,
					faceFamilyLatin: T
				}
			}), H = "";
		}, K = 0, ne = !1, q = "", re = l && ja.test(g.lang ?? "");
		for (; K < A.length;) {
			let t = Math.min(y(P + K + 1), F) - P, n = A.slice(K, t);
			K = t, ne = !0;
			let r = String.fromCodePoint(n.codePointAt(0) ?? 0), i = n, a = r.codePointAt(0) ?? 0, o = !st(a) && !!g.fontFamilyEa && Pi(a, g.lang), s = o || st(a), l = O(a) || Sa.test(r), u = l ? N ?? yi(r) : T, d = o ? R(M, n, !0) : s ? I : l ? z(u, n) : R(T, n, oa(g.fontFamily ?? e.defFontFamily)), f = s ? M : u, p = ha(f, D, k, c);
			if (/[\uf020-\uf0ff]/u.test(r) && (E != null || bt(T))) {
				let e = E ?? T, t = yt(r, e);
				i = t + n.slice(r.length), d = ma(D, k, w, t === r ? e : "sans-serif", c, i), p = void 0, f = t === r ? e : "sans-serif";
			}
			let m = re && (Ma(n) && Na(q) || Ma(q) && Na(n));
			H && (d !== U || p !== W || m) && te(), H += i, U = d, W = p, G = f, q = n;
		}
		if (te(), ne) {
			let e = d[d.length - 1];
			b = e?.type === "text" ? e : null;
		}
	}
	return {
		input: d,
		sameStyle: (e, t) => e.font === t.font && e.color === t.color && e.patternFill === t.patternFill && e.noFill === t.noFill && e.sizePx === t.sizePx && e.drawSizePx === t.drawSizePx && e.underline === t.underline && e.underlineStyle === t.underlineStyle && e.underlineColor === t.underlineColor && e.underlineFill === t.underlineFill && e.underlineLine === t.underlineLine && e.underlineLineNoFill === t.underlineLineNoFill && e.strikethrough === t.strikethrough && e.strikeDouble === t.strikeDouble && e.letterSpacingPx === t.letterSpacingPx && e.baseline === t.baseline && e.shadow === t.shadow && e.reflection === t.reflection && e.outline === t.outline && e.highlight === t.highlight && da(e.hyperlink) === da(t.hyperlink) && (!e.letterSpacingPx || e.sourceRunId === t.sourceRunId) && e.lineMetric === t.lineMetric && e.lineMetricLatin === t.lineMetricLatin,
		breakMarks: x
	};
}
var Aa = /^ja(?:[-_]|$)/i, ja = /^(?:en-US|ja-JP)$/i;
function Ma(e) {
	return e === "“" || e === "”";
}
function Na(e) {
	return /^\p{Script=Han}/u.test(e);
}
function Pa(e, t, n, r) {
	return Aa.test(e.lang ?? "") && Aa.test(t.lang ?? "") && (Ma(n) && Na(r) || Na(n) && Ma(r));
}
function Fa(e, t, n, r, i, a, o, s = !1, c = !1, l = 1, u, d = {
	themeMajorFont: null,
	themeMinorFont: null,
	dpr: 1
}, f = 0) {
	let { input: p, sameStyle: m, breakMarks: g } = ka(t, r, i, a, s, c, l, u, d, !0, e), _ = Z(t.marR, a), v = ln(p, {
		maxWidth: n,
		firstLineIndent: f,
		measureText(t, n) {
			return e.font = n.font, ai(e, t, n.letterSpacingPx ?? 0);
		},
		sameStyle: m,
		boundaryAdvance: (e, t) => e.sourceRunId === t.sourceRunId ? t.letterSpacingPx ?? 0 : 0,
		tabStops: (t.tabStops ?? []).map((e) => ({
			pos: Z(e.pos, a),
			algn: e.algn
		})),
		defaultTabSize: Z(t.defTabSz ?? 914400, a),
		tabStartPen: (e) => t.rtl ? _ : o + (e === 0 ? f : 0),
		nonMonotoneMeasure: p.some((e) => e.type === "text" && (e.style.letterSpacingPx ?? 0) < 0),
		eastAsianLineBreak: t.eaLnBrk !== !1,
		kinsokuAcrossRuns: Pa
	}), y = t.endRunProperties, b = y?.fontSize == null ? r : y.fontSize * h * a * l, x = aa(y?.fontFamily ?? t.defFontFamily ?? null, d), S = y?.bold ?? t.defBold ?? s, C = y?.italic ?? t.defItalic ?? c, w = y && (y.fontSize != null || y.fontFamily != null || y.bold != null || y.italic != null) ? {
		text: "",
		sizePx: b,
		color: i,
		font: ma(S, C, b, x, d, ""),
		underline: !1,
		strikethrough: !1,
		lineMetric: ha(x, S, C, d)
	} : void 0, T = y ? {
		text: "",
		sizePx: b,
		color: i,
		font: ma(S, C, b, x, d, ""),
		underline: !1,
		strikethrough: !1,
		lineMetric: ha(x, S, C, d),
		markFace: {
			family: x,
			bold: S,
			italic: C
		}
	} : void 0, E = (e, t) => {
		let n = t[t.length - 1];
		if (!n || !e.markFace || n.sizePx === e.sizePx) return {
			...e,
			text: ""
		};
		let { family: r, bold: i, italic: a } = e.markFace;
		return {
			...e,
			text: "",
			sizePx: n.sizePx,
			font: ma(i, a, n.sizePx, r, d, "")
		};
	};
	return v.map((e, t) => {
		let n = t === v.length - 1, r = [...n && e.segments.length === 0 && w ? [w] : [], ...e.segments.length === 0 && e.lineFeedRun !== void 0 && !(n && w) && p[e.lineFeedRun]?.type === "text" ? [{
			...p[e.lineFeedRun].style,
			text: ""
		}] : e.segments.map((t, n) => {
			if (t.type === "text") {
				let r = e.segments[n - 1], i = r?.type === "text" && r.style.sourceRunId === t.style.sourceRunId ? t.style.letterSpacingPx : void 0;
				return {
					...t.style,
					text: t.text,
					leadingLetterSpacingPx: i
				};
			}
			return t.type === "tab" ? {
				...t.style,
				text: "",
				isTab: !0,
				tabWidthPx: t.width
			} : {
				...t.style,
				text: ""
			};
		})], i = e.endBreakRun !== void 0 && p[e.endBreakRun]?.type === "break", a = i ? p[e.endBreakRun].style : void 0, o = i ? g.get(e.endBreakRun) : void 0, s = e.segments.length > 0, c = s ? [...o ? [E(o, r)] : [], ...n && T ? [E(T, r)] : []] : [];
		return {
			segments: [...r, ...!s && a ? [{
				...a,
				text: ""
			}] : []],
			...c.length > 0 ? { metricMarks: c } : {},
			...e.endsWithBreak ? { endsWithBreak: !0 } : {}
		};
	});
}
var Ia = { paint: () => {} };
async function La(e, t, n, i, a, o, s, c) {
	if (e && e.fillType === "image") {
		let l = (e) => {
			e.fillStyle = "#FFFFFF", e.fillRect(0, 0, t, n);
		};
		if (!e.imagePath || !e.mimeType || !a) return { paint: l };
		let u = (e) => It(e, "tiff") ? { paint: (e) => {
			l(e), Mt(e, "tiff", {
				x: 0,
				y: 0,
				width: t,
				height: n
			});
		} } : e instanceof J || Li(e) || kt(e) || Bt(e) ? {
			paint: l,
			failure: { error: e }
		} : { paint: l }, d, f;
		try {
			let l = c && !Q(e) ? Bi(c, zi(e.imagePath, Q(e))) : void 0;
			f = e.tile ? await Ii(e, Ye(e.imagePath, e.mimeType, a)) : void 0, d = await Ze(e.imagePath, e.mimeType, Q(e.tile ? {
				...e,
				dpi: void 0
			} : e), a, {
				...e.blipEffects?.length && !e.tile ? ((e) => ({
					widthPt: e.width,
					heightPt: e.height
				}))(r(t / i / h, n / i / h, e.srcRect, e.fillRect)) : Ri(e, t / i / h, n / i / h),
				...l ?? {},
				tiff: o,
				svgDecoder: s
			});
		} catch (e) {
			return u(e);
		}
		if (!d) return { paint: l };
		let p = d;
		return { paint: (r) => {
			l(r);
			try {
				let a = e.fillRect ?? {}, o = a.l ?? 0, s = a.t ?? 0, c = a.r ?? 0, l = a.b ?? 0, u = o * t, d = s * n, m = t * (1 - o - c), h = n * (1 - s - l);
				r.save();
				try {
					r.beginPath(), r.rect(0, 0, t, n), r.clip(), e.alpha != null && (r.globalAlpha = e.alpha), e.tile ? Ba(r, p, e.tile, t, n, i, e.srcRect, f?.dimensions ?? void 0) : he(r, p, e.srcRect, u, d, m, h);
				} finally {
					r.restore();
				}
			} catch (i) {
				if (It(i, "tiff")) {
					Mt(r, "tiff", {
						x: 0,
						y: 0,
						width: t,
						height: n
					});
					return;
				}
				if (i instanceof J || Li(i) || kt(i) || Bt(i)) throw i;
				if (e.blipEffects?.length) throw Pt(i);
			}
		} };
	}
	return { paint: (r) => {
		r.fillStyle = Ji(e, r, 0, 0, t, n, 0, i * 12700) ?? "#FFFFFF", r.fillRect(0, 0, t, n);
	} };
}
function Ra(e, t, n, r, i) {
	let a;
	a = e === "t" || e === "ctr" || e === "b" ? (t - r) / 2 : e === "tr" || e === "r" || e === "br" ? t - r : 0;
	let o;
	return o = e === "l" || e === "ctr" || e === "r" ? (n - i) / 2 : e === "bl" || e === "b" || e === "br" ? n - i : 0, {
		ax: a,
		ay: o
	};
}
function za(e, t, n) {
	return {
		width: e * (n ? 1 - n.l - n.r : 1),
		height: t * (n ? 1 - n.t - n.b : 1)
	};
}
function Ba(e, n, r, a, o, s, c, l, u = 96, f = {
	x: 0,
	y: 0,
	w: a,
	h: o
}) {
	let p = E(n), m = za(l?.width ?? p?.width ?? n.width, l?.height ?? p?.height ?? n.height, c), h = i * 96 / u, g = m.width * h * (r.sx ?? 1) * s, _ = m.height * h * (r.sy ?? 1) * s;
	if (![g, _].every((e) => Number.isFinite(e) && e > 0)) throw new t("unsupported-image-effect", "Unrepresentable picture tile size");
	let v = r.flip === "x" || r.flip === "xy", y = r.flip === "y" || r.flip === "xy", b = g * (v ? 2 : 1), x = _ * (y ? 2 : 1);
	if (!Number.isFinite(b) || !Number.isFinite(x)) throw new t("unsupported-image-effect", "Unrepresentable picture tile cell");
	let S = Math.max(1, Math.ceil(b)), C = Math.max(1, Math.ceil(x)), w = S > 32767 || C > 32767 || S > Math.floor(16777216 / C);
	if (w && (S = Math.min(d, Math.max(1, Math.ceil(Math.min(b, m.width * (v ? 2 : 1))))), C = Math.min(d, Math.max(1, Math.ceil(Math.min(x, m.height * (y ? 2 : 1))))), S * C > 16777216)) {
		let e = Math.sqrt(oe / (S * C));
		S = Math.max(1, Math.floor(S * e)), C = Math.max(1, Math.floor(C * e));
	}
	let T = w ? S / b : 1, D = w ? C / x : 1, O = te(S, C);
	if (!O) throw new t("unsupported-image-effect", "Picture tile surface unavailable");
	let k = O.getContext("2d");
	if (!k) throw new t("unsupported-image-effect", "Picture tile surface unavailable");
	k.scale(T, D);
	let A = (e, t, r, i) => {
		k.save(), k.translate(e + (r ? g : 0), t + (i ? _ : 0)), k.scale(r ? -1 : 1, i ? -1 : 1), he(k, n, c, 0, 0, g, _), k.restore();
	}, j = q(n, c != null), M = Math.ceil(j.x / (v ? 2 : 1)), N = Math.ceil(j.y / (y ? 2 : 1)), P = (2 * M + 1) * (2 * N + 1) * (v ? 2 : 1) * (y ? 2 : 1);
	if (!Number.isSafeInteger(P) || P > At * At) throw O.width = 0, new jt("image-effect-work", At * At, Number.isSafeInteger(P) ? P : 2 ** 53 - 1);
	let F = P > (v ? 2 : 1) * (y ? 2 : 1) ? P * S * C : 0;
	if (!Number.isSafeInteger(F) || F > 134217728) throw O.width = 0, new jt("image-effect-work", Ot, Number.isSafeInteger(F) ? F : 2 ** 53 - 1);
	for (let e = -N; e <= N; e++) for (let t = -M; t <= M; t++) {
		let n = t * b, r = e * x;
		A(n, r, !1, !1), v && A(n + g, r, !0, !1), y && A(n, r + _, !1, !0), v && y && A(n + g, r + _, !0, !0);
	}
	let I = e.createPattern(O, "repeat");
	if (!I) throw new t("unsupported-image-effect", "Picture tile surface unavailable");
	let { ax: L, ay: R } = Ra(r.algn ?? "tl", a, o, g, _), z = L + Z(r.tx ?? 0, s), B = R + Z(r.ty ?? 0, s);
	if (![z, B].every(Number.isFinite)) throw new t("unsupported-image-effect", "Unrepresentable picture tile phase");
	return typeof I.setTransform == "function" && typeof DOMMatrix < "u" ? (I.setTransform(new DOMMatrix().translateSelf(z, B).scaleSelf(1 / T, 1 / D)), e.fillStyle = I, e.fillRect(f.x, f.y, f.w, f.h)) : (e.save(), e.translate(z, B), e.scale(1 / T, 1 / D), e.fillStyle = I, e.fillRect((f.x - z) * T, (f.y - B) * D, f.w * T, f.h * D), e.restore()), !0;
}
function Va(e, t, n, i = {}) {
	return JSON.stringify([
		e.svgImagePath ?? null,
		zi(e.imagePath, Q(e, i)),
		...e.blipEffects?.length ? ((e) => [e.width, e.height])(e.tile ? {
			width: t,
			height: n
		} : r(t, n, e.srcRect, e.fillRect)) : []
	]);
}
function Ha(e) {
	return e.tile != null != (e.stretch === !0);
}
function Ua(e, n, r, i, a, o = !1, s = {
	rotation: 0,
	flipH: !1,
	flipV: !1
}) {
	if (![
		i.x,
		i.y,
		i.w,
		i.h,
		a
	].every(Number.isFinite) || i.w < 0 || i.h < 0) throw new t("unsupported-image-effect", "Invalid image fill geometry");
	if (!r || !(i.w > 0) || !(i.h > 0) || !Ha(n)) return !1;
	let { x: c, y: l, w: u, h: d } = i;
	e.save();
	try {
		e.clip(o ? "evenodd" : "nonzero"), n.alpha != null && (e.globalAlpha *= Math.max(0, Math.min(1, n.alpha)));
		let i = 0;
		if (n.rotWithShape === !1 && s.rotation !== 0) {
			let t = s.flipH === s.flipV ? -1 : 1;
			e.translate(c + u / 2, l + d / 2), i = t * s.rotation * Math.PI / 180, e.rotate(i), e.translate(-(c + u / 2), -(l + d / 2));
		}
		if (n.tile) {
			let t = Math.abs(Math.cos(i)), o = Math.abs(Math.sin(i)), s = u * t + d * o, f = u * o + d * t;
			e.translate(c, l);
			try {
				return Ba(e, r.image, n.tile, u, d, a, n.srcRect, r.intrinsicSize, n.dpi && n.dpi > 0 ? n.dpi : 96, {
					x: (u - s) / 2,
					y: (d - f) / 2,
					w: s,
					h: f
				});
			} catch (e) {
				throw n.blipEffects?.length ? Pt(e) : e;
			}
		}
		let f = n.fillRect ?? {}, p = c + (f.l ?? 0) * u, m = l + (f.t ?? 0) * d, h = (1 - (f.l ?? 0) - (f.r ?? 0)) * u, g = (1 - (f.t ?? 0) - (f.b ?? 0)) * d;
		if (![
			p,
			m,
			h,
			g
		].every(Number.isFinite)) throw new t("unsupported-image-effect", "Unrepresentable image fill rectangle");
		return !(h > 0) || !(g > 0) ? !1 : (he(e, r.image, n.srcRect, p, m, h, g), !0);
	} finally {
		e.restore();
	}
}
function Wa(e, t, n) {
	if (!t) return;
	let r = t.dir * Math.PI / 180, i = Z(t.dist, n);
	e.shadowColor = $(t.color, t.alpha), e.shadowBlur = 0, e.shadowOffsetX = Math.cos(r) * i, e.shadowOffsetY = Math.sin(r) * i;
}
function Ga(e, t, n) {
	t && (e.shadowColor = $(t.color, t.alpha), e.shadowBlur = Z(t.radius, n), e.shadowOffsetX = 0, e.shadowOffsetY = 0);
}
function Ka(e) {
	e.shadowColor = "transparent", e.shadowBlur = 0, e.shadowOffsetX = 0, e.shadowOffsetY = 0;
}
var qa = 8, Ja = 1, Ya = 1, Xa = 256;
function Za(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g = 0) {
	if (r <= 0) return;
	let _ = e.measureText(t), v = _.actualBoundingBoxAscent > 0 ? _.actualBoundingBoxAscent : r, y = _.actualBoundingBoxDescent > 0 ? _.actualBoundingBoxDescent : r * .25, b = _.actualBoundingBoxLeft > 0 ? _.actualBoundingBoxLeft : 0, x = _.actualBoundingBoxRight > 0 ? _.actualBoundingBoxRight : r, S = r * l * i, C = Math.min(Xa, Math.max(1, Math.round(S / qa))), w = (e) => eo(e, a, r, o, s, c, u, d), T = w(C), E = no(T, a, o, s, c, u, d, l, i, -v, y);
	for (; E > Ya && C < Xa;) {
		let e = Math.min(Xa, C * 2), t = w(e), n = no(t, a, o, s, c, u, d, l, i, -v, y);
		if (n >= E * .75) {
			T = t;
			break;
		}
		C = e, T = t, E = n;
	}
	let D = 1e4, O = Ja / (l * i), k = T.length - 1, A = (e, t, n) => e === 0 ? -1e4 : t - n - O, j = (e, t, n) => e === k ? D : t - n + O, M = (e, r) => {
		g > 0 ? (e.strokeStyle = r, e.lineWidth = g, e.lineJoin = "round") : e.fillStyle = r;
		for (let r = 0; r <= k; r++) {
			let { s0: i, s1: a, g: o } = T[r], s = (i + a) / 2;
			e.save(), e.translate(f + o.x, p + o.y), e.rotate(o.angle), o.shear !== 0 && e.transform(1, 0, o.shear, 1, 0, 0), (l !== 1 || o.vScale !== 1) && e.scale(l, o.vScale), e.beginPath();
			let c = A(r, i, s), u = j(r, a, s);
			e.rect(c, -1e4, u - c, 2 * D), e.clip(), g > 0 ? e.strokeText(t, -s + n / 2, 0) : e.fillText(t, -s + n / 2, 0), e.restore();
		}
	}, N = typeof m == "string" ? Qa(m) : 1, P = typeof e.globalAlpha == "number" ? e.globalAlpha : 1;
	if (typeof m == "string" && N >= 1 && P >= 1) {
		M(e, m);
		return;
	}
	if (N <= 0 || P <= 0) return;
	let F = typeof e.getTransform == "function" ? e.getTransform() : null;
	if (!F) {
		M(e, m);
		return;
	}
	let I = Infinity, L = Infinity, R = -Infinity, z = -Infinity;
	for (let e = 0; e <= k; e++) {
		let { s0: t, s1: r, g: i } = T[e], a = (t + r) / 2, o = -a + n / 2, s = Math.max(A(e, t, a), o - b), c = Math.min(j(e, r, a), o + x);
		if (!(c <= s)) for (let [e, t] of [
			[s, -v],
			[c, -v],
			[s, y],
			[c, y]
		]) {
			let n = to(i, l, e, t), r = f + n.x, a = p + n.y, o = F.a * r + F.c * a + F.e, s = F.b * r + F.d * a + F.f;
			o < I && (I = o), o > R && (R = o), s < L && (L = s), s > z && (z = s);
		}
	}
	if (!(R > I && z > L)) return;
	let B = 2 + g * i, V = Math.floor(I - B), H = Math.floor(L - B), W = Math.ceil(R + B) - V, G = Math.ceil(z + B) - H, ee = te(W, G), K = ee ? ee.getContext("2d") : null;
	if (!ee || !K) {
		M(e, m);
		return;
	}
	K.font = e.font, K.textAlign = "left", K.textBaseline = "alphabetic", K.setTransform(F.a, F.b, F.c, F.d, F.e - V, F.f - H), typeof m == "string" ? M(K, $a(m)) : (M(K, "#fff"), K.save(), K.setTransform(1, 0, 0, 1, 0, 0), K.globalCompositeOperation = "source-in", U(e, K, () => {
		K.fillStyle = h?.(K) ?? m, K.fillRect(0, 0, W, G);
	}, {
		x: V,
		y: H
	}), K.restore()), e.save(), e.setTransform(1, 0, 0, 1, 0, 0), e.globalAlpha = P * N, e.drawImage(ee, V, H), e.restore();
}
function Qa(e) {
	let t = /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/i.exec(e);
	if (!t) return 1;
	let n = parseFloat(t[1]);
	return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 1;
}
function $a(e) {
	let t = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(e);
	return t ? `rgb(${t[1]}, ${t[2]}, ${t[3]})` : e;
}
function eo(e, t, n, r, i, a, o, s) {
	let c = Array(e);
	for (let l = 0; l < e; l++) {
		let u = l / e * n, d = (l + 1) / e * n;
		c[l] = {
			s0: u,
			s1: d,
			g: Et(t, (r + (u + d) / 2) / i * a, o, s)
		};
	}
	return c;
}
function to(e, t, n, r) {
	let i = n * t, a = r * e.vScale, o = i + e.shear * a, s = Math.cos(e.angle), c = Math.sin(e.angle);
	return {
		x: e.x + s * o - c * a,
		y: e.y + c * o + s * a
	};
}
function no(e, t, n, r, i, a, o, s, c, l, u) {
	let d = 0;
	for (let f of e) {
		let e = (f.s0 + f.s1) / 2;
		for (let p of [f.s0, f.s1]) {
			let m = Et(t, (n + p) / r * i, a, o);
			for (let t of [l, u]) {
				let n = to(m, s, 0, t), r = to(f.g, s, p - e, t), i = Math.hypot(r.x - n.x, r.y - n.y) * c;
				i > d && (d = i);
			}
		}
	}
	return d;
}
function ro(e, t, n, r, i, a, o, s, c, l, u) {
	let d = i, f = a, p = Math.max(1, o), m = Math.max(1, s), _ = xt(n, r, p, m);
	if (!_) return;
	let v = t.defaultBold ?? !1, y = t.defaultItalic ?? !1, b = (t.defaultFontSize ?? 18) * h * c, x = [], S = 0;
	for (let n of t.paragraphs) {
		let t = n.defFontSize == null ? b : n.defFontSize * h * c, r = Fa(e, n, Infinity, t, n.defColor ? $(n.defColor) : l, c, 0, v, y, 1, void 0, u, 0);
		x.length > 0 && (S += (n.spaceBefore ?? 0) / 100 * h * c);
		for (let e of r) {
			let r = e.segments.reduce((e, t) => Math.max(e, t.sizePx), 0) || t, i = n.spaceLine?.type === "pts" ? n.spaceLine.val * h * c : r * 1.2 * (n.spaceLine ? n.spaceLine.val / 1e5 : 1);
			x.push({
				line: e,
				alignment: n.alignment,
				baseline: S + i * .8
			}), S += i;
		}
		S += (n.spaceAfter ?? 0) / 100 * h * c;
	}
	if (x.length === 0) return;
	e.save(), e.textAlign = "left", e.textBaseline = "alphabetic";
	let C = -1, w = () => {
		if (C >= 0) return C;
		let t = typeof e.getTransform == "function" ? e.getTransform() : null, n = t ? Math.abs(t.a * t.d - t.b * t.c) : 1;
		return C = n > 0 ? Math.sqrt(n) : 1, C;
	}, T = x.length, E = _.top[0], D = _.top[1], O = E && D ? (E.x - p / 2) * (D.y - m / 2) - (E.y - m / 2) * (D.x - p / 2) > 0 : !0, k = x[O ? T - 1 : 0].baseline;
	for (let t = 0; t < T; t++) {
		let { line: i, alignment: a } = x[t], o = t / T, s = (t + 1) / T, l = 0, u = 0, v = 0, y = 0;
		for (let t of i.segments) {
			if (t.math) {
				l += t.math.width, u = Math.max(u, t.sizePx), v = Math.max(v, t.math.ascent), y = Math.max(y, t.math.descent);
				continue;
			}
			e.font = t.font;
			let n = t.letterSpacingPx ?? 0, r = e.measureText(t.text);
			l += r.width + n * Ta(t.text), u = Math.max(u, t.sizePx), r.actualBoundingBoxAscent > 0 && (v = Math.max(v, r.actualBoundingBoxAscent)), r.actualBoundingBoxDescent > 0 && (y = Math.max(y, r.actualBoundingBoxDescent));
		}
		if (l <= 0) continue;
		let b = _.singleEdge ? Math.max(0, O ? k - x[t].baseline : x[t].baseline - k) : 0, S = b > 0 ? xt(n, r, p + 2 * b, m + 2 * b) ?? _ : _, C = v + y > 0 ? v + y : u, E = _.singleEdge ? .8 : C > 0 ? v / C : .8, D = _.singleEdge ? 1 : p / l, A = _.singleEdge ? C : C / (s - o), j = wt(S, l), M = _.singleEdge ? (1 - j) * (a === "r" ? 1 : a === "ctr" ? .5 : 0) : 0, N = 0;
		for (let t of i.segments) {
			let n = N, r = _.singleEdge ? E : o + E * (s - o);
			if (t.math) {
				N += t.math.width;
				continue;
			}
			e.font = t.font;
			let i = ia(e, t, d, f, c);
			e.fillStyle = i;
			let a = t.outline && t.outline.width > 0 ? t.outline : void 0, u = a?.fill, v = a ? u ? re(u, e, d, f, p, m, 0, c * h) : a.color ? `#${a.color}` : t.noFill ? void 0 : i : void 0, y = a ? Math.max(.5, Z(a.width, c)) : 0, x = t.letterSpacingPx ?? 0, C = [...t.text];
			for (let n of C) {
				let r = e.measureText(n).width + x;
				if (t.noFill && !v) {
					N += r;
					continue;
				}
				let h = _.singleEdge ? E : o + E * (s - o);
				if (!_.singleEdge && r > 0) {
					t.noFill || Za(e, n, x, r, w(), _, N, l, j, D, A, h, d, f, i, t.patternFill ? (e) => ia(e, t, d, f, c) : void 0), v && a && Za(e, n, x, r, w(), _, N, l, j, D, A, h, d, f, v, u ? (e) => re(u, e, d, f, p, m, 0, c * 12700) ?? "rgba(0,0,0,0)" : void 0, y), N += r;
					continue;
				}
				let g = Et(S, M + (N + r / 2) / l * j, A, h);
				g.x -= b, g.y -= b, e.save(), e.translate(d + g.x, f + g.y), e.rotate(g.angle), g.shear !== 0 && e.transform(1, 0, g.shear, 1, 0, 0), (D !== 1 || g.vScale !== 1) && e.scale(D, g.vScale), t.noFill || e.fillText(n, -r / 2 + x / 2, 0), v && (e.strokeStyle = v, e.lineWidth = y, e.lineJoin = "round", e.strokeText(n, -r / 2 + x / 2, 0)), e.restore(), N += r;
			}
			if (t.underline && !t.underlineLineNoFill && N > n && (!t.noFill || t.underlineFill || t.underlineColor || t.underlineLine?.fill)) {
				let a = t.underlineFill ? re(t.underlineFill, e, d, f, p, m, 0, c * h) : t.underlineLine?.fill ? re(t.underlineLine.fill, e, d, f, p, m, 0, c * h) : t.underlineColor ?? i;
				if (a) {
					e.save(), e.strokeStyle = a, e.lineWidth = t.underlineLine?.width ? Z(t.underlineLine.width, c) : Math.max(1, t.sizePx * g), e.beginPath();
					let i = Math.max(2, Math.ceil((N - n) / 8));
					for (let t = 0; t <= i; t++) {
						let a = Et(S, M + (n + (N - n) * t / i) / l * j, A, r), o = Math.max(2, e.lineWidth) * a.vScale, s = d + a.x - b - Math.sin(a.angle) * o, c = f + a.y + Math.cos(a.angle) * o;
						t === 0 ? e.moveTo(s, c) : e.lineTo(s, c);
					}
					e.stroke(), e.restore();
				}
			}
		}
	}
	e.restore();
}
function io(e, t, n, r, i, a, o) {
	let s = Math.min(r, i);
	switch (e) {
		case "rightarrow":
		case "leftarrow": {
			let c = Math.min(Math.max(a ?? 5e4, 0), 1e5), l = s * Math.min(Math.max(o ?? 5e4, 0), 1e5) / 1e5, u = i * c / 2e5, d = n + i / 2 - u, f = 2 * u, p = Math.max(0, r - l);
			return e === "rightarrow" ? {
				tx: t,
				ty: d,
				tw: p,
				th: f
			} : {
				tx: t + l,
				ty: d,
				tw: p,
				th: f
			};
		}
		case "roundrect": {
			let e = s * Math.min(Math.max(a ?? 16667, 0), 1e5) / 1e5 * (1 - 1 / Math.SQRT2);
			return {
				tx: t + e,
				ty: n + e,
				tw: Math.max(0, r - 2 * e),
				th: Math.max(0, i - 2 * e)
			};
		}
		default: return null;
	}
}
function ao(e, t) {
	return e.defaultTextColor ? $(e.defaultTextColor) : t.smartArtFallbackTextColor != null && Xr(e) ? t.smartArtFallbackTextColor : null;
}
function oo(e, t, n) {
	return {
		outerRotation: e,
		localFlipH: t,
		localFlipV: n
	};
}
function so(e, t, n, r, i) {
	let a = [
		{
			x: t,
			y: n
		},
		{
			x: t + r,
			y: n
		},
		{
			x: t,
			y: n + i
		},
		{
			x: t + r,
			y: n + i
		}
	].map((t) => ({
		x: e.a * t.x + e.c * t.y + e.e,
		y: e.b * t.x + e.d * t.y + e.f
	})), o = Math.min(...a.map((e) => e.x)), s = Math.min(...a.map((e) => e.y)), c = Math.max(...a.map((e) => e.x)), l = Math.max(...a.map((e) => e.y));
	return {
		x: o,
		y: s,
		w: c - o,
		h: l - s
	};
}
var co = {
	tl: [0, 0],
	t: [.5, 0],
	tr: [1, 0],
	l: [0, .5],
	ctr: [.5, .5],
	r: [1, .5],
	bl: [0, 1],
	b: [.5, 1],
	br: [1, 1]
};
function lo(e, t, n) {
	return [e.a * t + e.c * n + e.e, e.b * t + e.d * n + e.f];
}
function uo(e, t, n, r, i, a) {
	let [o, s] = l(co, a ?? "b") ?? co.b;
	return lo(e, t + o * r, n + s * i);
}
function fo(e, t, n, r = 0, i = 0, a = 1) {
	r > (e.sceneDepth ?? 0) && (e = {
		...e,
		sceneDepth: r
	});
	let o = Tn(e, t, n), [s, c, , l] = o.corners, u = (c.x - s.x) * (l.y - s.y) - (c.y - s.y) * (l.x - s.x) < 0, d = u && r > 0 ? Tn(e, t, n, r) : o, f = Math.max(0, Math.ceil(i * a)), p = f > 0 ? Ht(d.corners, f / a / t, f / a / n) : null;
	return p || (f = 0), {
		face: d.corners,
		corners: p ?? d.corners,
		backFacing: u,
		padDev: f,
		padCss: f / a
	};
}
function po(e, t, n, r, i, a, o, s, c = 0) {
	let u = Math.abs(t.a * t.d - t.b * t.c), { face: d, corners: f } = fo(e, i, a, c, o, u > 0 ? Math.sqrt(u) : 1), p = f.map((e) => lo(t, n + e.x, r + e.y)), m = p.map(([e]) => e), h = p.map(([, e]) => e), g = Math.min(...m), _ = Math.min(...h), v = Math.max(...m), y = Math.max(...h), [b, x] = l(co, s ?? "b") ?? co.b, S = Vt(d, b, x);
	return {
		bbox: {
			x: g,
			y: _,
			w: v - g,
			h: y - _
		},
		anchor: S ? lo(t, n + S.x, r + S.y) : uo(t, n, r, i, a, s)
	};
}
function mo(e, t, n, r, i) {
	let a = Math.floor(n.x) - 1, o = Math.floor(n.y) - 1, s = Math.max(1, Math.ceil(n.x + n.w) - a + 1), c = Math.max(1, Math.ceil(n.y + n.h) - o + 1);
	if (r && (a + s <= 0 || o + c <= 0 || a >= r.w || o >= r.h) || C(s, c).clamped) return e;
	let l = null;
	try {
		l = te(s, c);
	} catch {
		return e;
	}
	let u = l?.getContext("2d");
	if (!l || !u) return e;
	u.setTransform(t.a, t.b, t.c, t.d, t.e - a, t.f - o), i ? U(i, u, () => e(u), {
		x: a,
		y: o
	}) : e(u);
	let d = {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		e: 0,
		f: 0
	};
	return (e) => {
		e.save(), e.setTransform(d), e.drawImage(l, a, o), e.restore();
	};
}
function ho(e, t, n, r, i, a, o, l, u, d = !0, p = !1) {
	let m = e.canvas.width || 0, h = e.canvas.height || 0, g = m > 0 && h > 0, _ = {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		e: 0,
		f: 0
	}, v = (e) => e.setTransform(u), x = (t) => {
		v(t), U(e, t, () => n(t));
	}, C = (t) => {
		v(t), U(e, t, () => r(t));
	}, w = p && g && (t.softEdge || t.innerShadow) ? s(C, f(i, t, l, m, h)) : null, T = !p || !!w, E = !1;
	t.shadow && g ? (e.save(), e.setTransform(_), E = !c(e, x, i, t.shadow, l, m, h, Math.atan2(u.b, u.a) * 180 / Math.PI, a), e.restore()) : t.shadow && (E = !0), t.reflection && g && (e.save(), e.setTransform(_), y(e, x, i, t.reflection, l, m, h), e.restore()), E ? Wa(e, t.shadow ?? null, o) : t.glow && Ga(e, t.glow, o), t.softEdge && g && T ? (e.save(), e.setTransform(_), S(e, x, i, t.softEdge, l, m, h, w ?? C), e.restore()) : n(e), (E || t.glow) && Ka(e), t.innerShadow && d && g && T && (e.save(), e.setTransform(_), b(e, w ?? C, i, t.innerShadow, l, m, h), e.restore());
}
function go(e, t, n) {
	if (t === n || !Number.isFinite(e)) return e;
	let r = ((e + 180) % 360 + 360) % 360 - 180;
	return r > 90 ? r -= 180 : r < -90 && (r += 180), Object.is(r, -0) ? 0 : r;
}
function _o(e, t, n, r) {
	return e === "wordArtVert" || e === "wordArtVertRtl" ? t + (r ? 180 : 0) : go(t, n, r);
}
function vo(e, t, n, r = "#000000", i, a = {
	themeMajorFont: null,
	themeMinorFont: null,
	dpr: 1
}, o, s) {
	A(t.stroke?.fill) && (e = ae(e));
	let c = Z(t.x, n), l = Z(t.y, n), u = Z(t.width, n), d = Z(t.height, n), f = o && t.id !== void 0 ? (e) => o({
		...e,
		shapeId: t.id
	}) : o;
	if (d === 0 && t.textBody?.verticalAnchor === "b") {
		if (t.stroke && (e.save(), e.beginPath(), e.moveTo(c, l), e.lineTo(c + u, l), Vo(e, t.stroke, n, {
			x: c,
			y: l,
			w: u,
			h: 1
		}, t.rotation), e.stroke(), e.restore()), t.textBody) {
			let o = ao(t, a);
			Eo(e, t.textBody, c, l, u, d, n, o, t.rotation, t.flipH, t.flipV, r, i, a, f, !1, s);
		}
		return;
	}
	let p = t.scene3d && {
		...t.scene3d.camera,
		unitsPerInch: 914400 * n,
		sceneDepth: (t.sp3d?.extrusionH ?? 0) * n
	}, m = p && En(p, u, d, (t.sp3d?.extrusionH ?? 0) * n) ? {
		...t.scene3d,
		camera: p
	} : null;
	if (m && u > 0 && d > 0) {
		let o = e.getTransform(), s = Math.abs(o.a * o.d - o.b * o.c), f = s > 0 ? Math.sqrt(s) : 1, p = Do(t.sp3d, t.scene3d?.lightRig, t.sp3d?.prstMaterial, n, f, m.camera), h = (p.find((e) => e.bottom)?.depthPx ?? 0) / f, g = Oo(t.sp3d, m.camera, u, d, n, f), _ = oo(t.rotation, t.flipH, t.flipV);
		e.save(), _.outerRotation !== 0 && (e.translate(c + u / 2, l + d / 2), e.rotate(_.outerRotation * Math.PI / 180), e.translate(-(c + u / 2), -(l + d / 2)));
		let v = {
			...t,
			x: 0,
			y: 0,
			rotation: 0,
			flipH: _.localFlipH,
			flipV: _.localFlipV,
			scene3d: void 0,
			sp3d: void 0,
			shadow: null,
			innerShadow: void 0,
			glow: void 0,
			softEdge: void 0,
			reflection: void 0
		}, y = {
			...v,
			textBody: null
		}, b = {
			...v,
			fill: null,
			stroke: null
		}, x = (t.stroke ? t.stroke.width * n / 2 : 0) + (t.sp3d?.contourW ? t.sp3d.contourW * n : 0) + (g ? Math.hypot(g.offsetX, g.offsetY) / f : 0) + 2, S = t.textBody?.paragraphs.some((e) => e.runs.some((e) => e.type === "text" && (e.patternFill?.fillType === "pattern" || e.outline?.fill?.fillType === "pattern" || e.underlineFill?.fillType === "pattern"))) ?? !1, C = (e, t, o, s = !1) => Ao(e, m.camera, c, l, u, d, (e) => {
			vo(e, t, n, r, i, a, void 0);
		}, o ? {
			bevels: p,
			backDepthCss: h,
			extrusion: g ?? void 0,
			edgePadCss: x,
			preservePatternFrame: s
		} : {
			preservePatternFrame: s,
			measureOverflow: !0
		}), w = (e) => C(e, y, !0), T = (e) => {
			!t.textBody || C(e, b, !1, S) || (e.save(), e.translate(c, l), vo(e, b, n, r, i, a), e.restore());
		};
		if (t.shadow || t.innerShadow || t.glow || t.softEdge || t.reflection) {
			let r = e.getTransform(), i = Math.abs(r.a * r.d - r.b * r.c), a = i > 0 ? Math.sqrt(i) : 1, o = po(m.camera, r, c, l, u, d, x, t.shadow?.algn, h), s = !1, f = mo((e) => {
				s = w(e) || s;
			}, r, o.bbox, {
				w: e.canvas.width || 0,
				h: e.canvas.height || 0
			}, e);
			if (ho(e, t, f, f, o.bbox, o.anchor, n, n * a, r, !!t.fill, !0), s) {
				T(e), e.restore();
				return;
			}
		} else if (p.length > 0 ? w(e) : C(e, v, !0, S && t.fill?.fillType !== "pattern")) {
			p.length > 0 && T(e), e.restore();
			return;
		}
		e.restore();
	}
	e.save(), (t.rotation !== 0 || t.flipH || t.flipV) && (e.translate(c + u / 2, l + d / 2), e.rotate(t.rotation * Math.PI / 180), t.flipH && e.scale(-1, 1), t.flipV && e.scale(1, -1), e.translate(-(c + u / 2), -(l + d / 2)));
	let g = t.geometry.toLowerCase(), _ = (e, n, r, i, a) => {
		t.custGeom ? yo(e, t.custGeomPaint?.length === t.custGeom.length ? t.custGeom.filter((e, n) => t.custGeomPaint?.[n].fill !== "none") : t.custGeom, n, r, i, a) : Ae(e, g, n, r, i, a, [
			t.adj,
			t.adj2,
			t.adj3,
			t.adj4,
			t.adj5,
			t.adj6,
			t.adj7,
			t.adj8
		]) || Oe(e, g, n, r, i, a, t.adj, t.adj2, t.adj3, t.adj4);
	}, v = Ji(t.fill, e, c, l, u, d, t.rotation, n * h, _), y = t.fill?.fillType === "image" && Ha(t.fill) ? t.fill : null, b = y ? a.shapeFillImages?.get(Va(y, t.width, t.height, t)) : void 0, x = !!(y && b);
	t.shadow || Ga(e, t.glow ?? null, n);
	let S = new Set([
		"line",
		"straightconnector1",
		"bentconnector2",
		"bentconnector3",
		"bentconnector4",
		"bentconnector5",
		"curvedconnector2",
		"curvedconnector3",
		"curvedconnector4",
		"curvedconnector5"
	]), C = new Set([
		"callout1",
		"callout2",
		"callout3",
		"bordercallout1",
		"bordercallout2",
		"bordercallout3",
		"accentcallout1",
		"accentcallout2",
		"accentcallout3",
		"accentbordercallout1",
		"accentbordercallout2",
		"accentbordercallout3"
	]), w = (e) => C.has(e) || e === "line" || e === "straightconnector1" || e.startsWith("bentconnector"), T = t.stroke?.headEnd ? ve(t.stroke.headEnd, t.stroke, n, h) : 0, E = t.stroke?.tailEnd ? ve(t.stroke.tailEnd, t.stroke, n, h) : 0, D = g.startsWith("curvedconnector") && (T > 0 || E > 0), O = t.custGeom && t.custGeom.length > 0 && (T > 0 || E > 0) ? Te(t.custGeom) : null, k = O?.start ? T : 0, j = O?.end ? E : 0, M = !t.custGeom && Ee(g), N = (r, i, a = {
		x: c,
		y: l,
		w: u,
		h: d
	}) => {
		A(t.stroke?.fill) && (r = ae(r));
		let { x: o, y: s, w: f, h: p } = a, m = i ?? (r === e && o === c && s === l && f === u && p === d ? v : Ji(t.fill, r, o, s, f, p, t.rotation, n * 12700, _)), h = i ? null : t.stroke ? () => {
			Vo(r, t.stroke, n, {
				x: o,
				y: s,
				w: f,
				h: p
			}, t.rotation), r.stroke();
		} : null, x = () => Ka(r), S = g === "donut" || g === "smileyface" || g === "frame", C = y && !i ? (e) => Ua(e, y, b, {
			x: o,
			y: s,
			w: f,
			h: p
		}, n, S, t) : void 0;
		if (M && !i) {
			let e = w(g) || D;
			ye(r, g, o, s, f, p, [
				t.adj,
				t.adj2,
				t.adj3,
				t.adj4,
				t.adj5,
				t.adj6,
				t.adj7,
				t.adj8
			], m, h, x, e || C ? {
				...e ? { skipTrailingStroke: !0 } : {},
				paintFill: C
			} : void 0);
			return;
		}
		let T = t.custGeom && t.custGeomPaint?.length === t.custGeom.length ? t.custGeomPaint : null;
		if (t.custGeom && T) {
			let e = !1;
			t.custGeom.forEach((n, a) => {
				let c = T[a], l = c.fill !== "none";
				if (!(i && !l)) {
					if (r.beginPath(), yo(r, [n], o, s, f, p), l) {
						let t = !1;
						if (C) {
							r.save();
							try {
								t = C(r);
							} finally {
								r.restore();
							}
						} else m && (r.fillStyle = m, r.fill(), t = !0);
						let n = t && !i ? Me(c.fill) : null;
						n && (r.save(), r.fillStyle = n, r.fill(), r.restore()), t && !i && !e && (x(), e = !0);
					}
					if (c.stroke && h) {
						let e = a === 0 ? k : 0, i = a === t.custGeom.length - 1 ? j : 0;
						(e > 0 || i > 0) && (r.beginPath(), ke(r, (e) => yo(e, [n], o, s, f, p), e, i)), h();
					}
				}
			});
			return;
		}
		r.beginPath(), t.custGeom && t.custGeom.length > 0 ? yo(r, t.custGeom, o, s, f, p) : Oe(r, g, o, s, f, p, t.adj, t.adj2, t.adj3, t.adj4), C && g !== "arc" ? C(r) && x() : m && g !== "arc" && (r.fillStyle = m, S ? r.fill("evenodd") : r.fill(), i || x()), h && (t.custGeom && t.custGeom.length > 0 && (k > 0 || j > 0) && (r.beginPath(), ke(r, (e) => yo(e, t.custGeom, o, s, f, p), k, j)), h());
	}, P = e.getTransform(), F = Math.abs(P.a * P.d - P.b * P.c), I = F > 0 ? Math.sqrt(F) : 1, L = (t.shadow || t.reflection || t.softEdge || t.innerShadow ? M ? Ce(g, c, l, u, d, [
		t.adj,
		t.adj2,
		t.adj3,
		t.adj4,
		t.adj5,
		t.adj6,
		t.adj7,
		t.adj8
	]) : t.custGeom && t.custGeom.length > 0 ? we(t.custGeom, c, l, u, d) : null : null) ?? {
		x: c,
		y: l,
		w: u,
		h: d
	}, R = t.stroke ? t.stroke.width * n / 2 : 0, z = t.stroke ? Math.max(t.stroke.headEnd ? $e(t.stroke.headEnd, t.stroke, n, h) : 0, t.stroke.tailEnd ? $e(t.stroke.tailEnd, t.stroke, n, h) : 0) : 0, B = t.sp3d?.contourW ? t.sp3d.contourW * n : 0, V = Math.max(R, z, B), H = V > 0 ? {
		x: L.x - V,
		y: L.y - V,
		w: L.w + V * 2,
		h: L.h + V * 2
	} : L, U = so(P, H.x, H.y, H.w, H.h), W = n * I, G = m ? [] : Do(t.sp3d, t.scene3d?.lightRig, t.sp3d?.prstMaterial, n, I, t.scene3d?.camera), ee = (t.stroke ? t.stroke.width * n / 2 : 0) + 2, te = (e) => {
		if (A(t.stroke?.fill) && (e = ae(e)), t.stroke && (S.has(g) || C.has(g))) {
			let r = Se(g, c, l, u, d, [
				t.adj,
				t.adj2,
				t.adj3,
				t.adj4,
				t.adj5,
				t.adj6,
				t.adj7,
				t.adj8
			]);
			if (!r) return;
			let i = t.stroke.cmpd, a = g === "line" || g === "straightconnector1";
			if (w(g) && r.vertices.length >= 2 && !(i && a)) {
				let i = r.vertices;
				e.beginPath(), ke(e, (e) => {
					e.moveTo(i[0].x, i[0].y);
					for (let t = 1; t < i.length; t++) e.lineTo(i[t].x, i[t].y);
				}, T, E), Vo(e, t.stroke, n, {
					x: c,
					y: l,
					w: u,
					h: d
				}, t.rotation), e.stroke();
			}
			if (D && (e.beginPath(), be(e, g, c, l, u, d, [
				t.adj,
				t.adj2,
				t.adj3,
				t.adj4,
				t.adj5,
				t.adj6,
				t.adj7,
				t.adj8
			], T, E) && (Vo(e, t.stroke, n, {
				x: c,
				y: l,
				w: u,
				h: d
			}, t.rotation), e.stroke())), i && a) {
				let a = De([{
					op: "moveTo",
					args: [r.start.x, r.start.y]
				}, {
					op: "lineTo",
					args: [r.end.x, r.end.y]
				}], T, E);
				a.length === 2 && Bo(e, {
					x: a[0].args[0],
					y: a[0].args[1]
				}, {
					x: a[1].args[0],
					y: a[1].args[1]
				}, t.stroke, i, n, t.rotation);
			}
			t.stroke.tailEnd && ut(e, r.end.x, r.end.y, r.end.angle, t.stroke.tailEnd, t.stroke, n, h, xe(e, t.stroke, n, h, r.end.x, r.end.y, r.end.angle, t.stroke.tailEnd, {
				x: c,
				y: l,
				w: u,
				h: d
			}, t.rotation, n * h)), t.stroke.headEnd && ut(e, r.start.x, r.start.y, r.start.angle, t.stroke.headEnd, t.stroke, n, h, xe(e, t.stroke, n, h, r.start.x, r.start.y, r.start.angle, t.stroke.headEnd, {
				x: c,
				y: l,
				w: u,
				h: d
			}, t.rotation, n * h));
			return;
		}
		if (!t.stroke || !t.custGeom || t.custGeom.length === 0 || (!t.stroke.headEnd || t.stroke.headEnd.type === "none") && (!t.stroke.tailEnd || t.stroke.tailEnd.type === "none")) return;
		let { start: r, end: i } = Te(t.custGeom);
		r && t.stroke.headEnd && t.stroke.headEnd.type !== "none" && ut(e, c + r.x * u, l + r.y * d, Math.atan2(r.dy * d, r.dx * u), t.stroke.headEnd, t.stroke, n, h, xe(e, t.stroke, n, h, c + r.x * u, l + r.y * d, Math.atan2(r.dy * d, r.dx * u), t.stroke.headEnd, {
			x: c,
			y: l,
			w: u,
			h: d
		}, t.rotation, n * h)), i && t.stroke.tailEnd && t.stroke.tailEnd.type !== "none" && ut(e, c + i.x * u, l + i.y * d, Math.atan2(i.dy * d, i.dx * u), t.stroke.tailEnd, t.stroke, n, h, xe(e, t.stroke, n, h, c + i.x * u, l + i.y * d, Math.atan2(i.dy * d, i.dx * u), t.stroke.tailEnd, {
			x: c,
			y: l,
			w: u,
			h: d
		}, t.rotation, n * h));
	}, K = (e) => {
		if (G.length > 0 && jo(e, c, l, u, d, G, (e, t, n, r, i) => N(e, void 0, {
			x: t,
			y: n,
			w: r,
			h: i
		}), void 0, ee)) {
			te(e), Ka(e);
			return;
		}
		N(e), te(e);
	};
	if (ho(e, t, K, K, U, uo(P, c, l, u, d, t.shadow?.algn), n, W, P, !!v || x, !0), t.textBody) {
		let o = ao(t, a), p = _o(t.textBody.vert, t.rotation, t.flipH, t.flipV);
		if (e.save(), t.flipH || t.flipV) {
			let n = c + u / 2, r = l + d / 2;
			e.translate(n, r), t.flipH && e.scale(-1, 1), t.flipV && e.scale(1, -1), e.translate(-n, -r);
		}
		let m = (p - t.rotation) % 360;
		if (m !== 0) {
			let t = c + u / 2, n = l + d / 2;
			e.translate(t, n), e.rotate(m * Math.PI / 180), e.translate(-t, -n);
		}
		let h = c, _ = l, v = u, y = d;
		if (t.textRect) h = Z(t.textRect.x, n), _ = Z(t.textRect.y, n), v = Z(t.textRect.width, n), y = Z(t.textRect.height, n);
		else if (g === "ellipse") {
			let e = u * (1 - 1 / Math.SQRT2) / 2, t = d * (1 - 1 / Math.SQRT2) / 2;
			h = c + e, _ = l + t, v = u / Math.SQRT2, y = d / Math.SQRT2;
		} else {
			let e = io(g, c, l, u, d, t.adj, t.adj2);
			e && (h = e.tx, _ = e.ty, v = e.tw, y = e.th);
		}
		Eo(e, t.textBody, h, _, v, y, n, o, p, !1, !1, r, i, a, f, !1, s), e.restore();
	}
	e.restore();
}
var yo = rt;
function bo(e, t) {
	let n = `${e}`, r = e >= 1 && e <= 26 ? String.fromCharCode(96 + e) : n, i = e >= 1 && e <= 26 ? String.fromCharCode(64 + e) : n, a = xo(e).toLowerCase(), o = xo(e), s = n.replace(/[0-9]/g, (e) => String.fromCharCode(65296 + (e.charCodeAt(0) - 48)));
	switch (t) {
		case "arabicPlain": return n;
		case "arabicPeriod": return `${n}.`;
		case "arabicParenR": return `${n})`;
		case "arabicParenBoth": return `(${n})`;
		case "arabicDbPlain": return s;
		case "arabicDbPeriod": return `${s}.`;
		case "alphaLcPlain": return r;
		case "alphaLcPeriod": return `${r}.`;
		case "alphaLcParenR": return `${r})`;
		case "alphaLcParenBoth": return `(${r})`;
		case "alphaUcPlain": return i;
		case "alphaUcPeriod": return `${i}.`;
		case "alphaUcParenR": return `${i})`;
		case "alphaUcParenBoth": return `(${i})`;
		case "romanLcPlain": return a;
		case "romanLcPeriod": return `${a}.`;
		case "romanLcParenR": return `${a})`;
		case "romanLcParenBoth": return `(${a})`;
		case "romanUcPlain": return o;
		case "romanUcPeriod": return `${o}.`;
		case "romanUcParenR": return `${o})`;
		case "romanUcParenBoth": return `(${o})`;
		default: return `${n}.`;
	}
}
function xo(e) {
	let t = [
		1e3,
		900,
		500,
		400,
		100,
		90,
		50,
		40,
		10,
		9,
		5,
		4,
		1
	], n = [
		"M",
		"CM",
		"D",
		"CD",
		"C",
		"XC",
		"L",
		"XL",
		"X",
		"IX",
		"V",
		"IV",
		"I"
	], r = "";
	for (let i = 0; i < t.length; i++) for (; e >= t[i];) r += n[i], e -= t[i];
	return r;
}
function So(e) {
	for (let t of e.runs) if (t.type === "text" && t.text !== "" || t.type === "math") return !0;
	return !1;
}
function Co(e, t) {
	let n = So(e);
	if (e.bullet.type === "char") return t.clear(), n ? yt(e.bullet.char, e.bullet.fontFamily ?? null) : "";
	if (e.bullet.type === "autoNum") {
		if (!n) return "";
		let r = e.lvl;
		return t.has(r) ? t.set(r, t.get(r) + 1) : t.set(r, e.bullet.startAt ?? 1), bo(t.get(r), e.bullet.numType);
	}
	return t.clear(), "";
}
function wo(e, t, n, r, i, a, o) {
	let s = (() => {
		for (let e of t.runs) if (e.type === "text" && e.fontSize != null) return e.fontSize;
		return t.defFontSize ?? e.defaultFontSize ?? 18;
	})() * h * r * i, c = (() => {
		for (let e of t.runs) if (e.type === "text" && e.color) return e.color;
		return null;
	})(), l = c ? $(c) : n, u = (() => {
		for (let e of t.runs) if (e.type === "text" && e.fontFamily) return e.fontFamily;
		return t.defFontFamily ?? null;
	})(), d = "", f = s, p = "sans-serif", m = ma(!1, !1, f, p, a), g = l, _ = !1, v = null;
	d = Co(t, o);
	let y = Pr(t.bullet);
	if (y.type === "char") {
		let e = y, t = e.sizePts == null ? e.sizePct == null ? s : s * (e.sizePct / 100) : e.sizePts * h * r * i, n = d === e.char ? aa(e.fontFamily ?? null, a) : "sans-serif";
		f = t, p = n, m = ma(!1, !1, t, n, a, d, oa(e.fontFamily)), g = e.color ? $(e.color) : l, _ = !e.color;
	} else if (y.type === "autoNum") {
		let e = y, t = e.sizePts == null ? e.sizePct == null ? s : s * (e.sizePct / 100) : e.sizePts * h * r * i;
		f = t, p = aa(e.fontFamily ?? u, a), m = ma(!1, !1, t, aa(e.fontFamily ?? u, a), a, d, oa(e.fontFamily ?? u)), g = y.color ? $(y.color) : l, _ = !y.color;
	} else if (y.type === "blip") {
		let n = y, a = ba(e, t, n) * h * r * i;
		v = {
			imagePath: n.imagePath,
			mimeType: n.mimeType,
			sizePx: a
		};
	}
	return {
		bulletLabel: d,
		bulletFont: m,
		bulletSizePx: f,
		bulletFamily: p,
		bulletColor: g,
		bulletFollowsText: _,
		bulletImage: v
	};
}
function To(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
	let m = t.autoFit === "norm" && t.fontScale != null && t.fontScale > 0 && t.fontScale < 1 ? t.fontScale : 1, g = h * s, _ = cn(a, o, {
		lIns: t.lIns,
		rIns: t.rIns,
		tIns: t.tIns,
		bIns: t.bIns
	}, s), v = (t.defaultFontSize ?? 18) * g * m, y = t.defaultBold ?? !1, b = t.defaultItalic ?? !1, x, S = /* @__PURE__ */ new Map(), C = [], w = t.paragraphs.map((n) => {
		let r = n.defFontSize == null ? v : n.defFontSize * g * m, i = n.defColor ? $(n.defColor) : c, a = wo(t, n, i, s, m, d, S);
		C.push(a);
		let o = ka(n, r, i, s, y, b, m, u, d, !1, e);
		x ??= o.sameStyle;
		let l = o.input.find((e) => e.type === "text"), f = aa(n.defFontFamily ?? null, d), p = n.defBold ?? y, h = n.defItalic ?? b, _ = l?.type === "text" ? l.style : {
			text: "",
			font: ma(p, h, r, f, d, ""),
			sizePx: r,
			color: i,
			underline: !1,
			strikethrough: !1,
			lineMetric: ha(f, p, h, d),
			faceFamily: f
		}, w = n.endRunProperties, T = w ? ka({
			...n,
			runs: [{
				...w,
				text: " "
			}]
		}, r, i, s, y, b, m, u, d, !1, e).input.find((e) => e.type === "text") : void 0, E = (e, t) => t == null ? e == null ? void 0 : {
			type: "pts",
			val: e / 100 * m
		} : {
			type: "pct",
			val: t
		};
		return {
			runs: o.input,
			marginStart: Z(n.marL, s),
			marginEnd: Z(n.marR, s),
			firstLineIndent: Z(n.indent, s),
			marker: So(n) ? a.bulletLabel ? {
				text: a.bulletLabel,
				style: {
					text: a.bulletLabel,
					font: a.bulletFont,
					sizePx: a.bulletSizePx,
					color: a.bulletColor,
					underline: !1,
					strikethrough: !1,
					faceFamily: a.bulletFamily,
					lineMetric: ha(a.bulletFamily, !1, !1, d)
				}
			} : a.bulletImage ? {
				advance: a.bulletImage.sizePx,
				thickness: a.bulletImage.sizePx
			} : void 0 : void 0,
			alignment: n.alignment,
			lineSpacing: n.spaceLine?.type === "pts" ? {
				type: "pts",
				val: yr(n.spaceLine.val)
			} : n.spaceLine,
			spaceBefore: E(n.spaceBefore, n.spaceBeforePct),
			spaceAfter: E(n.spaceAfter, n.spaceAfterPct),
			markStyle: _,
			endMarkStyle: T?.type === "text" ? T.style : void 0,
			eastAsianLineBreak: n.eaLnBrk !== !1
		};
	}), T = ci(e, {
		vert: n,
		rect: {
			left: r + _.left,
			top: i + _.top,
			width: _.width,
			height: _.height
		},
		anchor: t.verticalAnchor,
		anchorCtr: t.anchorCtr === !0,
		wrap: t.wrap !== "none",
		spcFirstLastPara: t.spcFirstLastPara === !0,
		lnSpcReduction: t.autoFit === "norm" ? t.lnSpcReduction ?? 0 : 0,
		pxPerPt: g,
		paragraphs: w,
		sameStyle: x,
		drawMarker: (n, r, i) => {
			let a = t.paragraphs[n];
			if (!So(a)) return;
			let o = C[n], s = i;
			e.save();
			let c = o.bulletImage, l = c ? d.pictureBulletImages?.has(c.imagePath) ? d.pictureBulletImages.get(c.imagePath) : p ? qe(c.imagePath, p) : null : null;
			if (c && l) {
				let t = c.sizePx, n = l.height > 0 ? t * l.width / l.height : t;
				e.drawImage(l, r - n / 2, s, n, t);
			}
			e.restore();
		},
		markerPaint: (t, n, r) => {
			let i = C[t], a = w[t].runs.find((e) => e.type === "text");
			return i.bulletFollowsText && a?.type === "text" && a.style.patternFill ? ia(e, a.style, n, r, s) : i.bulletColor;
		},
		drawUnderline: (t, n, r) => {
			Yi(e, t, 0, 0, n, t.color, s, d.dpr, r);
		},
		sameUnderline: (e, t) => e.underline === t.underline && e.underlineStyle === t.underlineStyle && e.underlineColor === t.underlineColor && e.underlineFill === t.underlineFill && e.underlineLine === t.underlineLine && e.underlineLineNoFill === t.underlineLineNoFill && e.color === t.color && e.noFill === t.noFill,
		drawStrike: (t, n, r, i) => {
			Xi(e, t, n, r, i, t.color, d.dpr);
		},
		drawObject: (t, n, r) => {
			ra(e, t, n, r);
		}
	});
	if (f) for (let e of T) f({
		text: e.text,
		inShapeX: e.x - r,
		inShapeY: e.y - i,
		w: e.w,
		h: e.h,
		fontSize: e.fontSize,
		font: e.font,
		shapeX: r,
		shapeY: i,
		shapeW: a,
		shapeH: o,
		rotation: l,
		...e.hyperlink ? { hyperlink: e.hyperlink } : {}
	});
}
function Eo(e, t, n, r, i, a, o, s = null, c = 0, l = !1, u = !1, d = "#000000", f, p = {
	themeMajorFont: null,
	themeMinorFont: null,
	dpr: 1
}, m, g = !1, _, v = !1, y = g) {
	if (t.vert === "wordArtVert" || t.vert === "wordArtVertRtl") {
		if (g) return i;
		To(e, t, t.vert, n, r, i, a, o, s ?? d, c, f, p, m, _);
		return;
	}
	let b = t.vert === "vert" || t.vert === "eaVert", x = t.vert === "vert270";
	if (b || x) {
		let l = n + i / 2, u = r + a / 2, h = b ? 90 : -90, v = m ? (e) => m({
			...e,
			inShapeX: e.inShapeX - a / 2 + i / 2,
			inShapeY: e.inShapeY - i / 2 + a / 2,
			shapeX: n,
			shapeY: r,
			shapeW: i,
			shapeH: a,
			rotation: c,
			textBodyRotation: h
		}) : void 0;
		if (g) return i;
		e.save(), e.translate(l, u), e.rotate(x ? -Math.PI / 2 : Math.PI / 2), Eo(e, {
			...t,
			vert: "horz"
		}, -a / 2, -i / 2, a, i, o, s, 0, !1, !1, d, f, p, v, !1, _, t.vert === "eaVert"), e.restore();
		return;
	}
	let S = t.textWarp;
	if (!g && S && gt(S.preset)) {
		ro(e, t, S.preset, S.adj ?? [], n, r, i, a, o, s ?? d, p);
		return;
	}
	let C = cn(i, a, {
		lIns: t.lIns,
		rIns: t.rIns,
		tIns: t.tIns,
		bIns: t.bIns
	}, o).left, w = Z(t.rIns, o), T = Z(t.tIns, o), E = Z(t.bIns, o), D = t.wrap !== "none", O = t.autoFit === "sp", k = O ? D && wa(e, t, i, C, w, o, p, f) : D, A = Math.max(1, t.numCol ?? 1), j = Z(t.spcCol ?? 0, o), M = t.defaultBold ?? !1, N = t.defaultItalic ?? !1, P = s ?? d, F = (r, a) => {
		let s = (t.defaultFontSize ?? 18) * h * o * r, c = [], l = 0, u = 0, d = a, m = /* @__PURE__ */ new Map();
		for (let _ = 0; _ < t.paragraphs.length; _++) {
			let v = t.paragraphs[_], b = Z(v.marL, o), x = Z(v.marR, o), S = Z(v.indent, o), T = v.defFontSize == null ? s : v.defFontSize * h * o * r, E = v.defColor ? $(v.defColor) : P, D = ya(v), { bulletLabel: F, bulletFont: I, bulletColor: L, bulletFollowsText: R, bulletImage: z } = wo(t, v, E, o, r, p, m), B = A > 1 ? (i - C - w - (A - 1) * j) / A : i - C - w, V = n + C + b, H = n + C + b + S, U = B - b - x, W = Fa(e, v, k ? U : Infinity, T, E, o, b, M, N, r, f, p, xa(D, S)), G = v.spaceBefore == null ? 0 : v.spaceBefore / 100 * h * o * r, ee = v.spaceAfter == null ? 0 : v.spaceAfter / 100 * h * o * r;
			for (let n = 0; n < W.length; n++) {
				let r = W[n], i = n === 0, s = n === W.length - 1, f = 0, p = [], m = 0;
				for (let t of r.segments) {
					let n = t.math ? Math.max(t.sizePx, (t.math.ascent + t.math.descent) / 1.2) : t.sizePx;
					if (n > f && (f = n), t.math ? d = !1 : t.isTab || (t.lineMetric === void 0 ? d = !1 : p.push({
						sizePx: t.sizePx,
						face: t.lineMetric
					}), t.lineMetricLatin === null ? d = !1 : t.lineMetricLatin !== void 0 && t.lineMetricLatin !== t.lineMetric && p.push({
						sizePx: t.sizePx,
						face: t.lineMetricLatin
					})), !t.math && O) {
						e.font = t.font;
						let n = e.measureText(t.text || "M"), r = (n.fontBoundingBoxAscent ?? 0) + (n.fontBoundingBoxDescent ?? 0);
						r > m && (m = r);
					}
				}
				for (let e of r.metricMarks ?? []) e.lineMetric !== void 0 && p.push({
					sizePx: e.sizePx,
					face: e.lineMetric
				});
				f === 0 && (f = T);
				let b = f;
				if (i && F) {
					e.font = I;
					let t = e.measureText("M"), n = t.actualBoundingBoxAscent + t.actualBoundingBoxDescent;
					n > f && (f = n);
				}
				i && z && z.sizePx > f && (f = z.sizePx), f > b && (d = !1);
				let x = f * 1.2, C = O && m > x, w = Zt(x, v.spaceLine, h * o);
				g && !O && !y && (v.spaceLine || (w = f));
				let E = v.spaceLine?.type === "pct" ? f * (v.spaceLine.val / 1e5) : w;
				t.autoFit === "norm" && t.lnSpcReduction != null && v.spaceLine?.type !== "pts" && (w *= 1 - t.lnSpcReduction);
				let k, A, j = x, M = t.compatLnSpc === !1;
				a && d && M && (p.length === 0 || p.some((e) => e.face.excel === void 0)) && (d = !1);
				let N = v.fontAlgn, P;
				if (a && d && N && p.length > 0) {
					let e = xr * h * o;
					P = Cr(N, p, M, e), P || (d = !1);
					for (let t of r.segments) {
						if (!P) break;
						if (t.isTab || !t.text) continue;
						let n = t.lineMetric && wr(N, {
							sizePx: t.sizePx,
							face: t.lineMetric
						}, M, e);
						if (n === void 0) {
							d = !1;
							break;
						}
						t.fontAlgnOffsetPx = n;
					}
				}
				if (a && d && !(g && !O && !y && !v.spaceLine)) {
					let e = P ?? (M ? br(p.map((e) => ({
						sizePx: e.sizePx,
						box: e.face.excel
					}))) : p.length > 0 ? vr(p.map((e) => ({
						sizePx: e.sizePx,
						share: e.face.share
					}))) : {
						ascent: x * .8,
						descent: x * .2
					});
					M && (j = e.ascent + e.descent);
					let n = Kt(e, v.spaceLine?.type === "pts" ? {
						type: "pts",
						val: yr(v.spaceLine.val)
					} : v.spaceLine, h * o, t.autoFit === "norm" && t.lnSpcReduction != null ? t.lnSpcReduction : 0);
					w = n.ascent + n.descent, k = n.ascent, A = e.descent;
				}
				let B = s && v.spaceAfterPct != null ? j * (v.spaceAfterPct / 1e5) : ee, te = i && v.spaceBeforePct != null ? j * (v.spaceBeforePct / 1e5) : G, K = t.spcFirstLastPara === !0, ne = _ === t.paragraphs.length - 1, q = w + (s && (K || !ne) ? B : 0), re = i && (K || _ > 0) ? te : 0, ie = i ? xa(D, S) : 0, ae = r.segments.some((e) => e.text && e.text.length > 0 || e.math != null), oe = i && ae ? z : null;
				c.push({
					line: r,
					linePx: q,
					lineHeight: w,
					baselineLineHeight: E,
					topGapPx: re,
					textXOffset: ie,
					bulletLabel: i ? F : "",
					bulletFont: I,
					bulletColor: L,
					bulletFollowsText: R,
					bulletX: H,
					bulletImage: oe,
					textX: V,
					textMaxW: U,
					alignment: v.alignment,
					isLastLine: s,
					para: v,
					useResolvedFontMetrics: k === void 0 && C,
					metricAscent: k,
					metricNaturalDescent: A
				});
				let se = l + re;
				l += q + re, u = Math.max(u, l, se + (C && k === void 0 ? Math.max(w, m) : w) + (q - w));
			}
		}
		return {
			allLines: c,
			totalHeight: l,
			requiredHeight: u,
			metricOk: d
		};
	}, I = !0, L = (e) => {
		let t = F(e, I);
		return I && !t.metricOk && (I = !1, t = F(e, !1)), t;
	}, { allLines: R, requiredHeight: z } = L(1);
	if (t.autoFit === "norm" && t.fontScale != null && t.fontScale > 0 && t.fontScale < 1 && ({allLines: R, requiredHeight: z} = L(t.fontScale)), g) return T + z + E;
	let B = t.verticalAnchor ?? "t", V = r, H;
	a === 0 && B === "b" ? (H = T + z + E, V = r - H) : H = t.autoFit === "sp" && a === 0 ? T + z + E : a;
	let U = R[R.length - 1], W = U?.metricAscent !== void 0 && U.metricNaturalDescent !== void 0 ? z - (U.lineHeight - U.metricAscent) + U.metricNaturalDescent : z, G, ee = Math.max(0, H - T - E);
	G = B === "ctr" ? V + en("ctr", {
		left: C,
		top: T,
		width: i - C - w,
		height: ee
	}, W) : B === "b" ? V + H - E - W : V + T, e.save(), e.textAlign = "left", e.textBaseline = "alphabetic";
	let te = G, K = A > 1 ? (i - C - w - (A - 1) * j) / A + j : 0, ne = Math.max(0, H - T - E), q = R[R.length - 1], ie = q ? Math.max(0, q.linePx - q.lineHeight) : 0, ae = z - ie, oe = a === 0 || ae <= ne + .5, se = A > 1 && !oe ? Math.ceil(R.length / A) : R.length, ce = 0, le = 0;
	for (let s of R) {
		let { line: l, linePx: u, lineHeight: d, topGapPx: f, textXOffset: h, bulletLabel: g, bulletFont: y, bulletColor: b, bulletFollowsText: x, bulletImage: S, alignment: C, isLastLine: w, useResolvedFontMetrics: T, metricAscent: E } = s;
		A > 1 && ce < A - 1 && le >= se && (ce++, le = 0, G = te), G += f, le++;
		let D = (t.rtlCol ? A - 1 - ce : ce) * K, O = s.textX + D, k = s.bulletX + D, j = s.textMaxW, M = s.para.rtl === !0, N = M || Vr(l.segments), P = l.segments.some((e) => e.isTab);
		if (P) {
			let t = Z(s.para.marL, o), n = Z(s.para.marR, o), r = M ? n : t + h, i = j + t + n;
			e.font = l.segments.find((e) => e.isTab).font;
			let a = e.measureText(" ").width, c = Qr(l.segments.map((t) => {
				if (t.isTab) return {
					isTab: !0,
					width: 0
				};
				if (t.math) return {
					isTab: !1,
					width: t.math.width
				};
				e.font = t.font;
				let n = t.letterSpacingPx ?? 0;
				return {
					isTab: !1,
					width: t.text ? (t.leadingLetterSpacingPx ?? 0) + Oa(e, t.text, n) : 0
				};
			}), (s.para.tabStops ?? []).map((e) => ({
				pos: Z(e.pos, o),
				algn: e.algn
			})), r, i, a, Z(s.para.defTabSz ?? 914400, o));
			for (let e = 0; e < l.segments.length; e++) l.segments[e].isTab && (l.segments[e].tabWidthPx = c[e]);
		}
		let F = 0, I = 0, L = 0, R = 0;
		for (let t of l.segments) {
			if (t.isTab) {
				F += t.tabWidthPx ?? 0;
				continue;
			}
			if (t.math) {
				F += t.math.width, I = Math.max(I, t.math.ascent);
				continue;
			}
			e.font = t.font;
			let n = e.measureText(t.text || "M"), r = t.letterSpacingPx ?? 0;
			if (F += t.leadingLetterSpacingPx ?? 0, F += t.text ? Oa(e, t.text, r) : 0, n.actualBoundingBoxAscent > 0 && (I = Math.max(I, n.actualBoundingBoxAscent)), T) {
				let e = n.fontBoundingBoxAscent ?? 0, t = e + (n.fontBoundingBoxDescent ?? 0);
				t > R && (R = t, L = e);
			}
		}
		let z = T && R > 0 ? B === "t" && I > 0 ? s.para.spaceLine?.type === "pct" ? Math.max(I, L + (s.baselineLineHeight - R) / 2) : I : Math.max(I, L + Math.max(0, d - R) / 2) : Math.max(d * .8, I), V = E === void 0 ? G + z : G + E, H = V + (l.segments.find((e) => !e.isTab && !e.math && !!e.text)?.fontAlgnOffsetPx ?? 0), U = O + j, W = S && _ ? p.pictureBulletImages?.has(S.imagePath) ? p.pictureBulletImages.get(S.imagePath) : qe(S.imagePath, _) : void 0, ee = 0;
		if (N && M) {
			if (g) e.font = y, ee = e.measureText(g).width;
			else if (S && W) {
				let e = S.sizePx;
				ee = W.height > 0 ? e * (W.width / W.height) : e;
			}
		}
		if (g) {
			e.font = y;
			let t = l.segments.find((e) => !e.isTab && !e.math && !!e.text);
			if (e.fillStyle = x && t?.patternFill ? ia(e, t, k, H, o) : b, N && M) {
				let t = e.direction;
				e.direction = "rtl", e.fillText(g, U - ee, H), e.direction = t;
			} else e.fillText(g, k, H);
		}
		if (S && _ && W) {
			let t = S.sizePx, n = W.height > 0 ? t * (W.width / W.height) : t, r = H - t;
			N && M ? e.drawImage(W, U - n, r, n, t) : e.drawImage(W, k, r, n, t);
		}
		let ne = O + h, q;
		q = P ? M ? O + j - ee - F : ne : C === "ctr" ? rn("ctr", ne, j - h, F, !1, !0) : C === "r" ? rn("r", O - ee, j, F, !1, !0) : ne;
		let ie = C === "just" || C === "justLow" ? "just" : C === "thaiDist" ? "thaiDist" : C === "dist" ? "dist" : null, ae = w || (l.endsWithBreak ?? !1), oe = (ie && !N && !P && Xt(C, w, l.endsWithBreak ?? !1) ? Wr(l.segments, j - h, F, ie, ae) : null) ?? l.segments, ue = N ? Hr(l.segments, M) : null, de = (e, t) => {
			if (Math.abs(e - t) !== 1) return 0;
			let n = l.segments[Math.min(e, t)], r = l.segments[Math.max(e, t)];
			return n.isTab || n.math || r.isTab || r.math || n.sourceRunId == null || n.sourceRunId !== r.sourceRunId ? 0 : r.leadingLetterSpacingPx ?? 0;
		}, fe = oe.length;
		for (let t = 0; t < fe; t++) {
			let s = ue ? ue.order[t] : t, l = oe[s], u = ue ? ue.rtl[s] : !1;
			if (N && (e.direction = u ? "rtl" : "ltr"), t > 0) {
				let e = ue ? ue.order[t - 1] : t - 1;
				q += de(e, s);
			}
			if (l.isTab) {
				q += l.tabWidthPx ?? 0;
				continue;
			}
			let f = l.jext ?? 0, h = l.splitBefore, g = l.perGap ?? 0, _ = h && h.length > 0 ? h.length * g : 0;
			if (l.math) {
				let t = l.math.width;
				ra(e, l, q, H - l.math.ascent), q += t, q += f;
				continue;
			}
			e.font = l.font;
			let y = l.drawSizePx ?? l.sizePx, b = l.baseline ? -(l.baseline / 1e5) * l.sizePx : 0, x = V + (l.fontAlgnOffsetPx ?? 0) + b, S = ia(e, l, q, x, o);
			e.fillStyle = S;
			let C = l.letterSpacingPx ?? 0;
			if (l.highlight && l.text) {
				let t = Oa(e, l.text, C) + _ + f;
				qi(e, q, x, t, y, l.highlight, S, l.lineMetric);
			}
			let w = l.shadow, T = (e, t, n, r) => {
				let i = r === "fill" ? e.fillText.bind(e) : e.strokeText.bind(e);
				if (C !== 0 && Ta(t) > 1) {
					let r = e, a = r.letterSpacing;
					if (Da(e)) {
						r.letterSpacing = `${C}px`, i(t, n, x);
						try {
							r.letterSpacing = a;
						} catch {}
					} else {
						let r = n, a = [...t];
						for (let t = 0; t < a.length; t++) {
							let n = a[t];
							i(n, r, x), t < a.length - 1 && (r += e.measureText(n).width + C);
						}
					}
				} else i(t, n, x);
			}, E = (t) => Oa(e, t, C), D = h && h.length > 0 ? or([...l.text], h, g, E) : null, O = [...l.text], k = !!h && h.length === O.length - 1 && O.length > 1, A = (e, t) => {
				if (v) {
					let n = k ? C + g : C;
					ti(e, l.text, q, x, y, n, t);
					return;
				}
				if (k) {
					let n = t === "fill" ? e.fillText.bind(e) : e.strokeText.bind(e), r = C + g;
					if (Da(e)) {
						let t = e, i = t.letterSpacing;
						t.letterSpacing = `${r}px`, n(l.text, q, x);
						try {
							t.letterSpacing = i;
						} catch {}
					} else {
						let t = q;
						for (let i = 0; i < O.length; i++) {
							let a = O[i];
							n(a, t, x), i < O.length - 1 && (t += e.measureText(a).width + r);
						}
					}
				} else if (D) for (let { text: n, dx: r } of D) T(e, n, q + r, t);
				else T(e, l.text, q, t);
			}, j = l.reflection;
			if (j && l.text && !l.noFill) {
				let t = e.canvas.width || 0, n = e.canvas.height || 0;
				if (t > 0 && n > 0) {
					e.font = l.font;
					let r = e.measureText(l.text), i = Number.isFinite(r.actualBoundingBoxAscent) ? r.actualBoundingBoxAscent : y * .8, a = Number.isFinite(r.actualBoundingBoxDescent) ? r.actualBoundingBoxDescent : y * .2, s = Number.isFinite(r.actualBoundingBoxLeft) ? r.actualBoundingBoxLeft : 0, c = Number.isFinite(r.actualBoundingBoxRight) ? r.actualBoundingBoxRight : r.width, u = e.getTransform(), d = Math.abs(u.a * u.d - u.b * u.c), f = d > 0 ? Math.sqrt(d) : 1;
					pa(e, (e) => {
						e.font = l.font, e.fillStyle = ia(e, l, q, x, o), A(e, "fill");
					}, {
						x: (q - s) * f,
						y: (x - i) * f,
						w: Math.max(1, s + c) * f,
						h: Math.max(1, i + a) * f
					}, j, o * f, u, t, n), e.font = l.font, e.fillStyle = S;
				}
			}
			if (w && !l.noFill) {
				let t = w.dir * Math.PI / 180, n = Z(w.dist, o);
				e.save(), e.shadowColor = $(w.color, w.alpha), e.shadowBlur = Z(w.blur, o), e.shadowOffsetX = Math.cos(t) * n, e.shadowOffsetY = Math.sin(t) * n;
			}
			l.noFill || A(e, "fill"), w && !l.noFill && e.restore(), e.font = l.font;
			let M = Oa(e, l.text, C) + _, P = l.outline;
			P && P.width > 0 && (e.save(), e.lineWidth = Math.max(.5, Z(P.width, o)), e.strokeStyle = P.fill ? re(P.fill, e, q, x - y, Math.max(1, M), y, 0, o * 12700) ?? "rgba(0,0,0,0)" : P.color ? `#${P.color}` : l.noFill ? "rgba(0,0,0,0)" : S, (!l.noFill || P.fill || P.color) && (e.lineJoin = "round", A(e, "stroke")), e.restore()), m && l.text && m({
				text: l.text,
				inShapeX: q - n,
				inShapeY: G - r,
				w: M + f,
				h: d,
				fontSize: y,
				font: l.font,
				shapeX: n,
				shapeY: r,
				shapeW: i,
				shapeH: a,
				rotation: c,
				hyperlink: l.hyperlink
			}), Zi(e, l, q, x, M + f, S, o, p.dpr), q += M, q += f;
		}
		N && (e.direction = "ltr"), G += u;
	}
	e.restore();
}
function Do(e, t, n, r, i, a) {
	if (!e) return [];
	let o = er(t?.rig ?? "threePt", t?.dir ?? "t", t?.rot), s = tr(n), c = r * i, l = [];
	if (e.bevelT && e.bevelT.w > 0 && e.bevelT.h > 0 && l.push({
		widthPx: e.bevelT.w * c,
		heightPx: e.bevelT.h * c,
		prst: e.bevelT.prst || "circle",
		material: s,
		light: o,
		camera: a,
		wireframeLinePx: i
	}), e.bevelB && e.bevelB.w > 0 && e.bevelB.h > 0 && l.push({
		widthPx: e.bevelB.w * c,
		heightPx: e.bevelB.h * c,
		prst: e.bevelB.prst || "circle",
		material: s,
		light: o,
		bottom: !0,
		camera: a,
		depthPx: (e.extrusionH ?? 0) * c,
		wireframeLinePx: i
	}), s === "legacyWireframe") for (let t of [!1, !0]) l.some((e) => !!e.bottom === t) || l.push({
		widthPx: 0,
		heightPx: 0,
		prst: "circle",
		material: s,
		light: o,
		camera: a,
		bottom: t,
		depthPx: t ? (e.extrusionH ?? 0) * c : 0,
		wireframeLinePx: i
	});
	return l;
}
function Oo(e, t, n, r, i, a) {
	if (!e || !e.extrusionH || e.extrusionH <= 0) return null;
	let o = e.extrusionH * i * a, s = On({
		...t,
		unitsPerInch: (t.unitsPerInch ?? 96) * a,
		sceneDepth: (t.sceneDepth ?? 0) * a
	}, n * a, r * a, o);
	if (Math.hypot(s.x, s.y) < .75) return null;
	let c = [
		64,
		64,
		64
	];
	if (e.extrusionClr) {
		let t = e.extrusionClr.replace("#", "");
		t.length >= 6 && (c = [
			parseInt(t.slice(0, 2), 16),
			parseInt(t.slice(2, 4), 16),
			parseInt(t.slice(4, 6), 16)
		]);
	}
	return {
		offsetX: s.x,
		offsetY: s.y,
		rgb: c
	};
}
function ko(e, t, n, r, i, a = n) {
	let o = e.a * e.d - e.b * e.c;
	if (Math.abs(o) <= 1e-12) return;
	let s = e.d / o, c = -e.b / o, l = -e.c / o, u = e.a / o, d = -(s * e.e + l * e.f), f = -(c * e.e + u * e.f);
	return {
		a: t * s,
		b: t * c,
		c: t * l,
		d: t * u,
		e: n + t * (d - r),
		f: a + t * (f - i)
	};
}
function Ao(e, t, n, r, i, a, o, s = {}) {
	if (i <= 0 || a <= 0) return !1;
	let c = e.getTransform(), l = Math.abs(c.a * c.d - c.b * c.c), u = l > 0 ? Math.sqrt(l) : 1, d = s.backDepthCss ?? 0, { face: f, corners: p, backFacing: m, padDev: h } = fo(t, i, a, d, s.edgePadCss, u), g = p, _ = h, v = h, y = Math.max(1, Math.ceil(i * u) + 2 * h), b = Math.max(1, Math.ceil(a * u) + 2 * h);
	if (s.measureOverflow) {
		let t = fn(e, (e) => o(e, 0, 0, i, a));
		if (t) {
			let e = Math.min(-h, Math.floor(t.x * u) - 1), n = Math.min(-h, Math.floor(t.y * u) - 1), r = Math.max(y - h, Math.ceil((t.x + t.w) * u) + 1), o = Math.max(b - h, Math.ceil((t.y + t.h) * u) + 1), s = [
				[e, n],
				[r, n],
				[r, o],
				[e, o]
			].map(([e, t]) => Vt(f, e / u / i, t / u / a));
			if (s.some((e) => !e)) return Vt(f, .5, .5) === null;
			g = s, _ = -e, v = -n, y = r - e, b = o - n;
		}
	}
	if (s.measureOverflow && (!Number.isFinite(y * b) || y > 32767 || b > 32767 || y * b > 16777216)) return !1;
	let x = te(y, b);
	if (!x) return !1;
	let S = x.getContext("2d");
	if (!S) return !1;
	S.save(), S.scale(u, u), S.translate(_ / u, v / u), s.preservePatternFrame ? U(e, S, () => o(S, 0, 0, i, a), void 0, ko(c, u, _, n, r, v)) : o(S, 0, 0, i, a), S.restore();
	let C = Math.ceil(i * u), w = Math.ceil(a * u), T = (e) => ({
		x: _ - e,
		y: v - e,
		w: C + 2 * e,
		h: w + 2 * e
	}), E = s.extrusion && m && d > 0 ? {
		...s.extrusion,
		offsetX: -s.extrusion.offsetX,
		offsetY: -s.extrusion.offsetY
	} : s.extrusion, D = s.bevels?.some((e) => e.material === "legacyWireframe"), O = m && s.bevels?.some((e) => e.bottom), k = () => {
		!E || D || ir(S, E, T(Math.ceil(Math.hypot(E.offsetX, E.offsetY)) + 2));
	};
	if (O || k(), s.bevels && s.bevels.length > 0) for (let e of s.bevels) {
		let t = D && E ? {
			x: E.offsetX,
			y: E.offsetY
		} : void 0, n = e.widthPx + (t ? Math.hypot(t.x, t.y) : 0);
		rr(S, t ? {
			...e,
			wireframeDepth: t
		} : e, T(Math.ceil(n) + 2));
	}
	O && k(), s.paintEdges && (S.save(), S.scale(u, u), S.translate(_ / u, v / u), s.paintEdges(S, 0, 0, i, a), S.restore());
	let A = g.map((e) => ({
		x: n + e.x,
		y: r + e.y
	}));
	return Ut(x, e, y, b, A), !0;
}
function jo(e, t, n, r, i, a, o, s, c = 0) {
	if (r <= 0 || i <= 0 || a.length === 0) return !1;
	let l = e.getTransform(), u = Math.abs(l.a * l.d - l.b * l.c), d = u > 0 ? Math.sqrt(u) : 1, f = Math.max(0, Math.ceil(c * d)), p = f / d, m = Math.max(1, Math.ceil(r * d) + 2 * f), h = Math.max(1, Math.ceil(i * d) + 2 * f), g = te(m, h);
	if (!g) return !1;
	let _ = g.getContext("2d");
	if (!_) return !1;
	_.save(), _.scale(d, d), _.translate(p, p), U(e, _, () => o(_, 0, 0, r, i), void 0, ko(l, d, f, t, n)), _.restore();
	let v = Math.ceil(r * d), y = Math.ceil(i * d);
	for (let e of a) {
		let t = Math.ceil(e.widthPx) + 2;
		rr(_, e, {
			x: f - t,
			y: f - t,
			w: v + 2 * t,
			h: y + 2 * t
		});
	}
	return s && (_.save(), _.scale(d, d), _.translate(p, p), s(_, 0, 0, r, i), _.restore()), e.drawImage(g, t - p, n - p, m / d, h / d), !0;
}
var Mo = /* @__PURE__ */ new WeakMap();
function No(e) {
	let t = Mo.get(e);
	return t || (t = async (t, n) => {
		let r = await e(t);
		return r.type === n ? r : new Blob([r], { type: n });
	}, Mo.set(e, t)), t;
}
function Po(e, t, n = No(t), r, i, a) {
	let o = No(t);
	return nt(e.posterPath, e.posterMimeType || "application/octet-stream", o, {
		tiff: r,
		svgDecoder: a,
		...i ?? {}
	}, n).then((e) => {
		if (!e) throw Error("Media poster could not be decoded");
		return e;
	});
}
function Fo(e, t, n, r = "tiff") {
	let i = Z(t.x, n), a = Z(t.y, n), o = Z(t.width, n), s = Z(t.height, n);
	e.save();
	try {
		t.alpha != null && (e.globalAlpha *= t.alpha), (t.rotation !== 0 || t.flipH || t.flipV) && (e.translate(i + o / 2, a + s / 2), e.rotate(t.rotation * Math.PI / 180), e.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1), e.translate(-(i + o / 2), -(a + s / 2))), Mt(e, r, {
			x: i,
			y: a,
			width: o,
			height: s
		});
	} finally {
		e.restore();
	}
}
async function Io(e, t, n, i, a = 1, o, s) {
	if (e.mimeType === "image/x-pict") return { paint: (n) => Fo(n, e, t, "pict") };
	if (!n) return Ia;
	try {
		let c = e.mimeType === "image/svg+xml", l = pe(e.mimeType, e.srcRect, e.width / h, e.height / h);
		if (!l) return Ia;
		let { widthPt: u, heightPt: d } = l, f = Fi(Z(e.width, t), Z(e.height, t), a, e.srcRect), p = Re(e) || c, m = p ? f : s && !Q(e) ? Bi(s, zi(Vi(e), p ? void 0 : Q(e))) : void 0, g = m && "maxRetainedPixels" in m ? m.maxRetainedPixels : void 0, _ = {
			...m ? {
				targetWidthPx: m.targetWidthPx,
				targetHeightPx: m.targetHeightPx,
				...g === void 0 ? {} : { maxRetainedPixels: g }
			} : {},
			workerDecoder: o
		}, v;
		if (!Q(e) && Re(e)) try {
			v = await ct(e.svgImagePath, n, _);
		} catch (t) {
			if (t instanceof J || Li(t) || kt(t)) throw t;
			v = c ? await ct(e.imagePath, n, _) : await Ze(e.imagePath, e.mimeType, Q(e), n, {
				widthPt: u,
				heightPt: d,
				...m ?? {},
				tiff: i
			});
		}
		else if (c && !Q(e)) v = await ct(e.imagePath, n, _);
		else {
			let t = e.blipEffects?.length ? r(e.width / h, e.height / h, e.srcRect, null) : null;
			v = await Ze(e.imagePath, e.mimeType, Q(e), n, {
				widthPt: t?.width ?? u,
				heightPt: t?.height ?? d,
				...m ?? {},
				tiff: i,
				svgDecoder: o
			});
		}
		if (!v) return Ia;
		let y = v;
		return { paint: (n) => Ro(n, e, y, t) };
	} catch (n) {
		return Lo(e, t, n);
	}
}
function Lo(e, t, n) {
	return It(n, "tiff") ? { paint: (n) => Fo(n, e, t) } : n instanceof J || Li(n) || kt(n) || Bt(n) ? {
		...Ia,
		failure: { error: n }
	} : Ia;
}
function Ro(e, t, n, r) {
	try {
		e.save(), t.alpha != null && (e.globalAlpha *= t.alpha);
		let i = Z(t.x, r), a = Z(t.y, r), o = Z(t.width, r), s = Z(t.height, r);
		(t.rotation !== 0 || t.flipH || t.flipV) && (e.translate(i + o / 2, a + s / 2), e.rotate(t.rotation * Math.PI / 180), t.flipH && e.scale(-1, 1), t.flipV && e.scale(1, -1), e.translate(-(i + o / 2), -(a + s / 2)));
		let c = (e, n, r, i, a) => {
			t.custGeom && t.custGeom.length > 0 ? yo(e, t.custGeom, n, r, i, a) : t.prstGeom && Ae(e, t.prstGeom, n, r, i, a, t.prstAdjust ?? []) || e.rect(n, r, i, a);
		}, l = (e, t, n, r, i) => {
			e.beginPath(), c(e, t, n, r, i);
		}, u = (e, r, i, a, o) => {
			!(t.prstGeom === "rect" && !t.custGeom?.length && B(n)) && (t.prstGeom || t.custGeom && t.custGeom.length > 0) && (l(e, r, i, a, o), e.clip());
		}, d = (e, n, i, a, o) => {
			t.stroke && (A(t.stroke?.fill) && (e = ae(e)), e.save(), l(e, n, i, a, o), Vo(e, t.stroke, r, {
				x: n,
				y: i,
				w: a,
				h: o
			}, t.rotation), e.stroke(), e.restore());
		}, f = (e, n, i, a, o) => {
			let s = t.sp3d;
			if (s && (s.contourW ?? 0) > 0 && s.contourClr) {
				let t = Math.max(.5, s.contourW * r);
				e.save(), e.beginPath();
				let u = t * 2 + Math.max(a, o);
				e.rect(n - u, i - u, a + 2 * u, o + 2 * u), c(e, n, i, a, o), e.clip("evenodd"), e.beginPath(), l(e, n, i, a, o), e.strokeStyle = $(s.contourClr), e.lineWidth = t * 2, e.setLineDash([]), e.stroke(), e.restore();
			}
		}, p = t.scene3d && {
			...t.scene3d.camera,
			unitsPerInch: 914400 * r,
			sceneDepth: (t.sp3d?.extrusionH ?? 0) * r
		}, m = p && En(p, o, s, (t.sp3d?.extrusionH ?? 0) * r) ? {
			...t.scene3d,
			camera: p
		} : null, g = (e, i, a, o, s) => {
			let d = t.fill && t.fill.fillType !== "none" && t.fill.fillType !== "image" ? Ji(t.fill, e, i, a, o, s, t.rotation, r * h, c) : null;
			d && (e.save(), l(e, i, a, o, s), e.fillStyle = d, e.fill(), e.restore()), e.save(), u(e, i, a, o, s), he(e, n, t.srcRect, i, a, o, s), e.restore();
		}, _ = (e, t, n, r, i) => {
			g(e, t, n, r, i), d(e, t, n, r, i), f(e, t, n, r, i);
		}, v = (e, t, n, r, i) => {
			g(e, t, n, r, i), d(e, t, n, r, i);
		}, y = e.getTransform(), b = Math.abs(y.a * y.d - y.b * y.c), x = b > 0 ? Math.sqrt(b) : 1, S = Do(t.sp3d, t.scene3d?.lightRig, t.sp3d ? t.sp3d.prstMaterial : void 0, r, x, t.scene3d?.camera), C = (S.find((e) => e.bottom)?.depthPx ?? 0) / x, w = m ? Oo(t.sp3d, m.camera, o, s, r, x) : null, T = t.stroke ? t.stroke.width * r / 2 : 0, E = t.sp3d?.contourW ? t.sp3d.contourW * r : 0, D = w ? Math.hypot(w.offsetX, w.offsetY) / x : 0, O = T + E + D + 2, k = (e) => {
			if (m) {
				if (Ao(e, m.camera, i, a, o, s, v, {
					bevels: S,
					backDepthCss: C,
					extrusion: w ?? void 0,
					paintEdges: f,
					edgePadCss: O
				})) return;
			} else if (S.length > 0 && jo(e, i, a, o, s, S, v, f, O)) return;
			_(e, i, a, o, s);
		}, j = (e, t, n, r, i, a) => {
			e.save(), u(e, n, r, i, a), e.fillStyle = t, e.fillRect(n, r, i, a), e.restore();
		}, M = e.getTransform(), N = Math.abs(M.a * M.d - M.b * M.c), P = N > 0 ? Math.sqrt(N) : 1, F = T + E, I = (t.custGeom && t.custGeom.length > 0 ? we(t.custGeom, i, a, o, s) : t.prstGeom && Ee(t.prstGeom.toLowerCase()) ? Ce(t.prstGeom.toLowerCase(), i, a, o, s, t.prstAdjust ?? []) : null) ?? {
			x: i,
			y: a,
			w: o,
			h: s
		}, L = m ? po(m.camera, M, i, a, o, s, O, t.shadow?.algn, C) : {
			bbox: so(M, I.x - F, I.y - F, I.w + F * 2, I.h + F * 2),
			anchor: uo(M, i, a, o, s, t.shadow?.algn)
		}, R = r * P, z = !!(t.shadow || t.innerShadow || t.glow || t.softEdge || t.reflection), V = (e) => j(e, "#000", i, a, o, s), H = m && z ? mo(k, M, L.bbox, {
			w: e.canvas.width || 0,
			h: e.canvas.height || 0
		}) : k, U = !!m || S.length > 0;
		ho(e, t, H, U ? H : V, L.bbox, L.anchor, r, R, M, !0, U), e.restore();
	} catch (n) {
		let i = Lo(t, r, n);
		if (i.paint(e), i.failure) throw i.failure.error;
	}
}
async function zo(e, t, n, r, i, a, o = 1, s, c) {
	let l = Z(e.x, t), u = Z(e.y, t), d = Z(e.width, t), f = Z(e.height, t), p, m = !1;
	if (e.posterPath && n) try {
		p = await Po(e, n, i, a, e.posterMimeType === "image/svg+xml" ? Fi(d, f, o) : c ? Bi(c, zi(e.posterPath)) : void 0, s);
	} catch (e) {
		if (It(e, "tiff")) m = !0;
		else if (e instanceof J || Li(e) || kt(e) || Bt(e)) return {
			...Ia,
			failure: { error: e }
		};
	}
	return { paint: (n) => {
		n.save(), Ho(n, e, t), p ? n.drawImage(p, l, u, d, f) : (n.fillStyle = e.mediaKind === "video" ? "#111" : "#f0f0f0", n.fillRect(l, u, d, f), m && Mt(n, "tiff", {
			x: l,
			y: u,
			width: d,
			height: f
		})), r || zr(n, l + d / 2, u + f / 2, d, f, "paused"), n.restore();
	} };
}
function Bo(e, t, n, r, i, a, o) {
	let s = Math.max(.5, Z(r.width, a)), c = n.x - t.x, l = n.y - t.y, u = Math.hypot(c, l);
	if (u === 0) return;
	let d = -l / u, f = c / u, p;
	switch (i) {
		case "dbl":
			p = [{
				offset: -1 / 3,
				widthFrac: 1 / 3
			}, {
				offset: 1 / 3,
				widthFrac: 1 / 3
			}];
			break;
		case "thinThick":
			p = [{
				offset: -3 / 8,
				widthFrac: 1 / 4
			}, {
				offset: 1 / 4,
				widthFrac: 1 / 2
			}];
			break;
		case "thickThin":
			p = [{
				offset: -1 / 4,
				widthFrac: 1 / 2
			}, {
				offset: 3 / 8,
				widthFrac: 1 / 4
			}];
			break;
		case "tri":
			p = [
				{
					offset: -2 / 5,
					widthFrac: 1 / 5
				},
				{
					offset: 0,
					widthFrac: 3 / 5
				},
				{
					offset: 2 / 5,
					widthFrac: 1 / 5
				}
			];
			break;
		default: return;
	}
	e.save(), e.globalCompositeOperation = "destination-out", e.strokeStyle = "#000", e.lineWidth = s + .5, e.setLineDash([]), e.beginPath(), e.moveTo(t.x, t.y), e.lineTo(n.x, n.y), e.stroke(), e.globalCompositeOperation = "source-over", e.strokeStyle = (r.fill ? Ji(r.fill, e, Math.min(t.x, n.x), Math.min(t.y, n.y), Math.max(1, Math.abs(n.x - t.x)), Math.max(1, Math.abs(n.y - t.y)), o, a * 12700) : null) ?? $(r.color);
	for (let i of p) {
		let c = d * (s * i.offset), l = f * (s * i.offset);
		if (e.lineWidth = Math.max(.5, s * i.widthFrac), e.beginPath(), e.moveTo(t.x + c, t.y + l), e.lineTo(n.x + c, n.y + l), r.fill && A(r.fill)) {
			let i = Ji(r.fill, e, Math.min(t.x, n.x), Math.min(t.y, n.y), Math.max(1, Math.abs(n.x - t.x)), Math.max(1, Math.abs(n.y - t.y)), o, a * h, void 0, P(e));
			i && (e.strokeStyle = i);
		}
		e.stroke();
	}
	e.restore();
}
function Vo(e, t, n, r, i = 0) {
	if (K(e, t, n), t?.fill && r) {
		let a = Ji(t.fill, e, r.x, r.y, r.w, r.h, i, n * h, void 0, P(e));
		a && (e.strokeStyle = a);
	}
}
function Ho(e, t, n) {
	if (t.rotation === 0 && !t.flipH && !t.flipV) return;
	let r = Z(t.x, n), i = Z(t.y, n), a = Z(t.width, n), o = Z(t.height, n);
	e.translate(r + a / 2, i + o / 2), e.rotate(t.rotation * Math.PI / 180), t.flipH && e.scale(-1, 1), t.flipV && e.scale(1, -1), e.translate(-(r + a / 2), -(i + o / 2));
}
function Uo(e, t, n, r, i = {
	themeMajorFont: null,
	themeMinorFont: null,
	dpr: 1
}, a) {
	e.save(), Ho(e, t, n);
	let o = Z(t.x, n), s = Z(t.y, n), c = (e) => e.spcFirstLastPara ? {
		...e,
		spcFirstLastPara: !1
	} : e, l = t.cols.map((e) => Z(e, n)), u = l.length, d = (e, t) => {
		let n = 0;
		for (let r = 0; r < t; r++) n += l[e + r] ?? 0;
		return n;
	}, f = [...t.rows.map((e) => Z(e.height, n))], p = t.rows.reduce((e, t) => e + t.height, 0), m = t.height > p;
	for (let a = 0; a < t.rows.length; a++) {
		let o = t.rows[a];
		for (let t = 0; t < o.cells.length; t++) {
			let s = o.cells[t];
			if (s.hMerge || s.vMerge || (s.rowSpan || 1) > 1 || !s.textBody || o.height > 0 && !m) continue;
			let l = d(t, s.gridSpan || 1), u = Eo(e, c(s.textBody), 0, 0, l, 0, n, null, 0, !1, !1, "#000000", r, i, void 0, !0, void 0, !1, o.height === 0) || 0;
			u > f[a] && (f[a] = u);
		}
	}
	for (let a = 0; a < t.rows.length; a++) {
		let o = t.rows[a];
		for (let s = 0; s < o.cells.length; s++) {
			let l = o.cells[s];
			if (l.hMerge || l.vMerge) continue;
			let u = l.rowSpan || 1;
			if (u <= 1 || !l.textBody) continue;
			let p = d(s, l.gridSpan || 1), h = t.rows.slice(a, Math.min(t.rows.length, a + u)).some((e) => e.height === 0);
			if (!h && !m) continue;
			let g = Eo(e, c(l.textBody), 0, 0, p, 0, n, null, 0, !1, !1, "#000000", r, i, void 0, !0, void 0, !1, h) || 0, _ = 0;
			for (let e = 0; e < u && a + e < f.length; e++) _ += f[a + e];
			if (g > _) {
				let e = (g - _) / u;
				for (let t = 0; t < u && a + t < f.length; t++) f[a + t] += e;
			}
		}
	}
	let g = l.reduce((e, t) => e + t, 0), _ = Array(u);
	if (t.rtl) {
		let e = o + g;
		for (let t = 0; t < u; t++) e -= l[t], _[t] = e;
	} else {
		let e = o;
		for (let t = 0; t < u; t++) _[t] = e, e += l[t];
	}
	let v = (e, n) => t.rtl ? _[e + n - 1] : _[e], y = Array(t.rows.length);
	{
		let e = s;
		for (let n = 0; n < t.rows.length; n++) y[n] = e, e += f[n];
	}
	let b, S, C = {
		row: 0,
		column: 0
	};
	if (a) {
		let e = Z(t.width, n), r = Z(t.height, n), i = o + e / 2, c = s + r / 2, l = t.rotation * Math.PI / 180, u = Math.cos(l), d = Math.sin(l);
		b = (e) => {
			let n = e.shapeX + e.shapeW / 2 - i, r = e.shapeY + e.shapeH / 2 - c;
			t.flipH && (n = -n), t.flipV && (r = -r);
			let o = i + u * n - d * r, s = c + d * n + u * r;
			a({
				...e,
				...t.id === void 0 ? {} : { shapeId: t.id },
				shapeX: o - e.shapeW / 2,
				shapeY: s - e.shapeH / 2,
				rotation: t.rotation,
				...t.flipH ? { shapeFlipH: !0 } : {},
				...t.flipV ? { shapeFlipV: !0 } : {},
				tableCell: C,
				...S === void 0 ? {} : { cellHorzOverflow: S }
			});
		};
	}
	let w = [], T = t.rows.map(() => Array(u).fill(-1));
	for (let e = 0; e < t.rows.length; e++) {
		let n = t.rows[e], r = y[e];
		for (let i = 0; i < n.cells.length; i++) {
			let a = n.cells[i];
			if (a.hMerge || a.vMerge) continue;
			let o = a.gridSpan || 1, s = a.rowSpan || 1, c = d(i, o), l = 0;
			for (let t = 0; t < s; t++) l += f[e + t] ?? 0;
			let p = v(i, o), m = Math.min(e + s - 1, t.rows.length - 1), h = w.length;
			w.push({
				cell: a,
				colX: p,
				rowY: r,
				cellW: c,
				cellH: l,
				ci: i,
				ri: e,
				span: o,
				lastRi: m
			});
			for (let t = e; t <= m; t++) for (let e = i; e < i + o && e < u; e++) T[t][e] = h;
		}
	}
	let E = f.reduce((e, t) => e + t, 0), D = (r, a, o, s, c, l, u) => {
		if (r?.fillType === "image") e.beginPath(), e.rect(a, o, s, c), Ua(e, r, i.shapeFillImages?.get(Va(r, l, u, t)), {
			x: a,
			y: o,
			w: s,
			h: c
		}, n, !1, t);
		else {
			let i = Ji(r, e, a, o, s, c, t.rotation, n * h);
			i && (e.fillStyle = i, e.fillRect(a, o, s, c));
		}
	}, O = [0], k = [0];
	for (let e of t.cols) O.push(O[O.length - 1] + e);
	for (let e of t.rows) k.push(k[k.length - 1] + e.height);
	let A = O[O.length - 1], j = k[k.length - 1] || t.height;
	D(t.background ?? null, o, s, g, E, A, j);
	for (let { cell: a, colX: o, rowY: s, cellW: l, cellH: u, ci: d, ri: f } of w) {
		let p = (O[Math.min(d + (a.gridSpan || 1), t.cols.length)] ?? 0) - (O[d] ?? 0), m = k[Math.min(f + (a.rowSpan || 1), t.rows.length)] - k[f] || t.height;
		if (D(a.fill, o, s, l, u, p, m), a.textBody) {
			b && (C = {
				row: f,
				column: d
			});
			let t = a.textColor ? $(a.textColor) : null, p = a.textBody.vert;
			S = p === void 0 || typeof p == "string" && /^[ \t\r\n]*horz[ \t\r\n]*$/.test(p) ? a.horzOverflow === "overflow" ? "overflow" : "clip" : void 0, e.save();
			try {
				S === "clip" && un(e, o, l), Eo(e, c(a.textBody), o, s, l, u, n, t, 0, !1, !1, "#000000", r, i, b);
			} finally {
				e.restore();
			}
		}
	}
	let M = i.dpr, N = (e, t) => {
		if (e < 0 || e >= T.length || t < 0 || t >= u) return null;
		let n = T[e][t];
		return n < 0 ? null : w[n];
	}, P = (r, i, a, o, s) => {
		if (Vo(e, r, n, {
			x: Math.min(i, o),
			y: Math.min(a, s),
			w: Math.max(1, Math.abs(o - i)),
			h: Math.max(1, Math.abs(s - a))
		}, t.rotation), r.cmpd === "dbl" && !r.dashStyle && !r.customDash?.length && (i === o || a === s)) {
			e.fillStyle = e.strokeStyle, ht(e, i, a, o, s, Math.max(.5, Z(r.width, n)), M);
			return;
		}
		let c = i === o ? x(i, e.lineWidth, M) : 0, l = a === s ? x(a, e.lineWidth, M) : 0;
		e.beginPath(), e.moveTo(i + c, a + l), e.lineTo(o + c, s + l), e.stroke();
	};
	for (let r of w) {
		let { cell: i, colX: a, rowY: o, cellW: s, cellH: c } = r;
		e.save();
		let l = t.rtl ? i.borderR : i.borderL, p = t.rtl ? i.borderL : i.borderR, m = t.rtl ? r.ci + r.span === u : r.ci === 0, h = t.rtl ? r.ci === 0 : r.ci + r.span === u, g = t.rtl ? r.ci - 1 : r.ci + r.span, _ = (e) => t.rtl ? e.borderR : e.borderL;
		if (r.ri === 0 && i.borderT && P(i.borderT, a, o, a + s, o), m && l && P(l, a, o, a, o + c), r.lastRi === t.rows.length - 1) {
			let e = i.borderB;
			e && P(e, a, o + c, a + s, o + c);
		} else {
			let e = r.lastRi + 1, t = o + c, n = Math.min(r.ci + r.span, u), a = r.ci;
			for (; a < n;) {
				let r = T[e][a], o = a + 1;
				for (; o < n && T[e][o] === r;) o++;
				let s = N(e, a), c = qr(i.borderB, s ? s.cell.borderT : null);
				if (c) {
					let e = v(a, o - a);
					P(c, e, t, e + d(a, o - a), t);
				}
				a = o;
			}
		}
		if (h) {
			let e = p;
			e && P(e, a + s, o, a + s, o + c);
		} else {
			let e = a + s, t = r.ri;
			for (; t <= r.lastRi;) {
				let n = T[t][g], i = t;
				for (; i + 1 <= r.lastRi && T[i + 1][g] === n;) i++;
				let a = N(t, g), o = qr(p, a ? _(a.cell) : null);
				o && P(o, e, y[t], e, y[i] + f[i]), t = i + 1;
			}
		}
		i.diagonalTL && (Vo(e, i.diagonalTL, n, {
			x: a,
			y: o,
			w: s,
			h: c
		}, t.rotation), e.beginPath(), e.moveTo(a, o), e.lineTo(a + s, o + c), e.stroke()), i.diagonalTR && (Vo(e, i.diagonalTR, n, {
			x: a,
			y: o,
			w: s,
			h: c
		}, t.rotation), e.beginPath(), e.moveTo(a + s, o), e.lineTo(a, o + c), e.stroke()), e.restore();
	}
	e.restore();
}
function Wo(e, t, n, r) {
	e.save(), e.globalAlpha = t.opacity, e.fillStyle = t.color, e.fillRect(0, 0, n, r), e.restore();
}
var Go = /* @__PURE__ */ new WeakMap();
function Ko(e) {
	Go.set(e, (Go.get(e) ?? 0) + 1);
}
function qo(e, t, n, r, i) {
	e.save(), e.fillStyle = "#f7f7f8", e.fillRect(0, 0, t, n);
	let a = Math.max(12, Math.min(t, n) * .04);
	e.strokeStyle = "#c8ccd2", e.lineWidth = Math.max(1, Math.min(t, n) * .004), e.setLineDash([e.lineWidth * 6, e.lineWidth * 5]), e.strokeRect(a, a, t - a * 2, n - a * 2), e.setLineDash([]);
	let o = t / 2, s = Math.max(18, Math.min(t, n) * .14);
	e.fillStyle = "#b23b3b", e.textAlign = "center", e.textBaseline = "middle", e.font = `${s}px sans-serif`, e.fillText("⚠", o, n * .34);
	let c = Math.max(11, Math.min(t, n) * .045);
	e.fillStyle = "#333333", e.font = `600 ${c}px sans-serif`, e.fillText(`Slide ${r} could not be displayed`, o, n * .52);
	let l = Math.max(9, Math.min(t, n) * .028);
	e.fillStyle = "#666666", e.font = `${l}px sans-serif`;
	let u = t - a * 4, d = i.split(/\s+/), f = [], p = "";
	for (let t of d) {
		let n = p ? `${p} ${t}` : t;
		if (e.measureText(n).width > u && p ? (f.push(p), p = t) : p = n, f.length >= 4) break;
	}
	p && f.length < 4 && f.push(p);
	let m = l * 1.35, h = n * .6 + m;
	for (let t of f.slice(0, 4)) e.fillText(t, o, h), h += m;
	e.restore();
}
async function Jo(e, t, n, r, i = {}, a) {
	return Yo(e, t, n, r, i, a);
}
async function Yo(e, t, n, r, i = {}, a) {
	let o = i.fetchImage ?? (i.fetchMedia ? No(i.fetchMedia) : void 0), s = (Go.get(e) ?? 0) + 1;
	Go.set(e, s);
	let c = () => Go.get(e) !== s, l = () => c() ? Promise.resolve(e) : Xo(e, t, n, r, i, a, o, c);
	return o && Ki(t) ? mt(o, i.imageResources, l) : l();
}
async function Xo(e, t, n, i, a = {}, o, s, c = () => !1) {
	let l = a.svgDecoder ?? (typeof Image < "u" ? Be : void 0), u = a.width ?? ((_e(e) ? e.offsetWidth : 0) || 960), d = u / n, f = Math.round(u), p = Math.round(i * d), m = a.dpr ?? je(), g = C(f * m, p * m), _ = g.clamped ? m * g.scale : m;
	if (a.math && (await na(t, a.math), c())) return e;
	let v, y = t;
	if (a.math) {
		let e = [0], n = /* @__PURE__ */ new Map();
		for (let n of t.elements) {
			let t = !1;
			for (let e of ea(n)) if (e.paragraphs.some((e) => e.runs.some((e) => e.type === "math" && $i.has(e.nodes)))) {
				t = !0;
				break;
			}
			e.push(e[e.length - 1] + +!!t);
		}
		t.elements.forEach((r, i) => {
			if (r.type !== "shape" && r.type !== "table" || !r.mathFallback) return;
			let a = r.mathFallback, o = i - a.before, s = i + a.after + 1;
			o >= 0 && s <= t.elements.length && e[s] > e[o] && s > (n.get(o)?.end ?? o) && n.set(o, {
				end: s,
				elements: a.elements
			});
		});
		let r = [];
		v = [];
		for (let e = 0; e < t.elements.length;) {
			let i = n.get(e);
			if (i) {
				for (let e of i.elements) r.push(e), v.push(void 0);
				e = i.end;
			} else v.push(e), r.push(t.elements[e++]);
		}
		t = {
			...t,
			elements: r
		};
	}
	let b = await Ui(t, f, p, d, _, a.imageResources, a.fetchImage, a.fetchMedia, s, a.tiff), x = () => {
		e.width = g.width, e.height = g.height, _e(e) && (e.style.width = `${f}px`, e.style.display || (e.style.display = "block"));
		let t = e.getContext("2d");
		if (!t) throw Error("Could not get 2D context");
		return t.scale(_, _), t;
	};
	if (t.parseError) return qo(x(), f, p, t.slideNumber, t.parseError), e;
	let S = t.theme ? t.theme.defaultTextColor : a.defaultTextColor, w = S ? `#${S}` : "#000000", E = a.parsedTextChain ? "#000000" : w, D = /* @__PURE__ */ new Map(), O = /* @__PURE__ */ new Map(), A = {
		cjkFallback: a.cjkFallback ? Nr(t, t.theme ? t.theme.majorFont : a.majorFont ?? null, t.theme ? t.theme.minorFont : a.minorFont ?? null, a.cjkFallback) : void 0,
		themeMajorFont: t.theme ? t.theme.majorFont : a.majorFont ?? null,
		themeMinorFont: t.theme ? t.theme.minorFont : a.minorFont ?? null,
		themeHlinkColor: t.theme ? t.theme.hlinkColor : a.hlinkColor ?? null,
		embeddedFontAliases: a.embeddedFontAliases,
		embeddedFontAuthoredFamilies: a.embeddedFontAuthoredFamilies,
		embeddedFontTuples: a.embeddedFontTuples,
		officeFontRoutes: a.officeFontRoutes,
		officeInstalledFamilies: a.officeInstalledFamilies,
		googleSubstitutes: a.googleSubstitutes,
		dpr: _,
		smartArtFallbackTextColor: Zr(t.background, w) ?? w,
		pictureBulletImages: D,
		shapeFillImages: O
	}, M = [], N = () => M.some((e) => e.failure);
	if (M.push(await La(t.background, f, p, d, a.fetchImage, a.tiff, l, b)), c()) return e;
	let P = t.slideNumber, F = N() ? [] : t.elements.map((e) => e.type === "picture" ? Io(e, d, a.fetchImage, a.tiff, _, l, b) : e.type === "media" ? zo(e, d, a.fetchMedia, a.skipMediaControls, s, a.tiff, _, l, b) : Promise.resolve(null)).map((e) => e.catch((e) => ({
		...Ia,
		failure: { error: e }
	}))), I = /* @__PURE__ */ new Map();
	if (!N() && a.fetchImage) {
		let n = a.fetchImage, i = /* @__PURE__ */ new Map();
		for (let { fill: e, width: n, height: a, host: o } of Gi(t)) {
			if (!(n > 0) || !(a >= 0)) continue;
			let t = e.blipEffects?.length && !e.tile ? r(n, a, e.srcRect, e.fillRect) : {
				width: n,
				height: a
			}, s = Va(e, n, a, o), c = i.get(s), l = t.width / h, u = t.height / h, f = e.fillRect ?? {}, p = Fi(Z(n, d) * (1 - (f.l ?? 0) - (f.r ?? 0)), Z(a, d) * (1 - (f.t ?? 0) - (f.b ?? 0)), _, e.srcRect);
			i.set(s, c ? {
				fill: c.fill,
				host: c.host,
				widthPt: Math.max(c.widthPt, l),
				heightPt: Math.max(c.heightPt, u),
				targetWidthPx: Math.max(c.targetWidthPx ?? 0, p?.targetWidthPx ?? 0) || void 0,
				targetHeightPx: Math.max(c.targetHeightPx ?? 0, p?.targetHeightPx ?? 0) || void 0,
				preserveNaturalSize: c.preserveNaturalSize || e.tile != null,
				hasSourceCrop: c.hasSourceCrop || e.srcRect != null
			} : {
				fill: e,
				host: o,
				widthPt: l,
				heightPt: u,
				targetWidthPx: p?.targetWidthPx,
				targetHeightPx: p?.targetHeightPx,
				preserveNaturalSize: e.tile != null,
				hasSourceCrop: e.srcRect != null
			});
		}
		let o = /* @__PURE__ */ new Map(), s = [];
		for (let e of t.elements) {
			if (e.type !== "chart" || !Number.isFinite(e.width) || e.width <= 0 || !Number.isFinite(e.height) || e.height <= 0) continue;
			let t = {
				widthPt: e.width / h,
				heightPt: e.height / h,
				targetWidthPx: Z(e.width, d) * _,
				targetHeightPx: Z(e.height, d) * _
			}, n = [], r = !0;
			for (let i of W(e.chart)) {
				let e = j(i, t);
				if (!e) {
					r = !1;
					break;
				}
				n.push({
					usage: i,
					size: e
				});
			}
			r && s.push({
				element: e,
				frame: t,
				usages: n
			});
		}
		let u = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Set();
		for (let e of L(s.map(({ element: e }) => e.chart), (e, t) => j(e, s[t].frame) != null)) f.add(T(e.fill));
		for (let { element: e, usages: t } of s) {
			let n = {
				rotation: e.rotation,
				flipH: e.flipH,
				flipV: e.flipV
			};
			for (let { usage: e, size: r } of t) {
				let { fill: t } = e;
				if (!f.has(T(t)) || ne(t)) continue;
				let i = z(t, n), a = u.get(i) ?? {
					fill: t,
					widthPt: 0,
					heightPt: 0,
					preserveNaturalSize: e.preserveNaturalSize,
					hasSourceCrop: e.hasSourceCrop,
					...t.blipEffects?.length ? { host: n } : {}
				}, o = a.preserveNaturalSize || e.preserveNaturalSize, s = a.hasSourceCrop || e.hasSourceCrop, c = !Q(t) && (t.mimeType === "image/svg+xml" || Re({
					svgImagePath: t.svgImagePath,
					srcRect: s ? !0 : null
				})), l = o || Q(t) || c ? void 0 : Bi(b, zi(t.imagePath, Q(t)));
				u.set(i, {
					...a,
					widthPt: Math.max(a.widthPt, r.widthPt),
					heightPt: Math.max(a.heightPt, r.heightPt),
					targetWidthPx: o ? void 0 : l?.targetWidthPx ?? (c && Math.max(a.targetWidthPx ?? 0, r.targetWidthPx ?? 0) || void 0),
					targetHeightPx: o ? void 0 : l?.targetHeightPx ?? (c && Math.max(a.targetHeightPx ?? 0, r.targetHeightPx ?? 0) || void 0),
					maxRetainedPixels: l?.maxRetainedPixels,
					preserveNaturalSize: o,
					hasSourceCrop: s
				});
			}
		}
		let p = (e) => {
			let t = [];
			for (let { element: n } of s) {
				let r = {
					rotation: n.rotation,
					flipH: n.flipH,
					flipV: n.flipV
				};
				for (let { fill: i, occurrence: o } of Lt(n.chart, {
					x: Z(n.x, d),
					y: Z(n.y, d),
					w: Z(n.width, d),
					h: Z(n.height, d)
				}, h * d, n.rotation, a.threeD, a.regionMap, a.chartEx, e ? le(I, r, !1) : void 0)) {
					if (!f.has(T(i))) continue;
					let e = se(i, r, o);
					u.has(e) || (u.set(e, {
						fill: i,
						widthPt: o.widthPt,
						heightPt: o.heightPt,
						preserveNaturalSize: !0,
						hasSourceCrop: i.srcRect != null,
						host: r,
						renderedSize: o
					}), t.push(e));
				}
			}
			return zt(u.size), t;
		};
		p(!1);
		for (let e of t.elements) if (!(e.type !== "shape" || !e.textBody)) for (let t of e.textBody.paragraphs) {
			let n = Pr(t.bullet);
			if (n.type === "blip") {
				let r = ba(e.textBody, t, n) * h * d * _, i = o.get(n.imagePath);
				i ? Number.isFinite(r) && r > 0 && (i.targetHeightPx = Math.max(i.targetHeightPx ?? 0, r)) : o.set(n.imagePath, {
					mimeType: n.mimeType,
					...Number.isFinite(r) && r > 0 ? { targetHeightPx: r } : {}
				});
			}
		}
		if (o.size > 0 || u.size > 0 || i.size > 0) {
			let t = [...o].map(async ([e, { mimeType: t, targetHeightPx: r }]) => {
				try {
					let i = t === "image/svg+xml" ? r === void 0 ? {} : {
						targetWidthPx: 1,
						targetHeightPx: r
					} : Bi(b, zi(e)) ?? {}, o = t === "image/svg+xml" ? await ct(e, n, {
						...i,
						workerDecoder: l
					}) : await nt(e, t, n, {
						tiff: a.tiff,
						...i
					});
					D.set(e, o);
				} catch (t) {
					if (It(t, "tiff")) {
						D.set(e, null);
						return;
					}
					if (t instanceof J || Li(t) || kt(t) || Bt(t)) throw t;
					D.set(e, null);
				}
			}), r = async ([e, t]) => {
				let { fill: r, widthPt: i, heightPt: o, targetWidthPx: s, targetHeightPx: c, maxRetainedPixels: u, hasSourceCrop: d, host: f, renderedSize: p } = t, m = s && c ? {
					targetWidthPx: s,
					targetHeightPx: c,
					...u === void 0 ? {} : { maxRetainedPixels: u }
				} : void 0;
				try {
					let t = () => r.mimeType === "image/svg+xml" && !Q(r) ? ct(r.imagePath, n, {
						...m ?? {},
						workerDecoder: l
					}) : Ze(r.imagePath, r.mimeType, k(r, f, p) ?? void 0, n, {
						widthPt: p ? p.widthPt : r.blipEffects?.length ? 0 : i,
						heightPt: p ? p.heightPt : r.blipEffects?.length ? 0 : o,
						...m ?? {},
						failClosedOnDuotoneFailure: !0,
						tiff: a.tiff,
						svgDecoder: l
					}), s, c = {
						svgImagePath: r.svgImagePath,
						srcRect: d ? !0 : null
					};
					if (!Q(r) && Re(c)) try {
						s = await ct(c.svgImagePath, n, {
							...m ?? {},
							workerDecoder: l
						});
					} catch (e) {
						if (e instanceof J || Li(e) || kt(e)) throw e;
						s = await t();
					}
					else s = await t();
					I.set(e, s);
				} catch (t) {
					if (It(t, "tiff")) {
						I.set(e, null);
						return;
					}
					if (t instanceof J || Li(t) || kt(t) || Bt(t)) throw t;
					I.set(e, null);
				}
			}, s = [(async () => {
				for (await Promise.all([...u].map(r));;) {
					let e = p(!0);
					if (e.length === 0) break;
					await Promise.all(e.map((e) => r([e, u.get(e)])));
				}
			})()], d = [...i].map(async ([e, { fill: t, host: r, widthPt: i, heightPt: o, targetWidthPx: s, targetHeightPx: c, preserveNaturalSize: u, hasSourceCrop: d }]) => {
				let f = t.mimeType === "image/svg+xml" || !Q(t, r) && Re({
					svgImagePath: t.svgImagePath,
					srcRect: d ? !0 : null
				}), p = !u && !Q(t, r) ? Bi(b, zi(t.imagePath, Q(t, r))) : void 0, m = f ? !u && s && c ? {
					targetWidthPx: s,
					targetHeightPx: c
				} : void 0 : p;
				try {
					let s = u ? (await Ii(t, Ye(t.imagePath, t.mimeType, n))).dimensions ?? void 0 : void 0, c = () => t.mimeType === "image/svg+xml" && !Q(t, r) ? ct(t.imagePath, n, {
						...m ?? {},
						workerDecoder: l
					}) : Ze(t.imagePath, t.mimeType, Q(t, r), n, {
						...Ri(t, i, o),
						...m ?? {},
						failClosedOnDuotoneFailure: !0,
						tiff: a.tiff,
						svgDecoder: l
					}), f;
					if (!Q(t, r) && Re({
						svgImagePath: t.svgImagePath,
						srcRect: d ? !0 : null
					})) try {
						f = await ct(t.svgImagePath, n, {
							...m ?? {},
							workerDecoder: l
						});
					} catch (e) {
						if (e instanceof J || Li(e) || kt(e)) throw e;
						f = await c();
					}
					else f = await c();
					O.set(e, f ? {
						image: f,
						intrinsicSize: s
					} : null);
				} catch (t) {
					if (It(t, "tiff")) {
						O.set(e, null);
						return;
					}
					if (t instanceof J || Li(t) || kt(t) || Bt(t)) throw t;
					O.set(e, null);
				}
			});
			try {
				await Promise.all([
					...t,
					...s,
					...d
				]);
			} catch (e) {
				M.push({
					...Ia,
					failure: { error: e }
				});
			}
			if (c()) return e;
		}
	}
	let R = [];
	if (!N()) for (let t of F) {
		let n = await t;
		if (c()) return e;
		if (R.push(n), n?.failure) break;
	}
	if (c()) return e;
	let B = x();
	for (let e of M) if (e.paint(B), e.failure) throw e.failure.error;
	let V = {
		a: _,
		d: _
	};
	for (let [n, r] of t.elements.entries()) {
		if (c()) return e;
		let t = v ? v[n] : n, i = o ? (e) => {
			o(t === void 0 ? {
				...e,
				renderElementIndex: n,
				elementIndex: void 0,
				origin: void 0,
				shapeId: void 0
			} : {
				...e,
				renderElementIndex: n,
				elementIndex: t,
				origin: y.elementSources?.[t]?.origin ?? "slide"
			});
		} : void 0;
		if (r.type === "shape") de(B, V, () => vo(B, r, d, E, P, A, i, a.fetchImage));
		else if (r.type === "picture" || r.type === "media") {
			let e = R[n];
			if (e && (de(B, V, () => e.paint(B)), e.failure)) throw e.failure.error;
		} else if (r.type === "table") de(B, V, () => Uo(B, r, d, P, A, i));
		else if (r.type === "chart") {
			let e = h * d;
			de(B, V, () => {
				B.save(), Ho(B, r, d), Rt(B, r.chart, {
					x: Z(r.x, d),
					y: Z(r.y, d),
					w: Z(r.width, d),
					h: Z(r.height, d)
				}, e, r.rotation, a.threeD, a.regionMap, le(I, {
					rotation: r.rotation,
					flipH: r.flipH,
					flipV: r.flipV
				}), a.chartEx), B.restore();
			});
		}
	}
	return c() || a.dim && Wo(B, a.dim, f, p), e;
}
var Zo = Object.freeze({
	archiveEntryCount: 0,
	declaredInflatedBytes: 0,
	distinctInflatedBytes: 0,
	operationInflatedBytes: 0
}), Qo = Ke;
function $o(e, t) {
	if (e !== null && typeof e != "string") throw Error(`invalid PPTX presentation bootstrap ${t}`);
}
function es(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation bootstrap slide at ${t}`);
	let n = e;
	if (n.index !== t) throw Error(`invalid PPTX presentation bootstrap slide index ${n.index}`);
	if (n.partName !== void 0 && typeof n.partName != "string") throw Error(`invalid PPTX presentation bootstrap slide partName at ${t}`);
	return Object.freeze({
		index: n.index,
		...n.partName === void 0 ? {} : { partName: n.partName }
	});
}
function ts(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation bootstrap embedded font at ${t}`);
	let n = e;
	if (typeof n.fontName != "string" || n.fontName.length === 0 || ![
		"regular",
		"bold",
		"italic",
		"boldItalic"
	].includes(n.style ?? "") || typeof n.partPath != "string" || n.partPath.length === 0 || n.partPath.startsWith("/") || n.partPath.split("/").includes("..") || !["application/x-font-ttf", "application/x-fontdata"].includes(n.contentType ?? "")) throw Error(`invalid PPTX presentation bootstrap embedded font fields at ${t}`);
	return Object.freeze({
		fontName: n.fontName,
		style: n.style,
		partPath: n.partPath,
		contentType: n.contentType
	});
}
function ns(e) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error("invalid PPTX presentation bootstrap payload");
	let t = e;
	if (!Number.isSafeInteger(t.slideCount) || (t.slideCount ?? -1) < 0 || !Number.isSafeInteger(t.slideWidth) || (t.slideWidth ?? 0) <= 0 || !Number.isSafeInteger(t.slideHeight) || (t.slideHeight ?? 0) <= 0 || !Array.isArray(t.embeddedFonts) || !Array.isArray(t.slides) || t.slides.length !== t.slideCount) throw Error("invalid PPTX presentation bootstrap dimensions or slide count");
	return $o(t.defaultTextColor, "defaultTextColor"), $o(t.majorFont, "majorFont"), $o(t.minorFont, "minorFont"), $o(t.hlinkColor, "hlinkColor"), $o(t.folHlinkColor, "folHlinkColor"), Object.freeze({
		slideCount: t.slideCount,
		slideWidth: t.slideWidth,
		slideHeight: t.slideHeight,
		defaultTextColor: t.defaultTextColor,
		majorFont: t.majorFont,
		minorFont: t.minorFont,
		hlinkColor: t.hlinkColor,
		folHlinkColor: t.folHlinkColor,
		embeddedFonts: Object.freeze(t.embeddedFonts.map(ts)),
		slides: Object.freeze(t.slides.map(es))
	});
}
function rs(e) {
	return Object.freeze({
		type: "media",
		x: e.x,
		y: e.y,
		width: e.width,
		height: e.height,
		rotation: e.rotation,
		flipH: e.flipH,
		flipV: e.flipV,
		mediaKind: e.mediaKind,
		posterPath: e.posterPath,
		posterMimeType: e.posterMimeType,
		mediaPath: e.mediaPath,
		mimeType: e.mimeType
	});
}
function is(e) {
	return Object.freeze({
		...e.id === void 0 ? {} : { id: e.id },
		...e.authorId === void 0 ? {} : { authorId: e.authorId },
		...e.author === void 0 ? {} : { author: e.author },
		...e.date === void 0 ? {} : { date: e.date },
		...e.status === void 0 ? {} : { status: e.status },
		text: e.text
	});
}
function as(e) {
	return Object.freeze({ ...e });
}
function os(e) {
	return Object.freeze({
		...e.authorId === void 0 ? {} : { authorId: e.authorId },
		...e.modernAuthorId === void 0 ? {} : { modernAuthorId: e.modernAuthorId },
		...e.id === void 0 ? {} : { id: e.id },
		...e.index === void 0 ? {} : { index: e.index },
		...e.author === void 0 ? {} : { author: e.author },
		...e.date === void 0 ? {} : { date: e.date },
		...e.x === void 0 ? {} : { x: e.x },
		...e.y === void 0 ? {} : { y: e.y },
		...e.anchors?.length ? { anchors: Object.freeze(e.anchors.map(as)) } : {},
		...e.status === void 0 ? {} : { status: e.status },
		text: e.text,
		...e.replies?.length ? { replies: Object.freeze(e.replies.map(is)) } : {}
	});
}
function ss(e, t, n) {
	if (e !== void 0 && typeof e != "string") throw Error(`invalid PPTX presentation preflight comment ${t} at slide ${n}`);
}
function cs(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation preflight comment reply at slide ${t}`);
	let n = e;
	for (let e of [
		"id",
		"authorId",
		"author",
		"date",
		"status"
	]) ss(n[e], e, t);
	if (typeof n.text != "string") throw Error(`invalid PPTX presentation preflight comment reply text at slide ${t}`);
	if (n.status !== void 0 && ![
		"active",
		"resolved",
		"closed"
	].includes(n.status)) throw Error(`invalid PPTX presentation preflight comment reply status at slide ${t}`);
	return is(n);
}
function ls(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation preflight comment at slide ${t}`);
	let n = e;
	for (let e of [
		"modernAuthorId",
		"id",
		"author",
		"date",
		"status"
	]) ss(n[e], e, t);
	for (let e of [
		"authorId",
		"index",
		"x",
		"y"
	]) {
		let r = n[e];
		if (r !== void 0 && (typeof r != "number" || !Number.isSafeInteger(r))) throw Error(`invalid PPTX presentation preflight comment ${e} at slide ${t}`);
	}
	if (typeof n.text != "string" || n.replies !== void 0 && !Array.isArray(n.replies) || n.anchors !== void 0 && !Array.isArray(n.anchors)) throw Error(`invalid PPTX presentation preflight comment fields at slide ${t}`);
	if (n.status !== void 0 && ![
		"active",
		"resolved",
		"closed"
	].includes(n.status)) throw Error(`invalid PPTX presentation preflight comment status at slide ${t}`);
	return os({
		...n,
		...n.anchors?.length ? { anchors: n.anchors.map((e) => us(e, t)) } : {},
		...n.replies?.length ? { replies: n.replies.map((e) => cs(e, t)) } : {}
	});
}
function us(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation preflight comment anchor at slide ${t}`);
	let n = e;
	if (n.type === "slide" || n.type === "unknown") return Object.freeze({ type: n.type });
	if (n.type === "drawingElement") return ss(n.elementId, "anchor.elementId", t), ss(n.creationId, "anchor.creationId", t), Object.freeze({
		type: "drawingElement",
		...n.elementId === void 0 ? {} : { elementId: n.elementId },
		...n.creationId === void 0 ? {} : { creationId: n.creationId }
	});
	if (n.type === "textRange") {
		ss(n.elementId, "anchor.elementId", t);
		for (let e of ["start", "length"]) {
			let r = n[e];
			if (r !== void 0 && (typeof r != "number" || !Number.isSafeInteger(r))) throw Error(`invalid PPTX presentation preflight comment anchor.${e} at slide ${t}`);
		}
		return Object.freeze({
			type: "textRange",
			...n.elementId === void 0 ? {} : { elementId: n.elementId },
			...n.start === void 0 ? {} : { start: n.start },
			...n.length === void 0 ? {} : { length: n.length }
		});
	}
	throw Error(`invalid PPTX presentation preflight comment anchor type at slide ${t}`);
}
function ds(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation preflight media at slide ${t}`);
	let n = e;
	for (let e of [
		"x",
		"y",
		"width",
		"height",
		"rotation"
	]) if (typeof n[e] != "number" || !Number.isFinite(n[e])) throw Error(`invalid PPTX presentation preflight media ${e} at slide ${t}`);
	if (n.type !== "media" || typeof n.flipH != "boolean" || typeof n.flipV != "boolean" || n.mediaKind !== "audio" && n.mediaKind !== "video" || typeof n.posterPath != "string" || typeof n.posterMimeType != "string" || typeof n.mediaPath != "string" || typeof n.mimeType != "string") throw Error(`invalid PPTX presentation preflight media fields at slide ${t}`);
	return rs(n);
}
function fs(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error("invalid PPTX presentation preflight payload");
	let n = e;
	if (!Number.isSafeInteger(n.slideCount) || (n.slideCount ?? -1) < 0 || !Number.isSafeInteger(n.slideWidth) || (n.slideWidth ?? 0) <= 0 || !Number.isSafeInteger(n.slideHeight) || (n.slideHeight ?? 0) <= 0 || !Array.isArray(n.embeddedFonts) || !Array.isArray(n.slides) || (t ? n.slides.length > (n.slideCount ?? -1) : n.slides.length !== n.slideCount) || !Array.isArray(n.fontPreloadNames)) throw Error("invalid PPTX presentation preflight dimensions or slide count");
	$o(n.defaultTextColor, "defaultTextColor"), $o(n.majorFont, "majorFont"), $o(n.minorFont, "minorFont"), $o(n.hlinkColor, "hlinkColor"), $o(n.folHlinkColor, "folHlinkColor");
	let r = n.slides.map((e, t) => {
		if (!e || typeof e != "object" || Array.isArray(e)) throw Error(`invalid PPTX presentation preflight slide at ${t}`);
		let n = e;
		if (n.index !== t || n.partName !== void 0 && typeof n.partName != "string" || n.notes !== null && typeof n.notes != "string" || typeof n.hidden != "boolean" || !Array.isArray(n.mediaElements) || n.comments !== void 0 && !Array.isArray(n.comments)) throw Error(`invalid PPTX presentation preflight slide fields at ${t}`);
		return Object.freeze({
			index: t,
			...n.partName === void 0 ? {} : { partName: n.partName },
			notes: n.notes,
			hidden: n.hidden,
			mediaElements: Object.freeze(n.mediaElements.map((e) => ds(e, t))),
			...n.comments?.length ? { comments: Object.freeze(n.comments.map((e) => ls(e, t))) } : {}
		});
	}), i;
	if (n.fontPreloadDemand !== void 0) {
		let e = n.fontPreloadDemand;
		if (e === "all") i = "all";
		else if (Array.isArray(e) && e.every((e) => Number.isInteger(e) && e >= 0 && e <= 1114111 && !(e >= 55296 && e <= 57343))) i = Object.freeze([...new Set(e)]);
		else throw Error("invalid PPTX presentation preflight font demand");
	}
	let a = n.fontPreloadNames.map((e, t) => {
		if (e !== null && typeof e != "string") throw Error(`invalid PPTX presentation preflight font at ${t}`);
		return e;
	});
	return Object.freeze({
		slideCount: n.slideCount,
		slideWidth: n.slideWidth,
		slideHeight: n.slideHeight,
		defaultTextColor: n.defaultTextColor,
		majorFont: n.majorFont,
		minorFont: n.minorFont,
		hlinkColor: n.hlinkColor,
		folHlinkColor: n.folHlinkColor,
		embeddedFonts: Object.freeze(n.embeddedFonts.map(ts)),
		slides: Object.freeze(r),
		fontPreloadNames: Object.freeze(a),
		...i === void 0 ? {} : { fontPreloadDemand: i }
	});
}
function ps(e) {
	return fs(e, !1);
}
function ms(e) {
	return fs(e, !0);
}
function hs(e, t) {
	for (let n of e.slides) for (let e of n.mediaElements) {
		if (e.mediaPath === t) return e.mimeType;
		if (e.posterPath === t) return e.posterMimeType;
	}
	return "";
}
function gs(e, t) {
	if (e.index !== t.index || e.partName !== t.partName) throw Error(`PPTX pulled slide identity does not match bootstrap index ${t.index}`);
	return Object.freeze({
		index: t.index,
		...t.partName === void 0 ? {} : { partName: t.partName },
		notes: e.notes ?? null,
		hidden: e.hidden ?? !1,
		mediaElements: Object.freeze(e.elements.filter((e) => e.type === "media").map(rs)),
		...e.comments?.length ? { comments: Object.freeze(e.comments.map(os)) } : {}
	});
}
function _s(e, t, n) {
	if (!(e <= t)) throw new J(`PPTX presentation preflight exceeded its hard limit of ${t} projected bytes`, {
		stage: "parsing",
		violation: {
			format: "pptx",
			operation: "presentation-preflight",
			resource: "presentation-preflight",
			metric: "projected-bytes",
			limit: t,
			observed: Math.min(e, t + 1),
			configurable: !1,
			usage: n
		}
	});
}
var vs = class {
	slideCountValue;
	slideWidthValue;
	slideHeightValue;
	defaultTextColorValue;
	majorFontValue;
	minorFontValue;
	hlinkColorValue;
	folHlinkColorValue;
	embeddedFontsValue;
	descriptors;
	slides = [];
	fonts;
	fontPreloadNames;
	fontProjectionBytes;
	projectionBytesValue;
	limit;
	pending = null;
	finished = null;
	demandPoints;
	demandAll = !1;
	demandBytes = 0;
	demandMembershipBytes = 0;
	demandDeltaBytes = 0;
	collectFontDemand;
	demandDelta;
	constructor(e, t = {}) {
		let n = ns(e), r = t.maxProjectionBytes ?? Qo;
		if (!Number.isSafeInteger(r) || r <= 0 || r > Qo) throw Error("invalid PPTX presentation preflight limit");
		this.limit = r, this.collectFontDemand = t.collectFontDemand, this.demandPoints = this.collectFontDemand ? /* @__PURE__ */ new Set() : void 0, this.demandBytes = this.collectFontDemand ? tn({ fontPreloadDemand: [] }, this.limit).jsonBytes - 1 : 0, this.demandMembershipBytes = this.demandBytes, this.slideCountValue = n.slideCount, this.slideWidthValue = n.slideWidth, this.slideHeightValue = n.slideHeight, this.defaultTextColorValue = n.defaultTextColor, this.majorFontValue = n.majorFont, this.minorFontValue = n.minorFont, this.hlinkColorValue = n.hlinkColor, this.folHlinkColorValue = n.folHlinkColor, this.embeddedFontsValue = n.embeddedFonts, this.descriptors = [...n.slides], this.fonts = new Ar(this.majorFontValue, this.minorFontValue, void 0, void 0, t.cjkFallback), this.fontPreloadNames = Object.freeze(this.fonts.names()), this.fontProjectionBytes = tn(this.fontPreloadNames, this.limit).jsonBytes, this.projectionBytesValue = tn({
			slideCount: this.slideCountValue,
			slideWidth: this.slideWidthValue,
			slideHeight: this.slideHeightValue,
			defaultTextColor: this.defaultTextColorValue,
			majorFont: this.majorFontValue,
			minorFont: this.minorFontValue,
			hlinkColor: this.hlinkColorValue,
			folHlinkColor: this.folHlinkColorValue,
			embeddedFonts: this.embeddedFontsValue,
			remainingSlides: this.descriptors,
			slides: [],
			fontPreloadNames: this.fontPreloadNames
		}, this.limit).jsonBytes, this.projectionBytesValue + this.demandBytes > this.limit && (this.demandAll = !0, this.demandBytes = 0, this.demandMembershipBytes = 0), this.projectionBytesValue = on(this.projectionBytesValue, this.demandBytes, this.limit), _s(this.projectionBytesValue, this.limit, Zo);
	}
	get acceptedSlideCount() {
		return this.finished?.slideCount ?? this.slides.length;
	}
	get projectedBytes() {
		return this.projectionBytesValue;
	}
	get remainingDescriptorCount() {
		return this.descriptors.reduce((e, t) => e + Number(t !== void 0), 0);
	}
	get latestSlide() {
		return this.slides[this.slides.length - 1];
	}
	get currentFontPreloadNames() {
		return this.fontPreloadNames;
	}
	get currentFontPreloadDemandDelta() {
		return this.demandDelta;
	}
	snapshot() {
		if (this.finished) return this.finished;
		if (this.pending) throw Error("PPTX presentation preflight has an uncommitted slide");
		return Object.freeze({
			slideCount: this.slideCountValue,
			slideWidth: this.slideWidthValue,
			slideHeight: this.slideHeightValue,
			defaultTextColor: this.defaultTextColorValue,
			majorFont: this.majorFontValue,
			minorFont: this.minorFontValue,
			hlinkColor: this.hlinkColorValue,
			folHlinkColor: this.folHlinkColorValue,
			embeddedFonts: this.embeddedFontsValue,
			slides: Object.freeze([...this.slides]),
			fontPreloadNames: this.fontPreloadNames
		});
	}
	addSlide(e, t = Zo) {
		this.prepareSlide(e, t).commit();
	}
	prepareSlide(e, t = Zo) {
		if (this.finished) throw Error("PPTX presentation preflight is already finished");
		if (this.pending) throw Error("PPTX presentation preflight already has a prepared slide");
		let n = this.slides.length, r = this.descriptors[n];
		if (!r) throw Error("PPTX presentation preflight received an extra slide");
		let i = gs(e, r), a = this.fonts.withSlide(e), o = Object.freeze(a.names()), s = tn(o, this.limit).jsonBytes, c = tn(i, this.limit).jsonBytes, l = this.projectionBytesValue - this.demandBytes - this.fontProjectionBytes - tn(r, this.limit).jsonBytes + 4;
		l = on(l, s, this.limit), l = on(l, c, this.limit), this.slides.length !== 0 && (l = on(l, 1, this.limit));
		let u = tn({
			slide: i,
			fontPreloadNames: o
		}, this.limit).jsonBytes, d = on(this.projectionBytesValue - this.demandBytes, u, this.limit), f = l;
		_s(Math.max(d, f), this.limit, t);
		let p = d + this.demandBytes;
		l += this.demandBytes, Math.max(p, l) > this.limit && this.demandBytes && (this.projectionBytesValue -= this.demandBytes, this.demandBytes = 0, this.demandMembershipBytes = 0, this.demandDeltaBytes = 0, this.demandPoints?.clear(), this.demandAll = !0, this.demandDelta = "all", p = d, l = f);
		let m, h = this.demandBytes, g = this.demandMembershipBytes, _ = this.demandDeltaBytes;
		if (this.collectFontDemand) {
			let t = tn([], this.limit).jsonBytes, n = this.limit - p, r = this.limit - f - this.demandMembershipBytes, i = Math.min(n, Math.floor((r + t - Number((this.demandPoints?.size ?? 0) > 0)) / 2));
			if (m = this.demandAll ? "all" : this.collectFontDemand(e, this.demandPoints, Math.max(0, i)), m === "all") h = 0, g = 0, _ = 0;
			else {
				_ = tn(m, this.limit).jsonBytes;
				let e = m.length === 0 ? 0 : _ - t + Number((this.demandPoints?.size ?? 0) > 0);
				g += e, h = g + _, p += _;
			}
			l = f + h;
		}
		_s(Math.max(p, l), this.limit, t);
		let v = {
			state: "prepared",
			fact: i,
			fonts: a,
			fontNames: o,
			fontBytes: s,
			committedBytes: l,
			demandDelta: m,
			demandBytes: h,
			demandMembershipBytes: g,
			demandDeltaBytes: _
		};
		return this.pending = v, {
			projectedBytes: p,
			commit: () => {
				if (v.state !== "committed") {
					if (v.state === "rolled-back") throw Error("PPTX presentation preflight cannot commit a rolled-back slide");
					if (this.pending !== v) throw Error("PPTX presentation preflight prepared slide is stale");
					if (this.descriptors[n] = void 0, this.slides.push(v.fact), this.fonts = v.fonts, this.fontPreloadNames = v.fontNames, this.fontProjectionBytes = v.fontBytes, this.projectionBytesValue = v.committedBytes, this.demandDelta = v.demandDelta, v.demandDelta === "all") this.demandAll = !0, this.demandPoints?.clear();
					else for (let e of v.demandDelta ?? []) this.demandPoints?.add(e);
					this.demandBytes = v.demandBytes, this.demandMembershipBytes = v.demandMembershipBytes, this.demandDeltaBytes = v.demandDeltaBytes, v.state = "committed", this.pending = null;
				}
			},
			rollback: () => {
				if (v.state !== "rolled-back") {
					if (v.state === "committed") throw Error("PPTX presentation preflight cannot roll back a committed slide");
					if (this.pending !== v) throw Error("PPTX presentation preflight prepared slide is stale");
					v.state = "rolled-back", this.pending = null;
				}
			}
		};
	}
	finish() {
		if (this.finished) return this.finished;
		if (this.pending) throw Error("PPTX presentation preflight has an uncommitted slide");
		if (this.slides.length !== this.slideCountValue) throw Error(`PPTX presentation preflight is incomplete: ${this.slides.length}/${this.slideCountValue} slides`);
		return this.finished = Object.freeze({
			slideCount: this.slideCountValue,
			slideWidth: this.slideWidthValue,
			slideHeight: this.slideHeightValue,
			defaultTextColor: this.defaultTextColorValue,
			majorFont: this.majorFontValue,
			minorFont: this.minorFontValue,
			hlinkColor: this.hlinkColorValue,
			folHlinkColor: this.folHlinkColorValue,
			embeddedFonts: this.embeddedFontsValue,
			slides: Object.freeze([...this.slides]),
			fontPreloadNames: this.fontPreloadNames,
			...this.collectFontDemand && !this.demandAll && this.demandBytes ? { fontPreloadDemand: Object.freeze([...this.demandPoints ?? []]) } : {}
		}), this.demandPoints?.clear(), this.demandDelta = void 0, this.descriptors = [], this.slides = [], this.projectionBytesValue = tn(this.finished, this.limit).jsonBytes, this.finished;
	}
}, ys = 1024 * 1024, bs = class {
	options;
	active = /* @__PURE__ */ new Set();
	nextSessionId = 1;
	constructor(e) {
		if (this.options = e, !Number.isSafeInteger(e.slideCount) || e.slideCount < 0) throw TypeError("slideCount must be a non-negative safe integer");
		if (e.generation !== void 0 && (!Number.isSafeInteger(e.generation) || e.generation <= 0)) throw TypeError("generation must be a positive safe integer");
	}
	async load(e, t = !0, n) {
		this.assertSlideIndex(e);
		let r = this.nextSessionId++, i = {
			sessionId: r,
			operationId: r,
			generation: this.options.generation ?? 1
		}, a = new Qe(this.options.transport, {
			...i,
			maxByteCredit: Ie,
			timeoutMs: n
		});
		this.active.add(a);
		try {
			await this.options.open(e, i, n);
			let r = await Fe(a, ys, Ie);
			try {
				let e = r.usage ?? a.usageCheckpoint;
				e && this.options.onUsage?.(e);
				let n = t ? JSON.parse(new TextDecoder().decode(new Uint8Array(r.payload))) : void 0;
				return await r.ack(), n;
			} finally {
				r.disposeTransferred();
			}
		} catch (e) {
			throw await a.cancel("request-error").catch(() => void 0), e;
		} finally {
			this.active.delete(a);
		}
	}
	cancelAll() {
		for (let e of this.active) e.cancel("closed").catch(() => void 0);
		this.active.clear();
	}
	assertSlideIndex(e) {
		if (!Number.isSafeInteger(e) || e < 0 || e >= this.options.slideCount) throw RangeError(`Slide index ${e} out of range (count: ${this.options.slideCount})`);
	}
};
function xs(e) {
	return !!e && typeof e == "object" && e.protocol === "ooxml-pull-v1";
}
export { ns as a, Ko as c, zr as d, Tr as f, hs as i, Jo as l, dn as m, xs as n, ps as o, Mr as p, vs as r, ms as s, bs as t, Yo as u };
