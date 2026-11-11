---
layout: page
title: 캡처
permalink: /evidence/
description: "Calipso 랜섬웨어 분석 중에 남긴 PE 헤더, 섹션, VM 화면 캡처"
---
Calipso를 분석하면서 찍은 캡처입니다. 누르면 원본 크기로 열립니다.

<div class="gallery">
<figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" alt="PowerShell SHA-256 출력" loading="lazy"></a><figcaption>1. 파일 해시 (SHA-256)</figcaption></figure>
<figure><a href="{{ '/assets/images/sample-metadata.webp' | relative_url }}"><img src="{{ '/assets/images/sample-metadata.webp' | relative_url }}" alt="분석 대상 파일 정보" loading="lazy"></a><figcaption>2. 파일 기본 정보</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" alt="PE 헤더 값" loading="lazy"></a><figcaption>3. PE 헤더</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-sections.webp' | relative_url }}"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" alt="PE 섹션 목록" loading="lazy"></a><figcaption>4. 섹션 19개의 이름과 크기</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="엔트리 포인트 정보" loading="lazy"></a><figcaption>5. 엔트리 포인트, COFF 출력</figcaption></figure>
<figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARF 섹션 이름" loading="lazy"></a><figcaption>6. DWARF 디버그 섹션</figcaption></figure>
<figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" alt="API 이름 출력" loading="lazy"></a><figcaption>7. 실행 파일에서 찾은 API 이름</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-powershell.webp' | relative_url }}"><img src="{{ '/assets/images/pe-powershell.webp' | relative_url }}" alt="PowerShell 명령 출력" loading="lazy"></a><figcaption>8. 파일 구조를 볼 때 쓴 PowerShell 출력</figcaption></figure>
<figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="VM의 .calipso 파일 목록" loading="lazy"></a><figcaption>9. VM에서 본 <code>.calipso</code> 확장자</figcaption></figure>
</div>

글: [(1) 공개 보고서]({{ '/research/calipso-01/' | relative_url }}) · [(2) 정적 분석]({{ '/research/calipso-02/' | relative_url }}) · [(3) VM 화면]({{ '/research/calipso-03/' | relative_url }})
