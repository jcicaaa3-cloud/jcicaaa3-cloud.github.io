---
layout: post
lang: en
title: "Thesis notes (1): changing topic and setting the questions"
date: 2026-11-15 14:00:00 +0900
kind: thesis
permalink: /en/research/thesis-01/
description: "Why I moved my graduation thesis from robot evaluation to ransomware detection, the family overlap in the public MLRan split, the research questions, the evidence labels and the analysis environment"
---
I'm writing my graduation thesis. The title is:

> **Investigating the Generalization and Failure Modes of Explainable AI-Based Ransomware Detection: Family-Disjoint Evaluation of MLRan Baselines with SHAP and Reverse-Engineering Evidence**

The manuscript is at v14, in Korean and English, and it hasn't been submitted yet. These three posts record how it came together.

1. **Changing topic and setting the questions** (this post)
2. [Reproducing MLRan, family-disjoint evaluation, feature reselection, SHAP]({{ '/en/research/thesis-02/' | relative_url }})
3. [Reversing the missed samples, and revising the manuscript]({{ '/en/research/thesis-03/' | relative_url }})

**Contents**

1. [Why I left robot evaluation](#from-robot)
2. [Opening samples first](#samples-first)
3. [MLRan and its public split](#mlran)
4. [Counting the split files](#overlap)
5. [Work that already exists](#prior)
6. [Research questions and hypotheses](#rq)
7. [Labelling the evidence](#evidence)
8. [Overall procedure](#procedure)
9. [Analysis environment and safety rules](#safety)

## 1. Why I left robot evaluation {#from-robot}

In the spring semester I worked on evaluating robot actions. I ran OpenVLA-OFT 80 times in LIBERO-Spatial and compared criteria for judging 874 events, such as grasps and placements, as successes or failures. When I changed the criteria and the ground-truth labels, F1 on the same records dropped from 0.9111 to 0.5970. The model hadn't changed; only the evaluation had.

On 28 October I submitted a thesis draft based on that work. In early November I decided to set it aside. Robot AI didn't look like it would lead anywhere for me after graduation, and the field I'd been interested in for much longer was malware. I emailed my supervisor to withdraw the draft and promised a new one within the week.

The topic changed, but the question carried over. The robot work was about how much the evaluation conditions move the result, and reading ransomware detection papers brought up the same thing: what samples were used to get that 98% detection rate?

## 2. Opening samples first {#samples-first}

Before settling the topic, I opened a few real ransomware samples. If I wanted to say what a detector misses, I thought I should be able to look inside the files it misses.

- **Calipso**: I summarised the public reports on 5 November and started static analysis in Ghidra on the 6th. It encrypts only the first 5 MB of each file with XChaCha20 and finds files on local NTFS drives by enumerating the MFT directly. The write-up is [Calipso analysis v2.0]({{ '/en/research/calipso-v2/' | relative_url }}).
- **HYFLOCK**: On 8 November I picked it as [the next target]({{ '/en/research/hyflock-preview/' | relative_url }}), and on 12 November I wrote down [its hashes and per-engine detections]({{ '/en/research/hyflock-01/' | relative_url }}). 28 of 67 engines on VirusTotal flagged it, and even the engines that called it ransomware disagreed on the name: Killav, Nishi, Qilin.

That naming disagreement later went into the limitations in chapter 4. Family labels in detection datasets are ultimately built on names like these. If one lineage is split across several names, a family-disjoint split isn't fully disjoint.

Around this time I emailed the professor of my security course for advice on the topic, and was told to use reverse engineering as a supporting check on detection results. RQ3 follows that advice.

Calipso was a sample I looked at before setting any selection criteria, so it was taken out of the final manuscript. Following a PE from scratch in Ghidra was still exactly the practice I needed for the CryptoLocker analysis in part 3.

## 3. MLRan and its public split {#mlran}

I chose MLRan, a public behavioural dataset published in 2026 in the Journal of Network and Computer Applications. Both code and data are public, so it can be rerun.

| Item | Details |
| --- | --- |
| Samples | 4,880 (2,330 ransomware, 2,550 goodware) |
| Ransomware families | 64 (32 crypto, 15 modern, 13 RaaS, 4 locker); 5–134 per family, median 28 |
| Period | 2006–2024 (ransomware 2008–2024) |
| Execution | Cuckoo Sandbox 2.0.7, Windows 7 guest, 120 s per sample |
| Features | 6,467,926 raw → 24,162 after mutual information → 483 after RFE, all binary |
| Categories of the 483 | STR 223, REG 90, API 63, SYS 38, DROP 23, SIG 20, FILE 16, DIR 10, NET 0 |
| Original split | 80:20 by first VirusTotal submission within each sample type; 3,905 train / 975 test |
| Original accuracy | LR 98.15% (best of five models), LightGBM 94.05% |

Per-family counts, per-category feature counts and split sizes are my own counts from the repository metadata and split files. Accuracies are from Table 6 of the arXiv version. I used the GitHub repository at commit `273fcac` and Zenodo record 23403681 without modification.

The original split works like this: samples are grouped by type, sorted within each type by first VirusTotal submission date, and the oldest 80% go to training and the newest 20% to testing. Time order holds within a type. Since the cut-off date can differ between types, a training sample of one type can still be newer than a test sample of another.

The paper doesn't evaluate a family-level split, and lists generalisation to unseen families as a limitation.

## 4. Counting the split files {#overlap}

I opened the public split files and counted which family each ransomware test sample belongs to.

| | Count |
| --- | --- |
| Ransomware test samples | 465 |
| Of which the same family also appears in training | 451 (97.0%) |
| Families that appear only in the test set | Akira only (14 samples) |

97 out of every 100 ransomware test samples were other samples of a family the model had already seen in training. The 98% figure mostly measures how well it recognises new samples of known families. The split says nothing about families absent from training.

In practice both happen: variants of known families arrive, and so do families nobody has seen. I wanted the two measured separately, and this count became the starting point of the thesis.

## 5. Work that already exists {#prior}

The problem of evaluation inflating results has been raised many times.

- Pendlebury et al. (TESSERACT, USENIX Security 2019) showed that splits ignoring time order and unrealistic class ratios inflate malware classifier performance.
- Arp et al. (USENIX Security 2022) listed data snooping, sampling bias and spurious correlations among common pitfalls of machine learning in security.
- Ju and Kim (IEEE Access 2025) showed that ransomware which reorders its I/O can evade existing behaviour-based detection.

I also found a paper that had already re-evaluated MLRan by family. Nti (Future Internet 2026) proposed a hierarchical sparse neural network on MLRan's 483 features and compared stratified, time-ordered, family-disjoint and open-set splits, with LR among the baselines. Since it overlapped with what I planned, I wrote down the differences.

- Nti's family split is a single 60:20:20 split over families with at least 10 samples. I ran five-fold cross-validation over all 64 families.
- Nti states that detailed error analysis, confidence intervals and hypothesis tests were not done. I followed the missed samples with SHAP and reverse engineering and tested the paired comparisons.

So the introduction says that applying family-disjoint evaluation to MLRan is not new in itself. What's new is on the error-analysis and statistics side.

The explanation side looked similar. The MLRan paper shows key indicators with SHAP and LIME and applies LIME to a few misclassified samples, but it doesn't compare attributions between correctly and wrongly classified groups. I decided not to build a new detector and to look at where and why the existing baselines fail.

## 6. Research questions and hypotheses {#rq}

| | Question |
| --- | --- |
| RQ1 | When two MLRan baselines are evaluated family-disjoint, how much does ransomware recall change compared with the time-ordered split? |
| RQ2 | Under family-disjoint evaluation, how do SHAP attributions differ by feature category between true positives (TP) and false negatives (FN)? |
| RQ3 | When failures are reverse-engineered statically, what agrees and what diverges between the feature representation and the binary's capabilities? |

Two hypotheses:

- **H1**: Separating families lowers ransomware recall compared with the time-ordered split, and the drop concentrates in a few families.
- **H2**: In FNs, the signed attribution sums of the string (STR) and registry (REG) categories lean less towards ransomware than in TPs.

H2 was first stated for the FILE and DIR categories. FILE and DIR together are only 26 of the 483 features (5.4%), while STR and REG are 313 (64.8%), so I switched, and the thesis also reports the original hypothesis. As H2 wasn't pre-registered, the RQ2 tests are presented as exploratory. Details in [part 2]({{ '/en/research/thesis-02/' | relative_url }}).

The baselines are LR and LightGBM. LR had the best accuracy in the original study. LightGBM was second-lowest of the five models, but as a tree model it allows exact SHAP values through TreeSHAP.

Failure cases for reverse engineering were defined before looking at results.

1. A sample from the family with the lowest family-disjoint recall
2. The FN given the highest probability of being benign
3. The FN whose category shares are furthest from the TP mean
4. One FP from 2023–2024 goodware (11 of the original study's 12 FPs come from that period)

In the end only part of this could be applied. That story is in [part 3]({{ '/en/research/thesis-03/' | relative_url }}).

## 7. Labelling the evidence {#evidence}

SHAP tells you which features the model used, not what the malware actually did. A capability found by reverse engineering is only known to exist in the binary; whether it ran during a 120-second execution is another matter. So every finding in the thesis carries a source label.

| Label | Source | Can show | Cannot show |
| --- | --- | --- | --- |
| S (static) | Ghidra, PE structure, byte checks | That the code or file structure contains the capability | That the capability runs |
| D (dynamic) | MLRan feature matrix, cited execution records | That a record appeared in one run | That it happens in every run or environment; behaviour not represented by features |
| M (model) | SHAP attributions | Which features the classifier used, and in which direction | What the malware actually did. Not independent of D |
| R (external report) | Cited third-party reports | Hash listings and findings stated by the report | My own re-verification; details the report doesn't give |

Each finding also gets a level.

- **Confirmed**: something I saw directly, such as bytes, code or feature values
- **Interpretation**: an explanation that fits several observations but wasn't checked directly
- **Hypothesis**: an explanation that needs further checking

Statements about why a failure happened never go above interpretation or hypothesis.

The table didn't start out like this. Early drafts had a rule that a claim could be made when evidence from two different labels pointed the same way. But M is computed on features extracted from D, so the two agreeing is close to automatic. Fixing that, I added "M is not independent of D" to the table and switched from counting evidence to giving each finding a level. R was split out later too. At first I labelled Check Point's dynamic findings as "D (third party)", but it wasn't right to put material I hadn't re-verified in the same column as my own observations.

## 8. Overall procedure {#procedure}

<figure><a href="{{ '/assets/images/thesis-procedure.webp' | relative_url }}"><img src="{{ '/assets/images/thesis-procedure.webp' | relative_url }}" alt="Research procedure: MLRan dataset, baseline models, acceptance check, family-disjoint evaluation, SHAP by outcome, picking failures, static RE check, evidence labels" loading="lazy"></a><figcaption>Figure 1 of the thesis. The top row is reproduction and re-evaluation (RQ1); the bottom row is explanation (RQ2, RQ3).</figcaption></figure>

1. Take the 4,880 MLRan samples (4,876 after de-duplication for cross-validation).
2. Retrain LR and LightGBM on the public split.
3. Accept the reproduction if accuracy is within ±1 point of the published value.
4. Re-evaluate with five-fold family-disjoint cross-validation and compare with the time-ordered split (RQ1).
5. Compare TP and FN SHAP attributions by category (RQ2).
6. Pick failure cases using the criteria in section 6.
7. Reverse-engineer the selected samples statically (RQ3).
8. Give every finding an S/D/M/R label and a level.

## 9. Analysis environment and safety rules {#safety}

The detection experiments only use the feature-vector CSVs published by MLRan. No malware files are involved, so I ran them on my everyday PC: Windows 11, Python 3.12.10, scikit-learn 1.6.1, LightGBM 4.6.0, random seed `20261113`.

Actual samples were handled only inside a Windows 11 virtual machine in VMware Workstation Pro.

- Network adapter and USB controller removed.
- Shared folders, clipboard sharing and drag and drop disabled.
- A snapshot taken before any sample went in.
- The analysis scripts run only if the sample's SHA-256 matches the expected value and there is no active network adapter (other than WAN Miniport) and no default route.
- The work was limited to PE parsing, string extraction, Ghidra 12.2 headless analysis and reading bytes with PowerShell. The two samples in the thesis were never executed.
- Only text and CSV results left the VM. Samples are referred to by SHA-256 only.

On 6 November I did run Calipso once in this VM ([Calipso (3)]({{ '/en/research/calipso-03/' | relative_url }})). That observation isn't used as evidence, and section 2.5 of the thesis says so.

The next post covers the experiments: reproducing the public split, family-disjoint evaluation, feature reselection and SHAP.

References: [MLRan paper (arXiv:2505.18613)](https://arxiv.org/abs/2505.18613) · [MLRan GitHub](https://github.com/faithfulco/mlran) · [MLRan Zenodo](https://zenodo.org/records/23403681) · [Nti (2026), Future Internet](https://doi.org/10.3390/fi18050273)
