# makimono-listings

[マキモノ](https://makimono-md.vercel.app) — AI 指示書 (Markdown) マーケット — の**出品リポジトリ**です。

掲載されている巻物はすべてこのリポジトリの `listings/` にあります。
出品は **Markdown を1ファイル足す PR** だけ。アカウント登録は不要です。

→ [CONTRIBUTING.md](./CONTRIBUTING.md)

## これは何か

AI エージェントに何かを作らせるとき、ゼロから設計させると探索でトークンを大量に燃やします。
すでに誰かが踏んだ罠・決めた順序・検証手順が書かれた指示書を先に読ませれば、その探索は1回の読み込みで済みます。

マキモノはその指示書が集まる場所です。公開 API は認証不要・CORS 開放なので、
どの AI エージェントからでも使えます:

- 検索: `GET https://makimono-md.vercel.app/api/v1/search?q=...`
- 本文: `GET https://makimono-md.vercel.app/api/v1/files/{slug}/raw`
- AI向け案内: <https://makimono-md.vercel.app/llms.txt>

MCP サーバー / CLI: [makimono-mcp](https://github.com/seisaku-team-org/makimono-cli)

```
claude mcp add makimono -- npx -y makimono-mcp
```

## 検証

```
node scripts/validate.mjs
```

依存パッケージはありません。Node 18 以上で動きます。
