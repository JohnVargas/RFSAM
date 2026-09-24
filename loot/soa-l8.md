# Statement of Applicability

**Engagement** `L8-2026-014` · **assessor role** `auditor` · **jurisdiction** `PE` · **mode** `active`

**Mandates held:** `written-authorisation`

RFSAM describes what can be assessed. It does not decide what you may lawfully do:
that turns on the mandate and the jurisdiction declared above. This statement records
a decision for all 51 controls in the corpus, including the ones excluded —
an exclusion without a reason is not a decision.

**10 applicable · 41 excluded · 0 undetermined**

> **SIMULATED ENGAGEMENT** — not a real assessment.

## Applicable (10)

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
| `RFSAM-RFID-CR-01` | CR | system-ownership/written-authorisation · credential-ownership/written-authorisation |
| `RFSAM-RFID-SP-01` | SP | system-ownership/written-authorisation · credential-ownership/written-authorisation |

## Excluded (41)

| control | layer | reason |
|---|---|---|
| `RFSAM-ADSB-LL-01` | LL | ADSB is not among the assessed protocols |
| `RFSAM-ADSB-PHY-01` | PHY | ADSB is not among the assessed protocols |
| `RFSAM-BLE-AT-01` | AT | transmits ['injection'], which this band does not authorise (scope allows ['interrogation', 'connection-oriented']) - Escaneo activo y conexion como cliente GATT autorizados sobre la cerradura de prueba. Inyeccion y hijack no. |
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
| `RFSAM-RFID-AT-01` | AT | transmits ['rogue-infrastructure'], which this band does not authorise (scope allows ['interrogation']) - Interrogacion permitida unicamente sobre las tarjetas de prueba entregadas por el cliente. |
| `RFSAM-SUBG-AT-01` | AT | SUBG is not among the assessed protocols |
| `RFSAM-SUBG-CR-01` | CR | SUBG is not among the assessed protocols |
| `RFSAM-SUBG-LL-01` | LL | SUBG is not among the assessed protocols |
| `RFSAM-SUBG-PHY-01` | PHY | SUBG is not among the assessed protocols |
| `RFSAM-SUBG-SP-01` | SP | SUBG is not among the assessed protocols |
| `RFSAM-THREAD-CR-01` | CR | THREAD is not among the assessed protocols |
| `RFSAM-THREAD-LL-01` | LL | THREAD is not among the assessed protocols |
| `RFSAM-UWB-AT-01` | AT | UWB is not among the assessed protocols |
| `RFSAM-UWB-PHY-01` | PHY | UWB is not among the assessed protocols |
| `RFSAM-WIFI-CR-01` | CR | transmits ['injection', 'interrogation'], which this band does not authorise (scope allows nothing) - Solo captura en modo monitor. El cliente NO autoriza deauth ni inyeccion en horario laboral. |
| `RFSAM-WIFI-LL-01` | LL | transmits ['injection'], which this band does not authorise (scope allows nothing) - Solo captura en modo monitor. El cliente NO autoriza deauth ni inyeccion en horario laboral. |
| `RFSAM-WIFI-SP-01` | SP | transmits ['injection', 'interrogation'], which this band does not authorise (scope allows nothing) - Solo captura en modo monitor. El cliente NO autoriza deauth ni inyeccion en horario laboral. |
| `RFSAM-ZIGBEE-CR-01` | CR | ZIGBEE is not among the assessed protocols |
| `RFSAM-ZIGBEE-LL-01` | LL | ZIGBEE is not among the assessed protocols |
| `RFSAM-ZIGBEE-SP-01` | SP | ZIGBEE is not among the assessed protocols |
| `RFSAM-ZWAVE-CR-01` | CR | ZWAVE is not among the assessed protocols |
| `RFSAM-ZWAVE-SP-01` | SP | ZWAVE is not among the assessed protocols |

---

Generated 2026-09-23T18:42:38 from `loot/scope-l8-ejemplo.json` by `runner/soa.py`.
