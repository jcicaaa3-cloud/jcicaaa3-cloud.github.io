---
layout: post
lang: en
title: "Thesis notes (3): reversing the missed samples, and revising the manuscript"
date: 2026-11-15 13:20:00 +0900
kind: thesis
permalink: /en/research/thesis-03/
description: "How RQ3 changed when the Shodi samples couldn't be obtained, static analysis of a CryptoLocker sample LightGBM missed, byte-level checks of the HYFLCK03 footer in a HYFLOCK Go carrier, the claims I scaled back, and what's left"
---
Following [part 2]({{ '/en/research/thesis-02/' | relative_url }}), this is RQ3: opening the missed samples. The last section collects the claims I scaled back while revising.

1. [Changing topic and setting the questions]({{ '/en/research/thesis-01/' | relative_url }})
2. [Reproducing MLRan, family-disjoint evaluation, feature reselection, SHAP]({{ '/en/research/thesis-02/' | relative_url }})
3. **Reversing the missed samples, and revising the manuscript** (this post)

| Case | Where | Evidence | Outcome |
| --- | --- | --- | --- |
| Shodi | In dataset, criterion (1) | – | Couldn't obtain the samples |
| MBRLock | In dataset, criterion (1) | – | Not analysed |
| CryptoLocker `654c4734…` | In dataset, LightGBM FN, criterion (2) | S, D, M | Analysed |
| HYFLOCK `b15482d0…` | Outside dataset, no model score | S, R | Analysed |

**Contents**

