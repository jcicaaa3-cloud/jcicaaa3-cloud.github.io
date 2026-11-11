---
layout: page
title: Financial Risk Scoring
permalink: /projects/financial-risk/
description: "합성 분기 재무 데이터를 쓰는 머신러닝 API: 데이터 검사, 시간 순서 평가, FastAPI 예측"
---
분기별 재무 데이터로 다음 분기 위험 신호를 예측하는 예제 서비스입니다. Python과 FastAPI로 만들었고, 데이터는 합성 데이터를 썼습니다. 코드는 [GitHub](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL)에 있습니다.

## 구성

1. 데이터 계약: 필수 CSV 컬럼, 자료형, 누락 값 검사
2. 특징 생성: 회사-분기 패널 정리, 재무 비율과 전분기 대비 변화
3. 평가: 시간 순서 분할, walk-forward (미래 분기 정보가 학습에 섞이지 않게)
4. 모델 비교: Dummy, Logistic Regression, Random Forest
5. 서비스: FastAPI 단건·배치 예측, 결과 패킷, 모니터링 보고서

웹 데모는 FastAPI 백엔드가 아니라 별도의 예제 로직으로 돌아갑니다.

[← 프로젝트]({{ '/projects/' | relative_url }})
