---
layout: post
lang: en
title: "Next up: HYFLOCK"
date: 2026-11-08 21:05:00 +0900
kind: malware
permalink: /en/research/hyflock-preview/
description: "HYFLOCK ransomware is next after Calipso: Go carrier, Rust payload, and differences in detection between engines"
---
After Calipso, I'm going to look at HYFLOCK.

According to [Check Point's post](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/) from November 4, the early-October build had a Rust payload inside a Go-based carrier, and later builds changed how it runs and how it handles files.

Besides the structure, I want to look at why antivirus engines disagree on it. Results also shift with scan date and sample version, so I'll note the hash and scan date next to each result.

Plan:

1. PE header, sections, strings, and imports of the carrier
2. How the Go executable relates to the payload inside it
3. Detection results per engine
4. Check Point's findings vs. what I see myself

I won't upload samples.
