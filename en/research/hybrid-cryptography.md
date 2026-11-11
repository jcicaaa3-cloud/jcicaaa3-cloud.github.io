---
layout: post
lang: en
title: "Design notes for an RSA + AES hybrid encryption tool"
date: 2026-11-06 15:00:00 +0900
permalink: /en/research/hybrid-cryptography/
description: "Structure and test plan for a tool that encrypts files with AES and the AES key with the recipient's RSA public key"
---
Sending a separate password every time I send an encrypted file got tedious, so I'm building a tool that combines an RSA public key with an AES key. It's built with Windows PowerShell and C#, and this post covers the structure and what I still need to test. I don't upload real logs, private keys, or passwords.

## Structure

The file body is encrypted with AES, and the AES key used only for that file is encrypted with the recipient's RSA public key. That way RSA never has to handle a large file directly.

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

I went with AES-256-GCM and RSA-OAEP (SHA-256). If GCM tag verification fails, the decrypted output has to be thrown away.

## Things to check in the implementation

| Item | What to check |
| --- | --- |
| AES key | A new key per file or per job |
| GCM nonce | Never reused with the same key |
| RSA | Same OAEP settings on sender and recipient |
| Tamper check | Rejects changes to header, ciphertext, or tag |
| File handling | Large files and folders without excessive memory use |
| Decryption tool | Recipient's PC can read the same format |

If something fails mid-encryption or the tag doesn't match, no partial plaintext should be left behind. File size, interrupted jobs, and wrong private keys are on the test list too.

## It's not a ZIP

With a custom format like `.cpenc` or `.cprsa`, the result isn't a normal ZIP you can open in 7-Zip. The recipient needs a tool that reads the same format, so whether encryption works and whether decryption works on the recipient's PC have to be checked separately.

## Tests I haven't run yet

- Round trip for small and large files
- Error handling when part of the ciphertext is changed
- Wrong private key and wrong password
- Cleaning up temp files from interrupted jobs
- Reproducing on a different Windows setup

When I run the tests, I'll post the input conditions and error messages along with the results.

## References

- [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final): GCM
- [RFC 8017](https://www.rfc-editor.org/rfc/rfc8017): RSAES-OAEP
