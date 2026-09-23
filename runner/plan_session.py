#!/usr/bin/env python3
"""plan_session.py - turn a scope file plus the control corpus into a session plan.

Reads loot/scope.json and src/content/controls/*.md, filters the controls that are
in scope, and writes one line per control to loot/session_plan.jsonl with its
initial state. This is the piece OWTF called the worklist; here it is a JSONL file
so it diffs in git and needs no database.

Stdlib only, on purpose.
"""
import json, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CTRL = os.path.join(ROOT, 'src', 'content', 'controls')

def frontmatter(path):
    """Minimal frontmatter reader - we only need scalar fields."""
    txt = open(path, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---', txt, re.S)
    if not m:
        return {}
    fm, out = m.group(1), {}
    for key in ('id', 'title', 'protocol', 'layer', 'criticality', 'reviewStatus'):
        k = re.search(rf'^{key}:\s*(?:>-\s*\n\s+)?(.+)$', fm, re.M)
        if k:
            out[key] = k.group(1).strip().strip("'\"")
    return out

def main():
    scope = json.load(open(os.path.join(ROOT, 'loot', 'scope.json'), encoding='utf-8'))
    protos = {t['protocol'] for t in scope['targets']}
    excluded = {e['id']: e['reason'] for e in scope.get('excluded_controls', [])}
    rows = []
    for f in sorted(os.listdir(CTRL)):
        if not f.endswith('.md') or f.startswith('_'):
            continue
        d = frontmatter(os.path.join(CTRL, f))
        if d.get('protocol') not in protos:
            continue
        row = {
            'control': d['id'], 'title': d.get('title', ''), 'protocol': d['protocol'],
            'layer': d['layer'], 'criticality': d.get('criticality'),
            'slug': f[:-3], 'state': 'pending', 'reason': None,
            'simulated': scope.get('simulated', False),
        }
        if d['id'] in excluded:
            row['state'], row['reason'] = 'blocked', excluded[d['id']]
        rows.append(row)
    order = {l: i for i, l in enumerate(['IG', 'SP', 'PHY', 'LL', 'CR', 'AT', 'AP'])}
    rows.sort(key=lambda r: (order.get(r['layer'], 9), r['control']))
    out = os.path.join(ROOT, 'loot', 'session_plan.jsonl')
    with open(out, 'w', encoding='utf-8') as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + '\n')
    print(f"{len(rows)} control(s) in scope -> {os.path.relpath(out, ROOT)}")
    for r in rows:
        mark = '[blocked]' if r['state'] == 'blocked' else ''
        print(f"  {r['layer']:<4} {r['control']:<20} {r['title'][:46]:<46} {mark}")

if __name__ == '__main__':
    sys.exit(main())
