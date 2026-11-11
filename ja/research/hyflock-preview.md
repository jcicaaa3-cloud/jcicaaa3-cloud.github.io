---
layout: post
lang: ja
title: "次の解析対象：HYFLOCK"
date: 2026-11-08 21:05:00 +0900
permalink: /ja/research/hyflock-preview/
description: "Calipsoの次に解析するHYFLOCKランサムウェア。Go製のCarrier、Rustのペイロード、ウイルス対策ソフトの検知結果の違いを見る予定"
---
Calipsoの次に見るサンプルはHYFLOCKです。今回は実行ファイルの構造に加えて、ウイルス対策ソフトによって検知結果が違う理由も見てみたいと思っています。

HYFLOCKは最近何度もビルドが変わっているランサムウェアです。11月4日に出た[Check Pointの解析](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/)によると、10月初めのバージョンはGoで作られたCarrierの中にRustのペイロードが別に入っている構造で、その後のビルドでは実行方法やファイル処理の構造も変わったそうです。

特に気になるのは検知のほうです。検知するエンジンとしないエンジンがありますが、スキャンした時期やエンジンの検知方式、サンプルのバージョンによって結果は変わりえます。なので比較するときは、サンプルのハッシュとスキャンした時期も一緒に記録するつもりです。

## 見ること

1. CarrierのPEヘッダー、セクション、文字列、インポート
2. Goの実行ファイルと中に入っているペイロードの関係
3. エンジンごとの検知結果の違い（サンプルのハッシュ、スキャン時期つき）
4. Check Pointのレポートの内容と自分で確認した内容の比較

まだ解析を始めていないので、計画だけ書きました。サンプルファイルはブログやGitHubには載せません。

## 参考

- [Check Point：HYFLOCK Ransomware Evolves with New Builds and Encryption Weaknesses](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/)（2026-11-04）
