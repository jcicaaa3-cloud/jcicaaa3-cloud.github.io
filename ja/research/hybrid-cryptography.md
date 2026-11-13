---
layout: post
lang: ja
title: "RSA + AESハイブリッド暗号化ツールCPLOGv4 — 構成・検証・ソースコード"
date: 2026-11-13 18:00:00 +0900
last_modified_at: 2026-11-13 18:00:00 +0900
kind: crypto
permalink: /ja/research/hybrid-cryptography/
description: "RSA-OAEP、PBKDF2、AES-256-CBC、HMAC-SHA256を組み合わせたファイル暗号化ツールCPLOGv4の形式、鍵導出、脅威モデル、テスト結果とMITライセンスのソースコード"
---
11月6日に載せた設計メモを、実際に作ったv4に合わせて書き直しました。ファイル形式、鍵導出の流れ、防げることと防げないこと、自分で見つけた弱点、テスト結果をまとめ、ソースコード全体をMITライセンスで公開します。実行ファイル・圧縮ファイル・鍵ファイルは配布せず、コード本文だけを載せます。

設計メモではAES-256-GCMを使うと書きましたが、実装は **AES-256-CBC + HMAC-SHA256** の組み合わせ(Encrypt-then-MAC)です。理由は[5章](#why-cbc-hmac)に書きました。

| 項目 | 状態 |
| --- | --- |
| Python参照実装による往復・改ざんテスト11件 | 合格(2026-11-13、Linux) |
| 鍵長 2048 / 3072 / 4096 | 3種類とも往復合格(Python参照実装) |
| C#ツールのWindowsでの再実行 | この記事には含めていません |
| 外部のセキュリティ監査 | なし |

**目次**

1. [なぜハイブリッドか — 数字で見る](#why-hybrid)
2. [バージョンの変遷 v1 → v4](#versions)
3. [CPLOGv4のファイル形式](#format)
4. [鍵導出:秘密鍵とパスワードの両方が必要な構造](#key-derivation)
5. [GCMではなくCBC + HMACにした理由](#why-cbc-hmac)
6. [復号の順序](#decrypt-order)
7. [防げることと防げないこと](#threat-model)
8. [自分で見つけた弱点](#weaknesses)
9. [テスト結果](#tests)
10. [次のバージョンで変えること](#next)
11. [ソースコード](#source)
12. [ライセンス(MIT)](#license)
13. [免責事項](#disclaimer)

## 1. なぜハイブリッドか — 数字で見る {#why-hybrid}

RSA-3072でOAEP(SHA-256)を使うと、1回で暗号化できる平文は `384 - 2×32 - 2 = 318` バイトです。大きなファイルをRSAだけで扱うと318バイトずつに分ける必要があり、ブロックごとに秘密鍵の演算が入ります。

Linux VMで実際に測りました(環境は[9章](#tests))。

| 演算 | 測定値 |
| --- | --- |
| RSA-3072 OAEP復号1回 | 0.869 ms |
| AES-256-CBC暗号化 + HMAC-SHA256、256 MiB | 0.77 秒(約332 MiB/s) |
| HMAC-SHA256 + AES-256-CBC復号、256 MiB | 0.61 秒(約416 MiB/s) |
| 256 MiBをRSAだけで処理した場合(計算) | 844,137ブロック、出力309 MiB、復号に約12分 |

最後の行は、測定した1ブロックあたりの時間にブロック数を掛けた計算です。そのためRSAはファイルごとに新しく作る64バイトの秘密値を1つ包むだけにし、ファイル本体はAESで処理します。RSAの演算は暗号化と復号でそれぞれ1回です。

## 2. バージョンの変遷 v1 → v4 {#versions}

| バージョン | 識別子 | 復号に必要なもの | 備考 |
| --- | --- | --- | --- |
| v1 | `.cpenc` | パスワード | PBKDF2-HMAC-SHA256 600,000回、AES-256-CBC + HMAC |
| v2 / v2.1 | `CPLOGv2!` | RSA秘密鍵 | 64バイトの秘密値を半分に分けてAES鍵・HMAC鍵に使用。v2.1で複数パス入力の不具合を修正 |
| v3 | `CPLOGv3!` | RSA秘密鍵 + 元の画像ファイル | 画像ファイルのSHA-256を鍵導出に混ぜる |
| v4 | `CPLOGv4!` | RSA秘密鍵 + パスワード | この記事の対象 |

v1は毎回パスワードを別に伝える必要があり、v2は秘密鍵ファイルが1つ漏れれば終わりでした。v3の画像方式は、ファイルが1バイトでも変わると復号できません。メッセンジャーで送ったり保存し直したりするとバイトが変わることが多く、画像のコピーがそのまま鍵になるため、秘密鍵と同じ場所に置くと2つ目の要素の意味が薄れます。v4ではここを、人が覚えるパスワードに置き換えました。

## 3. CPLOGv4のファイル形式 {#format}

整数はすべてリトルエンディアンです。オフセットはRSA-3072の場合です。

| オフセット | サイズ | フィールド | 内容 |
| --- | --- | --- | --- |
| 0 | 8 | magic | ASCII `CPLOGv4!` |
| 8 | 4 | wrapLen | RSAブロックの長さ。秘密鍵のモジュラス長と一致する必要あり(3072ビットなら384) |
| 12 | 16 | IV | AES-CBCのIV、ファイルごとに新規生成 |
| 28 | 16 | salt | PBKDF2のsalt、ファイルごとに新規生成 |
| 44 | wrapLen | wrapped | RSA-OAEP-SHA256(64バイトの乱数秘密値) |
| 428 | 16の倍数 | body | AES-256-CBC/PKCS7(ZIPアーカイブ) |
| 末尾 − 32 | 32 | tag | HMAC-SHA256(mac_key、ファイル先頭からbody末尾まで) |

ヘッダーもHMACの範囲に入っているので、IV、salt、長さフィールドを書き換えても検証で弾かれます。元のファイルやフォルダはストリーミングでZIPにまとめ、そのZIPストリームをそのままAESに流すため、平文の一時ZIPをディスクに作りません。

## 4. 鍵導出:秘密鍵とパスワードの両方が必要な構造 {#key-derivation}

```text
secret (64 B, CSPRNG) ──RSA-OAEP-SHA256(受信者の公開鍵)──▶ wrapped(ヘッダーに保存)
salt (16 B, CSPRNG)   ──────────────────────────────────▶ ヘッダーに保存
password (UTF-8、保存しない)

pw_key  = PBKDF2-HMAC-SHA256(password, salt, 260,000回, 32 B)
mixed   = HMAC-SHA256(key = pw_key, "CPLOGv4/combine/"     ‖ secret)
enc_key = HMAC-SHA256(key = mixed,  "CPLOGv4/AES-256-CBC/" ‖ salt)
mac_key = HMAC-SHA256(key = mixed,  "CPLOGv4/HMAC-SHA256/" ‖ salt)
```

- `secret` は秘密鍵がないと取り出せず、`pw_key` はパスワードがないと作れません。`mixed` は両方がそろって初めて計算できます。
- 暗号化鍵とMAC鍵は別々のラベルで導出します。1つの鍵を2つの用途に使いません。
- パスワードはファイル、スクリプト、コマンドライン引数のどこにも残しません。
- C#側では、鍵や秘密値を入れた `byte[]` を使い終わったら `Array.Clear` で消去します。

## 5. GCMではなくCBC + HMACにした理由 {#why-cbc-hmac}

このツールは、Windows 10/11に標準で入っている **Windows PowerShell 5.1 + .NET Framework 4.7.2** で、追加インストールなしに動くことを目標にしました。`System.Security.Cryptography.AesGcm` クラスは.NET Core 3.0以降にしかなく、.NET Frameworkにはありません。CNGをP/Invokeで直接呼べばGCMも使えますが、コードが大きくなり、間違えやすい箇所が増えます。

そこで、.NET FrameworkにあるAES-CBCとHMAC-SHA256をEncrypt-then-MACで組み合わせました。ヘッダーと暗号文全体をまずMACで確認し、合格した場合だけ復号します。改ざんされた暗号文はパディング検査の段階まで届かないため、padding oracle攻撃は成り立ちません。鍵はAES用256ビットとHMAC用256ビットを別々に使います。

## 6. 復号の順序 {#decrypt-order}

1. magicが `CPLOGv4!` か確認
2. `wrapLen` が256〜1024の範囲で、秘密鍵のモジュラス長と一致するか確認
3. 全体の長さが最小サイズ以上で、bodyが16バイトの倍数か確認
4. RSA-OAEPで `secret` を復元し、64バイトか確認
5. パスワードで `enc_key` と `mac_key` を導出
6. ファイル先頭からtagの手前まで1 MiBずつ読みながらHMACを計算
7. 保存されたtagと定数時間で比較。一致しなければここで中止し、何も書き出さない
8. 新しいファイル(`FileMode.CreateNew`)にAES-CBCで復号
9. 結果がZIPとして開けるか確認
10. 8〜9で失敗したら、作りかけの出力ファイルを削除

入力ファイルは `FileShare.Read` で開いたままなので、6の検証と8の復号の間に他のプロセスが同じファイルを書き換えることはできません。

## 7. 防げることと防げないこと {#threat-model}

| 攻撃者が持っているもの | 結果 |
| --- | --- |
| `.cprsa` ファイルだけ | 秘密鍵もパスワードもないので復号できない |
| ファイル + パスワード | `secret` を取り出せないので復号できない |
| ファイル + 秘密鍵(PEM流出) | パスワードをオフラインで総当たりできる。1回の試行ごとにPBKDF2 260,000回が必要 |
| ファイルを1バイトでも改ざん | HMAC検証に失敗し、出力なし |
| 受信者の公開鍵を自分の鍵にすり替える | **防げない。** 公開鍵は信頼できる経路で受け取る必要がある |
| 送信者のなりすまし | 署名がないため、公開鍵とパスワードを知っていれば誰でも正しいファイルを作れる |
| 復号後のZIP | 普通のZIPなので保護されない |

## 8. 自分で見つけた弱点 {#weaknesses}

コードを読み直して見つけたものです。公開用のコピーでは7番のコメントだけを直し、残りは既存のv4ファイルとの互換性のためそのままにしました。v5で変える予定です。

1. **PBKDF2の反復回数が260,000回。** OWASP Password Storage Cheat SheetはPBKDF2-HMAC-SHA256に600,000回を推奨しています。v1は600,000回だったので、v4でむしろ下がったことになります。測ってみると600,000回でも約88 msで、使う側が感じる差は小さいです。反復回数はヘッダーではなくコード上の定数なので、変えると既存のv4ファイルが開けなくなります。
2. **秘密鍵が平文のPEMで保存されます。** `private_key.pem` は暗号化されていないPKCS#1です。v4でパスワードを加えたことで補ってはいますが、鍵ファイル自体も保護した方が良いです。
3. **PowerShell側のパスワードは消去できません。** `SecureString` で受け取った後、普通の `string` に変換してC#に渡しています。.NETの文字列は不変なのでメモリから消す方法がなく、GCが回収するまで残ります。
4. **BATが `-ExecutionPolicy Bypass` を使っています。** そのプロセスだけに適用されますが、組織のポリシーでスクリプト実行を禁止しているPCでは管理者の承認が必要です。
5. **暗号化時のHMACを、ファイルを閉じた後に開き直して計算しています。** 閉じてから開き直すまでの短い間に他のプロセスがファイルを変えると、変更後の内容にtagが付きます。ストリームに書きながらHMACを同時に計算すればなくなる問題です。
6. **パスワードの最小長(12文字)チェックがPowerShellにしかありません。** C#の関数を直接呼ぶと短いパスワードも通ります。
7. **C#ファイルの先頭コメントがv2(`CPLOGv2!`)の形式を説明していました。** v4のコードは `CPLOGv4!` 形式で正しく読み書きしており、間違っていたのはコメントだけです。公開用のコピーで直しました。

## 9. テスト結果 {#tests}

Windows用のC#コードはこの環境でコンパイルできないため、C#コードで定義された形式と鍵導出をそのままなぞってPythonで別に実装し、そちらをテストしました。

**環境:** Linux x86_64 VM(Intel Xeon 2.10 GHz、vCPU 2個)、Python 3.13.18、cryptography 50.0.1。入力はすべてテスト内で作った乱数データです。

| テスト | 内容 | 結果 |
| --- | --- | --- |
| サイズ別往復 | 0 B、6 B、8 MiB、韓国語ファイル名 | 合格 |
| フォルダ + 複数ファイル | サブフォルダ構造を維持 | 合格 |
| 鍵長 | 2048 / 3072 / 4096、`wrapLen` の値を確認 | 合格 |
| 名前の重複 | 同じファイルを2回指定すると拒否 | 合格 |
| 乱数の再利用 | 同じ入力を2回暗号化するとIV・salt・RSAブロックがすべて異なる | 合格 |
| 間違ったパスワード | 空、大文字化、末尾に空白追加、1文字削除 | すべて拒否 |
| 間違った秘密鍵 | 同じ長さの別の鍵、別の長さの鍵 | すべて拒否 |
| 領域ごとの1ビット改ざん | magic、wrapLen、IV、salt、RSAブロック、bodyの先頭・末尾、tag | すべて拒否 |
| ヘッダー・tagの全数改ざん | RSA-2048ファイルのヘッダー300バイトとtag 32バイト、各バイトの最上位ビットを反転 | 332か所すべて拒否 |
| 切り詰め・追加 | 末尾から1、16、32、33バイト削る、先頭12バイトだけ残す、16バイト追加 | すべて拒否 |

`Ran 11 tests in 23.593s — OK`

**測定値(中央値):**

| 演算 | 時間 |
| --- | --- |
| RSA-3072 OAEP暗号化(64 Bを包む) | 0.039 ms |
| RSA-3072 OAEP復号 | 0.869 ms |
| PBKDF2-HMAC-SHA256 260,000回 | 39 ms |
| PBKDF2-HMAC-SHA256 600,000回 | 88 ms |

Windows上の.NET実装では数値が異なる可能性があります。

**鍵導出のテストベクタ。** 他の実装と突き合わせるため、固定入力で出したものです。

```text
secret   = 00 01 02 … 3f            (64 B)
salt     = 00 01 02 … 0f            (16 B)
password = "CPLOGv4 test vector"
pw_key   = 7b71be66f7c273f63b27dea9363349e0ef187824af70fd3ea1ed86a08c4cebb7
enc_key  = 8531690018ac7803c99cedbd4300bfa9d7d452f167104537f209eb621b8dcc86
mac_key  = 8ad6c0f01ed31f553bbb39beb3c23ccaddd9f3531a1703f5009a984d5215051b
```

## 10. 次のバージョンで変えること {#next}

まだ作っていない計画です。

- ヘッダーにKDFの種類と反復回数を記録し、既定値を600,000回以上に上げる
- 秘密鍵を暗号化されたPKCS#8で保存するか、WindowsのCNG鍵ストアに置く
- ストリームに書きながらHMACを計算し、8章5番の問題をなくす
- 送信者の確認が必要な場合のためのRSA-PSS署名オプション
- C#ツールで作ったファイルをPython参照実装で開く相互テスト

## 11. ソースコード {#source}

下の5つ(C#、PowerShell、BAT 3つ)を同じフォルダに置き、BATを実行します。PowerShellが実行のたびに `Add-Type` でC#ファイルをコンパイルするため、ビルド済みのバイナリはありません。公開用のコピーではv2・v3のコードを外してv4だけを残しており、v4の関数本体は元のコードと同じです。

| ファイル | 役割 | 行数 |
| --- | --- | --- |
| `CP_Hybrid_RSA_Core.cs` | 鍵生成、暗号化、復号、PEM/DER処理 | 504 |
| `CP_Hybrid_RSA.ps1` | 入力処理、パスワード入力、C#の呼び出し | 120 |
| `01_Generate_RSA_KeyPair.bat` | RSA-3072鍵ペアの生成 | 12 |
| `02_Encrypt_RSA_AND_Password.bat` | 公開鍵 + パスワードで暗号化 | 16 |
| `03_Decrypt_RSA_AND_Password.bat` | 秘密鍵 + パスワードで復号 | 16 |
| `cplogv4_ref.py` | Python参照実装 | 167 |
| `test_cplogv4.py` | 9章のテスト | 123 |
| `bench_cplogv4.py` | 1章・9章の測定 | 68 |

### CP_Hybrid_RSA_Core.cs

```csharp
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jcicaaa3
//
// CPLOGv4 core - RSA-OAEP-SHA256 + passphrase + AES-256-CBC + HMAC-SHA256
// Target: Windows PowerShell 5.1 / .NET Framework 4.7.2+ (Windows 10/11)
//
// Container (little-endian):
//   "CPLOGv4!" (8) | uint32 wrapLen (4) | AES IV (16) | PBKDF2 salt (16) |
//   RSA-OAEP-SHA256(64-byte random secret) (wrapLen) |
//   AES-256-CBC/PKCS7(ZIP archive) | HMAC-SHA256(all preceding bytes) (32)
// Keys: public = X.509 SubjectPublicKeyInfo PEM, private = RSA PKCS#1 PEM.
//
// Published copy: the v2 (RSA only) and v3 (RSA + image file) code paths were
// removed; the v4 functions below are unchanged from the toolkit.
using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.IO.Compression;
using System.Text.RegularExpressions;

public static class CPHybridRSA
{
    private const string MagicPassword = "CPLOGv4!";
    private const int Pbkdf2Iterations = 260000;
    private const int TagSize = 32;
    private static readonly byte[] RsaAlgorithmOid = new byte[] {0x2a,0x86,0x48,0x86,0xf7,0x0d,0x01,0x01,0x01};

    private static RSA NewRSA() { return new RSACng(); }
    private static byte[] RandomBytes(int size)
    {
        byte[] bytes = new byte[size];
        using (RandomNumberGenerator rng = RandomNumberGenerator.Create()) rng.GetBytes(bytes);
        return bytes;
    }
    private static void Wipe(byte[] bytes) { if (bytes != null) Array.Clear(bytes, 0, bytes.Length); }
    private static string UniquePath(string dir, string prefix, string extension)
    {
        string candidate;
        do {
            candidate = Path.Combine(dir, prefix + "_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + "_" + Guid.NewGuid().ToString("N").Substring(0,8) + extension);
        } while (File.Exists(candidate) || Directory.Exists(candidate));
        return candidate;
    }

    public static string GenerateKeys(string folder, int keyBits)
    {
        if (keyBits != 3072 && keyBits != 4096 && keyBits != 2048)
            throw new InvalidOperationException("Use RSA key size 2048, 3072, or 4096 bits (3072 recommended).");
        Directory.CreateDirectory(folder);
        string keyDir = UniquePath(folder, "RSA_KeyPair", "");
        Directory.CreateDirectory(keyDir);
        try {
            using (RSA rsa = NewRSA()) {
                rsa.KeySize = keyBits;
                RSAParameters priv = rsa.ExportParameters(true);
                RSAParameters pub = rsa.ExportParameters(false);
                try {
                    string privatePem = Pem("RSA PRIVATE KEY", ExportPkcs1Private(priv));
                    string publicPem = Pem("PUBLIC KEY", ExportSpkiPublic(pub));
                    File.WriteAllText(Path.Combine(keyDir,"private_key.pem"), privatePem, new UTF8Encoding(false));
                    File.WriteAllText(Path.Combine(keyDir,"public_key.pem"), publicPem, new UTF8Encoding(false));
                } finally {
                    Wipe(priv.D); Wipe(priv.P); Wipe(priv.Q);
                    Wipe(priv.DP); Wipe(priv.DQ); Wipe(priv.InverseQ);
                }
            }
            return keyDir;
        } catch { try { Directory.Delete(keyDir, true); } catch { } throw; }
    }

    private static IEnumerable<Tuple<string,string>> EnumerateZipInputs(string fullPath)
    {
        FileAttributes rootAttrs = File.GetAttributes(fullPath);
        if ((rootAttrs & FileAttributes.ReparsePoint) != 0)
            throw new InvalidOperationException("Refusing a symlink/junction/reparse-point as the source.");
        if ((rootAttrs & FileAttributes.Directory) == 0) {
            yield return Tuple.Create(fullPath, Path.GetFileName(fullPath));
            yield break;
        }
        string name = new DirectoryInfo(fullPath).Name;
        Stack<string> stack = new Stack<string>();
        stack.Push(fullPath);
        while (stack.Count > 0) {
            string current = stack.Pop();
            foreach (string file in Directory.EnumerateFiles(current)) {
                if ((File.GetAttributes(file) & FileAttributes.ReparsePoint) != 0) continue;
                string rel = file.Substring(fullPath.Length).TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                yield return Tuple.Create(file, name + "/" + rel.Replace('\\','/'));
            }
            foreach (string dir in Directory.EnumerateDirectories(current)) {
                if ((File.GetAttributes(dir) & FileAttributes.ReparsePoint) != 0) continue;
                stack.Push(dir);
            }
        }
    }
    private sealed class PositionCountingWriteStream : Stream
    {
        private readonly Stream inner;
        private long position;
        public PositionCountingWriteStream(Stream innerStream) { inner = innerStream; }
        public override bool CanRead { get { return false; } }
        public override bool CanSeek { get { return false; } }
        public override bool CanWrite { get { return inner.CanWrite; } }
        public override long Length { get { throw new NotSupportedException(); } }
        public override long Position {
            get { return position; }
            set { throw new NotSupportedException(); }
        }
        public override void Flush() { inner.Flush(); }
        public override int Read(byte[] buffer,int offset,int count) { throw new NotSupportedException(); }
        public override long Seek(long offset,SeekOrigin origin) { throw new NotSupportedException(); }
        public override void SetLength(long value) { throw new NotSupportedException(); }
        public override void Write(byte[] buffer,int offset,int count) {
            inner.Write(buffer,offset,count);
            position = checked(position + count);
        }
        public override void WriteByte(byte value) { inner.WriteByte(value); position++; }
        protected override void Dispose(bool disposing) { base.Dispose(disposing); } // leave inner open
    }

    // v4: BOTH RSA-unwrapped random secret and the entered passphrase are required.
    // Password is never written to disk or included in the envelope.
    private static void PasswordDerivedKeys(byte[] rsaSecret, byte[] salt, string passphrase, byte[] aesKey, byte[] macKey)
    {
        if (String.IsNullOrEmpty(passphrase)) throw new ArgumentException("Passphrase is required.");
        byte[] passwordKey = null, mixedKey = null;
        try {
            using (Rfc2898DeriveBytes pbkdf2 = new Rfc2898DeriveBytes(passphrase, salt, Pbkdf2Iterations, HashAlgorithmName.SHA256)) {
                passwordKey = pbkdf2.GetBytes(32);
            }
            // Mix the RSA-only secret with the password-derived secret; neither alone is enough.
            using (HMACSHA256 hmac = new HMACSHA256(passwordKey)) {
                mixedKey = hmac.ComputeHash(Concat(Encoding.ASCII.GetBytes("CPLOGv4/combine/"),rsaSecret));
            }
            using (HMACSHA256 hmac = new HMACSHA256(mixedKey)) {
                byte[] enc = hmac.ComputeHash(Concat(Encoding.ASCII.GetBytes("CPLOGv4/AES-256-CBC/"),salt));
                byte[] mac = hmac.ComputeHash(Concat(Encoding.ASCII.GetBytes("CPLOGv4/HMAC-SHA256/"),salt));
                try {
                    Buffer.BlockCopy(enc,0,aesKey,0,32);
                    Buffer.BlockCopy(mac,0,macKey,0,32);
                } finally { Wipe(enc); Wipe(mac); }
            }
        } finally { Wipe(passwordKey); Wipe(mixedKey); }
    }

    public static string EncryptManyWithPassword(string[] sourcePaths, string publicKeyPath, string passphrase)
    {
        if (sourcePaths == null || sourcePaths.Length == 0)
            throw new ArgumentException("Select at least one file or folder.");
        List<string> sources = new List<string>();
        HashSet<string> uniqueSources = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (string path in sourcePaths) {
            if (String.IsNullOrWhiteSpace(path)) continue;
            string source = Path.GetFullPath(path.Trim().Trim('"'));
            if (!File.Exists(source) && !Directory.Exists(source))
                throw new FileNotFoundException("Input file or folder does not exist.", source);
            if (uniqueSources.Add(source)) sources.Add(source);
        }
        if (sources.Count == 0) throw new ArgumentException("No valid input files or folders.");
        using (RSA rsa = ReadRSAKey(publicKeyPath, false)) {
            byte[] secret = RandomBytes(64), iv = RandomBytes(16), salt = RandomBytes(16);
            byte[] encryptionKey = new byte[32], authenticationKey = new byte[32];
            string firstSource = sources[0];
            string outputDir = Directory.Exists(firstSource) ? Directory.GetParent(firstSource).FullName : Path.GetDirectoryName(firstSource);
            string output = UniquePath(outputDir, "Protected_CP_Logs_RSA_Password", ".cprsa");
            bool success = false;
            try {
                PasswordDerivedKeys(secret,salt,passphrase,encryptionKey,authenticationKey);
                byte[] wrapped = rsa.Encrypt(secret, RSAEncryptionPadding.OaepSHA256);
                using (FileStream fs = new FileStream(output,FileMode.CreateNew,FileAccess.Write,FileShare.None)) {
                    byte[] magic = Encoding.ASCII.GetBytes(MagicPassword);
                    fs.Write(magic,0,magic.Length);
                    byte[] length = BitConverter.GetBytes((uint)wrapped.Length);
                    if (!BitConverter.IsLittleEndian) Array.Reverse(length);
                    fs.Write(length,0,4);
                    fs.Write(iv,0,iv.Length);
                    fs.Write(salt,0,salt.Length);
                    fs.Write(wrapped,0,wrapped.Length);
                    using (Aes aes = Aes.Create()) {
                        aes.KeySize = 256;
                        aes.Mode = CipherMode.CBC;
                        aes.Padding = PaddingMode.PKCS7;
                        aes.Key = encryptionKey;
                        aes.IV = iv;
                        using (ICryptoTransform encryptor = aes.CreateEncryptor())
                        using (CryptoStream crypt = new CryptoStream(fs,encryptor,CryptoStreamMode.Write,true)) {
                            using (PositionCountingWriteStream forward = new PositionCountingWriteStream(crypt))
                            using (ZipArchive zip = new ZipArchive(forward,ZipArchiveMode.Create,true,Encoding.UTF8)) {
                                HashSet<string> zipNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                                foreach (string source in sources) {
                                    foreach (Tuple<string,string> input in EnumerateZipInputs(source)) {
                                        if (!zipNames.Add(input.Item2))
                                            throw new InvalidDataException("Duplicate filename inside ZIP: " + input.Item2 + ". Rename one source or put files in a single parent folder.");
                                        ZipArchiveEntry entry = zip.CreateEntry(input.Item2,CompressionLevel.Optimal);
                                        using (Stream zipEntry = entry.Open())
                                        using (FileStream inputStream = new FileStream(input.Item1,FileMode.Open,FileAccess.Read,FileShare.ReadWrite))
                                            inputStream.CopyTo(zipEntry);
                                    }
                                }
                            }
                            crypt.FlushFinalBlock();
                        }
                    }
                    fs.Flush(true);
                }
                byte[] tag;
                using (HMACSHA256 hmac = new HMACSHA256(authenticationKey))
                using (FileStream fs = File.OpenRead(output)) tag = hmac.ComputeHash(fs);
                using (FileStream fs = new FileStream(output,FileMode.Append,FileAccess.Write,FileShare.None))
                    fs.Write(tag,0,tag.Length);
                success = true;
                return output;
            } finally {
                Wipe(secret); Wipe(encryptionKey); Wipe(authenticationKey);
                if (!success && File.Exists(output)) File.Delete(output);
            }
        }
    }
    private static void ReadExact(Stream fs, byte[] bytes, int count)
    {
        int off = 0;
        while (off < count) {
            int n = fs.Read(bytes,off,count-off);
            if (n <= 0) throw new InvalidDataException("Encrypted file is truncated.");
            off += n;
        }
    }
    private static bool ConstantTimeEqual(byte[] a, byte[] b)
    {
        if (a.Length != b.Length) return false;
        int diff = 0;
        for (int i=0;i<a.Length;i++) diff |= a[i] ^ b[i];
        return diff == 0;
    }

    public static string DecryptWithPassword(string encryptedPath, string privateKeyPath, string passphrase)
    {
        string input = Path.GetFullPath(encryptedPath);
        if (!File.Exists(input)) throw new FileNotFoundException("Encrypted file does not exist.",input);
        using (RSA rsa = ReadRSAKey(privateKeyPath,true))
        using (FileStream fs = new FileStream(input,FileMode.Open,FileAccess.Read,FileShare.Read)) {
            byte[] prelude = new byte[12];
            ReadExact(fs,prelude,prelude.Length);
            if (Encoding.ASCII.GetString(prelude,0,8) != MagicPassword)
                throw new InvalidDataException("Not a CPLOGv4 RSA+password file. Check file version and use matching decrypt script.");
            byte[] lenBytes = new byte[4];
            Buffer.BlockCopy(prelude,8,lenBytes,0,4);
            if (!BitConverter.IsLittleEndian) Array.Reverse(lenBytes);
            uint wrapLength = BitConverter.ToUInt32(lenBytes,0);
            if (wrapLength < 256 || wrapLength > 1024 || wrapLength != (uint)(rsa.KeySize/8))
                throw new InvalidDataException("Invalid wrapped RSA key size / wrong private key size.");
            long headerSize = 8+4+16+16+(long)wrapLength;
            if (fs.Length < headerSize+16+TagSize || (fs.Length-headerSize-TagSize)%16 != 0)
                throw new InvalidDataException("Invalid encrypted length or truncated ciphertext.");
            byte[] iv = new byte[16], salt = new byte[16], wrapped = new byte[(int)wrapLength];
            ReadExact(fs,iv,16);
            ReadExact(fs,salt,16);
            ReadExact(fs,wrapped,(int)wrapLength);
            byte[] secret;
            try { secret = rsa.Decrypt(wrapped,RSAEncryptionPadding.OaepSHA256); }
            catch (CryptographicException) { throw new CryptographicException("RSA decryption failed. Wrong private key or damaged encrypted file."); }
            if (secret.Length != 64) { Wipe(secret); throw new InvalidDataException("Unwrapped secret has the wrong size."); }
            byte[] encryptionKey = new byte[32], authenticationKey = new byte[32];
            try {
                PasswordDerivedKeys(secret,salt,passphrase,encryptionKey,authenticationKey);
                long authenticatedLength = fs.Length - TagSize;
                byte[] actual;
                using (HMACSHA256 hmac = new HMACSHA256(authenticationKey)) {
                    fs.Position = 0;
                    byte[] buffer = new byte[1024*1024];
                    long remaining = authenticatedLength;
                    while (remaining > 0) {
                        int wanted = (int)Math.Min(buffer.Length,remaining);
                        int n = fs.Read(buffer,0,wanted);
                        if (n <= 0) throw new InvalidDataException("Unexpected end of input.");
                        hmac.TransformBlock(buffer,0,n,buffer,0);
                        remaining -= n;
                    }
                    hmac.TransformFinalBlock(new byte[0],0,0);
                    actual = hmac.Hash;
                }
                byte[] expected = new byte[TagSize];
                ReadExact(fs,expected,TagSize);
                if (!ConstantTimeEqual(actual,expected))
                    throw new CryptographicException("Authentication failed: wrong password, wrong RSA key, or damaged encrypted file.");
                string output = UniquePath(Path.GetDirectoryName(input),"Decrypted_CP_Logs_RSA_Password",".zip");
                bool success = false;
                try {
                    using (FileStream dest = new FileStream(output,FileMode.CreateNew,FileAccess.Write,FileShare.None))
                    using (Aes aes = Aes.Create()) {
                        aes.KeySize = 256;
                        aes.Mode = CipherMode.CBC;
                        aes.Padding = PaddingMode.PKCS7;
                        aes.Key = encryptionKey;
                        aes.IV = iv;
                        using (ICryptoTransform decryptor = aes.CreateDecryptor())
                        using (CryptoStream crypt = new CryptoStream(dest,decryptor,CryptoStreamMode.Write,true)) {
                            fs.Position = headerSize;
                            long remaining = authenticatedLength-headerSize;
                            byte[] buffer = new byte[1024*1024];
                            while (remaining > 0) {
                                int wanted = (int)Math.Min(buffer.Length,remaining);
                                int n = fs.Read(buffer,0,wanted);
                                if (n <= 0) throw new InvalidDataException("Ciphertext truncated.");
                                crypt.Write(buffer,0,n);
                                remaining -= n;
                            }
                            crypt.FlushFinalBlock();
                        }
                        dest.Flush(true);
                    }
                    // Basic structural validation of the resulting ZIP archive.
                    using (FileStream check = File.OpenRead(output))
                    using (ZipArchive verifyZip = new ZipArchive(check, ZipArchiveMode.Read, false, Encoding.UTF8)) {
                        int entryCount = verifyZip.Entries.Count;
                    }
                    success = true;
                    return output;
                } finally { if (!success && File.Exists(output)) File.Delete(output); }
            } finally { Wipe(secret); Wipe(encryptionKey); Wipe(authenticationKey); }
        }
    }

    private static string Pem(string label, byte[] der)
    {
        string b64 = Convert.ToBase64String(der);
        StringBuilder builder = new StringBuilder();
        builder.Append("-----BEGIN ").Append(label).Append("-----\n");
        for (int n=0;n<b64.Length;n+=64)
            builder.Append(b64.Substring(n,Math.Min(64,b64.Length-n))).Append('\n');
        builder.Append("-----END ").Append(label).Append("-----\n");
        return builder.ToString();
    }
    private static byte[] Tlv(byte tag, byte[] body)
    {
        byte[] len;
        if (body.Length < 128) len = new byte[] {(byte)body.Length};
        else {
            List<byte> n = new List<byte>();
            int value = body.Length;
            while (value > 0) { n.Insert(0,(byte)(value&255)); value >>= 8; }
            len = new byte[n.Count+1]; len[0] = (byte)(0x80+n.Count);
            n.CopyTo(len,1);
        }
        return Concat(new byte[] {tag},len,body);
    }
    private static byte[] Concat(params byte[][] parts)
    {
        int size = 0; foreach (byte[] part in parts) size = checked(size+part.Length);
        byte[] result = new byte[size]; int offset=0;
        foreach (byte[] part in parts) { Buffer.BlockCopy(part,0,result,offset,part.Length); offset += part.Length; }
        return result;
    }
    private static byte[] Seq(params byte[][] parts) { return Tlv(0x30,Concat(parts)); }
    private static byte[] Int(byte[] raw)
    {
        int start = 0;
        while (start < raw.Length-1 && raw[start] == 0) start++;
        int size = raw.Length-start;
        bool signPad = (raw[start]&0x80)!=0;
        byte[] b = new byte[size+(signPad?1:0)];
        Buffer.BlockCopy(raw,start,b,signPad?1:0,size);
        return Tlv(0x02,b);
    }
    private static byte[] ExportPkcs1Private(RSAParameters p)
    {
        return Seq(Int(new byte[]{0}), Int(p.Modulus), Int(p.Exponent), Int(p.D),
                   Int(p.P), Int(p.Q), Int(p.DP), Int(p.DQ), Int(p.InverseQ));
    }
    private static byte[] ExportPkcs1Public(RSAParameters p) { return Seq(Int(p.Modulus), Int(p.Exponent)); }
    private static byte[] ExportSpkiPublic(RSAParameters p)
    {
        byte[] oid = Tlv(0x06,RsaAlgorithmOid);
        byte[] algorithm = Seq(oid,new byte[]{0x05,0x00});
        return Seq(algorithm,Tlv(0x03,Concat(new byte[]{0},ExportPkcs1Public(p))));
    }
    private sealed class DerReader
    {
        private readonly byte[] data;
        private int pos;
        private readonly int end;
        public DerReader(byte[] b) { data = b; pos=0; end=b.Length; }
        public bool End { get { return pos==end; } }
        public byte[] Read(byte tag)
        {
            if (pos>=end || data[pos++]!=tag) throw new InvalidDataException("Invalid RSA DER tag.");
            if (pos>=end) throw new InvalidDataException("Truncated DER length.");
            int size = data[pos++];
            if ((size&0x80)!=0) {
                int bytes = size&0x7f;
                if (bytes<1 || bytes>4 || bytes>end-pos) throw new InvalidDataException("Invalid DER length.");
                size=0;
                for (int i=0;i<bytes;i++) size = checked(size*256+data[pos++]);
            }
            if (size<0 || size>end-pos) throw new InvalidDataException("DER item out of range.");
            byte[] result = new byte[size];
            Buffer.BlockCopy(data,pos,result,0,size); pos+=size;
            return result;
        }
        public DerReader ReadSequence() { return new DerReader(Read(0x30)); }
        public byte[] ReadInteger()
        {
            byte[] i = Read(0x02);
            if (i.Length<1 || (i[0]&0x80)!=0) throw new InvalidDataException("Invalid unsigned RSA integer.");
            int off=0; while (off<i.Length-1 && i[off]==0) off++;
            byte[] result = new byte[i.Length-off]; Buffer.BlockCopy(i,off,result,0,result.Length);
            return result;
        }
        public void RequireEnd() { if (!End) throw new InvalidDataException("Unexpected DER bytes."); }
    }
    private static byte[] LeftPad(byte[] value, int wanted)
    {
        if (value.Length>wanted) throw new InvalidDataException("Invalid RSA parameter size.");
        byte[] result = new byte[wanted];
        Buffer.BlockCopy(value,0,result,wanted-value.Length,value.Length);
        return result;
    }
    private static void CheckAlgorithm(DerReader reader)
    {
        DerReader alg = reader.ReadSequence();
        byte[] oid = alg.Read(0x06);
        if (!oid.SequenceEqual(RsaAlgorithmOid)) throw new InvalidDataException("Only RSA keys are supported.");
        if (!alg.End) { byte[] n = alg.Read(0x05); if (n.Length != 0) throw new InvalidDataException("Invalid RSA algorithm NULL."); }
        alg.RequireEnd();
    }
    private static RSAParameters ParsePkcs1Public(byte[] der)
    {
        DerReader root = new DerReader(der);
        DerReader fields = root.ReadSequence(); root.RequireEnd();
        byte[] mod = fields.ReadInteger(), exp = fields.ReadInteger();
        fields.RequireEnd();
        if (mod.Length<256 || mod.Length>1024 || exp.Length>8) throw new InvalidDataException("Unsupported RSA public key size.");
        return new RSAParameters {Modulus=mod,Exponent=exp};
    }
    private static RSAParameters ParsePkcs1Private(byte[] der)
    {
        DerReader root = new DerReader(der);
        DerReader fields = root.ReadSequence(); root.RequireEnd();
        byte[] version = fields.ReadInteger();
        if (version.Length!=1 || version[0]!=0) throw new InvalidDataException("Only two-prime RSA private keys are supported.");
        byte[] mod = fields.ReadInteger(), exp = fields.ReadInteger();
        if (mod.Length<256 || mod.Length>1024 || exp.Length>8 || mod.Length%2!=0)
            throw new InvalidDataException("Unsupported RSA private key size.");
        int half = mod.Length/2;
        RSAParameters result = new RSAParameters {
            Modulus = mod, Exponent = exp,
            D = LeftPad(fields.ReadInteger(),mod.Length),
            P = LeftPad(fields.ReadInteger(),half),
            Q = LeftPad(fields.ReadInteger(),half),
            DP = LeftPad(fields.ReadInteger(),half),
            DQ = LeftPad(fields.ReadInteger(),half),
            InverseQ = LeftPad(fields.ReadInteger(),half)
        };
        fields.RequireEnd();
        return result;
    }
    private static RSA ReadRSAKey(string filename, bool needPrivate)
    {
        if (string.IsNullOrWhiteSpace(filename) || !File.Exists(filename))
            throw new FileNotFoundException("PEM key file not found.",filename);
        FileInfo info = new FileInfo(filename);
        if (info.Length>1048576) throw new InvalidDataException("PEM key file is unexpectedly large.");
        string pem = File.ReadAllText(filename);
        Match m = Regex.Match(pem,@"-----BEGIN (RSA PRIVATE KEY|PRIVATE KEY|PUBLIC KEY|RSA PUBLIC KEY)-----([\s\S]*?)-----END \1-----");
        if (!m.Success) throw new InvalidDataException("Unsupported PEM key (use unencrypted RSA PKCS#1/PKCS#8 or SPKI).");
        string label = m.Groups[1].Value;
        if (needPrivate && label!="RSA PRIVATE KEY" && label!="PRIVATE KEY")
            throw new InvalidDataException("A private RSA key is required to decrypt.");
        if (!needPrivate && label!="PUBLIC KEY" && label!="RSA PUBLIC KEY")
            throw new InvalidDataException("A public RSA key is required to encrypt.");
        byte[] der;
        try { der = Convert.FromBase64String(Regex.Replace(m.Groups[2].Value,@"\s+","")); }
        catch (FormatException) { throw new InvalidDataException("Invalid base64 PEM file."); }
        RSAParameters p;
        try {
            if (label=="RSA PRIVATE KEY") p=ParsePkcs1Private(der);
            else if (label=="RSA PUBLIC KEY") p=ParsePkcs1Public(der);
            else if (label=="PUBLIC KEY") {
                DerReader root = new DerReader(der); DerReader seq = root.ReadSequence(); root.RequireEnd();
                CheckAlgorithm(seq);
                byte[] bits = seq.Read(0x03); seq.RequireEnd();
                if (bits.Length<2 || bits[0]!=0) throw new InvalidDataException("Invalid RSA SPKI bit string.");
                byte[] inner = new byte[bits.Length-1]; Buffer.BlockCopy(bits,1,inner,0,inner.Length);
                p = ParsePkcs1Public(inner);
            } else { // unencrypted PKCS#8 PrivateKeyInfo
                DerReader root = new DerReader(der); DerReader seq = root.ReadSequence(); root.RequireEnd();
                byte[] version = seq.ReadInteger();
                if (version.Length!=1 || version[0]!=0) throw new InvalidDataException("Unsupported PKCS#8 version.");
                CheckAlgorithm(seq);
                byte[] inner = seq.Read(0x04); seq.RequireEnd();
                p = ParsePkcs1Private(inner);
            }
        } finally { if (needPrivate) Wipe(der); }
        RSA rsa = NewRSA();
        try { rsa.ImportParameters(p); return rsa; }
        catch { rsa.Dispose(); throw; }
        finally {
            Wipe(p.D); Wipe(p.P); Wipe(p.Q); Wipe(p.DP); Wipe(p.DQ); Wipe(p.InverseQ);
        }
    }
}
```

### CP_Hybrid_RSA.ps1

```powershell
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 jcicaaa3
#
# CPLOGv4 launcher - Windows PowerShell 5.1 on Windows 10/11.
# Compiles CP_Hybrid_RSA_Core.cs with Add-Type at run time and calls it.
# PositionalBinding=false prevents dropped paths from accidentally binding to -KeySize.
[CmdletBinding(PositionalBinding=$false)]
param(
    [Parameter(Mandatory=$true)][ValidateSet('Generate','EncryptPassword','DecryptPassword')][string]$Mode,
    [string]$Target = '',
    [string]$KeyPath = '',
    [ValidateSet(2048,3072,4096)][int]$KeySize = 3072,
    [Parameter(ValueFromRemainingArguments=$true)][string[]]$DroppedPaths
)
$ErrorActionPreference = 'Stop'

function Split-QuotedPaths([string]$Raw) {
    $Raw = $Raw.Trim()
    if (-not $Raw) { throw 'At least one source path is required.' }
    # A single path may be unquoted even though it contains spaces.
    if (Test-Path -LiteralPath $Raw) {
        Write-Output $Raw
        return
    }
    # Windows Explorer copies multiple selected paths as "C:\one" "C:\two".
    $pieces = [regex]::Matches($Raw, '"([^"]+)"|''([^'']+)''|(\S+)')
    if ($pieces.Count -eq 0) { throw 'Could not read source paths.' }
    foreach ($m in $pieces) {
        if ($m.Groups[1].Success) { $path = $m.Groups[1].Value }
        elseif ($m.Groups[2].Success) { $path = $m.Groups[2].Value }
        else { $path = $m.Groups[3].Value }
        if (-not (Test-Path -LiteralPath $path)) {
            throw ('File or folder not found: ' + $path + '. For paths with spaces, use double quotes around EACH path.')
        }
        Write-Output $path
    }
}

function Trim-OnePath([string]$Text) {
    return $Text.Trim().Trim([char[]]@([char]34, [char]39)).Trim()
}


function Read-Password([string]$Prompt) {
    $secure = Read-Host -Prompt $Prompt -AsSecureString
    $ptr = [IntPtr]::Zero
    try {
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
        if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
        if ($null -ne $secure) { $secure.Dispose() }
    }
}

try {
    $source = Join-Path $PSScriptRoot 'CP_Hybrid_RSA_Core.cs'
    if (-not (Test-Path -LiteralPath $source)) { throw 'Required CP_Hybrid_RSA_Core.cs not found. Keep toolkit files together.' }
    Add-Type -Path $source -ReferencedAssemblies 'System.dll','System.Core.dll','System.Security.dll','System.IO.Compression.dll' -ErrorAction Stop
    switch ($Mode) {
        'Generate' {
            $folder = [CPHybridRSA]::GenerateKeys($PSScriptRoot, $KeySize)
            Write-Host '[SUCCESS] RSA key pair generated:' -ForegroundColor Green
            Write-Host ('Folder:      ' + $folder)
            Write-Host ('Public key:  ' + (Join-Path $folder 'public_key.pem'))
            Write-Host ('PRIVATE key: ' + (Join-Path $folder 'private_key.pem')) -ForegroundColor Yellow
            Write-Host 'Give only public_key.pem to the sender. NEVER share private_key.pem.' -ForegroundColor Yellow
        }
        'EncryptPassword' {
            [string[]]$inputList = @()
            if ($DroppedPaths -and $DroppedPaths.Count -gt 0) {
                foreach ($part in $DroppedPaths) { $inputList += @(Split-QuotedPaths $part) }
            } else {
                if (-not $Target.Trim()) {
                    Write-Host 'Enter one path or several double-quoted paths on ONE line.'
                    Write-Host 'Example: "C:\Logs (1)\a.lst" "C:\Logs (1)\b.lst"'
                    $Target = Read-Host 'Source file(s)/folder(s)'
                }
                $inputList = @(Split-QuotedPaths $Target)
            }
            $inputList = @($inputList | Select-Object -Unique)
            if (-not $inputList -or $inputList.Count -eq 0) { throw 'No input file/folder selected.' }
            if (-not $KeyPath.Trim()) { $KeyPath = Read-Host 'PUBLIC KEY .pem path' }
            $KeyPath = Trim-OnePath $KeyPath
            if (-not (Test-Path -LiteralPath $KeyPath -PathType Leaf)) { throw ('Public key not found: ' + $KeyPath) }
            Write-Host ('Selected files/folders: ' + $inputList.Count)
            foreach ($path in $inputList) { Write-Host ('  ' + $path) }
            $pw = Read-Password 'New password (case-sensitive; input hidden)'
            $pwConfirm = Read-Password 'Repeat password'
            if (-not [string]::Equals($pw, $pwConfirm, [StringComparison]::Ordinal)) { throw 'Passwords do not match (case-sensitive).' }
            if ($pw.Length -lt 12) { throw 'Password too short. Use 12+ characters (20+ recommended).' }
            $out = [CPHybridRSA]::EncryptManyWithPassword([string[]]$inputList, $KeyPath, $pw)
            Write-Host '[SUCCESS] RSA + PASSWORD protected file:' -ForegroundColor Green
            Write-Host $out
            Write-Host 'All selected items are in ONE CPLOGv4 encrypted .cprsa archive. Both private_key.pem and password will be required.'
            Write-Host 'The original file(s)/folder(s) were NOT changed or deleted.'
        }
        'DecryptPassword' {
            if ($DroppedPaths -and $DroppedPaths.Count -gt 0) {
                if ($DroppedPaths.Count -ne 1) { throw 'Drag exactly ONE .cprsa file to decrypt.' }
                $Target = $DroppedPaths[0]
            }
            if (-not $Target.Trim()) { $Target = Read-Host 'Encrypted .cprsa file path' }
            $Target = Trim-OnePath $Target
            if (-not $KeyPath.Trim()) { $KeyPath = Read-Host 'PRIVATE KEY .pem path' }
            $KeyPath = Trim-OnePath $KeyPath
            $pw = Read-Password 'Password (case-sensitive; input hidden)'
            $out = [CPHybridRSA]::DecryptWithPassword($Target, $KeyPath, $pw)
            Write-Host '[SUCCESS] RSA + password verification passed. Decrypted ZIP:' -ForegroundColor Green
            Write-Host $out
            Write-Host 'WARNING: The decrypted ZIP contains sensitive plaintext data.' -ForegroundColor Yellow
        }
    }
    exit 0
} catch {
    $e = $_.Exception
    while ($e.InnerException) { $e = $e.InnerException }
    Write-Host ('[ERROR] ' + $e.Message) -ForegroundColor Red
    exit 1
}
```

### 01_Generate_RSA_KeyPair.bat

```bat
@echo off
:: SPDX-License-Identifier: MIT
:: Copyright (c) 2026 jcicaaa3
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
title Generate RSA-3072 Public/Private Key Pair
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CP_Hybrid_RSA.ps1" -Mode Generate -KeySize 3072
set "RESULT=%ERRORLEVEL%"
echo.
if not "%RESULT%"=="0" echo Key generation failed. Check the error message.
pause
exit /b %RESULT%
```

### 02_Encrypt_RSA_AND_Password.bat

```bat
@echo off
:: SPDX-License-Identifier: MIT
:: Copyright (c) 2026 jcicaaa3
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
title Encrypt file(s) with RSA PUBLIC KEY + PASSWORD
if "%~1"=="" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CP_Hybrid_RSA.ps1" -Mode EncryptPassword
) else (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CP_Hybrid_RSA.ps1" -Mode EncryptPassword %*
)
set "RESULT=%ERRORLEVEL%"
echo.
if not "%RESULT%"=="0" echo Failed. Check error shown above.
pause
exit /b %RESULT%
```

### 03_Decrypt_RSA_AND_Password.bat

```bat
@echo off
:: SPDX-License-Identifier: MIT
:: Copyright (c) 2026 jcicaaa3
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
title Decrypt with RSA PRIVATE KEY + PASSWORD
if "%~1"=="" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CP_Hybrid_RSA.ps1" -Mode DecryptPassword
) else (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CP_Hybrid_RSA.ps1" -Mode DecryptPassword %*
)
set "RESULT=%ERRORLEVEL%"
echo.
if not "%RESULT%"=="0" echo Failed. Check error shown above.
pause
exit /b %RESULT%
```

### cplogv4_ref.py

`pip install cryptography` の後に実行します。参照実装はZIPをメモリ上に作るため、大きなファイルにはC#ツールの方が向いています。

```python
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 jcicaaa3
"""CPLOGv4 reference implementation (Python 3, `cryptography` package).

Independent re-implementation of the CPLOGv4 container used by the Windows
PowerShell/C# toolkit, written to check the format from a second code base.

Container (all integers little-endian):
    magic      8   b"CPLOGv4!"
    wrap_len   4   uint32, length of the RSA-OAEP block (= RSA modulus bytes)
    iv        16   AES-CBC IV
    salt      16   PBKDF2 salt (also used as HKDF-style info for the subkeys)
    wrapped    N   RSA-OAEP(SHA-256, MGF1-SHA-256) of a 64-byte random secret
    body       *   AES-256-CBC/PKCS7 of a ZIP archive
    tag       32   HMAC-SHA256(mac_key, everything above)
"""
from __future__ import annotations

import hashlib
import hmac
import io
import os
import struct
import zipfile
from pathlib import Path

from cryptography.hazmat.primitives import hashes, padding, serialization
from cryptography.hazmat.primitives.asymmetric import padding as asym, rsa
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

MAGIC = b"CPLOGv4!"
PBKDF2_ITERATIONS = 260_000          # fixed by the v4 format (not stored in header)
TAG_SIZE = 32
OAEP = asym.OAEP(mgf=asym.MGF1(algorithm=hashes.SHA256()),
                 algorithm=hashes.SHA256(), label=None)


class AuthenticationError(Exception):
    """Wrong password, wrong key, or modified file."""


def _hmac(key: bytes, msg: bytes) -> bytes:
    return hmac.new(key, msg, hashlib.sha256).digest()


def derive_keys(rsa_secret: bytes, salt: bytes, passphrase: str) -> tuple[bytes, bytes]:
    """Same key schedule as PasswordDerivedKeys() in CP_Hybrid_RSA_Core.cs."""
    if not passphrase:
        raise ValueError("Passphrase is required.")
    # .NET Rfc2898DeriveBytes(string, ...) encodes the password as UTF-8.
    pw_key = hashlib.pbkdf2_hmac("sha256", passphrase.encode("utf-8"), salt,
                                 PBKDF2_ITERATIONS, dklen=32)
    mixed = _hmac(pw_key, b"CPLOGv4/combine/" + rsa_secret)
    enc_key = _hmac(mixed, b"CPLOGv4/AES-256-CBC/" + salt)
    mac_key = _hmac(mixed, b"CPLOGv4/HMAC-SHA256/" + salt)
    return enc_key, mac_key


def generate_keypair(bits: int = 3072) -> tuple[bytes, bytes]:
    """Return (private PKCS#1 PEM, public SubjectPublicKeyInfo PEM)."""
    if bits not in (2048, 3072, 4096):
        raise ValueError("Use 2048, 3072 or 4096 bits.")
    key = rsa.generate_private_key(public_exponent=65537, key_size=bits)
    priv = key.private_bytes(serialization.Encoding.PEM,
                             serialization.PrivateFormat.TraditionalOpenSSL,
                             serialization.NoEncryption())
    pub = key.public_key().public_bytes(serialization.Encoding.PEM,
                                        serialization.PublicFormat.SubjectPublicKeyInfo)
    return priv, pub


def _zip_inputs(paths: list[Path]) -> bytes:
    """ZIP layout mirrors EnumerateZipInputs(): file -> name, folder -> folder/rel."""
    buf = io.BytesIO()
    names: set[str] = set()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for root in paths:
            if root.is_symlink():
                raise ValueError("Refusing a symlink as the source.")
            items = ([(root, root.name)] if root.is_file() else
                     [(p, f"{root.name}/{p.relative_to(root).as_posix()}")
                      for p in sorted(root.rglob("*")) if p.is_file() and not p.is_symlink()])
            for src, arc in items:
                if arc.lower() in names:
                    raise ValueError(f"Duplicate filename inside ZIP: {arc}")
                names.add(arc.lower())
                zf.write(src, arc)
    return buf.getvalue()


def encrypt(paths: list[Path], public_pem: bytes, passphrase: str) -> bytes:
    pub = serialization.load_pem_public_key(public_pem)
    secret, iv, salt = os.urandom(64), os.urandom(16), os.urandom(16)
    enc_key, mac_key = derive_keys(secret, salt, passphrase)
    wrapped = pub.encrypt(secret, OAEP)
    header = MAGIC + struct.pack("<I", len(wrapped)) + iv + salt + wrapped

    padder = padding.PKCS7(128).padder()
    plain = padder.update(_zip_inputs(paths)) + padder.finalize()
    enc = Cipher(algorithms.AES(enc_key), modes.CBC(iv)).encryptor()
    body = enc.update(plain) + enc.finalize()
    tag = _hmac(mac_key, header + body)
    return header + body + tag


def decrypt(blob: bytes, private_pem: bytes, passphrase: str) -> bytes:
    """Verify-then-decrypt. Returns the plaintext ZIP bytes."""
    key = serialization.load_pem_private_key(private_pem, password=None)
    if len(blob) < 12 or blob[:8] != MAGIC:
        raise ValueError("Not a CPLOGv4 file.")
    (wrap_len,) = struct.unpack("<I", blob[8:12])
    if not 256 <= wrap_len <= 1024 or wrap_len != key.key_size // 8:
        raise ValueError("Invalid wrapped key size / wrong private key size.")
    header_size = 8 + 4 + 16 + 16 + wrap_len
    if len(blob) < header_size + 16 + TAG_SIZE or (len(blob) - header_size - TAG_SIZE) % 16:
        raise ValueError("Invalid length or truncated ciphertext.")
    iv, salt = blob[12:28], blob[28:44]
    wrapped = blob[44:header_size]
    try:
        secret = key.decrypt(wrapped, OAEP)
    except ValueError as exc:
        raise AuthenticationError("RSA decryption failed.") from exc
    if len(secret) != 64:
        raise ValueError("Unwrapped secret has the wrong size.")
    enc_key, mac_key = derive_keys(secret, salt, passphrase)
    if not hmac.compare_digest(_hmac(mac_key, blob[:-TAG_SIZE]), blob[-TAG_SIZE:]):
        raise AuthenticationError("Wrong password, wrong RSA key, or damaged file.")
    dec = Cipher(algorithms.AES(enc_key), modes.CBC(iv)).decryptor()
    padded = dec.update(blob[header_size:-TAG_SIZE]) + dec.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    plain = unpadder.update(padded) + unpadder.finalize()
    zipfile.ZipFile(io.BytesIO(plain)).testzip()      # structural check, like the C# tool
    return plain


if __name__ == "__main__":
    import argparse
    import getpass

    ap = argparse.ArgumentParser(description="CPLOGv4 reference tool")
    sub = ap.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("keygen"); g.add_argument("outdir", type=Path)
    g.add_argument("--bits", type=int, default=3072)
    e = sub.add_parser("encrypt"); e.add_argument("pubkey", type=Path)
    e.add_argument("out", type=Path); e.add_argument("inputs", type=Path, nargs="+")
    d = sub.add_parser("decrypt"); d.add_argument("privkey", type=Path)
    d.add_argument("infile", type=Path); d.add_argument("out_zip", type=Path)
    a = ap.parse_args()

    if a.cmd == "keygen":
        a.outdir.mkdir(parents=True, exist_ok=False)
        priv, pub = generate_keypair(a.bits)
        (a.outdir / "private_key.pem").write_bytes(priv)
        (a.outdir / "public_key.pem").write_bytes(pub)
    elif a.cmd == "encrypt":
        pw = getpass.getpass("Password: ")
        if pw != getpass.getpass("Repeat: "):
            raise SystemExit("Passwords do not match.")
        if len(pw) < 12:
            raise SystemExit("Use 12+ characters.")
        blob = encrypt(a.inputs, a.pubkey.read_bytes(), pw)
        with open(a.out, "xb") as f:          # never overwrite, like FileMode.CreateNew
            f.write(blob)
    else:
        out = decrypt(a.infile.read_bytes(), a.privkey.read_bytes(), getpass.getpass("Password: "))
        with open(a.out_zip, "xb") as f:
            f.write(out)
```

### test_cplogv4.py

```python
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 jcicaaa3
"""Round-trip, wrong-factor and tamper tests for the CPLOGv4 reference code.
All inputs are synthetic random bytes generated inside a temp directory."""
import io
import os
import tempfile
import unittest
import zipfile
from pathlib import Path

import cplogv4_ref as v4

PW = "correct horse battery staple 42"


class CPLOGv4Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.keys = {b: v4.generate_keypair(b) for b in (2048, 3072, 4096)}
        cls.other3072 = v4.generate_keypair(3072)
        cls.tmp = tempfile.TemporaryDirectory()
        d = Path(cls.tmp.name)
        (d / "empty.bin").write_bytes(b"")
        (d / "small.txt").write_bytes(b"hello\n")
        (d / "big.bin").write_bytes(os.urandom(8 * 1024 * 1024))
        (d / "tree" / "a" / "b").mkdir(parents=True)
        (d / "tree" / "x.log").write_bytes(os.urandom(1000))
        (d / "tree" / "a" / "b" / "y.csv").write_text("k,v\n1,2\n", encoding="utf-8")
        (d / "한글 파일.txt").write_text("유니코드 이름", encoding="utf-8")
        cls.d = d

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def _roundtrip(self, inputs, bits=3072):
        priv, pub = self.keys[bits]
        blob = v4.encrypt(inputs, pub, PW)
        out = zipfile.ZipFile(io.BytesIO(v4.decrypt(blob, priv, PW)))
        return blob, out

    def test_roundtrip_each_size(self):
        for name in ("empty.bin", "small.txt", "big.bin", "한글 파일.txt"):
            with self.subTest(name=name):
                _, z = self._roundtrip([self.d / name])
                self.assertEqual(z.read(name), (self.d / name).read_bytes())

    def test_roundtrip_folder_and_multi(self):
        _, z = self._roundtrip([self.d / "tree", self.d / "small.txt"])
        self.assertEqual(sorted(z.namelist()),
                         ["small.txt", "tree/a/b/y.csv", "tree/x.log"])
        self.assertEqual(z.read("tree/x.log"), (self.d / "tree" / "x.log").read_bytes())

    def test_all_key_sizes(self):
        for bits in (2048, 3072, 4096):
            with self.subTest(bits=bits):
                blob, z = self._roundtrip([self.d / "small.txt"], bits)
                self.assertEqual(int.from_bytes(blob[8:12], "little"), bits // 8)

    def test_duplicate_names_rejected(self):
        with self.assertRaises(ValueError):
            v4.encrypt([self.d / "small.txt", self.d / "small.txt"], self.keys[3072][1], PW)

    def test_fresh_randomness(self):
        pub = self.keys[3072][1]
        a = v4.encrypt([self.d / "small.txt"], pub, PW)
        b = v4.encrypt([self.d / "small.txt"], pub, PW)
        self.assertNotEqual(a[12:28], b[12:28])       # IV
        self.assertNotEqual(a[28:44], b[28:44])       # salt
        self.assertNotEqual(a[44:44 + 384], b[44:44 + 384])  # wrapped secret

    def test_wrong_password(self):
        priv, pub = self.keys[3072]
        blob = v4.encrypt([self.d / "small.txt"], pub, PW)
        for bad in ("", PW.upper(), PW + " ", PW[:-1]):
            with self.subTest(bad=bad), self.assertRaises((v4.AuthenticationError, ValueError)):
                v4.decrypt(blob, priv, bad)

    def test_wrong_private_key_same_size(self):
        blob = v4.encrypt([self.d / "small.txt"], self.keys[3072][1], PW)
        with self.assertRaises(v4.AuthenticationError):
            v4.decrypt(blob, self.other3072[0], PW)

    def test_wrong_private_key_other_size(self):
        blob = v4.encrypt([self.d / "small.txt"], self.keys[3072][1], PW)
        with self.assertRaises(ValueError):
            v4.decrypt(blob, self.keys[4096][0], PW)

    def test_single_byte_tamper_everywhere(self):
        priv, pub = self.keys[3072]
        blob = v4.encrypt([self.d / "tree"], pub, PW)
        hs = 44 + 384
        regions = {"magic": 0, "wrap_len": 9, "iv": 20, "salt": 30,
                   "wrapped": 200, "body_first": hs, "body_last": len(blob) - 33,
                   "tag": len(blob) - 1}
        for region, pos in regions.items():
            with self.subTest(region=region):
                t = bytearray(blob); t[pos] ^= 0x01
                with self.assertRaises((v4.AuthenticationError, ValueError)):
                    v4.decrypt(bytes(t), priv, PW)

    def test_exhaustive_bitflip_header_and_tag(self):
        priv, pub = self.keys[2048]
        blob = v4.encrypt([self.d / "small.txt"], pub, PW)
        positions = list(range(0, 44 + 256)) + list(range(len(blob) - 32, len(blob)))
        for pos in positions:
            t = bytearray(blob); t[pos] ^= 0x80
            with self.assertRaises((v4.AuthenticationError, ValueError), msg=f"pos {pos}"):
                v4.decrypt(bytes(t), priv, PW)

    def test_truncation_and_extension(self):
        priv, pub = self.keys[3072]
        blob = v4.encrypt([self.d / "small.txt"], pub, PW)
        for cut in (1, 16, 32, 33, len(blob) - 12):
            with self.subTest(cut=cut), self.assertRaises((v4.AuthenticationError, ValueError)):
                v4.decrypt(blob[:-cut], priv, PW)
        with self.assertRaises((v4.AuthenticationError, ValueError)):
            v4.decrypt(blob + b"\x00" * 16, priv, PW)


if __name__ == "__main__":
    unittest.main(verbosity=2)
```

### bench_cplogv4.py

```python
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 jcicaaa3
"""Micro-benchmarks: why the bulk data goes through AES, not RSA."""
import hashlib
import hmac
import os
import platform
import statistics
import time

import cryptography
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding as asym, rsa
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

OAEP = asym.OAEP(mgf=asym.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)


def timed(fn, n):
    xs = []
    for _ in range(n):
        t = time.perf_counter(); fn(); xs.append(time.perf_counter() - t)
    return statistics.median(xs)


print(f"Python {platform.python_version()} / cryptography {cryptography.__version__}")
print(f"CPU: {platform.machine()}, {os.cpu_count()} logical cores")

key = rsa.generate_private_key(public_exponent=65537, key_size=3072)
pub = key.public_key()
secret = os.urandom(64)
wrapped = pub.encrypt(secret, OAEP)
max_oaep = 3072 // 8 - 2 * 32 - 2
t_wrap = timed(lambda: pub.encrypt(secret, OAEP), 200)
t_unwrap = timed(lambda: key.decrypt(wrapped, OAEP), 50)
print(f"RSA-3072 OAEP max plaintext per block: {max_oaep} bytes")
print(f"RSA-3072 OAEP encrypt (wrap 64 B): {t_wrap*1e3:.3f} ms")
print(f"RSA-3072 OAEP decrypt (unwrap):    {t_unwrap*1e3:.3f} ms")

for it in (260_000, 600_000):
    t = timed(lambda: hashlib.pbkdf2_hmac("sha256", b"x" * 20, os.urandom(16), it, 32), 5)
    print(f"PBKDF2-HMAC-SHA256 {it:,} iterations: {t*1e3:.0f} ms")

size = 256 * 1024 * 1024
data = os.urandom(size)
k, mk, iv = os.urandom(32), os.urandom(32), os.urandom(16)


def aes_cbc_hmac():
    e = Cipher(algorithms.AES(k), modes.CBC(iv)).encryptor()
    ct = e.update(data) + e.finalize()
    hmac.new(mk, ct, hashlib.sha256).digest()


def aes_cbc_dec_hmac():
    hmac.new(mk, data, hashlib.sha256).digest()
    d = Cipher(algorithms.AES(k), modes.CBC(iv)).decryptor()
    d.update(data) + d.finalize()


t_enc = timed(aes_cbc_hmac, 3)
t_dec = timed(aes_cbc_dec_hmac, 3)
mib = size / 2**20
print(f"AES-256-CBC encrypt + HMAC-SHA256, {mib:.0f} MiB: {t_enc:.2f} s ({mib/t_enc:.0f} MiB/s)")
print(f"HMAC-SHA256 + AES-256-CBC decrypt, {mib:.0f} MiB: {t_dec:.2f} s ({mib/t_dec:.0f} MiB/s)")
blocks = -(-size // max_oaep)
print(f"RSA-only estimate for {mib:.0f} MiB: {blocks:,} OAEP blocks, "
      f"output {blocks*384/2**20:.0f} MiB, decrypt ~{blocks*t_unwrap/60:.0f} min")
```

## 12. ライセンス(MIT) {#license}

この記事のソースコードには、以下のMITライセンスが適用されます。各コード先頭の `SPDX-License-Identifier: MIT` はこのライセンスを指します。

```text
MIT License

Copyright (c) 2026 jcicaaa3

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 13. 免責事項 {#disclaimer}

- このコードは個人の学習と研究のために作ったもので、外部のセキュリティ監査を受けていません。9章のテストはPython参照実装に対するもので、C#ツールの安全性を保証するものではありません。
- 個人情報、医療、金融など、法的な保護義務があるデータに対して、このツールだけで十分であることは保証しません。そうしたデータには検証済みの標準ツールを使い、所属組織のセキュリティポリシーに従ってください。
- 秘密鍵またはパスワードを失うと復号できず、復旧する手段もありません。それによるデータ損失は利用者の責任です。
- 所属組織のセキュリティ統制(スクリプト実行ポリシーを含む)を回避する目的で使わないでください。
- 自分に権限のないシステムやデータに使わないでください。
- 暗号技術の利用・輸出に関する各国の法令を守ることは利用者の責任です。
- コードの使用によって生じた直接・間接の損害について、作者は責任を負いません。この項目は上記MITライセンスの無保証条項を補うもので、両者が矛盾する場合はMITライセンスが優先します。
- この記事は作者個人の記録であり、いかなる機関・企業の立場を示すものでもありません。

## 参考資料

- [RFC 8017 · PKCS #1 v2.2(RSAES-OAEP)](https://www.rfc-editor.org/rfc/rfc8017)
- [RFC 8018 · PKCS #5 v2.1(PBKDF2)](https://www.rfc-editor.org/rfc/rfc8018)
- [RFC 2104 · HMAC](https://www.rfc-editor.org/rfc/rfc2104)
- [NIST SP 800-38A · ブロック暗号の利用モード(CBC)](https://csrc.nist.gov/pubs/sp/800/38/a/final)
- [OWASP · Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Microsoft Learn · AesGcm クラス](https://learn.microsoft.com/dotnet/api/system.security.cryptography.aesgcm)
