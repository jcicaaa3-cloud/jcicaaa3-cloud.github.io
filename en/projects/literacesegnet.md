---
layout: page
lang: en
title: LiteRaceSegNet
permalink: /en/projects/literacesegnet/
description: "LiteRaceSegNet, a lightweight segmentation model for road cracks and potholes: architecture and results"
---
A lightweight segmentation model for road cracks and potholes. Code and experiment data are on [GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-).

Cracks and potholes have irregular edges, and the smaller the model, the more that detail gets smeared. So I built it as a lightweight CNN combining detail/context features with boundary-guided fusion.

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

IoU near boundaries came out at 0.3212, well below the overall mIoU. That's where damage with complex edges loses performance, so I also compared 10 images with predicted masks overlaid on the originals by eye.

Other things I did:

- Checked for missing images or masks and mismatched names or sizes
- Ablation over 7 model variants (same procedure)

[← Projects]({{ '/en/projects/' | relative_url }})
