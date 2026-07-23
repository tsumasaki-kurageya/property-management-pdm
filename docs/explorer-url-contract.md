# 業務エクスプローラー URL仕様

## 目的

業務エクスプローラーの選択状態を、GitHub Pages上で安全に共有・再読み込みできるようにする。

## URL形式

エクスプローラー本体のパスは固定し、状態はクエリパラメーターで表す。

```text
/property-management-pdm/explorer/?business=BM-09-06&process=P04
```

GitHub Pagesのプロジェクトサイトでは、パス配下をSPAルートとして扱わないため、個別業務IDをパスへ埋め込まない。

## パラメーター

| パラメーター | 内容 | 例 |
|---|---|---|
| `business` | 選択中の業務ID | `BM-09-06` |
| `process` | 表示中の横断プロセスID | `P04` |

`process`は、選択業務を含む横断プロセスを指定する。省略時または選択業務を含まないIDが指定された場合は、正本の表示順で先頭のプロセスを表示する。

クエリパラメーターがない `/explorer/` は全体の業務地図を表す。業務プロセス状態から全体地図へ戻る際は、`business`と`process`をURLから除去する。

## 後方互換

初期実装で使用していた次の形式も読み取る。業務ID以外の項目は選択状態へ復元しない。

```text
/property-management-pdm/explorer/?node=BM-09-06
/property-management-pdm/explorer/?item=BM-09-06
/property-management-pdm/explorer/?business=BM-09-06&view=relations&type=uses
```

読み込み後は、`business`と`process`だけを保持する正式形式へ`replaceState`で正規化する。

## 履歴の扱い

- 業務の選択: 履歴を追加する
- プロセスの変更: 選択業務を維持して履歴を追加する
- 全体地図へ戻る: 履歴を追加し、業務IDとプロセスIDを解除する
- 初回読み込み・戻る・進む: 履歴を追加せず状態を復元する
- 不正値の補正: 履歴を追加せず正式URLへ置き換える

表示タブや関係分類などの補助UI状態はURLやブラウザ履歴へ保持しない。

## 不正値

存在しない業務ID、または選択業務を含まないプロセスIDが指定された場合は、既定値へフォールバックする。画面はクラッシュさせず、補正したことを利用者へ通知する。

## Markdownからのリンク例

```md
[点検異常を含むプロセスを見る](/property-management-pdm/explorer/?business=BM-09-06&process=P04)
```
