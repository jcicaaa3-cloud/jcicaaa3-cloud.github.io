---
layout: page
lang: ja
title: プロジェクト
permalink: /ja/projects/
description: "jcicaaa3のコンピュータビジョン、機械学習、ロボット評価のプロジェクトと進行中のセキュリティ解析"
---
これまでやったプロジェクトです。コードと実験データはそれぞれのGitHubリポジトリにあります。

## LiteRaceSegNet

道路のひび割れとポットホールを分割する軽量セグメンテーションモデルです。V13の実験ではmIoU 0.8072、パラメータ約0.125M、CUDAで画像1枚あたり3.097msでした。

[詳しく]({{ '/ja/projects/literacesegnet/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-)

## Financial Risk Scoring

四半期の財務データから次の四半期のリスクの兆候を予測するMLサービスです。入力データのチェックからモデルの学習、FastAPIの予測APIまで作りました。データは合成データです。

[詳しく]({{ '/ja/projects/financial-risk/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL)

## ロボット動作の成功・失敗評価

ロボットの動作を何を基準に成功・失敗と判定するか、基準によって結果がどう変わるかを扱った卒業研究です。実験80回、分析事例874件で、まだまとめている途中です。

[詳しく]({{ '/ja/projects/robot-evaluation/' | relative_url }})

## Calipsoの静的解析

進行中のセキュリティ解析です。ハッシュの確認、PEセクションとエントリポイント、Ghidraで見つけたWindows APIの呼び出しを記事にまとめています。

[関連記事]({{ '/ja/research/' | relative_url }}) · [キャプチャ]({{ '/ja/evidence/' | relative_url }})
