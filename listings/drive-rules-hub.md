---
slug: drive-rules-hub
title: "Drive を AIルール共通ハブにする配布・統合同期"
summary: "AI(Claude Code 等)のルール/スキルを Drive の1フォルダで正本管理し、pull(全員へ配布)と merge(inbox投稿を正本へ統合)の2モードで同期する仕組み。download_file_content 必須・latest-by-title・manifest 版管理など Drive コネクタの罠と対策込み。"
category: "開発プロセス"
tags: ["Google Drive", "共通ルール", "配布", "同期", "ハブ"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "1.0.0"
createdAt: "2026-07-14"
updatedAt: "2026-07-14"
scratchTokens: 70000
withMdTokens: 10000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code"]
license: "商用利用可 (再販不可)"
featured: false
---

---
name: rules-sync
description: チーム共通ルール Drive ハブとの同期。「ルール同期」「共通ルール更新」「最新ルール取り込み」「rules sync」「ナレッジ統合して」「inbox マージ」などの依頼、または月初・大きなルール変更後に必ずこの手順を使う。pull（全メンバー共通: Drive→ローカル反映）と merge（管理者: knowledge-inbox→正本統合）の2モード。
---

# rules-sync — Drive ハブ同期

AI（Claude Code 等）のルール/スキルを Drive の1フォルダで正本管理し、各メンバーのローカルへ配布する同期の型。

Drive ハブ（正本）: 共通ルールハブ フォルダ（フォルダ ID = `<HUB_FOLDER_ID>`。owner = 管理者アカウント）
サブフォルダ: rules=`<RULES_FOLDER_ID>` / skills=`<SKILLS_FOLDER_ID>` / knowledge-inbox=`<KNOWLEDGE_INBOX_FOLDER_ID>`

## 前提となる Drive API の制約と対策
- **ファイル本文の取得は必ず `download_file_content`（base64 → デコード）を使う**。`read_file_content`（自然言語変換）は `_` `[` 等がエスケープされて**ファイルが壊れる**（実測）。read はフォルダ内容の人間向け確認のみ
- update/delete/move が無いコネクタでは、更新 = 同タイトルで create_file し直し。読む側は「同タイトル複数 → modifiedTime 最新を正」
- in-place 更新できる CLI がある環境ではそちらを優先: `node <sync-repo>/scripts/drive-hub-sync.mjs push/pull/list`（サービスアカウント + ドメイン全体委任認証、fileId 保持。大きめファイルもコンテキストを消費しない）
- fileId は版ごとに変わりうる → **ファイル ID をハードコードしない**（フォルダ ID のみ固定）
- アップロード時は `contentMimeType: text/plain` + `disableConversionToGoogleType: true`（Google Docs 変換させない）

## モード判定
- 「取り込み / 最新化 / 同期して」→ **pull**
- 「統合 / マージ / inbox 処理」→ **merge**（管理者環境のみ）

## pull（全メンバー共通）
1. ハブフォルダを `title contains 'manifest'` で検索 → modifiedTime 最新の manifest.json を取得
2. ローカル `~/.claude/<team>-rules-version.txt` の版番号と比較。同じなら「最新です」で終了
3. manifest の files を順に取得（該当フォルダを parentId 検索 → 同タイトルの最新を **download_file_content** で取得し base64 デコード）
4. 反映先:
   - `ONBOARDING.md` → プロジェクトの ONBOARDING ローカルマスター（環境ごとに設定。無い環境は `~/.claude/ONBOARDING.md`）
   - `rules/*.md` → `~/.claude/rules/`
   - `skills/<name>.md` → `~/.claude/skills/<name>/SKILL.md`
   - `CLAUDE.md.template` → `~/.claude/CLAUDE.md` が**無い場合のみ**新規作成。既存があれば上書きせず差分を提示するだけ
5. 反映前に既存ファイルを `~/.claude/backups/` にバックアップ
6. version ファイルを新版番号で更新 → 完了報告（版番号 + 反映ファイル一覧）

## merge（管理者環境のみ）
1. knowledge-inbox を検索 → 最新の `knowledge-merged.json`（台帳）に載っていないファイルを列挙
2. 各投稿を read → 既存ルールとの重複・矛盾をチェック → 反映先を判定（ONBOARDING §x.x / rules/ / skills/ / 却下）
3. 反映案を1行/件で利用者に提示 → 承認後、**ローカル正本を編集**
4. 正本を Drive に再アップ（同タイトル create_file）→ `manifest.json` を version+1 で再アップ → `knowledge-merged.json` に処理済み（fileId / タイトル / 反映先 / 日付）を追記して再アップ
5. GitHub ミラー: ルール用 repo に ONBOARDING / skills / rules を同期して commit + push
6. 完了報告に新 version と反映内容を列挙

## 注意
- 他メンバーは正本を直接編集しない（競合防止）。変更提案はすべて share-knowledge（inbox 投稿）経由
- inbox の投稿は削除できない前提 → 台帳方式で処理済み管理。古い版の正本は放置しても latest-by-title で動作に支障なし
