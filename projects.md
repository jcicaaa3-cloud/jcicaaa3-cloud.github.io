---
layout: page
title: 프로젝트
display_title: 연구 프로젝트
permalink: /projects/
description: "보안 정적 분석, 컴퓨터 비전, 머신러닝 서비스와 로봇 평가 연구를 모은 jcicaaa3의 연구 아카이브"
---

<link rel="stylesheet" href="{{ '/assets/css/research-projects.css' | relative_url }}">

<div class="rp">
  <div class="rp-intro">
    <p class="rp-eyebrow">RESEARCH / PROJECTS</p>
    <p class="rp-lead">보안 분석과 컴퓨터 비전, 머신러닝, 로봇 평가 연구를 모았습니다.</p>
    <p>프로젝트별로 구현 내용과 실험 결과, 코드와 관련 자료를 정리했습니다.</p>
    <div class="rp-chips"><span>Security Analysis</span><span>Computer Vision</span><span>Machine Learning</span><span>Robotics Evaluation</span></div>
  </div>

  <h2 class="rp-heading">대표 연구</h2>
  <div class="rp-grid">
    <article class="rp-card rp-featured">
      <p class="rp-kicker">01 / Computer Vision · 실험 결과 공개</p>
      <h3>LiteRaceSegNet</h3>
      <p>도로 균열과 포트홀을 분할하는 경량 모델입니다. 모델 구조, 비교 실험, 경계 영역 평가를 정리했습니다.</p>
      <div class="rp-metrics"><span><strong>0.8072</strong><small>mIoU</small></span><span><strong>0.125M</strong><small>Parameters</small></span><span><strong>3.097ms</strong><small>CUDA / image</small></span></div>
      <p class="rp-links"><a href="{{ '/projects/literacesegnet/' | relative_url }}">연구 요약 읽기</a><a href="https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-">GitHub 코드·실험</a></p>
    </article>
    <article class="rp-card">
      <p class="rp-kicker">02 / Applied ML · 합성 데이터 실습</p>
      <h3>Financial Risk Scoring</h3>
      <p>분기별 재무 데이터를 처리하는 ML 서비스입니다. 입력 데이터 검사부터 모델 학습, FastAPI 예측 API까지 구현했습니다.</p>
      <p class="rp-note">예제 데이터: 합성 데이터</p>
      <p class="rp-links"><a href="{{ '/projects/financial-risk/' | relative_url }}">설계·검증 살펴보기</a><a href="https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL">GitHub 저장소</a></p>
    </article>
    <article class="rp-card">
      <p class="rp-kicker">03 / Robotics & AI · 연구 정리 중</p>
      <h3>로봇 행동 성공·실패 평가</h3>
      <p>로봇이 수행한 행동을 어떤 기준으로 성공 또는 실패로 판정할 것인가. 평가 정의에 따른 결과 차이를 다룬 졸업 연구입니다.</p>
      <p class="rp-note">실험 80회 · 분석 사례 874건</p>
      <p class="rp-links"><a href="{{ '/projects/robot-evaluation/' | relative_url }}">연구 질문 읽기</a></p>
    </article>
    <article class="rp-card">
      <p class="rp-kicker">04 / Cybersecurity · 분석 기록 진행 중</p>
      <h3>Calipso 정적 분석</h3>
      <p>SHA-256 확인, PE 섹션·엔트리 포인트 조사, Ghidra에서 추적한 Windows API 호출 등 직접 확인한 근거를 정리합니다.</p>

      <p class="rp-links"><a href="{{ '/research/' | relative_url }}">분석 글 목록</a><a href="{{ '/evidence/' | relative_url }}">캡처 자료</a></p>
    </article>
  </div>

  <section class="rp-end">
    <h2>관련 자료</h2>
    <p>AI 프로젝트별 코드와 실험 자료는 각 GitHub 저장소에서 확인할 수 있습니다. 랜섬웨어 분석 글은 별도로 모았습니다.</p>
    <p><a href="{{ '/research/' | relative_url }}">보안 기술 글 전체 보기</a> · <a href="https://github.com/jcicaaa3-cloud">GitHub 저장소 보기</a></p>
  </section>
</div>
