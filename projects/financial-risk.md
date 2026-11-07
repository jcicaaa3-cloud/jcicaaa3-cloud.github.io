---
layout: page
title: Financial Risk Scoring
permalink: /projects/financial-risk/
description: "합성 분기별 데이터를 이용한 재무 리스크 ML 백엔드: 데이터 검증, 시간 기반 평가, API와 배치 추론"
---

<link rel="stylesheet" href="{{ '/assets/css/research-projects.css' | relative_url }}">

<div class="rp rp-detail"><p class="rp-eyebrow">MACHINE LEARNING / SERVICE DESIGN</p>
<p class="rp-lead">분기별 재무 데이터를 다루는 머신러닝 API를 구현했습니다.</p>
<p><a href="{{ '/projects/' | relative_url }}">← 프로젝트 목록</a> · <a href="https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL">GitHub 코드·설명</a></p></div>

## 프로젝트 개요

합성 재무 데이터를 이용해 다음 분기의 위험 신호를 예측하는 예제 서비스를 만들었습니다. Python과 FastAPI로 입력 데이터 검사, 모델 비교, 단건·배치 예측을 구현했습니다.

> 실험에 사용한 예제 데이터는 합성 데이터입니다.

## 구성

1. **데이터 계약:** 필수 CSV 입력·자료형·누락 값 등을 검사합니다.
2. **특징 생성:** 회사-분기 패널을 정리하고 비율·전분기 차이 등의 특징을 생성합니다.
3. **평가:** 시간 순서 분리 및 walk-forward 방식으로 데이터 누수 위험을 점검합니다.
4. **모델 비교:** Dummy / Logistic Regression / Random Forest 기준 모델을 비교합니다.
5. **서비스:** FastAPI 단건·배치 예측, 결과 패킷, 모니터링 보고서를 구성합니다.

## 시간 순서에 따른 평가

분기별 데이터에서는 미래 시점의 정보가 학습에 섞이지 않도록 하는 것이 중요합니다. 데이터를 시간 순서대로 나누고, walk-forward 방식으로 모델을 평가하도록 구성했습니다.

웹 데모는 별도 예제 로직으로 동작하며, FastAPI 백엔드와는 구분됩니다.

**코드:** [Financial Risk Scoring Service 저장소](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL)

[← 전체 프로젝트로 돌아가기]({{ '/projects/' | relative_url }})
