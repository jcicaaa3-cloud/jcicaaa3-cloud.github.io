# Security and Publication Policy

This repository contains **defensive research documentation only**.

## Do not commit

- Executable ransomware or other malware samples, even within ZIP/7z archives
- Potentially sensitive victim data, personal information, real system logs, or memory dumps
- RSA private keys, API tokens, credentials, access tokens, encrypted key stores, or passphrases
- Weapons-grade payloads or techniques intended to cause unauthorised damage
- Unreviewed screenshots that may expose file paths, account identifiers, or secrets

## What belongs here

- Research notes, evidence tables, source citations, hashes, and non-executable screenshots
- High-level defensive architecture and test plans using synthetic data
- Clear separation between public sandbox observations, static code findings, and hypotheses

A `.gitignore` file is **not** an access-control mechanism. Inspect staged changes and repository history before publishing. If secrets have already been committed, rotate or revoke them and clean the history appropriately.
