---
slug: knowledge-hub-post
title: "AI開発ノウハウをチーム共通ハブへ投稿する型"
summary: "セッション中に得た AI コーディングのルール・失敗パターンを、Drive の追記専用 inbox フォルダに定型フォーマットで投稿し、管理者が正本へ統合する仕組み。各人のローカルにルールが散らばるのを防ぐ。機密値の書き方も規定。"
category: "開発プロセス"
tags: ["ナレッジ共有", "開発プロセス", "チーム", "ハブ"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "1.0.0"
createdAt: "2026-07-14"
updatedAt: "2026-07-14"
scratchTokens: 40000
withMdTokens: 6000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code", "cursor", "codex-cli"]
license: "商用利用可 (再販不可)"
featured: false
---

---
name: share-knowledge
description: セッション中に確立した AI コーディング開発ノウハウ・ルール・失敗パターンを、チーム共通ハブ（Drive の共有フォルダ knowledge-inbox）へ投稿する。「このノウハウ共有して」「全社ルールにして」「他のアカウントにも適用して」「共通化して」「他のチームでも使えるように」と言われた時、または全メンバーに適用すべき feedback を保存した時に必ずこの手順を使う。
---

# share-knowledge — ノウハウの上り投稿

チームで使う AI（Claude Code 等）のルールを、各メンバーのローカルに散らさず1つの Drive フォルダに集約するための投稿手順。投稿先を「追記専用の inbox」にし、管理者がまとめて正本へ統合する。

投稿先: `knowledge-inbox` フォルダ（フォルダ ID = `<KNOWLEDGE_INBOX_FOLDER_ID>`。チーム共通ルールハブ配下）

## 手順
1. 投稿内容を下記フォーマットに整形（1投稿 = 1ノウハウ。複数あればファイルを分ける）
2. Drive にアップロード（API/コネクタの create_file）:
   - parentId: `<KNOWLEDGE_INBOX_FOLDER_ID>`
   - title: `YYYYMMDD-<アカウント短縮名>-<slug>.md`（例: `20260706-<account>-vercel-cron-unreliable.md`。アカウント = このマシンの Drive アカウント owner）
   - contentMimeType: `text/plain` + `disableConversionToGoogleType: true`（Google Docs へ変換させない）
3. 完了報告に fileId とタイトルを添える。統合は管理者環境の同期処理（merge）が拾って正本に反映する

## 投稿フォーマット
```markdown
---
date: YYYY-MM-DD
account: <投稿者アカウント>
type: feedback | reference | rule-change
title: <1行タイトル>
target: <反映先。ルール文書のセクション / rules/xxx / skills/xxx / new>
---
<ルール本文（命令形で簡潔に）>

**Why:** <なぜ必要か。実際に起きた事例・日付>
**How to apply:** <どう適用するか。コマンド・URL 形式など具体的に>
```

## 書いてはいけないもの
- 機密値（API キー / トークン / パスワード / 接続文字列）— 「Script Properties の X から読む」等の間接表現にする
- 個社の経営数値・顧客名などノウハウに不要な実データ
- 特定マシンのローカルパス依存手順（全アカウントで再現できる形に一般化して書く）
