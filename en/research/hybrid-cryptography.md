---
layout: post
lang: en
title: "Design notes for an RSA + AES hybrid encryption tool"
date: 2026-11-06 15:00:00 +0900
kind: crypto
permalink: /en/research/hybrid-cryptography/
description: "Structure and test list for a tool that encrypts files with AES and the AES key with an RSA public key"
---
Sending a separate password with every encrypted file got tedious, so I'm building a tool in PowerShell and C# that uses an RSA public key together with AES. These are notes on the structure and what I still need to test. No logs, private keys, or passwords go up here.

## Structure

The file is encrypted with AES, and that AES key is encrypted with the recipient's RSA public key. The recipient unwraps the AES key with their private key and decrypts the file.

```text
File to send ── AES encrypt ─────────── ciphertext
                    │
              random AES key
                    │
         recipient's RSA public key
                    │
              encrypted key

Recipient: recover AES key with RSA private key → decrypt file
```

Algorithms: AES-256-GCM and RSA-OAEP (SHA-256). If GCM tag verification fails, the output is discarded.

## Checklist

| Item | Check |
| --- | --- |
| AES key | New key per file (or job) |
| GCM nonce | Never reused with the same key |
| RSA | Same OAEP settings on both sides |
| Tampering | Rejects changed header, ciphertext, or tag |
| Errors, interruptions | No partial plaintext left behind |
| Large files | No excessive memory use |

It uses its own format (`.cpenc`, `.cprsa`), so 7-Zip won't open it and the recipient needs the same tool.

## Tests not done yet

- Round trip for small and large files
- Tampering with part of the ciphertext
- Wrong private key, wrong password
- Temp file cleanup after an interruption
- Decrypting on a different Windows PC

References: [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final) (GCM) · [RFC 8017](https://www.rfc-editor.org/rfc/rfc8017) (RSA-OAEP)
