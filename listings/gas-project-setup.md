---
slug: gas-project-setup
title: "GAS 新規立ち上げ標準手順(clasp+コマンドキュー)"
summary: "clasp と自作コマンドキューで、run-function 封鎖の Workspace 環境でも AI から GAS を継続実行できる新規プロジェクト立ち上げ手順。人間の作業は setupOnce の1クリックのみ。ホワイトリスト実行・並走防止・機密値の置き場も規定。"
category: "Google Workspace"
tags: ["GAS", "clasp", "コマンドキュー", "立ち上げ", "自動化"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "1.0.0"
createdAt: "2026-07-14"
updatedAt: "2026-07-14"
scratchTokens: 120000
withMdTokens: 15000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code", "cursor", "codex-cli"]
license: "商用利用可 (再販不可)"
featured: true
---

---
name: gas-project-setup
description: 新規 Google Apps Script(GAS) プロジェクトの立ち上げ標準手順（clasp + コマンドキュー全部入り、人間の手作業は setupOnce ▶実行 1クリックのみ）。「GAS 作って」「スプレッドシートに自動化を仕込んで」「Apps Script 新規」「シートにスクリプトをバインド」など新しい GAS プロジェクトを始める依頼が来たら必ずこの手順を使う。既存 GAS の修正では不要（GAS 開発ルールが適用される）。
---

# GAS プロジェクト立ち上げ標準シーケンス

ゴール: **人間の手作業 = `setupOnce` の ▶実行 1クリックだけ**。retrofit 禁止 — キューは最初の push に含める。

前提: Workspace ポリシーで `clasp run-function` や ANYONE_ANONYMOUS Web App が封じられている環境でも、AI 側から GAS を継続実行できるようにするのが目的。手作業コピペ運用を無くす。

## 1. ローカル準備
```
mkdir <project>-gas && cd <project>-gas
clasp create --type sheets --title "<名前>"   # 既存シートにバインドするなら --parentId <SHEET_ID>
```
`.clasp.json` を必ずリポジトリに残す（clasp 統一ルール）。

## 2. 初回 push に含める4点セット（省略禁止）
1. `Setup.gs` — `setupOnce()` 1つだけ。プロジェクト固有初期化（列追加・初回同期など「今すぐ走らせたい処理」も全部ここに畳む）+ `installCommandQueue()` 呼び出し
2. `_COMMANDS_()` ホワイトリスト（関数名→関数の明示 map。eval/動的呼び出し禁止）
3. `installCommandQueue()` / `processCommandQueue()` — `<project>-cmds` フォルダ、Script Property `CMD_FOLDER_ID`、1分トリガー。processCommandQueue は **LockService.tryLock(0) + payload 読込直後 setTrashed** で並走防止
4. `appsscript.json` — `oauthScopes`: `spreadsheets`, `drive`, `script.scriptapp`（+必要なら `script.external_request`）、`executionApi.access: "MYSELF"`

コマンドキューの実装要点: `cmd_*.json`（`{"command":"...","args":[...]}`）をキューフォルダに置く → 1分トリガーの `processCommandQueue()` がホワイトリスト関数のみ実行 → `result_<id>.txt` に書き戻し → cmd は setTrashed。並走二重実行は LockService.tryLock(0) + 即 setTrashed で防ぐ。機密値は Script Properties から読み、コマンド JSON には入れない。

## 3. 人間への依頼（1回だけ・4要素形式で）
- 直URL: `https://script.google.com/a/<YOUR_WORKSPACE_DOMAIN>/d/<SCRIPT_ID>/edit`（Workspace 管理ドメインなら `/a/<ドメイン>/` を挟むとアカウント切替不要。個人 Google アカウントなら素の URL）
- 対象 `.gs` ファイル（Setup.gs）を**先に開いてもらう**（関数プルダウンは開いているファイルの関数しか出ない）
- 選ぶ関数名: `setupOnce` → ▶実行 → OAuth「許可」
- 完了判定の見え方: 実行ログに `command queue installed` 等

## 4. 以降の実行（AI 完結）
Drive API/コネクタで `cmd_<unique>.json` を作成 → 1分待ち → `result_*.txt` を読む。動作検証は書き込み後の read-back まで実施（変更後の2段検証手順に従う）。

## 5. 機密値
API キー等は Script Properties へ。コマンド JSON に含めない。他システムからの機密値の横断自動注入はセキュリティ機構に止められることがあるため、その場合は手動経路へ切り替える。
