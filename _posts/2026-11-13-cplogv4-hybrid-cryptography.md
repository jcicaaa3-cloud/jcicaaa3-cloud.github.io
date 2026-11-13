---
layout: post
title: "RSA + AES 하이브리드 암호화 도구 CPLOGv4 — 구조, 검증, 소스코드"
date: 2026-11-13 18:00:00 +0900
last_modified_at: 2026-11-13 18:00:00 +0900
categories: [Cryptography]
tags: [rsa-oaep, aes-256, hmac, pbkdf2, hybrid-encryption, powershell, csharp]
kind: crypto
permalink: /research/hybrid-cryptography/
description: "RSA-OAEP, PBKDF2, AES-256-CBC, HMAC-SHA256을 묶은 파일 암호화 도구 CPLOGv4의 형식, 키 유도, 위협 모델, 테스트 결과와 MIT 소스코드"
---
11월 6일에 올린 설계 메모를 실제로 만든 v4 기준으로 다시 썼습니다. 파일 형식, 키 유도 과정, 막는 것과 못 막는 것, 직접 찾은 약점, 테스트 결과를 정리하고 소스코드 전체를 MIT 라이선스로 공개합니다. 실행 파일·압축 파일·키 파일은 배포하지 않고 코드 본문만 올립니다.

