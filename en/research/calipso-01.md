---
layout: post
lang: en
title: "Calipso analysis (1): reading the public sandbox report"
date: 2026-11-05 11:00:00 +0900
permalink: /en/research/calipso-01/
description: "Notes from the public Triage run and PCRisk write-up of the Calipso ransomware"
---
Calipso is a ransomware strain that was publicly reported in October 2026. Before opening the sample myself, I read the Triage run and the PCRisk write-up. All execution records in this post are from Triage (Windows 10).

| Item | Value |
| --- | --- |
| File name | `Calipso.exe` |
| SHA-256 | `9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed` |
| Format | Windows x64 PE, about 7.7 MB |
| Extension | `.calipso` |
| Ransom note | `recovery.txt` |
| Triage ID | `261006-nzbfjaay5m` |

<figure><a href="{{ '/assets/images/sample-metadata.webp' | relative_url }}"><img src="{{ '/assets/images/sample-metadata.webp' | relative_url }}" alt="Basic file information for the sample" loading="lazy"></a><figcaption>Basic file info</figcaption></figure>

## What Triage shows

13,144 file renames, with `.calipso` appended to the new names. That's a rename count, so it may differ from the number of files actually encrypted.

The process list has these commands:

- `vssadmin`, `wmic`: delete shadow copies
- `wbadmin`: delete the backup catalog
- `bcdedit`: change recovery-related boot settings
- `wevtutil`: clear event logs

In ATT&CK terms that's [T1490](https://attack.mitre.org/techniques/T1490/) (Inhibit System Recovery) and [T1685.005](https://attack.mitre.org/techniques/T1685/005/) (Clear Windows Event Logs, formerly T1070.001).

There's also a setting that points the wallpaper to `C:\ProgramData\calipso_wallpaper.png`, and detections for access to browser profiles and Windows credentials. Requests, TCP, and UDP under Network were all 0.

The PCRisk write-up mentions `recovery.txt` and the message shown on the desktop.

Next, I opened the executable itself. → [(2) PE structure and Ghidra]({{ '/en/research/calipso-02/' | relative_url }})

References: [Triage behavioral](https://tria.ge/261006-nzbfjaay5m/behavioral1) · [Triage static](https://tria.ge/261006-nzbfjaay5m/static1) · [PCRisk](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)
