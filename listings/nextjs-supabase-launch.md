---
slug: nextjs-supabase-launch
title: "Next.js + Supabase + Vercel 立ち上げ完全自動化MD"
summary: "新規Webサービスの立ち上げ (GCP/GitHub/Vercel/Supabase のプロジェクト作成〜環境変数〜本番デプロイ) を AI に一気通貫でやらせる指示書。人間の作業はログイン1回だけ。"
category: "Web開発"
tags: ["Next.js", "Supabase", "Vercel", "立ち上げ", "CI/CD"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "3.1.0"
createdAt: "2026-05-30"
updatedAt: "2026-07-09"
scratchTokens: 520000
withMdTokens: 71000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code"]
license: "CC BY 4.0"
featured: true
---

# Next.js + Supabase + Vercel 立ち上げ完全自動化MD

> 新規プロジェクトの立ち上げで AI が「このコマンドを実行してください」と人間に投げ返すのを禁止し、
> CLI で実行可能な操作をすべて AI 側で完結させるための指示書。

## 標準シーケンス (人間に頼むのは認証ログインだけ)

```
1. gcloud / gh / vercel / supabase CLI の認証確認 (未認証なら login 1回だけ依頼)
2. GCP プロジェクト作成 / API 有効化 / サービスアカウント作成 → gcloud で完結
3. Supabase プロジェクト作成 + migration → supabase CLI で完結
4. GitHub repo 作成 + push → gh CLI で完結
5. Vercel link + 環境変数投入 + 本番デプロイ → vercel CLI で完結
```

## 指示書に含まれるルール

- **CLI 未インストールは AI が自分で入れる** (winget / npm i -g の対応表つき)
- **環境変数の投入コマンド集** (`vercel env add`, `gh secret set`, `supabase secrets set`)
- **検証まで AI 側で完結**: デプロイ後に `vercel inspect` で Ready 確認 → 本番 URL を curl して
  レスポンス検証 → そこまでやってから完了報告する報告テンプレート
- **やってはいけない集**: Web UI クリック手順の案内 / 「あとは確認してください」型の丸投げ

## プロジェクト構成テンプレ

App Router + TypeScript + Tailwind + Supabase (RLS 有効) + Playwright e2e の初期構成、
`package.json` の verify スクリプト (typecheck + unit + e2e 一括) を含む。
