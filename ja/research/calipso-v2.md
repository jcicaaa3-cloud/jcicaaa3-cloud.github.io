---
layout: post
lang: ja
title: "Calipso解析 v2.0：暗号化の仕組みと実行の流れ"
date: 2026-11-12 12:00:00 +0900
kind: malware
permalink: /ja/research/calipso-v2/
description: "Calipsoランサムウェアの静的解析まとめ。XChaCha20 + RSA-4096 OAEP、先頭5MBの部分暗号化、MFTによるファイル探索、復旧妨害、IOCとYARAルール"
---
Calipso.exeをGhidra 12.2で静的解析した内容のまとめです。(1)〜(3)の内容を含め、その後に見た暗号化の仕組みと実行の流れを加えました。静的解析のみで、実行時の挙動はRecorded Future Triageの公開レポートを参照しました。関数アドレスはイメージベース`0x140000000`基準です。

## 要約

- ファイルはXChaCha20で暗号化します。各ファイルの先頭最大5MBだけをその場で上書きします。
- 1回の実行で32バイトのセッションキーを1つ作り、バイナリに埋め込まれたRSA-4096公開鍵（OAEP、SHA-1）で暗号化して、すべてのファイルの末尾に付けます。
- 暗号化されたファイルは元より正確に536バイト大きくなります（nonce 24B + RSA暗号文 512B）。
- 攻撃者の秘密鍵がなければ復号できません。ただし5MBを超える部分は元のまま残り、セッションキーはメモリから消されないので、感染中に取ったメモリダンプがあればそこからキーを取り出せます。
- ローカルのNTFSドライブはMFTを直接列挙してファイル一覧を作り（`FSCTL_ENUM_USN_DATA`）、それ以外はフォルダを順にたどって探索します。
- ほかに、管理者権限での再実行、許可リスト外のプロセス終了、シャドウコピーとバックアップカタログの削除、ブート回復の無効化、全イベントログの削除、壁紙の固定、`recovery.txt`の作成を行います。

## 解析対象

| 項目 | 値 |
| --- | --- |
| ファイル名 | `Calipso.exe` |
| SHA-256 | `9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed` |
| 形式 | Windows x64 PE、約7.7MB |
| ビルド | MinGW-w64 GCC、Crypto++静的リンク（CMakeのビルドパス`/src/build/_deps/cryptopp-cmake-build/`が残存） |
| ツール | Ghidra 12.2、静的解析のみ |

関数名は残っていない（`FUN_`）ので、Windows APIから逆にたどって解析しました。アルゴリズムと処理段階は、残っているCrypto++のクラス名（RTTI）とデバッグログの文字列から区別しました。

## 実行の流れ

本体は`FUN_14000d810`です。呼び出し順にまとめると次のとおりです。

```text
FUN_14000d810
 ├ 環境変数 CALIPSO_LOG を確認 → デバッグログのオン/オフ
 ├ 埋め込みPEM公開鍵 → Base64デコード → RSA公開鍵を読み込み
 ├ FUN_1400059f0  SeDebug / SeBackup / SeRestore 権限を有効化
 ├ FUN_140005bb0  許可リスト外のプロセスを終了
 ├ 補助スレッドを2つ起動
 ├ FUN_140004ab0  セッションキー32Bを生成
 ├ FUN_14000d250  セッションキーをRSA-OAEPで暗号化 → 512B
 ├ 対象の決定：引数なしなら全ボリューム、あればドライブ文字かUNCパス
 ├ FUN_1400098d0  ファイル探索 + マルチスレッド暗号化
 ├ 補助スレッドの終了を待つ
 ├ FUN_1400055a0  デスクトップにrecovery.txtを書いて開く
 └ "[*] Done."
```

管理者として再実行する関数（`FUN_140001ef0`、`ShellExecuteW`の`runas`）と壁紙を変える関数（`FUN_1400066a0`）は、この流れとは別に入っています。

## 暗号化

### ファイル1つ（`FUN_140006c80`）

