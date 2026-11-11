---
layout: page
title: LiteRaceSegNet
permalink: /projects/literacesegnet/
description: "도로 균열·포트홀 분할용 경량 세그멘테이션 모델 LiteRaceSegNet의 구조와 실험 결과"
---
도로 균열과 포트홀을 분할하는 경량 세그멘테이션 모델입니다. 코드와 실험 자료는 [GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-)에 있습니다.

균열이나 포트홀은 경계가 불규칙해서, 모델을 작게 만들수록 세부가 뭉개지기 쉽습니다. 그래서 detail/context feature와 boundary-guided fusion을 조합한 경량 CNN으로 만들었습니다.

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

경계 주변 IoU는 0.3212로 전체 mIoU보다 한참 낮게 나왔습니다. 경계가 복잡한 손상 영역에서 성능이 떨어지는 부분이라, 예측 마스크를 원본에 겹친 이미지 10장을 눈으로도 비교했습니다.

그 밖에 한 것:

- 이미지·마스크 누락, 파일 이름·크기 불일치 검사
- 모델 변형 7개 ablation (같은 절차)

[← 프로젝트]({{ '/projects/' | relative_url }})
