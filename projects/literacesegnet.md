---
layout: page
title: LiteRaceSegNet
permalink: /projects/literacesegnet/
description: "LiteRaceSegNet 경량 도로 손상 세그멘테이션 모델과 실험 결과"
---

<link rel="stylesheet" href="{{ '/assets/css/research-projects.css' | relative_url }}">

<div class="rp rp-detail"><p class="rp-eyebrow">COMPUTER VISION / CASE STUDY</p>
<p class="rp-lead">도로 균열과 포트홀을 분할하는 경량 세그멘테이션 모델입니다.</p>
<p><a href="{{ '/projects/' | relative_url }}">← 프로젝트 목록</a> · <a href="https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-">GitHub 실험 자료</a></p></div>

## 연구 문제

도로 균열과 포트홀처럼 경계가 불규칙한 영역은 경량 모델에서 세부 특징이 손실되기 쉽습니다. LiteRaceSegNet은 detail/context feature 및 boundary-guided fusion을 조합해 도로 손상 영역을 분할하는 경량 CNN 기반 모델입니다.

## 기록된 검증 결과

| 지표 | 값 | 기록된 평가 범위 |
| --- | ---: | --- |
| mIoU | **0.8072** | AWS validation protocol |
| Damage IoU | **0.7113** | 동일 검증 프로토콜 |
| 파라미터 | **약 0.125M** | 모델 프로파일 |
| CUDA 지연 | **3.097 ms/image** | 측정된 CUDA 프로파일 |
| Ablation | **7개 변형** | 동일 조건 비교 |
| 경계 주변 aggregate IoU | **0.3212** | 32×32 / 64×64 경계 패치 |

위 수치는 **V13 실험 결과**입니다. 자세한 평가 설정과 비교 실험은 GitHub 저장소에 정리했습니다.

## 구현과 확인한 항목

- 이미지·마스크의 누락, 이름 및 크기 불일치 등 데이터 입력 조건을 확인했습니다.
- 모델 변형 7개를 동일한 절차로 비교하고 ablation 결과를 남겼습니다.
- 예측 마스크와 원본 오버레이를 통해 경계·소형 손상 영역을 점검했습니다.
- 10개 이미지 시각화 부분집합을 통해 정량 지표만으로 알기 어려운 결과를 살폈습니다.

## 결과에서 확인한 점

전체 mIoU와 별개로 경계 주변 IoU를 측정했습니다. 경계가 복잡한 손상 영역에서 성능이 떨어지는 지점을 확인하고, 이미지 10장의 예측 마스크를 시각적으로 비교했습니다.

**코드·실험:** [LiteRaceSegNet 공개 코드·평가 자료](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-) · [실험 결과 포털](https://jcicaaa3-cloud.github.io/LiteRaceSegNet-V13-Portal-Clean/)

[← 전체 프로젝트로 돌아가기]({{ '/projects/' | relative_url }})
