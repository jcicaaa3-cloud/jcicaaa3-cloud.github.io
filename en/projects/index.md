---
layout: page
lang: en
title: Projects
display_title: Research projects
permalink: /en/projects/
description: "Selected projects in computer vision, machine learning, robotic task evaluation, and malware analysis"
---
<link rel="stylesheet" href="{{ '/assets/css/research-projects.css' | relative_url }}">
<div class="rp">
  <div class="rp-intro">
    <p class="rp-eyebrow">RESEARCH / PROJECTS</p>
    <p class="rp-lead">Research across computer vision, machine learning, robotic task evaluation, and cybersecurity.</p>
    <p>Selected implementations, measurements, and links to the corresponding code and evidence.</p>
    <div class="rp-chips"><span>Security Analysis</span><span>Computer Vision</span><span>Machine Learning</span><span>Robotics Evaluation</span></div>
  </div>
  <h2 class="rp-heading">Selected work</h2>
  <div class="rp-grid">
    <article class="rp-card rp-featured">
      <p class="rp-kicker">01 / Computer Vision · Measured results</p><h3>LiteRaceSegNet</h3>
      <p>A lightweight segmentation model for road cracks and potholes. The project covers the network architecture, comparative experiments, and evaluation near object boundaries.</p>
      <div class="rp-metrics"><span><strong>0.8072</strong><small>mIoU</small></span><span><strong>0.125M</strong><small>Parameters</small></span><span><strong>3.097ms</strong><small>CUDA / image</small></span></div>
      <p class="rp-links"><a href="{{ '/en/projects/literacesegnet/' | relative_url }}">Research overview</a><a href="https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-">Code / experiments</a></p>
    </article>
    <article class="rp-card"><p class="rp-kicker">02 / Applied ML · Synthetic data</p><h3>Financial Risk Scoring</h3>
      <p>A machine learning service for quarterly financial data, including input validation, model training, and a FastAPI prediction interface.</p><p class="rp-note">The sample dataset is synthetic.</p>
      <p class="rp-links"><a href="{{ '/en/projects/financial-risk/' | relative_url }}">Design and validation</a><a href="https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL">GitHub</a></p></article>
    <article class="rp-card"><p class="rp-kicker">03 / Robotics & AI · Undergraduate research</p><h3>Robotic Task Success / Failure Evaluation</h3>
      <p>What counts as success when a robot completes a motion but misses the intended task outcome? A study of how evaluation criteria affect judgments.</p><p class="rp-note">80 runs · 874 analyzed cases</p><p class="rp-links"><a href="{{ '/en/projects/robot-evaluation/' | relative_url }}">Read the research question</a></p></article>
    <article class="rp-card"><p class="rp-kicker">04 / Cybersecurity · Ongoing</p><h3>Calipso Static Analysis</h3>
      <p>Hash verification, PE sections and entry points, and Windows API references observed in Ghidra.</p>
      <p class="rp-links"><a href="{{ '/en/research/' | relative_url }}">Research notes</a><a href="{{ '/en/evidence/' | relative_url }}">Screenshots</a></p></article>
  </div>
  <section class="rp-end"><h2>Related material</h2><p>AI project code and experimental material are linked through their repositories; malware analysis notes are kept separately.</p><p><a href="{{ '/en/research/' | relative_url }}">Security writing</a> · <a href="https://github.com/jcicaaa3-cloud">GitHub</a></p></section>
</div>
