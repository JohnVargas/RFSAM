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
    out['execution'] = execution_block(fm)
    return out


def _scalar(v):
    v = v.strip().strip("'\"")
    if v in ('true', 'false'):
        return v == 'true'
    if re.fullmatch(r'\[\s*\]', v):
        return []
    if re.fullmatch(r'\[.*\]', v):
        return [_scalar(i) for i in v[1:-1].split(',') if i.strip()]
    if re.fullmatch(r'-?\d+', v):
        return int(v)
    return v


def execution_block(fm):
    """Read the `execution:` block without a YAML dependency.

    Handles only the shape the schema permits: scalars, flat lists (block or
    inline), one nested map (`gates`) and folded strings. Anything unexpected
    yields None, which means the control simply has no execution metadata - the
    same state as before this field existed. An unparsable block degrades to
    'no gate', never to a wrong gate.
    """
    m = re.search(r'^execution:\n((?:[ \t]+.*\n?)+)', fm, re.M)
    if not m:
        return None
    lines = [l for l in m.group(1).splitlines() if l.strip() and not l.strip().startswith('#')]

    def parse(idx, indent):
        """Parse the block at `indent`, returning (value, next index)."""
        if idx < len(lines) and lines[idx].strip().startswith('- '):
            items = []
            while idx < len(lines):
                ln = lines[idx]
                if len(ln) - len(ln.lstrip(' ')) != indent or not ln.strip().startswith('- '):
                    break
                items.append(_scalar(ln.strip()[2:]))
                idx += 1
            return items, idx
        node = {}
        while idx < len(lines):
            ln = lines[idx]
            ind = len(ln) - len(ln.lstrip(' '))
            if ind < indent:
                break
            body = ln.strip()
            if ':' not in body:          # continuation line of a folded scalar
                idx += 1
                continue
            key, _, val = body.partition(':')
            key, val = key.strip(), val.strip()
            if val in ('>-', '>', '|'):  # folded text: fold it back into one line
                idx += 1
                parts = []
                while idx < len(lines) and (len(lines[idx]) - len(lines[idx].lstrip(' '))) > ind:
                    parts.append(lines[idx].strip())
                    idx += 1
                node[key] = ' '.join(parts)
            elif val == '':              # nested list or map on the following lines
                child, idx = parse(idx + 1, ind + 2)
                node[key] = child
            else:
                node[key] = _scalar(val)
                idx += 1
        return node, idx

    block, _ = parse(0, len(lines[0]) - len(lines[0].lstrip(' ')))
    return block or None

def spectrum_row(scope, protocol):
    for row in scope.get('spectrum', []):
        if protocol in row.get('protocols', []):
            return row
    return None


def gate(ctrl, scope):
    """Decide whether a control can be proposed. Returns (state, reason).

    Gate order is deliberate: protocol, mode, TX, side effects, kit. The reason
    reported is the first gate that fails, so it should be the most fundamental
    one - "the scope is observational" is a better answer than "no antenna".

    A control with no execution block cannot be gated. It stays pending and says
    so, rather than being silently trusted: that silence is what let a control
    that opens a GATT connection be proposed into a receive-only scope.
    """
    x = ctrl.get('execution')
    if not x:
        return 'pending', 'no execution metadata - cannot be gated, review by hand'

    mode = scope.get('mode')
    allowed = (x.get('gates') or {}).get('scope_mode_in', [])
    if mode not in allowed:
        return 'blocked', f"needs mode in {allowed}, scope declares '{mode}'"

    if x.get('requires_tx'):
        row = spectrum_row(scope, ctrl['protocol'])
        if row is None:
            return 'blocked', 'no spectrum authorisation covers this protocol'
        # The modes, not a boolean. This is the line that catches the incident:
        # a scope may authorise talking to a device without authorising injection.
        missing = [m for m in x.get('tx_modes', []) if m not in row.get('tx_modes', [])]
        if missing:
            return 'blocked', (f"tx_modes {missing} not authorised on this band "
                               f"(scope allows {row.get('tx_modes', []) or 'none'})")
        if x.get('legal_tier') in ('T1', 'T2') and row.get('tx_containment', 'none') == 'none':
            return 'blocked', f"tier {x['legal_tier']} requires containment; scope declares none"

    target = next((t for t in scope['targets'] if t['protocol'] == ctrl['protocol']), {})
    permitted = target.get('permitted_side_effects', [])
    unauth = [e for e in x.get('side_effects', []) if e != 'none' and e not in permitted]
    if unauth:
        return 'blocked', f"side effects {unauth} not authorised on {target.get('id', '?')}"

    kit = scope.get('kit')
    if kit is not None:
        absent = [h for h in (x.get('gates') or {}).get('hardware_present', []) if h not in kit]
        if absent:
            return 'blocked', f"kit missing {absent}"

    return 'pending', None


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
        row['method'] = (d.get('execution') or {}).get('automatable')
        row['requires_tx'] = (d.get('execution') or {}).get('requires_tx')
        state, reason = gate(d, scope)
        row['state'], row['reason'] = state, reason
        row['gated_by'] = 'derived' if d.get('execution') else 'none'
        # A human may still override the gate, but it is recorded as an override
        # rather than masquerading as a decision the engine made.
        if d['id'] in excluded:
            row['state'], row['reason'] = 'blocked', excluded[d['id']]
            row['gated_by'] = 'operator-override'
        rows.append(row)
    order = {l: i for i, l in enumerate(['IG', 'SP', 'PHY', 'LL', 'CR', 'AT', 'AP'])}
    rows.sort(key=lambda r: (order.get(r['layer'], 9), r['control']))
    out = os.path.join(ROOT, 'loot', 'session_plan.jsonl')
    with open(out, 'w', encoding='utf-8') as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + '\n')
    print(f"{len(rows)} control(s) in scope -> {os.path.relpath(out, ROOT)}")
    for r in rows:
        tx = 'TX' if r.get('requires_tx') else '  '
        mark = f"[{r['state']}]" if r['state'] != 'pending' or r['reason'] else ''
        print(f"  {r['layer']:<4} {tx} {r['control']:<20} {r['title'][:40]:<40} {mark}")
        if r['reason']:
            print(f"       -> {r['reason']}  ({r['gated_by']})")

if __name__ == '__main__':
    sys.exit(main())
