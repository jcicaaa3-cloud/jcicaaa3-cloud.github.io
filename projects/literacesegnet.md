---
layout: page
title: LiteRaceSegNet
permalink: /projects/literacesegnet/
description: "도로 균열·포트홀 분할용 경량 세그멘테이션 모델 LiteRaceSegNet의 구조와 실험 결과"
---
도로 균열과 포트홀을 분할하는 경량 세그멘테이션 모델입니다. 코드와 실험 자료는 [GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-)에 있습니다.

## 문제

균열이나 포트홀처럼 경계가 불규칙한 영역은 모델을 작게 만들수록 세부 특징을 잃기 쉽습니다. LiteRaceSegNet은 detail/context feature와 boundary-guided fusion을 조합한 경량 CNN 모델입니다.

## 결과 (V13)

| 지표 | 값 | 평가 범위 |
| --- | ---: | --- |
| mIoU | 0.8072 | AWS validation protocol |
| Damage IoU | 0.7113 | 같은 검증 프로토콜 |
| 파라미터 | 약 0.125M | 모델 프로파일 |
| CUDA 지연 | 3.097 ms/image | CUDA 프로파일 측정 |
| Ablation | 7개 변형 | 같은 조건에서 비교 |
| 경계 주변 aggregate IoU | 0.3212 | 32×32 / 64×64 경계 패치 |

평가 설정과 비교 실험 전체는 저장소와 [실험 결과 포털](https://jcicaaa3-cloud.github.io/LiteRaceSegNet-V13-Portal-Clean/)에 있습니다.

## 확인한 것

- 이미지·마스크 누락, 파일 이름과 크기 불일치 같은 입력 조건
- 모델 변형 7개를 같은 절차로 돌린 ablation
- 예측 마스크를 원본에 겹쳐서 본 경계와 작은 손상 영역
- 이미지 10장 시각화로 확인한, 지표만으로는 안 보이는 오류

전체 mIoU와 별도로 경계 주변 IoU를 재 보니, 경계가 복잡한 손상 영역에서 성능이 떨어지는 부분이 있었습니다. 그래서 예측 마스크 10장을 눈으로도 비교했습니다.

[← 프로젝트]({{ '/projects/' | relative_url }})
