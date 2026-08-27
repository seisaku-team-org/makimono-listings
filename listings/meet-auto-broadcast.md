---
slug: meet-auto-broadcast
title: "Google Meet 自動参加&動画配信Bot 開発指示書"
summary: "指定した時刻に Google Meet へ自動参加し、動画を再生しながら画面共有する Bot を、Claude Code に一発で作らせる開発指示 MD。朝会の定例動画配信・ウェビナーの自動放送に。"
category: "業務自動化"
tags: ["Google Meet", "Playwright", "自動化", "Node.js", "スケジューラ"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "1.2.0"
createdAt: "2026-07-01"
updatedAt: "2026-07-10"
scratchTokens: 920000
withMdTokens: 88000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code", "cursor", "codex-cli"]
license: "CC BY 4.0"
featured: true
---

# Google Meet 自動参加 & 動画配信 Bot — 開発指示書

> **この MD ファイルの使い方**: Claude Code のプロジェクトフォルダに `CLAUDE.md` として保存するか、
> `claude "この指示書どおりに実装して: ./meet-auto-broadcast.md"` と渡すだけ。
> 要件定義・技術選定・ハマりどころの調査をすべてスキップして、実装だけにトークンを使えます。

## 1. 作るもの

指定した時刻に Google Meet の会議 URL へ自動参加し、指定した動画ファイルを再生しながら
「タブの画面共有」で配信する Bot。用途は自分が主催する定例会議での案内動画の自動放送
(朝会のオープニング動画、社内ウェビナーの録画再放送など)。

**⚠ 利用上の注意 (READMEに必ず記載すること)**: 本 Bot は自分が主催者、または主催者の許可を得た
会議でのみ使用する。出席偽装の用途には使用しない。

## 2. 技術スタック (選定済み — 再調査しないこと)

| 項目 | 採用 | 理由 (調査済みなので再検証不要) |
|---|---|---|
| ブラウザ自動化 | **Playwright (Chromium, headful)** | Meet は headless を検出して弾く。`headless: false` + Xvfb (Linux) or 通常デスクトップ (Win) で動かす |
| Meet への参加 | ゲスト参加 (名前入力) を第一経路 | Google ログイン自動化は 2FA とボット検出で不安定。会議側を「全員参加可」に設定する運用が最も堅牢 |
| 動画再生 | ローカル HTTP サーバで video タグ配信 → そのタブを共有 | ファイル直接再生よりタブ共有 (音声込み) が安定 |
| 画面共有 | `--auto-select-tab-capture-source-by-title` フラグ | getDisplayMedia のピッカー UI を自動選択できる唯一の安定手段 |
| スケジューラ | node-cron | Windows なら taskschd 登録スクリプトも生成する |

## 3. 実装手順

### 3.1 プロジェクト構成

```
meet-broadcast-bot/
├── package.json          # playwright, node-cron, express
├── config.json           # meetUrl, videoPath, joinAt (ISO8601), displayName
├── src/
│   ├── index.js          # エントリ: cron 登録 or 即時実行 (--now)
│   ├── broadcaster.js    # Meet 参加〜画面共有のコア
│   └── videoServer.js    # localhost:34567 で video.html を配信
└── README.md
```

### 3.2 コアフロー (broadcaster.js)

1. `videoServer.js` を起動 — `<video autoplay controls src="/media">` を含む `video.html` を返す。タイトルタグは `BROADCAST_SOURCE` 固定 (画面共有の自動選択に使う)
2. Chromium を以下の引数で起動:
   ```js
   const browser = await chromium.launch({
     headless: false,
     args: [
       '--use-fake-ui-for-media-stream',            // カメラ/マイク許可ダイアログをスキップ
       '--auto-select-tab-capture-source-by-title=BROADCAST_SOURCE',
       '--autoplay-policy=no-user-gesture-required',
     ],
   });
   ```
3. タブ A で `video.html` を開く (まだ play しない)
4. タブ B で `config.meetUrl` を開く
5. 参加前画面: マイク/カメラを OFF (`getByRole('button', { name: /マイクをオフ|Turn off mic/ })`)。名前入力欄が出たら `displayName` を入力
6. 「今すぐ参加」or「参加をリクエスト」をクリック。リクエスト制の場合は主催者承認待ちを最大 120 秒ポーリング
7. 入室確認後: 「画面を共有」→「タブ」を選択 → フラグにより `BROADCAST_SOURCE` タブが自動選択される → 「共有」
8. タブ A に `page.evaluate(() => document.querySelector('video').play())` で再生開始
9. 動画の `ended` イベントを待つ → 共有停止 → 退出 → ブラウザ終了

### 3.3 ハマりどころ (調査済み — この通り実装すれば回避できる)

- **Meet の DOM は多言語**: ボタン検索は必ず `name: /日本語|English/` の正規表現で両対応にする
- **「参加をリクエスト」制の会議**: 主催者が承認するまで DOM が変わらない。`page.waitForSelector` は入室後にしか現れない「通話から退出」ボタン (`[aria-label*="通話から退出"], [aria-label*="Leave call"]`) を対象にする
- **タブ共有で音声を流す**: 共有ダイアログの「タブの音声も共有する」チェックはデフォルト ON だが、OFF になっている場合に備えて `getByRole('checkbox')` を確認して ON にする
- **Meet が「このブラウザは安全でない」と表示する場合**: `channel: 'chrome'` で本物の Chrome を使うと解消する (Chromium ビルドだと稀に出る)
- **退出漏れ防止**: `process.on('SIGINT')` とタイムアウト (動画長 + 5分) の両方で必ず退出処理を呼ぶ

### 3.4 スケジューラ (index.js)

- `node src/index.js --now` : 即時実行 (動作確認用)
- `node src/index.js` : config.json の `joinAt` を node-cron に登録して常駐
- Windows 用に `scripts/register-task.ps1` (schtasks 登録) も生成する

## 4. 受け入れテスト (実装後に必ず実行)

1. `npm test` — videoServer が 200 を返す / config バリデーションのユニットテスト
2. `node src/index.js --now --dry-run` — Meet URL の代わりに about:blank で参加フローの直前まで走る
3. 実会議テスト: テスト用 Meet を自分で立てて `--now` 実行 → 入室・共有・再生・退出を目視確認

## 5. README に含めること

- セットアップ 3 ステップ (npm i / config.json 編集 / --now でテスト)
- 会議側の設定 (「全員参加可」推奨、リクエスト制の場合の承認手順)
- 利用上の注意 (§1 の注意書き)
