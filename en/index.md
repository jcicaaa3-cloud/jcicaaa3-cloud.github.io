---
layout: default
lang: en
title: Home
permalink: /en/
description: "Independent notes on malware static analysis, computer vision, AI model development and evaluation"
---
<section class="home-opening" aria-labelledby="welcome-title">
  <div>
    <span class="home-kicker">November 2026 · Independent research notes</span>
    <h1 id="welcome-title">Hello.<br>I'm <span>jcicaaa3.</span></h1>
    <div class="home-intro"><p>I document what I learn through cybersecurity research and hands-on analysis. I'm interested in how malicious software works, so I examine executable file structures alongside public technical reports. I also work on computer vision and the evaluation of AI systems.</p></div>
  </div>
  <aside class="home-aside" aria-label="Contact"><a href="mailto:jcicaaa3@gmail.com">Email</a><a href="https://github.com/jcicaaa3-cloud" rel="me noopener noreferrer" target="_blank">GitHub</a></aside>
</section>
<section class="home-section" aria-labelledby="feature-title">
  <div class="section-topline"><h2 id="feature-title">On my desk</h2><span class="section-aux">Calipso / Windows executables</span></div>
  <div class="feature-sheet">
    <div class="feature-copy">
      <span class="mini-label">November 6 · Static analysis</span>
      <h3>While examining PE sections,<br>I encountered <code>0x900B3</code></h3>
      <p>After checking the sample hash, I examined its PE headers and sections. In Ghidra I found a filesystem control code associated with <code>DeviceIoControl</code>. Finding an API call is not, by itself, proof of what happened at runtime; that distinction matters in the analysis.</p>
      <a class="note-link" href="{{ '/en/research/calipso-02/' | relative_url }}">Read the analysis notes →</a>
    </div>
    <a class="feature-photo" href="{{ '/en/research/calipso-02/' | relative_url }}" aria-label="Calipso static analysis"><img src="{{ '/assets/images/pe-sections.webp' | relative_url }}" alt="PowerShell output listing 19 PE sections"></a>
  </div>
</section>
<section class="home-section" aria-labelledby="entries-title">
  <div class="section-topline"><h2 id="entries-title">Recent notes</h2><a class="note-link" href="{{ '/en/research/' | relative_url }}">All posts →</a></div>
  <ol class="log-list">
    <li><a href="{{ '/en/research/hyflock-preview/' | relative_url }}"><span class="date">2026.11.08</span><span class="entry-title">Up next: HYFLOCK and antivirus detection</span><span class="entry-class">Preview</span></a></li>
    <li><a href="{{ '/en/research/hybrid-cryptography/' | relative_url }}"><span class="date">2026.11.06</span><span class="entry-title">Hybrid cryptography with RSA and AES</span><span class="entry-class">Crypto</span></a></li>
    <li><a href="{{ '/en/research/calipso-03/' | relative_url }}"><span class="date">2026.11.06</span><span class="entry-title">Calipso: Observations from a VM</span><span class="entry-class">Malware</span></a></li>
    <li><a href="{{ '/en/research/calipso-02/' | relative_url }}"><span class="date">2026.11.06</span><span class="entry-title">Calipso: PE structure and Windows APIs</span><span class="entry-class">Malware</span></a></li>
    <li><a href="{{ '/en/research/calipso-01/' | relative_url }}"><span class="date">2026.11.05</span><span class="entry-title">Calipso: Sources and the analysis target</span><span class="entry-class">Malware</span></a></li>
  </ol>
</section>
<section class="home-section" aria-labelledby="photos-title">
  <div class="section-topline"><h2 id="photos-title">Screenshots from the research</h2><a class="note-link" href="{{ '/en/evidence/' | relative_url }}">View gallery →</a></div>
  <div class="contact-strip">
    <figure><a href="{{ '/assets/images/sha256-check.webp' | relative_url }}"><img src="{{ '/assets/images/sha256-check.webp' | relative_url }}" alt="SHA-256 verification in PowerShell" loading="lazy"></a><figcaption>01 / Hash verification</figcaption></figure>
    <figure><a href="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}"><img src="{{ '/assets/images/pe-entrypoint.webp' | relative_url }}" alt="Entrypoint and COFF inspection" loading="lazy"></a><figcaption>02 / Entry point</figcaption></figure>
    <figure><a href="{{ '/assets/images/calipso-files.webp' | relative_url }}"><img src="{{ '/assets/images/calipso-files.webp' | relative_url }}" alt="File listing inside a virtual machine" loading="lazy"></a><figcaption>03 / Files in the VM</figcaption></figure>
  </div>
</section>
<p class="small-outro">Corrections and additional findings are recorded in the relevant posts with their dates.</p>
