---
layout: page
lang: en
title: Financial Risk Scoring
permalink: /en/projects/financial-risk/
description: "An ML API on synthetic quarterly financial data: input checks, time-ordered evaluation, FastAPI prediction"
---
A sample service that predicts next-quarter risk signals from quarterly financial data. It's written in Python with FastAPI, and uses synthetic data. Code is on [GitHub](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL).

## Components

1. Data contract: checks required CSV columns, types, and missing values
2. Features: company-quarter panel, financial ratios, quarter-over-quarter changes
3. Evaluation: time-ordered splits and walk-forward evaluation to catch leakage
4. Models: Dummy, Logistic Regression, Random Forest
5. Service: single and batch prediction in FastAPI, result packets, monitoring report

## Why time-ordered evaluation

If you split quarterly data at random, information from later quarters easily leaks into training. So I split the data in time order and evaluated with walk-forward validation.

The web demo runs on separate example logic, not on the FastAPI backend.

[← Projects]({{ '/en/projects/' | relative_url }})
