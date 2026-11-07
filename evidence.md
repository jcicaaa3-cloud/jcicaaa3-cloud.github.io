---
layout: page
title: "사진"
display_title: "분석 화면"
permalink: /evidence/
intro: "분석 중 남긴 캡처 9장입니다. 사진을 누르면 크게 볼 수 있습니다."
description: "Calipso 랜섬웨어 PE 헤더, Ghidra 조사 자료, VM 캡처 이미지"
---
<p>개인 분석 과정에서 남긴 캡처를 주제별로 정리했습니다. 터미널 출력은 파일 구조를 이해하기 위한 자료이고, VM 화면은 해당 시점에 보였던 상태를 보여줍니다.</p>
<div class="evidence-grid">
  <figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" alt="PowerShell SHA-256 출력" loading="lazy"></a><figcaption><strong>01. 파일 해시</strong>분석 대상을 식별할 때 확인한 SHA-256.</figcaption></figure>
  <figure><a href="{{ '/assets/images/sample-metadata.webp' | relative_url }}"><img src="{{ '/assets/images/sample-metadata.webp' | relative_url }}" alt="분석 대상 파일 정보" loading="lazy"></a><figcaption><strong>02. 기본 정보</strong>실행 파일의 메타데이터를 확인한 화면.</figcaption></figure>
  <figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" alt="PE 헤더 분석" loading="lazy"></a><figcaption><strong>03. PE 헤더</strong>파일 형식과 헤더 값을 확인하는 과정.</figcaption></figure>
  <figure><a href="{{ '/assets/images/pe-sections.webp' | relative_url }}"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" alt="PE 섹션 목록" loading="lazy"></a><figcaption><strong>04. 섹션 목록</strong>총 19개 섹션의 이름과 크기.</figcaption></figure>
  <figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="엔트리 포인트 정보" loading="lazy"></a><figcaption><strong>05. 엔트리 포인트</strong>시작 주소와 COFF 관련 출력.</figcaption></figure>
  <figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARF 섹션 이름" loading="lazy"></a><figcaption><strong>06. DWARF</strong>디버깅 관련 섹션 이름.</figcaption></figure>
  <figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" alt="API 문자열 출력" loading="lazy"></a><figcaption><strong>07. API 목록</strong>실행 파일에서 찾은 API 이름.</figcaption></figure>
  <figure><a href="{{ '/assets/images/pe-powershell.webp' | relative_url }}"><img src="{{ '/assets/images/pe-powershell.webp' | relative_url }}" alt="PowerShell 명령 출력" loading="lazy"></a><figcaption><strong>08. PowerShell</strong>파일 구조를 조사할 때 남긴 출력.</figcaption></figure>
  <figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="VM의 .calipso 파일 목록" loading="lazy"></a><figcaption><strong>09. 파일 목록</strong>VM에서 확인한 <code>.calipso</code> 확장자.</figcaption></figure>
</div>
<h2>사진과 자료의 출처</h2>
<p>이 페이지에 실린 사진 9장은 분석 과정에서 직접 남긴 화면을 편집한 것입니다. PowerShell 출력은 파일 헤더·해시·문자열 등을 확인할 때 기록했고, VM 파일 목록은 당시 화면 상태를 보여줍니다. 캡처에 보이는 Windows와 분석 도구의 화면 요소는 해당 제작사의 소프트웨어에 속합니다.</p>
<p>악성코드의 기능에 대한 설명은 캡처만으로 확정하지 않았습니다. 공개 실행 기록은 <a href="https://tria.ge/261006-nzbfjaay5m/behavioral1">Recorded Future Triage</a>, 파일시스템 제어 코드 설명은 <a href="https://learn.microsoft.com/ko-kr/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data">Microsoft 문서</a>를 참고했습니다.</p>
<p>관련 글: <a href="{{ '/research/calipso-01/' | relative_url }}">공개 보고서</a> · <a href="{{ '/research/calipso-02/' | relative_url }}">정적 분석</a> · <a href="{{ '/research/calipso-03/' | relative_url }}">VM 화면 기록</a></p>
