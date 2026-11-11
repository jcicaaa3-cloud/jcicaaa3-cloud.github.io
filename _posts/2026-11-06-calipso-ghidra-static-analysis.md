---
layout: post
title: "Calipso 분석 (2) PE 구조와 Ghidra"
date: 2026-11-06 13:00:00 +0900
categories: [Malware-Analysis]
tags: [calipso, ghidra, pe, ntfs, static-analysis]
permalink: /research/calipso-02/
description: "Calipso 실행 파일의 PE 헤더와 섹션, Ghidra에서 찾은 DeviceIoControl 0x900B3 호출"
---
[지난 글]({{ '/research/calipso-01/' | relative_url }})에서는 Triage 보고서만 봤고, 이번에는 실행 파일을 직접 열었습니다. 해시 확인, PE 헤더와 섹션, Ghidra 순서로 봤습니다. 캡처는 11월 6일에 찍은 것이고 샘플 파일은 올리지 않습니다.

```text
SHA-256  9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed
```

<figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" loading="lazy" alt="PowerShell로 확인한 SHA-256 해시"></a><figcaption>해시 확인</figcaption></figure>

## PE 헤더, 섹션

x64 PE이고 섹션은 19개입니다. `.text`, `.data`, `.rdata` 말고도 `.debug_*` 섹션이 여러 개 남아 있는데, DWARF 디버그 정보로 보입니다.

<figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" loading="lazy" alt="PowerShell에서 본 PE 파일 헤더 값"></a><figcaption>PE 헤더</figcaption></figure>

<figure><a href="{{ '/assets/images/pe-sections.webp' | relative_url }}"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" loading="lazy" alt="PowerShell에서 출력한 PE 섹션 목록"></a><figcaption>섹션 19개</figcaption></figure>

<div class="pair"><figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="엔트리 포인트와 COFF 심볼 정보" loading="lazy"></a><figcaption>엔트리 포인트, COFF</figcaption></figure><figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARF 디버그 섹션 이름" loading="lazy"></a><figcaption>DWARF 섹션</figcaption></figure></div>

## `DeviceIoControl`, `0x900B3`

Ghidra에서 참조를 따라가다가 `DeviceIoControl`에 `0x900B3`을 넘기는 코드를 찾았습니다. 제어 코드 표에서 찾아보니 `FSCTL_ENUM_USN_DATA`였고, [Microsoft 문서](https://learn.microsoft.com/ko-kr/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data)상으로는 USN 데이터를 열거해서 MFT 레코드를 가져오는 코드입니다.

이걸 어디에 쓰는지는 아직 못 봤습니다. 파일을 찾는 데 쓰는지는 호출부 앞뒤와 인자를 더 봐야 알 것 같습니다.

<figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" loading="lazy" alt="정적 조사에서 확인한 Windows API 이름"></a><figcaption>추려 본 API 이름 (위 호출부 캡처는 아님)</figcaption></figure>

## 문자열

경로·확장자 처리 쪽에서 Windows 시스템 디렉터리와 `.exe`, `.dll`, `.sys` 문자열이 보였습니다. 암호화 제외 조건 같은데 분기를 따라가 봐야 확실합니다.

## 다음에 볼 것

- `0x900B3` 호출까지 가는 흐름
- 대상 파일을 고르는 조건
- 암호화 함수, 키 처리
- 복구 방해 명령을 실행하는 코드

VM 캡처는 따로 올렸습니다. → [(3) VM에서 남긴 화면]({{ '/research/calipso-03/' | relative_url }})

참고: [Microsoft Learn: FSCTL_ENUM_USN_DATA](https://learn.microsoft.com/ko-kr/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data) · [Triage 정적 정보](https://tria.ge/261006-nzbfjaay5m/static1) · [Triage 행동 분석](https://tria.ge/261006-nzbfjaay5m/behavioral1)
