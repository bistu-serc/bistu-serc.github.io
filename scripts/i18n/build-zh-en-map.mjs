#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const OUT_JSON = path.join(DATA_DIR, "i18n", "zh-en-map.json");
const OUT_JS = path.join(ROOT, "js", "i18n-data-map.js");

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hasCJK(value) {
  return /[\u3400-\u9FFF]/.test(String(value || ""));
}

function parseCsv(content) {
  const source = String(content || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map((header) => normalizeText(header));
  return rows
    .slice(1)
    .filter((cols) => cols.some((col) => normalizeText(col) !== ""))
    .map((cols) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = typeof cols[index] === "undefined" ? "" : String(cols[index]);
      });
      return obj;
    });
}

function decodeCsvBuffer(buffer) {
  let utf8 = "";
  try {
    utf8 = new TextDecoder("utf-8").decode(buffer);
  } catch {
    utf8 = "";
  }
  if (utf8 && utf8.indexOf("\\uFFFD") === -1) {
    return utf8;
  }
  return new TextDecoder("gb18030").decode(buffer);
}

function readCsvAuto(filePath) {
  const buffer = fs.readFileSync(filePath);
  const text = decodeCsvBuffer(buffer);
  return parseCsv(text);
}

function collectStrings() {
  const set = new Set();

  const newsPath = path.join(DATA_DIR, "news.json");
  const news = JSON.parse(fs.readFileSync(newsPath, "utf8"));
  for (const item of news.news || []) {
    const title = normalizeText(item.title);
    if (hasCJK(title)) {
      set.add(title);
    }
    for (const block of item.content || []) {
      if (String(block.types || "").toLowerCase() !== "text") {
        continue;
      }
      const info = normalizeText(block.info);
      if (hasCJK(info)) {
        set.add(info);
      }
    }
  }

  const toolsPath = path.join(DATA_DIR, "tools.json");
  const tools = JSON.parse(fs.readFileSync(toolsPath, "utf8"));
  for (const group of tools.fuzzers || []) {
    const type = normalizeText(group.type);
    if (hasCJK(type)) {
      set.add(type);
    }
    for (const tool of group.tools || []) {
      const name = normalizeText(tool.name);
      const desc = normalizeText(tool.description);
      if (hasCJK(name)) {
        set.add(name);
      }
      if (hasCJK(desc)) {
        set.add(desc);
      }
    }
  }

  for (const row of readCsvAuto(path.join(DATA_DIR, "papers.csv"))) {
    for (const key of ["author", "introduction"]) {
      const value = normalizeText(row[key]);
      if (hasCJK(value)) {
        set.add(value);
      }
    }
  }

  for (const row of readCsvAuto(path.join(DATA_DIR, "patents.csv"))) {
    for (const key of ["author", "title"]) {
      const value = normalizeText(row[key]);
      if (hasCJK(value)) {
        set.add(value);
      }
    }
  }

  for (const row of readCsvAuto(path.join(DATA_DIR, "copyrights.csv"))) {
    for (const key of ["title"]) {
      const value = normalizeText(row[key]);
      if (hasCJK(value)) {
        set.add(value);
      }
    }
  }

  for (const row of readCsvAuto(path.join(DATA_DIR, "teachers.csv"))) {
    for (const key of ["name", "title", "direction", "introduction"]) {
      const value = normalizeText(row[key]);
      if (hasCJK(value)) {
        set.add(value);
      }
    }
  }

  for (const row of readCsvAuto(path.join(DATA_DIR, "students.csv"))) {
    for (const key of ["name", "direction", "destination", "introduction"]) {
      const value = normalizeText(row[key]);
      if (hasCJK(value)) {
        set.add(value);
      }
    }
  }

  return [...set].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function parseTranslateResult(payload) {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return "";
  }
  return payload[0]
    .map((segment) => (Array.isArray(segment) ? String(segment[0] || "") : ""))
    .join("")
    .trim();
}

async function translateZhToEn(text) {
  const q = encodeURIComponent(text);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${q}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });
  if (!response.ok) {
    throw new Error(`translate failed: ${response.status}`);
  }
  const json = await response.json();
  const translated = parseTranslateResult(json);
  return translated || "";
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readExistingMap() {
  if (!fs.existsSync(OUT_JSON)) {
    return {};
  }
  try {
    const data = JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
    if (data && typeof data === "object") {
      return data;
    }
  } catch (error) {
    // ignore broken cache and rebuild
  }
  return {};
}

function normalizeMap(input) {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) {
    const normalizedKey = normalizeText(key);
    const normalizedValue = normalizeText(value);
    if (!normalizedKey || !normalizedValue) {
      continue;
    }
    out[normalizedKey] = normalizedValue;
  }
  return out;
}

function applyManualOverrides(map) {
  const overrides = {
    "工具名称：": "Tool Name:",
    "工具介绍：": "Description:",
    "共 135 条记录": "135 records total",
    "共 0 条记录": "0 records total"
  };
  for (const [k, v] of Object.entries(overrides)) {
    map[k] = v;
  }
  return map;
}

async function main() {
  const strings = collectStrings();
  const existing = normalizeMap(readExistingMap());
  const result = { ...existing };

  let completed = 0;
  let translated = 0;

  for (const source of strings) {
    const key = normalizeText(source);
    if (!key) {
      completed += 1;
      continue;
    }
    if (result[key]) {
      completed += 1;
      continue;
    }

    try {
      const target = normalizeText(await translateZhToEn(key));
      if (target) {
        result[key] = target;
      }
      translated += 1;
    } catch (error) {
      console.error(`translate error for: ${key.slice(0, 40)}...`, error.message);
    }

    completed += 1;
    if (completed % 20 === 0 || completed === strings.length) {
      console.log(`progress ${completed}/${strings.length}`);
      ensureDir(OUT_JSON);
      fs.writeFileSync(OUT_JSON, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    }

    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  const finalMap = applyManualOverrides(normalizeMap(result));
  ensureDir(OUT_JSON);
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(finalMap, null, 2)}\n`, "utf8");

  const jsPayload =
    "/* Auto-generated by scripts/i18n/build-zh-en-map.mjs */\n" +
    "window.SERC_ZH_EN_MAP = Object.freeze(" + JSON.stringify(finalMap) + ");\n";
  fs.writeFileSync(OUT_JS, jsPayload, "utf8");

  console.log(`done: ${Object.keys(finalMap).length} entries, newly translated ${translated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
