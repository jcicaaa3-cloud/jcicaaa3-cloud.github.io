---
layout: page
lang: ja
title: 資料
display_title: 分析時の画面
permalink: /ja/evidence/
intro: "分析時に保存した9枚のスクリーンショットです。クリックすると拡大できます。"
description: "CalipsoランサムウェアのPEヘッダー、Ghidraの調査画面、VMの記録"
---
個人で行った分析の記録を、内容ごとに整理しました。ターミナル出力はファイル構造を調べた際の記録であり、VMの画面は撮影時点の状態を示しています。

<div class="evidence-grid">
<figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" alt="SHA-256のPowerShell出力" loading="lazy"></a><figcaption><strong>01. ファイルのハッシュ</strong>分析対象を識別するためのSHA-256の確認。</figcaption></figure>
<figure><a href="{{ '/assets/images/sample-metadata.webp' | relative_url }}"><img src="{{ '/assets/images/sample-metadata.webp' | relative_url }}" alt="対象ファイルの情報" loading="lazy"></a><figcaption><strong>02. 基本情報</strong>実行ファイルのメタデータ。</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" alt="PEヘッダーの調査" loading="lazy"></a><figcaption><strong>03. PEヘッダー</strong>ファイル形式とヘッダー値の確認。</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-sections.webp' | relative_url }}"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" alt="PEセクション一覧" loading="lazy"></a><figcaption><strong>04. セクション一覧</strong>19個のセクション名とサイズ。</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="エントリーポイント" loading="lazy"></a><figcaption><strong>05. エントリーポイント</strong>開始アドレスとCOFFに関する出力。</figcaption></figure>
<figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARFセクション" loading="lazy"></a><figcaption><strong>06. DWARF</strong>デバッグ関連セクション名。</figcaption></figure>
<figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" alt="API名の一覧" loading="lazy"></a><figcaption><strong>07. API一覧</strong>実行ファイル内で確認したAPI名。</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-powershell.webp' | relative_url }}"><img src="{{ '/assets/images/pe-powershell.webp' | relative_url }}" alt="PowerShellの出力" loading="lazy"></a><figcaption><strong>08. PowerShell</strong>ファイル構造の調査に使った出力。</figcaption></figure>
<figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="VM上のcalipsoファイル一覧" loading="lazy"></a><figcaption><strong>09. ファイル一覧</strong>VM上で確認した<code>.calipso</code>拡張子。</figcaption></figure>
</div>

## 資料の出典について

掲載画像は分析中に記録・編集したものです。キャプチャに含まれるWindowsや各解析ツールのインターフェースは、それぞれの開発元に帰属します。

画像だけでマルウェアの機能を断定していません。公開された実行ログは[Recorded Future Triage](https://tria.ge/261006-nzbfjaay5m/behavioral1)、ファイルシステム制御コードの説明は[Microsoftの資料](https://learn.microsoft.com/ja-jp/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data)を参照しています。

関連記録：[公開資料]({{ '/ja/research/calipso-01/' | relative_url }}) · [静的解析]({{ '/ja/research/calipso-02/' | relative_url }}) · [VMの記録]({{ '/ja/research/calipso-03/' | relative_url }})
