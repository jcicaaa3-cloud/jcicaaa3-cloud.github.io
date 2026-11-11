---
layout: post
lang: en
title: "Calipso analysis (1): reading the public sandbox report"
date: 2026-11-05 11:00:00 +0900
permalink: /en/research/calipso-01/
description: "Notes from the public Triage run and PCRisk write-up of the Calipso ransomware"
---
A ransomware strain called Calipso was publicly reported in October 2026. To see what it does, I started with the public sandbox records and a vendor write-up. The execution records in this post are not from my own runs; they come from the [Triage report](https://tria.ge/261006-nzbfjaay5m/behavioral1) and the [PCRisk article](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware).

## The sample

| Item | Value |
| --- | --- |
| File name | `Calipso.exe` |
| SHA-256 | `9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed` |
| Format | Windows x64 PE |
| Size | about 7.7 MB |
| Extension after encryption | `.calipso` |
| Ransom note | `recovery.txt` |
| Triage report ID | `261006-nzbfjaay5m` |

<figure><a href="{{ '/assets/images/sample-metadata.webp' | relative_url }}"><img src="{{ '/assets/images/sample-metadata.webp' | relative_url }}" alt="Basic file information for the sample" loading="lazy"></a><figcaption>Checking the basic file information</figcaption></figure>

There's no guarantee every sample going by this name has the same code, so everything below refers to the sample with the hash above.

## Renamed files

The Triage Windows 10 run records 13,144 file renames, with `.calipso` appended to the names. That's a count of renames, though, so it doesn't tell you whether the contents of all 13,144 files were actually encrypted. I haven't looked at the encryption scheme or key handling yet.

## Commands that block recovery

The process log shows `vssadmin.exe`, `wmic.exe`, `wbadmin.exe`, and `bcdedit.exe`. All of them are Windows tools for shadow copies, backups, and recovery settings.

- `vssadmin`, `wmic`: delete shadow copies
- `wbadmin`: delete the backup catalog
- `bcdedit`: change recovery-related boot settings

The commands were run, but whether the deletions succeeded would need to be checked separately in the logs. In MITRE ATT&CK this falls under [T1490 Inhibit System Recovery](https://attack.mitre.org/techniques/T1490/).

## Event logs and wallpaper

There's also an attempt to clear event logs with `wevtutil.exe`, which wipes out records you'd want during an incident investigation. ATT&CK classifies this as [T1685.005 Clear Windows Event Logs](https://attack.mitre.org/techniques/T1685/005/) (formerly T1070.001).

The wallpaper changes too. Triage shows a setting pointing to `C:\ProgramData\calipso_wallpaper.png`, and PCRisk says it leaves a message and `recovery.txt`.

## Credentials and network

The automated analysis flags access to browser profiles and Windows credentials. I don't know yet whether any passwords were actually taken or sent out.

In the Windows 10 run I looked at, Requests, TCP, and UDP under Network were all 0. I'm only reading that as "no traffic in that run"; I don't know if it would be the same elsewhere.

## Next

Public records can't tell you what's going on inside the code, so next I checked the PE headers and sections and followed function references in Ghidra.

[Next: (2) PE structure and Ghidra]({{ '/en/research/calipso-02/' | relative_url }})

## References

- [Recorded Future Triage: behavioral analysis](https://tria.ge/261006-nzbfjaay5m/behavioral1) (rename count, processes, network)
- [Recorded Future Triage: static info](https://tria.ge/261006-nzbfjaay5m/static1)
- [PCRisk: Calipso ransomware](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)
- MITRE ATT&CK [T1490](https://attack.mitre.org/techniques/T1490/), [T1685.005](https://attack.mitre.org/techniques/T1685/005/)
