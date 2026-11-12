---
layout: post
lang: ja
title: "Calipso解析 (2) PE構造とGhidra"
date: 2026-11-06 13:00:00 +0900
kind: malware
permalink: /ja/research/calipso-02/
description: "Calipsoの実行ファイルのPEヘッダーとセクション、Ghidraで見つけたDeviceIoControl 0x900B3の呼び出し"
---
[前回]({{ '/ja/research/calipso-01/' | relative_url }})はTriageのレポートだけを見ましたが、今回は実行ファイルを開きました。ハッシュの確認、PEヘッダーとセクション、Ghidraの順です。キャプチャは11月6日に撮ったもので、サンプルファイルは公開していません。

```text
SHA-256  9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed
```

<figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" loading="lazy" alt="PowerShellで確認したSHA-256ハッシュ"></a><figcaption>ハッシュの確認</figcaption></figure>

## PEヘッダー、セクション

x64のPEで、セクションは19個です。`.text`、`.data`、`.rdata`のほかに`.debug_*`セクションがいくつも残っていて、DWARFのデバッグ情報です。

<figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" loading="lazy" alt="PowerShellで見たPEファイルヘッダーの値"></a><figcaption>PEヘッダー</figcaption></figure>

<figure><a href="{{ '/assets/images/pe-sections.webp' | relative_url }}"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" loading="lazy" alt="PowerShellで出力したPEセクション一覧"></a><figcaption>19個のセクション</figcaption></figure>

<div class="pair"><figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="エントリポイントとCOFFシンボル情報" loading="lazy"></a><figcaption>エントリポイント、COFF</figcaption></figure><figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARFデバッグセクション名" loading="lazy"></a><figcaption>DWARFセクション</figcaption></figure></div>

## `DeviceIoControl`、`0x900B3`

Ghidraで参照をたどっていくと、`DeviceIoControl`に`0x900B3`を渡しているコードが見つかりました。制御コード表で調べると`FSCTL_ENUM_USN_DATA`で、[Microsoftのドキュメント](https://learn.microsoft.com/ja-jp/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data)によるとUSNデータを列挙してMFTレコードを取得するコードです。

何に使っているのかはまだ見ていません。ファイル探しに使っているかどうかは、呼び出し箇所の前後と引数をもう少し見ないとわからなそうです。

<figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" loading="lazy" alt="静的な調査で確認したWindows API名"></a><figcaption>拾ったAPI名（上の呼び出し箇所のキャプチャではありません）</figcaption></figure>

## 文字列

パス・拡張子を扱う部分に、Windowsのシステムディレクトリや`.exe`、`.dll`、`.sys`の文字列がありました。暗号化の除外条件っぽいですが、分岐を追ってみないと確かなことは言えません。

## 次に見ること

- `0x900B3`の呼び出しまでの流れ
- 対象ファイルを選ぶ条件
- 暗号化の関数、鍵の扱い
- 復旧を妨げるコマンドを実行するコード

VMのキャプチャは別の記事にしました。→ [(3) VMに残った画面]({{ '/ja/research/calipso-03/' | relative_url }})

参考：[Microsoft Learn：FSCTL_ENUM_USN_DATA](https://learn.microsoft.com/ja-jp/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data) · [Triage 静的情報](https://tria.ge/261006-nzbfjaay5m/static1) · [Triage 動作解析](https://tria.ge/261006-nzbfjaay5m/behavioral1)
