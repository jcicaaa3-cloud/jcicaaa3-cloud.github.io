---
layout: page
lang: en
title: Screenshots
permalink: /en/evidence/
description: "Screenshots of PE headers, sections, and a VM taken while analyzing Calipso ransomware"
---
Nine screenshots I took while analyzing Calipso. Click one to open it at full size. The PowerShell output is from looking at the file structure; the VM screenshots show the state at the time they were taken.

<div class="gallery">
<figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" alt="SHA-256 output in PowerShell" loading="lazy"></a><figcaption>1. File hash (SHA-256)</figcaption></figure>
<figure><a href="{{ '/assets/images/sample-metadata.webp' | relative_url }}"><img src="{{ '/assets/images/sample-metadata.webp' | relative_url }}" alt="Basic file information for the sample" loading="lazy"></a><figcaption>2. Basic file information</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-file-header.webp' | relative_url }}"><img src="{{ '/assets/images/pe-file-header.webp' | relative_url }}" alt="PE header values" loading="lazy"></a><figcaption>3. PE header</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-sections.webp' | relative_url }}"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" alt="PE section list" loading="lazy"></a><figcaption>4. Names and sizes of the 19 sections</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="Entry point information" loading="lazy"></a><figcaption>5. Entry point and COFF output</figcaption></figure>
<figure><a href="{{ '/assets/images/dwarf-sections.webp' | relative_url }}"><img src="{{ '/assets/images/dwarf-sections.webp' | relative_url }}" alt="DWARF section names" loading="lazy"></a><figcaption>6. DWARF debug sections</figcaption></figure>
<figure><a href="{{ '/assets/images/api-imports.webp' | relative_url }}"><img src="{{ '/assets/images/api-imports.webp' | relative_url }}" alt="API name output" loading="lazy"></a><figcaption>7. API names found in the executable</figcaption></figure>
<figure><a href="{{ '/assets/images/pe-powershell.webp' | relative_url }}"><img src="{{ '/assets/images/pe-powershell.webp' | relative_url }}" alt="PowerShell command output" loading="lazy"></a><figcaption>8. PowerShell output from inspecting the file</figcaption></figure>
<figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt=".calipso files in the VM" loading="lazy"></a><figcaption>9. <code>.calipso</code> extensions in the VM</figcaption></figure>
</div>

I didn't draw conclusions about what the malware does from screenshots alone. For publicly recorded behavior I used [Recorded Future Triage](https://tria.ge/261006-nzbfjaay5m/behavioral1), and for the filesystem control code the [Microsoft documentation](https://learn.microsoft.com/en-us/windows/win32/api/winioctl/ni-winioctl-fsctl_enum_usn_data). The Windows and analysis-tool UI in the screenshots belongs to their respective makers.

Related posts: [(1) Public reports]({{ '/en/research/calipso-01/' | relative_url }}) · [(2) Static analysis]({{ '/en/research/calipso-02/' | relative_url }}) · [(3) VM screenshots]({{ '/en/research/calipso-03/' | relative_url }})
