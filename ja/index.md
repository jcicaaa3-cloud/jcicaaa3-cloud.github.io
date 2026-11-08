---
layout: default
lang: ja
title: ホーム
permalink: /ja/
description: "jcicaaa3によるマルウェアの静的解析、コンピュータビジョン、AIモデル評価の個人研究ノート"
---
<section class="home-opening" aria-labelledby="welcome-title">
  <div>
    <span class="home-kicker">2026年11月 · 個人研究ノート</span>
    <h1 id="welcome-title">こんにちは。<br><span>jcicaaa3</span>です。</h1>
    <div class="home-intro"><p>サイバーセキュリティの学習と分析過程を記録しているブログです。マルウェアの動作に関心があり、公開資料を確認しながら、実行ファイルの構造を調べています。コンピュータビジョンやAIモデルの評価に関する研究もまとめています。</p></div>
  </div>
  <aside class="home-aside" aria-label="連絡先">
    <a href="mailto:jcicaaa3@gmail.com">メール</a>
    <a href="https://github.com/jcicaaa3-cloud" target="_blank" rel="me noopener noreferrer">GitHub</a>
  </aside>
</section>
<section class="home-section" aria-labelledby="feature-title">
  <div class="section-topline"><h2 id="feature-title">最近調べていること</h2><span class="section-aux">Calipso / Windows実行ファイル</span></div>
  <div class="feature-sheet">
    <div class="feature-copy">
      <span class="mini-label">11月6日の記録 · 静的解析</span>
      <h3>PEセクションを調べる中で<br><code>0x900B3</code>を確認しました</h3>
      <p>ファイルのハッシュを照合し、PEヘッダーとセクションを確認しました。その後、Ghidraで<code>DeviceIoControl</code>の呼び出しに関連するファイルシステム制御コードを調べています。特定のAPIが存在するだけで、実際の動作が証明されるわけではない点にも注意しています。</p>
      <a class="note-link" href="{{ '/ja/research/calipso-02/' | relative_url }}">解析記録を読む →</a>
    </div>
    <a class="feature-photo" href="{{ '/ja/research/calipso-02/' | relative_url }}" aria-label="Calipso静的解析の記録"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" alt="PowerShellで確認した19個のPEセクション"></a>
  </div>
</section>
<section class="home-section" aria-labelledby="entries-title">
  <div class="section-topline"><h2 id="entries-title">最近の記録</h2><a class="note-link" href="{{ '/ja/research/' | relative_url }}">記事一覧 →</a></div>
  <ol class="log-list">
    <li><a href="{{ '/ja/research/hyflock-preview/' | relative_url }}"><span class="date">2026.11.08</span><span class="entry-title">次回の解析予告：HYFLOCKとウイルス対策製品の検知</span><span class="entry-class">予告</span></a></li>
    <li><a href="{{ '/ja/research/hybrid-cryptography/' | relative_url }}"><span class="date">2026.11.06</span><span class="entry-title">RSAとAESを用いたハイブリッド暗号化</span><span class="entry-class">暗号</span></a></li>
    <li><a href="{{ '/ja/research/calipso-03/' | relative_url }}"><span class="date">2026.11.06</span><span class="entry-title">Calipso：VM環境で確認した記録</span><span class="entry-class">解析</span></a></li>
    <li><a href="{{ '/ja/research/calipso-02/' | relative_url }}"><span class="date">2026.11.06</span><span class="entry-title">Calipso：PE構造とWindows APIの調査</span><span class="entry-class">解析</span></a></li>
    <li><a href="{{ '/ja/research/calipso-01/' | relative_url }}"><span class="date">2026.11.05</span><span class="entry-title">Calipso：公開資料と分析対象</span><span class="entry-class">解析</span></a></li>
  </ol>
</section>
<section class="home-section" aria-labelledby="photos-title">
  <div class="section-topline"><h2 id="photos-title">分析時の画面</h2><a class="note-link" href="{{ '/ja/evidence/' | relative_url }}">画像一覧 →</a></div>
  <div class="contact-strip">
    <figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" alt="SHA-256を確認したPowerShell出力" loading="lazy"></a><figcaption>01 / ハッシュの確認</figcaption></figure>
    <figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="エントリーポイントとCOFFの調査" loading="lazy"></a><figcaption>02 / エントリーポイント</figcaption></figure>
    <figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="VM上で確認したファイル一覧" loading="lazy"></a><figcaption>03 / VM上のファイル名</figcaption></figure>
  </div>
</section>
<p class="small-outro">新たに確認できたことや訂正があれば、日付を添えて各記事に追記します。</p>
