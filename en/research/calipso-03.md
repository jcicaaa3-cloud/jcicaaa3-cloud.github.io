---
layout: post
lang: en
title: "Calipso analysis (3): screenshots from the VM"
date: 2026-11-06 16:00:00 +0900
kind: malware
permalink: /en/research/calipso-03/
description: "Screenshot of .calipso file names left in a virtual machine"
---
VM screenshots from November 6. File names ended in `.calipso`, and a Calipso notice was up on the desktop.

<figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="File list in the VM with .calipso extensions" loading="lazy"></a><figcaption>Files with <code>.calipso</code> appended</figcaption></figure>

I didn't post the desktop screenshot. The [Triage run](https://tria.ge/261006-nzbfjaay5m/behavioral1) also has traces of a wallpaper setting, so I plan to line these up with logs later.

Not looked at yet: encryption algorithm, key handling, per-file modification times, registry and event log changes.

References: [Triage run](https://tria.ge/261006-nzbfjaay5m/behavioral1) · [PCRisk](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware) · [All screenshots]({{ '/en/evidence/' | relative_url }})
