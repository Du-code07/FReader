import { t as e } from "./renderer-module-contract-BuTx2FWJ.js";
import { n as t } from "./mathjax-DvwccQ8e.js";
var n = new URL("mathjax-stix2.js", import.meta.url).href, r = null;
function i(e) {
	return new Promise((t, n) => {
		let r = document.createElement("script");
		r.src = e, r.async = !0, r.onload = () => t(), r.onerror = () => n(/* @__PURE__ */ Error(`Failed to load math engine from ${e}`)), document.head.appendChild(r);
	});
}
async function a(e) {
	await import(
		/* @vite-ignore */
		e
);
}
function o(e) {
	return r || (r = (async () => {
		let t = globalThis.__ooxmlStix2;
		if (t) return t;
		let n = new URL(e).href;
		typeof document > "u" ? await a(n) : await i(n);
		let r = globalThis.__ooxmlStix2;
		if (!r) throw Error("Math engine failed to initialize");
		return r;
	})(), r);
}
async function s(e) {
	await o(e);
}
async function c(e, n) {
	let r = (await o(n)).mathml2svg(e);
	return {
		svg: r,
		...t(r)
	};
}
function l() {
	return new URL(n, import.meta.url).href;
}
async function u() {
	await s(l());
}
async function d(e) {
	return c(e, l());
}
var f = e({
	loadMathJax: u,
	mathMLToSvg: d
}, "math", { engineAssetUrl: l() });
export { f as math };
