---
title: 上位業務とBM業務の接続マップ
description: OWN・AM・PM・FMの業務領域とBM-01〜BM-18を、接続種別・強度・引渡し情報から調べるリファレンスです。
---

:::note[このページの位置づけ]
学習用本文では代表接続だけを扱います。このページは、分析正本 `docs/management-structure/management-to-bm-map.md` を参照するためのリファレンス入口です。
:::

## 接続モデル

| 属性 | 内容 |
|---|---|
| 接続元・接続先 | `OWN-xx`、`AM-xx`、`PM-xx`、`FM-xx`、`BM-xx`、必要な詳細BM業務ID |
| 接続種別 | `requires`、`constrains`、`approves`、`executes`、`reports`、`informs-decision`、`aggregates-to-kpi` |
| 接続強度 | 直接接続、条件付き接続、間接接続、通常は接続しない |
| 引渡し情報 | 要求、方針、予算、制約、承認、実績、状態、費用、異常、リスク |
| 接続条件 | 所有・利用形態、契約、金額、法令、異常状態等 |

## BM-01〜BM-18の主な上位接続

| BM領域 | 主な上位接続元 | 主な結果受領先 |
|---|---|---|
| BM-01 営業・提案 | OWN-06、AM-06、PM-06、FM-06 | PM-06、FM-06、AM-06 |
| BM-02 契約管理 | OWN-06、AM-01・04・06、PM-02・04〜06、FM-01・06 | PM-04〜06、FM-01・06、AM-03・04・06 |
| BM-03 業務立ち上げ | AM-02、PM-05・06、FM-01・02・07 | PM-05・08、FM-01・04・07、AM-02 |
| BM-04 計画・スケジュール管理 | OWN-03、AM-01・04、PM-03〜05・07、FM-01〜05・07 | PM-05・08、FM-04・05・07、AM-04 |
| BM-05 人員・協力会社管理 | OWN-06、AM-06、PM-06、FM-06・07 | PM-06・08、FM-06・07、AM-06 |
| BM-06 清掃管理 | PM-01・03・05、FM-03・04 | PM-03・05・08、FM-04 |
| BM-07 衛生管理 | OWN-04、PM-05、FM-04・05・07・08 | PM-08、FM-04・05・07、OWN-04 |
| BM-08 設備運転管理 | PM-05、FM-03・05・07・08、AM-07 | PM-05・08、FM-05・07・08、AM-07 |
| BM-09 点検・保守管理 | OWN-04、AM-02・04・07、PM-05・07、FM-05・07 | PM-07・08、FM-05・07、AM-04・07、OWN-04 |
| BM-10 不具合・修繕管理 | OWN-02〜05、AM-02・04・05・07・08、PM-04・05・07、FM-05・07・08 | PM-07・08、FM-05・07、AM-04・05・07、OWN-03〜05 |
| BM-11 警備・防災管理 | OWN-04、AM-07、PM-03・05、FM-04・07 | PM-05・08、FM-04・07、AM-07、OWN-04 |
| BM-12 テナント・顧客対応 | PM-01〜03・05、FM-03・04 | PM-03・05・08、FM-04 |
| BM-13 作業結果・報告管理 | OWN-06、AM-06、PM-05〜08、FM-01・04・07 | PM-06・08、FM-01・04・07、AM-06、OWN-06 |
| BM-14 建物・設備情報管理 | OWN-02・05、AM-02・05・08、PM-05・07・08、FM-02・03・05・08 | PM-07・08、FM-02・05・08、AM-02・05・08、OWN-05 |
| BM-15 資材・在庫・購買管理 | PM-05・06、FM-06〜08 | PM-06、FM-06・07、BM内部管理 |
| BM-16 売上・請求・原価管理 | OWN-03、AM-03・04、PM-04・06、FM-06 | PM-04・06、FM-06、AM-03・04 |
| BM-17 品質・安全・法令管理 | OWN-04・06、AM-06・07、PM-05・06・08、FM-01・07 | 全上位役割 |
| BM-18 分析・改善・経営管理 | OWN-01・02・06、AM-01・03〜07、PM-04〜08、FM-01・02・04〜08 | OWN-01・02・06、AM-01・03〜07、PM-04〜08、FM-01・04〜08 |

## 調べ方

1. 上位の目的や業務領域を[所有・運営・維持管理の業務構造](../../management-structure/)で確認します。
2. 上表から関係するBM領域を特定します。
3. 詳細業務は[18領域・181業務](../business-catalog/)で確認します。
4. 接続ID、条件ID、引渡し情報、根拠は[分析正本](https://github.com/tsumasaki-kurageya/property-management-pdm/blob/main/docs/management-structure/management-to-bm-map.md)で確認します。

## 関連ページ

- [上位要求からBM業務への接続](../../management-structure/connections/requirements-to-bm/)
- [BM実績から上位判断へのフィードバック](../../management-structure/connections/bm-feedback-to-management/)
- [代表シナリオ](../../management-structure/scenarios/)
