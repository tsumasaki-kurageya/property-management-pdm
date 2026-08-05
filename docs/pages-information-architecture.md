# GitHub Pages 情報設計・編集方針

## 1. 目的

本書は、ビルメンテナンス業務の分析成果物を、業務経験のないソフトウェア開発チームが順番に学び、必要な詳細へ遡れるドキュメントサイトへ再編集する基準を定める。

サイトは製品機能や解決策ではなく、ビルメンテナンス業務、上位の所有・投資・物件・施設運営との接続、関係者、仕事の流れ、条件差を理解するために用いる。

## 2. 対象読者と読後目標

主な対象は、業界固有の略語、契約、法定業務、オーナー・AM・PM・FM・BMの違いに馴染みがないチームメンバーである。

読後に次を説明できる状態を目指す。

1. BMが清掃・設備・警備だけでなく、営業、契約、計画、報告、請求、改善まで含むこと
2. オーナー、AM、PM、FM、BMが会社名ではなく、目的・管理対象・権限・期間の異なる業務機能であること
3. PMとFMは上下ではなく、物件・賃貸運営と利用組織・施設性能という目的の異なる並列機能であること
4. 上位の方針・要求・予算がBMの計画・実行へ具体化され、実績・状態・費用・リスクが次の判断へ戻ること
5. 契約から改善までの循環と、異常・修繕・法定・是正への分岐
6. 実行、技術確認、検収、報告、請求、利用再開が別の完了状態であること
7. 所有・利用形態、契約、管理方式、用途、法令により分担が変わること
8. 業務ID、上位業務領域ID、KPI・KRI、接続種別をどこで調べるか

## 3. 情報構造の基本方針

| 層 | 目的 | 内容 |
|---|---|---|
| 学ぶための本文 | 初学者が全体像から順番に理解する | 平易な説明、代表例、図、要点 |
| 調べるためのリファレンス | ID、条件、詳細定義を追跡する | 181業務、12プロセス、上位接続、重要業務、各種プロファイル |

本文だけで新しい業務定義、KPI・KRI、責任分界、接続関係を追加しない。正本を初学者向けに再構成し、詳細はリファレンスへ分離する。

## 4. 学習順序

| 段階 | 読者の問い | 主な章 |
|---|---|---|
| 1. 入口 | 何をする業界か、誰が関わるか | はじめに |
| 2. BMの全体像 | BMにはどの仕事があり、どう循環するか | 業務の全体像 |
| 3. 上位業務との接続 | なぜその作業を行い、誰が判断するか | 所有・運営・維持管理の業務構造 |
| 4. 日常の現場 | 普段は何をしているか | 現場の業務 |
| 5. 異常と周辺業務 | 何が現場を支え、異常時にどう動くか | 異常と周辺業務 |
| 6. 条件差 | なぜ物件・契約ごとに分担が違うか | 条件による違い |
| 7. 詳細確認 | 業務ID、プロセス、接続、条件をどこで調べるか | リファレンス |

## 5. サイドバー構成

第一階層は次の順序とする。

1. 業務を探索する
2. はじめに
3. 業務の全体像
4. **所有・運営・維持管理の業務構造**
5. 現場の業務
6. 異常と周辺業務
7. 条件による違い
8. リファレンス
9. このサイトについて

新章は「業務の全体像」の後、「現場の業務」の前へ置く。章内はレイヤー別・接続・シナリオを折りたたみ、深い階層を常時展開しない。

## 6. 所有・運営・維持管理の業務構造

### 6.1 学習用本文のパス

| パス | 責務 | 主な正本 |
|---|---|---|
| `/management-structure/` | 三レイヤー、役割関係、管理対象・期間の全体像 | roles-and-layers |
| `/management-structure/ownership-and-investment/` | 所有・投資管理レイヤーの入口 | roles-and-layers |
| `/management-structure/ownership-and-investment/owner/` | オーナーの業務領域、判断、KPI・KRI | business-domains-and-kpis |
| `/management-structure/ownership-and-investment/asset-management/` | AMの業務領域、判断、KPI・KRI | business-domains-and-kpis |
| `/management-structure/property-and-facility-operation/` | PM・FMを並列機能として説明 | roles-and-layers |
| `/management-structure/property-and-facility-operation/property-management/` | PMの業務領域、判断、KPI・KRI | business-domains-and-kpis |
| `/management-structure/property-and-facility-operation/facility-management/` | FMの業務領域、判断、KPI・KRI | business-domains-and-kpis |
| `/management-structure/maintenance-execution/` | 維持管理・実行レイヤーの入口 | roles-and-layers |
| `/management-structure/maintenance-execution/building-maintenance/` | BM-01〜BM-18・181業務の位置付け | roles-and-layers、業務カタログ |
| `/management-structure/connections/decision-and-responsibility/` | 起案・評価・承認・実行・確認・報告の責任分界 | decision-and-responsibility |
| `/management-structure/connections/requirements-to-bm/` | 上位からBMへの要求・制約・承認 | management-to-bm-map |
| `/management-structure/connections/bm-feedback-to-management/` | BM実績から上位KPI・KRI・判断への戻り | management-to-bm-map |
| `/management-structure/scenarios/` | 代表シナリオの入口 | 4正本 |
| `/management-structure/scenarios/air-conditioning-renewal/` | 空調設備更新を役割別に追跡 | 4正本 |
| `/management-structure/scenarios/statutory-nonconformity/` | 法定不適合是正を役割別に追跡 | 4正本 |
| `/management-structure/scenarios/disaster-recovery/` | 災害後復旧を役割別に追跡 | 4正本 |

