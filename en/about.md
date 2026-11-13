---
layout: page
lang: en
title: About
permalink: /en/about/
description: "jcicaaa3: computer engineering undergraduate working on malware analysis and reverse engineering, ransomware analysis, YARA and MITRE ATT&CK detection, and machine learning malware detection and evaluation"
---
I'm a computer engineering student at Hankuk University of Foreign Studies, with a double major in Northeast Asian Diplomacy and Commerce. I work on security and AI together.

## What I do

- I do malware analysis and reverse engineering, mostly static analysis of Windows PE files in Ghidra. For the Calipso ransomware I went through the encryption design (XChaCha20 + RSA-4096), file discovery (MFT enumeration), and recovery inhibition. [Analysis v2.0]({{ '/en/research/calipso-v2/' | relative_url }})
- I write up the results as IOCs, YARA rules, and MITRE ATT&CK mappings.
- I'm also working on ML malware detection: building a static detection model on EMBER2024 and comparing results across ransomware families. (in progress)
- On the AI side, I built a computer vision model and a machine learning service, and did a research project on evaluating robot actions in spring 2026.

## What I'm interested in

Antivirus engines give different results for the same file. In my robot project last spring, changing the judging criterion could turn the same action from a success into a failure. Detection models are similar: the results depend on the false positive rate you fix and the samples you test on, so right now I'm looking at how to set those.

## Tools

Ghidra · YARA · MITRE ATT&CK · Python · PowerShell · Git

## Contact

- Email: [jcicaaa3@gmail.com](mailto:jcicaaa3@gmail.com)
- GitHub: [jcicaaa3-cloud](https://github.com/jcicaaa3-cloud)