설계 메모에는 AES-256-GCM을 쓴다고 적었는데, 실제 구현은 **AES-256-CBC + HMAC-SHA256(Encrypt-then-MAC)**입니다. 이유는 [5장](#why-cbc-hmac)에 적었습니다.

| 항목 | 상태 |
| --- | --- |
| Python 참조 구현으로 형식 왕복·변조 테스트 11개 | 통과 (2026-11-13, Linux) |
| 키 크기 2048 / 3072 / 4096 | 세 가지 모두 왕복 통과 (Python 참조 구현) |
| C# 도구를 Windows에서 다시 실행 | 이 글에는 포함하지 않음 |
| C# 암호문 ↔ Python 참조 구현 교차 복호화 | 아직 안 함 |
| 외부 보안 감사 | 없음 |

**목차**

1. [왜 하이브리드인가 — 숫자로 보기](#why-hybrid)
2. [버전 변화 v1 → v4](#versions)
3. [CPLOGv4 파일 형식](#format)
4. [키 유도: 개인키와 비밀번호가 둘 다 필요한 구조](#key-derivation)
5. [GCM 대신 CBC + HMAC을 쓴 이유](#why-cbc-hmac)
6. [복호화 순서](#decrypt-order)
7. [막는 것과 못 막는 것](#threat-model)
8. [직접 찾은 약점](#weaknesses)
9. [테스트 결과](#tests)
10. [다음 버전에서 바꿀 것](#next)
11. [소스코드](#source)
12. [라이선스 (MIT)](#license)
13. [면책 조항](#disclaimer)

## 1. 왜 하이브리드인가 — 숫자로 보기 {#why-hybrid}

RSA-3072에 OAEP(SHA-256)를 쓰면 한 번에 암호화할 수 있는 평문은 `384 - 2×32 - 2 = 318` 바이트입니다. 큰 파일을 RSA만으로 처리하면 318바이트 단위로 쪼개야 하고, 블록마다 개인키 연산이 들어갑니다.

Linux VM에서 직접 재 봤습니다 (환경은 [9장](#tests)).

| 연산 | 측정값 |
| --- | --- |
| RSA-3072 OAEP 복호화 1회 | 0.869 ms |
| AES-256-CBC 암호화 + HMAC-SHA256, 256 MiB | 0.77 s (약 332 MiB/s) |
| HMAC-SHA256 + AES-256-CBC 복호화, 256 MiB | 0.61 s (약 416 MiB/s) |
| 256 MiB를 RSA만으로 처리한다면 (계산) | 844,137 블록, 결과 309 MiB, 복호화 약 12분 |

마지막 줄은 측정한 블록당 시간에 블록 수를 곱한 계산입니다. 그래서 RSA는 파일마다 새로 만든 64바이트 비밀값 하나만 감싸고, 파일 본문은 AES가 처리합니다. RSA 연산은 암호화·복호화 때 각각 한 번입니다.

## 2. 버전 변화 v1 → v4 {#versions}

| 버전 | 식별자 | 복호화에 필요한 것 | 비고 |
| --- | --- | --- | --- |
| v1 | `.cpenc` | 비밀번호 | PBKDF2-HMAC-SHA256 600,000회, AES-256-CBC + HMAC |
| v2 / v2.1 | `CPLOGv2!` | RSA 개인키 | 64바이트 비밀값을 반으로 나눠 AES 키·HMAC 키로 사용. v2.1은 여러 파일 경로 입력 오류 수정 |
| v3 | `CPLOGv3!` | RSA 개인키 + 원본 이미지 파일 | 이미지 파일의 SHA-256을 키 유도에 섞음 |
| v4 | `CPLOGv4!` | RSA 개인키 + 비밀번호 | 이 글의 대상 |

v1은 비밀번호를 매번 따로 전해야 했고, v2는 개인키 파일 하나만 새면 끝이었습니다. v3의 이미지 방식은 파일이 1바이트만 달라져도 복호화가 안 됩니다. 메신저로 보내거나 다시 저장하면 바이트가 바뀌는 경우가 많고, 이미지 사본이 곧 키라서 개인키와 같은 곳에 보관하면 두 번째 요소의 의미가 약해집니다. v4는 이 자리를 사람이 기억하는 비밀번호로 바꿨습니다.

## 3. CPLOGv4 파일 형식 {#format}

정수는 모두 little-endian입니다. 오프셋은 RSA-3072 기준입니다.

| 오프셋 | 크기 | 필드 | 내용 |
| --- | --- | --- | --- |
| 0 | 8 | magic | ASCII `CPLOGv4!` |
| 8 | 4 | wrapLen | RSA 블록 길이. 개인키 모듈러스 길이와 같아야 함 (3072비트면 384) |
| 12 | 16 | IV | AES-CBC IV, 파일마다 새로 생성 |
| 28 | 16 | salt | PBKDF2 salt, 파일마다 새로 생성 |
| 44 | wrapLen | wrapped | RSA-OAEP-SHA256(64바이트 난수 비밀값) |
| 428 | 16의 배수 | body | AES-256-CBC/PKCS7(ZIP 아카이브) |
| 끝 − 32 | 32 | tag | HMAC-SHA256(mac_key, 파일 처음부터 body 끝까지) |

헤더도 HMAC 범위에 들어가므로 IV, salt, 길이 필드를 바꿔도 검증에서 걸립니다. 원본 파일과 폴더는 스트리밍으로 ZIP에 담고 그 ZIP 스트림을 바로 AES에 넣기 때문에, 디스크에 평문 임시 ZIP을 만들지 않습니다.

## 4. 키 유도: 개인키와 비밀번호가 둘 다 필요한 구조 {#key-derivation}

```text
secret (64 B, CSPRNG) ──RSA-OAEP-SHA256(수신자 공개키)──▶ wrapped (헤더에 저장)
salt (16 B, CSPRNG)   ──────────────────────────────────▶ 헤더에 저장
password (UTF-8, 저장 안 함)

pw_key  = PBKDF2-HMAC-SHA256(password, salt, 260,000회, 32 B)
mixed   = HMAC-SHA256(key = pw_key, "CPLOGv4/combine/"     ‖ secret)
enc_key = HMAC-SHA256(key = mixed,  "CPLOGv4/AES-256-CBC/" ‖ salt)
mac_key = HMAC-SHA256(key = mixed,  "CPLOGv4/HMAC-SHA256/" ‖ salt)
```

- `secret`은 개인키가 있어야만 꺼낼 수 있고, `pw_key`는 비밀번호가 있어야만 만들 수 있습니다. `mixed`는 둘 다 있어야 계산됩니다.
- 암호화 키와 MAC 키는 서로 다른 라벨로 따로 뽑습니다. 같은 키를 두 용도로 쓰지 않습니다.
- 비밀번호는 파일, 스크립트, 명령행 인수 어디에도 남기지 않습니다.
- C# 쪽은 키와 비밀값이 담긴 `byte[]`를 쓰고 나면 `Array.Clear`로 지웁니다.

## 5. GCM 대신 CBC + HMAC을 쓴 이유 {#why-cbc-hmac}

이 도구는 Windows 10/11에 기본으로 있는 **Windows PowerShell 5.1 + .NET Framework 4.7.2**에서 별도 설치 없이 돌아가는 것이 목표였습니다. `System.Security.Cryptography.AesGcm` 클래스는 .NET Core 3.0 이후에만 있고 .NET Framework에는 없습니다. CNG를 P/Invoke로 직접 부르면 GCM을 쓸 수는 있지만, 코드가 커지고 실수할 곳이 늘어납니다.

그래서 .NET Framework에 있는 AES-CBC와 HMAC-SHA256을 Encrypt-then-MAC으로 묶었습니다. 헤더와 암호문 전체를 MAC으로 먼저 확인하고, 통과한 경우에만 복호화합니다. 변조된 암호문은 패딩을 검사하는 단계까지 가지 못하므로 padding oracle 공격이 성립하지 않습니다. 키는 AES 256비트와 HMAC 256비트로 따로 씁니다.

## 6. 복호화 순서 {#decrypt-order}

1. magic이 `CPLOGv4!`인지 확인
2. `wrapLen`이 256~1024 범위이고 개인키 모듈러스 길이와 같은지 확인
3. 전체 길이가 최소 크기 이상이고 body가 16바이트 배수인지 확인
4. RSA-OAEP로 `secret` 복원, 64바이트인지 확인
5. 비밀번호로 `enc_key`, `mac_key` 유도
6. 파일 처음부터 tag 앞까지 1 MiB씩 읽으며 HMAC 계산
7. 저장된 tag와 상수 시간 비교. 다르면 여기서 중단하고 아무것도 쓰지 않음
8. 새 파일(`FileMode.CreateNew`)에 AES-CBC 복호화
9. 결과가 ZIP으로 열리는지 확인
10. 8~9단계에서 실패하면 만들던 출력 파일을 지움

입력 파일은 `FileShare.Read`로 열려 있어서, 6단계 검증과 8단계 복호화 사이에 다른 프로세스가 같은 파일을 고쳐 쓸 수 없습니다.

## 7. 막는 것과 못 막는 것 {#threat-model}

| 공격자가 가진 것 | 결과 |
| --- | --- |
| `.cprsa` 파일만 | 개인키도 비밀번호도 없으므로 복호화 불가 |
| 파일 + 비밀번호 | `secret`을 꺼낼 수 없으므로 불가 |
| 파일 + 개인키 (PEM 유출) | 비밀번호를 오프라인으로 대입해 볼 수 있음. 시도 1회마다 PBKDF2 260,000회가 필요 |
| 파일을 1바이트라도 변조 | HMAC 검증 실패, 출력 없음 |
| 수신자 공개키를 자기 키로 바꿔치기 | **막지 못함.** 공개키는 믿을 수 있는 경로로 받아야 함 |
| 발신자 사칭 | 서명이 없어서 공개키와 비밀번호를 아는 사람이면 누구나 정상 파일을 만들 수 있음 |
| 복호화된 ZIP | 일반 ZIP이라 보호되지 않음 |

## 8. 직접 찾은 약점 {#weaknesses}

코드를 다시 읽으면서 찾은 것들입니다. 공개용 사본에서는 7번 주석만 고쳤고, 나머지는 기존 v4 파일과의 호환 때문에 그대로 두었습니다. v5에서 바꿀 생각입니다.

1. **PBKDF2 반복 횟수 260,000회.** OWASP Password Storage Cheat Sheet는 PBKDF2-HMAC-SHA256에 600,000회를 권합니다. v1이 600,000회였으니 v4에서 오히려 낮아진 셈입니다. 측정해 보니 600,000회도 약 88 ms라서 사용자가 느낄 차이는 작습니다. 반복 횟수가 헤더에 없고 코드 상수라서, 바꾸면 기존 v4 파일을 못 엽니다.
2. **개인키가 평문 PEM으로 저장됩니다.** `private_key.pem`은 암호화되지 않은 PKCS#1입니다. v4에서 비밀번호를 추가한 것이 이 부분을 보완하지만, 개인키 파일 자체도 보호하는 편이 낫습니다.
3. **PowerShell 쪽 비밀번호는 지울 수 없습니다.** `SecureString`으로 받은 뒤 일반 `string`으로 바꿔 C#에 넘깁니다. .NET 문자열은 불변이라 메모리에서 지울 방법이 없고, GC가 회수할 때까지 남습니다.
4. **BAT가 `-ExecutionPolicy Bypass`를 씁니다.** 해당 프로세스에만 적용되지만, 조직 정책으로 스크립트 실행을 막은 PC라면 관리자 승인을 받아야 합니다.
5. **암호화할 때 HMAC을 파일을 닫은 뒤 다시 읽어서 계산합니다.** 닫고 다시 여는 짧은 사이에 다른 프로세스가 파일을 바꾸면 바뀐 내용에 tag가 붙습니다. 스트림에 쓰면서 HMAC을 같이 계산하면 없어지는 문제입니다.
6. **비밀번호 최소 길이(12자) 검사가 PowerShell에만 있습니다.** C# 함수를 직접 부르면 짧은 비밀번호도 통과합니다.
7. **C# 파일 머리 주석이 v2(`CPLOGv2!`) 형식을 설명하고 있었습니다.** v4 코드는 `CPLOGv4!` 형식으로 쓰고 읽으며, 틀린 것은 주석뿐입니다. 공개용 사본에서 고쳤습니다.

## 9. 테스트 결과 {#tests}

Windows용 C# 코드를 이 환경에서 컴파일할 수 없어서, C# 코드에 정의된 형식과 키 유도를 그대로 따라 Python으로 따로 구현하고 그것을 테스트했습니다. 두 구현이 서로의 파일을 여는지는 아직 확인하지 않았습니다.

**환경:** Linux x86_64 VM (Intel Xeon 2.10 GHz, vCPU 2개), Python 3.13.18, cryptography 50.0.1. 입력은 모두 테스트 안에서 만든 난수 데이터입니다.

| 테스트 | 내용 | 결과 |
| --- | --- | --- |
| 크기별 왕복 | 0 B, 6 B, 8 MiB, 한글 파일명 | 통과 |
| 폴더 + 여러 파일 | 하위 폴더 구조 유지 | 통과 |
| 키 크기 | 2048 / 3072 / 4096, `wrapLen` 값 확인 | 통과 |
| 중복 이름 | 같은 파일 두 번 입력 시 거부 | 통과 |
| 난수 재사용 | 같은 입력 두 번 암호화 시 IV·salt·RSA 블록이 모두 다름 | 통과 |
| 틀린 비밀번호 | 빈 값, 대문자, 끝 공백 추가, 한 글자 삭제 | 모두 거부 |
| 틀린 개인키 | 같은 크기 다른 키, 다른 크기 키 | 모두 거부 |
| 영역별 1비트 변조 | magic, wrapLen, IV, salt, RSA 블록, body 처음·끝, tag | 모두 거부 |
| 헤더·tag 전수 변조 | RSA-2048 파일의 헤더 300바이트와 tag 32바이트, 바이트마다 최상위 비트 하나 뒤집기 | 332곳 모두 거부 |
| 자르기·늘리기 | 끝에서 1, 16, 32, 33바이트 자르기, 앞 12바이트만 남기기, 16바이트 덧붙이기 | 모두 거부 |

`Ran 11 tests in 23.593s — OK`

**측정값 (중앙값):**

| 연산 | 시간 |
| --- | --- |
| RSA-3072 OAEP 암호화 (64 B 감싸기) | 0.039 ms |
| RSA-3072 OAEP 복호화 | 0.869 ms |
| PBKDF2-HMAC-SHA256 260,000회 | 39 ms |
| PBKDF2-HMAC-SHA256 600,000회 | 88 ms |

Windows의 .NET 구현에서는 숫자가 다를 수 있습니다.

**키 유도 테스트 벡터.** 다른 구현과 맞춰 볼 때 쓰려고 고정 입력으로 뽑았습니다.

```text
secret   = 00 01 02 … 3f            (64 B)
salt     = 00 01 02 … 0f            (16 B)
password = "CPLOGv4 test vector"
pw_key   = 7b71be66f7c273f63b27dea9363349e0ef187824af70fd3ea1ed86a08c4cebb7
enc_key  = 8531690018ac7803c99cedbd4300bfa9d7d452f167104537f209eb621b8dcc86
mac_key  = 8ad6c0f01ed31f553bbb39beb3c23ccaddd9f3531a1703f5009a984d5215051b
```

## 10. 다음 버전에서 바꿀 것 {#next}

아직 만들지 않은 계획입니다.

- 헤더에 KDF 종류와 반복 횟수를 기록하고 기본값을 600,000회 이상으로 올리기
- 개인키를 암호화된 PKCS#8로 저장하거나 Windows CNG 키 저장소에 두기
- 스트림에 쓰면서 HMAC을 함께 계산해 8장 5번 문제 없애기
- 발신자 확인이 필요할 때를 위한 RSA-PSS 서명 옵션
- C# 도구로 만든 파일을 Python 참조 구현으로 여는 교차 테스트

## 11. 소스코드 {#source}

아래 다섯 개(C#, PowerShell, BAT 3개)를 같은 폴더에 두고 BAT를 실행합니다. PowerShell이 실행할 때마다 `Add-Type`으로 C# 파일을 컴파일하므로 미리 빌드한 바이너리는 없습니다. 공개용 사본에서는 v2·v3 코드 경로를 빼고 v4만 남겼으며, v4 함수 본문은 원본과 같습니다.

| 파일 | 역할 | 줄 수 |
| --- | --- | --- |
| `CP_Hybrid_RSA_Core.cs` | 키 생성, 암호화, 복호화, PEM/DER 처리 | 504 |
| `CP_Hybrid_RSA.ps1` | 입력 처리, 비밀번호 입력, C# 호출 | 120 |
| `01_Generate_RSA_KeyPair.bat` | RSA-3072 키 쌍 생성 | 12 |
| `02_Encrypt_RSA_AND_Password.bat` | 공개키 + 비밀번호로 암호화 | 16 |
| `03_Decrypt_RSA_AND_Password.bat` | 개인키 + 비밀번호로 복호화 | 16 |
| `cplogv4_ref.py` | Python 참조 구현 | 167 |
| `test_cplogv4.py` | 9장 테스트 | 123 |
| `bench_cplogv4.py` | 1장·9장 측정 | 68 |

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

`pip install cryptography` 후 실행합니다. 참조 구현은 ZIP을 메모리에 만들기 때문에 큰 파일에는 C# 도구가 맞습니다.

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

## 12. 라이선스 (MIT) {#license}

이 글의 소스코드에는 아래 MIT 라이선스가 적용됩니다. 각 코드 첫 줄의 `SPDX-License-Identifier: MIT`가 이 라이선스를 가리킵니다.

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

## 13. 면책 조항 {#disclaimer}

- 이 코드는 개인 학습과 연구를 위해 만든 것이며 외부 보안 감사를 받지 않았습니다. 9장의 테스트는 Python 참조 구현에 대한 것이고, C# 도구의 안전성을 보증하지 않습니다.
- 개인정보, 의료, 금융 등 법적 보호 의무가 있는 데이터에 이 도구만으로 충분하다고 보장하지 않습니다. 그런 데이터에는 검증된 표준 도구와 소속 기관의 보안 정책을 따르십시오.
- 개인키나 비밀번호를 잃으면 복호화할 수 없고 복구 방법도 없습니다. 이로 인한 데이터 손실은 사용자 책임입니다.
- 소속 기관의 보안 통제(스크립트 실행 정책 포함)를 우회하는 데 사용하지 마십시오.
- 본인에게 권한이 없는 시스템이나 데이터에 사용하지 마십시오.
- 암호 기술의 사용·반출에 관한 각 국가의 법령을 지키는 것은 사용자 책임입니다.
- 코드 사용으로 생긴 직접·간접 손해에 대해 작성자는 책임을 지지 않습니다. 이 조항은 위 MIT 라이선스의 무보증 조항을 보충하며, 둘이 충돌하면 MIT 라이선스가 우선합니다.
- 이 글은 작성자 개인의 기록이며 어떤 기관이나 회사의 입장도 아닙니다.

## 참고 자료

- [RFC 8017 · PKCS #1 v2.2 (RSAES-OAEP)](https://www.rfc-editor.org/rfc/rfc8017)
- [RFC 8018 · PKCS #5 v2.1 (PBKDF2)](https://www.rfc-editor.org/rfc/rfc8018)
- [RFC 2104 · HMAC](https://www.rfc-editor.org/rfc/rfc2104)
- [NIST SP 800-38A · 블록 암호 운용 모드 (CBC)](https://csrc.nist.gov/pubs/sp/800/38/a/final)
- [OWASP · Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Microsoft Learn · AesGcm 클래스](https://learn.microsoft.com/dotnet/api/system.security.cryptography.aesgcm)
