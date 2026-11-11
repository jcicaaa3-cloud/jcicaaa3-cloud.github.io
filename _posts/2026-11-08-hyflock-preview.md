---
layout: post
title: "다음 분석 대상: HYFLOCK"
date: 2026-11-08 21:05:00 +0900
categories: [Malware-Analysis]
tags: [ransomware, HYFLOCK, malware-analysis, static-analysis]
kind: malware
permalink: /research/hyflock-preview/
description: "Calipso 다음으로 볼 HYFLOCK 랜섬웨어. Go Carrier와 Rust 페이로드 구조, 엔진별 탐지 차이"
---
Calipso 다음으로 HYFLOCK을 보려고 합니다.

11월 4일 [Check Point 글](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/)을 보면, 10월 초 빌드는 Go로 만든 Carrier 안에 Rust 페이로드가 들어 있는 구조였고 이후 빌드에서 실행 방식과 파일 처리 방식이 바뀌었다고 합니다.

이번에는 구조 말고도 백신 엔진마다 탐지 결과가 다른 이유를 보고 싶습니다. 검사 시점이나 샘플 버전에 따라서도 결과가 달라지니까, 비교할 때는 해시와 검사 날짜를 같이 적을 생각입니다.

볼 것:

1. Carrier의 PE 헤더, 섹션, 문자열, 임포트
2. Go 실행 파일과 안에 든 페이로드의 관계
3. 엔진별 탐지 결과
4. Check Point 보고서 내용과 직접 본 것 비교

샘플 파일은 올리지 않습니다.
