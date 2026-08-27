---
slug: x-scheduler-bot
title: "X(Twitter) 予約投稿Bot 開発指示書"
summary: "スプレッドシートに書いた投稿文を指定時刻に X へ自動ポストする Bot を AI に作らせる MD。API v2 の無料枠制限・画像添付・スレッド投稿の対応込み。"
category: "SNS運用"
tags: ["X", "Twitter", "予約投稿", "API", "SNS"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "1.0.2"
createdAt: "2026-07-03"
updatedAt: "2026-07-07"
scratchTokens: 290000
withMdTokens: 41000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code", "cursor", "codex-cli"]
license: "CC BY 4.0"
featured: false
---

# X(Twitter) 予約投稿 Bot 開発指示書

## 作るもの

Google スプレッドシート (投稿文 / 投稿日時 / 画像URL / ステータス) を投稿キューとして、
指定時刻に X API v2 で自動投稿する Bot。GitHub Actions cron (15分間隔) で動かす。

## 技術メモ (調査済み — 再調査に トークンを使わないこと)

- X API v2 Free tier: 投稿は 500件/月・17件/24h。キュー側でレート管理を実装する
- 認証: OAuth 1.0a User Context (v2 の tweet 作成は 1.0a 署名が必要)
- 画像: v1.1 media/upload → media_id を v2 tweet に添付 (v2 単独では不可)
- スレッド: `reply.in_reply_to_tweet_id` を直前の投稿 ID で連鎖させる

## 含まれるもの

- シート列定義とステータス遷移 (pending → posted / failed)
- GitHub Actions ワークフロー (secrets 設定コマンド付き)
- 投稿済み二重送信防止のロック設計
- 失敗時の Discord 通知
