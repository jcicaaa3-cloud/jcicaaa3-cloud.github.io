---
layout: post
lang: en
title: "Up Next: HYFLOCK — What Do Antivirus Engines Actually Detect?"
lead: "After Calipso, I will examine HYFLOCK's changing executable structure and why antivirus detection results can differ."
topic: "Ransomware · Research preview"
date: 2026-11-08 21:05:00 +0900
permalink: /en/research/hyflock-preview/
description: "Preview of a static analysis of HYFLOCK ransomware: its Go carrier, embedded Rust payload, and differences in antivirus detections."
---
After documenting Calipso, I chose **HYFLOCK** as my next subject. This time, I want to look beyond the executable's structure and examine **why different antivirus products can return different results for the same sample**.

According to Check Point's research published on November 4, 2026, an early-October HYFLOCK build used a **Go-based carrier** containing a separate **Rust payload**. Subsequent builds also changed their execution and file-processing behavior.

Detection discrepancies interest me in particular. A missed detection by one engine does not establish that a sample universally evades antivirus protection. **Scan date, engine, and sample build** can all affect the result. I intend to record those details rather than treat a detection count as a permanent property of the malware.

### What I plan to examine

1. **Executable structure:** PE headers, sections, strings, and imports in the carrier.
2. **Embedded components:** The relationship between the Go carrier and the payload, using static-analysis evidence.
3. **Antivirus detection:** Differences across engines, documented alongside sample identifiers and observation dates.
4. **Comparison with prior research:** A clear distinction between published findings and my own observations.

**This is a preview, not a completed analysis.** I will not distribute live malware samples through this website or GitHub. The series will focus on public research and static-analysis evidence.

**Reference:** [Check Point — HYFLOCK Ransomware Evolves with New Builds and Encryption Weaknesses (2026-11-04)](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/)
