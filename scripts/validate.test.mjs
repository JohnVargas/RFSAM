import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkControl, checkTool, checkCoverage } from './validate.mjs';

const registries = {
  bsamKeys: new Set(['BSAM-EN-01']),
  resourceIds: new Set(['RFSAM-RES-06']),
  toolSlugs: new Set(['btlejack']),
};

function base(overrides = {}) {
  return {
    data: {
      id: 'RFSAM-BLE-AT-01', protocol: 'BLE', layer: 'AT', criticality: 'high',
      title: 'Hijack', reviewStatus: 'stub', confidence: 'low',
      attacks: [], references: [], bsam: [], resources: [], tools: [],
      // The fixture is an AT-layer control, and an AT control that maps to no
      // ATT&CK/FiGHT technique must declare why. Without this the baseline stub
      // is not actually clean.
      threatMapNote: 'Fixture: no mapping asserted.',
      ...overrides.data,
    },
    body: overrides.body ?? '## Mechanism\n\nx\n',
    file: 'rfsam-ble-at-01.md',
  };
}

test('a clean stub passes', () => {
  assert.deepEqual(checkControl(base(), registries), []);
});

test('id layer/protocol segment must match fields', () => {
  const errs = checkControl(base({ data: { layer: 'CR' } }), registries);
  assert.ok(errs.some((e) => /layer segment/i.test(e)));
});

test('attack refs must exist in references', () => {
  const errs = checkControl(base({ data: { attacks: [{ name: 'x', refs: ['ghost'], summary: 's' }] } }), registries);
  assert.ok(errs.some((e) => /unknown reference key 'ghost'/i.test(e)));
});

test('bsam, resource and tool refs must resolve', () => {
  const errs = checkControl(base({ data: { bsam: ['BSAM-XX-99'], resources: ['RFSAM-RES-99'], tools: ['ghosttool'] } }), registries);
  assert.equal(errs.filter((e) => /unknown/i.test(e)).length, 3);
});

test('verified controls need objective, a reference and zero open flags', () => {
  const errs = checkControl(base({
    data: { reviewStatus: 'verified', references: [] },
    body: '## Mechanism\n\n> [!FLAG] unsure\n',
  }), registries);
  assert.ok(errs.some((e) => /objective/i.test(e)));
  assert.ok(errs.some((e) => /at least one reference/i.test(e)));
  assert.ok(errs.some((e) => /unresolved \[!FLAG\]/i.test(e)));
});

// --- execution metadata ------------------------------------------------------

// A minimal valid block, so each test below changes exactly one thing.
const exec = (over = {}) => ({
  automatable: 'assisted',
  requires_tx: true,
  tx_steps: [2],
  tx_modes: ['injection'],
  legal_tier: 'T3',
  side_effects: ['none'],
  needs_physical: ['proximity'],
  containment: 'none',
  gates: { hardware_present: [], scope_mode_in: ['active', 'lab'], requires_root: false },
  basis: 'Step 2 injects into an existing link.',
  ...over,
});

test('a control with no execution block still passes (optional during migration)', () => {
  assert.deepEqual(checkControl(base(), registries), []);
});

test('a well-formed execution block passes', () => {
  assert.deepEqual(checkControl(base({ data: { execution: exec() } }), registries), []);
});

test('requires_tx without legal_tier fails', () => {
  const errs = checkControl(base({ data: { execution: exec({ legal_tier: undefined }) } }), registries);
  assert.ok(errs.some((e) => /no legal_tier/.test(e)));
});

test('requires_tx without tx_modes fails - say what it transmits', () => {
  const errs = checkControl(base({ data: { execution: exec({ tx_modes: [] }) } }), registries);
  assert.ok(errs.some((e) => /tx_modes is empty/.test(e)));
});

test('the tier must follow from the protocol band', () => {
  const errs = checkControl(base({ data: { execution: exec({ legal_tier: 'T2' }) } }), registries);
  assert.ok(errs.some((e) => /BLE is tier T3, control declares T2/.test(e)));
});

test('T1/T2 may not be gated to a mode other than lab', () => {
  const errs = checkControl(base({
    data: { protocol: 'GNSS', id: 'RFSAM-GNSS-AT-01', execution: exec({ legal_tier: 'T1' }) },
  }), registries);
  assert.ok(errs.some((e) => /may only be gated to mode 'lab'/.test(e)));
});

test('jamming must be gated to lab even at T3', () => {
  const errs = checkControl(base({ data: { execution: exec({ tx_modes: ['jamming'] }) } }), registries);
  assert.ok(errs.some((e) => /'jamming' - gate it to 'lab' only/.test(e)));
});

