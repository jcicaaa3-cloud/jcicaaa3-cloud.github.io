---
layout: post
title: "Calipso 분석 (3) VM에서 남긴 화면"
date: 2026-11-06 16:00:00 +0900
categories: [Malware-Analysis]
tags: [calipso, vm, file-extension, ransomware]
permalink: /research/calipso-03/
description: "가상머신에 남은 .calipso 파일명과 바탕화면 변경 흔적 정리"
---
11월 6일에 VM에서 찍은 화면입니다. 여러 파일 이름 끝에 `.calipso`가 붙어 있었고, 바탕화면에도 Calipso 안내가 떠 있었습니다. 나중에 로그와 맞춰 보려고 남겨 뒀습니다.

<figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="VM에서 .calipso 확장자가 붙은 파일 목록" loading="lazy"></a><figcaption>이름 뒤에 <code>.calipso</code>가 붙은 파일들</figcaption></figure>

확장자가 바뀐 건 화면으로 보이지만, 파일 내용이 어디까지 암호화됐는지는 파일을 열어 봐야 압니다.

## 바탕화면

바탕화면이 바뀐 것도 확인했는데, 그 화면은 올리지 않았습니다. 화면만으로는 어떤 프로세스나 API가 바꿨는지 알 수 없습니다. 공개 [Triage 실행 기록](https://tria.ge/261006-nzbfjaay5m/behavioral1)에도 바탕화면 설정 흔적이 있지만, 제 VM에서 본 것과는 별개의 자료입니다.

## 글을 셋으로 나눈 이유

| 글 | 자료 |
| --- | --- |
| [(1) 공개 샌드박스]({{ '/research/calipso-01/' | relative_url }}) | Triage 공개 실행 보고서 |
| [(2) 정적 분석]({{ '/research/calipso-02/' | relative_url }}) | PE 구조, Ghidra 코드 참조 |
| (3) VM 화면 | 직접 찍은 캡처와 메모 |

보고서에서 읽은 것과 직접 본 것을 한 글에 섞으면 나중에 어디서 나온 내용인지 헷갈릴 것 같아서 나눠 썼습니다.

암호화 알고리즘, 키 처리, 파일별 변경 시각, 레지스트리와 이벤트 로그 변화는 아직 못 봤습니다. 자료가 생기면 이어서 쓰겠습니다.

## 참고

- [Recorded Future Triage: Calipso 실행 기록](https://tria.ge/261006-nzbfjaay5m/behavioral1)
- [PCRisk: Calipso ransomware](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)

[캡처 전체 보기]({{ '/evidence/' | relative_url }})
