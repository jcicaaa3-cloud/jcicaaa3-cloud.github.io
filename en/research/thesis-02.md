---
layout: post
lang: en
title: "Thesis notes (2): reproducing MLRan, family-disjoint evaluation, feature reselection, SHAP"
date: 2026-11-15 14:10:00 +0900
kind: thesis
permalink: /en/research/thesis-02/
description: "Reproducing the MLRan LR and LightGBM baselines, five-fold family-disjoint cross-validation, a paired comparison on 465 samples, per-fold RFE reselection, TP vs FN SHAP, and what I fixed along the way"
---
These are the experiments for RQ1 and RQ2 from [part 1]({{ '/en/research/thesis-01/' | relative_url }}). Everything here uses only the feature vectors MLRan published, and I ran it all on my own PC.

1. [Changing topic and setting the questions]({{ '/en/research/thesis-01/' | relative_url }})
2. **Reproducing MLRan, family-disjoint evaluation, feature reselection, SHAP** (this post)
3. [Reversing the missed samples, and revising the manuscript]({{ '/en/research/thesis-03/' | relative_url }})

| Experiment | Status |
| --- | --- |
| Reproduction on the public split (LR, LightGBM) | Done; matches published accuracy to two decimals |
| Family-disjoint 5-fold CV, published 483 features | Done |
| Family-disjoint 5-fold CV, features reselected per fold | Done |
| Leave-one-family-out (Shodi, Clop, Delshad) | Done |
| SHAP (published 483 features) | Done |
| SHAP for the reselection condition; TN and FP groups | Not done |

**Contents**

