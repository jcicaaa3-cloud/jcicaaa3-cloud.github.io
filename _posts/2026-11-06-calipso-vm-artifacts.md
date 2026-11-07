---
layout: post
title: "Calipso 분석 #03 · VM에서 남긴 화면"
date: 2026-11-06 16:00:00 +0900
categories: [Malware-Analysis]
tags: [calipso, vm, file-extension, ransomware]
permalink: /research/calipso-03/
topic: "Calipso / VM 화면"
board_category: "malware"
cover: "/assets/images/calipso-files.webp"
cover_alt: "VM 파일 이름에 .calipso 확장자가 붙어 있는 화면"
cover_caption: "VM에서 확인한 파일 목록."
lead: "가상머신 화면에 남아 있던 파일명과 바탕화면 변경 흔적을 정리했다."
---

## 화면을 먼저 남겨뒀다

11월 6일에 찍은 VM 캡처에는 여러 파일의 이름 끝에 `.calipso`가 붙어 있다. 바탕화면에도 Calipso 관련 안내가 나타났다. 나중에 다른 로그와 비교할 수 있도록 화면부터 보관해 뒀다.

<figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="VM에서 .calipso 확장자가 표시된 파일 이름" loading="lazy"></a><figcaption>파일 이름 뒤에 <code>.calipso</code>가 붙어 있는 화면.</figcaption></figure>

사진만으로는 파일 안의 바이트가 얼마나 바뀌었는지 알 수 없다. 확장자 변경은 화면에서 확인되지만, 암호화가 어느 범위까지 진행됐는지는 파일 내용도 살펴봐야 한다.

## 바탕화면 변경

VM에서 바탕화면이 바뀐 상태도 확인했지만 해당 화면 사진은 게시하지 않았다. 화면이 바뀌었다는 관찰만으로 어떤 API나 프로세스가 변경했는지 알 수는 없다.

공개 [Triage 실행 기록](https://tria.ge/261006-nzbfjaay5m/behavioral1)에는 바탕화면 설정에 관한 흔적이 있다. 내 VM 캡처의 관찰 내용과 공개 분석의 기록은 각각 별개의 자료다.

## 세 개의 기록을 나눠 쓴 이유

| 글 | 사용한 자료 |
| --- | --- |
| [#01 공개 샌드박스]({{ '/research/calipso-01/' | relative_url }}) | 공개 Triage 실행 보고서 |
| [#02 정적 분석]({{ '/research/calipso-02/' | relative_url }}) | PE 구조, Ghidra 코드 참조 |
| #03 VM 화면 | 직접 남긴 파일 목록 캡처와 화면 관찰 메모 |

보고서를 읽은 내용과 내가 직접 조사한 내용을 한 문장에 섞으면 나중에 확인하기 어려워진다. 그래서 날짜와 출처별로 글을 나눠두었다.

현재 화면만 보고 알 수 없는 항목도 남아 있다. 실제 암호화 알고리즘, 키 처리, 파일별 변경 시간, 레지스트리와 이벤트 로그의 전체 변화 등은 추후 다른 자료를 확보하면 확인할 예정이다.

### 자료 출처

- **직접 촬영:** 2026-11-06 VM 파일 목록 캡처. 파일명과 확장자 표시를 확인하기 위한 자료.
- **공개 기록:** [Recorded Future Triage / Calipso 실행 기록](https://tria.ge/261006-nzbfjaay5m/behavioral1). 바탕화면 관련 설명을 대조할 때 참고.
- **추가 설명:** [PCRisk / Calipso ransomware](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware). 보고된 랜섬노트와 바탕화면 변경 내용 확인.

[분석 사진 전체 보기]({{ '/evidence/' | relative_url }})
