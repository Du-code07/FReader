var e = "xlsx-host-layout-result", t = 4096, n = 255, r = 65535 / 20, i = 4096;
function a(e) {
	if (!(e instanceof Uint8Array) || e.byteLength > t) throw RangeError("XLSX host layout request byte budget exceeded");
	let n;
	try {
		n = JSON.parse(new TextDecoder("utf-8", { fatal: !0 }).decode(e));
	} catch {
		throw TypeError("invalid XLSX host layout request");
	}
	return n === null ? null : o(n);
}
function o(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("invalid XLSX host layout font");
	let t = Object.keys(e), i = [
		"family",
		"sizePt",
		"bold",
		"italic"
	];
	if (t.length !== i.length || !i.every((t) => Object.hasOwn(e, t))) throw TypeError("invalid XLSX host layout font");
	let { family: a, sizePt: o, bold: s, italic: c } = e;
	if (typeof a != "string" || a.length === 0 || a.length > n || typeof o != "number" || !Number.isFinite(o) || o <= 0 || o > r || typeof s != "boolean" || typeof c != "boolean") throw TypeError("invalid XLSX host layout font");
	return Object.freeze({
		family: a,
		sizePt: o,
		bold: s,
		italic: c
	});
}
function s(e) {
	return typeof e == "number" && Number.isInteger(e) && e >= 1 && e <= i ? e : void 0;
}
async function c(e, t) {
	if (typeof e.host_layout_request != "function") return;
	if (typeof e.configure_host_layout != "function") throw TypeError("XLSX model source archive must implement configure_host_layout()");
	let n = a(e.host_layout_request()), r = n ? s(await t(n)) : void 0;
	return e.configure_host_layout(r), r;
}
function l(t, n, r) {
	if (typeof n != "object" || !n || n.type !== "xlsx-host-layout-request") return !1;
	let i = n.requestId;
	if (typeof i != "number") return !0;
	let a;
	try {
		a = s(r(o(n.font)));
	} catch {
		a = void 0;
	}
	return t({
		type: e,
		requestId: i,
		...a === void 0 ? {} : { maximumDigitWidth: a }
	}), !0;
}
export { l as n, c as t };
