---
layout: post
title: "Calipso 분석 (2) PE 구조와 Ghidra"
date: 2026-11-06 13:00:00 +0900
categories: [Malware-Analysis]
tags: [calipso, ghidra, pe, ntfs, static-analysis]
permalink: /research/calipso-02/
description: "Calipso 실행 파일의 PE 헤더, 섹션, 엔트리 포인트를 보고 Ghidra에서 DeviceIoControl 호출을 따라간 기록"
---
[지난 글]({{ '/research/calipso-01/' | relative_url }})에서는 공개 보고서를 읽었고, 이번에는 실행 파일을 직접 열어봤습니다. 해시를 확인하고 PE 헤더, 섹션, 엔트리 포인트, 심볼 정보를 본 다음 Ghidra에서 함수 참조를 따라갔습니다. 캡처는 모두 11월 6일에 찍었고, 원본 파일은 저장소에 올리지 않았습니다.

```text
SHA-256  9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed
```

<figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" loading="lazy" alt="PowerShell로 확인한 SHA-256 해시"></a><figcaption>해시 확인</figcaption></figure>

## PE 헤더와 섹션

Windows x64 PE 파일이고 섹션은 19개입니다. `.text`, `.data`, `.rdata` 외에 DWARF 디버그 정보로 보이는 `.debug_*` 섹션이 여러 개 있습니다.

<figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" loading="lazy" alt="PowerShell에서 본 PE 파일 헤더 값"></a><figcaption>PE 헤더</figcaption></figure>

<figure><a href="{{ '/assets/images/pe-sections.webp' | relative_url }}"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" loading="lazy" alt="PowerShell에서 출력한 PE 섹션 목록"></a><figcaption>섹션 19개</figcaption></figure>

섹션 이름만으로는 용도를 알 수 없어서 권한, 가상 주소, 실제 내용을 같이 봐야 합니다. 디버그 섹션이 남아 있는 것도 눈에 띄지만, 그것만으로 개발자나 제작 도구를 특정할 수는 없습니다.

<div class="pair"><figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="엔트리 포인트와 COFF 심볼 정보" loading="lazy"></a><figcaption>엔트리 포인트, COFF</figcaption></figure><figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARF 디버그 섹션 이름" loading="lazy"></a><figcaption>DWARF 섹션</figcaption></figure></div>

| 본 것 | 메모 |
| --- | --- |
| PE 헤더 | Windows x64 실행 파일 |
| 섹션 | 19개 |
| 엔트리 포인트 | 위치와 주변 코드 |
| COFF | 심볼 정보 |
| DWARF | 디버그 섹션 이름 |
| API | 함수 참조, 제어 코드 |

## `DeviceIoControl`과 `0x900B3`

Ghidra에서 참조를 따라가다가 `DeviceIoControl`에 제어 코드 `0x900B3`을 넘기는 부분을 찾았습니다. 파일시스템 제어 코드 표에서 찾아보면 `FSCTL_ENUM_USN_DATA`입니다.

[Microsoft 문서](https://learn.microsoft.com/ko-kr/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data)에 따르면 지정한 범위의 USN 데이터를 열거해서 MFT 레코드를 가져올 때 쓰는 코드입니다. 이 샘플에서 파일을 찾는 데 쓰는 건지, 다른 작업에 쓰는 건지는 아직 모릅니다. 호출부 앞뒤 코드와 인자를 더 봐야 합니다.

지금 확실한 건 코드에 이 참조가 있다는 것까지입니다. 실행 중에 실제로 호출되는지, 암호화 흐름과 이어지는지는 확인하지 못했습니다. MFT를 열거하는 것과 MFT를 수정하는 것도 다른 얘기입니다.

<figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" loading="lazy" alt="정적 조사에서 확인한 Windows API 이름"></a><figcaption>정적 조사 중에 추린 API 이름 (위 제어 코드 호출부 화면은 아님)</figcaption></figure>

## 문자열

경로와 확장자를 처리하는 부분에서 Windows 시스템 디렉터리, `.exe`, `.dll`, `.sys` 같은 문자열이 보였습니다. 암호화 대상에서 빼는 조건일 수도 있는데, 분기문과 호출 흐름을 따라가 봐야 알 수 있습니다.

## 남은 것

1편에 적은 파일명 변경과 백업 삭제는 공개 보고서 내용이고, 이번에 직접 본 건 PE 구조와 일부 코드 참조입니다. 둘을 이어 보려면 아래를 더 확인해야 합니다.

- `0x900B3` 호출로 이어지는 실제 흐름
- 대상 파일을 고르는 조건
- 암호화 함수와 키 처리
- 복구 방해 명령을 실행하는 코드
- 이 코드 경로들이 실제 실행에서 쓰이는지

VM에서 찍은 화면은 다음 글에 따로 모았습니다.

[다음 글: (3) VM에서 남긴 화면]({{ '/research/calipso-03/' | relative_url }})

## 참고

- [Microsoft Learn: FSCTL_ENUM_USN_DATA](https://learn.microsoft.com/ko-kr/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data)
- [Recorded Future Triage: 정적 정보](https://tria.ge/261006-nzbfjaay5m/static1), [행동 분석](https://tria.ge/261006-nzbfjaay5m/behavioral1)
