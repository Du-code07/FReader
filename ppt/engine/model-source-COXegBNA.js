import { n as e } from "./abort-JztSoyw2.js";
var t = "model source load was aborted", n = "ooxml-model-source-module/v2", r = new Set([
	"docx",
	"xlsx",
	"pptx"
]), i = new Set([
	"http:",
	"https:",
	"file:",
	"blob:"
]), a = [
	"protocol",
	"target",
	"moduleUrl",
	"config"
], o = 16, s = 8192, c = 32, l = 8192, u = 16, d = 32, f = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
function p(e, t, n) {
	if (e !== void 0) {
		if (!Array.isArray(e)) throw TypeError("model sources must be an array");
		if (e.length > o) throw RangeError(`model source selection accepts at most ${o} sources`);
		for (let r of e) {
			if (typeof r != "object" || !r) throw TypeError("each model source must be an object");
			let e = r;
			if (e.target !== t) throw TypeError(`a ${String(e.target)} model source cannot load ${t} input`);
			if (typeof e.claim != "function" || typeof e.beginLoad != "function") throw TypeError("a model source must implement claim() and beginLoad()");
			let i = e.claim(n);
			if (typeof i != "boolean") throw TypeError("model source claim() must return a boolean");
			if (i) return e;
		}
	}
}
function m(e, t) {
	let n = e.beginLoad();
	if (typeof n != "object" || !n) throw TypeError("model source beginLoad() must return an object");
	let r = n, i = r.release;
	if (typeof i != "function") throw TypeError("model source load must provide release()");
	let a = !1, o = () => {
		a || (a = !0, i.call(n));
	};
	try {
		let e = g(r.module, t), n = r.transfer === void 0 ? [] : r.transfer;
		if (!Array.isArray(n)) throw TypeError("model source load transfer must be an array");
		if (n.length > d) throw RangeError(`model source load transfer accepts at most ${d} items`);
		let i = /* @__PURE__ */ new Set();
		for (let e of n) {
			if (!(e instanceof ArrayBuffer) && !(typeof MessagePort < "u" && e instanceof MessagePort) && !(typeof ImageBitmap < "u" && e instanceof ImageBitmap) && !(typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas)) throw TypeError("model source load transfer contains an unsupported item");
			if (i.has(e)) throw TypeError("model source load transfer contains a duplicate item");
			i.add(e);
		}
		return Object.freeze({
			module: e,
			transfer: Object.freeze([...n]),
			release: o
		});
	} catch (e) {
		try {
			o();
		} catch {}
		throw e;
	}
}
function h(e, t) {
	return new Proxy(e, { get(e, n) {
		if (n === "postMessage") return (n, r) => {
			if (typeof n == "object" && n) {
				let i = n, a = i[t.discriminator];
				if (a === "init") return;
				if (a === "parse") {
					e.postMessage(t.parseMessage(i), [...r ?? [], ...t.load.transfer]);
					return;
				}
			}
			e.postMessage(n, r ?? []);
		};
		let r = t.member?.(e, n);
		if (r !== void 0) return r;
		let i = Reflect.get(e, n, e);
		return typeof i == "function" ? i.bind(e) : i;
	} });
}
function g(e, t) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("model source module descriptor must be an object");
	let o = Reflect.ownKeys(e);
	if (o.length !== a.length || a.some((e) => !o.includes(e))) throw TypeError("model source module descriptor has unknown or missing fields");
	let c = Object.getOwnPropertyDescriptors(e);
	if (a.some((e) => !c[e]?.enumerable || !("value" in c[e]))) throw TypeError("model source module descriptor fields must be data properties");
	let l = c.protocol.value, u = c.target.value, d = c.moduleUrl.value;
	if (l !== "ooxml-model-source-module/v2") throw TypeError("unsupported model source module protocol");
	if (typeof u != "string" || !r.has(u)) throw TypeError("unsupported model source target");
	if (t !== void 0 && u !== t) throw TypeError(`a ${u} model source module cannot load ${t} input`);
	if (typeof d != "string" || d.length === 0 || d.length > s || d.trim() !== d) throw TypeError("model source moduleUrl must be a nonempty absolute URL");
	let f;
	try {
		f = new URL(d);
	} catch {
		throw TypeError("model source moduleUrl must be a nonempty absolute URL");
	}
	if (!i.has(f.protocol)) throw TypeError("model source moduleUrl protocol is unsupported");
	return Object.freeze({
		protocol: n,
		target: u,
		moduleUrl: d,
		config: _(c.config.value)
	});
}
function _(e) {
	if (!x(e)) throw TypeError("model source config must be a plain object");
	let t = Reflect.ownKeys(e);
	if (t.length > c) throw RangeError(`model source config accepts at most ${c} entries`);
	let n = {};
	for (let r of t) {
		if (typeof r != "string" || !f.test(r)) throw TypeError("model source config keys must be short identifiers");
		let t = Object.getOwnPropertyDescriptor(e, r);
		if (!t?.enumerable || !("value" in t)) throw TypeError("model source config entries must be data properties");
		let i = t.value;
		if (typeof i == "string") {
			if (i.length > l) throw RangeError("model source config string is too long");
		} else if (typeof i == "number") {
			if (!Number.isFinite(i)) throw TypeError("model source config numbers must be finite");
		} else if (typeof i != "boolean" && i !== null) throw TypeError("model source config values must be strings, numbers, booleans or null");
		n[r] = i;
	}
	return Object.freeze(n);
}
async function v(n, r, i, a, o = []) {
	let s = g(n);
	e(a, t);
	let c = await import(
		/* @vite-ignore */
		s.moduleUrl
), l = typeof c == "object" && c ? c.openModelSource : void 0;
	if (typeof l != "function") throw TypeError("model source module must export openModelSource()");
	e(a, t);
	let u = await l(r, s.config, a, o);
	if (typeof u != "object" || !u) throw TypeError("openModelSource() must return an object");
	let d = u, f = d.close;
	if (typeof f != "function") throw TypeError("an opened model source must provide close()");
	let p = !1, m = () => {
		p || (p = !0, f.call(u));
	};
	try {
		let n = i(d.archive), r = y(d.viewDefaults);
		return e(a, t), Object.freeze({
			archive: n,
			viewDefaults: r,
			close: m
		});
	} catch (e) {
		try {
			m();
		} catch {}
		throw e;
	}
}
function y(e) {
	if (e === void 0) return Object.freeze({});
	if (!x(e)) throw TypeError("model source viewDefaults must be a plain object");
	let t = Reflect.ownKeys(e);
	if (t.length > u) throw RangeError("model source viewDefaults has too many entries");
	let n = {};
	for (let r of t) {
		let t = typeof r == "string" ? Object.getOwnPropertyDescriptor(e, r) : void 0;
		if (typeof r != "string" || !f.test(r) || !t?.enumerable || !("value" in t) || typeof t.value != "boolean") throw TypeError("model source viewDefaults entries must be boolean data properties");
		n[r] = t.value;
	}
	return Object.freeze(n);
}
function b(e, t, n) {
	if (typeof e != "object" && typeof e != "function" || e === null) throw TypeError(`${t} model source archive must be an object`);
	for (let r of n) if (typeof e[r] != "function") throw TypeError(`${t} model source archive must implement ${r}()`);
}
function x(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
export { b as a, v as i, m as n, p as o, h as r, n as t };
