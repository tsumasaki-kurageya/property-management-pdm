# 業務エクスプローラー URL仕様

## 目的

業務エクスプローラーの選択状態を、GitHub Pages上で安全に共有・再読み込みできるようにする。

## URL形式

エクスプローラー本体のパスは固定し、状態はクエリパラメーターで表す。

```text
/property-management-pdm/explorer/?business=BM-09-06&process=P04&view=flow
```

GitHub Pagesのプロジェクトサイトでは、パス配下をSPAルートとして扱わないため、個別業務IDをパスへ埋め込まない。

## パラメーター

| パラメーター | 内容 | 例 |
|---|---|---|
| `business` | 選択中の業務ID | `BM-09-06` |
| `item` | 業務以外の選択項目ID | `ROLE-...` |
| `process` | 表示中の横断プロセスID | `P04` |
| `view` | 表示方法 | `flow`, `hierarchy`, `relations` |
| `type` | 「関係から探す」の分類 | `uses`, `produces`, `people` |

`business`と`item`は同時に指定しない。画面がURLを生成するときは、選択項目の種類に応じてどちらか一方だけを出力する。

`process`は、選択業務を含む横断プロセスを指定する。省略時または選択業務を含まないIDが指定された場合は、正本の表示順で先頭のプロセスを表示する。

## 表示方法

| 値 | 画面表示 |
|---|---|
| `flow` | 仕事の流れ |
| `hierarchy` | 全体から見る |
| `relations` | 関係から探す |

## 関係分類

| 値 | 画面表示 |
|---|---|
| `all` | すべて |
| `related_to` | 関係する仕事・手順 |
| `uses` | 必要なもの |
| `produces` | 作られるもの |
| `people` | 担当・確認する人 |
| `governed_by` | 法令・基準 |

`type`は`view=relations`のときだけURLへ出力する。`all`は既定値のため省略する。

## 後方互換

初期実装で使用していた次の形式も読み取る。

```text
/property-management-pdm/explorer/?node=BM-09-06
```

読み込み後は、現在の正式形式へ`replaceState`で正規化する。

## 履歴の扱い

- 業務・項目の選択: 履歴を追加する
- 表示方法の変更: 履歴を追加する
- 関係分類の変更: 履歴を追加する
- 初回読み込み・戻る・進む: 履歴を追加せず状態を復元する
- 不正値の補正: 履歴を追加せず正式URLへ置き換える
- 表示プロセスの変更: 選択業務を維持して履歴を追加する

## 不正値

存在しない項目ID、選択業務を含まないプロセスID、未定義の表示方法、未定義の関係分類が指定された場合は、既定値へフォールバックする。画面はクラッシュさせず、補正したことを利用者へ通知する。

## Markdownからのリンク例

```md
[点検異常の前後を見る](/property-management-pdm/explorer/?business=BM-09-06&process=P04&view=flow)

[点検異常に必要なものを見る](/property-management-pdm/explorer/?business=BM-09-06&view=relations&type=uses)
```
