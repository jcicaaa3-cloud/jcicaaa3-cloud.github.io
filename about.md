---
layout: page
title: 소개
permalink: /about/
description: "jcicaaa3: 악성코드 분석(리버스 엔지니어링), 랜섬웨어 분석, YARA·MITRE ATT&CK 기반 탐지, 머신러닝 악성코드 탐지와 모델 평가를 공부하는 컴퓨터공학 학부생"
---
한국외국어대학교에서 컴퓨터공학을 전공하고, 동북아외교통상을 복수전공하고 있습니다. 보안과 AI를 같이 공부합니다.

## 하는 일

- **악성코드 분석 · 리버스 엔지니어링**: Ghidra로 Windows PE 파일을 정적 분석합니다. 랜섬웨어 Calipso를 암호화 구조(XChaCha20 + RSA-4096)부터 파일 탐색(MFT 열거), 복구 방해까지 분석했습니다. [분석 v2.0]({{ '/research/calipso-v2/' | relative_url }})
- **탐지 규칙**: 분석 결과를 IOC, YARA 룰, MITRE ATT&CK 매핑으로 정리합니다.
- **머신러닝 악성코드 탐지**: EMBER2024 데이터로 정적 탐지 모델을 만들고, 랜섬웨어 패밀리별로 탐지 결과를 비교하고 있습니다. (진행 중)
- **AI 모델 개발 · 평가**: 컴퓨터 비전 모델과 머신러닝 서비스를 만들었고, 2026년 1학기에 로봇 행동 평가 연구를 했습니다.

## 보고 있는 문제

같은 샘플을 두고도 백신 엔진마다 탐지 결과가 갈립니다. 로봇 연구에서도 판정 기준을 바꾸면 성공과 실패가 뒤바뀌었습니다. 그래서 탐지 모델에서도 "무엇을 탐지 성공으로 볼 것인가"를 따지고 있습니다. 오탐률을 어디에 두고, 어떤 샘플로 평가할지의 문제입니다.

## 다루는 도구

Ghidra · YARA · MITRE ATT&CK · Python · PowerShell · Git

## 연락

- 이메일: [jcicaaa3@gmail.com](mailto:jcicaaa3@gmail.com)
- GitHub: [jcicaaa3-cloud](https://github.com/jcicaaa3-cloud)
