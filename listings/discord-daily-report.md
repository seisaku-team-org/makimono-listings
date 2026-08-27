---
slug: discord-daily-report
title: "Discord 日報Bot — 売上・KPI を毎朝自動通知"
summary: "Supabase / スプレッドシートから前日実績を集計して、毎朝 Discord に埋め込み形式で通知する Bot を AI に作らせる指示書。二重通知防止・メンション設計・見落とし対策込み。"
category: "業務自動化"
tags: ["Discord", "Webhook", "KPI", "日報", "通知"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "1.3.0"
createdAt: "2026-06-10"
updatedAt: "2026-06-30"
scratchTokens: 210000
withMdTokens: 32000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code", "cursor"]
license: "CC BY 4.0"
featured: false
---

# Discord 日報 Bot 開発指示書

## 作るもの

毎朝 8:00 に前日の KPI (売上・新規登録・問い合わせ件数など) をデータソースから集計し、
Discord チャンネルへ埋め込み (embed) 形式で通知する Bot。

## 運用で効く設計 (実運用からの学び)

- **重要通知は 2 系統以上の Webhook に並列送信** — 単一 Webhook 依存は見落とし事故のもと
- メンションは `content` に `<@userId>` を明示 + `allowed_mentions` を設定 (embed 内メンションは通知されない)
- 各 Webhook を個別 try/catch — 1系統の失敗で他系統を止めない
- 未対応案件の経過時間表示 (24h超→🚨) で「通知を見た後の放置」まで防ぐ

## 含まれるもの

- Webhook payload テンプレ (embed / メンション / 色分け)
- 集計クエリの雛形 (Supabase SQL / Sheets API 両対応)
- GitHub Actions cron 定義 + 手動発火 (workflow_dispatch) 設定
