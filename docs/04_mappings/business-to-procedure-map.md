# 業務―現場作業手順対応表

## 1. 目的

本書は、[ビルメンテナンス業務カタログ](../building-maintenance-business-catalog.md)と[現場作業手順](../02_field-procedures/README.md)の対応を一覧化し、「何を行うか」と「現場でどう実施・判断するか」を相互に追跡できるようにする。

本表の手順数を業務数として数えない。一つの業務に複数手順が対応し、一つの手順が記録、安全、報告等の複数業務へ接続する。

## 2. ステータス

| 状態 | 意味 |
|---|---|
| 草案あり | 手順ファイルを作成済み。物件適用前のレビューが必要 |
| 予定 | 領域READMEでID、名称、主業務を定義済み。手順本文は未作成 |
| 要検討 | 業務カタログ又は手順の粒度・主業務対応を再検討する |

## 3. 共通手順

| 主業務ID | 業務名 | 手順ID | 手順名 | 状態 | 備考 |
|---|---|---|---|---|---|
| `BM-05-10` | 勤務・担当を引き継ぐ | `PROC-COM-001` | [勤務・担当引継ぎ](../02_field-procedures/00_common/PROC-COM-001_shift-handover.md) | 草案あり | 受領判定、継続案件の所有者、責任移管を領域横断で扱う |
| `BM-17-06` | 危険予知・リスク評価を行う | `PROC-COM-002` | [作業前安全確認・危険予知](../02_field-procedures/00_common/PROC-COM-002_pre-work-safety-check.md) | 草案あり | 個別作業へ入る共通安全ゲート |
| `BM-17-11` | 作業区域を設定・解除する | `PROC-COM-003` | [作業区域設定・解除](../02_field-procedures/00_common/PROC-COM-003_work-area-control.md) | 草案あり | 区域の設定・維持・変更・解除と利用再開への引渡しを扱う |
| `BM-13-11` | 異常を速報・上申する | `PROC-COM-004` | [異常上申](../02_field-procedures/00_common/PROC-COM-004_abnormality-escalation.md) | 草案あり | 安全確保後の速報、受領確認、対応責任の引渡しを領域横断で扱う |
| `BM-13-04` | 作業完了を報告する | `PROC-COM-005` | [完了報告](../02_field-procedures/00_common/PROC-COM-005_completion-reporting.md) | 草案あり | 完了・条件付き完了・未完了・中止を区別し、受領と残課題の引渡しを扱う |

## 4. 清掃手順

| 主業務ID | 業務名 | 手順ID | 手順名 | 状態 | 主な関連業務 |
|---|---|---|---|---|---|
| `BM-06-03` | 日常清掃を実施する | `PROC-CLN-001` | [共用部日常清掃](../02_field-procedures/01_cleaning/PROC-CLN-001_common-area-cleaning.md) | 草案あり | BM-13、BM-17 |
| `BM-06-03` | 日常清掃を実施する | `PROC-CLN-002` | [トイレ清掃](../02_field-procedures/01_cleaning/PROC-CLN-002_restroom-cleaning.md) | 草案あり | BM-06-07〜08、BM-13、BM-15、BM-17 |
| `BM-06-06` | 廃棄物を回収・分別する | `PROC-CLN-003` | [廃棄物回収・分別](../02_field-procedures/01_cleaning/PROC-CLN-003_waste-collection-and-sorting.md) | 草案あり | BM-13、BM-17 |
| `BM-06-07` | 消耗品を補充する | `PROC-CLN-004` | [消耗品確認・補充](../02_field-procedures/01_cleaning/PROC-CLN-004_consumables-check-and-replenishment.md) | 草案あり | BM-13-02、BM-15-02〜04 |
| `BM-06-05` | 定期・特別清掃を実施する | `PROC-CLN-005` | [定期床面清掃](../02_field-procedures/01_cleaning/PROC-CLN-005_periodic-floor-cleaning.md) | 草案あり | BM-04、BM-12、BM-13、BM-17 |
| `BM-06-09` | 清掃品質を検査する | `PROC-CLN-006` | [清掃品質検査・再清掃](../02_field-procedures/01_cleaning/PROC-CLN-006_quality-inspection-and-recleaning.md) | 草案あり | BM-06-10〜11、BM-13、BM-17 |

### 4.1 清掃業務から見た対応

