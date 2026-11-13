---
layout: post
lang: ja
title: "HYFLOCK解析（1）ハッシュとエンジン別の検知結果"
date: 2026-11-12 23:00:00 +0900
kind: malware
permalink: /ja/research/hyflock-01/
description: "HYFLOCKサンプルのハッシュとVirusTotalのエンジン別検知結果"
---
[予告記事]({{ '/ja/research/hyflock-preview/' | relative_url }})で書いたHYFLOCKです。ファイルを開く前に、ハッシュとVirusTotalの検知結果を先に書いておきます。

検知結果は2026-10-07に提出されたVirusTotalのレポートのもので、11月12日に確認しました。スキャンし直すと数字は変わるかもしれません。サンプルファイルは載せません。

| 項目 | 値 |
| --- | --- |
| MD5 | `3440c03e9c0ff4c9e916d8be021c1a40` |
| SHA-1 | `2374836f37c5a4ada114a0ced465dd2f9597b246` |
| SHA-256 | `b15482d0846ef997f9c049e77d85efeba4ab9b33550b4384052efeb1a3dcc8cc` |
| SSDeep | `49152:rZFcnnf3Srb/T2vO90d7HjmAFd4A64nsfJk8lm3gPKBBq0aD1RbJ/AREQjfWD3X+:M3/Sd6jfClXHKIbMG3ESeBb` |
| Authentihash | `5bf05e748fb55eced3df1cb0acc0fd434527c69f8c7b5256549f9431a9d6e480` |
| サイズ | `3,851,808 bytes` |
| 形式 | `PE32+ executable (console) x86-64 (stripped to external PDB), for MS Windows` |
| TimeStamp | `0000:00:00 00:00:00` |
| LinkerVersion | `3` |
| CodeSize | `726528` |
| EntryPoint | `0x628a0` |
| VirusTotalレポート提出 | `2026-10-07 04:59:22 UTC` |
| 確認した日 | `2026-11-12` |

## ファイル情報

TimeStampが0なので、ビルド時刻は分かりません。LinkerVersion 3は、GoでビルドしたWindows実行ファイルでよく見る値です。[Check Pointの記事](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/)では10月初めのビルドがGo製のCarrierだとされていますが、このファイルがそうかどうかは開いて確認するつもりです。

CodeSizeは726,528 bytesで、ファイルは3.85MBです。残りが何なのかはセクションを見ないと分かりません。

## エンジン別の検知結果

67エンジン中28エンジンが検知しました。

| エンジン | 検知名 |
| --- | --- |
| APEX | `Malicious` |
| AVG | `FileRepMalware [Misc]` |
| Alibaba | `Ransom:Win64/Killav.1bb95b75` |
| Avast | `FileRepMalware [Misc]` |
| Bkav | `W32.Malware.E568AD45` |
| CrowdStrike | `win/malicious_confidence_100% (W)` |
| Cylance | `Unsafe` |
| Cynet | `Malicious (score: 100)` |
| ESET-NOD32 | `Win64/Filecoder.AUT trojan` |
| Elastic | `malicious (high confidence)` |
| Ikarus | `Trojan-Ransom.Nishi` |
| Kaspersky | `UDS:Trojan-Ransom.Win64.Generic` |
| Lionic | `Trojan.Win32.Generic.j!c` |
| MaxSecure | `Trojan.Malware.300983.susgen` |
| McAfeeD | `Trojan:Win/Ransom.P` |
| Microsoft | `Ransom:MSIL/Killav.VD!MTB` |
| Paloalto | `generic.ml` |
| Rising | `Ransom.Agent!1.129F5 (CLASSIC)` |
| Sangfor | `Trojan.Win32.Save.a` |
| SentinelOne | `Static AI - Malicious PE` |
| Skyhigh | `BehavesLike.Win64.Generic.wh` |
| Sophos | `Mal/Generic-S` |
| Symantec | `ML.Attribute.HighConfidence` |
| Tencent | `Win64.Trojan-Ransom.Generic.Zolw` |
| TrellixENS | `Artemis!3440C03E9C0F` |
| Varist | `W64/Filecoder.QI.gen!Eldorado` |
| huorong | `Ransom/Qilin.a` |
| tehtris | `Generic.Malware` |

名前にRansomかFilecoderが入っているエンジンは10個です（Alibaba、ESET-NOD32、Ikarus、Kaspersky、McAfeeD、Microsoft、Rising、Tencent、Varist、huorong）。残り18個の名前にはランサムウェアという言葉がありません。`generic.ml`、`Static AI - Malicious PE`、`FileRepMalware`、`Mal/Generic-S`のような名前です。

ランサムウェアと書いているエンジン同士でも、付けている名前は違います。huorongはQilin、IkarusはNishi、AlibabaとMicrosoftはKillavです。

Microsoftの検知名には`MSIL`が入っています。普通は.NETのファイルに付く表記ですが、形式の情報には.NETの話がありません。ファイルを開いたら、まずCLRヘッダーがあるかを見るつもりです。

## 次に見ること

- PEヘッダー、セクション、インポート、文字列
- Goの実行ファイルと中のペイロードの関係
- ほかのビルドの検知結果
- Check Pointの記事と自分で見たものの比較

参考：[Check Pointの記事](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/) · [VirusTotal](https://www.virustotal.com/gui/file/b15482d0846ef997f9c049e77d85efeba4ab9b33550b4384052efeb1a3dcc8cc)
