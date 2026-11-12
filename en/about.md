---
layout: page
lang: en
title: About
permalink: /en/about/
description: "jcicaaa3: computer engineering undergraduate working on malware analysis and reverse engineering, ransomware analysis, YARA and MITRE ATT&CK detection, and machine learning malware detection and evaluation"
---
I'm a computer engineering student at Hankuk University of Foreign Studies, with a double major in Northeast Asian Diplomacy and Commerce. I work on security and AI together.

## What I do

- **Malware analysis and reverse engineering**: static analysis of Windows PE files in Ghidra. I took the Calipso ransomware apart from its encryption design (XChaCha20 + RSA-4096) to file discovery (MFT enumeration) and recovery inhibition. [Analysis v2.0]({{ '/en/research/calipso-v2/' | relative_url }})
- **Detection content**: turning analysis into IOCs, YARA rules, and MITRE ATT&CK mappings.
- **ML malware detection**: building a static detection model on EMBER2024 and comparing results across ransomware families. (in progress)
- **AI model development and evaluation**: built a computer vision model and a machine learning service; research on evaluating robot actions in spring 2026.

## The question I'm working on

Antivirus engines disagree on the same sample. In my robot research, changing the judging criterion flipped results between success and failure. So for detection models I want to pin down what counts as a successful detection: which false positive rate to hold, and which samples to test on.

## Tools

Ghidra · YARA · MITRE ATT&CK · Python · PowerShell · Git

## Contact

- Email: [jcicaaa3@gmail.com](mailto:jcicaaa3@gmail.com)
- GitHub: [jcicaaa3-cloud](https://github.com/jcicaaa3-cloud)
