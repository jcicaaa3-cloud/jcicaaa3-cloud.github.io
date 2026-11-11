---
layout: post
lang: ja
title: "Calipso解析 (3) VMに残った画面"
date: 2026-11-06 16:00:00 +0900
permalink: /ja/research/calipso-03/
description: "仮想マシンに残った.calipsoのファイル一覧のキャプチャ"
---
11月6日のVMのキャプチャです。ファイル名の末尾に`.calipso`が付いていて、デスクトップにもCalipsoの案内が出ていました。

<figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="VM内で.calipso拡張子が付いたファイル一覧" loading="lazy"></a><figcaption><code>.calipso</code>が付いたファイル</figcaption></figure>

デスクトップのキャプチャは載せていません。[Triageの記録](https://tria.ge/261006-nzbfjaay5m/behavioral1)にも壁紙の設定の痕跡があるので、後でログと一緒に照らし合わせるつもりです。

まだ見ていないもの：暗号化アルゴリズム、鍵の扱い、ファイルごとの変更時刻、レジストリやイベントログの変化。

参考：[Triageの実行記録](https://tria.ge/261006-nzbfjaay5m/behavioral1) · [PCRisk](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware) · [キャプチャ一覧]({{ '/ja/evidence/' | relative_url }})