### 6.2 リファレンス

| パス | 責務 |
|---|---|
| `/reference/management-to-bm-map/` | 上位業務領域とBM-01〜BM-18の接続種別・強度・引渡し情報を調べる入口 |

詳細な接続レコードは `docs/management-structure/management-to-bm-map.md` を正本とする。学習本文へ全レコードを複製しない。

### 6.3 代表シナリオの共通構成

1. 何が起きたか
2. 各役割が何を問題と捉えるか
3. 必要な情報
4. 起案・評価・承認・実行・確認・報告の分担
5. 関連する上位業務領域ID
6. 関連するBM業務領域・業務ID
7. 接続種別・接続強度
8. 上位へ戻る情報
9. KPI・KRIと次回判断

## 7. 既存ページとの責務分担

| 既存ページ | 維持する責務 | 新章との関係 |
|---|---|---|
| `/introduction/people-and-roles/` | 初学者が主な関係者を知る簡潔な入口 | 詳細な業務構造へ誘導する |
| `/variations/responsibility-boundaries/` | 所有・利用・契約・権限により分担がどう変動するか | 標準構造は新章へ委ねる |
| `/overview/`、`/overview/business-lifecycle/` | BM内部の18領域と12横断プロセス | 新章から参照し、別体系へ移動しない |
| `/reference/business-catalog/` | BM-01〜BM-18・181業務の正本表示 | 新章のBMリンク先 |
| `/reference/processes/` | BM内部の12横断プロセス | 新章の実行フロー参照先 |
| `/reference/management-to-bm-map/` | 上位業務とBMの詳細な接続 | 新章本文から分離したリファレンス |

同じ説明を全文複製せず、各ページ冒頭で責務と関連ページを明示する。

## 8. 後方互換性・移行方針

- 既存URLを変更・削除しない
- 既存ページを新しいパスへ単純移動しない
- BM-01〜BM-18・181業務と12プロセスを別体系へ再編しない
- `/introduction/people-and-roles/` と `/variations/responsibility-boundaries/` のslugを維持する
- GitHub Pagesのbase path `/property-management-pdm` と末尾スラッシュを維持する
- 既存アンカー、generated reference、canonical URL相当の公開URLを維持する
- 新章から既存BM本文・リファレンスへ、既存の入口ページから新章へ相互導線を置く
- 深いサイドバー階層は折りたたむ
- 変更後に内部リンクとPC・タブレット・モバイル表示を検証する

## 9. 正本と変更順序

上位業務レイヤーの正本は次の4ファイルである。

- `docs/management-structure/roles-and-layers.md`
- `docs/management-structure/business-domains-and-kpis.md`
- `docs/management-structure/decision-and-responsibility.md`
- `docs/management-structure/management-to-bm-map.md`

変更順序は次とする。

1. 該当する分析正本を更新する
2. 学習用本文を更新する
3. リファレンスとリンクを更新する
4. ID、KPI・KRI、接続種別、責任分界の整合を検証する

## 10. 執筆ルール

- 役割を会社名・固定的な序列として表現しない
- PMとFMを目的の異なる並列機能として示す
- 技術評価、費用査定、承認、実行、確認、検収、法的義務、残存リスク受容を分ける
- BM会社の売上・原価と、物件側OPEX・CAPEX・NOI・NCFを混同しない
- 図だけで完結させず、図の読み方と同内容の表・文章を置く
- 長いラベルを一つのMermaidノードへ詰め込まず、狭い画面では図コンテナ内を横スクロールできるようにする
- 代表例を全案件の必須手順として断定しない
- 個別案件では契約、権限規程、法令、行政運用を優先する

## 11. 本文とリファレンスの境界

本文には、役割の違い、代表的な判断・情報の流れ、主要ID、代表KPI・KRI、代表接続を載せる。

リファレンスには、181業務、12プロセス、全接続レコード、条件ID、詳細マトリクス、手順・チェックリストを置く。

## 12. 図解・アクセシビリティ

- Mermaidはコンテナ幅を超える場合に横スクロール可能とする
- 色だけで意味を伝えず、ラベル、形状、線、表を併用する
- 図の直後に読み方を文章で説明する
- PC 1440px、タブレット 900px、モバイル 390pxを代表幅として確認する
- ページ全体に意図しない横スクロールを発生させない
- 見出し、表、リンクだけでも情報を追跡できるようにする

## 13. 完成条件

- 三レイヤーがページ構成とサイドバーで表現されている
- PMとFMが並列機能として説明されている
- 4正本にない定義・KPI・責任・接続を追加していない
- 3シナリオが共通構成を満たす
- 上位ID、BM ID、KPI・KRI、接続種別・強度を追跡できる
- 既存URL、base path、アンカー、generated referenceが維持される
- 既存入口と新章、上位業務とBMリファレンスの相互導線がある
- 内部リンク、ビルド、E2E、PC・タブレット・モバイル表示が検証される
- 製品機能、製品カバレッジ、特定顧客の権限設計が混入していない
