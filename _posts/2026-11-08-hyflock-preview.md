---
layout: post
title: "다음 분석 예고: HYFLOCK — 백신은 얼마나 알아볼까?"
lead: "Calipso 다음은 HYFLOCK입니다. 새 빌드의 구조와 백신 탐지 결과가 엇갈리는 이유를 정적 분석으로 살펴볼 예정입니다."
topic: "랜섬웨어 · 분석 예고"
board_category: malware
date: 2026-11-08 21:05:00 +0900
permalink: /research/hyflock-preview/
description: "HYFLOCK 랜섬웨어 분석 예고. Go 기반 Carrier와 Rust 페이로드 구조, 탐지 결과의 차이를 정적 분석 관점에서 살펴봅니다."
tags: [ransomware, HYFLOCK, malware-analysis, static-analysis]
---
Calipso를 정리하고 나서 다음 분석 대상을 찾다가 **HYFLOCK**을 발견했습니다. 이번에는 실행 파일의 내부 구조뿐 아니라, **백신 프로그램마다 탐지 결과가 달라지는 이유**도 살펴보려 합니다.

HYFLOCK은 최근 여러 차례 빌드를 바꾼 랜섬웨어 계열입니다. 2026년 11월 4일 공개된 Check Point의 분석에 따르면, 10월 초 버전에서는 **Go 기반 Carrier**가 별도의 **Rust 기반 페이로드**를 포함하는 형태가 확인됐습니다. 이후 다른 빌드에서는 실행 방식과 파일 처리 구조도 달라졌다고 합니다.

특히 관심이 가는 부분은 탐지입니다. 일부 엔진에서 탐지가 이뤄지지 않거나 결과가 엇갈린다는 현상은 단순히 '백신을 우회했다'는 한 문장으로 설명하기 어렵습니다. **검사 시점, 엔진별 탐지 방식, 샘플 버전**에 따라 결과가 달라질 수 있기 때문입니다. 그래서 가능한 한 동일한 샘플 해시와 관찰 시점을 명시해 비교하려 합니다.

### 이번에 확인해 볼 것

1. **파일 구조:** PE 헤더와 섹션, 문자열, 임포트 정보를 기준으로 Carrier의 구성을 살펴봅니다.
2. **내장 구성요소:** Go 실행 파일과 내부 페이로드의 관계를 정적 분석 자료로 확인합니다.
3. **탐지 결과:** 여러 백신 엔진의 탐지 결과가 다를 경우, 그 차이를 샘플 식별 정보 및 검사 시점과 함께 기록합니다.
4. **기존 연구와 비교:** 외부 보고서에 나온 사실과 직접 확인한 사실을 구분합니다.

이번 글은 **분석 예고편**입니다. 아직 분석을 마친 것은 아닙니다. 실제 악성코드 파일을 블로그나 GitHub에 배포하지 않으며, 공개 보고서 및 정적 분석 자료 중심으로 기록할 예정입니다.

**참고:** [Check Point — HYFLOCK Ransomware Evolves with New Builds and Encryption Weaknesses (2026-11-04)](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/)
