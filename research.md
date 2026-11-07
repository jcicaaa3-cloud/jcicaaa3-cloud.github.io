---
layout: page
title: "글 목록"
display_title: "기록 모아보기"
permalink: /research/
intro: "날짜순으로 모았습니다. 제목이나 키워드를 검색해도 됩니다."
description: "jcicaaa3의 Calipso 랜섬웨어, Ghidra 정적 분석, 암호학 연구 글 목록"
---
<div data-research-board>
  <div class="board-toolbar">
    <input class="board-search" type="search" id="board-search" aria-label="글 검색" placeholder="제목이나 키워드 검색" autocomplete="off">
    <div class="board-filters" role="group" aria-label="글 분류">
      <button type="button" class="selected" data-board-filter="all" aria-pressed="true">전체</button>
      <button type="button" data-board-filter="malware" aria-pressed="false">랜섬웨어</button>
      <button type="button" data-board-filter="cryptography" aria-pressed="false">암호학</button>
      <button type="button" data-board-filter="other" aria-pressed="false">기타</button>
    </div>
  </div>
  <div class="board-labels" aria-hidden="true"><span>날짜</span><span>제목</span><span>분류</span></div>
  <div class="board-items">
  {% for post in site.posts %}
    <a class="board-item" data-board-item data-group="{{ post.board_category | default: 'other' }}" href="{{ post.url | relative_url }}">
      <span class="board-date">{{ post.date | date: '%Y.%m.%d' }}</span>
      <span><strong>{{ post.title | escape }}</strong><span class="board-desc">{{ post.lead | default: post.excerpt | strip_html | truncate: 100 | escape }}</span></span>
      <span class="board-type">{% if post.board_category == 'malware' %}랜섬웨어{% elsif post.board_category == 'cryptography' %}암호학{% else %}기타{% endif %}</span>
    </a>
  {% endfor %}
  </div>
  <p id="board-empty" hidden>찾은 글이 없습니다. 검색어를 바꿔보세요.</p>
  <p class="board-footer">현재 <span id="board-result-count">{{ site.posts | size }}개</span> 표시 중</p>
</div>
<p>Calipso 관련 파일을 그대로 공개하지는 않습니다. 분석에 사용한 화면은 <a href="{{ '/evidence/' | relative_url }}">사진 페이지</a>에 모았습니다.</p>
