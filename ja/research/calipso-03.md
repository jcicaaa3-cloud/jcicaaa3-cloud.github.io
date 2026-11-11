---
layout: post
lang: ja
title: "Calipso解析 (3) VMに残った画面"
date: 2026-11-06 16:00:00 +0900
permalink: /ja/research/calipso-03/
description: "仮想マシンに残った.calipsoのファイル名と壁紙の変更"
---
11月6日にVMで撮った画面です。多くのファイル名の末尾に`.calipso`が付いていて、デスクトップにもCalipsoの案内が表示されていました。後でログと照らし合わせるために残しておきました。

<figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="VM内で.calipso拡張子が付いたファイル一覧" loading="lazy"></a><figcaption>名前の後ろに<code>.calipso</code>が付いたファイル</figcaption></figure>

拡張子が変わったことは画面でわかりますが、ファイルの中身がどこまで暗号化されたかはファイルを開いてみないとわかりません。

## 壁紙

壁紙が変わったことも確認しましたが、その画面は載せていません。画面だけでは、どのプロセスやAPIが変えたのかはわかりません。公開されている[Triageの実行記録](https://tria.ge/261006-nzbfjaay5m/behavioral1)にも壁紙の設定の痕跡がありますが、私のVMで見たものとは別の資料です。

## 記事を3つに分けた理由

| 記事 | 資料 |
| --- | --- |
| [(1) 公開サンドボックス]({{ '/ja/research/calipso-01/' | relative_url }}) | Triageの公開実行レポート |
| [(2) 静的解析]({{ '/ja/research/calipso-02/' | relative_url }}) | PE構造、Ghidraでのコード参照 |
| (3) VMの画面 | 自分で撮ったキャプチャとメモ |

レポートで読んだことと自分で見たことを1つの記事に混ぜると、後でどこから来た情報かわからなくなりそうなので分けて書きました。

暗号化アルゴリズム、鍵の扱い、ファイルごとの変更時刻、レジストリやイベントログの変化はまだ見ていません。資料が揃ったら続きを書きます。

## 参考

- [Recorded Future Triage：Calipsoの実行記録](https://tria.ge/261006-nzbfjaay5m/behavioral1)
- [PCRisk：Calipso ransomware](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)

[キャプチャ一覧]({{ '/ja/evidence/' | relative_url }})
