---
layout: post
title: "Calipso 분석 (1) 공개 샌드박스 보고서 읽기"
date: 2026-11-05 11:00:00 +0900
categories: [Malware-Analysis]
tags: [ransomware, calipso, windows, sandbox]
kind: malware
permalink: /research/calipso-01/
description: "Calipso 랜섬웨어의 공개 Triage 실행 기록과 PCRisk 자료 정리"
---
> 초기 기록입니다. 이후 분석까지 합친 정리본은 [Calipso 분석 v2.0]({{ '/research/calipso-v2/' | relative_url }})에 있습니다.

Calipso는 2026년 10월에 공개 보고된 랜섬웨어입니다. 샘플을 직접 열기 전에 Triage 실행 기록과 PCRisk 글부터 읽었습니다. 이 글의 실행 기록은 전부 Triage(Windows 10)에서 본 것입니다.

| 항목 | 값 |
| --- | --- |
| 파일명 | `Calipso.exe` |
| SHA-256 | `9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed` |
| 형식 | Windows x64 PE, 약 7.7MB |
| 확장자 | `.calipso` |
| 랜섬노트 | `recovery.txt` |
| Triage ID | `261006-nzbfjaay5m` |

<figure><a href="{{ '/assets/images/sample-metadata.webp' | relative_url }}"><img src="{{ '/assets/images/sample-metadata.webp' | relative_url }}" alt="분석 대상 파일의 기본 정보" loading="lazy"></a><figcaption>파일 기본 정보</figcaption></figure>

## Triage에서 본 것

파일 이름 변경이 13,144건 찍혀 있고, 바뀐 이름 끝에 `.calipso`가 붙습니다. 이름이 바뀐 건수라서 실제로 암호화된 파일 수와는 다를 수 있습니다.

프로세스 목록에는 이런 명령들이 있습니다.

- `vssadmin`, `wmic`: 섀도 복사본 삭제
- `wbadmin`: 백업 카탈로그 삭제
- `bcdedit`: 복구 관련 부팅 설정 변경
- `wevtutil`: 이벤트 로그 삭제

ATT&CK로는 [T1490](https://attack.mitre.org/techniques/T1490/)(Inhibit System Recovery), [T1685.005](https://attack.mitre.org/techniques/T1685/005/)(Clear Windows Event Logs, 이전 T1070.001)입니다.

그 밖에 바탕화면을 `C:\ProgramData\calipso_wallpaper.png`로 바꾸는 설정과, 브라우저 프로필·Windows 자격 증명 접근 탐지가 있었습니다. Network 항목(Requests, TCP, UDP)은 전부 0이었습니다.

PCRisk 글에는 `recovery.txt`와 바탕화면 안내 문구 얘기가 나옵니다.

다음 글에서는 실행 파일을 직접 열어 봤습니다. → [(2) PE 구조와 Ghidra]({{ '/research/calipso-02/' | relative_url }})

참고: [Triage 행동 분석](https://tria.ge/261006-nzbfjaay5m/behavioral1) · [Triage 정적 정보](https://tria.ge/261006-nzbfjaay5m/static1) · [PCRisk](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)
