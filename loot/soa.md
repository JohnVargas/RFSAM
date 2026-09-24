# Statement of Applicability

**Engagement** `DEMO-2026-001` · **assessor role** `auditor` · **jurisdiction** `PE` · **mode** `active`

**Mandates held:** `written-authorisation`

RFSAM describes what can be assessed. It does not decide what you may lawfully do:
that turns on the mandate and the jurisdiction declared above. This statement records
a decision for all 51 controls in the corpus, including the ones excluded —
an exclusion without a reason is not a decision.

**8 applicable · 43 excluded · 0 undetermined**

> **SIMULATED ENGAGEMENT** — not a real assessment.

## Applicable (8)

| control | layer | requirements met |
|---|---|---|
| `RFSAM-BLE-AP-01` | AP | system-ownership/written-authorisation |
| `RFSAM-BLE-CR-01` | CR | system-ownership/written-authorisation |
| `RFSAM-BLE-IG-01` | IG | system-ownership/written-authorisation |
| `RFSAM-BLE-LL-01` | LL | system-ownership/written-authorisation |
| `RFSAM-BLE-LL-02` | LL | system-ownership/written-authorisation |
| `RFSAM-BLE-PHY-01` | PHY | system-ownership/written-authorisation |
| `RFSAM-BLE-SP-01` | SP | system-ownership/written-authorisation |
| `RFSAM-BLE-SP-02` | SP | system-ownership/written-authorisation |

## Excluded (43)

| control | layer | reason |
|---|---|---|
| `RFSAM-ADSB-LL-01` | LL | ADSB is not among the assessed protocols |
| `RFSAM-ADSB-PHY-01` | PHY | ADSB is not among the assessed protocols |
| `RFSAM-BLE-AT-01` | AT | transmits ['injection'], which this band does not authorise (scope allows ['connection-oriented', 'interrogation']) - Receive-only for observation, plus two authorised transmit modes on the bench unit: an active scan (SCAN_REQ) and a normal GATT client opening a link, as any phone would. Injection, jamming and hijack are not authorised. tx_modes is the only authority: an empty list means no transmission. |
| `RFSAM-BTC-AP-01` | AP | BTC is not among the assessed protocols |
| `RFSAM-BTC-AT-01` | AT | BTC is not among the assessed protocols |
| `RFSAM-BTC-CR-01` | CR | BTC is not among the assessed protocols |
| `RFSAM-BTC-IG-01` | IG | BTC is not among the assessed protocols |
| `RFSAM-BTC-LL-01` | LL | BTC is not among the assessed protocols |
| `RFSAM-BTC-SP-01` | SP | BTC is not among the assessed protocols |
| `RFSAM-GNSS-AT-01` | AT | GNSS is not among the assessed protocols |
| `RFSAM-GNSS-SP-01` | SP | GNSS is not among the assessed protocols |
| `RFSAM-GSM-CR-01` | CR | GSM is not among the assessed protocols |
| `RFSAM-GSM-SP-01` | SP | GSM is not among the assessed protocols |
| `RFSAM-LORA-CR-01` | CR | LORA is not among the assessed protocols |
| `RFSAM-LORA-LL-01` | LL | LORA is not among the assessed protocols |
| `RFSAM-LORA-PHY-01` | PHY | LORA is not among the assessed protocols |
| `RFSAM-LORA-SP-01` | SP | LORA is not among the assessed protocols |
| `RFSAM-LTE-IG-01` | IG | LTE is not among the assessed protocols |
| `RFSAM-LTE-LL-01` | LL | LTE is not among the assessed protocols |
| `RFSAM-LTE-PHY-01` | PHY | LTE is not among the assessed protocols |
| `RFSAM-LTE-SP-01` | SP | LTE is not among the assessed protocols |
| `RFSAM-NR5G-LL-01` | LL | NR5G is not among the assessed protocols |
| `RFSAM-NR5G-SP-01` | SP | NR5G is not among the assessed protocols |
| `RFSAM-RFID-AT-01` | AT | RFID is not among the assessed protocols |
| `RFSAM-RFID-CR-01` | CR | RFID is not among the assessed protocols |
| `RFSAM-RFID-SP-01` | SP | RFID is not among the assessed protocols |
| `RFSAM-SUBG-AT-01` | AT | SUBG is not among the assessed protocols |
| `RFSAM-SUBG-CR-01` | CR | SUBG is not among the assessed protocols |
| `RFSAM-SUBG-LL-01` | LL | SUBG is not among the assessed protocols |
| `RFSAM-SUBG-PHY-01` | PHY | SUBG is not among the assessed protocols |
| `RFSAM-SUBG-SP-01` | SP | SUBG is not among the assessed protocols |
| `RFSAM-THREAD-CR-01` | CR | THREAD is not among the assessed protocols |
| `RFSAM-THREAD-LL-01` | LL | THREAD is not among the assessed protocols |
| `RFSAM-UWB-AT-01` | AT | UWB is not among the assessed protocols |
| `RFSAM-UWB-PHY-01` | PHY | UWB is not among the assessed protocols |
| `RFSAM-WIFI-CR-01` | CR | WIFI is not among the assessed protocols |
| `RFSAM-WIFI-LL-01` | LL | WIFI is not among the assessed protocols |
| `RFSAM-WIFI-SP-01` | SP | WIFI is not among the assessed protocols |
| `RFSAM-ZIGBEE-CR-01` | CR | ZIGBEE is not among the assessed protocols |
| `RFSAM-ZIGBEE-LL-01` | LL | ZIGBEE is not among the assessed protocols |
| `RFSAM-ZIGBEE-SP-01` | SP | ZIGBEE is not among the assessed protocols |
| `RFSAM-ZWAVE-CR-01` | CR | ZWAVE is not among the assessed protocols |
| `RFSAM-ZWAVE-SP-01` | SP | ZWAVE is not among the assessed protocols |

---

Generated 2026-09-23T18:43:27 from `loot/scope.json` by `runner/soa.py`.
