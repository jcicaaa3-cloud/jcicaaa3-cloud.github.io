---
layout: page
lang: ja
title: プロジェクト
permalink: /ja/projects/
description: "jcicaaa3のセキュリティとAIのプロジェクト：Calipsoの静的解析、LiteRaceSegNet、Financial Risk Scoring、ロボット動作評価"
---
セキュリティとAIに分けてまとめました。コードと実験データはそれぞれのGitHubリポジトリにあります。

## セキュリティ

### Calipsoの静的解析 <small>進行中</small>

ハッシュの確認、PEセクションとエントリポイント、Ghidraで見つけたWindows APIの呼び出しを記事にまとめています。

[関連記事]({{ '/ja/research/' | relative_url }}) · [キャプチャ]({{ '/ja/evidence/' | relative_url }})

### HYFLOCKのエンジン別検知比較 <small>予定</small>

Go製CarrierとRustペイロードの構造を見て、ウイルス対策エンジンで検知結果が分かれる理由を、ハッシュとスキャン日付きで比較する予定です。

[計画]({{ '/ja/research/hyflock-preview/' | relative_url }})

### RSA + AESのファイル暗号化ツール <small>設計中</small>

ファイルはAES-256-GCMで、AESの鍵はRSA-OAEPで暗号化するツールをPowerShellとC#で作っています。

[設計メモ]({{ '/ja/research/hybrid-cryptography/' | relative_url }})

## AI

### LiteRaceSegNet

道路のひび割れとポットホールを分割する軽量セグメンテーションモデルです。V13の実験ではmIoU 0.8072、パラメータ約0.125M、CUDAで画像1枚あたり3.097msでした。

[詳しく]({{ '/ja/projects/literacesegnet/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-)

### Financial Risk Scoring

四半期の財務データから次の四半期のリスクの兆候を予測するMLサービスです。入力データのチェックからモデルの学習、FastAPIの予測APIまで作りました。データは合成データです。

[詳しく]({{ '/ja/projects/financial-risk/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL)

### ロボット動作の成功・失敗評価 <small>まとめ中</small>

ロボットの動作を何を基準に成功・失敗と判定するか、基準によって結果がどう変わるかを扱った卒業研究です。実験80回、分析事例874件です。

[詳しく]({{ '/ja/projects/robot-evaluation/' | relative_url }})
