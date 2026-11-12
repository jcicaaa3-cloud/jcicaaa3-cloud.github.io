---
layout: page
lang: en
title: Projects
permalink: /en/projects/
description: "jcicaaa3's security and AI projects: Calipso static analysis, LiteRaceSegNet, Financial Risk Scoring, robot task evaluation"
---
Split into security and AI. Code and experiment data are in each GitHub repository.

## Security

### Calipso static analysis <small>v2.0</small>

Analyzed the encryption design (XChaCha20 + RSA-4096 OAEP), file discovery (MFT enumeration), recovery inhibition, and process killing in Ghidra, and wrote up IOCs and a YARA rule.

[Analysis v2.0]({{ '/en/research/calipso-v2/' | relative_url }}) · [Screenshots]({{ '/en/evidence/' | relative_url }})

### HYFLOCK detection comparison <small>planned</small>

The plan is to look at the Go carrier and Rust payload, then compare why antivirus engines disagree, recording the hash and scan date for each result.

[Plan]({{ '/en/research/hyflock-preview/' | relative_url }})

### RSA + AES file encryption tool <small>in design</small>

A PowerShell and C# tool that encrypts files with AES-256-GCM and the AES key with RSA-OAEP.

[Design notes]({{ '/en/research/hybrid-cryptography/' | relative_url }})

## AI

### LiteRaceSegNet

A lightweight segmentation model for road cracks and potholes. In the V13 experiments it reached 0.8072 mIoU with about 0.125M parameters, at 3.097 ms per image on CUDA.

[Details]({{ '/en/projects/literacesegnet/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-)

### Financial Risk Scoring

An ML service that predicts next-quarter risk signals from quarterly financial data. I built everything from input validation and model training to a FastAPI prediction API. The data is synthetic.

[Details]({{ '/en/projects/financial-risk/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL)

### Robot task success/failure evaluation <small>spring 2026</small>

A research project on what criteria to use when calling a robot's action a success or a failure, and how the results change with the criteria. 80 runs and 874 analyzed cases.

[Details]({{ '/en/projects/robot-evaluation/' | relative_url }})
