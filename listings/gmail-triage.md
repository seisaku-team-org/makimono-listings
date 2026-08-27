---
slug: gmail-triage
title: "Gmail 自動仕分け&返信ドラフト生成MD"
summary: "受信メールを AI が分類 (要返信/情報/営業/スパム) してラベル付けし、要返信メールには返信ドラフトまで自動生成する仕組みを作らせる指示書。DWD (ドメイン全体委任) 設定手順込み。"
category: "業務自動化"
tags: ["Gmail", "メール", "自動仕分け", "Claude API", "DWD"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "1.5.0"
createdAt: "2026-05-20"
updatedAt: "2026-07-01"
scratchTokens: 470000
withMdTokens: 58000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code"]
license: "CC BY 4.0"
featured: false
---

# Gmail 自動仕分け & 返信ドラフト生成 MD

## 作るもの

15分おきに未処理メールを取得し、AI で分類してラベル付け。「要返信」と判定したメールは
文脈を踏まえた返信ドラフトを Gmail の下書きに自動生成する。送信は必ず人間が行う設計。

## コスト設計 (重要)

- 分類は Haiku (入力$1/MTok) — 1通あたり約0.1円
- 返信ドラフト生成のみ Sonnet — 読む人がいる文章だけ上位モデルを使う
- 連続処理ループでは system prompt に prompt caching を効かせて入力コストを約1/10に

## 認証設計

- Workspace 環境: サービスアカウント + ドメイン全体委任 (DWD) — OAuth 画面の作り込み不要
- 個人 Gmail: OAuth リフレッシュトークン方式の手順も併記

## 含まれるもの

- 分類プロンプト (カテゴリ定義・誤分類しやすい境界例つき)
- DWD 設定の管理者向け手順 (スコープ完全表記)
- 誤送信ゼロ設計 (ドラフト生成のみ・自動送信コードを書かない規約)
