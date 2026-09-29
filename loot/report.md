# RF assessment: DEMO-2026-001

> **SIMULATED SESSION, NOT A REAL ASSESSMENT.** No radio was operated and no capture was
> taken. Every result below is synthetic and exists to exercise the runner. Do not cite,
> forward or reuse any value in this document as evidence about a real device.

Generated 2026-09-25T06:11:01-06:00 · audience: **internal**

## Coverage

9 of 9 controls in scope have a recorded outcome (100%).

| verdict | n | share |
|---|---|---|
| finding | 4 | 44% |
| passed | 2 | 22% |
| inconclusive | 2 | 22% |
| blocked | 1 | 11% |

Coverage is not a score. `passed` means the control was exercised with the same rigour as a
finding and held; `inconclusive` means the observation window closed without a verdict, which
is a statement about the observation, not about the device.

## Descent

| layer | control | verdict | method | summary |
|---|---|---|---|---|
| IG | RFSAM-BLE-IG-01 | **FINDING** | manual | Teardown and passive advertising fingerprint identify a Telink TLSR8253 controller on a bare-metal vendor SDK predating the November 2019 SMP fix; the part matches the SweynTooth Zero-LTK entry in the published corpus and the module vendor offers no patched firmware. |
| SP | RFSAM-BLE-SP-01 | **PASSED** | auto | HackRF One at 20 Msps resolves a ~20 MHz window, so only one of the three advertising channels is observable at a time; camping channel 37 recovered the target's advertising bursts and the capture envelope was recorded with connection-following delegated to the firmware-hopping sniffer. |
| SP | RFSAM-BLE-SP-02 | **PASSED** | auto | A 15-minute passive Find My sweep printed three distinct tracker advertisements, all three resolving to equipment the auditing team brought on site, with no unowned tag observed and none persisting across the two survey positions. |
| PHY | RFSAM-BLE-PHY-01 | **INCONCLUSIVE** | auto | Advertising frames on channel 37 decoded cleanly through demodulate to AA-correlate to de-whiten to CRC, but no data-channel PDU could be validated because the padlock opened no connection during the window and the channelised SDR path dropped samples above 10 channels. |
| LL | RFSAM-BLE-LL-01 | **FINDING** | assisted | Padlock advertises on a non-rotating public address with a constant Local Name token 'L8LOCK-0A31' and manufacturer data 0xFF carrying the same 4-byte serial across the whole 30-minute window, so no address randomisation is in play and the device is passively linkable. |
| LL | RFSAM-BLE-LL-02 | **INCONCLUSIVE** | assisted | Sniffle held a MAC-filtered watch on the advertising channels for 15 minutes and logged only ADV_IND from the target: no CONNECT_IND was ever transmitted, so the hop sequence was never latched and zero data-channel PDUs were captured. |
| CR | RFSAM-BLE-CR-01 | **FINDING** | manual | Captured a forced re-pairing with Sniffle; the SMP Pairing Request carries SC=0 with MITM=0 and NoInputNoOutput IO capability, i.e. LE Legacy Just Works, and crackle recovered TK=000000 and the LTK offline, decrypting the ATT traffic that carries the unlock command. |
| AT | RFSAM-BLE-AT-01 | **BLOCKED** | auto | Not attempted: the engagement does not authorise injection on this band. |
| AP | RFSAM-BLE-AP-01 | **FINDING** | manual | GATT enumeration over the CatSniffer virtual HCI reached the full table without pairing: Device Name, Firmware Revision, Serial Number and a proprietary status characteristic all read in the clear, while the actuating lock characteristic rejected an unauthenticated write with ATT error 0x05 Insufficient Authentication. |

## Findings

### RFSAM-BLE-CR-01: CRITICAL

Captured a forced re-pairing with Sniffle; the SMP Pairing Request carries SC=0 with MITM=0 and NoInputNoOutput IO capability, i.e. LE Legacy Just Works, and crackle recovered TK=000000 and the LTK offline, decrypting the ATT traffic that carries the unlock command.

Conditions: `attested_by=operator`, `tool=sniffle + wireshark (btsmp) + crackle`, `pairing_mode=LE Legacy`, `association_model=Just Works`, `sc_bit=0`, `mitm_flag=0`, `io_capability=NoInputNoOutput`, `tk=000000`, `ltk_recovered=True`, `session_decrypted=True`

