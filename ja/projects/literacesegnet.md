---
layout: page
lang: ja
title: LiteRaceSegNet
permalink: /ja/projects/literacesegnet/
description: "道路のひび割れ・ポットホール用の軽量セグメンテーションモデルLiteRaceSegNetの構造と実験結果"
---
道路のひび割れとポットホールを分割する軽量セグメンテーションモデルです。コードと実験データは[GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-)にあります。

ひび割れやポットホールは境界が不規則で、モデルを小さくするほど細部がつぶれやすくなります。そこでdetail/context featureとboundary-guided fusionを組み合わせた軽量なCNNにしました。

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

境界付近のIoUは0.3212で、全体のmIoUよりかなり低く出ました。境界が複雑な損傷領域で性能が落ちる部分なので、予測マスクを元画像に重ねた10枚を目でも比較しました。

ほかにやったこと：

- 画像・マスクの欠落、ファイル名・サイズの不一致のチェック
- 7種類のモデルのablation（同じ手順）

[← プロジェクト]({{ '/ja/projects/' | relative_url }})
