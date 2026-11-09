import { wo as e } from "./plot-area-frame-DNYMd9Pf.js";
import { A as t, Cn as n, Dn as r, En as i, J as a, M as o, Sn as s, Tn as c, U as l, bn as u, j as d, k as f, q as p, wn as m, xn as h, yn as g } from "./bounded-raw-part-cache-B5a6cGKO.js";
import { n as _ } from "./abort-JztSoyw2.js";
import { n as v, r as y, t as b } from "./resource-measurement-CfJtbwiR.js";
function x(e) {
	return e.byteOffset === 0 && e.byteLength === e.buffer.byteLength && e.buffer instanceof ArrayBuffer ? e.buffer : e.slice().buffer;
}
var S = 2 ** 53 - 1 - 1;
function C(e) {
	return Object.freeze({
		maxRows: e.maxRows,
		maxCells: e.maxCells,
		maxOwnedUtf8Bytes: e.maxOwnedUtf8Bytes,
		maxJsonBytes: e.maxJsonBytes
	});
}
var w = Object.freeze({
	worksheet: C({
		maxRows: r,
		maxCells: m,
		maxOwnedUtf8Bytes: c,
		maxJsonBytes: i
	}),
	cache: C({
		maxRows: n,
		maxCells: u,
		maxOwnedUtf8Bytes: h,
		maxJsonBytes: s
	}),
	maxCoordinateIndexEntries: g
});
function T(e, t) {
	let n = e[t];
	if (n === void 0) return w.worksheet[t];
	if (typeof n != "number") throw TypeError(`xlsxWorksheetLimits.${t} must be a number`);
	if (!Number.isSafeInteger(n) || n <= 0 || n > S) throw RangeError(`xlsxWorksheetLimits.${t} must be a positive safe integer no greater than ${S}`);
	return n;
}
function E(e = {}) {
	let t = e.xlsxWorksheetLimits, n = {};
	if (t !== void 0) {
		if (typeof t != "object" || !t || Array.isArray(t)) throw TypeError("xlsxWorksheetLimits must be a non-null, non-array object");
		n = t;
	}
	let r = C({
		maxRows: T(n, "maxRows"),
		maxCells: T(n, "maxCells"),
		maxOwnedUtf8Bytes: T(n, "maxOwnedUtf8Bytes"),
		maxJsonBytes: T(n, "maxJsonBytes")
	}), i = w, a = C({
		maxRows: Math.max(i.cache.maxRows, r.maxRows),
		maxCells: Math.max(i.cache.maxCells, r.maxCells),
		maxOwnedUtf8Bytes: Math.max(i.cache.maxOwnedUtf8Bytes, r.maxOwnedUtf8Bytes),
		maxJsonBytes: Math.max(i.cache.maxJsonBytes, r.maxJsonBytes)
	});
	return Object.freeze({
		worksheet: r,
		cache: a,
		maxCoordinateIndexEntries: Math.max(i.maxCoordinateIndexEntries, r.maxCells)
	});
}
function D(e) {
	let { worksheet: t } = e;
	return [
		BigInt(t.maxRows),
		BigInt(t.maxCells),
		BigInt(t.maxOwnedUtf8Bytes),
		BigInt(t.maxJsonBytes)
	];
}
var O = /* @__PURE__ */ new WeakMap();
function k(e, t) {
	O.set(e, t);
}
function A(e) {
	return O.get(e) ?? w;
}
function j(e, t) {
	let n = O.get(e);
	n === void 0 ? O.delete(t) : O.set(t, n);
}
var M = i, N = Object.freeze({
	archiveEntryCount: 0,
	declaredInflatedBytes: 0,
	distinctInflatedBytes: 0,
	operationInflatedBytes: 0
});
function P(e, t = w) {
	let { maxCells: n, maxOwnedUtf8Bytes: r } = t.worksheet, i = e.reduce((e, t) => b(e, t.cells.length, n), 0);
	return {
		rows: e.length,
		cells: i,
		ownedUtf8Bytes: e.reduce((e, t) => t.cells.reduce((e, t) => {
			let n = v(t.value, r).stringValueUtf8Bytes;
			return b(e, b(n, t.formula === void 0 ? 0 : y(t.formula, r), r), r);
		}, e), 0)
	};
}
function F(e, t = w) {
	return I(e, P(e.rows, t), t);
}
function I(e, t, n = w) {
	let r = v(e, n.worksheet.maxJsonBytes);
	return {
		...t,
		jsonBytes: r.jsonBytes
	};
}
function L(e, t, n = w) {
	let r = n.worksheet;
	return {
		rows: b(e.rows, t.rows, r.maxRows),
		cells: b(e.cells, t.cells, r.maxCells),
		ownedUtf8Bytes: b(e.ownedUtf8Bytes, t.ownedUtf8Bytes, r.maxOwnedUtf8Bytes)
	};
}
function R(e, t, n = {}, r = w) {
	let i = r.cache, a = e.rows - (n.rows ?? 0), o = e.cells - (n.cells ?? 0), s = e.ownedUtf8Bytes - (n.ownedUtf8Bytes ?? 0), c = e.jsonBytes - (n.jsonBytes ?? 0);
	if (a < 0 || o < 0 || s < 0 || c < 0) throw Error("worksheet cache accounting underflow");
	return {
		rows: b(a, t.rows, i.maxRows),
		cells: b(o, t.cells, i.maxCells),
		ownedUtf8Bytes: b(s, t.ownedUtf8Bytes, i.maxOwnedUtf8Bytes),
		jsonBytes: b(c, t.jsonBytes, i.maxJsonBytes)
	};
}
function z(t, n, r, i, a, o, s, c = r !== "delimited-text-source") {
	let l = r === "worksheet-json" ? "serialization" : "parsing";
	return new e(p({
		stage: l,
		violation: {
			part: n,
			resource: r,
			metric: i,
			observed: o,
			limit: a
		}
	}), {
		stage: l,
		violation: {
			format: "xlsx",
			operation: t,
			resource: r,
			metric: i,
			...n === void 0 ? {} : { part: n },
			limit: a,
			observed: Math.min(o, a + 1),
			configurable: c,
			usage: s ?? N
		}
	});
}
function B(e, t, n, r, i = w) {
	let a = i.worksheet, o = [
		[
			"rows",
			e.rows,
			a.maxRows
		],
		[
			"cells",
			e.cells,
			a.maxCells
		],
		[
			"owned-utf8-bytes",
			e.ownedUtf8Bytes,
			a.maxOwnedUtf8Bytes
		]
	];
	for (let [e, i, a] of o) if (i > a) throw z(t, n, e === "owned-utf8-bytes" ? "worksheet-cell-content" : "worksheet-model", e, a, i, r);
}
function V(e, t, n, r, i = w) {
	let a = i.worksheet.maxJsonBytes;
	if (e > a) throw z(t, n, "worksheet-json", "bytes", a, e, r);
}
function H(e, t, n, r, i = w) {
	let a = i.cache;
	if (e.rows > a.maxRows) throw z(t, n, "worksheet-cache", "rows", a.maxRows, e.rows, r);
	if (e.cells > a.maxCells) throw z(t, n, "worksheet-cache", "cells", a.maxCells, e.cells, r);
	if (e.ownedUtf8Bytes > a.maxOwnedUtf8Bytes) throw z(t, n, "worksheet-cache", "owned-utf8-bytes", a.maxOwnedUtf8Bytes, e.ownedUtf8Bytes, r);
	if (e.jsonBytes > a.maxJsonBytes) throw z(t, n, "worksheet-cache", "bytes", a.maxJsonBytes, e.jsonBytes, r);
}
function U(e, t) {
	return W(e.rows, t), e;
}
function W(e, t) {
	for (let n of e) for (let e of n.cells) {
		let n = e.value;
		if (n.type === "shared") {
			let r = t[n.si];
			if (r) {
				let t = {
					type: "text",
					text: r.text
				};
				r.runs !== void 0 && (t.runs = r.runs), r.phoneticRuns !== void 0 && (t.phoneticRuns = r.phoneticRuns), r.phoneticPr !== void 0 && (t.phoneticPr = r.phoneticPr), e.value = t;
			} else e.value = {
				type: "text",
				text: ""
			};
		}
	}
	return e;
}
var G = new Set([
	"outline",
	"merge",
	"conditional-format",
	"ancillary-content",
	"metadata-unavailable",
	"unordered-rows"
]);
function K(e, t, n, r) {
	let i = e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength), a = JSON.parse(new TextDecoder().decode(i));
	if (!a || typeof a != "object" || !("kind" in a)) throw Error("worksheet cursor returned an invalid unit");
	let o = a;
	if (t !== (o.kind === "finished")) throw Error("worksheet cursor terminal marker mismatch");
	if (o.kind === "rows") {
		if (!Array.isArray(o.rows)) throw Error("worksheet row unit is missing rows");
		return n && W(o.rows, n), r?.(o.rows), {
			kind: "rows",
			rows: o.rows
		};
	}
	if (o.kind === "preview") {
		if (!Number.isSafeInteger(o.maxRow) || !Number.isSafeInteger(o.maxCol) || o.maxRow < 0 || o.maxCol < 0 || o.worksheet === null == (o.reason === null) || o.worksheet !== null && (typeof o.worksheet != "object" || Array.isArray(o.worksheet)) || o.reason !== null && !G.has(o.reason)) throw Error("worksheet preview unit is invalid");
		return o.worksheet && (o.worksheet.rows = []), o;
	}
	if (o.kind === "finished") {
		if (!o.worksheet || typeof o.worksheet != "object") throw Error("worksheet terminal unit is missing its worksheet");
		return o.worksheet.rows = [], {
			kind: "finished",
			worksheet: o.worksheet
		};
	}
	throw Error("worksheet cursor returned an unknown unit kind");
}
var q = 64 * 1024 * 1024, J = class {
	archive;
	acceptWorksheet;
	executeArchive;
	prepareRows;
	provisional;
	worksheetPolicy;
	coordinator = new o();
	sessions = /* @__PURE__ */ new Map();
	operationTail = Promise.resolve();
	pendingOpens = /* @__PURE__ */ new Map();
	resourceFailure;
	constructor(e, t, n = (e) => e(this.requireArchive()), r, i, a = () => w) {
		this.archive = e, this.acceptWorksheet = t, this.executeArchive = n, this.prepareRows = r, this.provisional = i, this.worksheetPolicy = a;
	}
	reserveOpen(e) {
		this.pendingOpens.set(e.sessionId, {
			identity: e,
			canceled: !1
		});
	}
	abandonOpen(e) {
		this.pendingOpens.delete(e);
	}
	get pendingOpenCount() {
		return this.pendingOpens.size;
	}
	runDuringPull(t) {
		return this.sessions.size === 0 ? this.run(t) : this.coordinator.enqueue(async () => {
			if (this.resourceFailure) throw this.resourceFailure;
			try {
				return t();
			} catch (t) {
				throw t instanceof e && (this.resourceFailure ??= t), t;
			}
		});
	}
	async open(t, n, r) {
		if (this.resourceFailure) throw this.resourceFailure;
		let i = this.pendingOpens.get(r.sessionId);
		if (!i || i.identity.operationId !== r.operationId || i.identity.generation !== r.generation) throw Error("worksheet pull session open reservation is stale or missing");
		let a = this.worksheetPolicy(), o, s = new Promise((e) => {
			o = e;
		}), c = this.operationTail.then(() => this.coordinator.enqueue(async () => {
			if (i.canceled) throw Error("worksheet pull session open was canceled");
			this.executeArchive((e) => e.open_sheet_cursor(t, n));
			let s = [], c = {
				rows: 0,
				cells: 0,
				ownedUtf8Bytes: 0
			}, l, u = !1, f = new d({
				...r,
				maxByteCredit: q,
				coordinator: this.coordinator,
				driver: {
					pull: () => {
						let n = this.executeArchive((e) => e.pull_sheet_cursor(128)), r = this.executeArchive((e) => e.sheet_cursor_pull_finished());
						if (this.acceptWorksheet) {
							let i = K(n, r, void 0, this.prepareRows);
							try {
								if (i.kind === "preview") i.worksheet && (i.worksheet.rows = s, k(i.worksheet, a), this.provisional?.preview(t, i.worksheet));
								else if (i.kind === "rows") {
									let e = L(c, P(i.rows, a), a);
									B(e, "get-worksheet-worker", void 0, this.readResourceUsage(), a), s.push(...i.rows), c = e;
								} else i.kind === "finished" && (l = i.worksheet);
							} catch (t) {
								throw t instanceof e && (this.resourceFailure ??= t), t;
							}
						}
						u = r;
						let i = x(n);
						return {
							payload: i,
							byteLength: i.byteLength,
							done: r,
							transfer: [i]
						};
					},
					measureChunk: ({ payload: e }) => e.byteLength,
					acknowledge: () => {
						if (!u) return;
						let n, i;
						try {
							if (this.acceptWorksheet) {
								if (!l) throw Error("worksheet terminal payload is missing");
								l.rows = l.parseError ? [] : s;
								let e = l.parseError ? {
									rows: 0,
									cells: 0,
									ownedUtf8Bytes: 0
								} : c, r = I(l, e, a), o = this.readResourceUsage();
								B(r, "get-worksheet-worker", void 0, o, a), V(r.jsonBytes, "get-worksheet-worker", void 0, o, a), k(l, a);
								let u = this.acceptWorksheet(t, l, r, o);
								typeof u == "function" ? n = u : u && ({rollback: n, commit: i} = u);
							}
							this.executeArchive((e) => e.acknowledge_sheet_cursor_terminal()), i?.();
						} catch (t) {
							throw n?.(), t instanceof e && (this.resourceFailure ??= t), t;
						}
						u = !1, this.sessions.delete(r.sessionId), this.provisional?.stop(t), o();
					},
					cancel: () => {
						try {
							this.archive() && this.executeArchive((e) => e.cancel_sheet_cursor());
						} finally {
							this.sessions.delete(r.sessionId), this.provisional?.stop(t), o();
						}
					},
					close: () => {
						try {
							this.archive() && this.executeArchive((e) => e.close_sheet_cursor());
						} finally {
							this.sessions.delete(r.sessionId), this.provisional?.stop(t), o();
						}
					},
					resourceUsage: () => this.readResourceUsage()
				}
			});
			this.sessions.set(r.sessionId, {
				host: f,
				identity: r
			}), this.pendingOpens.delete(r.sessionId);
		}));
		this.operationTail = c.then(() => s, () => void 0);
		try {
			await c;
		} catch (e) {
			throw this.pendingOpens.delete(r.sessionId), o(), e;
		}
	}
	async postOpenedSafely(e, t, n) {
		try {
			t();
		} catch (t) {
			await this.closeIdentity(e);
			try {
				n(t);
			} catch {}
		}
	}
	dispatch(e, n) {
		let r = this.sessions.get(e.sessionId);
		if (r) return r.host.dispatch(e, n);
		let i = this.pendingOpens.get(e.sessionId);
		if (i && (e.kind === "cancel" || e.kind === "close")) {
			let r = i.identity.operationId === e.operationId && i.identity.generation === e.generation;
			return r && (i.canceled = !0), n(r ? {
				protocol: t,
				kind: "accepted",
				sessionId: e.sessionId,
				operationId: e.operationId,
				generation: e.generation,
				requestId: e.requestId,
				command: e.kind
			} : {
				protocol: t,
				kind: "error",
				sessionId: e.sessionId,
				operationId: e.operationId,
				generation: e.generation,
				requestId: e.requestId,
				error: {
					message: "stale lifecycle targets another pending worksheet operation",
					errorName: "PullSessionProtocolError",
					code: "ooxml-stale-lifecycle"
				}
			}), Promise.resolve();
		}
		return e.kind === "cancel" || e.kind === "close" ? (n({
			protocol: t,
			kind: "accepted",
			sessionId: e.sessionId,
			operationId: e.operationId,
			generation: e.generation,
			requestId: e.requestId,
			command: e.kind
		}), Promise.resolve()) : (n({
			protocol: t,
			kind: "error",
			sessionId: e.sessionId,
			operationId: e.operationId,
			generation: e.generation,
			requestId: e.requestId,
			error: a(/* @__PURE__ */ Error("worksheet pull session is not open"))
		}), Promise.resolve());
	}
	async dispatchSafely(e, n) {
		try {
			await this.dispatch(e, n);
		} catch (r) {
			try {
				n({
					protocol: t,
					kind: "error",
					sessionId: e.sessionId,
					operationId: e.operationId,
					generation: e.generation,
					requestId: e.requestId,
					error: a(r)
				});
			} catch {}
		}
	}
	run(t) {
		let n = this.operationTail.then(() => this.coordinator.enqueue(async () => {
			if (this.resourceFailure) throw this.resourceFailure;
			return t();
		})).catch((t) => {
			throw t instanceof e && (this.resourceFailure ??= t), t;
		});
		return this.operationTail = n.then(() => void 0, () => void 0), n;
	}
	async reset() {
		for (let e of this.pendingOpens.values()) e.canceled = !0;
		let e = 1;
		for (let { host: n, identity: r } of [...this.sessions.values()]) await n.dispatch({
			protocol: t,
			kind: "close",
			...r,
			requestId: e++
		}, () => void 0);
		this.sessions.clear(), await this.operationTail, this.pendingOpens.clear(), this.resourceFailure = void 0;
	}
	requireArchive() {
		let e = this.archive();
		if (!e) throw Error("Workbook not loaded");
		return e;
	}
	async closeIdentity(e) {
		let n = this.sessions.get(e.sessionId);
		if (n) {
			await n.host.dispatch({
				protocol: t,
				kind: "close",
				...e,
				requestId: 1
			}, () => void 0);
			return;
		}
		let r = this.pendingOpens.get(e.sessionId);
		r && r.identity.operationId === e.operationId && r.identity.generation === e.generation && (r.canceled = !0);
	}
	readResourceUsage() {
		return l(this.executeArchive((e) => e.sheet_cursor_resource_usage()));
	}
}, Y = "XLSX workbook session was aborted", X = class {
	options;
	active = /* @__PURE__ */ new Set();
	nextSessionId = 1;
	constructor(e) {
		if (this.options = e, e.generation !== void 0 && (!Number.isSafeInteger(e.generation) || e.generation <= 0)) throw TypeError("generation must be a positive safe integer");
	}
	async *stream(e, t, n) {
		if (!Number.isSafeInteger(e) || e < 0) throw RangeError("sheetIndex must be a non-negative safe integer");
		if (!t) throw TypeError("sheetName must be non-empty");
		_(n, Y);
		let r = this.nextSessionId++, i = {
			sessionId: r,
			operationId: r,
			generation: this.options.generation ?? 1
		}, a = new f(this.options.transport, {
			...i,
			maxByteCredit: q,
			timeoutMs: this.options.timeoutMs,
			disposeTransferred: this.options.disposeTransferred
		});
		this.active.add(a);
		let o = !1, s;
		try {
			for (await this.options.open(e, t, i, this.options.timeoutMs);;) {
				_(n, Y);
				let e = await a.pull(q, { signal: n });
				try {
					let t = e.usage ?? a.usageCheckpoint;
					t && this.options.onUsage?.(t);
					let r = K(e.payload, e.done, this.options.sharedStrings);
					if (yield r.kind === "preview" ? {
						...r,
						sequence: e.sequence,
						wireBytes: e.byteLength,
						usage: t
					} : r.kind === "rows" ? {
						kind: "rows",
						rows: r.rows,
						sequence: e.sequence,
						wireBytes: e.byteLength,
						usage: t
					} : {
						kind: "finished",
						worksheet: r.worksheet,
						sequence: e.sequence,
						wireBytes: e.byteLength,
						usage: t
					}, await e.ack({ signal: n }), r.kind === "finished") {
						o = !0;
						return;
					}
				} finally {
					e.disposeTransferred();
				}
			}
		} catch (e) {
			throw s = e, e;
		} finally {
			let e;
			try {
				o || await a.cancel(Q(s));
			} catch (t) {
				e = t;
			} finally {
				this.active.delete(a);
			}
			if (s === void 0 && e !== void 0) throw e;
		}
	}
	async cancelAll(e = "closed") {
		let t = (await Promise.allSettled([...this.active].map((t) => t.cancel(e)))).find((e) => e.status === "rejected");
		if (t) throw t.reason;
	}
};
function Z(e) {
	return !!e && typeof e == "object" && e.protocol === "ooxml-pull-v1";
}
function Q(e) {
	return e && typeof e == "object" && "name" in e && e.name === "AbortError" ? "abort" : e === void 0 ? "closed" : "request-error";
}
export { x as S, A as _, U as a, E as b, L as c, B as d, I as f, k as g, z as h, K as i, H as l, F as m, Z as n, M as o, P as p, J as r, R as s, X as t, V as u, j as v, D as x, w as y };
