---
slug: scraping-to-sheets
title: "定期スクレイピング→Googleスプレッドシート自動集計MD"
summary: "競合価格・在庫・ランキングなどを毎日自動取得してスプレッドシートに蓄積するバッチを AI に作らせる指示書。robots.txt 尊重・レート制限・差分検知のベストプラクティス込み。"
category: "データ収集"
tags: ["スクレイピング", "Google Sheets", "定期実行", "GitHub Actions"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "1.1.0"
createdAt: "2026-06-28"
updatedAt: "2026-07-02"
scratchTokens: 410000
withMdTokens: 52000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code", "cursor"]
license: "商用利用可 (再販不可)"
featured: false
---

# 定期スクレイピング → スプレッドシート自動集計 MD

## 作るもの

指定した URL リストを毎朝クロールし、CSS セレクタで抽出した値を Google スプレッドシートに
日付列で追記していくバッチ。GitHub Actions (cron) で動かすため、サーバ不要・無料枠で運用可能。

## 設計方針 (調査済み)

- 取得: fetch + cheerio (静的) / Playwright (動的)。対象サイトごとに `targets.yaml` で宣言的に定義
- **マナー**: robots.txt を必ずチェック、同一ホストへのリクエストは 5 秒間隔、User-Agent 明示
- 書き込み: サービスアカウント + Sheets API。シートは「生データ」「日次サマリ」の2枚構成
- 差分検知: 前回値と比較して閾値超の変動があれば Discord Webhook に通知

*(targets.yaml スキーマ・GitHub Actions 定義・エラー時リトライ設計は購入後に全文が読めます)*
