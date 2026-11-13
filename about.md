---
layout: page
title: 소개
permalink: /about/
description: "jcicaaa3: 악성코드 분석(리버스 엔지니어링), 랜섬웨어 분석, YARA·MITRE ATT&CK 기반 탐지, 머신러닝 악성코드 탐지와 모델 평가를 공부하는 컴퓨터공학 학부생"
---
한국외국어대학교에서 컴퓨터공학을 전공하고, 동북아외교통상을 복수전공하고 있습니다. 보안과 AI를 같이 공부합니다.

## 하는 일

- 악성코드 분석과 리버스 엔지니어링을 합니다. Ghidra로 Windows PE 파일을 정적 분석하고, Calipso 랜섬웨어의 암호화 구조(XChaCha20 + RSA-4096), 파일 탐색(MFT 열거), 복구 방해를 봤습니다. [분석 v2.0]({{ '/research/calipso-v2/' | relative_url }})
- 분석한 내용은 IOC, YARA 룰, MITRE ATT&CK 매핑으로 정리합니다.
- 머신러닝 악성코드 탐지도 하고 있습니다. EMBER2024 데이터로 정적 탐지 모델을 만들고, 랜섬웨어 패밀리별로 탐지 결과를 비교하는 중입니다.
- AI 쪽으로는 컴퓨터 비전 모델과 머신러닝 서비스를 만들었고, 2026년 1학기에 로봇 행동 평가 연구를 했습니다.

## 관심 있는 것

같은 파일인데도 백신 엔진마다 탐지 결과가 다릅니다. 1학기에 한 로봇 연구에서도 판정 기준을 바꾸면 같은 행동이 성공이 되기도 하고 실패가 되기도 했습니다. 탐지 모델도 오탐률을 얼마로 잡는지, 어떤 샘플로 평가하는지에 따라 결과가 달라져서, 지금은 그 기준을 어떻게 정할지 보고 있습니다.

## 다루는 도구

Ghidra · YARA · MITRE ATT&CK · Python · PowerShell · Git

## 연락

- 이메일: [jcicaaa3@gmail.com](mailto:jcicaaa3@gmail.com)
- GitHub: [jcicaaa3-cloud](https://github.com/jcicaaa3-cloud)
