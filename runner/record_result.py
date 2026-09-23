#!/usr/bin/env python3
"""record_result.py - record the outcome of one control.

Generalises the Skill's register_finding.py: a row is written whether or not there
was a finding, because 'tested and clean' and 'never tested' are different states.
That distinction is the one OWTF had (OWTF_PASSING = 0) and RFSAM lacks.

Verdicts:
  finding       the weakness was observed
  passed        tested with the same rigour and the control holds
  inconclusive  tested and the spectrum did not cooperate (needs stop_reason)
  blocked       could not be tested (needs reason)

Usage:
  record_result.py --control RFSAM-BLE-SP-01 --verdict passed --method auto \
      --summary "..." --conditions '{"freq_hz":2402000000}' [--severity info]
"""
import argparse, json, os, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERDICTS = ['finding', 'passed', 'inconclusive', 'blocked']
METHODS = ['auto', 'assisted', 'manual']
SEVERITIES = ['info', 'low', 'medium', 'high', 'critical']

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--control', required=True)
    p.add_argument('--verdict', required=True, choices=VERDICTS)
    p.add_argument('--method', choices=METHODS, default='auto')
    p.add_argument('--summary', required=True)
    p.add_argument('--severity', choices=SEVERITIES)
    p.add_argument('--stop-reason')
    p.add_argument('--reason')
    p.add_argument('--conditions', default='{}')
    p.add_argument('--evidence', default='')
    p.add_argument('--duration-s', type=int)
    # What separates an assisted run from an automatic one: the command the engine
    # printed for the operator, and what the operator handed back.
    p.add_argument('--suggested-cmd')
    p.add_argument('--operator-output')
    args = p.parse_args()

    if args.verdict == 'inconclusive' and not args.stop_reason:
        sys.exit("inconclusive needs --stop-reason: why observation ended without a verdict")
    if args.verdict == 'blocked' and not args.reason:
        sys.exit("blocked needs --reason")
    if args.verdict == 'finding' and not args.severity:
        sys.exit("finding needs --severity")
    if args.method == 'assisted' and not args.suggested_cmd:
        sys.exit("assisted needs --suggested-cmd: the command handed to the operator is the record")

    scope = json.load(open(os.path.join(ROOT, 'loot', 'scope.json'), encoding='utf-8'))
    row = {
        'control': args.control, 'verdict': args.verdict, 'method': args.method,
        'severity': args.severity, 'summary': args.summary,
        'stop_reason': args.stop_reason, 'reason': args.reason,
        'conditions': json.loads(args.conditions), 'evidence': args.evidence,
        'duration_s': args.duration_s,
        'suggested_cmd': args.suggested_cmd, 'operator_output': args.operator_output,
        'recorded_at': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
        'engagement': scope.get('engagement'),
        'simulated': scope.get('simulated', False),
    }
    out = os.path.join(ROOT, 'loot', 'results.jsonl')
    with open(out, 'a', encoding='utf-8') as fh:
        fh.write(json.dumps(row, ensure_ascii=False) + '\n')

    plan_path = os.path.join(ROOT, 'loot', 'session_plan.jsonl')
    plan = [json.loads(l) for l in open(plan_path, encoding='utf-8')]
    for r in plan:
        if r['control'] == args.control:
            r['state'] = 'done' if args.verdict != 'blocked' else 'blocked'
            r['verdict'] = args.verdict
    with open(plan_path, 'w', encoding='utf-8') as fh:
        for r in plan:
            fh.write(json.dumps(r, ensure_ascii=False) + '\n')
    print(f"recorded {args.verdict} for {args.control}")

if __name__ == '__main__':
    sys.exit(main())
