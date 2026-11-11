// FReader read-only PowerPoint build snapshots. No changes to source documents.
// p:timing / cTn / spTgt from ECMA-376 PresentationML.
const P = new Set([
  'http://schemas.openxmlformats.org/presentationml/2006/main',
  'http://purl.oclc.org/ooxml/presentationml/main',
]);
const MAX_XML = 8 * 1024 * 1024;
const MAX_EFFECTS = 4096;
const isP = (node, name) => node?.nodeType === 1 && P.has(node.namespaceURI) && node.localName === name;
const descendants = (node, name) => Array.from(node.getElementsByTagNameNS('*', name)).filter(n => isP(n, name));
const child = (node, name) => Array.from(node?.children || []).find(n => isP(n, name));
const ancestor = (node, predicate, stop) => {
  for (let current = node.parentElement; current && current !== stop; current = current.parentElement) {
    if (predicate(current)) return current;
  }
  return null;
};
export const STATIC_PLAN = Object.freeze({ initial: [], steps: [], supported: true });

export function parseAnimationSteps(xml, metadata) {
  if (xml.length > MAX_XML) return { ...STATIC_PLAN, supported: false };
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length || !isP(doc.documentElement, 'sld')) {
    return { ...STATIC_PLAN, supported: false };
  }
  const timing = child(doc.documentElement, 'timing');
  if (!timing) return STATIC_PLAN;
  const nodes = descendants(timing, 'cTn');
  if (nodes.length > MAX_EFFECTS * 12) return { ...STATIC_PLAN, supported: false };
  const main = nodes.find(n => n.getAttribute('nodeType') === 'mainSeq');
  // Shape-click triggers are independent interactive sequences. Do not let them
  // hide content that normal next/previous navigation cannot reveal.
  if (!main) return { ...STATIC_PLAN, supported: false };
  const known = new Set(metadata.elements.filter(e => e.origin === 'slide' && e.id != null).map(e => String(e.id)));
  const groups = new Map();
  const tree = child(child(doc.documentElement, 'cSld'), 'spTree');
  if (tree) for (const group of descendants(tree, 'grpSp')) {
    const own = child(child(group, 'nvGrpSpPr'), 'cNvPr')?.getAttribute('id');
    if (own) groups.set(own, descendants(group, 'cNvPr').map(n => n.getAttribute('id')).filter(id => known.has(id)));
  }
  const effects = descendants(main, 'cTn').filter(n => {
    if (!n.hasAttribute('presetClass')) return false;
    if (ancestor(n, a => isP(a, 'cTn') && (a.hasAttribute('presetClass') || a.getAttribute('nodeType') === 'interactiveSeq'), main)) return false;
    return true;
  });
  if (effects.length > MAX_EFFECTS) return { ...STATIC_PLAN, supported: false };
  const steps = [], initial = new Set(), first = new Set();
  let supported = true;
  for (const effect of effects) {
    const kind = effect.getAttribute('presetClass');
    if (kind !== 'entr' && kind !== 'exit') { supported = false; continue; }
    const targets = descendants(effect, 'spTgt');
    // Paragraph/word/chart-series builds need a different granularity. Keep
    // their content visible instead of incorrectly hiding the entire object.
    if (child(effect, 'iterate') || targets.some(t => t.children.length > 0)) { supported = false; continue; }
    const ids = new Set();
    for (const target of targets) {
      const id = target.getAttribute('spid');
      for (const expanded of groups.get(id) || [id]) if (known.has(expanded)) ids.add(expanded);
    }
    if (!ids.size) continue;
    for (const id of ids) if (!first.has(id)) {
      first.add(id);
      if (kind === 'entr') initial.add(id);
    }
    let trigger = effect.getAttribute('nodeType');
    if (!trigger) trigger = ancestor(effect, a => isP(a, 'cTn') && ['clickEffect', 'withEffect', 'afterEffect'].includes(a.getAttribute('nodeType')), main)?.getAttribute('nodeType');
    // "With previous" is simultaneous. Each subsequent/automatic effect is a
    // manual snapshot, so a later overlapping picture cannot skip its predecessor.
    if (trigger !== 'withEffect' || !steps.length) steps.push([]);
    steps[steps.length - 1].push({ ids: [...ids], visible: kind === 'entr' });
  }
  return { initial: [...initial], steps, supported };
}

export function hiddenAtStep(plan, step) {
  const hidden = new Set(plan.initial);
  for (let i = 0; i < Math.min(Math.max(0, step), plan.steps.length); i++) {
    for (const effect of plan.steps[i]) for (const id of effect.ids) {
      if (effect.visible) hidden.delete(id); else hidden.add(id);
    }
  }
  return hidden;
}

export class AnimationSteps {
  constructor(presentation, format) {
    this.presentation = presentation;
    this.format = format;
    this.cache = new Map();
    this.closed = false;
  }
  async get(index) {
    if (this.closed || this.format !== 'pptx') return STATIC_PLAN;
    if (this.cache.has(index)) return this.cache.get(index);
    const pending = this.read(index);
    this.cache.set(index, pending);
    // Only current/nearby plans are kept. Pictures remain managed by the engine.
    if (this.cache.size > 24) this.cache.delete(this.cache.keys().next().value);
    return pending;
  }
  async read(index) {
    try {
      const metadata = await this.presentation.getFReaderSlideMetadata(index);
      if (!metadata.partName || !/^\/?ppt\/slides\/[^/]+\.xml$/i.test(metadata.partName)) return STATIC_PLAN;
      const data = await this.presentation.getImage(metadata.partName, 'application/xml');
      if (this.closed) return STATIC_PLAN;
      if (data.size > MAX_XML) return { ...STATIC_PLAN, supported: false };
      return parseAnimationSteps(await data.text(), metadata);
    } catch (error) {
      // Parsing the document's optional timing must never blank a readable slide.
      if (!this.closed) console.warn('FReader: animation steps unavailable', String(error?.message || error).slice(0, 200));
      return { ...STATIC_PLAN, supported: false };
    }
  }
  close() { this.closed = true; this.cache.clear(); }
}
