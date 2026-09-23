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
  'pairing',              // bonding / key agreement - leaves state on the target
  'injection',            // crafted frames into an existing or third-party link
  'rogue-infrastructure', // impersonating an AP / base station / beacon / satellite
  'jamming',              // denial by emission
];

// What the control does TO the target - orthogonal to how it radiates.
export const SIDE_EFFECTS = ['none', 'actuates', 'persistent-state', 'dos'];

// Conditions an engine cannot satisfy by itself.
export const PHYSICAL_NEEDS = [
  'proximity', 'antenna-placement', 'device-access', 'teardown', 'conducted-rf', 'cage',
];

// RFSAM operating modes (SKILL.md, SCOPE AND LIMITS).
export const SCOPE_MODES = ['observational', 'active', 'lab', 'defensive'];

// The tier follows from the protocol's band. Stored on the control anyway so it is
// a cross-checkable assertion rather than an opinion - the same reason validate.mjs
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
