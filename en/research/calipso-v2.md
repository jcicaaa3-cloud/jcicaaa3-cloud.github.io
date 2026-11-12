---
layout: post
lang: en
title: "Calipso analysis v2.0: encryption and execution flow"
date: 2026-11-12 18:00:00 +0900
kind: malware
permalink: /en/research/calipso-v2/
description: "Static analysis of the Calipso ransomware: XChaCha20 + RSA-4096 OAEP, first-5MB partial encryption, MFT-based file discovery, recovery inhibition, IOCs and a YARA rule"
---
A consolidated write-up of my static analysis of Calipso.exe in Ghidra 12.2. It folds in posts (1) to (3) and adds the encryption design and execution flow I worked out afterwards. Static analysis only; runtime behavior comes from the public Recorded Future Triage report. Function addresses assume image base `0x140000000`.

## Summary

- Files are encrypted with XChaCha20. Only the first 5MB of each file is overwritten, in place.
- Each run generates one 32-byte session key, encrypts it with an RSA-4096 public key embedded in the binary (OAEP, SHA-1), and appends the result to every file.
- Encrypted files are exactly 536 bytes larger than the original (24B nonce + 512B RSA ciphertext).
- Decryption needs the attacker's private key. That said, anything past 5MB is left intact, and the session key is never wiped from memory, so a memory dump taken during the infection can give the key back.
- On local NTFS drives it builds the file list by enumerating the MFT directly (`FSCTL_ENUM_USN_DATA`); everything else gets a normal directory walk.
- It also relaunches itself elevated, kills every process not on an allowlist, deletes shadow copies and the backup catalog, disables boot recovery, wipes all event logs, locks the wallpaper, and drops `recovery.txt`.

## Sample

| Item | Value |
| --- | --- |
| File name | `Calipso.exe` |
| SHA-256 | `9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed` |
| Format | Windows x64 PE, about 7.7MB |
| Build | MinGW-w64 GCC, Crypto++ statically linked (CMake build path `/src/build/_deps/cryptopp-cmake-build/` left in) |
| Tools | Ghidra 12.2, static only |

There are no function names (`FUN_`), so I worked backwards from Windows API calls. The leftover Crypto++ class names (RTTI) and debug log strings helped a lot with identifying algorithms and stages.

## Execution flow

The main routine is `FUN_14000d810`. In call order:

```text
FUN_14000d810
 ├ check env var CALIPSO_LOG → debug logging on/off
 ├ embedded PEM public key → Base64 decode → load RSA public key
 ├ FUN_1400059f0  enable SeDebug / SeBackup / SeRestore
 ├ FUN_140005bb0  kill processes not on the allowlist
 ├ start 2 helper threads
 ├ FUN_140004ab0  generate 32B session key
 ├ FUN_14000d250  RSA-OAEP encrypt the session key → 512B
 ├ pick targets: no args = all volumes, otherwise a drive letter or UNC path
 ├ FUN_1400098d0  file discovery + multithreaded encryption
 ├ wait for helper threads
 ├ FUN_1400055a0  write recovery.txt to the desktop and open it
 └ "[*] Done."
```

The elevation function (`FUN_140001ef0`, `ShellExecuteW` with `runas`) and the wallpaper function (`FUN_1400066a0`) sit outside this flow.

## Encryption

### One file (`FUN_140006c80`)

1. Open the file read/write with no sharing. Zero-byte files are skipped.
2. Read at most `0x500000` (5MiB) from the start.
3. Generate a fresh 24-byte nonce per file (Crypto++ RNG seeded from the OS).
4. Set up XChaCha20 with the session key (32B) and nonce (24B), and encrypt the buffer in place.
5. Seek back to the start and overwrite the same length, then append the nonce and the RSA-encrypted session key to the end.
6. Rename with `MoveFileExW`, adding `.calipso`.

```c
if (0x500000 < fileSize) toRead = 0x500000;                 // first 5MiB only
FUN_1400145f0(&cipher, sessionKey, 0x20, nonce, 0x18);      // 32B key, 24B nonce
```

Why XChaCha20: the key and nonce lengths match the spec, it's a stream cipher with no size change, and the binary has `XChaCha20_Policy` and `SymmetricCipherFinal<…XChaCha20_Info>` RTTI with no Salsa20 variants.

### Encrypted file layout

```text
[ first ≤5MiB: ciphertext ][ after 5MiB: original ][ nonce 24B ][ RSA ciphertext 512B ]
```

- Exactly 536 bytes larger than the original.
- Every file encrypted in the same run ends with the same 512 bytes, because the session key is RSA-encrypted once and appended everywhere. During incident response this groups files hit by the same infection.

