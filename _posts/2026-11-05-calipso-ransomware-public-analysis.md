---
layout: post
title: "Calipso 분석 (1) 공개 샌드박스 보고서 읽기"
date: 2026-11-05 11:00:00 +0900
categories: [Malware-Analysis]
tags: [ransomware, calipso, windows, sandbox]
permalink: /research/calipso-01/
description: "Calipso 랜섬웨어의 공개 Triage 실행 기록과 PCRisk 자료를 읽고 정리한 글"
---
2026년 10월에 Calipso라는 랜섬웨어가 공개 보고됐습니다. 어떤 동작을 하는지 보려고 공개 샌드박스 기록과 보안업체 글부터 읽었습니다. 이 글에 나오는 실행 기록은 제가 직접 돌린 결과가 아니라 [Triage 보고서](https://tria.ge/261006-nzbfjaay5m/behavioral1)와 [PCRisk 글](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)에서 가져온 내용입니다.

## 분석 대상

| 항목 | 값 |
| --- | --- |
| 파일명 | `Calipso.exe` |
| SHA-256 | `9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed` |
| 형식 | Windows x64 PE |
| 크기 | 약 7.7MB |
| 암호화 후 확장자 | `.calipso` |
| 랜섬노트 | `recovery.txt` |
| Triage 보고서 ID | `261006-nzbfjaay5m` |

<figure><a href="{{ '/assets/images/sample-metadata.webp' | relative_url }}"><img src="{{ '/assets/images/sample-metadata.webp' | relative_url }}" alt="분석 대상 파일의 기본 정보" loading="lazy"></a><figcaption>파일 기본 정보를 확인한 화면</figcaption></figure>

같은 이름의 샘플이 모두 같은 코드라는 보장은 없어서, 아래 내용은 위 해시의 샘플 기준입니다.

## 파일 이름 변경

Triage의 Windows 10 실행 기록에는 파일 이름 변경이 13,144건 남아 있고, 파일명 뒤에 `.calipso`가 붙습니다. 다만 이건 이름이 바뀐 건수라서 13,144개 파일의 내용이 실제로 다 암호화됐는지는 알 수 없습니다. 암호화 방식과 키 관리는 아직 보지 못했습니다.

## 복구 방해 명령

프로세스 기록에 `vssadmin.exe`, `wmic.exe`, `wbadmin.exe`, `bcdedit.exe`가 보입니다. 전부 섀도 복사본, 백업, 복구 설정을 다루는 Windows 도구입니다.

- `vssadmin`, `wmic`: 섀도 복사본 삭제
- `wbadmin`: 백업 카탈로그 삭제
- `bcdedit`: 복구 관련 부팅 설정 변경

명령을 실행한 기록은 있지만 삭제까지 성공했는지는 로그를 따로 봐야 합니다. MITRE ATT&CK 기준으로는 [T1490 Inhibit System Recovery](https://attack.mitre.org/techniques/T1490/)에 해당합니다.

## 이벤트 로그와 바탕화면

`wevtutil.exe`로 이벤트 로그를 지우려 한 기록도 있습니다. 나중에 사고를 조사할 때 필요한 기록이 사라지는 셈입니다. ATT&CK에서는 [T1685.005 Clear Windows Event Logs](https://attack.mitre.org/techniques/T1685/005/)로 분류합니다(이전 ID T1070.001).

바탕화면도 바뀝니다. Triage에서 `C:\ProgramData\calipso_wallpaper.png`를 가리키는 설정이 보이고, PCRisk에는 안내 문구와 `recovery.txt`를 남긴다고 나와 있습니다.

## 자격 증명과 네트워크

자동 분석 결과에 브라우저 프로필과 Windows 자격 증명에 접근했다는 탐지가 있습니다. 실제로 비밀번호를 가져갔는지, 밖으로 보냈는지는 아직 모릅니다.

제가 본 Windows 10 실행에서는 Network 항목의 Requests, TCP, UDP가 모두 0이었습니다. 그 실행에서는 통신이 없었다는 정도로 보고 있고, 다른 환경에서도 그럴지는 모르겠습니다.

## 다음 글

공개 기록만으로는 코드 안에서 무슨 일이 일어나는지 알 수 없어서, 다음에는 PE 헤더와 섹션을 확인하고 Ghidra로 함수 참조를 따라가 봤습니다.

[다음 글: (2) PE 구조와 Ghidra]({{ '/research/calipso-02/' | relative_url }})

## 참고

- [Recorded Future Triage: 행동 분석](https://tria.ge/261006-nzbfjaay5m/behavioral1) (파일명 변경 건수, 프로세스, 네트워크 항목)
- [Recorded Future Triage: 정적 정보](https://tria.ge/261006-nzbfjaay5m/static1)
- [PCRisk: Calipso ransomware](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)
- MITRE ATT&CK [T1490](https://attack.mitre.org/techniques/T1490/), [T1685.005](https://attack.mitre.org/techniques/T1685/005/)
