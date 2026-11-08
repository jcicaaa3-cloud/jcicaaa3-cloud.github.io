---
layout: post
lang: en
summary_only: true
title: "Calipso: PE Structure and Windows API References"
lead: "PE sections, entry points, and a filesystem control code located during Ghidra analysis."
topic: "Malware analysis"
date: 2026-11-06 13:00:00 +0900
permalink: /en/research/calipso-02/
description: "English summary of PE and Windows API observations during Calipso static analysis."
---
> **English summary:** This is not a full translation of the Korean article. For detailed evidence, methods, and screenshots, see the [original Korean post]({{ '/research/calipso-02/' | relative_url }}).

The executable had 19 PE sections. I also examined its entry point, COFF-related information, and section names associated with DWARF debug data.

In Ghidra, I located the control code `0x900B3` associated with `DeviceIoControl`. It corresponds to `FSCTL_ENUM_USN_DATA`, a filesystem operation relevant to enumerating NTFS file records.

**Finding the call does not prove that any particular behavior occurred at runtime.** Its control flow and arguments need to be examined before drawing a stronger conclusion.

[Read the original Korean post →]({{ '/research/calipso-02/' | relative_url }})
