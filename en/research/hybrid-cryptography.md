---
layout: post
lang: en
summary_only: true
title: "Hybrid Cryptography with RSA and AES"
lead: "Notes on implementing and validating a hybrid file-protection approach."
topic: "Cryptography"
date: 2026-11-06 15:00:00 +0900
permalink: /en/research/hybrid-cryptography/
description: "English summary of a hybrid cryptography exercise using RSA and AES."
---
> **English summary:** This is not a full translation of the Korean article. For detailed implementation notes and evidence, see the [original Korean post]({{ '/research/hybrid-cryptography/' | relative_url }}).

I explored a hybrid scheme that uses AES to encrypt file contents and RSA to protect the symmetric key material. AES is suited to bulk data encryption; RSA can bind the recovery key material to the recipient's public key.

Where password-based protection is added, validation should also cover key management and the recipient's decryption workflow. This is a learning and testing record, not an endorsement of an unreviewed implementation for production-sensitive data.

[Read the original Korean post →]({{ '/research/hybrid-cryptography/' | relative_url }})
