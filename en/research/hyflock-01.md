---
layout: post
lang: en
title: "HYFLOCK analysis (1): hashes and per-engine detection"
date: 2026-11-12 23:00:00 +0900
kind: malware
permalink: /en/research/hyflock-01/
description: "Hashes and VirusTotal per-engine detection results for a HYFLOCK sample"
---
This is HYFLOCK, from the [plan post]({{ '/en/research/hyflock-preview/' | relative_url }}). Before opening the file, I'm noting the hashes and the VirusTotal detections.

The detections come from the VirusTotal report submitted on 2026-10-07, which I checked on November 12. A rescan may give different numbers. The sample isn't uploaded anywhere.

| Item | Value |
| --- | --- |
| MD5 | `3440c03e9c0ff4c9e916d8be021c1a40` |
| SHA-1 | `2374836f37c5a4ada114a0ced465dd2f9597b246` |
| SHA-256 | `b15482d0846ef997f9c049e77d85efeba4ab9b33550b4384052efeb1a3dcc8cc` |
| SSDeep | `49152:rZFcnnf3Srb/T2vO90d7HjmAFd4A64nsfJk8lm3gPKBBq0aD1RbJ/AREQjfWD3X+:M3/Sd6jfClXHKIbMG3ESeBb` |
| Authentihash | `5bf05e748fb55eced3df1cb0acc0fd434527c69f8c7b5256549f9431a9d6e480` |
| Size | `3,851,808 bytes` |
| Format | `PE32+ executable (console) x86-64 (stripped to external PDB), for MS Windows` |
| TimeStamp | `0000:00:00 00:00:00` |
| LinkerVersion | `3` |
| CodeSize | `726528` |
| EntryPoint | `0x628a0` |
| VirusTotal report submitted | `2026-10-07 04:59:22 UTC` |
| Checked on | `2026-11-12` |

## File info

The TimeStamp is 0, so there's no build time to read. LinkerVersion 3 is common in Windows executables built with Go. [Check Point's post](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/) says the early-October build is a Go-based carrier; I'll check whether this file is one when I open it.

CodeSize is 726,528 bytes and the file is 3.85 MB. I'll need the section list to see what the rest is.

## Detection per engine

28 of 67 engines flagged it.

| Engine | Detection name |
| --- | --- |
| APEX | `Malicious` |
| AVG | `FileRepMalware [Misc]` |
| Alibaba | `Ransom:Win64/Killav.1bb95b75` |
| Avast | `FileRepMalware [Misc]` |
| Bkav | `W32.Malware.E568AD45` |
| CrowdStrike | `win/malicious_confidence_100% (W)` |
| Cylance | `Unsafe` |
| Cynet | `Malicious (score: 100)` |
| ESET-NOD32 | `Win64/Filecoder.AUT trojan` |
| Elastic | `malicious (high confidence)` |
| Ikarus | `Trojan-Ransom.Nishi` |
| Kaspersky | `UDS:Trojan-Ransom.Win64.Generic` |
| Lionic | `Trojan.Win32.Generic.j!c` |
| MaxSecure | `Trojan.Malware.300983.susgen` |
| McAfeeD | `Trojan:Win/Ransom.P` |
| Microsoft | `Ransom:MSIL/Killav.VD!MTB` |
| Paloalto | `generic.ml` |
| Rising | `Ransom.Agent!1.129F5 (CLASSIC)` |
| Sangfor | `Trojan.Win32.Save.a` |
| SentinelOne | `Static AI - Malicious PE` |
| Skyhigh | `BehavesLike.Win64.Generic.wh` |
| Sophos | `Mal/Generic-S` |
| Symantec | `ML.Attribute.HighConfidence` |
| Tencent | `Win64.Trojan-Ransom.Generic.Zolw` |
| TrellixENS | `Artemis!3440C03E9C0F` |
| Varist | `W64/Filecoder.QI.gen!Eldorado` |
| huorong | `Ransom/Qilin.a` |
| tehtris | `Generic.Malware` |

Ten engines have Ransom or Filecoder in the name (Alibaba, ESET-NOD32, Ikarus, Kaspersky, McAfeeD, Microsoft, Rising, Tencent, Varist, huorong). The other 18 names don't mention ransomware: `generic.ml`, `Static AI - Malicious PE`, `FileRepMalware`, `Mal/Generic-S`, and so on.

Even the engines that call it ransomware use different names. huorong says Qilin, Ikarus says Nishi, and Alibaba and Microsoft say Killav.

Microsoft's name has `MSIL` in it. That's normally for .NET files, but the format line says nothing about .NET. When I open the file, I'll start by checking for a CLR header.

## Next

- PE header, sections, imports, strings
- How the Go executable relates to the payload inside it
- Detection results for other builds
- Check Point's findings vs. what I see myself

References: [Check Point's post](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/) · [VirusTotal](https://www.virustotal.com/gui/file/b15482d0846ef997f9c049e77d85efeba4ab9b33550b4384052efeb1a3dcc8cc)
