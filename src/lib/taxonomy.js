export const LAYER_IDS = ['IG', 'SP', 'PHY', 'LL', 'CR', 'AT', 'AP'];
// Rank a layer by its position in the descent (IG=0 … AP=6), for ordering controls
// the way the methodology teaches them, rather than alphabetically by id.
export const layerRank = (id) => LAYER_IDS.indexOf(id);

export const PROTOCOL_IDS = [
  'BLE', 'BTC', 'WIFI', 'LORA', 'LTE', 'RFID', 'SUBG',
  'ZIGBEE', 'ZWAVE', 'THREAD', 'GNSS', 'ADSB', 'NR5G', 'GSM', 'UWB',
];

export const CRITICALITY_IDS = ['info', 'low', 'medium', 'high', 'critical'];
// stub → draft → reviewed → verified.
//   reviewed = citations & method confirmed, but the field case is still an
//              illustrative template (no real captured data).
//   verified = reviewed AND demonstrated with a real field case.
export const REVIEW_STATUSES = ['stub', 'draft', 'reviewed', 'verified'];
export const CONFIDENCE_LEVELS = ['low', 'medium', 'high'];

// --- Execution metadata -----------------------------------------------------
// What an engine needs to know BEFORE proposing a control. Every value here is a
// restatement of the control's own ## Procedure in machine-readable form; if the
// two disagree, the procedure is the truth and this block is the bug.

// How much of a control a machine can carry.
//   auto     = every step is a command with a verifiable expected output.
//   assisted = the engine emits the curated command, a person runs it and returns
//              the output. The row still exists in the report.
//   manual   = physical work, judgement or attestation; the engine can only schedule it.
export const AUTOMATABLE_LEVELS = ['auto', 'assisted', 'manual'];

// TX legal tiers (SKILL.md). The tier is a property of the BAND, not of intent:
// a benign transmission on licensed spectrum is still T2.
export const LEGAL_TIERS = ['T1', 'T2', 'T3', 'T4'];

// WHAT the control radiates. `requires_tx` says whether the antenna keys up; this
// says what it says when it does. An engagement authorises these separately:
// "you may talk to the lock as a phone would" is not "you may jam it".
export const TX_MODES = [
  'interrogation',        // active scan / probe request / inquiry / reader field
  'connection-oriented',  // ordinary client role: connect, read, write, in-protocol
  'pairing',              // bonding / key agreement, leaves state on the target
  'injection',            // crafted frames into an existing or third-party link
  'rogue-infrastructure', // impersonating an AP / base station / beacon / satellite
  'jamming',              // denial by emission
];

// What the control does TO the target, orthogonal to how it radiates.
export const SIDE_EFFECTS = ['none', 'actuates', 'persistent-state', 'dos'];

// Conditions an engine cannot satisfy by itself.
export const PHYSICAL_NEEDS = [
  'proximity', 'antenna-placement', 'device-access', 'teardown', 'conducted-rf', 'cage',
];

// RFSAM operating modes (SKILL.md, SCOPE AND LIMITS).
export const SCOPE_MODES = ['observational', 'active', 'lab', 'defensive'];

// The tier follows from the protocol's band. Stored on the control anyway so it is
// a cross-checkable assertion rather than an opinion, for the same reason validate.mjs
// cross-checks the id's protocol segment against the protocol field.
// NOTE: SKILL.md enumerates T3 as BLE/Wi-Fi/LoRa/sub-GHz/Zigbee/Z-Wave/Thread and
// omits BTC and RFID, which are ISM too. Listed here so the omission is closed in
// one place instead of being re-derived per control.
export const TIER_BY_PROTOCOL = {
  GNSS: 'T1', ADSB: 'T1',
  LTE: 'T2', GSM: 'T2', NR5G: 'T2',
  UWB: 'T4',
  BLE: 'T3', BTC: 'T3', WIFI: 'T3', LORA: 'T3', SUBG: 'T3',
  ZIGBEE: 'T3', ZWAVE: 'T3', THREAD: 'T3', RFID: 'T3',
};

