#!/usr/bin/env python3
"""gate.py - the single decision about whether a control may be proposed.

plan_session.py and soa.py both need this answer and used to compute it
separately, which meant the session runner could refuse a control that the
Statement of Applicability had just declared applicable. Two sources of truth for
the same decision is the failure mode this whole schema exists to remove, so the
decision lives here and both import it.

Gate order is deliberate: subject matter, mode, mandate, transmit modes,
containment, side effects, kit. The reason reported is the first gate that fails,
so it should be the most fundamental one - "the scope is observational" is a
better answer than "no antenna".
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

APPLICABLE, EXCLUDED, UNDETERMINED = 'applicable', 'excluded', 'undetermined'


def load_tables():
    with open(os.path.join(ROOT, 'src', 'data', 'mandates.json'), encoding='utf-8') as fh:
        return json.load(fh)


def tx_profile(execution):
    """Which transmit profile a control falls into, for the mandate lookup."""
    if not execution:
        return None
    modes = execution.get('tx_modes') or []
    if 'jamming' in modes:
        return 'jam'
    return 'tx' if execution.get('requires_tx') else 'notx'


def spectrum_row(scope, protocol):
    for row in scope.get('spectrum', []):
        if protocol in row.get('protocols', []):
            return row
    return None


def evaluate(ctrl, scope, tables):
    """Return (status, reason, requirement_groups).

    A control with no execution block is UNDETERMINED, never silently allowed:
    that silence is what let a control which opens a GATT connection be proposed
    into a receive-only scope.
    """
    ex = ctrl.get('execution')
    protocol = ctrl.get('protocol')
    protos = {t['protocol'] for t in scope.get('targets', [])}

    if protocol not in protos:
        return EXCLUDED, f'{protocol} is not among the assessed protocols', []

    if not ex:
        return (UNDETERMINED,
                'the control carries no execution metadata, so its requirements cannot be derived',
                [])

    mode = scope.get('mode')
    allowed_modes = (ex.get('gates') or {}).get('scope_mode_in') or []
    if allowed_modes and mode not in allowed_modes:
        return EXCLUDED, f"the control is offered in {allowed_modes}; this engagement runs in '{mode}'", []

    reqs = tables['derived'].get(f'{protocol}|{tx_profile(ex)}', [])
    held = set((scope.get('assessor') or {}).get('mandates') or [])
    missing = [g for g in reqs if not (set(g['any_of']) & held)]
    if missing:
        g = missing[0]
        return (EXCLUDED,
                f"requires one of {g['any_of']} - {g['because']}; "
                f"the assessor declares {sorted(held) or 'no mandate'}",
                reqs)

    # What the control radiates, against what this engagement authorises on that
    # band. A scope may permit talking to a device without permitting injection.
    if ex.get('requires_tx'):
        row = spectrum_row(scope, protocol)
        if row is None:
            return EXCLUDED, 'no spectrum authorisation covers this protocol', reqs
        authorised = row.get('tx_modes') or []
        unauthorised = [m for m in (ex.get('tx_modes') or []) if m not in authorised]
        if unauthorised:
            note = (' - ' + row['tx_note']) if row.get('tx_note') else ''
            return (EXCLUDED,
                    f"transmits {unauthorised}, which this band does not authorise "
                    f"(scope allows {authorised or 'nothing'}){note}",
                    reqs)
        if ex.get('legal_tier') in ('T1', 'T2') and row.get('tx_containment', 'none') == 'none':
            return EXCLUDED, f"tier {ex['legal_tier']} needs containment; the scope declares none", reqs

    # Changing the target is a separate permission, granted by its owner.
    target = next((t for t in scope['targets'] if t['protocol'] == protocol), {})
    permitted = target.get('permitted_side_effects') or []
    unauth = [e for e in (ex.get('side_effects') or []) if e != 'none' and e not in permitted]
    if unauth:
        return EXCLUDED, f"has side effects {unauth}, not authorised on {target.get('id', '?')}", reqs

    kit = scope.get('kit')
    if kit is not None:
        absent = [h for h in (ex.get('gates') or {}).get('hardware_present', []) if h not in kit]
        if absent:
            return EXCLUDED, f'the kit does not include {absent}', reqs

    return APPLICABLE, None, reqs
