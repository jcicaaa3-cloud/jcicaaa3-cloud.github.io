---
layout: page
lang: en
title: Evidence
display_title: Research screenshots
permalink: /en/evidence/
intro: "Nine screenshots captured during analysis. Select an image to enlarge it."
description: "Calipso ransomware PE headers, Ghidra views, and virtual-machine observations"
---
These images document the investigation at specific points in time. Terminal output records file-structure inspection; virtual-machine screenshots show the observed state when they were captured.

<div class="evidence-grid">
<figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" alt="SHA-256 output in PowerShell" loading="lazy"></a><figcaption><strong>01. File hash</strong>SHA-256 used to identify the sample.</figcaption></figure>
<figure><a href="{{ '/assets/images/sample-metadata.webp' | relative_url }}"><img src="{{ '/assets/images/sample-metadata.webp' | relative_url }}" alt="Sample metadata" loading="lazy"></a><figcaption><strong>02. Metadata</strong>Basic executable file information.</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" alt="PE file header" loading="lazy"></a><figcaption><strong>03. PE header</strong>Executable format and header values.</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-sections.webp' | relative_url }}"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" alt="PE section listing" loading="lazy"></a><figcaption><strong>04. Sections</strong>Names and sizes of 19 sections.</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="PE entry point" loading="lazy"></a><figcaption><strong>05. Entry point</strong>Entry address and COFF-related output.</figcaption></figure>
<figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARF sections" loading="lazy"></a><figcaption><strong>06. DWARF</strong>Debug-related section names.</figcaption></figure>
<figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" alt="API names" loading="lazy"></a><figcaption><strong>07. API listing</strong>Names observed in the sample.</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-powershell.webp' | relative_url }}"><img src="{{ '/assets/images/pe-powershell.webp' | relative_url }}" alt="PowerShell output" loading="lazy"></a><figcaption><strong>08. PowerShell</strong>File-inspection output.</figcaption></figure>
<figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="Calipso-named files in a VM" loading="lazy"></a><figcaption><strong>09. File names</strong>Observed <code>.calipso</code> extensions in a VM.</figcaption></figure>
</div>

## Sources and interpretation

The images were recorded and edited as part of the research. Windows and third-party analysis tool interfaces belong to their respective developers.

An image alone does not establish malware capabilities. The analysis references [Recorded Future Triage](https://tria.ge/261006-nzbfjaay5m/behavioral1) for publicly recorded behavior and [Microsoft documentation](https://learn.microsoft.com/en-us/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data) for filesystem control codes.

Related notes: [Public sources]({{ '/en/research/calipso-01/' | relative_url }}) · [Static analysis]({{ '/en/research/calipso-02/' | relative_url }}) · [VM observations]({{ '/en/research/calipso-03/' | relative_url }})
