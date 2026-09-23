import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { parseControlId, CRITICALITY_IDS, TIER_BY_PROTOCOL, TOOL_STATUSES } from '../src/lib/taxonomy.js';


// Commands in the corpus that transmit. A superset of the TX re-check list in
// Skill/SKILL.md, which is purely injection-oriented and therefore does not catch
// `bluetoothctl connect`, `hf mf info` or `lf search` - all of which emit.
const TX_COMMAND_RE = new RegExp([
  // injection / rogue infrastructure
  'hackrf_transfer\\s+-t', 'gps-sdr-sim', 'hostapd', 'eaphammer', 'wifiphisher', 'mdk4',
  'btlejack', 'esp32-marauder', 'setModeTX', 'RFxmit', 'aireplay-ng', 'zbstumbler',
  'hf\\s+mf\\s+sim', '--transmit',
  // connection-oriented and interrogation - what the list was missing
  'bluetoothctl', 'rfcomm\\s+connect', 'l2ping', 'sdptool\\s+browse', 'obexftp',
  'BleakClient', 'gatttool', 'hcitool\\s+(cc|lecc)', 'hcxdumptool', 'reaver',
  'ble\\.recon', 'chip-tool\\s+pairing',
  'hf\\s+mf\\s+(info|chk|autopwn|darkside|hardnested|dump)', 'lf\\s+search', 'hf\\s+search',
].join('|'));