1. ファイルを読み書き・共有なしで開きます。サイズが0なら何もしません。
2. 先頭から最大`0x500000`（5MiB）だけ読みます。
3. ファイルごとに24バイトのnonceを新しく作ります（Crypto++の乱数生成器、OSの乱数でシード）。
4. セッションキー（32B）とnonce（24B）でXChaCha20を設定し、読んだバッファをその場で暗号化します。
5. ファイルの先頭に戻って同じ長さを上書きし、末尾にnonceとRSAで暗号化したセッションキーを付けます。
6. `MoveFileExW`で名前の末尾に`.calipso`を付けます。

```c
if (0x500000 < fileSize) toRead = 0x500000;                 // 先頭5MiBのみ
FUN_1400145f0(&cipher, sessionKey, 0x20, nonce, 0x18);      // キー32B、nonce 24B
```

キー32B・nonce 24Bでサイズが変わらないストリーム暗号で、バイナリに`XChaCha20_Policy`、`SymmetricCipherFinal<…XChaCha20_Info>`のRTTIがあります。Salsa20系のRTTIはありません。

### 暗号化されたファイルの構造

```text
[ 先頭最大5MiB：暗号文 ][ 5MiB以降：元のまま ][ nonce 24B ][ RSA暗号文 512B ]
```

- 元のファイルより正確に536バイト大きくなります。
- 同じ実行で暗号化されたファイルは、末尾512バイトがすべて同じです。セッションキーを1回だけRSAで暗号化して全ファイルに付けるからです。インシデント対応では、同じ感染で被害を受けたファイルをまとめるのに使えます。

### セッションキーと公開鍵

- `FUN_140004ab0`：Crypto++の乱数生成器で32バイトのセッションキーを作ります。シードは`CryptGenRandom`から取ります。
- `FUN_14000d250`：セッションキーを埋め込み公開鍵で暗号化します。出力サイズはモジュラスのサイズ（512B）です。バイナリ内のRSA暗号化クラスは`RSAES<OAEP<SHA1>>`だけです。
- 公開鍵は`0x1402EB9C0`にPEM（`BEGIN PUBLIC KEY`）テキスト800バイトで入っています。本体が1行ずつ読み、`-----`を含むヘッダー行とフッター行を除いてBase64デコードします。

| 項目 | 値 |
| --- | --- |
| アルゴリズム | RSA 4096ビット、e = 65537 |
| SPKI（DER）SHA-256 | `3ec19d669d122966b8365722060a32dfbe5f6ca09d12b3397bb6940d831005d2` |

### 復旧の手がかり

- セッションキーはRSA-4096 OAEPで守られていて、攻撃者の秘密鍵なしには解けません。
- 5MiBを超える部分は元のままです。動画、データベース、ディスクイメージのような大きなファイルは一部を救えます。
- 本体はセッションキーとRSA暗号文を0で消さずに解放します（`FUN_14000d810`の終わり）。ファイル暗号化関数のほうはcipherの状態を消します。感染中や直後のメモリダンプからセッションキーが見つかれば、その実行で暗号化されたファイルはすべて復号できます。キーが実行ごとに1つだからです。

## ファイル探索（`FUN_1400098d0`）

### スレッド構成

| 役割 | 数 |
| --- | --- |
| 暗号化ワーカー | CPUコア数 × 2、最小8、最大64 |
| フォルダツリー探索（MFTを使わないとき） | 2〜8 |
| フォルダごとの処理 | 2 |

ワーカースレッド（`FUN_140007430`）は共有キューからパスを1つずつ取り出して暗号化し、成功・失敗の数をアトミックに数えます。

### MFTの列挙

ボリュームが`X:`形式で、ドライブの種類が固定かリムーバブルで、ファイルシステムがNTFSならMFTの経路を使います。

1. `\\.\X:`を`FILE_FLAG_BACKUP_SEMANTICS`で開きます。
2. 64MBのバッファを確保して`DeviceIoControl(0x900B3)`を繰り返し呼びます。`0x900B3`は`FSCTL_ENUM_USN_DATA`です。入力は`MFT_ENUM_DATA_V1`（32B）で、失敗するとV0（24B）で再試行します。
3. レコードをハッシュマップ（50万エントリを予約）に集め、ディレクトリとリパースポイント以外をファイルとして数えます。
4. 親の参照をたどってフルパスを組み立て、暗号化キューに入れます。

```c
DeviceIoControl(hVolume, 0x900b3, &enumData, 0x20, buf, 0x4000000, &returned, NULL);
```

