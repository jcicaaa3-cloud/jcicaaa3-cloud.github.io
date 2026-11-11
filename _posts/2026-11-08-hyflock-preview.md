---
layout: post
title: "다음 분석 대상: HYFLOCK"
date: 2026-11-08 21:05:00 +0900
categories: [Malware-Analysis]
tags: [ransomware, HYFLOCK, malware-analysis, static-analysis]
permalink: /research/hyflock-preview/
description: "Calipso 다음으로 분석할 HYFLOCK 랜섬웨어. Go 기반 Carrier와 Rust 페이로드 구조, 백신 탐지 결과 차이를 볼 계획"
---
Calipso 다음으로 볼 샘플은 HYFLOCK입니다. 이번에는 실행 파일 구조와 함께, 백신마다 탐지 결과가 다르게 나오는 이유도 보려고 합니다.

HYFLOCK은 최근 빌드가 여러 번 바뀐 랜섬웨어입니다. 11월 4일에 나온 [Check Point 분석](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/)에 따르면 10월 초 버전은 Go로 만든 Carrier 안에 Rust 페이로드가 따로 들어 있는 구조였고, 이후 빌드에서는 실행 방식과 파일 처리 구조도 바뀌었다고 합니다.

탐지 쪽이 특히 궁금합니다. 어떤 엔진은 잡고 어떤 엔진은 못 잡는 경우가 있는데, 검사 시점이나 엔진의 탐지 방식, 샘플 버전에 따라 결과가 달라질 수 있습니다. 그래서 비교할 때는 샘플 해시와 검사 시점을 같이 적을 생각입니다.

## 볼 것

1. Carrier의 PE 헤더, 섹션, 문자열, 임포트
2. Go 실행 파일과 안에 들어 있는 페이로드의 관계
3. 엔진별 탐지 결과 차이 (샘플 해시, 검사 시점 포함)
4. Check Point 보고서 내용과 직접 확인한 내용 비교

아직 분석 전이라 계획만 적었습니다. 샘플 파일은 블로그나 GitHub에 올리지 않습니다.

## 참고

- [Check Point: HYFLOCK Ransomware Evolves with New Builds and Encryption Weaknesses](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/) (2026-11-04)