export function checkExecution({ data, body, file }, reg) {
  const errs = [];
  const tag = `${file}: `;
  if (!data.execution) return errs; // optional during migration
  // gray-matter hands us the raw YAML, so Zod's .default() has not run here:
  // normalise before asserting, or an absent optional field reads as undefined.
  const x = {
    tx_steps: [], tx_modes: [], side_effects: ['none'], needs_physical: [],
    containment: 'none', ...data.execution,
  };
  x.gates = { hardware_present: [], scope_mode_in: [], requires_root: false, ...(x.gates ?? {}) };
  if (!x.gates.scope_mode_in.length) errs.push(`${tag}execution.gates.scope_mode_in is required`);
  if (!x.basis?.trim()) errs.push(`${tag}execution.basis is required - name the step that justifies the block`);

  // TX implies a tier and at least one declared mode.
  if (x.requires_tx) {
    if (!x.legal_tier) errs.push(`${tag}execution.requires_tx is true but no legal_tier`);
    if (!x.tx_modes.length) errs.push(`${tag}execution.requires_tx is true but tx_modes is empty - say WHAT it transmits`);
    if (!x.tx_steps.length) errs.push(`${tag}execution.requires_tx is true but tx_steps is empty - say WHICH steps emit`);
  } else {
    if (x.legal_tier) errs.push(`${tag}execution.legal_tier set on a control that declares requires_tx: false`);
    if (x.tx_modes.length) errs.push(`${tag}execution.tx_modes non-empty with requires_tx: false`);
    if (x.tx_steps.length) errs.push(`${tag}execution.tx_steps non-empty with requires_tx: false`);
  }

  // The tier is not an opinion: it follows from the protocol's band.
  if (x.requires_tx && x.legal_tier) {
    const expect = TIER_BY_PROTOCOL[data.protocol];
    if (expect && x.legal_tier !== expect) {
      errs.push(`${tag}protocol ${data.protocol} is tier ${expect}, control declares ${x.legal_tier}`);
    }
  }

  // NOTE ON WHAT THIS VALIDATOR DOES NOT DO.
  // It checks that a control is complete and internally coherent. It does not
  // decide whether running it is lawful, and it must not: the same LTE jammer is
  // an offence for a contracted auditor and a compliance measurement for the
  // regulator that owns the band. Legality turns on mandate and jurisdiction,
  // which are properties of the engagement, not of the method. A methodology that
  // refuses to document a technique because it is unlawful *somewhere* stops being
  // a methodology. So the corpus states requirements; the SoA decides
  // applicability; the runner enforces the SoA.

  // Restricted-band transmission and jamming must SAY what authority they need.
  // This is a completeness rule, not a permission rule: the control is required to
  // declare the requirement, never to satisfy it.
  const restricted = ['T1', 'T2'].includes(x.legal_tier) || x.tx_modes.includes('jamming');
  if (restricted && !x.basis?.trim()) {
    errs.push(`${tag}restricted-band or jamming control must state in basis what authority it requires`);
  }

  // `auto` has to be genuinely runnable.
  if (x.automatable === 'auto') {
    if (x.needs_physical.length) errs.push(`${tag}automatable: auto but needs_physical is non-empty (${x.needs_physical.join(', ')})`);
    if (/\[FILL:/.test(body)) errs.push(`${tag}automatable: auto but the body still carries [FILL: ...] placeholders`);
  }
  if (x.automatable === 'manual' && !x.needs_physical.length) {
    errs.push(`${tag}automatable: manual with an empty needs_physical - say what a machine cannot do`);
  }

  // Gates must resolve against the tool registry and against the control's own tools[].
  for (const slug of x.gates.hardware_present) {
    if (!reg.toolSlugs.has(slug)) errs.push(`${tag}execution.gates.hardware_present unknown tool slug '${slug}'`);
    else if (!(data.tools ?? []).includes(slug)) errs.push(`${tag}execution.gates.hardware_present '${slug}' is not listed in tools[]`);
  }

  // A control that does not transmit must be offerable in observational mode.
  if (!x.requires_tx && !x.gates.scope_mode_in.includes('observational')) {
    errs.push(`${tag}requires_tx: false but the control is not offered in observational mode`);
  }

  // Changing the target is incompatible with look-but-do-not-touch modes.
  const changes = x.side_effects.filter((e) => e !== 'none');
  if (changes.length) {
    for (const m of ['observational', 'defensive']) {
      if (x.gates.scope_mode_in.includes(m)) {
        errs.push(`${tag}side_effects [${changes.join(', ')}] incompatible with mode '${m}'`);
      }
    }
  }

  // The rule that justifies the whole block: the body contradicting the field.
  // Every other rule validates the assertion against itself; this one reads the
  // procedure. It is the antidote to "the metadata lies".
  if (!x.requires_tx) {
    // Only look inside fenced command blocks. Searching the whole body matches
    // tool names in prose, reference keys and field-case citations - a control
    // that merely CITES btlejack's README does not run it.
    const commands = [...body.matchAll(/```(?:bash|sh|console|python)?\n([\s\S]*?)```/g)]
      .map((m) => m[1]).join('\n');
    const hit = commands.match(TX_COMMAND_RE);
    if (hit) errs.push(`${tag}requires_tx: false but the procedure runs '${hit[0]}', which transmits`);
  }

  // CR is offline by definition per the phase heading - flag the disagreement at
  // the control, since 6 of 10 CR controls actually transmit.
  if (data.layer === 'CR' && x.requires_tx && !x.basis) {
    errs.push(`${tag}CR-layer control declares requires_tx: true and must say why in basis`);
  }

  return errs;
}

export function checkControl({ data, body, file }, reg) {
  const errs = [];
  const tag = `${file}: `;
  const parsed = parseControlId(data.id);
  if (!parsed) {
    errs.push(`${tag}id '${data.id}' is not a valid RFSAM-<PROTO>-<LAYER>-<NN>`);
  } else {
    if (parsed.protocol !== data.protocol) errs.push(`${tag}id protocol segment '${parsed.protocol}' != protocol field '${data.protocol}'`);
    if (parsed.layer !== data.layer) errs.push(`${tag}id layer segment '${parsed.layer}' != layer field '${data.layer}'`);
  }
  if (!CRITICALITY_IDS.includes(data.criticality)) errs.push(`${tag}invalid criticality '${data.criticality}'`);
  if (!data.title?.trim()) errs.push(`${tag}empty title`);

  const refKeys = new Set((data.references ?? []).map((r) => r.key));
  for (const a of data.attacks ?? []) {
    for (const k of a.refs ?? []) {
      if (!refKeys.has(k)) errs.push(`${tag}attack '${a.name}' cites unknown reference key '${k}'`);
    }
  }
  for (const b of data.bsam ?? []) if (!reg.bsamKeys.has(b)) errs.push(`${tag}unknown BSAM id '${b}'`);
  for (const m of data.mitre ?? []) if (!reg.mitreIds.has(m.id)) errs.push(`${tag}unknown ATT&CK id '${m.id}'`);
  for (const g of data.fight ?? []) if (!reg.fightIds.has(g.id)) errs.push(`${tag}unknown FiGHT id '${g.id}'`);
  // An attack-layer control that maps to nothing must say why. Silence would read
  // as 'not done yet' when the honest answer is usually 'no corpus models this'.
  if (data.layer === 'AT' && !(data.mitre ?? []).length && !(data.fight ?? []).length && !data.threatMapNote?.trim()) {
    errs.push(`${tag}AT-layer control with no ATT&CK/FiGHT mapping needs a threatMapNote saying why`);
  }
  for (const r of data.resources ?? []) if (!reg.resourceIds.has(r)) errs.push(`${tag}unknown resource id '${r}'`);
  for (const t of data.tools ?? []) if (!reg.toolSlugs.has(t)) errs.push(`${tag}unknown tool slug '${t}'`);
  errs.push(...checkExecution({ data, body, file }, reg));

  if (['draft', 'reviewed', 'verified'].includes(data.reviewStatus)) {
    if (!data.objective?.trim()) errs.push(`${tag}${data.reviewStatus} control needs a non-empty objective`);
  }
  if (data.reviewStatus === 'reviewed' || data.reviewStatus === 'verified') {
    if (!(data.references ?? []).length) errs.push(`${tag}${data.reviewStatus} control needs at least one reference`);
    if (/\[!FLAG\]/.test(body)) errs.push(`${tag}${data.reviewStatus} control has unresolved [!FLAG] markers`);
  }
  return errs;
}

// Checks on one tool entry: software/successor slugs resolve, and a lifecycle
// status is never stated without its reason, its source and the date it was checked.
export function checkTool({ data, file }, reg) {
  const errs = [];
  const tag = `tools/${file}: `;
  for (const s of data.software ?? []) {
    if (!reg.toolSlugs.has(s)) errs.push(`${tag}unknown software slug '${s}'`);
  }
  if (data.successor && !reg.toolSlugs.has(data.successor)) {
    errs.push(`${tag}unknown successor slug '${data.successor}'`);
  }
  if (data.successor && !['eol', 'stale'].includes(data.status)) {
    errs.push(`${tag}successor is only meaningful with status 'eol' or 'stale'`);
  }
  if (data.status) {
    if (!TOOL_STATUSES.includes(data.status)) errs.push(`${tag}invalid status '${data.status}'`);
    if (data.status !== 'active' && !data.statusNote?.trim()) {
      errs.push(`${tag}status '${data.status}' needs a statusNote saying why`);
    }
    if (!data.statusSource) errs.push(`${tag}status '${data.status}' needs a statusSource url`);
    if (!data.statusChecked) errs.push(`${tag}status '${data.status}' needs a statusChecked date`);
  } else {
    for (const k of ['statusNote', 'statusSource', 'statusChecked']) {
      if (data[k]) errs.push(`${tag}${k} is set but status is not`);
    }
  }
  return errs;
}

// The coverage map and the controls directory must agree: an entry marked
// 'existing' has a control file, and every control file is listed in the map.
export function checkCoverage(coverageMap, controlIds) {
  const errs = [];
  const mapped = new Set();
  for (const p of coverageMap) {
    for (const c of p.controls ?? []) {
      mapped.add(c.id);
      const has = controlIds.has(c.id);
      if (c.status === 'existing' && !has) errs.push(`coverage-map: ${c.id} is 'existing' but has no control file`);
      if (c.status !== 'existing' && has) errs.push(`coverage-map: ${c.id} is '${c.status}' but a control file exists`);
    }
  }
  for (const id of controlIds) {
    if (!mapped.has(id)) errs.push(`coverage-map: control ${id} is not listed`);
  }
  return errs;
}

function idsFromDir(dir, field) {
  const out = new Set();
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const { data } = matter(readFileSync(join(dir, f), 'utf8'));
    out.add(field ? data[field] : f.replace(/\.md$/, ''));
  }
  return out;
}

