---
slug: discord-survey
title: "Discordで社内アンケート送信→回答回収→報告"
summary: "メンバーマスタから user_id を引き、Discord のチームチャンネルにメンション付きで質問を投稿、リアクション/返信で回答を回収、SessionStart フックで追跡を再開し、揃ったらオーナーに集計報告する秘書スキル。YesNo/選択肢/自由記述の3形式に対応。"
category: "業務自動化"
tags: ["Discord", "アンケート", "集計", "業務自動化", "Bot"]
author: "オージャスト公式"
authorType: "verified"
price: 0
version: "1.0.0"
createdAt: "2026-07-14"
updatedAt: "2026-07-14"
scratchTokens: 130000
withMdTokens: 16000
downloads: 0
rating: 0
reviewCount: 0
aiCompat: ["claude-code", "cursor"]
license: "商用利用可 (再販不可)"
featured: false
---

---
name: secretary-ask
description: メンバーに Discord でメッセージを送って回答を回収する秘書スキル。「○○に△△を聞いて」「みんなに□□確認して」「全員に〜聞いて回答もらって」「アンケート取って」「責任者に確認して」などスタッフへの問いかけ・回答収集依頼が来たら必ずこの手順を使う。送信先はチームチャンネル、回答が揃ったらオーナーに Discord DM で報告する。
---

# 秘書スキル: メンバーに質問→回答回収

チームのメンバーに Discord でメンション付きメッセージを送り、回答を回収してオーナーに報告するスキル。

## 基本フロー
1. **メンバー特定** — 苗字を受け取ってメンバーマスタ Sheet から user_id を引く
2. **質問送信** — チームチャンネルに mention 付きメッセージを投稿。回答形式に応じて絵文字リアクション or 自由返信で受け取る
3. **進行状態を保存** — 進行中アンケート Sheet に poll_id, message_id, 対象 user_ids, 期限を記録
4. **追跡** — 期限まで定期的にリアクション/返信を取得、未回答者には Discord 再メンション
5. **オーナーに報告** — 全員回答 or 期限到達で通知チャンネルに集計を投稿、オーナーにメンション

## 重要 ID とリソース（すべて環境ごとに設定）
| 項目 | 値 |
|---|---|
| チームチャンネル ID | `<TEAM_CHANNEL_ID>` |
| 通知（オーナー宛）チャンネル ID | `<NOTIFY_CHANNEL_ID>` |
| オーナー Discord user ID | ローカルファイルから取得（`<OWNER_ID_FILE>`） |
| Bot トークン | ローカルファイルから取得（`<BOT_TOKEN_FILE>`。コード/コマンドに直書きしない） |
| Bot 名 | `<BOT_NAME>` |
| Guild ID | `<GUILD_ID>` |
| メンバーマスタ Sheet | `<MEMBER_MASTER_SHEET_ID>`（表示名 → user_id） |
| 進行中アンケート Sheet | `<POLL_STATE_SHEET_ID>` |
| Bot 必要権限 | View / Send / ReadHistory / AddReactions（channel overwrite 経由） |

## メンバー特定の手順（苗字→user_id）
1. ユーザーは苗字または表示名の一部で指定する。実在メンバーは**メンバーマスタ Sheet の表示名列で管理**（氏名はスキル本文にハードコードしない）
2. メンバーマスタ Sheet を読む
3. **表示名列に対して前方一致 + 部分一致**（例: 「ふる」→「古川…」のように前方一致で解決）
4. 該当が複数なら候補を出してオーナーに確認、ゼロなら「該当なし、メンバーマスタに追加が必要」と返す
5. 「全員」「みんな」と言われた場合は表示名列の全行
6. **user_id が `LOOKUP_FAIL` または空** のメンバーは送信不可。オーナーに user_id 直接入力を依頼するか、Discord member search API を再試行する

## Discord 投稿 (PowerShell)
bot はチームチャンネルに View/Send/AddReactions/ReadHistory が必要。403 Missing Access が返ったらオーナーに「Bot の channel permission が外れた可能性」と直リンク付きで報告して止まる。

