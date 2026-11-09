import { I as e, P as t, Xt as n } from "./bounded-raw-part-cache-B5a6cGKO.js";
import { b as r } from "./comment-overlay-controller-B7AoyoDK.js";
import { T as i } from "./canvas-viewer-mechanics-BsqaoYgK.js";
import { n as a } from "./renderer-module-contract-BuTx2FWJ.js";
import { o, s } from "./pptx-Ci1Y9SS_.js";
import { n as c, o as l, r as u } from "./model-source-COXegBNA.js";
import { t as d } from "./bundled-asset-url-BMJ8vNHP.js";
async function f(u, d) {
	let f = d.mode ?? "main", h = e(d), g = new t({
		enabled: !0,
		format: "pptx",
		mode: f,
		policy: h.policy,
		onMetrics: h.onResourceMetrics,
		emitToConsole: h.debug
	});
	try {
		if (f === "worker" && (typeof Worker > "u" || typeof OffscreenCanvas > "u")) throw Error("mode: 'worker' requires Worker and OffscreenCanvas support");
		let e;
		if (typeof u == "string") {
			let t = await fetch(u);
			if (!t.ok) throw Error(`Failed to fetch: ${t.status} ${t.statusText}`);
			e = await t.arrayBuffer();
		} else e = u;
		let t = l(d.legacyPpt === void 0 ? void 0 : [d.legacyPpt], "pptx", new Uint8Array(e));
		if (!t) return o.load(e, {
			...d,
			legacyPpt: void 0
		});
		let _ = c(t, "pptx");
		try {
			g.setSourceBytes(e.byteLength), g.checkpoint("container ready");
			let t = f === "worker" ? (await import("./render-worker-host-CVr53kg0.js")).createRenderWorker() : new (await (import("./worker-source-ZQE9C1j6.js"))).default(), c = p(t, _), l = f === "worker" ? a(d) : void 0, u;
			try {
				u = new o(c, f, d.wasmUrl);
				let t = u;
				t._metrics = g, t._cjkFallback = n(d.cjkFallback), t._math = f === "worker" ? void 0 : d.math, t._threeD = f === "worker" ? void 0 : d.threeD, t._regionMap = f === "worker" ? void 0 : d.regionMap, t._chartEx = f === "worker" ? void 0 : d.chartEx, t._tiff = f === "worker" ? void 0 : d.tiff, t._googleSubstitutes = !!d.useGoogleFonts, t._parsedTextChain = !1, m(d, f, l);
				let i = d.progressiveLayout ? {
					onProgress: d.onLayoutProgress,
					onPartial: d.onLayoutPartial,
					onComplete: d.onLayoutComplete,
					firstPublication: r(),
					published: !1,
					deferred: !1,
					settled: !1
				} : void 0;
				return await t._parse(e, h.policy, !!d.useGoogleFonts, d.workerTimeoutMs, (e) => g.observeUsage(e), l, i), g.checkpoint("presentation preflight ready"), f === "main" && d.useGoogleFonts && t._preflight && !i && await t._ensureGoogleFonts(s(t._preflight.fontPreloadNames, t._embeddedFontAliases), t._preflight.fontPreloadDemand), g.succeed({ slides: u.slideCount }), _.release(), u;
			} catch (e) {
				let n = u;
				throw i(t, n ? () => n.destroy() : void 0), e;
			}
		} finally {
			_.release();
		}
	} catch (e) {
		throw g.fail(e), e;
	}
}
function p(e, t) {
	let n = d(new URL("./pptx-source-worker.js", import.meta.url).href, import.meta.url);
	return u(e, {
		discriminator: "kind",
		load: t,
		parseMessage: (e) => ({
			...e,
			source: t.module,
			sourceOwnerUrl: n,
			...t.transfer.length ? { sourceTransfer: t.transfer } : {}
		})
	});
}
function m(e, t, n) {
	t === "worker" && (e.math && !n?.math && console.warn("[ooxml] a custom math renderer cannot cross the worker boundary; equations will be skipped in mode: 'worker'. Use the math renderer from @silurus/ooxml/math."), e.threeD && !n?.threeD && console.warn("[ooxml] a custom 3-D chart renderer cannot cross the worker boundary; charts use their 2-D family fallback in mode: 'worker'. Use the renderer from @silurus/ooxml/three-d."), e.regionMap && !n?.regionMap && console.warn("[ooxml] a custom Region Map renderer cannot cross the worker boundary; geospatial charts use the unsupported-chart placeholder in mode: 'worker'. Use the renderer from @silurus/ooxml/region-map."), e.chartEx && !n?.chartEx && console.warn("[ooxml] a custom ChartEx renderer cannot cross the worker boundary; ChartEx charts use the unsupported-chart placeholder in mode: 'worker'. Use the renderer from @silurus/ooxml/chart-ex."), e.tiff && !n?.tiff && console.warn("[ooxml] a custom TIFF codec cannot cross the worker boundary; recognized TIFF images will use an unavailable-image placeholder in mode: 'worker'. Use the codec from @silurus/ooxml/tiff to display them."));
}
export { f as loadPptxModelSource };