### Session key and public key

- `FUN_140004ab0`: generates the 32-byte session key with a Crypto++ RNG seeded from `CryptGenRandom`. Nothing weak about the key generation itself.
- `FUN_14000d250`: encrypts the session key with the embedded public key. Output size equals the modulus size (512B). The only RSA encryptor class in the binary is `RSAES<OAEP<SHA1>>`.
- The public key is stored at `0x1402EB9C0` as 800 bytes of PEM text (`BEGIN PUBLIC KEY`). The main routine reads it line by line, drops the header and footer lines containing `-----`, and Base64-decodes the rest.

| Item | Value |
| --- | --- |
| Algorithm | RSA 4096-bit, e = 65537 |
| SPKI (DER) SHA-256 | `3ec19d669d122966b8365722060a32dfbe5f6ca09d12b3397bb6940d831005d2` |

### Recovery options

- The session key is protected by RSA-4096 OAEP and can't be recovered without the attacker's private key.
- Anything past 5MiB is untouched. Large files like videos, databases, and disk images can be partly salvaged.
- The main routine frees the session key and RSA ciphertext without zeroing them (end of `FUN_14000d810`), unlike the file encryption function, which does clear its cipher state. If the session key turns up in a process memory dump taken during or right after the infection, every file locked by that run can be decrypted, since there's one key per run.

## File discovery (`FUN_1400098d0`)

### Threads

