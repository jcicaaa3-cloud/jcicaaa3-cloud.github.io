---
layout: post
lang: en
title: "CPLOGv4, an RSA + AES hybrid encryption tool: design, tests and source code"
date: 2026-11-13 18:00:00 +0900
last_modified_at: 2026-11-13 18:00:00 +0900
kind: crypto
permalink: /en/research/hybrid-cryptography/
description: "Container format, key derivation, threat model, test results and MIT-licensed source for CPLOGv4, a file encryption tool built on RSA-OAEP, PBKDF2, AES-256-CBC and HMAC-SHA256"
---
This post replaces the design notes from 6 November with a write-up of the tool as actually built (v4). It covers the file format, the key derivation, what the design does and does not defend against, weaknesses I found on review, and test results, and it publishes the full source under the MIT licence. Only source text is published here: no executables, archives or key files.

The design notes said AES-256-GCM. The implementation uses **AES-256-CBC with HMAC-SHA256** (Encrypt-then-MAC) instead; [section 5](#why-cbc-hmac) explains why.

| Item | Status |
| --- | --- |
| 11 round-trip and tamper tests against a Python reference implementation | Passed (2026-11-13, Linux) |
| Key sizes 2048 / 3072 / 4096 | All three round-trip (Python reference) |
| Re-running the C# tool on Windows | Not part of this post |
| External security audit | None |

**Contents**

1. [Why hybrid: the numbers](#why-hybrid)
2. [From v1 to v4](#versions)
3. [The CPLOGv4 file format](#format)
4. [Key derivation: both the private key and the password are required](#key-derivation)
5. [Why CBC + HMAC rather than GCM](#why-cbc-hmac)
6. [Decryption order](#decrypt-order)
7. [What it stops and what it doesn't](#threat-model)
8. [Weaknesses found on review](#weaknesses)
9. [Test results](#tests)
10. [Planned for the next version](#next)
11. [Source code](#source)
12. [Licence (MIT)](#license)
13. [Disclaimer](#disclaimer)

## 1. Why hybrid: the numbers {#why-hybrid}

With RSA-3072 and OAEP (SHA-256), a single operation can encrypt at most `384 - 2×32 - 2 = 318` bytes of plaintext. Encrypting a large file with RSA alone means cutting it into 318-byte pieces, each needing a private-key operation to decrypt.

Measured on a Linux VM (environment in [section 9](#tests)):

| Operation | Result |
| --- | --- |
| One RSA-3072 OAEP decryption | 0.869 ms |
| AES-256-CBC encryption + HMAC-SHA256, 256 MiB | 0.77 s (about 332 MiB/s) |
| HMAC-SHA256 + AES-256-CBC decryption, 256 MiB | 0.61 s (about 416 MiB/s) |
| 256 MiB with RSA alone (calculated) | 844,137 blocks, 309 MiB of output, about 12 minutes to decrypt |

The last row multiplies the measured per-block time by the block count. So RSA only wraps one fresh 64-byte secret per file, and AES handles the file body: one RSA operation to encrypt, one to decrypt.

## 2. From v1 to v4 {#versions}

| Version | Identifier | Needed to decrypt | Notes |
| --- | --- | --- | --- |
| v1 | `.cpenc` | Password | PBKDF2-HMAC-SHA256 at 600,000 iterations, AES-256-CBC + HMAC |
| v2 / v2.1 | `CPLOGv2!` | RSA private key | The 64-byte secret is split in half into the AES key and HMAC key. v2.1 fixed multi-path input |
| v3 | `CPLOGv3!` | RSA private key + original image file | The image file's SHA-256 is mixed into key derivation |
| v4 | `CPLOGv4!` | RSA private key + password | The subject of this post |

v1 meant sending a password separately every time; with v2, a single leaked private-key file was enough. The image in v3 had to match byte for byte: messaging apps and re-saving often change the bytes, and since a copy of the image *is* the key, keeping it next to the private key weakens the second factor. v4 puts a password the user remembers in that slot.

## 3. The CPLOGv4 file format {#format}

All integers are little-endian. Offsets assume RSA-3072.

| Offset | Size | Field | Contents |
| --- | --- | --- | --- |
| 0 | 8 | magic | ASCII `CPLOGv4!` |
| 8 | 4 | wrapLen | Length of the RSA block; must equal the private key's modulus length (384 for 3072 bits) |
| 12 | 16 | IV | AES-CBC IV, fresh per file |
| 28 | 16 | salt | PBKDF2 salt, fresh per file |
| 44 | wrapLen | wrapped | RSA-OAEP-SHA256(64-byte random secret) |
| 428 | multiple of 16 | body | AES-256-CBC/PKCS7(ZIP archive) |
| end − 32 | 32 | tag | HMAC-SHA256(mac_key, from the start of the file to the end of body) |

The header is inside the HMAC, so changing the IV, salt or length field fails verification. Input files and folders are streamed into a ZIP whose output goes straight into AES, so no plaintext temporary ZIP is written to disk.

## 4. Key derivation: both the private key and the password are required {#key-derivation}

```text
secret (64 B, CSPRNG) ──RSA-OAEP-SHA256(recipient public key)──▶ wrapped (stored in header)
salt (16 B, CSPRNG)   ─────────────────────────────────────────▶ stored in header
password (UTF-8, never stored)

pw_key  = PBKDF2-HMAC-SHA256(password, salt, 260,000 iterations, 32 B)
mixed   = HMAC-SHA256(key = pw_key, "CPLOGv4/combine/"     ‖ secret)
enc_key = HMAC-SHA256(key = mixed,  "CPLOGv4/AES-256-CBC/" ‖ salt)
mac_key = HMAC-SHA256(key = mixed,  "CPLOGv4/HMAC-SHA256/" ‖ salt)
```

- `secret` can only be recovered with the private key, and `pw_key` can only be computed with the password. `mixed` needs both.
- The encryption key and MAC key come from separate labels, so no key serves two purposes.
- The password is never written to the file, the scripts or the command line.
- On the C# side, `byte[]` buffers holding keys and secrets are cleared with `Array.Clear` after use.

## 5. Why CBC + HMAC rather than GCM {#why-cbc-hmac}

The tool had to run with nothing installed on Windows 10/11, which means **Windows PowerShell 5.1 + .NET Framework 4.7.2**. The `System.Security.Cryptography.AesGcm` class only exists from .NET Core 3.0 onwards, not in .NET Framework. GCM is reachable by calling CNG through P/Invoke, but that adds a lot of code and more places to get things wrong.

So the tool combines AES-CBC and HMAC-SHA256, both available in .NET Framework, as Encrypt-then-MAC. The MAC covers the header and the whole ciphertext and is checked first; decryption runs only if it passes. A tampered ciphertext never reaches the padding check, so a padding oracle attack has nothing to work with. AES and HMAC each use their own 256-bit key.

## 6. Decryption order {#decrypt-order}

1. Check that the magic is `CPLOGv4!`
2. Check that `wrapLen` is between 256 and 1024 and equals the private key's modulus length
3. Check the minimum total length and that the body is a multiple of 16 bytes
4. Recover `secret` with RSA-OAEP and check it is 64 bytes
5. Derive `enc_key` and `mac_key` with the password
6. Compute the HMAC over everything before the tag, reading 1 MiB at a time
7. Compare with the stored tag in constant time; on mismatch, stop without writing anything
8. Decrypt AES-CBC into a new file (`FileMode.CreateNew`)
9. Check that the result opens as a ZIP
10. If step 8 or 9 fails, delete the partial output file

The input file stays open with `FileShare.Read`, so no other process can rewrite it between verification in step 6 and decryption in step 8.

## 7. What it stops and what it doesn't {#threat-model}

| Attacker has | Outcome |
| --- | --- |
| Only the `.cprsa` file | Neither private key nor password, so no decryption |
| File + password | Cannot recover `secret`, so no decryption |
| File + private key (leaked PEM) | Can guess passwords offline; every guess costs 260,000 PBKDF2 iterations |
| A file modified by even one byte | HMAC fails; no output |
| Swaps the recipient's public key for their own | **Not prevented.** The public key must arrive over a trusted channel |
| Impersonates the sender | No signature, so anyone who knows the public key and the password can produce a valid file |
| The decrypted ZIP | An ordinary ZIP with no protection |

## 8. Weaknesses found on review {#weaknesses}

These came from re-reading the code. In the published copy only item 7 (a comment) was changed; the rest are left as they are so that existing v4 files still open, and are planned for v5.

1. **260,000 PBKDF2 iterations.** The OWASP Password Storage Cheat Sheet recommends 600,000 for PBKDF2-HMAC-SHA256. v1 used 600,000, so v4 actually went backwards. 600,000 iterations measured about 88 ms, so users would barely notice. The count is a code constant rather than a header field, so changing it would break existing v4 files.
2. **The private key is stored as a plain PEM.** `private_key.pem` is unencrypted PKCS#1. Adding the password in v4 offsets this, but the key file itself ought to be protected too.
3. **The password cannot be wiped on the PowerShell side.** It is read as a `SecureString`, then converted to an ordinary `string` to pass to C#. .NET strings are immutable, so it stays in memory until the garbage collector reclaims it.
4. **The BAT files use `-ExecutionPolicy Bypass`.** It only applies to that process, but on machines where policy blocks scripts, administrator approval is needed.
5. **When encrypting, the HMAC is computed by reopening the file after it has been closed.** If another process changes the file in that short gap, the tag will cover the altered bytes. Computing the HMAC while writing the stream would remove the gap.
6. **The 12-character minimum password length is enforced only in PowerShell.** Calling the C# function directly accepts short passwords.
7. **The C# file's header comment described the v2 (`CPLOGv2!`) format.** The v4 code writes and reads `CPLOGv4!` correctly; only the comment was wrong. It is fixed in the published copy.

## 9. Test results {#tests}

The Windows C# code cannot be compiled in this environment, so I wrote a separate Python implementation that follows the format and key derivation defined in the C# code, and tested that.

**Environment:** Linux x86_64 VM (Intel Xeon 2.10 GHz, 2 vCPUs), Python 3.13.18, cryptography 50.0.1. All inputs are random data generated inside the tests.

| Test | What it does | Result |
| --- | --- | --- |
| Round trip by size | 0 B, 6 B, 8 MiB, Korean file name | Passed |
| Folder + several files | Subfolder structure preserved | Passed |
| Key sizes | 2048 / 3072 / 4096, `wrapLen` value checked | Passed |
| Duplicate names | Same file given twice is rejected | Passed |
| Randomness reuse | Encrypting the same input twice gives different IV, salt and RSA block | Passed |
| Wrong password | Empty, upper-cased, trailing space added, last character removed | All rejected |
| Wrong private key | Different key of the same size; key of another size | All rejected |
| One-bit flip per region | magic, wrapLen, IV, salt, RSA block, first and last body byte, tag | All rejected |
| Exhaustive header and tag flips | Top bit of each of the 300 header bytes and 32 tag bytes of an RSA-2048 file | All 332 rejected |
| Truncation and extension | Cut 1, 16, 32 or 33 bytes from the end; keep only the first 12 bytes; append 16 bytes | All rejected |

`Ran 11 tests in 23.593s — OK`

**Timings (median):**

| Operation | Time |
| --- | --- |
| RSA-3072 OAEP encryption (wrapping 64 B) | 0.039 ms |
| RSA-3072 OAEP decryption | 0.869 ms |
| PBKDF2-HMAC-SHA256, 260,000 iterations | 39 ms |
| PBKDF2-HMAC-SHA256, 600,000 iterations | 88 ms |

Figures for the .NET implementation on Windows may differ.

**Key derivation test vector**, from fixed inputs, for checking other implementations against:

```text
secret   = 00 01 02 … 3f            (64 B)
salt     = 00 01 02 … 0f            (16 B)
password = "CPLOGv4 test vector"
pw_key   = 7b71be66f7c273f63b27dea9363349e0ef187824af70fd3ea1ed86a08c4cebb7
enc_key  = 8531690018ac7803c99cedbd4300bfa9d7d452f167104537f209eb621b8dcc86
mac_key  = 8ad6c0f01ed31f553bbb39beb3c23ccaddd9f3531a1703f5009a984d5215051b
```

## 10. Planned for the next version {#next}

None of this is built yet.

- Record the KDF and iteration count in the header and raise the default to at least 600,000
- Store the private key as encrypted PKCS#8, or in the Windows CNG key store
- Compute the HMAC while writing the stream, removing item 5 in section 8
- An optional RSA-PSS signature for when the sender needs to be verified
- A cross-test opening files made by the C# tool with the Python reference

## 11. Source code {#source}

Put the five files below (C#, PowerShell and three BAT files) in one folder and run a BAT file. PowerShell compiles the C# file with `Add-Type` each time it runs, so there is no prebuilt binary. The published copy drops the v2 and v3 code paths and keeps only v4; the v4 function bodies are identical to the original.

| File | Role | Lines |
| --- | --- | --- |
| `CP_Hybrid_RSA_Core.cs` | Key generation, encryption, decryption, PEM/DER handling | 504 |
| `CP_Hybrid_RSA.ps1` | Input handling, password prompt, calls into C# | 120 |
| `01_Generate_RSA_KeyPair.bat` | Generates an RSA-3072 key pair | 12 |
| `02_Encrypt_RSA_AND_Password.bat` | Encrypts with public key + password | 16 |
| `03_Decrypt_RSA_AND_Password.bat` | Decrypts with private key + password | 16 |
| `cplogv4_ref.py` | Python reference implementation | 167 |
| `test_cplogv4.py` | Tests from section 9 | 123 |
| `bench_cplogv4.py` | Measurements from sections 1 and 9 | 68 |

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

Requires `pip install cryptography`. The reference builds the ZIP in memory, so the C# tool is the better fit for large files.

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

## 12. Licence (MIT) {#license}

The source code in this post is released under the MIT licence below. The `SPDX-License-Identifier: MIT` line at the top of each listing refers to it.

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

## 13. Disclaimer {#disclaimer}

- This code was written for personal study and research and has not been externally audited. The tests in section 9 cover the Python reference implementation and do not establish the security of the C# tool.
- There is no assurance that this tool alone is adequate for data subject to legal protection duties, such as personal, medical or financial data. For such data, use established standard tools and follow your organisation's security policy.
- If the private key or the password is lost, the data cannot be decrypted and there is no recovery mechanism. Any resulting data loss is the user's responsibility.
- Do not use this to circumvent your organisation's security controls, including script execution policy.
- Do not use it on systems or data you are not authorised to access.
- Complying with national laws on the use and export of cryptography is the user's responsibility.
- The author accepts no liability for direct or indirect damage arising from use of the code. This section supplements the warranty disclaimer in the MIT licence above; where the two conflict, the MIT licence prevails.
- This post is the author's personal record and does not represent the position of any institution or company.

## References

- [RFC 8017 · PKCS #1 v2.2 (RSAES-OAEP)](https://www.rfc-editor.org/rfc/rfc8017)
- [RFC 8018 · PKCS #5 v2.1 (PBKDF2)](https://www.rfc-editor.org/rfc/rfc8018)
- [RFC 2104 · HMAC](https://www.rfc-editor.org/rfc/rfc2104)
- [NIST SP 800-38A · Block cipher modes of operation (CBC)](https://csrc.nist.gov/pubs/sp/800/38/a/final)
- [OWASP · Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Microsoft Learn · AesGcm class](https://learn.microsoft.com/dotnet/api/system.security.cryptography.aesgcm)
