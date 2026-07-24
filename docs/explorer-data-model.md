# 業務エクスプローラー データモデル

## 1. 目的

業務エクスプローラーは、画面コードへ業務名・関係・代表例を直書きせず、分析用原本から生成したグラフデータを利用する。

生成元は、業務カタログ、業務プロセスマップ、重要業務分析、現場作業手順、チェックリスト対応表、法令義務プロファイルである。原本の更新後は、生成データを再生成し、差分をリポジトリへ反映する。

## 2. 出力

`src/data/explorer/generated/`へ次を出力する。

| ファイル | 内容 |
|---|---|
| `business-nodes.json` | 業務領域、個別業務、手順、帳票、役割、法令、横断プロセス |
| `business-edges.json` | ノード間の関係 |
| `business-areas.json` | 18業務領域の表示順と、業務領域IDから所属業務ID一覧への索引 |
| `business-index.json` | 全個別業務について、業務IDから業務領域ID・所属プロセスID一覧への索引 |
| `processes.json` | 12横断プロセスの表示順、開始・終了条件、業務ステップ、次工程、条件分岐、所属業務 |
| `manifest.json` | スキーマ版、件数、生成元ファイルのSHA-256 |

件数は`manifest.json`で管理し、正本更新時に生成結果とともに更新する。

画面側は`src/data/explorer/index.ts`から型付きで参照する。

## 3. ノード型

| 型 | 主なID | 意味 |
|---|---|---|
| `area` | `BM-09` | 18の業務領域 |
| `business` | `BM-09-06` | 181の個別業務 |
| `procedure` | `PROC-EQP-002` | 詳しい現場作業手順 |
| `artifact` | `CHK-EQP-001`または`ART-*` | 帳票、入力資料、作業記録、成果物 |
| `role` | `ROLE-*` | 実施者、責任者、確認者、承認者 |
| `standard` | `STD-*` | 法令・基準の代表領域 |
| `process` | `P01` | 12の横断プロセス |

ハッシュ型IDは、表示名を正規化した文字列から決定的に生成する。同じ入力から常に同じIDが生成される。

## 4. 関係型

| 型 | 意味 |
|---|---|
| `contains` | 上位領域・業務が下位業務・手順を含む |
| `precedes` | 前後工程またはカタログ上の前後関係 |
| `branches_to` | 条件により別プロセスへ分岐する |
| `uses` | 入力資料、台帳、記録様式等を利用する |
| `produces` | 記録、報告、帳票、成果物を作る |
| `performed_by` | 実施者・作業者が担当する |
| `approved_by` | 責任者・資格者・権限者が判断又は承認する |
| `governed_by` | 法令・基準の影響を受ける |
| `participates_in` | 横断プロセスへ所属する |
| `related_to` | 主従・前後以外の主要な関連を持つ |

`precedes`には`metadata.basis`を持たせる。`process-map`は業務プロセスマップから得た前後関係、`catalog-order`は同一領域内での参照順を示す。画面では`process-map`を優先する。

## 5. 業務領域・プロセス索引

`business-areas.json`と`business-index.json`により、画面コードへ所属関係を直書きせず、次を取得できる。

- 業務領域IDから所属業務ID一覧
- 業務IDから業務領域ID
- 業務IDから所属する横断プロセスID一覧

所属プロセスIDは`processes.json`の`order`順で格納する。該当プロセスがない業務は`processIds: []`として扱い、接続関係から推測しない。

`processes.json`の各プロセスは、次のデータ契約を持つ。

- `order`、`description`、`startTrigger`、`endState`
- `entryBusinessIds`、`exitBusinessIds`
- `businessIds`
- `steps[].businessIds`、`steps[].nextStepIds`
- `steps[].connection`、`steps[].branches`

P04は清掃、衛生、設備運転、点検・保守、警備・防災の並行経路を持つため、開始・終了業務を配列で保持する。他のプロセスについても、同一工程に複数業務が定義されるため配列を使用する。

## 6. 生成と検証

```bash
npm run generate:explorer
npm run check:explorer
npm run verify
```

生成処理は次を検証する。

- 業務領域が18件、個別業務が181件、横断プロセスが12件である
- 業務領域ID、業務ID、横断プロセスID、ステップIDが一意である
- 横断プロセスの表示順が1〜12で欠落・重複していない
- 関係型が定義済みである
- 関係の参照元・参照先が存在する
- プロセスの業務、次工程、分岐先プロセスが定義済みである
- 孤立ノードがない
- 全個別業務が上位領域を持つ
- プロセス未登録業務を空のプロセスID一覧として表現できる
- `--check`時に生成済みJSONと正本から計算した結果が一致する

## 7. 更新手順

1. 分析用原本を先に更新する。
2. `npm run generate:reference`を実行する。
3. `npm run generate:explorer`を実行する。
4. 原本、表示用リファレンス、エクスプローラー生成JSONを同じPull Requestへ含める。
5. `npm run verify`で整合性を確認する。

生成JSONを手作業で編集しない。関係が不足する場合は、原本の業務ID、手順対応、役割、成果物又は法令プロファイルを補正する。
