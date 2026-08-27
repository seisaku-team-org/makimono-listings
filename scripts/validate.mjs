#!/usr/bin/env node
/**
 * 出品MDの検証。PR で自動実行される。
 * 依存パッケージゼロ (npm install 不要 = CI が速く、サプライチェーンも増やさない)。
 *
 *   node scripts/validate.mjs            listings/ 配下を全部検証
 *   node scripts/validate.mjs a.md b.md  指定ファイルだけ検証
 */
import fs from "node:fs";
import path from "node:path";

const REQUIRED = ["slug", "title", "summary", "category", "author", "scratchTokens", "withMdTokens"];
const NUMERIC = ["price", "scratchTokens", "withMdTokens"];

// 秘密値の混入検知。出品MDは公開されるので、ここで確実に止める。
const SECRET_PATTERNS = [
  [/\bsk-[A-Za-z0-9_-]{16,}\b/, "OpenAI形式のAPIキー"],
  [/\bsk-ant-[A-Za-z0-9_-]{16,}\b/, "Anthropic APIキー"],
  [/\bAIza[0-9A-Za-z_-]{30,}\b/, "Google APIキー"],
  [/\bghp_[A-Za-z0-9]{30,}\b/, "GitHub Personal Access Token"],
  [/\bgithub_pat_[A-Za-z0-9_]{50,}\b/, "GitHub PAT"],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, "Slack トークン"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS アクセスキー"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "秘密鍵"],
  [/\bhttps:\/\/discord(app)?\.com\/api\/webhooks\/\d+\/[\w-]+/, "Discord Webhook URL"],
  [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/, "JWT"],
];

/** 依存なしの簡易 frontmatter パーサ (このスキーマに必要な範囲だけ) */
function parseFrontmatter(raw) {
  const text = raw.replace(/^﻿/, "");
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return null;
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2].trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      continue;
    }
    value = value.replace(/^["']|["']$/g, "");
    data[key] = value;
  }
  return { data, body: m[2] };
}

function validateFile(file) {
  const errors = [];
  const warnings = [];
  const raw = fs.readFileSync(file, "utf8");
  const parsed = parseFrontmatter(raw);
  if (!parsed) return { errors: ["先頭に `---` で囲んだ frontmatter がありません"], warnings };

  const { data, body } = parsed;
  for (const key of REQUIRED) {
    if (data[key] === undefined || data[key] === "") errors.push(`必須項目がありません: ${key}`);
  }
  for (const key of NUMERIC) {
    if (data[key] !== undefined && !Number.isFinite(Number(data[key]))) {
      errors.push(`${key} は数値で書いてください (今: ${data[key]})`);
    }
  }

  const expectedSlug = path.basename(file, ".md");
  if (data.slug && data.slug !== expectedSlug) {
    errors.push(`slug (${data.slug}) とファイル名 (${expectedSlug}.md) を一致させてください`);
  }
  if (data.slug && !/^[a-z0-9][a-z0-9-]*$/.test(data.slug)) {
    errors.push(`slug は英小文字・数字・ハイフンのみにしてください: ${data.slug}`);
  }

  const scratch = Number(data.scratchTokens);
  const withMd = Number(data.withMdTokens);
  if (Number.isFinite(scratch) && Number.isFinite(withMd) && withMd >= scratch) {
    errors.push("withMdTokens は scratchTokens より小さい必要があります (節約にならないため)");
  }

  if (body.trim().length < 400) {
    errors.push("本文が短すぎます (400文字以上。手順として使える内容にしてください)");
  }
  if (!/^#\s/m.test(body)) warnings.push("本文に見出し (# ...) がありません");

  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(raw)) errors.push(`秘密情報が含まれている可能性があります: ${label}。伏せ字にしてください`);
  }

  // 社内固有情報の混入 (一般化されていない出品を弾く)
  // Windowsパス区切りはソースに直接書くとエスケープ事故を起こすので組み立てる
  const BS = String.fromCharCode(92);
  const localPathPatterns = [
    new RegExp("[A-Za-z]:" + BS + BS + "Users" + BS + BS),
    /\/Users\/[a-z0-9._-]+\//i,
    /\/home\/[a-z0-9._-]+\//i,
  ];
  for (const re of localPathPatterns) {
    if (re.test(raw)) warnings.push("ローカルの絶対パスが含まれています。一般化してください");
  }

  return { errors, warnings };
}

const args = process.argv.slice(2);
const files = args.length
  ? args
  : fs.existsSync("listings")
    ? fs.readdirSync("listings").filter((f) => f.endsWith(".md")).map((f) => path.join("listings", f))
    : [];

if (!files.length) {
  console.log("検証対象のMDがありません。");
  process.exit(0);
}

let failed = 0;
for (const file of files) {
  const { errors, warnings } = validateFile(file);
  if (errors.length) {
    failed++;
    console.log(`\n❌ ${file}`);
    for (const e of errors) console.log(`   - ${e}`);
  } else {
    console.log(`✅ ${file}`);
  }
  for (const w of warnings) console.log(`   ⚠ ${w}`);
}

if (failed) {
  console.log(`\n${failed} 件のMDに修正が必要です。上の指摘を直して push してください。`);
  process.exit(1);
}
console.log(`\n${files.length} 件すべて OK。`);
