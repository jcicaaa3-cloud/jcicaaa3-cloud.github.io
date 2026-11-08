---
layout: page
lang: en
title: Financial Risk Scoring
permalink: /en/projects/financial-risk/
description: "Machine learning service with synthetic quarterly financial data, validation, temporal evaluation, and FastAPI"
---
<link rel="stylesheet" href="{{ '/assets/css/research-projects.css' | relative_url }}">
<div class="rp rp-detail"><p class="rp-eyebrow">MACHINE LEARNING / SERVICE DESIGN</p><p class="rp-lead">A machine learning API for quarterly financial data.</p><p><a href="{{ '/en/projects/' | relative_url }}">← Projects</a> · <a href="https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL">Source code</a></p></div>

## Overview

I built a sample service to estimate a next-quarter risk indicator from **synthetic financial data**. The Python/FastAPI implementation covers input validation, baseline model comparison, and single-record and batch inference.

> The dataset is synthetic. This is an engineering demonstration, not an investment decision tool.

## Components

1. **Data contracts:** Validate mandatory CSV fields, data types, and missing values.
2. **Feature engineering:** Organize company–quarter observations and calculate financial ratios and quarter-on-quarter changes.
3. **Validation:** Use chronological splits and walk-forward evaluation to reduce the risk of future-information leakage.
4. **Baselines:** Compare Dummy, Logistic Regression, and Random Forest models.
5. **API:** Provide prediction endpoints and supporting report artifacts through FastAPI.

## Temporal validation

Quarterly datasets require particular care: information from a future reporting period should not enter earlier training folds. I therefore used chronological splitting and walk-forward evaluation.

The browser demonstration is a separate sample implementation rather than the FastAPI backend itself.

**Repository:** [Financial Risk Scoring Service](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL)

[← Back to projects]({{ '/en/projects/' | relative_url }})
