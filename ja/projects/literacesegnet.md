---
layout: page
lang: ja
title: LiteRaceSegNet
permalink: /ja/projects/literacesegnet/
description: "道路のひび割れ・ポットホール用の軽量セグメンテーションモデルLiteRaceSegNetの構造と実験結果"
---
道路のひび割れとポットホールを分割する軽量セグメンテーションモデルです。コードと実験データは[GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-)にあります。

## 課題

ひび割れやポットホールのように境界が不規則な領域は、モデルを小さくするほど細かい特徴が失われやすくなります。LiteRaceSegNetはdetail/context featureとboundary-guided fusionを組み合わせた軽量なCNNモデルです。

## 結果（V13）

| 指標 | 値 | 評価範囲 |
| --- | ---: | --- |
| mIoU | 0.8072 | AWS validation protocol |
| Damage IoU | 0.7113 | 同じ検証プロトコル |
| パラメータ | 約0.125M | モデルプロファイル |
| CUDAレイテンシ | 3.097 ms/image | CUDAプロファイルで測定 |
| Ablation | 7種類 | 同じ条件で比較 |
| 境界付近のaggregate IoU | 0.3212 | 32×32 / 64×64の境界パッチ |

評価設定と比較実験の全体はリポジトリと[実験結果ポータル](https://jcicaaa3-cloud.github.io/LiteRaceSegNet-V13-Portal-Clean/)にあります。

## 確認したこと

- 画像・マスクの欠落、ファイル名やサイズの不一致などの入力条件
- 7種類のモデルを同じ手順で回したablation
- 予測マスクを元画像に重ねて見た境界と小さな損傷領域
- 10枚の可視化で確認した、指標だけでは見えない誤り

全体のmIoUとは別に境界付近のIoUを測ってみると、境界が複雑な損傷領域で性能が落ちる部分がありました。そのため、予測マスク10枚を目でも比較しました。

[← プロジェクト]({{ '/ja/projects/' | relative_url }})