1. [The original plan: Shodi](#shodi)
2. [CryptoLocker, picked by criterion (2)](#selection)
3. [The analysis kit](#kit)
4. [CryptoLocker: model and record](#cl-model)
5. [CryptoLocker: the binary](#cl-binary)
6. [Why Defender deleted it as ransomware](#defender)
7. [What CryptoLocker lets me say](#cl-claim)
8. [HYFLOCK: a Go loader](#hy-loader)
9. [HYFLOCK: the last 16 bytes](#hy-footer)
10. [The hash that didn't match the report](#hy-hash)
11. [Why HYFLOCK has no model score](#hy-no-score)
12. [Revising the manuscript](#revisions)
13. [What's left](#next)

## 1. The original plan: Shodi {#shodi}

Criterion (1) from [part 1]({{ '/en/research/thesis-01/' | relative_url }}) is "a sample from the family with the lowest family-disjoint recall". For LR that's Shodi; for LightGBM, MBRLock.

LR detected all of MBRLock, and LightGBM's failures sat on a single score of 0.475, so the cause looked more like the model than the samples. Shodi was lowest for LR and gave 25 FNs under LightGBM, so I decided to look at it first.

On the host PC I produced a prioritised list of eight SHA-256 values. Numbers 1–4 were Shodi: three missed by both models and one detected sample for comparison.

While building the list I noticed something in the MLRan records alone. The 11 Shodi samples LR missed looked very different from the 60 it caught.

| Feature | Missed Shodi | Detected Shodi |
| --- | --- | --- |
| `comctl32.dll` loaded | 82% | 2% |
| `SetWindowsHookExW` called | 64% | 2% |
| Keyboard-layout registry read | 100% | 38% |

The missed group's rates looked like goodware. Maybe only GUI-like activity was recorded in the 120 seconds; I planned to check for installer or dropper wrapping in the static analysis.

But I couldn't obtain Shodi files matching those hashes. So that table isn't in the thesis: it was never checked against binaries, and it only compares within one family. The thesis leaves it as an untested hypothesis, noting that whether failed samples show different traces from training families can only be answered by analysing training-family samples the same way.

## 2. CryptoLocker, picked by criterion (2) {#selection}

With Shodi blocked, I reworked RQ3. RQ1, RQ2 and their tables stayed; only section 2.4, section 3.3, parts of chapters 4 and 5, and the abstract changed.

At first I meant to describe this as "a change in case selection due to sample availability". But the CryptoLocker sample I was about to analyse (`654c4734…`) was already the sample for criterion (2), "the FN given the highest probability of being benign". So rather than say the selection changed, I wrote it as it was: the criterion (1) Shodi samples couldn't be obtained, and the criterion (2) sample was analysed.

Applying criterion (2) to LightGBM gives two CryptoLocker samples tied at a ransomware probability of 0.167. The criteria had no tie-breaking rule, so picking one was a choice outside them. The thesis says so, and lists everything not analysed:

- The other tied CryptoLocker sample
- The criterion (2) sample for LR
- Cases meeting criteria (3) and (4)

So the in-dataset failure analysis is a single case with the criteria only partly applied.

The chosen sample was in fold 3. LR detected it at 0.641; LightGBM missed it at 0.167.

## 3. The analysis kit {#kit}

The kit has two stages.

**Stage 1 (host PC)**: pulls the target sample's feature values and both models' SHAP values from the MLRan feature matrix and prediction files. No malware files involved.

**Stage 2 (isolated VM)**: a single batch file.

- Stops if any network adapter is active.
- Stops if the sample's SHA-256 doesn't match.
- Only reads the sample as bytes: sections, entropy, imports, packer hints, keyword strings.
- Checks whether string and API features in the MLRan record actually appear in the binary (D vs S). For CryptoLocker that was 286 STR/API features out of the fixed 483.
- Runs Ghidra 12.2 headless and extracts call sites for file-enumeration and crypto-related APIs.

Before using the kit I ran its own tests (11 Python, 37 Java checks) and confirmed that the prediction file used in stage 1 was byte-identical to the one from the part 2 experiments.

The first Ghidra run finished auto-analysis in 27 seconds, but the decompile script failed to compile. It called `currentProgram.getEntryPoint()`, a method Ghidra's `Program` doesn't have; entry points come from the symbol table's external entry point iterator. After that I patched the automation to extract the functions I wanted, so I didn't have to hunt for them one by one in Ghidra.

## 4. CryptoLocker: model and record {#cl-model}

| Item | Value |
| --- | --- |
| SHA-256 | `654c473412c0e3f812c94d25f785c3173e2d8bda08701efdc7a937e55a27d692` |
| Architecture | x86 |
| Sections | 5 |
| File entropy | 6.68 (max section 6.65) |
| Imported functions | 129, no CryptoAPI imports |
| LR | 0.641, detected |
| LightGBM | 0.167, FN |

**Model (M)**: the feature that lowered LightGBM's score most was the `ole32.dll` load, at SHAP −1.13, which is 67% of this sample's total negative attribution. The second feature was +0.13, so this one feature carried the decision towards benign. It's the same feature from [part 2]({{ '/en/research/thesis-02/#top-features' | relative_url }}) that appears in 91% of goodware.

**Record (D)**: 15 features had value 1 for this sample: 9 REG, 5 SYS, 1 FILE. Most were traces of window and input-method initialisation. Within the 483 selected features, the `NtWriteFile` feature and the directory and dropped-file categories were all 0.

Zero means no record represented by those features was present. The raw Cuckoo API call order and arguments weren't used as evidence, so I can't say there were no file writes or directory enumeration over the whole run.

## 5. CryptoLocker: the binary {#cl-binary}

The flow I followed in Ghidra (S):

```text
Window title "CryptoLocker Decryption Software"
 └ Confirmation "Do you want to decrypt PC?"  → Yes
    └ FUN_00415500   creates the processing thread
       └ FUN_004139e0   enumerates drives (skips A:; removable, fixed, network, RAM disk)
          └ FUN_00414b30   walks folders recursively
             └ FUN_004135b0   handles each file
FUN_004152a0
 ├ FUN_004140f0   opens a file with CREATE_ALWAYS
 └ message "Files are now decrypted. Your PC will be restarted."
```

Other functions:

- `FUN_00413140`: renames files with `MoveFileExW`, in one of two ways.
- `FUN_00414a30`: calls `DeleteFileW`.
- `FUN_00412f70`: builds a folder path and a `DECRYPT_INSTRUCTIONS.html` path.

A decryption window is shown, and the file-processing thread starts only after "Yes". I confirmed the drive loop and recursive folder walk. I couldn't establish whether the enumerated files are encrypted or decrypted, or what file `FUN_004140f0` opens with `CREATE_ALWAYS`. Drive loops, recursive walks and renaming look the same in an encryptor, so they don't settle it.

D and S also disagreed in places. `FindResourceExW`, `LoadResource` and `DrawTextExW` are in the MLRan execution record but not in this file's imports. Cuckoo may have recorded calls made on the sample's behalf by system DLLs that draw windows. If so, behavioural features also contain things that aren't the program's own actions.

## 6. Why Defender deleted it as ransomware {#defender}

During the analysis Microsoft Defender detected this file as ransomware and deleted it. My first thought was "if it's a decryption screen, is the label wrong?", but that isn't evidence either way.

Antivirus products often judge a file by which ransomware family it belongs to rather than by what it does. A decryptor is part of the package the attacker hands to victims, so being detected under the same family name is natural. The original 2013–2014 CryptoLocker is also known to have encrypted files and then decrypted them from the same window once the ransom was paid.

So the thing to examine here is the recorded behaviour, not the label. MLRan may well be right to call this CryptoLocker. The point is that the detector only sees 120 seconds of behaviour.

## 7. What CryptoLocker lets me say {#cl-claim}

| Finding | Label | Level |
| --- | --- | --- |
| The feature that lowered LightGBM's score most is the `ole32.dll` load (SHAP −1.13, 67% of negative attribution) | M | Confirmed |
| Most of the 15 REG/SYS/FILE features with value 1 relate to window and input-method initialisation | D | Confirmed |
| Among the 483 selected features, `NtWriteFile`, DIR and DROP are all 0 | D | Confirmed (feature scope) |
| Choosing "Yes" in the decryption window's confirmation creates the processing thread (`FUN_00415500`) | S | Confirmed |
| The thread leads to drive enumeration; how file contents are changed is unconfirmed | S | Confirmed / unconfirmed |
| The run may not have passed the confirmation within 120 s | S·D | Hypothesis |

Put together, these observations suggest one interpretation: the sample sat at the confirmation dialog for 120 seconds without reaching file processing, the record came out looking like an ordinary GUI program, and LightGBM judged that record benign.

The thesis keeps that as a hypothesis. I didn't check screenshots or raw logs to see whether it waited at the dialog. M is computed on features from D, so their agreement isn't two independent pieces of evidence. And a decryption window alone doesn't make the file a decryptor or benign software.

What the evidence supports is that there may be a mismatch between this sample's family label and the behaviour MLRan recorded. It doesn't support concluding the label is wrong. Chapter 4 notes that criterion (2), starting from the lowest-scored FN, may surface samples like this first.

## 8. HYFLOCK: a Go loader {#hy-loader}

The HYFLOCK carrier was obtained privately and is a case from outside the dataset. Its hashes and per-engine detections are in [HYFLOCK (1)]({{ '/en/research/hyflock-01/' | relative_url }}).

| Item | Value |
| --- | --- |
| SHA-256 | `b15482d0846ef997f9c049e77d85efeba4ab9b33550b4384052efeb1a3dcc8cc` |
| Size | 3,851,808 bytes |
| Architecture | x64 |
| Sections | 6; file entropy 6.37, max section 6.16 |
| Imported functions | 39 |

With a maximum section entropy of 6.16, it didn't look like an encrypted payload was hiding inside a section. So I started by looking for where the payload was attached.

What Ghidra showed:

- The Go source path `/tmp/hyflock-loader-689098328/stub.go` survives. It suggests the builder used the name `hyflock-loader`, but strings can be faked, so I didn't use it to assign the family.
- `main.main` prints a message and exits if `main.findPayload` fails, and otherwise moves on to `main.dropAndExec`. It's a loader that finds a payload appended to the file, writes it to a temporary file and runs it.

## 9. HYFLOCK: the last 16 bytes {#hy-footer}

If `main.findPayload` looks for the payload at the end of the file, that format should actually be there. Inside the VM I read the last 16 bytes with PowerShell.

```text
===== HYFLOCK FINAL CHECK =====
Tail HEX          : 4859464C434B30330000000000224A10
Magic             : HYFLCK03
Magic valid       : True
Payload size      : 2247184
Payload offset    : 1604608
Overlay size      : 2247200
Within overlay    : True
Exact size match  : True
```

The first 8 bytes are ASCII `HYFLCK03`; the last 8 are big-endian `0x224A10` = 2,247,184. The arithmetic:

```text
2,247,184 (payload) + 16 (footer)      = 2,247,200 = overlay after the carrier's last section
3,851,808 − 16 − 2,247,184             = 1,604,608 = payload start = end of last section's raw data
```

That confirms at byte level that data in the format the loader reads is attached to the end of the file.

Then I read the first two bytes at the payload offset.

```text
HEX: 4D-5A
MZ 발견!
```

The attached data starts with `MZ`, has a PE signature, and shows Rust traces.

<figure><a href="{{ '/assets/images/hyflock-layout.svg' | relative_url }}"><img src="{{ '/assets/images/hyflock-layout.svg' | relative_url }}" alt="Byte layout of the HYFLOCK carrier: Go loader 1,604,608 bytes, embedded PE 2,222,592 bytes, 24,592 bytes left over, 16-byte footer" loading="lazy"></a><figcaption>Byte layout of the HYFLOCK carrier. The last two blocks are drawn larger than scale.</figcaption></figure>

Computing the embedded PE's end from its section table puts it at 2,222,592 bytes from the payload start. The payload is 2,247,184 bytes long, so 24,592 bytes remain after the PE's section end. The PowerShell output "Bytes after estimated PE end: 24608" includes the 16-byte footer.

## 10. The hash that didn't match the report {#hy-hash}

At first the manuscript said that, since Check Point's blog post gave no hashes, I couldn't confirm which build this sample was. Later I looked at the PDF report the blog links to, and the IOC table on page 18 lists all the hashes. My sample's SHA-256 is there as "October Go carrier". I deleted the earlier sentence and replaced it with the listing.

Page 9 of the report describes the Go carrier as holding a Rust ransomware PE and a 16-byte `HYFLCK03` footer, writing the payload to a temporary executable and running it. That matches the structure I saw in the bytes. The footer's field layout (8-byte marker + 8-byte length) isn't in the report; that part is my own check.

Something didn't match. The report gives two hashes for the inner payload: the "October exact child", and a "Footer-retaining artifact" that keeps the 16-byte footer. I hashed only the 2,222,592-byte region up to the PE's section end, and that hash matched neither.

The report doesn't give either file's size or its range inside the carrier. There's no reason to think my region covers the same range as either file, so a different hash isn't a contradiction with the report. The report says the configuration sits relative to the end of the file, so the remaining 24,592 bytes could be configuration, but that's a guess. I haven't yet hashed exactly 2,247,184 bytes from offset 1,604,608 to compare.

I haven't confirmed anything about encryption myself. The `BCryptGenRandom` I found is also used by the Rust standard library, so I didn't count it. AES in counter mode, the 4,096-bit RSA public key and encryption confirmed in early October artefacts are all Check Point's findings, recorded in the thesis only as R-labelled report findings.

## 11. Why HYFLOCK has no model score {#hy-no-score}

To score HYFLOCK with LR or LightGBM, it would have to be run under the same conditions as MLRan (Cuckoo, Windows 7, 120 seconds) to produce features in the same format. The safety rule for this thesis is not to execute samples, and doing this properly needs an approved sandbox.

So HYFLOCK has no probability and no SHAP, and is used only to compare static findings with the public report. Running newer samples from outside MLRan under the same conditions and scoring them is left for later research.

## 12. Revising the manuscript {#revisions}

The manuscript is at v14. There's a seven-page limit, and the Korean, English and Japanese versions were kept in step. The Calipso analysis and the goodware-by-category split were cut from the body for space.

Where the strength of a claim changed, early and final wording side by side:

| Topic | Early draft | Final manuscript |
| --- | --- | --- |
| CryptoLocker | Evidence from three labels points the same way, so this FN is a case where the record had almost no ransomware behaviour | M comes from D, so they aren't two independent pieces of evidence. Stopping at the dialog is a hypothesis |
| LightGBM drop | Better read as threshold sensitivity than as a limit of family generalisation | Under the fixed condition it did miss unseen families. The narrow output range is one mechanism |
| LR result | May be an upper bound because of feature selection (before reselection) | Still in the 97% range after reselection, so both explanations remain possible. The drop can't all be put down to leakage |
| 465-sample comparison | Separating families lowered recall | A post hoc comparison added after seeing fold means. The difference reflects the whole protocol |
| RQ2 tests | Support H2 | Exploratory, not pre-registered. FNs having less attribution is expected by definition |
| HYFLOCK | The report has no hashes, so the build couldn't be confirmed | The same SHA-256 is listed in appendix p. 18 |
| HYFLOCK encryption | Labelled as third-party dynamic evidence (D) | Labelled separately as unverified report findings (R) |
| Prior work | – | Applying family-disjoint evaluation to MLRan is not new in itself (Nti) |

I pulled every number in the manuscript into a table and checked its source: whether it matches the original paper, whether the arithmetic holds (for example 451/465 = 97.0%, and 465 − 451 = 14 = the 14 Akira samples), and whether a result file confirms it. Values not stated directly, such as LightGBM's time-ordered confusion matrix, were back-calculated from recall and FPR to check consistency.

## 13. What's left {#next}

Future work listed in chapter 5:

- Check from raw Cuckoo records whether the CryptoLocker sample stopped at the confirmation dialog
- Hash the HYFLOCK embedded payload over the same range as the report and compare
- Confidence intervals and effect sizes for family-level paired differences
- Compare failed samples with training-family samples on the same criteria
- Obtain Shodi samples and repeat the analysis
- Repeat the evaluation keeping both time order and family separation, and on file-I/O-level data such as DEFEAT's

References: [Check Point, HYFLOCK – From Underground Recruitment to Public Extortion (PDF)](https://checkpoint.cyberint.com/hubfs/HYFLOCK%20-%20From%20Underground%20Recruitment%20to%20Public%20Extortion.pdf) · [Check Point blog](https://blog.checkpoint.com/security/hyflock-ransomware-evolves-with-new-builds-and-encryption-weaknesses/) · [VirusTotal (HYFLOCK carrier)](https://www.virustotal.com/gui/file/b15482d0846ef997f9c049e77d85efeba4ab9b33550b4384052efeb1a3dcc8cc) · [MLRan paper (arXiv:2505.18613)](https://arxiv.org/abs/2505.18613)
