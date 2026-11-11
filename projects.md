---
layout: page
title: 프로젝트
permalink: /projects/
description: "jcicaaa3의 컴퓨터 비전, 머신러닝, 로봇 평가 프로젝트와 보안 분석"
---
지금까지 한 프로젝트들입니다. 코드와 실험 자료는 각 GitHub 저장소에 있습니다.

## LiteRaceSegNet

도로 균열과 포트홀을 분할하는 경량 세그멘테이션 모델입니다. V13 실험 기준으로 mIoU 0.8072, 파라미터 약 0.125M, CUDA에서 이미지 한 장당 3.097ms가 나왔습니다.

[자세히]({{ '/projects/literacesegnet/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-)

## Financial Risk Scoring

분기별 재무 데이터로 다음 분기 위험 신호를 예측하는 ML 서비스입니다. 입력 데이터 검사부터 모델 학습, FastAPI 예측 API까지 만들었습니다. 데이터는 합성 데이터입니다.

[자세히]({{ '/projects/financial-risk/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL)

## 로봇 행동 성공·실패 평가

로봇이 한 행동을 무엇을 기준으로 성공 또는 실패로 볼지, 기준에 따라 결과가 어떻게 달라지는지 다룬 졸업 연구입니다. 실험 80회, 분석 사례 874건이고 아직 정리 중입니다.

[자세히]({{ '/projects/robot-evaluation/' | relative_url }})

## Calipso 정적 분석

진행 중인 보안 분석입니다. 해시 확인, PE 섹션과 엔트리 포인트, Ghidra에서 찾은 Windows API 호출을 글로 정리하고 있습니다.

[관련 글]({{ '/research/' | relative_url }}) · [캡처]({{ '/evidence/' | relative_url }})
