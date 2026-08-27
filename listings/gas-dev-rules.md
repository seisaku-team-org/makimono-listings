---
slug: gas-dev-rules
title: "GAS 開発の絶対ルール(clasp統一・キュー・read-back)"
summary: ".gs/appsscript.json/.clasp.json を編集すると自動適用される GAS 開発ルール集。clasp push 統一、コマンドキュー方式、書き込み後の read-back verify、silent ignore 対策、push 後もトリガーが旧コードで動く罠までを規定。"
category: "Google Workspace"
tags: ["GAS", "clasp", "read-back", "開発ルール", "Google Workspace"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "1.0.0"
createdAt: "2026-07-14"
updatedAt: "2026-07-14"
scratchTokens: 80000
withMdTokens: 10000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code", "cursor"]
license: "商用利用可 (再販不可)"
featured: false
---

---
paths:
  - "**/*.gs"
  - "**/appsscript.json"
  - "**/.clasp.json"
---

# GAS 開発ルール（全プロジェクト共通・絶対ルール）

## 1. clasp 統一
手作業コピペ禁止。反映は必ず `clasp push -f`。既存プロジェクトを触る時も `.clasp.json` を置いて統一。push 後に time-based トリガーは**古いコードで動き続ける**ので、トリガー再作成（Web App `?cmd=setup` 再踏み or setupOnce 再実行）+ `clasp deploy --deploymentId <ID>` で同一 URL を最新化。

## 2. コマンドキュー方式（省略禁止・retrofit 禁止）
Workspace ポリシーで `clasp run-function` と ANYONE_ANONYMOUS Web App が使えないため、**最初の clasp push に必ず組み込む**:

1. `Setup.gs` に `setupOnce()` を **1つだけ**（人間が ▶実行するのはこれのみ。プロジェクト固有初期化 + `installCommandQueue()` を内包。2クリック構成は禁止）
2. `_COMMANDS_()` ホワイトリスト（関数名→関数オブジェクトの map。`eval`/`this[name]()` 禁止）
3. `installCommandQueue()`: `<project>-cmds` フォルダ作成 → folder ID を Script Property `CMD_FOLDER_ID` に保存 → 1分トリガー設置
4. `processCommandQueue()`: `cmd_*.json` を読みホワイトリスト関数のみ実行 → `result_<id>.txt` 書き戻し → cmd は setTrashed。**LockService.tryLock(0) + payload 読込直後の setTrashed** で並走二重実行を防止
5. `appsscript.json` oauthScopes: 最低 `spreadsheets`, `drive`, `script.scriptapp`（外部APIなら `script.external_request`）

AI 側運用: Drive API/コネクタで `cmd_<unique>.json`（`{"command":"syncAll","args":[]}`、text/plain + Google Docs 変換無効）を作成 → 1分以内に実行 → `result_*.txt` を読む。

禁止: 1分未満のトリガー間隔 / フォルダのリンク共有 / 機密値をコマンドに入れる（Script Properties から読む）/ `installTriggers` 系での無条件 `getProjectTriggers().forEach(delete)`（キューのトリガーを巻き添えにする — handlerFunction 名でフィルタ必須）。

## 3. 書き込みは read-back verify 必須
`setValue`/`setFormula` は merge セルの non-top-left / protected range / データ検証違反で **silent ignore**。書いたら `SpreadsheetApp.flush()` → `getValue()` で実値 assert。数式が `#REF!`/`#NUM!` のまま残るなら `getFormulas→setFormulas` で強制再評価。

## 4. URL 提示
GAS エディタリンクは `https://script.google.com/a/<YOUR_WORKSPACE_DOMAIN>/d/{SCRIPT_ID}/edit` 形式（Workspace 管理ドメインなら `/a/<ドメイン>/` を挟むとメンバー間でアカウント切替不要。個人 Google アカウントなら素の URL）。

新規プロジェクトの立ち上げ手順は「GAS 新規立ち上げ標準手順」を参照。
