# 現場作業手順―チェックリスト対応表

## 1. 目的

本書は、現場作業手順と実行用チェックリストの対応、版及び作成状況を管理する。判断基準、異常分岐及び権限は手順書を正とし、チェックリストは一回の実施事実と証跡を記録する。

## 2. 対応表

| 領域 | 手順 | 手順版 | チェックリスト | 帳票版 | 状態 |
|---|---|---:|---|---:|---|
| 共通 | [`PROC-COM-001` 勤務・担当引継ぎ](../02_field-procedures/00_common/PROC-COM-001_shift-handover.md) | 0.1 | 領域別チェックリストへ組込み（代表：`CHK-SEC-002`） | — | 領域別実装 |
| 共通 | [`PROC-COM-002` 作業前安全確認・危険予知](../02_field-procedures/00_common/PROC-COM-002_pre-work-safety-check.md) | 0.1 | `CHK-COM-001` 作業前確認 | 未作成 | 予定 |
| 清掃 | [`PROC-CLN-001` 共用部日常清掃](../02_field-procedures/01_cleaning/PROC-CLN-001_common-area-cleaning.md) | 0.1 | [`CHK-CLN-001` 共用部日常清掃](../03_checklists/01_cleaning/CHK-CLN-001_common-area-cleaning.md) | 0.1 | 草案あり |
| 清掃 | [`PROC-CLN-002` トイレ清掃](../02_field-procedures/01_cleaning/PROC-CLN-002_restroom-cleaning.md) | 0.1 | [`CHK-CLN-002` トイレ清掃](../03_checklists/01_cleaning/CHK-CLN-002_restroom-cleaning.md) | 0.1 | 草案あり |
| 設備 | [`PROC-EQP-002` 設備巡回点検](../02_field-procedures/02_equipment/PROC-EQP-002_routine-inspection.md) | 0.1 | [`CHK-EQP-001` 設備巡回点検](../03_checklists/02_equipment/CHK-EQP-001_routine-inspection.md) | 0.1 | 草案あり |
| 設備 | [`PROC-EQP-005` 警報・設備異常対応](../02_field-procedures/02_equipment/PROC-EQP-005_alarm-response.md) | 0.1 | [`CHK-EQP-002` 警報・設備異常対応](../03_checklists/02_equipment/CHK-EQP-002_alarm-response.md) | 0.1 | 草案あり |
| 警備 | [`PROC-SEC-001` 警備勤務開始・交代](../02_field-procedures/03_security/PROC-SEC-001_duty-start-and-handover.md) | 0.2 | [`CHK-SEC-002` 警備勤務開始・交代](../03_checklists/03_security/CHK-SEC-002_duty-handover.md) | 0.2 | 草案あり |
| 警備 | [`PROC-SEC-004` 巡回警備](../02_field-procedures/03_security/PROC-SEC-004_security-patrol.md) | 0.1 | [`CHK-SEC-001` 巡回警備](../03_checklists/03_security/CHK-SEC-001_security-patrol.md) | 0.1 | 草案あり |

## 3. 版・変更管理

- 手順改訂時は、対応する全チェックリストへの影響を確認する。
- 工程、判定項目、必須証跡又は完了条件が変わる場合は、チェックリストも改訂する。
- 説明・背景だけの変更で帳票に影響しない場合も、影響確認の記録を残す。
- チェック項目から判断理由や上申条件を読み取れない場合は、チェックリストへ説明を追加せず手順書を改訂する。
- 物件別に項目を追加する場合は、標準帳票版と物件別版の両方を記録する。

## 4. 粒度検証結果

初期6件では、手順書とチェックリストを分離できることを確認した。

| 観点 | 手順書に残す内容 | チェックリストへ移した内容 |
|---|---|---|
| 実施 | 順序の理由、適用除外、異常分岐 | 実施結果、時刻、値、未実施理由 |
| 判断 | 正常・要観察・異常・危険の定義 | 今回の判定結果と判断者 |
| 権限 | L0〜L4、緊急停止、復旧・再開 | 実際の連絡、承認、引渡し |
| 証跡 | 何を、なぜ残すか | 写真・記録・案件の識別子 |

設備・警備の巡回点は物件ごとに数と対象が異なるため、標準チェックリストは可変行の実績表とし、具体的な巡回点・閾値は物件別巡回表に分離した。清掃は場所別の定常工程を標準行として持ち、薬剤・仕上がり限度は物件別仕様に分離した。

追加3件では、警報対応の「一次対応完了」と「異常案件完了」、警備交代の「引継ぎ説明」と「受領完了」を別状態として記録する必要性を確認した。チェックリストは、後続案件ID、担当・期限、双方確認及び条件付き開始の承認を保持する。

## 5. 改訂履歴

| 版 | 改訂日 | 改訂内容 |
|---|---|---|
| 0.3 | 2026-07-22 | PROC-COM-001と領域別チェックリストの実装関係を追加 |
| 0.2 | 2026-07-22 | 代表手順・チェックリストを各領域2件へ拡張し、粒度検証結果を更新 |
| 0.1 | 2026-07-22 | 代表手順3件と代表チェックリスト3件の初期対応を整理 |
