---
title: 図解一覧
description: ビルメンテナンス業務の関係、順序、責任、比較、状態変化を示す10の図解への入口です。
---

このページは、文章中心の業務分析を目的別に読み解くための図解索引です。図だけで個別物件の手順や責任分担を確定するものではありません。各図の掲載ページには、文章による説明と、根拠となる業務ID・プロセスID・成果物を併記しています。

:::note[図解の使い分け]
順序・分岐・状態変化はフロー図、条件ごとの正確な差は比較表で表します。まず全体像を見てから、知りたい判断や条件に対応する図へ進んでください。
:::

## 優先図解

| # | 図解 | 答えられる問い | 掲載ページ |
|---:|---|---|---|
| 1 | ビルメンテナンス業務の全体マップ | どの種類の仕事があるか | [18の業務領域](./overview/) |
| 2 | 関係者・契約・責任の全体図 | 誰が実施し、誰が判断・受領するか | [関係者と役割](./introduction/people-and-roles/) |
| 3 | 契約前から改善までのライフサイクル | 受託前から更新・終了までどう循環するか | [契約から改善まで](./overview/business-lifecycle/) |
| 4 | 日次・月次・年次の業務サイクル | 異なる時間軸がどうつながるか | [業務の時間軸と完了状態](./overview/completion-states/) |
| 5 | 計画から実施・確認・報告・請求まで | 現場作業の前後に何が必要か | [現場を支える管理業務と異常対応](./incidents-and-operations/) |
| 6 | 異常検知から一次対応・修繕・利用再開まで | 異常をどう安全に収束させるか | [点検異常から修繕・引渡しまで](./incidents/abnormality-to-restoration/) |
| 7 | 常駐・巡回・遠隔監視の比較 | 配置方式で検知・初動・証跡がどう変わるか | [常駐・巡回・遠隔監視](./variations/management-methods/) |
| 8 | 建物用途による要求差 | 用途で頻度・品質・停止影響がどう変わるか | [建物用途による違い](./variations/building-use/) |
| 9 | 法令義務、実施、報告、証跡の関係 | 法令上の義務をどう業務化するか | [法令業務の考え方](./variations/statutory-duties/) |
| 10 | 18業務領域と12横断プロセスの対応 | 仕事の種類と仕事の流れをどう接続するか | [契約から改善まで](./overview/business-lifecycle/#18業務領域と12横断プロセスの対応) |

## 共通の読み方

図中の矢印は代表的な接続を示します。必ずしも時間順だけを意味せず、情報・成果物・判断責任の引渡しを表す場合があります。分岐条件、差戻し、未実施、緊急経路は、正常経路から省かずに確認してください。

| 表記 | 読み方 |
|---|---|
| 四角い要素 | 業務、状態、主体、成果物のまとまり |
| ひし形または疑問形 | 後続経路を分ける判断 |
| 矢印 | 次の業務・状態への接続、または情報の引渡し |
| P01〜P12 | 業務領域を横断するプロセスID |
| BM-01〜BM-18 | 業務カタログの領域ID |
| BM-xx-yy | 業務カタログの個別業務ID |

## 図を個別物件へ使うとき

1. 図の対象となる業務IDと成果物を確認する
2. 建物用途、設備、運用時間、管理方式を重ねる
3. 契約上の実施・確認・検収・費用判断を割り当てる
4. 法令上の義務主体、資格者、報告者を別に確認する
5. 不在、通信断、未実施、事故時の代替経路を加える

図は分析モデルです。個別物件へ適用するときは、契約、最新法令、物件固有の手順・権限・連絡先を確認してください。

## 表示について

- 狭い画面では、複雑なフロー図を横へスクロールできます。
- 色だけで経路を区別せず、ラベル、形、矢印、表の見出しを併用しています。
- 各掲載ページの「図の読み方」は、図を見ない場合にも同じ関係を追える文章説明です。
- 印刷時は図がページ幅へ収まるよう縮小し、表の行途中での改ページを避けます。

## 根拠資料

- [ビルメンテナンス業務カタログ](https://github.com/tsumasaki-kurageya/property-management-pdm/blob/main/docs/building-maintenance-business-catalog.md)
- [ビルメンテナンス業務プロセスマップ](https://github.com/tsumasaki-kurageya/property-management-pdm/blob/main/docs/04_mappings/business-process-map.md)
- [建物用途別プロファイル](https://github.com/tsumasaki-kurageya/property-management-pdm/blob/main/docs/building-use-profiles.md)
- [管理方式プロファイル](https://github.com/tsumasaki-kurageya/property-management-pdm/blob/main/docs/management-operation-profiles.md)
- [契約役割プロファイル](https://github.com/tsumasaki-kurageya/property-management-pdm/blob/main/docs/contract-role-profiles.md)
- [法令義務プロファイル](https://github.com/tsumasaki-kurageya/property-management-pdm/blob/main/docs/statutory-duty-profiles.md)

最終確認日：2026年7月23日。記載状態：分析用原本に基づく図解索引。
