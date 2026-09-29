#!/usr/bin/env python3
"""render_report.py - regenerate the engagement report from the recorded results.

Idempotent by design: it reads loot/session_plan.jsonl and loot/results.jsonl and
rewrites the whole report every time. That is what makes it feel live - run it
after each result and the document fills itself.

  --audience internal   everything, including inconclusive and budgets
  --audience client     confirmed findings plus limitations
  --audience third_party  adds evidence references, omits operator notes
"""
import argparse, json, os, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAYERS = ['IG', 'SP', 'PHY', 'LL', 'CR', 'AT', 'AP']
SEV_ORDER = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3, 'info': 4, None: 5}
MARK = {'finding': 'FINDING', 'passed': 'PASSED', 'inconclusive': 'INCONCLUSIVE', 'blocked': 'BLOCKED'}

def load(name):
    p = os.path.join(ROOT, 'loot', name)
    if not os.path.exists(p):
        return []
    return [json.loads(l) for l in open(p, encoding='utf-8') if l.strip()]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--audience', choices=['internal', 'client', 'third_party'], default='internal')
    ap.add_argument('--out', default='loot/report.md')
    a = ap.parse_args()

    scope = json.load(open(os.path.join(ROOT, 'loot', 'scope.json'), encoding='utf-8'))
    plan, results = load('session_plan.jsonl'), load('results.jsonl')
    by_control = {r['control']: r for r in results}
    counts = collections.Counter(r['verdict'] for r in results)
    done, total = len(results), len(plan)
    L = []
    A = L.append

    A(f"# RF assessment: {scope.get('engagement')}")
    if scope.get('simulated'):
        A("")
        A("> **SIMULATED SESSION, NOT A REAL ASSESSMENT.** No radio was operated and no capture was")
        A("> taken. Every result below is synthetic and exists to exercise the runner. Do not cite,")
        A("> forward or reuse any value in this document as evidence about a real device.")
    A("")
    A(f"Generated {datetime.datetime.now().astimezone().isoformat(timespec='seconds')} · audience: **{a.audience}**")
    A("")
    A("## Coverage")
    A("")
    A(f"{done} of {total} controls in scope have a recorded outcome "
      f"({round(done / total * 100) if total else 0}%).")
    A("")
    A("| verdict | n | share |")
    A("|---|---|---|")
    for v in ['finding', 'passed', 'inconclusive', 'blocked']:
        if counts[v]:
            A(f"| {v} | {counts[v]} | {round(counts[v] / total * 100)}% |")
    pending = total - done
    if pending:
        A(f"| pending | {pending} | {round(pending / total * 100)}% |")
    A("")
    A("Coverage is not a score. `passed` means the control was exercised with the same rigour as a")
    A("finding and held; `inconclusive` means the observation window closed without a verdict, which")
    A("is a statement about the observation, not about the device.")
    A("")

    A("## Descent")
    A("")
    A("| layer | control | verdict | method | summary |")
    A("|---|---|---|---|---|")
    for row in plan:
        r = by_control.get(row['control'])
        if not r:
            A(f"| {row['layer']} | {row['control']} | pending | - | - |")
            continue
        if a.audience == 'client' and r['verdict'] == 'inconclusive':
            summary = 'Observed without reaching a verdict; see Limitations.'
        else:
            summary = r['summary']
        A(f"| {row['layer']} | {row['control']} | **{MARK[r['verdict']]}** | {r.get('method') or '-'} | {summary} |")
    A("")

    findings = sorted([r for r in results if r['verdict'] == 'finding'],
                      key=lambda r: SEV_ORDER.get(r.get('severity'), 5))
    if findings:
        A("## Findings")
        A("")
        for r in findings:
            A(f"### {r['control']}: {(r.get('severity') or '').upper()}")
            A("")
            A(r['summary'])
            A("")
            if r.get('conditions'):
                A("Conditions: " + ", ".join(f"`{k}={v}`" for k, v in r['conditions'].items()))
                A("")
            if r.get('suggested_cmd') and a.audience != 'client':
                A("Command handed to the operator:")
                A("")
                A("```")
                A(r['suggested_cmd'])
                A("```")
                A("")
            if r.get('evidence') and a.audience != 'client':
                A(f"Evidence: `{r['evidence']}`")
                A("")

    limits = [r for r in results if r['verdict'] in ('inconclusive', 'blocked')]
    if limits:
        A("## Limitations")
        A("")
        A("What was not established, and why. Read this before reading the coverage table as comfort.")
        A("")
        for r in limits:
            why = r.get('stop_reason') or r.get('reason') or ''
            A(f"- **{r['control']}** ({r['verdict']}): {r['summary']} _{why}_")
        A("")

    passed = [r for r in results if r['verdict'] == 'passed']
    if passed and a.audience != 'client':
        A("## Tested and clean")
        A("")
        for r in passed:
            A(f"- **{r['control']}**: {r['summary']}")
        A("")

    out = os.path.join(ROOT, a.out)
    open(out, 'w', encoding='utf-8').write("\n".join(L) + "\n")
    print(f"{done}/{total} recorded -> {a.out}  ({', '.join(f'{k}={v}' for k, v in counts.items())})")

if __name__ == '__main__':
    raise SystemExit(main())