条件に合わないとき（NTFSでない、ネットワークパス、MFTの列挙に失敗）は、フォルダを下っていく通常の探索に切り替えます。

(2)で`0x900B3`を何に使っているかわからないと書きましたが、ローカルのNTFSドライブのファイル一覧を一度に取るためでした。この経路を通るとデバッグログに`[+] MFT: …`が出ます。

検知の側から見ると、普通のランサムウェアは`FindFirstFileW`/`FindNextFileW`をフォルダごとに何度も呼びますが、MFTの列挙はボリュームあたり`DeviceIoControl`を数回呼ぶだけで終わります（1回で最大64MB）。API呼び出しの頻度で判断する検知モデルには、まったく違うパターンに見えます。

## 暗号化の前の準備

### 権限（`FUN_1400059f0`）

`SeDebugPrivilege`、`SeBackupPrivilege`、`SeRestorePrivilege`を有効にします。ほかのプロセスを終了させたり、アクセス権（ACL）で拒否されているファイルまで読み書きしたりするための権限です。

### プロセスの終了（`FUN_140005bb0`）

実行中のプロセスを順に見て、名前（小文字）に許可リストの文字列が1つも含まれていなければ`TerminateProcess`で終了させます。リストは`0x1401ED000`に72個あります。終了させるリストではなく残すリストなので、Office、DB、ブラウザ、バックアップソフト、他社製ウイルス対策はすべて終了させられます。

| 分類 | 残すプロセス（一部） |
| --- | --- |
| OSの中核 | system, smss, csrss, wininit, services, lsass, winlogon, svchost, registry, memory compression |
| 画面・シェル | explorer, dwm, sihost, shellexperiencehost, startmenuexperiencehost, logonui |
| コマンド実行に必要 | conhost, wmiprvse, dllhost, taskhostw |
| Microsoft Defender | msmpeng, mssecflt, securityhealthservice |
| 仮想化ツール | vboxservice, vboxtray, vmtoolsd, vmwaretray, qemu-ga, vmic*（Hyper-V）, vmcompute, hvhost |
| その他 | powershell、グラフィックドライバーのトレイ |

部分一致の比較なので、名前に`system`のような単語が入っていれば終了を免れます。

## 復旧妨害とログの削除

`FUN_140002320`が`cmd.exe /C <コマンド>`をウィンドウなしで実行し、終わるまで待ちます。`cmd.exe /C `の文字列は整数定数で組み立てられているので、普通の文字列検索には出てきません。

| 関数 | コマンド |
| --- | --- |
| `FUN_140005fc0` | `vssadmin Delete Shadows /All /Quiet` |
| | `wmic shadowcopy delete /nointeractive` |
| | `wbadmin delete catalog -quiet` |
| | `bcdedit /set {default} bootstatuspolicy ignoreallfailures` |
| | `bcdedit /set {default} recoveryenabled No` |
| `FUN_140006280` | `for /F "tokens=*" %i in ('wevtutil el') do wevtutil cl "%i"` |

Triageの実行記録に出てくる`vssadmin`、`wmic`、`wbadmin`、`bcdedit`、`wevtutil`のプロセスと一致します。最後のコマンドはセキュリティログだけでなく、すべてのイベントログのチャネルを消します。

## ランサムノートと壁紙

- `FUN_1400055a0`：デスクトップフォルダに`recovery.txt`を書き、既定のエディタで開きます。失敗したら`notepad.exe`を直接起動します。ノートにはバイナリにハードコードされたCase IDが入ります（`3422…`、以下省略）。
- `FUN_1400066a0`：バイナリ内のPNG（`0x1401ED300`、1,042,055B）をファイルに書き出して壁紙に設定します。`HKCU\Control Panel\Desktop`だけでなく`HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System`にも書くので、ユーザーは壁紙を戻せません。

## 検知の指標

### IOC

