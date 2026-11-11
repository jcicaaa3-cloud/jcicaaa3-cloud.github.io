---
layout: post
lang: en
title: "Next up: HYFLOCK"
date: 2026-11-08 21:05:00 +0900
permalink: /en/research/hyflock-preview/
description: "HYFLOCK ransomware is next after Calipso: plans to look at its Go carrier, Rust payload, and differences in antivirus detection"
---
After Calipso, the next sample I'm looking at is HYFLOCK. Along with the executable's structure, this time I also want to look at why different antivirus products give different results.

HYFLOCK is a ransomware family that has changed builds several times recently. According to [Check Point's analysis](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/) from November 4, the early-October version had a Go-based carrier with a separate Rust payload inside, and later builds changed how it runs and how it handles files.

I'm especially curious about detection. Some engines catch it and some don't, but results can vary with the scan date, the engine's detection method, and the sample version. So when I compare them I plan to record the sample hash and scan date alongside each result.

## Plan

1. PE headers, sections, strings, and imports of the carrier
2. How the Go executable relates to the payload inside it
3. Differences in detection between engines (with sample hash and scan date)
4. Comparing what Check Point reported with what I see myself

I haven't started the analysis yet, so this is just the plan. I won't upload samples to the blog or GitHub.

## References

- [Check Point: HYFLOCK Ransomware Evolves with New Builds and Encryption Weaknesses](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/) (2026-11-04)
