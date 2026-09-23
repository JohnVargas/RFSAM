#!/usr/bin/env python3
"""run_session.py - walk the session plan, emitting progress as it goes.

The point of this script is the part a static report never shows: a control that
is *running*. It marks one control at a time as running, emits timestamped events
while the observation window burns down, then records the outcome and moves on.

For the demo it replays a canned script (runner/demo_script.jsonl) at a time
compression factor, so a 90-minute engagement plays out in a couple of minutes.
Nothing here touches a radio.

  run_session.py --speed 60        # 1 simulated minute per real second
  run_session.py --speed 1         # real time, if you have the afternoon
"""
import argparse, json, os, random, time, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOOT = os.path.join(ROOT, 'loot')

def now():
    return datetime.datetime.now().astimezone().isoformat(timespec='seconds')

def emit(msg, control=None, kind='info'):
    row = {'ts': now(), 'control': control, 'kind': kind, 'msg': msg}
    with open(os.path.join(LOOT, 'events.jsonl'), 'a', encoding='utf-8') as fh:
        fh.write(json.dumps(row, ensure_ascii=False) + '\n')
    tag = {'info': '·', 'start': '▸', 'done': '✔', 'warn': '!', 'blocked': '⛔'}[kind]
    print(f"  {tag} {msg}", flush=True)

def write_plan(plan):
    with open(os.path.join(LOOT, 'session_plan.jsonl'), 'w', encoding='utf-8') as fh:
        for r in plan:
            fh.write(json.dumps(r, ensure_ascii=False) + '\n')

TICKS = {
    'auto':     ["tuning {freq} — gain {gain} dB", "noise floor {nf} dBm, target at {rssi} dBm",
                 "{n} frames so far", "window {left}s remaining"],
    'assisted': ["command handed to operator, waiting for output", "operator reports capture running",
                 "{n} PDUs returned so far", "window {left}s remaining"],
    'manual':   ["operator working: {step}", "notes recorded, awaiting attestation",
                 "attestation received", "cross-checking against the published corpus"],
}
STEPS = ["teardown photos", "reading the advertising fingerprint", "GATT walk", "pairing capture review"]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--speed', type=float, default=60.0, help='simulated seconds per real second')
    ap.add_argument('--script', default='runner/demo_script.jsonl')
    a = ap.parse_args()

    script = {json.loads(l)['control']: json.loads(l) for l in open(os.path.join(ROOT, a.script), encoding='utf-8') if l.strip()}
    plan = [json.loads(l) for l in open(os.path.join(LOOT, 'session_plan.jsonl'), encoding='utf-8') if l.strip()]
    for r in plan:
        r['state'], r['verdict'], r['started_at'], r['elapsed_s'] = 'pending', None, None, None
    open(os.path.join(LOOT, 'results.jsonl'), 'w').close()
    open(os.path.join(LOOT, 'events.jsonl'), 'w').close()
    write_plan(plan)

    scope = json.load(open(os.path.join(LOOT, 'scope.json'), encoding='utf-8'))
    emit(f"session {scope['engagement']} starting — {len(plan)} controls in scope, "
         f"time compression x{a.speed:g}", kind='start')

    for row in plan:
        res = script.get(row['control'])
        if not res:
            continue
        row['state'], row['started_at'] = 'running', now()
        write_plan(plan)
        emit(f"{row['control']} — {row['title'][:54]}", row['control'], 'start')

        if res['verdict'] == 'blocked':
            time.sleep(0.6)
            emit(f"blocked: {res.get('reason', '')[:90]}", row['control'], 'blocked')
        else:
            total = res.get('duration_s') or 120
            burn = max(total / a.speed, 1.5)
            ticks = TICKS.get(res.get('method', 'auto'), TICKS['auto'])
            n_ticks = min(4, max(2, int(burn // 1.2)))
            c = res.get('conditions', {})
            for i in range(n_ticks):
                time.sleep(burn / n_ticks)
                row['elapsed_s'] = int(total * (i + 1) / n_ticks)
                write_plan(plan)
                msg = ticks[i % len(ticks)].format(
                    freq=f"{c.get('freq_hz', 2402000000) / 1e6:.0f} MHz", gain=c.get('gain_db', '—'),
                    nf=c.get('noise_floor_dbm', '—'), rssi=c.get('rssi_dbm', '—'),
                    n=int((c.get('packets') or c.get('data_pdus') or 400) * (i + 1) / n_ticks),
                    left=int(total - total * (i + 1) / n_ticks), step=random.choice(STEPS))
                emit(msg, row['control'], 'info')

        res_out = dict(res); res_out['recorded_at'] = now()
        with open(os.path.join(LOOT, 'results.jsonl'), 'a', encoding='utf-8') as fh:
            fh.write(json.dumps(res_out, ensure_ascii=False) + '\n')
        row['state'] = 'blocked' if res['verdict'] == 'blocked' else 'done'
        row['verdict'], row['elapsed_s'] = res['verdict'], res.get('duration_s')
        write_plan(plan)
        if res['verdict'] != 'blocked':
            emit(f"{row['control']} → {res['verdict'].upper()}"
                 + (f" ({res['severity']})" if res.get('severity') else ''), row['control'], 'done')

    emit("session complete", kind='done')
    os.system(f"cd {ROOT} && python3 runner/render_report.py >/dev/null")

if __name__ == '__main__':
    raise SystemExit(main())
