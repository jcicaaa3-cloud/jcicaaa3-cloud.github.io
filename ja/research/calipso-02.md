---
layout: post
lang: ja
summary_only: true
title: "Calipso：PE構造とWindows API"
lead: "PEセクション、エントリーポイント、Ghidraで確認したAPI呼び出しを調査しています。"
topic: "マルウェア解析"
date: 2026-11-06 13:00:00 +0900
permalink: /ja/research/calipso-02/
description: "PEセクション、エントリーポイント、Ghidraで確認したAPI呼び出しを調査しています。"
---
> **日本語要約**：このページは韓国語原文の全文翻訳ではありません。詳しい検証手順、根拠資料、追加の説明は[韓国語の原文]({{ '/research/calipso-02/' | relative_url }})をご覧ください。

対象ファイルのPEヘッダーとセクションを確認したところ、19個のセクションがありました。エントリーポイント、COFF関連の情報、DWARFに関連するセクション名も調査しました。

Ghidraでは`DeviceIoControl`に関連する制御コード`0x900B3`を確認しました。これは`FSCTL_ENUM_USN_DATA`として知られるコードで、NTFS上のファイル情報を列挙する処理に関連します。

**ただし、このAPI呼び出しが見つかったという事実だけで、実際にどの処理を実行したかを断定することはできません。** 前後の制御フローと引数の確認が必要です。

[韓国語の原文を読む →]({{ '/research/calipso-02/' | relative_url }})
