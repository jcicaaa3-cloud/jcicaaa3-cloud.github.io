---
layout: page
lang: ja
title: Financial Risk Scoring
permalink: /ja/projects/financial-risk/
description: "合成財務データを用いた機械学習API、データ検証、時系列評価の実装記録"
---
<link rel="stylesheet" href="{{ '/assets/css/research-projects.css' | relative_url }}">
<div class="rp rp-detail"><p class="rp-eyebrow">MACHINE LEARNING / SERVICE DESIGN</p>
<p class="rp-lead">四半期ごとの財務データを扱う機械学習APIを実装しました。</p>
<p><a href="{{ '/ja/projects/' | relative_url }}">← プロジェクト一覧</a> · <a href="https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL">GitHub / コード</a></p></div>

## プロジェクト概要

合成の財務データから、翌四半期のリスク指標を推定するサンプルサービスを作成しました。PythonとFastAPIを使って、入力データの検証、モデル比較、単件・バッチ推論を実装しています。

> 実験に使用したデータは合成データであり、実際の投資判断を目的としたものではありません。

## 構成

1. **データ契約：** CSVの必須項目、データ型、欠損値などを確認します。
2. **特徴量生成：** 企業と四半期を単位とするデータを整理し、比率や前四半期との差分を計算します。
3. **評価：** 時系列順の分割とwalk-forward評価によって、データ漏洩のリスクを確認します。
4. **モデル比較：** Dummy、Logistic Regression、Random Forestの基準モデルを比較します。
5. **API：** FastAPIによる単件・バッチ予測、結果データ、監視用レポートを用意します。

## 時系列を考慮した評価

四半期データでは、未来時点の情報を学習時に使わないことが重要です。そのため、データを時系列順に分割し、walk-forward方式で評価する構成にしています。

ブラウザ上のデモは独立したサンプルロジックで動作し、FastAPIのバックエンドとは別物です。

**コード：** [Financial Risk Scoring Service](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL)

[← プロジェクト一覧]({{ '/ja/projects/' | relative_url }})
