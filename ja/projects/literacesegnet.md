---
layout: page
lang: ja
title: LiteRaceSegNet
permalink: /ja/projects/literacesegnet/
description: "軽量道路損傷セグメンテーションモデルLiteRaceSegNetの実験・評価記録"
---
<link rel="stylesheet" href="{{ '/assets/css/research-projects.css' | relative_url }}">
<div class="rp rp-detail"><p class="rp-eyebrow">COMPUTER VISION / CASE STUDY</p>
<p class="rp-lead">道路のひび割れとポットホールを検出・分割する軽量セグメンテーションモデルです。</p>
<p><a href="{{ '/ja/projects/' | relative_url }}">← プロジェクト一覧</a> · <a href="https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-">GitHub / 実験資料</a></p></div>

## 研究課題

道路のひび割れやポットホールのような、不規則な境界を持つ領域は、軽量モデルでは細部の情報が失われやすくなります。LiteRaceSegNetは、detail/context featureとboundary-guided fusionを組み合わせた軽量CNNベースのモデルです。

## 記録した検証結果

| 指標 | 値 | 評価範囲 |
| --- | ---: | --- |
| mIoU | **0.8072** | AWS validation protocol |
| Damage IoU | **0.7113** | 同一の検証条件 |
| パラメータ数 | **約0.125M** | モデルのプロファイル |
| CUDA推論時間 | **3.097 ms/image** | 測定したCUDAプロファイル |
| アブレーション | **7種類** | 同一条件で比較 |
| 境界付近の集約IoU | **0.3212** | 32×32 / 64×64の境界パッチ |

数値は**V13の実験結果**です。検証手順と比較実験の詳細はGitHubで公開しています。

## 実装・検証内容

- 画像とマスクの欠落、ファイル名やサイズの不一致など、入力条件を確認しました。
- 7種類のモデル構成を同一手順で比較し、アブレーション結果を記録しました。
- 予測マスクを元画像に重ね、境界や小さな損傷箇所を確認しました。
- 10枚の可視化用画像を使い、定量指標だけでは把握しにくい誤差も調べました。

## 結果から分かったこと

全体のmIoUとは別に境界付近のIoUを評価しました。形状が複雑な損傷箇所で性能が落ちる点を確認し、10枚の予測マスクを比較しています。

**コード・実験：** [LiteRaceSegNetの公開コード](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-) · [実験結果ポータル](https://jcicaaa3-cloud.github.io/LiteRaceSegNet-V13-Portal-Clean/)

[← プロジェクト一覧]({{ '/ja/projects/' | relative_url }})