| Role | Count |
| --- | --- |
| Encryption workers | CPU cores × 2, min 8, max 64 |
| Directory tree walk (when MFT isn't used) | 2–8 |
| Per-folder processing | 2 |

Worker threads (`FUN_140007430`) pull paths off a shared queue, encrypt them, and count successes and failures atomically.

### MFT enumeration

If the volume is in `X:` form, the drive type is fixed or removable, and the file system is NTFS, it takes the MFT path.

1. Open `\\.\X:` with `FILE_FLAG_BACKUP_SEMANTICS`.
2. Allocate a 64MB buffer and call `DeviceIoControl(0x900B3)` in a loop. `0x900B3` is `FSCTL_ENUM_USN_DATA`. Input is `MFT_ENUM_DATA_V1` (32B), with a retry using V0 (24B) on failure.
3. Collect records into a hash map (500,000 slots reserved) and count everything that isn't a directory or reparse point as a file.
4. Rebuild full paths by following parent references and push them onto the encryption queue.

```c
DeviceIoControl(hVolume, 0x900b3, &enumData, 0x20, buf, 0x4000000, &returned, NULL);
```

Otherwise (not NTFS, a network path, or MFT enumeration failed) it falls back to a regular recursive directory walk.

In post (2) I wrote that I didn't know what `0x900B3` was for. It's how it gets the whole file list of a local NTFS drive in one go. When this path runs, the debug log prints `[+] MFT: …`.

This matters for behavior-based detection. Typical ransomware calls `FindFirstFileW`/`FindNextFileW` over and over for every folder, while MFT enumeration is done in a handful of `DeviceIoControl` calls per volume (up to 64MB per call). To a detection model that uses API call frequency as a feature, the pattern looks very different.

## Before encryption

### Privileges (`FUN_1400059f0`)

Enables `SeDebugPrivilege`, `SeBackupPrivilege`, and `SeRestorePrivilege`: the privileges needed to kill other processes and to read and write files even when their ACLs say no.

### Process killing (`FUN_140005bb0`)

It walks the running processes and calls `TerminateProcess` on any whose lowercased name contains none of the allowlist strings. The list sits at `0x1401ED000` with 72 entries. So it carries a "keep alive" list, not a kill list, and shuts down everything else. Office, databases, browsers, backup software, and third-party antivirus all close at once, which is likely the first thing a victim notices.

| Category | Kept alive (partial) |
| --- | --- |
| OS core | system, smss, csrss, wininit, services, lsass, winlogon, svchost, registry, memory compression |
| Desktop/shell | explorer, dwm, sihost, shellexperiencehost, startmenuexperiencehost, logonui |
| Needed to run commands | conhost, wmiprvse, dllhost, taskhostw |
| Microsoft Defender | msmpeng, mssecflt, securityhealthservice |
| Virtualization tools | vboxservice, vboxtray, vmtoolsd, vmwaretray, qemu-ga, vmic* (Hyper-V), vmcompute, hvhost |
| Other | powershell, GPU driver trays |

Since it's a substring match, any process with a word like `system` in its name survives.

## Recovery inhibition and log wiping

`FUN_140002320` runs `cmd.exe /C <command>` with no window and waits for it to finish. The `cmd.exe /C ` string is built from integer constants, so a plain string search won't find it.

| Function | Command |
| --- | --- |
| `FUN_140005fc0` | `vssadmin Delete Shadows /All /Quiet` |
| | `wmic shadowcopy delete /nointeractive` |
| | `wbadmin delete catalog -quiet` |
| | `bcdedit /set {default} bootstatuspolicy ignoreallfailures` |
| | `bcdedit /set {default} recoveryenabled No` |
| `FUN_140006280` | `for /F "tokens=*" %i in ('wevtutil el') do wevtutil cl "%i"` |

This matches the `vssadmin`, `wmic`, `wbadmin`, `bcdedit`, and `wevtutil` processes in the Triage run. The last command clears every event log channel, not just Security.

## Ransom note and wallpaper

- `FUN_1400055a0`: writes `recovery.txt` to the desktop folder and opens it in the default editor, falling back to launching `notepad.exe` directly. The note includes a Case ID hardcoded in the binary (`3422…`, rest omitted).
- `FUN_1400066a0`: writes a PNG embedded in the binary (`0x1401ED300`, 1,042,055B) to disk and sets it as the wallpaper. It writes to `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System` as well as `HKCU\Control Panel\Desktop`, so the user can't change it back.

## Detection

### IOCs

| Type | Value |
| --- | --- |
| SHA-256 | `9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed` |
| Extension | `.calipso` |
| Ransom note | `recovery.txt` on the desktop |
| Wallpaper image | `C:\ProgramData\calipso_wallpaper.png` (per Triage) |
| Registry | `HKLM\…\Policies\System\Wallpaper`, `WallpaperStyle` = `10` |
| Environment variable | `CALIPSO_LOG` |
| Public key fingerprint | SPKI SHA-256 `3ec19d66…831005d2` |
| File traits | +536B in size; last 512B identical across files from one infection |
| Log strings | `[*] Starting Calipso...`, `[*] Destroying recovery (`, `[+] MFT queued: `, `[*] Tree scan: ` |

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

Either condition is enough for a hit. If a build ships with the debug strings stripped, the extension + note + command combination still catches it.

### MITRE ATT&CK

| Technique | Detail |
| --- | --- |
| T1486 Data Encrypted for Impact | XChaCha20 + RSA-OAEP file encryption |
| T1490 Inhibit System Recovery | vssadmin, wmic, wbadmin, bcdedit |
| T1685.005 Clear Windows Event Logs (formerly T1070.001) | wevtutil wipes all logs |
| T1489 Service Stop | kills processes not on the allowlist |
| T1057 Process Discovery | `CreateToolhelp32Snapshot` |
| T1083 File and Directory Discovery | MFT enumeration, directory walk |
| T1134 Access Token Manipulation | enables SeDebug/SeBackup/SeRestore |
| T1059.003 Windows Command Shell | `cmd.exe /C` |
| T1112 Modify Registry | wallpaper policy keys |
| T1491.001 Internal Defacement | locked wallpaper |

## Assessment

The crypto design is solid. It uses a well-tested library as is, key generation, key protection, and per-file nonces are all fine, and partial encryption, multithreading, and MFT enumeration show it was built for speed.

On the other hand there's almost nothing to slow down analysis. No packing or obfuscation, and the debug logging feature, log messages, Crypto++ class names, and build path are all still in there. Not wiping the session key from memory fits the same picture.

## Next

- Dynamic analysis: session key left in memory, whether the MFT path is actually taken
- Run the YARA rule against the sample
- File filter function: which extensions and folders are skipped
- Entry points of the 2 helper threads and the per-folder threads, and when the wallpaper function is called
- Check the bytes of 7 short allowlist names (currently read from first letter and length as idle, smss, lsm, dwm, vmms, vmwp, vmsp)

## References

- [Recorded Future Triage: behavioral](https://tria.ge/261006-nzbfjaay5m/behavioral1) · [static](https://tria.ge/261006-nzbfjaay5m/static1)
- [PCRisk: Calipso ransomware](https://www.pcrisk.com/removal-guides/35977-calipso-ransomware)
- [Microsoft Learn: FSCTL_ENUM_USN_DATA](https://learn.microsoft.com/en-us/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data)
- MITRE ATT&CK [T1486](https://attack.mitre.org/techniques/T1486/), [T1490](https://attack.mitre.org/techniques/T1490/), [T1685.005](https://attack.mitre.org/techniques/T1685/005/)

Earlier notes: [(1) public report]({{ '/en/research/calipso-01/' | relative_url }}) · [(2) PE structure]({{ '/en/research/calipso-02/' | relative_url }}) · [(3) VM screenshots]({{ '/en/research/calipso-03/' | relative_url }})
