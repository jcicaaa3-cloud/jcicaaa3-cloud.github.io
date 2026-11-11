---
layout: page
lang: en
title: Projects
permalink: /en/projects/
description: "jcicaaa3's computer vision, machine learning, and robot evaluation projects, plus ongoing security analysis"
---
Projects I've worked on so far. Code and experiment data are in each GitHub repository.

## LiteRaceSegNet

A lightweight segmentation model for road cracks and potholes. In the V13 experiments it reached 0.8072 mIoU with about 0.125M parameters, at 3.097 ms per image on CUDA.

[Details]({{ '/en/projects/literacesegnet/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-)

## Financial Risk Scoring

An ML service that predicts next-quarter risk signals from quarterly financial data. I built everything from input validation and model training to a FastAPI prediction API. The data is synthetic.

[Details]({{ '/en/projects/financial-risk/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL)

## Robot task success/failure evaluation

My graduation research on what criteria to use when calling a robot's action a success or a failure, and how the results change with the criteria. 80 runs and 874 analyzed cases; I'm still writing it up.

[Details]({{ '/en/projects/robot-evaluation/' | relative_url }})

## Calipso static analysis

Ongoing security work. I'm writing up the hash check, PE sections and entry point, and the Windows API calls I found in Ghidra.

[Posts]({{ '/en/research/' | relative_url }}) · [Screenshots]({{ '/en/evidence/' | relative_url }})
