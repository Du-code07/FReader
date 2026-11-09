import { n as e, r as t, t as n } from "./legacy-source-C8enaLSh.js";
//#region src/wasm-direct-xls/legacy_xls_direct_bg.wasm?url
var r = new URL("legacy_xls_direct_bg.wasm", import.meta.url).href, i = new URL("legacy-xls-source-module.js", import.meta.url).href;
//#endregion
//#region src/legacy-xls.ts
function a(e = {}) {
	return n("xls", e, {
		wasmUrl: t(r, import.meta.url),
		moduleUrl: t(i, import.meta.url)
	});
}
var o = /* @__PURE__ */ e("xlsx", () => a());
//#endregion
export { a as createLegacyXls, o as legacyXls };