| 業務ID | 対応状況 | 補足 |
|---|---|---|
| `BM-06-01` 清掃仕様を設定する | 現場手順の前提 | 手順本文ではなく契約・物件別仕様として参照する |
| `BM-06-02` 日常清掃を計画する | 現場手順の前工程 | 作業指示・日次計画として開始条件へ接続する |
| `BM-06-03` 日常清掃を実施する | 対応あり | `PROC-CLN-001`、`PROC-CLN-002` |
| `BM-06-04` 定期清掃を計画する | 現場手順の前工程 | `PROC-CLN-005`の作業計画へ接続する |
| `BM-06-05` 定期・特別清掃を実施する | 対応あり | [`PROC-CLN-005`](../02_field-procedures/01_cleaning/PROC-CLN-005_periodic-floor-cleaning.md) |
| `BM-06-06` 廃棄物を回収・分別する | 対応あり | `PROC-CLN-003` |
| `BM-06-07` 消耗品を補充する | 対応あり | [`PROC-CLN-004`](../02_field-procedures/01_cleaning/PROC-CLN-004_consumables-check-and-replenishment.md)、`PROC-CLN-002` |
| `BM-06-08` 清掃結果を記録する | 各清掃手順の共通関連業務 | 独立手順ではなく記録工程として組み込む |
| `BM-06-09` 清掃品質を検査する | 対応あり | `PROC-CLN-006` |
| `BM-06-10` 清掃不良を是正する | 関連対応あり | `PROC-CLN-006`内の再清掃・不適合分岐 |
| `BM-06-11` 清掃方法を改善する | 現場手順の後工程 | 実績・不適合分析から改善業務へ接続する |

## 5. 設備手順

| 主業務ID | 業務名 | 手順ID | 手順名 | 状態 | 主な関連業務 |
|---|---|---|---|---|---|
| `BM-08-03` | 中央監視装置を監視する | `PROC-EQP-001` | [中央監視・運転状態確認](../02_field-procedures/02_equipment/PROC-EQP-001_central-monitoring.md) | 草案あり | BM-08-06〜07、BM-13、BM-14 |
| `BM-08-04` | 現場を巡回する | `PROC-EQP-002` | [設備巡回点検](../02_field-procedures/02_equipment/PROC-EQP-002_routine-inspection.md) | 草案あり | BM-09-02、05〜06、BM-13、BM-14、BM-17 |
| `BM-08-05` | メーターを検針する | `PROC-EQP-003` | [検針・測定値記録](../02_field-procedures/02_equipment/PROC-EQP-003_meter-reading-and-measurement.md) | 草案あり | BM-08-06、BM-09-05〜06、BM-15-08 |
| `BM-08-02` | 設備を起動・停止する | `PROC-EQP-004` | [設備運転操作・切替え](../02_field-procedures/02_equipment/PROC-EQP-004_equipment-operation-and-switching.md) | 草案あり | BM-08-01、08、BM-12、BM-13、BM-17 |
| `BM-08-07` | 警報に対応する | `PROC-EQP-005` | [警報・設備異常対応](../02_field-procedures/02_equipment/PROC-EQP-005_alarm-response.md) | 草案あり | BM-10-01〜05、BM-12、BM-13 |
| `BM-10-03` | 一次対応を行う | `PROC-EQP-006` | [緊急停止・隔離](../02_field-procedures/02_equipment/PROC-EQP-006_emergency-shutdown-and-isolation.md) | 草案あり | BM-08、BM-10、BM-12、BM-17 |
| `BM-10-10` | 完了検査・引渡しを行う | `PROC-EQP-007` | [試運転・復旧確認](../02_field-procedures/02_equipment/PROC-EQP-007_restoration-verification.md) | 草案あり | BM-08-02・06、BM-10-09・11、BM-13、BM-14 |
| `BM-09-08` | 清掃・給油・調整を行う | `PROC-EQP-008` | 設備日常保守 | 予定 | BM-09-07、BM-13、BM-14、BM-15 |

設備の業務カタログには、計画・台帳・法定点検・修繕発注等も含まれる。本表の初期範囲は、運転監視、日常点検、操作、異常対応及び復旧確認の現場実行手順であり、設備別の法定点検手順は後続拡張とする。

## 6. 警備手順

