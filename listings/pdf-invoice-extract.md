---
slug: pdf-invoice-extract
title: "請求書PDF→会計CSV 自動変換パイプラインMD"
summary: "メール添付やフォルダ投込みの請求書PDFから金額・日付・取引先を抽出し、会計ソフト取込用CSVに変換するパイプラインを AI に作らせる指示書。Claude API の構造化抽出プロンプト込み。"
category: "経理・バックオフィス"
tags: ["PDF", "OCR", "経理", "freee", "会計", "Claude API"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "2.2.0"
createdAt: "2026-06-05"
updatedAt: "2026-07-06"
scratchTokens: 680000
withMdTokens: 76000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code"]
license: "商用利用可 (再販不可)"
featured: false
---

# 請求書 PDF → 会計 CSV 自動変換パイプライン MD

## 作るもの

1. 監視フォルダ (または Gmail の特定ラベル) に届いた請求書 PDF を検知
2. Claude API (Haiku) で金額・発行日・支払期日・取引先・品目を構造化抽出
3. 会計ソフト (freee / マネーフォワード) の取込 CSV 形式に変換して出力
4. 抽出信頼度が低いものは「要確認」フォルダに隔離して Discord 通知

## 抽出品質のための設計 (検証済み)

- モデルは Haiku で十分 (抽出タスクは Sonnet と同等品質・単価1/3)
- 金額は「税込/税抜/消費税額」の3値を必ず分離して抽出、合計整合チェックを機械側で行う
- 和暦・全角数字・「〆」などの表記ゆれ正規化テーブル同梱

*(抽出プロンプト全文・CSV マッピング表・検収テスト用サンプルPDF 10種は購入後に読めます)*
