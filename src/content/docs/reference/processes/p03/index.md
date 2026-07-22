---
title: P03 計画・作業準備
description: 計画・作業準備の開始、判断、成果物、接続を確認します。
sourceFile: docs/04_mappings/business-process-map.md
sourceVersion: v0.1
contentStatus: 原本から自動生成
generated: true
editUrl: https://github.com/tsumasaki-kurageya/property-management-pdm/blob/main/docs/04_mappings/business-process-map.md
---

:::note[このページの位置づけ]
分析用原本から自動生成した表示用ページです。内容を変更するときは[原本](https://github.com/tsumasaki-kurageya/property-management-pdm/blob/main/docs/04_mappings/business-process-map.md)を更新してください。最終生成確認日：2026-07-23。
:::
# P03 計画・作業準備

| 順序 | 業務ID | 活動・判断 | 主な成果物 | 接続 |
|---:|---|---|---|---|
| 1 | BM-04-01、BM-06-02・04、BM-07-01、BM-09-01、BM-11-01 | 契約周期、法定期限、設備・清掃・警備条件から年間計画を作る | 年間計画 | 2 |
| 2 | BM-04-02、03 | 月間、週間、日次へ具体化する | 月間・日次計画 | 3 |
| 3 | BM-04-04〜06、BM-05-04 | 日程、担当、シフト、協力会社を確定する | 作業割当、作業依頼 | 4 |
| 4 | BM-15-02、04〜08 | 資材、部品、工具、計測器、校正状態を確認・手配する | 払出・発注・準備記録 | 5 |
| 5 | BM-04-07、08、BM-12-08 | 作業前連絡、入館・作業申請、利用者周知を行う | 承認済み申請、周知記録 | 6 |
| 6 | BM-17-06、11 | 危険を評価し、必要な作業区域と安全対策を設定する | 作業開始条件、安全対策 | 実施可否判断 |
| 7 | BM-04-09、10 | 実施不能、遅延又は未実施を再計画する | 変更計画、未実施理由 | 2又はP05 |

準備と安全条件が成立した作業だけをP04へ渡す。法定期限に影響する未実施はP08、顧客影響を伴う変更はP07にも接続する。

[12横断プロセスへ戻る](../) · [流れを本文で学ぶ](/overview/business-lifecycle/)
