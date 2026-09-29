// MITRE ATT&CK entries referenced by RFSAM controls.
//
// Only techniques that a control actually assesses are listed; this is not a
// mirror of ATT&CK. URLs are version-pinned (v19) on purpose: ATT&CK renumbers
// and revokes between releases (T0855/T0856 became T1692.001/.002 in v19), and a
// permalink is what keeps a citation honest a year later. CISA's "Best Practices
// for MITRE ATT&CK Mapping" recommends exactly this.
//
// ATT&CK® is a registered trademark of The MITRE Corporation.
// © 2026 The MITRE Corporation. This work is reproduced and distributed with the
// permission of The MITRE Corporation.
export const attackVersion = 'v19.2';
export const attackRetrieved = '2026-09-23';

export const mitre = {
  // --- Enterprise
  'T1040':     { title: 'Network Sniffing', matrix: 'enterprise', url: 'https://attack.mitre.org/versions/v19/techniques/T1040/', rf: true, gapHint: "Already exercised by the LL controls; they should cite it." },
  'T1011':     { title: 'Exfiltration Over Other Network Medium', matrix: 'enterprise', url: 'https://attack.mitre.org/versions/v19/techniques/T1011/', rf: true, gapHint: "No control covers the radio as a covert egress channel (BLE/BTC/sub-GHz × AP)." },
  'T1011.001': { title: 'Exfiltration Over Bluetooth', matrix: 'enterprise', url: 'https://attack.mitre.org/versions/v19/techniques/T1011/001/', rf: true, gapHint: "Same gap, Bluetooth-specific." },
  'T1557':     { title: 'Adversary-in-the-Middle', matrix: 'enterprise', url: 'https://attack.mitre.org/versions/v19/techniques/T1557/', rf: true },
  'T1557.004': { title: 'Adversary-in-the-Middle: Evil Twin', matrix: 'enterprise', url: 'https://attack.mitre.org/versions/v19/techniques/T1557/004/', rf: true, gapHint: "No WIFI × AT control: evil twin is the clearest missing one." },
  'T1200':     { title: 'Hardware Additions', matrix: 'enterprise', url: 'https://attack.mitre.org/versions/v19/techniques/T1200/', rf: true, gapHint: "No control inventories unauthorised emitters against an authorised baseline (SP layer)." },
  'T1689':     { title: 'Downgrade Attack', matrix: 'enterprise', url: 'https://attack.mitre.org/versions/v19/techniques/T1689/', rf: true, gapHint: "The CR controls assess downgrade in practice; they should cite it." },
  'T1669':     { title: 'Wi-Fi Networks', matrix: 'enterprise', url: 'https://attack.mitre.org/versions/v19/techniques/T1669/', rf: true, gapHint: "Nothing covers what the attacker reaches after associating (WIFI × AP)." },
  'T1499.004': { title: 'Endpoint Denial of Service: Application or System Exploitation', matrix: 'enterprise', url: 'https://attack.mitre.org/versions/v19/techniques/T1499/004/', rf: true },
  'T1110.002': { title: 'Brute Force: Password Cracking', matrix: 'enterprise', url: 'https://attack.mitre.org/versions/v19/techniques/T1110/002/', rf: true, gapHint: "The CR controls recover keys offline; they should cite it." },
  // --- ICS
  'T0887':     { title: 'Wireless Sniffing', matrix: 'ics', url: 'https://attack.mitre.org/versions/v19/techniques/T0887/', rf: true, gapHint: "The SP and LL controls are this technique; they should cite it." },
  'T0860':     { title: 'Wireless Compromise', matrix: 'ics', url: 'https://attack.mitre.org/versions/v19/techniques/T0860/', rf: true },
  'T0848':     { title: 'Rogue Master', matrix: 'ics', url: 'https://attack.mitre.org/versions/v19/techniques/T0848/', rf: true, gapHint: "No rogue gateway/coordinator control for LoRaWAN or Zigbee (× AT)." },
  'T1692.001': { title: 'Unauthorized Message: Command Message', matrix: 'ics', url: 'https://attack.mitre.org/versions/v19/techniques/T1692/001/', rf: true },
  'T1692.002': { title: 'Unauthorized Message: Reporting Message', matrix: 'ics', url: 'https://attack.mitre.org/versions/v19/techniques/T1692/002/', rf: true, gapHint: "Reporting-spoof as a category exists only in ADS-B; not generalised." },
  'T1695.003': { title: 'Block Communications: Wi-Fi', matrix: 'ics', url: 'https://attack.mitre.org/versions/v19/techniques/T1695/003/', rf: true, gapHint: "No availability/jamming control per protocol beyond GNSS and BT Classic." },
  'M0806':     { title: 'Minimize Wireless Signal Propagation', matrix: 'ics', kind: 'mitigation', url: 'https://attack.mitre.org/versions/v19/mitigations/M0806/' },
  'M0802':     { title: 'Communication Authenticity', matrix: 'ics', kind: 'mitigation', url: 'https://attack.mitre.org/versions/v19/mitigations/M0802/' },
  // --- Mobile
  'T1638':     { title: 'Adversary-in-the-Middle', matrix: 'mobile', url: 'https://attack.mitre.org/versions/v19/techniques/T1638/', rf: true },
  'T1464':     { title: 'Network Denial of Service', matrix: 'mobile', url: 'https://attack.mitre.org/versions/v19/techniques/T1464/', rf: true },
};
