---
title: P07 顧客依頼・苦情対応
description: 顧客依頼・苦情対応の開始、判断、成果物、接続を確認します。
sourceFile: docs/04_mappings/business-process-map.md
sourceVersion: v0.1
contentStatus: 原本から自動生成
generated: true
editUrl: https://github.com/tsumasaki-kurageya/property-management-pdm/blob/main/docs/04_mappings/business-process-map.md
---

:::note[このページの位置づけ]
分析用原本から自動生成した表示用ページです。内容を変更するときは[原本](https://github.com/tsumasaki-kurageya/property-management-pdm/blob/main/docs/04_mappings/business-process-map.md)を更新してください。最終生成確認日：2026-07-23。
:::
# P07 顧客依頼・苦情対応

| 順序 | 業務ID | 活動・判断 | 主な成果物 | 接続 |
|---:|---|---|---|---|
| 1 | BM-12-01〜03 | 問い合わせ、作業依頼又は苦情を受け付ける | 受付記録 | 2 |
| 2 | BM-12-04、09 | 内容、緊急度、SLA、契約範囲を確認する | 分類、優先度、期限 | 3 |
| 3 | BM-12-05 | 責任を持つ担当又は窓口へ割り当てる | 担当・期限 | 4 |
| 4 | BM-12-06 | 受付、予定、遅延等の状況を連絡する | 状況連絡記録 | 対応経路 |
| 5 | 対応内容による | 計画作業はP03、現場作業はP04、不具合はP06、苦情・品質不良はP09へ渡す | 各プロセスの結果 | 6 |
| 6 | BM-12-07 | 対応結果、残課題、次の行動を報告する | 完了・継続回答 | 7 |
| 7 | BM-12-10 | 満足度・再発・未解決を確認する | 評価結果 | 完了又はP09・P11 |

受付完了、担当割当、現場対応、顧客回答及び案件完了を別状態として扱う。

[12横断プロセスへ戻る](../) · [流れを本文で学ぶ](/overview/business-lifecycle/)
