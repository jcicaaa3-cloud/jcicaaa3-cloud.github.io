---
layout: post
lang: en
title: "Calipso analysis (2): PE structure and Ghidra"
date: 2026-11-06 13:00:00 +0900
permalink: /en/research/calipso-02/
description: "Looking at the PE headers, sections, and entry point of the Calipso executable, and following a DeviceIoControl call in Ghidra"
---
In the [previous post]({{ '/en/research/calipso-01/' | relative_url }}) I read the public reports. This time I opened the executable itself. I checked the hash, looked at the PE headers, sections, entry point, and symbol information, then followed function references in Ghidra. All screenshots were taken on November 6, and the original file is not in the repository.

```text
SHA-256  9f77af05e8b3112eb13777853c7397442d8467549c3bce01f2639305f98e96ed
```

<figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" loading="lazy" alt="SHA-256 hash checked in PowerShell"></a><figcaption>Hash check</figcaption></figure>

## PE header and sections

It's a Windows x64 PE file with 19 sections. Besides `.text`, `.data`, and `.rdata`, there are several `.debug_*` sections that look like DWARF debug information.

<figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" loading="lazy" alt="PE file header values in PowerShell"></a><figcaption>PE header</figcaption></figure>

<figure><a href="{{ '/assets/images/pe-sections.webp' | relative_url }}"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" loading="lazy" alt="PE section list printed in PowerShell"></a><figcaption>The 19 sections</figcaption></figure>

Section names alone don't tell you what a section is for; you have to look at permissions, virtual addresses, and actual contents too. The leftover debug sections stand out, but they're not enough to identify the developer or the toolchain.

<div class="pair"><figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="Entry point and COFF symbol information" loading="lazy"></a><figcaption>Entry point, COFF</figcaption></figure><figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARF debug section names" loading="lazy"></a><figcaption>DWARF sections</figcaption></figure></div>

| Looked at | Notes |
| --- | --- |
| PE header | Windows x64 executable |
| Sections | 19 |
| Entry point | Location and surrounding code |
| COFF | Symbol information |
| DWARF | Debug section names |
| APIs | Function references, control code |

## `DeviceIoControl` and `0x900B3`

While following references in Ghidra I found a spot that passes control code `0x900B3` to `DeviceIoControl`. Looking it up in the filesystem control code table gives `FSCTL_ENUM_USN_DATA`.

According to the [Microsoft documentation](https://learn.microsoft.com/en-us/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data), it enumerates USN data over a given range to retrieve MFT records. I don't know yet whether this sample uses it to find files or for something else. I need to look more at the code around the call and its arguments.

What I can say for sure is that the reference is in the code. I haven't confirmed whether it's actually called at runtime or whether it connects to the encryption flow. Enumerating the MFT and modifying it are also two different things.

<figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" loading="lazy" alt="Windows API names found during static inspection"></a><figcaption>API names I picked out during static inspection (not a screenshot of the control-code call site)</figcaption></figure>

## Strings

In the code that handles paths and extensions, there were strings for Windows system directories and extensions like `.exe`, `.dll`, and `.sys`. They might be conditions for excluding files from encryption, but I'd need to follow the branches and call flow to know.

## Still to do

The file renames and backup deletion from part 1 come from public reports; what I looked at directly this time is the PE structure and some code references. To connect the two, I still need to check:

- The actual flow leading to the `0x900B3` call
- How target files are selected
- The encryption functions and key handling
- The code that runs the recovery-blocking commands
- Whether these code paths are used in a real run

The VM screenshots are in the next post.

[Next: (3) VM screenshots]({{ '/en/research/calipso-03/' | relative_url }})

## References

- [Microsoft Learn: FSCTL_ENUM_USN_DATA](https://learn.microsoft.com/en-us/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data)
- [Recorded Future Triage: static info](https://tria.ge/261006-nzbfjaay5m/static1), [behavioral analysis](https://tria.ge/261006-nzbfjaay5m/behavioral1)
