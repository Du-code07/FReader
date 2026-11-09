import { MODEL_SOURCE_MODULE_PROTOCOL as e, assertCompanionRuntime as t } from "../engine/internal-companion.js";
//#region ../core/src/internal/bundled-asset-url.ts
function n(e, t) {
	if (e.startsWith("/") && globalThis.location?.href) {
		let n;
		try {
			n = new URL("/", t);
		} catch {}
		if (!n || n.protocol === "file:") try {
			return new URL(e, globalThis.location.href).href;
		} catch {}
	}
	return new URL(e, t).href;
}
//#endregion
//#region ../core/src/errors/cfb-read.ts
var r = 4294967290, i = 1e6;
function a(e, t) {
	return (e + 1) * t;
}
function o(e) {
	return e >= 0 && e <= r;
}
function s(e, t, n) {
	let { sectorSize: r } = n, s = [], c = /* @__PURE__ */ new Set(), l = Math.max(0, Math.floor(t / r) - 1);
	if (n.numFatSectors > l || n.numDifatSectors > l || n.numDifatSectors > i) return null;
	let u = 0, d = (e) => u++ >= n.numFatSectors ? !o(e) : !o(e) || e >= l || c.has(e) ? !1 : (c.add(e), s.push(e), !0);
	for (let t = 0; t < 109; t++) if (!d(e.getUint32(76 + t * 4, !0))) return null;
	let f = r / 4 - 1, p = n.firstDifatSector, m = /* @__PURE__ */ new Set(), h = 0;
	for (; o(p) && h < n.numDifatSectors && (h++, !m.has(p));) {
		m.add(p);
		let n = a(p, r);
		if (n < 0 || n + r > t) return null;
		for (let t = 0; t < f; t++) if (!d(e.getUint32(n + t * 4, !0))) return null;
		p = e.getUint32(n + f * 4, !0);
	}
	return h !== n.numDifatSectors || o(p) || s.length !== n.numFatSectors ? null : s;
}
function c(e, t, n, r, i) {
	let s = n / 4, c = Math.floor(i / s), l = i % s;
	if (c >= r.length) return null;
	let u = r[c];
	if (!o(u)) return null;
	let d = a(u, n) + l * 4;
	return d < 0 || d + 4 > t ? null : e.getUint32(d, !0);
}
//#endregion
//#region ../core/src/errors/cfb-sniff.ts
var l = 4294967290, u = 128, d = 4096, f = 8192;
function p(e, t, n, r, i) {
	if (!g(r)) return null;
	let a = /* @__PURE__ */ new Set(), o = Math.floor(n / u);
	if (o < 1) return null;
	let s = /* @__PURE__ */ new Set(), l = r, p = 0, _ = 0;
	for (; g(l) && !(p++ > f || s.has(l));) {
		s.add(l);
		let r = h(l, n);
		if (r < 0 || r + n > t) return null;
		for (let t = 0; t < o; t++) {
			if (_++ > d) return a;
			let n = m(e, r + t * u);
			n && a.add(n);
		}
		let f = c(e, t, n, i, l);
		if (f === null) break;
		l = f;
	}
	return a;
}
function m(e, t) {
	let n = e.getUint16(t + 64, !0);
	if (n < 2 || n > 64) return "";
	let r = n / 2 - 1, i = "";
	for (let n = 0; n < r; n++) {
		let r = e.getUint16(t + n * 2, !0);
		if (r === 0) break;
		i += String.fromCharCode(r);
	}
	return i;
}
function h(e, t) {
	return (e + 1) * t;
}
function g(e) {
	return e >= 0 && e <= l;
}
//#endregion
//#region ../core/src/source/cfb-directory-names.ts
var _ = [
	208,
	207,
	17,
	224,
	161,
	177,
	26,
	225
];
function v(e) {
	if (e.length < 512) return null;
	for (let t = 0; t < _.length; t++) if (e[t] !== _[t]) return null;
	let t = new DataView(e.buffer, e.byteOffset, e.byteLength), n = t.getUint16(30, !0);
	if (n !== 9 && n !== 12) return /* @__PURE__ */ new Set();
	let r = 1 << n, i = s(t, e.length, {
		sectorSize: r,
		numFatSectors: t.getUint32(44, !0),
		firstDifatSector: t.getUint32(68, !0),
		numDifatSectors: t.getUint32(72, !0)
	});
	return i === null ? /* @__PURE__ */ new Set() : p(t, e.length, r, t.getUint32(48, !0), i) ?? /* @__PURE__ */ new Set();
}
//#endregion
//#region ../../src/companion-version.ts
var y = "0.89.8";
//#endregion
//#region src/source-module-config.ts
function b(e, t) {
	if (e !== void 0) {
		if (typeof e != "number" || !Number.isSafeInteger(e) || e <= 0) throw RangeError(`${t} maxInputBytes is invalid`);
		return e;
	}
}
//#endregion
//#region src/legacy-source.ts
var x = {
	wasmUrl: new Set([
		"http:",
		"https:",
		"file:",
		"blob:",
		"data:"
	]),
	moduleUrl: new Set([
		"http:",
		"https:",
		"file:",
		"blob:"
	])
}, S = {
	doc: "docx",
	xls: "xlsx",
	ppt: "pptx"
};
function C(e) {
	let t = [];
	return e.has("WordDocument") && t.push("doc"), (e.has("Workbook") || e.has("Book")) && t.push("xls"), e.has("PowerPoint Document") && t.push("ppt"), t.length === 1 ? t[0] : null;
}
function w(n, r, i) {
	t(y, "ooxml-model-source-module/v2");
	let a = `legacy ${n.toUpperCase()} source`;
	if (typeof r != "object" || !r) throw TypeError(`${a} options must be an object`);
	let o = E(r.wasmUrl ?? i.wasmUrl, "wasmUrl", a), s = E(r.moduleUrl ?? i.moduleUrl, "moduleUrl", a), c = b(r.maxInputBytes, a), l = S[n], u = Object.freeze({
		protocol: e,
		target: l,
		moduleUrl: s,
		config: Object.freeze({
			wasmUrl: o,
			...c === void 0 ? {} : { maxInputBytes: c }
		})
	});
	return Object.freeze({
		target: l,
		claim(e) {
			let t = v(e);
			if (!t || t.has("EncryptionInfo") || C(t) !== n) return !1;
			if (c !== void 0 && e.byteLength > c) throw RangeError(`${a} input exceeds the configured size limit`);
			return !0;
		},
		beginLoad() {
			return {
				module: u,
				release() {}
			};
		}
	});
}
function T(e, t) {
	let n, r = () => n ??= t();
	return Object.freeze({
		target: e,
		claim: (e) => r().claim(e),
		beginLoad: () => r().beginLoad()
	});
}
function E(e, t, n) {
	if (typeof e != "string" || e.length === 0 || e.trim() !== e) throw TypeError(`${n} ${t} must be a nonempty absolute URL`);
	let r;
	try {
		r = new URL(e);
	} catch {
		throw TypeError(`${n} ${t} must be a nonempty absolute URL`);
	}
	if (!x[t].has(r.protocol)) throw TypeError(`${n} ${t} protocol is unsupported`);
	return e;
}
//#endregion
export { T as n, n as r, w as t };
