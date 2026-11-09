// optional-renderer: packages/core/src/chart/chart-ex-renderer.ts
import { $ as e, $n as t, Aa as n, Ci as r, Fn as i, In as a, J as o, Ka as s, Ln as c, Mt as l, Nn as u, Pn as d, Qn as f, R as p, Rn as m, Rt as h, S as g, Sa as _, Ut as v, Wa as y, Wt as b, Xa as x, Xi as S, Y as C, Yt as w, Zn as T, Zt as E, _n as D, aa as O, b as k, ba as A, bt as j, ct as M, da as N, eo as P, er as F, fn as I, ga as ee, gn as L, ha as te, hn as ne, ia as R, in as z, it as re, jt as ie, la as B, mn as ae, nt as oe, oa as se, on as ce, ot as le, pn as ue, ra as de, rt as fe, s as pe, so as V, st as me, t as he, tt as ge, x as H, xn as _e, ya as ve, yt as ye, zt as be } from "./plot-area-frame-DNYMd9Pf.js";
import { A as xe, C as Se, D as Ce, E as we, O as Te, S as Ee, T as De, _ as U, a as Oe, b as ke, c as Ae, d as je, f as Me, g as Ne, i as Pe, j as Fe, k as Ie, l as Le, m as Re, o as ze, p as Be, s as Ve, u as He, v as Ue, w as We, x as Ge, y as W } from "./renderer-DpTePxGq.js";
import { t as G } from "./renderer-module-contract-BuTx2FWJ.js";
function Ke(e, t, n, i = 1) {
	let a = 0, o = Math.max(1, n?.w ?? 32 * i), c = Math.max(1, n?.h ?? 16 * i), l = ae(e, ({ label: n, linkedStyleIndex: l }) => {
		let u = n.labelBox, d = L(u), f = d ? e.chartStyleRoles?.dataLabelCallout ?? e.chartStyleRoles?.dataLabel : e.chartStyleRoles?.dataLabel, p = d ? V(e, "dataLabelCallout") ?? V(e, "dataLabel") : V(e, "dataLabel"), m = D(u, f, p, f != null, 0, l)?.fillPaint, h = y(u?.style, p, 0), g = u?.borderHidden === !0 ? s(p) : void 0, _ = u?.borderColor != null || u?.borderFill != null || h !== void 0 || g !== void 0 || u?.borderPaintAuthored === !0 && u?.borderHidden !== !0, v = h === void 0 ? g === void 0 ? u?.borderFill ?? (u?.borderColor ? {
			fillType: "solid",
			color: u.borderColor
		} : _ ? null : x(f, l)) : g : h;
		for (let e of [m, v]) {
			if (!e) continue;
			let n = e.fillType === "image" ? pe(e, t, o, c, i) ?? 1048577 : r(e);
			if (e.fillType === "gradient" && n > 4096 || n > 1048576 - a) {
				a = ce + 1;
				return;
			}
			a += n;
		}
	});
	return l === "not-hierarchy" ? null : l === "too-large" ? ce + 1 : a;
}
function K(e, t, n, r) {
	if (!e.chartexParetoOutlineOwner) return t;
	let i = t.chartexFormatIdx ?? n, a = t.lineColor ?? U(e, i, r, t.chartexStyle);
	return {
		...t,
		chartexStyle: {
			...t.chartexStyle,
			fillHidden: !0,
			fillPaintAuthored: !0
		},
		lineColor: a,
		lineHidden: !1
	};
}
function qe(e, t, n = 1) {
	if (e.chartexSuppressGeometry) return 0;
	if (![
		"waterfall",
		"funnel",
		"boxWhisker",
		"sunburst",
		"treemap",
		"clusteredColumn",
		"histogram",
		"pareto",
		"paretoLine"
	].includes(e.chartType)) return null;
	let i = 0, a = (e) => {
		if (!e || i > 1048576) return;
		let a = e.fillType === "image" ? pe(e, void 0, Math.max(1, t.w), Math.max(1, t.h), n) : r(e);
		e.fillType === "gradient" && a > 4096 || a > 1048576 - i ? i = ce + 1 : i += a;
	}, o = (t, n, r, i) => {
		let o = Fe(e, t, n, r, i, "#000000", { linkedNoStyleFallback: !0 });
		o.visible && a(o.paint ?? {
			fillType: "solid",
			color: "000000"
		});
	}, s = (t, n, r, o) => {
		a(Ie(e, t, n, r, o));
		let s = xe(e, t, n, r, o, "#000000");
		if (s.visible && !Ge(s) && a(s.paint ?? {
			fillType: "solid",
			color: "000000"
		}), i > 1048576) return !1;
	}, c = (t, n) => {
		let r = [e.chartexDataPointStyle, e.chartexDataPointLineStyle];
		Te(e, Se(t, n), r, r, n, 1, "#000000", { linkedNoStyleFallback: !0 }).visible && a({
			fillType: "solid",
			color: "000000"
		});
	}, l = k(e, (t, n, r) => n === 0 ? K(e, t, n, r) : t);
	if (l) {
		if (l.kind === "tooManyInputPoints") return ce + 1;
		if (g(l, s), i > 1048576 || (H(l, s), i > 1048576)) return i;
		if (e.chartType === "pareto" && l.series.length > 0) {
			let t = e.chartexParetoOwnerIndex ?? 0, n = l.series[t], r = e.series.find((e) => e.seriesType === "line");
			c(r ?? n, r?.chartexFormatIdx ?? n?.chartexFormatIdx ?? 0);
		}
	} else if (e.chartType === "paretoLine") {
		let t = e.series[0];
		t && v(t, e.categories, { sortDescending: e.chartexParetoSortDescending ?? !1 }).points.length > 0 && c(t, h(t, 0));
	} else if (e.chartType === "waterfall") {
		let t = e.series[0], n = t?.values ?? [], r = be(t?.dataPointOverrides), i = I(n, e.categories.length, e.subtotalIndices);
		if (i.cumulativeOverflow || i.rawMax <= i.rawMin) return 0;
		for (let n = 0; n < i.bars.length; n++) {
			let o = i.bars[n];
			if (!o.paintSlot) continue;
			let s = o.semanticIndex, c = r.get(n);
			a(Ie(e, t, c, s, 3));
			let l = xe(e, t, c, s, 3, "#000000");
			l.visible && !Ge(l) && a(l.paint ?? {
				fillType: "solid",
				color: "000000"
			});
		}
	} else if (e.chartType === "funnel") {
		let t = e.series[0], n = t?.values ?? [], r = Math.max(n.length, e.categories.length);
		if (n.some((e) => e != null && e > 0)) {
			let i = be(t?.dataPointOverrides);
			for (let o = 0; o < r; o++) {
				if (!((n[o] ?? 0) > 0)) continue;
				let r = i.get(o);
				a(Ie(e, t, r, 0, 1));
				let s = xe(e, t, r, 0, 1, "#000000");
				s.visible && a(s.paint ?? {
					fillType: "solid",
					color: "000000"
				});
			}
		}
	} else if (e.chartType === "boxWhisker") {
		let t = e.chartexBox, n = t?.series.length ?? 0;
		for (let r = 0; r < n; r++) {
			let i = t.series[r], s = i.chartexFormatIdx ?? r, c = Ue(e, s, n, i.chartexStyle, i.color);
			for (let t of i.valuesByCategory) F(t, i.quartileMethod) && (a(c), o(e.chartexDataPointStyle, Se(i, s), s, n));
		}
	} else {
		let t = e.series[0], n = 1;
		ue(e, ({ node: e }) => {
			n = Math.max(n, e.branchIndex + 1);
		});
		let r = be(t?.dataPointOverrides);
		if (ue(e, ({ node: i, paintsBody: o }) => {
			if (!o) return;
			let s = r.get(i.labelIndex);
			a(Ie(e, t, s, i.branchIndex, n));
			let c = xe(e, t, s, i.branchIndex, n, "#000000", e.chartexDataPointStyle, { linkedNoStyleFallback: e.chartType === "treemap" });
			c.visible && a(c.paint ?? {
				fillType: "solid",
				color: "000000"
			});
		}) === "too-large") return ce + 1;
	}
	return i;
}
function Je(e, t, n, r, i = 0) {
	let a = t.series[0];
	if (!a) return;
	let o = b(a.values, t.chartexHistogramBinning ?? {}, a.valFormatCode, t.date1904 === !0);
	if (o.kind === "tooManyInputPoints") {
		Le(e, n, z + 1);
		return;
	}
	ze(e, P(t, {
		chartType: "clusteredBar",
		categories: o.categories,
		series: [{
			...a,
			categories: void 0,
			values: o.counts,
			valFormatCode: null
		}]
	}), n, r, { gapPolicy: "chartex" }, i);
}
function Ye(t, r, i, a, s) {
	let { x: l, y: u, w: d, h: f } = i, h = r.series[0]?.values ?? [], g = r.categories, v = Math.max(h.length, g.length);
	if (v === 0 || Le(t, i, v)) return;
	let { bars: y, rawMax: b, rawMin: x, cumulativeOverflow: S } = I(h, g.length, r.subtotalIndices);
	if (S) {
		t.fillStyle = "#888", t.font = "12px sans-serif", t.textAlign = "center", t.textBaseline = "middle", t.fillText("(chart values out of range)", l + d / 2, u + f / 2);
		return;
	}
	if (b <= x) return;
	let w = r.subtotalIndices.length === 0 && y.every((e, t) => !e.hasValue || h[t] >= 0), T = !r.valAxisHidden && r.valAxisTickLabelPos !== "none" && !w, D = Ae(t, r, d, f, a), k = O(r, d, f, a), F = p(r.valAxisFontSizeHpt, f, a), L = p(r.catAxisFontSizeHpt, f, a), te = j(r, r.valAxisFontFace, "minor"), R = j(r, r.catAxisFontFace, "minor"), z = oe(r, x, b, f / a);
	t.save();
	let ie = 0;
	if (T) {
		t.font = ye(F, te, r.valAxisFontBold ?? !1, r.valAxisFontItalic ?? !1);
		let e = 0;
		for (let n of z.majorLines) e = Math.max(e, _(t, ge(r, n, !1)));
		ie = e + 8;
	}
	let ae = T ? ee(z.majorLines.map((e) => ge(r, e, !1)), ve(F)) / 2 : 0, ce = Math.max(1, d - k.valBandW - ie - d * .02) / v;
	t.font = ye(L, R, r.catAxisFontBold ?? !1, r.catAxisFontItalic ?? !1);
	let ue = g.slice(0, v).map((e) => M(t, _e(e, r.catAxisFormatCode, r.date1904), Math.max(1, ce - 8))), de = 0;
	for (let e of ue) e.some(Boolean) && (de = Math.max(de, e.length));
	let pe = r.catAxisHidden || de === 0 ? 0 : de * (L + 2) + 4, V = r.series[0], H = be(V?.dataLabelOverrides), Ce = be(V?.dataPointOverrides), Ee = V?.chartexStyle, De = `#${V?.color ?? U(r, 0, 3, Ee)}`, Oe = `#${U(r, 1, 3, Ee)}`, Pe = `#${U(r, 2, 3, Ee)}`, Fe = Ue(r, 0, 3, Ee, V?.color), Re = Ue(r, 1, 3, Ee), ze = Ue(r, 2, 3, Ee), W = P(r, {
		chartType: "clusteredBar",
		series: [
			ke(r, "Increase", V, r.chartexDataPointStyle, 0, 3, De, !1, !0, !0),
			ke(r, "Decrease", V, r.chartexDataPointStyle, 1, 3, Oe, !1, !0, !0),
			ke(r, "Total", V, r.chartexDataPointStyle, 2, 3, Pe, !1, !0, !0)
		]
	}), G = Be(t, W, d, f, a), { legRightW: Ke, legLeftW: K, legTopH: qe, legBottomH: Je } = se(G, r.legendOverlay === !0), Ye = N(r, l, u, d, f, a, {
		titleBand: D,
		legendReserve: G,
		pad: {
			t: D.bandH + qe + F / 2 + 2 + ae,
			r: Ke + d * .02,
			b: Je + k.catBandH + pe,
			l: K + k.valBandW + (r.valAxisHidden ? d * .02 : Math.max(d * .03, ie))
		},
		honorPlotAreaManualLayout: !0
	});
	Ve(t, r, l, u, d, f, u + Ye.title.topPad, Ye.title.fontPx);
	let { px0: q, py0: J, pw: Y, ph: X } = Ye.plotRect;
	if (Y <= 0 || X <= 0) return;
	he(t, r, q, J, Y, X, a, s);
	let Xe = oe(r, x, b, X / a), Z = (e) => J + X - Xe.frac(e) * X, Q = E(r.valAxisLineColor, r.valAxisLineWidthEmu, a), Ze = E(r.catAxisLineColor, r.catAxisLineWidthEmu, a), Qe = le(r, a);
	if (!r.valAxisHidden) {
		t.font = ye(F, te, r.valAxisFontBold ?? !1, r.valAxisFontItalic ?? !1), t.fillStyle = r.valAxisFontColor ? `#${r.valAxisFontColor}` : "#595959", t.textAlign = "right", t.textBaseline = "middle";
		let n = me(r, a);
		for (let e of Xe.minorLines) re(t, q, Y, Z(e), !1, n);
		for (let n of Xe.majorLines) {
			let i = Z(n);
			if (e(r)) {
				t.strokeStyle = Qe.color, t.lineWidth = Qe.width;
				let e = Qe.dash.length > 0 && t.getLineDash ? t.getLineDash() : [];
				Qe.dash.length > 0 && t.setLineDash(Qe.dash), t.beginPath(), t.moveTo(q, i), t.lineTo(q + Y, i), t.stroke(), Qe.dash.length > 0 && t.setLineDash(e);
			}
			T && A(t, ge(r, n, !1), q - 4, i, ve(F)), o(t, r.valAxisMajorTickMark, "val", q, i, Q.color, Q.width, !1, r.valAxisLineHidden, "major", a, r.valAxisLineDash);
		}
		for (let e of Xe.minorTicks) o(t, r.valAxisMinorTickMark, "val", q, Z(e), Q.color, Q.width, !1, r.valAxisLineHidden, "minor", a, r.valAxisLineDash);
	}
	let $e = !r.valAxisHidden && !r.valAxisLineHidden, et = !r.catAxisHidden && !r.catAxisLineHidden;
	$e && fe(t, q, J, q, J + X, Q.color, Q.width, r.valAxisLineDash), et && fe(t, q, J + X, q + Y, J + X, Ze.color, Ze.width, r.catAxisLineDash);
	let tt = Y / v, $ = tt / (1 + n(r.barGapWidth, "chartex") / 100);
	y.forEach((e, n) => {
		let i = q + tt * n + (tt - $) / 2, o = Math.min(Z(e.start), Z(e.end)), _ = Math.max(Z(e.start), Z(e.end)), b = Math.max(1, _ - o), x = e.semanticIndex, S = Ce.get(n), C = Ie(r, V, S, x, 3), w = S?.color ? `#${S.color}` : e.isSub ? Pe : e.isPos ? De : Oe, T = We(r, r.chartexDataPointStyle, "line", x, 3), E = xe(r, V, S, x, 3, T ? `#${T}` : w);
		if (e.paintSlot && m(t, c(S?.chartexStyle, V?.chartexStyle), r.chartexDataPointStyle, x, {
			x: i,
			y: o,
			w: $,
			h: b
		}, a, (e) => {
			C && we(e, C, {
				x: i,
				y: o,
				w: $,
				h: b
			}, w, a, s), !Ge(E) && Ne(e, E, a, {
				x: i,
				y: o,
				w: $,
				h: b
			}, s) && e.strokeRect(i, o, $, b);
		}), e.paintSlot && y[n + 1]?.paintSlot && n < v - 1 && r.chartexConnectorLines !== !1) {
			let s = q + tt * (n + 1) + (tt - $) / 2, c = e.isPos ? o : _;
			t.save();
			let l = [r.chartexSeriesLineStyle, r.chartexDataPointLineStyle], u = Te(r, Se(V, x), l, l, x, 3, "#000000", { linkedNoStyleFallback: !0 });
			Ne(t, u, a) && (u.widthEmu ?? (t.lineWidth = .75 * a), t.beginPath(), t.moveTo(i + $, c), t.lineTo(s, c), t.stroke()), t.restore();
		}
		let D = e.hasValue ? h[n] : 0, O = ne(r, V, n, g[n] ?? "", D, {
			visible: r.showDataLabels,
			showVal: !0,
			showCatName: !1
		}, H, !e.hasValue);
		if (O) {
			let e = V?.dataLabelColors?.[n] ?? O.fontColor ?? null, c = e ? `#${e}` : r.dataLabelFontColor ? `#${r.dataLabelFontColor}` : "#595959", m = B(O.fontSizeHpt, a) ?? p(r.dataLabelFontSizeHpt, f, a), h = O.fontBold ?? r.dataLabelFontBold ?? !1, g = j(r, O.fontFace ?? r.dataLabelFontFace, "minor");
			t.font = `${O.textStyle.fontItalic ? "italic " : ""}${h ? "bold " : ""}${m}px ${g}`, He(t, O.text, {
				kind: "bar",
				rect: {
					x: i,
					y: o,
					w: $,
					h: b
				},
				orientation: "vertical",
				negative: D < 0,
				position: O.position ?? "outEnd"
			}, {
				x: q,
				y: J,
				w: Y,
				h: X
			}, m, c, O.manualLayout, {
				x: l,
				y: u,
				w: d,
				h: f
			}, je(r, O.richRuns, a, g, h, O.textStyle), void 0, O.textStyle, a, O.labelBox, s);
		}
	}), t.textAlign = "center", t.textBaseline = "top", t.fillStyle = r.catAxisFontColor ? `#${r.catAxisFontColor}` : "#595959", t.font = ye(L, R, r.catAxisFontBold ?? !1, r.catAxisFontItalic ?? !1);
	let nt = J + X + 4;
	for (let e = 0; e < v && !r.catAxisHidden; e++) {
		let n = q + tt * e + tt / 2;
		(ue[e] ?? []).forEach((e, r) => e && t.fillText(e, n, nt + r * (L + 2)));
	}
	C(t, r, l, u, d, f, q, J, Y, X, K, Je, k.catFontPx, k.valFontPx), Me(t, W, G, l, u, d, f, q, J, Y, X, D.bandH + 2, a, [
		Fe,
		Re,
		ze
	], s), t.restore();
}
function q(e, t, r, i, a) {
	let o = t.series[0]?.values ?? [], s = Math.max(o.length, t.categories.length);
	if (s === 0 || Le(e, r, s)) return;
	let l = 0;
	for (let e = 0; e < s; e++) l = Math.max(l, o[e] ?? 0);
	if (!(l > 0)) return;
	let { x: u, y: d, w: f, h } = r, g = Ae(e, t, f, h, i), v = t.series[0], y = be(v?.dataLabelOverrides), b = `#${v?.color ?? U(t, 0, 1, v?.chartexStyle)}`, x = Ue(t, 0, 1, v?.chartexStyle, v?.color), S = {
		...t,
		series: [ke(t, v?.name ?? "", v, t.chartexDataPointStyle, 0, 1, b)]
	}, C = Be(e, S, f, h, i), { legRightW: w, legLeftW: T, legTopH: D, legBottomH: O } = se(C, t.legendOverlay === !0), k = p(t.catAxisFontSizeHpt, h, i);
	e.save(), e.font = ye(k, j(t, t.catAxisFontFace, "minor"), t.catAxisFontBold ?? !1, t.catAxisFontItalic ?? !1);
	let M = 0;
	if (!t.catAxisHidden) {
		for (let n = 0; n < Math.min(s, t.categories.length); n++) M = Math.max(M, _(e, t.categories[n]));
		t.categories.length > 0 && (M += 10);
	}
	let P = N(t, u, d, f, h, i, {
		titleBand: g,
		legendReserve: C,
		pad: {
			t: g.bandH + D + 2,
			r: w + f * .02,
			b: O + h * .02,
			l: T + M + f * .02
		},
		honorPlotAreaManualLayout: !0
	});
	Ve(e, t, u, d, f, h, d + P.title.topPad, P.title.fontPx);
	let { px0: F, py0: I, pw: ee, ph: L } = P.plotRect;
	if (ee <= 0 || L <= 0) return;
	he(e, t, F, I, ee, L, i, a);
	let te = L / s, R = te / (1 + n(t.barGapWidth, "chartex") / 100), z = be(v?.dataPointOverrides);
	for (let n = 0; n < s; n++) {
		let r = Math.max(0, o[n] ?? 0), s = ee * r / l, g = F + (ee - s) / 2, _ = I + te * n + (te - R) / 2, x = z.get(n), S = Ie(t, v, x, 0, 1), C = xe(t, v, x, 0, 1, b), w = (e) => {
			S && s > 0 ? we(e, S, {
				x: g,
				y: _,
				w: s,
				h: R
			}, b, i, a) : S && (e.fillStyle = W(e, S, g, _, s, R, b, a), e.fillRect(g, _, s, R)), Ne(e, C, i, s > 0 ? {
				x: g,
				y: _,
				w: s,
				h: R
			} : void 0, a) && e.strokeRect(g, _, s, R);
		};
		s > 0 ? m(e, c(x?.chartexStyle, v?.chartexStyle), t.chartexDataPointStyle, 0, {
			x: g,
			y: _,
			w: s,
			h: R
		}, i, w) : w(e);
		let T = t.categories[n];
		!t.catAxisHidden && T != null && (e.fillStyle = t.catAxisFontColor ? `#${t.catAxisFontColor}` : "#595959", e.textAlign = "right", e.textBaseline = "middle", A(e, T, F - 6, _ + R / 2, ve(k)));
		let E = ne(t, v, n, T ?? "", r, {
			visible: !1,
			showVal: !1,
			showCatName: !1
		}, y);
		if (E) {
			let n = B(E.fontSizeHpt, i) ?? p(t.dataLabelFontSizeHpt, h, i), r = j(t, E.fontFace ?? t.dataLabelFontFace, "minor");
			e.font = `${E.textStyle.fontItalic ? "italic " : ""}${E.fontBold ? "bold " : ""}${n}px ${r}`, He(e, E.text, {
				kind: "bar",
				rect: {
					x: g,
					y: _,
					w: s,
					h: R
				},
				orientation: "horizontal",
				negative: !1,
				position: E.position ?? "ctr"
			}, {
				x: F,
				y: I,
				w: ee,
				h: L
			}, n, E.fontColor ? `#${E.fontColor}` : "#ffffff", E.manualLayout, {
				x: u,
				y: d,
				w: f,
				h
			}, je(t, E.richRuns, i, r, E.fontBold ?? !1, E.textStyle), void 0, E.textStyle, i, E.labelBox, a);
		}
	}
	if (!t.catAxisHidden && !t.catAxisLineHidden) {
		let n = E(t.catAxisLineColor, t.catAxisLineWidthEmu, i);
		e.strokeStyle = n.color, e.lineWidth = n.width, e.beginPath(), e.moveTo(F, I), e.lineTo(F, I + L), e.stroke();
	}
	Me(e, S, C, u, d, f, h, F, I, ee, L, g.bandH + 2, i, [x], a), e.restore();
}
function J(e, t, n, r, i = 0) {
	let a = t.series[0];
	if (!a || Le(e, n, Math.max(t.categories.length, a.categories?.length ?? 0, a.values.length))) return;
	let o = v(a, t.categories, { sortDescending: t.chartexParetoSortDescending ?? !1 });
	if (o.points.length === 0) return;
	let s = h(a, 0), c = [t.chartexDataPointStyle, t.chartexDataPointLineStyle], l = Te(t, Se(a, s), c, c, s, 1, `#${U(t, s, 1, a.chartexStyle)}`, { linkedNoStyleFallback: !0 });
	Pe(e, P(t, {
		chartType: "line",
		categories: t.chartexParetoFlatEndpoint ? [...o.categories, ""] : o.categories,
		series: [{
			...o.series,
			values: t.chartexParetoFlatEndpoint ? [...o.series.values, 1] : o.series.values,
			showMarker: !1,
			lineHidden: !l.visible,
			lineColor: l.color.replace(/^#/, ""),
			lineWidthEmu: l.widthEmu ?? 9525,
			chartexStyle: {
				lineDash: l.dash,
				lineCap: l.cap,
				lineJoin: l.join
			}
		}],
		catAxisHidden: !1,
		catAxisTickLabelPos: t.chartexParetoSortDescending == null || !(a.categories ?? t.categories).some((e) => e != null && e !== "") ? "none" : "nextTo",
		showLegend: !1,
		valMin: t.valMin ?? 0,
		valMax: t.valMax ?? (t.valAxisFormatCode === "0%" ? 1 : 1.2),
		valAxisMajorUnit: t.valAxisMajorUnit ?? (t.valAxisFormatCode === "0%" ? .1 : .2)
	}), n, r, i);
}
function Y(e) {
	return {
		min: e.secondaryValAxis?.min ?? 0,
		max: e.secondaryValAxis?.max ?? 1,
		title: e.secondaryValAxis?.title ?? null,
		hidden: e.secondaryValAxis?.hidden ?? !1,
		formatCode: e.secondaryValAxis?.formatCode ?? "0%",
		fontColor: e.secondaryValAxis?.fontColor ?? null,
		fontSizeHpt: e.secondaryValAxis?.fontSizeHpt ?? null,
		fontFace: e.secondaryValAxis?.fontFace ?? null,
		lineColor: e.secondaryValAxis?.lineColor ?? null,
		lineWidthEmu: e.secondaryValAxis?.lineWidthEmu ?? null,
		lineHidden: e.secondaryValAxis?.lineHidden ?? !1,
		majorTickMark: e.secondaryValAxis?.majorTickMark ?? "out",
		minorTickMark: e.secondaryValAxis?.minorTickMark ?? null,
		majorUnit: e.secondaryValAxis?.majorUnit ?? null,
		minorUnit: e.secondaryValAxis?.minorUnit ?? null,
		titleFontSizeHpt: e.secondaryValAxis?.titleFontSizeHpt ?? null,
		titleFontBold: e.secondaryValAxis?.titleFontBold ?? null,
		titleFontColor: e.secondaryValAxis?.titleFontColor ?? null,
		titleFontFace: e.secondaryValAxis?.titleFontFace ?? null
	};
}
function X(e, t, n, r, i = 0) {
	let a = t.series.filter((e) => e.seriesType !== "line"), o = t.chartexParetoOwnerIndex ?? 0, s = a[o];
	if (!s || a.length === 0 || Le(e, n, Math.max(t.categories.length, ...a.map((e) => e.values.length)))) return;
	let c = a.map((e, n) => v(n === 0 ? K(t, e, n, a.length) : e, t.categories, {
		sortDescending: t.chartexParetoSortDescending ?? !0,
		keepUnvaluedCategories: !0
	})), l = c[o], u = c[0];
	if (l.points.length === 0 || u.points.length === 0) return;
	let d = t.chartexParetoFlatEndpoint === !0 && u.categories.length === u.points.length, f = t.series.find((e) => e.seriesType === "line"), p = f?.chartexFormatIdx ?? s.chartexFormatIdx ?? 0, m = {
		...f ?? l.series,
		name: f?.name || "Cumulative %",
		values: l.series.values,
		categories: u.categories,
		color: f?.color ?? We(t, t.chartexDataPointLineStyle, "line", p, 1) ?? s.lineColor ?? s.color,
		seriesType: "line",
		useSecondaryAxis: !0,
		showMarker: !1
	}, h = Y(t);
	ze(e, P(t, {
		chartType: "clusteredBar",
		categories: d ? [...u.categories, ""] : u.categories,
		series: [...c.map((e) => ({
			...e.orderedSeries,
			values: d ? [...e.orderedSeries.values, null] : e.orderedSeries.values,
			seriesType: null,
			useSecondaryAxis: !1
		})), d ? {
			...m,
			values: [...m.values, 1]
		} : m],
		secondaryValAxis: h
	}), n, r, {
		gapPolicy: "chartex",
		semanticLineNoStyleFallback: !0
	}, i);
}
var Xe = 7, Z = .05, Q = 1.2;
function Ze(e, t, n, r) {
	let i = (r ?? t) - (n ?? e);
	if (!(i > 0) || !Number.isFinite(i)) return null;
	let a = ie(i, Xe);
	if (!(a > 0) || !Number.isFinite(a)) return null;
	let o = e - i * Z, s = t + i * Z;
	e >= 0 && (e === 0 || t > Q * e) && (o = 0), t <= 0 && (t === 0 || Math.abs(e) > Q * Math.abs(t)) && (s = 0);
	let c = n ?? Math.floor(o / a) * a, l = r ?? Math.ceil(s / a) * a;
	return ![c, l].every(Number.isFinite) || !(l > c) ? null : {
		min: c,
		max: l,
		majorUnit: a
	};
}
function Qe(e, r, i, a, s) {
	let u = 3 * a, d = r.chartexBox;
	if (!d || d.categories.length === 0 || d.series.length === 0) return;
	let { x: g, y: v, w: y, h: b } = i;
	if (Le(e, i, t(d.series.map((e) => e.valuesByCategory), 1e4))) return;
	let x = () => {
		e.fillStyle = "#888", e.font = "12px sans-serif", e.textAlign = "center", e.textBaseline = "middle", e.fillText("(chart values out of range)", g + y / 2, v + b / 2);
	}, D = (e) => {
		let t = e.max - e.min, n = t / e.step;
		return Number.isFinite(e.min) && Number.isFinite(e.max) && Number.isFinite(e.step) && Number.isFinite(t) && Number.isFinite(n) && e.max > e.min && e.step > 0 && n <= 1e3 && e.min + e.step > e.min;
	}, k = Infinity, M = -Infinity;
	for (let e of d.series) for (let t of e.valuesByCategory) for (let e of t) Number.isFinite(e) && (e < k && (k = e), e > M && (M = e));
	if (!isFinite(k) || !isFinite(M)) return;
	if (!Number.isFinite(M - k)) {
		x();
		return;
	}
	let P = r.valAxisMajorUnit == null ? Ze(k, M, r.valMin, r.valMax) : null, I = P ? {
		...r,
		valMin: P.min,
		valMax: P.max,
		valAxisMajorUnit: P.majorUnit
	} : r, L = j(r, r.valAxisFontFace, "minor"), ne = p(r.valAxisFontSizeHpt, b, a), z = te(ne), ie = Oe(a), B = l({
		dataMin: k,
		dataMax: M,
		explicitMin: I.valMin,
		explicitMax: I.valMax,
		axisLenPt: b / a,
		majorUnit: I.valAxisMajorUnit
	});
	if (!D({
		min: B.min,
		max: B.max,
		step: B.majorUnit
	})) {
		x();
		return;
	}
	let ae = 0;
	if (!r.valAxisHidden) {
		let t = e.font;
		e.font = ye(ne, L, r.valAxisFontBold ?? !1, r.valAxisFontItalic ?? !1);
		let n = 0;
		for (let t of B.majorTicks) {
			let i = ge(r, t, !1);
			n = Math.max(n, _(e, i));
		}
		e.font = t, ae = n + z + S * a;
	}
	let ce = Ae(e, r, y, b, a), ue = p(r.catAxisFontSizeHpt, b, a), pe = p(r.valAxisFontSizeHpt, b, a), V = O(r, y, b, a), H = d.series.length, _e = d.series.map((e, t) => h(e, t)), be = d.series.map((e, t) => {
		let n = _e[t], i = e.color ?? U(r, n, H, e.chartexStyle), a = ke(r, e.name, Se(e, n) ?? e, r.chartexDataPointStyle, n, H, i, !0), o = Ce(r, e, n, H, i);
		return o.darkened && a.lineColor != null ? {
			...a,
			lineColor: o.line.color.replace(/^#/, "")
		} : a;
	}), xe = {
		...r,
		series: be
	}, Te = Be(e, xe, y, b, a), { legRightW: De, legLeftW: je, legTopH: Pe, legBottomH: Ie } = se(Te, r.legendOverlay === !0), ze = r.valAxisHidden ? 0 : ee(B.majorTicks.map((e) => ge(r, e, !1)), ve(ne)) / 2, He = r.catAxisHidden ? 0 : ee(d.categories, ve(ue)), Ge = N(r, g, v, y, b, a, {
		titleBand: ce,
		legendReserve: Te,
		pad: {
			t: ce.bandH + Pe + pe / 2 + 2 + ze,
			r: De + y * .02,
			b: Ie + V.catBandH + (r.catAxisHidden ? b * .02 : de(ue) + He),
			l: je + V.valBandW + (r.valAxisHidden ? y * .02 : ae)
		},
		honorPlotAreaManualLayout: !0
	}), { px0: W, py0: G, pw: Ke, ph: K } = Ge.plotRect;
	if (Ke <= 0 || K <= 0) {
		Ve(e, r, g, v, y, b, v + Ge.title.topPad, Ge.title.fontPx);
		return;
	}
	he(e, r, W, G, Ke, K, a, s);
	let qe = d.categories, Je = qe.length, Ye = oe(I, k, M, K / a);
	if (!D(Ye)) {
		x();
		return;
	}
	Ve(e, r, g, v, y, b, v + Ge.title.topPad, Ge.title.fontPx);
	let { min: q, max: J } = Ye, Y = J - q, X = (e) => G + K * (1 - (e - q) / Y), Xe = E(r.valAxisLineColor, r.valAxisLineWidthEmu, a), Z = le(r, a);
	if (e.save(), !r.valAxisHidden) {
		if (e.font = ye(ne, L, r.valAxisFontBold ?? !1, r.valAxisFontItalic ?? !1), e.textAlign = "right", e.textBaseline = "middle", r.valAxisMinorGridlines) {
			let t = me(r, a);
			for (let n of Ye.minorLines) re(e, W, Ke, X(n), !1, t);
		}
		for (let t of Ye.majorLines) {
			let n = X(t);
			if (r.valAxisMajorGridlines !== !1) {
				e.strokeStyle = Z.color, e.lineWidth = Z.width;
				let t = Z.dash.length > 0 && e.getLineDash ? e.getLineDash() : [];
				Z.dash.length > 0 && e.setLineDash(Z.dash), e.beginPath(), e.moveTo(W, n), e.lineTo(W + Ke, n), e.stroke(), Z.dash.length > 0 && e.setLineDash(t);
			}
			e.fillStyle = r.valAxisFontColor ? `#${r.valAxisFontColor}` : "#595959", A(e, ge(r, t, !1), W - ie, n, ve(ne)), o(e, r.valAxisMajorTickMark, "val", W, n, Xe.color, Xe.width, !1, r.valAxisLineHidden, "major", a, r.valAxisLineDash);
		}
		for (let t of Ye.minorTicks) o(e, r.valAxisMinorTickMark, "val", W, X(t), Xe.color, Xe.width, !1, r.valAxisLineHidden, "minor", a, r.valAxisLineDash);
		r.valAxisLineHidden || fe(e, W, G, W, G + K, Xe.color, Xe.width, r.valAxisLineDash);
	}
	let Q = E(r.catAxisLineColor, r.catAxisLineWidthEmu, a);
	!r.catAxisHidden && !r.catAxisLineHidden && fe(e, W, G + K, W + Ke, G + K, Q.color, Q.width, r.catAxisLineDash);
	let Qe = Ke / Je, $e = n(r.barGapWidth, "chartex"), et = (e) => `#${d.series[e].color ?? U(r, _e[e], H, d.series[e].chartexStyle)}`, tt = (e) => Ue(r, _e[e], H, d.series[e].chartexStyle, d.series[e].color), $ = d.series.map((e) => e.valuesByCategory.map((t) => F(t, e.quartileMethod))), nt = r.chartStyleMarkerSymbol ?? r.chartexMarkerSymbol ?? "circle", rt = d.series.map((e, t) => nt === "none" ? $[t].map(() => []) : f($[t], e.showNonoutliers, e.showOutliers, X, 3 * a)), it = (e, t) => {
		let n = T(W, Ke, d.oneBoxPerSeries ? 1 : Je, H, d.oneBoxPerSeries ? 0 : e, t, $e);
		return n ? {
			bx: n.boxX,
			boxW: n.boxWidth,
			cx: n.centerX
		} : {
			bx: W,
			boxW: 0,
			cx: W
		};
	}, at = (t, n) => {
		let i = d.series[t], o = $[t][n];
		if (!o) return;
		let { bx: l, boxW: f, cx: p } = it(n, t), h = et(t), g = tt(t), _ = r.chartexDataPointStyle, v = r.chartexDataPointMarkerStyle ?? _, y = _e[t], b = Se(i, y) ?? i, x = We(r, _, "line", y, H), S = b.lineColor ? `#${b.lineColor}` : x ? `#${x}` : h, C = Ce(r, i, y, H, S).line, T = We(r, v, "fill", y, H), E = Ee(r, y, H, i.chartexStyle, i.color, v), D = Fe(r, v, b, y, H, We(r, v, "line", y, H) ?? S, { linkedNoStyleFallback: !0 }), O = c(i.chartexStyle), k = X(o.q1), A = X(o.q3), j = Math.min(k, A), M = Math.max(1, Math.abs(k - A)), N = f * .4;
		if (Ne(e, C, a)) {
			let t = X(o.whiskerHi), n = X(o.whiskerLo);
			e.beginPath(), o.whiskerHi > o.q3 && (e.moveTo(p, t), e.lineTo(p, A)), o.whiskerLo < o.q1 && (e.moveTo(p, k), e.lineTo(p, n)), o.whiskerHi >= o.q3 && (e.moveTo(p - N / 2, t), e.lineTo(p + N / 2, t)), o.whiskerLo <= o.q1 && (e.moveTo(p - N / 2, n), e.lineTo(p + N / 2, n)), e.stroke();
		}
		m(e, i.chartexStyle, _, y, {
			x: l,
			y: j,
			w: f,
			h: M
		}, a, (e) => {
			if (g && we(e, g, {
				x: l,
				y: j,
				w: f,
				h: M
			}, h, a, s), Ne(e, C, a, {
				x: l,
				y: j,
				w: f,
				h: M
			}, s)) {
				let t = e.lineWidth;
				e.strokeRect(l + t / 2, j + t / 2, f - t, M - t);
			}
		});
		let P = X(o.median);
		Ne(e, C, a) && (e.beginPath(), e.moveTo(l, P), e.lineTo(l + f, P), e.stroke());
		for (let r of rt[t][n]) Re(e, p, X(r), nt, 3, E ? T ? `#${T}` : h : "transparent", D.visible ? D.color : null, a, D.widthEmu == null ? 1 : w(D.widthEmu, a), E, s, D.visible ? D.paint : null, D.dash, D.customDash, D.cap, D.join, !1, O, v, y, y);
		if (i.meanMarker) {
			let t = X(o.mean), n = u;
			Ne(e, C, a) && (e.beginPath(), e.moveTo(p - n, t - n), e.lineTo(p + n, t + n), e.moveTo(p + n, t - n), e.lineTo(p - n, t + n), e.stroke());
		}
	}, ot = (t) => {
		let n = d.series[t];
		if (!n.meanLine) return;
		let i = Ce(r, n, _e[t], H, et(t)).line;
		if (e.save(), Ne(e, i, a)) {
			let n = !1;
			e.beginPath();
			for (let r = 0; r < Je; r++) {
				let i = $[t][r];
				if (!i) {
					n = !1;
					continue;
				}
				let { cx: a } = it(r, t), o = X(i.mean);
				n ? e.lineTo(a, o) : e.moveTo(a, o), n = !0;
			}
			e.stroke();
		}
		e.restore();
	};
	for (let e = 0; e < H; e++) {
		for (let t = 0; t < Je; t++) at(e, t);
		ot(e);
	}
	let st = p(r.catAxisFontSizeHpt, b, a), ct = R(st);
	for (let t = 0; t < Je; t++) {
		let n = W + Qe * (t + .5);
		if (r.catAxisHidden || o(e, r.catAxisMajorTickMark, "cat", G + K, n, Q.color, Q.width, !1, r.catAxisLineHidden, "major", a, r.catAxisLineDash), !r.catAxisHidden) {
			e.font = ye(st, j(r, r.catAxisFontFace, "minor"), r.catAxisFontBold ?? !1, r.catAxisFontItalic ?? !1), e.fillStyle = r.catAxisFontColor ? `#${r.catAxisFontColor}` : "#595959", e.textAlign = "center", e.textBaseline = "top";
			let i = qe[t];
			A(e, i, n, G + K + ct, ve(st));
		}
	}
	e.restore(), C(e, r, g, v, y, b, W, G, Ke, K, je, Ie, V.catFontPx, V.valFontPx), Me(e, xe, Te, g, v, y, b, W, G, Ke, K, ce.bandH + 2, a, d.series.map((e, t) => tt(t)), s);
}
var $e = .18;
function et(e, t, n, r, o) {
	let s = t.chartexSunburst;
	if (!s || s.rows.length === 0) return;
	let { x: l, y: f, w: p, h } = n;
	if (d(s.rows)) {
		Le(e, n, z + 1);
		return;
	}
	let g = u(s.rows);
	if (g.layoutWeight <= 0 || g.children.length === 0) return;
	let _ = t.series[0], v = be(_?.dataLabelOverrides), y = g.children.map((e, n) => Ue(t, n, g.children.length, _?.chartexStyle, _?.color)), b = P(t, {
		chartType: "clusteredBar",
		series: g.children.map((e) => {
			let n = U(t, e.branchIndex, g.children.length, _?.chartexStyle);
			return ke(t, e.label, _, t.chartexDataPointStyle, e.branchIndex, g.children.length, n, !1, !1);
		})
	}), x = Be(e, b, p, h, r), S = N(t, l, f, p, h, r, {
		titleTopPadFrac: .035,
		titleBottomPadFrac: .035,
		legendReserve: x,
		radialGapFrac: .02,
		honorPlotAreaManualLayout: !0
	});
	Ve(e, t, l, f, p, h, f + S.title.topPad, S.title.fontPx);
	let { px0: C, py0: w, pw: T, ph: E } = S.plotRect;
	if (!(T > 0) || !(E > 0)) return;
	he(e, t, C, w, T, E, r, o);
	let D = C + T / 2, O = w + E / 2, k = Math.min(T, E) * .46;
	g.a0 = -Math.PI / 2, g.a1 = -Math.PI / 2 + Math.PI * 2, i(g);
	let A = a(g) + 1, M = k * $e, F = (k - M) / A, I = (e) => `#${U(t, e, g.children.length, _?.chartexStyle)}`, ee = be(_?.dataPointOverrides), L = _?.seriesDataLabels, te = j(t, L?.fontFace ?? t.dataLabelFontFace, "minor"), R = B(L?.fontSizeHpt, r) ?? Math.max(7, Math.min(13, k * .075)), re = L?.fontColor ? `#${L.fontColor}` : "#ffffff", ie = Array.from({ length: A }, () => []), ae = [g];
	for (; ae.length > 0;) {
		let e = ae.pop();
		e.depth >= 0 && ie[e.depth].push(e);
		for (let t = e.children.length - 1; t >= 0; t--) ae.push(e.children[t]);
	}
	e.save();
	for (let n = 0; n < A; n++) {
		let i = M + n * F, a = i + F;
		for (let s of ie[n]) {
			let n = s.a1 - s.a0;
			if (n <= 1e-4) continue;
			let u = ee.get(s.labelIndex), d = Ie(t, _, u, s.branchIndex, g.children.length), y = xe(t, _, u, s.branchIndex, g.children.length, "#ffffff"), b = {
				x: D - a,
				y: O - a,
				w: a * 2,
				h: a * 2
			};
			m(e, c(u?.chartexStyle, _?.chartexStyle), t.chartexDataPointStyle, _?.chartexFormatIdx ?? 0, b, r, (e) => {
				e.beginPath(), e.arc(D, O, a, s.a0, s.a1), e.arc(D, O, i, s.a1, s.a0, !0), e.closePath(), d && De(e, d, b, I(s.branchIndex), r, o), Ne(e, y, r, b, o) && e.stroke();
			}, s.branchIndex);
			let x = ne(t, _, s.labelIndex, s.label, s.value, {
				visible: !1,
				showVal: !1,
				showCatName: !1
			}, v);
			if (!x) continue;
			let S = x.text, k = B(x.fontSizeHpt, r) ?? R, A = x.fontColor ? `#${x.fontColor}` : re, M = x.fontFace ? j(t, x.fontFace, "minor") : te, N = (s.a0 + s.a1) / 2, P = (i + a) / 2, L = F - 4, z = n * P;
			if (!x.manualLayout && L < k * .9 && z < k * .9) continue;
			let ie = D + Math.cos(N) * P, ae = O + Math.sin(N) * P;
			if (e.font = `${x.textStyle.fontItalic ? "italic " : ""}${x.fontBold ? "bold " : ""}${k}px ${M}`, x.manualLayout) {
				He(e, S, {
					kind: "point",
					x: ie,
					y: ae,
					position: x.position ?? "ctr"
				}, {
					x: C,
					y: w,
					w: T,
					h: E
				}, k, A, x.manualLayout, {
					x: l,
					y: f,
					w: p,
					h
				}, je(t, x.richRuns, r, M, x.fontBold ?? !1, x.textStyle), void 0, x.textStyle, r, x.labelBox, o);
				continue;
			}
			e.save(), e.translate(ie, ae);
			let oe = N, se = oe * 180 / Math.PI % 360;
			(se > 90 || se < -90) && (oe += Math.PI), e.rotate(oe), e.font = `${x.textStyle.fontItalic ? "italic " : ""}${x.fontBold ? "bold " : ""}${k}px ${M}`, He(e, S, {
				kind: "point",
				x: 0,
				y: 0,
				position: x.position ?? "ctr"
			}, {
				x: -L / 2,
				y: -z / 2,
				w: L,
				h: z
			}, k, A, void 0, {
				x: -L / 2,
				y: -z / 2,
				w: L,
				h: z
			}, je(t, x.richRuns, r, M, x.fontBold ?? !1, x.textStyle), void 0, x.textStyle, r, x.labelBox, o), e.restore();
		}
	}
	e.restore(), Me(e, b, x, l, f, p, h, C, w, T, E, S.title.bandH + 2, r, y, o);
}
function tt(e, t) {
	let n = e.map((e, t) => ({
		node: e,
		index: t,
		value: e.layoutWeight
	})).filter((e) => e.value > 0).sort((e, t) => t.value - e.value || e.index - t.index), r = n.reduce((e, t) => e + t.value, 0);
	if (r <= 0 || t.w <= 0 || t.h <= 0) return [];
	let i = t.w * t.h / r, a = n.map((e) => ({
		...e,
		area: e.value * i
	})), o = [], s = { ...t }, c = [], l = 0, u = Infinity, d = 0, f = (e, t, n, r) => {
		if (e <= 0 || t <= 0 || r <= 0) return Infinity;
		let i = r * r;
		return Math.max(i * n / (e * e), e * e / (i * t));
	}, p = (e, t) => {
		if (e.length !== 0) if (s.w >= s.h) {
			let n = s.h > 0 ? t / s.h : 0, r = s.y;
			for (let t = 0; t < e.length; t++) {
				let i = t === e.length - 1 ? s.y + s.h - r : e[t].area / n;
				o.push({
					node: e[t].node,
					rect: {
						x: s.x,
						y: r,
						w: n,
						h: i
					}
				}), r += i;
			}
			s = {
				x: s.x + n,
				y: s.y,
				w: Math.max(0, s.w - n),
				h: s.h
			};
		} else {
			let n = s.w > 0 ? t / s.w : 0, r = s.x;
			for (let t = 0; t < e.length; t++) {
				let i = t === e.length - 1 ? s.x + s.w - r : e[t].area / n;
				o.push({
					node: e[t].node,
					rect: {
						x: r,
						y: s.y,
						w: i,
						h: n
					}
				}), r += i;
			}
			s = {
				x: s.x,
				y: s.y + n,
				w: s.w,
				h: Math.max(0, s.h - n)
			};
		}
	}, m = 0;
	for (; m < a.length;) {
		let e = a[m], t = Math.min(s.w, s.h), n = l + e.area, r = Math.min(u, e.area), i = Math.max(d, e.area);
		c.length === 0 || f(n, r, i, t) <= f(l, u, d, t) ? (c.push(e), l = n, u = r, d = i, m++) : (p(c, l), c = [], l = 0, u = Infinity, d = 0);
	}
	return p(c, l), o;
}
function $(e, t, n, r, i) {
	let a = t.chartexTreemap;
	if (!a || a.rows.length === 0) return;
	if (d(a.rows)) {
		Le(e, n, z + 1);
		return;
	}
	let o = u(a.rows, !0);
	if (o.layoutWeight <= 0 || o.children.length === 0) return;
	let s = t.series[0], l = o.children.map((e) => Ue(t, e.branchIndex, o.children.length, s?.chartexStyle, s?.color)), f = P(t, {
		chartType: "clusteredBar",
		series: o.children.map((e) => {
			let n = U(t, e.branchIndex, o.children.length, s?.chartexStyle);
			return ke(t, e.label, s, t.chartexDataPointStyle, e.branchIndex, o.children.length, n);
		})
	}), p = Be(e, f, n.w, n.h, r), h = N(t, n.x, n.y, n.w, n.h, r, {
		titleTopPadFrac: .035,
		titleBottomPadFrac: .035,
		legendReserve: p,
		radialGapFrac: .015,
		honorPlotAreaManualLayout: !0
	});
	Ve(e, t, n.x, n.y, n.w, n.h, n.y + h.title.topPad, h.title.fontPx);
	let { px0: g, py0: _, pw: v, ph: y } = h.plotRect;
	if (!(v > 0) || !(y > 0)) return;
	he(e, t, g, _, v, y, r, i);
	let b = {
		x: g,
		y: _,
		w: v,
		h: y
	}, x = a.parentLabelLayout ?? "overlapping", S = t.series[0]?.seriesDataLabels, C = j(t, S?.fontFace ?? t.dataLabelFontFace, "minor"), w = B(S?.fontSizeHpt, r) ?? Math.max(8, Math.min(13, h.plotRect.ph * .025)), T = S?.fontColor ? `#${S.fontColor}` : "#ffffff", E = new Map((t.series[0]?.dataLabelOverrides ?? []).map((e) => [e.idx, e])), D = t.chartBg ? t.chartBg.startsWith("#") ? t.chartBg : `#${t.chartBg}` : "#ffffff", O = be(s?.dataPointOverrides), k = (a, l) => {
		if (l.w < .5 || l.h < .5) return;
		let u = `#${U(t, a.branchIndex, o.children.length, s?.chartexStyle)}`, d = O.get(a.labelIndex), f = Ie(t, s, d, a.branchIndex, o.children.length), p = c(d?.chartexStyle, s?.chartexStyle), h = E.get(a.labelIndex), g = h?.fontColor ? `#${h.fontColor}` : T, _ = B(h?.fontSizeHpt, r) ?? w, v = h?.fontBold ?? S?.fontBold ?? !1;
		if (a.children.length > 0) {
			let o = ne(t, s, a.labelIndex, a.label, a.value, {
				visible: x !== "none",
				showVal: !1,
				showCatName: !0
			}, E, !0), c = o != null && (x !== "overlapping" || a.depth === 0), d = _, y = o?.fontFace ? j(t, o.fontFace, "minor") : C, S = x === "banner" && c ? Math.min(l.h * .28, d + 7) : 0;
			S > 0 && m(e, p, t.chartexDataPointStyle, s?.chartexFormatIdx ?? 0, {
				x: l.x,
				y: l.y,
				w: l.w,
				h: S
			}, r, (e) => {
				f && we(e, f, {
					x: l.x,
					y: l.y,
					w: l.w,
					h: S
				}, u, r, i);
			}, a.branchIndex);
			let w = {
				x: l.x,
				y: l.y + S,
				w: l.w,
				h: Math.max(0, l.h - S)
			};
			for (let e of tt(a.children, w)) k(e.node, e.rect);
			if (c && (o.manualLayout || l.w > d * 2 && l.h > d + 4)) {
				e.font = `${v ? "bold " : ""}${d}px ${y}`;
				let a = S > 0 ? {
					x: l.x,
					y: l.y,
					w: l.w,
					h: S
				} : l, s = h?.position ?? "inBase";
				He(e, o.text, o.manualLayout ? {
					kind: "point",
					x: l.x + l.w / 2,
					y: l.y + l.h / 2,
					position: s
				} : {
					kind: "box",
					rect: a,
					position: s
				}, o.manualLayout ? b : a, d, g, o.manualLayout, n, je(t, o.richRuns, r, y, v, o.textStyle), void 0, o.textStyle, r, o.labelBox, i);
			}
			return;
		}
		m(e, p, t.chartexDataPointStyle, s?.chartexFormatIdx ?? 0, l, r, (e) => {
			f && we(e, f, l, u, r, i), Ne(e, xe(t, s, d, a.branchIndex, o.children.length, D, t.chartexDataPointStyle, { linkedNoStyleFallback: !0 }), r, l, i) && e.strokeRect(l.x, l.y, l.w, l.h);
		}, a.branchIndex);
		let y = ne(t, s, a.labelIndex, a.label, a.value, {
			visible: !1,
			showVal: !1,
			showCatName: !1
		}, E);
		if (!y) return;
		let A = B(y.fontSizeHpt, r) ?? _;
		if (!y.manualLayout && (l.w <= A * 1.2 || l.h <= A * 1.2)) return;
		let M = y.fontFace ? j(t, y.fontFace, "minor") : C;
		e.font = `${y.fontBold ? "bold " : ""}${A}px ${M}`;
		let N = l, P = y.position === "outEnd" ? "inEnd" : y.position ?? "ctr";
		He(e, y.text, y.manualLayout ? {
			kind: "point",
			x: l.x + l.w / 2,
			y: l.y + l.h / 2,
			position: P
		} : {
			kind: "box",
			rect: N,
			position: P
		}, y.manualLayout ? b : N, A, y.fontColor ? `#${y.fontColor}` : g, y.manualLayout, n, je(t, y.richRuns, r, M, y.fontBold ?? !1, y.textStyle), void 0, y.textStyle, r, y.labelBox, i);
	};
	e.save(), e.beginPath(), e.rect(g, _, v, y), e.clip();
	for (let e of tt(o.children, {
		x: g,
		y: _,
		w: v,
		h: y
	})) k(e.node, e.rect);
	e.restore(), Me(e, f, p, n.x, n.y, n.w, n.h, g, _, v, y, h.title.bandH + 2, r, l, i);
}
function nt(e, t, n, r, i = 0) {
	let a = Ke(t, void 0, n, r), o = qe(t, n, r);
	if (a != null && a > 1048576 || o != null && o > 1048576 || a != null && o != null && a > 1048576 - o) return Le(e, n, z + 1), !0;
	if (t.chartexSuppressGeometry) {
		let i = Ae(e, t, n.w, n.h, r);
		return Ve(e, t, n.x, n.y, n.w, n.h, n.y + i.topPad, i.fontPx), !0;
	}
	switch (t.chartType) {
		case "waterfall": return Ye(e, t, n, r, i), !0;
		case "clusteredColumn": {
			let a = t.series.map((e, n) => n === 0 ? K(t, e, n, t.series.length) : e), o = t.chartexParetoSortDescending ? a.map((e) => v(e, t.categories, {
				sortDescending: !0,
				keepUnvaluedCategories: !0
			}).orderedSeries) : a, s = t.chartexShowUnpairedPercentageAxis && o[0] ? [{
				...o[0],
				name: "",
				values: [],
				seriesType: "line",
				useSecondaryAxis: !0,
				lineHidden: !0,
				showMarker: !1
			}] : [];
			return ze(e, P(t, {
				chartType: "clusteredBar",
				categories: o[0]?.categories ?? t.categories,
				series: [...o, ...s],
				secondaryValAxis: s.length > 0 ? Y(t) : t.secondaryValAxis
			}), n, r, { gapPolicy: "chartex" }, i), !0;
		}
		case "histogram": return Je(e, t, n, r, i), !0;
		case "funnel": return q(e, t, n, r, i), !0;
		case "paretoLine": return J(e, t, n, r, i), !0;
		case "pareto": return X(e, t, n, r, i), !0;
		case "boxWhisker": return Qe(e, t, n, r, i), !0;
		case "sunburst": return et(e, t, n, r, i), !0;
		case "treemap": return $(e, t, n, r, i), !0;
		default: return !1;
	}
}
var rt = G({ render: nt }, "chartEx");
export { rt as chartEx };