export async function loadRegistries() {
  const { bsam } = await import('../src/data/bsam.js');
  const { mitre } = await import('../src/data/mitre.js');
  const { fight } = await import('../src/data/fight.js');
  return {
    bsamKeys: new Set(Object.keys(bsam)),
    mitreIds: new Set(Object.keys(mitre)),
    fightIds: new Set(Object.keys(fight)),
    resourceIds: idsFromDir('src/content/resources', 'id'),
    toolSlugs: idsFromDir('src/content/tools', null),
  };
}

export async function runValidation() {
  const reg = await loadRegistries();
  const dir = 'src/content/controls';
  const files = readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  const all = [];
  const controlIds = new Set();
  for (const f of files) {
    const { data, content } = matter(readFileSync(join(dir, f), 'utf8'));
    controlIds.add(data.id);
    all.push(...checkControl({ data, body: content, file: f }, reg));
  }
  const { coverageMap } = await import('../src/data/coverage-map.js');
  all.push(...checkCoverage(coverageMap, controlIds));

  // Toolchain integrity: every referenced tool slug must exist, and every
  // hardware tool's `software` slugs must exist.
  const { toolchains } = await import('../src/data/toolchains.js');
  for (const [proto, tc] of Object.entries(toolchains)) {
    for (const [layer, def] of Object.entries(tc.layers ?? {})) {
      if (def.decoder && !reg.toolSlugs.has(def.decoder)) all.push(`toolchains.${proto}.${layer}: unknown decoder slug '${def.decoder}'`);
      for (const t of def.tools ?? []) {
        if (!reg.toolSlugs.has(t.tool)) all.push(`toolchains.${proto}.${layer}: unknown tool slug '${t.tool}'`);
        for (const d of t.deps ?? []) {
          if (!reg.toolSlugs.has(d)) all.push(`toolchains.${proto}.${layer}: unknown dep slug '${d}' under '${t.tool}'`);
        }
      }
    }
  }
  for (const f of readdirSync('src/content/tools').filter((f) => f.endsWith('.md'))) {
    const { data } = matter(readFileSync(join('src/content/tools', f), 'utf8'));
    all.push(...checkTool({ data, file: f }, reg));
  }
  return all;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errs = await runValidation();
  if (errs.length) {
    console.error(`✖ ${errs.length} validation error(s):`);
    for (const e of errs) console.error('  - ' + e);
    process.exit(1);
  }
  console.log('✔ all controls valid');
}
