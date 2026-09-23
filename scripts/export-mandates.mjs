// Generates src/data/mandates.json from the taxonomy, so the Python runner can
// cross mandates without a second implementation of the derivation. The JS is the
// source of truth; the JSON is a build artefact. `npm run validate` checks it is
// current, so the two cannot drift silently.
import { writeFileSync } from 'node:fs';
import {
  MANDATES, ASSESSOR_ROLES, TIER_BY_PROTOCOL, PROTOCOL_IDS, mandatesFor,
} from '../src/lib/taxonomy.js';

// Three transmit profiles cover every case the derivation distinguishes.
const PROFILES = { notx: [], tx: ['injection'], jam: ['jamming'] };

const derived = {};
for (const protocol of PROTOCOL_IDS) {
  for (const [name, tx_modes] of Object.entries(PROFILES)) {
    derived[`${protocol}|${name}`] = mandatesFor({ protocol, tx_modes });
  }
}

export const payload = {
  _generated: 'by scripts/export-mandates.mjs - do not edit by hand',
  mandates: MANDATES,
  roles: ASSESSOR_ROLES,
  tier_by_protocol: TIER_BY_PROTOCOL,
  derived,
};

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync('src/data/mandates.json', JSON.stringify(payload, null, 2) + '\n');
  console.log(`wrote src/data/mandates.json (${Object.keys(derived).length} entries)`);
}