| 種類 | 値 |
| --- | --- |
| SHA-256 | `9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed` |
| 拡張子 | `.calipso` |
| ランサムノート | デスクトップの`recovery.txt` |
| 壁紙画像 | `C:\ProgramData\calipso_wallpaper.png`（Triage基準） |
| レジストリ | `HKLM\…\Policies\System\Wallpaper`、`WallpaperStyle` = `10` |
| 環境変数 | `CALIPSO_LOG` |
| 公開鍵のフィンガープリント | SPKI SHA-256 `3ec19d66…831005d2` |
| ファイルの特徴 | サイズ+536B、同じ感染のファイル同士で末尾512Bが同一 |
| ログ文字列 | `[*] Starting Calipso...`、`[*] Destroying recovery (`、`[+] MFT queued: `、`[*] Tree scan: ` |

### YARA

```yara
rule Calipso_Ransomware_2026
{
    meta:
        author = "jcicaaa3"
        date = "2026-11-12"
        description = "Calipso ransomware, strings found by static analysis"
        hash = "9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed"
        reference = "https://jcicaaa3-cloud.github.io/research/calipso-v2/"

    strings:
        $env  = "CALIPSO_LOG" ascii
        $log1 = "[*] Starting Calipso..." ascii
        $log2 = "[*] Destroying recovery (" ascii
        $log3 = "[+] MFT queued: " ascii
        $log4 = "[*] Tree scan: " ascii
        $log5 = "[*] Displaying ransom note..." ascii
        $ext  = ".calipso" ascii wide
        $note = "recovery.txt" ascii wide
        $cmd1 = "vssadmin Delete Shadows /All /Quiet" ascii
        $cmd2 = "wmic shadowcopy delete /nointeractive" ascii
        $cmd3 = "bcdedit /set {default} recoveryenabled No" ascii
        $cmd4 = "for /F \"tokens=*\" %i in ('wevtutil el') do wevtutil cl \"%i\"" ascii

    condition:
        uint16(0) == 0x5A4D and filesize < 20MB and
        (
            ($env and 2 of ($log*)) or
            ($ext and $note and 3 of ($cmd*))
        )
}
```

2つの条件のどちらかに合えば検知します。デバッグ文字列を消したビルドが出ても、拡張子・ノート・コマンドの組み合わせで捕まえるためです。

### MITRE ATT&CK

| 技術 | 内容 |
| --- | --- |
| T1486 Data Encrypted for Impact | XChaCha20 + RSA-OAEPによるファイル暗号化 |
| T1490 Inhibit System Recovery | vssadmin、wmic、wbadmin、bcdedit |
| T1685.005 Clear Windows Event Logs（旧T1070.001） | wevtutilで全ログを削除 |
| T1489 Service Stop | 許可リスト外のプロセスを終了 |
| T1057 Process Discovery | `CreateToolhelp32Snapshot` |
| T1083 File and Directory Discovery | MFTの列挙、フォルダ探索 |
| T1134 Access Token Manipulation | SeDebug/SeBackup/SeRestore権限の有効化 |
| T1059.003 Windows Command Shell | `cmd.exe /C` |
| T1112 Modify Registry | 壁紙のポリシーキー |
| T1491.001 Internal Defacement | 壁紙の固定 |

## 次に見るもの

- 動的解析：メモリに残るセッションキー、MFTの経路を実際に通るか
- YARAルールとサンプルの照合
- ファイルフィルター関数：暗号化から外す拡張子とフォルダ
- 補助スレッド2つとフォルダごとの処理スレッドのエントリポイント、壁紙関数の呼び出しタイミング
- 許可リストの短い名前7つのバイト確認（今は先頭文字と長さからidle, smss, lsm, dwm, vmms, vmwp, vmspと読んでいる）

## 参考

- [Recorded Future Triage：振る舞い](https://tria.ge/261006-nzbfjaay5m/behavioral1) · [静的情報](https://tria.ge/261006-nzbfjaay5m/static1)
- [PCRisk: Calipso ransomware](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)
- [Microsoft Learn: FSCTL_ENUM_USN_DATA](https://learn.microsoft.com/ja-jp/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data)
- MITRE ATT&CK [T1486](https://attack.mitre.org/techniques/T1486/)、[T1490](https://attack.mitre.org/techniques/T1490/)、[T1685.005](https://attack.mitre.org/techniques/T1685/005/)

以前の記録：[(1) 公開レポート]({{ '/ja/research/calipso-01/' | relative_url }}) · [(2) PE構造]({{ '/ja/research/calipso-02/' | relative_url }}) · [(3) VMの画面]({{ '/ja/research/calipso-03/' | relative_url }})