1. [Preparing the experiment code](#code)
2. [Reproducing the public split](#reproduction)
3. [Building family-disjoint folds](#folds)
4. [Overall results](#overall)
5. [Comparing the same 465 samples](#paired)
6. [Families where the drop concentrated](#families)
7. [Why 52 MBRLock samples got the same score](#mbrlock)
8. [Test data inside feature selection](#leakage)
9. [Reselecting features per fold](#reselect)
10. [SHAP: detected vs missed](#shap)
11. [The features each model leaned on](#top-features)
12. [What I didn't do](#not-done)

## 1. Preparing the experiment code {#code}

The experiments have four stages.

| Stage | What it does |
| --- | --- |
| Integrity check | Sample and family counts, SHA-256 duplicates, check against the split files |
| Baseline | Retrain LR and LightGBM on the public split |
| Family-disjoint | Five-fold CV, leave-one-family-out |
| SHAP | SHAP for every test-fold sample, category aggregation, tests |

Results went into a `results` folder: prediction files (with fold assignments), per-family recall, raw SHAP values and a summary JSON. Later, when checking the numbers in the manuscript, these files were the reference.

Before feeding in real data, I ran the whole pipeline on synthetic data. One problem came out of that. The function that assigns features to categories by name prefix didn't recognise `DIRECTORY:`, the prefix the real data uses for directory features, so the pipeline would stop at the category step on real data. The existing synthetic tests only checked the shape of the result dictionaries and missed it. I rewrote the tests to run from model training through to the output files, fixed the prefix handling, and then moved to the real data.

The integrity check turned up something else: some family labels can be generic names such as `trojan-ransom` rather than real family names, so I went through the family list by hand before building folds.

## 2. Reproducing the public split {#reproduction}

Following the public notebook, hyperparameters were chosen by grid search with three-fold CV and ROC AUC as the criterion. I fixed the acceptance rule in advance: within ±1 point of the published accuracy.

| Model | Published accuracy | Reproduced | TP | FN | FP | TN |
| --- | --- | --- | --- | --- | --- | --- |
| LR | 98.15% | 98.15% | 459 | 6 | 12 | 498 |
| LightGBM | 94.05% | 94.05% | 434 | 31 | 27 | 483 |

Both matched to two decimal places. LR's 6 FNs and 12 FPs also match the counts in the paper's misclassification analysis. I only checked that the counts match, not whether the same samples were misclassified.

## 3. Building family-disjoint folds {#folds}

Ransomware was grouped by family and split into five folds. All samples of a family land in the same fold, so no family appears in both training and test.

Things I had to decide:

- **Family sizes**: families range from 5 to 134 samples, so I balanced per-fold sample counts and the shares of the four types (crypto, modern, RaaS, locker) as far as possible. With only four locker families, not every fold could get one.
- **Goodware**: it has no families, so it was assigned at random with a fixed seed. It wasn't grouped by vendor or program, so different versions of the same program may sit in training and test. That's listed as a limitation.
- **Duplicates**: four pairs share a SHA-256; I kept one of each, leaving 4,876 samples (2,326 ransomware). 1,614 samples have a feature vector identical to some other sample; they are different files, so I kept them.
- **Hyperparameters**: searched only within the outer training data, with inner CV also split by family.

Shodi, Clop and Delshad, which had FNs in the original study, were also each held out of training entirely in a separate run.

The decision threshold is 0.5. Metrics are balanced accuracy, ransomware recall, the false positive rate (FPR) on goodware, F1 and per-family recall. CV results are reported two ways: the mean ± SD of per-fold values, and pooled recall computed once over all 2,326 ransomware samples from the five test folds' predictions. Pooled recall carries a 95% confidence interval from a bootstrap that resamples families.

## 4. Overall results {#overall}

| Model | Condition | Evaluated (ransomware/goodware) | Recall (fold mean) | Pooled recall (95% CI) | FPR |
| --- | --- | --- | --- | --- | --- |
| LR | Time-ordered 80:20 | 465 / 510 | 98.71 | – | 2.35 |
| LR | Family-disjoint, published 483 | 2,326 / 2,550 | 98.34 ± 0.88 | 98.28 (97.10–99.26) | 0.86 ± 0.41 |
| LR | Family-disjoint, reselected per fold | 2,326 / 2,550 | 97.40 ± 1.55 | – | 1.22 ± 0.54 |
| LightGBM | Time-ordered 80:20 | 465 / 510 | 93.33 | – | 5.29 |
| LightGBM | Family-disjoint, published 483 | 2,326 / 2,550 | 92.72 ± 5.74 | 92.39 (87.07–96.19) | 2.59 ± 1.29 |
| LightGBM | Family-disjoint, reselected per fold | 2,326 / 2,550 | 92.04 ± 6.65 | – | 2.90 ± 1.02 |

All values in %. Time-ordered rows are a single split; family-disjoint rows are mean ± SD over five folds.

When I first saw this table, LR had barely moved: 98.71 to 98.34. LightGBM's mean dropped a little, but its fold SD was 5.74 points, so results swung widely depending on which families landed in the test fold.

The rows can't simply be subtracted. The time-ordered rows cover 465 samples and the family-disjoint rows 2,326. The lower FPR under family-disjoint evaluation may have the same cause: the recent goodware that the original study misclassified most is concentrated in the time-ordered test set. I didn't count the original test goodware separately, so the thesis states this as a hypothesis.

## 5. Comparing the same 465 samples {#paired}

The means hid the difference, so I looked for a way to compare like with like. The 465 ransomware samples in the original test set each fall into some test fold in family-disjoint CV and get a prediction there. That puts the same 465 samples side by side under both protocols.

| Model | Time-ordered 80:20 | Family-disjoint, published 483 | Family-disjoint, reselected | McNemar p (time-ordered vs published 483) |
| --- | --- | --- | --- | --- |
| LR | 459 (98.71%) | 452 (97.20%) | 450 (96.77%) | 0.016 |
| LightGBM | 434 (93.33%) | 391 (84.09%) | 373 (80.22%) | < 0.001 |

LightGBM missed 43 more of the 465. Detection of the same samples was compared with an exact McNemar test; since only positives are involved, this tests the difference in recall.

I added this comparison after seeing the fold means, so the thesis calls it post hoc. The 465 samples are also the newest 20% in time order, so the size of the drop can't be extended to ransomware in general.

One more caution. The two protocols differ in more than family overlap. Training folds in family-disjoint CV include samples newer than the test fold, and the training set's composition and size, de-duplication and per-fold hyperparameters all change too. So the thesis describes the difference as the result of changing the whole protocol, not of family overlap alone.

## 6. Families where the drop concentrated {#families}

Grouping the missed samples by family showed they were concentrated.

- **LR**: no misses in 48 of 64 families. Even the lowest, Shodi, had 84.5% of its 71 samples detected.
- **LightGBM**: 30 families at 100%, but only 18.2% of MBRLock and 22.2% of Gimemo detected. Of 177 FNs, 54 were MBRLock and 25 Shodi.

That fits the "concentrated in a few families" part of H1.

Holding out one family entirely:

| Held-out family | Samples (original train/test) | FNs in original study | LR | LightGBM |
| --- | --- | --- | --- | --- |
| Shodi | 71 (24/47) | 4 | 84.5% (60/71) | 62.0% (44/71) |
| Clop | 29 (25/4) | 1 | 96.6% (28/29) | 96.6% (28/29) |
| Delshad | 11 (9/2) | 1 | 90.9% (10/11) | 90.9% (10/11) |

On just the 47 Shodi samples from the original test set, LR's detection rate went from 91.5% (43/47) on the time-ordered split to 78.7% (37/47) with Shodi held out. The time-ordered split had 24 Shodi samples in training while the hold-out run removed all 71, so the training sets differ.

I also counted test ransomware whose feature vector is identical to some training ransomware: 96 of 465 (20.6%) on the time-ordered split, 62 of 2,326 (2.7%) under family-disjoint CV. Test samples represented exactly like a training sample may account for part of the time-ordered split's high recall.

## 7. Why 52 MBRLock samples got the same score {#mbrlock}

LightGBM catching only 18% of MBRLock looked odd, so I opened the prediction file.

- Within the original study's search range (learning rate 0.01, at most 100 trees), LightGBM's output only spanned 0.16 to 0.82.
- 52 of the 66 MBRLock samples got exactly 0.475, just under the 0.5 threshold.
- LR detected all of MBRLock.
- Threshold-free ROC AUC was 0.999 for LR and 0.984 for LightGBM.

LightGBM ranked the two classes fairly well, but its narrow output range packed scores near the threshold, and cutting at 0.5 turned them into a pile of FNs.

I rewrote how to describe this several times. An early draft said it was better read as threshold sensitivity than as a limit of family generalisation. But under the fixed operating condition (threshold 0.5), the model did miss families absent from training. The narrow output range is one mechanism behind the drop, not a reason to dismiss it. The final manuscript says this doesn't make the drop any less of a generalisation problem. I didn't re-tune the threshold; if I did, it would have to be set within the training folds, not on the test folds.

## 8. Test data inside feature selection {#leakage}

Rereading the original paper, I found something that bothered me. RFE itself ran on training data, but the number of features to keep, 483 (2% of the total), was chosen at **the point where balanced accuracy on the test data peaked**. Apart from the public split being time-ordered, the feature-selection step contains information from the test data.

My family-disjoint evaluation has the same issue. The outer test folds include samples from the original training set, and the published 483 features were chosen using those samples' labels. So there were two possible explanations for LR barely dropping: the 483 features capture traces shared across families, or test-fold information got into feature selection.

## 9. Reselecting features per fold {#reselect}

To try to separate those, I added a second condition: start from the 24,162 features left after mutual-information filtering on Zenodo, and rerun RFE in each outer training fold to pick 483. The outer test fold is never used by RFE.

I expected this to take a very long time. The script I'd run earlier also redid RFE inside the inner tuning folds, which multiplies RFE runs by 5 outer × 3 inner × grid combinations. I budgeted five to six hours for the worst case. The run was changed like this:

- RFE runs only in the outer folds. The aim is to keep outer test-fold information out of feature selection, which this achieves, and it matches the method section.
- In scikit-learn, `step=0.1` removes 10% of the initial feature count per step, so it's about 10 refits per fold. I first miscalculated it as about 37 and corrected it.
- Fold assignments were read from the earlier fixed-483 prediction file, so both conditions use the same folds.
- Results are saved after each fold, and a restart resumes from the next fold.
- A `test` mode runs fold 0 alone to estimate the total time.
- The PC is kept from sleeping during the run. The Zenodo files are about 236 MB, and memory use is around 2–3 GB.

The results are also in the "reselected" column of the table in [section 5](#paired). Performance dropped again.

- LR's fold-mean recall went from 98.34% to 97.40%.
- On the same folds, 26 ransomware samples were detected only with the fixed 483 and 3 only with reselection; the McNemar p from these discordant pairs was below 0.001.
- On the 465 samples, detections went 452 → 450 for LR and 391 → 373 for LightGBM.
- LightGBM's Shodi recall fell from 64.8% to 40.8%.
- Mean Jaccard similarity between each fold's reselected 483 and the published 483 was 0.56. Nearly half the features were different.

Applying Holm's correction to the three McNemar tests in this section doesn't change any decision at the 0.05 level; the largest, LR time-ordered vs published 483, is still 0.016 after correction.

Even after reselection, LR stayed in the 97% range on average, so I couldn't decide between the two explanations. Reselection narrows the path for information and also changes the feature set itself, so the whole drop can't be attributed to leakage.

Three dependencies remain in the second condition.

1. The mutual-information step that chose the 24,162 features wasn't redone, and the paper doesn't say which samples it used.
2. The target of 483 features is the original study's choice.
3. RFE ran once on the whole outer training fold before inner CV, so the inner validation folds' labels are in feature selection. Inner CV scores may be optimistic.

That's why the thesis calls the comparison a sensitivity analysis of feature-selection conditions, not a leakage-removal experiment.

## 10. SHAP: detected vs missed {#shap}

SHAP was computed for every test-fold sample under the family-disjoint, published-483 condition. LR used linear SHAP and LightGBM used TreeSHAP, with baselines from each fold's training data. Positive values push towards ransomware and negative towards benign. The two models' output scales aren't assumed to be comparable, so SHAP magnitudes aren't compared across models.

Comparing 483 features one by one wasn't practical, so I grouped them into nine categories and computed two values per category.

- **Absolute SHAP share**: the category's share of each sample's sum of absolute SHAP values, i.e. its weight in the explanation.
- **Signed sum**: which way the category moved the score.

Shares add up to 100%, so one category growing means others shrink, and the per-category tests aren't independent; the thesis notes this. TP vs FN differences were tested with Mann–Whitney U and Holm's correction.

One thing to state up front: an FN is by definition ransomware scored below the threshold, and a sample's SHAP values sum to the gap between its score and the baseline. So FNs having less attribution towards ransomware than TPs is expected. What this analysis can show is where, and in what form, that gap appears.

| Category | Features | LR TP | LR FN | LR corrected p | LightGBM TP | LightGBM FN | LightGBM corrected p |
| --- | --- | --- | --- | --- | --- | --- | --- |
| API | 63 | 22.6 | 21.4 | 0.033 | 12.5 | 15.9 | < 0.001 |
| REG | 90 | 17.3 | 18.3 | 0.089 | 13.1 | 11.4 | < 0.001 |
| FILE | 16 | 2.3 | 2.2 | 1.00 | 0.2 | 0.1 | 0.96 |
| DIR | 10 | 1.3 | 1.6 | < 0.001 | 0.7 | 0.6 | < 0.001 |
| STR | 223 | 38.4 | 39.5 | 1.00 | 23.8 | 31.9 | < 0.001 |
| SYS | 38 | 8.6 | 8.8 | 1.00 | 47.5 | 38.0 | < 0.001 |
| DROP | 23 | 2.7 | 2.9 | 1.00 | 1.0 | 0.7 | < 0.001 |
| SIG | 20 | 6.9 | 5.2 | < 0.001 | 1.1 | 1.3 | < 0.001 |

Absolute SHAP shares in %; NET has no features and is omitted. Group sizes: LR TP 2,286 and FN 40; LightGBM TP 2,149 and FN 177.

By share, LR's TPs and FNs look almost the same. The difference shows up in the signed sums.

| | LR TP | LR FN | LightGBM TP | LightGBM FN |
| --- | --- | --- | --- | --- |
| Median STR sum | +3.02 | **−1.19** | +0.15 | +0.02 |
| Median REG sum | +1.39 | +1.19 | −0.04 | −0.04 |

In more than half of LR's missed samples, string features pulled the score towards benign. The string category had about the same share in FNs as in TPs (39.5% vs 38.4%) but pointed the other way. LightGBM's FNs were also lower (p < 0.001), but the sign stayed positive. REG was significant for both models, yet the median difference was small for LR and absent for LightGBM.

So STR matched the direction of H2 for both models, and only LR's median actually flipped negative. The LightGBM result may be heavily driven by MBRLock, which is 54 of its 177 FNs.

The original FILE/DIR hypothesis didn't hold. FILE showed no significant difference for either model after correction, and DIR was slightly higher in LR's FNs than TPs (1.6% vs 1.3%). FILE has only 16 features, so I didn't read "no significant difference" as evidence of no difference.

## 11. The features each model leaned on {#top-features}

Looking at individual features, the two models relied on completely different things.

**LR: the DOS stub**

LR's largest mean absolute attribution came from the string `!this program cannot be run in dos mode.`, which was also top in the original study's SHAP analysis. It's the DOS stub found in almost every Windows PE executable, yet in the data it was recorded for only 89% of TPs and 39% of TNs.

A phrase almost every executable has, present in only 39% of goodware, is strange. Non-executable samples may be mixed in, some executables may have a different stub, or string extraction may have differed. I didn't check which. In any case the feature may carry differences in how the dataset was built rather than ransomware behaviour, the kind of spurious correlation Arp et al. describe.

**LightGBM: loading ole32.dll**

LightGBM put 47.5% of its absolute attribution in TPs on the SYS category, mostly from a single record that `ole32.dll` was loaded. That feature is present in 91% of TNs and 11% of TPs, so it served as evidence for benign, and 77% of the FNs LightGBM missed had it. Whether this is a real behavioural difference between the classes can't be decided from M evidence alone. This feature comes back in the CryptoLocker case in [part 3]({{ '/en/research/thesis-03/' | relative_url }}).

The draft also reported agreement of the top-20 feature ranks across folds (Kendall's τ): 0.20 for LR and 0.25 for LightGBM, low enough that interpretations based on individual ranks are shaky. It was cut from the final manuscript to fit seven pages.

## 12. What I didn't do {#not-done}

- SHAP for the reselection condition
- SHAP comparisons for the TN and FP groups
- Whether the SHAP differences hold in every fold, or only in certain families
- Re-tuning the threshold within the training folds
- An evaluation that keeps both time order and family separation
- Confidence intervals and effect sizes for family-level paired differences

McNemar and Mann–Whitney U treat samples as independent. Samples of the same family behave similarly, and one fold model predicts many samples at once, so they aren't really independent. With 54 of LightGBM's 177 FNs from one family, the p-values may be smaller than they should be. The thesis uses them only as supporting evidence of the direction of a difference within this data and setup.

The next post is about actually opening the missed samples. I couldn't get the Shodi samples I'd planned on, and ended up analysing one CryptoLocker sample and one HYFLOCK sample from outside the dataset.

References: [MLRan paper (arXiv:2505.18613)](https://arxiv.org/abs/2505.18613) · [MLRan GitHub](https://github.com/faithfulco/mlran) · [MLRan Zenodo](https://zenodo.org/records/23403681) · [TESSERACT (USENIX Security 2019)](https://www.usenix.org/conference/usenixsecurity19/presentation/pendlebury) · [Dos and Don'ts of ML in Computer Security (USENIX Security 2022)](https://www.usenix.org/conference/usenixsecurity22/presentation/arp)