Evidence: `loot/notes/ble-cr-01-pairing-attestation.md`

### RFSAM-BLE-IG-01: HIGH

Teardown and passive advertising fingerprint identify a Telink TLSR8253 controller on a bare-metal vendor SDK predating the November 2019 SMP fix; the part matches the SweynTooth Zero-LTK entry in the published corpus and the module vendor offers no patched firmware.

Conditions: `attested_by=operator`, `tool=fccid.io internal photos + bettercap ble.recon`, `soc=Telink TLSR8253`, `cve=CVE-2019-19194`, `corpus_checked=NVD + CISA ICS-ALERT-20-063-01`, `bsam_handoff=['BSAM-IG-01', 'BSAM-IG-02']`

Evidence: `loot/notes/ble-ig-01-soc-inventory.md`

### RFSAM-BLE-LL-01: MEDIUM

Padlock advertises on a non-rotating public address with a constant Local Name token 'L8LOCK-0A31' and manufacturer data 0xFF carrying the same 4-byte serial across the whole 30-minute window, so no address randomisation is in play and the device is passively linkable.

Conditions: `channels=[37, 38, 39]`, `window_s=1800`, `packets=3142`, `rssi_dbm=-57`, `distance_m=2.0`, `tool=sniffle`, `adapter=catsniffer`, `phy=LE 1M`, `adv_interval_ms=480`, `addr_type=public`

Command handed to the operator:

```
sniff_receiver.py -s /dev/ttyACM0 -o loot/captures/ble-ll-01_adv_ch37-39_1800s.pcap
```

Evidence: `loot/captures/ble-ll-01_adv_ch37-39_1800s.pcap`

### RFSAM-BLE-AP-01: MEDIUM

GATT enumeration over the CatSniffer virtual HCI reached the full table without pairing: Device Name, Firmware Revision, Serial Number and a proprietary status characteristic all read in the clear, while the actuating lock characteristic rejected an unauthenticated write with ATT error 0x05 Insufficient Authentication.

Conditions: `attested_by=operator`, `tool=catnip vhci + bluetoothctl + bleak`, `unauthenticated_reads=['0x2A00 Device Name', '0x2A26 Firmware Revision', '0x2A25 Serial Number']`, `unauthenticated_writes=rejected - ATT 0x05`, `corroborates=RFSAM-BLE-IG-01`

Evidence: `loot/notes/ble-ap-01-gatt-map.md`

## Limitations

What was not established, and why. Read this before reading the coverage table as comfort.

- **RFSAM-BLE-PHY-01** (inconclusive): Advertising frames on channel 37 decoded cleanly through demodulate to AA-correlate to de-whiten to CRC, but no data-channel PDU could be validated because the padlock opened no connection during the window and the channelised SDR path dropped samples above 10 channels. _Step 5 not satisfied: CRC-correct frames were obtained on an advertising channel only; no CONNECT_IND occurred in the 10-minute window and ice9 reported sustained dropped samples past 10 of 40 channels, so data-channel bit recovery is unproven rather than failed._
- **RFSAM-BLE-LL-02** (inconclusive): Sniffle held a MAC-filtered watch on the advertising channels for 15 minutes and logged only ADV_IND from the target: no CONNECT_IND was ever transmitted, so the hop sequence was never latched and zero data-channel PDUs were captured. _The padlock kept the session it had opened before the window began and never re-connected during the 900 s of observation, so no CONNECT_IND could be sniffed; the established-connection recovery path needs a wideband radio that is not in this kit._
- **RFSAM-BLE-AT-01** (blocked): Not attempted: the engagement does not authorise injection on this band. _tx_modes ['injection'] not authorised on this band (scope allows ['connection-oriented', 'interrogation']) - derived from the control's execution block, not from a hand-written exclusion_

## Tested and clean

- **RFSAM-BLE-SP-01**: HackRF One at 20 Msps resolves a ~20 MHz window, so only one of the three advertising channels is observable at a time; camping channel 37 recovered the target's advertising bursts and the capture envelope was recorded with connection-following delegated to the firmware-hopping sniffer.
- **RFSAM-BLE-SP-02**: A 15-minute passive Find My sweep printed three distinct tracker advertisements, all three resolving to equipment the auditing team brought on site, with no unowned tag observed and none persisting across the two survey positions.