| 主業務ID | 業務名 | 手順ID | 手順名 | 状態 | 主な関連業務 |
|---|---|---|---|---|---|
| `BM-05-10` | 勤務・担当を引き継ぐ | `PROC-SEC-001` | [警備勤務開始・交代](../02_field-procedures/03_security/PROC-SEC-001_duty-start-and-handover.md) | 草案あり | PROC-COM-001、BM-05-04、BM-11-01・10、BM-13、BM-17 |
| `BM-11-02` | 入退館を管理する | `PROC-SEC-002` | [入退館受付・確認](../02_field-procedures/03_security/PROC-SEC-002_access-reception-and-verification.md) | 草案あり | BM-12、BM-13 |
| `BM-11-03` | 鍵を管理する | `PROC-SEC-003` | [鍵・入館証管理](../02_field-procedures/03_security/PROC-SEC-003_key-and-access-card-management.md) | 草案あり | BM-11-02、BM-13、BM-14、BM-17 |
| `BM-11-04` | 巡回警備を行う | `PROC-SEC-004` | [巡回警備](../02_field-procedures/03_security/PROC-SEC-004_security-patrol.md) | 草案あり | BM-11-07・10、BM-13、BM-17 |
| `BM-11-05` | 監視設備を確認する | `PROC-SEC-005` | [警報・防犯監視](../02_field-procedures/03_security/PROC-SEC-005_alarm-and-security-monitoring.md) | 草案あり | BM-11-06・09〜10、BM-13 |
| `BM-11-06` | 事故・事件へ対応する | `PROC-SEC-006` | 不審者・不審物対応 | 予定 | BM-12、BM-13、BM-17 |
| `BM-11-06` | 事故・事件へ対応する | `PROC-SEC-007` | [事故・急病・現場保全](../02_field-procedures/03_security/PROC-SEC-007_incident-illness-scene-preservation.md) | 草案あり | BM-11-10、BM-12、BM-13、BM-17 |
| `BM-11-09` | 災害時対応を行う | `PROC-SEC-008` | 火災・地震等の災害初動 | 予定 | BM-11-07〜08・10、BM-12、BM-13、BM-17 |

## 7. 業務カタログの不足・粒度確認候補

| 候補 | 現状 | 確認観点 |
|---|---|---|
| 勤務交代・引継ぎ | `BM-05-10 勤務・担当を引き継ぐ`として追加し、`PROC-COM-001`を横断手順、`PROC-SEC-001`を警備特化手順とした | 解決。領域別手順は共通の受領判定・責任移管条件を継承する |
| 横断的な異常上申 | `BM-13-11 異常を速報・上申する`として追加し、`PROC-COM-004`で受領確認と対応責任の引渡しを定義した | 解決。領域別手順は発見基準・一次対応を正とし、共通手順へ接続する |
| 作業区域設定・解除 | `BM-17-11 作業区域を設定・解除する`として追加し、`PROC-COM-003`で設定・維持・解除を定義した | 解決。領域別手順は固有危険を正とし、共通の区域管理へ接続する |
| 復旧と利用再開 | `PROC-EQP-007`で技術的復旧判定と運用責任者への引渡しを分離し、`BM-10-10`の完了検査・引渡しへ対応させた | 解決。新規業務IDは追加せず、既存カタログと責任分界で追跡する |

不足候補は、該当手順を試作して目的、開始条件、完了条件及び成果物が独立するかを確認してから判断する。勤務交代・引継ぎ、横断的な異常上申及び作業区域設定・解除は独立業務としてカタログへ追加した。復旧と利用再開は別状態・別権限だが、既存の完了検査・引渡し業務と責任分界で追跡できるため、新規業務IDは追加しない。

## 8. 更新ルール

- 手順を新規作成・廃止・分割した場合、本表を同時に更新する。
- 手順の主業務ID変更時は、領域READMEと手順本文も更新する。
- 関連業務IDの詳細は手順本文を正とし、本表では主要な接続だけを示す。
- 「予定」を「草案あり」に変更する際は、リンク、手順名、主業務IDを実ファイルと照合する。
- 業務カタログへ業務を追加・統合した場合は、旧IDからの追跡方法を残す。

## 9. 改訂履歴

| 版 | 改訂日 | 改訂内容 |
|---|---|---|
| 1.0 | 2026-07-22 | PROC-CLN-005、PROC-EQP-006、PROC-SEC-005を追加し、清掃完了・安全隔離・警報対応の責任境界を具体化 |
| 0.9 | 2026-07-22 | PROC-CLN-004、PROC-EQP-004、PROC-SEC-003を追加し、補充・操作・媒体管理の責任境界を具体化 |
| 0.8 | 2026-07-22 | PROC-CLN-003、PROC-EQP-003、PROC-SEC-002を追加し、各領域の次順位手順を具体化 |
| 0.7 | 2026-07-22 | PROC-CLN-006、PROC-EQP-001、PROC-SEC-007を追加し、各領域の次順位手順を具体化 |
| 0.6 | 2026-07-22 | PROC-COM-005を追加し、共通手順5件の具体化を完了 |
| 0.5 | 2026-07-22 | PROC-EQP-007を追加し、技術的復旧と施設利用再開の粒度候補を解決 |
| 0.4 | 2026-07-22 | BM-17-11とPROC-COM-003を追加し、作業区域設定・解除候補を解決 |
| 0.3 | 2026-07-22 | BM-13-11とPROC-COM-004を追加し、横断的な異常上申候補を解決 |
| 0.2 | 2026-07-22 | BM-05-10とPROC-COM-001を追加し、警備手順との境界を反映 |
| 0.1 | 2026-07-22 | 初版。共通・清掃・設備・警備の初期手順と作成状況を整理 |
