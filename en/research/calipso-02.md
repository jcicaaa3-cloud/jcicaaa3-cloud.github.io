---
layout: post
lang: en
title: "Calipso analysis (2): PE structure and Ghidra"
date: 2026-11-06 13:00:00 +0900
permalink: /en/research/calipso-02/
description: "PE header and sections of the Calipso executable, and a DeviceIoControl 0x900B3 call found in Ghidra"
---
In the [last post]({{ '/en/research/calipso-01/' | relative_url }}) I only looked at the Triage report. This time I opened the executable: hash check, then PE header and sections, then Ghidra. Screenshots are from November 6, and the sample isn't uploaded anywhere.

```text
SHA-256  9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed
```

<figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" loading="lazy" alt="SHA-256 hash checked in PowerShell"></a><figcaption>Hash check</figcaption></figure>

## PE header, sections

x64 PE with 19 sections. Besides `.text`, `.data`, and `.rdata`, several `.debug_*` sections are still there, which look like DWARF debug info.

<figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" loading="lazy" alt="PE file header values in PowerShell"></a><figcaption>PE header</figcaption></figure>

<figure><a href="{{ '/assets/images/pe-sections.webp' | relative_url }}"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" loading="lazy" alt="PE section list printed in PowerShell"></a><figcaption>19 sections</figcaption></figure>

<div class="pair"><figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="Entry point and COFF symbol information" loading="lazy"></a><figcaption>Entry point, COFF</figcaption></figure><figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARF debug section names" loading="lazy"></a><figcaption>DWARF sections</figcaption></figure></div>

## `DeviceIoControl`, `0x900B3`

Following references in Ghidra, I found code that passes `0x900B3` to `DeviceIoControl`. The control code table says that's `FSCTL_ENUM_USN_DATA`, which per the [Microsoft docs](https://learn.microsoft.com/en-us/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data) enumerates USN data to get MFT records.

I haven't figured out what it's used for yet. To tell whether it's for finding files, I'll need to look at the code around the call and its arguments.

<figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" loading="lazy" alt="Windows API names found during static inspection"></a><figcaption>API names I picked out (not the call site above)</figcaption></figure>

## Strings

Around the path and extension handling there are strings for Windows system directories and `.exe`, `.dll`, `.sys`. Looks like an exclusion list for encryption, but I need to follow the branches to be sure.

## Next

- The flow leading to the `0x900B3` call
- How target files are picked
- Encryption functions, key handling
- The code that runs the recovery-blocking commands

VM screenshots are in a separate post. → [(3) VM screenshots]({{ '/en/research/calipso-03/' | relative_url }})

References: [Microsoft Learn: FSCTL_ENUM_USN_DATA](https://learn.microsoft.com/en-us/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data) · [Triage static](https://tria.ge/261006-nzbfjaay5m/static1) · [Triage behavioral](https://tria.ge/261006-nzbfjaay5m/behavioral1)
