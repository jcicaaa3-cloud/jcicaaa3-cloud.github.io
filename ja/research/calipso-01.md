---
layout: post
lang: ja
title: "Calipso解析 (1) 公開サンドボックスのレポートを読む"
date: 2026-11-05 11:00:00 +0900
kind: malware
permalink: /ja/research/calipso-01/
description: "Calipsoランサムウェアの公開Triage実行記録とPCRiskの記事のメモ"
---
Calipsoは2026年10月に公開報告されたランサムウェアです。サンプルを自分で開く前に、Triageの実行記録とPCRiskの記事を読みました。この記事の実行記録はすべてTriage（Windows 10）で見たものです。

| 項目 | 値 |
| --- | --- |
| ファイル名 | `Calipso.exe` |
| SHA-256 | `9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed` |
| 形式 | Windows x64 PE、約7.7MB |
| 拡張子 | `.calipso` |
| 身代金メモ | `recovery.txt` |
| Triage ID | `261006-nzbfjaay5m` |

<figure><a href="{{ '/assets/images/sample-metadata.webp' | relative_url }}"><img src="{{ '/assets/images/sample-metadata.webp' | relative_url }}" alt="解析対象ファイルの基本情報" loading="lazy"></a><figcaption>ファイルの基本情報</figcaption></figure>

## Triageで見たもの

ファイル名の変更が13,144件記録されていて、変更後の名前の末尾に`.calipso`が付きます。名前が変わった件数なので、実際に暗号化されたファイル数とは違うかもしれません。

プロセス一覧にはこんなコマンドが並んでいます。

- `vssadmin`、`wmic`：シャドウコピーの削除
- `wbadmin`：バックアップカタログの削除
- `bcdedit`：復旧に関するブート設定の変更
- `wevtutil`：イベントログの削除

ATT&CKでいうと[T1490](https://attack.mitre.org/techniques/T1490/)（Inhibit System Recovery）と[T1685.005](https://attack.mitre.org/techniques/T1685/005/)（Clear Windows Event Logs、旧T1070.001）です。

ほかに、壁紙を`C:\ProgramData\calipso_wallpaper.png`に変える設定と、ブラウザのプロファイル・Windowsの認証情報へのアクセスの検知がありました。NetworkのRequests、TCP、UDPはすべて0でした。

PCRiskの記事には`recovery.txt`とデスクトップの案内文の話が出てきます。

次の記事では実行ファイルを自分で開いてみました。→ [(2) PE構造とGhidra]({{ '/ja/research/calipso-02/' | relative_url }})

参考：[Triage 動作解析](https://tria.ge/261006-nzbfjaay5m/behavioral1) · [Triage 静的情報](https://tria.ge/261006-nzbfjaay5m/static1) · [PCRisk](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)
