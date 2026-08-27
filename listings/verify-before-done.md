---
slug: verify-before-done
title: "デプロイ/UI変更を必ず2段検証してから完了報告"
summary: "コード・デプロイ・cron・env・UI変更後に、ロジック層(Node再現)とブラウザ層(Playwright)の2段でassert検証し、検証済みだけを完了報告させる手順。「画面で確認して」の丸投げを禁止。"
category: "開発プロセス"
tags: ["開発プロセス", "検証", "e2e", "品質保証", "CLAUDE.md"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "1.0.0"
createdAt: "2026-07-14"
updatedAt: "2026-07-14"
scratchTokens: 90000
withMdTokens: 12000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code", "cursor"]
license: "商用利用可 (再販不可)"
featured: false
---

---
name: deploy-verify
description: コード変更・デプロイ・cron・env・UI 変更後に AI 側で検証まで完結させる2段検証手順。「デプロイして」「修正して反映」「直して」など変更を伴うタスクの完了報告前、および「テストして」「動作確認して」と言われたら必ずこの手順を使う。「画面で確認してください」と人間に丸投げするのは禁止。
---

# 実行→検証→完了報告を AI 側で完結（2段検証）

完了報告は **assert OK 後だけ**。「次回 cron で確認できます」「ハードリロードして試して」は未完了 todo。

## 強制発火→結果取得の対応表
| 動かしたもの | 強制発火 | 結果取得 |
|---|---|---|
| Vercel デプロイ | `vercel --prod` → `vercel inspect <url>` で Ready | `vercel logs` / endpoint curl |
| Vercel cron | URL curl + `?token=<CRON_SECRET>` or Bearer | response JSON |
| GitHub Actions | `gh workflow run` → `gh run watch` | `gh run view --log` |
| GAS 関数 | コマンドキュー / `clasp run` | Drive で result / 対象シート read-back |
| Supabase 変更 | service_role で select | rowCount + 値 assert |

## UI 変更の2段検証（全プロジェクト必須）
- **Layer 1（ロジック層）**: `scripts/test-*.ts` で server fetch + client filter を Node で完全再現し期待値 assert。frontend の pure ロジックも Node test に extract（「browser でしか検証できない」は嘘）
- **Layer 2（ブラウザ層）**: Playwright e2e で production を実描画 assert（auth-bypass: test user の session を storage state に注入）。新規プロジェクトは `pnpm add -D @playwright/test` + `e2e/auth.setup.ts` を初回に仕込む

## 頻出の罠
- Supabase REST は **row cap 1000**: 結果 length がちょうど 1000 なら `.range()` pagination 化
- GAS/Sheets 書き込みの silent ignore（merge 非 top-left 等）→ **read-back verify 必須**
- Vercel Sensitive env は `vercel env pull` で空文字 → その env を使う経路側から発火
- Vercel Hobby cron は best-effort で発火しないことがある → GHA cron か self-heal で担保

## 報告テンプレ（Layer 1/2 が空の報告は完了と見なさない）
```
- 実装: <変更内容 1 行>
- typecheck: PASS ✅
- Layer 1: <script 名> → PASS ✅
- Layer 2: <spec 名> → e2e N passed ✅
- deploy: <commit hash> Vercel Ready ✅
```

例外: UI 入力必須の関数（人間の実行後に DB/Drive 読みで検証に切替）/ 第三者システムへの副作用（無断発火禁止）/ LLM 出力の質的判定（構造 assert まで）。
