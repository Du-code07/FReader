import { So as e } from "./plot-area-frame-DNYMd9Pf.js";
import { C as t, D as n, E as r, in as i, ln as a, tn as o, un as s, v as c, w as l, y as u } from "./bounded-raw-part-cache-B5a6cGKO.js";
function d(e, t, n, r, i, a = 0) {
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
var f = /^\p{Script_Extensions=Latin}$/u, p = (e) => e.type === "text" && e.text === " ", m = (e) => e.type === "text" && s(e.text.codePointAt(0) ?? 0);
function h(e, s) {
	let c = s.sameStyle ?? ((e, t) => e === t), u = [[]], h = [], g = [-1], _ = [], v = 0;
	for (let t of e) {
		if (h.push(u.length - 1), t.type === "break") {
			_[u.length - 1] = v, u.push([]), g.push(-1), v++;
			continue;
		}
		if (t.type === "object") {
			t.display && u.at(-1).length > 0 && (u.push([]), g.push(-1)), u.at(-1).push({
				type: "object",
				style: t.style,
				run: v,
				width: t.width,
				payload: t.payload
			}), t.display && (u.push([]), g.push(-1)), v++;
			continue;
		}
		let e = [
			0,
			...i(t.text),
			t.text.length
		];
		for (let n = 0; n + 1 < e.length; n++) {
			let r = t.text.slice(e[n], e[n + 1]);
			r === "\n" ? (u.push([]), g.push(v)) : r === "	" ? u.at(-1).push({
				type: "tab",
				style: t.style,
				run: v
			}) : r !== "\r" && u.at(-1).push({
				type: "text",
				text: r,
				style: t.style,
				run: v
			});
		}
		v++;
	}
	let y = [], b = [], x = [], S = new Uint8Array(e.length);
	for (let e = 0; e < u.length; e++) {
		let i = u[e];
		if (b.push(y.length), e === u.length - 1) for (; i.length > 0 && p(i.at(-1));) i.pop();
		let h = i.length, v = /* @__PURE__ */ new Set();
		if (i.some((e) => e.type === "text" && o(e.text))) {
			let e = "", t = [0];
			for (let n of i) e += n.type === "text" ? n.text : "￼", t.push(e.length);
			let n = new Set(a(e, { cjk: !0 }));
			for (let e = 1; e < t.length; e++) n.has(t[e]) && v.add(e);
		}
		let C = s.eastAsianLineBreak !== !1, w = (e) => e === 160 || e === 8239 || e === 8288 || e === 65279, T = (e) => {
			if (e <= 0 || e >= h) return !1;
			let n = i[e - 1], r = i[e];
			if (r.type === "tab") return !0;
			if (n.type === "tab") return !1;
			if (p(n) || p(r) || v.has(e) || n.type === "object" || r.type === "object") return !0;
			let a = [...n.text].at(-1)?.codePointAt(0), o = r.text.codePointAt(0);
			if (a === void 0 || o === void 0) return !1;
			if (a === 8203 || !C && (m(n) || m(r)) && !w(a) && !w(o)) return !0;
			if (t(a, o)) return !1;
			if (m(n) || m(r)) return !0;
			if (e > 1 && (l(a) === "HY" || l(a) === "HH")) {
				let t = i[e - 2];
				if (t.type === "text" && f.test([...t.text].at(-1) ?? "") && f.test([...r.text][0] ?? "")) return !0;
			}
			return !1;
		}, E = new Uint8Array(h + 1);
		for (let e = 1; e < h; e++) E[e] = +!!T(e);
		let D = i[0]?.style, O = h > 0 && i.every((e) => e.type === "text" && c(D, e.style)) ? i.map((e) => e.type === "text" ? e.text : "").join("") : null, k = O === null ? null : new Int32Array(h + 1);
		if (k) for (let e = 0; e < h; e++) {
			let t = i[e];
			k[e + 1] = k[e] + (t.type === "text" ? t.text.length : 0);
		}
		let A = null, j = 0, M = (e) => {
			let t = i[e], n = i[e + 1];
			if (t?.type !== "tab" || !s.tabStops?.length || n?.type !== "text" || !/^[\p{Script_Extensions=Latin}\p{Number}]$/u.test(n.text)) return !1;
			if (A === null) {
				j = $, A = new Uint8Array(h - j + 1), A[h - j] = 1;
				for (let e = h - 1; e >= j; e--) {
					let t = i[e], n = e - j;
					A[n] = A[n + 1] && t.type === "text" && !p(t) && !m(t) ? 1 : 0;
				}
			}
			return A[e + 1 - j] === 1;
		}, N = null, P = 0, F = () => {
			if (N === null) {
				P = $;
				let e = [], t = new Int32Array(h - P + 1);
				for (let n = P; n < h; n++) {
					let r = i[n];
					if (r.type === "text") for (let t of r.text) e.push(t);
					t[n + 1 - P] = e.length;
				}
				N = {
					chars: e,
					offsets: t
				};
			}
			return N;
		}, I = (e, t) => e.type === "text" && t.type === "text" && s.kinsokuAcrossRuns?.(e.style, t.style, e.text, t.text) === !0, L = null, R = 0, z = (e) => {
			if (L === null) {
				R = $, L = new Int32Array(h - $ + 1);
				let e = $ + 1;
				for (let t = $ + 1; t < h; t++) {
					let n = i[t - 1], r = i[t];
					(n.type !== "text" || r.type !== "text" || n.run !== r.run && !I(n, r)) && (e = t), L[t - R] = e;
				}
			}
			return Math.max($ + 1, L[e - R]);
		}, B = (e, t) => {
			if (t.type === "text") {
				let n = e.at(-1);
				if (n?.type === "text" && c(n.style, t.style)) {
					n.text += t.text;
					return;
				}
				e.push({
					type: "text",
					text: t.text,
					style: t.style,
					width: 0
				});
			} else t.type === "tab" ? e.push({
				type: "tab",
				style: t.style,
				width: 0
			}) : e.push({
				type: "object",
				style: t.style,
				width: t.width,
				payload: t.payload
			});
		}, V = (e, t) => {
			let n = 0, r = e.map((t, r) => {
				if (t.type === "text") {
					t.width = s.measureText(t.text, t.style);
					let n = e[r - 1];
					n?.type === "text" && (t.width += s.boundaryAdvance?.(n.style, t.style) ?? 0);
				}
				return t.type === "tab" && (t.width = 0, n = s.measureText(" ", t.style)), {
					isTab: t.type === "tab",
					width: t.width
				};
			});
			if (r.some((e) => e.isTab)) {
				let i = d(r, s.tabStops ?? [], s.tabStartPen?.(t) ?? (t === 0 ? s.firstLineIndent ?? 0 : 0), Infinity, n, s.defaultTabSize ?? 0);
				for (let t = 0; t < e.length; t++) e[t].width = i[t];
			}
			return e.reduce((e, t) => e + t.width, 0);
		}, H = (e, t, n) => {
			if (O !== null && k && D !== void 0) {
				let n = O.slice(k[e], k[t]), r = s.measureText(n, D);
				return {
					segments: [{
						type: "text",
						text: n,
						style: D,
						width: r
					}],
					width: r
				};
			}
			let r = [];
			for (let n = e; n < t; n++) B(r, i[n]);
			return {
				segments: r,
				width: V(r, n)
			};
		}, U = null, W = (e, t) => {
			let n = "";
			for (let r = e; r < t; r++) {
				let e = i[r];
				e.type === "text" && (n += e.text);
			}
			return n;
		}, G = (e) => {
			let t = new Float64Array(Math.ceil(e.length / 32)).fill(Infinity);
			for (let n = 0; n < e.length; n++) {
				let r = Math.floor(n / 32);
				e[n] < t[r] && (t[r] = e[n]);
			}
			return t;
		}, K = () => {
			let e = new Int32Array(h).fill(-1), t = new Int32Array(h).fill(-1), n = new Float64Array(h).fill(NaN), r = new Float64Array(h), a = new Float64Array(h + 1), o = new Float64Array(h + 1), l = new Int32Array(h + 1), u = -1, d, f = null, p = 0, m = 0, g = (e) => {
				for (let n = u; u >= 0 && n < e; n++) t[n] = e;
			};
			for (let t = 0; t < h; t++) {
				let h = i[t];
				if (l[t + 1] = l[t] + +(h.type === "tab"), h.type === "text" && u >= 0 && c(d, h.style) || (g(t), p = o[t], h.type === "text" ? (f = u >= 0 ? s.boundaryAdvance?.(d, h.style) ?? 0 : null, u = t, d = h.style) : (u = -1, d = void 0)), h.type === "text") {
					let i = d;
					if (e[t] = u, t - u <= 8) m = s.measureText(W(u, t + 1), i), n[t] = m;
					else {
						let e = W(t - 8, t);
						r[t] = s.measureText(e + h.text, i) - s.measureText(e, i), m += r[t];
					}
					o[t + 1] = p + (f === null ? m : m + f);
				} else o[t + 1] = p + (h.type === "object" ? h.width : 0);
				a[t + 1] = a[t] + r[t];
			}
			g(h);
			let _ = new Float64Array(h + 1);
			_[h] = o[h];
			for (let e = h - 1; e >= 0; e--) _[e] = Math.min(o[e], _[e + 1]);
			let v = new Float64Array(h + 1).fill(Infinity);
			for (let e = h; e >= 1; e--) i[e - 1].type === "text" && (v[e] = e === t[e - 1] ? a[e] : Math.min(a[e], v[e + 1]));
			let y = new Int32Array(h), b = [];
			for (let e = 0; e < h; e++) {
				let t = i[e];
				if (t.type !== "tab" || (s.defaultTabSize ?? 0) > 0) continue;
				let n = s.measureText(" ", t.style), r = b.indexOf(n);
				r < 0 && (r = b.push(n) - 1), y[e] = r;
			}
			return b.length === 0 && b.push(0), {
				segStart: e,
				segEnd: t,
				head: n,
				tail: r,
				tailSum: a,
				tailBlockMin: G(a),
				natural: o,
				naturalBlockMin: G(o),
				naturalSuffixMin: _,
				tailSuffixMin: v,
				tabsBefore: l,
				tabGap: y,
				gapValues: b
			};
		}, q = (e, t, n, r, i, a) => {
			let o = i;
			for (; o > r;) {
				let i = Math.floor(o / 32) * 32;
				if (i > r && n + t[i / 32] > a) {
					o = i - 1;
					continue;
				}
				if (n + e[o] <= a) return o;
				o--;
			}
			return -1;
		}, J = /* @__PURE__ */ new Map(), Y = (e, t, n) => {
			if (t === e.segStart[t]) {
				let r = Math.min(n, t + 8 + 1) - 1;
				return e.head[r] + (e.tailSum[n] - e.tailSum[r + 1]);
			}
			let r = Math.min(n, t + 8 + 1), a = J.get(r);
			return a === void 0 && (a = s.measureText(W(t, r), i[t].style), J.set(r, a)), a + (e.tailSum[n] - e.tailSum[r]);
		}, ee = (e, t, n) => {
			let r = U ??= K();
			if (J.clear(), r.tabsBefore[h] !== r.tabsBefore[e]) return te(r, e, t, n);
			let a = i[e], o = a.type === "text" ? r.segEnd[e] : e + 1, c = a.type === "text" ? Y(r, e, o) : a.type === "object" ? a.width : 0;
			if (o < h) {
				let t = i[o], l = a.type === "text" && t.type === "text" && s.boundaryAdvance ? s.boundaryAdvance(a.style, t.style) - s.boundaryAdvance(i[r.segStart[e]].style, t.style) : 0, u = q(r.natural, r.naturalBlockMin, c + l - r.natural[o], o, h, n);
				if (u >= 0) return u;
			}
			if (c <= n) return o;
			if (a.type !== "text") return e;
			let l = e + 8 + 1;
			if (o - 1 > l) {
				let t = Y(r, e, l) - r.tailSum[l], i = q(r.tailSum, r.tailBlockMin, t, l, o - 1, n);
				if (i >= 0) return i;
			}
			for (let t = Math.min(o - 1, l); t > e; t--) if (Y(r, e, t) <= n) return t;
			return e;
		}, te = (e, t, n, r) => {
			let a = s.tabStartPen?.(n) ?? (n === 0 ? s.firstLineIndent ?? 0 : 0), o = s.tabStops ?? [], c = s.defaultTabSize ?? 0, l = e.gapValues, u = l.length, d = new Float64Array(u), f = new Float64Array(u).fill(a), p = new Float64Array(u), m = new Float64Array(u), g = new Float64Array(u), _ = new Uint8Array(u), v = new Float64Array(u), y = !1, b = 0, x = 0, S = !1, C = i[t], w = C.type === "text" ? e.segEnd[t] : t + 1, T = C.type === "text" ? Y(e, t, w) : C.type === "object" ? C.width : 0, E = i[w], D = T + (w < h && C.type === "text" && E.type === "text" && s.boundaryAdvance ? s.boundaryAdvance(C.style, E.style) - s.boundaryAdvance(i[e.segStart[t]].style, E.style) : 0) - e.natural[w], O = t + 8 + 1, k = C.type === "text" && w > O ? Y(e, t, O) - e.tailSum[O] : 0, A = l.every((e) => e >= 0), j = 1e-9 * Math.max(1, Math.abs(r)), M = (t) => {
				if (!A || t < O && t < w) return !1;
				let n = Infinity;
				return t < w && (n = k + e.tailSuffixMin[t + 1]), w < h && (n = Math.min(n, D + e.naturalSuffixMin[Math.max(t + 1, w + 1)])), n > r + j;
			}, N = t, P = -1, F = null;
			for (let n = t + 1; n <= h; n++) {
				let a = n - 1, C = i[a];
				if (C.type === "text" && P >= 0 && e.segStart[a] === e.segStart[a - 1]) {
					let r = X(e, P, t, n);
					x = F === null ? r : r + F;
				} else {
					if (S) for (let e = 0; e < u; e++) y ? v[e] += x : (d[e] += x, f[e] += x);
					if (C.type === "tab") {
						for (let e = 0; e < u; e++) {
							if (y) {
								let t = v[e], n = p[e] + l[e];
								_[e] || (n = m[e] - t * g[e], n < p[e] && (n = p[e])), d[e] += n - p[e] + t, f[e] = n + t;
							}
							p[e] = f[e];
							let t = null;
							for (let n of o) n.pos > f[e] && (t === null || n.pos < t.pos) && (t = n);
							t === null && c > 0 && (t = {
								pos: (Math.floor(f[e] / c) + 1) * c,
								algn: "l"
							}), _[e] = +(t === null), m[e] = t?.pos ?? 0, g[e] = t?.algn === "ctr" ? .5 : +(t?.algn === "r" || t?.algn === "dec"), v[e] = 0;
						}
						y = !0, b = e.tabGap[a], P = -1, x = 0, S = !1;
					} else if (C.type === "text") {
						let r = P >= 0 ? i[P] : void 0;
						F = r?.type === "text" ? s.boundaryAdvance?.(r.style, C.style) ?? 0 : null, P = a;
						let o = X(e, P, t, n);
						x = F === null ? o : o + F, S = !0;
					} else P = -1, x = C.width, S = !0;
				}
				let w;
				if (!y) w = d[b] + x;
				else {
					let e = v[b] + x, t = l[b];
					if (!_[b]) {
						let n = m[b] - e * g[b];
						n < p[b] && (n = p[b]), t = n - p[b];
					}
					w = d[b] + t + e;
				}
				if (w <= r) {
					if (n === h) return h;
					N = n;
				}
				if (n < h && M(n)) break;
			}
			return N;
		}, X = (e, t, n, r) => t === n ? Y(e, n, r) : Y(e, t, r), Z = new Int32Array(h).fill(-1);
		x.push(Z);
		let Q = (e, t) => {
			for (let n = e; n < t; n++) Z[n] = y.length - 1, S[i[n].run] = 1;
		}, $ = 0;
		if (h === 0) {
			y.push({
				segments: [],
				width: 0,
				...e + 1 < u.length ? { endsWithBreak: !0 } : {},
				...g[e] >= 0 ? { lineFeedRun: g[e] } : {},
				..._[e] === void 0 ? {} : { endBreakRun: _[e] }
			});
			continue;
		}
		for (; $ < h;) {
			let t = y.length, a = s.maxWidth - (t === 0 ? s.firstLineIndent ?? 0 : 0), o = (e) => O !== null && k && D !== void 0 ? s.measureText(O.slice(k[$], k[e]), D) : H($, e, t).width, c = h;
			if (Number.isFinite(a) && s.nonMonotoneMeasure) c = ee($, t, a);
			else if (Number.isFinite(a)) {
				let e = $, t = h, n = 1;
				for (; e < h;) {
					let r = Math.min(h, $ + n);
					if (o(r) <= a) {
						if (e = r, r === h) break;
						n *= 2;
					} else {
						t = r - 1;
						break;
					}
				}
				for (; e < t;) {
					let n = Math.ceil((e + t) / 2);
					o(n) <= a ? e = n : t = n - 1;
				}
				c = e;
			}
			if (c >= h) {
				let n = H($, h, t);
				e + 1 < u.length && (n.endsWithBreak = !0), y.push(n), Q($, h);
				break;
			}
			let l = 0;
			for (let e = $ + 1; e <= c; e++) E[e] && (l = e);
			if (l > $ && M(l) && (l = h), M($)) for (l = $ + 2; l < h && !p(i[l]) && i[l].type !== "tab";) l++;
			if (l === 0) if (i[$].type === "tab" && c <= $ + 1) {
				if (l = $ + 1, l < h && i[l].type === "text") for (l++; l < h && !E[l];) l++;
			} else l = Math.max($ + 1, c);
			let d = i[l - 1], f = l < h ? i[l] : void 0;
			if (C && f && (m(d) || m(f)) && (d.run === f.run || I(d, f))) {
				let { chars: e, offsets: t } = F(), i = t[$ - P], a = t[l - P];
				if (a - i > 1 && a < e.length) {
					let o = d.run !== f.run, s = o ? z(l) : $ + 1, c = r(e, a, n, o ? t[s - P] : i + 1), u = a - c;
					if (u > 0) if (o) {
						let e = s, n = l;
						for (; e < n;) {
							let r = Math.floor((e + n) / 2);
							t[r - P] < c ? e = r + 1 : n = r;
						}
						l = e;
					} else l - u > $ && (l -= u);
				}
			}
			for (y.push(H($, l, t)), Q($, l), $ = l; $ < h && p(i[$]);) $++;
		}
	}
	for (let e = 0; e < _.length; e++) {
		let t = _[e];
		if (t === void 0) continue;
		let n = b[e], r = e + 1 < b.length ? b[e + 1] : y.length;
		r > n && (y[r - 1].endBreakRun = t);
	}
	for (let t = 0; t < e.length; t++) {
		if (e[t].type !== "text" || S[t]) continue;
		let n = h[t], r = u[n], i = x[n], a = 0, o = r.length;
		for (; a < o;) {
			let e = a + o >> 1;
			r[e].run < t ? a = e + 1 : o = e;
		}
		let s = b[n];
		for (let e = a - 1; e >= 0; e--) if (i[e] >= 0) {
			s = i[e];
			break;
		}
		(y[s].hiddenRuns ??= []).push(t);
	}
	return y;
}
function g(e, t, n, r) {
	let i = n.lIns * r, a = n.rIns * r, o = n.tIns * r, s = n.bIns * r;
	return {
		left: i,
		top: o,
		width: Math.max(0, e - i - a),
		height: Math.max(0, t - o - s)
	};
}
function _(e, t, n, r = 0) {
	let i = t?.type === "pts" ? t.val * n : e * (t?.type === "pct" ? t.val / 1e5 : 1);
	return t?.type === "pts" ? i : i * (1 - r);
}
function v(e, t, n, r = 0) {
	let i = e.ascent + e.descent, a = _(i, t, n, r);
	if (a === i) return {
		ascent: e.ascent,
		descent: e.descent
	};
	let o = Math.max(0, e.descent - .25 * i), s = a < i ? Math.min(e.descent, .25 * a + o) : .25 * a <= e.descent ? e.descent : .25 * a + o;
	return {
		ascent: a - s,
		descent: s
	};
}
function y(e, t, n) {
	return e ? e.type === "pts" ? e.val * n : t * (e.val / 1e5) : 0;
}
function b(e, t, n) {
	return e === "ctr" ? t.top + (t.height - n) / 2 : e === "b" ? t.top + Math.max(0, t.height - n) : t.top;
}
function x(e, t, n, r, i = !1, a = !1) {
	let o = a ? n - r : Math.max(0, n - r);
	return e === "ctr" ? t + o / 2 : e === "r" || i && (e === "l" || e == null) ? t + o : t;
}
function S(e, t, n) {
	return e === "dist" || e === "thaiDist" ? !0 : e === "just" || e === "justLow" ? !t && !n : !1;
}
var C = (e) => e.reduce((e, t) => e + t.advance, 0);
function w(e) {
	let t = e.length;
	for (; t > 0 && e[t - 1].space;) t--;
	return t;
}
function T(e, t) {
	let { rect: n, pxPerPt: r } = t, i = t.lnSpcReduction ?? 0, a = [], o = [];
	e.forEach((s, c) => {
		let l = h(s.runs, {
			maxWidth: t.wrap ? Math.max(0, n.height - (s.marginStart ?? 0) - (s.marginEnd ?? 0)) : Infinity,
			firstLineIndent: (s.firstLineIndent ?? 0) + (s.firstLinePrefix?.advance ?? 0),
			measureText: (e, n) => C(t.glyphs(e, n)),
			sameStyle: t.sameStyle,
			eastAsianLineBreak: s.eastAsianLineBreak
		}), u = l.map((e, n) => {
			let a = e.segments.flatMap((e) => {
				if (e.type === "text") return t.glyphs(e.text, e.style);
				if (e.type === "object") {
					if (!t.objectGlyph) throw Error("Stacked inline objects require a host object adapter");
					let n = t.objectGlyph(e);
					return n.advance === 0 && n.thickness === 0 ? [] : [n];
				}
				return [];
			}), o = a.length > 0 ? 0 : s.emptyThickness;
			for (let e of a) e.thickness > o && (o = e.thickness);
			n === 0 && s.firstLinePrefix && (o = Math.max(o, s.firstLinePrefix.thickness));
			let u = v({
				ascent: o / 2,
				descent: o / 2
			}, s.lineSpacing, r, i);
			return {
				glyphs: a,
				paragraph: c,
				firstInParagraph: n === 0,
				lastInParagraph: n === l.length - 1,
				endsWithBreak: e.endsWithBreak === !0,
				thickness: o,
				ascent: u.ascent,
				descent: u.descent
			};
		});
		if (u.length === 0) {
			let e = s.emptyThickness, t = v({
				ascent: e / 2,
				descent: e / 2
			}, s.lineSpacing, r, i);
			u.push({
				glyphs: [],
				paragraph: c,
				firstInParagraph: !0,
				lastInParagraph: !0,
				endsWithBreak: !1,
				thickness: e,
				ascent: t.ascent,
				descent: t.descent
			});
		}
		let d = c === 0, f = c === e.length - 1, p = t.spcFirstLastPara === !0, m = d && !p ? 0 : y(s.spaceBefore, u[0].thickness, r), g = f && !p ? 0 : y(s.spaceAfter, u[u.length - 1].thickness, r), _ = [];
		m && _.push({
			type: "gap",
			size: m
		});
		for (let e of u) _.push({
			type: "line",
			line: e
		}), a.push(e);
		g && _.push({
			type: "gap",
			size: g
		}), o.push(_);
	});
	let s = a[a.length - 1];
	s && s.descent < s.thickness / 2 && (s.descent = s.thickness / 2);
	let c = t.direction === "wordArtVertRtl", l = [], u = 0;
	for (let e of o) {
		let t = c ? e : e.slice().reverse(), n = e.filter((e) => e.type === "line"), r = 0;
		for (let e of t) {
			if (e.type === "gap") {
				u += e.size;
				continue;
			}
			let t = n[r++].line;
			l.push(u + (c ? t.ascent : t.descent)), u += t.ascent + t.descent;
		}
	}
	let d = u, f = n.width - d, p = t.anchor === "ctr" ? f / 2 : t.anchor === "b" ? Math.max(0, f) : 0, m = n.top, g = n.height;
	if (t.anchorCtr) {
		let t = 0;
		for (let n of a) t = Math.max(t, C(n.glyphs.slice(0, w(n.glyphs))) + (n.firstInParagraph ? e[n.paragraph].firstLinePrefix?.advance ?? 0 : 0));
		m = n.top + (n.height - t) / 2, g = t;
	}
	let _ = [], b = [];
	return a.forEach((t, r) => {
		let i = c ? n.left + n.width - p - l[r] : n.left + p + l[r], a = e[t.paragraph], o = a.alignment, s = t.firstInParagraph ? a.firstLinePrefix : void 0, u = s?.advance ?? 0, d = (a.marginStart ?? 0) + (t.firstInParagraph ? a.firstLineIndent ?? 0 : 0) + u, f = a.marginEnd ?? 0, h = m + d, v = w(t.glyphs), y = C(t.glyphs.slice(0, v)), x = g - d - f - y, T = h, E = () => 0, D = t.lastInParagraph;
		if (o === "dist" || o === "thaiDist") v <= 1 ? T = h + x / 2 : E = (e) => e < v - 1 ? Math.max(0, x) / (v - 1) : 0;
		else if (S(o, D, t.endsWithBreak)) {
			let e = t.glyphs.slice(0, v).filter((e) => e.space).length;
			e > 0 && (E = (n) => n < v && t.glyphs[n].space ? Math.max(0, x) / e : 0);
		} else o === "ctr" ? T = h + x / 2 : o === "r" && (T = h + x);
		b.push({
			axisX: i,
			thickness: t.thickness,
			paragraph: t.paragraph,
			...s ? { prefixTop: T - u } : {}
		});
		let O = T;
		t.glyphs.forEach((e, t) => {
			_.push({
				...e,
				axisX: i,
				cellTop: O,
				column: r
			}), O += e.advance + E(t);
		});
	}), {
		glyphs: _,
		columns: b,
		blockWidth: d
	};
}
var E = 7 / 6;
function D(t, n, r) {
	let i = n ? 700 : 400, a = e(t, {
		weight: i,
		style: r ? "italic" : "normal"
	});
	return a.length === 0 && (a = e(t, { weight: i })), a.length === 0 && (a = e(t)), a.find((e) => e.source === "macos-supplemental") ?? a.find((e) => e.source === "office-mac") ?? a[0];
}
function O(e, t, n) {
	let r = D(e, t, n);
	if (!(!r || !(r.unitsPerEm > 0))) {
		if (r.typoMetrics) {
			let [e, t, n] = r.typoMetrics;
			return {
				ascent: (e + Math.max(0, n)) / r.unitsPerEm,
				descent: -t / r.unitsPerEm
			};
		}
		if (r.win) return {
			ascent: r.win[0] / r.unitsPerEm,
			descent: r.win[1] / r.unitsPerEm
		};
	}
}
var k = new Set([..."()<>[]{}…‥‐←→↑↓―∥、。ー～＝＿￣｜（）〔〕［］｛｝〈〉《》「」『』【】〖〗"].map((e) => e.codePointAt(0)));
function A(e) {
	return k.has(e);
}
function j(e, t, n = !1, r = !1) {
	if (!k.has(t)) return;
	let i = D(e, n, r), a = String.fromCodePoint(t);
	return i?.stackedVerticalGlyphs?.includes(a) ? "vert" : t >= 128 && i?.stackedVrt2OnlyGlyphs?.includes(a) ? "nominal" : void 0;
}
function M(e, t, n, r = !1) {
	let a = [], o = i(e);
	o.push(e.length);
	let s = 0;
	for (let i of o) {
		let o = e.slice(s, i);
		if (s = i, !o) continue;
		let c = o.codePointAt(0) ?? 0, l = r ? void 0 : j(t.family, c, t.bold, t.italic);
		r || !A(c) ? a.push({
			text: o,
			kind: "upright",
			advance: n.upright
		}) : l ? a.push({
			text: o,
			kind: "verticalGlyph",
			advance: n.verticalGlyph,
			...l === "nominal" ? { nominal: !0 } : {}
		}) : a.push({
			text: o,
			kind: "rotated",
			advance: n.rotated(o)
		});
	}
	return a;
}
function N(e) {
	return e.nominal ? e.text : P(e.text);
}
function P(e) {
	let t = e.codePointAt(0) ?? 0;
	if (String.fromCodePoint(t) !== e) return null;
	let n = u(t) ?? c(t);
	return n === null ? null : String.fromCodePoint(n);
}
function F(e, t, n, r) {
	return e + t - n.descent * r;
}
function I(e, t, n, r, i, a, o) {
	let s = n - (i.ascent + i.descent) * a / 2, c = r + i.ascent * a;
	e.textAlign = "left", e.textBaseline = "alphabetic", o?.(s, c), e.fillText(t, s, c);
}
function L(e, t, n, r, i, a, o) {
	e.save(), e.translate(n - (i.ascent - i.descent) * a / 2, r), e.rotate(Math.PI / 2), e.textAlign = "left", e.textBaseline = "alphabetic", o?.(), e.fillText(t, 0, 0), e.restore();
}
function R(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw Error(`${t} must be a non-negative safe integer`);
}
function z(e, t, n) {
	return R(e, "resource measurement"), R(t, "resource measurement"), R(n, "resource measurement limit"), e > n || t > n || t > n - e ? n === 2 ** 53 - 1 ? n : n + 1 : e + t;
}
function B(e, t = 2 ** 53 - 1) {
	R(t, "resource measurement limit");
	let n = 0;
	for (let r = 0; r < e.length; r += 1) {
		let i = e.charCodeAt(r), a;
		if (i <= 127) a = 1;
		else if (i <= 2047) a = 2;
		else if (i >= 55296 && i <= 56319 && r + 1 < e.length) {
			let t = e.charCodeAt(r + 1);
			t >= 56320 && t <= 57343 ? (a = 4, r += 1) : a = 3;
		} else a = 3;
		if (n = z(n, a, t), n > t) return n;
	}
	return n;
}
function V(e, t = 2 ** 53 - 1) {
	R(t, "resource measurement limit");
	let n = z(0, 2, t);
	if (n > t) return n;
	for (let r = 0; r < e.length; r += 1) {
		let i = e.charCodeAt(r), a;
		if (i === 34 || i === 92 || i === 8 || i === 9 || i === 10 || i === 12 || i === 13) a = 2;
		else if (i <= 31) a = 6;
		else if (i <= 127) a = 1;
		else if (i <= 2047) a = 2;
		else if (i >= 55296 && i <= 56319 && r + 1 < e.length) {
			let t = e.charCodeAt(r + 1);
			t >= 56320 && t <= 57343 ? (a = 4, r += 1) : a = 6;
		} else a = i >= 55296 && i <= 57343 ? 6 : 3;
		if (n = z(n, a, t), n > t) return n;
	}
	return n;
}
function H(e, t) {
	return z(0, e, t);
}
function U(e, t = 2 ** 53 - 1, n = !1) {
	if (R(t, "resource measurement limit"), e === null) return {
		jsonBytes: H(4, t),
		stringValueUtf8Bytes: 0
	};
	if (typeof e == "string") return {
		jsonBytes: V(e, t),
		stringValueUtf8Bytes: B(e, t)
	};
	if (typeof e == "boolean") return {
		jsonBytes: H(e ? 4 : 5, t),
		stringValueUtf8Bytes: 0
	};
	if (typeof e == "number") return {
		jsonBytes: H((Number.isFinite(e) ? String(Object.is(e, -0) ? 0 : e) : "null").length, t),
		stringValueUtf8Bytes: 0
	};
	if (typeof e == "bigint") throw TypeError("BigInt values cannot be serialized to JSON");
	if (Array.isArray(e)) {
		let n = H(2, t), r = 0;
		for (let i = 0; i < e.length; i += 1) {
			i !== 0 && (n = z(n, 1, t));
			let a = U(e[i], t, !0);
			n = z(n, a.jsonBytes, t), r = z(r, a.stringValueUtf8Bytes, t);
		}
		return {
			jsonBytes: n,
			stringValueUtf8Bytes: r
		};
	}
	if (typeof e == "object") {
		let n = H(2, t), r = 0, i = 0;
		for (let [a, o] of Object.entries(e)) {
			if (o === void 0 || typeof o == "function" || typeof o == "symbol") continue;
			i++ !== 0 && (n = z(n, 1, t)), n = z(n, V(a, t), t), n = z(n, 1, t);
			let e = U(o, t);
			n = z(n, e.jsonBytes, t), r = z(r, e.stringValueUtf8Bytes, t);
		}
		return {
			jsonBytes: n,
			stringValueUtf8Bytes: r
		};
	}
	return {
		jsonBytes: n ? H(4, t) : 0,
		stringValueUtf8Bytes: 0
	};
}
export { v as _, I as a, N as c, T as d, S as f, y as g, _ as h, L as i, E as l, b as m, U as n, M as o, x as p, B as r, F as s, z as t, O as u, g as v, h as y };
