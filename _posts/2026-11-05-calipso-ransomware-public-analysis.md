---
layout: post
title: "Calipso 분석 #01 · 공개 샌드박스 보고서 읽기"
date: 2026-11-05 11:00:00 +0900
categories: [Malware-Analysis]
tags: [ransomware, calipso, windows, sandbox]
permalink: /research/calipso-01/
topic: "Calipso / 공개 보고서"
board_category: "malware"
cover: "/assets/images/sample-metadata.webp"
cover_alt: "분석 대상 파일의 기본 정보를 확인한 화면"
cover_caption: "파일 정보를 먼저 정리해 두었다."
lead: "Calipso를 처음 조사하며 읽었던 공개 실행 기록을 정리했다."
---

## 어떤 파일을 보고 있나

Calipso라는 이름의 랜섬웨어가 2026년 10월에 공개 보고되었다. 처음에는 어떤 행동을 하는지 확인하기 위해 보안업체 글과 공개 샌드박스 실행 기록을 찾아봤다. 여기 적은 실행 흔적은 **내 컴퓨터에서 직접 실행해 측정한 결과가 아니다.** [Triage 보고서](https://tria.ge/261006-nzbfjaay5m/behavioral1)와 [PCRisk의 분석 글](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)을 읽으며 메모한 내용이다.

| 항목 | 공개 자료에서 확인한 값 |
| --- | --- |
| 파일명 | `Calipso.exe` |
| SHA-256 | `9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed` |
| 형식 | Windows x64 PE |
| 크기 | 약 7.7MB |
| 암호화 후 사용되는 확장자 | `.calipso` |
| 랜섬노트 이름 | `recovery.txt` |
| 공개 보고서 ID | `261006-nzbfjaay5m` |

같은 이름의 모든 샘플이 같은 코드를 쓰는지는 따로 확인해야 한다. 아래 메모는 위 해시로 식별된 샘플의 공개 보고서를 기준으로 한다.

## 파일이 바뀐 흔적

Triage의 Windows 10 실행 기록에는 **13,144건의 파일 이름 변경**이 보고돼 있다. 파일명 뒤에 `.calipso`가 붙는 행동도 확인할 수 있다. 여기서 13,144라는 숫자는 보고서가 기록한 파일 이름 변경 건수다. 실제로 13,144개 파일의 내용이 암호화됐는지까지 확인한 숫자는 아니다.

파일명이 바뀌었다는 사실과 파일 내용이 복호화할 수 없을 정도로 바뀌었다는 사실은 분리해서 살펴볼 필요가 있다. 암호화 방식과 키 관리도 아직 조사할 부분으로 남겨뒀다.

## 복구를 막으려는 명령

프로세스 기록을 읽다가 `vssadmin.exe`, `wmic.exe`, `wbadmin.exe`, `bcdedit.exe` 실행 흔적을 확인했다. Windows의 섀도 복사본이나 백업, 복구 설정을 다루는 도구들이다.

- `vssadmin`, `wmic`: 섀도 복사본 삭제를 시도하는 명령
- `wbadmin`: 백업 카탈로그 삭제를 시도하는 명령
- `bcdedit`: 복구 관련 부팅 설정을 변경하는 명령

프로세스가 명령을 실행했다는 기록만으로 삭제가 모두 성공했다고 말할 수는 없다. 로그에는 시도와 결과를 따로 살펴봐야 하는 지점이 있다. ATT&CK에서는 이런 행동을 [T1490 — Inhibit System Recovery](https://attack.mitre.org/techniques/T1490/)에 묶어 설명한다.

## 이벤트 로그와 바탕화면

`wevtutil.exe`를 이용한 이벤트 로그 삭제 시도도 기록돼 있다. 사고가 난 뒤 기록을 조사할 때 문제가 될 수 있는 부분이다. MITRE ATT&CK에서는 현재 [T1685.005 — Clear Windows Event Logs](https://attack.mitre.org/techniques/T1685/005/)로 분류한다(이전 ID: T1070.001).

바탕화면을 변경한 흔적도 있다. Triage에서는 `C:\ProgramData\calipso_wallpaper.png`를 가리키는 설정을 볼 수 있다. 피해자에게 안내하는 문구와 `recovery.txt` 파일을 남긴다는 보고도 있다.

## 계정 정보와 네트워크 기록

자동 분석 결과에는 브라우저 프로필, Windows 자격 증명 관련 접근 탐지도 나타난다. 실제 비밀번호 탈취가 성공했는지, 외부 전송이 있었는지는 아직 확인하지 못했다.

확인한 Triage Windows 10 실행의 Network 항목에는 Requests, TCP, UDP가 모두 0으로 표시된다. **해당 실행에서 기록된 통신이 없었다**는 뜻으로만 적어둔다. 다른 실행 환경까지 같은 결과일지는 알 수 없다.

## 다음에 볼 것

공개 기록을 읽고 나니 실제 실행 파일 안에 어떤 코드가 있는지 궁금해졌다. PE 헤더와 섹션을 확인하고, Ghidra에서 함수 참조를 살펴볼 계획이다.

[다음 글: Ghidra와 PE 구조 분석]({{ '/research/calipso-02/' | relative_url }})

### 자료 출처와 확인 범위

- **공개 실행 기록:** [Recorded Future Triage / 행동 분석](https://tria.ge/261006-nzbfjaay5m/behavioral1). 파일명 변경 건수, 프로세스 실행 흔적, 네트워크 항목의 근거.
- **공개 파일 정보:** [Recorded Future Triage / 정적 정보](https://tria.ge/261006-nzbfjaay5m/static1). 파일 정보 및 샘플 식별에 사용.
- **보안업체 설명:** [PCRisk / Calipso ransomware](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware). 확장자, 랜섬노트, 바탕화면 변경 설명을 대조.
- **행위 분류:** [MITRE ATT&CK T1490 / Inhibit System Recovery](https://attack.mitre.org/techniques/T1490/), [T1685.005 / Clear Windows Event Logs](https://attack.mitre.org/techniques/T1685/005/).

위 목록 중 내 컴퓨터에서 직접 실행해 재현한 결과로 적은 내용은 없다. 공개 보고서에서 읽은 수치와 행동을 해당 보고서의 관찰 결과로 표기했다.
