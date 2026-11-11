import { n as e, r as t, t as n } from "./legacy-source-C8enaLSh.js";
//#region src/wasm-direct-ppt/legacy_ppt_direct_bg.wasm?url
var r = new URL("legacy_ppt_direct_bg.wasm", import.meta.url).href, i = new URL("legacy-ppt-source-module.js", import.meta.url).href;
//#endregion
//#region src/legacy-ppt.ts
function a(e = {}) {
	return n("ppt", e, {
		wasmUrl: t(r, import.meta.url),
		moduleUrl: t(i, import.meta.url)
	});
}
var o = /* @__PURE__ */ e("pptx", () => a());
//#endregion
export { a as createLegacyPpt, o as legacyPpt };
