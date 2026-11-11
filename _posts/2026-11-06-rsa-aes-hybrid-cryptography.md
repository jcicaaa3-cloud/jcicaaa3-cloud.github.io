---
layout: post
title: "RSA + AES 하이브리드 암호화 도구 설계 메모"
date: 2026-11-06 15:00:00 +0900
categories: [Cryptography]
tags: [rsa, aes, cryptography, powershell]
permalink: /research/hybrid-cryptography/
description: "파일은 AES로, AES 키는 RSA 공개키로 암호화하는 도구의 구조와 테스트 목록"
---
암호화한 파일을 보낼 때마다 비밀번호를 따로 알려주는 게 번거로워서, RSA 공개키와 AES를 같이 쓰는 도구를 PowerShell과 C#으로 만들고 있습니다. 구조와 테스트할 것들을 적어 둡니다. 로그, 개인키, 비밀번호는 올리지 않습니다.

## 구조

파일은 AES로 암호화하고, 그 AES 키를 받는 사람의 RSA 공개키로 암호화합니다. 받는 쪽은 개인키로 AES 키를 풀고 파일을 복호화합니다.

```text
전송할 파일 ── AES 암호화 ──────────── 암호문
                  │
              임의 AES 키
                  │
         수신자 RSA 공개키
                  │
             암호화된 키

수신자: RSA 개인키로 AES 키 복원 → 파일 복호화
```

알고리즘은 AES-256-GCM, RSA-OAEP(SHA-256)로 잡았고, GCM 태그 검증에 실패하면 결과를 버립니다.

## 체크리스트

| 항목 | 확인할 것 |
| --- | --- |
| AES 키 | 파일(작업)마다 새로 만드는지 |
| GCM nonce | 같은 키로 재사용하지 않는지 |
| RSA | OAEP 설정이 양쪽에서 같은지 |
| 변조 | 헤더, 암호문, 태그가 바뀌면 거부하는지 |
| 오류·중단 | 불완전한 평문이 남지 않는지 |
| 큰 파일 | 메모리를 과하게 쓰지 않는지 |

형식이 `.cpenc`, `.cprsa` 같은 자체 형식이라 7-Zip으로는 안 열리고, 받는 사람도 같은 도구가 있어야 합니다.

## 아직 안 한 테스트

- 작은 파일, 큰 파일 왕복
- 암호문 일부 변조
- 잘못된 개인키, 비밀번호
- 중단됐을 때 임시 파일 정리
- 다른 Windows PC에서 복호화

참고: [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final) (GCM) · [RFC 8017](https://www.rfc-editor.org/rfc/rfc8017) (RSA-OAEP)
