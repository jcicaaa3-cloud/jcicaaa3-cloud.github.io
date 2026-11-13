---
layout: page
lang: ja
title: 自己紹介
permalink: /ja/about/
description: "jcicaaa3：マルウェア解析・リバースエンジニアリング、ランサムウェア解析、YARA・MITRE ATT&CKによる検知、機械学習によるマルウェア検知とモデル評価に取り組むコンピュータ工学の学部生"
---
韓国外国語大学でコンピュータ工学を専攻し、北東アジア外交・通商を複数専攻しています。セキュリティとAIを一緒に勉強しています。

## やっていること

- マルウェア解析とリバースエンジニアリングをしています。GhidraでWindows PEファイルを静的解析していて、ランサムウェアCalipsoの暗号化の仕組み（XChaCha20 + RSA-4096）、ファイル探索（MFTの列挙）、復旧妨害を見ました。[解析 v2.0]({{ '/ja/research/calipso-v2/' | relative_url }})
- 解析した内容はIOC、YARAルール、MITRE ATT&CKのマッピングにまとめています。
- 機械学習によるマルウェア検知もやっています。EMBER2024で静的検知モデルを作り、ランサムウェアのファミリーごとに検知結果を比べているところです。
- AIのほうでは、コンピュータビジョンのモデルと機械学習サービスを作り、2026年1学期にロボットの動作評価の研究をしました。

## 関心のあること

同じファイルなのに、ウイルス対策エンジンによって検知結果が違います。1学期のロボットの研究でも、判定基準を変えると同じ動作が成功になったり失敗になったりしました。検知モデルも、誤検知率をいくつに置くか、どのサンプルで評価するかで結果が変わるので、今はその基準をどう決めるかを見ています。

## 使っているツール

Ghidra · YARA · MITRE ATT&CK · Python · PowerShell · Git

## 連絡先

- メール：[jcicaaa3@gmail.com](mailto:jcicaaa3@gmail.com)
- GitHub：[jcicaaa3-cloud](https://github.com/jcicaaa3-cloud)
