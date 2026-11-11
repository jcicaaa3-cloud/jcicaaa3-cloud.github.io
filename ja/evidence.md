---
layout: page
lang: ja
title: キャプチャ
permalink: /ja/evidence/
description: "Calipsoランサムウェアの解析中に撮ったPEヘッダー、セクション、VM画面のキャプチャ"
---
Calipsoを解析しながら撮ったキャプチャです。クリックすると元のサイズで開きます。

<div class="gallery">
<figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" alt="PowerShellでのSHA-256出力" loading="lazy"></a><figcaption>1. ファイルハッシュ（SHA-256）</figcaption></figure>
<figure><a href="{{ '/assets/images/sample-metadata.webp' | relative_url }}"><img src="{{ '/assets/images/sample-metadata.webp' | relative_url }}" alt="解析対象ファイルの基本情報" loading="lazy"></a><figcaption>2. ファイルの基本情報</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" alt="PEヘッダーの値" loading="lazy"></a><figcaption>3. PEヘッダー</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-sections.webp' | relative_url }}"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" alt="PEセクション一覧" loading="lazy"></a><figcaption>4. 19個のセクションの名前とサイズ</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="エントリポイントの情報" loading="lazy"></a><figcaption>5. エントリポイント、COFFの出力</figcaption></figure>
<figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARFセクション名" loading="lazy"></a><figcaption>6. DWARFデバッグセクション</figcaption></figure>
<figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" alt="API名の出力" loading="lazy"></a><figcaption>7. 実行ファイルから見つけたAPI名</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-powershell.webp' | relative_url }}"><img src="{{ '/assets/images/pe-powershell.webp' | relative_url }}" alt="PowerShellコマンドの出力" loading="lazy"></a><figcaption>8. ファイル構造を調べたときのPowerShell出力</figcaption></figure>
<figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="VM内の.calipsoファイル一覧" loading="lazy"></a><figcaption>9. VMで見た<code>.calipso</code>拡張子</figcaption></figure>
</div>

記事：[(1) 公開レポート]({{ '/ja/research/calipso-01/' | relative_url }}) · [(2) 静的解析]({{ '/ja/research/calipso-02/' | relative_url }}) · [(3) VMの画面]({{ '/ja/research/calipso-03/' | relative_url }})
