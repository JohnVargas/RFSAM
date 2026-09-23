// MITRE FiGHT (5G Hierarchy of Threats) entries referenced by RFSAM controls.
//
// Kept separate from the ATT&CK registry because the two corpora are versioned
// independently and their id spaces only partly overlap: FiGHT's FGT5xxx core has
// no ATT&CK counterpart at all, and its .5xx sub-techniques hang off ATT&CK
// parents that have no such sub-technique. Data source: fight.yaml in
// github.com/mitre/FiGHT (Apache-2.0).
export const fightBuild = '2025-11-14';
export const fightRetrieved = '2026-09-23';

export const fight = {
  'FGT1583.501': { rf: true, gapHint: "No LTE/NR5G x AT control assessing exposure to a false base station.", title: 'Acquire Infrastructure: False Base Station Or Access Point', url: 'https://fight.mitre.org/techniques/FGT1583.501/' },
  'FGT1562.501': { rf: true, gapHint: "No control assesses bid-down resistance.", title: 'Impair Defenses: Bid Down UE', url: 'https://fight.mitre.org/techniques/FGT1562.501/' },
  'FGT1600.501': { rf: true, gapHint: "No LTE-CR or NR5G-CR control exists at all.", title: 'Weaken Encryption: Radio Interface', url: 'https://fight.mitre.org/techniques/FGT1600.501/' },
  'FGT5009.001': { rf: true, gapHint: "Null integrity on the radio interface is not assessed anywhere.", title: 'Weaken Integrity: Radio Interface', url: 'https://fight.mitre.org/techniques/FGT5009.001/' },
  'FGT1040.501': { rf: true, gapHint: "Covered in practice by LTE-LL-01 and NR5G-LL-01; they should cite it.", title: 'Network Sniffing: Radio Interface', url: 'https://fight.mitre.org/techniques/FGT1040.501/' },
  'FGT1557.501': { rf: true, gapHint: "No AT layer on any cellular protocol.", title: 'Adversary-in-the-Middle: Radio Interface', url: 'https://fight.mitre.org/techniques/FGT1557.501/' },
  'FGT5012.001': { rf: true, gapHint: "No passive UE-geolocation control.", title: 'Locate UE: Passive Radio Signals Observation', url: 'https://fight.mitre.org/techniques/FGT5012.001/' },
  'FGT5012.003': { rf: true, gapHint: "5G-GUTI reuse and identifier linkability are not assessed.", title: 'Locate UE: 5G-GUTI Reuse', url: 'https://fight.mitre.org/techniques/FGT5012.003/' },
  'FGT5012.007': { rf: true, gapHint: "Silent or spoofed paging is not assessed.", title: 'Locate UE: Silent Or Spoofed Paging', url: 'https://fight.mitre.org/techniques/FGT5012.007/' },
  'FGT5035':     { rf: true, gapHint: "Cellular jamming has no control; only GNSS does.", title: 'Radio Reception Degradation', url: 'https://fight.mitre.org/techniques/FGT5035/' },
  'FGT1642.501': { rf: true, gapHint: "Spoofed broadcast that blocks attach is not assessed.", title: 'Endpoint Denial of Service: Transmit Spoofed Broadcast Message', url: 'https://fight.mitre.org/techniques/FGT1642.501/' },
};
