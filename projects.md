---
layout: page
title: 프로젝트
permalink: /projects/
description: "jcicaaa3의 보안 분석과 AI 프로젝트: Calipso 정적 분석, LiteRaceSegNet, Financial Risk Scoring, 로봇 행동 평가"
---
보안과 AI 쪽으로 나눠 정리했습니다. 코드와 실험 자료는 각 GitHub 저장소에 있습니다.

## 보안

### Calipso 정적 분석 <small>v2.0</small>

Ghidra로 암호화 구조(XChaCha20 + RSA-4096 OAEP), 파일 탐색(MFT 열거), 복구 방해, 프로세스 종료를 분석하고 IOC와 YARA 룰을 정리했습니다.

[분석 v2.0]({{ '/research/calipso-v2/' | relative_url }}) · [캡처]({{ '/evidence/' | relative_url }})

### HYFLOCK 엔진별 탐지 비교 <small>예정</small>

Go Carrier와 Rust 페이로드 구조를 보고, 백신 엔진마다 탐지 결과가 갈리는 이유를 해시·검사 날짜와 함께 비교할 계획입니다.

[계획 글]({{ '/research/hyflock-preview/' | relative_url }})

### RSA + AES 파일 암호화 도구 <small>v4</small>

파일은 AES-256-CBC + HMAC-SHA256으로, 파일별 비밀값은 RSA-OAEP로 감싸고 비밀번호를 함께 요구하는 도구입니다. PowerShell과 C#으로 만들었고 소스코드를 MIT 라이선스로 공개했습니다.

[구조·검증·소스코드]({{ '/research/hybrid-cryptography/' | relative_url }})

## AI

### LiteRaceSegNet

도로 균열과 포트홀을 분할하는 경량 세그멘테이션 모델입니다. V13 실험 기준으로 mIoU 0.8072, 파라미터 약 0.125M, CUDA에서 이미지 한 장당 3.097ms가 나왔습니다.

[자세히]({{ '/projects/literacesegnet/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-)

### Financial Risk Scoring

분기별 재무 데이터로 다음 분기 위험 신호를 예측하는 ML 서비스입니다. 입력 데이터 검사부터 모델 학습, FastAPI 예측 API까지 만들었습니다. 데이터는 합성 데이터입니다.

[자세히]({{ '/projects/financial-risk/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL)

### 로봇 행동 성공·실패 평가 <small>2026년 1학기</small>

로봇이 한 행동을 무엇을 기준으로 성공 또는 실패로 볼지, 기준에 따라 결과가 어떻게 달라지는지 다룬 연구 프로젝트입니다. 실험 80회, 분석 사례 874건입니다.

[자세히]({{ '/projects/robot-evaluation/' | relative_url }})