test('auto with needs_physical fails', () => {
  const errs = checkControl(base({ data: { execution: exec({ automatable: 'auto' }) } }), registries);
  assert.ok(errs.some((e) => /auto but needs_physical is non-empty/.test(e)));
});

test('manual with an empty needs_physical fails', () => {
  const errs = checkControl(base({
    data: { execution: exec({ automatable: 'manual', needs_physical: [] }) },
  }), registries);
  assert.ok(errs.some((e) => /manual with an empty needs_physical/.test(e)));
});

test('a gate on a tool absent from tools[] fails', () => {
  const errs = checkControl(base({
    data: { tools: [], execution: exec({ gates: { hardware_present: ['btlejack'], scope_mode_in: ['lab'] } }) },
  }), registries);
  assert.ok(errs.some((e) => /is not listed in tools\[\]/.test(e)));
});

test('side effects are incompatible with observational mode', () => {
  const errs = checkControl(base({
    data: { execution: exec({ side_effects: ['actuates'], requires_tx: false, tx_modes: [], tx_steps: [], legal_tier: undefined, gates: { hardware_present: [], scope_mode_in: ['observational'] } }) },
  }), registries);
  assert.ok(errs.some((e) => /incompatible with mode 'observational'/.test(e)));
});

// The rule that justifies the whole block: the procedure contradicting the field.
// This is the incident, as a unit test.
test('requires_tx: false is refused when the procedure runs a transmitting command', () => {
  const errs = checkControl(base({
    body: '## Procedure\n\n```bash\nbluetoothctl scan on\n```\n',
    data: {
      execution: exec({
        requires_tx: false, tx_modes: [], tx_steps: [], legal_tier: undefined,
        gates: { hardware_present: [], scope_mode_in: ['observational', 'active'] },
      }),
    },
  }), registries);
  assert.ok(errs.some((e) => /runs 'bluetoothctl', which transmits/.test(e)));
});

function tool(data = {}) {
  return { data: { slug: 'btlejack', name: 'Btlejack', type: 'software', ...data }, file: 'btlejack.md' };
}
const assessed = {
  status: 'mature', statusNote: 'Frozen but still works.',
  statusSource: 'https://example.org/source', statusChecked: '2026-09-23',
};

test('a tool with no lifecycle status passes', () => {
  assert.deepEqual(checkTool(tool(), registries), []);
});

test('a fully assessed tool passes', () => {
  assert.deepEqual(checkTool(tool(assessed), registries), []);
});

test('a status needs its note, its source and the date it was checked', () => {
  for (const k of ['statusNote', 'statusSource', 'statusChecked']) {
    const errs = checkTool(tool({ ...assessed, [k]: undefined }), registries);
    assert.equal(errs.length, 1, k);
    assert.match(errs[0], new RegExp(k));
  }
});

test('an active tool needs no note but still needs source and date', () => {
  assert.deepEqual(checkTool(tool({ ...assessed, status: 'active', statusNote: undefined }), registries), []);
});

test('an unknown status is rejected', () => {
  assert.match(checkTool(tool({ ...assessed, status: 'dead' }), registries)[0], /invalid status/);
});

test('a successor must resolve and is only accepted with eol or stale', () => {
  assert.match(checkTool(tool({ ...assessed, status: 'eol', successor: 'nope' }), registries)[0], /unknown successor/);
  assert.match(checkTool(tool({ ...assessed, successor: 'btlejack' }), registries)[0], /only meaningful with status/);
  assert.deepEqual(checkTool(tool({ ...assessed, status: 'eol', successor: 'btlejack' }), registries), []);
  assert.deepEqual(checkTool(tool({ ...assessed, status: 'stale', successor: 'btlejack' }), registries), []);
});

test('lifecycle fields without a status are rejected', () => {
  assert.match(checkTool(tool({ statusNote: 'x' }), registries)[0], /status is not/);
});

test('coverage map and control files must agree', () => {
  const map = [{ id: 'BLE', controls: [
    { id: 'RFSAM-BLE-SP-01', status: 'existing' },
    { id: 'RFSAM-BLE-AT-02', status: 'planned' },
  ] }];
  assert.deepEqual(checkCoverage(map, new Set(['RFSAM-BLE-SP-01'])), []);
  assert.match(checkCoverage(map, new Set())[0], /'existing' but has no control file/);
  assert.match(checkCoverage(map, new Set(['RFSAM-BLE-SP-01', 'RFSAM-BLE-AT-02']))[0], /a control file exists/);
  assert.match(checkCoverage(map, new Set(['RFSAM-BLE-SP-01', 'RFSAM-BLE-LL-09']))[0], /is not listed/);
});
