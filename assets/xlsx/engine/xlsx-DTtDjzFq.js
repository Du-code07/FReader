import { t as e } from "./chunk-D5OxutzX.js";
import { Co as t, Er as n, Fa as r, Ia as i, Pa as a, Tr as o, Yn as s, a as c, c as l, d as u, h as d, m as f, o as p, r as m, u as h, wo as g, wr as _ } from "./plot-area-frame-DNYMd9Pf.js";
import { n as v, t as y } from "./cfb-guard-DzYlucez.js";
import { $ as b, $t as x, An as S, F as C, I as w, L as T, P as E, Q as D, Qt as O, St as k, W as A, Xt as j, at as M, bt as ee, ft as N, ht as P, it as te, jn as F, lt as ne, ot as re, p as I, t as ie, ut as L, vn as R, xt as ae, yt as oe } from "./bounded-raw-part-cache-B5a6cGKO.js";
import { f as z, u as se } from "./pixel-budget-DI82Hn3R.js";
import { L as ce, R as le, V as ue, n as de, t as fe } from "./renderer-DpTePxGq.js";
import { i as pe, t as me } from "./tiff-contract-DEd8CGuz.js";
import { C as he, D as ge, E as _e, S as ve, T as ye, _ as be, a as xe, b as Se, d as Ce, f as we, g as Te, h as Ee, m as De, o as Oe, p as ke, t as Ae, u as je, w as Me, x as Ne, y as Pe } from "./canvas-viewer-mechanics-BsqaoYgK.js";
import { A as Fe, B as Ie, C as Le, D as Re, E as ze, F as Be, H as Ve, I as He, L as Ue, M as B, N as We, O as Ge, P as Ke, R as qe, S as Je, T as Ye, V as Xe, _ as Ze, b as Qe, c as $e, d as et, f as tt, g as nt, h as rt, i as it, j as at, k as ot, l as st, m as ct, n as lt, o as ut, p as dt, r as ft, s as V, t as pt, u as mt, v as ht, w as gt, x as _t, y as vt, z as yt } from "./renderer-CCA_bQB8.js";
import { n as bt } from "./renderer-module-contract-BuTx2FWJ.js";
import { _ as xt, a as St, b as H, c as Ct, d as wt, f as Tt, g as Et, h as Dt, l as Ot, m as kt, n as At, o as jt, p as Mt, s as Nt, t as Pt, u as Ft, v as U, y as It } from "./worksheet-pull-client-BudfclVl.js";
import { n as Lt, r as Rt, t as zt } from "./visible-index-vN-4BNn7.js";
import { a as Bt, c as Vt, d as Ht, f as Ut, l as W, n as G, o as Wt, p as Gt, r as K, t as q, u as Kt } from "./grid-geometry-DpMAiSZb.js";
var qt = "var e=(e,t)=>()=>(e&&(t=e(e=0)),t);function t(e){if(!e.startsWith(`data:`))return null;let t=e.indexOf(`,`);if(t===-1)return null;let n=atob(e.slice(t+1)),r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);return r.buffer}var n,r,i=e((()=>{n=class e extends Error{code;details;constructor(t,n,r){super(n),this.name=`OoxmlError`,this.code=t,t===`unsupported-content`&&r&&(this.details=Object.freeze({format:r.format,reason:r.reason})),Object.setPrototypeOf(this,e.prototype)}},r=class e extends Error{code=`ooxml-resource-limit`;details;constructor(t,n){super(t),this.name=`OoxmlResourceLimitError`;let r=n.violation,i=Object.freeze({format:r.format,operation:r.operation,resource:r.resource,metric:r.metric,...r.part===void 0?{}:{part:r.part},limit:r.limit,observed:r.observed,configurable:r.configurable,usage:Object.freeze({archiveEntryCount:r.usage.archiveEntryCount,declaredInflatedBytes:r.usage.declaredInflatedBytes,...r.usage.largestInflatedEntryBytes===void 0?{}:{largestInflatedEntryBytes:r.usage.largestInflatedEntryBytes},distinctInflatedBytes:r.usage.distinctInflatedBytes,operationInflatedBytes:r.usage.operationInflatedBytes})});this.details=Object.freeze({stage:n.stage,violation:i}),Object.setPrototypeOf(this,e.prototype)}}}));function a(e){return e===`image-dimension`||e===`image-pixels`||e===`active-decoded-bytes`||e===`image-effect-count`||e===`image-effect-work`||e===`tiff-lzw-work`||e===`metafile-path-commands`||e===`metafile-record-points`||e===`metafile-record-polygons`||e===`metafile-record-rectangles`||e===`metafile-record-text-units`}function o(e){return typeof e==`number`&&Number.isSafeInteger(e)&&e>=0}function s(e){if(!(!e||typeof e!=`object`))try{let t=e,n=t.code,r=t.metric,i=t.limit,s=t.observed;return n!==`ooxml-decoded-image-limit`||!a(r)||!o(i)||!o(s)||s<=i?void 0:{metric:r,limit:i,observed:s}}catch{return}}var c,l,u,d,ee,te=e((()=>{c=1<<25,l=1<<27,c*4,l*4,u=Math.floor(c/4),d=l,d/u,ee=class e extends RangeError{metric;limit;observed;code=`ooxml-decoded-image-limit`;constructor(t,n,r){super(`OOXML decoded image limit exceeded: ${t} ${r} > ${n}`),this.metric=t,this.limit=n,this.observed=r,this.name=`OoxmlDecodedImageLimitError`,Object.setPrototypeOf(this,e.prototype)}}}));function ne(e){if(!(typeof e!=`object`||!e))try{let t=e,n=t.code,r=t.message;return n===`ooxml-tiff-decode`&&typeof r==`string`?{message:r}:void 0}catch{return}}var re=e((()=>{}));function f(e){return typeof e==`number`&&Number.isSafeInteger(e)&&e>0}function ie(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;return f(t.requiredBytes)&&f(t.offeredBytes)&&t.requiredBytes>t.offeredBytes}var p=class e extends RangeError{code=`ooxml-insufficient-credit`;requiredBytes;offeredBytes;constructor(t){super(`Pull unit requires ${t.requiredBytes} bytes but credit is ${t.offeredBytes}`),this.name=`PullSessionInsufficientCreditError`,this.requiredBytes=t.requiredBytes,this.offeredBytes=t.offeredBytes,Object.setPrototypeOf(this,e.prototype)}};function ae(e){if(e instanceof p)return e;let t=e instanceof Error?e.message:String(e);if(!t.startsWith(`OOXML_INSUFFICIENT_CREDIT:`))return;let n;try{n=JSON.parse(t.slice(26))}catch{return}if(!n||typeof n!=`object`||Array.isArray(n))return;let r=n;if(!(r.code!==`ooxml-insufficient-credit`||!ie(r)))return new p(r)}i(),te(),re();const m=`OOXML_RESOURCE_LIMIT:`;function h(e){return typeof e==`number`&&Number.isSafeInteger(e)&&e>=0}function oe(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;return h(t.archiveEntryCount)&&h(t.declaredInflatedBytes)&&(t.largestInflatedEntryBytes===void 0||h(t.largestInflatedEntryBytes))&&h(t.distinctInflatedBytes)&&h(t.operationInflatedBytes)}function g(e){let t;try{t=JSON.parse(new TextDecoder().decode(e))}catch{throw TypeError(`OOXML resource usage checkpoint is not valid JSON`)}if(!oe(t))throw TypeError(`OOXML resource usage checkpoint is invalid`);return t}function se(e){return e===`docx`||e===`xlsx`||e===`pptx`}function ce(e){return e===`container`||e===`decompression`||e===`parsing`||e===`serialization`||e===`layout`||e===`rendering`||e===`worker`}function _(e,t){return typeof e==`string`&&e.length>0&&e.length<=t&&!/[\\u0000-\\u001f\\u007f]/u.test(e)}function v(e){return _(e,128)&&/^[a-z0-9][a-z0-9-]*$/u.test(e)}function le(e){return!_(e,4096)||e.startsWith(`/`)||e.startsWith(`\\\\`)||e.includes(`\\\\`)||e.includes(`?`)||e.includes(`#`)||e.includes(`://`)||/^[a-z]:/iu.test(e)?!1:e.split(`/`).every(e=>e!==``&&e!==`.`&&e!==`..`)}const y=new Map([[`archive-entry:declared-inflated-bytes`,{stage:`container`,part:`required`}],[`archive-entry:actual-inflated-bytes`,{stage:`decompression`,part:`required`}],[`archive:entry-count`,{stage:`container`,part:`forbidden`}],[`archive:central-directory-bytes`,{stage:`container`,part:`forbidden`,configurable:!1}],[`archive:distinct-inflated-bytes`,{stage:`decompression`,part:`required`}],[`xml-event:bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`xml-context:bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`image-effect:work`,{stage:`parsing`,part:`forbidden`,configurable:!1}],[`chartex-allocation:elements`,{stage:`parsing`,part:`forbidden`,configurable:!1}],[`chartex-allocation:bytes`,{stage:`parsing`,part:`forbidden`,configurable:!1}],[`chart-cache:points`,{stage:`parsing`,part:`forbidden`,configurable:!1}],[`numbering-marker:bytes`,{stage:`parsing`,part:`forbidden`,configurable:!1}],[`chart-style-formats:entries`,{stage:`parsing`,part:`required`,configurable:!1}],[`chart-custom-number-formats:entries`,{stage:`parsing`,part:`required`,configurable:!1}],[`chart-number-format-bytes:bytes`,{stage:`parsing`,part:`required`,configurable:!1}],[`xml-tree:depth`,{stage:`parsing`,part:`optional`,configurable:!1}],[`worksheet-row:projected-bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`worksheet-shell:projected-bytes`,{stage:`parsing`,part:`optional`,configurable:!1}],[`theme-style-reparse:bytes`,{stage:`parsing`,part:`forbidden`,configurable:!1}],[`style-inheritance:depth`,{stage:`parsing`,part:`required`,configurable:!1}],[`complex-field:depth`,{stage:`parsing`,part:`forbidden`,configurable:!1}]]),ue=new Set([...y.keys()].map(e=>e.slice(0,e.indexOf(`:`)))),de=new Set([...y.keys()].map(e=>e.slice(e.indexOf(`:`)+1)));function fe(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;return!se(t.format)||!_(t.operation,256)||!v(t.resource)||!v(t.metric)||!h(t.limit)||!h(t.observed)||typeof t.configurable!=`boolean`||!oe(t.usage)?!1:!(`part`in t)||le(t.part)}function b(e){if(!e||typeof e!=`object`||Array.isArray(e))return!1;let t=e;if(!ce(t.stage)||!fe(t.violation))return!1;let n=t.violation,r=y.get(`${n.resource}:${n.metric}`);return r?t.stage!==r.stage||r.configurable===!1&&n.configurable!==!1?!1:r.part===`required`?n.part!==void 0:r.part===`forbidden`?n.part===void 0:!0:!(ue.has(n.resource)&&de.has(n.metric))}function pe(e){return{archiveEntryCount:e.archiveEntryCount,declaredInflatedBytes:e.declaredInflatedBytes,...e.largestInflatedEntryBytes===void 0?{}:{largestInflatedEntryBytes:e.largestInflatedEntryBytes},distinctInflatedBytes:e.distinctInflatedBytes,operationInflatedBytes:e.operationInflatedBytes}}function me(e){if(!b(e))return;let t=e.violation,n={stage:e.stage,violation:{format:t.format,operation:t.operation,resource:t.resource,metric:t.metric,...t.part===void 0?{}:{part:t.part},limit:t.limit,observed:t.observed,configurable:t.configurable,usage:pe(t.usage)}};return b(n)?n:void 0}function x(e){let t=e.violation;return`OOXML resource limit exceeded${t.part?` for ${t.part}`:``} (${t.resource}, ${e.stage}): ${t.metric} ${t.observed} > ${t.limit}`}function S(e){let t=e instanceof Error?e.message:String(e);if(!t.startsWith(m))return;let n;try{n=JSON.parse(t.slice(21))}catch{return}if(!n||typeof n!=`object`)return;let i=n;if(!(i.code!==`ooxml-resource-limit`||!b(i.details)))return new r(x(i.details),i.details)}function he(e){try{return e()}catch(e){throw e instanceof r||typeof e!=`string`&&!(e instanceof Error)?e:S(e)??e}}function ge(e){let t=e instanceof Error?e.message:String(e);if(t.startsWith(`OOXML_NOT_OOXML:`))return new n(`not-ooxml`,`This file is not an Office Open XML document: ${t.slice(16)}`)}function C(e){if(!e||typeof e!=`object`||Array.isArray(e))return;let t=e,n=t.format,r=t.reason;if(!(!v(n)||r!==`source-subset`))return{format:n,reason:r}}function _e(e){return new n(`unsupported-content`,`Input is outside the source’s supported subset.`,e)}function ve(e){let t=typeof e==`string`?e:e instanceof Error?e.message:``;if(!(!t.startsWith(`MODEL_SOURCE_UNSUPPORTED:`)||t.length>1024))try{let e=C(JSON.parse(t.slice(25)));return e?_e(e):void 0}catch{return}}function ye(e){return e===`OOXML_SOURCE_UNSUPPORTED_ENCRYPTION`||e instanceof Error&&e.message===`OOXML_SOURCE_UNSUPPORTED_ENCRYPTION`?new n(`unsupported-encryption`,`The configured source cannot decrypt this input.`):ve(e)??S(e)??ge(e)}function be(e){let t=s(e);if(t){let e=new ee(t.metric,t.limit,t.observed);return{message:e.message,errorName:e.name,code:e.code,decodedImage:t}}let i=ne(e);if(i)return{message:i.message,errorName:`TiffDecodeError`,code:`ooxml-tiff-decode`};let a=ae(e);if(a)return{message:a.message,errorName:a.name,code:a.code,insufficientCredit:{requiredBytes:a.requiredBytes,offeredBytes:a.offeredBytes}};let o=e instanceof n||e instanceof r?e:ye(e),c=o??e;if(o instanceof r||c&&typeof c==`object`&&c.code===`ooxml-resource-limit`){let e=c,t=me(e.details);return t?{message:typeof e.message==`string`?e.message:x(t),errorName:`OoxmlResourceLimitError`,code:`ooxml-resource-limit`,resourceLimit:t}:{message:`Invalid OOXML resource-limit error payload`,errorName:`Error`}}if(c&&typeof c==`object`&&c.code===`unsupported-content`){let e=C(c.details);return e?{message:_e(e).message,code:`unsupported-content`,unsupportedContent:e}:{message:`Invalid unsupported-content error payload`,errorName:`Error`}}if(o instanceof n)return{message:typeof o.message==`string`?o.message:String(o.message),errorName:_(o.name,128)?o.name:`OoxmlError`,...v(o.code)?{code:o.code}:{}};let l=e instanceof Error?e.message:String(e);if(typeof l==`string`&&l.startsWith(m))return{message:`Invalid OOXML resource-limit payload`,errorName:`Error`};let u=e instanceof Error?e:Error(l),d=u;return{message:typeof u.message==`string`?u.message:String(u.message),errorName:_(u.name,128)?u.name:`Error`,...typeof d.code==`string`?{code:d.code}:{}}}function w(e){try{return be(e)}catch{return{message:`Worker operation failed with an unreadable error`,errorName:`Error`}}}var xe=class{initialize;reinitialize;normalizeFailure;state=`uninitialized`;generationValue=0;readiness;poisonListeners=new Set;constructor(e,t,n){this.initialize=e,this.reinitialize=t,this.normalizeFailure=n}get generation(){return this.generationValue}get poisoned(){return this.state===`poisoned`}onPoison(e){return this.poisonListeners.add(e),()=>this.poisonListeners.delete(e)}async ensureReady(){if(this.state!==`ready`){if(!this.readiness){let e=this.state===`uninitialized`?this.initialize:this.reinitialize;this.readiness=Promise.resolve().then(e).then(()=>{this.generationValue+=1,this.state=`ready`,this.readiness=void 0},e=>{throw this.readiness=void 0,e})}await this.readiness}}run(e){try{return e()}catch(e){let t=this.normalizeFailure(e);throw t?(this.poison(t),t):e}}tryRunReady(e){if(this.state!==`ready`)return{current:!1};let t=this.generationValue,n=this.run(e);return this.state!==`ready`||t!==this.generationValue?{current:!1}:{current:!0,generation:t,value:n}}poison(e){this.state=`poisoned`,this.readiness=void 0;for(let t of this.poisonListeners)t(e)}assertCurrent(e){if(this.state!==`ready`||e!==this.generationValue)throw Error(`WASM archive session belongs to a discarded runtime generation`)}},T=class e extends Error{code=`parser-crashed`;constructor(t){super(t),this.name=`WasmTrapError`,Object.setPrototypeOf(this,e.prototype)}};function Se(e){let t=globalThis.WebAssembly?.RuntimeError;return t&&e instanceof t||e instanceof RangeError?!0:e instanceof Error?e.name===`RuntimeError`||e.name===`CompileError`||e.name===`LinkError`||e.name===`InternalError`||e.name===`OOMError`:!1}function Ce(e){try{if((typeof e!=`object`||!e)&&typeof e!=`function`)return;let t=Reflect.get(e,`__destroy_into_raw`);typeof t==`function`&&Reflect.apply(t,e,[])}catch{}}function we(e,t){return e({module_or_path:t})}var Te=class{init;options;runtime;wasmInput=null;currentArchive=null;constructor(e,t={}){this.init=e,this.options=t,this.runtime=new xe(()=>this.invokeConfigured(this.init),()=>this.invokeConfigured(this.options.reinit??this.init),Ee),this.runtime.onPoison(()=>this.dropPoisonedArchive())}setWasmInput(e){this.wasmInput=e,this.runtime.ensureReady().catch(()=>void 0)}setWasmUrl(e){this.setWasmInput(e)}get archive(){return this.currentArchive}setArchive(e){this.freeArchive(),this.currentArchive=e}disposeArchive(){this.freeArchive()}get poisoned(){return this.runtime.poisoned}async ensureReady(){await this.runtime.ensureReady()}run(e){return he(()=>this.runtime.run(e))}poison(){this.runtime.poison(new T(`WASM parser was recycled`))}invokeConfigured(e){return this.wasmInput===null?Promise.reject(Error(`WasmParserHost: setWasmInput was never called`)):we(e,this.wasmInput)}freeArchive(){this.currentArchive!==null&&this.options.freeArchive&&this.options.freeArchive(this.currentArchive),this.currentArchive=null}dropPoisonedArchive(){let e=this.currentArchive;this.currentArchive=null,Ce(e)}};function Ee(e){return Se(e)?new T(`WASM parser trapped and was recycled: ${e instanceof Error?e.message:String(e)}`):null}function De(e){return e.byteOffset===0&&e.byteLength===e.buffer.byteLength&&e.buffer instanceof ArrayBuffer?e.buffer:e.slice().buffer}Object.freeze({maxArchiveEntryBytes:134217728,maxTotalInflatedBytes:268435456,maxArchiveEntries:4096});function Oe(e){return[e.maxArchiveEntryBytes===null?0n:BigInt(e.maxArchiveEntryBytes),e.maxTotalInflatedBytes===null?0n:BigInt(e.maxTotalInflatedBytes),e.maxArchiveEntries===null?0n:BigInt(e.maxArchiveEntries)]}const E=`ooxml-pull-v1`;function D(e,t){if(!Number.isSafeInteger(e)||e<=0)throw RangeError(`${t} must be a positive safe integer`)}function ke(e){if(!(typeof e==`string`&&e.length>0||typeof e==`number`&&Number.isSafeInteger(e)&&e>0))throw RangeError(`session id must be a non-empty string or positive safe integer`)}var Ae=class{owner;queue=Promise.resolve();leases=new Map;retainedBytes=0;retainedCount=0;maxRetainedBytes;maxRetainedCount;cleanups=new Set;pendingFatalCleanups=[];poisonRunning=!1;fatal;constructor(e){this.maxRetainedBytes=e?.maxRetainedBytes??64*1024*1024,this.maxRetainedCount=e?.maxRetainedCount??256,D(this.maxRetainedBytes,`max retained lease bytes`),D(this.maxRetainedCount,`max retained lease count`)}enqueue(e){let t=this.queue.then(e,e);return this.queue=t.then(()=>void 0,()=>void 0),t}acquire(e){return this.owner===void 0?(this.owner=e,!0):this.owner===e}release(e){this.owner===e&&(this.owner=void 0)}retainLease(e,t,n){if(!Number.isSafeInteger(n)||n<0)throw RangeError(`retained lease bytes are invalid`);let r=this.leases.get(e)??new Map;if(r.has(t))throw Error(`driver returned a duplicate lease id`);if(this.retainedCount+1>this.maxRetainedCount)throw RangeError(`retained lease count exceeds limit`);if(this.retainedBytes+n>this.maxRetainedBytes)throw RangeError(`retained lease bytes exceed limit`);r.set(t,n),this.leases.set(e,r),this.retainedCount++,this.retainedBytes+=n}releaseLease(e,t){let n=this.leases.get(e),r=n?.get(t);r!==void 0&&(n?.delete(t),n?.size===0&&this.leases.delete(e),this.retainedCount--,this.retainedBytes-=r)}registerCleanup(e){return this.fatal?(this.poisonRunning?this.pendingFatalCleanups.push(e):this.enqueue(e).catch(()=>void 0),()=>void 0):(this.cleanups.add(e),()=>this.cleanups.delete(e))}get fatalError(){return this.fatal}get registeredHostCount(){return this.cleanups.size}async poison(e){if(this.fatal??=e,this.poisonRunning)return this.fatal;this.poisonRunning=!0,this.pendingFatalCleanups.push(...this.cleanups);try{let e;for(;(e=this.pendingFatalCleanups.shift())!==void 0;)await e().catch(()=>void 0)}finally{this.poisonRunning=!1}return this.fatal}},je=class{options;coordinator;coordinatorOwner=Symbol(`pull-session-host`);unregisterCleanup;sequence=0;unacked;leases=new Map;activeDriverLeases=new Set;nextWireLeaseId;cancelRequested=!1;cancelComplete=!1;closeRequested=!1;closeComplete=!1;driverCancelComplete=!1;driverCloseComplete=!1;completed=!1;constructor(e){ke(e.sessionId),D(e.operationId,`operation id`),D(e.generation,`generation`),D(e.maxByteCredit,`max byte credit`),e.wireLeaseIdStart!==void 0&&D(e.wireLeaseIdStart,`wire lease id start`),this.options=e,this.coordinator=e.coordinator,this.nextWireLeaseId=e.wireLeaseIdStart??1,this.unregisterCleanup=this.coordinator.registerCleanup(()=>this.forceFatalCleanup())}dispatch(e,t){return this.coordinator.enqueue(async()=>{let n=await this.execute(e);try{t(n.response,n.transfer)}catch(e){throw await this.rollbackFailedPost(n),e}})}async rollbackFailedPost(e){let t=e.response;if(t.kind===`chunk`){let n=t.leaseId===void 0?void 0:this.leases.get(t.leaseId);try{await this.options.driver.disposeInvalidChunk?.({payload:t.payload,byteLength:t.byteLength,done:t.done,leaseId:n?.driverLeaseId,retainedBytes:n?.retainedBytes,transfer:e.transfer})}catch{}}this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);for(let[e,t]of[...this.leases])try{await this.options.driver.releaseLease?.(t.driverLeaseId)}catch{}finally{this.leases.delete(e),this.activeDriverLeases.delete(t.driverLeaseId),this.coordinator.releaseLease(this.coordinatorOwner,e)}if(this.cancelRequested=!0,!this.driverCancelComplete)try{await this.options.driver.cancel?.(),this.driverCancelComplete=!0}catch{}this.unregisterCleanup()}async execute(e){try{if(this.isStaleLifecycle(e)){let t=e.kind===`cancel`?`cancel`:`close`;return this.sameOperationIdentity(e)?{response:this.accepted(e,t,!0)}:{response:this.errorResponse(e,{message:`stale lifecycle targets another session or operation`,errorName:`PullSessionProtocolError`,code:`ooxml-stale-lifecycle`})}}this.validateCommandIdentity(e);let t=this.coordinator.fatalError;if(t)return e.kind===`pull`?{response:this.errorResponse(e,t)}:(e.kind===`cancel`?await this.cancel():e.kind===`close`?await this.close():e.kind===`release`&&await this.release(e.leaseId),{response:this.accepted(e,e.kind)});switch(e.kind){case`pull`:return await this.pull(e);case`ack`:return await this.ack(e.sequence),{response:this.accepted(e,`ack`)};case`release`:return await this.release(e.leaseId),{response:this.accepted(e,`release`)};case`cancel`:return await this.cancel(),{response:this.accepted(e,`cancel`)};case`close`:return await this.close(),{response:this.accepted(e,`close`)}}}catch(t){let n=w(t);return n.code===`ooxml-resource-limit`&&(n=await this.coordinator.poison(n)),{response:this.errorResponse(e,n)}}}async pull(e){if(this.closeRequested||this.cancelRequested||this.completed)throw Error(`pull session is closed`);if(this.unacked)throw Error(`previous chunk is not acknowledged`);if(!Number.isSafeInteger(e.sequence)||e.sequence<0||e.sequence!==this.sequence)throw Error(`pull command sequence mismatch`);if(this.validateHostCredit(e.byteCredit),!this.coordinator.acquire(this.coordinatorOwner))throw Error(`another operation has an unacknowledged package chunk`);let t;try{t=await this.options.driver.pull(e.byteCredit)}catch(e){throw this.coordinator.release(this.coordinatorOwner),e}let n=!1,r=!1,i,a;try{let o=this.options.driver.measureChunk(t),s=this.arrayBufferTransferBytes(t.transfer);if(o<s)throw RangeError(`measured chunk bytes are below ArrayBuffer transfer bytes`);if(a=Math.max(o,s),t.leaseId!==void 0){if(D(t.leaseId,`lease id`),t.retainedBytes===void 0)throw Error(`retained lease bytes are required`);if(this.activeDriverLeases.has(t.leaseId))throw r=!0,Error(`driver returned an active duplicate lease id`);i=this.allocateWireLeaseId(),this.coordinator.retainLease(this.coordinatorOwner,i,t.retainedBytes),this.leases.set(i,{driverLeaseId:t.leaseId,retainedBytes:t.retainedBytes}),this.activeDriverLeases.add(t.leaseId),n=!0}else if(t.retainedBytes!==void 0)throw Error(`retained lease bytes require a lease id`);if(!Number.isSafeInteger(a)||a<0)throw RangeError(`host chunk byte length must be a non-negative safe integer`);if(a>e.byteCredit)throw RangeError(`host chunk exceeds byte credit`)}catch(e){let a;try{await this.options.driver.disposeInvalidChunk?.(t)}catch(e){a=e}if(n&&i!==void 0)try{await this.release(i)}catch(e){a??=e}else if(t.leaseId!==void 0&&!r)try{await this.options.driver.releaseLease?.(t.leaseId)}catch(e){a??=e}if(r)try{await this.cancel()}catch(e){a??=e}throw this.coordinator.release(this.coordinatorOwner),a||e}return this.unacked={sequence:this.sequence,done:t.done},{response:{kind:`chunk`,protocol:E,...this.identity(),requestId:e.requestId,sequence:this.sequence,byteLength:a,done:t.done,payload:t.payload,leaseId:i,usage:this.resourceUsage()},transfer:t.transfer}}async ack(e){if(!Number.isSafeInteger(e)||e<0)throw RangeError(`invalid ack sequence`);if(e<this.sequence)return;if(!this.unacked||e!==this.sequence)throw Error(`ack sequence mismatch`);let t=this.unacked.done;await this.options.driver.acknowledge?.(e),this.unacked=void 0,this.coordinator.release(this.coordinatorOwner),this.sequence++,t&&(this.completed=!0,this.maybeUnregisterCompleted())}async release(e){D(e,`wire lease id`);let t=this.leases.get(e);t&&(await this.options.driver.releaseLease?.(t.driverLeaseId),this.leases.delete(e),this.activeDriverLeases.delete(t.driverLeaseId),this.coordinator.releaseLease(this.coordinatorOwner,e),this.maybeUnregisterCompleted())}async cancel(){if(this.cancelComplete)return;this.cancelRequested=!0,this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);let e;try{await this.releaseAllLeases()}catch(t){e=t}if(!this.driverCancelComplete)try{await this.options.driver.cancel?.(),this.driverCancelComplete=!0}catch(t){e??=t}if(e)throw e;this.cancelComplete=!0,this.unregisterCleanup()}async close(){if(this.closeComplete)return;this.closeRequested=!0,this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);let e;try{await this.releaseAllLeases()}catch(t){e=t}if(!this.driverCloseComplete)try{await this.options.driver.close?.(),this.driverCloseComplete=!0}catch(t){e??=t}if(e)throw e;this.closeComplete=!0,this.unregisterCleanup()}async releaseAllLeases(){let e;for(let t of[...this.leases.keys()])try{await this.release(t)}catch(t){e??=t}if(e)throw e}validateCommandIdentity(e){if(e.protocol!==`ooxml-pull-v1`||e.sessionId!==this.options.sessionId||e.operationId!==this.options.operationId||e.generation!==this.options.generation||!Number.isSafeInteger(e.requestId)||e.requestId<=0)throw Error(`stale or mismatched pull session command`)}validateHostCredit(e){if(D(e,`byte credit`),e>this.options.maxByteCredit)throw RangeError(`byte credit exceeds host maximum`)}accepted(e,t,n=!1){return{kind:`accepted`,protocol:E,...n?{sessionId:e.sessionId,operationId:e.operationId,generation:e.generation}:this.identity(),requestId:e.requestId,command:t,usage:this.resourceUsage()}}identity(){return{sessionId:this.options.sessionId,operationId:this.options.operationId,generation:this.options.generation}}isStaleLifecycle(e){return(e.kind===`cancel`||e.kind===`close`)&&e.protocol===`ooxml-pull-v1`&&Number.isSafeInteger(e.requestId)&&e.requestId>0&&Number.isSafeInteger(e.generation)&&e.generation>0&&e.generation<this.options.generation}sameOperationIdentity(e){return e.sessionId===this.options.sessionId&&e.operationId===this.options.operationId}errorResponse(e,t){return{kind:`error`,protocol:E,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:t,usage:this.errorResourceUsage()}}async forceFatalCleanup(){this.cancelRequested=!0,this.unacked=void 0,this.coordinator.release(this.coordinatorOwner);let e;for(let t of[...this.leases.keys()])try{await this.release(t)}catch(t){e??=t}if(!this.driverCancelComplete)try{await this.options.driver.cancel?.(),this.driverCancelComplete=!0}catch(t){e??=t}if(e)throw e;this.unregisterCleanup()}allocateWireLeaseId(){if(!Number.isSafeInteger(this.nextWireLeaseId)||this.nextWireLeaseId<=0)throw RangeError(`wire lease id space exhausted`);return this.nextWireLeaseId++}arrayBufferTransferBytes(e){let t=0;for(let n of e??[])if(n instanceof ArrayBuffer&&(t+=n.byteLength,!Number.isSafeInteger(t)))throw RangeError(`ArrayBuffer transfer bytes overflow`);return t}maybeUnregisterCompleted(){this.completed&&this.leases.size===0&&this.unregisterCleanup()}resourceUsage(){return this.options.driver.resourceUsage?.()}errorResourceUsage(){try{return this.resourceUsage()}catch{return}}};const O=2**53-1-1;function k(e){return Object.freeze({maxRows:e.maxRows,maxCells:e.maxCells,maxOwnedUtf8Bytes:e.maxOwnedUtf8Bytes,maxJsonBytes:e.maxJsonBytes})}const A=Object.freeze({worksheet:k({maxRows:1e5,maxCells:25e4,maxOwnedUtf8Bytes:33554432,maxJsonBytes:67108864}),cache:k({maxRows:2e5,maxCells:5e5,maxOwnedUtf8Bytes:67108864,maxJsonBytes:134217728}),maxCoordinateIndexEntries:25e4});function j(e,t){let n=e[t];if(n===void 0)return A.worksheet[t];if(typeof n!=`number`)throw TypeError(`xlsxWorksheetLimits.${t} must be a number`);if(!Number.isSafeInteger(n)||n<=0||n>O)throw RangeError(`xlsxWorksheetLimits.${t} must be a positive safe integer no greater than ${O}`);return n}function Me(e={}){let t=e.xlsxWorksheetLimits,n={};if(t!==void 0){if(typeof t!=`object`||!t||Array.isArray(t))throw TypeError(`xlsxWorksheetLimits must be a non-null, non-array object`);n=t}let r=k({maxRows:j(n,`maxRows`),maxCells:j(n,`maxCells`),maxOwnedUtf8Bytes:j(n,`maxOwnedUtf8Bytes`),maxJsonBytes:j(n,`maxJsonBytes`)}),i=A,a=k({maxRows:Math.max(i.cache.maxRows,r.maxRows),maxCells:Math.max(i.cache.maxCells,r.maxCells),maxOwnedUtf8Bytes:Math.max(i.cache.maxOwnedUtf8Bytes,r.maxOwnedUtf8Bytes),maxJsonBytes:Math.max(i.cache.maxJsonBytes,r.maxJsonBytes)});return Object.freeze({worksheet:r,cache:a,maxCoordinateIndexEntries:Math.max(i.maxCoordinateIndexEntries,r.maxCells)})}function Ne(e){let{worksheet:t}=e;return[BigInt(t.maxRows),BigInt(t.maxCells),BigInt(t.maxOwnedUtf8Bytes),BigInt(t.maxJsonBytes)]}var M=class{__destroy_into_raw(){let e=this.__wbg_ptr;return this.__wbg_ptr=0,N.unregister(this),e}free(){let e=this.__destroy_into_raw();K.__wbg_xlsxarchive_free(e,0)}acknowledge_sheet_cursor_terminal(){let e=K.xlsxarchive_acknowledge_sheet_cursor_terminal(this.__wbg_ptr);if(e[1])throw V(e[0])}assert_healthy(){let e=K.xlsxarchive_assert_healthy(this.__wbg_ptr);if(e[1])throw V(e[0])}cancel_sheet_cursor(){K.xlsxarchive_cancel_sheet_cursor(this.__wbg_ptr)}close_sheet_cursor(){K.xlsxarchive_close_sheet_cursor(this.__wbg_ptr)}extract_image(e){let t=B(e,K.__wbindgen_malloc,K.__wbindgen_realloc),n=G,r=K.xlsxarchive_extract_image(this.__wbg_ptr,t,n);if(r[3])throw V(r[2]);var i=P(r[0],r[1]).slice();return K.__wbindgen_free(r[0],r[1]*1,1),i}constructor(e,t,n,r){let i=Ie(e,K.__wbindgen_malloc),a=G,o=K.xlsxarchive_new(i,a,!z(t),z(t)?BigInt(0):t,!z(n),z(n)?BigInt(0):n,!z(r),z(r)?BigInt(0):r);if(o[2])throw V(o[1]);return this.__wbg_ptr=o[0]>>>0,N.register(this,this.__wbg_ptr,this),this}open_sheet_cursor(e,t){let n=B(t,K.__wbindgen_malloc,K.__wbindgen_realloc),r=G,i=K.xlsxarchive_open_sheet_cursor(this.__wbg_ptr,e,n,r);if(i[1])throw V(i[0])}parse(){let e=K.xlsxarchive_parse(this.__wbg_ptr);if(e[3])throw V(e[2]);var t=P(e[0],e[1]).slice();return K.__wbindgen_free(e[0],e[1]*1,1),t}pull_sheet_cursor(e){let t=K.xlsxarchive_pull_sheet_cursor(this.__wbg_ptr,e);if(t[3])throw V(t[2]);var n=P(t[0],t[1]).slice();return K.__wbindgen_free(t[0],t[1]*1,1),n}resource_usage(){let e=K.xlsxarchive_resource_usage(this.__wbg_ptr);if(e[3])throw V(e[2]);var t=P(e[0],e[1]).slice();return K.__wbindgen_free(e[0],e[1]*1,1),t}set_worksheet_limits(e,t,n,r){let i=K.xlsxarchive_set_worksheet_limits(this.__wbg_ptr,e,t,n,r);if(i[1])throw V(i[0])}sheet_cursor_pull_finished(){return K.xlsxarchive_sheet_cursor_pull_finished(this.__wbg_ptr)!==0}sheet_cursor_resource_usage(){let e=K.xlsxarchive_sheet_cursor_resource_usage(this.__wbg_ptr);if(e[3])throw V(e[2]);var t=P(e[0],e[1]).slice();return K.__wbindgen_free(e[0],e[1]*1,1),t}to_markdown(){let e,t;try{let i=K.xlsxarchive_to_markdown(this.__wbg_ptr);var n=i[0],r=i[1];if(i[3])throw n=0,r=0,V(i[2]);return e=n,t=r,I(n,r)}finally{K.__wbindgen_free(e,t,1)}}};Symbol.dispose&&(M.prototype[Symbol.dispose]=M.prototype.free);function Pe(){return{__proto__:null,\"./xlsx_parser_bg.js\":{__proto__:null,__wbg___wbindgen_throw_6b64449b9b9ed33c:function(e,t){throw Error(I(e,t))},__wbg_error_a6fa202b58aa1cd3:function(e,t){let n,r;try{n=e,r=t,console.error(I(e,t))}finally{K.__wbindgen_free(n,r,1)}},__wbg_new_227d7c05414eb861:function(){return Error()},__wbg_stack_3b0d974bbf31e44f:function(e,t){let n=t.stack,r=B(n,K.__wbindgen_malloc,K.__wbindgen_realloc),i=G;Fe().setInt32(e+4,i,!0),Fe().setInt32(e+0,r,!0)},__wbindgen_cast_0000000000000001:function(e,t){return I(e,t)},__wbindgen_init_externref_table:function(){let e=K.__wbindgen_externrefs,t=e.grow(4);e.set(0,void 0),e.set(t+0,void 0),e.set(t+1,null),e.set(t+2,!0),e.set(t+3,!1)}}}}const N=typeof FinalizationRegistry>`u`?{register:()=>{},unregister:()=>{}}:new FinalizationRegistry(e=>K.__wbg_xlsxarchive_free(e>>>0,1));function P(e,t){return e>>>=0,R().subarray(e/1,e/1+t)}let F=null;function Fe(){return(F===null||F.buffer.detached===!0||F.buffer.detached===void 0&&F.buffer!==K.memory.buffer)&&(F=new DataView(K.memory.buffer)),F}function I(e,t){return e>>>=0,Le(e,t)}let L=null;function R(){return(L===null||L.byteLength===0)&&(L=new Uint8Array(K.memory.buffer)),L}function z(e){return e==null}function Ie(e,t){let n=t(e.length*1,1)>>>0;return R().set(e,n/1),G=e.length,n}function B(e,t,n){if(n===void 0){let n=W.encode(e),r=t(n.length,1)>>>0;return R().subarray(r,r+n.length).set(n),G=n.length,r}let r=e.length,i=t(r,1)>>>0,a=R(),o=0;for(;o<r;o++){let t=e.charCodeAt(o);if(t>127)break;a[i+o]=t}if(o!==r){o!==0&&(e=e.slice(o)),i=n(i,r,r=o+e.length*3,1)>>>0;let t=R().subarray(i+o,i+r),a=W.encodeInto(e,t);o+=a.written,i=n(i,r,o,1)>>>0}return G=o,i}function V(e){let t=K.__wbindgen_externrefs.get(e);return K.__externref_table_dealloc(e),t}let H=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0});H.decode();let U=0;function Le(e,t){return U+=t,U>=2146435072&&(H=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0}),H.decode(),U=t),H.decode(R().subarray(e,e+t))}const W=new TextEncoder;`encodeInto`in W||(W.encodeInto=function(e,t){let n=W.encode(e);return t.set(n),{read:e.length,written:n.length}});let G=0,K;function Re(e,t){return K=e.exports,F=null,L=null,K.__wbindgen_start(),K}async function ze(e,t){if(typeof Response==`function`&&e instanceof Response){if(typeof WebAssembly.instantiateStreaming==`function`)try{return await WebAssembly.instantiateStreaming(e,t)}catch(t){if(e.ok&&n(e.type)&&e.headers.get(`Content-Type`)!==`application/wasm`)console.warn(\"`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\\n\",t);else throw t}let r=await e.arrayBuffer();return await WebAssembly.instantiate(r,t)}else{let n=await WebAssembly.instantiate(e,t);return n instanceof WebAssembly.Instance?{instance:n,module:e}:n}function n(e){switch(e){case`basic`:case`cors`:case`default`:return!0}return!1}}async function Be(e){if(K!==void 0)return K;e!==void 0&&(Object.getPrototypeOf(e)===Object.prototype?{module_or_path:e}=e:console.warn(`using deprecated parameters for the initialization function; pass a single object instead`));let t=Pe();(typeof e==`string`||typeof Request==`function`&&e instanceof Request||typeof URL==`function`&&e instanceof URL)&&(e=fetch(e));let{instance:n,module:r}=await ze(await e,t);return Re(n,r)}async function Ve(e){return K=void 0,F=null,L=null,Be(e)}function He(e,t){return{workbook:e(),usage:g(t())}}function Ue(e,t){for(let n of e)for(let e of n.cells){let n=e.value;if(n.type===`shared`){let r=t[n.si];if(r){let t={type:`text`,text:r.text};r.runs!==void 0&&(t.runs=r.runs),r.phoneticRuns!==void 0&&(t.phoneticRuns=r.phoneticRuns),r.phoneticPr!==void 0&&(t.phoneticPr=r.phoneticPr),e.value=t}else e.value={type:`text`,text:``}}}return e}const We=new Set([`outline`,`merge`,`conditional-format`,`ancillary-content`,`metadata-unavailable`,`unordered-rows`]);function Ge(e,t,n,r){let i=e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength),a=JSON.parse(new TextDecoder().decode(i));if(!a||typeof a!=`object`||!(`kind`in a))throw Error(`worksheet cursor returned an invalid unit`);let o=a;if(t!==(o.kind===`finished`))throw Error(`worksheet cursor terminal marker mismatch`);if(o.kind===`rows`){if(!Array.isArray(o.rows))throw Error(`worksheet row unit is missing rows`);return n&&Ue(o.rows,n),r?.(o.rows),{kind:`rows`,rows:o.rows}}if(o.kind===`preview`){if(!Number.isSafeInteger(o.maxRow)||!Number.isSafeInteger(o.maxCol)||o.maxRow<0||o.maxCol<0||o.worksheet===null==(o.reason===null)||o.worksheet!==null&&(typeof o.worksheet!=`object`||Array.isArray(o.worksheet))||o.reason!==null&&!We.has(o.reason))throw Error(`worksheet preview unit is invalid`);return o.worksheet&&(o.worksheet.rows=[]),o}if(o.kind===`finished`){if(!o.worksheet||typeof o.worksheet!=`object`)throw Error(`worksheet terminal unit is missing its worksheet`);return o.worksheet.rows=[],{kind:`finished`,worksheet:o.worksheet}}throw Error(`worksheet cursor returned an unknown unit kind`)}const Ke=new WeakMap;function qe(e,t){Ke.set(e,t)}function q(e,t){if(!Number.isSafeInteger(e)||e<0)throw Error(`${t} must be a non-negative safe integer`)}function J(e,t,n){return q(e,`resource measurement`),q(t,`resource measurement`),q(n,`resource measurement limit`),e>n||t>n||t>n-e?n===2**53-1?n:n+1:e+t}function Je(e,t=2**53-1){q(t,`resource measurement limit`);let n=0;for(let r=0;r<e.length;r+=1){let i=e.charCodeAt(r),a;if(i<=127)a=1;else if(i<=2047)a=2;else if(i>=55296&&i<=56319&&r+1<e.length){let t=e.charCodeAt(r+1);t>=56320&&t<=57343?(a=4,r+=1):a=3}else a=3;if(n=J(n,a,t),n>t)return n}return n}function Ye(e,t=2**53-1){q(t,`resource measurement limit`);let n=J(0,2,t);if(n>t)return n;for(let r=0;r<e.length;r+=1){let i=e.charCodeAt(r),a;if(i===34||i===92||i===8||i===9||i===10||i===12||i===13)a=2;else if(i<=31)a=6;else if(i<=127)a=1;else if(i<=2047)a=2;else if(i>=55296&&i<=56319&&r+1<e.length){let t=e.charCodeAt(r+1);t>=56320&&t<=57343?(a=4,r+=1):a=6}else a=i>=55296&&i<=57343?6:3;if(n=J(n,a,t),n>t)return n}return n}function Y(e,t){return J(0,e,t)}function X(e,t=2**53-1,n=!1){if(q(t,`resource measurement limit`),e===null)return{jsonBytes:Y(4,t),stringValueUtf8Bytes:0};if(typeof e==`string`)return{jsonBytes:Ye(e,t),stringValueUtf8Bytes:Je(e,t)};if(typeof e==`boolean`)return{jsonBytes:Y(e?4:5,t),stringValueUtf8Bytes:0};if(typeof e==`number`)return{jsonBytes:Y((Number.isFinite(e)?String(Object.is(e,-0)?0:e):`null`).length,t),stringValueUtf8Bytes:0};if(typeof e==`bigint`)throw TypeError(`BigInt values cannot be serialized to JSON`);if(Array.isArray(e)){let n=Y(2,t),r=0;for(let i=0;i<e.length;i+=1){i!==0&&(n=J(n,1,t));let a=X(e[i],t,!0);n=J(n,a.jsonBytes,t),r=J(r,a.stringValueUtf8Bytes,t)}return{jsonBytes:n,stringValueUtf8Bytes:r}}if(typeof e==`object`){let n=Y(2,t),r=0,i=0;for(let[a,o]of Object.entries(e)){if(o===void 0||typeof o==`function`||typeof o==`symbol`)continue;i++!==0&&(n=J(n,1,t)),n=J(n,Ye(a,t),t),n=J(n,1,t);let e=X(o,t);n=J(n,e.jsonBytes,t),r=J(r,e.stringValueUtf8Bytes,t)}return{jsonBytes:n,stringValueUtf8Bytes:r}}return{jsonBytes:n?Y(4,t):0,stringValueUtf8Bytes:0}}i();const Xe=Object.freeze({archiveEntryCount:0,declaredInflatedBytes:0,distinctInflatedBytes:0,operationInflatedBytes:0});function Ze(e,t=A){let{maxCells:n,maxOwnedUtf8Bytes:r}=t.worksheet,i=e.reduce((e,t)=>J(e,t.cells.length,n),0);return{rows:e.length,cells:i,ownedUtf8Bytes:e.reduce((e,t)=>t.cells.reduce((e,t)=>{let n=X(t.value,r).stringValueUtf8Bytes;return J(e,J(n,t.formula===void 0?0:Je(t.formula,r),r),r)},e),0)}}function Qe(e,t,n=A){let r=X(e,n.worksheet.maxJsonBytes);return{...t,jsonBytes:r.jsonBytes}}function $e(e,t,n=A){let r=n.worksheet;return{rows:J(e.rows,t.rows,r.maxRows),cells:J(e.cells,t.cells,r.maxCells),ownedUtf8Bytes:J(e.ownedUtf8Bytes,t.ownedUtf8Bytes,r.maxOwnedUtf8Bytes)}}function et(e,t,n,i,a,o,s,c=n!==`delimited-text-source`){let l=n===`worksheet-json`?`serialization`:`parsing`;return new r(x({stage:l,violation:{part:t,resource:n,metric:i,observed:o,limit:a}}),{stage:l,violation:{format:`xlsx`,operation:e,resource:n,metric:i,...t===void 0?{}:{part:t},limit:a,observed:Math.min(o,a+1),configurable:c,usage:s??Xe}})}function tt(e,t,n,r,i=A){let a=i.worksheet,o=[[`rows`,e.rows,a.maxRows],[`cells`,e.cells,a.maxCells],[`owned-utf8-bytes`,e.ownedUtf8Bytes,a.maxOwnedUtf8Bytes]];for(let[e,i,a]of o)if(i>a)throw et(t,n,e===`owned-utf8-bytes`?`worksheet-cell-content`:`worksheet-model`,e,a,i,r)}function nt(e,t,n,r,i=A){let a=i.worksheet.maxJsonBytes;if(e>a)throw et(t,n,`worksheet-json`,`bytes`,a,e,r)}i();var rt=class{archive;acceptWorksheet;executeArchive;prepareRows;provisional;worksheetPolicy;coordinator=new Ae;sessions=new Map;operationTail=Promise.resolve();pendingOpens=new Map;resourceFailure;constructor(e,t,n=e=>e(this.requireArchive()),r,i,a=()=>A){this.archive=e,this.acceptWorksheet=t,this.executeArchive=n,this.prepareRows=r,this.provisional=i,this.worksheetPolicy=a}reserveOpen(e){this.pendingOpens.set(e.sessionId,{identity:e,canceled:!1})}abandonOpen(e){this.pendingOpens.delete(e)}get pendingOpenCount(){return this.pendingOpens.size}runDuringPull(e){return this.sessions.size===0?this.run(e):this.coordinator.enqueue(async()=>{if(this.resourceFailure)throw this.resourceFailure;try{return e()}catch(e){throw e instanceof r&&(this.resourceFailure??=e),e}})}async open(e,t,n){if(this.resourceFailure)throw this.resourceFailure;let i=this.pendingOpens.get(n.sessionId);if(!i||i.identity.operationId!==n.operationId||i.identity.generation!==n.generation)throw Error(`worksheet pull session open reservation is stale or missing`);let a=this.worksheetPolicy(),o,s=new Promise(e=>{o=e}),c=this.operationTail.then(()=>this.coordinator.enqueue(async()=>{if(i.canceled)throw Error(`worksheet pull session open was canceled`);this.executeArchive(n=>n.open_sheet_cursor(e,t));let s=[],c={rows:0,cells:0,ownedUtf8Bytes:0},l,u=!1,d=new je({...n,maxByteCredit:67108864,coordinator:this.coordinator,driver:{pull:()=>{let t=this.executeArchive(e=>e.pull_sheet_cursor(128)),n=this.executeArchive(e=>e.sheet_cursor_pull_finished());if(this.acceptWorksheet){let i=Ge(t,n,void 0,this.prepareRows);try{if(i.kind===`preview`)i.worksheet&&(i.worksheet.rows=s,qe(i.worksheet,a),this.provisional?.preview(e,i.worksheet));else if(i.kind===`rows`){let e=$e(c,Ze(i.rows,a),a);tt(e,`get-worksheet-worker`,void 0,this.readResourceUsage(),a),s.push(...i.rows),c=e}else i.kind===`finished`&&(l=i.worksheet)}catch(e){throw e instanceof r&&(this.resourceFailure??=e),e}}u=n;let i=De(t);return{payload:i,byteLength:i.byteLength,done:n,transfer:[i]}},measureChunk:({payload:e})=>e.byteLength,acknowledge:()=>{if(!u)return;let t,i;try{if(this.acceptWorksheet){if(!l)throw Error(`worksheet terminal payload is missing`);l.rows=l.parseError?[]:s;let n=l.parseError?{rows:0,cells:0,ownedUtf8Bytes:0}:c,r=Qe(l,n,a),o=this.readResourceUsage();tt(r,`get-worksheet-worker`,void 0,o,a),nt(r.jsonBytes,`get-worksheet-worker`,void 0,o,a),qe(l,a);let u=this.acceptWorksheet(e,l,r,o);typeof u==`function`?t=u:u&&({rollback:t,commit:i}=u)}this.executeArchive(e=>e.acknowledge_sheet_cursor_terminal()),i?.()}catch(e){throw t?.(),e instanceof r&&(this.resourceFailure??=e),e}u=!1,this.sessions.delete(n.sessionId),this.provisional?.stop(e),o()},cancel:()=>{try{this.archive()&&this.executeArchive(e=>e.cancel_sheet_cursor())}finally{this.sessions.delete(n.sessionId),this.provisional?.stop(e),o()}},close:()=>{try{this.archive()&&this.executeArchive(e=>e.close_sheet_cursor())}finally{this.sessions.delete(n.sessionId),this.provisional?.stop(e),o()}},resourceUsage:()=>this.readResourceUsage()}});this.sessions.set(n.sessionId,{host:d,identity:n}),this.pendingOpens.delete(n.sessionId)}));this.operationTail=c.then(()=>s,()=>void 0);try{await c}catch(e){throw this.pendingOpens.delete(n.sessionId),o(),e}}async postOpenedSafely(e,t,n){try{t()}catch(t){await this.closeIdentity(e);try{n(t)}catch{}}}dispatch(e,t){let n=this.sessions.get(e.sessionId);if(n)return n.host.dispatch(e,t);let r=this.pendingOpens.get(e.sessionId);if(r&&(e.kind===`cancel`||e.kind===`close`)){let n=r.identity.operationId===e.operationId&&r.identity.generation===e.generation;return n&&(r.canceled=!0),t(n?{protocol:E,kind:`accepted`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,command:e.kind}:{protocol:E,kind:`error`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:{message:`stale lifecycle targets another pending worksheet operation`,errorName:`PullSessionProtocolError`,code:`ooxml-stale-lifecycle`}}),Promise.resolve()}return e.kind===`cancel`||e.kind===`close`?(t({protocol:E,kind:`accepted`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,command:e.kind}),Promise.resolve()):(t({protocol:E,kind:`error`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:w(Error(`worksheet pull session is not open`))}),Promise.resolve())}async dispatchSafely(e,t){try{await this.dispatch(e,t)}catch(n){try{t({protocol:E,kind:`error`,sessionId:e.sessionId,operationId:e.operationId,generation:e.generation,requestId:e.requestId,error:w(n)})}catch{}}}run(e){let t=this.operationTail.then(()=>this.coordinator.enqueue(async()=>{if(this.resourceFailure)throw this.resourceFailure;return e()})).catch(e=>{throw e instanceof r&&(this.resourceFailure??=e),e});return this.operationTail=t.then(()=>void 0,()=>void 0),t}async reset(){for(let e of this.pendingOpens.values())e.canceled=!0;let e=1;for(let{host:t,identity:n}of[...this.sessions.values()])await t.dispatch({protocol:E,kind:`close`,...n,requestId:e++},()=>void 0);this.sessions.clear(),await this.operationTail,this.pendingOpens.clear(),this.resourceFailure=void 0}requireArchive(){let e=this.archive();if(!e)throw Error(`Workbook not loaded`);return e}async closeIdentity(e){let t=this.sessions.get(e.sessionId);if(t){await t.host.dispatch({protocol:E,kind:`close`,...e,requestId:1},()=>void 0);return}let n=this.pendingOpens.get(e.sessionId);n&&n.identity.operationId===e.operationId&&n.identity.generation===e.generation&&(n.canceled=!0)}readResourceUsage(){return g(this.executeArchive(e=>e.sheet_cursor_resource_usage()))}};function it(e){return!!e&&typeof e==`object`&&e.protocol===`ooxml-pull-v1`}const Z=new Te(Be,{freeArchive:e=>e.free(),reinit:Ve});let Q=A;const $=new rt(()=>Z.archive,void 0,e=>{let t=Z.archive;if(!t)throw Error(`Workbook not loaded`);return Z.run(()=>e(t))},void 0,void 0,()=>Q);self.onmessage=async e=>{let n=e.data;if(it(n)){await $.dispatchSafely(n,(e,t)=>self.postMessage(e,t));return}if(n.type===`init`){Z.setWasmInput(t(n.wasmUrl)??n.wasmUrl);return}let r=n.id;n.type===`openSheetSession`&&$.reserveOpen(n);try{let e=n.type===`parse`?Me({xlsxWorksheetLimits:n.worksheetPolicy?.worksheet}):void 0;if(n.type===`openSheetSession`){await Z.ensureReady(),Z.archive&&Z.run(()=>Z.archive?.assert_healthy()),await $.open(n.sheetIndex,n.sheetName,n),await $.postOpenedSafely(n,()=>self.postMessage({type:`sheetSessionOpened`,id:r,sessionId:n.sessionId,operationId:n.operationId,generation:n.generation}),e=>self.postMessage({type:`error`,id:r,...w(e)}));return}n.type===`parse`&&await $.reset(),await(n.type===`extractImage`?$.runDuringPull:$.run).call($,async()=>{if(await Z.ensureReady(),n.type!==`parse`&&Z.archive){let e=Z.archive;Z.run(()=>e.assert_healthy())}if(n.type===`parse`){let[t,i,a]=Oe(n.resourcePolicy),o=new Uint8Array(n.data);Q=e??A;let s=Ne(Q),{workbook:c,usage:l}=He(()=>Z.run(()=>{let e=new M(o,t,i,a);return Z.setArchive(e),e.set_worksheet_limits(...s),e.parse()}),()=>Z.run(()=>Z.archive.resource_usage())),u=c.buffer,d={type:`parsed`,id:r,workbookJson:u,usage:l};self.postMessage(d,[u]);return}let t=Z.archive;if(n.type===`extractImage`){if(!t)throw Error(`No xlsx loaded`);let e=Z.run(()=>t.extract_image(n.path).buffer),i={type:`imageExtracted`,id:r,bytes:e};self.postMessage(i,[e]);return}if(n.type===`resourceUsage`){if(!t)throw Error(`No xlsx loaded`);let e=Z.run(()=>g(t.resource_usage()));self.postMessage({type:`resourceUsage`,id:r,usage:e});return}if(n.type===`toMarkdown`){if(!t)throw Error(`No xlsx loaded`);let e={type:`markdownRendered`,id:r,markdown:Z.run(()=>t.to_markdown())};self.postMessage(e);return}})}catch(e){n.type===`openSheetSession`&&$.abandonOpen(n.sessionId);let t={type:`error`,id:r,...w(e)};try{self.postMessage(t)}catch{}}};", Jt = typeof self < "u" && self.Blob && new Blob(["URL.revokeObjectURL(import.meta.url);", qt], { type: "text/javascript;charset=utf-8" });
function Yt(e) {
	let t;
	try {
		if (t = Jt && (self.URL || self.webkitURL).createObjectURL(Jt), !t) throw "";
		let n = new Worker(t, {
			type: "module",
			name: e?.name
		});
		return n.addEventListener("error", () => {
			(self.URL || self.webkitURL).revokeObjectURL(t);
		}), n;
	} catch {
		return new Worker("data:text/javascript;charset=utf-8," + encodeURIComponent(qt), {
			type: "module",
			name: e?.name
		});
	}
}
var Xt = new URL("xlsx_parser_bg.wasm", import.meta.url).href;
function Zt(e, t) {
	return !Number.isInteger(t) || t < 0 || t >= e.length ? "visible" : e[t].visibility ?? "visible";
}
var Qt = Symbol("xlsx-render-commit-guard");
function $t(e, t) {
	return {
		...e,
		[Qt]: t
	};
}
function en(e, t) {
	return e === void 0 ? t : t === void 0 ? e : Math.max(e, t);
}
function tn(e, t) {
	if (!e && !t) return null;
	let n = e ? 1 - e.l - e.r : 1, r = (t ? 1 - t.l - t.r : 1) < n ? t : e, i = e ? 1 - e.t - e.b : 1, a = (t ? 1 - t.t - t.b : 1) < i ? t : e;
	return {
		l: r?.l ?? 0,
		r: r?.r ?? 0,
		t: a?.t ?? 0,
		b: a?.b ?? 0
	};
}
function nn(e, t) {
	return e ? t ? e === t ? e : void 0 : e : t;
}
function rn(e, t) {
	return {
		...e,
		svgImagePath: nn(e.svgImagePath, t.svgImagePath),
		widthPt: en(e.widthPt, t.widthPt),
		heightPt: en(e.heightPt, t.heightPt),
		srcRect: tn(e.srcRect, t.srcRect),
		failClosedOnDuotoneFailure: e.failClosedOnDuotoneFailure || t.failClosedOnDuotoneFailure || void 0,
		targetWidthPx: en(e.targetWidthPx, t.targetWidthPx),
		targetHeightPx: en(e.targetHeightPx, t.targetHeightPx)
	};
}
function an(e, t, n) {
	let r = e.get(t);
	e.set(t, r ? rn(r, n) : n);
}
function on(e, t, n, r) {
	let { col: i, row: a } = (n ?? V(t)).axesAtScale(r), o = Fe(t, e, i, a, r);
	return o.width > 0 && o.height > 0 ? {
		width: o.width,
		height: o.height
	} : null;
}
var sn = {
	x: 0,
	y: 0
};
function cn(e, t, n, r, i) {
	if (!e?.length) return sn;
	let a = re(e, t, n);
	return a === null ? null : a.x === 0 && a.y === 0 ? sn : r > 0 && i > 0 ? {
		x: a.x / r,
		y: a.y / i
	} : null;
}
function ln(e, t) {
	return e === null || t === null ? null : {
		x: Math.max(e.x, t.x),
		y: Math.max(e.y, t.y)
	};
}
function un(e, t, n, r, i, a = sn) {
	if (!n || a === null) return e.anchorTag === void 0 || on(e, t, r, i?.scale ?? 1) !== null;
	let o = r ?? V(t), s = i?.scale ?? 1, { col: c, row: l } = o.axesAtScale(s), u = Fe(t, e, c, l, s);
	if (u.width <= 0 || u.height <= 0) return !1;
	let d = u.width * a.x, f = u.height * a.y, p = Le({
		x: u.x - d,
		y: u.y - f,
		width: u.width + 2 * d,
		height: u.height + 2 * f
	}, e.rotation), m = i ? o.effectiveFrozenBands({
		scale: s,
		width: i.width,
		height: i.height,
		headerWidth: 50,
		headerHeight: 22,
		rows: i.freezeRows,
		cols: i.freezeCols
	}) : {
		rows: t.freezeRows ?? 0,
		cols: t.freezeCols ?? 0
	}, h = (e, t, n, r, i) => {
		let a = Math.min(e, t), o = Math.max(e, t);
		return a < n && o > 0 || a < i && o > r;
	};
	return h(p.x, p.x + p.width, c.offsetOf(m.cols + 1), c.offsetOf(n.col), c.offsetOf(n.col + n.cols)) && h(p.y, p.y + p.height, l.offsetOf(m.rows + 1), l.offsetOf(n.row), l.offsetOf(n.row + n.rows));
}
async function dn(e, t, r, i, a = 0, o = 0, s = null, c = null, l, u = !1, d, f, p, m) {
	let h = t === "image/svg+xml", v = c && "effects" in c ? s && !n(s) ? null : {
		widthPt: a,
		heightPt: o
	} : _(t, s, a, o);
	if (!v) return null;
	let y = () => te(e, t, c, i, {
		widthPt: v.widthPt,
		heightPt: v.heightPt,
		offscreenFactory: l,
		failClosedOnDuotoneFailure: u,
		tiff: d,
		svgDecoder: p ?? (typeof Image < "u" ? ee : void 0),
		...f ?? {},
		...m ? { maxRetainedPixels: m } : {}
	}), b = {
		svgImagePath: r,
		srcRect: s
	};
	if (!c && M(b)) try {
		return await L(b.svgImagePath, i, {
			...f,
			maxRetainedPixels: m,
			workerDecoder: p
		});
	} catch (t) {
		if (t instanceof g || z(t)) throw t;
		return h ? L(e, i, {
			...f,
			maxRetainedPixels: m,
			workerDecoder: p
		}) : y();
	}
	return h && c ? y() : h ? L(e, i, {
		...f,
		maxRetainedPixels: m,
		workerDecoder: p
	}) : y();
}
async function fn(e, n, s, _) {
	if (n.clear(), gt(n), !s) return;
	let v = s, y = /* @__PURE__ */ new Map(), b = _?.viewport ? V(e) : void 0, x = _?.viewport && _.width !== void 0 && _.height !== void 0 ? {
		width: _.width,
		height: _.height,
		scale: _.cellScale ?? 1,
		freezeRows: _.freezeRows ?? e.freezeRows ?? 0,
		freezeCols: _.freezeCols ?? e.freezeCols ?? 0
	} : void 0;
	if (e.images) for (let t of e.images) {
		if (!un(t, e, _?.viewport, b, x, ((e) => cn(t.blipEffects, e.cx, e.cy, e.cx, e.cy))(mt(t)))) continue;
		let n = on(t, e, b, _?.cellScale ?? 1), i = mt(t), s = tt(t, i), c = t.blipEffects?.length ? it(i) : null;
		an(y, et(t.imagePath, s, i), {
			imagePath: t.imagePath,
			mimeType: t.mimeType,
			svgImagePath: t.svgImagePath,
			widthPt: c ? c.widthPt : t.anchorTag === void 0 ? t.nativeExtCx > 0 ? t.nativeExtCx / a : 0 : (n?.width ?? 0) * (r / a),
			heightPt: c ? c.heightPt : t.anchorTag === void 0 ? t.nativeExtCy > 0 ? t.nativeExtCy / a : 0 : (n?.height ?? 0) * (r / a),
			srcRect: t.srcRect ?? null,
			duotone: s,
			...(() => {
				let e = n && _?.effectiveDpr ? o(n.width * _.effectiveDpr, n.height * _.effectiveDpr, t.srcRect) : null;
				return e ? {
					targetWidthPx: e.width,
					targetHeightPx: e.height
				} : {};
			})()
		});
	}
	if (e.shapeGroups) {
		for (let t of e.shapeGroups) if (un(t, e, _?.viewport, b, x, t.shapes.reduce((e, n) => n.geom?.type === "image" ? ln(e, cn(n.geom.blipEffects, t.nativeExtCx * n.w, t.nativeExtCy * n.h, t.nativeExtCx, t.nativeExtCy)) : e, sn))) {
			for (let n of t.shapes) if (n.geom.type === "image") {
				let i = on(t, e, b, _?.cellScale ?? 1), s = $e(t, n), c = tt(n.geom, s), l = n.geom.blipEffects?.length ? it(s) : null;
				an(y, et(n.geom.imagePath, c, s), {
					imagePath: n.geom.imagePath,
					mimeType: n.geom.mimeType,
					svgImagePath: n.geom.svgImagePath,
					widthPt: l ? l.widthPt : t.anchorTag === void 0 ? t.nativeExtCx > 0 ? t.nativeExtCx * n.w / a : 0 : (i?.width ?? 0) * n.w * (r / a),
					heightPt: l ? l.heightPt : t.anchorTag === void 0 ? t.nativeExtCy > 0 ? t.nativeExtCy * n.h / a : 0 : (i?.height ?? 0) * n.h * (r / a),
					srcRect: n.geom.srcRect ?? null,
					duotone: c,
					...(() => {
						let e = i && _?.effectiveDpr ? o(i.width * n.w * _.effectiveDpr, i.height * n.h * _.effectiveDpr, n.geom.srcRect) : null;
						return e ? {
							targetWidthPx: e.width,
							targetHeightPx: e.height
						} : {};
					})()
				});
			}
		}
	}
	let S = e.charts ?? [], C = S.length > 0 ? b ?? V(e) : b, w = [];
	for (let t of S) {
		if (!un(t, e, _?.viewport, C, x)) continue;
		let n = on(t, e, C, _?.cellScale ?? 1);
		if (!n || !Number.isFinite(n.width) || !Number.isFinite(n.height) || n.width <= 0 || n.height <= 0) continue;
		let i = f(t.chart), o = {
			widthPt: n.width * (r / a),
			heightPt: n.height * (r / a),
			targetWidthPx: _?.effectiveDpr === void 0 ? void 0 : n.width * _.effectiveDpr,
			targetHeightPx: _?.effectiveDpr === void 0 ? void 0 : n.height * _.effectiveDpr
		}, s = [], c = !0;
		for (let e of i) {
			let t = u(e, o);
			if (!t) {
				c = !1;
				break;
			}
			s.push({
				usage: e,
				size: t
			});
		}
		c && w.push({
			chart: t,
			frame: o,
			usages: s,
			displayWidth: n.width,
			displayHeight: n.height
		});
	}
	let T = d(w.map(({ chart: e }) => e.chart), (e, t) => u(e, w[t].frame) != null), E = /* @__PURE__ */ new Map();
	for (let e of T) {
		let { fill: t } = e;
		if (p(t)) continue;
		let n = m(t);
		E.set(n, {
			fill: t,
			widthPt: 0,
			heightPt: 0,
			preserveNaturalSize: e.preserveNaturalSize,
			hasSourceCrop: e.hasSourceCrop
		});
	}
	let D = new Set(T.map(({ fill: e }) => c(e))), O = (e) => {
		let t = [], n = _?.cellScale ?? 1;
		for (let r of w) for (let { fill: a, occurrence: o } of de(r.chart.chart, {
			x: 0,
			y: 0,
			w: r.displayWidth / n,
			h: r.displayHeight / n
		}, i, 0, _?.threeD, _?.regionMap, _?.chartEx, e)) {
			if (!D.has(c(a))) continue;
			let e = m(a, void 0, o);
			E.has(e) || (E.set(e, {
				fill: a,
				widthPt: o.widthPt,
				heightPt: o.heightPt,
				preserveNaturalSize: !0,
				hasSourceCrop: a.srcRect != null,
				renderedSize: o
			}), t.push(e));
		}
		return fe(E.size), t;
	};
	O();
	for (let e of w) for (let { usage: t, size: n } of e.usages) {
		let { fill: e } = t;
		if (p(e)) continue;
		let r = m(e), i = E.get(r);
		if (!i) continue;
		let a = i.preserveNaturalSize || t.preserveNaturalSize;
		E.set(r, {
			...i,
			widthPt: Math.max(i.widthPt, n.widthPt),
			heightPt: Math.max(i.heightPt, n.heightPt),
			targetWidthPx: a ? void 0 : Math.max(i.targetWidthPx ?? 0, n.targetWidthPx ?? 0) || void 0,
			targetHeightPx: a ? void 0 : Math.max(i.targetHeightPx ?? 0, n.targetHeightPx ?? 0) || void 0,
			preserveNaturalSize: a,
			hasSourceCrop: i.hasSourceCrop || t.hasSourceCrop
		});
	}
	let A = (e, t) => {
		let { fill: n, widthPt: r, heightPt: i, targetWidthPx: a, targetHeightPx: o, hasSourceCrop: s, renderedSize: c } = t;
		an(y, e, {
			imagePath: n.imagePath,
			mimeType: n.mimeType,
			svgImagePath: n.svgImagePath,
			widthPt: c ? c.widthPt : n.blipEffects?.length ? 0 : r,
			heightPt: c ? c.heightPt : n.blipEffects?.length ? 0 : i,
			srcRect: s ? {
				l: 0,
				t: 0,
				r: 0,
				b: 0
			} : null,
			duotone: l(n, void 0, c),
			failClosedOnDuotoneFailure: !0,
			...a && o && !n.blipEffects?.length ? {
				targetWidthPx: a,
				targetHeightPx: o
			} : {}
		});
	};
	for (let [e, t] of E) A(e, t);
	if (y.size === 0) return;
	let j = ae(_?.imageResources), ee = k((await Promise.all([...y].map(async ([e, t]) => {
		if (!t.targetWidthPx || !t.targetHeightPx || t.mimeType === "image/svg+xml" || t.duotone || !t.duotone && M({
			svgImagePath: t.svgImagePath,
			srcRect: t.srcRect
		})) return null;
		if (ce(t.mimeType) && (j.resolution === "display" || j.strategy === "adaptive")) return {
			key: e,
			targetWidthPx: t.targetWidthPx,
			targetHeightPx: t.targetHeightPx,
			retainedSurfaceCount: 1
		};
		let n = await P(t.imagePath, t.mimeType, v).catch((e) => {
			if (e instanceof g || z(e)) throw e;
			return null;
		});
		return !n?.dimensions || !le(n.format, _?.tiff !== void 0) ? null : {
			key: e,
			targetWidthPx: t.targetWidthPx,
			targetHeightPx: t.targetHeightPx,
			sourceWidthPx: n.dimensions.width,
			sourceHeightPx: n.dimensions.height,
			retainedSurfaceCount: 1
		};
	}))).filter((e) => e !== null), j);
	for (let [e, t] of y) {
		if (t.mimeType === "image/svg+xml" || !t.duotone && M({
			svgImagePath: t.svgImagePath,
			srcRect: t.srcRect
		})) continue;
		let n = ee.targets.get(e);
		t.targetWidthPx = n?.width, t.targetHeightPx = n?.height, t.plannedPixelLimit = n?.maxRetainedPixels;
	}
	let N = async ([e, r]) => {
		try {
			let t = await dn(r.imagePath, r.mimeType, r.svgImagePath, v, r.widthPt, r.heightPt, r.srcRect, r.duotone, _?.offscreenFactory, r.failClosedOnDuotoneFailure ?? !1, _?.tiff, r.targetWidthPx && r.targetHeightPx ? {
				targetWidthPx: r.targetWidthPx,
				targetHeightPx: r.targetHeightPx
			} : void 0, _?.svgDecoder, r.plannedPixelLimit);
			n.set(e, t);
		} catch (r) {
			if (ue(r, "tiff") || pe(r)) {
				n.set(e, null), Ye(n, e, "tiff");
				return;
			}
			if (r instanceof g || z(r) || r instanceof t && r.code === "unsupported-image-effect") throw r;
			n.delete(e);
		}
	};
	for (await Promise.all([...y.entries()].map(N));;) {
		let e = O(h(n, void 0, !1));
		if (e.length === 0) break;
		for (let t of e) A(t, E.get(t));
		await Promise.all(e.map((e) => N([e, y.get(e)])));
	}
}
var pn = /* @__PURE__ */ new WeakMap();
function mn(e, t, n, r) {
	if (st(t)) return t;
	let i = V(t), a = pn.get(t);
	if (a && a.sourceGeometry === i && xt(a.projection) === xt(t)) return a.projection;
	let o = {
		...t,
		rowHeights: { ...t.rowHeights }
	};
	Wt(t, o), dt(t, o);
	let s = i.maximumDigitWidth;
	return q.forWorksheet(o, s), pt(e, o, n, r), q.forWorksheet(o, s), pn.set(t, {
		projection: o,
		sourceGeometry: i
	}), o;
}
async function hn(e, t, n, r = {}, i) {
	let a = () => gn(e, t, n, r, i), o = !e.ws.isDialogSheet && ((e.ws.images?.length ?? 0) > 0 || (e.ws.shapeGroups?.some((e) => e.shapes.some((e) => e.geom.type === "image")) ?? !1) || d((e.ws.charts ?? []).map((e) => e.chart)).length > 0);
	return r.fetchImage && o ? oe(r.fetchImage, r.imageResources, a) : a();
}
async function gn(e, t, n, r = {}, i) {
	if (r[Qt]?.() === !1) return;
	let a = e.styles, o = t.getContext("2d");
	if (!o) throw Error("XLSX render target does not provide a 2-D canvas context");
	lt(o, e.ws, r.officeFontRoutes, r.googleSubstitutes === !0), nt(e.ws, r.authoritativeMdw);
	let c = e.ws.isDialogSheet ? e.ws : mn(o, e.ws, a, e.cjkFallback), l = b(t) ? t.clientWidth || 800 : t.width, u = b(t) ? t.clientHeight || 600 : t.height, d = r.width ?? l, f = r.height ?? u, p = r.dpr ?? D(), m = s(d * p, f * p), h = m.clamped ? p * m.scale : p, g = /* @__PURE__ */ new Map();
	if (c.isDialogSheet || await fn(c, g, r.fetchImage, {
		viewport: n,
		width: d,
		height: f,
		cellScale: r.cellScale,
		freezeRows: r.freezeRows,
		freezeCols: r.freezeCols,
		tiff: e.tiff,
		effectiveDpr: h,
		svgDecoder: i,
		imageResources: r.imageResources,
		threeD: e.threeD,
		regionMap: e.regionMap,
		chartEx: e.chartEx
	}), !c.isDialogSheet && e.math && _t(c) && await Ze(c, e.math), r[Qt]?.() === !1) return;
	let _ = m.width, v = m.height;
	if (t.width !== _ && (t.width = _), t.height !== v && (t.height = v), b(t)) {
		let e = `${d}px`, n = `${f}px`;
		t.style.width !== e && (t.style.width = e), t.style.height !== n && (t.style.height = n);
	}
	let y = t.getContext("2d");
	if (y.setTransform(h, 0, 0, h, 0, 0), c.parseError) {
		vn(y, d, f, c.name, c.parseError);
		return;
	}
	if (c.isDialogSheet) {
		_n(y, d, f);
		return;
	}
	ht(y, c, a, n, {
		...r,
		dpr: h,
		loadedImages: g,
		threeD: e.threeD,
		regionMap: e.regionMap,
		chartEx: e.chartEx
	}, e.cjkFallback);
}
function _n(e, t, n) {
	e.save(), e.fillStyle = "#f7f7f8", e.fillRect(0, 0, t, n);
	let r = Math.min(t, n);
	e.fillStyle = "#555555", e.textAlign = "center", e.textBaseline = "middle", e.font = `${Math.max(13, r * .035)}px sans-serif`, e.fillText("Legacy dialog sheets are not displayed", t / 2, n / 2), e.restore();
}
function vn(e, t, n, r, i) {
	e.save(), e.fillStyle = "#f7f7f8", e.fillRect(0, 0, t, n);
	let a = t / 2, o = Math.min(t, n), s = Math.max(20, o * .1);
	e.fillStyle = "#b23b3b", e.textAlign = "center", e.textBaseline = "middle", e.font = `${s}px sans-serif`, e.fillText("⚠", a, n * .32);
	let c = Math.max(13, o * .035);
	e.fillStyle = "#333333", e.font = `600 ${c}px sans-serif`, e.fillText(`Sheet "${r}" could not be displayed`, a, n * .46);
	let l = Math.max(10, o * .022);
	e.fillStyle = "#666666", e.font = `${l}px sans-serif`;
	let u = Math.min(t * .8, 640), d = i.split(/\s+/), f = [], p = "";
	for (let t of d) {
		let n = p ? `${p} ${t}` : t;
		if (e.measureText(n).width > u && p ? (f.push(p), p = t) : p = n, f.length >= 4) break;
	}
	p && f.length < 4 && f.push(p);
	let m = l * 1.4, h = n * .52 + m;
	for (let t of f.slice(0, 4)) e.fillText(t, a, h), h += m;
	e.restore();
}
function yn(e) {
	let t = (e ?? "").trim();
	if (!t) return {
		kind: "unresolved",
		formula: ""
	};
	if (t.length >= 2 && t.startsWith("\"") && t.endsWith("\"")) return {
		kind: "inline",
		values: t.slice(1, -1).split(",").map((e) => e.trim()).filter((e) => e.length > 0)
	};
	let n, r = t, i = t.indexOf("!");
	if (i >= 0) {
		let e = t.slice(0, i);
		e.startsWith("'") && e.endsWith("'") && e.length >= 2 && (e = e.slice(1, -1).replace(/''/g, "'")), n = e, r = t.slice(i + 1);
	}
	let [a, o] = r.split(":"), s = B(a ?? "");
	if (s) {
		let e = o ? B(o) : s;
		if (e) {
			let t = {
				row: Math.min(s.row, e.row),
				col: Math.min(s.col, e.col)
			}, r = {
				row: Math.max(s.row, e.row),
				col: Math.max(s.col, e.col)
			};
			return {
				kind: "range",
				sheet: n,
				start: t,
				end: r
			};
		}
	}
	return {
		kind: "unresolved",
		formula: t
	};
}
function bn(e, t) {
	if (e.kind === "inline") return {
		kind: "values",
		values: e.values
	};
	if (e.kind === "unresolved") return {
		kind: "formula",
		formula: e.formula
	};
	let n = [];
	for (let r = e.start.row; r <= e.end.row; r++) for (let i = e.start.col; i <= e.end.col; i++) {
		let e = t(r, i);
		e != null && e !== "" && n.push(e);
	}
	return {
		kind: "values",
		values: n
	};
}
function xn(e) {
	let { cell: t, panel: n, viewport: r, rtl: i } = e, a = t.y + t.h + 2, o = t.y - 2 - n.h, s;
	s = a + n.h <= r.h ? a : o >= 0 ? o : a, s = Math.max(0, Math.min(s, r.h - n.h));
	let c = i ? t.x + t.w - n.w : t.x;
	return c = Math.max(0, Math.min(c, r.w - n.w)), {
		left: c,
		top: s
	};
}
function Sn(e, t) {
	let n = !1;
	for (let [r, i] of Object.entries(t)) {
		let t = Number(r);
		i === null ? Object.hasOwn(e, t) && (delete e[t], n = !0) : e[t] !== i && (e[t] = i, n = !0);
	}
	return n;
}
function Cn(e, t) {
	if (!t) return;
	let n = !1;
	if (t.rowHeightRanges && (Kt(e, t.rowHeightRanges), n = !0), t.rows && (n = Sn(e.rowHeights, t.rows) || n), t.cols && (n = Sn(e.colWidths, t.cols) || n), t.columnCssWidths) for (let [r, i] of Object.entries(t.columnCssWidths)) W(e, Number(r), i) && (n = !0);
	n && q.invalidate(e);
}
function wn(e, t) {
	return t ? Tn(e, t) : e;
}
function Tn(e, t) {
	let n = { ...e };
	return t && (n.rowHeights = { ...e.rowHeights }, n.colWidths = { ...e.colWidths }), Xe(e, n), U(e, n), Wt(e, n), Cn(n, t), n;
}
var En = Symbol("xlsx-viewer-render-context");
function Dn(e, t, n) {
	if (!Number.isFinite(t) || t <= 0) throw Error("XLSX maximum digit width must be a finite positive number");
	return {
		...e,
		[En]: {
			maximumDigitWidth: t,
			worksheet: n?.worksheet,
			projection: n?.projection
		}
	};
}
function On(e) {
	let t = e[En], n = { ...e };
	return delete n[En], t ? {
		opts: n,
		layoutMetrics: { maximumDigitWidth: t.maximumDigitWidth },
		worksheet: t.worksheet,
		projection: t.projection
	} : { opts: n };
}
var kn = "load-delimited-text", J = jt;
function An(e) {
	if (e > J) throw Dt(kn, void 0, "delimited-text-source", "bytes", J, e);
}
Object.freeze({
	fonts: [Object.freeze({
		bold: !1,
		italic: !1,
		underline: !1,
		strike: !1,
		size: 11,
		color: null,
		name: "Calibri"
	})],
	fills: [Object.freeze({
		patternType: "none",
		fgColor: null,
		bgColor: null
	})],
	borders: [Object.freeze({
		left: null,
		right: null,
		top: null,
		bottom: null
	})],
	cellXfs: [Object.freeze({
		fontId: 0,
		fillId: 0,
		borderId: 0,
		numFmtId: 0,
		alignH: null,
		alignV: null,
		wrapText: !1
	})],
	numFmts: [],
	dxfs: []
});
function jn(e) {
	if (!e || e.format !== "csv" && e.format !== "tsv" && e.format !== "delimited-text") throw TypeError("format must be 'csv', 'tsv', or 'delimited-text'");
	let t = e.delimiter ?? (e.format === "tsv" ? "	" : e.format === "csv" ? "," : void 0);
	if (t === void 0) throw TypeError("delimiter is required for format 'delimited-text'");
	if (t.length !== 1) throw TypeError("delimiter must be exactly one character");
	if (t === "\"" || t === "\r" || t === "\n") throw TypeError("delimiter cannot be a quote or record separator");
	let n = e.encoding ?? "utf-8";
	if (typeof n != "string" || n.trim() === "") throw TypeError("encoding must be a non-empty TextDecoder label");
	let r = e.sheetName ?? "Sheet1";
	if (typeof r != "string" || r.trim() === "") throw TypeError("sheetName must be a non-empty string");
	return Object.freeze({
		delimiter: t,
		encoding: n,
		sheetName: r
	});
}
async function Mn(e) {
	let t = e.headers.get("content-encoding")?.trim().toLowerCase(), n = e.headers.get("content-length");
	if ((!t || t === "identity") && n !== null && /^\d+$/.test(n.trim())) {
		let t = Number(n);
		t > J && (await e.body?.cancel().catch(() => void 0), An(t));
	}
	let r = e.body;
	if (!r) return /* @__PURE__ */ new ArrayBuffer(0);
	let i = r.getReader(), a = [], o = 0;
	try {
		for (;;) {
			let { done: e, value: t } = await i.read();
			if (e) break;
			!t || t.byteLength === 0 || (t.byteLength > J - o && (await i.cancel().catch(() => void 0), An(J + 1)), a.push(t), o += t.byteLength);
		}
	} finally {
		i.releaseLock();
	}
	let s = new Uint8Array(o), c = 0;
	for (let e of a) s.set(e, c), c += e.byteLength;
	return s.buffer;
}
var Nn = class {
	rows;
	ready;
	resolveReady;
	rejectReady;
	settledReady = !1;
	waiters = [];
	worksheet = null;
	reason = null;
	maxRow = 0;
	maxCol = 0;
	coveredThrough = 0;
	complete = !1;
	failure;
	constructor(e) {
		this.rows = e, this.ready = new Promise((e, t) => {
			this.resolveReady = e, this.rejectReady = t;
		}), this.ready.catch(() => void 0);
	}
	preview(e, t, n, r) {
		this.reason = t, this.maxRow = n, this.maxCol = r, e && (e.rows = this.rows, this.worksheet = e);
	}
	append(e) {
		e.length !== 0 && (this.rows.push(...e), this.coveredThrough = e[e.length - 1].index, this.worksheet && !this.settledReady && this.resolveFirst(this.worksheet), this.flush());
	}
	finish(e) {
		this.complete = !0, this.coveredThrough = 2 ** 53 - 1, this.settledReady || this.resolveFirst(e), this.flush();
	}
	fail(e) {
		this.failure = e, this.settledReady || (this.settledReady = !0, this.rejectReady(e));
		for (let t of this.waiters.splice(0)) t.reject(e);
	}
	waitFor(e) {
		return this.failure === void 0 ? this.complete || this.coveredThrough >= e ? Promise.resolve() : new Promise((t, n) => {
			this.waiters.push({
				row: e,
				resolve: t,
				reject: n
			});
		}) : Promise.reject(this.failure);
	}
	resolveFirst(e) {
		this.settledReady = !0, this.resolveReady(e);
	}
	flush() {
		let e = this.waiters;
		this.waiters = [];
		for (let t of e) this.complete || this.coveredThrough >= t.row ? t.resolve() : this.waiters.push(t);
	}
}, Pn = /* @__PURE__ */ new WeakMap(), Fn = Object.freeze({
	minRows: 50,
	minCols: 26
});
function In(e, t) {
	Pn.set(e, t);
}
function Ln(e, t) {
	let n = Pn.get(e);
	n && Pn.set(t, n);
}
function Rn(e, t = {}) {
	let n = Pn.get(e), r = Math.max(t.minRows ?? Fn.minRows, e.freezeRows ?? 0, n?.maxRow ?? 0), i = Math.max(t.minCols ?? Fn.minCols, e.freezeCols ?? 0, n?.maxCol ?? 0);
	for (let t of e.rows) {
		t.index > r && (r = t.index);
		for (let e of t.cells) e.col > i && (i = e.col);
	}
	let a = [
		...e.charts,
		...e.images,
		...e.shapeGroups ?? [],
		...e.slicers ?? []
	];
	for (let e of a) {
		let t = Number.isSafeInteger(e.fromRow) ? e.fromRow + 1 : 0, n = Number.isSafeInteger(e.toRow) ? e.toRow + 1 : 0, a = Number.isSafeInteger(e.fromCol) ? e.fromCol + 1 : 0, o = Number.isSafeInteger(e.toCol) ? e.toCol + 1 : 0;
		r = Math.max(r, t, n), i = Math.max(i, a, o);
	}
	return {
		maxRow: Math.min(K, r),
		maxCol: Math.min(G, i)
	};
}
var zn = Symbol("retain-xlsx-viewer-fonts"), Bn = Symbol("prepare-xlsx-viewer-row-heights"), Vn = Symbol("release-xlsx-viewer-projection"), Hn = Symbol("load-xlsx-sheet-source"), Un = class e {
	metrics = null;
	bridge = null;
	delimitedTextBacked = !1;
	japaneseCellFonts = Ve();
	parsedWorkbook = null;
	sheetCache = /* @__PURE__ */ new Map();
	sheetCacheUsage = /* @__PURE__ */ new Map();
	sheetLeases = /* @__PURE__ */ new Map();
	evictingSheets = /* @__PURE__ */ new Map();
	sheetLoads = /* @__PURE__ */ new Map();
	sheetPreviews = /* @__PURE__ */ new Map();
	rawParts = new ie({
		maxEntries: 64,
		maxBytes: R
	});
	queuedImageLoads = /* @__PURE__ */ new Map();
	_fetchImage = (e, t) => this.getImageWithinArchiveOperation(e, t);
	worksheetPolicy = It;
	cjkFallback = "jp";
	math;
	threeD;
	regionMap;
	chartEx;
	tiff;
	googleFontNames = [];
	googleSubstitutes = !1;
	officeFontRequests = [];
	retainedFontSets = /* @__PURE__ */ new Map();
	fontsDestroyed = !1;
	_mode = "main";
	generation = 0;
	archiveOperationTail = Promise.resolve();
	worksheetPullClient = null;
	workerTimeoutMs;
	retainedSheetUsage = {
		rows: 0,
		cells: 0,
		ownedUtf8Bytes: 0,
		jsonBytes: 0
	};
	resourceFailure = null;
	constructor(e, t, n, r = !0) {
		if (this._mode = t, e && (this.bridge = new _e(e, {
			correlate: (e) => "protocol" in e && e.protocol === "ooxml-pull-v1" ? e.requestId : "id" in e ? e.id : void 0,
			toError: (e) => "type" in e && e.type === "error" ? A(e) : void 0,
			onUnsolicited: (t) => {
				Me((t, n) => e.postMessage(t, n), t);
			}
		}), r)) {
			let e = new URL(n ?? Xt, location.href).href;
			this.bridge.post({
				type: "init",
				wasmUrl: e
			});
		}
	}
	get mode() {
		return this._mode;
	}
	static async [Hn](e, t, n = {}) {
		if (n.format === void 0 || n.format === "xlsx") return await this.load(e, t);
		if (n.format === "csv" || n.format === "tsv" || n.format === "delimited-text") return await this.loadDelimitedText(e, t, n);
		throw TypeError("Unsupported XlsxSheetViewer source format");
	}
	static async loadDelimitedText(t, n, r) {
		let i = H(n);
		n = {
			...n,
			xlsxWorksheetLimits: i.worksheet
		}, n = {
			...n,
			cjkFallback: j(n.cjkFallback)
		};
		let a = jn(r), o = w(n), s = n.mode ?? "main", c = new E({
			enabled: !0,
			format: "xlsx",
			mode: s,
			policy: o.policy,
			formatLimits: { xlsxWorksheetLimits: { ...i.worksheet } },
			onMetrics: o.onResourceMetrics,
			emitToConsole: o.debug
		});
		try {
			if (s === "worker" && (typeof Worker > "u" || typeof OffscreenCanvas > "u")) throw Error("mode: 'worker' requires Worker and OffscreenCanvas support");
			let r = typeof t == "string" ? void 0 : t, i;
			if (typeof t == "string") {
				let e = await fetch(t);
				if (!e.ok) throw Error(`Failed to fetch: ${e.status} ${e.statusText}`);
				i = await Mn(e);
			} else i = t;
			An(i.byteLength), c.setSourceBytes(i.byteLength), c.checkpoint("source ready");
			let o = s === "worker" ? (await import("./render-worker-host-BZoh-wqR.js")).createRenderWorker() : (await import("./delimited-text-worker-host-RwvuSsP2.js")).createDelimitedTextWorker(), l;
			try {
				let t = new e(o, s, void 0, !1);
				return l = t, t.metrics = c, await t._loadDelimitedText(r === i ? i.slice(0) : i, n, a), s === "main" && (t.bridge?.terminate(), t.bridge = null), c.checkpoint("worksheet ready"), c.succeed({ sheets: 1 }), t;
			} catch (e) {
				let t = l;
				throw ye(o, t ? () => t.destroy() : void 0), e;
			}
		} catch (e) {
			throw c.fail(e), e;
		}
	}
	static async load(t, n = {}) {
		let r = H(n);
		if (n = {
			...n,
			xlsxWorksheetLimits: r.worksheet
		}, n.legacyXls !== void 0) return (await import("./workbook-model-source-BHR8shXr.js")).loadXlsxModelSource(t, n, e);
		n = {
			...n,
			cjkFallback: j(n.cjkFallback)
		};
		let i = w(n), a = n.mode ?? "main", o = new E({
			enabled: !0,
			format: "xlsx",
			mode: a,
			policy: i.policy,
			formatLimits: { xlsxWorksheetLimits: { ...r.worksheet } },
			onMetrics: i.onResourceMetrics,
			emitToConsole: i.debug
		});
		try {
			if (a === "worker" && (typeof Worker > "u" || typeof OffscreenCanvas > "u")) throw Error("mode: 'worker' requires Worker and OffscreenCanvas support");
			let r = typeof t == "string" ? void 0 : t, s;
			if (typeof t == "string") {
				let e = await fetch(t);
				if (!e.ok) throw Error(`Failed to fetch: ${e.status} ${e.statusText}`);
				s = await e.arrayBuffer();
			} else s = t;
			s = v(await y(s, n.password));
			let c = s === r;
			o.setSourceBytes(s.byteLength), o.checkpoint("container ready");
			let l = a === "worker" ? (await import("./render-worker-host-BZoh-wqR.js")).createRenderWorker() : new Yt(), u;
			try {
				return u = new e(l, a, n.wasmUrl), u.metrics = o, await u._load(s, n, i.policy, (e) => o.observeUsage(e), c), o.checkpoint("workbook index ready"), o.succeed({ sheets: u.sheetCount }), u;
			} catch (e) {
				let t = u;
				throw ye(l, t ? () => t.destroy() : void 0), e;
			}
		} catch (e) {
			throw o.fail(e), e;
		}
	}
	async _load(e, t = {}, n = T(t), r, i = !1) {
		let a = H(t), o = this.requireBridge();
		this.worksheetPolicy = a, this.resourceFailure = null, this.retainedSheetUsage = {
			rows: 0,
			cells: 0,
			ownedUtf8Bytes: 0,
			jsonBytes: 0
		}, this.sheetCache.clear(), this.sheetCacheUsage.clear(), this.sheetLeases.clear(), this.completePendingEvictions(), await this.worksheetPullClient?.cancelAll("closed"), this.worksheetPullClient = null, this.generation = (this.generation ?? 0) + 1, this.workerTimeoutMs = t.workerTimeoutMs, this.googleSubstitutes = t.useGoogleFonts === !0, this.cjkFallback = j(t.cjkFallback), this.math = this._mode === "worker" ? void 0 : t.math, this.threeD = this._mode === "worker" ? void 0 : t.threeD, this.regionMap = this._mode === "worker" ? void 0 : t.regionMap, this.chartEx = this._mode === "worker" ? void 0 : t.chartEx, this.tiff = this._mode === "worker" ? void 0 : t.tiff;
		let s = this._mode === "worker" ? bt(t) : void 0;
		t.math && this._mode === "worker" && !s?.math && console.warn("[ooxml] a custom math renderer cannot cross the worker boundary; equations will be skipped in mode: 'worker'. Use the math renderer from @silurus/ooxml/math."), t.threeD && this._mode === "worker" && !s?.threeD && console.warn("[ooxml] a custom 3-D chart renderer cannot cross the worker boundary; charts use their 2-D family fallback in mode: 'worker'. Use the renderer from @silurus/ooxml/three-d."), t.regionMap && this._mode === "worker" && !s?.regionMap && console.warn("[ooxml] a custom Region Map renderer cannot cross the worker boundary; geospatial charts use the unsupported-chart placeholder in mode: 'worker'. Use the renderer from @silurus/ooxml/region-map."), t.chartEx && this._mode === "worker" && !s?.chartEx && console.warn("[ooxml] a custom ChartEx renderer cannot cross the worker boundary; ChartEx charts use the unsupported-chart placeholder in mode: 'worker'. Use the renderer from @silurus/ooxml/chart-ex."), t.tiff && this._mode === "worker" && !s?.tiff && console.warn("[ooxml] a custom TIFF codec cannot cross the worker boundary; recognized TIFF images will use an unavailable-image placeholder in mode: 'worker'. Use the codec from @silurus/ooxml/tiff to display them.");
		let c = i ? e.slice(0) : e, l = await o.request((e) => this._mode === "worker" ? {
			type: "parse",
			id: e,
			data: c,
			resourcePolicy: n,
			worksheetPolicy: a,
			useGoogleFonts: !!t.useGoogleFonts,
			cjkFallback: this.cjkFallback,
			renderers: s,
			japaneseCellFonts: this.japaneseCellFonts
		} : {
			type: "parse",
			id: e,
			data: c,
			resourcePolicy: n,
			worksheetPolicy: a
		}, [c], { timeoutMs: t.workerTimeoutMs });
		if (this._mode === "worker") {
			let e = l;
			this.parsedWorkbook = e.workbook, e.usage && r?.(e.usage);
		} else {
			let { workbookJson: e, usage: t } = l;
			t && r?.(t), this.parsedWorkbook = JSON.parse(new TextDecoder().decode(new Uint8Array(e)));
		}
		let u = this.parsedWorkbook;
		if (!u) throw Error("XLSX worker returned no workbook metadata");
		this.cjkFallback = Be(u, this.cjkFallback), this.ensureWorksheetPullClient();
		let d = u.workbook.parseError;
		d && console.warn(`[ooxml] xlsx opened with a degraded part: ${d}`), this.officeFontRequests = Ue(u), t.useGoogleFonts && (this.googleFontNames = [...He(u, this.cjkFallback)]), typeof document < "u" && document.fonts && await this.retainFontsInSet(document.fonts);
	}
	async _loadDelimitedText(e, t, n) {
		let r = H(t), i = this.requireBridge();
		this.worksheetPolicy = r, this.delimitedTextBacked = !0, this.workerTimeoutMs = t.workerTimeoutMs, this.googleSubstitutes = t.useGoogleFonts === !0, this.cjkFallback = j(t.cjkFallback), this.generation++, this.math = this._mode === "worker" ? void 0 : t.math, this.threeD = this._mode === "worker" ? void 0 : t.threeD, this.regionMap = this._mode === "worker" ? void 0 : t.regionMap, this.chartEx = this._mode === "worker" ? void 0 : t.chartEx, this.tiff = this._mode === "worker" ? void 0 : t.tiff;
		let a = this._mode === "worker" ? bt(t) : void 0, o = await i.request((i) => ({
			type: "parseDelimitedText",
			japaneseCellFonts: this.japaneseCellFonts,
			id: i,
			data: e,
			options: n,
			worksheetPolicy: r,
			useGoogleFonts: !!t.useGoogleFonts,
			cjkFallback: this.cjkFallback,
			renderers: a
		}), [e], { timeoutMs: t.workerTimeoutMs }), s = JSON.parse(new TextDecoder().decode(o.worksheetJson));
		Et(s, r), Ie(s, this.japaneseCellFonts);
		let c = o.workbook.workbook.sheets;
		if (c.length !== 1 || c[0]?.name !== s.name) throw Error("Delimited text worker returned inconsistent worksheet metadata");
		let l = kt(s, r);
		if (wt(l, "load-delimited-text", void 0, void 0, r), Ft(l.jsonBytes, "load-delimited-text", void 0, void 0, r), Ot(l, "load-delimited-text", void 0, void 0, r), this.parsedWorkbook = o.workbook, this.cjkFallback = Be(o.workbook, this.cjkFallback), this.sheetCache.set(0, s), this.sheetCacheUsage.set(0, l), this.retainedSheetUsage = l, this.officeFontRequests = Ue(o.workbook), t.useGoogleFonts && (this.googleFontNames = [...He(o.workbook, this.cjkFallback)]), typeof document < "u" && document.fonts) {
			await this.retainFontsInSet(document.fonts), await this.retainWorksheetOfficeFonts(s);
			let e = this.retainedFontSets.get(document.fonts)?.loaded?.office;
			ft(s, e?.routes, this.googleSubstitutes);
		}
	}
	async retainFontsInSet(e) {
		if (this.fontsDestroyed) return () => void 0;
		let t = this.retainedFontSets.get(e);
		if (t) t.refs++;
		else {
			let n = Promise.all([S(this.googleFontNames, Ke, e), O(this.officeFontRequests, e)]).then(([e, t]) => ({
				google: e,
				office: t
			}));
			t = {
				refs: 1,
				loaded: null,
				loading: n
			}, this.retainedFontSets.set(e, t), n.then((e) => {
				t.loaded = e, this.fontsDestroyed && (F(e.google), x(e.office.faces));
			});
		}
		await t.loading;
		let n = !1;
		return () => {
			if (n) return;
			n = !0;
			let r = this.retainedFontSets.get(e);
			r === t && (r.refs--, !(r.refs > 0) && (this.retainedFontSets.delete(e), r.loaded ? (F(r.loaded.google), x(r.loaded.office.faces)) : r.loading.then((e) => {
				F(e.google), x(e.office.faces);
			})));
		};
	}
	async retainWorksheetOfficeFonts(e) {
		let t = qe(e).filter((e) => !this.officeFontRequests.some((t) => yt(t) === yt(e)));
		t.length !== 0 && (this.officeFontRequests.push(...t), await Promise.all([...this.retainedFontSets].map(async ([e, n]) => {
			let r = await n.loading, i = await O(t, e);
			if (this.fontsDestroyed || this.retainedFontSets.get(e) !== n || n.refs <= 0) x(i.faces);
			else {
				r.office.faces.push(...i.faces);
				let e = new Set(r.office.checked);
				for (let t of i.checked) e.has(t) || (e.add(t), r.office.checked.push(t));
				Object.assign(r.office.routes, i.routes);
			}
		})));
	}
	async [zn](e) {
		return await this.retainFontsInSet(e.fonts);
	}
	[Bn](e, t) {
		if (!this.parsedWorkbook) return;
		let n = b(t.canvas) ? t.canvas.ownerDocument.fonts : null;
		lt(t, e, n ? this.retainedFontSets.get(n)?.loaded?.office.routes : void 0, this.googleSubstitutes), V(e), pt(t, e, this.parsedWorkbook.styles, this.cjkFallback);
	}
	get sheetNames() {
		return this.parsedWorkbook?.workbook.sheets.map((e) => e.name) ?? [];
	}
	get sheetCount() {
		return this.parsedWorkbook?.workbook.sheets.length ?? 0;
	}
	get tabColors() {
		return this.parsedWorkbook?.workbook.sheets.map((e) => e.tabColor ?? null) ?? [];
	}
	sheetVisibility(e) {
		return Zt(this.parsedWorkbook?.workbook.sheets ?? [], e);
	}
	isHidden(e) {
		return this.sheetVisibility(e) !== "visible";
	}
	async getWorksheet(e) {
		let t = this.evictingSheets.get(e);
		if (t) return await t.done, this.getWorksheet(e);
		let n = this.pinWorksheet(e);
		try {
			return await this.getOrLoadWorksheet(e);
		} finally {
			n();
		}
	}
	async getOrLoadWorksheet(e) {
		this.assertResourceHealthy();
		let t = this.sheetCache.get(e);
		if (t) return this.touchWorksheet(e, t), t;
		let n = this.sheetLoads.get(e);
		if (n) return n;
		let r = new Nn([]);
		(this.sheetPreviews ??= /* @__PURE__ */ new Map()).set(e, r);
		let i = this.loadWorksheet(e, r);
		i.catch((e) => r.fail(e)), this.sheetLoads.set(e, i);
		try {
			return await i;
		} finally {
			this.sheetLoads.get(e) === i && this.sheetLoads.delete(e), this.sheetPreviews?.get(e) === r && this.sheetPreviews.delete(e);
		}
	}
	touchWorksheet(e, t) {
		this.sheetCache.delete(e), this.sheetCache.set(e, t);
	}
	pinWorksheet(e) {
		this.sheetLeases.set(e, (this.sheetLeases.get(e) ?? 0) + 1);
		let t = !1;
		return () => {
			if (t) return;
			t = !0;
			let n = this.sheetLeases.get(e) ?? 0;
			n <= 1 ? this.sheetLeases.delete(e) : this.sheetLeases.set(e, n - 1);
		};
	}
	completePendingEvictions() {
		for (let e of this.evictingSheets.values()) e.complete();
		this.evictingSheets.clear();
	}
	async acquireWorksheetLease(e) {
		let t = this.evictingSheets.get(e);
		if (t) return await t.done, this.acquireWorksheetLease(e);
		let n = this.pinWorksheet(e);
		try {
			return {
				worksheet: await this.getWorksheet(e),
				release: n
			};
		} catch (e) {
			throw n(), e;
		}
	}
	async acquireWorksheetPreviewLease(e) {
		let t = this.evictingSheets.get(e);
		if (t) return await t.done, this.acquireWorksheetPreviewLease(e);
		let n = this.pinWorksheet(e), r = () => {
			n();
		};
		try {
			let t = this.getOrLoadWorksheet(e);
			t.catch(() => void 0);
			let n = this.sheetPreviews?.get(e);
			return {
				worksheet: n ? await n.ready : await t,
				release: r,
				partial: !!n?.worksheet && !n.complete,
				completion: t,
				waitForRows: (e) => n ? n.waitFor(e) : Promise.resolve()
			};
		} catch (e) {
			throw r(), e;
		}
	}
	async getComments(e) {
		let t = await this.acquireWorksheetLease(e);
		try {
			return structuredClone(t.worksheet.comments ?? []);
		} finally {
			t.release();
		}
	}
	async getResourceMetrics() {
		let e = this.metrics;
		if (!e) throw Error("Workbook not loaded");
		if (this.delimitedTextBacked) {
			let t = e.current();
			if (!t) throw Error("OOXML resource metrics are not ready");
			return t;
		}
		return C(e, async (e) => (await this.requireBridge().request((e) => ({
			type: "resourceUsage",
			id: e
		}), void 0, { timeoutMs: e })).usage);
	}
	async loadWorksheet(e, t) {
		if (!this.parsedWorkbook) throw Error("Workbook not loaded");
		let n = this.parsedWorkbook.workbook.sheets[e];
		if (!n) throw Error(`Sheet index ${e} out of range`);
		return this.runArchiveOperation(() => this.loadWorksheetStream(e, n.name, t));
	}
	async loadWorksheetStream(e, t, n) {
		let r = this.worksheetPolicy, i = this.ensureWorksheetPullClient(), a = n.rows, o = {
			rows: 0,
			cells: 0,
			ownedUtf8Bytes: 0
		}, s, c, l, u = !1;
		try {
			for await (let u of i.stream(e, t)) {
				if (u.kind === "preview") {
					if (u.worksheet && (Et(u.worksheet, r), Ie(u.worksheet, this.japaneseCellFonts)), n.preview(u.worksheet, u.reason, u.maxRow, u.maxCol), u.worksheet) {
						In(u.worksheet, {
							maxRow: u.maxRow,
							maxCol: u.maxCol
						}), await this.retainWorksheetOfficeFonts(u.worksheet);
						let e = typeof document < "u" ? this.retainedFontSets.get(document.fonts)?.loaded?.office : void 0;
						ft(u.worksheet, e?.routes, this.googleSubstitutes);
					}
					continue;
				}
				if (u.kind === "rows") {
					let e = Ct(o, Mt(u.rows, r), r);
					wt(e, "get-worksheet", void 0, u.usage, r), n.append(u.rows), o = e;
					continue;
				}
				let e = u.worksheet;
				Et(e, r), Ie(e, this.japaneseCellFonts), e.rows = e.parseError ? [] : a;
				let t = Tt(e, e.parseError ? {
					rows: 0,
					cells: 0,
					ownedUtf8Bytes: 0
				} : o, r);
				wt(t, "get-worksheet", void 0, u.usage, r), Ft(t.jsonBytes, "get-worksheet", void 0, u.usage, r);
				let i = this.retainedSheetUsage, d = Nt(i, t, {}, r), f = [];
				for (let [e] of this.sheetCache) {
					try {
						Ot(d, "get-worksheet", void 0, u.usage, r);
						break;
					} catch (e) {
						if (!(e instanceof g)) throw e;
					}
					if ((this.sheetLeases.get(e) ?? 0) > 0) continue;
					let n = this.sheetCacheUsage.get(e);
					n && (i = Nt(i, {
						rows: 0,
						cells: 0,
						ownedUtf8Bytes: 0,
						jsonBytes: 0
					}, n, r), d = Nt(i, t, {}, r), f.push(e));
				}
				Ot(d, "get-worksheet", void 0, u.usage, r);
				let p;
				if (f.length && this._mode === "worker") {
					let e;
					p = {
						done: new Promise((t) => {
							e = t;
						}),
						complete: e
					};
					for (let e of f) this.evictingSheets.set(e, p);
				}
				try {
					if (p && (await this.requireBridge().request((e) => ({
						type: "evictWorksheets",
						id: e,
						sheetIndices: f
					})), !this.parsedWorkbook)) throw Error("Workbook not loaded");
					for (let e of f) if ((this.sheetLeases.get(e) ?? 0) > 0) throw Error(`Cannot evict leased worksheet ${e}`);
					for (let e of f) this.sheetCache.delete(e), this.sheetCacheUsage.delete(e);
					this.retainedSheetUsage = i;
				} catch (e) {
					throw p && this.destroy(), e;
				} finally {
					if (p) {
						for (let e of f) this.evictingSheets.get(e) === p && this.evictingSheets.delete(e);
						p.complete();
					}
				}
				s = e, l = t, c = d;
			}
			if (u = !0, !s || !c || !l) throw Error(`XLSX worksheet ${e} did not produce a terminal model`);
			this.retainedSheetUsage = c, this.sheetCache.set(e, s), this.sheetCacheUsage.set(e, l), await this.retainWorksheetOfficeFonts(s);
			let d = typeof document < "u" ? this.retainedFontSets.get(document.fonts)?.loaded?.office : void 0;
			return ft(s, d?.routes, this.googleSubstitutes), n.finish(s), s;
		} catch (e) {
			throw this._mode === "worker" && s && !u && this.destroy(), this.latchFatalResourceFailure(e), n.fail(e), e;
		}
	}
	ensureWorksheetPullClient() {
		if (this.worksheetPullClient) return this.worksheetPullClient;
		if (!this.parsedWorkbook) throw Error("Workbook not loaded");
		return this.worksheetPullClient = new Pt({
			generation: this.generation || 1,
			transport: this.requireBridge().transport(At),
			sharedStrings: this.parsedWorkbook.sharedStrings,
			timeoutMs: this.workerTimeoutMs,
			open: async (e, t, n, r) => {
				await this.requireBridge().request((r) => ({
					type: "openSheetSession",
					id: r,
					sheetIndex: e,
					sheetName: t,
					...n
				}), void 0, { timeoutMs: r });
			}
		}), this.worksheetPullClient;
	}
	runArchiveOperation(e) {
		let t = async () => {
			this.assertResourceHealthy();
			try {
				return await e();
			} catch (e) {
				throw this.latchFatalResourceFailure(e), e;
			}
		}, n = (this.archiveOperationTail ?? Promise.resolve()).then(t, t);
		return this.archiveOperationTail = n.then(() => void 0, () => void 0), n;
	}
	async getImage(e, t) {
		this.assertResourceHealthy(), this.requireArchiveBridge();
		let n = this.queuedImageLoads?.get(e);
		if (n) return n;
		let r = [...this.sheetPreviews?.values() ?? []].some((e) => e.worksheet && !e.complete) ? this.getImageWithinArchiveOperation(e, t) : this.runArchiveOperation(() => this.getImageWithinArchiveOperation(e, t));
		return this.queuedImageLoads ??= /* @__PURE__ */ new Map(), this.queuedImageLoads.set(e, r), r.finally(() => {
			this.queuedImageLoads.get(e) === r && this.queuedImageLoads.delete(e);
		}).catch(() => void 0), r;
	}
	getImageWithinArchiveOperation(e, t) {
		return this.rawParts.get(e, t, () => this.requestImage(e, t));
	}
	requestImage(e, t) {
		return this.requireArchiveBridge().request((t) => ({
			type: "extractImage",
			id: t,
			path: e
		})).then((e) => {
			let n = e.bytes;
			return new Blob([n], { type: t });
		});
	}
	async toMarkdown() {
		return this.assertResourceHealthy(), (await this.runArchiveOperation(() => this.requireArchiveBridge().request((e) => ({
			type: "toMarkdown",
			id: e
		})))).markdown;
	}
	async resolveValidationList(e, t) {
		if (this.assertResourceHealthy(), !this.parsedWorkbook) throw Error("Workbook not loaded");
		let n = yn(t);
		if (n.kind !== "range") return bn(n, () => null);
		let r = e;
		if (n.sheet) {
			let e = this.sheetNames.findIndex((e) => e.toLowerCase() === n.sheet?.toLowerCase());
			if (e < 0) return {
				kind: "formula",
				formula: t ?? ""
			};
			r = e;
		}
		let i = await this.acquireWorksheetLease(r);
		try {
			let e = i.worksheet, t = this.parsedWorkbook.styles, r = /* @__PURE__ */ new Map();
			for (let t of e.rows) for (let e of t.cells) r.set(`${e.row}:${e.col}`, e);
			return bn(n, (n, i) => {
				let a = r.get(`${n}:${i}`);
				return a ? We(a, t, null, e.date1904) : null;
			});
		} finally {
			i.release();
		}
	}
	cellText(e, t) {
		return this.parsedWorkbook ? We(t, this.parsedWorkbook.styles, null, e.date1904) : "";
	}
	async renderViewport(e, t, n, r = {}) {
		if (this.assertResourceHealthy(), n = {
			row: n.row,
			col: n.col,
			rows: n.rows,
			cols: n.cols
		}, this._mode === "worker") throw Error("renderViewport(canvas) is unavailable in mode: 'worker'; use renderViewportToBitmap() and paint it via an ImageBitmapRenderingContext");
		if (!this.parsedWorkbook) throw Error("Workbook not loaded");
		let i = this.parsedWorkbook.styles, a = On(r), { sizeOverrides: o, ...s } = a.opts, c = b(e) ? e.ownerDocument.fonts : typeof document < "u" ? document.fonts : null, l = this.sheetPreviews?.get(t);
		if (l?.worksheet && a.worksheet) {
			await l.waitFor(Math.max(n.row + n.rows - 1, s.freezeRows ?? 0)), this.assertResourceHealthy();
			let t = a.worksheet;
			await hn({
				ws: t,
				styles: i,
				cjkFallback: this.cjkFallback,
				math: this.math,
				threeD: this.threeD,
				regionMap: this.regionMap,
				chartEx: this.chartEx,
				tiff: this.tiff
			}, e, n, {
				...s,
				authoritativeMdw: a.layoutMetrics?.maximumDigitWidth,
				officeFontRoutes: c ? this.retainedFontSets.get(c)?.loaded?.office.routes : void 0,
				googleSubstitutes: this.googleSubstitutes,
				fetchImage: this._fetchImage
			});
			return;
		}
		return this.withWorksheetArchiveOperation(t, (t) => {
			let r = a.worksheet ?? wn(t, o);
			return r !== t && dt(t, r), hn({
				ws: r,
				styles: i,
				cjkFallback: this.cjkFallback,
				math: this.math,
				threeD: this.threeD,
				regionMap: this.regionMap,
				chartEx: this.chartEx,
				tiff: this.tiff
			}, e, n, {
				...s,
				authoritativeMdw: a.layoutMetrics?.maximumDigitWidth,
				officeFontRoutes: c ? this.retainedFontSets.get(c)?.loaded?.office.routes : void 0,
				googleSubstitutes: this.googleSubstitutes,
				fetchImage: this._fetchImage
			});
		});
	}
	async renderViewportToBitmap(e, t, n) {
		this.assertResourceHealthy(), t = {
			row: t.row,
			col: t.col,
			rows: t.rows,
			cols: t.cols
		};
		let r = On(n), i = {
			...r.opts,
			dpr: n.dpr ?? D()
		};
		if (this._mode === "worker") {
			if (!Number.isInteger(e) || e < 0 || e >= this.sheetCount) throw Error(`Sheet index ${e} out of range (count: ${this.sheetCount})`);
			let n = () => {
				let n = new OffscreenCanvas(1, 1);
				return this.requireBridge().request((a) => ({
					type: "renderViewport",
					id: a,
					sheetIndex: e,
					viewport: t,
					opts: i,
					layoutMetrics: r.layoutMetrics,
					viewProjection: r.projection,
					canvas: n
				}), [n]);
			}, a = this.sheetPreviews?.get(e), o;
			return a?.worksheet && r.worksheet ? (await a.waitFor(Math.max(t.row + t.rows - 1, i.freezeRows ?? 0)), this.assertResourceHealthy(), o = await n()) : o = await this.withWorksheetArchiveOperation(e, n), o.bitmap;
		}
		let a = new OffscreenCanvas(1, 1);
		return await this.renderViewport(a, e, t, i), a.transferToImageBitmap();
	}
	[Vn](e) {
		this._mode !== "worker" || !this.bridge || this.bridge.post({
			type: "releaseViewProjection",
			projectionId: e
		});
	}
	async retainWorksheetReference(e) {
		let t = this.evictingSheets.get(e);
		return t ? (await t.done, this.retainWorksheetReference(e)) : this.parsedWorkbook ? this.pinWorksheet(e) : () => void 0;
	}
	withWorksheetArchiveOperation(e, t) {
		let n = this.evictingSheets.get(e);
		if (n) return n.done.then(() => this.withWorksheetArchiveOperation(e, t));
		let r = this.pinWorksheet(e);
		return this.withPinnedWorksheetArchiveOperation(e, t).finally(r);
	}
	withPinnedWorksheetArchiveOperation(e, t) {
		let n = this.sheetCache.get(e);
		if (n) return this.touchWorksheet(e, n), this.runArchiveOperation(() => t(n));
		let r = this.sheetLoads.get(e);
		if (r) return this.runArchiveOperation(async () => t(await r));
		if (!this.parsedWorkbook) return Promise.reject(/* @__PURE__ */ Error("Workbook not loaded"));
		let i = this.parsedWorkbook.workbook.sheets[e];
		if (!i) return Promise.reject(/* @__PURE__ */ Error(`Sheet index ${e} out of range`));
		let a, o, s = new Promise((e, t) => {
			a = e, o = t;
		});
		s.catch(() => void 0), this.sheetLoads.set(e, s);
		let c = new Nn([]);
		return (this.sheetPreviews ??= /* @__PURE__ */ new Map()).set(e, c), this.runArchiveOperation(async () => {
			try {
				let n = await this.loadWorksheetStream(e, i.name, c);
				return a(n), await t(n);
			} catch (e) {
				throw o(e), e;
			} finally {
				this.sheetLoads.get(e) === s && this.sheetLoads.delete(e), this.sheetPreviews?.get(e) === c && this.sheetPreviews.delete(e);
			}
		});
	}
	destroy() {
		this.generation = (this.generation ?? 1) + 1, this.worksheetPullClient?.cancelAll("closed").catch(() => void 0), this.worksheetPullClient = null, this.bridge?.terminate(), this.bridge = null, this.parsedWorkbook = null, this.sheetCache.clear(), this.sheetCacheUsage.clear(), this.sheetLeases.clear(), this.completePendingEvictions(), this.retainedSheetUsage = {
			rows: 0,
			cells: 0,
			ownedUtf8Bytes: 0,
			jsonBytes: 0
		}, this.sheetLoads.clear();
		for (let e of this.sheetPreviews?.values() ?? []) e.fail(/* @__PURE__ */ Error("XLSX workbook has been destroyed"));
		this.sheetPreviews?.clear(), this.fontsDestroyed = !0;
		for (let e of this.retainedFontSets.values()) e.loaded && (F(e.loaded.google), x(e.loaded.office.faces));
		this.retainedFontSets.clear(), this.googleFontNames = [], this.googleSubstitutes = !1, this.officeFontRequests = [], N(this._fetchImage), ne(this._fetchImage), this.rawParts.clear(), this.queuedImageLoads?.clear();
	}
	assertResourceHealthy() {
		if (this.resourceFailure) throw this.resourceFailure;
	}
	latchFatalResourceFailure(e) {
		e instanceof g && e.details.violation.resource !== "worksheet-cache" && (this.resourceFailure ??= e);
	}
	requireBridge() {
		if (!this.bridge) throw Error("This operation requires an active workbook worker");
		return this.bridge;
	}
	requireArchiveBridge() {
		if (this.delimitedTextBacked || !this.bridge) throw Error("This operation requires an active archive-backed workbook");
		return this.bridge;
	}
};
function Wn(e, t) {
	return e.acquireWorksheetLease(t);
}
function Gn(e, t) {
	let n = e.acquireWorksheetPreviewLease;
	return typeof n == "function" ? n.call(e, t) : Wn(e, t).then((e) => ({
		...e,
		partial: !1,
		completion: Promise.resolve(e.worksheet)
	}));
}
function Kn(e, t) {
	let n = e.retainWorksheetReference;
	return typeof n == "function" ? n.call(e, t) : Promise.resolve(() => void 0);
}
function qn(e, t) {
	return e.top <= t.row + t.rows - 1 && e.bottom >= t.row && e.left <= t.col + t.cols - 1 && e.right >= t.col;
}
function Jn(e, t) {
	let n = e.fromRow + 1 > t.row + t.rows - 1 && Number.isFinite(e.fromRowOff) && e.fromRowOff >= 0, r = e.fromCol + 1 > t.col + t.cols - 1 && Number.isFinite(e.fromColOff) && e.fromColOff >= 0;
	return !n && !r;
}
function Yn(e, t, n, r) {
	for (let i of e.conditionalFormats ?? []) if (i.sqref.filter((e) => e.top <= n && e.bottom >= t).length !== 0) {
		for (let e of i.rules) if (e.type !== "other" && !(e.type === "cellIs" && e.formulas.every((e) => /^\s*[-+]?(?:\d+(?:\.\d*)?|\.\d+)\s*$/.test(e))) && (i.sqref.some((e) => e.bottom > r) || "activeFormula" in e && e.activeFormula && !/^\s*[-+]?(?:\d+(?:\.\d*)?|\.\d+)\s*$/.test(e.activeFormula) || e.type === "cellIs" || e.type === "expression")) return "conditional-format-range";
	}
	return null;
}
function Xn(e, t, n) {
	return (e.mergeCells ?? []).some((e) => qn(e, t) && e.bottom > n) ? "merge-range" : Yn(e, t.row, t.row + t.rows - 1, n) || ((e.charts ?? []).some((e) => Jn(e, t)) || (e.shapeGroups ?? []).some((e) => Jn(e, t)) || (e.slicers ?? []).some((e) => Jn(e, t)) ? "drawing-dependency" : (e.sparklineGroups ?? []).some((e) => e.sparklines.some((e) => e.row >= t.row && e.row < t.row + t.rows && e.col >= t.col && e.col < t.col + t.cols)) ? "sparkline-dependency" : null);
}
function Zn(e, t, n) {
	return t < 1 ? null : Yn(e, 1, t, n) ? "drawing-dependency" : null;
}
function Qn(e, t) {
	let n = Fe(t.worksheet, e, t.colAxis, t.rowAxis, t.scale), { width: r, height: i } = n;
	if (r <= 0 || i <= 0) return null;
	let a = t.colAxis.offsetOf(t.startCol), o = t.rowAxis.offsetOf(t.startRow);
	return {
		x: Qe(t.scrollAreaX + (n.x - a) - t.scrollOffsetX, r, t.canvasWidth, t.rtl),
		y: t.scrollAreaY + (n.y - o) - t.scrollOffsetY,
		width: r,
		height: i
	};
}
function $n(e, t) {
	return e.x >= t.x && e.x <= t.x + t.width && e.y >= t.y && e.y <= t.y + t.height;
}
function er(e, t) {
	let n = Qe(t.scrollAreaX, t.scrollAreaW, t.canvasWidth, t.rtl);
	return e.x + e.width >= n && e.x <= n + t.scrollAreaW && e.y + e.height >= t.scrollAreaY && e.y <= t.scrollAreaY + t.scrollAreaH;
}
function tr(e, t) {
	let n = Qe(t.scrollAreaX, t.scrollAreaW, t.canvasWidth, t.rtl);
	return e.x >= n && e.x <= n + t.scrollAreaW && e.y >= t.scrollAreaY && e.y <= t.scrollAreaY + t.scrollAreaH;
}
function nr(e, t) {
	let n = V(e), r = t.cellScale, { col: i, row: a } = n.axesAtScale(r), o = Math.round(50 * r), s = Math.round(22 * r), c = i.bandsToCover(1, t.freezeCols, Math.max(0, t.width - o)), l = a.bandsToCover(1, t.freezeRows, Math.max(0, t.height - s)), u = c.reduce((e, t) => e + t.size, 0), d = l.reduce((e, t) => e + t.size, 0);
	return {
		worksheet: e,
		colAxis: i,
		rowAxis: a,
		scale: r,
		startRow: t.viewport.row,
		startCol: t.viewport.col,
		scrollOffsetX: t.scrollOffsetX * r,
		scrollOffsetY: t.scrollOffsetY * r,
		scrollAreaX: o + u,
		scrollAreaY: s + d,
		scrollAreaW: Math.max(0, t.width - o - u),
		scrollAreaH: Math.max(0, t.height - s - d),
		rtl: e.rightToLeft === !0,
		canvasWidth: t.width
	};
}
function rr(e, t, n) {
	let r = nr(e, n), i, a = 0;
	if (i = t.elementType === "chart" ? e.charts[t.elementIndex] : t.elementType === "image" ? e.images[t.elementIndex] : (e.shapeGroups ?? [])[t.elementIndex], !i) return null;
	let o = Qn(i, r);
	if (!o || !er(o, r)) return null;
	if (t.elementType === "shape") {
		let n = (e.shapeGroups ?? [])[t.elementIndex], r = t.shapeIndex === void 0 ? void 0 : n?.shapes[t.shapeIndex];
		r && (o = {
			x: o.x + r.x * o.width,
			y: o.y + r.y * o.height,
			width: r.w * o.width,
			height: r.h * o.height
		}, a = r.rot);
	}
	let s = Qe(r.scrollAreaX, r.scrollAreaW, r.canvasWidth, r.rtl);
	return {
		rect: o,
		clip: {
			x: s,
			y: r.scrollAreaY,
			width: r.scrollAreaW,
			height: r.scrollAreaH
		},
		rotation: a
	};
}
function ir(e) {
	return {
		from: {
			row: e.fromRow + 1,
			col: e.fromCol + 1,
			offsetX: e.fromColOff,
			offsetY: e.fromRowOff
		},
		to: {
			row: e.toRow + 1,
			col: e.toCol + 1,
			offsetX: e.toColOff,
			offsetY: e.toRowOff
		}
	};
}
function ar(e, t) {
	if (!e.text) return {
		truncated: !1,
		textCharacters: 0
	};
	let n = [], r = 0, i = !1;
	for (let [a, o] of e.text.paragraphs.entries()) {
		if (a > 0) {
			if (r >= t) {
				i = !0;
				break;
			}
			n.push("\n"), r++;
		}
		for (let e of o.runs) {
			let a = e.type === "text" ? e.text : e.type === "break" ? "\n" : "[equation]", o = ke(a, Math.max(0, t - r));
			if (n.push(o), r += o.length, o.length < a.length) {
				i = !0;
				break;
			}
		}
		if (i) break;
	}
	return {
		text: n.join(""),
		truncated: i,
		textCharacters: r
	};
}
function or(e, t, n, r, i, a, o, s) {
	return {
		format: "xlsx",
		kind: "element",
		sheetIndex: t,
		sheetName: e.name,
		elementType: n,
		elementIndex: r,
		anchor: ir(i),
		...a === void 0 ? {} : { text: a },
		truncated: o,
		truncationReasons: o ? ["text"] : [],
		textCharacters: a?.length ?? 0,
		maxTextCharacters: s
	};
}
function sr(e, t, n, r, i) {
	for (let a = e.charts.length - 1; a >= 0; a--) {
		let o = e.charts[a], s = Qn(o, r);
		if (!s || !er(s, r) || !$n(n, s)) continue;
		let c = we(o.chart, i);
		return {
			...or(e, t, "chart", a, o, c.text, c.truncated, c.maxTextCharacters),
			seriesCount: o.chart.series.length
		};
	}
	return null;
}
function cr(e, t, n) {
	let r = {
		x: t.x + n.x * t.width,
		y: t.y + n.y * t.height,
		width: n.w * t.width,
		height: n.h * t.height
	}, i = r.x + r.width / 2, a = r.y + r.height / 2, o = -n.rot * Math.PI / 180, s = e.x - i, c = e.y - a, l = i + Math.cos(o) * s - Math.sin(o) * c, u = a + Math.sin(o) * s + Math.cos(o) * c;
	return n.flipH && (l = 2 * i - l), n.flipV && (u = 2 * a - u), {
		x: l,
		y: u
	};
}
function lr(e, t, n, r, i) {
	let a = e.shapeGroups ?? [];
	for (let o = a.length - 1; o >= 0; o--) {
		let s = a[o], c = Qn(s, r);
		if (!(!c || !er(c, r))) for (let r = s.shapes.length - 1; r >= 0; r--) {
			let a = s.shapes[r];
			if (!$n(cr(n, c, a), {
				x: c.x + a.x * c.width,
				y: c.y + a.y * c.height,
				width: a.w * c.width,
				height: a.h * c.height
			})) continue;
			let l = ar(a, i);
			return {
				...or(e, t, "shape", o, s, l.text, l.truncated, i),
				shapeIndex: r,
				shapeCount: s.shapes.length,
				...a.geom.type === "image" ? { mimeType: a.geom.mimeType } : {}
			};
		}
	}
	return null;
}
function ur(e, t, n, r, i) {
	for (let a = e.images.length - 1; a >= 0; a--) {
		let o = e.images[a], s = Qn(o, r);
		if (s && er(Le(s, o.rotation), r) && $n(Je(n, s, o.rotation, o.flipH, o.flipV), s)) return {
			...or(e, t, "image", a, o, void 0, !1, i),
			mimeType: o.svgImagePath ? "image/svg+xml" : o.mimeType
		};
	}
	return null;
}
function dr(e, t, n, r, i = Ce) {
	if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) throw RangeError("XLSX hit-test point must contain finite coordinates.");
	if (!Number.isFinite(i) || i < 0) throw RangeError("maxTextCharacters must be a finite non-negative number.");
	let a = Math.min(Ce, Math.floor(i)), o = nr(e, r);
	return tr(n, o) ? sr(e, t, n, o, a) ?? lr(e, t, n, o, a) ?? ur(e, t, n, o, a) : null;
}
function fr(e, t) {
	let n = t ?? e.maxTextCharacters;
	if (!Number.isFinite(n) || n < 0) throw RangeError("maxTextCharacters must be a finite non-negative number.");
	let r = Math.min(Ce, Math.floor(n)), i = e.text === void 0 ? void 0 : ke(e.text, r), a = e.truncated || e.text !== void 0 && i.length < e.text.length;
	return {
		...structuredClone(e),
		...i === void 0 ? {} : { text: i },
		truncated: a,
		truncationReasons: a ? ["text"] : [],
		textCharacters: i?.length ?? 0,
		maxTextCharacters: r
	};
}
var pr = 128, mr = 1e4, hr = 8 * 1024 * 1024;
function gr(e) {
	return e.areas.reduce((e, t) => e + (t.kind === "cells" ? (t.bottom - t.top + 1) * (t.right - t.left + 1) : t.kind === "rows" ? (t.lastRow - t.firstRow + 1) * G : t.kind === "columns" ? (t.lastColumn - t.firstColumn + 1) * K : K * G), 0);
}
function Y(e, t) {
	return Number.isInteger(e) && e >= 1 && e <= t;
}
function _r(e) {
	switch (e.kind) {
		case "cells":
			if (!Y(e.top, 1048576) || !Y(e.bottom, 1048576) || !Y(e.left, 16384) || !Y(e.right, 16384)) throw RangeError("Cell selection bounds must be inside the XLSX grid.");
			return {
				kind: "cells",
				top: Math.min(e.top, e.bottom),
				left: Math.min(e.left, e.right),
				bottom: Math.max(e.top, e.bottom),
				right: Math.max(e.left, e.right)
			};
		case "rows":
			if (!Y(e.firstRow, 1048576) || !Y(e.lastRow, 1048576)) throw RangeError("Row selection bounds must be inside the XLSX grid.");
			return {
				kind: "rows",
				firstRow: Math.min(e.firstRow, e.lastRow),
				lastRow: Math.max(e.firstRow, e.lastRow)
			};
		case "columns":
			if (!Y(e.firstColumn, 16384) || !Y(e.lastColumn, 16384)) throw RangeError("Column selection bounds must be inside the XLSX grid.");
			return {
				kind: "columns",
				firstColumn: Math.min(e.firstColumn, e.lastColumn),
				lastColumn: Math.max(e.firstColumn, e.lastColumn)
			};
		case "sheet": return { kind: "sheet" };
	}
}
function vr(e, t) {
	switch (e.kind) {
		case "cells": return t.row >= e.top && t.row <= e.bottom && t.col >= e.left && t.col <= e.right;
		case "rows": return t.row >= e.firstRow && t.row <= e.lastRow;
		case "columns": return t.col >= e.firstColumn && t.col <= e.lastColumn;
		case "sheet": return !0;
	}
}
function yr(e, t) {
	if (!Y(e.row, 1048576) || !Y(e.col, 16384)) throw RangeError(`${t} must be inside the XLSX grid.`);
	return {
		row: e.row,
		col: e.col
	};
}
function X(e) {
	if (!Array.isArray(e.areas) || e.areas.length === 0) throw TypeError("A selection must contain at least one area.");
	if (e.areas.length > 128) throw RangeError("A selection may contain at most 128 areas.");
	if (!Number.isInteger(e.activeAreaIndex) || e.activeAreaIndex < 0 || e.activeAreaIndex >= e.areas.length) throw RangeError("activeAreaIndex must identify an area in the selection.");
	let t = e.areas.map(_r), n = [], r = /* @__PURE__ */ new Map(), i = 0;
	for (let a = 0; a < t.length; a++) {
		let o = t[a], s = o.kind === "cells" ? `c:${o.top}:${o.left}:${o.bottom}:${o.right}` : o.kind === "rows" ? `r:${o.firstRow}:${o.lastRow}` : o.kind === "columns" ? `k:${o.firstColumn}:${o.lastColumn}` : "s", c = r.get(s);
		c === void 0 && (c = n.length, r.set(s, c), n.push(o)), a === e.activeAreaIndex && (i = c);
	}
	let a = yr(e.activeCell, "activeCell"), o = yr(e.extensionAnchor, "extensionAnchor"), s = n[i];
	if (!vr(s, a)) throw RangeError("activeCell must be inside the active selection area.");
	if (!vr(s, o)) throw RangeError("extensionAnchor must be inside the active selection area.");
	return {
		areas: n,
		activeAreaIndex: i,
		activeCell: a,
		extensionAnchor: o
	};
}
function br(e) {
	let t = 0;
	for (let n of e) t = t * 26 + n.charCodeAt(0) - 64;
	return t >= 1 && t <= 16384 ? t : null;
}
function xr(e) {
	let t = e.trim().toUpperCase(), n = /^\$?(\d+):\$?(\d+)$/.exec(t);
	if (n) {
		let e = Number(n[1]), t = Number(n[2]);
		if (!Y(e, 1048576) || !Y(t, 1048576)) return null;
		let r = Math.min(e, t);
		return {
			areas: [{
				kind: "rows",
				firstRow: r,
				lastRow: Math.max(e, t)
			}],
			activeAreaIndex: 0,
			activeCell: {
				row: r,
				col: 1
			},
			extensionAnchor: {
				row: r,
				col: 1
			}
		};
	}
	let r = /^\$?([A-Z]+):\$?([A-Z]+)$/.exec(t);
	if (r) {
		let e = br(r[1]), t = br(r[2]);
		if (e === null || t === null) return null;
		let n = Math.min(e, t);
		return {
			areas: [{
				kind: "columns",
				firstColumn: n,
				lastColumn: Math.max(e, t)
			}],
			activeAreaIndex: 0,
			activeCell: {
				row: 1,
				col: n
			},
			extensionAnchor: {
				row: 1,
				col: n
			}
		};
	}
	let i = t.split(":");
	if (i.length > 2) return null;
	let a = B(i[0]), o = i.length === 2 ? B(i[1]) : a;
	if (!a || !o) return null;
	let s = {
		kind: "cells",
		top: Math.min(a.row, o.row),
		left: Math.min(a.col, o.col),
		bottom: Math.max(a.row, o.row),
		right: Math.max(a.col, o.col)
	}, c = {
		row: s.top,
		col: s.left
	};
	return {
		areas: [s],
		activeAreaIndex: 0,
		activeCell: c,
		extensionAnchor: c
	};
}
function Sr(e, t) {
	return e === t ? !0 : !e || !t || e.activeAreaIndex !== t.activeAreaIndex || e.areas.length !== t.areas.length || e.activeCell.row !== t.activeCell.row || e.activeCell.col !== t.activeCell.col || e.extensionAnchor.row !== t.extensionAnchor.row || e.extensionAnchor.col !== t.extensionAnchor.col ? !1 : e.areas.every((e, n) => JSON.stringify(e) === JSON.stringify(t.areas[n]));
}
function Cr(e, t, n) {
	let r = [...new Set([...e, ...t].flatMap((e) => [e.first, e.last + 1]))].sort((e, t) => e - t), i = [], a = 0, o = 0;
	for (let s = 0; s + 1 < r.length; s++) {
		let c = r[s], l = r[s + 1] - 1;
		for (; a < e.length && e[a].last < c;) a++;
		for (; o < t.length && t[o].last < c;) o++;
		let u = t[o], d = e[a], f = u && u.first <= c ? n : d && d.first <= c ? d.height : void 0;
		if (f === void 0) continue;
		let p = i.at(-1);
		if (p && p.last + 1 === c && p.height === f) i[i.length - 1] = {
			first: p.first,
			last: l,
			height: f
		};
		else {
			if (i.length === 16384) throw RangeError("Too many row resize intervals.");
			i.push({
				first: c,
				last: l,
				height: f
			});
		}
	}
	return Ht(i), Object.freeze(i.map((e) => Object.freeze(e)));
}
var wr = class {
	stashedRowHeights = /* @__PURE__ */ new Map();
	stashedColWidths = /* @__PURE__ */ new Map();
	stashedColCssWidths = /* @__PURE__ */ new Map();
	outlineStateStore = /* @__PURE__ */ new Map();
	sizeOverrideStore = /* @__PURE__ */ new Map();
	clear() {
		this.sizeOverrideStore.clear(), this.outlineStateStore.clear();
	}
	bindSheet(e) {
		let t = this.outlineStateStore.get(e);
		t || (t = {
			rowCollapsed: /* @__PURE__ */ new Map(),
			colCollapsed: /* @__PURE__ */ new Map(),
			stashedRowHeights: /* @__PURE__ */ new Map(),
			stashedColWidths: /* @__PURE__ */ new Map(),
			stashedColCssWidths: /* @__PURE__ */ new Map()
		}, this.outlineStateStore.set(e, t)), this.stashedRowHeights = t.stashedRowHeights, this.stashedColWidths = t.stashedColWidths, this.stashedColCssWidths = t.stashedColCssWidths;
	}
	setBandHidden(e, t, n, r, i) {
		if (n === "row") if (i) this.stashedRowHeights.has(r) || this.stashedRowHeights.set(r, e.rowHeights[r]), e.rowHeights[r] = 0;
		else if (this.stashedRowHeights.has(r)) {
			let t = this.stashedRowHeights.get(r);
			t === void 0 ? delete e.rowHeights[r] : e.rowHeights[r] = t, this.stashedRowHeights.delete(r);
		} else e.rowHeights[r] === 0 && delete e.rowHeights[r];
		else if (i) this.stashedColWidths.has(r) || (this.stashedColWidths.set(r, e.colWidths[r]), this.stashedColCssWidths.set(r, Bt(e, r))), e.colWidths[r] = 0, W(e, r, null);
		else if (this.stashedColWidths.has(r)) {
			let t = this.stashedColWidths.get(r);
			t === void 0 ? delete e.colWidths[r] : e.colWidths[r] = t, W(e, r, this.stashedColCssWidths.get(r) ?? null), this.stashedColWidths.delete(r), this.stashedColCssWidths.delete(r);
		} else e.colWidths[r] === 0 && (delete e.colWidths[r], W(e, r, null));
		this.recordSizeOverride(e, t, n, r);
	}
	recordSizeOverride(e, t, n, r, i) {
		let a = this.sizeOverrideStore.get(t);
		a || (a = {
			rows: /* @__PURE__ */ new Map(),
			automaticRows: /* @__PURE__ */ new Map(),
			cols: /* @__PURE__ */ new Map(),
			colCss: /* @__PURE__ */ new Map(),
			revision: 0
		}, this.sizeOverrideStore.set(t, a));
		let o = n === "row" ? a.rows : a.cols;
		n === "row" && a.automaticRows.delete(r);
		let s = n === "row" ? e.rowHeights[r] ?? null : e.colWidths[r] ?? null, c = !1;
		if (o.get(r) !== s && (o.set(r, s), c = !0), n === "col") {
			i !== void 0 && W(e, r, i);
			let t = Bt(e, r) ?? null;
			(a.colCss.has(r) ? a.colCss.get(r) !== t : t !== null) && (a.colCss.set(r, t), c = !0);
		}
		c && (a.revision++, a.wire = void 0);
	}
	assertResizeBudget(e, t, n, r) {
		let i = this.sizeOverrideStore.get(e), a = t === "row" ? i?.rows : i?.cols, o = a?.size ?? 0;
		for (let e of n) a?.has(e) || o++;
		if (o > r) throw RangeError(`A resize projection may retain at most ${r} manually edited bands per axis.`);
	}
	beginRowResizePreview(e, t, n) {
		let r = Vt(e), i = !1, a = (n) => {
			let r = this.sizeOverrideStore.get(t);
			!r && n.length && (r = {
				rows: /* @__PURE__ */ new Map(),
				automaticRows: /* @__PURE__ */ new Map(),
				cols: /* @__PURE__ */ new Map(),
				colCss: /* @__PURE__ */ new Map(),
				revision: 0
			}, this.sizeOverrideStore.set(t, r)), Kt(e, n), r && (r.rowHeightRanges = n, r.revision++, r.wire = void 0), q.invalidate(e);
		};
		return {
			apply: (e) => {
				a(Cr(r, n, e)), i = !0;
			},
			rollback: () => {
				i && a(r), i = !1;
			}
		};
	}
	restoreRowResizeRanges(e, t) {
		let n = this.sizeOverrideStore.get(e)?.rowHeightRanges ?? [], r = Vt(t);
		(n.length || r.length) && n !== r && (Kt(t, n), q.invalidate(t));
	}
	wireSizeOverrides(e) {
		let t = this.sizeOverrideStore.get(e);
		if (!(!t || t.rows.size === 0 && t.automaticRows.size === 0 && t.cols.size === 0 && !t.rowHeightRanges?.length)) {
			if (!t.wire) {
				let e = {};
				t.rowHeightRanges?.length && (e.rowHeightRanges = t.rowHeightRanges), (t.rows.size > 0 || t.automaticRows.size > 0) && (e.rows = Object.fromEntries([...t.automaticRows, ...t.rows])), t.cols.size > 0 && (e.cols = Object.fromEntries(t.cols)), t.colCss.size > 0 && (e.columnCssWidths = Object.fromEntries(t.colCss)), t.wire = e;
			}
			return {
				overrides: t.wire,
				revision: t.revision
			};
		}
	}
	manualRows(e) {
		return this.sizeOverrideStore.get(e)?.rows.keys() ?? [];
	}
	hasViewEdits(e) {
		let t = this.sizeOverrideStore.get(e);
		if (t && (t.rows.size > 0 || t.cols.size > 0 || t.rowHeightRanges?.length)) return !0;
		let n = this.outlineStateStore.get(e);
		return n !== void 0 && (n.rowCollapsed.size > 0 || n.colCollapsed.size > 0);
	}
	sizeRevision(e) {
		return this.sizeOverrideStore.get(e)?.revision ?? 0;
	}
	syncAutomaticRowOverrides(e, t) {
		let n = new Map(ut(t)), r = this.sizeOverrideStore.get(e);
		!r && n.size === 0 || (r || (r = {
			rows: /* @__PURE__ */ new Map(),
			automaticRows: /* @__PURE__ */ new Map(),
			cols: /* @__PURE__ */ new Map(),
			colCss: /* @__PURE__ */ new Map(),
			revision: 0
		}, this.sizeOverrideStore.set(e, r)), r.automaticRows = n, r.revision++, r.wire = void 0);
	}
	setBandCollapsed(e, t, n, r, i) {
		let a = this.outlineStateStore.get(t);
		if ((n === "row" ? a?.rowCollapsed : a?.colCollapsed)?.set(r, i), n === "row") {
			let t = e.rows.find((e) => e.index === r);
			t && (t.collapsed = i);
		} else e.colCollapsed = e.colCollapsed ?? {}, i ? e.colCollapsed[r] = !0 : delete e.colCollapsed[r];
	}
	restoreSheetViewState(e, t) {
		this.restoreRowResizeRanges(e, t);
		let n = this.sizeOverrideStore.get(e);
		if (n) {
			for (let [e, r] of n.rows) r === null ? delete t.rowHeights[e] : t.rowHeights[e] = r;
			for (let [e, r] of n.cols) r === null ? delete t.colWidths[e] : t.colWidths[e] = r;
			for (let [e, r] of n.colCss) W(t, e, r);
		}
		let r = this.outlineStateStore.get(e);
		if (r) {
			if (r.rowCollapsed.size > 0) for (let e of t.rows) {
				let t = r.rowCollapsed.get(e.index);
				t !== void 0 && (e.collapsed = t);
			}
			if (r.colCollapsed.size > 0) {
				t.colCollapsed = t.colCollapsed ?? {};
				for (let [e, n] of r.colCollapsed) n ? t.colCollapsed[e] = !0 : delete t.colCollapsed[e];
			}
		}
	}
	destroy() {
		this.outlineStateStore.clear(), this.stashedRowHeights.clear(), this.stashedColWidths.clear(), this.stashedColCssWidths.clear(), this.sizeOverrideStore.clear();
	}
};
function Tr(e) {
	return 8 + (e - 1) * 14;
}
function Er(e) {
	return e > 0 ? (e + 1) * 19 : 0;
}
function Dr(e, t, n, r, i, a, o, s, c = !1) {
	if (e === "row") {
		let e = Math.min(s, i + a), c = Math.min(s, i), l = s;
		return r > 0 && n <= r ? l = e : r > 0 && t > r && (c = e), {
			x: 0,
			y: c,
			w: o,
			h: Math.max(0, l - c)
		};
	}
	if (!c) {
		let e = Math.min(o, i + a), c = Math.min(o, i), l = o;
		return r > 0 && n <= r ? l = e : r > 0 && t > r && (c = e), {
			x: c,
			y: 0,
			w: Math.max(0, l - c),
			h: s
		};
	}
	let l = Math.max(0, o - i), u = Math.max(0, l - a), d = 0, f = l;
	return r > 0 && n <= r ? d = u : r > 0 && t > r && (f = u), {
		x: d,
		y: 0,
		w: Math.max(0, f - d),
		h: s
	};
}
function Or(e, t, n, r, i) {
	let a = Math.min(n, r), o = Math.max(n, r);
	return e === "row" ? [{
		x1: t,
		y1: a,
		x2: t,
		y2: o
	}, {
		x1: t,
		y1: n,
		x2: t + i / 2,
		y2: n
	}] : [{
		x1: a,
		y1: t,
		x2: o,
		y2: t
	}, {
		x1: n,
		y1: t,
		x2: n,
		y2: t + i / 2
	}];
}
function kr(e, t) {
	let n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = 0, a = 0;
	for (let t of e) t.level > 0 && n.set(t.index, t.level), t.collapsed && r.set(t.index, !0), t.index > i && (i = t.index), t.level > a && (a = t.level);
	let o = i, s = [];
	if (a === 0) return {
		maxLevel: 0,
		groups: s
	};
	let c = (e) => n.get(e) ?? 0;
	for (let e = 1; e <= a; e++) {
		let n = null;
		for (let i = 1; i <= o + 1; i++) c(i) >= e ? n ? n.end = i : n = {
			start: i,
			end: i
		} : n &&= (s.push(Ar(e, n, t, r, c)), null);
		n && s.push(Ar(e, n, t, r, c));
	}
	return {
		maxLevel: a,
		groups: s
	};
}
function Ar(e, t, n, r, i) {
	let a = null;
	if (n) {
		let n = t.end + 1;
		n >= 1 && i(n) < e && (a = n);
	} else {
		let n = t.start - 1;
		n >= 1 && i(n) < e && (a = n);
	}
	let o = a != null && (r.get(a) ?? !1);
	return {
		level: e,
		start: t.start,
		end: t.end,
		summary: a,
		collapsed: o
	};
}
function jr(e, t) {
	let n = !e.collapsed, r = /* @__PURE__ */ new Map();
	for (let e of t) r.set(e.index, e);
	let i = [], a = [];
	if (n) for (let t = e.start; t <= e.end; t++) i.push(t);
	else {
		let n = /* @__PURE__ */ new Set();
		for (let r of t) r.index >= e.start && r.index <= e.end && r.collapsed && n.add(r.index);
		for (let t = e.start; t <= e.end; t++) Mr(t, e, r, n) || a.push(t);
	}
	return {
		hide: i,
		show: a,
		nowCollapsed: n
	};
}
function Mr(e, t, n, r) {
	let i = n.get(e)?.level ?? 0;
	if (i <= t.level) return !1;
	for (let e of r) {
		let r = n.get(e)?.level ?? 0;
		if (!(r >= i) && !(r < t.level)) return !0;
	}
	return !1;
}
function Nr(e, t) {
	let n = [], r = [];
	for (let i of e) i.level >= t ? n.push(i.index) : r.push(i.index);
	return {
		hide: n,
		show: r
	};
}
function Pr(e) {
	let t = [];
	for (let n of e.rows) {
		let e = n.outlineLevel ?? 0, r = n.collapsed ?? !1;
		e === 0 && !r || t.push({
			index: n.index,
			level: e,
			collapsed: r,
			hidden: n.hidden ?? !1
		});
	}
	return t;
}
function Fr(e) {
	let t = e.colOutlineLevels ?? {}, n = e.colCollapsed ?? {}, r = e.colHidden ?? {}, i = /* @__PURE__ */ new Set();
	for (let e of Object.keys(t)) i.add(Number(e));
	for (let e of Object.keys(n)) i.add(Number(e));
	let a = [];
	for (let e of [...i].sort((e, t) => e - t)) a.push({
		index: e,
		level: t[e] ?? 0,
		collapsed: n[e] ?? !1,
		hidden: r[e] ?? !1
	});
	return a;
}
function Ir(e, t) {
	let n = e.outlinePr;
	return n ? t === "row" ? n.summaryBelow : n.summaryRight : !0;
}
var Z = class {
	cleanups = [];
	on(e, t, n, r) {
		e.addEventListener(t, n, r);
		let i = !0, a = () => {
			i && (i = !1, e.removeEventListener(t, n, r));
		};
		return this.cleanups.push(a), a;
	}
	dispose() {
		for (let e of this.cleanups.splice(0)) e();
	}
}, Lr = class {
	host;
	rowGutter;
	colGutter;
	cornerGutter;
	extent = {
		w: 0,
		h: 0
	};
	rowOutline = null;
	colOutline = null;
	rowOutlineBands = [];
	colOutlineBands = [];
	listeners = new Z();
	constructor(e) {
		this.host = e;
		let t = e.gridRegion.ownerDocument ?? document, n = "position:absolute;top:0;left:0;z-index:3;display:none;background:var(--ooxml-xlsx-chrome-background,#f5f5f5);";
		this.cornerGutter = t.createElement("canvas"), this.cornerGutter.style.cssText = n, this.cornerGutter.setAttribute("data-xlsx-outline", "corner"), this.colGutter = t.createElement("canvas"), this.colGutter.style.cssText = n, this.colGutter.setAttribute("data-xlsx-outline", "col"), this.rowGutter = t.createElement("canvas"), this.rowGutter.style.cssText = n, this.rowGutter.setAttribute("data-xlsx-outline", "row");
	}
	installListeners() {
		this.listeners.on(this.rowGutter, "pointerdown", (e) => this.onPointerDown(e, "row")), this.listeners.on(this.colGutter, "pointerdown", (e) => this.onPointerDown(e, "col"));
	}
	rebuild(e) {
		this.rowOutlineBands = Pr(e), this.colOutlineBands = Fr(e);
		let t = kr(this.rowOutlineBands, Ir(e, "row")), n = kr(this.colOutlineBands, Ir(e, "col"));
		this.rowOutline = t.maxLevel > 0 ? t : null, this.colOutline = n.maxLevel > 0 ? n : null;
	}
	layout() {
		let e = this.host.scale(), t = this.rowOutline ? Math.round(Er(this.rowOutline.maxLevel) * e) : 0, n = this.colOutline ? Math.round(Er(this.colOutline.maxLevel) * e) : 0;
		this.extent = {
			w: t,
			h: n
		};
		let r = this.host.gridRegion;
		t > 0 || n > 0 ? this.colGutter.parentElement || (r.appendChild(this.colGutter), r.appendChild(this.rowGutter), r.appendChild(this.cornerGutter)) : (this.colGutter.remove(), this.rowGutter.remove(), this.cornerGutter.remove()), this.host.canvasArea.style.left = `${t}px`, this.host.canvasArea.style.top = `${n}px`;
		let i = (e, t, n, r, i) => {
			if (r <= 0 || i <= 0) {
				e.style.display = "none";
				return;
			}
			e.style.display = "block", e.style.left = `${t}px`, e.style.top = `${n}px`, e.style.width = `${r}px`, e.style.height = `${i}px`;
		}, a = r.clientWidth, o = r.clientHeight;
		i(this.cornerGutter, 0, 0, t, n), i(this.colGutter, t, 0, Math.max(0, a - t), n), i(this.rowGutter, 0, n, t, Math.max(0, o - n));
	}
	render() {
		this.host.worksheet() && (this.extent.h > 0 && this.colOutline && this.paintAxisGutter("col"), this.extent.w > 0 && this.rowOutline && this.paintAxisGutter("row"), (this.extent.w > 0 || this.extent.h > 0) && this.paintCornerGutter());
	}
	paintAxisGutter(e) {
		let t = this.host.worksheet();
		if (!t) return;
		let n = this.host.scale(), r = this.host.chromeColors(), i = e === "row", a = i ? this.rowGutter : this.colGutter, o = i ? this.rowOutline : this.colOutline;
		if (!o) return;
		let s = parseFloat(a.style.width) || 0, c = parseFloat(a.style.height) || 0;
		if (s <= 0 || c <= 0) return;
		let l = this.host.surface.sizeCanvas(a, s, c), u = a.getContext("2d");
		if (!u) return;
		u.setTransform(l, 0, 0, l, 0, 0), u.clearRect(0, 0, s, c), u.fillStyle = r.background ?? "#f5f5f5", u.fillRect(0, 0, s, c);
		let d = 19 * n;
		u.strokeStyle = r.border ?? "#808080", u.lineWidth = 1, u.fillStyle = r.text ?? "#404040";
		let f = V(t), p = f.effectiveFrozenBands({
			scale: n,
			width: this.host.canvasArea.clientWidth,
			height: this.host.canvasArea.clientHeight,
			headerWidth: 50,
			headerHeight: 22,
			rows: t.freezeRows ?? 0,
			cols: t.freezeCols ?? 0
		}), m = f.axesAtScale(n), h = i ? p.rows : p.cols, g = i ? m.row.offsetOf(p.rows + 1) : m.col.offsetOf(p.cols + 1), _ = (i ? 22 : 50) * n, v = (n, r) => Dr(e, n, r, h, _, g, s, c, !i && t.rightToLeft === !0), y = (e, t) => {
			let n = v(e, t);
			return n.w <= 0 || n.h <= 0 ? !1 : (u.save(), u.beginPath(), u.rect(n.x, n.y, n.w, n.h), u.clip(), !0);
		};
		for (let t of o.groups) {
			let r = (t.level - 1 + .5) * d, a = i ? this.host.cellRect(t.start, 1) : this.host.cellRect(1, t.start), o = i ? this.host.cellRect(t.end, 1) : this.host.cellRect(1, t.end);
			if (!a || !o) continue;
			let s = i ? a.y : this.host.screenX(a.x, a.w), c = i ? o.y + o.h : this.host.screenX(o.x, o.w) + o.w, l = Math.min(s, c), f = Math.max(s, c);
			if (!t.collapsed && f - l > 1 && y(t.start, t.end)) {
				u.beginPath();
				for (let t of Or(e, r, s, c, d)) u.moveTo(t.x1, t.y1), u.lineTo(t.x2, t.y2);
				u.stroke(), u.restore();
			}
			if (t.summary != null) {
				let e = i ? this.host.cellRect(t.summary, 1) : this.host.cellRect(1, t.summary);
				if (e) {
					let a = i ? e.y + e.h / 2 : this.host.screenX(e.x, e.w) + e.w / 2;
					y(t.summary, t.summary) && (this.drawToggleBox(u, i ? r : a, i ? a : r, t.collapsed, n), u.restore());
				}
			}
		}
		let b = i ? 22 * n / 2 : 50 * n / 2;
		for (let e = 1; e <= o.maxLevel + 1; e++) {
			let t = Tr(e) * n;
			if (t + 12 * n / 2 > (i ? s : c) + .5) break;
			this.drawLevelButton(u, i ? t : b, i ? b : t, String(e), n);
		}
		if (h > 0) {
			let e = i ? _ + g : t.rightToLeft === !0 ? s - _ - g : _ + g;
			u.save(), u.strokeStyle = r.border ?? "#7a7a7a", u.lineWidth = .5, u.beginPath(), i ? (u.moveTo(0, e), u.lineTo(s, e)) : (u.moveTo(e, 0), u.lineTo(e, c)), u.stroke(), u.restore();
		}
	}
	drawToggleBox(e, t, n, r, i) {
		let a = this.host.chromeColors(), o = Math.round(9 * i), s = Math.round(t - o / 2), c = Math.round(n - o / 2);
		e.save(), e.fillStyle = a.surface ?? "#ffffff", e.strokeStyle = a.border ?? "#808080", e.lineWidth = 1, e.fillRect(s + .5, c + .5, o, o), e.strokeRect(s + .5, c + .5, o, o), e.strokeStyle = a.text ?? "#404040", e.beginPath(), e.moveTo(s + 2.5, c + o / 2 + .5), e.lineTo(s + o - 1.5, c + o / 2 + .5), r && (e.moveTo(s + o / 2 + .5, c + 2.5), e.lineTo(s + o / 2 + .5, c + o - 1.5)), e.stroke(), e.restore();
	}
	drawLevelButton(e, t, n, r, i) {
		let a = this.host.chromeColors(), o = Math.round(12 * i), s = Math.round(t - o / 2), c = Math.round(n - o / 2);
		e.save(), e.font = `${Math.round(9 * i)}px sans-serif`, e.textAlign = "center", e.textBaseline = "middle", e.fillStyle = a.surface ?? "#ffffff", e.strokeStyle = a.border ?? "#808080", e.lineWidth = 1, e.fillRect(s + .5, c + .5, o, o), e.strokeRect(s + .5, c + .5, o, o), e.fillStyle = a.text ?? "#404040", e.fillText(r, t, n + .5), e.restore();
	}
	paintCornerGutter() {
		let e = this.cornerGutter, t = parseFloat(e.style.width) || 0, n = parseFloat(e.style.height) || 0;
		if (t <= 0 || n <= 0) return;
		let r = this.host.surface.sizeCanvas(e, t, n), i = e.getContext("2d");
		i && (i.setTransform(r, 0, 0, r, 0, 0), i.clearRect(0, 0, t, n), i.fillStyle = this.host.chromeColors().background ?? "#f5f5f5", i.fillRect(0, 0, t, n));
	}
	onPointerDown(e, t) {
		if (!this.host.worksheet()) return;
		let n = t === "row", r = n ? this.rowOutline : this.colOutline;
		if (!r) return;
		let i = (n ? this.rowGutter : this.colGutter).getBoundingClientRect(), a = e.clientX - i.left, o = e.clientY - i.top, s = this.host.scale(), c = 19 * s, l = 7 * s, u = n ? 22 * s / 2 : 50 * s / 2;
		if ((n ? o : a) <= (n ? 22 : 50) * s) {
			for (let i = 1; i <= r.maxLevel + 1; i++) {
				let r = Tr(i) * s, c = n ? r : u, l = n ? u : r, d = 12 * s / 2;
				if (Math.abs(a - c) <= d && Math.abs(o - l) <= d) {
					e.preventDefault(), this.applyLevelButton(i, t);
					return;
				}
			}
			return;
		}
		for (let i of r.groups) {
			if (i.summary == null) continue;
			let r = (i.level - 1 + .5) * c, s = n ? this.host.cellRect(i.summary, 1) : this.host.cellRect(1, i.summary);
			if (!s) continue;
			let u = n ? s.y + s.h / 2 : this.host.screenX(s.x, s.w) + s.w / 2, d = n ? r : u, f = n ? u : r;
			if (Math.abs(a - d) <= l && Math.abs(o - f) <= l) {
				e.preventDefault(), this.applyGroupToggle(i, t);
				return;
			}
		}
	}
	applyGroupToggle(e, t) {
		let n = this.host.worksheet();
		if (!n) return;
		let { hide: r, show: i, nowCollapsed: a } = jr(e, t === "row" ? this.rowOutlineBands : this.colOutlineBands);
		for (let e of r) this.host.setBandHidden(t, e, !0);
		for (let e of i) this.host.setBandHidden(t, e, !1);
		e.summary != null && this.host.setBandCollapsed(t, e.summary, a), this.host.afterOutlineMutation(n, a && e.summary != null ? {
			axis: t,
			summary: e.summary
		} : void 0);
	}
	applyLevelButton(e, t) {
		let n = this.host.worksheet();
		if (!n) return;
		let { hide: r, show: i } = Nr(t === "row" ? this.rowOutlineBands : this.colOutlineBands, e);
		for (let e of r) this.host.setBandHidden(t, e, !0);
		for (let e of i) this.host.setBandHidden(t, e, !1);
		let a = t === "row" ? this.rowOutline : this.colOutline;
		if (a) for (let n of a.groups) n.summary != null && this.host.setBandCollapsed(t, n.summary, n.level >= e);
		this.host.afterOutlineMutation(n);
	}
	destroy() {
		this.listeners.dispose(), this.rowOutlineBands = [], this.colOutlineBands = [], this.rowOutline = null, this.colOutline = null;
	}
}, Rr = 30, zr = 50, Br = 1, Vr = .45, Q = 8, Hr = 320, Ur = " (right-click for sheet list)", Wr = /^#[0-9A-Fa-f]{6}$/, Gr = class {
	host;
	tabBar;
	tabStrip;
	tabList;
	navPrev;
	navNext;
	sheetList;
	tabs = [];
	tabColors = [];
	ownerDocument;
	navGroup;
	popoverSupported;
	listeners = new Z();
	tabListeners = new Z();
	sheetNames = [];
	activeIndex = 0;
	listItems = [];
	heldPointer = null;
	capturedPointer = null;
	pendingOpener = null;
	rtl = !1;
	openTimer;
	constructor(e, t) {
		this.host = t, this.ownerDocument = e, this.tabBar = e.createElement("div"), this.tabBar.style.cssText = `display:flex;align-items:flex-end;height:${Rr}px;flex-shrink:0;background:var(--ooxml-xlsx-chrome-background,#f0f0f0);border-top:1px solid var(--ooxml-xlsx-chrome-border,#c8ccd0);`, this.navPrev = this.makeNavButton("◀", "Scroll tabs left", () => this.scrollTabs(-1)), this.navNext = this.makeNavButton("▶", "Scroll tabs right", () => this.scrollTabs(1)), this.navPrev.dataset.xlsxTabNav = "prev", this.navNext.dataset.xlsxTabNav = "next";
		let n = e.createElement("div");
		n.style.cssText = `display:flex;flex-shrink:0;width:${zr}px;height:100%;`, n.appendChild(this.navPrev), n.appendChild(this.navNext), this.navGroup = n, this.tabStrip = e.createElement("div"), this.tabStrip.style.cssText = `position:relative;display:block;flex:1;min-width:0;height:100%;margin-left:${Br}px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;`, this.tabStrip.classList.add("xlsx-tab-strip"), this.listeners.on(this.tabStrip, "scroll", () => this.updateNavButtons()), this.tabList = e.createElement("div"), this.tabList.style.cssText = `display:flex;align-items:flex-end;height:100%;gap:${Br}px;box-sizing:border-box;`, this.tabList.style.width = "max-content", this.tabList.style.minWidth = "100%", this.tabStrip.appendChild(this.tabList), this.tabBar.appendChild(n), this.tabBar.appendChild(this.tabStrip), this.sheetList = e.createElement("div"), this.popoverSupported = typeof this.sheetList.showPopover == "function", this.popoverSupported && this.initSheetList();
	}
	append(e) {
		this.tabBar.appendChild(e);
	}
	build(e, t) {
		this.cancelPendingOpen(), this.closeSheetList(), this.sheetNames = e, this.tabListeners.dispose(), this.tabListeners = new Z(), this.tabList.innerHTML = "", this.tabs = [], this.tabColors = e.map((e, n) => {
			let r = t[n];
			return r && Wr.test(r) ? r : null;
		}), e.forEach((e, t) => {
			let n = this.ownerDocument.createElement("button");
			n.textContent = e, n.title = e, this.styleTab(n, t, !1), this.tabListeners.on(n, "click", () => this.host.selectSheet(t)), this.tabList.appendChild(n), this.tabs.push(n);
		}), this.updateNavButtons();
	}
	makeNavButton(e, t, n) {
		let r = this.ownerDocument.createElement("button");
		return r.textContent = e, r.setAttribute("aria-label", t), r.title = t, r.classList.add("xlsx-tab-nav"), r.style.cssText = this.navButtonStyle(!1), this.listeners.on(r, "click", n), r;
	}
	navButtonStyle(e) {
		return e ? "flex:1;height:100%;padding:0;display:flex;align-items:center;justify-content:center;border:none;color:var(--ooxml-xlsx-chrome-text-muted,#666);font-size:9px;line-height:1;box-sizing:border-box;outline:none;opacity:0.3;cursor:default;pointer-events:none;" : "flex:1;height:100%;padding:0;display:flex;align-items:center;justify-content:center;border:none;color:var(--ooxml-xlsx-chrome-text-muted,#666);font-size:9px;line-height:1;box-sizing:border-box;outline:none;cursor:pointer;";
	}
	scrollTabs(e) {
		let t = this.tabStrip, n = t.scrollLeft, r = n + t.clientWidth, i = null;
		if (e === 1) {
			let e = Infinity;
			for (let t of this.tabs) {
				let n = t.offsetLeft + t.offsetWidth;
				n > r + 1 && (e = Math.min(e, n));
			}
			Number.isFinite(e) && (i = e - t.clientWidth);
		} else {
			let e = -Infinity;
			for (let t of this.tabs) {
				let r = t.offsetLeft;
				r < n - 1 && (e = Math.max(e, r));
			}
			Number.isFinite(e) && (i = e);
		}
		i !== null && (t.scrollLeft = Math.max(0, Math.min(i, t.scrollWidth - t.clientWidth))), this.updateNavButtons();
	}
	updateNavButtons() {
		let e = this.tabStrip, t = e.scrollLeft <= 0, n = e.scrollLeft + e.clientWidth >= e.scrollWidth - 1;
		this.navPrev.style.cssText = this.navButtonStyle(t), this.navNext.style.cssText = this.navButtonStyle(n);
	}
	setActive(e) {
		let t = this.activeIndex;
		this.activeIndex = e, this.styleListItem(t), this.styleListItem(e), this.tabs.forEach((t, n) => this.styleTab(t, n, n === e));
		let n = this.tabs[e];
		if (n && n.offsetParent !== null) {
			let e = this.tabStrip, t = n.getBoundingClientRect(), r = e.getBoundingClientRect();
			t.left < r.left ? e.scrollLeft -= r.left - t.left : t.right > r.right && (e.scrollLeft += t.right - r.right);
		}
		this.updateNavButtons();
	}
	setDirection(e) {
		this.rtl = e, this.tabBar.style.flexDirection = e ? "row-reverse" : "row", this.tabStrip.style.marginLeft = e ? "0" : `${Br}px`, this.tabStrip.style.marginRight = e ? `${Br}px` : "0", this.tabList.style.flexDirection = e ? "row-reverse" : "row";
	}
	tabStyle(e) {
		return e ? `display:inline-block;flex:none;padding:0 14px;position:relative;border:1px solid var(--ooxml-xlsx-chrome-border,#c8ccd0);border-bottom:none;border-radius:3px 3px 0 0;cursor:pointer;white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;outline:none;box-sizing:border-box;height:${Rr - 2}px;font-size:13px;background:var(--ooxml-xlsx-chrome-surface,#fff);color:var(--ooxml-xlsx-chrome-text,#000);border-bottom:1px solid var(--ooxml-xlsx-chrome-surface,#fff);font-weight:600;top:1px;` : `display:inline-block;flex:none;padding:0 14px;position:relative;border:1px solid var(--ooxml-xlsx-chrome-border,#c8ccd0);border-bottom:none;border-radius:3px 3px 0 0;cursor:pointer;white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;outline:none;box-sizing:border-box;height:${Rr - 5}px;font-size:11px;background:var(--ooxml-xlsx-chrome-surface-muted,#e0e0e0);color:var(--ooxml-xlsx-chrome-text-muted,#555);`;
	}
	styleTab(e, t, n) {
		e.style.cssText = this.tabCss(t, n);
		let r = this.tabColors[t];
		r && (e.style.boxShadow = `inset 0 -${n ? 2 : 3}px 0 0 ${r}`);
	}
	tabCss(e, t) {
		let n = this.tabStyle(t), r = this.host.hiddenSheetMode();
		return r !== "show" && this.host.isHidden(e) && (n += r === "skip" ? "display:none;" : `opacity:${Vr};`), n;
	}
	initSheetList() {
		let e = this.sheetList;
		e.setAttribute("popover", "auto"), e.setAttribute("role", "group"), e.setAttribute("aria-label", "Sheets"), e.dataset.xlsxSheetList = "", e.style.cssText = `inset:auto;margin:0;padding:4px 0;box-sizing:border-box;min-width:${zr}px;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;background:var(--ooxml-xlsx-chrome-surface,#fff);color:var(--ooxml-xlsx-chrome-text,#000);border:1px solid var(--ooxml-xlsx-chrome-border,#c8ccd0);border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,0.2);`, this.tabBar.appendChild(e), this.navPrev.title += Ur, this.navNext.title += Ur, this.listeners.on(this.navGroup, "contextmenu", (e) => this.onNavContextMenu(e)), this.listeners.on(this.navGroup, "pointerdown", (e) => this.onNavPointerDown(e)), this.listeners.on(this.navGroup, "pointerup", (e) => this.onNavPointerUp(e)), this.listeners.on(this.navGroup, "pointercancel", (e) => this.onNavPointerCancel(e)), this.listeners.on(e, "click", (e) => this.onSheetListClick(e)), this.listeners.on(e, "keydown", (e) => this.onSheetListKeyDown(e)), this.listeners.on(e, "toggle", (e) => {
			e.newState === "closed" && (this.listItems = [], this.sheetList.replaceChildren());
		});
	}
	onNavPointerDown(e) {
		this.pendingOpener || (this.heldPointer = e.pointerId);
	}
	onNavContextMenu(e) {
		if (this.sheetNames.length === 0) return;
		e.preventDefault(), this.clearOpenTimer();
		let t = this.navOpener(e);
		if (e.buttons === 0 || this.heldPointer === null) {
			this.cancelPendingOpen(), this.openSheetList(t);
			return;
		}
		let n = this.heldPointer;
		try {
			this.navGroup.setPointerCapture(n);
		} catch {
			this.cancelPendingOpen(), this.openSheetList(t);
			return;
		}
		this.capturedPointer = n, this.pendingOpener = t;
	}
	navOpener(e) {
		if (e.target === this.navPrev) return this.navPrev;
		if (e.target === this.navNext) return this.navNext;
		let t = this.navNext.getBoundingClientRect();
		return e.clientX >= t.left && e.clientX < t.right ? this.navNext : this.navPrev;
	}
	onNavPointerUp(e) {
		if (e.pointerId !== this.heldPointer) return;
		this.heldPointer = null, this.capturedPointer = null;
		let t = this.pendingOpener;
		if (!t) return;
		this.pendingOpener = null;
		let n = this.ownerDocument.defaultView;
		n && (this.openTimer = n.setTimeout(() => {
			this.openTimer = void 0, this.openSheetList(t);
		}, 0));
	}
	onNavPointerCancel(e) {
		e.pointerId === this.heldPointer && this.cancelPendingOpen();
	}
	clearOpenTimer() {
		this.openTimer !== void 0 && this.ownerDocument.defaultView?.clearTimeout(this.openTimer), this.openTimer = void 0;
	}
	cancelPendingOpen() {
		this.clearOpenTimer(), this.pendingOpener = null, this.heldPointer = null;
		let e = this.capturedPointer;
		this.capturedPointer = null, e !== null && this.navGroup.hasPointerCapture(e) && this.navGroup.releasePointerCapture(e);
	}
	openSheetList(e) {
		let t = this.sheetList;
		if (!t.isConnected) return;
		this.renderSheetList(), e.focus({ preventScroll: !0 }), t.matches(":popover-open") || t.showPopover(), this.placeSheetList(this.navGroup);
		let n = this.listItems[this.activeIndex] ?? this.listItems.find((e) => e !== void 0);
		n && this.focusListItem(n);
	}
	renderSheetList() {
		let e = this.host.hiddenSheetMode() === "skip";
		this.listItems = [], this.sheetList.replaceChildren(), this.sheetNames.forEach((t, n) => {
			if (e && this.host.isHidden(n)) return;
			let r = this.ownerDocument.createElement("button");
			r.type = "button", r.textContent = t, r.title = t, this.listItems[n] = r, this.styleListItem(n), this.sheetList.appendChild(r);
		});
	}
	styleListItem(e) {
		let t = this.listItems[e];
		if (!t) return;
		let n = e === this.activeIndex, r = "display:block;width:100%;box-sizing:border-box;margin:0;padding:4px 16px 4px 12px;border:none;text-align:start;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;color:inherit;cursor:pointer;";
		r += n ? "font-weight:600;background:var(--ooxml-xlsx-chrome-surface-muted,#e0e0e0);" : "background:transparent;", this.host.hiddenSheetMode() === "dim" && this.host.isHidden(e) && (r += `opacity:${Vr};`), t.style.cssText = r, n ? t.setAttribute("aria-current", "true") : t.removeAttribute("aria-current");
	}
	placeSheetList(e) {
		let t = this.sheetList, n = this.ownerDocument.documentElement, r = e.getBoundingClientRect(), i = r.top - Q, a = n.clientHeight - r.bottom - Q, o = i >= a;
		t.style.maxHeight = `${Math.max(0, Math.floor(o ? i : a))}px`, t.style.maxWidth = `${Math.max(0, Math.min(Hr, n.clientWidth - 2 * Q))}px`;
		let { width: s, height: c } = t.getBoundingClientRect();
		t.style.top = `${o ? r.top - c : r.bottom}px`;
		let l = this.rtl ? r.right - s : r.left;
		t.style.left = `${Math.max(Q, Math.min(l, n.clientWidth - s - Q))}px`;
	}
	focusListItem(e) {
		e.focus({ preventScroll: !0 });
		let t = this.sheetList, n = e.offsetTop, r = n + e.offsetHeight;
		n < t.scrollTop ? t.scrollTop = n : r > t.scrollTop + t.clientHeight && (t.scrollTop = r - t.clientHeight);
	}
	onSheetListClick(e) {
		let t = this.listItems.indexOf(e.target);
		t < 0 || (this.sheetList.hidePopover(), this.host.selectSheet(t));
	}
	onSheetListKeyDown(e) {
		if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
		e.preventDefault();
		let t = this.listItems.filter((e) => e !== void 0);
		if (t.length === 0) return;
		let n = t.indexOf(this.ownerDocument.activeElement), r = e.key === "ArrowDown" ? 1 : -1, i = n < 0 ? r > 0 ? 0 : t.length - 1 : (n + r + t.length) % t.length;
		this.focusListItem(t[i]);
	}
	closeSheetList() {
		this.popoverSupported && this.sheetList.isConnected && this.sheetList.matches(":popover-open") && this.sheetList.hidePopover();
	}
	destroy() {
		this.cancelPendingOpen(), this.closeSheetList(), this.listItems = [], this.tabListeners.dispose(), this.listeners.dispose();
	}
}, Kr = 2;
function qr(e, t, n) {
	return e <= 50 ? t + e / 50 * (1 - t) : 1 + (e - 50) / 50 * (n - 1);
}
function Jr(e, t, n) {
	let r = Math.min(n, Math.max(t, e));
	return r <= 1 ? (r - t) / (1 - t) * 50 : 50 + (r - 1) / (n - 1) * 50;
}
var Yr = class {
	host;
	element;
	slider;
	label;
	listeners = new Z();
	constructor(e, t, n, r, i) {
		this.host = t;
		let a = e.createElement("div");
		a.style.cssText = "display:flex;align-items:center;flex-shrink:0;gap:2px;padding:0 10px;height:100%;color:var(--ooxml-xlsx-chrome-text-muted,#555);font-size:12px;user-select:none;";
		let o = (t, n, r) => {
			let i = e.createElement("button");
			return i.type = "button", i.textContent = t, i.setAttribute("aria-label", n), i.title = n, i.style.cssText = "width:18px;height:18px;padding:0;border:none;background:transparent;color:var(--ooxml-xlsx-chrome-text-muted,#555);font-size:14px;line-height:1;cursor:pointer;border-radius:3px;", this.listeners.on(i, "click", r), i;
		}, s = e.createElement("input");
		s.type = "range", s.min = "0", s.max = "100", s.step = "any", s.value = String(Jr(n, r, i)), s.setAttribute("aria-label", "Zoom"), s.title = "Zoom", s.classList.add("xlsx-zoom-slider"), s.style.cssText = "width:90px;cursor:pointer;", this.listeners.on(s, "input", () => {
			let e = Number(s.value), t = Math.abs(e - 50) <= Kr ? 50 : e;
			t === 50 && (s.value = "50"), this.host.setScale(qr(t, r, i));
		});
		let c = e.createElement("span");
		c.textContent = `${Math.round(n * 100)}%`, c.style.cssText = "min-width:42px;margin-left:6px;text-align:right;font-variant-numeric:tabular-nums;", a.appendChild(o("−", "Zoom out", () => this.host.zoomOut())), a.appendChild(s), a.appendChild(o("+", "Zoom in", () => this.host.zoomIn())), a.appendChild(c), this.element = a, this.slider = s, this.label = c;
	}
	sync(e, t, n, r) {
		this.slider.value = String(Jr(e, n, r)), this.label.textContent = `${t}%`;
	}
	destroy() {
		this.listeners.dispose();
	}
};
function Xr(e, t, n) {
	if (!e) return !1;
	for (let r of e.split(/\s+/)) {
		if (!r) continue;
		let [e, i] = r.split(":"), a = B(e);
		if (!a) continue;
		if (!i) {
			if (a.row === t && a.col === n) return !0;
			continue;
		}
		let o = B(i);
		if (!o) continue;
		let s = Math.min(a.row, o.row), c = Math.max(a.row, o.row), l = Math.min(a.col, o.col), u = Math.max(a.col, o.col);
		if (t >= s && t <= c && n >= l && n <= u) return !0;
	}
	return !1;
}
function Zr(e, t, n) {
	if (!e) return null;
	for (let r of e) if (r.validationType === "list" && Xr(r.sqref, t, n)) return r;
	return null;
}
var Qr = class {
	host;
	panel;
	panelKey = null;
	requestGeneration = 0;
	arrowRect = null;
	outsideHandler = null;
	itemListeners = new Z();
	constructor(e) {
		this.host = e, this.panel = e.overlayHost.validation;
	}
	isOpen() {
		return this.panel.style.display !== "none";
	}
	hitsArrow(e, t) {
		let n = this.arrowRect;
		if (!n) return !1;
		let { x: r, y: i } = this.host.surface.localPoint(e, t);
		return r >= n.x && r <= n.x + n.w && i >= n.y && i <= n.y + n.h;
	}
	drawDropdown() {
		if (this.arrowRect = null, this.host.selectionMode() !== "cells") return;
		let e = this.host.worksheet(), t = this.host.activeCell();
		if (!e || !t || !Zr(e.dataValidations, t.row, t.col)) return;
		let n = this.host.cellRect(t.row, t.col);
		if (!n) return;
		let r = this.host.scale(), i = Math.round(50 * r), a = Math.round(22 * r), o = Math.max(14, Math.min(n.h, 22 * r)), s = n.x + n.w, c = n.y;
		if (s + o <= i || c + o <= a) return;
		let l = this.host.screenX(s, o), u = this.host.ownerDocument.createElement("div");
		u.setAttribute("data-xlsx-validation-dropdown", ""), u.style.cssText = `position:absolute;left:${l}px;top:${c}px;width:${o}px;height:${o}px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;background:#f0f0f0;border:1px solid #7f7f7f;pointer-events:none;`;
		let d = Math.max(4, Math.round(o * .42));
		u.innerHTML = `<svg width="${d}" height="${d}" viewBox="0 0 10 6" aria-hidden="true"><path d="M0 0 L10 0 L5 6 Z" fill="#333"/></svg>`, this.host.overlayHost.appendSelection(u), this.arrowRect = {
			x: l,
			y: c,
			w: o,
			h: o
		}, this.isOpen() && (this.panelKey === `${t.row}:${t.col}` ? this.position() : this.hide());
	}
	toggle() {
		let e = this.host.worksheet(), t = this.host.activeCell();
		if (!e || !t) return;
		let n = `${t.row}:${t.col}`;
		if (this.panelKey === n) {
			this.hide();
			return;
		}
		let r = Zr(e.dataValidations, t.row, t.col);
		r && (this.hide(), this.panelKey = n, this.open(t, r.formula1));
	}
	async open(e, t) {
		let n = ++this.requestGeneration, r = this.host.workbook(), i = this.host.currentSheet();
		if (!r || this.host.isDestroyed()) return;
		let a;
		try {
			a = await r.resolveValidationList(i, t);
		} catch {
			if (!this.isCurrentRequest(n, r, i, e)) return;
			a = {
				kind: "formula",
				formula: t ?? ""
			};
		}
		this.isCurrentRequest(n, r, i, e) && (this.render(a), this.position(), this.installOutsideHandler());
	}
	isCurrentRequest(e, t, n, r) {
		let i = this.host.activeCell();
		return !this.host.isDestroyed() && e === this.requestGeneration && this.host.workbook() === t && this.host.currentSheet() === n && this.panelKey === `${r.row}:${r.col}` && i?.row === r.row && i?.col === r.col;
	}
	render(e) {
		let t = this.panel;
		if (this.itemListeners.dispose(), this.itemListeners = new Z(), t.textContent = "", e.kind === "formula" || e.values.length === 0) {
			let n = this.host.ownerDocument.createElement("div");
			n.style.cssText = "padding:4px 8px;color:#666;font-style:italic;white-space:pre-wrap;word-break:break-word;", n.textContent = e.kind === "formula" ? e.formula ? `= ${e.formula}` : "(no list)" : "(empty list)", t.appendChild(n);
			return;
		}
		for (let n of e.values) {
			let e = this.host.ownerDocument.createElement("div");
			e.setAttribute("data-xlsx-validation-item", ""), e.style.cssText = "padding:3px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:default;", e.textContent = n, this.itemListeners.on(e, "pointerenter", () => {
				e.style.background = "#cfe3ff";
			}), this.itemListeners.on(e, "pointerleave", () => {
				e.style.background = "";
			}), t.appendChild(e);
		}
	}
	position() {
		let e = this.host.activeCell();
		if (!e) return;
		let t = this.host.cellRect(e.row, e.col);
		if (!t) return;
		let n = this.host.screenX(t.x, t.w);
		this.panel.style.left = "-9999px", this.panel.style.top = "-9999px", this.panel.style.display = "block";
		let r = xn({
			cell: {
				x: n,
				y: t.y,
				w: t.w,
				h: t.h
			},
			panel: {
				w: this.panel.offsetWidth,
				h: this.panel.offsetHeight
			},
			viewport: {
				w: this.host.canvasArea.clientWidth,
				h: this.host.canvasArea.clientHeight
			},
			rtl: this.host.isRtl()
		});
		this.host.overlayHost.showValidation(r.left, r.top);
	}
	installOutsideHandler() {
		this.outsideHandler || (this.outsideHandler = (e) => {
			let t = e.target;
			t && this.panel.contains(t) || this.hitsArrow(e.clientX, e.clientY) || this.hide();
		}, this.host.ownerDocument.addEventListener("pointerdown", this.outsideHandler, !0));
	}
	hide() {
		this.requestGeneration++, this.host.overlayHost.hideValidation(), this.panelKey = null, this.outsideHandler &&= (this.host.ownerDocument.removeEventListener("pointerdown", this.outsideHandler, !0), null);
	}
	destroy() {
		this.hide(), this.itemListeners.dispose();
	}
};
function $r(e) {
	let t = e.trim();
	return t.startsWith("#") && (t = t.slice(1).trim()), t.startsWith("=") && (t = t.slice(1).trim()), t;
}
function ei(e) {
	let t = !1, n = -1;
	for (let r = 0; r < e.length; r++) e[r] === "'" ? t && e[r + 1] === "'" ? r++ : t = !t : e[r] === "!" && !t && (n = r);
	return t ? -1 : n;
}
function ti(e) {
	let t = e.trim();
	return t.length >= 2 && t.startsWith("'") && t.endsWith("'") ? t.slice(1, -1).replace(/''/g, "'") : t;
}
function ni(e, t, n) {
	let r = ei(e), i = r >= 0 ? ti(e.slice(0, r)) : void 0, a = (r >= 0 ? e.slice(r + 1) : e).split(":", 1)[0]?.trim() ?? "";
	if (!B(a)) return null;
	let o = t;
	if (i !== void 0) {
		let e = i.toLocaleLowerCase("en-US");
		if (o = n.findIndex((t) => t.toLocaleLowerCase("en-US") === e), o < 0) return null;
	}
	return o < 0 || o >= n.length ? null : {
		sheetIndex: o,
		cellRef: a
	};
}
function ri(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let e of r) i.set(e.name.toLocaleLowerCase("en-US"), e);
	let a = $r(e), o = /* @__PURE__ */ new Set();
	for (;;) {
		let e = ni(a, t, n);
		if (e) return e;
		let r = a.toLocaleLowerCase("en-US");
		if (!r || o.has(r)) return null;
		o.add(r);
		let s = i.get(r);
		if (!s) return null;
		a = $r(s.formula);
	}
}
var ii = class {
	host;
	hyperlinkMap = /* @__PURE__ */ new Map();
	constructor(e) {
		this.host = e;
	}
	build(e) {
		this.hyperlinkMap = /* @__PURE__ */ new Map();
		for (let t of e.hyperlinks ?? []) this.hyperlinkMap.set(`${t.row}:${t.col}`, t);
	}
	at(e) {
		return this.host.enabled() ? this.hyperlinkMap.get(`${e.row}:${e.col}`) ?? null : null;
	}
	dispatch(e) {
		let t = this.at(e);
		if (!t) return !1;
		let n;
		if (t.url) n = {
			kind: "external",
			url: t.url
		};
		else if (t.location) n = {
			kind: "internal",
			ref: t.location
		};
		else return !1;
		let r = this.host.onHyperlinkClick();
		return r ? (r(n), !0) : (n.kind === "external" ? I(n.url, void 0, this.host.hostWindow) : this.navigateInternal(n.ref).catch((e) => this.host.reportError(e)), !0);
	}
	async navigateInternal(e) {
		let t = ri(e, this.host.currentSheet(), this.host.sheetNames(), this.host.definedNames());
		t && (t.sheetIndex !== this.host.currentSheet() && await this.host.goToSheet(t.sheetIndex), await this.host.scrollToCell(t.cellRef));
	}
	destroy() {
		this.hyperlinkMap.clear();
	}
}, ai = class {
	_sheetCount;
	_sheetName;
	_collectSheetCells;
	_matches = [];
	_active = -1;
	_generation = 0;
	constructor(e, t, n) {
		this._sheetCount = e, this._sheetName = t, this._collectSheetCells = n;
	}
	invalidate() {
		this._generation++, this._matches = [], this._active = -1;
	}
	sheetHighlights(e) {
		let t = [];
		for (let n = 0; n < this._matches.length; n++) {
			let r = this._matches[n];
			r.sheet === e && t.push({
				row: r.row,
				col: r.col,
				active: n === this._active
			});
		}
		return t;
	}
	activeLocation() {
		return this._locationAt(this._active);
	}
	_locationAt(e) {
		let t = this._matches[e];
		return t ? {
			sheet: t.sheet,
			sheetName: t.sheetName,
			ref: at(t.row, t.col),
			row: t.row,
			col: t.col
		} : null;
	}
	matches() {
		return this._matches.map((e, t) => {
			let n = this._locationAt(t);
			return {
				matchIndex: t,
				text: e.text,
				location: n
			};
		});
	}
	async find(e, t = {}) {
		let n = ++this._generation;
		if (e.length === 0) return this._matches = [], this._active = -1, [];
		let r = this._sheetCount(), i = [];
		for (let a = 0; a < r; a++) {
			let r;
			try {
				r = await this._collectSheetCells(a);
			} catch (e) {
				if (n !== this._generation) return [];
				throw e;
			}
			if (n !== this._generation) return [];
			let o = this._sheetName(a);
			for (let n of r) {
				let r = be(Te([{ text: n.text }]), e, t);
				for (let e of r) {
					let t = e.slices[0], r = n.text.slice(t.start, t.end);
					i.push({
						sheet: a,
						sheetName: o,
						row: n.row,
						col: n.col,
						text: r
					});
				}
			}
		}
		return n === this._generation ? (this._matches = i, this._active = -1, this.matches()) : [];
	}
	next() {
		return this._active = De(this._active, this._matches.length), this._activePublic();
	}
	prev() {
		return this._active = Ee(this._active, this._matches.length), this._activePublic();
	}
	_activePublic() {
		let e = this._locationAt(this._active);
		return e ? {
			matchIndex: this._active,
			text: this._matches[this._active].text,
			location: e
		} : null;
	}
}, oi = "color-mix(in srgb, #ffb300 8%, transparent)", si = "color-mix(in srgb, #fb8c00 8%, transparent)";
function ci(e, t = {}) {
	let n = e ? "#fb8c00" : "#ffb300", r = e ? t.active : t.match, i = r ?? (e ? si : oi);
	return {
		border: `2px solid ${r ?? n}`,
		background: i
	};
}
var li = class {
	host;
	controller;
	constructor(e) {
		this.host = e, this.controller = new ai(() => e.sheetCount(), (t) => e.workbook()?.sheetNames[t] ?? "", (e) => this.collectSheetCells(e));
	}
	async collectSheetCells(e) {
		let t = this.host.workbook();
		if (!t) return [];
		let n = await Wn(t, e);
		try {
			let e = n.worksheet, r = [];
			for (let n of e.rows) for (let i of n.cells) {
				let n = t.cellText(e, i);
				n !== "" && r.push({
					row: i.row,
					col: i.col,
					text: n
				});
			}
			return r;
		} finally {
			n.release();
		}
	}
	invalidate() {
		this.controller.invalidate();
	}
	updateOverlay() {
		let e = this.host.overlayHost;
		e.clearFind();
		let t = this.host.worksheet();
		if (!t) return;
		let n = this.host.scale(), r = (e) => Math.round(e * n), i = r(50), a = r(22), o = t.freezeRows ?? 0, s = t.freezeCols ?? 0, c = V(t).roundedFrozenExtent(n), l = i + c.width, u = a + c.height, d = this.host.highlightColors(), f = ci(!1, d), p = ci(!0, d);
		for (let t of this.controller.sheetHighlights(this.host.currentSheet())) {
			let n = this.host.cellRect(t.row, t.col);
			if (!n) continue;
			let { x: r, y: c, w: d, h: m } = n;
			if (r < i && (d -= i - r, r = i), c < a && (m -= a - c, c = a), t.col > s && r < l && (d -= l - r, r = l), t.row > o && c < u && (m -= u - c, c = u), d <= 0 || m <= 0) continue;
			let h = this.host.screenX(r, d), { border: g, background: _ } = t.active ? p : f, v = this.host.ownerDocument.createElement("div");
			v.style.cssText = `position:absolute;left:${h}px;top:${c}px;width:${d}px;height:${m}px;box-sizing:border-box;border:${g};background:${_};pointer-events:none;`, e.appendFind(v);
		}
	}
	async find(e, t = {}) {
		if (!this.host.workbook()) return [];
		let n = await this.controller.find(e, t);
		return this.updateOverlay(), n;
	}
	async next() {
		return this.activateMatch(this.controller.next());
	}
	async prev() {
		return this.activateMatch(this.controller.prev());
	}
	clear() {
		this.controller.invalidate(), this.updateOverlay();
	}
	async activateMatch(e) {
		if (!e) return this.updateOverlay(), null;
		let { sheet: t, row: n, col: r } = e.location;
		return t !== this.host.currentSheet() && await this.host.goToSheet(t), this.host.scrollCellIntoView(n, r), this.updateOverlay(), e;
	}
	destroy() {
		this.controller.invalidate();
	}
}, ui = 25e4, di = 8 * 1024 * 1024;
function fi(e, t) {
	let n = 0, r = !1;
	for (let t = 0; t < e.length; t++) {
		let i = e.charCodeAt(t);
		i === 34 ? (n++, r = !0) : (i === 9 || i === 10 || i === 13) && (r = !0);
	}
	return e.length + (r ? n + 2 : 0) > t ? null : r ? `"${e.replace(/"/g, "\"\"")}"` : e;
}
var pi = class {
	host;
	constructor(e) {
		this.host = e;
	}
	async copy() {
		let e = this.host.worksheet(), t = this.host.selection();
		if (!e || !t) return { status: "empty-selection" };
		if (t.areas.length !== 1) return { status: "unsupported-multiple-areas" };
		let n = t.areas[0], r = this.host.workbook(), i = 1, a = 1;
		for (let t of e.rows) {
			t.index > i && (i = t.index);
			for (let e of t.cells) e.col > a && (a = e.col);
		}
		let { r1: o, r2: s, c1: c, c2: l } = n.kind === "sheet" ? {
			r1: 1,
			r2: i,
			c1: 1,
			c2: a
		} : n.kind === "rows" ? {
			r1: n.firstRow,
			r2: n.lastRow,
			c1: 1,
			c2: a
		} : n.kind === "columns" ? {
			r1: 1,
			r2: i,
			c1: n.firstColumn,
			c2: n.lastColumn
		} : {
			r1: n.top,
			r2: n.bottom,
			c1: n.left,
			c2: n.right
		}, u = s - o + 1, d = l - c + 1;
		if (u > Math.floor(ui / d)) return {
			status: "too-large",
			limit: "cells"
		};
		let f = u * d, p = Math.max(0, u - 1) + u * Math.max(0, d - 1);
		if (p > di) return {
			status: "too-large",
			limit: "text"
		};
		let m = /* @__PURE__ */ new Map();
		for (let t of e.rows) if (!(t.index < o || t.index > s)) for (let n of t.cells) {
			if (n.col < c || n.col > l) continue;
			let i = n.value, a = r?.cellText(e, n) ?? "";
			if (r || (i.type === "text" ? a = i.runs ? i.runs.map((e) => e.text).join("") : i.text : i.type === "number" ? a = String(i.number) : i.type === "bool" ? a = i.bool ? "TRUE" : "FALSE" : i.type === "error" && (a = i.error)), a) {
				let e = fi(a, di - p);
				if (e === null) return {
					status: "too-large",
					limit: "text"
				};
				p += e.length;
				let r = m.get(t.index);
				r || (r = /* @__PURE__ */ new Map(), m.set(t.index, r)), r.set(n.col, e);
			}
		}
		let h = [];
		for (let e = o; e <= s; e++) {
			let t = [], n = m.get(e);
			for (let e = c; e <= l; e++) {
				let r = n?.get(e) ?? "";
				t.push(r);
			}
			h.push(t.join("	"));
		}
		let g = this.host.clipboard();
		if (!g) return { status: "clipboard-unavailable" };
		try {
			return await g.writeText(h.join("\n")), {
				status: "copied",
				cellCount: f,
				utf16CodeUnits: p
			};
		} catch {
			return { status: "clipboard-denied" };
		}
	}
}, mi = 40, hi = 900;
function gi(e, t) {
	if (t <= 0) return 0;
	let n = Math.min(mi, t / 2);
	return e < n ? -900 * Math.min(1, Math.max(0, (n - e) / n)) : e > t - n ? hi * Math.min(1, Math.max(0, (e - (t - n)) / n)) : 0;
}
function _i(e, t, n, r) {
	if (r === "all") return {
		x: 0,
		y: 0
	};
	let i = r === "rows" ? 0 : gi(e.x, t.width), a = r === "cols" ? 0 : gi(e.y, t.height);
	return {
		x: n ? -i : i,
		y: a
	};
}
var vi = 4, yi = 5, bi = 16384;
function xi(e, t, n, r) {
	for (let { index: i, edge: a } of t) if (!(a <= r) && Math.abs(e - a) <= n) return i;
	return null;
}
var Si = class {
	host;
	cleanups = [];
	pendingTap = null;
	pendingClick = null;
	pendingElementClick = null;
	resizeDrag = null;
	selectionAutoScrollPointer = null;
	selectionAutoScrollFrame = null;
	selectionAutoScrollLastTime = null;
	constructor(e) {
		this.host = e;
	}
	get anchorCell() {
		return this.host.selection.anchor;
	}
	get activeCell() {
		return this.host.selection.active;
	}
	get selectionMode() {
		return this.host.selection.mode;
	}
	get isSelecting() {
		return this.host.selection.dragging;
	}
	get selectionPointerId() {
		return this.host.selection.draggingPointerId;
	}
	on(e, t, n) {
		this.cleanups.push(this.host.surface.on(e, t, n));
	}
	cancelDeferredPress() {
		this.pendingTap = null, this.pendingElementClick = null;
	}
	clearSheetGestures() {
		this.pendingTap = null, this.pendingClick = null, this.pendingElementClick = null, this.resizeDrag && this.finishResize(this.resizeDrag.pointerId, !1, !0);
	}
	get rowResizePreview() {
		return this.resizeDrag?.rowPreview;
	}
	abortRowResizePreview(e) {
		this.resizeDrag?.rowPreview === e && this.finishResize(this.resizeDrag.pointerId, !1, !0);
	}
	beginSelectionDrag(e) {
		this.pendingTap?.pointerId !== e && (this.pendingTap = null), this.pendingClick?.pointerId !== e && (this.pendingClick = null), this.host.selection.beginDrag(e);
	}
	getHeaderHit(e, t, n = "displayed") {
		let r = this.host.worksheet();
		if (!r) return null;
		let i = this.host.scale(), a = this.host.canvasArea.getBoundingClientRect(), o = this.host.screenX(e - a.left, 0), s = t - a.top, c = Math.round(50 * i), l = Math.round(22 * i), u = o < c, d = s < l;
		if (!u && !d) return null;
		if (u && d) return { kind: "corner" };
		let f = V(r), p = n === "logical" ? {
			x: this.host.scrollLeft(),
			y: this.host.scrollTop()
		} : this.host.displayedViewportOffset();
		if (u) {
			let e = s - l;
			if (e < 0) return { kind: "corner" };
			let t = f.rowAt(e, p.y, i);
			return t === null ? null : {
				kind: "row",
				row: t
			};
		}
		let m = o - c;
		if (m < 0) return { kind: "corner" };
		let h = f.colAt(m, p.x, i);
		return h === null ? null : {
			kind: "col",
			col: h
		};
	}
	getResizeTarget(e, t) {
		let n = this.host.worksheet();
		if (!n) return null;
		let r = this.host.scale(), i = this.host.canvasArea.getBoundingClientRect(), a = this.host.screenX(e - i.left, 0), o = t - i.top, s = Math.round(50 * r), c = Math.round(22 * r), l = V(n), u = l.maximumDigitWidth, d = l.axesAtScale(r);
		if (o <= c && a > s) {
			let n = this.getHeaderHit(e, t);
			if (n?.kind !== "col") return null;
			let r = /* @__PURE__ */ new Map(), i = [], o = d.col.indexAt(d.col.offsetOf(n.col) - 1).index;
			for (let e of [o, n.col]) {
				if (e < 1) continue;
				let t = this.host.cellRect(1, e);
				t && (r.set(e, t.x), i.push({
					index: e,
					edge: t.x + t.w
				}));
			}
			let c = xi(a, i, vi, s);
			return c === null ? null : {
				kind: "col",
				index: c,
				originScaled: r.get(c),
				mdw: u
			};
		}
		if (a <= s && o > c) {
			let n = this.getHeaderHit(e, t);
			if (n?.kind !== "row") return null;
			let r = /* @__PURE__ */ new Map(), i = [], a = d.row.indexAt(d.row.offsetOf(n.row) - 1).index;
			for (let e of [a, n.row]) {
				if (e < 1) continue;
				let t = this.host.cellRect(e, 1);
				t && (r.set(e, t.y), i.push({
					index: e,
					edge: t.y + t.h
				}));
			}
			let s = xi(o, i, vi, c);
			return s === null ? null : {
				kind: "row",
				index: s,
				originScaled: r.get(s),
				mdw: u
			};
		}
		return null;
	}
	resizeIndices(e, t) {
		let n = this.host.worksheet(), r = (this.host.selectionState()?.areas ?? []).flatMap((t) => e === "col" && t.kind === "columns" ? [[t.firstColumn, t.lastColumn]] : e === "row" && t.kind === "rows" ? [[t.firstRow, t.lastRow]] : []);
		if (!n || !r.some(([e, n]) => t >= e && t <= n)) return [t];
		r.sort((e, t) => e[0] - t[0]);
		let i = [];
		for (let e of r) {
			let t = i.at(-1);
			t && e[0] <= t[1] + 1 ? t[1] = Math.max(t[1], e[1]) : i.push([...e]);
		}
		if (i.reduce((e, [t, n]) => e + n - t + 1, 0) > bi) throw RangeError(`A resize gesture may affect at most ${bi} selected bands.`);
		let a = V(n), o = e === "col" ? a.col : a.row, s = [];
		for (let [e, t] of i) for (let n = e; n <= t; n++) o.sizeOf(n) > 0 && s.push(n);
		return s;
	}
	compactRowTargets(e, t = !1) {
		let n = this.host.worksheet();
		if (!n) return;
		let r = (this.host.selectionState()?.areas ?? []).flatMap((e) => e.kind === "rows" ? [{
			first: e.firstRow,
			last: e.lastRow
		}] : []);
		r.some((t) => t.first <= e && t.last >= e) || (r = [{
			first: e,
			last: e
		}]), r.sort((e, t) => e.first - t.first);
		let i = [];
		for (let e of r) {
			let t = i.at(-1);
			t && e.first <= t.last + 1 ? t.last = Math.max(t.last, e.last) : i.push({ ...e });
		}
		if (!t && !Vt(n).length && i.reduce((e, t) => e + t.last - t.first + 1, 0) <= bi) return;
		let a = [], o = 0;
		for (let e of V(n).row.positiveRanges()) {
			for (; o < i.length && i[o].last < e.first;) o++;
			for (let t = o; t < i.length && i[t].first <= e.last; t++) {
				let n = Math.max(e.first, i[t].first), r = Math.min(e.last, i[t].last);
				if (n <= r) {
					if (a.length === 16384) throw RangeError("Too many row resize intervals.");
					a.push(Object.freeze({
						first: n,
						last: r
					}));
				}
			}
		}
		return Object.freeze(a);
	}
	finishResize(e, t = !0, n = !1) {
		let r = this.resizeDrag;
		if (!(!r || r.pointerId !== e)) {
			if (this.resizeDrag = null, n && r.rowPreview) try {
				r.rowPreview.rollback(), !this.host.isDestroyed() && r.worksheet === this.host.worksheet() && (this.host.updateSpacerSize(r.worksheet), this.host.updateSelectionOverlay(), this.host.scheduleRender());
			} catch (e) {
				this.host.reportError(e);
			}
			try {
				this.host.scrollHost.hasPointerCapture?.(e) !== !1 && this.host.scrollHost.releasePointerCapture(e);
			} catch (e) {
				this.host.reportError(e);
			}
			try {
				t && r.kind === "col" && r.worksheet === this.host.worksheet() && this.host.refitAutoRowsAfterColumnResize();
			} catch (e) {
				this.host.reportError(e);
			}
		}
	}
	applyResize(e, t) {
		let n = this.resizeDrag, r = this.host.worksheet();
		if (!n) return;
		if (!r || n.worksheet !== r) {
			this.finishResize(n.pointerId, !1, !0);
			return;
		}
		let i = this.host.scale(), a = this.host.canvasArea.getBoundingClientRect();
		if (n.kind === "col") {
			let t = this.host.screenX(e - a.left, 0), o = Math.max(yi, Math.round((t - n.originScaled) / i)), s = Ut(o, n.mdw);
			for (let e of n.indices) r.colWidths[e] = s, this.host.recordSizeOverride("col", e, o);
		} else if (n.rowPreview) {
			let e = t - a.top, o = Math.max(yi, Math.round((e - n.originScaled) / i));
			try {
				n.rowPreview.apply(Gt(o)), this.host.updateSpacerSize(r), this.host.updateSelectionOverlay(), this.host.scheduleRender();
			} catch (e) {
				this.finishResize(n.pointerId, !1, !0), this.host.reportError(e);
			}
			return;
		} else {
			let e = t - a.top, o = Gt(Math.max(yi, Math.round((e - n.originScaled) / i)));
			for (let e of n.indices) r.rowHeights[e] = o, this.host.recordSizeOverride("row", e);
		}
		q.invalidate(r), this.host.updateSpacerSize(r), this.host.updateSelectionOverlay(), this.host.scheduleRender();
	}
	applyPointerSelection(e, t, n, r, i, a) {
		let o = this.getHeaderHit(e, t);
		if (o) {
			if (o.kind === "corner") this.host.selection.select({
				row: 1,
				col: 1
			}, "all"), this.host.selection.endDrag();
			else if (o.kind === "row") if (n && this.anchorCell && this.selectionMode === "rows") this.host.selection.extend({
				row: o.row,
				col: 1
			});
			else {
				let e = r ? this.host.selection.add({
					row: o.row,
					col: 1
				}, "rows") : (this.host.selection.select({
					row: o.row,
					col: 1
				}, "rows"), !0);
				a && e && (this.beginSelectionDrag(i), this.host.scrollHost.setPointerCapture(i));
			}
			else if (n && this.anchorCell && this.selectionMode === "cols") this.host.selection.extend({
				row: 1,
				col: o.col
			});
			else {
				let e = r ? this.host.selection.add({
					row: 1,
					col: o.col
				}, "cols") : (this.host.selection.select({
					row: 1,
					col: o.col
				}, "cols"), !0);
				a && e && (this.beginSelectionDrag(i), this.host.scrollHost.setPointerCapture(i));
			}
			this.host.updateSelectionOverlay(), this.host.renderCurrentSheet().catch((e) => this.host.reportError(e)), this.host.emitSelectionChange();
			return;
		}
		let s = this.host.cellAt(e, t);
		if (!s) return;
		let c = !0;
		n && this.anchorCell && this.selectionMode === "cells" ? this.host.selection.extend(s) : c = r ? this.host.selection.add(s, "cells") : (this.host.selection.select(s, "cells"), !0), a && c && (this.beginSelectionDrag(i), this.host.scrollHost.setPointerCapture(i)), this.host.updateSelectionOverlay(), this.host.hasWorkbook() && this.host.renderCurrentSheet().catch((e) => this.host.reportError(e)), this.host.emitSelectionChange();
	}
	viewportInputBounds() {
		let e = this.host.canvasArea.getBoundingClientRect(), t = e.left + this.host.scrollHost.clientLeft, n = e.top + this.host.scrollHost.clientTop, r = Math.max(0, e.width - this.host.scrollHost.clientLeft), i = Math.max(0, e.height - this.host.scrollHost.clientTop);
		return {
			left: t,
			top: n,
			width: Math.min(r, this.host.scrollHost.clientWidth || r),
			height: Math.min(i, this.host.scrollHost.clientHeight || i)
		};
	}
	extendDragSelection(e, t, n) {
		let r = e, i = t, a = n || this.selectionAutoScrollFrame !== null ? "logical" : "displayed", o = this.viewportInputBounds(), s = e < o.left || e >= o.left + o.width || t < o.top || t >= o.top + o.height;
		if (n || s) {
			let e = this.host.scale(), t = Math.round(50 * e), n = Math.round(22 * e), a = o.left + (this.host.isRtl() ? 0 : t), s = o.left + o.width - (this.host.isRtl() ? t : 0);
			r = Math.min(s - 1, Math.max(a + 1, r)), i = Math.min(o.top + o.height - 1, Math.max(o.top + n + 1, i));
		}
		if (this.selectionMode === "rows") {
			let e = n ? null : this.getHeaderHit(r, i, a), t = e?.kind === "row" ? e.row : this.host.cellAt(r, i, a)?.row;
			return !t || t === this.activeCell?.row ? !1 : (this.host.selection.extend({
				row: t,
				col: 1
			}), !0);
		}
		if (this.selectionMode === "cols") {
			let e = n ? null : this.getHeaderHit(r, i, a), t = e?.kind === "col" ? e.col : this.host.cellAt(r, i, a)?.col;
			return !t || t === this.activeCell?.col ? !1 : (this.host.selection.extend({
				row: 1,
				col: t
			}), !0);
		}
		let c = this.host.cellAt(r, i, a);
		return !c || c.row === this.activeCell?.row && c.col === this.activeCell?.col ? !1 : (this.host.selection.extend(c), !0);
	}
	selectionAutoScrollSpeed() {
		let e = this.selectionAutoScrollPointer;
		if (!e) return {
			x: 0,
			y: 0
		};
		let t = this.viewportInputBounds();
		return _i({
			x: e.clientX - t.left,
			y: e.clientY - t.top
		}, {
			width: t.width,
			height: t.height
		}, this.host.isRtl(), this.selectionMode);
	}
	trackSelectionAutoScroll(e) {
		if (e.pointerId !== this.selectionPointerId) return;
		this.selectionAutoScrollPointer = {
			clientX: e.clientX,
			clientY: e.clientY,
			pointerId: e.pointerId
		};
		let t = this.selectionAutoScrollSpeed();
		if (t.x === 0 && t.y === 0) {
			this.stopSelectionAutoScroll();
			return;
		}
		this.selectionAutoScrollFrame === null && (this.selectionAutoScrollLastTime = null, this.selectionAutoScrollFrame = this.host.hostWindow.requestAnimationFrame((e) => this.runSelectionAutoScroll(e)));
	}
	runSelectionAutoScroll(e) {
		this.selectionAutoScrollFrame = null;
		let t = this.selectionAutoScrollPointer;
		if (!t || t.pointerId !== this.selectionPointerId || !this.isSelecting || this.host.isDestroyed()) {
			this.stopSelectionAutoScroll();
			return;
		}
		let n = this.selectionAutoScrollSpeed();
		if (n.x === 0 && n.y === 0) {
			this.stopSelectionAutoScroll();
			return;
		}
		let r = this.selectionAutoScrollLastTime, i = r === null ? 1 / 60 : Math.min(.05, Math.max(0, e - r) / 1e3);
		this.selectionAutoScrollLastTime = e;
		let a = this.host.scrollLeft(), o = this.host.scrollTop();
		this.host.setScrollLeft(a + n.x * i), this.host.setScrollTop(o + n.y * i);
		let s = this.host.scrollLeft() !== a || this.host.scrollTop() !== o, c = s && this.extendDragSelection(t.clientX, t.clientY, !0);
		if (s && (this.host.updateSelectionOverlay(), this.host.updateFindOverlay(), this.host.scheduleRender(!0), this.host.emitViewportChange(), c && this.host.emitSelectionChange()), !s) {
			this.stopSelectionAutoScroll();
			return;
		}
		this.selectionAutoScrollFrame = this.host.hostWindow.requestAnimationFrame((e) => this.runSelectionAutoScroll(e));
	}
	stopSelectionAutoScroll() {
		this.selectionAutoScrollFrame !== null && (this.host.hostWindow.cancelAnimationFrame(this.selectionAutoScrollFrame), this.selectionAutoScrollFrame = null), this.selectionAutoScrollPointer = null, this.selectionAutoScrollLastTime = null;
	}
	contextMenuTargetIsSelected(e, t) {
		let n = this.host.selectionState();
		if (!n) return !1;
		let r = this.getHeaderHit(e, t);
		if (r?.kind === "corner") return n.areas.some((e) => e.kind === "sheet");
		if (r?.kind === "row") return n.areas.some((e) => e.kind === "sheet" || e.kind === "rows" && r.row >= e.firstRow && r.row <= e.lastRow);
		if (r?.kind === "col") return n.areas.some((e) => e.kind === "sheet" || e.kind === "columns" && r.col >= e.firstColumn && r.col <= e.lastColumn);
		let i = this.host.cellAt(e, t);
		return i !== null && n.areas.some((e) => vr(e, i));
	}
	resolveContextMenuContext(e) {
		if (this.host.isDestroyed()) return Promise.resolve(null);
		let t = this.host.elementContextAt(e.clientX, e.clientY);
		t ? this.host.setElementContext(t) : (this.host.setElementContext(null), this.contextMenuTargetIsSelected(e.clientX, e.clientY) || this.applyPointerSelection(e.clientX, e.clientY, !1, !1, -1, !1));
		let n = this.host.getSelectionContext();
		return Promise.resolve(n ? structuredClone(n) : null);
	}
	install() {
		this.host.options().onContextMenu && this.on("contextmenu", (e) => {
			let t;
			this.host.options().onContextMenu?.({
				originalEvent: e,
				getContext: () => t ??= this.resolveContextMenuContext(e)
			});
		}), this.on("pointerdown", (e) => {
			if (this.host.scrollHost.focus?.({ preventScroll: !0 }), e.button !== 0 || this.resizeDrag || this.isSelecting && e.pointerId !== this.selectionPointerId) return;
			let t = this.host.options().resizable ?? !0 ? this.getResizeTarget(e.clientX, e.clientY) : null;
			if (t) {
				e.preventDefault();
				try {
					let n = this.host.worksheet(), r = t.kind === "row" ? this.compactRowTargets(t.index) : void 0, i = r ? [] : this.resizeIndices(t.kind, t.index);
					if (!r) try {
						this.host.assertResizeBudget(t.kind, i, bi);
					} catch (e) {
						if (t.kind !== "row" || !(e instanceof RangeError)) throw e;
						r = this.compactRowTargets(t.index, !0), i = [];
					}
					let a = r ? this.host.beginRowResizePreview(r) : void 0;
					this.host.scrollHost.setPointerCapture(e.pointerId), this.resizeDrag = {
						...t,
						indices: i,
						worksheet: n,
						rowPreview: a,
						pointerId: e.pointerId
					};
				} catch (e) {
					this.host.reportError(e);
					return;
				}
				this.host.hideCommentPopup();
				return;
			}
			if (this.host.validation.hitsArrow(e.clientX, e.clientY)) {
				e.preventDefault(), this.host.validation.toggle();
				return;
			}
			let n = this.host.scrollHost.getBoundingClientRect(), r = e.clientX - n.left - this.host.scrollHost.clientLeft, i = e.clientY - n.top - this.host.scrollHost.clientTop;
			if (r >= this.host.scrollHost.clientWidth || i >= this.host.scrollHost.clientHeight) return;
			let a = this.host.nativeScrollbars && (this.host.scrollHost.scrollWidth > this.host.scrollHost.clientWidth && this.host.scrollHost.clientHeight - i <= 16 || this.host.scrollHost.scrollHeight > this.host.scrollHost.clientHeight && this.host.scrollHost.clientWidth - r <= 16), o = this.host.elementContextAt(e.clientX, e.clientY);
			if (o) {
				this.pendingTap = null, this.pendingClick = null, this.pendingElementClick = {
					x: e.clientX,
					y: e.clientY,
					pointerId: e.pointerId,
					context: o
				};
				return;
			}
			if (this.host.setElementContext(null), e.pointerType !== "mouse" || a) {
				this.pendingTap = {
					x: e.clientX,
					y: e.clientY,
					shiftKey: e.shiftKey,
					additiveKey: e.ctrlKey || e.metaKey,
					pointerId: e.pointerId
				};
				return;
			}
			let s = this.host.cellAt(e.clientX, e.clientY);
			this.pendingClick = s ? {
				x: e.clientX,
				y: e.clientY,
				pointerId: e.pointerId,
				cell: s
			} : null, this.applyPointerSelection(e.clientX, e.clientY, e.shiftKey, e.ctrlKey || e.metaKey, e.pointerId, !0);
		}), this.on("pointermove", (e) => {
			if (this.resizeDrag && this.resizeDrag.pointerId === e.pointerId) {
				e.preventDefault(), this.applyResize(e.clientX, e.clientY);
				return;
			}
			if (e.pointerType === "mouse" && !this.isSelecting && (this.host.options().resizable ?? !0)) {
				let t = this.getResizeTarget(e.clientX, e.clientY);
				if (this.host.scrollHost.style.cursor = t ? t.kind === "col" ? "col-resize" : "row-resize" : "", t) {
					this.host.hideCommentPopup();
					return;
				}
			}
			if (this.pendingTap && this.pendingTap.pointerId === e.pointerId) {
				let t = e.clientX - this.pendingTap.x, n = e.clientY - this.pendingTap.y;
				t * t + n * n > 64 && (this.pendingTap = null);
			}
			if (this.pendingClick && this.pendingClick.pointerId === e.pointerId) {
				let t = e.clientX - this.pendingClick.x, n = e.clientY - this.pendingClick.y;
				t * t + n * n > 64 && (this.pendingClick = null);
			}
			if (this.pendingElementClick?.pointerId === e.pointerId) {
				let t = e.clientX - this.pendingElementClick.x, n = e.clientY - this.pendingElementClick.y;
				t * t + n * n > 64 && (this.pendingElementClick = null);
			}
			if (e.pointerType === "mouse" && !this.isSelecting) {
				let t = this.host.cellAt(e.clientX, e.clientY);
				t ? this.host.comments.scheduleForCell(t) : this.host.hideCommentPopup(), this.host.scrollHost.style.cursor = t && this.host.hyperlinks.at(t) ? "pointer" : "";
			}
			!this.isSelecting || e.pointerId !== this.selectionPointerId || (this.trackSelectionAutoScroll(e), this.extendDragSelection(e.clientX, e.clientY, !1) && (this.host.updateSelectionOverlay(), this.host.scheduleRender(this.selectionAutoScrollFrame !== null), this.host.emitSelectionChange()));
		}), this.on("pointerup", (e) => {
			if (this.resizeDrag && this.resizeDrag.pointerId === e.pointerId) {
				this.finishResize(e.pointerId);
				return;
			}
			if (this.pendingElementClick?.pointerId === e.pointerId) {
				let t = this.pendingElementClick;
				this.pendingElementClick = null;
				let n = e.clientX - t.x, r = e.clientY - t.y, i = n * n + r * r <= 64 ? this.host.elementContextAt(e.clientX, e.clientY) : null;
				i && i.sheetIndex === t.context.sheetIndex && i.elementType === t.context.elementType && i.elementIndex === t.context.elementIndex && i.shapeIndex === t.context.shapeIndex && this.host.setElementContext(i);
				return;
			}
			if (this.pendingTap && this.pendingTap.pointerId === e.pointerId) {
				let t = e.clientX - this.pendingTap.x, n = e.clientY - this.pendingTap.y;
				if (t * t + n * n <= 64) {
					if (this.applyPointerSelection(e.clientX, e.clientY, this.pendingTap.shiftKey, this.pendingTap.additiveKey, e.pointerId, !1), e.pointerType !== "mouse" && this.activeCell) {
						let e = this.host.comments.commentAt(this.activeCell);
						e ? (this.host.hideCommentPopup(), this.host.comments.show(this.activeCell, e).catch((e) => this.host.reportError(e))) : this.host.hideCommentPopup();
					}
					this.activeCell && this.host.hyperlinks.dispatch(this.activeCell);
				}
				this.pendingTap = null;
			}
			let t = e.pointerId === this.selectionPointerId;
			if (t && this.stopSelectionAutoScroll(), this.pendingClick && this.pendingClick.pointerId === e.pointerId) {
				let t = e.clientX - this.pendingClick.x, n = e.clientY - this.pendingClick.y, r = this.host.cellAt(e.clientX, e.clientY);
				t * t + n * n <= 64 && r && r.row === this.pendingClick.cell.row && r.col === this.pendingClick.cell.col && this.host.hyperlinks.dispatch(this.pendingClick.cell), this.pendingClick = null;
			}
			t && this.host.selection.endDrag(e.pointerId);
		}), this.on("pointercancel", (e) => {
			this.resizeDrag && this.resizeDrag.pointerId === e.pointerId && this.finishResize(e.pointerId, !0, !0), this.pendingTap && this.pendingTap.pointerId === e.pointerId && (this.pendingTap = null), this.pendingClick && this.pendingClick.pointerId === e.pointerId && (this.pendingClick = null), this.pendingElementClick?.pointerId === e.pointerId && (this.pendingElementClick = null), e.pointerId === this.selectionPointerId && (this.stopSelectionAutoScroll(), this.host.selection.endDrag(e.pointerId));
		}), this.on("lostpointercapture", (e) => {
			this.resizeDrag?.pointerId === e.pointerId && this.finishResize(e.pointerId, !0, !0);
		}), this.on("wheel", (e) => {
			if (!(e.ctrlKey || e.metaKey)) {
				if (!this.host.nativeScrollbars) {
					e.preventDefault();
					let t = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? Math.max(1, this.host.scrollHost.clientHeight) : 1, n = (e.shiftKey ? e.deltaY : e.deltaX) * t, r = (e.shiftKey ? 0 : e.deltaY) * t;
					this.host.setScrollLeft(this.host.scrollLeft() + n), this.host.setScrollTop(this.host.scrollTop() + r), this.host.scheduleRender(!0), this.host.updateSelectionOverlay(), this.host.updateFindOverlay(), this.host.emitViewportChange();
				}
				return;
			}
			if (e.preventDefault(), e.deltaY === 0) return;
			let { x: t, y: n } = this.host.surface.localPoint(e.clientX, e.clientY);
			this.host.zoomAt(Number.isFinite(t) && Number.isFinite(n) ? {
				x: t,
				y: n
			} : null, he(this.host.scale(), e.deltaY, e.deltaMode));
		}, { passive: !1 }), this.on("pointerleave", (e) => {
			let t = e.relatedTarget;
			t && this.host.comments.contains(t) || this.host.hideCommentPopup();
		}), this.on("focus", () => {
			this.host.worksheet() && !this.activeCell && this.host.setSelection("A1");
		}), this.on("keydown", (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "c") {
				if (e.defaultPrevented || e.isComposing) return;
				let t = e.target, n = t?.tagName;
				if (t?.isContentEditable || n === "INPUT" || n === "TEXTAREA" || n === "SELECT") return;
				e.preventDefault(), this.host.copySelection();
			} else if (!e.defaultPrevented && !e.isComposing && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
				let t = this.activeCell, n = e.key === "ArrowUp" ? -1 : +(e.key === "ArrowDown"), r = e.key === "ArrowLeft" ? this.host.isRtl() ? 1 : -1 : e.key === "ArrowRight" ? this.host.isRtl() ? -1 : 1 : 0, i = t ? {
					row: Math.max(1, Math.min(K, t.row + n)),
					col: Math.max(1, Math.min(G, t.col + r))
				} : {
					row: 1,
					col: 1
				};
				e.preventDefault(), this.host.hideCommentPopup();
				let a = at(i.row, i.col);
				this.host.setSelection(a), this.host.scrollCellIntoView(i.row, i.col), this.host.updateSelectionOverlay(), this.host.updateFindOverlay(), this.host.emitViewportChange();
			} else if (e.key === "Escape" && this.resizeDrag?.rowPreview) e.preventDefault(), this.finishResize(this.resizeDrag.pointerId, !1, !0);
			else if (e.key === "Escape" && this.host.validation.isOpen()) this.host.hideValidationPanel();
			else if (e.key === "Escape" && this.host.comments.isOpen()) this.host.hideCommentPopup();
			else if (e.key === "Enter" && this.activeCell && !e.defaultPrevented && !e.isComposing && !e.ctrlKey && !e.metaKey && !e.altKey) {
				let t = this.host.comments.commentAt(this.activeCell);
				t && (e.preventDefault(), this.host.hideCommentPopup(), this.host.comments.show(this.activeCell, t).catch((e) => this.host.reportError(e)));
			}
		});
	}
	destroy() {
		this.resizeDrag && this.finishResize(this.resizeDrag.pointerId, !1, !0), this.stopSelectionAutoScroll(), this.pendingTap = null, this.pendingClick = null, this.pendingElementClick = null, this.resizeDrag = null;
		for (let e of this.cleanups.splice(0)) e();
	}
}, Ci = "#1a73e8";
function wi(e) {
	return {
		border: `2px solid ${e}`,
		background: `color-mix(in srgb, ${e} 8%, transparent)`
	};
}
function Ti(e) {
	let t = [];
	for (let n of e) {
		let e = n.x + n.width, r = n.y + n.height;
		n.top && t.push({
			axis: "h",
			fixed: n.y,
			start: n.x,
			end: e
		}), n.right && t.push({
			axis: "v",
			fixed: e,
			start: n.y,
			end: r
		}), n.bottom && t.push({
			axis: "h",
			fixed: r,
			start: n.x,
			end: e
		}), n.left && t.push({
			axis: "v",
			fixed: n.x,
			start: n.y,
			end: r
		});
	}
	let n = /* @__PURE__ */ new Map();
	for (let e of t) {
		let t = `${e.axis}:${e.fixed}`, r = n.get(t);
		r ? r.push(e) : n.set(t, [e]);
	}
	let r = [];
	for (let e of n.values()) {
		let t = [...new Set(e.flatMap(({ start: e, end: t }) => [e, t]))].sort((e, t) => e - t), n = null, i = 0, a = () => {
			if (n === null || i <= n) return;
			let { axis: t, fixed: a } = e[0];
			r.push(t === "h" ? `M${n} ${a}H${i}` : `M${a} ${n}V${i}`), n = null;
		};
		for (let r = 0; r + 1 < t.length; r++) {
			let o = t[r], s = t[r + 1], c = e.some((e) => e.start < s && e.end > o);
			c && n !== null && o === i ? i = s : (a(), c && (n = o, i = s));
		}
		a();
	}
	return r.join("");
}
var Ei = 0, Di = class {
	host;
	constructor(e) {
		this.host = e;
	}
	update() {
		if (this.host.overlayHost.clearSelection(), this.host.elementContext()) {
			this.drawElementContextOverlay();
			return;
		}
		let e = this.host.selectionState();
		if (!e) return;
		let t = this.host.scale(), n = this.host.worksheet();
		if (!n) return;
		let r = (e) => Math.round(e * t), i = r(50), a = r(22), o = this.host.canvasArea.clientWidth, s = this.host.canvasArea.clientHeight, c = V(n), l = c.effectiveFrozenBands({
			scale: t,
			width: o,
			height: s,
			headerWidth: 50,
			headerHeight: 22,
			rows: n.freezeRows ?? 0,
			cols: n.freezeCols ?? 0
		}), u = c.axesAtScale(t), d = u.col.offsetOf(l.cols + 1), f = u.row.offsetOf(l.rows + 1), p = l.cols > 0 ? [{
			first: 1,
			last: l.cols,
			start: i,
			end: Math.min(o, i + d)
		}, {
			first: l.cols + 1,
			last: G,
			start: Math.min(o, i + d),
			end: o
		}] : [{
			first: 1,
			last: G,
			start: i,
			end: o
		}], m = l.rows > 0 ? [{
			first: 1,
			last: l.rows,
			start: a,
			end: Math.min(s, a + f)
		}, {
			first: l.rows + 1,
			last: K,
			start: Math.min(s, a + f),
			end: s
		}] : [{
			first: 1,
			last: K,
			start: a,
			end: s
		}], h = p.filter((e) => e.end > e.start), g = m.filter((e) => e.end > e.start), _ = this.host.selectionColor() ?? Ci, { background: v } = wi(_), y = /* @__PURE__ */ new Set(), b = [], x = [];
		for (let t of e.areas) {
			let e = t.kind === "cells" ? {
				top: t.top,
				bottom: t.bottom,
				left: t.left,
				right: t.right,
				topEdge: !0,
				bottomEdge: !0,
				leftEdge: !0,
				rightEdge: !0
			} : t.kind === "rows" ? {
				top: t.firstRow,
				bottom: t.lastRow,
				left: 1,
				right: G,
				topEdge: !0,
				bottomEdge: !0,
				leftEdge: !1,
				rightEdge: !1
			} : t.kind === "columns" ? {
				top: 1,
				bottom: K,
				left: t.firstColumn,
				right: t.lastColumn,
				topEdge: !1,
				bottomEdge: !1,
				leftEdge: !0,
				rightEdge: !0
			} : {
				top: 1,
				bottom: K,
				left: 1,
				right: G,
				topEdge: !1,
				bottomEdge: !1,
				leftEdge: !1,
				rightEdge: !1
			};
			for (let n of g) for (let r of h) {
				let i = Math.max(e.top, n.first), a = Math.min(e.bottom, n.last), c = Math.max(e.left, r.first), l = Math.min(e.right, r.last);
				if (i > a || c > l) continue;
				let u = this.host.cellRect(i, c), d = this.host.cellRect(a, l);
				if (!u || !d) continue;
				let f = u.x, p = u.y, m = d.x + d.w, _ = d.y + d.h, v = Math.max(f, r.start), S = Math.max(p, n.start), C = Math.min(m, r.end), w = Math.min(_, n.end), T = C - v, E = w - S;
				if (T <= 0 || E <= 0) continue;
				let D = t.kind === "columns" && n === g[0], O = t.kind === "columns" && n === g.at(-1), k = t.kind === "rows" && r === h[0], A = t.kind === "rows" && r === h.at(-1), j = D || e.topEdge && i === e.top && p >= n.start, M = O || e.bottomEdge && a === e.bottom && _ <= n.end, ee = k || e.leftEdge && c === e.left && f >= r.start, N = A || e.rightEdge && l === e.right && m <= r.end, P = this.host.screenX(v, T), te = this.host.isRtl() ? N : ee, F = this.host.isRtl() ? ee : N, ne = [
					P,
					S,
					T,
					E,
					j,
					F,
					M,
					te
				].join("|");
				if (y.has(ne)) continue;
				y.add(ne), b.push(`M${P} ${S}h${T}v${E}h${-T}Z`);
				let re = Math.min(1, T / 2), I = Math.min(1, E / 2), ie = this.host.isRtl() ? A : k, L = this.host.isRtl() ? k : A, R = (e, t) => e <= 0 || e >= t, ae = P + (ie && R(P, o) ? re : 0), oe = P + T - (L && R(P + T, o) ? re : 0), z = S + (D && R(S, s) ? I : 0), se = w - (O && R(w, s) ? I : 0);
				x.push({
					x: ae,
					y: z,
					width: oe - ae,
					height: se - z,
					top: j,
					right: F,
					bottom: M,
					left: te
				});
			}
		}
		if (b.length > 0) {
			let t = "http://www.w3.org/2000/svg", n = this.host.ownerDocument.createElementNS(t, "svg");
			n.setAttribute("data-xlsx-selection-fill", ""), n.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:hidden;pointer-events:none;";
			let r = e.areas.length > 1, i = this.host.cellRect(e.activeCell.row, e.activeCell.col), a = `xlsx-selection-mask-${++Ei}`, c = this.host.ownerDocument.createElementNS(t, "defs"), l = this.host.ownerDocument.createElementNS(t, "mask");
			l.setAttribute("id", a), l.setAttribute("maskUnits", "userSpaceOnUse"), l.setAttribute("x", "0"), l.setAttribute("y", "0"), l.setAttribute("width", String(o)), l.setAttribute("height", String(s));
			let u = this.host.ownerDocument.createElementNS(t, "path");
			if (u.setAttribute("d", b.join("")), u.setAttribute("fill", "#fff"), l.appendChild(u), i) for (let e of m) for (let n of p) {
				let r = Math.max(i.x, n.start), a = Math.max(i.y, e.start), o = Math.min(i.x + i.w, n.end), s = Math.min(i.y + i.h, e.end);
				if (o <= r || s <= a) continue;
				let c = this.host.ownerDocument.createElementNS(t, "rect");
				c.setAttribute("data-xlsx-active-cell-cutout", ""), c.setAttribute("x", String(this.host.screenX(r, o - r))), c.setAttribute("y", String(a)), c.setAttribute("width", String(o - r)), c.setAttribute("height", String(s - a)), c.setAttribute("fill", "#000"), l.appendChild(c);
			}
			c.appendChild(l), n.appendChild(c);
			let d = this.host.ownerDocument.createElementNS(t, "rect");
			d.setAttribute("x", "0"), d.setAttribute("y", "0"), d.setAttribute("width", String(o)), d.setAttribute("height", String(s)), d.setAttribute("fill", v), d.setAttribute("mask", `url(#${a})`), n.appendChild(d);
			let f = r ? "" : Ti(x);
			if (f) {
				let e = this.host.ownerDocument.createElementNS(t, "path");
				e.setAttribute("data-xlsx-selection-border", ""), e.setAttribute("d", f), e.setAttribute("fill", "none"), e.setAttribute("stroke", _), e.setAttribute("stroke-width", "2"), e.setAttribute("stroke-linecap", "square"), e.setAttribute("stroke-linejoin", "miter"), n.appendChild(e);
			}
			if (i && r) for (let e of m) for (let r of p) {
				let a = Math.max(i.x, r.start), o = Math.max(i.y, e.start), s = Math.min(i.x + i.w, r.end), c = Math.min(i.y + i.h, e.end);
				if (s <= a || c <= o) continue;
				let l = this.host.ownerDocument.createElementNS(t, "rect");
				l.setAttribute("data-xlsx-active-cell-border", ""), l.setAttribute("x", String(this.host.screenX(a, s - a))), l.setAttribute("y", String(o)), l.setAttribute("width", String(s - a)), l.setAttribute("height", String(c - o)), l.setAttribute("fill", "none"), l.setAttribute("stroke", _), l.setAttribute("stroke-width", "1"), n.appendChild(l);
			}
			this.host.overlayHost.appendSelection(n);
		}
		this.host.drawValidationDropdown();
	}
	drawElementContextOverlay() {
		let e = this.host.elementContext(), t = this.host.worksheet(), n = this.host.elementContextViewport();
		if (!e || !t || !n || e.sheetIndex !== this.host.currentSheet()) return;
		let r = rr(t, e, n);
		if (!r) return;
		let i = this.host.ownerDocument.createElement("div");
		i.setAttribute("data-xlsx-element-context-clip", ""), i.style.cssText = `position:absolute;left:${r.clip.x}px;top:${r.clip.y}px;width:${r.clip.width}px;height:${r.clip.height}px;overflow:hidden;pointer-events:none;`;
		let a = this.host.ownerDocument.createElement("div");
		a.setAttribute("data-xlsx-element-context-outline", e.elementType);
		let o = this.host.selectionColor() ?? Ci;
		a.style.cssText = `position:absolute;left:${r.rect.x - r.clip.x}px;top:${r.rect.y - r.clip.y}px;width:${r.rect.width}px;height:${r.rect.height}px;box-sizing:border-box;border:2px solid ${o};background:color-mix(in srgb, ${o} 6%, transparent);transform:rotate(${r.rotation}deg);transform-origin:center;pointer-events:none;`, i.appendChild(a), this.host.overlayHost.appendSelection(i);
	}
}, Oi = 65536, ki = 100, Ai = class {
	host;
	lastNotified = null;
	emitting = !1;
	pending = !1;
	scheduled = !1;
	chainLength = 0;
	contextFrame = null;
	contextMicrotask = !1;
	constructor(e) {
		this.host = e;
	}
	scheduleContextNotification() {
		if (!this.host.onSelectionContextChange() || this.host.isDestroyed() || this.contextFrame !== null || this.contextMicrotask) return;
		let e = () => {
			if (this.contextFrame = null, this.contextMicrotask = !1, this.host.isDestroyed()) return;
			let e = this.host.readContext(Oi);
			this.host.onSelectionContextChange()?.(e ? structuredClone(e) : null);
		};
		typeof this.host.hostWindow.requestAnimationFrame == "function" ? this.contextFrame = this.host.hostWindow.requestAnimationFrame(e) : (this.contextMicrotask = !0, queueMicrotask(e));
	}
	emit() {
		let e = this.host.selectionState();
		if (Sr(e, this.lastNotified) || this.host.scheduleSelectionContextNotification(), this.emitting) {
			this.pending = !0, this.scheduleNotification();
			return;
		}
		if (this.pending = !1, Sr(e, this.lastNotified)) {
			this.finishChain();
			return;
		}
		if (this.chainLength >= ki) {
			this.lastNotified = e ? structuredClone(e) : null, this.finishChain();
			return;
		}
		this.chainLength++, this.lastNotified = e ? structuredClone(e) : null, this.emitting = !0;
		try {
			this.host.onSelectionStateChange()?.(e ? structuredClone(e) : null);
		} finally {
			this.emitting = !1, this.pending || !Sr(this.host.selectionState(), this.lastNotified) ? this.scheduleNotification() : this.finishChain();
		}
	}
	scheduleNotification() {
		this.scheduled || this.host.isDestroyed() || (this.scheduled = !0, queueMicrotask(() => {
			this.scheduled = !1, this.host.isDestroyed() || this.host.emitSelectionChange();
		}));
	}
	finishChain() {
		this.pending = !1, this.chainLength = 0;
	}
	destroy() {
		this.contextFrame !== null && (this.host.hostWindow.cancelAnimationFrame(this.contextFrame), this.contextFrame = null), this.contextMicrotask = !1, this.lastNotified = null, this.finishChain();
	}
};
function $(e) {
	let t = [...e].sort((e, t) => e.first - t.first || e.last - t.last), n = [];
	for (let e of t) {
		let t = n.at(-1);
		!t || e.first > t.last + 1 ? n.push({ ...e }) : e.last > t.last && (n[n.length - 1] = {
			first: t.first,
			last: e.last
		});
	}
	return n;
}
function ji(e, t) {
	let n = 0, r = e.length - 1;
	for (; n <= r;) {
		let i = n + r >>> 1, a = e[i];
		if (t < a.first) r = i - 1;
		else if (t > a.last) n = i + 1;
		else return !0;
	}
	return !1;
}
function Mi(e, t, n) {
	let r = 0, i = e.length;
	for (; r < i;) {
		let a = r + i >>> 1;
		n(e[a]) < t ? r = a + 1 : i = a;
	}
	return r;
}
function Ni(e, t) {
	for (let n = 1; n < e.length; n++) if (t(e[n - 1]) > t(e[n])) return [...e].sort((e, n) => t(e) - t(n));
	return e;
}
var Pi = 1 * 1024 * 1024, Fi = 65536;
function Ii(e, t) {
	return ke(e, Math.max(0, t));
}
var Li = class {
	rows = /* @__PURE__ */ new WeakMap();
	cells = /* @__PURE__ */ new WeakMap();
	read(e, t, n, r, i, a) {
		let o = a.maxCells ?? 1e3;
		if (!Number.isFinite(o) || o < 0) throw RangeError("maxCells must be a finite non-negative number.");
		let s = Math.min(mr, Math.floor(o)), c = a.maxTextCharacters ?? Pi;
		if (!Number.isFinite(c) || c < 0) throw RangeError("maxTextCharacters must be a finite non-negative number.");
		let l = Math.min(hr, Math.floor(c)), u = 0, d = !1, f = (e) => {
			let t = typeof e == "string" ? [e] : e, n = [], r = 0;
			for (let e = 0; e < t.length; e++) {
				let i = t[e], a = typeof i == "string" ? i : i.text, o = Math.max(0, Math.min(Fi - r, l - u)), s = Ii(a, o);
				if (n.push(s), r += s.length, u += s.length, s.length < a.length || e + 1 < t.length && o === 0) {
					d = !0;
					break;
				}
			}
			return n.join("");
		}, p = n.areas.some((e) => e.kind === "sheet"), m = $(n.areas.flatMap((e) => e.kind === "rows" ? [{
			first: e.firstRow,
			last: e.lastRow
		}] : [])), h = $(n.areas.flatMap((e) => e.kind === "columns" ? [{
			first: e.firstColumn,
			last: e.lastColumn
		}] : [])), g = n.areas.flatMap((e) => e.kind === "cells" ? [e] : []), _ = g.flatMap((e, t) => [{
			row: e.top,
			index: t,
			active: !0
		}, {
			row: e.bottom + 1,
			index: t,
			active: !1
		}]).sort((e, t) => e.row - t.row || Number(e.active) - Number(t.active)), v = /* @__PURE__ */ new Set(), y = 0, b = [], x = [], S = !1, C = p || h.length > 0 ? [{
			first: 1,
			last: K
		}] : $([...m, ...g.map((e) => ({
			first: e.top,
			last: e.bottom
		}))]), w = this.rows.get(e);
		w || (w = Ni(e.rows, (e) => e.index), this.rows.set(e, w));
		cellScan: for (let t of C) {
			let n = Mi(w, t.first, (e) => e.index);
			for (; n < w.length;) {
				let a = w[n++];
				if (a.index > t.last) break;
				let o = !1;
				for (; y < _.length && _[y].row <= a.index;) {
					let e = _[y++];
					e.active ? v.add(e.index) : v.delete(e.index), o = !0;
				}
				o && (b = $([...v].map((e) => ({
					first: g[e].left,
					last: g[e].right
				}))));
				let c = p || ji(m, a.index) ? [{
					first: 1,
					last: G
				}] : $([...h, ...b]);
				for (let t of c) {
					let n = this.cells.get(a);
					n || (n = Ni(a.cells, (e) => e.col), this.cells.set(a, n));
					let o = Mi(n, t.first, (e) => e.col);
					for (; o < n.length;) {
						let a = n[o++];
						if (a.col > t.last) break;
						let c = a.value, l = r.get(`${a.row}:${a.col}`);
						if (c.type === "empty" && a.formula === void 0 && !l) continue;
						if (x.length >= s) {
							S = !0;
							break cellScan;
						}
						let u = f(i?.cellText(e, a) ?? ""), p = c.type === "text" ? f(c.runs ?? c.text) : c.type === "number" ? c.number : c.type === "bool" ? c.bool : c.type === "error" ? f(c.error) : null, m = l ? {
							root: {
								id: l.id,
								author: l.author,
								date: l.date,
								text: f(l.rootText ?? l.text),
								status: l.resolved ? "resolved" : "active"
							},
							replies: (l.replies ?? []).map((e) => ({
								id: e.id,
								author: e.author,
								date: e.date,
								text: f(e.text),
								status: e.resolved ? "resolved" : "active"
							}))
						} : void 0;
						if (x.push({
							address: {
								row: a.row,
								col: a.col
							},
							displayText: u,
							valueType: c.type,
							value: p,
							...a.formula === void 0 ? {} : { formula: f(a.formula) },
							...m === void 0 ? {} : { comment: m }
						}), d) break cellScan;
					}
				}
			}
		}
		let T = [];
		return S && T.push("cells"), d && T.push("text"), {
			format: "xlsx",
			kind: "range",
			sheetIndex: t,
			sheetName: e.name,
			selection: n,
			coordinateCountUpperBound: gr(n),
			cells: x,
			truncated: T.length > 0,
			truncationReasons: T,
			maxCells: s,
			textCharacters: u,
			maxTextCharacters: l
		};
	}
}, Ri = {
	background: "--ooxml-xlsx-chrome-background",
	surface: "--ooxml-xlsx-chrome-surface",
	mutedSurface: "--ooxml-xlsx-chrome-surface-muted",
	text: "--ooxml-xlsx-chrome-text",
	mutedText: "--ooxml-xlsx-chrome-text-muted",
	border: "--ooxml-xlsx-chrome-border",
	selectedSurface: "--ooxml-xlsx-chrome-selection-background",
	accent: "--ooxml-xlsx-chrome-accent"
};
function zi(e, t) {
	return Object.keys(Ri).every((n) => e[n] === t[n]);
}
var Bi = class {
	host;
	colors = {};
	styleObserver = null;
	schemeMedia = null;
	schemeListener = null;
	constructor(e) {
		this.host = e;
	}
	refresh() {
		if (this.host.isDestroyed()) return;
		let e = this.host.hostWindow, t = e.getComputedStyle?.bind(e);
		if (!t) return;
		let n = t(this.host.wrapper), r = {};
		for (let [e, t] of Object.entries(Ri)) {
			let i = n.getPropertyValue(t).trim();
			i && (r[e] = i);
		}
		let i = r;
		zi(this.colors, i) || (this.colors = i, this.host.onChange());
	}
	install() {
		this.refresh();
		let e = this.host.hostWindow, t = e.MutationObserver ?? globalThis.MutationObserver;
		if (t) {
			this.styleObserver = new t(() => this.refresh());
			for (let e = this.host.container; e; e = e.parentElement) this.styleObserver.observe(e, {
				attributes: !0,
				attributeFilter: [
					"class",
					"style",
					"data-theme"
				]
			});
		}
		let n = e.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
		if (n) {
			let e = () => this.refresh();
			n.addEventListener?.("change", e), this.schemeMedia = n, this.schemeListener = e;
		}
	}
	destroy() {
		this.styleObserver?.disconnect(), this.styleObserver = null, this.schemeMedia && this.schemeListener && this.schemeMedia.removeEventListener?.("change", this.schemeListener), this.schemeMedia = null, this.schemeListener = null;
	}
}, Vi = 8;
function Hi(e) {
	let { cell: t, popup: n, viewport: r, rtl: i } = e, a = Vi, o = t.x + t.w + a, s = t.x - a - n.w, c = o + n.w <= r.w, l = s >= 0, u;
	u = i ? l ? s : c ? o : s : c ? o : l ? s : o, u = Math.max(0, Math.min(u, r.w - n.w));
	let d = t.y;
	return d = Math.max(0, Math.min(d, r.h - n.h)), {
		left: u,
		top: d
	};
}
var Ui;
function Wi() {
	return Ui ??= import("./comment-ui-runtime-BtP_TpvT.js");
}
var Gi = 150;
function Ki(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = B(n.cellRef);
		e && t.set(`${e.row}:${e.col}`, n);
	}
	return t;
}
var qi = class {
	host;
	popup;
	commentMap = /* @__PURE__ */ new Map();
	popupKey = null;
	timer = null;
	cell = null;
	positionScheduled = !1;
	resizeObserver = null;
	ui = null;
	renderGeneration = 0;
	constructor(e) {
		this.host = e, this.popup = e.overlayHost.comment;
		let t = e.ownerDocument.defaultView?.ResizeObserver ?? globalThis.ResizeObserver;
		t && (this.resizeObserver = new t(() => {
			this.schedulePosition();
		}), this.resizeObserver.observe(this.popup));
	}
	setComments(e) {
		this.commentMap = Ki(e);
	}
	commentAt(e) {
		return this.commentMap.get(`${e.row}:${e.col}`);
	}
	isOpen() {
		return this.popup.style.display !== "none";
	}
	contains(e) {
		return this.popup.contains(e);
	}
	scheduleForCell(e) {
		let t = `${e.row}:${e.col}`, n = this.commentMap.get(t);
		if (!n) {
			this.hide();
			return;
		}
		this.popupKey !== t && (this.hide(), this.popupKey = t, this.timer = setTimeout(() => {
			this.timer = null, this.show(e, n).catch((e) => this.host.reportError(e));
		}, Gi));
	}
	async loadUi() {
		let e = this.ui ?? await Wi();
		return this.host.isDestroyed() || (this.ui = e), e;
	}
	async show(e, t) {
		if (!this.host.cellRect(e.row, e.col)) return;
		let n = ++this.renderGeneration, r = await this.loadUi();
		if (this.host.isDestroyed() || n !== this.renderGeneration || !this.host.cellRect(e.row, e.col)) return;
		this.cell = e;
		let i = `sheet:${this.host.currentSheet()}:cell:${t.cellRef}:comment:${t.id ?? "root"}`, a = {
			occurrenceKey: i,
			root: {
				messageKey: `${i}:root`,
				sourceId: t.id,
				author: t.author,
				date: t.date,
				text: t.rootText ?? t.text,
				status: t.resolved ? "resolved" : "active"
			},
			replies: (t.replies ?? []).map((e, t) => ({
				messageKey: `${i}:reply:${e.id ?? t}`,
				sourceId: e.id,
				author: e.author,
				date: e.date,
				text: e.text,
				status: e.resolved ? "resolved" : "active"
			}))
		};
		r.paintReadOnlyCommentCard(this.popup, a, {
			interactive: !1,
			standalone: !0
		});
		let o = (t.rootText ?? t.text).trim(), s = t.author?.trim() ? ` by ${t.author.trim()}` : "", c = t.replies?.length ?? 0, l = c === 0 ? "" : `; ${c} ${c === 1 ? "reply" : "replies"}`;
		this.host.overlayHost.announceComment(`Comment on ${t.cellRef}${s}${o ? `: ${o}` : ""}${l}`), this.popup.dataset.ooxmlCommentUi = "popup", this.popup.style.maxWidth = "280px", this.popup.style.maxHeight = "200px", this.popup.style.left = "-9999px", this.popup.style.top = "-9999px", this.popup.style.display = "", this.position();
	}
	schedulePosition() {
		if (this.positionScheduled || !this.cell) return;
		this.positionScheduled = !0;
		let e = () => {
			this.positionScheduled = !1, this.position();
		}, t = this.host.ownerDocument.defaultView;
		t?.requestAnimationFrame ? t.requestAnimationFrame(e) : queueMicrotask(e);
	}
	position() {
		let e = this.cell;
		if (!e || this.popup.style.display === "none") return;
		let t = this.host.cellRect(e.row, e.col);
		if (!t) return;
		let n = Hi({
			cell: {
				x: this.host.screenX(t.x, t.w),
				y: t.y,
				w: t.w,
				h: t.h
			},
			popup: {
				w: this.popup.offsetWidth,
				h: this.popup.offsetHeight
			},
			viewport: {
				w: this.host.canvasArea.clientWidth,
				h: this.host.canvasArea.clientHeight
			},
			rtl: this.host.isRtl()
		});
		this.host.overlayHost.showComment(n.left, n.top);
	}
	hide() {
		this.renderGeneration++, this.timer !== null && (clearTimeout(this.timer), this.timer = null), this.popupKey = null, this.cell = null, this.host.overlayHost.hideComment(), this.popup.replaceChildren();
	}
	destroy() {
		this.resizeObserver?.disconnect(), this.resizeObserver = null, this.hide(), this.commentMap.clear();
	}
}, Ji = class {
	owner = new Oe("SheetAcquisition");
	get current() {
		return this.owner.current;
	}
	async replace(e, t) {
		return await this.owner.replace(e, t);
	}
	install(e, t = !0) {
		this.owner.install(e, t);
	}
	destroy() {
		this.owner.close();
	}
};
function Yi(e) {
	let t = {
		...e,
		rows: e.rows.map((e) => ({ ...e })),
		rowHeights: { ...e.rowHeights },
		colWidths: { ...e.colWidths }
	};
	return e.colCollapsed && (t.colCollapsed = { ...e.colCollapsed }), Xe(e, t), Ln(e, t), U(e, t), Wt(e, t), t;
}
var Xi = class {
	scaleValue;
	offsetX = 0;
	offsetY = 0;
	contentWidth = 0;
	contentHeight = 0;
	viewportWidth = 0;
	viewportHeight = 0;
	constructor(e) {
		this.scaleValue = e;
	}
	get x() {
		return this.offsetX;
	}
	get y() {
		return this.offsetY;
	}
	get scale() {
		return this.scaleValue;
	}
	get maxX() {
		return Math.max(0, this.contentWidth - this.viewportWidth);
	}
	get maxY() {
		return Math.max(0, this.contentHeight - this.viewportHeight);
	}
	setScale(e) {
		this.scaleValue = e;
	}
	setExtent(e, t) {
		this.contentWidth = Math.max(0, e), this.contentHeight = Math.max(0, t), this.setOffset(this.offsetX, this.offsetY);
	}
	ensureExtent(e, t) {
		this.contentWidth = Math.max(this.contentWidth, Math.max(0, e)), this.contentHeight = Math.max(this.contentHeight, Math.max(0, t));
	}
	setViewportSize(e, t) {
		this.viewportWidth = Math.max(0, e), this.viewportHeight = Math.max(0, t), this.setOffset(this.offsetX, this.offsetY);
	}
	setOffset(e, t) {
		this.offsetX = Math.min(this.maxX, Math.max(0, e)), this.offsetY = Math.min(this.maxY, Math.max(0, t));
	}
	adoptNativeOffset(e, t) {
		this.offsetX = Math.max(0, e), this.offsetY = Math.max(0, t);
	}
	reset() {
		this.offsetX = 0, this.offsetY = 0;
	}
}, Zi = class {
	animationFrame = null;
	activeRender = !1;
	pendingRender = null;
	staticDispatcher;
	frameScheduler;
	generation = 0;
	destroyed = !1;
	constructor(e, t = !1, n) {
		let r = n ?? globalThis;
		this.frameScheduler = typeof r.requestAnimationFrame == "function" && typeof r.cancelAnimationFrame == "function" ? {
			requestAnimationFrame: (e) => r.requestAnimationFrame(e),
			cancelAnimationFrame: (e) => r.cancelAnimationFrame(e)
		} : null, this.staticDispatcher = e ? new xe(e, t) : null;
	}
	begin() {
		return this.staticDispatcher ? this.staticDispatcher.begin() : ++this.generation;
	}
	isCurrent(e) {
		return this.staticDispatcher ? this.staticDispatcher.isCurrent(e) : !this.destroyed && e === this.generation;
	}
	commitBitmap(e, t, n, r) {
		if (!this.isCurrent(e)) return t.close(), !1;
		if (!this.staticDispatcher) throw t.close(), Error("SheetRenderDispatcher is not configured for worker bitmap rendering");
		return this.staticDispatcher.commitBitmap(e, t, {
			cssWidth: n,
			cssHeight: r
		});
	}
	schedule(e, t = !1) {
		if (!this.destroyed) {
			if (this.pendingRender = e, this.activeRender) {
				t || this.begin();
				return;
			}
			this.animationFrame === null && this.queuePendingRender();
		}
	}
	queuePendingRender() {
		if (!this.frameScheduler) {
			this.startPendingRender();
			return;
		}
		this.animationFrame = this.frameScheduler.requestAnimationFrame(() => {
			this.animationFrame = null, this.startPendingRender();
		});
	}
	startPendingRender() {
		if (this.destroyed || this.activeRender) return;
		let e = this.pendingRender;
		if (this.pendingRender = null, !e) return;
		this.activeRender = !0;
		let t;
		try {
			t = e();
		} catch {
			t = void 0;
		}
		Promise.resolve(t).catch(() => void 0).finally(() => {
			this.activeRender = !1, !this.destroyed && this.pendingRender && this.queuePendingRender();
		});
	}
	destroy() {
		this.destroyed || (this.destroyed = !0, this.pendingRender = null, this.animationFrame !== null && this.frameScheduler && (this.frameScheduler.cancelAnimationFrame(this.animationFrame), this.animationFrame = null), this.staticDispatcher?.destroy(), this.generation++);
	}
}, Qi = class {
	state = null;
	dragPointerId = null;
	get anchor() {
		return this.state ? { ...this.state.extensionAnchor } : null;
	}
	get active() {
		return this.state ? { ...this.state.activeCell } : null;
	}
	get mode() {
		let e = this.activeArea;
		return e ? e.kind === "columns" ? "cols" : e.kind === "sheet" ? "all" : e.kind : "cells";
	}
	get dragging() {
		return this.dragPointerId !== null;
	}
	get draggingPointerId() {
		return this.dragPointerId;
	}
	get activeArea() {
		return this.state?.areas[this.state.activeAreaIndex] ?? null;
	}
	beginDrag(e) {
		this.dragPointerId = e;
	}
	endDrag(e) {
		(e === void 0 || e === this.dragPointerId) && (this.dragPointerId = null);
	}
	reset() {
		this.state = null, this.dragPointerId = null;
	}
	setState(e) {
		this.state = e ? X(e) : null;
	}
	select(e, t = "cells") {
		let n = t === "rows" ? {
			kind: "rows",
			firstRow: e.row,
			lastRow: e.row
		} : t === "cols" ? {
			kind: "columns",
			firstColumn: e.col,
			lastColumn: e.col
		} : t === "all" ? { kind: "sheet" } : {
			kind: "cells",
			top: e.row,
			left: e.col,
			bottom: e.row,
			right: e.col
		};
		this.state = X({
			areas: [n],
			activeAreaIndex: 0,
			activeCell: e,
			extensionAnchor: e
		});
	}
	add(e, t = "cells") {
		if (!this.state) return this.select(e, t), !0;
		let n = this.state.areas.findIndex((n) => (t === "rows" ? n.kind === "rows" : t === "cols" ? n.kind === "columns" : t === "all" ? n.kind === "sheet" : n.kind === "cells") && vr(n, e));
		if (n >= 0) return this.state = X({
			...this.state,
			activeAreaIndex: n,
			activeCell: e,
			extensionAnchor: e
		}), !1;
		if (this.state.areas.length >= 128) return !1;
		let r = t === "rows" ? {
			kind: "rows",
			firstRow: e.row,
			lastRow: e.row
		} : t === "cols" ? {
			kind: "columns",
			firstColumn: e.col,
			lastColumn: e.col
		} : t === "all" ? { kind: "sheet" } : {
			kind: "cells",
			top: e.row,
			left: e.col,
			bottom: e.row,
			right: e.col
		}, i = [...this.state.areas, r];
		return this.state = X({
			areas: i,
			activeAreaIndex: i.length - 1,
			activeCell: e,
			extensionAnchor: e
		}), !0;
	}
	extend(e) {
		if (!this.state) {
			this.select(e);
			return;
		}
		let t = this.state.extensionAnchor, n = this.activeArea;
		if (!n) return;
		let r = n.kind === "rows" ? {
			kind: "rows",
			firstRow: Math.min(t.row, e.row),
			lastRow: Math.max(t.row, e.row)
		} : n.kind === "columns" ? {
			kind: "columns",
			firstColumn: Math.min(t.col, e.col),
			lastColumn: Math.max(t.col, e.col)
		} : n.kind === "sheet" ? n : {
			kind: "cells",
			top: Math.min(t.row, e.row),
			left: Math.min(t.col, e.col),
			bottom: Math.max(t.row, e.row),
			right: Math.max(t.col, e.col)
		}, i = [...this.state.areas];
		i[this.state.activeAreaIndex] = r, this.state = X({
			...this.state,
			areas: i
		});
	}
	snapshot() {
		return this.state ? structuredClone(this.state) : null;
	}
	headerHighlight() {
		let e = this.activeArea;
		if (!e) return {
			selectedRowRange: null,
			selectedColRange: null
		};
		let t = e.kind === "cells" ? e.top : e.kind === "rows" ? e.firstRow : 1, n = e.kind === "cells" ? e.bottom : e.kind === "rows" ? e.lastRow : 2 ** 53 - 1, r = e.kind === "cells" ? e.left : e.kind === "columns" ? e.firstColumn : 1, i = e.kind === "cells" ? e.right : e.kind === "columns" ? e.lastColumn : 2 ** 53 - 1, a = 2 ** 53 - 1;
		switch (e.kind) {
			case "cells": return {
				selectedRowRange: {
					start: t,
					end: n,
					strong: !1
				},
				selectedColRange: {
					start: r,
					end: i,
					strong: !1
				}
			};
			case "rows": return {
				selectedRowRange: {
					start: t,
					end: n,
					strong: !0
				},
				selectedColRange: {
					start: 1,
					end: a,
					strong: !1
				}
			};
			case "columns": return {
				selectedRowRange: {
					start: 1,
					end: a,
					strong: !1
				},
				selectedColRange: {
					start: r,
					end: i,
					strong: !0
				}
			};
			case "sheet": return {
				selectedRowRange: {
					start: 1,
					end: a,
					strong: !0
				},
				selectedColRange: {
					start: 1,
					end: a,
					strong: !0
				}
			};
		}
	}
}, $i = class {
	canvas;
	area;
	input;
	cleanups = [];
	ownerDocument;
	ownerWindow;
	constructor(e, t, n) {
		this.canvas = e, this.area = t, this.input = n, this.ownerDocument = n.ownerDocument ?? document, this.ownerWindow = this.ownerDocument.defaultView;
	}
	on(e, t, n) {
		this.input.addEventListener(e, t, n);
		let r = () => this.input.removeEventListener(e, t, n);
		return this.cleanups.push(r), r;
	}
	get viewportSize() {
		return {
			width: this.input.clientWidth,
			height: this.input.clientHeight
		};
	}
	get dpr() {
		return this.ownerWindow?.devicePixelRatio ?? 1;
	}
	localPoint(e, t) {
		let n = this.area.getBoundingClientRect();
		return {
			x: e - n.left,
			y: t - n.top
		};
	}
	sizeCanvas(e, t, n) {
		let r = this.dpr;
		return e.width = Math.round(t * r), e.height = Math.round(n * r), e.style.width = `${t}px`, e.style.height = `${n}px`, r;
	}
	destroy() {
		for (let e of this.cleanups.splice(0)) e();
	}
}, ea = class {
	stopValidationWheel = (e) => e.stopPropagation();
	selection;
	find;
	comment;
	commentStatus;
	validation;
	constructor(e, t, n, r) {
		let i = e.ownerDocument ?? document;
		this.selection = i.createElement("div"), this.selection.style.cssText = "position:absolute;top:0;left:0;z-index:1;pointer-events:none;overflow:hidden;width:100%;height:100%;", this.find = i.createElement("div"), this.find.style.cssText = "position:absolute;top:0;left:0;z-index:1;pointer-events:none;overflow:hidden;width:100%;height:100%;", this.comment = i.createElement("div"), this.comment.dataset.ooxmlCommentUi = "popup", this.comment.setAttribute("role", "note"), this.comment.setAttribute("aria-hidden", "true"), this.comment.style.cssText = `position:absolute;z-index:3;pointer-events:none;display:none;max-width:${r.commentMaxWidth}px;max-height:${r.commentMaxHeight}px;overflow:hidden;font:13px/1.45 var(--ooxml-comment-font-family,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);`, this.commentStatus = i.createElement("div"), this.commentStatus.setAttribute("role", "status"), this.commentStatus.setAttribute("aria-live", "polite"), this.commentStatus.setAttribute("aria-atomic", "true"), this.commentStatus.setAttribute("data-xlsx-comment-status", ""), this.commentStatus.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;", this.validation = i.createElement("div"), this.validation.setAttribute("data-xlsx-validation-panel", ""), this.validation.style.cssText = `position:absolute;z-index:4;pointer-events:auto;display:none;min-width:80px;max-width:${r.validationMaxWidth}px;max-height:${r.validationMaxHeight}px;overflow-y:auto;box-sizing:border-box;background:#fff;border:1px solid #7f7f7f;box-shadow:1px 2px 5px rgba(0,0,0,0.25);font:12px/1.4 sans-serif;color:#222;`, this.validation.addEventListener("wheel", this.stopValidationWheel), e.appendChild(t), e.appendChild(this.selection), e.appendChild(this.find), e.appendChild(n), e.appendChild(this.comment), e.appendChild(this.commentStatus), e.appendChild(this.validation);
	}
	clearSelection() {
		this.selection.textContent = "";
	}
	appendSelection(e) {
		this.selection.appendChild(e);
	}
	clearFind() {
		this.find.textContent = "";
	}
	appendFind(e) {
		this.find.appendChild(e);
	}
	hideComment() {
		this.comment.style.display = "none", this.comment.setAttribute("aria-hidden", "true"), this.commentStatus.textContent = "";
	}
	announceComment(e) {
		this.commentStatus.textContent = e;
	}
	showComment(e, t) {
		this.comment.style.left = `${e}px`, this.comment.style.top = `${t}px`, this.comment.style.display = "block", this.comment.setAttribute("aria-hidden", "false");
	}
	hideValidation() {
		this.validation.style.display = "none";
	}
	showValidation(e, t) {
		this.validation.style.left = `${e}px`, this.validation.style.top = `${t}px`, this.validation.style.display = "block";
	}
	destroy() {
		this.validation.removeEventListener("wheel", this.stopValidationWheel);
	}
}, ta = Symbol("XlsxViewer.borrowedWorkbook"), na = Symbol("XlsxViewer.loadSource"), ra = 240, ia = 200, aa = 1, oa = "data-xlsx-viewer-styles", sa = ".xlsx-tab-strip::-webkit-scrollbar{display:none}[data-xlsx-viewport-input]:focus{outline:none}[data-xlsx-viewport-input]:focus-visible{outline:2px solid var(--ooxml-xlsx-focus-ring,transparent);outline-offset:-2px}.xlsx-tab-nav{background:transparent;transition:background 0.1s;}.xlsx-tab-nav:hover{background:color-mix(in srgb,var(--ooxml-xlsx-chrome-text,#444) 8%,transparent);}.xlsx-zoom-slider{-webkit-appearance:none;appearance:none;background:transparent;height:15px;margin:0;}.xlsx-zoom-slider::-webkit-slider-runnable-track{height:4px;background:var(--ooxml-xlsx-chrome-border,#c4c4c4);border-radius:2px;}.xlsx-zoom-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:12px;height:12px;margin-top:-4px;border-radius:50%;background:var(--ooxml-xlsx-chrome-text-muted,#808080);cursor:pointer;}.xlsx-zoom-slider:hover::-webkit-slider-thumb{background:var(--ooxml-xlsx-chrome-text,#5f5f5f);}.xlsx-zoom-slider::-moz-range-track{height:4px;background:var(--ooxml-xlsx-chrome-border,#c4c4c4);border-radius:2px;}.xlsx-zoom-slider::-moz-range-thumb{width:12px;height:12px;border:none;border-radius:50%;background:var(--ooxml-xlsx-chrome-text-muted,#808080);cursor:pointer;}";
function ca(e) {
	if (!e.head || e.head.querySelector(`style[${oa}]`)) return;
	let t = e.createElement("style");
	t.setAttribute(oa, ""), t.textContent = sa, e.head.appendChild(t);
}
function la(e, t) {
	let n = {
		password: e.password,
		useGoogleFonts: e.useGoogleFonts,
		cjkFallback: e.cjkFallback,
		maxZipEntryBytes: e.maxZipEntryBytes,
		resourceLimits: e.resourceLimits,
		xlsxWorksheetLimits: e.xlsxWorksheetLimits,
		debug: e.debug,
		onResourceMetrics: e.onResourceMetrics,
		workerTimeoutMs: e.workerTimeoutMs,
		wasmUrl: e.wasmUrl,
		math: e.math,
		threeD: e.threeD,
		regionMap: e.regionMap,
		chartEx: e.chartEx,
		tiff: e.tiff,
		mode: t
	};
	return e.legacyXls === void 0 ? n : {
		...n,
		legacyXls: e.legacyXls
	};
}
function ua(e, t, n) {
	let r = e ?? t;
	if (!Number.isSafeInteger(r) || r < 0) throw TypeError(`${n} must be a non-negative safe integer`);
	return r;
}
function da(e) {
	return {
		minRows: ua(e.minRows, Fn.minRows, "minRows"),
		minCols: ua(e.minCols, Fn.minCols, "minCols"),
		marginRows: ua(e.marginRows, 30, "marginRows"),
		marginCols: ua(e.marginCols, 10, "marginCols")
	};
}
var fa = class {
	container;
	hostDocument;
	hostWindow;
	acquisition = new Ji();
	viewport;
	renderDispatcher;
	wrapper;
	canvas;
	gridRegion;
	outlineGutter;
	viewEdits = new wr();
	projectionId = aa++;
	canvasArea;
	scrollHost;
	spacer;
	surface;
	overlayHost;
	sheetTabs = null;
	zoomControl = null;
	currentSheet = 0;
	sheetRequestGeneration = 0;
	fontBindingGeneration = 0;
	fontBinding = null;
	_hiddenSheetMode;
	currentWorksheet = null;
	previewCompletion = null;
	firstPreviewRender = !1;
	committedFrameCount = 0;
	previewPreparedViewport = null;
	previewFallbackReason = null;
	releaseCurrentWorksheet = null;
	currentSourceComments = [];
	commentNavigationGeneration = 0;
	sourceCommentMap = /* @__PURE__ */ new Map();
	sheetViews = /* @__PURE__ */ new Map();
	initialAnchorWorkbook = null;
	initialAnchorReferences = /* @__PURE__ */ new Map();
	currentAutoRowHeightsPrepared = !1;
	opts;
	_mountKind;
	_nativeScrollbars;
	_mode;
	_borrowed = !1;
	preparedWorkbook = null;
	_destroyed = !1;
	resizeObserver = null;
	chromeTheme;
	get chromeColors() {
		return this.chromeTheme.colors;
	}
	_lastViewportNotification = null;
	get activeCell() {
		return this.selectionController.active;
	}
	get selectionMode() {
		return this.selectionController.mode;
	}
	_pendingZoomAnchor = null;
	displayedViewport = null;
	selectionController = new Qi();
	notifier;
	contextReader = new Li();
	gridExtent;
	elementContext = null;
	selectionPaint;
	finder;
	copier = new pi({
		worksheet: () => this.currentWorksheet,
		selection: () => this.selectionState,
		workbook: () => this.wb,
		clipboard: () => this.hostWindow.navigator.clipboard
	});
	selectionInput;
	comments;
	hyperlinks;
	validation;
	constructor(e, t = {}, n) {
		this.container = e, this.hostDocument = (n.kind === "sheet" ? n.canvas.ownerDocument : e.ownerDocument) ?? document;
		let r = this.hostDocument.defaultView;
		if (!r) throw Error("XlsxViewer requires a document with an active Window");
		this.hostWindow = r, this.opts = t, this.gridExtent = da(t), this._mountKind = n.kind, this._nativeScrollbars = t.showScrollbars ?? !0;
		let i = t[ta];
		this._borrowed = i !== void 0, this._mode = n.kind === "sheet" ? n.mode : je("XlsxViewer", t.mode, i), this._hiddenSheetMode = t.hiddenSheetMode ?? "show", this.viewport = new Xi(t.cellScale ?? 1), this.wrapper = this.hostDocument.createElement("div"), this.wrapper.style.cssText = `position:relative;width:100%;height:100%;background:${n.kind === "composite" ? "var(--ooxml-xlsx-chrome-surface,#fff)" : "transparent"};box-sizing:border-box;font-family:sans-serif;display:flex;flex-direction:column;`, this.gridRegion = this.hostDocument.createElement("div"), this.gridRegion.style.cssText = "position:relative;flex:1;min-height:0;overflow:hidden;", this.canvasArea = this.hostDocument.createElement("div"), this.canvasArea.style.cssText = "position:absolute;inset:0;overflow:hidden;", this.canvas = n.kind === "sheet" ? n.canvas : this.hostDocument.createElement("canvas"), this.canvas.style.cssText = "position:absolute;top:0;left:0;z-index:0;display:block;", this.renderDispatcher = new Zi(this.canvas, this._mode === "worker", this.hostWindow), this.scrollHost = this.hostDocument.createElement("div"), this.scrollHost.setAttribute("data-xlsx-viewport-input", n.kind), this.scrollHost.setAttribute("role", "region"), this.scrollHost.setAttribute("aria-label", "Spreadsheet viewport. Use Arrow keys to move the selected cell. Press Enter to show its comment."), this.scrollHost.tabIndex = 0, this.scrollHost.style.cssText = `position:absolute;inset:0;overflow:${this._nativeScrollbars ? "auto" : "clip"};z-index:2;background:transparent;scrollbar-color:var(--ooxml-xlsx-chrome-scrollbar-color,auto);`, this.spacer = this.hostDocument.createElement("div"), this.spacer.style.cssText = "position:absolute;top:0;left:0;pointer-events:none;", this._nativeScrollbars && this.scrollHost.appendChild(this.spacer), this.surface = new $i(this.canvas, this.canvasArea, this.scrollHost), this.overlayHost = new ea(this.canvasArea, this.canvas, this.scrollHost, {
			commentMaxWidth: 280,
			commentMaxHeight: 200,
			validationMaxWidth: ra,
			validationMaxHeight: ia
		}), this.notifier = new Ai({
			hostWindow: this.hostWindow,
			isDestroyed: () => this._destroyed,
			selectionState: () => this.selectionState,
			onSelectionStateChange: () => this.opts.onSelectionStateChange,
			onSelectionContextChange: () => this.opts.onSelectionContextChange,
			readContext: (e) => this.getSelectionContext({ maxTextCharacters: e }),
			emitSelectionChange: () => this.emitSelectionChange(),
			scheduleSelectionContextNotification: () => this.scheduleSelectionContextNotification()
		}), this.selectionPaint = new Di({
			ownerDocument: this.hostDocument,
			canvasArea: this.canvasArea,
			overlayHost: this.overlayHost,
			worksheet: () => this.currentWorksheet,
			currentSheet: () => this.currentSheet,
			selectionState: () => this.selectionState,
			elementContext: () => this.elementContext,
			elementContextViewport: () => this.elementContextViewport(),
			selectionColor: () => this.opts.selectionColor,
			scale: () => this.viewport.scale,
			isRtl: () => this.isRtl,
			cellRect: (e, t) => this._cellRect(e, t),
			screenX: (e, t) => this.screenX(e, t),
			drawValidationDropdown: () => this.validation.drawDropdown()
		}), this.comments = new qi({
			ownerDocument: this.hostDocument,
			canvasArea: this.canvasArea,
			overlayHost: this.overlayHost,
			currentSheet: () => this.currentSheet,
			isRtl: () => this.isRtl,
			isDestroyed: () => this._destroyed,
			cellRect: (e, t) => this._cellRect(e, t),
			screenX: (e, t) => this.screenX(e, t),
			reportError: (e) => this._reportRenderError(e)
		}), this.hyperlinks = new ii({
			hostWindow: this.hostWindow,
			enabled: () => this.opts.enableHyperlinks !== !1,
			onHyperlinkClick: () => this.opts.onHyperlinkClick,
			currentSheet: () => this.currentSheet,
			sheetNames: () => this.sheetNames,
			definedNames: () => this.currentWorksheet?.definedNames ?? [],
			goToSheet: (e) => this.goToSheet(e),
			scrollToCell: (e) => this.scrollToCell(e),
			reportError: (e) => this._reportRenderError(e)
		}), this.validation = new Qr({
			ownerDocument: this.hostDocument,
			canvasArea: this.canvasArea,
			surface: this.surface,
			overlayHost: this.overlayHost,
			worksheet: () => this.currentWorksheet,
			workbook: () => this.wb,
			currentSheet: () => this.currentSheet,
			activeCell: () => this.activeCell,
			selectionMode: () => this.selectionMode,
			scale: () => this.viewport.scale,
			isRtl: () => this.isRtl,
			isDestroyed: () => this._destroyed,
			cellRect: (e, t) => this._cellRect(e, t),
			screenX: (e, t) => this.screenX(e, t)
		}), this.outlineGutter = new Lr({
			gridRegion: this.gridRegion,
			canvasArea: this.canvasArea,
			surface: this.surface,
			worksheet: () => this.currentWorksheet,
			scale: () => this.viewport.scale,
			chromeColors: () => this.chromeColors,
			cellRect: (e, t) => this._cellRect(e, t),
			screenX: (e, t) => this.screenX(e, t),
			setBandHidden: (e, t, n) => this.setBandHidden(e, t, n),
			setBandCollapsed: (e, t, n) => this.setBandCollapsed(e, t, n),
			afterOutlineMutation: (e, t) => this.afterOutlineMutation(e, t)
		}), ca(this.hostDocument), n.kind === "composite" && (this.sheetTabs = new Gr(this.hostDocument, {
			hiddenSheetMode: () => this._hiddenSheetMode,
			isHidden: (e) => !!this.wb?.isHidden(e),
			selectSheet: (e) => {
				this.goToSheet(e).catch((e) => this._reportRenderError(e));
			}
		}), this.opts.showZoomSlider !== !1 && (this.zoomControl = new Yr(this.hostDocument, {
			setScale: (e) => this.setScale(e),
			zoomIn: () => this.zoomIn(),
			zoomOut: () => this.zoomOut()
		}, this.viewport.scale, this.opts.zoomMin ?? .1, this.opts.zoomMax ?? 4), this.sheetTabs.append(this.zoomControl.element))), this.gridRegion.appendChild(this.canvasArea), this.wrapper.appendChild(this.gridRegion), this.sheetTabs && this.wrapper.appendChild(this.sheetTabs.tabBar), e.appendChild(this.wrapper), this.chromeTheme = new Bi({
			hostWindow: this.hostWindow,
			container: this.container,
			wrapper: this.wrapper,
			isDestroyed: () => this._destroyed,
			onChange: () => {
				this.renderGutters(), this.scheduleRender();
			}
		}), this.chromeTheme.install(), this.outlineGutter.installListeners(), this._nativeScrollbars && this.surface.on("scroll", () => {
			if (this.selectionInput.cancelDeferredPress(), this.hideCommentPopup(), this.hideValidationPanel(), this.scrollHost.clientWidth > 0) {
				let e = this.scrollHost.scrollLeft, t = this.isRtl ? this.maxScrollLeft - e : e;
				this.viewport.setViewportSize(this.scrollHost.clientWidth, this.scrollHost.clientHeight), this.viewport.setOffset(t, this.scrollHost.scrollTop);
			}
			this.emitViewportChange(), this.scheduleRender(!0), this.updateSelectionOverlay(), this.updateFindOverlay();
		});
		let a = new this.hostWindow.ResizeObserver(() => {
			let e = {
				x: this.viewport.x,
				y: this.viewport.y
			};
			this.viewport.setViewportSize(this.scrollHost.clientWidth, this.scrollHost.clientHeight), this.setViewportLeft(e.x), this.viewportTop = e.y, this.reanchorHorizontalScroll(), this.layoutGutters(), this.scheduleRender(), this.updateSelectionOverlay(), this.updateFindOverlay(), this.sheetTabs?.updateNavButtons();
		});
		a.observe(this.gridRegion), this.resizeObserver = a, this.selectionInput = new Si({
			surface: this.surface,
			scrollHost: this.scrollHost,
			canvasArea: this.canvasArea,
			hostWindow: this.hostWindow,
			nativeScrollbars: this._nativeScrollbars,
			selection: this.selectionController,
			comments: this.comments,
			hyperlinks: this.hyperlinks,
			validation: this.validation,
			options: () => this.opts,
			worksheet: () => this.currentWorksheet,
			hasWorkbook: () => this.wb !== null,
			scale: () => this.viewport.scale,
			isRtl: () => this.isRtl,
			isDestroyed: () => this._destroyed,
			cellAt: (e, t, n) => this.cellAtGeometry(e, t, n),
			cellRect: (e, t) => this._cellRect(e, t),
			screenX: (e, t) => this.screenX(e, t),
			displayedViewportOffset: () => this.displayedViewportOffset(),
			scrollLeft: () => this.effectiveScrollLeft,
			scrollTop: () => this.viewportTop,
			setScrollLeft: (e) => this.setViewportLeft(e),
			setScrollTop: (e) => {
				this.viewportTop = e;
			},
			scrollCellIntoView: (e, t) => this._scrollCellIntoView(e, t),
			zoomAt: (e, t) => {
				this._pendingZoomAnchor = e, this.setScale(t);
			},
			elementContextAt: (e, t) => this.elementContextAt(e, t),
			setElementContext: (e) => this.setElementContext(e),
			selectionState: () => this.selectionState,
			setSelection: (e) => this.setSelection(e),
			getSelectionContext: () => this.getSelectionContext(),
			copySelection: () => this.copySelection(),
			updateSelectionOverlay: () => this.updateSelectionOverlay(),
			updateFindOverlay: () => this.updateFindOverlay(),
			scheduleRender: (e) => this.scheduleRender(e),
			renderCurrentSheet: () => this.renderCurrentSheet(),
			emitSelectionChange: () => this.emitSelectionChange(),
			emitViewportChange: () => this.emitViewportChange(),
			hideCommentPopup: () => this.hideCommentPopup(),
			hideValidationPanel: () => this.hideValidationPanel(),
			recordSizeOverride: (e, t, n) => this.recordSizeOverride(e, t, n),
			assertResizeBudget: (e, t, n) => this.viewEdits.assertResizeBudget(this.currentSheet, e, t, n),
			beginRowResizePreview: (e) => {
				let t = this.currentWorksheet;
				if (!t) throw Error("Cannot resize an unavailable worksheet.");
				return this.viewEdits.beginRowResizePreview(t, this.currentSheet, e);
			},
			updateSpacerSize: (e) => this.updateSpacerSize(e),
			refitAutoRowsAfterColumnResize: () => this.refitAutoRowsAfterColumnResize(),
			reportError: (e) => this._reportRenderError(e)
		}), this.selectionInput.install(), this.finder = new li({
			ownerDocument: this.hostDocument,
			overlayHost: this.overlayHost,
			workbook: () => this.wb,
			sheetCount: () => this.sheetCount,
			worksheet: () => this.currentWorksheet,
			currentSheet: () => this.currentSheet,
			scale: () => this.viewport.scale,
			highlightColors: () => this.opts.findHighlightColors,
			cellRect: (e, t) => this._cellRect(e, t),
			screenX: (e, t) => this.screenX(e, t),
			goToSheet: (e) => this.goToSheet(e),
			scrollCellIntoView: (e, t) => this._scrollCellIntoView(e, t)
		}), i && (this.acquisition.install(i, !1), this._mountKind === "composite" && this.activateWorkbook(i).catch((e) => this._reportRenderError(e)));
	}
	async [na](e, t = {}) {
		if (this.assertOpen(), this._borrowed) throw Error(`${this._mountKind === "sheet" ? "XlsxSheetViewer" : "XlsxViewer"}.load() is unsupported on a Viewer created by fromWorkbook(); the borrowed workbook is already loaded.`);
		try {
			let n = await this.acquisition.replace(() => Un[Hn](e, la(this.opts, this._mode), t), () => {
				this.sheetRequestGeneration++, this.renderDispatcher.begin(), this.finder.invalidate(), this.hideValidationPanel(), this.releaseHostFonts();
			});
			if (!n) return;
			if (this._destroyed) throw this.destroyedError();
			await this.activateWorkbook(n);
		} catch (e) {
			throw this._destroyed ? this.destroyedError() : e instanceof Error ? e : Error(String(e));
		}
	}
	async activateWorkbook(e, t) {
		this.prepareWorkbook(e) && await this.showSheet(t ?? this._initialSheet());
	}
	async ensureHostFonts(e) {
		if (this.fontBinding?.workbook === e) return !0;
		let t = e[zn];
		if (typeof t != "function") return !0;
		let n = ++this.fontBindingGeneration, r = await t.call(e, this.hostDocument);
		return this._destroyed || n !== this.fontBindingGeneration || this.wb !== e ? (r(), !1) : (this.fontBinding?.release(), this.fontBinding = {
			workbook: e,
			release: r
		}, !0);
	}
	releaseHostFonts() {
		this.fontBindingGeneration++, this.fontBinding?.release(), this.fontBinding = null;
	}
	prepareWorkbook(e) {
		return this._destroyed || this.wb !== e ? !1 : this.preparedWorkbook === e ? !0 : (this.finder.invalidate(), this.selectionInput.clearSheetGestures(), this.viewEdits.clear(), this.releaseInitialAnchorReferences(), this.sheetViews.clear(), this.buildTabs(), this.preparedWorkbook = e, this.opts.onReady?.(e.sheetNames), !0);
	}
	get workbook() {
		let e = this.acquisition.current;
		if (!e) throw Error("Workbook not loaded");
		return e;
	}
	get wb() {
		return this.acquisition.current;
	}
	set wb(e) {
		e ? this.acquisition.install(e) : this.acquisition.destroy();
	}
	async showSheet(e) {
		this.selectionInput.clearSheetGestures();
		let t = ++this.sheetRequestGeneration;
		this.previewFallbackReason = null;
		let n = this.workbook, r, i, a, o = null, s = null, c, l = !1;
		try {
			if (!await this.ensureHostFonts(n) || !this.isCurrentSheetRequest(t, n)) return;
			e !== this.currentSheet && this.currentWorksheet && (this.releaseCurrentWorksheet?.(), this.releaseCurrentWorksheet = null);
			let u = await Gn(n, e);
			i = u.worksheet, a = u.release;
			let d = () => this.isCurrentSheetRequest(t, n) ? !1 : (a?.(), a = void 0, !0);
			if (d()) return;
			let f = u.partial, p = this.sheetViews.get(e), m = this.initialAnchorReferenceFor(n, e), h = m === void 0 ? Ge(i) : void 0, g = h !== void 0;
			if (g && (p !== void 0 && !p.parseError || this.viewEdits.hasViewEdits(e))) throw Error(`XLSX viewer cannot establish the initial size of editAs="oneCell" anchors on sheet ${e} after view edits.`);
			let _ = (t) => {
				let n = t.parseError || p?.parseError ? void 0 : p, r = n ?? this.createVisibleSheetView(t);
				return (n || u.partial) && (r.rows = t.rows), n || (m && !t.parseError && ze(r, m), this.viewEdits.restoreSheetViewState(e, r)), r;
			}, v = (r, i) => {
				i && ct(r);
				let a = n[Bn];
				if (typeof a == "function") {
					let e = this.hostDocument.createElement("canvas").getContext("2d");
					e && (a.call(n, r, e), l = !0);
				}
				this.isCurrentSheetRequest(t, n) && this.viewEdits.syncAutomaticRowOverrides(e, r);
			}, y = (e) => {
				if (!g || e.parseError || !this.isCurrentSheetRequest(t, n)) return;
				let r = Re(e, V(e), this.viewport.scale) ?? null;
				return r && ze(e, r), r;
			};
			if (r = _(i), u.partial) {
				let e = {
					width: this.canvasArea.clientWidth,
					height: this.canvasArea.clientHeight,
					scale: this.viewport.scale
				};
				s = e;
				let t = () => V(r).visibleRange({
					width: e.width,
					height: e.height,
					scale: e.scale,
					scrollX: 0,
					scrollY: 0,
					headerWidth: 50,
					headerHeight: 22,
					buffer: 2
				}), n = t(), a = 0, o = h ?? 0;
				for (;;) {
					let e = Math.max(n.range.row + n.range.rows - 1, r.freezeRows ?? 0, o);
					if (e > a) {
						if (await (u.waitForRows?.(e) ?? Promise.resolve()), d()) return;
						a = e;
					}
					if (v(r, !0), n = t(), Math.max(n.range.row + n.range.rows - 1, r.freezeRows ?? 0, o) <= a) break;
				}
				let l = {
					row: (r.freezeRows ?? 0) > 0 ? 1 : n.range.row,
					col: (r.freezeCols ?? 0) > 0 ? 1 : n.range.col,
					rows: n.range.row + n.range.rows - ((r.freezeRows ?? 0) > 0 ? 1 : n.range.row),
					cols: n.range.col + n.range.cols - ((r.freezeCols ?? 0) > 0 ? 1 : n.range.col)
				};
				if (this.previewFallbackReason = Xn(r, l, a) ?? (g ? Zn(r, o, a) : null), this.previewFallbackReason) {
					if (i = await u.completion, d()) return;
					f = !1, s = null, r = _(i), v(r, !0);
				}
				c = y(r);
			} else v(r, !1), c = y(r);
			o = f ? u.completion : null;
		} catch (e) {
			if (a?.(), c && ot(c), !this.isCurrentSheetRequest(t, n)) return;
			throw await this.restoreDisplayedWorksheetLease(n, t), e;
		}
		if (!this.isCurrentSheetRequest(t, n)) {
			a?.(), c && ot(c);
			return;
		}
		this.selectionInput.clearSheetGestures(), this.viewEdits.restoreRowResizeRanges(e, r), c !== void 0 && this.installInitialAnchorReference(n, e, c), this.currentAutoRowHeightsPrepared = l, this.releaseCurrentWorksheet?.(), this.releaseCurrentWorksheet = a ?? null, this.sheetViews.clear(), this.sheetViews.set(e, r), this.currentSheet = e, this.displayedViewport = null, this.currentWorksheet = r, this.previewCompletion = o, this.firstPreviewRender = o !== null, this.previewPreparedViewport = s, o && o.then((i) => {
			if (!this.isCurrentSheetRequest(t, n) || this.currentWorksheet !== r) return;
			this.previewCompletion = null, this.firstPreviewRender = !1, this.previewPreparedViewport = null;
			let a = !!i.parseError;
			this.selectionInput.clearSheetGestures();
			let o = this.createVisibleSheetView(i), s = a ? void 0 : this.initialAnchorReferenceFor(n, e);
			if (s && ze(o, s), this.viewEdits.restoreSheetViewState(e, o), this.displayedViewport = null, this.currentWorksheet = o, this.sheetViews.set(e, o), a) {
				this.currentSourceComments = [], this.sourceCommentMap.clear(), this.selectionController.reset(), this.emitSelectionChange(), this.updateSelectionOverlay(), this.buildCommentMap(o), this.buildHyperlinkMap(o), this.buildOutline(o), this.layoutGutters(), this.updateSpacerSize(o), this.scheduleRender();
				return;
			}
			rt(r), ct(r);
			let c = this.hostDocument.createElement("canvas").getContext("2d");
			c && (n[Bn](o, c), this.currentAutoRowHeightsPrepared = !0), this.viewEdits.syncAutomaticRowOverrides(e, o), this.currentSourceComments = i.comments ?? [], this.sourceCommentMap = Ki(this.currentSourceComments), this.buildCommentMap(o), this.buildHyperlinkMap(o), this.buildOutline(o), this.layoutGutters(), this.updateSpacerSize(o), this.scheduleRender(), this.scheduleSelectionContextNotification();
		}).catch((e) => {
			if (!(!this.isCurrentSheetRequest(t, n) || this.currentWorksheet !== r)) {
				if (this.previewCompletion = null, this.firstPreviewRender = !1, this.previewPreparedViewport = null, this.selectionInput.clearSheetGestures(), this.displayedViewport = null, this.currentWorksheet = null, this.releaseCurrentWorksheet?.(), this.releaseCurrentWorksheet = null, this.renderDispatcher.begin(), this._mode === "worker") {
					let e = new OffscreenCanvas(1, 1);
					e.getContext("2d");
					let t = e.transferToImageBitmap();
					this.canvas.getContext("bitmaprenderer")?.transferFromImageBitmap(t), t.close();
				} else this.canvas.getContext("2d")?.clearRect?.(0, 0, this.canvas.width, this.canvas.height);
				this._reportRenderError(e);
			}
		}), this.currentSourceComments = i.comments ?? [], this.opts.comments !== !1 && this.currentSourceComments.length > 0 && this.comments.loadUi().catch((e) => this._reportRenderError(e)), this.sourceCommentMap = Ki(this.currentSourceComments), this.setElementContext(null), this.selectionInput.clearSheetGestures(), this.updateFooterDirection(), this.viewportTop = 0, this.selectionController.reset(), this.emitSelectionChange(), this.hideCommentPopup(), this.hideValidationPanel(), this.updateSelectionOverlay(), this.updateTabActive(e), this.buildCommentMap(this.currentWorksheet), this.buildHyperlinkMap(this.currentWorksheet), this.buildOutline(this.currentWorksheet), this.layoutGutters(), this.updateSpacerSize(this.currentWorksheet), this.resetHorizontalScroll();
		let u = this.committedFrameCount;
		await this.renderCurrentSheet();
		let d = this.committedFrameCount > u;
		if (o && !d && this.isCurrentSheetRequest(t, n)) {
			if (await o, !this.isCurrentSheetRequest(t, n)) return;
			await this.renderCurrentSheet();
		}
		this.isCurrentSheetRequest(t, n) && (this.updateFindOverlay(), this.emitViewportChange(), this.opts.onSheetChange?.(e, this.workbook.sheetNames.length));
	}
	isCurrentSheetRequest(e, t) {
		return !this._destroyed && e === this.sheetRequestGeneration && this.wb === t;
	}
	initialAnchorReferenceFor(e, t) {
		return this.initialAnchorWorkbook === e ? this.initialAnchorReferences.get(t) : void 0;
	}
	installInitialAnchorReference(e, t, n) {
		this.initialAnchorWorkbook !== e && (this.releaseInitialAnchorReferences(), this.initialAnchorWorkbook = e), this.initialAnchorReferences.has(t) || this.initialAnchorReferences.set(t, n);
	}
	releaseInitialAnchorReferences() {
		for (let e of this.initialAnchorReferences.values()) e && ot(e);
		this.initialAnchorReferences.clear(), this.initialAnchorWorkbook = null;
	}
	async restoreDisplayedWorksheetLease(e, t) {
		if (!this.currentWorksheet || this.releaseCurrentWorksheet) return;
		let n = await Kn(e, this.currentSheet);
		this.isCurrentSheetRequest(t, e) && this.currentWorksheet && !this.releaseCurrentWorksheet ? this.releaseCurrentWorksheet = n : n();
	}
	buildOutline(e) {
		this.viewEdits.bindSheet(this.currentSheet), this.outlineGutter.rebuild(e);
	}
	layoutGutters() {
		this.outlineGutter.layout();
	}
	renderGutters() {
		this.outlineGutter.render();
	}
	scrollOutlineSummaryToStart(e, t) {
		let n = this.currentWorksheet;
		if (!n) return;
		let r = this.viewport.scale, i = V(n).scrollOffsetForCell(e === "row" ? t : 1, e === "col" ? t : 1, {
			scale: r,
			viewportWidth: this.canvasArea.clientWidth,
			viewportHeight: this.canvasArea.clientHeight,
			currentX: this.effectiveScrollLeft,
			currentY: this.viewportTop,
			headerWidth: 50,
			headerHeight: 22,
			align: "start"
		});
		e === "row" ? this.viewportTop = i.y : this.setViewportLeft(i.x);
	}
	setBandHidden(e, t, n) {
		let r = this.currentWorksheet;
		r && this.viewEdits.setBandHidden(r, this.currentSheet, e, t, n);
	}
	recordSizeOverride(e, t, n) {
		let r = this.currentWorksheet;
		r && this.viewEdits.recordSizeOverride(r, this.currentSheet, e, t, n);
	}
	wireSizeOverrides() {
		return this.viewEdits.wireSizeOverrides(this.currentSheet);
	}
	setBandCollapsed(e, t, n) {
		let r = this.currentWorksheet;
		r && this.viewEdits.setBandCollapsed(r, this.currentSheet, e, t, n);
	}
	afterOutlineMutation(e, t) {
		q.invalidate(e), this.outlineGutter.rebuild(e), this.updateSpacerSize(e), t && this.scrollOutlineSummaryToStart(t.axis, t.summary), this.updateSelectionOverlay(), this.updateFindOverlay(), this.scheduleRender(), t && this.emitViewportChange();
	}
	get isRtl() {
		return this.currentWorksheet?.rightToLeft === !0;
	}
	updateFooterDirection() {
		this.sheetTabs?.setDirection(this.isRtl);
	}
	get maxScrollLeft() {
		return this.syncNativeViewportExtent(), this.viewport.maxX;
	}
	get maxScrollTop() {
		return this.syncNativeViewportExtent(), this.viewport.maxY;
	}
	syncNativeViewportExtent() {
		this._nativeScrollbars && (this.viewport.setViewportSize(this.scrollHost.clientWidth, this.scrollHost.clientHeight), this.viewport.ensureExtent(this.scrollHost.scrollWidth, this.scrollHost.scrollHeight));
	}
	get viewportTop() {
		return this._nativeScrollbars && (this.syncNativeViewportExtent(), this.viewport.adoptNativeOffset(this.viewport.x, this.scrollHost.scrollTop)), this.viewport.y;
	}
	set viewportTop(e) {
		this.viewport.setOffset(this.viewport.x, e), this._nativeScrollbars && (this.scrollHost.scrollTop = this.viewport.y);
	}
	get effectiveScrollLeft() {
		if (this._nativeScrollbars) {
			this.syncNativeViewportExtent();
			let e = this.scrollHost.scrollLeft;
			this.viewport.adoptNativeOffset(this.isRtl ? this.maxScrollLeft - e : e, this.viewport.y);
		}
		return this.viewport.x;
	}
	setViewportLeft(e) {
		this.viewport.setOffset(e, this.viewport.y), this._nativeScrollbars && (this.scrollHost.scrollLeft = this.isRtl ? Math.max(0, this.maxScrollLeft - this.viewport.x) : this.viewport.x);
	}
	screenX(e, t) {
		return this.isRtl ? vt(e, t, this.canvasArea.clientWidth) : e;
	}
	resetHorizontalScroll() {
		this.viewport.setOffset(0, this.viewport.y), this._nativeScrollbars && (this.scrollHost.scrollLeft = this.isRtl ? this.maxScrollLeft : 0);
	}
	reanchorHorizontalScroll() {
		if (!this._nativeScrollbars || !this.isRtl || this.scrollHost.clientWidth === 0) return;
		let e = Math.max(0, this.maxScrollLeft - this.viewport.x);
		Math.abs(this.scrollHost.scrollLeft - e) > 1 && (this.scrollHost.scrollLeft = e);
	}
	get sheetIndex() {
		return this.currentSheet;
	}
	get sheetCount() {
		return this.wb?.sheetCount ?? 0;
	}
	async goToSheet(e) {
		if (this.sheetCount === 0) return;
		let t = this.workbook;
		this.prepareWorkbook(t) && await this.showSheet(Math.max(0, Math.min(e, this.sheetCount - 1)));
	}
	async nextSheet() {
		await this.goToSheet(this._stepSheet(1));
	}
	async prevSheet() {
		await this.goToSheet(this._stepSheet(-1));
	}
	getViewportOffset() {
		return {
			x: Math.max(0, this.effectiveScrollLeft),
			y: Math.max(0, this.viewportTop)
		};
	}
	emitViewportChange() {
		let e = this.opts.onViewportChange;
		if (!e) return;
		let t = this.getViewportOffset(), n = this.displayedViewportOffset(), r = {
			x: n.x,
			y: n.y
		}, i = this._lastViewportNotification;
		i && i.offset.x === t.x && i.offset.y === t.y && i.displayed.x === r.x && i.displayed.y === r.y || (this._lastViewportNotification = {
			offset: t,
			displayed: r
		}, e(t));
	}
	async setViewportOffset(e) {
		if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) throw TypeError("XLSX viewport offsets must be finite numbers");
		let t = Math.min(this.maxScrollLeft, Math.max(0, e.x)), n = Math.min(this.maxScrollTop, Math.max(0, e.y));
		this.setViewportLeft(t), this.viewportTop = n, await this.renderCurrentSheet(), this.updateSelectionOverlay(), this.updateFindOverlay(), this.emitViewportChange();
	}
	async relayout() {
		this.reanchorHorizontalScroll(), this.layoutGutters(), this.currentWorksheet && this.updateSpacerSize(this.currentWorksheet), await this.renderCurrentSheet(), this.updateSelectionOverlay(), this.updateFindOverlay();
	}
	async scrollToCell(e, t = {}) {
		let n = B(e);
		!n || !this.currentWorksheet || (this.previewCompletion && await this.previewCompletion, this._scrollCellIntoView(n.row, n.col, t.align ?? "nearest"), await this.renderCurrentSheet(), this.updateSelectionOverlay(), this.updateFindOverlay(), this.emitViewportChange());
	}
	_stepSheet(e) {
		return this._hiddenSheetMode === "skip" && this.wb ? Lt(this.currentSheet, e, (e) => this.wb.isHidden(e), this.sheetCount) : this.currentSheet + e;
	}
	_initialSheet() {
		return this._hiddenSheetMode === "skip" && this.wb ? Rt(0, (e) => this.wb.isHidden(e), this.sheetCount) : 0;
	}
	displayedViewportOffset() {
		let e = this.displayedViewport;
		return e && e.worksheet === this.currentWorksheet && e.scale === this.viewport.scale && e.width === this.canvasArea.clientWidth && e.height === this.canvasArea.clientHeight ? e : {
			x: this.effectiveScrollLeft,
			y: this.viewportTop
		};
	}
	getCellAt(e, t) {
		return this.cellAtGeometry(e, t, "displayed");
	}
	cellAtGeometry(e, t, n = "displayed") {
		if (this._destroyed) return null;
		let r = this.currentWorksheet;
		if (!r) return null;
		let i = this.viewport.scale, a = this.canvasArea.getBoundingClientRect(), o = this.screenX(e - a.left, 0), s = t - a.top, c = Math.round(50 * i), l = Math.round(22 * i);
		if (o < c || s < l) return null;
		let u = o - c, d = s - l, f = n === "logical" ? {
			x: this.effectiveScrollLeft,
			y: this.viewportTop
		} : this.displayedViewportOffset();
		return V(r).cellAt(u, d, {
			scrollX: f.x,
			scrollY: f.y,
			scale: i
		});
	}
	elementContextViewport() {
		let e = this.currentWorksheet;
		if (!e) return null;
		let t = this.canvasArea.clientWidth, n = this.canvasArea.clientHeight;
		if (t <= 0 || n <= 0) return null;
		let r = this.viewport.scale, i = V(e).visibleRange({
			width: t,
			height: n,
			scale: r,
			scrollX: this.displayedViewportOffset().x,
			scrollY: this.displayedViewportOffset().y,
			headerWidth: 50,
			headerHeight: 22,
			buffer: 2
		});
		return {
			width: t,
			height: n,
			cellScale: r,
			viewport: i.range,
			scrollOffsetX: i.offsetX,
			scrollOffsetY: i.offsetY,
			freezeRows: e.freezeRows ?? 0,
			freezeCols: e.freezeCols ?? 0
		};
	}
	elementContextAt(e, t) {
		if (!this.opts.enableElementSelection || this._destroyed) return null;
		let n = this.currentWorksheet, r = this.elementContextViewport();
		if (!n || !r) return null;
		let i = this.canvasArea.getBoundingClientRect();
		return dr(n, this.currentSheet, {
			x: e - i.left,
			y: t - i.top
		}, r);
	}
	_cellRect(e, t) {
		let n = this.currentWorksheet;
		if (!n) return null;
		let r = this.viewport.scale;
		return V(n).cellRect(e, t, {
			scale: r,
			scrollX: this.displayedViewportOffset().x,
			scrollY: this.displayedViewportOffset().y,
			headerWidth: 50,
			headerHeight: 22
		});
	}
	getCellViewportRect(e) {
		if (this._destroyed) return null;
		let t = typeof e == "string" ? B(e) : e;
		if (!t || t.row < 1 || t.col < 1) return null;
		let n = this._cellRect(t.row, t.col);
		return n ? Object.freeze({
			x: this.screenX(n.x, n.w),
			y: n.y,
			width: n.w,
			height: n.h
		}) : null;
	}
	getComments() {
		return this.assertOpen(), structuredClone(this.currentSourceComments);
	}
	async goToComment(e, t, n) {
		let r = B(t), i = this.wb;
		if (!r || !i || !Number.isInteger(e) || e < 0 || e >= i.sheetCount) return !1;
		let a = ++this.commentNavigationGeneration, o = e === this.currentSheet && this.currentWorksheet !== null ? this.currentSourceComments : await i.getComments(e);
		if (this._destroyed) throw this.destroyedError();
		if (a !== this.commentNavigationGeneration || i !== this.wb || !o.some((e) => {
			let t = B(e.cellRef);
			return t?.row === r.row && t.col === r.col;
		})) return !1;
		if (e !== this.currentSheet || this.currentWorksheet === null) {
			if (await this.goToSheet(e), this._destroyed) throw this.destroyedError();
			if (a !== this.commentNavigationGeneration || i !== this.wb || e !== this.currentSheet) return !1;
		}
		let s = this.sheetRequestGeneration, c = this.currentSheet, l = this.currentWorksheet;
		if (await this.scrollToCell(t, n), this._destroyed) throw this.destroyedError();
		return a !== this.commentNavigationGeneration || i !== this.wb || s !== this.sheetRequestGeneration || c !== this.currentSheet || l !== this.currentWorksheet ? !1 : (this.setSelection(t), !0);
	}
	get selectionState() {
		return this.selectionController.snapshot();
	}
	setSelection(e) {
		if (this._destroyed) throw Error("XlsxViewer has been destroyed");
		let t;
		if (typeof e == "string") {
			if (t = xr(e), !t) throw SyntaxError(`Invalid XLSX selection reference: ${e}`);
		} else t = e ? X(e) : null;
		this.commitSelection(t);
	}
	getSelectionContext(e = {}) {
		if (this.assertOpen(), this.previewCompletion) return null;
		if (this.elementContext) return fr(this.elementContext, e.maxTextCharacters);
		let t = this.currentWorksheet, n = this.selectionState;
		return !t || !n ? null : this.contextReader.read(t, this.currentSheet, n, this.sourceCommentMap, this.wb, e);
	}
	commitSelection(e) {
		this.setElementContext(null);
		let t = this.selectionState;
		Sr(t, e) || (this.hideValidationPanel(), this.selectionController.setState(e), this.updateSelectionOverlay(), this.wb && this.scheduleRender(), this.emitSelectionChange());
	}
	setElementContext(e) {
		return JSON.stringify(this.elementContext) === JSON.stringify(e) ? !1 : (this.elementContext = e ? structuredClone(e) : null, this.updateSelectionOverlay(), this.scheduleSelectionContextNotification(), !0);
	}
	scheduleSelectionContextNotification() {
		this.notifier.scheduleContextNotification();
	}
	emitSelectionChange() {
		this.notifier.emit();
	}
	refitAutoRowsAfterColumnResize() {
		let e = this.currentWorksheet, t = this.preparedWorkbook;
		if (!e || !t) return;
		ct(e, this.viewEdits.manualRows(this.currentSheet));
		let n = t[Bn];
		if (typeof n != "function") return;
		let r = this.hostDocument.createElement("canvas").getContext("2d");
		r && (n.call(t, e, r), this.viewEdits.syncAutomaticRowOverrides(this.currentSheet, e), this.updateSpacerSize(e), this.updateSelectionOverlay(), this.scheduleRender());
	}
	setSelectionColor(e) {
		this.opts.selectionColor = e, this.updateSelectionOverlay();
	}
	async setHiddenSheetMode(e) {
		this._hiddenSheetMode = e, this.buildTabs(), e === "skip" && this.wb && this.wb.isHidden(this.currentSheet) ? await this.showSheet(Rt(this.currentSheet, (e) => this.wb.isHidden(e), this.sheetCount)) : this.updateTabActive(this.currentSheet);
	}
	get hiddenSheetMode() {
		return this._hiddenSheetMode;
	}
	get visibleSheetCount() {
		if (!this.wb) return 0;
		let e = this.wb;
		return zt((t) => e.isHidden(t), this.sheetCount);
	}
	async copySelection() {
		return this.assertOpen(), this.previewCompletion && await this.previewCompletion, this.copier.copy();
	}
	updateSelectionOverlay() {
		this.selectionPaint.update();
	}
	updateFindOverlay() {
		this.finder.updateOverlay();
	}
	async findText(e, t = {}) {
		return this.finder.find(e, t);
	}
	async findNext() {
		return this.finder.next();
	}
	async findPrev() {
		return this.finder.prev();
	}
	clearFind() {
		this.finder.clear();
	}
	_scrollCellIntoView(e, t, n = "nearest") {
		let r = this.currentWorksheet;
		if (!r) return;
		let i = this.viewport.scale, a = V(r).scrollOffsetForCell(e, t, {
			scale: i,
			viewportWidth: this.canvasArea.clientWidth,
			viewportHeight: this.canvasArea.clientHeight,
			currentX: this.effectiveScrollLeft,
			currentY: this.viewportTop,
			headerWidth: 50,
			headerHeight: 22,
			align: n
		});
		this.viewportTop = a.y, this.setViewportLeft(a.x);
	}
	hideValidationPanel() {
		this.validation.hide();
	}
	buildCommentMap(e) {
		this.comments.setComments(e.comments ?? []);
	}
	createVisibleSheetView(e) {
		let t = Yi(e);
		if (this.opts.comments === !1) {
			let e = {
				...t,
				commentRefs: [],
				comments: []
			};
			return Xe(t, e), Ln(t, e), U(t, e), e;
		}
		if ((typeof this.opts.comments == "object" ? this.opts.comments : void 0)?.includeResolved !== !1) return t;
		let n = new Set((t.comments ?? []).filter((e) => e.resolved === !0).map((e) => e.cellRef));
		if (n.size === 0) return t;
		let r = {
			...t,
			commentRefs: t.commentRefs?.filter((e) => !n.has(e)),
			comments: t.comments?.filter((e) => !n.has(e.cellRef))
		};
		return Xe(t, r), Ln(t, r), U(t, r), r;
	}
	buildHyperlinkMap(e) {
		this.hyperlinks.build(e);
	}
	hideCommentPopup() {
		this.comments.hide();
	}
	buildTabs() {
		this.sheetTabs && this.sheetTabs.build(this.workbook.sheetNames, this.workbook.tabColors);
	}
	updateTabActive(e) {
		this.sheetTabs?.setActive(e);
	}
	setScale(e) {
		let t = this.opts.zoomMin ?? .1, n = this.opts.zoomMax ?? 4, r = Math.min(Math.round(n * 100), Math.max(Math.round(t * 100), Math.round(e * 100))), i = r / 100, a = this.viewport.scale, o = this._pendingZoomAnchor;
		if (this._pendingZoomAnchor = null, i !== a) {
			if (this.viewport.setScale(i), this.zoomControl?.sync(i, r, t, n), this.currentWorksheet) {
				let e = this.effectiveScrollLeft, t = this.viewportTop;
				if (this.layoutGutters(), this.updateSpacerSize(this.currentWorksheet), o) {
					this.viewportTop = ve(t, o.y, a, i, { maxScroll: this.maxScrollTop });
					let n = this.screenX(o.x, 0), r = this.maxScrollLeft, s = ve(e, n, a, i, { maxScroll: r });
					this.setViewportLeft(s);
				} else this.setViewportLeft(e);
			}
			this.renderCurrentSheet().catch((e) => this._reportRenderError(e)), this.updateSelectionOverlay(), this.updateFindOverlay(), this.sheetTabs?.updateNavButtons(), this.opts.onScaleChange?.(i);
		}
	}
	getScale() {
		return this.viewport.scale;
	}
	zoomIn() {
		this.setScale(Se(this.getScale()));
	}
	zoomOut() {
		this.setScale(Ne(this.getScale()));
	}
	fitWidth() {
		this._fit("width");
	}
	fitPage() {
		this._fit("page");
	}
	_fit(e) {
		let t = this.currentWorksheet;
		if (!t) return;
		let { width: n, height: r } = this._naturalContentExtent(t), i = Pe({
			contentWidth: n,
			contentHeight: r,
			containerWidth: this.canvasArea.clientWidth,
			containerHeight: this.canvasArea.clientHeight
		}, e);
		i <= 0 || this.setScale(i);
	}
	_naturalContentExtent(e) {
		let { maxRow: t, maxCol: n } = Rn(e, this.gridExtent);
		return V(e).logicalContentExtent(t, n, 50, 22);
	}
	updateSpacerSize(e) {
		let t = this.viewport.scale, { maxRow: n, maxCol: r } = Rn(e, this.gridExtent);
		n += this.gridExtent.marginRows, r += this.gridExtent.marginCols;
		let i = V(e).roundedContentExtent(n, r, t, 50, 22), a = i.width, o = i.height;
		this.spacer.style.width = `${a}px`, this.spacer.style.height = `${o}px`, this.viewport.setViewportSize(this.scrollHost.clientWidth, this.scrollHost.clientHeight), this.viewport.setExtent(a, o), this.setViewportLeft(this.viewport.x), this.viewportTop = this.viewport.y;
	}
	scheduleRender(e = !1) {
		this.renderDispatcher.schedule(() => this.renderCurrentSheet().catch((e) => this._reportRenderError(e)), e && this._mode === "worker");
	}
	async renderCurrentSheet() {
		let e = this.renderDispatcher.begin(), t = this.selectionInput.rowResizePreview;
		try {
			await this._renderCurrentSheet(e);
		} catch (n) {
			if (!this.renderDispatcher.isCurrent(e)) return;
			throw t && this.selectionInput.abortRowResizePreview(t), n;
		}
	}
	_reportRenderError(e) {
		if (this._destroyed) return;
		let t = e instanceof Error ? e : Error(String(e));
		this.opts.onError ? this.opts.onError(t) : console.error("[ooxml] XlsxViewer render failed:", t);
	}
	async _renderCurrentSheet(e) {
		if (!this.currentWorksheet) return;
		if (this.previewCompletion) {
			if (this.firstPreviewRender) {
				let e = this.previewPreparedViewport;
				if (!e || this.canvasArea.clientWidth !== e.width || this.canvasArea.clientHeight !== e.height || this.viewport.scale !== e.scale || this.viewportTop !== 0 || this.effectiveScrollLeft !== 0) return;
			} else await this.previewCompletion;
			if (!this.renderDispatcher.isCurrent(e) || this._destroyed) return;
		}
		let t = this.currentWorksheet, n = this.canvasArea.clientWidth, r = this.canvasArea.clientHeight;
		if (n <= 0 || r <= 0) return;
		let i = this.viewport.scale, a = this.surface.dpr, o = t.freezeRows ?? 0, s = t.freezeCols ?? 0, c = this.effectiveScrollLeft, l = this.viewportTop, u = V(t).visibleRange({
			width: n,
			height: r,
			scale: i,
			scrollX: c,
			scrollY: l,
			headerWidth: 50,
			headerHeight: 22,
			buffer: 2
		}), d = u.range, { offsetX: f, offsetY: p } = u, { selectedRowRange: m, selectedColRange: h } = this.computeHeaderHighlight(), g = {
			width: n,
			height: r,
			dpr: a,
			imageResources: this.opts.imageResources,
			cellScale: i,
			scrollOffsetX: f,
			scrollOffsetY: p,
			freezeRows: o,
			freezeCols: s,
			selectedRowRange: m,
			selectedColRange: h,
			chromeColors: this.chromeColors
		}, _ = this.wireSizeOverrides(), v = t.parseError ? void 0 : this.initialAnchorReferenceFor(this.workbook, this.currentSheet) ?? void 0, y = _ || v ? {
			id: this.projectionId,
			revision: this.viewEdits.sizeRevision(this.currentSheet),
			autoRowHeightsPrepared: this.currentAutoRowHeightsPrepared,
			...v ? { initialAnchorSizes: v } : {}
		} : void 0, b = Dn(_ ? {
			...g,
			sizeOverrides: _.overrides
		} : g, V(t).maximumDigitWidth, {
			worksheet: t,
			projection: y
		});
		if (this._mode === "worker") {
			let a = await this.workbook.renderViewportToBitmap(this.currentSheet, d, b);
			if (!this.renderDispatcher.commitBitmap(e, a, n, r)) return;
			this.displayedViewport = {
				worksheet: t,
				x: c,
				y: l,
				scale: i,
				width: n,
				height: r
			}, this.updateSelectionOverlay(), this.updateFindOverlay(), this._lastViewportNotification && this.emitViewportChange();
		} else if (await this.workbook.renderViewport(this.canvas, this.currentSheet, d, $t(b, () => !this._destroyed && this.renderDispatcher.isCurrent(e))), !this.renderDispatcher.isCurrent(e) || this._destroyed) return;
		this.renderGutters(), this.firstPreviewRender = !1, this.committedFrameCount++;
	}
	computeHeaderHighlight() {
		return this.selectionController.headerHighlight();
	}
	get sheetNames() {
		return this.wb?.sheetNames ?? [];
	}
	get canvasElement() {
		return this.canvas;
	}
	async getResourceMetrics() {
		if (!this.wb) throw Error("Workbook not loaded");
		return await this.wb.getResourceMetrics();
	}
	destroy() {
		if (this._destroyed) return;
		this._destroyed = !0, this.notifier.destroy(), this.selectionInput.destroy(), this.sheetRequestGeneration++, this.resizeObserver?.disconnect(), this.chromeTheme.destroy(), this.renderDispatcher.destroy(), this.surface.destroy(), this.overlayHost.destroy(), this.sheetTabs?.destroy(), this.zoomControl?.destroy(), this.comments.destroy(), this.validation.destroy(), this.finder.destroy(), this.releaseHostFonts();
		let e = this.wb?.[Vn];
		typeof e == "function" && e.call(this.wb, this.projectionId), this.displayedViewport = null, this.currentWorksheet = null, this.releaseCurrentWorksheet?.(), this.releaseCurrentWorksheet = null, this.sheetViews.clear(), this.releaseInitialAnchorReferences(), this.viewEdits.destroy(), this.currentSourceComments = [], this.sourceCommentMap.clear(), this.hyperlinks.destroy(), this.preparedWorkbook = null, this.outlineGutter.destroy(), this.elementContext = null, this.selectionController.reset(), this.acquisition.destroy(), this.wrapper.remove();
	}
	assertOpen() {
		if (this._destroyed) throw this.destroyedError();
	}
	destroyedError() {
		return /* @__PURE__ */ Error(this._mountKind === "sheet" ? "XlsxSheetViewer is destroyed" : "XlsxViewer is destroyed");
	}
}, pa = class e extends fa {
	static fromWorkbook(t, n, r = {}) {
		return new e(t, {
			...r,
			[ta]: n
		});
	}
	constructor(e, t = {}) {
		super(e, t, { kind: "composite" });
	}
	async load(e) {
		await this[na](e);
	}
}, ma = class e {
	canvasElement;
	engine;
	canvasMount;
	destroyed = !1;
	snapshot;
	lastMetrics;
	static fromWorkbook(t, n, r = {}) {
		return new e(t, {
			...r,
			[ta]: n
		});
	}
	constructor(e, t = {}) {
		this.canvasElement = e;
		let n = t[ta], r = je("XlsxSheetViewer", t.mode, n), i = e.getBoundingClientRect();
		this.canvasMount = new Ae(e, {
			wrapperCssText: `position:relative;display:inline-block;vertical-align:top;overflow:hidden;width:${e.style.width || `${i.width || e.width}px`};height:${e.style.height || `${i.height || e.height}px`};`,
			restoreMode: "style-and-bitmap"
		}), this.engine = new fa(this.canvasMount.wrapper, {
			...t,
			onResourceMetrics: (e) => {
				this.lastMetrics = e, t.onResourceMetrics?.(e);
			}
		}, {
			kind: "sheet",
			canvas: e,
			mode: r
		}), this.snapshot = {
			sheetIndex: 0,
			sheetCount: 0,
			sheetNames: [],
			viewport: {
				x: 0,
				y: 0
			},
			selectionState: null,
			scale: this.engine.getScale(),
			hiddenSheetMode: this.engine.hiddenSheetMode,
			visibleSheetCount: 0
		};
	}
	async load(e, t = {}) {
		this.assertOpen();
		try {
			await this.engine[na](e, t);
		} finally {
			this.destroyed || this.captureSnapshot();
		}
		this.assertOpen();
	}
	get sheetIndex() {
		return this.destroyed ? this.snapshot.sheetIndex : this.engine.sheetIndex;
	}
	get sheetCount() {
		return this.destroyed ? this.snapshot.sheetCount : this.engine.sheetCount;
	}
	get sheetNames() {
		return this.destroyed ? [...this.snapshot.sheetNames] : [...this.engine.sheetNames];
	}
	async goToSheet(e) {
		this.assertOpen(), await this.engine.goToSheet(e), this.assertOpen(), this.captureSnapshot();
	}
	async nextSheet() {
		this.assertOpen(), await this.engine.nextSheet(), this.assertOpen(), this.captureSnapshot();
	}
	async prevSheet() {
		this.assertOpen(), await this.engine.prevSheet(), this.assertOpen(), this.captureSnapshot();
	}
	getViewportOffset() {
		return this.destroyed ? { ...this.snapshot.viewport } : this.engine.getViewportOffset();
	}
	async setViewportOffset(e) {
		this.assertOpen(), await this.engine.setViewportOffset(e), this.assertOpen(), this.captureSnapshot();
	}
	async scrollToCell(e, t) {
		this.assertOpen(), await this.engine.scrollToCell(e, t), this.assertOpen(), this.captureSnapshot();
	}
	async relayout() {
		this.assertOpen();
		let e = this.canvasElement.getBoundingClientRect();
		e.width > 0 && (this.canvasMount.wrapper.style.width = `${e.width}px`), e.height > 0 && (this.canvasMount.wrapper.style.height = `${e.height}px`), await this.engine.relayout(), this.assertOpen(), this.captureSnapshot();
	}
	getScale() {
		return this.destroyed ? this.snapshot.scale : this.engine.getScale();
	}
	setScale(e) {
		this.assertOpen(), this.engine.setScale(e), this.captureSnapshot();
	}
	zoomIn() {
		this.assertOpen(), this.engine.zoomIn(), this.captureSnapshot();
	}
	zoomOut() {
		this.assertOpen(), this.engine.zoomOut(), this.captureSnapshot();
	}
	fitWidth() {
		this.assertOpen(), this.engine.fitWidth(), this.captureSnapshot();
	}
	fitPage() {
		this.assertOpen(), this.engine.fitPage(), this.captureSnapshot();
	}
	getCellAt(e, t) {
		return this.destroyed ? null : this.engine.getCellAt(e, t);
	}
	getCellViewportRect(e) {
		return this.destroyed ? null : this.engine.getCellViewportRect(e);
	}
	getComments() {
		return this.assertOpen(), this.engine.getComments();
	}
	async goToComment(e, t, n) {
		this.assertOpen();
		let r = await this.engine.goToComment(e, t, n);
		return this.assertOpen(), this.captureSnapshot(), r;
	}
	get selectionState() {
		let e = this.destroyed ? this.snapshot.selectionState : this.engine.selectionState;
		return e ? structuredClone(e) : null;
	}
	setSelection(e) {
		this.assertOpen(), this.engine.setSelection(e), this.captureSnapshot();
	}
	getSelectionContext(e) {
		return this.assertOpen(), this.engine.getSelectionContext(e);
	}
	async copySelection() {
		return this.assertOpen(), await this.engine.copySelection();
	}
	setSelectionColor(e) {
		this.assertOpen(), this.engine.setSelectionColor(e);
	}
	async setHiddenSheetMode(e) {
		this.assertOpen(), await this.engine.setHiddenSheetMode(e), this.assertOpen(), this.captureSnapshot();
	}
	get hiddenSheetMode() {
		return this.destroyed ? this.snapshot.hiddenSheetMode : this.engine.hiddenSheetMode;
	}
	get visibleSheetCount() {
		return this.destroyed ? this.snapshot.visibleSheetCount : this.engine.visibleSheetCount;
	}
	async findText(e, t) {
		this.assertOpen();
		let n = await this.engine.findText(e, t);
		return this.assertOpen(), n;
	}
	async findNext() {
		this.assertOpen();
		let e = await this.engine.findNext();
		return this.assertOpen(), this.captureSnapshot(), e;
	}
	async findPrev() {
		this.assertOpen();
		let e = await this.engine.findPrev();
		return this.assertOpen(), this.captureSnapshot(), e;
	}
	clearFind() {
		this.assertOpen(), this.engine.clearFind();
	}
	async getResourceMetrics() {
		if (this.destroyed) {
			if (this.lastMetrics) return this.lastMetrics;
			throw this.destroyedError();
		}
		return this.lastMetrics = await this.engine.getResourceMetrics(), this.lastMetrics;
	}
	destroy() {
		this.destroyed || (this.captureSnapshot(), this.destroyed = !0, this.engine.destroy(), this.canvasMount.restore());
	}
	captureSnapshot() {
		let e = this.engine.selectionState;
		this.snapshot = {
			sheetIndex: this.engine.sheetIndex,
			sheetCount: this.engine.sheetCount,
			sheetNames: [...this.engine.sheetNames],
			viewport: { ...this.engine.getViewportOffset() },
			selectionState: e ? structuredClone(e) : null,
			scale: this.engine.getScale(),
			hiddenSheetMode: this.engine.hiddenSheetMode,
			visibleSheetCount: this.engine.visibleSheetCount
		};
	}
	assertOpen() {
		if (this.destroyed) throw this.destroyedError();
	}
	destroyedError() {
		return /* @__PURE__ */ Error("XlsxSheetViewer is destroyed");
	}
}, ha = /* @__PURE__ */ e({
	MAX_SELECTION_AREAS: () => 128,
	MAX_SELECTION_CONTEXT_CELLS: () => mr,
	MAX_SELECTION_CONTEXT_TEXT_CHARACTERS: () => hr,
	OoxmlDecodedImageLimitError: () => se,
	OoxmlError: () => t,
	OoxmlResourceLimitError: () => g,
	TiffDecodeError: () => me,
	XlsxSheetViewer: () => ma,
	XlsxViewer: () => pa,
	XlsxWorkbook: () => Un,
	autoResize: () => ge,
	isOoxmlDecodedImageLimitError: () => z,
	isTiffDecodeError: () => pe,
	openExternalHyperlink: () => I,
	resolveSharedStrings: () => St
});
export { mr as a, On as c, pr as i, Dn as l, ma as n, hr as o, pa as r, Un as s, ha as t };
