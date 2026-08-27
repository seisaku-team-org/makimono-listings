---
slug: gas-command-queue
title: "GAS完全自動化テンプレ — Driveコマンドキュー方式"
summary: "Google Apps Script の「毎回エディタで▶実行」を根絶。Drive 経由のコマンドキューで、初回1クリック以降は AI がすべての GAS 関数をリモート実行できるようになるテンプレート指示書。"
category: "Google Workspace"
tags: ["GAS", "Google Apps Script", "clasp", "自動化", "Drive"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "1.4.0"
createdAt: "2026-06-15"
updatedAt: "2026-07-05"
scratchTokens: 380000
withMdTokens: 45000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code", "cursor", "codex-cli"]
license: "商用利用可 (再販不可)"
featured: false
---

# GAS 完全自動化テンプレ — Drive コマンドキュー方式

> GAS 開発の最大の摩擦は「AI がコードを push しても、実行は人間がエディタで ▶ を押すしかない」こと。
> このテンプレは、その摩擦を **初回の1クリックだけ** に圧縮します。

## 仕組み

1. スクリプトに 1 分ごとの time-based トリガーを仕込み、専用 Drive フォルダの `cmd_*.json` を監視
2. AI (Claude Code 等) は Drive API で `cmd_*.json` を投げる → 1分以内にトリガーが拾って実行
3. 結果は `result_*.txt` として同フォルダに書き戻される → AI が読み戻して検証
4. 初回 1 クリック (`setupOnce` の ▶実行) で OAuth 同意 + フォルダ作成 + トリガー設置が完了

## セキュリティ設計

- **ホワイトリスト方式**: 登録された関数しか呼べない。任意コード実行は構造的に不可能
- フォルダはオーナーのみ書き込み可。機密値はコマンドに含めず Script Properties から読む

## このMDに含まれるもの

- `Setup.gs` 完全実装 (setupOnce / installCommandQueue / processCommandQueue)
- `appsscript.json` の必須 OAuth スコープ一覧
- clasp + GitHub 管理のセットアップ手順 (AIへの指示形式)
- トリガー巻き添え削除など、実運用で踏んだ罠 12 件の回避パターン集

*(本文テンプレート 約300行は購入後に全文が読めます)*
