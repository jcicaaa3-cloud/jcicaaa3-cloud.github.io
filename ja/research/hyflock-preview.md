---
layout: post
lang: ja
title: "次の解析対象：HYFLOCK"
date: 2026-11-08 21:05:00 +0900
kind: malware
permalink: /ja/research/hyflock-preview/
description: "Calipsoの次に見るHYFLOCKランサムウェア。Go製Carrier、Rustペイロード、エンジンごとの検知の違い"
---
Calipsoの次はHYFLOCKを見ようと思っています。

11月4日の[Check Pointの記事](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/)によると、10月初めのビルドはGoで作られたCarrierの中にRustのペイロードが入っている構造で、その後のビルドでは実行方法やファイル処理の仕方が変わったそうです。

今回は構造だけでなく、ウイルス対策エンジンによって検知結果が違う理由も見てみたいです。スキャンした時期やサンプルのバージョンでも結果は変わるので、比較するときはハッシュとスキャン日も一緒に書いておくつもりです。

見ること：

1. CarrierのPEヘッダー、セクション、文字列、インポート
2. Goの実行ファイルと中のペイロードの関係
3. エンジンごとの検知結果
4. Check Pointのレポートと自分で見たものの比較

サンプルファイルは載せません。