// How a control relates to an adversary-behaviour entry (ATT&CK or FiGHT).
// 'assesses' is the common case: the control tests whether the technique is
// viable against the target. A control is never asserted to BE a technique.
export const THREAT_RELATIONS = ['assesses', 'detects', 'mitigates', 'related-to'];

// --- Mandate: who may run a control, and under what authority --------------
// A control's tier is a property of the band; it is not a verdict on legality.
// The same transmission is unlawful for a contracted auditor and lawful for the
// operator that holds the assignment, or for the regulator validating it. So the
// corpus states what authority a control REQUIRES, and the engagement states what
// authority the assessor HOLDS. The two are crossed to produce applicability.
export const MANDATES = [
  'system-ownership',      // the system under test belongs to the assessor
  'written-authorisation', // explicit written permission from its owner
  'credential-ownership',  // the credential itself belongs to the assessor (near-field)
  'spectrum-licence',      // a licence or assignment in the band being used
  'regulatory-authority',  // statutory power over the band (the regulator itself)
  'containment',           // a cage or conducted path: the physical substitute for
                           // band permission, since nothing leaves the enclosure
];

// Who is running the methodology. Recorded for the record; it grants nothing by
// itself: mandates are always declared explicitly, never inferred from a title.
export const ASSESSOR_ROLES = [
  'auditor',       // third party under contract
  'operator',      // the licensee of the network or spectrum
  'regulator',     // the authority validating compliance
  'manufacturer',  // the vendor testing its own product
  'defender',      // the owner's own blue team
];

// What authority a control requires, derived rather than written 51 times.
// Returns a list of requirement GROUPS: every group must be satisfied, and a group
// is satisfied by ANY one of its alternatives. Deriving it keeps one source of
// truth, and means the 48 controls without an execution block are still covered
// for everything that follows from their band alone.
export function mandatesFor({ protocol, layer, tx_modes = [], side_effects = [] }) {
  const groups = [];

  // Touching someone else's equipment at all.
  groups.push({
    any_of: ['system-ownership', 'written-authorisation'],
    because: 'the control is exercised against a system that must belong to you or be authorised in writing',
  });

  // Near-field credentials: the gate is possession, not spectrum. Cloning a
  // third-party credential is fraud however small the field is.
  if (protocol === 'RFID') {
    groups.push({
      any_of: ['credential-ownership', 'written-authorisation'],
      because: 'energising or cloning a credential you do not own is fraud, not a spectrum question',
    });
  }

  const tier = TIER_BY_PROTOCOL[protocol];
  const transmits = tx_modes.length > 0;

  // Denial by emission reaches parties who are not in scope, so containment is
  // the only acceptable answer: no authorisation substitutes for it.
  if (tx_modes.includes('jamming')) {
    groups.push({
      any_of: ['containment'],
      because: 'jamming denies service to third parties who are not part of the engagement',
    });
  } else if (transmits && tier === 'T1') {
    groups.push({
      any_of: ['regulatory-authority', 'spectrum-licence', 'containment'],
      because: `${protocol} is a safety-of-life band: transmitting needs statutory power, an assignment, or an enclosure`,
    });
  } else if (transmits && tier === 'T2') {
    groups.push({
      any_of: ['spectrum-licence', 'regulatory-authority', 'containment'],
      because: `${protocol} is licensed spectrum: transmitting needs the assignment, statutory power, or an enclosure`,
    });
  }

  return groups;
}

// Lifecycle of a tool entry. Deliberately not derived from commit dates: a frozen
// protocol tool can be current ('mature') and an archived repo can still be the
// reference ('archived'). Left unset on entries nobody has checked yet.
export const TOOL_STATUSES = ['active', 'mature', 'archived', 'research', 'eol', 'stale'];

const ID_RE = new RegExp(
  `^RFSAM-(${PROTOCOL_IDS.join('|')})-(${LAYER_IDS.join('|')})-(\\d{2})$`,
);

export function parseControlId(id) {
  const m = ID_RE.exec(id);
  if (!m) return null;
  return { protocol: m[1], layer: m[2], nn: m[3] };
}