```powershell
$token = (Get-Content "<BOT_TOKEN_FILE>" -Raw).Trim()
$channel = '<TEAM_CHANNEL_ID>'
$mentions = '<@USER_ID_1> <@USER_ID_2>'
$body = @{
  content = "$mentions`n【依頼】$question`n👍=Yes / 👎=No / ❓=要相談 でリアクションしてください。"
  allowed_mentions = @{ users = @('USER_ID_1','USER_ID_2') }
} | ConvertTo-Json -Depth 5 -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
$resp = Invoke-RestMethod -Uri "https://discord.com/api/v10/channels/$channel/messages" `
  -Method Post `
  -Headers @{'Authorization'="Bot $token"; 'Content-Type'='application/json; charset=utf-8'; 'User-Agent'='DiscordBot (secretary-app, 0.1.0)'} `
  -Body $bytes
$messageId = $resp.id  # ← これを「進行中アンケート」Sheet に保存
```
User-Agent ヘッダは必須。

## 回答形式と受け取り方法
| 形式 | 送信時 | 回答方法 | 取得方法 |
|---|---|---|---|
| YesNo | 本文末に「👍=Yes / 👎=No / ❓=要相談」 | リアクション | `GET /channels/{ch}/messages/{msg}/reactions/{emoji}` |
| 選択肢 (2-5) | 本文に①②③④⑤＋対応 emoji 1️⃣–5️⃣ | リアクション | 同上 |
| 自由記述 | 本文末に「このメッセージに返信してください」 | message reply | `GET /channels/{ch}/messages?around={msg}` で referenced_message_id が一致するもの抽出 |

絵文字リアクションを先回り投稿（bot 自身が押す）すると回答ボタンが先に並んで親切。`PUT /channels/{ch}/messages/{msg}/reactions/{emoji}/@me`

## 状態保存（進行中アンケート）
新規 poll を起こすたびに以下を記録:
```
poll_id: 8桁の uuid 先頭
作成日時: ISO8601
channel_id: <TEAM_CHANNEL_ID>
message_id: Discord 返ってきた id
質問: そのまま
回答形式: YesNo / 選択肢 / 自由記述
対象user_ids: カンマ区切り
期限: ISO8601（指定なければ 24h 後）
ステータス: pending / collecting / completed / timeout
集計結果: 完了時に書き込む JSON ライク文字列
オーナー報告日時: 最終報告時刻
```
Sheet 直接書き換えができないコネクタでは、ローカル JSON（`~/.claude/secretary-state/polls.json`）に保存する運用でよい。

### 自動再開フック
SessionStart hook（`~/.claude/hooks/secretary-poll-resume.ps1` 等）として登録し、起動のたび polls.json をスキャンして `status='pending'` or `'collecting'` の poll があれば「再開して」と additionalContext で指示する。これで PC を一晩落とした後でも次の起動で追跡が継続する。保存時は状態に応じ `pending`/`collecting`/`completed`/`timeout` を必ず付ける。

## 追跡（チェック処理）
1. polls.json を読み、`pending` / `collecting` をループ
2. 各 poll:
   - リアクション形式: 絵文字ごとに `GET .../reactions/{emoji}?limit=100`
   - 返信形式: `GET .../messages?after={msg}&limit=50` から `referenced_message.id == msg` を抽出
3. 期待 user_id が揃ったか判定
4. 未回答者がいて期限内なら再メンション（同スレッドに reply）。回数制限: 1日2回まで（朝/夕）
5. 全員回答 OR 期限到達で `completed` / `timeout` にし、オーナーに DM 通知

## オーナーへの報告
通知チャンネルにオーナーメンション付きで投稿:
```
<@OWNER_USER_ID>
【アンケート集計完了】
質問: 〇〇〇〇
締切: 2026-05-31 18:00

✅ メンバーA: 👍 Yes
✅ メンバーB: 👍 Yes
✅ メンバーC: 👎 No（「来週なら可」と返信）
⏰ メンバーD: 未回答（期限切れ）
✅ メンバーE: ❓ 要相談

回答率: 4/5 (80%)
```
webhook を使う場合も allowed_mentions の users 配列にオーナー user_id を指定する（`<DISCORD_WEBHOOK_URL>` は環境ごとに設定）。

## やってはいけない
- メンバーマスタに無い人を勝手に user_id 推測して送らない
- bot がチームチャンネルに access できない（403）状態で投稿を強行しない（必ず先に権限付与を依頼）
- 個人攻撃や評価依頼など、メンション送信者として不適切な質問はそのまま投げずオーナーに確認
- 1日3回以上の再メンション（スパムになる）
