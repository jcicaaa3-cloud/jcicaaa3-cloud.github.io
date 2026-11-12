---
layout: post
lang: ja
title: "HYFLOCK解析（1）ハッシュとエンジン別の検知結果"
date: 2026-11-12 23:00:00 +0900
kind: malware
permalink: /ja/research/hyflock-01/
description: "HYFLOCKのGo製Carrierサンプルのハッシュ、ファイルメタデータ、VirusTotalのエンジン別検知結果のまとめ"
---
> HYFLOCK連載の最初の記事です。予告記事は[次の解析対象：HYFLOCK]({{ '/ja/research/hyflock-preview/' | relative_url }})にあります。

実際のファイルを開く前に、公開情報だけで確認できる内容を先にまとめます。今回扱うのは、ハッシュ、ファイルのメタデータ、VirusTotalのエンジン別検知結果です。PE構造や内部のペイロードはまだ見ておらず、次回から扱う予定です。

サンプルファイルは載せません。検知結果は照会した時期やエンジンの更新によって変わることがあるため、以下の数値は2026年11月12日に照会した時点のものとしてお読みください。

| 項目 | 値 |
| --- | --- |
| MD5 | `3440c03e9c0ff4c9e916d8be021c1a40` |
| SHA-1 | `2374836f37c5a4ada114a0ced465dd2f9597b246` |
| SHA-256 | `b15482d0846ef997f9c049e77d85efeba4ab9b33550b4384052efeb1a3dcc8cc` |
| SSDeep | `49152:rZFcnnf3Srb/T2vO90d7HjmAFd4A64nsfJk8lm3gPKBBq0aD1RbJ/AREQjfWD3X+:M3/Sd6jfClXHKIbMG3ESeBb` |
| Authentihash | `5bf05e748fb55eced3df1cb0acc0fd434527c69f8c7b5256549f9431a9d6e480` |
| サイズ | `3,851,808 bytes`（約3.7MB） |
| 形式 | `PE32+ executable (console) x86-64, for MS Windows` |
| VirusTotal初回提出 | `2026-10-07 04:59:22 UTC` |
| 検知結果の照会日 | `2026-11-12` |

## メタデータから見えること

- **TimeStampが0です。** ビルド時刻の情報が空なので、この値からはコンパイル時期が分かりません。
- **LinkerVersionが3です。** GoのツールチェーンでビルドされたWindowsバイナリでよく見られる値と同じです。Check Pointのレポートで説明されているGo製Carrierの構造と一致するかどうかは、次回pclntabなどを自分で確認してから判断します。
- **ファイルサイズに比べてCodeSizeが小さいです。** CodeSizeは726,528 bytesで、ファイル全体は約3.85MBです。残りの領域に何が入っているかは、セクションとオーバーレイを確認しないと分かりません。
- **デバッグ情報がありません。** `No debug`、`stripped to external PDB`と表示されます。
- **TrIDの結果は一般的な分類にとどまります。** 最上位でも`Win64 Executable (generic)` 37.0%なので、ファミリーの判断にはあまり使えません。

## エンジン別の検知結果

67エンジン中**28エンジンが検知**しました。検知名の表記で分けると次のとおりです。この分類は検知名の文字列だけを見て分けたもので、各エンジンが実際にどの方式で判定したかを意味するものではありません。

| 分類 | エンジン数 | エンジン（検知名） |
| --- | --- | --- |
| ランサムウェア・Filecoderを明示 | 10 | Alibaba（`Ransom:Win64/Killav`）、ESET-NOD32（`Win64/Filecoder.AUT`）、Ikarus（`Trojan-Ransom.Nishi`）、Kaspersky（`UDS:Trojan-Ransom.Win64.Generic`）、McAfeeD（`Trojan:Win/Ransom.P`）、Microsoft（`Ransom:MSIL/Killav.VD!MTB`）、Rising（`Ransom.Agent`）、Tencent（`Win64.Trojan-Ransom.Generic`）、Varist（`W64/Filecoder.QI.gen`）、huorong（`Ransom/Qilin.a`） |
| ML・AI・レピュテーション・信頼度の表記 | 7 | AVG（`FileRepMalware`）、Avast（`FileRepMalware`）、CrowdStrike（`malicious_confidence_100%`）、Elastic（`malicious (high confidence)`）、Paloalto（`generic.ml`）、SentinelOne（`Static AI - Malicious PE`）、Symantec（`ML.Attribute.HighConfidence`） |
| 一般的なマルウェア・トロイの木馬の表記 | 11 | APEX、Bkav、Cylance、Cynet、Lionic、MaxSecure、Sangfor、Skyhigh、Sophos、TrellixENS、tehtris |

## 検知結果から見えること

- **エンジンによってファミリー名が違います。** Qilin（huorong）、Nishi（Ikarus）、Killav（Alibaba、Microsoft）のように、異なるファミリー名が付いています。ランサムウェアだという判断は複数のエンジンで共通していますが、どのファミリーかについては一致していません。
- **Microsoftの検知名に`MSIL`が含まれています。** MSILは通常.NETバイナリに付く表記です。しかし、ファイル形式の情報には.NETに関する表示がありません。CLRヘッダーが実際にあるかどうかは次回確認します。
- **ランサムウェアを明示していない検知が18件あります。** 28件中18件はML・レピュテーション系か、一般的なマルウェアの表記です。マルウェアだという判断とランサムウェアという分類が、エンジンごとに別々に行われていることがうかがえます。
- **39エンジンは検知しませんでした。** 今回は未検知の原因を推測しません。同じファミリーの別ビルドと検知結果を比較したうえで、静的な特徴と結び付けて扱います。

## まだやっていないこと

- PEヘッダー、セクション、エントロピー、インポートの確認
- Go製Carrierと内部ペイロードの関係の確認
- ほかのHYFLOCKビルドとの検知結果の比較
- Check Pointのレポート内容との照合

次回はファイルを実際に開いて、PE構造とGo製Carrierを見ます。

参考：[Check Point：HYFLOCK](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/) · [VirusTotal](https://www.virustotal.com/gui/file/b15482d0846ef997f9c049e77d85efeba4ab9b33550b4384052efeb1a3dcc8cc)
