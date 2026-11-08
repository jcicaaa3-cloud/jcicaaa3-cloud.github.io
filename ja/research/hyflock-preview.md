---
layout: post
lang: ja
title: "次回の解析予告：HYFLOCK — ウイルス対策ソフトは何を検知するのか"
lead: "Calipsoの次はHYFLOCKです。新しいビルドの構造と、製品によって検知結果が異なる理由を静的解析で調べます。"
topic: "ランサムウェア · 予告"
date: 2026-11-08 21:05:00 +0900
permalink: /ja/research/hyflock-preview/
description: "HYFLOCKランサムウェアの解析予告。Go製CarrierとRustペイロードの構造、検知結果の違いを調べる予定です。"
---
Calipsoの記録を整理した後、次に調べる対象として**HYFLOCK**を選びました。今回は実行ファイルの構造だけでなく、**ウイルス対策製品によって検知結果が異なる理由**にも注目します。

2026年11月4日に公開されたCheck Pointの調査によると、HYFLOCKの2026年10月初旬のビルドには、**Go言語で実装されたCarrier**が**Rust製のペイロード**を内包する構成がありました。その後のビルドでは実行方法やファイル処理も変化しています。

検知が製品によって異なる場合でも、それだけで「すべての対策ソフトを回避した」とは言えません。**検査日時、エンジン、対象となるビルド**を分けて記録し、観察できた事実を整理したいと考えています。

### 調査予定

1. **ファイル構造：** PEヘッダー、セクション、文字列、インポート情報を確認します。
2. **内部コンポーネント：** Go Carrierと内包されたペイロードの関係を静的解析で調べます。
3. **検知結果：** 製品間の違いを、サンプル識別情報と検査日時とともに記録します。
4. **既存研究との照合：** 公開レポートの記述と、自分で確認した内容を区別します。

**この記事は予告です。** 検証が完了したという意味ではありません。悪性の実行ファイルをサイトやGitHubで配布せず、公開資料と静的解析を中心に記録します。

**参考：** [Check Point — HYFLOCK Ransomware Evolves with New Builds and Encryption Weaknesses (2026-11-04)](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/)
