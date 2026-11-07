---
layout: post
title: "Calipso 분석 #02 · PE 구조와 Ghidra"
date: 2026-11-06 13:00:00 +0900
categories: [Malware-Analysis]
tags: [calipso, ghidra, pe, ntfs, static-analysis]
permalink: /research/calipso-02/
topic: "Calipso / 정적 분석"
board_category: "malware"
cover: "/assets/images/pe-sections.webp"
cover_alt: "PowerShell에서 출력한 PE 섹션 목록"
cover_caption: "분석 과정에서 확인한 19개 섹션."
lead: "해시를 확인하고 PE 헤더, 섹션, 엔트리 포인트를 조사했습니다. 파일시스템 관련 호출도 살펴봤습니다."
---

## 이번에 확인한 것

앞선 글에서는 공개 샌드박스 보고서를 읽었습니다. 이번에는 실행 파일 자체를 정적으로 조사했습니다. 해시를 확인한 뒤 PE 헤더, 섹션, 엔트리 포인트와 심볼 정보를 살펴보고 Ghidra에서 함수 참조를 추적했습니다.

대상 파일의 SHA-256은 다음과 같습니다.

```text
9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed
```

분석 대상은 Windows x64 PE 파일입니다. 원본 실행 파일은 저장소에 올리지 않습니다.

<figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" loading="lazy" alt="PowerShell로 확인한 SHA-256 해시"></a><figcaption>파일 해시를 확인한 화면.</figcaption></figure>

## PE 섹션 19개

헤더에서 총 **19개 섹션**을 확인했습니다. `.text`, `.data`, `.rdata`와 함께 DWARF 관련 `.debug_*` 이름도 확인했습니다.

<figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" loading="lazy" alt="PowerShell에서 본 PE 파일 헤더 값"></a><figcaption>PE 헤더를 확인할 때 남긴 화면.</figcaption></figure>

섹션 이름만으로 용도를 확정하기는 어렵습니다. 실제 내용과 접근 권한, 가상 주소를 함께 확인해야 합니다. 디버깅 관련 섹션이 남아 있다는 이유만으로 개발자 신원이나 제작 도구를 확정할 수도 없습니다.

<div class="inline-evidence"><figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="엔트리 포인트와 COFF 심볼 정보"></a><figcaption>엔트리 포인트 / COFF 출력</figcaption></figure><figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARF 디버그 섹션 이름"></a><figcaption>DWARF 관련 섹션</figcaption></figure></div>

| 살펴본 항목 | 메모 |
| --- | --- |
| PE 헤더 | Windows x64 실행 파일 형식 확인 |
| 섹션 | 총 19개 확인 |
| 엔트리 포인트 | 위치와 주변 코드 조사 |
| COFF | 심볼 관련 정보 확인 |
| DWARF | 디버그 섹션 이름 조사 |
| API | 함수 참조와 제어 코드 확인 |

## `DeviceIoControl`을 따라가다가

Ghidra에서 함수 간 참조를 확인하는 과정에서 `DeviceIoControl` 호출과 제어 코드 **`0x900B3`**을 찾았습니다. Windows 파일시스템 제어 코드 표에서는 `FSCTL_ENUM_USN_DATA`에 해당합니다.

Microsoft의 [FSCTL_ENUM_USN_DATA 문서](https://learn.microsoft.com/ko-kr/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data)에 따르면 이 제어 코드는 지정한 범위의 USN 데이터를 열거하여 MFT 레코드를 가져올 때 사용합니다. 실제 호출의 용도는 아직 확인하지 못했습니다. 파일을 찾는 과정에서 쓰이는지, 다른 내부 작업에 사용되는지 판단하려면 호출부 앞뒤의 코드와 인자를 더 조사해야 합니다.

현재까지 확인한 사실은 **코드에 해당 참조가 있다는 점**입니다. 실제 실행 중 호출에 도달했는지, 호출이 성공했는지, 파일 암호화 흐름과 연결되는지는 아직 확인하지 못했습니다. MFT를 열거하는 동작과 MFT 자체를 변경하는 동작도 구분해야 합니다.

<figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" loading="lazy" alt="정적 조사에서 확인한 Windows API 이름"></a><figcaption>분석할 때 추린 API 이름. 위의 제어 코드 호출부를 직접 찍은 화면은 아닙니다.</figcaption></figure>

## 문자열을 보다가 적어둔 것

경로와 확장자를 처리하는 코드도 조사했습니다. Windows 시스템 디렉터리나 `.exe`, `.dll`, `.sys` 같은 확장자에 관한 문자열을 확인했습니다. 파일 변경 대상에서 제외하는 조건일 가능성은 있지만, 분기문과 호출 흐름을 더 확인해야 합니다.

문자열이 파일에 들어 있다는 사실, 코드가 문자열을 비교한다는 사실, 실행 중 해당 조건이 사용됐다는 사실은 구분해서 기록해야 합니다.

## 공개 실행 보고서와 비교해 보기

[첫 번째 글]({{ '/research/calipso-01/' | relative_url }})에 적은 파일명 변경과 백업 삭제 시도는 공개 Triage 보고서에서 확인한 결과입니다. 이번에 직접 확인한 내용은 PE 구조와 일부 코드 참조입니다. 두 자료가 어떻게 연결되는지 더 조사할 계획입니다.

아직 확인할 항목이 남아 있습니다.

- `0x900B3`을 호출하는 함수로 이어지는 실제 흐름
- 파일 목록을 선택하는 조건
- 암호화 함수 및 키 처리 방식
- 공개 보고서의 복구 방해 명령과 연결되는 코드
- 코드 경로가 실제 실행에서도 사용되는지

VM에서 남긴 화면은 다음 글에 별도로 정리했습니다. 화면에 보인 내용과 내부 코드의 연관성은 이후에 더 조사할 예정입니다.

[다음 글: VM에서 남긴 화면]({{ '/research/calipso-03/' | relative_url }})


### 자료 출처와 캡처

- **직접 분석:** 2026-11-06에 확인한 SHA-256, PE 헤더, 섹션, 엔트리 포인트, COFF·DWARF 정보 및 API 관련 캡처. 글의 사진은 이 분석 과정에서 기록한 화면입니다.
- **Windows API:** [Microsoft Learn / FSCTL_ENUM_USN_DATA](https://learn.microsoft.com/ko-kr/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data). 제어 코드가 수행하는 작업을 설명하는 공식 문서.
- **대조 자료:** [Recorded Future Triage / 정적 정보](https://tria.ge/261006-nzbfjaay5m/static1), [행동 분석](https://tria.ge/261006-nzbfjaay5m/behavioral1).

제어 코드의 의미는 Microsoft 문서로 확인했지만, 특정 함수가 랜섬웨어의 어느 단계에서 실행됐는지는 추가 분석이 필요합니다. 출처에 없는 동작을 직접 확인한 결과로 표기하지 않았습니다.
