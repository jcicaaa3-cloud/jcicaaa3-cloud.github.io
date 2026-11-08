---
layout: page
lang: en
title: LiteRaceSegNet
permalink: /en/projects/literacesegnet/
description: "LiteRaceSegNet: lightweight road-damage segmentation with measured performance and ablation results"
---
<link rel="stylesheet" href="{{ '/assets/css/research-projects.css' | relative_url }}">
<div class="rp rp-detail"><p class="rp-eyebrow">COMPUTER VISION / CASE STUDY</p><p class="rp-lead">A lightweight segmentation model for cracks and potholes in road imagery.</p><p><a href="{{ '/en/projects/' | relative_url }}">← Projects</a> · <a href="https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-">Code / experiments</a></p></div>

## Research problem

Irregularly shaped damage, especially cracks and potholes, is difficult to delineate when a segmentation network must remain small. LiteRaceSegNet is a lightweight CNN-based architecture combining detail and context features with boundary-guided fusion.

## Reported validation results

| Metric | Result | Scope |
| --- | ---: | --- |
| mIoU | **0.8072** | AWS validation protocol |
| Damage IoU | **0.7113** | Same validation setup |
| Parameters | **~0.125M** | Model profiling |
| CUDA inference time | **3.097 ms/image** | Measured CUDA profile |
| Ablations | **7 configurations** | Controlled comparisons |
| Aggregated boundary IoU | **0.3212** | 32×32 / 64×64 boundary patches |

These figures are from the **V13 experiments**. The corresponding repository contains evaluation protocols and comparison results.

## Implementation and validation

- Checked image–mask pairs, filenames, dimensions, and missing inputs before evaluation.
- Compared seven model configurations under the same experimental protocol.
- Overlaid predictions on source images to inspect boundaries and small damaged regions.
- Reviewed ten visualization examples to assess errors not fully represented by aggregate metrics.

## What the results indicate

Boundary-specific evaluation revealed limitations that are less apparent from overall mIoU alone. Predictions were therefore inspected visually alongside quantitative metrics.

**Links:** [LiteRaceSegNet code](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-) · [V13 experiment portal](https://jcicaaa3-cloud.github.io/LiteRaceSegNet-V13-Portal-Clean/)

[← Back to projects]({{ '/en/projects/' | relative_url }})
