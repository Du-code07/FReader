import { I as e, P as t, Xt as n } from "./bounded-raw-part-cache-B5a6cGKO.js";
import { T as r } from "./canvas-viewer-mechanics-BsqaoYgK.js";
import { a as i, g as a } from "./renderer-CCA_bQB8.js";
import { b as o } from "./worksheet-pull-client-BudfclVl.js";
import { c as s, l as c } from "./xlsx-DTtDjzFq.js";
import { n as l, o as u, r as d } from "./model-source-COXegBNA.js";
import { t as f } from "./bundled-asset-url-BMJ8vNHP.js";
import { n as p } from "./host-layout-Cz_lCuTZ.js";
async function m(i, d, f) {
	let p = o(d);
	d = {
		...d,
		xlsxWorksheetLimits: p.worksheet
	}, d = {
		...d,
		cjkFallback: n(d.cjkFallback)
	};
	let m = e(d), g = d.mode ?? "main", _ = new t({
		enabled: !0,
		format: "xlsx",
		mode: g,
		policy: m.policy,
		formatLimits: { xlsxWorksheetLimits: { ...p.worksheet } },
		onMetrics: m.onResourceMetrics,
		emitToConsole: m.debug
	});
	try {
		if (g === "worker" && (typeof Worker > "u" || typeof OffscreenCanvas > "u")) throw Error("mode: 'worker' requires Worker and OffscreenCanvas support");
		let e;
		if (typeof i == "string") {
			let t = await fetch(i);
			if (!t.ok) throw Error(`Failed to fetch: ${t.status} ${t.statusText}`);
			e = await t.arrayBuffer();
		} else e = i;
		let t = u(d.legacyXls === void 0 ? void 0 : [d.legacyXls], "xlsx", new Uint8Array(e));
		if (!t) return f.load(e, {
			...d,
			legacyXls: void 0
		});
		let n = f;
		class o extends n {
			sourceMdw;
			async getWorksheet(e) {
				let t = await super.getWorksheet(e);
				return this.sourceMdw !== void 0 && a(t, this.sourceMdw), t;
			}
			async renderViewport(e, t, n, r = {}) {
				let i = this.sourceMdw !== void 0 && !s(r).layoutMetrics ? c(r, this.sourceMdw) : r;
				return super.renderViewport(e, t, n, i);
			}
		}
		let p = l(t, "xlsx");
		try {
			_.setSourceBytes(e.byteLength), _.checkpoint("container ready");
			let t = g === "worker" ? (await import("./render-worker-host-BZoh-wqR.js")).createRenderWorker() : new (await (import("./worker-source-C29EQNUj.js"))).default(), n, i = h(t, p, d, (e) => {
				n && (n.sourceMdw = e);
			});
			try {
				n = new o(i, g, d.wasmUrl);
				let t = n;
				return t.metrics = _, await t._load(e, d, m.policy, (e) => _.observeUsage(e), !0), n.sourceMdw !== void 0 && t.parsedWorkbook && (t.parsedWorkbook.layoutMetrics = { maximumDigitWidth: n.sourceMdw }), _.checkpoint("workbook index ready"), _.succeed({ sheets: n.sheetCount }), p.release(), n;
			} catch (e) {
				let i = n;
				throw r(t, i ? () => i.destroy() : void 0), e;
			}
		} finally {
			p.release();
		}
	} catch (e) {
		throw _.fail(e), e;
	}
}
function h(e, t, n, r) {
	let a = f(new URL("./xlsx-source-worker.js", import.meta.url).href, import.meta.url);
	return d(e, {
		discriminator: "type",
		load: t,
		parseMessage: (e) => ({
			...e,
			source: t.module,
			sourceOwnerUrl: a,
			...t.transfer.length ? { sourceTransfer: t.transfer } : {}
		}),
		member: (e, t) => {
			if (t === "addEventListener") return (t, a) => t === "message" ? e.addEventListener("message", ((o) => {
				let s = o.data;
				s.type === "parsed" && s.layoutMetrics && r(s.layoutMetrics.maximumDigitWidth), t === "message" && p((t) => e.postMessage(t), o.data, (e) => i(e.family, e.sizePt, void 0, !!n.useGoogleFonts, e.bold ? 700 : 400, e.italic ? "italic" : "normal")), a(o);
			})) : e.addEventListener(t, a);
		}
	});
}
export { m as loadXlsxModelSource };
