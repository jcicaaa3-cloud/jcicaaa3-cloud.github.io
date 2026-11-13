---
layout: page
lang: ja
title: プロジェクト
permalink: /ja/projects/
description: "jcicaaa3のセキュリティとAIのプロジェクト：Calipsoの静的解析、LiteRaceSegNet、Financial Risk Scoring、ロボット動作評価"
---
セキュリティとAIに分けてまとめました。コードと実験データはそれぞれのGitHubリポジトリにあります。

## セキュリティ

### Calipsoの静的解析 <small>v2.0</small>

Ghidraで暗号化の仕組み（XChaCha20 + RSA-4096 OAEP）、ファイル探索（MFTの列挙）、復旧妨害、プロセス終了を解析し、IOCとYARAルールをまとめました。

[解析 v2.0]({{ '/ja/research/calipso-v2/' | relative_url }}) · [キャプチャ]({{ '/ja/evidence/' | relative_url }})

### HYFLOCKのエンジン別検知比較 <small>予定</small>

Go製CarrierとRustペイロードの構造を見て、ウイルス対策エンジンで検知結果が分かれる理由を、ハッシュとスキャン日付きで比較する予定です。

[計画]({{ '/ja/research/hyflock-preview/' | relative_url }})

### RSA + AESのファイル暗号化ツール <small>v4</small>

ファイルはAES-256-CBC + HMAC-SHA256で暗号化し、ファイルごとの秘密値をRSA-OAEPで包み、さらにパスワードを要求するツールです。PowerShellとC#で作り、ソースコードをMITライセンスで公開しました。

[構成・検証・ソースコード]({{ '/ja/research/hybrid-cryptography/' | relative_url }})

## AI

### LiteRaceSegNet

道路のひび割れとポットホールを分割する軽量セグメンテーションモデルです。V13の実験ではmIoU 0.8072、パラメータ約0.125M、CUDAで画像1枚あたり3.097msでした。

[詳しく]({{ '/ja/projects/literacesegnet/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/LiteRaceSegNet-FINAL-)

### Financial Risk Scoring

四半期の財務データから次の四半期のリスクの兆候を予測するMLサービスです。入力データのチェックからモデルの学習、FastAPIの予測APIまで作りました。データは合成データです。

[詳しく]({{ '/ja/projects/financial-risk/' | relative_url }}) · [GitHub](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL)

### ロボット動作の成功・失敗評価 <small>2026年1学期</small>

ロボットの動作を何を基準に成功・失敗と判定するか、基準によって結果がどう変わるかを扱った研究プロジェクトです。実験80回、分析事例874件です。

[詳しく]({{ '/ja/projects/robot-evaluation/' | relative_url }})
