---
layout: post
lang: en
title: "HYFLOCK analysis (1): hashes and per-engine detection"
date: 2026-11-12 23:00:00 +0900
kind: malware
permalink: /en/research/hyflock-01/
description: "Hashes, file metadata, and VirusTotal per-engine detection results for a HYFLOCK Go carrier sample"
---
> First post in the HYFLOCK series. The plan is in [Next up: HYFLOCK]({{ '/en/research/hyflock-preview/' | relative_url }}).

Before opening the file itself, I'm writing down what can be checked from public information alone: hashes, file metadata, and VirusTotal detection results per engine. I haven't looked at the PE structure or the payload inside yet; that starts in the next post.

I don't upload the sample. Detection results change with scan date and engine updates, so please read the numbers below as of a lookup on 12 November 2026.

| Item | Value |
| --- | --- |
| MD5 | `3440c03e9c0ff4c9e916d8be021c1a40` |
| SHA-1 | `2374836f37c5a4ada114a0ced465dd2f9597b246` |
| SHA-256 | `b15482d0846ef997f9c049e77d85efeba4ab9b33550b4384052efeb1a3dcc8cc` |
| SSDeep | `49152:rZFcnnf3Srb/T2vO90d7HjmAFd4A64nsfJk8lm3gPKBBq0aD1RbJ/AREQjfWD3X+:M3/Sd6jfClXHKIbMG3ESeBb` |
| Authentihash | `5bf05e748fb55eced3df1cb0acc0fd434527c69f8c7b5256549f9431a9d6e480` |
| Size | `3,851,808 bytes` (about 3.7 MB) |
| Format | `PE32+ executable (console) x86-64, for MS Windows` |
| First submitted to VirusTotal | `2026-10-07 04:59:22 UTC` |
| Detection results checked | `2026-11-12` |

## What the metadata shows

- **The TimeStamp is 0.** The build time field is empty, so it says nothing about when the file was compiled.
- **The LinkerVersion is 3.** That matches what you commonly see in Windows binaries built with the Go toolchain. Whether it fits the Go carrier structure Check Point described is something I'll decide only after checking pclntab and the rest myself in the next post.
- **CodeSize is small relative to the file.** CodeSize is 726,528 bytes, while the whole file is about 3.85 MB. What fills the rest will only be clear after looking at the sections and overlay.
- **There is no debug information.** It shows as `No debug` and `stripped to external PDB`.
- **TrID only gives generic classes.** The top match is `Win64 Executable (generic)` at 37.0%, which isn't much use for telling the family.

## Detection per engine

**28 of 67 engines detected it.** Grouped by how the detection names are written, they split as follows. This grouping is based only on the name strings; it doesn't mean that is how each engine actually reached its verdict.

| Group | Engines | Engine (detection name) |
| --- | --- | --- |
| Names ransomware / Filecoder | 10 | Alibaba (`Ransom:Win64/Killav`), ESET-NOD32 (`Win64/Filecoder.AUT`), Ikarus (`Trojan-Ransom.Nishi`), Kaspersky (`UDS:Trojan-Ransom.Win64.Generic`), McAfeeD (`Trojan:Win/Ransom.P`), Microsoft (`Ransom:MSIL/Killav.VD!MTB`), Rising (`Ransom.Agent`), Tencent (`Win64.Trojan-Ransom.Generic`), Varist (`W64/Filecoder.QI.gen`), huorong (`Ransom/Qilin.a`) |
| ML / AI / reputation / confidence labels | 7 | AVG (`FileRepMalware`), Avast (`FileRepMalware`), CrowdStrike (`malicious_confidence_100%`), Elastic (`malicious (high confidence)`), Paloalto (`generic.ml`), SentinelOne (`Static AI - Malicious PE`), Symantec (`ML.Attribute.HighConfidence`) |
| Generic malicious / trojan labels | 11 | APEX, Bkav, Cylance, Cynet, Lionic, MaxSecure, Sangfor, Skyhigh, Sophos, TrellixENS, tehtris |

## What the detections show

- **Engines give it different family names.** Qilin (huorong), Nishi (Ikarus), and Killav (Alibaba, Microsoft) all appear. Several engines agree it's ransomware, but not on which family.
- **Microsoft's name contains `MSIL`.** MSIL is normally used for .NET binaries, yet nothing in the file type information points to .NET. I'll check in the next post whether a CLR header is actually present.
- **18 detections don't mention ransomware.** Of the 28, 18 are ML/reputation-style or generic malicious labels. Calling it malicious and classifying it as ransomware seem to be separate decisions for each engine.
- **39 engines didn't detect it.** I'm not guessing at the reasons for the misses in this post. I'll come back to them after comparing detection results with other builds of the same family and tying them to static features.

## Not done yet

- PE header, sections, entropy, and imports
- How the Go carrier relates to the payload inside
- Detection comparison with other HYFLOCK builds
- Check Point's findings vs. what I see myself

In the next post I'll open the file and look at the PE structure and the Go carrier.

References: [Check Point: HYFLOCK](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/) · [VirusTotal](https://www.virustotal.com/gui/file/b15482d0846ef997f9c049e77d85efeba4ab9b33550b4384052efeb1a3dcc8cc)
