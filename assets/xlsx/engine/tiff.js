// optional-renderer: packages/core/src/image/tiff.ts
import { c as e, l as t, o as n, s as r, u as i } from "./pixel-budget-DI82Hn3R.js";
import { i as a, r as o, t as s } from "./tiff-contract-DEd8CGuz.js";
import { t as c } from "./raster-target-Ca3tyA0L.js";
import { t as l } from "./renderer-module-contract-BuTx2FWJ.js";
var u = class {
	bytes;
	truncatedMessage;
	byteCursor = 0;
	byteEnd = 0;
	bitInByte = 0;
	constructor(e, t, n, r) {
		this.bytes = e, this.truncatedMessage = r, this.beginStrip(t, n);
	}
	beginStrip(e, t) {
		this.byteCursor = e, this.byteEnd = e + t, this.bitInByte = 0;
	}
	readBits(e) {
		if (e > (this.byteEnd - this.byteCursor) * 8 - this.bitInByte) throw new s(this.truncatedMessage);
		let t = 0;
		for (; e > 0;) {
			let n = 8 - this.bitInByte, r = Math.min(e, n);
			t = t << r | this.bytes[this.byteCursor] >> n - r & (1 << r) - 1, this.bitInByte += r, this.bitInByte === 8 && (this.byteCursor++, this.bitInByte = 0), e -= r;
		}
		return t;
	}
	readBit() {
		if (this.byteCursor >= this.byteEnd) throw new s(this.truncatedMessage);
		let e = this.bytes[this.byteCursor] >> 7 - this.bitInByte & 1;
		return this.bitInByte++, this.bitInByte === 8 && (this.byteCursor++, this.bitInByte = 0), e;
	}
}, d = 1, f = 3, p = 4, m = {
	width: 256,
	height: 257,
	bitsPerSample: 258,
	compression: 259,
	photometric: 262,
	fillOrder: 266,
	stripOffsets: 273,
	orientation: 274,
	samplesPerPixel: 277,
	rowsPerStrip: 278,
	stripByteCounts: 279,
	planarConfiguration: 284,
	t6Options: 293,
	predictor: 317,
	tileWidth: 322,
	tileLength: 323,
	tileOffsets: 324,
	tileByteCounts: 325,
	inkSet: 332,
	extraSamples: 338,
	sampleFormat: 339
}, h = [
	m.tileWidth,
	m.tileLength,
	m.tileOffsets,
	m.tileByteCounts
];
function g(e, t) {
	throw new s(e, t === void 0 ? void 0 : { cause: t });
}
var _ = class {
	bytes;
	littleEndian;
	view;
	constructor(e, t) {
		this.bytes = e, this.littleEndian = t, this.view = new DataView(e.buffer, e.byteOffset, e.byteLength);
	}
	contains(e, t) {
		return Number.isSafeInteger(e) && Number.isSafeInteger(t) && e >= 0 && t >= 0 && e <= this.view.byteLength - t;
	}
	u8(e, t) {
		return this.contains(e, 1) || g(`Malformed TIFF ${t} range`), this.view.getUint8(e);
	}
	u16(e, t) {
		return this.contains(e, 2) || g(`Malformed TIFF ${t} range`), this.view.getUint16(e, this.littleEndian);
	}
	u32(e, t) {
		return this.contains(e, 4) || g(`Malformed TIFF ${t} range`), this.view.getUint32(e, this.littleEndian);
	}
};
function v(e) {
	return e.length >= 2 && (e[0] === 73 && e[1] === 73 || e[0] === 77 && e[1] === 77);
}
function y(e) {
	if (!o(e)) {
		if (!v(e)) return null;
		e.length < 4 && g("Malformed TIFF header: missing version");
		let t = e[0] === 73;
		g(`Unsupported TIFF version: ${new DataView(e.buffer, e.byteOffset, e.byteLength).getUint16(2, t)}`);
	}
	e.length < 8 && g("Malformed TIFF header: missing first-IFD offset");
	let t = new _(e, e[0] === 73), n = t.u32(4, "first-IFD offset"), r = t.u16(n, "first IFD"), i = r * 12 + 4;
	t.contains(n + 2, i) || g("Malformed TIFF first-IFD entry range");
	let a = /* @__PURE__ */ new Map();
	for (let e = 0; e < r; e++) {
		let r = n + 2 + e * 12, i = t.u16(r, `IFD entry ${e}`), o = t.u16(r + 2, `IFD entry ${e} type`), s = t.u32(r + 4, `IFD entry ${e} count`);
		a.has(i) && g(`Malformed TIFF: duplicate tag ${i}`), a.set(i, {
			type: o,
			count: s,
			entryOffset: r
		});
	}
	return {
		reader: t,
		fields: a
	};
}
function b(e) {
	return e === d ? 1 : e === f ? 2 : e === p ? 4 : 0;
}
function x(e, t, n, r) {
	let i = e.fields.get(t);
	if (!i) return;
	r.includes(i.type) || g(`Unsupported TIFF ${n} field type: ${i.type}`), i.count < 1 && g(`Malformed TIFF ${n}: empty value list`);
	let a = b(i.type), o = i.count * a;
	Number.isSafeInteger(o) || g(`Malformed TIFF ${n} value count`);
	let s = o <= 4 ? i.entryOffset + 8 : e.reader.u32(i.entryOffset + 8, `${n} value offset`);
	return e.reader.contains(s, o) || g(`Malformed TIFF ${n} value range`), {
		count: i.count,
		at(t) {
			(!Number.isSafeInteger(t) || t < 0 || t >= i.count) && g(`Malformed TIFF ${n} value index`);
			let r = s + t * a;
			return i.type === d ? e.reader.u8(r, n) : i.type === f ? e.reader.u16(r, n) : e.reader.u32(r, n);
		}
	};
}
function S(e, t, n, r, i) {
	let a = x(e, t, n, r);
	if (!a) {
		if (i !== void 0) return i;
		g(`Malformed TIFF: missing ${n}`);
	}
	return a.count !== 1 && g(`Malformed TIFF ${n}: expected one value`), a.at(0);
}
function C(e, t, n, r, i) {
	let a = x(e, t, n, r);
	return a || g(`Malformed TIFF: missing ${n}`), a.count !== i && g(`Malformed TIFF ${n}: expected ${i} value${i === 1 ? "" : "s"}`), a;
}
var w = 1, T = 4, E = 5;
function ee(n, r) {
	(n < 1 || r < 1) && g("Malformed TIFF: image dimensions must be positive");
	let a = Math.max(n, r);
	if (a > 134217728) throw new i("image-dimension", e, a);
	let o = n * r;
	if (o > 134217728) throw new i("image-pixels", t, Number.isSafeInteger(o) ? o : 2 ** 53 - 1);
}
function te(e, t) {
	if (!e.fields.has(m.bitsPerSample)) return [1];
	let n = C(e, m.bitsPerSample, "BitsPerSample", [f], t), r = Array(t);
	for (let e = 0; e < t; e++) r[e] = n.at(e);
	return r;
}
function ne(e, t) {
	if (!e.fields.has(m.sampleFormat)) return;
	let n = C(e, m.sampleFormat, "SampleFormat", [f], t);
	for (let e = 0; e < n.count; e++) n.at(e) !== 1 && g("Unsupported TIFF SampleFormat: only unsigned integers are supported");
}
function D(e, t) {
	let n = S(e, m.compression, "Compression", [f], 1);
	n !== w && n !== T && n !== E && g(`Unsupported TIFF compression: ${n}`);
	let r = S(e, m.photometric, "PhotometricInterpretation", [f]), i = S(e, m.samplesPerPixel, "SamplesPerPixel", [f], 1);
	i !== 1 && i !== 3 && i !== 4 && g(`Unsupported TIFF SamplesPerPixel: ${i}`);
	let a = te(e, i);
	if (ne(e, i), n === T) {
		(i !== 1 || a.length !== 1 || a[0] !== 1 || r !== 0 && r !== 1) && g("Unsupported CCITT Group 4 TIFF sample layout"), e.fields.has(m.extraSamples) && g("Unsupported CCITT Group 4 TIFF ExtraSamples");
		let t = S(e, m.t6Options, "T6Options", [p], 0);
		return t !== 0 && g(`Unsupported TIFF T6Options: ${t}`), {
			compression: n,
			layout: {
				kind: "group4",
				photometric: r
			}
		};
	}
	if (r === 0 || r === 1) {
		if ((i !== 1 || e.fields.has(m.extraSamples)) && g("Unsupported TIFF grayscale sample layout"), a[0] === 1) return {
			compression: n,
			layout: {
				kind: "gray-1",
				photometric: r,
				bytesPerRow: Math.ceil(t / 8)
			}
		};
		if (a[0] === 8) return {
			compression: n,
			layout: {
				kind: "gray-8",
				photometric: r,
				bytesPerRow: t
			}
		};
		g(`Unsupported TIFF grayscale BitsPerSample: ${a[0]}`);
	}
	if (r === 2) {
		if (a.some((e) => e !== 8) && g("Unsupported TIFF RGB BitsPerSample: only 8-bit samples are supported"), i === 3) return e.fields.has(m.extraSamples) && g("Unsupported TIFF RGB ExtraSamples"), {
			compression: n,
			layout: {
				kind: "rgb",
				bytesPerRow: t * 3
			}
		};
		if (i === 4) {
			let r = C(e, m.extraSamples, "ExtraSamples", [f], 1).at(0);
			if (r === 1) return {
				compression: n,
				layout: {
					kind: "rgba-associated",
					bytesPerRow: t * 4
				}
			};
			if (r === 2) return {
				compression: n,
				layout: {
					kind: "rgba-unassociated",
					bytesPerRow: t * 4
				}
			};
			g(`Unsupported TIFF ExtraSamples value: ${r}`);
		}
		g(`Unsupported TIFF RGB SamplesPerPixel: ${i}`);
	}
	if (r === 5) {
		(i !== 4 || a.length !== 4 || a.some((e) => e !== 8)) && g("Unsupported TIFF separated sample layout: expected 8-bit process CMYK"), e.fields.has(m.extraSamples) && g("Unsupported TIFF CMYK ExtraSamples");
		let r = S(e, m.inkSet, "InkSet", [f], 1);
		return r !== 1 && g(`Unsupported TIFF InkSet: ${r}`), {
			compression: n,
			layout: {
				kind: "cmyk",
				bytesPerRow: t * 4
			}
		};
	}
	g(`Unsupported TIFF PhotometricInterpretation: ${r}`);
}
function O(e, t, n) {
	let r = S(e, m.predictor, "Predictor", [f], 1);
	if (r === 1) return null;
	switch (r !== 2 && g(`Unsupported TIFF Predictor: ${r}`), t !== E && g(`Unsupported TIFF Predictor 2 with Compression ${t}`), n.kind) {
		case "gray-8": return 1;
		case "rgb": return 3;
		case "rgba-associated":
		case "rgba-unassociated":
		case "cmyk": return 4;
		default: return g("Unsupported TIFF Predictor 2 with 1-bit samples");
	}
}
function k(e) {
	let t = y(e);
	if (!t) return null;
	let n = S(t, m.width, "ImageWidth", [f, p]), r = S(t, m.height, "ImageLength", [f, p]);
	ee(n, r), h.some((e) => t.fields.has(e)) && g("Unsupported tiled TIFF: only stripped images are supported");
	let i = S(t, m.orientation, "Orientation", [f], 1);
	i !== 1 && g(`Unsupported TIFF orientation: ${i}`);
	let a = S(t, m.planarConfiguration, "PlanarConfiguration", [f], 1);
	a !== 1 && g(`Unsupported TIFF PlanarConfiguration: ${a}`);
	let o = S(t, m.fillOrder, "FillOrder", [f], 1);
	o !== 1 && g(`Unsupported TIFF FillOrder: ${o}`);
	let s = S(t, m.rowsPerStrip, "RowsPerStrip", [f, p], 4294967295);
	s < 1 && g("Malformed TIFF RowsPerStrip: expected a positive value");
	let c = Math.ceil(r / s), l = C(t, m.stripOffsets, "StripOffsets", [f, p], c), u = C(t, m.stripByteCounts, "StripByteCounts", [f, p], c), { compression: d, layout: _ } = D(t, n), v = O(t, d, _);
	for (let e = 0; e < c; e++) {
		let n = l.at(e), i = u.at(e);
		if (t.reader.contains(n, i) || g(`Malformed TIFF strip ${e} byte range`), d === w) {
			let t = e * s, n = Math.min(s, r - t) * _.bytesPerRow;
			i < n && g(`Malformed TIFF strip ${e}: ${i} bytes cannot hold ${n} bytes`);
		}
	}
	return {
		directory: t,
		width: n,
		height: r,
		rowsPerStrip: s,
		stripCount: c,
		stripOffsets: l,
		stripByteCounts: u,
		compression: d,
		layout: _,
		differencingStride: v
	};
}
function A(e, t) {
	if (e !== void 0) return (!Number.isFinite(e) || e <= 0) && g(`Invalid TIFF ${t}: expected a positive finite number`), e;
}
function j(e, t, a) {
	let o = A(a.targetWidthPx, "targetWidthPx"), s = A(a.targetHeightPx, "targetHeightPx"), l = c({
		width: e,
		height: t
	}, o, s, !0), u = l?.width ?? e, d = l?.height ?? t, f = Math.max(u, d);
	if (f > 32767) throw new i("image-dimension", n, f);
	let p = a.maxRetainedPixels ?? 33554432;
	(!Number.isFinite(p) || p < 0) && g("Invalid TIFF maxRetainedPixels: expected a non-negative finite number");
	let m = Math.min(r, Math.floor(p)), h = u * d;
	if (h > m) throw new i("image-pixels", m, h);
	return {
		width: u,
		height: d,
		pixels: h
	};
}
function M(e, t) {
	return Math.round((255 - e) * (255 - t) / 255);
}
function N(e, t) {
	return t === 0 ? 0 : Math.min(255, Math.round(e * 255 / t));
}
function re(e, t) {
	let n = {
		bytes: e.directory.reader.bytes,
		rowOffset: 0,
		firstX: 0,
		endX: e.width
	};
	return (r, i) => {
		let a = Math.floor(r / e.rowsPerStrip), o = r - a * e.rowsPerStrip;
		n.rowOffset = e.stripOffsets.at(a) + o * t.bytesPerRow, i(n);
	};
}
var ie = 4096;
function P(e, t) {
	switch (e.kind) {
		case "gray-1": return Math.ceil(t / 8);
		case "gray-8": return t;
		case "rgb": return t * 3;
		default: return t * 4;
	}
}
function ae(e, t) {
	let n = 3 * t.bytesPerRow * e.height + 2 * e.stripCount, r = new ce(e.directory.reader.bytes, n), i = Math.min(e.width, ie), a = new Uint8Array(P(t, i)), o = e.differencingStride, s = new Uint8Array(4), c = {
		bytes: a,
		rowOffset: 0,
		firstX: 0,
		endX: 0
	}, l = -1, u = 0;
	return (n, d) => {
		n !== u && g("Internal TIFF LZW row sequence failure"), u++;
		let f = Math.floor(n / e.rowsPerStrip);
		f !== l && (r.beginStrip(e.stripOffsets.at(f), e.stripByteCounts.at(f)), l = f);
		for (let n = 0; n < e.width; n += i) {
			let l = Math.min(e.width, n + i), u = a.subarray(0, P(t, l - n));
			r.fill(u), o !== null && oe(u, o, s, n > 0), c.firstX = n, c.endX = l, c.rowOffset = -P(t, n), d(c);
		}
		(u === e.height || u % e.rowsPerStrip === 0) && r.finishStrip();
	};
}
function oe(e, t, n, r) {
	if (r) for (let r = 0; r < t; r++) e[r] = e[r] + n[r] & 255;
	for (let n = t; n < e.length; n++) e[n] = e[n] + e[n - t] & 255;
	n.set(e.subarray(e.length - t));
}
function F(e, t) {
	return e.compression === E ? ae(e, t) : re(e, t);
}
function se(e, t) {
	let n = e.layout, r = F(e, n), i = 0, a = (r) => I(e, n, r, i, t);
	for (; i < e.height; i++) r(i, a);
}
function I(e, t, { bytes: n, rowOffset: r, firstX: i, endX: a }, o, s) {
	for (let c = i; c < a; c++) {
		let i = (o * e.width + c) * 4;
		if (t.kind === "gray-1") {
			let e = n[r + (c >> 3)] >> 7 - (c & 7) & 1, a = t.photometric === 0 ? e === 0 ? 255 : 0 : e === 0 ? 0 : 255;
			s[i] = a, s[i + 1] = a, s[i + 2] = a, s[i + 3] = 255;
			continue;
		}
		if (t.kind === "gray-8") {
			let e = n[r + c], a = t.photometric === 0 ? 255 - e : e;
			s[i] = a, s[i + 1] = a, s[i + 2] = a, s[i + 3] = 255;
			continue;
		}
		if (t.kind === "rgb") {
			let e = r + c * 3;
			s[i] = n[e], s[i + 1] = n[e + 1], s[i + 2] = n[e + 2], s[i + 3] = 255;
			continue;
		}
		if (t.kind === "rgba-associated" || t.kind === "rgba-unassociated") {
			let e = r + c * 4, a = n[e + 3];
			s[i] = t.kind === "rgba-associated" ? N(n[e], a) : n[e], s[i + 1] = t.kind === "rgba-associated" ? N(n[e + 1], a) : n[e + 1], s[i + 2] = t.kind === "rgba-associated" ? N(n[e + 2], a) : n[e + 2], s[i + 3] = a;
			continue;
		}
		let a = r + c * 4, l = n[a + 3];
		s[i] = M(n[a], l), s[i + 1] = M(n[a + 1], l), s[i + 2] = M(n[a + 2], l), s[i + 3] = 255;
	}
}
function L(e) {
	return Math.max(0, Math.min(255, Math.round(e)));
}
function R(e, t, { bytes: n, rowOffset: r, firstX: i, endX: a }, o, s) {
	let c = e.layout, l = Math.floor(i * t.width / e.width), u = Math.floor((a * t.width - 1) / e.width);
	for (let d = l; d <= u; d++) {
		let l = d * e.width, u = (d + 1) * e.width, f = Math.max(i, Math.floor(l / t.width)), p = Math.min(a - 1, Math.floor((u - 1) / t.width)), m = 0, h = 0, g = 0, _ = 0;
		for (let e = f; e <= p; e++) {
			let i = e * t.width, a = (e + 1) * t.width, s = (Math.min(u, a) - Math.max(l, i)) * o, d, f, p, v = 255;
			if (c.kind === "gray-1") {
				let t = n[r + (e >> 3)] >> 7 - (e & 7) & 1;
				d = c.photometric === 0 ? t === 0 ? 255 : 0 : t === 0 ? 0 : 255, f = d, p = d;
			} else if (c.kind === "gray-8") {
				let t = n[r + e];
				d = c.photometric === 0 ? 255 - t : t, f = d, p = d;
			} else if (c.kind === "rgb") {
				let t = r + e * 3;
				d = n[t], f = n[t + 1], p = n[t + 2];
			} else if (c.kind === "rgba-associated") {
				let t = r + e * 4;
				v = n[t + 3], d = v === 0 ? 0 : n[t] * 255, f = v === 0 ? 0 : n[t + 1] * 255, p = v === 0 ? 0 : n[t + 2] * 255;
			} else if (c.kind === "rgba-unassociated") {
				let t = r + e * 4;
				v = n[t + 3], d = n[t] * v, f = n[t + 1] * v, p = n[t + 2] * v;
			} else {
				let t = r + e * 4, i = n[t + 3];
				d = M(n[t], i), f = M(n[t + 1], i), p = M(n[t + 2], i);
			}
			c.kind !== "rgba-associated" && c.kind !== "rgba-unassociated" && (d *= 255, f *= 255, p *= 255), m += d * s, h += f * s, g += p * s, _ += v * s;
		}
		let v = d * 4;
		s[v] += m, s[v + 1] += h, s[v + 2] += g, s[v + 3] += _;
	}
}
function z(e, t, n, r, i) {
	for (let a = 0; a < n; a++) {
		let o = a * 4, s = (r * n + a) * 4, c = e[o + 3];
		t[s] = c === 0 ? 0 : L(e[o] / c), t[s + 1] = c === 0 ? 0 : L(e[o + 1] / c), t[s + 2] = c === 0 ? 0 : L(e[o + 2] / c), t[s + 3] = L(c / i);
	}
}
function B(e, t, n) {
	let r = F(e, e.layout), i = [new Float64Array(t.width * 4), new Float64Array(t.width * 4)], a = e.width * e.height, o = -1, s = 0, c = 0, l = 0, u = 0, d = (e) => {
		for (; o < e;) {
			o++;
			let e = i[o & 1];
			z(e, n, t.width, o, a), e.fill(0);
		}
	}, f = (n) => {
		for (let r = l; r <= u; r++) {
			let a = r * e.height, o = (r + 1) * e.height;
			R(e, t, n, Math.min(c, o) - Math.max(s, a), i[r & 1]);
		}
	};
	for (let n = 0; n < e.height; n++) s = n * t.height, c = (n + 1) * t.height, l = Math.floor(s / e.height), u = Math.floor((c - 1) / e.height), (l <= o || u > l + 1) && g("Internal TIFF area-row sequence failure"), d(l - 1), r(n, f);
	u !== t.height - 1 && g("Internal TIFF area-row coverage failure"), d(u);
}
function V(e, t, n) {
	t.width === e.width && t.height === e.height ? se(e, n) : B(e, t, n);
}
var H = 256, U = 257, W = 258, G = 9, K = 12, q = 1 << K, ce = class {
	workLimit;
	prefix = new Uint16Array(q);
	suffix = new Uint8Array(q);
	first = new Uint8Array(q);
	length = new Uint16Array(q);
	pending = new Uint8Array(q);
	pendingStart = 0;
	pendingEnd = 0;
	reader;
	codeWidth = G;
	nextCode = W;
	previousCode = -1;
	ended = !1;
	work = 0;
	constructor(e, t) {
		this.workLimit = t, this.reader = new u(e, 0, 0, "TIFF LZW data is truncated");
		for (let e = 0; e < 256; e++) this.suffix[e] = e, this.first[e] = e, this.length[e] = 1;
	}
	beginStrip(e, t) {
		this.reader.beginStrip(e, t), this.pendingStart = 0, this.pendingEnd = 0, this.ended = !1, this.clearTable(), this.readCode() !== H && g("TIFF LZW strip must begin with ClearCode");
	}
	fill(e) {
		let t = 0;
		for (; t < e.length;) {
			this.pendingStart === this.pendingEnd && this.decodeNextString(), this.ended && g("TIFF LZW strip ended before its declared rows");
			let n = Math.min(e.length - t, this.pendingEnd - this.pendingStart);
			e.set(this.pending.subarray(this.pendingStart, this.pendingStart + n), t), this.pendingStart += n, t += n;
		}
	}
	finishStrip() {
		this.pendingStart !== this.pendingEnd && g("TIFF LZW data exceeds its declared rows"), this.decodeNextString(!1);
	}
	chargeWork(e) {
		if (this.work += e, this.work > this.workLimit) throw new i("tiff-lzw-work", this.workLimit, this.work);
	}
	clearTable() {
		this.codeWidth = G, this.nextCode = W, this.previousCode = -1;
	}
	readCode() {
		let e = this.reader.readBits(this.codeWidth);
		return this.chargeWork(1), e;
	}
	decodeNextString(e = !0) {
		for (;;) {
			this.ended && g("TIFF LZW strip ended before its declared rows");
			let t = this.readCode();
			if (t === H) {
				this.clearTable();
				continue;
			}
			if (t === U) {
				this.ended = !0;
				return;
			}
			this.previousCode < 0 ? t >= H && g(`Invalid TIFF LZW code: ${t}`) : this.addString(t), e || g("TIFF LZW data exceeds its declared rows"), this.expand(t), this.previousCode = t;
			return;
		}
	}
	addString(e) {
		e > this.nextCode && g(`Invalid TIFF LZW code: ${e}`), this.nextCode >= q && g("TIFF LZW code table overflow");
		let t = this.previousCode, n = this.nextCode;
		this.prefix[n] = t, this.suffix[n] = e === n ? this.first[t] : this.first[e], this.first[n] = this.first[t], this.length[n] = this.length[t] + 1, this.nextCode++, this.nextCode >= (1 << this.codeWidth) - 1 && this.codeWidth < K && this.codeWidth++;
	}
	expand(e) {
		let t = e, n = this.length[t];
		this.chargeWork(n);
		for (let e = n - 1; e >= 0; e--) this.pending[e] = this.suffix[t], t = this.prefix[t];
		this.pendingStart = 0, this.pendingEnd = n;
	}
}, J = [
	["00000001000", 1792],
	["00000001100", 1856],
	["00000001101", 1920],
	["000000010010", 1984],
	["000000010011", 2048],
	["000000010100", 2112],
	["000000010101", 2176],
	["000000010110", 2240],
	["000000010111", 2304],
	["000000011100", 2368],
	["000000011101", 2432],
	["000000011110", 2496],
	["000000011111", 2560]
], le = [
	["00110101", 0],
	["000111", 1],
	["0111", 2],
	["1000", 3],
	["1011", 4],
	["1100", 5],
	["1110", 6],
	["1111", 7],
	["10011", 8],
	["10100", 9],
	["00111", 10],
	["01000", 11],
	["001000", 12],
	["000011", 13],
	["110100", 14],
	["110101", 15],
	["101010", 16],
	["101011", 17],
	["0100111", 18],
	["0001100", 19],
	["0001000", 20],
	["0010111", 21],
	["0000011", 22],
	["0000100", 23],
	["0101000", 24],
	["0101011", 25],
	["0010011", 26],
	["0100100", 27],
	["0011000", 28],
	["00000010", 29],
	["00000011", 30],
	["00011010", 31],
	["00011011", 32],
	["00010010", 33],
	["00010011", 34],
	["00010100", 35],
	["00010101", 36],
	["00010110", 37],
	["00010111", 38],
	["00101000", 39],
	["00101001", 40],
	["00101010", 41],
	["00101011", 42],
	["00101100", 43],
	["00101101", 44],
	["00000100", 45],
	["00000101", 46],
	["00001010", 47],
	["00001011", 48],
	["01010010", 49],
	["01010011", 50],
	["01010100", 51],
	["01010101", 52],
	["00100100", 53],
	["00100101", 54],
	["01011000", 55],
	["01011001", 56],
	["01011010", 57],
	["01011011", 58],
	["01001010", 59],
	["01001011", 60],
	["00110010", 61],
	["00110011", 62],
	["00110100", 63],
	["11011", 64],
	["10010", 128],
	["010111", 192],
	["0110111", 256],
	["00110110", 320],
	["00110111", 384],
	["01100100", 448],
	["01100101", 512],
	["01101000", 576],
	["01100111", 640],
	["011001100", 704],
	["011001101", 768],
	["011010010", 832],
	["011010011", 896],
	["011010100", 960],
	["011010101", 1024],
	["011010110", 1088],
	["011010111", 1152],
	["011011000", 1216],
	["011011001", 1280],
	["011011010", 1344],
	["011011011", 1408],
	["010011000", 1472],
	["010011001", 1536],
	["010011010", 1600],
	["011000", 1664],
	["010011011", 1728],
	...J
], ue = [
	["0000110111", 0],
	["010", 1],
	["11", 2],
	["10", 3],
	["011", 4],
	["0011", 5],
	["0010", 6],
	["00011", 7],
	["000101", 8],
	["000100", 9],
	["0000100", 10],
	["0000101", 11],
	["0000111", 12],
	["00000100", 13],
	["00000111", 14],
	["000011000", 15],
	["0000010111", 16],
	["0000011000", 17],
	["0000001000", 18],
	["00001100111", 19],
	["00001101000", 20],
	["00001101100", 21],
	["00000110111", 22],
	["00000101000", 23],
	["00000010111", 24],
	["00000011000", 25],
	["000011001010", 26],
	["000011001011", 27],
	["000011001100", 28],
	["000011001101", 29],
	["000001101000", 30],
	["000001101001", 31],
	["000001101010", 32],
	["000001101011", 33],
	["000011010010", 34],
	["000011010011", 35],
	["000011010100", 36],
	["000011010101", 37],
	["000011010110", 38],
	["000011010111", 39],
	["000001101100", 40],
	["000001101101", 41],
	["000011011010", 42],
	["000011011011", 43],
	["000001010100", 44],
	["000001010101", 45],
	["000001010110", 46],
	["000001010111", 47],
	["000001100100", 48],
	["000001100101", 49],
	["000001010010", 50],
	["000001010011", 51],
	["000000100100", 52],
	["000000110111", 53],
	["000000111000", 54],
	["000000100111", 55],
	["000000101000", 56],
	["000001011000", 57],
	["000001011001", 58],
	["000000101011", 59],
	["000000101100", 60],
	["000001011010", 61],
	["000001100110", 62],
	["000001100111", 63],
	["0000001111", 64],
	["000011001000", 128],
	["000011001001", 192],
	["000001011011", 256],
	["000000110011", 320],
	["000000110100", 384],
	["000000110101", 448],
	["0000001101100", 512],
	["0000001101101", 576],
	["0000001001010", 640],
	["0000001001011", 704],
	["0000001001100", 768],
	["0000001001101", 832],
	["0000001110010", 896],
	["0000001110011", 960],
	["0000001110100", 1024],
	["0000001110101", 1088],
	["0000001110110", 1152],
	["0000001110111", 1216],
	["0000001010010", 1280],
	["0000001010011", 1344],
	["0000001010100", 1408],
	["0000001010101", 1472],
	["0000001011010", 1536],
	["0000001011011", 1600],
	["0000001100100", 1664],
	["0000001100101", 1728],
	...J
];
function Y(e) {
	let t = /* @__PURE__ */ new Map();
	for (let [n, r] of e) t.set(1 << n.length | Number.parseInt(n, 2), r);
	return t;
}
var de = Y(le), fe = Y(ue), pe = new Map([
	[3, 0],
	[9, "horizontal"],
	[10, -1],
	[11, 1],
	[17, "pass"],
	[66, -2],
	[67, 2],
	[130, -3],
	[131, 3]
]);
function me(e) {
	let t = 0;
	for (let n = 1; n <= 7; n++) {
		t = t << 1 | e.readBit();
		let r = pe.get(1 << n | t);
		if (r !== void 0) return r;
	}
	g("Invalid or unsupported CCITT Group 4 two-dimensional mode");
}
function X(e, t, n) {
	let r = t ? fe : de, i = 0, a = Math.ceil(n / 64) + 64;
	for (let t = 0; t < a; t++) {
		let t = 0, a;
		for (let n = 1; n <= 13 && (t = t << 1 | e.readBit(), a = r.get(1 << n | t), a === void 0); n++);
		if (a === void 0 && g("Invalid CCITT Group 4 run-length code"), i += a, i > n && g("CCITT Group 4 run exceeds the scanline width"), a < 64) return i;
	}
	g("CCITT Group 4 run-length code limit exceeded");
}
var Z = n + 1;
function Q(e, t) {
	let n = e[e.length - 1];
	n !== void 0 && n > t && g("Internal TIFF Group 4 changing-element order failure"), n === t ? e.pop() : (e.length >= Z && g("CCITT Group 4 changing-element limit exceeded"), e.push(t));
}
function he(e, t, n, r, i, a, o) {
	let s = i ? n : n + 1;
	for (; a.index < e.length && (o && o.referenceProbeCount++, !(e[a.index] >= s));) a.index++;
	let c = a.index;
	return c < e.length && (c + 1 & 1) != (r ^ 1) && c++, [e[c] ?? t, e[c + 1] ?? t];
}
function ge(e, t, n, r, i) {
	n.length = 0;
	let a = 0, o = 0, s = !0, c = { index: 0 }, l = r * 4 + 32;
	for (let u = 0; a < r; u++) {
		u >= l && g("CCITT Group 4 scanline operation limit exceeded"), i && i.modeCount++;
		let d = me(e);
		if (d === "horizontal") {
			let t = X(e, o === 1, r - a), i = a + t, c = i + X(e, o === 0, r - i);
			c <= a && g("Invalid CCITT Group 4 horizontal mode with no progress"), Q(n, i), Q(n, c), a = c, s = !1;
			continue;
		}
		let [f, p] = he(t, r, a, o, s, c, i);
		if (d === "pass") {
			p <= a && g("Invalid CCITT Group 4 pass mode with no progress"), a = p, s = !1;
			continue;
		}
		let m = f + d;
		(m < a || m > r) && g("Invalid CCITT Group 4 vertical mode position"), Q(n, m), a = m, o ^= 1, s = !1;
	}
	n[n.length - 1] !== r && (n.length >= Z && g("CCITT Group 4 changing-element limit exceeded"), n.push(r));
}
function $(e, t, n, r, i) {
	let a = 0;
	for (let o = 0; o < e.length; o++) {
		let s = e[o], c = o & 1, l = i === 0 ? c === 0 ? 255 : 0 : c === 0 ? 0 : 255;
		for (let e = a; e < s; e++) {
			let i = (r * n + e) * 4;
			t[i] = l, t[i + 1] = l, t[i + 2] = l, t[i + 3] = 255;
		}
		a = s;
	}
}
function _e(e, t, n, r, i, a, o) {
	let s = 0, c = n[0] * t.width;
	for (let l = 0; l < t.width; l++) {
		let u = l * e.width, d = (l + 1) * e.width, f = u;
		for (; f < d;) {
			for (o && o.areaSegmentCount++; c <= f && s + 1 < n.length;) s++, c = n[s] * t.width;
			let e = Math.min(d, c);
			e <= f && g("Internal TIFF Group 4 area-run coverage failure");
			let u = s & 1, p = r === 0 ? u === 0 ? 255 : 0 : u === 0 ? 0 : 255, m = (e - f) * i, h = l * 4, _ = p * 255 * m;
			a[h] += _, a[h + 1] += _, a[h + 2] += _, a[h + 3] += 255 * m, f = e;
		}
	}
}
function ve(e, t, n, r) {
	let i = e.layout, a = [e.width], o = [], s = t.width !== e.width || t.height !== e.height ? new Float64Array(t.width * 4) : null, c = e.width * e.height, l = -1;
	for (let d = 0; d < e.stripCount; d++) {
		a.length = 1, a[0] = e.width;
		let f = d * e.rowsPerStrip, p = Math.min(e.rowsPerStrip, e.height - f), m = new u(e.directory.reader.bytes, e.stripOffsets.at(d), e.stripByteCounts.at(d), "CCITT Group 4 data is truncated");
		for (let u = 0; u < p; u++) {
			let d = f + u;
			if (ge(m, a, o, e.width, r), !s) $(o, n, e.width, d, i.photometric);
			else {
				let a = d * t.height, u = (d + 1) * t.height, f = Math.floor(a / e.height), p = Math.floor((u - 1) / e.height);
				for (let d = f; d <= p; d++) {
					d !== l && (l >= 0 && (z(s, n, t.width, l, c), s.fill(0)), d !== l + 1 && g("Internal TIFF Group 4 area-row sequence failure"), l = d);
					let f = d * e.height, p = (d + 1) * e.height, m = Math.min(u, p) - Math.max(a, f);
					_e(e, t, o, i.photometric, m, s, r);
				}
			}
			[a, o] = [o, a];
		}
	}
	s && (l !== t.height - 1 && g("Internal TIFF Group 4 area-row coverage failure"), z(s, n, t.width, l, c));
}
function ye(e, t, n) {
	let r = k(e);
	if (!r) return null;
	let i = j(r.width, r.height, t), a = new Uint8ClampedArray(i.pixels * 4);
	return r.layout.kind === "group4" ? ve(r, i, a, n) : V(r, i, a), {
		width: i.width,
		height: i.height,
		data: a
	};
}
function be(e, t = {}) {
	return ye(e, t);
}
async function xe(e, t = {}) {
	let n = be(e, t);
	if (!n) return null;
	typeof ImageData != "function" && g("TIFF ImageData construction is unavailable");
	let r;
	try {
		r = new ImageData(n.data, n.width, n.height);
	} catch (e) {
		g("TIFF ImageData construction failed", e);
	}
	typeof createImageBitmap != "function" && g("TIFF ImageBitmap creation is unavailable");
	let i;
	try {
		i = await createImageBitmap(r);
	} catch (e) {
		g("TIFF ImageBitmap creation failed", e);
	}
	return i || g("TIFF ImageBitmap creation returned no bitmap"), i;
}
var Se = l({ render: xe }, "tiff");
export { s as TiffDecodeError, a as isTiffDecodeError, Se as tiff };
