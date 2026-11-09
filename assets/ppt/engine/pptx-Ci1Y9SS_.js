import { t as e } from "./chunk-D5OxutzX.js";
import { a as t, c as n, d as r, f as i, i as a, l as o, n as s, o as c, p as l, r as u, s as d, t as f, u as p } from "./slide-pull-client-3g6TxaKa.js";
import { Co as m, Fa as h, Fo as g, Io as _, wo as v } from "./plot-area-frame-DNYMd9Pf.js";
import { n as ee, t as y } from "./cfb-guard-DzYlucez.js";
import { $ as b, $t as x, F as te, G as S, I as C, On as w, P as ne, Q as T, Qt as re, W as ie, Xt as ae, _t as oe, en as E, ft as se, hn as ce, lt as le, n as ue, p as D, t as de, vn as fe } from "./bounded-raw-part-cache-B5a6cGKO.js";
import { C as pe, D as me, E as O, N as he, O as ge, P as k, S as _e, T as A, _ as ve, a as ye, b as be, c as xe, d as Se, f as Ce, g as we, h as Te, i as Ee, l as De, m as Oe, n as ke, o as Ae, p as je, r as Me, t as Ne, u as Pe, v as Fe, w as j, x as Ie, y as Le } from "./comment-overlay-controller-B7AoyoDK.js";
import { f as M, u as Re } from "./pixel-budget-DI82Hn3R.js";
import { i as ze, t as Be } from "./tiff-contract-DEd8CGuz.js";
import { D as Ve, E as He, T as Ue, a as N, b as We, c as Ge, f as Ke, i as qe, l as Je, n as Ye, o as P, p as Xe, r as Ze, s as Qe, t as $e, u as F, v as et, w as tt, x as nt, y as rt } from "./canvas-viewer-mechanics-BsqaoYgK.js";
import { n as it } from "./renderer-module-contract-BuTx2FWJ.js";
import { t as at } from "./visible-index-vN-4BNn7.js";
import { n as ot } from "./resource-measurement-CfJtbwiR.js";
function st(e, t) {
	let n = t.startsWith("/") ? [] : e.split("/").filter((e) => e !== "");
	for (let e of t.split("/")) if (e === "..") n.pop();
	else if (e === "." || e === "") continue;
	else n.push(e);
	return n.join("/");
}
function ct(e) {
	let t = /[?&]jump=([a-zA-Z]+)/.exec(e);
	if (!t) return null;
	let n = t[1].toLowerCase();
	return n === "firstslide" || n === "lastslide" || n === "nextslide" || n === "previousslide" ? n : null;
}
function lt(e, t, n) {
	if (!(n <= 0)) switch (e) {
		case "firstslide": return 0;
		case "lastslide": return n - 1;
		case "nextslide": return Math.min(t + 1, n - 1);
		case "previousslide": return Math.max(t - 1, 0);
	}
}
function I(e) {
	let t = e.textBodyRotation ?? 0, n = e.shapeFlipH === !0, r = e.shapeFlipV === !0;
	if (n || r) return `rotate(${e.rotation}deg) scale(${n ? -1 : 1}, ${r ? -1 : 1})` + (t === 0 ? "" : ` rotate(${t}deg)`);
	let i = e.rotation + t;
	return i === 0 ? "" : `rotate(${i}deg)`;
}
function ut(e, t) {
	return `${e.shapeX},${e.shapeY},${e.shapeW},${e.shapeH},${e.cellHorzOverflow ?? "shape"},${t}`;
}
function dt(e, t, n, r, i, a) {
	let o = e.createElement("div"), s = t.cellHorzOverflow !== void 0;
	o.style.cssText = `position:absolute;left:${O(t.shapeX, n)};top:${O(t.shapeY, r)};width:${O(t.shapeW, n)};height:${O(t.shapeH, r)};pointer-events:${i};overflow:${s ? "visible" : a};`, t.cellHorzOverflow === "clip" && (o.style.overflowX = "clip", o.style.overflowY = "visible");
	let c = I(t);
	return c && (o.style.transformOrigin = "center center", o.style.transform = c), {
		div: o,
		w: t.shapeW,
		h: t.shapeH
	};
}
function L(e, t, n, r, i, a) {
	e.innerHTML = "", A(e, "ooxmlSelectionSurface", "pptx"), A(e, "slideIndex", a === void 0 ? void 0 : String(a));
	let o = /* @__PURE__ */ new Map(), s = e.ownerDocument ?? document;
	for (let [a, c] of t.entries()) {
		let t = ut(c, I(c)), l = o.get(t);
		if (!l) {
			let i = dt(s, c, n, r, "all", "visible");
			l = i, o.set(t, l), e.appendChild(i.div);
		}
		let u = s.createElement("span");
		A(u, "ooxmlSelectionRun", "pptx"), A(u, "runIndex", String(a)), c.shapeId !== void 0 && A(u, "shapeId", c.shapeId), c.elementIndex !== void 0 && A(u, "elementIndex", String(c.elementIndex)), c.origin !== void 0 && A(u, "elementOrigin", c.origin), u.textContent = c.text;
		let d = i ? c.hyperlink : void 0;
		u.style.cssText = `position:absolute;left:${O(c.inShapeX, l.w)};top:${O(c.inShapeY, l.h)};font:${c.font};line-height:${c.h}px;letter-spacing:0;white-space:pre;color:transparent;cursor:${d ? "pointer" : "text"};`, d && i && (u.title = d.kind === "external" ? d.url : d.ref, u.addEventListener("click", (e) => {
			e.preventDefault(), i(d);
		})), l.div.appendChild(u);
	}
}
function R(e, t, n, r, i, a, o = {}) {
	e.innerHTML = "";
	let s = o.match ?? "rgba(255, 214, 0, 0.42)", c = o.active ?? "rgba(255, 140, 0, 0.55)", l = e.ownerDocument ?? document, u = /* @__PURE__ */ new Map(), d = (t) => {
		let n = ut(t, I(t)), a = u.get(n);
		if (!a) {
			let o = dt(l, t, r, i, "none", "hidden");
			a = o, u.set(n, a), e.appendChild(o.div);
		}
		return a;
	};
	for (let e of n) {
		let n = e.active ? c : s;
		for (let r of e.slices) {
			let e = t[r.runIndex];
			if (!e) continue;
			let i = a(e.font), { x: o, width: s } = me(e.text, r.start, r.end, i);
			if (s <= 0) continue;
			let c = d(e), u = l.createElement("div");
			u.style.cssText = `position:absolute;left:${O(e.inShapeX + o, c.w)};top:${O(e.inShapeY, c.h)};width:${O(s, c.w)};height:${O(e.h, c.h)};background:${n};pointer-events:none;`, c.div.appendChild(u);
		}
	}
}
function ft(e, t) {
	let n = e.tableCell, r = t.tableCell;
	return !n && !r ? !0 : !n || !r ? !1 : (e.renderElementIndex ?? e.elementIndex) === (t.renderElementIndex ?? t.elementIndex) && e.origin === t.origin && e.shapeId === t.shapeId && n.row === r.row && n.column === r.column;
}
function pt(e, t) {
	for (let n = 1; n < t.length; n++) {
		let r = e[t[n - 1].runIndex], i = e[t[n].runIndex];
		if (!r || !i || !ft(r, i)) return !1;
	}
	return !0;
}
var mt = class extends pe {
	constructor(e, t) {
		super(e, t, (e) => ({ slide: e }), pt);
	}
	slideRuns(e) {
		return this.unitRuns(e);
	}
	setSlideRuns(e, t) {
		this.setUnitRuns(e, t);
	}
	slideHighlights(e) {
		return this.unitHighlights(e);
	}
	activeSlide() {
		return this.activeUnit();
	}
};
async function ht(e) {
	return e ? (await import("./font-preload-demand-NqcVKIpX.js")).collectSlideFontDemand : void 0;
}
var gt = (e) => e >= "0" && e <= "9";
function _t(e) {
	let t = 0;
	for (let n = 0; n < 10; n++) t = Math.max(t, e.measureText(String(n)).width);
	return t;
}
function vt(e, t, n) {
	let r = 0;
	for (let i of t) r += gt(i) ? n : e.measureText(i).width;
	return r;
}
function yt(e, t, n, r, i) {
	let a = e.textAlign;
	e.textAlign = "left";
	let o = n;
	for (let n of t) if (gt(n)) {
		let t = e.measureText(n).width;
		e.fillText(n, o + (i - t) / 2, r), o += i;
	} else e.fillText(n, o, r), o += e.measureText(n).width;
	e.textAlign = a;
}
var z = (e, t) => e / h * t;
async function bt(e, t, n) {
	let i = e.getContext("2d");
	if (!i) throw Error("2D context not available");
	let a = n.width / (n.slideWidthEmu / h);
	await n.drawBase();
	let o = document.createElement("canvas");
	o.width = e.width, o.height = e.height;
	let s = o.getContext("2d");
	if (!s) throw Error("base 2D context not available");
	s.drawImage(e, 0, 0);
	let c = [], l = !1, u = () => {
		for (let e of c) {
			e.detachListeners(), e.media.pause(), e.media.removeAttribute("src");
			try {
				e.media.load();
			} catch {}
			URL.revokeObjectURL(e.objectUrl);
		}
		c.length = 0;
	}, d = (e) => {
		l || (n.onError ? n.onError(e) : console.error("[ooxml] PPTX embedded media failed:", e));
	};
	for (let e of t) {
		let t;
		try {
			t = await n.fetchMedia(e.mediaPath);
		} catch (t) {
			throw u(), t instanceof v || M(t) ? t : Ct(e, t);
		}
		let r = e.mimeType || t.type, i = t.type === r ? t : new Blob([t], { type: r }), o = URL.createObjectURL(i), s = e.mediaKind === "video" ? document.createElement("video") : document.createElement("audio");
		s.src = o, s.preload = "metadata", e.mediaKind === "video" && (s.playsInline = !0);
		let f = xt(e, a), p = {
			el: e,
			rect: e.mediaKind === "audio" ? {
				x: f.x + f.w / 2 - Math.max(f.w, 260) / 2,
				y: f.y,
				w: Math.max(f.w, 260),
				h: f.h + 36
			} : f,
			posterRect: f,
			media: s,
			objectUrl: o,
			loadState: "loading",
			detachListeners: () => {}
		}, m = () => {
			l || (p.loadState = "metadata");
		}, h = () => {
			l || (p.loadState = "ready");
		}, g = () => {
			l || (p.loadState = "error", d(B(e, s, "decode")));
		};
		s.addEventListener("loadedmetadata", m), s.addEventListener("canplay", h), s.addEventListener("error", g), p.detachListeners = () => {
			s.removeEventListener("loadedmetadata", m), s.removeEventListener("canplay", h), s.removeEventListener("error", g);
		}, c.push(p);
		try {
			s.load();
		} catch (t) {
			let n = B(e, s, "load", t);
			throw u(), n;
		}
	}
	let f = null, p = null, m = () => {
		i.setTransform(e.width / n.width, 0, 0, e.height / n.height, 0, 0), i.drawImage(o, 0, 0, e.width, e.height, 0, 0, n.width, n.height);
		for (let e of c) {
			let t = e.media;
			if (e.loadState !== "loading") {
				if (e.loadState === "error") {
					St(i, e.posterRect, "Media unavailable");
					continue;
				}
				if (e.el.mediaKind === "video" && t.readyState >= 2) {
					let { x: n, y: r, w: a, h: o } = e.posterRect;
					i.drawImage(t, n, r, a, o);
				}
				if (e === p || y?.state === e) Ot(i, e, t);
				else if (t.paused) {
					let { x: t, y: n, w: a, h: o } = e.posterRect;
					r(i, t + a / 2, n + o / 2, a, o, "paused");
				}
			}
		}
	}, g = () => {
		l || (m(), f = requestAnimationFrame(g));
	}, _ = (t, r) => {
		let i = e.getBoundingClientRect();
		return {
			x: (t - i.left) / i.width * n.width,
			y: (r - i.top) / i.height * n.height
		};
	}, ee = (e, t) => {
		for (let n of c) {
			let { x: r, y: i, w: a, h: o } = n.rect;
			if (e < r || e > r + a || t < i || t > i + o) continue;
			let s = U(n), c = s.y - 12, l = s.y + s.h + 8;
			return (Number.isFinite(n.media.duration) ? n.media.duration : 0) > 0 && e >= s.x && e <= s.x + s.w && t >= c && t <= l ? {
				kind: "seek",
				state: n,
				fraction: Math.max(0, Math.min(1, (e - s.x) / s.w))
			} : {
				kind: "toggle",
				state: n
			};
		}
		return null;
	}, y = null, b = (e, t) => {
		let n = Number.isFinite(e.media.duration) ? e.media.duration : 0;
		n <= 0 || (e.media.currentTime = n * t);
	}, x = (e) => {
		try {
			e.media.play().catch((t) => {
				d(B(e.el, e.media, "play", t));
			});
		} catch (t) {
			d(B(e.el, e.media, "play", t));
		}
	}, te = (t) => {
		let { x: n, y: r } = _(t.clientX, t.clientY), i = ee(n, r);
		i && (i.kind === "seek" ? (y = {
			state: i.state,
			wasPlaying: !i.state.media.paused
		}, i.state.media.pause(), b(i.state, i.fraction), e.setPointerCapture(t.pointerId), t.preventDefault()) : i.state.media.paused ? x(i.state) : i.state.media.pause());
	}, S = (e) => {
		let { x: t, y: n } = _(e.clientX, e.clientY);
		p = null;
		for (let e of c) {
			let { x: r, y: i, w: a, h: o } = e.rect;
			if (t >= r && t <= r + a && n >= i && n <= i + o) {
				p = e;
				break;
			}
		}
		if (y) {
			let e = U(y.state), n = Math.max(0, Math.min(1, (t - e.x) / e.w));
			b(y.state, n);
		}
	}, C = () => {
		p = null;
	}, w = (t) => {
		if (!y) return;
		let { wasPlaying: n, state: r } = y;
		y = null, e.releasePointerCapture(t.pointerId), n && x(r);
	};
	return c.length > 0 && (e.addEventListener("pointerdown", te), e.addEventListener("pointermove", S), e.addEventListener("pointerleave", C), e.addEventListener("pointerup", w), e.addEventListener("pointercancel", w), e.style.cursor = "pointer", g()), {
		play(e) {
			for (let t of c) (!e || t.el.mediaPath === e) && x(t);
		},
		pause(e) {
			for (let t of c) (!e || t.el.mediaPath === e) && t.media.pause();
		},
		destroy() {
			l || (l = !0, f !== null && cancelAnimationFrame(f), e.removeEventListener("pointerdown", te), e.removeEventListener("pointermove", S), e.removeEventListener("pointerleave", C), e.removeEventListener("pointerup", w), e.removeEventListener("pointercancel", w), e.style.cursor = "", u());
		}
	};
}
function xt(e, t) {
	return {
		x: z(e.x, t),
		y: z(e.y, t),
		w: z(e.width, t),
		h: z(e.height, t)
	};
}
function St(e, t, n) {
	let r = Math.max(10, Math.min(14, t.h * .12));
	e.save(), e.font = `500 ${r}px system-ui, -apple-system, sans-serif`, e.textAlign = "center", e.textBaseline = "middle";
	let i = r + 12, a = Math.min(t.w, Math.max(100, e.measureText(n).width + 24));
	W(e, t.x + (t.w - a) / 2, t.y + (t.h - i) / 2, a, i, i / 2), e.fillStyle = "rgba(20, 20, 20, 0.72)", e.fill(), e.fillStyle = "rgba(255, 255, 255, 0.95)", e.fillText(n, t.x + t.w / 2, t.y + t.h / 2), e.restore();
}
function Ct(e, t) {
	return /* @__PURE__ */ Error(`Embedded ${e.mediaKind} fetch failed for "${e.mediaPath}" (mime=${e.mimeType || "unknown"}): ${wt(t)}`);
}
function B(e, t, n, r) {
	let i = "";
	try {
		i = e.mimeType ? t.canPlayType(e.mimeType) : "";
	} catch {}
	let a = t.error, o = [
		`mime=${e.mimeType || "unknown"}`,
		`canPlayType=${i || "no"}`,
		`readyState=${t.readyState}`,
		`networkState=${t.networkState}`
	];
	a && o.push(`mediaError=${a.code}${a.message ? ` ${a.message}` : ""}`);
	let s = r === void 0 ? "" : `: ${wt(r)}`;
	return /* @__PURE__ */ Error(`Embedded ${e.mediaKind} ${n} failed for "${e.mediaPath}" (${o.join("; ")})${s}`);
}
function wt(e) {
	return e instanceof Error ? `${e.name || "Error"}${e.message ? `: ${e.message}` : ""}` : String(e);
}
var Tt = 28, V = 14, Et = 72, Dt = 10, H = 3;
function Ot(e, t, n) {
	let i = Number.isFinite(n.duration) ? n.duration : 0, a = i > 0 ? Math.min(1, n.currentTime / i) : 0, o = t.posterRect;
	r(e, o.x + o.w / 2, o.y + o.h / 2, o.w, o.h, n.paused ? "paused" : "playing"), t.el.mediaKind === "audio" ? At(e, t, n, i, a) : kt(e, t, n, i, a);
}
function kt(e, t, n, r, i) {
	let { x: a, y: o, w: s, h: c } = t.rect, l = Math.max(28, Math.min(56, c * .22)), u = o + c - l;
	e.save();
	let d = e.createLinearGradient(0, u, 0, o + c);
	d.addColorStop(0, "rgba(0, 0, 0, 0)"), d.addColorStop(1, "rgba(0, 0, 0, 0.55)"), e.fillStyle = d, e.fillRect(a, u, s, l), e.restore();
	let f = U(t);
	Mt(e, f, i, r > 0), e.save(), e.font = "500 11px system-ui, -apple-system, sans-serif", e.textBaseline = "middle", e.shadowColor = "rgba(0, 0, 0, 0.75)", e.shadowBlur = 3, e.fillStyle = "rgba(255, 255, 255, 0.95)", jt(e, n.currentTime, r, f.x, f.y - 10, "bottom"), e.restore();
}
function At(e, t, n, r, i) {
	let a = Nt(t.rect);
	e.save(), W(e, a.x, a.y, a.w, a.h, a.h / 2), e.fillStyle = "rgba(20, 20, 20, 0.72)", e.fill(), e.font = "500 11px system-ui, -apple-system, sans-serif", e.textBaseline = "middle", e.fillStyle = "rgba(255, 255, 255, 0.95)", jt(e, n.currentTime, r, a.x + V, a.y + a.h / 2, "middle"), e.restore(), Mt(e, U(t), i, r > 0);
}
function jt(e, t, n, r, i, a) {
	let o = Pt(t), s = Pt(n), c = _t(e), l = vt(e, o, c), u = vt(e, s, c), d = e.measureText(" / ").width, f = Math.max(l, u);
	yt(e, o, r + f - l, i, c);
	let p = e.textAlign;
	e.textAlign = "left", e.fillText(" / ", r + f, i), e.textAlign = p, yt(e, s, r + f + d, i, c);
}
function Mt(e, t, n, r) {
	let i = t.h / 2;
	if (e.save(), W(e, t.x, t.y, t.w, t.h, i), e.fillStyle = "rgba(255, 255, 255, 0.35)", e.fill(), n > 0 && (W(e, t.x, t.y, t.w * n, t.h, i), e.fillStyle = "#fff", e.fill()), r) {
		let r = Math.max(t.x + 5, Math.min(t.x + t.w - 5, t.x + t.w * n));
		e.shadowColor = "rgba(0, 0, 0, 0.3)", e.shadowBlur = 3, e.fillStyle = "#fff", e.beginPath(), e.arc(r, t.y + t.h / 2, 5, 0, Math.PI * 2), e.fill();
	}
	e.restore();
}
function Nt(e) {
	let t = Math.max(220, e.w - 24);
	return {
		x: e.x + e.w / 2 - t / 2,
		y: e.y + e.h - Tt - 4,
		w: t,
		h: Tt
	};
}
function U(e) {
	if (e.el.mediaKind === "audio") {
		let t = Nt(e.rect), n = t.x + V + Et + Dt, r = Math.max(40, t.x + t.w - V - n);
		return {
			x: n,
			y: t.y + (t.h - H) / 2,
			w: r,
			h: H
		};
	}
	let t = e.rect, n = Math.max(12, t.w * .025), r = Math.max(12, Math.min(18, t.h * .05));
	return {
		x: t.x + n,
		y: t.y + t.h - H - r,
		w: t.w - n * 2,
		h: H
	};
}
function W(e, t, n, r, i, a) {
	let o = Math.min(a, i / 2, r / 2);
	e.beginPath(), e.moveTo(t + o, n), e.lineTo(t + r - o, n), e.quadraticCurveTo(t + r, n, t + r, n + o), e.lineTo(t + r, n + i - o), e.quadraticCurveTo(t + r, n + i, t + r - o, n + i), e.lineTo(t + o, n + i), e.quadraticCurveTo(t, n + i, t, n + i - o), e.lineTo(t, n + o), e.quadraticCurveTo(t, n, t + o, n), e.closePath();
}
function Pt(e) {
	if (!Number.isFinite(e) || e < 0) return "0:00";
	let t = Math.floor(e);
	return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}`;
}
function Ft(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		r !== void 0 && r !== "" && !t.has(r) && t.set(r, n);
	}
	return t;
}
function It(e, t) {
	if (e === "") return;
	if (e.startsWith("ppt/")) return t.get(e);
	let n = st("ppt/slides", e);
	return t.get(n);
}
function Lt(e, t, n) {
	let r = ct(e);
	return r === null ? It(e, t) : lt(r, n, t.size);
}
function Rt(e) {
	let t = E(e.family);
	return e.presenceOnly ? `presence:${t}` : `${t}:${e.weight ?? 400}:${e.style ?? "normal"}`;
}
async function zt(e, t, n, r = null) {
	let i = /* @__PURE__ */ new Map();
	for (let n of t) {
		let t = Rt(n);
		!e.has(t) && !i.has(t) && i.set(t, n);
	}
	if (i.size > 0) {
		let t = n([...i.values()]);
		for (let n of i.keys()) e.set(n, t);
	}
	let a = new Set(t.map((t) => e.get(Rt(t)))), o = await Promise.all(a), s = Object.assign(g(), ...o.map((e) => e.routes)), c = new Set(o.flatMap((e) => e.installed ?? [])), l = g(), u = /* @__PURE__ */ new Set();
	for (let e of t) {
		let t = E(e.family);
		if (e.presenceOnly) {
			c.has(t) && u.add(t);
			continue;
		}
		let n = Vt(e), r = _(s, n);
		r && (l[n] = r, u.add(t));
	}
	for (let e of Bt(r)) u.delete(e);
	return {
		routes: l,
		installed: [...u].sort()
	};
}
function Bt(e) {
	return !e || typeof e[Symbol.iterator] != "function" ? /* @__PURE__ */ new Set() : new Set([...e].map((e) => E(e.family.replace(/^(['"])(.*)\1$/u, "$2"))));
}
function Vt(e) {
	let t = E(e.family), n = e.weight ?? 400, r = e.style ?? "normal";
	return n === 400 && r === "normal" ? t : `${t}:${n}:${r}`;
}
function Ht(e) {
	return [...new Set(e.values())];
}
var Ut = class {
	#e;
	#t;
	#n;
	#r = 0;
	#i = Promise.resolve();
	#a;
	#o;
	constructor(e) {
		if (!Number.isSafeInteger(e.slideCount) || e.slideCount < 0) throw TypeError("slideCount must be a non-negative safe integer");
		this.#e = e.slideCount, this.#t = e.loadSlide, this.#n = new ue({
			maxEntries: e.maxCachedSlides,
			maxWeight: e.maxCachedStructuralBytes,
			measure: (e) => ot(e).jsonBytes
		});
	}
	get slideCount() {
		return this.#e;
	}
	get usage() {
		return this.#n.usage;
	}
	withSlide(e, t) {
		this.#c(e);
		let n = this.#r, r = this.#i.then(async () => {
			if (n !== this.#r) throw this.#a ? this.#a : Error("PPTX slide repository generation is stale");
			if (this.#a) throw this.#a;
			let r = await this.#s(e, n);
			try {
				return await t(r);
			} catch (e) {
				let t = Wt(e);
				throw t ? (this.#l(t, n), this.#o === n ? this.#a ?? t : t) : e;
			}
		});
		return this.#i = r.then(() => void 0, () => void 0), r;
	}
	async #s(e, t) {
		return this.#n.getOrLoad(e, async () => {
			let n;
			try {
				n = await this.#t(e);
			} catch (e) {
				let n = Wt(e);
				throw n ? (this.#l(n, t), this.#o === t ? this.#a ?? n : n) : e;
			}
			if (this.#o === t && this.#a) throw this.#a;
			return n;
		});
	}
	clear() {
		this.#r += 1, this.#a = void 0, this.#o = void 0, this.#n.clear();
	}
	#c(e) {
		if (!Number.isSafeInteger(e) || e < 0 || e >= this.#e) throw RangeError(`Slide index ${e} out of range (count: ${this.#e})`);
	}
	#l(e, t) {
		t !== this.#r || this.#a || (this.#a = e, this.#o = t, this.#r += 1, this.#n.clear());
	}
};
function Wt(e) {
	return e instanceof v ? e : S(e);
}
function Gt(e, t) {
	return e.filter((e) => !t.has(`${e.family.toLowerCase()}:${e.weight}:${e.style}`));
}
var Kt = 1;
function G(e) {
	return e.trim().toLowerCase();
}
async function qt(e, t) {
	if (e.length === 0) return {
		faces: [],
		aliases: /* @__PURE__ */ new Map(),
		authoredFamilies: /* @__PURE__ */ new Map(),
		tuples: /* @__PURE__ */ new Set()
	};
	let n = Kt++, r = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = G(t.fontName);
		r.has(e) || r.set(e, `__ooxml_pptx_${n}_${r.size + 1}`);
	}
	let i = [], a = /* @__PURE__ */ new Set();
	try {
		for (let n = 0; n < e.length; n += 2) {
			let o = (await Promise.all(e.slice(n, n + 2).map(async (e) => {
				try {
					return {
						family: r.get(G(e.fontName)),
						bytes: await t(e.partPath),
						odttf: !1,
						weight: e.style === "bold" || e.style === "boldItalic" ? "bold" : "normal",
						style: e.style === "italic" || e.style === "boldItalic" ? "italic" : "normal"
					};
				} catch (e) {
					if (e instanceof v || M(e)) throw e;
					let t = S(e);
					if (t) throw t;
					return null;
				}
			}))).filter((e) => e !== null);
			if (o.length !== 0) for (let e of await he(o)) a.has(e) ? k([e]) : (a.add(e), i.push(e));
		}
	} catch (e) {
		throw k(i), e;
	}
	let o = new Set(i.map((e) => G(e.family))), s = new Map([...r].filter(([, e]) => o.has(G(e)))), c = new Map([...s].map(([e, t]) => [t, e]));
	return {
		faces: i,
		aliases: s,
		authoredFamilies: c,
		tuples: new Set(i.map((e) => `${c.get(e.family)}:${e.weight === "bold" || e.weight === "700" ? 700 : 400}:${e.style === "italic" ? "italic" : "normal"}`))
	};
}
function K(e, t) {
	return e.filter((e) => e === null || !t.has(e.trim().toLowerCase()));
}
var Jt = "var e=Object.defineProperty,t=(e,t)=>()=>(e&&(t=e(e=0)),t),n=(t,n)=>{let r={};for(var i in t)e(r,i,{get:t[i],enumerable:!0});return n||e(r,Symbol.toStringTag,{value:`Module`}),r},r,i,a=t((()=>{r=class e extends Error{code;details;constructor(t,n,r){super(n),this.name=`OoxmlError`,this.code=t,t===`unsupported-content`&&r&&(this.details=Object.freeze({format:r.format,reason:r.reason})),Object.setPrototypeOf(this,e.prototype)}},i=class e extends Error{code=`ooxml-resource-limit`;details;constructor(t,n){super(t),this.name=`OoxmlResourceLimitError`;let r=n.violation,i=Object.freeze({format:r.format,operation:r.operation,resource:r.resource,metric:r.metric,...r.part===void 0?{}:{part:r.part},limit:r.limit,observed:r.observed,configurable:r.configurable,usage:Object.freeze({archiveEntryCount:r.usage.archiveEntryCount,declaredInflatedBytes:r.usage.declaredInflatedBytes,...r.usage.largestInflatedEntryBytes===void 0?{}:{largestInflatedEntryBytes:r.usage.largestInflatedEntryBytes},distinctInflatedBytes:r.usage.distinctInflatedBytes,operationInflatedBytes:r.usage.operationInflatedBytes})});this.details=Object.freeze({stage:n.stage,violation:i}),Object.setPrototypeOf(this,e.prototype)}}}));function o(e,t){return t!=null&&Object.hasOwn(e,t)?e[t]:void 0}var s=t((()=>{})),c,l,u,d,f,p=t((()=>{c=134217728,l=268435456,u=4096,d=67108864,f=67108864})),m,h,g,_,v=t((()=>{m=`https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap`,h=`https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap`,g=`https://fonts.googleapis.com/css2?family=Libre+Franklin:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap`,_={calibri:{url:`https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap`,loadFamily:`Carlito`},cambria:{url:`https://fonts.googleapis.com/css2?family=Caladea:ital,wght@0,400;0,700;1,400;1,700&display=swap`,loadFamily:`Caladea`},\"franklin gothic book\":{url:g,loadFamily:`Libre Franklin`},\"franklin gothic medium\":{url:g,loadFamily:`Libre Franklin`},\"nunito sans\":{url:`https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap`},nunito:{url:`https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,700;1,400;1,700&display=swap`},\"open sans\":{url:`https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap`},roboto:{url:`https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap`},lato:{url:`https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400;1,700&display=swap`},montserrat:{url:`https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&display=swap`},poppins:{url:`https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,700;1,400;1,700&display=swap`},raleway:{url:`https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,700;1,400;1,700&display=swap`},\"playfair display\":{url:`https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap`},ubuntu:{url:`https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,400;0,700;1,400;1,700&display=swap`},\"sakkal majalla\":{url:m,loadFamily:`Noto Naskh Arabic`,script:`arabic`},\"traditional arabic\":{url:m,loadFamily:`Noto Naskh Arabic`,script:`arabic`},\"simplified arabic\":{url:m,loadFamily:`Noto Naskh Arabic`,script:`arabic`},\"arabic typesetting\":{url:m,loadFamily:`Noto Naskh Arabic`,script:`arabic`},\"univers next arabic\":{url:h,loadFamily:`Noto Sans Arabic`,script:`arabic`},\"noto naskh arabic\":{url:m,loadFamily:`Noto Naskh Arabic`},\"noto sans arabic\":{url:h,loadFamily:`Noto Sans Arabic`}}}));function ee(e){return e?o(re,e.trim().toLowerCase())??null:null}function y(e){if(!e)return null;let t=ee(e)??e.trim(),n=t.toLowerCase(),r=n.match(/^noto\\s+(?:sans|serif)\\s+(?:cjk\\s+)?(sc|tc|hk|jp|kr)$/);return r?r[1]:/[ᄀ-ᇿ㄰-㆏가-힯]/.test(t)?`kr`:/[぀-ヿ]/.test(t)?`jp`:/jhenghei|微軟正黑|新細明|細明|pmingliu|mingliu|dfkai|標楷|華康|cns11643|kaiti tc|ming\\s*liu/.test(n)||/新細明體|細明體|標楷體|微軟正黑體|華康/.test(t)?`tc`:/simsun|nsimsun|simhei|simkai|simfang|yahei|dengxian|fangsong|kaiti|youyuan|lisu|stsong|stkaiti|stfangsong|stheiti|stxihei|stzhongsong|songti sc|heiti sc|微软雅黑/.test(n)||/宋体|黑体|楷体|仿宋|等线|微软雅黑|隶书|幼圆/.test(t)?`sc`:/malgun|batang|gulim|dotum|gungsuh|nanum|new gulim|hancom|hy(gothic|graphic|namu)?/.test(n)?`kr`:/\\bmeiryo\\b|\\byu\\s*(gothic|mincho)\\b|yugothic|yumincho|hiragino|\\bms\\s*(gothic|mincho|pgothic|pmincho|ui\\s*gothic)\\b|\\bms[pg]?(gothic|mincho)\\b|ipa(ex)?(gothic|mincho)|noto\\s+(sans|serif)\\s+jp|游ゴシック|游明朝|ＭＳ|メイリオ|ヒラギノ/.test(n)||/游ゴシック|游明朝|ＭＳ ゴシック|ＭＳ 明朝|ＭＳ Ｐゴシック|メイリオ|ヒラギノ/.test(t)?`jp`:null}function te(e){return/\\p{Script=Han}/u.test(e)}function ne(e,t,n=!1){let r=new se(t);return r.addText(e),r.names(n)}var re,b,ie,ae,oe,se,ce=t((()=>{s(),re={\"noto sans cjk sc\":`Noto Sans SC`,\"noto serif cjk sc\":`Noto Serif SC`,\"noto sans cjk tc\":`Noto Sans TC`,\"noto serif cjk tc\":`Noto Serif TC`,\"noto sans cjk jp\":`Noto Sans JP`,\"noto serif cjk jp\":`Noto Serif JP`,\"noto sans cjk kr\":`Noto Sans KR`,\"noto serif cjk kr\":`Noto Serif KR`,\"noto sans cjk hk\":`Noto Sans HK`},b=e=>`https://fonts.googleapis.com/css2?family=${e}:wght@400;700&display=swap`,ie={\"noto sans kr\":{url:b(`Noto+Sans+KR`)},\"noto sans sc\":{url:b(`Noto+Sans+SC`)},\"noto sans tc\":{url:b(`Noto+Sans+TC`)},\"noto sans hk\":{url:b(`Noto+Sans+HK`)},\"noto sans jp\":{url:b(`Noto+Sans+JP`)},\"noto serif kr\":{url:b(`Noto+Serif+KR`)},\"noto serif sc\":{url:b(`Noto+Serif+SC`)},\"noto serif tc\":{url:b(`Noto+Serif+TC`)},\"noto serif jp\":{url:b(`Noto+Serif+JP`)}},ae=Object.fromEntries(Object.entries(re).map(([e,t])=>[e,{...ie[t.toLowerCase()],loadFamily:t}])),oe={...ie,...ae,\"noto sans\":{url:b(`Noto+Sans`)},\"noto serif\":{url:b(`Noto+Serif`)},\"noto sans devanagari\":{url:b(`Noto+Sans+Devanagari`)},\"noto sans thai\":{url:b(`Noto+Sans+Thai`)},\"noto sans hebrew\":{url:b(`Noto+Sans+Hebrew`)},\"noto serif hebrew\":{url:b(`Noto+Serif+Hebrew`)}},se=class e{cjkLang;hasHan=!1;hasHangul=!1;hasKana=!1;hasArabic=!1;hasThai=!1;hasHebrew=!1;hasDevanagari=!1;hasCyrGreek=!1;constructor(e){this.cjkLang=e}scriptCjkLanguage(){return this.hasHangul?`kr`:this.hasKana?`jp`:null}preferredCjkLanguage(){return this.scriptCjkLanguage()??this.cjkLang??`jp`}clone(){let t=new e(this.cjkLang);return t.hasHan=this.hasHan,t.hasHangul=this.hasHangul,t.hasKana=this.hasKana,t.hasArabic=this.hasArabic,t.hasThai=this.hasThai,t.hasHebrew=this.hasHebrew,t.hasDevanagari=this.hasDevanagari,t.hasCyrGreek=this.hasCyrGreek,t}addText(e){let t=()=>this.hasHan&&this.hasHangul&&this.hasKana&&this.hasArabic&&this.hasThai&&this.hasHebrew&&this.hasDevanagari&&this.hasCyrGreek;outer:for(let n of e)if(n)for(let e of n){let n=e.codePointAt(0);if(n!==void 0&&!(n<=591)&&(n>=4352&&n<=4607||n>=12592&&n<=12687||n>=44032&&n<=55215?this.hasHangul=!0:n>=12352&&n<=12543?this.hasKana=!0:te(e)?this.hasHan=!0:n>=1536&&n<=1791||n>=1872&&n<=1919||n>=2208&&n<=2303||n>=64336&&n<=65023||n>=65136&&n<=65279?this.hasArabic=!0:n>=3584&&n<=3711?this.hasThai=!0:n>=1424&&n<=1535||n>=64285&&n<=64335?this.hasHebrew=!0:n>=2304&&n<=2431?this.hasDevanagari=!0:(n>=1024&&n<=1279||n>=880&&n<=1023)&&(this.hasCyrGreek=!0),t()))break outer}}names(e=!1){let t=[],n=new Set;this.hasHangul&&n.add(`kr`),this.hasKana&&n.add(`jp`),this.hasHan&&(n.size===0||e)&&n.add(this.cjkLang??`jp`);for(let e of[`kr`,`sc`,`tc`,`hk`,`jp`])if(n.has(e)){let n={kr:`KR`,sc:`SC`,tc:`TC`,hk:`HK`,jp:`JP`}[e];t.push(`Noto Sans ${n}`),e!==`hk`&&t.push(`Noto Serif ${n}`)}return this.hasCyrGreek&&t.push(`Noto Sans`,`Noto Serif`),this.hasArabic&&t.push(`Noto Naskh Arabic`,`Noto Sans Arabic`),this.hasThai&&t.push(`Noto Sans Thai`),this.hasHebrew&&t.push(`Noto Sans Hebrew`,`Noto Serif Hebrew`),this.hasDevanagari&&t.push(`Noto Sans Devanagari`),t}}}));function le(e){return e===`image-dimension`||e===`image-pixels`||e===`active-decoded-bytes`||e===`image-effect-count`||e===`image-effect-work`||e===`tiff-lzw-work`||e===`metafile-path-commands`||e===`metafile-record-points`||e===`metafile-record-polygons`||e===`metafile-record-rectangles`||e===`metafile-record-text-units`}function ue(e){return typeof e==`number`&&Number.isSafeInteger(e)&&e>=0}function de(e){if(!(!e||typeof e!=`object`))try{let t=e,n=t.code,r=t.metric,i=t.limit,a=t.observed;return n!==`ooxml-decoded-image-limit`||!le(r)||!ue(i)||!ue(a)||a<=i?void 0:{metric:r,limit:i,observed:a}}catch{return}}var fe,pe,me,he,ge,_e=t((()=>{fe=1<<25,pe=1<<27,fe*4,pe*4,me=Math.floor(fe/4),he=pe,he/me,ge=class e extends RangeError{metric;limit;observed;code=`ooxml-decoded-image-limit`;constructor(t,n,r){super(`OOXML decoded image limit exceeded: ${t} ${r} > ${n}`),this.metric=t,this.limit=n,this.observed=r,this.name=`OoxmlDecodedImageLimitError`,Object.setPrototypeOf(this,e.prototype)}}}));function ve(e){return ye.test(e)}var ye,be=t((()=>{ye=/[\\u0590-\\u08FF\\uFB1D-\\uFDFF\\uFE70-\\uFEFF\\u200F\\u202B\\u202E\\u2067]|[\\u{10800}-\\u{10FFF}\\u{1E800}-\\u{1EFFF}]/u}));function xe(e){if(!(typeof e!=`object`||!e))try{let t=e,n=t.code,r=t.message;return n===`ooxml-tiff-decode`&&typeof r==`string`?{message:r}:void 0}catch{return}}var Se,Ce=t((()=>{Se=class e extends Error{code=`ooxml-tiff-decode`;constructor(t,n){super(t,n),this.name=`TiffDecodeError`,Object.setPrototypeOf(this,e.prototype)}}}));function we(e){if(!e.startsWith(`data:`))return null;let t=e.indexOf(`,`);if(t===-1)return null;let n=atob(e.slice(t+1)),r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);return r.buffer}var Te=t((()=>{}));function Ee(e){return typeof e==`number`&&Number.isSafeInteger(e)&&e>0}function De(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;return Ee(t.requiredBytes)&&Ee(t.offeredBytes)&&t.requiredBytes>t.offeredBytes}function Oe(e){if(e instanceof x)return e;let t=e instanceof Error?e.message:String(e);if(!t.startsWith(je))return;let n;try{n=JSON.parse(t.slice(26))}catch{return}if(!n||typeof n!=`object`||Array.isArray(n))return;let r=n;if(!(r.code!==`ooxml-insufficient-credit`||!De(r)))return new x(r)}function ke(e,t,n){let r=Oe(e);if(!(!r||r.offeredBytes!==t||r.requiredBytes>n))return r}var Ae,je,x,Me=t((()=>{Ae=`ooxml-insufficient-credit`,je=`OOXML_INSUFFICIENT_CREDIT:`,x=class e extends RangeError{code=Ae;requiredBytes;offeredBytes;constructor(t){super(`Pull unit requires ${t.requiredBytes} bytes but credit is ${t.offeredBytes}`),this.name=`PullSessionInsufficientCreditError`,this.requiredBytes=t.requiredBytes,this.offeredBytes=t.offeredBytes,Object.setPrototypeOf(this,e.prototype)}}}));function S(e){return typeof e==`number`&&Number.isSafeInteger(e)&&e>=0}function Ne(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;return S(t.archiveEntryCount)&&S(t.declaredInflatedBytes)&&(t.largestInflatedEntryBytes===void 0||S(t.largestInflatedEntryBytes))&&S(t.distinctInflatedBytes)&&S(t.operationInflatedBytes)}function Pe(e){let t;try{t=JSON.parse(new TextDecoder().decode(e))}catch{throw TypeError(`OOXML resource usage checkpoint is not valid JSON`)}if(!Ne(t))throw TypeError(`OOXML resource usage checkpoint is invalid`);return t}function Fe(e){return e===`docx`||e===`xlsx`||e===`pptx`}function Ie(e){return e===`container`||e===`decompression`||e===`parsing`||e===`serialization`||e===`layout`||e===`rendering`||e===`worker`}function C(e,t){return typeof e==`string`&&e.length>0&&e.length<=t&&!/[\\u0000-\\u001f\\u007f]/u.test(e)}function w(e){return C(e,D)&&/^[a-z0-9][a-z0-9-]*$/u.test(e)}function Le(e){return!C(e,rt)||e.startsWith(`/`)||e.startsWith(`\\\\`)||e.includes(`\\\\`)||e.includes(`?`)||e.includes(`#`)||e.includes(`://`)||/^[a-z]:/iu.test(e)?!1:e.split(`/`).every(e=>e!==``&&e!==`.`&&e!==`..`)}function Re(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;return!Fe(t.format)||!C(t.operation,nt)||!w(t.resource)||!w(t.metric)||!S(t.limit)||!S(t.observed)||typeof t.configurable!=`boolean`||!Ne(t.usage)?!1:!(`part`in t)||Le(t.part)}function T(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;if(!Ie(t.stage)||!Re(t.violation))return!1;let n=t.violation,r=it.get(`${n.resource}:${n.metric}`);return r?t.stage!==r.stage||r.configurable===!1&&n.configurable!==!1?!1:r.part===`required`?n.part!==void 0:r.part===`forbidden`?n.part===void 0:!0:!(at.has(n.resource)&&ot.has(n.metric))}function ze(e){return{archiveEntryCount:e.archiveEntryCount,declaredInflatedBytes:e.declaredInflatedBytes,...e.largestInflatedEntryBytes===void 0?{}:{largestInflatedEntryBytes:e.largestInflatedEntryBytes},distinctInflatedBytes:e.distinctInflatedBytes,operationInflatedBytes:e.operationInflatedBytes}}function Be(e){if(!T(e))return;let t=e.violation,n={stage:e.stage,violation:{format:t.format,operation:t.operation,resource:t.resource,metric:t.metric,...t.part===void 0?{}:{part:t.part},limit:t.limit,observed:t.observed,configurable:t.configurable,usage:ze(t.usage)}};return T(n)?n:void 0}function Ve(e){let t=e.violation;return`OOXML resource limit exceeded${t.part?` for ${t.part}`:``} (${t.resource}, ${e.stage}): ${t.metric} ${t.observed} > ${t.limit}`}function He(e){let t=e instanceof Error?e.message:String(e);if(!t.startsWith(et))return;let n;try{n=JSON.parse(t.slice(21))}catch{return}if(!n||typeof n!=`object`)return;let r=n;if(!(r.code!==`ooxml-resource-limit`||!T(r.details)))return new i(Ve(r.details),r.details)}function Ue(e){try{return e()}catch(e){throw e instanceof i||typeof e!=`string`&&!(e instanceof Error)?e:He(e)??e}}function We(e){let t=e instanceof Error?e.message:String(e);if(t.startsWith(tt))return new r(`not-ooxml`,`This file is not an Office Open XML document: ${t.slice(16)}`)}function Ge(e){if(!e||typeof e!=`object`||Array.isArray(e))return;let t=e,n=t.format,r=t.reason;if(!(!w(n)||r!==`source-subset`))return{format:n,reason:r}}function Ke(e){return new r(`unsupported-content`,`Input is outside the source’s supported subset.`,e)}function qe(e){let t=typeof e==`string`?e:e instanceof Error?e.message:``;if(!(!t.startsWith(`MODEL_SOURCE_UNSUPPORTED:`)||t.length>1024))try{let e=Ge(JSON.parse(t.slice(25)));return e?Ke(e):void 0}catch{return}}function Je(e){return e===`OOXML_SOURCE_UNSUPPORTED_ENCRYPTION`||e instanceof Error&&e.message===`OOXML_SOURCE_UNSUPPORTED_ENCRYPTION`?new r(`unsupported-encryption`,`The configured source cannot decrypt this input.`):qe(e)??He(e)??We(e)}function Ye(e){let t=de(e);if(t){let e=new ge(t.metric,t.limit,t.observed);return{message:e.message,errorName:e.name,code:e.code,decodedImage:t}}let n=xe(e);if(n)return{message:n.message,errorName:`TiffDecodeError`,code:`ooxml-tiff-decode`};let a=Oe(e);if(a)return{message:a.message,errorName:a.name,code:a.code,insufficientCredit:{requiredBytes:a.requiredBytes,offeredBytes:a.offeredBytes}};let o=e instanceof r||e instanceof i?e:Je(e),s=o??e;if(o instanceof i||s&&typeof s==`object`&&s.code===`ooxml-resource-limit`){let e=s,t=Be(e.details);return t?{message:typeof e.message==`string`?e.message:Ve(t),errorName:`OoxmlResourceLimitError`,code:`ooxml-resource-limit`,resourceLimit:t}:{message:`Invalid OOXML resource-limit error payload`,errorName:`Error`}}if(s&&typeof s==`object`&&s.code===`unsupported-content`){let e=Ge(s.details);return e?{message:Ke(e).message,code:`unsupported-content`,unsupportedContent:e}:{message:`Invalid unsupported-content error payload`,errorName:`Error`}}if(o instanceof r)return{message:typeof o.message==`string`?o.message:String(o.message),errorName:C(o.name,D)?o.name:`OoxmlError`,...w(o.code)?{code:o.code}:{}};let c=e instanceof Error?e.message:String(e);if(typeof c==`string`&&c.startsWith(et))return{message:`Invalid OOXML resource-limit payload`,errorName:`Error`};let l=e instanceof Error?e:Error(c),u=l;return{message:typeof l.message==`string`?l.message:String(l.message),errorName:C(l.name,D)?l.name:`Error`,...typeof u.code==`string`?{code:u.code}:{}}}function E(e){try{return Ye(e)}catch{return{message:`Worker operation failed with an unreadable error`,errorName:`Error`}}}function Xe(e){return typeof e==`string`&&Object.prototype.hasOwnProperty.call(ct,e)}function Ze(e,t){if(e!==`ooxml-decoded-image-limit`||!t||typeof t!=`object`)return;let n=t,r=n.metric,i=n.limit,a=n.observed;if(!(!Xe(r)||!S(i)||!S(a)||a<=i))return{metric:r,limit:i,observed:a}}function Qe(e){let t=e.message,n=e.errorName,a=e.code,o=e.decodedImage,s=e.insufficientCredit,c=e.resourceLimit,l=e.unsupportedContent,u=typeof t==`string`?t:`Worker operation failed with an invalid error payload`,d=C(n,D)?n:void 0,f=typeof a==`string`?a:void 0;if(f===`unsupported-content`){let e=Ge(l);return e?Ke(e):Error(`Invalid unsupported-content error payload`)}let p=Ze(f,o);if(p)return new ge(p.metric,p.limit,p.observed);if(f===`ooxml-tiff-decode`)return new Se(u);if(f===`ooxml-insufficient-credit`&&De(s))return new x(s);if(f===`ooxml-resource-limit`&&T(c))return new i(u,c);if(f&&st.has(f))return new r(f,u);let m=d===`TypeError`?TypeError(u):d===`RangeError`?RangeError(u):Error(u);return d&&(m.name=d),f!==void 0&&Object.assign(m,{code:f}),m}function $e(e){try{return Qe(e)}catch{return Error(`Worker operation failed with an unreadable error payload`)}}var et,tt,D,nt,rt,it,at,ot,st,ct,lt=t((()=>{a(),_e(),Ce(),Me(),et=`OOXML_RESOURCE_LIMIT:`,tt=`OOXML_NOT_OOXML:`,D=128,nt=256,rt=4096,it=new Map([[`archive-entry:declared-inflated-bytes`,{stage:`container`,part:`required`}],[`archive-entry:actual-inflated-bytes`,{stage:`decompression`,part:`required`}],[`archive:entry-count`,{stage:`container`,part:`forbidden`}],[`archive:central-directory-bytes`,{stage:`container`,part:`forbidden`,configurable:!1}],[`archive:distinct-inflated-bytes`,{stage:`decompression`,part:`required`}],[`xml-event:bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`xml-context:bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`image-effect:work`,{stage:`parsing`,part:`forbidden`,configurable:!1}],[`chartex-allocation:elements`,{stage:`parsing`,part:`forbidden`,configurable:!1}],[`chartex-allocation:bytes`,{stage:`parsing`,part:`forbidden`,configurable:!1}],[`chart-cache:points`,{stage:`parsing`,part:`forbidden`,configurable:!1}],[`numbering-marker:bytes`,{stage:`parsing`,part:`forbidden`,configurable:!1}],[`chart-style-formats:entries`,{stage:`parsing`,part:`required`,configurable:!1}],[`chart-custom-number-formats:entries`,{stage:`parsing`,part:`required`,configurable:!1}],[`chart-number-format-bytes:bytes`,{stage:`parsing`,part:`required`,configurable:!1}],[`xml-tree:depth`,{stage:`parsing`,part:`optional`,configurable:!1}],[`worksheet-row:projected-bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`worksheet-shell:projected-bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`theme-style-reparse:bytes`,{stage:`parsing`,part:`forbidden`,configurable:!1}],[`style-inheritance:depth`,{stage:`parsing`,part:`required`,configurable:!1}],[`complex-field:depth`,{stage:`parsing`,part:`forbidden`,configurable:!1}]]),at=new Set([...it.keys()].map(e=>e.slice(0,e.indexOf(`:`)))),ot=new Set([...it.keys()].map(e=>e.slice(e.indexOf(`:`)+1))),st=new Set([`encrypted`,`invalid-password`,`unsupported-encryption`,`legacy-binary-format`,`not-ooxml`,`invalid-numbering`,`unsupported-image-effect`]),ct={\"image-dimension\":!0,\"image-pixels\":!0,\"active-decoded-bytes\":!0,\"image-effect-count\":!0,\"image-effect-work\":!0,\"tiff-lzw-work\":!0,\"metafile-path-commands\":!0,\"metafile-record-points\":!0,\"metafile-record-polygons\":!0,\"metafile-record-rectangles\":!0,\"metafile-record-text-units\":!0}})),ut,dt=t((()=>{ut=class{initialize;reinitialize;normalizeFailure;state=`uninitialized`;generationValue=0;readiness;poisonListeners=new Set;constructor(e,t,n){this.initialize=e,this.reinitialize=t,this.normalizeFailure=n}get generation(){return this.generationValue}get poisoned(){return this.state===`poisoned`}onPoison(e){return this.poisonListeners.add(e),()=>this.poisonListeners.delete(e)}async ensureReady(){if(this.state!==`ready`){if(!this.readiness){let e=this.state===`uninitialized`?this.initialize:this.reinitialize;this.readiness=Promise.resolve().then(e).then(()=>{this.generationValue+=1,this.state=`ready`,this.readiness=void 0},e=>{throw this.readiness=void 0,e})}await this.readiness}}run(e){try{return e()}catch(e){let t=this.normalizeFailure(e);throw t?(this.poison(t),t):e}}tryRunReady(e){if(this.state!==`ready`)return{current:!1};let t=this.generationValue,n=this.run(e);return this.state!==`ready`||t!==this.generationValue?{current:!1}:{current:!0,generation:t,value:n}}poison(e){this.state=`poisoned`,this.readiness=void 0;for(let t of this.poisonListeners)t(e)}assertCurrent(e){if(this.state!==`ready`||e!==this.generationValue)throw Error(`WASM archive session belongs to a discarded runtime generation`)}}}));function ft(e){let t=globalThis.WebAssembly?.RuntimeError;return t&&e instanceof t||e instanceof RangeError?!0:e instanceof Error?e.name===`RuntimeError`||e.name===`CompileError`||e.name===`LinkError`||e.name===`InternalError`||e.name===`OOMError`:!1}function pt(e){try{if((typeof e!=`object`||!e)&&typeof e!=`function`)return;let t=Reflect.get(e,`__destroy_into_raw`);typeof t==`function`&&Reflect.apply(t,e,[])}catch{}}function mt(e,t){return e({module_or_path:t})}function ht(e){return ft(e)?new gt(`WASM parser trapped and was recycled: ${e instanceof Error?e.message:String(e)}`):null}var gt,_t,vt=t((()=>{lt(),dt(),gt=class e extends Error{code=`parser-crashed`;constructor(t){super(t),this.name=`WasmTrapError`,Object.setPrototypeOf(this,e.prototype)}},_t=class{init;options;runtime;wasmInput=null;currentArchive=null;constructor(e,t={}){this.init=e,this.options=t,this.runtime=new ut(()=>this.invokeConfigured(this.init),()=>this.invokeConfigured(this.options.reinit??this.init),ht),this.runtime.onPoison(()=>this.dropPoisonedArchive())}setWasmInput(e){this.wasmInput=e,this.runtime.ensureReady().catch(()=>void 0)}setWasmUrl(e){this.setWasmInput(e)}get archive(){return this.currentArchive}setArchive(e){this.freeArchive(),this.currentArchive=e}disposeArchive(){this.freeArchive()}get poisoned(){return this.runtime.poisoned}async ensureReady(){await this.runtime.ensureReady()}run(e){return Ue(()=>this.runtime.run(e))}poison(){this.runtime.poison(new gt(`WASM parser was recycled`))}invokeConfigured(e){return this.wasmInput===null?Promise.reject(Error(`WasmParserHost: setWasmInput was never called`)):mt(e,this.wasmInput)}freeArchive(){this.currentArchive!==null&&this.options.freeArchive&&this.options.freeArchive(this.currentArchive),this.currentArchive=null}dropPoisonedArchive(){let e=this.currentArchive;this.currentArchive=null,pt(e)}}}));function yt(e){return e.byteOffset===0&&e.byteLength===e.buffer.byteLength&&e.buffer instanceof ArrayBuffer?e.buffer:e.slice().buffer}var bt=t((()=>{}));function xt(e){return[e.maxArchiveEntryBytes===null?0n:BigInt(e.maxArchiveEntryBytes),e.maxTotalInflatedBytes===null?0n:BigInt(e.maxTotalInflatedBytes),e.maxArchiveEntries===null?0n:BigInt(e.maxArchiveEntries)]}var St=t((()=>{p(),Object.freeze({maxArchiveEntryBytes:c,maxTotalInflatedBytes:l,maxArchiveEntries:u})}));function O(e,t){if(!Number.isSafeInteger(e)||e<=0)throw RangeError(`${t} must be a positive safe integer`)}function Ct(e){if(!(typeof e==`string`&&e.length>0||typeof e==`number`&&Number.isSafeInteger(e)&&e>0))throw RangeError(`session id must be a non-empty string or positive safe integer`)}var k,wt,Tt,Et=t((()=>{lt(),Me(),k=`ooxml-pull-v1`,wt=class{owner;queue=Promise.resolve();leases=new Map;retainedBytes=0;retainedCount=0;maxRetainedBytes;maxRetainedCount;cleanups=new Set;pendingFatalCleanups=[];poisonRunning=!1;fatal;constructor(e){this.maxRetainedBytes=e?.maxRetainedBytes??64*1024*1024,this.maxRetainedCount=e?.maxRetainedCount??256,O(this.maxRetainedBytes,`max retained lease bytes`),O(this.maxRetainedCount,`max retained lease count`)}enqueue(e){let t=this.queue.then(e,e);return this.queue=t.then(()=>void 0,()=>void 0),t}acquire(e){return this.owner===void 0?(this.owner=e,!0):this.owner===e}release(e){this.owner===e&&(this.owner=void 0)}retainLease(e,t,n){if(!Number.isSafeInteger(n)||n<0)throw RangeError(`retained lease bytes are invalid`);let r=this.leases.get(e)??new Map;if(r.has(t))throw Error(`driver returned a duplicate lease id`);if(this.retainedCount+1>this.maxRetainedCount)throw RangeError(`retained lease count exceeds limit`);if(this.retainedBytes+n>this.maxRetainedBytes)throw RangeError(`retained lease bytes exceed limit`);r.set(t,n),this.leases.set(e,r),this.retainedCount++,this.retainedBytes+=n}releaseLease(e,t){let n=this.leases.get(e),r=n?.get(t);r!==void 0&&(n?.delete(t),n?.size===0&&this.leases.delete(e),this.retainedCount--,this.retainedBytes-=r)}registerCleanup(e){return this.fatal?(this.poisonRunning?this.pendingFatalCleanups.push(e):this.enqueue(e).catch(()=>void 0),()=>void 0):(this.cleanups.add(e),()=>this.cleanups.delete(e))}get fatalError(){return this.fatal}get registeredHostCount(){return this.cleanups.size}async poison(e){if(this.fatal??=e,this.poisonRunning)return this.fatal;this.poisonRunning=!0,this.pendingFatalCleanups.push(...this.cleanups);try{let e;for(;(e=this.pendingFatalCleanups.shift())!==void 0;)await e().catch(()=>void 0)}finally{this.poisonRunning=!1}return this.fatal}},Tt=class{options;coordinator;coordinatorOwner=Symbol(`pull-session-host`);unregisterCleanup;sequence=0;unacked;leases=new Map;activeDriverLeases=new Set;nextWireLeaseId;cancelRequested=!1;cancelComplete=!1;closeRequested=!1;closeComplete=!1;driverCancelComplete=!1;driverCloseComplete=!1;completed=!1;constructor(e){Ct(e.sessionId),O(e.operationId,`operation id`),O(e.generation,`generation`),O(e.maxByteCredit,`max byte credit`),e.wireLeaseIdStart!==void 0&&O(e.wireLeaseIdStart,`wire lease id start`),this.options=e,this.coordinator=e.coordinator,this.nextWireLeaseId=e.wireLeaseIdStart??1,this.unregisterCleanup=this.coordinator.registerCleanup(()=>this.forceFatalCleanup())}dispatch(e,t){return this.coordinator.enqueue(async()=>{let n=await this.execute(e);try{t(n.response,n.transfer)}catch(e){throw await this.rollbackFailedPost(n),e}})}async rollbackFailedPost(e){let t=e.response;if(t.kind===`chunk`){let n=t.leaseId===void 0?void 0:this.leases.get(t.leaseId);try{await this.options.driver.disposeInvalidChunk?.({payload:t.payload,byteLength:t.byteLength,done:t.done,leaseId:n?.driverLeaseId,retainedBytes:n?.retainedBytes,transfer:e.transfer})}catch{}}this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);for(let[e,t]of[...this.leases])try{await this.options.driver.releaseLease?.(t.driverLeaseId)}catch{}finally{this.leases.delete(e),this.activeDriverLeases.delete(t.driverLeaseId),this.coordinator.releaseLease(this.coordinatorOwner,e)}if(this.cancelRequested=!0,!this.driverCancelComplete)try{await this.options.driver.cancel?.(),this.driverCancelComplete=!0}catch{}this.unregisterCleanup()}async execute(e){try{if(this.isStaleLifecycle(e)){let t=e.kind===`cancel`?`cancel`:`close`;return this.sameOperationIdentity(e)?{response:this.accepted(e,t,!0)}:{response:this.errorResponse(e,{message:`stale lifecycle targets another session or operation`,errorName:`PullSessionProtocolError`,code:`ooxml-stale-lifecycle`})}}this.validateCommandIdentity(e);let t=this.coordinator.fatalError;if(t)return e.kind===`pull`?{response:this.errorResponse(e,t)}:(e.kind===`cancel`?await this.cancel():e.kind===`close`?await this.close():e.kind===`release`&&await this.release(e.leaseId),{response:this.accepted(e,e.kind)});switch(e.kind){case`pull`:return await this.pull(e);case`ack`:return await this.ack(e.sequence),{response:this.accepted(e,`ack`)};case`release`:return await this.release(e.leaseId),{response:this.accepted(e,`release`)};case`cancel`:return await this.cancel(),{response:this.accepted(e,`cancel`)};case`close`:return await this.close(),{response:this.accepted(e,`close`)}}}catch(t){let n=E(t);return n.code===`ooxml-resource-limit`&&(n=await this.coordinator.poison(n)),{response:this.errorResponse(e,n)}}}async pull(e){if(this.closeRequested||this.cancelRequested||this.completed)throw Error(`pull session is closed`);if(this.unacked)throw Error(`previous chunk is not acknowledged`);if(!Number.isSafeInteger(e.sequence)||e.sequence<0||e.sequence!==this.sequence)throw Error(`pull command sequence mismatch`);if(this.validateHostCredit(e.byteCredit),!this.coordinator.acquire(this.coordinatorOwner))throw Error(`another operation has an unacknowledged package chunk`);let t;try{t=await this.options.driver.pull(e.byteCredit)}catch(e){throw this.coordinator.release(this.coordinatorOwner),e}let n=!1,r=!1,i,a;try{let o=this.options.driver.measureChunk(t),s=this.arrayBufferTransferBytes(t.transfer);if(o<s)throw RangeError(`measured chunk bytes are below ArrayBuffer transfer bytes`);if(a=Math.max(o,s),t.leaseId!==void 0){if(O(t.leaseId,`lease id`),t.retainedBytes===void 0)throw Error(`retained lease bytes are required`);if(this.activeDriverLeases.has(t.leaseId))throw r=!0,Error(`driver returned an active duplicate lease id`);i=this.allocateWireLeaseId(),this.coordinator.retainLease(this.coordinatorOwner,i,t.retainedBytes),this.leases.set(i,{driverLeaseId:t.leaseId,retainedBytes:t.retainedBytes}),this.activeDriverLeases.add(t.leaseId),n=!0}else if(t.retainedBytes!==void 0)throw Error(`retained lease bytes require a lease id`);if(!Number.isSafeInteger(a)||a<0)throw RangeError(`host chunk byte length must be a non-negative safe integer`);if(a>e.byteCredit)throw RangeError(`host chunk exceeds byte credit`)}catch(e){let a;try{await this.options.driver.disposeInvalidChunk?.(t)}catch(e){a=e}if(n&&i!==void 0)try{await this.release(i)}catch(e){a??=e}else if(t.leaseId!==void 0&&!r)try{await this.options.driver.releaseLease?.(t.leaseId)}catch(e){a??=e}if(r)try{await this.cancel()}catch(e){a??=e}throw this.coordinator.release(this.coordinatorOwner),a||e}return this.unacked={sequence:this.sequence,done:t.done},{response:{kind:`chunk`,protocol:k,...this.identity(),requestId:e.requestId,sequence:this.sequence,byteLength:a,done:t.done,payload:t.payload,leaseId:i,usage:this.resourceUsage()},transfer:t.transfer}}async ack(e){if(!Number.isSafeInteger(e)||e<0)throw RangeError(`invalid ack sequence`);if(e<this.sequence)return;if(!this.unacked||e!==this.sequence)throw Error(`ack sequence mismatch`);let t=this.unacked.done;await this.options.driver.acknowledge?.(e),this.unacked=void 0,this.coordinator.release(this.coordinatorOwner),this.sequence++,t&&(this.completed=!0,this.maybeUnregisterCompleted())}async release(e){O(e,`wire lease id`);let t=this.leases.get(e);t&&(await this.options.driver.releaseLease?.(t.driverLeaseId),this.leases.delete(e),this.activeDriverLeases.delete(t.driverLeaseId),this.coordinator.releaseLease(this.coordinatorOwner,e),this.maybeUnregisterCompleted())}async cancel(){if(this.cancelComplete)return;this.cancelRequested=!0,this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);let e;try{await this.releaseAllLeases()}catch(t){e=t}if(!this.driverCancelComplete)try{await this.options.driver.cancel?.(),this.driverCancelComplete=!0}catch(t){e??=t}if(e)throw e;this.cancelComplete=!0,this.unregisterCleanup()}async close(){if(this.closeComplete)return;this.closeRequested=!0,this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);let e;try{await this.releaseAllLeases()}catch(t){e=t}if(!this.driverCloseComplete)try{await this.options.driver.close?.(),this.driverCloseComplete=!0}catch(t){e??=t}if(e)throw e;this.closeComplete=!0,this.unregisterCleanup()}async releaseAllLeases(){let e;for(let t of[...this.leases.keys()])try{await this.release(t)}catch(t){e??=t}if(e)throw e}validateCommandIdentity(e){if(e.protocol!==`ooxml-pull-v1`||e.sessionId!==this.options.sessionId||e.operationId!==this.options.operationId||e.generation!==this.options.generation||!Number.isSafeInteger(e.requestId)||e.requestId<=0)throw Error(`stale or mismatched pull session command`)}validateHostCredit(e){if(O(e,`byte credit`),e>this.options.maxByteCredit)throw RangeError(`byte credit exceeds host maximum`)}accepted(e,t,n=!1){return{kind:`accepted`,protocol:k,...n?{sessionId:e.sessionId,operationId:e.operationId,generation:e.generation}:this.identity(),requestId:e.requestId,command:t,usage:this.resourceUsage()}}identity(){return{sessionId:this.options.sessionId,operationId:this.options.operationId,generation:this.options.generation}}isStaleLifecycle(e){return(e.kind===`cancel`||e.kind===`close`)&&e.protocol===`ooxml-pull-v1`&&Number.isSafeInteger(e.requestId)&&e.requestId>0&&Number.isSafeInteger(e.generation)&&e.generation>0&&e.generation<this.options.generation}sameOperationIdentity(e){return e.sessionId===this.options.sessionId&&e.operationId===this.options.operationId}errorResponse(e,t){return{kind:`error`,protocol:k,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:t,usage:this.errorResourceUsage()}}async forceFatalCleanup(){this.cancelRequested=!0,this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);let e;for(let t of[...this.leases.keys()])try{await this.release(t)}catch(t){e??=t}if(!this.driverCancelComplete)try{await this.options.driver.cancel?.(),this.driverCancelComplete=!0}catch(t){e??=t}if(e)throw e;this.unregisterCleanup()}allocateWireLeaseId(){if(!Number.isSafeInteger(this.nextWireLeaseId)||this.nextWireLeaseId<=0)throw RangeError(`wire lease id space exhausted`);return this.nextWireLeaseId++}arrayBufferTransferBytes(e){let t=0;for(let n of e??[])if(n instanceof ArrayBuffer&&(t+=n.byteLength,!Number.isSafeInteger(t)))throw RangeError(`ArrayBuffer transfer bytes overflow`);return t}maybeUnregisterCompleted(){this.completed&&this.leases.size===0&&this.unregisterCleanup()}resourceUsage(){return this.options.driver.resourceUsage?.()}errorResourceUsage(){try{return this.resourceUsage()}catch{return}}}})),A=t((()=>{Te(),a(),vt(),lt(),Me(),bt(),_e(),Ce(),s(),v(),ce(),be(),St(),p(),Et()})),Dt=t((()=>{be()})),j=t((()=>{a(),s(),p(),v(),ce(),_e(),be(),Ce(),A(),Dt()})),Ot=t((()=>{}));function kt(){return At??=[0,191,198,198,208,208,215,216,222,223,230,230,240,240,247,248,254,254,272,273,294,295,305,307,312,312,319,322,329,331,338,339,358,359,383,415,418,430,433,460,477,477,484,485,497,499,502,503,540,541,544,549,564,767,847,847,880,883,885,887,890,893,895,895,900,900,913,929,931,937,945,969,975,978,981,1023,1026,1026,1028,1030,1032,1035,1039,1048,1050,1080,1082,1103,1106,1106,1108,1110,1112,1115,1119,1141,1144,1154,1160,1216,1219,1231,1236,1237,1240,1241,1248,1249,1256,1257,1270,1271,1274,1327,1329,1366,1369,1418,1421,1423,1470,1470,1472,1472,1475,1475,1478,1478,1488,1514,1519,1524,1536,1551,1563,1569,1575,1610,1632,1647,1649,1727,1729,1729,1731,1746,1748,1749,1757,1758,1765,1766,1769,1769,1774,1805,1807,1808,1810,1839,1869,1969,1984,2026,2036,2042,2046,2069,2074,2074,2084,2084,2088,2088,2096,2110,2112,2136,2142,2142,2144,2154,2160,2193,2208,2249,2274,2274,2304,2344,2346,2352,2354,2355,2357,2363,2365,2380,2382,2384,2389,2391,2400,2435,2437,2444,2447,2448,2451,2472,2474,2480,2482,2482,2486,2489,2493,2493,2495,2500,2503,2504,2510,2510,2528,2531,2534,2557,2561,2563,2565,2570,2575,2576,2579,2600,2602,2608,2610,2610,2613,2613,2616,2617,2622,2626,2631,2632,2635,2636,2641,2641,2652,2652,2662,2678,2689,2691,2693,2701,2703,2705,2707,2728,2730,2736,2738,2739,2741,2745,2749,2757,2759,2761,2763,2764,2768,2768,2784,2787,2790,2801,2809,2815,2817,2819,2821,2828,2831,2832,2835,2856,2858,2864,2866,2867,2869,2873,2877,2877,2879,2884,2887,2887,2901,2901,2911,2915,2918,2935,2946,2947,2949,2954,2958,2960,2962,2963,2965,2965,2969,2970,2972,2972,2974,2975,2979,2980,2984,2986,2990,3001,3007,3010,3014,3016,3024,3024,3046,3066,3072,3084,3086,3088,3090,3112,3114,3129,3133,3140,3142,3143,3146,3148,3160,3162,3164,3165,3168,3171,3174,3183,3191,3212,3214,3216,3218,3240,3242,3251,3253,3257,3261,3263,3265,3265,3267,3268,3270,3270,3276,3276,3292,3294,3296,3299,3302,3311,3313,3315,3328,3340,3342,3344,3346,3386,3389,3389,3391,3396,3398,3400,3406,3407,3412,3414,3416,3427,3430,3455,3457,3459,3461,3478,3482,3505,3507,3515,3517,3517,3520,3526,3536,3540,3542,3542,3544,3545,3547,3547,3558,3567,3570,3572,3585,3639,3647,3655,3660,3675,3713,3714,3716,3716,3718,3722,3724,3747,3749,3749,3751,3767,3771,3773,3776,3780,3782,3782,3788,3790,3792,3801,3804,3807,3840,3863,3866,3892,3894,3894,3896,3896,3898,3906,3908,3911,3913,3916,3918,3921,3923,3926,3928,3931,3933,3944,3946,3948,3959,3959,3961,3961,3966,3967,3973,3973,3976,3986,3988,3991,3993,3996,3998,4001,4003,4006,4008,4011,4013,4020,4022,4022,4024,4024,4026,4028,4030,4037,4039,4044,4046,4058,4096,4133,4135,4141,4143,4150,4152,4152,4155,4236,4238,4293,4295,4295,4301,4301,4304,4351,4371,4448,4470,4519,4547,4680,4682,4685,4688,4694,4696,4696,4698,4701,4704,4744,4746,4749,4752,4784,4786,4789,4792,4798,4800,4800,4802,4805,4808,4822,4824,4880,4882,4885,4888,4954,4960,4988,4992,5017,5024,5109,5112,5117,5120,5788,5792,5880,5888,5907,5919,5939,5941,5942,5952,5971,5984,5996,5998,6e3,6002,6003,6016,6097,6099,6108,6112,6121,6128,6137,6144,6169,6176,6264,6272,6312,6314,6314,6320,6389,6400,6430,6432,6443,6448,6456,6464,6464,6468,6509,6512,6516,6528,6571,6576,6601,6608,6618,6622,6678,6681,6683,6686,6750,6753,6772,6784,6793,6800,6809,6816,6829,6846,6846,6912,6917,6919,6919,6921,6921,6923,6923,6925,6925,6927,6929,6931,6963,6966,6970,6972,6972,6974,6975,6978,6978,6981,6988,6990,7018,7028,7081,7084,7141,7143,7153,7164,7222,7227,7241,7245,7306,7312,7354,7357,7367,7379,7379,7393,7393,7401,7404,7406,7411,7413,7415,7418,7418,7424,7615,7834,7834,7836,7839,7930,7935,8125,8125,8127,8128,8190,8190,8194,8292,8294,8305,8308,8334,8336,8348,8352,8385,8413,8416,8418,8420,8448,8485,8487,8489,8492,8587,8592,8601,8604,8621,8623,8652,8656,8707,8709,8712,8714,8715,8717,8739,8741,8741,8743,8768,8770,8771,8773,8774,8776,8776,8778,8799,8801,8801,8803,8812,8818,8819,8822,8823,8826,8831,8834,8835,8838,8839,8842,8875,8880,8927,8932,8937,8942,9e3,9003,9257,9280,9290,9312,10971,10973,11123,11126,11502,11506,11507,11513,11557,11559,11559,11565,11565,11568,11623,11631,11632,11648,11670,11680,11686,11688,11694,11696,11702,11704,11710,11712,11718,11720,11726,11728,11734,11736,11742,11776,11869,11904,11929,11931,12019,12032,12245,12272,12329,12336,12351,12353,12363,12365,12365,12367,12367,12369,12369,12371,12371,12373,12373,12375,12375,12377,12377,12379,12379,12381,12381,12383,12383,12385,12385,12387,12388,12390,12390,12392,12392,12394,12399,12402,12402,12405,12405,12408,12408,12411,12411,12414,12435,12437,12438,12443,12445,12447,12459,12461,12461,12463,12463,12465,12465,12467,12467,12469,12469,12471,12471,12473,12473,12475,12475,12477,12477,12479,12479,12481,12481,12483,12484,12486,12486,12488,12488,12490,12495,12498,12498,12501,12501,12504,12504,12507,12507,12510,12531,12533,12534,12539,12541,12543,12543,12549,12591,12593,12686,12688,12773,12783,12830,12832,42124,42128,42182,42192,42539,42560,42606,42608,42611,42622,42653,42656,42735,42738,42743,42752,42972,42993,43013,43015,43051,43056,43065,43072,43127,43136,43203,43205,43205,43214,43225,43250,43306,43310,43346,43359,43388,43392,43442,43444,43455,43457,43469,43471,43481,43486,43518,43520,43574,43584,43597,43600,43609,43612,43695,43697,43697,43701,43702,43705,43709,43712,43712,43714,43714,43739,43765,43777,43782,43785,43790,43793,43798,43808,43814,43816,43822,43824,43883,43888,44012,44016,44025,55216,55238,55243,55291,57344,63743,64014,64015,64017,64017,64019,64020,64031,64031,64033,64033,64035,64036,64039,64041,64256,64262,64275,64279,64288,64297,64335,64975,65008,65049,65072,65106,65108,65126,65128,65131,65136,65140,65142,65276,65279,65279,65281,65470,65474,65479,65482,65487,65490,65495,65498,65500,65504,65510,65512,65518,65529,65533,65536,65547,65549,65574,65576,65594,65596,65597,65599,65613,65616,65629,65664,65786,65792,65794,65799,65843,65847,65934,65936,65948,65952,65952,66e3,66044,66176,66204,66208,66256,66273,66299,66304,66339,66349,66378,66384,66421,66432,66461,66463,66499,66504,66517,66560,66717,66720,66729,66736,66771,66776,66811,66816,66855,66864,66915,66927,66938,66940,66954,66956,66962,66964,66965,66967,66977,66979,66993,66995,67001,67003,67004,67008,67016,67018,67043,67045,67059,67072,67382,67392,67413,67424,67431,67456,67461,67463,67504,67506,67514,67584,67589,67592,67592,67594,67637,67639,67640,67644,67644,67647,67669,67671,67742,67751,67759,67808,67826,67828,67829,67835,67867,67871,67897,67903,67929,67968,68023,68028,68047,68050,68099,68101,68102,68108,68108,68110,68110,68112,68115,68117,68119,68121,68149,68160,68168,68176,68184,68192,68255,68288,68324,68331,68342,68352,68405,68409,68437,68440,68466,68472,68497,68505,68508,68521,68527,68608,68680,68736,68786,68800,68850,68858,68899,68912,68921,68928,68965,68974,68997,69006,69007,69216,69246,69248,69289,69293,69293,69296,69297,69314,69319,69328,69336,69372,69372,69376,69415,69424,69445,69457,69465,69488,69505,69510,69513,69552,69579,69600,69622,69632,69701,69703,69709,69714,69743,69745,69749,69760,69785,69787,69787,69789,69802,69804,69816,69819,69826,69837,69837,69840,69864,69872,69881,69891,69926,69928,69933,69936,69938,69942,69959,69968,70002,70004,70006,70016,70079,70081,70089,70091,70111,70113,70132,70144,70161,70163,70196,70199,70209,70272,70278,70280,70280,70282,70285,70287,70301,70303,70313,70320,70376,70384,70393,70400,70403,70405,70412,70415,70416,70419,70440,70442,70448,70450,70451,70453,70457,70461,70461,70463,70468,70471,70472,70480,70480,70493,70499,70528,70530,70532,70532,70534,70537,70539,70539,70544,70544,70546,70581,70583,70583,70585,70586,70588,70592,70602,70602,70604,70605,70609,70613,70615,70616,70625,70626,70656,70721,70723,70725,70727,70747,70749,70749,70751,70753,70784,70831,70833,70841,70847,70849,70852,70855,70864,70873,71040,71086,71088,71093,71096,71097,71100,71102,71105,71133,71168,71230,71232,71236,71248,71257,71264,71276,71296,71349,71352,71353,71360,71369,71376,71395,71424,71450,71453,71466,71472,71494,71680,71736,71739,71739,71840,71922,71935,71942,71945,71945,71948,71955,71957,71958,71960,71983,71985,71989,71991,71991,71995,71996,71999,72002,72004,72006,72016,72025,72096,72103,72106,72151,72154,72159,72161,72164,72192,72243,72245,72262,72272,72344,72346,72354,72368,72440,72448,72457,72544,72551,72640,72673,72688,72697,72704,72712,72714,72758,72760,72766,72768,72773,72784,72812,72816,72847,72850,72871,72873,72886,72960,72966,72968,72969,72971,73014,73018,73018,73020,73021,73023,73025,73027,73027,73030,73031,73040,73049,73056,73061,73063,73064,73066,73102,73104,73105,73107,73110,73112,73112,73120,73129,73136,73179,73184,73193,73440,73464,73472,73488,73490,73530,73534,73536,73539,73562,73648,73648,73664,73713,73727,74649,74752,74862,74864,74868,74880,75075,77712,77810,77824,78933,78944,82938,82944,83526,90368,90397,90410,90414,90416,90425,92160,92728,92736,92766,92768,92777,92782,92862,92864,92873,92880,92909,92917,92917,92928,92975,92983,92997,93008,93017,93019,93025,93027,93047,93053,93071,93504,93542,93547,93561,93760,93850,93856,93880,93883,93907,93952,94026,94031,94087,94095,94111,94176,94180,94194,94198,94208,101589,101631,101662,101760,101874,110576,110579,110581,110587,110589,110590,110592,110882,110898,110898,110928,110930,110933,110933,110948,110951,110960,111355,113664,113770,113776,113788,113792,113800,113808,113817,113820,113821,113823,113827,117760,118012,118016,118451,118458,118480,118496,118512,118528,118573,118576,118598,118608,118723,118784,119029,119040,119078,119081,119133,119146,119148,119155,119162,119171,119172,119180,119209,119214,119226,119233,119274,119296,119361,119365,119365,119488,119507,119520,119539,119552,119638,119648,119672,119808,119892,119894,119964,119966,119967,119970,119970,119973,119974,119977,119980,119982,119993,119995,119995,119997,120003,120005,120069,120071,120074,120077,120084,120086,120092,120094,120121,120123,120126,120128,120132,120134,120134,120138,120144,120146,120485,120488,120779,120782,121483,121499,121503,121505,121519,122624,122654,122661,122666,122928,122989,123136,123180,123191,123197,123200,123209,123214,123215,123536,123565,123584,123627,123632,123641,123647,123647,124112,124139,124144,124153,124368,124397,124400,124410,124415,124415,124608,124638,124640,124642,124644,124645,124647,124653,124656,124660,124670,124671,124896,124902,124904,124907,124909,124910,124912,124926,124928,125124,125127,125135,125184,125251,125259,125259,125264,125273,125278,125279,126065,126132,126209,126269,126464,126467,126469,126495,126497,126498,126500,126500,126503,126503,126505,126514,126516,126519,126521,126521,126523,126523,126530,126530,126535,126535,126537,126537,126539,126539,126541,126543,126545,126546,126548,126548,126551,126551,126553,126553,126555,126555,126557,126557,126559,126559,126561,126562,126564,126564,126567,126570,126572,126578,126580,126583,126585,126588,126590,126590,126592,126601,126603,126619,126625,126627,126629,126633,126635,126651,126704,126705,126976,127019,127024,127123,127136,127150,127153,127167,127169,127183,127185,127221,127232,127405,127462,127490,127504,127547,127552,127560,127568,127569,127584,127589,127744,128728,128732,128748,128752,128764,128768,128985,128992,129003,129008,129008,129024,129035,129040,129095,129104,129113,129120,129159,129168,129197,129200,129211,129216,129217,129232,129240,129280,129623,129632,129645,129648,129660,129664,129674,129678,129734,129736,129736,129741,129756,129759,129770,129775,129784,129792,129938,129940,130042,131072,173791,173824,178205,178208,183981,183984,191456,191472,192093,196608,201546,201552,210041,917505,917505,917536,917631,917760,917999,983040,1048573,1048576,1114109]}var At,jt=t((()=>{}));function Mt(e){if(!Number.isInteger(e))return!1;let t=kt(),n=0,r=t.length/2-1;for(;n<=r;){let i=n+r>>>1;if(e<t[i*2])r=i-1;else if(e>t[i*2+1])n=i+1;else return!0}return!1}var Nt=t((()=>{jt()}));function Pt(e,t){let n=e.fieldType===`slidenum`&&t!==void 0?String(t):e.text;return e.caps===`all`||e.caps===`small`?n.toUpperCase():n}var Ft=t((()=>{})),It=n({collectSlideFontDemand:()=>Lt});function Lt(e,t,n){let r=new Set,i=2;if(i>n)return`all`;let a=e=>{if(ve(e))return!1;for(let a of e){let e=a.codePointAt(0);if(!Mt(e)||e>=61472&&e<=61695)return!1;if(!t.has(e)&&!r.has(e)){if(i+=String(e).length+1,i>n)return!1;r.add(e)}}return!0},o=t=>{if(!t)return!0;if(t.vert&&t.vert!==`horz`||`textWarp`in t)return!1;for(let n of t.paragraphs){if(n.rtl||n.bullet?.type!==`none`&&n.bullet?.type!==`inherit`)return!1;for(let t of n.runs)if(t.type!==`break`&&(t.type!==`text`||t.fontFamilySym||t.fieldType&&t.fieldType!==`slidenum`||!a(t.text)||!a(Pt(t,e.slideNumber))))return!1}return!0};if(e.parseError||!a(`Mii `))return`all`;for(let t of e.elements)if(t.type===`shape`){if(!o(t.textBody))return`all`}else if(t.type===`table`){for(let e of t.rows)for(let t of e.cells)if(!o(t.textBody))return`all`}else return`all`;return[...r]}var Rt=t((()=>{j(),Ot(),Nt(),Ft()}));async function zt(e){return e?(await Promise.resolve().then(()=>(Rt(),It))).collectSlideFontDemand:void 0}function M(e,t){if(!Number.isSafeInteger(e)||e<0)throw Error(`${t} must be a non-negative safe integer`)}function N(e,t,n){return M(e,`resource measurement`),M(t,`resource measurement`),M(n,`resource measurement limit`),e>n||t>n||t>n-e?n===2**53-1?n:n+1:e+t}function Bt(e,t=2**53-1){M(t,`resource measurement limit`);let n=0;for(let r=0;r<e.length;r+=1){let i=e.charCodeAt(r),a;if(i<=127)a=1;else if(i<=2047)a=2;else if(i>=55296&&i<=56319&&r+1<e.length){let t=e.charCodeAt(r+1);t>=56320&&t<=57343?(a=4,r+=1):a=3}else a=3;if(n=N(n,a,t),n>t)return n}return n}function Vt(e,t=2**53-1){M(t,`resource measurement limit`);let n=N(0,2,t);if(n>t)return n;for(let r=0;r<e.length;r+=1){let i=e.charCodeAt(r),a;if(i===34||i===92||i===8||i===9||i===10||i===12||i===13)a=2;else if(i<=31)a=6;else if(i<=127)a=1;else if(i<=2047)a=2;else if(i>=55296&&i<=56319&&r+1<e.length){let t=e.charCodeAt(r+1);t>=56320&&t<=57343?(a=4,r+=1):a=6}else a=i>=55296&&i<=57343?6:3;if(n=N(n,a,t),n>t)return n}return n}function P(e,t){return N(0,e,t)}function F(e,t=2**53-1,n=!1){if(M(t,`resource measurement limit`),e===null)return{jsonBytes:P(4,t),stringValueUtf8Bytes:0};if(typeof e==`string`)return{jsonBytes:Vt(e,t),stringValueUtf8Bytes:Bt(e,t)};if(typeof e==`boolean`)return{jsonBytes:P(e?4:5,t),stringValueUtf8Bytes:0};if(typeof e==`number`)return{jsonBytes:P((Number.isFinite(e)?String(Object.is(e,-0)?0:e):`null`).length,t),stringValueUtf8Bytes:0};if(typeof e==`bigint`)throw TypeError(`BigInt values cannot be serialized to JSON`);if(Array.isArray(e)){let n=P(2,t),r=0;for(let i=0;i<e.length;i+=1){i!==0&&(n=N(n,1,t));let a=F(e[i],t,!0);n=N(n,a.jsonBytes,t),r=N(r,a.stringValueUtf8Bytes,t)}return{jsonBytes:n,stringValueUtf8Bytes:r}}if(typeof e==`object`){let n=P(2,t),r=0,i=0;for(let[a,o]of Object.entries(e)){if(o===void 0||typeof o==`function`||typeof o==`symbol`)continue;i++!==0&&(n=N(n,1,t)),n=N(n,Vt(a,t),t),n=N(n,1,t);let e=F(o,t);n=N(n,e.jsonBytes,t),r=N(r,e.stringValueUtf8Bytes,t)}return{jsonBytes:n,stringValueUtf8Bytes:r}}return{jsonBytes:n?P(4,t):0,stringValueUtf8Bytes:0}}j(),ce(),{..._,...oe};function*Ht(e){let t=[e[Symbol.iterator]()];for(;t.length;){let e=t[t.length-1].next();if(e.done){t.pop();continue}let n=e.value;yield n,(n.type===`shape`||n.type===`table`)&&n.mathFallback&&t.push(n.mathFallback.elements[Symbol.iterator]())}}function*Ut(e){for(let t of e?.paragraphs??[]){for(let e of t.mathFallbacks??[])yield e.text;for(let e of t.runs)e.type===`text`&&(yield e.text),e.type===`math`&&e.fallbackText&&(yield e.fallbackText)}}function*Wt(e){for(let t of e?.paragraphs??[]){t.defFontFamily&&(yield t.defFontFamily);for(let e of t.runs)e.type===`text`&&(e.fontFamily&&(yield e.fontFamily),e.fontFamilyEa&&(yield e.fontFamilyEa),e.fontFamilyCs&&(yield e.fontFamilyCs),e.fontFamilySym&&(yield e.fontFamilySym))}}function*Gt(e){for(let t of Ht(e.elements))if(t.type===`shape`)yield*Ut(t.textBody);else if(t.type===`table`)for(let e of t.rows)for(let t of e.cells)yield*Ut(t.textBody);else if(t.type===`chart`){t.chart.title&&(yield t.chart.title);for(let e of t.chart.categories)yield e;for(let e of t.chart.series)e.name&&(yield e.name)}}var Kt=class e{majorFont;minorFont;fallback;scriptNames;scripts;families;constructor(e,t,n,r,i,a=new Set){this.majorFont=e,this.minorFont=t,this.fallback=i,this.scriptNames=a;let o=y(e)??y(t)??i??null;this.scripts=n??new se(o),this.families=r??new Set,e&&this.families.add(e),t&&this.families.add(t)}addSlide(e){e.theme?.majorFont&&this.families.add(e.theme.majorFont),e.theme?.minorFont&&this.families.add(e.theme.minorFont),this.scripts.addText(Gt(e));for(let t of ne(Gt(e),y(e.theme?e.theme.majorFont:this.majorFont)??y(e.theme?e.theme.minorFont:this.minorFont)??this.fallback??null))this.scriptNames.add(t);for(let t of Ht(e.elements))if(t.type===`shape`)for(let e of Wt(t.textBody))this.families.add(e);else if(t.type===`table`)for(let e of t.rows)for(let t of e.cells)for(let e of Wt(t.textBody))this.families.add(e)}names(){return[...new Set([...this.families,...this.scripts.names(),...this.scriptNames])]}withSlide(t){let n=new e(this.majorFont,this.minorFont,this.scripts.clone(),new Set(this.families),this.fallback,new Set(this.scriptNames));return n.addSlide(t),n}};j(),A();const qt=Object.freeze({archiveEntryCount:0,declaredInflatedBytes:0,distinctInflatedBytes:0,operationInflatedBytes:0}),Jt=f;function I(e,t){if(e!==null&&typeof e!=`string`)throw Error(`invalid PPTX presentation bootstrap ${t}`)}function Yt(e,t){if(!e||typeof e!=`object`||Array.isArray(e))throw Error(`invalid PPTX presentation bootstrap slide at ${t}`);let n=e;if(n.index!==t)throw Error(`invalid PPTX presentation bootstrap slide index ${n.index}`);if(n.partName!==void 0&&typeof n.partName!=`string`)throw Error(`invalid PPTX presentation bootstrap slide partName at ${t}`);return Object.freeze({index:n.index,...n.partName===void 0?{}:{partName:n.partName}})}function Xt(e,t){if(!e||typeof e!=`object`||Array.isArray(e))throw Error(`invalid PPTX presentation bootstrap embedded font at ${t}`);let n=e;if(typeof n.fontName!=`string`||n.fontName.length===0||![`regular`,`bold`,`italic`,`boldItalic`].includes(n.style??``)||typeof n.partPath!=`string`||n.partPath.length===0||n.partPath.startsWith(`/`)||n.partPath.split(`/`).includes(`..`)||![`application/x-font-ttf`,`application/x-fontdata`].includes(n.contentType??``))throw Error(`invalid PPTX presentation bootstrap embedded font fields at ${t}`);return Object.freeze({fontName:n.fontName,style:n.style,partPath:n.partPath,contentType:n.contentType})}function Zt(e){if(!e||typeof e!=`object`||Array.isArray(e))throw Error(`invalid PPTX presentation bootstrap payload`);let t=e;if(!Number.isSafeInteger(t.slideCount)||(t.slideCount??-1)<0||!Number.isSafeInteger(t.slideWidth)||(t.slideWidth??0)<=0||!Number.isSafeInteger(t.slideHeight)||(t.slideHeight??0)<=0||!Array.isArray(t.embeddedFonts)||!Array.isArray(t.slides)||t.slides.length!==t.slideCount)throw Error(`invalid PPTX presentation bootstrap dimensions or slide count`);return I(t.defaultTextColor,`defaultTextColor`),I(t.majorFont,`majorFont`),I(t.minorFont,`minorFont`),I(t.hlinkColor,`hlinkColor`),I(t.folHlinkColor,`folHlinkColor`),Object.freeze({slideCount:t.slideCount,slideWidth:t.slideWidth,slideHeight:t.slideHeight,defaultTextColor:t.defaultTextColor,majorFont:t.majorFont,minorFont:t.minorFont,hlinkColor:t.hlinkColor,folHlinkColor:t.folHlinkColor,embeddedFonts:Object.freeze(t.embeddedFonts.map(Xt)),slides:Object.freeze(t.slides.map(Yt))})}function Qt(e){return Object.freeze({type:`media`,x:e.x,y:e.y,width:e.width,height:e.height,rotation:e.rotation,flipH:e.flipH,flipV:e.flipV,mediaKind:e.mediaKind,posterPath:e.posterPath,posterMimeType:e.posterMimeType,mediaPath:e.mediaPath,mimeType:e.mimeType})}function $t(e){return Object.freeze({...e.id===void 0?{}:{id:e.id},...e.authorId===void 0?{}:{authorId:e.authorId},...e.author===void 0?{}:{author:e.author},...e.date===void 0?{}:{date:e.date},...e.status===void 0?{}:{status:e.status},text:e.text})}function en(e){return Object.freeze({...e})}function tn(e){return Object.freeze({...e.authorId===void 0?{}:{authorId:e.authorId},...e.modernAuthorId===void 0?{}:{modernAuthorId:e.modernAuthorId},...e.id===void 0?{}:{id:e.id},...e.index===void 0?{}:{index:e.index},...e.author===void 0?{}:{author:e.author},...e.date===void 0?{}:{date:e.date},...e.x===void 0?{}:{x:e.x},...e.y===void 0?{}:{y:e.y},...e.anchors?.length?{anchors:Object.freeze(e.anchors.map(en))}:{},...e.status===void 0?{}:{status:e.status},text:e.text,...e.replies?.length?{replies:Object.freeze(e.replies.map($t))}:{}})}function nn(e,t){if(e.index!==t.index||e.partName!==t.partName)throw Error(`PPTX pulled slide identity does not match bootstrap index ${t.index}`);return Object.freeze({index:t.index,...t.partName===void 0?{}:{partName:t.partName},notes:e.notes??null,hidden:e.hidden??!1,mediaElements:Object.freeze(e.elements.filter(e=>e.type===`media`).map(Qt)),...e.comments?.length?{comments:Object.freeze(e.comments.map(tn))}:{}})}function rn(e,t,n){if(!(e<=t))throw new i(`PPTX presentation preflight exceeded its hard limit of ${t} projected bytes`,{stage:`parsing`,violation:{format:`pptx`,operation:`presentation-preflight`,resource:`presentation-preflight`,metric:`projected-bytes`,limit:t,observed:Math.min(e,t+1),configurable:!1,usage:n}})}var an=class{slideCountValue;slideWidthValue;slideHeightValue;defaultTextColorValue;majorFontValue;minorFontValue;hlinkColorValue;folHlinkColorValue;embeddedFontsValue;descriptors;slides=[];fonts;fontPreloadNames;fontProjectionBytes;projectionBytesValue;limit;pending=null;finished=null;demandPoints;demandAll=!1;demandBytes=0;demandMembershipBytes=0;demandDeltaBytes=0;collectFontDemand;demandDelta;constructor(e,t={}){let n=Zt(e),r=t.maxProjectionBytes??Jt;if(!Number.isSafeInteger(r)||r<=0||r>Jt)throw Error(`invalid PPTX presentation preflight limit`);this.limit=r,this.collectFontDemand=t.collectFontDemand,this.demandPoints=this.collectFontDemand?new Set:void 0,this.demandBytes=this.collectFontDemand?F({fontPreloadDemand:[]},this.limit).jsonBytes-1:0,this.demandMembershipBytes=this.demandBytes,this.slideCountValue=n.slideCount,this.slideWidthValue=n.slideWidth,this.slideHeightValue=n.slideHeight,this.defaultTextColorValue=n.defaultTextColor,this.majorFontValue=n.majorFont,this.minorFontValue=n.minorFont,this.hlinkColorValue=n.hlinkColor,this.folHlinkColorValue=n.folHlinkColor,this.embeddedFontsValue=n.embeddedFonts,this.descriptors=[...n.slides],this.fonts=new Kt(this.majorFontValue,this.minorFontValue,void 0,void 0,t.cjkFallback),this.fontPreloadNames=Object.freeze(this.fonts.names()),this.fontProjectionBytes=F(this.fontPreloadNames,this.limit).jsonBytes,this.projectionBytesValue=F({slideCount:this.slideCountValue,slideWidth:this.slideWidthValue,slideHeight:this.slideHeightValue,defaultTextColor:this.defaultTextColorValue,majorFont:this.majorFontValue,minorFont:this.minorFontValue,hlinkColor:this.hlinkColorValue,folHlinkColor:this.folHlinkColorValue,embeddedFonts:this.embeddedFontsValue,remainingSlides:this.descriptors,slides:[],fontPreloadNames:this.fontPreloadNames},this.limit).jsonBytes,this.projectionBytesValue+this.demandBytes>this.limit&&(this.demandAll=!0,this.demandBytes=0,this.demandMembershipBytes=0),this.projectionBytesValue=N(this.projectionBytesValue,this.demandBytes,this.limit),rn(this.projectionBytesValue,this.limit,qt)}get acceptedSlideCount(){return this.finished?.slideCount??this.slides.length}get projectedBytes(){return this.projectionBytesValue}get remainingDescriptorCount(){return this.descriptors.reduce((e,t)=>e+Number(t!==void 0),0)}get latestSlide(){return this.slides[this.slides.length-1]}get currentFontPreloadNames(){return this.fontPreloadNames}get currentFontPreloadDemandDelta(){return this.demandDelta}snapshot(){if(this.finished)return this.finished;if(this.pending)throw Error(`PPTX presentation preflight has an uncommitted slide`);return Object.freeze({slideCount:this.slideCountValue,slideWidth:this.slideWidthValue,slideHeight:this.slideHeightValue,defaultTextColor:this.defaultTextColorValue,majorFont:this.majorFontValue,minorFont:this.minorFontValue,hlinkColor:this.hlinkColorValue,folHlinkColor:this.folHlinkColorValue,embeddedFonts:this.embeddedFontsValue,slides:Object.freeze([...this.slides]),fontPreloadNames:this.fontPreloadNames})}addSlide(e,t=qt){this.prepareSlide(e,t).commit()}prepareSlide(e,t=qt){if(this.finished)throw Error(`PPTX presentation preflight is already finished`);if(this.pending)throw Error(`PPTX presentation preflight already has a prepared slide`);let n=this.slides.length,r=this.descriptors[n];if(!r)throw Error(`PPTX presentation preflight received an extra slide`);let i=nn(e,r),a=this.fonts.withSlide(e),o=Object.freeze(a.names()),s=F(o,this.limit).jsonBytes,c=F(i,this.limit).jsonBytes,l=this.projectionBytesValue-this.demandBytes-this.fontProjectionBytes-F(r,this.limit).jsonBytes+4;l=N(l,s,this.limit),l=N(l,c,this.limit),this.slides.length!==0&&(l=N(l,1,this.limit));let u=F({slide:i,fontPreloadNames:o},this.limit).jsonBytes,d=N(this.projectionBytesValue-this.demandBytes,u,this.limit),f=l;rn(Math.max(d,f),this.limit,t);let p=d+this.demandBytes;l+=this.demandBytes,Math.max(p,l)>this.limit&&this.demandBytes&&(this.projectionBytesValue-=this.demandBytes,this.demandBytes=0,this.demandMembershipBytes=0,this.demandDeltaBytes=0,this.demandPoints?.clear(),this.demandAll=!0,this.demandDelta=`all`,p=d,l=f);let m,h=this.demandBytes,g=this.demandMembershipBytes,_=this.demandDeltaBytes;if(this.collectFontDemand){let t=F([],this.limit).jsonBytes,n=this.limit-p,r=this.limit-f-this.demandMembershipBytes,i=Math.min(n,Math.floor((r+t-Number((this.demandPoints?.size??0)>0))/2));if(m=this.demandAll?`all`:this.collectFontDemand(e,this.demandPoints,Math.max(0,i)),m===`all`)h=0,g=0,_=0;else{_=F(m,this.limit).jsonBytes;let e=m.length===0?0:_-t+Number((this.demandPoints?.size??0)>0);g+=e,h=g+_,p+=_}l=f+h}rn(Math.max(p,l),this.limit,t);let v={state:`prepared`,fact:i,fonts:a,fontNames:o,fontBytes:s,committedBytes:l,demandDelta:m,demandBytes:h,demandMembershipBytes:g,demandDeltaBytes:_};return this.pending=v,{projectedBytes:p,commit:()=>{if(v.state!==`committed`){if(v.state===`rolled-back`)throw Error(`PPTX presentation preflight cannot commit a rolled-back slide`);if(this.pending!==v)throw Error(`PPTX presentation preflight prepared slide is stale`);if(this.descriptors[n]=void 0,this.slides.push(v.fact),this.fonts=v.fonts,this.fontPreloadNames=v.fontNames,this.fontProjectionBytes=v.fontBytes,this.projectionBytesValue=v.committedBytes,this.demandDelta=v.demandDelta,v.demandDelta===`all`)this.demandAll=!0,this.demandPoints?.clear();else for(let e of v.demandDelta??[])this.demandPoints?.add(e);this.demandBytes=v.demandBytes,this.demandMembershipBytes=v.demandMembershipBytes,this.demandDeltaBytes=v.demandDeltaBytes,v.state=`committed`,this.pending=null}},rollback:()=>{if(v.state!==`rolled-back`){if(v.state===`committed`)throw Error(`PPTX presentation preflight cannot roll back a committed slide`);if(this.pending!==v)throw Error(`PPTX presentation preflight prepared slide is stale`);v.state=`rolled-back`,this.pending=null}}}}finish(){if(this.finished)return this.finished;if(this.pending)throw Error(`PPTX presentation preflight has an uncommitted slide`);if(this.slides.length!==this.slideCountValue)throw Error(`PPTX presentation preflight is incomplete: ${this.slides.length}/${this.slideCountValue} slides`);return this.finished=Object.freeze({slideCount:this.slideCountValue,slideWidth:this.slideWidthValue,slideHeight:this.slideHeightValue,defaultTextColor:this.defaultTextColorValue,majorFont:this.majorFontValue,minorFont:this.minorFontValue,hlinkColor:this.hlinkColorValue,folHlinkColor:this.folHlinkColorValue,embeddedFonts:this.embeddedFontsValue,slides:Object.freeze([...this.slides]),fontPreloadNames:this.fontPreloadNames,...this.collectFontDemand&&!this.demandAll&&this.demandBytes?{fontPreloadDemand:Object.freeze([...this.demandPoints??[]])}:{}}),this.demandPoints?.clear(),this.demandDelta=void 0,this.descriptors=[],this.slides=[],this.projectionBytesValue=F(this.finished,this.limit).jsonBytes,this.finished}};A();function on(e){try{return Pe(e(e=>e.slide_cursor_resource_usage()))}catch(e){if(String(e).includes(`slide cursor usage is unavailable`))return;throw e}}function sn(e,t,n,r,i){let a,o;try{if(i){if(!r)throw Error(`slide payload is missing before acknowledgement`);let t=i(n,r,on(e));typeof t==`function`?a=t:t&&({rollback:a,commit:o}=t)}e(e=>e.acknowledge_slide(t.operationId,t.generation)),o?.()}catch(e){try{a?.()}catch{}throw e}}j(),A();var cn=class{archive;acceptSlide;executeArchive;coordinatorGeneration=new wt;sessions=new Map;pendingOpens=new Map;operationTail=Promise.resolve();resourceFailure;lifecycleState=`ready`;resetBarrier;resetIdentities=new Map;constructor(e,t,n=e=>e(this.requireArchive())){this.archive=e,this.acceptSlide=t,this.executeArchive=n}get coordinator(){return this.coordinatorGeneration}reserveOpen(e){if(this.assertReady(),un(e),this.pendingOpens.has(e.sessionId)||this.sessions.has(e.sessionId))throw Error(`slide pull session id is already reserved`);this.pendingOpens.set(e.sessionId,{identity:e,canceled:!1})}abandonOpen(e){this.pendingOpens.delete(e)}get pendingOpenCount(){return this.pendingOpens.size}async open(e,t){if(this.assertReady(),this.resourceFailure)throw this.resourceFailure;if(!Number.isSafeInteger(e)||e<0)throw RangeError(`slide index must be a non-negative safe integer`);let n=this.pendingOpens.get(t.sessionId);if(!n||!L(n.identity,t))throw Error(`slide pull session open reservation is stale or missing`);let r,i=new Promise(e=>{r=e}),a=this.operationTail.then(()=>this.coordinator.enqueue(async()=>{if(n.canceled)throw Error(`slide pull session open was canceled`);let i,a=!1,o=new Tt({...t,maxByteCredit:d,coordinator:this.coordinator,driver:{pull:n=>{let r;try{r=this.executeArchive(r=>r.pull_slide(e,t.operationId,t.generation,n))}catch(e){throw ke(e,n,d)||(this.latchResourceFailure(e),e)}let o=yt(r);return this.acceptSlide&&(i=JSON.parse(new TextDecoder().decode(new Uint8Array(o)))),a=!0,{payload:o,byteLength:o.byteLength,done:!0,transfer:[o]}},measureChunk:({payload:e})=>e.byteLength,acknowledge:()=>{if(!a)throw Error(`slide unit is not awaiting acknowledgement`);try{sn(this.executeArchive,t,e,i,this.acceptSlide)}catch(e){throw this.latchResourceFailure(e),e}a=!1,i=void 0,this.sessions.delete(t.sessionId),r()},cancel:async()=>{try{this.archive()&&await this.executeArchive(e=>e.cancel_slide())}finally{i=void 0,a=!1,this.sessions.delete(t.sessionId),r()}},close:async()=>{try{this.archive()&&await this.executeArchive(e=>e.cancel_slide())}finally{i=void 0,a=!1,this.sessions.delete(t.sessionId),r()}},resourceUsage:()=>{try{return this.readResourceUsage()}catch(e){throw this.latchResourceFailure(e),e}}}});this.sessions.set(t.sessionId,{host:o,identity:t}),this.pendingOpens.delete(t.sessionId)}));this.operationTail=a.then(()=>i,()=>void 0);try{await a}catch(e){throw this.pendingOpens.delete(t.sessionId),r(),e}}async postOpenedSafely(e,t,n){if(this.lifecycleState!==`ready`){try{n(this.lifecycleError())}catch{}return}try{t()}catch(t){await this.closeIdentity(e);try{n(t)}catch{}}}dispatch(e,t){if(this.lifecycleState!==`ready`)return t(this.responseDuringReset(e)),Promise.resolve();let n=this.sessions.get(e.sessionId);if(n)return n.host.dispatch(e,t);let r=this.pendingOpens.get(e.sessionId);if(r&&(e.kind===`cancel`||e.kind===`close`)){let n=L(r.identity,e);return n&&(r.canceled=!0),t(n?{protocol:k,kind:`accepted`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,command:e.kind}:this.staleLifecycleResponse(e)),Promise.resolve()}return e.kind===`cancel`||e.kind===`close`?(t({protocol:k,kind:`accepted`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,command:e.kind}),Promise.resolve()):(t({protocol:k,kind:`error`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:E(Error(`slide pull session is not open`))}),Promise.resolve())}async dispatchSafely(e,t){try{await this.dispatch(e,t)}catch(n){try{t({protocol:k,kind:`error`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:E(n)})}catch{}}}run(e){if(this.lifecycleState!==`ready`)return Promise.reject(this.lifecycleError());let t=this.operationTail.then(()=>this.coordinator.enqueue(async()=>{if(this.resourceFailure)throw this.resourceFailure;return e()})).catch(e=>{throw this.latchResourceFailure(e),e});return this.operationTail=t.then(()=>void 0,()=>void 0),t}reset(){if(this.resetBarrier)return this.resetBarrier;this.lifecycleState=`resetting`,this.captureResetIdentities();let e=this.performReset().then(()=>{this.resetIdentities.clear(),this.lifecycleState=`ready`},e=>{throw this.lifecycleState=`reset-failed`,e}).finally(()=>{this.resetBarrier===e&&(this.resetBarrier=void 0)});return this.resetBarrier=e,e}async performReset(){for(let e of this.pendingOpens.values())e.canceled=!0;let e=1;for(let{host:t,identity:n}of[...this.sessions.values()]){let r;if(await t.dispatch({protocol:k,kind:`close`,...n,requestId:e++},e=>{e.kind===`error`&&(r=$e(e.error))}),r)throw r}this.sessions.clear(),await this.operationTail,this.pendingOpens.clear(),this.archive()&&await this.executeArchive(e=>e.close_presentation_session()),this.coordinatorGeneration=new wt,this.resourceFailure=void 0}assertReady(){if(this.lifecycleState!==`ready`)throw this.lifecycleError()}lifecycleError(){let e=this.lifecycleState===`reset-failed`,t=Error(e?`slide pull worker reset failed; retry reset before new work`:`slide pull worker reset is in progress`);return t.name=`PullSessionLifecycleError`,Object.assign(t,{code:e?`ooxml-pull-reset-failed`:`ooxml-pull-resetting`})}captureResetIdentities(){for(let{identity:e}of this.sessions.values())this.resetIdentities.set(e.sessionId,e);for(let{identity:e}of this.pendingOpens.values())this.resetIdentities.set(e.sessionId,e)}responseDuringReset(e){if(e.kind===`cancel`||e.kind===`close`){let t=this.resetIdentities.get(e.sessionId);return t&&!L(t,e)?this.staleLifecycleResponse(e):{protocol:k,kind:`accepted`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,command:e.kind}}return{protocol:k,kind:`error`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:E(this.lifecycleError())}}requireArchive(){let e=this.archive();if(!e)throw Error(`Presentation not loaded`);return e}async closeIdentity(e){if(this.lifecycleState!==`ready`)return;let t=this.sessions.get(e.sessionId);if(t){await t.host.dispatch({protocol:k,kind:`close`,...e,requestId:1},()=>void 0);return}let n=this.pendingOpens.get(e.sessionId);n&&L(n.identity,e)&&(n.canceled=!0)}readResourceUsage(){return on(this.executeArchive)}latchResourceFailure(e){let t=e instanceof i?e:He(e);t&&(this.resourceFailure??=t)}staleLifecycleResponse(e){return{protocol:k,kind:`error`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:{message:`stale lifecycle targets another slide operation`,errorName:`PullSessionProtocolError`,code:`ooxml-stale-lifecycle`}}}};function ln(e){return!!e&&typeof e==`object`&&e.protocol===`ooxml-pull-v1`}function un(e){if(!Number.isSafeInteger(e.sessionId)||e.sessionId<=0)throw RangeError(`session id must be a positive safe integer`);if(!Number.isSafeInteger(e.operationId)||e.operationId<=0)throw RangeError(`operation id must be a positive safe integer`);if(!Number.isSafeInteger(e.generation)||e.generation<=0)throw RangeError(`generation must be a positive safe integer`)}function L(e,t){return e.sessionId===t.sessionId&&e.operationId===t.operationId&&e.generation===t.generation}var dn=class{__destroy_into_raw(){let e=this.__wbg_ptr;return this.__wbg_ptr=0,pn.unregister(this),e}free(){let e=this.__destroy_into_raw();Y.__wbg_pptxarchive_free(e,0)}acknowledge_slide(e,t){let n=Y.pptxarchive_acknowledge_slide(this.__wbg_ptr,e,t);if(n[1])throw G(n[0])}assert_healthy(){let e=Y.pptxarchive_assert_healthy(this.__wbg_ptr);if(e[1])throw G(e[0])}cancel_slide(){Y.pptxarchive_cancel_slide(this.__wbg_ptr)}close_presentation_session(){Y.pptxarchive_close_presentation_session(this.__wbg_ptr)}extract_font(e){let t=W(e,Y.__wbindgen_malloc,Y.__wbindgen_realloc),n=J,r=Y.pptxarchive_extract_font(this.__wbg_ptr,t,n);if(r[3])throw G(r[2]);var i=R(r[0],r[1]).slice();return Y.__wbindgen_free(r[0],r[1]*1,1),i}extract_image(e){let t=W(e,Y.__wbindgen_malloc,Y.__wbindgen_realloc),n=J,r=Y.pptxarchive_extract_image(this.__wbg_ptr,t,n);if(r[3])throw G(r[2]);var i=R(r[0],r[1]).slice();return Y.__wbindgen_free(r[0],r[1]*1,1),i}extract_media(e){let t=W(e,Y.__wbindgen_malloc,Y.__wbindgen_realloc),n=J,r=Y.pptxarchive_extract_media(this.__wbg_ptr,t,n);if(r[3])throw G(r[2]);var i=R(r[0],r[1]).slice();return Y.__wbindgen_free(r[0],r[1]*1,1),i}constructor(e,t,n,r){let i=hn(e,Y.__wbindgen_malloc),a=J,o=Y.pptxarchive_new(i,a,!U(t),U(t)?BigInt(0):t,!U(n),U(n)?BigInt(0):n,!U(r),U(r)?BigInt(0):r);if(o[2])throw G(o[1]);return this.__wbg_ptr=o[0]>>>0,pn.register(this,this.__wbg_ptr,this),this}parse(){let e=Y.pptxarchive_parse(this.__wbg_ptr);if(e[3])throw G(e[2]);var t=R(e[0],e[1]).slice();return Y.__wbindgen_free(e[0],e[1]*1,1),t}presentation_bootstrap(){let e=Y.pptxarchive_presentation_bootstrap(this.__wbg_ptr);if(e[3])throw G(e[2]);var t=R(e[0],e[1]).slice();return Y.__wbindgen_free(e[0],e[1]*1,1),t}pull_slide(e,t,n,r){let i=Y.pptxarchive_pull_slide(this.__wbg_ptr,e,t,n,r);if(i[3])throw G(i[2]);var a=R(i[0],i[1]).slice();return Y.__wbindgen_free(i[0],i[1]*1,1),a}resource_usage(){let e=Y.pptxarchive_resource_usage(this.__wbg_ptr);if(e[3])throw G(e[2]);var t=R(e[0],e[1]).slice();return Y.__wbindgen_free(e[0],e[1]*1,1),t}slide_cursor_resource_usage(){let e=Y.pptxarchive_slide_cursor_resource_usage(this.__wbg_ptr);if(e[3])throw G(e[2]);var t=R(e[0],e[1]).slice();return Y.__wbindgen_free(e[0],e[1]*1,1),t}to_markdown(){let e,t;try{let i=Y.pptxarchive_to_markdown(this.__wbg_ptr);var n=i[0],r=i[1];if(i[3])throw n=0,r=0,G(i[2]);return e=n,t=r,B(n,r)}finally{Y.__wbindgen_free(e,t,1)}}};Symbol.dispose&&(dn.prototype[Symbol.dispose]=dn.prototype.free);function fn(){return{__proto__:null,\"./pptx_parser_bg.js\":{__proto__:null,__wbg___wbindgen_throw_6b64449b9b9ed33c:function(e,t){throw Error(B(e,t))},__wbg_error_a6fa202b58aa1cd3:function(e,t){let n,r;try{n=e,r=t,console.error(B(e,t))}finally{Y.__wbindgen_free(n,r,1)}},__wbg_new_227d7c05414eb861:function(){return Error()},__wbg_stack_3b0d974bbf31e44f:function(e,t){let n=t.stack,r=W(n,Y.__wbindgen_malloc,Y.__wbindgen_realloc),i=J;mn().setInt32(e+4,i,!0),mn().setInt32(e+0,r,!0)},__wbindgen_cast_0000000000000001:function(e,t){return B(e,t)},__wbindgen_init_externref_table:function(){let e=Y.__wbindgen_externrefs,t=e.grow(4);e.set(0,void 0),e.set(t+0,void 0),e.set(t+1,null),e.set(t+2,!0),e.set(t+3,!1)}}}}const pn=typeof FinalizationRegistry>`u`?{register:()=>{},unregister:()=>{}}:new FinalizationRegistry(e=>Y.__wbg_pptxarchive_free(e>>>0,1));function R(e,t){return e>>>=0,H().subarray(e/1,e/1+t)}let z=null;function mn(){return(z===null||z.buffer.detached===!0||z.buffer.detached===void 0&&z.buffer!==Y.memory.buffer)&&(z=new DataView(Y.memory.buffer)),z}function B(e,t){return e>>>=0,_n(e,t)}let V=null;function H(){return(V===null||V.byteLength===0)&&(V=new Uint8Array(Y.memory.buffer)),V}function U(e){return e==null}function hn(e,t){let n=t(e.length*1,1)>>>0;return H().set(e,n/1),J=e.length,n}function W(e,t,n){if(n===void 0){let n=q.encode(e),r=t(n.length,1)>>>0;return H().subarray(r,r+n.length).set(n),J=n.length,r}let r=e.length,i=t(r,1)>>>0,a=H(),o=0;for(;o<r;o++){let t=e.charCodeAt(o);if(t>127)break;a[i+o]=t}if(o!==r){o!==0&&(e=e.slice(o)),i=n(i,r,r=o+e.length*3,1)>>>0;let t=H().subarray(i+o,i+r),a=q.encodeInto(e,t);o+=a.written,i=n(i,r,o,1)>>>0}return J=o,i}function G(e){let t=Y.__wbindgen_externrefs.get(e);return Y.__externref_table_dealloc(e),t}let K=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0});K.decode();let gn=0;function _n(e,t){return gn+=t,gn>=2146435072&&(K=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0}),K.decode(),gn=t),K.decode(H().subarray(e,e+t))}const q=new TextEncoder;`encodeInto`in q||(q.encodeInto=function(e,t){let n=q.encode(e);return t.set(n),{read:e.length,written:n.length}});let J=0,Y;function vn(e,t){return Y=e.exports,z=null,V=null,Y.__wbindgen_start(),Y}async function yn(e,t){if(typeof Response==`function`&&e instanceof Response){if(typeof WebAssembly.instantiateStreaming==`function`)try{return await WebAssembly.instantiateStreaming(e,t)}catch(t){if(e.ok&&n(e.type)&&e.headers.get(`Content-Type`)!==`application/wasm`)console.warn(\"`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\\n\",t);else throw t}let r=await e.arrayBuffer();return await WebAssembly.instantiate(r,t)}else{let n=await WebAssembly.instantiate(e,t);return n instanceof WebAssembly.Instance?{instance:n,module:e}:n}function n(e){switch(e){case`basic`:case`cors`:case`default`:return!0}return!1}}async function bn(e){if(Y!==void 0)return Y;e!==void 0&&(Object.getPrototypeOf(e)===Object.prototype?{module_or_path:e}=e:console.warn(`using deprecated parameters for the initialization function; pass a single object instead`));let t=fn();(typeof e==`string`||typeof Request==`function`&&e instanceof Request||typeof URL==`function`&&e instanceof URL)&&(e=fetch(e));let{instance:n,module:r}=await yn(await e,t);return vn(n,r)}async function xn(e){return Y=void 0,z=null,V=null,bn(e)}j(),A();const X=new _t(bn,{freeArchive:e=>e.free(),reinit:xn});let Z=null,Sn=`empty`;function Cn(){if(Sn!==`empty`){let e=Error(`this PPTX worker already owns a presentation parse`);throw e.name=`PptxWorkerStateError`,Object.assign(e,{code:`ooxml-pptx-parse-already-started`})}Sn=`opening`}const Q=new cn(()=>X.archive,(e,t,n)=>{if(Z){if(e!==Z.acceptedSlideCount)throw Error(`PPTX preflight expected slide ${Z.acceptedSlideCount}, received ${e}`);return Z.prepareSlide(t,n)}},e=>{let t=X.archive;if(!t)throw Error(`Presentation not loaded`);return X.run(()=>e(t))}),$=(e,t)=>self.postMessage(e,t);self.onmessage=async e=>{let t=e.data;if(ln(t)){await Q.dispatchSafely(t,$);return}if(t.kind===`init`){X.setWasmInput(we(t.wasmUrl)??t.wasmUrl);return}let n=t.id,r=!1;try{if(t.kind===`openSlideSession`&&Q.reserveOpen(t),t.kind===`parse`&&(Cn(),r=!0),t.kind===`openSlideSession`){await X.ensureReady(),await Q.open(t.slideIndex,t),await Q.postOpenedSafely(t,()=>$({kind:`slideSessionOpened`,id:n,sessionId:t.sessionId,operationId:t.operationId,generation:t.generation}),e=>$({kind:`error`,id:n,...E(e)}));return}t.kind===`parse`&&await Q.reset(),await Q.run(async()=>{if(await X.ensureReady(),t.kind!==`parse`&&X.archive){let e=X.archive;X.run(()=>e.assert_healthy())}if(t.kind===`parse`){Z=null;let[e,r,i]=xt(t.resourcePolicy),a=X.run(()=>{let n=new dn(new Uint8Array(t.buffer),e,r,i);return X.setArchive(n),JSON.parse(new TextDecoder().decode(n.presentation_bootstrap()))});Z=t.progressiveLayout?null:new an(a,{cjkFallback:t.cjkFallback,collectFontDemand:t.collectFontDemand===!0?await zt(!0):void 0}),$({kind:`presentationOpened`,id:n,bootstrap:a}),Sn=`ready`;return}let e=X.archive;if(!e)throw Error(`No pptx loaded`);if(t.kind===`finishPresentationPreflight`){if(!Z)throw Error(`PPTX presentation preflight is not active`);let e=Z.finish();Z=null,$({kind:`presentationPreflightReady`,id:n,preflight:e});return}if(t.kind===`extractMedia`){let r=X.run(()=>e.extract_media(t.path).buffer);$({kind:`mediaExtracted`,id:n,bytes:r},[r]);return}if(t.kind===`extractImage`){let r=X.run(()=>e.extract_image(t.path).buffer);$({kind:`imageExtracted`,id:n,bytes:r},[r]);return}if(t.kind===`extractFont`){let r=X.run(()=>e.extract_font(t.path).buffer);$({kind:`fontExtracted`,id:n,bytes:r},[r]);return}if(t.kind===`resourceUsage`){$({kind:`resourceUsage`,id:n,usage:Pe(X.run(()=>e.resource_usage()))});return}t.kind===`toMarkdown`&&$({kind:`markdownRendered`,id:n,markdown:X.run(()=>e.to_markdown())})})}catch(e){r&&(Sn=`failed`),t.kind===`openSlideSession`&&Q.abandonOpen(t.sessionId);try{$({kind:`error`,id:n,...E(e)})}catch{}}};", Yt = typeof self < "u" && self.Blob && new Blob(["URL.revokeObjectURL(import.meta.url);", Jt], { type: "text/javascript;charset=utf-8" });
function Xt(e) {
	let t;
	try {
		if (t = Yt && (self.URL || self.webkitURL).createObjectURL(Yt), !t) throw "";
		let n = new Worker(t, {
			type: "module",
			name: e?.name
		});
		return n.addEventListener("error", () => {
			(self.URL || self.webkitURL).revokeObjectURL(t);
		}), n;
	} catch {
		return new Worker("data:text/javascript;charset=utf-8," + encodeURIComponent(Jt), {
			type: "module",
			name: e?.name
		});
	}
}
var Zt = new URL("pptx_parser_bg.wasm", import.meta.url).href, q = 65536, Qt = 16384, $t = new Set(["line", "straightconnector1"]);
function en(e, t) {
	let n = e.x + e.width / 2, r = e.y + e.height / 2, i = -e.rotation * Math.PI / 180, a = Math.cos(i), o = Math.sin(i), s = t.x - n, c = t.y - r, l = n + a * s - o * c, u = r + o * s + a * c;
	return e.flipH && (l = 2 * n - l), e.flipV && (u = 2 * r - u), {
		x: l,
		y: u
	};
}
function tn(e, t, n) {
	let r = n.x - t.x, i = n.y - t.y, a = r * r + i * i;
	if (a === 0) return Math.hypot(e.x - t.x, e.y - t.y);
	let o = Math.max(0, Math.min(1, ((e.x - t.x) * r + (e.y - t.y) * i) / a));
	return Math.hypot(e.x - (t.x + o * r), e.y - (t.y + o * i));
}
function nn(e, t, n = 0) {
	if (!Number.isFinite(t.x) || !Number.isFinite(t.y)) return !1;
	let r = en(e, t), i = Number.isFinite(n) && n > 0 ? n : 0;
	if (e.type === "shape" && ($t.has(e.geometry.toLowerCase()) || e.width === 0 || e.height === 0)) return tn(r, {
		x: e.x,
		y: e.y
	}, {
		x: e.x + e.width,
		y: e.y + e.height
	}) <= i;
	let a = Math.min(e.x, e.x + e.width), o = Math.max(e.x, e.x + e.width), s = Math.min(e.y, e.y + e.height), c = Math.max(e.y, e.y + e.height);
	return r.x >= a && r.x <= o && r.y >= s && r.y <= c;
}
function* rn(e) {
	if (e) for (let t of e.paragraphs) {
		let e = !0;
		for (let n of t.runs) {
			let t = n.type === "text" ? n.text : n.type === "break" ? "\n" : "[equation]";
			t && (yield {
				text: t,
				beginsPart: e
			}, e = !1);
		}
	}
}
function* an(e) {
	if (e.type === "shape") {
		yield* rn(e.textBody);
		return;
	}
	if (e.type === "table") {
		for (let t of e.rows) for (let e of t.cells) yield* rn(e.textBody);
		return;
	}
}
function on(e, t = Qt) {
	if (!Number.isFinite(t) || t < 0) throw RangeError("maxTextCharacters must be a finite non-negative number.");
	let n = Math.min(q, Math.floor(t)), r = e.text, i = r === void 0 ? void 0 : Xe(r, n), a = r !== void 0 && i.length < r.length;
	return {
		...structuredClone(e),
		...i === void 0 ? {} : { text: i },
		truncated: e.truncated || a,
		truncationReasons: e.truncated || a ? ["text"] : [],
		textCharacters: i?.length ?? 0,
		maxTextCharacters: n
	};
}
function sn(e, t) {
	let n = [], r = 0, i = !1, a = !1;
	for (let o of e) {
		if (a = !0, o.beginsPart && n.length > 0) {
			if (r >= t) {
				i = !0;
				break;
			}
			n.push("\n"), r++;
		}
		let e = Math.max(0, t - r), s = Xe(o.text, e);
		if (n.push(s), r += s.length, s.length < o.text.length) {
			i = !0;
			break;
		}
	}
	return a ? {
		text: n.join(""),
		truncated: i,
		textCharacters: r
	} : {
		truncated: !1,
		textCharacters: 0
	};
}
function cn(e, t, n, r = {}) {
	if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) throw RangeError("PPTX hit-test point must contain finite coordinates.");
	let i = r.maxTextCharacters ?? Qt;
	if (!Number.isFinite(i) || i < 0) throw RangeError("maxTextCharacters must be a finite non-negative number.");
	let a = Math.min(q, Math.floor(i)), o = r.tolerance ?? 0;
	if (!Number.isFinite(o) || o < 0) throw RangeError("tolerance must be a finite non-negative number.");
	for (let r = t.elements.length - 1; r >= 0; r--) {
		let i = t.elements[r];
		if (!nn(i, n, o)) continue;
		let s = i.type === "chart" ? Ke(i.chart, a) : sn(an(i), a);
		return {
			format: "pptx",
			kind: "element",
			slideIndex: e,
			elementIndex: r,
			origin: t.elementSources?.[r]?.origin ?? "unknown",
			elementType: i.type,
			point: { ...n },
			bounds: {
				x: i.x,
				y: i.y,
				width: i.width,
				height: i.height,
				rotation: i.rotation,
				flipH: i.flipH,
				flipV: i.flipV
			},
			...i.type === "shape" ? {
				...i.id === void 0 ? {} : { shapeId: i.id },
				...i.name === void 0 ? {} : { name: i.name },
				geometry: i.geometry
			} : {},
			...s.text === void 0 ? {} : { text: s.text },
			...i.type === "picture" ? { mimeType: i.mimeType } : {},
			...i.type === "media" ? {
				mimeType: i.mimeType,
				mediaKind: i.mediaKind
			} : {},
			...i.type === "table" ? {
				rowCount: i.rows.length,
				columnCount: i.cols.length
			} : {},
			...i.type === "chart" ? { seriesCount: i.chart.series.length } : {},
			truncated: s.truncated,
			truncationReasons: s.truncated ? ["text"] : [],
			textCharacters: s.textCharacters,
			maxTextCharacters: a
		};
	}
	return null;
}
function ln(e, t) {
	let n = new Set(t.filter((e) => e.length > 0));
	if (n.size === 0) return Object.freeze([]);
	let r = /* @__PURE__ */ new Map();
	for (let [t, i] of e.elements.entries()) {
		let a = i.id;
		if (!a || !n.has(a)) continue;
		let o = e.elementSources?.[t]?.origin ?? "unknown", s = o === "slide" ? 3 : o === "layout" ? 2 : +(o === "master"), c = r.get(a), l = c?.origin === "slide" ? 3 : c?.origin === "layout" ? 2 : +(c?.origin === "master");
		c && l > s || r.set(a, Object.freeze({
			elementId: a,
			elementIndex: t,
			origin: o,
			elementType: i.type,
			bounds: Object.freeze({
				x: i.x,
				y: i.y,
				width: i.width,
				height: i.height,
				rotation: i.rotation,
				flipH: i.flipH,
				flipV: i.flipV
			})
		}));
	}
	return Object.freeze(t.flatMap((e) => {
		let t = r.get(e);
		return t ? [t] : [];
	}));
}
var J = /* @__PURE__ */ new WeakMap();
function Y(e, t) {
	let n = Object.freeze({ ...t });
	for (let t of [...J.get(e) ?? []]) try {
		t.notify(n);
	} catch (e) {
		try {
			t.report(e);
		} catch {}
	}
}
function un(e, t, n, r) {
	let i = J.get(e);
	i || (i = /* @__PURE__ */ new Set(), J.set(e, i));
	let a = Object.freeze({
		notify: n,
		report: r
	});
	i.add(a);
	try {
		n(Object.freeze({ ...t() }));
	} catch (e) {
		try {
			r(e);
		} catch {}
	}
	return () => {
		i?.delete(a), i?.size === 0 && J.delete(e);
	};
}
function dn() {
	return new Promise((e) => {
		let t = new MessageChannel();
		t.port1.onmessage = () => {
			t.port1.close(), t.port2.close(), e();
		}, t.port2.postMessage(void 0);
	});
}
var X = class e {
	_cjkFallback = "jp";
	_googleSubstitutes = !1;
	_parsedTextChain = !0;
	_metrics = null;
	_worker;
	_bridge;
	_mode = "main";
	_bootstrap = null;
	_preflight = null;
	_availableSlideCount = 0;
	_layoutLifecycle = new _e();
	_layoutObservers = new Ie();
	_layoutCompletion = null;
	_parseRequestId = null;
	_progressive = null;
	_progressiveWatchdog;
	_progressiveWatchdogMs;
	_layoutWaiters = /* @__PURE__ */ new Set();
	_slides = null;
	_slidePullClient = null;
	_resourceFailure = null;
	_slidePartIndex = null;
	_rawParts = new de({
		maxEntries: 64,
		maxBytes: fe
	});
	_googleFonts = null;
	_officeFontLoads = /* @__PURE__ */ new Map();
	_embeddedFontFaces = [];
	_embeddedFontAliases = /* @__PURE__ */ new Map();
	_embeddedFontAuthoredFamilies = /* @__PURE__ */ new Map();
	_embeddedFontTuples = /* @__PURE__ */ new Set();
	_destroyed = !1;
	_fetchImage = (e, t) => this.getImage(e, t);
	_fetchMedia = (e) => this.getMedia(e);
	_math;
	_threeD;
	_regionMap;
	_chartEx;
	_tiff;
	constructor(e, t, n) {
		this._worker = e, this._mode = t, this._bridge = new He(this._worker, {
			correlate: (e) => "protocol" in e && e.protocol === "ooxml-pull-v1" ? e.requestId : "id" in e ? e.id : void 0,
			toError: (e) => !("protocol" in e) && e.kind === "error" ? ie(e) : void 0,
			onUnsolicited: (e) => this._onWorkerLayoutPush(e)
		});
		let r = new URL(n ?? Zt, location.href).href;
		this._bridge.post({
			kind: "init",
			wasmUrl: r
		});
	}
	_assertResourceHealthy() {
		if (this._resourceFailure) throw this._resourceFailure;
	}
	_rethrowWithResourceFailure(e) {
		let t = e instanceof v ? e : S(e);
		throw t ? (this._resourceFailure ??= t, this._resourceFailure) : e;
	}
	static async load(t, n = {}) {
		if (n.legacyPpt !== void 0) {
			let { loadPptxModelSource: e } = await import("./presentation-model-source-3N7xLtmI.js");
			return e(t, n);
		}
		let r = ae(n.cjkFallback), i = C(n), a = n.mode ?? "main", o = new ne({
			enabled: !0,
			format: "pptx",
			mode: a,
			policy: i.policy,
			onMetrics: i.onResourceMetrics,
			emitToConsole: i.debug
		});
		try {
			if (a === "worker" && (typeof Worker > "u" || typeof OffscreenCanvas > "u")) throw Error("mode: 'worker' requires Worker and OffscreenCanvas support");
			let s;
			if (typeof t == "string") {
				let e = await fetch(t);
				if (!e.ok) throw Error(`Failed to fetch: ${e.status} ${e.statusText}`);
				s = await e.arrayBuffer();
			} else s = t;
			s = ee(await y(s, n.password)), o.setSourceBytes(s.byteLength), o.checkpoint("container ready");
			let c = a === "worker" ? (await import("./render-worker-host-CVr53kg0.js")).createRenderWorker() : new Xt(), l = a === "worker" ? it(n) : void 0, u;
			try {
				u = new e(c, a, n.wasmUrl), u._metrics = o, n.math && a === "worker" && !l?.math && console.warn("[ooxml] a custom math renderer cannot cross the worker boundary; equations will be skipped in mode: 'worker'. Use the math renderer from @silurus/ooxml/math."), n.threeD && a === "worker" && !l?.threeD && console.warn("[ooxml] a custom 3-D chart renderer cannot cross the worker boundary; charts use their 2-D family fallback in mode: 'worker'. Use the renderer from @silurus/ooxml/three-d."), u._cjkFallback = r, u._math = a === "worker" ? void 0 : n.math, u._threeD = a === "worker" ? void 0 : n.threeD, n.regionMap && a === "worker" && !l?.regionMap && console.warn("[ooxml] a custom Region Map renderer cannot cross the worker boundary; geospatial charts use the unsupported-chart placeholder in mode: 'worker'. Use the renderer from @silurus/ooxml/region-map."), u._regionMap = a === "worker" ? void 0 : n.regionMap, n.chartEx && a === "worker" && !l?.chartEx && console.warn("[ooxml] a custom ChartEx renderer cannot cross the worker boundary; ChartEx charts use the unsupported-chart placeholder in mode: 'worker'. Use the renderer from @silurus/ooxml/chart-ex."), u._chartEx = a === "worker" ? void 0 : n.chartEx, n.tiff && a === "worker" && !l?.tiff && console.warn("[ooxml] a custom TIFF codec cannot cross the worker boundary; recognized TIFF images will use an unavailable-image placeholder in mode: 'worker'. Use the codec from @silurus/ooxml/tiff to display them."), u._tiff = a === "worker" ? void 0 : n.tiff;
				let t = n.progressiveLayout ? {
					onProgress: n.onLayoutProgress,
					onPartial: n.onLayoutPartial,
					onComplete: n.onLayoutComplete,
					firstPublication: be(),
					published: !1,
					deferred: !1,
					settled: !1
				} : void 0;
				return u._googleSubstitutes = !!n.useGoogleFonts, await u._parse(s, i.policy, !!n.useGoogleFonts, n.workerTimeoutMs, (e) => o.observeUsage(e), l, t), o.checkpoint("presentation preflight ready"), a === "main" && n.useGoogleFonts && u._preflight && !t && await u._ensureGoogleFonts(K(u._preflight.fontPreloadNames, u._embeddedFontAliases), u._preflight.fontPreloadDemand), o.succeed({ slides: u.slideCount }), u;
			} catch (e) {
				let t = u;
				throw Ue(c, t ? () => t.destroy() : void 0), e;
			}
		} catch (e) {
			throw o.fail(e), e;
		}
	}
	async _ensureGoogleFonts(e, t) {
		this._destroyed || (this._googleFonts ??= new w(i), await this._googleFonts.ensure(e, t));
	}
	async _parse(e, n, r = !1, i, a, o, l) {
		if (l) {
			this._progressive = l, this._mode === "worker" ? await this._parseWorkerProgressively(e, n, r, i, a, o, l) : await this._parseMainProgressively(e, n, r, i, a, l, r && !o);
			return;
		}
		let u = await this._bridge.request((t) => this._mode === "worker" ? {
			kind: "parse",
			id: t,
			buffer: e,
			resourcePolicy: n,
			useGoogleFonts: r,
			cjkFallback: this._cjkFallback,
			renderers: o
		} : {
			kind: "parse",
			id: t,
			buffer: e,
			resourcePolicy: n,
			cjkFallback: this._cjkFallback,
			...r && !o ? { collectFontDemand: !0 } : {}
		}, [e], { timeoutMs: i });
		if (this._mode === "worker") {
			let e = u;
			e.usage && a?.(e.usage), this._preflight = c(u.preflight), this._bootstrap = this._preflight, this._availableSlideCount = this._preflight.slideCount;
			return;
		}
		let d = t(u.bootstrap);
		this._bootstrap = d;
		let p = qt(d.embeddedFonts, (e) => this.getFontBytes(e)).then((e) => {
			this._destroyed ? k(e.faces) : (this._embeddedFontFaces = e.faces, this._embeddedFontAliases = e.aliases, this._embeddedFontAuthoredFamilies = e.authoredFamilies, this._embeddedFontTuples = e.tuples);
		});
		p.catch(() => void 0), this._slidePullClient = new f({
			slideCount: d.slideCount,
			transport: this._bridge.transport(s),
			open: async (e, t, n) => {
				await this._bridge.request((n) => ({
					kind: "openSlideSession",
					id: n,
					slideIndex: e,
					...t
				}), void 0, { timeoutMs: n });
			},
			onUsage: a
		});
		let m;
		try {
			for (let e = 0; e < d.slideCount; e += 1) await this._slidePullClient.load(e, !1, i);
			m = await this._bridge.request((e) => ({
				kind: "finishPresentationPreflight",
				id: e
			}), void 0, { timeoutMs: i }), await p;
		} catch (e) {
			throw p.catch(() => void 0), e;
		}
		this._preflight = c(m.preflight), this._availableSlideCount = this._preflight.slideCount, this._slides = new Ut({
			slideCount: this._preflight.slideCount,
			maxCachedSlides: 8,
			maxCachedStructuralBytes: ce,
			loadSlide: async (e) => {
				let t = await this._slidePullClient?.load(e, !0, i);
				if (!t) throw Error("PPTX slide pull client is unavailable");
				return t;
			}
		});
	}
	async _parseMainProgressively(e, n, r, i, a, o, s = r) {
		let c = t((await this._bridge.request((t) => ({
			kind: "parse",
			id: t,
			buffer: e,
			resourcePolicy: n,
			cjkFallback: this._cjkFallback,
			progressiveLayout: !0
		}), [e], { timeoutMs: i })).bootstrap);
		this._bootstrap = c;
		let l = qt(c.embeddedFonts, (e) => this.getFontBytes(e)).then((e) => {
			this._destroyed ? k(e.faces) : (this._embeddedFontFaces = e.faces, this._embeddedFontAliases = e.aliases, this._embeddedFontAuthoredFamilies = e.authoredFamilies, this._embeddedFontTuples = e.tuples);
		});
		l.catch(() => void 0), this._slidePullClient = this._createSlidePullClient(c.slideCount, i, a), this._slides = new Ut({
			slideCount: c.slideCount,
			maxCachedSlides: 8,
			maxCachedStructuralBytes: ce,
			loadSlide: async (e) => {
				let t = await this._slidePullClient?.load(e, !0, i);
				if (!t) throw Error("PPTX slide pull client is unavailable");
				return t;
			}
		});
		let d = new u(c, {
			cjkFallback: this._cjkFallback,
			collectFontDemand: s ? await ht(!0) : void 0
		}), f = async () => {
			await l, r && await this._ensureGoogleFonts(K(d.currentFontPreloadNames, this._embeddedFontAliases), d.currentFontPreloadDemandDelta);
		}, p = (async () => {
			for (let e = 0; e < c.slideCount; e += 1) await this._slides.withSlide(e, (e) => {
				d.addSlide(e);
			}), await f(), this._applyProgressivePrefix(d.snapshot(), o), e === 0 && o.deferred && await dn();
			await l, this._finishProgressiveLayout(d.finish(), o);
		})();
		this._layoutCompletion = p.then(() => void 0, (e) => this._failProgressiveLayout(e, o)), await o.firstPublication.promise;
	}
	async _parseWorkerProgressively(e, t, n, r, i, a, o) {
		this._progressiveWatchdogMs = r;
		let s = this._bridge.request((r) => (this._parseRequestId = r, {
			kind: "parse",
			id: r,
			buffer: e,
			resourcePolicy: t,
			useGoogleFonts: n,
			cjkFallback: this._cjkFallback,
			renderers: a,
			progressiveLayout: !0
		}), [e], { timeoutMs: !1 });
		this._rearmProgressiveWatchdog(), this._layoutCompletion = s.then((e) => {
			this._parseRequestId = null;
			let t = e;
			t.usage && i?.(t.usage), this._finishProgressiveLayout(c(t.preflight), o);
		}, (e) => {
			this._parseRequestId = null, this._failProgressiveLayout(e, o);
		}), await o.firstPublication.promise;
	}
	_createSlidePullClient(e, t, n) {
		return new f({
			slideCount: e,
			transport: this._bridge.transport(s),
			open: async (e, n, r) => {
				await this._bridge.request((t) => ({
					kind: "openSlideSession",
					id: t,
					slideIndex: e,
					...n
				}), void 0, { timeoutMs: r ?? t });
			},
			onUsage: n
		});
	}
	_onWorkerLayoutPush(e) {
		if (!tt((e, t) => this._worker.postMessage(e, t), e) && !(!("kind" in e) || e.kind !== "presentationLayoutPartial" || e.forId !== this._parseRequestId || !this._progressive)) try {
			this._rearmProgressiveWatchdog(), e.usage && this._metrics?.observeUsage(e.usage), e.bootstrap && (this._bootstrap = t(e.bootstrap));
			let n = this._bootstrap;
			if (!n) throw Error("PPTX progressive worker published before bootstrap");
			let r = this._preflight?.slides ?? [];
			if (e.availableSlides !== r.length + 1 || e.slide.index !== r.length) throw Error("PPTX progressive worker published a non-sequential slide");
			this._applyProgressivePrefix(d({
				...n,
				slides: [...r, e.slide],
				fontPreloadNames: e.fontPreloadNames
			}), this._progressive), dn().then(() => {
				this._destroyed || this._parseRequestId !== e.forId || this._bridge.post({
					kind: "continuePresentationPreflight",
					forId: e.forId,
					availableSlides: e.availableSlides
				});
			}).catch((t) => {
				this._destroyed || this._parseRequestId !== e.forId || !this._progressive || (this._failProgressiveLayout(t, this._progressive), this._bridge.terminate());
			});
		} catch (e) {
			this._failProgressiveLayout(e, this._progressive), this._bridge.terminate();
		}
	}
	_applyProgressivePrefix(e, t) {
		if (!(t.settled || this._destroyed)) {
			if (this._preflight = e, this._availableSlideCount = e.slides.length, !t.published && e.slides.length === e.slideCount) {
				t.published = !0, t.deferred = !1;
				return;
			}
			if (this._layoutLifecycle.begin(), this._wakeLayoutWaiters(), this._layoutObservers.notify("onLayoutProgress", t.onProgress, { committedUnits: this._availableSlideCount }), Y(this, {
				availableSlides: this._availableSlideCount,
				slideCount: this.slideCount,
				exact: !1,
				complete: !1
			}), !t.published) {
				t.published = !0, t.deferred = e.slides.length < e.slideCount, t.firstPublication.resolve();
				return;
			}
			this._layoutObservers.notify("onLayoutPartial", t.onPartial, {
				availableUnits: this._availableSlideCount,
				totalUnits: this.slideCount,
				exact: !1
			});
		}
	}
	_finishProgressiveLayout(e, t) {
		t.settled || this._destroyed || (t.settled = !0, this._clearProgressiveWatchdog(), this._preflight = e, this._bootstrap ??= e, this._availableSlideCount = e.slideCount, this._layoutLifecycle.succeed(), this._wakeLayoutWaiters(), t.firstPublication.resolve(), Y(this, {
			availableSlides: this._availableSlideCount,
			slideCount: this.slideCount,
			exact: !0,
			complete: !0
		}), this._layoutObservers.notify("onLayoutComplete", t.onComplete));
	}
	_failProgressiveLayout(e, t) {
		if (t.settled || (t.settled = !0, this._clearProgressiveWatchdog(), this._destroyed)) return;
		if (!t.deferred) {
			t.firstPublication.reject(e);
			return;
		}
		let n = this._layoutLifecycle.fail(e);
		this._wakeLayoutWaiters(), Y(this, {
			availableSlides: this._availableSlideCount,
			slideCount: this.slideCount,
			exact: !1,
			complete: !1,
			error: n
		}), this._layoutObservers.notify("onLayoutComplete", t.onComplete, n);
	}
	_wakeLayoutWaiters() {
		for (let e of this._layoutWaiters) e();
		this._layoutWaiters.clear();
	}
	_rearmProgressiveWatchdog() {
		this._progressiveWatchdogMs !== void 0 && (clearTimeout(this._progressiveWatchdog), this._progressiveWatchdog = setTimeout(() => {
			let e = this._progressive, t = this._progressiveWatchdogMs;
			if (!e || e.settled || t === void 0 || this._destroyed) return;
			let n = /* @__PURE__ */ Error(`worker layout produced no progress for ${t}ms`);
			this._failProgressiveLayout(n, e), this._bridge.terminate();
		}, this._progressiveWatchdogMs));
	}
	_clearProgressiveWatchdog() {
		clearTimeout(this._progressiveWatchdog), this._progressiveWatchdog = void 0, this._progressiveWatchdogMs = void 0;
	}
	async _waitForSlide(e) {
		for (; !this._destroyed && e >= this._availableSlideCount && !this._layoutLifecycle.settled;) await new Promise((e) => this._layoutWaiters.add(e));
		e >= this._availableSlideCount && await this.waitUntilLayoutComplete();
	}
	_assertSlideIndex(e) {
		if (!Number.isInteger(e) || e < 0 || e >= this.slideCount) throw Error(`Slide index ${e} out of range (count: ${this.slideCount})`);
	}
	get slideCount() {
		return this._bootstrap?.slideCount ?? this._preflight?.slideCount ?? 0;
	}
	get availableSlideCount() {
		return this._availableSlideCount;
	}
	get layoutComplete() {
		return this._layoutLifecycle.complete;
	}
	async waitUntilLayoutComplete() {
		this._layoutCompletion && await this._layoutCompletion, this._layoutLifecycle.throwIfFailed();
	}
	get slideWidth() {
		return this._bootstrap?.slideWidth ?? this._preflight?.slideWidth ?? 0;
	}
	get slideHeight() {
		return this._bootstrap?.slideHeight ?? this._preflight?.slideHeight ?? 0;
	}
	get mode() {
		return this._mode;
	}
	getNotes(e) {
		return Number.isInteger(e) ? this._preflight?.slides[e]?.notes ?? null : null;
	}
	getComments(e) {
		return Number.isInteger(e) ? this._preflight?.slides[e]?.comments ?? [] : [];
	}
	isHidden(e) {
		return Number.isInteger(e) ? this._preflight?.slides[e]?.hidden ?? !1 : !1;
	}
	_partNames() {
		return (this._bootstrap?.slides ?? this._preflight?.slides ?? []).map((e) => e.partName);
	}
	_partIndex() {
		return this._slidePartIndex ||= Ft(this._partNames()), this._slidePartIndex;
	}
	getSlideIndexByPartName(e) {
		return this._partIndex().get(e);
	}
	resolveInternalTarget(e, t = 0) {
		return Lt(e, this._partIndex(), t);
	}
	async _officeRoutesForRequests(e, t) {
		if (this._destroyed) throw Error("Presentation destroyed");
		if (!t) return {
			routes: {},
			installed: []
		};
		let n = Gt(e, this._embeddedFontTuples), r = this._officeFontLoads.get(t);
		r || (r = /* @__PURE__ */ new Map(), this._officeFontLoads.set(t, r));
		let i = await zt(r, n, (e) => re(e, t), t);
		if (this._destroyed) throw Error("Presentation destroyed");
		return i;
	}
	async renderSlide(e, t, n = {}) {
		this._assertResourceHealthy();
		try {
			if (this._mode === "worker") throw Error("renderSlide(canvas) is unavailable in mode: 'worker'; use renderSlideToBitmap() and paint it via an ImageBitmapRenderingContext");
			if (this._assertSlideIndex(t), await this._waitForSlide(t), this._destroyed) throw Error("Presentation destroyed");
			let r = this._preflight, i = this._slides;
			if (!r || !i) throw Error("Presentation not loaded");
			let a = n.dpr ?? T(), o = n.width ?? ((b(e) ? e.offsetWidth : 0) || 960), s = await i.withSlide(t, (e) => l(e, r.majorFont, r.minorFont));
			if (this._destroyed) throw Error("Presentation destroyed");
			let c = b(e) ? e.ownerDocument.fonts : typeof document < "u" ? document.fonts : null, { routes: u, installed: d } = await this._officeRoutesForRequests(s, c);
			await i.withSlide(t, (t) => {
				if (this._destroyed) throw Error("Presentation destroyed");
				return this._assertResourceHealthy(), p(e, t, r.slideWidth, r.slideHeight, {
					width: o,
					dpr: a,
					defaultTextColor: r.defaultTextColor,
					parsedTextChain: this._parsedTextChain,
					cjkFallback: this._cjkFallback,
					majorFont: r.majorFont,
					minorFont: r.minorFont,
					hlinkColor: r.hlinkColor,
					embeddedFontAliases: this._embeddedFontAliases,
					embeddedFontAuthoredFamilies: this._embeddedFontAuthoredFamilies,
					embeddedFontTuples: this._embeddedFontTuples,
					officeFontRoutes: u,
					officeInstalledFamilies: d,
					googleSubstitutes: this._googleSubstitutes,
					fetchMedia: this._fetchMedia,
					fetchImage: this._fetchImage,
					skipMediaControls: n.skipMediaControls,
					dim: n.dim,
					math: this._math,
					threeD: this._threeD,
					regionMap: this._regionMap,
					chartEx: this._chartEx,
					tiff: this._tiff,
					imageResources: n.imageResources
				}, n.onTextRun);
			});
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async renderSlideToBitmap(e, t = {}) {
		this._assertResourceHealthy();
		try {
			this._assertSlideIndex(e), await this._waitForSlide(e);
			let n = t.width ?? 960, r = t.dpr ?? T();
			if (this._mode === "worker") {
				let i = new OffscreenCanvas(1, 1), a = await this._bridge.request((a) => ({
					kind: "renderSlide",
					id: a,
					slideIndex: e,
					width: n,
					dpr: r,
					imageResources: t.imageResources,
					skipMediaControls: t.skipMediaControls,
					dim: t.dim,
					canvas: i
				}), [i]);
				try {
					if (t.onTextRun) for (let e of a.runs) t.onTextRun(e);
				} catch (e) {
					throw oe(a.bitmap), e;
				}
				return a.bitmap;
			}
			let i = new OffscreenCanvas(1, 1);
			return await this.renderSlide(i, e, {
				width: n,
				dpr: r,
				imageResources: t.imageResources,
				skipMediaControls: t.skipMediaControls,
				dim: t.dim,
				onTextRun: t.onTextRun
			}), i.transferToImageBitmap();
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async collectSlideRuns(e, t = 960) {
		this._assertResourceHealthy();
		try {
			if (this._assertSlideIndex(e), await this._waitForSlide(e), this._mode === "worker") {
				let n = new OffscreenCanvas(1, 1);
				return (await this._bridge.request((r) => ({
					kind: "collectRuns",
					id: r,
					slideIndex: e,
					width: t,
					canvas: n
				}), [n])).runs;
			}
			let n = [], r = new OffscreenCanvas(1, 1);
			return await this.renderSlide(r, e, {
				width: t,
				onTextRun: (e) => n.push(e)
			}), n;
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async getElementContextAt(e, t, n = {}) {
		this._assertResourceHealthy(), this._assertSlideIndex(e);
		try {
			if (await this._waitForSlide(e), this._mode === "worker") return (await this._bridge.request((r) => ({
				kind: "hitTestElement",
				id: r,
				slideIndex: e,
				point: t,
				options: n
			}))).context;
			if (!this._slides) throw Error("Presentation not loaded");
			return await this._slides.withSlide(e, (r) => cn(e, r, t, n));
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async getElementBoundsByIds(e, t) {
		this._assertResourceHealthy(), this._assertSlideIndex(e);
		let n = Object.freeze(t.filter((e) => typeof e == "string" && e.length > 0));
		if (n.length === 0) return Object.freeze([]);
		try {
			if (await this._waitForSlide(e), this._mode === "worker") return (await this._bridge.request((t) => ({
				kind: "resolveElementBounds",
				id: t,
				slideIndex: e,
				elementIds: n
			}))).bounds;
			if (!this._slides) throw Error("Presentation not loaded");
			return await this._slides.withSlide(e, (e) => ln(e, n));
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async getMedia(e) {
		this._assertResourceHealthy();
		try {
			let t = this._findMimeTypeForPath(e);
			return await this._rawParts.get(e, t, async () => {
				let n = (await this._bridge.request((t) => ({
					kind: "extractMedia",
					id: t,
					path: e
				}))).bytes;
				return new Blob([n], { type: t });
			});
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	_findMimeTypeForPath(e) {
		return this._preflight ? a(this._preflight, e) : "";
	}
	async getImage(e, t) {
		this._assertResourceHealthy();
		try {
			return await this._rawParts.get(e, t, async () => {
				let n = (await this._bridge.request((t) => ({
					kind: "extractImage",
					id: t,
					path: e
				}))).bytes;
				return new Blob([n], { type: t });
			});
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async getFontBytes(e) {
		this._assertResourceHealthy();
		try {
			let t = await this._bridge.request((t) => ({
				kind: "extractFont",
				id: t,
				path: e
			}));
			return new Uint8Array(t.bytes);
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async getResourceMetrics() {
		let e = this._metrics;
		if (!e) throw Error("Presentation not loaded");
		return te(e, async (e) => (await this._bridge.request((e) => ({
			kind: "resourceUsage",
			id: e
		}), void 0, { timeoutMs: e })).usage);
	}
	async toMarkdown() {
		this._assertResourceHealthy();
		try {
			return (await this._bridge.request((e) => ({
				kind: "toMarkdown",
				id: e
			}))).markdown;
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	async presentSlide(e, t, n = {}) {
		this._assertResourceHealthy();
		try {
			if (this._assertSlideIndex(t), await this._waitForSlide(t), !this._preflight) throw Error("Presentation not loaded");
			let r = n.dpr ?? T(), i = n.width ?? (e.offsetWidth || 960), a = this.slideWidth > 0 ? i * this.slideHeight / this.slideWidth : 0;
			e.style.width = `${Math.round(i)}px`, e.style.height = `${Math.round(a)}px`, e.style.display || (e.style.display = "block");
			let o = this._mode === "worker" ? async () => {
				let a = await this.renderSlideToBitmap(t, {
					width: i,
					dpr: r,
					imageResources: n.imageResources,
					skipMediaControls: !0,
					dim: n.dim,
					onTextRun: n.onTextRun
				});
				try {
					e.width = a.width, e.height = a.height;
					let t = e.getContext("2d");
					if (!t) throw Error("2D context not available");
					t.drawImage(a, 0, 0);
				} finally {
					oe(a);
				}
			} : () => this.renderSlide(e, t, {
				width: i,
				dpr: r,
				imageResources: n.imageResources,
				skipMediaControls: !0,
				dim: n.dim,
				onTextRun: n.onTextRun
			});
			return await bt(e, this._preflight.slides[t]?.mediaElements ?? [], {
				width: i,
				height: a,
				slideWidthEmu: this.slideWidth,
				fetchMedia: this._fetchMedia,
				fetchImage: this._fetchImage,
				drawBase: o,
				onError: n.onError
			});
		} catch (e) {
			this._rethrowWithResourceFailure(e);
		}
	}
	destroy() {
		this._destroyed = !0, this._clearProgressiveWatchdog(), this._slidePullClient?.cancelAll(), this._bridge.terminate(), this._slides?.clear(), this._slides = null, this._slidePullClient = null, this._bootstrap = null, this._preflight = null, this._availableSlideCount = 0, this._layoutLifecycle.succeed(), this._layoutCompletion = null, this._progressive = null, this._parseRequestId = null, this._wakeLayoutWaiters(), this._resourceFailure = null, this._slidePartIndex = null, this._rawParts.clear(), this._googleFonts?.release(), this._googleFonts = null;
		for (let e of this._officeFontLoads.values()) for (let t of Ht(e)) t.then((e) => x(e.faces));
		this._officeFontLoads.clear(), this._embeddedFontFaces.length > 0 && (k(this._embeddedFontFaces), this._embeddedFontFaces = []), this._embeddedFontAliases = /* @__PURE__ */ new Map(), this._embeddedFontAuthoredFamilies = /* @__PURE__ */ new Map(), this._embeddedFontTuples = /* @__PURE__ */ new Set(), se(this._fetchImage), le(this._fetchImage);
	}
};
function fn(e, t, n, r, i = {}) {
	let a = Le({
		id: e.id,
		author: e.author,
		date: e.date,
		text: e.text,
		status: e.status ?? "active"
	}, (e.replies ?? []).map((e) => ({
		id: e.id,
		author: e.author,
		date: e.date,
		text: e.text,
		status: e.status ?? "active"
	})), i.maxTextCharacters);
	return Object.freeze({
		format: "pptx",
		kind: "comment",
		slideIndex: t,
		commentIndex: n,
		occurrenceId: r,
		...e.id ? { commentId: e.id } : {},
		...Number.isFinite(e.x) && Number.isFinite(e.y) ? { point: Object.freeze({
			x: e.x,
			y: e.y
		}) } : {},
		thread: a.thread,
		truncated: a.truncated,
		truncationReasons: a.truncated ? ["text"] : [],
		textCharacters: a.textCharacters,
		maxTextCharacters: a.maxTextCharacters
	});
}
function pn(e) {
	for (let t = e; t; t = t.parentElement) {
		let e = j(t.dataset.slideIndex);
		if (e !== null) return e;
	}
	return null;
}
function Z(e, t, n = {}) {
	let r = Ge(e, t, (e) => {
		let t = pn(e), n = j(e.dataset.runIndex);
		if (t === null || n === null) return null;
		let r = j(e.dataset.elementIndex), i = e.dataset.elementOrigin, a = r !== null && (i === "master" || i === "layout" || i === "slide");
		return {
			slideIndex: t,
			runIndex: n,
			...e.dataset.shapeId === void 0 ? {} : { shapeId: e.dataset.shapeId },
			...a ? {
				elementIndex: r,
				origin: i
			} : {}
		};
	}, {
		maxChars: n.maxTextCharacters,
		maxLocators: n.maxRunLocators
	});
	if (!r) return null;
	let i = [...r.locators].sort((e, t) => e.slideIndex - t.slideIndex || e.runIndex - t.runIndex);
	return {
		format: "pptx",
		kind: "text",
		text: r.text,
		slideIndexes: [...new Set(i.map((e) => e.slideIndex))],
		shapeIds: [...new Set(i.flatMap((e) => e.shapeId ? [e.shapeId] : []))],
		runs: i,
		truncated: r.truncated,
		truncationReasons: r.truncationReasons,
		textCharacters: r.textCharacters,
		maxTextCharacters: r.maxTextCharacters,
		maxRunLocators: r.maxLocators
	};
}
function Q(e, t, n, r, i) {
	return r === "worker" ? e.renderSlideToBitmap(n, i) : e.renderSlide(t, n, i);
}
function mn(e) {
	let t = e.ownerDocument ?? document, n = new Ye(e, "Loading slide"), r = n.layer;
	r.style.backdropFilter = "blur(2px)";
	let i = t.createElement("span");
	return i.className = "ooxml-pptx-progress-circle", i.style.cssText = [
		"width:34px",
		"height:34px",
		"box-sizing:border-box",
		"border-radius:50%",
		"border:3px solid var(--border-bright, rgba(100,116,139,0.28))",
		"border-top-color:var(--signal, #12bfd8)",
		"box-shadow:0 2px 10px rgba(15,23,42,0.08)"
	].join(";"), i.setAttribute("aria-hidden", "true"), r.appendChild(i), !(t.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? !1) && typeof i.animate == "function" && i.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
		duration: 800,
		iterations: Infinity,
		easing: "linear"
	}), n;
}
var hn = Symbol("PptxViewer.borrowedPresentation"), gn = {
	color: "#ffffff",
	opacity: .6
}, _n = class e {
	canvas;
	wrapper;
	canvasMount;
	_scale = null;
	textLayer = null;
	highlightLayer = null;
	elementLayer = null;
	_find;
	_findGeneration = 0;
	_measureCtx = null;
	presentationOwner;
	get engine() {
		return this.presentationOwner.current;
	}
	borrowed;
	hostWindow;
	opts;
	currentSlide = 0;
	_renderedSlide = -1;
	_hiddenMode;
	handle = null;
	_mode;
	renderDispatcher;
	errorRouter;
	destroyed = !1;
	selectionChangeListener = null;
	selectionContextKey = "null";
	elementClickListener = null;
	contextMenuListener = null;
	elementContext = null;
	elementHitGeneration = 0;
	elementHitTolerance;
	_loadingIndicator;
	_layoutUnsubscribe = null;
	_layoutWaiters = /* @__PURE__ */ new Set();
	_layoutFailed = !1;
	_navigationGeneration = 0;
	_renderProgressGeneration = 0;
	_lastReportedSlide = -1;
	_lastReportedTotal = -1;
	_lastReportedAvailable = -1;
	_lastReportedLayoutComplete = null;
	static fromPresentation(t, n, r = {}) {
		return new e(t, {
			...r,
			[hn]: n
		});
	}
	constructor(e, t = {}) {
		this.opts = t, this.canvas = e;
		let n = t[hn];
		this.borrowed = n !== void 0, this._mode = F("PptxViewer", t.mode, n), this.presentationOwner = new P("PptxViewer", n ?? null, !1);
		let r = e.ownerDocument?.defaultView ?? (typeof window < "u" ? window : null);
		if (!r) throw Error("PptxViewer requires a canvas with an active Window");
		this.hostWindow = r;
		let i = t.elementHitTolerance ?? 6;
		if (!Number.isFinite(i) || i < 0) throw RangeError("elementHitTolerance must be a finite non-negative number.");
		this.elementHitTolerance = i, this._hiddenMode = t.hiddenSlideMode ?? "show", this.canvasMount = new $e(e, {
			wrapperCssText: "position:relative;display:inline-block;vertical-align:top;",
			forceDisplayBlock: !0
		}), this.wrapper = this.canvasMount.wrapper, this.renderDispatcher = new N(e, this._mode === "worker" && !t.enableMediaPlayback), this.errorRouter = new qe("PptxViewer", t.onError);
		let a = new Ze(this.wrapper, t.enableTextSelection === !0, t.enableElementSelection === !0);
		this.textLayer = a.textLayer, this.highlightLayer = a.highlightLayer, this.elementLayer = a.elementLayer, this._loadingIndicator = mn(this.wrapper), this.wrapper.insertBefore(this._loadingIndicator.layer, this.elementLayer), this.textLayer && (t.onSelectionContextChange || t.enableElementSelection) && (this.selectionChangeListener = () => this._emitSelectionContextChange(), this.wrapper.ownerDocument.addEventListener("selectionchange", this.selectionChangeListener)), t.enableElementSelection && (this.elementClickListener = (e) => {
			this._onElementClick(e).catch((e) => this._reportRenderError(e));
		}, this.wrapper.addEventListener("click", this.elementClickListener)), t.onContextMenu && (this.contextMenuListener = (e) => this._onContextMenu(e), this.wrapper.addEventListener("contextmenu", this.contextMenuListener)), this._find = new mt(() => this.slideCount, (e) => this._collectSlideRuns(e)), n && this._bindLayoutPresentation(n);
	}
	async load(e) {
		if (this.destroyed) throw Error("PptxViewer is destroyed");
		if (this.borrowed) throw Error("PptxViewer.load() is unsupported on a Viewer created by fromPresentation(); the borrowed presentation is already loaded.");
		let t = !1;
		try {
			let n = await this.presentationOwner.replace(() => X.load(e, {
				password: this.opts.password,
				useGoogleFonts: this.opts.useGoogleFonts,
				cjkFallback: this.opts.cjkFallback,
				maxZipEntryBytes: this.opts.maxZipEntryBytes,
				resourceLimits: this.opts.resourceLimits,
				debug: this.opts.debug,
				onResourceMetrics: this.opts.onResourceMetrics,
				workerTimeoutMs: this.opts.workerTimeoutMs,
				wasmUrl: this.opts.wasmUrl,
				math: this.opts.math,
				threeD: this.opts.threeD,
				regionMap: this.opts.regionMap,
				chartEx: this.opts.chartEx,
				tiff: this.opts.tiff,
				mode: this._mode,
				...this.opts.legacyPpt === void 0 ? void 0 : { legacyPpt: this.opts.legacyPpt },
				progressiveLayout: this.opts.progressiveLayout,
				onLayoutProgress: this.opts.onLayoutProgress,
				onLayoutPartial: this.opts.onLayoutPartial,
				onLayoutComplete: this.opts.onLayoutComplete
			}), () => {
				this._invalidateElementSelection(!1), t = !0, this.renderDispatcher.begin(), this._invalidateFind(), this.handle?.destroy(), this.handle = null, this._unbindLayoutPresentation();
			});
			if (!n) return;
			if (this.destroyed) throw Error("PptxViewer is destroyed");
			this._bindLayoutPresentation(n);
			let r = this._beginNavigation();
			if (this.currentSlide = await this._initialSlide(r), r !== this._navigationGeneration || n !== this.engine) return;
			this._renderedSlide = -1, this._invalidateFind(), await this.renderCurrentSlide();
		} catch (e) {
			throw this.destroyed ? Error("PptxViewer is destroyed") : e instanceof Error ? e : Error(String(e));
		}
		t && !this.destroyed && this._emitSelectionContextChange();
	}
	async goToSlide(e) {
		let t = this._beginNavigation();
		await this._goToSlide(e, t);
	}
	async _goToSlide(e, t) {
		if (t !== this._navigationGeneration || !this.engine || this.slideCount === 0) return;
		let n = Math.max(0, Math.min(e, this.slideCount - 1)), r = n !== this.currentSlide;
		r && this._invalidateElementSelection(!1), this.currentSlide = n, await this.renderCurrentSlide(), r && !this.destroyed && this._emitSelectionContextChange();
	}
	async nextSlide() {
		let e = this._beginNavigation(), t = await this._step(1, e);
		await this._goToSlide(t, e);
	}
	async prevSlide() {
		let e = this._beginNavigation(), t = await this._step(-1, e);
		await this._goToSlide(t, e);
	}
	async _step(e, t) {
		let n = this.engine, r = this.currentSlide;
		if (this._hiddenMode !== "skip" || !n) return r + e;
		for (let i = r + e; i >= 0 && i < this.slideCount; i += e) {
			if (i >= n.availableSlideCount && (n.layoutComplete || this._setLoading(!0), !await this._waitForSlide(n, i, () => t === this._navigationGeneration))) return r;
			if (!n.isHidden(i)) return i;
		}
		return r;
	}
	async _initialSlide(e) {
		let t = this.engine;
		if (this._hiddenMode !== "skip" || !t || this.slideCount === 0 || t.availableSlideCount === 0 && !await this._waitForSlide(t, 0, () => e === this._navigationGeneration) || !t.isHidden(0)) return 0;
		let n = await this._step(1, e);
		return n === 0 ? 0 : n;
	}
	_dim() {
		return {
			color: this.opts.hiddenSlideDim?.color ?? gn.color,
			opacity: this.opts.hiddenSlideDim?.opacity ?? gn.opacity
		};
	}
	async setHiddenSlideMode(e) {
		let t = this._beginNavigation();
		this._hiddenMode = e;
		let n = this.currentSlide;
		if (e === "skip" && this.engine) {
			let e = this.engine;
			if (this.currentSlide >= e.availableSlideCount && !await this._waitForSlide(e, this.currentSlide, () => t === this._navigationGeneration)) return;
			e.isHidden(this.currentSlide) && (n = await this._step(1, t), n === this.currentSlide && (n = await this._step(-1, t)));
		}
		if (t !== this._navigationGeneration) return;
		let r = n !== this.currentSlide;
		r && this._invalidateElementSelection(!1), this.currentSlide = n, await this.renderCurrentSlide(), r && !this.destroyed && this._emitSelectionContextChange();
	}
	get hiddenSlideMode() {
		return this._hiddenMode;
	}
	get visibleSlideCount() {
		if (!this.engine) return 0;
		let e = this.engine;
		return at((t) => e.isHidden(t), this.slideCount);
	}
	get slideIndex() {
		return this.currentSlide;
	}
	get slideCount() {
		return this.engine?.slideCount ?? 0;
	}
	get availableSlideCount() {
		return this.engine?.availableSlideCount ?? this.slideCount;
	}
	get layoutComplete() {
		return this.engine?.layoutComplete ?? !0;
	}
	async waitUntilLayoutComplete() {
		await this.errorRouter.ownBackgroundLifecycle(async () => {
			await this.engine?.waitUntilLayoutComplete?.();
		});
	}
	getNotes(e) {
		return this.engine?.getNotes(e) ?? null;
	}
	get canvasElement() {
		return this.canvas;
	}
	_naturalWidthPx() {
		let e = this.engine?.slideWidth ?? 0;
		return e > 0 ? e / h : 0;
	}
	_targetWidth() {
		if (this._scale === null) return this.opts.width ?? (this.canvas.offsetWidth || 960);
		let e = this._naturalWidthPx();
		return e <= 0 ? this.opts.width ?? (this.canvas.offsetWidth || 960) : Math.round(e * this._scale);
	}
	getScale() {
		if (this._scale !== null) return this._scale;
		let e = this._naturalWidthPx();
		return e <= 0 ? 1 : this._targetWidth() / e;
	}
	_zoomMin() {
		return this.opts.zoomMin ?? .1;
	}
	_zoomMax() {
		return this.opts.zoomMax ?? 4;
	}
	async setScale(e) {
		let t = et(e, this._zoomMin(), this._zoomMax()), n = t !== this.getScale();
		this._scale = t, await this.renderCurrentSlide(), n && this.opts.onScaleChange?.(t);
	}
	async zoomIn() {
		await this.setScale(We(this.getScale()));
	}
	async zoomOut() {
		await this.setScale(nt(this.getScale()));
	}
	async fitWidth() {
		await this._fit("width");
	}
	async fitPage() {
		await this._fit("page");
	}
	async _fit(e) {
		if (!this.engine) return;
		let t = this.wrapper.parentElement;
		if (!t) return;
		let n = rt({
			contentWidth: this.engine.slideWidth / h,
			contentHeight: this.engine.slideHeight / h,
			containerWidth: t.clientWidth,
			containerHeight: t.clientHeight
		}, e);
		n <= 0 || await this.setScale(n);
	}
	async renderCurrentSlide() {
		let e = this.engine;
		if (!e) return;
		let t = this.currentSlide, n = ++this._renderProgressGeneration;
		this._setLoading(t >= this.availableSlideCount && !this.layoutComplete);
		let r = this.renderDispatcher.begin();
		try {
			if (t >= e.availableSlideCount && !await this._waitForSlide(e, t, () => n === this._renderProgressGeneration && this.renderDispatcher.isCurrent(r) && e === this.engine && t === this.currentSlide)) return;
			let i = this._hiddenMode === "dim" && e.isHidden(t) ? this._dim() : void 0, a = this._targetWidth(), o = this.opts.dpr ?? T(), s = a / e.slideWidth, c = Math.round(e.slideHeight * s);
			this.canvas.style.width = `${a}px`, this.canvas.style.height = `${c}px`, this.handle?.destroy(), this.handle = null;
			let l = this._mode === "worker", u = [], d = (e) => u.push(e);
			if (this.opts.enableMediaPlayback) {
				let n = await e.presentSlide(this.canvas, t, {
					width: a,
					dpr: o,
					imageResources: this.opts.imageResources,
					dim: i,
					onTextRun: d,
					onError: (e) => {
						this.renderDispatcher.isCurrent(r) && this._reportRenderError(e);
					}
				});
				if (!this.renderDispatcher.isCurrent(r)) {
					n.destroy();
					return;
				}
				this.handle = n;
			} else if (l) {
				let e = await Q(this.engine, this.canvas, t, "worker", {
					width: a,
					dpr: o,
					imageResources: this.opts.imageResources,
					dim: i,
					onTextRun: d
				});
				if (!this.renderDispatcher.commitBitmap(r, e)) return;
			} else if (await Q(this.engine, this.canvas, t, "main", {
				width: a,
				dpr: o,
				imageResources: this.opts.imageResources,
				onTextRun: d,
				dim: i
			}), !this.renderDispatcher.isCurrent(r)) return;
			this._renderedSlide = t, this._emitSlideChange(!0), this.textLayer && this._buildTextLayer(this.textLayer, u, a, c), this._find.setSlideRuns(t, u), this._buildHighlightLayer(u, a, c);
		} catch (t) {
			if (!this.renderDispatcher.isCurrent(r) && !(e === this.engine && this._layoutFailed)) return;
			throw t;
		} finally {
			n === this._renderProgressGeneration && this._setLoading(!1);
		}
	}
	_bindLayoutPresentation(e) {
		this._unbindLayoutPresentation(), this._layoutFailed = !1;
		let t = !0;
		this._layoutUnsubscribe = un(e, () => ({
			availableSlides: e.availableSlideCount,
			slideCount: e.slideCount,
			exact: e.layoutComplete,
			complete: e.layoutComplete
		}), (n) => {
			if (t) {
				t = !1;
				return;
			}
			this._onLayoutPublication(e, n);
		}, (e) => this._reportRenderError(e));
	}
	_unbindLayoutPresentation() {
		this._layoutUnsubscribe?.(), this._layoutUnsubscribe = null, this._layoutFailed = !1, this._navigationGeneration++, this._renderProgressGeneration++, this._wakeLayoutWaiters(), this._setLoading(!1);
	}
	_beginNavigation() {
		let e = ++this._navigationGeneration;
		return this._wakeLayoutWaiters(), e;
	}
	_onLayoutPublication(e, t) {
		if (!(this.destroyed || e !== this.engine)) {
			if (this._wakeLayoutWaiters(), t.error !== void 0) {
				this._layoutFailed = !0, this.errorRouter.reportBackground(t.error, this.opts.onLayoutComplete !== void 0);
				return;
			}
			this._renderedSlide === this.currentSlide && this._emitSlideChange();
		}
	}
	async _waitForSlide(e, t, n) {
		return await this.errorRouter.ownBackgroundLifecycle(async () => {
			for (; !this.destroyed && n() && e === this.engine && t >= e.availableSlideCount && !e.layoutComplete && !this._layoutFailed;) await new Promise((e) => this._layoutWaiters.add(e));
			return this.destroyed || e !== this.engine || ((e.layoutComplete || this._layoutFailed) && await e.waitUntilLayoutComplete?.(), !n()) ? !1 : t < e.availableSlideCount;
		});
	}
	_wakeLayoutWaiters() {
		for (let e of this._layoutWaiters) e();
		this._layoutWaiters.clear();
	}
	_emitSlideChange(e = !1) {
		let t = this.slideCount, n = this.availableSlideCount, r = this.layoutComplete;
		!e && this.currentSlide === this._lastReportedSlide && t === this._lastReportedTotal && n === this._lastReportedAvailable && r === this._lastReportedLayoutComplete || (this._lastReportedSlide = this.currentSlide, this._lastReportedTotal = t, this._lastReportedAvailable = n, this._lastReportedLayoutComplete = r, this.opts.onSlideChange?.(this.currentSlide, t, r));
	}
	_setLoading(e) {
		this._loadingIndicator.setLoading(e);
	}
	_buildHighlightLayer(e, t, n) {
		let r = this.highlightLayer;
		r && R(r, e, this._find.slideHighlights(this.currentSlide), t, n, (e) => this._measureForFont(e), this.opts.findHighlightColors);
	}
	_measureForFont(e) {
		if (!this._measureCtx) {
			let e = document.createElement("canvas");
			this._measureCtx = e.getContext("2d");
		}
		let t = this._measureCtx;
		return t ? (t.font = e, (e) => t.measureText(e).width) : (e) => e.length;
	}
	async _collectSlideRuns(e) {
		return this.engine ? this.engine.collectSlideRuns(e, this._targetWidth()) : [];
	}
	async findText(e, t = {}) {
		let n = this.engine;
		if (!n) return [];
		let r = ++this._findGeneration;
		if (e.length === 0) return this._find.invalidate(), this._redrawHighlights(), [];
		if (n.layoutComplete || await this.errorRouter.ownBackgroundLifecycle(() => n.waitUntilLayoutComplete()), this.destroyed || r !== this._findGeneration || n !== this.engine) return [];
		let i = await this.errorRouter.ownAwaitable(() => this._find.find(e, t));
		return this.destroyed || r !== this._findGeneration || n !== this.engine ? [] : (this._redrawHighlights(), i);
	}
	async findNext() {
		return this._activateMatch(this._find.next());
	}
	async findPrev() {
		return this._activateMatch(this._find.prev());
	}
	clearFind() {
		this._invalidateFind(), this._redrawHighlights();
	}
	_invalidateFind() {
		this._findGeneration++, this._find.invalidate();
	}
	async _activateMatch(e) {
		return e ? (e.location.slide === this.currentSlide ? this._redrawHighlights() : await this.goToSlide(e.location.slide), e) : (this._redrawHighlights(), null);
	}
	_redrawHighlights() {
		let e = this._find.slideRuns(this.currentSlide) ?? [], t = this._targetWidth(), n = this.engine ? Math.round(this.engine.slideHeight * (t / this.engine.slideWidth)) : 0;
		this._buildHighlightLayer(e, t, n);
	}
	_buildTextLayer(e, t, n, r) {
		L(e, t, n, r, this._hyperlinkHandler(), this.currentSlide);
	}
	_hyperlinkHandler() {
		if (this.opts.enableHyperlinks !== !1) return (e) => this._onHyperlinkClick(e);
	}
	_onHyperlinkClick(e) {
		let t = this._resolveInternalSlideIndex(e);
		if (this.opts.onHyperlinkClick) {
			this.opts.onHyperlinkClick(t);
			return;
		}
		if (t.kind === "external") {
			D(t.url, void 0, this.hostWindow);
			return;
		}
		t.slideIndex !== void 0 && this.goToSlide(t.slideIndex).catch((e) => this._reportRenderError(e));
	}
	_resolveInternalSlideIndex(e) {
		if (e.kind !== "internal" || e.slideIndex !== void 0) return e;
		let t = this.engine?.resolveInternalTarget(e.ref, this.currentSlide);
		return t === void 0 ? e : {
			...e,
			slideIndex: t
		};
	}
	_reportRenderError(e) {
		this.errorRouter.report(e);
	}
	async getResourceMetrics() {
		if (!this.engine) throw Error("Presentation not loaded");
		return await this.engine.getResourceMetrics();
	}
	getSelectionContext(e = {}) {
		if (this.destroyed) throw Error("PptxViewer is destroyed");
		return (this.textLayer ? Z(this.wrapper, this.wrapper.ownerDocument?.getSelection?.() ?? null, e) : null) ?? (this.elementContext ? on(this.elementContext, e.maxTextCharacters) : null);
	}
	_emitSelectionContextChange() {
		let e = this.getSelectionContext();
		e?.kind === "text" && (this.elementHitGeneration++, this.elementContext = null, this._redrawElementOutline());
		let t = JSON.stringify(e);
		t !== this.selectionContextKey && (this.selectionContextKey = t, this.opts.onSelectionContextChange?.(e ? structuredClone(e) : null));
	}
	_setElementContext(e) {
		this.elementContext = e ? structuredClone(e) : null, this._redrawElementOutline(), this._emitSelectionContextChange();
	}
	_invalidateElementSelection(e = !0) {
		this.elementHitGeneration++, this.elementContext = null, this._redrawElementOutline(), e && this._emitSelectionContextChange();
	}
	_redrawElementOutline() {
		let e = this.elementContext, t = this.engine;
		if (!e || !t || e.slideIndex !== this.currentSlide) {
			Je(this.elementLayer, null);
			return;
		}
		Je(this.elementLayer, {
			x: e.bounds.x / t.slideWidth,
			y: e.bounds.y / t.slideHeight,
			width: e.bounds.width / t.slideWidth,
			height: e.bounds.height / t.slideHeight,
			rotation: e.bounds.rotation
		});
	}
	async _onElementClick(e) {
		this.destroyed || e.defaultPrevented || e.button !== 0 || await this._resolveContextAt(e);
	}
	_onContextMenu(e) {
		let t;
		this.opts.onContextMenu?.({
			originalEvent: e,
			getContext: () => t ??= this._resolveContextAt(e)
		});
	}
	async _resolveContextAt(e) {
		let t = this.engine;
		if (this.destroyed || !t) return null;
		if (this.textLayer && Z(this.wrapper, this.wrapper.ownerDocument?.getSelection?.() ?? null)) return this._emitSelectionContextChange(), this.destroyed ? null : this.getSelectionContext();
		if (!this.opts.enableElementSelection) return this.getSelectionContext();
		let n = this.canvas.getBoundingClientRect();
		if (n.width <= 0 || n.height <= 0) return this._invalidateElementSelection(), null;
		let r = e.clientX - n.left, i = e.clientY - n.top;
		if (r < 0 || i < 0 || r > n.width || i > n.height) return this._invalidateElementSelection(), null;
		let a = ++this.elementHitGeneration, o = this.currentSlide, s = {
			x: r / n.width * t.slideWidth,
			y: i / n.height * t.slideHeight
		}, c;
		try {
			c = await t.getElementContextAt(o, s, {
				tolerance: this.elementHitTolerance / n.width * t.slideWidth,
				maxTextCharacters: q
			});
		} catch (e) {
			if (this.destroyed || a !== this.elementHitGeneration || o !== this.currentSlide || t !== this.engine) return null;
			throw e;
		}
		return this.destroyed || a !== this.elementHitGeneration || o !== this.currentSlide || t !== this.engine ? null : (this._setElementContext(c), this.destroyed ? null : this.getSelectionContext());
	}
	destroy() {
		this.destroyed || (this.destroyed = !0, this.errorRouter.close(), this.renderDispatcher.destroy(), n(this.canvas), this.handle?.destroy(), this.handle = null, this._unbindLayoutPresentation(), this.presentationOwner.close(), this._invalidateFind(), this.selectionChangeListener &&= (this.wrapper.ownerDocument.removeEventListener("selectionchange", this.selectionChangeListener), null), this.elementHitGeneration++, this.elementClickListener &&= (this.wrapper.removeEventListener("click", this.elementClickListener), null), this.contextMenuListener &&= (this.wrapper.removeEventListener("contextmenu", this.contextMenuListener), null), this.elementContext = null, this.canvasMount.restore());
	}
};
function $(e, t, n) {
	return `slide:${n}:${e.id ?? `classic:${e.authorId ?? "unknown"}:${e.index ?? t}`}`;
}
var vn = class {
	hooks;
	unsubscribe = null;
	constructor(e) {
		this.hooks = e;
	}
	bind(e) {
		this.unbind();
		let t = !0;
		this.unsubscribe = un(e, () => ({
			availableSlides: e.availableSlideCount,
			slideCount: e.slideCount,
			exact: e.layoutComplete,
			complete: e.layoutComplete
		}), (n) => {
			if (t) {
				t = !1;
				return;
			}
			this.onPublication(e, n);
		}, this.hooks.report);
	}
	unbind() {
		this.unsubscribe?.(), this.unsubscribe = null, this.hooks.resetComments(), this.hooks.wakeComments();
	}
	onPublication(e, t) {
		if (!(this.hooks.destroyed() || e !== this.hooks.current())) {
			if (this.hooks.wakeComments(), t.error !== void 0) {
				this.hooks.failComments(), this.hooks.reportBackground(t.error);
				return;
			}
			this.hooks.scanComments(e), this.hooks.renderAvailable(e), this.hooks.emitVisible();
		}
	}
	destroy() {
		this.unbind();
	}
}, yn = class {
	hooks;
	constructor(e) {
		this.hooks = e;
	}
	renderInteractive(e, t, n, r, i, a, o = !0) {
		let s = this.hooks.presentation();
		if (!s) return Promise.resolve();
		let c = ++t.presentationGeneration;
		t.presentationHandle?.destroy(), t.presentationHandle = null;
		let l = [], u = this.hooks.textSelection() && !!t.textLayer, d = u || this.hooks.findActive();
		return s.presentSlide(t.canvas, e, {
			width: n,
			dpr: r,
			imageResources: this.hooks.imageResources(),
			onTextRun: d ? (e) => l.push(e) : void 0,
			onError: (e) => {
				c === t.presentationGeneration && this.hooks.reportError(e);
			}
		}).then((r) => {
			if (!this.isCurrent(e, t, c, a)) {
				r.destroy();
				return;
			}
			t.presentationHandle = r, t.renderedScale = i, u && t.textLayer && L(t.textLayer, l, Math.round(n), Math.round(this.hooks.height()), this.hooks.hyperlinkHandler(), e), d && this.hooks.refreshFindRuns(e, l), this.hooks.commitComments(e, t), this.hooks.redrawHighlights(e, t);
		}).catch((e) => {
			if (c === t.presentationGeneration) if (o) this.hooks.reportError(e);
			else throw e;
		});
	}
	sync(e = this.hooks.mediaRange()) {
		if (this.hooks.mediaEnabled()) for (let [t, n] of this.hooks.slots()) {
			let r = this.hooks.rangeContains(e, t);
			r !== n.mediaInteractive && (r ? (n.mediaInteractive = !0, this.settleInteractive(t, n, this.hooks.width(), this.hooks.dpr(), this.hooks.scale(), this.hooks.epoch())) : (n.mediaInteractive = !1, n.presentationGeneration++, n.presentationHandle?.destroy(), n.presentationHandle = null));
		}
	}
	settleInteractive(e, t, n, r, i, a) {
		let o = this.hooks.presentation();
		if (!o) return;
		let s = ++t.presentationGeneration, c = document.createElement("canvas");
		c.style.cssText = "display:block;background:#fff;";
		let l = this.hooks.shadow();
		l !== !1 && (c.style.boxShadow = l);
		let u = [], d = this.hooks.textSelection() && !!t.textLayer, f = d || this.hooks.findActive();
		o.presentSlide(c, e, {
			width: n,
			dpr: r,
			onTextRun: f ? (e) => u.push(e) : void 0,
			onError: (e) => {
				s === t.presentationGeneration && this.hooks.reportError(e);
			}
		}).then((r) => {
			if (!this.isCurrent(e, t, s, a)) {
				r.destroy();
				return;
			}
			let o = t.canvas, l = t.presentationHandle;
			t.dispatcher.destroy(), t.wrapper.insertBefore(c, o), o.remove(), t.canvas = c, t.dispatcher = new N(c, !1), t.presentationHandle = r, t.renderedScale = i, l?.destroy(), t.textLayer && (this.hooks.clearTextPreview(t.textLayer), d && L(t.textLayer, u, Math.round(n), Math.round(this.hooks.height()), this.hooks.hyperlinkHandler(), e)), f && this.hooks.refreshFindRuns(e, u), this.hooks.commitComments(e, t), this.hooks.redrawHighlights(e, t);
		}).catch((e) => {
			s === t.presentationGeneration && this.hooks.reportError(e);
		});
	}
	isCurrent(e, t, n, r) {
		return n === t.presentationGeneration && t.mediaInteractive && r === this.hooks.epoch() && this.hooks.slots().get(e) === t && t.renderedSlide === e;
	}
	destroy() {
		for (let e of this.hooks.slots().values()) e.presentationGeneration++, e.presentationHandle?.destroy(), e.presentationHandle = null, e.mediaInteractive = !1;
	}
}, bn = class {
	hooks;
	generation = 0;
	layoutWaiters = /* @__PURE__ */ new Set();
	layoutFailed = !1;
	constructor(e) {
		this.hooks = e;
	}
	resetLayout() {
		this.layoutFailed = !1, this.wake();
	}
	failLayout() {
		this.layoutFailed = !0, this.wake();
	}
	wake() {
		for (let e of this.layoutWaiters) e();
		this.layoutWaiters.clear();
	}
	begin() {
		let e = ++this.generation;
		return this.wake(), e;
	}
	async waitForSlideMetadata(e, t, n) {
		return await this.hooks.ownBackground(async () => {
			for (; !this.hooks.destroyed() && n === this.generation && e === this.hooks.presentation() && t >= e.availableSlideCount && !e.layoutComplete && !this.layoutFailed;) await new Promise((e) => this.layoutWaiters.add(e));
			return this.hooks.destroyed() || e !== this.hooks.presentation() || ((e.layoutComplete || this.layoutFailed) && await e.waitUntilLayoutComplete?.(), n !== this.generation) ? !1 : t < e.availableSlideCount;
		});
	}
	async resolveBounds(e, t) {
		let n = this.hooks.presentation();
		if (!n) return;
		let r = (t.anchors ?? []).flatMap((e) => (e.type === "drawingElement" || e.type === "textRange") && e.elementId ? [e.elementId] : []);
		if (r.length === 0) return;
		let i = new Map((this.hooks.slots().get(e)?.commentElementBounds ?? []).map((e) => [e.elementId, e.bounds])), a = r.flatMap((e) => {
			let t = i.get(e);
			return t ? [t] : [];
		})[0];
		if (a) return a;
		let o = await n.getElementBoundsByIds(e, r);
		return r.flatMap((e) => {
			let t = o.find((t) => t.elementId === e);
			return t ? [t.bounds] : [];
		})[0];
	}
	scrollToTarget(e, t, n, r) {
		if (!this.hooks.presentation()) return !1;
		let i = this.hooks.slots().get(e), a = new Map((i?.commentElementBounds ?? []).map((e) => [e.elementId, e.bounds])), o = r ?? (t.anchors ?? []).flatMap((e) => {
			if (e.type !== "drawingElement" && e.type !== "textRange" || !e.elementId) return [];
			let t = a.get(e.elementId);
			return t ? [t] : [];
		})[0], s = t.anchors ?? [], c = Number.isFinite(t.x) && Number.isFinite(t.y) && (s.length === 0 || s.some((e) => e.type === "slide"));
		if (!o && !c) return !1;
		let l = o ? o.x + (c ? t.x : o.width) : t.x, u = o ? o.y + (c ? t.y : 0) : t.y, d = l / h * this.hooks.scale(), f = u / h * this.hooks.scale();
		return this.hooks.scrollPoint(e, d, f, n), !0;
	}
	async goToComment(e, t, n) {
		if (this.hooks.destroyed()) throw Error("PptxScrollViewer is destroyed");
		let r = this.hooks.presentation();
		if (!r || !Number.isInteger(e) || !Number.isInteger(t) || e < 0 || e >= r.slideCount || t < 0) return !1;
		let i = this.begin();
		if (e >= r.availableSlideCount && !r.layoutComplete && !await this.waitForSlideMetadata(r, e, i)) return !1;
		if (this.hooks.destroyed()) throw Error("PptxScrollViewer is destroyed");
		if (i !== this.generation || r !== this.hooks.presentation()) return !1;
		let a = r.getComments(e)[t];
		if (!a) return !1;
		let o = await this.resolveBounds(e, a);
		if (this.hooks.destroyed()) throw Error("PptxScrollViewer is destroyed");
		if (i !== this.generation || r !== this.hooks.presentation()) return !1;
		let s = a.anchors ?? [], c = Number.isFinite(a.x) && Number.isFinite(a.y) && (s.length === 0 || s.some((e) => e.type === "slide"));
		return !o && !c || (this.hooks.scrollToSlide(e, n), !this.scrollToTarget(e, a, n, o)) ? !1 : (this.hooks.select($(a, t, e), e), !0);
	}
	destroy() {
		this.begin();
	}
}, xn = 12, Sn;
function Cn() {
	return Sn ??= import("./comment-ui-runtime-CV0I9faV.js");
}
var wn = 440, Tn = 20, En = Symbol("PptxScrollViewer.borrowedPresentation"), Dn = class e {
	_presentationOwner;
	get _pres() {
		return this._presentationOwner.current;
	}
	_borrowed;
	_opts;
	_errorRouter;
	_container;
	_shell;
	get _wrapper() {
		return this._shell.wrapper;
	}
	get _scrollHost() {
		return this._shell.scrollHost;
	}
	get _spacer() {
		return this._shell.spacer;
	}
	_mode;
	_viewport = new xe({
		options: () => this._opts,
		container: () => this._container,
		scrollHost: () => this._scrollHost
	});
	_zoom = new Me({
		scrollHost: () => this._scrollHost,
		spacer: () => this._spacer,
		count: () => this._pres?.slideCount ?? 0,
		zoomMin: () => this._opts.zoomMin ?? .1,
		zoomMax: () => this._opts.zoomMax ?? 4,
		baseScale: () => this._baseScale(),
		fitWidthPx: () => this._viewport.fitWidth(),
		fitContentSize: () => this._pres ? {
			width: this._pres.slideWidth / h,
			height: this._pres.slideHeight / h
		} : null,
		indexAt: (e) => this._slideIndexAtOffset(e),
		offset: (e) => this._slideOffset(e),
		height: () => this._uniformSlideHeight,
		totalHeight: () => this._rangeAt(0, this._viewport.overscan()).totalHeight,
		recomputeHeights: () => this._recomputeHeights(),
		syncSpacerWidth: () => this._syncSpacerWidth(),
		padLeft: () => this._viewport.horizontalPadding().left,
		invalidateRender: () => {
			this._renderEpoch++;
		},
		preview: () => this._previewVisible(),
		scheduleSettle: () => this._scheduleSettle(),
		onScaleChange: (e) => this._opts.onScaleChange?.(e),
		relayout: () => this.relayout(),
		mountVisible: () => this._mountVisible(),
		refitOnResize: () => this._opts.refitOnResize !== !1
	});
	get _scale() {
		return this._zoom.scale;
	}
	get _scaleEstablished() {
		return this._zoom.established;
	}
	_scroller = new Se({
		spacer: () => this._spacer,
		count: () => this._pres?.slideCount ?? 0,
		range: () => this._range(),
		createSlot: () => this._createSlot(),
		attachSlot: (e) => this._scrollHost.appendChild(e.wrapper),
		resetSlot: (e, t) => this._resetSlot(e, t),
		positionSlot: (e, t, n) => this._positionSlot(t, e, n),
		renderSlot: (e, t, n) => this._renderSlot(e, t, this._opts.enableMediaPlayback === !0 && this._rangeContains(this._mediaRange(), e), n),
		previewSlot: (e, t, n) => this._previewSlot(t, e, n),
		settleSlot: (e, t) => this._settleSlot(e, t),
		renderedScale: (e) => e.renderedScale,
		scale: () => this._scale,
		syncSpacerWidth: () => this._syncSpacerWidth(),
		onRange: (e) => this._emitVisibleSlideChange(e),
		onNewSlot: (e, t) => this._redrawSlotComments(e, t),
		afterMount: () => {
			this._opts.enableMediaPlayback && this._media.sync();
		},
		awaitInitialRender: (e) => e < this.availableSlideCount,
		shouldSettle: (e) => !this._opts.enableMediaPlayback || this._rangeContains(this._mediaRange(), e)
	});
	_slots = this._scroller.slots;
	_layout = new vn({
		current: () => this._pres,
		destroyed: () => this._destroyed,
		report: (e) => this._reportRenderError(e),
		reportBackground: (e) => this._errorRouter.reportBackground(e, this._opts.onLayoutComplete !== void 0),
		wakeComments: () => this._commentNavigation.wake(),
		resetComments: () => this._commentNavigation.resetLayout(),
		failComments: () => this._commentNavigation.failLayout(),
		scanComments: (e) => this._scanAvailableComments(e, !0),
		renderAvailable: (e) => {
			let t = this._opts.enableMediaPlayback ? this._mediaRange() : null;
			for (let [n, r] of this._slots) n >= e.availableSlideCount || r.renderedSlide === n || this._renderSlot(n, r, !!t && this._rangeContains(t, n));
		},
		emitVisible: () => {
			this._scroller.lastRange && this._emitVisibleSlideChange(this._scroller.lastRange);
		}
	});
	_renderHooks = {
		slots: () => this._slots,
		epoch: () => this._renderEpoch,
		scale: () => this._scale,
		slotIndex: (e) => e.renderedSlide,
		token: (e) => e.renderGeneration,
		nextToken: (e) => ++e.renderGeneration,
		wantRuns: (e) => !!(this._opts.enableTextSelection && e.textLayer) || this._findActive,
		reportError: (e) => this._reportRenderError(e)
	};
	_bitmap = new we({
		...this._renderHooks,
		inFlight: () => this._scroller.inFlight,
		destroyed: () => this._destroyed,
		width: () => this._slideWidthPx(),
		dpr: () => this._viewport.dpr(),
		canRetry: (e) => !(this._opts.enableMediaPlayback && e.mediaInteractive),
		render: (e, t, n, r, i) => Q(this._pres, t, e, "worker", {
			width: n,
			dpr: r,
			imageResources: this._opts.imageResources,
			onTextRun: i
		}),
		commitBitmap: (e, t, n, r, i, a) => {
			let o = {
				cssWidth: Math.round(a),
				cssHeight: Math.round(this._slideHeightPx())
			};
			return this._opts.enableMediaPlayback ? n.commitBitmapTo2d(r, i, o) : n.commitBitmap(r, i, o);
		},
		commitRuns: (e, t, n, r, i) => this._commitRenderedRuns(e, t, n, r, i, !0)
	});
	_main = new Te({
		...this._renderHooks,
		render: (e, t, n, r, i, a) => Q(this._pres, t, e, "main", {
			width: n,
			dpr: r,
			...a ? {} : { imageResources: this._opts.imageResources },
			onTextRun: i
		}),
		commitRuns: (e, t, n, r, i, a, o) => this._commitRenderedRuns(e, t, n, i, a, o),
		shadow: () => this._pageShadow
	});
	_media = new yn({
		presentation: () => this._pres,
		slots: () => this._slots,
		epoch: () => this._renderEpoch,
		scale: () => this._scale,
		dpr: () => this._viewport.dpr(),
		width: () => this._slideWidthPx(),
		height: () => this._slideHeightPx(),
		imageResources: () => this._opts.imageResources,
		textSelection: () => this._opts.enableTextSelection === !0,
		findActive: () => this._findActive,
		mediaEnabled: () => this._opts.enableMediaPlayback === !0,
		mediaRange: () => this._mediaRange(),
		rangeContains: (e, t) => this._rangeContains(e, t),
		shadow: () => this._pageShadow,
		hyperlinkHandler: () => this._hyperlinkHandler(),
		refreshFindRuns: (e, t) => this._highlights.refreshRuns(e, t),
		redrawHighlights: (e, t) => this._highlights.redrawSlot(e, t),
		commitComments: (e, t) => this._commitSlotComments(e, t),
		clearTextPreview: (e) => this._clearTextLayerPreview(e),
		reportError: (e) => this._reportRenderError(e)
	});
	_commentNavigation = new bn({
		presentation: () => this._pres,
		destroyed: () => this._destroyed,
		slots: () => this._slots,
		scale: () => this._scale,
		scrollPoint: (e, t, n, r) => this._navigation.scrollToPoint(e, t, n, r),
		scrollToSlide: (e, t) => this.scrollToSlide(e, t),
		select: (e, t) => {
			this._activeCommentId = e, this._activeCommentSlide = t, this._selection.clearElementContext();
			for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
			this._selection.emitChange();
		},
		ownBackground: (e) => this._errorRouter.ownBackgroundLifecycle(e)
	});
	_navigation = new De({
		host: () => this._scrollHost,
		spacer: () => this._spacer,
		count: () => this.slideCount,
		established: () => this._scaleEstablished,
		offset: (e) => this._slideOffset(e),
		height: () => this._uniformSlideHeight,
		indexAt: (e) => this._slideIndexAtOffset(e),
		totalHeight: () => this._rangeAt(0, this._viewport.overscan()).totalHeight,
		width: () => this._slideWidthPx(),
		padLeft: () => this._viewport.horizontalPadding().left,
		marginOrigin: () => this._commentMargin.originPx,
		mount: () => this._mountVisible()
	});
	_selection = new ke({
		wrapper: () => this._wrapper,
		scrollHost: () => this._scrollHost,
		slots: () => this._slots,
		resource: () => this._pres,
		destroyed: () => this._destroyed,
		textSelectionEnabled: () => this._opts.enableTextSelection === !0,
		elementSelectionEnabled: () => this._opts.enableElementSelection === !0,
		textSelected: () => Z(this._wrapper, this._wrapper.ownerDocument?.getSelection?.() ?? null) !== null,
		getContext: () => this.getSelectionContext(),
		hitTest: (e, t, n, r, i) => e.getElementContextAt(t, {
			x: n * e.slideWidth,
			y: r * e.slideHeight
		}, {
			tolerance: this._elementHitTolerance / i * e.slideWidth,
			maxTextCharacters: q
		}),
		outline: (e, t, n) => n.slideIndex === t ? {
			x: n.bounds.x / e.slideWidth,
			y: n.bounds.y / e.slideHeight,
			width: n.bounds.width / e.slideWidth,
			height: n.bounds.height / e.slideHeight,
			rotation: n.bounds.rotation
		} : null,
		onChange: (e) => this._opts.onSelectionContextChange?.(e),
		onContextMenu: (e, t) => this._opts.onContextMenu?.({
			originalEvent: e,
			getContext: t
		}),
		reportError: (e) => this._reportRenderError(e)
	});
	_uniformSlideHeight = 0;
	_visibleEvents = new Ae((e, t, n) => this._opts.onVisibleSlideChange?.(e, t, n));
	_loader = new ye({
		name: () => "PptxScrollViewer",
		borrowed: () => this._borrowed,
		borrowedMessage: () => "PptxScrollViewer.load() is unsupported on a Viewer created by fromPresentation(); the borrowed presentation is already loaded.",
		destroyed: () => this._destroyed,
		owner: () => this._presentationOwner,
		acquire: (e) => X.load(e, {
			password: this._opts.password,
			useGoogleFonts: this._opts.useGoogleFonts,
			cjkFallback: this._opts.cjkFallback,
			maxZipEntryBytes: this._opts.maxZipEntryBytes,
			resourceLimits: this._opts.resourceLimits,
			debug: this._opts.debug,
			onResourceMetrics: this._opts.onResourceMetrics,
			workerTimeoutMs: this._opts.workerTimeoutMs,
			wasmUrl: this._opts.wasmUrl,
			math: this._opts.math,
			threeD: this._opts.threeD,
			regionMap: this._opts.regionMap,
			chartEx: this._opts.chartEx,
			tiff: this._opts.tiff,
			mode: this._mode,
			...this._opts.legacyPpt === void 0 ? void 0 : { legacyPpt: this._opts.legacyPpt },
			progressiveLayout: this._opts.progressiveLayout,
			onLayoutProgress: this._opts.onLayoutProgress,
			onLayoutPartial: this._opts.onLayoutPartial,
			onLayoutComplete: this._opts.onLayoutComplete
		}),
		beforeReplace: (e) => {
			if (this._selection.invalidateElementContext(!1), this._invalidateFind(), this._findActive = !1, this._activeCommentId = null, this._activeCommentSlide = null, this._hasComments = !1, this._commentScanFrontier = 0, this._commentNavigation.begin(), this._layout.unbind(), e) {
				for (let [e, t] of [...this._slots]) this._recycleSlot(e, t);
				this._visibleEvents.resetIndex();
			}
		},
		afterReplace: (e) => {
			this._invalidateFind(), this._findActive = !1, this._activeCommentId = null, this._activeCommentSlide = null, this._hasComments = !1, this._commentScanFrontier = 0, this._scanAvailableComments(e, !1), this._layout.bind(e);
		},
		mountOpeningWindow: async () => {
			let e = [];
			this._relayout(e), await Promise.all(e);
		},
		selectionChanged: () => this._selection.emitChange()
	});
	_activeCommentId = null;
	_activeCommentSlide = null;
	_commentUi = null;
	_hasComments = !1;
	_commentMargin = new Ee({
		container: () => this._container,
		scrollHost: () => this._scrollHost,
		spacer: () => this._spacer,
		enabled: () => this._commentsEnabled(),
		cards: () => this._commentsOptions()?.cards !== !1,
		hasDisplayableComments: () => this._hasComments,
		requestedSide: () => this._commentsOptions()?.side,
		zoom: () => this._scaleEstablished ? this._scale : 1,
		gapPx: xn,
		widthPx: wn,
		fontSizePx: Tn
	});
	_layers = new Pe({
		markerLayer: (e) => e.commentMarkerLayer,
		syncMargin: (e) => this._commentMargin.syncMargin(e),
		marginSide: () => this._commentMargin.side(),
		marginExtent: () => this._commentMargin.extent(),
		commentsEnabled: () => this._commentsEnabled(),
		previewMargin: (e, t) => this._commentUi?.previewReadOnlyCommentMargin(e, t),
		disposeMargin: (e) => {
			this._commentUi?.disposeReadOnlyCommentMargin(e), this._commentUi || e.replaceChildren();
		},
		disposeDecoration: (e) => {
			this._commentUi?.disposeReadOnlyCommentDecoration(e), this._commentUi || e.replaceChildren();
		},
		redrawOutline: (e, t) => this._selection.redrawOutlineForSlot(e, t),
		markerRatio: (e) => Math.round(e * 1e6) / 1e6,
		resetMarkerTransform: () => !1,
		resetDecorationVisibility: () => !0
	});
	_commentOverlay = new Ne({
		slots: () => this._slots,
		scale: () => this._scale,
		destroyed: () => this._destroyed,
		ownerWindow: () => this._wrapper.ownerDocument.defaultView,
		width: () => this._slideWidthPx(),
		height: () => this._slideHeightPx(),
		side: () => this._commentMargin.side(),
		marginExtent: () => this._commentMargin.extent(),
		connectorOptions: () => this._commentsOptions()?.connectors,
		runtime: () => this._commentUi,
		redrawComments: (e, t) => this._redrawSlotComments(e, t)
	});
	_commentScanFrontier = 0;
	_elementHitTolerance;
	_destroyed = !1;
	get _renderEpoch() {
		return this._scroller.renderEpoch;
	}
	set _renderEpoch(e) {
		this._scroller.renderEpoch = e;
	}
	_pageShadow;
	_find = new mt(() => this.slideCount, (e) => this._collectSlideRuns(e));
	_findGeneration = 0;
	_findActive = !1;
	_highlights = new ve({
		slots: () => this._slots,
		active: () => this._findActive,
		runs: (e) => this._find.slideRuns(e),
		setRuns: (e, t) => this._find.setSlideRuns(e, t),
		paint: (e, t, n, r) => R(t.highlightLayer, n, this._find.slideHighlights(e), this._slideWidthPx(), this._slideHeightPx(), r, this._opts.findHighlightColors),
		reveal: (e) => this.scrollToSlide(e),
		unitOf: (e) => e.slide
	});
	static fromPresentation(t, n, r = {}) {
		return new e(t, {
			...r,
			[En]: n
		});
	}
	constructor(e, t = {}) {
		if (e.tagName === "CANVAS") throw Error("PptxScrollViewer takes a container element (e.g. a <div>), not a <canvas> — the viewer creates and manages its own canvases. Pass a block container; for the single-slide canvas API use PptxViewer.");
		this._container = e, this._opts = t, this._errorRouter = new qe("PptxScrollViewer", t.onError);
		let n = t.elementHitTolerance ?? 6;
		if (!Number.isFinite(n) || n < 0) throw RangeError("elementHitTolerance must be a finite non-negative number.");
		this._elementHitTolerance = n, this._pageShadow = t.pageShadow ?? "0 1px 3px rgba(0,0,0,0.2)";
		let r = t[En];
		this._borrowed = r !== void 0, r ? (this._presentationOwner = new P("PptxScrollViewer", r, !1), this._mode = F("PptxScrollViewer", t.mode, r), this._scanAvailableComments(r, !1)) : (this._presentationOwner = new P("PptxScrollViewer"), this._mode = F("PptxScrollViewer", t.mode, void 0)), this._shell = new Fe(e, {
			background: t.background,
			comments: !!t.comments,
			onScroll: () => this._onScroll(),
			onOutsideComment: () => {
				if (this._activeCommentId !== null) {
					this._activeCommentId = null, this._activeCommentSlide = null;
					for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
					this._selection.emitChange();
				}
			}
		}), this._commentsEnabled() && Cn().then((e) => {
			if (!this._destroyed) {
				this._commentUi = e;
				for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
			}
		}).catch((e) => this._reportRenderError(e)), this._selection.bind(!!t.onSelectionContextChange, !!t.onContextMenu), this._zoom.bind(this._container, this._scrollHost, this._opts.enableZoom !== !1), this._borrowed && (this._layout.bind(r), this.relayout());
	}
	async load(e) {
		await this._loader.load(e);
	}
	get slideCount() {
		return this._pres?.slideCount ?? 0;
	}
	get availableSlideCount() {
		return this._pres?.availableSlideCount ?? this.slideCount;
	}
	get layoutComplete() {
		return this._pres?.layoutComplete ?? !0;
	}
	async waitUntilLayoutComplete() {
		await this._errorRouter.ownBackgroundLifecycle(async () => {
			await this._pres?.waitUntilLayoutComplete?.();
		});
	}
	_slideWidthPx() {
		return this._pres.slideWidth / h * this._scale;
	}
	_slideHeightPx() {
		return this._pres.slideHeight / h * this._scale;
	}
	_commentsEnabled() {
		return this._opts.comments === !0 || typeof this._opts.comments == "object";
	}
	_commentsOptions() {
		return typeof this._opts.comments == "object" ? this._opts.comments : void 0;
	}
	_scanAvailableComments(e, t) {
		if (!this._commentsEnabled() || this._hasComments) return;
		let n = this._commentsOptions()?.includeResolved === !0, r = Math.min(e.availableSlideCount, e.slideCount);
		for (let i = this._commentScanFrontier; i < r; i++) if (e.getComments(i).some((e) => n || e.status !== "resolved" && e.status !== "closed")) {
			this._commentScanFrontier = r, this._hasComments = !0, t && this._refreshDiscoveredComments();
			return;
		}
		this._commentScanFrontier = Math.max(this._commentScanFrontier, r);
	}
	_refreshDiscoveredComments() {
		this._syncSpacerWidth();
		for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
	}
	_baseScale() {
		if (!this._pres || this._pres.slideCount === 0) return 0;
		let e = this._viewport.fitWidth(), t = this._pres.slideWidth / h;
		return e <= 0 || t <= 0 ? 0 : e / t;
	}
	relayout() {
		this._relayout();
	}
	_relayout(e) {
		this._pres && (!this._scaleEstablished && !this._zoom.establishBase() || (this._recomputeHeights(), this._syncSpacer(), this._mountVisible(e)));
	}
	_recomputeHeights() {
		this._uniformSlideHeight = this._slideHeightPx();
	}
	_mediaOverscan() {
		return this._opts.mediaOverscan ?? 1;
	}
	_slideOffset(e) {
		return this._viewport.verticalPadding().leading + e * (this._uniformSlideHeight + this._viewport.gap());
	}
	_slideIndexAtOffset(e) {
		return ge(this._pres?.slideCount ?? 0, this._uniformSlideHeight, this._viewport.gap(), e, 0, 0, this._viewport.verticalPadding()).topIndex;
	}
	_rangeAt(e, t) {
		return ge(this._pres?.slideCount ?? 0, this._uniformSlideHeight, this._viewport.gap(), e, this._scrollHost.clientHeight, t, this._viewport.verticalPadding());
	}
	_range() {
		return this._rangeAt(this._scrollHost.scrollTop, this._viewport.overscan());
	}
	_mediaRange() {
		return this._rangeAt(this._scrollHost.scrollTop, this._mediaOverscan());
	}
	_rangeContains(e, t) {
		return t >= e.start && t <= e.end;
	}
	_syncSpacer() {
		this._scroller.syncSpacer();
	}
	_syncSpacerWidth() {
		let { left: e, right: t } = this._viewport.horizontalPadding();
		this._commentMargin.syncSpacerWidth(this._slideWidthPx(), e, t);
	}
	_onScroll() {
		!this._pres || !this._scaleEstablished || this._mountVisible(void 0, !1);
	}
	_mountVisible(e, t = !0) {
		this._scroller.mount(e, t);
	}
	_createSlot() {
		let { wrapper: e, canvas: t, textLayer: n, highlightLayer: r } = Oe(this._scrollHost, this._opts.enableTextSelection === !0, this._pageShadow), i = mn(e), { markerLayer: a, margin: o, decorationLayer: s } = je(e, this._commentsEnabled(), this._commentsOptions()?.cards !== !1, this._commentsOptions()?.connectors !== void 0, (e) => this._commentMargin.syncMargin(e)), c = Qe(e, this._opts.enableElementSelection === !0);
		return this._scrollHost.appendChild(e), {
			wrapper: e,
			canvas: t,
			textLayer: n,
			highlightLayer: r,
			elementLayer: c,
			loadingIndicator: i,
			commentMarkerLayer: a,
			commentMargin: o,
			commentDecorationLayer: s,
			commentElementBounds: Object.freeze([]),
			commentGeometry: null,
			commentAnchorSlide: -1,
			commentAnchorGeneration: 0,
			renderedSlide: -1,
			renderedScale: -1,
			dispatcher: new N(t, this._mode === "worker" && !this._opts.enableMediaPlayback),
			presentationHandle: null,
			mediaInteractive: !1,
			renderGeneration: 0,
			presentationGeneration: 0
		};
	}
	_recycleSlot(e, t) {
		this._scroller.recycleSlot(e, t);
	}
	_resetSlot(e, t) {
		t.renderGeneration++, t.presentationGeneration++, t.presentationHandle?.destroy(), t.presentationHandle = null, t.mediaInteractive = !1, t.dispatcher.destroy(), this._destroyed || (t.dispatcher = new N(t.canvas, this._mode === "worker" && !this._opts.enableMediaPlayback)), this._layers.reset(t), t.loadingIndicator.setLoading(!1), t.commentElementBounds = Object.freeze([]), t.commentGeometry = null, t.commentAnchorSlide = -1, t.commentAnchorGeneration++, t.canvas.style.height = "", t.renderedSlide = -1, t.renderedScale = -1, t.wrapper.remove();
	}
	_positionSlot(e, t, n) {
		e.wrapper.dataset.slideIndex = String(t), this._layers.position(t, e, this._slideOffset(t), this._slideWidthPx(), this._slideHeightPx(), this._scrollHost.clientWidth, this._viewport.horizontalPadding().left);
	}
	_renderSlot(e, t, n = !1, r = !0) {
		if (!this._pres || t.renderedSlide === e) return null;
		if (e >= this.availableSlideCount && !this.layoutComplete) return t.renderedSlide = -1, t.mediaInteractive = !1, t.loadingIndicator.setLoading(!0), null;
		t.renderedSlide = e;
		let i = ++t.renderGeneration;
		t.loadingIndicator.setLoading(e >= this.availableSlideCount && !this.layoutComplete);
		let a = this._viewport.dpr(), o = this._slideWidthPx(), s = this._renderEpoch, c = this._scale, l = t.dispatcher, u = l.begin();
		return this._opts.enableMediaPlayback && n ? (t.mediaInteractive = !0, this._trackSlotLoading(e, t, i, this._media.renderInteractive(e, t, o, a, c, s, r))) : (t.mediaInteractive = !1, this._mode === "worker" ? this._trackSlotLoading(e, t, i, this._renderSlotBitmap(e, t, o, a, c, i, l, u, r)) : this._trackSlotLoading(e, t, i, this._main.render(e, t, o, a, i, l, u, r)));
	}
	async _trackSlotLoading(e, t, n, r) {
		try {
			await r;
		} finally {
			n === t.renderGeneration && this._slots.get(e) === t && t.renderedSlide === e && t.loadingIndicator.setLoading(!1);
		}
	}
	_emitVisibleSlideChange(e) {
		this._pres && this._visibleEvents.publish(e, this._pres.slideCount, this.layoutComplete);
	}
	_reportRenderError(e) {
		this._errorRouter.report(e);
	}
	_commitRenderedRuns(e, t, n, r, i, a) {
		t.textLayer && (a && this._clearTextLayerPreview(t.textLayer), this._opts.enableTextSelection && L(t.textLayer, n, Math.round(r), Math.round(this._slideHeightPx()), this._hyperlinkHandler(), e)), i && this._highlights.refreshRuns(e, n), this._commitSlotComments(e, t), this._highlights.redrawSlot(e, t);
	}
	_renderSlotBitmap(e, t, n, r, i, a = ++t.renderGeneration, o = t.dispatcher, s = o.begin(), c = !0) {
		return this._bitmap.render(e, t, n, r, i, a, o, s, c);
	}
	setScale(e) {
		this._zoom.setScale(e);
	}
	getScale() {
		return this._zoom.getScale();
	}
	zoomIn() {
		this._zoom.zoomIn();
	}
	zoomOut() {
		this._zoom.zoomOut();
	}
	fitWidth() {
		this._zoom.fit("width");
	}
	fitPage() {
		this._zoom.fit("page");
	}
	_previewVisible() {
		this._scroller.preview();
	}
	_previewSlot(e, t, n) {
		this._positionSlot(e, t, n), this._layers.preview(e, this._slideWidthPx(), this._slideHeightPx(), this._scale);
	}
	_clearTextLayerPreview(e) {
		Ce(e);
	}
	_scheduleSettle() {
		this._scroller.scheduleSettle(150);
	}
	_settleSlot(e, t) {
		if (!this._pres) return;
		let n = this._viewport.dpr(), r = this._slideWidthPx(), i = this._scale, a = this._renderEpoch;
		if (this._opts.enableMediaPlayback && t.mediaInteractive) {
			this._media.settleInteractive(e, t, r, n, i, a);
			return;
		}
		if (!this._opts.enableMediaPlayback) {
			if (this._mode === "worker") {
				this._renderSlotBitmap(e, t, r, n, i);
				return;
			}
			this._main.settle(e, t, r, n);
		}
	}
	scrollToSlide(e, t) {
		this._navigation.scrollToUnit(e, t);
	}
	async goToComment(e, t, n) {
		return this._commentNavigation.goToComment(e, t, n);
	}
	async findText(e, t = {}) {
		let n = this._pres;
		if (!n) return [];
		let r = ++this._findGeneration;
		if (this._findActive = e.length > 0, e.length === 0) return this._find.invalidate(), this._highlights.redrawAll(), [];
		if (n.layoutComplete || await this._errorRouter.ownBackgroundLifecycle(() => n.waitUntilLayoutComplete()), this._destroyed || r !== this._findGeneration || n !== this._pres) return [];
		let i = await this._errorRouter.ownAwaitable(() => this._find.find(e, t));
		return this._destroyed || r !== this._findGeneration || n !== this._pres ? [] : (this._highlights.redrawAll(), i);
	}
	async findNext() {
		return this._highlights.activate(this._find.next());
	}
	async findPrev() {
		return this._highlights.activate(this._find.prev());
	}
	clearFind() {
		this._findActive = !1, this._invalidateFind(), this._highlights.redrawAll();
	}
	_invalidateFind() {
		this._findGeneration++, this._find.invalidate();
	}
	async _collectSlideRuns(e) {
		return this._pres ? this._pres.collectSlideRuns(e, this._slideWidthPx()) : [];
	}
	_redrawSlotComments(e, t) {
		if (!this._pres || !t.commentMarkerLayer) return;
		this._commentMargin.syncMargin(t.commentMargin);
		let n = this._commentUi;
		if (!n) {
			t.commentMarkerLayer.replaceChildren(), t.commentMargin?.replaceChildren(), t.commentDecorationLayer?.replaceChildren(), t.commentGeometry = null;
			return;
		}
		t.commentGeometry = n.buildPptxCommentMargin(t.commentMarkerLayer, t.commentMargin, this._pres.getComments(e), t.commentElementBounds, e, this._pres.slideWidth, this._pres.slideHeight, this._activeCommentId, (t, n) => {
			let r = n ? t : this._activeCommentId === t ? null : this._activeCommentId;
			if (r !== this._activeCommentId) {
				this._activeCommentId = r, this._activeCommentSlide = r ? e : null, this._selection.clearElementContext();
				for (let [e, t] of this._slots) this._redrawSlotComments(e, t);
				this._selection.emitChange();
			}
		}, this._commentMargin.zoom(), wn, this._commentsOptions()?.markers !== !1, this._commentsOptions()?.includeResolved === !0, t.commentDecorationLayer ? () => this._commentOverlay.schedule(e, t, !1) : void 0, t.commentDecorationLayer ? () => this._commentOverlay.schedule(e, t, !0) : void 0), this._commentOverlay.drawConnectors(e, t);
	}
	_commitSlotComments(e, t) {
		this._ensureSlotCommentAnchors(e, t), this._redrawSlotComments(e, t), t.commentMarkerLayer && (t.commentMarkerLayer.style.visibility = ""), t.commentMargin && (t.commentMargin.style.visibility = ""), t.commentDecorationLayer && (t.commentDecorationLayer.style.visibility = "");
	}
	_ensureSlotCommentAnchors(e, t) {
		let n = this._pres;
		if (!n || t.commentAnchorSlide === e) return;
		t.commentAnchorSlide = e, t.commentElementBounds = Object.freeze([]);
		let r = [...new Set(n.getComments(e).flatMap((e) => (e.anchors ?? []).flatMap((e) => (e.type === "drawingElement" || e.type === "textRange") && e.elementId ? [e.elementId] : [])))];
		if (r.length === 0) return;
		let i = ++t.commentAnchorGeneration;
		n.getElementBoundsByIds(e, r).then((r) => {
			if (this._destroyed || i !== t.commentAnchorGeneration || n !== this._pres || this._slots.get(e) !== t || t.commentAnchorSlide !== e) return;
			t.commentElementBounds = r, this._redrawSlotComments(e, t);
			let a = n.getComments(e).find((t, n) => $(t, n, e) === this._activeCommentId);
			a && this._commentNavigation.scrollToTarget(e, a);
		}).catch((e) => {
			!this._destroyed && i === t.commentAnchorGeneration && this._reportRenderError(e);
		});
	}
	_hyperlinkHandler() {
		if (this._opts.enableHyperlinks !== !1) return (e) => this._onHyperlinkClick(e);
	}
	_onHyperlinkClick(e) {
		let t = this._resolveInternalSlideIndex(e);
		if (this._opts.onHyperlinkClick) {
			this._opts.onHyperlinkClick(t);
			return;
		}
		if (t.kind === "external") {
			D(t.url);
			return;
		}
		t.slideIndex !== void 0 && this.scrollToSlide(t.slideIndex);
	}
	_resolveInternalSlideIndex(e) {
		if (e.kind !== "internal" || e.slideIndex !== void 0) return e;
		let t = this._pres?.resolveInternalTarget(e.ref, this._range().topIndex);
		return t === void 0 ? e : {
			...e,
			slideIndex: t
		};
	}
	get topVisibleSlide() {
		return this._scroller.lastRange?.topIndex ?? 0;
	}
	async getResourceMetrics() {
		if (!this._pres) throw Error("Presentation not loaded");
		return await this._pres.getResourceMetrics();
	}
	getSelectionContext(e = {}) {
		if (this._destroyed) throw Error("PptxScrollViewer is destroyed");
		if (this._pres && this._activeCommentId !== null && this._activeCommentSlide !== null) {
			let t = this._pres.getComments(this._activeCommentSlide), n = t.findIndex((e, t) => $(e, t, this._activeCommentSlide) === this._activeCommentId), r = t[n];
			if (r && n >= 0) return fn(r, this._activeCommentSlide, n, this._activeCommentId, e);
		}
		return (this._opts.enableTextSelection ? Z(this._wrapper, this._wrapper.ownerDocument?.getSelection?.() ?? null, e) : null) ?? (this._selection.elementContext ? on(this._selection.elementContext, e.maxTextCharacters) : null);
	}
	destroy() {
		this._destroyed || (this._destroyed = !0, this._commentNavigation.begin(), this._errorRouter.close(), this._invalidateFind(), this._findActive = !1, this._layout.unbind(), this._selection.destroy(), this._media.destroy(), this._commentNavigation.destroy(), this._highlights.destroy(), this._commentOverlay.destroy(), this._selection.clearElementContext(), this._scroller.destroy(), this._zoom.destroy(), this._commentMargin.destroy(), this._presentationOwner.close(), this._shell.destroy());
	}
}, On = /* @__PURE__ */ e({
	OoxmlDecodedImageLimitError: () => Re,
	OoxmlError: () => m,
	OoxmlResourceLimitError: () => v,
	PptxPresentation: () => X,
	PptxScrollViewer: () => Dn,
	PptxViewer: () => _n,
	TiffDecodeError: () => Be,
	autoResize: () => Ve,
	buildPptxHighlightLayer: () => R,
	buildPptxTextLayer: () => L,
	isOoxmlDecodedImageLimitError: () => M,
	isTiffDecodeError: () => ze,
	openExternalHyperlink: () => D,
	readPptxTextSelectionContext: () => Z,
	renderSlide: () => o
});
export { Z as a, R as c, _n as i, L as l, Dn as n, X as o, $ as r, K as s, On as t };
