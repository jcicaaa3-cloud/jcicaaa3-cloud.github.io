---
layout: page
lang: en
title: LiteRaceSegNet
permalink: /en/projects/literacesegnet/
description: "LiteRaceSegNet, a lightweight segmentation model for road cracks and potholes: architecture and results"
---
A lightweight segmentation model for road cracks and potholes. Code and experiment data are on [GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-).

## Problem

Damage with irregular edges, like cracks and potholes, tends to lose fine detail as the model gets smaller. LiteRaceSegNet is a lightweight CNN that combines detail/context features with boundary-guided fusion.

## Results (V13)

| Metric | Value | Scope |
| --- | ---: | --- |
| mIoU | 0.8072 | AWS validation protocol |
| Damage IoU | 0.7113 | Same validation protocol |
| Parameters | ~0.125M | Model profile |
| CUDA latency | 3.097 ms/image | Measured CUDA profile |
| Ablation | 7 variants | Same conditions |
| Aggregate IoU near boundaries | 0.3212 | 32×32 / 64×64 boundary patches |

The full evaluation setup and comparisons are in the repository and on the [results portal](https://jcicaaa3-cloud.github.io/LiteRaceSegNet-V13-Portal-Clean/).

## What I checked

- Input conditions such as missing images or masks and mismatched names or sizes
- An ablation running 7 model variants through the same procedure
- Boundaries and small damaged regions, by overlaying predicted masks on the source images
- Errors the metrics don't show, using a visualization set of 10 images

Measuring IoU near boundaries separately from overall mIoU showed weaker performance on damage with complex edges, so I also compared predicted masks for 10 images by eye.

[← Projects]({{ '/en/projects/' | relative_url }})
