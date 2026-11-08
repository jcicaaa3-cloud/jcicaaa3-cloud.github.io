---
layout: page
lang: ja
title: プロジェクト
display_title: 研究プロジェクト
permalink: /ja/projects/
description: "コンピュータビジョン、機械学習、ロボット評価、マルウェアの静的解析に関する研究"
---
<link rel="stylesheet" href="{{ '/assets/css/research-projects.css' | relative_url }}">
<div class="rp">
  <div class="rp-intro">
    <p class="rp-eyebrow">RESEARCH / PROJECTS</p>
    <p class="rp-lead">コンピュータビジョン、機械学習、ロボットの評価、セキュリティ解析に関する研究をまとめています。</p>
    <p>各プロジェクトの実装内容、実験結果、関連するコードや資料を掲載しています。</p>
    <div class="rp-chips"><span>Security Analysis</span><span>Computer Vision</span><span>Machine Learning</span><span>Robotics Evaluation</span></div>
  </div>
  <h2 class="rp-heading">主な研究</h2>
  <div class="rp-grid">
    <article class="rp-card rp-featured">
      <p class="rp-kicker">01 / Computer Vision · 実験結果公開</p>
      <h3>LiteRaceSegNet</h3>
      <p>道路のひび割れやポットホールを分割する軽量モデルです。ネットワーク構造、比較実験、境界領域の評価をまとめました。</p>
      <div class="rp-metrics"><span><strong>0.8072</strong><small>mIoU</small></span><span><strong>0.125M</strong><small>Parameters</small></span><span><strong>3.097ms</strong><small>CUDA / image</small></span></div>
      <p class="rp-links"><a href="{{ '/ja/projects/literacesegnet/' | relative_url }}">研究概要</a><a href="https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-">GitHub / 実験資料</a></p>
    </article>
    <article class="rp-card">
      <p class="rp-kicker">02 / Applied ML · 合成データ使用</p>
      <h3>Financial Risk Scoring</h3>
      <p>四半期ごとの財務データを扱う機械学習サービスです。入力データの検証、モデル学習、FastAPIの予測APIまで実装しています。</p>
      <p class="rp-note">サンプルデータは合成データです。</p>
      <p class="rp-links"><a href="{{ '/ja/projects/financial-risk/' | relative_url }}">設計・検証の記録</a><a href="https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL">GitHub</a></p>
    </article>
    <article class="rp-card">
      <p class="rp-kicker">03 / Robotics & AI · 研究記録</p>
      <h3>ロボット動作の成功・失敗判定</h3>
      <p>ロボットの動作を何をもって「成功」とするか。評価基準によって判定が変わる問題を扱った卒業研究です。</p>
      <p class="rp-note">実行80回 · 分析対象874件</p>
      <p class="rp-links"><a href="{{ '/ja/projects/robot-evaluation/' | relative_url }}">研究課題を読む</a></p>
    </article>
    <article class="rp-card">
      <p class="rp-kicker">04 / Cybersecurity · 調査継続中</p>
      <h3>Calipsoの静的解析</h3>
      <p>SHA-256の照合、PEセクション・エントリーポイント、Ghidra上で確認したWindows APIの呼び出しなどを記録しています。</p>
      <p class="rp-links"><a href="{{ '/ja/research/' | relative_url }}">解析記録</a><a href="{{ '/ja/evidence/' | relative_url }}">画像資料</a></p>
    </article>
  </div>
  <section class="rp-end">
    <h2>関連資料</h2>
    <p>AI関連のコードと実験データは各GitHubリポジトリで公開しています。マルウェア解析の記録は別のページにまとめています。</p>
    <p><a href="{{ '/ja/research/' | relative_url }}">セキュリティ関連記事</a> · <a href="https://github.com/jcicaaa3-cloud">GitHub</a></p>
  </section>
</div>
