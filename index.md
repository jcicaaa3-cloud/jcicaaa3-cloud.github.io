---
layout: default
title: "처음"
permalink: /
description: "jcicaaa3의 Calipso 랜섬웨어 분석과 컴퓨터보안 연구 기록"
---
<section class="home-opening" aria-labelledby="welcome-title">
  <div>
    <span class="home-kicker">2026년 11월 · 개인 연구 기록</span>
    <h1 id="welcome-title">안녕하세요.<br><span>jcicaaa3</span>입니다.</h1>
    <div class="home-intro">
      <p>이곳은 사이버보안 공부와 분석 과정을 적어두는 블로그입니다. 악성코드가 실제로 어떤 일을 하는지 궁금해서 공개 보고서를 찾아보고, 실행 파일의 구조도 직접 들여다보고 있습니다.</p>
    </div>
  </div>
  <aside class="home-aside" aria-label="연락처">
    <a href="mailto:jcicaaa3@gmail.com" aria-label="이메일 보내기">이메일</a>
    <a href="https://github.com/jcicaaa3-cloud" rel="me noopener noreferrer" target="_blank">GitHub</a>
  </aside>
</section>

<section class="home-section" aria-labelledby="feature-title">
  <div class="section-topline"><h2 id="feature-title">요즘 보고 있는 것</h2><span class="section-aux">Calipso / Windows 실행 파일</span></div>
  <div class="feature-sheet">
    <div class="feature-copy">
      <span class="mini-label">11월 6일에 적은 글 · 두 번째 기록</span>
      <h3>PE 섹션을 살펴보다가<br><code>0x900B3</code>을 발견했습니다</h3>
      <p>샘플의 해시를 확인한 다음 PE 헤더와 섹션을 읽었습니다. 이후 Ghidra에서 <code>DeviceIoControl</code> 호출과 연결된 파일시스템 제어 코드를 찾았고, 어떤 작업인지 더 살펴보는 중입니다.</p>
      <a class="note-link" href="{{ '/research/calipso-02/' | relative_url }}">정적 분석 글 읽기 →</a>
    </div>
    <a class="feature-photo" href="{{ '/research/calipso-02/' | relative_url }}" aria-label="Calipso PE 섹션 분석 글 보기">
      <img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" alt="PowerShell에서 확인한 PE 섹션 19개의 목록">
    </a>
  </div>
</section>

<!-- RP-HOME-BEGIN -->
<section class="home-section" aria-labelledby="research-projects-title">
  <div class="section-topline"><h2 id="research-projects-title">AI 연구 프로젝트</h2><a class="note-link" href="{{ '/projects/' | relative_url }}">프로젝트 전체 보기 →</a></div>
  <p>기존 AI 연구도 함께 정리했습니다. 경량 컴퓨터 비전 모델, 머신러닝 서비스, 로봇 행동 평가 연구를 프로젝트별로 소개합니다.</p>
  <p><a class="note-link" href="{{ '/projects/literacesegnet/' | relative_url }}">LiteRaceSegNet</a> · <a class="note-link" href="{{ '/projects/financial-risk/' | relative_url }}">Financial Risk Scoring</a> · <a class="note-link" href="{{ '/projects/robot-evaluation/' | relative_url }}">로봇 행동 평가</a></p>
</section>
<!-- RP-HOME-END -->

<section class="home-section" aria-labelledby="entries-title">
  <div class="section-topline"><h2 id="entries-title">최근에 적은 글</h2><a class="note-link" href="{{ '/research/' | relative_url }}">글 목록 →</a></div>
  <ol class="log-list">
  {% for post in site.posts limit:6 %}
    <li><a href="{{ post.url | relative_url }}"><span class="date">{{ post.date | date: '%Y.%m.%d' }}</span><span class="entry-title">{{ post.title | escape }}</span><span class="entry-class">{% if post.board_category == 'malware' %}랜섬웨어{% elsif post.board_category == 'cryptography' %}암호학{% else %}기록{% endif %}</span></a></li>
  {% endfor %}
  </ol>
</section>

<section class="home-section" aria-labelledby="photos-title">
  <div class="section-topline"><h2 id="photos-title">분석하면서 남긴 화면</h2><a class="note-link" href="{{ '/evidence/' | relative_url }}">사진 더 보기 →</a></div>
  <div class="contact-strip">
    <figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}" aria-label="SHA-256 확인 이미지 크게 보기"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" alt="PowerShell SHA-256 출력" loading="lazy"></a><figcaption>01 / 분석 대상 해시 확인</figcaption></figure>
    <figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" aria-label="엔트리 포인트 이미지 크게 보기"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="엔트리 포인트와 COFF 값" loading="lazy"></a><figcaption>02 / 엔트리 포인트 조사</figcaption></figure>
    <figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}" aria-label="VM 파일 목록 이미지 크게 보기"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt=".calipso 확장자가 붙은 VM 파일 목록" loading="lazy"></a><figcaption>03 / VM에서 확인한 파일명</figcaption></figure>
  </div>
</section>

<p class="small-outro">글을 쓰면서 놓친 부분이나 다시 확인한 내용은 해당 글에 날짜를 적어 덧붙이겠습니다.</p>
