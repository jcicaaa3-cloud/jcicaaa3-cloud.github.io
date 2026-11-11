---
layout: post
lang: en
title: "Calipso analysis (3): screenshots from the VM"
date: 2026-11-06 16:00:00 +0900
permalink: /en/research/calipso-03/
description: "The .calipso file names and wallpaper change left in a virtual machine"
---
These are screenshots I took in a VM on November 6. Many file names ended in `.calipso`, and a Calipso notice was showing on the desktop. I kept them so I could match them against logs later.

<figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="File list in the VM with .calipso extensions" loading="lazy"></a><figcaption>Files with <code>.calipso</code> appended to their names</figcaption></figure>

You can see the extension change on screen, but you'd have to open the files to know how much of their contents was actually encrypted.

## Wallpaper

I also saw the wallpaper change, but I didn't post that screenshot. The screen alone doesn't tell you which process or API changed it. The public [Triage run](https://tria.ge/261006-nzbfjaay5m/behavioral1) also shows traces of a wallpaper setting, but that's a separate source from what I saw in my VM.

## Why three posts

| Post | Source |
| --- | --- |
| [(1) Public sandbox]({{ '/en/research/calipso-01/' | relative_url }}) | Public Triage run report |
| [(2) Static analysis]({{ '/en/research/calipso-02/' | relative_url }}) | PE structure, Ghidra code references |
| (3) VM screenshots | My own screenshots and notes |

If I mixed what I read in reports with what I saw myself in one post, I thought I'd lose track of where each piece came from, so I split them up.

I haven't looked at the encryption algorithm, key handling, per-file modification times, or registry and event log changes yet. I'll add to this when I have the data.

## References

- [Recorded Future Triage: Calipso run](https://tria.ge/261006-nzbfjaay5m/behavioral1)
- [PCRisk: Calipso ransomware](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)

[All screenshots]({{ '/en/evidence/' | relative_url }})
