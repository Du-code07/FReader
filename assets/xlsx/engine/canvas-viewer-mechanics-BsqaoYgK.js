import { bt as e } from "./bounded-raw-part-cache-B5a6cGKO.js";
import { B as t } from "./renderer-DpTePxGq.js";
import { t as n } from "./abort-JztSoyw2.js";
function r(e, t, n = {}) {
	let r = n.pauseWhenHidden ?? !0, i = null, a = 0, o = 0, s = null, c = !1, l = !1, u = () => {
		if (!l && !(r && typeof document < "u" && document.hidden)) {
			if (s) {
				c = !0;
				return;
			}
			i === null && (i = requestAnimationFrame(d));
		}
	}, d = async () => {
		if (i = null, l) return;
		let t = a, n = o;
		try {
			let r = e(t, n);
			s = r instanceof Promise ? r : Promise.resolve(), await s;
		} catch (e) {
			console.error("[autoResize] render failed:", e);
		} finally {
			s = null, c && !l && (c = !1, u());
		}
	}, f = new ResizeObserver((e) => {
		for (let t of e) {
			let e = t.contentRect;
			a = e.width, o = e.height;
		}
		u();
	});
	f.observe(t);
	let p = () => {
		typeof document < "u" && !document.hidden && u();
	};
	return r && typeof document < "u" && document.addEventListener("visibilitychange", p), () => {
		l = !0, f.disconnect(), i !== null && (cancelAnimationFrame(i), i = null), r && typeof document < "u" && document.removeEventListener("visibilitychange", p);
	};
}
function i() {
	return n("worker request aborted");
}
var a = class {
	_worker;
	_opts;
	_pending = /* @__PURE__ */ new Map();
	_orphaned = /* @__PURE__ */ new Map();
	_nextId = 1;
	_terminated = !1;
	_failure;
	constructor(e, t) {
		this._worker = e, this._opts = t, this._worker.addEventListener("message", this._handle), this._worker.addEventListener("messageerror", this._handleWorkerError), this._worker.addEventListener("error", this._handleWorkerError);
	}
	_handle = (e) => {
		let t = e.data, n = this._opts.correlate(t);
		if (n === void 0) {
			this._opts.onUnsolicited?.(t);
			return;
		}
		let r = this._pending.get(n);
		if (!r) {
			try {
				let e = this._orphaned.get(n);
				e ? (this._orphaned.delete(n), e(t)) : this._opts.onOrphanedResponse?.(t);
			} catch {}
			return;
		}
		this._pending.delete(n), r.cleanup();
		let i = this._opts.toError?.(t);
		i === void 0 ? r.resolve(t) : r.reject(i instanceof Error ? i : Error(i));
	};
	_handleWorkerError = (e) => {
		let t = "message" in e && e.message ? `: ${e.message}` : "", n = e.type === "error" && !t && globalThis.origin === "null" ? ": this page has an opaque origin; a sandboxed iframe without allow-same-origin can block Worker loading" : "";
		this._failure ??= /* @__PURE__ */ Error(`Worker error${t}${n}`), this._rejectAll(this._failure);
	};
	_rejectAll(e) {
		let t = [...this._pending.values()];
		this._pending.clear();
		for (let n of t) n.cleanup(), n.reject(e);
	}
	nextId() {
		return this._nextId++;
	}
	request(e, t, n) {
		let r = this._nextId++, a = n?.timeoutMs === !1 ? void 0 : n?.timeoutMs ?? this._opts.timeoutMs, o = n?.signal, s = (e) => {
			try {
				n?.onCancel?.(r, e);
			} catch {}
		};
		return new Promise((c, l) => {
			if (this._terminated) {
				l(/* @__PURE__ */ Error("Worker terminated"));
				return;
			}
			if (this._failure) {
				l(this._failure);
				return;
			}
			if (o?.aborted) {
				s("abort"), l(i());
				return;
			}
			let u, d;
			this._pending.set(r, {
				resolve: c,
				reject: l,
				cleanup: () => {
					u !== void 0 && (clearTimeout(u), u = void 0), d && o && (o.removeEventListener("abort", d), d = void 0);
				},
				onOrphanedResponse: n?.onOrphanedResponse
			}), a !== void 0 && (u = setTimeout(() => {
				let e = this._pending.get(r);
				e && (this._pending.delete(r), e.onOrphanedResponse && this._orphaned.set(r, e.onOrphanedResponse), e.cleanup(), s("timeout"), e.reject(/* @__PURE__ */ Error(`worker request timed out after ${a}ms`)));
			}, a)), o && (d = () => {
				let e = this._pending.get(r);
				e && (this._pending.delete(r), e.onOrphanedResponse && this._orphaned.set(r, e.onOrphanedResponse), e.cleanup(), s("abort"), e.reject(i()));
			}, o.addEventListener("abort", d));
			try {
				this._worker.postMessage(e(r), t);
			} catch (e) {
				let t = this._pending.get(r);
				if (!t) return;
				this._pending.delete(r), t.cleanup(), t.reject(e instanceof Error ? e : Error(String(e)));
			}
		});
	}
	transport(e) {
		return {
			request: (t, n, r) => this.request(t, n, {
				...r,
				onOrphanedResponse: r?.onOrphanedResponse ? (t) => {
					e(t) && r.onOrphanedResponse?.(t);
				} : void 0
			}).then((t) => {
				if (!e(t)) throw Error("worker response does not match the selected transport");
				return t;
			}),
			forgetOrphaned: (e) => this.forgetOrphaned(e),
			terminate: () => this.terminate()
		};
	}
	post(e, t) {
		this._worker.postMessage(e, t);
	}
	forgetOrphaned(e) {
		for (let t of e) this._orphaned.delete(t);
	}
	get orphanedRequestCount() {
		return this._orphaned.size;
	}
	terminate() {
		this._terminated || (this._terminated = !0, this._worker.removeEventListener("message", this._handle), this._worker.removeEventListener("messageerror", this._handleWorkerError), this._worker.removeEventListener("error", this._handleWorkerError), this._worker.terminate(), this._rejectAll(/* @__PURE__ */ Error("Worker terminated")), this._orphaned.clear());
	}
};
function o(e, t) {
	if (t) try {
		t();
		return;
	} catch {}
	try {
		e.terminate();
	} catch {}
}
function s(e) {
	return !!e && typeof e == "object" && e.kind === "ooxmlDecodeSvg";
}
function c(n, r) {
	return s(r) ? (e(new Blob([r.bytes], { type: "image/svg+xml" }), r).then((e) => {
		try {
			n({
				kind: "ooxmlSvgDecoded",
				decodeId: r.decodeId,
				bitmap: e
			}, [e]);
		} catch {
			t(e);
		}
	}).catch((e) => {
		try {
			n({
				kind: "ooxmlSvgDecodeFailed",
				decodeId: r.decodeId,
				message: e instanceof Error ? e.message : String(e)
			});
		} catch {}
	}), !0) : !1;
}
var l = 1.1, u = 10, d = 3, f = 1;
function p(e, t) {
	let n;
	switch (t) {
		case 1:
			n = e / d;
			break;
		case 2:
			n = e / f;
			break;
		default:
			n = e / u;
			break;
	}
	return Math.max(-1, Math.min(1, n));
}
function m(e, t, n = 0) {
	return e * l ** +-p(t, n);
}
function h(e, t, n, r, i) {
	let a = n > 0 ? r / n : 1, o = (e + t) * a - t, s = i.maxScroll > 0 ? i.maxScroll : 0;
	return o < 0 ? 0 : o > s ? s : o;
}
var g = Object.freeze([
	.25,
	.33,
	.5,
	.67,
	.75,
	.9,
	1,
	1.1,
	1.25,
	1.5,
	1.75,
	2,
	2.5,
	3,
	4
]), _ = .005;
function v(e) {
	for (let t of g) if (t > e + _) return t;
	return g[g.length - 1];
}
function y(e, t = g[0]) {
	for (let t = g.length - 1; t >= 0; t--) {
		let n = g[t];
		if (n < e - _) return n;
	}
	return Math.min(t, g[0]);
}
function b(e, t, n) {
	return e < t ? t : e > n ? n : e;
}
function x(e, t) {
	let { contentWidth: n, contentHeight: r, containerWidth: i, containerHeight: a } = e;
	if (n <= 0 || i <= 0) return 0;
	let o = i / n;
	if (t === "width") return o;
	if (r <= 0 || a <= 0) return 0;
	let s = a / r;
	return Math.min(o, s);
}
function S(e) {
	let t = e.toLowerCase();
	if (t.length === e.length) return t;
	let n = "";
	for (let t of e) {
		let e = t.toLowerCase();
		n += e.length === t.length ? e : t;
	}
	return n;
}
function C(e) {
	let t = Array(e.length), n = 0, r = "";
	for (let i = 0; i < e.length; i++) t[i] = n, r += e[i].text, n += e[i].text.length;
	return {
		text: r,
		folded: S(r),
		runStart: t,
		runCount: e.length
	};
}
function w(e, t) {
	let { runStart: n } = e, r = 0, i = n.length - 1;
	for (; r < i;) {
		let e = r + i + 1 >> 1;
		n[e] <= t ? r = e : i = e - 1;
	}
	return r;
}
function T(e, t, n) {
	let { runStart: r, runCount: i, text: a } = e, o = [], s = w(e, t), c = t;
	for (; c < n && s < i;) {
		let e = s + 1 < i ? r[s + 1] : a.length, t = Math.min(n, e), l = c - r[s], u = t - r[s];
		u > l && o.push({
			runIndex: s,
			start: l,
			end: u
		}), c = t, s++;
	}
	return o;
}
function E(e, t, n = {}) {
	if (t.length === 0) return [];
	let r = n.caseSensitive ?? !1, i = r ? e.text : e.folded, a = r ? t : S(t), o = [], s = 0, c = 0;
	for (;;) {
		let t = i.indexOf(a, s);
		if (t === -1) break;
		o.push({
			matchIndex: c,
			slices: T(e, t, t + a.length)
		}), c++, s = t + a.length;
	}
	return o;
}
function D(e, t) {
	return t <= 0 ? -1 : e < 0 ? 0 : (e + 1) % t;
}
function O(e, t) {
	return t <= 0 ? -1 : e < 0 ? t - 1 : (e - 1 + t) % t;
}
function k(e, t) {
	let n = Math.min(e.length, t);
	if (n > 0 && n < e.length) {
		let t = e.charCodeAt(n - 1), r = e.charCodeAt(n);
		t >= 55296 && t <= 56319 && r >= 56320 && r <= 57343 && n--;
	}
	return e.slice(0, n);
}
var A = 65536;
function j(e) {
	let t = e ?? 16384;
	if (!Number.isFinite(t) || t < 0) throw RangeError("maxTextCharacters must be a finite non-negative number.");
	return Math.min(A, Math.floor(t));
}
function M(e, t) {
	let n = j(t), r = [], i = 0, a = !1, o = !1, s = (e, t) => {
		if (t && o) {
			if (i >= n) return a = !0, !1;
			r.push("\n"), i++;
		}
		o = !0;
		let s = k(e, Math.max(0, n - i));
		return r.push(s), i += s.length, s.length < e.length ? (a = !0, !1) : !0;
	};
	if (!s(`Chart type: ${e.chartType}`, !0) || e.title !== null && !s(`Title: ${e.title}`, !0)) return {
		text: r.join(""),
		truncated: a,
		textCharacters: i,
		maxTextCharacters: n
	};
	if (e.categories.length > 0) {
		if (!s("Categories: ", !0)) return {
			text: r.join(""),
			truncated: a,
			textCharacters: i,
			maxTextCharacters: n
		};
		for (let [t, o] of e.categories.entries()) if (!s(`${t === 0 ? "" : ", "}${o}`, !1)) return {
			text: r.join(""),
			truncated: a,
			textCharacters: i,
			maxTextCharacters: n
		};
	}
	for (let t of e.series) {
		if (!s(`Series ${t.name || "(unnamed)"}: `, !0)) break;
		for (let [e, o] of t.values.entries()) if (!s(`${e === 0 ? "" : ", "}${o === null ? "" : o}`, !1)) return {
			text: r.join(""),
			truncated: a,
			textCharacters: i,
			maxTextCharacters: n
		};
		if (a) break;
	}
	return {
		text: r.join(""),
		truncated: a,
		textCharacters: i,
		maxTextCharacters: n
	};
}
var N = 65536, P = 1024;
function F(e, t, n) {
	let r = e ?? t;
	if (!Number.isFinite(r) || r < 0) throw RangeError(`${n} must be a finite non-negative number.`);
	return Math.min(t, Math.floor(r));
}
function* I(e) {
	let t = e.firstChild ?? e.childNodes[0] ?? null;
	for (; t;) {
		if (t.nodeType === 3 && (yield t), t.firstChild) {
			t = t.firstChild;
			continue;
		}
		for (; t && t !== e && !t.nextSibling;) t = t.parentNode;
		if (!t || t === e) break;
		t = t.nextSibling;
	}
}
function L(e, t, n, r, i) {
	for (let a of r) {
		let r = !1;
		try {
			r = a.intersectsNode(n);
		} catch {}
		if (r) for (let r of I(n)) {
			let n = r.data, o, s;
			if (a.startContainer === r) o = a.startOffset;
			else try {
				o = a.comparePoint(r, 0) === 0 ? 0 : null;
			} catch {
				o = null;
			}
			if (a.endContainer === r) s = a.endOffset;
			else try {
				s = a.comparePoint(r, n.length) === 0 ? n.length : null;
			} catch {
				s = null;
			}
			if (o === null || s === null || s <= o) continue;
			let c = i - t;
			if (c <= 0) return t;
			let l = n.slice(Math.max(0, o), Math.min(n.length, s, Math.max(0, o) + c));
			if (e.push(l), t += l.length, t >= i) return t;
		}
	}
	return t;
}
function R(e, t, n, r = {}) {
	if (!t || t.isCollapsed || t.rangeCount === 0) return null;
	let i = [...e.matches?.("[data-ooxml-selection-surface]") ? [e] : [], ...e.querySelectorAll("[data-ooxml-selection-surface]")];
	if (i.length === 0) return null;
	let a = (e) => i.some((t) => t.contains(e)), o = [];
	for (let n = 0; n < t.rangeCount; n++) {
		let r = t.getRangeAt(n);
		if (!e.contains(r.startContainer) || !e.contains(r.endContainer) || !a(r.startContainer) || !a(r.endContainer)) return null;
		o.push(r);
	}
	let s = F(r.maxChars, N, "maxTextCharacters"), c = F(r.maxLocators, P, "maxRunLocators"), l = [], u = !1, d = s + 2, f = [], p = 0;
	for (let t of e.querySelectorAll("[data-ooxml-selection-run]")) {
		if (!o.some((e) => {
			try {
				return e.intersectsNode(t);
			} catch {
				return !1;
			}
		})) continue;
		let e = n(t);
		if (e !== null && (l.length >= c ? u = !0 : l.push(structuredClone(e)), p < d && (p = L(f, p, t, o, d)), u && p >= d)) break;
	}
	if (l.length === 0 && !u) return null;
	let m = f.join("");
	if (m.length === 0) return null;
	let h = k(m, s), g = m.length > s;
	return {
		text: h,
		locators: l,
		truncated: g || u,
		truncationReasons: [...g ? ["text"] : [], ...u ? ["runs"] : []],
		textCharacters: h.length,
		maxTextCharacters: s,
		maxLocators: c
	};
}
var z = class {
	canvas;
	options;
	wrapper;
	originalParent;
	originalNextSibling;
	originalDisplay;
	originalStyle;
	originalWidth;
	originalHeight;
	restored = !1;
	constructor(e, t) {
		this.canvas = e, this.options = t, this.originalParent = e.parentNode, this.originalNextSibling = e.nextSibling, this.originalDisplay = e.style.display, this.originalStyle = t.restoreMode === "style-and-bitmap" ? e.getAttribute("style") : null, this.originalWidth = e.width, this.originalHeight = e.height;
		let n = e.ownerDocument ?? document;
		this.wrapper = n.createElement("div"), this.wrapper.style.cssText = t.wrapperCssText, t.forceDisplayBlock && !e.style.display && (e.style.display = "block"), this.originalParent && this.originalParent.insertBefore(this.wrapper, e), this.wrapper.appendChild(e);
	}
	restore() {
		if (!this.restored) {
			if (this.restored = !0, this.originalParent) {
				let e = this.originalNextSibling?.parentNode === this.originalParent ? this.originalNextSibling : null;
				this.originalParent.insertBefore(this.canvas, e);
			} else this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas);
			(this.options.restoreMode ?? "display") === "style-and-bitmap" ? (this.originalStyle === null ? this.canvas.removeAttribute("style") : this.canvas.setAttribute("style", this.originalStyle), this.canvas.width = this.originalWidth, this.canvas.height = this.originalHeight) : this.canvas.style.display = this.originalDisplay, this.wrapper.remove();
		}
	}
}, B = "position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none;user-select:text;-webkit-user-select:text;", V = "position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none;", H = "position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none;";
function U(e, t) {
	if (!t) return null;
	let n = (e.ownerDocument ?? document).createElement("div");
	return n.setAttribute("data-overlay", "element"), n.style.cssText = H, e.appendChild(n), n;
}
function W(e, t) {
	if (!e || (e.innerHTML = "", !t || !Number.isFinite(t.x) || !Number.isFinite(t.y) || !Number.isFinite(t.width) || !Number.isFinite(t.height) || t.width <= 0 || t.height <= 0)) return;
	let n = (e.ownerDocument ?? document).createElement("div"), r = Number.isFinite(t.rotation) ? t.rotation ?? 0 : 0;
	n.style.cssText = `position:absolute;left:${t.x * 100}%;top:${t.y * 100}%;width:${t.width * 100}%;height:${t.height * 100}%;box-sizing:border-box;border:2px solid #1a73e8;background:color-mix(in srgb, #1a73e8 6%, transparent);transform:rotate(${r}deg);transform-origin:center;pointer-events:none;`, e.appendChild(n);
}
var G = class {
	textLayer;
	highlightLayer;
	elementLayer;
	constructor(e, t, n = !1) {
		let r = e.ownerDocument ?? document;
		this.textLayer = t ? r.createElement("div") : null, this.textLayer && (this.textLayer.setAttribute("data-overlay", "text"), this.textLayer.style.cssText = B, e.appendChild(this.textLayer)), this.highlightLayer = r.createElement("div"), this.highlightLayer.setAttribute("data-overlay", "highlight"), this.highlightLayer.style.cssText = V, e.appendChild(this.highlightLayer), this.elementLayer = U(e, n);
	}
}, K = class {
	message;
	layer;
	status;
	constructor(e, t) {
		this.message = t;
		let n = e.ownerDocument ?? document;
		this.layer = n.createElement("div"), this.layer.style.cssText = "position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(255,255,255,0.72);pointer-events:none;z-index:4;", this.layer.setAttribute("aria-hidden", "true"), e.appendChild(this.layer), this.status = n.createElement("div"), this.status.setAttribute("role", "status"), this.status.setAttribute("aria-live", "polite"), this.status.setAttribute("aria-atomic", "true"), this.status.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;pointer-events:none;user-select:none;-webkit-user-select:none;", e.appendChild(this.status);
	}
	setLoading(e) {
		this.layer.style.display = e ? "flex" : "none";
		let t = e ? this.message : "";
		this.status.textContent !== t && (this.status.textContent = t);
	}
};
function q(e, t, n) {
	if (n && t !== void 0 && t !== n.mode) throw Error(`${e}: opts.mode='${t}' conflicts with the borrowed engine's mode='${n.mode}'. Omit opts.mode when borrowing an engine — the engine owns its render mode.`);
	return n?.mode ?? t ?? "main";
}
var J = class {
	ownerName;
	generation = 0;
	resource;
	ownsResource;
	closed = !1;
	constructor(e, t = null, n = !1) {
		this.ownerName = e, this.resource = t, this.ownsResource = t !== null && n;
	}
	get current() {
		return this.resource;
	}
	async replace(e, t) {
		this.assertOpen();
		let n = ++this.generation, r;
		try {
			r = await e();
		} catch (e) {
			if (this.closed) throw this.closedError();
			if (n !== this.generation) return null;
			throw e;
		}
		if (this.closed) throw this.dispose(r), this.closedError();
		if (n !== this.generation) return this.dispose(r), null;
		try {
			t?.(this.resource);
		} catch (e) {
			throw this.dispose(r), e;
		}
		return this.install(r, !0), r;
	}
	install(e, t = !0) {
		this.assertOpen(), this.generation++;
		let n = this.resource, r = this.ownsResource;
		this.resource = e, this.ownsResource = t, r && n && this.dispose(n);
	}
	close() {
		if (this.closed) return;
		this.closed = !0, this.generation++;
		let e = this.resource, t = this.ownsResource;
		this.resource = null, this.ownsResource = !1, t && e && this.dispose(e);
	}
	assertOpen() {
		if (this.closed) throw this.closedError();
	}
	closedError() {
		return /* @__PURE__ */ Error(`${this.ownerName} is closed`);
	}
	dispose(e) {
		try {
			e.destroy();
		} catch {}
	}
}, Y = class {
	canvas;
	generation = 0;
	destroyed = !1;
	bitmapContext;
	constructor(e, t) {
		this.canvas = e, this.bitmapContext = t ? e.getContext("bitmaprenderer") : null;
	}
	begin() {
		return ++this.generation;
	}
	isCurrent(e) {
		return !this.destroyed && e === this.generation;
	}
	commitBitmap(e, t, n = {}) {
		if (!this.isCurrent(e)) return t.close(), !1;
		if (!this.bitmapContext) throw t.close(), Error("bitmaprenderer context not available");
		this.canvas.width !== t.width && (this.canvas.width = t.width), this.canvas.height !== t.height && (this.canvas.height = t.height), n.cssWidth !== void 0 && (this.canvas.style.width = `${n.cssWidth}px`), n.cssHeight !== void 0 && (this.canvas.style.height = `${n.cssHeight}px`);
		try {
			this.bitmapContext.transferFromImageBitmap(t);
		} catch (e) {
			throw t.close(), e;
		}
		return !0;
	}
	commitBitmapTo2d(e, t, n = {}) {
		if (!this.isCurrent(e)) return t.close(), !1;
		this.canvas.width !== t.width && (this.canvas.width = t.width), this.canvas.height !== t.height && (this.canvas.height = t.height), n.cssWidth !== void 0 && (this.canvas.style.width = `${n.cssWidth}px`), n.cssHeight !== void 0 && (this.canvas.style.height = `${n.cssHeight}px`);
		let r = this.canvas.getContext("2d");
		if (!r) throw t.close(), Error("2D context not available");
		try {
			r.drawImage(t, 0, 0);
		} finally {
			t.close();
		}
		return !0;
	}
	destroy() {
		this.destroyed || (this.destroyed = !0, this.generation++);
	}
}, X = class {
	viewerName;
	onError;
	closed = !1;
	handled = /* @__PURE__ */ new WeakSet();
	backgroundLifecycleOwners = 0;
	constructor(e, t) {
		this.viewerName = e, this.onError = t;
	}
	report(e) {
		if (this.closed) return;
		let t = e instanceof Error ? e : Error(String(e));
		this.handled.has(t) || (this.handled.add(t), this.onError ? this.onError(t) : console.error(`[ooxml] ${this.viewerName} render failed:`, t));
	}
	markHandled(e) {
		this.closed || !(e instanceof Error) || this.handled.add(e);
	}
	async ownAwaitable(e) {
		try {
			return await e();
		} catch (e) {
			throw this.markHandled(e), e;
		}
	}
	async ownBackgroundLifecycle(e) {
		this.backgroundLifecycleOwners++;
		try {
			return await this.ownAwaitable(e);
		} finally {
			this.backgroundLifecycleOwners--;
		}
	}
	reportBackground(e, t = !1) {
		let n = e instanceof Error ? e : Error(String(e));
		if (t || this.backgroundLifecycleOwners > 0) {
			this.markHandled(n);
			return;
		}
		this.report(n);
	}
	close() {
		this.closed = !0;
	}
};
export { m as C, r as D, a as E, h as S, o as T, E as _, Y as a, v as b, R as c, A as d, M as f, C as g, O as h, X as i, W as l, D as m, K as n, J as o, k as p, G as r, U as s, z as t, q as u, b as v, c as w, y as x, x as y };
