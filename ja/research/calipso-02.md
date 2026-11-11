---
layout: post
lang: ja
title: "Calipso解析 (2) PE構造とGhidra"
date: 2026-11-06 13:00:00 +0900
permalink: /ja/research/calipso-02/
description: "Calipsoの実行ファイルのPEヘッダー、セクション、エントリポイントを確認し、GhidraでDeviceIoControlの呼び出しをたどった記録"
---
[前回]({{ '/ja/research/calipso-01/' | relative_url }})は公開レポートを読みましたが、今回は実行ファイル自体を開いてみました。ハッシュを確認し、PEヘッダー、セクション、エントリポイント、シンボル情報を見てから、Ghidraで関数の参照をたどりました。キャプチャはすべて11月6日に撮ったもので、元のファイルはリポジトリに置いていません。

```text
SHA-256  9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed
```

<figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" loading="lazy" alt="PowerShellで確認したSHA-256ハッシュ"></a><figcaption>ハッシュの確認</figcaption></figure>

## PEヘッダーとセクション

Windows x64のPEファイルで、セクションは19個です。`.text`、`.data`、`.rdata`のほかに、DWARFのデバッグ情報と思われる`.debug_*`セクションがいくつもあります。

<figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" loading="lazy" alt="PowerShellで見たPEファイルヘッダーの値"></a><figcaption>PEヘッダー</figcaption></figure>

<figure><a href="{{ '/assets/images/pe-sections.webp' | relative_url }}"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" loading="lazy" alt="PowerShellで出力したPEセクション一覧"></a><figcaption>19個のセクション</figcaption></figure>

セクション名だけでは用途がわからないので、権限、仮想アドレス、実際の中身も合わせて見る必要があります。デバッグセクションが残っているのは目を引きますが、それだけで開発者や制作ツールを特定することはできません。

<div class="pair"><figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="エントリポイントとCOFFシンボル情報" loading="lazy"></a><figcaption>エントリポイント、COFF</figcaption></figure><figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARFデバッグセクション名" loading="lazy"></a><figcaption>DWARFセクション</figcaption></figure></div>

| 見たもの | メモ |
| --- | --- |
| PEヘッダー | Windows x64の実行ファイル |
| セクション | 19個 |
| エントリポイント | 位置と周辺のコード |
| COFF | シンボル情報 |
| DWARF | デバッグセクション名 |
| API | 関数の参照、制御コード |

## `DeviceIoControl`と`0x900B3`

Ghidraで参照をたどっていくと、`DeviceIoControl`に制御コード`0x900B3`を渡している箇所が見つかりました。ファイルシステム制御コードの表で調べると`FSCTL_ENUM_USN_DATA`です。

[Microsoftのドキュメント](https://learn.microsoft.com/ja-jp/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data)によると、指定した範囲のUSNデータを列挙してMFTレコードを取得するときに使うコードです。このサンプルがファイルを探すのに使っているのか、別の処理に使っているのかはまだわかりません。呼び出し箇所の前後のコードと引数をもっと見る必要があります。

今はっきり言えるのは、コードにこの参照があるということまでです。実行中に実際に呼ばれるのか、暗号化の流れにつながるのかは確認できていません。また、MFTを列挙することとMFTを書き換えることは別の話です。

<figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" loading="lazy" alt="静的な調査で確認したWindows API名"></a><figcaption>静的な調査で拾ったAPI名（上の制御コードの呼び出し箇所の画面ではありません）</figcaption></figure>

## 文字列

パスや拡張子を扱う部分で、Windowsのシステムディレクトリや`.exe`、`.dll`、`.sys`といった文字列が見つかりました。暗号化の対象から外す条件かもしれませんが、分岐と呼び出しの流れを追ってみないとわかりません。

## 残っていること

1本目に書いたファイル名の変更やバックアップの削除は公開レポートの内容で、今回自分で見たのはPE構造と一部のコード参照です。この2つをつなげるには、次のことを確認する必要があります。

- `0x900B3`の呼び出しにつながる実際の流れ
- 対象ファイルを選ぶ条件
- 暗号化の関数と鍵の扱い
- 復旧を妨げるコマンドを実行するコード
- これらのコードパスが実際の実行で使われるか

VMで撮った画面は次の記事にまとめました。

[次の記事：(3) VMに残った画面]({{ '/ja/research/calipso-03/' | relative_url }})

## 参考

- [Microsoft Learn：FSCTL_ENUM_USN_DATA](https://learn.microsoft.com/ja-jp/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data)
- [Recorded Future Triage：静的情報](https://tria.ge/261006-nzbfjaay5m/static1)、[動作解析](https://tria.ge/261006-nzbfjaay5m/behavioral1)
