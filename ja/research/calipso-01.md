---
layout: post
lang: ja
title: "Calipso解析 (1) 公開サンドボックスのレポートを読む"
date: 2026-11-05 11:00:00 +0900
permalink: /ja/research/calipso-01/
description: "Calipsoランサムウェアの公開Triage実行記録とPCRiskの記事を読んでまとめたメモ"
---
2026年10月、Calipsoというランサムウェアが公開報告されました。どんな動作をするのか知るために、まず公開サンドボックスの記録とセキュリティベンダーの記事を読みました。この記事の実行記録は自分で動かした結果ではなく、[Triageのレポート](https://tria.ge/261006-nzbfjaay5m/behavioral1)と[PCRiskの記事](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)から取ったものです。

## 解析対象

| 項目 | 値 |
| --- | --- |
| ファイル名 | `Calipso.exe` |
| SHA-256 | `9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed` |
| 形式 | Windows x64 PE |
| サイズ | 約7.7MB |
| 暗号化後の拡張子 | `.calipso` |
| 身代金メモ | `recovery.txt` |
| TriageレポートID | `261006-nzbfjaay5m` |

<figure><a href="{{ '/assets/images/sample-metadata.webp' | relative_url }}"><img src="{{ '/assets/images/sample-metadata.webp' | relative_url }}" alt="解析対象ファイルの基本情報" loading="lazy"></a><figcaption>ファイルの基本情報を確認した画面</figcaption></figure>

同じ名前のサンプルがすべて同じコードとは限らないので、以下は上のハッシュのサンプルについての内容です。

## ファイル名の変更

TriageのWindows 10での実行記録には、ファイル名の変更が13,144件残っていて、ファイル名の後ろに`.calipso`が付きます。ただしこれは名前が変わった件数なので、13,144個のファイルの中身が実際にすべて暗号化されたかまではわかりません。暗号化の方式や鍵の扱いはまだ見ていません。

## 復旧を妨げるコマンド

プロセスの記録に`vssadmin.exe`、`wmic.exe`、`wbadmin.exe`、`bcdedit.exe`があります。どれもシャドウコピー、バックアップ、復旧設定を扱うWindowsのツールです。

- `vssadmin`、`wmic`：シャドウコピーの削除
- `wbadmin`：バックアップカタログの削除
- `bcdedit`：復旧に関するブート設定の変更

コマンドを実行した記録はありますが、削除まで成功したかはログを別に見る必要があります。MITRE ATT&CKでは[T1490 Inhibit System Recovery](https://attack.mitre.org/techniques/T1490/)にあたります。

## イベントログと壁紙

`wevtutil.exe`でイベントログを消そうとした記録もあります。後でインシデントを調べるときに必要な記録が消えることになります。ATT&CKでは[T1685.005 Clear Windows Event Logs](https://attack.mitre.org/techniques/T1685/005/)に分類されています（旧ID T1070.001）。

壁紙も変わります。Triageでは`C:\ProgramData\calipso_wallpaper.png`を指す設定が見え、PCRiskには案内文と`recovery.txt`を残すと書かれています。

## 認証情報とネットワーク

自動解析の結果には、ブラウザのプロファイルとWindowsの認証情報へのアクセスを検知したという項目があります。実際にパスワードを取ったのか、外部に送ったのかはまだわかりません。

私が見たWindows 10での実行では、NetworkのRequests、TCP、UDPがすべて0でした。その実行では通信がなかった、という程度に受け取っていて、別の環境でも同じかはわかりません。

## 次の記事

公開記録だけではコードの中で何が起きているかわからないので、次はPEヘッダーとセクションを確認し、Ghidraで関数の参照をたどりました。

[次の記事：(2) PE構造とGhidra]({{ '/ja/research/calipso-02/' | relative_url }})

## 参考

- [Recorded Future Triage：動作解析](https://tria.ge/261006-nzbfjaay5m/behavioral1)（ファイル名変更件数、プロセス、ネットワーク）
- [Recorded Future Triage：静的情報](https://tria.ge/261006-nzbfjaay5m/static1)
- [PCRisk：Calipso ransomware](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)
- MITRE ATT&CK [T1490](https://attack.mitre.org/techniques/T1490/)、[T1685.005](https://attack.mitre.org/techniques/T1685/005/)
