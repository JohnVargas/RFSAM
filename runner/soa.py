#!/usr/bin/env python3
"""soa.py - Statement of Applicability over the whole control corpus.

RFSAM describes what can be assessed; it does not decide what you are allowed to
do. Whether a given control may be run turns on mandate and jurisdiction, which
belong to the engagement, not to the method: the same LTE jammer is an offence
for a contracted auditor and a compliance measurement for the regulator that owns
the band. So the corpus states what authority a control REQUIRES and the
engagement states what authority the assessor HOLDS. This crosses the two.

Like ISO 27001's Annex A, the point is not the list of what you did - it is the
justified statement of what you excluded and why. So this walks all 51 controls,
not the ones already in scope.

Stdlib only. Reads src/data/mandates.json, generated from the taxonomy.
"""
import json, os, re, sys, argparse, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CTRL = os.path.join(ROOT, 'src', 'content', 'controls')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan_session import frontmatter  # noqa: E402  (same minimal reader)

APPLICABLE, EXCLUDED, UNDETERMINED = 'applicable', 'excluded', 'undetermined'


def load_mandates():
    with open(os.path.join(ROOT, 'src', 'data', 'mandates.json'), encoding='utf-8') as fh:
        return json.load(fh)


def profile(execution):
    """Which transmit profile a control falls into, for the derivation lookup."""
    if not execution:
        return None
    modes = execution.get('tx_modes') or []
    if 'jamming' in modes:
        return 'jam'
    return 'tx' if execution.get('requires_tx') else 'notx'


def assess(ctrl, scope, tables):
    """Return (status, reason, requirements). Never silently drops a control."""
    ex = ctrl.get('execution')
    assessor = scope.get('assessor') or {}
    held = set(assessor.get('mandates') or [])
    protos = {t['protocol'] for t in scope.get('targets', [])}

    # Out of scope by subject matter. Still listed, still justified - that is the
    # whole point of a statement of applicability.
    if ctrl['protocol'] not in protos:
        return EXCLUDED, f"{ctrl['protocol']} is not among the assessed protocols", []

    prof = profile(ex)
    if prof is None:
        return (UNDETERMINED,
                'the control carries no execution metadata, so its requirements cannot be derived',
                [])

    reqs = tables['derived'].get(f"{ctrl['protocol']}|{prof}", [])
    missing = [g for g in reqs if not (set(g['any_of']) & held)]
    if missing:
        first = missing[0]
        return (EXCLUDED,
                f"requires one of {first['any_of']} - {first['because']}; "
                f"the assessor declares {sorted(held) or 'no mandate'}",
                reqs)

    mode = scope.get('mode')
    allowed = (ex.get('gates') or {}).get('scope_mode_in') or []
    if allowed and mode not in allowed:
        return EXCLUDED, f"the control is offered in {allowed}; this engagement runs in '{mode}'", reqs

    return APPLICABLE, None, reqs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--scope', default='loot/scope.json')
    ap.add_argument('--out', default='loot/soa.md')
    a = ap.parse_args()

    scope = json.load(open(os.path.join(ROOT, a.scope), encoding='utf-8'))
    tables = load_mandates()
    assessor = scope.get('assessor') or {}

    rows = []
    for f in sorted(os.listdir(CTRL)):
        if not f.endswith('.md') or f.startswith('_'):
            continue
        d = frontmatter(os.path.join(CTRL, f))
        if not d.get('id'):
            continue
        status, reason, reqs = assess(d, scope, tables)
        rows.append({
            'control': d['id'], 'title': d.get('title', ''), 'protocol': d['protocol'],
            'layer': d.get('layer'), 'status': status, 'reason': reason,
            'requirements': [g['any_of'] for g in reqs],
        })

    order = {APPLICABLE: 0, UNDETERMINED: 1, EXCLUDED: 2}
    rows.sort(key=lambda r: (order[r['status']], r['control']))
    with open(os.path.join(ROOT, 'loot', 'soa.jsonl'), 'w', encoding='utf-8') as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + '\n')

    n = {k: sum(1 for r in rows if r['status'] == k) for k in (APPLICABLE, UNDETERMINED, EXCLUDED)}
    role = assessor.get('role', '(role not declared)')
    held = assessor.get('mandates') or []
    L = [
        '# Statement of Applicability',
        '',
        f"**Engagement** `{scope.get('engagement', '?')}` · **assessor role** `{role}` · "
        f"**jurisdiction** `{(scope.get('site') or {}).get('jurisdiction', '?')}` · "
        f"**mode** `{scope.get('mode')}`",
        '',
        f"**Mandates held:** {', '.join(f'`{m}`' for m in held) if held else '_none declared_'}",
        '',
        'RFSAM describes what can be assessed. It does not decide what you may lawfully do:',
        'that turns on the mandate and the jurisdiction declared above. This statement records',
        f'a decision for all {len(rows)} controls in the corpus, including the ones excluded —',
        'an exclusion without a reason is not a decision.',
        '',
        f"**{n[APPLICABLE]} applicable · {n[EXCLUDED]} excluded · {n[UNDETERMINED]} undetermined**",
        '',
    ]
    if scope.get('simulated'):
        L += ['> **SIMULATED ENGAGEMENT** — not a real assessment.', '']
    for status, heading in ((APPLICABLE, 'Applicable'), (UNDETERMINED, 'Undetermined'), (EXCLUDED, 'Excluded')):
        sel = [r for r in rows if r['status'] == status]
        if not sel:
            continue
        L += [f'## {heading} ({len(sel)})', '']
        if status == UNDETERMINED:
            L += ['These cannot be decided yet: without execution metadata the corpus cannot say',
                  'what authority they need. They are listed rather than assumed either way.', '']
        L += ['| control | layer | ' + ('reason' if status != APPLICABLE else 'requirements met') + ' |',
              '|---|---|---|']
        for r in sel:
            note = r['reason'] or ' · '.join('/'.join(g) for g in r['requirements']) or '—'
            L.append(f"| `{r['control']}` | {r['layer']} | {note} |")
        L.append('')
    L += ['---', '', f"Generated {datetime.datetime.now().isoformat(timespec='seconds')} "
          f"from `{a.scope}` by `runner/soa.py`."]
    out = os.path.join(ROOT, a.out)
    open(out, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f"{len(rows)} controls -> {os.path.relpath(out, ROOT)}  "
          f"(applicable={n[APPLICABLE]}, excluded={n[EXCLUDED]}, undetermined={n[UNDETERMINED]})")


if __name__ == '__main__':
    sys.exit(main())
