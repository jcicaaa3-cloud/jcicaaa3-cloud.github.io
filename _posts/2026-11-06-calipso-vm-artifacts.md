---
layout: post
title: "Calipso 분석 (3) VM에서 남긴 화면"
date: 2026-11-06 16:00:00 +0900
categories: [Malware-Analysis]
tags: [calipso, vm, file-extension, ransomware]
kind: malware
permalink: /research/calipso-03/
description: "가상머신에 남은 .calipso 파일 목록 캡처"
---
11월 6일 VM 캡처입니다. 파일 이름 끝에 `.calipso`가 붙어 있었고, 바탕화면에도 Calipso 안내가 떠 있었습니다.

<figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="VM에서 .calipso 확장자가 붙은 파일 목록" loading="lazy"></a><figcaption><code>.calipso</code>가 붙은 파일들</figcaption></figure>

바탕화면 캡처는 올리지 않았습니다. [Triage 기록](https://tria.ge/261006-nzbfjaay5m/behavioral1)에도 바탕화면 설정 흔적이 있어서 나중에 로그와 같이 맞춰 볼 생각입니다.

아직 못 본 것: 암호화 알고리즘, 키 처리, 파일별 변경 시각, 레지스트리와 이벤트 로그 변화.

참고: [Triage 실행 기록](https://tria.ge/261006-nzbfjaay5m/behavioral1) · [PCRisk](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware) · [캡처 전체]({{ '/evidence/' | relative_url }})
