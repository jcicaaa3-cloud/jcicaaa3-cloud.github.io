---
layout: page
lang: ja
title: Financial Risk Scoring
permalink: /ja/projects/financial-risk/
description: "合成した四半期財務データを使うML API：入力チェック、時系列順の評価、FastAPIでの予測"
---
四半期の財務データから次の四半期のリスクの兆候を予測するサンプルサービスです。PythonとFastAPIで作り、データは合成データを使いました。コードは[GitHub](https://github.com/jcicaaa3-cloud/financial-risk-scoring-service-FINAL)にあります。

## 構成

1. データ契約：必須のCSV列、型、欠損値のチェック
2. 特徴量：企業×四半期のパネル整理、財務比率と前期比の変化
3. 評価：時系列順の分割、walk-forward（後の四半期の情報が学習に混ざらないように）
4. モデル比較：Dummy、Logistic Regression、Random Forest
5. サービス：FastAPIでの単件・バッチ予測、結果パケット、モニタリングレポート

WebデモはFastAPIのバックエンドではなく、別のサンプルロジックで動いています。

[← プロジェクト]({{ '/ja/projects/' | relative_url }})
