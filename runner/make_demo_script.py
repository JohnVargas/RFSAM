#!/usr/bin/env python3
"""make_demo_script.py: extend the demo script to every control in scope.

The nine BLE entries in runner/demo_script.jsonl were written by hand with real
CVEs, a real recovered LTK and real capture conditions. Those are kept verbatim.

For every other control this generates a SYNTHETIC PLACEHOLDER, and says so in
the summary. It does not invent findings: fabricating a CVE or a recovered key
for forty-two controls would make the demo look richer and the output worthless.
What it does derive honestly, from each control's own execution block, is the
method (auto/assisted/manual) and whether the control was reachable at all.

Verdicts are assigned round-robin over the four outcomes so the report exercises
each path, and every generated summary names itself as a placeholder.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan_session import frontmatter  # noqa: E402

CURATED = os.path.join(ROOT, 'runner', 'demo_script.jsonl')
OUT = os.path.join(ROOT, 'runner', 'demo_script_full.jsonl')

# Rotated so the report exercises all four verdicts and both severities.
CYCLE = [
    ('passed', None), ('finding', 'medium'), ('inconclusive', None),
    ('finding', 'high'), ('passed', None), ('inconclusive', None),
]


def main():
    curated = {}
    with open(CURATED, encoding='utf-8') as fh:
        for line in fh:
            if line.strip():
                r = json.loads(line)
                curated[r['control']] = r

    plan = [json.loads(l) for l in open(os.path.join(ROOT, 'loot', 'session_plan.jsonl'),
                                        encoding='utf-8') if l.strip()]
    rows, i = [], 0
    for row in plan:
        cid = row['control']
        if cid in curated:                      # hand-written, kept as-is
            rows.append(curated[cid])
            continue

        d = frontmatter(os.path.join(ROOT, 'src', 'content', 'controls', row['slug'] + '.md'))
        ex = d.get('execution') or {}
        method = ex.get('automatable', 'assisted')

        if row['state'] == 'blocked':
            rows.append({
                'control': cid, 'verdict': 'blocked', 'method': method, 'severity': None,
                'summary': 'Not attempted: the engagement does not authorise it.',
                'stop_reason': None, 'reason': row.get('reason'), 'conditions': {},
                'evidence': '', 'duration_s': None, 'engagement': 'DEMO-FULL', 'simulated': True,
            })
            continue

        verdict, severity = CYCLE[i % len(CYCLE)]; i += 1
        tx = 'transmits' if ex.get('requires_tx') else 'receive-only'
        rows.append({
            'control': cid, 'verdict': verdict, 'method': method, 'severity': severity,
            'summary': (f'SYNTHETIC PLACEHOLDER: no radio was operated. Generated to exercise the '
                        f'runner over the whole corpus. What is real here comes from the control '
                        f'itself: it is {tx} and its method is {method}.'),
            'stop_reason': ('SYNTHETIC PLACEHOLDER: stands in for an observation window that '
                            'closed without a verdict.') if verdict == 'inconclusive' else None,
            'reason': None,
            'conditions': {'synthetic': True, 'requires_tx': bool(ex.get('requires_tx')),
                           'tx_modes': ex.get('tx_modes') or [],
                           'legal_tier': ex.get('legal_tier')},
            'evidence': '', 'duration_s': 240 if method == 'auto' else 420,
            'engagement': 'DEMO-FULL', 'simulated': True,
        })

    with open(OUT, 'w', encoding='utf-8') as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + '\n')
    n_syn = sum(1 for r in rows if r['control'] not in curated)
    print(f'{len(rows)} entries -> {os.path.relpath(OUT, ROOT)} '
          f'({len(rows)-n_syn} curated, {n_syn} synthetic placeholders)')


if __name__ == '__main__':
    sys.exit(main())
