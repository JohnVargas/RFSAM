import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import {
  LAYER_IDS, PROTOCOL_IDS, CRITICALITY_IDS, REVIEW_STATUSES, CONFIDENCE_LEVELS,
  THREAT_RELATIONS, AUTOMATABLE_LEVELS, LEGAL_TIERS, TX_MODES, SIDE_EFFECTS,
  PHYSICAL_NEEDS, SCOPE_MODES, TOOL_STATUSES,
} from './lib/taxonomy.js';

const enumOf = (v: string[]) => z.enum(v as [string, ...string[]]);

const layer = z.enum(LAYER_IDS as [string, ...string[]]);

// A mapping to an external adversary-behaviour corpus. The rationale is required:
// CISA's mapping guidance is explicit that a bare list of ids has little value.
const threatRef = z.object({
  id: z.string(),
  relation: z.enum(THREAT_RELATIONS as [string, ...string[]]),
  rationale: z.string(),
});
const protocol = z.enum(PROTOCOL_IDS as [string, ...string[]]);

const reference = z.object({
  key: z.string(),
  title: z.string(),
  authors: z.string().optional(),
  venue: z.string().optional(),
  year: z.number().int().optional(),
  url: z.string().url(),
  type: z.enum(['paper', 'cve', 'talk', 'spec', 'standard', 'tool', 'blog']),
});

const attack = z.object({
  name: z.string(),
  cve: z.array(z.string()).optional(),
  refs: z.array(z.string()).default([]),   // keys into references[]
  note: z.string().optional(),             // freeform citation (legacy/quick)
  impact: z.string().optional(),
  preconditions: z.string().optional(),
  summary: z.string(),
});

// What an engine needs before PROPOSING this control. Two independent axes:
// `tx_modes` answers "how may I address the target", `side_effects` answers "may I
// change it"; an engagement grants those separately. `requires_tx` is derivable
// from tx_steps and is kept explicit so the assertion can be cross-checked.
const execution = z.object({
  automatable: enumOf(AUTOMATABLE_LEVELS),
  requires_tx: z.boolean(),
  // Which steps emit. TX usually lives in one step of an otherwise passive
  // procedure; without this the passive half is unrunnable in a receive-only scope.
  tx_steps: z.array(z.number().int().positive()).default([]),
  tx_modes: z.array(enumOf(TX_MODES)).default([]),
  // Required iff requires_tx, cross-checked in validate.mjs, not here, so the
  // error names the file the way every other RFSAM validation error does.
  legal_tier: enumOf(LEGAL_TIERS).optional(),
  side_effects: z.array(enumOf(SIDE_EFFECTS)).default(['none']),
  needs_physical: z.array(enumOf(PHYSICAL_NEEDS)).default([]),
  containment: z.enum(['none', 'conducted', 'cage']).default('none'),
  gates: z.object({
    hardware_present: z.array(z.string()).default([]),
    scope_mode_in: z.array(enumOf(SCOPE_MODES)).min(1),
    requires_root: z.boolean().default(false),
  }),
  // Why this block says what it says, naming the step that settles it. One
  // sentence. It is the only thing keeping the block attached to the procedure.
  basis: z.string().min(1),
// Optional during migration; required once every control carries one.
}).optional();

const controls = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/controls' }),
  schema: z.object({
    id: z.string().regex(/^RFSAM-[A-Z0-9]+-[A-Z]+-\d{2}$/),
    title: z.string().min(1),
    protocol,
    layer,
    criticality: z.enum(CRITICALITY_IDS as [string, ...string[]]),
    applicability: z.array(z.string()).default([]),
    deferred: z.boolean().default(false),
    objective: z.string().optional(),
    intro: z.string().optional(),
    prerequisites: z.object({
      hardware: z.array(z.string()).default([]),
      software: z.array(z.string()).default([]),
      signal: z.object({
        freq: z.string().optional(),
        bandwidth: z.string().optional(),
        modulation: z.string().optional(),
      }).optional(),
      skill: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    }).optional(),
    attacks: z.array(attack).default([]),
    references: z.array(reference).default([]),
    tools: z.array(z.string()).default([]),
    bsam: z.array(z.string()).default([]),
    mitre: z.array(threatRef).default([]),
    fight: z.array(threatRef).default([]),
    // Why no mapping exists. Required on AT-layer controls that map to nothing,
    // so that a gap is declared rather than silent.
    threatMapNote: z.string().optional(),
    resources: z.array(z.string()).default([]),
    reviewStatus: z.enum(REVIEW_STATUSES as [string, ...string[]]).default('stub'),
    confidence: z.enum(CONFIDENCE_LEVELS as [string, ...string[]]).default('low'),
    lastResearched: z.coerce.date().optional(),
    execution,
  }),
});

const resources = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/resources' }),
  schema: z.object({ id: z.string(), title: z.string() }),
});

const tools = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
  schema: z.object({
    slug: z.string().optional(),
    name: z.string(),
    vendor: z.string(),
    type: z.enum(['hardware', 'software', 'project']).default('hardware'),
    protocols: z.array(z.string()).default([]),
    note: z.string(),
    spec: z.string().optional(),   // e.g. instantaneous bandwidth / tuning range for SDRs
    repo: z.string().url().optional(),
    homepage: z.string().url().optional(),
    // Software/projects that pair with this hardware (slugs in this collection).
    software: z.array(z.string()).default([]),
    // Lifecycle. Optional: an unset status means nobody has assessed this entry yet,
    // which is honest: it does not assert the tool is current.
    status: z.enum(TOOL_STATUSES as [string, ...string[]]).optional(),
    statusNote: z.string().optional(),
    statusSource: z.string().url().optional(),   // where the statusNote can be checked
    statusChecked: z.coerce.date().optional(),
    successor: z.string().optional(),   // slug in this collection
    ec: z.boolean().default(false),
  }),
});

export const collections = { controls, resources, tools };
